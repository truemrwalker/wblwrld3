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
 * @overview Ops module for managing and associating files with objects.
 *
 * The files created and managed by this module appear on the system's filesystem
 * 
 * @deprecated This is a deprecated module, use gfsing.js instead which creates and manages
 * the files in the mongodb database via its filesystem layer called grid-fs.
 * @module ops
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var util = require('../util');
var dbutil = require('../dbutil');

var mkdirpAsync = Promise.promisify(mkdirp);
Promise.promisifyAll(fs);

module.exports = function(app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');

	////////////////////////////////////////////////////////////////////
	// Utility functions
    //
	function ensureObjectValid(req, obj, readonly) {

		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));

		if (!obj.isUserOwner(req.user) && !readonly)
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);

		if (obj.webble.defid !== obj.webble.templateid)
			throw new util.RestError(gettext("Operation not applicable to this kind of object"));
	}

	function omitInfoJsonFile(files) {

		var index = files.indexOf('info.json');
		if (index != -1)
			files.splice(index, 1);
		return files;
	}

	//******************************************************************

	function saveFiles(req, targetPath) {

		// Validate the passed-in data
		//
		return mkdirpAsync(targetPath).then(function () {
            
            // NOTE: that this doesn't work because req.files is never populated by any middleware
            // However, since I'm not using these fs ops anymore, I'm leaving it as it is for reference
            // In case of emergency, use busboy as in the file 'gfsing.js'
            //
            if (!req.files || (req.files.file && req.files.file.length == 0))
                return Promise.resolve();
            
            var files = req.files.file ? req.files.file :
					util.transform(Object.keys(req.files), function (k) {
                return req.files[k][0];
            });
            
            // Grrrrrrrrrrr.....
            //
            if (!(files instanceof Array) && files.originalname)
                files = [files];
            //
            
            return Promise.all(util.transform_(files, function (f) {
                return fs.renameAsync(f.path, path.join(targetPath, f.originalname));
            }));
        });
	}
	function getFiles(targetPath) {

		return fs.readdirAsync(targetPath).then(omitInfoJsonFile)
			.catch(function () { return [] });
	}
	function removeFiles(targetPath) {

		return fs.readdirAsync(targetPath).then(function (files) {

            return Promise.all(util.transform_(files, function (f) {
                return fs.unlinkAsync(path.join(targetPath, f));
            })).then(function () {
                return fs.rmdirAsync(targetPath);
            });

        }, function (err) {
            
            if (err.code !== 'ENOENT')
                throw err;
        });
	}
	function moveFiles(fromPath, toPath) {

		return mkdirpAsync(toPath).then(function () {
            return fs.readdirAsync(fromPath);
        }).then(function (files) {
            
            return Promise.all(util.transform(files, function (f) {
                return fs.renameAsync(path.join(fromPath, f), path.join(toPath, f));
            }));

        }).then(function () {
            return fs.rmdirAsync(fromPath);
        });
	}
	function copyFiles(fromPath, toPath) {

        return mkdirpAsync(toPath).then(function () {
            return fs.readdirAsync(fromPath);
        }).then(omitInfoJsonFile).then(function (files) {
            
            return Promise.all(util.transform(files, function (f) {
                
                return new Promise(function (resolve, reject) {
                    
                    var readStream = fs.createReadStream(path.join(fromPath, f));
                    readStream.on('error', reject);
                    
                    // Using 'readable' instead of 'open' because open is emitted even when an error occurs
                    // Case in point, Error: EISDIR
                    //
                    readStream.once('readable', function () {
                        
                        var writeStream = fs.createWriteStream(path.join(toPath, f));
                        writeStream.once('finish', function () { resolve(f); });
                        writeStream.once('open', function () {
                            readStream.pipe(writeStream); //=== writeStream
                        });
                        writeStream.on('error', reject);
                    });
                });
            }));

        }).catch(function (err) {
            console.error("COPY FILES FAILED:", err)
        });
	}
	//******************************************************************

	function createSymLink(linkPath, targetPath) {

		return fs.unlinkAsync(linkPath).then(function() {
			return fs.symlinkAsync(targetPath, linkPath, 'dir');
		}, function() {}); // We don't care for errors here: suppress
	}

	//******************************************************************

	function performOperationOnFile(req, query, targetPathPrefix, op) {

		return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
            ensureObjectValid(req, obj);
            
            var targetVer = obj.getInfoObject().ver;
            var targetPath = path.join(targetPathPrefix, targetVer.toString());
            
            return op(path.join(targetPath, req.params.file || req.params[0]), req.body);
        });
	}

    function opGet(path) {

        return fs.readFileAsync(path, { encoding: 'utf8' }).then(function (data) {

			return {
				name: 'unknown',
				content: data
			};
		});
	}
	function opUpdate(path, props) {

		return fs.writeFileAsync(path, props.content, { encoding: 'utf8' }).then(function(data) {
            
            return {
				name: 'unknown',
				content: data
			};
		});
	}
	function opDelete(path) {

        return fs.unlinkAsync(path).then(function () {

			return {
				name: 'unknown'
			};
		});
	}

	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {

        /**
         * Returns the conent of the file associated with the given object.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.params.file or req.params[0] that contains the file's path.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @param {string} targetPathPrefix - The file path's namespace (top-level directory).
         * @returns {Promise} A promise that is resolved with a file-object that is associated
         *     with the given object and is saved under the given path.
         */
		getFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opGet);
        },

        /**
         * Updates the content of the file associated with the given object.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.params.file or req.params[0] that contains the file's path
         *     the attribute req.body.content that contains the file's content as a utf8 encoded string.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @param {string} targetPathPrefix - The file path's namespace (top-level directory).
         * @returns {Promise} A promise that is resolved with a file-object that is associated
         *     with the given object and is saved under the given path.
         */
		updateFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opUpdate);
		},

        /**
         * Deletes the file associated with the given object.
         * @param {Request} req - The instance of an express.js request object that contains
         *     the attribute req.params.file or req.params[0] that contains the file's path.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @param {string} targetPathPrefix - The file path's namespace (top-level directory).
         * @returns {Promise} A promise that is resolved with a file-object that only contains
         *     the name of the deleted file without its "content".
         */
        deleteFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opDelete);
		},

        /**
         * Associates all the given files (contained in the request "req") with the given object.
         * @param {Request} req - The instance of an express.js request object which must contain
         *     the attribute req.files that contains an array of objects that represent the local
         *     files to which the sent (given) files have been temporarily saved.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @param {string} targetPathPrefix - The file path's namespace (top-level directory).
         * @param {Function} versionUpdater - A closure that accepts the target object and returns
         *     (synchronously) the target version of that object to which the given files should be
         *     associated with.
   	     * @returns {Promise} A promise that is resolved with the updated object.
         */
		associateFiles: function (req, query, targetPathPrefix, versionUpdater) {

			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
                ensureObjectValid(req, obj);
                
                var targetVer = versionUpdater(obj);
                var targetPath = path.join(targetPathPrefix, targetVer.toString());
                
                return saveFiles(req, targetPath).then(function () {
                    
                    return targetVer == 0 ? null :
								createSymLink(path.join(targetPathPrefix, 'latest'), targetPath);

                }).then(function () {
                    
                    var targetInfoFile = path.join(targetPath, "info.json");
                    
                    // The library I'm using wants the data flat I cannot use
                    // req.body.info and then access id, name, etc.
                    //
                    if (req.body.id) {
                        
                        var info = req.body;
                        info.ver = targetVer;
                        
                        obj.mergeWithInfoObject(info);
                        
                        return obj.save().then(function () { // Save and creat the targetInfo file (failure is ok)
                            
                            // .finally() Cannot be used to propagate values (apparently -- at least that was the case in Q)
                            return fs.writeFileAsync(targetInfoFile, JSON.stringify(info)).return(obj).catchReturn(obj);
                        });
                    }
                    else {
                        
                        return fs.readFileAsync(targetInfoFile, 'utf8').then(function (data) {
                            
                            var info = JSON.parse(data, 'utf8');
                            info.ver = targetVer;
                            
                            obj.mergeWithInfoObject(info);
                            
                            return obj.save().then(function () { return obj; });

                        }, function () { // File does not exist; it's OK
                            return obj;
                        });
                    }
                });
            });
		},

        /**
         * Returns a list of all the files that are associated with the given object.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @returns {Promise} A promise that is resolved with an array of strings that represent the
         *     file paths that are associated with the given object.
         */
		associatedFiles: function (req, query, targetPathPrefix) {

			return('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query))
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var targetVer = obj.getInfoObject().ver;
					var targetPath = path.join(targetPathPrefix, targetVer.toString());

					return getFiles(targetPath);
				});
		},

        /**
         * Disassociates all the files that are associated with the current version of the given object.
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} query - A mongoose query that evaluates to an object OR an object.
         * @param {string} targetPathPrefix - The file path's namespace (top-level directory).
         * @param {Function} versionUpdater - A closure that accepts the target object and returns
         *     (synchronously) the target version of that object to which it should revert to after
         *     the files are disassociated from it (if the target version is 0 the object is removed).
   	     * @returns {Promise} A promise that is resolved with the updated object.
         */
		disassociateFiles: function (req, query, targetPathPrefix, versionUpdater) {

			return Promise.resolve(query.exec()).then(function (obj) {
                ensureObjectValid(req, obj);
                
                var info = obj.getInfoObject();
                
                var previousVer = info.ver;
                var previousPath = path.join(targetPathPrefix, previousVer.toString());
                
                return removeFiles(previousPath).then(function () {
                    
                    var targetVer = versionUpdater(obj);
                    
                    if (targetVer === 0) {
                        
                        return fs.rmdirAsync(targetPathPrefix).then(function () {
                            return obj.remove();
                        }, function (err) {
                            
                            if (err.code !== 'ENOENT') // If the path doesn't exist it's still OK - just remove db entry
                                throw err;
                            return obj.remove();
                        });
                    }
                    else {
                        
                        var targetPath = path.join(targetPathPrefix, targetVer.toString());
                        var linkPath = path.join(targetPathPrefix, 'latest');
                        
                        info.ver = targetVer;
                        info.modified = Date.now();
                        
                        obj.mergeWithInfoObject(info);
                        
                        return createSymLink(linkPath, targetPath).then(function () {
                            return obj.save();
                        });
                    }
                });
            });
		},

        /**
         * Reassociates (moves) all the files that are associated with the given object "fromQuery" to the
         * other given object "toQuery".
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} fromQuery - A mongoose query that evaluates to an object OR an object.
         * @param {Query|Object} toQuery - A mongoose query that evaluates to an object OR an object.
         * @param {string} fromTargetPathPrefix - The source namespace (top-level directory).
         * @param {string} toTargetPathPrefix - The target namespace (top-level directory).
   	     * @returns {Promise} A promise that is resolved with the target object.
         */
		reassociateFiles: function (req, fromQuery, toQuery, fromTargetPathPrefix, toTargetPathPrefix) {

			return Promise.resolve([dbutil.execOrValue(fromQuery), dbutil.execOrValue(toQuery)]).spread(function (fromObj, toObj) {

                ensureObjectValid(req, fromObj);
                
                var fromVer = fromObj.getInfoObject().ver;
                var fromPath = path.join(fromTargetPathPrefix, fromVer.toString());
                
                var toVer = toObj.getInfoObject().ver;
                var toPath = path.join(toTargetPathPrefix, toVer.toString());
                
                ensureObjectValid(req, toObj);
                
                var targetInfoFile = path.join(fromPath, "info.json");
                return fs.writeFileAsync(targetInfoFile, JSON.stringify(toObj.getInfoObject())).then(function () {
                    return moveFiles(fromPath, toPath);
                }).then(function () {
                    
                    if (toVer != 0)
                        return createSymLink(path.join(toTargetPathPrefix, 'latest'), toPath);

                }).then(function () {
                    return fs.rmdirAsync(fromTargetPathPrefix).catchReturn(); // Remove directory completely
                }).then(function () {
                    return Promise.all([fromObj.remove(), toObj.save()]).return(toObj);
                });
            });
		},

        /**
         * Copies all the files that are associated with the given object "fromQuery" and associates
         * those copied files with the other given object "toQuery".
         * @param {Request} req - The instance of an express.js request object.
         * @param {Query|Object} fromQuery - A mongoose query that evaluates to an object OR an object.
         * @param {Query|Object} toQuery - A mongoose query that evaluates to an object OR an object.
         * @param {string} fromPathPrefix - The source namespace (top-level directory).
         * @param {string} toPathPrefix - The target namespace (top-level directory).
   	     * @returns {Promise} A promise that is resolved with the target object.
         */
		copyFiles: function (req, fromQuery, toQuery, fromPathPrefix, toPathPrefix) {

			return Promise.resolve([dbutil.execOrValue(fromQuery), dbutil.execOrValue(toQuery)]).spread(function (fromObj, toObj) {
                ensureObjectValid(req, fromObj, true);
                
                var fromVer = fromObj.getInfoObject().ver;
                var fromPath = path.join(fromPathPrefix, fromVer.toString());
                
                var toVer = toObj.getInfoObject().ver;
                var toPath = path.join(toPathPrefix, toVer.toString());
                
                ensureObjectValid(req, toObj);
                
                return copyFiles(fromPath, toPath).then(function () {
                    
                    var targetInfoFile = path.join(toPath, "info.json");
                    return fs.writeFileAsync(targetInfoFile, JSON.stringify(toObj.getInfoObject()));

                }).return(toObj); // We haven't modified the object at all... so, no need save
            });
		}
	};
};
