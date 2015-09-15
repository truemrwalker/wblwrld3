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
// xfs.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var fs = require('fs');
var path = require('path');

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function walkSync(baseDir, callback) {
    
    var filenames = fs.readdirSync(baseDir);
    
    var items = filenames.reduce(function (acc, name) {
        
        var abspath = path.join(baseDir, name);
        if (fs.statSync(abspath).isDirectory())
            acc.dirs.push(name);
        else
            acc.files.push(name);
        return acc;

    }, { "files": [], "dirs": [] });
    
    if (!callback(baseDir, items.dirs, items.files)) { // Prune if callback returns false

        items.dirs.forEach(function (d) {
            walkSync(path.join(baseDir, d), callback);
        });
    }    
}

////////////////////////////////////////////////////////////////////////
// Visiting directories
//
module.exports.walkSync = walkSync;

