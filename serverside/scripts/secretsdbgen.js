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
 * @overview Generates an encrypted "secretsdb.ejson" file from a plain-text "secretsdb.json"
 * file, which has to be located in a "wblwrld3" sub-directory under the directory which
 * is contained in the "homeDir" variable.
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var path = require('path');
var crypt = require('../lib/crypt');
var fs = require('fs');

var homeDir = process.env.LOCALAPPDATA || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var secretsFileUnencrypted = path.join(homeDir, "wblwrld3", "secretsdb.json");
var secretsFileEncrypted = path.join(homeDir, "wblwrld3", "secretsdb.ejson");

var hash = crypt.createHash(fs.readFileSync('../secretsdb.json', { encoding: 'utf8' }).replace(/\r\n/g, '\n'));
var contents = crypt.encryptTextSync(fs.readFileSync(secretsFileUnencrypted, { encoding: 'utf8' }), hash);
fs.writeFileSync(secretsFileEncrypted, contents, { encoding: 'utf8' });
