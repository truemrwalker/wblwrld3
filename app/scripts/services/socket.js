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

'use strict';

/**
 * Socket Factory based on https://github.com/btford/angular-socket-io
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.provider('socketFactory', function () {

    // when forwarding events, prefix the event name
    var defaultPrefix = 'socket:';

    // expose to provider
    this.$get = function ($rootScope, $timeout) {

        var schedule = function (socket, callback) {
            return callback ? function () {
                var args = arguments;
                $timeout(function () { callback.apply(socket, args); }, 0);
            } : angular.noop;
        };

        return function socketFactory (options) {
            options = options || {};
            var socket = options.ioSocket || io('/socket.io/endpt');
            var prefix = options.prefix || defaultPrefix;
            var defaultScope = options.scope || $rootScope;

            var addListener = function (eventName, callback) {
                socket.on(eventName, schedule(socket, callback));
            };

            return {
                on: addListener,
                addListener: addListener,

                emit: function (eventName, data, callback) {
                    return socket.emit(eventName, data, schedule(socket, callback));
                },

                removeListener: function () {
                    return socket.removeListener.apply(socket, arguments);
                },

                // when socket.on('someEvent', fn (data) { ... }),
                // call scope.$broadcast('someEvent', data)
                forward: function (events, scope) {

                    if (events instanceof Array === false)
                        events = [events];

                    if (!scope)
                        scope = defaultScope;

                    events.forEach(function (eventName) {

                        var prefixedEvent = prefix + eventName;
                        var forwardBroadcast = schedule(socket, function (data) {
                            scope.$broadcast(prefixedEvent, data);
                        });
                        scope.$on('$destroy', function () {
                            socket.removeListener(eventName, forwardBroadcast);
                        });
                        socket.on(eventName, forwardBroadcast);
                    });
                }
            };
        };
    };
});

//**********************************************************************

/**
 * Instantiation of the factory as the 'socket' service for realtime communication
 * among the clients that is arbitrated by the server
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('socket', function (socketFactory) {
    return socketFactory();
});
