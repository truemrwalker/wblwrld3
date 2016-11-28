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
 * @overview  Implements a publish-subscribe channel as a redis queue and as a local EventEmitter.
 *
 * If it's possible to connect to a running redis server, the redis pub/sub is used, otherwise
 * the local EventEmitter is used. The publish and subscribe channels are saved and made
 * available to other components as app.locals.pub and app.locals.sub respectively.
 * 
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

const Promise = require('bluebird');
const EventEmitter = require('events');

const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

////////////////////////////////////////////////////////////////////////
// LocalPubSub replaces redis when the latter is not available
//
class LocalPubSub extends EventEmitter {

    constructor() {
        super();
        this.subscriptions = [];
    }
    subscribe(channel) {
        this.subscriptions.push(channel);
    }
    unsubscribe(channel, socket) {

        var index = this.subscriptions.indexOf(channel);
        if (index !== -1)
            this.subscriptions.splice(index, 1);
    }
    publish(channel, data) {
        this.emit('message', channel, data);
    }
}

//**********************************************************************

class RedisPubSub {

    constructor(config, pubSubOK, pubSubErr) {

        var options = {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            family: 4,
            path: null,
            password: config.REDIS_PASS
        };

        this.pub = redis.createClient(options);
        this.sub = redis.createClient(options);

        var resultOKCount = 0, resultErrCount = 0;
        function resultOK() {

            if (++resultOKCount != 2)
                return;

            resultOKCount = 0;
            pubSubOK();
        }

        function resultErr(err) {

            if (++resultErrCount != 2)
                return;

            resultErrCount = 0;
            pubSubErr(err);
        };

        this.pub.on('ready', resultOK);
        this.pub.on('error', resultErr);

        this.sub.on('ready', resultOK);
        this.sub.on('error', resultErr);
    }
}

////////////////////////////////////////////////////////////////////////
// Implementation of the real-time interaction support
//
module.exports = function (app, config, mongoose, gettext, io, auth) {

    var localPubSub = new LocalPubSub();

    app.locals.pub = localPubSub;
    app.locals.sub = localPubSub;

    var redisPubSub = new RedisPubSub(config, pubSubOK, pubSubErr);

    function pubSubOK() {

        app.locals.pub = redisPubSub.pub;
        app.locals.sub = redisPubSub.sub;
        localPubSub.subscriptions.forEach(s => redisPubSub.sub.subscribe(s));
        localPubSub.listeners('message').forEach(h => redisPubSub.sub.on('message', h));
    };

    function pubSubErr(err) {

        app.locals.pub = localPubSub;
        app.locals.sub = localPubSub;
    };
};
