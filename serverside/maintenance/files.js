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
 * @overview Autonomous maintenance script that synchronizes all the Webble Template files under the
 * config.APP_ROOT_DIR/webbles/ sub-directory and all its sub-directories recursively.
 *
 * The script creates, modifies and deletes files in the database depending on their status on disk.
 * This is important so that the Webble World development team can develop Webbles offline and commit
 * them to the same repository as the main Webble World application. There's another component that
 * synchronizes files, but does it in realtime when the server is running in "development" mode. That
 * component is implemented in control/autosync.js.
 *
 * In addition to the above the script also backups (synchronizes) all the files in the database in a
 * sub-directory called backup under the config.APP_ROOT_DIR directory.
 * 
 * Note that "DevWebbles" are normal Webbles that are unpublished (sometimes referred to as Sandbox Webbles).
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');

var libGfs = require('../lib/gfs');
var util = require('../lib/util');
var xfs = require('../lib/xfs');

var mkdirpAsync = Promise.promisify(mkdirp);
Promise.promisifyAll(fs);

module.exports = function(app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');

	var rootWebbleDir = config.APP_ROOT_DIR;
	var webbleDir = path.join(rootWebbleDir, 'webbles');

    var backupDir = path.join(config.APP_ROOT_DIR, 'backup');

	var gfs = new libGfs.GFS(mongoose);

	////////////////////////////////////////////////////////////////////
	// Utility functions
    //
    function statIfExists(localFilePath) {
        return fs.statAsync(localFilePath).catchReturn(null);
    }

    function changeMTime(localFilePath, mtime) {
        return fs.utimesAsync(localFilePath, 0, mtime);
    }

    function syncWebbleFileEntry(localFilePath, localStat, remoteFile, oneWayToLocal = false) {

		var localTime = (localStat && localStat.mtime) || new Date(0);
		var remoteTime = (remoteFile && remoteFile.metadata && remoteFile.metadata.mtime) || new Date(0);

        // This is here just for backwards compatibility
        // remoteTime used to be stored as integer unix timestamps
        //
        if ((typeof remoteTime) == 'number')
            remoteTime = new Date(remoteTime * 1000);
        // -- end backwards compatibility

        remoteTime.setMilliseconds(0); // Reset the milliseconds because stat values have seconds granularity
        localTime.setMilliseconds(0);

        if (!oneWayToLocal && remoteTime < localTime) {

            console.log("Sync:", localFilePath, "->", remoteFile.filename, "...", localTime, "->", remoteTime);
            return gfs.uploadToFileEntry(fs.createReadStream(localFilePath), remoteFile, localTime);
		}
		else if (localTime < remoteTime) {

            console.log("Sync:", remoteFile.filename, "->", localFilePath, "...", remoteTime, "->", localTime);

            return statIfExists(path.dirname(localFilePath)).then(function (stat) {

                if (!stat) // what about if !stat.isDirectory() ?
                    return mkdirpAsync(path.dirname(localFilePath));

            }).then(function () {
                return gfs.downloadFromFileEntryUntilClosed(fs.createWriteStream(localFilePath), remoteFile);
            }).then(function () {
                return changeMTime(localFilePath, remoteTime);
            });
		}
	}

	//******************************************************************

	var getWebbleIdCache = {};

	function getWebbleId(relativeDirectory) {

        if (getWebbleIdCache.hasOwnProperty(relativeDirectory))
            return getWebbleIdCache[relativeDirectory].then(function (webbleId) { return webbleId; });

        var pathComponents = relativeDirectory.split(path.sep);        
        if (pathComponents.length < 3)
            return Promise.reject(new Error("Wrong webble relative directory"));

		var category = pathComponents[0], id = pathComponents[1], ver = pathComponents[2];

        var promise = Promise.resolve(null);
        if (category == 'devwebbles') {

            try {
                promise = Promise.resolve(DevWebble.findById(mongoose.Types.ObjectId(id)).exec());
            }
			catch (err) {
                console.error("Invalid PATH for webble at directory:", relativeDirectory);
            }
        }
        else if (category == 'webbles')
            promise = Promise.resolve(Webble.findOne({ "webble.defid": id }).exec());
        else
            return Promise.reject(new Error("Cannot recognize webble category"));

        return getWebbleIdCache[relativeDirectory] = promise.then(function (webble) {
            return webble && webble._id;
        });
	}

	//******************************************************************
    // Filenames can contain internal dirs relative to localDir

	function syncFiles(localDir, remoteDir, localFiles, remoteFiles) {

        if (!remoteDir)
            return Promise.reject(new Error("Remote directory is wrong"));

        var remoteFilesRelDir = remoteFiles.map(f => path.relative(remoteDir, f.filename));
        localFiles = localFiles.filter(lf => lf !== 'info.json');

        return getWebbleId(remoteDir).then(function (ownerId) {

            var promises = [];
            localFiles.forEach(function (filename) {

                var remoteFile = null;
                var index = util.indexOf(remoteFilesRelDir, r => r === filename);
                if (index !== -1) {

                    remoteFile = remoteFiles[index];
                    remoteFiles.splice(index, 1);
                    remoteFilesRelDir.splice(index, 1);
                }

                var localFilePath = path.join(localDir, filename);
                promises.push(statIfExists(localFilePath).then(function (localStat) {

                    if (!localStat && remoteFile) {

                        console.log("WARNING: DELETING online file:", remoteFile.filename);
                        return gfs.deleteFileEntry(remoteFile);
                    }
                    else if (!remoteFile) {

                        var remoteFilePath = path.join(remoteDir, filename);
                        console.log("Uploading:", localFilePath, "->", remoteFilePath, "...", localStat.mtime);

                        return gfs.upload(fs.createReadStream(localFilePath), path.dirname(remoteFilePath),
                            path.basename(remoteFilePath), ownerId, localStat && localStat.mtime);
                    }
                    else
                        return syncWebbleFileEntry(localFilePath, localStat, remoteFile);
                }));
            });

            remoteFiles.forEach(function (remoteFile) {

                console.log("WARNING: DELETING online file:", remoteFile.filename);
                promises.push(gfs.deleteFileEntry(remoteFile));
            });
            return Promise.all(promises);

        }, function (err) { // When getWebbleId is rejected

            console.log("Corrupt/unexpected files found under remote directory:", remoteDir);
            //return Promise.all(remoteFiles.map(f => gfs.deleteFileEntry(f)));
        });
	}

	//******************************************************************

	function syncLocalWebbleFiles(webbleBaseDir) {

        // Push the tasks to sync the local files
        //
        function processWebbleVersionDir(promises, webbleFilesDir, category, id, version) {

            return xfs.getAllFiles(webbleFilesDir, null, 10).then(function (localFiles) {

                var remoteDir = path.join(category, id, version);

                promises.push(gfs.getFiles(remoteDir).then(function (remoteFiles) {
                    return syncFiles(webbleFilesDir, remoteDir, localFiles, remoteFiles);
                }));
            });
        }

        return Promise.try(function () {

            // Scan directories recursively to find webble dirs
            //
            var category = path.basename(path.relative(rootWebbleDir, webbleBaseDir));
            var promises = [];

            return xfs.walk(webbleBaseDir, function (baseDir, dirs, files) {

                if (files.length === 0 && !util.allTrue(dirs, util.isStringNumber))
                    return false; // Continue recursing

                if (files.length === 0) { // We are inside a webble dir that has other version dirs

                    var id = path.basename(baseDir);
                    return Promise.all(dirs.map(function (versionDir) {
                        return processWebbleVersionDir(promises, path.join(baseDir, versionDir), category, id, versionDir);
                    }));
                }
                else {

                    var id = path.basename(baseDir), version = "1";
                    return processWebbleVersionDir(promises, baseDir, category, id, version);
                }

            }).then(function () {
                return Promise.all(promises);
            });
        });
	}

	//******************************************************************

    function backupRemoteFile(remoteFileEntry) {

        var localFilePath = path.join(backupDir, remoteFileEntry.filename);

        return statIfExists(localFilePath).then(function (localStat) {
            return syncWebbleFileEntry(localFilePath, localStat, remoteFileEntry, true);
        });
    }

	function syncBackupFiles() {

        // Check and try to fix duplicate files
        var dups = {};

        return gfs.listAllFiles().then(function (files) {

            return Promise.all(util.transform_(files, function (f) {

                if (!f.filename || !f.metadata) {

                    console.error("WARNING: DELETING corrupt file in db:", f._id);
                    return gfs.deleteFileEntry(f);
                }
                else if (dups.hasOwnProperty(f.filename)) {

                    console.error("WARNING: DELETING duplicate file entry:", f.filename);
                    return gfs.deleteFileEntry(f);
                }

                dups[f.filename] = f;

                if (f.metadata._owner || f.metadata.directory === 'images')
                    return backupRemoteFile(f);

                return getWebbleId(f.metadata.directory).then(function (ownerId) {

                    if (ownerId) {

                        console.log("Chowned file:", f.filename);
                        return gfs.chownFileEntry(f, ownerId);
                    }
                    //console.log("Orphan file:", f.filename);

                }, function (err) { // When getWebbleId is rejected

                    console.log("WARNING: Unexpected file:", f.filename, "(Deleting)");
                    return gfs.deleteFileEntry(f);

                }).then(function () {
                    return backupRemoteFile(f);
                });
            }));
        });
	}

	////////////////////////////////////////////////////////////////////
	// Sync webble files
	//

	//return gfs._wipeOutEverythingForEverAndEverAndEver();

    return syncLocalWebbleFiles(webbleDir)
        .then(syncBackupFiles).catch(err => console.error("File Sync Error:", err, "--", err.stack));

	////////////////////////////////////////////////////////////////////
};
