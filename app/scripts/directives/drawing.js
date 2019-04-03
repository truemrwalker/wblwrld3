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
 * Implements the interaction logic of the chaotic draw component
 *
 * @author Giannis Georgalis
 */
ww3Directives.directive("drawing", [ 'socket', function(socket){
	return {

		restrict: "A",
		link: function(scope, element, attrs){

			// Respond to mouse events
			//
			var drawing = false;
			var lastX;
			var lastY;

			element.bind('mousedown', function(event){

				lastX = (event.offsetX || event.clientX - $(event.target).offset().left);
				lastY = (event.offsetY || event.clientY - $(event.target).offset().top);
				drawing = true;
			});
			element.bind('mousemove', function(event){

				if (drawing){

					var currentX = (event.offsetX || event.clientX - $(event.target).offset().left);
					var currentY = (event.offsetY || event.clientY - $(event.target).offset().top);

					var data = { lastX: lastX, lastY: lastY, currentX: currentX, currentY: currentY };
					onDraw(data, data);

					lastX = currentX;
					lastY = currentY;
				}
			});
			element.bind('mouseup', function(event){
				drawing = false;
			});

			// Operations on ctx as the result of events
			//
			var ctx = element[0].getContext('2d');

			function onInfo(here, there) {

			}
			function onDraw(here, there) {

				if (here) {

					ctx.moveTo(here.lastX, here.lastY);
					ctx.lineTo(here.currentX, here.currentY);
					ctx.strokeStyle = "#00f";
                    ctx.lineWidth = 6;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
					ctx.stroke();
				}
				if (there) {

					there.id = myId;
					socket.emit('interaction:move', there);
				}
			}
			function onSave(here, there) {

			}
			function onComm(here, there) {

			}

			// Start/stop listening for network events
			//
			var myId = 'drawingApp';

			attrs.$observe('id', function(value) {

				myId = value;

				socket.emit('interaction:started', myId);

				socket.addListener('interaction:info', onInfo);
				socket.addListener('interaction:move', onDraw);
				socket.addListener('interaction:save', onSave);
				socket.addListener('interaction:comm', onComm);
			});

			//scope.$on('$destroy', function() {
			element.on('$destroy', function() {

				socket.emit('interaction:ended', myId);

				socket.removeListener('interaction:info', onInfo);
				socket.removeListener('interaction:move', onDraw);
				socket.removeListener('interaction:save', onSave);
				socket.removeListener('interaction:comm', onComm);
			});
		}
	};
}]);
