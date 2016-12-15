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
 * @overview Deprecated REST endpoints for performing update operations on the server.
 * @deprecated
 * @module api/adm
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var cp = require('child_process');
var path = require('path');

////////////////////////////////////////////////////////////////////////
// Server management stuff
//
module.exports = function(app, config, mongoose, gettext, auth) {

	app.put('/api/adm/server/restart', auth.adm, function (req, res) {

		setTimeout(function () {

			cp.exec(path.join(config.PROJECT_MANAGEMENT_DIR, "restartserver.sh"), {
				encoding: 'utf8',
				timeout: 0,
				cwd: config.PROJECT_MANAGEMENT_DIR
			}, function (err, stdout, stderr) {

				if (err)
					console.log(err);
			});

		}, 600);

		res.status(200).send(gettext("OK"));
	});

	app.put('/api/adm/server/updateapp', auth.adm, function (req, res) {

		cp.exec(path.join(config.PROJECT_MANAGEMENT_DIR, "updateapp.sh"), {
			encoding: 'utf8',
			timeout: 0,
			cwd: config.PROJECT_MANAGEMENT_DIR
		}, function (err, stdout, stderr) {

			if (err)
				res.status(200).send(stderr);
			else
				res.status(200).send(stdout);
		});
	});

};
