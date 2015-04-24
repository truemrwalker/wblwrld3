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
// web-server.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
////////////////////////////////////////////////////////////////////////
// Load essential modules
//
var Q = require('q');

// Express & Friends
var express = require('express');
var session = require('express-session');
var multipartFormParser = require('multer');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var serveStaticFavicon = require('serve-favicon');

var http = require('http');
var https = require('https');

var path = require('path');
var fs = require('fs');

var appInsecure = express();
var app = express();

var util = require('./lib/util');
var loader = require('./lib/loader');
var config = require('./config');

var gettext = function(str) { return str; };

////////////////////////////////////////////////////////////////////////
// Extract and update startup data from config
//

// Allow env variables to override config values
//
Object.keys(config).forEach(function(key) {

	if (process.env[key] !== undefined)
		config[key] = process.env[key]
});

// Allow commnand line options to override config and env values
//
Object.keys(config).forEach(function(key) {

	var optionKey = "--" + key.toLowerCase().replace('_', '-');

	var argIndex = process.argv.indexOf(optionKey);
	if (argIndex != -1 && argIndex + 1 < process.argv.length) {

		var value = process.argv[argIndex + 1];
		config[key] = value[0] != '-' ? value : '';
	}
});

// Calculate, update and populate other config options
//
var portInsecure = process.env.PORT ? parseInt(process.env.PORT, 10) : config.SERVER_PORT;
var port = portInsecure == 80 ? 443 : portInsecure + 443;

config.SERVER_URL_INSECURE = portInsecure == 80 || config.DEPLOYMENT != 'development' ?
    "http://" + config.SERVER_NAME : 'http://' + config.SERVER_NAME + ':' + portInsecure;

config.SERVER_URL = port == 443  || config.DEPLOYMENT != 'development' ?
    "https://" + config.SERVER_NAME : 'https://' + config.SERVER_NAME + ':' + port;

////////////////////////////////////////////////////////////////////////
// Database setup
//
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')({session: session});

mongoose.connect(config.MONGODB_URL);
//mongoose.set('debug', true);

mongoose.connection.on('error', function(err){
    console.log("DB ERROR:", err);
});

mongoose.connection.on('open', function() {

	console.log("Successfully connected to the database");
	serverEntryPoint();
});

////////////////////////////////////////////////////////////////////////
// Configure the server
//
(function(){

	// Serve static stuff quickly and get it out of the way
	//
	app.use(serveStaticFavicon(path.join(config.APP_ROOT_DIR, 'favicon.ico')));
	app.use(serveStatic(config.APP_ROOT_DIR));

	app.use(multipartFormParser());
	app.use(bodyParser.json({ limit: '10mb' }));
	//app.use(bodyParser.urlencoded({ extended: true })); // Turn off for now, we don't really need it

    app.use(cookieParser(/*config.SESSION_SECRET*/));

	// We want to save this in app
	//
	var sessionStore;

	// Set up the session-specific parameters
    app.use(session({
        proxy: config.SERVER_BEHIND_REVERSE_PROXY,
        secret: config.SESSION_SECRET,
        key: config.SESSION_KEY,
        cookie: { httpOnly: true, secure: true },
        store: sessionStore = new MongoStore({
          mongooseConnection: mongoose.connection
        }),
	    saveUninitialized: true, // https://github.com/expressjs/session
	    resave: false
    }));

	app.set('sessionStore', sessionStore);

	setupRoutes();
})();

////////////////////////////////////////////////////////////////////////
// Configure the insecure server
//
(function() {

    // For now the insecure server -- just redirects to https immediately
    //
    appInsecure.use(function(req, res, next) {
        res.redirect(301, config.SERVER_URL + req.path);
    });
})();

////////////////////////////////////////////////////////////////////////
// Setup all the required routes including authentication
//
function setupRoutes() {

	// Compile all the necessary mongoose schema models
	//
	loader.executeAllScriptsSync(path.join(__dirname, 'models'),
		Q, app, config, mongoose, gettext, ['user.js', 'group.js', 'webble.js', 'workspace.js']);

    // Setup the authentication token
    //
    var auth = require('./auth/auth')(Q, app, config, mongoose, gettext);

    // Load all api modules
    //
	loader.executeAllRouteScriptsSync(path.join(__dirname, 'api'),
		Q, app, config, mongoose, gettext, auth);
}

////////////////////////////////////////////////////////////////////////
// Setup the real-time server
//
function setupRtMsgDispatcher(server) {

    // Start the socket (real-time) server
    //
    var io = require('socket.io').listen(server);
	var socketAuth = require('./auth/auth-socket')(Q, app, config, mongoose, gettext, io);

    // Load all real-time modules
    //
	loader.executeAllSocketScriptsSync(path.join(__dirname, 'realtime'),
		Q, app, config, mongoose, gettext, io, socketAuth);
}

////////////////////////////////////////////////////////////////////////
// Start the server
//
function startServer() {

	var options = {
		ca: config.SERVER_CA && util.transform_(config.SERVER_CA.split(','), fs.readFileSync),
		key: fs.readFileSync(config.SERVER_KEY),
		cert: fs.readFileSync(config.SERVER_CERT),
		passphrase: config.SERVER_PASSPHRASE || undefined
	};
	var httpsServer = https.createServer(options, app).listen(port);
	var httpServer = http.createServer(appInsecure).listen(portInsecure);

	console.log("OK [ ", portInsecure, port, "]");

	setupRtMsgDispatcher(httpsServer);
}

////////////////////////////////////////////////////////////////////////
// The main function of this process
//
function serverEntryPoint() {

	var promise = Q.resolve(0);
	var shouldExit = false;

	switch(config.DEPLOYMENT) {

		case 'bootstrap':
			promise = loader.executeAllScripts(path.join(__dirname, 'bootstrap'),
				Q, app, config, mongoose, gettext);
			shouldExit = true;
			break;
		case 'maintenance':
			shouldExit = true; /*FALLTHROUGH*/
		case 'deployment':
		case 'testing':
			promise = loader.executeAllScripts(path.join(__dirname, 'maintenance'),
				Q, app, config, mongoose, gettext, ['templates.js', 'files.js']);
			break;
	}
	Q.when(promise, shouldExit ? process.exit : startServer);
}
