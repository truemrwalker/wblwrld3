//====================================================================================================================
// Directives for Digital Dashboard Smart Data Source for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//====================================================================================================================


//=======================================================================================
// DATA DRAGGABLE
// This Directive makes it possible to drag data fields from this Webble in order
// to drop it onto various dashboard plugins.
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
//=======================================================================================


//=======================================================================================
// DATA DROPPABLE
// This Directive makes it possible to drop data files onto this Webble in order
// to load new data.
//=======================================================================================
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
//=======================================================================================

//====================================================================================================================
