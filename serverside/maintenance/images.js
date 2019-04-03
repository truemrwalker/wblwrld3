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
 * @overview Autonomous maintenance script that stores Webble, data-uri images as files and
 * replaces their URL to point at those newly-created files.
 *
 * This is done purely for efficiency reasons since browsers can cache image files but cannot/
 * should not cache Webble definition JSON objects that can become huge if they encode images
 * as data-uris. See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var util = require('../lib/util');
var libGfs = require('../lib/gfs');

module.exports = function(app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');

   	var gfs = new libGfs.GFS(mongoose);

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    
    ////////////////////////////////////////////////////////////////////

    const imageDataUrlRegex = /^data:image\/(\w+);base64,/;

    return Webble.find({ 'webble.image' : imageDataUrlRegex }).exec().then(function (webbles) {

        return Promise.all(webbles.map(function (w) {

            var imageType = w.webble.image.match(imageDataUrlRegex)[1];

            return gfs.createWriteStream('images', w.webble.defid + '.' + imageType, null, null).then(function(stream) {

                return new Promise(function(resolve, reject) {

                    stream.on('finish', resolve);
                    stream.on('error', reject);

                    var buffer = new Buffer(w.webble.image.substring(19 + imageType.length), 'base64');
                    stream.end(buffer);

                    var imageFile = 'files/images/' + w.webble.defid + '.' + imageType;

                    console.log("Writing webble image to file:", imageFile, "...");

                    w.webble.image = imageFile;
                    return w.save();
                });
            });
        }));
    });
};
