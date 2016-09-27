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
// workspaces.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var util = require('../lib/util');

////////////////////////////////////////////////////////////////////////
// Workspaces Support
//
module.exports = function(app, config, mongoose, gettext, auth) {

	var Workspace = mongoose.model('Workspace');
	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizeWS(ws) {

		delete ws.workspace.webbles;
		return normalizeFullWS(ws);
	}
	function normalizeFullWS(ws) {

        ws.workspace.id = ws._id;
        ws.workspace.is_shared = ws._contributors.length != 0;
        return util.stripObject(ws.workspace);
	}

	////////////////////////////////////////////////////////////////////
    // Routes for Spaces
    //
	app.get('/api/workspaces', auth.usr, function (req, res) {

		var query = util.buildQuery(req.query, ['q'], 'workspace');

		var ownerDisjunctions = [
			{ _owner: req.user._id },
			{ _owner: null },
			{ _contributors: req.user._id }
		];

		if (req.query.q) {

			var q = new RegExp(req.query.q, 'i');
			query.conditions["$and"] = [{ $or: ownerDisjunctions }, {$or: [
				{ "workspace.name" : q },
				{ "workspace.creator" : q },
				{ "workspace.collaborators" : q }
			]}];
		}
		else
			query.conditions["$or"] = ownerDisjunctions;

        Workspace.find(query.conditions, '_contributors workspace.name workspace.creator', query.options).lean().exec().then(function (workspaces) {
            res.json(util.transform_(workspaces, normalizeWS));
        }).catch(err => util.resSendError(res, err, gettext("Cannot retrieve workspaces")));
	});

	app.post('/api/workspaces', auth.usr, function(req, res) {

		var ws = new Workspace({ workspace: req.body.workspace });
		ws.workspace.creator = req.user.username || req.user.name.full;

		ws._owner = req.user._id;

		ws.save().then(function () {
            res.json(normalizeWS(ws)); // Everything OK
        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

	app.get('/api/workspaces/:id', auth.usr, function (req, res) {

        Workspace.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (ws) {
            
            if (!ws || !ws.isUserAuthorized(req.user))
                throw new util.RestError(gettext("Workspace no longer exists"), 404);
            
            res.json(normalizeFullWS(ws));

        }).catch(err => util.resSendError(res, err, gettext("Cannot retrieve workspace")));
	});

	app.put('/api/workspaces/:id', auth.usr, function (req, res) {

		Workspace.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (ws) {
            
            if (!ws)
                throw new util.RestError(gettext("Workspace no longer exists"), 404);
            
            if (!ws.isUserAuthorized(req.user))
                throw new util.RestError(gettext("Not authorized to change workspace"), 403);
            
            // Just in case
            //
            delete req.body.workspace.creator;
            
            if (!ws.isUserOwner(req.user))
                delete req.body.workspace.name;
            else if (!ws.workspace.creator)
                ws.workspace.creator = req.user.username || req.user.name.full;
            
            // Finally, merge and save
            //
            ws.mergeWithObject(req.body.workspace);
            return [ws, ws.save()]; // return a new promise

        }).spread(function (ws) {
            res.json(normalizeWS(ws)); // Everything OK
        }).catch(err => util.resSendError(res, err, gettext("Cannot change workspace")));
	});

	app.delete('/api/workspaces/:id', auth.usr, function (req, res) {

		Workspace.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (ws) {
            
            if (!ws)
                throw new util.RestError(gettext("Cannot find workspace"), 204); // 204 (No Content) per RFC2616
            
            if (!ws.isUserOwner(req.user))
                throw new util.RestError(gettext("Not authorized to delete workspace"), 403); // Forbidden
            
            return ws.remove().then(function () {
                res.status(200).send(gettext("Successfully deleted")); // Everything OK
            });

        }).catch(err => util.resSendError(res, err, gettext("Cannot delete workspace")));
	});

	////////////////////////////////////////////////////////////////////
	// Sharing workspaces
	//
	var sharingOps = require('../lib/ops/sharing')(app, config, mongoose, gettext, auth);

	app.put('/api/workspaces/:id/share', auth.usr, function(req, res) {

        sharingOps.updateContributors(req, Workspace.findById(mongoose.Types.ObjectId(req.params.id))).then(function (users) {
            res.json(users);
        }).catch(err => util.resSendError(res, err));
	});

	app.get('/api/workspaces/:id/share', auth.usr, function(req, res) {

        sharingOps.getContributors(req, Workspace.findById(mongoose.Types.ObjectId(req.params.id))).then(function (users) {
            res.json(users);
        }).catch(err => util.resSendError(res, err));
	});

	app.delete('/api/workspaces/:id/share', auth.usr, function(req, res) {

		var del = (req.query.me) ? sharingOps.removeCurrentUser : sharingOps.clearContributors;

        del(req, Workspace.findById(mongoose.Types.ObjectId(req.params.id))).then(function () {
            res.status(200).send(gettext("Successfully deleted")); // Everything OK
        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

};
