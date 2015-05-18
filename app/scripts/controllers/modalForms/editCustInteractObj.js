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
// ADD CUSTOM SLOT FORM CONTROLLER
// This controls the Webbles add custom slots form
//====================================================================================================================
ww3Controllers.controller('editCustInteractObjSheetCtrl', function ($scope, $modalInstance, $log, $timeout, gettext, Slot, wblView, Enum) {

	//=== PROPERTIES ================================================================
	var thisWbl = wblView;
	var isInit = true;

	$scope.formItems = {
		interactObjs: [],
		thisWblSlots: [],
		thisWblSlotsPlus: [],
		mouseEventTypes: ['Default', 'Mouse Click', 'Mouse Move'],
		customActions: ['None', 'Default', 'Change Slot'],
		multiActions: ['Done', 'And']
	};


	//TODO: fix tooltips and error messages
	$scope.tooltip = {
		color: gettext("The color value of the Interaction Object is static and cannot be changed"),
		index: gettext("The index value of the Interaction Object is static and cannot be changed"),
		position: gettext("The position of the Interaction Object in relation to its Webble and other Interaction Objects"),
		name: gettext("A unique name of the interaction object (Default objects cannot be altered)"),
		tooltip: gettext("The display text when one hover above the interaction object (Default objects cannot be altered)"),
		action:  gettext("What will happen when the user interact with the object (Default objects cannot be altered)"),
		mouseEvType: gettext("What type of mouse interaction is requested (Default objects cannot be altered)"),
		enabled: gettext("Will the interaction object be visible or not?  (This is the only attribute one can change with Default objects (except Assign Parent))")
	};

	// Form validation error message
	$scope.formProps = {
		errorMsg: '',
		errorMsgColor: 'red'
	};



	//=== EVENT HANDLERS =====================================================================




	//========================================================================================
	// Check If Option Is Allowed
	// Make sure the user does not pick 'default', then scold him/her and set back to '' empty
	//========================================================================================
	$scope.checkIfOptionIsAllowed = function(index){
		if(!isInit){
			if($scope.formItems.interactObjs[index].mouseEvType == 'Default'){
				$scope.formItems.interactObjs[index].mouseEvType = '';
				thisWbl.scope().showQIM("Custom Interaction Objects cannot be set to Default!", 2500);
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
			if($scope.formItems.interactObjs[index].action == 'Default'){
				$scope.formItems.interactObjs[index].action = 'None';
				thisWbl.scope().showQIM("Custom Interaction Objects cannot be set to Default!", 2500);
			}
			if($scope.formItems.interactObjs[index].action == 'None'){
				$scope.formItems.interactObjs[index].actionPack = [];
			}
			else{
				if($scope.formItems.interactObjs[index].actionPack.length == 0){
					$scope.formItems.interactObjs[index].actionPack.push({
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
			if($scope.formItems.interactObjs[pIndex].actionPack[index].selectedSlotForBox != ''){
				var slotName = '[' + $scope.formItems.interactObjs[pIndex].actionPack[index].selectedSlotForBox + ']'
				var fb = $("#formulaBox_" + pIndex + "_" + index);
				fb.val(fb.val() + slotName);
				$scope.formItems.interactObjs[pIndex].actionPack[index].selectedSlotForBox = '';
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
			if($scope.formItems.interactObjs[pIndex].actionPack[index].selectedMultiAction != 'Done'){
				$scope.formItems.interactObjs[pIndex].actionPack.push({
					slot: '',
					selectedSlotForBox: '',
					selectedMultiAction: 'Done',
					formula: '='
				});
			}
			else{
				if((index + 1) < $scope.formItems.interactObjs[pIndex].actionPack.length){
					$scope.formItems.interactObjs[pIndex].actionPack.splice((index + 1), ($scope.formItems.interactObjs[pIndex].actionPack.length - (index + 1)));
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
			if(thisWbl.scope().gimme('customInteractionObjects') == null){
				thisWbl.scope().addSlot(new Slot('customInteractionObjects',
					{},
					'Custom Interaction Objects',
					'Data for customizing the Webblw Interaction Objects',
					'wblIntrnlCstm',
					undefined,
					undefined
				));
			}

			var cio = [];
			var isUnedited = true;
			for(var i = 0, fio; fio = $scope.formItems.interactObjs[i]; i++){
				if(fio.name != ''){
					var storableAP = [];
					for(var j = 0, fap; fap = fio.actionPack[j]; j++){
						storableAP.push({
							slot: fap.slot,
							formula: fap.formula
						});
					}
					cio.push({
						index: fio.index,
						name: fio.name,
						tooltip: fio.tooltip,
						action: fio.action,
						actionPack: storableAP,
						mouseEvType: fio.mouseEvType,
						enabled: fio.enabled
					});
				}
				else{
					cio.push({ index: fio.index, name: '', tooltip: 'undefined', action: 'None', actionPack: [], mouseEvType: '', enabled: false });
				}
			}

			thisWbl.scope().set('customInteractionObjects', cio);

			for(var i = 0, io; io = cio[i]; i++) {
				thisWbl.scope().theInteractionObjects[i].scope().setName(io.name);
				thisWbl.scope().theInteractionObjects[i].scope().tooltip = io.tooltip;
				thisWbl.scope().theInteractionObjects[i].scope().setIsEnabled(io.enabled);
			}
			thisWbl.scope().getSlot('customInteractionObjects').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

			$modalInstance.close(true);
		}
		else{
			$modalInstance.close(null);
		}
	};
	//========================================================================================


	//$scope.formItems.interactObjs
	//$scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];
	//******************************************************************************************************************
	//=== CTRL MAIN CODE ===============================================================================================
	//******************************************************************************************************************
	$scope.formItems.thisWblSlots.push({id: '', name: "None"});
	$scope.formItems.thisWblSlotsPlus.push({id: '', name: "None"});
	for(var slot in thisWbl.scope().getSlots()) {
		if(slot != 'customContextMenu' && slot != 'customInteractionObjects'){
			var thisSlot = thisWbl.scope().getSlot(slot);
			$scope.formItems.thisWblSlots.push({id: slot, name: thisSlot.getDisplayName() + " [" + slot + "]"});
			$scope.formItems.thisWblSlotsPlus.push({id: slot, name: thisSlot.getDisplayName() + " [" + slot + "]"});
		}
	}
	$scope.formItems.thisWblSlotsPlus.push({id: 'mouseDeltaX', name: 'Mouse Horizontal Movement Delta'});
	$scope.formItems.thisWblSlotsPlus.push({id: 'mouseDeltaY', name: 'Mouse Vertical Movement Delta'});

	for(var i = 0, io; io = thisWbl.scope().theInteractionObjects[i]; i++) {
		var actionType = 'None'
		if(io.scope().getName() == 'Menu' || io.scope().getName() == 'AssignParent' || io.scope().getName() == 'Rotate' || io.scope().getName() == 'Resize' || io.scope().getName() == 'Rescale'){
			actionType = 'Default';
		}
		if(actionType != 'Default' && thisWbl.scope().customInteractionBalls != undefined){
			for(var t = 0; t < thisWbl.scope().customInteractionBalls.length; t++){
				if(io.scope().getName() == thisWbl.scope().customInteractionBalls[t].name){
					actionType = 'Default';
					break;
				}
			}
		}

		$scope.formItems.interactObjs.push({
			color: io.scope().color,
			index: io.scope().getIndex(),
			pos: '../../images/icons/ioPos/pos' + io.scope().getIndex() + '.jpg',
			name: io.scope().getName(),
			tooltip: ((io.scope().tooltip != 'undefined') ? io.scope().tooltip : ''),
			action: actionType,
			actionPack: [],
			mouseEvType: ((io.scope().getName() != '') ? ((io.scope().getName() == 'Menu' || io.scope().getName() == 'AssignParent') ? 'Mouse Click' : ((io.scope().getName() == 'Rotate' || io.scope().getName() == 'Resize' || io.scope().getName() == 'Rescale') ? 'Mouse Move' : 'Default')) : ''),
			enabled: io.scope().getIsEnabled()
		})
	}

	var cio = thisWbl.scope().gimme('customInteractionObjects');

	if(cio != null){
		for(var i = 0, io; io = cio[i]; i++){
			for(var k = 0, fio; fio = $scope.formItems.interactObjs[k]; k++) {
				if(io.index == fio.index){
					$scope.formItems.interactObjs[i].name = io.name;
					$scope.formItems.interactObjs[i].tooltip = io.tooltip;
					$scope.formItems.interactObjs[i].enabled = io.enabled;

					var newFCIOAP = [];
					for(var j = 0, ap; ap = io.actionPack[j]; j++){
						var sma = ((j + 1) == io.actionPack.length) ? 'Done' : 'And';
						newFCIOAP.push({slot: ap.slot, selectedSlotForBox: '', selectedMultiAction: sma, formula: ap.formula })
					}
					$scope.formItems.interactObjs[i].action = io.action;
					$scope.formItems.interactObjs[i].actionPack = newFCIOAP;
					$scope.formItems.interactObjs[i].mouseEvType = io.mouseEvType;
				}
			}
		}
	}
	$timeout(function(){ isInit = false; }, 500);
});
//======================================================================================================================

