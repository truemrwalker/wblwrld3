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
    function normalizeDevWebble(w) {

        var obj = w.getNormalizedObject(w.files);

        obj.id = w._id;
        obj.is_dev = true;
        return obj;
    }

    ////////////////////////////////////////////////////////////////////
	// Utility functions for routes
	//
    var fsOps = require('../lib/ops/gfsing')(app, config, mongoose, gettext, auth);

    function exportWebble(req, res, webbleDef, webbleTemplates, dir, idGetter) {

        var pack = tar.pack();

        if (webbleDef)
            pack.entry({ name: '_webbleDef.json' }, JSON.stringify(webbleDef));

        return Promise.try(function () {

            if (!webbleTemplates || !Array.isArray(webbleTemplates))
                throw new util.RestError(gettext("Cannot retrieve webbles"));

            // Sequentially		
            return webbleTemplates.reduce(function (soFar, w) {
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

    function importWebble(req, res, is_dev = true) {

        return fsOps.importFiles(req, {}, devWebbleDir,
            function (tarDir) {

                var query = is_dev ? DevWebble.findOne({ $and: [{ _owner: req.user._id }, { 'webble.templateid': tarDir }] })
                    : Webble.findOne({ "webble.templateid": tarDir });

                return query.exec().then(function (w) {

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

            },
            function (w, infoObj) {

                w.mergeWithInfoObject(infoObj);
                return w.save().then(function (savedDoc) { return { obj: savedDoc }; });

            }).then(function (result) {

                if (!is_dev) {

                    let index = util.indexOf(result.others, e => e.name == '_webbleDef.json');
                    if (index != -1) {

                        let webbleDef = JSON.parse(result.others[index].data);
                        res.json(webbleDef);
                    }
                    else
                        res.json(null);
                }
                else
                    res.json(util.transform_(result.objs, normalizeDevWebble));

            }).catch(err => util.resSendError(res, err));

    }

	////////////////////////////////////////////////////////////////////
	// Routes
	//
    app.post('/api/export/webbles', auth.dev, function (req, res) {

        let webbleTemplates = req.body.templates;
        let webbleDef = req.body.webble;

        return Webble.find({ "webble.templateid": { "$in": webbleTemplates } })
            .then(webbles => exportWebble(req, res, webbleDef, webbles, webbleDir, w => w.webble.templateid));
    });

	app.get('/api/takeout/devwebbles', auth.dev, function (req, res) {

        return DevWebble.find({ _owner: req.user._id }).exec()
            .then(webbles => exportWebble(req, res, null, webbles, devWebbleDir, w => w._id.toString()));
	});

//  app.get('/api/takeout/devwebbles/:id', auth.dev, function (req, res) {
//
//      return DevWebble.findById(mongoose.Types.ObjectId(req.params.id)).exec()
//          .then(w => exportWebble(req, res, null, [w], devWebbleDir, w => w._id.toString()));
//  });

	//******************************************************************

    app.post('/api/import/webbles', auth.dev, function (req, res) {
        return importWebble(req, res, false);
    });

    app.post('/api/takeout/devwebbles', auth.dev, function (req, res) {
        return importWebble(req, res);
	});

};
