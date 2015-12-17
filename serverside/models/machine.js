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
// server.js
// Created by Giannis Georgalis on 12/11/14
//
module.exports = function(Q, app, config, mongoose, gettext) {
    
    var ServiceSchema = new mongoose.Schema( {
        
        name: { type: String, required: true },
        address: { type: String, required: true },
        port: { type: Number, min: 1025, max: 65534, required: true },

        context: String,
        description: String,
    });

    var ServerSchema = new mongoose.Schema({

        name: { type: String, required: true },                
        services: [ServiceSchema],
        date: { type: Date, required: true, default: Date.now },
        
        context: String,
        description: String,

        _owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    });

    var MachineSchema = new mongoose.Schema({

        name: { type: String, required: true, index: { unique: true } },
        description: String,

        machine_id: { type: String, required: true, index: { unique: true } },
        addresses: { type: [String], required: true },

        servers: [ServerSchema],
        
        _locked: { type: Boolean, required: true, default: true },
        _owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    });

	// Options
	//
    MachineSchema.options.toJSON = {};
    MachineSchema.options.toJSON.transform = function(doc, ret, options) {

		delete ret._id;
		delete ret.__v;
        
        delete ret._owner;
	};

	// Methods
	//
    MachineSchema.methods.isUserOwner = function (user) {
		return this._owner.equals(user._id);
	};

    MachineSchema.methods.isUserAuthorized = function (user) {

		if (!this._owner || this._owner.equals(user._id) || user._sec.role === 'adm')
			return true;
		return false;
	};

	// Other generic "inherited" methods
	//
    MachineSchema.methods.repr = function () {
		return this.name;
	};

	// Compile and return the model:
    //
    return mongoose.model('Machine', MachineSchema);
};
