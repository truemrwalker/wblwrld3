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
 * Controller for the webble visualization component
 *
 * @author Giannis Georgalis
 */
ww3Controllers.controller('DataCtrl', [ '$scope', '$http', 'gettext', function ($scope, $http, gettext) {

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function dateWeight(from, to) {

		var nmonths = to.getMonth() - from.getMonth() + 12 * (to.getFullYear() - from.getFullYear());
		var ndays = to.getDate() - from.getDate() + 30 * nmonths;
		return ndays > 500 ? 0 : (500 - ndays) / 500;
	}
	function wsToGraph(ws) {

		var g = {nodes: [], links: []};
		var authorIndex = {};

		ws.forEach(function(w) {

			var authorNode;
			if (!authorIndex.hasOwnProperty(w.webble.author)) {

				authorNode = {
					index: g.nodes.length,

					name: w.webble.author,
					group: 100,
					value: 0.1,
					shape: 0
				};
				g.nodes.push(authorNode);
				authorIndex[w.webble.author] = authorNode;
			}
			else {

				authorNode = authorIndex[w.webble.author];
				authorNode.value += 0.1;
			}

			g.links.push({
				source: authorNode.index,
				target: g.nodes.length,
				value: 0.1 + dateWeight(new Date(w.updated), new Date()) * 20
			});
			g.nodes.push({
				webble: w,
				index: g.nodes.length,

				name: w.webble.displayname,
				group: dateWeight(new Date(w.created), new Date(w.updated)) * 100,
				value: w.rating,
				shape: w.is_trusted ? 2 : 4
			});
		});
		return g;
	}

	////////////////////////////////////////////////////////////////////
	// Scope methods
	//
	$scope.showInfo = function(selectedItem, index) {

		var w = selectedItem.webble;

		if (w)
			$scope.w = ($scope.w && w.webble.defid === $scope.w.webble.defid) ? null : w;
	};
	$scope.closeInfo = function() {
		$scope.w = null;
	};

	////////////////////////////////////////////////////////////////////
	// Initialization stuff
	//
	$scope.graph = null;

	$http.get('/api/webbles?limit=1821&verify=1').then(function(resp) {

		$scope.graph = wsToGraph(resp.data);
	});
}]);
