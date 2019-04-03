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
 * @overview Ops module for storing license keys (secrets in general) into objects.
 *
 * In addition to the objects themselves, keys can also be associated with (attached to)
 * specific groups to which the object belongs (is published under), in which case,
 * the "getKey" method for an object will be able to also retrieve the keys that belong
 * to the groups that that specific object is published under.
 * 
 * @module ops
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var util = require('../util');

module.exports = function(app, config, mongoose, gettext, auth) {

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
			return Promise.resolve(obj._auth.keys[index]);
		else if (!obj._sec.groups || obj._sec.groups.length == 0)
			return Promise.resolve(null);
		else {

			return populateGroups(obj).then(function (obj) {

				return obj._sec.groups.reduce(function(promise, g) {

					return promise.then(function(result) {
						return result || findKeyRecursively(g, realm, resource);
					});

				}, Promise.resolve(null));
			});
		}
	}

	function listKeysRecursively(obj, user, resultsArray) {

		var ro = !obj.isUserAuthorized(user);

		obj._auth.keys.forEach(function(k) {
			resultsArray.push({ realm: k.realm, resource: k.resource, obj: obj._id, readonly: ro });
		});

		if (!obj._sec.groups || obj._sec.groups.length == 0)
			return Promise.resolve(null);
		else {

			return populateGroups(obj).then(function (obj) {

				return Promise.all(util.transform(obj._sec.groups, function (g) {
					return listKeysRecursively(g, user, resultsArray);
				}));
			});
		}
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Adds, modifies or deletes a license key (secret) from the given object.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.body.realm with a string that represents the context of the secret,
         *     the attribute req.body.resource with a string that represents a specific resource within
         *         the given context (e.g. realm could be "google.com" and the resource, "maps"),
         *     the attribute req.body.access_key with a string that represents the actual secret, and,
         *     the attribute req.body.remove that indicates whether we want to add/modify or remove
         *     the specified secret (false or true, respectively).
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		modifyKey: function (req, query) {

            return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);

                if (!req.body.realm || !req.body.resource)
                    throw new util.RestError(gettext("Incorrect licensing key identifiers"));

                var index = util.indexOf(obj._auth.keys, function (k) {
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

        /**
         * Finds and returns the key that is associated with the given object and which has
         * the given "realm" and "resource" values.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.query.realm with a string that represents the context of the secret,
         *     the attribute req.query.resource with a string that represents a specific resource within
         *         the given context (e.g. realm could be "google.com" and the resource, "maps"),
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @returns {Promise} A promise that is resolved with the key-object that matches the given
         *     "realm" and "resource".
         */
		getKey: function (req, query) {

            return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);

                if (!req.query.realm || !req.query.resource)
                    throw new util.RestError(gettext("Incorrect licensing key request"));

                return findKeyRecursively(obj, req.query.realm, req.query.resource);
            });
		},

        /**
         * Returns a list of all the keys that are associated with the given object.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @returns {Promise} A promise that is resolved with an array of all the key-objects that
         *     are associated with (attached to) the given object.
         */
		listKeys: function (req, query) {

            return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);

                var results = [];
                return listKeysRecursively(obj, req.user, results).then(function () {
                    return results;
                });
            });
		}
	};
};
