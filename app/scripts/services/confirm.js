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
 * A convience service for enabling components to request verification from the user
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Services.factory('confirm', ['$rootScope', '$modal', 'gettext', function($rootScope, $modal, gettext) {
	return {

		show: function(title, message, confirmText, cancelText) {

			var modalInstance = $modal.open({
				template: '<div class="modal-header" style="background-color:#333333;"><h3 style="color:#ffffff;" class="modal-title"><span class="fa fa-check-square-o"></span> {{title}}</h3></div>' +
					'<div class="modal-body"><p style="padding:25px;">{{message}}</p></div>' +
					'<div class="modal-footer"><button class="btn btn-primary" ng-click="$dismiss()">{{cancelText}}</button>' +
					'<button class="btn btn-default" ng-click="$close()">{{confirmText}}</button></div>',
				controller: ['$scope', function($scope) {
					$scope.title = title;
					$scope.message = message;
					$scope.confirmText = confirmText;
					$scope.cancelText = cancelText;
				}],
				backdrop: 'static',
				keyboard: true
				/*,
				size: 'lg' */
			});
			return modalInstance.result;
		}
	};
}]);
