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
 * @overview Ops module for sharing objects among users.
 * @module ops
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var util = require('../util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function ensureObjectValid(req, obj) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));

		if (!obj.isUserOwner(req.user))
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);
	}

	function ensureObjectValidRelaxed(req, obj) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));

		if (!obj.isUserAuthorized(req.user))
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);
	}

	function addOrRemoveContributors(req, query, opRemove) {

		return Promise.resolve(query.exec()).then(function (obj) {
            ensureObjectValid(req, obj);
            
            if (!req.body.users || req.body.users.length == 0)
                throw new util.RestError(gettext("No users were provided"));
            
            return User.find({ $or: [{ email: { $in: req.body.users } }, { username: { $in: req.body.users } }] },
					'name email username').exec().then(function (users) {
                
                if (!users || users.length == 0)
                    throw new util.RestError(gettext("The provided users do not have an account"));
                
                if (opRemove) {
                    
                    users.forEach(function (u) {
                        
                        var index = obj._contributors.indexOf(u._id);
                        
                        if (index > -1)
                            obj._contributors.splice(index, 1);
                    });
                }
                else {
                    
                    users.forEach(function (u) {
                        
                        if (!obj.isUserContributor(u))
                            obj._contributors.push(u._id);
                    });
                }
                return [users, obj.save()];
            });

        }).spread(function (users) {
            return util.transform(users, function (u) { return u.username || u.email; }); // Everything OK
        });
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Updates the list of users that are allowed to modify the given object (share the object).
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.body.users with an array of usernames or emails of users and
         *     the attribute req.query.delete that if present removes and if absent adds the
         *     given users to the list of collaborators of the given object.
         * @param {Query} query - A mongoose query that evaluates to an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		updateContributors: function (req, query) {
			return addOrRemoveContributors(req, query, req.query.delete !== undefined);
		},

        /**
         * Returns a list of all the users that are allowed to modify (share) the given object.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query} query - A mongoose query that evaluates to an object.
         * @returns {Promise} A promise that is resolved with an array of user objects that represent
         *     the users that are allowed to modify the current object.
         */
		getContributors: function (req, query) {

			return query.populate('_contributors', 'name email username').exec().then(function (obj) {
                ensureObjectValid(req, obj);
                
                return obj._contributors; //util.transform(obj._contributors, function (u) { return u.username || u.email; }); // Everything OK
            });
		},

        /**
         * Removes all the users that the given object is shared with (i.e., the users allowed to modify it).
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query} query - A mongoose query that evaluates to an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		clearContributors: function (req, query) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                obj._contributors = [];
                return obj.save();
            });
		},

        /**
         * Removes the current user from the list of users the given object is shared with.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query} query - A mongoose query that evaluates to an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		 removeCurrentUser: function(req, query) {

			 return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValidRelaxed(req, obj);
                
                if (!req.user || !obj._contributors)
                    throw new util.RestError(gettext("User is not a contributor"));
                
                var index = obj._contributors.indexOf(req.user._id);
                
                if (index == -1)
                    throw new util.RestError(gettext("User is not a contributor"));
                
                obj._contributors.splice(index, 1);
                return obj.save();
            });
		 }
	};
};
