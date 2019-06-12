//======================================================================================================================
// Controllers for hopVizParallelCoordinateHolderWebble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizParallelCoordinateHolderWebbleCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Parallel Coordinates";
    $scope.dataSetName = "";

    var myInstanceId = -1;

    var dataMappings = []; 
    
    // graphics

    var bgCanvas = null;
    var bgCtx = null;
    var barCanvas = null;
    var barCtx = null;
    var labelCanvas = null;
    var labelCtx = null;
    var lineCanvas = null;
    var lineCtx = null;
    var ulineCanvas = null;
    var ulineCtx = null;
    var dropCanvas = null;
    var dropCtx = null;

    var quickRenderThreshold = 500;
    
    var currentColors = null;
    var textColor = "#000000";

    var logarithmic = [];

    var hoverText = null;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    // layout
    var leftMarg = 35;
    var topTopMarg = 20;
    var topMarg = 45; // calculated as topTopMarg + fontSize + headerMarg
    var headerMarg = 10;
    var rightMarg = 20;
    var bottomMarg = 20;
    var nullMarg = 30;

    var fontSize = 11;
    var transparency = 0.6; // for the data lines

    var colorPalette = null;
    var useGlobalGradients = false;

    var clickStart = null;

    var grouping = true;

    // data from parent

    var parsingDataNow = false;
    var waitingForMoreData = false;

    var coordTypes = [];
    var coordLimits = [];
    var coordNames = [];
    var coordValFuns = [];
    var coordSelFuns = [];
    var coordNewSelFuns = [];
    var dragZones = [];

    var onScreenCoordIdxToArrayIdx = [];
    var coordXpos = [];

    var unique = 0; // number of data points with non-null values
    var NULLs = 0;
    var N = 0;

    var drawH = 1;
    var drawW = 1;

    var internalSelectionsInternallySetTo = {};

    var lastDrawW = null;
    var lastDrawH = null;
    var lastFontSize = null;
    var lastTextColor = null;
    var lastColors = null;

    var dropNew = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'New Coordinate', 'type':['number','date','string']}, "label":"New Coordinate", "rotate":false};
    var allDropZones = [dropNew];

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
    	$scope.theView.find('#selectionHolder').droppable({ 
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


    $scope.fakeDropNoRedraw = function(dataSourceInfo, vizualizationFieldName) {
	waitingForMoreData = true;
	$scope.fakeDrop(dataSourceInfo, vizualizationFieldName);
	waitingForMoreData = false;
    }

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
    };


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
		if(targetField.name == 'New Coordinate') {
    		    dataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':"Coordinate " + (dataMappings[mapSrcIdx].map.length + 1).toString(), 'listen':null, 'drag':dataSourceInfoStr}); // we need to rename the "New Coordinate" field 
    		    dataMappings[mapSrcIdx].clean = false;
    		    somethingChanged = true;
		    
		} else {
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
    }

    function checkMappingsAndParseData() {
    	// debugLog("checkMappingsAndParseData");

    	parsingDataNow = true;

    	var somethingChanged = false;

    	var atLeastOneActive = false;

    	for(var src = 0; src < dataMappings.length; src++) {
    	    var typeError = false;

    	    var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    	    var ls = w.scope().gimme(dataMappings[src].slotName);

    	    var noofCords = 0;
    	    var coordTypes = [];
    	    var coordNames = [];
	    
    	    for(var f = 0; f < dataMappings[src].map.length; f++) {
		var fieldInfo = null;
		if(dataMappings[src].map[f].srcIdx < ls.length) {
    		    fieldInfo = ls[dataMappings[src].map[f].srcIdx];
		}

    		if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropNew.forMapping.type)) {
    		    typeError = true;
    		    dataMappings[src].map[f].active = false;
    		} else {
    		    dataMappings[src].map[f].listen = fieldInfo.listen;
    		    dataMappings[src].map[f].active = true;
    		    noofCords++;
		}
    	    }
	    
    	    var canActivate = false;
    	    if(noofCords > 1) {
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
    		    // debugLog("Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
    		    if(dataMappings[src].map[i].active
		       && dataMappings[src].map[i].hasOwnProperty("listen") 
		       && dataMappings[src].map[i].liste !== null
		      ) {
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
    	    updateGraphicsHelper(false, true, false);
    	}
    }

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
    	if($scope.doDebugLogging) {
    	    $log.log("hopVizParallelCoordinateHolderWebble: " + message);
    	}
    };


    function pixel2valDisplay(p, coord) {
    	if(unique <= 0) {
    	    return 0;
    	}
	
    	if(p > topMarg + drawH + nullMarg / 2) {
    	    return null;
    	}

    	if(coordTypes[coord] == 'string') {
    	    if(p < topMarg) {
    		return coordLimits[coord].labels[0];
    	    }
    	    if(p > topMarg + drawH) {
    		return coordLimits[coord].labels[coordLimits[coord].noofLabels - 1];
    	    }
	    
    	    var best = 0;
    	    var prop = (p - topMarg) / drawH;
    	    var diff = Math.abs(prop);
	    
    	    for(var i = 1; i < coordLimits[coord].labels.length; i++) {
    		var d2 = Math.abs(coordLimits[coord].props[i] - prop);
    		if(d2 < diff) {
    		    diff = d2;
    		} else {
    		    return coordLimits[coord].labels[i - 1];
    		}
    	    }
    	    return coordLimits[coord].labels[coordLimits[coord].noofLabels - 1];
    	} else if(coordTypes[coord] == 'date') {
    	    if(p < topMarg) {
    		return coordLimits[coord].min;
    	    }
    	    if(p > topMarg + drawH) {
    		return coordLimits[coord].max;
    	    }
    	    return coordLimits[coord].min + (p - topMarg) / drawH * coordLimits[coord].span;
    	} else { // number
    	    if(coord < logarithmic.length && logarithmic[coord]) {
    		if(p < topMarg) {
    		    return Math.log(coordLimits[coord].max); // flip y-axis
    		}
    		if(p > topMarg + drawH) {
    		    return Math.log(coordLimits[coord].min); // flip Y-axis
    		}
    		return Math.log(coordLimits[coord].min) + (drawH - (p - topMarg)) / drawH * (Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min));
    	    } else {
    		if(p < topMarg) {
    		    return coordLimits[coord].max; // flip y-axis
    		}
    		if(p > topMarg + drawH) {
    		    return coordLimits[coord].min; // flip Y-axis
    		}
    		return coordLimits[coord].min + coordLimits[coord].span - (p - topMarg) / drawH * coordLimits[coord].span; // flip y-axis
    	    }
    	}
    }

    function pixel2valSelect(p, coord) {
    	if(unique <= 0) {
    	    return 0;
    	}
	
    	if(p > topMarg + drawH + nullMarg / 2) {
    	    return null;
    	}

    	if(coordTypes[coord] == 'string') {
    	    if(p < topMarg) {
    		return coordLimits[coord].labels[0];
    	    }
    	    if(p > topMarg + drawH) {
    		return coordLimits[coord].labels[coordLimits[coord].noofLabels - 1];
    	    }
	    
    	    var best = 0;
    	    var prop = (p - topMarg) / drawH;
    	    var diff = Math.abs(prop);
	    
    	    for(var i = 1; i < coordLimits[coord].labels.length; i++) {
    		var d2 = Math.abs(coordLimits[coord].props[i] - prop);
    		if(d2 < diff) {
    		    diff = d2;
    		} else {
    		    return coordLimits[coord].labels[i - 1];
    		}
    	    }
    	    return coordLimits[coord].labels[coordLimits[coord].noofLabels - 1];
    	} else if(coordTypes[coord] == 'date') {
    	    if(p < topMarg) {
    		return coordLimits[coord].min;
    	    }
    	    if(p > topMarg + drawH) {
    		return coordLimits[coord].max;
    	    }
    	    return coordLimits[coord].min + (p - topMarg) / drawH * coordLimits[coord].span;
    	} else { // number
    	    if(p < topMarg) {
    		return coordLimits[coord].max; // flip y-axis
    	    }
    	    if(p > topMarg + drawH) {
    		return coordLimits[coord].min; // flip Y-axis
    	    }

    	    if(coord < logarithmic.length && logarithmic[coord]) {
    		return Math.exp(Math.log(coordLimits[coord].min) + (drawH - (p - topMarg)) / drawH * (Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min)));
    	    } else {
    		return coordLimits[coord].min + coordLimits[coord].span - (p - topMarg) / drawH * coordLimits[coord].span; // flip y-axis
    	    }
    	}
    }

    function includes(ls, elem) {
	for(var i = 0; i < ls.length; i++) {
	    if(ls[i] == elem) {
		return true;
	    }
	}
	return false;
    }

    function val2pixel(v, coord) {
    	if(unique <= 0) {
    	    return topMarg;
    	}
	
    	if(v === null) {
    	    return Math.ceil(topMarg + drawH + 0.75 * nullMarg);
    	}

    	if(coordTypes[coord] == 'string') {
    	    if(coordLimits[coord].dict.hasOwnProperty(v)) {
    		return Math.ceil(topMarg + coordLimits[coord].props[coordLimits[coord].dict[v]] * drawH);
    	    } else {
    		return topMarg - 5;
    	    }
    	} else if(coordTypes[coord] == 'date') {
    	    if(v < coordLimits[coord].min) {
    		return topMarg;
    	    }
    	    if(v > coordLimits[coord].max) {
    		return topMarg + drawH;
    	    }
    	    return topMarg + Math.ceil((v - coordLimits[coord].min) / coordLimits[coord].span * drawH);
    	} else { // number
    	    if(v < coordLimits[coord].min) {
    		return topMarg + drawH; // flip Y-axis
    	    }
    	    if(v > coordLimits[coord].max) {
    		return topMarg; // flip Y-axis
    	    }

    	    if(coord < logarithmic.length && logarithmic[coord]) {
    		var bottom = Math.log(coordLimits[coord].min);
    		var res = topMarg + drawH - Math.ceil((Math.log(v) - bottom) / (Math.log(coordLimits[coord].max) - bottom) * drawH); // flip Y-axis
    		if(isNaN(res)) {
    		    Math.ceil(topMarg + drawH + 0.75 * nullMarg);
    		} else {
    		    return res;
    		}
    	    } else {
    		return topMarg + drawH - Math.ceil((v - coordLimits[coord].min) / coordLimits[coord].span * drawH); // flip Y-axis
    	    }
    	}

    	return topMarg;
    }

    function pixel2nearestHeader(p) {
    	var found = false;
    	var best = -1;
    	var bestDiff = 0;
    	for(var coord = 0; coord < coordXpos.length; coord++) {
    	    var x = coordXpos[coord];
    	    if(found) {
    		var diff = Math.abs(p - x);

    		if(diff < bestDiff) {
    		    bestDiff = diff;
    		    best = coord;
    		}
    	    } else {
    		var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, coordNames[coord]) / 2;
    		if(x - textW <= p
    		   && p <= x + textW) {
    		    found = true;
    		    bestDiff = Math.abs(p - x);
    		    best = coord;
    		}
    	    }
    	}
    	if(found) {
    	    return best;
    	} else {
    	    return -1;
    	}
    }

    function pixel2nearestCoord(p) {
    	var found = false;
    	var best = -1;
    	var bestDiff = 0;
    	for(var coord = 0; coord < coordXpos.length; coord++) {
    	    var diff = Math.abs(p - coordXpos[coord]);
    	    if(diff < 10) {
    		if(!found) {
    		    best = coord;
    		    bestDiff = diff;
    		    found = true;
    		} else {
    		    if(diff < bestDiff) {
    			bestDiff = diff;
    			best = coord;
    		    }
    		}
    	    }
    	}
    	if(found) {
    	    return best;
    	} else {
    	    return -1;
    	}
    }


    function saveSelectionsInSlot() {
    	// debugLog("saveSelectionsInSlot");

    	var result = {};
    	result.selections = [];
	
    	for(coord = 0; coord < coordTypes.length; coord++) {
    	    result.selections.push([]);
    	    for(sel = 0; sel < selections[coord].length; sel++) {
    		if(selections[coord][4]) {
    		    result.selections[coord].push({'onlyNull':selections[coord][4]});
    		} else {
    		    result.selections[coord].push({'min':selections[coord][2],
    						   'max':selections[coord][3],
    						   'onlyNull':selections[coord][4],
    						   'includesNull':selections[coord][5],
    						   'type':selections[coord][7]});
    		}
    	    }
    	}

    	if(JSON.stringify($scope.gimme('InternalSelections'))
    	   != JSON.stringify(result)) {
    	    internalSelectionsInternallySetTo = result;
    	    $scope.set('InternalSelections', result);
    	}
    };

    function setSelectionsFromSlotValue() {
    	// debugLog("setSelectionsFromSlotValue");

    	var slotSelections = $scope.gimme("InternalSelections");
    	if(typeof slotSelections === 'string') {
    	    slotSelections = JSON.parse(slotSelections);
    	}

    	if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
    	    // debugLog("setSelectionsFromSlotValue got identical value");
    	    return;
    	}

    	if(slotSelections.hasOwnProperty("selections")) {
    	    for(coord = 0; coord < coordTypes.length && coord < slotSelections.selections.length; coord++) {
    		if(coord >= selections.length) {
    		    selections.push([]);
    		}
		
    		var newSelections = [];
    		if(unique > 0) {
    		    for(var sel = 0; sel < slotSelections.selections[coord].length; sel++) {
    			var newSel = slotSelections.selections[coord][sel];

    			if(newSel.type != coordTypes[coord]) {
    			    // skip
    			} else if(newSel.onlyNull) {
    			    newSelections.push([topMarg + drawH + nullMarg / 2, 
    						topMarg + drawH + nullMarg,
    						null,
    						null,
    						true,
    						true,
    						coord,
    						coordTypes[coord]]);
			    
    			} else if((coordTypes[coord] == 'string' 
    				   && newSel.min >= coordLimits[coord].noofLabels)
    				  || (newSel.min > coordLimits[coord].max
    				      || newSel.max < coordLimits[coord].min)) {
    			    // outside of new range, skip
    			} else {
    			    if(coordTypes[coord] == 'string') {
    				var smallestInside = newSel.min;
    				var largestInside = newSel.max;
				
    				if(smallestInside >= coordLimits[coord].noofLabels) {
    				    // skip this selection, outside of the range
    				} else {
    				    var top = topMarg;
    				    if(smallestInside > 0) {
    					top = Math.floor(topMarg + drawH * (coordLimits[coord].props[smallestInside] + coordLimits[coord].props[smallestInside - 1]) / 2);
    				    }
    				    var bottom = topMarg + drawH;
    				    if(largestInside >= coordLimits[coord].noofLabels) {
    					largestInside = coordLimits[coord].noofLabels;
    				    }
    				    if(largestInside < coordLimits[coord].props.length - 1) {
    					bottom = Math.ceil(topMarg + drawH * (coordLimits[coord].props[largestInside] + coordLimits[coord].props[largestInside + 1]) / 2);
    				    }

    				    newSel = [top, bottom, smallestInside, largestInside, false, newSel.includesNull, coord, coordTypes[coord]];
    				    if(newSel.includesNull) { // includes null
    					newSel[1] = topMarg + drawH + nullMarg;
    				    }
    				    newSelections.push(newSel);
    				}
    			    } else if(coordTypes[coord] == 'date') {
    				if(newSel.min > coordLimits[coord].max
    				   || newSel.max < coordLimits[coord].min) {
    				    // outside of new range, skip
    				} else {
    				    var v1 = Math.max(coordLimits[coord].min, newSel.min);
    				    var v2 = Math.min(coordLimits[coord].max, newSel.max);
				    
    				    newSel = [val2pixel(v1, coord), val2pixel(v2, coord), v1, v2, false, newSel.includesNull, coord, coordTypes[coord]];
    				    if(newSel.includesNull) { // includes null
    					newSel[1] = topMarg + drawH + nullMarg;
    				    }
    				    newSelections.push(newSel);
    				}
    			    } else { // number
    				if(newSel.min > coordLimits[coord].max
    				   || newSel.max < coordLimits[coord].min) {
    				    // outside of new range, skip
    				} else {
    				    var v1 = Math.max(coordLimits[coord].min, newSel.min);
    				    var v2 = Math.min(coordLimits[coord].max, newSel.max);
				    
    				    newSel = [val2pixel(v2, coord), val2pixel(v1, coord), v1, v2, false, newSel.includesNull, coord, coordTypes[coord]]; // flip y-axis
    				    if(newSel.includesNull) { // includes null
    					newSel[1] = topMarg + drawH + nullMarg;
    				    }
    				    newSelections.push(newSel);
    				}
    			    }
    			}
    		    } // for each sel
    		    if(newSelections.length > 0) {
    			selections[coord] = newSelections;
    		    } else {
    			selectAllOneCoord(coord);
    		    }
    		} else { // if unique > 0
    		    // no data

    		    for(var sel = 0; sel < slotSelections.selections[coord].length; sel++) {
    			var newSel = slotSelections.selections[coord][sel];
			
    			if(newSel.type != coordTypes[coord]) {
    			    // skip
    			} else if(newSel.onlyNull) {
    			    newSelections.push([topMarg + drawH + nullMarg / 2, 
    						topMarg + drawH + nullMarg,
    						null,
    						null,
    						true,
    						true,
    						coord,
    						coordTypes[coord]]);
    			} else {
    			    newSelections.push([topMarg, topMarg + drawH + nullMarg, newSel.min, newSel.max, false, newSel.includesNull, coord, newSel.type]);
    			}
    		    }
		    
    		    if(newSelections.length > 0) {
    			selections[coord] = newSelections;
    		    } else {
    			selectAllOneCoord(coord);
    		    }
    		}
    	    } // for each coord
    	}
	
    	saveSelectionsInSlot();
    };

    function checkSelectionsAfterNewData() {
    	// debugLog("checkSelectionsAfterNewData");

    	for(coord = 0; coord < coordTypes.length; coord++) {
    	    if(coord >= selections.length) {
    		selections.push([]);
    	    }
	    
    	    // if the data type has changed, give up
    	    if(selections[coord].length <= 0
    	       || coordTypes[coord] != selections[coord][0][7]) {
    		selectAllOneCoord(coord);
    	    } else {
    		var newSelections = [];

    		for(sel = 0; sel < selections[coord].length; sel++) {
    		    var newSel = [];
    		    if(selections[coord][sel][4]) { // only null
    			newSel = [topMarg + drawH + nullMarg / 2, 
    				  topMarg + drawH + nullMarg,
    				  null,
    				  null,
    				  true,
    				  true,
    				  coord,
    				  coordTypes[coord]];
    		    } else {
    			if(coordTypes[coord] == 'string') {
    			    var smallestInside = selections[coord][sel][2];
    			    var largestInside = selections[coord][sel][3];
			    
    			    if(smallestInside >= coordLimits[coord].noofLabels) {
    				// skip this selection, outside of the range
    			    } else {
    				var top = topMarg;
    				if(smallestInside > 0) {
    				    top = Math.floor(topMarg + drawH * (coordLimits[coord].props[smallestInside] + coordLimits[coord].props[smallestInside - 1]) / 2);
    				}
    				var bottom = topMarg + drawH;
    				if(largestInside >= coordLimits[coord].noofLabels) {
    				    largestInside = coordLimits[coord].noofLabels;
    				}
    				if(largestInside < coordLimits[coord].props.length - 1) {
    				    bottom = Math.ceil(topMarg + drawH * (coordLimits[coord].props[largestInside] + coordLimits[coord].props[largestInside + 1]) / 2);
    				}

    				newSel = [top, bottom, smallestInside, largestInside, false, selections[coord][sel][5], coord, coordTypes[coord]];
    				if(selections[coord][sel][5]) { // includes null
    				    newSel[1] = topMarg + drawH + nullMarg;
    				}
    				newSelections.push(newSel);
    			    }
    			} else if(coordTypes[coord] == 'date') {
    			    if(selections[coord][sel][2] > coordLimits[coord].max
    			       || selections[coord][sel][3] < coordLimits[coord].min) {
    				// outside of new range, skip
    			    } else {
    				var v1 = Math.max(coordLimits[coord].min, selections[coord][sel][2]);
    				var v2 = Math.min(coordLimits[coord].max, selections[coord][sel][3]);
				
    				newSel = [val2pixel(v1, coord), val2pixel(v2, coord), v1, v2, false, selections[coord][sel][5], coord, coordTypes[coord]];
    				if(selections[coord][sel][5]) { // includes null
    				    newSel[1] = topMarg + drawH + nullMarg;
    				}
    				newSelections.push(newSel);
    			    }
    			} else { // number
    			    if(selections[coord][sel][2] > coordLimits[coord].max
    			       || selections[coord][sel][3] < coordLimits[coord].min) {
    				// outside of new range, skip
    			    } else {			    
    				var v1 = Math.max(coordLimits[coord].min, selections[coord][sel][2]);
    				var v2 = Math.min(coordLimits[coord].max, selections[coord][sel][3]);
				
    				newSel = [val2pixel(v2, coord), val2pixel(v1, coord), v1, v2, false, selections[coord][sel][5], coord, coordTypes[coord]]; // flip y-axis
    				if(selections[coord][sel][5]) { // includes null
    				    newSel[1] = topMarg + drawH + nullMarg;
    				}
    				newSelections.push(newSel);
    			    }
    			}
    		    }
    		}

    		if(newSelections.length <= 0) {
    		    selectAllOneCoord(coord);
    		} else {
    		    selections[coord] = newSelections;
    		}
    	    }
    	}
    }


    var idMap = {};
    var nextId = 1;
    function updateLocalSelections(selectAllFlag) {
    	// debugLog("updateLocalSelections");

    	var dirty = false;
    	idMap = {};
    	nextId = 1;

    	if(selections.length != coordNames.length) {
    	    $scope.selectAll(); // this will result in a call back here later
    	} else {

    	    grouping = $scope.gimme('MultipleSelectionsDifferentGroups');

    	    for(var coord = 0; coord < selections.length; coord++) {
    		selections[coord].sort(function(a,b){return (Math.abs(a[1]-a[0]) - Math.abs(b[1]-b[0]));}); // sort selections so smaller (area) ones are checked first.
    	    }


    	    for(var src = 0; src < dataMappings.length; src++) { 

    		var srcsrc = src;
    		if(dataMappings[src].active) {
    		    if(!dataMappings[src].hasOwnProperty("newSelections") || dataMappings[src].newSelections === null) {
			if(coordNewSelFuns.length > 0) {
			    dataMappings[src].newSelections = coordNewSelFuns[0];
			}
		    }
    		    if(dataMappings[src].hasOwnProperty("newSelections") && dataMappings[src].newSelections !== null) {

			if(!selectAllFlag) {
			    selectAllFlag = true;
    			    for(coord = 0; coord < coordTypes.length; coord++) {
    				if(coordTypes[coord] == 'string') {
				    if(selections[coord].length != 1
				       || selections[coord][0][2] > 0
				       || selections[coord][0][3] < coordLimits[coord].noofLabels
				       || !selections[coord][0][5]) {
					selectAllFlag = false;
					break;
				    }
    				} else if(coordTypes[coord] == 'date') {
				    if(selections[coord].length != 1
				       || selections[coord][0][2] > coordLimits[coord].min
				       || selections[coord][0][3] < coordLimits[coord].max
				       || !selections[coord][0][5]) {
					selectAllFlag = false;
					break;
				    }
    				} else { // number
				    if(selections[coord].length != 1
				       || selections[coord][0][2] > coordLimits[coord].min
				       || selections[coord][0][3] < coordLimits[coord].max
				       || !selections[coord][0][5]) {
					selectAllFlag = false;
					break;
				    }
    				}
			    }
			}

    			dataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAllFlag);
		    }
    		} else {
    		    if(dataMappings[src].hasOwnProperty("newSelections") && dataMappings[src].newSelections !== null) {
    			dataMappings[src].newSelections(myInstanceId, null, false, true);
    		    }
    		}
    	    }

    	}
    }

    function mySelectionStatus(src, idx) {
    	if(parsingDataNow) {
    	    return 1;
    	}

    	var groupId = 0;
    	if(dataMappings[src].active) {

    	    var unselected = false;
    	    var groupIds = [];

    	    for(var coord = 0; coord < selections.length; coord++) {

    		var groupIdCoord = 0;
		
    		if(coordTypes[coord] == 'string') {
    		    var s = coordValFuns[coord](idx);

    		    if(s === null) {
    			for(var span = 0; span < selections[coord].length; span++) {			    
    			    if(selections[coord][span][5]) {
    				groupIdCoord = span + 1;
    				break;
    			    }
    			}
    		    } else { // not null
    			if(coordLimits[coord].dict.hasOwnProperty(s)) {
    			    var idx = coordLimits[coord].dict[s];
    			    for(var span = 0; span < selections[coord].length; span++) {			    
    				if(!selections[coord][span][4] 
    				   && selections[coord][span][2] <= idx
    				   && idx <= selections[coord][span][3]) {
    				    groupIdCoord = span + 1;
    				    break;
    				}
    			    }
    			}
    		    }
    		} else { // number or date
    		    var v = coordValFuns[coord](idx);
    		    if(v === null) {
    			for(var span = 0; span < selections[coord].length; span++) {			    
    			    if(selections[coord][span][5]) {
    				groupIdCoord = span + 1;
    				break;
    			    }
    			}
    		    } else {
    			for(var span = 0; span < selections[coord].length; span++) {			    
    			    if(!selections[coord][span][4]
    			       && selections[coord][span][2] <= v
    			       && v <= selections[coord][span][3]) {
    				groupIdCoord = span + 1;
    				break;
    			    }
    			}
    		    }
    		}
		
    		if(groupIdCoord == 0) {
    		    unselected = true;
    		    groupId = 0;
    		    break; // unselected here means unselected in total
    		} else {
    		    groupIds.push(groupIdCoord);
    		}
    	    }
	    
    	    if(!unselected) {
    		if(grouping) {
    		    var idString = groupIds.join();
		    
    		    if(!idMap.hasOwnProperty(idString)) {
    			groupId = nextId;
    			idMap[idString] = nextId++;
    		    } else {
    			groupId = idMap[idString];
    		    }
    		} else {
    		    groupId = 1;
    		}
    	    } else {
    		groupId = 0;
    	    }
    	}
    	return groupId;
    }


    function resetVars() {
    	$scope.dataSetName = "";
	
    	// data from parent
	
    	coordTypes = [];
    	coordLimits = [];
    	coordNames = [];
    	coordValFuns = [];
    	coordSelFuns = [];
    	coordNewSelFuns = [];
	
	dragZones = [];

    	onScreenCoordIdxToArrayIdx = [];
    	coordXpos = [];
	
    	unique = 0; // number of data points with non-null values
    	NULLs = 0;
    	N = 0;
	
    	localSelections = []; // the data to send to the parent

    	allDropZones = [dropNew];
    }

    function parseData() {
    	resetVars();
	
    	parsingDataNow = true;

    	var alreadyDrewSomething = false;

    	for(var src = 0; src < dataMappings.length && !alreadyDrewSomething; src++) { 

    	    var dataIsCorrupt = false;

    	    if(dataMappings[src].active) {
		
    		N = -1;
		
    		var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    		var ls = w.scope().gimme(dataMappings[src].slotName);
		
    		for(var f = 0; f < dataMappings[src].map.length; f++) {
    		    if(dataMappings[src].map[f].active) {
    			var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    			dataMappings[src].map[f].listen = fieldInfo.listen;

    			coordValFuns.push(fieldInfo.val);
    			coordSelFuns.push(fieldInfo.sel);
    			coordNewSelFuns.push(fieldInfo.newSel);

    			coordNames.push(fieldInfo.name);
			dragZones.push(dataMappings[src].map[f].drag);
    			
    			if(includes(fieldInfo.type, "date")) {
    			    coordTypes.push('date');
    			} else if(includes(fieldInfo.type, "number")) {
    			    coordTypes.push('number');
    			} else {
    			    coordTypes.push('string');
    			}
			
    			if(N < 0) {
    			    N = fieldInfo.size;
    			} else {
    			    if(N != fieldInfo.size) {
    				dataIsCorrupt = true;
    			    }
    			}
    		    }
    		}
		
    		if(!dataIsCorrupt) {

    		    for(var coord = 0; coord < coordNames.length; coord++) {
    			coordLimits.push({'min':0, 'max':0});

    			var firstNonNullData = true;

    			for(var i = 0; i < N; i++) {
    			    var val = coordValFuns[coord](i);
			    
    			    if(val !== null) {
    				unique++;
				
    				if(firstNonNullData) {
    				    firstNonNullData = false;
    				    if(coordTypes[coord] != 'string') {
    					coordLimits[coord].min = val;
    					coordLimits[coord].max = val;
    				    } else {
    					coordLimits[coord].min = 0;
    					coordLimits[coord].max = 1;
    					coordLimits[coord].span = 1;
    					coordLimits[coord].dict = {};
					
    					coordLimits[coord].dict[val] = true;
    				    }					
    				} else {
    				    if(coordTypes[coord] != 'string') {
    					coordLimits[coord].min = Math.min(val, coordLimits[coord].min);
    					coordLimits[coord].max = Math.max(val, coordLimits[coord].max);
    				    } else {
    					coordLimits[coord].dict[val] = true;
    				    }
    				}
    			    } else {
    				NULLs++;
    			    }
    			}
			
    			if(firstNonNullData) {
			    // allow this too
    			    // dataIsCorrupt = true; // only null values
    			} else {
    			    if(coordTypes[coord] == 'date') {
    				if(coordLimits[coord].min == coordLimits[coord].max) {
    				    coordLimits[coord].dateFormat = 'full';
    				    coordLimits[coord].span = 1;
    				} else {
    				    var d1 = new Date(coordLimits[coord].min);
    				    var d2 = new Date(coordLimits[coord].max);
    				    coordLimits[coord].span = coordLimits[coord].max - coordLimits[coord].min;

    				    if(d2.getFullYear() - d1.getFullYear() > 10) {
    					coordLimits[coord].dateFormat = 'onlyYear';
    				    } else if(d2.getFullYear() - d1.getFullYear() > 1) {
    					coordLimits[coord].dateFormat = 'yearMonth';
    				    } else {
    					var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
    					if(d2.getMonth() != d1.getMonth()) {
    					    coordLimits[coord].dateFormat = 'monthDay';
    					} else if(days > 5) {
    					    coordLimits[coord].dateFormat = 'day';
    					} else if(days > 1) {
    					    coordLimits[coord].dateFormat = 'dayTime';
    					} else {
    					    coordLimits[coord].dateFormat = 'time';
    					}
    				    }
    				}
    			    } else if(coordTypes[coord] == 'number') {
    				coordLimits[coord].span = coordLimits[coord].max - coordLimits[coord].min;
    				if(coordLimits[coord].span <= 0) {
    				    coordLimits[coord].span = 1;
    				}
    			    } else { // type is string
    				var labels = [];
    				for(var label in coordLimits[coord].dict) {
    				    labels.push(label);
    				}
    				labels.sort();
    				coordLimits[coord].labels = labels;
    				var noofLabels = labels.length;
    				coordLimits[coord].noofLabels = noofLabels;
    				coordLimits[coord].props = [];
    				for(var l = 0; l < noofLabels; l++) {
    				    coordLimits[coord].props.push(l / (noofLabels - 1));
    				    coordLimits[coord].dict[labels[l]] = l;
    				}
    			    }
    			}
    		    }
		}

    		if(!dataIsCorrupt) {
    		    alreadyDrewSomething = true; // only draw the first data set
    		}

    	    } // if source is active
	} // for each source
	    
    	if(!alreadyDrewSomething) {
    	    // debugLog("No data to draw.");
    	    resetVars();
    	} else {
    	    var xpos = leftMarg;
    	    for(var coord = 0; coord < coordNames.length; coord++) {
    		onScreenCoordIdxToArrayIdx.push(coord);

    		var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, coordNames[coord]);
    		// debugLog("layout coordinates, " + coord + " " + coordNames[coord] + " " + textW + " " + xpos);
    		coordXpos.push(xpos + textW / 2);
    		xpos += textW + 20;
    	    }

    	    // try to keep logarithmic or not state from last time
    	    var displayList = [];
    	    for(var coord = 0; coord < coordNames.length; coord++) {
    		displayList.push(false);
    	    }

    	    for(coord = 0; coord < coordNames.length; coord++) {
    		if(onScreenCoordIdxToArrayIdx[coord] < logarithmic.length) {
    		    displayList[coord] = logarithmic[onScreenCoordIdxToArrayIdx[coord]];
    		}
    	    }
    	    $scope.set("Logarithmic", displayList);

    	    // create drop zones for drag&drop of data
    	    for(coord = 0; coord < coordNames.length; coord++) {
    		var x1 = coordXpos[coord];

    		var fp = {}
    		fp = {'name':'Coordinate ' + (coord+1).toString(), 'type':['number','date','string'], 'idx':(coord+1)};

    		var dropC = {'left':(x1 - 20), 'top':topMarg, 'right':(x1 + 20), 'bottom':(topMarg + drawH), "forMapping":fp, "label":("Coordinate #" + (coord + 1)), "rotate":true};
    		allDropZones.push(dropC);
    	    }
    	}

    	checkSelectionsAfterNewData();
	
    	if(unique > 0) {
    	    updateLocalSelections(false);
    	} else { // no data
    	    if(selectionCtx === null) {
    		selectionCtx = selectionCanvas.getContext("2d");
    		var W = selectionCanvas.width;
    		var H = selectionCanvas.height;
    		selectionCtx.clearRect(0,0, W,H);
    	    }
    	}

    	parsingDataNow = false;

    	updateSize();
    	updateGraphicsHelper(false, true, true);
    }




    function updateGraphics() {
    	updateGraphicsHelper(false, false, false);
    }
    
    function updateGraphicsHelper(forceBackground, forceLines, forceAxes) {
    	// debugLog("updateGraphics()");

	if(waitingForMoreData) {
	    return;
	}

    	if(bgCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
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
    	} else {
    	    textColor = "#000000";
    	}


    	var redrawBackground = forceBackground;
    	var redrawLines = forceLines;
    	var redrawAxes = forceAxes;

    	// ===============================
    	// Check what needs to be redrawn
    	// ===============================

    	if(drawW != lastDrawW
    	   || drawH != lastDrawH) {
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

    	if(!redrawAxes || !redrawLines) {
    	    if(drawW != lastDrawW 
    	       || drawH != lastDrawH) {
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

    	// debugLog("Need to redraw: " + redrawBackground + " " + redrawLines + " " + " " + redrawAxes);


    	if(redrawBackground) {
    	    drawBackground(W, H);
    	}
    	if(redrawAxes) {
    	    drawCoordinateBars(W, H);
    	    drawCoordinateLabels(W, H);
    	}
    	if(redrawLines) {
    	    drawPolyLines(W,H);
    	}
    	drawSelections();

    	lastDrawW = drawW;
    	lastDrawH = drawH;
    	lastFontSize = fontSize;
    	lastTextColor = textColor;
    	lastColors = currentColors;

    	updateDropZones(textColor, 0.3, false);
    }

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

    	    var marg1 = 10;
    	    if(drawW < 100) {
    		marg1 = 0;
    	    }
    	    var marg2 = 10;
    	    if(drawH < 40) {
    		marg2 = 0;
    	    }

    	    dropNew.left = marg1;
    	    dropNew.top = Math.min(H - marg2, H - 20, topMarg + drawH + marg2);
    	    dropNew.right = leftMarg * 2 - marg1;
    	    dropNew.bottom = H - marg2;

    	    for(coord = 0; coord < coordNames.length && coord < allDropZones.length - 1; coord++) {
    		var dropC = allDropZones[coord + 1];
    		var x1 = coordXpos[coord];
    		dropC.left = (x1 - 20);
    		dropC.top = topMarg;
    		dropC.right = (x1 + 20);
    		dropC.bottom = (topMarg + drawH);		
    	    }

    	    if(hover) {
    		dropCtx.save();
    		dropCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
    		dropCtx.fillRect(0,0, W, H);
    		dropCtx.restore();
		
    		var fnt = "bold " + (fontSize + 5) + "px Arial";
    		dropCtx.font = fnt;
    		dropCtx.fillStyle = textColor;
    		dropCtx.fillStyle = "black";

    		dropNew.right = dropNew.left + legacyDDSupLib.getTextWidth(dropCtx, dropNew.label, fnt) + 2 * marg1;

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
    			var tw = legacyDDSupLib.getTextWidth(dropCtx, str, fnt);
    			if(dropZone.rotate) {
    			    var labelShift = Math.floor(dropZone.right - dropZone.left - fontSize) / 2;
    			    dropCtx.translate(dropZone.left + labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
    			    dropCtx.rotate(Math.PI/2);
    			} else {
    			    var labelShift = Math.floor(dropZone.bottom - dropZone.top + fontSize) / 2;
    			    dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.top + labelShift);
    			}
    			dropCtx.fillText(str, 0, 0);
    		    }
    		    dropCtx.restore();
    		}
    	    }
    	}
    }

    function drawBackground(W,H) {
    	if(bgCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no background canvas to draw on!");
    		return;
    	    }
    	}

    	if(bgCtx === null) {
    	    bgCtx = bgCanvas.getContext("2d");
    	}
	
    	bgCtx.clearRect(0,0, W,H);

    	if(currentColors.hasOwnProperty("skin")) {
    	    var drewBack = false
    	    if(currentColors.skin.hasOwnProperty("gradient")) {
    		var OK = true;
		
    		var grd = bgCtx.createLinearGradient(0,0,W,H);
    		for(var i = 0; i < currentColors.skin.gradient.length; i++) {
    		    var cc = currentColors.skin.gradient[i];
    		    if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
    			grd.addColorStop(cc.pos, cc.color);
    		    } else {
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
    	}
    }

    function drawCoordinateBars(W,H) {
    	if(barCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theBarCanvas');
    	    if(myCanvasElement.length > 0) {
    		barCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no background canvas to draw on!");
    		return;
    	    }
    	}

    	if(barCtx === null) {
    	    barCtx = barCanvas.getContext("2d");
    	}
	
    	barCtx.clearRect(0,0, W,H);

    	barCtx.save();
    	barCtx.fillStyle = textColor;
    	barCtx.strokeStyle = textColor;
    	barCtx.font = fontSize + "px Arial";

    	for(var coord = 0; coord < coordNames.length; coord++) {
    	    var x1 = coordXpos[coord];
    	    var y1 = topTopMarg + fontSize;

    	    // label
    	    var s = coordNames[coord];
    	    if(coord < logarithmic.length && logarithmic[coord] && coordTypes[coord] == "number") {
    		s = "log( " + s + " )";
    	    }

    	    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    	    barCtx.fillText(s, x1 - textW/2, y1);
	    
    	    y1 = topMarg;

    	    // vertical bar
    	    barCtx.fillRect(x1, y1, 1, drawH);

    	    // upper limit
    	    barCtx.fillRect(x1-2, y1, 5, 1);

    	    // lower limit
    	    barCtx.fillRect(x1-2, y1+drawH-1, 5, 1);

    	    // some places in between
    	    if(coordTypes[coord] == 'date') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    barCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    } else if(coordTypes[coord] == 'number') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    barCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    } else {
    		for(var l = 1; l < coordLimits[coord].noofLabels - 1; l++) {
    		    barCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    }
    	}
    	barCtx.restore();
    }

    function drawCoordinateBarShadow(coord, xpos) {

    	if(selectionRect === null) {
    	    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    	    if(selectionRectElement.length > 0) {
    		selectionRect = selectionRectElement[0];
    	    } else {
    		debugLog("No selection rectangle!");
    	    }
    	}

    	if(selectionRect !== null && coord >= 0 && coord < coordXpos.length) {
    	    var selectionRectCtx = selectionRect.getContext("2d");
    	    selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);
	    
    	    selectionRectCtx.save();
    	    selectionRectCtx.fillStyle = textColor;
    	    selectionRectCtx.strokeStyle = textColor;
    	    selectionRectCtx.font = fontSize + "px Arial";

    	    var x1 = xpos;
    	    var y1 = topTopMarg + fontSize;

    	    // label
    	    var s = coordNames[coord];
    	    if(coord < logarithmic.length && logarithmic[coord] && coordTypes[coord] == "number") {
    		s = "log( " + s + " )";
    	    }

    	    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    	    selectionRectCtx.fillText(s, x1 - textW/2, y1);
	    
    	    y1 = topMarg;

    	    // vertical bar
    	    selectionRectCtx.fillRect(x1, y1, 1, drawH);

    	    // upper limit
    	    selectionRectCtx.fillRect(x1-2, y1, 5, 1);

    	    // lower limit
    	    selectionRectCtx.fillRect(x1-2, y1+drawH-1, 5, 1);

    	    // some places in between
    	    if(coordTypes[coord] == 'date') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    selectionRectCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    } else if(coordTypes[coord] == 'number') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    selectionRectCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    } else {
    		for(var l = 1; l < coordLimits[coord].noofLabels - 1; l++) {
    		    selectionRectCtx.fillRect(x1-2, nextY, 5, 1);
    		}
    	    }

    	    selectionRectCtx.restore();
    	}
    }
    

    function drawCoordinateLabels(W,H) {
    	if(labelCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theLabelCanvas');
    	    if(myCanvasElement.length > 0) {
    		labelCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no background canvas to draw on!");
    		return;
    	    }
    	}

    	if(labelCtx === null) {
    	    labelCtx = labelCanvas.getContext("2d");
    	}
	
    	labelCtx.clearRect(0,0, W,H);

    	labelCtx.save();

    	labelCtx.save();
    	labelCtx.fillStyle = textColor;
    	labelCtx.strokeStyle = textColor;
    	labelCtx.font = fontSize + "px Arial";

    	for(var coord = 0; coord < coordNames.length; coord++) {
    	    var x1 = coordXpos[coord];
    	    var y1 = topMarg;

    	    // upper limit
    	    if(coordTypes[coord] == 'date') {
    		s = legacyDDSupLib.date2text(coordLimits[coord].min, coordLimits[coord].dateFormat);
    	    } else if(coordTypes[coord] == 'number') {
    		if(coord < logarithmic.length && logarithmic[coord]) {
    		    s = legacyDDSupLib.number2text(Math.log(coordLimits[coord].max), Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min));
    		} else {
    		    s = legacyDDSupLib.number2text(coordLimits[coord].max, coordLimits[coord].span);
    		}
    	    } else {
    		s = coordLimits[coord].labels[0];
    	    }
    	    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    	    labelCtx.fillText(s, x1 + 3, y1 + fontSize - fontSize/2);

    	    // lower limit
    	    if(coordTypes[coord] == 'date') {
    		s = legacyDDSupLib.date2text(coordLimits[coord].max, coordLimits[coord].dateFormat);
    	    } else if(coordTypes[coord] == 'number') {
    		if(coord < logarithmic.length && logarithmic[coord]) {
    		    s = legacyDDSupLib.number2text(Math.log(coordLimits[coord].min), Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min));
    		} else {
    		    s = legacyDDSupLib.number2text(coordLimits[coord].min, coordLimits[coord].span);
    		}
    	    } else {
    		s = coordLimits[coord].labels[coordLimits[coord].labels.length - 1];
    	    }
    	    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    	    labelCtx.fillText(s, x1 + 3, y1 + drawH + fontSize - fontSize/2);

    	    // some places in between
    	    if(coordTypes[coord] == 'date') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    s = legacyDDSupLib.date2text(coordLimits[coord].min + (drawH - (nextY - y1)) / drawH * coordLimits[coord].span, coordLimits[coord].dateFormat);
    		    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    		    labelCtx.fillText(s, x1 + 3, nextY + fontSize - fontSize/2);
    		}
    	    } else if(coordTypes[coord] == 'number') {
    		for(var nextY = y1 + fontSize * 3; nextY < y1 + drawH - fontSize*2; nextY += fontSize*3) {
    		    if(coord < logarithmic.length && logarithmic[coord]) {
    			s = legacyDDSupLib.number2text(Math.log(coordLimits[coord].min) + (drawH - (nextY - y1)) / drawH * (Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min)), Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min));
    		    } else {
    			s = legacyDDSupLib.number2text(coordLimits[coord].min + (drawH - (nextY - y1)) / drawH * coordLimits[coord].span, coordLimits[coord].span);
    		    }
    		    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    		    labelCtx.fillText(s, x1 + 3, nextY + fontSize - fontSize/2);
    		}
    	    } else {
    		for(var l = 1; l < coordLimits[coord].noofLabels - 1; l++) {
    		    nextY = y1 + coordLimits[coord].props[l] * drawH;
    		    s = coordLimits[coord].labels[l];
    		    var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    		    labelCtx.fillText(s, x1 + 3, nextY + fontSize - fontSize/2);
    		}
    	    }
    	}
    	labelCtx.restore();
    }
    
    function drawPolyLines(W,H) {
    	if(parsingDataNow) {
    	    return;
    	}

    	if(lineCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
    	    if(myCanvasElement.length > 0) {
    		lineCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no background canvas to draw on!");
    		return;
    	    }
    	}

    	if(lineCtx === null) {
    	    lineCtx = lineCanvas.getContext("2d");
    	}
	
    	lineCtx.clearRect(0,0, W,H);

    	if(ulineCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theULineCanvas');
    	    if(myCanvasElement.length > 0) {
    		ulineCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no background canvas to draw on!");
    		return;
    	    }
    	}

    	if(ulineCtx === null) {
    	    ulineCtx = ulineCanvas.getContext("2d");
    	}
	
    	ulineCtx.clearRect(0,0, W,H);

    	var drawPretty = true;
    	if(unique > quickRenderThreshold) {
    	    drawPretty = false;
    	    var rgba0 = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), 0.33);
    	    var imData = lineCtx.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
    	    var pixels = imData.data;

    	    var imData0 = ulineCtx.getImageData(0, 0, ulineCanvas.width, ulineCanvas.height);
    	    var pixels0 = imData0.data;
    	}

    	// vote 

    	for(var coord1 = 0; coord1 < onScreenCoordIdxToArrayIdx.length - 1; coord1++) {
    	    var c1 = onScreenCoordIdxToArrayIdx[coord1];
    	    var x1 = coordXpos[c1];

    	    var c2 = onScreenCoordIdxToArrayIdx[coord1 + 1];
    	    var x2 = coordXpos[c2];

    	    var votes = [];

    	    // vote on color on each possible line from coord 1 to coord 2
	    
    	    for(var i = 0; i < N; i++) {
    		var groupId = coordSelFuns[coord1](i);

    		var y1 = val2pixel(coordValFuns[c1](i), c1);
    		var y2 = val2pixel(coordValFuns[c2](i), c2);
		
    		while(votes.length <= y1) {
    		    votes.push([]);
    		}
    		while(votes[y1].length <= y2) {
    		    votes[y1].push([]);
    		}
    		try {
    		    while(votes[y1][y2].length <= groupId) {
    			votes[y1][y2].push(0);
    		    }
    		} catch(e) {
    		    debugLog("this should not happen!!");
    		    console.dir(e);
    		    console.dir(votes);
    		    console.dir(y1);
    		    console.dir(y2);
    		    console.dir(groupId);
    		}

    		votes[y1][y2][groupId]++;
    	    }
	    
    	    for(y1 = 0; y1 < votes.length; y1++) {
    		for(y2 = 0; y2 < votes[y1].length; y2++) {
    		    if(votes[y1][y2].length > 0) {
    			var ls = votes[y1][y2];
			
    			if(ls.length >= 1 && ls[0] > 0) { // draw unselected data line
			    
    			    var groupId = 0;

    			    if(transparency >= 1) {
    				var color = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), 0.33);
    			    } else {
    				var color = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency * 0.33);
    			    }
			    
    			    if(drawPretty) {
    				ulineCtx.save();
				
    				ulineCtx.lineWidth = 1;
    				ulineCtx.strokeStyle = "rgba(" + Math.floor(color[0]) + ", " + Math.floor(color[1]) + ", " + Math.floor(color[2]) + ", " + color[3] / 255 + ")";

    				ulineCtx.beginPath();
    				ulineCtx.moveTo(x1, y1);

    				ulineCtx.lineTo(x2, y2);
    				ulineCtx.stroke();

    				ulineCtx.restore();
    			    } else { // do not drawPretty
    				drawLineDDAfullalpha(pixels0, ulineCanvas.width, ulineCanvas.height, x1, y1, x2, y2, color[0], color[1], color[2], color[3]);
    			    }
    			}

    			if(ls.length > 1) {
    			    var noofGroups = 0;
    			    var noofVotes = 0;
    			    for(var groupId = 1; groupId < ls.length; groupId++) { 
    				if(ls[groupId] > 0) {
    				    noofGroups++;
    				    noofVotes += ls[groupId];
    				}
    			    }
			    
    			    var first = true;
    			    for(var groupId = 1; groupId < ls.length; groupId++) { 
    				if(ls[groupId] > 0) {
    				    if(noofGroups > 1) {
    					var thisColor = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency * ls[groupId] / noofVotes);
					
    					if(first) {
    					    first = false;
    					    color = thisColor;
    					} else {
    					    color = legacyDDSupLib.blendCols(color, thisColor);
    					}
    				    } else {
    					var color = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
    				    }
    				}
    			    }

    			    if(drawPretty) {
    				lineCtx.save();
				
    				lineCtx.lineWidth = 1;
    				lineCtx.strokeStyle = "rgba(" + Math.floor(color[0]) + ", " + Math.floor(color[1]) + ", " + Math.floor(color[2]) + ", " + color[3] / 255 + ")";

    				lineCtx.beginPath();
    				lineCtx.moveTo(x1, y1);

    				lineCtx.lineTo(x2, y2);
    				lineCtx.stroke();

    				lineCtx.restore();
    			    } else { // do not drawPretty
    				if(color[3] >= 255) {
    				    drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, color[0], color[1], color[2], color[3]);
    				} else {
    				    drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, color[0], color[1], color[2], color[3]);
    				}
    			    }
    			}
    		    }
    		}
    	    }
    	}
	
    	if(!drawPretty) {
            $timeout(function()
    		     {	
    			 lineCtx.putImageData(imData, 0, 0);
    		     }, 1);
            $timeout(function()
    		     {	
    			 ulineCtx.putImageData(imData0, 0, 0);
    		     }, 1);
    	}
    }




    // This line drawing function was copied from http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
    // The code is not original to me. I was very slightly modified by me.
    /// <summary>
    /// Draws a colored line by connecting two points using a DDA algorithm (Digital Differential Analyzer).
    /// </summary>
    function drawLineDDA(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha)
    {
    	var W = Math.floor(Width);
    	var H = Math.floor(Height);

    	var x1 = Math.round(X1);
    	var y1 = Math.round(Y1);
    	var x2 = Math.round(X2);
    	var y2 = Math.round(Y2);

        // Distance start and end point
        var dx = x2 - x1;
        var dy = y2 - y1;

        // Determine slope (absoulte value)
        var len = dy >= 0 ? dy : -dy;
        var lenx = dx >= 0 ? dx : -dx;
        if (lenx > len)
        {
            len = lenx;
        }

        // Prevent divison by zero
        if (len != 0)
        {
            // Init steps and start
            var incx = dx / len;
            var incy = dy / len;
            var x = x1;
            var y = y1;

            // Walk the line!
            for (var i = 0; i < len; i++)
            {
    		var ry = Math.round(y);
    		var rx = Math.round(x);
    		if(ry >= 0 && ry < H
    		   && rx >= 0 && rx < W) {

    		    var offset = (ry * W + rx) * 4;

    		    if(pixels[offset+3] > 0) {
    			// something drawn here already, blend alpha

    			var oldR = pixels[offset];
    			var oldG = pixels[offset+1];
    			var oldB = pixels[offset+2];

    			var oldA = pixels[offset+3] / 255.0;
    			var newA = alpha / 255.0;

    			var remainA = (1 - newA) * oldA;
			
    			var outA = newA + remainA;
    			if(outA > 0) {
    			    var outR = Math.min(255, (oldR * remainA + newA * r) / outA);
    			    var outG = Math.min(255, (oldG * remainA + newA * g) / outA);
    			    var outB = Math.min(255, (oldB * remainA + newA * b) / outA);
    			} else {
    			    var outR = 0;
    			    var outG = 0;
    			    var outB = 0;
    			}
    			pixels[offset] = outR;
    			pixels[offset+1] = outG;
    			pixels[offset+2] = outB;
    			pixels[offset+3] = Math.min(255, outA * 255);
    		    } else {
    			pixels[offset] = r;
    			pixels[offset+1] = g;
    			pixels[offset+2] = b;
    			pixels[offset+3] = alpha;
    		    }
    		}
                x += incx;
                y += incy;
            }
        }
    }

    function drawLineDDAfullalpha(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha)
    {
    	var W = Math.floor(Width);
    	var H = Math.floor(Height);

    	var x1 = Math.round(X1);
    	var y1 = Math.round(Y1);
    	var x2 = Math.round(X2);
    	var y2 = Math.round(Y2);

        // Distance start and end point
        var dx = x2 - x1;
        var dy = y2 - y1;

        // Determine slope (absoulte value)
        var len = dy >= 0 ? dy : -dy;
        var lenx = dx >= 0 ? dx : -dx;
        if (lenx > len)
        {
            len = lenx;
        }

        // Prevent divison by zero
        if (len != 0)
        {
            // Init steps and start
            var incx = dx / len;
            var incy = dy / len;
            var x = x1;
            var y = y1;

            // Walk the line!
            for (var i = 0; i < len; i++)
            {
    		var ry = Math.round(y);
    		var rx = Math.round(x);
    		if(ry >= 0 && ry < H
    		   && rx >= 0 && rx < W) {

    		    var offset = (ry * W + rx) * 4;

    		    pixels[offset] = r;
    		    pixels[offset+1] = g;
    		    pixels[offset+2] = b;
    		    pixels[offset+3] = alpha;
    		}
                x += incx;
                y += incy;
            }
        }
    }





    function updateSize() {
    	// debugLog("updateSize");

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

    	var bDirty = false;
    	if(bgCanvas === null) {
    	    bDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	if(bgCanvas.width != rw) {
    	    bDirty = true;
    	    bgCanvas.width = rw;
    	}
    	if(bgCanvas.height != rh) {
    	    bDirty = true;
    	    bgCanvas.height = rh;
    	}

    	var aDirty = false;
    	if(barCanvas === null) {
    	    aDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theBarCanvas');
    	    if(myCanvasElement.length > 0) {
    		barCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	if(barCanvas.width != rw) {
    	    aDirty = true;
    	    barCanvas.width = rw;
    	}
    	if(barCanvas.height != rh) {
    	    aDirty = true;
    	    barCanvas.height = rh;
    	}

    	var lDirty = false;
    	if(lineCanvas === null) {
    	    lDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
    	    if(myCanvasElement.length > 0) {
    		lineCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	if(lineCanvas.width != rw) {
    	    lDirty = true;
    	    lineCanvas.width = rw;
    	}
    	if(lineCanvas.height != rh) {
    	    lDirty = true;
    	    lineCanvas.height = rh;
    	}
	
    	if(ulineCanvas === null) {
    	    lDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theULineCanvas');
    	    if(myCanvasElement.length > 0) {
    		ulineCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	if(ulineCanvas.width != rw) {
    	    lDirty = true;
    	    ulineCanvas.width = rw;
    	}
    	if(ulineCanvas.height != rh) {
    	    lDirty = true;
    	    ulineCanvas.height = rh;
    	}

    	if(labelCanvas === null) {
    	    aDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theLabelCanvas');
    	    if(myCanvasElement.length > 0) {
    		labelCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
    	}
    	if(labelCanvas.width != rw) {
    	    aDirty = true;
    	    labelCanvas.width = rw;
    	}
    	if(labelCanvas.height != rh) {
    	    aDirty = true;
    	    labelCanvas.height = rh;
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
	
    	var W = selectionCanvas.width;
    	var H = selectionCanvas.height;

    	topMarg = topTopMarg + fontSize + headerMarg;

    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg - nullMarg;

    	var neededW = drawW;
    	for(var coord = 0; coord < coordXpos.length; coord++) {
    	    var right = Math.ceil(coordXpos[coord] + legacyDDSupLib.getTextWidthCurrentFont(labelCtx, coordNames[coord]) / 2);
    	    if(right > leftMarg + drawW) {
    		neededW = Math.max(neededW, Math.ceil(right - leftMarg));
    	    }
    	}
	
    	if(neededW > drawW) {
    	    $scope.set("DrawingArea:width", Math.ceil(leftMarg + rightMarg + neededW));
    	}
    	if(drawH < 50) {
    	    $scope.set("DrawingArea:height", Math.ceil(topMarg + 50 + bottomMarg + nullMarg));
    	}

    	// update selections
    	updateSelectionDisplaySizes();
	
    	updateGraphicsHelper(bDirty, lDirty, aDirty);


    	if(dropCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no drop canvas to resize!");
    	    }
    	}
    	if(dropCanvas) { 
    	    dropCanvas.width = rw;
    	    dropCanvas.height = rh;
    	}
    	updateDropZones(textColor, 0.3, false);
    }

    function updateSelectionDisplaySizes() {
    	for(coord = 0; coord < coordTypes.length && coord < selections.length; coord++) {
    	    for(sel = 0; sel < selections[coord].length; sel++) {
    		if(selections[coord][sel][4]) { // only null
    		    selections[coord][sel][0] = topMarg + drawH + nullMarg / 2;
    		    selections[coord][sel][1] = topMarg + drawH + nullMarg;
    		} else {
    		    if(coordTypes[coord] == 'string') {
    			var smallestInside = selections[coord][sel][2];
    			var largestInside = selections[coord][sel][3];

    			var top = topMarg;
    			if(smallestInside > 0) {
    			    top = Math.floor(topMarg + drawH * (coordLimits[coord].props[smallestInside] + coordLimits[coord].props[smallestInside - 1]) / 2);
    			}
    			var bottom = topMarg + drawH;
    			if(largestInside < coordLimits[coord].props.length - 1) {
    			    bottom = Math.ceil(topMarg + drawH * (coordLimits[coord].props[largestInside] + coordLimits[coord].props[largestInside + 1]) / 2);
    			}
    			selections[coord][sel][0] = top;
    			selections[coord][sel][1] = bottom;
    		    } else if(coordTypes[coord] == 'date') {
    			selections[coord][sel][0] = val2pixel(selections[coord][sel][2], coord);
    			selections[coord][sel][1] = val2pixel(selections[coord][sel][3], coord);
    		    } else { // number
    			selections[coord][sel][0] = val2pixel(selections[coord][sel][3], coord); // y-axis is flipped
    			selections[coord][sel][1] = val2pixel(selections[coord][sel][2], coord);
    		    }
		    
    		    if(selections[coord][sel][5]) {
    			selections[coord][sel][1] = topMarg + drawH + nullMarg;
    		    }
    		}
    	    }
    	}
    }


    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

	try {

    	    switch(eventData.slotName) {
	    case "ClearData": 
		if(eventData.slotValue) {
		    $scope.clearData();
		    $scope.set("ClearData",false);
		}
		break;

    	    case "Logarithmic": 
    		var newLs = $scope.gimme("Logarithmic");
    		if(newLs) {
    		    var newLog = [];
    		    for(var c = 0; c < onScreenCoordIdxToArrayIdx.length; c++) {
    			newLog.push(false);
    		    }
    		    for(c = 0; c < onScreenCoordIdxToArrayIdx.length; c++) {
    			if(c < newLs.length) {
    			    newLog[onScreenCoordIdxToArrayIdx[c]] = newLs[c];
    			}
    		    }
    		    if(!logarithmic || newLog.length != logarithmic.length) {
    			logarithmic = newLog;
    			updateSelectionDisplaySizes();
    			updateGraphicsHelper(false, true, true);
    		    } else {
    			for(c = 0; c < newLog.length; c++) {
    			    if(newLog[c] != logarithmic[c]) {
    				logarithmic = newLog;
				
    				updateSelectionDisplaySizes();
    				updateGraphicsHelper(false, true, true);
    				break;
    			    }
    			}
    		    }
    		}
    		break;

    	    case "InternalSelections":
    		if(eventData.slotValue != internalSelectionsInternallySetTo) {
    		    setSelectionsFromSlotValue();
    		}
    		break;

    	    case "SelectAll":
    		if(eventData.slotValue) {
    		    $scope.selectAll();
    		    $scope.set("SelectAll",false);
    		}
    		break;

    	    case 'LineTransparency':
    		var newVal = parseFloat($scope.gimme('LineTransparency'));
    		if(newVal < 0) {
    		    newVal = 0;
    		}
    		if(newVal > 1) {
    		    newVal = 1;
    		}
    		if(newVal != transparency) {
    		    transparency = newVal;
    		    updateGraphicsHelper(false, true, false);
    		}

    	    case "FontSize":
    		updateSize();
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
    	    case "UseGlobalColorGradients":
    		if(eventData.slotValue) {
    		    useGlobalGradients = true;
    		} else {
    		    useGlobalGradients = false;
    		}
    		updateGraphicsHelper(false, true, false);
    		break;
    	    case "PluginName":
    		$scope.displayText = eventData.slotValue;
    		break;
    	    case "ColorScheme":
    		colorPalette = null;
    		parseSelectionColors();
    		var colors = $scope.gimme("ColorScheme");
    		if(typeof colors === 'string') {
    		    colors = JSON.parse(colors);
    		}
    		currentColors = legacyDDSupLib.copyColors(colors);

    		updateGraphics();
    		break;
    	    };
	} catch(exc) {
	    debugLog("Something went wrong when we tried to react to slot changes");
	    console.dir(exc);
	}
    };



    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(Y1,Y2, coord, keepOld) {
    	// debugLog("newSelection");

    	if(Y1 > Y2) {
    	    y1 = Y2;
    	    y2 = Y1;
    	} else {
    	    y1 = Y1;
    	    y2 = Y2;
    	}
    	if(coord >= 0 && coord < coordXpos.length) {
    	    var includesNull = false;
    	    if(y2 > topMarg + drawH + nullMarg / 2) {
    		includesNull = true;
    	    }
	    
    	    var onlyNull = false;
    	    if(y1 > topMarg + drawH) {
    		onlyNull = true;
    		includesNull = true;
    	    }

    	    var newSel = [];
    	    if(onlyNull) {
    		newSel = [topMarg + drawH + nullMarg / 2, 
    			  topMarg + drawH + nullMarg,
    			  null,
    			  null,
    			  onlyNull,
    			  includesNull,
    			  coord,
    			  coordTypes[coord],
    			  coordTypes[coord]];
    	    } else {
    		if(coordTypes[coord] == 'string') {
    		    var prop1 = (y1 - topMarg) / drawH;
    		    var prop2 = (y2 - topMarg) / drawH;
		    
    		    var smallestInside = 0;
    		    var largestInside = 0;
    		    var somethingInside = false;
    		    for(var i = 0; i < coordLimits[coord].props.length; i++) {
    			if(prop1 <= coordLimits[coord].props[i] 
    			   && coordLimits[coord].props[i] <= prop2) {
    			    if(!somethingInside) {
    				somethingInside = true;
    				smallestInside = i;
    				largestInside = i;
    			    } else {
    				largestInside = i;
    			    }
    			} else if(coordLimits[coord].props[i] > prop2) {
    			    break;
    			}
    		    }
    		    if(somethingInside) {
    			var top = topMarg;
    			if(smallestInside > 0) {
    			    top = Math.floor(topMarg + drawH * (coordLimits[coord].props[smallestInside] + coordLimits[coord].props[smallestInside - 1]) / 2);
    			}
    			var bottom = topMarg + drawH;
    			if(largestInside < coordLimits[coord].props.length - 1) {
    			    bottom = Math.ceil(topMarg + drawH * (coordLimits[coord].props[largestInside] + coordLimits[coord].props[largestInside + 1]) / 2);
    			}
    			if(includesNull) {
    			    bottom = topMarg + drawH + nullMarg;
    			}

    			newSel = [top, bottom, smallestInside, largestInside, false, includesNull, coord, coordTypes[coord]];
    		    } else {
    			if(includesNull) {
    			    newSel = [topMarg + drawH + nullMarg / 2, 
    				      topMarg + drawH + nullMarg,
    				      null,
    				      null,
    				      true,
    				      includesNull,
    				      coord,
    				      coordTypes[coord]];
    			} else {
    			    newSel = [];
    			}
    		    }
    		} else if(coordTypes[coord] == 'date') {
    		    var v1 = coordLimits[coord].min;
    		    var v2 = coordLimits[coord].max;
    		    if(y1 < topMarg) {
    			y1 = topMarg;
    		    } else {
    			v1 = pixel2valSelect(y1, coord);
    		    }
    		    if(y2 > topMarg + drawH) {
    			y2 = topMarg + drawH;
    		    } else {
    			v2 = pixel2valSelect(y2, coord);
    		    }
    		    if(includesNull) {
    			y2 = topMarg + drawH + nullMarg;
    		    }
		    
    		    newSel = [y1, y2, v1, v2, false, includesNull, coord, coordTypes[coord]];
    		} else { // number
    		    var v1 = coordLimits[coord].min;
    		    var v2 = coordLimits[coord].max;
    		    if(y1 < topMarg) {
    			y1 = topMarg;
    		    } else {
    			v2 = pixel2valSelect(y1, coord); // flip y-axis
    		    }
    		    if(y2 > topMarg + drawH) {
    			y2 = topMarg + drawH;
    		    } else {
    			v1 = pixel2valSelect(y2, coord); // flip y-axis
    		    }
    		    if(includesNull) {
    			y2 = topMarg + drawH + nullMarg;
    		    }
		    
    		    newSel = [y1, y2, v1, v2, false, includesNull, coord, coordTypes[coord]]; // flip y-axis
    		}
    	    }
	    
    	    if(newSel != []) {
    		if(newSel[5]) { // includes null
    		    newSel[1] = topMarg + drawH + nullMarg;
    		}
		
    		var overlap = false;
    		if(keepOld) {
    		    for(var s = 0; s < selections[coord].length; s++) {
    			var sel = selections[coord][s];
    			if(sel[2] == newSel[2]
    			   && sel[3] == newSel[3]
    			   && sel[4] == newSel[4]
    			   && sel[5] == newSel[5]) {
    			    // debugLog("Ignoring selection because it overlaps 100% with already existing selection");
    			    overlap = true;
    			    break;
    			}
    		    }
    		}
		
    		if(!overlap) {
    		    if(!keepOld) {
    			selections[coord] = [];
    		    }
    		    selections[coord].push(newSel);
    		    drawSelections();
    		    updateLocalSelections(false);
    		    saveSelectionsInSlot();
    		}
    	    }
    	}
    };

    function selectAllOneCoord(coord) {
    	if(unique > 0 && coord >= 0 && coord < coordTypes.length)  {
    	    newSel = [];
    	    if(coordTypes[coord] == 'string') {
    		newSel = [topMarg, topMarg+drawH+nullMarg, 0, coordLimits[coord].noofLabels, false, true, coord, coordTypes[coord]];
    	    } else if(coordTypes[coord] == 'date') {
    		newSel = [topMarg, topMarg+drawH+nullMarg, coordLimits[coord].min, coordLimits[coord].max, false, true, coord, coordTypes[coord]];
    	    } else { // number
    		newSel = [topMarg, topMarg+drawH+nullMarg, coordLimits[coord].min, coordLimits[coord].max, false, true, coord, coordTypes[coord]];
    	    }
    	    selections[coord] = [newSel];
    	}
    }

    $scope.selectAll = function() {
    	if(unique <= 0) {
    	    selections = [];
    	} else {
    	    selections = [];
    	    for(coord = 0; coord < coordTypes.length; coord++) {
    		newSel = [];
    		if(coordTypes[coord] == 'string') {
    		    newSel = [topMarg, topMarg+drawH+nullMarg, 0, coordLimits[coord].noofLabels, false, true, coord, coordTypes[coord]];
    		} else if(coordTypes[coord] == 'date') {
    		    newSel = [topMarg, topMarg+drawH+nullMarg, coordLimits[coord].min, coordLimits[coord].max, false, true, coord, coordTypes[coord]];
    		} else { // number
    		    newSel = [topMarg, topMarg+drawH+nullMarg, coordLimits[coord].min, coordLimits[coord].max, false, true, coord, coordTypes[coord]];
    		}
    		selections.push([newSel]);
    	    }
    	}
    	drawSelections();
    	updateLocalSelections(true);
    	saveSelectionsInSlot();
    };

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
    		selectionColors.color = legacyDDSupLib.hexColorToRGBA(colors['selection']['color'], selectionTransparency);
    	    } else {
    		selectionColors.color = legacyDDSupLib.hexColorToRGBA('#FFA500', selectionTransparency); // orange
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
    			selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], legacyDDSupLib.hexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
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
	if(parsingDataNow) {
	    return;
	}

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

    	selectionCtx.fillStyle = selectionColors.grad;	    
    	selectionCtx.strokeStyle = selectionColors.border;

    	for(coord = 0; coord < coordTypes.length && coord < selections.length; coord++) {
    	    for(sel = 0; sel < selections[coord].length; sel++) {
    		var x1 = coordXpos[coord] - 10;
    		var w = 21;

    		var y1 = selections[coord][sel][0];
    		var y2 = selections[coord][sel][1];

    		selectionCtx.fillRect(x1, y1, w, y2 - y1);

    		selectionCtx.strokeRect(x1, y1, w, y2 - y1);
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

    function mousePosIsInSelectableArea(pos) {
    	if(pos.x > leftMarg - 5
    	   && pos.x <= leftMarg + drawW + 5
    	   && pos.y > topMarg - 5
    	   && pos.y <= topMarg + drawH + nullMarg + 5) {
    	    return true;
    	}
    	return false;
    };

    function mousePosIsInHeaderArea(pos) {
    	if(pos.x > leftMarg - 5
    	   && pos.x <= leftMarg + drawW + 5
    	   && pos.y < topMarg
    	   && pos.y > topTopMarg) {
    	    return true;
    	}
    	return false;
    };

    function mousePosIsJustAboveHeaderArea(pos) {
    	if(pos.x > leftMarg - 5
    	   && pos.x <= leftMarg + drawW + 5
    	   && pos.y > 0
    	   && pos.y < topTopMarg) {
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
    		    var coord = pixel2nearestCoord(currentMouse.x);
    		    if(coord < 0) {
    			// not near any coordinate
    			hoverText.style.display = "none";
    		    } else {
    			var val = pixel2valDisplay(currentMouse.y, coord);
    			var s = val;
    			if(val === null) {
    			    s = "[No Value]";
    			} else {
    			    if(coordTypes[coord] == 'number') {
    				if(coord < logarithmic.length && logarithmic[coord]) {
    				    s = legacyDDSupLib.number2text(val, Math.log(coordLimits[coord].max) - Math.log(coordLimits[coord].min));
    				} else {
    				    s = legacyDDSupLib.number2text(val, coordLimits[coord].span);
    				}
    			    } else if(coordTypes[coord] == 'date') {
    				s = legacyDDSupLib.date2text(val, coordLimits[coord].dateFormat);
    			    }
    			}
			
    			var textW = legacyDDSupLib.getTextWidthCurrentFont(labelCtx, s);
    			hoverText.style.font = fontSize + "px Arial";
    			hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
    			hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
    			hoverText.innerHTML = s;
    			hoverText.style.display = "block";
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
    		    var coord = clickStart.coord;
    		    if(coord >= 0 && coord < coordXpos.length) {
    			if(clickStart.select) {
    			    var x1 = coordXpos[coord] - 10;
    			    var w = 21;
			    
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
			    
    			    selectionRectCtx.save();
    			    selectionRectCtx.fillStyle = selectionColors.color;
    			    selectionRectCtx.fillRect(x1, y1, w, h);
    			    selectionRectCtx.strokeStyle = selectionColors.border;
    			    selectionRectCtx.strokeRect(x1, y1, w, h);
    			    selectionRectCtx.restore();
    			} else {
    			    drawCoordinateBarShadow(coord, currentMouse.x)
    			}
    		    } 
    		}
    	    }
    	}
    };

    var onMouseDown = function(e){
    	if(unique > 0) {
            if(e.which === 1){
    		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
    		$scope.dragNdropRepr = "Nothing to drag.";
    		$scope.dragNdropID = "No drag data.";
    		$scope.theView.find('.dragSrc').attr("id", "no drag data");
    		$scope.theView.find('.dragSrc').draggable( 'disable' );

    		if(mousePosIsInSelectableArea(currentMouse)) {
    		    var coord = pixel2nearestCoord(currentMouse.x);
    		    if(coord >= 0) {
    			clickStart = currentMouse;
    			clickStart.coord = coord;
    			clickStart.select = true;
    			if(e.ctrlKey || e.metaKey) {
    			    clickStart.ctrl = true;
    			} else {
    			    clickStart.ctrl = false;
    			}
			
    			selectionHolderElement.bind('mouseup', onMouseUp);
    			e.stopPropagation();
    		    }
    		} else if(mousePosIsInHeaderArea(currentMouse)) {
    		    var coord = pixel2nearestHeader(currentMouse.x);
    		    if(coord >= 0) {
    			clickStart = currentMouse;
    			clickStart.coord = coord;
    			clickStart.select = false;

    			selectionHolderElement.bind('mouseup', onMouseUp);
    			e.stopPropagation();
    		    }
    		} else if(mousePosIsJustAboveHeaderArea(currentMouse)) {
    		    var coord = pixel2nearestHeader(currentMouse.x);
    		    if(coord >= 0) {
    			$scope.theView.find('.dragSrc').draggable( 'enable' );

    			$scope.theView.find('.dragSrc').attr("id", dragZones[coord]);
    			$scope.dragNdropRepr = coordNames[coord];
    			$scope.dragNdropID = dragZones[coord];
    		    }
    		} else {
    		    clickStart = null;
    		}
            }
    	}
    };

    function moveCoord(coord, x) {
    	if(x < leftMarg) {
    	    x = leftMarg;
    	}
    	if(x > leftMarg + drawW) {
    	    x = leftMarg + drawW;
    	}
    	x = Math.floor(x);

    	if(coordXpos[coord] != x) {
    	    coordXpos[coord] = x;
	    
    	    var newOnScreenCoordIdxToArrayIdx = [];
    	    var ls = [];
    	    for(var c = 0; c < coordXpos.length; c++) {
    		ls.push([c, coordXpos[c]]);
    	    }
    	    ls.sort(function(a,b) { return a[1] - b[1]; });
	    
    	    for(var c = 0; c < coordXpos.length; c++) {
    		newOnScreenCoordIdxToArrayIdx[c] = ls[c][0];
    	    }
	    

    	    var displayList = [];
    	    for(var coord = 0; coord < coordNames.length; coord++) {
    		displayList.push(false);
    	    }

    	    var dirty = false;
    	    for(coord = 0; coord < coordNames.length; coord++) {
    		var oldC = onScreenCoordIdxToArrayIdx[coord];
    		var newC = newOnScreenCoordIdxToArrayIdx[coord];
    		if(newC < logarithmic.length) {
    		    displayList[coord] = logarithmic[newC];
    		} else {
    		    dirty = true;
    		}

    		if(oldC >= logarithmic.length
    		   || logarithmic[oldC] != displayList[coord]) {
    		    dirty = true;
    		}
    	    }

    	    onScreenCoordIdxToArrayIdx = newOnScreenCoordIdxToArrayIdx;
	    
    	    updateSize(); // necessary?
    	    updateGraphicsHelper(false, true, true);

    	    if(dirty) {
    		$scope.set("Logarithmic", displayList);
    	    }
    	}
    }

    function mouseUpOrOut(currentMouse, oldClickStart) {
    	selectionHolderElement.unbind('mouseup');
    	hideSelectionRect();

    	if(oldClickStart.select) {
    	    var y1 = currentMouse.y;
    	    var y2 = oldClickStart.y;

    	    if(y2 < y1) {
    		y1 = oldClickStart.y;
    		y2 = currentMouse.y;
    	    } 
	    
    	    if(y1 == y2) {
    		// selection is too small, disregard
    		// debugLog("ignoring a selection because it is too small");
    	    } else {
    		newSelection(y1,y2, oldClickStart.coord, oldClickStart.ctrl);
    	    }
    	} else {
    	    moveCoord(oldClickStart.coord, currentMouse.x);
    	}
    }

    var onMouseUp = function(e){
    	if(unique > 0) {
    	    // check new selection rectangle

    	    if(clickStart !== null) {
    		var cs = clickStart;
    		clickStart = null;
    		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

    		mouseUpOrOut(currentMouse, cs);
    	    }
    	}	
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
    		var cs = clickStart;
    		clickStart = null;
    		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
    		mouseUpOrOut(currentMouse, cs);
    	    }
    	}	
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

    	$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
    				grouping,
    				"Multiple Selections -> Different Groups",
    				'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
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

        // internal slots specific to this Webble -----------------------------------------------------------

        $scope.addSlot(new Slot('LineTransparency',
    				0.6,
    				"Line Transparency",
    				'Transparency can be set from 0 to 1. When there are many lines, using a lower transparency can make things clearer.',
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


        $scope.addSlot(new Slot('Logarithmic',
    				[],
    				"Use logarithmic scales",
    				'Used to set some bars to have logarithmic scales. Example: [true, false, false].',
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
    				'Input Slot. Mapping group numbers to colors.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));


        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',
    				"Parallel Coordinate Holder",
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

        $scope.addSlot(new Slot('InternalSelections',
    				{},
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

    	updateGraphicsHelper(true, true, true);

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
