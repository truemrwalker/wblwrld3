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
// gfsing.js
// Created by Giannis Georgalis on 4/23/15
//
var Promise = require("bluebird");
var Busboy = require('busboy');

var path = require('path');
var fs = require('fs');
var tar = require('tar-stream');

var util = require('../util');
var dbutil = require('../dbutil');
var libGfs = require('../gfs');

module.exports = function (app, config, mongoose, gettext, auth) {
	
	var User = mongoose.model('User');
	var gfs = new libGfs.GFS(mongoose);
	
	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function ensureObjectValid(req, obj, readonly) {
		
		if (!obj)
			throw new util.RestError(gettext("Requested object does not exist", 404));

        if (!readonly && (!req.user || !obj.isUserOwner(req.user)))
			throw new util.RestError(gettext("You are not the owner of the requested object"), 403);
		
		if (obj.webble.defid !== obj.webble.templateid)
			throw new util.RestError(gettext("Operation not applicable to this kind of object"));
	}
	
	//******************************************************************
	
	function saveFiles(req, targetPath, ownerId) {
        
        return new Promise(function (resolve, reject) {
            
            var busboy = new Busboy({ headers: req.headers });
            var promises = [];
            
            busboy.on('file', function (fieldName, stream, filename, encoding, mimeType) {
                promises.push(gfs.upload(stream, targetPath, filename, ownerId));
            });
            busboy.on('field', function (fieldName, value) {
                req.body[fieldName] = value;
            });
            busboy.on('finish', function () {
                Promise.all(promises).then(resolve, reject);
            });
            req.pipe(busboy);
        });
    }

    let getRelativeUrl = (from, to) => path.sep == '/' ? path.relative(from, to)
        : path.relative(from, to).replace(/\\/g, '/');

	function getFiles(targetPath, ownerId) {
		
		return gfs.getFiles(targetPath, ownerId).then(function (files) {
            return util.transform_(files, f => getRelativeUrl(targetPath, f.filename));
		}).catchReturn([]);
	}
	function removeFiles(targetPath, ownerId) {
		return gfs.deleteFiles(targetPath, ownerId);
	}
	function moveFiles(fromPath, toPath, ownerId) {
		return gfs.moveFiles(fromPath, toPath, ownerId);
	}
	function copyFiles(fromPath, toPath, ownerId) {
		return gfs.copyFiles(fromPath, toPath, ownerId);
	}
	
	//******************************************************************
	
	function importAllFiles(req, targetPathPrefix, objGetterAsync, objSetterAsync) {
        
        return new Promise(function (resolve, reject) {
            
            var busboy = new Busboy({ headers: req.headers });
            var promise = Promise.resolve(null);
            var importResult = { objs: [], targetPath: targetPathPrefix, other: [] };
            
            busboy.on('file', function (fieldName, tarStream, filename, encoding, mimeType) {
                
                promise = promise.then(function () { // Import each stream - one by one
                    
                    return importFiles(tarStream, targetPathPrefix, objGetterAsync, objSetterAsync).then(function (result) {
                        result.objs.forEach(function (obj) {
                            
                            for (var i = 0; i < importResult.objs.length; ++i) {
                                if (importResult.objs[i]._id === obj._id)
                                    return;
                            }
                            importResult.objs.push(obj);
                        });
                        result.other.forEach(r => importResult.other.push(r));
                    });
                });
            });
            busboy.on('finish', function () {
                promise.then(() => resolve(importResult), reject);
            });
            req.pipe(busboy);
        });
	}

	function importFiles(tarStream, targetPathPrefix, objGetterAsync, objSetterAsync) {
		
		return new Promise(function (resolve, reject) {
			
			var extract = tar.extract();            
            var targetObj = null, targetPath = null;

            var importResult = { objs: [], targetPath: targetPathPrefix, other: [] };
			
			extract.on('entry', function (header, stream, next) {
				
				// header is the tar header
				// stream is the content body (might be an empty stream)
				// call next when you are done with this entry

				if (!header)
					reject();
				else if (header.type === 'directory') {
					
					objGetterAsync(path.basename(header.name)).then(function (result) {

                        if (result && result.obj) {

                            targetObj = result.obj;
                            targetObj.files = [];
                            targetPath = path.join(targetPathPrefix, result.pathSuffix);
                        }
                        else {

                            targetObj = null;
                            targetPath = '';
                        }

						stream.resume(); // Drain the stream just in case
						next();

					}, reject);
                }
                else if (header.name.charAt(0) === '_') {

                    let data = '';
                    stream.on('data', chunk => data += chunk);
                    stream.on('error', reject);
                    stream.on('end', function () {

                        importResult.other.push({ name: header.name, data: data });
                        next();

                    }, reject);
                }
                else if (!targetObj || !targetPath) { // Skip the current entry

                    stream.on('end', next);
                    stream.on('error', reject);
                    stream.resume(); // drain the stream
                }
				else if (path.basename(header.name) === 'info.json') {

					let jsonString = '';
					stream.on('data', chunk => jsonString += chunk);
					stream.on('error', reject);
					stream.on('end', function () {
						
						let infoObj = JSON.parse(jsonString);
                        objSetterAsync(targetObj, infoObj).then(function (result) {

                            importResult.objs.push(result.obj);
                            next();

                        }, reject);
					});
				}
				else {

					gfs.createWriteStream(targetPath, path.basename(header.name), null, 0).then(function (writeStream) {

                        targetObj.files.push(getRelativeUrl(targetObj.webble.templateid, header.name));

						stream.pipe(writeStream);
						
						stream.on('end', next); // ready for next entry
						stream.on('error', reject);

						writeStream.on('error', reject);

					}, reject);
				}
			});
			
            extract.on('finish', () => resolve(importResult));
			extract.on('error', reject);
			tarStream.pipe(extract);
		});
	}
	
	function exportFiles(pack, targetPath, info, ownerId) {
        
        var dir = info.id;
        pack.entry({ name: dir, type: 'directory' });        
        pack.entry({ name: dir + '/' + 'info.json' }, JSON.stringify(info));

		return gfs.getFiles(targetPath, ownerId).then(function (files) {
			
            // Obv., we need to store the files in the pack sequentially
            return new Promise(function (resolve, reject) {

                var next = function (err) {
                    
                    if (err)
                        reject(err);
                    else if (files.length == 0)
                        resolve(targetPath);
                    else {
                        
                        var f = files.pop();
                        var chunks = [];
                        var stream = gfs.createReadStreamFromFileEntrySync(f);
                        stream.on('data', function (chunk) { chunks.push(chunk); });
                        stream.on('error', function (err) { next(err); });
                        stream.on('end', function () {
                            
                            pack.entry({ name: dir + '/' + f.metadata.filename, type: 'file', size: f.length }, Buffer.concat(chunks));
                            next();
                        });
                    }
                };
                
                next();
            });
		});
	}
	
	//******************************************************************
	
	function performOperationOnFile(req, query, targetPathPrefix, op) {
		
		return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {			
			ensureObjectValid(req, obj);
			
			var targetVer = obj.getInfoObject().ver;
			var targetPath = path.join(targetPathPrefix, targetVer.toString());
			
			return op(targetPath, req.params.file || req.params[0], obj._id, req.body);
		});
	}
	
	function opGet(path, filename, ownerId) {
		
		return gfs.downloadData('utf8', path, filename, ownerId).then(function (data) {
			return {
				
				name: filename,
				content: data
			};
		});
	}
	function opUpdate(path, filename, ownerId, props) {
		
		return gfs.uploadData(props.content, 'utf8', path, filename, ownerId).then(function (data) {
			return {
				
				name: filename,
				content: data
			};
		});
	}
	function opDelete(path, filename, ownerId) {
		
		return gfs.deleteFile(path, filename, ownerId).then(function () {
			return {
				name: filename
			};
		});
	}
	
	////////////////////////////////////////////////////////////////////
	// Public methods
	//
	return {
		
		getFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opGet);
		},
		updateFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opUpdate);
		},
		deleteFile: function (req, query, targetPathPrefix) {
			return performOperationOnFile(req, query, targetPathPrefix, opDelete);
		},
		
		//**************************************************************
		
		exportFiles: function (req, query, targetPathPrefix, pack) {
			
			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
				
				ensureObjectValid(req, obj, true);
				
				return exportFiles(pack, targetPathPrefix, obj.getInfoObject()).then(function () { return obj; });
			});
		},
		
		importFiles: function (req, query, targetPathPrefix, objGetterAsync, objSetterAsync) {
			
			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
				// ensureObjectValid(req, obj);
				
				// Ignore everything we get from query ... we don't really use it now
				// but it may be used in the future PLUS it's consistent with the other methods

				return importAllFiles(req, targetPathPrefix, objGetterAsync, objSetterAsync);
			});
		},
		
		//**************************************************************
		
		associateFiles: function (req, query, targetPathPrefix, versionUpdater) {
			
			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
				ensureObjectValid(req, obj);
				
				var targetVer = versionUpdater(obj);
				var targetPath = path.join(targetPathPrefix, targetVer.toString());
				
                return saveFiles(req, targetPath).then(function () {
                    					
					// The library I'm using wants the data flat I cannot use
					// req.body.info and then access id, name, etc.
					//
					var info = req.body;
					info.ver = targetVer;
					
					obj.mergeWithInfoObject(info);
					return obj.save().thenReturn(obj);
				});
			});
		},
		
		//**************************************************************
		
		associatedFiles: function (req, query, targetPathPrefix) {
			
			return ('exec' in query ? Promise.resolve(query.exec()) : Promise.resolve(query)).then(function (obj) {
				ensureObjectValid(req, obj, true);
				
				var targetVer = obj.getInfoObject().ver;
				var targetPath = path.join(targetPathPrefix, targetVer.toString());
				
				return getFiles(targetPath);
			});
		},
		
		//**************************************************************
		
		disassociateFiles: function (req, query, targetPathPrefix, versionUpdater) {
			
			return Promise.resolve(query.exec()).then(function (obj) {
				ensureObjectValid(req, obj);
				
				var info = obj.getInfoObject();
				
				var previousVer = info.ver;
				var previousPath = path.join(targetPathPrefix, previousVer.toString());
				
				return removeFiles(previousPath).then(function () {
					
					var targetVer = versionUpdater(obj);
					
					if (targetVer === 0)
						return obj.remove();
					else {
						
						//var targetPath = path.join(targetPathPrefix, targetVer.toString());
						
						info.ver = targetVer;
						info.modified = Date.now();
						
						obj.mergeWithInfoObject(info);
                        return obj.save().thenReturn(obj);
					}
				});
			});
		},
		
		//**************************************************************
		
		reassociateFiles: function (req, fromQuery, toQuery, fromTargetPathPrefix, toTargetPathPrefix) {
			
			return Promise.resolve([dbutil.execOrValue(fromQuery), dbutil.execOrValue(toQuery)]).spread(function (fromObj, toObj) {
				ensureObjectValid(req, fromObj);
				
				var fromVer = fromObj.getInfoObject().ver;
				var fromPath = path.join(fromTargetPathPrefix, fromVer.toString());
				
				var toVer = toObj.getInfoObject().ver;
				var toPath = path.join(toTargetPathPrefix, toVer.toString());
				
				ensureObjectValid(req, toObj);
				
				return moveFiles(fromPath, toPath).then(function () {
					
					return Promise.all([fromObj.remove(), toObj.save()]).then(function () { return toObj; });
				});
			});
		},
		
		//**************************************************************
		
		copyFiles: function (req, fromQuery, toQuery, fromPathPrefix, toPathPrefix) {
			
			return Promise.resolve([dbutil.execOrValue(fromQuery), dbutil.execOrValue(toQuery)]).spread(function (fromObj, toObj) {
				ensureObjectValid(req, fromObj, true);
				
				var fromVer = fromObj.getInfoObject().ver;
				var fromPath = path.join(fromPathPrefix, fromVer.toString());
				
				var toVer = toObj.getInfoObject().ver;
				var toPath = path.join(toPathPrefix, toVer.toString());
				
				ensureObjectValid(req, toObj);
				
				return copyFiles(fromPath, toPath)
						.then(function () { return toObj; }); // We haven't modified the object at all... so, no need save
			});
		}
	};
};
