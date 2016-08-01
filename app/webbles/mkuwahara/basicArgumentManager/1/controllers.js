//======================================================================================================================
// Controllers for Basic Argument Manager for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('argManagerCtrl', function($scope, $log, $timeout, Slot, Enum, valMod) {

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
			else if(eventData.slotName == 'preserveQuotationMarks'){
				doCalc();
			}

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
			"",
            'Result (as text)',
            'This is the result of the calculation of the argument using the template formula. stored as a text string',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));
        $scope.getSlot('result').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('resultAsObject',
			null,
			'Result (as JSON or Array)',
			'This is the result of the calculation of the argument using the template formula. stored as a json object or array(if possible, otherwise null)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('resultAsObject').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('displayMode',
            1,
            'Display Mode',
            'Setting for if the calculated result should be displayed on the Webble, the name of the Webble or nothing.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Empty', 'Result', 'Name']},
            undefined
        ));

		$scope.addSlot(new Slot('preserveQuotationMarks',
			false,
			'Preserve Quotation Marks Enabled',
			'If the is checked any quotation marks (\") in the final string will be Preserved and not be considered only to be a string holder.',
			$scope.theWblMetadata['templateid'],
			undefined,
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
		$timeout(doCalc, 500);
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

		if($scope.gimme("preserveQuotationMarks")){
			template = template.replace(/[\"]+/g, '\"');
		}
		else{
			template = template.replace(/[\"]+/g, '');
		}

        if(allIsNum && templateStrings.length == 0){
			try{
				theRes = eval(template).toString();
			}catch(err) {
				theRes = template;
			}
        }
        else{
            template = template.replace(/[\+]+/g, '');
            theRes = template;
        }

		var resultAsJson;
		try{
			resultAsJson = JSON.parse(template, $scope.dynJSFuncParse);
			if(resultAsJson != undefined && JSON.stringify(resultAsJson, $scope.dynJSFuncStringify()) != JSON.stringify($scope.gimme("resultAsObject"), $scope.dynJSFuncStringify())) {
				$scope.set('resultAsObject', resultAsJson);
			}
		}
		catch(e){
			template = template.replace(/\s/g,'');
			if(template != undefined && template[0] == '{' && template[template.length - 1] == '}'){
				var newObj = valMod.fixBrokenObjStrToProperObject(template);
				$scope.set('resultAsObject', newObj);
			}
			else if(template != undefined && template[0] == '[' && template[template.length - 1] == ']'){
				var newArray = valMod.fixBrokenArrStrToProperArray(template);
				if(newArray.length > 0){
					$scope.set('resultAsObject', newArray);
				}
				else{
					$scope.set('resultAsObject', null);
				}
			}
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
