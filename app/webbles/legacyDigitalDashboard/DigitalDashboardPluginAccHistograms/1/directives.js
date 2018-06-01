//====================================================================================================================
// Directives for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//====================================================================================================================

// AngularJS Directives are powerful and very useful, but is never necessary. This file can be completely excluded in
// the final template. But if you have them and use them it is here where you put them.
// Remember to bind them to the wblwrld3App module to work properly as seen below in the example.

//EXAMPLE DIRECTIVE
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
                element.find('#EventTxt').css('font-style', 'italic');
            });

            element.mouseleave(function(event){
                element.find('#EventTxt').css('font-style', 'normal ');
            });
        }
    };
});
//=======================================================================================

//====================================================================================================================
