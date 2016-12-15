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
 * @overview REST endpoints for creating, managing and editing Wikis.
 * @module api
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var os = require("os");
var path = require("path");
var fs = require('fs');
var mkdirp = require('mkdirp');

var mkdirpAsync = Promise.promisify(mkdirp);
Promise.promisifyAll(fs);

var util = require('../lib/util');

////////////////////////////////////////////////////////////////////////
// Meta info stuff
//
module.exports = function(app, config, mongoose, gettext, auth) {

    var Wiki = mongoose.model('Wiki');

    const options = {
        rootTiddler: "$:/core/save/all",
        renderType: "text/plain",
        serveType: "text/html",
    };

    const knownTiddlerFields = ["bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"];
    const openWikis = {};
    const createIndexHtmlArgs = [
        //"--savetiddlers", "[is[image]]", "images", "--setfield", "[is[image]]", "_canonical_uri", "$:/core/templates/canonical-uri-external-image", "text/plain",
        //"--setfield", "[is[image]]", "text", "", "text/plain",
        "--rendertiddler", "$:/plugins/tiddlywiki/tiddlyweb/save/offline", "index.html", "text/plain"
    ];

  	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    let wikiBootstrapper = null;
    let nodegit = null;
    let remoteGitCredentials = null;

    function ensureLibrariesInitialized() {

        if (!wikiBootstrapper)
            wikiBootstrapper = require("tiddlywiki/boot/boot.js");

        if (!nodegit)
            nodegit = require('nodegit');

        if (!remoteGitCredentials) {

            const sshKeysPath = path.join(process.env.HOME || process.env.USERPROFILE, ".ssh");
            remoteGitCredentials = {

                callbacks: {
                    credentials: function (url, userName) {
                        return nodegit.Cred.sshKeyNew(
                            userName,
                            path.join(sshKeysPath, "id_rsa.pub"),
                            path.join(sshKeysPath, "id_rsa"),
                            ""
                        );
                    },
                    certificateCheck: () => 1 // github will fail cert check machines
                }
            };
        }
    }

    function openLocalRepository(name) {

        let wikiRepositoryPath = path.join(config.APP_ROOT_DIR, "tmp", "wiki", name);
        return fs.statAsync(wikiRepositoryPath).catchReturn(null).then(function (stats) {

            if (stats && stats.isDirectory()) {

                return nodegit.Repository.open(wikiRepositoryPath).then(function (repo) {
                    return repo.fetchAll(remoteGitCredentials).then(function () {
                        return repo.mergeBranches("master", "origin/master").catch(function (index) {

                            console.log("Reseting (--hard) local repo due to conflicts");
                            return repo.getBranchCommit("origin/master").then(function (originHeadCommit) {
                                return nodegit.Reset.reset(repo, originHeadCommit, nodegit.Reset.TYPE.HARD);
                            });

                        }).then(() => repo);
                    });
                });
            }
            else {

                return Wiki.findOne({ id: name }).lean().exec().then(function (wiki) {

                    if (!wiki)
                        throw new util.RestError(gettext("Requested object does not exist", 404));

                    return mkdirpAsync(wikiRepositoryPath).then(function () {

                        return nodegit.Clone(wiki.repository, wikiRepositoryPath, {
                            fetchOpts: remoteGitCredentials
                        });
                    });
                });
            }
        });
    }

    function closeLocalRepository(repo, user) {

        return repo.refreshIndex().then(function (index) {

            return index.addAll(".", 0).then(() => index.write()).then(() => index.writeTree()).then(function (oid) {

                return repo.getHeadCommit().then(function (parent) {

                    if (parent !== null) // To handle a fresh repo with no commits
                        parent = [parent];

                    var authorName = (user && user.name && user.name.full) || "Unknown User";
                    var authorEmail = (user && user.email) || config.APP_EMAIL_ADDRESS;

                    var author = nodegit.Signature.now(authorName, authorEmail);
                    var message = "Published from host: " + os.hostname();

                    return repo.createCommit("HEAD", author, author, message, oid, parent);

                }).then(function (commitId) {

                    console.log("NEW COMMIT:", commitId);

                }).then(function () {

                    return repo.getRemote("origin").then(function (remote) {

                        return remote.push(["refs/heads/master:refs/heads/master"], remoteGitCredentials).catch(function () {

                            return repo.mergeBranches("master", "origin/master").catch(function (index) {

                                console.log("Reseting (--hard) local repo due to conflicts");
                                return repo.getBranchCommit("origin/master").then(function (originHeadCommit) {
                                    return nodegit.Reset.reset(repo, originHeadCommit, nodegit.Reset.TYPE.HARD);
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    function openWiki(name) {

        ensureLibrariesInitialized();

        return openLocalRepository(name).then(function (repo) {

            let tw = wikiBootstrapper.TiddlyWiki();

            tw.boot.argv = [repo.workdir()];
            tw.boot.boot();

            if (!tw.boot.wikiTiddlersPath) {
                tw.utils.warning("Warning: Wiki folder '" + tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
            }

            if (!tw.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !tw.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
                tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
            }

            return { tw: tw, repo: repo };
        });
    }

    function closeWiki(name, user) {

        if (openWikis.hasOwnProperty(name)) {

            var repo = openWikis[name].repo;
            return closeLocalRepository(repo, user).then(function () {

                console.log("CLOSED local repository:", name);
                delete openWikis[name];
            });
        }
        else
            return Promise.resolve();
    }

    function getWiki(name) {

        if (openWikis.hasOwnProperty(name))
            return Promise.resolve(openWikis[name].tw);
        else {

            return openWiki(name).then(function (wiki) {

                openWikis[name] = wiki;
                return wiki.tw;
            });
        }
    }

    function generateIndexHtmlFromWiki(tw, outputPath) {

        return Promise.try(function () {

            var commander = new tw.Commander(
                createIndexHtmlArgs,
                (err) => { if (err) tw.utils.error("Error: " + err) },
                tw.wiki,
                { output: process.stdout, error: process.stderr }
            );
            commander.outputPath = outputPath;
            commander.execute();
        });
    }

    function normalizeWiki(wiki) {
        return util.stripObject(wiki);
    }

   	////////////////////////////////////////////////////////////////////
    // Wiki (as a first-class value) manipulation routes
    //
    app.get('/api/wiki', auth.usr, function (req, res) {

        const ownerCond = { $or: [{ _owner: req.user._id }, { _owner: null }, { _contributors: req.user._id }] };

        return Wiki.find(ownerCond).lean().exec().then(function (wikis) {

            if (!wikis)
                throw new util.RestError(gettext("Cannot retrieve wikis"));

            res.json(util.transform_(wikis, normalizeWiki));

        }).catch(err => util.resSendError(res, err));
    });

    app.post('/api/wiki', auth.usr, function (req, res) {

    });

    app.delete('/api/wiki/:wiki', auth.usr, function (req, res) {

    });

    //******************************************************************

    var sharingOps = require('../lib/ops/sharing')(app, config, mongoose, gettext, auth);

    app.put('/api/wiki/:id/share', auth.usr, function (req, res) {

        return sharingOps.updateContributors(req, Wiki.findOne({ id: req.params.id }))
            .then(users => res.json(users))
            .catch(err => util.resSendError(res, err));
    });

    app.get('/api/wiki/:id/share', auth.usr, function (req, res) {

        return sharingOps.getContributors(req, Wiki.findOne({ id: req.params.id }))
            .then(users => res.json(users))
            .catch(err => util.resSendError(res, err));
    });

    app.delete('/api/wiki/:id/share', auth.usr, function (req, res) {

        return sharingOps.clearContributors(req, Wiki.findOne({ id: req.params.id }))
            .then(() => res.status(200).send(gettext("Successfully deleted")))
            .catch(err => util.resSendError(res, err));
    });

    //******************************************************************

    app.get('/api/wiki/:wiki/save', auth.usr, function (req, res) {

        closeWiki(req.params.wiki, req.user)
            .then(() => res.status(200).send(gettext("Successfully saved")))
            .catch(err => util.resSendError(res, err));
    });

   	////////////////////////////////////////////////////////////////////
    // TW-specific routes. For these to work there has to be a tiddler called:
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

            getWiki(req.params.wiki).then(function (tw) {

                let wiki = tw.wiki;

                res.writeHead(200, { "Content-Type": options.serveType });
                var text = wiki.renderTiddler(options.renderType, options.rootTiddler);
                res.end(text, "utf8");
            });
        }
    });

    app.get('/api/wiki/:wiki/status', auth.usr, function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

            let wiki = tw.wiki;

            res.json({

                username: req.user && (req.user.username || req.user.name.full || req.user.email) || 'Anonymous',
                space: { recipe: "default" },
                tiddlywiki_version: tw.version
            });
        });
    });

    app.get('/api/wiki/:wiki/favicon.ico', function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

            let wiki = tw.wiki;

            res.writeHead(200, { "Content-Type": "image/x-icon" });
            var buffer = wiki.getTiddlerText("$:/favicon.ico", "");
            res.end(buffer, "base64");
        });
    });

    app.get('/api/wiki/:wiki/recipes/default/tiddlers.json', auth.usr, function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

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
    });

    app.get('/api/wiki/:wiki/recipes/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

            let wiki = tw.wiki;

            let title = req.params.tiddler;
            let tiddler = wiki.getTiddler(title);
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
    });

    //******************************************************************

    app.put('/api/wiki/:wiki/recipes/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

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
    });

    app.delete('/api/wiki/:wiki/bags/default/tiddlers/:tiddler', auth.usr, function (req, res) {

        getWiki(req.params.wiki).then(function (tw) {

            let wiki = tw.wiki;

            let title = req.params.tiddler;

            wiki.deleteTiddler(title);

            res.status(204).send(gettext("OK"));

            //res.writeHead(204, "OK", { "Content-Type": "text/plain" });
            //res.end();
        });
    });
};
