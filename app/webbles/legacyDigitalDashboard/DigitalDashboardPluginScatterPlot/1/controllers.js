//======================================================================================================================
// Controllers for DigitalDashboardPluginScatterPlots for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('scatterPlotPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Scatter Plot";

    var myInstanceId = -1;
    
    // graphics

    var bgCanvas = null;
    var bgCtx = null;
    var axesCanvas = null;
    var axesCtx = null;
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

    var dotSize = 5;
    var draw0 = true;
    var drawMean = true;

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var clickStart = null;

    // data from parent

    var idArrays = [];
    var xArrays = [];
    var yArrays = [];
    var xType = "number";
    var yType = "number";
    var xName = "";
    var yName = "";

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
    var lastDotSize = null;

    var dropX = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"X-axis Data", "rotate":false, "forParent":{'idSlot':'DataIdSlot', 'name':'dataX', 'type':'number|date', 'slot':'DataX'}};
    var dropY = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "label":"Y-axis Data", "rotate":true, "forParent":{'idSlot':'DataIdSlot', 'name':'dataY', 'type':'number|date', 'slot':'DataY'}};
    var allDropZones = [dropX, dropY];


    var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneX, dragZoneY];
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
	$scope.theView.find('.canvasStuffForDigitalDashboardScatterPlots').droppable({ 
	//$('.canvasStuffForDigitalDashboardScatterPlots').droppable({ 
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

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard Scatter Plot: " + message);
	}
    }

    function getTextWidth(text, font) {
	if(axesCtx !== null && axesCtx !== undefined) {
	    axesCtx.font = font;
	    var metrics = axesCtx.measureText(text);
	    return metrics.width;
	}
	return 0;
    }

    function getTextWidthCurrentFont(text) {
	if(axesCtx !== null && axesCtx !== undefined) {
	    var metrics = axesCtx.measureText(text);
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
    };

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function date2text(v, dateFormat) {
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
    };

    function pixel2valX(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < leftMarg) {
	    return zoomMinX;
	}
	if(p > leftMarg + drawW) {
	    return zoomMaxX;
	}
	return zoomMinX + (p - leftMarg) / drawW * (zoomMaxX - zoomMinX);
    };

    function pixel2valY(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < topMarg) {
	    return zoomMaxY; // flip Y-axis
	}
	if(p > topMarg + drawH) {
	    return zoomMinY; // flip Y-axis
	}
	return zoomMinY + (drawH - (p - topMarg)) / drawH * (zoomMaxY - zoomMinY); // flip Y-axis
    };

    function val2pixelX(v) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(v < zoomMinX) {
	    return leftMarg;
	}
	if(v > zoomMaxX) {
	    return leftMarg + drawW;
	}
	
	return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
    };

    function val2pixelY(v) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(v < zoomMinY) {
	    return topMarg + drawH; // flip Y-axis
	}
	if(v > zoomMaxY) {
	    return topMarg; // flip Y-axis
	}
	
	return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
    };

    function shortenName(n) {
	var ss = n.split(":");
	return ss[ss.length - 1];
    }

    function saveSelectionsInSlot() {
	// debugLog("saveSelectionsInSlot");

	var result = {};
	result.selections = [];
	for(var sel = 0; sel < selections.length; sel++) {
	    result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1], 'minY':selections[sel][2], 'maxY':selections[sel][3]});
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

		    var Y1 = newSel.minY;
		    var Y2 = newSel.maxY;

		    if(X2 < limits.minX 
		       || X1 > limits.maxX
		       || Y2 < limits.minY 
		       || Y1 > limits.maxY) {
			// completely outside
			continue;
		    }
		    
		    X1 = Math.max(limits.minX, X1);
		    X2 = Math.min(limits.maxX, X2);

		    Y1 = Math.max(limits.minY, Y1);
		    Y2 = Math.min(limits.maxY, Y2);
		    
		    newSelections.push([X1,X2,Y1,Y2, val2pixelX(X1),val2pixelX(X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
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

		    var Y1 = newSel.minY;
		    var Y2 = newSel.maxY;

		    newSelections.push([X1,X2,Y1,Y2, 0,0,0,0]);
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

	    var Y1 = newSel[2];
	    var Y2 = newSel[3];

	    if(X2 < limits.minX 
	       || X1 > limits.maxX
	       || Y2 < limits.minY 
	       || Y1 > limits.maxY) {
		// completely outside
		continue;
	    }
	    
	    X1 = Math.max(limits.minX, X1);
	    X2 = Math.min(limits.maxX, X2);
	    
	    Y1 = Math.max(limits.minY, Y1);
	    Y2 = Math.min(limits.maxY, Y2);
	    
	    newSelections.push([X1,X2,Y1,Y2, val2pixelX(X1),val2pixelX(X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
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

	var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
	var nullGroup = 0;
	if(!nullAsUnselected) {
	    nullGroup = selections.length + 1; // get unused groupId
	}

	var dirty = false;
	
	// debugLog("selections before sorting: " + JSON.stringify(selections));
	selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.
	// debugLog("selections after sorting: " + JSON.stringify(selections));

	for(var set = 0; set < idArrays.length; set++) {
	    var xArray = xArrays[set];
	    var yArray = yArrays[set];
	    var selArray = localSelections[set];

	    for(var i = 0; i < Ns[set]; i++) {
		var newVal = 1;
		
		if(xArray[i] === null
		   || yArray[i] === null) {
		    newVal = nullGroup;
		} else {
		    if(selectAll) {
			newVal = 1;
		    } else {
			var groupId = 0;
			
			for(var span = 0; span < selections.length; span++) {
			    if(selections[span][0] <= xArray[i] 
			       && xArray[i] <= selections[span][1]
			       && selections[span][2] <= yArray[i] 
			       && yArray[i] <= selections[span][3]) {
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
	} else {
	    // debugLog("local selections had not changed");
	}
    };


    function resetVars() {
	idArrays = [];
	xArrays = [];
	yArrays = [];
	xType = "number";
	yType = "number";
	xName = "";
	yName = "";

	dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	allDragNames = [dragZoneX, dragZoneY];

	sources = 0;
	Ns = [];
	N = 0;
	limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
	unique = 0;
	NULLs = 0;

	localSelections = [];
    };

    function parseData() {
	// debugLog("parseData");

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
		    } else {
			xType = 'number';
		    }

		    dragZoneX.name = "x-axis data";
		    dropX.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneX.ID = JSON.stringify(dropX.forParent);
		    if(parentInput[i].hasOwnProperty("description")) {
			xName = shortenName(parentInput[i]["description"]);
			dragZoneX.name = xName;
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "dataY") {
		    haveY = true;
		    
		    if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
			yType = 'date';
		    } else {
			yType = 'number';
		    }

		    dragZoneY.name = "y-axis data";
		    dropY.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneY.ID = JSON.stringify(dropY.forParent);
		    if(parentInput[i].hasOwnProperty("description")) {
			yName = shortenName(parentInput[i]["description"]);
			dragZoneY.name = yName;
		    }
		}
	    }

	    if(haveX && haveY) {
		atLeastOneFilled = true;
	    }
	}
	
	// debugLog("read parent input ", atLeastOneFilled);
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    idArrays = $scope.gimme('DataIdSlot');
	    xArrays = $scope.gimme('DataX');
	    yArrays = $scope.gimme('DataY');

	    if(idArrays.length != xArrays.length
	       || idArrays.length != yArrays.length) {
		dataIsCorrupt = true;
	    }
	    if(idArrays.length <= 0) {
		dataIsCorrupt = true;
	    }

	    if(!dataIsCorrupt) {
		sources = idArrays.length;
		
		for(var source = 0; source < sources; source++) {
		    var idArray = idArrays[source];
		    var xArray = xArrays[source];
		    var yArray = yArrays[source];
		    
		    if(idArray.length != xArray.length
		       || idArray.length != yArray.length) {
			dataIsCorrupt = true;
		    }
		    if(idArray.length <= 0) {
			dataIsCorrupt = true;
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

		    N += idArray.length;
		    Ns.push(idArray.length);
		    
		    localSelections.push([]);

		    for(i = 0; i < Ns[source]; i++) {
			localSelections[source].push(0);

			if(xArray[i] !== null 
			   && yArray[i] !== null) {
			    
			    unique++;

			    var x = xArray[i];
			    var y = yArray[i];

			    if(isNaN(x) || isNaN(y)) {
				dataIsCorrupt = true; // only null values
			    }
			    

			    if(firstNonNullData) {
				firstNonNullData = false;
				minXVal = x;
				maxXVal = x;
				minYVal = y;
				maxYVal = y;
			    } else {
				minXVal = Math.min(x, minXVal);
				maxXVal = Math.max(x, maxXVal);
				minYVal = Math.min(y, minYVal);
				maxYVal = Math.max(y, maxYVal);
			    }
			} else {
			    NULLs++;
			}
		    }
		}
		if(firstNonNullData) {
		    dataIsCorrupt = true; // only null values
		} else {
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
			} else {
			    var d1 = new Date(limits.minX);
			    var d2 = new Date(limits.maxX);
			    if(d2.getFullYear() - d1.getFullYear() > 10) {
				limits.dateFormatX = 'onlyYear';
			    } else if(d2.getFullYear() - d1.getFullYear() > 1) {
				limits.dateFormatX = 'yearMonth';
			    } else {
				var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
				if(d2.getMonth() != d1.getMonth()) {
				    limits.dateFormatX = 'monthDay';
				} else if(days > 5) {
				    limits.dateFormatX = 'day';
				} else if(days > 1) {
				    limits.dateFormatX = 'dayTime';
				} else {
				    limits.dateFormatX = 'time';
				}
			    }
			}
		    }
		    if(yType == 'date') {
			if(limits.minY == limits.maxY) {
			    limits.dateFormatY = 'full';
			} else {
			    var d1 = new Date(limits.minY);
			    var d2 = new Date(limits.maxY);
			    if(d2.getFullYear() - d1.getFullYear() > 10) {
				limits.dateFormatY = 'onlyYear';
			    } else if(d2.getFullYear() - d1.getFullYear() > 1) {
				limits.dateFormatY = 'yearMonth';
			    } else {
				var days = (d2.getTime() - d1.getTime()) / (24*3600*1000);
				if(d2.getMonth() != d1.getMonth()) {
				    limits.dateFormatY = 'monthDay';
				} else if(days > 5) {
				    limits.dateFormatY = 'day';
				} else if(days > 1) {
				    limits.dateFormatY = 'dayTime';
				} else {
				    limits.dateFormatY = 'time';
				}
			    }
			}
		    }
		    // debugLog("parseData limits: " + JSON.stringify(limits));
		}
	    }
	    
	    if(dataIsCorrupt) {
		debugLog("data is corrupt");
		resetVars();
	    } else {
		
		// TODO: check if we should keep the old selections
		// selections = [[limits.min, limits.max]];
	    }
	} else {
	    // debugLog("no data");
	}
	
	updateGraphicsHelper(false, true, true);

	if(unique > 0) {
	    var giveUp = checkSelectionsAfterNewData();
	    if(giveUp) {
		selectAll();
	    } else {
		updateLocalSelections(false);
		saveSelectionsInSlot();
	    }
	} else { // no data
	    $scope.set('LocalSelections', {'DataIdSlot':[]});
	    
	    if(selectionCtx === null) {
    		selectionCtx = selectionCanvas.getContext("2d");
		var W = selectionCanvas.width;
		var H = selectionCanvas.height;
		selectionCtx.clearRect(0,0, W,H);
	    }
	}

    };

    function backgroundColorCheck(currentColors, lastColors) {
	if(currentColors.hasOwnProperty("skin")) {
	    if(!lastColors) {
		return true;
	    } else if(!lastColors.hasOwnProperty("skin")) {
		return true;
	    } else {
		if(currentColors.skin.hasOwnProperty("gradient")) {
		    if(!lastColors.skin.hasOwnProperty("gradient")) {
			return true;
		    } else {
			if(currentColors.skin.gradient.length != lastColors.skin.gradient.length) {
			    return true;
			}
			for(var i = 0; i < currentColors.skin.gradient.length; i++) {
			    if(lastColors.skin.gradient[i].color != currentColors.skin.gradient[i].color
			       || lastColors.skin.gradient[i].pos != currentColors.skin.gradient[i].pos) {
				return true;
			    }
			}
		    }
		} else {
		    if(lastColors.skin.hasOwnProperty("gradient")) {
			return true;
		    } else {
			if(currentColors.skin.hasOwnProperty("color")) {
			    if(!lastColors.skin.hasOwnProperty("color")
			       || lastColors.skin.color != currentColors.skin.color) {
				return true;
			    }
			}
		    }
		}

		if(currentColors.skin.hasOwnProperty("border")) {
		    if(!lastColors.skin.hasOwnProperty("border")
		       || lastColors.skin.border != currentColors.skin.border) {
			return true;
		    }
		}
	    }
	}
	return false;
    }

    function checkColors(currentColors, lastColors) {
	if(currentColors == lastColors) {
	    return false;
	}

	if(!lastColors) {
	    return true;
	}

	if(!lastColors.hasOwnProperty("groups") && 
	   !currentColors.hasOwnProperty("groups"))
	{
	    return false;
	} else if(lastColors.hasOwnProperty("groups") 
		  && currentColors.hasOwnProperty("groups")) {
	    // check more

	    var groupCols = currentColors.groups;
	    var lastGroupCols = lastColors.groups;
	    
	    for(var g in groupCols) {
		if(!lastGroupCols.hasOwnProperty(g)) {
		    return true;
		}
	    }
	    for(var g in lastGroupCols) {
		if(!groupCols.hasOwnProperty(g)) {
		    return true;
		}
		
		if(groupCols[g].hasOwnProperty('color')
		   && (!lastGroupCols[g].hasOwnProperty('color')
		       || lastGroupCols[g].color != groupCols[g].color)) {
		    return true;
		}
		
		if(groupCols[g].hasOwnProperty('gradient')) {
		    if(!lastGroupCols[g].hasOwnProperty('gradient')
		      || lastGroupCols[g].gradient.length != groupCols[g].gradient.length) {
			return true;
		    }
		    
		    for(var i = 0; i < groupCols[g].gradient.length; i++) {
			var cc = groupCols[g].gradient[i];
			var cc2 = lastGroupCols[g].gradient[i];
			
			if(cc.hasOwnProperty('pos') != cc2.hasOwnProperty('pos')
			   || cc.hasOwnProperty('color') != cc2.hasOwnProperty('color')
			   || (cc.hasOwnProperty('pos') && cc.pos != cc2.pos)
			   || (cc.hasOwnProperty('color') && cc.color != cc2.color)) {
			    return true;
			}
		    }
		}
	    }
	} else {
	    return true;
	}

	return false;
    }

    function copyColors(colors) {
	var res = {};
	
	if(colors.hasOwnProperty('skin')) {
	    res.skin = {};
	    for(var prop in colors.skin) {
		res.skin[prop] = colors.skin[prop];
	    }
	}
	if(colors.hasOwnProperty('groups')) {
	    res.groups = {};
	    for(var prop in colors.groups) {
		res.groups[prop] = colors.groups[prop];
	    }
	}
	return res;
    }

    function updateGraphics() {
	updateGraphicsHelper(false, false, false);
    }
	
    function updateGraphicsHelper(forceBackground, forceDots, forceAxes) {
    	// debugLog("updateGraphics()");

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
    	    var colors = $scope.gimme("GroupColors");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    currentColors = copyColors(colors);

	    if(!currentColors) {
		currentColors = {};
	    }
	}

	if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
	    textColor = currentColors.skin.text;
	} else {
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

	// ===============================
	// Check what needs to be redrawn
	// ===============================

	if(drawW != lastDrawW
	   || drawH != lastDrawH) {
	    redrawBackground = true;
	    redrawDots = true;
	    redrawAxes = true;
	}

	if(!redrawBackground && currentColors != lastColors) {
	    redrawBackground = backgroundColorCheck(currentColors, lastColors);
	}
	
	if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
	    redrawAxes = true;
	}

	if(lastDotSize != dotSize) {
	    redrawDots = true;
	}

	if(!redrawAxes || !redrawDots) {
	    if(zoomMinX != lastZoomMinX
	       || zoomMaxX != lastZoomMaxX
	       || zoomMinY != lastZoomMinY
	       || zoomMaxY != lastZoomMaxY) {
		redrawAxes = true;
		redrawDots = true;
	    }
	}
	
	if(!redrawDots) {
	    if(checkColors(currentColors, lastColors)) {
		redrawDots = true;
	    }
	}

	// ===========
	// Draw
	// ===========

	// debugLog("Need to redraw: " + redrawBackground + " " + redrawDots + " " + " " + redrawAxes);


    	if(redrawBackground) {
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

    function drawBackground(W,H) {
    	var colors = currentColors;

	if(bgCanvas === null) {
   	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}

	if(bgCtx === null) {
    	    bgCtx = bgCanvas.getContext("2d");
	}
	
	if(!bgCtx) {
	    debugLog("no canvas to draw bg on");
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

    function drawAxes(W, H) {
	if(axesCanvas === null) {
   	    var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
    	    if(myCanvasElement.length > 0) {
    		axesCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}

	if(axesCtx === null) {
    	    axesCtx = axesCanvas.getContext("2d");
	}
	
	if(!axesCtx) {
	    debugLog("no canvas to draw axes on");
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
	    xw = getTextWidthCurrentFont(xName);
	    yw = getTextWidthCurrentFont(yName);
	} else if(xName != "") {
	    str = xName;
	    xw = getTextWidthCurrentFont(xName);
	} else if(yName != "") {
	    str = yName;
	    yw = getTextWidthCurrentFont(yName);
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
		if(xType == 'date') {
		    s = (date2text(Math.floor(pixel2valX(pos)), limits.dateFormatX));
		} else {
		    s = number2text(pixel2valX(pos), limits.spanX);
		}
		
		var textW = getTextWidthCurrentFont(s);
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
		    s = (date2text(Math.floor(pixel2valY(pos)), limits.dateFormatY));
		} else {
		    s = number2text(pixel2valY(pos), limits.spanY);
		}
		
		var textW = getTextWidthCurrentFont(s);
		if(leftMarg > textW + 5) {
    		    axesCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
		} else {
    		    axesCtx.fillText(s, 0, pos + fontSize/2);
		}
		axesCtx.fillRect(leftMarg - 5, pos, 6, 1);
	    }
	}

	// 0

	if(draw0) {
	    if(unique > 0) {
		if(xType != 'date') {
		    if(zoomMinX < 0 && zoomMaxX > 0) {
			var pos = val2pixelX(0);

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

		if(yType != 'date') {
		    if(zoomMinY < 0 && zoomMaxY > 0) {
			var pos = val2pixelY(0);

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


    function drawScatterPlot(W, H) {
	if(dotCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
    	    if(myCanvasElement.length > 0) {
    		dotCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}

	if(dotCtx === null) {
    	    dotCtx = dotCanvas.getContext("2d");
	}
	
	if(!dotCtx) {
	    debugLog("no canvas to draw on");
	    return;
	}

	dotCtx.clearRect(0,0, W,H);

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


	var centerOfMass = {"tot":[0,0,0]};

	var zeroTransp = 0.33 * transparency;

	// first draw all the unselected data
	var drawPretty = true;
	if(unique > quickRenderThreshold) {
	    drawPretty = false;
	    var rgba0 = hexColorToRGBAvec(getColorForGroup(0), zeroTransp);
	    var rgbaText = hexColorToRGBAvec(textColor, transparency);
	    // var rgba = hexColorToRGBAvec(getColorForGroup(0), 0.33);
	    var imData = dotCtx.getImageData(0, 0, dotCanvas.width, dotCanvas.height);
	    var pixels = imData.data;
	} else {
	    var col0 = hexColorToRGBA(getColorForGroup(0), zeroTransp);
	    var colT = hexColorToRGBA(textColor, transparency);
	    // var col = hexColorToRGBA(getColorForGroup(0), 0.33);
	    // var fill = getGradientColorForGroup(0, 0,0,W,H, 0.33, dotCanvas, dotCtx);
	    var fill0 = getGradientColorForGroup(0, 0,0,W,H, zeroTransp, dotCanvas, dotCtx);
	}

    	for(var set = 0; set < Ns.length; set++) {
    	    var xArray = xArrays[set];
    	    var yArray = yArrays[set];

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(xArray[i] === null
		   || yArray[i] === null) {
    		    continue;
    		}
		
		if(drawMean) {
		    centerOfMass["tot"][0] += xArray[i];
		    centerOfMass["tot"][1] += yArray[i];
		    centerOfMass["tot"][2] += 1;
		}

                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId == 0) {

		    if(drawMean) {
			if(!centerOfMass.hasOwnProperty(0)) {
			    centerOfMass[0] = [0, 0, 0];
			}
			centerOfMass[0][0] += xArray[i];
			centerOfMass[0][1] += yArray[i];
			centerOfMass[0][2] += 1;
		    }

		    if(xArray[i] < zoomMinX
		       || xArray[i] > zoomMaxX
		       || yArray[i] < zoomMinY
		       || yArray[i] > zoomMaxY) {
			continue; // outside zoomed range
		    }

		    var x = val2pixelX(xArray[i]);
		    var y = val2pixelY(yArray[i]);

		    if(drawPretty) {
			if(!useGlobalGradients) {
    		     	    fill = getGradientColorForGroup(0, x-dotSize,y-dotSize,x+dotSize,y+dotSize, zeroTransp, dotCanvas, dotCtx);
			} else {
			    fill = fill0;
			}
			
			dotCtx.beginPath();
			dotCtx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
			dotCtx.fillStyle = fill;
			dotCtx.fill();
			dotCtx.lineWidth = 1;
			dotCtx.strokeStyle = col0;
			dotCtx.stroke();
		    } else {
			var rgba = rgba0;
			drawDot(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
		    }
		}
	    }
    	}

	// next, draw all the selected data on top
    	for(var set = 0; set < Ns.length; set++) {
    	    var xArray = xArrays[set];
    	    var yArray = yArrays[set];

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(xArray[i] === null
		   || yArray[i] === null) {
    		    continue;
    		}
		
                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId != 0) {
		    
		    if(drawMean) {
			if(!centerOfMass.hasOwnProperty(groupId)) {
			    centerOfMass[groupId] = [0, 0, 0];
			}
			centerOfMass[groupId][0] += xArray[i];
			centerOfMass[groupId][1] += yArray[i];
			centerOfMass[groupId][2] += 1;
		    }

		    if(xArray[i] < zoomMinX
		       || xArray[i] > zoomMaxX
		       || yArray[i] < zoomMinY
		       || yArray[i] > zoomMaxY) {
			continue; // outside zoomed range
		    }

		    var x = val2pixelX(xArray[i]);
		    var y = val2pixelY(yArray[i]);

		    if(drawPretty) {
			var col = hexColorToRGBA(getColorForGroup(groupId), transparency);
    			var fill = getGradientColorForGroup(groupId, x-dotSize,y-dotSize,x+dotSize,y+dotSize, transparency, dotCanvas, dotCtx);
    			// var col = getColorForGroup(groupId);
    			// var fill = getGradientColorForGroup(groupId, x-dotSize,y-dotSize,x+dotSize,y+dotSize, 1, dotCanvas, dotCtx);

			dotCtx.beginPath();
			dotCtx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
			dotCtx.fillStyle = fill;
			dotCtx.fill();
			dotCtx.lineWidth = 1;
			dotCtx.strokeStyle = col;
			dotCtx.stroke();
		    } else {
			rgba = hexColorToRGBAvec(getColorForGroup(groupId), transparency);
			if(rgba[3] >= 255) {
			    drawDotfullalpha(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
			} else {
			    drawDot(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
			}
			// rgba = hexColorToRGBAvec(getColorForGroup(groupId), 1);
			// drawDot(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
		    }
		}
	    }
    	}

	// ==============================================
	// Draw the center of mass of each group of data
	// ==============================================

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
			
			if(x < zoomMinX
			   || x > zoomMaxX
			   || y < zoomMinY
			   || y > zoomMaxY) {
			    continue; // outside zoomed range
			}

			x = Math.round(val2pixelX(x));
			y = Math.round(val2pixelY(y));

			if(drawPretty) {
			    var col = textColor;
			    if(groupId != "tot") {
				col = getColorForGroup(groupId); // do not use col0 for group 0, it is too transparent
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
			    // dotCtx.fillStyle = col;
			    // dotCtx.fillRect(x - 2 - dotSize, y, dotSize*2 + 2, 1);
			    // dotCtx.fillRect(x, y - 2 - dotSize, 1, dotSize*2 + 2);
			} else {
			    var rgbaText = hexColorToRGBAvec(textColor, 1);
			    var rgba = rgbaText;
			    if(groupId != "tot") {
				rgba = hexColorToRGBAvec(getColorForGroup(groupId), 1);
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
	    dotCtx.putImageData(imData, 0, 0);
	}
    }


    function blendRGBAs(r,g,b,alpha, offset, pixels) {
	if(pixels[offset+3] > 0 && alpha < 255) {
	    // something drawn here already, blend alpha

	    var oldA = pixels[offset+3] / 255.0;
	    var newA = alpha / 255.0;

	    var remainA = (1 - newA) * oldA;
	    
	    var outA = newA + remainA;
	    if(outA > 0) {
		var oldR = pixels[offset];
		var oldG = pixels[offset+1];
		var oldB = pixels[offset+2];

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

    function drawDot(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
        var xpos = Math.round(X);
	var ypos = Math.round(Y);
	var W = Math.floor(Width);
	var H = Math.floor(Height);
	var dotSize = Math.round(DOTSIZE);
	var halfDot = Math.round(DOTSIZE/2);

        var startPixelIdx = (ypos * W + xpos) * 4;

        var r2 = Math.ceil(dotSize * dotSize / 4.0);

        for (var x = -halfDot; x < halfDot + 1; x++)
        {
	    if (x + xpos >= 0 && x + xpos < W) {
		var x2 = x * x;
		
		for (var y = -halfDot; y < halfDot + 1; y++)
		{
		    if(y + ypos >= 0 && y + ypos < H)
		    {
			var y2 = y * y;
			
			if (y2 + x2 <= r2)
			{
			    var offset = (y * W + x) * 4;
			    blendRGBAs(r,g,b,alpha, startPixelIdx + offset, pixels);
			}
		    }
		}
	    }
        }
    }

    function drawDotfullalpha(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
        var xpos = Math.round(X);
	var ypos = Math.round(Y);
	var W = Math.floor(Width);
	var H = Math.floor(Height);
	var dotSize = Math.round(DOTSIZE);
	var halfDot = Math.round(DOTSIZE/2);

        var startPixelIdx = (ypos * W + xpos) * 4;

        var r2 = Math.ceil(dotSize * dotSize / 4.0);

        for (var x = -halfDot; x < halfDot + 1; x++)
        {
	    if (x + xpos >= 0 && x + xpos < W) {
		var x2 = x * x;
		
		for (var y = -halfDot; y < halfDot + 1; y++)
		{
		    if(y + ypos >= 0 && y + ypos < H)
		    {
			var y2 = y * y;
			
			if (y2 + x2 <= r2)
			{
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

    // function drawDot(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
    //     var xpos = Math.round(X);
    // 	var ypos = Math.round(Y);
    // 	var W = Math.floor(Width);
    // 	var H = Math.floor(Height);
    // 	var dotSize = Math.round(DOTSIZE);
    // 	var halfDot = Math.round(DOTSIZE/2);

    //     var startPixelIdx = (ypos * W + xpos) * 4;

    //     var r2 = Math.ceil(dotSize * dotSize / 4.0);

    //     for (var x = -halfDot; x < halfDot + 1; x++)
    //     {
    // 	    if (x + xpos >= 0 && x + xpos < W) {
    // 		var x2 = x * x;
		
    // 		for (var y = -halfDot; y < halfDot + 1; y++)
    // 		{
    // 		    if(y + ypos >= 0 && y + ypos < H)
    // 		    {
    // 			var y2 = y * y;
			
    // 			if (y2 + x2 <= r2)
    // 			{
    // 			    var offset = (y * W + x) * 4;
    // 			    pixels[startPixelIdx + offset] = r;
    // 			    pixels[startPixelIdx + offset + 1] = g;
    // 			    pixels[startPixelIdx + offset + 2] = b;
    // 			    pixels[startPixelIdx + offset + 3] = alpha;
    // 			}
    // 		    }
    // 		}
    // 	    }
    //     }
    // }

    function getGradientColorForGroup(group, x1,y1, x2,y2, alpha, myCanvas, myCtx) {
    	if(useGlobalGradients) {
    	    if(myCanvas === null) {
    		var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
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
 	
    	group = group.toString();

    	if(!colorPalette.hasOwnProperty(group)) {
    	    if(currentColors.hasOwnProperty('groups')) {
    		var groupCols = currentColors.groups;
		
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
	
    	if(currentColors.hasOwnProperty("groups")) {
    	    var groupCols = currentColors.groups;
	    
    	    if(groupCols.hasOwnProperty(group) && myCtx !== null && groupCols[group].hasOwnProperty('gradient') && (x1 != x2 || y1 != y2)) {
    		var OK = true;
		
		try {
    		    var grd = myCtx.createLinearGradient(x1,y1,x2,y2);
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
    		} catch(e) {
		    OK = false;
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
    	    if(currentColors.hasOwnProperty("groups")) {
    		var groupCols = currentColors.groups;
		
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

	var bgDirty = false;
    	if(bgCanvas === null) {
	    bgDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
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
    	    } else {
    		debugLog("no canvas to resize!");
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

	var axesDirty = false;
    	if(axesCanvas === null) {
	    axesDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
    	    if(myCanvasElement.length > 0) {
    		axesCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
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

	// debugLog("updateSize found selections: " + JSON.stringify(selections));
	updateSelectionsWhenZoomingOrResizing();

	updateDropZones(textColor, 0.3, false);

	// debugLog("updateSize updated selections to: " + JSON.stringify(selections));
    };

    function updateSelectionsWhenZoomingOrResizing() {
	if(unique > 0) {
	    for(var sel = 0; sel < selections.length; sel++) {
		var s = selections[sel];
		s[4] = val2pixelX(s[0]);
		s[5] = val2pixelX(s[1]);
		s[7] = val2pixelY(s[2]);
		s[6] = val2pixelY(s[3]);
	    }
	}
	drawSelections();
    }

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {
	case "Transparency":
	    var newTransp = eventData.slotValue;
	    if(newTransp < 0) {
		newTransp = 0;
	    } else if(newTransp > 1) {
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
		selectAll();
		$scope.set("SelectAll",false);
	    }
	    break;
	    // case "SelectAll":
	    //     selectAll();
	    //     break;
	    
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
	    } else {
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
    	case "GlobalSelections":
	    checkIfGlobalSelectionsActuallyChanged();
    	    break;
    	case "Highlights":
    	    updateGraphics();
    	    break;
    	case "GroupColors":
	    colorPalette = null;
	    parseSelectionColors();
    	    var colors = $scope.gimme("GroupColors");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    currentColors = copyColors(colors);

    	    updateGraphicsHelper(false, false, false);
	    drawSelections();
    	    break;
    	case "DataValuesSetFilled":
    	    parseData();
    	    break;
    	};
    };

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
    		if(xArray[i] === null
		   || yArray[i] === null) {
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
	    // debugLog("global selections dirty, redraw");
    	    updateGraphicsHelper(false, true, false);
	}
    }


    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(x1,x2, y1,y2, keepOld) {
	// debugLog("newSelection");

	// debugLog("newSelection " + x1 + " " + x2 + " " + y1 + " " + y2 + " " + keepOld);

	if(unique > 0) {
	    x1 = Math.max(x1, leftMarg);
	    x2 = Math.min(x2, leftMarg + drawW);

	    y1 = Math.max(y1, topMarg);
	    y2 = Math.min(y2, topMarg + drawH);
	    
	    var newSel = [pixel2valX(x1), pixel2valX(x2), pixel2valY(y2), pixel2valY(y1), // y1 and y2 need to be switched here, because we flip the y axis
			  x1,x2,y1,y2];
	    // debugLog("newSel: " + JSON.stringify(newSel));
	    
	    var overlap = false;
	    for(var s = 0; s < selections.length; s++) {
		var sel = selections[s];
		if(sel[4] == newSel[4]
		   && sel[5] == newSel[5]
		   && sel[6] == newSel[6]
		   && sel[7] == newSel[7]) {
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

    function selectAll() {
	if(unique <= 0) {
	    selections = [];
	} else {
	    selections = [[limits.minX, limits.maxX, limits.minY, limits.maxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
	}
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
    };

    function hexColorToRGBAvec(color, alpha) {
	var res = [];

	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = parseInt(color.substr(1,2), 16);
	    var g = parseInt(color.substr(3,2), 16);
	    var b = parseInt(color.substr(5,2), 16);
	    var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
	    return [r, g, b, a];
	}
	return [0, 0, 0, 255];
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
    };

    function parseSelectionColors() {
	// debugLog("parseSelectionColors");

	var colors = $scope.gimme("GroupColors");
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

	    if(colors['selection'].hasOwnProperty('gradient') && selectionCanvas !== null && selectionCanvas.width > 0 && selectionCanvas.height > 0) {
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
	    if(selections[sel][2] > zoomMaxY
	       || selections[sel][3] < zoomMinY
	       || selections[sel][0] > zoomMaxX
	       || selections[sel][1] < zoomMinX) {
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

	    mouseIsOverMe = true;

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

		    if(xType == 'date') {
			s += (date2text(Math.floor(x), limits.dateFormatX));
		    } else {
			s += number2text(x, limits.spanX);
		    }

		    s += ",";

		    if(yType == 'date') {
			s += (date2text(Math.floor(y), limits.dateFormatY));
		    } else {
			s += number2text(y, limits.spanY);
		    }
		    
		    s += "]";

		    // var s = "(" + number2text(x, limits.spanX) + "," + number2text(y, limits.spanY) + ")";
		    var textW = getTextWidthCurrentFont(s);
		    hoverText.style.font = fontSize + "px Arial";
		    hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
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

	mouseIsOverMe = false;

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

    function fixedKeypress(event){
    	if(mouseIsOverMe) {
    	    var x = event.which || event.keyCode;

    	    // debugLog("keyPressed over me: " + x);
	    
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

    // function keyPressed(eventData) {
    // 	if(mouseIsOverMe && !eventData.key.released) {
    // 	    // var keyCode = eventData.key.code;
    // 	    var keyName = eventData.key.name;

    // 	    switch(keyName) {
    // 	    case '+':
    // 	    case "= +":
    // 		zoomIn();
    // 		break;
    // 	    case '-':
    // 	    case "- _":
    // 		zoomOut();
    // 		break;
    // 	    case "Left Arrow":
    // 		panLeft();
    // 		break;
    // 	    case "Right Arrow":
    // 		panRight();
    // 		break;
    // 	    case "Down Arrow":
    // 		panDown();
    // 		break;
    // 	    case "Up Arrow":
    // 		panUp();
    // 		break;

    // 	    case 'z':
    // 	    case 'Z':
    // 		zoomIn();
    // 		break;
    // 	    case 'x':
    // 	    case 'X':
    // 		zoomOut();
    // 		break;
    // 	    case 'a':
    // 	    case 'A':
    // 		panLeft();
    // 		break;
    // 	    case 'd':
    // 	    case 'D':
    // 		panRight();
    // 		break;
    // 	    case 's':
    // 	    case 'S':
    // 		panDown();
    // 		break;
    // 	    case 'w':
    // 	    case 'W':
    // 		panUp();
    // 		break;
    // 	    }
    // 	}
    // }

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

    function panLeft() {
	if(zoomMinX > limits.minX) {
	    var shift = zoomMinX - limits.minX;
	    var halfSpan = (zoomMaxX - zoomMinX) / 2;
	    if(shift < halfSpan) {
		zoomMinX = limits.minX;
	    } else {
		zoomMinX -= halfSpan;
	    }
	    zoomMaxX = zoomMinX + halfSpan*2;

	    $scope.set("MinX", zoomMinX);
	    $scope.set("MaxX", zoomMaxX);
	    updateSelectionsWhenZoomingOrResizing();
	    updateGraphicsHelper(false, true, true);
	}
    }	
    function panRight() {
	if(zoomMaxX < limits.maxX) {
	    var shift = limits.maxX - zoomMaxX;
	    var halfSpan = (zoomMaxX - zoomMinX) / 2;
	    if(shift < halfSpan) {
		zoomMaxX = limits.maxX;
	    } else {
		zoomMaxX += halfSpan;
	    }
	    zoomMinX = zoomMaxX - halfSpan*2;

	    $scope.set("MinX", zoomMinX);
	    $scope.set("MaxX", zoomMaxX);
	    updateSelectionsWhenZoomingOrResizing();
	    updateGraphicsHelper(false, true, true);
	}
    }	

    function panDown() {
	if(zoomMinY > limits.minY) {
	    var shift = zoomMinY - limits.minY;
	    var halfSpan = (zoomMaxY - zoomMinY) / 2;
	    if(shift < halfSpan) {
		zoomMinY = limits.minY;
	    } else {
		zoomMinY -= halfSpan;
	    }
	    zoomMaxY = zoomMinY + halfSpan*2;

	    $scope.set("MinY", zoomMinY);
	    $scope.set("MaxY", zoomMaxY);
	    updateSelectionsWhenZoomingOrResizing();
	    updateGraphicsHelper(false, true, true);
	}
    }	
    function panUp() {
	if(zoomMaxY < limits.maxY) {
	    var shift = limits.maxY - zoomMaxY;
	    var halfSpan = (zoomMaxY - zoomMinY) / 2;
	    if(shift < halfSpan) {
		zoomMaxY = limits.maxY;
	    } else {
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

        $scope.addSlot(new Slot('InternalSelections',
				{},
				"Internal Selections",
				'Slot to save the internal state of what is selected.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	// $scope.getSlot('InternalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('SelectAll',
				false,
				"Select All",
				'Slot to quickly reset all selections to select all available data.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
        // $scope.addSlot(new Slot('SelectAll',
	// 			false,
	// 			"Select All",
	// 			'Slot to reset selections to select all data.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// ));

        // internal slots specific to this Webble -----------------------------------------------------------

        $scope.addSlot(new Slot('FontSize',
				11,
				"Font Size",
				'The font size to use in the Webble interface.',
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
				false,
				"Use Global Color Gradients",
				'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
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
				"Scatter Plot",
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
				  {'idSlot':'DataIdSlot', 'name':'dataY', 'type':'number|date', 'slot':'DataY'}]],
				"Expected Format",
				'The input this plugin accepts.',
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

        // $scope.addSlot(new Slot('FormatChanged',
	// 			false,
	// 			"Format Changed",
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 		       ));

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


	$scope.addSlot(new Slot('DataIdSlot',
				[[1,2,3,4,5,6]],
				"Data ID Slot",
				'The slot where the IDs of the input data items should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);


        // // set to indicate that some slots have been reset by the properties form "submit" button because it cannot deal with all data types
        // $scope.addSlot(new Slot('PluginLostSomeInfo',
	// 			"",
	// 			"Plugin Lost Some Info",
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


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

	// set to indicate that the local Highlights have changed
        // $scope.addSlot(new Slot('LocalHighlightsChanged',
	// 			false,
	// 			'Local Highlights Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


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

	// set to indicate that the global selections have changed
        // $scope.addSlot(new Slot('GlobalSelectionsChanged',
	// 			false,
	// 			'Global Selections Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));

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

	// set to indicate that some settings were changed, so we probably need new data
        // $scope.addSlot(new Slot('HighlightsChanged',
	// 			false,
	// 			'Global Highlights Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));

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

        // set to indicate that the data has been updated
        // $scope.addSlot(new Slot('DataValuesChanged',
	// 			false,
	// 			'Data Values Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


        $scope.setDefaultSlot('');

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
	} else {
	    debugLog("No selectionHolderElement, could not bind mouse listeners");
	}

	// $scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
	//     keyPressed(eventData);
	// });
	window.addEventListener( 'keydown', fixedKeypress );

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
