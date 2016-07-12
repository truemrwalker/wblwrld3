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
// chat.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

////////////////////////////////////////////////////////////////////////
// Implementation of the real-time chat application
//
module.exports = function(app, config, mongoose, gettext, io, auth) {

    app.locals.sub.subscribe('chat');

    app.locals.sub.on('message', function (channel, dataString) {

        if (channel !== 'chat')
            return;

        var data = JSON.parse(dataString);
        data.date = Date.now();
        io.to('chat').emit('chat:message', data);
    });

    // app.locals.sub.unsubscribe('chat');

    io.on('connection', function (socket) {

        socket.on('chat:started', () => socket.join('chat'));
        socket.on('chat:ended', () => socket.leave('chat'));
        socket.on('chat:message', (data) => app.locals.pub.publish('chat', JSON.stringify(data)));

        socket.on('disconnect', () => { }); // Nothing to do for now
    });
};
