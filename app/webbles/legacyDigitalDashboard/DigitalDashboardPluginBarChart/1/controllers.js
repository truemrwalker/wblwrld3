//======================================================================================================================
// Controllers for Digital Dashboard Plugin Bar Chart Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================
wblwrld3App.controller('barChartPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.displayText = "Bar Chart";
	var preDebugMsg = "DigitalDashboard Bar Chart: ";

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var dropCanvas = null;
    var dropCtx = null;
    var hoverText = null;
    var dataName = null;
    var weightName = null;
    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;
    var selectionHolderElement = null;
    var selectionRect = null;
    var idArrays = [];
    var dataArrays = [];
    var wheightArrays = [];
    var haveWeights = false;
    var dataType = "number";
    var dateFormat = "";
    var sources = 0;
    var Ns = [];
    var N = 0;
    var limits = {min:0, max:0};
    var unique = 0;
    var NULLs = 0;
    var selections = []; // the graphical ones
    var localSelections = []; // the data to send to the parent
    var leftMarg = 25;
    var topMarg = 10;
    var rightMarg = 5;
    var bottomMarg = 5;
    var fontSize = 11;
    var colorPalette = null;
    var textColor = "#000000";
    var useGlobalGradients = false;
    var mouseClicked = false;
    var clickStart = null;
    var drawBarWidth = 1;
    var barWidth = 1;
    var colSep = 1;
    var noofGroups = 1;
    var leftShift = 0;
    var hScale = 0;
    var drawH = 1;
    var drawW = 1;
    var useLog = false;
    var lowerCaseStrings = false;
    var allTextSelected = false;
    var someStringsDidNotFit = false;
    var adjusted = {};
    var adjustedMinMax = {};
    var labels = {};
    var sumsLabels = {};
    var idxMap = {};
    var idxMapPos = {};
    var internalSelectionsInternallySetTo = {};
    var dropW = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forParent":{'idSlot':'DataIdSlot', 'name':'weights', 'type':'number', 'slot':'WeightsForBarChartSlot'}, "label":"Weights", "rotate":true};
    var dropX = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forParent":{'idSlot':'DataIdSlot', 'name':'data', 'type':'number|date|string', 'slot':'DataForBarChartSlot'}, "label":"Data", "rotate":false};
    var allDropZones = [dropW, dropX];
    var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneW = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneX, dragZoneW];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
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
			case "FontSize":
				updateSize();
				updateGraphics();
				break;
			case "DrawingArea:height":
				updateSize();
				updateGraphics();
				break;
			case "DrawingArea:width":
				updateSize();
				updateGraphics();
				break;
			case "root:height":
				updateSize();
				parseSelectionColors();
				updateGraphics();
				break;
			case "root:width":
				updateSize();
				parseSelectionColors();
				updateGraphics();
				break;
			case "MinimumBarWidth":
				updateGraphics();
				break;
			case "BarSeparatorWidth":
				updateGraphics();
				break;
			case "UseLogaritmicCounts":
				if(eventData.slotValue) {
					useLog = true;
				}
				else {
					useLog = false;
				}
				updateGraphics();
				break;
			case "UseGlobalColorGradients":
				if(eventData.slotValue) {
					useGlobalGradients = true;
				}
				else {
					useGlobalGradients = false;
				}
				updateGraphics();
				break;
			case "LowerCaseStrings":
				if(eventData.slotValue) {
					lowerCaseStrings = true;
				}
				else {
					lowerCaseStrings = false;
				}
				if(dataType == 'string') {
					updateGraphics();
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
				updateGraphics();
				break;
			case "Highlights":
				updateGraphics();
				break;
			case "GroupColors":
				colorPalette = null;
				parseSelectionColors();
				updateGraphics();
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
					var idx = mousePosToBucketIdx(currentMouse);
					if(idx < 0) {
						hoverText.style.display = "none";
						// $log.log(preDebugMsg + "no hover: no bucket returned");
					}
					else {
						var s = "'" + labels[idx] + "'";
						if(sumsLabels[idx] != "") {
							s += ": " + sumsLabels[idx];
						}
						else {
							s += ": 0";
						}

						var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, s);
						hoverText.style.font = fontSize + "px Arial";
						hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
						hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
						hoverText.innerHTML = s;
						hoverText.style.display = "block";
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
					newSelection(x1,x2, clickStart.ctrl);
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
					newSelection(x1,x2, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	}
	//===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================================

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

		var myCanvasElement = $scope.theView.parent().find('#theCanvas');
		if(myCanvasElement.length > 0) {
			myCanvas = myCanvasElement[0];
			ctx = myCanvas.getContext("2d");
		}
		else {
			//$log.log(preDebugMsg + "no canvas to draw on!");
		}

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// internal slots specific to this Webble -----------------------------------------------------------
		$scope.addSlot(new Slot('DataDropped',
			{},
			"Data Dropped",
			'Slot to notify parent that data has been dropped on this plugin using drag&drop.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataDropped').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('FontSize',
			11,
			"Font Size",
			'The font size to use in the Webble interface.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinimumBarWidth',
			5,
			"Minimum Bar Width",
			'The minimum width (in pixels) of one bar in the bar chart.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('BarSeparatorWidth',
			2,
			"Bar Separator Width",
			'The width (in pixels) between bars in the bar chart.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseLogaritmicCounts',
			false,
			"Use Logarithmic Counts",
			'Logarithmic or linear bar heights.',
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

		$scope.addSlot(new Slot('LowerCaseStrings',
			false,
			"Lower Case Strings",
			'Should string data be converted to lower case? (i.e. treat "Webble" and "webble" as equal)',
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

		// Dashboard Plugin slots -----------------------------------------------------------
		$scope.addSlot(new Slot('PluginName',
			"Bar Chart",
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
			[
				[{'idSlot':'DataIdSlot', 'name':'data', 'type':'number|date|string', 'slot':'DataForBarChartSlot'},
					{'idSlot':'DataIdSlot', 'name':'weights', 'type':'number', 'slot':'WeightsForBarChartSlot'}],

				[{'idSlot':'DataIdSlot', 'name':'data', 'type':'number|date|string', 'slot':'DataForBarChartSlot'}]
			],
			"Expected Format",
			'The input this plugin accepts.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DataForBarChartSlot',
			[[1,1,3,4,3,1]],
			"Data for Bar Chart Slot",
			'The slot where the input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('DataForBarChartSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		$scope.addSlot(new Slot('WeightsForBarChartSlot',
			[[]],
			"Weights for Bar Chart Slot",
			'The slot where the weights (optional) for the input data should be put.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('WeightsForBarChartSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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

		updateGraphics();

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
		$scope.theView.find('.canvasStuffForDigitalDashboardBarChart').droppable({
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
			if(selections[sel].length < 4 || !selections[sel][4]) {
				result.selections.push({'min':selections[sel][0], 'max':selections[sel][1], 'includeNulls':false});
			}
			else {
				result.selections.push({'min':selections[sel][0], 'max':selections[sel][1], 'includeNulls':true});
			}
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
		//$log.log(preDebugMsg + "setSelectionsFromSlotValue");
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
					var includeNulls = false;
					if(newSel.hasOwnProperty("includeNulls") && newSel.includeNulls) {
						includeNulls = true;
					}

					var val1 = newSel.min;
					var val2 = newSel.max;
					var onlyNulls = false;
					if(val1 == null && val2 == null && includeNulls) {
						onlyNulls = true;
					}

					if(!onlyNulls) {
						allTextSelected = false;
						if(val1 <= limits.min && val2 >= limits.max) {
							// covers everything
							if(dataType == 'string') {
								allTextSelected = true;
							}
						}
						if(val2 < limits.min || val1 > limits.max) {
							// completely outside
							continue;
						}

						val1 = Math.max(limits.min, val1);
						val2 = Math.min(limits.max, val2);
					}

					var firstOverlap = true;
					var v1 = val1;
					var v2 = val2;
					var v3 = 0;
					var v4 = drawW;
					var v5 = includeNulls;
					var wi = drawBarWidth * noofGroups;
					for(var d in adjusted) {
						if(d == "null") {
							if(includeNulls) {
								var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
								var x2 = x1+wi;

								if(firstOverlap) {
									firstOverlap = false;
									v3 = x1;
									v4 = x2;
								}
								else {
									if(v3 > x1) {
										v3 = x1;
									}
									if(v4 < x2) {
										v4 = x2;
									}
								}
							}
						}
						else if(!onlyNulls) {
							if(val1 <= adjustedMinMax[d][1] && adjustedMinMax[d][0] <= val2) {
								// overlaps with selection
								// we may need to grow the selection
								v1 = Math.min(adjustedMinMax[d][0], v1);
								v2 = Math.max(adjustedMinMax[d][1], v2);
								var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
								var x2 = x1+wi;

								if(firstOverlap) {
									firstOverlap = false;
									v3 = x1;
									v4 = x2;
								}
								else {
									if(v3 > x1) {
										v3 = x1;
									}
									if(v4 < x2) {
										v4 = x2;
									}
								}
							}
						}
					}
					newSelections.push([v1,v2,v3,v4, v5]);
				}

				// $log.log(preDebugMsg + "new selections: " + JSON.stringify(newSelections));
				if(newSelections.length > 0) {
					selections = newSelections;
					updateLocalSelections(false);
					drawSelections();
				}
			}
			else { // no data
				var newSelections = [];
				for(var sel = 0; sel < slotSelections.selections.length; sel++) {
					var newSel = slotSelections.selections[sel];
					var val1 = newSel.min;
					var val2 = newSel.max;
					newSelections.push([val1, val2, 0,0, true]);
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
		var wi = drawBarWidth * noofGroups;
		var newSelections = [];

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];
			var val1 = newSel[0];
			var val2 = newSel[1];

			if(val1 == null && val2 == null) {
				if(NULLs > 0 && newSel.length > 4 && newSel[4]) {
					// we may need to move the position
					for(var d in adjusted) {
						if(d == "null") {
							var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
							var x2 = x1+wi;

							newSel[2] = x1;
							newSel[3] = x2;
							break;
						}
					}
				}
			}
			else {
				if(val1 <= limits.min && val2 >= limits.max) {
					// covers everything
					return true; // give up
				}
				if(val2 < limits.min || val1 > limits.max) {
					// completely outside
					continue;
				}

				val1 = Math.max(limits.min, val1);
				val2 = Math.min(limits.max, val2);
				var firstOverlap = true;

				for(var d in adjusted) {
					if(d == "null") {
						if(newSel.length > 4 && newSel[4]) { // include nulls
							var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
							var x2 = x1+wi;

							if(firstOverlap) {
								firstOverlap = false;
								newSel[2] = x1;
								newSel[3] = x2;
							}
							else {
								if(newSel[2] > x1) {
									newSel[2] = x1;
								}
								if(newSel[3] < x2) {
									newSel[3] = x2;
								}
							}

						}
					}
					else {
						if(val1 <= adjustedMinMax[d][1] && adjustedMinMax[d][0] <= val2) {
							// overlaps with selection
							// we may need to grow the selection
							newSel[0] = Math.min(adjustedMinMax[d][0], newSel[0]);
							newSel[1] = Math.max(adjustedMinMax[d][1], newSel[1]);
							var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
							var x2 = x1+wi;

							if(firstOverlap) {
								firstOverlap = false;
								newSel[2] = x1;
								newSel[3] = x2;
							}
							else {
								if(newSel[2] > x1) {
									newSel[2] = x1;
								}
								if(newSel[3] < x2) {
									newSel[3] = x2;
								}
							}
						}
					}
				}
			}
			newSelections.push(newSel);
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

		// $log.log(preDebugMsg + "selections before sorting: " + JSON.stringify(selections));
		selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.
		// $log.log(preDebugMsg + "selections after sorting: " + JSON.stringify(selections));

		for(var set = 0; set < Ns.length; set++) {
			var dataArray = dataArrays[set];
			var selArray = localSelections[set];

			for(var i = 0; i < Ns[set]; i++) {
				var newVal = 1;

				if(selectAll) {
					newVal = 1;
				}
				else {
					var groupId = 0;

					if(dataType == 'string') {
						if(allTextSelected) {
							groupId = 1;
						}
						else {
							var s = dataArray[i];
							if(lowerCaseStrings && s !== null) {
								s = s.toLowerCase();
							}
							var idx = idxMap[s];

							for(var span = 0; span < selections.length; span++) {
								if(selections[span][0] <= idx
									&& idx <= selections[span][1]) {
									groupId = span + 1;
									break;
								}
							}
						}
					}
					else {
						if(dataArray[i] === null) {
							for(var span = 0; span < selections.length; span++) {
								if(selections[span].length > 4 && selections[span][4]) {
									groupId = span + 1;
									break;
								}
							}
						}
						else {
							for(var span = 0; span < selections.length; span++) {
								if(selections[span][0] !== null
									&& selections[span][1] !== null
									&& selections[span][0] <= dataArray[i]
									&& dataArray[i] <= selections[span][1]) {
									groupId = span + 1;
									break;
								}
							}
						}
					}
					newVal = groupId;
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
		dataArrays = [];
		wheightArrays = [];
		localSelections = [];
		haveWeights = false;
		dataType = "number";
		dataName = null;
		weightName = null;
		dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		dragZoneW = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
		sources = 0;
		Ns = [];
		N = 0;
		limits = {max:0, min:0};
		buckets = {};
		unique = 0;
		NULLs = 0;
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

		resetVars();

		if(parentInput.length > 0) {
			for(var i = 0; i < parentInput.length; i++) {
				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "data") {
					atLeastOneFilled = true;

					if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
						dataType = 'date';
					}
					else if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "string") {
						dataType = 'string';
					}
					else {
						dataType = 'number';
					}

					dragZoneX.name = "Data";
					dropX.forParent.vizName = $scope.gimme("PluginName");
					dragZoneX.ID = JSON.stringify(dropX.forParent);

					if(parentInput[i].hasOwnProperty("description")) {
						dataName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
						dragZoneX.name = dataName;
					}
				}

				if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "weights") {
					haveWeights = true;

					if(parentInput[i].hasOwnProperty("type") && parentInput[i].type != "number") {
						haveWeights = false;
					}
					else {
						weightName = "";
						dragZoneW.name = "Weights";
						dropW.forParent.vizName = $scope.gimme("PluginName");
						dragZoneW.ID = JSON.stringify(dropW.forParent);

						if(parentInput[i].hasOwnProperty("description")) {
							weightName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
							dragZoneW.name = weightName;
						}
					}
				}
			}
		}

		var dataIsCorrupt = false;

		if(atLeastOneFilled) {
			var buckets = {};
			idArrays = $scope.gimme('DataIdSlot');
			dataArrays = $scope.gimme('DataForBarChartSlot');

			if(haveWeights) {
				weightArrays = $scope.gimme('WeightsForBarChartSlot');
			}

			if(idArrays.length != dataArrays.length) {
				dataIsCorrupt = true;
			}
			if(idArrays.length <= 0) {
				dataIsCorrupt = true;
			}
			if(haveWeights && weightArrays.length != idArrays.length) {
				dataIsCorrupt = true;
			}

			if(!dataIsCorrupt) {
				sources = dataArrays.length;

				for(var source = 0; source < sources; source++) {
					var dataArray = dataArrays[source];
					var idArray = idArrays[source];

					if(idArray.length != dataArray.length) {
						dataIsCorrupt = true;
					}
					if(idArray.length <= 0) {
						dataIsCorrupt = true;
					}
					if(haveWeights && weightArrays[source].length != idArrays[source].length) {
						dataIsCorrupt = true;
					}
				}
			}

			if(!dataIsCorrupt) {
				Ns = [];
				var firstNonNullData = true;
				var minVal = 0;
				var maxVal = 0;

				for( source = 0; source < sources; source++) {
					var dataArray = dataArrays[source];
					var idArray = idArrays[source];
					if(haveWeights) {
						var weightArray = weightArrays[source];
					}

					N += dataArray.length;
					Ns.push(dataArray.length);

					localSelections.push([]);

					for(i = 0; i < Ns[source]; i++) {
						localSelections[source].push(0);

						if(dataArray[i] !== null) {
							var val = dataArray[i];
							var valStr = val.toString();
							var w = 1;
							if(haveWeights) {
								w = weightArray[i];
								if(w === null) {
									dataIsCorrupt = true;
									w = 1;
								}
							}

							if(buckets.hasOwnProperty[valStr]) {
								buckets[valStr] += w;
							}
							else {
								unique += 1;
								buckets[valStr] = w;
							}

							if(firstNonNullData) {
								firstNonNullData = false;
								if(dataType != 'string') {
									minVal = val;
									maxVal = val;
								}
								else {
									minVal = 0;
									maxVal = 1;
								}
							}
							else {
								if(dataType != 'string') {
									if(val < minVal) {
										minVal = val;
									}
									if(val > maxVal) {
										maxVal = val;
									}
								}
							}
						}
						else {
							NULLs += 1;
						}
					}
				}
				if(firstNonNullData) {
					dataIsCorrupt = true; // only null values
				}
				else {
					limits = {};
					limits.min = minVal;
					limits.max = maxVal;
					if(dataType == 'date') {
						if(limits.max == limits.min) {
							dateFormat = 'full';
						}
						else {
							var d1 = new Date(limits.min);
							var d2 = new Date(limits.max);
							if(d2.getFullYear() - d1.getFullYear() > 10) {
								dateFormat = 'onlyYear';
							}
							else if(d2.getFullYear() - d1.getFullYear() > 1) {
								dateFormat = 'yearMonth';
							}
							else {
								var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
								if(d2.getMonth() != d1.getMonth()) {
									dateFormat = 'monthDay';
								}
								else if(days > 5) {
									dateFormat = 'day';
								}
								else if(days > 1) {
									dateFormat = 'dayTime';
								}
								else {
									dateFormat = 'time';
								}
							}
						}
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

		updateGraphics();

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
		else {
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
	// Update Graphics
	// This method updates the graphics.
	//===================================================================================
	function updateGraphics() {
		// $log.log(preDebugMsg + "updateGraphics()");
		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(ctx === null) {
			ctx = myCanvas.getContext("2d");
		}

		var W = myCanvas.width;
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		var H = myCanvas.height;
		if(typeof H === 'string') {
			H = parseFloat(H);
		}
		if(H < 1) {
			H = 1;
		}

		// $log.log(preDebugMsg + "Clear the canvas");
		ctx.clearRect(0,0, W,H);

		var colors = $scope.gimme("GroupColors");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin") && colors.skin.hasOwnProperty("text")) {
			textColor = colors.skin.text;
		}
		else {
			textColor = "#000000";
		}

		drawBackground(W, H);
		drawBars(W, H);
		drawAxes(W, H);
		updateSelectionRectangles();
		updateDropZones(textColor, 0.3, false);
	}
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background based on the specified width and height.
	//===================================================================================
	function drawBackground(W,H) {
		var colors = $scope.gimme("GroupColors");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false;
			if(colors.skin.hasOwnProperty("gradient")) {
				var OK = true;
				var grd = ctx.createLinearGradient(0,0,W,H);
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
					ctx.fillStyle = grd;
					ctx.fillRect(0,0,W,H);
					drewBack = true;
				}
			}
			if(!drewBack && colors.skin.hasOwnProperty("color")) {
				ctx.fillStyle = colors.skin.color;
				ctx.fillRect(0,0,W,H);
				drewBack = true;
			}

			if(colors.skin.hasOwnProperty("border")) {
				ctx.fillStyle = colors.skin.border;
				ctx.fillRect(0,0, W,1);
				ctx.fillRect(0,H-1, W,H);
				ctx.fillRect(0,0, 1,H);
				ctx.fillRect(W-1,0, W,H);
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

			dropX.left = leftMarg + marg1;
			dropX.top = topMarg + drawH;
			dropX.right = leftMarg + drawW - marg1;
			dropX.bottom = H;
			dropW.left = 0;
			dropW.top = topMarg + marg2;
			dropW.right = leftMarg;
			dropW.bottom = topMarg + drawH - marg2;

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
					var w = Math.min(W - l, dropZone.right - dropZone.left + fontSize / 2 + dropZone.left - l);
					var h = Math.min(H - t, dropZone.bottom - dropZone.top + fontSize / 2 + dropZone.top - t );
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
						var tw = legacyDDSupLib.getTextWidth(ctx, str, fnt);
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
		// $log.log(preDebugMsg + "drawAxes");
		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		// X Axis
		ctx.fillStyle = textColor;
		ctx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

		// Y Axis
		ctx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

		// top label
		var str = "";
		var xw = -1;
		var ww = -1;
		if(weightName !== null && haveWeights) {
			if(dataName !== null) {
				str = dataName + ", weighted by " + weightName;
				xw = legacyDDSupLib.getTextWidthCurrentFont(ctx, dataName);
				ww = legacyDDSupLib.getTextWidthCurrentFont(ctx, weightName);
			}
			else {
				str = "Weighted by " + weightName;
				ww = legacyDDSupLib.getTextWidthCurrentFont(ctx, weightName);
			}
		}
		else {
			if(dataName !== null) {
				str = dataName;
				xw = legacyDDSupLib.getTextWidthCurrentFont(ctx, dataName);
			}
		}

		if(str != "") {
			var w = legacyDDSupLib.getTextWidthCurrentFont(ctx, str);
			var top = 0;
			if(fontSize < topMarg) {
				top = Math.floor((topMarg - fontSize) / 2);
			}
			var left = 0;
			if(w < W) {
				left = Math.floor((W - w) / 2);
			}

			ctx.fillText(str, left, top + fontSize);

			if(xw >= 0) {
				dragZoneX = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dragZoneX.name, 'ID':dragZoneX.ID};
			}
			if(ww >= 0) {
				dragZoneW = {'left':(left + w - ww), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':dragZoneW.name, 'ID':dragZoneW.ID};
			}
			allDragNames = [dragZoneX, dragZoneW];
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Bars
	// This method draws the bars.
	//===================================================================================
	function drawBars(W, H) {
		if(unique <= 0) {
			return;
		}
		// $log.log(preDebugMsg + "drawBars");

		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;
		var minBW = parseInt($scope.gimme('MinimumBarWidth'));
		var sep = parseInt($scope.gimme('BarSeparatorWidth'));
		useLog = $scope.gimme('UseLogaritmicCounts');
		var sums = {};
		leftShift = 0;
		hScale = 0;

		if(typeof sep === 'string') {
			sep = parseInt(sep);
		}
		if(typeof sep !== 'number') {
			sep = 0;
		}

		if(typeof minBW === 'string') {
			minBW = parseInt(minBW);
		}
		if(typeof minBW !== 'number') {
			minBW = 1;
		}

		var buckets = {};
		var groupBuckets = {};
		var min = limits.min;
		var max = limits.max;
		var n = N;
		noofGroups = 0;
		var globalSelections = [];
		var globalSelectionsPerId = $scope.gimme('GlobalSelections');
		if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
			globalSelections = globalSelectionsPerId['DataIdSlot'];
		}

		var seenNulls = 0;
		for(var set = 0; set < dataArrays.length; set++) {
			var dataArray = dataArrays[set];
			if(haveWeights) {
				var weightArray = weightArrays[set];
			}
			var selArray = [];
			if(set < globalSelections.length) {
				selArray = globalSelections[set];
			}

			for(var i = 0; i < Ns[set]; i++) {
				if(dataArray[i] === null) {
					seenNulls++;
				}

				var d = dataArray[i];
				if(lowerCaseStrings && dataType == 'string' && d !== null) {
					d = d.toString().toLowerCase();
				}

				if(dataType == 'date' && d !== null && d instanceof Date) {
					d = d.getTime();
				}

				var groupId = 0;
				if(i < selArray.length) {
					groupId = selArray[i];
				}

				var weight = 1;
				if (haveWeights) {
					weight = weightArray[i];
				}

				if (buckets.hasOwnProperty(d)){
					buckets[d] += weight;
				}
				else {
					buckets[d] = weight;
				}

				if (!groupBuckets.hasOwnProperty(groupId)) {
					groupBuckets[groupId] = {};
				}

				if (groupBuckets[groupId].hasOwnProperty(d)) {
					groupBuckets[groupId][d] += weight;
				}
				else {
					groupBuckets[groupId][d] = weight;
				}
			}
		}

		//$log.log(preDebugMsg + "saw " + seenNulls + " null values.");

		if (groupBuckets.hasOwnProperty("0")) {
			noofGroups = Object.keys(groupBuckets).length - 1; // remove 1 since the group of unselected are counted as a group too
		}
		else {
			noofGroups = Object.keys(groupBuckets).length;
		}

		if (noofGroups < 1) {
			noofGroups = 1;
		}

		var minColW = minBW;
		colSep = sep;
		var maxNoofBuckets = Math.floor(drawW / ((minColW + colSep) * noofGroups + 1));
		if (maxNoofBuckets < 1) {
			maxNoofBuckets = 1;
		}

		var maxMaxNoofBuckets = Math.floor(drawW / ((minColW + colSep) + 1));
		if (maxMaxNoofBuckets < 1) {
			maxMaxNoofBuckets = 1;
		}

		var map = {};
		var backmap = {};
		labels = {};
		sumsLabels = {};
		idxMap = {};
		idxMapPos = {};

		if(dataType == 'string') {
			var sortedKeys = [];
			var looksDiscrete = true;
			for (var k in buckets) {
				sortedKeys.push([buckets[k], k]);
			}

			sortedKeys.sort(function(a,b){ if(b[0] != a[0]) return b[0] - a[0]; if(b[1] < a[1]) return 1; return -1;});

			if(sortedKeys.length > maxNoofBuckets) {
				sortedKeys.splice(maxNoofBuckets, sortedKeys.length - maxNoofBuckets);
				someStringsDidNotFit = true;
			}
			else {
				someStringsDidNotFit = false;
			}

			var maxidx = sortedKeys.length - 1;
			limits.min = 0;
			limits.max = maxidx + 0.5;
			var idx = 0;
			buckets = {};
			for (var kk = 0; kk < sortedKeys.length; kk++){
				var k = sortedKeys[kk][1];
				buckets[k] = sortedKeys[kk][0];
				idxMap[k] = idx;
				idxMapPos[k] = idx;
				var label = k;
				if(k === null) {
					label = "[No Value]";
				}
				labels[idx] = label;
				backmap[idx] = k;
				map[k] = k;
				idx++;
			}

			barWidth = Math.floor(drawW / (noofGroups * (maxidx + 1)) - colSep);
			if (barWidth < 1) {
				barWidth = 1;
			}
			drawBarWidth = barWidth;

		}
		else { // not string (i.e. date or number
			var valuespan = max - min;
			var bucketspan = valuespan / maxNoofBuckets;

			// do some smoothing of the interval sizes, the start and end positions etc. for more natural intervals here
			var sortedKeys = [];
			var looksDiscrete = true;
			for (var k in buckets) {
				if(k !== null && k != "null") {
					var diff = k - Math.floor(k);
					if (diff < 0 || diff > 0) {
						looksDiscrete = false;
					}
				}
				sortedKeys.push(k);
			}

			sortedKeys.sort();
			var smallestDiff = 1;
			var smallStepSize = 1;
			if (sortedKeys.length >= 2) {
				if(sortedKeys[0] !== null && sortedKeys[1] !== null && sortedKeys[0] != "null" && sortedKeys[1] != "null") {
					smallestDiff = Math.abs(sortedKeys[0] - sortedKeys[1]);
					for (var i = 2; i < sortedKeys.length; i++) {
						if(sortedKeys[i] !== null && sortedKeys[i] != "null") {
							var diff = Math.abs(sortedKeys[i] - sortedKeys[i - 1]);
							smallestDiff = Math.min(smallestDiff, diff);
						}
					}
				}
			}

			var uniquevals = Object.keys(buckets).length;
			var precisionStr = 0;

			if (smallestDiff >= 1) {
				smallStepSize = 1;
			}
			else if (smallestDiff >= 0.1) {
				smallStepSize = 0.1;
				precisionStr = 1;
			}
			else if (smallestDiff >= 0.01) {
				smallStepSize = 0.01;
				precisionStr = 2;
			}
			else if (smallestDiff >= 0.001) {
				smallStepSize = 0.001;
				precisionStr = 3;
			}
			else if (smallestDiff >= 0.0001) {
				smallStepSize = 0.0001;
				precisionStr = 4;
			}
			else if (smallestDiff >= 0.00001) {
				smallStepSize = 0.00001;
				precisionStr = 5;
			}
			else {
				smallStepSize = 0.000001;
				precisionStr = 6;
			}

			if (uniquevals > 0) {
				if (uniquevals == 1) {
					bucketspan = 1;
				}
				else {
					if (looksDiscrete) {
						var bspan = Math.floor(valuespan) / maxMaxNoofBuckets;
						var bspan = Math.floor(valuespan) / maxNoofBuckets;
						if (bspan < 1) {
							bspan = 1;
						}

						while (bspan * maxNoofBuckets < valuespan) {
							bspan++;
						}

						bucketspan = bspan;
					}
					else { // not discrete
						if(precisionStr > 0 && precisionStr < 22) {
							min = parseFloat((min - smallStepSize / 2.0).toPrecision(precisionStr));
							max = parseFloat((max + smallStepSize / 2.0).toPrecision(precisionStr));
						}
						else {
							min = parseFloat((min - smallStepSize / 2.0).toPrecision());
							max = parseFloat((max + smallStepSize / 2.0).toPrecision());
						}

						if(seenNulls > 0) {
							bucketspan = (max - min + 1) / (drawW / (minColW * noofGroups + colSep) - 2);
						}
						else {
							bucketspan = (max - min + 1) / (drawW / (minColW * noofGroups + colSep) - 1);
						}
					}
				}
			}

			var hits = {};
			var maxhits = 1;
			var maxidx = 0;
			for (var k in buckets) {
				if(k === null || k == "null") {
					var idx = Math.floor((max - min) / bucketspan + 1);
				}
				else {
					var idx = Math.floor((k - min) / bucketspan);
				}

				if (!idxMap.hasOwnProperty(k)) {
					idxMap[k] = idx;
					idxMapPos[k] = idx;
				}

				if (idx > maxidx) {
					maxidx = idx;
				}

				if (!labels.hasOwnProperty(idx)) {
					var label = null;
					if(k === null || k == "null") {
						label = "[No Value]";
					}
					else {
						if(dataType == 'date') {
							label = "[" + (legacyDDSupLib.date2text(Math.floor(min) + idx * Math.floor(bucketspan), dateFormat)) + " - " + (legacyDDSupLib.date2text(Math.floor(min) + (idx + 1) * Math.floor(bucketspan) - 1), dateFormat) + "]";
						}
						else {
							if (looksDiscrete) {
								label = "[" + (Math.floor(min) + idx * Math.floor(bucketspan)).toString() + ", " + (Math.floor(min) + (idx + 1) * Math.floor(bucketspan) - 1).toString() + "]";
							}
							else {
								if(looksDiscrete) {
									label = "[" + (min + idx * bucketspan).toString() + ", " + (min + (idx + 1) * bucketspan).toString() + ")";
								}
								else {
									if(precisionStr > 3 || precisionStr < 1) {
										precisionStr = 3;
									}
									if(precisionStr > 0 && precisionStr < 22) {
										label = "[" + legacyDDSupLib.number2text(min + idx * bucketspan, limits.max-limits.min) + ", " + legacyDDSupLib.number2text(min + (idx + 1) * bucketspan, limits.max-limits.min) + ")";
									}
									else {
										label = "[" + legacyDDSupLib.number2text(min + idx * bucketspan, limits.max-limits.min) + ", " + legacyDDSupLib.number2text(min + (idx + 1) * bucketspan, limits.max-limits.min) + ")";
									}
								}
							}
						}
					}

					if(label === null) {
						labels[idx] = "";
					}
					else {
						labels[idx] = label;
					}
				}

				if (!backmap.hasOwnProperty(idx)) {
					backmap[idx] = k;
				}

				var representative = backmap[idx];
				map[k] = representative;

				if (hits.hasOwnProperty(idx)) {
					hits[idx] += 1;
					if (hits[idx] > maxhits) {
						maxhits = hits[idx];
					}
				}
				else {
					hits[idx] = 1;
				}
			}

			if (maxhits == 1) {
				for (k in buckets) {
					var i = idxMap[k];

					if (labels.hasOwnProperty(i)) {
						if(dataType == 'date') {
							labels[i] = (legacyDDSupLib.date2text(parseInt(k), dateFormat));
						}
						else {
							labels[i] = k.toString();
						}
						idxMapPos[k] = (k - min) / bucketspan;
					}
				}
			}

			// experimental, may look weird?
			for(k in buckets) {
				var i = idxMap[k];

				if(hits[k] == 1) {
					if (labels.hasOwnProperty(i))
					 {
						if(dataType == 'date') {
							labels[i] = (legacyDDSupLib.date2text(parseInt(k), dateFormat));
						}
						else {
							labels[i] = k.toString();
						}
					}
				}
			}

			barWidth = Math.floor(drawW / (noofGroups * (maxidx + 1)) - colSep);
			if (barWidth < 1) {
				barWidth = 1;
			}

			drawBarWidth = barWidth;
			var biggerSpan = bucketspan;
			while (biggerSpan < smallestDiff * 0.8) {
				biggerSpan += smallestDiff / 4.0;
			}
			if (biggerSpan != bucketspan) {
				drawBarWidth = Math.floor(barWidth * biggerSpan / bucketspan);
			}

			if (drawBarWidth != barWidth) {
				barWidth = Math.floor((drawW - drawBarWidth) / (noofGroups * (maxidx + 1)) - colSep);
				drawBarWidth = Math.floor(barWidth * biggerSpan / bucketspan);
			}
		} // end of 'if number or date'

		leftShift = Math.floor((drawW - (drawBarWidth - barWidth) - (barWidth * noofGroups + colSep) * (maxidx + 1) - colSep) / 2);
		if (leftShift < 0) {
			leftShift = 0;
		}

		adjusted = {};
		adjustedMinMax = {};
		var adjustedGroups = {};
		for (var d in buckets) {
			if (adjusted.hasOwnProperty(map[d])) {
				adjusted[map[d]] += buckets[d];
				if(dataType != 'string') {
					if(d == "null") {
						//$log.log(preDebugMsg + "This should not happen: non-null value mapped to same bin as null. " + d);
						adjustedMinMax[map[d]] = [null, null];
					}
					else {
						adjustedMinMax[map[d]][0] = Math.min(Number(d), adjustedMinMax[map[d]][0]);
						adjustedMinMax[map[d]][1] = Math.max(Number(d), adjustedMinMax[map[d]][1]);
					}
				}
				else {
					adjustedMinMax[map[d]][0] = Math.min(idxMap[d], adjustedMinMax[map[d]][0]);
					adjustedMinMax[map[d]][1] = Math.max(idxMap[d]+0.5, adjustedMinMax[map[d]][1]);
				}
			}
			else {
				adjusted[map[d]] = buckets[d];
				if(dataType != 'string') {
					if(d == "null") {
						adjustedMinMax[map[d]] = [null, null];
					}
					else {
						adjustedMinMax[map[d]] = [Number(d),Number(d)];
					}
				}
				else {
					adjustedMinMax[map[d]] = [idxMap[d],idxMap[d]+0.5];
				}
			}
		}

		for (var d in adjusted) {
			var idx = idxMap[d];
			sums[idx] = adjusted[d];
			sumsLabels[idx] = "";
		}

		for (var groupId in groupBuckets) {
			var selBuckets = groupBuckets[groupId];

			if (!adjustedGroups.hasOwnProperty(groupId)) {
				adjustedGroups[groupId] = {};
			}

			var adjustedSel = adjustedGroups[groupId];
			for (var d in selBuckets) {
				if (adjustedSel.hasOwnProperty(map[d])) {
					adjustedSel[map[d]] += selBuckets[d];
				}
				else {
					adjustedSel[map[d]] = selBuckets[d];
				}
			}
		}

		var maxval = 0;
		for (var d in adjusted) {
			if (adjusted[d] > maxval) {
				maxval = adjusted[d];
			}
		}

		if(maxval <= 0) {
			maxval = 1;
		}

		if (useLog) {
			hScale = drawH / Math.log(1 + maxval);
		}
		else {
			hScale = drawH / maxval;
		}
		var biggestBar = 0;

		for (var d in adjusted) {
			var wi = drawBarWidth * noofGroups;
			var he =  hScale * adjusted[d];

			if (useLog) {
				he = hScale * Math.log(1 + adjusted[d]);
			}

			if (adjusted[d] > biggestBar) {
				biggestBar = adjusted[d];
			}

			var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
			var y1 = topMarg + drawH - he;
			var c = legacyDDSupLib.getGradientColorForGroup(0, x1,y1,x1+wi,y1+he, 0.33, myCanvas, ctx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors")));
			ctx.fillStyle = c;
			ctx.fillRect(x1,y1,wi,he);
			c = hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors"))), 0.33);
			ctx.fillStyle = c;
			ctx.fillRect(x1,y1,wi,1); // top
			ctx.fillRect(x1,y1,1,he); // left
			ctx.fillRect(x1,y1+he-1,wi,1); // bottom
			ctx.fillRect(x1+wi-1,y1,1,he); // right
		}

		if (biggestBar == 0) {
			biggestBar = 1;
		}

		// sort IDs so we know what order to draw the bars in
		var groupIds = [];
		for (var groupId in adjustedGroups) {
			if (groupId > 0) {
				groupIds.push(groupId);
			}
		}
		groupIds.sort();

		var posMap = {};
		for (var i = 0; i < groupIds.length; i++) {
			posMap[groupIds[i]] = i;
		}

		for (var gi = 0; gi < groupIds.length; gi++) {
			groupId = groupIds[gi];

			if (groupId > 0) {
				var adjustedSel = adjustedGroups[groupId];
				for (var d in adjusted) {
					var idx = idxMap[d];
					if (sumsLabels[idx] != "") {
						sumsLabels[idx] += "/";
					}
					if (adjustedSel.hasOwnProperty(d)) {
						sumsLabels[idx] += adjustedSel[d].toString();
					}
					else {
						sumsLabels[idx] += "0";
					}
				}
			}
		}

		for (var groupId in adjustedGroups) {
			if (groupId > 0) {
				var adjustedSel = adjustedGroups[groupId];
				for (var d in adjusted) {
					if (adjustedSel.hasOwnProperty(d)) {
						var wi = drawBarWidth;
						var he = hScale * adjustedSel[d];
						if (useLog) {
							he = hScale * Math.log(1 + adjustedSel[d]);
						}

						var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep) + drawBarWidth * posMap[groupId];
						var y1 = topMarg + drawH - he;
						var c = legacyDDSupLib.getGradientColorForGroup(groupId, x1,y1,x1+wi,y1+he, undefined, myCanvas, ctx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors")));
						ctx.fillStyle = c;
						ctx.fillRect(x1,y1,wi,he);
						c = legacyDDSupLib.getColorForGroup(groupId, colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors")));
						ctx.fillStyle = c;
						ctx.fillRect(x1,y1,wi,1); // top
						ctx.fillRect(x1,y1,1,he); // left
						ctx.fillRect(x1,y1+he-1,wi,1); // bottom
						ctx.fillRect(x1+wi-1,y1,1,he); // right
					}
				}
			}
		}

		var first = true;
		var startIdx = 0;
		var endIdx = 0;
		for(var idx in labels) {
			var idxx = parseInt(idx);
			if(first) {
				first = false;
				startIdx = idxx;
				endIdx = idxx;
			}
			else {
				startIdx = Math.min(startIdx, idxx);
				endIdx = Math.max(endIdx, idxx);
			}
		}

		var lastUsedPos = 0;
		ctx.fillStyle = textColor;
		ctx.font = fontSize + "px Arial";
		for(var idx = startIdx; idx <= endIdx; idx++) {
			if(labels.hasOwnProperty(idx.toString())) {
				var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, labels[idx]);
				var pos = leftMarg + leftShift - textW/2 + (idxMapPos[backmap[idx]] + 0.5) * (barWidth * noofGroups + colSep);
				if(pos > lastUsedPos) {
					ctx.fillText(labels[idx], pos, H - bottomMarg);
					lastUsedPos = pos + textW;
				}
			}
		}

		var noofSteps = 5;
		if (drawH < 100) {
			noofSteps = 3;
		}
		if (drawH > 300) {
			noofSteps = Math.floor(drawH / 75);
		}

		var step = biggestBar / noofSteps;
		if (!haveWeights && step < 1) {
			step = 1;
		}

		if (!haveWeights) {
			step = Math.floor(step);
		}

		if (haveWeights && step > 1.5 || step < -1.5) {
			step = Math.floor(step);
		}

		if (step != 0) {
			for (var i = 0; i <= biggestBar; i += step) {
				ctx.fillStyle = textColor;
				ctx.font = fontSize + "px Arial";
				var text = i.toString();
				var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, text);
                var hp = topMarg + drawH - i * drawH / biggestBar;
				if(useLog) {
					hp = topMarg + drawH - Math.log(1 + i) / Math.log(1 + biggestBar) * drawH;
				}
				if(leftMarg > textW + 5) {
					ctx.fillText(text, leftMarg - 6 - textW, hp + fontSize/2);
				}
				else {
					ctx.fillText(text, 0, hp + fontSize/2);
				}
				ctx.fillRect(leftMarg - 5, hp, 6, 1);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Size
	// This method updates the size.
	//===================================================================================
	function updateSize() {
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

		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		myCanvas.width = rw;
		myCanvas.height = rh;

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
	}
	//===================================================================================


    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(xPos1, xPos2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(unique > 0) {
			var wi = drawBarWidth * noofGroups;
			var firstOverlap = true;
			var newSel = [limits.min, limits.max, leftMarg, leftMarg + drawW, false];
			var coversAll = true;
			for(var d in adjusted) {
				var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
				var x2 = x1+wi;

				if(xPos1 <= x2 && x1 <= xPos2) {
					// overlaps with selection
					if(firstOverlap) {
						firstOverlap = false;
						newSel[0] = adjustedMinMax[d][0];
						newSel[1] = adjustedMinMax[d][1];
						newSel[2] = x1;
						newSel[3] = x2;
						if(d == "null") {
							newSel[4] = true;
						}
					}
					else {
						if(newSel[0] === null) {
							newSel[0] = adjustedMinMax[d][0];
						}
						else if(adjustedMinMax[d][0] === null) {
							// no change
						}
						else {
							newSel[0] = Math.min(adjustedMinMax[d][0], newSel[0]);
						}

						if(newSel[1] === null) {
							newSel[1] = adjustedMinMax[d][1];
						}
						else if(adjustedMinMax[d][1] === null) {
							// no change
						}
						else {
							newSel[1] = Math.max(adjustedMinMax[d][1], newSel[1]);
						}

						if(newSel[2] > x1) {
							newSel[2] = x1;
						}
						if(newSel[3] < x2) {
							newSel[3] = x2;
						}

						if(d == "null") {
							newSel[4] = true;
						}
					}
				}
				else {
					coversAll = false;
				}
			}

			if(firstOverlap) {
				// $log.log(preDebugMsg + "Ignoring selection because nothing was selected");
			}
			else {
				if(!keepOld) {
					allTextSelected = false;
					selections = [];
				}

				var overlap = false;
				for(var s = 0; s < selections.length; s++) {
					var sel = selections[s];
					if(sel[0] == newSel[0] && sel[1] == newSel[1] && sel[2] == newSel[2] && sel[3] == newSel[3] && (sel.length == newSel.length && (sel.length < 5 || sel[4] == newSel[4])) ) {
						// $log.log(preDebugMsg + "Ignoring selection because it overlaps 100% with already existing selection");
						overlap = true;
						break;
					}
				}

				if(!overlap) {
					if(coversAll && dataType == 'string' && someStringsDidNotFit) {
						allTextSelected = true;
					}

					selections.push(newSel);
					drawSelections();
					updateLocalSelections(false);
					saveSelectionsInSlot();
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Selection Rectangles
	// This method updates the selection rectanglle.
	//===================================================================================
	function updateSelectionRectangles() {
		var wi = drawBarWidth * noofGroups;
		var dirty = false;

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];
			var val1 = newSel[0];
			var val2 = newSel[1];
			var firstOverlap = true;

			for(var d in adjusted) {
				if(d == "null") {
					if(newSel.length > 4 && newSel[4]) {
						var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
						var x2 = x1+wi;

						if(firstOverlap) {
							firstOverlap = false;
							newSel[2] = x1;
							newSel[3] = x2;
						}
						else {
							if(newSel[2] > x1) {
								newSel[2] = x1;
							}
							if(newSel[3] < x2) {
								newSel[3] = x2;
							}
						}

					}
				}
				else if(val1 != null && val2 != null) {
					if(val1 <= adjustedMinMax[d][1] && adjustedMinMax[d][0] <= val2) {
						// overlaps with selection
						// we may need to grow the selection
						newSel[0] = Math.min(adjustedMinMax[d][0], newSel[0]);
						newSel[1] = Math.max(adjustedMinMax[d][1], newSel[1]);

						if(newSel[0] != val1 || newSel[1] != val2) {
							dirty = true;
						}

						var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
						var x2 = x1+wi;

						if(firstOverlap) {
							firstOverlap = false;
							newSel[2] = x1;
							newSel[3] = x2;
						}
						else {
							if(newSel[2] > x1) {
								newSel[2] = x1;
							}
							if(newSel[3] < x2) {
								newSel[3] = x2;
							}
						}
					}
				}
			}
		}
		drawSelections();
		if(dirty) {
			updateLocalSelections(false);
			saveSelectionsInSlot();
		}
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	function selectAll() {
		if(dataType == 'string') {
			allTextSelected = true;
		}
		if(unique <= 0) {
			selections = [];
		}
		else {
			selections = [[limits.min, limits.max, leftMarg, leftMarg + drawW, true]];
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
			selectionCtx.fillStyle = selectionColors.grad;
			selectionCtx.fillRect(selections[sel][2],topMarg-1, selections[sel][3] - selections[sel][2], drawH+2);
			selectionCtx.fillStyle = selectionColors.border;
			selectionCtx.fillRect(selections[sel][2],topMarg-1, 1, drawH+2);
			selectionCtx.fillRect(selections[sel][2],topMarg-1, selections[sel][3] - selections[sel][2], 1);
			selectionCtx.fillRect(selections[sel][2],topMarg-1 + drawH+2 - 1, selections[sel][3] - selections[sel][2], 1);
			selectionCtx.fillRect(selections[sel][3] -1,topMarg-1, 1, drawH+2);
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
	// Mouse Position to Bucket Idx
	// This method gets the bucket idx value based on the specified mouse position.
	//===================================================================================
	function mousePosToBucketIdx(pos) {
		if(pos !== null) {
			var wi = drawBarWidth * noofGroups;

			for(var d in adjusted) {
				var he =  hScale * adjusted[d];
				if (useLog) {
					he = hScale * Math.log(1 + adjusted[d]);
				}

				var x1 = leftMarg + leftShift + idxMapPos[d] * (barWidth * noofGroups + colSep);
				var y1 = topMarg + drawH - he;

				if(x1 <= pos.x && pos.x < x1+wi) {
					if(y1 - 10 <= pos.y && pos.y < y1+he) {
						return idxMap[d];
					}
					else {
						return -1;
					}
				}
			}
		}
		return -1;
	}
	//===================================================================================


	//===================================================================================
	// Mouse Position in Selectable Area
	// This method checks whether the mouse pointer is within the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > leftMarg && pos.x <= leftMarg + drawW && pos.y > topMarg && pos.y <= topMarg + drawH) {
			return true;
		}
		return false;
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
