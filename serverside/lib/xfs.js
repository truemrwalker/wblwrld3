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
// xfs.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var fs = require('fs');
var path = require('path');

Promise.promisifyAll(fs);

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function walkSync(baseDir, callback) {
	
	var filenames = fs.readdirSync(baseDir);
	
	var items = filenames.reduce(function (result, name) {
		
		var abspath = path.join(baseDir, name);
		if (fs.statSync(abspath).isDirectory())
			result.dirs.push(name);
		else
			result.files.push(name);
		return result;

	}, { files: [], dirs: [] });
	
	if (!callback(baseDir, items.dirs, items.files)) { // Prune if callback returns true - i.e., finished/handled
		
		items.dirs.forEach(function (d) {
			walkSync(path.join(baseDir, d), callback);
		});
	}
}

//**********************************************************************

function walk(baseDir, callback) {
	
	return fs.readdirAsync(baseDir).then(function (filenames) {
		
		var result = { files: [], dirs: [] };

		return Promise.all(filenames.map(function (name) {
			
			return fs.statAsync(path.join(baseDir, name)).then(function (stat) {
				
				if (stat.isDirectory())
					result.dirs.push(name);
				else
					result.files.push(name);
			});

		})).then(function () {
			
			var resultOrPromise = callback(baseDir, result.dirs, result.files);

			if (resultOrPromise) // Prune if callback returns true - i.e., finished/handled
				return resultOrPromise;
	
			return Promise.all(result.dirs.map(function (d) {
				return walk(path.join(baseDir, d), callback);
			}));
		});
	});
}

////////////////////////////////////////////////////////////////////////
// Visiting directories
//
module.exports.walkSync = walkSync;
module.exports.walk = walk;

//**********************************************************************

function pickFiles(result, extname, baseDir, currDir, files, currRecursionDepth) {
	
	var relDir = path.relative(baseDir, currDir);
	
	files.forEach(function (f) {
		
		if (path.extname(f) == extname)
			result.push(path.join(relDir, f));
	});
	return currRecursionDepth <= 0; // Stop recursing further if condition is true
}

module.exports.getAllFiles = function (baseDir, extname, recursionDepth) {
	
	if (recursionDepth === undefined || recursionDepth < 0)
		recursionDepth = 32;
	
	var result = [];
	return walk(baseDir, function (currDir, dirs, files) {
		return pickFiles(result, extname, baseDir, currDir, files, recursionDepth--);
	}).return(result);
};

module.exports.getAllFilesSync = function (baseDir, extname, recursionDepth) {
	
	if (recursionDepth === undefined || recursionDepth < 0)
		recursionDepth = 64;
	
	var result = [];
	walkSync(baseDir, function (currDir, dirs, files) {
		return pickFiles(result, extname, baseDir, currDir, files, recursionDepth--);
	});
	return result;
};

////////////////////////////////////////////////////////////////////////
// Quick and dirty IO stuff
//
module.exports.log = function () {
    
    var line = "";
    for (var i = 0; i < arguments.length; ++i)
        line += arguments[i].toString() + " ";
    line += "\n";
    
    fs.appendFileSync('./logfile.log', line);
}
