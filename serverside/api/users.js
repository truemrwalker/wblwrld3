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
// users.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var util = require('../lib/util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizeUser(u) {

		return u.toJSON();
	}

	function toIndex(indexString) {

		var index = -1;
		try {
			index = parseInt(indexString, 10);
		} catch (err) {}
		return index;
	}

	////////////////////////////////////////////////////////////////////
	// Routes for Users
	//
	app.get('/api/users', auth.usr, function (req, res) {

		var query = util.buildQuery(req.query, ['q']);

		query.conditions["username"] = req.query.q ? new RegExp('^' + req.query.q, 'i') : { $ne: null };

		console.log("Query with conditions:", query.conditions, "...and options:", query.options);

		User.find(query.conditions, 'name username languages', query.options).exec().then(function (users) {
            res.json(util.transform_(users, normalizeUser));
        }).fail(function (err) {
            util.resSendError(res, err);
        }).done();

	});

	//******************************************************************

	var trustingOps = require('../lib/ops/trusting')(Q, app, config, mongoose, gettext, auth);

	app.get('/api/users/trusts', auth.usr, function(req, res) {

		trustingOps.getTrusts(req, req.user)
			.then(function(groups) {
				res.json(groups);
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.put('/api/users/trusts', auth.usr, function(req, res) {

		trustingOps.modifyTrusts(req, req.user)
			.then(function() {
				res.status(200).send(gettext("OK"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/users/trusts', auth.usr, function(req, res) {

		trustingOps.clearTrusts(req, req.user)
			.then(function() {
				res.status(200).send(gettext("OK"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.put('/api/users/tasks', auth.usr, function(req, res) {

		if (!req.user._tasks)
			res.status(500).send(gettext("Invalid Operation"));
		else {
			res.status(200).send(gettext("OK")); // Do nothing for now (placeholder)
		}
	});

	app.delete('/api/users/tasks/:id', auth.usr, function(req, res) {
        
        var index = -1;
        
        try {
            var id = mongoose.Types.ObjectId(req.params.id);
            index = util.indexOf(req.user._tasks, function (n) { return n._id.equals(id); });
        }
        catch (err) { }

		if (index == -1)
			res.status(500).send(gettext("Invalid Operation"));
		else {

			req.user._tasks.splice(index, 1);

			req.user.save().then(function() {
				res.status(200).send(gettext("OK"));
			}).done();
		}
	});

	//******************************************************************

	app.get('/api/users/groups', auth.usr, function(req, res) {

        req.user.populate('_sec.groups', '-_sec -_auth -_owner -_contributors').execPopulate().then(function (user) {
            
            res.json(util.transform_(user._sec.groups, function (g) {
                return g.toJSON();
            }));

        }).fail(function (err) {
            util.resSendError(res, err);

        }).done();
	});

	app.put('/api/users/groups', auth.usr, function(req, res) {

		Q.fcall(function() { return mongoose.Types.ObjectId(req.body.group); })
			.then(function (gId) {

				var index = req.user._sec.groups.indexOf(gId);

				if (index === -1 || !req.body.remove)
					throw util.RestError(gettext("Invalid Operation"));
				else {

					req.user._sec.groups.splice(index, 1);

					return req.user.save().then(function() {
						res.status(200).send(gettext("OK"));
					});
				}
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

};
