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
 * Controller for the real-time chat component
 * 
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('ChatCtrl', ['$scope', '$timeout', 'gettext', 'authService', 'socket', '$rootScope',
function ($scope, $timeout, gettext, authService, socket, $rootScope) {

	////////////////////////////////////////////////////////////////////
	// Scope variables
	//
	//$scope.user = authService.loggedInUser; // Let it inherit the user from the parent scope

	$scope.chatDisabled = true;
	$scope.chatVisible = false;

	$scope.messages = [];


	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function scrollToEnd() {

		$timeout(function() {

			var elem = document.getElementById('chat-area');
			if (elem)
				elem.scrollTop = elem.scrollHeight;
		}, 100);
	}

    function getAvatarUrl() {

		return $scope.user && $scope.user.image_urls.length ?
			$scope.user.image_urls[0] : 'images/generic_avatar.png';
	}

    function getUserName() {

        if (!$scope.user)
            return gettext("Anonymous Coward");

        return $scope.user.username || $scope.user.name.first;
    }

    function processReceivedMessage(msg) {

        if ($scope.user && $scope.user.username === msg.from) {
            msg.from = gettext("me");
            msg.me = true;
        }
        return msg;
    }

	////////////////////////////////////////////////////////////////////
	// functions
	//
	$scope.sendMessage = function() {

		var text = $scope.currentTextMessage.trim();
		$scope.currentTextMessage = null;

		if (text.length != 0) {

			socket.emit('chat:message', {

                text: text,
                from: getUserName(),
				img: getAvatarUrl()
			});

			//$scope.messages.push({
			//	text: text, from: gettext("me"), img: getAvatarUrl(), date: Date.now(), me: true
			//});
			scrollToEnd();
		}
	};

	////////////////////////////////////////////////////////////////////
	// Reaction to events...
	//
	socket.on('chat:message', function (msg) {

        $scope.messages.push(processReceivedMessage(msg));
		scrollToEnd();
	});

	$scope.$watch('chatDisabled', function(newValue, oldValue) {

		if (newValue !== oldValue) {

			console.log("Changing chat ENABLED status from:", !oldValue, "to", !newValue);
			socket.emit(newValue ? 'chat:ended' : 'chat:started');
		}
	});

	// Micke probably added this...
    $scope.$on("showChat", function(){
        $scope.chatDisabled = false;
        $scope.chatVisible = true;
    });
}]);

