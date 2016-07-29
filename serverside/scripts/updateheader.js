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
// updateHeader.js
// Created by Giannis Georgalis on 3/23/2015
//
var fs = require('fs');
var path = require('path');

////////////////////////////////////////////////////////////////////////
// Update header stuff
//
var stdHeader = /\/\/\n\/\/ Webble World 3\.0/;
var liteHeader = /\/\*\*\n \* Created by jgeorgal (on .+)\.\n \*\//;

var headerSep = "//\n\n";
var headerText = fs.readFileSync('header.txt', { encoding: 'utf8' });
var licenseText = headerText.slice(0, headerText.indexOf(headerSep) + headerSep.length);
var subHeaderText = headerText.slice(licenseText.length, headerText.indexOf(headerSep, licenseText.length) + headerSep.length);

var todayText = "on " + new Date().toString();

function updateHeader(filename, isClientSideFile) {

  var contents = fs.readFileSync(filename, { encoding: 'utf8' });

  var stdHeaderMatch = stdHeader.exec(contents);
  if (!stdHeaderMatch) { // Doesn't contain (yet) a standardized header

    if (isClientSideFile) {

      if (contents.indexOf('@author Giannis Georgalis') == -1) // Don't touch Micke's files
        return;

      if (path.extname(filename) == '.html')
        contents = '<!--\n' + licenseText + '-->\n\n' + contents;
      else
        contents = licenseText + contents;

    }
    else {

      var dateText = todayText;

      var lite = liteHeader.exec(contents);
      if (lite) {
        dateText = lite[1];
        contents = contents.replace(liteHeader, '');
      }
      contents = licenseText + subHeaderText.replace('#file', path.basename(filename))
        .replace('#date', dateText) + contents;
    }
  }
  else { // Contains a standardized header, so just replace it

    var prefix = contents.substr(0, stdHeaderMatch.index); // not .substring()

    var index = contents.indexOf(headerSep, stdHeaderMatch.index);
    if (index != -1)
      contents = contents.slice(index + headerSep.length);

    contents = prefix + licenseText + contents;
  }

  // Finally, remove extraneous newlines
  //
  contents = contents.replace(/\n\n\n+/g, '\n');

  //console.log(contents);
  fs.writeFileSync(filename, contents, { encoding: 'utf8' });
}

////////////////////////////////////////////////////////////////////////
// Filesystem stuff
//
function walkSync(baseDir, callback, omitDirs) {

  var filenames = fs.readdirSync(baseDir);

  var items = filenames.reduce(function (acc, name) {

    var abspath = path.join(baseDir, name);
    if (fs.statSync(abspath).isDirectory())
      acc.dirs.push(name);
    else
      acc.files.push(name);
    return acc;

  }, {"files": [], "dirs": []});

  callback(baseDir, items.dirs, items.files);

  items.dirs.forEach(function (d) {

    if (omitDirs && omitDirs.length > 0 && omitDirs.indexOf(d) != -1)
      return;

    var subdir = path.join(baseDir, d);
    walkSync(subdir, callback);
  });
}

////////////////////////////////////////////////////////////////////////
// Doing the update stuff for the server files
//

//updateHeader('updateHeader.js');
//process.exit(0);

var rootServerDir = path.normalize(path.join(__dirname, '..'));

walkSync(rootServerDir, function(baseDir, dirs, files) {
  files.forEach(function(f) {

    if (path.extname(f) == '.js')
      updateHeader(path.join(baseDir, f));
  });
});

////////////////////////////////////////////////////////////////////////
// Doing the update stuff for the client files
//
var rootAppDir = path.normalize(path.join(__dirname, '../../app'));

walkSync(rootAppDir, function(baseDir, dirs, files) {
  files.forEach(function(f) {

    if (['.js', '.html'].indexOf(path.extname(f)) != -1)
      updateHeader(path.join(baseDir, f), true);
  });
}, [ "bower_components", "devwebbles", "webbles", "libs" ]);

//updateHeader('updateHeader.js');
//updateHeader('../../app/views/adm.html', true);
