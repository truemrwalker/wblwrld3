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
 * Profile Settings controller that drives the view-structure profile.html
 *
 * @author Giannis Georgalis
 */
ww3Controllers.controller('ProfileCtrl', [ '$scope', 'gettext', 'authService', 'userPrefs', 'confirm', 'wwConsts',
function ($scope, gettext, authService, userPrefs, confirm, wwConsts) {

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//

	/**
	 * @private
	 * Initializes the "providers" and "languages" of the controller
	 */
	function updateScopeData() {
		var i;

		// Update authentication providers
		//
		for (i = 0; i < $scope.providers.length; ++i) {
			$scope.providers[i].isConnected =
				$scope.user.auth_providers.indexOf($scope.providers[i].name) != -1;
		}

		// Set the currentlySelectedLanguageName
		//
		for (i = 0; i < $scope.allLanguages.length; ++i) {

			if ($scope.allLanguages[i].code === $scope.user.languages[0]) {

				$scope.currentlySelectedLanguageName = $scope.allLanguages[i].nativeName;
				break;
			}
		}
	}

	/**
	 * @private
	 * Normalizes the language descriptions obtained from Micke's service (for consistency)
	 */
	function getTheAvailableLanguagesFromMickesServiceAndNormalizeTheFieldNames() {

		var result = [];
		for (var i = 1; i < wwConsts.languages.length; ++i) {

			result.push({
				code: wwConsts.languages[i].code,
				nativeName: wwConsts.languages[i].NativeName,
				englishName: wwConsts.languages[i].EnglishName
			});
		}
		return result;
	}

	/**
	 * @private
	 * Removes the group definition with the given id
	 * - arr: the array that contains group definitions
	 * - id: the id of the group definition we want to remove
	 * @typedef {{arr: Array, id: String}}
	 */
	function removeGroup(arr, id) {

		for (var i = 0; i < arr.length; ++i) {

			if (arr[i].id == id) {

				arr.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * @private
	 * Displays an allert with an error message
	 * @typedef {{msg: String}}
	 */
	var showError = function(msg) {
		$scope.alerts.push( { type: 'danger', msg: msg });
	};

	/**
	 * @private
	 * Displays an allert with a success message
	 * @typedef {{msg: String}}
	 */
	var showSuccess = function(msg) {
		$scope.alerts.push( { type: 'success', msg: msg });
	};

	////////////////////////////////////////////////////////////////////
	// Scope Properties & Initialization
	//
    $scope.tabs = { notif: false, info: false, trust: false, auth: false };
	$scope.$setSelectedTab($scope.tabs, "info");

    $scope.providers = [
        { name: 'facebook', icon: 'facebook', isConnected: false },
        { name: 'twitter', icon: 'twitter', isConnected: false },
    ];

	$scope.allLanguages = getTheAvailableLanguagesFromMickesServiceAndNormalizeTheFieldNames();

	$scope.alerts = [];
    $scope.profileData = {};
	$scope.passwordData = {};

	$scope.user = authService.loggedInUser;

	if (!$scope.user)
		authService.onAuthRequired();
	else
		updateScopeData();

    // Profile/user info initializations and settings
    //
    $scope.datePickerOptions = {
        showWeeks: false,
        //minDate: new Date(1930, 1, 1),
        //maxDate: new Date(2010, 1, 1),
        initDate: $scope.user.date_born && new Date($scope.user.date_born)
    };

	// Groups and trusts
	//
	$scope.groups = null;
	$scope.trustGroups = [];

	userPrefs.getGroups().then(function(resp) {
		$scope.groups = resp.data;
	});
	userPrefs.getTrusts().then(function(resp) {
		$scope.trustGroups = resp.data;
	});

	////////////////////////////////////////////////////////////////////
	// Respond to external events
	//
	$scope.$on('auth:login', function(event, user) {
		$scope.user = user;
		updateScopeData();
	});
	$scope.$on('auth:cancelled', function(user) {
		$scope.$dismiss(gettext("User not logged in"));
	});
	$scope.$on('auth:logout', function() {
		$scope.user = null;
		$scope.$dismiss(gettext("User logged out"));
	});

	////////////////////////////////////////////////////////////////////
	// Public controller functions: Account Information & Authentication
	//

	/**
	 * Brings the tab with the given name into view
	 * @param {String} name the tab's name
	 */
    $scope.selectTab = function(name) {
	    $scope.$selectTab(name);
    };

	/**
	 * Removes the alerts
	 * @param {Number} index the current index of the alert to be removed
	 */
	$scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

	/**
	 * Submits all the modified account information values to the server (if any)
	 */
    $scope.submitAccountChanges = function(data) {

        authService.update(data).then(function(response) {
		        showSuccess(gettext("Updated Account Information"));
	        }, function error(response) {
                showError(response.data);
            }
        );
    };

	/**
	 * Dismisses the profile view
	 */
	$scope.cancelProfileChanges = function() {
		$scope.$dismiss(gettext("Operation cancelled"));
	};

	//******************************************************************

	/**
	 * Submits the user's response to a notification and removes it
	 * @param notif - The notification description object
	 * @param index - The position of the notification within its containing array
	 * @param {boolean} response - Whether the response is positive or negative
	 */
	$scope.handleNotification = function(notif, index, response) {

		userPrefs.handleNotification(notif, response).then(function () {

			userPrefs.deleteNotification(notif).then(function() {
				$scope.user.notif.pending.splice(index, 1);
			});
		}).catch(function(err) {
			showError(err.data);
		});
	};

	/**
	 * Queries the server for the groups that match the given query
	 * @param {String} q the string query
	 * @returns {*} a promise through which the results are sent
	 */
	$scope.getGroups = function(q) {

		return userPrefs.queryAvailableGroups(q).then(function(resp) {
			return resp.data;
		});
	};

	/**
	 * @param g the group definition object
	 */
	$scope.revokeGroupMembership = function(g) {

		confirm.show(gettext("Revoke Membership"),
			gettext("Are you sure you want to revoke your membership to the following group:") + " " + g.name,
			gettext("Revoke Membership"), gettext("Do Not Revoke Membership")).then(function () {

				userPrefs.revokeGroupMembership(g.id).then(function(resp) {
					removeGroup($scope.groups, g.id);
				});
			});
	};

	/**
	 * @param g the group definition object
	 */
	$scope.trustGroup = function(g) {

		return userPrefs.addToTrusts(g.id).then(function(resp) {
			$scope.trustGroups.push(g);
		});
	};

	/**
	 * @param g the group definition object
	 */
	$scope.untrustGroup = function(g) {

		return userPrefs.removeFromTrusts(g.id).then(function(resp) {
			removeGroup($scope.trustGroups, g.id);
		}/*, function(err) {
			console.log("ERRRROROR", err);
		}*/);
	};

	/**
	 * Associates the current account with an account of one of the supported providers
	 * @param provider enumeration, one of google, facebook, twitter
	 */
	$scope.associateAccount = function (provider) {

		authService.login(provider.name).then(
			function(response) {
				updateScopeData();
			},
			function error(response) {
				showError(response.data);
			},
			function() {
				// Notify...
			}
		);
	};

	//******************************************************************

}]);
