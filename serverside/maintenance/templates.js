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
 * @overview Autonomous maintenance script that synchronizes all the Webble Templates under the
 * config.APP_ROOT_DIR/webbles/ sub-directory and all its sub-directories recursively.
 *
 * The script creates, modifies and deletes Webble Template objects in the database depending on
 * their status on disk. This is important to so that the Webble World development team can develop
 * Webbles offline and commit them to the same repository as the main Webble World application.
 * Note that Webble Templates are normal Webbles with "webble.defid == webble.templateid" that have
 * no child/parent Webbles and are fully defined by separate Javascript, HTML and resource files.
 * See the Webble World manual for more information (Help->Documentation).
 *
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');

var util = require('../lib/util');
var xfs = require('../lib/xfs');

Promise.promisifyAll(fs);

module.exports = function(app, config, mongoose, gettext) {

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
	var Group = mongoose.model('Group');

	var webbleDir = path.join(config.APP_ROOT_DIR, 'webbles');
	var webbleTemplates = {};

	////////////////////////////////////////////////////////////////////
	// Utility functions
    //
    function createInfo(infoDir, id, ver) {

        var infoFile = path.join(infoDir, 'info.json');
        return fs.readFileAsync(infoFile).then(function (infoFileContents) {

            var info = JSON.parse(infoFileContents, 'utf8');
            info.id = id;
            info.ver = ver;
            info.filedir = infoDir;
            info.file = infoFile;
            return info;

        }).catchReturn({ name: id, description: id + " Template", id: id, ver: ver, filedir: infoDir });
    }

	function buildFromTemplate(w, info) {

        w._updated = Date.now();

        w._owner = null;
		w._sec.groups = [];

		w.mergeWithInfoObject(info);

		var owner = info.author;
		var pubgroup = info.group;

		return Promise.resolve([owner && User.findOne({$or: [{email: owner}, {username: owner}]}).exec(),
            pubgroup && Group.findOne({ $or: [{ email: pubgroup }, { name: pubgroup }] }).exec()]).spread(function (user, group) {

                if (user)
                    w._owner = user._id;
                if (group)
                    w._sec.groups.push(group._id);

                return w.save();
            });
	}

	////////////////////////////////////////////////////////////////////
	// Load the database templates
    //
    xfs.walk(webbleDir, function (baseDir, dirs, files) {
        
        if (files.length === 0 && !util.allTrue(dirs, util.isStringNumber))
            return false;
        
        var infoDir = baseDir;
        var latestVer = 1;
        var id = path.basename(baseDir);
        
        if (files.length === 0) {
            
            infoDir = path.join(baseDir, latestVer.toString());
            latestVer = dirs.reduce(function (maxVer, verString) {
                return Math.max(verString, parseInt(verString, 10));
            }, 0);
        }
        
        if (latestVer > 0) {
            
            return createInfo(infoDir, id, latestVer).then(function (info) {
                webbleTemplates[id] = info;
            });
        }
        return true; // Handled - stop recursing into dirs

    }).then(function () { 

        ////////////////////////////////////////////////////////////////////
        // Push the webbles in the database
        //
        return Webble.find({ $where: 'this.webble.defid == this.webble.templateid' }).exec().then(function (webbles) {
            
            var promises = [];
            
            // Sync already existing templates
            //
            webbles.forEach(function (w) {
                
                var t = webbleTemplates[w.webble.defid];
                
                if (!t) {
                
                // Currently noop - we don't want to remove. It's incorrect to remove
                //
                //promises.push(w.remove());
                }
                else {
                    
                    if (!t.file) {
                        
                        var ver = t.ver; // Just in case we have a new version on the disk
                        var infoFile = path.join(t.filedir, 'info.json');
                        
                        t = w.getInfoObject();
                        t.ver = ver;
                        t.file = infoFile;
                        
                        fs.writeFileSync(infoFile, JSON.stringify(t), { encoding: 'utf8' });
                    }

                    var stats = fs.statSync(t.file);
                    if (w.webble.templaterevision !== t.ver || stats.mtime > w._updated)
                        promises.push(buildFromTemplate(w, t));
                }
                delete webbleTemplates[w.webble.defid]; // Finished working with this template
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
            return Promise.all(promises).then(function (results) {
                
                results.forEach(function (result) {
                    
                    // I'm not sure why the value may be an array (investigate, but low priority)
                    var w = result instanceof Array ? result[0] : result;
                    console.log("Synced template: ", w.webble.defid);
                });
            }).catch(function (err) {
                console.error("Error: ", err);
            });
        });
    });
};
