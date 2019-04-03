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
 * The workspace server resource
 * NOTE: This is not used at all. Micke uses the 'dbService' instead
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('Workspace', ['$resource', function($resource) {

	return $resource('/api/workspaces/:wid', { wid: '@id' }, {

		share: { method: 'PUT' } // TODO: implement sharing support
	});
}]);

/**
 * The workspace loader pattern that can be used for multiple instantiations/requests
 * NOTE: This is not used at all. Micke uses the 'dbService' instead
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('WorkspacesLoader', ['Workspace', '$q', 'gettext', function(Workspace, $q, gettext) {
	return function() {

		var deferred = $q.defer();

		Workspace.query(
			function(workspaces) {
				deferred.resolve(workspaces);
			},
			function() {
				deferred.reject(gettext("Unable to retrieve workspaces"));
			});
		return deferred.promise;
	};
}]);
