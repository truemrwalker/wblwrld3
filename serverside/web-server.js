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

var path = require('path');
var fs = require('fs');

var util = require('./lib/util');
var loader = require('./lib/loader');
var config = require('./config');

var gettext = function(str) { return str; };

////////////////////////////////////////////////////////////////////////
// Connect to database and invoke the process' entry-point
//
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')({session: session});

mongoose.connect(config.MONGODB_URL);
//mongoose.set('debug', true);

mongoose.connection.on('error', function(err){

    console.error("Database Error:", err.message);
	process.exit(1);
});

mongoose.connection.on('open', function() {

	console.log("Database: connected");
	serverEntryPoint();
});

////////////////////////////////////////////////////////////////////////
// Configure the web server
//
var appInsecure = express();
var app = express();

(function(){

	// Serve static stuff quickly and get it out of the way
	app.use(serveStaticFavicon(path.join(config.APP_ROOT_DIR, 'favicon.ico')));
	app.use(serveStatic(config.APP_ROOT_DIR));

	var multerFieldsHack = [];
	while (multerFieldsHack.length < 21)
		multerFieldsHack.push({name: 'file' + multerFieldsHack.length, maxCount: 1});
	var multerOptionsHack = { dest: 'tmpuploads/' };
	app.use(multipartFormParser(multerOptionsHack).fields(multerFieldsHack));

	app.use(bodyParser.json({ limit: '10mb' }));
	//app.use(bodyParser.urlencoded({ extended: true })); // Turn off for now, we don't really need it

    app.use(cookieParser(/*config.SESSION_SECRET*/));

	// We want to save this in app
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
})();

////////////////////////////////////////////////////////////////////////
// Configure the insecure web server
//
(function() {

    // For now the insecure server -- just redirects to https immediately
    //
    appInsecure.use(function(req, res) { // we don't need to call next()
        res.redirect(301, config.SERVER_URL + req.path);
    });
})();

////////////////////////////////////////////////////////////////////////
// Starts the socket server (for real-time message dispatching)
//
function startSocketServer(webServer) {

    // Start the socket (real-time) server
    var io = require('socket.io').listen(webServer);
	var socketAuth = require('./auth/auth-socket')(Q, app, config, mongoose, gettext, io);

    // Load all real-time modules
	loader.executeAllSocketScriptsSync(path.join(__dirname, 'realtime'),
		Q, app, config, mongoose, gettext, io, socketAuth);
}

////////////////////////////////////////////////////////////////////////
// Starts the http and https servers
//
function startWebServer() {

	// Setup the authentication token
	var auth = require('./auth/auth')(Q, app, config, mongoose, gettext);

	// Load all modules that define the web server's routes
	loader.executeAllRouteScriptsSync(path.join(__dirname, 'api'),
		Q, app, config, mongoose, gettext, auth);

	loader.executeAllRouteScriptsSync(path.join(__dirname, 'files'),
		Q, app, config, mongoose, gettext, auth);

	// Start the http and https servers on the appropriate endpoints
	var http = require('http');
	var https = require('https');

	var options = {
		ca: config.SERVER_CA && util.transform_(config.SERVER_CA.split(','), fs.readFileSync),
		key: fs.readFileSync(config.SERVER_KEY),
		cert: fs.readFileSync(config.SERVER_CERT),
		passphrase: config.SERVER_PASSPHRASE || undefined
	};
	var httpsServer = https.createServer(options, app).listen(config.SERVER_PORT);
	var httpServer = http.createServer(appInsecure).listen(config.SERVER_PORT_INSECURE);

	// Finally, start the socket server
	startSocketServer(httpsServer, httpServer);

	console.log("[OK] Server endpoint:", config.SERVER_URL, "\n\tInsecure endpoint:", config.SERVER_URL_INSECURE);
}

////////////////////////////////////////////////////////////////////////
// The main function of this process
//
function serverEntryPoint() {

	// Compile all the necessary mongoose schema models
	loader.executeAllScriptsSync(path.join(__dirname, 'models'),
		Q, app, config, mongoose, gettext, ['user.js', 'group.js', 'webble.js', 'workspace.js']);

	// Execute code based on the deployment mode
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
		case 'development':
		case 'testing':
			promise = loader.executeAllScripts(path.join(__dirname, 'maintenance'),
				Q, app, config, mongoose, gettext, ['files.js', 'templates.js']);
			break;
	}
	return Q.when(promise, shouldExit ? process.exit : startWebServer);
}
