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
// gfs.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

var util = require('./util');

var mime = require('mime-types');
var path = require('path');

var GridFS = require('gridfs-stream');

module.exports.GFS = function (Q, mongoose) {

	var gfs = GridFS(mongoose.connection.db, mongoose.mongo);

	// Generate a GFS filename
	//
	function genFn(directory, filename) {
		return path.join(directory, filename);
	}

	function genAliases(directory) {

		var result = [];
		var currPath = '';
		directory.split(path.sep).forEach(function(component) {
			currPath = path.join(currPath, component);
			result.push(currPath);
		});
		return result;
	}

	// Get a file
	//
	this.getFile = function(directory, filename, ownerId) {

		var deferred = Q.defer();

		gfs.findOne({
			filename: genFn(directory, filename),
			metadata: { _owner: ownerId }
		}, function(err, file) {

			if (err)
				deferred.reject(err);
			else
				deferred.resolve(file);
		});
		return deferred.promise;
	};

	// Get multiple files
	//
	this.getFiles = function(directory, ownerId) {

		var deferred = Q.defer();

		gfs.files.find({
			filename: directory,
			metadata: { _owner: ownerId }
		}).toArray(function(err, files) {

			if (err)
				deferred.reject(err);
			else
				deferred.resolve(files);
		});
		return deferred.promise;
	};

	// Move files
	//
	this.moveFileEntry = function(fileEntry, toDirectory) {

		var index = fileEntry.aliases.indexOf(fileEntry.metadata.directory);
		if (index != -1)
			fileEntry.aliases.splice(index, 1);

		fileEntry.aliases.push(toDirectory);
		fileEntry.metadata.directory = toDirectory;
		fileEntry.filename = genFn(toDirectory, fileEntry.metadata.filename);

		return Q.ninvoke(fileEntry, "save");
	};

	this.moveFiles = function(fromDirectory, toDirectory, ownerId) {

		var self = this;
		return self.getFiles(fromDirectory, ownerId).then(function(files) {

			return Q.all(util.transform_(files, function (f) {
				return self.moveFileEntry(f, toDirectory);
			}));
		});
	};

	// Copy files
	//
	this.copyFileEntry = function(fileEntry, toDirectory, ownerId) {

		var readStream = gfs.createReadStream(fileEntry);
		return this.upload(readStream, toDirectory, fileEntry.filename, ownerId);
	};

	this.copyFiles = function(fromDirectory, toDirectory, ownerId) {

		var self = this;
		return self.getFiles(fromDirectory, undefined).then(function(files) {

			return Q.all(util.transform_(files, function (f) {
				return self.copyFileEntry(f, toDirectory, ownerId);
			}));
		});
	};

	// Delete a file
	//
	this.deleteFiles = function(directory, ownerId) {

		var self = this;
		return self.getFiles(directory, ownerId).then(function(files) {

			return Q.all(util.transform_(files, function (f) {
				return self.deleteFileEntry(f);
			}));
		});
	};

	this.deleteFile = function(directory, filename, ownerId) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {
			return self.deleteFileEntry(file);
		});
	};

	this.deleteFileEntry = function(fileEntry) {

		var deferred = Q.defer();

		gfs.remove(fileEntry, function(err) {
			if (err)
				deferred.reject(err);
			else
				deferred.resolve();
		});
		return deferred.promise;
	};

	// Create a write stream
	//
	this.createWriteStream = function(directory, filename, ownerId) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {

			if (file)
				return self.deleteFileEntry(file);

		}).then(function(){

			return gfs.createWriteStream({
				filename: genFn(directory, filename),
				aliases: genAliases(directory),
				mode: 'w',
				content_type: mime.lookup(filename) || 'application/octet-stream',
				metadata: {
					directory: directory,
					filename: filename,
					_owner: ownerId
				}
			});
		});
	};

	// Create a write stream
	//
	this.createReadStream = function(directory, filename, ownerId) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {

			if (!file)
				throw new Error("File does not exist");

			return gfs.createReadStream(file);
		});
	};

	// Upload
	//
	this.upload = function(readStream, directory, filename, ownerId) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId).then(function(writeStream) {

			return Q.Promise(function(resolve, reject, notify) {

				readStream.pipe(writeStream);
				writeStream.once('error', reject);
				writeStream.once('close', resolve);
			});
		});
	};

	this.uploadData = function(data, encoding, directory, filename, ownerId) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId).then(function(writeStream) {

			return Q.Promise(function(resolve, reject, notify) {

				writeStream.once('error', reject);
				writeStream.once('close', function() { resolve(data); });

				writeStream.setEncoding(encoding);
				writeStream.write(data);
				writeStream.end();
			});
		});
	};

	// Download
	//
	this.download = function(writeStream, directory, filename, ownerId) {

		var self = this;
		return self.createReadStream(directory, filename, ownerId).then(function(readStream) {

			return Q.Promise(function(resolve, reject, notify) {

				readStream.pipe(writeStream);
				writeStream.once('error', reject);
				writeStream.once('close', resolve);
			});
		});
	};

	this.downloadData = function(encoding, directory, filename, ownerId) {

		var self = this;
		return self.createReadStream(directory, filename, ownerId).then(function(readStream) {

			return Q.Promise(function(resolve, reject, notify) {

				var data = '';
				readStream.setEncoding(encoding);
				readStream.once('error', reject);
				readStream.on('data', function(chunk) { data += chunk; });
				readStream.on('end', function() { resolve(data); });
			});
		});
	};
};
