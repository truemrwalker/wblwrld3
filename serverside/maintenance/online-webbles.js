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
 * @overview Autonomous maintenance script that fetches and stores all the Webbles published
 * under https://wws.meme.hokudai.ac.jp that is the reference (central) deployment of Webble World.
 *
 * Apart from the database objects, any associated code or resource files are also fetched and
 * stored in the local database. This script runs only when config.SYNC_ONLINE_WEBBLES is true
 * and is thus recommended to invoke it with the following command:
 * node serverside/web-server.js --deployment maintenance --sync-online-webbles 1
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var path = require('path');
var request = require('request');

var util = require('../lib/util');
var libGfs = require('../lib/gfs');

module.exports = function(app, config, mongoose, gettext) {

    if (!config.SYNC_ONLINE_WEBBLES)
        return;

    const onlineWebbleWorldServer = "https://wws.meme.hokudai.ac.jp";

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
	var Group = mongoose.model('Group');

    var gfs = new libGfs.GFS(mongoose);

	////////////////////////////////////////////////////////////////////
	// Utility functions
    //
    function getOnlinePath(path) {

        return new Promise(function (resolve, reject) {

            request(onlineWebbleWorldServer + path, function (err, res, body) {

                if (!err && res.statusCode == 200)
                    resolve(JSON.parse(body));
                else
                    reject(err);
            });
        });
    }

    //******************************************************************

    function getAndSaveRemoteFile(remoteFilePath) {

        var localFilePath = remoteFilePath.replace(/\//g, path.sep);
        var directory = path.dirname(localFilePath);
        var filename = path.basename(localFilePath);

        if (directory.startsWith("files"))
            directory = directory.substring(6);

        console.log("SAVING REMOTE FILE:", remoteFilePath, "to directory:", directory);

        return gfs.uploadLazy(() => request(onlineWebbleWorldServer + "/" + remoteFilePath), directory, filename, null, null);
    }

    function extractAndSaveRemoteFiles(onlineWebble) {

        var promise = onlineWebble.webble.image.startsWith("files") ?
            getAndSaveRemoteFile(onlineWebble.webble.image) : Promise.resolve();

        if (onlineWebble.files && onlineWebble.files.length != 0) {

            promise = onlineWebble.files.reduce(function (prev, file) {
                var filePath = "files/webbles/" + onlineWebble.webble.templateid + "/" + onlineWebble.webble.templaterevision + "/" + file;
                return prev.then(() => getAndSaveRemoteFile(filePath));
            }, promise);
        }
        return promise;
    }

    //******************************************************************

	function buildFromSearchResult(w, infoWebble) {

        w._created = infoWebble.created;
        w._updated = infoWebble.updated;

        w._owner = null;
		w._sec.groups = [];

        var owner = infoWebble.author;
        var pubgroup = null;

        if (infoWebble.groups && infoWebble.groups.length)
            pubgroup = infoWebble.groups[0];

		return Promise.join(owner && User.findOne({$or: [{email: owner}, {username: owner}]}).exec(),
            pubgroup && Group.findOne({ $or: [{ email: pubgroup }, { name: pubgroup }] }).exec(), function (user, group) {

                if (user)
                    w._owner = user._id;
                if (group)
                    w._sec.groups.push(group._id);

                return getOnlinePath('/api/webbles/' + infoWebble.webble.defid).then(function (onlineWebble) {

                    w.webble = onlineWebble.webble;

                    return extractAndSaveRemoteFiles(onlineWebble)
                        .then(() => w.save());
                });
            });
	}

    //******************************************************************

	////////////////////////////////////////////////////////////////////
	// Get all the webbles
    //
    return getOnlinePath('/api/webbles').then(function (foundWebbles) {

        return Promise.all(foundWebbles.map(function (onlineWebble) {

            return Webble.findOne({ "webble.defid": onlineWebble.webble.defid }).exec().then(function (localWebble) {

                if (!localWebble)
                    return buildFromSearchResult(new Webble(), onlineWebble);
                else if (localWebble.webble.templaterevision < onlineWebble.webble.templaterevision)
                    return buildFromSearchResult(localWebble, onlineWebble);
            });
        }));
    });
};
