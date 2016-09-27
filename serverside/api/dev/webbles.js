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
var Promise = require("bluebird");

var path = require('path');
var util = require('../../lib/util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');

	var webbleDir = 'webbles';
	var devWebbleDir = 'devwebbles';

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function normalizeWebble(w, files) {

        var obj = { webble: w.webble };

        obj.created = w._created || w._id.getTimestamp() || Date.now();
        obj.updated = w._updated || new Date();
        obj.rating = w._rating.average;
        obj.rating_count = w._rating.count;
        obj.is_shared = w._contributors.length != 0;

        obj.files = files;

        obj.id = w._id;
        obj.is_dev = true;

        return obj;
	}

	////////////////////////////////////////////////////////////////////
    // Basic routes for webbles
    //
	var fsOps = require('../../lib/ops/gfsing')(app, config, mongoose, gettext, auth);

    app.get('/api/dev/webbles', auth.dev, function (req, res) {

        return DevWebble.find({ $or: [{ _owner: req.user._id }, { _owner: null }] }).exec().then(function (webbles) {

            if (!webbles)
                throw new util.RestError(gettext("Cannot retrieve webbles"));

            return Promise.all(util.transform_(webbles, function (w) {

                return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString())).then(function (files) {
                    return normalizeWebble(w, files);
                });
            }));

        }).then(webbles => res.json(webbles))
            .catch(err => util.resSendError(res, err));
    });

	app.get('/api/dev/webbles/:id', auth.non, function(req, res) {

        return DevWebble.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function(webble) {

			if (!webble)
                throw new util.RestError(gettext("Webble does not exist"));

			// Allow webbles to be loaded from different domains:
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");

            return fsOps.associatedFiles(req, webble, path.join(devWebbleDir, webble._id.toString())).then(function (files) {
                res.json(normalizeWebble(webble, files));
            });

        }).catch(err => util.resSendError(res, err));
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

		return newWebble.save().then(function (savedDoc) { // We need to save first to get an _id that we use for associating files
            
            return fsOps.associateFiles(req,
					savedDoc,
					path.join(devWebbleDir, savedDoc._id.toString()),
					function () { return 0; });

        }).then(function (w) {

            return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString())).then(function (files) {
                res.json(normalizeWebble(w, files)); // Everything's peachy
            });

        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

	app.post('/api/dev/webbles/:defid', auth.dev, function(req, res) {

        return Webble.findOne({ "webble.defid": req.params.defid }).exec().then(function (fromW) {

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

            return newWebble.save().then(function (savedDoc) { // We need to save first to get an _id that we use for associating files

                return fsOps.copyFiles(req, fromW, savedDoc,
                    path.join(webbleDir, req.params.defid), path.join(devWebbleDir, savedDoc._id.toString()));

            }).then(function (w) {

                return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString())).then(function (files) {
                    res.json(normalizeWebble(w, files)); // Everything's peachy
                });
            });

        }).catch(err => util.resSendError(res, err));

	});

	////////////////////////////////////////////////////////////////////
	// Modifying and creating (template) webbles
	//
	app.get('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		return fsOps.associatedFiles(req,
				DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
                path.join(devWebbleDir, req.params.id))
            .then(files => res.json(files))
            .catch(err => util.resSendError(res, err));
	});

	//******************************************************************

	app.put('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		var pathPrefix = path.join(devWebbleDir, req.params.id);

		return fsOps.associateFiles(req,
			    DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
                pathPrefix, w => 0)
            .then(function (webble) {

                return fsOps.associatedFiles(req, webble, pathPrefix).then(function (files) {
                    res.json(normalizeWebble(webble, files)); // Everything's peachy
                });

            }).catch(err => util.resSendError(res, err));
    });

	//******************************************************************

	app.delete('/api/dev/webbles/:id/files', auth.dev, function(req, res) {

		return fsOps.disassociateFiles(req,
			    DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			    path.join(devWebbleDir, req.params.id), w => 0)
            .then(webble => res.json(normalizeWebble(webble, [])))
            .catch(err => util.resSendError(res, err));
	});

	//******************************************************************

	app.get('/api/dev/webbles/:id/files/*', auth.dev, function(req, res) {

		return fsOps.getFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
                path.join(devWebbleDir, req.params.id))
            .then(file => res.json(file))
            .catch(err => util.resSendError(res, err));
	});

	app.put('/api/dev/webbles/:id/files/*', auth.dev, function(req, res) {

		return fsOps.updateFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
			    path.join(devWebbleDir, req.params.id))
            .then(file => res.json(file))
            .catch(err => util.resSendError(res, err));
	});

	app.delete('/api/dev/webbles/:id/files/*', auth.dev, function(req, res) {

		return fsOps.deleteFile(req, DevWebble.findById(mongoose.Types.ObjectId(req.params.id)),
    			path.join(devWebbleDir, req.params.id))
            .then(file => res.json(file))
            .catch(err => util.resSendError(res, err));
	});

	////////////////////////////////////////////////////////////////////
	// Operations on template webbles
	//
	var publishingOps = require('../../lib/ops/publishing')(app, config, mongoose, gettext, auth);

	app.put('/api/dev/webbles/:id/publish', auth.dev, function(req, res) {

		return DevWebble.findById(mongoose.Types.ObjectId(req.params.id)).exec().then(function (fromW) {
            
            if (!fromW || !fromW.isUserAuthorized(req.user))
                throw new util.RestError(gettext("Webble does not exist"), 404);
            
            var defid = fromW.webble.defid;
            
            return publishingOps.publish(req, Webble.findOne({ "webble.defid": defid }), function () {

                return new Webble({
                    webble: { templateid: defid },
                    _owner: req.user._id
                });

            }, function (toW) {

                if (toW.webble.templateid != defid)
                    throw new util.RestError(gettext("The target webble is not a template"), 403);

                var info = fromW.getInfoObject();
                info.ver = toW.webble.templaterevision + 1;
                toW.mergeWithInfoObject(info);

                console.log("Target Webble Reported version:", info.ver - 1, "and it will be bumped up to version:", info.ver);

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

            }).then(function (toW) {

                return fsOps.reassociateFiles(req, fromW, toW,
                    path.join(devWebbleDir, req.params.id),
                    path.join(webbleDir, defid));

            }).then(webble => res.json(normalizeWebble(webble, null)));

        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

};
