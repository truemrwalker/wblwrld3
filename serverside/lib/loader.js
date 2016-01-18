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

var fs = require('fs');
var path = require('path');

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//

////////////////////////////////////////////////////////////////////////
//
//
module.exports.executeAllScripts = function (scriptDirectory, app, config, mongoose, gettext, specificLoadOrderList) {

	var allScripts = fs.readdirSync(scriptDirectory)
		.filter(function(f) { return path.extname(f) == '.js'; });

	var loadOrderPromise = Promise.resolve(null);
	if (specificLoadOrderList && specificLoadOrderList.length > 1) {

		specificLoadOrderList.forEach(function(script) {

			var index = allScripts.indexOf(script);
			if (index != -1) {

				allScripts.splice(index, 1);
				loadOrderPromise = loadOrderPromise.then(function() {
					return require(path.join(scriptDirectory, script))(app, config, mongoose, gettext);
				});
			}
		});
	}

	return loadOrderPromise.then(function() {

		var promises = [];

		allScripts.forEach(function(script) {
			promises.push(require(path.join(scriptDirectory, script))(app, config, mongoose, gettext));
		});

        return Promise.all(promises).then(function () { return 0; }, function (err) {

            console.error("Error: ", err);
            return 1;
        });
	});
};

//**********************************************************************

module.exports.executeAllScriptsSync = function (scriptDirectory, app, config, mongoose, gettext, specificLoadOrderList) {

	var allScripts = fs.readdirSync(scriptDirectory)
		.filter(function(f) { return path.extname(f) == '.js'; });

	if (specificLoadOrderList && specificLoadOrderList.length > 1) {

		specificLoadOrderList.forEach(function(script) {

			var index = allScripts.indexOf(script);
			if (index != -1) {

				allScripts.splice(index, 1);
				require(path.join(scriptDirectory, script))(app, config, mongoose, gettext);
			}
		});
	}

	allScripts.forEach(function(script) {
		require(path.join(scriptDirectory, script))(app, config, mongoose, gettext);
	});
};

//**********************************************************************

module.exports.executeAllRouteScriptsSync = function (scriptDirectory, app, config, mongoose, gettext, auth) {

	fs.readdirSync(scriptDirectory).forEach(function(apiModule) {
		try {

			var filePath = path.join(scriptDirectory, apiModule);
			var stats = fs.statSync(filePath);

			if (stats.isFile())
				require(filePath)(app, config, mongoose, gettext, auth);
			else if (stats.isDirectory()) {

				fs.readdirSync(filePath).forEach(function (apiSubModule) {
					require(path.join(filePath, apiSubModule))(app, config, mongoose, gettext, auth);
				});
			}
		}
		catch (e) {
			console.log("Could not load api module:", apiModule, "ERROR:", e);
		}
	});
};

//**********************************************************************

module.exports.executeAllSocketScriptsSync = function (scriptDirectory, app, config, mongoose, gettext, io, socketAuth) {

	fs.readdirSync(scriptDirectory).forEach(function(rtModule) {
		try {
			require(path.join(scriptDirectory, rtModule))(app, config, mongoose, gettext, io, socketAuth);
		}
		catch (e) {
			console.log("Could not load realtime module:", rtModule, "ERROR:", e);
		}
	});
};
