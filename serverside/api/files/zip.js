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
 * @overview REST endpoints for creating zip archives from local directories.
 * @module api/files
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');
var archiver = require('archiver');

Promise.promisifyAll(fs);

module.exports = function(app, config, mongoose, gettext, auth) {

	// Test with:
	// https://localhost:7443/api/files/zip/data/WebbleDevPack.zip
	//
	app.get('/api/files/zip/*', function (req, res) {

        var fullPath = req.params[0];

		var baseDir = path.dirname(fullPath);
		var baseName = path.basename(fullPath, '.zip');

        if (!baseDir || !baseName || baseDir.length == 0 || baseName.length == 0)
            return res.status(404).end();

	    //-- this is not very safe (can zip and download any folder
	    //-- in the serverside installation app directory)
            // var directoryToZip = path.join(config.APP_ROOT_DIR, baseDir, baseName);
	    

	    // this is pretty restrictive (only allows A to Z and
	    // numbers in filenamea and directory names, but let's be
	    // overly restrictive to avoid spending lots of time on
	    // sanitizing user input.
            directoryToZip = path.join(config.APP_ROOT_DIR, baseDir.replace(/[^A-Za-z0-9\/\\]/g, "_"), baseName.replace(/[^A-Za-z0-9]/g, "_"));

	    if(baseDir.substr(0, 4) != "data") { // everything we want people to download should be under this folder
		return res.status(404).end();
	    }
	    


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
