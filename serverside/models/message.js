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
// message.js
// Created by Giannis Georgalis on 12/11/14
//
var Promise = require("bluebird");

module.exports = function(app, config, mongoose, gettext) {

    // Capped message schema for realtime message exchange via websockets among server instances
    //
    var MessageSchema = new mongoose.Schema({

        name: { type: String, required: true },
        date: { type: Date, required: true, default: Date.now },
        ctx: String,
        data: {},

        _owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    }, { capped: 1024 });

	// Options
	//
    MessageSchema.options.toJSON = {};
    MessageSchema.options.toJSON.transform = function(doc, ret, options) {

		// Add stuff
		//
		//ret.id = doc._id;

		// Delete stuff
		//
		delete ret._id;
		delete ret.__v;
        
        delete ret._owner;
	};

	// Methods
	//
    MessageSchema.methods.isUserOwner = function (user) {
		return this._owner.equals(user._id);
	};

    MessageSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;
		return false;
	};

	// Other generic "inherited" methods
	//
    MessageSchema.methods.repr = function () {
		return this.name;
	};

	// Compile and return the model:
    //
    return mongoose.model('Message', MessageSchema);
};
