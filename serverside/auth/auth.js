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

/**
 * @overview Implements the logic for authenticating users against the platform's accounts.
 *
 * This file/module is the main entry point that defines the basic auth API and delegates
 * the specific authentication logic to the specialized providers under the providers/*
 * sub-directory. It also returns an express-compatible middleware object to use in routes
 * in order to enable fine-grained restricted access to authenticated users per-role. Currently,
 * the supported roles are "usr", "dev", and "adm" which represent normal authenticated users,
 * platform developers, and platform administrators respectively.
 * 
 * @module auth
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var path = require('path');
var passport = require('passport');

var xfs = require('../lib/xfs');
var util = require('../lib/util');

module.exports = function(app, config, mongoose, gettext) {

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
		
		return new Promise(function (resolve, reject) {

			if (err)
				reject(err);
			else if (!user._sec || !user._sec.account_status)
				reject(new util.RestError(gettext("Account incomplete"), 403));
			else if (user._sec.account_status === 'suspended')
				reject(new util.RestError(gettext("Account suspended"), 403));
			else if (user._sec.account_status === 'deleted')
				reject(new util.RestError(gettext("Account deleted"), 403));
			else if (req.user)
				resolve(user.getSafeProps());
			else {
				
				if (user._sec.account_status === 'inactive') {
					
					user._sec.account_status = 'ok';
					user.save(); // Don't need to wait for this to finish -- not so important
				}
				
				req.login(user, function (err) {
					
					if (err)
						reject(new util.RestError(gettext("Please try again later")));
					else {
						
						if (req.body.rememberMe)
							req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
						
						app.emit('auth:login', req.sessionID, req.session);
						resolve(user.getSafeProps());
					}
				});
			}
		});
	}

	//******************************************************************

	function doLogout(req) {

		if (!req.isAuthenticated())
			return Promise.reject(new util.RestError(gettext("Not logged in")));

		req.logout(); // Installed by passport

		// Better save than destroy...
		//
		return Promise.promisify(req.session.save, { context: req.session })().then(function() { // TODO: req methods should return promises

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

		doLogin(err, req, user).then(function (userJson) {
			res.json(userJson);
		}).catch(function (err) {
			util.resSendError(res, err);
		});
	}

	function doneExternal(err, req, res, user) {

		doLogin(err, req, user).catch(function (e) {
			console.log("AUTH ERROR:", e);
		}).finally(function () {
			
			// Close the window (still under consideration) --
			// This should be the standard negotiation protocol for the client-side reactions
			//
			res.send('<script>window.close();</script>');
		});
	}

	// Try to initialize all the supported authentication methods
    //
    var providersPath = path.join(__dirname, "providers");
    xfs.getAllFilesSync(providersPath, ".js", 1).forEach(function (f) {

        require(path.join(providersPath, f))(app, config, gettext, passport, User, 
            (f == "local.js" ? doneLocal : doneExternal));
    });

	////////////////////////////////////////////////////////////////////
	// Basic auth API (routes)

   /**
    * REST endpoint that returns the current authenticated user.
    * @param {Request} req - The instance of an express.js request object.
    * @param {Request} res - The instance of an express.js result object.
    * @returns {Object} The user object that was authenticated against the current session.
    */
    app.get('/auth/user', function (req, res) {

		if (req.isAuthenticated())
			res.status(200).send(req.user.getSafeProps());
		else
			res.status(404).end();
	});

   /**
    * REST endpoint that deletes the authenticated user's account.
    * @param {Request} req - The instance of an express.js request object.
    * @param {Request} res - The instance of an express.js result object.
    * @returns {number} HTTP status code 200 or 204 on success, 500 on error.
    */
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
			req.user.save().then(function () {
				return doLogout(req);
			}).then(function () {
				res.status(200).send(gettext("Successfully logged out"));
			}).catch(function (err) {
				util.resSendError(res, err);
			}).done();

		}
		else
			res.status(204).end(); // 204 (No Content) per RFC2616
	});

   /**
    * REST endpoint that logs out the current authenticated user and after its successful
    * invocation, subsequent requests over the specific session will be unauthenticated.
    * @param {Request} req - The instance of an express.js request object.
    * @param {Request} res - The instance of an express.js result object.
    * @returns {number} HTTP status code 200 success, 500 on error.
    */
	app.all('/auth/logout', function(req, res){

		doLogout(req)
			.then(function() {
				res.status(200).send(gettext("Successfully logged out"));
			})
			.catch(function(err) {
				util.resSendError(res, err);
			}).done();
	});

   /**
    * The main result of this module is the object with express.js middleware functions that
    * enable routes to (optionally) restrict access to specific roles.
    * @returns {Object} The supported express.js middlewares are the following:
    *     non - that allows access of a resource (route) to all users
    *     usr - that allows access to all authenticated users
    *     dev - that allows access to all users that are developers (currently the default for new accounts)
    *     adm - that allows access to all users that are administrators of the Webble World platform.
    */
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
