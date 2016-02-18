//======================================================================================================================
// Controllers for Basic Argument Manager for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('argManagerCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        argContainer: ['background-color', 'border', 'color', 'font-size', 'color', 'font-family']
    };

    $scope.viewArgs = {
        disptext: ''
    };
    var argSlots = [];
    var templateStrings = [];

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'resultTemplate'){
				if(eventData.slotValue != ''){
					var pattern = /\$(.*?)\$/g;
					argSlots = [];
					eventData.slotValue.replace(pattern, function(g0,g1){argSlots.push(g1);});
					pattern = /\"(.*?)\"/g;
					templateStrings = [];
					eventData.slotValue.replace(pattern, function(g0,g1){templateStrings.push(g1);});
					doCalc();
				}
				else{
					$scope.set('result', '');
					showIt(eventData.slotValue);
				}
			}
			else if(eventData.slotName == 'displayMode'){
				showIt(eventData.slotValue);
			}

			var found = false;
			for(var i = 0; i < argSlots.length; i++){
				if(eventData.slotName.toLowerCase() == argSlots[i].toLowerCase()){
					doCalc();
					break;
				}
			}
		});


        $scope.addSlot(new Slot('resultTemplate',
            '',
            'Result Template',
            'This is the template the Webble will use to create the result. Within dollar signs $ write any slotname and use any mathematical operator to create a math result. Or use + and strings within quatation marks to build a dynamic string. Also works with basic JavaScript functions, e.g. Math library etc.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('arg1',
            'Hello',
            'Argument 1',
            'This is the first of two provided arguments to use in creating a calculated result.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('arg2',
            'World',
            'Argument 2',
            'This is the second of two provided arguments to use in creating a calculated result.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('result',
            '',
            'Result',
            'This is the result of the calculation of the argument using the template formula.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));
        $scope.getSlot('result').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('displayMode',
            1,
            'Display Mode',
            'Setting for if the calculated result should be displayed on the Webble, the name of the Webble or nothing.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Empty', 'Result', 'Name']},
            undefined
        ));

        $scope.setDefaultSlot('result');

        $scope.$watch(function(){return $scope.theWblMetadata['displayname'];}, function(newVal, oldVal) {
            var dm = $scope.gimme('displayMode');
            if(dm == 2){
				showIt(dm);
            }
        }, true);

		$scope.set('resultTemplate', '$arg1$+" "+$arg2$');
    };
    //===================================================================================


    //===================================================================================
    // Calculate the result
    //===================================================================================
    var doCalc = function(){
        var template = $scope.gimme('resultTemplate');
        var theRes = '';
        var allIsNum = true;
        for(var i = 0; i < argSlots.length; i++){
            var argSlotVal = $scope.gimme(argSlots[i]);
            if(isNaN(argSlotVal)){
                allIsNum = false;
            }
            template = template.replace(argSlots[i], argSlotVal);
        }

        template = template.replace(/[\$]+/g, '');
        template = template.replace(/[\"]+/g, '');
        if(allIsNum && templateStrings.length == 0){
			try{
				theRes = eval(template).toString();
			}catch(err) {
				theRes = "ERROR: "+err;
			}
        }
        else{
            template = template.replace(/[\+]+/g, '');
            theRes = template;
        }
        $scope.set('result', theRes);
        var dm = $scope.gimme('displayMode');
        if(dm == 1){ showIt(dm); }
    };
    //===================================================================================


    //===================================================================================
    // Displays the requested value on the Webble
    //===================================================================================
    var showIt = function(displayMode){
        if(displayMode == 0){
            $scope.viewArgs.disptext = '';
        }
        else if(displayMode == 1){
            $scope.viewArgs.disptext = $scope.gimme('result').toString();
        }
        else if(displayMode == 2){
            $scope.viewArgs.disptext = $scope.theWblMetadata['displayname'];
       }
    };

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
