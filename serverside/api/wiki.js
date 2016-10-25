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

var path = require("path");

////////////////////////////////////////////////////////////////////////
// Meta info stuff
//
module.exports = function(app, config, mongoose, gettext, auth) {

    const options = {
        rootTiddler: "$:/core/save/all",
        renderType: "text/plain",
        serveType: "text/html",
    };

    const knownTiddlerFields = ["bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"];

    const openWikis = {};
    let wikiBootstrapper = null;

  	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    function openWiki(name) {

        if (!wikiBootstrapper)
            wikiBootstrapper = require("tiddlywiki/boot/boot.js");

        let tw = wikiBootstrapper.TiddlyWiki();

        tw.boot.argv = [path.join(config.PROJECT_ROOT_DIR, "wiki", name)];
        tw.boot.boot();

        if (!tw.boot.wikiTiddlersPath) {
            tw.utils.warning("Warning: Wiki folder '" + tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
        }

        if (!tw.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !tw.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
            tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
        }

        return openWikis[name] = tw;
    }

    function closeWiki(name) {

        delete openWikis[name];
    }

    function getWiki(name) {

        if (openWikis.hasOwnProperty(name))
            return openWikis[name];
        else
            return openWiki(name);
    }

   	////////////////////////////////////////////////////////////////////
    // Routes: for these paths to work there has to be a tiddler called:
    //      $:/config/tiddlyweb/host
    // That contains the following:
    //      $protocol$//$host$/api/wiki/hop/
    //
    // See also:
    //      wblwrld3/wiki/hop/tiddlers/$__config_tiddlyweb_host.tid
    //
    app.get('/api/wiki/:wiki', function (req, res) {

        if (!req.isAuthenticated()) {

            if (!req.query.embed)
                res.redirect("/#/login?ref=/api/wiki/" + req.params.wiki);
            else
                res.status(401).end(); // res.status(403).end(); // Forbidden
        }
        else {

            let tw = getWiki(req.params.wiki);
            let wiki = tw.wiki;

            res.writeHead(200, { "Content-Type": options.serveType });
            var text = wiki.renderTiddler(options.renderType, options.rootTiddler);
            res.end(text, "utf8");
        }
    });

    app.get('/api/wiki/:wiki/status', auth.usr, function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        res.json({

            username: req.user && (req.user.username || req.user.name.full || req.user.email) || 'Anonymous',
            space: { recipe: "default" },
            tiddlywiki_version: tw.version
        });
    });

    app.get('/api/wiki/:wiki/favicon.ico', function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        res.writeHead(200, { "Content-Type": "image/x-icon" });
        var buffer = wiki.getTiddlerText("$:/favicon.ico", "");
        res.end(buffer, "base64");
    });

    app.get('/api/wiki/:wiki/recipes/default/tiddlers.json', auth.usr, function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        var tiddlers = [];
        wiki.forEachTiddler({ sortField: "title" }, function (title, tiddler) {

            var tiddlerFields = {};
            tw.utils.each(tiddler.fields, function (field, name) {
                if (name !== "text") {
                    tiddlerFields[name] = tiddler.getFieldString(name);
                }
            });
            tiddlerFields.revision = wiki.getChangeCount(title);
            tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
            tiddlers.push(tiddlerFields);
        });

        res.json(tiddlers);
    });

    app.get('/api/wiki/:wiki/recipes/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        let tiddler = state.wiki.getTiddler(req.params.tiddler);
        let tiddlerFields = {};

        if (tiddler) {

            tw.utils.each(tiddler.fields, function (field, name) {

                var value = tiddler.getFieldString(name);
                if (knownTiddlerFields.indexOf(name) !== -1) {
                    tiddlerFields[name] = value;
                } else {
                    tiddlerFields.fields = tiddlerFields.fields || {};
                    tiddlerFields.fields[name] = value;
                }
            });
            tiddlerFields.revision = wiki.getChangeCount(title);
            tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";

            res.json(tiddlerFields);
        }
        else
            res.status(404).end();
    });

    //******************************************************************

    app.put('/api/wiki/:wiki/recipes/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        let title = req.params.tiddler;
        let fields = req.body;

        // Pull up any subfields in the `fields` object
        if (fields.fields) {

            tw.utils.each(fields.fields, function (field, name) {
                fields[name] = field;
            });
            delete fields.fields;
        }

        // Remove any revision field
        delete fields.revision;

        wiki.addTiddler(new tw.Tiddler(wiki.getCreationFields(), fields, { title: title }, wiki.getModificationFields()));
        var changeCount = wiki.getChangeCount(title).toString();

        res.writeHead(204, "OK", {
            Etag: "\"default/" + encodeURIComponent(title) + "/" + changeCount + ":\"",
            "Content-Type": "text/plain"
        });
        res.end();
    });

    app.delete('/api/wiki/:wiki/bags/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        let tw = getWiki(req.params.wiki);
        let wiki = tw.wiki;

        let title = req.params.tiddler;

        wiki.deleteTiddler(title);

        res.status(204).send(gettext("OK"));

        //res.writeHead(204, "OK", { "Content-Type": "text/plain" });
        //res.end();
    });
};
