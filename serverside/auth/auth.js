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
// auth.js
// Created by Giannis Georgalis on 10/30/13
//
var passport = require('passport');

var util = require('../lib/util');

module.exports = function(Q, app, config, mongoose, gettext) {

	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Inject the passport middleware
    //
    app.use(passport.initialize());
    app.use(passport.session());

	////////////////////////////////////////////////////////////////////
    // User serialization/de-serialization
    //
    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });

    passport.deserializeUser(function(email, done) {
        User.findOne({ email:email }, function(err, user) {
            done(err, user);
        });
    });

	////////////////////////////////////////////////////////////////////
	// Implement the final step of a successfull login/logout
	// Return a promise
	//
	function doLogin(err, req, user) {

		var deferred = Q.defer();

		if (err)
			deferred.reject(err);
    else if (!user._sec || !user._sec.account_status)
      deferred.reject(new util.RestError(gettext("Account incomplete"), 403));
		else if (user._sec.account_status === 'suspended')
			deferred.reject(new util.RestError(gettext("Account suspended"), 403));
		else if (user._sec.account_status === 'deleted')
			deferred.reject(new util.RestError(gettext("Account deleted"), 403));
		else if (req.user)
			deferred.resolve(user.getSafeProps());
		else {

			if (user._sec.account_status === 'inactive') {

				user._sec.account_status = 'ok';
				user.save(); // Don't need to wait for this to finish -- not so important
			}

			req.login(user, function(err){

				if (err)
					deferred.reject(new util.RestError(gettext("Please try again later")));
				else {

					if (req.body.rememberMe)
						req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

					app.emit('auth:login', req.sessionID, req.session);
					deferred.resolve(user.getSafeProps());
				}
			});
		}
		return deferred.promise;
	}

	//******************************************************************

	function doLogout(req) {

		if (!req.isAuthenticated())
			return Q.reject(new util.RestError(gettext("Not logged in")));

		req.logout(); // Installed by passport

		// Better save than destroy...
		//
		return Q.ninvoke(req.session, "save").then(function() {

//            req.session.destroy(function() {
//                res.clearCookie(config.SESSION_KEY, { path: '/' });
//                res.status(200).send(gettext("Successfully logged out"));
//            });

			app.emit('auth:logout', req.sessionID, req.session);
		});
	}

	////////////////////////////////////////////////////////////////////
    // Load the authorization plugins
    //
    function doneLocal (err, req, res, user) {

	    doLogin(err, req, user)
		    .then(function(userJson) {
		        res.json(userJson);
		    })
		    .fail(function(err) {
			    util.resSendError(res, err);
		    }).done();
    }

    function doneExternal(err, req, res, user) {

	    doLogin(err, req, user)
		    .fail(function(e) {
				console.log("AUTH ERROR:", e);
		    })
		    .finally(function() {

			    // Close the window (still under consideration) --
			    // This should be the standard negotiation protocol for the client-side reactions
			    //
			    res.send('<script>window.close();</script>');
		    }).done();
    }

    // Specific 'Login' authentication methods
    //
    require('./providers/local')(Q, app, config, gettext, passport, User, doneLocal);
    require('./providers/twitter')(Q, app, config, gettext, passport, User, doneExternal);
    require('./providers/facebook')(Q, app, config, gettext, passport, User, doneExternal);
    require('./providers/google')(Q, app, config, gettext, passport, User, doneExternal);

	////////////////////////////////////////////////////////////////////
    // User-specific functions
    //
    app.get('/auth/user', function (req, res) {

        if (req.isAuthenticated())
	        res.status(200).send(req.user.getSafeProps());
        else
            res.status(404).end();
    });

	//******************************************************************

	app.delete('/auth/user', function (req, res) {

		if (req.isAuthenticated()) {

			var user = req.user;

			user._sec.account_status = 'deleted';

			// Wipeout personal data
			//
			user.name.full = "Anonymous Coward";
			user.email_alts = [];
			user.languages = [];
			user.website_urls = [];
			user.image_urls = [];

			user.description = undefined;
			user.gender = undefined;
			user.date_born = undefined;

			user._sec.captains_log = [];

			// Auth methods
			//
			user._auth.providers = [];

			user._auth.twitter = {};
			user._auth.facebook = {};
			user._auth.google = {};

			delete user._auth.local.hash;
			delete user._auth.local.salt;

			// Save user and logout
			//
			Q.ninvoke(req.user, "save")
				.then(function() {
					return doLogout(req);
				})
				.then(function() {
					res.status(200).send(gettext("Successfully logged out"));
				})
				.fail(function(err) {
					util.resSendError(res, err);
				}).done();
		}
		else
			res.status(204).end(); // 204 (No Content) per RFC2616
	});

	////////////////////////////////////////////////////////////////////
    // 'Logout' logic
    //
    app.all('/auth/logout', function(req, res){

		doLogout(req)
			.then(function() {
				res.status(200).send(gettext("Successfully logged out"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			}).done();
    });

    // Define and return the auth directive whose fields conform to connect's middleware contract
    //
    return {

	    non: function(req, res, next) { // explicit no-auth policy
		    next();
	    },
		usr: function(req, res, next) {

	        if (!req.isAuthenticated())
	            res.status(401).end();
	        else
	            next();
	    },
	    dev: function(req, res, next) {

		    if (!req.isAuthenticated())
			    res.status(401).end();
		    else if (req.user._sec.role !== 'dev' && req.user._sec.role !== 'adm')
		        res.status(403).end(); // Forbidden
		    else
			    next();
	    },
	    adm: function(req, res, next) {

		    if (!req.isAuthenticated())
			    res.status(401).end();
		    else if (req.user._sec.role !== 'adm')
			    res.status(403).end(); // Forbidden
		    else
			    next();
	    }
    };
};
