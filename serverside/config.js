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
// config.js
// Created by Giannis Georgalis on 10/30/13
//
var path = require('path');
var fs = require('fs');
var sec = require('./secrets');

module.exports = (function() {

	////////////////////////////////////////////////////////////////////
	// Preset, default configuration values
	//
	var config = {

		PROJECT_ROOT_DIR: path.join(__dirname, '..'),
		PROJECT_MANAGEMENT_DIR: path.join(__dirname, '../..'),

		// Server specific settings
		SERVER_NAME: 'localhost',
		SERVER_PORT: 7000,
		SERVER_BEHIND_REVERSE_PROXY: false,

		SERVER_CA: '', // Certificate Authority Bundle
		SERVER_KEY: path.join(__dirname, 'keys/key.pem'),
		SERVER_CERT: path.join(__dirname, 'keys/cert.pem'),
		SERVER_PASSPHRASE: '',
		SERVER_ROOT_DIR: __dirname,

		// Mail settings
		MAIL_SERVICE: 'mailgun',
		MAIL_KEY: sec.get('mailgun_key'),
		MAIL_DOMAIN: sec.get('mailgun_domain'),

		// App settings
		APP_NAME: 'wblwrld3',
		APP_EMAIL_ADDRESS: 'wblwrld3 Bot <hello@webbleworld.com>',
		APP_CRYPT_PASSWORD: sec.get('app_password'),
		APP_ROOT_DIR: path.join(__dirname, '../app'),

		// Application level settings
		MONGODB_DB_NAME: "wblwrld3",
		MONGODB_DB_USERNAME: sec.get('mongo_db_username'),
		MONGODB_DB_PASSWORD: sec.get('mongo_db_password'),

		SESSION_KEY: "connect.wblwrld3.sid",
		SESSION_SECRET: sec.get('session_secret'),

		// Third party auth tokens
		TWITTER_CONSUMER_KEY: sec.get('twitter_consumer_key'),
		TWITTER_CONSUMER_SECRET: sec.get('twitter_consumer_secret'),

		GOOGLE_CLIENT_ID: sec.get('google_client_id'),
		GOOGLE_CLIENT_SECRET: sec.get('google_client_secret'),

		FACEBOOK_APP_ID: sec.get('facebook_app_id'),
		FACEBOOK_APP_SECRET: sec.get('facebook_app_secret'),

		// Settings that are set automatically at startup
		//
		// SERVER_URL
		// SERVER_PORT
		// SERVER_URL_INSECURE
		// SERVER_PORT_INSECURE
		//
		// MONGODB_URL

		// Finally, Settings that are influenced by other, 3rd party, environment variables
		//
		MONGODB_HOST: "localhost",
		MONGODB_PORT: 27017,

		// DEPLOYMENT can be 'development', 'production', 'testing', 'maintenance', 'bootstrap'
		DEPLOYMENT: 'development'
	};

	////////////////////////////////////////////////////////////////////
	// Allow env variables to override config values
	//
	Object.keys(config).forEach(function(key) {

		if (process.env.hasOwnProperty(key))
			config[key] = process.env[key]
	});

	////////////////////////////////////////////////////////////////////
	// Allow command line arguments to override config and env values
	//
	Object.keys(config).forEach(function(key) {

		var optionKey = "--" + key.toLowerCase().replace('_', '-');

		var argIndex = process.argv.indexOf(optionKey);
		if (argIndex != -1 && argIndex + 1 < process.argv.length) {

			var value = process.argv[argIndex + 1];
			config[key] = value[0] != '-' ? value : '';
		}
	});

	////////////////////////////////////////////////////////////////////
	// Calculate, update and populate other (specialized) config options
	//
	var portInsecure = process.env.PORT ? parseInt(process.env.PORT, 10) : config.SERVER_PORT;
	var port = portInsecure == 80 ? 443 : portInsecure + 443;

	config.SERVER_PORT_INSECURE = portInsecure;
	config.SERVER_URL_INSECURE = portInsecure == 80 || config.DEPLOYMENT != 'development' ?
		"http://" + config.SERVER_NAME : 'http://' + config.SERVER_NAME + ':' + portInsecure;

	config.SERVER_PORT = port;
	config.SERVER_URL = port == 443  || config.DEPLOYMENT != 'development' ?
		"https://" + config.SERVER_NAME : 'https://' + config.SERVER_NAME + ':' + port;

	//******************************************************************

	if (process.env.NODE_ENV)
		config.DEPLOYMENT = process.env.NODE_ENV;

	if (process.env.DB_NAME && process.env.DB_PORT) {

		config.MONGODB_HOST = process.env.DB_PORT_27017_TCP_ADDR;
		config.MONGODB_PORT = parseInt(process.env.DB_PORT_27017_TCP_PORT, 10);
	}
	config.MONGODB_URL = "mongodb://" + config.MONGODB_DB_USERNAME + ":" + config.MONGODB_DB_PASSWORD + "@" +
		config.MONGODB_HOST + ":" + config.MONGODB_PORT.toString() + "/" + config.MONGODB_DB_NAME;

	////////////////////////////////////////////////////////////////////
	// Finally return the final configuration file
	//
	return config;
})();
