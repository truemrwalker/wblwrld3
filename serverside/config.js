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

		SERVER_CA: path.join(__dirname, 'keys/ca.crt'),
		SERVER_KEY: path.join(__dirname, 'keys/server.key'),
		SERVER_CERT: path.join(__dirname, 'keys/server.crt'),
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

		// DB and session settings
        REDIS_PATH: null,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        REDIS_PASS: sec.get('redis_password'),

		MONGODB_DB_NAME: "wblwrld3",
		MONGODB_DB_USERNAME: sec.get('mongo_db_username'),
		MONGODB_DB_PASSWORD: sec.get('mongo_db_password'),
		
		MONGODB_HOST: "localhost",
		MONGODB_PORT: 27017,

		SESSION_KEY: "connect.wblwrld3.sid",
		SESSION_SECRET: sec.get('session_secret'),

		// Third party auth tokens
		TWITTER_CONSUMER_KEY: sec.get('twitter_consumer_key'),
		TWITTER_CONSUMER_SECRET: sec.get('twitter_consumer_secret'),

		GOOGLE_CLIENT_ID: sec.get('google_client_id'),
		GOOGLE_CLIENT_SECRET: sec.get('google_client_secret'),

		FACEBOOK_APP_ID: sec.get('facebook_app_id'),
		FACEBOOK_APP_SECRET: sec.get('facebook_app_secret'),
		
		EVERNOTE_ENABLE_PRODUCTION: false,
		EVERNOTE_CONSUMER_KEY: sec.get('evernote_consumer_key'),
		EVERNOTE_CONSUMER_SECRET: sec.get('evernote_consumer_secret'),

		GITHUB_CLIENT_ID: sec.get('github_client_id'),
		GITHUB_CLIENT_SECRET: sec.get('github_client_secret'),

		// URLs are automatically generated by other values - the following are available:
		//     MONGODB_URL, SERVER_URL, SERVER_URL_PUBLIC

		// DEPLOYMENT can be 'development', 'production', 'testing', 'maintenance', 'bootstrap'
		DEPLOYMENT: 'development'
	};

	////////////////////////////////////////////////////////////////////
	// Allow third party env variables to override config values
	//
	if (process.env.KUBERNETES_SERVICE_HOST) {

		config.MONGODB_HOST = process.env.MONGO_SERVICE_HOST;
		config.MONGODB_PORT = parseInt(process.env.MONGO_SERVICE_PORT, 10);
	}
	
	if (process.env.PORT)
		config.SERVER_PORT = parseInt(process.env.PORT, 10);

	////////////////////////////////////////////////////////////////////
	// Allow env variables and arguments to override config values
	//
	Object.keys(config).forEach(function (key) { // Env variables
			
		if (process.env.hasOwnProperty(key))
			config[key] = process.env[key]
	});

	Object.keys(config).forEach(function (key) { // Give priority to arguments
			
		var optionKey = "--" + key.toLowerCase().replace('_', '-');
			
		var argIndex = process.argv.indexOf(optionKey);
		if (argIndex != -1 && argIndex + 1 < process.argv.length) {
				
			var value = process.argv[argIndex + 1];
			config[key] = value[0] != '-' ? value : '';
		}
	});

	////////////////////////////////////////////////////////////////////
	// Check ports and build the URLs
	//
	function checkPort(port) {
		if (isNaN(port) || port <= 0 || port >= 65535)
			throw new EvalError("Cannot start with wrong ports");
	}

	checkPort(config.MONGODB_PORT);
	config.MONGODB_URL = "mongodb://" + config.MONGODB_DB_USERNAME + ":" + config.MONGODB_DB_PASSWORD + "@" + 
		config.MONGODB_HOST + ":" + config.MONGODB_PORT.toString() + "/" + config.MONGODB_DB_NAME;

	checkPort(config.SERVER_PORT);
	config.SERVER_URL = "http://" + config.SERVER_NAME + 
		(config.SERVER_PORT == 80 ? '' : ':' + config.SERVER_PORT);

	// Public port over https    
	config.SERVER_PORT_PUBLIC = (config.SERVER_PORT == 80 || config.SERVER_BEHIND_REVERSE_PROXY) ? 
		443 : config.SERVER_PORT + 443;

	checkPort(config.SERVER_PORT_PUBLIC);
	config.SERVER_URL_PUBLIC = "https://" + config.SERVER_NAME + 
		(config.SERVER_PORT_PUBLIC == 443 ? '' : ':' + config.SERVER_PORT_PUBLIC);

	////////////////////////////////////////////////////////////////////
	// Finally, return the config object
	//
	return config;
})();
