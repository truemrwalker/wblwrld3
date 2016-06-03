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
// facebook.js
// Created by Giannis Georgalis on 10/30/13
//
var Promise = require("bluebird");
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(app, config, gettext, passport, User, doneAuth) {

	var authError = new Error("Facebook Auth Error", "auth-facebook.js");

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function mergeFacebookProfile(user, token, refresh, profile) {

		user.name.first = user.name.first || profile.name.givenName;
		user.name.last = user.name.last || profile.name.familyName;

		user.gender = profile.gender;

		var currEmail = profile.username + '@facebook.com';
		if (!user.email || user.email[0] == '@')
			user.email = currEmail;
		if (currEmail != user.email && user.email_alts.indexOf(currEmail) == -1)
			user.email_alts.push(currEmail);

		if (user.website_urls.indexOf(profile.profileUrl) == -1)
			user.website_urls.push(profile.profileUrl);

		user._auth.providers.push('facebook');

		user._auth.facebook.id = profile.id;
		user._auth.facebook.username = profile.username;
		user._auth.facebook.token = token;
		user._auth.facebook.refresh = refresh;
	}

	////////////////////////////////////////////////////////////////////
	// Sayonara, if not configured
	//
	if (!config.FACEBOOK_APP_ID || !config.FACEBOOK_APP_SECRET)
		return console.log("Auth: Facebook login is not configured and so it will be disabled");

	////////////////////////////////////////////////////////////////////
	// Setup strategy
	//
	passport.use(new FacebookStrategy({
			clientID: config.FACEBOOK_APP_ID,
			clientSecret: config.FACEBOOK_APP_SECRET,
			callbackURL: config.SERVER_URL_PUBLIC + '/auth/facebook/callback'
		},
		function(accessToken, refreshToken, profile, done) {

			User.findOne({ "_auth.facebook.id": profile.id }, function(err, user) {

				if (err)
					done(err);
				else
					done(null, user, { token: accessToken, refresh: refreshToken, profile: profile });
			});
		}
	));

	app.get('/auth/facebook', passport.authenticate('facebook'));

	app.get('/auth/facebook/callback', function(req, res) {

		passport.authenticate('facebook', function(err, user, info) {

			if (err)
				doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
			else if (!info || !info.profile)
				doneAuth(authError, req, res, info && info.message ? info.message : gettext("Could not authenticate"));
			else if (req.user) { //---> Just connect account with current one

				if (user) // WTF? -- it's probably already connected
					doneAuth(authError, req, res, gettext("Account is already connected to Facebook"));
				else {
					mergeFacebookProfile(req.user, info.token, info.refresh, info.profile);

					req.user.save(function(err) {

						if (err)
							doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
						else
							doneAuth(null, req, res, req.user, true);
					});
				}
			}
			else if (!user) { //---> Register & login

				User.findOne({ email: info.profile.username + '@facebook.com' }, function(err, user) {

					if (err)
						doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
					else {
						var newUser = user || new User();
						mergeFacebookProfile(newUser,  info.token, info.refresh, info.profile);

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
