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
// evernote.js
// Created by Giannis Georgalis on 10/30/13
//
// Load modules.
var Promise = require("bluebird");

////////////////////////////////////////////////////////////////////////
// Based on: https://github.com/jaredhanson/passport-evernote
// Process explained here: https://dev.evernote.com/doc/articles/authentication.php
//
var util = require('util');
var OAuthStrategy = require('passport-oauth1');

function EvernoteStrategy(options, verify) {
	options = options || {};
	options.requestTokenURL = options.enableInProduction ? 'https://www.evernote.com/oauth' : 'https://sandbox.evernote.com/oauth';
	options.accessTokenURL = options.enableInProduction ? 'https://www.evernote.com/oauth' : 'https://sandbox.evernote.com/oauth';
	options.userAuthorizationURL = options.enableInProduction ? 'https://www.evernote.com/OAuth.action' : 'https://sandbox.evernote.com/OAuth.action';
	options.sessionKey = options.sessionKey || 'oauth:evernote';

	OAuthStrategy.call(this, options, verify);
	this.name = 'evernote';
}

util.inherits(EvernoteStrategy, OAuthStrategy); // Inherit from OAuthStrategy

EvernoteStrategy.prototype.requestTokenParams = function (options) {
	return {};
};

EvernoteStrategy.prototype.userAuthorizationParams = function (options) {
	
 // TODO: Make 'em real options and configurable

	return {}; // Off for now until they enable my account
	
	//return {
	//    preferRegistration: 'true',
	//    supportLinkedSandbox: 'true',
	//    suggestedNotebookName: 'Blog'
	//};
};

EvernoteStrategy.prototype.userProfile = function (token, tokenSecret, params, done) {
	var profile = { provider: 'evernote' };
	profile.id = params.edam_userId;
	profile.shard = params.edam_shard;
	profile.params = params;
	
	return done(null, profile);
}

////////////////////////////////////////////////////////////////////////

module.exports = function(app, config, gettext, passport, User, doneAuth) {

	var authError = new Error("Evernote Auth Error", "auth-evernote.js");

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function setEvernoteToken(user, token, tokenSecret, profile) {

		user._auth.evernote.token =	token;
		user._auth.evernote.note_store_url = profile.params.edam_noteStoreUrl;
		user._auth.evernote.user_id = profile.params.edam_userId;
		user._auth.evernote.expires = parseInt(profile.params.edam_expires, 10);
		user._auth.evernote.web_api_url_prefix = profile.params.edam_webApiUrlPrefix;
		
		// TODO: Make sure this (sandbox_lnb) is indeed that parameter's name
		user._auth.evernote.linked_app_notebook_selected = profile.params.sandbox_lnb;
	}

	////////////////////////////////////////////////////////////////////
	// Do nothing if not configured
	//
	if (!config.EVERNOTE_CONSUMER_KEY || !config.EVERNOTE_CONSUMER_SECRET)
		return; // console.log("Auth: Evernote authorization is not configured and so it will be disabled");

	////////////////////////////////////////////////////////////////////
	// Setup strategy
	//
	passport.use(new EvernoteStrategy({
		
		enableInProduction: config.EVERNOTE_ENABLE_PRODUCTION,		
		consumerKey: config.EVERNOTE_CONSUMER_KEY,
		consumerSecret: config.EVERNOTE_CONSUMER_SECRET,
		callbackURL: config.SERVER_URL_PUBLIC + '/auth/evernote/callback'

	}, function (token, tokenSecret, profile, done) {
		
		user.findone({ "_auth.evernote.user_id": profile.id }, function (err, user) {
			
		    if (err)
		        done(err);
		    else
		        done(null, user, { token: token, tokenSecret: tokenSecret, profile: profile });
		});
	}));

	////////////////////////////////////////////////////////////////////
	// Redirect the user to Evernote for authentication.  When complete, Evernote
	// will redirect the user back to the application at "callbackURL"
	//
	app.get('/auth/evernote', passport.authenticate('evernote'));

	// Evernote will redirect the user to this URL after authentication
	//
	app.get('/auth/evernote/callback', function (req, res) {

		passport.authenticate('evernote', function(err, user, info) {

			if (err)
				doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
			else if (!info || !info.profile)
			    doneAuth(authError, req, res, info && info.message ? info.message : gettext("Could not authenticate"));
			else if (user || req.user) { //---> Just connect account with current one
				
				// 'user' may be whatever since we may be updating/refreshing the token
				var targetUser = user || req.user;				
				setEvernoteToken(targetUser, info.token, info.tokenSecret, info.profile);
				targetUser.save(function(err) {

			        if (err)
			            doneAuth(err, req, res, gettext("Error during authentication - please try again later"));
			        else
			            doneAuth(null, req, res, targetUser, true);
			    });
			}
			else //---> Report Error since this condition: '!user && !req.user' is not supported
				doneAuth(authError, req, res, gettext("Cannot register or login with this authentication method"));

		})(req, res);
	});
};
