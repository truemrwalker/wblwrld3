//====================================================================================================================
// Directives for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//====================================================================================================================

// AngularJS Directives are powerful and very useful, but is never necessary. This file can be completely excluded in
// the final template. But if you have them and use them it is here where you put them.
// Remember to bind them to the wblwrld3App module to work properly as seen below in the example.

//=======================================================================================

wblwrld3App.directive('dataDraggable', function() {
    return {
        link: function(scope, element, attrs) {
	    console.log("linking draggable element");
	    
	    element.draggable = true;

            element.draggable({
		helper:"clone"
	    });

	    element.mouseenter(function(event){
                element.find('#li').css('font-style', 'italic');
            });
	    
            element.mouseleave(function(event){
                element.find('#li').css('font-style', 'normal ');
            });
        }
    };
});

wblwrld3App.directive('dataDroppable', function() {
    return {
        link: function(scope, element, attrs) {
            element.droppable({
		drop: function(e, ui){
		    console.log("dropped item is: '" + ui.draggable.attr('id') + "'");
		}
	    });
	}
    };
});

//====================================================================================================================
