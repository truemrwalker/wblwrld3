//======================================================================================================================
// Controllers for Digital Dashboard Plugin 3D Density Plot Adv Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('densityPlotAdvPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.displayText = "Density Plot Advanced";
    $scope.dataSetName = "";
	var preDebugMsg = "DigitalDashboard Advanced 3D Density Plot: ";

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
    var quickRenderThreshold = 500;
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
    var lastSeenGlobalSelections = [];

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
    var colorPalette = null;
    var useGlobalGradients = false;
    var colorMode = "minmax";
    var clickStart = null;

    // data from parent
    var idArrays = [];
    var _3DArrays = [];
    var sources = 0;
    var Ns = [];
    var N = 0;
    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
    var zoomMinX = 0;
    var zoomMaxX = 0;
    var zoomMinY = 0;
    var zoomMaxY = 0;
    var unique = 0; // number of data points with non-null values
    var NULLs = 0;
    var skipOutliers = true;
    var outLierStuff = [];
    var localSelections = []; // the data to send to the parent
    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;
    var internalSelectionsInternallySetTo = {};
    var xAxisAxis = 0;
    var yAxisAxis = 1;
    var zAxisAxis = 2;

    // Drag & Drop Interaction
    var dropZ = {'left':leftMarg, 'top':topMarg, 'right':leftMarg+drawW, 'bottom':topMarg+drawH, "forParent":{'idSlot':'DataIdSlot', 'name':'3D Density Data', 'type':'3Darray', 'slot':'Data'}, "label":"Data", "rotate":false};
    var allDropZones = [dropZ];
    var dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZone];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";

    // Memory
    var lastDrawW = null;
    var lastDrawH = null;
    var lastFontSize = null;
    var lastTextColor = null;
    var lastColors = null;
    var lastZoomMinX = null;
    var lastZoomMaxX = null;
    var lastZoomMinY = null;
    var lastZoomMaxY = null;
    var lastCellW = null;
    var lastZoomSpace = null;
    var lastXAxisAxis = null;
    var lastYAxisAxis = null;
    var lastZAxisAxis = null;
    var lastColorMode = null;



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
		switch(eventData.slotName) {
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
					selectAll();
					$scope.set("SelectAll",false);
				}
				break;
			case "InternalSelections":
				if(eventData.slotValue != internalSelectionsInternallySetTo) {
					setSelectionsFromSlotValue();
				}
				break;
			case "QuickRenderThreshold":
				var newThreshold = parseFloat($scope.gimme("QuickRenderThreshold"));
				if(!isNaN(newThreshold) && isFinite(newThreshold) && newThreshold > 0) {
					if(newThreshold != quickRenderThreshold) {
						var oldState = unique > quickRenderThreshold;
						var newState = unique > newThreshold;

						quickRenderThreshold = newThreshold;
						if(oldState != newState) {
							updateGraphicsHelper(false, true, false);
						}
					}
				}
				break;
			case "TreatNullAsUnselected":
				updateGraphicsHelper(false, true, false);
				break;
			case "MaxX":
				var newZoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
				if(newZoomMaxX <= zoomMinX) {
					newZoomMaxX = Math.min(zoomMinX + 1, limits.maxX, zoomMaxX);
				}
				$scope.set("MaxX", newZoomMaxX);

				if(newZoomMaxX != zoomMaxX) {
					zoomMaxX = newZoomMaxX;
					updateGraphicsHelper(false, true, true);
				}
				break;
			case "MaxY":
				var newZoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);
				if(newZoomMaxY <= zoomMinY) {
					newZoomMaxY = Math.min(zoomMinY + 1, limits.maxY, zoomMaxY);
				}
				$scope.set("MaxY", newZoomMaxY);

				if(newZoomMaxY != zoomMaxY) {
					zoomMaxY = newZoomMaxY;
					updateGraphicsHelper(false, true, true);
				}
				break;
			case "MinX":
				var newZoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
				if(newZoomMinX >= zoomMaxX) {
					newZoomMinX = Math.max(zoomMaxX - 1, limits.minX, zoomMinX);
				}
				$scope.set("MinX", newZoomMinX);

				if(newZoomMinX != zoomMinX) {
					zoomMinX = newZoomMinX;
					updateGraphicsHelper(false, true, true);
				}
				break;
			case "MinY":
				var newZoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
				if(newZoomMinY >= zoomMaxY) {
					newZoomMinY = Math.max(zoomMaxY - 1, limits.minY, zoomMinY);
				}
				$scope.set("MinY", newZoomMinY);

				if(newZoomMinY != zoomMinY) {
					zoomMinY = newZoomMinY;
					updateGraphicsHelper(false, true, true);
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
			case "UseGlobalColorGradients":
				if(eventData.slotValue) {
					if(!useGlobalGradients) {
						useGlobalGradients = true;
						updateGraphicsHelper(false, true, false);
					}
				}
				else {
					if(useGlobalGradients) {
						useGlobalGradients = false;
						updateGraphicsHelper(false, true, false);
					}
				}
				break;
			case "PluginName":
				$scope.displayText = eventData.slotValue;
				break;
			case "PluginType":
				if(eventData.slotValue != "VisualizationPlugin") {
					$scope.set("PluginType", "VisualizationPlugin");
				}
				break;
			case "ExpectedFormat":
				break;
			case "GlobalSelections":
				checkIfGlobalSelectionsActuallyChanged();
				break;
			case "Highlights":
				updateGraphicsHelper(false, false, false);
				break;
			case "GroupColors":
				colorPalette = null;
				parseSelectionColors();
				var colors = $scope.gimme("GroupColors");
				if(typeof colors === 'string') {
					colors = JSON.parse(colors);
				}
				currentColors = legacyDDSupLib.copyColors(colors);

				updateGraphicsHelper(false, false, false);
				drawSelections();
				break;
			case "DataValuesSetFilled":
				parseData();
				break;
			case "ColorMode":
				var newVal = $scope.gimme("ColorMode");
				if(newVal == "minmax" || newVal == "hotcold" || newVal == "abs" || newVal == "histogram") {
					if(newVal != colorMode) {
						colorMode = newVal;
						updateGraphicsHelper(false, false, false);
					}
				}
				else {
					$scope.set("ColorMode", colorMode);
				}
				break;
		};
	}
	//===================================================================================


	//===================================================================================
	// On Mouse Move
	// This event handler manages Mouse Movement.
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
					//$log.log(preDebugMsg + "No hover text!");
				}
			}

			var dimAndVal = legacyDDSupLib.pixels2dimVals(currentMouse, unique, dim, leftMarg, topMarg, drawH, xAxisAxis, yAxisAxis, cellW, zAxisAxis, innerMarg);

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
						//$log.log(preDebugMsg + "No selection rectangle!");
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
							var pos1 = legacyDDSupLib.dimVals2pixels(xAxisAxis, clickStart.val, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos2 = legacyDDSupLib.dimVals2pixels(xAxisAxis, clickStart.val, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos3 = legacyDDSupLib.dimVals2pixels(xAxisAxis, dimAndVal.val, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos4 = legacyDDSupLib.dimVals2pixels(xAxisAxis, dimAndVal.val, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

							selectionRectCtx.save();
							selectionRectCtx.beginPath();
							selectionRectCtx.moveTo(pos1.x, pos1.y);
							selectionRectCtx.lineTo(pos2.x, pos2.y);
							selectionRectCtx.lineTo(pos3.x, pos3.y);
							selectionRectCtx.lineTo(pos4.x, pos4.y);
							selectionRectCtx.lineTo(pos1.x, pos1.y);
							selectionRectCtx.stroke();
							selectionRectCtx.restore();
						} else if(clickStart.dim == yAxisAxis) {
							var pos1 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos2 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos3 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos4 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

							selectionRectCtx.save();
							selectionRectCtx.beginPath();
							selectionRectCtx.moveTo(pos1.x, pos1.y);
							selectionRectCtx.lineTo(pos2.x, pos2.y);
							selectionRectCtx.lineTo(pos3.x, pos3.y);
							selectionRectCtx.lineTo(pos4.x, pos4.y);
							selectionRectCtx.lineTo(pos1.x, pos1.y);
							selectionRectCtx.stroke();
							selectionRectCtx.restore();
						} else if(clickStart.dim == zAxisAxis) {
							var pos1 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos2 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, clickStart.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos3 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var pos4 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, dimAndVal.val, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

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
					} else { // dimensions are not the same
						hideSelectionRect();
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Down
	// This event handler manages Mouse button down.
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
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Up
	// This event handler manages Mouse button up.
	//===================================================================================
	var onMouseUp = function(e){
		if(unique > 0) {
			selectionHolderElement.unbind('mouseup');

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
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
	// This event handler manages Mouse pointer leaving area.
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
					//$log.log(preDebugMsg + "No hover text!");
				}
			}
			if(hoverText !== null) {
				hoverText.style.display = "none";
			}

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
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
	// Key Pressed
	// This event handler manages keyboard key press.
	//===================================================================================
	function keyPressed(eventData) {
		if(mouseIsOverMe && !eventData.key.released) {
			var keyName = eventData.key.name;

			switch(keyName) {
				case '+':
				case "= +":
					zoomIn();
					break;
				case '-':
				case "- _":
					zoomOut();
					break;
				case "Left Arrow":
					panLeft();
					break;
				case "Right Arrow":
					panRight();
					break;
				case "Down Arrow":
					panDown();
					break;
				case "Up Arrow":
					panUp();
					break;
				case 'z':
				case 'Z':
					zoomIn();
					break;
				case 'x':
				case 'X':
					zoomOut();
					break;
				case 'a':
				case 'A':
					panLeft();
					break;
				case 'd':
				case 'D':
					panRight();
					break;
				case 's':
				case 'S':
					panDown();
					break;
				case 'w':
				case 'W':
					panUp();
					break;
			}
		}
	}
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

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DataDropped',
			{},
			"Data Dropped",
			'Slot to notify parent that data has been dropped on this plugin using drag&drop.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataDropped').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('IgnoreExtremeOutliers',
			true,
			"Ignore Extreme Outliers",
			'Treat very extreme data points like null values (do not draw).',
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

		// internal slots specific to this Webble -----------------------------------------------------------
		$scope.addSlot(new Slot('ColorMode',
			colorMode,
			"Color Mode",
			'The way to represent the values with colors. "abs" = absolute value mapped to intensity, "minmax" = intensity scale from minimum value to maximum value, "hotcold" = two intensity scales, one for negative values and one for positive values.',
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

		$scope.addSlot(new Slot('MinX',
			0,
			"Minimum X",
			'The minimum X value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('MaxX',
			1,
			"Maximum X",
			'The maximum X value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinY',
			0,
			"Minimum Y",
			'The minimum Y value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('MaxY',
			1,
			"Maximum Y",
			'The maximum Y value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
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


		// Dashboard Plugin slots -----------------------------------------------------------
		$scope.addSlot(new Slot('PluginName',
			"Density Plot Advanced",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginType',
			"VisualizationPlugin",
			"Plugin Type",
			'The type of plugin this is. Should always be "VisualizationPlugin".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ExpectedFormat',
			[[{'idSlot':'DataIdSlot', 'name':'3D Density Data', 'type':'3Darray', 'slot':'Data'}]],
			"Expected Format",
			'The input this plugin accepts.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// slots for data input -----------------------------------------------------------
		$scope.addSlot(new Slot('Data',
			[[[[1,1],[3,4]],[[3,1],[3,1]], [[2,1],[3,2]],[[3,2],[2,1]]]],
			"Data",
			'The slot where the input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('Data').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('DataIdSlot',
			[[1,2,3,4,5,6]],
			"Data ID Slot",
			'The slot where the IDs of the input data items should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		// Which data items have been selected locally (output from this webble)
		$scope.addSlot(new Slot('LocalSelections',
			{},
			"Local Selections",
			'Output Slot. A dictionary mapping data IDs to the group they are grouped into using only this plugin.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('LocalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		// set to indicate that the local selections have changed
		$scope.addSlot(new Slot('LocalSelectionsChanged',
			false,
			"Local Selections Changed",
			'Hack to work around problems in Webble World.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Which data items have been highlighted, locally (output from this webble)
		$scope.addSlot(new Slot('LocalHighlights',
			{},
			"Local Highlights",
			'Output Slot. A dictionary telling which data IDs should be highlighted.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('LocalHighlights').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		// Which data items have been selected, globally (input to this webble)
		$scope.addSlot(new Slot('GlobalSelections',
			{},
			"Global Selections",
			'Input Slot. A dictionary mapping data IDs to groups. Specifying what data items to draw in what colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('GlobalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		// Which data items have been highlighted globally
		$scope.addSlot(new Slot('Highlights',
			{},
			"Highlights",
			'Input Slot. A dictionary specifying which IDs to highlight.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('Highlights').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		// // colors of groups of data, and the background color theme
		$scope.addSlot(new Slot('GroupColors',
			{"skin":{"color":"#8FBC8F", "border":"#8FBC8F", "gradient":[{"pos":0, "color":"#E9F2E9"}, {"pos":0.75, "color":"#8FBC8F"}, {"pos":1, "color":"#8FBC8F"}]},
				"selection":{"color":"#FFA500", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFEDCC"}, {"pos":1, "color":"#FFA500"}]},
				"groups":{0:{"color":"#A9A9A9", "gradient":[{"pos":0, "color":"#EEEEEE"}, {"pos":0.75, "color":"#A9A9A9"}]},
					1:{"color":"#0000FF", "gradient":[{"pos":0, "color":"#CCCCFF"}, {"pos":0.75, "color":"#0000FF"}]},
					2:{"color":"#7FFF00", "gradient":[{"pos":0, "color":"#E5FFCC"}, {"pos":0.75, "color":"#7FFF00"}]},
					3:{"color":"#8A2BE2", "gradient":[{"pos":0, "color":"#E8D5F9"}, {"pos":0.75, "color":"#8A2BE2"}]},
					4:{"color":"#FF7F50", "gradient":[{"pos":0, "color":"#FFE5DC"}, {"pos":0.75, "color":"#FF7F50"}]},
					5:{"color":"#DC143C", "gradient":[{"pos":0, "color":"#F8D0D8"}, {"pos":0.75, "color":"#DC143C"}]},
					6:{"color":"#006400", "gradient":[{"pos":0, "color":"#CCE0CC"}, {"pos":0.75, "color":"#006400"}]},
					7:{"color":"#483D8B", "gradient":[{"pos":0, "color":"#DAD8E8"}, {"pos":0.75, "color":"#483D8B"}]},
					8:{"color":"#FF1493", "gradient":[{"pos":0, "color":"#FFD0E9"}, {"pos":0.75, "color":"#FF1493"}]},
					9:{"color":"#1E90FF", "gradient":[{"pos":0, "color":"#D2E9FF"}, {"pos":0.75, "color":"#1E90FF"}]},
					10:{"color":"#FFD700", "gradient":[{"pos":0, "color":"#FFF7CC"}, {"pos":0.75, "color":"#FFD700"}]},
					11:{"color":"#8B4513", "gradient":[{"pos":0, "color":"#E8DAD0"}, {"pos":0.75, "color":"#8B4513"}]},
					12:{"color":"#FFF5EE", "gradient":[{"pos":0, "color":"#FFFDFC"}, {"pos":0.75, "color":"#FFF5EE"}]},
					13:{"color":"#00FFFF", "gradient":[{"pos":0, "color":"#CCFFFF"}, {"pos":0.75, "color":"#00FFFF"}]},
					14:{"color":"#000000", "gradient":[{"pos":0, "color":"#CCCCCC"}, {"pos":0.75, "color":"#000000"}]}
				}},
			"Group Colors",
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// This tells us what fields of data the parent has filled for us, and what labels to use on axes for these fields.
		$scope.addSlot(new Slot('DataValuesSetFilled',
			[],
			"Data Values Set Filled",
			'Input Slot. Specifies which data slots were filled with data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		updateGraphicsHelper(false, false, false);

		selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		if(selectionHolderElement !== null){
			selectionHolderElement.bind('mousedown', onMouseDown);
			selectionHolderElement.bind('mousemove', onMouseMove);
			selectionHolderElement.bind('mouseout', onMouseOut);
		}
		else {
			//$log.log(preDebugMsg + "No selectionHolderElement, could not bind mouse listeners");
		}

		$scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
			keyPressed(eventData);
		});

		$scope.fixDroppable();
		$scope.fixDraggable();
	};
	//===================================================================================


	//===================================================================================
	// Fix Draggable
	// This method fixes issues with draggable functionality.
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
	// This method fixes issues with droppable functionality.
	//===================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('.canvasStuffForDigitalDashboard3DDensity').droppable({
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
							f = dropZone.forParent;
							ok = true;
						}
					}
					if(ok) {
						$scope.set('DataDropped', {"dataSourceField":ui.draggable.attr('id'), "pluginField":f});
					}
				}
				updateDropZones(textColor, 0.3, false);
			}
		});
	};
	//===================================================================================


	//===================================================================================
	// Save Selections in Slot
	// This method saves the selection values into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		//$log.log(preDebugMsg + "saveSelectionsInSlot");
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
	// Set Selections From Slot Value
	// This method sets the selection from the values found in a slot.
	//===================================================================================
	function setSelectionsFromSlotValue() {
		//$log.log(preDebugMsg + "setSelectionsFromSlotValue");
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
				selectAll();
			}
			else {
				selections = newSelections;
				updateGraphicsHelper(false, true, false);
				drawSelections();
			}
		}
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets the main variables of this plugin Webble.
	//===================================================================================
	function resetVars() {
		idArrays = [];
		_3DArrays = [];
		$scope.dataSetName = "";
		dataName = null;
		dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		sources = 0;
		Ns = [];
		unique = 0;
		localSelections = [];
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		//$log.log(preDebugMsg + "parseData");

		// parse parents instructions on where to find data, check that at least one data set is filled
		var atLeastOneFilled = false;
		var parentInput = $scope.gimme('DataValuesSetFilled');
		if(typeof parentInput === 'string') {
			parentInput = JSON.parse(parentInput);
		}

		resetVars();

		if(parentInput.length > 0) {
			var haveX = false;
			for(var i = 0; i < parentInput.length; i++) {
				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "3D Density Data") {
					haveX = true;
					dragZone.name = "Data";
					dropZ.forParent.vizName = $scope.gimme("PluginName");
					dragZone.ID = JSON.stringify(dropZ.forParent);

					if(parentInput[i].hasOwnProperty("description")) {
						// $scope.dataSetName = parentInput[i]["description"];
						dataName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
						dragZone.name = dataName;
					}
				}
			}

			if(haveX) {
				atLeastOneFilled = true;
			}
		}

		// $log.log(preDebugMsg + "read parent input ", atLeastOneFilled);
		var dataIsCorrupt = false;

		if(atLeastOneFilled) {
			idArrays = $scope.gimme('DataIdSlot');
			_3DArrays = $scope.gimme('Data');

			if(idArrays.length != _3DArrays.length) {
				dataIsCorrupt = true;
			}
			if(idArrays.length <= 0) {
				dataIsCorrupt = true;
			}

			if(!dataIsCorrupt) {
				sources = idArrays.length;
				for(var source = 0; source < sources; source++) {
					var idArray = idArrays[source];
					var _3DArray = _3DArrays[source];

					if(idArray.length != _3DArray.length) {
						dataIsCorrupt = true;
					}

					if(idArray.length <= 0) {
						dataIsCorrupt = true;
					}

					for(var n = 0; n < _3DArrays[source].length; n++) {
						unique++;
					}
					Ns.push(_3DArrays[source].length);
				}
			}

			if(dataIsCorrupt) {
				//$log.log(preDebugMsg + "data is corrupt");
				resetVars();
			} else {
				var firstX = true;
				var firstY = true;
				var firstZ = true;

				for(var source = 0; source < sources; source++) {
					var _3DArray = _3DArrays[source];
					for(var dataSet = 0; dataSet < _3DArrays[source].length; dataSet++) {
						if(firstX) {
							firstX = false;
							dim[0] = _3DArray[dataSet].length;
						}
						else {
							if(dim[0] != _3DArray[dataSet].length) {
								dataIsCorrupt = true;
								//$log.log(preDebugMsg + "arrays have different lengths");
							}
						}

						for(var x = 0; x < _3DArray[dataSet].length; x++) {
							if(firstY) {
								firstY = false;
								dim[1] = _3DArray[dataSet][x].length;
							}
							else {
								if(dim[1] != _3DArray[dataSet][x].length) {
									dataIsCorrupt = true;
									//$log.log(preDebugMsg + "arrays have different lengths");
								}
							}

							for(var y = 0; y < _3DArray[dataSet][x].length; y++) {

								if(firstZ) {
									firstZ = false;
									dim[2] = _3DArray[dataSet][x][y].length;
								} else {
									if(dim[2] != _3DArray[dataSet][x][y].length) {
										dataIsCorrupt = true;
										//$log.log(preDebugMsg + "arrays have different lengths");
									}
								}
							}
						}
					}
				}
				//$log.log(preDebugMsg + "using dimensions: (" + dim[0] + "," + dim[1] + "," + dim[2] + ")");
			}
		}
		else {
			//$log.log(preDebugMsg + "no data");
		}

		outLierStuff = [];
		for(var source = 0; source < sources; source++) {
			var _3DArray = _3DArrays[source];
			outLierStuff.push([]);

			for(var dataSet = 0; dataSet < _3DArrays[source].length; dataSet++) {
				outLierStuff[source].push({});

				var sum = 0;
				var sum2 = 0;
				var n = 0;

				for(var x = 0; x < _3DArray[dataSet].length; x++) {
					for(var y = 0; y < _3DArray[dataSet][x].length; y++) {
						for(var z = 0; z < _3DArray[dataSet][x][y].length; z++) {
							var v = _3DArray[dataSet][x][y][z];
							if(v !== null) {
								n++;
								sum += v;
								sum2 += v*v;
							}
						}
					}
				}

				outLierStuff[source][dataSet]["n"] = n;

				if(n > 0) {
					var mean = sum / n;
					var variance = sum2 / n - mean*mean;
					var stddev = Math.sqrt(variance);
					var cutOff = stddev * 10;

					outLierStuff[source][dataSet]["mean"] = mean;
					outLierStuff[source][dataSet]["cutOff"] = cutOff;
				}
			}
		}

		updateGraphicsHelper(false, true, false);

		if(unique > 0) {
			selectAll();
		} else { // no data
			$scope.set('LocalSelections', {'DataIdSlot':[]});

			if(selectionCanvas === null) {
				var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
				if(selectionCanvasElement.length > 0) {
					selectionCanvas = selectionCanvasElement[0];
				}
				else {
					//$log.log(preDebugMsg + "no selectionCanvas to resize!");
					return;
				}
			}

			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
				var W = selectionCanvas.width;
				var H = selectionCanvas.height;
				selectionCtx.clearRect(0,0, W,H);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics Helper
	// This method updates the graphic to correct represent the current state of the
	// plugin.
	//===================================================================================
	function updateGraphicsHelper(forceBackground, forceCells, forceAxes) {
		//$log.log(preDebugMsg + "updateGraphics()");

		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
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
			var colors = $scope.gimme("GroupColors");
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

		zoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
		zoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
		zoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
		zoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);
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
		//$log.log(preDebugMsg + "use dimension " + xAxisAxis + " on X axis, dimension " + yAxisAxis + " on Y axis, and dimension " + zAxisAxis + " as depth.");

		// ===============================
		// Check if we need to resize
		// ===============================

		if(unique > 0) {
			if(cellWidth <= 0) {
				if(_3DArrays && _3DArrays.length > 0 && _3DArrays[0].length > 0 && _3DArrays[0][0].length > Math.max(xAxisAxis, yAxisAxis)) {
					var set = 0;
					var dataSet = 0;

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
					cellW = 1;
				}
			}
			else {
				cellW = cellWidth;
			}

			//$log.log(preDebugMsg + "setting cellW to " + cellW);
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
				//$log.log(preDebugMsg + "We need to resize. Current W,H = " + W + "," + H + ", need " + newW + "," + newH);

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

		// ===============================
		// Check what needs to be redrawn
		// ===============================

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

		if(!redrawAxes || !redrawCells) {
			if(zoomMinX != lastZoomMinX || zoomMaxX != lastZoomMaxX || zoomMinY != lastZoomMinY || zoomMaxY != lastZoomMaxY) {
				redrawAxes = true;
				redrawCells = true;
				redrawSelections = true;
			}
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

		// ===========
		// Draw
		// ===========

		// $log.log(preDebugMsg + "Need to redraw: " + redrawBackground + " " + redrawCells + " " + " " + redrawAxes);
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
		lastZoomMinX = zoomMinX;
		lastZoomMaxX = zoomMaxX;
		lastZoomMinY = zoomMinY;
		lastZoomMaxY = zoomMaxY;
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
	// Update Drop Zones
	// This method updates the drop zones for the plugin.
	//===================================================================================
	function updateDropZones(col, alpha, hover) {
		// $log.log(preDebugMsg + "update the data drop zone locations");
		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no drop canvas to draw on!");
				return;
			}
		}

		if(dropCtx === null) {
			dropCtx = dropCanvas.getContext("2d");
		}

		if(!dropCtx) {
			//$log.log(preDebugMsg + "no canvas to draw drop zones on");
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
			dropZ.left = leftMarg;
			dropZ.top = topMarg;
			dropZ.right = leftMarg + drawW;
			dropZ.bottom = topMarg + drawH;

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
	// Draw Background
	// This method draws the background for the plugin.
	//===================================================================================
	function drawBackground(W,H) {
		var colors = currentColors;
		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(bgCtx === null) {
			bgCtx = bgCanvas.getContext("2d");
		}

		if(!bgCtx) {
			//$log.log(preDebugMsg + "no canvas to draw bg on");
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
	// Draw Axes
	// This method draws the axes for the plugin.
	//===================================================================================
	function drawAxes(W, H) {
		if(axesCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
			if(myCanvasElement.length > 0) {
				axesCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(axesCtx === null) {
			axesCtx = axesCanvas.getContext("2d");
		}

		if(!axesCtx) {
			//$log.log(preDebugMsg + "no canvas to draw axes on");
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
	// Draw Density Plot
	// This method draws the density plot for the plugin.
	//===================================================================================
	function drawDensityPlot(W, H) {
		//$log.log(preDebugMsg + "drawDensityPlot");
		if(plotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#thePlotCanvas');
			if(myCanvasElement.length > 0) {
				plotCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(plotCtx === null) {
			plotCtx = plotCanvas.getContext("2d");
		}

		if(!plotCtx) {
			//$log.log(preDebugMsg + "no canvas to draw on");
			return;
		}

		plotCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		noofGroups = 0;
		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}

		var dataSetsToDraw = 0;
		for(var set = 0; set < Ns.length; set++) {
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}
			for(var i = 0; i < Ns[set]; i++) {
				var groupId = 0;
				if(i < selArray.length) {
					groupId = selArray[i];
				}
				if(groupId > 0) {
					dataSetsToDraw++;
				}
			}
		}
		if(dataSetsToDraw <= 0) {
			dataSetsToDraw = 1;
		}

		lastSeenGlobalSelections = [];
		for(var set = 0; set < globalSelections.length; set++) {
			lastSeenGlobalSelections.push([]);
			for(var i = 0; i < globalSelections[set].length; i++) {
				lastSeenGlobalSelections[set].push(globalSelections[set][i]);
			}
		}

		var WW = plotCanvas.width;
		var HH = plotCanvas.height;
		var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, 1);
		var imData = plotCtx.getImageData(0, 0, plotCanvas.width, plotCanvas.height);
		var pixels = imData.data;
		skipOutliers = true;
		if(!$scope.gimme("IgnoreExtremeOutliers")) {
			skipOutliers = false;
		}

		drawFront(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw);
		drawSide(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw);
		drawTop(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw);
		plotCtx.putImageData(imData, 0, 0);
	}
	//===================================================================================


	//===================================================================================
	// Draw Zoom
	// This method draws zoom for the plugin.
	//===================================================================================
	function drawZoom(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw, lengths, _2D, minVal, maxVal, rgbaText, selectedXs, selectedXls, gapsX, selectedYs, selectedYls, gapsY, sums) {
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
								var col = legacyDDSupLib.valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw, colorMode, $scope.gimme("ColorKey"));
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
	// This method draws the front sections of the plot.
	//===================================================================================
	function drawFront(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw) {
		for(var set = 0; set < Ns.length; set++) {
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			for(var dataSet = 0; dataSet < Ns[set]; dataSet++) {
				var groupId = 1;

				if(dataSet < selArray.length) {
					groupId = selArray[dataSet];
				}

				if(groupId <= 0) {
					//$log.log(preDebugMsg + "skip drawing index " + dataSet);
					continue; // skip the unselected ones
				}

				zoomMinX = 0;
				zoomMinY = 0;
				zoomMaxX = dim[xAxisAxis] - 1;
				zoomMaxY = dim[yAxisAxis] - 1;
				var _2D = [];
				var maxVal = 0;
				var minVal = 0;
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

							for(var c = 0; c < dim[zAxisAxis]; c++) {
								coords[zAxisAxis] = c;

								var zSelected = false;
								for(var sel = 0; sel < selections[zAxisAxis].length; sel++) {
									if(selections[zAxisAxis][sel].minVal <= c && c <= selections[zAxisAxis][sel].maxVal) {
										zSelected = true;
										break;
									}
								}

								if(zSelected) {
									var val = _3DArrays[set][dataSet][coords[0]][coords[1]][coords[2]];
									if(val === null) {
										sawNull = true;
									}
									else if(skipOutliers && Math.abs(val - outLierStuff[set][dataSet].mean) > outLierStuff[set][dataSet].cutOff) {
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

						if(sawNull && sawOnlyNull) {
							_2D[b].push(null);
						}
						else {
							_2D[b].push(sum);

							if(colorMode == "histogram") {
								sums.push(sum);
							}

							if(sum > maxVal) {
								maxVal = sum;
							}

							if(sum < minVal) {
								minVal = sum;
							}
						}
					}
				}

				if(colorMode == "histogram" && sums.length > 0) {
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
							var pos = legacyDDSupLib.dimVals2pixels(xAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var col = legacyDDSupLib.valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw, colorMode, $scope.gimme("ColorKey"));
							legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
						}
					}
				}

				if(zoomSpace > 0) {
					drawZoom(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw, dim, _2D, minVal, maxVal, rgbaText, selectedXs, selectedXls, gapsX, selectedYs, selectedYls, gapsY, sums);
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Side
	// This method draws the side sections of the plot.
	//===================================================================================
	function drawSide(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw) {
		for(var set = 0; set < Ns.length; set++) {
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			for(var dataSet = 0; dataSet < Ns[set]; dataSet++) {
				var groupId = 1;

				if(dataSet < selArray.length) {
					groupId = selArray[dataSet];
				}

				if(groupId <= 0) {
					continue; // skip the unselected ones
				}

				zoomMinX = 0;
				zoomMinY = 0;
				zoomMaxX = dim[zAxisAxis] - 1;
				zoomMaxY = dim[yAxisAxis] - 1;
				var _2D = [];
				var maxVal = 0;
				var minVal = 0;
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

							for(var c = 0; c < dim[xAxisAxis]; c++) {
								coords[xAxisAxis] = c;
								var xSelected = false;
								for(var sel = 0; sel < selections[xAxisAxis].length; sel++) {
									if(selections[xAxisAxis][sel].minVal <= c
										&& c <= selections[xAxisAxis][sel].maxVal) {
										xSelected = true;
										break;
									}
								}

								if(xSelected) {
									var val = _3DArrays[set][dataSet][coords[0]][coords[1]][coords[2]];

									if(val === null) {
										sawNull = true;
									}
									else if(skipOutliers && Math.abs(val - outLierStuff[set][dataSet].mean) > outLierStuff[set][dataSet].cutOff) {
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

						if(sawNull && sawOnlyNull) {
							_2D[b].push(null);
						}
						else {
							_2D[b].push(sum);

							if(colorMode == "histogram") {
								sums.push(sum);
							}

							if(sum > maxVal) {
								maxVal = sum;
							}

							if(sum < minVal) {
								minVal = sum;
							}
						}
					}
				}

				if(colorMode == "histogram" && sums.length > 0) {
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
							var pos = legacyDDSupLib.dimVals2pixels(yAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var col = legacyDDSupLib.valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw, colorMode, $scope.gimme("ColorKey"));
							legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Top
	// This method draws the top sections of the plot.
	//===================================================================================
	function drawTop(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw) {
		for(var set = 0; set < Ns.length; set++) {
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			for(var dataSet = 0; dataSet < Ns[set]; dataSet++) {
				var groupId = 1;

				if(dataSet < selArray.length) {
					groupId = selArray[dataSet];
				}

				if(groupId <= 0) {
					continue; // skip the unselected ones
				}

				zoomMinX = 0;
				zoomMinY = 0;
				zoomMaxX = dim[xAxisAxis] - 1;
				zoomMaxY = dim[zAxisAxis] - 1;
				var _2D = [];
				var maxVal = 0;
				var minVal = 0;
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

							for(var c = 0; c < dim[yAxisAxis]; c++) {
								coords[yAxisAxis] = c;

								var ySelected = false;
								for(var sel = 0; sel < selections[yAxisAxis].length; sel++) {
									if(selections[yAxisAxis][sel].minVal <= c && c <= selections[yAxisAxis][sel].maxVal) {
										ySelected = true;
										break;
									}
								}

								if(ySelected) {
									var val = _3DArrays[set][dataSet][coords[0]][coords[1]][coords[2]];
									if(val === null) {
										sawNull = true;
									}
									else if(skipOutliers && Math.abs(val - outLierStuff[set][dataSet].mean) > outLierStuff[set][dataSet].cutOff) {
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

						if(sawNull && sawOnlyNull) {
							_2D[b].push(null);
						}
						else {
							_2D[b].push(sum);

							if(colorMode == "histogram") {
								sums.push(sum);
							}

							if(sum > maxVal) {
								maxVal = sum;
							}

							if(sum < minVal) {
								minVal = sum;
							}
						}
					}
				}

				if(colorMode == "histogram" && sums.length > 0) {
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
							var pos = legacyDDSupLib.dimVals2pixels(zAxisAxis, a, b, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
							var col = legacyDDSupLib.valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw, colorMode, $scope.gimme("ColorKey"));
							legacyDDSupLib.fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Size
	// This method updates the size of the plugin.
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
				//$log.log(preDebugMsg + "no canvas to resize!");
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
				//$log.log(preDebugMsg + "no canvas to resize!");
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
				//$log.log(preDebugMsg + "no canvas to resize!");
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
				//$log.log(preDebugMsg + "no canvas to draw on!");
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
				//$log.log(preDebugMsg + "no selectionCanvas to resize!");
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

		// $log.log(preDebugMsg + "updateSize found selections: " + JSON.stringify(selections));
		// $log.log(preDebugMsg + "updateSize updated selections to: " + JSON.stringify(selections));
	}
	//===================================================================================


	//===================================================================================
	// Check if Global Selections Actually Changed
	// This method if Global Selections Actually Changed.
	//===================================================================================
	function checkIfGlobalSelectionsActuallyChanged () {
		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}

		var dirty = false;
		for(var set = 0; set < Ns.length; set++) {
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			var oldSelArray = [];
			if(set < lastSeenGlobalSelections.length) {
				oldSelArray = lastSeenGlobalSelections[set];
			}

			if(selArray.length != oldSelArray.length) {
				dirty = true;
				break;
			}

			for(var i = 0; i < Ns[set]; i++) {
				var groupId = 0;
				if(i < selArray.length) {
					groupId = selArray[i];
				}

				var oldGroupId = 0;
				if(i < oldSelArray.length) {
					oldGroupId = oldSelArray[i];
				}

				if(groupId != oldGroupId) {
					dirty = true;
					break;
				}
			}

			if(dirty) {
				break;
			}
		}

		if(dirty) {
			// $log.log(preDebugMsg + "global selections dirty, redraw");
			updateGraphicsHelper(false, true, false);
		}
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	function selectAll() {
		var newSelections = [];
		for(var d = 0; d < 3; d++) {
			newSelections.push([]);
			newSelections[d].push({"minVal":0, "maxVal":dim[d] - 1});
		}
		selections = newSelections;
		drawSelections();
		updateGraphicsHelper(false, true, false);
		saveSelectionsInSlot();
	}
	//===================================================================================


	// ==============================
    // ------- Mouse Stuff ----------
    // ==============================

	//===================================================================================
	// New Selection
	// This method reacts to a new selection being made.
	//===================================================================================
	function newSelection(newDim, v1, v2, keepOld) {
		//$log.log(preDebugMsg + "newSelection");
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
			if(selections[newDim][s].minVal == sel.minVal
				&& selections[newDim][s].maxVal == sel.maxVal) {
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
			updateGraphicsHelper(false, true, false);
			saveSelectionsInSlot();
		}
	}
	//===================================================================================


	//===================================================================================
	// Parse Selection Colors
	// This method parses the selection colors.
	//===================================================================================
	function parseSelectionColors() {
		// $log.log(preDebugMsg + "parseSelectionColors");
		var colors = $scope.gimme("GroupColors");
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
						//$log.log(preDebugMsg + "no selectionCanvas to resize!");
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
			//$log.log(preDebugMsg + "drawSelections");
			if(selectionCanvas === null) {
				var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
				if(selectionCanvasElement.length > 0) {
					selectionCanvas = selectionCanvasElement[0];
				}
				else {
					//$log.log(preDebugMsg + "no canvas to draw selections on!");
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
						var pos1 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.minVal, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos2 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.minVal, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos3 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.maxVal, dim[yAxisAxis] - 1, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos4 = legacyDDSupLib.dimVals2pixels(xAxisAxis, selection.maxVal, 0, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

						pos2.x += cellW - 1;
						pos3.x += cellW - 1;
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
						var pos1 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos2 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos3 = legacyDDSupLib.dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos4 = legacyDDSupLib.dimVals2pixels(yAxisAxis, 0, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

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
						var pos1 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos2 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.minVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos3 = legacyDDSupLib.dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);
						var pos4 = legacyDDSupLib.dimVals2pixels(zAxisAxis, 0, selection.maxVal, unique, drawH, cellW, leftMarg, topMarg, innerMarg, xAxisAxis, yAxisAxis, zAxisAxis, dim);

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
	// This method hides the user generated selection rectangle.
	//===================================================================================
	function hideSelectionRect() {
		if(selectionRect === null) {
			var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
			if(selectionRectElement.length > 0) {
				selectionRect = selectionRectElement[0];
			}
			else {
				//$log.log(preDebugMsg + "No selection rectangle!");
			}
		}
		if(selectionRect !== null) {
			selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
		}
	}
	//===================================================================================


	//===================================================================================
	// Mouse Pos Is In Selectable Area
	// This method reacts to the mouse being in the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > leftMarg - 2 && pos.x <= leftMarg + drawW + 2 && pos.y > topMarg - 2 && pos.y <= topMarg + drawH + 2) {
			return true;
		}
		return false;
	}
	//===================================================================================


	//===================================================================================
	// Zoom In
	// This method does a zoom in of the data plugin.
	//===================================================================================
	function zoomIn() {
		var midX = (zoomMinX + zoomMaxX) / 2;
		var halfSpan = (zoomMaxX - zoomMinX) / 2;
		zoomMinX = midX - halfSpan / 2;
		zoomMaxX = midX + halfSpan / 2;
		var midY = (zoomMinY + zoomMaxY) / 2;
		halfSpan = (zoomMaxY - zoomMinY) / 2;
		zoomMinY = midY - halfSpan / 2;
		zoomMaxY = midY + halfSpan / 2;
		$scope.set("MinX", zoomMinX);
		$scope.set("MaxX", zoomMaxX);
		$scope.set("MinY", zoomMinY);
		$scope.set("MaxY", zoomMaxY);

		updateGraphicsHelper(false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Zoom Out
	// This method does a zoom out of the data plugin.
	//===================================================================================
	function zoomOut() {
		var midX = (zoomMinX + zoomMaxX) / 2;
		var halfSpan = (zoomMaxX - zoomMinX)/ 2;
		zoomMinX = Math.max(limits.minX, midX - halfSpan * 2);
		zoomMaxX = Math.min(limits.maxX, midX + halfSpan * 2);
		var midY = (zoomMinY + zoomMaxY) / 2;
		halfSpan = (zoomMaxY - zoomMinY) / 2;
		zoomMinY = Math.max(limits.minY, midY - halfSpan * 2);
		zoomMaxY = Math.min(limits.maxY, midY + halfSpan * 2);
		$scope.set("MinX", zoomMinX);
		$scope.set("MaxX", zoomMaxX);
		$scope.set("MinY", zoomMinY);
		$scope.set("MaxY", zoomMaxY);

		updateGraphicsHelper(false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Pan Left
	// This method does a pan left of the data plugin.
	//===================================================================================
	function panLeft() {
		if(zoomMinX > limits.minX) {
			var shift = zoomMinX - limits.minX;
			var halfSpan = (zoomMaxX - zoomMinX) / 2;
			if(shift < halfSpan) {
				zoomMinX = limits.minX;
			}
			else {
				zoomMinX -= halfSpan;
			}
			zoomMaxX = zoomMinX + halfSpan*2;

			$scope.set("MinX", zoomMinX);
			$scope.set("MaxX", zoomMaxX);

			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Right
	// This method does a pan right of the data plugin.
	//===================================================================================
	function panRight() {
		if(zoomMaxX < limits.maxX) {
			var shift = limits.maxX - zoomMaxX;
			var halfSpan = (zoomMaxX - zoomMinX) / 2;
			if(shift < halfSpan) {
				zoomMaxX = limits.maxX;
			}
			else {
				zoomMaxX += halfSpan;
			}
			zoomMinX = zoomMaxX - halfSpan*2;

			$scope.set("MinX", zoomMinX);
			$scope.set("MaxX", zoomMaxX);

			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Down
	// This method does a pan down of the data plugin.
	//===================================================================================
	function panDown() {
		if(zoomMinY > limits.minY) {
			var shift = zoomMinY - limits.minY;
			var halfSpan = (zoomMaxY - zoomMinY) / 2;
			if(shift < halfSpan) {
				zoomMinY = limits.minY;
			}
			else {
				zoomMinY -= halfSpan;
			}
			zoomMaxY = zoomMinY + halfSpan*2;

			$scope.set("MinY", zoomMinY);
			$scope.set("MaxY", zoomMaxY);

			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Up
	// This method does a pan up of the data plugin.
	//===================================================================================
	function panUp() {
		if(zoomMaxY < limits.maxY) {
			var shift = limits.maxY - zoomMaxY;
			var halfSpan = (zoomMaxY - zoomMinY) / 2;
			if(shift < halfSpan) {
				zoomMaxY = limits.maxY;
			}
			else {
				zoomMaxY += halfSpan;
			}
			zoomMinY = zoomMaxY - halfSpan*2;

			$scope.set("MinY", zoomMinY);
			$scope.set("MaxY", zoomMaxY);

			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
