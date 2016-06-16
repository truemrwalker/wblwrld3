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
// WEBBLE PROTECTIONS FORM CONTROLLER
// This controls the Webbles protections form
//====================================================================================================================
ww3Controllers.controller('protectSheetCtrl', function ($scope, $modalInstance, $log, Enum, bitflags, gettext, protectSettings) {

    //=== PROPERTIES ================================================================

    var theWblProtection = protectSettings;

    $scope.wblPrtct = [
        {
            key: 'MOVE',
            label: gettext("Move Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.MOVE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be moved")
        },
        {
            key: 'RESIZE',
            label: gettext("Resize Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.RESIZE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot Resize")
        },
        {
            key: 'DUPLICATE',
            label: gettext("Duplicate Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.DUPLICATE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be duplicated")
        },
        {
            key: 'SHAREDMODELDUPLICATE',
            label: gettext("Shared Model Duplicate Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be shared model duplicated")
        },
        {
            key: 'DELETE',
            label: gettext("Delete Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.DELETE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be deleted")
        },
        {
            key: 'PUBLISH',
            label: gettext("Publish Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be published")
        },
        {
            key: 'PROPERTY',
            label: gettext("Property Change Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.PROPERTY, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot change any slots or properties")
        },
        {
            key: 'PARENT_CONNECT',
            label: gettext("Parent Assignment Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_CONNECT, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be assigmed any parent")
        },
        {
            key: 'CHILD_CONNECT',
            label: gettext("Having Children Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_CONNECT, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot have any children")
        },
        {
            key: 'PARENT_DISCONNECT',
            label: gettext("Parent Revoking Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be peeled from its parent")
        },
        {
            key: 'CHILD_DISCONNECT',
            label: gettext("Disconnect Children Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_DISCONNECT, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot remove any children")
        },
        {
            key: 'BUNDLE',
            label: gettext("Bundle Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be bundled")
        },
        {
            key: 'UNBUNDLE',
            label: gettext("Unbundle Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.UNBUNDLE, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be unbundled")
        },
        {
            key: 'DEFAULT_MENU',
            label: gettext("Default Menu Not Visible:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.DEFAULT_MENU, 10)) != 0,
            tooltip: gettext("When this is checked the Webble will never display its default menu items")
        },
        {
            key: 'INTERACTION_OBJECTS',
            label: gettext("Interaction Objects Not Visible:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.INTERACTION_OBJECTS, 10)) != 0,
            tooltip: gettext("When this is checked the Webble will never display its interaction objects")
        },
        {
            key: 'SELECTED',
            label: gettext("Selection Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) != 0,
            tooltip: gettext("When this is checked the Webble cannot be selected")
        },
        {
            key: 'POPUP_MENU',
            label: gettext("Contextmenu Not Allowed:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.POPUP_MENU, 10)) != 0,
            tooltip: gettext("When this is checked the Webble will never display its menu")
        },
        {
            key: 'NON_DEV_HIDDEN',
            label: gettext("Non-Developers Mode Not Visible:"),
            value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) != 0,
            tooltip: gettext("When this is checked the Webble will be invisible in all execution modes except Developers mode")
        },
        {
          key: 'DRAG_CLONE',
          label: gettext("Drag Clone Not Allowed:"),
          value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.DRAG_CLONE, 10)) != 0,
          tooltip: gettext("When this is checked the Webble slots for position will be updated in real time and no clone will be dragged in the Webbles place (Same way as with selected Webble, but without being selected)")
        },
        {
          key: 'BUNDLE_LOCKED',
          label: gettext("Bundle Locking Not Allowed:"),
          value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE_LOCKED, 10)) != 0,
          tooltip: gettext("When this is checked the Webble can still be individually dragged and moved even though it is a part of a bundle")
        },
		{
			key: 'EXPORT',
			label: gettext("Export Not Allowed:"),
			value: (parseInt(theWblProtection, 10) & parseInt(Enum.bitFlags_WebbleProtection.EXPORT, 10)) != 0,
			tooltip: gettext("When this is checked the Webble cannot be exported")
		}
    ];

    // Form validation error message
    $scope.errorMsg = gettext("NOTE: Multiple Webble setting available, meaning that if any Webbles are selected (border highlighted), those will also be effected by the settings done here.");


    //=== EVENT HANDLERS =====================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Apply New Protection
    // Check through the form sheet and set the Webble Protection Value accordingly.
    //========================================================================================
    var applyNewProtection = function(){
        for(var i = 0, prot; prot = $scope.wblPrtct[i]; i++){
            theWblProtection = prot.value == true ? bitflags.on(theWblProtection, Enum.bitFlags_WebbleProtection[prot.key]) : bitflags.off(theWblProtection, Enum.bitFlags_WebbleProtection[prot.key]);
        }
    };
    //========================================================================================



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
            applyNewProtection();
            $modalInstance.close(theWblProtection);
        }
        else{
            $modalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
});
//======================================================================================================================
