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
 * @overview REST endpoints for creating and managing license and API keys.
 * @module api
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var util = require('../lib/util');
var dbutil = require('../lib/dbutil');

module.exports = function(app, config, mongoose, gettext, auth) {

	var Group = mongoose.model('Group');
	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    function getId(req) {

		try {
			return mongoose.Types.ObjectId(req.params.id);
		} catch (err) {
			return null; // Query with null
		}
	}

	////////////////////////////////////////////////////////////////////
	// Managing licenses
	//
	var licensingOps = require('../lib/ops/licensing')(app, config, mongoose, gettext, auth);

	app.get('/api/licenses/user', auth.usr, function (req, res) {

        licensingOps.listKeys(req, req.user).then(function (results) {
            res.json(results);
        }).catch(err => util.resSendError(res, err));
	});

	app.put('/api/licenses/user', auth.usr, function (req, res) {

        licensingOps.modifyKey(req, req.user).then(function () {
            res.status(200).send(gettext("License Key Modified"));
        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

	app.get('/api/licenses/group/:id', auth.usr, function (req, res) {

        licensingOps.listKeys(req, Group.findById(getId(req))).then(function (results) {
            res.json(results);
        }).catch(err => util.resSendError(res, err));
	});

	app.put('/api/licenses/group/:id', auth.usr, function (req, res) {

        licensingOps.modifyKey(req, Group.findById(getId(req))).then(function () {
            res.status(200).send(gettext("License Key Modified"));
        }).catch(err => util.resSendError(res, err));
	});

	////////////////////////////////////////////////////////////////////
	// Obtaining keys
	//
	app.get('/api/licenses/key', auth.usr, function (req, res) {

        licensingOps.getKey(req, req.user).then(function (value) {
            res.json(value && value.access_key);
        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************
};
