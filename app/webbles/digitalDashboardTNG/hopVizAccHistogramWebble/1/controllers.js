//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP Accumulated Histogram Visualisation Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizAccHistogramWebbleCtrl', function($scope, $log, Slot, Enum) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		DrawingArea: ['width', 'height']
	};

	$scope.displayText = "Histograms";
	var preDebugMsg = "hopVizAccHistogramWebble: ";

	var myInstanceId = -1;

	var dataMappings = [];

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
	var selectionTransparency = 0.533;
	var selectionHolderElement = null;
	var selectionRect = null;

	var haveWeights = false;
	var dataType = "number";
	var dateFormat = "";
	var histogramMode = false;
	var limits = {min:0, max:0};
	var unique = 0;
	var NULLs = 0;
	var N = 0;

	var selections = []; // the graphical ones
	var leftMarg = 25;
	var topMarg = 10;
	var rightMarg = 5;
	var bottomMarg = 5;
	var fontSize = 11;
	var colorPalette = null;
	var textColor = "#000000";
	var useGlobalGradients = false;

	var grouping = true;
	var nullAsUnselected = false;
	var nullGroup = 0;

	var mouseClicked = false;
	var clickStart = null;

	var noofGroups = 1;
	var leftShift = 0;
	var drawH = 1;
	var drawW = 1;

	var useLogN = false;
	var useLogX = false;

	var bucketLimits = [];
	var accCounts = [];

	var maxCount = 0;
	var minBW = 0;
	var sep = 0;
	var groups = [];
	var setWidth = 1;

	var internalSelectionsInternallySetTo = {};

	var dropW = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'weights', 'type':["number"]}, "label":"Weights", "rotate":true};
	var dropX = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'data', 'type':["number","date","string"]}, "label":"Data", "rotate":false};
	var allDropZones = [dropW, dropX];

	var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var dragZoneW = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var allDragNames = [dragZoneX, dragZoneW];
	$scope.dragNdropRepr = "Nothing to drag.";
	$scope.dragNdropID = "No drag data.";
	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;



	//=== EVENT HANDLERS ================================================================

	//========================================================================================
	// Data Dropped
	// This event handler manages when data has been dropped onto the Webble.
	//========================================================================================
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
					dragZoneX.ID = JSON.stringify(dataSourceInfo);
					dragZoneX.name = dataSourceInfo.fieldName;
					dataName = dataSourceInfo.fieldName;
				}
				if(targetField.name == "weights") {
					dragZoneW.ID = JSON.stringify(dataSourceInfo);
					dragZoneW.name = dataSourceInfo.fieldName;
					weightName = dataSourceInfo.fieldName;
				}

				if(somethingChanged) {
					checkMappingsAndParseData();
				}

			}
			else {
				$log.log(preDebugMsg + dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
			}
		} catch(e) {
			// not proper JSON, probably something random was dropped on us so let's ignore this event
		}
	}
	//========================================================================================


	//========================================================================================
	// My Slot Change
	// This event handler manages all important internal slot changes
	//========================================================================================
	function mySlotChange(eventData) {
		try {
			switch(eventData.slotName) {
				case "ClearData":
					if(eventData.slotValue) {
						$scope.clearData();
						$scope.set("ClearData",false);
					}
					break;
				case "InternalSelections":
					if(eventData.slotValue != internalSelectionsInternallySetTo) {
						setSelectionsFromSlotValue();
					}
					break;
				case "TreatNullAsUnselected":
					var newnullAsUnselected = $scope.gimme('TreatNullAsUnselected');
					if(newnullAsUnselected != nullAsUnselected) {
						nullAsUnselected = newnullAsUnselected;
						updateLocalSelections(false);
					}
					break;
				case "MultipleSelectionsDifferentGroups":
					var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
					if(newGrouping != grouping) {
						grouping = newGrouping;
						updateLocalSelections(false);
					}
					break;
				case "SelectAll":
					if(eventData.slotValue) {
						$scope.selectAll();
						$scope.set("SelectAll",false);
					}
					break;
				case "Histogram":
					if($scope.gimme("Histogram")) {
						if(!histogramMode) {
							histogramMode = true;
							updateGraphics();
						}
					}
					else {
						if(histogramMode) {
							histogramMode = false;
							updateGraphics();
						}
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
						if(!useLogN) {
							useLogN = true;
							updateGraphics();
						}
					}
					else {
						if(useLogN) {
							useLogN = false;
							updateGraphics();
						}
					}
					break;
				case "UseLogaritmicX":
					if(eventData.slotValue) {
						if(!useLogX) {
							useLogX = true;
							updateGraphics();
						}
					}
					else {
						if(useLogX) {
							useLogX = false;
							updateGraphics();
						}
					}
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
				case "ColorScheme":
					colorPalette = null;
					parseSelectionColors();
					updateGraphics();
					break;
			};
		} catch(exc) {
			$log.log(preDebugMsg + "Error when reacting to slot change.");
		}
	}
	//========================================================================================


	//========================================================================================
	// On Mouse Move
	// This event handler manages mouse movement.
	//========================================================================================
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
					$log.log(preDebugMsg + "No hover text!");
				}
			}
			if(hoverText !== null) {
				if(mousePosIsInSelectableArea(currentMouse)) {
					if(histogramMode) {
						var idx = mousePosToBucketIdx(currentMouse);
						if(idx < 0) {
							hoverText.style.display = "none";
							// $log.log(preDebugMsg + "no hover: no bucket returned");
						}
						else {
							var s = "[" + bucketLimits[idx].toPrecision(3) + "," + bucketLimits[idx+1].toPrecision(3) + ") --> ";
							var sNoMarkUp = s;
							for(var g = 0; g < groups.length; g++) {
								if(g > 0) {
									s += "/";
									sNoMarkUp += "/";
								}
								s += '<span style="color: ' + legacyDDSupLib.getColorForGroup(groups[g], colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme"))) + '">' + accCounts[idx][g] + '</span>';
								sNoMarkUp += accCounts[idx][g];
							}

							var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, sNoMarkUp);
							hoverText.style.font = fontSize + "px Arial";
							hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
							hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
							hoverText.innerHTML = s;
							hoverText.style.display = "block";
						}
					}
					else {
						// stepCurve mode
						if(useLogX) {
							var val = Math.log(1 + (currentMouse.x - leftMarg) / drawW) * (limits.max - limits.min) + limits.min;
						}
						else {
							var val = (currentMouse.x - leftMarg) / drawW * (limits.max - limits.min) + limits.min;
						}
						var s = val.toPrecision(3);
						var x = Math.floor(currentMouse.x - leftMarg);
						if(x < 0) {
							x = 0;
						}
						else if(x >= accCounts.length) {
							x = accCounts.length - 1;
						}

						var sNoMarkUp = s;
						var first = true;
						for(var g = 0; g < groups.length; g++) {
							if(first) {
								first = false;
								s += " --> [";
								sNoMarkUp += " --> [";
							}
							else {
								s += "/";
								sNoMarkUp += "/";
							}
							s += '<span style="color: ' + legacyDDSupLib.getColorForGroup(groups[g], colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme"))) + '">' + accCounts[x][g] + '</span>';
							sNoMarkUp += accCounts[x][g];
						}
						if(!first) {
							s += "]";
							sNoMarkUp += "]";
						}

						var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, sNoMarkUp);
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
	//========================================================================================


	//========================================================================================
	// On Mouse Down
	// This event handler manages mouse button down.
	//========================================================================================
	var onMouseDown = function(e){
		if(unique > 0) {
			if(e.which === 1){
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

				if(mousePosIsInSelectableArea(currentMouse)) {
					// $log.log(preDebugMsg + "selectable area");
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
	//========================================================================================


	//========================================================================================
	// On Mouse Up
	// This event handler manages mouse button up.
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// On Mouse Out
	// This event handler manages mouse leaving area.
	//========================================================================================
	var onMouseOut = function(e) {
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
				} else {
					newSelection(x1,x2, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//========================================================================================



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

		var myCanvasElement = $scope.theView.parent().find('#theCanvas');
		if(myCanvasElement.length > 0) {
			myCanvas = myCanvasElement[0];
			ctx = myCanvas.getContext("2d");
		}
		else {
			$log.log(preDebugMsg + "no canvas to draw on!");
		}

		$scope.addSlot(new Slot('Histogram',
			histogramMode,
			"Histogram",
			'If true, plot histogram with bars. If false, plot as a step curve instead.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
			grouping,
			"Multiple Selections -> Different Groups",
			'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
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

		$scope.addSlot(new Slot('MinimumBarWidth',
			5,
			"Minimum Bar Width",
			'The minimum width (in pixels) of one bar in the histogram plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('BarSeparatorWidth',
			2,
			"Bar Separator Width",
			'The width (in pixels) between bars in the histogram plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseLogaritmicCounts',
			useLogN,
			"Use Logarithmic Counts",
			'Logarithmic or linear bar heights.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseLogaritmicX',
			useLogX,
			"Use Logarithmic X",
			'Logarithmic or linear scale on X-axis.',
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

		$scope.addSlot(new Slot('ClearData',
			false,
			"Clear Data",
			'Slot to quickly reset to having no data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Dashboard Plugin slots -----------------------------------------------------------

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
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginName',
			"Step Curve",
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

		$scope.setDefaultSlot('ColorScheme');
		myInstanceId = $scope.getInstanceId();

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
			$log.log(preDebugMsg + "No selectionHolderElement, could not bind mouse listeners");
		}

		$scope.fixDroppable();
		$scope.fixDraggable();
	};
	//===================================================================================


	// ============================================================
	// ------- Methods Similar to all Visualization Webbles -------
	// ============================================================

	//========================================================================================
	// Fix Draggable
	// This method fixes the draggable behavior to behave as wanted.
	//========================================================================================
	$scope.fixDraggable = function () {
		$scope.theView.find('.dragSrc').draggable({
			helper: function() {
				return $("<div id=\"" + $scope.dragNdropID + "\">" + $scope.dragNdropRepr + "</div>");
			},
			cursorAt: {top: 5, left: 5}
		});
	};
	//========================================================================================


	//========================================================================================
	// Fix Droppable
	// This method fixes the droppable behavior to behave as wanted.
	//========================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('.canvasStuffForHopVizAccHistogramWebble').droppable({
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
	//========================================================================================


	//========================================================================================
	// Fake Drop
	// This method imitates a file drop.
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// Clear Data
	// This method clears away all data.
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// Type Check
	// This method check the types for the specified parameters.
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// Check Mappings and Parse Data
	// This method checks the mappings and parse the data.
	//========================================================================================
	function checkMappingsAndParseData() {
		// $log.log(preDebugMsg + "checkMappingsAndParseData");
		parsingDataNow = true;
		var somethingChanged = false;
		var atLeastOneActive = false;

		for(var src = 0; src < dataMappings.length; src++) {
			var haveData = false;
			var haveWeights = false;
			var lenData = -1;
			var lenWeights = -1;
			var typeError = false;
			var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
			var ls = w.scope().gimme(dataMappings[src].slotName);

			for(var f = 0; f < dataMappings[src].map.length; f++) {
				if(dataMappings[src].map[f].name == "data") {
					haveData = true;

					if(dataMappings[src].map[f].srcIdx >= ls.length) {
						haveData = false;
					}
					else {
						var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
						lenData = fieldInfo.size;

						dataType = fieldInfo.type[0];

						if(!typeCheck(fieldInfo.type, dropX.forMapping.type)) {
							typeError = true;
							haveData = false;
						}
						else {
							if(dataMappings[src].map[f].listen === null) {
								var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
								dataMappings[src].map[f].listen = fieldInfo.listen;
							}
						}
					}
				}

				if(dataMappings[src].map[f].name == "weights") {
					haveWeights = true;

					if(dataMappings[src].map[f].srcIdx >= ls.length) {
						haveWeights = false;
					}
					else {
						var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
						lenWeights = fieldInfo.size;

						if(!typeCheck(fieldInfo.type, dropW.forMapping.type)) {
							typeError = true;
							haveWeights = false;
						}
						else {
							if(dataMappings[src].map[f].listen === null) {
								var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
								dataMappings[src].map[f].listen = fieldInfo.listen;
							}
						}
					}
				}
			}

			if(haveData && haveWeights && lenData != lenWeights) {
				$log.log(preDebugMsg + "Data and weight fields have different number of data items, which is not allowed for the Bar Chart");
				haveWeights = false;
			}

			var canActivate = false;
			if(haveData) {
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
					// lex[dataMappings[src].map[ff].idx] = true;
					ls2.push(dataMappings[src].map[ff].srcIdx);
				}

				// start listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					// $log.log(preDebugMsg + "Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);

					if(haveWeights || dataMappings[src].map[i].name == "data") {
						dataMappings[src].map[i].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
					}
					else {
						if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
							dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
						}
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
	//========================================================================================


	//========================================================================================
	// Redraw on New Data
	// This method checks weather it is time to redraw based on new data.
	//========================================================================================
	function redrawOnNewData(seqNo) {
		if(lastSeenDataSeqNo != seqNo) {
			lastSeenDataSeqNo = seqNo;
			checkMappingsAndParseData();
		}
	}
	//========================================================================================


	//========================================================================================
	// Redraw on New Selections
	// This method checks weather it is time to redraw based on new Selections.
	//========================================================================================
	function redrawOnNewSelections(seqNo) {
		if(lastSeenSelectionSeqNo != seqNo) {
			lastSeenSelectionSeqNo = seqNo;
			updateGraphics();
		}
	}
	//========================================================================================


	//========================================================================================
	// Save Selections in Slot
	// This method saves the selection in a slot value.
	//========================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		var result = {};
		result.selections = [];
		for(var sel = 0; sel < selections.length; sel++) {
			result.selections.push({'min':selections[sel][0], 'max':selections[sel][1]});
		}

		internalSelectionsInternallySetTo = result;
		$scope.set('InternalSelections', result);
	}
	//========================================================================================


	//========================================================================================
	// Set Selectionss From Slot Value
	// This method creates a slection based on the stored slot value.
	//========================================================================================
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
					var val1 = newSel.min;
					var val2 = newSel.max;

					if(val2 < limits.min || val1 > limits.max) {
						// completely outside
						continue;
					}

					val1 = Math.max(limits.min, val1);
					val2 = Math.min(limits.max, val2);

					var firstOverlap = true;
					var v1 = val1;
					var v2 = val2;
					var v3 = 0;
					var v4 = drawW;

					for(var b = 0; b < bucketLimits.length - 1; b++) {
						if(bucketLimits[b] <= val2 && (val1 < bucketLimits[b+1] || (b == bucketLimits.length - 2 && val1 <= bucketLimits[b+1]) ) ) {
							// overlaps with selection

							// we may need to grow the selection
							v1 = Math.min(bucketLimits[b], v1);
							v2 = Math.max(bucketLimits[b+1], v2);

							var x1 = leftMarg + leftShift + b * setWidth;
							var x2 = x1 + setWidth - sep;

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
					newSelections.push([v1,v2,v3,v4]);
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
					newSelections.push([val1, val2, 0,0]);
				}
				selections = newSelections;
			}
		}
		saveSelectionsInSlot();
	}
	//========================================================================================


	//========================================================================================
	// Check Selections After New Data
	// This method checks the validity of the current selection after new Data has been
	// introduced.
	//========================================================================================
	function checkSelectionsAfterNewData() {
		// $log.log(preDebugMsg + "checkSelectionsAfterNewData");
		var newSelections = [];

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];
			var val1 = newSel[0];
			var val2 = newSel[1];

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

			for(var b = 0; b < bucketLimits.length - 1; b++) {
				if(bucketLimits[b] <= val2 && (val1 < bucketLimits[b+1] || (b == bucketLimits.length - 2 && val1 <= bucketLimits[b+1]))) {
					// overlaps with selection

					// we may need to grow the selection
					newSel[0] = Math.min(bucketLimits[b], val1);
					newSel[1] = Math.max(bucketLimits[b+1], val2);

					var x1 = leftMarg + leftShift + b * setWidth;
					var x2 = x1 + setWidth - sep;

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
			newSelections.push(newSel);
		}

		if(newSelections.length > 0) {
			selections = newSelections;
			drawSelections();
			return false;
		}
		return true;
	}
	//========================================================================================


	//========================================================================================
	// Update Local Selections
	// This method updates the local selection based on global settings.
	//========================================================================================
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

		selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.

		if(!selectAll) {
			if(selections.length == 1 && selections[0][0] <= limits.min && selections[0][1] >= limits.max) {
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
					// $log.log(preDebugMsg + "Not active (selection), stop listening to " + dataMappings[src].map[ff].name + " " + dataMappings[src].map[ff].srcIdx);
					dataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
				}
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// My Selection Status
	// This method returns this Webbles selection status.
	//========================================================================================
	function mySelectionStatus(src, idx) {
		if(dataMappings[src].active) {
			var f = dataMappings[src].valFun;
			var d = f(idx);

			if(d === null) {
				return nullGroup;
			}
			else {
				if(dataType == 'date' && d !== null && d instanceof Date) {
					d = d.getTime();
				}

				var groupId = 0;

				for(var span = 0; span < selections.length; span++) {
					if(selections[span][0] <= d && d <= selections[span][1]) {
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
	//========================================================================================


	//========================================================================================
	// Reset Vars
	// This method resets all major variables in order to make room for new data.
	//========================================================================================
	function resetVars() {
		haveWeights = false;
		dataType = "number";
		limits = {max:0, min:0};
		unique = 0;
		NULLs = 0;
		N = 0;
	}
	//========================================================================================


	//========================================================================================
	// Parse Data
	// This method parses the data.
	//========================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		resetVars();
		var dataIsCorrupt = false;
		var buckets = {};
		var firstNonNullData = true;
		var minVal = 0;
		var maxVal = 0;

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
					if(haveWeights && dataMappings[src].map[f].name == "weights") {
						dataMappings[src].wFun = fieldInfo.val;
					}
				}
			}
			dataMappings[src].clean = true;
		}

		for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
			var f = dataMappings[src].valFun;
			var fw = dataMappings[src].wFun;

			for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
				var val = f(i);

				if(val !== null) {
					var valStr = val.toString();
					var w = 1;
					if(haveWeights) {
						w = fw(i);

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

					N++;

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

		if(!dataIsCorrupt) {
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

		if(dataIsCorrupt) {
			$log.log(preDebugMsg + "data is corrupt");
			resetVars();
		}

		updateGraphics();

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
		else {
			updateLocalSelections(false);

			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
				var W = selectionCanvas.width;
				var H = selectionCanvas.height;
				selectionCtx.clearRect(0,0, W,H);
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// Update Graphics
	// This method updates the graphic to properly represent the current data and selections.
	//========================================================================================
	function updateGraphics() {
		// $log.log(preDebugMsg + "updateGraphics()");

		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
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

		var colors = $scope.gimme("ColorScheme");
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
		drawPlot(W, H);
		drawAxes(W, H);

		updateSelectionRectangles();
		updateDropZones(textColor, 0.3, false);
	}
	//========================================================================================


	//========================================================================================
	// Draw Background
	// This method draws the background graphics of the Webble (behind the plot).
	//========================================================================================
	function drawBackground(W,H) {
		var colors = $scope.gimme("ColorScheme");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false
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
	//========================================================================================


	//========================================================================================
	// Update Drop Zone
	// This method updates the drop zone area based on Webbles size etc.
	//========================================================================================
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
					// dropCtx.strokeStyle = col;
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
							} else {
								dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							dropCtx.rotate(Math.PI/2);
						} else {
							if(dropZone.top < H / 2) {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
							} else {
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
	//========================================================================================


	//========================================================================================
	// Draw Axes
	// This method draws the axes of the diagram.
	//========================================================================================
	function drawAxes(W, H) {
		// $log.log(preDebugMsg + "drawAxes");
		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;
		ctx.fillStyle = textColor;
		ctx.font = fontSize + "px Arial";

		// X Axis
		ctx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

		if(unique > 0) {
			var noofSteps = 5;
			if (drawW < 100) {
				noofSteps = 3;
			}
			if (drawW > 300) {
				noofSteps = Math.floor(drawW / 75);
			}

			var step = (limits.max - limits.min) / noofSteps;

			if (step < 1) {
				step = 1;
			}

			step = Math.floor(step);

			if (step != 0) {
				var wScale = drawW / (limits.max - limits.min);

				for (var i = limits.min; i <= limits.max; i += step) {
					var text = "";
					if(i < 10) {
						text = i.toPrecision(3);
					}
					else if(i < 100) {
						text = i.toString();
					}
					else if(i < 10000) {
						text = Math.floor(i.toString());
					}
					else {
						text = i.toPrecision(3);
					}

					var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, text);
					var x1 = leftMarg + leftShift + setWidth * val2bucketIdx(i, bucketLimits, useLogX);

					ctx.fillText(text, Math.floor(x1 - textW / 2), topMarg + drawH + fontSize + 1);
					ctx.fillRect(x1, topMarg + drawH - 3, 1, 6);
				}
			}
		}

		// Y Axis
		ctx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

		if(unique > 0) {
			var noofSteps = 5;
			if (drawH < 100) {
				noofSteps = 3;
			}
			if (drawH > 300) {
				noofSteps = Math.floor(drawH / 75);
			}

			var step = maxCount / noofSteps;

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
				for (var i = 0; i <= maxCount; i += step) {
					if(i < 10000) {
						var text = i.toString();
					}
					else {
						var text = i.toPrecision(3);
					}

					var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, text);
					var hp = topMarg + drawH - i * drawH / maxCount;
					if(useLogN) {
						hp = topMarg + drawH - Math.log(1 + i) / Math.log(1 + maxCount) * drawH;
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
				dragZoneX = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dataName, 'ID':dragZoneX.ID};
			}
			if(ww >= 0) {
				dragZoneW = {'left':(left + w - ww), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':weightName, 'ID':dragZoneW.ID};
			}
			allDragNames = [dragZoneX, dragZoneW];
		}
	}
	//========================================================================================


	//========================================================================================
	// Update Size
	// This method updates the size of various areas based on Webble main size.
	//========================================================================================
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
				$log.log(preDebugMsg + "no canvas to resize!");
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
	}
	//========================================================================================


	//========================================================================================
	// New Selection
	// This method redraws the plot based on new selection
	//========================================================================================
	function newSelection(xPos1, xPos2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(unique > 0) {
			if(histogramMode) {
				newSelectionHistogram(xPos1, xPos2, keepOld);
			}
			else {
				newSelectionStepCurve(xPos1, xPos2, keepOld);
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// Update Selection Rectangles
	// This method updates and draws the selection rectangles of the plot.
	//========================================================================================
	function updateSelectionRectangles() {
		var dirty = false;

		if(histogramMode) {
			for(var sel = 0; sel < selections.length; sel++) {
				var newSel = selections[sel];
				var val1 = newSel[0];
				var val2 = newSel[1];
				var firstOverlap = true;

				for(var b = 0; b < bucketLimits.length - 1; b++) {
					if((bucketLimits[b] < val2 || (val2 == limits.max && bucketLimits[b] <= val2)) && (val1 < bucketLimits[b+1] || (b == bucketLimits.length - 2 && val1 <= bucketLimits[b+1]))) {
						// overlaps with selection
						// we may need to grow the selection
						newSel[0] = Math.min(bucketLimits[b], val1);
						newSel[1] = Math.max(bucketLimits[b+1], val2);

						if(newSel[0] != val1 || newSel[1] != val2) {
							dirty = true;
						}

						var x1 = leftMarg + leftShift + b * setWidth;
						var x2 = x1 + setWidth - sep;

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
		else { // stepCurve mode
			for(var sel = 0; sel < selections.length; sel++) {
				var val1 = selections[sel][0];
				var val2 = selections[sel][1];

				selections[sel][2] = leftMarg + val2bucketIdx(val1, bucketLimits, useLogX);
				selections[sel][3] = leftMarg + val2bucketIdx(val2, bucketLimits, useLogX);
			}
		}
		drawSelections();
	}
	//========================================================================================


	//========================================================================================
	// Select All
	// This method selects the whole plot and all data points
	//========================================================================================
	$scope.selectAll = function() {
		if(unique <= 0) {
			selections = [];
		}
		else {
			selections = [[limits.min, limits.max, leftMarg, leftMarg + drawW, true]];
		}
		drawSelections();
		updateLocalSelections(true);
		saveSelectionsInSlot();
	};
	//========================================================================================


	//========================================================================================
	// Parse Selection Colors
	// This method parses the selection colors
	//========================================================================================
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
				try {
					var temp = legacyDDSupLib.hexColorToRGBA(selectionColors.border, 0.8);
					selectionColors.border = temp;
				} catch(e) {
					// if it does not work, live with a non-transparent border
				}

			}
			else {
				selectionColors.border = legacyDDSupLib.hexColorToRGBA('#FFA500', 0.8);
			}

			if(colors['selection'].hasOwnProperty('color')) {
				selectionColors.color = legacyDDSupLib.hexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = legacyDDSupLib.hexColorToRGBA('#FFA500', selectionTransparency); // orange
			}

			if(colors['selection'].hasOwnProperty('gradient')) {
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
	//========================================================================================


	//========================================================================================
	// Draw Selections
	// This method draws the selections
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// Hide Selection Rect
	// This method hides the selection rectangle
	//========================================================================================
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
	//========================================================================================


	//========================================================================================
	// Mouse Position to Bucket Idx
	// This method takes the current mouse position and gets the bucket Idx value at that
	// point.
	//========================================================================================
	function mousePosToBucketIdx(pos) {
		if(pos !== null && unique > 0) {
			for(var b = 0; b < bucketLimits.length - 1; b++) {
				var x1 = leftMarg + leftShift + b * setWidth;
				var x2 = x1 + setWidth - sep;

				if(x1 <= pos.x && pos.x <= x2) {
					return b;
				}
			}
		}
		return -1;
	}
	//========================================================================================


	//========================================================================================
	// Mouse Position is in Selectable Area
	// This method checks if the mouse is within selectable area.
	//========================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x >= leftMarg && pos.x <= leftMarg + drawW && pos.y >= topMarg && pos.y <= topMarg + drawH) {
			return true;
		}
		return false;
	}
	//========================================================================================


	// ==============================================
	// ------- Unique Methods for this Webble -------
	// ==============================================

	//========================================================================================
	// Draw Plot
	// This method draws the actual data plot.
	//========================================================================================
	var drawPlot = function(W, H) {
		if(histogramMode) {
			drawHistogram(W, H);
		}
		else {
			drawStepcurve(W, H);
		}
	};
	//========================================================================================


	//========================================================================================
	// Draw Histogram
	// This method draws a histogram plot based on the current data.
	//========================================================================================
	var drawHistogram = function(W, H) {
		if(unique <= 0) {
			return;
		}

		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		minBW = parseInt($scope.gimme('MinimumBarWidth'));
		sep = parseInt($scope.gimme('BarSeparatorWidth'));
		useLogN = $scope.gimme('UseLogaritmicCounts');
		useLogX = $scope.gimme('UseLogaritmicX');

		leftShift = 0;

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

		var min = limits.min;
		var max = limits.max;
		var n = N;

		noofGroups = 0;
		seenGroups = {};
		groups = [];

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].selFun;
				var size = dataMappings[src].size;

				for(var i = 0; i < size; i++) {
					var groupId = fsel(i);
					if(!seenGroups.hasOwnProperty(groupId)) {
						seenGroups[groupId] = groups.length;
						groups.push(groupId);
					}
				}
			}
		}
		noofGroups = groups.length;
		if(noofGroups <= 0) {
			noofGroups = 1;
		}

		var bucketsThatFit = Math.floor(drawW / (noofGroups * minBW + sep));
		if(bucketsThatFit < 1) {
			bucketsThatFit = 1;
		}
		var barW = Math.floor(drawW / bucketsThatFit / noofGroups - sep);
		if(barW < minBW) {
			barW = minBW;
		}
		setWidth = barW * noofGroups + sep;

		var groupCounts = [];
		for(var g = 0; g < groups.length; g++) {
			groupCounts.push(0);
		}

		var buckets = [];
		bucketLimits = [];
		if(useLogX) {
			for(var bucketIdx = 0; bucketIdx < drawW; bucketIdx += setWidth) {
				bucketLimits.push(min + (max - min) * Math.log(1 + bucketIdx / drawW));
			}
			bucketLimits.push(max);
		}
		else {
			for(var bucketIdx = 0; bucketIdx < drawW; bucketIdx += setWidth) {
				bucketLimits.push(min + (max - min) * bucketIdx / drawW);
			}
			bucketLimits.push(max);
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].selFun;
				var f = dataMappings[src].valFun;
				var fw = null;
				if(haveWeights) {
					fw = dataMappings[src].wFun;
				}

				var size = dataMappings[src].size;

				for(var i = 0; i < size; i++) {
					var groupId = fsel(i);
					var val = f(i);
					var w = 1;
					if(haveWeights) {
						w = fw(i);
					}

					var bIdx = val2bucketIdx(val, bucketLimits, useLogX);

					if(bIdx >= 0) {
						// add more buckets if necessary
						while(bIdx >= buckets.length) {
							buckets.push([]);
						}

						var groupIdIdx = seenGroups[groupId];
						// add more groups in this bucket, if necessary
						while(groupIdIdx >= buckets[bIdx].length) {
							buckets[bIdx].push(0);
						}
						buckets[bIdx][groupIdIdx] += w;
					}
				}
			}
		}

		for(var bIdx = 0; bIdx < buckets.length; bIdx++) {
			for(var gIdx = 0; gIdx < buckets[bIdx].length; gIdx++) {
				var count = buckets[bIdx][gIdx];
				groupCounts[gIdx] += count;
			}
		}

		maxCount = 0;
		for(var gIdx = 0; gIdx < groupCounts.length; gIdx++) {
			maxCount = Math.max(groupCounts[gIdx], maxCount);
		}

		accCounts = [];
		for(var bIdx = 0; bIdx < buckets.length; bIdx++) {
			accCounts.push([]);

			if(bIdx == 0) {
				for(var gIdx = 0; gIdx < groups.length; gIdx++) {
					accCounts[bIdx].push(groupCounts[gIdx]);
				}
			}
			else {
				for(var gIdx = 0; gIdx < groups.length; gIdx++) {
					if(gIdx < buckets[bIdx - 1].length) {
						accCounts[bIdx].push(accCounts[bIdx - 1][gIdx] - buckets[bIdx - 1][gIdx]);
					}
					else {
						accCounts[bIdx].push(accCounts[bIdx - 1][gIdx]);
					}
				}
			}
		}

		leftShift = Math.floor((drawW - (accCounts.length - 1) * setWidth) / 2);

		for(var g = 0; g < groups.length; g++) {
			var groupId = groups[g];
			var transp = 1;
			if(groupId <= 0) {
				transp *= 0.33;
			}
			c = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme"))), transp);
			ctx.fillStyle = c;

			for(var bIdx = 0; bIdx < accCounts.length - 1; bIdx++) {
				var count = accCounts[bIdx][g];

				if (useLogN) {
					he = drawH * Math.log(1 + count) / Math.log(1 + maxCount);
				}
				else {
					he = drawH * count / maxCount;
				}

				var x1 = leftMarg + leftShift + bIdx * setWidth + barW * g;
				var x2 = x1 + barW;
				var y1 = Math.floor(topMarg + drawH - he);
				var y2 = topMarg + drawH;
				var c = legacyDDSupLib.getGradientColorForGroup(groupId, x1,y2,x2,y1, transp, myCanvas, ctx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme")));

				ctx.fillStyle = c;
				ctx.fillRect(x1,y1,x2 - x1, y2 - y1);

				c = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme"))), transp);
				ctx.fillStyle = c;
				ctx.fillRect(x1,y1,x2-x1,1); // top
				ctx.fillRect(x1,y1,1,y2-y1); // left
				ctx.fillRect(x1,y2-1,x2-x1,1); // bottom
				ctx.fillRect(x2-1,y1,1,y2-y1); // right
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Value to Bucket Idx
	// This method returns the bucket idx value from a specific value parameter.
	//========================================================================================
	var val2bucketIdx = function(val, bucketLimits, useLogX) {
		for(var idx = 0; idx < bucketLimits.length - 1; idx++) {
			if(val >= bucketLimits[idx] && val <= bucketLimits[idx + 1]) {
				return idx;
			}
		}
		return -1; // should not happen
	};
	//========================================================================================


	//========================================================================================
	// Draw Step Curve
	// This method draws a step curve plot.
	//========================================================================================
	var drawStepcurve = function (W, H) {
		if(unique <= 0) {
			return;
		}

		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		useLogN = $scope.gimme('UseLogaritmicCounts');
		useLogX = $scope.gimme('UseLogaritmicX');

		var min = limits.min;
		var max = limits.max;
		var n = N;

		noofGroups = 0;
		seenGroups = {};
		groups = [];
		var groupCounts = [];

		setWidth = 1;
		leftShift = 0;
		sep = 0;

		var buckets = [];
		bucketLimits = [];
		if(useLogX) {
			for(var bucketIdx = 0; bucketIdx < drawW; bucketIdx++) {
				bucketLimits.push(min + (max - min) * Math.log(1 + bucketIdx / drawW));
			}
			bucketLimits.push(max);
		}
		else {
			for(var bucketIdx = 0; bucketIdx < drawW; bucketIdx++) {
				bucketLimits.push(min + (max - min) * bucketIdx / drawW);
			}
			bucketLimits.push(max);
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].selFun;
				var f = dataMappings[src].valFun;
				var fw = null;
				if(haveWeights) {
					fw = dataMappings[src].wFun;
				}

				var size = dataMappings[src].size;

				for(var i = 0; i < size; i++) {
					var groupId = fsel(i);
					if(!seenGroups.hasOwnProperty(groupId)) {
						seenGroups[groupId] = groups.length;
						groups.push(groupId);
						groupCounts.push(0);
					}

					var val = f(i);
					var w = 1;
					if(haveWeights) {
						w = fw(i);
					}

					var bIdx = val2bucketIdx(val, bucketLimits, useLogX);

					if(bIdx >= 0) {
						// add more buckets if necessary
						while(bIdx >= buckets.length) {
							buckets.push([]);
						}

						var groupIdIdx = seenGroups[groupId];
						// add more groups in this bucket, if necessary
						while(groupIdIdx >= buckets[bIdx].length) {
							buckets[bIdx].push(0);
						}

						buckets[bIdx][groupIdIdx] += w;
					}
				}
			}
		}

		noofGroups = groups.length;
		if(seenGroups.hasOwnProperty(0)) {
			noofGroups--;
		}
		if(noofGroups <= 0) {
			noofGroups = 1;
		}

		for(var bIdx = 0; bIdx < buckets.length; bIdx++) {
			for(var gIdx = 0; gIdx < buckets[bIdx].length; gIdx++) {
				var count = buckets[bIdx][gIdx];
				groupCounts[gIdx] += count;
			}
		}

		maxCount = 0;
		for(var gIdx = 0; gIdx < groupCounts.length; gIdx++) {
			maxCount = Math.max(groupCounts[gIdx], maxCount);
		}

		accCounts = [];
		for(var bIdx = 0; bIdx < buckets.length; bIdx++) {
			accCounts.push([]);

			if(bIdx == 0) {
				for(var gIdx = 0; gIdx < groups.length; gIdx++) {
					if(gIdx < buckets[bIdx].length) {
						accCounts[bIdx].push(groupCounts[gIdx] - buckets[bIdx][gIdx]);
					}
					else {
						accCounts[bIdx].push(groupCounts[gIdx]);
					}
				}
			}
			else {
				for(var gIdx = 0; gIdx < groups.length; gIdx++) {
					if(gIdx < buckets[bIdx].length) {
						accCounts[bIdx].push(accCounts[bIdx - 1][gIdx] - buckets[bIdx][gIdx]);
					}
					else {
						accCounts[bIdx].push(accCounts[bIdx - 1][gIdx]);
					}
				}
			}
		}

		for(var g = 0; g < groups.length; g++) {
			var groupId = groups[g];
			var transp = 1;
			if(groupId <= 0) {
				transp *= 0.33;
			}
			c = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme"))), transp);
			ctx.fillStyle = c;

			if (useLogN) {
				he = drawH * Math.log(1 + groupCounts[g]) / Math.log(1 + maxCount);
			}
			else {
				he = drawH * groupCounts[g] / maxCount;
			}

			var x1 = leftMarg;
			var x2 = x1;
			var y1 = Math.floor(topMarg + drawH - he);
			var y2 = y1;
			var lastCount = groupCounts[g];

			for(var bIdx = 0; bIdx < buckets.length; bIdx++) {
				if(g < buckets[bIdx].length) {
					var count = buckets[bIdx][g];

					if(count > 0) {
						// draw horizontal line from last position to here
						x2 = leftMarg + bIdx;
						ctx.fillRect(x1,y2,x2-x1,1);

						// draw a vertical line here for the drop we have
						lastCount -= count;
						if (useLogN) {
							he = drawH * Math.log(1 + lastCount) / Math.log(1 + maxCount);
						}
						else {
							he = drawH * lastCount / maxCount;
						}
						y2 = Math.floor(topMarg + drawH - he);

						if(y2 != y1) { // we may be rounding to the same pixel
							ctx.fillRect(x2,y1,1,y2-y1);
						}

						x1 = x2;
						y1 = y2;
					}
				}
			}
			// fill to edge
			x2 = leftMarg + drawW;
			if(x2 != x1) {
				ctx.fillRect(x1,y2,x2-x1,1);
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// New Selection Step Curve
	// This method redraws the step curve plot based on new selection
	//========================================================================================
	function newSelectionStepCurve(xPos1, xPos2, keepOld) {
		if(unique > 0) {
			var newSel = [limits.min, limits.max, leftMarg, leftMarg + drawW];

			if(xPos1 > leftMarg) {
				newSel[2] = xPos1;
				if(useLogX) {
					newSel[0] = Math.log(1 + (xPos1 - leftMarg) / drawW) * (limits.max - limits.min) + limits.min;
				}
				else {
					newSel[0] = (xPos1 - leftMarg) / drawW * (limits.max - limits.min) + limits.min;
				}
			}

			if(xPos2 < leftMarg + drawW) {
				newSel[3] = xPos2;
				if(useLogX) {
					newSel[1] = Math.log(1 + (xPos2 - leftMarg) / drawW) * (limits.max - limits.min) + limits.min;
				}
				else {
					newSel[1] = (xPos2 - leftMarg) / drawW * (limits.max - limits.min) + limits.min;
				}
			}

			if(!keepOld) {
				selections = [];
			}

			var overlap = false;
			for(var s = 0; s < selections.length; s++) {
				var sel = selections[s];
				if(sel[0] == newSel[0] && sel[1] == newSel[1] && sel[2] == newSel[2] && sel[3] == newSel[3]) {
					// $log.log(preDebugMsg + "Ignoring selection because it overlaps 100% with already existing selection");
					overlap = true;
					break;
				}
			}

			if(!overlap) {
				selections.push(newSel);
				drawSelections();
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// New Selection Histogram
	// This method redraws the histogram plot based on new selection
	//========================================================================================
	function newSelectionHistogram(xPos1, xPos2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(unique > 0) {
			var firstOverlap = true;
			var newSel = [limits.min, limits.max, leftMarg, leftMarg + drawW];
			var coversAll = true;
			for(var b = 0; b < bucketLimits.length - 1; b++) {
				var x1 = leftMarg + leftShift + b * setWidth;
				var x2 = x1 + setWidth - sep;

				if(xPos1 <= x2 && x1 <= xPos2) {
					// overlaps with selection
					if(firstOverlap) {
						firstOverlap = false;
						newSel[0] = bucketLimits[b];
						newSel[1] = bucketLimits[b+1];
						newSel[2] = x1;
						newSel[3] = x2;
					}
					else {
						newSel[0] = Math.min(bucketLimits[b], newSel[0]);
						newSel[1] = Math.max(bucketLimits[b+1], newSel[1]);

						if(newSel[2] > x1) {
							newSel[2] = x1;
						}
						if(newSel[3] < x2) {
							newSel[3] = x2;
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
					selections = [];
				}

				var overlap = false;
				for(var s = 0; s < selections.length; s++) {
					var sel = selections[s];
					if(sel[0] == newSel[0] && sel[1] == newSel[1] && sel[2] == newSel[2] && sel[3] == newSel[3]) {
						// $log.log(preDebugMsg + "Ignoring selection because it overlaps 100% with already existing selection");
						overlap = true;
						break;
					}
				}

				if(!overlap) {
					selections.push(newSel);
					drawSelections();
					updateLocalSelections(false);
					saveSelectionsInSlot();
				}
			}
		}
	}
	//========================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
