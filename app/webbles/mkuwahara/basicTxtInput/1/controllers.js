//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
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
wblwrld3App.controller('txtInputWblCtrl', function($scope, $log, Slot, Enum, gettext) {

    //=== PROPERTIES ====================================================================
    $scope.defaultMargin = 10;
    $scope.rewiderPos = 200 + $scope.defaultMargin;

    //ng-model values with slot representation
    $scope.theTxt = '';
    $scope.isDisabled = false;

    $scope.stylesToSlots = {
        txtInputGrabber: ['border'],
        txtInput: ['width', 'height', 'color', 'font-weight', 'font-family', 'overflow-y', 'border', 'background-color', 'margin', 'text-align', 'font-size']
    };



    //=== EVENT HANDLERS ================================================================

    //===================================================================================
    // Listens and stores the key code for the latest key pressed
    //===================================================================================
    $scope.keyPressEventHandler = function($event){
        $scope.set('LastKeyPressed', $event.keyCode);
    };
    //===================================================================================


    //===================================================================================
    // Make sure the textbox is selected and can be edited even on ipad and other
    // devices who do not get it otherwise.
    //===================================================================================
    $scope.forceSelect = function($event){
        $scope.theView.parent().find('#txtInput').focus();
    };
    //===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;

			// bind the slot value of the text to the ng-model value of the text and vice versa
			if(eventData.slotName == 'theText'){
				if(newVal != $scope.theTxt){
					$scope.theTxt = newVal;
				}
			}

			// Make sure the readonly slot sets the corresponding ng-model value
			else if(eventData.slotName == 'isDisabled'){
				if(newVal != $scope.isDisabled && (newVal.toString().toLowerCase() == 'true' || newVal.toString().toLowerCase() == 'false')){
					$scope.isDisabled = (newVal.toString().toLowerCase() == 'true');
				}
			}
		});

        $scope.addSlot(new Slot('theText',
            '',
            gettext("The Text"),
            gettext("The Text Content of the input box"),
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('isDisabled',
            $scope.isDisabled,
            gettext("Text Input Is Disabled"),
            gettext("Weather the text can be edited or not"),
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('LastKeyPressed',
            0,
            gettext("Last Key Key-Code"),
            gettext("The Key code for the last key pressed"),
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
      	$scope.getSlot('LastKeyPressed').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.setDefaultSlot('theText');

		// Make sure the re-wider handle is positioned correctly at all time
		$scope.$watch(function(){ return $scope.gimme('txtInput:width');}, function(newVal, oldVal) {
			var newPos = parseInt(newVal) + parseInt($scope.gimme('txtInput:margin'));
			if($scope.rewiderPos != newPos){
				$scope.rewiderPos = newPos;
			}
		}, true);

        $scope.$watch(function(){ return $scope.theTxt;}, function(newVal, oldVal) {
            if(newVal != $scope.gimme('theText') ){
                $scope.set('theText', $scope.theTxt);
            }
        }, true);
    };
    //===================================================================================
});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
