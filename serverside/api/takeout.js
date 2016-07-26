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
// takeout.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

////////////////////////////////////////////////////////////////////////
// Development webbles API for creating and exposing new templates
//
var Promise = require("bluebird");

var path = require('path');
var tar = require('tar-stream');
var util = require('../lib/util');

module.exports = function (app, config, mongoose, gettext, auth) {
	
	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');
	
	var webbleDir = 'webbles';
	var devWebbleDir = 'devwebbles';
	
	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    function normalizeDevWebble(w, files) {

        var obj = w.getNormalizedObject(files);

        obj.id = w._id;
        obj.is_dev = true;
        return obj;
    }

    function normalizeWebble(w, files) {
        return w.getNormalizedObject(files);
    }

    ////////////////////////////////////////////////////////////////////
	// Utility functions for routes
	//
    var fsOps = require('../lib/ops/gfsing')(app, config, mongoose, gettext, auth);

    function exportWebble(req, res, webble, dir, id) {

        var pack = tar.pack();

        return fsOps.exportFiles(req, webble, path.join(dir, id), pack).then(function (w) {

            pack.finalize();

            res.writeHead(200, {
                'Content-Description': 'Webble Archive: ' + w.webble.displayname,
                'Content-Disposition': 'inline; filename="' + w.webble.defid + '.war"',
                'Content-Type': 'application/octet-stream',
                //'Content-Length': pack.size
            });
            pack.pipe(res);

        }).catch(err => util.resSendError(res, err));
    }

    function exportWebbles(req, res, webbles, dir, idGetter) {

        var pack = tar.pack();

        return Promise.try(function () {

            if (!webbles)
                throw new util.RestError(gettext("Cannot retrieve webbles"));

            // Sequentially		
            return webbles.reduce(function (soFar, w) {
                return soFar.then(() => fsOps.exportFiles(req, w, path.join(dir, idGetter(w)), pack));
            }, Promise.resolve(null));

        }).then(function () {

            pack.finalize();

            res.writeHead(200, {
                'Content-Description': 'Webble Archive: ' + req.user.name.first,
                'Content-Disposition': 'inline; filename="' + req.user.username + '.war"',
                'Content-Type': 'application/octet-stream'
            });
            pack.pipe(res);

        }).catch(err => util.resSendError(res, err));;
    }

	////////////////////////////////////////////////////////////////////
	// Routes
	//
    app.get('/api/takeout/webbles', auth.dev, function (req, res) {

        return Webble.find({ _owner: req.user._id }).exec()
            .then(webbles => exportWebbles(req, res, webbles, webbleDir, w => w.webble.defid));
    });

	app.get('/api/takeout/devwebbles', auth.dev, function (req, res) {

        return DevWebble.find({ _owner: req.user._id }).exec()
            .then(webbles => exportWebbles(req, res, webbles, devWebbleDir, w => w._id.toString()));
	});
	
    app.get('/api/takeout/devwebbles/:id', auth.dev, function (req, res) {

        return DevWebble.findById(mongoose.Types.ObjectId(req.params.id)).exec()
            .then(w => exportWebble(req, res, w, devWebbleDir, req.params.id));
	});

    app.get('/api/takeout/webbles/:defid', auth.dev, function (req, res) {

        return Webble.findOne({ "webble.defid": req.params.defid }).exec()
            .then(w => exportWebble(req, res, w, webbleDir, req.params.defid));
    });

	//******************************************************************

	app.post('/api/takeout/devwebbles', auth.dev, function (req, res) {
        
        return fsOps.importFiles(req, {}, devWebbleDir, function (tarDir) {

            return DevWebble.findOne({ $and: [{ _owner: req.user._id }, { 'webble.templateid': tarDir }] }).exec().then(function (w) {

                if (w && (!req.body || !req.body.replace))
                    return { obj: null, pathSuffix: '' };
                else if (w)
                    return { obj: w, pathSuffix: path.join(w._id.toString(), "0") };
                else {

                    var newWebble = new DevWebble({
                        webble: { defid: tarDir, templateid: tarDir },
                        _owner: req.user._id
                    });

                    return newWebble.save().then(function (savedDoc) { // We need to save first to get an _id
                        return { obj: savedDoc, pathSuffix: path.join(savedDoc._id.toString(), "0") };
                    });
                }
            });

        }, function (w, infoObj) {

            w.mergeWithInfoObject(infoObj);
            return w.save().then(function (savedDoc) { return { obj: savedDoc }; });

        }).then(function (result) {

            return Promise.all(util.transform_(result.objs, function (w) {

                return fsOps.associatedFiles(req, w, path.join(devWebbleDir, w._id.toString()))
                    .then(files => normalizeDevWebble(w, files));
            }));

        }).then(webbles => res.json(webbles))
            .catch(err => util.resSendError(res, err));
	});

	app.post('/api/takeout/devwebbles/:id', auth.dev, function (req, res) {

	});

};
