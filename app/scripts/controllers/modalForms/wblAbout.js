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
// ABOUT WEBBLE WORLD FORM CONTROLLER
// This controls the Platforms About form
//====================================================================================================================
ww3Controllers.controller('AboutWebbleSheetCtrl', function ($scope, $modalInstance, $log, wblData, gettext, dbService) {

    //=== PROPERTIES ================================================================

    $scope.formData = wblData;

    $scope.tooltip = {
        displayname: gettext("This is the currently chosen display name for this Webble Instance, may be changed in properties"),
        instanceid: gettext("This is the session instance id for this particular Webble"),
        defid: gettext("This is the name of the Webble definition this Webble was created from"),
        author: gettext("This is the user name of the author for this Webble definition"),
        description: gettext("This is the description of this Webble Definition"),
        keywords: gettext("This is the keywords selected for this Webble Definition"),
        templateid: gettext("This is the name of the template this Webble is created from. If you click the 'Create Sandbox Copy' button you create an identical copy of this Webble template (HTML5 code) and place it in your sandbox template editor for developing your own version based on this."),
        templaterevision: gettext("This is the revision number of the template being used")
    };



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
    // Make Copy
    // Makes a template copy for the selected Webble and puts in the users sandbox.
    //========================================================================================
    $scope.makeCopy = function (templateId) {
        dbService.copyPublishedTemplateAsMyUnpublishedTemplate(templateId).then(function(data){
            $scope.formData.wblPlatformScope.showQIM(gettext("Template code copied to your Template Editor"), undefined, undefined, undefined, '#c7fcff');
        },function(eMsg){
            $scope.errorMsg = eMsg;
        });
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $modalInstance.close(null);
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************

});
//======================================================================================================================
