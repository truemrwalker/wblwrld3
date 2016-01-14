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
// trusting.js
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

		if (!obj.isUserAuthorized(req.user))
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);
	}
    
    function populateTrusts(query) {
        return query.populate('_sec.trusts', '-_sec -_owner -_contributors').execPopulate();
    }

	function getGroupId(idString) {

		try {
			return Q.resolve(mongoose.Types.ObjectId(idString));
		} catch (err) {
			return Q.reject(new util.RestError("Invalid Group Description"));
		}
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

		modifyTrusts: function (req, query) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query)).then(function (obj) {
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

		//**************************************************************

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

		//**************************************************************

		clearTrusts: function (req, query) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);
                
                obj._sec.trusts = [];
                return obj.save();
            });
		}
	};
};
