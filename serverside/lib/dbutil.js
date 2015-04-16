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

////////////////////////////////////////////////////////////////////////
// Private convenience functions
//
function gettext(msg) { return msg; }

function copyArgs(args) {

	var result = [];
	for (var i = 0; i < args.length; i++)
		result.push(args[i]);
	return result;
}

function extendArray(array, other) {

	if (Array.isArray(other)) {

		for (var i = 0; i < other.length; ++i)
			array.push(other[i]);
	}
	else
		array.push(other);

	return array;
}

function applyOp(self, op, arg) {

	for (var i = 0; i < self.queries.length; ++i)
		self.queries[i] = self.queries[i][op](arg);
	return self;
}

////////////////////////////////////////////////////////////////////////
// Public methods
//
module.exports.qOR = function (/*variable args...*/) {

	// Exec'able object
	//
	return {
		queries: copyArgs(arguments),
		currIndex: 0,

		exec: function (callback) {

			var self = this;

			if (this.currIndex >= this.queries.length)
				callback(null, null);
			else {
				var q = this.queries[this.currIndex++];

				q.exec(function (err, results) {

					if (err)
						callback(err);
					else if (results)
						callback(null, results);
					else
						self.exec(callback);
				});
			}
		}
	};

};

//**********************************************************************

module.exports.qAG = function (/*variable args...*/) {

	// Exec'able object
	//
	return {
		queries: copyArgs(arguments),
		currIndex: 0,
		results: [],

		and: function(arg) { return applyOp(this, 'and', arg); },
		or: function(arg) { return applyOp(this, 'or', arg); },
		where: function(arg) { return applyOp(this, 'where', arg); },
		equals: function(arg) { return applyOp(this, 'equals', arg); },

		exec: function (callback) {

			var self = this;

			if (this.currIndex >= this.queries.length)
				callback(null, this.results);
			else {
				var q = this.queries[this.currIndex++];

				q.exec(function (err, results) {

					if (err)
						callback(err);
					else {

						if (results)
							extendArray(self.results, results);
						self.exec(callback);
					}
				});
			}
		}
	};

};

