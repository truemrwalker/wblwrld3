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
// licenses.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
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
		var id;
		try {
			id = mongoose.Types.ObjectId(req.params.id);
		} catch (err) {
			id = null; // Query with null
		}
		return id;
	}

	////////////////////////////////////////////////////////////////////
	// Managing licenses
	//
	var licensingOps = require('../lib/ops/licensing')(app, config, mongoose, gettext, auth);

	app.get('/api/licenses/user', auth.usr, function (req, res) {

		licensingOps.listKeys(req, req.user)
			.then(function(results) {
				res.json(results);
			})
			.catch(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.put('/api/licenses/user', auth.usr, function (req, res) {

		licensingOps.modifyKey(req, req.user)
			.then(function() {
				res.status(200).send(gettext("License Key Modified"));
			})
			.catch(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.get('/api/licenses/group/:id', auth.usr, function (req, res) {

		licensingOps.listKeys(req, Group.findById(getId(req)))
			.then(function(results) {
				res.json(results);
			})
			.catch(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.put('/api/licenses/group/:id', auth.usr, function (req, res) {

		licensingOps.modifyKey(req, Group.findById(getId(req)))
			.then(function() {
				res.status(200).send(gettext("License Key Modified"));
			})
			.catch(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	////////////////////////////////////////////////////////////////////
	// Obtaining keys
	//
	app.get('/api/licenses/key', auth.usr, function (req, res) {

		licensingOps.getKey(req, req.user)
			.then(function(value) {
				res.json(value && value.access_key);
			})
			.catch(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************
};
