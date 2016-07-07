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
// WEBBLE PROPERTIES FORM CONTROLLER
// This controls the Webbles slot and property form
//====================================================================================================================
ww3Controllers.controller('propertySheetCtrl', function ($scope, $modalInstance, $modal, $log, Enum, templateId, props, colorService, gettextCatalog, gettext) {

    //=== PROPERTIES ================================================================

    $scope.defCats = ['metadata'];
    $scope.defCatStrings = { metadata: {p1: gettext("Internal"), p2: ""}};
    $scope.defCatStrings[templateId] = {p1: "", p2: templateId};
    //$scope.defCatStrings['css_' + templateId] = gettext("CSS Related") + ' (' + templateId + ')';
	$scope.defCatStrings['css_' + templateId] = {p1: gettext("CSS Related"), p2: '(' + templateId + ')'};
    //$scope.defCatStrings['css_root'] = gettext("CSS Related") + ' (root)';
	$scope.defCatStrings['css_root'] = {p1: gettext("CSS Related"), p2: '(root)'};
    //$scope.defCatStrings['custom'] = gettext("Custom");
	$scope.defCatStrings['custom'] = {p1: gettext("Custom"), p2: ""};
    //$scope.defCatStrings['custom-css'] = gettext("Custom") + " " + gettext("CSS Related");
	$scope.defCatStrings['custom-css'] = {p1: gettext("Custom"), p2: gettext("CSS Related")};

    $scope.props = props;
    $scope.propsCats = [];
    $scope.browser = BrowserDetect.browser;
    $scope.deleteTooltipInfo = gettext("If you want to delete this custom slot, click here.");
    $scope.isSharedTooltipInfo = gettext("This Webble has shared model duplicates which it shares selected slots with");

    $scope.infoMsg = 'Hover the Question mark to get a description of the slot or click it to open a more readable form of the same.';

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

		var splicePoint = 2;
		for(var n = 0; n < unsortedCats.length; n++){
			$scope.defCatStrings[unsortedCats[n].toString()] = {p1: unsortedCats[n], p2: ""};
			sortedCats.splice(splicePoint++, 0, unsortedCats[n]);
		}

        return sortedCats;
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

	//========================================================================================
	// Copy To Clipboard
	// Gives the user the chance to quickly get a slotname stored in the clipboard.
	//========================================================================================
	$scope.copyToClipboard = function(slotName){
		window.prompt(gettextCatalog.getString("Copy to clipboard") + ": Ctrl+C, Enter", slotName);
	};
	//========================================================================================


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
	// Local Audio File Changed
	// When an audio file is selected then use that value to load the sound file, if it is
	// not an audio file, rescue the situation by setting it blank.
	//========================================================================================
	$scope.localAudioFileChanged = function(input){
		if (input.files && input.files[0]) {
			var theItemName = $(input).attr('id').replace('inputAudio_', ''), theItem;
			for(var i = 0; i < $scope.props.length; i++){
				if(theItemName == $scope.props[i].key){
					theItem = $scope.props[i];
					break;
				}
			}
			var reader = new FileReader();

			reader.onload = function (e) {
				if(e.target.result.toString().search('data:audio') != -1){
					theItem.value = e.target.result;
					theItem.notification = '';
				}
				else{
					theItem.notification = gettext("The file selected is not an audio file.");
					theItem.value = '';
				}
				if(!$scope.$$phase){ $scope.$apply(); }
			};

			reader.readAsDataURL(input.files[0]);
		}
	};
	//========================================================================================


	//========================================================================================
	// Local Video File Changed
	// When an audio file is selected then use that value to load the sound file, if it is
	// not an audio file, rescue the situation by setting it blank.
	//========================================================================================
	$scope.localVideoFileChanged = function(input){
		if (input.files && input.files[0]) {
			var theItemName = $(input).attr('id').replace('inputVideo_', ''), theItem;
			for(var i = 0; i < $scope.props.length; i++){
				if(theItemName == $scope.props[i].key){
					theItem = $scope.props[i];
					break;
				}
			}
			var reader = new FileReader();

			reader.onload = function (e) {
				if(e.target.result.toString().search('data:video') != -1){
					theItem.value = e.target.result;
					theItem.notification = '';
				}
				else{
					theItem.notification = gettext("The file selected is not a video file.");
					theItem.value = '';
				}
				if(!$scope.$$phase){ $scope.$apply(); }
			};

			reader.readAsDataURL(input.files[0]);
		}
	};
	//========================================================================================


	//========================================================================================
	// Show More Readable
	// Opens a modal window to display the slots descriptive information in a more readable
	// and user friendly way.
	//========================================================================================
	$scope.showMoreReadable = function(slot){
		var titleTxt = slot.name + " (" + slot.key + ")";
		var contentTxt = '<h4>' + gettextCatalog.getString("Slot Description") + '</h4>' +
			'<div style="font-size: 15px;">' +
				'<p>' +
					'<span style="font-weight: bolder; text-decoration: underline;">' + gettextCatalog.getString("Category") + '</span>' + ':&nbsp;' + slot.cat +
				'</p>' +
				'<p style="border-bottom: 1px dotted black;"></p>' +
				'<p>' +
					'<span style="font-weight: bolder; text-decoration: underline;">' + gettextCatalog.getString("Description") + '</span>:</br>' +
					'<span style="display: inline-block; padding-top: 7px; padding-left: 7px; white-space: pre-wrap;">' + slot.desc + '</span>' +
				'</p>' +
				'<p style="border-bottom: 1px dotted black;"></p>' +
				'<p>' +
					'<span style="font-weight: bolder; text-decoration: underline;">' + gettextCatalog.getString("Value:") + '</span></br>' +
					'<span style="display: inline-block; padding-top: 7px; padding-left: 7px; white-space: pre-wrap; font-size: 12px; min-width: 98%; max-height: 200px; overflow-y: auto;">' + slot.value + '</span>' +
				'</p>' +
			'</div>';

		var modalOptions = {
			templateUrl: 'views/modalForms/infoMsg.html',
			controller: 'infoMsgCtrl',
			windowClass: 'modal-wblwrldform small',
			resolve: {
				infoTitle: function () { return titleTxt; },
				infoContent: function () { return contentTxt; }
			},
			size: 'md'
		};

		var modalInstance = $modal.open(modalOptions);
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


