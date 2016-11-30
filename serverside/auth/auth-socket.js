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
 * @overview Implements the logic for authenticating websocket connections.
 *
 * Since this is not explicitly supported by expressjs, this module explicitly examines
 * the session cookies sent with websocket connection messages and determines whether
 * they belong to an authenticated session or not. Some realtime functionality explicitly
 * requires authenticated sockets and some (e.g., chat) does not care whether websockets
 * belong to authenticated sessions or not.
 * 
 * @module auth
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

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
    // Authorization handshake middleware that is invoked by the websockets
    // library uppon client connection
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
	// Reload session details when somebody logs in or out
	//
	app.on('auth:login', function(sessionID, session) {

		forEachUnauthenicatedClient(function (socket) {

			if (socket.handshake.sessionID === sessionID) {

				//socket.emit('auth:login');
				socket.handshake.user = session.passport && session.passport.user;
			}
		});
	});

	app.on('auth:logout', function(sessionID, session) {

		forEachAuthenicatedClient(function (socket) {

			if (socket.handshake.sessionID === sessionID) {

				//socket.emit('auth:logout');
				delete socket.handshake.user;
			}
		});
	});

    // Disabled: Used to notify other browser windows/tabs that a specific sesssion became authenticated.
    //
	//app.on('auth:user', function(userEmail) {
    //
	//	forEachAuthenicatedClient(function (socket) {
    //
	//		if (socket.handshake.user === userEmail)
	//			socket.emit('auth:user');
	//	});
	//});

    ////////////////////////////////////////////////////////////////////

   /**
    * Returns a list of all the users that are connected to the current Webble World server instance.
    * @returns {Object[]} An array of connection objects that contain the current sessionID and the
    *     current user that has established the session (if the user is authorized).
    */
    app.getAllActiveUsers = function () {

        var result = [];
        var clientIds = Object.keys(io.connected);
        for (var i = 0; i < clientIds.length; ++i) {

            var client = io.connected[clientIds[i]];
            result.push({ sessionID: client.handshake.sessionID, user: client.handshake.user });
        }
        return result;
    };

   /**
    * The main result of this module is the function that determines if a websocket is authenticated or not.
    * @param {Socket} socket - The instance of a websocket object.
    * @returns {boolean} True if the "socket" belongs to an authenticated session and false if not.
    */
	return function(socket) {
		return !!socket.handshake.user;
	};
};
