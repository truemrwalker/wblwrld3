//======================================================================================================================
// Controllers for SLIDER Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// SLIDER WEBBLE CONTROLLER
// This is the Main controller for the Slider Webble Template
//=======================================================================================
wblwrld3App.controller('sliderWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.data = {
        currVal: 50
    };

    $scope.stylesToSlots = {
        sliderGrabber: ['background-color', 'border', 'padding', 'width', 'height']
    };

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

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			var nv = parseFloat(newVal);
			if(!isNaN(nv) && nv != $scope.data.currVal){
				$scope.data.currVal = nv;
			}
		}, undefined, 'currentValue');

        $scope.addSlot(new Slot('minValue',
            0,
            'Min Value',
            'The lowest value to select',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('maxValue',
            100,
            'Max Value',
            'The Highest value to select',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('stepValue',
            1,
            'Step Value',
            'the size of each step of the slider',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('currentValue',
            $scope.data.currVal,
            'Current Value',
            'The currently selected value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.setDefaultSlot('currentValue');
        $scope.setResizeSlots('sliderGrabber:width', 'sliderGrabber:height');

        $scope.$watch(function(){return $scope.data.currVal;}, function(newVal, oldVal) {
            var nv = parseFloat(newVal);
            if(!isNaN(nv)){
                $scope.set('currentValue', nv);
            }
        }, true);
    };
    //===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//======================================================================================================================
