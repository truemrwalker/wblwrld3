//======================================================================================================================
// Controllers for Hands-on-Portal Support for Webble World v3.0 (2013)
// Created By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('HoPSupportCarrierCtrl', function($scope, $log, Slot, Enum, $location, $timeout) {

    //=== PROPERTIES ====================================================================
	var inPortal;

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		var url = (window.location != window.parent.location) ? document.referrer : document.location;
		$log.log("I believe we are on URL: " + url);
		var urlLower = url.toString().toLowerCase();
		inPortal = false;

		if(urlLower.indexOf("/wiki/") >= 0 || urlLower.indexOf(":7447") >= 0) {
			inPortal = true;
		}
		$log.log("In Portal: " + inPortal);

		if(inPortal) {
			$scope.setExecutionMode(1);
			$scope.setMWPVisibility(false);
			$scope.setVCVVisibility(false);
			$scope.setMenuModeEnabled(false);
		}

		$scope.set("root:opacity", 0.2);
    };
    //===================================================================================


	//===================================================================================
	// Is in Portal
	// This method tells if this Webble is loaded inside the Hand on Portal environment
	//===================================================================================
	$scope.isInPortal = function () {
		return inPortal;
	}
	//===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
