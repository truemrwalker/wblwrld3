//======================================================================================================================
// Controllers for DigitalDashboardPluginSlidingHistogram for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================
wblwrld3App.controller('slidingHistogramPluginWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        // BackHolder: ['width', 'height']
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Sliding Histograms";

    var myInstanceId = -1;
    
    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var dropCanvas = null;
    var dropCtx = null;
    
    var hoverText = null;

    var dataName = null;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.533;

    var selectionHolderElement = null;
    var selectionRect = null;

    var dataArrays = [];

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

    var leftShift = 0;
    var drawH = 1;
    var drawW = 1;
    var barW = 1;

    var useLogN = false;
    var useLogX = false;

    var maxCount = 0;
    var countLs = [];

    var internalSelectionsInternallySetTo = {};

    var dropZ = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forParent":{'idSlot':'DataIdSlot', 'name':'data', 'type':'number|date', 'slot':'DataForSlidingHistogramSlot'}, "label":"Data", "rotate":false};
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
	$scope.theView.find('.canvasStuffForDigitalDashboardSlidingHistogram').droppable({ 
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
	    $log.log("DigitalDashboard Sliding Histograms: " + message);
	}
    };


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

	var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
	var nullGroup = 0;
	if(!nullAsUnselected) {
	    nullGroup = selections.length + 1; // get unused groupId
	}

	var dirty = false;
	
	// debugLog("selections before sorting: " + JSON.stringify(selections));
	selections.sort(function(a,b){return (a[1]-a[0]) - (b[1]-b[0]);}); // sort selections so smaller ones are checked first.
	// debugLog("selections after sorting: " + JSON.stringify(selections));

	for(var set = 0; set < Ns.length; set++) {
	    var dataArray = dataArrays[set];
	    var selArray = localSelections[set];

	    for(var i = 0; i < Ns[set]; i++) {
		var newVal = 1;
		
		if(dataArray[i] === null) {
		    newVal = nullGroup;
		} else {

		    if(selectAll) {
			newVal = 1;
		    } else {
			var groupId = 0;
			
			var val = dataArray[i];
			if(typeof val === "string") {
			    val = Number(val);
			}
			if(dataType == 'date' && val instanceof Date) {
			    val = val.getTime();
			}
			    
			for(var span = 0; span < selections.length; span++) {
			    // if(selections[span][0] <= val
			    //    && (val < selections[span][1]
			    // 	   || (val <= selections[span][1]
			    // 	       && selections[span][1] == limits.max))) {
			    if(selections[span][0] <= val
			       && val < selections[span][1]) {
				groupId = span + 1;
				break;
			    }
			}
			newVal = groupId;
		    }
	        } // not null

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
	dataArrays = [];
	localSelections = [];
	dataType = "number";
	
	dataName = null;
	dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};

	sources = 0;
	Ns = [];
	N = 0;
	limits = {max:0, min:0};
	unique = 0;
	NULLs = 0;

    };

    function parseData() {
	debugLog("parseData");

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
		    } else {
			dataType = 'number';
		    }

		    dragZone.name = "Data";
		    dropZ.forParent.vizName = $scope.gimme("PluginName");
		    dragZone.ID = JSON.stringify(dropZ.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			dataName = legacyDDSupLib.shortenName(parentInput[i]["description"]);
			dragZone.name = dataName;
		    }
		}
	    }
	}
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    var idArrays = $scope.gimme('DataIdSlot');
	    dataArrays = $scope.gimme('DataForSlidingHistogramSlot');

	    if(idArrays.length != dataArrays.length) {
		dataIsCorrupt = true;
	    }
	    if(idArrays.length <= 0) {
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
		    
		    N += dataArray.length;
		    Ns.push(dataArray.length);

		    localSelections.push([]);

		    for(i = 0; i < Ns[source]; i++) {
			localSelections[source].push(0);

			if(dataArray[i] !== null) {
			    var val = dataArray[i];
			    if(typeof val === "string") {
				val = Number(val);
			    }
			    if(dataType == 'date' && val instanceof Date) {
				val = val.getTime();
			    }
			    unique += 1;

			    if(firstNonNullData) {
				firstNonNullData = false;
				minVal = val;
				maxVal = val;
			    } else {
				if(val < minVal) {
				    minVal = val;
				}
				if(val > maxVal) {
				    maxVal = val;
				}
			    }
			} else {
			    NULLs += 1;
			}
		    }
		}		
		if(firstNonNullData) {
		    dataIsCorrupt = true; // only null values
		} else {
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
	    }
	    
	    if(dataIsCorrupt) {
		debugLog("data is corrupt");
		resetVars();
	    } 
	} else {
	    // debugLog("no data");
	}
	
	updateGraphics();

	if(unique > 0) {
	    var giveUp = checkSelectionsAfterNewData();
	    if(giveUp) {
		selectAll();
	    } else {
		updateLocalSelections(false);
		saveSelectionsInSlot();
	    }
	} else {
	    $scope.set('LocalSelections', {'DataIdSlot':[]});
	    
	    if(selectionCtx === null) {
    		selectionCtx = selectionCanvas.getContext("2d");
		var W = selectionCanvas.width;
		var H = selectionCanvas.height;
		selectionCtx.clearRect(0,0, W,H);
	    }
	}

    };

    function updateGraphics() {
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

    	var colors = $scope.gimme("GroupColors");
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
    }; 

    function drawBackground(W,H) {
    	var colors = $scope.gimme("GroupColors");
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
		    text = legacyDDSupLib.date2text(val, dateFormat);
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
		
		var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, text);
		
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

		    var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, text);

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
	    xw = legacyDDSupLib.getTextWidthCurrentFont(ctx, dataName);
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
		dragZone = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dragZone.name, 'ID':dragZone.ID};
	    }
	    allDragNames = [dragZone];
	}
    };

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
    	var n = N;

    	var globalSelections = [];
	var globalSelectionsPerId = $scope.gimme('GlobalSelections');
	if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
	    globalSelections = globalSelectionsPerId['DataIdSlot'];
	}

	var ls = [];

    	for(var set = 0; set < dataArrays.length; set++) {
    	    var dataArray = dataArrays[set];
	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(dataArray[i] === null) {
    		    continue;
    		}
		
                var d = dataArray[i];
		if(typeof d === "string") {
		    d = Number(d);
		}
		if(dataType == 'date' && d !== null && d instanceof Date) {
		    d = d.getTime();
		}

                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		insertSorted(d, ls, groupId);
            }
    	}
	
	if(ls.length > drawW) {
	    // need to merge

	    // make one bar one pixel wide
	    var ls2 = [];

	    var curIdx = 0;
	    var curSum = 0;

	    for(var i = 0; i < ls.length; i++) {
		var thisIdx = Math.floor((ls[i][0] - limits.min) / (limtis.max - limits.min) * drawW);
		while(thisIdx > curIdx) {
		    ls2.push([limits.min + curIdx / drawW * (limits.max - limits.min), curSum]);
		    curSum = 0;
		    curIdx++;
		}
		curSum += ls[i][1];
	    }
	    if(curSum > 0) {
		ls2.push([limits.min + curIdx / drawW * (limits.max - limits.min), curSum]);
	    }
	    
	    ls = ls2;
	}
	
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
    		    var c = legacyDDSupLib.getGradientColorForGroup(groupId, x1,y2,x2,y1, transp, myCanvas, ctx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, ((typeof $scope.gimme("ColorScheme") === 'string') ? JSON.parse($scope.gimme("ColorScheme")):$scope.gimme("ColorScheme")));



    		    ctx.fillStyle = c;
    		    ctx.fillRect(x1,yy1,x2 - x1, yy2 - yy1);
		}
		
    		ctx.fillStyle = textColor;
    		ctx.fillRect(x1,y1,x2-x1,1); // top
    		ctx.fillRect(x1,y1,1,y2-y1); // left
    		ctx.fillRect(x1,y2-1,x2-x1,1); // bottom
    		ctx.fillRect(x2-1,y1,1,y2-y1); // right
	    }
	}
    }




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

    	switch(eventData.slotName) {
	case "InternalSelections":
	    if(eventData.slotValue != internalSelectionsInternallySetTo) {
		setSelectionsFromSlotValue();
	    }
	    break;

    	case "TreatNullAsUnselected":
    	    updateLocalSelections(false);
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
    	};
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

    function selectAll() {
	if(unique <= 0) {
	    selections = [];
	} else {
	    selections = [[limits.min, limits.max + 1, leftMarg, leftMarg + drawW, true]];
	}
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
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
		try {
		    var temp = legacyDDSupLib.hexColorToRGBA(selectionColors.border, 0.8);
		    selectionColors.border = temp;
		} catch(e) {
		    // if it does not work, live with a non-transparent border
		}

	    } else {
		// selectionColors.border = '#FFA500'; // orange
		selectionColors.border = legacyDDSupLib.hexColorToRGBA('#FFA500', 0.8);
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
			    s = legacyDDSupLib.date2text(countLs[idx][0], dateFormat) + " --> " + countLs[idx][1];
			} else {
			    s = countLs[idx][0].toPrecision(3) + " --> " + countLs[idx][1];
			}
			var sNoMarkUp = s;

			var textW = legacyDDSupLib.getTextWidthCurrentFont(ctx, sNoMarkUp);
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

        $scope.addSlot(new Slot('DataDropped',
				{},
				"Data Dropped",
				'Slot to notify parent that data has been dropped on this plugin using drag&drop.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataDropped').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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

        $scope.addSlot(new Slot('UseGlobalColorGradients',
				false,
				"Use Global Color Gradients",
				'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
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

        $scope.addSlot(new Slot('PluginName',                  // Name
				"Sliding Histogram",                              // Value
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


        $scope.addSlot(new Slot('ExpectedFormat',
				[				 
				    [{'idSlot':'DataIdSlot', 'name':'data', 'type':'number|date', 'slot':'DataForSlidingHistogramSlot'}]
				],
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

        $scope.addSlot(new Slot('DataForSlidingHistogramSlot',
				[[1,1,3,4,3,1]],
				"Data for Sliding Histogram Slot",
				'The slot where the input data should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataForSlidingHistogramSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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
