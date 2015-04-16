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
ww3Directives.directive('movable', ['$document', function($document) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			var rect = element[0].getBoundingClientRect();
			var startX = 0, startY = 0, x = rect.left, y = rect.top;

			element.on('mousedown', function(event) {

				event.preventDefault();
				startX = event.pageX - x;
				startY = event.pageY - y;

				$document.bind('mousemove', mousemove);
				$document.bind('mouseup', mouseup);
			});

			function mousemove(event) {

				x = event.pageX - startX;
				y = event.pageY - startY;

				element.css({ top: y + 'px', left:  x + 'px' });
			}

			function mouseup() {
				$document.unbind('mousemove', mousemove);
				$document.unbind('mouseup', mouseup);
			}
		}
	}
}]);
