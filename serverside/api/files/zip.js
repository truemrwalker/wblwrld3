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
// zip.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');
var archiver = require('archiver');

Promise.promisifyAll(fs);

module.exports = function(app, config, mongoose, gettext, auth) {

	// Test with:
	// https://localhost:7443/api/files/zip/data/WebbleDevPack_Unpacked.zip
	//
	app.get('/api/files/zip/*', function (req, res) {

        var fullPath = req.params[0];

		var baseDir = path.dirname(fullPath);
		var baseName = path.basename(fullPath, '.zip');

        if (!baseDir || !baseName || baseDir.length == 0 || baseName.length == 0)
            return res.status(404).end();

        var directoryToZip = path.join(config.APP_ROOT_DIR, baseDir, baseName);

        return fs.statAsync(directoryToZip).then(function (stat) {

            if (!stat || !stat.isDirectory())
                res.status(404).end();
            else {

                var archive = archiver('zip');

                res.attachment(baseName + '.zip');
                archive.pipe(res);

                archive.directory(directoryToZip, baseName);
                archive.finalize();
            }

        }).catch(function (err) {

            //console.log(err);
            res.status(404).end();
        });
    });
};
