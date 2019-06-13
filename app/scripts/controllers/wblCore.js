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
// WEBBLE CORE CONTROLLER
// This is the controller for the core of a webble
//====================================================================================================================
ww3Controllers.controller('webbleCoreCtrl', function ($scope, $uibModal, $log, $timeout, gettextCatalog, socket, dateFilter, Enum, wwConsts, localStorageService, Slot, bitflags, jsonQuery, isValidStyleValue, getKeyByValue, colorService, valMod, gettext, strCatcher, isEmpty, mathy, isExist) {

    //=== WEBBLE CORE PROPERTIES ================================================================
    // Unique instance Id
    var instanceId_ = $scope.getNewInstanceId();
    $scope.getInstanceId = function(){return instanceId_;};
    //No SET available

    // Keeps track of the webbles initiation states
    var theInitiationState_ = Enum.bitFlags_InitStates.none;
    $scope.getInitiationState = function(){ return theInitiationState_; };

    // A set of bit flags that control some of the Webble settings available
    var theWebbleSettingFlags_ = Enum.bitFlags_WebbleConfigs.None;
    $scope.getWebbleConfig = function(){return theWebbleSettingFlags_;};
    $scope.setWebbleConfig = function(whatNewConfigState){theWebbleSettingFlags_ = whatNewConfigState;};

    // A list of slots
    var theSlots_ = {};

    // The unique template element for this webble
    $scope.theView = undefined;

    // All metadata that this webble need to hold about itself
    $scope.theWblMetadata = {};

    // The children of this webble
    var theChildren_ = [];
    $scope.getChildren = function(){return theChildren_;};
    //No SET (but 'add' found further below)

    // The parent webble, if any.
    var theParent_ = undefined;
    $scope.getParent = function(){return theParent_;};
    //No SET (but 'assignParent' found further below)

    // jquery element object pointing at the place in this webble where children should be DOM pasted
    var childContainer_ = undefined;
    $scope.getChildContainer = function(){return childContainer_;};
	$scope.setChildContainer = function(newContainer){ childContainer_ = newContainer; };

    // The default slot to auto connect
    var theDefaultSlot_ = '';
    $scope.getDefaultSlot = function(){return theDefaultSlot_;};
    $scope.setDefaultSlot = function(newDefaultSlot){theDefaultSlot_ = newDefaultSlot;};

    // The currently selected slot in this webble to be used in slot communication
    var theSelectedSlot_ = '';
    $scope.getSelectedSlot = function(){ return theSelectedSlot_; };

    // The currently connected slot in parent webble to be used in slot communication
    var theConnectedSlot_ = '';
    $scope.getConnectedSlot = function(){ return theConnectedSlot_; };

    // Slot connection direction SEND and RECEIVE enable flag
    var slotConnDir_ = {send: true, receive: true};
    $scope.getSlotConnDir = function(){ return slotConnDir_; };

    // when communicating merged slots, the extra needed data for that is found here
    var mcSlotData_ = [];

    // Keeping track of merged combo slot watches being created
    var mergedSlotWatchSetupIndex = 0;

    // watches for slot update between children and parent (which replaces the old concept of update messages)
    var listenToParentSlot = undefined;
    var listenToChildSlot = undefined;

    // List of Webbles whom which this one Share Model (slots) with
    var modelSharees_ = [];
    $scope.getModelSharees = function(){ return modelSharees_; };

    // Flag for this webble to know when its currently creating a modelSharee.
    var isCreatingModelSharee_ = false;
    $scope.getIsCreatingModelSharee = function(){ return isCreatingModelSharee_; };

    // Flag to indicate if this Webble is bundled or not
    var isBundled_ = 0;
    $scope.getIsBundled = function(){ return isBundled_; };
    $scope.setIsBundled = function(newBundleState){ if(newBundleState >= 0){isBundled_ = newBundleState;}else{isBundled_ = 0;} };

    // This property keeps track of any protection setting this webble is currently using
    var theProtectionSetting_ = Enum.bitFlags_WebbleProtection.NO;
    $scope.getProtection = function(){return theProtectionSetting_;};
    //SET more complex and found further down

    // The border that surrounds the webble
    $scope.selectionBorder = {color: 'transparent', width: 3, style: 'solid', glow: '0 0 0px transparent'};

    //A list of Interaction objects that will give the user the power to interact with the webble more easy
    $scope.theInteractionObjects = [];

	// internal user created custom menu items (non template)
	$scope.internalCustomMenu = [];

    // A list of popup menu items that should be disabled and not displayed. Any item id string works to add.
    // For Default menu one should use the registered item names as found in the
    var disabledPopupMenuItems_ = [];
    // addPopupMenuItemDisabled(whatItem), removePopupMenuItemDisabled(whatItem) and isPopupMenuItemDisabled(whatItem)
    // found further down below due to their slight complexity.

    // Changeable Slot name for the slot to be used with interaction ball: Rotate
    var rotateSlot_ = 'root:transform-rotate';
    $scope.getRotateSlot = function(){return rotateSlot_;};
    $scope.setRotateSlot = function(rotateSlotName){rotateSlot_ = rotateSlotName;};

    // Changeable Slot names for the slots to be used with interaction ball: resize
    var resizeSlots_ = {width: undefined, height: undefined};
    $scope.getResizeSlots = function(){return resizeSlots_;};
    $scope.setResizeSlots = function(widthSlotName, heightSlotName){ resizeSlots_ = {width: widthSlotName, height: heightSlotName}; };

	// A Parser and Stringifiers for managing values that are functions or contain functions
	$scope.dynJSFuncParse = function(key, value) { if(value && (typeof value === 'string') && value.indexOf("function") === 0){ return new Function('return ' + value)(); } return value; };
	$scope.dynJSFuncStringify = function (key, value) { if(typeof value === "function"){ return String(value); } return value; };
	$scope.dynJSFuncStringifyAdvanced = function (key, value) {
		if(typeof value === "function"){
			return String(value);
		}
		else if(typeof value === "object" && Object.prototype.toString.call( value ) !== '[object Array]' && !isEmpty(value) ){
			var jsonObjStr = JSON.stringify(value, $scope.dynJSFuncStringify);
			var jsonObj = JSON.parse(jsonObjStr, function(key, value) {
				if(value && (typeof value === 'string') && value.indexOf("function") === 0){
					return String(value);
				}
				return value;
			});
			return jsonObj;
		}
		return value;
	};

    // A function provided by the webble directory that allow us to sett css values to selected elements
    $scope.setStyle = undefined;

    var wblVisibilty_ = true;
    $scope.getWblVisibility = function(){return wblVisibilty_;};
    $scope.setWblVisibility = function(newVal){if(newVal == true || newVal == false){wblVisibilty_ = newVal;}};

    var interactionObjContainerVisibilty_ = false;
    $scope.getInteractionObjContainerVisibility = function(){return interactionObjContainerVisibilty_;};

    // Keeps track if the webbles selection state
    var theSelectState_ = Enum.availableOnePicks_SelectTypes.AsNotSelected;
    $scope.getSelectionState = function(){return theSelectState_;};
    //SET more complex and found further down

    //Mouse X and Y position at last storing point
    var theLastPos_ = {x: 0, y: 0};

    // A set of flags for rescuing weird touch event behavior
    $scope.touchRescueFlags = {
        doubleTapTemporarelyDisabled: false,
        interactionObjectActivated: false
    };

    // A set of useful flags for finding special needs and regulations
    $scope.wblStateFlags = {
        pasteByUser: false,
		customIOTarget: null,
		readyToStoreUndos: false,
		rootOpacityMemory: 1.0
    };
    var _internalWblStateFlags = {
    	displayNamePropDisabledSetting: Enum.SlotDisablingState.None
	};

	$scope.additionalWblRequests = {
		displayNameProp: {
			setDisabledSetting: function (newDisabledSetting) {
				_internalWblStateFlags.displayNamePropDisabledSetting = newDisabledSetting;
			},
			getDisabledSetting: function () {
				return _internalWblStateFlags.displayNamePropDisabledSetting;
			}
		}
	};

    // A set of ongoing timeouts for css-transitions going on, which blocks slot update until finished
    var onGoingTimeOuts = {};

	// A list of active online rooms this Webble is currently signe on to
	var activeOnlineRooms = [];

	// Some memory variables used to remember things for later
	var keepInMind = {
		currentSharedModelSlotsSettings: {}
	};

    //=== EVENT HANDLERS =====================================================================

    // *** TOUCH GESTURE EVENTS ***

    //========================================================================================
    // Double Tap
    // catch touch gesture DOUBLE TAP events for selection of all sorts
    //========================================================================================
    $scope.dblTapEventHandler = function (event) {
        if($(event.target).scope().getInstanceId() == $scope.getInstanceId()){
            if($scope.getCurrentExecutionMode() < Enum.availableOnePicks_ExecutionModes.LowClearanceUser){
                if(!$scope.touchRescueFlags.doubleTapTemporarelyDisabled && isBundled_ == 0){
                    $scope.touchRescueFlags.doubleTapTemporarelyDisabled = true;
                    if($scope.getSelectionState() != Enum.availableOnePicks_SelectTypes.AsNotSelected){
                        $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
                    }
                    else{
                        if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) == 0 || $scope.altKeyIsDown){
                            if($scope.altKeyIsDown){
                                $scope.requestWebbleSelection($scope.theView);
                            }
                            else{
                                $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
                            }
                        }

                    }
                    if(!$scope.$$phase){ $scope.$apply(); }
                    event.stopPropagation();
                    $timeout(function(){$scope.touchRescueFlags.doubleTapTemporarelyDisabled = false;}, 500);
                }
                else if(isBundled_ > 0){
                    $scope.touchRescueFlags.doubleTapTemporarelyDisabled = true;
                    var bndlMstr = $scope.getBundleMaster($scope.theView);

                    if(bndlMstr.scope().getSelectionState() != Enum.availableOnePicks_SelectTypes.AsNotSelected){
                        bndlMstr.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
                    }
                    else{
                        if((parseInt(bndlMstr.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) == 0 || $scope.altKeyIsDown){
                            if($scope.altKeyIsDown){
                                $scope.requestWebbleSelection(bndlMstr.scope().theView);
                            }
                            else{
                                bndlMstr.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
                            }
                        }
                    }

                    if(!$scope.$$phase){ $scope.$apply(); }
                    event.stopPropagation();

                    $timeout(function(){$scope.touchRescueFlags.doubleTapTemporarelyDisabled = false;}, 500);
                }
            }
        }
    };
    //========================================================================================
    ///////////////////////////////////////////////////////////////////////////////////////


	//========================================================================================
	// Mouse Enter Selection
	// Allows to select a Webble by just hover above it if CTRL ALT keys are pressed.
	//========================================================================================
	var mouseEnterSelection = function(event){
		if(event.altKey && event.ctrlKey){
			if($scope.getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
				$scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
			}
			else{
				$scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
			}
		}
	};
	//========================================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Slot Value Changed
    // This method allow the webble to react on slot value changes.
    //========================================================================================
    var slotValueChanged = function(whatSlotName){
        var slot = $scope.getSlot(whatSlotName);
        if (slot != null){
            if (slot.getTimestamp() != 0){
                // Reset the slot timestamp to 0, ready for the slot to be changed again
                slot.resetTimestamp();

                // If this is a element css slot then first try to activate its values based on slot settings
                var ePntr = slot.getElementPntr();
                if (ePntr != undefined){
                    $scope.setStyle(ePntr, slot.getName(), slot.getValue());
                }
            }
        }

		$scope.fireWWEventListener(Enum.availableWWEvents.slotChanged, {targetId: instanceId_, slotName: whatSlotName, slotValue: $scope.gimme(whatSlotName), timestamp: (new Date()).getTime()});
    };
    //========================================================================================


    //========================================================================================
    // Get Slot Connection Form Content
    // This method returns proper content for the slot connection form.
    //========================================================================================
    var getSlotConnFormContent = function(){
        var content = [];
        var childSlots = [{key: 'none', name: gettext("None"), cat: '', val: 'none'}];
        var parentSlots = [{key: 'none', name: gettext("None"), cat: '', val: 'none'}];

        angular.forEach(theSlots_, function (value, key) {
            if(value.getDisabledSetting() < Enum.SlotDisablingState.ConnectionVisibility){
                var tmp = {};
                tmp['key'] = key;
                tmp['name'] = value.getExtDisplayName();
                tmp['cat'] = value.getCategory();
                tmp['val'] = value.getValue();
                this.push(tmp);
            }
        }, childSlots);

        angular.forEach(theParent_.scope().getSlots(), function (value, key) {
            if(value.getDisabledSetting() < Enum.SlotDisablingState.ConnectionVisibility){
                var tmp = {};
                tmp['key'] = key;
                tmp['name'] = value.getExtDisplayName();
                tmp['cat'] = value.getCategory();
                tmp['val'] = value.getValue();
                this.push(tmp);
            }
        }, parentSlots);

        var indexOfEqual = theSelectedSlot_.indexOf('=');
        var selSlot = (indexOfEqual != -1) ? theSelectedSlot_.substr(0, indexOfEqual) : theSelectedSlot_;
        indexOfEqual = theConnectedSlot_.indexOf('=');
        var connSlot = (indexOfEqual != -1) ? theConnectedSlot_.substr(0, indexOfEqual) : theConnectedSlot_;

        if(selSlot == ''){
            selSlot = 'none';
        }

        if(connSlot == ''){
            connSlot = 'none';
        }

        content.push(childSlots, parentSlots, {csName: selSlot, psName: connSlot, mcData: mcSlotData_}, angular.copy(slotConnDir_));

        return content;
    };
    //========================================================================================


    //=========================================================================================
    // Slot Connection Form Values Returned
    // This method reads the form items from the property form and assigns the values to each
    //= corresponding slot or property value.
    //=========================================================================================
    var slotConnValsReturned = function(slotConnData){
        if(slotConnData != null){
            mcSlotData_ = slotConnData[0].mcData;
            if(!isEmpty(mcSlotData_)){
                slotConnData[0].inChild += '=[';
                slotConnData[0].inParent += '=[';

                for(var i = 0; i < mcSlotData_.length; i++){
                    if(i > 0){
                        slotConnData[0].inChild += ', ';
                        slotConnData[0].inParent += ', ';
                    }
                    slotConnData[0].inChild += mcSlotData_[i][0];
                    slotConnData[0].inParent += mcSlotData_[i][1];
                }

                slotConnData[0].inChild += ']';
                slotConnData[0].inParent += ']';
            }

            $scope.connectSlots(slotConnData[0].inParent, slotConnData[0].inChild, slotConnData[1]);
        }
    };
    //=========================================================================================


    //===================================================================================
    // Create Child/Parent Merged Slot Watches
    // Set up watches for all slots that is related with merged content.
    //===================================================================================
    var createChildParentMergedSlotWatches = function(){
        if(mergedSlotWatchSetupIndex < mcSlotData_.length){
            var theChildSlotMCPart = mcSlotData_[mergedSlotWatchSetupIndex][0];
            var theParentSlotMCPart = mcSlotData_[mergedSlotWatchSetupIndex][1];
            mergedSlotWatchSetupIndex++;
            listenToParentSlot.push($scope.$watch(function(){return $scope.getParent().scope().gimme(theParentSlotMCPart);}, function(newVal, oldVal) {
                if (newVal != undefined && (newVal !== oldVal)) {
                    $scope.set(theChildSlotMCPart, newVal);
                }
                if(mergedSlotWatchSetupIndex <= mcSlotData_.length){
                    listenToChildSlot.push($scope.$watch(function(){return $scope.gimme(theChildSlotMCPart);}, function(newVal, oldVal) {
                        if (newVal != undefined && (newVal !== oldVal)) {
                            $scope.getParent().scope().set(theParentSlotMCPart, newVal);
                        }
                    }, true));
                    if(mergedSlotWatchSetupIndex < mcSlotData_.length){
                        createChildParentMergedSlotWatches();
                    }
                }
            }, true));
        }
    };
    //===================================================================================


    //========================================================================================
    // Get Webble Properties Form Content
    // This method returns proper content for the props form.
    //========================================================================================
    var getWblPropsFormContent = function(){
        var content = [$scope.theWblMetadata['templateid']];
        var propsContent = [];

		if($scope.additionalWblRequests.displayNameProp.getDisabledSetting() < Enum.SlotDisablingState.PropertyVisibility){
			propsContent.push({
				key: 'displayname',
				name: gettext("Display Name"),
				value: $scope.theWblMetadata['displayname'],
				cat: 'metadata',
				desc: gettext("The name the Webble is user friendly shown as."),
				disabledSettings: $scope.additionalWblRequests.displayNameProp.getDisabledSetting(),
				isShared: undefined,
				isCustom: undefined,
				notification: '',
				inputType: Enum.aopInputTypes.TextBox,
				originalValType: ''
			});
		}

        angular.forEach(theSlots_, function (value, key) {
            if(value.getDisabledSetting() < Enum.SlotDisablingState.PropertyVisibility){
                var tmp = {};
                var metadata = value.getMetaData() != undefined ? value.getMetaData() : {};
                var theValue = value.getValue();

                if(theValue === undefined){ theValue = ''; }
				if(theValue === null){ theValue = 'NULL'; }
				if(value.getDisabledSetting() == Enum.SlotDisablingState.PropertyEditingAndValue){ theValue = "Not Viewable Format"; }

                // Set prop form key
                tmp['key'] = key;

                // Set prop form 'is Custom made'
                tmp['isCustom'] = value.getIsCustomMade();

				// Set prop form 'original Value Type'
				tmp['originalValType'] = value.getOriginalType();

                // Set prop form display name
                tmp['name'] = value.getDisplayName();

                // adjust numerical values with a more handsome number of decimals
				if(value.getOriginalType() != 'object' && value.getOriginalType() != 'array'){
					var valueParts = valMod.getValUnitSeparated(theValue, true);
					if(valueParts[0].toString() != 'NaN' && !metadata['noFloatValRound']){
						if(mathy.countDecimals(valueParts[0]) > 2){
							theValue = valueParts[0].toFixed(2) + valueParts[1];
						}
					}
				}

                // Set prop form Value
                if(key.search('color') != -1 && theValue.toString().search('rgb') != -1){
                    tmp['value'] = colorService.rgbStrToHex(theValue.toString());
                }
                else if(theValue.toString().toLowerCase() == 'true' || theValue.toString().toLowerCase() == 'false'){
                    tmp['value'] = (theValue.toString().toLowerCase() == 'true');
                }
                else if(value.getOriginalType() != 'array' && (!isNaN(theValue) && metadata.inputType != Enum.aopInputTypes.DatePick)
                    || ($.isArray(theValue) && (((metadata.inputType == Enum.aopInputTypes.Point || metadata.inputType == Enum.aopInputTypes.Size) && theValue.length == 2) || metadata.inputType == Enum.aopInputTypes.MultiListBox || metadata.inputType == Enum.aopInputTypes.MultiCheckBox))
                    || ($.isArray(theValue) && metadata['comboBoxContent'] && metadata['comboBoxContent'].length > 0)){
                    tmp['value'] = theValue;
                }
                else if(metadata.inputType == Enum.aopInputTypes.DatePick){
                    tmp['value'] = new Date(theValue);
                }
				else if(value.getOriginalType() == 'object' || value.getOriginalType() == 'array'){
					tmp['isArrObj'] = true;
					if(theValue != 'NULL'){
						tmp['value'] = JSON.stringify(theValue, $scope.dynJSFuncStringify, 1);
					}
					else{
						tmp['value'] = theValue;
					}

				}
				else if(value.getOriginalType() == 'function'){
					tmp['value'] = String(theValue);
				}
                else{
					if(theValue.length > 0 && theValue[0] == '{' && theValue[theValue.length -1] == '}'){
						try{
							tmp['value'] = JSON.stringify(JSON.parse(theValue, $scope.dynJSFuncParse), $scope.dynJSFuncStringify, 1);
						}
						catch(e){
							tmp['value'] = theValue;
						}
					}
					else{
						if(metadata.inputType == Enum.aopInputTypes.Point && theValue.x && !isNaN(theValue.x) && theValue.y && !isNaN(theValue.y) ){
							tmp['value'] = [theValue.x, theValue.y];
							tmp['vectorObject'] = true;
						}
						else if(metadata.inputType == Enum.aopInputTypes.Size && theValue.w && !isNaN(theValue.w) && theValue.h && !isNaN(theValue.h) ){
							tmp['value'] = [theValue.w, theValue.h];
							tmp['vectorObject'] = true;
						}
						else{
							tmp['value'] = theValue;
						}
						if(key.search('font-family') != -1){
							tmp['value'] = tmp['value'].toString().replace(/"/g, '').replace(/'/g, '').toLowerCase();
						}
					}
                }

                // Set prop form category and description
                tmp['cat'] = value.getCategory();
                tmp['desc'] = value.getDisplayDescription();

                // Set prop form disabled settings
                if(value.getCategory() == 'custom-merged'){
                    tmp['disabledSettings'] = Enum.SlotDisablingState.PropertyEditing;
                }
                else{
                    tmp['disabledSettings'] = value.getDisabledSetting();
                }

                // Set prop form is model shared
                tmp['isShared'] = value['isShared'];
				keepInMind.currentSharedModelSlotsSettings[key] = value['isShared'];

                // Set notification to blank, for use inside prop form to inform user of item value problems
                tmp['notification'] = '';

                // Set metadata content variables which the prop form might care about.
                tmp['comboBoxContent'] = [];
                if(metadata['comboBoxContent'] && metadata['comboBoxContent'].length > 0){
                    tmp['comboBoxContent'] = metadata['comboBoxContent'];
                }
                if(key.search('font-family') != -1){
                    if(metadata['comboBoxContent'] && metadata['comboBoxContent'].length > 0){
                        tmp['comboBoxContent'] = metadata['comboBoxContent'];
                        tmp['comboBoxContent'] = tmp['comboBoxContent'].concat(wwConsts.defaultFontFamilies);
                    }
                    else{
                        tmp['comboBoxContent'] = wwConsts.defaultFontFamilies;
                    }
                }
                tmp['sliderMinMax'] = [0, 1];
                if(metadata['sliderMinMax'] && metadata['sliderMinMax'].length == 2){
                    tmp['sliderMinMax'] = metadata['sliderMinMax'];
                }

                // Set prop form input type
                tmp['inputType'] = Enum.aopInputTypes.TextBox;
                if(metadata.inputType){
                    tmp['inputType'] = metadata.inputType;
                }
                else{
                    if(tmp['value'].toString().toLowerCase() == 'true' || tmp['value'].toString().toLowerCase() == 'false'){
                        tmp['inputType'] = Enum.aopInputTypes.CheckBox;
                    }
                    else if(key.search('color') != -1 || key.substr(key.indexOf(':') + 1) == 'stroke'){
                        tmp['inputType'] = Enum.aopInputTypes.ColorPick;
                    }
                    else if(tmp['comboBoxContent'].length > 0){
                        if(!isNaN(tmp['value'])){
                            tmp['inputType'] = Enum.aopInputTypes.ComboBoxUseIndex;
                        }
                        else if(key.search('font-family') != -1){
                            tmp['inputType'] = Enum.aopInputTypes.FontFamily;
                        }
                        else if($.isArray(tmp['value'])){
                            tmp['inputType'] = Enum.aopInputTypes.MultiListBox;
                        }
                        else{
                            tmp['inputType'] = Enum.aopInputTypes.ComboBoxUseValue;
                        }
                    }
                    else if(!isNaN(tmp['value']) || (tmp['value'].toString().search('px') != -1 && !isNaN(tmp['value'].toString().replace('px', '')))){
                        tmp['inputType'] = Enum.aopInputTypes.Numeral
                    }
                    else if(($.isArray(tmp['value']) && tmp['value'].length == 2 && !isNaN(tmp['value'][0]) && !isNaN(tmp['value'][1]))){
                        tmp['inputType'] = Enum.aopInputTypes.Point
                    }
                    else if((!$.isArray(theValue) && tmp['value'][0] != '{') && (tmp['value'].toString().toLowerCase().search('data:image') != -1 || tmp['value'].toString().toLowerCase().search('.png') != -1 || tmp['value'].toString().toLowerCase().search('.jpg') != -1 || tmp['value'].toString().toLowerCase().search('.gif') != -1) && (tmp['value'].toString().toLowerCase().search('data:audio') == -1) && (tmp['value'].toString().toLowerCase().search('data:video') == -1)){
                      	tmp['inputType'] = Enum.aopInputTypes.ImagePick;
                    }
                    else if((!$.isArray(theValue) && tmp['value'][0] != '{') && (tmp['value'].toString().toLowerCase().search('data:audio') != -1 || tmp['value'].toString().toLowerCase().search('.mp3') != -1 || tmp['value'].toString().toLowerCase().search('.ogg') != -1 || tmp['value'].toString().toLowerCase().search('.wav') != -1) && (tmp['value'].toString().toLowerCase().search('data:image') == -1) && (tmp['value'].toString().toLowerCase().search('data:video') == -1)){
                        tmp['inputType'] = Enum.aopInputTypes.AudioPick;
                    }
                    else if((!$.isArray(theValue) && tmp['value'][0] != '{') && (tmp['value'].toString().toLowerCase().search('data:video') != -1 || tmp['value'].toString().toLowerCase().search('.mp4') != -1 || tmp['value'].toString().toLowerCase().search('.webm') != -1) && (tmp['value'].toString().toLowerCase().search('data:audio') == -1) && (tmp['value'].toString().toLowerCase().search('data:image') == -1)){
                        tmp['inputType'] = Enum.aopInputTypes.VideoPick;
                    }
                }

				if(value.getDisabledSetting() == Enum.SlotDisablingState.PropertyEditingAndValue){
					tmp['inputType'] = Enum.aopInputTypes.Undefined;
				}

                // Wrap it up
                this.push(angular.copy(tmp));
            }
        }, propsContent);
        content.push(propsContent);

        return content;
    };
    //========================================================================================


    //=========================================================================================
    // Property Form Values Returned
    // This method reads the form items from the property form and assigns the values to each
    //= corresponding slot or property value.
    //=========================================================================================
    var PropFormValsReturned = function(formProps){
        if(formProps != null){
			for(var i = 0, p; p = formProps[i]; i++){
				if(p['deleteRequest']){
					$scope.removeSlot(p.key);
				}
			}

            if(!formProps.deleteOnly){
                var theSlotsToSet = {};
                //Shared Model slot update (if such exist)
                if(modelSharees_.length > 0){
					var slotsAreShared = {};
                    for(var slot in theSlots_){
                        for(var i = 0, p; p = formProps[i]; i++){
                            if(slot == p.key){
								slotsAreShared[slot] = p.isShared;
                                if(p.isShared != undefined && theSlots_[slot]['isShared'] != p.isShared){
                                    theSlots_[slot]['isShared'] = p.isShared;
                                    for(var n = 0, ms; ms = modelSharees_[n]; n++){
                                        ms.scope().getSlots()[slot]['isShared'] = p.isShared;
                                        if(p.isShared == true){
                                            ms.scope().set(slot, theSlots_[slot].getValue());
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    }

					if(JSON.stringify(slotsAreShared) != JSON.stringify(keepInMind.currentSharedModelSlotsSettings) ){
						$scope.addUndo({op: Enum.undoOps.sharedModelDuplicateSettings, target: $scope.getInstanceId(), execData: [{sas: keepInMind.currentSharedModelSlotsSettings}]});
					}
                }

                for(var i = 0, p; p = formProps[i]; i++){
                    if(p.key == 'displayname'){
                        if ($scope.theWblMetadata['displayname'] != p.value){
                            $scope.theWblMetadata['displayname'] = p.value;
                        }
                    }
                    else{
                        for(var slot in theSlots_){
                            if(slot == p.key){
                                if (theSlots_[slot].getValue() != p.value && p.disabledSettings < Enum.SlotDisablingState.PropertyEditing){
                                    var itsOk = true;

                                    if(theParent_ && (slot == 'root:left' || slot == 'root:top') && p.value.toString().search('%') != -1){
                                        $log.warn($scope.strFormatFltr('percent(%) values does not work in child webbles, only for super parent webbles in relation to the whole document, therefore this change for {0} slot will not be applied',[slot]));
										$scope.showQIM($scope.strFormatFltr('percent(%) values does not work in child webbles, only for super parent webbles in relation to the whole document, therefore this change for {0} slot will not be applied',[slot]), 4000, {w: 250, h: 90});
                                        itsOk = false;
                                    }

                                    if(itsOk && slot.search('color') != -1 && (theSlots_[slot].getValue().toString().search('#') != -1 || theSlots_[slot].getValue().toString().search('rgb') != -1)){
                                        if(colorService.rgbStrToHex(theSlots_[slot].getValue()) == p.value){
											itsOk = false;
                                        }
                                        else{
                                            if(p.value[0] == '#' && p.value.length > 7){
                                                p.value = colorService.hexToRGBAStr(p.value);
                                            }
                                        }
                                    }

									if(itsOk){
										var metadata = theSlots_[slot].getMetaData();
										if(metadata != null && (metadata.inputType == Enum.aopInputTypes.Point || metadata.inputType == Enum.aopInputTypes.Size)){
											if(JSON.stringify(theSlots_[slot].getValue()) == JSON.stringify(p.value)){
												if(p.vectorObject == true) {
													if(metadata.inputType == Enum.aopInputTypes.Point){
														p.value = {x: p.value[0], y: p.value[1]};
													}
													else{
														p.value = {w: p.value[0], h: p.value[1]};
													}
												}
												itsOk = false;
											}
										}
									}

									if(itsOk && slot.search('font-family') != -1){
										var cleanLowerCaseSlotOrgValue = (theSlots_[slot].getValue().replace(/\"/g, "")).replace(/\'/g, "").toLowerCase();
										if(cleanLowerCaseSlotOrgValue == p.value.toLowerCase()){
											itsOk = false;
										}
									}

                                    if(itsOk){
                                    	var isMultiListType = (metadata != null && (metadata.inputType == Enum.aopInputTypes.MultiListBox || metadata.inputType == Enum.aopInputTypes.MultiCheckBox));
										var isDateType = (metadata != null && metadata.inputType == Enum.aopInputTypes.DatePick);
										if((p.originalValType == 'object' && !isDateType) || (p.originalValType == 'array' && !isMultiListType)) {
											if(JSON.stringify(theSlots_[slot].getValue(), $scope.dynJSFuncStringify, 1) != p.value){
												var jsonParsedVal;
												try{
													jsonParsedVal = JSON.parse(p.value, $scope.dynJSFuncParse);
												}
												catch(e){
													if(p.originalValType == 'object'){
														//jsonParsedVal = valMod.fixBrokenObjStrToProperObject(p.value);
														jsonParsedVal = {};
													}
													else{
														var newArray = [];
														var workStr = p.value.replace(/\s/g,'');
														var isNestedArray = (workStr.replace(/[^\[]/g, "").length >= 2);
														var isUnevenClosure = ((workStr.replace(/[^\[]/g, "").length != workStr.replace(/[^\]]/g, "").length) || (workStr.replace(/[^\{]/g, "").length != workStr.replace(/[^\}]/g, "").length));

														if(!isUnevenClosure){
															if(isNestedArray){
																var workStrStrippedClean = (workStr.replace(/\"/g, "")).replace(/\'/g, "");
																var splittedWorkStr = workStrStrippedClean.split("],[");
																for(var k = 0; k < splittedWorkStr.length; k++){
																	if(k > 0){ splittedWorkStr[k] = "[" + splittedWorkStr[k] }
																	else if(splittedWorkStr[k][0] == '['){ splittedWorkStr[k] = splittedWorkStr[k].substr(1, splittedWorkStr[k].length - 1); }
																	if(k < (splittedWorkStr.length -1)){ splittedWorkStr[k] += "]" }
																	else if(splittedWorkStr[k][splittedWorkStr[k].length - 1] == ']'){ splittedWorkStr[k] = splittedWorkStr[k].substr(0, splittedWorkStr[k].length - 1); }
																	newArray.push(valMod.fixBrokenArrStrToProperArray(splittedWorkStr[k]));
																}
															}
															else{

																newArray = valMod.fixBrokenArrStrToProperArray((workStr.replace(/\"/g, "")).replace(/\'/g, ""));
															}
														}
														jsonParsedVal = newArray;
													}
												}
												theSlotsToSet[slot] = jsonParsedVal;
											}
										}
										else if(p.originalValType == 'function') {
											theSlotsToSet[slot] = $scope.dynJSFuncParse(p.key, p.value);
										}
										else if(p.originalValType == 'vector') {
											theSlotsToSet[slot] = [(isNaN(p.value[0]) == false) ? parseFloat(p.value[0]) : theSlots_[slot].getValue()[0], (isNaN(p.value[1]) == false) ? parseFloat(p.value[1]) : theSlots_[slot].getValue()[1]];
										}
										else if(p.originalValType == 'number' && !isNaN(p.value)) {
											theSlotsToSet[slot] = parseFloat(p.value);
										}
										else{
											theSlotsToSet[slot] = p.value;
										}
                                    }
                                }
                                break;
                            }
                        }
                    }
                }

                for(var sts in theSlotsToSet){
                    $scope.set(sts, theSlotsToSet[sts]);
                }
            }
        }
    };
    //=========================================================================================


    //========================================================================================
    // Get About Webble Content
    // This method returns all valuable information about this Webble for the 'About' info
    // message form.
    //========================================================================================
    var getAboutWblContent = function(){
		var wblDefMetaData = $scope.getWebbleDefsMetaDataMemory()[$scope.theWblMetadata['defid']];
		if(wblDefMetaData == undefined){ wblDefMetaData = {rating: 0, ratingCount: 0, image: '', created: undefined, updated: undefined, isShared: false, isTrusted: false, isVerified: false}; }
        return {
            displayname: $scope.theWblMetadata['displayname'],
			image: wblDefMetaData.image != "" ? wblDefMetaData.image : $scope.theWblMetadata['image'],
			rating: wblDefMetaData.rating,
			ratingCount: wblDefMetaData.ratingCount,
			created: wblDefMetaData.created,
			updated: wblDefMetaData.updated,
			isShared: wblDefMetaData.isShared,
			isTrusted: wblDefMetaData.isTrusted,
			isVerified: wblDefMetaData.isVerified,
            instanceid: $scope.getInstanceId(),
            defid: $scope.theWblMetadata['defid'],
            author: $scope.theWblMetadata['author'],
            description: $scope.theWblMetadata['description'],
            keywords: $scope.theWblMetadata['keywords'],
            templateid: $scope.theWblMetadata['templateid'],
            templaterevision: $scope.theWblMetadata['templaterevision'],
            wblPlatformScope: $scope
        };
    };
    //========================================================================================


    //========================================================================================
    // Init Interaction Objects
    // This method creates and prepares the default interaction objects.
    //========================================================================================
    var initInteractionObjects = function(){
        for(var dio in Enum.availableOnePicks_DefaultInteractionObjects){
            var index = Enum.availableOnePicks_DefaultInteractionObjects[dio];
            var text = gettextCatalog.getString(Enum.availableOnePicks_DefaultInteractionObjectsTooltipTxt[dio]);

            for(var i = 0; i < $scope.theInteractionObjects.length; i++){
                if($scope.theInteractionObjects[i].scope().getIndex() == index){
                    $scope.theInteractionObjects[i].scope().tooltip = text;
                    $scope.theInteractionObjects[i].scope().setName(dio);
                    if((index) != Enum.availableOnePicks_DefaultInteractionObjects.Rescale || ($scope.user != undefined && $scope.user.role == 'adm')){
                        $scope.theInteractionObjects[i].scope().setIsEnabled(true);
                    }
                }
            }
        }

        if($scope.theView.scope().customInteractionBalls){
            for(var i = 0, cib; cib = $scope.theView.scope().customInteractionBalls[i]; i++){
                for(var n = 0, ib; ib = $scope.theInteractionObjects[n]; n++){
                    if(ib.scope().getIndex() == cib.index){
                        ib.scope().tooltip = cib.tooltipTxt;
                        ib.scope().setName(cib.name);
                        ib.scope().setIsEnabled(true);
                    }
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Custom Webble Definition Items
    // This method checks if the template part of the webble wants to include som data in the
    // webble def object.
    //========================================================================================
    var getCustomWblDefItems = function(){
        if ($scope.theView.scope().coreCall_CreateCustomWblDef){
            return $scope.theView.scope().coreCall_CreateCustomWblDef();
        }
        else{
            return {};
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Modified Webble Definition Position Offset
    // This method returns  a modified version of a webble definition object where all webbles
    // in the object has had there position offset by the value sent as parameter.
    //========================================================================================
    var getModifiedWblDefPosOffset = function(whatWblDef, offSet){
        var slotLists = jsonQuery.allObjWithKey(whatWblDef, 'slots');

        for(var i = 0; i < slotLists.length; i++){
            for(var n = 0, s; s = slotLists[i]['slots'][n]; n++){
                // Grab the left pos value and modify it
                if(s.name === 'root:left'){
                    var valUnit = valMod.getValUnitSeparated(s.value);
                    s.value = isNaN(valUnit[0]) ? '' : (valUnit[0] + (valUnit[1] == 'px' ? offSet.x : (offSet.x * 0.1))) + valUnit[1]
                }
                // Grab the top pos value and modify it
                else if(s.name === 'root:top'){
                    var valUnit = valMod.getValUnitSeparated(s.value);
                    s.value = isNaN(valUnit[0]) ? '' : (valUnit[0] + (valUnit[1] == 'px' ? offSet.y : (offSet.y * 0.1))) + valUnit[1]
                }
            }
        }
        return whatWblDef;
    };
    //========================================================================================


    //========================================================================================
    // Get Modified Webble Definition With Absolute Positions
    // This method returns  a modified version of a webble definition object where all webbles
    // in the object has had there position changed to absolute values
    //========================================================================================
    var getModifiedWblAbsolutePos = function(whatWblDef){
        var subWblList = jsonQuery.allObjWithKey(whatWblDef, 'webble');

        var helpElement = angular.element(document.createElement("div"));
        helpElement.css('position', 'absolute');
        $scope.getWSE().append(helpElement);

        for(var i = 0, w; w = subWblList[i]; i++){
            var thisWbl = $scope.getWebbleByInstanceId(w['webble'].instanceid);
            var wblAbsPos = $scope.getWblAbsPosInPixels(thisWbl);

            if(theParent_ && theParent_.scope().getChildContainer() && theParent_.scope().getChildContainer().attr('id') != 'wblChildContainer'){
                var parentAbsPosInPx = $scope.getWblAbsPosInPixels(theParent_);
                var childContainerOffset = theParent_.scope().getChildContainer().offset();
                childContainerOffset.left = parentAbsPosInPx.x - (childContainerOffset.left - 2);
                childContainerOffset.top = parentAbsPosInPx.y - (childContainerOffset.top - 2 - parseInt($scope.wsTopPos));

                if(childContainerOffset.left != 0){
                    childContainerOffset.left -= 1;
                    wblAbsPos.x = wblAbsPos.x - childContainerOffset.left;
                }
                if(childContainerOffset.top != 0){
                    childContainerOffset.top -= 1;
                    wblAbsPos.y = wblAbsPos.y - childContainerOffset.top;
                }
            }

            var valUnitPos = {x: valMod.getValUnitSeparated(thisWbl.scope().gimme('root:left')), y: valMod.getValUnitSeparated(thisWbl.scope().gimme('root:top'))};
            helpElement.css('left', wblAbsPos.x);
            helpElement.css('top', wblAbsPos.y);
            var cssValPos = {x: getUnits(helpElement[0], 'left')[getUnitMap(valUnitPos.x[1])], y: getUnits(helpElement[0], 'top')[getUnitMap(valUnitPos.y[1])]};
            var slotList = w['webble'].slotdata.slots;

            for(var n = 0, s; s = slotList[n]; n++){
                // Grab the left pos value and modify it
                if(s.name === 'root:left'){
                    s.value = cssValPos.x.toFixed(2) + valUnitPos.x[1];
                }
                // Grab the top pos value and modify it
                else if(s.name === 'root:top' && valUnitPos.y[1] != '%'){
                    s.value = cssValPos.y.toFixed(2) + valUnitPos.y[1]
                }
            }
        }
        helpElement.remove();
        return whatWblDef;
    };
    //========================================================================================


    //========================================================================================
    // Get Modified Webble Definition With Absolute Positions
    // This method returns  a modified version of a webble definition object where its
	// z-index layer value is increased with one.
    //========================================================================================
    var getModifiedWblZIndex = function(whatWblDef){
        var slotList = whatWblDef['webble'].slotdata.slots;

        for(var i = 0, s; s = slotList[i]; i++){
            // Grab the z-index value and modify it
            if(s.name === 'root:z-index'){
                s.value = parseInt(s.value) + 1;
            }
        }
        return whatWblDef;
    };
    //========================================================================================



    //========================================================================================
    // Adjust Position
    // This method adjust the position of the webble, mainly in relation to a parent so it
    //= will keep the same position as before it got or lost the parent.
    //========================================================================================
    var adjustPositionInRelationToParent  = function(isPeeling){
        var childAbsPosInPx = {x: getUnits($scope.theView.parent()[0], 'left').pixel, y: getUnits($scope.theView.parent()[0], 'top').pixel};
        var parentAbsPosInPx = $scope.getWblAbsPosInPixels(theParent_);
        var childContainerOffset = {left: 0, top: 0};

        if(theParent_ && theParent_.scope().getChildContainer() && theParent_.scope().getChildContainer().attr('id') != 'wblChildContainer' && ($scope.wblStateFlags.pasteByUser || isPeeling)){
            childContainerOffset = theParent_.scope().getChildContainer().offset();
            childContainerOffset.left = parentAbsPosInPx.x - (childContainerOffset.left - 2);
            childContainerOffset.top = parentAbsPosInPx.y - (childContainerOffset.top - 2 - parseInt($scope.wsTopPos));
            if(childContainerOffset.left != 0){ childContainerOffset.left -= 1; }
            if(childContainerOffset.top != 0){ childContainerOffset.top -= 1; }
            $scope.wblStateFlags.pasteByUser = false;
        }

        var newPos = {x: childAbsPosInPx.x - parentAbsPosInPx.x + childContainerOffset.left, y: childAbsPosInPx.y - parentAbsPosInPx.y + childContainerOffset.top};
        if(isPeeling){
            newPos = {x: childAbsPosInPx.x + parentAbsPosInPx.x - childContainerOffset.left, y: childAbsPosInPx.y + parentAbsPosInPx.y - childContainerOffset.top};
        }

        $scope.theView.parent().css('left', newPos.x);
        $scope.theView.parent().css('top', newPos.y);

        var posWithUnit = {x: valMod.getValUnitSeparated($scope.gimme('root:left')), y: valMod.getValUnitSeparated($scope.gimme('root:top'))};
        var cssPosInUnit = {x: getUnits($scope.theView.parent()[0], 'left')[getUnitMap(posWithUnit.x[1])], y: getUnits($scope.theView.parent()[0], 'top')[getUnitMap(posWithUnit.y[1])]};

		$scope.BlockNextAddUndo();
        $scope.set('root:left', cssPosInUnit.x.toFixed(2) + posWithUnit.x[1]);
		$scope.BlockNextAddUndo();
        $scope.set('root:top', cssPosInUnit.y.toFixed(2) + posWithUnit.y[1]);
    };
    //========================================================================================


    //=========================================================================================
    // Transfer Slot Value From Webble Definition
    // This method assigns json slot values to internal slots.
    //=========================================================================================
    var transferSlotValueFromWblDef = function(whatWblDef){
        var defSlots = whatWblDef.slotdata.slots;
        var haveIt; // ctrl variable that checks if the slot already exist

        // iterate the slots found in the def and compare with the ones already existing
        for (var i = 0; i < defSlots.length; i++){
            haveIt = false;    // reset the ctrl variable

            // if they match by name they are the same...
            if (defSlots[i].name in theSlots_){
                haveIt = true;  //...and that is registered by the ctrl variable

                //var theVal = parseValue(defSlots[i].value);
                var theVal = defSlots[i].value;

                // assigning the def stored value to the slot in question (unless it is root:opacity, since we wait with that after all Webbles in a set is loaded)
				if(defSlots[i].name != "root:opacity"){
					$scope.set(defSlots[i].name, theVal);
				}
				else{
					$scope.wblStateFlags.rootOpacityMemory = parseFloat(theVal);
				}

                if (defSlots[i].metadata != null && defSlots[i].metadata != 'null' && defSlots[i].metadata != ''){
                    var slotMetadata = defSlots[i].metadata;
                    if (Object.keys(slotMetadata).length == 0){
                        slotMetadata = null;
                    }
                    theSlots_[defSlots[i].name].setMetaData(slotMetadata);
                }
            }

            // If the slot in the def was not found in the webble collection then it is a
            // new one which should be added.
            if (!haveIt)
            {
                var slotValue = defSlots[i].value;

                if (defSlots[i].metadata != null && defSlots[i].metadata != 'null' && defSlots[i].metadata != ''){
                    var slotMetadata = defSlots[i].metadata;
                    if (Object.keys(slotMetadata).length == 0){
                        slotMetadata = null;
                    }
                }
                else{
                    slotMetadata = null;
                }

                var displayInfo = strCatcher.getAutoGeneratedDisplayInfo(defSlots[i].name);
                $scope.addSlot(new Slot(defSlots[i].name,
                    slotValue,
                    displayInfo.name,
                    displayInfo.desc,
                    defSlots[i].category,
                    slotMetadata));
                theSlots_[defSlots[i].name].setIsCustomMade(true);
            }
        }
    };
    //=========================================================================================


    //========================================================================================
    // Reconnect Custom Visual Element Slots To CSS Attributes
    // This method finds and reconnect all css related custom slots with the correct html
    // element.
    //========================================================================================
    var reconnectCustomVisualElementSlotsToCSSAttributes = function(){
        var custCssSlots = [];
        for(var slot in theSlots_){
            if(theSlots_[slot].getCategory() == 'custom-css'){
                custCssSlots.push(theSlots_[slot]);
            }
        }

        if(custCssSlots.length > 0){
            // make sure all elements has ids, the same way that they got them when the custom slot was created
            var index = 0;
            $scope.theView.find('*').addBack().each(function(){
                var tagName = $(this).get(0).tagName;
                var elmId = $(this).attr('id');
                if(!elmId){
                    index++;
                    elmId = 'myElement' + index + '_' + tagName;
                    $(this).attr('id', elmId);
                }
            });

            for(var i = 0, cs; cs = custCssSlots[i]; i++){
                var elementId = '#' + cs.getName().substr(0, cs.getName().indexOf(':'));
                var theElmnt = $scope.theView.parent().find(elementId);

                if(elementId == '#root'){
                  theElmnt = $scope.theView.parent();
                }
                cs.setElementPntr(theElmnt);

                if(cs.getName() == 'root:transition'){
                    var sn = cs.getName(), sv = cs.getValue();
                    $timeout(function(){$scope.setStyle(theElmnt, sn, sv);});
                }
                else{
                    $scope.setStyle(theElmnt, cs.getName(), cs.getValue());
                }
            }
        }
    };
    //========================================================================================


	//========================================================================================
	// System Internal Slot Update
	// If this Webble has purely internal system made slots that is used for internal
	// configuration, then read those values are and update the Webble accordingly.
	//========================================================================================
	var systemInternalSlotUpdate = function(){
		var ccm = $scope.gimme('customContextMenu');
		if(ccm != null){
			$scope.getSlot('customContextMenu').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
			for(var j = 0, dmi; dmi = ccm.dmi[j]; j++){
				$scope.addPopupMenuItemDisabled(dmi);
			}

			for(var i = 0, cmi; cmi = ccm.cmi[i]; i++){
				$scope.internalCustomMenu.push({itemId: cmi.id, itemTxt: cmi.name});
				if(cmi.enabled == false){
					$scope.addPopupMenuItemDisabled(cmi.id);
				}
			}
		}

		var cio = $scope.gimme('customInteractionObjects');
		if(cio != null){
			$scope.getSlot('customInteractionObjects').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
			for(var i = 0, io; io = cio[i]; i++) {
				$scope.theInteractionObjects[i].scope().setName(io.name);
				$scope.theInteractionObjects[i].scope().tooltip = io.tooltip;
				$scope.theInteractionObjects[i].scope().setIsEnabled(io.enabled);
			}
		}
	};
	//========================================================================================


    //========================================================================================
    // Get Model Sharees As Instance Ids
    // This method iterate the list of modelsharees and create a new list with their instance
    // id's instead of their element pointers.
    //========================================================================================
    var getModelShareesForWblDef = function(){
        var modelShareeList = [];
        var slotShareeList = [];
        for(var i = 0, ms; ms = modelSharees_[i]; i++){
            modelShareeList.push(ms.scope().getInstanceId());
        }

        for(var slot in theSlots_){
            if(theSlots_[slot]['isShared'] != undefined && theSlots_[slot]['isShared'] == true){
                slotShareeList.push(slot);
            }
        }

        return {wbls: modelShareeList, slots: slotShareeList};
    };
    //========================================================================================


    //========================================================================================
    // Model Shared Update
    // If this Webble share model with any other Webble, then those Webbles need to be updated
    //========================================================================================
    var modelSharedUpdate = function(slotName, slotValue){
        if(theSlots_[slotName]['isShared'] == true){
            for(var i = 0, ms; ms = modelSharees_[i]; i++){
                ms.scope().set(slotName, slotValue);
            }
        }
    };
    //========================================================================================


	//========================================================================================
	// Get Calculated Value
	// This method gets a formula string and replace slot names with slot values and other id
	// names with its associated values before it evaluates the formula and return the result.
	//========================================================================================
	var getCalculatedValue = function(whatCalc, event){
		var toBeCalculated = whatCalc;
		if(toBeCalculated[0] == '='){ toBeCalculated = toBeCalculated.substr(1); }

		var workStr = toBeCalculated;
		var slotStr;

		do {
			var testIndex1 = workStr.indexOf('[');
			var testIndex2 = workStr.indexOf(']');
			slotStr = '';

			if(testIndex1 != -1 && testIndex2 != -1 && testIndex2 > testIndex1){
				slotStr = workStr.substring(testIndex1 + 1, testIndex2);
			}

			var slotVal;
			if(slotStr != ''){
				slotVal = $scope.gimme(slotStr);
			}

			if (slotVal == undefined && slotStr.search('mouseDelta') != -1 && event != undefined) {
				if (slotStr == 'mouseDeltaX') {
					slotVal = (event.clientX - theLastPos_.x);
				}
				else {
					slotVal = (event.clientY - theLastPos_.y);
				}
			}

			if(slotVal != undefined && !isNaN(parseFloat(slotVal))){
				slotVal = parseFloat(slotVal);
			}

			if(slotVal != undefined){
				if(slotVal.toString() != '[object Object]'){
					toBeCalculated = toBeCalculated.replace(('[' + slotStr  +']'), slotVal);
				}
				else{
					toBeCalculated = toBeCalculated.replace(('[' + slotStr  +']'), JSON.stringify(slotVal, $scope.dynJSFuncStringify));
				}
			}

			workStr = workStr.substring(testIndex2 + 1);
		} while (slotStr.length > 0);

		try{ toBeCalculated = eval(toBeCalculated); } catch(err){ }

		return toBeCalculated;
	};
	//========================================================================================


	//===================================================================================
	// Internal Custom Menu Activity Reaction
	// If this template has some internal user generated menu customizations then that
	// is handled here with the use of the slot that carries its data.
	//===================================================================================
	var internalCustomMenuActivityReaction = function(itemName){
		var ccm = $scope.gimme('customContextMenu');
		if(ccm != null){
			for(var i = 0, cmi; cmi = ccm.cmi[i]; i++){
				if(cmi.id == itemName){
					for(var j = 0, ap; ap = cmi.actionPack[j]; j++){
						$scope.set(ap.slot, getCalculatedValue(ap.formula));
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Internal Custom Interaction Object Activity Reaction
	// If this template has some internal user generated Interaction Object
	// customizations then that is handled here with the use of the slot that carries
	// its data.
	//===================================================================================
	var internalCustomInteractionObjectActivityReaction = function(targetName, event){
		var cio = $scope.gimme('customInteractionObjects');
		if(cio != null){
			for(var i = 0, io; io = cio[i]; i++){
				if(io.name == targetName){
					if(io.mouseEvType == 'Mouse Click'){
						for(var j = 0, ap; ap = io.actionPack[j]; j++){
							$scope.set(ap.slot, getCalculatedValue(ap.formula));
						}
					}
					else{
						theLastPos_ = {x: event.clientX, y: event.clientY};
						$scope.wblStateFlags.customIOTarget = io;

						$scope.getPlatformElement().bind('vmouseup', function(event){
							$scope.getPlatformElement().unbind('vmousemove');
							$scope.getPlatformElement().unbind('vmouseup');
							$scope.wblStateFlags.customIOTarget = null;
						});

						$scope.getPlatformElement().bind('vmousemove', function(event){
							event.preventDefault();
							for (var j = 0, ap; ap = $scope.wblStateFlags.customIOTarget.actionPack[j]; j++) {
								$scope.set(ap.slot, getCalculatedValue(ap.formula, event));
							}

							theLastPos_ = {x: event.clientX, y: event.clientY};
						});
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Assign Resize Custom Slot
	// If the user creates a width and height slot as custom slot and previously do not
	// have any webble resize slots then the custom slot will be used.
	//===================================================================================
	var assignResizeCustomSlot = function(theSelWbl,newCustomSlot){
		if(!(theSelWbl.scope().getResizeSlots().width) && !(theSelWbl.scope().getResizeSlots().height)){
			if(newCustomSlot.getName().search('width') != -1 || newCustomSlot.getName().search('height') != -1){
				var elementId = newCustomSlot.getName().substr(0, newCustomSlot.getName().indexOf(':'));
				if(theSelWbl.scope().gimme(elementId+":width") && theSelWbl.scope().gimme(elementId+":height")){
					theSelWbl.scope().setResizeSlots(elementId+":width", elementId+":width");

					for(var i = 0, io; io = theSelWbl.scope().theInteractionObjects[i]; i++){
						if(io.scope().getName() == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Resize)){
							io.scope().setIsEnabled(true);
							break;
						}
					}
				}
			}
		}
	};
	//========================================================================================


    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    //=
    //= ActivateInteractionObject
    //=
    //= Parameter				    Description
    //= ---------				    -----------
    //= interactionObjectNameId     the id string name of the interaction object to manipulate
    //= eventType                   the type of the event that caused this call (click or move etc)
    //= e                           mouse event arguments      ]
    //=
    //= Returns: nothing
    //=
    //= This method reacts on Interaction object manipulation.
    //=
    //= The index positions are as follows
    //=     0,4,8--------1
    //=     |            5
    //=     |            9
    //=     |            |
    //=     |            |
    //=     11           |
    //=     7            |
    //=     3-------2,6,10
    //=
    //========================================================================================
    $scope.activateInteractionObject = function(event){
        $scope.touchRescueFlags.interactionObjectActivated = true;
        var targetName = $(event.target).scope().getName();

        if (targetName != ""){
            //=== Menu ====================================
            if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Menu)){
                $(this).contextMenu({
                    x: $scope.getWblAbsPosInPixels($scope.theView).x + 20,
                    y: $scope.getWblAbsPosInPixels($scope.theView).y + 60
                });
            }
            //=============================================

            //=== Rotate ==================================
            else if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Rotate)){
                theLastPos_ = {x: event.clientX, y: event.clientY};
				$scope.addUndo({op: Enum.undoOps.setSlot, target: $scope.getInstanceId(), execData: [{slotname: rotateSlot_, slotvalue: $scope.gimme(rotateSlot_)}]});

                $scope.getPlatformElement().bind('vmouseup', function(event){
                    $scope.getPlatformElement().unbind('vmousemove');
                    $scope.getPlatformElement().unbind('vmouseup');
					$scope.UnblockAddUndo();
                });

                $scope.getPlatformElement().bind('vmousemove', function(event){
					$scope.BlockAddUndo();
                    event.preventDefault();
                    // Set the angle slots
                    $scope.set(rotateSlot_, parseFloat($scope.gimme(rotateSlot_)) + ((event.clientX - theLastPos_.x)));
                    theLastPos_ = {x: event.clientX, y: event.clientY};
                });
            }
            //=============================================

            //=== Rescale ==================================
            else if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Rescale)){
                if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.RESIZE, 10)) == 0){
                    theLastPos_ = {x: event.clientX, y: event.clientY};
                    $scope.addUndo({op: Enum.undoOps.setSlot, target: $scope.getInstanceId(), execData: [{slotname: 'root:transform-scale', slotvalue: $scope.gimme('root:transform-scale')}]});

                    $scope.getPlatformElement().bind('vmouseup', function(event){
                        $scope.getPlatformElement().unbind('vmousemove');
                        $scope.getPlatformElement().unbind('vmouseup');
						$scope.UnblockAddUndo();
                    });

                    $scope.getPlatformElement().bind('vmousemove', function(event){
						$scope.BlockAddUndo();
                        // Set the scale slot
                        var scale = $scope.gimme('root:transform-scale');
                        $scope.set('root:transform-scale', [parseFloat((parseFloat(scale[0]) + ((event.clientX - theLastPos_.x) * 0.01)).toFixed(2)), parseFloat((parseFloat(scale[1]) + ((event.clientY - theLastPos_.y) * 0.01)).toFixed(2))]);
                        theLastPos_ = {x: event.clientX, y: event.clientY};
                    });
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Set Size Slot Failed"), content: gettext("This Webble is protected from resizing and therefore this operation is canceled.")}, null);
                }
            }
            //=============================================

            //=== Assign Parent ===================================
            else if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent)){
                $scope.assignParent();
            }
            //=============================================

            //=== Resize ===================================
            else if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Resize)){
                if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.RESIZE, 10)) == 0){
                    if(resizeSlots_.width && resizeSlots_.height){
                        $scope.addUndo({op: Enum.undoOps.setSlot, target: $scope.getInstanceId(), execData: [{slotname: resizeSlots_.width, slotvalue: $scope.gimme(resizeSlots_.width)}, {slotname: resizeSlots_.height, slotvalue: $scope.gimme(resizeSlots_.height)}]});

                        theLastPos_ = {x: event.clientX, y: event.clientY};
                        var theSlotElements = {w: $scope.getSlot(resizeSlots_.width).getElementPntr(), h: $scope.getSlot(resizeSlots_.height).getElementPntr()};
                        var orgSize = {w: getUnits(theSlotElements.w[0], 'width').pixel, h: getUnits(theSlotElements.h[0], 'height').pixel};
                        var helpElement = angular.element(document.createElement("div"));
                        helpElement.css('position', 'absolute');
                        $scope.theView.parent().append(helpElement);

                        $scope.getPlatformElement().bind('vmouseup', function(event){
                            helpElement.remove();
                            $scope.getPlatformElement().unbind('vmousemove');
                            $scope.getPlatformElement().unbind('vmouseup');
							$scope.UnblockAddUndo();
                        });

                        $scope.getPlatformElement().bind('vmousemove', function(event){
							$scope.BlockAddUndo();
                            helpElement.css('width', orgSize.w + (event.clientX - theLastPos_.x));
                            helpElement.css('height', orgSize.h + (event.clientY - theLastPos_.y));
                            var valUnitSize = {w: valMod.getValUnitSeparated($scope.gimme(resizeSlots_.width)), h: valMod.getValUnitSeparated($scope.gimme(resizeSlots_.height))};
                            var cssSize = {w: getUnits(helpElement[0], 'width')[getUnitMap(valUnitSize.w[1])], h: getUnits(helpElement[0], 'height')[getUnitMap(valUnitSize.h[1])]};
                            if(isNaN(cssSize.w)){
                                cssSize.w = 0;
                                valUnitSize.w[1] = 'px'
                            }
                            if(isNaN(cssSize.h)){
                                cssSize.h = 0;
                                valUnitSize.h[1] = 'px'
                            }
                            $scope.set(resizeSlots_.width, cssSize.w.toFixed(2) + valUnitSize.w[1]);
                            $scope.set(resizeSlots_.height, cssSize.h.toFixed(2) + valUnitSize.h[1]);
                        });
                    }
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Set Size Slot Failed"), content: gettext("This Webble is protected from resizing and therefore this operation is canceled.")}, null);
                }
            }
            //=============================================

			//=== USER GENERATED ====================================================================
			else{
				internalCustomInteractionObjectActivityReaction(targetName, event);
			}
			//=======================================================================================

        }

        if ($scope.theView.scope().coreCall_Event_InteractionObjectActivityReaction){
            $scope.theView.scope().coreCall_Event_InteractionObjectActivityReaction(event);
        }
        event.stopPropagation();
        $timeout(function(){$scope.touchRescueFlags.interactionObjectActivated = false;},500);
    };
    //========================================================================================


    //========================================================================================
    // ActivateMenuItem
    // This method reacts on context menu item click.
    //========================================================================================
    $scope.activateMenuItem = function(itemName){
		$scope.fireWWEventListener(Enum.availableWWEvents.wblMenuExecuted, {targetId: instanceId_, menuId: itemName, timestamp: (new Date()).getTime()});

        //=== ASSIGN PARENT ==================================================================
        if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.AssignParent)){
            if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_CONNECT, 10)) == 0){
                $scope.assignParent();
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Assign Parent Failed"), content: gettext("This Webble is protected from getting a parent and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== BRING LAYER FORWARD ============================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.BringFwd)){
            var mostHighZ = $scope.getWinningSlotValueAmongAllWebbles('root:z-index', false);
            mostHighZ.value = parseInt(mostHighZ.value);
            $scope.set('root:z-index', (isNaN(mostHighZ.value) ? 0 : (mostHighZ.value  + 1)));
        }
        //=======================================================================================

        //=== CONNECT SLOTS ==================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.ConnectSlots)){
            $scope.openForm(Enum.aopForms.slotConn, getSlotConnFormContent(), slotConnValsReturned);
        }
        //=======================================================================================

        //=== DUPLICATE ===========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Duplicate)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.DUPLICATE, 10)) == 0){
                $scope.duplicate({x: 15, y: 15}, undefined);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Duplication Failed"), content: gettext("This Webble is protected from duplication and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== DELETE =========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Delete)){
			$scope.requestDeleteWebble($scope.theView);
			return;

        }
        //=======================================================================================

        //=== PROPERTIES =====================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Props)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.PROPERTY, 10)) == 0){
                $scope.openForm(Enum.aopForms.wblProps, getWblPropsFormContent(), PropFormValsReturned);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Set Property Failed"), content: gettext("This Webble is protected from slot and property change and therefore this operation is canceled.")}, null);
            }

        }
        //=======================================================================================

        //=== REVOKE PARENT ==================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.RevokeParent)){
            if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT, 10)) == 0){
                $scope.peel();
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Revoke Parent Failed"), content: gettext("This Webble is protected from revoking its parent and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== PUBLISH ==========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Publish)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) == 0){
                $scope.requestPublishWebble($scope.theView);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Publish Webble Attempt Failed"), content: gettext("This Webble (or one related) is protected from publishing and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== SHARED DUPLICATE ===================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.SharedDuplicate)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE, 10)) == 0){
                $scope.sharedModelDuplicate({x: 15, y: 15}, $scope.connectSharedModel);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Duplication Failed"), content: gettext("This Webble is protected from Shared Model Duplication and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== BUNDLE ============================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Bundle)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE, 10)) == 0){
                $scope.configureBundle($scope.getAllDescendants($scope.theView));
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Bundle Failed"), content: gettext("This Webble is protected from Bundling and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== UNBUNDLE ============================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Unbundle)){
            if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.UNBUNDLE, 10)) == 0){
                if($scope.theWblMetadata['templateid'] == 'bundleTemplate'){
                    if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
						socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.unbundle, target: $scope.getInstanceId()});
                        $scope.setEmitLockEnabled(true);
                    }
					var listOfBundleChildren = [];
                    for(var i = 0, bcWbl; bcWbl = $scope.getAllDescendants($scope.theView)[i]; i++){
						bcWbl.scope().setIsBundled(bcWbl.scope().getIsBundled() - 1);
						if(bcWbl.scope().theWblMetadata['templateid'] != $scope.theView.scope().theWblMetadata['templateid']){
							listOfBundleChildren.push(bcWbl.scope().theWblMetadata['defid']);
						}
                    }

                    while(theChildren_.length > 0){
                        theChildren_[0].scope().peel();
                    }

					$scope.addUndo({op: Enum.undoOps.unbundle, target: undefined, execData: [{wblDef: $scope.createWblDef(true)}]});
                    $scope.requestDeleteWebble($scope.theView, false);
					$scope.updateListOfUntrustedWebbles(listOfBundleChildren);
                    $timeout(function(){ $scope.setEmitLockEnabled(false);}, 100);
                }
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Unbundle Failed"), content: gettext("This Webble is protected from Unbundling and therefore this operation is canceled.")}, null);
            }
        }
        //=======================================================================================

        //=== PROTECT ===========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Protect)){
            $scope.openForm(Enum.aopForms.protect, theProtectionSetting_, function(newProtectionSetting){
                if(newProtectionSetting != null && !isNaN(newProtectionSetting)){
                    $scope.setProtection(newProtectionSetting);
                    for(var i = 0, selWbl; selWbl = $scope.getSelectedWebbles()[i]; i++ ){
                        selWbl.scope().setProtection(newProtectionSetting);
                    }
                }
            });
        }
        //=======================================================================================

        //=== ADD CUSTOM SLOTS ===========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.AddCustomSlots)){
            $scope.openForm(Enum.aopForms.addCustSlot, $scope.theView, function(retVal){
                if(!retVal){
                    $log.log('Custom slot was canceled or not added successfully');
                }
				else{
					for(var i = 0, selWbl; selWbl = $scope.getSelectedWebbles()[i]; i++ ){
						if(selWbl.scope().getInstanceId() != $scope.getInstanceId()){
							var sltElmnt = undefined;
							if(retVal.getElementPntr() != undefined && retVal.getCategory() == 'custom-css'){
								var elementId = '#' + retVal.getName().substr(0, retVal.getName().indexOf(':'));
								var theElmnt = selWbl.scope().theView.parent().find(elementId);
								if(elementId == '#root'){
									theElmnt = selWbl.scope().theView.parent();
								}
								sltElmnt = theElmnt;
								if(retVal.getName() == 'root:transition'){
									var sn = retVal.getName(), sv = retVal.getValue();
									$timeout(function(){$scope.setStyle(theElmnt, sn, sv);});
								}
								else{
									$scope.setStyle(theElmnt, retVal.getName(), retVal.getValue());
								}
								if (sltElmnt.length == 0) {
									sltElmnt = null
								}
							}
							else if(retVal.getCategory() == 'custom-merged' && retVal.getValue().length > 0){
								for(var i = 0, slotname; slotname = retVal.getValue()[i]; i++){
									if(selWbl.scope().gimme(slotname) == null){
										sltElmnt = null;
										break;
									}
								}
							}

							if(sltElmnt !== null){
								var theNewSlot = new Slot(retVal.getName(),
									retVal.getValue(),
									retVal.getDisplayName(),
									retVal.getDisplayDescription(),
									retVal.getCategory(),
									undefined,
									sltElmnt
								);
								theNewSlot.setIsCustomMade(true);
								selWbl.scope().addSlot(theNewSlot);
								assignResizeCustomSlot(selWbl, theNewSlot);
							}
						}
					}
				}
            });
        }
        //=======================================================================================

		//=== EDIT CUSTOM MENU ITEMS ===========================================================================
		else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.EditCustomMenuItems)){
			$scope.openForm(Enum.aopForms.editCustMenuItems, $scope.theView, function(retVal){
				if(retVal != null){
					if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
						socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.setCustomMenu, target: $scope.getInstanceId(), customMenu: retVal});
					}
				}
			});
		}
		//=======================================================================================

		//=== EDIT CUSTOM INTERACTION OBJECTS ===========================================================================
		else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.EditCustomInteractionObjects)){
			$scope.openForm(Enum.aopForms.editCustInteractObj, $scope.theView, function(retVal){
				if(retVal != null){
					if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
						socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.setCustomIO, target: $scope.getInstanceId(), theIO: retVal});
					}
				}
			});
		}
		//=======================================================================================

		//=== EXPORT ==========================================================================
		else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Export)){
			if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.EXPORT, 10)) == 0){
				$scope.requestExportWebble($scope.theView);
			}
			else{
				$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Export Webble Attempt Failed"), content: gettext("This Webble (or one related) is protected from exporting and therefore this operation is canceled.")}, null);
			}
		}
		//=======================================================================================

        //=== ABOUT ===========================================================================
        else if (itemName == getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.About)){
            $scope.openForm(Enum.aopForms.wblAbout, getAboutWblContent(), function(updateData){
				if(updateData != null){
					for(var upd in updateData){
						$scope.theWblMetadata[upd] = updateData[upd];
					}
				}
			});
        }
        //=======================================================================================

		//=== USER GENERATED ====================================================================
		else{
			internalCustomMenuActivityReaction(itemName);
		}
		//=======================================================================================

        if ($scope.theView.scope().coreCall_Event_WblMenuActivityReaction){
            $scope.theView.scope().coreCall_Event_WblMenuActivityReaction(itemName);
        }

        //If any DOM changes have been made up to this point Angular need to be told about it and react accordingly
        if(!$scope.$$phase){ $scope.$apply(); }
    };
    //========================================================================================


    //========================================================================================
    // Webble Initiation
    // This method Initiate the entire webble by extracting stored data from the webble def
    // doc and from the template, setting up everything needed before the webble can be fully
    // operational, looking and behaving as intended.
    //========================================================================================
    $scope.wblInit = function(whatWblDef){
        if((parseInt(theInitiationState_, 10) & parseInt(Enum.bitFlags_InitStates.InitFinished, 10)) === 0){
            // indicate that initiation has started
            theInitiationState_ = bitflags.on(theInitiationState_, Enum.bitFlags_InitStates.InitBegun);

            // Stores the wbl def object describing this webble
            var theWblDef_ = JSON.parse(whatWblDef, $scope.dynJSFuncParse);

            // Give the platform some init data needed for reassembling relationships
            $scope.AddUDD({newInstanceId: $scope.getInstanceId(), initWblDef: theWblDef_});

            //=== Query the webble def object for previously stored values like webble definition id etc...
            $scope.theWblMetadata['defid'] = theWblDef_['defid'];
            $scope.theWblMetadata['templateid'] = theWblDef_['templateid'];
            $scope.theWblMetadata['templaterevision'] = theWblDef_['templaterevision'];
            $scope.theWblMetadata['author'] = theWblDef_['author'];
            $scope.theWblMetadata['displayname'] = theWblDef_['displayname'];
            $scope.theWblMetadata['description'] = theWblDef_['description'];
            $scope.theWblMetadata['keywords'] = theWblDef_['keywords'];
            $scope.theWblMetadata['image'] = theWblDef_['image'];
            $scope.theWblMetadata['instanceid'] = theWblDef_['instanceid'];

            // ...Previous slot connections...
            theSelectedSlot_ = theWblDef_['slotdata']['selectslot'];
            theConnectedSlot_ = theWblDef_['slotdata']['connslot'];
            slotConnDir_ = {send: theWblDef_['slotdata']['send'], receive: theWblDef_['slotdata']['receive']};
            mcSlotData_ = theWblDef_['slotdata']['mcdata'];

            // Create CSS-related slots requested by the template
            for(var eid in $scope.theView.scope().stylesToSlots){
                var elmnt = $scope.theView.parent().find('#' + eid);
                if(elmnt.length != 0){
                    for(var i = 0; i < $scope.theView.scope().stylesToSlots[eid].length; i++){
                        var cssAttr = $scope.theView.scope().stylesToSlots[eid][i];
                        var cssAttrModStr = cssAttr.replace('-', '').toUpperCase();
                        var titleStr = cssAttr;
                        if(cssAttrModStr in strCatcher.cssAttrNames()){
                            titleStr = strCatcher.cssAttrNames()[cssAttrModStr];
                        }
                        var descStr = '';
                        if(cssAttrModStr in strCatcher.cssAttrDescs()){
                            descStr = strCatcher.cssAttrDescs()[cssAttrModStr];
                        }
                        var slotName = eid + ':' + cssAttr;
                        var slotValue = elmnt.css(cssAttr);

                        if(cssAttr == 'border' && slotValue == ''){
                            slotValue = elmnt.css('border-top-width') + ' ' + elmnt.css('border-top-style') + ' ' + elmnt.css('border-top-color');
                        }
                        else if(cssAttr == 'margin' && slotValue == ''){
                            slotValue = elmnt.css('margin-top') + ' ' + elmnt.css('margin-right') + ' ' + elmnt.css('margin-bottom') + ' ' + elmnt.css('margin-left');
                        }
                        else if(cssAttr == 'padding' && slotValue == ''){
                            slotValue = elmnt.css('padding-top') + ' ' + elmnt.css('padding-right') + ' ' + elmnt.css('padding-bottom') + ' ' + elmnt.css('padding-left');
                        }
                        else if(cssAttr == 'border-radius' && slotValue == ''){
                            slotValue = elmnt.css('border-top-left-radius') + ' ' + elmnt.css('border-top-right-radius') + ' ' + elmnt.css('border-bottom-right-radius') + ' ' + elmnt.css('border-bottom-left-radius');
                        }
                        if(cssAttr == 'transform-rotate' && slotValue == undefined){
                            slotValue =  mathy.getRotationDegrees(elmnt);
                        }

                        $scope.addSlot(new Slot(slotName,
                            slotValue,
                            titleStr,
                            descStr,
                            'css',
                            undefined,
                            elmnt
                        ));
                    }
                }
                else{
                  $log.log('This Webble ' + instanceId_ + '(' + $scope.theWblMetadata['displayname'] + ')' + ' failed to find an element with the id "' + eid + '", and therefore cannot create css slots for that element.');
                }
            }

            //Prepare the interaction buttons for this webble and set "selected" interface color
            initInteractionObjects();

            // Let the template do some work too, if it wants to.
            if ($scope.theView.scope().coreCall_Init){
                $scope.theView.scope().coreCall_Init(theWblDef_);
            }

            // assign previously stored slot values to our slots and also create ones found in the webble definition which does not yet exist
            transferSlotValueFromWblDef(theWblDef_);

            // reconnect custom slots connected to xaml attributes
            reconnectCustomVisualElementSlotsToCSSAttributes();

			//If there are any slots created for internal webble system configuration, update the webble accordingly
			systemInternalSlotUpdate();

            //protection flags
            $scope.setProtection(parseInt(theWblDef_['protectflags']));

            // If the template developer has not set resize slots for this Webble, the core will attempt to do it on
            // its own, and if that does not work, disable the assigned interaction ball
            if(!(resizeSlots_.width && resizeSlots_.height)){
                var newResizeSlots = {width: undefined, height: undefined};
                var elementId = '';
                for(var slot in theSlots_){
                    if(slot.search('width') != -1 && (elementId == '' || slot.search(elementId) != -1)){
                        elementId = slot.substr(0, slot.indexOf(':'));
                        newResizeSlots.width = slot;
                    }
                    if(slot.search('height') != -1 && (elementId == '' || slot.search(elementId) != -1)){
                        elementId = slot.substr(0, slot.indexOf(':'));
                        newResizeSlots.height = slot;
                    }
                    if(newResizeSlots.width && newResizeSlots.height){
                        break;
                    }
                }
                if(newResizeSlots.width && newResizeSlots.height){
                    resizeSlots_ = newResizeSlots;
                }
                else{
                    for(var i = 0, io; io = $scope.theInteractionObjects[i]; i++){
                        if(io.scope().getName() == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Resize)){
                            io.scope().setIsEnabled(false);
                            break;
                        }
                    }
                }
            }

			// Enables quick toggle select of a webble by just hover above it (while holding the CTRL-ALT keys)
			$scope.theView.mouseenter(mouseEnterSelection);

            // indicate that initiation has finished
            theInitiationState_ = bitflags.on(theInitiationState_, Enum.bitFlags_InitStates.InitFinished);

            // Tell the platform about the initiation progress
            $scope.wblInitiationDone($scope.theView);
        }
    };
    //========================================================================================


	//========================================================================================
	// Register Webble World Event Listener
	// Register an event listener for a specific event for a specific target (self, other or
	// all) (targetData can be a set for slotChange as a slotName to narrow down event further)
	// and the callback function the webble wish to be called if the event fire.
	// The callback function will then be handed a datapack object containing needed
	// information to react to the event accordingly. (see wwEventListeners_)
	// if targetId is undefined the webble will be listening to itself and if the targetId is
	// set to null it will listen to all webbles.
	//========================================================================================
	$scope.registerWWEventListener = function(eventType, callbackFunc, targetId, targetData){
		targetId = (targetId === undefined) ? instanceId_ : targetId;
		if(eventType == Enum.availableWWEvents.keyDown || eventType == Enum.availableWWEvents.loadingWbl || eventType == Enum.availableWWEvents.mainMenuExecuted){ targetId = null; }
		return $scope.regWblWrldListener(instanceId_, eventType, callbackFunc, targetId, targetData);
	};
	//========================================================================================


	//========================================================================================
	// Register Online Data Listener
	// This method lets the webble join a uniquely identified online data broadcasting virtual
	// room for sending and receiving messages via the server online to other users.
	//========================================================================================
	$scope.registerOnlineDataListener = function(msgRoomId, eventHandler, excludeSelf){
		if(isExist.valueInArray(activeOnlineRooms, msgRoomId)){
			$log.log("This Webble has already registered participation for the online room " + msgRoomId + " and will therefore not do it again");
		}
		else{
			activeOnlineRooms.push(msgRoomId);
			$scope.registerOnlineMsgRoomListener(instanceId_, msgRoomId, eventHandler, excludeSelf);
		}
	};
	//========================================================================================


	//========================================================================================
	// Unregister Online Data Listener
	// This method lets the webble leave a uniquely identified online data broadcasting virtual
	// room used for sending and receiving messages.
	//========================================================================================
	$scope.unregisterOnlineDataListener = function(whatRoom){
		$scope.unregisterOnlineMsgRoomListener(instanceId_, whatRoom);
		valMod.findAndRemoveValueInArray(activeOnlineRooms, whatRoom);
	};
	//========================================================================================


	//========================================================================================
	// Send Online Data
	// This method lets the webble sends data over the internet via the Webble server to any
	// other webble and user online that is currently listening. It only works if the user
	// has previously registered a online room.
	//========================================================================================
	$scope.sendOnlineData = function(whatRoom, whatData){
		if(isExist.valueInArray(activeOnlineRooms, whatRoom)){
			$scope.sendOnlineMsg(whatRoom, whatData);
		}
		else{
			$log.log("This Webble has not registered participation for the online room " + whatRoom + " and can therefore not send any messages to it");
		}
	};
	//========================================================================================


    //========================================================================================
    // Assign Parent
    // This method prepares for assigning a parent to this webble.
    //========================================================================================
    $scope.assignParent = function(){
        // If no parent is assigned yet...
		if(localStorageService.get('TutInfoAssignParent') == undefined &&  (parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.PopupInfoEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.PopupInfoEnabled, 10)){
			localStorageService.add('TutInfoAssignParent', true);
			$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Assign Parent"), size: 'lg', content:
			'<p>' +
				gettextCatalog.getString("The target Webble gets a golden glowing border to indicate it is the future child and all other Webbles that might be able to become a possible parent gets a light blue glowing border.") + "&nbsp;" +
				gettextCatalog.getString("After the user have selected a parent by clicking on it the border of the child glows light pink while the selected parent’s border glows in deep red.") + "&nbsp;" +
				gettextCatalog.getString("This menu target is not visible if the Webble already has a parent. Same as using the green bottom left Interaction Ball.") +
			'</p>' +
			'<p>' +
				gettextCatalog.getString("Even though Webbles can be related to another Webble anywhere on the work surface as illustrated in the first image, we") + "&nbsp;<strong>" + gettextCatalog.getString("highly recommend") + "</strong>&nbsp;" + gettext("that beginners of Webble World instead stack children on top of parents as shown in the second image.") + "&nbsp;" +
				gettextCatalog.getString("This way you get a much better overview which is parent to which.") + "&nbsp;" +
				gettextCatalog.getString("Using this approach means that sometimes you just create a parent board for visually reasons and no practical use or slot communication, but that is totally okay, and as we said, even recommended.") +
			'</p>' +
			'<div style="display: block; margin-left: auto; margin-right: auto; width: 640px;">' +
				'<img src="../../images/tutorInfo/parentChildConn.png" style="display: block; margin-right: 20px; width: 300px; float: left" />' +
				'<img src="../../images/tutorInfo/memelego.png" style="display: block; width: 300px; " />' +
			'</div>'
			});
		}

        if (theParent_ == undefined){
            $scope.requestAssignParent($scope.theView);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Instance Name
    // This method gets this webbles display name.
    //========================================================================================
    $scope.getInstanceName = function(){
        return $scope.theWblMetadata['displayname'];
    };
    //========================================================================================


    //========================================================================================
    // Set Protection
    // This method sets this webbles protection code value.
    //========================================================================================
    $scope.setProtection = function(protectionCode){
		if($scope.wblStateFlags.readyToStoreUndos){$scope.addUndo({op: Enum.undoOps.setProtection, target: $scope.getInstanceId(), execData: [{currProtection: theProtectionSetting_}]});}
		if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.setProtection, target: $scope.getInstanceId(), protectionSetting: protectionCode});
		}

        theProtectionSetting_ = protectionCode;

        if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_CONNECT, 10)) == 0){
            if(!$scope.getParent()){
                var io = $scope.getInteractionObjectByName(getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent));
                if (io){
                    io.scope().setIsEnabled(true);
                }
            }
        }
        else{
            var io = $scope.getInteractionObjectByName(getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent));
            if (io){
                io.scope().setIsEnabled(false);
            }
        }

        interactionObjContainerVisibilty_ = (parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.INTERACTION_OBJECTS, 10)) == 0 && $scope.getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked;

        if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) != 0 && $scope.getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
            theSelectState_ = Enum.availableOnePicks_SelectTypes.AsNotSelected;
            interactionObjContainerVisibilty_ = false;
            $scope.activateBorder(false);
        }

        if ($scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer){
            wblVisibilty_ = true;
        }
        else{
            wblVisibilty_ = (parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) === 0;
        }
    };
    //========================================================================================


    //========================================================================================
    // Add Popup Menu Item Disabled
    // This method adds an item represented with a string id to the list of popup menu items
    // that should be disabled and not displayed.
    //========================================================================================
    $scope.addPopupMenuItemDisabled = function(whatItem){
        if(!$scope.isPopupMenuItemDisabled(whatItem)){
            disabledPopupMenuItems_.push(whatItem);
        }
    };
    //========================================================================================


    //========================================================================================
    // Remove Popup Menu Item Disabled
    // This method removes an item represented with a string id from the list of popup menu
    // items that should be disabled and not displayed, if found.
    //========================================================================================
    $scope.removePopupMenuItemDisabled = function(whatItem){
        var indexToRemove;
        for(var i = 0; i < disabledPopupMenuItems_.length; i++){
            if(disabledPopupMenuItems_[i] == whatItem){
                indexToRemove = i;
                break;
            }
        }
        if(indexToRemove != undefined){
            disabledPopupMenuItems_.splice(indexToRemove, 1);
        }
    };
    //========================================================================================


    //========================================================================================
    // Is Popup Menu Item Disabled=
    // This method returns true or false weather a certain popup menu item found by name id
    // is in the list of items that should be disabled and not displayed or not.
    //========================================================================================
    $scope.isPopupMenuItemDisabled = function(whatItem){
        var result = false;
        for(var i = 0; i < disabledPopupMenuItems_.length; i++){
            if(disabledPopupMenuItems_[i] == whatItem){
                result = true;
                break;
            }
        }
        return result;
    };
    //========================================================================================

    //========================================================================================
    // Get Webble Full Name
    // This method returns this webbles user defined display name + its instance id
    // + its template id.
    //========================================================================================
    $scope.getWebbleFullName = function(){
        return $scope.getInstanceName() + ' / ' + $scope.theWblMetadata['templateid'] + ' [' + $scope.getInstanceId() + ']';
    };
    //========================================================================================


    //========================================================================================
    // Connect Slots
    // This method connects a parent conn slot found by name with this Webbles selected slot.
    //========================================================================================
    $scope.connectSlots = function(parentSlot, childSlot, directions, doNotBotherAdjustingStuff){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.connSlots, target: $scope.getInstanceId(), parentSlot: parentSlot, childSlot: childSlot, directions: directions});
        }

		if($scope.wblStateFlags.readyToStoreUndos){ $scope.addUndo({op: Enum.undoOps.connSlots, target: $scope.getInstanceId(), execData: [{connslot: theConnectedSlot_, selectslot: theSelectedSlot_, slotdir: slotConnDir_}]}); }
        theConnectedSlot_ = parentSlot != 'none' ? parentSlot : '';
        theSelectedSlot_ = childSlot != 'none' ? childSlot : '';
        slotConnDir_ = directions;

        // Clear old watches
        if(listenToParentSlot != undefined){ if($.isArray(listenToParentSlot)){ for(var i = 0; i < listenToParentSlot.length; i++){ listenToParentSlot[i](); } } else{ listenToParentSlot(); } listenToParentSlot = undefined; }
        if(listenToChildSlot != undefined){ if($.isArray(listenToChildSlot)){ for(var i = 0; i < listenToChildSlot.length; i++){ listenToChildSlot[i](); } } else{ listenToChildSlot(); } listenToChildSlot = undefined; }

        // Set slots accordingly
        if (theConnectedSlot_ != '' && theSelectedSlot_ != '' && (slotConnDir_.send || slotConnDir_.receive)){
            if(isEmpty(mcSlotData_)){
                if(slotConnDir_.send){
					if(!doNotBotherAdjustingStuff){ $scope.getParent().scope().set(theConnectedSlot_, $scope.gimme(theSelectedSlot_)); }
                }
                if(slotConnDir_.receive){
					if(!doNotBotherAdjustingStuff){ $scope.set(theSelectedSlot_, $scope.getParent().scope().gimme(theConnectedSlot_)); }
				}
            }
            else{
				if(!doNotBotherAdjustingStuff){
					if(slotConnDir_.send){
						for(var i = 0; i < mcSlotData_.length; i++){
							$scope.getParent().scope().set(mcSlotData_[i][1], $scope.gimme(mcSlotData_[i][0]));
						}
					}
					if(slotConnDir_.receive){
						for(var i = 0; i < mcSlotData_.length; i++){
							$scope.set(mcSlotData_[i][0], $scope.getParent().scope().gimme(mcSlotData_[i][1]));
						}
					}
				}

                mergedSlotWatchSetupIndex = 0;
                listenToParentSlot = [];
                listenToChildSlot = [];
                createChildParentMergedSlotWatches();
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Set Selection State
    // This method sets this webbles selection state
    //========================================================================================
    $scope.setSelectionState = function(newSelectionState){
		if($scope.getSelectionState() != newSelectionState){
			// Make sure shared workspaces are informed
			if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
				socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.setSelectState, target: $scope.getInstanceId(), selectState: newSelectionState});
			}

			if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) == 0 || ($scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer && $scope.altKeyIsDown)){
				// If set to selected
				if (newSelectionState != Enum.availableOnePicks_SelectTypes.AsNotSelected){
					// Create a border around the webble
					$scope.activateBorder(true);

					// If it was main clicked also create interaction buttons and display name
					if (newSelectionState == Enum.availableOnePicks_SelectTypes.AsMainClicked){

						if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.INTERACTION_OBJECTS, 10)) == 0){
							interactionObjContainerVisibilty_ = true;
						}

						// Display the webble's name
						if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) == 0){
							if ((parseInt(theWebbleSettingFlags_, 10) & parseInt(Enum.bitFlags_WebbleConfigs.NoBubble, 10)) == 0){
								$scope.setBubbleTxt($scope.getWebbleFullName());
								var absPos = $scope.getWblAbsPosInPixels($scope.theView);
								$scope.setBubbleTxtPos({x: absPos.x, y: absPos.y}, $scope.theView);
								$scope.setBubbleTxtVisibility(true, 3000);
							}
						}
					}

					if (newSelectionState == Enum.availableOnePicks_SelectTypes.AsWaitingForParent){
						for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
							aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
							if(aw.scope().getInstanceId() != $scope.getInstanceId()){
								var isBundleChild = (aw.scope().theWblMetadata['templateid'] != 'bundleTemplate' && aw.scope().getIsBundled() > 0);
								var wasRelative = false;
								for(var n = 0, fm; fm = $scope.getAllDescendants($scope.theView)[n]; n++){
									if (fm.scope().getInstanceId() == aw.scope().getInstanceId()){
										wasRelative = true;
										break;
									}
								}

								if(!wasRelative && !isBundleChild){
									aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsWaitingForChild);
								}
							}
						}
						$scope.activateBorder(true, 'gold', undefined, undefined, true);
					}

					if (newSelectionState == Enum.availableOnePicks_SelectTypes.AsWaitingForChild){
						$scope.activateBorder(true, 'lightblue', undefined, undefined, true);
					}

					if (newSelectionState == Enum.availableOnePicks_SelectTypes.AsNewChild){
						$scope.activateBorder(true, 'pink', undefined, undefined, true);
					}

					if (newSelectionState == Enum.availableOnePicks_SelectTypes.AsNewParent){
						$scope.activateBorder(true, 'darkred', undefined, undefined, true);
					}
				}
				// If set to unselected
				else{
					// Clear away border and buttons
					interactionObjContainerVisibilty_ = false;
					$scope.activateBorder(false);
				}

				// Set select status
				theSelectState_ = newSelectionState;
			}
			else{
				if (theSelectState_ == Enum.availableOnePicks_SelectTypes.AsNotSelected){
					$scope.activateBorder(false);
					interactionObjContainerVisibilty_ = false;
				}
			}
		}
    };
    //========================================================================================


    //========================================================================================
    // Activate Border
    //This method shows or hides the webble border. But also allow to change border style,
    // width and color.
    //========================================================================================
    $scope.activateBorder = function(isEnabled, whatColor, whatWidth, whatStyle, glowEnabled){
        $scope.selectionBorder.color = 'transparent';
        $scope.selectionBorder.width = 3;
        $scope.selectionBorder.style = 'solid';
        $scope.selectionBorder.glow = '0 0 0px transparent';

        if(whatStyle != undefined && isValidStyleValue('border-style', whatStyle)){
            $scope.selectionBorder.style = whatStyle;
        }

        if(whatWidth != undefined && !isNaN(whatWidth)){
            $scope.selectionBorder.width = whatWidth;
        }

        if(modelSharees_.length > 0){
            $scope.selectionBorder.style = 'dashed';
        }

        if (isEnabled){
            if (whatColor != undefined && isValidStyleValue('color', whatColor)){
                $scope.selectionBorder.color = whatColor;
            }
            else{
                $scope.selectionBorder.color = '#46f03e';
            }
            if (glowEnabled){
                $scope.selectionBorder.glow = '0 0 25px ' + $scope.selectionBorder.color;
            }
        }
    };
    //========================================================================================


    //=========================================================================================
    // Add Slot
    // This method adds a slot to the list of slots.
    //=========================================================================================
    $scope.addSlot = function(whatSlot){
        if (whatSlot != null && !(whatSlot.getName() in theSlots_)){
            whatSlot.setValue(valMod.addPxMaybe(whatSlot.getName(), whatSlot.getValue()));

            if(whatSlot.getIsCustomMade() || whatSlot.getName() == "customContextMenu" || whatSlot.getName() == "customInteractionObjects"){
				if($scope.wblStateFlags.readyToStoreUndos){ $scope.addUndo({op: Enum.undoOps.addCustSlot, target: $scope.getInstanceId(), execData: [{slotname: whatSlot.getName()}]}); }
            }
			if(whatSlot.getIsCustomMade()){
				if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
					socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.addCustSlot, target: $scope.getInstanceId(), slot: {name: whatSlot.getName(), value: whatSlot.getValue(), displayName: whatSlot.getDisplayName(), desc: whatSlot.getDisplayDescription(), cat: whatSlot.getCategory(), metadata: whatSlot.getMetaData(), elPntr: (whatSlot.getElementPntr() != undefined)}});
				}
			}

            theSlots_[whatSlot.getName()] = whatSlot;

            if(whatSlot.getElementPntr() != undefined){
                var styleName = whatSlot.getName().substr(whatSlot.getName().lastIndexOf(':')+1);
                whatSlot.cssValWatch = $scope.$watch(function(){return whatSlot.getElementPntr().css(styleName);}, function(newVal, oldVal) {
                    if(styleName == 'border' && newVal == ''){
                        newVal = whatSlot.getElementPntr().css('border-top-width') + ' ' + whatSlot.getElementPntr().css('border-top-style') + ' ' + whatSlot.getElementPntr().css('border-top-color');
                    }
					else if(styleName == 'font-family'){
						newVal = newVal.toLowerCase();
						oldVal = oldVal.toLowerCase();
					}
                    else if(styleName == 'margin' && newVal == ''){
                        newVal = whatSlot.getElementPntr().css('margin-top') + ' ' + whatSlot.getElementPntr().css('margin-right') + ' ' + whatSlot.getElementPntr().css('margin-bottom') + ' ' + whatSlot.getElementPntr().css('margin-left');
                    }
                    else if(styleName == 'padding' && newVal == ''){
                        newVal = whatSlot.getElementPntr().css('padding-top') + ' ' + whatSlot.getElementPntr().css('padding-right') + ' ' + whatSlot.getElementPntr().css('padding-bottom') + ' ' + whatSlot.getElementPntr().css('padding-left');
                    }
                    else if(styleName == 'border-radius' && newVal == ''){
                        newVal = whatSlot.getElementPntr().css('border-top-left-radius') + ' ' + whatSlot.getElementPntr().css('border-top-right-radius') + ' ' + whatSlot.getElementPntr().css('border-bottom-right-radius') + ' ' + whatSlot.getElementPntr().css('border-bottom-left-radius');
                    }

                    if (oldVal && newVal && (newVal !== oldVal)) {
                        var transDur = parseInt(whatSlot.getElementPntr().css('transition-duration'));
                        if(whatSlot.getElementPntr().css('transition-duration').search('ms') == -1){
                          transDur = transDur * 1000;
                        }
                        if(styleName == 'top' || styleName == 'left' || styleName == 'font-size' || styleName == 'width' || styleName == 'height'){
                            var valUnit = valMod.getValUnitSeparated(whatSlot.getValue());
                            var cssVal = getUnits(whatSlot.getElementPntr()[0], styleName)[getUnitMap(valUnit[1])];
                            if((styleName == 'top' || styleName == 'height' || styleName == 'width') && valUnit[1] == '%'){
                                var containerSize = {w: $scope.getWSE() != undefined ? parseFloat(getUnits($scope.getWSE()[0], 'width').pixel) : $(document).width(), h: $scope.getWSE() != undefined ? parseFloat(getUnits($scope.getWSE()[0], 'height').pixel) : $(document).height()};
                                var currentPixelValue = parseFloat(valMod.getValUnitSeparated(newVal)[0]);
                                if(styleName != 'width'){
                                    cssVal = (currentPixelValue / containerSize.h) * 100;
                                }
                                else{
                                    cssVal = (currentPixelValue / containerSize.w) * 100;
                                }
                            }

                            var noOfDec = 2;
                            if(valUnit[1] == '%'){
                                noOfDec = 0;
                            }
                            if(valUnit[0] && cssVal && valUnit[0].toFixed(noOfDec) != cssVal.toFixed(noOfDec) && cssVal.toString().toLowerCase() != 'infinity'){
                                if(transDur != undefined && transDur > 0){
                                    if(onGoingTimeOuts[whatSlot.getName()] == undefined){
                                        onGoingTimeOuts[whatSlot.getName()] = $timeout(function(){$scope.set(whatSlot.getName(), getUnits(whatSlot.getElementPntr()[0], styleName)[getUnitMap(valUnit[1])].toFixed(2) + valMod.getValUnitSeparated(whatSlot.getValue())[1]); onGoingTimeOuts[whatSlot.getName()] = undefined;}, transDur);
                                    }
                                }
                                else{
                                    $scope.set(whatSlot.getName(), cssVal.toFixed(2) + valUnit[1]);
                                }

                            }
                        }
                        else if(styleName.search('color') != -1){
                            if(colorService.rgbStrToHex(newVal).toLowerCase() != whatSlot.getValue()){
                                if(transDur != undefined && transDur > 0){
                                  if(onGoingTimeOuts[whatSlot.getName()] == undefined){
                                      onGoingTimeOuts[whatSlot.getName()] = $timeout(function(){$scope.set(whatSlot.getName(), whatSlot.getElementPntr().css(styleName)); onGoingTimeOuts[whatSlot.getName()] = undefined;}, transDur);
                                  }
                                }
                                else{
                                    $scope.set(whatSlot.getName(), newVal);
                                }
                            }
                        }
                        else{
                            if(whatSlot.getValue() != newVal){
                                if(transDur != undefined && transDur > 0){
                                  if(onGoingTimeOuts[whatSlot.getName()] == undefined){
                                    onGoingTimeOuts[whatSlot.getName()] = $timeout(function(){$scope.set(whatSlot.getName(), whatSlot.getElementPntr().css(styleName)); onGoingTimeOuts[whatSlot.getName()] = undefined;}, transDur);
                                  }
                                }
                                else{
                                    $scope.set(whatSlot.getName(), newVal);
                                }
                            }
                        }
                    }
                }, true);
            }
            //Fire away a slot value change even if this is creation time
            whatSlot.setCustomTimestamp(1);
            slotValueChanged(whatSlot.getName());
        }
        else{
            return false;
        }
        return true;
    };
    //=========================================================================================


    //========================================================================================
    // Create Webble Definition
    // This method creates a webble definition object containing an exact description of this
    // webble.
    //========================================================================================
    $scope.createWblDef = function(withAbsPosAndExternalUse){
        var wblDef_ = {
            "instanceid": $scope.getInstanceId(),
            "defid": $scope.theWblMetadata['defid'],
            "templateid": $scope.theWblMetadata['templateid'],
            "templaterevision": $scope.theWblMetadata['templaterevision'],
            "displayname": $scope.theWblMetadata['displayname'],
            "description": $scope.theWblMetadata['description'],
            "keywords": $scope.theWblMetadata['keywords'],
            "author": $scope.theWblMetadata['author'],
            "image": $scope.theWblMetadata['image'],
            "protectflags": $scope.getProtection(),
            "modelsharees": getModelShareesForWblDef(),
            "slotdata": {
                "send": slotConnDir_.send,
                "receive": slotConnDir_.receive,
                "selectslot": theSelectedSlot_,
                "connslot": theConnectedSlot_,
                "mcdata": mcSlotData_
            },
            "private": getCustomWblDefItems()
        };

        var slotsForWblDef = [];
        for(var slot in theSlots_){
            slotsForWblDef.push({
                "name": slot,
                "category": theSlots_[slot].getCategory(),
                "value": $scope.dynJSFuncStringifyAdvanced(slot, theSlots_[slot].getValue()),
                "metadata": theSlots_[slot].getMetaData()
            });
        }
        wblDef_.slotdata['slots'] = slotsForWblDef;

        var childrenForWblDef = [];
        for(var i = 0, c; c = theChildren_[i]; i++){
            childrenForWblDef.push({webble: c.scope().createWblDef(false)});
        }
        wblDef_['children'] = childrenForWblDef;

        if(withAbsPosAndExternalUse){
            wblDef_ = getModifiedWblAbsolutePos({webble: wblDef_});
        }

        return wblDef_;
    };
    //========================================================================================


    //========================================================================================
    // Duplicate
    // This method duplicates itself and returns the copy to the caller
    //========================================================================================
    $scope.duplicate = function(whatOffset, whatCallbackMethod){
        var allFamily = $scope.getAllDescendants($scope.theView);
        allFamily = allFamily.concat($scope.getAllAncestors($scope.theView));
        for(var i = 0, w; w = allFamily[i]; i++){
            if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DUPLICATE, 10)) !== 0){
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Duplication Failed"), content: gettext("One or more of the Webbles included in the duplication attempt is protected from duplication and therefore this operation is canceled.")}, null);
                return false;
            }
        }

        var modifiedWblDef = $scope.createWblDef(true);
        modifiedWblDef = getModifiedWblDefPosOffset(modifiedWblDef, whatOffset);
        modifiedWblDef = getModifiedWblZIndex(modifiedWblDef);
        $scope.loadWebbleFromDef(modifiedWblDef, whatCallbackMethod);

		return true;
    };
    //========================================================================================


    //========================================================================================
    // Shared Model Duplicate
    // This method duplicates itself but let the copy share the same model and then return
    // it to the caller.
    //========================================================================================
    $scope.sharedModelDuplicate = function(whatOffset, whatCallbackMethod){
        var allFamily = $scope.getAllDescendants($scope.theView);
        allFamily = allFamily.concat($scope.getAllAncestors($scope.theView));
        for(var i = 0, w; w = allFamily[i]; i++){
            if(w.scope().getInstanceId() == $scope.getInstanceId()){
                if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE, 10)) !== 0){
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Shared Model Duplication Failed"), content: gettext("This Webble is protected from shared model duplication and therefore this operation is canceled.")}, null);
                    return false;
                }
            }
            else{
                if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DUPLICATE, 10)) !== 0){
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Duplication Failed"), content: gettext("One or more of the Webbles included in the duplication attempt is protected from duplication and therefore this operation is canceled.")}, null);
                    return false;
                }
            }
        }

        var modifiedWblDef = $scope.createWblDef(true);
        modifiedWblDef = getModifiedWblDefPosOffset(modifiedWblDef, whatOffset);
        modifiedWblDef = getModifiedWblZIndex(modifiedWblDef);
        isCreatingModelSharee_ = true;
        $scope.loadWebbleFromDef(modifiedWblDef, whatCallbackMethod);
        return true;
    };
    //========================================================================================


    //========================================================================================
    // Connect Shared Model
    // This method takes the new shared model duplicate and connect it to its original so
    // that they can share their slots at all time.
    //========================================================================================
    $scope.connectSharedModel = function(sharedModelCandidate){
		$scope.addUndo({op: Enum.undoOps.loadWbl, target: sharedModelCandidate.wbl.scope().getInstanceId(), execData: [{oldid: sharedModelCandidate.wbl.scope().theWblMetadata['instanceid'], SMM: $scope.getInstanceId()}]});
		if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.sharedModelDuplicate, target: $scope.getInstanceId(), SMC: sharedModelCandidate.wbl.scope().getInstanceId()});
		}

		isCreatingModelSharee_ = false;
        for(var i = 0, ms; ms = modelSharees_[i]; i++){
            sharedModelCandidate.wbl.scope().getModelSharees().push(ms);
            ms.scope().getModelSharees().push(sharedModelCandidate.wbl);
        }
        modelSharees_.push(sharedModelCandidate.wbl);
        sharedModelCandidate.wbl.scope().getModelSharees().push($scope.theView);
        for(var slot in theSlots_){
            if(slot != 'root:left' && slot != 'root:top'){
                theSlots_[slot]['isShared'] = true;
                sharedModelCandidate.wbl.scope().getSlots()[slot]['isShared'] = true;
            }
            else{
                theSlots_[slot]['isShared'] = false;
                sharedModelCandidate.wbl.scope().getSlots()[slot]['isShared'] = false;
            }
        }

		$scope.fireWWEventListener(Enum.availableWWEvents.sharedModelDuplicated, {targetId: instanceId_, copyId: sharedModelCandidate.wbl.scope().getInstanceId(), timestamp: (new Date()).getTime()});
    };
    //========================================================================================


    //========================================================================================
    // Get Slot
    // This method returns a slot specified by its id name.
    //========================================================================================
    $scope.getSlot = function(whatSlotName){
        if (whatSlotName in theSlots_){
            return theSlots_[whatSlotName];
        }
        else{
            return undefined;
        }
    };
    //========================================================================================


    //=========================================================================================
    // Get Slots
    // This method returns the complete list of slots.
    //=========================================================================================
    $scope.getSlots = function(){
        return theSlots_;
    };
    //=========================================================================================


    //========================================================================================
    // Gimme
    // This method returns the value of a slot found by name parameter. if no slot by
    // specified name is found undefined is returned
    //========================================================================================
    $scope.gimme = function(slotName){
        var slotValue = undefined;
        var slot = $scope.getSlot(slotName);

        if (slot != undefined){
            slotValue = slot.getValue();
        }

        return slotValue;
    };
    //========================================================================================


    //========================================================================================
    // Get Interaction Object By Name
    // This method iterates all the Interaction objects and return the one that match the
    // name sent as a parameter, if not found undefined is returned.
    //========================================================================================
    $scope.getInteractionObjectByName = function(whatName){
        for(var i = 0, io; io = $scope.theInteractionObjects[i]; i++){
            if (io.scope().getName() == whatName)
                return io;
        }
        return null;
    };
    //========================================================================================


    //========================================================================================
    // Add Child
    // This method adds a new child to the Webble
    //========================================================================================
    $scope.addChild = function(newChild){
        if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_CONNECT, 10)) == 0){
            theChildren_.push(newChild);
			$scope.fireWWEventListener(Enum.availableWWEvents.gotChild, {targetId: instanceId_, childId: newChild.scope().getInstanceId(), timestamp: (new Date()).getTime()});
        }
    };
    //========================================================================================


    //========================================================================================
    // Remove Child
    // This method removes a child from this webbles list of children
    //========================================================================================
    $scope.removeChild = function(oldChild){
        if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_DISCONNECT, 10)) == 0 || $scope.globalByPassFlags.byPassBlockingPeelProtection){
            for(var i = 0, c; c = theChildren_[i]; i++){
                if(c.scope().getInstanceId() == oldChild.scope().getInstanceId()){
                    theChildren_.splice(i, 1);
					$scope.fireWWEventListener(Enum.availableWWEvents.lostChild, {targetId: instanceId_, childId: oldChild.scope().getInstanceId(), timestamp: (new Date()).getTime()});
                    break;
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Paste
    // This method connects this webble to a parent webble provided as a parameter
    //========================================================================================
    $scope.paste = function(parent, doNotBotherAdjustingStuff){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.pasteWbl, child: $scope.getInstanceId(), parent: parent.scope().getInstanceId()});
        }

        // If no parent is assigned yet...
        if (!theParent_){
			if(!doNotBotherAdjustingStuff){
				if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_CONNECT, 10)) !== 0){
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Assign Parent Failed"), content: gettext("This Webble is protected from getting a parent and therefore this operation is canceled.")}, null);
					return false;
				}

				if((parseInt(parent.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_CONNECT, 10)) !== 0){
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Assign Parent Failed"), content: gettext("The selected parent is protected from having children and therefore this operation is canceled.")}, null);
					return false;
				}

				if(!parent.scope().getChildContainer()){
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Assign Parent Failed"), content: gettext("The requested parent Webble currently does not have any area to put children in and therefore this operation is canceled.")}, null);
					return false;
				}
			}
			if($scope.wblStateFlags.readyToStoreUndos){ $scope.addUndo({op: Enum.undoOps.pasteWbl, target: $scope.getInstanceId(), execData: []}); }

            theParent_ = parent;
            theParent_.scope().addChild($scope.theView);

            if($scope.gimme('root:left').search('%') != -1){
                $scope.set('root:left', getUnits($scope.theView.parent()[0], 'left').pixel.toFixed(2) + 'px');
            }
            if($scope.gimme('root:top').search('%') != -1){
                $scope.set('root:top', getUnits($scope.theView.parent()[0], 'top').pixel.toFixed(2) + 'px');
            }

            theParent_.scope().getChildContainer().append($scope.theView.parent());
			if(!doNotBotherAdjustingStuff){ adjustPositionInRelationToParent(false); }

            var io = $scope.getInteractionObjectByName(getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent));
            if (io){ io.scope().setIsEnabled(false); }

            var parentSlot = theConnectedSlot_, childSlot = theSelectedSlot_;
            if($scope.gimme('autoSlotConnEnabled') && theParent_.scope().gimme('autoSlotConnEnabled') && (parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled, 10)) !== 0){
                if(parentSlot == '' && theParent_.scope().getDefaultSlot() != ''){
                    parentSlot = theParent_.scope().getDefaultSlot();
                }
                if(childSlot == '' && theDefaultSlot_ != ''){
                    childSlot = theDefaultSlot_;
                }

                if(parentSlot != '' && childSlot != ''){
                    $scope.connectSlots(parentSlot, childSlot, slotConnDir_, doNotBotherAdjustingStuff);
                }
            }
            else{
                if(parentSlot == '' && childSlot == ''){
                    theConnectedSlot_ = '';
                    theSelectedSlot_ = '';
                    slotConnDir_ = {send: false, receive: false};
                    parentSlot = '';
                    childSlot = '';
                }

                if(parentSlot != '' && childSlot != ''){
                    $scope.connectSlots(parentSlot, childSlot, slotConnDir_, doNotBotherAdjustingStuff);
                }
            }

			$scope.fireWWEventListener(Enum.availableWWEvents.pasted, {targetId: instanceId_, parentId: theParent_.scope().getInstanceId(), timestamp: (new Date()).getTime()});

            return true;
        }

        return false;
    };
    //========================================================================================


    //========================================================================================
    // Peel
    // This method removes the parent for this child and make it an orphan again.
    //========================================================================================
    $scope.peel = function(doNotBotherAdjustingStuff){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.peelWbl, target: $scope.getInstanceId()});
        }

        if (theParent_ != undefined){
			if(!$scope.globalByPassFlags.byPassBlockingPeelProtection){
				if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT, 10)) !== 0){
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Revoke Parent Failed"), content: gettext("This Webble is protected from revoking its parent and therefore this operation is canceled.")}, null);
					return null;
				}
				if((parseInt(theParent_.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_DISCONNECT, 10)) !== 0){
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Revoke Parent Failed"), content: gettext("This Webble's parent is protected from removing any of its children and therefore this operation is canceled.")}, null);
					return null;
				}
			}

			if(!doNotBotherAdjustingStuff){
				$scope.getWSE().append($scope.theView.parent());
				adjustPositionInRelationToParent(true);
				var io = $scope.getInteractionObjectByName(getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent));
				if (io){ io.scope().setIsEnabled(true); }
			}

			if($scope.wblStateFlags.readyToStoreUndos){ $scope.addUndo({op: Enum.undoOps.peelWbl, target: $scope.getInstanceId(), execData: [{parent: theParent_.scope().getInstanceId()}]}); }
            theParent_.scope().removeChild($scope.theView);
            var lostParentId = theParent_.scope().getInstanceId();
            theParent_ = undefined;

			$scope.fireWWEventListener(Enum.availableWWEvents.peeled, {targetId: instanceId_, parentId: lostParentId, timestamp: (new Date()).getTime()});

            return true;
        }

        return false;
    };
    //========================================================================================


    //=========================================================================================
    // Remove Slot
    // This method removes a slot found by name from the list of slots.
    //=========================================================================================
    $scope.removeSlot = function(whatSlotName){
        if (whatSlotName in theSlots_){
            if(theSlots_[whatSlotName].cssValWatch){
                theSlots_[whatSlotName].cssValWatch();
            }

			if($scope.getResizeSlots().width == whatSlotName || $scope.getResizeSlots().height == whatSlotName){
				$scope.setResizeSlots(undefined, undefined);
				for(var i = 0, io; io = $scope.theInteractionObjects[i]; i++){
					if(io.scope().getName() == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.Resize)){
						io.scope().setIsEnabled(false);
						break;
					}
				}
			}

            if(theSlots_[whatSlotName].getIsCustomMade() || whatSlotName == "customContextMenu" || whatSlotName == "customInteractionObjects"){
				if($scope.wblStateFlags.readyToStoreUndos){ $scope.addUndo({op: Enum.undoOps.removeCustSlot, target: $scope.getInstanceId(), execData: [{slotname: theSlots_[whatSlotName].getName(), slotvalue: theSlots_[whatSlotName].getValue(), slotcat: theSlots_[whatSlotName].getCategory()}]}); }
            }
			if(theSlots_[whatSlotName].getIsCustomMade()){
				if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
					socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.removeCustSlot, target: $scope.getInstanceId(), slotname: theSlots_[whatSlotName].getName()});
				}
			}

            delete theSlots_[whatSlotName];
        }
    };
    //=========================================================================================


    //========================================================================================
    // Set
    // This method sets a new value to the slot with the name sent as a parameter.
    //= The method then returns a bit flag value to tell how the set process succeeded.
    //========================================================================================
    $scope.set = function(slotName, slotValue){
        var result = Enum.bitFlags_SlotManipulations.NonExisting;
        var theSlot;
        var prevState;

        if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.RESIZE, 10)) !== 0 && (slotName.toLowerCase().search('scale') != -1 || slotName.toLowerCase().search('width') != -1 || slotName.toLowerCase().search('height') != -1)){
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Set Size Slot Failed"), content: gettext("This Webble is protected from resizing and therefore this operation is canceled.")}, null);
            return result;
        }

        if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.MOVE, 10)) !== 0 && (slotName == 'root:left' || slotName == 'root:top')){
            return result;
        }

        if((parseInt(theProtectionSetting_, 10) & parseInt(Enum.bitFlags_WebbleProtection.PROPERTY, 10)) !== 0){
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Set Slot Failed"), content: gettext("This Webble is protected from slot and property change and therefore this operation is canceled.")}, null);
            return result;
        }

        if(slotName == 'root:left' || slotName == 'root:top'){
			if((!$scope.getParent() && parseInt(slotValue) < 0) || slotValue == "auto"){ slotValue = 0; }
        }

        if (slotName in theSlots_){
            theSlot = theSlots_[slotName];
        }
        else{
            theSlot = undefined;
        }

        if (theSlot != undefined)
        {
            result =  bitflags.on(result, Enum.bitFlags_SlotManipulations.Exists);

            // in unit sensitive css values we make sure there is a unit, otherwise we add pixel (px) as the unit
            slotValue = valMod.addPxMaybe(slotName, slotValue);

			//if the value in is json or array and the slot being set is of string type... make sure a conversion is made to keep the integrity of the data
			if(typeof slotValue === 'object' && theSlot.getOriginalType() === 'string'){
				if(typeof slotValue.getMonth === 'function'){
					slotValue = slotValue.toString();
				}
				else if(Object.prototype.toString.call( slotValue ) === '[object Array]') {
					slotValue = {"slotValue": slotValue};
					slotValue = JSON.stringify(slotValue, $scope.dynJSFuncStringify);
					slotValue = slotValue.substr(slotValue.indexOf(':') + 1, slotValue.length - slotValue.indexOf(':') - 2);
				}
				else{
					slotValue = JSON.stringify(slotValue, $scope.dynJSFuncStringify);
				}
			}

			if(typeof slotValue === 'string'){
				if(theSlot.getOriginalType() === 'object'){
					try{
						slotValue = JSON.parse(slotValue, $scope.dynJSFuncParse);
					}
					catch(e){
						slotValue = valMod.fixBrokenObjStrToProperObject(slotValue);
					}

				}
				else if(theSlot.getOriginalType() === 'array'){
					slotValue = valMod.fixBrokenArrStrToProperArray(slotValue);
				}
				else if(theSlot.getOriginalType() === 'date'){
					try{
						slotValue = new Date(slotValue);
					}
					catch(e){
						slotValue = new Date();
					}
				}
			}

            // ...and then if the data differs from current, set the slot, as well as its timestamp and the ctrl variable
            if (theSlot.getValue() !== slotValue)
            {
                if(onGoingTimeOuts[slotName] != undefined){$timeout.cancel(onGoingTimeOuts[slotName]); onGoingTimeOuts[slotName] = undefined;}
                prevState = {op: Enum.undoOps.setSlot, target: $scope.getInstanceId(), execData: [{slotname: slotName, slotvalue: theSlot.getValue()}]};
                theSlot.setTimestamp();
				theSlot.setTimestampMemory();
                theSlot.setValue(slotValue);
                result = bitflags.on(result, Enum.bitFlags_SlotManipulations.ValueChanged);
            }
        }

        if((parseInt(result, 10) & parseInt(Enum.bitFlags_SlotManipulations.ValueChanged, 10)) !== 0){
            if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
				socket.emit('interaction:comm', {id: $scope.getCurrWS().id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.setSlot, target: $scope.getInstanceId(), slotName: slotName, slotValue: slotValue});
            }

			// Slots that are set are stored in undo memory, as long as it is not being set to often, than we only add the value every 5 seconds
			if(theSlot.getTimestampMemory().length <= 1 || ((theSlot.getTimestampMemory()[0] - theSlot.getTimestampMemory()[theSlot.getTimestampMemory().length - 1]) > 5)){
				if($scope.wblStateFlags.readyToStoreUndos && !theSlot.getDoNotIncludeInUndo()){ $scope.addUndo(prevState); }
			}

            modelSharedUpdate(slotName, slotValue);
            slotValueChanged(slotName);

			// Tell parent if it exists and needs to know
			if(theParent_ != undefined && slotName == theSelectedSlot_ && slotConnDir_.send && $scope.gimme(theSelectedSlot_) != theParent_.scope().gimme(theConnectedSlot_)){
				theParent_.scope().set(theConnectedSlot_, $scope.gimme(theSelectedSlot_));
			}

			// Tell children a slot change have happened
			for(var i = 0, c; c = theChildren_[i]; i++){
				if(c.scope() != undefined){
					c.scope().update(slotName);
				}
			}
        }

        return result;
    };
    //========================================================================================


	//========================================================================================
	// Update
	// This method is called by a parent when it gets a slot change so that the child may
	// react on it if it has a slot connection.
	//========================================================================================
	$scope.update = function(slotName){
		if(slotName == theConnectedSlot_ && slotConnDir_.receive && $scope.gimme(theSelectedSlot_) != theParent_.scope().gimme(theConnectedSlot_)){
			$scope.set(theSelectedSlot_, theParent_.scope().gimme(theConnectedSlot_));
		}
	};
	//========================================================================================


    //=== CTRL MAIN CODE =====================================================================

});
//======================================================================================================================
