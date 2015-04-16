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
 * Two visualization directives and their helper services
 * VERY EXPERIMENTAL -- DO NOT USE
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */

////////////////////////////////////////////////////////////////////////
// Initialize google Apis
//
ww3Services.factory('googleChartApiLoader', ['$rootScope', '$q', '$window', '$document',
function ($rootScope, $q, $window, $document) {

	var deferred = $q.defer();

	var script = $document[0].createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = "https://www.google.com/jsapi";

	script.addEventListener('load', function() {

		$window.google.load('visualization', '1', {
			packages: ['orgchart'],
			callback: function () {
				$rootScope.$apply(function () { deferred.resolve($window.google); });
			}
		});

	}, false);

	var head = $document[0].getElementsByTagName('head')[0];
	head.appendChild(script);

	return deferred.promise;
}]);

////////////////////////////////////////////////////////////////////////
// Organization Chart directive
//
ww3Directives.directive("orgchart", ['googleChartApiLoader', function(googleChartApiLoader) {
	return {
		restrict: 'E',
		scope: {
			chartData: '=',
			select: "&onSelect"
		},

		link: function(scope, element, attrs) {
			googleChartApiLoader.then(function(google) {

				var chart = new google.visualization.OrgChart(element[0]);

				google.visualization.events.addListener(chart, 'select', function() {

					var sel = chart.getSelection();

					// Alternatively: data.getValue(sel[0].row || 0, sel[0].column || 0);
					// +1 at row because the chartData also embed the table header
					var value = sel.length != 1 ? null : scope.chartData[sel[0].row + 1 || 0][0].v;

					scope.$apply(function() {
						scope.select({selectedItem: value});
					});
				});

				scope.$watch('chartData', function(newValue, oldValue) {

					if (newValue) {

						var data = google.visualization.arrayToDataTable(newValue);
						chart.draw(data, { allowHtml: true, nodeClass: 'group', selectedNodeClass: 'group-selected' });
					}
				}, true); // true is for deep object equality checking

				// element.on('$destroy', ...) or scope.$on('$destroy', ...)
			});
		}
	};

}]);

////////////////////////////////////////////////////////////////////////
// D3 visualizations
//
ww3Services.factory('d3ApiLoader', ['$rootScope', '$q', '$window', '$document',
function ($rootScope, $q, $window, $document) {

	var deferred = $q.defer();

	var script = $document[0].createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/3.4.5/d3.min.js";
	script.onload = function() {
		$rootScope.$apply(function () { deferred.resolve($window.d3); });
	};

	var head = $document[0].getElementsByTagName('head')[0];
	head.appendChild(script);

	return deferred.promise;
}]);

////////////////////////////////////////////////////////////////////////
// Bubble Chart directive
//
ww3Directives.directive("forceChart", ['d3ApiLoader', function(d3ApiLoader) {
	return {
		restrict: 'E',
		scope: {
			chartData: '=',
			select: "&onSelect"
		},

		link: function (scope, element, attrs) {
			d3ApiLoader.then(function(d3) {

				var width = 1280, height = 1280;
				console.log("WIDTH, HEIGHT", width, height);

				//
				var color = d3.scale.linear()
					.domain([0, 15, 30, 45, 60, 75, 90, 95, 100])
					.range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]);

				console.log("SANITY TEST:", color(0), color(50), color(100), "==?", "fff7ec #fc8d59 7f0000");

				//
				//var color = d3.scale.category20();

				var force = d3.layout.force()
					.charge(-1200)
					.linkDistance(200)
					.size([width, height]);

				var svg = d3.select(element[0]).append("svg")
					.attr("width", '100%')
					.attr("height", '100%')
					.attr("viewBox", '0 0 ' + width + ' ' + height)
					.attr("preserveAspectRatio", "xMidYMid meet");

				scope.$watch('chartData', function(newValue, oldValue) {

					svg.selectAll('*').remove();

					if (!newValue)
						return;

					var graph = newValue;

					force
						.nodes(graph.nodes)
						.links(graph.links)
						.start();

					var link = svg.selectAll(".link")
						.data(graph.links)
						.enter().append("line")
						.attr("stroke", '#999')
						.attr("stroke-opacity", '.6')
						.style("stroke-width", function(d) { return Math.sqrt(d.value); });

					var node = svg.selectAll(".node")
						.data(graph.nodes)
						.enter().append("path")
						.attr("d", d3.svg.symbol()
							.type(function(d) { return d3.svg.symbolTypes[d.shape]})
							.size(function(d) { return 100 + (d.value || 0) * 100; }))
						.attr("stroke", '#fff')
						.attr("stroke-width", '1.5px')
						.style("fill", function(d) { return color(d.group); })
						.on('dblclick', function (d, i) {

							scope.$apply(function() {
								scope.select({selectedItem: d, index: i});
							});
						})
						.call(force.drag);

					node.append("title")
						.text(function(d) { return d.name; });

					force.on("tick", function() {
						link.attr("x1", function(d) { return d.source.x; })
							.attr("y1", function(d) { return d.source.y; })
							.attr("x2", function(d) { return d.target.x; })
							.attr("y2", function(d) { return d.target.y; });

						node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

/*
						node.attr("cx", function(d) { return d.x; })
							.attr("cy", function(d) { return d.y; });
*/
					});
				});
			});
		}
	}
}]);
