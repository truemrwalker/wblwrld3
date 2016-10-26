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
// sharing.js
// Created by Giannis Georgalis on 2/6/14
//
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

		updateContributors: function (req, query) {
			return addOrRemoveContributors(req, query, req.query.delete !== undefined);
		},

		//**************************************************************

		getContributors: function (req, query) {

			return query.populate('_contributors', 'name email username').exec().then(function (obj) {
                ensureObjectValid(req, obj);
                
                return obj._contributors; //util.transform(obj._contributors, function (u) { return u.username || u.email; }); // Everything OK
            });
		},

		//**************************************************************

		clearContributors: function (req, query) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                obj._contributors = [];
                return obj.save();
            });
		},

		//**************************************************************

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

		//**************************************************************

	};
};
