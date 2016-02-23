//====================================================================================================================
// Directives for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: truemrwalker
//====================================================================================================================

//=======================================================================================
// FUNDAMENTAL MOUSE HOVER REACTION DIRECTIVE
// This Directive makes the target react on mouse enter and then find its id defined
// child and makes its font style italic, and reverse when mouse leave.
//=======================================================================================
wblwrld3App.directive('fundamentalMouseHoverReaction', function() {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            element.mouseenter(function(event){
                element.find('#squareTxt').css('font-style', 'italic');
            });

            element.mouseleave(function(event){
                element.find('#squareTxt').css('font-style', 'normal ');
            });
        }
    };
});
//=======================================================================================

//====================================================================================================================
