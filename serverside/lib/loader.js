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
// loader.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");
var path = require('path');

var xfs = require('./xfs');

////////////////////////////////////////////////////////////////////////
// Utility functions
//
function filterAndhandleInorderScripts(allScripts, specificLoadOrderList, handlerCallback, initialValue) {
	
	if (specificLoadOrderList && specificLoadOrderList.length > 1) {
		
		return specificLoadOrderList.reduce(function (previousValue, script) {
			
			var index = allScripts.indexOf(script);
			
			if (index != -1) {
				
				allScripts.splice(index, 1);
				return handlerCallback(previousValue, script);
			}
			return previousValue;

		}, initialValue);
	}
	return initialValue;
}

////////////////////////////////////////////////////////////////////////
// Main API
//
module.exports.executeAllScripts = function (scriptDir, app, config, mongoose, gettext, specificLoadOrderList, extraArg0, extraArg1) {
	
	if (!path.isAbsolute(scriptDir))
		scriptDir = path.join(__dirname, "..", scriptDir);

	return xfs.getAllFiles(scriptDir, ".js", 1).then(function (allScripts) {
		
		return filterAndhandleInorderScripts(allScripts, specificLoadOrderList, function (prevPromise, script) {
			return prevPromise.then(function () {
				return require(path.join(scriptDir, script))(app, config, mongoose, gettext, extraArg0, extraArg1);
			});
		}, Promise.resolve()).then(function () {
			return Promise.all(allScripts.map(function (script) {
				return require(path.join(scriptDir, script))(app, config, mongoose, gettext, extraArg0, extraArg1);
			}));
		});
	});
};

//**********************************************************************

module.exports.executeAllScriptsSync = function (scriptDir, app, config, mongoose, gettext, specificLoadOrderList, extraArg0, extraArg1) {
	
	if (!path.isAbsolute(scriptDir))
		scriptDir = path.join(__dirname, "..", scriptDir);

	var allScripts = xfs.getAllFilesSync(scriptDir, ".js", 1);
	var results = [];

	filterAndhandleInorderScripts(allScripts, specificLoadOrderList, function (result, script) {
		results.push(require(path.join(scriptDir, script))(app, config, mongoose, gettext, extraArg0, extraArg1));
	});
	allScripts.forEach(function (script) {
		results.push(require(path.join(scriptDir, script))(app, config, mongoose, gettext, extraArg0, extraArg1));
	});
	return results;
};
