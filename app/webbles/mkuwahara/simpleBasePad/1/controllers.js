//======================================================================================================================
// Controllers for Base Pad for Webble World v3.0 (2013)
// Created By: TrueMrWalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('simpleBasePadCtrl', function($scope, $log, Slot, Enum) {
    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		basePadFoundation: ['width', 'height', 'background-color', 'border', 'border-radius'],
		basePadTitle: ['color', 'font-family', 'font-size', 'font-weight']
    };

    $scope.wblStyles = {
    	txtAlign: "left",
		lineHeight: "1em",
		position: "relative",
		left: 0,
		marginLeft: 0
	};

    var textPosOptions = ['Top Left', 'Top Center', 'Top Right', 'Center Left', 'Center Center', 'Center Right', 'Bottom Left', 'Bottom Center', 'Bottom Right'];
    var basePadTitle;
    //$scope.customMenu = [{itemId: 'eat', itemTxt: 'Have Lunch'}, {itemId: 'drink', itemTxt: 'Have refreshment'}];

    //$scope.addPopupMenuItemDisabled('BringFwd');
    //$scope.removePopupMenuItemDisabled([ITEM-ID]);
	//$scope.isPopupMenuItemDisabled([ITEM-ID]);

    //$scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];

    //var internalFilesPath;


    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		//internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);
		basePadTitle = $scope.theView.parent().find("#basePadTitle");

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'basePadTextPos'){
				positionTheText(textPosOptions[eventData.slotValue]);
			}
			else if(eventData.slotName == 'basePadFoundation:height' || eventData.slotName == 'basePadTitle:font-size' || eventData.slotName == 'basePadTitle:font-weight' || eventData.slotName == 'basePadTitle:font-family'){
				positionTheText(textPosOptions[$scope.gimme("basePadTextPos")]);
			}
		});

        $scope.addSlot(new Slot('basePadText',
            "Base Pad Child Controller",
            'Text',
            'Text displayed on the base pad webble',
			"BasePad Text",
            "BasePad Text",
            undefined
        ));

		$scope.addSlot(new Slot('basePadTextPos',
			0,
			'Text Position',
			'The position of the text in the basePad',
			"BasePad Text",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: textPosOptions},
			undefined
		));
        //$scope.getSlot([SLOT NAME]).setDisabledSetting(Enum.SlotDisablingState.[SELECTED ACCESS STATE]);


		//$scope.theWblMetadata['templateid'],

		// {noFloatValRound: true}  // stops rounding long floats in property form
		// {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an integer (index)
		// {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
		// {inputType: Enum.aopInputTypes.RadioButton, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
		// {inputType: Enum.aopInputTypes.MultiListBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
		// {inputType: Enum.aopInputTypes.MultiCheckBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
		// {inputType: Enum.aopInputTypes.Slider, sliderMinMax: [0, 100]}
		// {inputType: Enum.aopInputTypes.DatePick}  // slot value is date filtered: $filter('date')(new Date(), 'yyyy-MM-dd');

		//$scope.setDefaultSlot('msg');

        //$scope.setChildContainer(childHolder)

        $scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){
			var newChild = $scope.getWebbleByInstanceId(eventData.childId);
			if(newChild.scope().theWblMetadata['templateid'] == 'fundamental'){
				newChild.scope().set('msg', 'Daddy!!!');
			}
		});
    };
    //===================================================================================


	//===================================================================================
	// Position The Text
	//===================================================================================
	var positionTheText = function(pos){
		$scope.wblStyles.lineHeight = "1em";
		$scope.wblStyles.position = "relative";
		$scope.wblStyles.left = 0;
		$scope.wblStyles.marginLeft = 0;
		switch (pos){
			case 'Top Left':
				$scope.wblStyles.txtAlign = "left";
				break;
			case 'Top Center':
				$scope.wblStyles.txtAlign = "center";
				break;
			case 'Top Right':
				$scope.wblStyles.txtAlign = "right";
				break;
			case 'Center Left':
				$scope.wblStyles.txtAlign = "left";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Center Center':
				$scope.wblStyles.txtAlign = "center";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Center Right':
				$scope.wblStyles.txtAlign = "right";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Bottom Left':
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.marginLeft = "7px";
				break;
			case 'Bottom Center':
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.left = "50%";
				$scope.wblStyles.marginLeft = "-50%";
				break;
			case 'Bottom Right':
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.left = "99%";
				$scope.wblStyles.marginLeft = "-100%";
				break;
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

        if (targetName != ""){
            //=== [TARGET NAME] ====================================
            //if (targetName == $scope.customInteractionBalls[0].name){
            //    [CODE FOR MOUSE DOWN]
            //    $scope.theView.mouseup(function(event){
            //        [CODE FOR MOUSE UP]
            //    });
            //    $scope.theView.mousemove(function(event){
            //        [CODE FOR MOUSE MOVE]
            //    });
            //}
            //=============================================

            //=== Jump ====================================
            // EXAMPLE:
            // if (targetName == $scope.customInteractionBalls[0].name){ //jump
            //     $scope.set('root:left', 0);
            //     $scope.set('root:top', 0);
            // }
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
        //if(itemName == $scope.customMenu[0].itemId){  //[CUSTOM ITEM NAME]
        //    [CODE FOR THIS MENU ITEM GOES HERE]
        //}

        // EXAMPLE:
        // if(itemName == $scope.customMenu[0].itemId){  //eat
        //     $log.log('Are you hungry?');
        // }
        // else if(itemName == $scope.customMenu[1].itemId){  //drink
        //     $log.log('Are you thirsty?')
        // }
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


    // TODO: POSSIBLE ADDITIONAL CUSTOM METHODS
    //========================================================================================
    // Custom template specific methods is very likely to be quite a few of in every Webble,
    // and they contain what ever the developer want them to contain.
    //========================================================================================
    // "Public" (accessible outside this controller)
//    $scope.[CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
//        [CUSTOM CODE HERE]
//    }

    // "Private" (accessible only inside this controller)
//    var [CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
//        [CUSTOM CODE HERE]
//    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
