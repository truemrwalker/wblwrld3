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
module.exports = function(Q, app, config, mongoose, gettext, webServer) {
    
    var Machine = mongoose.model('Machine');

    ////////////////////////////////////////////////////////////////////
    // Atomically acquire and release the current machine
    //    
    function acquireMachine() {
        
        var name = os.hostname();

        return Q(Machine.findOneAndUpdate({ name: name }, { $set : { _locked: true } }, { upsert: true }).exec()).then(function (machine) {
            
            if (!machine || !machine.name) {
                
                // Obtain the previously created LOCKED document
                return (!machine ? Q(Machine.findOne({ name: name })) : Q(machine)).then(function (machine) {
                    
                    if (!machine) // It shouldn't happen - but just in case...
                        machine = new Machine();

                    machine.name = name;
                    machine.description = os.toString();
                    machine.addresses = util.transform_(getIPv4Addresses(), function (e) { return e.addr; });
                    machine.servers = [];
                    return machine;
                });
            }
            else if (!machine._locked)
                return machine;
            
            var retry = function () {
                
                return Q.delay(1000).then(function () {
                    
                    return Q(Machine.findOneAndUpdate({ name: name, _locked: false }, { $set : { _locked: true } })).then(function (machine) {
                        
                        if (machine)
                            return machine;
                        return retry();
                    });
                });
            };
            return retry();
        });
    }
    
    function releaseMachine(machine) {
        
        //machine.update({ $set : { _locked: false } }).exec();
        //return Q(null);
        
        machine._locked = false;
        return Q(machine.save());
    }

    ////////////////////////////////////////////////////////////////////
    // Update servers and services
    //
    acquireMachine(Machine).then(function (machine) {
        
        var services = [];

        services.push({
            name: 'HTTPS Server',
            address: 'localhost',
            port: config.SERVER_PORT_PUBLIC,
            context: 'https',
            description: gettext('HTTPS Server for REST calls: ' + config.SERVER_URL_PUBLIC),
        });
        
        services.push({
            name: 'HTTP Server',
            address: 'localhost',
            port: config.SERVER_PORT,
            context: 'http',
            description: gettext('HTTP Server for private use: ' + config.SERVER_URL),
        });

        var sock = zmq.socket('pub');
        var port = config.SERVER_PORT + 1;
        var endpoint = 'tcp://127.0.0.1:' + port;

        sock.bindSync(endpoint);
        console.log("**EXP** BOUND TO ENDPOINT:", endpoint);
        
        services.push({
            name: 'Control Server',
            address: 'localhost',
            port: port,            
            context: 'zmq',
            description: gettext('Control server for intra-server communication'),
        });

        machine.servers.push({
            name: 'Webble World App Server',
            services: services,
            context: 'app',
            description: gettext('REST API Server')
        });
        return releaseMachine(machine);

    }).fail(function (err) {
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
