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
 * Controller for the app & server's administration interface.
 * This interface is available only to administrators.
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('AdmCtrl', [ '$scope', '$interval', 'gettext', 'confirm', 'server', 'UserAccounts', 'ActiveSessions',
function ($scope, $interval, gettext, confirm, server, UserAccounts, ActiveSessions) {

	$scope.restartServer = function () {

		confirm.show(gettext("Restart Server Warning"),
			gettext("This operation will restart the Webble world and run all the diagnostic and maintenance scripts. During that time terrible things may happen and the server may not recover. Are you sure you want to restart the server anyway?"),
			gettext("Restart"), gettext("Do NOT restart")).then(function () {

				$scope.updating = true;
				server.restartServer().then(function (resp) {

					var intervalPromise  = $interval(function() {

						server.ping().then(function() {

							$interval.cancel(intervalPromise);
							$scope.updateOutput = "OK";
							$scope.updating = false;
						});

					}, 2000, 40);
				});
			});
	};

	$scope.updateApp = function () {

		confirm.show(gettext("Update Application Warning"),
			gettext("This operation will pull the latest version of Webble World from the remote repository at github. However, it will not restart the server. during the update, users may be affected by getting served inconsistent versions of application components. Are you sure you want to proceed with the update?"),
			gettext("Update"), gettext("Do not update")).then(function () {

				$scope.updating = true;
				server.updateApplication().then(function (resp) {

					$scope.updateOutput = resp.data;
					$scope.updating = false;
				});
			});
	};

	$scope.allUsers = UserAccounts.query();
	$scope.allSessions = ActiveSessions.query();
}]);
