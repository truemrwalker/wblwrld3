//======================================================================================================================
// Controllers for Basic Twitter Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
function twitterWblCtrl($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        twitterContainer: ['width', 'height', 'background-color', 'border', 'padding']
    };

    //TODO: Array of custom menu item keys and display names
    //$scope.customMenu = [{itemId: '[MENU ITEM ID]', itemTxt: '[MENU ITEM DISPLAY TEXT]'}];
    // EXAMPLE:

    //TODO: Array of customized Interaction Balls
    //$scope.customInteractionBalls = [{index: [POSITION INDEX 0-11], name: '[IDENTIFIER]', tooltipTxt: '[DISPLAY TEXT]'}];
    // EXAMPLE:


    var twitterContainer;



    //=== EVENT HANDLERS ================================================================
    var onMouseUp = function(e){
        if(e.which === 1){
            var w = parseInt($scope.gimme('twitterContainer:width'));
            var p = parseInt($scope.gimme('twitterContainer:padding'));
            var p2 = p * 2;
            if(w > (520 + p2)){
                var newWP = ((w - 520) / 2);
                $scope.set('twitterContainer:padding', p + 'px ' + newWP + 'px ' + p + 'px ' + newWP + 'px');
            }
            else{
                $scope.set('twitterContainer:padding', p + 'px');
            }
            updateTwitterFeed($scope.gimme('widgetID'));
        }
    };

    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        twitterContainer = $scope.theView.parent().find("#twitterContainer");

        $scope.addSlot(new Slot('widgetID',
            "471867655654084609",
            'Twitter Widget Id',
            'The Id of the Twitter Widget you want to display',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        //$scope.setDefaultSlot('widgetID');

        $scope.setResizeSlots('twitterContainer:width', 'twitterContainer:height');

        //TODO: Set template specific child container for clipping effects etc... default container is within the core Webble.
        // EXAMPLE: $scope.setChildContainer([ELEMENT])

        $scope.$watch(function(){return $scope.gimme('widgetID');}, function(newVal, oldVal) {
            updateTwitterFeed(newVal);
        }, true);

        $($scope.theView.parent().find("#ioContainer").children()[2]).bind('mouseup', onMouseUp);
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



    //========================================================================================
    // Update Twitter Feed
    //========================================================================================
    var updateTwitterFeed = function(widId){
        var paddVal = parseInt($scope.gimme('twitterContainer:padding')) * 2;
        twitterContainer.html('');
        twitterContainer.html('<a class="twitter-timeline" data-widget-id="' + widId + '" width="' + (parseInt($scope.gimme('twitterContainer:width')) - paddVal) + '" height="' + (parseInt($scope.gimme('twitterContainer:height')) - paddVal) + '">Loading Tweets...</a>');
        twttr.widgets.load(twitterContainer[0]);
    }
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

}
//=======================================================================================