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
 * Server management service that controls and displays some aspects of the server's operation.
 * This functionality is exclusively available to administrators.
 *
 * @author Giannis Georgalis
 */
ww3Services.factory('server', ['$http', '$q', function($http, $q) {

	return {

		updateApplication: function () {
            return $http.get('http://dev.meme.hokudai.ac.jp/wws-deploy');
		},
		ping: function() {
			return $http.get('/api/info/availability');
		}
	};
}]);
