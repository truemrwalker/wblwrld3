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
var GitHubStrategy = require('passport-github').Strategy;

var util = require('../../lib/util');

module.exports = function(app, config, gettext, passport, User, doneAuth) {

	var authError = new Error("GitHub Auth Error", "auth-github.js");

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function mergeGithubProfile(user, accessToken, refreshToken, profile) {

	}

	////////////////////////////////////////////////////////////////////
	
	if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET)
		return; // console.log("Auth: Github is not configured and so it will be disabled");

	////////////////////////////////////////////////////////////////////
	// Setup strategy
	//
	passport.use(new GitHubStrategy({
		clientID: config.GITHUB_CLIENT_ID,
		clientSecret: config.GITHUB_CLIENT_SECRET,
		callbackURL: config.SERVER_URL_PUBLIC + '/auth/github/callback'
	}, function (accessToken, refreshToken, profile, done) {
		
		User.findOne({ "_auth.github.id": profile.id }, function (err, user) {
			
			if (err)
				done(err);
			else
				done(null, user, { accessToken: accessToken, refreshToken: refreshToken, profile: profile });
		});

	}));

	////////////////////////////////////////////////////////////////////
	// Redirect the user to GitHub for authentication.  When complete, GitHub
	// will redirect the user back to the application at "callbackURL"
	//
	app.get('/auth/github', passport.authenticate('github'));

	// GitHub will redirect the user to this URL after authentication
	//
	app.get('/auth/github/callback', function (req, res) {

		passport.authenticate('github', function(err, user, info) {

			if (err)
				doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
			else if (!info || !info.profile)
				doneAuth(authError, req, res, info && info.message ? info.message : gettext("Could not authenticate"));
			else if (req.user) { //---> Just connect account with current one
				
				// 'user' may be whatever since we may be updating/refreshing the token
				mergeGithubProfile(req.user, info.accessToken, info.refreshToken, info.profile);
				req.user.save(function(err) {

					if (err)
						doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
					else
						doneAuth(null, req, res, req.user, true);
				});
			}
			//else if (!user) { //---> Register & login

			//	var emails = util.transform(info.profile.emails, function (m) { return m.value; });

			//	User.findOne({ email: { $in: emails } }, function(err, user) {

			//		if (err)
			//			doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
			//		else {
			//			var newUser = user || new User();
			//			mergeGithubProfile(newUser, info.accessToken, info.refreshToken, info.profile);

			//			newUser.save(function(err) {

			//				if (err)
			//					doneAuth(err, req, res, gettext("There's some error at our server - please try again later"));
			//				else
			//					doneAuth(null, req, res, newUser);
			//			});
			//		}
			//	});
			//}
			else //---> Just login
				doneAuth(null, req, res, user);

		})(req, res);
	});
};
