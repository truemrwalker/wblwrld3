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
// fsing.js
// Created by Giannis Georgalis on 2/6/14
//
var path = require('path');
var fs = require('fs');
//var os = require('os');
var mkdirp = require('mkdirp');
//var extend = require('util')._extend;

var util = require('../util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

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
		return Q.nfcall(mkdirp, targetPath)
			.then(function () {
            
                // NOTE: that this doesn't work because req.files is never populated by any middleware
                // However, since I'm not using these fs ops anymore, I'm leaving it as it is for reference
                // In case of emergency, use busboy as in the file 'gfsing.js'
                //
				if (!req.files || (req.files.file && req.files.file.length == 0))
					return Q.resolve();

				var files = req.files.file ? req.files.file :
					util.transform(Object.keys(req.files), function (k) {
						return req.files[k][0];
					});

				// Grrrrrrrrrrr.....
				//
				if (!(files instanceof Array) && files.originalname)
					files = [ files ];
				//

				return Q.all(util.transform_(files, function (f) {
					return Q.nfcall(fs.rename, f.path, path.join(targetPath, f.originalname));
				}));
			});
	}
	function getFiles(targetPath) {

		return Q.nfcall(fs.readdir, targetPath)
			.then(omitInfoJsonFile)
			.fail(function() { return [] });
	}
	function removeFiles(targetPath) {

		return Q.nfcall(fs.readdir, targetPath)
			.then(function(files) {

				return Q.all(util.transform_(files, function (f) {
						return Q.nfcall(fs.unlink, path.join(targetPath, f));
					}))
					.then(function() {
						return Q.nfcall(fs.rmdir, targetPath);
					});

			}, function(err) {

				if (err.code !== 'ENOENT')
					throw err;
			});
	}
	function moveFiles(fromPath, toPath) {

		return Q.nfcall(mkdirp, toPath)
			.then(function() {
				return Q.nfcall(fs.readdir, fromPath);
			})
			.then(function(files) {

				return Q.all(util.transform(files, function (f) {
					return Q.nfcall(fs.rename, path.join(fromPath, f), path.join(toPath, f));
				}));
			})
			.then(function() {
				return Q.nfcall(fs.rmdir, fromPath);
			});
	}
	function copyFiles(fromPath, toPath) {

		return Q.nfcall(mkdirp, toPath)
			.then(function() {
				return Q.nfcall(fs.readdir, fromPath);
			})
			.then(omitInfoJsonFile)
			.then(function(files) {

				return Q.allSettled(util.transform(files, function (f) {

					return Q.Promise(function(resolve, reject, notify) {

						var readStream = fs.createReadStream(path.join(fromPath, f));
						readStream.on('error', reject);

						// Using 'readable' instead of 'open' because open is emitted even when an error occurs
						// Case in point, Error: EISDIR
						//
						readStream.once('readable', function() {

							var writeStream = fs.createWriteStream(path.join(toPath, f));
							writeStream.once('finish', function() { resolve(f); });
							writeStream.once('open', function() {
								readStream.pipe(writeStream); //=== writeStream
							});
							writeStream.on('error', reject);
						});
					});
				}));
			})
			.then(function(results) {

				results.forEach(function(result) {

					if (result.state !== 'fulfilled')
						console.log("COPY WARNING:", result.reason);
				});
			});
	}
	//******************************************************************

	function createSymLink(linkPath, targetPath) {

		return Q.nfcall(fs.unlink, linkPath).then(function() {
			return Q.nfcall(fs.symlink, targetPath, linkPath, 'dir');
		}, function() {}); // We don't care for errors here: suppress
	}

	//******************************************************************

	function performOperationOnFile(req, query, targetPathPrefix, op) {

		return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query))
			.then(function (obj) {
				ensureObjectValid(req, obj);

				var targetVer = obj.getInfoObject().ver;
				var targetPath = path.join(targetPathPrefix, targetVer.toString());

				return op(path.join(targetPath, req.params.file || req.params[0]), req.body);
			});
	}

	function opGet(path) {
		return Q.nfcall(fs.readFile, path, { encoding: 'utf8' }).then(function(data) {
			return {

				name: 'unknown',
				content: data
			};
		});
	}
	function opUpdate(path, props) {

		return Q.nfcall(fs.writeFile, path, props.content, { encoding: 'utf8' }).then(function(data) {
			return {

				name: 'unknown',
				content: data
			};
		});
	}
	function opDelete(path) {

		return Q.nfcall(fs.unlink, path).then(function() {
			return {

				name: 'unknown'
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

		associateFiles: function (req, query, targetPathPrefix, versionUpdater) {

			return ('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query)).then(function (obj) {
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
                            
                            // .fin() Cannot be used to propagate values (apparently)
                            //
                            return Q.nfcall(fs.writeFile, targetInfoFile, JSON.stringify(info))
											.then(function () { return obj; }, function () { return obj; });
                        });
                    }
                    else {
                        
                        return Q.nfcall(fs.readFile, targetInfoFile, 'utf8')
									.then(function (data) {
                            
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

		//**************************************************************

		associatedFiles: function (req, query, targetPathPrefix) {

			return('exec' in query ? Q.resolve(query.exec()) : Q.resolve(query))
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var targetVer = obj.getInfoObject().ver;
					var targetPath = path.join(targetPathPrefix, targetVer.toString());

					return getFiles(targetPath);
				});
		},

		//**************************************************************

		disassociateFiles: function (req, query, targetPathPrefix, versionUpdater) {

			return Q.resolve(query.exec())
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var info = obj.getInfoObject();

					var previousVer = info.ver;
					var previousPath = path.join(targetPathPrefix, previousVer.toString());

					return removeFiles(previousPath)
						.then(function() {

							var targetVer = versionUpdater(obj);

							if (targetVer === 0) {

								return Q.nfcall(fs.rmdir, targetPathPrefix)
									.then(function() {
										return obj.remove();
									}, function(err) {

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

								return createSymLink(linkPath, targetPath).then(function() {
									return obj.save();
								});
							}
						});
				});
		},

		//**************************************************************

		reassociateFiles: function (req, fromQuery, toQuery, fromTargetPathPrefix, toTargetPathPrefix) {

			return Q.spread([ ('exec' in fromQuery ? Q.resolve(fromQuery.exec()) : Q.resolve(fromQuery)),
				('exec' in toQuery ? Q.resolve(toQuery.exec()) : Q.resolve(toQuery)) ],
				function (fromObj, toObj) {

                ensureObjectValid(req, fromObj);
                
                var fromVer = fromObj.getInfoObject().ver;
                var fromPath = path.join(fromTargetPathPrefix, fromVer.toString());
                
                var toVer = toObj.getInfoObject().ver;
                var toPath = path.join(toTargetPathPrefix, toVer.toString());
                
                ensureObjectValid(req, toObj);
                
                var targetInfoFile = path.join(fromPath, "info.json");
                return Q.nfcall(fs.writeFile, targetInfoFile, JSON.stringify(toObj.getInfoObject())).then(function () {
                    return moveFiles(fromPath, toPath);
                }).then(function () {
                    
                    return toVer === 0 ? null :
								createSymLink(path.join(toTargetPathPrefix, 'latest'), toPath);

                }).then(function () {
                    
                    // Remove directory completely
                    return Q.nfcall(fs.rmdir, fromTargetPathPrefix).fail(function () { });

                }).then(function () {
                    return Q.all([fromObj.remove(), toObj.save()]).then(function () { return toObj; });
                });
            });
		},

		//**************************************************************

		copyFiles: function (req, fromQuery, toQuery, fromPathPrefix, toPathPrefix) {

			return Q.spread([ ('exec' in fromQuery ? Q.resolve(fromQuery.exec()) : Q.resolve(fromQuery)),
					('exec' in toQuery ? Q.resolve(toQuery.exec()) : Q.resolve(toQuery)) ],
				function(fromObj, toObj) {
					ensureObjectValid(req, fromObj, true);

					var fromVer = fromObj.getInfoObject().ver;
					var fromPath = path.join(fromPathPrefix, fromVer.toString());

					var toVer = toObj.getInfoObject().ver;
					var toPath = path.join(toPathPrefix, toVer.toString());

					ensureObjectValid(req, toObj);

					return copyFiles(fromPath, toPath)
						.then(function() {

							var targetInfoFile = path.join(toPath, "info.json");
							return Q.nfcall(fs.writeFile, targetInfoFile, JSON.stringify(toObj.getInfoObject()));
						})
						.then(function() { return toObj; }); // We haven't modified the object at all... so, no need save
				});
		}
	};
};
