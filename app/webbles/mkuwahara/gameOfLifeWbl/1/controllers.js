//======================================================================================================================
// Controllers for Game-Of-Life Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('golCtrl', function($scope, $log, $timeout, $rootScope, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		cell: ['background-color', 'border'],
		cellCore: ['background-color', 'border']
    };

    $scope.customMenu = [{itemId: 'activate', itemTxt: 'Activate'}];

	var isTurnedOn = false;
	var keyHasBeenPressed = false;
	var theTimerFunc;
	var tick = 700;

	var surroundingOffsets = [
		{x: -40, y: -40},
		{x: 0, y: -40},
		{x: 40, y: -40},
		{x: 40, y: 0},
		{x: 40, y: 40},
		{x: 0, y: 40},
		{x: -40, y: 40},
		{x: -40, y: 0}
	];

	if($rootScope.isDuplicating == undefined){
		$rootScope['isDuplicating'] = false;
	}

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    // If any initiation needs to be done when the webble is created it is here that
    // should be executed. the saved def object is sent as a parameter in case it
    // includes data this webble needs to retrieve.
    // If this function is empty and unused it can safely be deleted.
    // Possible content for this function is as follows:
    // *Add own slots
    // *Set the default slot
    // *Set Custom Child Container
    // *Create Value watchers for slots and other values
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		$scope.addSlot(new Slot('isActive',
            0,
            'Activation Master',
            'The instance Id of the Webble that is in charge of the active loop of "life',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
		$scope.getSlot('isActive').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var templateId = $scope.getWebbleByInstanceId(eventData.targetId).scope().theWblMetadata['templateid'];
			if(templateId == 'gameOfLifeWbl' && eventData.slotName == 'isActive'){
				if(!$rootScope.isDuplicating){
					if(eventData.slotValue == $scope.getInstanceId() || (isTurnedOn && eventData.slotValue == 0)){
						var GoLWbls = $scope.getWebblesByTemplateId('gameOfLifeWbl');
						for(var i = 0; i < GoLWbls.length; i++){
							if(GoLWbls[i].scope().getInstanceId() != $scope.getInstanceId()){
								if(GoLWbls[i].scope().gimme('isActive') != eventData.slotValue){
									GoLWbls[i].scope().set('isActive', eventData.slotValue);
								}
							}
							if(eventData.slotValue != 0){GoLWbls[i].scope().addPopupMenuItemDisabled('Duplicate'); GoLWbls[i].scope().addPopupMenuItemDisabled('activate');}
							else{GoLWbls[i].scope().removePopupMenuItemDisabled('Duplicate'); GoLWbls[i].scope().removePopupMenuItemDisabled('activate');}
						}

						if(!isTurnedOn && eventData.slotValue == $scope.getInstanceId()){
							isTurnedOn = true;
							$scope.setWaitingServiceDeactivationState(true);
							runLifeCycle();
						}
						else if(isTurnedOn && eventData.slotValue == 0){
							$scope.setWaitingServiceDeactivationState(true);
							isTurnedOn = false;
							keyHasBeenPressed = false;
							var GoLWbls = $scope.getWebblesByTemplateId('gameOfLifeWbl');
							for(var i = 0; i < GoLWbls.length; i++){
								if(eventData.slotValue != 0){GoLWbls[i].scope().addPopupMenuItemDisabled('Duplicate'); GoLWbls[i].scope().addPopupMenuItemDisabled('activate');}
								else{GoLWbls[i].scope().removePopupMenuItemDisabled('Duplicate'); GoLWbls[i].scope().removePopupMenuItemDisabled('activate');}
							}
						}
					}
				}
			}
			if(eventData.targetId == $scope.getInstanceId() && (eventData.slotName == 'root:left' || eventData.slotName == 'root:top')){
				var l = parseInt($scope.gimme('root:left'));
				var t = parseInt($scope.gimme('root:top'));

				if(l%40 != 0){
					$scope.set('root:left', l - (l%40));
				}

				if(t%40 != 0){
					$scope.set('root:top', t - (t%40));
				}

				if(!isPosAvailable({x: l, y: t})){
					$scope.set('root:left', l + 40);
				}
			}
		}, null);

		$scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
			if(eventData.key.name == 'Down Arrow'){
				keyHasBeenPressed = true;
				//$log.log($scope.getInstanceId());
				//$timeout.cancel(theTimerFunc);
				//isTurnedOn = false;
				$scope.set('isActive', 0);
			}
		});
    };
    //===================================================================================


	//===================================================================================
	// Run Life Cycle
	// do a life cycle run
	//===================================================================================
	var runLifeCycle = function(){
		if(isTurnedOn == false || keyHasBeenPressed){
			if(keyHasBeenPressed){
				$scope.set('isActive', 0);
			}
			return;
		}

		var GoLWbls = $scope.getWebblesByTemplateId('gameOfLifeWbl');
		for(var i = 0; i < GoLWbls.length; i++){
			if(GoLWbls[i].scope().gimme('isActive') != $scope.getInstanceId()){
				theTimerFunc = $timeout(function(){runLifeCycle();}, tick);
				return;
			}
		}

		var cellsToBeBorn = [];
		var wblsToDie = [];
		var wblsToLive = [];
		for(var i = 0; i < GoLWbls.length; i++){
			var surroundingCellsPos = getSurroundingCellsPos(parseInt(GoLWbls[i].scope().gimme('root:left')), parseInt(GoLWbls[i].scope().gimme('root:top')));
			var surroundingCells = getSurroundingWebbles(surroundingCellsPos);
			var noOfOccupiedNeighbourCells = surroundingCells[8];

			for(var j = 0; j < 8; j++){
				if(surroundingCells[j] == null){
					if(getNoOfNeighbours(surroundingCellsPos[j]) == 3){
						cellsToBeBorn.push(surroundingCellsPos[j]);
					}
				}
			}

			if(noOfOccupiedNeighbourCells < 2 || noOfOccupiedNeighbourCells > 3){
				wblsToDie.push(GoLWbls[i]);
			}
			else{
				wblsToLive.push(GoLWbls[i]);
			}
		}

		var uniqueCellsToBeBorn = [];
		for(var i = 0; i < cellsToBeBorn.length; i++){
			var alreadyExist = false;
			for(var j = 0; j < uniqueCellsToBeBorn.length; j++){
				if(cellsToBeBorn[i].x == uniqueCellsToBeBorn[j].x && cellsToBeBorn[i].y == uniqueCellsToBeBorn[j].y){
					alreadyExist = true;
					break;
				}
			}
			if(!alreadyExist){
				uniqueCellsToBeBorn.push(cellsToBeBorn[i]);
			}
		}

		if(uniqueCellsToBeBorn.length > 0){
			$rootScope.isDuplicating = true;

			for(var i = 0; i < uniqueCellsToBeBorn.length; i++){
				if((i + 1) == uniqueCellsToBeBorn.length){
					$scope.duplicate({x: (uniqueCellsToBeBorn[i].x - parseInt($scope.gimme('root:left'))), y: (uniqueCellsToBeBorn[i].y - parseInt($scope.gimme('root:top')))}, function(newWbl){
						wblsToLive.push(newWbl.wbl);
						$timeout(function(){ $rootScope.isDuplicating = false; });

						for(var i = 0; i < wblsToDie.length; i++){
							if(wblsToDie[i].scope().getInstanceId() == $scope.getInstanceId()){
								isTurnedOn = false;
								if(wblsToLive.length > 0){
									var newMaster = wblsToLive[0];
									$timeout(function(){ newMaster.scope().set('isActive', newMaster.scope().getInstanceId()); }, tick);
								}
							}
							$scope.requestDeleteWebble(wblsToDie[i].scope().theView);
						}
					});
				}
				else{
					$scope.duplicate({x: (uniqueCellsToBeBorn[i].x - parseInt($scope.gimme('root:left'))), y: (uniqueCellsToBeBorn[i].y - parseInt($scope.gimme('root:top')))}, function(newWbl){
						wblsToLive.push(newWbl.wbl);
					});
				}
			}
		}
		else{
			for(var i = 0; i < wblsToDie.length; i++){
				if(wblsToDie[i].scope().getInstanceId() == $scope.getInstanceId()){
					isTurnedOn = false;
					if(wblsToLive.length > 0){
						var newMaster = wblsToLive[0];
						$timeout(function(){ newMaster.scope().set('isActive', newMaster.scope().getInstanceId()); }, tick);
					}
				}
				$scope.requestDeleteWebble(wblsToDie[i].scope().theView);
			}
		}

		if(isTurnedOn){ theTimerFunc = $timeout(function(){runLifeCycle();}, tick); }
	};
	//===================================================================================


	//========================================================================================
	// Get Surrounding Webbles
	// This method returns a list of Webbles that surrounds the specified position. If no
	// Webble is on a certain psotion the value is null and finally an amount of webbles is
	// stored at the end of the returning array.
	//========================================================================================
	var getSurroundingWebbles = function(surroundingCellsPos){
		var surroundingCellsContent = [null, null, null, null, null, null, null, null, 0];

		for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
			if (aw.scope().theWblMetadata['templateid'] == 'gameOfLifeWbl'){
				var l = parseInt(aw.scope().gimme('root:left'));
				var t = parseInt(aw.scope().gimme('root:top'));
				for(var n = 0; n < surroundingCellsPos.length; n++){
					if(surroundingCellsPos[n].x == l && surroundingCellsPos[n].y == t){
						surroundingCellsContent[8] += 1;
						surroundingCellsContent[n] = aw.scope().getInstanceId();
					}
				}
			}
		}

		return surroundingCellsContent;
	};
	//========================================================================================


	//========================================================================================
	// Get Number of Neighbours
	// This method returns the amount of occupied neighbouring cells for a specified position
	//========================================================================================
	var getNoOfNeighbours = function(whatPos){
		var scPos;
		if(whatPos == undefined){ scPos = getSurroundingCellsPos(parseInt($scope.gimme('root:left')), parseInt($scope.gimme('root:top'))); }
		else{ scPos = getSurroundingCellsPos(whatPos.x, whatPos.y); }

		var noOfNeighbours = 0;

		for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
			if (aw.scope().theWblMetadata['templateid'] == 'gameOfLifeWbl'){
				var l = parseInt(aw.scope().gimme('root:left'));
				var t = parseInt(aw.scope().gimme('root:top'));
				for(var n = 0; n < scPos.length; n++){
					if(scPos[n].x == l && scPos[n].y == t){
						noOfNeighbours++;
					}
				}
			}
		}

		return noOfNeighbours;
	};
	//========================================================================================


	//========================================================================================
	// Get Surrounding Cells Positions
	// This method returns the positions of all surrounding neghbouring cells.
	//========================================================================================
	var getSurroundingCellsPos = function(l, t){
		if(l == undefined){ l = parseInt($scope.gimme('root:left')); }
		if(t == undefined){ t = parseInt($scope.gimme('root:top')); }
		var surroundingCellsPos = [
			{x: l - 40, y: t - 40},
			{x: l, y: t - 40},
			{x: l + 40, y: t - 40},
			{x: l + 40, y: t},
			{x: l + 40, y: t + 40},
			{x: l, y: t + 40},
			{x: l - 40, y: t + 40},
			{x: l - 40, y: t}
		];

		return surroundingCellsPos;
	};
	//========================================================================================


	//========================================================================================
	// Is Posistion Available
	// This method return true/false if the position on the workboard is available
	// (not occupied) for a life webble at the defined position.
	//========================================================================================
	var isPosAvailable = function(whatPos){
		for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
			if (aw.scope().theWblMetadata['templateid'] == 'gameOfLifeWbl' && aw.scope().getInstanceId() != $scope.getInstanceId()){
				var l = parseInt(aw.scope().gimme('root:left'));
				var t = parseInt(aw.scope().gimme('root:top'));
				if(whatPos.x == l && whatPos.y == t){
					return false;
				}
			}
		}

		return true;
	};
	//========================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
        if(itemName == $scope.customMenu[0].itemId){  //activate
			$scope.showQIM("Deactivate Game of Life with Down Arrow key ( \u2193 )", 2000);
			keyHasBeenPressed = false;
            $scope.set('isActive', $scope.getInstanceId());
        }
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
