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
 * Controller for the template creation component (which is also a rudimentary IDE)
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('WikiCtrl', ['$scope', '$timeout', '$http', 'gettext', 'confirm',
function ($scope, $timeout, $http, gettext, confirm) {

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //

    ////////////////////////////////////////////////////////////////////
    // Properties and main functionality
    //

	// Existing templates
	//
    $scope.currWikiId = null;
    $scope.wikis = null;

    $http.get('/api/wiki').then(function (resp) {
        $scope.wikis = resp.data;
    });

    $scope.openWiki = function (w) {
        $scope.currWikiEmbedUrl = "/api/wiki/" + encodeURIComponent(w.id) + "?embed=1";
    };

	$scope.selectWiki = function(w) {

		if (!w || ($scope.currTemplateId && $scope.currTemplateId === w.id)) {

            $scole.currWiki = null;
            $scope.currWikiId = null;
		}
		else {

            $scope.currWiki = w;
            $scope.currWikiId = w.id;

            $scope.setContributors(w);
		}
	};

	$scope.deleteWiki = function(t) {
		$scope.formDeleteWiki();
	};

    //******************************************************************

    $scope.selectedContributor = {};
    $scope.contributors = [];
    $scope.currConIndex = -1;

    $scope.getUsers = function (q) {

        return $http.get('/api/users?limit=20&q=' + encodeURIComponent(q)).then(function (resp) {
            return resp.data;
        });
    };

    $scope.setContributors = function (wiki) {

        $scope.selectedContributor = {};
        $scope.contributors = [];
        $scope.currConIndex = -1;

        if (wiki.id) {

            $http.get(scope.prefix + '/' + wiki.id + '/share').then(function (resp) {
                $scope.contributors = resp.data;
            });
        }
    };

    $scope.selectContributor = function (con, index) {

        if (scope.currConIndex == index)
            scope.currConIndex = -1;
        else
            scope.currConIndex = index;
    };

    $scope.deleteContributor = function (con, index) {

        confirm.show(gettext("Remove Contributor:") + " " + con.username,
            gettext("If you confirm the user will not be able to edit the object anymore."),
            gettext("Remove"), gettext("Do Not Remove")).then(function () {

                $http.delete(scope.prefix + '/' + holder.id + '/share').then(function (resp) {
                    scope.contributors.splice(index, 1);
                });
            });
    };

    $scope.addContributor = function (data) {

        for (var i = 0; i < scope.contributors.length; ++i) {

            if (scope.contributors[i].username == data.username) {

                scope.selectContributor(scope.contributors[i], i);
                return;
            }
        }

        $http.put(scope.prefix + '/' + holder.id + '/share', data).then(function () {
            scope.contributors.push(angular.copy(data));
        });
    };

	////////////////////////////////////////////////////////////////////
	// Functionality for the form buttons
	//
//	$scope.formDefaultAction = function() {

//		if ($scope.currTemplateId)
//			$scope.formUpdateTemplate();
//		else if ($scope.templateData.id)
//			$scope.formCreateTemplate();
//	};

//	$scope.formCreateTemplate = function() {

//		templateService.create($scope.filesToUpload, $scope.templateData)
//			.then(function(resp) {

//				//$scope.$close(gettext("Successfully created template"));
//				var t = resp.data;
//				$scope.templates.push(t);

//				$scope.onFilesCleared();
//				$scope.selectTemplate(t);
//			},
//			function(response) {
//				$scope.serverErrorMessage = response.data;
//			},
//			function(evt) {
//				//$scope.uploadPercentage = Math.floor((100 * evt.loaded) / evt.total);
//			});
//	};

//	$scope.formUpdateTemplate = function() {

//		if (!$scope.currTemplateId)
//			return;

//		var id = $scope.currTemplateId;

//		templateService.update(id, $scope.filesToUpload, $scope.templateData)
//			.then(function(response) {

//				mergeTemplate(response.data);
//				$scope.onFilesCleared();
////				$scope.selectTemplate(null);
//			},
//			function(response) {
//				$scope.serverErrorMessage = response.data;
//			},
//			function(evt) {
//				//$scope.uploadPercentage = Math.floor((100 * evt.loaded) / evt.total);
//			});
//	};

//	$scope.formDeleteTemplate = function(publish) {

//		if (!$scope.currTemplateId)
//			return;

//		confirm.show(gettext("Delete Template Confirmation"),
//			gettext("Are you sure you want to permanently delete the selected template and all its files?"),
//			gettext("Delete"), gettext("Do Not Delete")).then(function () {

//				var id = $scope.currTemplateId;
//				(!publish ? templateService.clearFiles(id) : templateService.publish(id))
//					.then(function () {

//						for (var i = 0; i < $scope.templates.length; ++i) {
//							if ($scope.templates[i].id === id) {
//								$scope.templates.splice(i, 1);
//								break;
//							}
//						}
//						$scope.selectTemplate(null);
//						$scope.filesUploaded.length = 0;
//					},
//					function (response) {
//						$scope.serverErrorMessage = response.data;
//					});
//			});
//	};

//	$scope.formCopyTemplate = function(defid) {

//		templateService.copy(defid)
//			.then(function(resp) {

//				var t = resp.data;
//				$scope.templates.push(t);
//				$scope.selectTemplate(t);

//				$scope.enableCopyTemplate = false;
//			},
//			function(response) {
//				$scope.serverErrorMessage = response.data;
//			});
//	};

}]);
