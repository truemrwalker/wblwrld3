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
// crypt.js
// Created by Giannis Georgalis on 1/20/14
//
var Promise = require("bluebird");
var crypto = require('crypto');

Promise.promisifyAll(crypto);

////////////////////////////////////////////////////////////////////////
// Common utility functions
//
module.exports.createHash = function(text) {
	return crypto.createHash('md5').update(text).digest('hex')
};

//**********************************************************************
// TODO: Make them asynchronous
//
module.exports.encryptText = function (text, seed) {
	var cipher = crypto.createCipher('aes-128-cbc', seed);
	var crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
};

module.exports.decryptText = function (cryptText, seed) {
	try {
		var decipher = crypto.createDecipher('aes-128-cbc', seed);
		var dec = decipher.update(cryptText, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return dec;
	} catch(err) {
		return cryptText;
	}
};

//**********************************************************************

module.exports.randomBytes = function(nBytes) {
	return crypto.randomBytesAsync(nBytes);
};
