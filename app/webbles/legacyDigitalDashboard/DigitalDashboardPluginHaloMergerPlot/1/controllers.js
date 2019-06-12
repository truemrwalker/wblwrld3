//======================================================================================================================
// Controllers for DigitalDashboardPluginHaloMergerPlots for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('haloMergerPlotPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Halo Merger Plot";

    var myInstanceId = -1;
    
    // graphics

    // var myCanvas = null;
    // var ctx = null;
    
    var bgCanvas = null;
    var bgCtx = null;
    var dropCanvas = null;
    var dropCtx = null;
    var axCanvas = null;
    var axCtx = null;
    var lineCanvas = null;
    var lineCtx = null;
    var dotCanvas = null;
    var dotCtx = null;

    var quickRenderThreshold = 500;

    var textColor = "#000000";
    var currentColors = null;
    
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

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var transparency = 1;

    var clickStart = null;

    // data from parent

    var idArrays = [];
    var xArrays = [];
    var yArrays = [];
    var sArrays = [];
    var hArrays = [];
    var dArrays = [];
    var tArrays = [];

    var xName = "";
    var yName = "";
    var sName = "";
    
    var haveIDs = false;
    var timeSpan = [];
    var timeDelta = 1;

    var sources = 0;
    var Ns = [];
    var N = 0;

    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0, 'maxSize':0, 'minSize':0, 'sizeSpan':1};
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

    var minDotSize = 3;
    var maxDotSize = 15;
    var logScale = false;

    var storyGraphMode = false;

    var lastDrawW = null;
    var lastDrawH = null;
    var lastFontSize = null;
    var lastTextColor = null;
    var lastColors = null;
    var lastZoomMinX = null;
    var lastZoomMaxX = null;
    var lastZoomMinY = null;
    var lastZoomMaxY = null;
    var lastMinDotSize = null;
    var lastMaxDotSize = null;
    var lastHaveIDs = null;
    var lastStoryGraphMode = false;

    var dropX = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forParent":{'idSlot':'DataIdSlot', 'name':'X', 'type':'number', 'slot':'DataX'}, "label":"X-axis Data", "rotate":false};
    var dropY = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forParent":{'idSlot':'DataIdSlot', 'name':'Y', 'type':'number', 'slot':'DataY'}, "label":"Y-axis Data", "rotate":true};
    var dropSize = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forParent":{'idSlot':'DataIdSlot', 'name':'Size', 'type':'number', 'slot':'DataSize'}, "label":"Size", "rotate":true};

    var dropTime = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forParent":{'idSlot':'DataIdSlot', 'name':'Time stamp', 'type':'number|time|date', 'slot':'TimeStamp'}, "label":"Timestamp", "rotate":true};
    var dropID = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forParent":{'idSlot':'DataIdSlot', 'name':'ID', 'type':'number', 'slot':'HaloID'}, "label":"ID", "rotate":false};
    var dropChID = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forParent":{'idSlot':'DataIdSlot', 'name':'Descendant ID', 'type':'number', 'slot':'DescendantID'}, "label":"Child ID", "rotate":false};

    var allDropZones = [dropX, dropY, dropSize, dropID, dropChID, dropTime];

    var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneSize = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneX, dragZoneY, dragZoneSize];
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
	$scope.theView.find('.canvasStuffForDigitalDashboardHaloMerger').droppable({ 
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
	    $log.log("DigitalDashboard Halo Merger Plot: " + message);
	}
    }



    function pixel2time(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < leftMarg) {
	    return timeSpan[0];
	}
	if(p > leftMarg + drawW) {
	    return timeSpan[1];
	}
	return timeSpan[0] + (p - leftMarg) / drawW * timeDelta;
    }

    function pixel2leftY(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < topMarg) {
	    return limits.maxX; // flip Y-axis
	}
	if(p > topMarg + drawH) {
	    return limits.minX; // flip Y-axis
	}
	return limits.minX + (drawH - (p - topMarg)) / drawH * (limits.maxX - limits.minX); // flip Y-axis
    }

    function pixel2rightY(p) {
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
    }


    function val2Size(v, maxDotSize, minDotSize) {
	if(limits.sizeSpan == 1) { 
	    return maxDotSize;
	}
	if(v >= limits.maxSize) {
	    return maxDotSize;
	}
	if(v <= limits.minSize) {
	    return minDotSize;
	}
	if(logScale) {
	    return minDotSize + (maxDotSize - minDotSize) * (Math.log(v) - Math.log(limits.minSize)) / (Math.log(limits.maxSize) - Math.log(limits.minSize));
	} else {
	    return minDotSize + (maxDotSize - minDotSize) * (v - limits.minSize) / (limits.sizeSpan);
	}
    }

    function val2pixelXcrimp(v) {
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
    }

	function value2pixelX(v) {
		if(unique <= 0) {
			return 0;
		}

		return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
	}

    function val2pixelYcrimp(v) {
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
    }

	function value2pixelY(v) {
		if(unique <= 0) {
			return 0;
		}

		return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
	}

    function val2pixelXtime(v) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(v < timeSpan[0]) {
	    return leftMarg;
	}
	if(v > timeSpan[1]) {
	    return leftMarg + drawW;
	}
	
	return leftMarg + (v - timeSpan[0]) / timeDelta * drawW;
    }

    function val2pixelYstory(x, y, time) {
	if(unique <= 0) {
	    return 0;
	}
	
	var left = y;
	var right = x;
	if(y < limits.minY) {
	    left = limits.minY;
	}
	if(x < limits.minX) {
	    right = limit.minX;
	}
	if(y > limits.maxY) {
	    left = limits.maxY;
	}
	if(x > limits.maxX) {
	    right = limits.maxX;
	}
	
	left = topMarg + drawH - (left - limits.minY) / (limits.maxY - limits.minY) * drawH; 
	right = topMarg + drawH - (right - limits.minX) / (limits.maxX - limits.minX) * drawH; 
	
	var dt = (time - timeSpan[0]) / timeDelta;

	return left * (1 - dt) + dt * right;
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
    }

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
		    
		    newSelections.push([X1,X2,Y1,Y2, val2pixelXcrimp(X1),val2pixelXcrimp(X2),val2pixelYcrimp(Y2),val2pixelYcrimp(Y1)]); // flip Y-axis
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
    }

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
	    
	    newSelections.push([X1,X2,Y1,Y2, val2pixelXcrimp(X1),val2pixelXcrimp(X2),val2pixelYcrimp(Y2),val2pixelYcrimp(Y1)]); // flip Y-axis
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
    }


    function resetVars() {
	idArrays = [];
	xArrays = [];
	yArrays = [];
	sArrays = [];
	hArrays = [];
	dArrays = [];
	tArrays = [];

	xName = "";
	yName = "";

	haveIDs = false;
	storyGraphMode = false;

	sources = 0;
	Ns = [];
	N = 0;
	limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
	unique = 0;
	NULLs = 0;

	localSelections = [];

	dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	dragZoneSize = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    }

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
	    var haveSize = false;
	    var haveHaloID = false;
	    var haveDescendantID = false;
	    haveIDs = false;
	    storyGraphMode = false;

	    var xdesc = "";
	    var ydesc = "";
	    var sdesc = "";

	    for(var i = 0; i < parentInput.length; i++) {
		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "X") {
		    haveX = true;
		    
		    dragZoneX.name = "x-axis data";
		    dropX.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneX.ID = JSON.stringify(dropX.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			xdesc = parentInput[i]["description"];
			xName = legacyDDSupLib.shortenName(parentInput[i]["description"]);

			dragZoneX.name = xName;
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Y") {
		    haveY = true;

		    dragZoneY.name = "y-axis data";
		    dropY.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneY.ID = JSON.stringify(dropY.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			ydesc = parentInput[i]["description"];
			yName = legacyDDSupLib.shortenName(parentInput[i]["description"]);

			dragZoneY.name = yName;
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Size") {
		    haveSize = true;
		    
		    dragZoneSize.name = "Size data";
		    dropSize.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneSize.ID = JSON.stringify(dropSize.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			sdesc = parentInput[i]["description"];
			sName =  shortenName(parentInput[i]["description"]);

			dragZoneSize.name = sName;
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "ID") {
		    haveHaloID = true;
		}
		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Descendant ID") {
		    haveDescendantID = true;
		}

	    }

	    if(haveX && haveY && haveSize) {
		atLeastOneFilled = true;
	    }
	    if(haveHaloID && haveDescendantID) {
		haveIDs = true;

		if($scope.gimme("StoryGraphMode")) {
		    storyGraphMode = true;
		}
	    }
	}
	
	// debugLog("read parent input ", atLeastOneFilled);
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    idArrays = $scope.gimme('DataIdSlot');
	    xArrays = $scope.gimme('DataX');
	    yArrays = $scope.gimme('DataY');
	    sArrays = $scope.gimme('DataSize');
	    
	    if(idArrays.length != xArrays.length
	       || idArrays.length != yArrays.length
	       || idArrays.length != sArrays.length) {
		dataIsCorrupt = true;
	    }
	    if(haveIDs) {
		hArrays = $scope.gimme('HaloID');
		dArrays = $scope.gimme('DescendantID');
		tArrays = $scope.gimme('TimeStamp');

		if(idArrays.length != hArrays.length
		   || idArrays.length != dArrays.length
		   || idArrays.length != tArrays.length) {
		    dataIsCorrupt = true;
		}
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
		    var sArray = sArrays[source];
		    
		    if(idArray.length != xArray.length
		       || idArray.length != yArray.length
		       || idArray.length != sArray.length) {
			dataIsCorrupt = true;
		    }
		    if(haveIDs) {
			var hArray = hArrays[source];
			var dArray = dArrays[source];
			var tArray = tArrays[source];
			if(idArray.length != hArray.length
			   || idArray.length != dArray.length
			   || idArray.length != tArray.length) {
			    dataIsCorrupt = true;
			}
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
		var minSize = 0;
		var maxSize = 0;

		for(var source = 0; source < sources; source++) {
		    var idArray = idArrays[source];
		    var xArray = xArrays[source];
		    var yArray = yArrays[source];
		    var sArray = sArrays[source];
		    if(haveIDs) {
			var hArray = hArrays[source];
			var dArray = dArrays[source];
			var tArray = tArrays[source];
		    }

		    N += idArray.length;
		    Ns.push(idArray.length);
		    
		    localSelections.push([]);

		    for(i = 0; i < Ns[source]; i++) {
			localSelections[source].push(0);

			if(xArray[i] !== null 
			   && yArray[i] !== null
			   && sArray[i] !== null) {
			    
			    unique++;

			    var x = xArray[i];
			    var y = yArray[i];
			    var s = sArray[i];

			    if(isNaN(x) || isNaN(y) || isNaN(s)) {
				dataIsCorrupt = true;
			    }
			    

			    if(firstNonNullData) {
				firstNonNullData = false;
				minXVal = x;
				maxXVal = x;
				minYVal = y;
				maxYVal = y;
				minSize = s;
				maxSize = s;
				if(haveIDs) {
				    timeSpan = [tArray[i], tArray[i]];
				}
			    } else {
				minXVal = Math.min(x, minXVal);
				maxXVal = Math.max(x, maxXVal);
				minYVal = Math.min(y, minYVal);
				maxYVal = Math.max(y, maxYVal);
				minSize = Math.min(s, minSize);
				maxSize = Math.max(s, maxSize);
				if(haveIDs) {
				    timeSpan[0] = Math.min(tArray[i], timeSpan[0]);
				    timeSpan[1] = Math.max(tArray[i], timeSpan[1]);
				}
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
		    
		    if(minSize >= maxSize) {
			limits.sizeSpan = 1;
		    } else {
			limits.sizeSpan = maxSize - minSize;
		    }
		    limits.maxSize = maxSize;
		    limits.minSize = minSize;

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

		    if(haveIDs) {
			timeDelta = timeSpan[1] - timeSpan[0];
			if(timeDelta < 0) {
			    timeDelta = 1;
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
	
	updateGraphicsHelper(false, true, true, true);

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

    }




    


    function updateGraphics() {
	updateGraphicsHelper(false, false, false, false);
    }

    function updateGraphicsHelper(forceBackground, forceLines, forceDots, forceAxes) {
	var startTime = Date.now();
    	// debugLog("updateGraphics() start " + startTime);

	var redrawBackground = forceBackground;
	var redrawLines = forceLines;
	var redrawDots = forceDots;
	var redrawAxes = forceAxes;

	if(bgCanvas === null) {
    	    var bgCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(bgCanvasElement.length > 0) {
    		bgCanvas = bgCanvasElement[0];
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

	updateDropZones(textColor, 0.3, false);

	zoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
	zoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
	zoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
	zoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);

	// ===============================
	// Check what needs to be redrawn
	// ===============================

	if(drawW != lastDrawW
	   || drawH != lastDrawH) {
	    redrawBackground = true;
	    redrawLines = true;
	    redrawDots = true;
	    redrawAxes = true;
	}

	if(lastStoryGraphMode != storyGraphMode) {
	    redrawLines = true;
	    redrawDots = true;
	    redrawAxes = true;
	}

	if(!redrawBackground && currentColors != lastColors) {
	    redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
	}
	
	if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
	    redrawAxes = true;
	}

	if(lastHaveIDs != haveIDs) {
	    redrawLines = true;
	}
	
	if(!redrawDots && 
	   (lastMinDotSize != minDotSize
	    || lastMaxDotSize != maxDotSize)) {
	    redrawDots = true;
	}

	if(!redrawAxes || !redrawLines || !redrawDots) {
	    if(zoomMinX != lastZoomMinX
	       || zoomMaxX != lastZoomMaxX
	       || zoomMinY != lastZoomMinY
	       || zoomMaxY != lastZoomMaxY) {
		redrawAxes = true;
		redrawLines = true;
		redrawDots = true;
	    }
	}

	if(!redrawDots || (haveIDs && !redrawLines)) {
	    if(legacyDDSupLib.checkColors(currentColors, lastColors)) {
		redrawDots = true;
		redrawLines = true;
	    }
	}

	// debugLog("Need to redraw: " + redrawBackground + " " + redrawLines + " " + redrawDots + " " + redrawAxes);
	
	// =========================
	// Draw background
	// =========================

	if(redrawBackground) {
    	    drawBackground(W, H);
	}

	// =========================
	// Draw data
	// =========================

	if(redrawLines) {
	    drawLines(W, H);
	}
	
	if(redrawDots) {
    	    drawHalos(W, H);
	}

	// =========================
	// Draw axes and labels
	// =========================

	if(redrawAxes) {
    	    drawAxes(W, H);
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
	lastMinDotSize = minDotSize;
	lastMaxDotSize = maxDotSize;
	lastHaveIDs = haveIDs;
	lastStoryGraphMode = storyGraphMode;

	var endTime = Date.now();
    	// debugLog("updateGraphics() end " + endTime + ", total: " + (endTime - startTime));
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

	    dropY.left = 0;
	    dropY.top = topMarg + marg2;
	    dropY.right = leftMarg;
	    dropY.bottom = topMarg + drawH - marg2;

	    dropX.left = leftMarg + marg1;
	    dropX.top = topMarg + drawH;
	    dropX.right = leftMarg + drawW - marg1;
	    dropX.bottom = H;

	    dropSize.left = leftMarg + drawW;
	    dropSize.top = dropY.top;
	    dropSize.right = W;
	    dropSize.bottom = Math.floor(topMarg + drawH / 2) - marg2;

	    dropTime.left = dropSize.left;
	    dropTime.top = Math.floor(topMarg + drawH / 2) + marg2;
	    dropTime.right = dropSize.right;
	    dropTime.bottom = dropY.bottom;

	    dropID.left = dropX.left;
	    dropID.top = 0;
	    dropID.right = Math.floor(leftMarg + drawW / 2) - marg1;
	    dropID.bottom = topMarg;

	    dropChID.left = Math.floor(leftMarg + drawW / 2) + marg1;
	    dropChID.top = dropID.top;
	    dropChID.right = dropX.right;
	    dropChID.bottom = dropID.bottom;

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
			var tw = legacyDDSupLib.getTextWidth(axCtx, str, fnt);
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
    	    if(currentColors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
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

    function drawAxes(W, H) {
	if(axCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
    	    if(myCanvasElement.length > 0) {
    		axCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no axes canvas to draw on!");
    		return;
    	    }
	}

	if(axCtx === null) {
    	    axCtx = axCanvas.getContext("2d");
	}
	
	axCtx.clearRect(0,0, W,H);
    	axCtx.fillStyle = textColor;
    	axCtx.font = fontSize + "px Arial";

	
	// top label

	var str = "";
	var xw = -1;
	var yw = -1;
	var sw = -1;
	var endw = 0;

	if(xName != "" && yName != "") {
	    str = xName + " --> " + yName;
	    xw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, xName);
	    yw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, yName);
	} else if(xName != "") {
	    str = xName;
	    xw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, xName);
	} else if(yName != "") {
	    str = yName;
	    yw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, yName);
	}
	if(sName != "") {
	    var temp = "(size: " + sName + ")";
	    str += temp;
	    sw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, sName);
	    endw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, temp);
	}

	if(str != "") {
	    var w = legacyDDSupLib.getTextWidthCurrentFont(axCtx, str);
	    var top = 0;
	    if(fontSize < topMarg) {
		top = Math.floor((topMarg - fontSize) / 2);
	    }
	    var left = 0;
	    if(w < W) {
		left = Math.floor((W - w) / 2);
	    }

	    axCtx.fillText(str, left, top + fontSize);

	    if(xw >= 0) {
		dragZoneX = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':xName, 'ID':dragZoneX.ID};
	    }
	    if(yw >= 0) {
		dragZoneY = {'left':(left + w - yw - endw), 'top':top, 'right':(left + w - endw), 'bottom':(top + fontSize), 'name':yName, 'ID':dragZoneY.ID};
	    }
	    if(sw >= 0) {
		dragZoneSize = {'left':(left + w - endw), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':sName, 'ID':dragZoneSize.ID};
	    }
	    allDragNames = [dragZoneX, dragZoneY, dragZoneSize];
	}


	if(storyGraphMode) {
    	    // X Axis, should be time now

	    axCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

	    if(unique > 0) {
		var LABELS = 5;
		for(var i = 0; i < LABELS+1; i++) {
		    var pos = leftMarg + i/LABELS*drawW;
		    
		    var s = "";
		    s = legacyDDSupLib.number2text(pixel2time(pos), timeDelta);
		    
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
    		    axCtx.fillText(s, pos - textW/2, H - bottomMarg);
		    axCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
		}
	    }

    	    // Left Y Axis

	    axCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

	    if(unique > 0) {
		var LABELS = 5;
		for(var i = 0; i < LABELS+1; i++) {
		    var pos = topMarg + i/LABELS*drawH;

		    var s = "";
		    s = legacyDDSupLib.number2text(pixel2leftY(pos), limits.spanX);
		    
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
		    if(leftMarg > textW + 5) {
    			axCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
		    } else {
    			axCtx.fillText(s, 0, pos + fontSize/2);
		    }
		    axCtx.fillRect(leftMarg - 5, pos, 6, 1);
		}
	    }

    	    // Right Y Axis

	    axCtx.fillRect(leftMarg + drawW + 1, topMarg, 2, drawH + 2);

	    if(unique > 0) {
		var LABELS = 5;
		for(var i = 0; i < LABELS+1; i++) {
		    var pos = topMarg + i/LABELS*drawH;

		    var s = "";
		    s = legacyDDSupLib.number2text(pixel2rightY(pos), limits.spanY);
		    
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
		    if(textW + 5 + leftMarg + drawW >= W) {
    			axCtx.fillText(s, W - 1 - textW, pos + fontSize/2);
		    } else {
    			axCtx.fillText(s, leftMarg + drawW + 5, pos + fontSize/2);
		    }
		    axCtx.fillRect(leftMarg + drawW + 5, pos, 6, 1);
		}
	    }

	} else {
    	    // X Axis

	    axCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

	    if(unique > 0) {
		var LABELS = 5;
		for(var i = 0; i < LABELS+1; i++) {
		    var pos = leftMarg + i/LABELS*drawW;
		    
		    var s = "";
		    s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX), limits.spanX);
		    
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
    		    axCtx.fillText(s, pos - textW/2, H - bottomMarg);
		    axCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
		}
	    }

    	    // Y Axis

	    axCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

	    if(unique > 0) {
		var LABELS = 5;
		for(var i = 0; i < LABELS+1; i++) {
		    var pos = topMarg + i/LABELS*drawH;

		    var s = "";
		    s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY), limits.spanY);
		    
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
		    if(leftMarg > textW + 5) {
    			axCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
		    } else {
    			axCtx.fillText(s, 0, pos + fontSize/2);
		    }
		    axCtx.fillRect(leftMarg - 5, pos, 6, 1);
		}
	    }
	}
    }

    function drawLines(W, H) {
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

	if(unique <= 0) {
	    return;
	}

	if(!haveIDs) {
	    return;
	}

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

	var drawPretty = true;	
	if(unique > quickRenderThreshold) {
	    drawPretty = false;
	    var rgba0 = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
	    var rgbaText = legacyDDSupLib.hexColorToRGBAvec(textColor, transparency);
	    var imData = lineCtx.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
	    var pixels = imData.data;
	}

    	for(var set = 0; set < Ns.length; set++) {
    	    var xArray = xArrays[set];
    	    var yArray = yArrays[set];
	    var sArray = sArrays[set];
	    
	    if(haveIDs) {
		var hArray = hArrays[set];
		var dArray = dArrays[set];
		var tArray = tArrays[set];
	    } else {
		var hArray = [];
		var dArray = [];
		var tArray = [];
	    }

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
		if(dArray[i] >= 0) { // this halo has a descendant, so we should draw a line
		    // for(var j = 0; j < Ns[set]; j++) {
		    for(var j = i+1; j < Ns[set]; j++) { // should appear later in the data. Note: there are halos with same IDs in other series, should we also check the "time" field from the original data to classify the series?
			if(tArray[j-1] > tArray[j]) {
			    j = Ns[set] + 1; // we have reached a new series of data
			} else if(hArray[j] == dArray[i]) { // we found the descendant
    			    if(xArray[i] === null
			       || yArray[i] === null
			       || sArray[i] === null
			       || xArray[j] === null
			       || yArray[j] === null
			       || sArray[j] === null) {
				// nothing to do
    			    } else {
				if(!storyGraphMode
				   && ((xArray[i] < zoomMinX && xArray[j] < zoomMinX)
				       || (xArray[i] > zoomMaxX && xArray[j] > zoomMaxX)
				       || (yArray[i] < zoomMinY && yArray[j] < zoomMinY)
				       || (yArray[i] > zoomMaxY && yArray[j] > zoomMaxY)))
				{
				    // nothing to do // outside zoomed range
				} else {
				    var groupId1 = 0;
				    if(i < selArray.length) {
					groupId1 = selArray[i];
				    }
				    var groupId2 = 0;
				    if(j < selArray.length) {
					groupId2 = selArray[j];
				    }
				    
				    if(storyGraphMode) {
					var x1 = val2pixelXtime(tArray[i]);
					var y1 = val2pixelYstory(xArray[i], yArray[i], tArray[i]);
					var x2 = val2pixelXtime(tArray[j]);
					var y2 = val2pixelYstory(xArray[j], yArray[j], tArray[j]);
				    } else {
					var x1 = value2pixelX(xArray[i]);
					var y1 = value2pixelY(yArray[i]);
					var x2 = value2pixelX(xArray[j]);
					var y2 = value2pixelY(yArray[j]);
				    }

				    
				    if(drawPretty) {
					var col = textColor;
					lineCtx.save();
					if(groupId1 <= 0 && groupId2 <= 0) {
					    col = legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors);
    					    lineCtx.setLineDash([3, 5]);
					}
					else if(groupId1 > 0 && groupId2 > 0) {
					    if(groupId1 == groupId2) {
						col = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
						// col = legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors);
					    } else {
						col = textColor;
					    }
					}else {
					    col = legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors);
					}

    					lineCtx.strokeStyle = col;
    					lineCtx.lineWidth = 1;
    					lineCtx.beginPath();
    					lineCtx.moveTo(x1, y1);
					
    					lineCtx.lineTo(x2, y2);
					
    					lineCtx.stroke();
					lineCtx.restore();

				    } else {

					var col = rgba0;
					var dashed = false;
					if(groupId1 <= 0 && groupId2 <= 0) {
					    col = rgba0;
    					    dashed = true;
					} else if(groupId1 > 0 && groupId2 > 0) {
					    if(groupId1 == groupId2) {
						col = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
					    } else {
						col = rgbaText;
					    }
					} else {
					    col = rgba0;
					}
					
					if(col[3] >= 255) {
					    drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
					} else {
					    drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, x1, y1, x2, y2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
					}
				    }
				}
			    }

			    j = Ns[set] + 1;
			}
		    }
    		}
	    }
	}

	if(!drawPretty) {
	    lineCtx.putImageData(imData, 0, 0);
	}
    }

    function drawHalos(W, H) {
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


	// first draw all the unselected data
	var zeroTransp = 0.33 * transparency;
	
	var drawPretty = true;
	if(unique > quickRenderThreshold) {
	    drawPretty = false;
	    var rgba0 = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
	    var imData = dotCtx.getImageData(0, 0, dotCanvas.width, dotCanvas.height);
	    var pixels = imData.data;
	} else {
	    var col0 = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
	    var fill0 = legacyDDSupLib.getGradientColorForGroup(0, 0,0,W,H, zeroTransp, dotCanvas, dotCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);
	}





    	for(var set = 0; set < Ns.length; set++) {
    	    var xArray = xArrays[set];
    	    var yArray = yArrays[set];
	    var sArray = sArrays[set];

	    if(storyGraphMode) {
		var tArray = tArrays[set];
	    }

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(xArray[i] === null
		   || yArray[i] === null
		   || sArray[i] === null
		   || (storyGraphMode && tArray[i] === null)) {
    		    continue;
    		}
		
		if(!storyGraphMode && 
		   (xArray[i] < zoomMinX
		    || xArray[i] > zoomMaxX
		    || yArray[i] < zoomMinY
		    || yArray[i] > zoomMaxY)) {
		    continue; // outside zoomed range
		}

                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId == 0) {
		    if(storyGraphMode) {
			var x = val2pixelXtime(tArray[i]);
			var y = val2pixelYstory(xArray[i], yArray[i], tArray[i]);
		    } else {
			var x = value2pixelX(xArray[i]);
			var y = value2pixelY(yArray[i]);
		    }
		    var dotSize = val2Size(sArray[i], maxDotSize, minDotSize);

		    if(drawPretty) {
			if(!useGlobalGradients) {
				fill = legacyDDSupLib.getGradientColorForGroup(0, x-dotSize,y-dotSize,x+dotSize,y+dotSize, zeroTransp, dotCanvas, dotCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);
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
			drawDot(x, y, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], W, H, pixels);
		    }
		}
	    }
    	}

	// next, draw all the selected data on top
    	for(var set = 0; set < Ns.length; set++) {
    	    var xArray = xArrays[set];
    	    var yArray = yArrays[set];
	    var sArray = sArrays[set];

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(xArray[i] === null
		   || yArray[i] === null
		   || sArray[i] === null
		   || (storyGraphMode && tArray[i] === null)) {    		    
		    continue;
    		}
		
		if(!storyGraphMode && 
		   (xArray[i] < zoomMinX
		    || xArray[i] > zoomMaxX
		    || yArray[i] < zoomMinY
		    || yArray[i] > zoomMaxY)) {
		    continue; // outside zoomed range
		}

                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId != 0) {
		    if(storyGraphMode) {
			var x = val2pixelXtime(tArray[i]);
			var y = val2pixelYstory(xArray[i], yArray[i], tArray[i]);
		    } else {
			var x = value2pixelX(xArray[i]);
			var y = value2pixelY(yArray[i]);
		    }
		    var dotSize = val2Size(sArray[i], maxDotSize, minDotSize);

		    if(drawPretty) {

			var col = legacyDDSupLib.hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
    		var fill = legacyDDSupLib.getGradientColorForGroup(groupId, x-dotSize,y-dotSize,x+dotSize,y+dotSize, transparency, dotCanvas, dotCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);
			dotCtx.beginPath();
			dotCtx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
			dotCtx.fillStyle = fill;
			dotCtx.fill();
			dotCtx.lineWidth = 1;
			dotCtx.strokeStyle = col;
			dotCtx.stroke();
		    } else {
			rgba = legacyDDSupLib.hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
			if(rgba[3] >= 255) {
			    drawDotfullalpha(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
			} else {
			    drawDot(x, y, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
			}
		    }
		}
	    }
    	}

	if(!drawPretty) {
	    dotCtx.putImageData(imData, 0, 0);
	}
    }




    // This line drawing function was copied from http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
    // The code is not original to me. I was very slightly modified by me.
    /// <summary>
    /// Draws a colored line by connecting two points using a DDA algorithm (Digital Differential Analyzer).
    /// </summary>
    function drawLineDDA(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY)
    {
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
		if(!dashed 
		   || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
		    
		    var ry = Math.round(y);
		    var rx = Math.round(x);
		    if(ry >= minY && ry < maxY
		       && rx >= minX && rx < maxX) {

			var offset = (ry * W + rx) * 4;

			legacyDDSupLib.blendRGBAs(r,g,b,alpha, offset, pixels);
		    }
		}
                x += incx;
                y += incy;
	    }
        }
    }

    function drawLineDDAfullalpha(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY)
    {
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
		if(!dashed 
		   || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
		    
		    var ry = Math.round(y);
		    var rx = Math.round(x);
		    if(ry >= minY && ry < maxY
		       && rx >= minX && rx < maxX) {

			var offset = (ry * W + rx) * 4;

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
			    legacyDDSupLib.blendRGBAs(r,g,b,alpha, startPixelIdx + offset, pixels);
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

    	if(bgCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
    	    if(myCanvasElement.length > 0) {
    		bgCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
	}
	bgCanvas.width = rw;
	bgCanvas.height = rh;

    	if(lineCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
    	    if(myCanvasElement.length > 0) {
    		lineCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
	}
	lineCanvas.width = rw;
	lineCanvas.height = rh;

    	if(dotCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
    	    if(myCanvasElement.length > 0) {
    		dotCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
	}
	dotCanvas.width = rw;
	dotCanvas.height = rh;

    	if(axCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
    	    if(myCanvasElement.length > 0) {
    		axCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no axes canvas to resize!");
    	    }
	}
	if(axCanvas) {
	    axCanvas.width = rw;
	    axCanvas.height = rh;
	}

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

	// debugLog("updateSize found selections: " + JSON.stringify(selections));
	updateSelectionsWhenZoomingOrResizing();

	updateDropZones(textColor, 0.3, false);

	// debugLog("updateSize updated selections to: " + JSON.stringify(selections));
    };

    function updateSelectionsWhenZoomingOrResizing() {
	if(unique > 0) {
	    for(var sel = 0; sel < selections.length; sel++) {
		var s = selections[sel];
		s[4] = val2pixelXcrimp(s[0]);
		s[5] = val2pixelXcrimp(s[1]);
		s[7] = val2pixelYcrimp(s[2]);
		s[6] = val2pixelYcrimp(s[3]);
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
	    updateGraphicsHelper(false, true, true, false);
	    break;

	case "StoryGraphMode":
	    var newStoryGraphMode = eventData.slotValue;
	    if(newStoryGraphMode) {
		if(!storyGraphMode) {
		    if(haveIDs) {
			storyGraphMode = true; // if no IDs, never set to storyGraphMode
			updateGraphicsHelper(false, true, true, true);
		    }
		}
	    } else {
		if(storyGraphMode) {
		    storyGraphMode = false;
		    if(haveIDs) {
			updateGraphicsHelper(false, true, true, true);
		    }
		}
	    }
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
			updateGraphicsHelper(false, true, true, false);
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
    		updateGraphicsHelper(false, true, true, true);
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
    		updateGraphicsHelper(false, true, true, true);
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
    		updateGraphicsHelper(false, true, true, true);
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
    		updateGraphicsHelper(false, true, true, true);
	    }
    	    break;

    	case "FontSize":
	    updateSize();
    	    updateGraphicsHelper(false, false, false, true);
    	    break;
	    
    	case "DrawingArea:height":
	    updateSize();
    	    updateGraphicsHelper(true, true, true, true);
    	    break;
    	case "DrawingArea:width":
	    updateSize();
    	    updateGraphicsHelper(true, true, true, true);
    	    break;
    	case "root:height":
	    updateSize();
	    // parseSelectionColors();
    	    updateGraphicsHelper(true, true, true, true);
    	    break;
    	case "root:width":
	    updateSize();
	    // parseSelectionColors();
    	    updateGraphicsHelper(true, true, true, true);
    	    break;

	case "LogScaleForDots":
	    var newLogScale = $scope.gimme("LogScaleForDots");
	    if(newLogScale) {
		if(!logScale) {
		    logScale = true;
		    updateGraphicsHelper(false, false, true, false);
		}
	    } else {
		if(logScale) {
		    logScale = false;
		    updateGraphicsHelper(false, false, true, false);
		}
	    }
	    break;

    	case "MaxDotSize":
	    var maxDotSizeNew = $scope.gimme('MaxDotSize');
	    if(typeof maxDotSizeNew !== 'number') {
		try {
		    maxDotSizeNew = parseInt(maxDotSizeNew);
		} catch(e) {
		    maxDotSizeNew = 1;
		}
	    }
	    if(maxDotSizeNew < 1) {
		maxDotSizeNew = 1;
	    }
	    if(maxDotSizeNew < minDotSize) {
		minDotSize = maxDotSizeNew;
		maxDotSize = maxDotSizeNew;
    		updateGraphicsHelper(false, false, false, false);
	    } else if(maxDotSizeNew != maxDotSize) {
		maxDotSize = maxDotSizeNew;
    		updateGraphicsHelper(false, false, false, false);
	    }
    	    break;
    	case "MinDotSize":
	    var minDotSizeNew = $scope.gimme('MinDotSize');
	    if(typeof minDotSizeNew !== 'number') {
		try {
		    minDotSizeNew = parseInt(minDotSizeNew);
		} catch(e) {
		    minDotSizeNew = 1;
		}
	    }
	    if(minDotSizeNew < 1) {
		minDotSizeNew = 1;
	    }
	    if(minDotSizeNew > maxDotSize) {
		maxDotSize = minDotSizeNew;
		minDotSize = minDotSizeNew;
    		updateGraphicsHelper(false, false, false, false);
	    } else if(minDotSizeNew != minDotSize) {
		minDotSize = minDotSizeNew;
    		updateGraphicsHelper(false, false, false, false);
	    }
    	    break;
    	case "UseGlobalColorGradients":
	    if(eventData.slotValue) {
		if(!useGlobalGradients) {
		    useGlobalGradients = true;
    		    
		    updateGraphicsHelper(false, false, true, false);
		}
	    } else {
		if(useGlobalGradients) {
		    useGlobalGradients = false;
		    updateGraphicsHelper(false, false, true, false);
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
	    currentColors = legacyDDSupLib.copyColors(colors);

    	    updateGraphics();
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
	    updateGraphicsHelper(false, true, true, false);
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

		// y1 and y2 need to be switched here, because we flip the y axis
	    var newSel = [legacyDDSupLib.pixel2valX(x1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valX(x2, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valY(y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.pixel2valY(y1, unique, drawH, topMarg, zoomMinY, zoomMaxY), x1,x2,y1,y2];
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
    }

    function selectClosestHalo(currentMouse) {
	var first = true;

	var limit = (maxDotSize + 1) * (maxDotSize + 1);

	for(var set = 0; set < idArrays.length; set++) {
	    var xArray = xArrays[set];
	    var yArray = yArrays[set];
	    if(storyGraphMode) {
		var tArray = tArrays[set];
	    }

	    for(var i = 0; i < Ns[set]; i++) {
		if(xArray[i] !== null
		   && yArray[i] !== null) {
		    // var dx = xArray[i] - (currentMouse.x - leftMarg);
		    // var dy = yArray[i] - (currentMouse.y - topMarg);
		    if(storyGraphMode) {
			var dx = val2pixelXtime(tArray[i]) - currentMouse.x;
			var dy = val2pixelYstory(xArray[i], yArray[i], tArray[i]) - currentMouse.y;
		    } else {
			var dx = value2pixelX(xArray[i]) - currentMouse.x;
			var dy = value2pixelY(yArray[i]) - currentMouse.y;
		    }
		    var dist = dx*dx + dy*dy;

		    // if(first && Math.abs(dx) < drawW && Math.abs(dy) < drawH) {
		    // 	debugLog("found something on screen, " + dist);
		    // }
		    
		    if(dist <= limit) {
			if(first || dist < bestDist) {
			    bestSet = set;
			    bestIdx = i;
			    bestDist = dist;
			    first = false;
			}
		    }
		}
	    }
	}
	
	if(!first) {
	    updateLocalSelections(false); // reset any old selections

	    var selArray = localSelections[bestSet];
	    selArray[bestIdx] = selections.length + 1;
	    
	    if(haveIDs) {
		var set = bestSet;

		var hArray = hArrays[set];
		var dArray = dArrays[set];
		var tArray = tArrays[set];
		var selArray = localSelections[set];

		if(dArray[bestIdx] >= 0) { // this halo has a descendant, so we should draw a line
		    var next = bestIdx;
		    for(var j = bestIdx+1; j < Ns[set]; j++) { // should appear later in the data. Note: there are halos with same IDs in other series, should we also check the "time" field from the original data to classify the series?
			if(tArray[j-1] > tArray[j]) {
			    j = Ns[set] + 1; // we have reached a new series of data
			} else if(hArray[j] == dArray[next]) { // we found the descendant
			    
			    selArray[j] = selections.length + 2; 
			    next = j;
			    if(dArray[next] < 0) {
				// no descendants, quit
				j = Ns[set] + 1;
			    }
			    // find all descendants and all ancestors too!!
			}
		    }
		}

		// find ancestors
		var descendants = {};
		descendants[hArray[bestIdx]] = true;
		for(var j = bestIdx - 1; j >= 0; j--) {
		    if(tArray[j] > tArray[j+1]) { // we entered a new series
			j = -1;
		    } else if(dArray[j] >= 0 && descendants.hasOwnProperty(dArray[j])) {
			descendants[hArray[j]] = true; // anyone being an ancestor of this node is also OK
			selArray[j] = selections.length + 3;
		    }
		}
	    }
	    
	    $scope.set('LocalSelections', {'DataIdSlot':localSelections});
	    $scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
	}
    }



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
		selectionColors.color = legacyDDSupLib.hexColorToRGBA(colors['selection']['color'], selectionTransparency);
	    } else {
		selectionColors.color = legacyDDSupLib.hexColorToRGBA('#FFA500', selectionTransparency); // orange
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
		    var s = "[";
		    
		    if(storyGraphMode) {
			var x = pixel2time(currentMouse.x);

			s += legacyDDSupLib.number2text(x, timeDelta);
		    } else {
			var x = legacyDDSupLib.pixel2valX(currentMouse.x, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
			var y = legacyDDSupLib.pixel2valX(currentMouse.y, unique, drawW, leftMarg, zoomMinX, zoomMaxX);

			s += legacyDDSupLib.number2text(x, limits.spanX);

			s += ",";

			s += legacyDDSupLib.number2text(y, limits.spanY);
		    }

		    s += "]";

		    // var s = "(" + legacyDDSupLib.number2text(x, limits.spanX) + "," + legacyDDSupLib.number2text(y, limits.spanY) + ")";
		    var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
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
	    // debugLog("mouse down");
	    if(e.shiftKey) {
		if(e.which === 1){
		    currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		    
		    if(mousePosIsInSelectableArea(currentMouse)) {
			selectClosestHalo(currentMouse);
		    }
		}
	    } else {
		if(!storyGraphMode) {
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
		} else {// storyGraphMode


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

    // 	    // debugLog("keyPressed over me: '" + keyName + "'");
	    
    // 	    switch(keyName) {
    // 	    case '+':
    // 	    case "=":
    // 	    case "= +":
    // 		zoomIn();
    // 		break;
    // 	    case '-':
    // 	    case "_":
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
	updateGraphicsHelper(false, false, false, false);
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
	updateGraphicsHelper(false, false, false, false);
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
	    updateGraphicsHelper(false, true, true, true);
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
	    updateGraphicsHelper(false, true, true, true);
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
	    updateGraphicsHelper(false, true, true, true);
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
	    updateGraphicsHelper(false, true, true, true);
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
				fontSize,
				"Font Size",
				'The font size to use in the Webble interface.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('MinDotSize',
				minDotSize,
				"MinDotSize",
				'The size (in pixels) of the smallest dots in the plot.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
        $scope.addSlot(new Slot('MaxDotSize',
				maxDotSize,
				"MaxDotSize",
				'The size (in pixels) of the largest dots in the plot.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('LogScaleForDots',
				logScale,
				"Log Scale for Dots",
				'Use the logarithm of the size parameter to scale the dots (instead of the raw value).',
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
				quickRenderThreshold,
				"Quick Render Threshold",
				'The number of data items to accept before switching to faster (but less pretty) rendering.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('StoryGraphMode',
				storyGraphMode,
				"StoryGraph Mode",
				'Rendering as StoryGraph (3-dimensional plotting, left side X axis, right side Y axis, x-axis as time).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',
				"Halo Merger Plot",
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
				[[{'idSlot':'DataIdSlot', 'name':'X', 'type':'number', 'slot':'DataX'},
				  {'idSlot':'DataIdSlot', 'name':'Y', 'type':'number', 'slot':'DataY'},
				  {'idSlot':'DataIdSlot', 'name':'Size', 'type':'number', 'slot':'DataSize'},
				  {'idSlot':'DataIdSlot', 'name':'ID', 'type':'number', 'slot':'HaloID'},
				  {'idSlot':'DataIdSlot', 'name':'Descendant ID', 'type':'number', 'slot':'DescendantID'},
				  {'idSlot':'DataIdSlot', 'name':'Time stamp', 'type':'number|time|date', 'slot':'TimeStamp'},
				 ],
				 [{'idSlot':'DataIdSlot', 'name':'X', 'type':'number', 'slot':'DataX'},
				  {'idSlot':'DataIdSlot', 'name':'Y', 'type':'number', 'slot':'DataY'},
				  {'idSlot':'DataIdSlot', 'name':'Size', 'type':'number', 'slot':'DataSize'}]],
				"Expected Format",
				'The input this plugin accepts.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


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

        $scope.addSlot(new Slot('DataSize',
				[[3,2,1,2,3,4]],
				"Data Size",
				'The slot where the values to base the size of the dots should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataSize').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('HaloID',
				[[1,2,3,4,5,7]],
				"Halo ID",
				'The slot where the halo IDs should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('HaloID').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('DescendantID',
				[[2,3,2,7,7,-1]],
				"Halo ID",
				'The slot where the IDs of halos that represent the same halo at the next time step should be put (negative values indicate there are no descendants).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DescendantID').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('TimeStamp',
				[[0.1,0.2,0.3,1.0,0.1,0.2]],
				"Time Stamp",
				'The slot where the time stamps of the data readings should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('TimeStamp').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);


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

	updateSize();
	// drawW = null;
	// drawH = null;
	// fontSize = null;

	var maxDotSizeNew = $scope.gimme('MaxDotSize');
	if(typeof maxDotSizeNew !== 'number') {
	    try {
		maxDotSizeNew = parseInt(maxDotSizeNew);
	    } catch(e) {
		maxDotSizeNew = 1;
	    }
	}
	if(maxDotSizeNew < 1) {
	    maxDotSizeNew = 1;
	}
	maxDotSize = maxDotSizeNew;

	var minDotSizeNew = $scope.gimme('MinDotSize');
	if(typeof minDotSizeNew !== 'number') {
	    try {
		minDotSizeNew = parseInt(minDotSizeNew);
	    } catch(e) {
		minDotSizeNew = 1;
	    }
	}
	if(minDotSizeNew < 1) {
	    minDotSizeNew = 1;
	}
	if(minDotSizeNew > maxDotSize) {
	    maxDotSize = minDotSizeNew;
	}
	minDotSize = minDotSizeNew;

	updateGraphicsHelper(true, true, true, true);
	// textColor = null;
	// currentColors = null;

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
