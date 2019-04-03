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
 * @overview REST endpoints for querying and getting information about user accounts.
 *
 * These endpoints provide more detailed information than those in api/users.js, however,
 * they are only accessible to administrators (users with the 'adm' role) whereas the ones
 * under /api/users.js are accessible to all users. Registering new accounts and updating
 * user-provided information is handled by the REST endpoints under the /auth path.
 * See also: auth/providers/local.js
 *
 * @module api/adm
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var util = require('../../lib/util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizeUser(u) {

        var u = util.stripObject(u);
		delete u.auth_keys;
        delete u.notif;
        return u;
	}

	////////////////////////////////////////////////////////////////////
	// Routes for Users
	//

	app.get('/api/adm/sessions', auth.adm, function (req, res) {

		// This function is installed by the connected sockets tracking component in auth-socket.js
		//
		res.json(app.getAllActiveUsers());
	});

	//******************************************************************

	app.get('/api/adm/users', auth.adm, function (req, res) {

		var query = util.buildQuery(req.query, ['q']);

		if (req.query.q) {

			var q = new RegExp(req.query.q, 'i');

			query.conditions["$or"] = [
				{ "name.first" : q },
				{ "name.last" : q },
				{ "email" : q },
				{ "email_alts" : q },
				{ "username" : q }
			];
		}

		console.log("Query with conditions:", query.conditions, "...and options:", query.options);

        User.find(query.conditions, '-_sec', query.options).lean().exec().then(function (users) {
            res.json(util.transform_(users, normalizeUser));
        }).catch(err => util.resSendError(res, err));
	});

};
