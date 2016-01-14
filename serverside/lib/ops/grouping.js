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
// grouping.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//


var util = require('../util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var Group = mongoose.model('Group');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function ensureObjectValid(req, obj) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));
	}
	function ensureGroupValid(req, group) {

		if (!group)
			throw new util.RestError(gettext("Requested Group does not exist", 404));

		if (!group.isUserAuthorized(req.user))
			throw new util.RestError(gettext("You cannot manage this group"), 403);
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

		modifyGroupMember: function (req, groupQuery, query) {

			return ('exec' in groupQuery ? Q.resolve(groupQuery.exec()) : Q.resolve(groupQuery)).then(function(group) {
				ensureGroupValid(req, group);

				return Q.resolve(query.exec()).then(function (obj) {
					ensureObjectValid(req, obj);

					var index = obj._sec.groups.indexOf(group._id);

					if (index != -1 && !req.body.remove)
						throw new util.RestError(gettext("Object is already a member of the group"));

					if (index == -1)
						obj._sec.groups.push(group._id);
					else
						obj._sec.groups.splice(index, 1);

					if (obj._tasks) {

						obj._tasks.push({
							text: group.name + ": " + (index == -1 ?
								gettext("You became a group member") : gettext("Your group membership was revoked"))
						});
					}
					return obj.save();
				});
			});
		},

		//**************************************************************

		getGroupMembers: function (req, groupQuery, query) {

			return ('exec' in groupQuery ? Q.resolve(groupQuery.exec()) : Q.resolve(groupQuery)).then(function(group) {
				ensureGroupValid(req, group);

				return query.where('_sec.groups').equals(group._id).exec().then(function (results) {
					ensureObjectValid(req, results);

					return results;
				});
			});
		},

		//**************************************************************

		clearGroupMembers: function (req, groupQuery, query) {

			return ('exec' in groupQuery ? Q.resolve(groupQuery.exec()) : Q.resolve(groupQuery)).then(function(group) {
				ensureGroupValid(req, group);

				return query.where('_sec.groups').equals(group._id).exec().then(function (results) {
					ensureObjectValid(req, results);

					return Q.all(util.transform(results, function (obj) {

						var index = obj._sec.groups.indexOf(group._id);
						if (index != -1)
							obj._sec.groups.splice(index, 1);

						return obj.save();
					}));
				});
			});
		}
	};
};
