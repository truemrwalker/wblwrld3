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
 * @overview REST endpoints for handling Webbles.
 * @module api
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

var path = require('path');
var util = require('../lib/util');

////////////////////////////////////////////////////////////////////////
// At startup, load all webble descriptions from disk
//
module.exports = function(app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
	var Post = mongoose.model('Post');

    const webbleDir = 'webbles';
    const excludeWebbleFields = '-webble.protectflags -webble.modelsharees -webble.slotdata -webble.children -webble.private';

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    var groupNameCache = {};

    function normalizeWebble(w, isVerified, isTrusted, files) {

        var obj = { webble: w.webble };

        obj.created = w._created || w._id.getTimestamp() || Date.now();
        obj.updated = w._updated || new Date();
        obj.rating = w._rating.average;
        obj.rating_count = w._rating.count;
        obj.is_shared = w._contributors.length != 0;

        obj.is_verified = !!isVerified;
        obj.is_trusted = !!isTrusted;

        obj.files = files;

        var groupNameCache = app.locals.groupNameCache;

        if (groupNameCache && w._sec.groups)
            obj.groups = w._sec.groups.map(gId => groupNameCache[gId.toString()] || "Hidden");

        //console.log("***| RETURNING WEBBLE: ", w.webble.defid, "|***");
        return obj;
	}

	////////////////////////////////////////////////////////////////////
    // Routes for Webbles
    //
	var verifyOps = require('../lib/ops/verifying')(app, config, mongoose, gettext, auth);

	app.get('/api/webbles', auth.non, function (req, res) {

	    var query = util.buildQuery(req.query, ['q', 'count', 'verify'], 'webble', {
		    "rating" : "_rating.average",
		    "rating_count" : "_rating.count",
		    "updated" : "_updated",
		    "created" : "_created"
	    });

	    if (req.query.q) {

		    var q = new RegExp(req.query.q, 'i');

		    query.conditions["$or"] = [
			    { "webble.defid" : q },
			    { "webble.displayname" : q },
			    { "webble.description" : q },
			    { "webble.keywords" : q },
			    { "webble.author" : q }
		    ];
	    }

        // Allow webbles to be queried from different domains:
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");

	    if (req.query.count) {

		    Webble.count(query.conditions, function (err, count) {
			    res.json(err ? 0 : count);
		    });
	    }
	    else {

		    //console.log("Query with conditions:", query.conditions, "...and options:", query.options);

            return Webble.find(query.conditions, excludeWebbleFields, query.options).lean().exec().then(function (results) {

                if (!results)
                    throw new util.RestError(gettext("There are not any webbles"));

                if (req.query.verify && req.query.verify === '1' && req.user) {

                    return verifyOps.verify(req, results).then(function (trustResults) {

                        if (results.length != trustResults.length)
                            res.json(util.transform_(results, normalizeWebble));
                        else {

                            for (var i = 0; i < results.length; ++i)
                                results[i] = normalizeWebble(results[i], true, trustResults[i]);

                            res.json(results);
                        }
                    });
                }
                else
                    res.json(util.transform_(results, normalizeWebble));

            }).catch(err => util.resSendError(res, err, gettext("Could not retrieve webbles")));
	    }
    });

	app.get('/api/mywebbles', auth.usr, function (req, res) {

        const ownerCond = { $or: [{ _owner: req.user._id }, { _owner: null }, { _contributors: req.user._id }] };

        return Webble.find(ownerCond, excludeWebbleFields).lean().exec().then(function (webbles) {

            if (!webbles)
                throw new util.RestError(gettext("Cannot retrieve webbles"));

            res.json(util.transform_(webbles, normalizeWebble));

        }).catch(err => util.resSendError(res, err));
	});

	//******************************************************************

    var fsOps = require('../lib/ops/gfsing')(app, config, mongoose, gettext, auth);

    app.get('/api/webbles/:id', auth.non, function(req, res) {

        return Webble.findOne({ "webble.defid": req.params.id }).exec().then(function(webble) {

            if (!webble)
                throw new util.RestError(gettext("Webble does not exist"));

			// Allow webbles to be loaded from different domains:
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");

            if (webble.webble.defid === webble.webble.templateid) {

                return fsOps.associatedFiles(req, webble, path.join(webbleDir, webble.webble.defid)).then(function (files) {

                    return req.query.verify ? verifyOps.verify(req, webble).then(function (trustResults) {
                        res.json(normalizeWebble(webble, true, trustResults[0], files));
                    }) : res.json(normalizeWebble(webble, false, false, files));
                });
            }
            else if (req.query.verify) {

                return verifyOps.verify(req, webble).then(function (trustResults) {
                    res.json(normalizeWebble(webble, true, trustResults[0]));
                });
			}
			else
			    return res.json(normalizeWebble(webble));

        }).catch(err => util.resSendError(res, err));
    });

	//******************************************************************

	app.get('/api/webbles/:id/image', auth.non, function(req, res) {

        return Webble.findOne({ "webble.defid": req.params.id }).lean().exec().then(function(webble) {

            if (!webble)
                throw new util.RestError(gettext("Webble does not exist"));

            res.send('<img src="' + (webble.webble.image || 'images/notFound.png') + '"/>');

        }).catch(err => util.resSendError(res, err));

    });

	////////////////////////////////////////////////////////////////////
	// Modifying and creating webbles
	//
	var publishingOps = require('../lib/ops/publishing')(app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id', auth.usr, function(req, res) {

		if (!req.body.webble)
			res.status(500).send(gettext("Webble definition not sent correctly"));
		else {

            return publishingOps.publish(req, Webble.findOne({ "webble.defid": req.params.id }), () => new Webble(), function (webble) {

                if (webble.webble.templateid == webble.webble.defid)
                    throw new util.RestError(gettext("Update the template directly"), 403);

                webble.webble.defid = req.params.id; // just in case...
                webble.mergeWithObject(req.body.webble);

                if (!webble.webble.author)
                    webble.webble.author = req.user.username || req.user.name.full;

                return webble; // We should return the object to continue publication

            }).then(webble => res.json(normalizeWebble(webble)))
                .catch(err => util.resSendError(res, err, gettext("could not modify webble")));
		}
    });

	//******************************************************************

	app.delete('/api/webbles/:id', auth.usr, function(req, res) {

        return publishingOps.unpublish(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(() => res.status(200).send(gettext("Successfully deleted")))
            .catch(err => util.resSendError(res, err, gettext("Cannot delete this webble")));
	});

	////////////////////////////////////////////////////////////////////
	// Sharing webbles
	//
	var sharingOps = require('../lib/ops/sharing')(app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id/share', auth.usr, function(req, res) {

        return sharingOps.updateContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(users => res.json(users))
            .catch(err => util.resSendError(res, err));
	});

	app.get('/api/webbles/:id/share', auth.usr, function(req, res) {

        return sharingOps.getContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(users => res.json(users))
            .catch(err => util.resSendError(res, err));
	});

	app.delete('/api/webbles/:id/share', auth.usr, function(req, res) {

        return sharingOps.clearContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(() => res.status(200).send(gettext("Successfully deleted")))
            .catch(err => util.resSendError(res, err));
	});

	////////////////////////////////////////////////////////////////////
	// Rating webbles
	//
	var ratingOps = require('../lib/ops/rating')(app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id/rating', auth.usr, function(req, res) {

        return ratingOps.updateRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(() => res.status(200).send(gettext("Successfully rated")))
            .catch(err => util.resSendError(res, err));
	});

	app.get('/api/webbles/:id/rating', auth.non, function(req, res) {

        return ratingOps.getRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(ratings => res.json(ratings))
            .catch(err => util.resSendError(res, err));
	});

	app.delete('/api/webbles/:id/rating', auth.usr, function(req, res) {

        return ratingOps.clearRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
            .then(() => res.status(200).send(gettext("Successfully cleared")))
            .catch(err => util.resSendError(res, err));
	});

	////////////////////////////////////////////////////////////////////
	// Verifying webbles
	//
	app.get('/api/webbles/:id/verify', auth.usr, function(req, res) {

        return verifyOps.verify(req, Webble.findOne({ "webble.defid": req.params.id }, '-webble'))
            .then(trustResults => res.json(trustResults[0]))
            .catch(err => util.resSendError(res, err));
	});

	//******************************************************************

  app.put('/api/verify/webbles', auth.usr, function(req, res) {

      return verifyOps.verify(req, Webble.find({ "webble.defid": { $in: req.body.webbles || [] } }, '-webble'))
          .then(trustResults => res.json(trustResults))
          .catch(err => util.resSendError(res, err));
  });

  //******************************************************************

};
