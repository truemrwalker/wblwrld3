//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================
wblwrld3App.controller('fundamentalWebbleCtrl', function($scope, $log, $timeout, Enum, Slot, gettext) {
//=======================================================================================
// FUNDAMENTAL WEBBLE CONTROLLER
// This is the Main controller for the Fundamental Webble Template
//=======================================================================================


	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		square: ['width', 'height', 'background-color', 'border', 'border-radius'],
		squareTxt: ['font-size', 'color', 'font-family']
	};

	WebFont.load({
		google: { families: [ 'Ewert::latin', 'Freckle+Face::latin' ] }
	});



	//=== EVENT HANDLERS ================================================================


	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		$scope.addSlot(new Slot('msg',
			gettext("Hello Webble"),
			'Message',
			'Text displayed on the Webble',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.getSlot('squareTxt:font-family').setMetaData({comboBoxContent: [ 'ewert', 'freckle face' ]});

		$scope.setDefaultSlot('msg');
	};
	//===================================================================================

});
//======================================================================================================================

