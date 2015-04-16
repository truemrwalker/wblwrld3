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
 * Group management controller that drives the view groups.html
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('GroupsCtrl', ['$scope', '$http', 'gettext', 'authService', 'confirm', 'Users', 'UserAccounts',
function ($scope, $http, gettext, authService, confirm, Users, UserAccounts) {

	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	function gToF(g) { // Group to formatted visible value (f)

		if (g.readonly) {

			return '<i style="color: #b0b8c5;">' + g.name + '</i>';
		}
		else
			return g.name;
	}
	function gToRow(g) {
		return [{ v: g.id, f: gToF(g) }, g.parent_id, g.description];
	}
	function gsToData(gs) {

		var rows = [ ['Name', 'Parent Group', 'Tooltip'] ]; // cols
		gs.forEach(function(g) { rows.push(gToRow(g)); });
		return rows;
	}

	//******************************************************************

	function generateChartData(groupsArray, myGroupsArray) {

		if (myGroupsArray) {

			var myGroupsById = {};
			for (var i = 0; i < myGroupsArray.length; ++i)
				myGroupsById[myGroupsArray[i].id] = myGroupsArray[i];

			for (i = 0; i < groupsArray.length; ++i) {

				if (!myGroupsById.hasOwnProperty(groupsArray[i].id))
					groupsArray[i].readonly = true;
			}
		}
		return gsToData(groupsArray); // Regenerate if necessary
	}

	//******************************************************************

	function refreshAllGroups() {

		return $http.get('/api/groups').then(function(resp) {

			$scope.groups = resp.data;
			$scope.chartData = generateChartData($scope.groups, $scope.myGroups);
		});
	}

	////////////////////////////////////////////////////////////////////
	// Scope properties & initialization
	//
/*
	$scope.users = Users.query();
	$scope.userAccounts = UserAccounts.query();
*/

	$scope.tabs = {};
	$scope.editable = $scope.user && $scope.user.role === 'adm';
	$scope.groups = [];
	$scope.alerts = [];

	refreshAllGroups();

	$scope.selectedGroup = null;
	$scope.selectedGroupEdit = false;

	if (!$scope.editable) {

		$http.get('/api/mygroups').then(function (resp) {

			$scope.myGroups = resp.data;

			if ($scope.myGroups.length > 0) {

				$scope.editable = true;

				if ($scope.groups) // Regenerate chart data if necessary
					$scope.chartData = generateChartData($scope.groups, $scope.myGroups);
			}
		});
	}
	$scope.groupData = {};

	// Available publication policies
	//
	$scope.availablePolicies = [
		{
			enum: 'open',
			name: gettext("Open for publications"),
			help: gettext("Members can publish and update freely under this group")
		},
		{
			enum: 'moderate_new',
			name: gettext("Moderate new publications"),
			help: gettext("Members can update freely but new publications require the group owner's approval")
		},
		{
			enum: 'moderate_updates',
			name: gettext("Moderate all updates"),
			help: gettext("All new publications and updates (by members) under this group require the owner's approval")
		},
		{
			enum: 'closed',
			name: gettext("Closed for publications"),
			help: gettext("All publications and updates under this group are suspended")
		}
	];
	$scope.availablePoliciesById = {
		open: $scope.availablePolicies[0],
		moderate_new: $scope.availablePolicies[1],
		moderate_updates: $scope.availablePolicies[2],
		closed: $scope.availablePolicies[3]
	};

	////////////////////////////////////////////////////////////////////
	// Public scope functions
	//
	$scope.closeAlert = function (index) {
		$scope.alerts.splice(index, 1);
	};

	$scope.getUsers =  function(q) {

		var url = $scope.user.role !== 'adm' ? '/api/users?limit=20&q=' :
			'/api/adm/users?limit=20&q=';

		return $http.get(url + encodeURIComponent(q)).then(function(resp){
			return resp.data;
		});
	};

	//******************************************************************

	$scope.createGroup = function() {

		var url = $scope.groupData.subgroup && $scope.selectedGroup && $scope.selectedGroup.id ?
			'/api/groups/' + $scope.selectedGroup.id : '/api/groups';

		return $http.post(url, {
			group: $scope.groupData,
			owner: $scope.groupData.owner && $scope.groupData.owner.email
		}).then(function (resp) {

			var g = resp.data;

			$scope.groups.push(g);

			if ($scope.chartData)
				$scope.chartData.push(gToRow(g));

			$scope.onGroupSelected(null);
			$scope.alerts.push({ type: 'success', msg: gettext("Created Group") + ": " + g.name });

		}, function (err) {
			$scope.alerts.push({ type: 'danger', msg: err.data });
		});
	};

	$scope.modifySelectedGroup = function() {

		return $http.put('/api/groups/' + $scope.selectedGroup.id, {
			group: $scope.groupData,
			owner: ($scope.groupData.owner && $scope.groupData.owner.email) || undefined
		}).then(function(resp) {

			var g = resp.data;
			for (var i = 0; i < $scope.groups.length; ++i) {

				if ($scope.groups[i].id == g.id) {

					$scope.groups[i] = g;
					break;
				}
			}
			$scope.chartData = gsToData($scope.groups);
			$scope.onGroupSelected(null);

		}, function(err) {
			$scope.alerts.push({ type: 'danger', msg: err.data });
		});
	};

	$scope.createOrModifyGroup = function() {
		return $scope.selectedGroupEdit ?  $scope.modifySelectedGroup() : $scope.createGroup();
	};

	$scope.deleteGroup = function() {

		if ($scope.selectedGroup && $scope.selectedGroup.id) {

			confirm.show(gettext("Delete Group:") + " " + $scope.selectedGroup.name,
					gettext("If you confirm, any subgroups will be transfered to the parent group and the group's reference will be revoked from all its published objects"),
				gettext("Delete Group"), gettext("Do Not Delete Group")).then(function () {

					$http.delete('/api/groups/' + $scope.selectedGroup.id).then(function() {

						refreshAllGroups().then(function() { // Group deletion may affect other groups also

							$scope.onGroupSelected(null);
							$scope.alerts.push({ type: 'success', msg: gettext("Deleted Group") + ": " + g.name });
						});

					}, function (err) {
						$scope.alerts.push({ type: 'danger', msg: err.data });
					});
				});
		}
	};

	$scope.retrievePublishedObjects = function() {

		$http.get('/api/groups/' + $scope.selectedGroup.id + '/objects').then(function(resp) {
			$scope.publishedObjects = resp.data;
		});
	};
	$scope.deauthorizePublishedObject = function(obj, index) {

		confirm.show(gettext("Deauthorize Object:") + " " + obj.repr,
			gettext("If you confirm, the selected object will no longer be member of the group."),
			gettext("Deauthorize"), gettext("Do Not Deauthorize")).then(function () {

				$http.put('/api/groups/' + $scope.selectedGroup.id + '/objects', { obj: obj.id, remove: true }).then(function() {

					$scope.publishedObjects.splice(index, 1);

				}, function (err) {
					$scope.alerts.push({ type: 'danger', msg: err.data });
				});
			});

	};

	//******************************************************************

	$scope.onGroupSelected = function(selectedItem) {

		$scope.publishedObjects = null; // Clear the publihsed object list in any case

		if (selectedItem) {

			for (var i = 0; i < $scope.groups.length; ++i) {

				if ($scope.groups[i].id == selectedItem) {

					$scope.selectedGroup = $scope.groups[i];

					if ($scope.selectedGroup.readonly)
						$scope.tabs.info = true;
					else if ($scope.selectedGroupEdit)
						$scope.groupData = angular.copy($scope.selectedGroup);

					break;
				}
			}
		}
		else {

			$scope.groupData = {};
			$scope.selectedGroup = null;
			$scope.selectedGroupEdit = false;

			// Jump to info tab
			$scope.tabs.info = true;
		}
	};

	$scope.toggleSelectedGroupEdit = function() {

		if (!$scope.selectedGroupEdit && $scope.selectedGroup && $scope.selectedGroup.id) {

			$scope.groupData = angular.copy($scope.selectedGroup);
			$scope.selectedGroupEdit = true;
		}
		else {

			$scope.groupData = {};
			$scope.selectedGroupEdit = false;
		}
	};

	$scope.addUserToGroup = function(user, group) {

		if (user && user.email && group && group.id) {

			//console.log("FAKE ADDING USER: ", user.name.full, "TO GROUP:", group.name);

			$http.put('/api/groups/' + group.id + '/users', { user: user.email || user.username })
				.then(function (resp) {
					$scope.alerts.push({ type: 'success', msg: gettext("User added to group") + ": " + group.name });
				}, function (err) {
					$scope.alerts.push({ type: 'danger', msg: err.data });
				});
		}
	};

	//******************************************************************

}]);
