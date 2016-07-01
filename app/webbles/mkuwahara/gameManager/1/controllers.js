//======================================================================================================================
// Controllers for Game Manager Webble for Webble World v3.0 (2013)
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
wblwrld3App.controller('gameManagerCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		gameManagerContainer: ['width', 'height', 'background-color', 'border', 'border-radius']
    };

    //$scope.customMenu = [{itemId: 'eat', itemTxt: 'Have Lunch'}, {itemId: 'drink', itemTxt: 'Have refreshment'}];

    //$scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];

    //WebFont.load({
    //    google: { families: [ 'Ewert::latin', 'Freckle+Face::latin' ] }
    //});

    //var internalFilesPath;


    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
          //internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

        $scope.addSlot(new Slot('msg',
            "gamemanager",
            'Message',
            'Text displayed on the Webble',
            $scope.theWblMetadata['templateid'],
            undefined,                                  // Metadata... an object that may contain whatever or just be
                                                        // left undefined.
                                                        // Besides any custom data, the following content makes sense to
                                                        // a Webble:
                                                        // {inputType: Enum.aopInputTypes.[INPUT TYPE]}  //See Services for details for options
                                                        // {noFloatValRound: true}  // stops rounding long floats in property form
                                                        // {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an integer (index)
                                                        // {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
                                                        // {inputType: Enum.aopInputTypes.RadioButton, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
                                                        // {inputType: Enum.aopInputTypes.MultiListBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
                                                        // {inputType: Enum.aopInputTypes.MultiCheckBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
                                                        // {inputType: Enum.aopInputTypes.Slider, sliderMinMax: [0, 100]}
                                                        // {inputType: Enum.aopInputTypes.DatePick}  // slot value is date filtered: $filter('date')(new Date(), 'yyyy-MM-dd');
                                                        // If not set the Property form will make a pretty good guess
                                                        // instead, which in most cases are more than enough.
            undefined
        ));

		//$scope.getSlot('squareTxt:font-family').setMetaData({comboBoxContent: [ 'ewert', 'freckle face' ]});
		//$scope.setDefaultSlot('msg');

		//$scope.setResizeSlots('square:width', 'square:height');

		//$scope.setChildContainer([ELEMENT])

		//$scope.theView.parent().draggable('option', 'cancel', '#squareTxt');
        //$scope.theView.parent().find('#squareTxt').bind('contextmenu',function(){ return false; });
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
        var targetName = $(event.target).scope().getName();

        if (targetName != ""){
            //=== [TARGET NAME] ====================================
            //if (targetName == $scope.customInteractionBalls[0].name){
            //    [CODE FOR MOUSE DOWN]
            //    $scope.theView.mouseup(function(event){
            //        [CODE FOR MOUSE UP]
            //    });
            //    $scope.theView.mousemove(function(event){
            //        [CODE FOR MOUSE MOVE]
            //    });
            //}
            //=============================================

            //=== Jump ====================================
            // EXAMPLE:
            //if (targetName == $scope.customInteractionBalls[0].name){ //jump
            //    $scope.set('root:left', 0);
            //    $scope.set('root:top', 0);
            //}
            //=============================================
        }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
        //if(itemName == $scope.customMenu[0].itemId){  //[CUSTOM ITEM NAME]
        //    [CODE FOR THIS MENU ITEM GOES HERE]
        //}

        // EXAMPLE:
        //if(itemName == $scope.customMenu[0].itemId){  //eat
        //    $log.log('Are you hungry?');
        //}
        //else if(itemName == $scope.customMenu[1].itemId){  //drink
        //    $log.log('Are you thirsty?')
        //}
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
        var customWblDefPart = {

        };

        return customWblDefPart;
    };
    //===================================================================================


    // TODO: POSSIBLE ADDITIONAL CUSTOM METHODS
    //========================================================================================
    // Custom template specific methods is very likely to be quite a few of in every Webble,
    // and they contain what ever the developer want them to contain.
    //========================================================================================
    // "Public" (accessible outside this controller)
//    $scope.[CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
//        [CUSTOM CODE HERE]
//    }

    // "Private" (accessible only inside this controller)
//    var [CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
//        [CUSTOM CODE HERE]
//    }
    //========================================================================================


    // TODO: POSSIBLE OVERRIDING WEBBLE CORE METHODS WITH CUSTOM PARTS
    //========================================================================================
    // In 99% of all Webble development there is probably no need to insert custom code inside
    // a Webble core function or in any way override Webble core behavior, but the possibility
    // exists as shown below if special circumstance and needs arise.
    //========================================================================================
//    $scope.[NEW METHOD NAME] = $scope.$parent.[PARENT METHOD]   //Assign the Webble core method to a template method caller
//
//    $scope.$parent.[PARENT METHOD] = function([PARAMETERS]){    //Assign a new custom method to th Webble Core
//        [CUSTOM CODE HERE]
//
//        $scope.[NEW METHOD NAME]();                             //Call the original function, in order to not break expected behavior
//
//        [MORE CUSTOM CODE HERE]
//    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
