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
 * Enables an element to move (be dragged) freely inside its containing page
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Directives.directive('closeable', ['$window', '$document', function($window, $document) {
	return {
		restrict: 'C',
		link: function(scope, element, attrs) {

			// Close element
			//
			var closeElement = angular.element('<div class="navigate-elem"><span class="fa fa-2x fa-times-circle"></span></div>');
			closeElement.addClass('show');

			closeElement.bind('click', function() {

				scope.$apply(function() {
					scope.$dismiss();
				});
			});

			// Scroll element
			//
			var scrollElement = angular.element('<div class="navigate-elem"><span class="fa fa-2x fa-arrow-circle-up"></span></div>');
			scrollElement.css('right', '70px');

			scrollElement.bind('click', function() {

				scope.$apply(function() {
					$window.scrollTo(0, element[0].offsetTop - 100);
				});
			});
			element.append(closeElement).append(scrollElement);

			// Control the appearance-disappearance of the navigational elements
			//
			$document.on('scroll', function() {

				if ($window.pageYOffset > 200)
					scrollElement.addClass('show');
				else
					scrollElement.removeClass('show');
			});

/*
			//var foo = element.find('h1');
			var foo = angular.element(document).find('h1');

			console.log("LALALALAL", foo);

			 var closeElement = angular.element('<button class="navigate-wrapper btn btn-sm btn-danger pull-right"><span class="fa fa-times"></span> <span translate>Close</span></button>');
			 closeElement.bind('click', function() {

			 scope.$apply(function() {
				 scope.$dismiss();
				 });
			 });

			angular.forEach(foo, function(rawElement) {
				angular.element(rawElement).wrap('<div></div>').parent().prepend(closeElement); //.copy()
			});
*/
		}
	}
}]);
