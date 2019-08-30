//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP Fake 3D Visualisation Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizFake3DWebbleCtrl', function($scope, $log, Slot, Enum) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		DrawingArea: ['width', 'height']
	};

	$scope.displayText = "Fake 3D Plot";
	$scope.dataSetName = "";
	var preDebugMsg = "hopVizFake3DPlotWebble: ";

	var myInstanceId = -1;

	var dataMappings = [];
	var dim = [256, 256, 256];

	// graphics
	var bgCanvas = null;
	var bgCtx = null;
	var axesCanvas = null;
	var axesCtx = null;
	var plotCanvas = null;
	var plotCtx = null;
	var dropCanvas = null;
	var dropCtx = null;
	var currentColors = null;
	var textColor = "#000000";
	var hoverText = null;
	var mouseIsOverMe = false;
	var dataName = null;
	var selectionCanvas = null;
	var selectionCtx = null;
	var selectionColors = null;
	var selectionTransparency = 0.9;
	var selectionHolderElement = null;
	var selectionRect = null;
	var selections = []; // the graphical ones

	// layout
	var leftMarg = 20;
	var topMarg = 20;
	var rightMarg = 20;
	var innerMarg = 10;
	var bottomMarg = 5;
	var fontSize = 11;
	var cellWidth = 0;
	var cellW = 0;
	var zoomSpace = 0;
	var useGlobalGradients = false;
	var colorMode = 3; // histogram
	var colorModes = ["Absolute", "Min-Max", "Hot-Cold", "Histogram"];
	var unique = 0;
	var grouping = true;
	var parsingDataNow = false;
	var clickStart = null;
	var skipOutliers = true;
	var outLierStuff = [];
	var noofGroups = 1;
	var drawH = 1;
	var drawW = 1;
	var internalSelectionsInternallySetTo = {};

	var xAxisAxis = 2;
	var yAxisAxis = 1;
	var zAxisAxis = 0;

	var dropData = {'left':leftMarg, 'top':topMarg, 'right':leftMarg+drawW/2-1, 'bottom':topMarg+drawH, "label":"Data", "rotate":false, "forMapping":{'name':'data', 'type':["3Darray"]}};
	var dropZ = {'left':leftMarg+drawW/2+1, 'top':topMarg, 'right':leftMarg+drawW/2+drawW/6-1, 'bottom':topMarg+drawH, "label":"Z", "rotate":false, "forMapping":{'name':'Z', 'type':["number"]}};
	var dropY = {'left':leftMarg+drawW/2+drawW/6+1, 'top':topMarg, 'right':leftMarg+drawW/2+drawW/3-1, 'bottom':topMarg+drawH, "label":"Y", "rotate":false, "forMapping":{'name':'Y', 'type':["number"]}};
	var dropX = {'left':leftMarg+drawW/2+drawW/3+1, 'top':topMarg, 'right':leftMarg+drawW, 'bottom':topMarg+drawH, "label":"X", "rotate":false, "forMapping":{'name':'X', 'type':["number"]}};
	var allDropZones = [dropData,dropZ,dropY,dropX];
	var dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var allDragNames = [dragZone];
	$scope.dragNdropRepr = "Nothing to drag.";
	$scope.dragNdropID = "No drag data.";

	var lastDrawW = null;
	var lastDrawH = null;
	var lastFontSize = null;
	var lastTextColor = null;
	var lastColors = null;
	var lastCellW = null;
	var lastZoomSpace = null;

	var lastXAxisAxis = null;
	var lastYAxisAxis = null;
	var lastZAxisAxis = null;

	var lastColorMode = -1;

	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;
	var lastLastSeenSelectionSeqNo = -1;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		try {
			switch(eventData.slotName) {
				case "ClearData":
					if(eventData.slotValue) {
						$scope.clearData();
						$scope.set("ClearData",false);
					}
					break;
				case "MultipleSelectionsDifferentGroups":
					var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
					if(newGrouping != grouping) {
						grouping = newGrouping;
						updateLocalSelections(false);
					}
					break;
				case "IgnoreExtremeOutliers":
					updateGraphicsHelper(false, true, false);
					break;
				case "DimensionX":
					var xAxisAxisNew = eventData.slotValue;
					if(xAxisAxisNew < 0) {
						xAxisAxisNew = 0;
					}
					if(xAxisAxisNew > 2) {
						xAxisAxisNew = 2;
					}
					if(xAxisAxisNew != xAxisAxis) {
						xAxisAxis = xAxisAxisNew;
						updateGraphicsHelper(false, true, true);
						drawSelections();
					}
					break;
				case "DimensionY":
					var yAxisAxisNew = eventData.slotValue;
					if(yAxisAxisNew < 0) {
						yAxisAxisNew = 0;
					}
					if(yAxisAxisNew > 2) {
						yAxisAxisNew = 2;
					}
					if(yAxisAxisNew != yAxisAxis) {
						yAxisAxis = yAxisAxisNew;
						updateGraphicsHelper(false, true, true);
						drawSelections();
					}
					break;
				case "SelectAll":
					if(eventData.slotValue) {
						$scope.selectAll();
						$scope.set("SelectAll",false);
					}
					break;
				case "InternalSelections":
					if(eventData.slotValue != internalSelectionsInternallySetTo) {
						setSelectionsFromSlotValue();
					}
					break;
				case "FontSize":
					updateSize();
					updateGraphicsHelper(false, false, true);
					break;
				case "DrawingArea:height":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "DrawingArea:width":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "root:height":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "root:width":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "ZoomSpace":
					var zoomSpaceNew = $scope.gimme('ZoomSpace');
					if(typeof zoomSpaceNew !== 'number') {
						try {
							zoomSpaceNew = parseInt(zoomSpaceNew);
						} catch(e) {
							zoomSpaceNew = zoomSpace;
						}
					}
					if(zoomSpaceNew < 0) {
						zoomSpaceNew = 0;
					}
					if(zoomSpaceNew != zoomSpace) {
						zoomSpace = zoomSpaceNew;
						updateGraphicsHelper(false, true, false);
					}
					break;
				case "CellWidth":
					var cellWidthNew = $scope.gimme('CellWidth');
					if(typeof cellWidthNew !== 'number') {
						try {
							cellWidthNew = parseInt(cellWidthNew);
						} catch(e) {
							cellWidthNew = cellWidth;
						}
					}
					if(cellWidthNew < 0) {
						cellWidthNew = 0;
					}
					if(cellWidthNew != cellWidth) {
						cellWidth = cellWidthNew;
						updateGraphicsHelper(false, true, false);
					}
					break;
				case "PluginName":
					$scope.displayText = eventData.slotValue;
					break;
				case "ColorScheme":
					var colors = $scope.gimme("ColorScheme");
					parseSelectionColors();
					if(typeof colors === 'string') {
						colors = JSON.parse(colors);
					}
					currentColors = legacyDDSupLib.copyColors(colors);
					updateGraphicsHelper(false, false, false);
					drawSelections();
					break;
				case "ColorMode":
					var newVal = $scope.gimme("ColorMode");
					if(newVal >= 0 && newVal < colorModes.length) {
						if(newVal != colorMode) {
							colorMode = newVal;
							updateGraphics();
						}
						else {
							$scope.set("ColorMode", colorMode);
						}
					}
					break;
			};
		} catch(exc) {
			$log.log(preDebugMsg + "Error when reacting to slot change.");
		}
	}
	//===================================================================================


	//===================================================================================
	// On Mouse Move
	// This event handler manages mouse movement.
	//===================================================================================
	var onMouseMove = function(e){
		if(unique > 0) {
			var currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
			mouseIsOverMe = true;

			// hover text
			if(hoverText === null) {
				var elmnt = $scope.theView.parent().find('#mouseOverText');
				if(elmnt.length > 0) {
					hoverText = elmnt[0];
				}
				else {
					$log.log(preDebugMsg + "No hover text!");
				}
			}

			var dimAndVal = legacyDDSupLib.pixels2dimVals(currentMouse, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg);
			// var dimAndVal = mousePosToDimXYZ(currentMouse);

			if(hoverText !== null) {
				if(mousePosIsInSelectableArea(currentMouse)) {
					if(dimAndVal.dim !== null) {
						s = "[dim " + dimAndVal.dim + " = " + dimAndVal.val + "]";
						var textW = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, s);
						hoverText.style.font = fontSize + "px Arial";
						hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
						hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
						hoverText.innerHTML = s;
						hoverText.style.display = "block";
					}
					else {
						hoverText.style.display = "none";
					}
				}
				else {
					hoverText.style.display = "none";
				}
			}

			// selection rectangle, if clicked
			if(clickStart !== null) {
				if(selectionRect === null) {
					var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
					if(selectionRectElement.length > 0) {
						selectionRect = selectionRectElement[0];
					}
					else {
						$log.log(preDebugMsg + "No selection rectangle!");
					}
				}

				if(selectionRect !== null) {
					if(clickStart.dim == dimAndVal.dim) {
						var selectionRectCtx = selectionRect.getContext("2d");
						selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);

						if(selectionColors === null) {
							parseSelectionColors();
						}

						selectionRectCtx.strokeStyle = selectionColors.border;

						if(clickStart.dim == xAxisAxis) {
							var pos1 = legacyDDSupLib.dimVals2pixels(xAxisAxis, clickStart.val, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos2 = legacyDDSupLib.dimVals2pixels(xAxisAxis, clickStart.val, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos3 = legacyDDSupLib.dimVals2pixels(xAxisAxis, dimAndVal.val, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos4 = legacyDDSupLib.dimVals2pixels(xAxisAxis, dimAndVal.val, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

							// $log.log(preDebugMsg + "cs " + clickStart.val + ", dav " + dimAndVal.val + " --> " + pos1.x + " " + pos2.x + " " + pos3.x + " " + pos4.x);

							if(clickStart.val < dimAndVal.val) {
								pos3.x += cellW - 1;
								pos4.x += cellW - 1;
							}
							else {
								pos1.x += cellW - 1;
								pos2.x += cellW - 1;
							}

							pos1.y += cellW - 1;
							pos4.y += cellW - 1;

							// $log.log(preDebugMsg + "Adjust to: cs " + clickStart.val + ", dav " + dimAndVal.val + " --> " + pos1.x + " " + pos2.x + " " + pos3.x + " " + pos4.x);

							selectionRectCtx.save();
							selectionRectCtx.beginPath();
							selectionRectCtx.moveTo(pos1.x, pos1.y);
							selectionRectCtx.lineTo(pos2.x, pos2.y);
							selectionRectCtx.lineTo(pos3.x, pos3.y);
							selectionRectCtx.lineTo(pos4.x, pos4.y);
							selectionRectCtx.lineTo(pos1.x, pos1.y);
							selectionRectCtx.stroke();
							selectionRectCtx.restore();
						}
						else if(clickStart.dim == yAxisAxis) {
							var pos1 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos2 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos3 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos4 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

							pos2.x += cellW - 1;
							pos3.x += cellW - 1;

							if(clickStart.val < dimAndVal.val) {
								pos1.y += cellW - 1;
								pos2.y += cellW - 1;
							}
							else {
								pos3.y += cellW - 1;
								pos4.y += cellW - 1;
							}

							selectionRectCtx.save();
							selectionRectCtx.beginPath();
							selectionRectCtx.moveTo(pos1.x, pos1.y);
							selectionRectCtx.lineTo(pos2.x, pos2.y);
							selectionRectCtx.lineTo(pos3.x, pos3.y);
							selectionRectCtx.lineTo(pos4.x, pos4.y);
							selectionRectCtx.lineTo(pos1.x, pos1.y);
							selectionRectCtx.stroke();
							selectionRectCtx.restore();
						}
						else if(clickStart.dim == zAxisAxis) {
							var pos1 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos2 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos3 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
							var pos4 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

							pos2.x += cellW - 1;
							pos3.x += cellW - 1;

							if(clickStart.val < dimAndVal.val) {
								pos1.y += cellW - 1;
								pos2.y += cellW - 1;
							}
							else {
								pos3.y += cellW - 1;
								pos4.y += cellW - 1;
							}

							selectionRectCtx.save();
							selectionRectCtx.beginPath();
							selectionRectCtx.moveTo(pos1.x, pos1.y);
							selectionRectCtx.lineTo(pos2.x, pos2.y);
							selectionRectCtx.lineTo(pos3.x, pos3.y);
							selectionRectCtx.lineTo(pos4.x, pos4.y);
							selectionRectCtx.lineTo(pos1.x, pos1.y);
							selectionRectCtx.stroke();
							selectionRectCtx.restore();
						}
					}
					else { // dimensions are not the same
						hideSelectionRect();
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Down
	// This event handler manages mouse button down.
	//===================================================================================
	var onMouseDown = function(e){
		if(unique > 0) {
			if(e.which === 1){
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				if(mousePosIsInSelectableArea(currentMouse)) {
					// var dimAndVal = mousePosToDimXYZ(currentMouse);
					var dimAndVal = legacyDDSupLib.pixels2dimVals(currentMouse, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg);

					clickStart = dimAndVal;
					if(e.ctrlKey || e.metaKey) {
						clickStart.ctrl = true;
					}
					else {
						clickStart.ctrl = false;
					}

					selectionHolderElement.bind('mouseup', onMouseUp);
					e.stopPropagation();
				}
				else {
					clickStart = null;

					// also do the drag&drop related stuff
					var x = currentMouse.x;
					var y = currentMouse.y;
					var found = false;
					for(var dr = 0; dr < allDragNames.length; dr++){
						var drag = allDragNames[dr];
						if(drag.left >= 0 && x >= drag.left && x <= drag.right && y >= drag.top && y <= drag.bottom) {
							$scope.dragNdropRepr = drag.name;
							$scope.dragNdropID = drag.ID;
							$scope.theView.find('.dragSrc').draggable( 'enable' );
							$scope.theView.find('.dragSrc').attr("id", drag.ID);
							found = true;
						}
					}
					if(!found) {
						$scope.dragNdropRepr = "Nothing to drag.";
						$scope.dragNdropID = "No drag data.";
						$scope.theView.find('.dragSrc').attr("id", "no drag data");
						$scope.theView.find('.dragSrc').draggable( 'disable' );
					}

				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// On Mouse Up
	// This event handler manages mouse button up.
	//===================================================================================
	var onMouseUp = function(e){
		if(unique > 0) {
			selectionHolderElement.unbind('mouseup');

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				// var dimAndVal = mousePosToDimXYZ(currentMouse);
				var dimAndVal = legacyDDSupLib.pixels2dimVals(currentMouse, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg);

				if(clickStart.dim == dimAndVal.dim) {
					newSelection(clickStart.dim, clickStart.val, dimAndVal.val, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Out
	// This event handler manages mouse leaving hover area.
	//===================================================================================
	var onMouseOut = function(e) {
		mouseIsOverMe = false;

		if(unique > 0) {
			if(hoverText === null) {
				var elmnt = $scope.theView.parent().find('#mouseOverText');
				if(elmnt.length > 0) {
					hoverText = elmnt[0];
				}
				else {
					$log.log(preDebugMsg + "No hover text!");
				}
			}
			if(hoverText !== null) {
				hoverText.style.display = "none";
			}

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				// var dimAndVal = mousePosToDimXYZ(currentMouse);
				var dimAndVal = legacyDDSupLib.pixels2dimVals(currentMouse, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg);

				if(clickStart.dim == dimAndVal.dim) {
					newSelection(clickStart.dim, clickStart.val, dimAndVal.val, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//===================================================================================



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		$scope.addPopupMenuItemDisabled('EditCustomMenuItems');
		$scope.addPopupMenuItemDisabled('EditCustomInteractionObjects');
		$scope.addPopupMenuItemDisabled('AddCustomSlots');

		var ios = $scope.theInteractionObjects;
		for(var i = 0, io; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'Resize'){
				io.scope().setIsEnabled(false);
			}
			if(io.scope().getName() == 'Rotate'){
				io.scope().setIsEnabled(false);
			}
		}

		$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
			grouping,
			"Multiple Selections -> Different Groups",
			'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('IgnoreExtremeOutliers',
			skipOutliers,
			"Ignore Extreme Outliers",
			'Treat very extreme data points like null values (do not draw).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ColorMode',
			colorMode,
			"Color Mode",
			'The way to represent the values with colors. "abs" = absolute value mapped to intensity, "minmax" = intensity scale from minimum value to maximum value, "hotcold" = two intensity scales, one for negative values and one for positive values.',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: colorModes},
			undefined
		));

		$scope.addSlot(new Slot('DimensionX',
			xAxisAxis,
			"Dimension for X",
			'Which dimension of the 3D data to put on the X-axis of the visualization.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('DimensionY',
			yAxisAxis,
			"Dimension for Y",
			'Which dimension of the 3D data to put on the Y-axis of the visualization.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('FontSize',
			11,
			"Font Size",
			'The font size to use in the Webble interface.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('CellWidth',
			cellWidth,
			"Cell Width",
			'The size (in pixels) of the cells in the plot (set to 0 for automatic scaling).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ZoomSpace',
			zoomSpace,
			"Zoom Space Width",
			'The size (in pixels) of the area to show only the selected part (if 0, not shown).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('SelectAll',
			false,
			"Select All",
			'Slot to quickly reset all selections to select all available data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ClearData',
			false,
			"Clear Data",
			'Slot to quickly reset to having no data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Dashboard Plugin slots -----------------------------------------------------------

		$scope.addSlot(new Slot('PluginName',
			"Fake 3D Plot",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// // colors of groups of data, and the background color theme
		$scope.addSlot(new Slot('ColorScheme',
			{"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
				"selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
				"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
					1:{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},
					2:{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},
					3:{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},
					4:{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},
					5:{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},
					6:{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},
					7:{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},
					8:{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},
					9:{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},
					10:{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},
					11:{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},
					12:{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},
					13:{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},
					14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}},
			"Color Scheme",
			'Input Slot. What colors to use for the background and for the data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot('ColorScheme');
		myInstanceId = $scope.getInstanceId();

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		updateGraphics(true, true, true);

		selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		if(selectionHolderElement !== null){
			selectionHolderElement.bind('mousedown', onMouseDown);
			selectionHolderElement.bind('mousemove', onMouseMove);
			selectionHolderElement.bind('mouseout', onMouseOut);
		}
		else {
			$log.log(preDebugMsg + "No selectionHolderElement, could not bind mouse listeners");
		}

		$scope.fixDroppable();
		$scope.fixDraggable();
	};
	//===================================================================================


	// ============================================================
	// ------- Methods Similar to all Visualization Webbles -------
	// ============================================================


	//===================================================================================
	// Fix Draggable
	// This method fixes the draggable behavior to behave as wanted.
	//===================================================================================
	$scope.fixDraggable = function () {
		$scope.theView.find('.dragSrc').draggable({
			helper: function() {
				return $("<div id=\"" + $scope.dragNdropID + "\">" + $scope.dragNdropRepr + "</div>");
			},
			cursorAt: {top: 5, left: 5}
		});
	};
	//===================================================================================


	//===================================================================================
	// Fix Droppable
	// This method fixes the droppable behavior to behave as wanted.
	//===================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('.canvasStuffForHopVizFake3D').droppable({
			over: function(e, ui) {
				if(e.target.id == "selectionHolder") {
					updateDropZones(textColor, 1, true);
				}
			},
			out: function() {
				updateDropZones(textColor, 0.3, false);
			},
			tolerance: 'pointer',
			drop: function(e, ui){
				if(e.target.id == "selectionHolder") {
					e.preventDefault();
					var xpos = e.offsetX;
					var ypos = e.offsetY;
					var ok = false;
					var x = e.originalEvent.pageX - $(this).offset().left;
					var y = e.originalEvent.pageY - $(this).offset().top;
					xpos = x;
					ypos = y;

					for(var d = 0; !ok && d < allDropZones.length; d++) {
						var dropZone = allDropZones[d];

						if(xpos <= dropZone.right && xpos >= dropZone.left && ypos >= dropZone.top && ypos < dropZone.bottom) {
							f = dropZone.forMapping;
							ok = true;
						}
					}
					if(ok) {
						dataDropped(ui.draggable.attr('id'), f);
					}
				}
				updateDropZones(textColor, 0.3, false);
			}
		});
	};
	//===================================================================================

	//===================================================================================
	// Fake Drop
	// This method imitates a file drop.
	//===================================================================================
	$scope.fakeDrop = function(dataSourceInfo, vizualizationFieldName) {
		var ok = false;
		var f = null;

		for(var d = 0; !ok && d < allDropZones.length; d++) {
			var dropZone = allDropZones[d];

			if(dropZone.forMapping.name == vizualizationFieldName) {
				f = dropZone.forMapping;
				ok = true;
			}
		}

		if(ok) {
			dataDropped(dataSourceInfo, f);
		}
	};
	//===================================================================================


	//===================================================================================
	// Clear Data
	// This method clears away all data.
	//===================================================================================
	$scope.clearData = function() {
		var oldMappings = dataMappings;

		resetVars();
		dataMappings = [];
		updateGraphics();

		for(var src = 0; src < oldMappings.length; src++) {
			if(oldMappings[src].hasOwnProperty("newSelections") && oldMappings[src].newSelections !== null) {
				oldMappings[src].newSelections(myInstanceId, null, false, true);
			}

			if(oldMappings[src].hasOwnProperty("listen") && oldMappings[src].listen !== null) {
				oldMappings[src].listen(myInstanceId, false, null, null, []);
			}

			for(var i = 0; i < oldMappings[src].map.length; i++) {
				if(oldMappings[src].map[i].hasOwnProperty("listen") && oldMappings[src].map[i].listen !== null) {
					oldMappings[src].map[i].listen(myInstanceId, false, null, null, []);
				}

				if(oldMappings[src].map[i].hasOwnProperty("newSelections") && oldMappings[src].map[i].newSelections !== null) {
					oldMappings[src].map[i].newSelections(myInstanceId, null, false, true);
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Type Check
	// This method check the types for the specified parameters.
	//===================================================================================
	function typeCheck(t1, t2) {
		for(var i = 0; i < t1.length; i++) {
			for(var j = 0; j < t2.length; j++) {
				if(t1[i] == t2[j]) {
					// found a compatible interpretation of the types
					return 1;
				}
			}
		}
		return 0;
	}
	//===================================================================================


	//===================================================================================
	// Check Mappings and Parse Data
	// This method checks the mappings and parse the data.
	//===================================================================================
	function checkMappingsAndParseData() {
		// $log.log(preDebugMsg + "checkMappingsAndParseData");
		parsingDataNow = true;
		var somethingChanged = false;
		var atLeastOneActive = false;

		for(var src = 0; src < dataMappings.length; src++) {
			var haveData = false;
			var haveX = false;
			var haveY = false;
			var haveZ = false;
			var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
			var ls = w.scope().gimme(dataMappings[src].slotName);

			for(var f = 0; f < dataMappings[src].map.length; f++) {
				if(dataMappings[src].map[f].name == "data") {
					haveData = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(!typeCheck(fieldInfo.type, dropData.forMapping.type)) {
						haveX = false;
					}
				}

				if(dataMappings[src].map[f].listen === null) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;
				}

				if(dataMappings[src].map[f].name == "X") {
					haveX = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(!typeCheck(fieldInfo.type, dropX.forMapping.type)) {
						haveX = false;
					}
				}
				if(dataMappings[src].map[f].name == "Y") {
					haveY = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(!typeCheck(fieldInfo.type, dropY.forMapping.type)) {
						haveY = false;
					}
				}
				if(dataMappings[src].map[f].name == "Z") {
					haveZ = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(!typeCheck(fieldInfo.type, dropZ.forMapping.type)) {
						haveZ = false;
					}
				}
			}

			var canActivate = false;
			var haveXYZ = false;

			if(haveData) {
				canActivate = true;
				atLeastOneActive = true;

				if(haveX && haveY && haveZ) {
					haveXYZ = true;
				}
			}

			if(dataMappings[src].active != canActivate) {
				// we can start visualizing this data
				dataMappings[src].clean = false;
				somethingChanged = true;
			}

			if(canActivate) {
				if(haveXYZ) {
					dataMappings[src].haveXYZ = true;
				}
				else {
					dataMappings[src].haveXYZ = false;
				}

				var ls2 = [];
				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					ls2.push(dataMappings[src].map[ff].srcIdx);
				}

				// start listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					if(haveXYZ || dataMappings[src].map[i].name == "data") {
						// $log.log(preDebugMsg + "Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						dataMappings[src].map[i].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
					}
				}

			}
			else {
				// stop listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					// $log.log(preDebugMsg + "Not active, stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
					dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
				}
			}

			dataMappings[src].active = canActivate;
		}

		if(somethingChanged || atLeastOneActive) {
			parseData();
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Data
	// This method checks weather it is time to redraw based on new data.
	//===================================================================================
	function redrawOnNewData(seqNo) {
		if(lastSeenDataSeqNo != seqNo) {
			lastSeenDataSeqNo = seqNo;
			checkMappingsAndParseData();
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Selections
	// This method checks weather it is time to redraw based on new Selections.
	//===================================================================================
	function redrawOnNewSelections(seqNo) {
		if(lastSeenSelectionSeqNo != seqNo) {
			lastSeenSelectionSeqNo = seqNo;
			updateGraphicsHelper(false, true, false);
		}
	}
	//===================================================================================


	//===================================================================================
	// Save Selections in Slot
	// This method saves the selection into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		if(selections && selections.length >= 3) {
			var result = [];
			for(var d = 0; d < 3; d++) {
				result.push({"dim":d, "selections":[]});
			}

			for(var d = 0; d < 3; d++) {
				for(var sel = 0; sel < selections[d].length; sel++) {
					result[d].selections.push({'maxVal':selections[d][sel].maxVal, 'minVal':selections[d][sel].minVal});
				}
			}

			internalSelectionsInternallySetTo = result;
			$scope.set('InternalSelections', result);
		}
	}
	//===================================================================================


	//===================================================================================
	// Set Selections From a Slot
	// This method sets the selections based on the value in a slot.
	//===================================================================================
	function setSelectionsFromSlotValue() {
		// $log.log(preDebugMsg + "setSelectionsFromSlotValue");
		var slotSelections = $scope.gimme("InternalSelections");
		if(typeof slotSelections === 'string') {
			slotSelections = JSON.parse(slotSelections);
		}

		if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
			// $log.log(preDebugMsg + "setSelectionsFromSlotValue got identical value");
			return;
		}

		if(slotSelections && slotSelections.length >= 3) {
			var newSelections = [];
			for(var d = 0; d < 3; d++) {
				newSelections.push([]);
			}

			for(var d = 0; d < 3; d++) {
				for(var sel = 0; sel < slotSelections[d].selections.length; sel++) {
					var newSel = slotSelections[d].selections[sel];
					newSelections[slotSelections[d].dim].push(newSel);
				}
			}

			for(var d = 0; d < 3; d++) {
				if(newSelections[d].length <= 0) {
					newSelections[d].push({"minVal":0, "maxVal":dim[d] - 1});
				}
			}

			if(newSelections.length <= 0) {
				$scope.selectAll();
			}
			else {
				selections = newSelections;
				updateLocalSelections(false);
				drawSelections();
			}
		}

		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Update Local Selections
	// This method updates the local selections to be in phase with global ones.
	//===================================================================================
	function updateLocalSelections(selectAll) {
		if(!parsingDataNow) {
			lastLastSeenSelectionSeqNo = lastSeenSelectionSeqNo;

			for(var src = 0; src < dataMappings.length; src++) {
				if(dataMappings[src].active && dataMappings[src].haveXYZ) {
					var srcsrc = src;
					dataMappings[src].newSelectionsX(myInstanceId, function(idx) { return mySelectionStatusX(srcsrc, idx); }, true, selectAll);
					dataMappings[src].newSelectionsY(myInstanceId, function(idx) { return mySelectionStatusY(srcsrc, idx); }, true, selectAll);
					dataMappings[src].newSelectionsZ(myInstanceId, function(idx) { return mySelectionStatusZ(srcsrc, idx); }, false, selectAll);
				}
				else {
					if(dataMappings[src].haveXYZ) {
						dataMappings[src].newSelectionsX(myInstanceId, null, true, true);
						dataMappings[src].newSelectionsY(myInstanceId, null, true, true);
						dataMappings[src].newSelectionsZ(myInstanceId, null, false, true);
					}
				}
			}

			if(lastLastSeenSelectionSeqNo == lastSeenSelectionSeqNo) {
				// we did not get a redraw request from the parent
				updateGraphicsHelper(false, true, false);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets all the main variables for the plugin Webble getting it ready
	// for new fresh data.
	//===================================================================================
	function resetVars() {
		$scope.dataSetName = "";
		unique = 0;
		dataName = null;
		dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		parsingDataNow = true;
		// parse parents instructions on where to find data, check that at least one data set is filled
		resetVars();
		var dataIsCorrupt = false;
		var firstX = true;
		var firstY = true;
		var firstZ = true;

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
				var ls = w.scope().gimme(dataMappings[src].slotName);

				for(var f = 0; f < dataMappings[src].map.length; f++) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;

					if(dataMappings[src].map[f].name == "data") {
						dataMappings[src].valFun = fieldInfo.val;
						dataMappings[src].selFun = fieldInfo.sel;
						dataMappings[src].size = fieldInfo.size;
						dataMappings[src].newSelections = fieldInfo.newSel;
					}

					if(dataMappings[src].map[f].name == "X") {
						dataMappings[src].selFunX = fieldInfo.sel;
						dataMappings[src].sizeX = fieldInfo.size;
						dataMappings[src].newSelectionsX = fieldInfo.newSel;
					}
					if(dataMappings[src].map[f].name == "Y") {
						dataMappings[src].selFunY = fieldInfo.sel;
						dataMappings[src].sizeY = fieldInfo.size;
						dataMappings[src].newSelectionsY = fieldInfo.newSel;
					}
					if(dataMappings[src].map[f].name == "Z") {
						dataMappings[src].selFunZ = fieldInfo.sel;
						dataMappings[src].sizeZ = fieldInfo.size;
						dataMappings[src].newSelectionsZ = fieldInfo.newSel;
					}

				}
			}
			dataMappings[src].clean = true;
		}

		// data sanity check
		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fval = dataMappings[src].valFun;

				for(i = 0; i < dataMappings[src].size; i++) {
					var cube = fval(i);

					if(firstX) {
						firstX = false;
						dim[0] = cube.length;
					}
					else {
						if(dim[0] != cube.length) {
							dataIsCorrupt = true;
							$log.log(preDebugMsg + "arrays have different lengths");
						}
					}

					for(var x = 0; x < cube.length; x++) {
						if(firstY) {
							firstY = false;
							dim[1] = cube[x].length;
						}
						else {
							if(dim[1] != cube[x].length) {
								dataIsCorrupt = true;
								$log.log(preDebugMsg + "arrays have different lengths");
							}
						}

						for(var y = 0; y < cube[x].length; y++) {
							if(firstZ) {
								firstZ = false;
								dim[2] = cube[x][y].length;
							}
							else {
								if(dim[2] != cube[x][y].length) {
									dataIsCorrupt = true;
									$log.log(preDebugMsg + "arrays have different lengths");
								}
							}
						}
					}

					$log.log(preDebugMsg + "using dimensions: (" + dim[0] + "," + dim[1] + "," + dim[2] + ")");
					unique = 1;
				}

				if(dim[0] === undefined || dim[1] === undefined || dim[2] === undefined) {
					dataIsCorrupt = true;
				}

				if(dataMappings[src].haveXYZ) {
					if(dataMappings[src].sizeX != dim[2]) {
						$log.log(preDebugMsg + "dimensionality error, X dimension of 3DArray is " + dim[2] + " but dimension of X variable is " + dataMappings[src].sizeX);
						dataMappings[src].haveXYZ = false;
					}
					if(dataMappings[src].sizeY != dim[1]) {
						$log.log(preDebugMsg + "dimensionality error, Y dimension of 3DArray is " + dim[1] + " but dimension of Y variable is " + dataMappings[src].sizeY);
						dataMappings[src].haveXYZ = false;
					}
					if(dataMappings[src].sizeZ != dim[0]) {
						$log.log(preDebugMsg + "dimensionality error, Z dimension of 3DArray is " + dim[0] + " but dimension of Z variable is " + dataMappings[src].sizeZ);
						dataMappings[src].haveXYZ = false;
					}
				}
			}
		}

		outLierStuff = [];

		if(!dataIsCorrupt) {
			for(var src = 0; src < dataMappings.length; src++) {
				if(dataMappings[src].active) {
					var fval = dataMappings[src].valFun;
					outLierStuff.push([]);

					for(i = 0; i < dataMappings[src].size; i++) {
						var cube = fval(i);
						outLierStuff[src].push({});
						var sum = 0;
						var sum2 = 0;
						var n = 0;

						for(var x = 0; x < cube.length; x++) {
							for(var y = 0; y < cube[x].length; y++) {
								for(var z = 0; z < cube[x][y].length; z++) {
									var v = cube[x][y][z];

									if(v !== null) {
										n++;
										sum += v;
										sum2 += v*v;
									}
								}
							}
						}

						outLierStuff[src][i]["n"] = n;

						if(n > 0) {
							var mean = sum / n;
							var variance = sum2 / n - mean*mean;
							var stddev = Math.sqrt(variance);
							var cutOff = stddev * 10;

							outLierStuff[src][i]["mean"] = mean;
							outLierStuff[src][i]["cutOff"] = cutOff;
						}
					}
				}
			}
		}

		if(dataIsCorrupt) {
			$log.log(preDebugMsg + "data is corrupt");

			for(var src = 0; src < dataMappings.length; src++) {
				for(var f = 0; f < dataMappings[src].map.length; f++) {
					if(dataMappings[src].map[f].listen !== null) {
						// $log.log(preDebugMsg + "Data corrupt, stop listening to " + dataMappings[src].map[f].name + " " + dataMappings[src].map[f].srcIdx);
						dataMappings[src].map[f].listen(myInstanceId, false, null, null, []);
					}
				}
			}
			resetVars();
		}

		parsingDataNow = false;
		$scope.selectAll(); // will force update of local selections and a redraw
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics
	// This method updates the graphics.
	//===================================================================================
	function updateGraphics() {
		if(!parsingDataNow) {
			updateGraphicsHelper(false, false, false);
		}
	}
	//===================================================================================

	//===================================================================================
	// Update Graphics Helper
	// This method updates the graphics based on specific parameters.
	//===================================================================================
	function updateGraphicsHelper(forceBackground, forceCells, forceAxes) {
		// $log.log(preDebugMsg + "updateGraphics()");
		if(parsingDataNow) {
			return;
		}

		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		var W = bgCanvas.width;
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		var H = bgCanvas.height;
		if(typeof H === 'string') {
			H = parseFloat(H);
		}
		if(H < 1) {
			H = 1;
		}

		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		if(currentColors === null) {
			var colors = $scope.gimme("ColorScheme");
			if(typeof colors === 'string') {
				colors = JSON.parse(colors);
			}
			currentColors = legacyDDSupLib.copyColors(colors);

			if(!currentColors) {
				currentColors = {};
			}
		}

		if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
			textColor = currentColors.skin.text;
		}
		else {
			textColor = "#000000";
		}

		var redrawBackground = forceBackground;
		var redrawCells = forceCells;
		var redrawAxes = forceAxes;
		var redrawSelections = false;

		// ==========================================
		// Check what dimensions to use on what axes
		// ==========================================

		if(xAxisAxis < 0) {
			xAxisAxis = 0;
		}
		if(xAxisAxis > 2) {
			xAxisAxis = 2;
		}
		if(yAxisAxis < 0) {
			yAxisAxis = 0;
		}
		if(yAxisAxis > 2) {
			yAxisAxis = 2;
		}
		if(zAxisAxis < 0) {
			zAxisAxis = 0;
		}
		if(zAxisAxis > 2) {
			zAxisAxis = 2;
		}

		if(xAxisAxis == yAxisAxis) {
			yAxisAxis = (xAxisAxis + 1) % 3;
		}

		var temp = [0, 0, 0];
		temp[xAxisAxis] = 1;
		temp[yAxisAxis] = 1;
		for(var i = 0; i < 3; i++) {
			if(temp[i] == 0) {
				zAxisAxis = i;
				break;
			}
		}
		// $log.log(preDebugMsg + "use dimension " + xAxisAxis + " on X axis, dimension " + yAxisAxis + " on Y axis, and dimension " + zAxisAxis + " as depth.");


		// Check if we need to resize
		if(unique > 0) {
			if(cellWidth <= 0) {
				if(zoomSpace <= 0) {
					cellW  = Math.floor((drawW - innerMarg) / (dim[xAxisAxis] + dim[zAxisAxis]));
				}
				else {
					cellW  = Math.floor((drawW - innerMarg - zoomSpace) / (dim[xAxisAxis] + dim[zAxisAxis]));
				}

				var cellH =  Math.floor((drawH - innerMarg) / (dim[yAxisAxis] + dim[zAxisAxis]));

				if(cellW < 1 || cellH < 1) {
					cellW = 1;
				}
				else {
					if(cellH < cellW) {
						cellW = cellH;
					}
				}
			}
			else {
				cellW = cellWidth;
			}

			// $log.log(preDebugMsg + "setting cellW to " + cellW);
			var newW = Math.ceil(cellW * (dim[xAxisAxis] + dim[zAxisAxis]) + leftMarg + rightMarg + innerMarg);
			if(zoomSpace <= 0) {
				// do as before
			}
			else {
				newW = Math.ceil(cellW * (dim[xAxisAxis] + dim[zAxisAxis]) + leftMarg + rightMarg + innerMarg + zoomSpace);
			}

			var newH = Math.ceil(cellW * (dim[yAxisAxis] + dim[zAxisAxis]) + topMarg + bottomMarg * 2 + fontSize + innerMarg);
			if(newH < zoomSpace) {
				newH = zoomSpace;
			}

			if(newW > W || newH > H) {
				var endNow = false;
				$log.log(preDebugMsg + "We need to resize. Current W,H = " + W + "," + H + ", need " + newW + "," + newH);

				if(newW > W) {
					$scope.set("DrawingArea:width", newW);
					endNow = true;
				}
				if(newH > H) {
					$scope.set("DrawingArea:height", newH);
					endNow = true;
				}

				if(endNow) {
					return;
				}
			}
		}


		// Check what needs to be redrawn
		if(lastXAxisAxis != xAxisAxis || lastYAxisAxis != yAxisAxis || lastZAxisAxis != zAxisAxis) {
			redrawCells = true;
			redrawSelections = true;
		}

		if(drawW != lastDrawW || drawH != lastDrawH) {
			redrawBackground = true;
			redrawCells = true;
			redrawAxes = true;
			redrawSelections = true;
		}

		if(!redrawBackground && currentColors != lastColors) {
			redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
		}

		if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
			redrawAxes = true;
		}

		if(lastCellW != cellW) {
			redrawCells = true;
			redrawSelections = true;
		}

		if(legacyDDSupLib.checkColors(currentColors, lastColors)) {
			redrawCells = true;
			redrawSelections = true;
		}

		if(lastColorMode != colorMode) {
			redrawCells = true;
		}

		if(lastZoomSpace != zoomSpace) {
			redrawCells = true;
		}

		// Draw
		if(redrawBackground) {
			drawBackground(W, H);
		}
		if(redrawAxes) {
			drawAxes(W, H);
		}
		if(redrawCells) {
			drawDensityPlot(W, H);
		}

		if(redrawSelections || redrawCells) {
			drawSelections(); // this is cheap, do this just in case
		}

		lastDrawW = drawW;
		lastDrawH = drawH;
		lastFontSize = fontSize;
		lastTextColor = textColor;
		lastColors = currentColors;
		lastCellW = cellW;
		lastXAxisAxis = xAxisAxis;
		lastYAxisAxis = yAxisAxis;
		lastZAxisAxis = zAxisAxis;
		lastColorMode = colorMode;
		lastZoomSpace = zoomSpace;

		updateDropZones(textColor, 0.3, false);
	}
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background based on the specified width and height.
	//===================================================================================
	function drawBackground(W,H) {
		var colors = currentColors;

		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(bgCtx === null) {
			bgCtx = bgCanvas.getContext("2d");
		}

		if(!bgCtx) {
			$log.log(preDebugMsg + "no canvas to draw bg on");
			return;
		}

		bgCtx.clearRect(0,0, W,H);

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false
			if(colors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
				var OK = true;
				var grd = bgCtx.createLinearGradient(0,0,W,H);
				for(var i = 0; i < colors.skin.gradient.length; i++) {
					var cc = colors.skin.gradient[i];
					if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
						grd.addColorStop(cc.pos, cc.color);
					}
					else {
						OK = false;
					}
				}
				if(OK) {
					bgCtx.fillStyle = grd;
					bgCtx.fillRect(0,0,W,H);
					drewBack = true;
				}
			}
			if(!drewBack && colors.skin.hasOwnProperty("color")) {
				bgCtx.fillStyle = colors.skin.color;
				bgCtx.fillRect(0,0,W,H);
				drewBack = true;
			}

			if(colors.skin.hasOwnProperty("border")) {
				bgCtx.fillStyle = colors.skin.border;
				bgCtx.fillRect(0,0, W,1);
				bgCtx.fillRect(0,H-1, W,H);
				bgCtx.fillRect(0,0, 1,H);
				bgCtx.fillRect(W-1,0, W,H);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Drop Zones
	// This method update the drop zones, based on mouse movement etc.
	//===================================================================================
	function updateDropZones(col, alpha, hover) {
		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no drop canvas to draw on!");
				return;
			}
		}

		if(dropCtx === null) {
			dropCtx = dropCanvas.getContext("2d");
		}

		if(!dropCtx) {
			$log.log(preDebugMsg + "no canvas to draw drop zones on");
			return;
		}

		if(dropCtx) {
			var W = dropCanvas.width;
			var H = dropCanvas.height;

			dropCtx.clearRect(0,0, W,H);

			var marg1 = 8;
			if(drawW < 40) {
				marg1 = 0;
			}
			var marg2 = 8;
			if(drawH < 40) {
				marg2 = 0;
			}

			dropData.left = leftMarg;
			dropData.top = topMarg;
			dropData.right = leftMarg + drawW/2-1;
			dropData.bottom = topMarg + drawH;

			dropZ.left = leftMarg + drawW/2+1;
			dropZ.top = topMarg;
			dropZ.right = leftMarg + drawW/2 + drawW/6-1;
			dropZ.bottom = topMarg + drawH;
			dropY.left = leftMarg + drawW/2 + drawW/6+1;
			dropY.top = topMarg;
			dropY.right = leftMarg + drawW/2 + drawW/3-1;
			dropY.bottom = topMarg + drawH;
			dropX.left = leftMarg + drawW/2 + drawW/3+1;
			dropX.top = topMarg;
			dropX.right = leftMarg + drawW;
			dropX.bottom = topMarg + drawH;

			if(hover) {
				dropCtx.save();
				dropCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
				dropCtx.fillRect(0,0, W, H);
				dropCtx.restore();

				var fnt = "bold " + (fontSize + 5) + "px Arial";
				dropCtx.font = fnt;
				dropCtx.fillStyle = textColor;
				dropCtx.fillStyle = "black";

				for(var d = 0; d < allDropZones.length; d++) {
					var dropZone = allDropZones[d];

					dropCtx.save();
					var l = Math.max(0, dropZone.left - fontSize/2);
					var t = Math.max(0, dropZone.top - fontSize/2);
					var w = Math.min(W - l, dropZone.right - dropZone.left + fontSize / 2 + dropZone.left - l)
					var h = Math.min(H - t, dropZone.bottom - dropZone.top + fontSize / 2 + dropZone.top - t )
					dropCtx.clearRect(l, t, w, h);

					dropCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
					dropCtx.fillRect(l, t, w, h);
					dropCtx.restore();
				}
				for(var d = 0; d < allDropZones.length; d++) {
					var dropZone = allDropZones[d];

					dropCtx.save();
					dropCtx.globalAlpha = alpha;
					dropCtx.strokeStyle = "black";
					dropCtx.strokeWidth = 1;
					dropCtx.lineWidth = 2;
					dropCtx.setLineDash([2, 3]);
					dropCtx.beginPath();
					dropCtx.moveTo(dropZone.left, dropZone.top);
					dropCtx.lineTo(dropZone.left, dropZone.bottom);
					dropCtx.lineTo(dropZone.right, dropZone.bottom);
					dropCtx.lineTo(dropZone.right, dropZone.top);
					dropCtx.lineTo(dropZone.left, dropZone.top);
					dropCtx.stroke();
					if(hover) {
						var str = dropZone.label;
						var tw = legacyDDSupLib.getTextWidth(axesCtx, str, fnt);
						var labelShift = Math.floor(fontSize / 2);
						if(dropZone.rotate) {
							if(dropZone.left > W / 2) {
								dropCtx.translate(dropZone.left - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							else {
								dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							dropCtx.rotate(Math.PI/2);
						}
						else {
							if(dropZone.top < H / 2) {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
							}
							else {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.top + labelShift);
							}
						}
						dropCtx.fillText(str, 0, 0);
					}
					dropCtx.restore();
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Axes
	// This method draws the axes.
	//===================================================================================
	function drawAxes(W, H) {
		if(axesCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
			if(myCanvasElement.length > 0) {
				axesCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(axesCtx === null) {
			axesCtx = axesCanvas.getContext("2d");
		}

		if(!axesCtx) {
			$log.log(preDebugMsg + "no canvas to draw axes on");
			return;
		}

		axesCtx.clearRect(0,0, W,H);
		axesCtx.fillStyle = textColor;
		axesCtx.font = fontSize + "px Arial";

		// top label
		var str = "";
		var xw = -1;
		var ww = -1;

		if(dataName !== null) {
			str = dataName;
			xw = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, dataName);
		}

		if(str != "") {
			var w = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, str);
			var top = 0;
			if(fontSize < topMarg) {
				top = Math.floor((topMarg - fontSize) / 2);
			}
			var left = 0;
			if(w < W) {
				left = Math.floor((W - w) / 2);
			}

			axesCtx.fillText(str, left, top + fontSize);

			if(xw >= 0) {
				dragZone = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dragZone.name, 'ID':dragZone.ID};
			}
			allDragNames = [dragZone];
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Size
	// This method updates the size.
	//===================================================================================
	function updateSize() {
		// $log.log(preDebugMsg + "updateSize");
		fontSize = parseInt($scope.gimme("FontSize"));
		if(fontSize < 5) {
			fontSize = 5;
		}

		var rw = $scope.gimme("DrawingArea:width");
		if(typeof rw === 'string') {
			rw = parseFloat(rw);
		}
		if(rw < 1) {
			rw = 1;
		}

		var rh = $scope.gimme("DrawingArea:height");
		if(typeof rh === 'string') {
			rh = parseFloat(rh);
		}
		if(rh < 1) {
			rh = 1;
		}

		var bgDirty = false;
		if(bgCanvas === null) {
			bgDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(bgCanvas.width != rw) {
			bgDirty = true;
			bgCanvas.width = rw;
		}
		if(bgCanvas.height != rh) {
			bgDirty = true;
			bgCanvas.height = rh;
		}

		var plotDirty = false;
		if(plotCanvas === null) {
			plotDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#thePlotCanvas');
			if(myCanvasElement.length > 0) {
				plotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(plotCanvas.width != rw) {
			plotDirty = true;
			plotCanvas.width = rw;
		}
		if(plotCanvas.height != rh) {
			plotDirty = true;
			plotCanvas.height = rh;
		}

		var axesDirty = false;
		if(axesCanvas === null) {
			axesDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
			if(myCanvasElement.length > 0) {
				axesCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(axesCanvas.width != rw) {
			axesDirty = true;
			axesCanvas.width = rw;
		}
		if(axesCanvas.height != rh) {
			axesDirty = true;
			axesCanvas.height = rh;
		}

		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
			}
		}
		if(dropCanvas) {
			dropCanvas.width = rw;
			dropCanvas.height = rh;
		}

		if(selectionCanvas === null) {
			var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
			if(selectionCanvasElement.length > 0) {
				selectionCanvas = selectionCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no selectionCanvas to resize!");
				return;
			}
		}
		selectionCanvas.width = rw;
		selectionCanvas.height = rh;
		selectionCanvas.style.left = 0;
		selectionCanvas.style.top = 0;

		if(selectionHolderElement === null) {
			selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		}
		selectionHolderElement.width = rw;
		selectionHolderElement.height = rh;
		selectionHolderElement.top = 0;
		selectionHolderElement.left = 0;

		var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
		selectionRectElement.width = rw;
		selectionRectElement.height = rh;
		selectionRectElement.top = 0;
		selectionRectElement.left = 0;
		if(selectionRectElement.length > 0) {
			selectionRect = selectionRectElement[0];
			selectionRect.width = rw;
			selectionRect.height = rh;
			selectionRect.top = 0;
			selectionRect.left = 0;
		}

		var W = selectionCanvas.width;
		var H = selectionCanvas.height;
		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;
	}
	//===================================================================================


	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(newDim, v1, v2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(newDim === null || newDim === undefined) {
			return;
		}

		var minVal = Math.floor(Math.min(v1, v2));
		var maxVal = Math.ceil(Math.max(v1, v2));
		var sel = {"minVal":minVal, "maxVal":maxVal};
		var dup = false;

		if(selections.length <= newDim) {
			for(var d = selections.length; d < 3; d++) {
				selections.push([]);
				dirty = true;
			}
		}

		if(!keepOld) {
			selections[newDim] = [];
			dirty = true;
		}

		for(var s = 0; s < selections[newDim].length; s++) {
			if(selections[newDim][s].minVal == sel.minVal && selections[newDim][s].maxVal == sel.maxVal) {
				dup = true;
				break;
			}
		}

		if(!dup) {
			selections[newDim].push(sel);
			dirty = true;
		}

		for(var d = 0; d < 3; d++) {
			if(selections[d].length <= 0) {
				selections[d].push({"minVal":0, "maxVal":dim[d] - 1});
				dirty = true;
			}
		}

		if(dirty) {
			drawSelections();
			updateLocalSelections(false);
			saveSelectionsInSlot();
		}
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	$scope.selectAll = function() {
		var newSelections = [];
		for(var d = 0; d < 3; d++) {
			newSelections.push([]);
			newSelections[d].push({"minVal":0, "maxVal":dim[d] - 1});
		}
		selections = newSelections;
		drawSelections();
		updateLocalSelections(true);
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Parse Selection Colors
	// This method parses the selection colors.
	//===================================================================================
	function parseSelectionColors() {
		// $log.log(preDebugMsg + "parseSelectionColors");
		var colors = $scope.gimme("ColorScheme");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		selectionColors = {};

		if(colors.hasOwnProperty('selection')) {
			if(colors['selection'].hasOwnProperty('border')) {
				selectionColors.border = colors['selection']['border'];
			}
			else {
				selectionColors.border = '#FFA500'; // orange
			}

			if(colors['selection'].hasOwnProperty('color')) {
				selectionColors.color = legacyDDSupLib.hexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = legacyDDSupLib.hexColorToRGBA('#FFA500', selectionTransparency); // orange
			}

			if(colors['selection'].hasOwnProperty('gradient') && selectionCanvas !== null && selectionCanvas.width > 0 && selectionCanvas.height > 0) {
				if(selectionCanvas === null || selectionCtx === null) {
					var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
					if(selectionCanvasElement.length > 0) {
						selectionCanvas = selectionCanvasElement[0];
						selectionCtx = selectionCanvas.getContext("2d");
					}
					else {
						$log.log(preDebugMsg + "no selectionCanvas to resize!");
						return;
					}
				}

				selectionColors.grad = selectionCtx.createLinearGradient(0, 0, selectionCanvas.width, selectionCanvas.height);
				var atLeastOneAdded = false;
				for(var p = 0; p < colors['selection']['gradient'].length; p++) {
					if(colors['selection']['gradient'][p].hasOwnProperty('pos') && colors['selection']['gradient'][p].hasOwnProperty('color')) {
						selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], legacyDDSupLib.hexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
						atLeastOneAdded = true;
					}
				}
				if(!atLeastOneAdded) {
					selectionColors.grad = selectionColors.color;
				}
			}
			else {
				selectionColors.grad = selectionColors.color;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Selections
	// This method draws the selections.
	//===================================================================================
	function drawSelections() {
		if(unique > 0) {
			// $log.log(preDebugMsg + "drawSelections");
			if(selectionCanvas === null) {
				var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
				if(selectionCanvasElement.length > 0) {
					selectionCanvas = selectionCanvasElement[0];
				}
				else {
					$log.log(preDebugMsg + "no canvas to draw selections on!");
					return;
				}
			}

			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
			}

			var W = selectionCanvas.width;
			var H = selectionCanvas.height;

			selectionCtx.clearRect(0,0, W,H);

			if(selectionColors === null) {
				parseSelectionColors(W, H);
			}

			// selectionCtx.strokeStyle = selectionColors.color;
			if(currentColors && currentColors.selection && currentColors.selection.border) {
				selectionCtx.strokeStyle = currentColors.selection.border;
			}
			else if(currentColors && currentColors.skin && currentColors.skin.border) {
				selectionCtx.strokeStyle = currentColors.skin.border;
			}
			else {
				selectionCtx.strokeStyle = "#ff0000";
			}
			selectionCtx.lineWidth = 1;

			for(var d = 0; d < 3; d++) {
				for(sel = 0; sel < selections[d].length; sel++) {
					var selection = selections[d][sel];
					if(d == xAxisAxis) {
						var pos1 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.minVal, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos2 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.minVal, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos3 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.maxVal, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos4 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.maxVal, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

						pos3.x += cellW - 1;
						pos4.x += cellW - 1;
						pos1.y += cellW - 1;
						pos4.y += cellW - 1;

						selectionCtx.save();
						selectionCtx.beginPath();
						selectionCtx.moveTo(pos1.x, pos1.y);
						selectionCtx.lineTo(pos2.x, pos2.y);
						selectionCtx.lineTo(pos3.x, pos3.y);
						selectionCtx.lineTo(pos4.x, pos4.y);
						selectionCtx.lineTo(pos1.x, pos1.y);
						selectionCtx.stroke();
						selectionCtx.restore();
					}
					else if(d == yAxisAxis) {
						var pos1 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos2 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos3 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos4 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

						pos2.x += cellW - 1;
						pos3.x += cellW - 1;
						pos1.y += cellW - 1;
						pos2.y += cellW - 1;

						selectionCtx.save();
						selectionCtx.beginPath();
						selectionCtx.moveTo(pos1.x, pos1.y);
						selectionCtx.lineTo(pos2.x, pos2.y);
						selectionCtx.lineTo(pos3.x, pos3.y);
						selectionCtx.lineTo(pos4.x, pos4.y);
						selectionCtx.lineTo(pos1.x, pos1.y);
						selectionCtx.stroke();
						selectionCtx.restore();
					}
					else if(d == zAxisAxis) {
						var pos1 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos2 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos3 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
						var pos4 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);

						pos2.x += cellW - 1;
						pos3.x += cellW - 1;
						pos1.y += cellW - 1;
						pos2.y += cellW - 1;

						selectionCtx.save();
						selectionCtx.beginPath();
						selectionCtx.moveTo(pos1.x, pos1.y);
						selectionCtx.lineTo(pos2.x, pos2.y);
						selectionCtx.lineTo(pos3.x, pos3.y);
						selectionCtx.lineTo(pos4.x, pos4.y);
						selectionCtx.lineTo(pos1.x, pos1.y);
						selectionCtx.stroke();
						selectionCtx.restore();
					}
				}
			}
		}
		hideSelectionRect();
	}
	//===================================================================================


	//===================================================================================
	// Hide Selection Rectangle
	// This method hides the selection rectangle the user created.
	//===================================================================================
	function hideSelectionRect() {
		if(selectionRect === null) {
			var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
			if(selectionRectElement.length > 0) {
				selectionRect = selectionRectElement[0];
			}
			else {
				$log.log(preDebugMsg + "No selection rectangle!");
			}
		}
		if(selectionRect !== null) {
			selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
		}
	}
	//===================================================================================


	//===================================================================================
	// Mouse Position in Selectable Area
	// This method checks whether the mouse pointer is within the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > leftMarg - 2 && pos.x <= leftMarg + drawW + 2 && pos.y > topMarg - 2 && pos.y <= topMarg + drawH + 2) {
			return true;
		}
		return false;
	}
	//===================================================================================


	// ==============================================
	// ------- Unique Methods for this Webble -------
	// ==============================================

	//===================================================================================
	// Data Dropped
	// This method manages what to do with the data being dropped.
	//===================================================================================
	function dataDropped(dataSourceInfoStr, targetField) {
		try {
			var dataSourceInfo = JSON.parse(dataSourceInfoStr);

			if(typeCheck(dataSourceInfo.type, targetField.type)) {
				var srcWebble = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID);
				var accessorFunctionList = srcWebble.scope().gimme(dataSourceInfo.slotName);
				var accessorFunctions = accessorFunctionList[dataSourceInfo.fieldIdx];
				var displayNameS = dataSourceInfo.sourceName;
				var displayNameF = dataSourceInfo.fieldName;
				var somethingChanged = false;
				var newSrc = true;
				var mapSrcIdx = 0;
				for(var i = 0; i < dataMappings.length; i++) {
					if(dataMappings[i].srcID == dataSourceInfo.webbleID) {
						newSrc = false;
						mapSrcIdx = i;
						break;
					}
				}
				if(newSrc) {
					mapSrcIdx = dataMappings.length;
					dataMappings.push({'srcID':dataSourceInfo.webbleID, 'map':[], 'active':false, 'clean':true, 'slotName':dataSourceInfo.slotName});
					somethingChanged = true;
				}

				var found = false;
				for(var i = 0; i < dataMappings[mapSrcIdx].map.length; i++) {
					if(dataMappings[mapSrcIdx].map[i].name == targetField.name) { // already had something mapped here
						if(dataMappings[mapSrcIdx].map[i].srcIdx == dataSourceInfo.fieldIdx) {
							// same field dropped in same place again, nothing to do
						}
						else {
							// inform previous source that we are no longer using the data
							if(dataMappings[mapSrcIdx].hasOwnProperty("newSelections")) {
								dataMappings[mapSrcIdx].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
							}

							var onlyOne = true;
							for(var ii = 0; ii < dataMappings[mapSrcIdx].map.length; ii++) {
								if(ii != i && dataMappings[mapSrcIdx].map[ii].srcIdx == dataMappings[mapSrcIdx].map[i].srcIdx) {
									// same data field on a different axis
									onlyOne = false;
								}
							}
							if(onlyOne) {
								//  if this was the only field listening to updates, stop listening
								// $log.log(preDebugMsg + "Last one, stop listening to " + dataMappings[mapSrcIdx].map[i].name);
								dataMappings[mapSrcIdx].map[i].listen(myInstanceId, false, null, null, []);
							}

							// replace old mapping
							dataMappings[mapSrcIdx].map[i].srcIdx = dataSourceInfo.fieldIdx;
							dataMappings[mapSrcIdx].clean = false;
							somethingChanged = true;
						}
						found = true;
						break;
					}
				}

				if(!found) {
					dataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':targetField.name, 'listen':null});
					dataMappings[mapSrcIdx].clean = false;
					somethingChanged = true;
				}

				if(targetField.name == "data") {
					dragZone.ID = dataSourceInfo;
				}

				if(somethingChanged) {
					checkMappingsAndParseData();
				}
			}
			else {
				$log.log(preDebugMsg + dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
			}
		} catch(e) {
			// probably not something for us, ignore this drop
		}
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status X
	// This method checks the current selection status within X direction.
	//===================================================================================
	function mySelectionStatusX(src, idx) {
		if(dataMappings[src].active && dataMappings[src].haveXYZ) {
			var groupId = 0;
			for(var sel = 0; sel < selections[2].length; sel++) {
				if(selections[2][sel].minVal <= idx && idx <= selections[2][sel].maxVal) {
					groupId = sel + 1;
					break;
				}
			}

			if(!grouping && groupId > 0) {
				groupId = 1;
			}

			return groupId;
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status Y
	// This method checks the current selection status within Y direction.
	//===================================================================================
	function mySelectionStatusY(src, idx) {
		if(dataMappings[src].active && dataMappings[src].haveXYZ) {
			var groupId = 0;
			for(var sel = 0; sel < selections[1].length; sel++) {
				if(selections[1][sel].minVal <= idx && idx <= selections[1][sel].maxVal) {
					groupId = sel + 1;
					break;
				}
			}

			if(!grouping && groupId > 0) {
				groupId = 1;
			}

			return groupId;
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status Z
	// This method checks the current selection status within Z direction.
	//===================================================================================
	function mySelectionStatusZ(src, idx) {
		if(dataMappings[src].active && dataMappings[src].haveXYZ) {
			var groupId = 0;
			for(var sel = 0; sel < selections[0].length; sel++) {
				if(selections[0][sel].minVal <= idx && idx <= selections[0][sel].maxVal) {
					groupId = sel + 1;
					break;
				}
			}

			if(!grouping && groupId > 0) {
				groupId = 1;
			}

			return groupId;
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Draw Density Plot
	// This method drows the density plot.
	//===================================================================================
	function drawDensityPlot(W, H) {
		// $log.log(preDebugMsg + "drawDensityPlot");
		if(plotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#thePlotCanvas');
			if(myCanvasElement.length > 0) {
				plotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(plotCtx === null) {
			plotCtx = plotCanvas.getContext("2d");
		}

		if(!plotCtx) {
			$log.log(preDebugMsg + "no canvas to draw on");
			return;
		}

		plotCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		noofGroups = 0;
		var WW = plotCanvas.width;
		var HH = plotCanvas.height;
		var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, 1);
		var imData = plotCtx.getImageData(0, 0, plotCanvas.width, plotCanvas.height);
		var pixels = imData.data;

		skipOutliers = true;
		if(!$scope.gimme("IgnoreExtremeOutliers")) {
			skipOutliers = false;
		}

		drawFront(WW, HH, rgbaText, imData, pixels);
		drawSide(WW, HH, rgbaText, imData, pixels);
		drawTop(WW, HH, rgbaText, imData, pixels);

		plotCtx.putImageData(imData, 0, 0);
	}
	//===================================================================================


	//===================================================================================
	// Draw Zoom
	// This method draws the data based on current zoom level.
	//===================================================================================
	function drawZoom(WW, HH, rgbaText, imData, pixels, lengths, _2D, minVal, maxVal, rgbaText, selectedXs, selectedXls, gapsX, selectedYs, selectedYls, gapsY, sums) {
		if(selectedXs > 0 && selectedYs > 0) {
			if(gapsX > 0) {
				gapsX--;
			}

			if(gapsY > 0) {
				gapsY--;
			}

			var alphaFactor = 1;
			var zoomCellW = Math.floor((zoomSpace - gapsX) / selectedXs);
			if(zoomCellW <= 0) {
				zoomCellW = (zoomSpace - gapsX) / selectedXs;
				alphaFactor = zoomCellW;
			}

			var zoomCellH = Math.floor((zoomSpace - gapsY) / selectedYs);
			if(zoomCellH <= 0) {
				zoomCellH = (zoomSpace - gapsY) / selectedYs;
				alphaFactor = Math.min(alphaFactor, zoomCellH);
			}
			var zCellW = Math.min(zoomCellW, zoomCellH);
			var leftShift = leftMarg + (dim[xAxisAxis] + dim[zAxisAxis])*cellW + innerMarg * 2 + Math.floor((zoomSpace - zCellW * selectedXs - gapsX) / 2);
			var ypos = Math.floor((HH - zoomSpace) / 2) + zoomSpace - Math.floor((zoomSpace - zCellW * selectedYs - gapsY) / 2);

			for(var b = 0; b < lengths[yAxisAxis]; b++) {
				if(!selectedYls[b] && b > 0 && selectedYls[b - 1]) {
					ypos -= 1;
				}

				if(selectedYls[b]) {
					ypos -= zCellW;
					var xpos = leftShift - zCellW;

					for(var a = 0; a < lengths[xAxisAxis]; a++) {
						if(!selectedXls[a] && a > 0 && selectedXls[a - 1]) {
							xpos += 1;
						}

						if(selectedXls[a]) {
							xpos += zCellW;
							var val = _2D[b][a];
							if(val !== null) {
								var col = valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums);
								col[3] *= alphaFactor;
								legacyDDSupLib.fillRectFast(Math.round(xpos), Math.round(ypos), Math.ceil(zCellW), Math.ceil(zCellW), col[0], col[1], col[2], col[3], pixels, WW, HH);
							}
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Front
	// This method draws the front part of the fake 3D plot.
	//===================================================================================
	function drawFront(WW, HH, rgbaText, imData, pixels) {
		// $log.log(preDebugMsg + "drawFront");
		var _2D = [];
		var maxVal = null;
		var minVal = null;
		var sums = [];
		var selectedXs = 0;
		var selectedXls = [];
		var gapsX = 0;
		var lastXSelected = false;
		var selectedYs = 0;
		var selectedYls = [];
		var gapsY = 0;
		var lastYSelected = false;

		for(var b = 0; b < dim[yAxisAxis]; b++) {
			_2D.push([]);
			var ySelected = false;

			for(var sel = 0; sel < selections[yAxisAxis].length; sel++) {
				if(selections[yAxisAxis][sel].minVal <= b && b <= selections[yAxisAxis][sel].maxVal) {
					ySelected = true;
					break;
				}
			}

			if(ySelected) {
				if(!lastYSelected) {
					gapsY++;
				}
				selectedYs++;
				lastYSelected = true;
			}
			else {
				lastYSelected = false;
			}
			selectedYls.push(ySelected);

			for(var a = 0; a < dim[xAxisAxis]; a++) {
				var xSelected = false;
				for(var sel = 0; sel < selections[xAxisAxis].length; sel++) {
					if(selections[xAxisAxis][sel].minVal <= a && a <= selections[xAxisAxis][sel].maxVal) {
						xSelected = true;
						break;
					}
				}

				if(b == 0) {
					if(xSelected) {
						if(!lastXSelected) {
							gapsX++;
						}
						selectedXs++;
						lastXSelected = true;
					}
					else {
						lastXSelected = false;
					}
					selectedXls.push(xSelected);
				}

				var sum = 0;
				var sawNull = false;
				var sawOnlyNull = true;

				if(xSelected && ySelected) {
					var coords = [0, 0, 0];
					coords[xAxisAxis] = a;
					coords[yAxisAxis] = b;

					for(var src = 0; src < dataMappings.length; src++) {
						if(dataMappings[src].active) {
							var selfuns = [dataMappings[src].selFunZ, dataMappings[src].selFunY, dataMappings[src].selFunX];

							for(var cube = 0; cube < dataMappings[src].size; cube++) {
								if(dataMappings[src].selFun(cube) > 0) {
									if(!dataMappings[src].haveXYZ || (selfuns[xAxisAxis](a) && selfuns[yAxisAxis](b))) {
										for(var c = 0; c < dim[zAxisAxis]; c++) {
											coords[zAxisAxis] = c;
											var zSelected = false;
											if(dataMappings[src].haveXYZ) {
												zSelected = selfuns[zAxisAxis](c);
											}
											else {
												for(var sel = 0; sel < selections[zAxisAxis].length; sel++) {
													if(selections[zAxisAxis][sel].minVal <= c && c <= selections[zAxisAxis][sel].maxVal) {
														zSelected = true;
														break;
													}
												}
											}

											if(zSelected) {
												var val = dataMappings[src].valFun(cube)[coords[0]][coords[1]][coords[2]];

												if(val === null) {
													sawNull = true;
												}
												else if(skipOutliers && Math.abs(val - outLierStuff[src][cube].mean) > outLierStuff[src][cube].cutOff) {
													// treat as null
													sawNull = true;
												} else {
													sawOnlyNull = false;
													sum += val;
												}
											}
										}
									}
								}
							}
						}
					}
				}

				if(sawNull && sawOnlyNull) {
					_2D[b].push(null);
				}
				else if(sawOnlyNull) { // cell not selected
					_2D[b].push(null);
				}
				else {
					_2D[b].push(sum);

					if(colorMode == 3) { // histogram
						sums.push(sum);
					}

					if(maxVal === null || sum > maxVal) {
						maxVal = sum;
					}

					if(minVal === null || sum < minVal) {
						minVal = sum;
					}
				}
			}
		}

		if(colorMode == 3 && sums.length > 0) { // histogram
			sums.sort(function(a,b) {return a - b;});
			var tmp = [sums[0]];
			var last = 0;
			for(var t = 1; t < sums.length; t++) {
				if(sums[t] != tmp[last]) {
					tmp.push(sums[t]);
					last++;
				}
			}
			sums = tmp;
		}

		for(var b = 0; b < dim[yAxisAxis]; b++) {
			for(var a = 0; a < dim[xAxisAxis]; a++) {
				var val = _2D[b][a];

				if(val !== null) {
					var pos = legacyDDSupLib.dimVals2pixels(xAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
					var col = valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums);
					legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
				}
			}
		}

		if(zoomSpace > 0) {
			drawZoom(WW, HH, rgbaText, imData, pixels, dim, _2D, minVal, maxVal, rgbaText, selectedXs, selectedXls, gapsX, selectedYs, selectedYls, gapsY, sums);
		}
	}
	//===================================================================================


	//===================================================================================
	// Value to Intensity or Color
	// This method converts a value to a intensity or color value.
	//===================================================================================
	function valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums) {
		if(minVal === null && maxVal === null) {
			minVal = 0;
			maxVal = 1;
		}
		if(minVal === null) {
			minVal = 0;
		}
		if(maxVal === null) {
			maxVal = 0;
		}

		var col = [0, 0, 0, 255];
		if(colorMode == 1) { // minmax
			var alpha = Math.max(0, Math.min(255, Math.floor(256 * (val - minVal) / (maxVal - minVal))));
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}
		else if(colorMode == 2) { // hotcold
			if(val < 0) {
				var intensity = Math.max(0, Math.min(255, Math.floor(256 * Math.abs(val) / Math.abs(minVal))));
				col = [0, 0, intensity, 255];
			}
			else {
				var intensity = Math.max(0, Math.min(255, Math.floor(256 * Math.abs(val) / Math.abs(maxVal))));
				col = [intensity, 0, 0, 255];
			}
		}
		else if(colorMode == 0) { // absolute
			var mx = Math.max(Math.abs(minVal), Math.abs(maxVal));
			var alpha = Math.max(0, Math.min(255, Math.floor(256 * Math.abs(val) / mx)));
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}
		else if(colorMode == 3 && sums.length > 0) { // histogram
			var sortedPos = legacyDDSupLib.binLookup(sums, val, 0, sums.length);
			var perc = sortedPos / (sums.length - 1);
			var alpha = Math.floor(255 * perc);
			col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
		}

		return col;
	}
	//===================================================================================


	//===================================================================================
	// Draw Side
	// This method draws the side part of the fake 3D plot.
	//===================================================================================
	function drawSide(WW, HH, rgbaText, imData, pixels) {
		var _2D = [];
		var maxVal = null;
		var minVal = null;
		var sums = [];

		for(var b = 0; b < dim[yAxisAxis]; b++) {
			_2D.push([]);
			var ySelected = false;
			for(var sel = 0; sel < selections[yAxisAxis].length; sel++) {
				if(selections[yAxisAxis][sel].minVal <= b && b <= selections[yAxisAxis][sel].maxVal) {
					ySelected = true;
					break;
				}
			}

			for(var a = 0; a < dim[zAxisAxis]; a++) {
				var zSelected = false;
				for(var sel = 0; sel < selections[zAxisAxis].length; sel++) {
					if(selections[zAxisAxis][sel].minVal <= a && a <= selections[zAxisAxis][sel].maxVal) {
						zSelected = true;
						break;
					}
				}

				var sum = 0;
				var sawNull = false;
				var sawOnlyNull = true;

				if(ySelected && zSelected) {
					var coords = [0, 0, 0];
					coords[zAxisAxis] = a;
					coords[yAxisAxis] = b;

					for(var src = 0; src < dataMappings.length; src++) {
						var selfuns = [dataMappings[src].selFunZ, dataMappings[src].selFunY, dataMappings[src].selFunX];

						if(dataMappings[src].active) {
							for(var cube = 0; cube < dataMappings[src].size; cube++) {
								if(dataMappings[src].selFun(cube) > 0) {
									if(!dataMappings[src].haveXYZ || (selfuns[zAxisAxis](a) && selfuns[yAxisAxis](b))) {
										for(var c = 0; c < dim[xAxisAxis]; c++) {
											coords[xAxisAxis] = c;
											var xSelected = false;

											if(dataMappings[src].haveXYZ) {
												xSelected = selfuns[xAxisAxis](c);
											}
											else {
												for(var sel = 0; sel < selections[xAxisAxis].length; sel++) {
													if(selections[xAxisAxis][sel].minVal <= c && c <= selections[xAxisAxis][sel].maxVal) {
														xSelected = true;
														break;
													}
												}
											}
											if(xSelected) {
												var val = dataMappings[src].valFun(cube)[coords[0]][coords[1]][coords[2]];

												if(val === null) {
													sawNull = true;
												}
												else if(skipOutliers && Math.abs(val - outLierStuff[src][cube].mean) > outLierStuff[src][cube].cutOff) {
													// treat as null
													sawNull = true;
												}
												else {
													sawOnlyNull = false;
													sum += val;
												}
											}
										}
									}
								}
							}
						}
					}
				}

				if(sawNull && sawOnlyNull) {
					_2D[b].push(null);
				}
				else if(sawOnlyNull) { // cell not selected
					_2D[b].push(null);
				}
				else {
					_2D[b].push(sum);

					if(colorMode == 3) { //histogram
						sums.push(sum);
					}

					if(maxVal === null || sum > maxVal) {
						maxVal = sum;
					}

					if(minVal === null || sum < minVal) {
						minVal = sum;
					}
				}
			}
		}

		if(colorMode == 3 && sums.length > 0) { // histogram
			sums.sort(function(a,b) {return a - b;});
			var tmp = [sums[0]];
			var last = 0;
			for(var t = 1; t < sums.length; t++) {
				if(sums[t] != tmp[last]) {
					tmp.push(sums[t]);
					last++;
				}
			}
			sums = tmp;
		}

		for(var b = 0; b < dim[yAxisAxis]; b++) {
			for(var a = 0; a < dim[zAxisAxis]; a++) {
				var val = _2D[b][a];
				if(val !== null) {
					var pos = legacyDDSupLib.dimVals2pixels(yAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
					var col = valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums);
					legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Top
	// This method draws the top part of the fake 3D plot.
	//===================================================================================
	function drawTop(WW, HH, rgbaText, imData, pixels) {
		var _2D = [];
		var maxVal = null;
		var minVal = null;
		var sums = [];

		for(var b = 0; b < dim[zAxisAxis]; b++) {
			_2D.push([]);
			var zSelected = false;
			for(var sel = 0; sel < selections[zAxisAxis].length; sel++) {
				if(selections[zAxisAxis][sel].minVal <= b && b <= selections[zAxisAxis][sel].maxVal) {
					zSelected = true;
					break;
				}
			}

			for(var a = 0; a < dim[xAxisAxis]; a++) {
				var xSelected = false;
				for(var sel = 0; sel < selections[xAxisAxis].length; sel++) {
					if(selections[xAxisAxis][sel].minVal <= a && a <= selections[xAxisAxis][sel].maxVal) {
						xSelected = true;
						break;
					}
				}

				var sum = 0;
				var sawNull = false;
				var sawOnlyNull = true;

				if(xSelected && zSelected) {
					var coords = [0, 0, 0];
					coords[xAxisAxis] = a;
					coords[zAxisAxis] = b;

					for(var src = 0; src < dataMappings.length; src++) {
						if(dataMappings[src].active) {
							var selfuns = [dataMappings[src].selFunZ, dataMappings[src].selFunY, dataMappings[src].selFunX];

							for(var cube = 0; cube < dataMappings[src].size; cube++) {
								if(dataMappings[src].selFun(cube) > 0) {
									if(!dataMappings[src].haveXYZ || (selfuns[xAxisAxis](a) && selfuns[zAxisAxis](b))) {
										for(var c = 0; c < dim[yAxisAxis]; c++) {
											coords[yAxisAxis] = c;

											var ySelected = false;
											if(dataMappings[src].haveXYZ) {
												ySelected = selfuns[yAxisAxis](c);
											}
											else {
												for(var sel = 0; sel < selections[yAxisAxis].length; sel++) {
													if(selections[yAxisAxis][sel].minVal <= c && c <= selections[yAxisAxis][sel].maxVal) {
														ySelected = true;
														break;
													}
												}
											}

											if(ySelected) {
												var val = dataMappings[src].valFun(cube)[coords[0]][coords[1]][coords[2]];
												if(val === null) {
													sawNull = true;
												}
												else if(skipOutliers && Math.abs(val - outLierStuff[src][cube].mean) > outLierStuff[src][cube].cutOff) {
													// treat as null
													sawNull = true;
												} else {
													sawOnlyNull = false;
													sum += val;
												}
											}
										}
									}
								}
							}
						}
					}
				}

				if(sawNull && sawOnlyNull) {
					_2D[b].push(null);
				}
				else if(sawOnlyNull) { // cell not selected
					_2D[b].push(null);
				}
				else {
					_2D[b].push(sum);

					if(colorMode == 3) { // histogram
						sums.push(sum);
					}

					if(maxVal === null || sum > maxVal) {
						maxVal = sum;
					}

					if(minVal === null || sum < minVal) {
						minVal = sum;
					}
				}
			}
		}

		if(colorMode == 3 && sums.length > 0) { // histogram
			sums.sort(function(a,b) {return a - b;});
			var tmp = [sums[0]];
			var last = 0;
			for(var t = 1; t < sums.length; t++) {
				if(sums[t] != tmp[last]) {
					tmp.push(sums[t]);
					last++;
				}
			}
			sums = tmp;
		}

		for(var b = 0; b < dim[zAxisAxis]; b++) {
			for(var a = 0; a < dim[xAxisAxis]; a++) {
				var val = _2D[b][a];

				if(val !== null ){
					var pos = legacyDDSupLib.dimVals2pixels(zAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim, true);
					var col = valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums);
					legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
				}
			}
		}
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
