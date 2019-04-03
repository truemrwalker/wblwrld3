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
 * @overview General utility/convenience functions.
 * @module lib/util
 * @author Giannis Georgalis
 */

var util = require('util');

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function gettext(msg) { return msg; }

////////////////////////////////////////////////////////////////////////
// Array ops

/**
 * @deprecated Use Array.map in new code
 * Returns an array in which every element is the result of the application of func into input[i].
 * Note that the input is modified in-place. An old reference to input will point to the new result.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {*[]} A modified array where each result[i] is equal to func(input[i]).
 */
module.exports.transform_ = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i)
		input[i] = func(input[i]);
	return input;
};

/**
 * @deprecated Use Array.map in new code
 * Returns a new array in which every element is the result of the application of func into input[i].
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {*[]} A new array where each result[i] is equal to func(input[i]).
 */
module.exports.transform = function (input, func) {

	var result = [];
	var len = input.length;
	for (var i = 0; i < len; ++i)
		result.push(func(input[i]));
	return result;
};

/**
 * Returns a new array in which every element is the result of the application of func into input[i].
 * Also, any additional arguments passed to apply are also appended in every func() invocation.
 * For example apply([1, 2, 3], (a, b) => a + b, 2), returns [3, 4, 5].
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @param {*} arguments - The extra arguments used when invoking "func".
 * @returns {*[]} A new array where each result[i] is equal to func(input[i]).
 */
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

/**
 * Determines whether any application of "func" over "input" is true.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {boolean} True if any "func" application onto input[i] is true, otherwise false.
 */
module.exports.any = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (func(input[i]))
			return true;
	}
	return false;
};

/**
 * Determines whether any application of "func" over "input" is true. The difference with
 * function "any" is that "func" is optional.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {boolean} True if any "func" application onto input[i] is true, otherwise false.
 */
module.exports.anyTrue = function (input, func) {

    func = func || function (v) { return v; };

    var len = input.length;
    for (var i = 0; i < len; ++i) {
        if (func(input[i]))
            return true;
    }
    return false;
};

/**
 * Determines whether all applications of "func" over "input" return true.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {boolean} True if all "func" applications onto input[i] are true, otherwise false.
 */
module.exports.all = function (input, func) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (!func(input[i]))
			return false;
	}
	return true;
};

/**
 * Determines whether all applications of "func" over "input" return true. The difference with
 * function "all" is that "func" is optional.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {boolean} True if all "func" applications onto input[i] are true, otherwise false.
 */
module.exports.allTrue = function (input, func) {

    func = func || function (v) { return v; };

    var len = input.length;
    for (var i = 0; i < len; ++i) {
        if (!func(input[i]))
            return false;
    }
    return true;
};

/**
 * Returns a new array in which every element is the result of the application of func into input[i],
 * but only the unique results are considered. Redundant results are omitted from the result.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {*[]} A new array where each result[i] is equal to func(input[i]) and unique.
 */
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

/**
 * Returns a new array in which every element is input[i], iff func(input[i]) is true, otherwise
 * that specific element "i" is omitted.
 * @param {*[]} input - The input array onto which func is applied.
 * @param {*} func - The function to apply onto each element of input.
 * @returns {*[]} A new array where each result[i] is equal to input[i] if func(input[i]) is true.
 */
module.exports.filter = function (input, func) {

	var result = [];
	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (func(input[i]))
			result.push(input[i]);
	}
	return result;
};

/**
 * Returns the first index of "input" where the application of "pred" is true or -1.
 * @param {*[]} input - The input array onto which pred is applied.
 * @param {*} pred - The function to apply onto each element of input.
 * @returns {number} The first index of "input", i, where pred(input[i]) == true or -1.
 */
module.exports.indexOf = function (input, pred) {

	var len = input.length;
	for (var i = 0; i < len; ++i) {
		if (pred(input[i]))
			return i;
	}
	return -1;
};

/**
 * Returns the last index of "input" where the application of "pred" is true or -1.
 * @param {*[]} input - The input array onto which pred is applied.
 * @param {*} pred - The function to apply onto each element of input.
 * @returns {number} The last index of "input", i, where pred(input[i]) == true or -1.
 */
module.exports.lastIndexOf = function (input, pred) {
	
	var len = input.length;
	while (--len >= 0) {
		if (pred(input[len]))
			return len;
	}
	return -1;
};

/**
 * Replaces or appends the "value" into the "input" array, depending on whether "pred" returns
 * true for any pred(input[i], value).
 * @param {*[]} input - The input array onto which pred is applied and "value" should be added.
 * @param {*} value - The value to append or replace in "input".
 * @param {*} pred - The function to apply with value and each element of input.
 * @returns {*} The previous input[i] that "value" replaced or null if it didn't replace anything.
 */
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

