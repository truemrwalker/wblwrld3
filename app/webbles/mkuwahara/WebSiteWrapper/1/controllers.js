//======================================================================================================================
// Controllers for Web Site Wrapper for Webble World v3.0 (2013)
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
wblwrld3App.controller('WebContentWrapperCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        wcwGrabber: ['background-color', 'border', 'margin', 'width', 'height'],
        webContentContainer: ['overflow-x', 'overflow-y'],
        HTMLTxtContainer: ['overflow-x', 'overflow-y']
    };

    var browser = BrowserDetect.browser;
    var HTMLTxtContainer, webContentContainer;

    //=== EVENT HANDLERS ================================================================

    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        if(browser == 'Firefox'){
          $('#webContentContainer').attr('sandbox', 'allow-same-origin allow-top-navigation allow-forms allow-scripts');
        }

        HTMLTxtContainer = $scope.theView.parent().find('#HTMLTxtContainer');
        webContentContainer = $scope.theView.parent().find('#webContentContainer');

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotValue != ''){
				HTMLTxtContainer[0].innerHTML = eventData.slotValue;
			}
		}, undefined, 'htmlStr');

        $scope.addSlot(new Slot('theSrc',
            '//www.youtube.com/embed/xa3cZnfOtE0',
            'URL',
            'the web address to the web content we are looking for.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('htmlStr',
            '',
            'HTML String',
            'A text with HTML tags, that will displayed formatted correctly.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.setDefaultSlot('theSrc');
        $scope.setResizeSlots('wcwGrabber:width', 'wcwGrabber:height');

        if(browser == 'Firefox'){
          $scope.theView.parent().draggable('option', 'cancel', '#HTMLTxtContainer');
        }

		$scope.$watch(function(){return $scope.gimme('wcwGrabber:width');}, function(newVal, oldVal) {
			var w = parseInt(newVal);
			if(!isNaN(w)){
				webContentContainer.css('width', w-25);
				HTMLTxtContainer.css('width', w-25);
			}
		}, true);


		$scope.$watch(function(){return $scope.gimme('wcwGrabber:height');}, function(newVal, oldVal) {
			var h = parseInt(newVal);
			if(!isNaN(h)){
				if($scope.gimme('htmlStr') != '' && $scope.gimme('theSrc') != ''){
					h = (h - 25) / 2;
				}
				else{
					h = h - 25;
				}
				webContentContainer.css('height', h);
				HTMLTxtContainer.css('height', h);
			}
		}, true);

        $scope.set('HTMLTxtContainer:overflow-x', 'auto');
        $scope.set('HTMLTxtContainer:overflow-y', 'auto');
    };
    //===================================================================================



  //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================


