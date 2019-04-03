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
 * @overview Defines the mongoose schema of the Group component.
 *
 * Groups are hierarchical and can belong to more general, parent groups (_sec.groups). They are
 * used for publishing webbles, calculating their trust value and for storing secrets (e.g. API keys).
 * See also: http://mongoosejs.com/docs/guide.html
 *
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

    // Define the Group schema it may be Hokudai, Fraunhofer, etc:
    //
    var GroupSchema = new mongoose.Schema({

        name: { type: String, required: true, trim: true, index: { unique: true } },
        description: String,
        address: String,
        email: String,
	    website: String,

	    pub_policy: { type: String, enum: ['open', 'moderate_new', 'moderate_updates', 'closed'], default: 'open' },

	    _sec: {

		    cert: String,

		    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
		    trusts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
	    },
	    _auth: {

			keys: [{
				realm: { type: String, trim: true, required: true },
				resource: { type: String, trim: true, required: true },
				access_key: { type: String, required: true }
			}]
	    },
		_owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	    _contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    });

	// Options
	//
	GroupSchema.options.toJSON = {};
	GroupSchema.options.toJSON.transform = function(doc, ret, options) {

		if ('function' == typeof doc.ownerDocument) { // working with a sub doc

			ret.id = doc._id;

			delete ret._id;
			delete ret.access_key;
		}
		else {

			// Add stuff
			//
			ret.id = doc._id;

			if (doc._sec.groups && doc._auth.keys) { // Otherwise include only the metadata

				ret.parent_id = doc._sec.groups[0]; // For now only single parent group supported
				ret.auth_keys = ret._auth.keys; // ret._auth.keys not doc._auth.keys to use the transformed version
			}

			// Delete stuff
			//
			delete ret._id;
			delete ret.__v;

			delete ret._sec;
			delete ret._owner;
			delete ret._contributors;
		}
	};

	// Methods
	//
	GroupSchema.methods.mergeWithObject = function (obj) {

		var self = this;

		Object.keys(obj).forEach(function(k) {

			if (k[0] != '_')
				self[k] = obj[k];
		});
	};

	GroupSchema.methods.isUserOwner = function (user) {
		return this._owner.equals(user._id);
	};

	GroupSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;

		for (var i = 0; i < this._contributors.length; ++i) {
			if (this._contributors[i].equals(user._id))
				return true;
		}
		return false;
	};

	GroupSchema.methods.isUserAuthorizedForOperation = function (user, op) {
		return true;
	};

	// Other generic "inherited" methods
	//
	GroupSchema.methods.repr = function () {
		return this.name;
	};

	// Compile and return the model:
    //
    return mongoose.model('Group', GroupSchema);
};
