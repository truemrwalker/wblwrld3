//====================================================================================================================
// Directives for Media Player Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
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
wblwrld3App.directive('reSizableMediaView', function() {
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
					scope.set('mediaWidth', scope.gimme('mediaWidth') + (event.clientX - theLastPos_.x));
					theLastPos_ = {x: event.clientX, y: event.clientY};
				});

				event.stopPropagation();
			});
		}
	};
});
//=======================================================================================

//====================================================================================================================
