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
// dbutil.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function gettext(msg) { return msg; }

function extendArray(array, other) {

	if (Array.isArray(other)) {

		for (var i = 0; i < other.length; ++i)
			array.push(other[i]);
	}
	else if (other)
		array.push(other);

	return array;
}

function genQueries(args) {

    var result = [];
    for (var i = 0; i < args.length; ++i)
        result.push({ query: args[i] });
    return result;
}
function applyOp(self, op, arg) {
    
    self.queries.forEach(function (q) { q.query = q.query[op](arg); });
    return self;
}

function promiseFirst(input, callback) {
    
    return new Promise(function (resolve, reject) {

        var index = 0;
        var next = function () {

            if (index >= input.length)
                resolve(null);
            else {
                
                Promise.resolve(callback(input[index++])).then(function (result) {

                    if (result)
                        resolve(result);
                    else
                        next();
                }, reject);                
            }
        };
        next();
    });
}

////////////////////////////////////////////////////////////////////////
// Public methods
//
module.exports.connect2 = function (mongoose, mongodbURL) {
	
	console.time("connect");

	return Promise.fromCallback(function (callback) {
		mongoose.connect(mongodbURL, callback);
	}).tap(function () {
		console.timeEnd("connect");
	});
};

module.exports.connect = function (mongoose, mongodbURL) {
	
	console.time("connect");

	// See here: https://gist.github.com/mongolab-org/9959376
	// and here: http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options
	// and here: http://mongodb.github.io/node-mongodb-native/api-generated/replset.html
	//
	const options = {
		db: {
			native_parser: true,
			retryMiliSeconds: 5000,
			numberOfRetries: 5
		},
		server: {
			auto_reconnect: true,
			socketOptions: {
				keepAlive: 120, // 1,
				connectTimeoutMS: 5000 // 30000,
			},
		},
		replset: {
			socketOptions: {
				keepAlive: 120, // 1,
				connectTimeoutMS: 5000 // 30000,
			},
		},
		promiseLibrary: Promise // see: http://mongoosejs.com/docs/promises.html
	};
	mongoose.Promise = Promise; // see: http://mongoosejs.com/docs/promises.html
	//mongoose.set('debug', true);
	
	return Promise.fromCallback(function (callback) {
		mongoose.connect(mongodbURL, options, callback);
	}).tap(function () {
		console.timeEnd("connect");
	});
};

//**********************************************************************

module.exports.execOrValue = function (value) {
    return ('exec' in value) ? value.exec() : Promise.resolve(value);
};

module.exports.qOR = function (/*variable args...*/) {

	// Exec'able object
	//
	return {
        queries: genQueries(arguments),

		exec: function () {
            
            return promiseFirst(this.queries, function (q) {
                return q.query.exec();
            });
		}
	};

};

//**********************************************************************

module.exports.qAG = function (/*variable args...*/) {

	// Exec'able object
	//
	return {
		queries: genQueries(arguments),

		and: function(arg) { return applyOp(this, 'and', arg); },
		or: function(arg) { return applyOp(this, 'or', arg); },
		where: function(arg) { return applyOp(this, 'where', arg); },
		equals: function(arg) { return applyOp(this, 'equals', arg); },

		exec: function () {
            
            return Promise.reduce(this.queries, function (results, q) {
                return q.query.exec().then(function (result) {
                    return extendArray(results, result);
                });
            }, []);
        }
	};

};

