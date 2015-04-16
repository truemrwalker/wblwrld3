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
// secrets.js
// Created by Giannis Georgalis on 3/23/2015
//
module.exports = (function() {

  var path = require('path');
  var crypt = require('./lib/crypt');
  var fs = require('fs');

  var homeDir = process.env.LOCALAPPDATA || process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  var secretsFile = path.join(homeDir, "wblwrld3", "secretsdb.ejson");

  var obj;

  try {
    var hash = crypt.createHash(fs.readFileSync(path.join(__dirname, 'config.js'), {encoding: 'utf8'}).replace(/\r\n/g, '\n'));
    obj = JSON.parse(crypt.decryptText(fs.readFileSync(secretsFile, {encoding: 'utf8'}), hash));
  }
  catch (err) {
    obj = {};
  }

  return {
    get: function(key) {
      return obj[key] || 'Could_Not_Retrieve_Secret_For_Key_' + key;
    }
  };

})();
