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
// autosync.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");
var path = require('path');
var fs = require('fs');

function startFsMonitor(webbleDir, mongoose) {
	
	// Local Imports	
	var util = require('../lib/util');	
	var libGfs = require('../lib/gfs');

    function onFileChange(localFile, stat) {

        var localDir = path.relative(webbleDir, path.dirname(localFile)).split(path.sep);
        var verIndex = util.lastIndexOf(localDir, util.isStringNumber);

        if (verIndex == -1 || verIndex == 0) {
            console.log("Error updating file:", localFile);
            return;
        }

        var id = localDir[verIndex - 1], version = localDir[verIndex];
        var remainingPath = localDir.slice(verIndex + 1).join(path.sep);

        var filename = path.basename(localFile);
        var remoteDir = path.join('webbles', id, version, remainingPath);

        if (!stat) {

            return gfs.deleteFile(remoteDir, filename)
                .then(() => console.log("DEBUG: Deleted file:", localFile))
                .catch(err => console.log("Error Deleting file:", err));
        }
        else if (!stat.isFile() || filename.toLowerCase() == 'info.json') {

            console.log("DEBUG: Skipping file:", localFile);
            return Promise.resolve();
        }
        else {

            return gfs.upload(fs.createReadStream(localFile), remoteDir, filename)
                .then(() => console.log("DEBUG: Updated file:", localFile, "->", path.join(remoteDir, filename)))
                .catch(err => console.log("Error updating file:", err));
        }
    }

	// Implementation
	var watcher = require('chokidar').watch(webbleDir, {
		ignored: /[\/\\]\./,
		persistent: true,
		ignoreInitial: true
	});
	
	var gfs = new libGfs.GFS(mongoose);
	
    // 'add' is handled by 'change'
    watcher.on('change', onFileChange);
    watcher.on('unlink', onFileChange);
}

module.exports = function (app, config, mongoose, gettext, webServer) {
	
	var autoSyncActive = false;

	if (config.DEPLOYMENT == 'development') {

		try {
			startFsMonitor(path.join(config.APP_ROOT_DIR, 'webbles'), mongoose);
			autoSyncActive = true;
		}
		catch (err) {
			console.log("Error enabling file autosync", err);
		}
	}

};
