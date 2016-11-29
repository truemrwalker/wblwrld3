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
 * @overview Ops module for verifying whether an object is trusted or not.
 * @module ops
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
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
	}

	function verifyGroupRecursively(trustVector, groupId) {

		if (!groupId)
			return Promise.resolve(false);
		else if (trustVector.indexOf(groupId) !== -1)
			return Promise.resolve(true);
		else {

			return Group.findById(groupId).exec().then(function(grp) {

                if (!grp)
                    return false;

                // For now only single parents supported
                //
                return verifyGroupRecursively(trustVector, grp._sec.groups[0]);

			}).catchReturn(false);
		}
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Determines whether the given object or the given query that evaluates to an object is trusted or not.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object|Object[]} query - A mongoose query that evaluates to an object (or an array of objects)
         *     OR an object (or an array of objects) that are tested for "trust".
         * @returns {Promise} A promise that is resolved with an array of boolean values that indicate whether the
         *     object at position i is trustworthy or not.
         */
        verify: function (req, query) {

			return ('exec' in query ? query.exec() : Promise.resolve(query)).then(function (objs) {
                ensureObjectValid(req, objs);

                if (!(objs instanceof Array)) // Sometimes we want to verify just one object
                    objs = [objs];
                
                var trustVector = req.user && req.user._sec.trusts;
                if (!trustVector || trustVector.length == 0)
                    return objs.map(o => false);
                else {

                    var cache = {}; // Store already calculated results for pruning

                    var results = objs.map(function(obj) {

                        var groups = obj._sec.groups;
                        
                        if (!groups)
                            return false;
                        else if (util.any(groups, g => cache[g.toString()]))
                            return true;
                        else if (util.all(groups, g => cache[g.toString()] !== undefined))
                            return false;
                        else {

                            var promises = groups.map(function (g) {

                                return (cache[g.toString()] !== undefined) ? cache[g.toString()]
                                    : verifyGroupRecursively(trustVector, g).then(r => (cache[g.toString()] = r));
                            });

                            if (promises.length == 0) // This can never happen mate!
                                throw new util.RestError(gettext("Halo!"));

                            return Promise.all(promises).then(util.anyTrue);
                        }
                    });
                    return Promise.all(results);
                }
            });
		},

        /**
         * Determines whether the given external object or the given query that evaluates to an external
         * object is trusted or not, where an external object is an object that is hosted in another
         * Webble World deployment than the current one.
         * @todo This function is not yet implemented as Webble World currently lacks the ability to verify
         *     external objects.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object|Object[]} query - A mongoose query that evaluates to an object (or an array of objects)
         *     OR an object (or an array of objects) that are tested for "trust".
         * @returns {Promise} A promise that is resolved with an array of boolean values that indicate whether the
         *     object at position i is trustworthy or not.
         */
		verifyExternal: function (req, query) {

		}
	};
};
