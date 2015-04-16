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
 * The users server resource
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('Users', ['$resource', function($resource) {

	return $resource('/api/users/:uid', { uid: '@id' });
}]);

/**
 * The user accounts server resource
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('UserAccounts', ['$resource', function($resource) {

	return $resource('/api/adm/users/:uid', { uid: '@id' });
}]);

/**
 * The active sessions server resource
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('ActiveSessions', ['$resource', function($resource) {

  return $resource('/api/adm/sessions/:sid', { sessionID: '@sid' });
}]);

/**
 * userPrefs service that controls many aspects of the functionality of the user's account.
 * Essentially, this service drives the persistent functionality behind the Profile Settings UI
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('userPrefs', ['$http', '$q', function($http, $q) {

	return {

		queryAvailableGroups: function(q) {
			return $http.get('/api/groups?limit=20&q=' + encodeURIComponent(q));
		},
		queryAvailableUsers: function(userNamePrefix) {
			return $http.get('/api/users?limit=20&q=' + encodeURIComponent(userNamePrefix));
		},
		queryAvailableWebbles: function(q) {
			return $http.get('/api/webbles?limit=20&q=' + encodeURIComponent(q));
		},

		getGroups: function() {
			return $http.get('/api/users/groups');
		},
		revokeGroupMembership: function(gId) {
			return $http.put('/api/users/groups', { group: gId, remove: true });
		},

		handleNotification: function(notif, response) {

			if (notif.op && notif.url) {

				if (!notif.payload.response)
					notif.payload.response = response;

				return $http[notif.op](notif.url, notif.payload);
			}
			else
				return $q.when(notif);
		},
		deleteNotification: function(notif) {
			return $http.delete('/api/users/tasks/' + notif.id);
		},

		getTrusts: function() {
			return $http.get('/api/users/trusts');
		},
		addToTrusts: function(gId) {
			return $http.put('/api/users/trusts', { group: gId });
		},
		removeFromTrusts: function(gId) {
			return $http.put('/api/users/trusts', { group: gId, remove: true });
		},
		clearTrusts: function() {
			return $http.delete('/api/users/trusts');
		}
	};
}]);
