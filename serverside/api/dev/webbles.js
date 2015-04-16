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
// webbles.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

////////////////////////////////////////////////////////////////////////
// Development webbles API for creating and exposing new templates
//
var path = require('path');

var util = require('../../lib/util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');

	var webbleDir = path.join(config.APP_ROOT_DIR, 'webbles');
	var devWebbleDir = path.join(config.APP_ROOT_DIR, 'devwebbles');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizeWebble(w, files) {

		var obj = w.toJSON();
		obj.created = w._created || w._id.getTimestamp() || Date.now();
		obj.updated = w._updated || new Date();
		obj.rating = w._rating.average;
		obj.rating_count = w._rating.count;
		obj.is_shared = w._contributors.length != 0;

		if (files !== null) {

			obj.id = w._id;
			obj.is_dev = true;
			obj.files = files;
		}
		return obj;
	}

	////////////////////////////////////////////////////////////////////
    // Basic routes for webbles
    //
	var fsOps = require('../../lib/ops/fsing')(Q, app, config, mongoose, gettext, auth);

	app.get('/api/dev/webbles', auth.dev, function (req, res) {

		Q.ninvoke(DevWebble, "find", {$or: [{ _owner: req.user._id }, { _owner: null }]})
			.then(function (webbles) {

				if (!webbles)
					throw new util.RestError(gettext("Cannot retrieve webbles"));

				return Q.all(util.transform_(webbles, function(w) {

					return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString()))
						.then(function(files) {
							return normalizeWebble(w, files);
						});
				}));
			})
			.then(function(webbles) {
				res.json(webbles); // Oh-Kay
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/dev/webbles/:id', auth.non, function(req, res) {

		DevWebble.findById(mongoose.Types.ObjectId(req.params.id), function (err, webble) {

			if (err)
				res.status(500).send(gettext("Could not retrieve webbles"));
			else if (!webble)
				res.status(500).send(gettext("Webble does not exist"));
			else {

				// Allow webbles to be loaded from different domains:
				res.header("Access-Control-Allow-Origin", "*");
				res.header("Access-Control-Allow-Headers", "X-Requested-With");

				res.json(normalizeWebble(webble, []));
			}
		});
	});

	//******************************************************************

	app.post('/api/dev/webbles', auth.dev, function(req, res) {

		var newWebble = new DevWebble({
			webble: {
				defid: 'undefined',
				templateid: 'undefined',
				templaterevision: 0,
				author: req.user.username || req.user.name.full
			},
			_owner: req.user._id
		});

		Q.ninvoke(newWebble, "save")
			.then(function(saveResult) { // We need to save first to get an _id that we use for associating files

				return fsOps.associateFiles(req,
					saveResult[0],
					path.join(devWebbleDir, saveResult[0]._id.toString()),
					function() { return 0; });
			})
			.then(function (w) {

				return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString()))
					.then(function(files) {
						res.json(normalizeWebble(w, files)); // Everything's peachy
					});
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	//******************************************************************

	app.post('/api/dev/webbles/:defid', auth.dev, function(req, res) {

		Q.ninvoke(Webble, "findOne", { "webble.defid": req.params.defid })
			.then(function(fromW) {

				if (!fromW)
					throw new util.RestError(gettext("Requested object does not exist", 404));

				if (!fromW.isUserAuthorizedForOperation(req.user, 'copy'))
					throw new util.RestError(gettext("This object cannot be copied"), 403);

				var newWebble = new DevWebble({
					webble: {
						defid: req.params.defid,
						templateid: req.params.defid,
						templaterevision: 0,
						author: req.user.username || req.user.name.full,

						image: fromW.webble.image,
						displayname: fromW.webble.displayname,
						description: fromW.webble.description,
						keywords: fromW.webble.keywords
					},
					_owner: req.user._id
				});

				Q.ninvoke(newWebble, "save")
					.then(function(saveResult) { // We need to save first to get an _id that we use for associating files

						return fsOps.copyFiles(req, fromW, saveResult[0],
							path.join(webbleDir, req.params.defid), path.join(devWebbleDir, saveResult[0]._id.toString()));
					})
					.then(function (w) {

						return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString()))
							.then(function(files) {
								res.json(normalizeWebble(w, files)); // Everything's peachy
							});
					});
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	////////////////////////////////////////////////////////////////////
	// Modifying and creating (template) webbles
	//
	app.get('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		fsOps.associatedFiles(req,
				DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
				path.join(devWebbleDir, req.params.id))
			.then(function(files) {
				res.json(files); // Everything's peachy
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	//******************************************************************

	app.put('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		var pathPrefix = path.join(devWebbleDir, req.params.id);

		fsOps.associateFiles(req,
			DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			pathPrefix,
			function(w) { return 0; })
			.then(function(webble) {

				return fsOps.associatedFiles(req, webble, pathPrefix).then(function(files) {
					res.json(normalizeWebble(webble, files)); // Everything's peachy
				});
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
    });

	//******************************************************************

	app.delete('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		fsOps.disassociateFiles(req,
			DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			path.join(devWebbleDir, req.params.id),
			function(w) {
				return 0;
			})
			.then(function(webble) {
				res.json(normalizeWebble(webble, [])); // Everything's peachy
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	//******************************************************************

	app.get('/api/dev/webbles/:id/files/:file', auth.dev, function(req, res) {

		fsOps.getFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			path.join(devWebbleDir, req.params.id))
			.then(function(file) {
				res.json(file); // Everything's peachy
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	app.put('/api/dev/webbles/:id/files/:file', auth.dev, function(req, res) {

		fsOps.updateFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			path.join(devWebbleDir, req.params.id))
			.then(function(file) {
				res.json(file); // Everything's peachy
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	app.delete('/api/dev/webbles/:id/files/:file', auth.dev, function(req, res) {

		fsOps.deleteFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			path.join(devWebbleDir, req.params.id))
			.then(function(file) {
				res.json(file); // Everything's peachy
			})
			.fail(function (err) {
				util.resSendError(res, err);
			}).done();
	});

	////////////////////////////////////////////////////////////////////
	// Operations on template webbles
	//
	var publishingOps = require('../../lib/ops/publishing')(Q, app, config, mongoose, gettext, auth);

	app.put('/api/dev/webbles/:id/publish', auth.dev, function(req, res) {

		Q.ninvoke(DevWebble, "findById", mongoose.Types.ObjectId(req.params.id))
			.then(function(fromW) {

				if (!fromW || !fromW.isUserAuthorized(req.user))
					throw new util.RestError(gettext("Webble does not exist"), 404);

				var defid = fromW.webble.defid;

				return publishingOps.publish(req, Webble.findOne({ "webble.defid": defid }), function() {

					return new Webble();

				}, function(toW) {

					if (toW.webble.templateid != defid)
						throw new util.RestError(gettext("The target webble is not a template"), 403);

					var info = fromW.getInfoObject();
					info.ver = toW.webble.templaterevision + 1;
					toW.mergeWithInfoObject(info);

					if (req.body.webble) {

						// We manage these - protect accidental overwriting
						//
						delete req.body.webble.defid;
						delete req.body.webble.templateid;
						delete req.body.webble.templaterevision;

						delete req.body.webble.protectflags;
						delete req.body.webble.modelsharees;
						delete req.body.webble.slotdata;
						delete req.body.webble.private;
						delete req.body.webble.children;

						toW.mergeWithObject(req.body.webble);
					}

					if (!toW.webble.author)
						toW.webble.author = req.user.username || req.user.name.full;

					return toW;
				})
					.then(function(toW) {

						return fsOps.reassociateFiles(req, fromW, toW,
							path.join(devWebbleDir, req.params.id),
							path.join(webbleDir, defid));
					})
					.then(function(webble) {
						res.json(normalizeWebble(webble, null)); // Everything's rosy
					});
			})
			.fail(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	//******************************************************************

};
