//====================================================================================================================
// Directives for Window Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//====================================================================================================================

//=======================================================================================
// Windows Webble Resizing
// This directive is specified to create event handlers for the mouse in order to let us
// resize the width and height of the Webble.
//=======================================================================================
wblwrld3App.directive('winWblReSizing', function($log) {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            var theLastPos_ = {x: 0, y: 0};

            element.on('mousedown', function(event) {
                theLastPos_ = {x: event.clientX, y: event.clientY};

                scope.getPlatformElement().mouseup(function(event){
                    scope.getPlatformElement().unbind('mousemove');
                    scope.getPlatformElement().unbind('mouseup');
                    if(!scope.$$phase){ scope.$apply(); }
                });

                scope.getPlatformElement().mousemove(function(event){
                    var newWidth = parseInt(scope.gimme('windowContainer:width')) + (event.clientX - theLastPos_.x);
                    var newHeight = parseInt(scope.gimme('windowContainer:height')) + (event.clientY - theLastPos_.y);
                    scope.set('windowContainer:width', newWidth);
                    scope.set('windowContainer:height', newHeight);

                    var titleBarHeight = 20;
                    if(!scope.gimme('titleBarVisible')){
                        var titleBarHeight = 0;
                    }
                    element.parent().find('#winTitleBar').css('width', newWidth + 'px');
                    var winBrdr = element.parent().find('#winBorder');
                    winBrdr.css('width', newWidth + 'px');
                    winBrdr.css('height', (newHeight - titleBarHeight) + 'px');

                    theLastPos_ = {x: event.clientX, y: event.clientY};
                });

                event.stopPropagation();
            });
        }
    };
});
//=======================================================================================


//=======================================================================================
// Windows Webble Resizing
// This directive is specified to create event handlers for the mouse in order to let us
// resize the width and height of the Webble.
//=======================================================================================
wblwrld3App.directive('childGrabbing', function($log, $timeout) {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {

            element.droppable({
                accept: ".webble",
                drop: function( event, ui ) {
                    if(scope.gimme('grabDropped')){
                        $timeout(function(){ ui.draggable.scope().wblStateFlags.pasteByUser = true; ui.draggable.scope().paste(scope.theView);}, 200);
                    }
                }
            });
        }
    };
});
//=======================================================================================

//====================================================================================================================
