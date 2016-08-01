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
ww3Controllers.controller('editCustMenuItemsSheetCtrl', function ($scope, $uibModalInstance, $log, $timeout, gettext, Slot, wblView, Enum) {

	//=== PROPERTIES ================================================================
	var thisWbl = wblView;
	var isInit = true;

	$scope.formItems = {
		defMenuItems: [],
		custMenuItems: [],
		customActions: [gettext("None"), gettext("Change Slot")],
		thisWblSlots: [],
		multiActions: [gettext("Done"), gettext("And")],
		defMenuItemsOpen: 'none',
		defMenuItemsOpenBtnImg: 'images/icons/pullDownArrow.png',
		custMenuItemsOpen: 'block',
		custMenuItemsOpenBtnImg: 'images/icons/pullUpArrow.png'
	};

	$scope.tooltip = {
		dmi: gettext("The default menu items cannot be changed, but it can be turned on or off"),
		cmi: gettext("A custom menu item can only have the action to change a slot value. Such value change is made by selecting which slot and then create a formula in the text box by the use of slot names (found in the drop down box below the text box) and mathematical operators. You can create multiple slot changes for one Menu item. Delete an existing item by clearing its id field.")
	};

	// Form validation error message
	$scope.formProps = {
		errorMsg: '',
		errorMsgColor: 'red'
	};


	//=== EVENT HANDLERS =====================================================================

	//========================================================================================
	// Toggle Default Menu Open
	// hiding or showing the default menu items
	//========================================================================================
	$scope.toggleDefMenuOpen = function(){
		if($scope.formItems.defMenuItemsOpen == 'none'){
			$scope.formItems.defMenuItemsOpen = 'block';
			$scope.formItems.defMenuItemsOpenBtnImg = 'images/icons/pullUpArrow.png';
		}
		else{
			$scope.formItems.defMenuItemsOpen = 'none';
			$scope.formItems.defMenuItemsOpenBtnImg = 'images/icons/pullDownArrow.png';
		}
	};
	//========================================================================================

	//========================================================================================
	// Toggle Custom Menu Open
	// hiding or showing the custom menu items
	//========================================================================================
	$scope.toggleCustMenuOpen = function(){
		if($scope.formItems.custMenuItemsOpen == 'none'){
			$scope.formItems.custMenuItemsOpen = 'block';
			$scope.formItems.custMenuItemsOpenBtnImg = 'images/icons/pullUpArrow.png';
		}
		else{
			$scope.formItems.custMenuItemsOpen = 'none';
			$scope.formItems.custMenuItemsOpenBtnImg = 'images/icons/pullDownArrow.png';
		}
	};
	//========================================================================================

	//========================================================================================
	// Add More Maybe
	// If the last available menu item is being used then another is added.
	//========================================================================================
	$scope.addMoreMaybe = function(index){
		if(!isInit){
			if((index + 1) == $scope.formItems.custMenuItems.length){
				$scope.formItems.custMenuItems.push({id: '', name: '', action: 'None', actionPack: [], enabled: true});
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Enable Action Pack
	// Gives the user more input boxes to create an action pack item
	//========================================================================================
	$scope.enableActionPack = function(index){
		if(!isInit){
			if($scope.formItems.custMenuItems[index].action == 'None'){
				$scope.formItems.custMenuItems[index].actionPack = [];
			}
			else{
				if($scope.formItems.custMenuItems[index].actionPack.length == 0){
					$scope.formItems.custMenuItems[index].actionPack.push({
						slot: '',
						selectedSlotForBox: '',
						selectedMultiAction: 'Done',
						formula: '='
					});
				}
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Place Slot In Box
	// When a slot is selected in this box it puts its name in the textbox (at the end of the
	// current string)
	//========================================================================================
	$scope.placeSlotInBox = function(pIndex, index){
		if(!isInit){
			if($scope.formItems.custMenuItems[pIndex].actionPack[index].selectedSlotForBox != ''){
				var slotName = '[' + $scope.formItems.custMenuItems[pIndex].actionPack[index].selectedSlotForBox + ']'
				var fb = $("#formulaBox_" + pIndex + "_" + index);
				fb.val(fb.val() + slotName);
				$scope.formItems.custMenuItems[pIndex].actionPack[index].selectedSlotForBox = '';
			}
		}
	};
	//========================================================================================

	//========================================================================================
	// Maybe Want More Action
	// If the user selects 'And' he is given the opportunity to create another slot change
	// or if it is selected Done, all opportunites below 'Done' are removed.
	//========================================================================================
	$scope.maybeWantMoreAction = function(pIndex, index){
		if(!isInit){
			if($scope.formItems.custMenuItems[pIndex].actionPack[index].selectedMultiAction != 'Done'){
				$scope.formItems.custMenuItems[pIndex].actionPack.push({
					slot: '',
					selectedSlotForBox: '',
					selectedMultiAction: 'Done',
					formula: '='
				});
			}
			else{
				if((index + 1) < $scope.formItems.custMenuItems[pIndex].actionPack.length){
					$scope.formItems.custMenuItems[pIndex].actionPack.splice((index + 1), ($scope.formItems.custMenuItems[pIndex].actionPack.length - (index + 1)));
				}
			}
		}
	};
	//========================================================================================


	//*****************************************************************************************************************
	//=== PRIVATE FUNCTIONS ===========================================================================================
	//*****************************************************************************************************************



	//*****************************************************************************************************************
	//=== PUBLIC FUNCTIONS ============================================================================================
	//*****************************************************************************************************************


	//========================================================================================
	// Close
	// Closes the modal form and send the resulting content back to the creator
	//========================================================================================
	$scope.close = function (result) {
		if (result == 'submit') {
			// Store the customizations in a slot
			if(thisWbl.scope().gimme('customContextMenu') == null){
				thisWbl.scope().addSlot(new Slot('customContextMenu',
					{},
					'Custom Context Menu',
					'Data for customizing the Webble Context Menu',
					'wblIntrnlCstm',
					undefined,
					undefined
				));
			}
			thisWbl.scope().getSlot('customContextMenu').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

			var ccm = { dmi: [], cmi: [] };

			for(var i = 0, fdmi; fdmi = $scope.formItems.defMenuItems[i]; i++){
				if(!fdmi.enabled){
					ccm.dmi.push(fdmi.id);
				}
			}

			for(var i = 0, fcmi; fcmi = $scope.formItems.custMenuItems[i]; i++){
				var storabelAP = [];
				for(var j = 0, fap; fap = fcmi.actionPack[j]; j++){
					storabelAP.push({
						slot: fap.slot,
						formula: fap.formula
					});
				}

				if(fcmi.id != '' && fcmi.name != '' && storabelAP.length > 0){
					ccm.cmi.push({
						id: fcmi.id,
						name: fcmi.name,
						actionPack: storabelAP,
						enabled: fcmi.enabled
					});
				}
			}

			if(ccm.dmi.length != 0 || ccm.cmi.length != 0){
				thisWbl.scope().set('customContextMenu', ccm);
			}
			else{
				thisWbl.scope().removeSlot('customContextMenu');
			}

			// Make the changes and enable all modifications and customizations
			for(var i = 0, dmi; dmi = $scope.formItems.defMenuItems[i]; i++){
				if(dmi.enabled){
					thisWbl.scope().removePopupMenuItemDisabled(dmi.id)
				}
				else{
					thisWbl.scope().addPopupMenuItemDisabled(dmi.id);
				}
			}

			thisWbl.scope().internalCustomMenu = [];
			for(var i = 0, cmi; cmi = $scope.formItems.custMenuItems[i]; i++){
				thisWbl.scope().internalCustomMenu.push({itemId: cmi.id, itemTxt: cmi.name});
				if(cmi.enabled){
					thisWbl.scope().removePopupMenuItemDisabled(cmi.id)
				}
				else{
					thisWbl.scope().addPopupMenuItemDisabled(cmi.id);
				}
			}

			$uibModalInstance.close({dmi: $scope.formItems.defMenuItems, cmi: $scope.formItems.custMenuItems});
		}
		else{
			$uibModalInstance.close(null);
		}
	};
	//========================================================================================



	//******************************************************************************************************************
	//=== CTRL MAIN CODE ===============================================================================================
	//******************************************************************************************************************
	$scope.formItems.thisWblSlots.push({id: '', name: "None"});
	for(var slot in thisWbl.scope().getSlots()) {
		if(slot != 'customContextMenu' && slot != 'customInteractionObjects'){
			var thisSlot = thisWbl.scope().getSlot(slot);
			$scope.formItems.thisWblSlots.push({id: slot, name: thisSlot.getDisplayName() + " [" + slot + "]"});
		}
	}

	for(var defItem in Enum.availableOnePicks_DefaultWebbleMenuTargets) {
		$scope.formItems.defMenuItems.push({
			id: defItem,
			name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt[defItem],
			action: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt[defItem],
			enabled: !thisWbl.scope().isPopupMenuItemDisabled(defItem)
		});
	}

	var ccm = thisWbl.scope().gimme('customContextMenu');
	if(ccm != null){
		for(var i = 0, fdmi; fdmi = $scope.formItems.defMenuItems[i]; i++){
			for(var j = 0, dmi; dmi = ccm.dmi[j]; j++){
				if(dmi == fdmi.id){
					fdmi.enabled = false;
					break;
				}
			}
		}

		for(var i = 0, cmi; cmi = ccm.cmi[i]; i++){
			var newFCMI = {id: cmi.id, name: cmi.name, action: 'Change Slot', actionPack: [], enabled: cmi.enabled};
			var newFCMIAP = [];
			for(var j = 0, ap; ap = cmi.actionPack[j]; j++){
				var sma = ((j + 1) == cmi.actionPack.length) ? 'Done' : 'And';
				newFCMIAP.push({slot: ap.slot, selectedSlotForBox: '', selectedMultiAction: sma, formula: ap.formula })
			}
			newFCMI.actionPack = newFCMIAP;
			$scope.formItems.custMenuItems.push(newFCMI);
			thisWbl.scope().removePopupMenuItemDisabled(cmi.id);
		}
	}
	$scope.formItems.custMenuItems.push({id: '', name: '', action: 'None', actionPack: [], enabled: true});
	$timeout(function(){ isInit = false; }, 500);
});
//======================================================================================================================
