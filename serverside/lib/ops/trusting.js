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
 * @overview Ops module for generating trust-links between objects.
 * @module ops
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var util = require('../util');

module.exports = function(app, config, mongoose, gettext, auth) {

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
    
    function populateTrusts(query) {
        return query.populate('_sec.trusts', '-_sec -_owner -_contributors').execPopulate();
    }

	function getGroupId(idString) {

		try {
			return Promise.resolve(mongoose.Types.ObjectId(idString));
		} catch (err) {
			return Promise.reject(new util.RestError("Invalid Group Description"));
		}
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Establishes or removes a trust link from an object to a specific group.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.body.group with the group-id of the target group and, optionally,
         *     the attribute req.body.remove that indicates whether we want to establish or remove
         *     the specified trust link (false or true, respectively).
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		modifyTrusts: function (req, query) {

			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);
                
                return getGroupId(req.body.group).then(function (groupId) {
                    
                    var index = obj._sec.trusts.indexOf(groupId);
                    
                    if (index != -1 && !req.body.remove)
                        throw new util.RestError(gettext("Trust relationship already exists"));
                    else {
                        
                        if (index == -1)
                            obj._sec.trusts.push(groupId);
                        else
                            obj._sec.trusts.splice(index, 1);
                        
                        return obj.save();
                    }
                });
            });
		},

        /**
         * Returns a list of all the groups that the given object trusts.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @returns {Promise} A promise that is resolved with an array of group-id values that indicate the
         *     groups trusted by the current object.
         */
		getTrusts: function (req, query) {

			return populateTrusts(query).then(function(obj) {
				ensureObjectValid(req, obj);

				return util.transform(obj._sec.trusts, function(g) {
					var result = g.toJSON();
					result.id = g._id;
					return result;
				});
			});
		},

        /**
         * Removes all the trust links that the given object had established in the past.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		clearTrusts: function (req, query) {

			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);
                
                obj._sec.trusts = [];
                return obj.save();
            });
		}
	};
};
