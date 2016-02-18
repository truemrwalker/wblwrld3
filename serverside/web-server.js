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
var Promise = require("bluebird");

// Express & Friends
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var http = require('http');

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
var MongoStore = require('connect-mongo')(session);

mongoose.Promise = Promise; // see: http://mongoosejs.com/docs/promises.html

//mongoose.set('debug', true);
mongoose.connect(config.MONGODB_URL, function (err) {
    
    if (err)
        return process.exit(1);
	
	return serverEntryPoint().catch(function (err) {
		console.log("Error:", err.message);
		process.exit(1);
	});
});

mongoose.connection.on('open', function () {
    console.log("Database:", "connected");
});
mongoose.connection.on('error', function(err){
    console.log("Database Error:", err.message);
});

////////////////////////////////////////////////////////////////////////
// Configure the applications
//
var app = (function createApp(){

    var app = express();
    
    // 1. First part of middleware initialization
    //
	app.use(bodyParser.json({ limit: '10mb' }));

	// We want to save this in app
	var sessionStore;

    // trust first proxy, so that despite "secure: true" cookies are set over HTTP when behind proxy
    app.set('trust proxy', 1);

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
    
    // 2. Configure database models and set up routes
    //
    loader.executeAllScriptsSync(path.join(__dirname, 'models'),
		app, config, mongoose, gettext, ['user.js', 'group.js', 'webble.js', 'workspace.js']);
    
    // Setup the authentication token
    var auth = require('./auth/auth')(app, config, mongoose, gettext);
    
    // Load all modules that define the web server's routes
    loader.executeAllRouteScriptsSync(path.join(__dirname, 'api'),
		app, config, mongoose, gettext, auth);
    
    loader.executeAllRouteScriptsSync(path.join(__dirname, 'files'),
		app, config, mongoose, gettext, auth);
    
    // 3. Second part of middleware initialization (after having had set up routes)
    //    
    if (!config.SERVER_BEHIND_REVERSE_PROXY) {
        
        // If we're not behind a proxy we also want to serve static stuff
        //
        var serveStatic = require('serve-static');
        var serveStaticFavicon = require('serve-favicon');
        
        app.use(serveStaticFavicon(path.join(config.APP_ROOT_DIR, 'favicon.ico')));
        app.use(serveStatic(config.APP_ROOT_DIR));
    }
    return app;
})();

////////////////////////////////////////////////////////////////////////
// Starts the socket server (for real-time message dispatching)
//
function initSocketServer(webServer) {

    // Start under endpoint for easier reverse proxy configuration
    var io = require('socket.io')(webServer).of('/socket.io/endpt');
	var socketAuth = require('./auth/auth-socket')(app, config, mongoose, gettext, io);

    // Load all real-time modules
	loader.executeAllSocketScriptsSync(path.join(__dirname, 'realtime'),
		app, config, mongoose, gettext, io, socketAuth);
}

////////////////////////////////////////////////////////////////////////
// Starts the control server (for intra server communication)
//
function initControlServer(webServer) {

    var ctrl = require('./control/machine')(app, config, mongoose, gettext, webServer);
}

////////////////////////////////////////////////////////////////////////
// Starts the http and https servers on the appropriate endpoints
//
function startAppServer() {
    
    if (!config.SERVER_BEHIND_REVERSE_PROXY) {

        if (config.SERVER_PORT != config.SERVER_PORT_PUBLIC) {
            
            var redirectApp = express();
            redirectApp.use(function (req, res) { // we don't need to call next()
                res.redirect(301, config.SERVER_URL_PUBLIC + req.path);
            });
            http.createServer(redirectApp).listen(config.SERVER_PORT);
        }

        var options = {
            ca: config.SERVER_CA && util.transform_(config.SERVER_CA.split(','), fs.readFileSync),
            key: fs.readFileSync(config.SERVER_KEY),
            cert: fs.readFileSync(config.SERVER_CERT),
            passphrase: config.SERVER_PASSPHRASE || undefined
        };
        var appServer = require('https').createServer(options, app);
        appServer.listen(config.SERVER_PORT_PUBLIC);
        return appServer;
    }
    else {

        var appServer = http.createServer(app);
        appServer.listen(config.SERVER_PORT);
        return appServer;
    }
}

////////////////////////////////////////////////////////////////////////
// Start all servers
//
function startAllServers() {

    var server = startAppServer();    
    initSocketServer(server);
    initControlServer(server);

    console.log("[OK] Server public endpoint:", config.SERVER_URL_PUBLIC, "[" + config.SERVER_URL + "]");
}

////////////////////////////////////////////////////////////////////////
// The main function of this process
//
function serverEntryPoint() {

	switch (config.DEPLOYMENT) {

		case 'bootstrap':
			return loader.executeAllScripts(path.join(__dirname, 'bootstrap'),
				app, config, mongoose, gettext).then(process.exit);

		case 'maintenance':
			return loader.executeAllScripts(path.join(__dirname, 'maintenance'),
				app, config, mongoose, gettext, ['templates.js', 'files.js']).then(process.exit);

		case 'development':
		case 'testing':
			return loader.executeAllScripts(path.join(__dirname, 'maintenance'),
				app, config, mongoose, gettext, ['templates.js', 'files.js']).then(startAllServers);

		default:
			return Promise.try(startAllServers);
	}
}
