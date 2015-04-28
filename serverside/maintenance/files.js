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

module.exports = function(Q, app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');

	var rootWebbleDir = config.APP_ROOT_DIR;
	var webbleDir = path.join(rootWebbleDir, 'webbles');
	var devWebbleDir = path.join(rootWebbleDir, 'devwebbles');

	var gfs = new libGfs.GFS(Q, mongoose);

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function walkSync(baseDir, callback) {

		var filenames = fs.readdirSync(baseDir);

		var items = filenames.reduce(function (acc, name) {

			var abspath = path.join(baseDir, name);
			if (fs.statSync(abspath).isDirectory())
				acc.dirs.push(name);
			else
				acc.files.push(name);
			return acc;

		}, {"files": [], "dirs": []});

		callback(baseDir, items.dirs, items.files);

		items.dirs.forEach(function (d) {
			walkSync(path.join(baseDir, d), callback);
		});
	}

	function getWebbleId(cat, id, ver) {
		return null;
	}
	function getDevWebbleId(cat, id, ver) {
		return mongoose.Types.ObjectId(id);
	}

	function syncWebbleFile(baseDir, filename, ownerIdGetter, fileActionLogger) {

		var directory = path.relative(rootWebbleDir, baseDir);

		var pathComponents = directory.split(path.sep);
		var category = pathComponents.length > 0 ? pathComponents[0] : 'webbles';
		var id = pathComponents.length > 1 ? pathComponents[1] : 'unknown';
		var ver = pathComponents.length > 2 ? pathComponents[2] : "0";
		var ownerId = ownerIdGetter(category, id, ver);
		//console.log("Id:", id, "Ver:", ver, "Dir:", directory, "Filename:", filename);

		var localFilePath = path.join(baseDir, filename);

		return Q.all([ Q.nfcall(fs.stat, localFilePath).fail(function(err) { return null; }), gfs.getFile(directory, filename, ownerId) ])
			.spread(function(localStat, remoteFile) {

				var localTime = (localStat && localStat.mtime) || new Date(0);
				var remoteTime = (remoteFile && remoteFile.metadata.mtime) || new Date(0);

				//console.log("LOCAL: ", localStat.mtime, "REMOTE: ", remoteFile.metadata.mtime);

				if (remoteTime.getTime() < localTime.getTime()) {

					return gfs.upload(fs.createReadStream(localFilePath), directory, filename, ownerId, localTime)
						.then(function() { fileActionLogger(localFilePath, remoteFile, true, true); });
				}
				else if (localTime.getTime() < remoteTime.getTime()) {

					return Q.nfcall(fs.stat, baseDir)
						.then(function(stat) { return stat.isDirectory(); }, function(err) { return false; })
						.then(function(result) {

							if (!result)
								return Q.nfcall(mkdirp, baseDir);
						})
						.then(function() {
							return gfs.download(fs.createWriteStream(localFilePath), directory, filename, ownerId);
						})
						.then(function() {

							//console.log("Trying to change modification time of file:", localFilePath, "to:", remoteTime);
							return Q.nfcall(fs.utimes, localFilePath, remoteTime, remoteTime);
						})
						.then(function() { fileActionLogger(localFilePath, remoteFile, true, false); });
				}
				else
					fileActionLogger(localFilePath, remoteFile, false);
			});
	}

	//******************************************************************

	function uploadWebbleFiles(webbleBaseDir, ownerIdGetter, resultPromises, fileActionLogger) {

		try {
			if (!fs.statSync(webbleBaseDir).isDirectory())
				return Q.reject(new Error("Is not a directory"));
		}
		catch(e) {
			return Q.reject(new Error("Directory does not exist"));
		}

		walkSync(webbleBaseDir, function(baseDir, dirs, files) {

			files.forEach(function(f) {
				resultPromises.push(syncWebbleFile(baseDir, f, ownerIdGetter, fileActionLogger));
			});
		});
	}

	//******************************************************************

	function downloadWebbleFiles(excludeList, fileActionLogger) {

		return gfs.listAllFiles(excludeList)
			.then(function(files) {

				var promises = [];
				files.forEach(function(file) {

					console.log("Non existant file:", file.filename);
				});
			});
	}

	//******************************************************************

	var allConsideredRemoteFiles = [];
	function trackSyncedFiles(localPath, remoteFileEntry, wasSynced, wasUploaded) {

		if (wasSynced) {

			if (wasUploaded) {

				console.log("Uploaded local file:", localPath);
				allConsideredRemoteFiles.push(path.relative(rootWebbleDir, localPath));
			}
			else {

				console.log("Downloaded to local file:", localPath);
				allConsideredRemoteFiles.push(remoteFileEntry.filename);
			}
		}
		else
			allConsideredRemoteFiles.push(remoteFileEntry.filename);
	}

	////////////////////////////////////////////////////////////////////
	// Sync webble files
	//

	//return gfs._wipeOutEverythingForEverAndEverAndEver();

	var promises = [];
	uploadWebbleFiles(webbleDir, getWebbleId, promises, trackSyncedFiles);
	uploadWebbleFiles(devWebbleDir, getDevWebbleId, promises, trackSyncedFiles);

	return Q.all(promises)
		.then(function() {
			return downloadWebbleFiles(allConsideredRemoteFiles);
		})
		.fail(function(err) {
			console.error("Error: ", err);
		});

	////////////////////////////////////////////////////////////////////
};
