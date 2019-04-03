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
 * Within a form, provides the controls necessary for viewing and managing license keys
 *
 * @author Giannis Georgalis
 */
ww3Directives.directive('shareObjectEditor', [ '$timeout', '$http', 'gettext', 'confirm',
function($timeout, $http, gettext, confirm){
	return {

		//require: '^form', // We look for it on a parent, since it will be defined somewhere higher on the DOM
		restrict: 'E',
		scope: {
            shareObject: '=shareObject',
            shareObjectType: '@shareObjectType'
		},
		templateUrl: 'views/editors/share-object-editor.html',
		link: function(scope, element, attrs, ctrl){

            scope.contributors = [];
            scope.selectedContributor = null;
            scope.selectedContributorIndex = -1;

            function shareObjectUrl() {
                return '/api/' + scope.shareObjectType + '/' + scope.shareObject.id + '/share';
            }

            scope.$watch('shareObject', function() {

                scope.contributors = [];
                scope.selectedContributor = null;
                scope.selectedContributorIndex = -1;

                if (scope.shareObject && scope.shareObject.id) {

                    $http.get(shareObjectUrl()).then(function (resp) {
                        scope.contributors = resp.data;
                    });
                }
			});

            scope.getUsers = function (q) {

                return $http.get('/api/users?limit=20&q=' + encodeURIComponent(q)).then(function (resp) {
                    return resp.data;
                });
            };

            scope.selectContributor = function (con, index) {

                if (scope.selectedContributorIndex == index) {

                    scope.selectedContributor = null;
                    scope.selectedContributorIndex = -1;
                }
                else {

                    scope.selectedContributor = scope.contributors[index];
                    scope.selectedContributorIndex = index;
                }
            };

            scope.deleteContributor = function (con, index) {

                confirm.show(gettext("Remove Contributor:") + " " + con.username,
                    gettext("If you confirm the user will not be able to edit this item anymore."),
                    gettext("Remove"), gettext("Do Not Remove")).then(function () {

                        $http.put(shareObjectUrl() + '?delete=1', { users: [con.username] }).then(function (resp) {
                            scope.contributors.splice(index, 1);
                        });
                    });
            };

            scope.addContributor = function (con) {

                for (var i = 0; i < scope.contributors.length; ++i) {

                    if (scope.contributors[i].username == con.username) {

                        scope.selectContributor(scope.contributors[i], i);
                        return;
                    }
                }
                $http.put(shareObjectUrl(), { users: [con.username] }).then(function () {
                    scope.contributors.push(angular.copy(con));
                });
            };

		} // link
	};
}]);
