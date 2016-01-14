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
// licensing.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

var util = require('../util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');
	var Group = mongoose.model('Group');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function ensureObjectValid(req, obj) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));

		if (!obj.isUserAuthorized(req.user))
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);
	}

    function populateGroups(query) {
        return query.populate('_sec.groups', '_sec.groups _auth.keys').execPopulate();        
    }

	function findKeyRecursively(obj, realm, resource) {

		var index = util.indexOf(obj._auth.keys, function(k) {
			return k.realm == realm && k.resource == resource;
		});

		if (index != -1)
			return Q.resolve(obj._auth.keys[index]);
		else if (!obj._sec.groups || obj._sec.groups.length == 0)
			return Q.resolve(null);
		else {

			return populateGroups(obj).then(function (obj) {

				return obj._sec.groups.reduce(function(promise, g) {

					return promise.then(function(result) {
						return result || findKeyRecursively(g, realm, resource);
					});

				}, Q.resolve(null));
			});
		}
	}

	function listKeysRecursively(obj, user, resultsArray) {

		var ro = !obj.isUserAuthorized(user);

		obj._auth.keys.forEach(function(k) {
			resultsArray.push({ realm: k.realm, resource: k.resource, obj: obj._id, readonly: ro });
		});

		if (!obj._sec.groups || obj._sec.groups.length == 0)
			return Q.resolve(null);
		else {

			return populateGroups(obj).then(function (obj) {

				return Q.all(util.transform(obj._sec.groups, function (g) {
					return listKeysRecursively(g, user, resultsArray);
				}));
			});
		}
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

		modifyKey: function (req, query) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query))
				.then(function(obj) {
					ensureObjectValid(req, obj);

					if (!req.body.realm || !req.body.resource)
						throw new util.RestError(gettext("Incorrect licensing key identifiers"));

					var index = util.indexOf(obj._auth.keys, function(k) {
						return k.realm == req.body.realm && k.resource == req.body.resource;
					});

					if (!req.body.remove && !req.body.access_key)
						throw new util.RestError(gettext("Missing access key"));

					if (index !== -1) { // Delete or Modify

						if (req.body.remove)
							obj._auth.keys.splice(index, 1);
						else
							obj._auth.keys[index].access_key = req.body.access_key;
					}
					else
						obj._auth.keys.push(req.body); // Add new

					return obj.save();
				});
		},

		//**************************************************************

		getKey: function (req, query) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query))
				.then(function(obj) {
					ensureObjectValid(req, obj);

					if (!req.query.realm || !req.query.resource)
						throw new util.RestError(gettext("Incorrect licensing key request"));

					return findKeyRecursively(obj, req.query.realm, req.query.resource);
				});
		},

		//**************************************************************

		listKeys: function (req, query) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query))
				.then(function(obj) {
					ensureObjectValid(req, obj);

					var results = [];
					return listKeysRecursively(obj, req.user, results).then(function () {
						return results;
					});
				});
		}
	};
};
