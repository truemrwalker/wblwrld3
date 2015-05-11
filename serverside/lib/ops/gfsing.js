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
var path = require('path');
var fs = require('fs');

var util = require('../util');
var libGfs = require('../gfs');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var User = mongoose.model('User');
	var gfs = new libGfs.GFS(Q, mongoose);

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

	//******************************************************************

	function saveFiles(req, targetPath, ownerId) {

		if (!req.files || (req.files.file && req.files.file.length == 0))
			return Q.resolve(null);

		var files = req.files.file ? [ req.files.file ]:
			util.transform(Object.keys(req.files), function (k) {
				return req.files[k];
			});

		return Q.all(util.transform_(files, function (f) {
			return gfs.upload(fs.createReadStream(f.path), targetPath, f.originalname, ownerId);
		}));
	}
	function getFiles(targetPath, ownerId) {

		return gfs.getFiles(targetPath, ownerId).then(function(files) {

			//quick test
			//
			//var haveSeen = {};
			//var result = [];
			//files.forEach(function(f) {
            //
			//	if (!haveSeen[f.metadata.filename]) {
			//		haveSeen[f.metadata.filename] = true;
			//		result.push(f.metadata.filename);
			//	}
			//});
			//return result;
			//

			return util.transform_(files, function(f) {
				return f.metadata.filename;
			});
		}).fail(function() { return [] });
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

	function performOperationOnFile(req, query, targetPathPrefix, op) {

		return ('exec' in query ? Q(query.exec()) : Q.resolve(query))
			.then(function (obj) {
				ensureObjectValid(req, obj);

				var targetVer = obj.getInfoObject().ver;
				var targetPath = path.join(targetPathPrefix, targetVer.toString());

				return op(targetPath, req.params.file || req.params[0], obj._id, req.body);
			});
	}

	function opGet(path, filename, ownerId) {

		return gfs.downloadData('utf8', path, filename, ownerId).then(function(data) {
			return {

				name: 'unknown',
				content: data
			};
		});
	}
	function opUpdate(path, filename, ownerId, props) {

		return gfs.uploadData(props.content, 'utf8', path, filename, ownerId).then(function(data) {
			return {

				name: 'unknown',
				content: data
			};
		});
	}
	function opDelete(path, filename, ownerId) {

		return gfs.deleteFile(path, filename, ownerId).then(function() {
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

			return ('exec' in query ? Q(query.exec()) : Q.resolve(query))
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var targetVer = versionUpdater(obj);
					var targetPath = path.join(targetPathPrefix, targetVer.toString());

					return saveFiles(req, targetPath)
						.then(function() {

							// The library I'm using wants the data flat I cannot use
							// req.body.info and then access id, name, etc.
							//
							var info = req.body;
							info.ver = targetVer;

							obj.mergeWithInfoObject(info);
							return Q.ninvoke(obj, "save").then(function() { return obj; });
						});
				});
		},

		//**************************************************************

		associatedFiles: function (req, query, targetPathPrefix) {

			return('exec' in query ? Q(query.exec()) : Q.resolve(query))
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var targetVer = obj.getInfoObject().ver;
					var targetPath = path.join(targetPathPrefix, targetVer.toString());

					return getFiles(targetPath);
				});
		},

		//**************************************************************

		disassociateFiles: function (req, query, targetPathPrefix, versionUpdater) {

			return Q(query.exec())
				.then(function (obj) {
					ensureObjectValid(req, obj);

					var info = obj.getInfoObject();

					var previousVer = info.ver;
					var previousPath = path.join(targetPathPrefix, previousVer.toString());

					return removeFiles(previousPath)
						.then(function() {

							var targetVer = versionUpdater(obj);

							if (targetVer === 0)
								return Q.ninvoke(obj, "remove");
							else {

								//var targetPath = path.join(targetPathPrefix, targetVer.toString());

								info.ver = targetVer;
								info.modified = Date.now();

								obj.mergeWithInfoObject(info);
								return Q.ninvoke(obj, "save").then(function() { return obj; });
							}
						});
				});
		},

		//**************************************************************

		reassociateFiles: function (req, fromQuery, toQuery, fromTargetPathPrefix, toTargetPathPrefix) {

			return Q.spread([ ('exec' in fromQuery ? Q(fromQuery.exec()) : Q.resolve(fromQuery)),
				('exec' in toQuery ? Q(toQuery.exec()) : Q.resolve(toQuery)) ],
				function(fromObj, toObj) {
					ensureObjectValid(req, fromObj);

					var fromVer = fromObj.getInfoObject().ver;
					var fromPath = path.join(fromTargetPathPrefix, fromVer.toString());

					var toVer = toObj.getInfoObject().ver;
					var toPath = path.join(toTargetPathPrefix, toVer.toString());

					ensureObjectValid(req, toObj);

					return moveFiles(fromPath, toPath).then(function() {

						return Q.all([ Q.ninvoke(fromObj, "remove"), Q.ninvoke(toObj, "save") ])
							.then(function() { return toObj; });
					});
				});
		},

		//**************************************************************

		copyFiles: function (req, fromQuery, toQuery, fromPathPrefix, toPathPrefix) {

			return Q.spread([ ('exec' in fromQuery ? Q(fromQuery.exec()) : Q.resolve(fromQuery)),
					('exec' in toQuery ? Q(toQuery.exec()) : Q.resolve(toQuery)) ],
				function(fromObj, toObj) {
					ensureObjectValid(req, fromObj, true);

					var fromVer = fromObj.getInfoObject().ver;
					var fromPath = path.join(fromPathPrefix, fromVer.toString());

					var toVer = toObj.getInfoObject().ver;
					var toPath = path.join(toPathPrefix, toVer.toString());

					ensureObjectValid(req, toObj);

					return copyFiles(fromPath, toPath)
						.then(function() { return toObj; }); // We haven't modified the object at all... so, no need save
				});
		}
	};
};
