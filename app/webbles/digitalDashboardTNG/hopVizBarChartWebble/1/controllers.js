//======================================================================================================================
// Controllers for hopVizBarChartWebble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================
wblwrld3App.controller('hopVizBarChartWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        // BackHolder: ['width', 'height']
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Bar Chart";

    var myInstanceId = -1;

    var dataMappings = []; 
    var parsingDataNow = false;
    
    var grouping = true;

    var nullValueStringRep = "[No Value]";
    var nullLeft = -1;
    var nullRight = -1;
    
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

    var haveWeights = false;

    var dataType = "number";
    var dateFormat = "";

    var limits = {min:0, max:0};
    var unique = 0;
    var NULLs = 0;

    var selections = []; // the graphical ones

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

    var drawH = 1;
    var drawW = 1;

    var useLog = false;
    var lowerCaseStrings = false;
    var allTextSelected = false;
    var someStringsDidNotFit = false;

    var histogram = [];
    var highscore = 0;
    var activeGroups = [];
    var groupIdxMap = {};

    var internalSelectionsInternallySetTo = {};

    var dropW = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'weights', 'type':['number']}, "label":"Weights", "rotate":true};
    var dropX = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'data', 'type':['number','date','string']}, "label":"Data", "rotate":false};
    var allDropZones = [dropW, dropX];

    var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneW = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneX, dragZoneW];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";

    //=== EVENT HANDLERS ================================================================

    $scope.fixDraggable = function () {
	$scope.theView.find('.dragSrc').draggable({
	    helper: function() {		
		return $("<div id=\"" + $scope.dragNdropID + "\">" + $scope.dragNdropRepr + "</div>");
	    },
	    cursorAt: {top: 5, left: 5}
	});
    };

    $scope.fixDroppable = function () {
    	// $('.canvasStuffForDigitalDashboardBarChart').droppable({ 
    	$scope.theView.find('.canvasStuffForHopVizBarChartWebble').droppable({ 
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
			
    			if(xpos <= dropZone.right
    			   && xpos >= dropZone.left
    			   && ypos >= dropZone.top
    			   && ypos < dropZone.bottom) {
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

    $scope.clearData = function() {
	var oldMappings = dataMappings;

    	dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    	dragZoneW = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};

	resetVars();
	dataMappings = [];

	updateGraphics();

	for(var src = 0; src < oldMappings.length; src++) {
	    if(oldMappings[src].hasOwnProperty("newSelections")
	       && oldMappings[src].newSelections !== null) {
		oldMappings[src].newSelections(myInstanceId, null, false, true);
	    }

	    if(oldMappings[src].hasOwnProperty("listen")
	       && oldMappings[src].listen !== null) {
		oldMappings[src].listen(myInstanceId, false, null, null, []);
	    }
	    
	    for(var i = 0; i < oldMappings[src].map.length; i++) {
		if(oldMappings[src].map[i].hasOwnProperty("listen")
		   && oldMappings[src].map[i].listen !== null) {
		    oldMappings[src].map[i].listen(myInstanceId, false, null, null, []);
		}

		if(oldMappings[src].map[i].hasOwnProperty("newSelections")
		   && oldMappings[src].map[i].newSelections !== null) {
		    oldMappings[src].map[i].newSelections(myInstanceId, null, false, true);
		}
	    }
	}
    }

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

    function dataDropped(dataSourceInfoStr, targetField) {
    	// debugLog("data dropped");
	parsingDataNow = true;
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
    			} else {
    			    // inform previous source that we are no longer using the data
    			    if(dataMappings[mapSrcIdx].hasOwnProperty("newSelections")
    			       && dataMappings[mapSrcIdx].newSelections !== null) {
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
    				// debugLog("Last one, stop listening to " + dataMappings[mapSrcIdx].map[i].name);
				
    				if(dataMappings[mapSrcIdx].map[i].hasOwnProperty("listen")
    				   && dataMappings[mapSrcIdx].map[i].listen !== null) {
    				    dataMappings[mapSrcIdx].map[i].listen(myInstanceId, false, null, null, []);
    				}
    			    }

    			    // replace old mapping
    			    dataMappings[mapSrcIdx].map[i].srcIdx = dataSourceInfo.fieldIdx;
    			    dataMappings[mapSrcIdx].map[i].drag = dataSourceInfoStr;
    			    dataMappings[mapSrcIdx].clean = false;
    			    somethingChanged = true;
    			}
    			found = true;
    			break;
    		    }
		}

    		if(!found) {
    		    dataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':targetField.name, 'listen':null, 'drag':dataSourceInfoStr}); // we need to rename the "New Coordinate" field 
    		    dataMappings[mapSrcIdx].clean = false;
    		    somethingChanged = true;
    		}

    		if(targetField.name == "weights") {
    		    dragZoneW.ID = JSON.stringify(dataSourceInfo);
    		    dragZoneW.name = dataSourceInfo.fieldName;
    		} 
    		if(targetField.name == "data") {
    		    dragZoneX.ID = JSON.stringify(dataSourceInfo);
    		    dragZoneX.name = dataSourceInfo.fieldName;
    		}

    		if(somethingChanged) {
    		    checkMappingsAndParseData();
    		}

    	    } else {
    		debugLog(dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
    	    }
    	} catch(e) {
    	    // not proper JSON, probably something random was dropped on us so let's ignore this event
    	}
	parsingDataNow = false;
    }

    function checkMappingsAndParseData() {
    	// debugLog("checkMappingsAndParseData");

    	parsingDataNow = true;

    	resetVars();

    	var somethingChanged = false;

    	var atLeastOneActive = false;

    	for(var src = 0; src < dataMappings.length; src++) {
    	    var typeError = false;

    	    var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    	    var ls = w.scope().gimme(dataMappings[src].slotName);

    	    var haveData = false;
    	    var haveW = false;
	    
    	    for(var f = 0; f < dataMappings[src].map.length; f++) {
		var fieldInfo = null;
		if(dataMappings[src].map[f].srcIdx < ls.length) {
    		    fieldInfo = ls[dataMappings[src].map[f].srcIdx];
		}

    		if(dataMappings[src].map[f].name == "data") {
    		    if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropX.forMapping.type)) {
    			typeError = true;
    			dataMappings[src].map[f].active = false;
    		    } else {
    			dataMappings[src].map[f].listen = fieldInfo.listen;
    			dataMappings[src].map[f].active = true;
    			haveData = true;
    			dataName = shortenName(fieldInfo.name);
    			// dragZoneX.name = dataName;
    		    }
    		}

    		if(dataMappings[src].map[f].name == "weights") {
    		    if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropW.forMapping.type)) {
    			typeError = true;
    			dataMappings[src].map[f].active = false;
    		    } else {
    			dataMappings[src].map[f].listen = fieldInfo.listen;
    			dataMappings[src].map[f].active = true;
    			haveW = true;
    			weightName = shortenName(fieldInfo.name);
    			dragZoneW.name = weightName;
    		    }
    		}
    	    }
	    
    	    var canActivate = false;
    	    if(haveData) {
    		canActivate = true;
    		atLeastOneActive = true;
    	    }

    	    if(canActivate && haveW) {
    		haveWeights = true;
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
    		    // debugLog("Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
    		    if(dataMappings[src].map[i].active
    		       && dataMappings[src].map[i].hasOwnProperty("listen") 
    		       && dataMappings[src].map[i].listen !== null) {
    			dataMappings[src].map[i].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
    		    } else {
    			// debugLog("Stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
    			if(dataMappings[src].map[i].hasOwnProperty("listen") 
    			   && dataMappings[src].map[i].listen !== null) {
    			    dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
    			}
    		    }
    		}
    	    } else {
    		// stop listening to updates

    		for(var i = 0; i < dataMappings[src].map.length; i++) {
    		    dataMappings[src].map[i].active = false;
    		    
    		    if(dataMappings[src].map[i].hasOwnProperty("listen") 
    		       && dataMappings[src].map[i].listen !== null) {
    			// debugLog("Not active, stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
    			dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
    		    }
    		}
    	    }

    	    dataMappings[src].active = canActivate;
    	}

    	if(somethingChanged || atLeastOneActive) {
    	    parseData();
    	} else {
    	    parsingDataNow = false;
    	}
    }

    var lastSeenDataSeqNo = -1;
    function redrawOnNewData(seqNo) {
    	if(lastSeenDataSeqNo != seqNo) {
    	    lastSeenDataSeqNo = seqNo;
    	    checkMappingsAndParseData();
    	}
    }
    
    var lastSeenSelectionSeqNo = -1;
    function redrawOnNewSelections(seqNo) {
    	if(lastSeenSelectionSeqNo != seqNo) {
    	    lastSeenSelectionSeqNo = seqNo;
    	    updateGraphics();
    	}
    }

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
    	if($scope.doDebugLogging) {
    	    $log.log("hopVizBarChartWebble: " + message);
    	}
    };

    function getTextWidth(text, font) {
    	if(ctx !== null && ctx !== undefined) {
    	    ctx.font = font;
    	    var metrics = ctx.measureText(text);
    	    return metrics.width;
    	}
    	return 0;
    };

    function getTextWidthCurrentFont(text) {
    	if(ctx !== null && ctx !== undefined) {
    	    var metrics = ctx.measureText(text);
    	    return metrics.width;
    	}
    	return 0;
    };

    function number2text(v, span) {
    	if(parseInt(Number(v)) == v) {
    	    return v.toString();
    	}

    	if(Math.abs(v) < 1) {
    	    return v.toPrecision(3);
    	}
    	if(span > 10) {
    	    return Math.round(v);
    	}
    	if(span > 5 && Math.abs(v) < 100) {
    	    return v.toPrecision(2);
    	}
    	return v.toPrecision(3);
    };

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function date2text(v) {
    	var d = new Date(parseInt(v));

    	switch(dateFormat) {
    	case 'full':
    	    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    	    break;
    	case 'onlyYear':
    	    return d.getFullYear();
    	    break;
    	case 'yearMonth':
    	    return d.getFullYear() + " " + months[d.getMonth()];
    	    break;
    	case 'monthDay':
    	    return months[d.getMonth()] + " " + d.getDate();
    	    break;
    	case 'day':
    	    return d.getDate();
    	    break;
    	case 'dayTime':
    	    return d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    	    break;
    	case 'time':
    	    return d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    	    break;
    	default:
    	    return d.toISOString();
    	}
    }

    function shortenName(n) {
    	var ss = n.split(":");
    	return ss[ss.length - 1];
    }

    function saveSelectionsInSlot() {
    	// debugLog("saveSelectionsInSlot");

    	var result = {};
    	result.selections = [];
    	for(var sel = 0; sel < selections.length; sel++) {
    	    if(selections[sel].length < 4 || !selections[sel][4]) {
    	    	result.selections.push({'min':selections[sel][0], 'max':selections[sel][1], 'includeNulls':false});
    	    } else {
    	    	result.selections.push({'min':selections[sel][0], 'max':selections[sel][1], 'includeNulls':true});
    	    }
    	}

    	internalSelectionsInternallySetTo = JSON.stringify(result);
    	$scope.set('InternalSelections', internalSelectionsInternallySetTo);
    }

    function setSelectionsFromSlotValue() {
    	// debugLog("setSelectionsFromSlotValue");

	// This does not work correctly for string type data when the
	// selection is larger than the possible number of bars in the
	// current display. Currently a large selection will be
	// replaces with a selection of only the first (leftmost) bar,
	// not all the bars that fit. TODO: fix this?
	
    	var slotSelections = $scope.gimme("InternalSelections");
	if(slotSelections == internalSelectionsInternallySetTo) {
	    return; // nothing to do
	} 

    	if(typeof slotSelections === 'string') {
    	    slotSelections = JSON.parse(slotSelections);
    	}
	
    	if(slotSelections.hasOwnProperty("selections")) {
    	    var newSelections = [];
	    
    	    if(unique > 0) {
    		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
    		    var newSel = slotSelections.selections[sel];
		    
    		    var includeNulls = false;
    		    if(newSel.hasOwnProperty("includeNulls") 
    		       && newSel.includeNulls) {
    			includeNulls = true;
    		    }
		    
    		    var val1 = newSel.min;
    		    var val2 = newSel.max;

    		    if(val1 == null && val2 == null && includeNulls) {
			// only the null group was selected
			newSelections.push([null, null, null, null, true]);
    		    } else {
			if(dataType == 'string') {

			    var add = false;
    			    var firstOverlap = true;
    			    var v1 = val1;
    			    var v2 = val2;
    			    var v3 = 0;
    			    var v4 = drawW;
    			    var v5 = includeNulls;
			    
			    for(var i = 0; i < histogram.length; i++) {
				if(histogram[i][0] == nullValueStringRep) {
				    if(includeNulls) {
					add = true;
				    }
				} else {
				    if(val1 == histogram[i][4] 
				       || val1 == histogram[i][5] 
				       || val2 == histogram[i][4]
				       || val2 == histogram[i][5]) {
					// histogram bar overlaps selection
					// we may need to grow the selection, if bars are partially overlapped
					
					add = true;

					if(firstOverlap) {
					    firstOverlap = false;
					    v3 = histogram[i][2];
					    v4 = histogram[i][3];

					    v1 = histogram[i][0];
					    v2 = histogram[i][0];
					} else {
					    if(v3 > histogram[2]) {
						v1 = histogram[i][0];
					    }
					    if(v4 < histogram[3]) {
						v2 = histogram[i][0];
					    }

					    v3 = Math.min(v3, histogram[i][2]);
					    v4 = Math.max(v4, histogram[i][3]);
					}
				    }
				}
			    }

			    if(add) {
				if(firstOverlap) {
				    // we overlapped only the null group
				    newSelections.push([ null, null, null, null, true]);
				} else {
				    newSelections.push([v1,v2, v3,v4, v5]);
				}
			    }

			} else { // not string

    			    if(val2 < limits.min 
    			       || val1 > limits.max) {
    				// completely outside, do not add
    				continue;
    			    }

    			    val1 = Math.max(limits.min, val1);
    			    val2 = Math.min(limits.max, val2);

			    var add = false;
    			    var firstOverlap = true;
    			    var v1 = val1;
    			    var v2 = val2;
    			    var v3 = 0;
    			    var v4 = drawW;
    			    var v5 = includeNulls;
			    
			    for(var i = 0; i < histogram.length; i++) {
				if(histogram[i][0] == nullValueStringRep) {
				    if(includeNulls) {
					add = true;
				    }
				} else {
				    // if((val1 < histogram[i][5] && histogram[i][4] < val2)
				    //    || (val1 == val2 && (val1 == histogram[i][4] || val2 == histogram[i][5]))
				    //    || (histogram[i][4] == histogram[i][5] && (val1 == histogram[i][4] || val2 == histogram[i][5]))
				    //    ) {
				    if((val1 <= histogram[i][5] && histogram[i][4] <= val2)
				      ) {
					// histogram bar overlaps selection
					// we may need to grow the selection, if bars are partially overlapped
					v1 = Math.min(v1, histogram[i][4]);
					v2 = Math.max(v2, histogram[i][5]);
					
					add = true;

					if(firstOverlap) {
					    firstOverlap = false;
					    v3 = histogram[i][2];
					    v4 = histogram[i][3];
					} else {
					    v3 = Math.min(v3, histogram[i][2]);
					    v4 = Math.max(v4, histogram[i][3]);
					}
				    }
				}
			    }

			    if(add) {
				if(firstOverlap) {
				    // we overlapped only the null group
				    newSelections.push([ null, null, null, null, true]);
				} else {
				    newSelections.push([v1,v2, v3,v4, v5]);
				}
			    }
			}
    		    }
		}

		var remove = [];
		for(var s1 = 0; s1 < newSelections.length - 1; s1++) {
		    for(var s2 = s1+1; s2 < newSelections.length; s2++) {
			if(newSelections[s1].length == newSelections[s2].length
			   && newSelections[s1][0] == newSelections[s2][0]
			   && newSelections[s1][1] == newSelections[s2][1]
			   && newSelections[s1][2] == newSelections[s2][2]
			   && newSelections[s1][3] == newSelections[s2][3]
			   && (newSelections[s1].length <= 4 || newSelections[s1][4] == newSelections[s2][4])) {
			    // duplicate
			    remove.push(s2);
			}
		    }
		}
		for(var s2 = remove.length - 1; s2 >= 0; s2--) {
		    var s1 = remove[s2];
		    
		    newSelections.splice(s1,1);
		}

    		// debugLog("new selections: " + JSON.stringify(newSelections));
    		if(newSelections.length > 0) {

		    if(!checkIfSelectionsAreTheSame(newSelections, selections)) {
    			selections = newSelections;
    			updateLocalSelections(false);
    			drawSelections();
		    } else {
			return;
		    }
    		} else {
		    // Found nothing that we can use, keep old selections

		}
    	    } else { // no data
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

    function checkIfSelectionsAreTheSame(newSelections, selections) {
	// debugLog("checkIfSelectionsAreTheSame");
	
	if(selections.length != newSelections.length) {
	    return false;
	}

    	selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);});
    	newSelections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);});

	for(var s = 0; s < selections.length; s++) {
	    if(selections[s][0] != newSelections[s][0]
	       || selections[s][1] != newSelections[s][1]) {
		return false;
	    }

	    if(selections[s].length > 4 && selections[s][4]
	       && (newSelections[s].length <= 4 || !newSelections[s][4])) {
		return false;
	    }

	    if(newSelections[s].length > 4 && newSelections[s][4]
	       && (selections[s].length <= 4 || !selections[s][4])) {
		return false;
	    }
	}

	// debugLog("checkIfSelectionsAreTheSame --> true");
	return true;
    }

    function checkSelectionsAfterNewData() {
    	// debugLog("checkSelectionsAfterNewData");

    	var newSelections = [];

    	for(var sel = 0; sel < selections.length; sel++) {
    	    var newSel = selections[sel];
    	    var val1 = newSel[0];
    	    var val2 = newSel[1];

    	    if(val1 == null && val2 == null) {
		newSel = [null, null, null, null, true];
		newSelections.push(newSel);
    	    } else {

		var includeNulls = false;
		if(newSel.length > 4 && newSel[4]) {
		    includeNulls = true;
		}

		if(dataType == 'string') {

		    var add = false;
    		    var firstOverlap = true;
    		    var v1 = val1;
    		    var v2 = val2;
    		    var v3 = 0;
    		    var v4 = drawW;
    		    var v5 = includeNulls;
		    
		    for(var i = 0; i < histogram.length; i++) {
			if(histogram[i][0] == nullValueStringRep) {
			    if(includeNulls) {
				add = true;
			    }
			} else {
			    if(val1 == histogram[i][4] 
			       || val1 == histogram[i][5] 
			       || val2 == histogram[i][4]
			       || val2 == histogram[i][5]) {
				// histogram bar overlaps selection
				// we may need to grow the selection, if bars are partially overlapped
				
				add = true;

				if(firstOverlap) {
				    firstOverlap = false;
				    v3 = histogram[i][2];
				    v4 = histogram[i][3];

				    v1 = histogram[i][0];
				    v2 = histogram[i][0];
				} else {
				    if(v3 > histogram[2]) {
					v1 = histogram[i][0];
				    }
				    if(v4 < histogram[3]) {
					v2 = histogram[i][0];
				    }

				    v3 = Math.min(v3, histogram[i][2]);
				    v4 = Math.max(v4, histogram[i][3]);
				}
			    }
			}
		    }

		    if(add) {
			if(firstOverlap) {
			    // we overlapped only the null group
			    newSelections.push([ null, null, null, null, true]);
			} else {
			    newSelections.push([v1,v2, v3,v4, v5]);
			}
		    }

		    
		} else { // not string

    		    if(val1 <= limits.min && val2 >= limits.max) {
    			// covers everything
			if(newSel.length > 4) {
			    newSel = [limits.min, limits.max, 0, drawW, newSel[4]];
			} else {
			    newSel = [limits.min, limits.max, 0, drawW];
			}
			
			newSelections.push(newSel);

    		    } else if(val2 < limits.min 
    			      || val1 > limits.max) {
    			// completely outside
    			continue;
    		    } else {
			
    			val1 = Math.max(limits.min, val1);
    			val2 = Math.min(limits.max, val2);

    			val1 = Math.max(limits.min, val1);
    			val2 = Math.min(limits.max, val2);

			var add = false;
    			var firstOverlap = true;
    			var v1 = val1;
    			var v2 = val2;
    			var v3 = 0;
    			var v4 = drawW;
    			var v5 = includeNulls;
			
			for(var i = 0; i < histogram.length; i++) {
			    if(histogram[i][0] == nullValueStringRep) {
				if(includeNulls) {
				    add = true;
				}
			    } else {
    				// if((val1 < histogram[i][5] && histogram[i][4] < val2)
				//    || (val1 == val2 && (val1 == histogram[i][4] || val2 == histogram[i][5]))
				//    || (histogram[i][4] == histogram[i][5] && (val1 == histogram[i][4] || val2 == histogram[i][5]))
				//   ) {
    				if((val1 <= histogram[i][5] && histogram[i][4] <= val2)
				  ) {
				    // histogram bar overlaps selection
				    // we may need to grow the selection, if bars are partially overlapped
				    v1 = Math.min(v1, histogram[i][4]);
				    v2 = Math.max(v2, histogram[i][5]);
				    
				    add = true;

				    if(firstOverlap) {
					firstOverlap = false;
					v3 = histogram[i][2];
					v4 = histogram[i][3];
				    } else {
					v3 = Math.min(v3, histogram[i][2]);
					v4 = Math.max(v4, histogram[i][3]);
				    }
				}
			    }
			}

			if(add) {
			    if(firstOverlap) {
				// we overlapped only the null group
				newSelections.push([ null, null, null, null, true]);
			    } else {
				newSelections.push([v1,v2, v3,v4, v5]);
			    }
			}
    		    }
    		}
    	    }
    	}

	var remove = [];
	for(var s1 = 0; s1 < newSelections.length - 1; s1++) {
	    for(var s2 = s1+1; s2 < newSelections.length; s2++) {
		if(newSelections[s1].length == newSelections[s2].length
		   && newSelections[s1][0] == newSelections[s2][0]
		   && newSelections[s1][1] == newSelections[s2][1]
		   && newSelections[s1][2] == newSelections[s2][2]
		   && newSelections[s1][3] == newSelections[s2][3]
		   && (newSelections[s1].length <= 4 || newSelections[s1][4] == newSelections[s2][4])) {
		    // duplicate
		    remove.push(s2);
		}
	    }
	}
	for(var s2 = remove.length - 1; s2 >= 0; s2--) {
	    var s1 = remove[s2];
	    
	    newSelections.splice(s1,1);
	}

    	if(newSelections.length > 0) {
    	    selections = newSelections;
    	    drawSelections();
    	    return false;
    	}
    	return true;
    }

    function updateLocalSelections(selectAll) {
    	// debugLog("updateLocalSelections");
    	var dirty = false;
	
    	var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
    	if(newGrouping != grouping) {
    	    grouping = newGrouping;
    	    dirty = true;
    	}

    	selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.

	if(!selectAll) {
	    if(dataType == 'string') {
		if(allTextSelected) {
		    selectAll = true;
		}
	    } else {
		if(selections.length == 1
		   && selections[0] <= limits.min
		   && selections[1] >= limits.max) {
		    selectAll = true;
		}
	    }
	}
			
    	for(var src = 0; src < dataMappings.length; src++) { 
    	    if(dataMappings[src].active) {
    		var srcsrc = src;
    		dataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAll);
    	    } else {
    		dataMappings[src].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)

    		for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
    		    if(dataMappings[src].map[ff].hasOwnProperty("listen") && dataMappings[src].map[ff].listen !== null) {
    			// debugLog("Not active (selection), stop listening to " + dataMappings[src].map[ff].name + " " + dataMappings[src].map[ff].srcIdx);
    			dataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
    		    }
    		}
    	    }
    	}
    }

    function mySelectionStatus(src, idx) {
    	if(parsingDataNow) {
    	    return 1;
    	}

    	var groupId = 1;
    	if(dataMappings[src].active) {
    	    groupId = 0;
	    
    	    if(dataType == 'string') {
    		if(allTextSelected) {
    		    groupId = 1;
    		} else {
    		    var s = dataMappings[src].funV(idx);
    		    if(lowerCaseStrings && s !== null) {
    			s = s.toLowerCase();
    		    }

    		    if(s === null) {
    			s = nullValueStringRep;
    		    }

    		    for(var i = 0; i < histogram.length; i++) {
    			if(histogram[i][0] == s) {
    			    for(var span = 0; span < selections.length; span++) {
    				if(selections[span][0] <= i
    				   && i <= selections[span][1]) {
    				    groupId = span + 1;
    				    break;
    				}
    			    }
    			}
    		    }
    		}
    	    } else {
    		var d = dataMappings[src].funV(idx);
    		if(d === null) {
    		    for(var span = 0; span < selections.length; span++) {
    			if(selections[span].length > 4 && selections[span][4]) {
    			    groupId = span + 1;
    			    break;
    			}
    		    }
    		} else {
    		    for(var span = 0; span < selections.length; span++) {
    			if(selections[span][0] !== null
    			   && selections[span][1] !== null
			   && selections[span][0] <= d
			   && d <= selections[span][1]
			  ) {
    			    groupId = span + 1;
    			    break;
    			}
    		    }
    		}
    	    }
    	}

	if(groupId > 1 
	   && !grouping) {
	    groupId = 1;
	}

    	return groupId;
    }


    function resetVars() {
    	dataType = "number";
	
    	dataName = null;
    	weightName = null;
	nullLeft = -1;
	nullRight = -1;

    	limits = {max:0, min:0};
    	unique = 0;
    	NULLs = 0;
    }

    function includes(ls, elem) {
    	for(var i = 0; i < ls.length; i++) {
    	    if(ls[i] == elem) {
    		return true;
    	    }
    	}
    	return false;
    }

    function parseData() {
    	// debugLog("parseData");

    	parsingDataNow = true;

    	var dataIsCorrupt = false;

    	var first = true;

	// ------------------------------------------------------------------------

    	for(var src = 0; src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {

    		var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    		var ls = w.scope().gimme(dataMappings[src].slotName);

    		var sizeD = 0;
    		var sizeW = 0;
		
    		for(var f = 0; f < dataMappings[src].map.length; f++) {
    		    var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    		    dataMappings[src].map[f].listen = fieldInfo.listen;
		    
    		    if(haveWeights && dataMappings[src].map[f].name == "weights") {
    			sizeW = fieldInfo.size;
    			dataMappings[src].funW = fieldInfo.val;
    		    }

    		    if(dataMappings[src].map[f].name == "data") {
    			sizeD = fieldInfo.size;
    			dataMappings[src].funV = fieldInfo.val;
    			dataMappings[src].funSel = fieldInfo.sel;
    			dataMappings[src].newSelections = fieldInfo.newSel;
    			dataMappings[src].size = fieldInfo.size;

    			if(first) {
    			    first = false;
    			    if(includes(fieldInfo.type, "number")) {
    				dataType = 'number';
    			    } else if(includes(fieldInfo.type, "date")) {
    				dataType = 'date';
    			    } else {
    				dataType = 'string';
    			    }
    			} else {
    			    if(includes(fieldInfo.type, "number")) {
    				if(dataType != 'number') {
    				    dataIsCorrupt = true;
    				}
    			    } else if(includes(fieldInfo.type, "date")) {
    				if(dataType != 'date') {
    				    dataIsCorrupt = true;
    				}
    			    } else {
    				if(dataType != 'string') {
    				    dataIsCorrupt = true;
    				}
    			    }
    			}
    		    }
    		}

    		if(haveWeights && sizeW != sizeD) {
    		    haveWeights = false;
    		}
    	    }
    	}
	

	// ------------------------------------------------------------------------

    	for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
    		var fx = dataMappings[src].funV;
    		if(haveWeights) {
    		    var fw = dataMappings[src].funW;
    		}
		
    		var firstNonNullData = true;
		
    		for(var i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
    		    var val = fx(i);


		    // ----------- 
		    // ugly hack for some weird data in the Himawari data sets, fix later
		    if(dataType == 'number' && val < -999999999) {
			val = 0;
		    }
		    // ----------- 

		    
    		    if(val !== null) {
			unique++;

    			var w = 1;
    			if(haveWeights) {
    			    w = fw(i);
			    
    			    if(w === null) {
    				dataIsCorrupt = true;
    				w = 1;
    			    }
    			}

    			if(firstNonNullData) {
    			    firstNonNullData = false;
    			    if(dataType != 'string') {
    				minVal = val;
    				maxVal = val;
    			    } else {
    				minVal = 0;
    				maxVal = 1;
    			    }
    			} else {
    			    if(dataType != 'string') {
    				if(val < minVal) {
    				    minVal = val;
    				}
    				if(val > maxVal) {
    				    maxVal = val;
    				}
    			    }
    			}
    		    } else {
    			NULLs += 1;
    		    }
    		}
		
    		if(firstNonNullData) {
    		    dataIsCorrupt = true; // only null values
    		} 
    	    }
    	}

    	if(!dataIsCorrupt) {
    	    limits = {};
    	    limits.min = minVal;
    	    limits.max = maxVal;
    	    if(dataType == 'date') {
    		if(limits.max == limits.min) {
    		    dateFormat = 'full';
    		} else {
    		    var d1 = new Date(limits.min);
    		    var d2 = new Date(limits.max);
    		    if(d2.getFullYear() - d1.getFullYear() > 10) {
    			dateFormat = 'onlyYear';
    		    } else if(d2.getFullYear() - d1.getFullYear() > 1) {
    			dateFormat = 'yearMonth';
    		    } else {
    			var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
    			if(d2.getMonth() != d1.getMonth()) {
    			    dateFormat = 'monthDay';
    			} else if(days > 5) {
    			    dateFormat = 'day';
    			} else if(days > 1) {
    			    dateFormat = 'dayTime';
    			} else {
    			    dateFormat = 'time';
    			}
    		    }
    		}
    	    }
    	}
	
    	if(dataIsCorrupt) {
    	    debugLog("data is corrupt");
    	    resetVars();
    	}
	
    	if(unique > 0) {
    	    var giveUp = checkSelectionsAfterNewData();
    	    if(giveUp) {
    		$scope.selectAll();
    	    } else {
    		updateLocalSelections(false);
    		saveSelectionsInSlot();
    	    }
    	} else {
    	    updateLocalSelections(false);

    	    if(selectionCtx === null) {
    		selectionCtx = selectionCanvas.getContext("2d");
    		var W = selectionCanvas.width;
    		var H = selectionCanvas.height;
    		selectionCtx.clearRect(0,0, W,H);
    	    }
    	}
	
    	parsingDataNow = false;
    	updateGraphics();
    }

    function updateGraphics() {
    	// debugLog("updateGraphics()");

    	if(parsingDataNow) {
    	    return;
    	}

    	if(myCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    	    if(myCanvasElement.length > 0) {
    		myCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
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

    	// debugLog("Clear the canvas");
    	ctx.clearRect(0,0, W,H);

    	var colors = $scope.gimme("ColorScheme");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}

    	if(colors.hasOwnProperty("skin") && colors.skin.hasOwnProperty("text")) {
    	    textColor = colors.skin.text;
    	} else {
    	    textColor = "#000000";
    	}

    	drawBackground(W, H);
    	drawBars(W, H);
    	drawAxes(W, H);

    	updateSelectionRectangles();

    	updateDropZones(textColor, 0.3, false);
    }

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
    		    } else {
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
    };

    function updateDropZones(col, alpha, hover) {
    	// debugLog("update the data drop zone locations");

    	if(dropCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no drop canvas to draw on!");
    		return;
    	    }
    	}

    	if(dropCtx === null) {
    	    dropCtx = dropCanvas.getContext("2d");
    	}
	
    	if(!dropCtx) {
    	    debugLog("no canvas to draw drop zones on");
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
    			var tw = getTextWidth(str, fnt);
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

    function drawAxes(W, H) {
    	// debugLog("drawAxes");

    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	ctx.fillStyle = textColor;
    	ctx.font = fontSize + "px Arial";

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
    		xw = getTextWidthCurrentFont(dataName);
    		ww = getTextWidthCurrentFont(weightName);
    	    } else {
    		str = "Weighted by " + weightName;
    		ww = getTextWidthCurrentFont(weightName);
    	    }
    	} else {
    	    if(dataName !== null) {
    		str = dataName;
    		xw = getTextWidthCurrentFont(dataName);
    	    }
    	}

    	if(str != "") {
    	    var w = getTextWidthCurrentFont(str);
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
    };


    function drawBars(W, H) {	
    	if(unique <= 0) {
    	    return;
    	}

	// debugLog("drawBars");

    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	var minBW = parseInt($scope.gimme('MinimumBarWidth'));
    	var sep = parseInt($scope.gimme('BarSeparatorWidth'));
    	useLog = $scope.gimme('UseLogaritmicCounts');
	
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

    	var seenNulls = [];

    	if(dataType == 'string') {
    	    var buckets = {};
    	} else {
	    if(unique < drawW) {
		buckets = {};
		var bucketsMinMax = [];
	    } else {
    		var buckets = [];
		var bucketsMinMax = [];
    		for(var i = 0; i < drawW; i++) {
    		    buckets.push([]);
    		    bucketsMinMax.push([]);
    		}
	    }
    	}

    	var groups = {};

    	for(var src = 0; src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
    		var fx = dataMappings[src].funV;
    		var fsel = dataMappings[src].funSel;

    		if(haveWeights) {
    		    var fw = dataMappings[src].funW;
    		}
		
    		for(var i = 0; i < dataMappings[src].size; i++) {

    		    var d = fx(i);
    		    var w = 1;
    		    if(haveWeights) {
    			w = fw(i);
    		    }
    		    var groupId = fsel(i);
    		    groups[groupId] = true;

    		    if(d === null) {

    			var ls = seenNulls;
    			while(ls.length <= groupId) {
    			    ls.push(0);
    			}
    			ls[groupId] += w;

    		    } else {

    			if(lowerCaseStrings && dataType == 'string' && d !== null) {
    			    d = d.toString().toLowerCase();
    			}

    			if(dataType == 'date' && d !== null && d instanceof Date) {
    			    d = d.getTime();
    			}

			// ----------- 
			// ugly hack for some weird data in the Himawari data sets, fix later
			if(dataType == 'number' && d < -999999999) {
			    d = 0;
			}
			// ----------- 

    			if(dataType == 'string'
			   || unique < drawW) {
			    
    			    if (buckets.hasOwnProperty(d))
    			    {
    				var ls = buckets[d];
    				while(ls.length <= groupId) {
    				    ls.push(0);
    				}
    				ls[groupId] += w;
    			    }
    			    else
    			    {
    				var ls = [];
    				while(ls.length <= groupId) {
    				    ls.push(0);
    				}
    				ls[groupId] = w;
    				buckets[d] = ls;
    			    }
    			} else {
    			    var bucketIdx = Math.floor((d - limits.min) / (limits.max - limits.min) * (drawW - 1));
    			    var ls = buckets[bucketIdx];
    			    while(ls.length <= groupId) {
    				ls.push(0);
    			    }
    			    ls[groupId] += w;

			    if(bucketsMinMax[bucketIdx].length <= 0) {
				bucketsMinMax[bucketIdx] = [d, d];
			    } else {
				bucketsMinMax[bucketIdx][0] = Math.min(d, bucketsMinMax[bucketIdx][0]);
				bucketsMinMax[bucketIdx][1] = Math.max(d, bucketsMinMax[bucketIdx][1]);
			    }
    			}
    		    }
    		}
    	    }
    	}

	var maxGroup = 0;
    	activeGroups = [];
    	for(var groupId in groups) {
    	    if(groups.hasOwnProperty(groupId)) {
    		activeGroups.push(groupId);
		
		maxGroup = Math.max(maxGroup, groupId);
    	    }
    	}
    	activeGroups.sort();

    	var noofGroups = activeGroups.length;

    	groupIdxMap = {};
    	for(var group = 0; group < activeGroups.length; group++) {
    	    groupIdxMap[activeGroups[group]] = group;
    	}

    	var colSep = sep;
	
        var maxNoofBuckets = Math.floor(Math.floor(drawW / noofGroups) / minBW + colSep);
        if (maxNoofBuckets < 1)
        {
            maxNoofBuckets = 1;
        }

    	var newHistogram = [];
    	highscore = 0;

    	if(dataType == 'string') {
            var sortedKeys = [];
	    
            var looksDiscrete = true;
            for (var k in buckets)
            {
    		var tot = 0;
    		for(var groupId = 0; groupId < buckets[k].length; groupId++) {
    		    tot += buckets[k][groupId];
    		}
    		sortedKeys.push([tot, k]);
            }

            sortedKeys.sort(function(a,b){ if(b[0] != a[0]) return b[0] - a[0]; if(b[1] < a[1]) return 1; return -1;});

    	    if(sortedKeys.length > maxNoofBuckets) {
    		sortedKeys.splice(maxNoofBuckets, sortedKeys.length - maxNoofBuckets);
    		someStringsDidNotFit = true;
    	    } else {
    		someStringsDidNotFit = false;
    	    }

    	    var barW = Math.floor(Math.floor(drawW / noofGroups) / sortedKeys.length  - colSep);
    	    if(barW < 1) {
    		barW = 1;
    	    }	
    	    var setW = barW * noofGroups + colSep;

    	    for(var i = 0; i < sortedKeys.length; i++) {
    		newHistogram.push( [sortedKeys[i][1], buckets[sortedKeys[i][1]], i*setW, (i+1)*setW - colSep ] ); // label, list of histogram heights, left pixel, right pixel
    	    }

    	} else { // not string (i.e. date or number)

	    if(unique < drawW) {
		var temp = [];
		for (var k in buckets) {
		    temp.push(parseFloat(k));
		}
		temp.sort(function(a,b){return a - b;});
		
		var b = [];
		for(var k = 0; k < temp.length; k++) {
		    b.push(buckets[temp[k]]);
		    bucketsMinMax.push([temp[k], temp[k]]);
		}
		buckets = b;
	    } 

    	    if(buckets.length * (colSep + noofGroups * minBW) > drawW) {
    		var barW = minBW;
    		var setW = barW * noofGroups + colSep;

		var noofSets = Math.floor(drawW / setW);
		while(noofSets * setW < buckets.length) {
		    colSep += 1;
		    setW = barW * noofGroups + colSep;
		}

		if(unique < drawW) {
		    var left = limits.min;
		    var stepSize = (limits.max - limits.min) / noofSets;

		    for(var step = 0; step < noofSets; step++) {
			var ls = [];
			for(var g = 0; g < maxGroup + 1; g++) {
			    ls.push(0);
			}
			var histTot = 0;
			var histMin = null;
			var histMax = null;
			
			for(var i = 0; i < buckets.length; i++) {
			    if(bucketsMinMax[i][0] > left + (step + 1)*stepSize
			       || bucketsMinMax[i][1] < left + step*stepSize) {
				// skip 
			    } else {
				// add
				var tot = 0;
				for(var j = 0; j < buckets[i].length; j++) {
				    tot += buckets[i][j];
				    ls[j] += buckets[i][j];
				}

				histTot += tot;
				
				if(histMin === null) {
				    histMin = bucketsMinMax[i][0];
				} else {
				    histMin = Math.min(histMin, bucketsMinMax[i][0]);
				}
				if(histMax === null) {
				    histMax = bucketsMinMax[i][1];
				} else {
				    histMax = Math.max(histMax, bucketsMinMax[i][1]);
				}
			    }
			}

			var histStr = "";
			if(histMin !== null) {
			    histStr = "[" + histMin + "," + histMax + ")";
			}
			newHistogram.push( [histStr, ls, setW*step, (step+1)*setW - colSep, histMin, histMax, histTot] );
		    }
		} else {
		    
		    var bucketIdx = 0;
		    var steps = 0;
		    var first = true;

		    var ls = [];
		    for(var g = 0; g < maxGroup + 1; g++) {
			ls.push(0);
		    }
		    newHistogram.push( ["", ls, 0, setW - colSep, null, null, 0] );

    		    for(var i = 0; i < buckets.length; i++) {
			if(steps > setW) {
			    first = true;
			    bucketIdx++;
			    steps = 0;

			    var ls = [];
			    for(var g = 0; g < maxGroup + 1; g++) {
				ls.push(0);
			    }
    			    newHistogram.push( ["", ls, bucketIdx*setW, (bucketIdx+1)*setW - colSep, null, null, 0] );
			}
			steps++;

			var tot = 0;
    			var ls = newHistogram[bucketIdx][1];
    			for(var j = 0; j < buckets[i].length; j++) {
    			    ls[j] += buckets[i][j];
			    tot += buckets[i][j];
    			}
			
			if(tot > 0) {
			    if(first) {
				first = false;
				newHistogram[bucketIdx][4] = bucketsMinMax[i][0];
				newHistogram[bucketIdx][5] = bucketsMinMax[i][1];
				newHistogram[bucketIdx][6] = tot;
			    } else {
				newHistogram[bucketIdx][4] = Math.min(bucketsMinMax[i][0], newHistogram[bucketIdx][4]);
				newHistogram[bucketIdx][5] = Math.max(bucketsMinMax[i][1], newHistogram[bucketIdx][5]);
				newHistogram[bucketIdx][6] += tot;
			    }
			}
    		    }
		    for(var i = 0; i < newHistogram.length; i++) {
			if(newHistogram[i][4] !== null) {
			    newHistogram[i][0] = "[" + newHistogram[i][4] + "," + newHistogram[i][5] + ")";
			}
		    }
		}
    	    } else { // all buckets fit
    		var barW = Math.floor(Math.floor(drawW / noofGroups) / buckets.length - colSep);
    		var setW = barW * noofGroups + colSep;

    		for(var i = 0; i < buckets.length; i++) {

		    var ls = [];
		    for(var g = 0; g < maxGroup + 1; g++) {
			ls.push(0);
		    }
		    
		    var tot = 0;
		    for(var j = 0; j < buckets[i].length; j++) {
			tot += buckets[i][j];
			ls[j] += buckets[i][j];
		    }

		    newHistogram.push(["[" + bucketsMinMax[i][0] + "," + bucketsMinMax[i][1] + ")", ls, i*setW, (i+1)*setW - colSep, bucketsMinMax[i][0], bucketsMinMax[i][1], tot]);
		}
	    }
    	}

    	if(seenNulls.length > 0) {
	    nullLeft = maxNoofBuckets*setW;
	    nullRight = (maxNoofBuckets + 1)*setW - colSep;
    	    newHistogram.push([ nullValueStringRep, seenNulls, nullLeft, nullRight]);
    	}

    	for(var i = 0; i < newHistogram.length; i++) {
    	    for(var j = 0; j < newHistogram[i][1].length; j++) {
    		if(useLog) {
    		    highscore = Math.max(highscore, Math.log(1 + newHistogram[i][1][j]));
    		} else {
    		    highscore = Math.max(highscore, newHistogram[i][1][j]);
    		}
    	    }
    	}

    	for(var i = 0; i < newHistogram.length; i++) {
    	    for(var group = 0; group < newHistogram[i][1].length; group++) {
    		var sum = newHistogram[i][1][group];
    		if(useLog) {
    		    sum = Math.log(1 + sum);
    		}
		
    		if(sum > 0) {
    		    var h = Math.floor(sum / highscore * drawH);
    		    var x1 = leftMarg + newHistogram[i][2] + groupIdxMap[group] * barW;
    		    var w = barW;
    		    var x2 = x1+barW;
    		    var y1 = drawH + topMarg - h;
    		    var y2 = y1 + h;

		    if(group == 0) {
    			var col = getGradientColorForGroup(group, x1,y1, x2,y2, 0.33)
		    } else {
    			var col = getGradientColorForGroup(group, x1,y1, x2,y2)
		    }		    
    		    ctx.fillStyle = col;
    		    ctx.fillRect(x1,y1,w,h);

    		    c = getColorForGroup(group);
    		    ctx.fillStyle = c;
    		    ctx.fillRect(x1,y1,w,1); // top
    		    ctx.fillRect(x1,y1,1,h); // left
    		    ctx.fillRect(x1,y1+h-1,w,1); // bottom
    		    ctx.fillRect(x1+w-1,y1,1,h); // right
    		}
    	    }
    	}
	histogram = newHistogram;
    }


    function getGradientColorForGroup(group, x1,y1, x2,y2, alpha) {
    	if(useGlobalGradients) {
    	    if(myCanvas === null) {
    		var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    		if(myCanvasElement.length > 0) {
    		    myCanvas = myCanvasElement[0];
    		}
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
	    
    	    x1 = 0;
    	    y1 = 0;
    	    x2 = W;
    	    y2 = H;
    	}		
	
    	if(colorPalette === null || colorPalette === undefined) {
    	    colorPalette = {};
    	}

    	var colors = $scope.gimme("ColorScheme");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}
	
    	group = group.toString();

    	if(!colorPalette.hasOwnProperty(group)) {
    	    if(colors.hasOwnProperty('groups')) {
    		var groupCols = colors.groups;
		
    		for(var g in groupCols) {
    		    if(groupCols.hasOwnProperty(g)) {
    			colorPalette[g] = 'black';
			
    			if(groupCols[g].hasOwnProperty('color')) {
    			    colorPalette[g] = groupCols[g].color;
    			}
    		    }
    		}
    	    }
    	}
	
    	if(colors.hasOwnProperty("groups")) {
    	    var groupCols = colors.groups;
	    
    	    if(groupCols.hasOwnProperty(group) && ctx !== null && groupCols[group].hasOwnProperty('gradient')) {
    		var OK = true;
		
    		try {
    		    if(parseInt(x1) == parseInt(x2)) {
    			x2 = x1 + 1;
    		    }
    		    if(parseInt(y1) == parseInt(y2)) {
    			y2 = y1 + 1;
    		    }
		    
    		    var grd = ctx.createLinearGradient(x1,y1,x2,y2);
    		    for(var i = 0; i < groupCols[group].gradient.length; i++) {
    			var cc = groupCols[group].gradient[i];
    			if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
    			    if(alpha !== undefined) {
    				grd.addColorStop(cc.pos, hexColorToRGBA(cc.color, alpha));
    			    }
    			    else {
    				grd.addColorStop(cc.pos, cc.color);
    			    }
    			} else {
    			    OK = false;
    			}
    		    }
		    
    		    if(OK) {
    			return grd;
    		    }
    		} catch(e) {
    		    debugLog("getGradientColorForGroup crashed on group=" + group + ",x1=" + x1 + ",y1=" + y1 + ", x2=" + x2 + ", y2=" + y2 + ", alpha=" + alpha);
    		}
    	    }
    	}
	
    	if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
    	    return 'black';
    	} else {
    	    return colorPalette[group];
    	}
    };

    function getColorForGroup(group) {
    	if(colorPalette === null) {
    	    colorPalette = {};
    	}

    	group = group.toString();

    	if(!colorPalette.hasOwnProperty(group)) {
    	    var colors = $scope.gimme("ColorScheme");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    
    	    if(colors.hasOwnProperty("groups")) {
    		var groupCols = colors.groups;
		
    		for(var g in groupCols) {
    		    if(groupCols.hasOwnProperty(g)) {
    			colorPalette[g] = 'black';
			
    			if(groupCols[g].hasOwnProperty('color')) {
    			    colorPalette[g] = groupCols[g].color;
    			}
    		    }
    		}
    	    }
    	}
	
    	if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
    	    return 'black';
    	} else {
    	    return colorPalette[group];
    	}
    };

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
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	myCanvas.width = rw;
    	myCanvas.height = rh;

    	if(dropCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
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
    	    } else {
    		debugLog("no selectionCanvas to resize!");
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
    };

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

    		// case "TreatNullAsUnselected":
    		//     updateLocalSelections(false);
    		//     break;

    	    case "SelectAll":
    		if(eventData.slotValue) {
    		    $scope.selectAll();
    		    $scope.set("SelectAll",false);
    		}
    		break;
    		// case "ResetAllSelections":
    		//     if($scope.gimme("ResetAllSelections")) {
    		// 	$scope.set("ResetAllSelections", false);
    		// 	selectAll();
    		//     }

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
    		} else {
    		    useLog = false;
    		}
    		updateGraphics();
    		break;
    	    case "UseGlobalColorGradients":
    		if(eventData.slotValue) {
    		    useGlobalGradients = true;
    		} else {
    		    useGlobalGradients = false;
    		}
    		updateGraphics();
    		break;
    	    case "LowerCaseStrings":
    		if(eventData.slotValue) {
    		    lowerCaseStrings = true;
    		} else {
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
    	    case "ColorScheme":
    		colorPalette = null;
    		parseSelectionColors();
    		updateGraphics();
    		break;
    	    case "DataValuesSetFilled":
    		parseData();
    		break;
    	    };
	} catch(exc) {
	    debugLog("Error when getting a slot set");
	}
    };




    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(MxPos1, MxPos2, keepOld) {
    	// debugLog("newSelection");

	var xPos1 = MxPos1 - leftMarg;
	var xPos2 = MxPos2 - leftMarg;

    	if(unique > 0) {

    	    var firstOverlap = true;
	    var coversAll = true;
    	    var newSel = [limits.min, limits.max, leftMarg, leftMarg + drawW, false];

	    for(var i = 0; i < histogram.length; i++) {
		var empty = true;
		if(histogram[i].length > 6 && histogram[i][6] > 0) {
		    empty = false;
		}
		if(dataType == 'string') {
		    empty = false;
		}
		
		// for(var j = 0; j < histogram[i][1].length; j++) {
		//     if(histogram[i][1][j] > 0) {
		// 	empty = false;
		// 	break;
		//     }
		// }

		if(!empty) {
		    if(xPos1 <= histogram[i][3] && histogram[i][2] <= xPos2) { // overlaps with selection

    			if(firstOverlap) {
    			    firstOverlap = false;
			    
			    if(histogram[i][0] == nullValueStringRep) {
				newSel[4] = true;
    				newSel[0] = null;
    				newSel[1] = null;
    				newSel[2] = null;
    				newSel[3] = null;
			    } else {
    				newSel[2] = histogram[i][2];
    				newSel[3] = histogram[i][3];

				if(dataType == 'string') {
    				    newSel[0] = histogram[i][0];
    				    newSel[1] = histogram[i][0];
				} else {
				    newSel[0] = histogram[i][4];
				    newSel[1] = histogram[i][5];
				}
			    }			    
    			} else {
			    if(histogram[i][0] == nullValueStringRep) {
				newSel[4] = true;
			    } else {
				if(dataType == 'string') {
				    if(newSel[0] === null || newSel[2] > histogram[i][2]) {
					newSel[0] = histogram[i][0]; // put leftmost string here
				    }
				    if(newSel[1] === null || newSel[3] < histogram[i][3]) {
					newSel[1] = histogram[i][1]; // put rightmost string here
				    }
				} else {
				    if(newSel[0] === null) {
					newSel[0] = histogram[i][4];
				    } else {
					newSel[0] = Math.min(newSel[0], histogram[i][4]);
				    }
    				    
				    if(newSel[1] === null) {
					newSel[1] = histogram[i][5];
				    } else {
					newSel[1] = Math.max(newSel[1], histogram[i][5]);
				    }
				}
			    }
			    if(newSel[2] === null) {
				newSel[2] = histogram[i][2];
			    } else {
				newSel[2] = Math.min(newSel[2], histogram[i][2]);
			    }
			    if(newSel[3] === null) {
				newSel[3] = histogram[i][3];
			    } else {
				newSel[3] = Math.max(newSel[3], histogram[i][3]);
			    }
    			}
    		    } else { // does not overlap
    			coversAll = false;
    		    }
		}
    	    }

    	    if(firstOverlap) {
    		// debugLog("Ignoring selection because nothing was selected");
    	    } else {
    		if(!keepOld) {
    		    allTextSelected = false;
    		    selections = [];
    		}

    		var overlap = false;
    		for(var s = 0; s < selections.length; s++) {
    		    var sel = selections[s];
    		    if(sel[0] == newSel[0]
    		       && sel[1] == newSel[1]
    		       && sel[2] == newSel[2]
    		       && sel[3] == newSel[3]
    		       && (sel.length == newSel.length
    			   && (sel.length < 5 || sel[4] == newSel[4]))
    		      ) {
    			// debugLog("Ignoring selection because it overlaps 100% with already existing selection");
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

    function updateSelectionRectangles() {
	// This needs to run when the component is resized or the
	// minimum width of histogram bars change etc.  Such changes
	// can lead to bars merging, and then we may need to update
	// the selections (or some selections would select only parts
	// of a histogram bar).

    	var dirty = false;

	// This does not work correctly for string type data when the
	// selection is larger than the possible number of bars in the
	// current display. Currently a large selection will be
	// replaces with a selection of only the first (leftmost) bar,
	// not all the bars that fit. TODO: fix this?
	
	// debugLog("updateSelectionRectangles");

    	for(var sel = 0; sel < selections.length; sel++) {
    	    var newSel = selections[sel];
    	    var val1 = newSel[0];
    	    var val2 = newSel[1];
	    
    	    var firstOverlap = true;

	    if(dataType == 'string') {
		var saw1 = false;
		var saw2 = false;
	    }

	    // this can be optimized, since the histogram is sorted
	    // from left to right and the selections are sorted too

	    for(var i = 0; i < histogram.length; i++) {
		if(histogram[i][0] == nullValueStringRep) {
    		    if(newSel.length > 4 && newSel[4]) {
    			if(firstOverlap) {
    			    firstOverlap = false;
    			    newSel[2] = null;
    			    newSel[3] = null;
    			}
    		    }
    		} else if(val1 != null && val2 != null) {
		    if(dataType == 'string') {
			var overlap = false;
    			if(val1 == histogram[i][5] 
			   || val1 == histogram[i][5]) {
			    saw1 = true;
			    overlap = true;
			}
			if(val2 == histogram[i][4] 
			   || val2 == histogram[i][5]) {
			    saw2 = true;
			    overlap = true;
			}

			if(overlap) {
			    // strings never merge, but they may disappear out of the right margin
    			    if(firstOverlap) {
    				firstOverlap = false;
    				newSel[2] = histogram[i][2];
    				newSel[3] = histogram[i][3];
    			    } else {
				if(newSel[2] === null) {
    				    newSel[2] = histogram[i][2];
				} else {
				    newSel[2] = Math.min(newSel[2], histogram[i][2]);
				}

				if(newSel[3] === null) {
    				    newSel[3] = histogram[i][3];
				} else {
				    newSel[3] = Math.max(newSel[3], histogram[i][3]);
				}
    			    }
			}
		    } else {
    			// if((val1 < histogram[i][5] && histogram[i][4] < val2)
			//    || (val1 == val2 && (val1 == histogram[i][4] || val2 == histogram[i][5]))
			//    || (histogram[i][4] == histogram[i][5] && (val1 == histogram[i][4] || val2 == histogram[i][5]))
			//    ) {
    			if((val1 <= histogram[i][5] && histogram[i][4] <= val2)
			  ) {
    			    // overlaps with selection

    			    // we may need to grow the selection
    			    newSel[0] = Math.min(histogram[i][4], newSel[0]);
    			    newSel[1] = Math.max(histogram[i][5], newSel[1]);

    			    if(newSel[0] != val1
    			       || newSel[1] != val2) {
    				dirty = true;
				// debugLog("grow [" + val1 + "," + val2 + "] to (" + newSel[0] + "," + newSel[1] + ")");
    			    }

    			    if(firstOverlap) {
    				firstOverlap = false;
    				newSel[2] = histogram[i][2];
    				newSel[3] = histogram[i][3];
    			    } else {
				if(newSel[2] === null) {
    				    newSel[2] = histogram[i][2];
				} else {
				    newSel[2] = Math.min(newSel[2], histogram[i][2]);
				}

				if(newSel[3] === null) {
    				    newSel[3] = histogram[i][3];
				} else {
				    newSel[3] = Math.max(newSel[3], histogram[i][3]);
				}
    			    }
			}
    		    }
    		}
    	    }

	    if(dataType == 'string') {
		if(!saw1 || !saw2) {
		    dirty = true;
		}
	    }
    	}

    	drawSelections();
    	if(dirty) {
    	    updateLocalSelections(false);
    	    saveSelectionsInSlot();
    	}
    }

    $scope.selectAll = function() {
    	if(dataType == 'string') {
    	    allTextSelected = true;
    	}
    	if(unique <= 0) {
    	    selections = [];
    	} else {
	    if(nullRight > 0) {
    		selections = [[limits.min, limits.max, 0, drawW, true]];
	    } else {
    		selections = [[limits.min, limits.max, 0, drawW]];
	    }
    	}
    	drawSelections();
    	updateLocalSelections(true);
    	saveSelectionsInSlot();
    }

    function hexColorToRGBA(color, alpha) {
    	if(typeof color === 'string'
    	   && color.length == 7) {
	    
    	    var r = parseInt(color.substr(1,2), 16);
    	    var g = parseInt(color.substr(3,2), 16);
    	    var b = parseInt(color.substr(5,2), 16);

    	    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    	}
    	return color;
    }

    function parseSelectionColors() {
    	// debugLog("parseSelectionColors");

    	var colors = $scope.gimme("ColorScheme");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}

    	selectionColors = {};

    	if(colors.hasOwnProperty('selection')) {
    	    if(colors['selection'].hasOwnProperty('border')) {
    		selectionColors.border = colors['selection']['border'];
    	    } else {
    		selectionColors.border = '#FFA500'; // orange
    	    }
	    
    	    if(colors['selection'].hasOwnProperty('color')) {
    		selectionColors.color = hexColorToRGBA(colors['selection']['color'], selectionTransparency);
    	    } else {
    		selectionColors.color = hexColorToRGBA('#FFA500', selectionTransparency); // orange
    	    }

    	    if(colors['selection'].hasOwnProperty('gradient')) {
    		if(selectionCanvas === null || selectionCtx === null) {
    		    var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    		    if(selectionCanvasElement.length > 0) {
    			selectionCanvas = selectionCanvasElement[0];
    			selectionCtx = selectionCanvas.getContext("2d");
    		    } else {
    			debugLog("no selectionCanvas to resize!");
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
    	    } else {
    		selectionColors.grad = selectionColors.color;
    	    }
    	}
    };

    function drawSelections() {
    	if(selectionCanvas === null) {
    	    var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    	    if(selectionCanvasElement.length > 0) {
    		selectionCanvas = selectionCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw selections on!");
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

	if(unique > 0) {

    	    for(sel = 0; sel < selections.length; sel++) {
		if(selections[sel][2] !== null) {
		    var x1 = leftMarg + selections[sel][2];
		} else {
		    if(nullLeft >= 0) {
			var x1 = nullLeft;
		    } else {
			var x1 = drawW;
		    }
		}

		if(selections[sel][3] === null
		   || (selections[sel].length > 4 
		       && selections[sel][4])) {
		    if(nullRight > 0) {
			var x2 = nullRight;
		    } else {
			var x2 = drawW + 1;
		    }
		} else {
		    var x2 = leftMarg + selections[sel][3];
		}
		var dx = x2 - x1;
		
    		selectionCtx.fillStyle = selectionColors.grad;
    		selectionCtx.fillRect(x1,topMarg-1, dx, drawH+2);
		
    		selectionCtx.fillStyle = selectionColors.border;
    		selectionCtx.fillRect(x1,  topMarg-1,               1,  drawH+2);
    		selectionCtx.fillRect(x1,  topMarg-1,               dx, 1);
    		selectionCtx.fillRect(x1,  topMarg-1 + drawH+2 - 1, dx, 1);
    		selectionCtx.fillRect(x2-1,topMarg-1,               1,  drawH+2);
	    }
	}	
    	hideSelectionRect();
    };

    function hideSelectionRect() {
    	if(selectionRect === null) {
    	    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    	    if(selectionRectElement.length > 0) {
    		selectionRect = selectionRectElement[0];
    	    } else {
    		debugLog("No selection rectangle!");
    	    }
    	}
    	if(selectionRect !== null) {
    	    selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
    	}
    };

    function mousePosToBucketIdx(pos) {
    	if(pos !== null) {
    	    var x = pos.x - leftMarg;
    	    for(var i = 0; i < histogram.length; i++) {
    		if(histogram[i][2] <= x 
    		   && histogram[i][3] >= x) {
    		    return i;
    		}
    		if(x < histogram[i][2] ) {
    		    return -1;
    		}
    	    }
    	}
    	return -1;
    };

    function mousePosIsInSelectableArea(pos) {
    	if(pos.x > leftMarg 
    	   && pos.x <= leftMarg + drawW
    	   && pos.y > topMarg
    	   && pos.y <= topMarg + drawH) {
    	    return true;
    	}
    	return false;
    };

    var onMouseMove = function(e){
    	if(unique > 0) {
            var currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

    	    // hover text

    	    if(hoverText === null) {
    		var elmnt = $scope.theView.parent().find('#mouseOverText');
    		if(elmnt.length > 0) {
    		    hoverText = elmnt[0];
    		} else {
    		    debugLog("No hover text!");
    		}
    	    }

    	    if(hoverText !== null) {
    		if(mousePosIsInSelectableArea(currentMouse)) {
    		    var idx = mousePosToBucketIdx(currentMouse);
    		    if(idx < 0) {
    			hoverText.style.display = "none";
    			// debugLog("no hover: no bucket returned");
    		    } else {
			if(dataType == "string" 
			   || (histogram[idx].length > 6
			       && histogram[idx][6] > 0)) {
    			    var s = histogram[idx][0] + " --> ";
    			    var sNoMarkUp = s;

    			    for(var group = 0; group < activeGroups.length; group++) {
    				var c = getColorForGroup(activeGroups[group]);
    				if(group > 0) {
    				    s += "/";
    				    sNoMarkUp += "/";
    				}
				
    				var sum = histogram[idx][1][activeGroups[group]];
    				s += '<span style="color: ' + c + '">' + sum + '</span>';
    				sNoMarkUp += sum;
    			    }

    			    var textW = getTextWidthCurrentFont(sNoMarkUp);
    			    hoverText.style.font = fontSize + "px Arial";
    			    hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
    			    hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
    			    hoverText.innerHTML = s;
    			    hoverText.style.display = "block";
			}
    		    }
    		} else {
    		    hoverText.style.display = "none";
    		}
    	    }
	    

    	    // selection rectangle, if clicked
	    
    	    if(clickStart !== null) {
    		if(selectionRect === null) {
    		    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    		    if(selectionRectElement.length > 0) {
    			selectionRect = selectionRectElement[0];
    		    } else {
    			debugLog("No selection rectangle!");
    		    }
    		}
    		if(selectionRect !== null) {
    		    var x1 = currentMouse.x;
    		    var w = 1;
    		    if(clickStart.x < x1) {
    			x1 = clickStart.x;
    			w = currentMouse.x - x1;
    		    } else {
    			w = clickStart.x - x1;
    		    }

    		    var y1 = currentMouse.y;
    		    var h = 1;
    		    if(clickStart.y < y1) {
    			y1 = clickStart.y;
    			h = currentMouse.y - y1;
    		    } else {
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

    var onMouseDown = function(e){
    	if(unique > 0) {
            if(e.which === 1){
    		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
    		if(mousePosIsInSelectableArea(currentMouse)) {
    		    clickStart = currentMouse;
    		    if(e.ctrlKey || e.metaKey) {
    			clickStart.ctrl = true;
    		    } else {
    			clickStart.ctrl = false;
    		    }

    		    selectionHolderElement.bind('mouseup', onMouseUp);
    		    e.stopPropagation();
    		} else {
    		    clickStart = null;

		    
    		    // also do the drag&drop related stuff
    		    var x = currentMouse.x;
    		    var y = currentMouse.y;
		    
    		    var found = false;
    		    for(var dr = 0; dr < allDragNames.length; dr++){
    			var drag = allDragNames[dr];
    			if(drag.left >= 0
    			   && x >= drag.left
    			   && x <= drag.right
    			   && y >= drag.top
    			   && y <= drag.bottom) {
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
    		    // debugLog("ignoring a selection because it is too small");
    		} else {
    		    newSelection(x1,x2, clickStart.ctrl);
    		}
    	    }
    	}	
    	clickStart = null;
    };

    var onMouseOut = function(e) {
    	if(unique > 0) {
    	    if(hoverText === null) {
    		var elmnt = $scope.theView.parent().find('#mouseOverText');
    		if(elmnt.length > 0) {
    		    hoverText = elmnt[0];
    		} else {
    		    debugLog("No hover text!");
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
    		    // debugLog("ignoring a selection because it is too small");
    		} else {
    		    newSelection(x1,x2, clickStart.ctrl);
    		}
    	    }
    	}	
    	clickStart = null;
    };

    //===================================================================================
    // Webble template Initialization
    // If any initiation needs to be done when the webble is created it is here that
    // should be executed. the saved def object is sent as a parameter in case it
    // includes data this webble needs to retrieve.
    // If this function is empty and unused it can safely be deleted.
    // Possible content for this function is as follows:
    // *Add own slots
    // *Set the default slot
    // *Set Custom Child Container
    // *Create Value watchers for slots and other values
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
    	} else {
    	    debugLog("no canvas to draw on!");
    	}

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

	$scope.addSlot(new Slot('ClearData',
				false,
				"Clear Data",
				'Slot to quickly reset to having no data.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',                  // Name
    				"Bar Chart",                              // Value
    				'Plugin Name',                                  // Display Name
    				'The name to display in menus etc.',             // Description
    				$scope.theWblMetadata['templateid'],        // Category (common to set to the template id)
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


        $scope.addSlot(new Slot('InternalSelections',
    				"{}",
    				"Internal Selections",
    				'Slot to save the internal state of what is selected.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
    	// $scope.getSlot('InternalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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
    	} else {
    	    debugLog("No selectionHolderElement, could not bind mouse listeners");
    	}

    	$scope.fixDroppable();
    	$scope.fixDraggable();
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
        var targetName = $(event.target).scope().getName();

        if (targetName != ""){
            //=== [TARGET NAME] ====================================
            //=============================================
        }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
        var customWblDefPart = {

        };

        return customWblDefPart;
    };
    //===================================================================================

});
//=======================================================================================
