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
 * Scrolls the containing element to bring the target element to the top of the page
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Directives.directive('keepOnTop', [ '$window', '$timeout', function($window, $timeout){
	return {
		restrict: 'A',
		link: function(scope, element, attrs, ctrls){

			var timer = null;

			scope.$watch(function(){

				if (timer == null) {

					timer = $timeout(function() {

						$window.scrollTo(0, element[0].offsetTop - 10);

						timer = null;
					}, 100, false); // Do not call apply, it will cause infinite watch loop
				}
			});

			scope.$on('$destroy', function() {

				if (timer != null)
					$timeout.cancel(timer);

				timer = null;
			});
		}
	};
}]);
