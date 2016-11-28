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
 * @overview Gravatar utility functions.
 * @module lib/gravatar
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var crypto = require('crypto');
var querystring = require('querystring');

/**
 * Returns a gravatar-hosted image URL for the given user's email address.
 * @param {string} email - The user's email address.
 * @param {string} options - gravatar-specific options (see gravatar documentation).
 * @param {boolean} https - Whether to generate an https link (instead of an http one).
 * @returns {string} A URL that points to the image that is associated with the specific user's email.
 */
module.exports.url = function (email, options, https) {

	var baseURL = (https && "https://secure.gravatar.com/avatar/") || 'http://www.gravatar.com/avatar/';
	var queryData = querystring.stringify(options);
	var query = (queryData && "?" + queryData) || "";

	return baseURL + crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex') + query;
};