////////////////////////////////////////////////////////////////////////
// Common utility functions

/**
 * Determines whether the given "email" parameter represents a valid email address.
 * @param {string} email - A potential email address.
 * @returns {boolean} True if "email" looks like a valid email address, false otherwise.
 */
module.exports.isEmailValid = function (email) {

	//var regExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	// Based on jQuery plugin: Validation https://github.com/jzaefferer/jquery-validation/blob/master/jquery.validate.js
	var regExp = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
	return regExp.test(email);
};

/**
 * Determines whether the given "username" parameter represents a valid username.
 * @param {string} username - A potential username.
 * @returns {boolean} True if "username" looks like a valid username, false otherwise.
 */
module.exports.isUsernameValid = function (username) {

    if (username === 'j') // Special case only for Jonas :)
        return true;

	var regExp = /^[a-z0-9_-]{3,16}$/;
	return regExp.test(username);
};

/**
 * Determines whether the given "url" parameter represents a valid URL.
 * @param {string} url - A potential URL.
 * @returns {boolean} True if "url" looks like a valid URL, false otherwise.
 */
module.exports.isUrlValid = function (url) {

	// based on jQuery plugin: Validation https://github.com/jzaefferer/jquery-validation/blob/master/jquery.validate.js
	var regExp = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
	return regExp.test(url);
};

/**
 * Determines whether the given "str" parameter represents a valid unsigned integer.
 * @param {string} str - A string representing an unsigned integer.
 * @returns {boolean} True if "str" looks like a valid unsigned integer.
 */
module.exports.isStringNumber = function (str) {
    
    for (var i = 0; i < str.length; ++i)
        if (str[i] < '0' || str[i] > '9')
            return false;
    return str.length !== 0;
};

////////////////////////////////////////////////////////////////////////
// Other utility functions

/**
 * If an object has a toJSON() method it first calls it and then removes any properties
 * that begin with underscore (_).
 * @todo Probably this function should be moved to a more JSON-specific library file.
 * @param {Object} obj - A Javascript object.
 * @returns {Object} A new object that has all the "obj" properties, except those that
 *     that start with an underscore (_).
 */
module.exports.stripObject = function (obj) {

    if ('toJSON' in obj) {

        var result = obj.toJSON();
        Object.getOwnPropertyNames(result).forEach(function (propname) {
            if (propname[0] === '_')
                delete result[propname];
        });
        return result;
    }
    else {

        var result = {};
        Object.getOwnPropertyNames(obj).forEach(function (propname) {
            if (propname[0] !== '_')
                result[propname] = obj[propname];
        });
        return result;
    }
};

/**
 * Builds an object representing a valid mongoose (mongodb) find() query from an express.js
 * req.query object. For example the following invocation:
 *     var query = util.buildQuery(req.query, [], 'workspace'), with req.query = {name: "foo"}
 * Returns a mongodb query object similar to: {"workspace.name" : "foo"}
 * @todo Probably this function should be moved to a more mongodb-specific library file.
 * @param {Object} query - An express.js req.query object that contains the query parameters.
 * @param {string[]} ignoreList - A list of properties to not try to match against db documents. 
 * @param {string} namespace - The namespace (optionally) in which the given query params reside.
 * @param {Object} aliasesObj - An optional map of property aliases.
 * @returns {Object} A valid mongodb query that matches the given req.query property values.
 */
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
// REST utility classes and functions

function RestError(message, statusCode) {
	this.name = "RestError";
	this.message = message || gettext("Unidentified error");
	this.statusCode = statusCode !== undefined ? statusCode : 500;
}
RestError.prototype = new Error();
RestError.prototype.constructor = RestError;

/**
 * Represents a REST invocation error.
 * @todo Probably this function should be moved to a more REST-specific library file.
 * @constructor
 * @param {string} message - A message describing the error.
 * @param {number} statusCode - The HTTP error code.
 */
module.exports.RestError = RestError;

/**
 * If the given error is NOT a RestError, a new RestError is returned with the given (optional)
 * message and the HTTP error-code 500.
 * @todo Probably this function should be moved to a more REST-specific library file.
 * @param {Object} error - An instance of an Error.
 * @param {string} message - An optional message describing the error.
 */
module.exports.toRestError = function (error, message) {
	return error instanceof RestError ? error : new RestError(message, 500);
};

/**
 * Sends the given error over the "res" express.js stream after an unsuccessful REST invocation.
 * @todo Probably this function should be moved to a more REST-specific library file.
 * @param {Object} res - An express.js "res" stream.
 * @param {Object} error - An instance of an Error.
 * @param {string} message - An optional message describing the error.
 */
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
