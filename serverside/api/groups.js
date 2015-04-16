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
// groups.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var util = require('../lib/util');
var dbutil = require('../lib/dbutil');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var Group = mongoose.model('Group');
	var User = mongoose.model('User');
	var Webble = mongoose.model('Webble');

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

	function normalizeGroup(g) {
		return g.toJSON();
	}

	function createGroup(req, isTopLevel) {

		return (!req.params.id ? Q.resolve(null) : Q.ninvoke(Group, "findById", mongoose.Types.ObjectId(req.params.id)))
			.then(function(parentGroup) {

				if (!isTopLevel) {

					if (!parentGroup)
						throw new util.RestError(gettext("Parent group does not exist"), 404);

					if (!parentGroup.isUserAuthorized(req.user))
						throw new util.RestError(gettext("You have no permission to create a subgroup"), 403); // Forbidden
				}
				else if (!req.user.hasRole('adm'))
					throw new util.RestError(gettext("You have no permission to create a top-level group"), 403); // Forbidden

				if (!req.body.group)
					throw new util.RestError(gettext("Malformed group description"));

				return (!req.body.owner ? Q.resolve(req.user) : Q.ninvoke(User, "findOne", {$or: [{email:req.body.owner}, {username:req.body.owner}]}))
					.then(function(owner) {

						if (!owner)
							throw new util.RestError(gettext("Could not resolve the new group's owner"));

						var group = new Group({
							_sec: {
								groups: parentGroup ? [ parentGroup._id ] : [],
								cert: null // CREATE CERT FOR THIS GROUP SPECIFICALLY
							},
							_owner: owner._id
						});
						group.mergeWithObject(req.body.group);

						return Q.ninvoke(group, "save").then(function() {
							return group;
						});
					});
			});
	}

	////////////////////////////////////////////////////////////////////
	// Groups in general
	//
	app.get('/api/groups', auth.usr, function (req, res) {

		var query = util.buildQuery(req.query, ['q']);

		if (req.query.q) {

			var q = new RegExp(req.query.q, 'i');

			query.conditions["$or"] = [
				{ "name" : q },
				{ "description" : q },
				{ "address" : q },
				{ "email" : q }
			];
		}

		Q.ninvoke(Group, "find", query.conditions, '', query.options)
			.then(function (groups) {
				res.json(util.transform_(groups, normalizeGroup));
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/mygroups', auth.usr, function (req, res) {

		Q.ninvoke(Group, "find", {$or: [{ _owner: req.user._id }, { _owner: null }, { _contributors: req.user._id }]})
			.then(function (groups) {
				res.json(util.transform_(groups, normalizeGroup));
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.post('/api/groups', auth.adm, function (req, res) { // Top-level groups must be managed by the adminzzz

		createGroup(req, true)
			.then(function(group) {
				res.json(normalizeGroup(group));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.get('/api/groups/:id', auth.usr, function (req, res) {

		Q.ninvoke(Group, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (group) {

				if (!group)
					throw new util.RestError(gettext("Group no longer exists"), 404);

				res.json(normalizeGroup(group));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.put('/api/groups/:id', auth.usr, function (req, res) {

		Q.ninvoke(Group, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (group) {

				if (!group)
					throw new util.RestError(gettext("Group no longer exists"), 404);

				if (!group.isUserAuthorized(req.user))
					throw new util.RestError(gettext("You have no permission editing this group"), 403); // Forbidden

				if (!req.body.group)
					throw new util.RestError(gettext("Malformed group description"));

				group.mergeWithObject(req.body.group);

				return Q.ninvoke(group, "save").then(function() {

					res.json(normalizeGroup(group));
				});
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/groups/:id', auth.usr, function (req, res) {

		Q.ninvoke(Group, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (group) {

				if (!group)
					throw new util.RestError(gettext("Group no longer exists"), 204); // 204 (No Content) per RFC2616

				return groupingOps.clearGroupMembers(req, group, dbutil.qAG(Webble.find({}), User.find({})))
					.then(function() {

						return Q.ninvoke(Group, "find", { "_sec.groups": group._id }).then(function (subgroups) {

							return Q.all(util.transform_(subgroups, function (g) {

								var index = g._sec.groups.indexOf(group._id);
								if (index != -1)
									g._sec.groups.splice(index, 1);

								if (group._sec.groups.length > 0)
									g._sec.groups.push(group._sec.groups[0]);

								return Q.ninvoke(g, "save");
							}));
						});
					})
					.then(function () {

						return Q.ninvoke(group, "remove").then(function () {
							res.status(200).send(gettext("Successfully deleted")); // Everything OK
						});
					});
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.post('/api/groups/:id', auth.usr, function (req, res) {

		createGroup(req, false)
			.then(function(group) {
				res.json(normalizeGroup(group));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/groups/:id/groups', auth.usr, function (req, res) { // Sub-groups

		return Q.ninvoke(Group, "find", { "_sec.groups" : getId(req) })
			.then(function (groups) {
				res.json(util.transform_(groups, normalizeGroup));
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	////////////////////////////////////////////////////////////////////
	// Grouping users - i.e. make them member of a group
	// Grouping webbles - i.e. publishing them under a group (and thus sanctioning them)
	// Grouping object - i.e. generic addition of any object to a group (should I deprecate the more specific versions?)
	//
	var groupingOps = require('../lib/ops/grouping')(Q, app, config, mongoose, gettext, auth);

	app.put('/api/groups/:id/users', auth.usr, function (req, res) {

		groupingOps.modifyGroupMember(req, Group.findById(getId(req)), User.findOne({$or : [{email: req.body.user}, {username: req.body.user}]}))
			.then(function() {
				res.status(200).send(gettext("User added to group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/groups/:id/users', auth.usr, function (req, res) {

		groupingOps.getGroupMembers(req, Group.findById(getId(req)), User.find({}))
			.then(function(results) {
				res.json(util.transform_(results, function(u) { return u.toJSON(); }));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/groups/:id/users', auth.usr, function (req, res) {

		groupingOps.clearGroupMembers(req, Group.findById(getId(req)), User.find({}))
			.then(function() {
				res.status(200).send(gettext("User removed from group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.put('/api/groups/:id/webbles', auth.usr, function (req, res) {

		groupingOps.modifyGroupMember(req, Group.findById(getId(req)), Webble.findOne({ "webble.defid": req.body.webble }))
			.then(function() {
				res.status(200).send(gettext("Webble added to group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/groups/:id/webbles', auth.usr, function (req, res) {

		groupingOps.getGroupMembers(req, Group.findById(getId(req)), Webble.find({}))
			.then(function(results) {
				res.json(util.transform_(results, function(w) { return w.toJSON(); }));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/groups/:id/webbles', auth.usr, function (req, res) {

		groupingOps.clearGroupMembers(req, Group.findById(getId(req)), Webble.find({}))
			.then(function() {
				res.status(200).send(gettext("Webble removed from group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.put('/api/groups/:id/objects', auth.usr, function (req, res) {

		var execAble = dbutil.qOR(Webble.findById(mongoose.Types.ObjectId(req.body.obj)),
			User.findById(mongoose.Types.ObjectId(req.body.obj)));

		groupingOps.modifyGroupMember(req, Group.findById(getId(req)), execAble)
			.then(function() {
				res.status(200).send(gettext("Object added to group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/groups/:id/objects', auth.usr, function (req, res) {

		var execAble = dbutil.qAG(Webble.find({}), User.find({}));

		groupingOps.getGroupMembers(req, Group.findById(getId(req)), execAble)
			.then(function(results) {
				res.json(util.transform_(results, function(o) { return { id: o._id, repr: o.repr() } }));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/groups/:id/objects', auth.usr, function (req, res) {

		var execAble = dbutil.qAG(Webble.find({}), User.find({}));

		groupingOps.clearGroupMembers(req, Group.findById(getId(req)), execAble)
			.then(function() {
				res.status(200).send(gettext("Objects removed from group"));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

};
