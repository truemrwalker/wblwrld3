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
 * @overview Defines the mongoose schema of the Workspace component.
 *
 * See also: http://mongoosejs.com/docs/guide.html
 *
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

	var WebbleSchema = mongoose.model('Webble').schema;

	// Define the workspace schema:
	//
	var WorkspaceSchema = new mongoose.Schema({

	    workspace: {

		    name: String,
            creator: String,
            share_readonly: Boolean,
		    webbles: [WebbleSchema]
	    },

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
	WorkspaceSchema.options.toJSON = {};
	WorkspaceSchema.options.toJSON.transform = function(doc, ret, options) {

		delete ret._id;
		delete ret.__v;

		delete ret._sec;
		delete ret._owner;
		delete ret._contributors;
	};

	// Methods
	//
	WorkspaceSchema.methods.mergeWithObject = function (obj) {

		var self = this;

		Object.keys(obj).forEach(function(k) {
			self.workspace[k] = obj[k];
		});
	};

	WorkspaceSchema.methods.isShared = function () {
		return this._contributors && this._contributors.length != 0;
	};
	WorkspaceSchema.methods.isPrivate = function () {
		return !this._contributors || this._contributors.length == 0;
	};

	WorkspaceSchema.methods.isUserOwner = function (user) {
		return !this._owner || this._owner.equals(user._id);
	};

	WorkspaceSchema.methods.isUserAuthorized = function (user, isWrite) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;

        if (isWrite && this.workspace.share_readonly)
            return false;

		for (var i = 0; i < this._contributors.length; ++i) {
			if (this._contributors[i].equals(user._id))
				return true;
		}
		return false;
	};

	WorkspaceSchema.methods.isUserContributor = function (user) {

		if (this._owner && this._owner.equals(user._id))
			return true;

		for (var i = 0; i < this._contributors.length; ++i) {
			if (this._contributors[i].equals(user._id))
				return true;
		}
		return false;
	};

	WorkspaceSchema.methods.isUserAuthorizedForOperation = function (user, op) {
		return true;
	};

	// Other generic "inherited" methods
	//
	WorkspaceSchema.methods.repr = function () {
		return this.workspace.name;
	};

    // Compile and return the model:
    //
    return mongoose.model('Workspace', WorkspaceSchema);
};
