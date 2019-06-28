//======================================================================================================================
// Controllers for Digital Dashboard Plugin Line Plot Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('linePlotPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		DrawingArea: ['width', 'height']
	};

	$scope.displayText = "Line Plot";
	$scope.dataSetName = "";
	var preDebugMsg = "DigitalDashboard Lines: ";

	// graphics
	var bgCanvas = null;
	var bgCtx = null;
	var axesCanvas = null;
	var axesCtx = null;
	var lineCanvas = null;
	var lineCtx = null;
	var quickRenderThreshold = 500;
	var currentColors = null;
	var textColor = "#000000";
	var transparency = 1;
	var hoverText = null;
	var mouseIsOverMe = false;
	var selectionCanvas = null;
	var selectionCtx = null;
	var selectionColors = null;
	var selectionTransparency = 0.33;
	var selectionHolderElement = null;
	var selectionRect = null;
	var selections = []; // the graphical ones
	var lastSeenGlobalSelections = [];

	// layout
	var leftMarg = 35;
	var topMarg = 20;
	var rightMarg = 20;
	var bottomMarg = 5;
	var fontSize = 11;
	var lineWidth = 1;
	var colorPalette = null;
	var useGlobalGradients = false;
	var sortXs = false;
	var clickStart = null;

	// data from parent
	var idArrays = [];
	var xArrays = [];
	var yArrays = [];
	var y2Arrays = [];
	var xType = "number";
	var yType = "number";
	var y2Type = "number";
	var haveY2 = false;
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
	var localSelections = []; // the data to send to the parent
	var noofGroups = 1;
	var drawH = 1;
	var drawW = 1;
	var internalSelectionsInternallySetTo = {};
	var lastDrawW = null;
	var lastDrawH = null;
	var lastFontSize = null;
	var lastTextColor = null;
	var lastColors = null;
	var lastZoomMinX = null;
	var lastZoomMaxX = null;
	var lastZoomMinY = null;
	var lastZoomMaxY = null;
	var lastLineWidth = null;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
		switch(eventData.slotName) {
			case "Transparency":
				var newTransp = eventData.slotValue;
				if(newTransp < 0) {
					newTransp = 0;
				}
				else if(newTransp > 1) {
					newTransp = 1;
				}
				if(newTransp != transparency) {
					transparency = newTransp;
				}
				updateGraphicsHelper(false, true, false);
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
				updateLocalSelections(false);
				break;
			case "MaxX":
				var newZoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
				if(newZoomMaxX <= zoomMinX) {
					newZoomMaxX = Math.min(zoomMinX + 1, limits.maxX, zoomMaxX);
				}

				$scope.set("MaxX", newZoomMaxX);

				if(newZoomMaxX != zoomMaxX) {
					zoomMaxX = newZoomMaxX;
					updateSelectionsWhenZoomingOrResizing();
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
					updateSelectionsWhenZoomingOrResizing();
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
					updateSelectionsWhenZoomingOrResizing();
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
					updateSelectionsWhenZoomingOrResizing();
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
				// parseSelectionColors();
				updateGraphicsHelper(true, true, true);
				break;
			case "root:width":
				updateSize();
				// parseSelectionColors();
				updateGraphicsHelper(true, true, true);
				break;
			case "LineWidth":
				var lineWidthNew = $scope.gimme('LineWidth');
				if(typeof lineWidthNew !== 'number') {
					try {
						lineWidthNew = parseInt(lineWidthNew);
					} catch(e) {
						lineWidthNew = lineWidth;
					}
				}
				if(lineWidthNew < 1) {
					lineWidthNew = 1;
				}
				if(lineWidthNew != lineWidth) {
					lineWidth = lineWidthNew;
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
					//$log.log(preDebugMsg + "No hover text!");
				}
			}

			if(hoverText !== null) {
				if(mousePosIsInSelectableArea(currentMouse)) {
					var x = legacyDDSupLib.pixel2valX(currentMouse.x, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var y = legacyDDSupLib.pixel2valX(currentMouse.y, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var s = "[";

					if(xType == 'date') {
						s += (legacyDDSupLib.date2text(Math.floor(x), limits.dateFormatX));
					}
					else {
						s += legacyDDSupLib.number2text(x, limits.spanX);
					}

					s += ",";

					if(yType == 'date') {
						s += (legacyDDSupLib.date2text(Math.floor(y), limits.dateFormatY));
					}
					else {
						s += legacyDDSupLib.number2text(y, limits.spanY);
					}

					s += "]";

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
					var x1 = currentMouse.x;
					var w = 1;
					if(clickStart.x < x1) {
						x1 = clickStart.x;
						w = currentMouse.x - x1;
					}
					else {
						w = clickStart.x - x1;
					}

					var y1 = currentMouse.y;
					var h = 1;
					if(clickStart.y < y1) {
						y1 = clickStart.y;
						h = currentMouse.y - y1;
					}
					else {
						h = clickStart.y - y1;
					}

					var selectionRectCtx = selectionRect.getContext("2d");
					selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);

					if(selectionColors === null) {
						parseSelectionColors();
					}

					selectionRectCtx.fillStyle = selectionColors.color;
					selectionRectCtx.fillRect(x1, y1, w, h);
					selectionRectCtx.save();
					selectionRectCtx.strokeStyle = selectionColors.border;
					selectionRectCtx.strokeRect(x1, y1, w, h);
					selectionRectCtx.restore();
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
			if(e.shiftKey) {
				//$log.log(preDebugMsg + "shiftClick");
				if(e.which === 1){
					currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

					if(mousePosIsInSelectableArea(currentMouse)) {
						zoomToSmallestClickedSelection(currentMouse);
					}
				}

			}
			else {
				if(e.which === 1){
					currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

					if(mousePosIsInSelectableArea(currentMouse)) {
						clickStart = currentMouse;
						if(e.ctrlKey) {
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
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Up
	// This event handler manages mouse button up.
	//===================================================================================
	var onMouseUp = function(e){
		if(unique > 0) {
			selectionHolderElement.unbind('mouseup');

			// check new selection rectangle
			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				var x1 = currentMouse.x;
				var x2 = clickStart.x;
				if(x2 < x1) {
					x1 = clickStart.x;
					x2 = currentMouse.x;
				}

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(x1 == x2 && y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(x1,x2, y1,y2, clickStart.ctrl);
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
					//$log.log(preDebugMsg + "No hover text!");
				}
			}
			if(hoverText !== null) {
				hoverText.style.display = "none";
			}

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				var x1 = currentMouse.x;
				var x2 = clickStart.x;
				if(x2 < x1) {
					x1 = clickStart.x;
					x2 = currentMouse.x;
				}

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(x1 == x2 && y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(x1,x2, y1,y2, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//===================================================================================


	//===================================================================================
	// Fixed Key Press
	// This event handler handles keyboard strokes.
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


	//===================================================================================
	// Zoom In
	// This event handler manages zoom in events.
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
		updateSelectionsWhenZoomingOrResizing();
		updateGraphicsHelper(false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Zoom Out
	// This event handler manages zoom out events.
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
		updateSelectionsWhenZoomingOrResizing();
		updateGraphicsHelper(false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Pan Left
	// This event handler manages pan left events.
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
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Right
	// This event handler manages pan right events.
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
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Down
	// This event handler manages pan down events.
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
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Up
	// This event handler manages pan up events.
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
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Zoom To Smallest Clicked Selection
	// This event handler manages mouse events that will cause a zoom to the smallest
	// clicked selection.
	//===================================================================================
	function zoomToSmallestClickedSelection(currentMouse) {
		selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];

			var X1 = newSel[4];
			var X2 = newSel[5];

			var Y1 = newSel[6];
			var Y2 = newSel[7];

			if(X1 <= currentMouse.x
				&& currentMouse.x <= X2
				&& Y1 <= currentMouse.y
				&& currentMouse.y <= Y2) {

				var newZoomMinX = Math.max(limits.minX, newSel[0]);
				var newZoomMaxX = Math.min(limits.maxX, newSel[1]);
				var newZoomMinY = Math.max(limits.minY, newSel[2]);
				var newZoomMaxY = Math.min(limits.maxY, newSel[3]);

				if(newZoomMinX != zoomMinX
					|| newZoomMaxX != zoomMaxX
					|| newZoomMinY != zoomMinY
					|| newZoomMaxY != zoomMaxY) {

					zoomMinX = newZoomMinX;
					zoomMaxX = newZoomMaxX;
					zoomMinY = newZoomMinY;
					zoomMaxY = newZoomMaxY;

					$scope.set("MinX", zoomMinX);
					$scope.set("MaxX", zoomMaxX);
					$scope.set("MinY", zoomMinY);
					$scope.set("MaxY", zoomMaxY);

					updateSelectionsWhenZoomingOrResizing();
					updateGraphicsHelper(false, false, false, false);
				}

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

		$scope.addSlot(new Slot('SelectAll',
			false,
			"Select All",
			'Slot to quickly reset all selections to select all available data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// internal slots specific to this Webble -----------------------------------------------------------
		$scope.addSlot(new Slot('FontSize',
			fontSize,
			"Font Size",
			'The font size to use in the Webble interface.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('LineWidth',
			lineWidth,
			"Line Width",
			'The width (in pixels) of the lines in the plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Transparency',
			transparency,
			"Transparency",
			'Transparency, from 0 to 1, of the dots and lines to draw.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('TreatNullAsUnselected',
			false,
			"Treat Null as Unselected",
			'Group data items with no value together with items that are not selected (otherwise they get their own group).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseGlobalColorGradients',
			useGlobalGradients,
			"Use Global Color Gradients",
			'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('SortX',
			sortXs,
			"Sort X Axis",
			'Should the X axis values be sorted or not.',
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

		$scope.addSlot(new Slot('QuickRenderThreshold',
			500,
			"Quick Render Threshold",
			'The number of data items to accept before switching to faster (but less pretty) rendering.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Dashboard Plugin slots -----------------------------------------------------------
		$scope.addSlot(new Slot('PluginName',
			"Line Plot",
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
			[[{'idSlot':'DataIdSlot', 'name':'dataX', 'type':'number|date', 'slot':'DataX'},
				{'idSlot':'DataIdSlot', 'name':'dataY', 'type':'number|date', 'slot':'DataY'}],
				[{'idSlot':'DataIdSlot', 'name':'dataX', 'type':'number|date', 'slot':'DataX'},
					{'idSlot':'DataIdSlot', 'name':'dataY1', 'type':'number|date', 'slot':'DataY'},
					{'idSlot':'DataIdSlot', 'name':'dataY2', 'type':'number|date', 'slot':'DataY2'}]],
			"Expected Format",
			'The input this plugin accepts.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// slots for data input
		$scope.addSlot(new Slot('DataX',
			[[1,1,3,4,3,1]],
			"Data X",
			'The slot where the X-axis input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataX').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('DataY',
			[[3,2,1,2,3,4]],
			"Data Y",
			'The slot where the Y-axis input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataY').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('DataY2',
			[[3,2,1,2,3,4]],
			"Data Y2",
			'The slot where the one more set of Y-axis input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataY2').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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

		// colors of groups of data, and the background color theme
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

		updateGraphicsHelper(true, true, true);

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
	};
	//===================================================================================


	//===================================================================================
	// Save Selections in Slot
	// This method saves the selection into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		var result = {};
		result.selections = [];
		for(var sel = 0; sel < selections.length; sel++) {
			result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1], 'minY':selections[sel][2], 'maxY':selections[sel][3]});
		}

		internalSelectionsInternallySetTo = result;
		$scope.set('InternalSelections', result);
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

		if(slotSelections.hasOwnProperty("selections")) {
			var newSelections = [];

			if(unique > 0) {
				for(var sel = 0; sel < slotSelections.selections.length; sel++) {
					var newSel = slotSelections.selections[sel];
					var X1 = newSel.minX;
					var X2 = newSel.maxX;
					var Y1 = newSel.minY;
					var Y2 = newSel.maxY;

					if(X2 < limits.minX || X1 > limits.maxX || Y2 < limits.minY || Y1 > limits.maxY) {
						// completely outside
						continue;
					}

					X1 = Math.max(limits.minX, X1);
					X2 = Math.min(limits.maxX, X2);
					Y1 = Math.max(limits.minY, Y1);
					Y2 = Math.min(limits.maxY, Y2);

					newSelections.push([X1,X2,Y1,Y2, legacyDDSupLib.val2pixelX(X1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.val2pixelX(X2, unique, drawW, leftMarg, zoomMinX, zoomMaxX),legacyDDSupLib.val2pixelY(Y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.val2pixelY(Y1, unique, drawH, topMarg, zoomMinY, zoomMaxY)]); // flip Y-axis
				}

				// $log.log(preDebugMsg + "new selections: " + JSON.stringify(newSelections));
				if(newSelections.length > 0) {
					selections = newSelections;
					updateLocalSelections(false);
					drawSelections();
				}
			}
			else { // no data
				for(var sel = 0; sel < slotSelections.selections.length; sel++) {
					var newSel = slotSelections.selections[sel];
					var X1 = newSel.minX;
					var X2 = newSel.maxX;
					var Y1 = newSel.minY;
					var Y2 = newSel.maxY;

					newSelections.push([X1,X2,Y1,Y2, 0,0,0,0]);
				}
				selections = newSelections;
			}
		}
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Check Selections After New Data
	// This method checks the validity of the selection after new data have been added.
	//===================================================================================
	function checkSelectionsAfterNewData() {
		// $log.log(preDebugMsg + "checkSelectionsAfterNewData");
		var newSelections = [];

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];
			var X1 = newSel[0];
			var X2 = newSel[1];
			var Y1 = newSel[2];
			var Y2 = newSel[3];

			if(X2 < limits.minX || X1 > limits.maxX || Y2 < limits.minY || Y1 > limits.maxY) {
				// completely outside
				continue;
			}

			X1 = Math.max(limits.minX, X1);
			X2 = Math.min(limits.maxX, X2);
			Y1 = Math.max(limits.minY, Y1);
			Y2 = Math.min(limits.maxY, Y2);

			newSelections.push([X1,X2,Y1,Y2, legacyDDSupLib.val2pixelX(X1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.val2pixelX(X2, unique, drawW, leftMarg, zoomMinX, zoomMaxX),legacyDDSupLib.val2pixelY(Y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.val2pixelY(Y1, unique, drawH, topMarg, zoomMinY, zoomMaxY)]); // flip Y-axis
		}

		if(newSelections.length > 0) {
			selections = newSelections;
			drawSelections();
			return false;
		}
		return true;
	}
	//===================================================================================


	//===================================================================================
	// Update Local Selections
	// This method updates the local selections to be in phase with global ones.
	//===================================================================================
	function updateLocalSelections(selectAll) {
		// $log.log(preDebugMsg + "updateLocalSelections");
		var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
		var nullGroup = 0;
		if(!nullAsUnselected) {
			nullGroup = selections.length + 1; // get unused groupId
		}

		var dirty = false;

		// $log.log(preDebugMsg + "selections before sorting: " + JSON.stringify(selections));
		selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.
		// $log.log(preDebugMsg + "selections after sorting: " + JSON.stringify(selections));

		for(var set = 0; set < idArrays.length; set++) {
			var xArray = xArrays[set];
			var yArray = yArrays[set];
			var selArray = localSelections[set];

			for(var i = 0; i < Ns[set]; i++) {
				var newVal = 1;

				if(xArray[i] === null || yArray[i] === null) {
					newVal = nullGroup;
				}
				else {
					if(selectAll) {
						newVal = 1;
					}
					else {
						var groupId = 0;

						for(var span = 0; span < selections.length; span++) {
							if(selections[span][0] <= xArray[i] && xArray[i] <= selections[span][1] && selections[span][2] <= yArray[i] && yArray[i] <= selections[span][3]) {
								groupId = span + 1;
								break;
							}
						}
						newVal = groupId;
					}
				}

				if(newVal != selArray[i]) {
					dirty = true;
					selArray[i] = newVal;
				}
			}
		}

		if(dirty) {
			$scope.set('LocalSelections', {'DataIdSlot':localSelections});
			$scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
		}
		else {
			// $log.log(preDebugMsg + "local selections had not changed");
		}
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets all the main variables for the plugin Webble getting it ready
	// for new fresh data.
	//===================================================================================
	function resetVars() {
		idArrays = [];
		xArrays = [];
		yArrays = [];
		y2Arrays = [];
		xType = "number";
		yType = "number";
		y2Type = "number";
		haveY2 = false;
		$scope.dataSetName = "";
		sources = 0;
		Ns = [];
		N = 0;
		limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
		unique = 0;
		NULLs = 0;
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
			var haveY = false;
			for(var i = 0; i < parentInput.length; i++) {
				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "dataX") {
					haveX = true;

					if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
						xType = 'date';
					}
					else {
						xType = 'number';
					}

					if(parentInput[i].hasOwnProperty("description")) {
						$scope.dataSetName = parentInput[i]["description"];
					}
				}

				if(parentInput[i].hasOwnProperty("name") && (parentInput[i].name == "dataY" || parentInput[i].name == "dataY1")) {
					haveY = true;

					if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
						yType = 'date';
					}
					else {
						yType = 'number';
					}

					if(parentInput[i].hasOwnProperty("description")) {
						$scope.dataSetName = parentInput[i]["description"];
					}
				}

				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "dataY2") {
					haveY2 = true;

					if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
						y2Type = 'date';
					}
					else {
						y2Type = 'number';
					}
				}
			}

			if(haveX && haveY) {
				atLeastOneFilled = true;
			}
		}

		// $log.log(preDebugMsg + "read parent input ", atLeastOneFilled);
		var dataIsCorrupt = false;

		if(atLeastOneFilled) {
			idArrays = $scope.gimme('DataIdSlot');
			xArrays = $scope.gimme('DataX');
			yArrays = $scope.gimme('DataY');

			if(haveY2) {
				y2Arrays = $scope.gimme('DataY2');
			}

			if(idArrays.length != xArrays.length || idArrays.length != yArrays.length) {
				dataIsCorrupt = true;
			}
			if(idArrays.length <= 0) {
				dataIsCorrupt = true;
			}
			if(haveY2 && yArrays.length != y2Arrays.length) {
				dataIsCorrupt = true;
			}


			if(!dataIsCorrupt) {
				sources = idArrays.length;

				for(var source = 0; source < sources; source++) {
					var idArray = idArrays[source];
					var xArray = xArrays[source];
					var yArray = yArrays[source];

					if(idArray.length != xArray.length || idArray.length != yArray.length) {
						dataIsCorrupt = true;
					}
					if(idArray.length <= 0) {
						dataIsCorrupt = true;
					}

					if(haveY2) {
						var y2Array = y2Arrays[source];
						if(yArray.length != y2Array.length) {
							dataIsCorrupt = true;
						}
					}
				}
			}

			if(!dataIsCorrupt) {
				Ns = [];
				var firstNonNullData = true;
				var minXVal = 0;
				var maxXVal = 0;
				var minYVal = 0;
				var maxYVal = 0;

				for(var source = 0; source < sources; source++) {
					var idArray = idArrays[source];
					var xArray = xArrays[source];
					var yArray = yArrays[source];

					if(haveY2) {
						var y2Array = y2Arrays[source];
					}

					N += idArray.length;
					Ns.push(idArray.length);

					localSelections.push([]);

					for(i = 0; i < Ns[source]; i++) {
						localSelections[source].push(0);

						if(xArray[i] !== null
							&& yArray[i] !== null
							&& (!haveY2 || y2Array[i] !== null)) {

							unique++;

							var x = xArray[i];
							var y = yArray[i];

							if(isNaN(x) || isNaN(y)) {
								dataIsCorrupt = true; // only null values
							}

							if(haveY2) {
								var y2 = y2Array[i];
								if(isNaN(y2)) {
									dataIsCorrupt = true;
								}
							}

							if(firstNonNullData) {
								firstNonNullData = false;
								minXVal = x;
								maxXVal = x;
								minYVal = y;
								maxYVal = y;

								if(haveY2) {
									minYVal = Math.min(minYVal, y2);
									maxYVal = Math.max(maxYVal, y2);
									var diff = y2 - y;
									minYVal = Math.min(minYVal, diff);
									maxYVal = Math.max(maxYVal, diff);
								}
							}
							else {
								minXVal = Math.min(x, minXVal);
								maxXVal = Math.max(x, maxXVal);
								minYVal = Math.min(y, minYVal);
								maxYVal = Math.max(y, maxYVal);

								if(haveY2) {
									minYVal = Math.min(minYVal, y2);
									maxYVal = Math.max(maxYVal, y2);
									var diff = y2 - y;
									minYVal = Math.min(minYVal, diff);
									maxYVal = Math.max(maxYVal, diff);
								}
							}
						}
						else {
							NULLs++;
						}
					}
				}
				if(firstNonNullData) {
					dataIsCorrupt = true; // only null values
				}
				else {
					limits = {};

					if(minXVal == maxXVal) {
						minXVal--;
						maxXVal++;
					}

					if(minYVal == maxYVal) {
						minYVal--;
						maxYVal++;
					}

					limits.minX = minXVal;
					limits.maxX = maxXVal;
					limits.minY = minYVal;
					limits.maxY = maxYVal;
					limits.spanX = maxXVal - minXVal;
					limits.spanY = maxYVal - minYVal;
					if(limits.spanX <= 0) {
						limits.spanX = 1;
					}
					if(limits.spanY <= 0) {
						limits.spanY = 1;
					}

					zoomMinX = limits.minX;
					zoomMaxX = limits.maxX;
					zoomMinY = limits.minY;
					zoomMaxY = limits.maxY;
					$scope.set("MinX", limits.minX);
					$scope.set("MaxX", limits.maxX);
					$scope.set("MinY", limits.minY);
					$scope.set("MaxY", limits.maxY);

					if(xType == 'date') {
						if(limits.minX == limits.maxX) {
							limits.dateFormatX = 'full';
						}
						else {
							var d1 = new Date(limits.minX);
							var d2 = new Date(limits.maxX);
							if(d2.getFullYear() - d1.getFullYear() > 10) {
								limits.dateFormatX = 'onlyYear';
							}
							else if(d2.getFullYear() - d1.getFullYear() > 1) {
								limits.dateFormatX = 'yearMonth';
							}
							else {
								var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
								if(d2.getMonth() != d1.getMonth()) {
									limits.dateFormatX = 'monthDay';
								}
								else if(days > 5) {
									limits.dateFormatX = 'day';
								}
								else if(days > 1) {
									limits.dateFormatX = 'dayTime';
								}
								else {
									limits.dateFormatX = 'time';
								}
							}
						}
					}
					if(yType == 'date') {
						if(limits.minY == limits.maxY) {
							limits.dateFormatY = 'full';
						}
						else {
							var d1 = new Date(limits.minY);
							var d2 = new Date(limits.maxY);
							if(d2.getFullYear() - d1.getFullYear() > 10) {
								limits.dateFormatY = 'onlyYear';
							}
							else if(d2.getFullYear() - d1.getFullYear() > 1) {
								limits.dateFormatY = 'yearMonth';
							}
							else {
								var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
								if(d2.getMonth() != d1.getMonth()) {
									limits.dateFormatY = 'monthDay';
								}
								else if(days > 5) {
									limits.dateFormatY = 'day';
								}
								else if(days > 1) {
									limits.dateFormatY = 'dayTime';
								}
								else {
									limits.dateFormatY = 'time';
								}
							}
						}
					}
					// $log.log(preDebugMsg + "parseData limits: " + JSON.stringify(limits));
				}
			}

			if(dataIsCorrupt) {
				//$log.log(preDebugMsg + "data is corrupt");
				resetVars();
			}
		}
		else {
			//$log.log(preDebugMsg + "no data");
		}

		updateSize();
		updateGraphicsHelper(false, true, false);

		if(unique > 0) {
			var giveUp = checkSelectionsAfterNewData();
			if(giveUp) {
				selectAll();
			}
			else {
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
		else { // no data
			$scope.set('LocalSelections', {'DataIdSlot':[]});

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
	// This method updates the graphics.
	//===================================================================================
	function updateGraphicsHelper(forceBackground, forceLines, forceAxes) {
		// $log.log(preDebugMsg + "updateGraphics()");
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
		var redrawLines = forceLines;
		var redrawAxes = forceAxes;

		// ===============================
		// Check what needs to be redrawn
		// ===============================
		if(drawW != lastDrawW || drawH != lastDrawH) {
			redrawBackground = true;
			redrawLines = true;
			redrawAxes = true;
		}

		if(!redrawBackground && currentColors != lastColors) {
			redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
		}

		if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
			redrawAxes = true;
		}

		if(lastLineWidth != lineWidth) {
			redrawLines = true;
		}

		if(!redrawAxes || !redrawLines) {
			if(zoomMinX != lastZoomMinX || zoomMaxX != lastZoomMaxX || zoomMinY != lastZoomMinY || zoomMaxY != lastZoomMaxY) {
				redrawAxes = true;
				redrawLines = true;
			}
		}

		if(!redrawLines) {
			if(legacyDDSupLib.checkColors(currentColors, lastColors)) {
				redrawLines = true;
			}
		}

		// ===========
		// Draw
		// ===========
		if(redrawBackground) {
			drawBackground(W, H);
		}
		if(redrawAxes) {
			drawAxes(W, H);
		}
		if(redrawLines) {
			if(haveY2) {
				drawLines2(W, H);
			}
			else {
				drawLines(W, H);
			}
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
		lastLineWidth = lineWidth;
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
	// This method draws the axes.
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

		// X axis
		axesCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

		if(unique > 0) {
			var LABELS = 5;
			for(var i = 0; i < LABELS+1; i++) {
				var pos = leftMarg + i/LABELS*drawW;

				var s = "";
				if(xType == 'date') {
					s = (legacyDDSupLib.date2text(Math.floor(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX)), limits.dateFormatX));

					var temp1 = Math.floor(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX));
					var temp2 = legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var temp3 = legacyDDSupLib.val2pixelX(temp2, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
				}
				else {
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX), limits.spanX);
				}

				var textW = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, s);
				axesCtx.fillText(s, pos - textW/2, H - bottomMarg);
				axesCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
			}
		}

		// Y Axis
		axesCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

		if(unique > 0) {
			var LABELS = 5;
			for(var i = 0; i < LABELS+1; i++) {
				var pos = topMarg + i/LABELS*drawH;

				var s = "";
				if(yType == 'date') {
					s = (legacyDDSupLib.date2text(Math.floor(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY)), limits.dateFormatY));
				}
				else {
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY), limits.spanY);
				}

				var textW = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, s);
				if(leftMarg > textW + 5) {
					axesCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
				}
				else {
					axesCtx.fillText(s, 0, pos + fontSize/2);
				}
				axesCtx.fillRect(leftMarg - 5, pos, 6, 1);
			}
		}

		// 0
		if(unique > 0) {
			if(xType != 'date') {
				if(zoomMinX < 0 && zoomMaxX > 0) {
					var pos = legacyDDSupLib.val2pixelX(0, unique, drawW, leftMarg, zoomMinX, zoomMaxX);

					var temp1 = legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX);

					var col = legacyDDSupLib.hexColorToRGBA(textColor, 0.5);

					axesCtx.save();

					axesCtx.setLineDash([2, 4]);
					axesCtx.strokeStyle = col;
					axesCtx.lineWidth = 1;

					axesCtx.beginPath();
					axesCtx.moveTo(pos, topMarg + drawH + 2);
					axesCtx.lineTo(pos, topMarg - 1);
					axesCtx.stroke();

					axesCtx.restore();
				}
			}

			if(yType != 'date') {
				if(zoomMinY < 0 && zoomMaxY > 0) {
					var pos = legacyDDSupLib.val2pixelY(0, unique, drawH, topMarg, zoomMinY, zoomMaxY);

					var col = legacyDDSupLib.hexColorToRGBA(textColor, 0.5);

					axesCtx.save();

					axesCtx.setLineDash([2, 4]);
					axesCtx.strokeStyle = col;
					axesCtx.lineWidth = 1;

					axesCtx.beginPath();
					axesCtx.moveTo(leftMarg - 1, pos);
					axesCtx.lineTo(leftMarg + drawW + 1, pos);
					axesCtx.stroke();

					axesCtx.restore();
				}
			}
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

		var lineDirty = false;
		if(lineCanvas === null) {
			lineDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
			if(myCanvasElement.length > 0) {
				lineCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(lineCanvas.width != rw) {
			lineDirty = true;
			lineCanvas.width = rw;
		}
		if(lineCanvas.height != rh) {
			lineDirty = true;
			lineCanvas.height = rh;
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
		updateSelectionsWhenZoomingOrResizing();
		// $log.log(preDebugMsg + "updateSize updated selections to: " + JSON.stringify(selections));
	}
	//===================================================================================


	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(x1,x2, y1,y2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		// $log.log(preDebugMsg + "newSelection " + x1 + " " + x2 + " " + y1 + " " + y2 + " " + keepOld);
		if(unique > 0) {
			x1 = Math.max(x1, leftMarg);
			x2 = Math.min(x2, leftMarg + drawW);
			y1 = Math.max(y1, topMarg);
			y2 = Math.min(y2, topMarg + drawH);

			var newSel = [legacyDDSupLib.pixel2valX(x1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valX(x2, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valY(y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.pixel2valY(y1, unique, drawH, topMarg, zoomMinY, zoomMaxY), x1,x2,y1,y2]; // y1 and y2 need to be switched in pixel2valY, because we flip the y axis
			// $log.log(preDebugMsg + "newSel: " + JSON.stringify(newSel));

			var overlap = false;
			for(var s = 0; s < selections.length; s++) {
				var sel = selections[s];
				if(sel[4] == newSel[4] && sel[5] == newSel[5] && sel[6] == newSel[6] && sel[7] == newSel[7]) {
					// $log.log(preDebugMsg + "Ignoring selection because it overlaps 100% with already existing selection");
					overlap = true;
					break;
				}
			}

			if(!overlap) {
				if(!keepOld) {
					selections = [];
				}
				selections.push(newSel);
				drawSelections();
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	function selectAll() {
		if(unique <= 0) {
			selections = [];
		}
		else {
			selections = [[limits.minX, limits.maxX, limits.minY, limits.maxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
		}
		drawSelections();
		updateLocalSelections(true);
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Parse Selection Colors
	// This method selects parses the selection colors.
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
					if(colors['selection']['gradient'][p].hasOwnProperty('pos')
						&& colors['selection']['gradient'][p].hasOwnProperty('color')) {
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

		for(sel = 0; sel < selections.length; sel++) {
			if(selections[sel][2] > zoomMaxY || selections[sel][3] < zoomMinY || selections[sel][0] > zoomMaxX || selections[sel][1] < zoomMinX) {
				continue;
			}

			selectionCtx.fillStyle = selectionColors.grad;
			var x1 = selections[sel][4];
			var x2 = selections[sel][5];
			var y1 = selections[sel][6];
			var y2 = selections[sel][7];


			selectionCtx.fillRect(x1, y1, x2 - x1, y2 - y1);

			selectionCtx.fillStyle = selectionColors.border;
			selectionCtx.fillRect(x1,   y1, 1, y2-y1);
			selectionCtx.fillRect(x1,   y1, x2 - x1, 1);
			selectionCtx.fillRect(x1,   y2-1, x2 - x1, 1);
			selectionCtx.fillRect(x2-1, y1, 1, y2-y1);
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
				//$log.log(preDebugMsg + "No selection rectangle!");
			}
		}
		if(selectionRect !== null) {
			selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
		}
	}
	//===================================================================================


	//===================================================================================
	// Check if Global Selections Acturally Changed
	// This method checks if the global selections actually changed.
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

			var xArray = xArrays[set];
			var yArray = yArrays[set];

			for(var i = 0; i < Ns[set]; i++) {
				if(xArray[i] === null || yArray[i] === null) {
					continue;
				}

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
	// Mouse Position in Selectable Area
	// This method checks whether the mouse pointer is within the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > leftMarg - 5 && pos.x <= leftMarg + drawW + 5 && pos.y > topMarg - 5 && pos.y <= topMarg + drawH + 5) {
			return true;
		}
		return false;
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel X No Crimp
	// This method converts a value to pixel (for X with no Crimp).
	//===================================================================================
	function val2pixelXnocrimp(v) {
		if(unique <= 0) {
			return 0;
		}

		return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel Y No Crimp
	// This method converts a value to pixel (for Y with no Crimp).
	//===================================================================================
	function val2pixelYnocrimp(v) {
		if(unique <= 0) {
			return 0;
		}

		return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
	}
	//===================================================================================


	//===================================================================================
	// Draw Lines
	// This method draws the lines.
	//===================================================================================
	function drawLines(W, H) {
		if(lineCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
			if(myCanvasElement.length > 0) {
				lineCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(lineCtx === null) {
			lineCtx = lineCanvas.getContext("2d");
		}

		if(!lineCtx) {
			//$log.log(preDebugMsg + "no canvas to draw on");
			return;
		}

		lineCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		noofGroups = 0;

		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}
		// var globalSelections = $scope.gimme('GlobalSelections');

		lastSeenGlobalSelections = [];
		for(var set = 0; set < globalSelections.length; set++) {
			lastSeenGlobalSelections.push([]);
			for(var i = 0; i < globalSelections[set].length; i++) {
				lastSeenGlobalSelections[set].push(globalSelections[set][i]);
			}
		}

		var zeroTransp = 0.33 * transparency;

		// first draw all the unselected data
		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, transparency);
			var imData = lineCtx.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
			var pixels = imData.data;
		}
		else {
			var col0 = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var colT = legacyDDSupLib.hexColorToRGBA(textColor, transparency);
		}

		for(var set = 0; set < Ns.length; set++) {
			var xArray = xArrays[set];
			var yArray = yArrays[set];
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			for(var i = 0; i < Ns[set] - 1; i++) {
				if(xArray[i] === null
					|| yArray[i] === null) {
					continue;
				}

				var next = -1;
				for(var j = i+1; i < Ns[set]; j++) {
					if(xArray[j] === null
						|| yArray[j] === null) {
						continue;
					}
					next = j;
					break;
				}

				j = next;

				if((xArray[i] < zoomMinX && xArray[j] < zoomMinX) || (xArray[i] > zoomMaxX && xArray[j] > zoomMaxX) || (yArray[i] < zoomMinY && yArray[j] < zoomMinY) || (yArray[i] > zoomMaxY && yArray[j] > zoomMaxY)) {
					continue; // line completely outside view
				} // this could be done better, check if the line intersects the rectangle

				var groupId1 = 0;
				if(i < selArray.length) {
					groupId1 = selArray[i];
				}
				var groupId2 = 0;
				if(j < selArray.length) {
					groupId2 = selArray[j];
				}

				var x1 = val2pixelXnocrimp(xArray[i]);
				var y1 = val2pixelYnocrimp(yArray[i]);
				var x2 = val2pixelXnocrimp(xArray[j]);
				var y2 = val2pixelYnocrimp(yArray[j]);

				if(drawPretty) {
					var col = colT;
					lineCtx.save();
					if(groupId1 <= 0 && groupId2 <= 0) {
						col = col0;
						lineCtx.setLineDash([3, 5]);
					}
					else if(groupId1 > 0 && groupId2 > 0) {
						if(groupId1 == groupId2) {
							col = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
						}
						else {
							col = colT;
						}
					}
					else {
						col = col0;
					}

					lineCtx.strokeStyle = col;
					lineCtx.lineWidth = lineWidth;
					lineCtx.beginPath();
					lineCtx.moveTo(x1, y1);
					lineCtx.lineTo(x2, y2);
					lineCtx.stroke();
					lineCtx.restore();
				}
				else {
					var col = rgba0;
					var dashed = false;
					if(groupId1 <= 0 && groupId2 <= 0) {
						col = rgba0;
						dashed = true;
					}
					else if(groupId1 > 0 && groupId2 > 0) {
						if(groupId1 == groupId2) {
							col = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
						}
						else {
							col = rgbaText;
						}
					}
					else {
						col = rgba0;
					}

					if(col[3] >= 255) {
						drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
					}
					else {
						drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
					}
				}
			}
		}
		if(!drawPretty) {
			lineCtx.putImageData(imData, 0, 0);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Lines 2
	// This method also draws lines.
	//===================================================================================
	function drawLines2(W, H) {
		if(lineCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
			if(myCanvasElement.length > 0) {
				lineCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(lineCtx === null) {
			lineCtx = lineCanvas.getContext("2d");
		}

		if(!lineCtx) {
			//$log.log(preDebugMsg + "no canvas to draw on");
			return;
		}

		lineCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		noofGroups = 0;
		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}
		// var globalSelections = $scope.gimme('GlobalSelections');

		lastSeenGlobalSelections = [];
		for(var set = 0; set < globalSelections.length; set++) {
			lastSeenGlobalSelections.push([]);
			for(var i = 0; i < globalSelections[set].length; i++) {
				lastSeenGlobalSelections[set].push(globalSelections[set][i]);
			}
		}

		var zeroTransp = 0.33 * transparency;

		// first draw all the unselected data
		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, transparency);
			var imData = lineCtx.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
			var pixels = imData.data;
		}
		else {
			var col0 = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var colT = legacyDDSupLib.hexColorToRGBA(textColor, transparency);
		}

		for(var pass = 0; pass < 3; pass++) {
			for(var set = 0; set < Ns.length; set++) {
				var xArray = xArrays[set];
				var yArray = yArrays[set];
				var y2Array = y2Arrays[set];
				var selArray = [];
				if(set < globalSelections.length) {
					selArray = globalSelections[set];
				}

				for(var i = 0; i < Ns[set] - 1; i++) {
					if(xArray[i] === null || yArray[i] === null || y2Array[i] === null) {
						continue;
					}

					var next = -1;
					for(var j = i+1; i < Ns[set]; j++) {
						if(xArray[j] === null || yArray[j] === null || y2Array[j] === null) {
							continue;
						}
						next = j;
						break;
					}

					j = next;

					// =========================
					// First draw line for Y
					// =========================
					var groupId1 = 0;
					if(i < selArray.length) {
						groupId1 = selArray[i];
					}
					var groupId2 = 0;
					if(j < selArray.length) {
						groupId2 = selArray[j];
					}

					var myPass = 1;
					if(groupId1 <= 0 && groupId2 <= 0) {
						myPass = 0;
					}
					else if(groupId1 > 0 && groupId2 > 0) {
						myPass = 1;
					}
					else {
						myPass = 0;
					}

					var skipY = false;
					var skipY2 = false;
					var skipDiff = false;

					if(myPass != pass) {
						skipY = true;
						skipY2 = true;
					}
					if(pass != 2) {
						skipDiff = true;
					}

					if((xArray[i] < zoomMinX && xArray[j] < zoomMinX) || (xArray[i] > zoomMaxX && xArray[j] > zoomMaxX)) {
						skipY = true;
						skipY2 = true;
						skipDiff = true;
					}
					if((yArray[i] < zoomMinY && yArray[j] < zoomMinY) || (yArray[i] > zoomMaxY && yArray[j] > zoomMaxY)) {
						skipY = true; // line completely outside view
					} // this could be done better, check if the line intersects the rectangle
					if((y2Array[i] < zoomMinY && y2Array[j] < zoomMinY) || (y2Array[i] > zoomMaxY && y2Array[j] > zoomMaxY)) {
						skipY2 = true; // line completely outside view
					} // this could be done better, check if the line intersects the rectangle

					var diffI = y2Array[i] - yArray[i];
					var diffJ = y2Array[j] - yArray[j];
					if((diffI < zoomMinY && diffJ < zoomMinY) || (diffI > zoomMaxY && diffJ > zoomMaxY)) {
						skipDiff = true; // line completely outside view
					} // this could be done better, check if the line intersects the rectangle

					if(!skipY) {
						var x1 = val2pixelXnocrimp(xArray[i]);
						var y1 = val2pixelYnocrimp(yArray[i]);
						var x2 = val2pixelXnocrimp(xArray[j]);
						var y2 = val2pixelYnocrimp(yArray[j]);

						if(drawPretty) {
							var col = colT;
							lineCtx.save();
							if(groupId1 <= 0 && groupId2 <= 0) {
								col = col0;
							}
							else if(groupId1 > 0 && groupId2 > 0) {
								if(groupId1 == groupId2) {
									col = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
								}
								else {
									col = colT;
								}
							}
							else {
								col = col0;
							}

							lineCtx.strokeStyle = col;
							lineCtx.lineWidth = lineWidth;
							lineCtx.beginPath();
							lineCtx.moveTo(x1, y1);
							lineCtx.lineTo(x2, y2);
							lineCtx.stroke();
							lineCtx.restore();
						}
						else {
							var col = rgba0;
							var dashed = false;
							if(groupId1 <= 0 && groupId2 <= 0) {
								col = rgba0;
							}
							else if(groupId1 > 0 && groupId2 > 0) {
								if(groupId1 == groupId2) {
									col = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
								}
								else {
									col = rgbaText;
								}
							}
							else {
								col = rgba0;
							}

							if(col[3] >= 255) {
								drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
							else {
								drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
						}
					}

					if(!skipY2) {
						var x1 = val2pixelXnocrimp(xArray[i]);
						var y1 = val2pixelYnocrimp(y2Array[i]);
						var x2 = val2pixelXnocrimp(xArray[j]);
						var y2 = val2pixelYnocrimp(y2Array[j]);

						if(drawPretty) {
							var col = colT;
							lineCtx.save();
							lineCtx.setLineDash([3, 5]);

							if(groupId1 <= 0 && groupId2 <= 0) {
								col = col0;
							}
							else if(groupId1 > 0 && groupId2 > 0) {
								if(groupId1 == groupId2) {
									col = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
								}
								else {
									col = colT;
								}
							}
							else {
								col = col0;
							}

							lineCtx.strokeStyle = col;
							lineCtx.lineWidth = lineWidth;
							lineCtx.beginPath();
							lineCtx.moveTo(x1, y1);
							lineCtx.lineTo(x2, y2);
							lineCtx.stroke();
							lineCtx.restore();
						}
						else {
							var col = rgba0;
							var dashed = true;
							if(groupId1 <= 0 && groupId2 <= 0) {
								col = rgba0;
							}
							else if(groupId1 > 0 && groupId2 > 0) {
								if(groupId1 == groupId2) {
									col = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
								}
								else {
									col = rgbaText;
								}
							}
							else {
								col = rgba0;
							}

							if(col[3] >= 255) {
								drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
							else {
								drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
						}
					}

					if(!skipDiff) {
						var x1 = val2pixelXnocrimp(xArray[i]);
						var y1 = val2pixelYnocrimp(diffI);
						var x2 = val2pixelXnocrimp(xArray[j]);
						var y2 = val2pixelYnocrimp(diffJ);

						if(drawPretty) {
							var col = "#FF0000";
							col = legacyDDSupLib.hexColorToRGBA(col, transparency);
							lineCtx.save();
							lineCtx.setLineDash([3, 5]);
							lineCtx.strokeStyle = col;
							lineCtx.lineWidth = lineWidth;
							lineCtx.beginPath();
							lineCtx.moveTo(x1, y1);
							lineCtx.lineTo(x2, y2);
							lineCtx.stroke();
							lineCtx.restore();
						}
						else {
							var col = [255, 0, 0, Math.min(255, transparency * 255)];
							var dashed = true;

							if(col[3] >= 255) {
								drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
							else {
								drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
							}
						}
					}
				}
			}
		}
		if(!drawPretty) {
			lineCtx.putImageData(imData, 0, 0);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not original to us. It was very slightly modified by Jonas.
	// Draws a colored line by connecting two points using a DDA algorithm
	// (Digital Differential Analyzer).
	//===================================================================================
	function drawLineDDA(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY) {
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);
		var minX = Math.round(MINX);
		var maxX = Math.round(MAXX);
		var minY = Math.round(MINY);
		var maxY = Math.round(MAXY);

		// Distance start and end point
		var dx = x2 - x1;
		var dy = y2 - y1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		var fatX = true;
		if (lenx > len) {
			len = lenx;
			fatX = false;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				if(!dashed || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
					var ry = Math.round(y);
					var rx = Math.round(x);
					for(var w = 0; w < lineWidth; w++) {
						if(ry >= minY && ry < maxY && rx >= minX && rx < maxX) {
							var offset = (ry * W + rx) * 4;
							legacyDDSupLib.blendRGBAs(r,g,b,alpha, offset, pixels);
						}
						if(fatX) {
							rx++;
						}
						else {
							ry++;
						}
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA Full Alpha
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not original to us. It was very slightly modified by Jonas.
	// Draws a colored line by connecting two points using a DDA algorithm
	// (with full alpha) (Digital Differential Analyzer).
	//===================================================================================
	function drawLineDDAfullalpha(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY) {
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);
		var minX = Math.round(MINX);
		var maxX = Math.round(MAXX);
		var minY = Math.round(MINY);
		var maxY = Math.round(MAXY);

		// Distance start and end point
		var dx = x2 - x1;
		var dy = y2 - y1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		var fatX = true;
		if (lenx > len) {
			len = lenx;
			fatX = false;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				if(!dashed || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
					var ry = Math.round(y);
					var rx = Math.round(x);
					for(var w = 0; w < lineWidth; w++) {
						if(ry >= minY && ry < maxY && rx >= minX && rx < maxX) {
							var offset = (ry * W + rx) * 4;

							pixels[offset] = r;
							pixels[offset+1] = g;
							pixels[offset+2] = b;
							pixels[offset+3] = alpha;
						}
						if(fatX) {
							rx++;
						}
						else {
							ry++;
						}
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Selections When Zooming Or Resizing
	// This method updates selection when zooming or resizing.
	//===================================================================================
	function updateSelectionsWhenZoomingOrResizing() {
		if(unique > 0) {
			for(var sel = 0; sel < selections.length; sel++) {
				var s = selections[sel];
				s[4] = legacyDDSupLib.val2pixelX(s[0], unique, drawW, leftMarg, zoomMinX, zoomMaxX);
				s[5] = legacyDDSupLib.val2pixelX(s[1], unique, drawW, leftMarg, zoomMinX, zoomMaxX);
				s[7] = legacyDDSupLib.val2pixelY(s[2], unique, drawH, topMarg, zoomMinY, zoomMaxY);
				s[6] = legacyDDSupLib.val2pixelY(s[3], unique, drawH, topMarg, zoomMinY, zoomMaxY);
			}
		}
		drawSelections();
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
