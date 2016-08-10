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
var Promise = require("bluebird");

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

	// Disabled for now
	//if (ownerId !== undefined)
	//	query["metadata._owner"] = ownerId;

	return query;
}

////////////////////////////////////////////////////////////////////////
// GFS class thing
//
module.exports.GFS = function (mongoose) {

    var gfs = GridFS(mongoose.connection.db, mongoose.mongo);
    Promise.promisifyAll(gfs);
    
    // Wrapper for updating the gsf.files collection and returning a promise:
    // Seems that new versions of the node-mongodb-native driver (2.0+) already return promises:
    //      http://mongodb.github.io/node-mongodb-native/2.0/api/lib_collection.js.html
    // Also this indicates that gfs.files etc. are native collections:
    //      https://github.com/aheckmann/gridfs-stream/blob/master/lib/index.js
    //
    function update(query, data) {
        return gfs.files.update(query, data);
    }

	// Get a file
	//
	this.getFileWithPath = function(fullPath, ownerId) {
		return gfs.findOneAsync({ filename: fullPath });
	};

	this.getFile = function(directory, filename, ownerId) {
		return gfs.findOneAsync(genQuery(directory, filename, ownerId));
	};

	// Get multiple files
	//
	this.listAllFiles = function(excludeFilesList, ownerId) {

		var options = {};

		if (excludeFilesList)
			options.filename = { $nin: excludeFilesList };
		if (ownerId !== undefined)
			options["metadata._owner"] = ownerId;
        
        // While .update() above returns a promise, .find() returns a Cursor, see here:
        //      http://mongodb.github.io/node-mongodb-native/2.0/api/Cursor.html
        // Then, cursor.toArray() returns a promise
        //
		return gfs.files.find(options).toArray();
	};

	this.getFiles = function(directory, ownerId) {
		return gfs.files.find(genQuery(directory, null, ownerId)).toArray(); // ditto
	};

	// Move files
	//
	this.moveFileEntry = function(fileEntry, toDirectory) {
        
        var self = this;
        var newFilename = genFn(toDirectory, fileEntry.metadata.filename);

        return self.getFileWithPath(newFilename).then(function (oldFile) {

            return update({ _id: fileEntry._id }, {
                '$set': {
                    filename: newFilename,
                    aliases: genAliases(toDirectory),
                    "metadata.directory": toDirectory
                }
            }).then(function () {

                if (oldFile)
                    return self.deleteFileEntry(oldFile);
            });
        });

	};

	this.moveFiles = function(fromDirectory, toDirectory, ownerId) {

		var self = this;
		return self.getFiles(fromDirectory, ownerId).then(function(files) {

			return Promise.all(util.transform_(files, function (f) {
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

			return Promise.all(util.transform_(files, function (f) {
				return self.copyFileEntry(f, toDirectory, ownerId);
			}));
		});
	};

	// Delete a file
	//
	this.deleteFiles = function(directory, ownerId) {

		var self = this;
		return self.getFiles(directory, ownerId).then(function(files) {

			return Promise.all(util.transform_(files, function (f) {
				return self.deleteFileEntry(f);
			}));
		});
	};

	this.deleteFile = function(directory, filename, ownerId) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {
			return file ? self.deleteFileEntry(file) : file;
		});
	};

	this.deleteFileEntry = function(fileEntry) {
		return gfs.removeAsync(fileEntry);
	};

	// Just for the occasional spring-cleaning & testing
	this._wipeOutEverythingForEverAndEverAndEver = function() {

		var self = this;
		return gfs.files.find({}).toArray().then(function(files) {
			return Promise.all(util.transform_(files, function(f) {
				return self.deleteFileEntry(f).then(function() {
					console.log("WIPED OUT FILE:", f.filename);
				});
			}));
		});
	};

	// Modify metadata
	//
	this.chownFileEntry = function(fileEntry, ownerId) {

		return update({ _id: fileEntry._id }, { '$set': {
			"metadata._owner": ownerId
		}});
	};

	// Create a write stream
	//
	this.createWriteStream = function(directory, filename, ownerId, mtime) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {

			if (file) {
                
                return update({ _id: file._id }, { '$set': { "metadata.mtime": mtime || new Date() } }).then(function () {
                    return gfs.createWriteStream({ _id: file._id, mode: 'w' });
                });                
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
						mtime: mtime || new Date(),
						_owner: ownerId
					}
				});
			}
		});
	};

	// Create a read stream
	//
	this.createReadStream = function(directory, filename, ownerId) {

        return Promise.try(function () {
            return gfs.createReadStream(genQuery(directory, filename, ownerId)); // Not async operation, just value
        });
	};
	
	this.createReadStreamFromFileEntrySync = function (fileEntry) {
		return gfs.createReadStream(fileEntry);
	};

	// Upload
	//
	this.upload = function(readStream, directory, filename, ownerId, mtime) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId, mtime).then(function(writeStream) {

			return new Promise(function(resolve, reject) {

				readStream.pipe(writeStream);
				readStream.once('error', reject);

				writeStream.once('error', reject);
				writeStream.once('close', resolve);
			});
		});
	};

	this.uploadToFileEntry = function(readStream, fileEntry, mtime) {
        
        return update({ _id: fileEntry._id }, { '$set': { "metadata.mtime": mtime || new Date() } }).then(function (result) {

            return new Promise(function (resolve, reject) {
                
                var writeStream = gfs.createWriteStream({ _id: fileEntry._id, mode: 'w' });
                
                readStream.pipe(writeStream);
                readStream.once('error', reject);
                
                writeStream.once('error', reject);
                writeStream.once('close', resolve);
            });
        });
	};

	this.uploadData = function(data, encoding, directory, filename, ownerId) {

		var self = this;
		return self.createWriteStream(directory, filename, ownerId).then(function(writeStream) {

			return new Promise(function(resolve, reject) {

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

			return new Promise(function(resolve, reject) {

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

			return new Promise(function(resolve, reject) {

				var data = '';
				readStream.setEncoding(encoding);
				readStream.once('error', reject);
				readStream.on('data', function(chunk) { data += chunk; });
				readStream.on('end', function() { resolve(data); });
			});
		});
	};

	this.downloadFromFileEntry = function(writeStream, fileEntry) {

		return new Promise(function(resolve, reject) {

			var readStream = gfs.createReadStream(fileEntry);

			readStream.pipe(writeStream);
			readStream.once('error', reject);

			writeStream.once('error', reject);
			writeStream.once('finish', resolve);
		});
    };

    this.downloadFromFileEntryUntilClosed = function (writeStream, fileEntry) {
        
        return new Promise(function (resolve, reject) {
            
            var readStream = gfs.createReadStream(fileEntry);
            
            readStream.pipe(writeStream);
            readStream.once('error', reject);
            
            writeStream.once('error', reject);
            writeStream.once('close', resolve);
        });
    };
};
