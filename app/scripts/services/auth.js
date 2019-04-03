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
 * Implements lazy injection of the authentication service for use in angular
 * interceptors. Otherwise the service wouldn't be able to be loaded directly
 * since that would throw circular dependency errors in angular's core
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('authServiceDelayed', ['$injector', function($injector) {

	var authService;
	return {
		get: function() { return authService || (authService = $injector.get('authService')); }
	};
}]);

/**
 * Authentication and user information service.
 * Based (loosely) on http://espeo.pl/authentication-in-angularjs-application/
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('authService', ['$q', '$rootScope', '$http', '$window', '$timeout', 'socket',
function($q, $rootScope, $http, $window, $timeout, socket) {

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
    function doAuthSuccessful(self, user) {

        self.loggedInUser = user;
        authHttpBuffer.retryAll(function(config) { return config; });
	    $rootScope.$broadcast('auth:login', user);
    }
    function doAuthCancelled(self) {

	    self.loggedInUser = null;
        authHttpBuffer.rejectAll("Authentication Cancelled");
        $rootScope.$broadcast('auth:cancelled');
    }
	function doAuthLoggedOut(self) {

		self.loggedInUser = null;
		$rootScope.$broadcast('auth:logout');
	}
	function doAuthRequired(self, config, deferred) {

		if (!self.loggedInUser) {

			authHttpBuffer.append(config, deferred);
			$rootScope.$broadcast('auth:required', config, deferred);
		}
	}

	////////////////////////////////////////////////////////////////////
	// Respond to auth:* real time events
	//
	socket.on('auth:login', function() {

		if (!authServiceObject.loggedInUser)
			authServiceObject.tryLoginIfSessionActive();
	});
	socket.on('auth:logout', function() {

		if (authServiceObject.loggedInUser)
			doAuthLoggedOut(authServiceObject);
	});
	socket.on('auth:user', function() {

		if (authServiceObject.loggedInUser)
			authServiceObject.tryLoginIfSessionActive();
	});

	////////////////////////////////////////////////////////////////////
	// authHttpBuffer object
	//
	var buffer = [];

	var authHttpBuffer = {

		// Appends HTTP request configuration object with deferred response attached to buffer
		append: function(config, deferred) {
			buffer.push({config: config, deferred: deferred});
		},

		// Abandon or reject (if reason provided) all the buffered requests
		rejectAll: function(reason) {

			if (reason) {
				for (var i = 0; i < buffer.length; ++i)
					buffer[i].deferred.reject(reason);
			}
			buffer = [];
		},

		// Retries all the buffered requests clears the buffer
		retryAll: function(updater) {

			function retryHttpRequest(config, deferred) {

				if (config) {
					$http(config).then(function(response) { deferred.resolve(response); },
						function (response) { deferred.reject(response); });
				}
			}
			for (var i = 0; i < buffer.length; ++i)
				retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
			buffer = [];
		}
	};

	////////////////////////////////////////////////////////////////////
	// Actual auth service object
	//
    var authServiceObject = {

        // All methods return a promise

        register: function(registerData) {
            var self = this;

            return $http.post('/auth/register', registerData)
                .success(function(data, status, headers, config) {
                    doAuthSuccessful(self, data);
                });
        },

        update: function(profileData) {
	        return this.register(profileData);
        },

        resetPassword: function(resetPasswordData) {
            return $http.post('/auth/reset', resetPasswordData);
        },

        //**************************************************************

        login: function(provider, loginData) {
            var self = this;

            if (provider == 'local') {
                return $http.post('/auth/local', loginData)
                    .success(function(data, status, headers, config) {
                        doAuthSuccessful(self, data);
                    });
            }
            else {

                // Open a separate window for authentication - we don't want to mess with client's state
                //
                var myWin = $window.open(
                    '/auth/' + provider,
                    "Authenticate with: " + provider,
                    'location=0,status=0,menubar=0,titlebar=1,toolbar=0,dependent=1,width=800,height=800'
                );
                myWin.focus();

                // Poll the window to check if authentication finished
                //
                var deferred = $q.defer();

                var monitorAuth = $window.setInterval(function() {

                    if (myWin.closed) {

                        $window.clearInterval(monitorAuth);

                        $http.get('/auth/user')
                            .success(function(data) {
                                doAuthSuccessful(self, data);
                                deferred.resolve(data);
                            })
                            .error(function(data) {
                                deferred.reject(data);
                            });
                    }
                    else {
                        deferred.notify();
//                      alert(myWin.document.readyState);
//                      while (myWin.document.readyState != 'complete') {}
//                      myWin.close();
                    }
                }, 1000);

                return deferred.promise;
            }
        },
        logout: function() {
            var self = this;

            return $http.post('/auth/logout')
                .success(function() {
		            doAuthLoggedOut(self);
                });
        },

        //**************************************************************

	    onAuthCancelled: function() {

		    var self = this;
		    return $timeout(function() { doAuthCancelled(self); });
	    },
	    onAuthRequired: function(response) {

		    var self = this;

		    var deferred = $q.defer();
			doAuthRequired(self, response && response.config, deferred);
		    return deferred.promise;
	    },
	    onAuthForbidden: function(response) {

		    //console.log(JSON.stringify(response));

		    return $q.reject(response);
/*
		    return confirm.show(gettext("Forbidden"), gettext("This operation is not allowed."),
			    gettext("I will not do that again")).finally(function () {
				    return $q.reject(response);
			    });
*/
	    },

        //**************************************************************

	    tryLoginIfSessionActive: function() {

            var self = this;

            return $http.get('/auth/user')
                .success(function(data) {
                    doAuthSuccessful(self, data);
                });
        },

	    //**************************************************************

	    loggedInUser: null
    };

	return authServiceObject;
}]);

/**
 * Convenience constant/service to use as a default action in user interfaces
 *
 * @author Giannis Georgalis
 */
ww3Services.constant('authOfferToRegisterByDefault', false);
