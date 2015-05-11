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

	function syncWebbleFileEntry(localFilePath, localStat, remoteFile, fileActionLogger) {

		var localTime = util.toUnixTimestamp((localStat && localStat.mtime) || new Date(0));
		var remoteTime = util.toUnixTimestamp((remoteFile && remoteFile.metadata.mtime) || new Date(0));

		if (remoteTime < localTime) {

			return gfs.uploadToFileEntry(fs.createReadStream(localFilePath), remoteFile, localTime)
				.then(function() {
					return fileActionLogger(localFilePath, remoteFile, true, true);
				});
		}
		else if (localTime < remoteTime) {

			var baseDir = path.dirname(localFilePath);

			return Q.nfcall(fs.stat, baseDir)
				.then(function(stat) { return stat.isDirectory(); }, function(err) { return false; })
				.then(function(result) {

					if (!result)
						return Q.nfcall(mkdirp, baseDir);
				})
				.then(function() {
					return gfs.downloadFromFileEntry(fs.createWriteStream(localFilePath), remoteFile);
				})
				.then(function() {
					return Q.nfcall(fs.utimes, localFilePath, remoteTime, remoteTime);
				})
				.then(function() {
					return fileActionLogger(localFilePath, remoteFile, true, false);
				});
		}
		else
			return Q.resolve(fileActionLogger(localFilePath, remoteFile, false));
	}

	//******************************************************************

	var getWebbleIdCache = {};

	function getWebbleId(relativeDirectory) {

		if (getWebbleIdCache.hasOwnProperty(relativeDirectory))
			return Q.resolve(getWebbleIdCache[relativeDirectory]);

		var pathComponents = relativeDirectory.split(path.sep);
		var category = pathComponents.length > 0 ? pathComponents[0] : 'webbles';
		var id = pathComponents.length > 1 ? pathComponents[1] : 'unknown';
		var ver = pathComponents.length > 2 ? pathComponents[2] : "0";

		var query = null;
		if (category == 'devwebbles')
			query = DevWebble.findById(mongoose.Types.ObjectId(id));
		else if (category == 'webbles')
			query = Webble.findOne({ "webble.defid": id });

		return !query ? Q.reject(new Error("Cannot recognize webble category")) :
			Q(query.exec()).then(function(webble) {

				var currWebbleId = webble && webble._id;
				getWebbleIdCache[relativeDirectory] = currWebbleId;
				return currWebbleId;
			});
	}

	//******************************************************************

	function syncLocalWebbleFile(baseDir, filename, evenWithoutOwnerId, fileActionLogger) {

		var directory = path.relative(rootWebbleDir, baseDir);

		return getWebbleId(directory)
			.then(function(ownerId) {

				var localFilePath = path.join(baseDir, filename);

				if (!ownerId && !evenWithoutOwnerId) // Sync only if the webble actually exists
					return fileActionLogger(localFilePath, null, false);

				return Q.all([ Q.nfcall(fs.stat, localFilePath).fail(function(err) { return null; }), gfs.getFile(directory, filename, ownerId) ])
					.spread(function(localStat, remoteFile) {

						return remoteFile ? syncWebbleFileEntry(localFilePath, localStat, remoteFile, fileActionLogger) :
							gfs.upload(fs.createReadStream(localFilePath), directory, filename, ownerId, localStat && localStat.mtime)
								.then(function() {
									return fileActionLogger(localFilePath, remoteFile, true, true);
								});
					});
			});
	}

	function syncRemoteWebbleFile(remoteFileEntry, evenWithoutOwnerId, fileActionLogger) {

		return getWebbleId(remoteFileEntry.metadata.directory)
			.then(function(ownerId) {

				var localFilePath = path.join(rootWebbleDir, remoteFileEntry.filename);

				if (!ownerId && !evenWithoutOwnerId) // Sync only if the webble actually exists
					return fileActionLogger(localFilePath, remoteFileEntry, false);

				return syncWebbleFileEntry(localFilePath, null, remoteFileEntry, fileActionLogger);
			});
	}

	//******************************************************************

	function syncLocalWebbleFiles(webbleBaseDir, evenWithoutOwnerId, fileActionLogger) {

		try {
			if (!fs.statSync(webbleBaseDir).isDirectory())
				return Q.reject(new Error("Is not a directory"));
		}
		catch(e) {
			return Q.reject(new Error("Directory does not exist"));
		}

		var promises = [];
		walkSync(webbleBaseDir, function(baseDir, dirs, files) {

			files.forEach(function(f) {

				if (f != 'info.json') // Skip info.json files
					promises.push(syncLocalWebbleFile(baseDir, f, evenWithoutOwnerId, fileActionLogger));
			});
		});
		return Q.all(promises);
	}

	//******************************************************************

	function downloadRemainingWebbleFiles(excludeList, fileActionLogger) {

		return gfs.listAllFiles(excludeList)
			.then(function(files) {

				return Q.all(util.transform_(files, function(f) {
					return syncRemoteWebbleFile(f, false, fileActionLogger);
				}));
			});
	}

	//******************************************************************

	function handleOrphanFiles(excludeList) {

		return gfs.listAllFiles(excludeList, null)
			.then(function(files) {

				return Q.all(util.transform_(files, function(f) {

					return getWebbleId(f.metadata.directory)
						.then(function(ownerId) {

							if (ownerId) {

								console.log("Chowned file:", f.filename);
								return gfs.chownFileEntry(f, ownerId);
							}
							else
								console.log("Orphaned file:", f.filename);
						});
				}));
			});
	}

	////////////////////////////////////////////////////////////////////
	// Sync webble files
	//
	var allConsideredRemoteFiles = [];

	function trackSyncedFiles(localPath, remoteFileEntry, wasModified, wasUploaded) {

		if (wasModified) {

			if (wasUploaded) {

				console.log("Uploaded local file:", localPath);
				allConsideredRemoteFiles.push(path.relative(rootWebbleDir, localPath));
			}
			else {

				console.log("Downloaded to local file:", localPath);
				allConsideredRemoteFiles.push(remoteFileEntry.filename);
			}
		}
		else if (remoteFileEntry)
			allConsideredRemoteFiles.push(remoteFileEntry.filename);
	}

	//******************************************************************

	//return gfs._wipeOutEverythingForEverAndEverAndEver();

	return syncLocalWebbleFiles(webbleDir, true, trackSyncedFiles)
		.then(function() {
			return syncLocalWebbleFiles(devWebbleDir, false, trackSyncedFiles);
		})
		.then(function() {
			return downloadRemainingWebbleFiles(allConsideredRemoteFiles, trackSyncedFiles);
		})
		.then(function() {
			return handleOrphanFiles();
		})
		.fail(function(err) {
			console.error("Error: ", err);
		});

	////////////////////////////////////////////////////////////////////
};
