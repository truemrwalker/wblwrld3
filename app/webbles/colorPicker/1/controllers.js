//======================================================================================================================
// Controllers for Color Picker for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('cpCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        cpContainer: ['background-color', 'border', 'padding']
    };

    $scope.cpParams = {
        color: '#ff0000'
    };


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        $scope.addSlot(new Slot('color',
            $scope.cpParams.color,
            'Color',
            'The color currently selected',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('isDisabled',
            false,
            'Is Disabled',
            'Weather the color picker is disabled or not',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('colorTxtVisble',
            true,
            'Color Text Visible',
            'If the color string should be visible or not',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.setDefaultSlot('color');

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			$scope.cpParams.color = eventData.slotValue;
		}, undefined, 'color');

        $scope.$watch(function(){return $scope.cpParams.color;}, function(newVal, oldVal) {
            $scope.set('color', newVal);
        }, true);
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
