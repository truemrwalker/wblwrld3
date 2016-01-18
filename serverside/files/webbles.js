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
// files.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var libGfs = require('../lib/gfs');
var path = require('path');

module.exports = function(app, config, mongoose, gettext, auth) {

	var gfs = new libGfs.GFS(mongoose);

	// Just in case we are running on localhost on windows
	//
	var getFileWithPath = gfs.getFileWithPath;

	if (path.sep != '/') {

		getFileWithPath = function (fullPath) {
			return gfs.getFileWithPath(fullPath.replace(/\//g, path.sep));
		};
	}

	// Test with:
	// https://localhost:7443/files/webbles/LearningCube/1/images/grasslight-big.jpg
	//
	app.get('/files/*', function (req, res) {

		var fullPath = req.params[0];
		//var directory = path.dirname(fullPath);
		//var filename = path.basename(fullPath);

		getFileWithPath(fullPath)
			.then(function(fileEntry) {

				if (!fileEntry)
					res.status(404).end();
				else {

					res.set('Content-Type', fileEntry.contentType);
					res.set('Content-Length', fileEntry.length);
					res.set('Cache-Control', "max-age=3600");

					return gfs.downloadFromFileEntry(res, fileEntry);
				}
			})
			.catch(function(err) {

				console.log(err);
				res.status(404).end();
			})
			.done();
	});
};
