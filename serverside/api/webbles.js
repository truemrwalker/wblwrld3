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
// webbles.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

////////////////////////////////////////////////////////////////////////
// At startup, load all webble descriptions from disk
//
var path = require('path');

var util = require('../lib/util');

module.exports = function(Q, app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');
	var User = mongoose.model('User');
	var Post = mongoose.model('Post');

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    function normalizeWebble(w, isVerified, isTrusted) {
        return w.getNormalizedObject(null, isVerified, isTrusted);
	}

	////////////////////////////////////////////////////////////////////
    // Routes for Webbles
    //
	var verifyOps = require('../lib/ops/verifying')(Q, app, config, mongoose, gettext, auth);

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

	    if (req.query.count) {

		    Webble.count(query.conditions, function (err, count) {
			    res.json(err ? 0 : count);
		    });
	    }
	    else {
		    console.log("Query with conditions:", query.conditions, "...and options:", query.options);

		    Webble.find(query.conditions,
			    '-webble.protectflags -webble.modelsharees -webble.slotdata -webble.children -webble.private',
			    query.options,
				function(err, results) {

					if (err)
						res.status(500).send(gettext("Could not retrieve webbles"));
				    else if (!results)
						res.status(500).send(gettext("There are not any webbles"));
					else if (req.query.verify && req.query.verify === '1' && req.user) {

						verifyOps.verify(req, results)
							.then(function(verResults) {

								if (results.length != verResults.length)
									res.json(util.transform_(results, normalizeWebble));
								else {

									for (var i = 0; i < results.length; ++i)
										results[i] = normalizeWebble(results[i], true, verResults[i]);

									res.json(results);
								}
							})
							.catch(function(err) {

								console.error("ERR:::----:::", err, "STACK:", err.stack);
								res.status(500).send(gettext("Could not retrieve webbles"));
							})
							.done();
					}
					else
						res.json(util.transform_(results, normalizeWebble));
				});
	    }
    });

	app.get('/api/mywebbles', auth.usr, function (req, res) {

		Webble.find({$or: [{ _owner: req.user._id }, { _owner: null }, { _contributors: req.user._id }]},
			'-webble.protectflags -webble.modelsharees -webble.slotdata -webble.children -webble.private').exec().then(function (webbles) {
            
            if (!webbles)
                throw new util.RestError(gettext("Cannot retrieve webbles"));
            
            res.json(util.transform_(webbles, normalizeWebble));

        }).catch(function (err) {
            util.resSendError(res, err);
        }).done();

	});

	//******************************************************************

    app.get('/api/webbles/:id', auth.non, function(req, res) {

	    Webble.findOne({ "webble.defid": req.params.id }, function (err, webble) {

		    if (err)
			    res.status(500).send(gettext("Could not retrieve webbles"));
			else if (!webble)
			    res.status(500).send(gettext("Webble does not exist"));
		    else {

			    // Allow webbles to be loaded from different domains:
			    res.header("Access-Control-Allow-Origin", "*");
			    res.header("Access-Control-Allow-Headers", "X-Requested-With");

		        if (req.query.verify) {

			        verifyOps.verify(req, webble)
				        .then(function(results) {
					        res.json(normalizeWebble(webble, true, results[0]));
				        })
				        .catch(function(err) {
					        res.status(500).send(gettext("Could not retrieve webbles"));
				        })
				        .done();
			    }
				else
			        res.json(normalizeWebble(webble));
		    }
	    });
    });

	//******************************************************************

	app.get('/api/webbles/:id/image', auth.non, function(req, res) {

		Webble.findOne({ "webble.defid": req.params.id }, function (err, webble) {

			if (err)
				res.status(500).send(gettext("Could not retrieve webbles"));
			else if (!webble)
				res.status(500).send(gettext("Webble does not exist"));
			else
				res.send('<img src="' + (webble.webble.image || 'images/notFound.png') + '"/>');
		});
	});

	////////////////////////////////////////////////////////////////////
	// Modifying and creating webbles
	//
	var publishingOps = require('../lib/ops/publishing')(Q, app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id', auth.usr, function(req, res) {

		if (!req.body.webble)
			res.status(500).send(gettext("Webble definition not sent correctly"));
		else {

			publishingOps.publish(req, Webble.findOne({ "webble.defid": req.params.id }), function() {

				return new Webble();

			}, function(webble) {

				if (webble.webble.templateid == webble.webble.defid)
					throw new util.RestError(gettext("Update the template directly"), 403);

				webble.webble.defid = req.params.id; // just in case...
				webble.mergeWithObject(req.body.webble);

				if (!webble.webble.author)
					webble.webble.author = req.user.username || req.user.name.full;

				return webble;
			})
				.then(function(webble) {
					res.json(normalizeWebble(webble)); // Everything OK
				})
				.catch(function (err) {
					util.resSendError(res, err, gettext("could not modify webble"));
				})
				.done();
		}
    });

	//******************************************************************

	app.delete('/api/webbles/:id', auth.usr, function(req, res) {

		publishingOps.unpublish(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function() {
				res.status(200).send(gettext("Successfully deleted"));
			})
			.catch(function (err) {
				util.resSendError(res, err, gettext("Cannot delete this webble"));
			})
			.done();
	});

	////////////////////////////////////////////////////////////////////
	// Sharing webbles
	//
	var sharingOps = require('../lib/ops/sharing')(Q, app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id/share', auth.usr, function(req, res) {

		sharingOps.updateContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function(users) {
				res.json(users);
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/webbles/:id/share', auth.usr, function(req, res) {

		sharingOps.getContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function(users) {
				res.json(users);
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/webbles/:id/share', auth.usr, function(req, res) {

		sharingOps.clearContributors(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function() {
				res.status(200).send(gettext("Successfully deleted")); // Everything OK
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	////////////////////////////////////////////////////////////////////
	// Rating webbles
	//
	var ratingOps = require('../lib/ops/rating')(Q, app, config, mongoose, gettext, auth);

	app.put('/api/webbles/:id/rating', auth.usr, function(req, res) {

		ratingOps.updateRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function() {
				res.status(200).send(gettext("Successfully rated"));
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.get('/api/webbles/:id/rating', auth.non, function(req, res) {

		ratingOps.getRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function(ratings) {
				res.json(ratings);
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	app.delete('/api/webbles/:id/rating', auth.usr, function(req, res) {

		ratingOps.clearRatings(req, Webble.findOne({ "webble.defid": req.params.id }))
			.then(function() {
				res.status(200).send(gettext("Successfully cleared")); // Everything OK
			})
			.catch(function (err) {
				util.resSendError(res, err);
			})
			.done();
	});

	////////////////////////////////////////////////////////////////////
	// Verifying webbles
	//
	app.get('/api/webbles/:id/verify', auth.usr, function(req, res) {

		 verifyOps.verify(req, Webble.findOne({ "webble.defid": req.params.id }, '-webble'))
       .then(function(results) {
				 res.json(results[0]);
			 })
			 .catch(function (err) {
				 util.resSendError(res, err);
			 })
			 .done();
	});

	//******************************************************************

  app.put('/api/verify/webbles', auth.usr, function(req, res) {

    verifyOps.verify(req, Webble.find({ "webble.defid": { $in: req.body.webbles || [] } }, '-webble'))
      .then(function(results) {
        res.json(results);
      })
      .catch(function (err) {
        util.resSendError(res, err);
      })
      .done();
  });

  //******************************************************************

};
