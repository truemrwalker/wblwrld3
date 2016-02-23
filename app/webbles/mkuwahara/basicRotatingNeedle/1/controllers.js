//======================================================================================================================
// Controllers for Rotating Needle Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// ROTATING NEEDLE WEBBLE CONTROLLER
// This is the Main controller for the Rotating Needle Webble  Template
//=======================================================================================
wblwrld3App.controller('needleWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.needle = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
    };

    $scope.svgContainer = {
        width: 200,
        height: 200
    };

    $scope.stylesToSlots = {
        needleContainer: ['background-color', 'border', 'transform-rotate'],
        theNeedle: ['stroke', 'stroke-width']
    };




    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'needleLength'){
				if(!isNaN(newVal)){
					$scope.needle.x1 = newVal;
					$scope.needle.y1 = newVal;
					$scope.needle.x2 = newVal;
					$scope.needle.y2 = 0;

					var theModVal = newVal * 2;
					$scope.svgContainer.width = theModVal;
					$scope.svgContainer.height = theModVal;
				}
			}
			else if(eventData.slotName == 'angleDivider' || eventData.slotName == 'inputValue'){
				newVal = {ad: $scope.gimme('angleDivider'), iv: $scope.gimme('inputValue')};
				if(!isNaN(newVal.ad) && !isNaN(newVal.iv) && newVal.ad > 0){
					var newAngle = parseInt((360 / newVal.ad) * newVal.iv);
					if(newAngle > 360){
						newAngle = newAngle % 360;
					}
					$scope.set('needleContainer:transform-rotate', newAngle);
				}
			}
			else if(eventData.slotName == 'needleContainer:transform-rotate'){
				if(!isNaN(newVal)){
					if(newVal > 360){
						newVal = newVal % 360;
					}
					var possNewIV = (newVal / 360) * parseInt($scope.gimme('angleDivider'));
					if(parseFloat($scope.gimme('inputValue')).toFixed(2) != possNewIV.toFixed(2)){
						$scope.set('inputValue', possNewIV);
					}
				}
			}
		});

        $scope.addSlot(new Slot('needleLength',
            100,
            'Needle Length',
            'The length of the needle (in pixels)',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('inputValue',
            0,
            'Input Value',
            'The value which will be used by the needle after modified by the angle divider in order to determine the needle angle',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('inputValue').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('angleDivider',
            360,
            'Angle Divider',
            'The modifier that will adjust the input value so that it may be represented on a 360 degree scale',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.setDefaultSlot('inputValue');
        $scope.setRotateSlot('needleContainer:transform-rotate');
    };
    //===================================================================================



    //=== CTRL MAIN CODE ======================================================================
});
//======================================================================================================================
