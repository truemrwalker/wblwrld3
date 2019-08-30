//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP Scatter Plot Visualisation Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizScatterPlotWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		DrawingArea: ['width', 'height']
	};

	$scope.displayText = "Scatter Plot";
	var preDebugMsg = "hopVizScatterPlotWebble: ";

	var myInstanceId = -1;
	var dataMappings = [];

	// graphics (canvases etc.)
	var bgCanvas = null;
	var bgCtx = null;
	var axesCanvas = null;
	var axesCtx = null;
	var undotCanvas = null;
	var undotCtx = null;
	var dotCanvas = null;
	var dotCtx = null;
	var dropCanvas = null;
	var dropCtx = null;
	var quickRenderThreshold = 500;
	var currentColors = null;
	var textColor = "#000000";
	var transparency = 1;
	var hoverText = null;
	var mouseIsOverMe = false;

	// selections (drawing)
	var selectionCanvas = null;
	var selectionCtx = null;
	var selectionColors = null;
	var selectionTransparency = 0.33;
	var selectionHolderElement = null;
	var selectionRect = null;
	var selections = []; // the graphical ones
	var clickStart = null;

	// layout
	var leftMarg = 35;
	var topMarg = 20;
	var rightMarg = 20;
	var bottomMarg = 5;
	var fontSize = 11;

	// options for visualization
	var dotSize = 5;
	var draw0 = true;
	var drawMean = true;
	var colorPalette = null;
	var useGlobalGradients = false;

	// input data
	var xType = -1;
	var yType = -1;
	var xName = "";
	var yName = "";
	var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0}; // from data
	var zoomMinX = 0;
	var zoomMaxX = 0;
	var zoomMinY = 0;
	var zoomMaxY = 0;
	var unique = 0; // number of data points with non-null values
	var NULLs = 0;
	var grouping = true;
	var nullAsUnselected = false;
	var nullGroup = 0;

	// layout options that change
	var noofGroups = 1;
	var drawH = 1;
	var drawW = 1;

	// keep track of what values we had when we last drew something (to avoid redrawing when nothing changed)
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
	var lastDotSize = null;
	var parsingDataNow = false;

	// here we allow dropping data
	var dropX = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"X-axis Data", "rotate":false, "forMapping":{'name':'dataX', 'type':["number","date"]}};
	var dropY = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "label":"Y-axis Data", "rotate":true, "forMapping":{'name':'dataY', 'type':["number","date"]}};
	var allDropZones = [dropX, dropY];

	// here we allow dragging the data we are currently showing to other visualization components too
	var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var allDragNames = [dragZoneX, dragZoneY];
	$scope.dragNdropRepr = "Nothing to drag.";
	$scope.dragNdropID = "No drag data.";

	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
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
				case "Draw0":
					var newDraw0 = eventData.slotValue;
					if(newDraw0 != draw0) {
						draw0 = newDraw0;
					}
					updateGraphicsHelper(false, false, true);
					break;
				case "DrawMean":
					var newDrawMean = eventData.slotValue;
					if(newDrawMean != drawMean) {
						drawMean = newDrawMean;
					}
					updateGraphicsHelper(false, true, false);
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
				case "MultipleSelectionsDifferentGroups":
					updateLocalSelections(false);
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
					updateGraphicsHelper(false, false, false);
					break;
				case "DrawingArea:width":
					updateSize();
					updateGraphicsHelper(false, false, false);
					break;
				case "root:height":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "root:width":
					updateSize();
					updateGraphicsHelper(true, true, true);
					break;
				case "DotSize":
					var dotSizeNew = $scope.gimme('DotSize');
					if(typeof dotSizeNew !== 'number') {
						try {
							dotSizeNew = parseInt(dotSizeNew);
						} catch(e) {
							dotSizeNew = dotSize;
						}
					}
					if(dotSizeNew < 1) {
						dotSizeNew = 1;
					}
					if(dotSizeNew != dotSize) {
						dotSize = dotSizeNew;
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
				case "ColorScheme":
					colorPalette = null;
					parseSelectionColors();
					var colors = $scope.gimme("ColorScheme");
					if(typeof colors === 'string') {
						colors = JSON.parse(colors);
					}
					currentColors = legacyDDSupLib.copyColors(colors);
					updateGraphicsHelper(false, false, false);
					drawSelections();
					break;
			};
		} catch(exc) {
			$log.log(preDebugMsg + "Something went wrong when we tried to react to slot changes");
			console.dir(exc);
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

			if(hoverText !== null) {
				if(mousePosIsInSelectableArea(currentMouse)) {
					var x = legacyDDSupLib.pixel2valX(currentMouse.x, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var y = legacyDDSupLib.pixel2valX(currentMouse.y, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var s = "[";

					if(xType == 1 || xType == 2) {
						s += (legacyDDSupLib.date2text(Math.floor(x), limits.dateFormatX));
					}
					else {
						s += legacyDDSupLib.number2text(x, limits.spanX);
					}

					s += ",";
					if(yType == 1 || yType == 2) {
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
						$log.log(preDebugMsg + "No selection rectangle!");
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
			if(e.which === 1){
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
				if(mousePosIsInSelectableArea(currentMouse)) {
					clickStart = currentMouse;
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
					$log.log(preDebugMsg + "No hover text!");
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
	function fixedKeypress(event){
		if(mouseIsOverMe) {
			var x = event.which || event.keyCode;
			// $log.log(preDebugMsg + "keyPressed over me: " + x);
			switch(x) {
				case 43: // +
				case 107:
				case 187:
				case 59: // ; (also on the plus key)
					event.stopPropagation();
					event.preventDefault();
					zoomIn();
					break;
				case 45: // -
				case 109:
				case 189:
				case 61: // = (also on the minus key)
				case 95: // _
					event.stopPropagation();
					event.preventDefault();
					zoomOut();
					break;
				case 37: // left arrow
					event.stopPropagation();
					event.preventDefault();
					panLeft();
					break;
				case 39: // right arrow
					event.stopPropagation();
					event.preventDefault();
					panRight();
					break;
				case 40: // down arrow
					event.stopPropagation();
					event.preventDefault();
					panDown();
					break;
				case 38: // up arrow
					event.stopPropagation();
					event.preventDefault();
					panUp();
					break;
				case 122: // z
				case 90: // Z
					event.stopPropagation();
					event.preventDefault();
					zoomIn();
					break;
				case 120: // x
				case 88: // X
					event.stopPropagation();
					event.preventDefault();
					zoomOut();
					break;
				case 97: // a
				case 65: // A
					event.stopPropagation();
					event.preventDefault();
					panLeft();
					break;
				case 100: // d
				case 68: // D
					event.stopPropagation();
					event.preventDefault();
					panRight();
					break;
				case 115: // s
				case 83: // S
					event.stopPropagation();
					event.preventDefault();
					panDown();
					break;
				case 119: // w
				case 87: // W
					event.stopPropagation();
					event.preventDefault();
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



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		// Turn off some things we do not want the users to do in our applications
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

		// Slots for our plugin

		$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
			grouping,
			"Multiple Selections -> Different Groups",
			'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DotSize',
			5,
			"DotSize",
			'The size (in pixels) of the dots in the plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('TreatNullAsUnselected',
			nullAsUnselected,
			"Treat Null as Unselected",
			'Group data items with no value together with items that are not selected (otherwise they get their own group).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Draw0',
			draw0,
			"Draw 0",
			'Draw dotted lines for 0 on the X and Y axis, to easily see where origo is.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DrawMean',
			drawMean,
			"Draw Mean",
			'Draw a cross at the location of the means of each group of data.',
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

		$scope.addSlot(new Slot('QuickRenderThreshold',
			500,
			"Quick Render Threshold",
			'The number of data items to accept before switching to faster (but less pretty) rendering.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseGlobalColorGradients',
			false,
			"Use Global Color Gradients",
			'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
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

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Dashboard Plugin slots -----------------------------------------------------------

		$scope.addSlot(new Slot('PluginName',
			"Scatter Plot",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// colors of groups of data, and the background color theme
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

		window.addEventListener('keydown', fixedKeypress );
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
		$scope.theView.find('.canvasStuffForHopVizScatterPlotWebble').droppable({
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

					// $log.log(preDebugMsg + "Data dropped");
					for(var d = 0; !ok && d < allDropZones.length; d++) {
						var dropZone = allDropZones[d];

						if(xpos <= dropZone.right && xpos >= dropZone.left && ypos >= dropZone.top && ypos < dropZone.bottom) {
							f = dropZone.forMapping;
							ok = true;
						}
					}
					if(ok) {
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
	// This method imitates a data drop.
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
	};
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
			var haveX = false;
			var haveY = false;
			var lenX = -1;
			var lenY = -1;
			var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
			var ls = w.scope().gimme(dataMappings[src].slotName);

			for(var f = 0; f < dataMappings[src].map.length; f++) {
				if(dataMappings[src].map[f].name == "dataX") {
					if(dataMappings[src].map[f].srcIdx < ls.length) {
						haveX = true;
						var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
						lenX = fieldInfo.size;

						if(!typeCheck(fieldInfo.type, dropX.forMapping.type)) {
							haveX = false;
						}
					}
				}
				if(dataMappings[src].map[f].name == "dataY") {
					if(dataMappings[src].map[f].srcIdx < ls.length) {
						haveY = true;
						var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
						lenY = fieldInfo.size;

						if(!typeCheck(fieldInfo.type, dropY.forMapping.type)) {
							haveY = false;
						}
					}
				}

				if(dataMappings[src].map[f].listen === null && dataMappings[src].map[f].srcIdx < ls.length) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;
				}
			}

			if(haveX && haveY && lenX != lenY) {
				$log.log(preDebugMsg + "Data fields have different number of data items, which is not allowed for the Scatter Plot");
			}

			var canActivate = false;
			if(haveX && haveY && lenX == lenY) {
				canActivate = true;
				atLeastOneActive = true;
			}

			if(dataMappings[src].active != canActivate) {
				// we can start visualizing this data
				dataMappings[src].clean = false;
				somethingChanged = true;
			}

			if(canActivate) {
				var ls2 = [];
				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					ls2.push(dataMappings[src].map[ff].srcIdx);
				}

				// start listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
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
								var parsingDataOldStatus = parsingDataNow;
								parsingDataNow = true; // we do not want to redraw now
								dataMappings[mapSrcIdx].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
								parsingDataNow = parsingDataOldStatus;
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

				if(targetField.name == "dataX") {
					dragZoneX.ID = JSON.stringify(dataSourceInfo);
					xName = dataSourceInfo.fieldName;
				}
				if(targetField.name == "dataY") {
					dragZoneY.ID = JSON.stringify(dataSourceInfo);
					yName = dataSourceInfo.fieldName;
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
					newSelections.push([X1,X2,Y1,Y2, legacyDDSupLib.val2pixelX(X1, unique, drawW, leftMarg, zoomMinX, zoomMaxX),legacyDDSupLib.val2pixelX(X2, unique, drawW, leftMarg, zoomMinX, zoomMaxX),legacyDDSupLib.val2pixelY(Y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.val2pixelY(Y1, unique, drawH, topMarg, zoomMinY, zoomMaxY)]); // flip Y-axis
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
		var dirty = false;
		var newnullAsUnselected = $scope.gimme('TreatNullAsUnselected');
		if(newnullAsUnselected != nullAsUnselected) {
			nullAsUnselected = newnullAsUnselected;
			dirty = true;
		}

		var newnullGroup = 0;
		if(!nullAsUnselected) {
			newnullGroup = selections.length + 1; // get unused groupId
		}
		if(nullGroup != newnullGroup) {
			nullGroup = newnullGroup;
			dirty = true;
		}

		var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
		if(newGrouping != grouping) {
			grouping = newGrouping;
			dirty = true;
		}

		selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.

		if(!selectAll) {
			if(selections.length == 1 && selections[0][0] <= limits.minX && selections[0][1] >= limits.maxX && selections[0][2] <= limits.minY && selections[0][3] >= limits.maxY) {
				selectAll = true;
			}
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var srcsrc = src;
				dataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAll);
			}
			else {
				dataMappings[src].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)

				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					if(dataMappings[src].map[ff].hasOwnProperty("listen") && dataMappings[src].map[ff].listen !== null) {
						// $log.log(preDebugMsg + "Not active (selection), stop listening to " + dataMappings[src].map[ff].name + " " + dataMappings[src].map[ff].srcIdx);
						dataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status
	// This method returns this Webbles selection status.
	//===================================================================================
	function mySelectionStatus(src, idx) {
		if(dataMappings[src].active) {
			var fx = dataMappings[src].xFun;
			var fy = dataMappings[src].yFun;
			x = fx(idx);
			y = fy(idx);

			if(x === null || y === null) {
				return nullGroup;
			}

			if(xType == 1) {
				x = x.getTime();
			}
			else if(xType == 2) {
				x = Date.parse(x);
			}

			if(yType == 1) {
				y = y.getTime();
			}
			else if(yType == 2) {
				y = Date.parse(y);
			}

			if(selections.length > 0) {
				var groupId = 0;
				for(var span = 0; span < selections.length; span++) {
					if(selections[span][0] <= x && x <= selections[span][1] && selections[span][2] <= y && y <= selections[span][3]) {
						groupId = span + 1;
						break;
					}
				}

				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets all the main variables for the plugin Webble getting it ready
	// for new fresh data.
	//===================================================================================
	function resetVars() {
		xType = -1;
		yType = -1;
		allDragNames = [dragZoneX, dragZoneY];
		limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
		unique = 0;
		NULLs = 0;
		lastSeenSelectionSeqNo = -1;
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		parsingDataNow = true;
		resetVars();
		var firstNonNullData = true;
		var minXVal = 0;
		var maxXVal = 0;
		var minYVal = 0;
		var maxYVal = 0;
		var dataIsCorrupt = false;

		for(var src = 0; src < dataMappings.length; src++) {
			// not done this way, dataMappings[src].activate(dataMappings[src].active);
			if(dataMappings[src].active) {
				var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
				var ls = w.scope().gimme(dataMappings[src].slotName);

				for(var f = 0; f < dataMappings[src].map.length; f++) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;

					if(dataMappings[src].map[f].name == "dataX") {
						var lenX = fieldInfo.size;
						dataMappings[src].xFun = fieldInfo.val;
						dataMappings[src].selFun = fieldInfo.sel;
						dataMappings[src].size = lenX;
						dataMappings[src].newSelections = fieldInfo.newSel;
					}
					if(dataMappings[src].map[f].name == "dataY") {
						var lenY = fieldInfo.size;
						dataMappings[src].yFun = fieldInfo.val;
						dataMappings[src].newSelections = fieldInfo.newSel;
					}
				}
			}
			dataMappings[src].clean = true;
		}

		for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
			var fx = dataMappings[src].xFun;
			var fy = dataMappings[src].yFun;

			for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
				x = fx(i);
				y = fy(i);

				if(x !== null && y !== null) {
					unique++;

					if(firstNonNullData) {
						if(typeof x == 'number') {
							xType = 0;
						}
						else if(x instanceof Date) {
							xType = 1;
							x = x.getTime();
						}
						else if(typeof x == 'string') {
							xType = 2;
							x = Date.parse(x); // what if it is something like "21"?
						}
						else {
							dataIsCorrupt = true;
							var xs = x.toString().substr(0,32);
							$log.log(preDebugMsg + "Cannot handle value '" + xs + "'");
						}

						if(typeof y == 'number') {
							yType = 0;
						}
						else if(y instanceof Date) {
							yType = 1;
							y = y.getTime();
						}
						else if(typeof y == 'string') {
							yType = 2;
							y = Date.parse(y); // what if it is something like "21"?
						}
						else {
							dataIsCorrupt = true;
							var ys = y.toString().substr(0,32);
							$log.log(preDebugMsg + "Cannot handle value '" + ys + "'");
						}

						minXVal = x;
						maxXVal = x;
						minYVal = y;
						maxYVal = y;

						firstNonNullData = false;
					}
					else { // not first non-null data
						if(typeof x == 'number') {
							if(xType != 0) {
								dataIsCorrupt = true;
							}
						}
						else if(x instanceof Date) {
							if(xType != 1) {
								dataIsCorrupt = true;
							}
							x = x.getTime();
						}
						else if(typeof x == 'string') {
							if(xType != 2) {
								dataIsCorrupt = true;
							}
							x = Date.parse(x); // what if it is something like "21"?
						}
						else {
							dataIsCorrupt = true;
							$log.log(preDebugMsg + "Cannot handle value '" + x + "'");
						}

						if(typeof y == 'number') {
							if(yType != 0) {
								dataIsCorrupt = true;
							}
						}
						else if(y instanceof Date) {
							if(yType != 1) {
								dataIsCorrupt = true;
							}
							y = y.getTime();
						}
						else if(typeof y == 'string') {
							if(yType != 2) {
								dataIsCorrupt = true;
							}
							y = Date.parse(y); // what if it is something like "21"?
						}
						else {
							dataIsCorrupt = true;
							$log.log(preDebugMsg + "Cannot handle value '" + y + "'");
						}

						minXVal = Math.min(x, minXVal);
						maxXVal = Math.max(x, maxXVal);
						minYVal = Math.min(y, minYVal);
						maxYVal = Math.max(y, maxYVal);
					}

					if(isNaN(x) || isNaN(y)) {
						dataIsCorrupt = true;
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

		if(!dataIsCorrupt) {
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

			if(xType == 1 || xType == 2) {
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

			if(yType == 1 || yType == 2) {
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

		if(dataIsCorrupt) {
			$log.log(preDebugMsg + "data is corrupt");

			for(var src = 0; src < dataMappings.length; src++) {
				for(var f = 0; f < dataMappings[src].map.length; f++) {
					if(dataMappings[src].map[f].listen !== null) {
						// $log.log(preDebugMsg + "Data corrupt, stop listening to " + dataMappings[src].map[f].name + " " + dataMappings[src].map[i].srcIdx);
						dataMappings[src].map[f].listen(myInstanceId, false, null, null, []);
					}
				}
			}
			resetVars();
		}

		if(unique > 0) {
			var giveUp = checkSelectionsAfterNewData();
			if(giveUp) {
				$scope.selectAll();
			}
			else {
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
		else { // no data
			updateLocalSelections(false);

			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
				var W = selectionCanvas.width;
				var H = selectionCanvas.height;
				selectionCtx.clearRect(0,0, W,H);
			}
		}
		parsingDataNow = false;
		updateGraphicsHelper(false, true, true);
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
	function updateGraphicsHelper(forceBackground, forceDots, forceAxes) {
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

		updateDropZones(textColor, 0.3, false);

		zoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
		zoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
		zoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
		zoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);

		var redrawBackground = forceBackground;
		var redrawDots = forceDots;
		var redrawAxes = forceAxes;

		// Check what needs to be redrawn
		if(drawW != lastDrawW || drawH != lastDrawH) {
			redrawBackground = true;
			redrawDots = true;
			redrawAxes = true;
		}

		if(!redrawBackground && currentColors != lastColors) {
			redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
		}

		if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
			redrawAxes = true;
		}

		if(lastDotSize != dotSize) {
			redrawDots = true;
		}

		if(!redrawAxes || !redrawDots) {
			if(zoomMinX != lastZoomMinX || zoomMaxX != lastZoomMaxX || zoomMinY != lastZoomMinY || zoomMaxY != lastZoomMaxY) {
				redrawAxes = true;
				redrawDots = true;
			}
		}

		if(!redrawDots) {
			if(legacyDDSupLib.checkColors(currentColors, lastColors)) {
				redrawDots = true;
			}
		}

		// Draw
		// $log.log(preDebugMsg + "Need to redraw: " + redrawBackground + " " + redrawDots + " " + " " + redrawAxes);
		if(true) { // redrawBackground) {
			// always redraw background, because we do something to the bgCanvas.width, and that resets the canvas.
			drawBackground(W, H);
		}
		if(redrawAxes) {
			drawAxes(W, H);
		}
		if(redrawDots) {
			drawScatterPlot(W, H);
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
		lastDotSize = dotSize;
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
		// $log.log(preDebugMsg + "update the data drop zone locations");
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

			var dzYleft = 2; // 6 + dropZonePadding + dropZoneBorderW * 2;
			var dzYtop = topMarg;
			var dzYheight = Math.max(5, drawH + 2);
			var dzYwidth = Math.max(5, leftMarg - 8);

			dropY.left = dzYleft;
			dropY.top = dzYtop + marg2;
			dropY.right = dzYleft + dzYwidth;
			dropY.bottom = dzYtop + dzYheight - marg2;

			var dzXleft = leftMarg - 3; // + dropZonePadding + dropZoneBorderW * 2;
			var dzXtop = topMarg + drawH + 3;
			var dzXheight = Math.max(5, bottomMarg * 2 + fontSize - 6);
			var dzXwidth = Math.max(5, drawW + 2);

			dropX.left = dzXleft + marg1;
			dropX.top = dzXtop;
			dropX.right = dzXleft + dzXwidth - marg1;
			dropX.bottom = dzXtop + dzXheight;

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
		var yw = -1;
		if(xName != "" && yName != "") {
			str = xName + " --> " + yName;
			xw = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, xName);
			yw = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, yName);
		}
		else if(xName != "") {
			str = xName;
			xw = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, xName);
		}
		else if(yName != "") {
			str = yName;
			yw = legacyDDSupLib.getTextWidthCurrentFont(axesCtx, yName);
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
				dragZoneX = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':xName, 'ID':dragZoneX.ID};
			}
			if(yw >= 0) {
				dragZoneY = {'left':(left + w - yw), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':yName, 'ID':dragZoneY.ID};
			}
			allDragNames = [dragZoneX, dragZoneY];
		}

		// X axis
		axesCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

		if(unique > 0) {
			var LABELS = 5;
			for(var i = 0; i < LABELS+1; i++) {
				var pos = leftMarg + i/LABELS*drawW;
				var s = "";
				if(xType == 0) {
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX), limits.spanX);
				}
				else {
					s = (legacyDDSupLib.date2text(Math.floor(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX)), limits.dateFormatX));
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
				if(yType == 0) {
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY), limits.spanY);
				}
				else {
					s = (legacyDDSupLib.date2text(Math.floor(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY)), limits.dateFormatY));
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
		if(draw0) {
			if(unique > 0) {
				if(xType == 0) {
					if(zoomMinX < 0 && zoomMaxX > 0) {
						var pos = legacyDDSupLib.val2pixelX(0, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
						var col = hexColorToRGBA(textColor, 0.5);
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

				if(yType == 0) {
					if(zoomMinY < 0 && zoomMaxY > 0) {
						var pos = legacyDDSupLib.val2pixelY(0, unique, drawH, topMarg, zoomMinY, zoomMaxY);
						var col = hexColorToRGBA(textColor, 0.5);
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

		var dotDirty = false;
		if(dotCanvas === null) {
			dotDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
			if(myCanvasElement.length > 0) {
				dotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(dotCanvas.width != rw) {
			dotDirty = true;
			dotCanvas.width = rw;
		}
		if(dotCanvas.height != rh) {
			dotDirty = true;
			dotCanvas.height = rh;
		}

		if(undotCanvas === null) {
			undotDirty = true;
			var myCanvasElement = $scope.theView.parent().find('#theUnselectedDotCanvas');
			if(myCanvasElement.length > 0) {
				undotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		if(undotCanvas.width != rw) {
			undotDirty = true;
			undotCanvas.width = rw;
		}
		if(undotCanvas.height != rh) {
			undotDirty = true;
			undotCanvas.height = rh;
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


		if(dropCanvas.width != rw) {
			dropCanvas.width = rw;
		}
		if(dropCanvas.height != rh) {
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

		// $log.log(preDebugMsg + "updateSize found selections: " + JSON.stringify(selections));
		updateSelectionsWhenZoomingOrResizing();
		updateDropZones(textColor, 0.3, false);
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
			var newSel = [legacyDDSupLib.pixel2valX(x1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valX(x2, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valY(y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.pixel2valY(y1, unique, drawH, topMarg, zoomMinY, zoomMaxY), x1,x2,y1,y2]; // y1 and y2 need to be switched here, because we flip the y axis
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
	$scope.selectAll = function() {
		if(unique <= 0) {
			selections = [];
		}
		else {
			selections = [[limits.minX, limits.maxX, limits.minY, limits.maxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
		}
		drawSelections();
		updateLocalSelections(true);
		saveSelectionsInSlot();
	};
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
				selectionColors.color = hexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = hexColorToRGBA('#FFA500', selectionTransparency); // orange
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
						selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], hexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
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
		if(pos.x > leftMarg - 5 && pos.x <= leftMarg + drawW + 5 && pos.y > topMarg - 5 && pos.y <= topMarg + drawH + 5) {
			return true;
		}
		return false;
	}
	//===================================================================================


	// ==============================================
	// ------- Unique Methods for this Webble -------
	// ==============================================

	//===================================================================================
	// Draw Scatter Plot
	// This method draws the scatter plot.
	//===================================================================================
	function drawScatterPlot(W, H) {
		// $log.log(preDebugMsg + "drawScatterPlot");
		if(dotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
			if(myCanvasElement.length > 0) {
				dotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(dotCtx === null) {
			dotCtx = dotCanvas.getContext("2d");
		}

		if(!dotCtx) {
			$log.log(preDebugMsg + "no canvas to draw on");
			return;
		}

		dotCtx.clearRect(0,0, W,H);

		if(undotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theUnselectedDotCanvas');
			if(myCanvasElement.length > 0) {
				undotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(undotCtx === null) {
			undotCtx = undotCanvas.getContext("2d");
		}

		if(!undotCtx) {
			$log.log(preDebugMsg + "no canvas to draw unselected data on");
			return;
		}

		undotCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		noofGroups = 0;
		var centerOfMass = {"tot":[0,0,0]};
		var zeroTransp = 0.33 * transparency;

		// first draw all the unselected data
		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var rgbaText = hexColorToRGBAvec(textColor, transparency);
			var imData = dotCtx.getImageData(0, 0, dotCanvas.width, dotCanvas.height);
			var imData0 = undotCtx.getImageData(0, 0, undotCanvas.width, undotCanvas.height);
			var pixels = imData.data;
			var pixels0 = imData0.data;
		}
		else {
			var col0 = hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var colT = hexColorToRGBA(textColor, transparency);
			var fill0 = legacyDDSupLib.getGradientColorForGroup(0, 0,0,W,H, zeroTransp, undotCanvas, undotCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].selFun;
				var fx = dataMappings[src].xFun;
				var fy = dataMappings[src].yFun;
				var lenX = dataMappings[src].size;
				var x = null;
				var y = null;

				for(var i = 0; i < lenX; i++) {
					x = fx(i);
					y = fy(i);

					if(x === null || y === null) {
						continue;
					}

					if(xType == 1) {
						x = x.getTime();
					}
					else if(xType == 2) {
						x = Date.parse(x);
					}

					if(yType == 1) {
						y = y.getTime();
					}
					else if(yType == 2) {
						y = Date.parse(y);
					}

					if(drawMean) {
						centerOfMass["tot"][0] += x;
						centerOfMass["tot"][1] += y;
						centerOfMass["tot"][2] += 1;
					}

					var groupId = fsel(i); // fsel(i) ?? TODO

					if(drawMean) {
						if(!centerOfMass.hasOwnProperty(groupId)) {
							centerOfMass[groupId] = [0, 0, 0];
						}
						centerOfMass[groupId][0] += x;
						centerOfMass[groupId][1] += y;
						centerOfMass[groupId][2] += 1;
					}

					if(x < zoomMinX || x > zoomMaxX || y < zoomMinY || y > zoomMaxY) {
						continue; // outside zoomed range
					}

					var pxx = legacyDDSupLib.val2pixelX(x, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
					var pxy = legacyDDSupLib.val2pixelY(y, unique, drawH, topMarg, zoomMinY, zoomMaxY);

					if(groupId == 0) {
						if(drawPretty) {
							if(!useGlobalGradients) {
								fill = legacyDDSupLib.getGradientColorForGroup(0, pxx-dotSize,pxy-dotSize,pxx+dotSize,pxy+dotSize, zeroTransp, undotCanvas, undotCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
							}
							else {
								fill = fill0;
							}
							undotCtx.beginPath();
							undotCtx.arc(pxx, pxy, dotSize, 0, 2 * Math.PI, false);
							undotCtx.fillStyle = fill;
							undotCtx.fill();
							undotCtx.lineWidth = 1;
							undotCtx.strokeStyle = col0;
							undotCtx.stroke();
						}
						else {
							var rgba = rgba0;
							drawDotfullalpha(pxx, pxy, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels0); // make the selected data always transparent, no matter how many dots are on top of each other
						}
					}
					else { // not the unselected data
						if(drawPretty) {
							var col = hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
							var fill = legacyDDSupLib.getGradientColorForGroup(groupId, pxx-dotSize,pxy-dotSize,pxx+dotSize,pxy+dotSize, transparency, dotCanvas, dotCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
							dotCtx.beginPath();
							dotCtx.arc(pxx, pxy, dotSize, 0, 2 * Math.PI, false);
							dotCtx.fillStyle = fill;
							dotCtx.fill();
							dotCtx.lineWidth = 1;
							dotCtx.strokeStyle = col;
							dotCtx.stroke();
						}
						else {
							rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
							if(rgba[3] >= 255) {
								drawDotfullalpha(pxx, pxy, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
							}
							else {
								drawDot(pxx, pxy, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
							}
						}
					}
				}
			}
		}

		// Draw the center of mass of each group of data
		if(drawMean) {
			for(var pass = 0; pass < 3; pass++) {
				for(var groupId in centerOfMass) {
					if(pass == 0 && groupId != "0") {
						continue;
					}
					if(pass == 1 && groupId != "tot") {
						continue;
					}
					if(pass == 2 && (groupId == "tot" || groupId == "0")) {
						continue;
					}
					if(centerOfMass[groupId][2] > 0) {
						var x = centerOfMass[groupId][0] / centerOfMass[groupId][2];
						var y = centerOfMass[groupId][1] / centerOfMass[groupId][2];

						if(x < zoomMinX || x > zoomMaxX || y < zoomMinY || y > zoomMaxY) {
							continue; // outside zoomed range
						}

						x = Math.round(legacyDDSupLib.val2pixelX(x, unique, drawW, leftMarg, zoomMinX, zoomMaxX));
						y = Math.round(legacyDDSupLib.val2pixelY(y, unique, drawH, topMarg, zoomMinY, zoomMaxY));

						if(drawPretty) {
							var col = textColor;
							if(groupId != "tot") {
								col = legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors); // do not use col0 for group 0, it is too transparent
							}

							dotCtx.save();
							dotCtx.strokeStyle = textColor;
							dotCtx.lineWidth = 1;
							dotCtx.beginPath();
							dotCtx.moveTo(x-1, Math.max(0, y - dotSize*2 - 2));
							dotCtx.lineTo(x-1, Math.min(topMarg + drawH, y + dotSize*2 + 2));
							dotCtx.stroke();
							dotCtx.beginPath();
							dotCtx.moveTo(x+1, Math.max(0, y - dotSize*2 - 2));
							dotCtx.lineTo(x+1, Math.min(topMarg + drawH, y + dotSize*2 + 2));
							dotCtx.stroke();
							dotCtx.beginPath();
							dotCtx.moveTo(Math.max(0, x - dotSize*2 - 2), y-1);
							dotCtx.lineTo(Math.min(leftMarg + drawW, x + dotSize*2 + 2), y-1);
							dotCtx.stroke();
							dotCtx.beginPath();
							dotCtx.moveTo(Math.max(0, x - dotSize*2 - 2), y+1);
							dotCtx.lineTo(Math.min(leftMarg + drawW, x + dotSize*2 + 2), y+1);
							dotCtx.stroke();
							dotCtx.strokeStyle = col;
							dotCtx.lineWidth = 1;
							dotCtx.beginPath();
							dotCtx.moveTo(x, Math.max(0, y - dotSize*2 - 2));
							dotCtx.lineTo(x, Math.min(topMarg + drawH, y + dotSize*2 + 2));
							dotCtx.stroke();
							dotCtx.beginPath();
							dotCtx.moveTo(Math.max(0, x - dotSize*2 - 2), y);
							dotCtx.lineTo(Math.min(leftMarg + drawW, x + dotSize*2 + 2), y);
							dotCtx.stroke();
							dotCtx.restore();
						}
						else {
							var rgbaText = hexColorToRGBAvec(textColor, 1);
							var rgba = rgbaText;
							if(groupId != "tot") {
								rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), 1);
							}

							var startPixelIdx = (y * W + x) * 4;
							var size = dotSize + 2;

							for(var xx = -size; xx <= size; xx++) {
								if(x + xx >= 0 && x + xx < W) {
									var offset = startPixelIdx + xx * 4;
									pixels[offset] = rgba[0];
									pixels[offset+1] = rgba[1];
									pixels[offset+2] = rgba[2];
									pixels[offset+3] = rgba[3];
								}
								if(xx != 0) {
									if(y > 0) {
										var oo = offset - W*4;
										pixels[oo] = rgbaText[0];
										pixels[oo+1] = rgbaText[1];
										pixels[oo+2] = rgbaText[2];
										pixels[oo+3] = rgbaText[3];
									}
									if(y < H - 1) {
										var oo = offset + W*4;
										pixels[oo] = rgbaText[0];
										pixels[oo+1] = rgbaText[1];
										pixels[oo+2] = rgbaText[2];
										pixels[oo+3] = rgbaText[3];
									}
								}
							}
							for(var yy = -size; yy <= size; yy++) {
								if(y + yy >= 0 && y + yy < H) {
									var offset = startPixelIdx + yy*W*4;
									pixels[offset] = rgba[0];
									pixels[offset+1] = rgba[1];
									pixels[offset+2] = rgba[2];
									pixels[offset+3] = rgba[3];
								}
								if(yy != 0) {
									if(x > 0) {
										var oo = offset - 4;
										pixels[oo] = rgbaText[0];
										pixels[oo+1] = rgbaText[1];
										pixels[oo+2] = rgbaText[2];
										pixels[oo+3] = rgbaText[3];
									}
									if(x < W - 1) {
										var oo = offset + 4;
										pixels[oo] = rgbaText[0];
										pixels[oo+1] = rgbaText[1];
										pixels[oo+2] = rgbaText[2];
										pixels[oo+3] = rgbaText[3];
									}
								}
							}
						}
					}
				}
			}
		}

		if(!drawPretty) {
			// if we do not use timeout here, sometimes only one of the canvases redraw properly (for example when resizing)
			$timeout(function() {
				undotCtx.putImageData(imData0, 0, 0);
			}, 1);
			$timeout(function() {
				dotCtx.putImageData(imData, 0, 0);
			}, 1);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot
	// This method draws a single dot (of the catter plot).
	//===================================================================================
	function drawDot(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * W + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= 0 && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= 0 && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * W + x) * 4;
							legacyDDSupLib.blendRGBAs(r,g,b,alpha, startPixelIdx + offset, pixels);
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot Full Alpha
	// This method draws a single dot (of the catter plot) with full alpha.
	//===================================================================================
	function drawDotfullalpha(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * W + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= 0 && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= 0 && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * W + x) * 4;
							pixels[startPixelIdx + offset] = r;
							pixels[startPixelIdx + offset + 1] = g;
							pixels[startPixelIdx + offset + 2] = b;
							pixels[startPixelIdx + offset + 3] = alpha;
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Selections when Zooming or Resizing
	// This method updates the selections when zooming or resizing.
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


	//===================================================================================
	// Hex Color to RGBA Vector
	// This method converts a hexadecimal color value to a RGBA vector.
	//===================================================================================
	function hexColorToRGBAvec(color, alpha) {
		var res = [];

		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
			return [r, g, b, a];
		}
		return [0, 0, 0, 255];
	}
	//===================================================================================


	//===================================================================================
	// Hex Color to RGBA
	// This method converts a hexadecimal color value to a RGBA color.
	//===================================================================================
	function hexColorToRGBA(color, alpha) {
		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
		}
		return color;
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
