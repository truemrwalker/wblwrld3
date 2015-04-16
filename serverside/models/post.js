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
// post.js
// Created by Giannis Georgalis on 12/11/13
//
module.exports = function(Q, app, config, mongoose, gettext) {

	var CommentSchema = new mongoose.Schema({

		body: String,
		author: String,
		date: { type: Date, required: true, default: Date.now },

		_owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
	});

	var PostSchema = new mongoose.Schema({

		post: {

		    title: String,
			keywords: String,

		    body: String,
		    author: String,
			date: { type: Date, required: true, default: Date.now },

		    comments: [CommentSchema]
		},

		_type: { type: String, enum: ['post', 'rating', 'qa' ], required: true, default: 'post' },

		_target: {

			rating: { type: Number, min: 0, max: 10, default: 0 },
			webble: { type: mongoose.Schema.Types.ObjectId, ref: 'Webble' }
		},

		_sec: {

			cert: String,

			groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]/*,
			trusts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]*/
		},
		_owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	    _contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    });

	// Options
	//
	PostSchema.options.toJSON = {};
	PostSchema.options.toJSON.transform = function(doc, ret, options) {

		delete ret._id;
		delete ret.__v;

		delete ret._target;

		delete ret._sec;
		delete ret._owner;
		delete ret._contributors;
	};

	// Methods
	//
	PostSchema.methods.mergeWithObject = function (obj) {

		var self = this;

		Object.keys(obj).forEach(function(k) {

			if (k != 'comments')
				self.post[k] = obj[k];
		});
	};

	PostSchema.methods.isUserOwner = function (user) {
		return this._owner.equals(user._id);
	};

	PostSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;

		for (var i = 0; i < this._contributors.length; ++i) {
			if (this._contributors[i].equals(user._id))
				return true;
		}
		return false;
	};

	PostSchema.methods.isUserAuthorizedForOperation = function (user, op) {
		return true;
	};

	// Other generic "inherited" methods
	//
	PostSchema.methods.repr = function () {
		return this.post.title;
	};

	// Compile and return the model:
    //
    return mongoose.model('Post', PostSchema);
};
