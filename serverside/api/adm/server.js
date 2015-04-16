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
// server.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

////////////////////////////////////////////////////////////////////////
// Server management stuff
//

var cp = require('child_process');
var path = require('path');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

  app.put('/api/adm/server/reboot', auth.adm, function (req, res) {

    cp.exec(path.join(config.PROJECT_MANAGEMENT_DIR, "update-and-run.sh"), {
      encoding: 'utf8',
      timeout: 0,
      cwd: config.PROJECT_MANAGEMENT_DIR
    }, function(err, stdout, stderr) {

      if (err)
        console.log(err);
    });
    res.status(200).send(gettext("OK"));
  });

  app.put('/api/adm/server/updateapp', auth.adm, function (req, res) {

    cp.exec(path.join(config.PROJECT_MANAGEMENT_DIR, "updateapp.sh"), {
      encoding: 'utf8',
      timeout: 0,
      cwd: config.PROJECT_MANAGEMENT_DIR
    }, function(err, stdout, stderr) {

      if (err)
        res.status(200).send(stderr);
      else
        res.status(200).send(stdout);
    });
  });

};
