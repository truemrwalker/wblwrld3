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
// util.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var util = require('util');

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function gettext(msg) { return msg; }

////////////////////////////////////////////////////////////////////////
// Array ops
//
module.exports.transform_ = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i)
		input[i] = func(input[i]);
	return input;
};

module.exports.transform = function (input, func) {

	var result = [];
	var len = input.length;
	for (var i = 0; i < len; ++i)
		result.push(func(input[i]));
	return result;
};

module.exports.apply = function (input, func) {

	var result = [];
	var args = [];

	// var args = arguments.splice(2); // Remember arguments is not an Array!?!?!?
	for (var j = 2; j < arguments.length; ++j)
		args.push(arguments[j]);
	args.push(0); // Item placeholder

	var len = input.length;
	for (var i = 0; i < len; ++i) {

		args[args.length - 1] = input[i];
		result.push(func.apply(null, args));
	}
	return result;
};

module.exports.any = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (func(input[i]))
			return true;
	}
	return false;
};

module.exports.all = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (!func(input[i]))
			return false;
	}
	return true;
};

module.exports.unique = function (input, func) {

	var result = [];
	var hash = {};

	var len = input.length;
	for (var i = 0; i < len; ++i) {

		var val = func(input[i]);
		if (!hash.hasOwnProperty(val)) {

			result.push(input[i]);
			hash[val] = true;
		}
	}
	return result;
};

module.exports.filter = function (input, func) {

	var result = [];
	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (func(input[i]))
			result.push(input[i]);
	}
	return result;
};

module.exports.indexOf = function (input, pred) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (pred(input[i]))
			return i;
	}
	return -1;
};

module.exports.lastIndexOf = function (input, pred) {
	
	var len = input.length;
	while (--len >= 0) {
		if (pred(input[len]))
			return len;
	}
	return -1;
};

module.exports.addOrReplace = function (input, value, pred) {

    var len = input.length;
    for (var i = 0; i < len; ++i) {
        if (pred(input[i], value)) {

            var prev = input[i];
            input[i] = value;
            return prev;
        }
    }
    input.push(value);
    return null;
};

//**********************************************************************
// More specialized array ops
//
module.exports.anyTrue = function (input, func) {
    
    func = func || function (v) { return v; };

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (func(input[i]))
			return true;
	}
	return false;
};

module.exports.allTrue = function (input, func) {
    
    func = func || function (v) { return v; };

    var len = input.length;
    for (var i = 0; i < len; ++i) {
        if (!func(input[i]))
            return false;
    }
    return true;
};

////////////////////////////////////////////////////////////////////////
// Common utility functions
//
module.exports.isEmailValid = function (email) {

	//var regExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	// Based on jQuery plugin: Validation https://github.com/jzaefferer/jquery-validation/blob/master/jquery.validate.js
	var regExp = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
	return regExp.test(email);
};

module.exports.isUsernameValid = function (username) {

	var regExp = /^[a-z0-9_-]{3,16}$/;
	return regExp.test(username);
};

module.exports.isUrlValid = function (url) {

	// based on jQuery plugin: Validation https://github.com/jzaefferer/jquery-validation/blob/master/jquery.validate.js
	var regExp = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
	return regExp.test(url);
};

module.exports.isStringNumber = function (str) {
    
    for (var i = 0; i < str.length; ++i)
        if (str[i] < '0' || str[i] > '9')
            return false;
    return str.length !== 0;
};

////////////////////////////////////////////////////////////////////////
// Rest-specific utility functions
//
module.exports.buildQuery = function (query, ignoreList, namespace, aliasesObj) {

	var start = (query.start && 1 * query.start) || 0;
	var limit = (query.limit && 1 * query.limit) || 500;

	// For extracting the target fields
	//
	var prefix = namespace ? namespace + '.' : '';
	var aliases = aliasesObj || {};

	function getField(fieldName) {
		return fieldName in aliases ? aliases[fieldName] : prefix + fieldName;
	}

	var options = { skip: start * limit, limit: limit };

	if (query.orderby) {

		options.sort = {};

		if (!(query.orderby instanceof Array))
			query.orderby = [ query.orderby ];

		query.orderby.forEach(function (fieldSpec) {

			if (fieldSpec[0] == '-')
				options.sort[getField(fieldSpec.substring(1))] = -1;
			else if (fieldSpec[0] == '+')
				options.sort[getField(fieldSpec.substring(1))] = 1;
			else
				options.sort[getField(fieldSpec)] = 1;
		});
	}

	var ignoreFields = ignoreList || [];
	ignoreFields.push('start', 'limit', 'orderby'); // also: Array.prototype.push.apply(a,b)

	var conditions = {};

	Object.keys(query).forEach(function (key) {

		if (ignoreFields.indexOf(key) === -1)
			//conditions[key] = new RegExp('^' + query[key] + '$', 'i');
			conditions[getField(key)] = new RegExp(query[key], 'i');
	});

	return { options: options, conditions: conditions };
};

////////////////////////////////////////////////////////////////////////
// Common utility classes
//
function RestError(message, statusCode) {
	this.name = "RestError";
	this.message = message || gettext("Unidentified error");
	this.statusCode = statusCode !== undefined ? statusCode : 500;
}
RestError.prototype = new Error();
RestError.prototype.constructor = RestError;

module.exports.RestError = RestError;

module.exports.toRestError = function (error, message) {
	return error instanceof RestError ? error : new RestError(message, 500);
};

module.exports.resSendError = function (res, error, message) {

//	console.log("ERRR: ", error);
//	console.log(error.stack);

	if (!(error instanceof RestError)) {

		console.error("UNXPCTD ERR: ", error);
		console.error(error.stack);

		error = new RestError(message);
	}
	res.status(error.statusCode).send(error.message);
};
