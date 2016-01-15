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
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');

var libGfs = require('../lib/gfs');
var util = require('../lib/util');
var xfs = require('../lib/xfs');

module.exports = function(Q, app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');

	var rootWebbleDir = config.APP_ROOT_DIR;
	var webbleDir = path.join(rootWebbleDir, 'webbles');
	var devWebbleDir = path.join(rootWebbleDir, 'devwebbles');
    
    var backupDir = path.join(config.APP_ROOT_DIR, 'backup');

	var gfs = new libGfs.GFS(Q, mongoose);

	////////////////////////////////////////////////////////////////////
	// Utility functions
    //
    function statIfExists(localFilePath) {
        return Q.nfcall(fs.stat, localFilePath).catch(function (err) { return null; });
    }
    function changeMTime(localFilePath, mtime) {        
        return Q.nfcall(fs.utimes, localFilePath, 0, mtime);
    }

    function syncWebbleFileEntry(localFilePath, localStat, remoteFile) {
        
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
        
		if (remoteTime < localTime) {
            
            console.log("Sync:", localFilePath, "->", remoteFile.filename, "...", localTime, "->", remoteTime);
            return gfs.uploadToFileEntry(fs.createReadStream(localFilePath), remoteFile, localTime);
		}
		else if (localTime < remoteTime) {
            
            console.log("Sync:", remoteFile.filename, "->", localFilePath, "...", remoteTime, "->", localTime);

            return statIfExists(path.dirname(localFilePath)).then(function (stat) {
                
                if (!stat) // what about if !stat.isDirectory() ?
                    return Q.nfcall(mkdirp, path.dirname(localFilePath));

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
            return Q.reject(new Error("Wrong webble relative directory"));

		var category = pathComponents[0], id = pathComponents[1], ver = pathComponents[2];

        var promise = Q.resolve(null);
        if (category == 'devwebbles') {
            
            try {
                promise = Q.resolve(DevWebble.findById(mongoose.Types.ObjectId(id)).exec());
            }
			catch (err) {
                console.error("Invalid PATH for webble at directory:", relativeDirectory);
            }
        }
        else if (category == 'webbles')
            promise = Q.resolve(Webble.findOne({ "webble.defid": id }).exec());
        else
            return Q.reject(new Error("Cannot recognize webble category"));
        
        return getWebbleIdCache[relativeDirectory] = promise.then(function (webble) {            
            return webble && webble._id;
        });
	}

	//******************************************************************

	function syncLocalWebbleFile(localDir, remoteDir, filename) {

        if (!remoteDir)
            return Q.reject(new Error("Remote directory is wrong"));

        return getWebbleId(remoteDir).then(function (ownerId) {
            
            var localFilePath = path.join(localDir, filename);
            
            return Q.all([statIfExists(localFilePath), gfs.getFile(remoteDir, filename, ownerId)])
                .spread(function (localStat, remoteFile) {
                
                    if (!remoteFile) {
                    
                        console.log("Uploading:", localFilePath, "->", path.join(remoteDir, filename), "...", localStat.mtime);
                        return gfs.upload(fs.createReadStream(localFilePath), remoteDir, filename, ownerId, localStat && localStat.mtime);
                    }
                    return syncWebbleFileEntry(localFilePath, localStat, remoteFile);
                });
        });
	}

	function syncRemoteWebbleFile(remoteFileEntry) {
        
        var localFilePath = path.join(backupDir, remoteFileEntry.filename);

        return statIfExists(localFilePath).then(function (localStat) {
            return syncWebbleFileEntry(localFilePath, localStat, remoteFileEntry);
        });
	}

	//******************************************************************

	function syncLocalWebbleFiles(webbleBaseDir) {

		try {

			if (!fs.statSync(webbleBaseDir).isDirectory())
				return Q.reject(new Error("Is not a directory"));
		}
		catch(e) {

			// This is expected (esp. for devwebbles), so, report success - we've finished!
			return Q.resolve(null);
		}
        
        // Push the tasks to sync the local files
        //
        function processWebbleVersionDir(promises, webbleFilesDir, category, id, version) {

            xfs.walkSync(webbleFilesDir, function (baseDir, dirs, files) {
                
                var remainingPath = path.relative(webbleFilesDir, baseDir);
                var remoteDir = path.join(category, id, version, remainingPath);

                files.forEach(function (f) {
                    
                    if (f != 'info.json') // Skip info.json files
                        promises.push(syncLocalWebbleFile(baseDir, remoteDir, f));
                });
            });
        }

        // Scan directories recursively to find webble dirs
        //
        var category = path.basename(path.relative(rootWebbleDir, webbleBaseDir));
        var promises = [];

        xfs.walkSync(webbleBaseDir, function (baseDir, dirs, files) {
            
            if (files.length === 0 && !util.allTrue(dirs, util.isStringNumber))
                return false;
            else if (files.length === 0) { // We are inside a webble dir that has other version dirs
                
                var id = path.basename(baseDir);
                dirs.forEach(function (versionDir) {
                    processWebbleVersionDir(promises, path.join(baseDir, versionDir), category, id, versionDir);
                });
                return true; // prune
            }
            else {

                var id = path.basename(baseDir), version = "1";
                processWebbleVersionDir(promises, baseDir, category, id, version);
                return true; // prune
            }
        });
		return Q.all(promises);
	}

	//******************************************************************

	function syncBackupFiles() {
        
        // Check and try to fix duplicate files
        var dups = {};

        return gfs.listAllFiles().then(function (files) {
            
            return Q.all(util.transform_(files, function (f) {
                
                if (!f.filename || !f.metadata) // Just log the error for now - TODO: handle it in the future
                    return console.error("Corrupt file in db:", f._id);
                
                // Check and try to fix duplicate files
                //
                if (dups.hasOwnProperty(f.filename)) {
                    
                    console.error("Terminating duplicate file entry:", f.filename);
                    return gfs.deleteFileEntry(f);
                }
                else
                    dups[f.filename] = f;
                // -- end of check of duplicate files

                if (f.metadata._owner)
                    return syncRemoteWebbleFile(f);

                return getWebbleId(f.metadata.directory).then(function (ownerId) {
                    
                    if (ownerId) {
                        
                        console.log("Chowned file:", f.filename);
                        return gfs.chownFileEntry(f, ownerId);
                    }
                    console.log("Orphan file:", f.filename);

                }).then(function () {
                    return syncRemoteWebbleFile(f);
                });
            }));
        });
	}

	////////////////////////////////////////////////////////////////////
	// Sync webble files
	//

	//return gfs._wipeOutEverythingForEverAndEverAndEver();

    return syncLocalWebbleFiles(webbleDir).then(function () {
        
        // This is only for backwards compatibility
        return syncLocalWebbleFiles(devWebbleDir);

    }).then(function () {
        return syncBackupFiles();
    }).catch(function (err) {
        console.error("File Sync Error:", err, "--", err.stack);
    });

	////////////////////////////////////////////////////////////////////
};
