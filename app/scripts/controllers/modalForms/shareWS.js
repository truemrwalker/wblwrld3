//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013), v3.1(2015)
//
// Project Leader & Lead Meme Media Architect: Yuzuru Tanaka
// Webble System Lead Architect & Developer: Micke Nicander Kuwahara
// Server Side Developer: Giannis Georgalis
// Additional Support: Jonas Sjöbergh
//
// This file is part of Webble World (c).
// ******************************************************************************************
// Webble World is licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ******************************************************************************************
// The use of the word "Webble" or "webble" for the loadable meme media objects are limited
// only to objects that actually loads in this original Webble World Platform. Modifications
// of the meme media object code which leads to breaking of compatibility with the original
// Webble World platform, may no longer be referred to as a "Webble" or "webble".
// ******************************************************************************************
//====================================================================================================================
'use strict';

//====================================================================================================================
// ADD CUSTOM SLOT FORM CONTROLLER
// This controls the Webbles add custom slots form
//====================================================================================================================
ww3Controllers.controller('shareWSSheetCtrl', function ($scope, $uibModalInstance, $log, $http, gettext, dbService, wsData) {

    //=== PROPERTIES ================================================================

    $scope.formItems = {
        theWS: wsData,
        wsCollaborators: [],
        selectedCollaborators: [],
        newCollaborator: undefined
    };

    $scope.msgTexts = {
        headlineWS: gettext("Workspace"),
        collaborators: gettext("A list of users that you currently share this workspace with."),
        newCollaboratorPlaceHolder: gettext("Start typing a username"),
        newCollaborator: gettext("The user-name or e-mail for a Webble user you want to share this Workspace with"),
        errorMsg: ''
    };



    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Name Change Event Handler
    // Clears the error message
    //========================================================================================
    $scope.nameChangeEventHandler = function($event){
        $scope.msgTexts.errorMsg = '';
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Adjust Tooltip Placement By Device Width
    // the placement of the tooltip is by default at the bottom, but with smaller devices in
    // some rare cases that should be set to right instead.
    //========================================================================================
    $scope.adjustTooltipPlacementByDeviceWidth = function(){
        if($(document).width() < 410){
            return 'right';
        }
        else{
            return 'left';
        }
    };
    //========================================================================================

    //========================================================================================
    // Get Users
    // Calls the server to get existing users for proper auto fill-in
    //========================================================================================
    $scope.getUsers =  function(usernamePrefix) {
        return $http.get('/api/users?limit=50&q=' + usernamePrefix).then(function(resp){
            return resp.data;
        });
    };
    //========================================================================================


    //========================================================================================
    // Add Collaborator
    // Calls the server in an attempt to add the collaborator with the username or email in
    // the textbox to share this workspace.
    //========================================================================================
    $scope.addCollaborator = function(){
        if($scope.formItems.newCollaborator && $scope.formItems.newCollaborator.username != ''){

            for(var i = 0, co; co = $scope.formItems.wsCollaborators[i]; i++){
                if(co == $scope.formItems.newCollaborator.username){
                    $scope.msgTexts.errorMsg = gettext("This user is already added");
                    return;
                }
            }

            dbService.addWSCollaborator($scope.formItems.theWS.id, [$scope.formItems.newCollaborator.username]).then(function(data){
                $scope.formItems.wsCollaborators = data.concat($scope.formItems.wsCollaborators);
                $scope.formItems.newCollaborator = undefined;
            },function(eMsg){
                $scope.msgTexts.errorMsg = eMsg;
            });
        }
    };
    //========================================================================================


    //========================================================================================
    // Remove Collaborators
    // Calls the server in an attempt to remove the selected collaborators from sharing this
    // workspace.
    //========================================================================================
    $scope.removeCollaborators = function(){
        if($scope.formItems.selectedCollaborators.length > 0){
            dbService.removeWSCollaborators($scope.formItems.theWS.id, $scope.formItems.selectedCollaborators).then(function(data){
                var newCollList = [];
                for(var i = 0, co; co = $scope.formItems.wsCollaborators[i]; i++){
                    var wasFound = false;
                    for(var n = 0; n < data.length; n++){
                        if(co == data[n]){
                            wasFound = true;
                            break;
                        }
                    }

                    if(!wasFound){
                        newCollList.push(co);
                    }
                }
                $scope.formItems.wsCollaborators = newCollList;
            },function(eMsg){
                $scope.msgTexts.errorMsg = eMsg;

            });
        }
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
		$uibModalInstance.close($scope.formItems.wsCollaborators);
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    dbService.getWSCollaborators($scope.formItems.theWS.id).then(function(users){
        $scope.formItems.wsCollaborators = users.map(function (u) { return u.username || u.email; });
    },function(eMsg){
        $scope.msgTexts.errorMsg = eMsg;
    });

});
//======================================================================================================================
