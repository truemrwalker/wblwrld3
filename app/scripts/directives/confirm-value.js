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
 * Assures that a specific value is equal to another one
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
angular.module('wblwrld3App').directive('confirmValue', function () {
	return {
		restrict: 'A',
		require: "ngModel",
		scope: {
			myValue: '=ngModel',
			confirmValue: '='
		},
		link: function(scope, element, attrs, ctrl) {

			// Watch this directive's model
			//
			scope.$watch('myValue', function(val) {
				ctrl.$setValidity('confirmValue', val === scope.confirmValue);
			});

			// Watch the other model set with the confirm-value attribute
			//
			scope.$watch('confirmValue', function(val) {
				ctrl.$setValidity('confirmValue', val === scope.myValue);
			});
		}
	};
});
