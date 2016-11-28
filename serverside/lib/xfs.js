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
 * @overview Utility/convenience functions for listing files under directories.
 * @module lib/xfs
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var fs = require('fs');
var path = require('path');

Promise.promisifyAll(fs);

////////////////////////////////////////////////////////////////////////
// Private convenience functions

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

/**
 * Invokes callback for every sub-directory with an array of the directories and files it contains.
 * Note that all the sub-directories are visited synchronously, in random order.
 * @param {string} baseDir - The top-level directory on which to start recursing.
 * @param {xfsWalkCallback} callback - A user-provided callback to invoke for each sub-directory.
 */
module.exports.walkSync = walkSync;

/**
 * Invokes callback for every sub-directory with an array of the directories and files it contains.
 * @param {string} baseDir - The top-level directory on which to start recursing.
 * @param {xfsWalkCallback} callback - A user-provided callback to invoke for each sub-directory.
 * @returns {Promise} A promise that is resolved with the result of the last invocation of the
 *     user-provided callback and is rejected if there was an error.
 */
module.exports.walk = walk;

/**
 * This callback is invoked for every sub-directory visited by the walk and walkSync functions.
 * @callback xfsWalkCallback
 * @param {string} baseDir - The current sub-directory.
 * @param {string[]} dirs - The directories that the current sub-directory contains.
 * @param {string[]} files - The files that the current sub-directory contains.
 * @returns {boolean} False to continue recursing or True to stop (prune).
 */

//**********************************************************************

function pickFiles(result, extname, baseDir, currDir, files, currRecursionDepth) {
	
	var relDir = path.relative(baseDir, currDir);
	
	files.forEach(function (f) {
		
		if (!extname || path.extname(f) == extname)
			result.push(path.join(relDir, f));
	});
	return currRecursionDepth <= 0; // Stop recursing further if condition is true
}

/**
 * Gets all files under the directory "baseDir" with extension "extname".
 * @param {string} baseDir - The top-level directory on which to start searching for files.
 * @param {string} extname - The extension of the files we are interested in.
 * @param {number} recursionDepth - The maximum depth in which to search for matching files.
 * @returns {Promise} A promise that is resolved with an array of the full paths of the files
 *     that are found and is rejected if there was an error.
 */
module.exports.getAllFiles = function (baseDir, extname, recursionDepth) {
	
	if (recursionDepth === undefined || recursionDepth < 0)
		recursionDepth = 32;
	
	var result = [];
	return walk(baseDir, function (currDir, dirs, files) {
		return pickFiles(result, extname, baseDir, currDir, files, recursionDepth--);
	}).return(result);
};

/**
 * Gets all files under the directory "baseDir" with extension "extname" synchronously.
 * @param {string} baseDir - The top-level directory on which to start searching for files.
 * @param {string} extname - The extension of the files we are interested in.
 * @param {number} recursionDepth - The maximum depth in which to search for matching files.
 * @returns {string[]} An array of the full paths of the files that are found.
 */
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

/**
 * Appends all its arguments to a file named "logfile.log" in the current directory.
 * This function is currently used only for debugging purposes.
 */
module.exports.log = function () {
    
    var line = "";
    for (var i = 0; i < arguments.length; ++i)
        line += arguments[i].toString() + " ";
    line += "\n";
    
    fs.appendFileSync('./logfile.log', line);
}
