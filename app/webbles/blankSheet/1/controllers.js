//======================================================================================================================
// Controllers for Blank Sheet Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
function blankSheetCtrl($scope, $log, Slot, Enum) {
    //=== PROPERTIES ====================================================================
    //TODO: An object with element-id keys holding arrays of css style names that should be converted to slots
    // These slots will be found by the name format '[TEMPLATE ID]_[ELEMENT NAME]:[CSS ATTRIBUTE NAME]'
    //$scope.stylesToSlots = {
    //    [ELEMENT NAME]: ['[CSS ATTRIBUTE NAME]']
    //};
    // EXAMPLE:
    $scope.stylesToSlots = {
		blankSheetContainer: ['background-color', 'border', 'padding']
    };

	var bsContainer, defCC;
	var listOfClasses = [];
	var sheet = (function() {
		var style = document.createElement("style");
		style.appendChild(document.createTextNode(""));
		document.head.appendChild(style);
		return style.sheet;
	})();

    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		bsContainer = $scope.theView.parent().find("#blankSheetContainer");
		defCC = $scope.theView.parent().find("#wblChildContainer");

		$scope.addSlot(new Slot('customHTML',
			"",
			'Custom HTML',
			'Your own custom HTML elements with custom styles etc.',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextArea},
			undefined
		));

        $scope.addSlot(new Slot('customCSSClasses',
            "",
            'Custom CSS Classes',
            'Your own custom CSS Classes to go with your custom HTML',
            $scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

		$scope.addSlot(new Slot('customJS',
			"",
			'Custom JavaScript',
			'Your own custom JavaScript to go with your customized Webble',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextArea},
			undefined
		));

		$scope.addSlot(new Slot('customChildContainerElementName',
			"",
			'Custom Child Container Element Name',
			'If you want Webble children to appear inside one of your custom elements, put the name of that element here',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.$watch(function(){return $scope.gimme('customChildContainerElementName');}, function(newVal, oldVal) {
			setCustomCC(newVal);
        }, true);

		$scope.$watch(function(){return $scope.gimme('customHTML');}, function(newVal, oldVal) {
			if(newVal.search($scope.gimme('customChildContainerElementName')) == -1){
				for(var i = 0, c; c = $scope.getChildren()[i]; i++){
					c.scope().peel();
				}
				$scope.set('customChildContainerElementName', "");
			}

			bsContainer.empty();
			if(newVal != ""){
				$(newVal).appendTo(bsContainer);
				setCustomCC($scope.gimme('customChildContainerElementName'));
			}
		}, true);

		$scope.$watch(function(){return $scope.gimme('customCSSClasses');}, function(newVal, oldVal) {
			for(var i = 0; i < listOfClasses.length; i++){
				sheet.deleteRule(0);
			}
			listOfClasses = [];
			if(newVal != ""){
				listOfClasses = newVal.split('}');
				listOfClasses.pop();

				for(var i = 0; i < listOfClasses.length; i++){
					listOfClasses[i] += '}';
					sheet.insertRule(listOfClasses[i], 0);
				}
			}
		}, true);

		$scope.$watch(function(){return $scope.gimme('customJS');}, function(newVal, oldVal) {
			if(newVal != ""){
				try{
					eval(newVal);
				}
				catch (err){
					$log.log("WRONG!");
				}
			}
		}, true);
    };
    //===================================================================================


	//===================================================================================
	// Set Custom Child Container
	// Sets the child container either to custom or default one
	//===================================================================================
	var setCustomCC = function(whatVal){
		var newCC;
		if(whatVal != ""){
			var testCC = $scope.theView.parent().find("#" + whatVal);
			if(testCC.length == 1){
				newCC = testCC;
			}
			else{
				if($scope.getChildContainer() != defCC){
					newCC = defCC;
				}
			}
		}
		else{
			if($scope.getChildContainer() != defCC){
				newCC = defCC;
			}
		}

		if(newCC){
			$scope.setChildContainer(newCC);
			for(var i = 0, c; c = $scope.getChildren()[i]; i++){
				newCC.append(c.scope().theView.parent());
			}
		}
	};
	//===================================================================================



    //=== CTRL MAIN CODE ======================================================================

}
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
