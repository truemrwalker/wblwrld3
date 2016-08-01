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
// WEBBLE SLOT CONNECTION FORM CONTROLLER
// This controls the Webbles slot connection form
//====================================================================================================================
ww3Controllers.controller('openWSSheetCtrl', function ($scope, $uibModalInstance, $log, $timeout, gettext, availWS) {

    //=== PROPERTIES ================================================================

    $scope.formItems = {
        availableWSList: angular.copy(availWS),
        selectedWS: ''
    };

    $scope.infoTooltips = {
        availableWSList: gettext("This is the list of available Workspaces you have previously saved or have been invited to share.")
    };

    // Form validation error message
    $scope.errorMsg = gettext("To open a Workspace without loading its containing Webbles just hold ALT + CTRL key while loading. This allows you to, for example, delete a Workspace without having to load all the webbles it contain.");

    //=== EVENT HANDLERS =====================================================================



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
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if (result == 'submit') {
			$uibModalInstance.close($scope.formItems.selectedWS);
        }
        else{
			$uibModalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    var noSelect = {id: undefined, name: '---', creator: '', is_shared: false};
    $scope.formItems.availableWSList.unshift(noSelect);
    $scope.formItems.selectedWS = undefined;
	$timeout(function(){$('#wsNameSelect').focus();}, 300);
});
//======================================================================================================================
