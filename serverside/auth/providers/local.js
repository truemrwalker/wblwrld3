//
// Webble World 3.0 (IntelligentPad system for the web)
//
// Copyright (c) 2010-2015 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka
//     in Meme Media R&D Group of Hokkaido University, Japan. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Additional restrictions may apply. See the LICENSE file for more information.
//

//
// local.js
// Created by Giannis Georgalis on 10/30/13
//
var LocalStrategy = require('passport-local').Strategy;

var nodemailer = require('nodemailer');
var nodemailerMailgun = require('nodemailer-mailgun-transport');

var util = require('../../lib/util');
var crypt = require('../../lib/crypt');
var gravatar = require('../../lib/gravatar');

module.exports = function(Q, app, config, gettext, passport, User, doneAuth) {

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
    function createUserIdHash(user) {
        return crypt.createHash(user._auth.local.hash.substring(5, 15) + user.email);
    }
	function createUserSearchObj(username) {
		return {$or: [{ email: username }, { username: username }]};
	}

    ////////////////////////////////////////////////////////////////////
    // Configure passport's behavior
    //
    passport.use(new LocalStrategy({
		    usernameField: 'email',
			passwordField: 'password'
	    }, function(username, password, done) {

            User.findOne(createUserSearchObj(username), function(err, user) {

                if (err)
                    done(err);
                else if (!user)
                    done(null, null, { message: gettext("Incorrect username") });
                else if (user._auth.providers.indexOf('local') == -1)
                    done(null, null, { message: gettext("You don't have a local account") });
                else {
                    user.checkPassword(password, function(err, matching) {

                        if (err)
                            done(err);
                        else if (!matching)
                            done(null, null, { message: gettext("Incorrect password") });
                        else
                            done(null, user);
                    });
                }
            });
        }
    ));

    ////////////////////////////////////////////////////////////////////
    // Login to account
    //
    app.post('/auth/local', function (req, res) {
        passport.authenticate('local', function (err, user, info) {

            if (err)
                doneAuth(err, req, res);
            else if (!user)
                doneAuth(new util.RestError(info.message), req, res);
            else
				doneAuth(null, req, res, user);

        })(req, res);
    });

    ////////////////////////////////////////////////////////////////////
    // Register new or update account
    //
    app.post('/auth/register', function (req, res) {

	    Q.fcall(function() {

		    // General Value Validity checks for provided values
		    //
		    if (req.body.name && (req.body.name.length < 5 || req.body.name.split(' ').length < 2))
			    throw new util.RestError(gettext("Please provide your full name"));

		    if (req.body.email && !util.isEmailValid(req.body.email))
			    throw new util.RestError(gettext("The email you provided is invalid"));

		    if (req.body.username && !util.isUsernameValid(req.body.username))
			    throw new util.RestError(gettext("The username you provided is invalid"));

		    if (req.body.password && req.body.password !== req.body.confirmPassword)
			    throw new util.RestError(gettext("Passwords don't match"));

		    if (req.body.password && (req.body.password.length < 5 || req.body.password.length > 60))
			    throw new util.RestError(gettext("Passwords have to be at least 5 and at most 60 characters long"));
	    })
		    .then(function () {

			    return [!req.body.email ? null :  Q.ninvoke(User, "findOne", { email: req.body.email }),
				    !req.body.username ? null : Q.ninvoke(User, "findOne", { username: req.body.username.toLowerCase() })];
		    })
		    .spread(function (userByEmail, userByUsername) {

			    var user = req.user;

			    if (user) {

				    if (userByEmail && userByEmail._id !== user._id)
			            throw new util.RestError(gettext("This email is already used at another account")); //, 401);

				    if (userByUsername && userByUsername._id !== user._id)
					    throw new util.RestError(gettext("This username is already taken")); //, 401);

				    // Update main user information
				    //
				    if (req.body.name && req.body.name.split(' ').length >= 2)
					    user.name.full = req.body.name;

				    if (req.body.username && util.isUsernameValid(req.body.username) && !user.username)
					    user.username = req.body.username;

				    if (req.body.email && util.isEmailValid(req.body.email) && req.body.email != user.email) {

					    if (user.email[0] != '@')
						    user.email_alts.push(user.email);

					    user.email = req.body.email;
				    }

				    if (user._auth.providers.indexOf('local') == -1)
					    user._auth.providers.push('local');
			    }
			    else {

				    // Validity checks for new accounts
				    //
				    if (userByEmail || userByUsername)
					    throw new util.RestError(gettext("Account already taken")); //, 401);

				    if (!req.body.name)
					    throw new util.RestError(gettext("Please provide your full name"));

				    if (!req.body.email)
					    throw new util.RestError(gettext("Please provide your email"));

				    if (!req.body.password)
					    throw new util.RestError(gettext("Please provide a password"));

				    // Go ahead and create new user
				    //
				    user =  new User();

				    user.name.full = req.body.name;
				    if (req.body.username && util.isUsernameValid(req.body.username))
					    user.username = req.body.username;
				    user.email = req.body.email;

				    user._auth.providers.push('local');
			    }

			    // Do not update these values even if they are available in the body of the request
			    //
			    delete req.body._sec;
			    delete req.body._auth;

			    delete req.body.name;
			    delete req.body.username;
			    delete req.body.email;

			    // Update any other relevant values
			    //
			    Object.keys(req.body).forEach(function(key) {

				    if (req.body[key] !== undefined) {

					    if (typeof req.body[key] === 'object') {

						    Object.keys(req.body[key]).forEach(function(subKey) {
								user[key][subKey] = req.body[key][subKey];
						    });
					    }
					    else
					        user[key] = req.body[key];
				    }
			    });

			    // Add a gravatar image if we don't have one util this point
			    //
			    if (user.image_urls.length === 0) {

				    user.image_urls.push(gravatar.url(user.email, {
							d: 'identicon',
						    s: 128
					    }, true // Fetch the image over https
				    ));
			    }

			    // Update Password if necessary
				//
			    return !req.body.password ? user :
				    Q.ninvoke(user, "setPassword", req.body.password);
		    })
		    .then (function (user) {

		        if (!user)
			        throw new util.RestError(gettext("Could not set password"));

		        return Q.ninvoke(user, "save").then(function () {
			        doneAuth(null, req, res, user); // Everything's peachy...
		        });
	        })
		    .fail(function (err) {

			    err = util.toRestError(err, gettext("Cannot register user"));
				doneAuth(err, req, res);
		    })
		    .done();
    });

    ////////////////////////////////////////////////////////////////////
    // Create an autologin link to reset password
    //
    app.post('/auth/reset', function (req, res) {

        if (!util.isEmailValid(req.body.email))
            doneAuth(new util.RestError(gettext("The email is not valid")), req, res);
        else {

            User.findOne({ email: req.body.email }, function(err, user) {

                if (err)
                  res.status(500).send(gettext("Try again later"));
                else if (!user)
                  res.status(500).send(gettext("The email is not associated with any account"));
                else if (user._auth.providers.indexOf('local') == -1)
                  res.status(500).send(gettext("You have not created any password - please try connect using:") + ' ' + user._auth.providers[0]);
                else if (++user._auth.local.forgot > 4)
                  res.status(500).send(gettext("Password already sent - please check your spam folder"));
                else {

                    user.save(function (err) {

                        if (err)
                            doneAuth(err, req, res);
                        else {

                            var subject = req.body.subject || gettext("Reset Account Password Request");
                            var text = req.body.text || gettext("Follow the link to login and change your password:");

                            var smtpTransport = nodemailer.createTransport(nodemailerMailgun({
                                service: config.MAIL_SERVICE,
                                auth: { api_key: config.MAIL_KEY, domain: config.MAIL_DOMAIN }
                            }));

                            // Create auto-login link
                            var userIdHash = createUserIdHash(user);
                            var seed = config.APP_CRYPT_PASSWORD + userIdHash.substring(5, 15);
                            var resetUrl = config.SERVER_URL + '/auth/autologin/' + userIdHash + '/' + crypt.encryptText(user.email, seed);

                            smtpTransport.sendMail({
                                from: config.APP_EMAIL_ADDRESS,
                                to: req.body.email,
                                subject: config.APP_NAME + ': ' + subject,
                                text: text + '\n\n' + resetUrl

                            }, function(error, response) {

                                console.log('EMAIL RESPONSE FOR TARGET:', req.body.email, 'ERROR:', error, 'RESPONSE:', response);

                                if (error)
                                  res.status(500).send(gettext("Could not send email"));
                                else
                                  res.status(200).send(gettext("Reset successful - please check your emails")); // Finally OK

                                // Dispose the object - we don't need it anymore
                                smtpTransport.close();
                            });
                        }
                    });
                }
            });
        }
    });

    ////////////////////////////////////////////////////////////////////
    // Autologin if everything is OK - this function of course redirects
    //
    app.get('/auth/autologin/:id/:emailcrypted', function (req, res) {

        var seed = config.APP_CRYPT_PASSWORD + (req.params.id.length > 15 ? req.params.id.substring(5, 15) : req.params.id);

	    Q.ninvoke(User, "findOne", { email: crypt.decryptText(req.params.emailcrypted, seed) })
		    .then(function (user) {

			    if (!user || user._auth.local.forgot == 0 || createUserIdHash(user) !== req.params.id)
			        throw new Error();

			    return Q.ninvoke(req, "login", user)
				    .then(function() {
					    return crypt.randomBytes(32);
				    })
				    .then(function (buff) {
					    return Q.ninvoke(user, "setPassword", buff.toString('hex'));
				    })
				    .then(function(user) {
				        return Q.ninvoke(user, "save");
				    })
				    .then(function() {
				        res.redirect('/#/profile?tab=auth'); // Finally OK
				    });
		    })
		    .fail(function (e) {
			    res.redirect('/404.html');
		    })
		    .done();
    });
};
