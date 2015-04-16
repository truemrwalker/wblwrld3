//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013)
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
// WEBBLE PROPERTIES FORM CONTROLLER
// This controls the Webbles slot and property form
//====================================================================================================================
ww3Controllers.controller('propertySheetCtrl', function ($scope, $modalInstance, $modal, $log, Enum, templateId, props, colorService, gettext) {

    //=== PROPERTIES ================================================================

    $scope.defCats = ['metadata'];
    $scope.defCatStrings = { metadata: gettext("Internal") };
    $scope.defCatStrings[templateId] = templateId;
    $scope.defCatStrings['css_' + templateId] = gettext("CSS Related") + ' (' + templateId + ')';
    $scope.defCatStrings['css_root'] = gettext("CSS Related") + ' (root)';
    $scope.defCatStrings['custom'] = gettext("Custom");
    $scope.defCatStrings['custom-css'] = gettext("Custom") + " " + gettext("CSS Related");

    $scope.props = props;
    $scope.propsCats = [];
    $scope.browser = BrowserDetect.browser;
    $scope.deleteTooltipInfo = gettext("If you want to delete this custom slot, click here.");
    $scope.isSharedTooltipInfo = gettext("This Webble has shared model duplicates which it shares selected slots with");

    $scope.infoMsg = '';

    $scope.it = Enum.aopInputTypes;
    var testPropType = {itemKey: '', typeIsSet: false};



    //=== EVENT HANDLERS =====================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Get All Categories
    // Finds all different categories available in this batch of slots and properties
    //========================================================================================
    var getAllCats = function(){
        var unsortedCats = [];
        var sortedCats = [];

        for(var i = 0; i < $scope.props.length; i++){
            var catExist = false;
            for(var n = 0; n < unsortedCats.length; n++){
                var catName = $scope.props[i].cat;
                if($scope.props[i].cat.search('css') != -1 && $scope.props[i].cat.search('custom-css') == -1 ){
                    if($scope.props[i].key.search('root') != -1){
                        catName += '_' + $scope.props[i].key.substr(0, $scope.props[i].key.indexOf(':'));
                    }
                    else if($scope.props[i].key.search('custom') != -1){
                        catName += '_custom'
                    }
                    else{
                        catName += '_' + templateId;
                    }
                }
                if(catName == unsortedCats[n]){
                    catExist = true;
                    break;
                }
            }

            if(!catExist){
                if($scope.props[i].cat == 'css'){
                    if($scope.props[i].key.search('root') != -1){
                        unsortedCats.push($scope.props[i].cat + '_' + $scope.props[i].key.substr(0, $scope.props[i].key.indexOf(':')));
                    }
                    else if($scope.props[i].key.search('custom') != -1){
                        unsortedCats.push($scope.props[i].cat + '_custom');
                    }
                    else{
                        unsortedCats.push($scope.props[i].cat + '_' + templateId);
                    }

                }
                else{
                    unsortedCats.push($scope.props[i].cat)
                }
            }

            if(catName){
                $scope.props[i].cat = catName;
            }
        }

        var catSortOrder = ['metadata', templateId, 'css_' + templateId, 'css_root', 'custom', 'custom-css'];
        for(var i = 0; i < catSortOrder.length; i++){
            for(var n = 0; n < unsortedCats.length; n++){
                if(unsortedCats[n] == catSortOrder[i]){
                    sortedCats.push(unsortedCats[n]);
                    unsortedCats.splice(n, 1);
                    break;
                }
            }
        }


        for(var n = 0; n < unsortedCats.length; n++){
            $scope.defCatStrings[unsortedCats[n].toString()] = unsortedCats[n];
        }

        if(unsortedCats.length > 0){
            var nonSlotProp = sortedCats.splice(0, 1);
            sortedCats = unsortedCats.concat(sortedCats);
            sortedCats.unshift(nonSlotProp);
        }

        return sortedCats;
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
        return 'left';
    };
    //========================================================================================

    //========================================================================================
    // Toggle Multi Check Box Selection
    // Toggles the prop item value correctly due to the multi checkbox selections.
    //========================================================================================
    $scope.toggleMultiCheckBoxSelection = function(cbName, itemSelVal) {
        var idx =itemSelVal.indexOf(cbName);

        // is currently selected
        if (idx > -1) {
            itemSelVal.splice(idx, 1);
        }

        // is newly selected
        else {
            itemSelVal.push(cbName);
        }
    };
    //========================================================================================

    //========================================================================================
    // Activate Rich Text Edit Only
    // Stop propagation when selecting text, so that dragging of form is not activated instead
    //========================================================================================
    $scope.activateRichTextEditOnly = function($event){
        $event.stopPropagation();
    };
    //========================================================================================


    //========================================================================================
    // Local Image File Changed
    // When an Image file is selected then use that value to display the image, if it is not an
    // image file, rescue the situation by setting a no-image image.
    //========================================================================================
    $scope.localImgFileChanged = function(input){
        if (input.files && input.files[0]) {
            var theItemName = $(input).attr('id').replace('inputImage_', ''), theItem;
            for(var i = 0; i < $scope.props.length; i++){
                if(theItemName == $scope.props[i].key){
                    theItem = $scope.props[i];
                    break;
                }
            }
            var reader = new FileReader();

            reader.onload = function (e) {
                if(e.target.result.toString().search('data:image') != -1){
                    theItem.value = e.target.result;
                    theItem.notification = '';
                }
                else{
                    theItem.notification = gettext("The file selected is not an image file.");
                    theItem.value = '../../images/notFound.png';
                }
                if(!$scope.$$phase){ $scope.$apply(); }
            };

            reader.readAsDataURL(input.files[0]);
        }
    };
    //========================================================================================


    //========================================================================================
    // Delete Slot Request
    // deletes the custom slot which index is provided in the call.
    //========================================================================================
    $scope.deleteSlotRequest = function(propIndex){
        var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

        modalInstance.result.then(function () {
            $scope.props[propIndex]['deleteRequest'] = true;
        }, function () {
        });
    };
    //========================================================================================


    //========================================================================================
    // Is Default Category
    // Checks if a category is one of the default ones
    //========================================================================================
    $scope.isDefCat = function(whatCat){
        for(var i = 0; i < $scope.defCats.length; i++){
            if(whatCat == $scope.defCats[i]){
                return true;
            }
        }
        return false;
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if (result == 'submit') {
            $scope.props['deleteOnly'] = false;
            $modalInstance.close($scope.props);
        }
        else{
            $scope.props['deleteOnly'] = true;
            $modalInstance.close($scope.props);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.propsCats = getAllCats();
});
//======================================================================================================================


