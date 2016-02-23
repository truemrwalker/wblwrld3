//======================================================================================================================
// Controllers for RANDOMIZER WEBBLE for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// RANDOMIZER WEBBLE CONTROLLER
// This is the Main controller for the RANDOMIZER Webble Template
//=======================================================================================
wblwrld3App.controller('randomizerWebbleCtrl', function($scope, $log, Slot, Enum, gettext) {

    //=== PROPERTIES ====================================================================



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
        $scope.addSlot(new Slot('randomNumber',
            0,
            'Random Number',
            'The current generated random number',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('randomMax',
            100,
            'Max Random ValueNumber',
            'The maximum value the random number can have',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('randomMin',
            0,
            'Min Random ValueNumber',
            'The minimum value the random number can have',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('randomGeneratorTrigger',
            false,
            'Trigger New Randomization',
            'When set to true this will trigger the random value to re-generate',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.setDefaultSlot('randomNumber');

		//if double clicked un-select
        $scope.theView.find('#theRandBtn').bind('dblclick', function(event, ui){
            $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
            event.stopPropagation();
        });

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'randomGeneratorTrigger'){
				if(newVal == true){
					$scope.randomize();
					$scope.set('randomGeneratorTrigger', false);
				}
			}
			else if(eventData.slotName == 'randomMax'){
				if(newVal < parseInt($scope.gimme('randomNumber'))){
					$scope.set('randomNumber', newVal);
				}
			}
			else if(eventData.slotName == 'randomMin'){
				if(newVal > parseInt($scope.gimme('randomNumber'))){
					$scope.set('randomNumber', newVal);
				}
			}
		});
    };
    //===================================================================================


    //========================================================================================
    // Randomize
    // create a random number within max and min value
    //========================================================================================
    $scope.randomize = function(){
        $scope.set('randomNumber', Math.floor(Math.random() * (parseInt($scope.gimme('randomMax')) + 1)));
    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//======================================================================================================================
