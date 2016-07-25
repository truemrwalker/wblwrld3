//======================================================================================================================
// Controllers for Event Action Manager for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('EAM_Ctrl', function($scope, $log, $location, Slot, Enum, gettext, bitflags, jsonQuery, $timeout, $http, $window) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        EAMRoot: ['background-color', 'border'],
        EAMTitle: ['color']
    };

    $scope.customMenu = [{itemId: 'openManager', itemTxt: 'Open EA Manager'}];

    $scope.customInteractionBalls = [{index: 4, name: 'openManager', tooltipTxt: 'Open Event Action Manager'}];

    //Internal Webble Properties
    $scope.EAM_WblProps = {
        errorMsg: '',
        EAData: [],
        EADataAsStr: ''
    };

    // Initiation variables
    var relativeInitWatch, noOfRelativesHistory = -1;

    // Webble Protection list
    var wblPrtct = [
        {key: 2, name: 'Resize Not Allowed'},
        {key: 4, name: 'Duplicate Not Allowed'},
        {key: 8, name: 'Shared Model Duplicate Not Allowed'},
        {key: 16, name: 'Delete Not Allowed'},
        {key: 32, name: 'Publish Not Allowed'},
        {key: 64, name: 'Property Change Not Allowed'},
        {key: 128, name: 'Parent Assignment Not Allowed'},
        {key: 256, name: 'Having Children Not Allowed'},
        {key: 512, name: 'Parent Revoking Not Allowed'},
        {key: 1024, name: 'Disconnect Children Not Allowed'},
        {key: 2048, name: 'Bundle Not Allowed'},
        {key: 4096, name: 'Unbundle Not Allowed'},
        {key: 8192, name: 'Default Menu Not Visible'},
        {key: 16384, name: 'Interaction Objects Not Visible'},
        {key: 32768, name: 'Selection Not Allowed'},
        {key: 65536, name: 'Contextmenu Not Allowed'},
        {key: 131072, name: 'Non-Developers Mode Not Visible'}
    ];

    // Platform Execution Modes
    var execModeOpts = ["Developer", "Admin", "Super High Clearance User", "High Clearance User", "Medium Clearance User", "Low Clearance User"];


    // Keeping track of listeners and and the corresponding parameters and actions
    var listenersData = {
        platformMouseEvent: {
            mouseMove: {noOfClients: 0, lastTime: 0, lastPos: {x: 0, y: 0}},
            mouseClick: {noOfClients: 0, lastTime: 0, lastPos: {x: 0, y: 0}, whichBtn: -1},
            mouseWheel: {noOfClients: 0, lastTime: 0, lastPos: {x: 0, y: 0}, deltaY: 0},
            mouseBtnUp: {noOfClients: 0, lastTime: 0, lastPos: {x: 0, y: 0}, whichBtn: -1}
        },
        platformActivityEvent: {
            mainMenuExec: {noOfClients: 0, lastTime: 0, sublink: ''},
            loadingNewWbl: {noOfClients: 0, lastTime: 0, wblId: 0},
            deletingWbl: {noOfClients: 0, lastTime: 0, wblId: 0, wblTemplId: ''},
            keyPress: {noOfClients: 0, lastTime: 0, keyName: '', keyCode: 0, released: false}
        },
        wblMouseEvent:  {
            mouseEnterLeave: {currentListeners: []},
            mouseMove: {currentListeners: []},
            mouseClick: {currentListeners: []},
            mouseWheel: {currentListeners: []}
        },
        wblActivityEvent: {
            menuExec: {currentListeners: []},
            wblDeletion: {currentListeners: [], lastTime: 0, observedWbls: [], deletedWbls: []},
            wblDuplication: {currentListeners: []},
            collision: {}
        }
    };

    //Event timer
    var eventWatchTimer;
    var currTime = 0;
    var firedEventeeList = [];

    //Action Helpers
    var wblsToLoad  = [];
    var wblsToShareModelDupl  = [];



    //=== EVENT HANDLERS ================================================================

    // Watchers pointers
    var mainMenuExecuted, loadingNewWbl, deletingWbl, keyPress, wblMenuExecuted, wblDeleted, wblDuplicated, wblMoved;


    //===================================================================================
    // Mouse Over (Platform)
    //===================================================================================
    var mouseOver = function(e){
        listenersData.platformMouseEvent.mouseMove.lastPos.x = e.pageX - this.offsetLeft;
        listenersData.platformMouseEvent.mouseMove.lastPos.y = e.pageY - this.offsetTop;
        listenersData.platformMouseEvent.mouseMove.lastTime = Date.now();
    };
    //===================================================================================

    //===================================================================================
    // Mouse Enter (Webble)
    //===================================================================================
    var mouseEnterWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseEnterLeave[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, state: 'enter'};
    };
    //===================================================================================


    //===================================================================================
    // Mouse Leave (Webble)
    //===================================================================================
    var mouseLeaveWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseEnterLeave[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, state: 'leave'};
    };
    //===================================================================================


    //===================================================================================
    // Mouse Over (Webble)
    //===================================================================================
    var mouseOverWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseMove[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, state: 'over'};
    };
    //===================================================================================


    //===================================================================================
    // Mouse Leave (Webble) [from mouse move]
    //===================================================================================
    var mouseLeaveMoveWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseMove[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, state: 'leave'};
    };
    //===================================================================================


    //===================================================================================
    // Mouse Click (Platform)
    //===================================================================================
    var mouseClick = function(e){
        listenersData.platformMouseEvent.mouseClick.lastPos.x = e.pageX - this.offsetLeft;
        listenersData.platformMouseEvent.mouseClick.lastPos.y = e.pageY - this.offsetTop;
        listenersData.platformMouseEvent.mouseClick.lastTime = Date.now();
        listenersData.platformMouseEvent.mouseClick.whichBtn = e.which;
    };
    //===================================================================================


    //===================================================================================
    // Mouse Button Up (Platform)
    //===================================================================================
    var mouseBtnUp = function(e){
        listenersData.platformMouseEvent.mouseBtnUp.lastPos.x = e.pageX - this.offsetLeft;
        listenersData.platformMouseEvent.mouseBtnUp.lastPos.y = e.pageY - this.offsetTop;
        listenersData.platformMouseEvent.mouseBtnUp.lastTime = Date.now();
        listenersData.platformMouseEvent.mouseBtnUp.whichBtn = e.which;
    };
    //===================================================================================


    //===================================================================================
    // Mouse Click (Webble)
    //===================================================================================
    var mouseClickWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseClick[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, whichBtn: e.which};
    };
    //===================================================================================


    //===================================================================================
    // Mouse Wheel (Platform)
    //===================================================================================
    var mouseWheel = function(e){
        listenersData.platformMouseEvent.mouseWheel.lastPos.x = e.pageX - this.offsetLeft;
        listenersData.platformMouseEvent.mouseWheel.lastPos.y = e.pageY - this.offsetTop;
        listenersData.platformMouseEvent.mouseWheel.lastTime = Date.now();
        listenersData.platformMouseEvent.mouseWheel.deltaY = e.deltaY;
    };
    //===================================================================================


    //===================================================================================
    // Mouse Wheel (Webble)
    //===================================================================================
    var mouseWheelWbl = function(e){
        var wblElementId = 'wbl_' + $(e.target).scope().getInstanceId();
        listenersData.wblMouseEvent.mouseWheel[wblElementId] = {lastTime: Date.now(), elementHit: e.target.id, deltaY: e.deltaY};
    };
    //===================================================================================




    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        $scope.addSlot(new Slot('EAData',
            [],
            'Event Action Data',
            'The Even Action Data',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('EAData').setDisabledSetting(Enum.SlotDisablingState.PropertyVisibility);

        $scope.addSlot(new Slot('relativeCounter',
            0,
            'No Of Relatives',
            'This Webbles amount of relatives, record kept for initation modification, regarding altered Instance Ids',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('relativeCounter').setDisabledSetting(Enum.SlotDisablingState.ConnectionVisibility);

		$scope.addSlot(new Slot('eventCheckInterval',
			150,
			'Event Check Interval',
			'The interval in milliseconds between each time the Webble will check if an event has occurred. Lower values, more demanding for the system. usually default value of 150 is okay, but in cases where the platform timer is involved, one might need to have a shorter interval.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));


		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'EAData'){
				var newValStr = '';
				for(var i = 0; i < newVal.length; i++) {
					newValStr += newVal[i].strVal
				}

				if(newValStr != $scope.EAM_WblProps.EADataAsStr){
					setEAData(newVal, true);
				}
			}
			else if(eventData.slotName == 'eventCheckInterval'){
				if(isNaN(newVal)){
					$scope.set('eventCheckInterval', 150);
				}
			}
		});

		relativeInitWatch = $scope.$watch(function(){return $scope.gimme('relativeCounter');}, function(newVal, oldVal) {
			noOfRelativesHistory = newVal;
			relativeInitWatch();
		}, true);

        $scope.$watch(function(){return ($scope.getAllDescendants($scope.theView).length + $scope.getAllAncestors($scope.theView).length);}, function(newVal, oldVal) {
            if(!isNaN(newVal)){
                if(parseInt($scope.gimme('relativeCounter')) != newVal){
                    $scope.set('relativeCounter', newVal);
                }
                if(newVal == noOfRelativesHistory){
                    noOfRelativesHistory = -1;
                    modifyOldInstanceIds();
                }
            }
        }, true);

        eventWatchTimer = $timeout($scope.eventWatcher, parseInt($scope.gimme('eventCheckInterval')));
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
        var targetName = $(event.target).scope().getName();

        if (targetName != ""){
            //=== Open Event Action Manager Form ====================================
            if (targetName == $scope.customInteractionBalls[0].name){
                openEAMForm();
            }
            //=============================================
        }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){

        //=== Open Event Action Manager Form ====================================
        if(itemName == $scope.customMenu[0].itemId){
            openEAMForm();
        }
    };
    //===================================================================================


    //========================================================================================
    // Set Event Action Data
    //========================================================================================
    var setEAData = function(whatEAData, comesFromSlot){
        var newEAData = [];

        if(whatEAData == [] || (whatEAData.length > 0 && whatEAData[0].eventGroup)){
            for(var k = 0; k < $scope.EAM_WblProps.EAData.length; k++){
                $scope.EAM_WblProps.EAData[k]['status'] = 0;
            }

            for(var i = 0; i < whatEAData.length; i++){
                if(!(whatEAData[i].strVal == '' || whatEAData[i].strVal.search('Undefined') != -1 || whatEAData[i].eventGroup.length == 0 || whatEAData[i].actionGroup.length == 0)){
                    whatEAData[i]['status'] = 1;
                }

                for(var k = 0; k < $scope.EAM_WblProps.EAData.length; k++){
                    if(whatEAData[i].strVal == $scope.EAM_WblProps.EAData[k].strVal){
                        $scope.EAM_WblProps.EAData[k]['status'] = 1;
                        newEAData.push($scope.EAM_WblProps.EAData[k]);
                        whatEAData[i]['status'] = 0;
                        break;
                    }
                }
            }

            for(var k = 0; k < $scope.EAM_WblProps.EAData.length; k++){
                if($scope.EAM_WblProps.EAData[k].status == 0){
                    resetAndCleanEASet($scope.EAM_WblProps.EAData[k]);
                }
            }

            for(var i = 0; i < whatEAData.length; i++){
                if(whatEAData[i].status == 1){
                    newEAData.push(initiateEASet(whatEAData[i]))
                }
            }

            $scope.EAM_WblProps.EAData = [];
            $scope.EAM_WblProps.EAData = newEAData;
            var newEADataAsStr = '';
            for(var i = 0; i < $scope.EAM_WblProps.EAData.length; i++) {
                newEADataAsStr += $scope.EAM_WblProps.EAData[i].strVal
            }
            $scope.EAM_WblProps.EADataAsStr = newEADataAsStr;

            if(!comesFromSlot){
                $scope.set('EAData', angular.copy($scope.EAM_WblProps.EAData));
            }
        }
    }
    //========================================================================================


    //========================================================================================
    // Open Event Action Manager Form
    //========================================================================================
    var openEAMForm = function(){
        $timeout.cancel(eventWatchTimer);

        $scope.openForm('EAMForm', [{templateUrl: 'event-action-manager-form.html', controller: 'EAMForm_Ctrl', size: 'lg'}, {wblScope: $scope, eaData: $scope.EAM_WblProps.EAData}], closeEAMForm);
    }
    //========================================================================================


    //========================================================================================
    // Close Event Action Manager Form
    //========================================================================================
    var closeEAMForm = function(returnContent){
        if(returnContent != null){
            setEAData(returnContent, false);
        }

        eventWatchTimer = $timeout($scope.eventWatcher, parseInt($scope.gimme('eventCheckInterval')));
    }
    //========================================================================================


    //========================================================================================
    // Modify Old Instance Ids
    //========================================================================================
    var modifyOldInstanceIds = function(){
        var didChange = false;
        var relatives = [], oldToNewInstanceIdList = [];
        relatives = relatives.concat($scope.getAllDescendants($scope.theView));
        relatives = relatives.concat($scope.getAllAncestors($scope.theView));

        for(var i = 0; i  < relatives.length; i++){
            if(relatives[i].scope().theWblMetadata['instanceid'] != relatives[i].scope().getInstanceId()){
                oldToNewInstanceIdList.push({old: relatives[i].scope().theWblMetadata['instanceid'], new: relatives[i].scope().getInstanceId()});
            }
        }

        for(var i = 0, eaPack; eaPack = $scope.EAM_WblProps.EAData[i]; i++) {
            for (var n = 0, ev; ev = eaPack.eventGroup[n]; n++) {
                var idIndex = ev.target.indexOf('[');
                if(idIndex != -1){
                    var wblInstanceId = ev.target.substring(idIndex + 1, ev.target.length - 1);
                    for(var m = 0; m < oldToNewInstanceIdList.length; m++){
                        if(oldToNewInstanceIdList[m].old == wblInstanceId){
                            ev.target = ev.target.replace('[' + wblInstanceId + ']', '[' + oldToNewInstanceIdList[m].new + ']');
                            ev.strVal = ev.strVal.replace('[' + wblInstanceId + ']', '[' + oldToNewInstanceIdList[m].new + ']');
                            didChange = true;
                        }
                    }
                }
            }
            for (var n = 0, ac; ac = eaPack.actionGroup[n]; n++) {
                var idIndex = ac.target.indexOf('[');
                if(idIndex != -1){
                    var wblInstanceId = ac.target.substring(idIndex + 1, ac.target.length - 1);
                    for(var m = 0; m < oldToNewInstanceIdList.length; m++){
                        if(oldToNewInstanceIdList[m].old == wblInstanceId){
                            ac.target = ac.target.replace('[' + wblInstanceId + ']', '[' + oldToNewInstanceIdList[m].new + ']');
                            ac.strVal = ac.strVal.replace('[' + wblInstanceId + ']', '[' + oldToNewInstanceIdList[m].new + ']');
                            didChange = true;
                        }
                    }
                }
            }
        }

        if(didChange){
            $scope.set('EAData', $scope.EAM_WblProps.EAData);
        }
    }
    //========================================================================================


    //========================================================================================
    // get Target
    //========================================================================================
    var getTarget = function(whatTarget, whatParams){
        var theTarget = {ap: null, name: whatTarget}; //Good enough for Platform

        if(whatTarget != 'Platform'){
            var idIndex = whatTarget.indexOf('[');

            // Webble by Instance Id
            if(idIndex != -1){
                var wblInstanceId = whatTarget.substring(idIndex + 1, whatTarget.length - 1);
                var theWbl = $scope.getWebbleByInstanceId(wblInstanceId);
                if(theWbl && whatTarget == theWbl.scope().getWebbleFullName()){
                    theTarget.ap = [theWbl];
                }
            }
            else{
                if(whatTarget == 'Webbles by Template Id'){
                    theTarget.ap = $scope.getWebblesByTemplateId(whatParams.p1);
                }
                else if(whatTarget == 'Webbles by Display Name'){
                    theTarget.ap = $scope.getWebblesByDisplayName(whatParams.p1);
                }
                else if(whatTarget == 'Webbles by Instance Id'){
                    theTarget.ap = [$scope.getWebbleByInstanceId(parseInt(whatParams.p1))];
                }
                else if(whatTarget == 'Webbles by Numerical Display Names'){
                    var theFoundWebbles = [];
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        if (!isNaN(parseInt(aw.scope().getInstanceName().replace(whatParams.p1, '')))){
                            theFoundWebbles.push(aw);
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Webbles by Slot Name'){
                    var theFoundWebbles = [];
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        if (aw.scope().gimme(whatParams.p1)){
                            theFoundWebbles.push(aw);
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Webbles by Slot Value'){
                    var theFoundWebbles = [];
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        var slotVal = !isNaN(parseInt(aw.scope().gimme(whatParams.p1))) ? parseInt(aw.scope().gimme(whatParams.p1)) : aw.scope().gimme(whatParams.p1);
                        var compValue = !isNaN(parseInt(whatParams.p3)) ? parseInt(whatParams.p3) : whatParams.p3
                        var doesQualify = false;

                        switch(whatParams.p2){
                            case '=': if(slotVal == compValue){doesQualify = true;} break;
                            case '<': if(slotVal < compValue){doesQualify = true;} break;
                            case '>': if(slotVal > compValue){doesQualify = true;} break;
                            case '<=': if(slotVal <= compValue){doesQualify = true;} break;
                            case '>=': if(slotVal >= compValue){doesQualify = true;} break;
                            case '!=': if(slotVal != compValue){doesQualify = true;} break;
                        }

                        if(doesQualify){
                            theFoundWebbles.push(aw);
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Webbles by Parent'){
                    var theFoundWebbles = [];
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        var parent = aw.scope().getParent();
                        if(parent && parent.scope().theWblMetadata['displayname'] == whatParams.p1){
                            theFoundWebbles.push(aw);
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Webbles by Child'){
                    var theFoundWebbles = [];
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        for(var n = 0, c; c = aw.scope().getChildren()[n]; n++){
                            if(c.scope().theWblMetadata['displayname'] == whatParams.p1){
                                theFoundWebbles.push(aw);
                                break;
                            }
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Webbles by Protection'){
                    var theFoundWebbles = [];

                    var protectKey = 0;
                    for(var i = 0; i < wblPrtct.length; i++){
                        if(wblPrtct[i].name == whatParams.p3){
                            protectKey = wblPrtct[i].key;
                            break;
                        }
                    }

                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        var doesQualify = false;
                        switch(whatParams.p2){
                            case 'ON': if((parseInt(aw.scope().getProtection(), 10) & protectKey) !== 0){ doesQualify = true; } break;
                            case 'OFF': if((parseInt(aw.scope().getProtection(), 10) & protectKey) == 0){ doesQualify = true; } break;
                        }

                        if(doesQualify){
                            theFoundWebbles.push(aw);
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
                else if(whatTarget == 'Most Recent Loaded'){
                    var theLatestLoaded, theHighestInstanceId = 0;
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        if (aw.scope()){
                            var thisWblInstanceId = aw.scope().getInstanceId();
                            if(thisWblInstanceId > theHighestInstanceId){
                                theHighestInstanceId = thisWblInstanceId;
                                theLatestLoaded = aw;
                            }
                        }
                    }
                    theTarget.ap = [theLatestLoaded];
                }
                else if(whatTarget == 'Fired Eventee'){
                    var theFoundWebbles = [];
                    for(var i = 0; i < firedEventeeList.length; i++){
                        var aw = $scope.getWebbleByInstanceId(firedEventeeList[i]);
                        if(aw){
                            theFoundWebbles.push(aw)
                        }
                    }
                    theTarget.ap = theFoundWebbles;
                }
            }
        }
        return theTarget;
    }
    //========================================================================================


    //========================================================================================
    // Get Target Memory
    //========================================================================================
    var getTargetMemory = function(whatTarget, whatEvent){
        var tMem;

        for(var i = 0, tm; tm = whatEvent.targetMemory[i]; i++){
            if(tm.t == whatTarget){
                tMem = tm.m;
                break;
            }
        }
        return tMem;
    }
    //========================================================================================


    //========================================================================================
    // Set Target Memory
    //========================================================================================
    var setTargetMemory = function(whatTarget, whatEvent, whatMem){
        var didExist = false;
        for(var i = 0, tm; tm = whatEvent.targetMemory[i]; i++){
            if(tm.t == whatTarget){
                didExist = true;
                tm.m = whatMem;
                break;
            }
        }

        if(!didExist){
            whatEvent.targetMemory.push({t: whatTarget, m: whatMem})
        }
    }
    //========================================================================================


    //========================================================================================
    // Get Calculated Value
    //========================================================================================
    var getCalculatedValue = function(whatCalc){
        var toBeCalculated = whatCalc, workStr = whatCalc;
        var wblStr;
        var wbl = undefined;

        do {
            var testIndex1 = workStr.indexOf('{');
            var testIndex2 = workStr.indexOf('}');
            wblStr = '';

            if(testIndex1 != -1 && testIndex2 != -1 && testIndex2 > testIndex1){
                wblStr = workStr.substring(testIndex1 + 1, testIndex2);
            }

            var wblSlotVal;
            var wblSlotValTarget;
            if(wblStr != ''){
                var wblId = parseInt(wblStr.substring(wblStr.indexOf('[') + 1, wblStr.indexOf(']')));
                wbl = undefined;
                if(!isNaN(wblId)){
                  wbl = $scope.getWebbleByInstanceId(wblId);
                }
                var wblDispName = '';
                if(wbl == undefined){
                    wblDispName = wblStr.substring(0, wblStr.indexOf('-->'));
                    if(wblDispName == 'Fired Eventee'){
                        for(var i = 0; i < firedEventeeList.length; i++){
                          var aw = $scope.getWebbleByInstanceId(firedEventeeList[i]);
                          if(aw){
                            wbl = aw;
                            break;
                          }
                        }
                    }
                    else{
                      wbl = $scope.getWebblesByDisplayName(wblDispName)[0];
                    }
                }
                else{
                    wblDispName = wblStr.substring(0, wblStr.indexOf('/') - 1);
                    if(wblDispName != wbl.scope().theWblMetadata['displayname']){
                      wbl = $scope.getWebblesByDisplayName(wblDispName)[0];
                    }
                }
                var slot = wblStr.substring(wblStr.indexOf('-->') + 3);

                //Extract Json Target
                var testSlotIndex1 = slot.indexOf('[');
                var testSlotIndex2 = slot.indexOf(']');
                if(testSlotIndex1 != -1 && testSlotIndex2 != -1 && testSlotIndex2 > testSlotIndex1){
                    wblSlotValTarget = slot.substring(testSlotIndex1 + 1, testSlotIndex2);
                    slot = slot.substring(0, testSlotIndex1);
                }

                wblSlotVal = wbl.scope().gimme(slot);
            }

            if(wblSlotVal != undefined && !isNaN(parseFloat(wblSlotVal))){
                wblSlotVal = parseFloat(wblSlotVal);
            }

            if(wblSlotValTarget != undefined && wblSlotVal.toString() == '[object Object]'){
                wblSlotVal = jsonQuery.allValByKey(wblSlotVal, wblSlotValTarget)
            }

            if(wblSlotVal != undefined){
                if(wblSlotVal.toString() != '[object Object]'){
                    toBeCalculated = toBeCalculated.replace(('{' + wblStr  +'}'), wblSlotVal);
                }
                else{
                    toBeCalculated = toBeCalculated.replace(('{' + wblStr  +'}'), JSON.stringify(wblSlotVal));
                }
            }

            workStr = workStr.substring(testIndex2 + 1);
        } while (wblStr.length > 0);


        try{
            toBeCalculated = eval(toBeCalculated);
        }
        catch(err){
        }

        return toBeCalculated;
    }
    //========================================================================================




    //========================================================================================
    // Enable Event Listeners
    //========================================================================================
    var enableEventListeners = function(whatEvGrItem){
        var target = getTarget(whatEvGrItem.target, whatEvGrItem.tParams);

        if(target.ap == null && target.name == 'Platform'){
            if(whatEvGrItem.operation == 'Mouse Event'){
                if(whatEvGrItem.oParams.p1 == 'Mouse Enter Area' || whatEvGrItem.oParams.p1 == 'Mouse Leave Area' || whatEvGrItem.oParams.p1 == 'Mouse Over Area'){
                    if(listenersData.platformMouseEvent.mouseMove.noOfClients == 0){
                        $('#workspaceSurface').bind( "mousemove", mouseOver);
                    }
                    listenersData.platformMouseEvent.mouseMove.noOfClients++;
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Click' || whatEvGrItem.oParams.p1 == 'Mouse Middle Button Click'){
                    if(listenersData.platformMouseEvent.mouseClick.noOfClients == 0){
                        $('#workspaceSurface').bind( "click", mouseClick);
                    }
                    listenersData.platformMouseEvent.mouseClick.noOfClients++;
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Wheel Move'){
                    if(listenersData.platformMouseEvent.mouseWheel.noOfClients == 0){
                        $('#workspaceSurface').bind( "mousewheel", mouseWheel);
                    }
                    listenersData.platformMouseEvent.mouseWheel.noOfClients++;
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Up'){
                    if(listenersData.platformMouseEvent.mouseBtnUp.noOfClients == 0){
                      $('#workspaceSurface').bind( "mouseup", mouseBtnUp);
                    }
                    listenersData.platformMouseEvent.mouseBtnUp.noOfClients++;
                }
            }
            else if(whatEvGrItem.operation == 'Main Menu Item Selected'){
                if(listenersData.platformActivityEvent.mainMenuExec.noOfClients == 0){
					mainMenuExecuted = $scope.registerWWEventListener(Enum.availableWWEvents.mainMenuExecuted, function(eventData){
						listenersData.platformActivityEvent.mainMenuExec.lastTime = eventData.timestamp;
						listenersData.platformActivityEvent.mainMenuExec.sublink = eventData.menuId;
					});
                }
                listenersData.platformActivityEvent.mainMenuExec.noOfClients++;
            }
            else if(whatEvGrItem.operation == 'New Webble Loaded'){
                if(listenersData.platformActivityEvent.loadingNewWbl.noOfClients == 0){
					loadingNewWbl = $scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
						listenersData.platformActivityEvent.loadingNewWbl.lastTime = eventData.timestamp;
						listenersData.platformActivityEvent.loadingNewWbl.wblId = eventData.targetId;
					});
                }
                listenersData.platformActivityEvent.loadingNewWbl.noOfClients++;
            }
            else if(whatEvGrItem.operation == 'Webble Deleted'){
                if(listenersData.platformActivityEvent.deletingWbl.noOfClients == 0){
					deletingWbl = $scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
						listenersData.platformActivityEvent.deletingWbl.lastTime = eventData.timestamp;
						listenersData.platformActivityEvent.deletingWbl.wblId = eventData.targetId;
						listenersData.platformActivityEvent.deletingWbl.wblTemplId = $scope.getWebbleByInstanceId(eventData.targetId).scope().theWblMetadata['templateid'];
					}, null);
                }
                listenersData.platformActivityEvent.deletingWbl.noOfClients++;
            }
            else if(whatEvGrItem.operation == 'Keyboard Event'){
                if(listenersData.platformActivityEvent.keyPress.noOfClients == 0){
					keyPress = $scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
						if(!$scope.getIsFormOpen()){
							listenersData.platformActivityEvent.keyPress.lastTime = eventData.timestamp;
							listenersData.platformActivityEvent.keyPress.keyName = eventData.key.name;
							listenersData.platformActivityEvent.keyPress.keyCode = eventData.key.code;
							listenersData.platformActivityEvent.keyPress.released = eventData.key.released;
						}
					});
                }
                listenersData.platformActivityEvent.keyPress.noOfClients++;
            }
        }
        else if(target.ap != null){
            for(var k = 0, t; t = target.ap[k]; k++){
                if(whatEvGrItem.operation == 'Mouse Event'){
                    if(whatEvGrItem.oParams.p1 == 'Mouse Enter Area' || whatEvGrItem.oParams.p1 == 'Mouse Leave Area'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "mouseenter", mouseEnterWbl);
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "mouseleave", mouseLeaveWbl);
                        }
                        else{
                            t.bind("mouseenter", mouseEnterWbl);
                            t.bind("mouseleave", mouseLeaveWbl);
                        }
                        var tId = t.scope().getInstanceId();
                        listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.push(tId);
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Over Area'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "mousemove", mouseOverWbl);
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "mouseleave", mouseLeaveMoveWbl);
                        }
                        else{
                            t.bind("mousemove", mouseOverWbl);
                            t.bind("mouseleave", mouseLeaveMoveWbl);
                        }
                        var tId = t.scope().getInstanceId();
                        listenersData.wblMouseEvent.mouseMove.currentListeners.push(tId);
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Click' || whatEvGrItem.oParams.p1 == 'Mouse Middle Button Click'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "click", mouseClickWbl);
                        }
                        else{
                            t.bind("click", mouseClickWbl);
                        }
                        var tId = t.scope().getInstanceId();
                        listenersData.wblMouseEvent.mouseClick.currentListeners.push(tId);
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Wheel Move'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).bind( "mousewheel", mouseWheelWbl);
                        }
                        else{
                            t.bind("mousewheel", mouseWheelWbl);
                        }
                        var tId = t.scope().getInstanceId();
                        listenersData.wblMouseEvent.mouseWheel.currentListeners.push(tId);
                    }
                }
                else if(whatEvGrItem.operation == 'Webble Menu Item Selected'){
                    if(listenersData.wblActivityEvent.menuExec.currentListeners.length == 0){
						wblMenuExecuted = $scope.registerWWEventListener(Enum.availableWWEvents.wblMenuExecuted, function(eventData){
							var wblElementId = 'wbl_' + eventData.targetId;
							listenersData.wblActivityEvent.menuExec[wblElementId] = {lastTime: eventData.timestamp, sublinkId: Enum.availableOnePicks_DefaultWebbleMenuTargets[eventData.menuId]};
						}, null);
                    }
                    var tId = t.scope().getInstanceId();
                    listenersData.wblActivityEvent.menuExec.currentListeners.push(tId);
                }
                else if(whatEvGrItem.operation == 'Was Deleted'){
                    if(listenersData.wblActivityEvent.wblDeletion.currentListeners.length == 0){
						wblDeleted = $scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
							listenersData.wblActivityEvent.wblDeletion.lastTime = eventData.timestamp;
							listenersData.wblActivityEvent.wblDeletion.deletedWbls.push(eventData.targetId);
						}, null);
                    }
                    var tId = t.scope().getInstanceId();
                    listenersData.wblActivityEvent.wblDeletion.currentListeners.push(tId);
                }
                else if(whatEvGrItem.operation == 'Was Duplicated'){
                    if(listenersData.wblActivityEvent.wblDuplication.currentListeners.length == 0){
						wblDuplicated = $scope.registerWWEventListener(Enum.availableWWEvents.duplicated, function(eventData){
							var wblElementId = 'wbl_' + eventData.targetId;
							listenersData.wblActivityEvent.wblDuplication[wblElementId] = {lastTime: eventData.timestamp, duplId: eventData.copyId};
						}, null);
                    }
                    var tId = t.scope().getInstanceId();
                    listenersData.wblActivityEvent.wblDuplication.currentListeners.push(tId);
                }
                else if(whatEvGrItem.operation == 'Collision Event'){
                    // Nothing is needed to be done here, event watch will fix it on its own
                }
            }
        }
    }
    //========================================================================================


    //========================================================================================
    // Disable Event Listeners
    //========================================================================================
    var disableEventListeners = function(whatEvGrItem){
        var target = getTarget(whatEvGrItem.target, whatEvGrItem.tParams);

        if(target.ap == null && target.name == 'Platform'){
            if(whatEvGrItem.operation == 'Mouse Event'){
                if(whatEvGrItem.oParams.p1 == 'Mouse Enter Area' || whatEvGrItem.oParams.p1 == 'Mouse Leave Area' || whatEvGrItem.oParams.p1 == 'Mouse Over Area'){
                    listenersData.platformMouseEvent.mouseMove.noOfClients--;
                    if(listenersData.platformMouseEvent.mouseMove.noOfClients == 0){
                        $('#workspaceSurface').unbind( "mousemove", mouseOver);
                    }
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Click' || whatEvGrItem.oParams.p1 == 'Mouse Middle Button Click'){
                    listenersData.platformMouseEvent.mouseClick.noOfClients--;
                    if(listenersData.platformMouseEvent.mouseClick.noOfClients == 0){
                        $('#workspaceSurface').unbind( "click", mouseClick);
                    }
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Wheel Move'){
                    listenersData.platformMouseEvent.mouseWheel.noOfClients--;
                    if(listenersData.platformMouseEvent.mouseWheel.noOfClients == 0){
                        $('#workspaceSurface').unbind( "mousewheel", mouseWheel);
                    }
                }
                else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Up'){
                    listenersData.platformMouseEvent.mouseBtnUp.noOfClients--;
                    if(listenersData.platformMouseEvent.mouseBtnUp.noOfClients == 0){
                        $('#workspaceSurface').unbind( "mouseup", mouseBtnUp);
                    }
                }
            }
            else if(whatEvGrItem.operation == 'Main Menu Item Selected'){
                listenersData.platformActivityEvent.mainMenuExec.noOfClients--;
                if(listenersData.platformActivityEvent.mainMenuExec.noOfClients == 0){
                    mainMenuExecuted();
                }
            }
            else if(whatEvGrItem.operation == 'New Webble Loaded'){
                listenersData.platformActivityEvent.loadingNewWbl.noOfClients--;
                if(listenersData.platformActivityEvent.loadingNewWbl.noOfClients == 0){
                    loadingNewWbl();
                }
            }
            else if(whatEvGrItem.operation == 'Webble Deleted'){
                listenersData.platformActivityEvent.deletingWbl.noOfClients--;
                if(listenersData.platformActivityEvent.deletingWbl.noOfClients == 0){
                    deletingWbl();
                }
            }
            else if(whatEvGrItem.operation == 'Keyboard Event'){
                listenersData.platformActivityEvent.keyPress.noOfClients--;
                if(listenersData.platformActivityEvent.keyPress.noOfClients == 0){
                    keyPress();
                }
            }
        }
        else if(target.ap != null){
            for(var k = 0, t; t = target.ap[k]; k++){
                var tId = t.scope().getInstanceId();
                if(whatEvGrItem.operation == 'Mouse Event'){
                    if(whatEvGrItem.oParams.p1 == 'Mouse Enter Area' || whatEvGrItem.oParams.p1 == 'Mouse Leave Area'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "mouseenter", mouseEnterWbl);
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "mouseleave", mouseLeaveWbl);
                        }
                        else{
                            t.unbind( "mouseenter", mouseEnterWbl);
                            t.unbind( "mouseleave", mouseLeaveWbl);
                        }

                        var index = -1;
                        for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseEnterLeave.currentListeners[w]; w++){
                            if(tId == listenerId){
                                index = w;
                                break;
                            }
                        }
                        if(index > -1){
                            listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.splice(index,1);
                        }
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Over Area'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "mousemove", mouseOverWbl);
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "mouseleave", mouseLeaveMoveWbl);
                        }
                        else{
                            t.unbind( "mousemove", mouseOverWbl);
                            t.unbind( "mouseleave", mouseLeaveMoveWbl);
                        }

                        var index = -1;
                        for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseMove.currentListeners[w]; w++){
                            if(tId == listenerId){
                                index = w;
                                break;
                            }
                        }
                        if(index > -1){
                            listenersData.wblMouseEvent.mouseMove.currentListeners.splice(index,1);
                        }
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Left Button Click' || whatEvGrItem.oParams.p1 == 'Mouse Middle Button Click'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "click", mouseClickWbl);
                        }
                        else{
                            t.unbind( "click", mouseClickWbl);
                        }

                        var index = -1;
                        for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseClick.currentListeners[w]; w++){
                            if(tId == listenerId){
                                index = w;
                                break;
                            }
                        }
                        if(index > -1){
                            listenersData.wblMouseEvent.mouseClick.currentListeners.splice(index,1);
                        }
                    }
                    else if(whatEvGrItem.oParams.p1 == 'Mouse Wheel Move'){
                        if(whatEvGrItem.oParams.p5 != '' && t.find('#' + whatEvGrItem.oParams.p5)){
                            t.find('#' + whatEvGrItem.oParams.p5).unbind( "mousewheel", mouseWheelWbl);
                        }
                        else{
                            t.unbind( "mousewheel", mouseWheelWbl);
                        }

                        var index = -1;
                        for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseWheel.currentListeners[w]; w++){
                            if(tId == listenerId){
                                index = w;
                                break;
                            }
                        }
                        if(index > -1){
                            listenersData.wblMouseEvent.mouseWheel.currentListeners.splice(index,1);
                        }
                    }
                }
                else if(whatEvGrItem.operation == 'Webble Menu Item Selected'){
                    var index = -1;
                    for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.menuExec.currentListeners[w]; w++){
                        if(tId == listenerId){
                            index = w;
                            break;
                        }
                    }
                    if(index > -1){
                        listenersData.wblActivityEvent.menuExec.currentListeners.splice(index,1);
                    }

                    if(listenersData.wblActivityEvent.menuExec.currentListeners.length == 0){
                        wblMenuExecuted();
                    }
                }
                else if(whatEvGrItem.operation == 'Was Deleted'){
                    var index = -1;
                    for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.wblDeletion.currentListeners[w]; w++){
                        if(tId == listenerId){
                            index = w;
                            break;
                        }
                    }
                    if(index > -1){
                        listenersData.wblActivityEvent.wblDeletion.currentListeners.splice(index,1);
                    }

                    if(listenersData.wblActivityEvent.wblDeletion.currentListeners.length == 0){
                        wblDeleted();
                    }
                }
                else if(whatEvGrItem.operation == 'Was Duplicated'){
                    var index = -1;
                    for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.wblDuplication.currentListeners[w]; w++){
                        if(tId == listenerId){
                            index = w;
                            break;
                        }
                    }
                    if(index > -1){
                        listenersData.wblActivityEvent.wblDuplication.currentListeners.splice(index,1);
                    }

                    if(listenersData.wblActivityEvent.wblDuplication.currentListeners.length == 0){
                        wblDuplicated();
                    }
                }
                else if(whatEvGrItem.operation == 'Collision Event'){
                    if(wblMoved != undefined){
                        wblMoved();
                        wblMoved = undefined;
                        listenersData.wblActivityEvent.collision = {};
                    }
                }
            }
        }
    }
    //========================================================================================


    //========================================================================================
    // Event Watcher
    //========================================================================================
    $scope.eventWatcher = function(){
        for(var i = 0, eaPack; eaPack = $scope.EAM_WblProps.EAData[i]; i++){
            var evGroupEvaluation = '';
            firedEventeeList = [];
            for(var n = 0, ev; ev = eaPack.eventGroup[n]; n++){
                var eventWasTriggered = false;
                var target = getTarget(ev.target, ev.tParams);

                if(target.ap == null && target.name == 'Platform'){
                    if(ev.operation == 'Mouse Event') {
                        if (ev.oParams.p1 == 'Mouse Enter Area') {
                            if(listenersData.platformMouseEvent.mouseMove.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseMove.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseMove.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseMove.lastPos.y < ev.oParams.p4.bottom){
                                if(!ev.oParams.p5){
                                    ev.oParams.p5 = true;
                                    eventWasTriggered = true;
                                }
                            }
                            else{ ev.oParams.p5 = false;}
                        }
                        if (ev.oParams.p1 == 'Mouse Leave Area') {
                            if(listenersData.platformMouseEvent.mouseMove.lastPos.x < ev.oParams.p4.left || listenersData.platformMouseEvent.mouseMove.lastPos.x > ev.oParams.p4.right || listenersData.platformMouseEvent.mouseMove.lastPos.y < ev.oParams.p4.top || listenersData.platformMouseEvent.mouseMove.lastPos.y > ev.oParams.p4.bottom){
                                if(!ev.oParams.p5){
                                    ev.oParams.p5 = true;
                                    eventWasTriggered = true;
                                }
                            }
                            else{ ev.oParams.p5 = false;}
                        }
                        if (ev.oParams.p1 == 'Mouse Over Area') {
                            if(listenersData.platformMouseEvent.mouseMove.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseMove.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseMove.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseMove.lastPos.y < ev.oParams.p4.bottom){
                                eventWasTriggered = true;
                            }
                        }
                        else if(ev.oParams.p1 == 'Mouse Left Button Click'){
                            if(listenersData.platformMouseEvent.mouseClick.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseClick.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseClick.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseClick.lastPos.y < ev.oParams.p4.bottom){
                                if(listenersData.platformMouseEvent.mouseClick.whichBtn == 1 && ev.oParams.p5 != listenersData.platformMouseEvent.mouseClick.lastTime){
                                    ev.oParams.p5 = listenersData.platformMouseEvent.mouseClick.lastTime;
                                    eventWasTriggered = true;
                                }
                            }
                        }
                        else if(ev.oParams.p1 == 'Mouse Middle Button Click'){
                            if(listenersData.platformMouseEvent.mouseClick.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseClick.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseClick.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseClick.lastPos.y < ev.oParams.p4.bottom){
                                if(listenersData.platformMouseEvent.mouseClick.whichBtn == 2 && ev.oParams.p5 != listenersData.platformMouseEvent.mouseClick.lastTime){
                                    ev.oParams.p5 = listenersData.platformMouseEvent.mouseClick.lastTime;
                                    eventWasTriggered = true;
                                }
                            }
                        }
                        else if(ev.oParams.p1 == 'Mouse Wheel Move'){
                            if(listenersData.platformMouseEvent.mouseWheel.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseWheel.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseWheel.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseWheel.lastPos.y < ev.oParams.p4.bottom){
                                if((ev.oParams.p2 == 'Up' && listenersData.platformMouseEvent.mouseWheel.deltaY == 1) || (ev.oParams.p2 == 'Down' && listenersData.platformMouseEvent.mouseWheel.deltaY == -1)){
                                    if(ev.oParams.p5 != listenersData.platformMouseEvent.mouseWheel.lastTime){
                                        ev.oParams.p5 = listenersData.platformMouseEvent.mouseWheel.lastTime;
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                        }
                        else if(ev.oParams.p1 == 'Mouse Left Button Up'){
                            if(listenersData.platformMouseEvent.mouseBtnUp.lastPos.x > ev.oParams.p4.left && listenersData.platformMouseEvent.mouseBtnUp.lastPos.x < ev.oParams.p4.right && listenersData.platformMouseEvent.mouseBtnUp.lastPos.y > ev.oParams.p4.top && listenersData.platformMouseEvent.mouseBtnUp.lastPos.y < ev.oParams.p4.bottom){
                                if(listenersData.platformMouseEvent.mouseBtnUp.whichBtn == 1 && ev.oParams.p5 != listenersData.platformMouseEvent.mouseBtnUp.lastTime){
                                    ev.oParams.p5 = listenersData.platformMouseEvent.mouseBtnUp.lastTime;
                                    eventWasTriggered = true;
                                }
                            }
                        }
                    }
                    else if(ev.operation == 'Platform Prop Changed'){
                        var currValue, cmpVal;
                        if(ev.oParams.p1 == 'Execution Mode'){
                            currValue = $scope.getCurrentExecutionMode();
                            for(var i = 0; i < execModeOpts.length; i++){
                                if(ev.oParams.p3 == execModeOpts[i]){
                                    cmpVal = i;
                                    break;
                                }
                            }
                        }
                        else if(ev.oParams.p1 == 'Background Color'){
                            currValue = $scope.getPlatformBkgColor();
                            cmpVal = ev.oParams.p3;
                        }

                        if(ev.oParams.p2 == '='){
                            if(currValue == cmpVal) {eventWasTriggered = true;}
                        }
                        else{
                            if(currValue != cmpVal) {eventWasTriggered = true;}
                        }
                    }
                    else if(ev.operation == 'Main Menu Item Selected'){
                        if(listenersData.platformActivityEvent.mainMenuExec.sublink == ev.oParams.p5.itemId && ev.oParams.p4 != listenersData.platformActivityEvent.mainMenuExec.lastTime){
                            ev.oParams.p4 = listenersData.platformActivityEvent.mainMenuExec.lastTime;
                            eventWasTriggered = true;
                        }
                    }
                    else if(ev.operation == 'New Webble Loaded'){
                        if(ev.oParams.p5 != listenersData.platformActivityEvent.loadingNewWbl.lastTime){
                            ev.oParams.p5 = listenersData.platformActivityEvent.loadingNewWbl.lastTime;
                            var theWbl = $scope.getWebbleByInstanceId(parseInt(listenersData.platformActivityEvent.loadingNewWbl.wblId));
                            if(theWbl){
                                var wblTemplateId = theWbl.scope().theWblMetadata['templateid'];
                                if(ev.oParams.p1 == '' || parseInt(ev.oParams.p1) == listenersData.platformActivityEvent.loadingNewWbl.wblId || ev.oParams.p1 == wblTemplateId){
                                    eventWasTriggered = true;
                                }
                            }
                        }
                    }
                    else if(ev.operation == 'Webble Deleted'){
                        if(ev.oParams.p5 != listenersData.platformActivityEvent.deletingWbl.lastTime){
                            ev.oParams.p5 = listenersData.platformActivityEvent.deletingWbl.lastTime;
                            if(ev.oParams.p1 == '' || parseInt(ev.oParams.p1) == listenersData.platformActivityEvent.deletingWbl.wblId || ev.oParams.p1 == listenersData.platformActivityEvent.deletingWbl.wblTemplId){
                                eventWasTriggered = true;
                            }
                        }
                    }
                    else if(ev.operation == 'Timer Countdown Reached'){
                        currTime = Date.now();
                        if(!isNaN(ev.oParams.p1)){
                            if(currTime - ev.oParams.p5 > parseInt(ev.oParams.p1)){
                                ev.oParams.p5 = currTime;
                                eventWasTriggered = true;
                            }
                        }
                        else{
                            var calculatedTime = getCalculatedValue(ev.oParams.p1);
                            if(!isNaN(calculatedTime)){
                                if(currTime - ev.oParams.p5 > parseInt(calculatedTime)){
                                    ev.oParams.p5 = currTime;
                                    eventWasTriggered = true;
                                }
                            }
                        }
                    }
                    else if(ev.operation == 'Keyboard Event'){
                        if((listenersData.platformActivityEvent.keyPress.lastTime - ev.oParams.p5) > 100){
                            ev.oParams.p5 = listenersData.platformActivityEvent.keyPress.lastTime;
                            if(ev.oParams.p1.search('##') == -1){
                                if(ev.oParams.p1 == '' || ev.oParams.p1.toUpperCase() == listenersData.platformActivityEvent.keyPress.keyName || parseInt(ev.oParams.p1) == listenersData.platformActivityEvent.keyPress.keyCode){
                                  eventWasTriggered = true;
                                }
                            }
                            else{
                                if(listenersData.platformActivityEvent.keyPress.released == true){
                                    if(ev.oParams.p1 == '##' || ev.oParams.p1.toUpperCase() == '##'+listenersData.platformActivityEvent.keyPress.keyName || parseInt(ev.oParams.p1) == listenersData.platformActivityEvent.keyPress.keyCode){
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                        }
                    }
                }
                else if(target.ap != null){
                    var trulyTriggered = false;
                    if(ev.targetMemory == undefined){
                        ev.targetMemory = [];
                        for(var k = 0; k < target.ap.length; k++){
                            ev.targetMemory.push({t: target.ap[k].scope().getInstanceId(), m: undefined});
                        }
                    }

                    for(var k = 0, t; t = target.ap[k]; k++){
                        eventWasTriggered = false;
                        var tMem = getTargetMemory(t.scope().getInstanceId(), ev);

                        if(ev.operation == 'Relation Changed Event'){
                            if(ev.oParams.p1 == "Child Added"){
                                var noOfC = t.scope().getChildren().length;
                                if(noOfC != tMem){ setTargetMemory(t.scope().getInstanceId(), ev, noOfC); }
                                if(tMem != undefined && noOfC > tMem){
                                    var addedChild = t.scope().getChildren()[t.scope().getChildren().length - 1];
                                    if(ev.oParams.p2 == '' || parseInt(ev.oParams.p2) == addedChild.scope().getInstanceId() || ev.oParams.p2 == addedChild.scope().theWblMetadata['templateid']){
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                            else if(ev.oParams.p1 == "Child Removed"){
                                var noOfC = t.scope().getChildren().length;
                                if(tMem == undefined || noOfC != tMem.noOfC){
                                    var idList = [], templateList = [];
                                    for(var v = 0, c; c = t.scope().getChildren()[v]; v++){
                                        idList.push(c.scope().getInstanceId());
                                        templateList.push(c.scope().theWblMetadata['templateid']);
                                    }
                                    setTargetMemory(t.scope().getInstanceId(), ev, {noOfC: noOfC, il: idList, tl: templateList});
                                }
                                if(tMem != undefined && noOfC < tMem.noOfC){
                                    var removedChildInstanceId, removedChildTemplateId;
                                    for(var w = 0; w < tMem.il.length; w++){
                                        var theLostId = 0;
                                        for(var v = 0, c; c = t.scope().getChildren()[v]; v++){
                                            if(c.scope().getInstanceId() == tMem.il[w]){
                                                theLostId = tMem.il[w];
                                                break;
                                            }
                                        }
                                        if(theLostId == 0){
                                            removedChildInstanceId = tMem.il[w];
                                            removedChildTemplateId = tMem.tl[w];
                                            break;
                                        }
                                    }

                                    if(ev.oParams.p2 == '' || parseInt(ev.oParams.p2) == removedChildInstanceId || ev.oParams.p2 == removedChildTemplateId){
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                            else if(ev.oParams.p1 == "Got Parent"){
                                var p = t.scope().getParent(), pId = 0;
                                if(p != undefined){ pId = p.scope().getInstanceId(); }
                                if(pId != tMem){ setTargetMemory(t.scope().getInstanceId(), ev, pId); }
                                if(tMem != undefined && pId != 0 && pId != tMem){
                                    var addedParent = p;
                                    if(ev.oParams.p2 == '' || parseInt(ev.oParams.p2) == addedParent.scope().getInstanceId() || ev.oParams.p2 == addedParent.scope().theWblMetadata['templateid']){
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                            else if(ev.oParams.p1 == "Lost Parent"){
                                var p = t.scope().getParent(), pId = 0, tId = '';
                                if(p != undefined){ pId = p.scope().getInstanceId(); tId = p.scope().theWblMetadata['templateid']; }
                                if(tMem == undefined || pId != tMem.pi){ setTargetMemory(t.scope().getInstanceId(), ev, {pi: pId, ti: tId}); }
                                if(tMem != undefined && tMem.pi != 0 && pId != tMem.pi){
                                    if(ev.oParams.p2 == '' || parseInt(ev.oParams.p2) == tMem.pi || ev.oParams.p2 == tMem.ti){
                                        eventWasTriggered = true;
                                    }
                                }
                            }
                        }
                        else if(ev.operation == 'Slot Value Changed'){
                            var theSlotVal = t.scope().gimme(ev.oParams.p1);
                            if(!theSlotVal && ev.oParams.p1 == 'displayname'){
                                theSlotVal = t.scope().theWblMetadata['displayname'];
                            }
                            if(theSlotVal !== tMem){ setTargetMemory(t.scope().getInstanceId(), ev, theSlotVal); }

                            if(theSlotVal !== tMem || ev.oParams.p4.repeat == true){
                                if(theSlotVal != undefined && !isNaN(parseFloat(theSlotVal))){
                                    theSlotVal = parseFloat(theSlotVal);
                                }

                                var calcVal = getCalculatedValue(ev.oParams.p3);

								if(!isNaN(calcVal)){ calcVal = parseFloat(calcVal); }
								if(!isNaN(theSlotVal)){ theSlotVal = parseFloat(theSlotVal); }

                                switch(ev.oParams.p2){
                                    case '=': eventWasTriggered = (theSlotVal == calcVal ? true : false ); break;
                                    case '<': eventWasTriggered = (theSlotVal < calcVal ? true : false ); break;
                                    case '>': eventWasTriggered = (theSlotVal > calcVal ? true : false ); break;
                                    case '≤': eventWasTriggered = (theSlotVal <= calcVal ? true : false ); break;
                                    case '≥': eventWasTriggered = (theSlotVal >= calcVal ? true : false ); break;
                                    case '≠': eventWasTriggered = (theSlotVal != calcVal ? true : false ); break;
                                    case '⊆': if(theSlotVal.toString().search(calcVal.toString())){eventWasTriggered = true;} break;
                                    case '⊇': if(calcVal.toString().search(theSlotVal.toString())){eventWasTriggered = true;} break;
                                }
                            }
                        }
                        else if(ev.operation == 'Mouse Event'){
                            var tId = t.scope().getInstanceId();
                            var wblElementId = 'wbl_' + tId;

                            if(ev.oParams.p1 == 'Mouse Enter Area'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "mouseenter", mouseEnterWbl);
                                        t.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveWbl);
                                    }
                                    else{
                                        t.bind( "mouseenter", mouseEnterWbl);
                                        t.bind( "mouseleave", mouseLeaveWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseEnterLeave[wblElementId] != undefined){
                                    if(listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].state == 'enter' && tMem != 'enter'){
                                        if(ev.oParams.p5 == '' || ev.oParams.p5 == listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].elementHit){
                                            eventWasTriggered = true;
                                        }
                                    }
                                    setTargetMemory(tId, ev, listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].state);
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseEnterLeave.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mouseenter", mouseEnterWbl);
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "mouseenter", mouseEnterWbl);
                                            stopListeningWbl.unbind( "mouseleave", mouseLeaveWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseEnterLeave.currentListeners = newListenersList;
                            }
                            else if(ev.oParams.p1 == 'Mouse Leave Area'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseEnterLeave.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "mouseenter", mouseEnterWbl);
                                        t.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveWbl);
                                    }
                                    else{
                                        t.bind( "mouseenter", mouseEnterWbl);
                                        t.bind( "mouseleave", mouseLeaveWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseEnterLeave[wblElementId] != undefined){
                                    if(listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].state == 'leave' && tMem != 'leave'){
                                        if(ev.oParams.p5 == '' || ev.oParams.p5 == listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].elementHit){
                                            eventWasTriggered = true;
                                        }
                                    }
                                    setTargetMemory(tId, ev, listenersData.wblMouseEvent.mouseEnterLeave[wblElementId].state);
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseEnterLeave.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mouseenter", mouseEnterWbl);
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "mouseenter", mouseEnterWbl);
                                            stopListeningWbl.unbind( "mouseleave", mouseLeaveWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseEnterLeave.currentListeners = newListenersList;
                            }
                            else if(ev.oParams.p1 == 'Mouse Over Area'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseMove.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseMove.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "mousemove", mouseOverWbl);
                                        t.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveMoveWbl);
                                    }
                                    else{
                                        t.bind( "mousemove", mouseOverWbl);
                                        t.bind( "mouseleave", mouseLeaveMoveWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseMove[wblElementId] != undefined){
                                    if(listenersData.wblMouseEvent.mouseMove[wblElementId].state == 'over'){
                                        eventWasTriggered = true;
                                    }
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseMove.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mousemove", mouseOverWbl);
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mouseleave", mouseLeaveMoveWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "mousemove", mouseOverWbl);
                                            stopListeningWbl.unbind( "mouseleave", mouseLeaveMoveWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseMove.currentListeners = newListenersList;
                            }
                            else if(ev.oParams.p1 == 'Mouse Left Button Click'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseClick.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseClick.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "click", mouseClickWbl);
                                    }
                                    else{
                                        t.bind( "click", mouseClickWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseClick[wblElementId] != undefined){
                                    if(listenersData.wblMouseEvent.mouseClick[wblElementId].whichBtn == 1 && tMem != listenersData.wblMouseEvent.mouseClick[wblElementId].lastTime){
                                        setTargetMemory(tId, ev, listenersData.wblMouseEvent.mouseClick[wblElementId].lastTime);
                                        eventWasTriggered = true;
                                    }
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseClick.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "click", mouseClickWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "click", mouseClickWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseClick.currentListeners = newListenersList;
                            }
                            else if(ev.oParams.p1 == 'Mouse Middle Button Click'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseClick.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseClick.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "click", mouseClickWbl);
                                    }
                                    else{
                                        t.bind( "click", mouseClickWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseClick[wblElementId] != undefined){
                                    if(listenersData.wblMouseEvent.mouseClick[wblElementId].whichBtn == 2 && tMem != listenersData.wblMouseEvent.mouseClick[wblElementId].lastTime){
                                        setTargetMemory(tId, ev, listenersData.wblMouseEvent.mouseClick[wblElementId].lastTime);
                                        eventWasTriggered = true;
                                    }
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseClick.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "click", mouseClickWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "click", mouseClickWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseClick.currentListeners = newListenersList;
                            }
                            else if(ev.oParams.p1 == 'Mouse Wheel Move'){
                                // create event listener if lacking
                                if(listenersData.wblMouseEvent.mouseWheel.currentListeners.indexOf(tId) == -1){
                                    listenersData.wblMouseEvent.mouseWheel.currentListeners.push(tId);
                                    if(ev.oParams.p5 != '' && t.find('#' + ev.oParams.p5)){
                                        t.find('#' + ev.oParams.p5).bind( "mousewheel", mouseWheelWbl);
                                    }
                                    else{
                                        t.bind( "mousewheel", mouseWheelWbl);
                                    }
                                }

                                // Check if the event has triggered
                                if(listenersData.wblMouseEvent.mouseWheel[wblElementId] != undefined){
                                    if((ev.oParams.p2 == 'Up' && listenersData.wblMouseEvent.mouseWheel[wblElementId].deltaY == 1) || (ev.oParams.p2 == 'Down' && listenersData.wblMouseEvent.mouseWheel[wblElementId].deltaY == -1)){
                                        if(tMem != listenersData.wblMouseEvent.mouseWheel[wblElementId].lastTime){
                                            setTargetMemory(tId, ev, listenersData.wblMouseEvent.mouseWheel[wblElementId].lastTime);
                                            eventWasTriggered = true;
                                        }
                                    }
                                }

                                //Remove event listeners if not needed
                                var newListenersList = [];
                                for(var w = 0, listenerId; listenerId = listenersData.wblMouseEvent.mouseWheel.currentListeners[w]; w++){
                                    var isFine = false;
                                    for(var v = 0, tt; tt = target.ap[v]; v++){
                                        if(tt.scope().getInstanceId() == listenerId){
                                            isFine = true;
                                            break;
                                        }
                                    }

                                    if(isFine){
                                        newListenersList.push(listenerId);
                                    }
                                    else{
                                        var stopListeningWbl = $scope.getWebbleByInstanceId(listenerId);
                                        if(ev.oParams.p5 != '' && stopListeningWbl.find('#' + ev.oParams.p5)){
                                            stopListeningWbl.find('#' + ev.oParams.p5).bind( "mousewheel", mouseWheelWbl);
                                        }
                                        else{
                                            stopListeningWbl.unbind( "mousewheel", mouseWheelWbl);
                                        }
                                    }
                                }
                                listenersData.wblMouseEvent.mouseWheel.currentListeners = newListenersList;
                            }
                        }
                        else if(ev.operation == 'Protection Changed'){
                            var tProt = t.scope().getProtection();
                            if(tProt != tMem){ setTargetMemory(t.scope().getInstanceId(), ev, tProt); }
                            if(tMem != undefined && tProt != tMem){
                                var protectKey = 0;
                                for(var w = 0; w < wblPrtct.length; w++){
                                    if(wblPrtct[w].name == ev.oParams.p1){
                                        protectKey = wblPrtct[w].key;
                                        break;
                                    }
                                }

                                switch(ev.oParams.p2){
                                    case 'ON': if((parseInt(t.scope().getProtection(), 10) & protectKey) !== 0){ eventWasTriggered = true; } break;
                                    case 'OFF': if((parseInt(t.scope().getProtection(), 10) & protectKey) == 0){ eventWasTriggered = true; } break;
                                }
                            }
                        }
                        else if(ev.operation == 'Custom Slot Event'){
                            var noOfSlots = Object.keys(t.scope().getSlots()).length;
                            if(noOfSlots != tMem){ setTargetMemory(t.scope().getInstanceId(), ev, noOfSlots); }

                            if(ev.oParams.p1 == 'Slot Added' && tMem != undefined && noOfSlots > tMem){
                                if(ev.oParams.p2 == '' || t.scope().gimme(ev.oParams.p2) != undefined){
                                    eventWasTriggered = true;
                                }
                            }
                            else if(ev.oParams.p1 == 'Slot Removed' && tMem != undefined && noOfSlots < tMem){
                                if(ev.oParams.p2 == '' || t.scope().gimme(ev.oParams.p2) != undefined){
                                    eventWasTriggered = true;
                                }
                            }
                        }
                        else if(ev.operation == 'Webble Menu Item Selected'){
                            var tId = t.scope().getInstanceId();

                            // create event listener if lacking
                            if(listenersData.wblActivityEvent.menuExec.currentListeners.length == 0){
                                listenersData.wblActivityEvent.menuExec.currentListeners.push(tId);
								wblMenuExecuted = $scope.registerWWEventListener(Enum.availableWWEvents.wblMenuExecuted, function(eventData){
									var wblElementId = 'wbl_' + eventData.targetId;
									listenersData.wblActivityEvent.menuExec[wblElementId] = {lastTime: eventData.timestamp, sublinkId: eventData.menuId};
								}, null);
                            }

                            // Check if the event has triggered
                            var wblElementId = 'wbl_' + tId;
                            if(listenersData.wblActivityEvent.menuExec[wblElementId]){
                                if(ev.oParams.p5.itemId == listenersData.wblActivityEvent.menuExec[wblElementId].sublinkId){
                                    if(tMem != listenersData.wblActivityEvent.menuExec[wblElementId].lastTime){
                                        setTargetMemory(tId, ev, listenersData.wblActivityEvent.menuExec[wblElementId].lastTime);
                                        eventWasTriggered = true;
                                    }
                                }
                            }

                            //Remove event listeners if not needed
                            var newListenersList = [];
                            for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.menuExec.currentListeners[w]; w++){
                                var isFine = false;
                                for(var v = 0, tt; tt = target.ap[v]; v++){
                                    if(tt.scope().getInstanceId() == listenerId){
                                        isFine = true;
                                        break;
                                    }
                                }

                                if(isFine){
                                    newListenersList.push(listenerId);
                                }
                            }
                            listenersData.wblActivityEvent.menuExec.currentListeners = newListenersList;

                            if(listenersData.wblActivityEvent.menuExec.currentListeners.length == 0){
                                wblMenuExecuted();
                            }
                        }
                        else if(ev.operation == 'Was Deleted'){
                            var tId = t.scope().getInstanceId();

                            // create event listener if lacking
                            if(listenersData.wblActivityEvent.wblDeletion.currentListeners.length == 0){
                                listenersData.wblActivityEvent.wblDeletion.currentListeners.push(tId);
								wblDeleted = $scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
									listenersData.wblActivityEvent.wblDeletion.lastTime = eventData.timestamp;
									listenersData.wblActivityEvent.wblDeletion.deletedWbls.push(eventData.targetId);
								}, null);
                            }

                            // Check if the event has triggered
                            if(listenersData.wblActivityEvent.wblDeletion.observedWbls.length > 0 && listenersData.wblActivityEvent.wblDeletion.deletedWbls.length > 0){
                                for(var w = 0; w < listenersData.wblActivityEvent.wblDeletion.deletedWbls.length; w++){
                                    for(var v = 0; v < listenersData.wblActivityEvent.wblDeletion.observedWbls.length; v++){
                                        if(listenersData.wblActivityEvent.wblDeletion.deletedWbls[w] == listenersData.wblActivityEvent.wblDeletion.observedWbls[v]){
                                            eventWasTriggered = true;
                                            break;
                                        }
                                    }
                                }
                                listenersData.wblActivityEvent.wblDeletion.deletedWbls = [];
                            }

                            //Remove event listeners if not needed
                            var newListenersList = [];
                            for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.wblDeletion.currentListeners[w]; w++){
                                var isFine = false;
                                for(var v = 0, tt; tt = target.ap[v]; v++){
                                    if(tt.scope().getInstanceId() == listenerId){
                                        isFine = true;
                                        break;
                                    }
                                }

                                if(isFine){
                                    newListenersList.push(listenerId);
                                }
                            }
                            listenersData.wblActivityEvent.wblDeletion.currentListeners = newListenersList;

                            if(listenersData.wblActivityEvent.wblDeletion.currentListeners.length == 0){
                                wblDeleted();
                            }
                        }
                        else if(ev.operation == 'Was Duplicated'){
                            var tId = t.scope().getInstanceId();

                            // create event listener if lacking
                            if(listenersData.wblActivityEvent.wblDuplication.currentListeners.length == 0){
                                listenersData.wblActivityEvent.wblDuplication.currentListeners.push(tId);
								wblDuplicated = $scope.registerWWEventListener(Enum.availableWWEvents.duplicated, function(eventData){
									var wblElementId = 'wbl_' + eventData.targetId;
									listenersData.wblActivityEvent.wblDuplication[wblElementId] = {lastTime: eventData.timestamp, duplId: eventData.copyId};
								}, null);
                            }

                            // Check if the event has triggered
                            var wblElementId = 'wbl_' + tId;
                            if(listenersData.wblActivityEvent.wblDuplication[wblElementId] != undefined){
                                if(listenersData.wblActivityEvent.wblDuplication[wblElementId].duplId > 0 && listenersData.wblActivityEvent.wblDuplication[wblElementId].lastTime != tMem){
                                    setTargetMemory(tId, ev, listenersData.wblActivityEvent.wblDuplication[wblElementId].lastTime);
                                    eventWasTriggered = true;
                                }
                            }

                            //Remove event listeners if not needed
                            var newListenersList = [];
                            for(var w = 0, listenerId; listenerId = listenersData.wblActivityEvent.wblDuplication.currentListeners[w]; w++){
                                var isFine = false;
                                for(var v = 0, tt; tt = target.ap[v]; v++){
                                    if(tt.scope().getInstanceId() == listenerId){
                                        isFine = true;
                                        break;
                                    }
                                }

                                if(isFine){
                                    newListenersList.push(listenerId);
                                }
                            }
                            listenersData.wblActivityEvent.wblDuplication.currentListeners = newListenersList;

                            if(listenersData.wblActivityEvent.wblDuplication.currentListeners.length == 0){
                                wblDuplicated();
                            }
                        }
                        else if(ev.operation == 'Collision Event'){
                            var tId = t.scope().getInstanceId();

                            // create event listener if lacking
                            if(wblMoved == undefined){
                                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                                    var wblElementId = 'wbl_' + aw.scope().getInstanceId();
                                    var thisWbl = aw;
                                    var wblSizeSlots = thisWbl.scope().getResizeSlots();
                                    var wblSize = {w: parseInt(thisWbl.scope().gimme(wblSizeSlots.width)), h: parseInt(thisWbl.scope().gimme(wblSizeSlots.height))};
                                    if(wblSize.w != undefined && wblSize.h != undefined){
                                        var wblAbsPos = $scope.getWblAbsPosInPixels(thisWbl);
                                        listenersData.wblActivityEvent.collision[wblElementId] = {
                                            lastTime: Date.now(),
                                            templateId: thisWbl.scope().theWblMetadata['templateid'],
                                            displayName: thisWbl.scope().theWblMetadata['displayname'],
                                            left: wblAbsPos.x,
                                            top: wblAbsPos.y,
                                            right: wblAbsPos.x + wblSize.w,
                                            bottom: wblAbsPos.y + wblSize.h
                                        };
                                    }
                                }

								wblMoved = $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
									if(eventData.slotName == 'root:left' || eventData.slotName == 'root:top'){
										var wblElementId = 'wbl_' + eventData.targetId;
										var thisWbl = $scope.getWebbleByInstanceId(eventData.targetId);
										var wblSizeSlots = thisWbl.scope().getResizeSlots();
										var wblSize = {w: parseInt(thisWbl.scope().gimme(wblSizeSlots.width)), h: parseInt(thisWbl.scope().gimme(wblSizeSlots.height))};
										if(wblSize.w != undefined && wblSize.h != undefined){
											var wblAbsPos = $scope.getWblAbsPosInPixels(thisWbl);
											listenersData.wblActivityEvent.collision[wblElementId] = {
												lastTime: eventData.timestamp,
												templateId: thisWbl.scope().theWblMetadata['templateid'],
												displayName: thisWbl.scope().theWblMetadata['displayname'],
												left: wblAbsPos.x,
												top: wblAbsPos.y,
												right: wblAbsPos.x + wblSize.w,
												bottom: wblAbsPos.y + wblSize.h
											};
										}
									}
								}, null);
                            }

                            // Check if the event has triggered
                            var wblElementId = 'wbl_' + tId;
                            if(listenersData.wblActivityEvent.collision[wblElementId]){
                                var a = listenersData.wblActivityEvent.collision[wblElementId];
                                if(!isNaN(a.bottom) && !isNaN(a.right)){
                                    for(var collObj in listenersData.wblActivityEvent.collision){
                                        if(collObj != wblElementId){
                                            var b =  listenersData.wblActivityEvent.collision[collObj];
                                            if(ev.oParams.p1 == '' || parseInt(ev.oParams.p1) == parseInt(collObj.substring(4)) || ev.oParams.p1 == b.templateId || ev.oParams.p1 == b.displayName){
                                                if((!isNaN(b.bottom) && !isNaN(b.right)) && (!((a.bottom < b.top) || (a.top > b.bottom) || (a.right < b.left) || (a.left > b.right)))){                                                    eventWasTriggered = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if(eventWasTriggered){
                            var eventeeId = t.scope().getInstanceId();
                            if(firedEventeeList.indexOf(eventeeId) == -1){
                                firedEventeeList.push(eventeeId);
                            }
                            trulyTriggered = eventWasTriggered;
                        }
                    }

                    if(target.ap.length == 0 && ev.operation == 'Collision Event' && wblMoved != undefined){
                      wblMoved();
                      wblMoved = undefined;
                      listenersData.wblActivityEvent.collision = {};
                    }

                    eventWasTriggered = trulyTriggered;
                }

                if(target.ap != null && target.name != 'Platform' && ev.operation == 'Was Deleted'){
                    listenersData.wblActivityEvent.wblDeletion.observedWbls = [];
                    for(var w = 0; w < target.ap.length; w++){
                        listenersData.wblActivityEvent.wblDeletion.observedWbls.push(target.ap[w].scope().getInstanceId());
                    }
                }

                if(ev.boolBind == 'AND'){
                    evGroupEvaluation += (n==0 ? (' ' + eventWasTriggered) : (' && ' + eventWasTriggered));
                }
                else{
					if(evGroupEvaluation != ""){ evGroupEvaluation += (' || ' + eventWasTriggered); }
                }

                if(n == eaPack.eventGroup.length - 1){
                    if(eval(evGroupEvaluation) == true){
                        executeAction(eaPack.actionGroup);
                    }
                }
            }
        }

        eventWatchTimer = $timeout($scope.eventWatcher, parseInt($scope.gimme('eventCheckInterval')));
    }
    //========================================================================================


    //========================================================================================
    // Execute Action
    //========================================================================================
    var executeAction = function(theActionGroup){
        for(var i = 0, ac; ac = theActionGroup[i]; i++){
            var target = getTarget(ac.target, ac.tParams);

            if(target.ap == null && target.name == 'Platform'){
                if(ac.operation == 'Change Platform Prop'){
                    if(ac.oParams.p1 == 'Execution Mode'){
                        for(var i = 0; i < execModeOpts.length; i++){
                            if(ac.oParams.p3 == execModeOpts[i]){
                                $scope.setExecutionMode(i);
                                break;
                            }
                        }
                    }
                    else if(ac.oParams.p1 == 'Background Color'){
                        $scope.setPlatformBkgColor(ac.oParams.p3);
                    }
                }
                else if(ac.operation == 'Execute Main Menu Item'){
                    if(ac.oParams.p5.itemId == 'openws' || ac.oParams.p5.itemId == 'savewsas'){
                        if(ac.oParams.p3 == ''){
                            $scope.executeMenuSelection(ac.oParams.p5.itemId, null);
                        }
                        else{
                            if(ac.oParams.p5.itemId == 'openws'){
                                $scope.openWSByName(ac.oParams.p3);
                            }
                            else{
                                $scope.saveWSByName(ac.oParams.p3);
                            }
                        }
                    }
                    else{
                        $scope.executeMenuSelection(ac.oParams.p5.itemId, null);
                    }
                }
                else if(ac.operation == 'Load New Webble'){
                    var noOfWblsToLoad = 1;
                    var wblId = ac.oParams.p1;
                    if(!isNaN(parseInt(ac.oParams.p3))){
                        noOfWblsToLoad = parseInt(ac.oParams.p3);
                    }
                    if(wblId == ''){
                        $http.get('/api/webbles?limit=20&orderby=-rating&verify=1').then(function(resp){
                            var randomNo = Math.floor(Math.random() * resp.data.length);
                            wblId = resp.data[randomNo].webble.defid;
                            for(var w = 0; w < noOfWblsToLoad; w++){
                                wblsToLoad.push(wblId);
                            }
                            loadWebbleAction();
                        });
                    }
                    else{
                        for(var w = 0; w < noOfWblsToLoad; w++){
                            wblsToLoad.push(wblId);
                        }
                        loadWebbleAction();
                    }
                }
                else if(ac.operation == 'Execute Link'){
                    if(ac.oParams.p1 != '' && ac.oParams.p1.search('http') != -1){
                        $window.open(ac.oParams.p1, '_blank');
                    }
                    else{
                        var calculatedURL = getCalculatedValue(ac.oParams.p1);
                        if(calculatedURL != '' && calculatedURL.toString().search('http') != -1){
                            $window.open(calculatedURL, '_blank');
                        }
                    }
                }
            }
            else if(target.ap != null){
                for(var k = 0, t; t = target.ap[k]; k++){
                    if(ac.operation == 'Change Relationships'){
                        // Start looking for Webbles to act upon
                        var theWblsToActUpon = [];
                        if(ac.oParams.p1 != 'Revoke Parent'){
                            if(ac.oParams.p2 != '' && !(isNaN(ac.oParams.p2))){
                                theWblsToActUpon.push($scope.getWebbleByInstanceId(parseInt(ac.oParams.p2)));
                            }
                            else if (ac.oParams.p2 != ''){
                                theWblsToActUpon = $scope.getWebblesByTemplateId(ac.oParams.p2);
                                if(theWblsToActUpon.length == 0){
                                    theWblsToActUpon = $scope.getWebblesByDisplayName(ac.oParams.p2);
                                }
                            }
                        }

                        // Proper Action
                        if(ac.oParams.p1 == 'Add Child'){
                            if(theWblsToActUpon.length == 0 && ac.oParams.p2 == ''){
                                for(var w = 0, aw; aw = $scope.getActiveWebbles()[w]; w++){
                                    if (aw != t && !aw.scope().getParent()){
                                        theWblsToActUpon.push(aw);
                                    }
                                }
                            }

                            for(var w = 0; w < theWblsToActUpon.length; w++){
                                if(theWblsToActUpon[w]){
                                    theWblsToActUpon[w].scope().paste(t);
                                }
                            }
                        }
                        else if(ac.oParams.p1 == 'Remove Child'){
                            if(theWblsToActUpon.length == 0 && ac.oParams.p2 == ''){
                                for(var w = 0, aw; aw = $scope.getActiveWebbles()[w]; w++){
                                    if (aw != t && aw.scope().getParent() == t){
                                        theWblsToActUpon.push(aw);
                                    }
                                }
                            }

                            for(var w = 0; w < theWblsToActUpon.length; w++){
                                if(theWblsToActUpon[w]){
                                    theWblsToActUpon[w].scope().peel();
                                }
                            }
                        }
                        else if(ac.oParams.p1 == 'Assign Parent'){
                            if(theWblsToActUpon.length == 0 && ac.oParams.p2 == ''){
                                for(var w = 0, aw; aw = $scope.getActiveWebbles()[w]; w++){
                                    if (aw != t){
                                        theWblsToActUpon.push(aw);
                                    }
                                }
                            }

                            for(var w = 0; w < theWblsToActUpon.length; w++){
                                if(theWblsToActUpon[w]){
                                    t.scope().paste(theWblsToActUpon[w]);
                                    break;
                                }
                            }
                        }
                        else if(ac.oParams.p1 == 'Revoke Parent'){
                            t.scope().peel();
                        }
                    }
                    else if(ac.operation == 'Delete'){
                        $scope.requestDeleteWebble(t);
                    }
                    else if(ac.operation == 'Duplicate'){
                        if(ac.oParams.p1 == 'Default'){
                            t.scope().duplicate({x: 15, y: 15}, undefined);
                        }
                        else{ //'Shared Model'
                            wblsToShareModelDupl.push(t.scope().getInstanceId());
                        }
                    }
                    else if(ac.operation == 'Change Slot Value'){
                        var newSlotVal = getCalculatedValue(ac.oParams.p3);
                        if(newSlotVal != undefined){

                            //if(!isNaN(parseFloat(newSlotVal))){ newSlotVal = parseFloat(newSlotVal); }

                            if(ac.oParams.p1 == 'displayname'){
                                t.scope().theWblMetadata['displayname'] = newSlotVal;
                            }
                            else{
                                t.scope().set(ac.oParams.p1, newSlotVal);
                            }
                        }
                    }
                    else if(ac.operation == 'Change Protection'){
                        var newProtection = t.scope().getProtection();
                        var protectKey = 0;
                        for(var w = 0; w < wblPrtct.length; w++){
                            if(wblPrtct[w].name == ac.oParams.p1){
                                protectKey = wblPrtct[w].key;
                                break;
                            }
                        }

                        switch(ac.oParams.p2){
                            case 'ON':
                                newProtection = bitflags.on(newProtection, protectKey);
                                break;
                            case 'OFF':
                                newProtection = bitflags.off(newProtection, protectKey);
                                break;
                            case 'Toggle':
                                newProtection = bitflags.toggle(newProtection, protectKey);
                                break;
                        }

                        t.scope().setProtection(newProtection);
                    }
                    else if(ac.operation == 'Execute Webble Menu Item'){
                        t.scope().activateMenuItem(ac.oParams.p5.itemId);
                    }
                    else if(ac.operation == 'Custom Slot Action'){
                        if(ac.oParams.p2 != ''){
                            if(ac.oParams.p1 == 'Add Slot'){
                                var theNewSlot = new Slot(ac.oParams.p2,
                                    ac.oParams.p3,
                                    gettext("Custom") + " (" + ac.oParams.p2 + ")",
                                    "This slot is a custom slot added by Event Action Manager Webble named '" + $scope.theWblMetadata['displayname'] + "'.",
                                    'custom',
                                    undefined,
                                    undefined
                                );
                                theNewSlot.setIsCustomMade(true);
                                t.scope().addSlot(theNewSlot);
                            }
                            else if(ac.oParams.p1 == 'Remove Slot'){
                                t.scope().removeSlot(ac.oParams.p2);
                            }
                        }
                    }
                }

                // Fire away chain actions if such exist
                if(wblsToShareModelDupl.length > 0){
                    shareModelDuplicationAction()
                }
            }
        }
    }
    //========================================================================================


    //========================================================================================
    // Load Webble Action
    //========================================================================================
    var loadWebbleAction = function(){
        if(wblsToLoad.length > 0){
            $scope.downloadWebbleDef(wblsToLoad.splice(0,1), loadWebbleAction);
        }
    }
    //========================================================================================


    //========================================================================================
    // Share Model Duplication Action
    //========================================================================================
    var shareModelDuplicationAction = function(sharedModelCandidate){
        if(sharedModelCandidate != undefined){
            ($scope.getWebbleByInstanceId(wblsToShareModelDupl.splice(0,1))).scope().connectSharedModel(sharedModelCandidate);
        }
        if(wblsToShareModelDupl.length > 0){
            $scope.getWebbleByInstanceId(wblsToShareModelDupl[0]).scope().sharedModelDuplicate({x: 15, y: 15}, shareModelDuplicationAction);
        }
    }
    //========================================================================================



    //========================================================================================
    // Initiate Event Action Set
    //========================================================================================
    var initiateEASet = function(eaSet){
        var newEASet = {eventGroup: [], actionGroup: [], strVal: ''};
        var strRepr = '';

        for(var i = 0; i < eaSet.eventGroup.length; i++){
            if(i == 0){ strRepr = 'EVENT: '; }
            strRepr += eaSet.eventGroup[i].strVal + ' ';
            newEASet.eventGroup.push(eaSet.eventGroup[i]);
            enableEventListeners(eaSet.eventGroup[i]);
        }

        for(var i = 0; i < eaSet.actionGroup.length; i++){
            if(i == 0){ strRepr += ' --> ;ACTION: '; }
            strRepr += eaSet.actionGroup[i].strVal + ' ';
            newEASet.actionGroup.push(eaSet.actionGroup[i]);
        }

        newEASet.strVal = strRepr;

        return newEASet;
    }
    //========================================================================================


    //========================================================================================
    // Reset And Clean Event Action Set
    //========================================================================================
    var resetAndCleanEASet = function(eaSet){
        for(var i = 0; i < eaSet.eventGroup.length; i++){
            disableEventListeners(eaSet.eventGroup[i]);
        }

        eaSet.eventGroup = [];
        eaSet.actionGroup = [];
        eaSet.strVal = '';
        eaSet.status = -1;
        eaSet = undefined;
    }
    //========================================================================================


    //========================================================================================
    // Get All Relatives
    // This method returns all webbles of those that are in any way related to the webble
    // specified in the parameter which is also included in the top of the list.
    //========================================================================================
    $scope.getAllRelatives = function(whatWebble){
        var relatives = [];

        relatives = relatives.concat($scope.getAllDescendants(whatWebble));
        relatives = relatives.concat($scope.getAllAncestors(whatWebble));

        return relatives;
    };
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//*********************************************************************************************************************


//=======================================================================================
// EVENT ACTION MAIN FORM CONTROLLER
// This is the controller for this Webbles Event Action Manager Form
//=======================================================================================
wblwrld3App.controller('EAMForm_Ctrl', function($scope, $log, $modalInstance, $timeout, Slot, Enum, props, isEmpty) {
    $scope.formProps = {
        EAData: [
        ]
    };

    $scope.propMsgs = {
        info: "COPY and PASTE by holding CTRL key when clicking on a section."
    };
    var copyCache;


    //========================================================================================
    // Open Edit
    // opens an edit Event/Action window for detailed editing of the selected type
    //========================================================================================
    $scope.openEdit = function(type, row, item){
        var eaDataPack = null, groupAmount = 0, doNotOpenForm = false;

        if(type == 'Event'){
            if(!props.wblScope.ctrlKeyIsDown){
                item != -1 ? eaDataPack = angular.copy($scope.formProps.EAData[row].eventGroup[item]) : eaDataPack = null;
                $scope.formProps.EAData[row].eventGroup.length > 0 ? groupAmount = $scope.formProps.EAData[row].eventGroup.length : groupAmount = 0;
            }
            else{
                if(item == -1){
                    if(copyCache && copyCache.type == type){
                        eaDataPack = copyCache.item;
                        groupAmount = copyCache.groupAmount;
                        props.wblScope.showQIM(type + " item pasted.", 1000);
                    }
                    else{
                      props.wblScope.showQIM("Stored copy does not match pasting area.", 2000);
                    }
                }
                else{
                    copyCache = {type: type, item: angular.copy($scope.formProps.EAData[row].eventGroup[item]), groupAmount: $scope.formProps.EAData[row].eventGroup.length > 0 ? $scope.formProps.EAData[row].eventGroup.length : 0};
                    doNotOpenForm = true;
                    props.wblScope.showQIM(type + " item copied.", 1000);
                }
            }
        }
        else if(type == 'Action'){
            if(!props.wblScope.ctrlKeyIsDown){
                item != -1 ? eaDataPack = angular.copy($scope.formProps.EAData[row].actionGroup[item]) : eaDataPack = null;
                $scope.formProps.EAData[row].actionGroup.length > 0 ? groupAmount = $scope.formProps.EAData[row].actionGroup.length : groupAmount = 0;
            }
            else{
                if(item == -1){
                  if(copyCache && copyCache.type == type){
                      eaDataPack = copyCache.item;
                      groupAmount = copyCache.groupAmount;
                      props.wblScope.showQIM(type + " item pasted.", 1000);
                  }
                  else{
                    props.wblScope.showQIM("Stored copy does not match pasting area.", 2000);
                  }
                }
                else{
                    copyCache = {type: type, item: angular.copy($scope.formProps.EAData[row].actionGroup[item]), groupAmount: $scope.formProps.EAData[row].actionGroup.length > 0 ? $scope.formProps.EAData[row].actionGroup.length : 0};
                    doNotOpenForm = true;
                    props.wblScope.showQIM(type + " item copied.", 1000);
                }
            }
        }

        if(!doNotOpenForm){
            props.wblScope.openForm('EAMForm2', [{templateUrl: 'event-action-manager-form-part2.html', controller: 'EAMForm2_Ctrl', size: 'lg'}, {wblScope: props.wblScope, editType: type, rowIndex: row, itemIndex: item, eaData: eaDataPack, grAmount: groupAmount}], closeEdit);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Row Background Color
    //========================================================================================
    $scope.getRowBkgColor = function(rowIndex){
        if((rowIndex+1)%2 == 0){
            return '#fffe9b';
        }
        else{
            return 'transparent';
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Form half Width
    //========================================================================================
    $scope.getFormHalfWidth = function(){
        var formHalfWidth = ((parseInt($('#event-action-manager-main-form').css('width')) - 28) / 2) + 'px';

        return formHalfWidth;
    };
    //========================================================================================


    //========================================================================================
    // Close Edit
    // when edit is closed this function is called
    //========================================================================================
    var closeEdit = function(returnContent){
        if(returnContent != null){
            var eaDataRow = $scope.formProps.EAData[returnContent.rowIndex];
            if(returnContent.targetParams.currentSelected.toLowerCase().search('undefined') != -1 || returnContent.targetItemParams.currentSelected.toLowerCase().search('undefined') != -1){
                if(returnContent.type == 'Event'){
                    if(returnContent.itemIndex != -1){
                        eaDataRow.eventGroup.splice(returnContent.itemIndex, 1);
                    }
                }
                else{
                    if(returnContent.itemIndex != -1){
                        eaDataRow.actionGroup.splice(returnContent.itemIndex, 1);
                    }
                }
            }
            else{
                var eaDataRowItem = {
                    boolBind: returnContent.booleanBinding,
                    target: returnContent.targetParams.currentSelected,
                    tParams: {p1: returnContent.targetParams.currDepSel, p2: returnContent.targetParams.detailSelected, p3: returnContent.targetParams.itemValue},
                    operation: returnContent.targetItemParams.currentSelected,
                    oParams: {p1: returnContent.targetItemParams.detailSelected, p2: returnContent.targetItemParams.furtherDetailSelected, p3: returnContent.targetItemParams.itemValue, p4: returnContent.targetItemParams.currDepSelGr, p5: returnContent.targetItemParams.currDepSel},
                    strVal: ''
                };

                var stringRepresentation = eaDataRowItem.target +
                    (eaDataRowItem.tParams.p1 ? ' ... ' + eaDataRowItem.tParams.p1 : '') +
                    (eaDataRowItem.tParams.p2 ? ' ... ' + eaDataRowItem.tParams.p2 : '') +
                    (eaDataRowItem.tParams.p3 ? ' ... ' + eaDataRowItem.tParams.p3 : '') + ':;';

                stringRepresentation += eaDataRowItem.operation +
                    (eaDataRowItem.oParams.p1 ? ' ... ' + eaDataRowItem.oParams.p1 : '') +
                    (eaDataRowItem.oParams.p2 ? ' ... ' + eaDataRowItem.oParams.p2 : '');

                if(!(!isEmpty(eaDataRowItem.oParams.p5) && eaDataRowItem.oParams.p5.itemId && (eaDataRowItem.oParams.p5.itemId == 'openws' || eaDataRowItem.oParams.p5.itemId == 'savewsas'))){
                    stringRepresentation += (eaDataRowItem.oParams.p3 ? ' ... ' + eaDataRowItem.oParams.p3 : '');
                }

                if(!isEmpty(eaDataRowItem.oParams.p4)){
                    if(eaDataRowItem.oParams.p4.left){
                        stringRepresentation += ' ... [left: ' + eaDataRowItem.oParams.p4.left + ', top: ' + eaDataRowItem.oParams.p4.top + ', right: ' + eaDataRowItem.oParams.p4.right + ', bottom: ' + eaDataRowItem.oParams.p4.bottom + ']';
                    }
                    else if(eaDataRowItem.oParams.p4.repeat == true || eaDataRowItem.oParams.p4.repeat == false){
                        if(eaDataRowItem.oParams.p4.repeat == true){
                            stringRepresentation += ' ... repeat = ' + eaDataRowItem.oParams.p4.repeat;
                        }
                    }
                }

                if(!isEmpty(eaDataRowItem.oParams.p5)){
                    if(eaDataRowItem.oParams.p5.itemName){
                        stringRepresentation += ' ... ' + eaDataRowItem.oParams.p5.itemName;
                        if(eaDataRowItem.oParams.p3 != '' && (eaDataRowItem.oParams.p5.itemId == 'openws' || eaDataRowItem.oParams.p5.itemId == 'savewsas')){
                            stringRepresentation += (eaDataRowItem.oParams.p3 ? ' ... ' + eaDataRowItem.oParams.p3 : '');
                        }
                    }
                    else{
                        stringRepresentation += ' ... ' + eaDataRowItem.oParams.p5;
                    }
                }

                if(returnContent.type == 'Event'){
                    stringRepresentation = ((returnContent.itemIndex > 0 || (returnContent.itemIndex == -1 && eaDataRow.eventGroup.length > 0)) ? (eaDataRowItem.boolBind + ';') : '') + stringRepresentation;
                    eaDataRowItem.strVal = stringRepresentation;
                    returnContent.itemIndex != -1 ? eaDataRow.eventGroup[returnContent.itemIndex] = eaDataRowItem : eaDataRow.eventGroup.push(eaDataRowItem);
                }
                else{
                    stringRepresentation = ((returnContent.itemIndex > 0 || (returnContent.itemIndex == -1 && eaDataRow.actionGroup.length > 0)) ? (eaDataRowItem.boolBind + ';') : '') + stringRepresentation;
                    eaDataRowItem.strVal = stringRepresentation;
                    returnContent.itemIndex != -1 ? eaDataRow.actionGroup[returnContent.itemIndex] = eaDataRowItem : eaDataRow.actionGroup.push(eaDataRowItem);
                }
            }

            if($scope.formProps.EAData[$scope.formProps.EAData.length - 1].eventGroup.length > 0 && $scope.formProps.EAData[$scope.formProps.EAData.length - 1].actionGroup.length > 0){
                $scope.formProps.EAData.push({eventGroup: [], actionGroup: []});
            }

            for(var i = 0; i < $scope.formProps.EAData.length; i++){
                var strRepr = '';
                for(var k = 0; k < $scope.formProps.EAData[i].eventGroup.length; k++){
                    if(k == 0){
                        strRepr = 'EVENT: ';
                    }
                    strRepr += $scope.formProps.EAData[i].eventGroup[k].strVal + ' ';
                }
                for(var k = 0; k < $scope.formProps.EAData[i].actionGroup.length; k++){
                    if(k == 0){
                        strRepr += ' --> ;ACTION: ';
                    }
                    strRepr += $scope.formProps.EAData[i].actionGroup[k].strVal + ' ';
                }
                $scope.formProps.EAData[i]['strVal'] = strRepr;
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Parse For Wrap
    // Parses a string and replace its semicolons (;) with new line characters (\n) for better
    // readability.
    //========================================================================================
    $scope.parseForWrap = function (strToParse) {
        return strToParse.replace(/;/g, "\n");
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if(result == 'cancel'){
            $modalInstance.close(null);
        }
        else if(result == 'submit'){
            $modalInstance.close($scope.formProps.EAData);
        }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================
    $scope.formProps.EAData = angular.copy(props.eaData);

    if($scope.formProps.EAData.length == 0 || ($scope.formProps.EAData[$scope.formProps.EAData.length - 1].eventGroup.length > 0 || $scope.formProps.EAData[$scope.EAData.length - 1].actionGroup.length > 0)){
        $scope.formProps.EAData.push({eventGroup: [], actionGroup: [], strVal: ''});
    }
});
//=======================================================================================

//*********************************************************************************************************************

//=======================================================================================
// EVENT ACTION SUB FORM CONTROLLER
// This is the controller for this Webbles Editing Event / Action Form
//=======================================================================================
wblwrld3App.controller('EAMForm2_Ctrl', function($scope, $log, $modalInstance, Slot, Enum, props) {

    $scope.formProps = {
        type: props.editType,
        rowIndex: props.rowIndex,
        itemIndex: props.itemIndex,
        noOfItems: props.grAmount,
        infoMsg: '',
        booleanBinding: props.eaData != null ? props.eaData.boolBind : 'AND',
        targetParams: props.eaData != null ? {currentSelected: props.eaData.target, currDepSel: props.eaData.tParams.p1, detailSelected: props.eaData.tParams.p2, itemValue: props.eaData.tParams.p3} : {currentSelected: 'Target Undefined'},
        targetItemParams: props.eaData != null ? {currentSelected: props.eaData.operation, detailSelected: props.eaData.oParams.p1, furtherDetailSelected: props.eaData.oParams.p2, itemValue: props.eaData.oParams.p3, currDepSelGr: props.eaData.oParams.p4, currDepSel: props.eaData.oParams.p5} : {currentSelected: 'Item Undefined'}
    }


    //========================================================================================
    // Toggle Boolean Binding
    // Toggles between AND and OR for multiple event bindings
    //========================================================================================
    $scope.toggleBooleanBinding = function(){
        if($scope.formProps.type == 'Event'){
            if($scope.formProps.booleanBinding == 'AND'){
                $scope.formProps.booleanBinding = 'OR'
            }
            else{
                $scope.formProps.booleanBinding = 'AND'
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Is This Visible
    // Checks weather a parenthesis should be drawn or not around itemValue, which it does
    // around numerical values.
    //========================================================================================
    $scope.isThisVisible = function(){
        var visibilitySetting = false;
        if($scope.formProps.targetItemParams.itemValue){
            if(!isNaN(parseInt($scope.formProps.targetItemParams.itemValue))){
                visibilitySetting = true;
            }
        }

        return visibilitySetting;
    };
    //========================================================================================


    //========================================================================================
    // Open Sub Select
    // Opens up the next layer of form for detailed selecting
    //========================================================================================
    $scope.openSubSelect = function(what, neededParams){
        if(what == 'Targets Focus Item'){
            neededParams['selectedPreviousDependencies'] = {selectedTarget: $scope.formProps.targetParams.currentSelected};
        }
        props.wblScope.openForm('EAMForm3', [{templateUrl: 'event-action-manager-form-part3.html', controller: 'EAMForm3_Ctrl', size: 'lg'}, {wblScope: props.wblScope, eaType: $scope.formProps.type, whatSel: what, params: neededParams}], closeSubEdit);
    };
    //========================================================================================


    //========================================================================================
    // Close Sub Edit
    // when sub edit is closed this function is called
    //========================================================================================
    var closeSubEdit = function(returnContent){
        if(returnContent != null){
            if(returnContent.selectWhat == 'Target'){
                $scope.formProps.targetParams = returnContent;
                $scope.formProps.targetItemParams = {currentSelected: 'Item Undefined'};
            }
            else if(returnContent.selectWhat == 'Targets Focus Item'){
                $scope.formProps.targetItemParams = returnContent;
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if(result == 'cancel'){
            $modalInstance.close(null);
        }
        else if(result == 'submit'){
            $modalInstance.close($scope.formProps);
        }
        else if(result == 'delete'){
            $scope.formProps.targetParams.currentSelected = 'Target Undefined'
            $modalInstance.close($scope.formProps);
        }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================


//*********************************************************************************************************************

//=======================================================================================
// EVENT ACTION SUB SUB FORM CONTROLLER
// This is the controller for this Webbles Editing specific items Form
//=======================================================================================
wblwrld3App.controller('EAMForm3_Ctrl', function($scope, $log, $modalInstance, Slot, Enum, props, menuItemsFactoryService) {

    $scope.formProps = {
        eaType: props.eaType,
        selectWhat: props.whatSel,
        currentSelected: props.params.currentSelected ? props.params.currentSelected : '',
        possibleOpts: [],
        currDepSel: props.params.currDepSel ? props.params.currDepSel : '',
        currDepSelGr: props.params.currDepSelGr ? props.params.currDepSelGr : '',
        itemValue: props.params.itemValue ? props.params.itemValue : '',
        detailSelected: props.params.detailSelected ? props.params.detailSelected : '',
        furtherDetailSelected: props.params.furtherDetailSelected ? props.params.furtherDetailSelected : '',
        previousSelectedDependencies: props.params.selectedPreviousDependencies ? props.params.selectedPreviousDependencies : {},
        infoMsg: '',
        browser: BrowserDetect.browser
    };

    var selectedTargetInstanceId = 0;
    $scope.relatives = [];

    $scope.lists = {
        comparing: ['=', '<', '>', '<=', '>=', '!='],
        comparingMini: ['=', '!='],
        comparingMaxi: ['=', '<', '>', '≤', '≥', '≠', '⊆', '⊇'], //, '≈', '!≈'
        onoff: ['ON', 'OFF'],
        onoffTogg: ['ON', 'OFF', 'Toggle'],
        updown: ['Up', 'Down'],
        addremove: ['Slot Added', 'Slot Removed'],
        addremoveAction: ['Add Slot', 'Remove Slot'],
        defaultshared: ['Default', 'Shared Model'],
        targetSeekers: [
            'Webbles by Template Id',
            'Webbles by Display Name',
            'Webbles by Instance Id',
            'Webbles by Numerical Display Names',
            'Webbles by Slot Name',
            'Webbles by Slot Value',
            'Webbles by Parent',
            'Webbles by Child',
            'Webbles by Protection'
        ],
        targetSeekersAdditionalForActions: [
            'Most Recent Loaded',
            'Fired Eventee'
        ],
        placeHolderTxt: [
            'Template Id',
            'Display Name',
            'Instance Id',
            'Numerical Display Name Root',
            'Slot Name',
            'Slot Name',
            'Parent Display Name',
            'Child Display Name'
        ],
        placeHolderTxt2: [
            'Template or Webble Id (Blank = Any)',
            'time in ms',
            'What key or key code?',
            'Values, Value Identifiers and basic math allowed',
            'Slot Name (Blank = Any)',
            'Workspace Name',
            'Template or Webble Id (Blank = Random)',
            'Amount',
            'How Many?',
            'URL',
            'template, Webble or instance Id (Blank = All Parentless)',
            'Slot Value'
        ],
        platformEventItems: [
            'Mouse Event',
            'Platform Prop Changed',
            'Main Menu Item Selected',
            'New Webble Loaded',
            'Webble Deleted',
            'Timer Countdown Reached',
            'Keyboard Event'
        ],
        platformActionItems: [
            'Change Platform Prop',
            'Execute Main Menu Item',
            'Load New Webble',
            'Execute Link'
        ],
        wblEventItems: [
            'Relation Changed Event',
            'Slot Value Changed',
            'Mouse Event',
            'Protection Changed',
            'Custom Slot Event',
            'Webble Menu Item Selected',
            'Was Deleted',
            'Was Duplicated',
            'Collision Event'
        ],
        wblActionItems: [
            'Change Relationships',
            'Delete',
            'Duplicate',
            'Change Slot Value',
            'Change Protection',
            'Execute Webble Menu Item',
            'Custom Slot Action'
        ],
        wblPrtct: [
            'Move Not Allowed',
            'Resize Not Allowed',
            'Duplicate Not Allowed',
            'Shared Model Duplicate Not Allowed',
            'Delete Not Allowed',
            'Publish Not Allowed',
            'Property Change Not Allowed',
            'Parent Assignment Not Allowed',
            'Having Children Not Allowed',
            'Parent Revoking Not Allowed',
            'Disconnect Children Not Allowed',
            'Bundle Not Allowed',
            'Unbundle Not Allowed',
            'Default Menu Not Visible',
            'Interaction Objects Not Visible',
            'Selection Not Allowed',
            'Contextmenu Not Allowed',
            'Non-Developers Mode Not Visible'
        ],
        mouseEvs: [
            'Mouse Enter Area',
            'Mouse Leave Area',
            'Mouse Over Area',
            'Mouse Left Button Click',
            'Mouse Middle Button Click',
            'Mouse Wheel Move'
        ],
        platformProps: [
            'Execution Mode',
            'Background Color'
        ],
        execModeOpts: [
            "Developer",
            "Admin",
            "Super High Clearance User",
            "High Clearance User",
            "Medium Clearance User",
            "Low Clearance User"
        ],
        mainMenuItems: [],
        relationEvs: [
            "Child Added",
            "Child Removed",
            "Got Parent",
            "Lost Parent"
        ],
        relationAct: [
            "Add Child",
            "Remove Child",
            "Assign Parent",
            "Revoke Parent"
        ],
        wblSlots: [],
        secondaryWblSlots: [],
        wblMenuItems: [
            {itemId: "Publish", itemName: "Publish"},
            {itemId: "Duplicate", itemName: "Duplicate"},
            {itemId: "Delete", itemName: "Delete"},
            {itemId: "AssignParent", itemName: "Assign Parent"},
            {itemId: "RevokeParent", itemName: "Revoke Parent"},
            {itemId: "ConnectSlots", itemName: "Connect Slots"},
            {itemId: "Props", itemName: "Properties"},
            {itemId: "SharedDuplicate", itemName: "Shared Model Duplicate"},
            {itemId: "Bundle", itemName: "Bundle"},
            {itemId: "Unbundle", itemName: "Unbundle"},
            {itemId: "BringFwd", itemName: "Bring to Front"},
            {itemId: "Protect", itemName: "Set Protection"},
            {itemId: "AddCustomSlots", itemName: "Add Custom Slots"},
            {itemId: "About", itemName: "About"}
        ]
    };


    //========================================================================================
    // Get Main Menu Items
    //========================================================================================
    var getMainMenuItems = function(){
        var newMMList = [];
        var mmList =  angular.copy(menuItemsFactoryService.menuItems);
        for(var i = 0; i < mmList.length; i++){
            for(var k = 0; k < mmList[i].sublinks.length; k++){
                if(mmList[i].sublinks[k].sublink_itemName != 'divider'){
                    var mmItem = {itemId: mmList[i].sublinks[k].sublink_itemName, itemName: mmList[i].sublinks[k].title};
                    if(i == 0 && (k >= 0 && k <= 6)){
                        mmItem.itemName = mmItem.itemName + " Workspace"
                    }
                    newMMList.push(mmItem);
                }
            }
        }

        return newMMList;
    };
    //========================================================================================


    //========================================================================================
    // Main Option Changed
    //========================================================================================
    $scope.mainOptionChanged = function(){
        $scope.formProps.currDepSel = '';
        $scope.formProps.detailSelected = '';
        $scope.formProps.furtherDetailSelected = '';
        $scope.formProps.itemValue = '';
        $scope.formProps.currDepSelGr = '';
        $scope.formProps.infoMsg = '';
    };
    //========================================================================================


    //========================================================================================
    // Secondary Webble Target Changed
    //========================================================================================
    $scope.secondaryWblTargetChanged = function(){
        var slotList = [];
        if($scope.formProps.currDepSelGr.wbl){
            var secWblTrgtInstId = parseWblInstanceId($scope.formProps.currDepSelGr.wbl);
            var wblInst;
            if(secWblTrgtInstId != 0){
                wblInst = props.wblScope.getWebbleByInstanceId(secWblTrgtInstId);
            }
            else{
                if($scope.formProps.currDepSelGr.wbl == 'Fired Eventee'){
                    $scope.formProps.itemValue += '{' + $scope.formProps.currDepSelGr.wbl + '-->' + 'TYPE_SLOT_NAME' + '}';
                }
                else{
                  wblInst = props.wblScope.getWebblesByDisplayName($scope.formProps.currDepSelGr.wbl)[0];
                }

            }
            if(wblInst){
                for(var slot in wblInst.scope().getSlots()){
                  slotList.push(slot);
                }
            }
        }

        $scope.formProps.currDepSel = '';
        $scope.lists.secondaryWblSlots = slotList;
    };
    //========================================================================================


    //========================================================================================
    // Secondary Webble Slot Changed
    //========================================================================================
    $scope.secondaryWblSlotChanged = function(isURL){
        if(!isURL){
            $scope.formProps.itemValue += '{' + $scope.formProps.currDepSelGr.wbl + '-->' + $scope.formProps.currDepSelGr.slot + '}';
        }
        else{
            $log.log('{' + $scope.formProps.currDepSelGr.wbl + '-->' + $scope.formProps.currDepSelGr.slot + '}');
            $scope.formProps.detailSelected += '{' + $scope.formProps.currDepSelGr.wbl + '-->' + $scope.formProps.currDepSelGr.slot + '}';
        }
    };
    //========================================================================================


    //========================================================================================
    // isInputBoxVisible
    //========================================================================================
    $scope.isInputBoxVisible = function(boxIndex){
        var wasFound = false;

        // *** SELECT TARGET

        if(boxIndex == 1){ // 'Webbles by Identifier'
            for(var i = 0; i < $scope.lists.targetSeekers.length - 1; i++){
                if($scope.lists.targetSeekers[i] == $scope.formProps.currentSelected){
                    wasFound = true;
                    break;
                }
            }
        }
        else if(boxIndex == 2){ // 'Webbles by Slot Value'
            if($scope.formProps.currentSelected == $scope.lists.targetSeekers[5]){
                wasFound = true;
            }
        }
        else if(boxIndex == 3){ // 'Webbles by Protection'
            if($scope.formProps.currentSelected == $scope.lists.targetSeekers[8]){
                wasFound = true;
            }
        }

        // *** SELECT EVENT

        else if(boxIndex == 4){  // 'Mouse Event Type'
            if($scope.formProps.currentSelected == $scope.lists.platformEventItems[0] || $scope.formProps.currentSelected == $scope.lists.wblEventItems[2]){
                wasFound = true;
            }
        }
        else if(boxIndex == 5){  // 'Mouse Event Area'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 6){  // 'Mouse Event DOM Element Identifier'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[2]){
                wasFound = true;
            }
        }
        else if(boxIndex == 7){  // 'Platform Prop Change'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[1]){
                wasFound = true;
            }
        }
        else if(boxIndex == 8){  // 'Platform Prop Change: Execution Mode'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[1] && $scope.formProps.detailSelected == $scope.lists.platformProps[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 9){  // 'Platform Prop Change: Color'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[1] && $scope.formProps.detailSelected == $scope.lists.platformProps[1]){
                if($scope.formProps.itemValue == ''){
                    $scope.formProps.itemValue = props.wblScope.getPlatformBkgColor();
                }
                wasFound = true;
            }
        }
        else if(boxIndex == 10){  // 'Main Menu Item Selector'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[2]){
                wasFound = true;
            }
        }
        else if(boxIndex == 11){  // New Webble Loaded Identifier
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[3]){
                wasFound = true;
            }
        }
        else if(boxIndex == 12){  // 'Timer Countdown Value'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[5]){
                wasFound = true;
            }
        }
        else if(boxIndex == 13){  // 'Keyboard Key'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[6]){
                $scope.formProps.infoMsg = 'Arrow keys: Left = 37, Up = 38, Right = 39, Down = 40. Type ## (double hash) characters after the key, if you want to catch when the key is released instead(only ## catch any key). This Webble is NOT suitable for time critical events needed for e.g. a platform game. Use game related webbles in those cases.';
                wasFound = true;
            }
        }
        else if(boxIndex == 14){  // 'Mouse Wheel Direction'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[0] && $scope.formProps.detailSelected == $scope.lists.mouseEvs[5]){
                wasFound = true;
            }
        }
        else if(boxIndex == 15){  // 'Webble Relation Changed'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 17){  // 'Slot Value Changed in unique Webble'
            if(selectedTargetInstanceId > 0  && $scope.formProps.currentSelected == $scope.lists.wblEventItems[1]){
                wasFound = true;
            }
        }
        else if(boxIndex == 18){  // 'Slot Value Changed in multiple Webbles'
            if(selectedTargetInstanceId == 0 && $scope.formProps.currentSelected == $scope.lists.wblEventItems[1]){
                wasFound = true;
            }
        }
        else if(boxIndex == 19){  // 'Slot Value Changed to Comparison Value'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[1]){
                if($scope.formProps.currDepSelGr.wbl != '' && $scope.lists.secondaryWblSlots.length == 0){
                    $scope.secondaryWblTargetChanged();
                }
                $scope.formProps.infoMsg = 'Free finding of slot values is done in this format {[WEBBLE DISPLAY NAME OR TEMPLATE ID]-->[SLOT NAME]}. If the slot value is a json object one may extract a value found by key in this format {[WEBBLE DISPLAY NAME OR TEMPLATE ID]-->[SLOT NAME][[KEY NAME]]}.';
                wasFound = true;
            }
        }
        else if(boxIndex == 20){  // 'Protection State Changed'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[3]){
                wasFound = true;
            }
        }
        else if(boxIndex == 21){  // 'Custom Slot Added or Removed'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[4]){
                wasFound = true;
            }
        }
        else if(boxIndex == 22){  // 'Webble Menu Item Selected'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[5]){
                wasFound = true;
            }
        }
        else if(boxIndex == 23){  // 'Collision'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblEventItems[8]){
                $scope.formProps.infoMsg = 'Please be aware that only Webbles with proper width and height slot values may collide';
                wasFound = true;
            }
        }
        else if(boxIndex == 24){  // Webble Deleted Identifier
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[4]){
                wasFound = true;
            }
        }

        // *** SELECT ACTION

        else if(boxIndex == 25){  // 'Change Platform Prop'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 26){  // 'Change Platform Prop: Execution Mode'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[0] && $scope.formProps.detailSelected == $scope.lists.platformProps[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 27){  // 'Change Platform Prop: Color'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[0] && $scope.formProps.detailSelected == $scope.lists.platformProps[1]){
                if($scope.formProps.itemValue == ''){
                    $scope.formProps.itemValue = props.wblScope.getPlatformBkgColor();
                }
                wasFound = true;
            }
        }
        else if(boxIndex == 28){  // 'Select Main Menu Item'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[1]){
                wasFound = true;
            }
        }
        else if(boxIndex == 29){  // 'Select Main Menu Item: Open or Save As'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[1] && ($scope.formProps.currDepSel.itemId == $scope.lists.mainMenuItems[1].itemId || $scope.formProps.currDepSel.itemId == $scope.lists.mainMenuItems[3].itemId)){
                wasFound = true;
            }
            else{
                if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[1]){
                    $scope.formProps.itemValue = '';
                }
            }
        }
        else if(boxIndex == 30){  // 'Load New Webble'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[2]){
                wasFound = true;
            }
        }
        else if(boxIndex == 31){  // 'Execute Link'
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformActionItems[3]){
                wasFound = true;
            }
        }
        else if(boxIndex == 32){  // 'Change Webble Relation'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[0]){
                wasFound = true;
            }
        }
        else if(boxIndex == 33){  // 'Change Webble Relation: Add child or parent'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[0] && ($scope.formProps.detailSelected == $scope.lists.relationAct[0] || $scope.formProps.detailSelected == $scope.lists.relationAct[1] || $scope.formProps.detailSelected == $scope.lists.relationAct[2])){
                wasFound = true;
            }
        }
        else if(boxIndex == 34){  // 'Duplicate Webble'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[2]){
                if($scope.formProps.detailSelected == ''){
                    $scope.formProps.detailSelected = $scope.lists.defaultshared[0];
                }
                wasFound = true;
            }
        }
        else if(boxIndex == 35){  // 'Change Slot Value in unique Webble'
            if(selectedTargetInstanceId > 0  && $scope.formProps.currentSelected == $scope.lists.wblActionItems[3]){
                wasFound = true;
            }
        }
        else if(boxIndex == 36){  // 'Change Slot Value in multiple Webbles'
            if(selectedTargetInstanceId == 0 && $scope.formProps.currentSelected == $scope.lists.wblActionItems[3]){
                wasFound = true;
            }
        }
        else if(boxIndex == 37){  // 'Change Slot to Value'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[3]){
                if($scope.formProps.furtherDetailSelected == ''){
                    $scope.formProps.furtherDetailSelected = $scope.lists.comparing[0];
                }
              $scope.formProps.infoMsg = 'Free finding of slot values is done in this format {[WEBBLE DISPLAY NAME OR TEMPLATE ID]-->[SLOT NAME]}. If the slot value is a json object one may extract a value found by key in this format {[WEBBLE DISPLAY NAME OR TEMPLATE ID]-->[SLOT NAME][[KEY NAME]]}.';
                wasFound = true;
            }
        }
        else if(boxIndex == 38){  // 'Change Protection State'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[4]){
                wasFound = true;
            }
        }
        else if(boxIndex == 39){  // 'Select Webble Menu Item'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[5]){
                wasFound = true;
            }
        }
        else if(boxIndex == 40){  // 'Add or Remove Custom Slot'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[6]){
                wasFound = true;
            }
        }
        else if(boxIndex == 41){  // 'Add Custom Slot Value'
            if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Platform' && $scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined' && $scope.formProps.currentSelected == $scope.lists.wblActionItems[6] && $scope.formProps.detailSelected == $scope.lists.addremoveAction[0]){
                wasFound = true;
            }
        }

        return wasFound;
    };
    //========================================================================================


    //========================================================================================
    // getPlaceHolder
    //========================================================================================
    $scope.getPlaceHolder = function(index){
        var phTxt = '';

        if(index == 1){
            for(var i = 0; i < $scope.lists.targetSeekers.length-1; i++){
                if($scope.lists.targetSeekers[i] == $scope.formProps.currentSelected){
                    phTxt = $scope.lists.placeHolderTxt[i]
                    break;
                }
            }
        }
        else if(index == 2){
            phTxt = 0;
        }
        else if(index == 3){
            phTxt = 0;
        }
        else if(index == 4){
            phTxt = parseInt($('#workspaceSurface').css('width'));
        }
        else if(index == 5){
            phTxt = parseInt($('#workspaceSurface').css('height'));
        }
        else if(index == 6){
            phTxt = 'DOM Element ID (Blank = Full Webble)';
        }
        else if(index == 7){
            phTxt = props.wblScope.getPlatformBkgColor();
        }
        else if(index == 8){
            phTxt = $scope.lists.placeHolderTxt2[0];
        }
        else if(index == 9){
            phTxt = $scope.lists.placeHolderTxt2[1];
        }
        else if(index == 10){
            phTxt = $scope.lists.placeHolderTxt2[2];
        }
        else if(index == 11){
            phTxt = $scope.lists.placeHolderTxt2[0];
        }
        else if(index == 12){
            phTxt = $scope.lists.placeHolderTxt[4];
        }
        else if(index == 13){
            phTxt = $scope.lists.placeHolderTxt2[3];
        }
        else if(index == 14){
            phTxt = $scope.lists.placeHolderTxt2[4];
        }
        else if(index == 15){
            phTxt = $scope.lists.placeHolderTxt2[0];
        }
        else if(index == 16){
            phTxt = $scope.lists.placeHolderTxt2[5];
        }
        else if(index == 17){
            phTxt = $scope.lists.placeHolderTxt2[6];
        }
        else if(index == 18){
            phTxt = $scope.lists.placeHolderTxt2[8];
        }
        else if(index == 19){
            phTxt = $scope.lists.placeHolderTxt2[9];
        }
        else if(index == 20){
            phTxt = $scope.lists.placeHolderTxt2[10];
        }
        else if(index == 21){
            phTxt = $scope.lists.placeHolderTxt[4];
        }
        else if(index == 22){
            phTxt = $scope.lists.placeHolderTxt2[11];
        }

        return phTxt;
    };
    //========================================================================================


    //========================================================================================
    // Parse Webble Instance Id
    // Parse the full name of a webble to extract the instance id and return that
    //========================================================================================
    var parseWblInstanceId = function(wblFullName){
        var wblInstId = 0;

        if(wblFullName){
            var startIndex = wblFullName.lastIndexOf('[') + 1;
            var strLength = wblFullName.lastIndexOf(']') - startIndex;
            if(startIndex != -1 && strLength > 0){
                wblInstId = parseInt(wblFullName.substr(startIndex, strLength));
            }
        }

        return wblInstId;
    }
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if(result == 'cancel'){
            $modalInstance.close(null);
        }
        else if(result == 'submit'){
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform' && $scope.formProps.currentSelected == $scope.lists.platformEventItems[0]){

                if(!$scope.formProps.currDepSelGr || $scope.formProps.currDepSelGr == ''){
                    $scope.formProps.currDepSelGr = {left: '0', top: '0', right: parseInt($('#workspaceSurface').css('width')).toString(), bottom: parseInt($('#workspaceSurface').css('height')).toString()};
                }
                else{
                    if(!$scope.formProps.currDepSelGr.left || $scope.formProps.currDepSelGr.left == ''){
                        $scope.formProps.currDepSelGr.left = '0';
                    }
                    if(!$scope.formProps.currDepSelGr.top || $scope.formProps.currDepSelGr.top == ''){
                        $scope.formProps.currDepSelGr.top = '0';
                    }
                    if(!$scope.formProps.currDepSelGr.right || $scope.formProps.currDepSelGr.right == ''){
                        $scope.formProps.currDepSelGr.right = parseInt($('#workspaceSurface').css('width')).toString();
                    }
                    if(!$scope.formProps.currDepSelGr.bottom || $scope.formProps.currDepSelGr.bottom == ''){
                        $scope.formProps.currDepSelGr.bottom = parseInt($('#workspaceSurface').css('height')).toString();
                    }
                }
            }

            $modalInstance.close($scope.formProps);
        }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================
    if($scope.formProps.selectWhat == 'Target'){
        $scope.formProps.possibleOpts.push('Target Undefined');
        $scope.formProps.possibleOpts.push('Platform');
        for(var i = 0, rel; rel = props.wblScope.getAllRelatives(props.wblScope.theView)[i]; i++){
            $scope.formProps.possibleOpts.push(rel.scope().getWebbleFullName());
        }
        $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.targetSeekers);

        if($scope.formProps.eaType == "Action"){
            $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.targetSeekersAdditionalForActions);
        }
    }
    else if($scope.formProps.selectWhat == 'Targets Focus Item'){
        $scope.formProps.possibleOpts.push('Item Undefined');
        if($scope.formProps.eaType == "Event"){
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform'){
                $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.platformEventItems);
                $scope.lists.mainMenuItems = getMainMenuItems();
                for(var i = 0, rel; rel = props.wblScope.getAllRelatives(props.wblScope.theView)[i]; i++){
                    $scope.relatives.push(rel.scope().getWebbleFullName());
                    $scope.relatives.push(rel.scope().theWblMetadata['displayname']);
                }
                $scope.lists.mouseEvs.push('Mouse Left Button Up');
            }
            else if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined'){
                for(var i = 0, rel; rel = props.wblScope.getAllRelatives(props.wblScope.theView)[i]; i++){
                    $scope.relatives.push(rel.scope().getWebbleFullName());
                    $scope.relatives.push(rel.scope().theWblMetadata['displayname']);
                }
                $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.wblEventItems);
                selectedTargetInstanceId = parseWblInstanceId($scope.formProps.previousSelectedDependencies.selectedTarget);
                if(selectedTargetInstanceId > 0){
                    var slotList = ['displayname'];
                    var wblInst = props.wblScope.getWebbleByInstanceId(selectedTargetInstanceId);
                    for(var slot in wblInst.scope().getSlots()){
                        slotList.push(slot);
                    }
                    $scope.lists.wblSlots = slotList;

                    var custMenuItems = [];
                    if(wblInst.scope().customMenu){
                        for(var i = 0; i < wblInst.scope().customMenu.length; i++){
                            custMenuItems.push({itemId: wblInst.scope().customMenu[i].itemId, itemName: wblInst.scope().customMenu[i].itemTxt});
                        }
                    }
                    $scope.lists.wblMenuItems = $scope.lists.wblMenuItems.concat(custMenuItems);
                }
            }
        }
        else if($scope.formProps.eaType == "Action"){
            if($scope.formProps.previousSelectedDependencies.selectedTarget == 'Platform'){
                $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.platformActionItems);
                $scope.lists.mainMenuItems = getMainMenuItems();
                for(var i = 0, rel; rel = props.wblScope.getAllRelatives(props.wblScope.theView)[i]; i++){
                  $scope.relatives.push(rel.scope().getWebbleFullName());
                  $scope.relatives.push(rel.scope().theWblMetadata['displayname']);
                }
            }
            else if($scope.formProps.previousSelectedDependencies.selectedTarget != 'Target Undefined'){
                for(var i = 0, rel; rel = props.wblScope.getAllRelatives(props.wblScope.theView)[i]; i++){
                    $scope.relatives.push(rel.scope().getWebbleFullName());
                    $scope.relatives.push(rel.scope().theWblMetadata['displayname']);
                }
                $scope.relatives.push('Fired Eventee');
                $scope.formProps.possibleOpts = $scope.formProps.possibleOpts.concat($scope.lists.wblActionItems);
                selectedTargetInstanceId = parseWblInstanceId($scope.formProps.previousSelectedDependencies.selectedTarget);
                if(selectedTargetInstanceId > 0){
                    var slotList = ['displayname'];
                    var wblInst = props.wblScope.getWebbleByInstanceId(selectedTargetInstanceId);
                    for(var slot in wblInst.scope().getSlots()){
                        slotList.push(slot);
                    }
                    $scope.lists.wblSlots = slotList;

                    var custMenuItems = [];
                    if(wblInst.scope().customMenu){
                        for(var i = 0; i < wblInst.scope().customMenu.length; i++){
                            custMenuItems.push({itemId: wblInst.scope().customMenu[i].itemId, itemName: wblInst.scope().customMenu[i].itemTxt});
                        }
                    }
                    $scope.lists.wblMenuItems = $scope.lists.wblMenuItems.concat(custMenuItems);
                }
            }
        }
    }
});
//=======================================================================================
