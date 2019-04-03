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
 * @overview Defines and implements the routing of generic real-time interaction messages.
 *
 * These messages are used in Webble World for real-time collaboration between users sharing
 * a workspace and for the implementation of the demonstrator /#/draw route.
 *
 * @author Giannis Georgalis
 */

var Promise = require("bluebird");

////////////////////////////////////////////////////////////////////////
// Implementation of the real-time interaction support
//
module.exports = function(app, config, mongoose, gettext, io, auth) {

    app.locals.sub.subscribe('interaction');

    app.locals.sub.on('message', function (channel, dataString) {

        if (channel !== 'interaction')
            return;

        var data = JSON.parse(dataString);
        io.to(data.id).emit(data.event, data);
    });

    io.on('connection', function (socket) {

	    // Starting stopping and checkpointing id-based interaction
	    // Usually the ID is the id of the workspace
	    //
	    socket.on('interaction:started', function (id) {
		    socket.join(id);
	    });
	    socket.on('interaction:ended', function (id) {
			socket.leave(id);
	    });

	    // Data should have a field called ID that refers to the coresponding
	    // id-based interaction. Again, usually the ID is the id of the workspace
	    //
        function emit(event, data) {

            data.event = event;
            app.locals.pub.publish('interaction', JSON.stringify(data));
        }
        socket.on('interaction:info', data => emit('interaction:info', data));
        socket.on('interaction:move', data => emit('interaction:move', data));
        socket.on('interaction:save', data => emit('interaction:save', data));
        socket.on('interaction:comm', data => emit('interaction:comm', data));
    });
};
