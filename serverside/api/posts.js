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
// posts.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var util = require('../lib/util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
	var Post = mongoose.model('Post');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizePost(p) {
		var obj = p.toJSON();
		obj.post.rating = p._target.rating;
		obj.post.id = p._id;
		return obj.post;
	}

	////////////////////////////////////////////////////////////////////
	// Posts in general
	//
	app.get('/api/posts', auth.non, function (req, res) {

		var query = util.buildQuery(req.query, ['q', 'type'], 'post');

		if (req.query.q) {

			var q = new RegExp(req.query.q, 'i');

			query.conditions["$or"] = [
				{ "post.title" : q },
				{ "post.keywords" : q },
				{ "post.body" : q },
				{ "post.author" : q }
			];
		}

		if (req.query.type)
			query.conditions["_type"] = req.query.type;

		Q.ninvoke(Post, "find", query.conditions, '', query.options)
			.then(function (posts) {

				res.json(util.transform_(posts, normalizePost));
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.post('/api/posts', auth.usr, function (req, res) {

		if (req.body.post) {

			if (!req.body.post.author)
				req.body.post.author = req.user.name.full;

			var post = new Post({
				post: {},
				_type: req.query.type || 'post',
				_owner: req.user.id
			});
			post.mergeWithObject(req.body.post);

			if (post._type === 'rating' && req.body.rating  && req.query.webble) {

				Q.ninvoke(Webble, "findOne", { "webble.defid": req.query.webble })
					.then(function(webble) {

						if (!webble)
							throw new util.RestError(gettext("Webble does not exist"));

						post._target.rating = req.body.rating;
						post._target.webble = webble._id;

						return Q.ninvoke(post, "save").then(function() {

							res.json(normalizePost(post));
						});
					})
					.fail(function (err) {
						util.resSendError(res, err);
					})
					.done();
			}
			else if (post._type !== 'rating') {

				post.save(function(err) {

					if (err)
						res.status(500).send(gettext("Cannot save post"));
					else
						res.json(normalizePost(post));
				});
			}
			else
				res.status(500).send(gettext("Malformed post"));
		}
		else
			res.status(500).send(gettext("Malformed post"));

	});

	//******************************************************************

	app.get('/api/posts/:id', auth.non, function (req, res) {

		Q.ninvoke(Post, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (post) {

				if (!post)
					throw new util.RestError(gettext("Post no longer exists"), 404);

				res.json(normalizePost(post));
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.put('/api/posts/:id', auth.usr, function (req, res) {

		Q.ninvoke(Post, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (post) {

				if (!post || !post.isUserAuthorized(req.user))
					throw new util.RestError(gettext("Post no longer exists"), 404);

				if (!req.body.post)
					throw new util.RestError(gettext("Malformed post"));

				post.mergeWithObject(req.body.post);

				return Q.ninvoke(post, "save").then(function() {

					res.json(normalizePost(post));
				});
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/posts/:id', auth.usr, function (req, res) {

		Q.ninvoke(Post, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (post) {

				if (!post)
					throw new util.RestError(gettext("Post no longer exists"), 204); // 204 (No Content) per RFC2616

				if (!post.isUserAuthorized(req.user))
					throw new util.RestError(gettext("You have no permission deleting this post"), 403); // Forbidden

				return Q.ninvoke(post, "remove").then(function() {

					res.status(200).send(gettext("Successfully deleted")); // Everything OK
				});
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

	app.put('/api/posts/:id/comment', auth.usr, function (req, res) {

		Q.ninvoke(Post, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function (post) {

				if (!req.body.comment)
					throw new util.RestError(gettext("Malformed comment"));

				if (!req.body.comment.author)
					req.body.comment.author = req.user.name.full;

				req.body.comment._owner = req.user._id;
				post.post.comments.push(req.body.comment);

				return Q.ninvoke(post, "save").then(function() {

					res.json(normalizePost(post));
				});
			})
			.fail(function(err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

};
