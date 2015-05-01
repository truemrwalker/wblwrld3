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

var mime = require('mime');
var path = require('path');

var GridFS = require('gridfs-stream');

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function gettext(msg) { return msg; }

// Generate a GFS filename
function genFn(directory, filename) {
	return path.join(directory, filename);
}

// Generate Path aliases
function genAliases(directory) {

	var result = [];
	var currPath = '';

	directory.split(path.sep).forEach(function(component) {

		currPath = path.join(currPath, component);
		result.push(currPath);
	});
	return result;
}

// Generate a mongodb query
function genQuery(directory, filename, ownerId) {

	var query = {};

	if (filename)
		query.filename = genFn(directory, filename);
	else
		query.aliases = directory;

	// Querying including onwnerId doesn't work...but anyway we don't need it for now
	//
	//if (ownerId)
	//	query.metadata = { _owner: ownerId };

	return query;
}

////////////////////////////////////////////////////////////////////////
// GFS class thing
//
module.exports.GFS = function (Q, mongoose) {

	var gfs = GridFS(mongoose.connection.db, mongoose.mongo);

	// Get a file
	//
	this.getFile = function(directory, filename, ownerId) {
		return Q.ninvoke(gfs, "findOne", genQuery(directory, filename, ownerId));
	};

	// Get multiple files
	//
	this.listAllFiles = function(excludeFilesList, ownerId) {
		return Q.ninvoke(gfs.files.find({ filename: { $nin: excludeFilesList } }), "toArray");
	};

	this.getFiles = function(directory, ownerId) {

		var q = gfs.files.find(genQuery(directory, null, ownerId));
		return Q.ninvoke(q, "toArray");
	};

	// Move files
	//
	this.moveFileEntry = function(fileEntry, toDirectory) {

		// For some reason this works... but can't we wait for it (?)
		var q = gfs.files.update({ _id: fileEntry._id }, { '$set': {
			filename: genFn(toDirectory, fileEntry.metadata.filename),
			aliases: genAliases(toDirectory),
			"metadata.directory": toDirectory
		}});
		return Q.resolve(q);
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
		return this.upload(readStream, toDirectory, fileEntry.metadata.filename, ownerId);
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
		return Q.ninvoke(gfs, "remove", fileEntry);
	};

	// Just for the occasional spring-cleaning & testing
	this._wipeOutEverythingForEverAndEverAndEver = function() {

		var self = this;
		return Q.ninvoke(gfs.files.find({}), "toArray").then(function(files) {
			return Q.all(util.transform_(files, function(f) {
				return self.deleteFileEntry(f).then(function() {
					console.log("WIPED OUT FILE:", f.filename);
				});
			}));
		});
	};

	// Create a write stream
	//
	this.createWriteStream = function(directory, filename, ownerId, unixTimestamp) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {

			var mtime = util.toUnixTimestamp(unixTimestamp || new Date());

			if (file) {

				// For some reason this works... but can't we wait for it (?)
				gfs.files.update({ _id: file._id }, { '$set': { "metadata.mtime": mtime }});
				return gfs.createWriteStream({_id: file._id, mode: 'w'});
			}
			else {

				return gfs.createWriteStream({
					filename: genFn(directory, filename),
					aliases: genAliases(directory),
					mode: 'w',
					content_type: mime.lookup(filename) || 'application/octet-stream',
					metadata: {
						directory: directory,
						filename: filename,
						mtime: mtime,
						_owner: ownerId
					}
				});
			}
		});
	};

	// Create a write stream
	//
	this.createReadStream = function(directory, filename, ownerId) {

		return Q.resolve(gfs.createReadStream(genQuery(directory, filename, ownerId)));

		//var self = this;
		//return self.getFile(directory, filename, ownerId).then(function(file) {
        //
		//	if (!file)
		//		throw new Error(gettext("File does not exist"));
        //
		//	return gfs.createReadStream(file);
		//});
	};

	// Upload
	//
	this.upload = function(readStream, directory, filename, ownerId, unixTimestamp) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId, unixTimestamp).then(function(writeStream) {

			return Q.Promise(function(resolve, reject) {

				readStream.pipe(writeStream);
				readStream.once('error', reject);

				writeStream.once('error', reject);
				writeStream.once('close', resolve);
			});
		});
	};

	this.uploadToFileEntry = function(readStream, fileEntry, unixTimestamp) {

		return Q.Promise(function(resolve, reject) {

			var mtime = util.toUnixTimestamp(unixTimestamp || new Date());

			// For some reason this works... but can't we wait for it (?)
			gfs.files.update({ _id: fileEntry._id }, { '$set': { "metadata.mtime": mtime }});
			var writeStream = gfs.createWriteStream({_id: fileEntry._id, mode: 'w'});

			readStream.pipe(writeStream);
			readStream.once('error', reject);

			writeStream.once('error', reject);
			writeStream.once('close', resolve);
		});
	};

	this.uploadData = function(data, encoding, directory, filename, ownerId) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId).then(function(writeStream) {

			return Q.Promise(function(resolve, reject) {

				writeStream.once('error', reject);
				writeStream.once('close', function() { resolve(data); });

				//writeStream.setEncoding(encoding); // [TypeError: Object #<GridWriteStream> has no method 'setEncoding']
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

			return Q.Promise(function(resolve, reject) {

				readStream.pipe(writeStream);
				readStream.once('error', reject);

				writeStream.once('error', reject);
				writeStream.once('finish', resolve);
			});
		});
	};

	this.downloadData = function(encoding, directory, filename, ownerId) {

		var self = this;
		return self.createReadStream(directory, filename, ownerId).then(function(readStream) {

			return Q.Promise(function(resolve, reject) {

				var data = '';
				readStream.setEncoding(encoding);
				readStream.once('error', reject);
				readStream.on('data', function(chunk) { data += chunk; });
				readStream.on('end', function() { resolve(data); });
			});
		});
	};

	this.downloadFromFileEntry = function(writeStream, fileEntry) {

		return Q.Promise(function(resolve, reject) {

			var readStream = gfs.createReadStream(fileEntry);

			readStream.pipe(writeStream);
			readStream.once('error', reject);

			writeStream.once('error', reject);
			writeStream.once('finish', resolve);
		});
	};
};
