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
// templates.js
// Created by Giannis Georgalis on 12/12/13
//
var Promise = require("bluebird");

var path = require('path');
var fs = require('fs');
var util = require('../../lib/util');

module.exports = function(app, config, mongoose, gettext, auth) {

	var Webble = mongoose.model('Webble');

	var webbleDir = path.join(config.APP_ROOT_DIR, 'webbles');

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
	function normalizeTemplate(w) {

		return {
			name: w.webble.displayname,
			description: w.webble.description,
			keywords: w.webble.keywords,
			author: w.webble.author,
			id: w.webble.templateid,
			ver: w.webble.templaterevision,
			created: w._created,
			modified: w._updated
		};
	}

    ////////////////////////////////////////////////////////////////////
    // Routes for Templates
    //
	var fsOps = require('../../lib/ops/fsing')(app, config, mongoose, gettext, auth);

	app.get('/api/dev/templates', auth.dev, function (req, res) {

	    var query = util.buildQuery(req.query, ['q', 'qid'], 'webble');

		if (req.query.qid)
			query.conditions["webble.defid"] = new RegExp(req.query.qid, 'i');
	    else if (req.query.q) {

		    var q = new RegExp(req.query.q, 'i');

		    query.conditions["$or"] = [
			    { "webble.templateid" : q },
			    { "webble.displayname" : q },
			    { "webble.description" : q },
			    { "webble.keywords" : q },
			    { "webble.author" : q }
		    ];
	    }
	    query.conditions["$where"] = 'this.webble.defid === this.webble.templateid';

	    Webble.find(query.conditions,
		    '_created _updated webble.templateid webble.templaterevision webble.displayname webble.description webble.keywords webble.author',
            query.options).lean().exec().then(function (results) {

                res.json(util.transform_(results, normalizeTemplate));
            }).catch(err => util.resSendError(res, err));
    });

    app.get('/api/dev/templates/:id', auth.dev, function(req, res) {

        Webble.findOne({ "webble.defid": req.params.id }).exec().then(function (w) {

            if (!w)
                throw new util.RestError(gettext("Template does not exist"), 404);

            res.json(normalizeTemplate(w));

        }).catch(err => util.resSendError(res, err));
    });
};
