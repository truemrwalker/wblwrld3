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
 * Management of third-party licenses
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('licenseService', ['$q', '$http', 'gettext', function($q, $http, gettext) {

	// Utility functions
	//
	function toUrl(groupId) {
		return groupId ? '/api/licenses/group/' + groupId : '/api/licenses/user';
	}
	function unwrap(promise) {
		return promise.then(function(resp) { return resp.data; }, function(err) { return $q.reject(err.data); });
	}

	return {

		query: function(groupId) {
			return unwrap($http.get(toUrl(groupId)));
		},
		add: function(data, groupId) {
			return unwrap($http.put(toUrl(groupId), data));
		},
		del: function(data, groupId) {

			if (!data.remove)
				data.remove = true;
			return unwrap($http.put(toUrl(groupId), data));
		},
		get: function(realm, resource) {

			return unwrap($http.get('/api/licenses/key?realm=' + encodeURIComponent(realm) + '&resource=' + encodeURIComponent(resource)))
				.then(function(result) {
					try {
						return angular.fromJson(result); // Try to parse as json
					} catch (err) {
						return result;
					}
				});
		}
	};
}]);
