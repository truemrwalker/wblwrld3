//======================================================================================================================
// Controllers for String Master Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================
wblwrld3App.controller('stringMasterCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        stringContainer: ['width', 'height', 'background-color', 'border', 'border-radius'],
        valueDisplay: ['font-size', 'color', 'font-family', 'color']
    };

    $scope.htmlContent = {
        displayTxt: ""
    };


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

        $scope.addSlot(new Slot('displayedSlot',
            0,
            'Slot to Display',
            'Which slot value should the Webble display',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Primary String', 'String Length', 'Sub String Start Index', 'Sub String No. of characters', 'Sub String End Index', 'Sub String', 'Secondary String', 'Joined String', 'Index in String', 'Character in String at Index', 'String Part', 'First Index', 'Last Index', 'Replace String Out', 'Replace String In', 'Replace String Result', 'Splitting Character', 'Splitted String List', 'Upper Case String', 'Lower Case String']},
            undefined
        ));

        $scope.addSlot(new Slot('primaryString',
            "",
            'Primary String',
            'The Primary text string that is being evaluated and manipulated',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

        $scope.addSlot(new Slot('stringLength',
            0,
            'String Length',
            'The length in number of characters of the primary string',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('stringLength').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('subStrStartIndex',
            -1,
            'Sub String Start Index',
            'The character position in the primary string where the sub string will begin',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('subStrNoOfChars',
            -1,
            'Sub String No. of characters',
            'The number of characters the substring should contain. This value will override and clear the slot for end index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('subStrEndIndex',
          -1,
          'Sub String End Index',
          'The character position in the primary string where the sub string will end. If set',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));

        $scope.addSlot(new Slot('subString',
            '',
            'Sub String',
            'The sub string extracted from the primary string from selected index with the selected number of characters or the selected to the selected end index',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('subString').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('secondaryString',
            "",
            'Secondary String',
            'The Secondary String that can be used to create a third string from the primary.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

        $scope.addSlot(new Slot('joinedString',
            '',
            'Joined String',
            'A new string made from the Primary and the secondary string joined together',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('joinedString').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('indexInString',
            -1,
            'Index in String',
            'If an index is set, the character of that index position is set in its corresponding slot',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('charInStringAtIndex',
            '',
            'Character in String at Index',
            'When index in string is set, the character of that index position will be displayed here.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));
        $scope.getSlot('charInStringAtIndex').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('strPart',
            '',
            'String Part',
            'When set the Webble will locate the first and last occurance index of this slots string inside the primary string',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('firstIndexOf',
          -1,
          'First Index',
          'First index position where string part is found in the primary string',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));
        $scope.getSlot('firstIndexOf').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('lastIndexOf',
          -1,
          'Last Index',
          'Last index position where string part is found in the primary string',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));
        $scope.getSlot('lastIndexOf').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('replaceStrOut',
            '',
            'Replace String Out',
            'A new string will be created that replaces the occurence of this slots string with the value in Replace String In in primary string',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('replaceStrIn',
            '',
            'Replace String In',
            'A new string will be created that replaces the occurence of Replace String Out with the value of this slots string in primary string',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('replaceStrResult',
            '',
            'Replace String Result',
            'This is the resulting string created by replacing Replace String Out with Replace String In from Primary string',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('replaceStrResult').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('splitChar',
            '',
            'Splitting Character',
            'The character set here will be used to split the primary string into a list of smaller strings (where the splitting character will not be preserved)',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('splitResult',
            [],
            'Splitted String List',
            'This is the resulting list of strings using the split character assigned',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('splitResult').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('upperCaseStr',
          '',
          'Upper Case String',
          'This is the primary string with upper case characters only',
          $scope.theWblMetadata['templateid'],
          {inputType: Enum.aopInputTypes.TextArea},
          undefined
        ));
        $scope.getSlot('upperCaseStr').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('lowerCaseStr',
          '',
          'Lower Case String',
          'This is the primary string with lower case characters only',
          $scope.theWblMetadata['templateid'],
          {inputType: Enum.aopInputTypes.TextArea},
          undefined
        ));
        $scope.getSlot('lowerCaseStr').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.setDefaultSlot('primaryString');
        $scope.setResizeSlots('stringContainer:width', 'stringContainer:height');

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var theSlot = eventData.slotName;
			var theValue = eventData.slotValue;
			if(theSlot == 'displayedSlot'){
				$timeout(function(){updateDisplayValue(theValue);});
			}
			else if(theSlot == 'primaryString' || theSlot == 'stringLength' || theSlot == 'subString' || theSlot == 'joinedString' || theSlot == 'charInStringAtIndex' || theSlot == 'firstIndexOf' ||
				theSlot == 'lastIndexOf' || theSlot == 'replaceStrResult' || theSlot == 'splitResult' || theSlot == 'upperCaseStr' || theSlot == 'lowerCaseStr'){
				$timeout(function(){updateSlotsFromPrimaryString();});
			}
			else if(theSlot == 'subStrStartIndex' || theSlot == 'subStrNoOfChars' || theSlot == 'subStrEndIndex'){
				$timeout(function(){buildSubStr();});
			}
			else if(theSlot == 'secondaryString'){
				$timeout(function(){mergeStr();});
			}
			else if(theSlot == 'indexInString'){
				$timeout(function(){getCharacterAtIndex();});
			}
			else if(theSlot == 'strPart'){
				$timeout(function(){getIndexesForStrPart();});
			}
			else if(theSlot == 'replaceStrOut' || theSlot == 'replaceStrIn'){
				$timeout(function(){replaceStrWithOtherStr();});
			}
			else if(theSlot == 'splitChar'){
				$timeout(function(){splitStr();});
			}
			else{
				theSlot = undefined;
			}

			if(theSlot != undefined && theSlot != 'displayedSlot'){
				updateDisplayValue($scope.gimme('displayedSlot'));
			}
		});

		$scope.set('primaryString', "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla lacinia accumsan dolor. Integer nec odio consequat, pellentesque eros at, aliquam ipsum.");

        $scope.set('stringContainer:height', 'auto');
        updateSlotsFromPrimaryString();
    };
    //===================================================================================


    //===================================================================================
    // Update Display Value
    // Make sure the value being displayed by the slot is up to date with the actual
    // slot value.
    //===================================================================================
    var updateDisplayValue = function(chosenSlot){
        var theSlotToUse = 'primaryString';
        if(!isNaN(chosenSlot)){
            switch(chosenSlot){
                case 0: theSlotToUse = 'primaryString'; break;
                case 1: theSlotToUse = 'stringLength'; break;
                case 2: theSlotToUse = 'subStrStartIndex'; break;
                case 3: theSlotToUse = 'subStrNoOfChars'; break;
                case 4: theSlotToUse = 'subStrEndIndex'; break;
                case 5: theSlotToUse = 'subString'; break;
                case 6: theSlotToUse = 'secondaryString'; break;
                case 7: theSlotToUse = 'joinedString'; break;
                case 8: theSlotToUse = 'indexInString'; break;
                case 9: theSlotToUse = 'charInStringAtIndex'; break;
                case 10: theSlotToUse = 'strPart'; break;
                case 11: theSlotToUse = 'firstIndexOf'; break;
                case 12: theSlotToUse = 'lastIndexOf'; break;
                case 13: theSlotToUse = 'replaceStrOut'; break;
                case 14: theSlotToUse = 'replaceStrIn'; break;
                case 15: theSlotToUse = 'replaceStrResult'; break;
                case 16: theSlotToUse = 'splitChar'; break;
                case 17: theSlotToUse = 'splitResult'; break;
                case 18: theSlotToUse = 'upperCaseStr'; break;
                case 19: theSlotToUse = 'lowerCaseStr'; break;
            }
        }

        $scope.htmlContent.displayTxt = $scope.gimme(theSlotToUse);
    };
    //===================================================================================


    //===================================================================================
    // Build Sub String
    // Creates a substring from the primary string based on the set slot values.
    //===================================================================================
    var buildSubStr = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var startIndex = parseInt($scope.gimme('subStrStartIndex'));
        var noOfChars = parseInt($scope.gimme('subStrNoOfChars'));
        var endIndex = parseInt($scope.gimme('subStrEndIndex'));

        if(!isNaN(startIndex) && startIndex >= 0){
            if(!isNaN(noOfChars) && noOfChars >= 0){
                $scope.set('subString', primStr.substr(startIndex, noOfChars));
                if(!isNaN(endIndex) && endIndex >= 0){
                    $scope.set('subStrEndIndex', -1);
                }
            }
            else{
                if(!isNaN(endIndex) && endIndex >= 0){
                    $scope.set('subString', primStr.substring(startIndex, endIndex));
                }
                else{
                    $scope.set('subString', primStr.substr(startIndex));
                }
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // Merge String
    // Merges the Primary and secondary string together.
    //===================================================================================
    var mergeStr = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var secStr = $scope.gimme('secondaryString').toString();
        $scope.set('joinedString', primStr + secStr);
    };
    //===================================================================================


    //===================================================================================
    // Get Character At Index
    // Gets the character in the string found by index
    //===================================================================================
    var getCharacterAtIndex = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var index = parseInt($scope.gimme('indexInString'));
        if(index >= 0){
            $scope.set('charInStringAtIndex', primStr[index]);
        }
    };
    //===================================================================================


    //===================================================================================
    // Get Indexes For String Part
    // Gets the first and last index of string part as found in the primary string.
    //===================================================================================
    var getIndexesForStrPart = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var strPart = $scope.gimme('strPart').toString();
        if(strPart.length > 0){
            $scope.set('firstIndexOf', primStr.indexOf(strPart));
            $scope.set('lastIndexOf', primStr.lastIndexOf(strPart));
        }
    };
    //===================================================================================


    //===================================================================================
    // Replace String With Other String
    // Creates a new string by taking the primary string and replacing one string part
    // with another.
    //===================================================================================
    var replaceStrWithOtherStr = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var strOut = $scope.gimme('replaceStrOut').toString();
        var strIn = $scope.gimme('replaceStrIn').toString();
        if(strOut.length > 0){
            $scope.set('replaceStrResult', primStr.replace(strOut, strIn));
        }
    };
    //===================================================================================


    //===================================================================================
    // Split String
    // Creates a split list from the primary using the assigned splitting character.
    //===================================================================================
    var splitStr = function(){
        var primStr = $scope.gimme('primaryString').toString();
        var splitChar = $scope.gimme('splitChar').toString();
        $scope.set('splitResult', primStr.split(splitChar));
    };
    //===================================================================================


    //===================================================================================
    // Update Slots From Primary String
    // Update all related slots based on the current value of the primary string.
    //===================================================================================
    var updateSlotsFromPrimaryString = function(){
        var primStr = $scope.gimme('primaryString').toString();
        $scope.set('stringLength', primStr.length);
        $scope.set('upperCaseStr', primStr.toUpperCase());
        $scope.set('lowerCaseStr', primStr.toLowerCase());
        buildSubStr();
        mergeStr();
        getCharacterAtIndex();
        getIndexesForStrPart();
        replaceStrWithOtherStr();
        splitStr();
        updateDisplayValue($scope.gimme('displayedSlot'));
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
