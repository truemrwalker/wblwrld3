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
 * @overview This file was used to create programmatically a webble for testing purposes.
 *
 * At this point of Webble World development, however, we don't need it anymore. Nonetheless,
 * the file is left here in case we do need, in the future, to actually bootstrap a new
 * deployment of Webble World with some standard webbles.
 * 
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

	// We don't need to generate fake webbles anymore
	//
	return console.log("Bootstrap: Skipped generation of fake webbles");

	// Create entries in db
	//
	var User = mongoose.model('User');
	var Webble = mongoose.model('Webble');

	var w = new Webble({
		"webble": {
			"instanceid": 1, //"00000000_0000_0000_0000_000000000000",
			"defid": "fundamental",
			"templateid": "fundamental",
			"templaterevision": 1,
			"displayname": "Fundamental Webble",
			"description": "Webble def file generated from fake data",
			"keywords": "simple basic",
			"author": "MickeNicanderKuwahara",

			"image": "http://icons.iconarchive.com/icons/ampeross/lamond/256/assassins-creed-icon.png",

			"protectflags": 0,
			"slotdata": {
				"send": true,
				"receive": true,
				"selectslot": "",
				"connslot": "",
                "mcdata": [],
                "slots": [
					{
						"name": "superslot",
						"category": "custom",
						"value": "1000",
						"metadata": "null"
					},
					{
						"name": "coolslot",
						"category": "custom",
						"value": "King of the jungle",
						"metadata": "null"
					}
				]
			},
			"children": [
				//{"webble": {}},
			],
			"private": {}
		}
	});

	return w.save();
};

