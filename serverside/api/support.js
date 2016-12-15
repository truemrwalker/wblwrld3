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
 * @overview REST endpoints for handling the QA/FAQ functionality of Webble World.
 * @module api
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var util = require('../lib/util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var Post = mongoose.model('Post');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizePost(p) {

		var a = !p.post.comments.length ? gettext("Unanswered") :
			p.post.comments[p.post.comments.length - 1].body;

		var au = !p.post.comments.length ? gettext("Me") :
			(p.post.comments[p.post.comments.length - 1].author || gettext("Anonymous Coward"));

		return {
			id: p._id,
			title: p.post.title,
			q: p.post.body,
			a: a,
			qu: p.post.author || gettext("Anonymous Coward"),
			au: au
		};
	}

	////////////////////////////////////////////////////////////////////
	// Support Q & A
	//
	app.get('/api/support/qa', auth.non, function (req, res) {

		var query = util.buildQuery(req.query, ['q'], 'post');

		if (req.query.q) {

			var q = new RegExp(req.query.q, 'i');

			query.conditions["$or"] = [
				{ "post.title" : q },
				{ "post.body" : q },
				{ "post.author" : q }
			];
		}
		query.conditions["_type"] = 'qa';

        Post.find(query.conditions, '', query.options).lean().exec().then(function (posts) {
            res.json(util.transform_(posts, normalizePost));
        }).catch(err => util.resSendError(res, err, gettext("Cannot retrieve questions")));
	});

	app.post('/api/support/qa', auth.usr, function (req, res) {

		if (req.body.qa) {

			if (!req.body.qa.qu)
				req.body.qa.qu = req.user.name.full;

			var post = new Post({
				post: {
					title: req.body.qa.title,
					body: req.body.qa.q,
					author: req.body.qa.qu
				},
				_type: 'qa',
				_owner: req.user.id
			});

			post.save(function(err) {

				if (err)
					res.status(500).send(gettext("Cannot save qa"));
				else
					res.json(normalizePost(post));
			});
		}
		else
			res.status(500).send(gettext("Malformed question"));
	});

	//******************************************************************

	app.get('/api/support/qa/:id', auth.usr, function (req, res) {

        Post.findById(mongoose.Types.ObjectId(req.params.id)).lean().exec().then(function (post) {

            if (!post || post._type !== 'qa')
                throw new util.RestError(gettext("Question no longer exists"), 404);

            res.json(normalizePost(post));

        }).catch(err => util.resSendError(res, err, gettext("Cannot get question")));
	});

	app.put('/api/support/qa/:id', auth.usr, function (req, res) {

		Post.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (post) {

            if (!post || post._type !== 'qa')
                throw new util.RestError(gettext("Question no longer exists"), 404);

            if (!req.body.qa)
                throw new util.RestError(gettext("Malformed answer"));

            post.post.comments.push({
                author: req.body.qa.au || req.user.name.full,
                body: req.body.qa.a,
                _owner: req.user._id
            });

            return post.save().then(function () {
                res.json(normalizePost(post));
            });

        }).catch(err => util.resSendError(res, err, gettext("Cannot answer question")));
	});

	app.delete('/api/support/qa/:id', auth.usr, function (req, res) {

		Post.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (post) {

            if (!post || post._type !== 'qa' || !post.isUserAuthorized(req.user))
                throw new util.RestError(gettext("Question no longer exists"), 204); // 204 (No Content) per RFC2616

            return post.remove().then(function () {
                res.status(200).send(gettext("Successfully deleted")); // Everything OK
            });

        }).catch(err => util.resSendError(res, err, gettext("Cannot delete question")));
	});

	//******************************************************************

};
