//======================================================================================================================
// Controllers for Duplicate Pro for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('duplicateProWblCtrl', function($scope, $log, $timeout, Slot, Enum) {
    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		dupliPro: ['width', 'height', 'background-color', 'border', 'border-radius'],
		dupliProTxt: ['font-size', 'color']
    };

	var wblDuplTemplate;
	var wblDuplTemplateInstanceID;
	var duplExecConfig;
	var colIndex, rowIndex;


	//=== CUSTOM INTERFACES ====================================================================
    $scope.customMenu = [{itemId: 'execDuplication', itemTxt: 'Execute Duplication'}]; //{itemId: 'customDuplicateAttr', itemTxt: 'Custom Duplicate Attribute Slot'}

    //$scope.customInteractionBalls = [{index: 4, name: 'customDuplicateAttr', tooltipTxt: 'Custom Duplicate Attribute Slot'}];


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){

			if(eventData.slotName == 'execDuplication'){
				if(eventData.slotValue == true){
					$scope.getSlot('execDuplication').setValue(false);

					$timeout(function () {
						if(wblDuplTemplate != undefined){
							var amount = $scope.gimme('numberOfDuplicates');
							var startPos = {x: 0, y: 0};
							var originalWblPos = $scope.getWblAbsPosInPixels(wblDuplTemplate);
							var targetPos = $scope.gimme('firstDuplPos');
							if($scope.gimme('firstDuplPosRelOrgEnabled')){
								startPos = targetPos;
							}
							else{
								startPos.x = targetPos.x - originalWblPos.x;
								startPos.y = targetPos.y - originalWblPos.y;
							}
							duplExecConfig = {
								"amount": amount,
								"countCol": amount[0],
								"countRow": amount[1],
								"fPos": startPos,
								"nPos": $scope.gimme('followDuplRelPos'),
								"col": $scope.gimme('duplicatesColors'),
								"txt": $scope.gimme('duplicatesText')
							};
							executeDuplication();
						}
					});
				}
			}
			else if(eventData.slotName == 'originalWblDispName'){
				if(duplExecConfig == undefined){
					if(eventData.slotValue != ""){
						var foundWblsArr = $scope.getWebblesByDisplayName(eventData.slotValue);
						if(foundWblsArr.length > 0){
							wblDuplTemplate = foundWblsArr[0];
							wblDuplTemplateInstanceID = wblDuplTemplate.scope().getInstanceId();
						}
						else{
							wblDuplTemplate = undefined;
							wblDuplTemplateInstanceID = undefined;
							$timeout(function () { $scope.showQIM("There is no such Webble as " + eventData.slotValue + " available to serve as Duplicate Template!", 4000); });
						}
					}
					else{
						wblDuplTemplate = undefined;
						wblDuplTemplateInstanceID = undefined;
					}
				}
				else{
					$scope.getSlot("originalWblDispName").setValue(wblDuplTemplate.scope().getInstanceName());
				}
			}

			else if(eventData.slotName == 'numberOfDuplicates'){
				if(!(eventData.slotValue.length == 2 && !isNaN(eventData.slotValue[0]) && !isNaN(eventData.slotValue[1]))){
					if(!isNaN(eventData.slotValue)){
						if(eventData.slotValue > 0){ $scope.set('numberOfDuplicates', [eventData.slotValue, 1]); }
						else{ $scope.set('numberOfDuplicates', [eventData.slotValue, 1]); }
					}
					else{ $scope.set('numberOfDuplicates', [0, 0]); }
				}
			}

			else if(eventData.slotName == 'firstDuplPos'){
				if(!(eventData.slotValue.x != undefined && !isNaN(eventData.slotValue.x) && eventData.slotValue.y != undefined && !isNaN(eventData.slotValue.y))){
					if(!isNaN(eventData.slotValue)){
						$scope.set('firstDuplPos', {x: eventData.slotValue, y: eventData.slotValue});
					}
					else{ $scope.set('firstDuplPos', {x: 0, y: 0}); }
				}
			}

			else if(eventData.slotName == 'followDuplRelPos'){
				if(!(eventData.slotValue.length == 2 && eventData.slotValue[0].x != undefined && !isNaN(eventData.slotValue[0].x) && eventData.slotValue[0].y != undefined && !isNaN(eventData.slotValue[0].y) && eventData.slotValue[1].x != undefined && !isNaN(eventData.slotValue[1].x) && eventData.slotValue[1].y != undefined && !isNaN(eventData.slotValue[1].y))){
					$scope.set('followDuplRelPos', [{x: 0, y: 0}, {x: 0, y: 0}]);
				}
			}

			else if(eventData.slotName == 'duplicatesColors'){
				if(!(eventData.slotValue.slotName != undefined && eventData.slotValue.colorArr != undefined && $.isArray(eventData.slotValue.colorArr))){
					$scope.set('duplicatesColors', {slotName: "", colorArr: [["red", "orange"], ["blue", "cyan"]]});
				}
			}

			else if(eventData.slotName == 'duplicatesText'){
				if(!(eventData.slotValue.slotName != undefined && eventData.slotValue.textArr != undefined && $.isArray(eventData.slotValue.textArr))){
					$scope.set('duplicatesText', {slotName: "", textArr: [[""]]});
				}
			}
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
			if(eventData.targetId == wblDuplTemplateInstanceID){
				wblDuplTemplate = undefined;
				wblDuplTemplateInstanceID = undefined;
				$scope.set("originalWblDispName", "");
				$timeout(function () { $scope.showQIM("The Webble original template that was used for duplication has been deleted!", 4000); });
			}
		}, null);


		// === SLOTS ===========
		$scope.addSlot(new Slot('execDuplication',
			false,
			'Execute Duplication',
			'When set to true, the duplicate will be created according to configuration and this slot will reset to false again.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('originalWblDispName',
        	'',
        	'Original Display Name',
        	'The original Webble that will serve as template is located by display name (meaning it has to be loaded and exist in the workspace. Only the first Webble found will be used if more Webbles with the same name exists.) ',
			$scope.theWblMetadata['templateid'],
        	undefined,
        	undefined
        ));

		$scope.addSlot(new Slot('numberOfDuplicates',
			[0, 0],
			'No of Duplicates',
			'The amount of duplicates that will be created, described as an array of [columns, rows].',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('firstDuplPos',
			{x: 0, y: 0},
			'First Position',
			'The left top position of the first duplicate',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('firstDuplPosRelOrgEnabled',
			false,
			'Relative Orignal Enabled',
			'When checked the position of the first duplicate will not be absolute, but instead be relative to its original template',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('followDuplRelPos',
			[{x: 0, y: 0}, {x: 0, y: 0}],
			'Follow Offset Position',
			'The offset position relative to previous duplicate position. stored as an array for [horizontal, vertical]',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('duplicatesColors',
			{slotName: "", colorArr: [["red", "orange"], ["blue", "cyan"]]},
			'Duplicates Colors',
			'a dataobject that contains the slotname for color change and a nested array with colors to be set. if the array of colors is smaller than the array of duplicates, then the colors will start over.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('duplicatesText',
			{slotName: "", textArr: [[""]]},
			'Duplicates Texts',
			'a dataobject that contains the slotname for text change and a nested array with texts to be set. if the array of texts is smaller than the array of duplicates, then the texts will start over. If instead of strings, the array contains 2 numbers instead, then each new duplicate will will get a numerical counting value with first value to be the first in the array, and each following the number of steps described as the second value in the array. e.g. textArr: [[1,2]] --> 1,3,5,7,9,11 etc',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('enableOriginalSameParent',
			false,
			'Assign Origin Parent Enabled',
			'When checked all the duplicates will be assigned the same parent as the original Webble has',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.setResizeSlots('dupliPro:width', 'dupliPro:height');
    };
    //===================================================================================


	//===================================================================================
	// Execute Duplication
	// This method do the duplication as instructed by the configuration slots.
	//===================================================================================
	var executeDuplication = function(justLoadedWblData){
		if(justLoadedWblData){
			if(duplExecConfig.col.slotName != ""){
				var colRowIndex = rowIndex;
				while(colRowIndex >= duplExecConfig.col.colorArr.length){
					colRowIndex -= duplExecConfig.col.colorArr.length;
				}

				var colColIndex = colIndex;
				while(colColIndex >= duplExecConfig.col.colorArr[colRowIndex].length){
					colColIndex -= duplExecConfig.col.colorArr[colRowIndex].length;
				}

				justLoadedWblData.wbl.scope().set(duplExecConfig.col.slotName, duplExecConfig.col.colorArr[colRowIndex][colColIndex]);
			}

			if(duplExecConfig.txt.slotName != ""){
				var txtRowIndex = rowIndex;
				var txtColIndex = colIndex;
				var txtToPrint = "";

				if(duplExecConfig.txt.textArr.length == 2 && duplExecConfig.txt.textArr[0].length == 1 && duplExecConfig.txt.textArr[1].length == 1 && !isNaN(duplExecConfig.txt.textArr[0]) && !isNaN(duplExecConfig.txt.textArr[1])){
				 	txtToPrint = (rowIndex * duplExecConfig.amount[0]) + colIndex + 1;
				}
				else{
					while(txtRowIndex >= duplExecConfig.txt.textArr.length){
						txtRowIndex -= duplExecConfig.txt.textArr.length;
					}

					while(txtColIndex >= duplExecConfig.txt.textArr[txtRowIndex].length){
						txtColIndex -= duplExecConfig.txt.textArr[txtRowIndex].length;
					}

					txtToPrint = duplExecConfig.txt.textArr[txtRowIndex][txtColIndex];
				}

				justLoadedWblData.wbl.scope().set(duplExecConfig.txt.slotName, txtToPrint);
			}

			if($scope.gimme("enableOriginalSameParent")){
				var origParent = wblDuplTemplate.scope().getParent();
				if(origParent != undefined){
					justLoadedWblData.wbl.scope().paste(origParent);
				}
			}
		}

		if(duplExecConfig.countRow > 0){
			if(duplExecConfig.countCol > 0){
				var pos = {x: 0, y: 0};
				colIndex = duplExecConfig.amount[0] - duplExecConfig.countCol;
				rowIndex = duplExecConfig.amount[1] - duplExecConfig.countRow;
				pos.x = duplExecConfig.fPos.x + ((duplExecConfig.nPos[1].x * rowIndex) + (duplExecConfig.nPos[0].x * colIndex));
				pos.y = duplExecConfig.fPos.y + ((duplExecConfig.nPos[1].y * rowIndex) + (duplExecConfig.nPos[0].y * colIndex));
				duplExecConfig.countCol--;
				wblDuplTemplate.scope().duplicate(pos, executeDuplication);
			}

			if(duplExecConfig.countCol == 0){
				duplExecConfig.countRow--;
				if(duplExecConfig.countRow > 0){
					duplExecConfig.countCol = duplExecConfig.amount[0];
				}
				else {
					$timeout(function () { duplExecConfig = undefined; });
				}
			}
		}
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

        // if (targetName != ""){
        //     //=== Custom Duplicate Attribute Slot ====================================
        //     if(targetName == $scope.customInteractionBalls[0].name){ //customDuplicateAttr
        //
        //     }
        //     //=============================================
        // }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
        // if(itemName == $scope.customMenu[0].itemId){  //customDuplicateAttr
        //
        // }
        // else
        if(itemName == $scope.customMenu[0].itemId){  //execDuplication
			$timeout(function () { $scope.set('execDuplication', true); }, 100);
        }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
        var customWblDefPart = {

        };

        return customWblDefPart;
    };
    //===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
