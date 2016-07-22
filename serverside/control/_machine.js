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
// machine.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var os = require('os');
var zmq = require('zmq');

var util = require('../lib/util')

////////////////////////////////////////////////////////////////////////
// Obtain all IPv4 addresses of the localhost, ref:
// http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
//
function getIPv4Addresses() {

    var ifaces = os.networkInterfaces();
    var result = [];

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {

            if ('IPv4' !== iface.family || iface.internal !== false)
                return; // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                result.push({ iface: ifname + alias, addr: iface.address });
            } else {
                // this interface has only one ipv4 adress
                result.push({ iface: ifname, addr: iface.address });
            }
            ++alias;
        });
    });
    return result;
}

////////////////////////////////////////////////////////////////////////
// 
//
module.exports = function(app, config, mongoose, gettext, webServer) {
    
    var Machine = mongoose.model('Machine');

    ////////////////////////////////////////////////////////////////////
    // Atomically acquire and release the current machine
    //
    function acquireMachine() {
        
        var name = os.hostname();

        return Machine.findOneAndUpdate({ name: name }, { $set : { _locked: true } }, { upsert: true }).exec().then(function (machine) {
            
            if (!machine) {
                
                // Obtain the previously created (with upsert) LOCKED document
                return Machine.findOne({ name: name }).exec().then(function (machine) {

                    console.assert(machine, "Shouldn't happen since upsert=true in query");

                    machine.name = name;
                    machine.description = os.toString();
                    machine.addresses = util.transform_(getIPv4Addresses(), function (e) { return e.addr; });
                    machine.servers = [];
                    return machine;
                });
            }
            else if (!machine._locked)
                return machine;
            
            var retryCount = 0, prevMachine = machine;
            var retry = function () {
                
                return Promise.delay(1000).then(function () {
                    
                    if (++retryCount == 5)
                        return prevMachine; // Hostile takeover of the machine lock

                    return Machine.findOneAndUpdate({ name: name, _locked: false }, { $set : { _locked: true } }).exec().then(function (machine) {                        
                        return machine || retry();
                    });
                });
            };
            return retry();
        });
    }
    
    function releaseMachine(machine) {
        
        //machine.update({ $set : { _locked: false } }).exec();
        //return Promise.resolve(null);
        
        machine._locked = false;
        machine.markModified('_locked');

        return Promise.resolve(machine.save());
    }

    ////////////////////////////////////////////////////////////////////
    // Update servers and services
    //
    acquireMachine(Machine).then(function (machine) {
        
        var services = [];

        services.push({
            name: 'HTTP Server',
            address: 'localhost',
            port: config.SERVER_PORT,
            uri: config.SERVER_URL,
            context: 'web',
            description: gettext("HTTP Server for REST API"),
        });

        var sock = zmq.socket('pub');
        var port = config.SERVER_PORT + 1;
        var ctrlEndpoint = 'tcp://127.0.0.1:' + port;
        //var ctrlEndpoint = 'tcp://' + config.SERVER_NAME + ':' + port;

        sock.bindSync(ctrlEndpoint);

        services.push({
            name: 'Control Server',
            address: 'localhost',
            port: port,
            uri: ctrlEndpoint,
            context: 'zmq',
            description: gettext("Control server for intra-server communication"),
        });
        console.log("[OK] Server control endpoint:", ctrlEndpoint);
        
        var index = util.indexOf(machine.procs, function (p) {
            return p.services.length == 2 && p.services[0].uri == config.SERVER_URL && p.services[1].uri == ctrlEndpoint;
        });

        if (index != -1)
            machine.procs[index].remove();

        machine.procs.push({
            name: 'Webble World App Server',
            services: services,
            context: 'app',
            description: gettext('REST API Server')
        });

        return releaseMachine(machine);

    }).catch(function (err) {
        console.error("Error:", err);
    }).done();

    ////////////////////////////////////////////////////////////////////
    // Return control object
    //
    return {
        'broadcast': function () { },
        'request': function () { },
        'notify': function () { }
    };
};
