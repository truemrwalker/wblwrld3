//======================================================================================================================
// Controllers for Hands-on Portal visualization using Life Tables for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizLifeTableWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Life Table";

    var myInstanceId = -1;
    
    var dataMappings = []; 

    // graphics

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var dropCanvas = null;
    var dropCtx = null;
    
    var hoverText = null;

    var dataName = "";

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    // layout
    var leftMarg = 35;
    var topMarg = 20;
    var rightMarg = 30;
    var bottomMarg = 5;
    var fontSize = 11;

    var colorPalette = null;
    
    var useGlobalGradients = false;
    var usePercent = true;

    var grouping = true;

    var clickStart = null;

    var haveFollowUp = false;

    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
    var unique = 0; // number of data points with non-null values
    var NULLs = 0;

    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;

    var lastSeenData = "";

    var dataType = "number";

    var internalSelectionsInternallySetTo = {};

    var parsingDataNow = false;

    var textColor = "#000000";

    var dropTTDeath = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"Time to Death", "rotate":true, "forMapping":{'name':'Time to Death', 'type':['number']}};
    var dropTTLFU = {'left':leftMarg, 'top':topMarg*2, 'right':leftMarg*2, 'bottom':topMarg * 3, "label":"Time to LFU", "rotate":true, "forMapping":{'name':'Time to Last Follow-Up', 'type':['number']}};
    var dropTofDeath = {'left':leftMarg, 'top':topMarg*3, 'right':leftMarg*2, 'bottom':topMarg * 4, "label":"Date of Death", "rotate":true, "forMapping":{'name':'Date of Death', 'type':['date']}};
    var dropTofLFU = {'left':leftMarg, 'top':topMarg*4, 'right':leftMarg*2, 'bottom':topMarg * 5, "label":"Date of LFU", "rotate":true, "forMapping":{'name':'Date of Last Follow-Up', 'type':['date']}};
    var dropTofDia = {'left':leftMarg, 'top':topMarg*5, 'right':leftMarg*2, 'bottom':topMarg * 6, "label":"Date of Diagnosis", "rotate":false, "forMapping":{'name':'Date of Diagnosis', 'type':['date']}};

    var allDropZones = [dropTTDeath, dropTTLFU, dropTofDeath, dropTofLFU, dropTofDia];

    var dropTTDeathInfo = {};
    var dropTofDeathInfo = {};
    

    var dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZone];
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
    	$scope.theView.find('.canvasStuffForhopVizLifeTable').droppable({ 
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
    				// debugLog("Last one, stop listening to " + dataMappings[mapSrcIdx].map[i].name);

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

    		if(targetField.name == "Time to Death") {
    		    dropTTDeathInfo = JSON.stringify(dataSourceInfo);
    		} 
    		if(targetField.name == "Date of Death") {
    		    dropTofDeathInfo = JSON.stringify(dataSourceInfo);
    		} 

    		if(somethingChanged) {
    		    checkMappingsAndParseData();
    		}

    	    } else {
    		debugLog(dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
    	    }
    	} catch(e) {
    	    // probably not something for us, ignore this drop
    	}
    }

    function checkMappingsAndParseData() {
    	debugLog("checkMappingsAndParseData");

    	parsingDataNow = true;

    	var somethingChanged = false;

    	var atLeastOneActive = false;

    	var firstActiveSource = true;

    	for(var src = 0; src < dataMappings.length; src++) {

    	    var haveDeathNum = false;
    	    var haveDeathDate = false;
    	    var lenDN = 0;
    	    var lenDD = 0;

    	    haveFollowUp = false;

    	    var haveDiagnosisDate = false;
    	    var lenDDD = 0;

    	    var haveFuNum = false;
    	    var haveFuDate = false;
    	    var lenDN = 0;
    	    var lenFD = 0;

    	    var corrupt = false;

    	    var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    	    var ls = w.scope().gimme(dataMappings[src].slotName);
	    
    	    for(var f = 0; f < dataMappings[src].map.length; f++) {
		if(dataMappings[src].map[f].srcIdx < ls.length) {
    		    var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
		}

    		if(dataMappings[src].map[f].name == 'Time to Death') {
    		    if(dataMappings[src].map[f].srcIdx < ls.length
    		       && typeCheck(fieldInfo.type, dropTTDeath.forMapping.type)) {
    			haveDeathNum = true;
    			lenDN = fieldInfo.size;
    		    }
    		}

    		if(dataMappings[src].map[f].name == 'Date of Death') {
    		    if(dataMappings[src].map[f].srcIdx < ls.length
    		       && typeCheck(fieldInfo.type, dropTofDeath.forMapping.type)) {
    			haveDeathDate = true;
    			lenDD = fieldInfo.size;
    		    }
    		}

    		if(dataMappings[src].map[f].name == 'Time to Last Follow-Up') {
    		    if(dataMappings[src].map[f].srcIdx < ls.length
    		       && typeCheck(fieldInfo.type, dropTTLFU.forMapping.type)) {
    			haveFuNum = true;
    			lenFN = fieldInfo.size;
    		    }
    		}

    		if(dataMappings[src].map[f].name == 'Date of Last Follow-Up') {
    		    if(dataMappings[src].map[f].srcIdx < ls.length
    		       && typeCheck(fieldInfo.type, dropTofLFU.forMapping.type)) {
    			haveFuDate = true;
    			lenFD = fieldInfo.size;
    		    }
    		}

    		if(dataMappings[src].map[f].name == 'Date of Diagnosis') {
    		    if(dataMappings[src].map[f].srcIdx < ls.length
    		       && typeCheck(fieldInfo.type, dropTofDia.forMapping.type)) {
    			haveDiagnosisDate = true;
    			lenDDD = fieldInfo.size;
    		    }
    		}
    	    }
	    
    	    var canActivate = false;
	    
    	    if(firstActiveSource) {

    		if(haveDeathNum) {
    		    canActivate = true;
    		    atLeastOneActive = true;
    		    haveFollowUp = false;
    		    dataType = 'number';
    		}

    		if(haveDiagnosisDate && haveDeathDate && lenDD == lenDDD) {
    		    canActivate = true;
    		    atLeastOneActive = true;
    		    haveFollowUp = false;
    		    dataType = 'date';
    		}

    		if(haveDiagnosisDate && haveDeathDate && haveFuDate && lenDD == lenFD && lenDD == lenDDD) {
    		    canActivate = true;
    		    atLeastOneActive = true;
    		    haveFollowUp = true;
    		    dataType = 'date';
    		}

    		if(haveDeathNum && haveFuNum && lenDN == lenFN) {
    		    canActivate = true;
    		    atLeastOneActive = true;
    		    haveFollowUp = true;
    		    dataType = 'number';
    		}

		if(canActivate) {
    		    firstActiveSource = false;
		}

    	    } else { // not first source
    		if(dataType == "number") {
    		    if(haveDeathNum) {
    			canActivate = true;
    			atLeastOneActive = true;
    			haveFollowUp = false;
    			dataType = 'number';
    		    }

    		    if(haveDeathNum && haveFuNum && lenDN == lenFN) {
    			canActivate = true;
    			atLeastOneActive = true;
    			haveFollowUp = true;
    			dataType = 'number';
    		    }
    		} else { // date type data
    		    if(haveDiagnosisDate && haveDeathDate && lenDD == lenDDD) {
    			canActivate = true;
    			atLeastOneActive = true;
    			haveFollowUp = false;
    			dataType = 'date';
    		    }

    		    if(haveDiagnosisDate && haveDeathDate && haveFuDate && lenDD == lenFD && lenDD == lenDDD) {
    			canActivate = true;
    			atLeastOneActive = true;
    			haveFollowUp = true;
    			dataType = 'date';
    		    }
    		}
    	    }

    	    if(dataMappings[src].active != canActivate) { 
    		// we can start visualizing this data
    		dataMappings[src].clean = false;
    		somethingChanged = true;
    	    }

    	    if(canActivate) {

    		for(var f = 0; f < dataMappings[src].map.length; f++) {
    		    if(dataType == 'number' && dataMappings[src].map[f].name == 'Time to Death') {
    			var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    			dataName = shortenName(fieldInfo.name);
    			dragZone.name = dataName;
    			dragZone.ID = dropTTDeathInfo;

			dataMappings[src].listen = fieldInfo.listen;
    		    }

    		    if(dataType == 'date' && dataMappings[src].map[f].name == 'Date of Death') {
    			var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    			dataName = shortenName(fieldInfo.name);
    			dragZone.name = dataName;
    			dragZone.ID = dropTofDeathInfo;

			dataMappings[src].listen = fieldInfo.listen;
    		    }
    		}

    		var ls2 = [];
    		for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
    		    // lex[dataMappings[src].map[ff].idx] = true;
    		    if(dataType == "number") {
    			if(dataMappings[src].map[ff].name == 'Time to Death') {
    			    ls2.push(dataMappings[src].map[ff].srcIdx);
    			}
    			if(haveFollowUp && dataMappings[src].map[ff].name == 'Time to Last Follow-Up') {
    			    ls2.push(dataMappings[src].map[ff].srcIdx);
    			}
    		    } else {
    			if(dataMappings[src].map[ff].name == 'Date of Death'
    			   || dataMappings[src].map[ff].name == 'Date of Diagnosis') {
    			    ls2.push(dataMappings[src].map[ff].srcIdx);
    			}
    			if(haveFollowUp && dataMappings[src].map[ff].name == 'Date of Last Follow-Up') {
    			    ls2.push(dataMappings[src].map[ff].srcIdx);
    			}
    		    }
    		}

    		// start listening to updates
    		if(dataMappings[src].hasOwnProperty("listen") 
    		   && dataMappings[src].listen !== null) {
    		    dataMappings[src].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
    		}
    	    } else {
    		// stop listening to updates

    		for(var i = 0; i < dataMappings[src].map.length; i++) {
    		    // debugLog("Not active, stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
    		    dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
    		}
    		// var fieldInfo = ls[dataMappings[src].map[0].srcIdx];
    		// fieldInfo.listen(myInstanceId, false, null, null, []);
    	    }

    	    dataMappings[src].active = canActivate;
    	}

    	if(somethingChanged || atLeastOneActive) {
    	    parseData();
    	} else {
    	    parsingDataNow = false;
	}
    }

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("hopViz Life Table: " + message);
	}
    }

    function getTextWidth(text, font) {
	if(ctx !== null && ctx !== undefined) {
	    ctx.font = font;
	    var metrics = ctx.measureText(text);
	    return metrics.width;
	}
	return 0;
    }

    function getTextWidthCurrentFont(text) {
	if(ctx !== null && ctx !== undefined) {
	    var metrics = ctx.measureText(text);
	    return metrics.width;
	}
	return 0;
    }

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
    }

    function date2text(v) {
	var days = v / (24*3600*1000);
	if(days < 100) {
	    return parseInt(days) + " days";
	}
	if(days < 1000) {
	    return parseInt(days/30) + " months";
	}
	return (days/365).toPrecision(2) + " years";
    }

    function shortenName(n) {
	var ss = n.split(":");
	return ss[ss.length - 1];
    }

    function pixel2valX(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < leftMarg) {
	    return limits.minX;
	}
	if(p > leftMarg + drawW) {
	    return limits.maxX;
	}
	return limits.minX + (p - leftMarg) / drawW * (limits.maxX - limits.minX);
    };

    function pixel2valY(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < topMarg) {
	    return limits.maxY; // flip Y-axis
	}
	if(p > topMarg + drawH) {
	    return limits.minY; // flip Y-axis
	}
	return limits.minY + (drawH - (p - topMarg)) / drawH * (limits.maxY - limits.minY); // flip Y-axis
    };

    function val2pixelX(v) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(v < limits.minX) {
	    return leftMarg;
	}
	if(v > limits.maxX) {
	    return leftMarg + drawW;
	}
	
	return leftMarg + (v - limits.minX) / (limits.maxX - limits.minX) * drawW;
    };

    function val2pixelY(v) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(v < limits.minY) {
	    return topMarg + drawH; // flip Y-axis
	}
	if(v > limits.maxY) {
	    return topMarg; // flip Y-axis
	}
	
	return topMarg + drawH - ((v - limits.minY) / (limits.maxY - limits.minY) * drawH); // flip Y-axis
    };

    function saveSelectionsInSlot() {
    	// debugLog("saveSelectionsInSlot");

    	var result = {};
    	result.selections = [];
    	for(var sel = 0; sel < selections.length; sel++) {
    	    result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1]});
    	}

    	internalSelectionsInternallySetTo = result;
    	$scope.set('InternalSelections', result);
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
    	    var newSelections = [];
	    
    	    if(unique > 0) {
    		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
    		    var newSel = slotSelections.selections[sel];
		    
    		    var X1 = newSel.minX;
    		    var X2 = newSel.maxX;
		    
    		    if(X2 < limits.minX 
    		       || X1 > limits.maxX) {
    			// completely outside
    			continue;
    		    }
		    
    		    X1 = Math.max(limits.minX, X1);
    		    X2 = Math.min(limits.maxX, X2);

		    var x1 = val2pixelX(X1);
		    var x2 = val2pixelX(X2);
		    if(x2 - x1 > 1) {
    			newSelections.push([X1,X2, x1,x2]);
		    } else {
			// debugLog("setSelectionsFromSlotValue ignoring selection because it is too small.");
		    }
    		}

    		// debugLog("new selections: " + JSON.stringify(newSelections));
    		if(newSelections.length > 0) {
    		    selections = newSelections;
    		    updateLocalSelections(false);
    		    drawSelections();
    		}
    	    } else { // no data
    		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
    		    var newSel = slotSelections.selections[sel];
		    
    		    var X1 = newSel.minX;
    		    var X2 = newSel.maxX;

    		    newSelections.push([X1,X2, 0,0]);
    		}
    		selections = newSelections;
    	    }
    	}
	
    	saveSelectionsInSlot();
    };

    function checkSelectionsAfterNewData() {
    	// debugLog("checkSelectionsAfterNewData");

    	var newSelections = [];

    	for(var sel = 0; sel < selections.length; sel++) {
    	    var newSel = selections[sel];
    	    var X1 = newSel[0];
    	    var X2 = newSel[1];

    	    if(X2 < limits.minX 
    	       || X1 > limits.maxX) {
    		// completely outside
    		continue;
    	    }
	    
    	    X1 = Math.max(limits.minX, X1);
    	    X2 = Math.min(limits.maxX, X2);
	    
	    var x1 = val2pixelX(X1);
	    var x2 = val2pixelX(X2);
	    if(x2 - x1 > 1) {
    		newSelections.push([X1,X2, x1,x2]);
	    } else {
		// debugLog("checkSelectionsAfterNewData ignoring selection because it is too small.");
	    }
    	}

    	if(newSelections.length > 0) {
    	    selections = newSelections;
    	    drawSelections();
    	    return false;
    	}
    	return true;
    };

    function updateLocalSelections(selectAll) {
    	// debugLog("updateLocalSelections");

    	var dirty = false;
	
    	selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.

	var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
	if(newGrouping != grouping) {
	    grouping = newGrouping;
	    dirty = true;
	}

	if(!selectAll) {
	    if(selections.length == 1
	       && selections[0][0] <= limits.minX
	       && selections[0][1] >= limits.maxX) {
		selectAll = true;
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
	if(dataMappings[src].active && idx < dataMappings[src].size) {
	    var groupId = 0;

	    if(dataType == "number") { 
		var valToUse = limits.maxX;

		var ttd = dataMappings[src].ttdFun(idx);
		if(ttd !== null) {
		    valToUse = ttd;
		}

    		for(var span = 0; span < selections.length; span++) {
    		    if(selections[span][0] <= valToUse
    		       && valToUse <= selections[span][1]) {
    			groupId = span + 1;
    			break;
    		    }
		}
	    } else { // date type data

		var valToUse = limits.maxX;

		var tod = dataMappings[src].todFun(idx);
		var todia = dataMappings[src].todiaFun(idx);
		if(tod !== null && todia !== null) {
		    valToUse = tod - todia;
		}

    		for(var span = 0; span < selections.length; span++) {
    		    if(selections[span][0] <= valToUse
    		       && valToUse <= selections[span][1]) {
    			groupId = span + 1;
    			break;
    		    }
		}
	    }
	    return groupId;
	}

	return 1;
    }


    function resetVars() {
    	limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
    	unique = 0; // number of data points with non-null values
    	NULLs = 0;
    }

    function parseData() {
    	debugLog("parseData");

    	parsingDataNow = true;

    	resetVars();

    	for(var src = 0; src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {

    		var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
    		var ls = w.scope().gimme(dataMappings[src].slotName);

    		for(var f = 0; f < dataMappings[src].map.length; f++) {
    		    var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
    		    dataMappings[src].map[f].listen = fieldInfo.listen;
		    
    		    if(dataType == "number" && dataMappings[src].map[f].name == 'Time to Death') {
    			dataMappings[src].ttdFun = fieldInfo.val;
    			dataMappings[src].selFun = fieldInfo.sel;
    			dataMappings[src].size = fieldInfo.size;
    			dataMappings[src].newSelections = fieldInfo.newSel;
    		    }
    		    if(dataType == "number" && dataMappings[src].map[f].name == 'Time to Last Follow-Up') {
    			dataMappings[src].ttlfuFun = fieldInfo.val;
    		    }

    		    if(dataType == "date" && dataMappings[src].map[f].name == 'Date of Death') {
    			dataMappings[src].todFun = fieldInfo.val;
    			dataMappings[src].selFun = fieldInfo.sel;
    			dataMappings[src].size = fieldInfo.size;
    			dataMappings[src].newSelections = fieldInfo.newSel;
    		    }
    		    if(dataType == "date" && dataMappings[src].map[f].name == 'Date of Last Follow-Up') {
    			dataMappings[src].tolfuFun = fieldInfo.val;
    		    }
    		    if(dataType == "date" && dataMappings[src].map[f].name == 'Date of Diagnosis') {
    			dataMappings[src].todiaFun = fieldInfo.val;
    		    }
    		}
    	    }
    	}


	// broken syntax here
    	for(var src = 0; src < dataMappings.length; src++) {
    	    if(dataMappings[src].active) {
		
    		var firstNonNullData = true;
    		var minXVal = 0;
    		var maxXVal = 0;
    		var minYVal = 0;
    		var maxYVal = 0;
		
    		for(var i = 0; i < dataMappings[src].size; i++) {
    	    	    var isNull = false;
		    
    	    	    if(dataType == 'number') {
    			var ttd = dataMappings[src].ttdFun(i);
    			if(ttd === null) {
    			    isNull = true;
    			} else {
    			    if(haveFollowUp) {
    				var lfu = dataMappings[src].ttlfuFun(i);
    				if(lfu === null) {
    				    isNull = true;
    				}
    			    }
    			}

    	    	    } else { // date type data

    			var tod = dataMappings[src].todFun(i);
    			var todia = dataMappings[src].todiaFun(i);
    			if(tod === null || todia === null) {
    			    isNull = true;
    			} else {
    			    var ttd = tod - todia;

    			    if(tod < todia) {
    				debugLog("Corrupt data, death before diagnosis: date of death " + tod + ", date of diagnosis " + todia);
    			    }

    			    if(haveFollowUp) {
    				var lfu = dataMappings[src].tolfuFun(i);
    				if(lfu === null) {
    				    isNull = true;
    				} else {
    				    if(lfu < todia) {
    					debugLog("Corrupt data, last follow up before diagnosis: date of last follow up " + lfu + ", date of diagnosis " + todia);
    				    }
    				    lfu = lfu - todia;
    				}
    			    }
    			}
    	    	    }

    	    	    if(isNull) {
    	    		NULLs++;
    	    	    } else {
    	    		unique++;

    	    		if(firstNonNullData) {
    	    		    firstNonNullData = false;
			    if(haveFollowUp) {
    	    			minXVal = Math.min(ttd, lfu);
    	    			maxXVal = Math.max(ttd, lfu);
			    } else {
    	    			minXVal = ttd;
    	    			maxXVal = ttd;
			    }
    	    		} else {
			    if(haveFollowUp) {
    	    			minXVal = Math.min(ttd, lfu, minXVal);
    	    			maxXVal = Math.max(ttd, lfu, maxXVal);
			    } else {
    	    			minXVal = Math.min(ttd, minXVal);
    	    			maxXVal = Math.max(ttd, maxXVal);
			    }
    	    		} 
    	    	    }
    	    	}
		
		var dataIsCorrupt = false;
		
    		if(firstNonNullData) {
    		    dataIsCorrupt = true; // only null values
    		} else {
    		    if(limits.hasOwnProperty("minX")) {
    			limits.minX = Math.min(limits.minX, 0, minXVal);
    		    } else {
    			limits.minX = Math.min(0, minXVal);
    		    }
    		    if(limits.hasOwnProperty("maxX")) {
    			limits.maxX = Math.max(maxXVal, limits.maxX);
    		    } else {
    			limits.maxX = maxXVal;
    		    }
		    
    		    limits.minY = 0;
    		    if(usePercent) {
    			limits.maxY = 1;
    		    } else {
    			if(limits.hasOwnProperty("maxY")) {
    			    limits.maxY = Math.max(limits.maxY, dataMappings[src].size);
    			} else {
    			    limits.maxY = dataMappings[src].size;
    			}
    		    }
    		    // debugLog("parseData limits: " + JSON.stringify(limits));
    		}

    		if(dataIsCorrupt) {
    		    debugLog("Data from source " + src + " are corrupt.");
    		    dataMappings[src].active = false;
		}
    	    } // if active
    	} // for each source
	
    	parsingDataNow = false;

    	updateGraphics();

    	if(unique > 0) {
    	    var giveUp = checkSelectionsAfterNewData();
    	    if(giveUp) {
    		selectAll();
    	    } else {
    		updateLocalSelections(false);
    		saveSelectionsInSlot();
    	    }
    	} else { // no data
    	    updateLocalSelections(false);
    	    saveSelectionsInSlot();
    	}
    }


    // -------------------------------------------------------
    // callback functions for use by the data source Webble
    // -------------------------------------------------------

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
    // -------------------------------------------------------

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

    	drawBackground(W, H);
    	drawLifeTable(W, H);
    	drawAxes(W, H);

	updateDropZones(textColor, 0.3, false);
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

	    var left = 0;
	    var top = topMarg;
	    var height = Math.max(5, drawH + 2);
	    var width = Math.max(5, leftMarg - 8);

	    dropTTDeath.left = 0;
	    dropTTDeath.right = leftMarg;
	    dropTTDeath.top = topMarg + marg2;
	    dropTTDeath.bottom = topMarg + Math.floor(drawH / 2) - marg2;

	    dropTTLFU.left = dropTTDeath.left;
	    dropTTLFU.right = dropTTDeath.right;
	    dropTTLFU.top = topMarg + Math.floor(drawH / 2) + marg2;
	    dropTTLFU.bottom = topMarg + drawH - marg2;

	    dropTofDeath.left = W - rightMarg;
	    dropTofDeath.right = W;
	    dropTofDeath.top = dropTTDeath.top;
	    dropTofDeath.bottom = dropTTDeath.bottom;

	    dropTofLFU.left = dropTofDeath.left;
	    dropTofLFU.right = dropTofDeath.right;
	    dropTofLFU.top = dropTTLFU.top;
	    dropTofLFU.bottom = dropTTLFU.bottom;

	    dropTofDia.left = leftMarg + marg1;
	    dropTofDia.right = leftMarg + drawW - marg1
	    dropTofDia.top = topMarg + drawH;
	    dropTofDia.bottom = H;

	    if(hover) {
		dropCtx.save();
		dropCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
		dropCtx.fillRect(0,0, W, H);
		dropCtx.restore();
		
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
			var fnt = "bold " + (fontSize + 5) + "px Arial";

			var str = dropZone.label;
			var tw = getTextWidth(str, fnt);

			var textArea = dropZone.right - dropZone.left;
			if(dropZone.rotate) {
			    textArea = dropZone.bottom - dropZone.top;
			}

			var fontAdjust = 1;
			while(tw > 2 * textArea) {
			    fnt = "bold " + (fontSize + 5 - fontAdjust) + "px Arial";
			    tw = getTextWidth(str, fnt);
			    fontAdjust++;
			    
			    if(fontAdjust > fontSize) {
				break;
			    }
			}

			var labelShift = Math.floor(fontSize / 2);
			if(dropZone.rotate) {
			    if(dropZone.top < H / 2) {
				if(dropZone.left > W / 2) {
    				    dropCtx.translate(dropZone.right - 1 - 3*labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
				} else {
    				    dropCtx.translate(dropZone.left + 1 + labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
				}
			    } else {
				if(dropZone.left > W / 2) {
    				    dropCtx.translate(dropZone.left - 1, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
				} else {
    				    dropCtx.translate(dropZone.right - 1 - 2*labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
				}
			    }
    			    dropCtx.rotate(Math.PI/2);
			} else {
			    if(dropZone.top < H / 2) {
    				dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
			    } else {
    				dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.top + labelShift);
			    }
			}
			dropCtx.font = fnt;
			dropCtx.fillText(str, 0, 0);
		    }
		    dropCtx.restore();
		}
	    }
	}
    }

    function drawBackground(W,H) {
    	var colors = $scope.gimme("ColorScheme");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}

	if(colors.hasOwnProperty("skin") && colors.skin.hasOwnProperty("text")) {
	    textColor = colors.skin.text;
	} else {
	    textColor = "#000000";
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

    function drawAxes(W, H) {
    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	// X Axis
	
    	ctx.fillStyle = "black";
    	ctx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

    	if(unique > 0) {
    	    var LABELS = 5;
    	    for(var i = 0; i < LABELS+1; i++) {
    		var pos = leftMarg + i/LABELS*drawW;

    		var s = "";
    		if(dataType == 'date') {
    		    s = date2text(Math.floor(pixel2valX(pos)));
    		} else {
    		    s = number2text(pixel2valX(pos), limits.maxX);
    		}
		
    		ctx.fillStyle = "black";
    		ctx.font = fontSize + "px Arial";
    		var textW = getTextWidthCurrentFont(s);
    		ctx.fillText(s, pos - textW/2, H - bottomMarg);
    		ctx.fillRect(pos, topMarg + drawH - 2, 1, 6);
    	    }
    	}

    	// Y Axis

    	ctx.fillStyle = "black";
    	ctx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

    	if(unique > 0) {
	    
	    // top label

	    var str = "";
	    if(dataName != "") {
		str = dataName;
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

		dragZone = {'left':left, 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':dragZone.name, 'ID':dragZone.ID};
		allDragNames = [dragZone];
	    }

    	    var LABELS = 5;
    	    for(var i = 0; i < LABELS+1; i++) {
    		var pos = topMarg + i/LABELS*drawH;

    		var s = "";
    		if(usePercent) {
    		    s = Math.round(pixel2valY(pos) * 100) + "%";
    		} else {
    		    s = Math.round(pixel2valY(pos));
    		}
		
    		ctx.fillStyle = "black";
    		ctx.font = fontSize + "px Arial";
    		var textW = getTextWidthCurrentFont(s);
    		if(leftMarg > textW + 5) {
    		    ctx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
    		} else {
    		    ctx.fillText(s, 0, pos + fontSize/2);
    		}
    		ctx.fillRect(leftMarg - 5, pos, 6, 1);
    	    }
    	}
    };


    function drawLifeTable(W, H) {
	debugLog("drawLifeTable");

    	if(unique <= 0) {
    	    return;
    	}
    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	// first collect data on each group, how many patients are in the group at 
    	// each day when the number of patients change

    	var groupStats = {};

	for(var src = 0; src < dataMappings.length; src++) {
	    if(dataMappings[src].active) {

		for(var i = 0; i < dataMappings[src].size; i++) {

    	    	    if(dataType == 'number') {
			var ttd = dataMappings[src].ttdFun(i);

			if(haveFollowUp) {
			    var lfu = dataMappings[src].ttlfuFun(i);
			} 

    	    	    } else { // date type data

			var tod = dataMappings[src].todFun(i);
			var todia = dataMappings[src].todiaFun(i);
			if(tod === null || todia === null) {
			    ttd = null;
			} else {
			    var ttd = tod - todia;
			    if(ttd < 0) {
				ttd = 0;
			    }
			}

			if(haveFollowUp) {
			    var lfu = dataMappings[src].tolfuFun(i);
			    if(lfu === null || todia === null) {
				lfu = null;
			    } else {
				lfu = lfu - todia;
				if(lfu < 0) {
				    lfu = 0;
				}
			    }
			}
    	    	    }

		    var groupId = dataMappings[src].selFun(i);

    		    if(!groupStats.hasOwnProperty(groupId)) {
    			groupStats[groupId] = {'list':[], 'headCount':0}; // [xval, lost by death == true, lost by follow up == false]
    		    }
		    
    		    groupStats[groupId].headCount++;
    		    if(ttd !== null) {
    			groupStats[groupId].list.push([ttd, true]);
		    }
    		    
		    if(haveFollowUp && lfu !== null) {
    			groupStats[groupId].list.push([lfu, false]);
    		    } 
    		}
            }
    	}

    	var maxHeadCount = 0;
    	for(var groupId in groupStats) {
    	    var ls = groupStats[groupId].list;
    	    ls.sort(function(a,b){return (a[0] - b[0]);});
    	    var upper = groupStats[groupId].headCount;
    	    var lower = groupStats[groupId].headCount;
	    
    	    maxHeadCount = Math.max(maxHeadCount, groupStats[groupId].headCount);
	    
    	    var upperCurve = [[0, upper]];
    	    var lowerCurve = [[0, lower]];
    	    var lastTime = 0;
    	    for(var i = 0; i < ls.length; i++) {
    		if(ls[i][0] != lastTime) {
    		    if(upperCurve[upperCurve.length - 1][1] != upper) {
    			upperCurve.push([lastTime, upper]);
    		    } 
    		    if(lowerCurve[lowerCurve.length - 1][1] != lower) {
    			lowerCurve.push([lastTime, lower]);
    		    }
    		    lastTime = ls[i][0];
    		}
    		if(ls[i][1]) { // death
    		    upper--;
    		    lower--;
    		} else { // not death
    		    lower--;
    		}
    	    }
    	    if(upperCurve[upperCurve.length - 1][1] != upper) {
    		upperCurve.push([lastTime, upper]);
    	    } 
    	    if(lowerCurve[lowerCurve.length - 1][1] != lower) {
    		lowerCurve.push([lastTime, lower]);
    	    }
	    
    	    groupStats[groupId].upper = upperCurve;
    	    groupStats[groupId].lower = lowerCurve;
    	}

    	if(usePercent) {
    	    limits.maxY = 1;
    	} else {
    	    limits.maxY = maxHeadCount;
    	}

    	for(var groupId in groupStats) {
    	    // draw upper curve
    	    var ls = groupStats[groupId].upper;

    	    var lastX = val2pixelX(ls[0][0]);

	    var yval = ls[0][1];
	    if(usePercent) {
		yval = yval / groupStats[groupId].headCount;
	    }
    	    var lastY = val2pixelY(yval);
	    
    	    var col = getColorForGroup(groupId);
    	    if(groupId == "0") {
    		col = hexColorToRGBA(col, 0.33);
    	    }

	    ctx.save();

	    if(!usePercent) {
		ctx.fillStyle = col;
		var s = "";
    		s = Math.round(ls[0][1]);

    		var textW = getTextWidthCurrentFont(s);

		ctx.fillText(s, leftMarg + 5, lastY - 5);

		// if(textW + 3 < leftMarg) {
		//     ctx.fillText(s, leftMarg - textW - 2, lastY + fontSize / 2);
		// } else {
		//     ctx.fillText(s, 0, lastY + fontSize / 2);
		// }
	    }

    	    ctx.strokeStyle = col;
    	    ctx.lineWidth = 1;
    	    ctx.beginPath();
    	    ctx.moveTo(lastX, lastY);

    	    for(var i = 1; i < ls.length; i++) {
    		var x = val2pixelX(ls[i][0]);

		yval = ls[i][1];
		if(usePercent) {
		    yval = yval / groupStats[groupId].headCount;
		}
    		var y = val2pixelY(yval);

    		// horizontal line
    		ctx.lineTo(x, lastY);

    		// vertical line
    		ctx.lineTo(x, y);

    		lastX = x;
    		lastY = y;
    	    }
    	    ctx.lineTo(val2pixelX(limits.maxX), lastY);

    	    ctx.stroke();

	    ctx.fillStyle = col;
	    var s = "";
	    if(usePercent) {
    		s = Math.round(ls[ls.length - 1][1] / groupStats[groupId].headCount * 100) + "%";
    	    } else {
    		s = Math.round(ls[ls.length - 1][1]);
	    }
    	    var textW = getTextWidthCurrentFont(s);
	    if(textW + 6 < rightMarg) {
		ctx.fillText(s, leftMarg + drawW + 5, lastY + fontSize / 2);
	    } else {
		ctx.fillText(s, leftMarg + drawW + rightMarg - textW - 1, lastY + fontSize / 2);
	    }
	    ctx.restore();

    	    // draw lower curve
    	    if(haveFollowUp) {
    		ls = groupStats[groupId].lower;

    		lastX = val2pixelX(ls[0][0]);

		yval = ls[0][1];
		if(usePercent) {
		    yval = yval / groupStats[groupId].headCount;
		}
    		lastY = val2pixelY(yval);
		
		ctx.save();
    		ctx.setLineDash([3, 5]);
    		if(groupId != "0") {
    		    col = hexColorToRGBA(col, 0.5);
    		}

    		ctx.strokeStyle = col;
    		ctx.lineWidth = 1;
    		ctx.beginPath();
    		ctx.moveTo(lastX, lastY);
		
    		for(var i = 1; i < ls.length; i++) {
    		    var x = val2pixelX(ls[i][0]);
		    yval = ls[i][1];
		    if(usePercent) {
			yval = yval / groupStats[groupId].headCount;
		    }
    		    var y = val2pixelY(yval);
		    
    		    // horizontal line
    		    ctx.lineTo(x, lastY);
		    
    		    // vertical line
    		    ctx.lineTo(x, y);
		    
    		    lastX = x;
    		    lastY = y;
    		}
    		ctx.lineTo(val2pixelX(limits.maxX), lastY);
    		ctx.stroke();
		ctx.restore();
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
    			colorPalette[g] = '#000000';
			
    			if(groupCols[g].hasOwnProperty('color')) {
    			    colorPalette[g] = groupCols[g].color;
    			}
    		    }
    		}
    	    }
    	}
	
    	if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
    	    return '#000000';
    	} else {
    	    return colorPalette[group];
    	}
    };

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
    		debugLog("no drop canvas to resize!");
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
	
    	var W = selectionCanvas.width;
    	var H = selectionCanvas.height;
    	drawW = W - leftMarg - rightMarg;
    	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	for(var sel = 0; sel < selections.length; sel++) {
    	    var s = selections[sel];
    	    s[2] = val2pixelX(s[0]);
    	    s[3] = val2pixelX(s[1]);
    	}
    	drawSelections();

	updateDropZones(textColor, 0.3, false);
    };

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

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

    	case "UsePercent":
    	    if(eventData.slotValue) {
		if(!usePercent) {
    		    usePercent = true;
    		    updateGraphics();
		}
    	    } else {
		if(usePercent) {
    		    usePercent = false;
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
    	case "UseGlobalColorGradients":
    	    if(eventData.slotValue) {
		if(!useGlobalGradients) {
    		    useGlobalGradients = true;
    		    updateGraphics();
		}
    	    } else {
		if(useGlobalGradients) {
    		    useGlobalGradients = false;
    		    updateGraphics();
		}
    	    }
    	    break;
    	case "PluginName":
    	    $scope.displayText = eventData.slotValue;
    	    break;
    	case "ColorScheme":
    	    colorPalette = null;
    	    parseSelectionColors();
    	    updateGraphics();
    	    drawSelections();
    	    break;
    	};
    };



    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(x1,x2, y1,y2, keepOld) {
    	// debugLog("newSelection");

    	if(unique > 0) {
    	    x1 = Math.max(x1, leftMarg);
    	    x2 = Math.min(x2, leftMarg + drawW);

    	    var newSel = [pixel2valX(x1), pixel2valX(x2), x1,x2];
	    
    	    var overlap = false;
    	    for(var s = 0; s < selections.length; s++) {
    		var sel = selections[s];
    		if(sel[2] == newSel[2]
    		   && sel[3] == newSel[3]) {
    		    // debugLog("Ignoring selection because it overlaps 100% with already existing selection");
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
    };

    $scope.selectAll = function() {
    	if(unique <= 0) {
    	    selections = [];
    	} else {
    	    selections = [[limits.minX, limits.maxX, leftMarg, leftMarg + drawW]];
    	}
    	drawSelections();
    	updateLocalSelections(true);
    	saveSelectionsInSlot();
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

	if(colors.hasOwnProperty("skin") && colors.skin.hasOwnProperty("text")) {
	    textColor = colors.skin.text;
	} else {
	    textColor = "#000000";
	}

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

    	for(sel = 0; sel < selections.length; sel++) {
    	    selectionCtx.fillStyle = selectionColors.grad;	    
    	    selectionCtx.fillRect(selections[sel][2], topMarg-2, selections[sel][3] - selections[sel][2], drawH+4);

    	    selectionCtx.fillStyle = selectionColors.border;
    	    selectionCtx.fillRect(selections[sel][2],   topMarg-2, 1, drawH+4);
    	    selectionCtx.fillRect(selections[sel][2],   topMarg-2, selections[sel][3] - selections[sel][2], 1);
    	    selectionCtx.fillRect(selections[sel][2],   topMarg+2 + drawH, selections[sel][3] - selections[sel][2], 1);
    	    selectionCtx.fillRect(selections[sel][3]-1, topMarg-2, 1, drawH+4);
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
    	   && pos.y <= topMarg + drawH + 5) {
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
    		    var x = pixel2valX(currentMouse.x);
    		    var y = pixel2valY(currentMouse.y);
		    
    		    var s = "[";
		    
    		    if(dataType == 'date') {
    			s += date2text(Math.floor(x));
    		    } else {
    			s += number2text(x, limits.maxX);
    		    }

    		    s += ", ";

    		    if(usePercent) {
    			s += Math.round(y * 100) + "%";
    		    } else {
    			s += Math.round(y);
    		    }
		    
    		    s += "]";

    		    var textW = getTextWidthCurrentFont(s);
    		    hoverText.style.font = fontSize + "px Arial";
    		    hoverText.style.left = Math.floor(currentMouse.x + 5) + "px";
    		    hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
    		    hoverText.innerHTML = s;
    		    hoverText.style.display = "block";
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
    		    newSelection(x1,x2, y1,y2, clickStart.ctrl);
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
    		    newSelection(x1,x2, y1,y2, clickStart.ctrl);
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
	


        $scope.addSlot(new Slot('InternalSelections',
    				{},
    				"Internal Selections",
    				'Slot to save the internal state of what is selected.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
    	// $scope.getSlot('InternalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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

        $scope.addSlot(new Slot('UsePercent',
    				true,
    				"Use Percent",
    				'Show remaining patients in percent (if false, show actual number of patients).',
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


        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',
    				"Life Table",
    				'Plugin Name',
    				'The name to display in menus etc.',
    				$scope.theWblMetadata['templateid'],
    				undefined,                                 
    				undefined
    			       ));

        // $scope.addSlot(new Slot('PluginType',
    	// 			"VisualizationPlugin",
    	// 			"Plugin Type",
    	// 			'The type of plugin this is. Should always be "VisualizationPlugin".',
    	// 			$scope.theWblMetadata['templateid'],
    	// 			undefined,
    	// 			undefined
    	// 		       ));


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
