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
// templates.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var path = require('path');
var fs = require('fs');

module.exports = function(Q, app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
  var Group = mongoose.model('Group');

	var webbleDir = path.join(config.APP_ROOT_DIR, 'webbles');
	var webbleTemplates = {};

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function createInfoSync(id, ver) {
		try {

			var filePath = path.join(webbleDir, id, ver.toString(), 'info.json');
			var info = JSON.parse(fs.readFileSync(filePath), 'utf8');
			info.id = id;
			info.ver = ver;
			return info;
		}
		catch(err) {
			return { name: id, description: id + " Template", id: id, ver: ver };
		}
	}

	function buildFromTemplate(w, info) {

		w._owner = null;
    w._sec.groups = [];

		w.mergeWithInfoObject(info);

		var owner = info.author;
    var pubgroup = info.group;

		return Q.spread([ owner && Q.ninvoke(User, "findOne", {$or: [{ email: owner }, { username: owner }]}),
      pubgroup && Q.ninvoke(Group, "findOne", {$or: [{ email: pubgroup }, { name: pubgroup }]}) ],
      function(user, group) {

        if (user)
          w._owner = user._id;
        if (group)
          w._sec.groups.push(group._id);

				return Q.ninvoke(w, "save");
			});
	}

	////////////////////////////////////////////////////////////////////
	// Load the database templates
	//
	fs.readdirSync(webbleDir).forEach(function(id) {

		try {

			var latestVer = 0;
			fs.readdirSync(path.join(webbleDir, id)).forEach(function(ver) {

				var currVer = parseInt(ver, 10);
				if (currVer > latestVer)
					latestVer = currVer;
			});

			if (latestVer > 0) {

				webbleTemplates[id] = createInfoSync(id, latestVer);
				//console.log("Loaded webble template: ", id);
			}
		}
		catch (e) {
			console.error("Could not process webble template:", id, "ERROR:", e);
		}
	});

	////////////////////////////////////////////////////////////////////
	// Push the webbles in the database
	//
	return Q.ninvoke(Webble, "find", { $where: 'this.webble.defid == this.webble.templateid' })
		.then(function(webbles) {

			var promises = [];

			// Sync already existing templates
			//
			webbles.forEach(function (w) {

				var t = webbleTemplates[w.webble.defid];

				if (!t)
					promises.push(Q.ninvoke(w, "remove"));
				else if (w.webble.templaterevision !== t.ver)
					promises.push(buildFromTemplate(w, t));

				delete webbleTemplates[w.webble.defid];
			});

			// Add missing templates
			//
			Object.keys(webbleTemplates).forEach(function (k) {

				var t = webbleTemplates[k];

				if (!t.noautogen || config.DEPLOYMENT === 'development') {

					var w = new Webble();
					promises.push(buildFromTemplate(w, t));
				}
				else
					console.log("Skipping template (noautogen): ", t.id);

				delete webbleTemplates[k];
			});

			// Wait to finish and report the templates that were updated
			//
			return Q.allSettled(promises).then(function (results) {

				results.forEach(function (result) {

					if (result.state === 'fulfilled') {

						// I'm not sure why the value may be an array (investigate, but low priority)
						var w = result.value instanceof Array ? result.value[0] : result.value;

						console.log("Synced template: ", w.webble.defid);
					}
					else {
						console.error("Error: ", result.reason);
					}
				});
			});
		});
};
