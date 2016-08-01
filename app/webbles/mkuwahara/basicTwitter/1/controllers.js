//======================================================================================================================
// Controllers for Basic Twitter Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('twitterWblCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        twitterContainer: ['width', 'height', 'background-color', 'border', 'padding']
    };

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

        $scope.setResizeSlots('twitterContainer:width', 'twitterContainer:height');

        $scope.$watch(function(){return $scope.gimme('widgetID');}, function(newVal, oldVal) {
            updateTwitterFeed(newVal);
        }, true);

        $($scope.theView.parent().find("#ioContainer").children()[2]).bind('mouseup', onMouseUp);
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
    };
    //========================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
