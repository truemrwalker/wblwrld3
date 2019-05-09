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
 * @overview Monitors and synchronizes all the Webble Template files under the config.APP_ROOT_DIR/webbles/
 * sub-directory and all its sub-directories recursively, in real-time when the server is run
 * in "development" mode.
 *
 * The script creates, modifies and deletes files in the database depending on their status on disk.
 * This is important so that the Webble World development team can develop Webbles offline and test
 * them quickly without needing to restart the server. There's another component that synchronizes files,
 * but only does it at startup when the server is run under "maintenance" or "development" mode. That
 * component is implemented in maintenance/files.js.
 *
 * @author Giannis Georgalis
 */

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
        else if (!stat.isFile()/* || filename.toLowerCase() == 'info.json'*/) {

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

    watcher.on('add', onFileChange);
    watcher.on('change', onFileChange);
    watcher.on('unlink', onFileChange);
}

module.exports = function (app, config, mongoose, gettext, webServer) {

	if (config.DEPLOYMENT == 'development') {

		try {
			startFsMonitor(path.join(config.APP_ROOT_DIR, 'webbles'), mongoose);
		}
		catch (err) {
			console.log("Error enabling file autosync", err);
		}
	}

};
