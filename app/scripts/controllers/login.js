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
 * Login controller that provides the login for the login and registration forms
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('LoginCtrl', [ '$scope', '$window', '$location', 'gettext', 'gettextCatalog', 'authOfferToRegisterByDefault', 'authService',
function ($scope, $window, $location, gettext, gettextCatalog, authOfferToRegisterByDefault, authService) {

	////////////////////////////////////////////////////////////////////
	// Properties
	//
	$scope.formData = {host: location.host};

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//

	/**
	 * @private
	 * Clears all the inputs and outputs of all the login and signup forms
	 */
	function clearForms() {

		$scope.loginData = {};
		$scope.registerData = {};
		$scope.resetPasswordData = {};

		$scope.busyMessage = null;
		$scope.serverErrorMessage = null;
		$scope.serverSuccessMessage = null;

		// These will be fixed and will work in angular 1.3.X TODO: update and verify they're working
		// follow issue: https://github.com/angular/angular.js/issues/5489
		//
//	    $scope.loginForm.$setPristine();
//	    $scope.registerForm.$setPristine();
//	    $scope.resetPasswordForm.$setPristine();
	}

	////////////////////////////////////////////////////////////////////
	// Scope Properties & Initialization
	//
	$scope.activateRegisterTab = authOfferToRegisterByDefault;

	if (authService.loggedInUser) // HUH?
		$scope.$dismiss(gettext("Already logged in"));

	clearForms();

	////////////////////////////////////////////////////////////////////
	// Public controller functions: Login, Register, Reset Password
	//

	/**
	 * Starts the login process with the given provider
	 * @param { enum } provider one of: 'local', 'twitter', 'facebook', 'google'
	 */
	$scope.formLogin = function(provider) {

        $scope.busyMessage = gettext("Waiting User to Authenticate...");

        authService.login(provider, $scope.loginData).then(
            function(response) {

                if ($location.search().ref) { // redirect to referrer

                    $window.location.href = $location.search().ref;
                }
                else {

                    clearForms();
                    $scope.$close(gettext("Logged in successfully"));
                }
            },
            function error(response) {

                $scope.busyMessage = null;
                $scope.serverErrorMessage = response.data;
                //$scope.loginForm.username.$setValidity('server', false);
            },
            function() {
                // Notify...
            }
        );
    };

	/**
	 * Starts the registration process with the register form's input data
	 */
    $scope.formRegister = function() {
        $scope.busyMessage = gettext("Checking Data for Signing Up...");

        authService.register($scope.registerData).then(
            function(response) {

                clearForms();
                $scope.$close(gettext("Signed up and logged in successfully"));
            },
            function error(response) {

                $scope.busyMessage = null;
                $scope.serverErrorMessage = response.data;
                //$scope.registerForm.username.$setValidity('server', false);
            },
            function() {
                // Notify...
            }
        );
    };

	/**
	 * Notifies that the authentication process is cancelled and dismisses the form
	 */
    $scope.formCancel = function() {

        authService.onAuthCancelled();
        $scope.$dismiss(gettext("Operation cancelled"));
    };

	/**
	 * Starts the reset password process for the user with the given email
	 */
	$scope.formResetPassword = function() {

        var subject = gettext("Reset Account Password Request");
        var text = gettext("Follow the link to login and change your password:");

        // Translate the strings on client side and give them to the server (which has no translation capabilities)
        $scope.resetPasswordData.subject = gettextCatalog.getString(subject);
        $scope.resetPasswordData.text = gettextCatalog.getString(text);

        $scope.busyMessage = gettext("Trying to recover password and send email...");

        authService.resetPassword($scope.resetPasswordData).then(
            function(response) {
	            clearForms();

                $scope.serverSuccessMessage = response.data;
            },
            function error(response) {

                $scope.busyMessage = null;
                $scope.serverErrorMessage = response.data;
            },
            function() {
                // Notify...
            }
        );
    };

	//******************************************************************

}]);
