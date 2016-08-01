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
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Directives.directive('licenseKeyEditor', [ '$timeout', 'gettext', 'confirm', 'licenseService',
function($timeout, gettext, confirm, licenseService){
	return {

		//require: '^form', // We look for it on a parent, since it will be defined somewhere higher on the DOM
		restrict: 'E',
		scope: {
			holder: '=keyHolder',
			isGroup: '@isGroup'
		},
		templateUrl: 'views/editors/license-key-editor.html',
		link: function(scope, element, attrs, ctrl){

			scope.$watch('holder', function() {

                var holder = scope.holder || {};

				if (scope.isGroup)
					scope.groupId = holder.id;

				scope.keyData = {};
				scope.licenses = holder.auth_keys || [];
				scope.currLicIndex = -1;
			});

			scope.selectLicense = function(lic, index) {

				if (scope.currLicIndex == index)
					scope.currLicIndex = -1;
				else
					scope.currLicIndex = index;
			};

			scope.deleteLicense = function(lic, index) {

				confirm.show(gettext("Delete Licence:") + " " + lic.realm + " [" + lic.resource + "]",
					gettext("If you confirm the licence data will be permanently removed."),
					gettext("Remove"), gettext("Do Not Remove")).then(function () {

						licenseService.del(lic, scope.groupId).then(function() {
							scope.licenses.splice(index, 1);
						}
							, function(reason) { console.log("YOOYOYOYOY:", reason); });
					});
			};
			scope.addLicense = function(data) {

				for (var i = 0; i < scope.licenses.length; ++i) {

					if (scope.licenses[i].realm == data.realm && scope.licenses[i].resource == data.resource) {

						scope.selectLicense(scope.licenses[i], i);
						return;
					}
				}

				licenseService.add(data, scope.groupId).then(function() {
					scope.licenses.push(angular.copy(data));
				});
			};
		}
	};
}]);
