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
 * @overview Defines the mongoose schema of the Wiki component.
 *
 * See also: http://mongoosejs.com/docs/guide.html
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

    var WikiSchema = new mongoose.Schema({

        id: { type: String, required: true, index: { unique: true } },
        name: String,
        repository: String,
        description: String,

        public_url: String,

        _owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    });

	// Options
	//
    WikiSchema.options.toJSON = {};
    WikiSchema.options.toJSON.transform = function(doc, ret, options) {

		delete ret._id;
		delete ret.__v;

        delete ret._owner;
        delete ret._contributors;
	};

	// Methods
	//
    WikiSchema.methods.isUserOwner = function (user) {
		return !this._owner || this._owner.equals(user._id);
	};

    WikiSchema.methods.isUserContributor = function (user) {

        if (this._owner && this._owner.equals(user._id))
            return true;

        for (var i = 0; i < this._contributors.length; ++i) {
            if (this._contributors[i].equals(user._id))
                return true;
        }
        return false;
    };

    WikiSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;

        for (var i = 0; i < this._contributors.length; ++i) {
            if (this._contributors[i].equals(user._id))
                return true;
        }
        return false;
	};

	// Other generic "inherited" methods
	//
    WikiSchema.methods.repr = function () {
		return this.name;
	};

	// Compile and return the model:
    //
    return mongoose.model('Wiki', WikiSchema);
};
