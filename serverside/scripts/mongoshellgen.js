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
 * @overview Generates the "mongoshell.js" file, which is included in this directory
 * and which is used for bootstrapping the Webble World server's mongodb database
 * and its principal user. The mongoshell.js file has to be generated because it
 * needs to be self-contained (not contain any external dependencies) since it is evaluated
 * by the mongo shell program. Therefore, the present script, which can use the
 * local libraries and read the configuration values and secrets, uses those to
 * generate the self-contained "mongoshell.js" file with the correct values/parameters.
 *
 * @author Giannis Georgalis
 */

var config = require('../config');
var path = require('path');
var fs = require('fs');

// Build configStr
//
var fields = [ "MONGODB_DB_NAME", "MONGODB_DB_USERNAME", "MONGODB_DB_PASSWORD" ];
var configObj = {};
var configStr = "var config = ";

fields.forEach(function(f) {
	configObj[f] = config[f];
});
configStr += JSON.stringify(configObj) + ";";

// Replace contents with configStr
//
var scriptContents = fs.readFileSync('mongoshell.js', {encoding: 'utf8'});
var newContents = scriptContents.replace(/var config = \{[^}]*?};/, configStr);
fs.writeFileSync('mongoshell.js', newContents, { encoding: 'utf8' });
