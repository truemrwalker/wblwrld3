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
 * @overview mongodb's gridfs utility functions.
 * @module lib/gfs
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var util = require('./util');

var mime = require('mime-types');
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

/**
 * Represents the module that exports all the gridfs-specific methods.
 * @constructor
 * @param {Object} mongoose - The mongoose object that encapsulates the database's functionality.
 */
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

	/**
	 * Gets the file object identified by "fullPath" from the database.
	 * @param {string} fullPath - The full path of the requested file object.
	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with the file object or null if not found.
	 */
	this.getFileWithPath = function(fullPath, ownerId) {
		return gfs.findOneAsync({ filename: fullPath });
	};

	/**
	 * Gets the file object identified by its "directory" and "filename" parts from the database.
	 * @param {string} fullPath - The full path of the requested file object.
	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with the file object or null if not found.
	 */
	this.getFile = function(directory, filename, ownerId) {
		return gfs.findOneAsync(genQuery(directory, filename, ownerId));
	};

	/**
	 * Gets the all the file objects from the database, except those in the "excludeFileList".
	 * @param {string[]} excludeFilesList - The full path of the files that should be omitted.
	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with an array of all the file objects.
	 */
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
		return Promise.resolve(gfs.files.find(options).toArray());
	};

	/**
	 * Gets the all the file objects that are inside the directory "directory".
	 * @param {string} directory - The directory that we want to get the files from.
	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with an array of all the file objects in "directory".
	 */
	this.getFiles = function(directory, ownerId) {
		return Promise.resolve(gfs.files.find(genQuery(directory, null, ownerId)).toArray()); // ditto
	};

	/**
	 * Moves a file object that is already in the database to the directory "toDirectory".
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @param {string} toDirectory - The target directory.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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

	/**
	 * Moves all files in the directory "fromDirectory" to the directory "toDirectory".
	 * @param {string} fromDirectory - The source directory.
	 * @param {string} toDirectory - The target directory.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.moveFiles = function(fromDirectory, toDirectory, ownerId) {

		var self = this;
		return self.getFiles(fromDirectory, ownerId).then(function(files) {

			return Promise.all(util.transform_(files, function (f) {
				return self.moveFileEntry(f, toDirectory);
			}));
		});
	};

	/**
	 * Copies a file object that is already in the database to the directory "toDirectory".
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @param {string} toDirectory - The target directory.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.copyFileEntry = function(fileEntry, toDirectory, ownerId) {

		var readStream = gfs.createReadStream(fileEntry);
		return this.upload(readStream, toDirectory, fileEntry.metadata.filename, ownerId);
	};

	/**
	 * Copies all files in the directory "fromDirectory" to the directory "toDirectory".
	 * @param {string} fromDirectory - The source directory.
	 * @param {string} toDirectory - The target directory.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
    this.copyFiles = function (fromDirectory, toDirectory, ownerId) {

		var self = this;
		return self.getFiles(fromDirectory, undefined).then(function(files) {

			return Promise.all(util.transform_(files, function (f) {
				return self.copyFileEntry(f, toDirectory, ownerId);
			}));
		});
	};

	/**
	 * Deletes all files contained inside the directory "directory".
	 * @param {string} directory - The source directory.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.deleteFiles = function(directory, ownerId) {

		var self = this;
		return self.getFiles(directory, ownerId).then(function(files) {

			return Promise.all(util.transform_(files, function (f) {
				return self.deleteFileEntry(f);
			}));
		});
	};

	/**
	 * Deletes the file contained inside the given directory and has the given filename.
	 * @param {string} directory - The source directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.deleteFile = function(directory, filename, ownerId) {

		var self = this;
		return self.getFile(directory, filename, ownerId).then(function(file) {
			return file ? self.deleteFileEntry(file) : file;
		});
	};

    /**
	 * Deletes a file object that is already in the database.
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.deleteFileEntry = function(fileEntry) {
		return gfs.removeAsync(fileEntry);
	};

    /**
	 * Wipes out all the files contained in the database.
	 * Just for the occasional spring-cleaning & testing
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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

    /**
	 * Changes the ownership of a file object that is already in the database.
	 * @param {Object} fileEntry - The file object that is already in the database.
  	 * @param {Object} ownerId - The user's ObjectId (ownerIds are currently not utilized).
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.chownFileEntry = function(fileEntry, ownerId) {

		return update({ _id: fileEntry._id }, { '$set': {
			"metadata._owner": ownerId
		}});
	};

	/**
	 * Opens or creates a file with the given filename in the given directory and returns a writable stream.
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @param {Date} mtime - The file's modification time (or empty for current time).
	 * @returns {Promise} A promise that is resolved with the writable stream to the file's contents.
	 */
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

	/**
	 * Opens a file with the given filename in the given directory and returns a readable stream.
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with a readable stream to the file's contents.
	 */
	this.createReadStream = function(directory, filename, ownerId) {

        return Promise.try(function () {
            return gfs.createReadStream(genQuery(directory, filename, ownerId)); // Not async operation, just value
        });
	};

    /**
	 * Obtains a readable stream to the file's content from a file object already in the database.
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @returns {Stream} A readable stream to the file's contents.
	 */
	this.createReadStreamFromFileEntrySync = function (fileEntry) {
		return gfs.createReadStream(fileEntry);
	};

	/**
	 * Creates or updates a file from the contents read from the provided readable stream.
	 * @param {Callback} readStreamFunc - A closure that returns a readable strean when invoked.
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @param {Date} mtime - The file's modification time (or empty for current time).
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
    this.uploadLazy = function (readStreamFunc, directory, filename, ownerId, mtime) {

        var self = this;
        return self.createWriteStream(directory, filename, ownerId, mtime).then(function (writeStream) {

            return new Promise(function (resolve, reject) {

                var readStream = readStreamFunc();
                readStream.pipe(writeStream);
                readStream.once('error', reject);

                writeStream.once('error', reject);
                writeStream.once('close', resolve);
            });
        });
    };

    /**
	 * Creates or updates a file from the contents read from the provided readable stream.
	 * @param {Stream} readStream - A readable stream.
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @param {Date} mtime - The file's modification time (or empty for current time).
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
    this.upload = function (readStream, directory, filename, ownerId, mtime) {

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

    /**
	 * Updates the file object's contents from the contents read from the provided readable stream.
	 * @param {Stream} readStream - A readable stream.
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @param {Date} mtime - The file's modification time (or empty for current time).
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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

    /**
	 * Creates or updates a file with content from the provided data (with the given encoding).
	 * @param {*} data - The file's content.
	 * @param {string} encoding - The given data's encoding (e.g., utf-8 if string).
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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

    /**
	 * Writes the contents of a file to the provided writable stream.
	 * @param {Stream} writeStream - A writable stream.
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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

    /**
	 * Returns the contents of a file as an encoded object (with the given encoding).
	 * @param {string} encoding - The target encoding (e.g., utf-8 if string).
	 * @param {string} directory - The file's directory.
	 * @param {string} filename - The file's filename.
  	 * @param {Object} ownerId - Currently unused.
	 * @returns {Promise} A promise that is resolved with the file's contents as a data object.
	 */
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

    /**
	 * Writes the contents of a file to the provided writable stream.
	 * @param {Stream} writeStream - A writable stream.
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
	this.downloadFromFileEntry = function(writeStream, fileEntry) {

		return new Promise(function(resolve, reject) {

			var readStream = gfs.createReadStream(fileEntry);

			readStream.pipe(writeStream);
			readStream.once('error', reject);

			writeStream.once('error', reject);
			writeStream.once('finish', resolve);
		});
    };

    /**
	 * Writes the contents of a file to the provided writable stream until the stream is 'closed'.
	 * @param {Stream} writeStream - A writable stream.
	 * @param {Object} fileEntry - The file object that is already in the database.
	 * @returns {Promise} A promise that is resolved if the command succeeds and rejected if not.
	 */
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
