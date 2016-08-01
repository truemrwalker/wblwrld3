//======================================================================================================================
// Controllers for List Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('listCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        listGrabber: ['padding', 'background-color', 'border'],
        listContainer: ['font-family', 'font-size', 'color']
    };

    $scope.theList = {
        items: [],
        currentSelected: ''
    };

    $scope.formProps = {
        CBDisplayClass: 'checkbox',
        RBDisplayClass: 'checkbox',
        listHeight: 'auto',
        listOverflow: 'visible',
        listItemMarkerImage: ''
    };

    var selectChangeBlocked = false;
    var fxList;


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'theList'){
				updateList(newVal);
			}
			else if(eventData.slotName == 'theListType'){
				if(fxList != undefined){ stroll.unbind(fxList); }
				updateList(newVal);
				if(newVal == 6){
					$timeout(function(){fxList = $scope.theView.parent().find("#fxList ul"); stroll.bind(fxList);});
				}
			}
			else if(eventData.slotName == 'theListDirection'){
				if(newVal == 0){
					$scope.formProps.CBDisplayClass = 'checkbox';
					$scope.formProps.RBDisplayClass = 'radio';
				}
				else if(newVal == 1){
					$scope.formProps.CBDisplayClass = 'checkbox-inline';
					$scope.formProps.RBDisplayClass = 'radio-inline';
				}
			}
			else if(eventData.slotName == 'theListContainerHeight'){
				if(newVal != undefined){
					var valParsed = parseInt(newVal);
					if(!isNaN(valParsed)){
						$scope.formProps.listHeight = valParsed + 'px';
						$scope.formProps.listOverflow = 'scroll';
					}
					else{
						$scope.formProps.listHeight = 'auto';
						$scope.formProps.listOverflow = 'visible';
					}

					if($scope.gimme('theListType') == 6){
						if(fxList != undefined){ stroll.unbind(fxList); }
						$timeout(function(){fxList = $scope.theView.parent().find("#fxList ul"); stroll.bind(fxList);});
					}
				}
			}
			else if(eventData.slotName == 'theListItemMarkerImage'){
				if(newVal != undefined){
					$scope.formProps.listItemMarkerImage = 'url(' + newVal + ')';
				}
			}
			else if(eventData.slotName == 'theSelectedName'){
				if(!selectChangeBlocked){
					selectChangeBlocked = true;
					$timeout(function(){selectChangeBlocked = false;}, 100);
					$scope.theList.currentSelected = newVal;
					var count = 0;
					for(var i = 0; i < $scope.theList.items.length; i++){
						if($scope.theList.items[i] == newVal){
							$scope.set('theSelectedIndex', i);
							count++;
						}
					}
					if(count > 1 || (newVal != '' && count == 0)){
						//$scope.set('theSelectedIndex', -2);
					}
					if(newVal == ''){
						$scope.set('theSelectedIndex', -1);
					}
				}
			}
			else if(eventData.slotName == 'theSelectedIndex'){
				if(newVal != -2 && !selectChangeBlocked){
					selectChangeBlocked = true;
					$timeout(function(){selectChangeBlocked = false;}, 100);
					if(newVal < $scope.theList.items.length){
						$scope.theList.currentSelected = $scope.theList.items[parseInt(newVal)];
						$scope.set('theSelectedName', $scope.theList.currentSelected);
					}
					else{
						$scope.set('theSelectedIndex', -1);
						$scope.theList.currentSelected = '';
						$scope.set('theSelectedName', '');
					}
				}
			}
			else if(eventData.slotName == 'removeListItem'){
				if(eventData.slotValue != ''){
					var theListItem = eventData.slotValue;
					var theListStr = $scope.gimme('theList');
					var tempListItems = [], splitChar = '';

					if(theListStr.search(';') != -1){
						tempListItems = theListStr.split(';');
						splitChar = ';';
					}
					else if(theListStr.search(',') != -1){
						tempListItems = theListStr.split(',');
						splitChar = ',';
					}
					else if(theListStr.search(' ') != -1){
						tempListItems = theListStr.split(' ');
						splitChar = ' ';
					}
					else{
						tempListItems.push(theListStr);
					}

					if(!isNaN(theListItem)){
						theListItem = tempListItems[parseInt(theListItem)];
					}

					theListStr = theListStr.replace(theListItem, '').replace(splitChar + splitChar, splitChar);
					if(theListStr[0] == splitChar){theListStr = theListStr.substr(1)}
					if(theListStr[theListStr.length - 1] == splitChar){theListStr = theListStr.substr(0, theListStr.length - 1)}

					$scope.set('removeListItem', '');
					$scope.set('theList', theListStr);
					adjustSelectedItem();
					$timeout(function(){adjustSelectedItem();});
				}
			}
			else if(eventData.slotName == 'addListItem'){
				if(eventData.slotValue != ''){
					var theListStr = $scope.gimme('theList');
					var splitChar = ';';

					if(theListStr.search(',') != -1){ splitChar = ','; }
					else if(theListStr.search(' ') != -1){ splitChar = ' '; }

					theListStr += (splitChar + eventData.slotValue);

					$scope.set('addListItem', '');

					if(fxList != undefined){ stroll.unbind(fxList); }
					$scope.set('theList', theListStr);
					if($scope.gimme('theListType') == 6){
						$timeout(function(){fxList = $scope.theView.parent().find("#fxList ul"); stroll.bind(fxList);});
					}
					adjustSelectedItem();
				}
			}
			else if(eventData.slotName == 'insertListItem'){
				if(eventData.slotValue != ''){
					var theIndex = parseInt($scope.gimme('theSelectedIndex'));
					var newListStr = '';
					if(isNaN(theIndex)){ theIndex = 0; }

					if($scope.theList.items.length > theIndex){
						var theListStr = $scope.gimme('theList');
						var splitChar = ';';

						if(theListStr.search(',') != -1){ splitChar = ','; }
						else if(theListStr.search(' ') != -1){ splitChar = ' '; }

						$scope.theList.items.splice(theIndex, 0, eventData.slotValue);

						for(var i = 0; i < $scope.theList.items.length; i++){
							if(i > 0){ newListStr += splitChar }
							newListStr += $scope.theList.items[i];
						}
					}

					$scope.set('insertListItem', '');

					if(newListStr != ''){
						if(fxList != undefined){ stroll.unbind(fxList); }
						$scope.set('theList', newListStr);
						if($scope.gimme('theListType') == 6){
							$timeout(function(){fxList = $scope.theView.parent().find("#fxList ul"); stroll.bind(fxList);});
						}
						adjustSelectedItem();
					}
				}
			}
			else if(eventData.slotName == 'sortListEnabled'){
				updateList($scope.gimme('theList'));
			}
		});

        $scope.addSlot(new Slot('theList',
            'One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty Twentyone Twentytwo Twentythree Twentyfour Twentyfive Twentysix Twentyseven Twentyeight Twentynine Thirty Thirtyone Thirtytwo Thirtythree Thirtyfour Thirtyfive Thirtysix Thirtyseven Thirtyeight Thirtynine Forty Fortyone Fortytwo Fortythree Fortyfour Fortyfive Fortysix Fortyseven Fortyeight Fortynine Fifty Fiftyone Fiftytwo Fiftythree Fiftyfour Fiftyfive Fiftysix Fiftyseven Fiftyeight Fiftynine Sixty Sixtyone Sixtytwo Sixtythree Sixtyfour Sixtyfive Sixtysix Sixtyseven Sixtyeight Sixtynine Seventy Seventyone Seventytwo Seventythree Seventyfour Seventyfive Seventysix Seventyseven Seventyeight Seventynine Eighty Eightyone Eightytwo Eightythree Eightyfour Eightyfive Eightysix Eightyseven Eightyeight Eightynine Ninety Ninetyone Ninetytwo Ninetythree Ninetyfour Ninetyfive Ninetysix Ninetyseven Ninetyeight Ninetynine',
            'The List Items',
            'The items of the list (separated by either comma[,], semicolon[;] or space [ ].',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('theSelectedIndex',
            -1,
            'The Selected Index',
            'The index of the selected item of the list (-1 = none slected, -2 = multiple selected)',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('theSelectedIndex').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('theSelectedName',
            '',
            'The Selected Name',
            'The name of the selected item of the list',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('theSelectedName').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('listLength',
			0,
			'List Length',
			'The amount of items in the list',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('listLength').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('theListType',
			6,
			'The Display Type',
			'The type of way the list is being displayed',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Undefined', 'Drop Down Box', 'Radio Buttons', 'Multi Select List Box', 'Check Boxes', 'Classic List', 'FX List']},
			undefined
		));

        $scope.addSlot(new Slot('fxListEffect',
            'twirl',
            'FX List Effect',
            'The effect that will be used when scrolling the fx list. (These CSS Effects was provided by Hakim El Hattab [ @hakimel ])',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['none', 'cards', 'curl', 'fan', 'flip', 'fly', 'fly-reverse', 'fly-simplified', 'grow', 'helix', 'papercut', 'skew', 'tilt', 'twirl', 'wave', 'zipper']},
            undefined
        ));

		$scope.addSlot(new Slot('sortListEnabled',
			false,
			'Sort List Enabled',
			'If checked the list will always be sorted in alphabetic order',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.addSlot(new Slot('theListDirection',
            0,
            'The Display Direction',
            'The direction which the list items are displayed (available only for radio and checkbox), vertically or horizontally',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Vertical', 'Horizontal']},
            undefined
        ));

        $scope.addSlot(new Slot('theListContainerHeight',
            '300px',
            'The List Display Height',
            'The height of the list to be displayed, [auto] means the height is as long as the list, any size will clip (hide) the part of the list that overflow',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('theListContainerWidth',
            '200px',
            'The List Display Width',
            'The width of the list to be displayed, [auto] means the width is as long as the longest item, any size will clip (hide) the part of the list that overflow',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('multiSelectListSize',
            5,
            'Multi Select List Height',
            'The number of visible items in the multi select list',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('theListItemMarkerStyle',
            'disc',
            'Item Marker Type',
            'When using Classic list, each list item will be marked with a symbol or number, this slot gives you the possibility to change that.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['none', 'disc', 'armenian', 'circle', 'cjk-ideographic', 'decimal', 'decimal-leading-zero', 'georgian', 'hebrew', 'hiragana', 'hiragana-iroha', 'katakana', 'katakana-iroha', 'lower-alpha', 'lower-greek', 'lower-latin', 'lower-roman', 'square', 'upper-alpha', 'upper-latin', 'upper-roman']},
            undefined
        ));

        $scope.addSlot(new Slot('theListItemMarkerImage',
            'disc',
            'Item Marker Image',
            'When using Classic list, each list item will be marked with a symbol or number, one can even use a custom image by setting this slot.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ImagePick},
            undefined
        ));

        $scope.addSlot(new Slot('theListBackgroundColor',
            '#a4a4a4',
            'List Background Color',
            'The background color of the list (not items or the outside padding).',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('oddItemBkgColor',
            '#ffffff',
            'Odd Item Background Color',
            'The background color of every odd item in the itemized or FX list.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('evenItemBkgColor',
            '#d0d0d0',
            'Even Item Background Color',
            'The background color of every even item in the itemized or FX list.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('selectedItemBkgColor',
            '#fed1f5',
            'Selected Item Background Color',
            'The background color of the current selected item',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('itemPadding',
          '10px',
          'List Item Padding',
          'The size of the space surrounding each list item',
          $scope.theWblMetadata['templateid'],
          {inputType: Enum.aopInputTypes.Numeral},
          undefined
        ));

		$scope.addSlot(new Slot('removeListItem',
			'',
			'List Item to Be removed',
			'The name or the index number of a list item to be removed from the list',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextBox},
			undefined
		));

		$scope.addSlot(new Slot('addListItem',
			'',
			'List Item to Be added',
			'The name of an item being added at the end of the list',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextBox},
			undefined
		));

		$scope.addSlot(new Slot('insertListItem',
			'',
			'List Item to Be inserted',
			'The name of an item being inserted at the current selected position. (at the beginning if no item is selected)',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextBox},
			undefined
		));

        $scope.setDefaultSlot('theSelectedName');

        if(BrowserDetect.browser == 'Firefox'){
            $scope.theView.parent().draggable('option', 'cancel', '#listContainer');
        }

		$scope.$watch(function(){return $scope.theList.currentSelected;}, function(newVal, oldVal) {
			if(newVal != oldVal && !selectChangeBlocked){
				selectChangeBlocked = true;
				$timeout(function(){selectChangeBlocked = false;}, 100);
				$scope.set('theSelectedName', newVal);
				var count = 0;
				for(var i = 0; i < $scope.theList.items.length; i++){
					if($scope.theList.items[i] == newVal){
						$scope.set('theSelectedIndex', i);
						count++;
					}
				}
				if(count > 1 || (newVal != '' && count == 0)){
					$scope.set('theSelectedIndex', -2);
				}
				if(newVal == ''){
					$scope.set('theSelectedIndex', -1);
				}
			}
		}, true);

		$timeout(function(){$scope.selectAnItem($scope.gimme('theSelectedIndex'));});
    };
    //===================================================================================


    //========================================================================================
    // Update List
    // Redraws the list according to current setup.
    //========================================================================================
    var updateList = function(newVal){
        if(newVal.search){
            $scope.theList.items = [];
            var workList = [];
            if(newVal.search(';') != -1){
                workList = newVal.split(';');
            }
            else if(newVal.search(',') != -1){
                workList = newVal.split(',');
            }
            else if(newVal.search(' ') != -1){
                workList = newVal.split(' ');
            }
            else{
                workList.push(newVal);
            }

            if(workList.length > 0){
                for(var i = 0; i < workList.length; i++){
                    $scope.theList.items.push(workList[i]);
                }
            }
            else{
                $scope.theList.currentSelected = '';
            }

            if($scope.gimme('theSelectedName') != ''){
                $scope.theList.currentSelected = $scope.gimme('theSelectedName');
            }
        }
        else if($.isArray(newVal)){
            $scope.theList.items = [];
            for(var i = 0; i < newVal.length; i++){
                $scope.theList.items.push(newVal[i]);
            }
        }

		if($scope.gimme('sortListEnabled') == true){
			$scope.theList.items.sort();
		}

		if(newVal == ""){
			$scope.set('listLength', 0);
		}
		else{
			$scope.set('listLength', $scope.theList.items.length);
		}
    };
    //========================================================================================


    //========================================================================================
    // Toggle Multi Check Box Selection
    // Toggles the prop item value correctly due to the multi checkbox selections.
    //========================================================================================
    $scope.toggleMultiCheckBoxSelection = function(cbName) {
        if(!$.isArray($scope.theList.currentSelected)){
            $scope.theList.currentSelected = [$scope.theList.currentSelected];
        }
        var idx = $scope.theList.currentSelected.indexOf(cbName);

        // is currently selected
        if (idx > -1) {
            $scope.theList.currentSelected.splice(idx, 1);
        }

        // is newly selected
        else {
            $scope.theList.currentSelected.push(cbName);
        }
    };
    //========================================================================================


	//========================================================================================
	// Adjust Selected Item
	// Make sure that the current selected index and name are the same after list change
	//========================================================================================
	var adjustSelectedItem = function() {
		var currIndex = $scope.gimme('theSelectedIndex');
		if(currIndex != -2){
			selectChangeBlocked = true;
			$timeout(function(){selectChangeBlocked = false;}, 100);
			if(currIndex < $scope.theList.items.length){
				$scope.theList.currentSelected = $scope.theList.items[currIndex];
				$scope.set('theSelectedName', $scope.theList.currentSelected);
			}
			else{
				$scope.set('theSelectedIndex', -1);
				$scope.theList.currentSelected = '';
				$scope.set('theSelectedName', '');
			}
		}
	};
	//========================================================================================


    //========================================================================================
    // Select an Item
    // Make the clicked item selected
    //========================================================================================
    $scope.selectAnItem = function(index) {
        $scope.theList.currentSelected =  $scope.theList.items[index];
    };
    //========================================================================================


    //========================================================================================
    // Select an Item
    // Make the clicked item selected
    //========================================================================================
    $scope.getItemBkgColor = function(index) {
      var value = $scope.theList.items[index];
      var isOdd = index % 2;
      if($scope.theList.currentSelected == value){
          return $scope.gimme('selectedItemBkgColor');
      }
      else if(isOdd){
          return $scope.gimme('oddItemBkgColor');
      }
      else{
          return $scope.gimme('evenItemBkgColor');
      }
    };
    //========================================================================================




    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
