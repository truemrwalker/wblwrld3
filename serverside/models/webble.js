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
 * @overview Defines the mongoose schema of the Webble component.
 *
 * See also: http://mongoosejs.com/docs/guide.html
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

	// Utility functions and values used in the schema
	//
	function emptyObj() { return {}; }
	function forceInt(v) { return Math.round(v); }

    // Define the webble schema:
    //
    var WebbleSchema = new mongoose.Schema();

	WebbleSchema.add({

	    webble: {

		    defid: { type: String, required: true, trim: true, index: { unique: false } },

		    instanceid: { type: Number, set: forceInt, default: 0 },

		    templateid: { type: String, default: "fundamental" },
		    templaterevision: { type: Number, set: forceInt, default: 0 },

            image: { type: String, default: "images/notFound.png" },

		    displayname: { type: String, default: "Fundamental Webble" },
		    description: { type: String, default: "Webble def file generated from fake data" },
		    keywords: { type: String, default: "simple basic" },
		    author: { type: String, default: "thetruemrwalker@gmail.com" },

		    protectflags: { type: Number, default: 0 },

            modelsharees: {
	            wbls: [Number],
	            slots: [String]
            },

		    slotdata: {

			    send: { type: Boolean, default: true },
			    receive: { type: Boolean, default: true },

			    selectslot: { type: String, default: "" },
			    connslot:  { type: String, default: "" },

                mcdata: [mongoose.Schema.Types.Mixed],

                slots: [{

					name:  { type: String, default: "superslot" },
				    category:  { type: String, default: "custom" },
				    value:  { type: mongoose.Schema.Types.Mixed, default: "1000" },
				    metadata:  { type: mongoose.Schema.Types.Mixed, default: emptyObj }
				}]
		    },

		    children: [WebbleSchema],

		    private: { type: mongoose.Schema.Types.Mixed, default: emptyObj }
	    },

		// Support for some metadata
		//
		_rating: {
			average: { type: Number, required: true, default: 0 },
			count: { type: Number, required: true, default: 0 }
		},
		_created: { type: Date, required: true, default: Date.now },
		_updated: { type: Date, required: false, default: Date.now },

        // These are security-oriented schema variables I'll control those (jgeorgal)
        //
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
	WebbleSchema.options.toJSON = {};
	WebbleSchema.options.toJSON.transform = function(doc, ret, options) {

		delete ret._id;
		delete ret.__v;

		delete ret._rating;

		delete ret._created;
		delete ret._updated;

		delete ret._sec;
		delete ret._owner;
		delete ret._contributors;
	};

	// Methods
	//
	WebbleSchema.methods.mergeWithObject = function (obj) {

		var self = this;

		Object.keys(obj).forEach(function(k) {
			self.webble[k] = obj[k];
		});
	};

	//******************************************************************

	WebbleSchema.methods.mergeWithInfoObject = function (info) {

		this.webble = {
			defid: info.id || this.webble.defid || 'undefined',
			templateid: info.id || this.webble.templateid || 'undefined',
			templaterevision: info.ver || 0,
			image: info.image || this.webble.image,
			displayname: info.name || this.webble.displayname || this.webble.defid,
			description: info.description || this.webble.description || this.webble.defid,
			keywords: info.keywords || this.webble.keywords || 'template',
			author: info.author || this.webble.author
		};

		// Other meta data props
		//
		this._created = info.created || Date.now();
		this._updated = info.modified || Date.now();
	};

	WebbleSchema.methods.getInfoObject = function () {

		return {
			id: this.webble.templateid,
			ver: this.webble.templaterevision,

			image: this.webble.image,
			name: this.webble.displayname,
			description: this.webble.description,
			keywords: this.webble.keywords,
			author: this.webble.author,

			created: this._created,
			modified: this._updated
		};
	};
    
	//******************************************************************

	WebbleSchema.methods.isUserOwner = function (user) {
		return !this._owner || this._owner.equals(user._id);
	};

	WebbleSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;

		for (var i = 0; i < this._contributors.length; ++i) {
			if (this._contributors[i].equals(user._id))
				return true;
		}
		return false;
	};

	WebbleSchema.methods.isUserAuthorizedForOperation = function (user, op) {
		return true;
	};

	// Other generic "inherited" methods
	//
	WebbleSchema.methods.repr = function () {
		return this.webble.displayname + ' (' + this.webble.defid + ')';
	};

    // Compile and return the model:
    //
	mongoose.model('DevWebble', WebbleSchema);

    return mongoose.model('Webble', WebbleSchema);
};
