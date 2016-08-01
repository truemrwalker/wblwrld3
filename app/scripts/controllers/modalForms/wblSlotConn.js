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
ww3Controllers.controller('slotConnSheetCtrl', function ($scope, $uibModalInstance, $log, childSlots, parentSlots, currSelected, slotConnDir, gettext) {

    //=== PROPERTIES ================================================================

    $scope.childSlots = childSlots;
    $scope.parentSlots = parentSlots;
    $scope.slotConnDir = slotConnDir;
    $scope.selectedSlots = {
        inChild: currSelected.csName,
        inParent: currSelected.psName,
        mcData: []
    };
    $scope.splitMerge = {
        inChild: [],
        inParent: [],
        cellContent: []
    };
    $scope.infoTooltips = {
        childSlot: gettext("This is the slot of this Webble which will exchange values and communicate with its parent slot"),
        parentSlot: gettext("This is the slot of the parent which will exchange values and communicate with this child"),
        comboSlot: gettext("mark the cells of the merged combo in the child and parent to correspond with eachother the way you want."),
        slotDir: gettext("The directions which change of slot values will be communicated")
    };

    // Form validation error message
    $scope.errorMsg = '';



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
    // Toggle Cell Value
    // Toggle the selected cell's value between empty and checked.
    //========================================================================================
    $scope.toggleCellValue = function(colIndex, rowIndex){
        if($scope.splitMerge.cellContent[colIndex][rowIndex] == ''){
            $scope.splitMerge.cellContent[colIndex][rowIndex] = '•';
        }
        else{
            $scope.splitMerge.cellContent[colIndex][rowIndex] = '';
        }
    };
    //========================================================================================


    //========================================================================================
    // Is MergedCombo Slot Selected
    // checks to see if one of the selected slots is a merged slot, for if it is we need a bit
    // more info to fill in.
    //========================================================================================
    $scope.isMergedComboSlotSelected = function () {
        for(var i = 0, ss; ss = $scope.childSlots[i]; i++){
            if(ss.key == $scope.selectedSlots.inChild){
                if(ss.cat == 'custom-merged'){
                    return true;
                }
            }
        }

        for(var i = 0, ss; ss = $scope.parentSlots[i]; i++){
            if(ss.key == $scope.selectedSlots.inParent){
                if(ss.cat == 'custom-merged'){
                    return true;
                }
            }
        }

        return false;
    };
    //========================================================================================


    //========================================================================================
    // Update Possible Merge Combo Data
    // If the selected slot is of a merged combo kind then update the variables it concerns.
    //========================================================================================
    $scope.updatePossibleMergeComboData = function(){
        $scope.splitMerge.inChild = [];
        $scope.splitMerge.inParent = [];

        for(var i = 0, ss; ss = $scope.childSlots[i]; i++){
            if(ss.key == $scope.selectedSlots.inChild){
                if(ss.cat == 'custom-merged'){
                    $scope.splitMerge.inChild = ss.val;
                }
            }
        }

        for(var i = 0, ss; ss = $scope.parentSlots[i]; i++){
            if(ss.key == $scope.selectedSlots.inParent){
                if(ss.cat == 'custom-merged'){
                    $scope.splitMerge.inParent = ss.val;
                }
            }
        }

        if($scope.splitMerge.inChild.length == 0){
            $scope.splitMerge.inChild = [$scope.selectedSlots.inChild];
        }

        if($scope.splitMerge.inParent.length == 0){
            $scope.splitMerge.inParent = [$scope.selectedSlots.inParent];
        }

        $scope.splitMerge.cellContent = [];
        for(var i = 0; i < $scope.splitMerge.inChild.length; i++){
            var col = [];
            for(var k = 0; k < $scope.splitMerge.inParent.length; k++){
                col.push('');
            }
            $scope.splitMerge.cellContent.push(col);
        }
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if (result == 'submit') {
            for(var i = 0; i < $scope.splitMerge.inChild.length; i++){
                for(var k = 0; k < $scope.splitMerge.inParent.length; k++){
                    if($scope.splitMerge.cellContent[i][k] != ''){
                        $scope.selectedSlots.mcData.push([$scope.splitMerge.inChild[i], $scope.splitMerge.inParent[k]]);
                    }
                }
            }

			$uibModalInstance.close([$scope.selectedSlots, $scope.slotConnDir]);
        }
        else{
			$uibModalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.updatePossibleMergeComboData();

    for(var i = 0; i < $scope.splitMerge.inChild.length; i++){
        for(var k = 0; k < $scope.splitMerge.inParent.length; k++){
            for(var n = 0; n < currSelected.mcData.length; n++){
                if(currSelected.mcData[n][0] == $scope.splitMerge.inChild[i] && currSelected.mcData[n][1] == $scope.splitMerge.inParent[k]){
                    $scope.splitMerge.cellContent[i][k] = '•';
                }
            }
        }
    }
});
//======================================================================================================================
