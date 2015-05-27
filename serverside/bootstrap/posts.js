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
// posts.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
module.exports = function(Q, app, config, mongoose, gettext) {

	// We don't need to generate fake posts anymore
	//
	return console.log("Bootstrap: Skipped generation of fake posts");

	// Create entries in db
	//
	var Post = mongoose.model('Post');

	var count = 1821;

	var promises = [];

	for (var i = 0; i < 1821; ++i) {

		var post = new Post({
			post: {
				title: "Title #" + i.toString(),
				keywords: "auto generated bootstrap",

				body: "This is my " + i.toString() + "st POST! Hurray!",
				author: "Aristomenis Papadosifakomanologiorgakis"
			}
		});

		for (var j = 0; j < 10; ++j) {
			post.post.comments.push({
				body: "This is my " + j.toString() + "st COMMENT! w00t!",
				author: "Agisilaos Papadosifakomanologiorgakis the " + j.toString() + "st"
			});
		}

		promises.push(Q.ninvoke(post, "save"));
	}

	return Q.allSettled(promises).then(function (results) {

		results.forEach(function (result) {

			if (result.state !== 'fulfilled')
				console.log("Error: ", result.reason);
		});
	});
};

