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
 * @overview Contains and exposes all the configurable values and secrets.
 *
 * This file uses only secrets.js (that's its only in-project dependency) to read
 * and expose all the available secrets and the other configuration options needed
 * for the initialization and operation of the server. Therefore, all secrets utilized
 * by other components are read via the config module and not via the secrets module directly.
 * config options can be overriden by either environment variables or command-line arguments that
 * are defined when the server entrypoint is invoked - e.g.:
 *    node serverside/web-server.js --deployment maintenance --sync-online-webbles 1
 *
 * Command-line arguments can override environment variables and preset config.js values
 * and environment variables can only override the preset config.js values.
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

var path = require('path');
var fs = require('fs');
var sec = require('./secrets');

module.exports = (function() {

    /**
     * @namespace
     * @property {string} PROJECT_ROOT_DIR - The root dir of the repository.
     * @property {string} PROJECT_MANAGEMENT_DIR - The parent directory of the repository
     *     that may contain management scripts (e.g., restart server, update repository, etc.).

     * @property {string} SERVER_NAME - The name of the server (domain) that hosts the server.
     * @property {string} SERVER_PORT - The unsecure port (HTTP) under which the server runs.
     * @property {boolean} SERVER_BEHIND_REVERSE_PROXY - If there's a reverse proxy running in
     *     front of the server instance (e.g. Nginx) this should be true.

     * @property {string} SERVER_CA - If the server has an additional https endpoint, this points
     *     to the file (relative to the SERVER_ROOT_DIR) that contains the CA's public key.
     * @property {string} SERVER_KEY - If the server has an additional https endpoint, this points
     *     to the file (relative to the SERVER_ROOT_DIR) that contains the domain's private key.
     * @property {string} SERVER_CERT - If the server has an additional https endpoint, this points
     *     to the file (relative to the SERVER_ROOT_DIR) that contains the domain's public key.
     * @property {string} SERVER_PASSPHRASE - If applicable, this contains the server's private key's
     *     passphrase.
     * @property {string} SERVER_ROOT_DIR - The root directory of the server (i.e., "serverside").

     * @property {string} MAIL_HOST - The SMTP host to use for sending emails via nodemailer; see
     *     also the following: https://github.com/nodemailer/nodemailer-smtp-transport for more information.
     * @property {number} MAIL_PORT - The SMTP server's port.
     * @property {boolean} MAIL_SECURE - Whether to use a secure connection to the SMTP host or not.
     * @property {string} MAIL_USER - The username of the account used to authenticate to the SMTP host.
     * @property {string} MAIL_PASS - The password of the account which is used to authenticate to the
     *     SMTP server (note that the user and pass values are read as secrets).

     * @property {string} APP_NAME - The name of the application.
     * @property {string} APP_EMAIL_ADDRESS - The application's default email address.
     * @property {string} APP_CRYPT_PASSWORD - A password that encrypts reset URLs sent to users that
     *     have forgotten their password.
     * @property {string} APP_ROOT_DIR - The root directory of the application (i.e., "app").

     * @property {string} REDIS_HOST - The host (resolvable hostname or IP) on which redis server runs.
     * @property {string} REDIS_PORT - The port under which the redis server is exposed.
     * @property {string} REDIS_PASS - The redis server's password (if any).

     * @property {string} MONGODB_HOST - The host (resolvable hostname or IP) on which mongodb server runs.
     * @property {string} MONGODB_PORT - The port under which the mongodb server is exposed.
     * @property {string} MONGODB_DB_NAME - The name of the database that the application uses.
     * @property {string} MONGODB_DB_USERNAME - The username of the database's principal user.
     * @property {string} MONGODB_DB_PASSWORD - The password of the database's principal user.

     * @property {string} SESSION_KEY - The name of the cookie that tracks the session.
     * @property {string} SESSION_SECRET - The secret used to encrypt the cookies that track the session.

     * @property {string} TWITTER_CONSUMER_KEY - The application's twitter consumer key.
     * @property {string} TWITTER_CONSUMER_SECRET - The application's twitter consumer secret, where both
     *     the consumer key and secret can be obtained from here: https://dev.twitter.com/apps
     * @property {string} GOOGLE_CLIENT_ID - The application's google client id.
     * @property {string} GOOGLE_CLIENT_SECRET - The application's google client secret, where both the
     *     client id and secret are generated for the application's domain and instructions are
     *     available here: https://developers.google.com/identity/sign-in/web/devconsole-project
     * @property {string} FACEBOOK_APP_ID - The application's facebook app id.
     * @property {string} FACEBOOK_APP_SECRET - The application's facebook app secrete, where both the
     *     app id and secret can be obtained from here: https://developers.facebook.com/apps

     * @property {enum} DEPLOYMENT - Is one of 'development', 'production', 'testing', 'maintenance',
     *    'bootstrap', where 'development' runs all the maintenance scripts and starts the server,
     *    'production' just starts the server, 'testing' starts the server but may also enable additional
     *    checks and debugging code, 'maintenance' runs all the maintenance scripts and exits,
     *    'bootstrap' runs all the bootstrap scripts and exits.
     * @property {boolean} SYNC_ONLINE_WEBBLES - ONLY when maintenance scripts are run, this value decides
     *     whether all the published webbles on https://wws.meme.hokudai.ac.jp will be fetched and
     *     merged into the local database.

     * @property {string} MONGODB_URL - This is an automatically generated URL that points to the mongodb server.
     * @property {string} SERVER_URL - This is an automatically generated URL that points to the local server instance.
     * @property {string} SERVER_URL_PUBLIC - This is an automatically generated URL that points to the public server
     *     instance which may be different, especially when the server is behind a reverse proxy (e.g., the private URL
     *     may be: http://devmachine1.meme.hokudai.ac.jp:7000 and the public one https://wws.meme.hokudai.ac.jp).
     */
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
        MAIL_HOST: 'crow.meme.hokudai.ac.jp',
        MAIL_PORT: 465,
        MAIL_SECURE: true, // use SSL
		MAIL_USER: sec.get('mail_user'),
		MAIL_PASS: sec.get('mail_pass'),

		// App settings
		APP_NAME: 'wblwrld3',
		APP_EMAIL_ADDRESS: 'Webble World Developer <thetruemrwalker@gmail.com>',
		APP_CRYPT_PASSWORD: sec.get('app_password'),
		APP_ROOT_DIR: path.join(__dirname, '../app'),

		// DB and session settings
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
		
		// URLs are automatically generated by other values - the following are available:
		//     MONGODB_URL, SERVER_URL, SERVER_URL_PUBLIC

		// DEPLOYMENT can be 'development', 'production', 'testing', 'maintenance', 'bootstrap'
        DEPLOYMENT: 'development',

        // Default sync options
        SYNC_ONLINE_WEBBLES: false
	};

	////////////////////////////////////////////////////////////////////
	// Allow third party env variables to override config values
	//
	if (process.env.KUBERNETES_SERVICE_HOST) {

		config.MONGODB_HOST = process.env.MONGO_SERVICE_HOST;
        config.MONGODB_PORT = parseInt(process.env.MONGO_SERVICE_PORT, 10);

        config.REDIS_HOST = process.env.REDIS_SERVICE_HOST;
        config.REDIS_PORT = parseInt(process.env.REDIS_SERVICE_PORT, 10);
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

		var optionKey = "--" + key.toLowerCase().replace(/_/g, '-');

		var argIndex = process.argv.indexOf(optionKey);
		if (argIndex != -1 && argIndex + 1 < process.argv.length) {

			var value = process.argv[argIndex + 1];
            config[key] = value[0] != '-' ? value : '';

            //console.log("Command-line option processed in config:", key, "->", config[key]);
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
