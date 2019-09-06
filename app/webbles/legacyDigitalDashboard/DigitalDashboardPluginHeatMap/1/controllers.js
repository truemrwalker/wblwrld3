//======================================================================================================================
// Controllers for Digital Dashboard Plugin Heat Map Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('heatMapPluginWebbleCtrl', function($scope, $log, Slot, Enum, $location) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.displayText = "Heat Map";
	var preDebugMsg = "DigitalDashboard Heat Map: ";
    var myPath = "";  // used by the background threads

    // graphics
    var bgCanvas = null;
    var bgCtx = null;
    var dropCanvas = null;
    var dropCtx = null;
    var barCanvas = null;
    var barCtx = null;
    var boxesCanvas = null;
    var boxesCtx = null;
    var labelsCanvas = null;
    var labelsCtx = null;
    var clusterCanvas = null;
    var clusterCtx = null;
    var heatmapCanvas = null;
    var heatmapCtx = null;
    var quickRenderThreshold = 500;
    var textColor = "#000000";
    var currentColors = null;
    var hoverText = null;
    var rowDataName = "";
    var colDataName = "";
    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;
    var selectionHolderElement = null;
    var selectionRect = null;
    var selections = []; // the graphical ones

    // layout
    var selectionBarW = 20;
    var selectionBarLeftMargin = 10;
    var selectionBarRightMargin = 35;
    var selectionBarTopMargin = fontSize;
    var selectionBarBottomMargin = fontSize;
    var barH = 100; // (drawH - selectionBarTopMargin - selectionBarBottomMargin); // calculated
    var leftMarg = selectionBarW + selectionBarLeftMargin + selectionBarRightMargin; // calculated
    var topMarg = 20;
    var rightMarg = 30;
    var bottomMarg = 5;
    var fontSize = 11;
    var cellW = 1;
    var cellH = 1;
    var minCellW = 0;
    var minCellH = 0;
    var colorPalette = null;
    var hotColor = "#FF8C00";
    var hotColorRGB = [255, 140, 0];
    var coldColor = "#00FA9A";
    var coldColorRGB = [0, 250, 154];
    var zeroColor = "#000000";
    var zeroColorRGB = [0,0,0];
    var borderColor = "#FFFF00";
    var showColumnLabels = false;
    var showBorder = false;
    var fadeOutUnselected = true;
    var sortRows = false;
    var sortCols = false;
    var rowTopCluster = [];
    var colTopCluster = [];
    var rowBackgroundThread = null;
    var colBackgroundThread = null;
    var showClustering = false;
    var clusterTreeSpacing = 3;
    var clickStart = null;

    // data from parent
    var idArrays = [];
    var vectorArrays = [];
    var columnIdArrays = [];
    var columnArrays = [];
    var haveCols = false;
    var columnNames = [];
    var sources = 0;
    var Ns = [];
    var N = 0;
    var noofRows = 0;
    var noofCols = 0;
    var heatLimits = {'min':0, 'max':0};
    var unique = 0; // number of data points with non-null values
    var NULLs = 0;
    var localSelections = []; // the data to send to the parent
    var localSelectionsCols = [];
    var rowSelectedState = [];
    var colSelectedState = [];
    var rowIdSetIdIdx = [];
    var colIdSetIdIdx = [];
    var heatMap = [];
    var rowIdxToOnScreenIdx = []; // rows can be sorted/clustered
    var rowOnScreenIdxToIdx = []; // reverse mapping
    var colIdxToOnScreenIdx = []; // column can be sorted/clustered
    var colOnScreenIdxToIdx = []; // reverse mapping
    var drawH = 1;
    var drawW = 1;
    var lastSeenData = "";
    var internalSelectionsInternallySetTo = {};
    var transactions = [];
    var transactionsForAll = true;
    var lastW = 0;
    var lastH = 0;
    var lastCellW = 0;
    var lastCellH = 0;
    var lastLeftMarg = 0;
    var lastShowBorder = 0;
    var lastBorderColor = 0;
    var lastBarH = 0;
    var lastSelectionBarLeftMargin = 0;
    var lastSelectionBarW = 0;
    var lastHotColor = 0;
    var lastColdColor = 0;
    var lastZeroColor = 0;
    var lastColors = 0;
    var lastTextColor = 0;
    var lastShowClustering = 0;
    var lastShowColumnLabels = 0;
    var lastFadeOutUnselected = 0;
    var lastFontSize = 0;
    var lastSelectionBarTopMargin = 0;
    var lastSelectionBarBottomMargin = 0;
    var lastSeenGlobalSelections = [];
    var lastSeenGlobalSelectionsCols = [];
    var lastRowDataName = "";
    var lastColDataName = "";
    var dropVecs = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"Vectors", "rotate":true, "forParent":{'idSlot':'DataIdSlot', 'name':'Vectors', 'type':'vector', 'slot':'Vectors'}};
    var dropCols = {'left':leftMarg, 'top':topMarg*2, 'right':leftMarg*2, 'bottom':topMarg * 3, "label":"Column labels", "rotate":false, "forParent":{'idSlot':'ColumnIdSlot', 'name':'Column Names', 'type':'string', 'slot':'ColumnNames'}};
    var allDropZones = [dropVecs, dropCols];
    var dragZoneVecs = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneCols = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneTransactions = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneVecs, dragZoneCols, dragZoneTransactions];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";
    var alreadyLoggedBackgroundCapability = false;



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
		var newVal;
		switch(eventData.slotName) {
			case "InternalSelections":
				if(eventData.slotValue != internalSelectionsInternallySetTo) {
					setSelectionsFromSlotValue();
				}
				break;
			case "SelectAll":
				if(eventData.slotValue) {
					selectAll();
					$scope.set("SelectAll",false);
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
							updateGraphicsHelper(false, false, false, true, false, false, false);
						}
					}
				}
				break;
			case "TreatNullAsUnselected":
				updateLocalSelections(false);
				break;
			case "FontSize":
				updateSize();
				break;
			case "DrawingArea:height":
				updateSize();
				break;
			case "DrawingArea:width":
				updateSize();
				break;
			case "root:height":
				updateSize();
				break;
			case "root:width":
				updateSize();
				break;
			case "PluginName":
				$scope.displayText = eventData.slotValue;
				updateFormat();
				break;
			case "PluginType":
				if(eventData.slotValue != "Hybrid") {
					$scope.set("PluginType", "Hybrid");
				}
				break;
			case "GlobalSelections":
				checkIfGlobalSelectionsActuallyChanged();
				break;
			case "Highlights":
				updateGraphicsHelper(false, false, false, false, false, false, false);
				break;
			case "GroupColors":
				colorPalette = null;
				parseSelectionColors();
				var colors = $scope.gimme("GroupColors");
				if(typeof colors === 'string') {
					colors = JSON.parse(colors);
				}
				currentColors = legacyDDSupLib.copyColors(colors);
				updateGraphicsHelper(false, false, false, false, false, false, false);
				break;
			case "DataValuesSetFilled":
				parseData();
				break;
			case "HotColor":
				var newHotColor = eventData.slotValue;
				if(hotColor != newHotColor) {
					hotColor = newHotColor;
					var r = parseInt(hotColor.substr(1,2), 16);
					var g = parseInt(hotColor.substr(3,2), 16);
					var b = parseInt(hotColor.substr(5,2), 16);
					hotColorRGB = [r, g, b];
					updateGraphicsHelper(false, false, false, false, false, false, false);
				}
				break;
			case "ColdColor":
				var newColdColor = eventData.slotValue;
				if(newColdColor != coldColor) {
					coldColor = newColdColor;
					var r = parseInt(coldColor.substr(1,2), 16);
					var g = parseInt(coldColor.substr(3,2), 16);
					var b = parseInt(coldColor.substr(5,2), 16);
					coldColorRGB = [r, g, b];
					updateGraphicsHelper(false, false, false, false, false, false, false);
				}
				break;
			case "ZeroColor":
				var newZeroColor = eventData.slotValue;
				if(zeroColor != newZeroColor) {
					zeroColor = newZeroColor;
					var r = parseInt(zeroColor.substr(1,2), 16);
					var g = parseInt(zeroColor.substr(3,2), 16);
					var b = parseInt(zeroColor.substr(5,2), 16);
					zeroColorRGB = [r, g, b];
					updateGraphicsHelper(false, false, false, false, false, false, false);
				}
				break;
			case "BorderColor":
				var newBorderColor = eventData.slotValue;
				if(borderColor != newBorderColor) {
					borderColor = newBorderColor;
					if(showBorder) {
						updateGraphicsHelper(false, false, false, false, false, false, false);
					}
				}
				break;
			case "ShowColumnLabels":
				if(eventData.slotValue) {
					if(!showColumnLabels) {
						showColumnLabels = true;
						updateSize();
					}
				}
				else {
					if(showColumnLabels) {
						showColumnLabels = false;
						updateSize();
					}
				}
				break;
			case "MinCellW":
				if(eventData.slotValue < 1) {
					newVal = 0;
				}
				else {
					newVal = parseInt(eventData.slotValue);
				}
				if(newVal != minCellW) {
					minCellW = newVal;
					updateSize();
				}
				break;
			case "MinCellH":
				if(eventData.slotValue < 1) {
					newVal = 0;
				}
				else {
					newVal = parseInt(eventData.slotValue);
				}
				if(newVal != minCellH) {
					minCellH = newVal;
					updateSize();
				}
				break;
			case "FadeOutUnselected":
				if(eventData.slotValue) {
					if(!fadeOutUnselected) {
						fadeOutUnselected = true;
						updateGraphicsHelper(false, false, false, false, false, false, false);
					}
				}
				else {
					if(fadeOutUnselected) {
						fadeOutUnselected = false;
						updateGraphicsHelper(false, false, false, false, false, false, false);
					}
				}
				break;
			case "ShowSelectedCellBorder":
				if(eventData.slotValue) {
					if(!showBorder) {
						showBorder = true;
						if(cellW > 2 && cellH > 2) {
							updateGraphicsHelper(false, false, false, false, false, false, false);
						}
					}
				}
				else {
					if(showBorder) {
						showBorder = false;
						if(cellW > 2 && cellH > 2) {
							updateGraphicsHelper(false, false, false, false, false, false, false);
						}
					}
				}
				break;
			case "ShowClustering":
				if(eventData.slotValue) {
					if(!showClustering) {
						showClustering = true;
						if(sortRows || sortCols) {
							updateSize();
						}
					}
				}
				else {
					if(showClustering) {
						showClustering = false;
						if(sortRows || sortCols) {
							updateSize();
						}
					}
				}
				break;
			case "SortRows":
				if(eventData.slotValue) {
					if(!sortRows) {
						sortRows = true;
						clusterRows();
					}
				}
				else {
					if(sortRows) {
						sortRows = false;
						clusterRows();
					}
				}
				break;
			case "SortCols":
				if(eventData.slotValue) {
					if(!sortCols) {
						sortCols = true;
						clusterCols();
					}
				}
				else {
					if(sortCols) {
						sortCols = false;
						clusterCols();
					}
				}
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
					var y = pixel2intensity(currentMouse.y);
					var s = legacyDDSupLib.number2text(y, heatLimits.max - heatLimits.min);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, s);
					hoverText.style.font = fontSize + "px Arial";
					hoverText.style.left = Math.floor(currentMouse.x + 5) + "px";
					hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
					hoverText.innerHTML = s;
					hoverText.style.display = "block";
				}
				else if(mousePosIsInHeatMapArea(currentMouse)) {
					var row = rowOnScreenIdxToIdx[pixel2row(currentMouse.y)];
					var col = colOnScreenIdxToIdx[pixel2col(currentMouse.x)];
					var s = "";
					if(heatMap[row] !== null) {
						s = heatMap[row][col][0] + "(" + columnNames[col] + ")";
					}
					else {
						s = columnNames[col];
					}

					var textW = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, s);
					hoverText.style.font = fontSize + "px Arial";
					hoverText.style.left = Math.floor(currentMouse.x + 5) + "px";
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
					var x1 = selectionBarLeftMargin - 2;
					var w = selectionBarW + 4;
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

					selectionRectCtx.save();
					selectionRectCtx.fillStyle = selectionColors.color;
					selectionRectCtx.fillRect(x1, y1, w, h);
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

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(y1,y2, clickStart.ctrl);
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

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(y1,y2, clickStart.ctrl);
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
			11,
			"Font Size",
			'The font size to use in the Webble interface.',
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

		$scope.addSlot(new Slot('HotColor',
			hotColor,
			"Hot Color",
			'The color for hot spots in the heat map.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('ColdColor',
			coldColor,
			"Cold Color",
			'The color for cold spots in the heat map.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('ZeroColor',
			zeroColor,
			"Zero Color",
			'The color for values of 0 in the heat map.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ShowColumnLabels',
			false,
			"Show Column Labels",
			'Should column labels be printed or not.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinCellW',
			0,
			"Minimum Cell Width",
			'The smallest acceptable width of heat map cells (in pixels). If set to 0, automatic scaling is applied.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinCellH',
			0,
			"Minimum Cell Height",
			'The smallest acceptable height of heat map cells (in pixels). If set to 0, automatic scaling is applied.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('FadeOutUnselected',
			true,
			"Fade Out Unselected",
			'Should cells that are not selected be drawn as if faded out.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ShowSelectedCellBorder',
			false,
			"Show Selected Cell Border",
			'Draw a border around selected cells.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('BorderColor',
			borderColor,
			"Border Color",
			'Color of border around selected cells.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ShowClustering',
			false,
			"Show Clustering",
			'Draw a tree on each axis to show the clustering.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('SortRows',
			false,
			"Sort Rows",
			'Sort rows by clustering.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('SortCols',
			false,
			"Sort Columns",
			'Sort columns by clustering.',
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
			"Heat Map",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginType',
			"Hybrid",
			"Plugin Type",
			'The type of plugin this is. Should always be "Hybrid".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ExpectedFormat',
			[
				[{'idSlot':'DataIdSlot', 'name':'Vectors', 'type':'vector', 'slot':'Vectors'},
					{'idSlot':'ColumnIdSlot', 'name':'Column Names', 'type':'string', 'slot':'ColumnNames'}],

				[{'idSlot':'DataIdSlot', 'name':'Vectors', 'type':'vector', 'slot':'Vectors'}]
			],
			"Expected Format",
			'The input this plugin accepts.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// slots for data input
		$scope.addSlot(new Slot('Vectors',
			[],
			"Vectprs",
			'The slot for data input of heat map rows.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('Vectors').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('ColumnNames',
			[["C1","C2"]],
			"Column Names",
			'The slot for input data with the names for the heat map columns.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('ColumnNames').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('DataIdSlot',
			[[1,2,3,4,5,6]],
			"Data ID Slot",
			'The slot where the IDs of the input data items should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('ColumnIdSlot',
			[[1,2,3,4,5,6]],
			"Column ID Slot",
			'The slot where the IDs of the column name input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('ColumnIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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

		// stuff that we use to send data to the parent
		$scope.addSlot(new Slot('ProvidedFormat',
			{"format":{"sets":[{"name":"Transactions","fieldList":[{"slot":"Transactions","name":"Transactions","type":"string"}], "idSlot":"DataIdSlot","useInputIDs":true}]}},
			'Provided Format',
			'A JSON description of what data the Webble provides.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Transactions',
			[],
			'Heat Map Transactions',
			'Data generated by selecting cells in the heat map.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('Transactions').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('ProvidedFormatChanged',
			false,
			'Provided Format Changed',
			'This slot changes value (between true and false) every time the Provided Format slot changes (slot changes are not always caught otherwise).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DataChanged',
			false,
			'Data Changed',
			'This slot changes value (between true and false) when the data in the generated slots change but the format remained the same (slot changes are not always caught otherwise).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		myPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		updateFormat();
		updateSize();
		updateGraphicsHelper(false, false, false, false, false, false, false);

		selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		if(selectionHolderElement !== null){
			selectionHolderElement.bind('mousedown', onMouseDown);
			selectionHolderElement.bind('mousemove', onMouseMove);
			selectionHolderElement.bind('mouseout', onMouseOut);
		}
		else {
			//$log.log(preDebugMsg + "No selectionHolderElement, could not bind mouse listeners");
		}

		$scope.fixDroppable();
		$scope.fixDraggable();
	};
	//===================================================================================


	//===================================================================================
	// Fix Draggable
	// This method fixes a draggable issue.
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
	// This method fixes a droppable issue.
	//===================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('.canvasStuffForDigitalDashboardHeatMap').droppable({
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
	// This method saves the selection into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		var result = {};
		result.selections = [];
		for(var sel = 0; sel < selections.length; sel++) {
			if(selections[sel][selections[sel].length - 1] == 0) { // intensity selection
				result.selections.push({'type':'intensity', 'min':selections[sel][0], 'max':selections[sel][1]});
			}
		}

		internalSelectionsInternallySetTo = result;
		$scope.set('InternalSelections', result);
	};
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
					if(newSel.type == 'intensity') {
						var X1 = newSel.min;
						var X2 = newSel.max;

						if(X2 < heatLimits.min || X1 > heatLimits.max) {
							// completely outside
							continue;
						}

						X1 = Math.max(heatLimits.min, X1);
						X2 = Math.min(heatLimits.max, X2);
						var x1 = intensity2pixel(X1);
						var x2 = intensity2pixel(X2);

						if(x1 - x2 > 1) {
							newSelections.push([X1,X2, x2,x1, 0]); // flip order, y-axis is flipped
						}
						else {
							// $log.log(preDebugMsg + "setSelectionsFromSlotValue ignoring selection because it is too small.");
						}
					}
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
					if(newSel.type == 'intensity') {
						var X1 = newSel.min;
						var X2 = newSel.max;

						newSelections.push([X1,X2, 0,0, 0]);
					}
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
			if(selections[sel][selections[sel].length - 1] == 0) { // intensity selection
				var newSel = selections[sel];
				var X1 = newSel[0];
				var X2 = newSel[1];

				if(X2 < heatLimits.min || X1 > heatLimits.max) {
					// completely outside
					continue;
				}

				X1 = Math.max(heatLimits.min, X1);
				X2 = Math.min(heatLimits.max, X2);

				var x1 = intensity2pixel(X1);
				var x2 = intensity2pixel(X2);
				if(x1 - x2 > 1) {
					newSelections.push([X1,X2, x2,x1, 0]); // flip y-axis
				}
				else {
					// $log.log(preDebugMsg + "checkSelectionsAfterNewData ignoring selection because it is too small.");
				}
			}
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
		var rowSelectedStateOld = rowSelectedState;
		var colSelectedStateOld = colSelectedState;
		rowSelectedState = [];
		colSelectedState = [];
		for(var r = 0; r < noofRows; r++) {
			rowSelectedState.push(false);
		}
		for(var c = 0; c < noofCols; c++) {
			colSelectedState.push(false);
		}

		var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
		var nullGroup = 0;
		if(!nullAsUnselected) {
			nullGroup = selections.length + 1; // get unused groupId
		}

		selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.

		var redraw = false;
		for(var r = 0; r < noofRows; r++) {
			var rowGroupId = selections.length + 2; // higher than any possible value
			if(heatMap[r] === null) {
				rowGroupId = nullGroup;
				if(rowGroupId > 0) {
					rowSelectedState[r] = true;
				}
			}
			else {
				for(var c = 0; c < noofCols; c++) {
					var v = heatMap[r][c][0];
					var groupId = 0;
					for(var sel = 0; sel < selections.length; sel++) {
						if(selections[sel][0] <= v && v <= selections[sel][1]) {
							groupId = sel+1;
							break;
						}
					}
					if(heatMap[r][c][1] > 0) {
						if(groupId == 0) {
							redraw = true;
						}
					}
					else {
						if(groupId > 0) {
							redraw = true;
						}
					}
					heatMap[r][c][1] = groupId;
					if(groupId > 0) {
						rowSelectedState[r] = true;
						colSelectedState[c] = true;
					}
				}
			}
		}

		var dirty = false;
		for(var r = 0; r < noofRows; r++) {
			// $log.log(preDebugMsg + "row " + r + " new=" + rowSelectedState[r] +" old="+ rowSelectedStateOld[r]);
			if(rowSelectedState[r] != rowSelectedStateOld[r]) {
				dirty = true;
				break;
			}
		}

		var columnsDirty = false;
		if(haveCols) {
			for(var c = 0; c < noofCols; c++) {
				if(colSelectedState[c] = colSelectedStateOld[c]) {
					columnsDirty = true;
					break;
				}
			}
		}

		if(dirty) {
			for(var r = 0; r < noofRows; r++) {
				if(rowSelectedState[r]) {
					localSelections[rowIdSetIdIdx[r][0]][rowIdSetIdIdx[r][1]] = 1;
				}
				else {
					localSelections[rowIdSetIdIdx[r][0]][rowIdSetIdIdx[r][1]] = 0;
				}
			}
		}

		if(haveCols && columnsDirty) {
			for(var c = 0; c < noofCols; c++) {
				if(colSelectedState[c]) {
					localSelectionsCols[colIdSetIdIdx[c][0]][colIdSetIdIdx[c][1]] = 1;
				}
				else {
					localSelectionsCols[colIdSetIdIdx[c][0]][colIdSetIdIdx[c][1]] = 0;
				}
			}
		}

		if(dirty || (haveCols && columnsDirty)) {
			var localSelectionsPerIdSlot;
			if(haveCols) {
				localSelectionsPerIdSlot = {'DataIdSlot':localSelections, 'ColumnIdSlot':localSelectionsCols};
			}
			else {
				localSelectionsPerIdSlot = {'DataIdSlot':localSelections};
			}
			$scope.set('LocalSelections', localSelectionsPerIdSlot);
			$scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
		}
		else {
			// $log.log(preDebugMsg + "local selections had not changed");
		}

		if(redraw) {
			updateGraphicsHelper(false, false, false, true, false, false, false);
			buildTransactions();
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
		vectorArrays = [];
		columnIdArrays = [];
		columnArrays = [];
		haveCols = false;
		columnNames = [];
		rowDataName = "";
		colDataName = "";
		sources = 0;
		Ns = [];
		N = 0;
		noofRows = 0;
		noofCols = 0;
		heatLimits = {'min':0, 'max':0};
		unique = 0; // number of data points with non-null values
		NULLs = 0;
		localSelections = []; // the data to send to the parent
		localSelectionsCols = [];
		rowSelectedState = [];
		colSelectedState = [];
		rowIdSetIdIdx = [];
		colIdSetIdIdx = [];
		heatMap = [];
		rowIdxToOnScreenIdx = []; // rows can be sorted/clustered
		rowOnScreenIdxToIdx = []; // reverse mapping
		colIdxToOnScreenIdx = []; // column can be sorted/clustered
		colOnScreenIdxToIdx = []; // reverse mapping
		transactions = [];
		dragZoneVecs = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		dragZoneCols = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		dragZoneTransactions = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		var sourceName = $scope.gimme("PluginName");
		var dataSetName = sourceName;
		var dataSetIdx = 0;
		var format = $scope.gimme("ProvidedFormat");
		var fieldName = format.format.sets[0].fieldList[0].name;
		var info = {"sourceName":sourceName, "dataSetName":dataSetName, "dataSetIdx":dataSetIdx, "fieldName":fieldName};
		dragZoneTransactions.ID = JSON.stringify(info);
		dragZoneTransactions.name = fieldName + " (string)";
		allDragNames = [dragZoneVecs, dragZoneCols, dragZoneTransactions];
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		// parse parents instructions on where to find data, check that at least one data set is filled
		var atLeastOneFilled = false;
		var parentInput = $scope.gimme('DataValuesSetFilled');
		if(typeof parentInput === 'string') {
			parentInput = JSON.parse(parentInput);
		}

		lastSeenData = JSON.stringify(parentInput);

		resetVars();

		if(parentInput.length > 0) {
			var haveVectors = false;
			haveCols = false;

			for(var i = 0; i < parentInput.length; i++) {
				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == 'Vectors') {
					haveVectors = true;
					atLeastOneFilled = true;

					dragZoneVecs.name = "Vectors";
					dropVecs.forParent.vizName = $scope.gimme("PluginName");
					dragZoneVecs.ID = JSON.stringify(dropVecs.forParent);

					if(parentInput[i].hasOwnProperty("description")) {
						rowDataName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
						dragZoneVecs.name = rowDataName;
					}

					columnNames = [];

					if (parentInput[i].hasOwnProperty("metadata")) {
						var splitStr = parentInput[i].metadata.split(',');

						for(var s = 0; s < splitStr.length; s++) {
							columnNames.push(splitStr[s]);
						}
						noofCols = columnNames.length;
					}
					else {
						//$log.log(preDebugMsg + "No column name metadata!!");
					}
				}

				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == 'Column Names') {
					haveCols = true;

					dragZoneCols.name = "Column names";
					dropCols.forParent.vizName = $scope.gimme("PluginName");
					dragZoneCols.ID = JSON.stringify(dropCols.forParent);

					if(parentInput[i].hasOwnProperty("description")) {
						colDataName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
						dragZoneCols.name = colDataName;
					}
				}
			}
		}

		var dataIsCorrupt = false;

		if(atLeastOneFilled) {
			idArrays = $scope.gimme('DataIdSlot');
			vectorArrays = $scope.gimme('Vectors');

			if(idArrays.length != vectorArrays.length) {
				dataIsCorrupt = true;
			}
			if(idArrays.length <= 0) {
				dataIsCorrupt = true;
			}

			if(noofCols == 0) {
				// no metadata provided
				var vectorArray = vectorArrays[0];
				for(var i = 0; i < vectorArray.length; i++) {
					if(vectorArray[i] !== null) {
						noofCols = vectorArray[i].length;
					}
				}
				for(i = 0; i < noofCols; i++) {
					columnNames.push("");
				}
			}

			if(haveCols) {
				columnIdArrays = $scope.gimme('ColumnIdSlot');
				columnArrays = $scope.gimme('ColumnNames');
				if(columnIdArrays.length != columnArrays.length || columnIdArrays.length != idArrays.length) {
					dataIsCorrupt = true;
				}
			}

			if(!dataIsCorrupt) {
				sources = idArrays.length;

				for(var source = 0; source < sources; source++) {
					var idArray = idArrays[source];
					var vectorArray = vectorArrays[source];

					if(idArray.length != vectorArray.length) {
						dataIsCorrupt = true;
					}
					if(idArray.length <= 0) {
						dataIsCorrupt = true;
					}

					if(haveCols) {
						var columnIdArray = columnIdArrays[source];
						var columnArray = columnArrays[source];
						if(columnIdArray.length != columnArray.length) {
							dataIsCorrupt = true;
						}
						else if(columnArray.length != noofCols) {
							//$log.log(preDebugMsg + "Column Array is not the same length as the column name metadata.");
							dataIsCorrupt = true;
						}
					}
				}
			}

			if(!dataIsCorrupt) {
				Ns = [];
				var N = 0;
				var firstNonNullData = true;
				var minIntensity = 0;
				var maxIntensity = 0;
				var row = 0;
				var col = 0;

				for(var source = 0; source < sources; source++) {
					var idArray = idArrays[source];
					var vectorArray = vectorArrays[source];
					Ns.push(idArray.length);
					N += idArray.length;
					localSelections.push([]);

					for(i = 0; i < Ns[source]; i++) {
						localSelections[source].push(1);

						if(vectorArray[i] === null) {
							NULLs++;
							heatMap.push(null);
						}
						else {
							unique++;
							heatMap.push([]);

							var vec = vectorArray[i];
							if(vec.length != noofCols) {
								dataIsCorrupt;
							}
							else {
								for(var c = 0; c < vec.length; c++) {
									heatMap[row].push([vec[c], 1, 1, 1]); // value, current group ID (local), current group ID (global, row), current group ID (global, col)

									if(firstNonNullData) {
										firstNonNullData = false;
										minIntensity = vec[c];
										maxIntensity = vec[c];
									}
									else {
										minIntensity = Math.min(minIntensity, vec[c]);
										maxIntensity = Math.max(maxIntensity, vec[c]);
									}
								}
							}
						}
						rowIdSetIdIdx.push([source, i]);
						row++;
					}

					if(haveCols) {
						var columnIdArray = columnIdArrays[source];
						var columnArray = columnArrays[source];

						localSelectionsCols.push([]);

						for(i = 0; i < columnIdArray.length; i++) {
							localSelectionsCols[source].push(1);
							colIdSetIdIdx.push([source, i]);
							col++;
						}
					}
				}

				if(firstNonNullData) {
					dataIsCorrupt = true; // only null values
				}
				else {
					heatLimits = {'min':minIntensity, 'max':maxIntensity};
					noofRows = N;

					for(i = 0; i < noofRows; i++) {
						rowSelectedState.push(true);
						rowIdxToOnScreenIdx.push(i);
						rowOnScreenIdxToIdx.push(i);
					}
					for(i = 0; i < noofCols; i++) {
						colSelectedState.push(true);
						colIdxToOnScreenIdx.push(i);
						colOnScreenIdxToIdx.push(i);
					}
				}
			}

			if(dataIsCorrupt) {
				//$log.log(preDebugMsg + "data is corrupt");
				resetVars();
			}
		}
		else {
			// $log.log(preDebugMsg + "no data");
		}

		updateSize();
		if(bgCanvas) {
			var W = bgCanvas.width;
			var H = bgCanvas.height;
			drawBackground(W, H);
		}

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
			$scope.set('LocalSelections', {});

			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
				var W = selectionCanvas.width;
				var H = selectionCanvas.height;
				selectionCtx.clearRect(0,0, W,H);
			}
		}

		buildTransactions();

		if(sortCols) {
			clusterCols();
		}
		if(sortRows) {
			clusterRows();
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics Helper
	// This method updates the graphics.
	//===================================================================================
	function updateGraphicsHelper(forceBackground, forceSelectionBar, forceSelectionBoxes, forceHeatmap, forceLabels, newColOrder, newRowOrder) {
		// $log.log(preDebugMsg + "updateGraphics()");
		var redrawBackground = forceBackground;
		var redrawSelectionBar = forceSelectionBar;
		var redrawSelectionBoxes = forceSelectionBoxes;
		var redrawHeatmap = forceHeatmap;
		var redrawLabels = forceLabels;
		var redrawColCluster = false;
		var redrawRowCluster = false;

		if(bgCanvas === null) {
			var bgCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(bgCanvasElement.length > 0) {
				bgCanvas = bgCanvasElement[0];
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

		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}

		var globalSelectionsCols = [];
		if(haveCols && globalSelectionsPerId.hasOwnProperty("ColumnIdSlot")) {
			globalSelectionsCols = globalSelectionsPerId["ColumnIdSlot"];
		}

		lastSeenGlobalSelections = [];
		for(var set = 0; set < globalSelections.length; set++) {
			lastSeenGlobalSelections.push([]);
			for(var i = 0; i < globalSelections[set].length; i++) {
				lastSeenGlobalSelections[set].push(globalSelections[set][i]);
			}
		}

		lastSeenGlobalSelectionsCols = [];
		for(var set = 0; set < globalSelectionsCols.length; set++) {
			lastSeenGlobalSelectionsCols.push([]);
			for(var i = 0; i < globalSelectionsCols[set].length; i++) {
				lastSeenGlobalSelectionsCols[set].push(globalSelectionsCols[set][i]);
			}
		}

		if(newColOrder) {
			if(showClustering) {
				redrawColCluster = true;
			}
			if(showColumnLabels) {
				redrawLabels = true;
			}
			redrawHeatmap = true;
		}

		if(newRowOrder) {
			redrawSelectionBoxes = true;
			if(showClustering) {
				redrawRowCluster = true;
			}
			redrawHeatmap = true;
		}

		if(!redrawBackground && currentColors != lastColors) {
			redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
		}

		if(showColumnLabels != lastShowColumnLabels) {
			redrawLabels = true;
		}
		if(!redrawLabels && showColumnLabels && (textColor != lastTextColor || fontSize != lastFontSize)) {
			redrawLabels = true;
		}

		if(lastRowDataName != rowDataName || lastColDataName != colDataName) {
			redrawBackground = true;
		}


		if(showClustering != lastShowClustering) {
			redrawColCluster = true;
			redrawRowCluster = true;
		}
		if(showClustering && textColor != lastTextColor) {
			redrawColCluster = true;
			redrawRowCluster = true;
		}

		var colorScaleChange = false;
		if(heatLimits.min < 0
			&& heatLimits.max > 0) {
			if(hotColor != lastHotColor || zeroColor != lastZeroColor || coldColor != lastColdColor) {
				colorScaleChange = true;
			}
		}
		else if(heatLimits.min < 0) {
			if(zeroColor != lastZeroColor || coldColor != lastColdColor) {
				colorScaleChange = true;
			}
		}
		else {
			if(hotColor != lastHotColor || zeroColor != lastZeroColor) {
				colorScaleChange = true;
			}
		}
		if(colorScaleChange) {
			redrawSelectionBar = true;
			redrawHeatmap = true;
		}

		if(!redrawSelectionBoxes && legacyDDSupLib.checkColors(currentColors, lastColors)) {
			redrawSelectionBoxes = true;
		}

		if(selectionBarW != lastSelectionBarW || selectionBarLeftMargin != lastSelectionBarLeftMargin || barH != lastBarH || fontSize != lastFontSize || lastSelectionBarTopMargin != selectionBarTopMargin || lastSelectionBarBottomMargin != selectionBarBottomMargin) {
			redrawSelectionBar = true;
		}

		if(leftMarg != lastLeftMarg) {
			// just move the canvases
		}

		if(cellW != lastCellW || cellH != lastCellH || showBorder != lastShowBorder || (showBorder && borderColor != lastBorderColor)) {
			redrawHeatmap = true;
		}

		if(cellW != lastCellW || cellH != lastCellH) {
			if(showClustering) {
				redrawColCluster = true;
				redrawRowCloster = true;
			}
			if(showColumnLabels) {
				redrawLabels = true;
			}
			redrawSelectionBoxes = true;
		}

		if(W != lastW || H != lastH) {
			redrawBackground = true;
		}

		if(lastFadeOutUnselected != fadeOutUnselected) {
			redrawHeatmap = true;
		}

		// =================================
		// Drawing
		// =================================

		if(redrawBackground) {
			drawBackground(W, H);
		}
		if(redrawSelectionBar) {
			drawSelectionBar();
		}

		if(redrawSelectionBoxes) {
			drawSelectionBoxes(globalSelections);
		}
		if(redrawLabels) {
			drawLabels();
		}

		if(redrawRowCluster) {
			drawRowCluster();
		}
		if(redrawColCluster) {
			drawColCluster();
		}

		if(redrawHeatmap) {
			drawHeatMap(W, H, globalSelections, globalSelectionsCols);
		}

		lastW = W;
		lastH = H;
		lastCellW = cellW;
		lastCellH = cellH;
		lastLeftMarg = leftMarg;
		lastShowBorder = showBorder;
		lastBorderColor = borderColor;
		lastBarH = barH;
		lastSelectionBarLeftMargin = selectionBarLeftMargin;
		lastSelectionBarW = selectionBarW;
		lastHotColor = hotColor;
		lastColdColor = coldColor;
		lastZeroColor = zeroColor;
		lastColors = currentColors;
		lastTextColor = textColor;
		lastShowClustering = showClustering;
		lastShowColumnLabels = showColumnLabels;
		lastFadeOutUnselected = fadeOutUnselected;
		lastFontSize = fontSize;
		lastSelectionBarTopMargin != selectionBarTopMargin;
		lastSelectionBarBottomMargin != selectionBarBottomMargin;
		lastRowDataName = rowDataName;
		lastColDataName = colDataName;

		updateDropZones(textColor, 0.3, false);
	}
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background based on the specified width and height.
	//===================================================================================
	function drawBackground(W,H) {
		// $log.log(preDebugMsg + "drawBackground");
		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(bgCtx === null) {
			bgCtx = bgCanvas.getContext("2d");
		}

		bgCtx.clearRect(0,0, W,H);

		if(currentColors && currentColors.hasOwnProperty("skin")) {
			var drewBack = false
			if(currentColors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
				var OK = true;

				var grd = bgCtx.createLinearGradient(0,0,W,H);
				for(var i = 0; i < currentColors.skin.gradient.length; i++) {
					var cc = currentColors.skin.gradient[i];
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

			if(!drewBack && currentColors.skin.hasOwnProperty("color")) {
				bgCtx.fillStyle = currentColors.skin.color;
				bgCtx.fillRect(0,0,W,H);
				drewBack = true;
			}

			if(currentColors.skin.hasOwnProperty("border")) {
				bgCtx.fillStyle = currentColors.skin.border;

				bgCtx.fillRect(0,0, W,1);
				bgCtx.fillRect(0,H-1, W,H);
				bgCtx.fillRect(0,0, 1,H);
				bgCtx.fillRect(W-1,0, W,H);
			}

			// top label
			if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
				textColor = currentColors.skin.text;
			}
			else {
				textColor = "#000000";
			}
			bgCtx.fillStyle = textColor;
			bgCtx.font = fontSize + "px Arial";

			var str = "";
			var vw = -1;
			var cw = -1;
			var trw = -1;
			var endw = -1;

			if(rowDataName != "" && colDataName != "") {
				str = colDataName + " --> " + rowDataName;
				cw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, dragZoneCols.name);
				vw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, dragZoneVecs.name);
			}
			else if(rowDataName != "") {
				str = rowDataName;
				vw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, dragZoneVecs.name);
			}
			else if(colDataName != "") {
				str = colDataName;
				cw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, dragZoneCols.name);
			}

			if(str != "") {
				str += ", ";
			}
			var trStr = "generating " + dragZoneTransactions.name;
			endw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, trStr);
			trw = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, dragZoneTransactions.name);

			str += trStr;

			if(str != "") {
				var w = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, str);
				var top = 0;
				if(fontSize < topMarg) {
					top = Math.floor((topMarg - fontSize) / 2);
				}
				var left = 0;
				if(w < W) {
					left = Math.floor((W - w) / 2);
				}

				bgCtx.fillText(str, left, top + fontSize);

				if(cw >= 0) {
					dragZoneCols = {'left':left, 'top':top, 'right':(left + cw), 'bottom':(top + fontSize), 'name':dragZoneCols.name, 'ID':dragZoneCols.ID};
				}
				if(vw >= 0) {
					dragZoneVecs = {'left':(left + w - vw - endw), 'top':top, 'right':(left + w - endw), 'bottom':(top + fontSize), 'name':dragZoneVecs.name, 'ID':dragZoneVecs.ID};
				}

				dragZoneTransactions = {'left':(left + w - trw), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':dragZoneTransactions.name, 'ID':dragZoneTransactions.ID};
				allDragNames = [dragZoneVecs, dragZoneCols, dragZoneTransactions];
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

			var left = 2;
			var top = topMarg;
			var height = Math.max(5, drawH + 2);
			var width = Math.max(5, leftMarg - 8);

			dropVecs.left = left;
			dropVecs.right = left + width;
			dropVecs.top = top + marg2;
			dropVecs.bottom = top + height - marg2;

			dropCols.left = leftMarg + marg1;
			dropCols.right = left + drawW - marg1;
			dropCols.top = 2;
			dropCols.bottom = topMarg - 2;

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
						var tw = legacyDDSupLib.getTextWidth(labelsCtx, str, fnt);
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
	// Update Size
	// This method updates the size.
	//===================================================================================
	function updateSize() {
		// $log.log(preDebugMsg + "updateSize");
		fontSize = parseInt($scope.gimme("FontSize"));
		if(fontSize < 5) {
			fontSize = 5;
		}

		var W = $scope.gimme("DrawingArea:width");
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		var H = $scope.gimme("DrawingArea:height");
		if(typeof H === 'string') {
			H = parseFloat(H);
		}
		if(H < 1) {
			H = 1;
		}

		var treeW = 0;
		if(showClustering && sortRows && unique > 0) {
			treeW = (noofRows - NULLs - 1) * clusterTreeSpacing;
		}
		var treeH = 0;
		if(showClustering && sortCols && unique > 0) {
			treeH = noofCols * clusterTreeSpacing;
		}

		var labelMarg = 0;
		if(showColumnLabels) {
			var maxW = 0;
			for(var c = 0; c < noofCols; c++) {
				var s = columnNames[c];
				var w = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, s);
				maxW = Math.max(maxW, w);
			}
			if(maxW > 0) {
				labelMarg = maxW;
			}
		}

		leftMarg = Math.round(selectionBarW + selectionBarLeftMargin + selectionBarRightMargin); // calculated
		topMarg = Math.round(topMarg);
		drawW = Math.round(W - leftMarg - rightMarg - treeW);
		drawH = Math.round(H - topMarg - bottomMarg * 2 - labelMarg - treeH);
		selectionBarBottomMargin = fontSize;
		selectionBarTopMargin = fontSize;
		barH = Math.round(drawH - selectionBarTopMargin - selectionBarBottomMargin); // calculated

		if(unique > 0) { // we have data
			var smallestW = noofCols;
			cellW = 1;
			if(minCellW > 0) {
				cellW = minCellW;
				smallestW = noofCols * minCellW;
			}
			if(smallestW > drawW) {
				$scope.set("DrawingArea:width", Math.ceil(leftMarg + rightMarg + smallestW + treeW));

				// recalculate, since we may have changed the window size
				W = $scope.gimme("DrawingArea:width");
				if(typeof W === 'string') {
					W = parseFloat(W);
				}
				if(W < 1) {
					W = 1;
				}
				leftMarg = Math.round(selectionBarW + selectionBarLeftMargin + selectionBarRightMargin); // calculated
				drawW = Math.round(W - leftMarg - rightMarg - treeW);
			}
			else {
				if(minCellW <= 0) {
					var largestCellW = Math.floor(drawW / noofCols);
					if(largestCellW < 1) {
						cellW = 1;
					}
					else {
						cellW = largestCellW;
					}
				}
			}

			var smallestH = noofRows;
			cellH = 1;
			if(minCellH > 0) {
				cellH = minCellH;
				smallestH = noofRows * minCellH;
			}
			if(smallestH > drawH) {
				$scope.set("DrawingArea:height", Math.ceil(topMarg + bottomMarg * 2 + labelMarg + smallestH + treeH));

				// recalculate, since we may have changed the window size
				H = $scope.gimme("DrawingArea:height");
				if(typeof H === 'string') {
					H = parseFloat(H);
				}
				if(H < 1) {
					H = 1;
				}
				drawH = Math.round(H - topMarg - bottomMarg * 2 - labelMarg - treeH);
				barH = Math.round(drawH - selectionBarTopMargin - selectionBarBottomMargin); // calculated
			}
			else {
				if(minCellH <= 0) {
					var largestCellH = Math.floor(drawH / noofRows);
					if(largestCellH < 1) {
						cellH = 1;
					}
					else {
						cellH = largestCellH;
					}
				}
			}
		}

		if(bgCanvas === null) {
			var bgCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(bgCanvasElement.length > 0) {
				bgCanvas = bgCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var bgDirty = false;
		if(bgCanvas.width != W) {
			bgCanvas.width = W;
			bgDirty = true;
		}
		if(bgCanvas.height != H) {
			bgCanvas.height = H;
			bgDirty = true;
		}

		if(heatmapCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theHeatmapCanvas');
			if(canvasElement.length > 0) {
				heatmapCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var heatmapDirty = false;
		if(heatmapCanvas.width != drawW) {
			heatmapCanvas.width = drawW;
			heatmapDirty = true;
		}
		if(heatmapCanvas.height != drawH) {
			heatmapCanvas.height = drawH;
			heatmapDirty = true;
		}
		if(heatmapCanvas.style.top != topMarg + "px") {
			heatmapCanvas.style.top = topMarg + "px";
		}
		if(heatmapCanvas.style.left != leftMarg + "px") {
			heatmapCanvas.style.left = leftMarg + "px";
		}

		if(clusterCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theClusterCanvas');
			if(canvasElement.length > 0) {
				clusterCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var clusterDirty = false;
		if(clusterCanvas.width != drawW + treeW + 2) {
			clusterCanvas.width = drawW + treeW + 2;
			clusterDirty = true;
		}
		if(clusterCanvas.height != drawH + treeH + 2) {
			clusterCanvas.height = drawH + treeH + 2;
			clusterDirty = true;
		}
		if(clusterCanvas.style.top != topMarg + "px") {
			clusterCanvas.style.top = topMarg + "px";
		}
		if(clusterCanvas.style.left != leftMarg + "px") {
			clusterCanvas.style.left = leftMarg + "px";
		}

		if(barCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theBarCanvas');
			if(canvasElement.length > 0) {
				barCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var barDirty = false;
		if(barCanvas.width != leftMarg) {
			barDirty = true;
			barCanvas.width = leftMarg;
		}
		if(barCanvas.height != H) {
			barDirty = true;
			barCanvas.height = H;
		}

		if(dropCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(canvasElement.length > 0) {
				dropCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no drop canvas to resize!");
			}
		}
		if(dropCanvas) {
			if(dropCanvas.height != H) {
				dropCanvas.height = H;
			}
			if(dropCanvas.width != W) {
				dropCanvas.width = W;
			}
		}

		if(boxesCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theBoxesCanvas');
			if(canvasElement.length > 0) {
				boxesCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var boxesDirty = false;
		if(boxesCanvas.width != leftMarg) {
			boxesDirty = true;
			boxesCanvas.width = leftMarg;
		}
		if(boxesCanvas.height != drawH) {
			boxesDirty = true;
			boxesCanvas.height = drawH;
		}
		if(boxesCanvas.style.top != topMarg + "px") {
			boxesCanvas.style.top = topMarg + "px";
		}

		if(labelsCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theLabelsCanvas');
			if(canvasElement.length > 0) {
				labelsCanvas = canvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		var labelsDirty = false;
		if(labelsCanvas.width != W) {
			labelsDirty = true;
			labelsCanvas.width = W;
		}
		if(labelsCanvas.height != H) {
			labelsDirty = true;
			labelsCanvas.height = H;
		}
		if(labelsCanvas.style.top != topMarg + "px") {
			labelsCanvas.style.top = topMarg + "px";
		}
		if(labelsCanvas.style.left != leftMarg + "px") {
			labelsCanvas.style.left = leftMarg + "px";
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
		selectionCanvas.width = W;
		selectionCanvas.height = H;
		selectionCanvas.style.left = 0;
		selectionCanvas.style.top = 0;

		if(selectionHolderElement === null) {
			selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		}
		selectionHolderElement.width = W;
		selectionHolderElement.height = H;
		selectionHolderElement.top = 0;
		selectionHolderElement.left = 0;

		var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
		selectionRectElement.width = W;
		selectionRectElement.height = H;
		selectionRectElement.top = 0;
		selectionRectElement.left = 0;
		if(selectionRectElement.length > 0) {
			selectionRect = selectionRectElement[0];
			selectionRect.width = W;
			selectionRect.height = H;
			selectionRect.top = 0;
			selectionRect.left = 0;
		}

		// $log.log(preDebugMsg + "updateSize found selections: " + JSON.stringify(selections));
		for(var sel = 0; sel < selections.length; sel++) {
			var s = selections[sel];
			if(s[s.length - 1] == 0) { // intensity
				s[2] = intensity2pixel(s[1]);
				s[3] = intensity2pixel(s[0]);
			}
		}
		// $log.log(preDebugMsg + "updateSize updated selections to: " + JSON.stringify(selections));
		drawSelections();
		updateGraphicsHelper(bgDirty, barDirty, boxesDirty, heatmapDirty, labelsDirty, false, false);
		updateDropZones(textColor, 0.3, false);
	}
	//===================================================================================


	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(y1,y2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(unique > 0) {
			y1 = Math.max(y1, topMarg + selectionBarTopMargin);
			y2 = Math.min(y2, topMarg + drawH - selectionBarBottomMargin);

			var newSel = [pixel2intensity(y2), pixel2intensity(y1), y1,y2, 0];
			var overlap = false;
			for(var s = 0; s < selections.length; s++) {
				var sel = selections[s];
				if(sel[2] == newSel[2] && sel[3] == newSel[3] && sel[sel.length - 1] == newSel[newSel.length - 1]) {
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
			selections = [[heatLimits.min, heatLimits.max, topMarg + selectionBarTopMargin, topMarg + drawH - selectionBarBottomMargin, 0]];
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
				selectionColors.color = hexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = hexColorToRGBA('#FFA500', selectionTransparency); // orange
			}

			if(colors['selection'].hasOwnProperty('gradient')) {
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
			selectionCtx.save();
			selectionCtx.fillStyle = selectionColors.grad;
			selectionCtx.fillRect(selectionBarLeftMargin - 2, selections[sel][2], selectionBarW + 4, selections[sel][3] - selections[sel][2]);
			selectionCtx.strokeStyle = selectionColors.border;
			selectionCtx.strokeWidth = 1;
			selectionCtx.strokeRect(selectionBarLeftMargin - 2, selections[sel][2], selectionBarW + 4, selections[sel][3] - selections[sel][2]);
			selectionCtx.restore();
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
	// Mouse Position in Selectable Area
	// This method checks whether the mouse pointer is within the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > selectionBarLeftMargin - 5 && pos.x <= selectionBarLeftMargin + selectionBarW + 5 && pos.y > topMarg + selectionBarTopMargin - 5 && pos.y <= topMarg + drawH - selectionBarBottomMargin + 5) {
			return true;
		}
		return false;
	};
	//===================================================================================


    //============================================================================
    //=== Transactions ===========================================================
    //============================================================================

	//===================================================================================
	// Update Format
	// This method updates the format.
	//===================================================================================
	function updateFormat() {
		var name = $scope.gimme("PluginName");
		var format = $scope.gimme("ProvidedFormat");

		format.format.sets[0].name = name + " Transactions";
		format.format.sets[0].fieldList[0].name = name + " Transactions";

		$scope.set("ProvidedFormat", format);
		$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));

		var sourceName = $scope.gimme("PluginName");
		var dataSetName = sourceName;
		var dataSetIdx = 0;
		var fieldName = format.format.sets[0].fieldList[0].name;
		var info = {"sourceName":sourceName, "dataSetName":dataSetName, "dataSetIdx":dataSetIdx, "fieldName":fieldName};
		dragZoneTransactions.ID = JSON.stringify(info);
		dragZoneTransactions.name = fieldName + " (string)";

		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}
		if(bgCanvas) {
			drawBackground(bgCanvas.width, bgCanvas.height); // update the top labels and the drag zones with the new transaction name
		}
	}
	//===================================================================================


	//===================================================================================
	// Build Transactions
	// This method builds the transactions.
	//===================================================================================
	function buildTransactions() {
		// $log.log(preDebugMsg + "buildTransactions");
		if(unique <= 0) {
			transactions = [];
			$scope.set("Transactions", transactions);
			$scope.set("DataChanged", !$scope.gimme("DataChanged"));
		}
		else {
			var globalSelectionsPerId = $scope.gimme('GlobalSelections');
			var globalSelections = [];
			if(globalSelectionsPerId.hasOwnProperty("DataIdSlot")) {
				globalSelections = globalSelectionsPerId["DataIdSlot"];
			}

			var oldTransactions = transactions;
			transactions = [];
			var dirty = false;
			for(var r = 0; r < noofRows; r++) {
				if(heatMap[r] === null) {
					transactions.push(null);
				}
				else {
					var transaction = "";
					var includeRow = false;
					if(transactionsForAll) {
						includeRow = true;
					}
					else {
						var set = rowIdSetIdIdx[r][0];
						var idx = rowIdSetIdIdx[r][1];
						var selArray = [];
						if(set < globalSelections.length) {
							selArray = globalSelections[set];
						}
						var rowGroupId = 0;
						if(idx < selArray.length) {
							rowGroupId = selArray[idx];
						}
						if(rowGroupId <= 0) {
							includeRow = false;
						}
						else {
							includeRow = true;
						}
					}

					if(includeRow) {
						for(var c = 0; c < noofCols; c++) {
							if(heatMap[r][c][1] > 0) { // cell is selected
								// also check global selection status of columns?
								if(transaction == "") {
									transaction = columnNames[c];
								}
								else {
									transaction = transaction + "," + columnNames[c];
								}
							}
						}
					}
					transactions.push(transaction);
					if(transactions[r] != oldTransactions[r]) {
						dirty = true;
					}
				}
			}

			if(dirty) {
				$scope.set("Transactions", transactions);
				$scope.set("DataChanged", !$scope.gimme("DataChanged"));
			}
		}
	}
	//===================================================================================


	//============================================================================
    //=== Clustering =============================================================
    //============================================================================

	//===================================================================================
	// Do Actual Row Clustering
	// This method does the actual row clustering.
	//===================================================================================
	function doActualRowClustering() {
		var distMatrix = [];
		var startingClusters = [];
		for(var r1 = 0; r1 < noofRows; r1++) { // need to go to the last one for the startinClusters, not noofRows - 1
			if(heatMap[r1] !== null) {
				distMatrix.push([]);
				startingClusters.push([[r1], []]); // [[all members], [left cluster, right cluster]]

				for(var r2 = 0; r2 < noofRows; r2++) {
					if(r2 <= r1) {
						distMatrix[r1].push(null);
					}
					else {
						if(heatMap[r2] !== null) {
							var dist = 0;
							for(var c = 0; c < noofCols; c++) {
								var d = heatMap[r2][c][0] - heatMap[r1][c][0];
								dist += d*d;
							}

							distMatrix[r1].push(dist);
						}
						else {
							distMatrix[r1].push(null);
						}
					}
				}
			}
			else {
				distMatrix.push(null);
			}
		}

		while(startingClusters.length > 1) {
			var merge = [0, 1, rowDist(startingClusters[0][0][0], startingClusters[1][0][0], distMatrix)];

			for(var c1 = 0; merge[2] > 0 && c1 < startingClusters.length; c1++) {
				var cluster1 = startingClusters[c1];
				for(var c2 = c1+1; c2 < startingClusters.length; c2++) {
					var cluster2 = startingClusters[c2];
					var dist = clusterDist(cluster1, cluster2, distMatrix);

					if(dist < merge[2]) {
						merge = [c1, c2, dist];
					}

					if(merge[2] == 0) {
						break; // cannot get better than 0
					}
				}
			}

			// merge clusters
			c1 = startingClusters[merge[0]];
			c2 = startingClusters[merge[1]];

			if(rowDist(c1[0][0], c2[0][c2[0].length - 1], distMatrix) < rowDist(c1[0][c1[0].length - 1], c2[0][0], distMatrix)) {
				c2 = startingClusters[merge[0]];
				c1 = startingClusters[merge[1]];
			}

			// try reversing the lists too, to see if that gives even shorter distance?

			var newClusterMembers = [];
			for(var m = 0; m < c1[0].length; m++) {
				newClusterMembers.push(c1[0][m]);
			}
			for(var m = 0; m < c2[0].length; m++) {
				newClusterMembers.push(c2[0][m]);
			}
			var newCluster = [newClusterMembers, [startingClusters[merge[0]], startingClusters[merge[1]]]];
			startingClusters.splice(merge[1], 1); // remove rightmost cluster first, or the index will not be correct for the other one
			startingClusters.splice(merge[0], 1, newCluster);
		}

		// the top cluster now has the members in a somewhat sorted order
		var newRowIdxToOnScreenIdx = [];
		var newRowOnScreenIdxToIdx = [];

		for(var r = 0; r < noofRows; r++) {
			newRowIdxToOnScreenIdx.push(-1);
			newRowOnScreenIdxToIdx.push(-1);
		}

		for(var r = 0; r < startingClusters[0][0].length; r++) {
			newRowIdxToOnScreenIdx[startingClusters[0][0][r]] = r;
			newRowOnScreenIdxToIdx[r] = startingClusters[0][0][r];
		}

		var nullRows = r;
		// put all the rows with no data at the bottom
		for(var r = 0; r < noofRows; r++) {
			if(newRowIdxToOnScreenIdx[r] == -1) {
				newRowIdxToOnScreenIdx[r] = nullRows;
				newRowOnScreenIdxToIdx[nullRows] = r;
				nullRows++;
			}
		}

		rowIdxToOnScreenIdx = newRowIdxToOnScreenIdx;
		rowOnScreenIdxToIdx = newRowOnScreenIdxToIdx;
		rowTopCluster = startingClusters[0];
		updateGraphicsHelper(false, false, false, false, false, false, true);
	}
	//===================================================================================


	//===================================================================================
	// Do Background Row Clustering
	// This method does the background row clustering.
	//===================================================================================
	function doBackgroundRowClustering() {
		// $log.log(preDebugMsg + "doBackgroundRowClustering");
		if(rowBackgroundThread !== null) {
			// already running. kill thread
			rowBackgroundThread.terminate();
		}

		rowBackgroundThread = new Worker(myPath + '/rowClustering.js');

		rowBackgroundThread.addEventListener('message', function(e) {
			rowClusteringFinished(e);
		}, false);

		var data = {'heatMap':heatMap,
			'noofRows':noofRows,
			'noofCols':noofCols,
			'start':true};
		rowBackgroundThread.postMessage(data); // start background thread
	}
	//===================================================================================


	//===================================================================================
	// Row Clustering Finished
	// This method takes care of the result of the finished row clustering.
	//===================================================================================
	function rowClusteringFinished(e) {
		//$log.log(preDebugMsg + "rowClusteringFinished");
		var data = e.data;
		rowIdxToOnScreenIdx = data.newRowIdxToOnScreenIdx;
		rowOnScreenIdxToIdx = data.newRowOnScreenIdxToIdx;
		rowTopCluster = data.rowTopCluster;
		updateGraphicsHelper(false, false, false, false, false, false, true);

		if(rowBackgroundThread !== null) {
			rowBackgroundThread.terminate();
			rowBackgroundThread = null;
		}
	}
	//===================================================================================


	//===================================================================================
	// Cluster Rows Clustering
	// This method clusters the cluster rows.
	//===================================================================================
	function clusterRowsClustering() {
		//$log.log(preDebugMsg + "clusterRowsClustering");
		if(unique > 0) {
			if(typeof(Worker) !== "undefined") {
				if(!alreadyLoggedBackgroundCapability) {
					alreadyLoggedBackgroundCapability = true;
					//$log.log(preDebugMsg + "browser supports background threads");
				}
				doBackgroundRowClustering();
			}
			else {
				if(!alreadyLoggedBackgroundCapability) {
					alreadyLoggedBackgroundCapability = true;
					//$log.log(preDebugMsg + "Browser does not support background threads. Cluster in main thread.");
				}
				doActualRowClustering();
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Cluster Distribution
	// This method distributes the cluster.
	//===================================================================================
	function clusterDist(c1, c2, distMatrix) {
		var dist = rowDist(c1[0][0], c2[0][0], distMatrix);
		for(var r1 = 0; r1 < c1[0].length; r1++) {
			for(var r2 = 0; r2 < c2[0].length; r2++) {
				dist = Math.min(dist, rowDist(c1[0][r1], c2[0][r2], distMatrix) );
			}
		}
		return dist;
	}
	//===================================================================================


	//===================================================================================
	// Row Distribution
	// This method distributes the rows.
	//===================================================================================
	function rowDist(c1, c2, matrix) {
		var r2 = c1;
		var r1 = c2;
		if(c1 < c2) {
			r1 = c1;
			r2 = c2;
		}

		return matrix[r1][r2];
	}
	//===================================================================================


	//===================================================================================
	// Cluster Rows
	// This method cluster the rows.
	//===================================================================================
	function clusterRows() {
		// $log.log(preDebugMsg + "clusterRows");
		if(sortRows) {
			// do clustering
			if(showClustering) {
				updateSize();
			}
			clusterRowsClustering();

		}
		else {
			topRowCluster = [];

			if(typeof(Worker) !== "undefined" && rowBackgroundThread !== null) { // if we are clustering in the background, stop doing that
				rowBackgroundThread.therminate();
			}

			for(var i = 0; i < noofRows; i++) {
				rowIdxToOnScreenIdx[i] = i;
				rowOnScreenIdxToIdx[i] = i;
			}
			updateGraphicsHelper(false, false, false, false, false, false, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Do Actual Column Clustering
	// This method does the actual column clustering.
	//===================================================================================
	function doActualColClustering() {
		var distMatrix = [];
		var startingClusters = [];
		for(var c1 = 0; c1 < noofCols; c1++) { // need to go to the last one for the startinClusters, not noofCols - 1
			distMatrix.push([]);
			startingClusters.push([[c1], []]); // [[all members], [left cluster, right cluster]]

			for(var c2 = 0; c2 < noofCols; c2++) {
				if(c2 <= c1) {
					distMatrix[c1].push(null);
				}
				else {
					var dist = 0;
					for(var r = 0; r < noofRows; r++) {
						if(heatMap[r] !== null) {
							var d = heatMap[r][c1][0] - heatMap[r][c2][0];
							dist += d*d;
						}
					}
					distMatrix[c1].push(dist);
				}
			}
		}

		while(startingClusters.length > 1) {
			var merge = [0, 1, rowDist(startingClusters[0][0][0], startingClusters[1][0][0], distMatrix)];

			for(var c1 = 0; merge[2] > 0 && c1 < startingClusters.length; c1++) {
				var cluster1 = startingClusters[c1];
				for(var c2 = c1+1; c2 < startingClusters.length; c2++) {
					var cluster2 = startingClusters[c2];
					var dist = clusterDist(cluster1, cluster2, distMatrix);

					if(dist < merge[2]) {
						merge = [c1, c2, dist];
					}

					if(merge[2] == 0) {
						break; // cannot get better than 0
					}
				}
			}

			// merge clusters
			c1 = startingClusters[merge[0]];
			c2 = startingClusters[merge[1]];

			if(rowDist(c1[0][0], c2[0][c2[0].length - 1], distMatrix) < rowDist(c1[0][c1[0].length - 1], c2[0][0], distMatrix)) {
				c2 = startingClusters[merge[0]];
				c1 = startingClusters[merge[1]];
			}

			// try reversing the lists too, to see if that gives even shorter distance?
			var newClusterMembers = [];
			for(var m = 0; m < c1[0].length; m++) {
				newClusterMembers.push(c1[0][m]);
			}
			for(var m = 0; m < c2[0].length; m++) {
				newClusterMembers.push(c2[0][m]);
			}
			var newCluster = [newClusterMembers, [startingClusters[merge[0]], startingClusters[merge[1]]]];
			startingClusters.splice(merge[1], 1); // remove rightmost cluster first, or the index will not be correct for the other one
			startingClusters.splice(merge[0], 1, newCluster);
		}

		// the top cluster now has the members in a somewhat sorted order
		var newColIdxToOnScreenIdx = [];
		var newColOnScreenIdxToIdx = [];

		for(var c = 0; c < noofCols; c++) {
			newColIdxToOnScreenIdx.push(-1);
			newColOnScreenIdxToIdx.push(-1);
		}

		for(var c = 0; c < startingClusters[0][0].length; c++) {
			newColIdxToOnScreenIdx[startingClusters[0][0][c]] = c;
			newColOnScreenIdxToIdx[c] = startingClusters[0][0][c];
		}

		colIdxToOnScreenIdx = newColIdxToOnScreenIdx;
		colOnScreenIdxToIdx = newColOnScreenIdxToIdx;
		colTopCluster = startingClusters[0];
		updateGraphicsHelper(false, false, false, false, false, true, false);
	}
	//===================================================================================


	//===================================================================================
	// Do Background Column Clustering
	// This method does the background column clustering.
	//===================================================================================
	function doBackgroundColClustering() {
		// $log.log(preDebugMsg + "doBackgroundColClustering");
		var pathQuery = $location.search();

		if(colBackgroundThread !== null) {
			// already running. kill thread
			colBackgroundThread.terminate();
		}

		colBackgroundThread = new Worker(myPath + '/colClustering.js');
		colBackgroundThread.addEventListener('message', function(e) {
			colClusteringFinished(e);
		}, false);

		var data = {'heatMap':heatMap,
			'noofRows':noofRows,
			'noofCols':noofCols,
			'start':true};
		colBackgroundThread.postMessage(data); // start clustering thread
	}
	//===================================================================================


	//===================================================================================
	// Column Clustering　Finished
	// This method manages the final result when the column clustering finsihed.
	//===================================================================================
	function colClusteringFinished(e) {
		//$log.log(preDebugMsg + "colClusteringFinished");
		var data = e.data;
		colIdxToOnScreenIdx = data.newColIdxToOnScreenIdx;
		colOnScreenIdxToIdx = data.newColOnScreenIdxToIdx;
		colTopCluster = data.colTopCluster;
		updateGraphicsHelper(false, false, false, false, false, true, false);

		if(colBackgroundThread !== null) {
			colBackgroundThread.terminate();
			colBackgroundThread = null;
		}
	}
	//===================================================================================


	//===================================================================================
	// Cluster Columns Clustering
	// This method clusters the cluster columns.
	//===================================================================================
	function clusterColsClustering() {
		// $log.log(preDebugMsg + "clusterColsClustering");
		if(unique > 0) {
			if(typeof(Worker) !== "undefined") {
				if(!alreadyLoggedBackgroundCapability) {
					alreadyLoggedBackgroundCapability = true;
					//$log.log(preDebugMsg + "browser supports background threads");
				}
				doBackgroundColClustering();
			}
			else {
				if(!alreadyLoggedBackgroundCapability) {
					alreadyLoggedBackgroundCapability = true;
					//$log.log(preDebugMsg + "Browser does not support background threads. Cluster in main thread.");
				}
				doActualColClustering();
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Cluster Columns
	// This method cluster columns.
	//===================================================================================
	function clusterCols() {
		// $log.log(preDebugMsg + "clusterCols");
		if(sortCols) {
			// do clustering
			if(showClustering) {
				updateSize();
			}
			clusterColsClustering();

		}
		else {
			topColCluster = [];

			if(typeof(Worker) !== "undefined" && colBackgroundThread !== null) { // if we are clustering in the background, stop doing that
				colBackgroundThread.therminate();
			}

			for(var i = 0; i < noofCols; i++) {
				colIdxToOnScreenIdx[i] = i;
				colOnScreenIdxToIdx[i] = i;
			}
			updateGraphicsHelper(false, false, false, false, false, true, false);
		}
	}
	//===================================================================================


	//============================================================================
    //=== Internal and screen coordinate mapping==================================
    //============================================================================

	//===================================================================================
	// Pixel to Column
	// This method converts a pixel to a column.
	//===================================================================================
	function pixel2col(p) { // pixel position from selection holder
		if(unique <= 0) {
			return 0;
		}

		if(p < leftMarg) {
			return 0;
		}
		if(p > leftMarg + drawW) {
			return noofCols - 1;
		}

		return Math.floor((p - leftMarg) / cellW);
	}
	//===================================================================================


	//===================================================================================
	// Pixel to Row
	// This method converts a pixel to a row.
	//===================================================================================
	function pixel2row(p) { // pixel position from selection holder
		if(unique <= 0) {
			return 0;
		}

		if(p < topMarg) {
			return 0;
		}
		if(p > topMarg + drawH) {
			return noofRows - 1;
		}
		return Math.floor((p - topMarg) / cellH);
	}
	//===================================================================================


	//===================================================================================
	// Column to Pixel
	// This method converts a column to a pixel.
	//===================================================================================
	function col2pixel(v) { // pixel position on the heatmapCanvas (not same as selection holder)
		if(unique <= 0) {
			return 0;
		}

		if(v < 0) {
			return 0;
		}
		if(v > noofCols) {
			return drawW;
		}

		return v * cellW;
	}
	//===================================================================================


	//===================================================================================
	// Row to Pixel
	// This method converts a row to a pixel.
	//===================================================================================
	function row2pixel(v) { // pixel position on the heatmapCanvas (not same as selection holder)
		if(unique <= 0) {
			return 0;
		}

		if(v < 0) {
			return 0;
		}
		if(v > noofRows) {
			return drawH;
		}

		return Math.floor(v * cellH);
	}
	//===================================================================================


	//===================================================================================
	// Intensity to Pixel
	// This method converts an intensity value to a pixel.
	//===================================================================================
	function intensity2pixel(v) {
		if(v < heatLimits.min) {
			return topMarg + drawH - selectionBarBottomMargin;
		}
		if(v > heatLimits.max) {
			return topMarg + selectionBarTopMargin;
		}
		return topMarg + selectionBarTopMargin + barH - Math.floor((v - heatLimits.min) / (heatLimits.max - heatLimits.min) * barH);
	}
	//===================================================================================


	//===================================================================================
	// Pixel to Intensity
	// This method converts a pixel to an intensity value.
	//===================================================================================
	function pixel2intensity(p) {
		if(p < topMarg + selectionBarTopMargin) {
			return heatLimits.max;
		}
		if(p > topMarg + drawH - selectionBarBottomMargin) {
			return heatLimits.min;
		}
		return heatLimits.min + (heatLimits.max - heatLimits.min) * ((barH - (p - topMarg - selectionBarTopMargin)) / barH);
	}
	//===================================================================================


	//===================================================================================
	// Draw One Row Cluster
	// This method draws one row cluster.
	//===================================================================================
	function drawOneRowCluster(left, cluster) {
		if(cluster.length < 2) {
			return;
		}

		// $log.log(preDebugMsg + "drawOneRowCluster");
		if(cluster[1].length >= 2) { // we have children
			// spanning line
			// first child middle
			var children = cluster[1];
			var r1 = rowIdxToOnScreenIdx[children[0][0][0]];
			var r2 = rowIdxToOnScreenIdx[children[0][0][children[0][0].length - 1]];
			var y1 = row2pixel(r1);
			var y2 = row2pixel(r2);
			var Y1 = Math.round((y1 + y2) / 2);

			// second child middle
			r1 = rowIdxToOnScreenIdx[children[1][0][0]];
			r2 = rowIdxToOnScreenIdx[children[1][0][children[1][0].length - 1]];
			y1 = row2pixel(r1);
			y2 = row2pixel(r2);
			var Y2 = Math.round((y1 + y2) / 2);

			if(Y1 > Y2) {
				y1 = Math.round(Y2 + cellH/2);
				y2 = Math.round(Y1 + cellH/2);
			}
			else {
				y1 = Math.round(Y1 + cellH/2);
				y2 = Math.round(Y2 + cellH/2);
			}

			var x1 = Math.floor(left + (cluster[0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(x1, y1, 1, y2 - y1 + 1);

			// line to first child
			//$log.log(preDebugMsg + "cluster[1]=" + JSON.stringify(cluster[1]));
			var x0 = Math.floor(left + (cluster[1][0][0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(x0, Math.round(Y1 + cellH/2), x1 - x0, 1);
			// child
			drawOneRowCluster(left, cluster[1][0]);

			// line to second child
			var x0 = Math.floor(left + (cluster[1][1][0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(x0, Math.round(Y2 + cellH/2), x1 - x0, 1);
			// child
			drawOneRowCluster(left, cluster[1][1]);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw One Column Cluster
	// This method draws one column cluster.
	//===================================================================================
	function drawOneColCluster(top, cluster) {
		if(cluster.length < 2) {
			return;
		}

		if(cluster[1].length >= 2) { // we have children
			// spanning line
			// first child middle
			var children = cluster[1];
			var c1 = colIdxToOnScreenIdx[children[0][0][0]];
			var c2 = colIdxToOnScreenIdx[children[0][0][children[0][0].length - 1]];
			var x1 = col2pixel(c1);
			var x2 = col2pixel(c2);
			var X1 = (x1 + x2)/2;

			// second child middle
			c1 = colIdxToOnScreenIdx[children[1][0][0]];
			c2 = colIdxToOnScreenIdx[children[1][0][children[1][0].length - 1]];
			x1 = col2pixel(c1);
			x2 = col2pixel(c2);
			var X2 = (x1 + x2) / 2;

			if(X1 > X2) {
				x1 = Math.round(X2 + cellH/2);
				x2 = Math.round(X1 + cellH/2);
			}
			else {
				x1 = Math.round(X1 + cellH/2);
				x2 = Math.round(X2 + cellH/2);
			}

			var y1 = Math.floor(top + (cluster[0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(x1, y1, x2 - x1 + 1, 1);

			// line to first child

			var y0 = Math.floor(top + (cluster[1][0][0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(Math.round(X1 + cellH/2), y0, 1, y1 - y0);
			// child
			drawOneColCluster(top, cluster[1][0]);

			// line to second child
			var y0 = Math.floor(top + (cluster[1][1][0].length - 1) * clusterTreeSpacing);
			clusterCtx.fillRect(Math.round(X2 + cellH/2), y0, 1, y1 - y0);

			// child
			drawOneColCluster(top, cluster[1][1]);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Selection Bar
	// This method draws the selection bar.
	//===================================================================================
	function drawSelectionBar() {
		// $log.log(preDebugMsg + "drawSelectionBar " + drawH);
		if(barCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBarCanvas');
			if(myCanvasElement.length > 0) {
				barCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(barCtx === null) {
			barCtx = barCanvas.getContext("2d");
		}

		barCtx.clearRect(0,0, barCanvas.width, barCanvas.height);

		var X = Math.floor(selectionBarLeftMargin + selectionBarW/2);
		var grd = barCtx.createLinearGradient(X, topMarg + selectionBarTopMargin, X, topMarg + selectionBarTopMargin + barH);
		if(heatLimits.min < 0 && heatLimits.max > 0) {
			grd.addColorStop(0, hotColor);
			grd.addColorStop(heatLimits.max / (heatLimits.max + Math.abs(heatLimits.min)), zeroColor);
			grd.addColorStop(1, coldColor);
		}
		else if(heatLimits.min < 0) {
			grd.addColorStop(0, zeroColor);
			grd.addColorStop(1, coldColor);
		}
		else {
			grd.addColorStop(0, hotColor);
			grd.addColorStop(1, zeroColor);
		}

		barCtx.fillStyle = grd;
		barCtx.fillRect(selectionBarLeftMargin, topMarg + selectionBarTopMargin, selectionBarW, barH);
		barCtx.fillStyle = textColor;
		barCtx.font = fontSize + "px Arial";

		var s = legacyDDSupLib.number2text(heatLimits.max, heatLimits.max - heatLimits.min);
		var textW = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, s);
		barCtx.fillText(s, Math.round(X - textW/2), topMarg + selectionBarTopMargin - 5);

		var s = legacyDDSupLib.number2text(heatLimits.min, heatLimits.max - heatLimits.min);
		var textW = legacyDDSupLib.getTextWidthCurrentFont(labelsCtx, s);
		barCtx.fillText(s, Math.round(X - textW/2), topMarg + drawH - selectionBarBottomMargin + fontSize + 5);
	}
	//===================================================================================


	//===================================================================================
	// Draw Selection Boxes
	// This method draws the selection boxes.
	//===================================================================================
	function drawSelectionBoxes(globalSelections) {
		// $log.log(preDebugMsg + "drawSelectionBoxes");
		if(boxesCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBoxesCanvas');
			if(myCanvasElement.length > 0) {
				boxesCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(boxesCtx === null) {
			boxesCtx = boxesCanvas.getContext("2d");
		}

		boxesCtx.clearRect(0,0, boxesCanvas.width, boxesCanvas.height);

		if(unique > 0) {
			var w = Math.max(10, cellW);
			if(selectionBarRightMargin - 2 < w) {
				w = selectionBarRightMargin - 2;
			}
			if(w < 1) {
				w = 1;
			}

			var x1 = leftMarg - w - 1;

			for(var r = 0; r < noofRows; r++) {
				var set = rowIdSetIdIdx[r][0];
				var idx = rowIdSetIdIdx[r][1];
				var groupId = 0;
				if(set < globalSelections.length) {
					if(idx < globalSelections[set].length) {
						groupId = globalSelections[set][idx];
					}
				}

				var col = legacyDDSupLib.getColorForGroup(groupId, colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors")));
				if(groupId == "0") {
					col = hexColorToRGBA(col, 0.33);
				}

				var y1 = row2pixel(rowIdxToOnScreenIdx[r]);
				var h = cellH;
				if(h > 5) {
					y1++;
					h -= 2;
				}
				else if(h > 3) {
					y1++;
					h--;
				}

				boxesCtx.fillStyle = col;
				boxesCtx.fillRect(x1, y1, w, h);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Labels
	// This method draws the labels.
	//===================================================================================
	function drawLabels() {
		// $log.log(preDebugMsg + "drawLabels");
		if(labelsCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theLabelsCanvas');
			if(myCanvasElement.length > 0) {
				labelsCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(labelsCtx === null) {
			labelsCtx = labelsCanvas.getContext("2d");
		}

		labelsCtx.clearRect(0,0, labelsCanvas.width, labelsCanvas.height);

		if(unique > 0 && showColumnLabels) {
			labelsCtx.fillStyle = textColor;
			labelsCtx.font = fontSize + "px Arial";
			var nextOKpos = 0;

			for(var c = 0; c < noofCols; c++) {
				// var y1 = Math.floor(topMarg + drawH + bottomMarg);
				var y1 = Math.floor(noofRows * cellH + bottomMarg);
				var s = columnNames[colOnScreenIdxToIdx[c]];
				var x1 = Math.floor(col2pixel(c));

				if(nextOKpos <= x1) {
					labelsCtx.save();
					labelsCtx.translate(x1, y1);
					labelsCtx.rotate(Math.PI/2);
					labelsCtx.fillText(s, 0, 0);
					labelsCtx.restore();
					nextOKpos = x1 + fontSize + 2;
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Row Cluster
	// This method draws a Row Cluster.
	//===================================================================================
	function drawRowCluster() {
		drawClusters();
	}
	//===================================================================================


	//===================================================================================
	// Draw Column Cluster
	// This method draws a column Cluster.
	//===================================================================================
	function drawColCluster() {
		drawClusters();
	}
	//===================================================================================


	//===================================================================================
	// Draw Clusters
	// This method draws the Clusters.
	//===================================================================================
	function drawClusters() {
		// $log.log(preDebugMsg + "drawClusters");
		if(clusterCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theClusterCanvas');
			if(myCanvasElement.length > 0) {
				clusterCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(clusterCtx === null) {
			clusterCtx = clusterCanvas.getContext("2d");
		}

		clusterCtx.clearRect(0,0, clusterCanvas.width, clusterCanvas.height);
		clusterCtx.fillStyle = textColor;

		if(sortRows) {
			var left = noofCols * cellW;
			drawOneRowCluster(left, rowTopCluster);
		}

		if(sortCols) {
			var top = noofRows * cellH;
			drawOneColCluster(top, colTopCluster);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Heat Map
	// This method draws the Heat Map.
	//===================================================================================
	function drawHeatMap(W, H, globalSelections, globalSelectionsCols) {
		// $log.log(preDebugMsg + "drawHeatMap");
		if(unique <= 0) {
			return;
		}

		var startTime = Date.now();
		// $log.log(preDebugMsg + "drawHeatMap() start " + startTime);

		if(heatmapCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theHeatmapCanvas');
			if(myCanvasElement.length > 0) {
				heatmapCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(heatmapCtx === null) {
			heatmapCtx = heatmapCanvas.getContext("2d");
		}

		heatmapCtx.clearRect(0,0, heatmapCanvas.width,heatmapCanvas.height);

		var drawPretty = true;
		if(noofRows * noofCols > quickRenderThreshold) {
			drawPretty = false;
			var rgbaBorder = hexColorToRGBAvec(borderColor, 1.0);
			var WW = heatmapCanvas.width;
			var HH = heatmapCanvas.height;
			var imData = heatmapCtx.getImageData(0, 0, WW, HH);
			var pixels = imData.data;
		}

		for(var r = 0; r < noofRows; r++) {
			if(heatMap[r] === null) {
				// nothing to draw
			}
			else {
				for(var c = 0; c < noofCols; c++) {
					var v = heatMap[r][c][0];
					var y1 = Math.floor(row2pixel(rowIdxToOnScreenIdx[r]));
					var x1 = Math.floor(col2pixel(colIdxToOnScreenIdx[c]));
					var isCellSelected = true;

					if(heatMap[r][c][1] == 0) {
						// cell not selected locally
						isCellSelected = false;
					}

					var isRowSelected = isCellSelected;
					if(isRowSelected) { // if cell is not selected, row will never be selected (because the heat map pushes this selection to the global selections)
						var set = rowIdSetIdIdx[r][0];
						var idx = rowIdSetIdIdx[r][1];
						var selArray = [];
						if(set < globalSelections.length) {
							selArray = globalSelections[set];
						}
						var rowGroupId = 0;
						if(idx < selArray.length) {
							rowGroupId = selArray[idx];
						}
						if(rowGroupId <= 0) {
							isRowSelected = false;
						}
					}

					var isColSelected = true;
					if(haveCols) {
						var colGroupId = 0;

						set = colIdSetIdIdx[c][0];
						idx = colIdSetIdIdx[c][1];
						selArray = globalSelectionsCols[set];
						if(idx < selArray.length) {
							colGroupId = selArray[idx];
						}
						if(colGroupId <= 0) {
							isColSelected = false;
						}
					}

					if(drawPretty) {
						var transp = 1;
						var col = getColorForValue(v);

						if(fadeOutUnselected) {
							if(!isCellSelected) {
								transp *= 0.75;
							}
							if(!isRowSelected) {
								transp *= 0.5;
							}
							if(!isColSelected) {
								transp *= 0.5;
							}

							col = hexColorToRGBA(col, transp);
						}

						heatmapCtx.fillStyle = col;
						heatmapCtx.fillRect(x1, y1, cellW, cellH);

						if(showBorder && isCellSelected && cellW > 3 && cellH > 3) {
							heatmapCtx.strokeStyle = borderColor;
							heatmapCtx.strokeRect(x1, y1, cellW, cellH);
						}
					}
					else {
						var transp = 1;
						var col = getColorForValueVec(v);
						var alpha = 255;
						if(fadeOutUnselected) {
							if(!isCellSelected) {
								transp *= 0.75;
							}
							if(!isRowSelected) {
								transp *= 0.5;
							}
							if(!isColSelected) {
								transp *= 0.5;
							}

							alpha = Math.floor(transp*alpha);
						}

						if(showBorder && isCellSelected && cellW > 3 && cellH > 3) {
							legacyDDSupLib.fillRectFast(x1+1, y1+1, cellW-1, cellH-1, col[0], col[1], col[2], alpha, pixels, WW, HH);
							boundRectFast(x1, y1, cellW, cellH, rgbaBorder[0], rgbaBorder[1], rgbaBorder[2], 255, pixels, WW, HH);
						}
						else {
							legacyDDSupLib.fillRectFast(x1, y1, cellW, cellH, col[0], col[1], col[2], alpha, pixels, WW, HH);
						}
					}
				}
			}
		}

		if(!drawPretty) {
			heatmapCtx.putImageData(imData, 0, 0);
		}
		var endTime = Date.now();
		// $log.log(preDebugMsg + "drawHeatMap() end " + endTime + ", total: " + (endTime - startTime) + ", pretty = " + drawPretty);
	}
	//===================================================================================


	//===================================================================================
	// Draw Heat Map
	// This method draws the Heat Map.
	//===================================================================================
	function boundRectFast(X1, Y1, DX, DY, r, g, b, alpha, pixels, Width, Height){
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var dx = Math.round(DX);
		var dy = Math.round(DY);

		for (var i = 0; i < dx; i++) {
			var rx = x1 + i;
			var ry = y1;
			if(ry >= 0 && ry < H && rx >= 0 && rx < W) {
				var offset = (ry * W + rx) * 4;
				pixels[offset] = r;
				pixels[offset+1] = g;
				pixels[offset+2] = b;
				pixels[offset+3] = alpha;
			}
		}
		for (var i = 0; i < dx; i++) {
			ry = y1 + dy;
			if(ry >= 0 && ry < H && rx >= 0 && rx < W) {
				var offset = (ry * W + rx) * 4;
				pixels[offset] = r;
				pixels[offset+1] = g;
				pixels[offset+2] = b;
				pixels[offset+3] = alpha;
			}
		}

		for (var i = 0; i < dy; i++) {
			var rx = x1;
			var ry = y1 + i;
			if(ry >= 0 && ry < H && rx >= 0 && rx < W) {
				var offset = (ry * W + rx) * 4;
				pixels[offset] = r;
				pixels[offset+1] = g;
				pixels[offset+2] = b;
				pixels[offset+3] = alpha;
			}
		}

		for (var i = 0; i < dy; i++) {
			rx = x1 + dx;
			if(ry >= 0 && ry < H && rx >= 0 && rx < W) {
				var offset = (ry * W + rx) * 4;
				pixels[offset] = r;
				pixels[offset+1] = g;
				pixels[offset+2] = b;
				pixels[offset+3] = alpha;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Get Color for Value
	// This method gets the color for a specified value.
	//===================================================================================
	function getColorForValue(v) {
		if(heatLimits.min < 0 && heatLimits.max > 0) {
			if(v >= 0) {
				var prop = Math.log(v + 1) / Math.log(heatLimits.max + 1);
				var r = zeroColorRGB[0] + prop * (hotColorRGB[0] - zeroColorRGB[0]);
				var g = zeroColorRGB[1] + prop * (hotColorRGB[1] - zeroColorRGB[1]);
				var b = zeroColorRGB[2] + prop * (hotColorRGB[2] - zeroColorRGB[2]);
				var rs = Math.floor(prop * r).toString(16)
				if(rs.length < 2) {
					rs = "0" + rs;
				}
				var gs = Math.floor(prop * g).toString(16)
				if(gs.length < 2) {
					gs = "0" + gs;
				}
				var bs = Math.floor(prop * b).toString(16)
				if(bs.length < 2) {
					bs = "0" + bs;
				}
				var col = "#" + rs + gs + bs;
				return col;
			}
			else {
				var prop = Math.log(1 - v) / Math.log(1 - heatLimits.min);
				var r = zeroColorRGB[0] + prop * (coldColorRGB[0] - zeroColorRGB[0]);
				var g = zeroColorRGB[1] + prop * (coldColorRGB[1] - zeroColorRGB[1]);
				var b = zeroColorRGB[2] + prop * (coldColorRGB[2] - zeroColorRGB[2]);
				var rs = Math.floor(prop * r).toString(16)
				if(rs.length < 2) {
					rs = "0" + rs;
				}
				var gs = Math.floor(prop * g).toString(16)
				if(gs.length < 2) {
					gs = "0" + gs;
				}
				var bs = Math.floor(prop * b).toString(16)
				if(bs.length < 2) {
					bs = "0" + bs;
				}
				var col = "#" + rs + gs + bs;
				return col;
			}
		}
		else if(heatLimits.min < 0) {
			var prop = Math.log(1 + (v - heatLimits.min)) / Math.log(1 + heatLimits.max - heatLimits.min);
			var r = zeroColorRGB[0] + prop * (coldColorRGB[0] - zeroColorRGB[0]);
			var g = zeroColorRGB[1] + prop * (coldColorRGB[1] - zeroColorRGB[1]);
			var b = zeroColorRGB[2] + prop * (coldColorRGB[2] - zeroColorRGB[2]);
			var rs = Math.floor(prop * r).toString(16)
			if(rs.length < 2) {
				rs = "0" + rs;
			}
			var gs = Math.floor(prop * g).toString(16)
			if(gs.length < 2) {
				gs = "0" + gs;
			}
			var bs = Math.floor(prop * b).toString(16)
			if(bs.length < 2) {
				bs = "0" + bs;
			}
			var col = "#" + rs + gs + bs;
			return col;
		}
		else {
			var prop = Math.log(1 + (v - heatLimits.min)) / Math.log(1 + heatLimits.max - heatLimits.min);
			var r = zeroColorRGB[0] + prop * (hotColorRGB[0] - zeroColorRGB[0]);
			var g = zeroColorRGB[1] + prop * (hotColorRGB[1] - zeroColorRGB[1]);
			var b = zeroColorRGB[2] + prop * (hotColorRGB[2] - zeroColorRGB[2]);
			var rs = Math.floor(prop * r).toString(16)
			if(rs.length < 2) {
				rs = "0" + rs;
			}
			var gs = Math.floor(prop * g).toString(16)
			if(gs.length < 2) {
				gs = "0" + gs;
			}
			var bs = Math.floor(prop * b).toString(16)
			if(bs.length < 2) {
				bs = "0" + bs;
			}
			var col = "#" + rs + gs + bs;
			return col;
		}
	}
	//===================================================================================


	//===================================================================================
	// Get Color for Value Vector
	// This method gets the color for a specified value vector.
	//===================================================================================
	function getColorForValueVec(v) {
		if(heatLimits.min < 0 && heatLimits.max > 0) {
			if(v >= 0) {
				var prop = Math.log(v + 1) / Math.log(heatLimits.max + 1);
				var r = zeroColorRGB[0] + prop * (hotColorRGB[0] - zeroColorRGB[0]);
				var g = zeroColorRGB[1] + prop * (hotColorRGB[1] - zeroColorRGB[1]);
				var b = zeroColorRGB[2] + prop * (hotColorRGB[2] - zeroColorRGB[2]);
				var col = [r, g, b];
				return col;
			}
			else {
				var prop = Math.log(1 - v) / Math.log(1 - heatLimits.min);
				var r = zeroColorRGB[0] + prop * (coldColorRGB[0] - zeroColorRGB[0]);
				var g = zeroColorRGB[1] + prop * (coldColorRGB[1] - zeroColorRGB[1]);
				var b = zeroColorRGB[2] + prop * (coldColorRGB[2] - zeroColorRGB[2]);
				var col = [r, g, b];
				return col;
			}
		}
		else if(heatLimits.min < 0) {
			var prop = Math.log(1 + (v - heatLimits.min)) / Math.log(1 + heatLimits.max - heatLimits.min);
			var r = zeroColorRGB[0] + prop * (coldColorRGB[0] - zeroColorRGB[0]);
			var g = zeroColorRGB[1] + prop * (coldColorRGB[1] - zeroColorRGB[1]);
			var b = zeroColorRGB[2] + prop * (coldColorRGB[2] - zeroColorRGB[2]);
			var col = [r, g, b];
			return col;
		}
		else {
			var prop = Math.log(1 + (v - heatLimits.min)) / Math.log(1 + heatLimits.max - heatLimits.min);
			var r = zeroColorRGB[0] + prop * (hotColorRGB[0] - zeroColorRGB[0]);
			var g = zeroColorRGB[1] + prop * (hotColorRGB[1] - zeroColorRGB[1]);
			var b = zeroColorRGB[2] + prop * (hotColorRGB[2] - zeroColorRGB[2]);
			var col = [r, g, b];
			return col;
		}
	}
	//===================================================================================


	//===================================================================================
	// Check if Global Selections Acturally Changed
	// This method checks if the global selections actually changed.
	//===================================================================================
	function checkIfGlobalSelectionsActuallyChanged () {
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		var globalSelectionsCols = [];
		if(haveCols && globalSelectionsPerId.hasOwnProperty("ColumnIdSlot")) {
			globalSelectionsCols = globalSelectionsPerId["ColumnIdSlot"];
		}
		var globalSelections = [];
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}

		var dirty = false;
		var colDirty = false;
		var nullDirty = false;

		for(var r = 0; r < noofRows; r++) {
			var set = rowIdSetIdIdx[r][0];
			var idx = rowIdSetIdIdx[r][1];
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}
			var rowGroupId = 0;
			if(idx < selArray.length) {
				rowGroupId = selArray[idx];
			}

			if(set < lastSeenGlobalSelections.length) {
				selArray = lastSeenGlobalSelections[set];
			}
			var oldRowGroupId = 0;
			if(idx < selArray.length) {
				oldRowGroupId = selArray[idx];
			}

			if(oldRowGroupId != rowGroupId) {
				nullDirty = true;
			}

			if(heatMap[r] !== null) {
				if(oldRowGroupId != rowGroupId) {
					dirty = true;
				}

				if(haveCols && fadeOutUnselected) {
					for(var c = 0; c < noofCols; c++) {
						if(haveCols && fadeOutUnselected) {
							var colGroupId = 0;
							set = colIdSetIdIdx[c][0];
							idx = colIdSetIdIdx[c][1];
							if(set < globalSelectionsCols.length) {
								selArray = globalSelectionsCols[set];
								if(idx < selArray.length) {
									colGroupId = selArray[idx];
								}
							}

							var oldColGroupId = 0;
							if(set < lastSeenGlobalSelectionsCols.length) {
								selArray = lastSeenGlobalSelectionsCols[set];
								if(idx < selArray.length) {
									oldColGroupId = selArray[idx];
								}
							}

							if(oldColGroupId != colGroupId) {
								colDirty = true;
							}
						}
					}
				}
			}

			if(dirty) {
				break;
			}
		}

		if(dirty) {
			// $log.log(preDebugMsg + "global selections dirty, redraw");
			updateGraphicsHelper(false, false, true, fadeOutUnselected, false, false, false);
		}
		else if(colDirty && haveCols && fadeOutUnselected) {
			updateGraphicsHelper(false, false, nullDirty, true, false, false, false);
		}
		else if(nullDirty) {
			updateGraphicsHelper(false, false, nullDirty, false, false, false, false);
		}
	}
	//===================================================================================


	//============================================================================
    //=== Mouse Stuff ============================================================
    //============================================================================

	//===================================================================================
	// Mouse Position is in Heat Map Area
	// This method checks if the mouse position is within the heat map area.
	//===================================================================================
	function mousePosIsInHeatMapArea(pos) {
		if(pos.x > leftMarg && pos.x <= leftMarg + drawW && pos.y > topMarg && pos.y <= topMarg + drawH) {
			// return true;
			if(pos.y - topMarg < noofRows * cellH
				&& pos.x - leftMarg < noofCols * cellW) {
				return true;
			}
		}
		return false;
	}
	//===================================================================================


	//============================================================================
	//=== Colour Stuff ============================================================
	//============================================================================

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
