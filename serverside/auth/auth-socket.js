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
// auth-socket.js
// Created by Giannis Georgalis on 1/22/14
//
var Promise = require("bluebird");

// Summon the cookieParser for parsing signed cookiez
var cookie = require('cookie');
var parser = require('cookie-parser');

module.exports = function(app, config, mongoose, gettext, io) {

    var User = mongoose.model('User');
    var sessionStore = app.locals.sessionStore;

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function sessionIdFromCookieHeader(cookieHeader) {

		try {
			var signedCookies = cookie.parse(decodeURIComponent(cookieHeader));
			var parsedCookie = parser.signedCookies(signedCookies, config.SESSION_SECRET);

			// Do I need this????
			parsedCookie = parser.JSONCookies(parsedCookie);

			return parsedCookie[config.SESSION_KEY];
		}
		catch (err) {
			return undefined;
		}
	}

	function forEachConnectedClient(func) {

		var clientIds = Object.keys(io.connected);
		for (var i = 0; i < clientIds.length; ++i) {

			var client = io.connected[clientIds[i]];
			func(client);
		}
	}
	function forEachAuthenicatedClient(func) {

		var clientIds = Object.keys(io.connected);
		for (var i = 0; i < clientIds.length; ++i) {

			var client = io.connected[clientIds[i]];
			if (client.handshake.user)
				func(client);
		}
	}
	function forEachUnauthenicatedClient(func) {

		var clientIds = Object.keys(io.connected);
		for (var i = 0; i < clientIds.length; ++i) {

			var client = io.connected[clientIds[i]];
			if (!client.handshake.user)
				func(client);
		}
	}

	////////////////////////////////////////////////////////////////////
	// Authorization handshake
	//
	io.use(function(socket, next) {

		var hsData = socket.handshake;

		if (hsData.headers.cookie && (hsData.sessionID = sessionIdFromCookieHeader(hsData.headers.cookie))) {

			sessionStore.load(hsData.sessionID, function(err, session) {

				if (err)
					next(err);
				else if (!session)
					next(new Error(gettext("Unauthorized")));
				else {

 					hsData.user = session.passport && session.passport.user;
					next();
				}
			});
		}
		else
			next(new Error(gettext("Unauthorized")));
	});

	////////////////////////////////////////////////////////////////////
    // Enhance app with extra functions for checking internal state
    //
    app.getAllActiveUsers = function() {

    var result = [];
    var clientIds = Object.keys(io.connected);
    for (var i = 0; i < clientIds.length; ++i) {

        var client = io.connected[clientIds[i]];
        result.push({ sessionID: client.handshake.sessionID, user: client.handshake.user });
    }
    return result;
    };
    
	////////////////////////////////////////////////////////////////////
	// Reload session details when somebody logs in or out
	//
	app.on('auth:login', function(sessionID, session) {

		forEachUnauthenicatedClient(function (socket) {

			if (socket.handshake.sessionID === sessionID) {

				socket.emit('auth:login');
				socket.handshake.user = session.passport && session.passport.user;
			}
		});
	});

	app.on('auth:logout', function(sessionID, session) {

		forEachAuthenicatedClient(function (socket) {

			if (socket.handshake.sessionID === sessionID) {

				socket.emit('auth:logout');
				delete socket.handshake.user;
			}
		});
	});

	app.on('auth:user', function(userEmail) {

		forEachAuthenicatedClient(function (socket) {

			if (socket.handshake.user === userEmail)
				socket.emit('auth:user');
		});
	});

	// Define and return the auth directive (middleware)
	//
	return function(socket) {
		return !!socket.handshake.user;
	};
};
