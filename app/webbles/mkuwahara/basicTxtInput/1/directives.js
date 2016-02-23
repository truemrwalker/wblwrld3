//====================================================================================================================
// Directives for Basic Text Input for Webble World v3.0 (2013)
// Created By: Micke Nicander Kuwahara
//====================================================================================================================

//=======================================================================================
// REWIDEN
// This directive is specified to create event handlers for the mouse in order to let us
// resize the width of a sibling input tag using the element with this attribute as a
// handle.
//=======================================================================================
wblwrld3App.directive('reWiden', function($log) {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            var theLastPos_ = {x: 0, y: 0};

            element.on('mousedown', function(event) {
                theLastPos_ = {x: event.clientX, y: event.clientY};
                var rememberBorderStyle = element.parent().css('border-style');
                element.parent().css('border-style', 'dashed');

                scope.getPlatformElement().mouseup(function(event){
                    scope.getPlatformElement().unbind('mousemove');
                    scope.getPlatformElement().unbind('mouseup');
                    element.parent().css('border-style', rememberBorderStyle);
                    if(!scope.$$phase){ scope.$apply(); }
                });

                scope.getPlatformElement().mousemove(function(event){
                    var target = element.parent().find('input');
                    target.css('width', parseInt(target.css('width').toString().replace('px', '')) + (event.clientX - theLastPos_.x));
                    theLastPos_ = {x: event.clientX, y: event.clientY};
                });

                event.stopPropagation();
            });
        }
    };
});
//=======================================================================================

//====================================================================================================================
