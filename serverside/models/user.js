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
// user.js
// Created by Giannis Georgalis on 10/29/13
//
var Promise = require("bluebird");
var crypto = require('crypto');

Promise.promisifyAll(crypto);

module.exports = function(app, config, mongoose, gettext) {

	// Define the schema:
	//
	var UserSchema = new mongoose.Schema({
		
		// Properties provided by the user or resolved from other connected accounts
		name: {
			first: { type: String, required: true, trim: true },
			middle: { type: String, required: false, trim: true },
			last: { type: String, required: true, trim: true }
		},
		
		username: { type: String, required: false, trim: true, index: { unique: true, sparse: true } },

		email: { type: String, required: true, trim: true, lowercase: true, index: { unique: true } },		
		email_alts: [{ type: String, trim: true, lowercase: true }],
		
		languages : [String],
		
		website_urls: [String],
		image_urls: [String],
		
		description: String,
		
		gender: { type: String, enum: ['male', 'female'] },
		date_born: { type: Date, required: false },
		
		notif: {
			platform: Boolean,
			modify: Boolean,
			share: Boolean
		},
		
		_tasks: [{
				text: String,
				kind: { type: String, enum: ['message', 'confirm', 'yesno'], default: 'message' },
				
				date_created: { type: Date, required: true, default: Date.now },
				date_updated: { type: Date, required: true, default: Date.now },
				date_due: { type: Date },
				
				url: String,
				op: { type: String, enum: ['head', 'get', 'post', 'put', 'delete'] },
				payload: mongoose.Schema.Types.Mixed
			}],
		
		_sec: {
			
			// The status and role of the account
			account_status: { type: String, enum: ['verified', 'ok', 'inactive', 'fakemail', 'suspended', 'deleted'], default: 'ok' },
			
			role: { type: String, enum: ['adm', 'dev', 'usr'], required: true, default: 'dev' },
			
			// Security-oriented variables
			cert: String,
			
			groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
			trusts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
			
			// Keep log
			date_joined: { type: Date, required: true, default: Date.now },
			date_updated: { type: Date, required: false, default: Date.now },
			
			captains_log: [{ time: Date, event: String }]
		},
		
		_auth: {
			
			keys: [{
					realm: { type: String, trim: true, required: true },
					resource: { type: String, trim: true, required: true },
					access_key: { type: String, required: true }
				}],
			
			providers: [{ type: String, enum: ['local', 'twitter', 'facebook', 'google'] }],
			
			local: {
				
				// Private fields for auth_provider == 'local'
				hash: { type: String, required: false },
				salt: { type: String, required: false },
				forgot: { type: Number, required: true, min: 0, max: 5, default: 0 }
			},
			
			twitter: {
				
				// Private fields for auth_provider == 'twitter'
				id: { type: Number, required: false, index: { unique: true, sparse: true } },
				username: { type: String, required: false },
				token: { type: String, required: false },
				secret: { type: String, required: false }
			},
			
			facebook: {
				
				// Private fields for auth_provider == 'facebook'
				id: { type: Number, required: false, index: { unique: true, sparse: true } },
				username: { type: String, required: false },
				token: { type: String, required: false },
				refresh: { type: String, required: false }
			},
			
			google: {
				
				// Private fields for auth_provider == 'google'
				id: { type: String, required: false, index: { unique: true, sparse: true } },
				access_token: { type: String, required: false },
				refresh_token: { type: String, required: false }
			},
			
			evernote: {
				
				token: { type: String, required: false },
				note_store_url: { type: String, required: false },
				user_id: { type: String, required: false, index: { unique: true, sparse: true } },
				expires: { type: Number },
				web_api_url_prefix: { type: String, required: false },
				linked_app_notebook_selected: { type: Boolean, required: false }
			},
			
			github: {
				
				id: { type: String, required: false, index: { unique: true, sparse: true } },
				access_token: { type: String, required: false },
				refresh_token: { type: String, required: false }
			}
		}
	});

	// Options
	//
	UserSchema.options.toJSON = {
		virtuals: true
	};
	UserSchema.options.toJSON.transform = function(doc, ret, options) {

		// Add stuff
		//
		if (doc._sec.role) { // Only include these if we've included _sec

			if (!ret.notif) // This check is mainly for backwards compatibility
				ret.notif = {};

			ret.notif.pending = ret._tasks; // ret._tasks not doc._tasks to use the transformed version            
			ret.notif.pending.forEach(function (n) {

				n.id = n._id;
				delete n._id;
			});

			ret.role = doc._sec.role;
			ret.date_joined = doc._sec.date_joined;

			if (doc._sec.account_status === 'verified')
				ret.verified = true;
		}
		if (doc._auth.keys && doc._auth.providers) {

			ret.auth_keys = ret._auth.keys; // ret._auth.keys not doc._auth.keys to use the transformed version
			ret.auth_providers = doc._auth.providers;
		}

		// Delete stuff
		//
		delete ret.id;
		delete ret._id;
		delete ret.__v;

		delete ret._tasks;
		delete ret._sec;
		delete ret._auth;
	};

	// Virtual properties
	//
	UserSchema.virtual('name.full').get(function () {

		var self = this;

		return !self.name.middle ? self.name.first + ' ' + self.name.last :
		self.name.first + ' ' + self.name.middle + ' ' + self.name.last;
	});
	UserSchema.virtual('name.full').set(function (name) {

		var self = this;
		var split = name.split(' ');

		if (split.length == 1) {

			self.name.first = split[0];
			self.name.last = split[0] + 'vic';
		}
		else if (split.length == 2) {

			self.name.first = split[0];
			self.name.last = split[1];
		}
		else if (split.length >= 3) {

			self.name.first = split[0];
			self.name.middle = split[1];
			self.name.last = split[2];
		}
	});

	UserSchema.virtual('language').get(function () {

		var self = this;
		return (self.languages && self.languages[0]) || 'en';
	});
	UserSchema.virtual('language').set(function (lang) {

		var self = this;
		var langs = [ lang ];

		for (var i = 0; i < self.languages.length; ++i) {
			if (self.languages[i] != lang)
				langs.push(self.languages[i]);
		}
		self.languages = langs;
	});

	// The fields that we can send to the client to use in the interface
	//
	UserSchema.methods.getSafeProps = function() {

		return this.toJSON();
	};

	// Define additional methods for securely storing password info
	//
	UserSchema.methods.setPasswordAsync = function (password) {
		
		var self = this;
		return Promise.try(function () {

			if (!password)
				throw new Error(gettext("Password is empty"));

			return crypto.randomBytesAsync(32).then(function (buf) {

				var salt = buf.toString('hex');
				return crypto.pbkdf2Async(password, salt, 25000, 512, 'sha1').then(function (hashRaw) { // TODO: use 'sha512'

					self._auth.local.hash = new Buffer(hashRaw, 'binary').toString('hex');
					self._auth.local.salt = salt;
					self._auth.local.forgot = 0;
					return self;
				});
			});
		});
	};
	
	UserSchema.methods.checkPasswordAsync = function (password) {

		var self = this;
		return crypto.pbkdf2Async(password, self._auth.local.salt, 25000, 512, 'sha1').then(function (hashRaw) { // TODO: use 'sha512'
			
			var hash = new Buffer(hashRaw, 'binary').toString('hex');            
			return (hash === self._auth.local.hash) ? self : null;
		});
	};

	// Introspective stuff
	//
	UserSchema.methods.hasRole = function (role) {
		return this._sec.role === role;
	};

	// Authorization stuff for completeness with respect to other models
	//
	UserSchema.methods.isUserOwner = function (user) {
		return this._id.equals(user._id);
	};
	UserSchema.methods.isUserAuthorized = function (user) {
		return this._id.equals(user._id) || user._sec.role === 'adm';
	};
	UserSchema.methods.isUserAuthorizedForOperation = function (user, op) {
		return true;
	};

	// Other generic "inherited" methods
	//
	UserSchema.methods.repr = function () {
		return this.username || this.name.full;
	};

	// Middleware for supporting realtime notifications for changes
	//
	UserSchema.post('save', function(user) {

		// Real-time notification of user changes
		//app.emit('auth:user', user.email);
	});

	// Compile and return the model:
	//
	return mongoose.model('User', UserSchema);
};
