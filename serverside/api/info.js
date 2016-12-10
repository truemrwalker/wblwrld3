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
// info.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var os = require('os');

////////////////////////////////////////////////////////////////////////
// Meta info stuff
//
module.exports = function(app, config, mongoose, gettext, auth) {

    app.get('/api/info/availability', function (req, res) {
        res.json({

			// Micke expects these two fields with these strings as they are
            dbStatus: 'Ready and responding',
            webservicestatus: 'Ready and responding',
			happylevel: "Very happy"
        });
    });

	app.get('/api/info/os', auth.dev, function (req, res) {
		res.json({

			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus()
		});
	});

	app.post('/api/info/committed', function (req, res) {

		console.log("--> START COMMITTED:\n", req.body, "\nEND COMMITTED <--");
		res.status(200).send(gettext("OK"));
	});
};
