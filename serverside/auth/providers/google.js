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
// google.js
// Created by Giannis Georgalis on 10/30/13
//
var Promise = require("bluebird");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var util = require('../../lib/util');

module.exports = function(app, config, gettext, passport, User, doneAuth) {

    var authError = new Error("Google Auth Error", "auth-google.js");

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
    function mergeGoogleProfile(user, accessToken, refreshToken, profile) {

        user.name.first = user.name.first || profile.name.givenName;
        user.name.last = user.name.last || profile.name.familyName;

	    if (profile.name.middleName && !user.name.middle)
	        user.name.middle = profile.name.middleName;

        if (!user.email || user.email[0] == '@') {

            if (profile.emails.length > 0 && profile.emails[0].value)
                user.email = profile.emails[0].value;
        }

        for (var i = 0; i < profile.emails.length; ++i) {
            var currEmail = profile.emails[i].value;
            if (currEmail != user.email && user.email_alts.indexOf(currEmail) == -1)
                user.email_alts.push(currEmail);
        }

	    // Other optional params
	    //
	    if (profile._json.verified_email)
	        user._sec.account_status = 'verified';

	    if (profile._json.link)
	        user.website_urls.push(profile._json.link);

	    if (profile._json.picture)
		    user.image_urls.push(profile._json.picture);

	    if (profile._json.gender)
		    user.gender = profile._json.gender;

	    if (profile._json.locale)
	        user.languages.push(profile._json.locale);

	    user._auth.providers.push('google');
        user._auth.google.id = profile.id;
	    user._auth.google.access_token = accessToken;
	    user._auth.google.refresh_token = refreshToken;
    }

	////////////////////////////////////////////////////////////////////
	// Sayonara, if not configured
	//
	if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET)
		return console.log("Auth: Google+ login is not configured and so it will be disabled");

    ////////////////////////////////////////////////////////////////////
    // Setup strategy
    //
    passport.use(new GoogleStrategy({
		    clientID: config.GOOGLE_CLIENT_ID,
		    clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: config.SERVER_URL_PUBLIC + '/auth/google/callback',
			scope: [
				'https://www.googleapis.com/auth/plus.me',
				'profile',
				'email'
			],
		    realm: config.SERVER_URL
        },
        function(accessToken, refreshToken, profile, done) {

            User.findOne({ "_auth.google.id": profile.id }, function(err, user) {

                if (err)
                    done(err);
                else
                    done(null, user, { accessToken: accessToken, refreshToken: refreshToken, profile: profile });
            });
        }
    ));

    ////////////////////////////////////////////////////////////////////
    // Redirect the user to Google for authentication.  When complete, Google
    // will redirect the user back to the application at "callbackURL"
    //
    app.get('/auth/google', passport.authenticate('google'));

    // Google will redirect the user to this URL after authentication.  Finish
    // the process by verifying the assertion.  If valid, the user will be
    // logged in.  Otherwise, authentication has failed.
    app.get('/auth/google/callback', function (req, res) {

        passport.authenticate('google', function(err, user, info) {

            if (err)
                doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
            else if (!info || !info.profile)
                doneAuth(authError, req, res, info && info.message ? info.message : gettext("Could not authenticate"));
            else if (req.user) { //---> Just connect account with current one

                if (user) // WTF? -- it's probably already connected
                    doneAuth(authError, req, res, gettext("Account is already connected to Google account"));
                else {
                    mergeGoogleProfile(req.user, info.accessToken, info.refreshToken, info.profile);

                    req.user.save(function(err) {

                        if (err)
                            doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
                        else
                            doneAuth(null, req, res, req.user, true);
                    });
                }
            }
            else if (!user) { //---> Register & login

                var emails = util.transform(info.profile.emails, function (m) { return m.value; });

                User.findOne({ email: { $in: emails } }, function(err, user) {

                    if (err)
                        doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
                    else {
                        var newUser = user || new User();
                        mergeGoogleProfile(newUser, info.accessToken, info.refreshToken, info.profile);

                        newUser.save(function(err) {

                            if (err)
                                doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
                            else
	                            doneAuth(null, req, res, newUser);
                        });
                    }
                });
            }
            else //---> Just login
	            doneAuth(null, req, res, user);

        })(req, res);
    });
};
