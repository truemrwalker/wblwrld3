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
// wiki.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');

var util = require('../lib/util');
var xfs = require('../lib/xfs');

Promise.promisifyAll(fs);

module.exports = function (app, config, mongoose, gettext) {

    var Wiki = mongoose.model('Wiki');
    var User = mongoose.model('User');

    var wikiDir = path.join(config.PROJECT_ROOT_DIR, 'wiki');
    var wikis = {};

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
    function getWikiInfo(wikiInfoFilePath) {
        return fs.readFileAsync(wikiInfoFilePath).then(function (wikiInfoContents) {
            return JSON.parse(wikiInfoContents, 'utf8');
        });
    }

    ////////////////////////////////////////////////////////////////////

    return xfs.walk(wikiDir, function (baseDir, dirs, files) {

        if (files.length !== 1 || files[0] != 'tiddlywiki.info')
            return false;

        var id = path.basename(baseDir);
        wikis[id] = path.join(baseDir, files[0]);

        return true; // Handled - stop recursing into dirs

    }).then(function () {

        return Wiki.find({}).exec().then(function (onlineWikis) {

            var promises = [];

            onlineWikis.forEach(function (wiki) {

                var w = wikis[wiki.id];

                if (!w) { // Wiki doesn't exist on disk - delete it

                    console.log("Removing wiki:", wiki.id);
                    promises.push(wiki.remove());
                }
                else { // maybe check if something changed on disk and modify online wiki accordingly

                }
                delete wikis[wiki.id];
            });

            Object.keys(wikis).forEach(function (id) {

                console.log("Adding wiki:", id);
                promises.push(getWikiInfo(wikis[id]).then(function (info) {

                    var owner = info.owner;
                    return Promise.resolve(owner && User.findOne({ $or: [{ email: owner }, { username: owner }] }).exec()).then(function (user) {

                        var w = new Wiki({
                            id : id,
                            name: info.name || id,
                            description: info.description,
                            _owner: user
                        });
                        return w.save();
                    });
                }));
            });

            return Promise.all(promises);
        });
    });
};
