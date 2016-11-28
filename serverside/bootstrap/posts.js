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
 * @overview This file was used to create programmatically a post for testing purposes.
 *
 * At this point of Webble World development, however, we don't need it anymore. Nonetheless,
 * the file is left here in case we do need, in the future, to actually bootstrap a new
 * deployment of Webble World with some standard posts.
 * 
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

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

		promises.push(post.save());
	}

    return Promise.all(promises).then(function (results) {
        // Do something with the results (if you want)
    }).catch(function (err) {
        console.error("Error: ", err);
    });
};
