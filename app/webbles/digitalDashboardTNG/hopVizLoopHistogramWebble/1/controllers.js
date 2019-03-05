//======================================================================================================================
// Controllers for HopVizLoopHistogram for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================
wblwrld3App.controller('loopHistogramPluginWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        // BackHolder: ['width', 'height']
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Loop Histograms";

    var myInstanceId = -1;
    
    var dataMappings = []; 
    var parsingDataNow = false;

    var selectAllNow = false;

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var dropCanvas = null;
    var dropCtx = null;
    
    var hoverText = null;

    var dataName = null;

    var grouping = true;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.533;

    var selectionHolderElement = null;
    var selectionRect = null;

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

    var leftShift = 0;
    var drawH = 1;
    var drawW = 1;
    var barW = 1;

    var useLogN = false;
    var useLogX = false;

    var maxCount = 0;
    var countLs = [];

    var internalSelectionsInternallySetTo = {};

    var dropZ = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'data', 'type':['number','date']}, "label":"Data", "rotate":false};
    var allDropZones = [dropZ];

    var dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZone];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";


    var weAreLooping = false;
    var weShouldBeLooping = false;
    $scope.loopCheckBoxStatus = false;
    
    $scope.loopCheckBoxChanged = function () {
	if($scope.loopCheckBoxStatus) {
	    debugLog("loop is now ON");
	    weShouldBeLooping = true;
	    if(!weAreLooping) {
		doTheLoop();
	    }
	} else {
	    weShouldBeLooping = false;
	    debugLog("loop is now OFF");
	}
    };

    function doTheLoop() {
	debugLog("do the loop()");
	weAreLooping = true;
	if(!weShouldBeLooping) {
	    weAreLooping = false;
	    return;
	}
	
	var stepSize = 1;
	stepSize = $scope.gimme("StepSize");
	if(stepSize <= 0) {
	    stepSize = 1;
	}
	if(stepSize === null || stepSize === undefined) {
	    stepSize = 1;
	}
	
	var stepTime = 5000;
	stepTime = $scope.gimme("StepTime");
	if(stepTime < 10) {
	    stepTime = 10;
	}
	if(stepTime === null || stepTime === undefined) {
	    stepTime = 5000;
	}


	for(var sel = 0; sel < selections.length; sel++) {
	    var newSel = selections[sel];
	    var val1 = newSel[0];
	    var val2 = newSel[1];

	    var leftI = -1;
	    var rightI = -1;
	    
	    for(var i = 0; i < countLs.length; i++) {
		var val = countLs[i][0];
		if(val1 <= val && val < val2) {
		    if(leftI < 0) {
			leftI = i;
		    }
		    rightI = i;
		}
	    }
	    
	    var is = rightI - leftI + 1;
	    
	    var nextLeft = Math.ceil(leftI + is * stepSize);

	    if(nextLeft >= countLs.length) { // loop around
		nextLeft = 0;
	    }

	    var nextRight = nextLeft + is - 1;
	    if(nextRight >= countLs.length) { // break at the end
		nextRight = countLs.length - 1;
		nextLeft = nextRight - is + 1;

		if(nextLeft < 0) { // if we have a selection larger than everything
		    nextLeft = 0;
		}


		if(nextLeft == leftI && nextRight == rightI) { // we are stuck in the same position as last time
		    nextLeft = 0;
		    nextRight = Math.min(countLs.length - 1, nextLeft + is - 1);
		}
	    }

	    selections[sel][0] = countLs[nextLeft][0];
	    if(nextRight < countLs.length - 1) {
		selections[sel][1] = countLs[nextRight + 1][0];
	    } else {
		selections[sel][1] = limits.max + 1;
	    }

	    selections[sel][2] = leftMarg + leftShift + nextLeft * barW;
	    selections[sel][3] = leftMarg + leftShift + (nextRight + 1) * barW;

	    drawSelections();
	    updateLocalSelections(false);
	    saveSelectionsInSlot();
	}

        $timeout(doTheLoop, stepTime);
    }
    


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
	$scope.theView.find('.canvasStuffForDigitalDashboardLoopHistogram').droppable({ 
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
	    $log.log("HopVizLoopHistograms: " + message);
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
	    return d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
	    break;
	case 'time':
	    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
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
	    result.selections.push({'min':selections[sel][0], 'max':selections[sel][1]});
	}

	internalSelectionsInternallySetTo = result;
	$scope.set('InternalSelections', result);
    }

    function setSelectionsFromSlotValue() {
	debugLog("setSelectionsFromSlotValue");
	
	var slotSelections = $scope.gimme("InternalSelections");
	if(typeof slotSelections === 'string') {
	    slotSelections = JSON.parse(slotSelections);
	}
	
	if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
	    // debugLog("setSelectionsFromSlotValue got identical value");
	    return;
	}

	if(slotSelections.hasOwnProperty("selections")) {
	    var newSelections = [];
	    
	    if(unique > 0) {
		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
		    var newSel = slotSelections.selections[sel];
		    
		    var val1 = newSel.min;
		    var val2 = newSel.max;

		    if(val2 < limits.min 
		       || val1 > limits.max) {
			// completely outside
			continue;
		    }
		    
		    val1 = Math.max(limits.min, val1);
		    val2 = Math.min(limits.max + 1, val2);
		    
		    var firstOverlap = true;
		    var v1 = val1;
		    var v2 = val2;
		    var v3 = 0;
		    var v4 = drawW;

		    for(var i = 0; i < countLs.length; i++) { 
			var val = countLs[i][0];
			// if(val >= val1 && (val < val2 || (val <= val2 && val2 == limits.max))) {
			if(val >= val1 && val < val2) {
			    // overlaps with selection
			    
			    // we may need to grow the selection
			    v1 = Math.min(countLs[i][0], v1); // this should never be necessary?
			    if(i < countLs.length - 1) {
				v2 = Math.max(countLs[i+1][0], v2);
			    } else {
				// v2 = Math.max(limits.max, v2);
				v2 = Math.max(limits.max + 1, v2);
			    }

    			    var x1 = leftMarg + leftShift + i * barW;
			    var x2 = x1 + barW;
			    
			    if(firstOverlap) {
				firstOverlap = false;
				v3 = x1;
				v4 = x2;
			    } else {
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
		
		// debugLog("new selections: " + JSON.stringify(newSelections));
		if(newSelections.length > 0) {
		    selections = newSelections;
		    updateLocalSelections(false);
		    drawSelections();
		}
	    } else { // no data
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

    function checkSelectionsAfterNewData() {
	// debugLog("checkSelectionsAfterNewData");

	var newSelections = [];

	for(var sel = 0; sel < selections.length; sel++) {
	    var newSel = selections[sel];
	    var val1 = newSel[0];
	    var val2 = newSel[1];


	    if(val1 <= limits.min && val2 > limits.max) {
	    	// covers everything
	    	return true; // give up
	    }
	    if(val2 < limits.min 
	       || val1 > limits.max) {
	    	// completely outside
	    	continue;
	    }
	
	    val1 = Math.max(limits.min, val1);
	    val2 = Math.min(limits.max + 1, val2);
	
	    var firstOverlap = true;

	    for(var i = 0; i < countLs.length; i++) { 
		var val = countLs[i][0];
		// if(val >= val1 && (val < val2 || (val <= val2 && val2 == limits.max))) {
		if(val >= val1 && val < val2) {
		    // overlaps with selection

		    // we may need to grow the selection
		    newSel[0] = Math.min(val, val1);
		    if(i < countLs.length - 1) {
			newSel[1] = Math.max(countLs[i+1][0], val2);
		    } else {
			// newSel[1] = Math.max(limits.max, val2);
			newSel[1] = Math.max(limits.max + 1, val2);
		    }


    		    var x1 = leftMarg + leftShift + i * barW;
		    var x2 = x1 + barW;

	    	    if(firstOverlap) {
	    		firstOverlap = false;
	    		newSel[2] = x1;
	    		newSel[3] = x2;
	    	    } else {
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

    function updateLocalSelections(selectAll) {
	// debugLog("updateLocalSelections");

	var dirty = false;
	
    	var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
    	if(newGrouping != grouping) {
    	    grouping = newGrouping;
    	    dirty = true;
    	}

	// debugLog("selections before sorting: " + JSON.stringify(selections));
	selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.
	// debugLog("selections after sorting: " + JSON.stringify(selections));

	if(!selectAll) {
	    if(selections.length == 1
	       && selections[0] <= limits.min
	       && selections[1] >= limits.max) {
		selectAll = true;
	    }
	}

	selectAllNow = selectAll;

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

	var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
	var nullGroup = 0;
	if(!nullAsUnselected) {
	    nullGroup = selections.length + 1; // get unused groupId
	}

	var groupId = 0;

    	if(dataMappings[src].active) {
    	    var val = dataMappings[src].funV(idx);
	    if(val === null) {
		groupId = nullGroup;
	    } else {
		if(selectAllNow) {
		    groupId = 1;
		} else {

		    // ----------- 
		    // ugly hack for some weird data in the Himawari data sets, fix later
		    if(dataType == 'number' && val < -999999999) {
			val = 0;
		    }
		    // ----------- 

		    if(dataType == 'date' && val instanceof Date) {
			val = val.getTime();
		    }
			    
		    for(var span = 0; span < selections.length; span++) {
			if(selections[span][0] <= val
			   && val < selections[span][1]) {
			    groupId = span + 1;
			    break;
			}
		    }
	        } // not null
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
	dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};

	limits = {max:0, min:0};
	unique = 0;
	NULLs = 0;
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
    	try {
	    parsingDataNow = true;

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

    		if(targetField.name == "data") {
    		    dragZone.ID = JSON.stringify(dataSourceInfo);
    		    dragZone.name = dataSourceInfo.fieldName;
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
	    
    	    for(var f = 0; f < dataMappings[src].map.length; f++) {
		var fieldInfo = null;
		if(dataMappings[src].map[f].srcIdx < ls.length) {
    		    fieldInfo = ls[dataMappings[src].map[f].srcIdx];
		}

    		if(dataMappings[src].map[f].name == "data") {
    		    if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropZ.forMapping.type)) {
    			typeError = true;
    			dataMappings[src].map[f].active = false;
    		    } else {
    			dataMappings[src].map[f].listen = fieldInfo.listen;
    			dataMappings[src].map[f].active = true;
    			haveData = true;
    			dataName = shortenName(fieldInfo.name);
    		    }
    		}
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

    function includes(ls, elem) {
    	for(var i = 0; i < ls.length; i++) {
    	    if(ls[i] == elem) {
    		return true;
    	    }
    	}
    	return false;
    }

    function parseData() {
	debugLog("parseData");

    	parsingDataNow = true;

	var dataIsCorrupt = false;

    	var first = true;
	
    	for(var src = 0; src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
		
    		var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    		var ls = w.scope().gimme(dataMappings[src].slotName);
		
    		var sizeD = 0;
		
    		for(var f = 0; f < dataMappings[src].map.length; f++) {
    		    var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    		    dataMappings[src].map[f].listen = fieldInfo.listen;


    		    if(dataMappings[src].map[f].name == "data") {
    			sizeD = fieldInfo.size;
    			dataMappings[src].funV = fieldInfo.val;
    			dataMappings[src].funSel = fieldInfo.sel;
    			dataMappings[src].newSelections = fieldInfo.newSel;
    			dataMappings[src].size = fieldInfo.size;

    			if(first) {
    			    first = false;

    			    if(includes(fieldInfo.type, "date")) {
    				dataType = 'date';
    			    } else {
    				dataType = 'number';
			    }
    			} else {
    			    if(includes(fieldInfo.type, "date")) {
    				if(dataType != 'date') {
    				    dataIsCorrupt = true;
				}				    
    			    } else {
    				if(dataType != 'number') {
    				    dataIsCorrupt = true;
				}
			    }
			}
		    } // if the field is the data field
		} // for each field from this src
	    } // if src is active
	} // for each src	


    	for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
    		var fx = dataMappings[src].funV;
    		var firstNonNullData = true;
		var minVal = 0;
		var maxVal = 0;
		
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

    			if(firstNonNullData) {
    			    firstNonNullData = false;

    			    minVal = val;
    			    maxVal = val;
			    
    			} else {
    			    minVal = Math.min(minVal, val);
    			    maxVal = Math.max(maxVal, val);
			}
		    } else {
			NULLs += 1;
		    }
		} // for each data item

    		if(firstNonNullData) {
    		    dataIsCorrupt = true; // only null values
    		}
	    } // if src is active
	} // for each src

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
    	if(parsingDataNow) {
    	    return;
    	}

    	debugLog("updateGraphics()");

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
	drawHistogram(W, H);
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

	    dropZ.left = leftMarg;
	    dropZ.top = topMarg;
	    dropZ.right = leftMarg + drawW;
	    dropZ.bottom =  topMarg + drawH;

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
	
	ctx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);


	if(unique > 0) {
	    var lastRight = 0;
	    var ls = countLs;

	    for(var i = 0; i < ls.length; i++) {
		var pos = leftMarg + leftShift + i*barW;
		if(lastRight > pos) {
		    continue;
		}

		var text = "";
		var val = ls[i][0];
		if(dataType == 'date') {
		    text = date2text(val);
		} else {
		    if(val < 10) {
			text = val.toPrecision(3);
		    } else if(val < 100) {
			text = val.toString();
		    } else if(val < 10000) {
			text = Math.floor(val.toString());
		    } else {
			text = val.toPrecision(3);
		    }
		}
		
		var textW = getTextWidthCurrentFont(text);
		
		var leftPos = Math.floor(pos + barW / 2 - textW / 2);
		if(leftPos > lastRight)  {
    		    ctx.fillText(text, leftPos, topMarg + drawH + fontSize + 1);
		    ctx.fillRect(Math.floor(pos + barW / 2), topMarg + drawH - 3, 1, 6);
		    lastRight = leftPos + textW + 1;
		}
            }
	}


    	// Y Axis

	ctx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);


	if(unique > 0) {
            var noofSteps = 5;
            if (drawH < 100)
            {
		noofSteps = 3;
            }
            if (drawH > 300)
            {
		noofSteps = Math.floor(drawH / 75);
            }

            var step = maxCount / noofSteps;

            if (step < 1)
            {
		step = 1;
            }

	    step = Math.floor(step);

            if (step != 0)
            {
		for (var i = 0; i <= maxCount; i += step)
		{
		    if(i < 10000) {
			var text = i.toString();
		    } else {
			var text = i.toPrecision(3);
		    }

		    var textW = getTextWidthCurrentFont(text);

		    var hp = topMarg + drawH - i * drawH / maxCount;
		    if(useLogN) {
			hp = topMarg + drawH - Math.log(1 + i) / Math.log(1 + maxCount) * drawH;
		    }
		    if(leftMarg > textW + 5) {
    			ctx.fillText(text, leftMarg - 6 - textW, hp + fontSize/2);
		    } else {
			ctx.fillText(text, 0, hp + fontSize/2);
		    }
		    ctx.fillRect(leftMarg - 5, hp, 6, 1);
		}
            }
	}


	// top label

	var str = "";
	var xw = -1;

	if(dataName !== null) {
	    str = dataName;
	    xw = getTextWidthCurrentFont(dataName);
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
		dragZone = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dragZone.name, 'ID':dragZone.ID};
	    }
	    allDragNames = [dragZone];
	}
    }

    function insertSorted(val, vec, groupId) {
	if(vec.length <= 0) {
	    vec.push([val, 1, [[groupId, 1]]]);
	} else if(vec[0][0] > val) {
	    vec.splice(0, 0, [val, 1, [[groupId, 1]]]);
	} else if(vec[vec.length - 1][0] < val) {
	    vec.push([val, 1, [[groupId, 1]]]);
	} else {
	    insertSortedHelper(val, vec, 0, vec.length - 1, groupId);
	}
    }

    function insertSortedHelper(val, ls, start, end, groupId) {
	if(start >= end) {
	    if(ls[start][0] == val) {
		ls[start][1] = ls[start][1] + 1;
		
		var found = false;
		for(var i = 0; i < ls[start][2].length; i++) {
		    if(ls[start][2][i][0] == groupId) {
			found = true;
			ls[start][2][i][1] = ls[start][2][i][1] + 1;
			break;
		    }
		}
		if(!found) {
		    ls[start][2].push([groupId, 1]);
		}
			
	    } else {
		if(ls[start][0] > val) {
		    ls.splice(start, 0, [val, 1, [[groupId, 1]]]);
		} else {
		    ls.splice(start + 1, 0, [val, 1, [[groupId, 1]]]);
		}
	    }
	} else {
	    var mid = Math.floor((start + end) / 2);
	    if(ls[mid][0] == val) {
		ls[mid][1] = ls[mid][1] + 1;
		
		for(var i = 0; i < ls[mid][2].length; i++) {
		    if(ls[mid][2][i][0] == groupId) {
			found = true;
			ls[mid][2][i][1] = ls[mid][2][i][1] + 1;
			break;
		    }
		}

	    } else {
		if(ls[mid][0] < val) {
		    insertSortedHelper(val, ls, mid+1, end, groupId);
		} else {
		    insertSortedHelper(val, ls, start, mid-1, groupId);
		}
	    }
	}
    }

    function drawHistogram(W, H) {
	if(unique <= 0) {
	    return;
	}
	// debugLog("drawBarsSilverlight");

    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	useLogN = $scope.gimme('UseLogaritmicCounts');
    	useLogX = $scope.gimme('UseLogaritmicX');
	
    	leftShift = 0;

    	var min = limits.min;
    	var max = limits.max;

	var ls = [];
	var needToMerge = false;

    	for(var src = 0; !needToMerge && src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
    		var fx = dataMappings[src].funV;
    		var fsel = dataMappings[src].funSel;

    		for(var i = 0; !needToMerge && i < dataMappings[src].size; i++) {
    		    var d = fx(i);

		    if(d === null) {
			continue;
		    }

		    if(dataType == 'date' && d !== null && d instanceof Date) {
			try {
			    var temp = d.getTime();
			    d = temp;
			} catch(e) { }
		    }

                    var groupId = fsel(i);
		    
		    insertSorted(d, ls, groupId);

		    if(ls.length > drawW) {
			needToMerge = true;
		    }
		}
            }
    	}

	if(needToMerge) {
	    ls = [];

	    limits.span = limits.max - limits.min;
	    if(limits.span == 0) {
		limits.span = 1;
	    }

    	    for(var src = 0; src < dataMappings.length; src++) {
    		if(dataMappings[src].active) {
    		    var fx = dataMappings[src].funV;
    		    var fsel = dataMappings[src].funSel;

    		    for(var i = 0; i < dataMappings[src].size; i++) {
    			var d = fx(i);

			if(d === null) {
			    continue;
			}

			if(dataType == 'date' && d !== null && d instanceof Date) {
			    try {
				var temp = d.getTime();
				d = temp;
			    } catch(e) { }
			}

			var groupId = fsel(i);

			d = Math.floor((d - limits.min) / (limits.span) * drawW) * (limits.span / drawW) + limits.min;
			
			insertSorted(d, ls, groupId);

			if(ls.length > drawW) {
			    needToMerge = true;
			}
		    }
		}
    	    }
	}
	
	// if(ls.length > drawW) {
	//     // need to merge

	//     // make one bar one pixel wide
	//     var ls2 = [];
	//     for(var i = 0; i < drawW; i++) {
	// 	ls2.push([limits.min + i / drawW * (limits.max - limits.min), 0, []])
	//     }

	//     for(var i = 0; i < ls.length; i++) {
	// 	if(ls[i][0] < ls2[0][0]) {
	// 	    ls2[0][1] += ls[i][1];
	// 	    ls2[0][0] = ls[i][0];
	// 	} else if(ls[i][0] >= ls2[ls2.length - 1][0]) {
	// 	    ls2[ls2.length - 1][1] += ls[i][1];
	// 	} else {
	// 	    for(var j = 0; j < ls2.length - 1; j++) { 
	// 		if(ls[i][0] >= ls2[j][0] && ls[i][0] <= ls2[j + 1][0]) {
	// 		    ls2[j][1] += ls[i][1];

	// 		    for(var k = 0; k < ls[i][2].length; k++) {
	// 			var found = false;
	// 			for(var l = 0; !found && l < ls2[j][2].length; l++) {
	// 			    if(ls[i][2][k][0] == ls2[j][2][l][0]) {
	// 				found = true;
	// 				ls2[j][2][l][1] += ls[i][2][k][0];
	// 			    }
	// 			}
	// 			if(!found) {
	// 			    ls2[j][2].push([ls[i][2][k][0], ls[i][2][k][1]]);
	// 			}
	// 		    }

	// 		    break;
	// 		}
	// 	    }
	// 	}
	//     }	
	    
	//     ls = ls2;
	// }
	
	maxCount = 0;
	
	for(var i = 0; i < ls.length; i++) {
	    maxCount = Math.max(maxCount, ls[i][1]);
	}

	if(ls.length < drawW) {
	    barW = Math.floor(drawW / ls.length);
	} else {
	    barW = 1;
	}

        leftShift = Math.floor((drawW - ls.length * barW) / 2);
        if (leftShift < 0)
        {
            leftShift = 0;
        }

	countLs = ls;

	for(var i = 0; i < ls.length; i++) {
	    
	    var count = ls[i][1];
	    
	    if(count > 0) {

		if (useLogN)
		{
		    var he = drawH * Math.log(1 + count) / Math.log(1 + maxCount);
		} else {
		    var he = drawH * count / maxCount;
		}

		var x1 = leftMarg + leftShift + i * barW;
		var x2 = x1 + barW;
		var y1 = topMarg + drawH;
		var y2 = topMarg + drawH - he;

		// var transp = 1;
		// if(groupId <= 0) {
		//     transp *= 0.33;
		// }
    		// var c = getGradientColorForGroup(groupId, x1,y1,x2,y2, transp);
    		// var c = getGradientColorForGroup(groupId, x1,y2,x2,y1, transp);

    		// ctx.fillStyle = c;
		var lastTop = Math.floor(y2);
		for(var j = 0; j < ls[i][2].length; j++) {
		    var groupId = ls[i][2][j][0];
		    var cc = ls[i][2][j][1];

		    var yy2 = lastTop + 1;
		    var yy1 = yy2 + Math.floor(cc / count * he);

		    lastTop = yy1;
		    if(j == ls[i][2].length - 1) {
			yy1 = y1;
		    }

		    var transp = 1;
		    if(groupId <= 0) {
		        transp *= 0.33;
		    }
    		    var c = getGradientColorForGroup(groupId, x1,y2,x2,y1, transp);
    		    ctx.fillStyle = c;
    		    ctx.fillRect(x1,yy1,x2 - x1, yy2 - yy1);
		}

		if(barW > 2) {
    		    ctx.fillStyle = textColor;
    		    // c = hexColorToRGBA(getColorForGroup(groupId), transp);
    		    // ctx.fillStyle = c;
    		    ctx.fillRect(x1,y1,x2-x1,1); // top
    		    ctx.fillRect(x1,y1,1,y2-y1); // left
    		    ctx.fillRect(x1,y2-1,x2-x1,1); // bottom
    		    ctx.fillRect(x2-1,y1,1,y2-y1); // right
		}
	    }
	}
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

    	    case "TreatNullAsUnselected":
    		updateLocalSelections(false);
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
    	    case "UseLogaritmicCounts":
		if(eventData.slotValue) {
		    if(!useLogN) {
			useLogN = true;
    			updateGraphics();
		    }
		} else {
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
		} else {
		    if(useLogX) {
			useLogX = false;
    			updateGraphics();
		    }
		}
    		break;
    	    case "UseGlobalColorGradients":
		if(eventData.slotValue) {
		    useGlobalGradients = true;
		} else {
		    useGlobalGradients = false;
		}
    		updateGraphics();
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

    function newSelection(xPos1, xPos2, keepOld) {
	// debugLog("newSelection");

	if(unique > 0) {
	    var firstOverlap = true;
	    var newSel = [limits.min, limits.max + 1, leftMarg, leftMarg + drawW];
	    
	    var coversAll = true;
	    for(var i = 0; i < countLs.length; i++) {
    	    	var x1 = leftMarg + leftShift + i * barW;
	    	var x2 = x1 + barW;

    	    	if(xPos1 <= x2 && x1 <= xPos2) {
	    	    // overlaps with selection
	    	    if(firstOverlap) {
	    		firstOverlap = false;
	    		newSel[0] = countLs[i][0];
			if(i < countLs.length - 1) {
	    		    newSel[1] = countLs[i+1][0];
			} else {
	    		    newSel[1] = limits.max + 1;
			}
	    		newSel[2] = x1;
	    		newSel[3] = x2;
	    	    } else {
	    		newSel[0] = Math.min(countLs[i][0], newSel[0]);
			if(i < countLs.length - 1) {
	    		    newSel[1] = Math.max(countLs[i+1][0], newSel[1]);
			} else {
			    newSel[1] = limits.max + 1;
			}

	    		if(newSel[2] > x1) {
	    		    newSel[2] = x1;
	    		}
	    		if(newSel[3] < x2) {
	    		    newSel[3] = x2;
	    		}
	    	    }
	    	} else {
	    	    coversAll = false;
	    	}
	    }

	    if(firstOverlap) {
	    	// debugLog("Ignoring selection because nothing was selected");
	    } else {
	    	if(!keepOld) {
	    	    selections = [];
	    	}

	    	var overlap = false;
	    	for(var s = 0; s < selections.length; s++) {
	    	    var sel = selections[s];
	    	    if(sel[0] == newSel[0]
	    	       && sel[1] == newSel[1]
	    	       && sel[2] == newSel[2]
	    	       && sel[3] == newSel[3]
	    	      ) {
	    		// debugLog("Ignoring selection because it overlaps 100% with already existing selection");
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

    function updateSelectionRectangles() {
	var dirty = false;

	for(var sel = 0; sel < selections.length; sel++) {
	    var newSel = selections[sel];
	    var val1 = newSel[0];
	    var val2 = newSel[1];
	
	    var firstOverlap = true;

	    for(var i = 0; i < countLs.length; i++) {
		var val = countLs[i][0];
		// if(val >= val1 && (val < val2 || (val <= val2 && val2 == limits.max))) {
		if(val >= val1 && val < val2) {
		    // overlaps with selection
		    
		    // we may need to grow the selection
		    newSel[0] = Math.min(val, val1);
		    if(i < countLs.length - 1) {
			newSel[1] = Math.max(countLs[i+1][0], val2);
		    } else {
			// newSel[1] = Math.max(limits.max, val2);
			newSel[1] = Math.max(limits.max + 1, val2);
		    }
	
		    if(newSel[0] != val1
		       || newSel[1] != val2) {
			dirty = true;
		    }

    	    	    var x1 = leftMarg + leftShift + i * barW;
	    	    var x2 = x1 + barW;

		    if(firstOverlap) {
			firstOverlap = false;
			newSel[2] = x1;
			newSel[3] = x2;
		    } else {
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

	drawSelections();
	
	if(dirty) {
	    updateLocalSelections(false);
	    saveSelectionsInSlot();
	}
    }

    $scope.selectAll = function() {
	if(unique <= 0) {
	    selections = [];
	} else {
	    selections = [[limits.min, limits.max + 1, leftMarg, leftMarg + drawW, true]];
	}
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
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

    function hexColorToRGBA(color, alpha) {
	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = parseInt(color.substr(1,2), 16);
	    var g = parseInt(color.substr(3,2), 16);
	    var b = parseInt(color.substr(5,2), 16);

	    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
	}
	return color;
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
		try {
		    var temp = hexColorToRGBA(selectionColors.border, 0.8);
		    selectionColors.border = temp;
		} catch(e) {
		    // if it does not work, live with a non-transparent border
		}

	    } else {
		// selectionColors.border = '#FFA500'; // orange
		selectionColors.border = hexColorToRGBA('#FFA500', 0.8);
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
	if(pos !== null && unique > 0) {
	    for(var i = 0; i < countLs.length; i++) {

		var x1 = leftMarg + leftShift + i * barW;
		var x2 = x1 + barW;
		var y1 = topMarg + drawH;

		var count = countLs[i][1]

		if (useLogN)
		{
		    var he = drawH * Math.log(1 + count) / Math.log(1 + maxCount);
		} else {
		    var he = drawH * count / maxCount;
		}

		if(x1 <= pos.x && pos.x <= x2) {
		    if(y1 + 5 >= pos.y && pos.y >= y1-he - 10) {
			return i;
		    } else {
			return -1;
		    }
		}
	    }
	}
	return -1;
    }

    function mousePosIsInSelectableArea(pos) {
	if(pos.x >= leftMarg 
	   && pos.x <= leftMarg + drawW
	   && pos.y >= topMarg
	   && pos.y <= topMarg + drawH) {
	    return true;
	}
	return false;
    }

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
		    } else {
			var s = "";
			
			if(dataType == 'date') {
			    s = date2text(countLs[idx][0]) + " --> " + countLs[idx][1];
			} else {
			    s = countLs[idx][0].toPrecision(3) + " --> " + countLs[idx][1];
			}
			var sNoMarkUp = s;

			var textW = getTextWidthCurrentFont(sNoMarkUp);
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

        $scope.addSlot(new Slot('StepTime',
				5000,
				"Step Time",
				'The time to show one selected subset of data before moving on to the next (in milliseconds).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	
        $scope.addSlot(new Slot('StepSize',
				1,
				"Step Size",
				'The step to slide the selection window when moving on to the next subset of data, in multiples of the selected window size. A value of 1 thus means start the new selection where the current selection ends. 0.5 means move the sliding window half the width of the window.',
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
				false,
				"Treat Null as Unselected",
				'Group data items with no value together with items that are not selected (otherwise they get their own group).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        // internal slots specific to this Webble -----------------------------------------------------------


        $scope.addSlot(new Slot('UseGlobalColorGradients',
				false,
				"Use Global Color Gradients",
				'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
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

        $scope.addSlot(new Slot('PluginName',                  // Name
				"Loop Histogram",                              // Value
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


    // TODO: POSSIBLE ADDITIONAL CUSTOM METHODS
    //========================================================================================
    // Custom template specific methods is very likely to be quite a few of in every Webble,
    // and they contain what ever the developer want them to contain.
    //========================================================================================
    // "Public" (accessible outside this controller)
    //    $scope.[CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }

    // "Private" (accessible only inside this controller)
    //    var [CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }
    //========================================================================================


    // TODO: POSSIBLE OVERRIDING WEBBLE CORE METHODS WITH CUSTOM PARTS
    //========================================================================================
    // In 99% of all Webble development there is probably no need to insert custom code inside
    // a Webble core function or in any way override Webble core behavior, but the possibility
    // exists as shown below if special circumstance and needs arise.
    //========================================================================================
    //    $scope.[NEW METHOD NAME] = $scope.$parent.[PARENT METHOD]   //Assign the Webble core method to a template method caller
    //
    //    $scope.$parent.[PARENT METHOD] = function([PARAMETERS]){    //Assign a new custom method to th Webble Core
    //        [CUSTOM CODE HERE]
    //
    //        $scope.[NEW METHOD NAME]();                             //Call the original function, in order to not break expected behavior
    //
    //        [MORE CUSTOM CODE HERE]
    //    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
