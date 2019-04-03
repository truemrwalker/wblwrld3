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
 * @overview Ops module for rating and attaching comments (posts) to objects.
 * @module ops
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var util = require('../util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var Post = mongoose.model('Post');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function ensureObjectValid(req, obj) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));
	}

	function normalizePost(p) {

		var obj = p.toJSON();
		obj.post.rating = p._target.rating;
		obj.post.id = p._id;
		return obj.post;
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Adds a rating and an optional comment (post) to the given object.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.body.rating with a number between 1 and 10 and
         *     the attribute req.body.post that adhers to the schema of the Post model (see models/post.js).
         * @param {Query} query - A mongoose query that evaluates to an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		updateRatings: function (req, query) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                if (!req.body.rating || req.body.rating <= 0 || req.body.rating > 10)
                    throw new util.RestError(gettext("The provided rating was incorrect"));
                
                if (!req.body.post)
                    req.body.post = {};
                
                if (!req.body.post.author)
                    req.body.post.author = req.user.username || req.user.name.full;
                
                var post = new Post({
                    post: {},
                    
                    _type: 'rating',
                    
                    _target: {
                        rating: req.body.rating,
                        webble: obj._id // Webble should be renamed to object some day...
                    },
                    _owner: req.user.id
                });
                post.mergeWithObject(req.body.post);
                
                // Moving average
                //
                obj._rating.average = obj._rating.average +
						((req.body.rating - obj._rating.average) / ++obj._rating.count);
                
                return [obj.save(), post.save()];

            }).spread(function (savedObj, savedPost) {                
                return savedObj;
            });
		},

        /**
         * Returns a list of all the ratings and comments (posts) that are attached to the given object.
         * @param {Request} req - The instance of an express.js request object that may contain a
         *     req.query.q string value that filters (restricts) the result list by matching the
         *     given query against the title, keywords, body and author of the attached posts.
         * @param {Query} query - A mongoose query that evaluates to an object.
         * @returns {Promise} A promise that is resolved with an array of post objects that represent
         *     comments and ratings attached to the given object.
         */
		getRatings: function (req, query) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                var query = util.buildQuery(req.query, ['q'], 'post');
                
                if (req.query.q) {
                    
                    var q = new RegExp(req.query.q, 'i');
                    
                    query.conditions["$or"] = [
                        { "post.title" : q },
                        { "post.keywords" : q },
                        { "post.body" : q },
                        { "post.author" : q }
                    ];
                }
                query.conditions["_target.webble"] = obj._id; // Webble should be renamed to object some day...
                
                return Post.find(query.conditions, '', query.options).exec();

            }).then(function (posts) {
                return util.transform_(posts, normalizePost);
            });
		},

        /**
         * Removes all the ratings (posts) that are attached to the given object.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query} query - A mongoose query that evaluates to an object.
   	     * @returns {Promise} A promise that is resolved if the method succeeds and rejected if not.
         */
		clearRatings: function (req, query) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                obj._rating.average = 0;
                obj._rating.count = 0;
                
                return [Post.find({ "_target.webble": obj._id }).remove().exec(), obj.save()];

            }).spread(function (posts, savedObj) {
                
                console.log("DELETED POSTS: ", posts);                
                return savedObj;
            });
		}
	};
};
