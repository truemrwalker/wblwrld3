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
// workspaces.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//


module.exports = function(Q, app, config, mongoose, gettext) {

	// Create entries in db
	//
	var User = mongoose.model('User');
	var Webble = mongoose.model('Webble');
	var Workspace = mongoose.model('Workspace');

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

	var ws = new Workspace({
		"workspace" : {

			"name": "The best workspace in the universe",
			creator: "Foofootos",
			collaborators: [],
			webbles: [w]
		},
		_owner: null
	});

	return Q.ninvoke(Workspace, "remove", {})
		.then(function() { return Q.ninvoke(ws, "save"); });
};

