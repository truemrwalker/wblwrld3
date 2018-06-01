//======================================================================================================================
// Controllers for DigitalDashboardPluginGridData for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('gridDataPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Grid Data";
    $scope.dataSetName = "";

    var myInstanceId = -1;

    var dim = [256, 256, 256];
    
    // graphics

    var bgCanvas = null;
    var bgCtx = null;
    var axesCanvas = null;
    var axesCtx = null;
    var plotCanvas = null;
    var plotCtx = null;
    var dropCanvas = null;
    var dropCtx = null;

    var quickRenderThreshold = 500;

    var currentColors = null;
    var textColor = "#000000";
    
    var hoverText = null;
    var mouseIsOverMe = false;

    var dataName = null;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.9;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    var lastSeenGlobalSelections = [];

    // layout
    var leftMarg = 20;
    var topMarg = 20;
    var rightMarg = 20;
    var bottomMarg = 5;
    var fontSize = 11;

    var cellWidth = 0;
    var cellW = 0;

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var mode = "";
    var style = "";
    var levels = 2;
	
    var lastMode = "";
    var lastLevels = -1;
    var lastStyle = "";
    
    // var colorMode = "minmax";
    var colorMode = "histogram";

    var clickStart = null;

    // data from parent

    var idArrays = [];
    var _3DArrays = [];

    var sources = 0;
    var Ns = [];
    var N = 0;

    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};

    var unique = 0; // number of data points with non-null values
    var NULLs = 0;

    var localSelections = []; // the data to send to the parent

    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;

    var internalSelectionsInternallySetTo = {};

    var xAxisAxis = 0;
    var yAxisAxis = 1;
    var zAxisAxis = 2;


    var dropZ = {'left':leftMarg, 'top':topMarg, 'right':leftMarg+drawW, 'bottom':topMarg+drawH, "forParent":{'idSlot':'DataIdSlot', 'name':'3D Data', 'type':'3Darray', 'slot':'Data'}, "label":"Data", "rotate":false};
    var allDropZones = [dropZ];

    var dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZone];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";


    var lastDrawW = null;
    var lastDrawH = null;
    var lastFontSize = null;
    var lastTextColor = null;
    var lastColors = null;
    var lastCellW = null;

    var lastXAxisAxis = null;
    var lastYAxisAxis = null;
    var lastZAxisAxis = null;

    var lastColorMode = null;

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
	$scope.theView.find('.canvasStuffForDigitalDashboardGridData').droppable({ 
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
	    $log.log("DigitalDashboard Grid Data: " + message);
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

    function shortenName(n) {
	var ss = n.split(":");
	return ss[ss.length - 1];
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

    function binLookup(ls, val, start, end) {

	if(start >= end) {
	    if(ls[start] == val) {
		return start;
	    } else {
		return -1;
	    }
	} else {
	    var mid = Math.floor((start + end) / 2);
	    if(ls[mid] == val) {
		return mid;
	    }
	    if(ls[mid] < val) {
		return binLookup(ls, val, mid+1, end);
	    } else {
		return binLookup(ls, val, start, mid-1);
	    }
	}
    }

    function pixels2dimVals(pos) {
	var res = {"dim":null, "x":0, "y":0, "val":0};
	
	if(unique <= 0) {
	    return res;
	} else {
	    res.dim = xAxisAxis;

	    res.x = Math.max(0, Math.min(dim[xAxisAxis] - 1, Math.floor( (pos.x - leftMarg) / cellW)));
	    
	    res.y = Math.max(0, Math.min(dim[yAxisAxis] - 1, Math.floor( (topMarg + drawH - pos.y) / cellW)));

	    res.val = res.x;
	    
	    return res;
	} 

	return res;
    }

    function dimVals2pixels(dict) {
	dimVals2pixels(dict.dim, dict.x, dict.y);
    }

    function dimVals2pixels(axis, xval, yval) {
	var res = {"x":leftMarg, "y":topMarg};

	if(unique <= 0) {
	    res = {"x":leftMarg, "y":topMarg};
	} else {
	    if(axis == xAxisAxis) {
		if(xval < 0) {
		    res.x = leftMarg;
		} else if(xval >= dim[xAxisAxis]) {
		    res.x = leftMarg + dim[xAxisAxis] * cellW;
		} else {
		    res.x = leftMarg + xval * cellW;
		}

		if(yval < 0) {
		    res.y = topMarg + drawH; // flip Y-axis
		} else if(yval >= dim[yAxisAxis]) {
		    res.y = topMarg + drawH - dim[yAxisAxis] * cellW; // flip Y-axis
		} else {
		    res.y = topMarg + drawH - yval * cellW; // flip Y-axis
		}
	    }
	    else {
		debugLog("This should not happen; dimVals2pixels");
	    }
	}

	return res;
    }
    function saveSelectionsInSlot() {
	debugLog("saveSelectionsInSlot");
	
	if(selections && selections.length >= 3) {

	    var result = [];
	    for(var d = 0; d < 3; d++) {
		result.push({"dim":d, "selections":[]});
	    }
	    
	    for(var d = 0; d < 3; d++) {
		for(var sel = 0; sel < selections[d].length; sel++) {
		    result[d].selections.push({'maxVal':selections[d][sel].maxVal, 'minVal':selections[d][sel].minVal});
		}
	    }
	    
	    internalSelectionsInternallySetTo = result;
	    $scope.set('InternalSelections', result);
	}	
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

	if(slotSelections
	   && slotSelections.length >= 3) {

	    var newSelections = [];
	    for(var d = 0; d < 3; d++) {
		newSelections.push([]);
	    }
	    
	    for(var d = 0; d < 3; d++) {
		for(var sel = 0; sel < slotSelections[d].selections.length; sel++) {
		    var newSel = slotSelections[d].selections[sel];
		    newSelections[slotSelections[d].dim].push(newSel);
		}
	    }

	    for(var d = 0; d < 3; d++) {
		if(newSelections[d].length <= 0) {
		    newSelections[d].push({"minVal":0, "maxVal":dim[d] - 1});
		}
	    }

	    if(newSelections.length <= 0) {
		selectAll();
	    } else {
		selections = newSelections;
		updateLocalSelections(false);
		drawSelections();
	    }
	}
	
	saveSelectionsInSlot();
    }

    function checkSelectionsAfterNewData() {
	// debugLog("checkSelectionsAfterNewData");

	var newSelections = [];

	// for(var sel = 0; sel < selections.length; sel++) {
	//     var newSel = selections[sel];
	//     var X1 = newSel[0];
	//     var X2 = newSel[1];

	//     var Y1 = newSel[2];
	//     var Y2 = newSel[3];

	//     if(X2 < limits.minX 
	//        || X1 > limits.maxX
	//        || Y2 < limits.minY 
	//        || Y1 > limits.maxY) {
	// 	// completely outside
	// 	continue;
	//     }
	
	//     X1 = Math.max(limits.minX, X1);
	//     X2 = Math.min(limits.maxX, X2);
	
	//     Y1 = Math.max(limits.minY, Y1);
	//     Y2 = Math.min(limits.maxY, Y2);
	
	//     newSelections.push([X1,X2,Y1,Y2, val2pixelX(X1),val2pixelX(X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
	// }

	// if(newSelections.length > 0) {
	//     selections = newSelections;
	//     drawSelections();
	//     return false;
	// }
	return true;
    };

    function updateLocalSelections(selectAll) {
	
	updateGraphicsHelper(false, true, false);


	// debugLog("updateLocalSelections");

	// var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
	// var nullGroup = 0;
	// if(!nullAsUnselected) {
	//     nullGroup = selections.length + 1; // get unused groupId
	// }

	// var dirty = false;
	
	// // debugLog("selections before sorting: " + JSON.stringify(selections));
	// selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.
	// // debugLog("selections after sorting: " + JSON.stringify(selections));

	// for(var set = 0; set < idArrays.length; set++) {
	//     var xArray = xArrays[set];
	//     var yArray = yArrays[set];
	//     var selArray = localSelections[set];

	//     for(var i = 0; i < Ns[set]; i++) {
	// 	var newVal = 1;
	
	// 	if(xArray[i] === null
	// 	   || yArray[i] === null) {
	// 	    newVal = nullGroup;
	// 	} else {
	// 	    if(selectAll) {
	// 		newVal = 1;
	// 	    } else {
	// 		var groupId = 0;
	
	// 		for(var span = 0; span < selections.length; span++) {
	// 		    if(selections[span][0] <= xArray[i] 
	// 		       && xArray[i] <= selections[span][1]
	// 		       && selections[span][2] <= yArray[i] 
	// 		       && yArray[i] <= selections[span][3]) {
	// 			groupId = span + 1;
	// 			break;
	// 		    }
	// 		}
	// 		newVal = groupId;
	// 	    }
	// 	}

	// 	if(newVal != selArray[i]) {
	// 	    dirty = true;
	// 	    selArray[i] = newVal;
	// 	}
	//     }
	// }

	// if(dirty) {
	//     $scope.set('LocalSelections', {'DataIdSlot':localSelections});
	//     $scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
	// } else {
	//     // debugLog("local selections had not changed");
	// }
    };


    function resetVars() {
	idArrays = [];
	_3DArrays = [];
	
	$scope.dataSetName = "";

	dataName = null;
	dragZone = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};

	sources = 0;
	Ns = [];
	unique = 0;

	localSelections = [];
    }

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
	    var haveX = false;
	    for(var i = 0; i < parentInput.length; i++) {
		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "3D Data") {
		    haveX = true;
		    
		    dragZone.name = "Data";
		    dropZ.forParent.vizName = $scope.gimme("PluginName");
		    dragZone.ID = JSON.stringify(dropZ.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			// $scope.dataSetName = parentInput[i]["description"];
			dataName = shortenName(parentInput[i]["description"]);
			dragZone.name = dataName;
		    }
		}
	    }

	    if(haveX) {
		atLeastOneFilled = true;
	    }
	}
	
	// debugLog("read parent input ", atLeastOneFilled);
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    idArrays = $scope.gimme('DataIdSlot');
	    _3DArrays = $scope.gimme('Data');

	    if(idArrays.length != _3DArrays.length) {
		dataIsCorrupt = true;
	    }
	    if(idArrays.length <= 0) {
		dataIsCorrupt = true;
	    }

	    if(!dataIsCorrupt) {
		sources = idArrays.length;

		for(var source = 0; source < sources; source++) {
		    var idArray = idArrays[source];
		    var _3DArray = _3DArrays[source];
		    
		    if(idArray.length != _3DArray.length) {
			dataIsCorrupt = true;
		    }

		    if(idArray.length <= 0) {
			dataIsCorrupt = true;
		    }

		    for(var n = 0; n < _3DArrays[source].length; n++) {
			unique++;
		    }
		    Ns.push(_3DArrays[source].length);
		}
	    }

	    if(dataIsCorrupt) {
		debugLog("data is corrupt");
		resetVars();
	    } else {

		var firstX = true;
		var firstY = true;
		var firstZ = true;
		
		for(var source = 0; source < sources; source++) {
		    var _3DArray = _3DArrays[source];

		    for(var dataSet = 0; dataSet < _3DArrays[source].length; dataSet++) {
			
			if(firstX) {
			    firstX = false;
			    dim[0] = _3DArray[dataSet].length;
			} else {
			    if(dim[0] != _3DArray[dataSet].length) {
				dataIsCorrupt = true;
				debugLog("arrays have different lengths");
			    }
			}

			for(var x = 0; x < _3DArray[dataSet].length; x++) {

			    if(firstY) {
				firstY = false;
				dim[1] = _3DArray[dataSet][x].length;
			    } else {
				if(dim[1] != _3DArray[dataSet][x].length) {
				    dataIsCorrupt = true;
				    debugLog("arrays have different lengths");
				}
			    }

			    for(var y = 0; y < _3DArray[dataSet][x].length; y++) {

				if(firstZ) {
				    firstZ = false;
				    dim[2] = _3DArray[dataSet][x][y].length;
				} else {
				    if(dim[2] != _3DArray[dataSet][x][y].length) {
					dataIsCorrupt = true;
					debugLog("arrays have different lengths");
				    }
				}
			    }
			}
		    }
		}
		debugLog("using dimensions: (" + dim[0] + "," + dim[1] + "," + dim[2] + ")");

		if(dim[0] <= dim[1] 
		   && dim[0] <= dim[2]) {
		    zAxisAxis = 0;

		    if(dim[1] < dim[2]) {
			yAxisAxis = 1;
			xAxisAxis = 2;
		    } else {
			yAxisAxis = 2;
			xAxisAxis = 1;
		    }
		} else if(dim[2] <= dim[0] 
		   && dim[2] <= dim[1]) {
		    zAxisAxis = 2;

		    if(dim[1] < dim[0]) {
			yAxisAxis = 1;
			xAxisAxis = 0;
		    } else {
			yAxisAxis = 0;
			xAxisAxis = 1;
		    }
		} else {
		    zAxisAxis = 1;

		    if(dim[2] < dim[0]) {
			yAxisAxis = 2;
			xAxisAxis = 0;
		    } else {
			yAxisAxis = 0;
			xAxisAxis = 2;
		    }
		}
		
		$scope.set("DimensionX", xAxisAxis);
		$scope.set("DimensionY", yAxisAxis);
		
		// TODO: check if we should keep the old selections
		// selections = [[limits.min, limits.max]];
	    }
	} else {
	    debugLog("no data");
	}
	
	updateGraphicsHelper(false, true, false);

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
	    
	    if(selectionCanvas === null) {
    		var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    		if(selectionCanvasElement.length > 0) {
    		    selectionCanvas = selectionCanvasElement[0];
    		} else {
    		    debugLog("no selectionCanvas to resize!");
    		    return;
    		}
	    }

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
    
    function updateGraphicsHelper(forceBackground, forceCells, forceAxes) {
    	debugLog("updateGraphics()");

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

	var redrawBackground = forceBackground;
	var redrawCells = forceCells;
	var redrawAxes = forceAxes;
	var redrawSelections = false;
	
	// ==========================================
	// Check what dimensions to use on what axes
	// ==========================================

	if(xAxisAxis < 0) {
	    xAxisAxis = 0;
	}
	if(xAxisAxis > 2) {
	    xAxisAxis = 2;
	}
	if(yAxisAxis < 0) {
	    yAxisAxis = 0;
	}
	if(yAxisAxis > 2) {
	    yAxisAxis = 2;
	}
	if(zAxisAxis < 0) {
	    zAxisAxis = 0;
	}
	if(zAxisAxis > 2) {
	    zAxisAxis = 2;
	}

	if(xAxisAxis == yAxisAxis) {
	    yAxisAxis = (xAxisAxis + 1) % 3;
	}

	var temp = [0, 0, 0];
	temp[xAxisAxis] = 1;
	temp[yAxisAxis] = 1;
	for(var i = 0; i < 3; i++) {
	    if(temp[i] == 0) {
		zAxisAxis = i;
		break;
	    }
	}
	debugLog("use dimension " + xAxisAxis + " on X axis, dimension " + yAxisAxis + " on Y axis, and dimension " + zAxisAxis + " as depth.");

	// ===============================
	// Check if we need to resize
	// ===============================

	if(unique > 0) {

	    if(cellWidth <= 0) {
		if(_3DArrays
		   && _3DArrays.length > 0
		   && _3DArrays[0].length > 0
		   && _3DArrays[0][0].length > Math.max(xAxisAxis, yAxisAxis)) {
		    var set = 0;
		    var dataSet = 0;
		    
		    cellW  = Math.floor(drawW / dim[xAxisAxis]);
 
		    var cellH =  Math.floor(drawH / dim[yAxisAxis]);
		    
		    if(cellW < 1 || cellH < 1) {
			cellW = 1;
		    } else {
			if(cellH < cellW) {
			    cellW = cellH;
			}
		    }
		} else {
		    cellW = 1;
		}
	    } else {
		cellW = cellWidth;
	    }

	    debugLog("setting cellW to " + cellW);

	    var newW = Math.ceil(cellW * dim[xAxisAxis] + leftMarg + rightMarg);

	    var newH = Math.ceil(cellW * dim[yAxisAxis] + topMarg + bottomMarg * 2 + fontSize);

	    if(newW > W || newH > H
	       || newW < W - leftMarg // if the size is way too big, resize
	       || newH < H - topMarg
	      ) {
		var endNow = false;
		debugLog("We need to resize. Current W,H = " + W + "," + H + ", need " + newW + "," + newH);

		if(newW > W) {
		    $scope.set("DrawingArea:width", newW);
		    endNow = true;
		}
		if(newH > H) {
		    $scope.set("DrawingArea:height", newH);
		    endNow = true;
		}

		if(newW < W - leftMarg) {
		    $scope.set("DrawingArea:width", newW);
		    endNow = true;
		}
		if(newH < H - topMarg) {
		    $scope.set("DrawingArea:height", newH);
		    endNow = true;
		}
		if(endNow) {
		    return;
		}
	    }
	}

	// ===============================
	// Check what needs to be redrawn
	// ===============================

	if(lastXAxisAxis != xAxisAxis
	   || lastYAxisAxis != yAxisAxis
	   || lastZAxisAxis != zAxisAxis) {
	    redrawCells = true;
	    redrawSelections = true;
	}

	if(lastMode != mode
	   || lastStyle != style
	   || lastLevels != levels) {
	    redrawCells = true;
	}

	if(drawW != lastDrawW
	   || drawH != lastDrawH) {
	    redrawBackground = true;
	    redrawCells = true;
	    redrawAxes = true;
	    redrawSelections = true;
	}


	if(!redrawBackground && currentColors != lastColors) {
	    redrawBackground = backgroundColorCheck(currentColors, lastColors);
	}
	
	if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
	    redrawAxes = true;
	}

	if(lastCellW != cellW) {
	    redrawCells = true;
	    redrawSelections = true;
	}

	if(checkColors(currentColors, lastColors)) {
	    redrawCells = true;
	    redrawSelections = true;
	}

	if(lastColorMode != colorMode) {
	    redrawCells = true;
	}

	// ===========
	// Draw
	// ===========

	// debugLog("Need to redraw: " + redrawBackground + " " + redrawCells + " " + " " + redrawAxes);


    	if(redrawBackground) {
    	    drawBackground(W, H);
	}
	if(redrawAxes) {
    	    drawAxes(W, H);
	}
	if(redrawCells) {
    	    drawPlot(W, H);
	}

	if(redrawSelections || redrawCells) {
	    drawSelections(); // this is cheap, do this just in case
	} 

	lastDrawW = drawW;
	lastDrawH = drawH;
	lastFontSize = fontSize;
	lastTextColor = textColor;
	lastColors = currentColors;
	lastCellW = cellW;
	lastXAxisAxis = xAxisAxis;
	lastYAxisAxis = yAxisAxis;
	lastZAxisAxis = zAxisAxis;
	lastColorMode = colorMode;

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

	    var marg1 = 8;
	    if(drawW < 40) {
		marg1 = 0;
	    }
	    var marg2 = 8;
	    if(drawH < 40) {
		marg2 = 0;
	    }

	    dropZ.left = leftMarg;
	    dropZ.top = topMarg;
	    dropZ.right = leftMarg + drawW;
	    dropZ.bottom = topMarg + drawH;

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


	// // X axis

	// axesCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

	// if(unique > 0) {
	//     // var LABELS = 5;
	//     // for(var i = 0; i < LABELS+1; i++) {
	//     // 	var pos = leftMarg + i/LABELS*drawW;

	//     // 	var s = "";
	//     // 	s = number2text(pixel2valX(pos), limits.spanX);
	
	//     // 	var textW = getTextWidthCurrentFont(s);
    	//     // 	axesCtx.fillText(s, pos - textW/2, H - bottomMarg);
	//     // 	axesCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
	//     // }
	// }

    	// // Y Axis

	// axesCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

	// if(unique > 0) {
	//     // var LABELS = 5;
	//     // for(var i = 0; i < LABELS+1; i++) {
	//     // 	var pos = topMarg + i/LABELS*drawH;

	//     // 	var s = "";
	//     // 	s = number2text(pixel2valY(pos), limits.spanY);
	
	//     // 	var textW = getTextWidthCurrentFont(s);
	//     // 	if(leftMarg > textW + 5) {
    	//     // 	    axesCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
	//     // 	} else {
    	//     // 	    axesCtx.fillText(s, 0, pos + fontSize/2);
	//     // 	}
	//     // 	axesCtx.fillRect(leftMarg - 5, pos, 6, 1);
	//     // }
	// }

	// top label

	var str = "";
	var xw = -1;
	var ww = -1;

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

	    axesCtx.fillText(str, left, top + fontSize);

	    if(xw >= 0) {
		dragZone = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dragZone.name, 'ID':dragZone.ID};
	    }
	    allDragNames = [dragZone];
	}
    }


    function drawPlot(W, H) {
	debugLog("drawPlot");

	mode = $scope.gimme("Mode");
	if(mode == "median") {
	} else if(mode == "mean") {
	} else if(mode == "min") {
	} else {
	    mode = "max";
	}

	style = $scope.gimme("Style");
	if(style == "levels") {
	} else if(style == "curves") {
	} else {
	    style = "raw";
	}

	levels = $scope.gimme("Levels");
	if(!levels || isNaN(levels)) {
	    levels = 2;
	}
	// levels = Math.max(2, Math.min(dim[zAxisAxis], levels));

	lastLevels = levels;
	lastStyle = style;
	lastMode = mode;

	if(plotCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#thePlotCanvas');
    	    if(myCanvasElement.length > 0) {
    		plotCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}

	if(plotCtx === null) {
    	    plotCtx = plotCanvas.getContext("2d");
	}
	
	if(!plotCtx) {
	    debugLog("no canvas to draw on");
	    return;
	}

	plotCtx.clearRect(0,0, W,H);

	if(unique <= 0) {
	    return;
	}

    	noofGroups = 0;

    	var globalSelections = [];
	var globalSelectionsPerId = $scope.gimme('GlobalSelections');
	if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
	    globalSelections = globalSelectionsPerId['DataIdSlot'];
	}

	var dataSetsToDraw = 0;
	for(var set = 0; set < Ns.length; set++) {
	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }
	    for(var i = 0; i < Ns[set]; i++) {
		var groupId = 0;
		if(i < selArray.length) {
		    groupId = selArray[i];
		}
		if(groupId > 0) {
		    dataSetsToDraw++;
		}
	    }
	}
	if(dataSetsToDraw <= 0) {
	    dataSetsToDraw = 1;
	}

	lastSeenGlobalSelections = [];
	for(var set = 0; set < globalSelections.length; set++) {
	    lastSeenGlobalSelections.push([]);
	    for(var i = 0; i < globalSelections[set].length; i++) {
		lastSeenGlobalSelections[set].push(globalSelections[set][i]);
	    }
	}

	var WW = plotCanvas.width;
	var HH = plotCanvas.height;
	var rgbaText = hexColorToRGBAvec(textColor, 1);
	var imData = plotCtx.getImageData(0, 0, plotCanvas.width, plotCanvas.height);
	var pixels = imData.data;

	drawFront(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw);

	plotCtx.putImageData(imData, 0, 0);
    }

    function drawFront(WW, HH, rgbaText, imData, pixels, globalSelections, dataSetsToDraw) {
	debugLog("drawFront");

	var grid = [];
	var allVals = [];

	var skipOutliers = true;
	if(!$scope.gimme("IgnoreExtremeOutliers")) {
	    skipOutliers = false;
	}

	debugLog("get values");
	var timerD = new Date();
	var timerV = timerD.getTime();

	for(var b = 0; b < dim[yAxisAxis]; b++) {

	    grid.push([]);
	    
	    for(var a = 0; a < dim[xAxisAxis]; a++) {
		
		var sum = 0;
		var n = 0;
		var mx = 0;
		var mn = 0;
		var vals = [];
		var median = 0;

		var sawNull = false;
		var sawOnlyNull = true;

		var coords = [0, 0, 0];
		coords[xAxisAxis] = a;
		coords[yAxisAxis] = b;

		for(var c = 0; c < dim[zAxisAxis]; c++) {
		    coords[zAxisAxis] = c;

    		    for(var set = 0; set < Ns.length; set++) {

			var selArray = [];
			if(set < globalSelections.length) {
	     		    selArray = globalSelections[set];
			}

    			for(var dataSet = 0; dataSet < Ns[set]; dataSet++) {

			    var groupId = 1;
			    
			    if(dataSet < selArray.length) {
				groupId = selArray[dataSet];
			    }
			    
			    if(groupId <= 0) {
				continue; // skip the unselected ones
			    }

			    var v = _3DArrays[set][dataSet][coords[0]][coords[1]][coords[2]];

			    if(v !== null) {
				sawOnlyNull = false;

				if(n == 0) {
				    mx = v;
				    mn = v;
				} else {
				    mx = Math.max(mx, v);
				    mn = Math.min(mn, v);
				}

				sum += v;
				n += 1;
				
				if(mode == "median") {
				    vals.push(v); // this can be incredibly slow
				}
			    } else {
				sawNull = true;
			    }
			}
		    }
		}

		if(vals.length > 0) {
		    vals.sort();
		    median = vals[Math.floor(vals.length / 2)];
		}

		var val = 0;
		
		if(sawOnlyNull && sawNull) {
		    val = null;
		} else {

		    if(mode == "min") {
			val = mn;
		    } else if(mode == "max") {
			val = mx;
		    } else if(mode == "mean") {
			if(n > 0) {
			    val = sum / n;
			}
		    } else if(mode == "median") {
			val = median;
		    }

		    allVals.push(val); // skip when null
		}
		
		grid[b].push(val); // add even when null

	    }
	}

	timerD = new Date();
	var timerV2 = timerD.getTime();
	debugLog("time:" + (timerV2 - timerV));
	timerV = timerV2;

	debugLog("remove outliers");
	
	if(skipOutliers) {
	    var sum = 0;
	    var sum2 = 0;
	    var n = 0;
	    for(var i = 0; i < allVals.length; i++) {
		n++;
		sum += allVals[i];
		sum2 += allVals[i] * allVals[i];
	    }

	    if(n > 0) {
		var mean = sum / n;
		var variance = sum2 / n - mean*mean;
		var stddev = Math.sqrt(variance);
		var cutOff = stddev * 10;

		var foundOutlier = false;
		
		for(var b = 0; b < dim[yAxisAxis]; b++) {
		    for(var a = 0; a < dim[xAxisAxis]; a++) {
			var v = grid[b][a];
			
			if(Math.abs(v - mean) > cutOff) {
			    grid[b][a] = null;
			    foundOutlier = true;
			}
		    }
		}
		
		if(foundOutlier) {
		    var ls = [];
		    for(var i = 0; i < allVals.length; i++) {
			if(Math.abs(allVals[i] - mean) <= cutOff) {
			    ls.push(allVals[i]);
			}
		    }
		    allVals = ls;
		}
	    }
	}

	// var gridMax = grid[0][0];
	// var gridMin = grid[0][0];
	// for(var b = 0; b < dim[yAxisAxis]; b++) {
	//     for(var a = 0; a < dim[xAxisAxis]; a++) {
	// 	var v = grid[b][a];
		
	// 	gridMax = Math.max(v, gridMax);
	// 	gridMin = Math.min(v, gridMin);
	//     }
	// }

	// debugLog("min max " + gridMin + " " + gridMax);

	timerD = new Date();
	timerV2 = timerD.getTime();
	debugLog("time:" + (timerV2 - timerV));
	timerV = timerV2;

	debugLog("sort");

	if(allVals.length > 0) {
	    allVals.sort(function(a,b){return a - b;});
	    gridMax = allVals[allVals.length - 1];
	    gridMin = allVals[0];
	} else {
	    gridMax = 0;
	    gridMin = 0;
	}

	timerD = new Date();
	timerV2 = timerD.getTime();
	debugLog("time:" + (timerV2 - timerV));
	timerV = timerV2;

	if(style == "levels"
	   || style == "curves"
	  ) {

	    debugLog("level stuff");

	    var levs = [];
	    var lev = gridMin;
	    var step = (gridMax - gridMin) / levels;

	    var levColors = [];
	    
	    for(var l = 0; l < levels; l++) {
		levs.push(gridMin + step*l);
	    }

	    for(var l = 0; l < levels; l++) {
		var col = valueToIntensityOrColor(levs[l], gridMin, gridMax, rgbaText, levs, dataSetsToDraw);
		levColors.push(col);
	    }

	    for(var b = 0; b < dim[yAxisAxis]; b++) {
		for(var a = 0; a < dim[xAxisAxis]; a++) {
		    var v = grid[b][a];

		    if(v !== null) {
			for(var l = 0; l < levels; l++) {
			    if(v >= levs[l]) {
				grid[b][a] = l;
			    } else {
				break;
			    }
			}
		    }
		}
	    }

	    if(style == "curves") {
	    	var newGrid = [];
		
	    	for(var b = 0; b < dim[yAxisAxis]; b++) {
	    	    newGrid.push([]);
		    
	    	    for(var a = 0; a < dim[xAxisAxis]; a++) {
	    		var v = grid[b][a];
			
	    		var diff = false;
			
	    		for(var aa = -1; aa < 2; aa++) {
	    		    var aaa = a + aa;
	    		    if(aaa >= 0 && aaa < dim[xAxisAxis]) {
	    			for(var bb = -1; bb < 2; bb++) {
	    			    if(aa != 0 || bb != 0) {
	    				var bbb = b + bb;
	    				if(bbb >= 0 && bbb < dim[yAxisAxis]) {
	    				    if(grid[b][a] != grid[bbb][aaa]) {
	    					diff = true;
	    				    }
	    				}
	    			    }
	    			}
	    		    }
	    		}
	    		if(diff) {
	    		    newGrid[b].push(v);
	    		} else {
	    		    newGrid[b].push(null);
	    		}
	    	    }
	    	}

	    	grid = newGrid;
	    }
	}	
		    
	// colorMode = "minmax";
	colorMode = "histogram";

	timerD = new Date();
	timerV2 = timerD.getTime();
	debugLog("time:" + (timerV2 - timerV));
	timerV = timerV2;

	debugLog("actually draw");

	for(var b = 0; b < dim[yAxisAxis]; b++) {
	    for(var a = 0; a < dim[xAxisAxis]; a++) {
		var pos = dimVals2pixels(xAxisAxis, a, b);
				
		if(grid[b][a] !== null) {
		    if(style == "curves") {
			var col = levColors[grid[b][a]];
			fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
		    } else {
			if(style == "levels") {
			    var col = levColors[grid[b][a]];
			} else {
			    var col = valueToIntensityOrColor(grid[b][a], gridMin, gridMax, rgbaText, allVals, dataSetsToDraw);
			}
			fillRectFast(pos.x, pos.y, cellW, cellW, col[0], col[1], col[2], col[3], pixels, WW, HH);
		    }
		}
	    }
	}	

	timerD = new Date();
	timerV2 = timerD.getTime();
	debugLog("time:" + (timerV2 - timerV));
	timerV = timerV2;

	debugLog("finished drawing");
    }


    function valueToIntensityOrColor(val, minVal, maxVal, rgbaText, sums, dataSetsToDraw) {
	var col = [0, 0, 0, 255];

	var colKey = $scope.gimme("ColorKey");
	if(colKey && colKey.length > 0) {
	    // var l = colKey.length;
	    // var c = Math.max(0, Math.min(l - 1, Math.floor(l * (val - minVal) / (maxVal - minVal))));
	    // col = hexColorToRGBAvec(colKey[c], 1);
	    // return col;

	    var sortedPos = binLookup(sums, val, 0, sums.length);
	    var perc = sortedPos / (sums.length - 1);
	    var l = colKey.length;
	    var c = Math.max(0, Math.min(l - 1, Math.floor(l * perc)));
	    if(l > 1) {
		col = hexColorToRGBAvec(colKey[c], 1);	    
	    } else {
		col = hexColorToRGBAvec(colKey[c], perc);
	    }
	    return col;
	} 

	if(colorMode == "minmax") {
	    var alpha = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * (val - minVal) / (maxVal - minVal))));
	    col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
	} else if(colorMode == "hotcold") {
	    if(val < 0) {
		var intensity = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / Math.abs(minVal))));
		col = [0, 0, intensity, 255];
	    } else {
		var intensity = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / Math.abs(maxVal))));
		col = [intensity, 0, 0, 255];
	    }
	} else if(colorMode == "abs") {
	    var mx = Math.max(Math.abs(minVal), Math.abs(maxVal));
	    var alpha = Math.max(0, Math.min(255, Math.floor(256 / dataSetsToDraw * Math.abs(val) / mx)));
	    col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
	} else if(colorMode == "histogram" && sums.length > 0) {
	    var sortedPos = binLookup(sums, val, 0, sums.length);
	    var perc = sortedPos / (sums.length - 1);
	    var alpha = Math.floor(255 / dataSetsToDraw * perc);
	    col = [rgbaText[0], rgbaText[1], rgbaText[2], alpha];
	}

	return col;
    }

    function fillRectFast(X1, Y1, DX, DY, r, g, b, alpha, pixels, Width, Height)
    {
	var W = Math.floor(Width);
	var H = Math.floor(Height);

	var x1 = Math.round(X1);
	var y1 = Math.round(Y1);
	var dx = Math.round(DX);
	var dy = Math.round(DY);

	for(var j = 0; j < dy; j++) 
	{
            for (var i = 0; i < dx; i++)
	    {
		var rx = x1 + i;
		var ry = y1 + j;
		if(ry >= 0 && ry < H
		   && rx >= 0 && rx < W) {
		    var offset = (ry * W + rx) * 4;
		    
		    if(alpha < 255) {
			blendRGBAs(r,g,b,alpha, offset, pixels);
		    } else {
			pixels[offset] = r;
			pixels[offset+1] = g;
			pixels[offset+2] = b;
			pixels[offset+3] = alpha;
		    }
		}
	    }
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

	var plotDirty = false;
    	if(plotCanvas === null) {
	    plotDirty = true;
    	    var myCanvasElement = $scope.theView.parent().find('#thePlotCanvas');
    	    if(myCanvasElement.length > 0) {
    		plotCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
	}
	if(plotCanvas.width != rw) {
	    plotDirty = true;
	    plotCanvas.width = rw;
	}
	if(plotCanvas.height != rh) {
	    plotDirty = true;
	    plotCanvas.height = rh;
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
	
	var W = selectionCanvas.width;
	var H = selectionCanvas.height;
	drawW = W - leftMarg - rightMarg;
	drawH = H - topMarg - bottomMarg * 2 - fontSize;

	// debugLog("updateSize found selections: " + JSON.stringify(selections));
	updateSelectionsWhenZoomingOrResizing();

	// debugLog("updateSize updated selections to: " + JSON.stringify(selections));
    };

    function updateSelectionsWhenZoomingOrResizing() {
	// if(unique > 0) {
	//     for(var sel = 0; sel < selections.length; sel++) {
	// 	var s = selections[sel];
	// 	s[4] = val2pixelX(s[0]);
	// 	s[5] = val2pixelX(s[1]);
	// 	s[7] = val2pixelY(s[2]);
	// 	s[6] = val2pixelY(s[3]);
	//     }
	// }
	// drawSelections();
    }

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {
	case "DimensionX":
	    var xAxisAxisNew = eventData.slotValue;
	    if(xAxisAxisNew < 0) {
		xAxisAxisNew = 0;
	    }
	    if(xAxisAxisNew > 2) {
		xAxisAxisNew = 2;
	    }
	    if(xAxisAxisNew != xAxisAxis) {
		xAxisAxis = xAxisAxisNew;
    		updateGraphicsHelper(false, true, true);
		drawSelections();
	    }
	    break;
	case "DimensionY":
	    var yAxisAxisNew = eventData.slotValue;
	    if(yAxisAxisNew < 0) {
		yAxisAxisNew = 0;
	    }
	    if(yAxisAxisNew > 2) {
		yAxisAxisNew = 2;
	    }
	    if(yAxisAxisNew != yAxisAxis) {
		yAxisAxis = yAxisAxisNew;
    		updateGraphicsHelper(false, true, true);
		drawSelections();
	    }
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
	    
    	case "CellWidth":
	    var cellWidthNew = $scope.gimme('CellWidth');
	    if(typeof cellWidthNew !== 'number') {
		try {
		    cellWidthNew = parseInt(cellWidthNew);
		} catch(e) {
		    cellWidthNew = cellWidth;
		}
	    }
	    if(cellWidthNew < 0) {
		cellWidthNew = 0;
	    }
	    if(cellWidthNew != cellWidth) {
		cellWidth = cellWidthNew;
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
    	case "ExpectedFormat":
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

	case "ColorKey":
	    updateGraphicsHelper(false, true, false);
	    break;

	case "IgnoreExtremeOutliers":
	    updateGraphicsHelper(false, true, false);
	    break;

	case "Style":
	    var newVal = $scope.gimme("Style");
	    if(newVal == "raw"
	       || newVal == "curves"
	       || newVal == "levels") {
		if(newVal != lastStyle) {
		    style = newVal;
    		    updateGraphics();
		}
	    } else {
		$scope.set("Style", lastStyle);
	    }
    	    break;

	case "Levels":
	    var newVal = $scope.gimme("Levels");
	    var temp = newVal;
	    if(!newVal || newVal < 2) {
		newVal = 2;
	    }
	    // newVal = Math.max(2, Math.min(dim[zAxisAxis], newVal));
	    if(temp != newVal) {
		$scope.set("Levels", newVal);
	    } else if(newVal != lastLevels) {
		levels = newVal;
		updateGraphics();
	    }
	    break;

	case "Mode":
	    var newVal = $scope.gimme("Mode");
	    if(newVal == "min"
	       || newVal == "max"
	       || newVal == "mean"
	       || newVal == "median") {
		if(newVal != lastMode) {
		    mode = newVal;
    		    updateGraphics();
		}
	    } else {
		$scope.set("Mode", lastMode);
	    }
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

    	    for(var i = 0; i < Ns[set]; i++) {
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

    function newSelection(newDim, v1, v2, keepOld) {
	debugLog("newSelection");

	var minVal = Math.floor(Math.min(v1, v2));
	var maxVal = Math.ceil(Math.max(v1, v2));
	
	var sel = {"minVal":minVal, "maxVal":maxVal};

	var dup = false;

	if(selections.length <= newDim) {
	    for(var d = selections.length; d < 3; d++) {
		selections.push([]);
		dirty = true;
	    }
	}

	if(!keepOld) {	    
	    selections[newDim] = [];
	    dirty = true;
	} 

	for(var s = 0; s < selections[newDim].length; s++) {
	    if(selections[newDim][s].minVal == sel.minVal
	       && selections[newDim][s].maxVal == sel.maxVal) {
		dup = true;
		break;
	    }
	}

	if(!dup) {
	    selections[newDim].push(sel);
	    dirty = true;
	}

	for(var d = 0; d < 3; d++) {
	    if(selections[d].length <= 0) {
		selections[d].push({"minVal":0, "maxVal":dim[d] - 1});
		dirty = true;
	    }
	}

	if(dirty) {
	    drawSelections();
	    updateLocalSelections(false);
	    saveSelectionsInSlot();
	}
    }

    function selectAll() {
	var newSelections = [];
	for(var d = 0; d < 3; d++) {
	    newSelections.push([]);
	    newSelections[d].push({"minVal":0, "maxVal":dim[d] - 1});
	}
	selections = newSelections;
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
    }

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

	    var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));

	    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
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
	if(unique > 0) {
	    debugLog("drawSelections");

	    // if(selectionCanvas === null) {
    	    // 	var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    	    // 	if(selectionCanvasElement.length > 0) {
    	    // 	    selectionCanvas = selectionCanvasElement[0];
    	    // 	} else {
    	    // 	    debugLog("no canvas to draw selections on!");
    	    // 	    return;
    	    // 	}
	    // }

	    // if(selectionCtx === null) {
    	    // 	selectionCtx = selectionCanvas.getContext("2d");
	    // }
	    
	    // var W = selectionCanvas.width;
	    // var H = selectionCanvas.height;

	    // selectionCtx.clearRect(0,0, W,H);

	    // if(selectionColors === null) {
	    // 	parseSelectionColors(W, H);
	    // }

	    // // selectionCtx.strokeStyle = selectionColors.color;
	    // if(currentColors 
	    //    && currentColors.selection
	    //    && currentColors.selection.border) {
		
	    // 	selectionCtx.strokeStyle = currentColors.selection.border;
	    // } else if(currentColors 
	    // 	      && currentColors.skin
	    // 	      && currentColors.skin.border) {
	    // 	selectionCtx.strokeStyle = currentColors.skin.border;
	    // } else {
	    // 	selectionCtx.strokeStyle = "#ff0000";
	    // }
    	    // selectionCtx.lineWidth = 1;

	    // for(var d = 0; d < 3; d++) {
	    // 	for(sel = 0; sel < selections[d].length; sel++) {
	    // 	    var selection = selections[d][sel];
	    // 	    if(d == xAxisAxis) {
	    // 		var pos1 = dimVals2pixels(xAxisAxis, selection.minVal, 0);
	    // 		var pos2 = dimVals2pixels(xAxisAxis, selection.minVal, dim[yAxisAxis] - 1);
	    // 		var pos3 = dimVals2pixels(xAxisAxis, selection.maxVal, dim[yAxisAxis] - 1);
	    // 		var pos4 = dimVals2pixels(xAxisAxis, selection.maxVal, 0);
			
	    // 		pos2.x += cellW - 1;
	    // 		pos3.x += cellW - 1;
	    // 		pos1.y += cellW - 1;
	    // 		pos4.y += cellW - 1;
			
	    // 		selectionCtx.save();
	    // 		selectionCtx.beginPath();
	    // 		selectionCtx.moveTo(pos1.x, pos1.y);
	    // 		selectionCtx.lineTo(pos2.x, pos2.y);
	    // 		selectionCtx.lineTo(pos3.x, pos3.y);
	    // 		selectionCtx.lineTo(pos4.x, pos4.y);
	    // 		selectionCtx.lineTo(pos1.x, pos1.y);
	    // 		selectionCtx.stroke();
	    // 		selectionCtx.restore();
	    // 	    } else if(d == yAxisAxis) {
	    // 		var pos1 = dimVals2pixels(yAxisAxis, 0, selection.minVal);
	    // 		var pos2 = dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.minVal);
	    // 		var pos3 = dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, selection.maxVal);
	    // 		var pos4 = dimVals2pixels(yAxisAxis, 0, selection.maxVal);

	    // 		pos2.x += cellW - 1;
	    // 		pos3.x += cellW - 1;
	    // 		pos1.y += cellW - 1;
	    // 		pos2.y += cellW - 1;

	    // 		selectionCtx.save();
	    // 		selectionCtx.beginPath();
	    // 		selectionCtx.moveTo(pos1.x, pos1.y);
	    // 		selectionCtx.lineTo(pos2.x, pos2.y);
	    // 		selectionCtx.lineTo(pos3.x, pos3.y);
	    // 		selectionCtx.lineTo(pos4.x, pos4.y);
	    // 		selectionCtx.lineTo(pos1.x, pos1.y);
	    // 		selectionCtx.stroke();
	    // 		selectionCtx.restore();
	    // 	    } else if(d == zAxisAxis) {
	    // 		var pos1 = dimVals2pixels(zAxisAxis, 0, selection.minVal);
	    // 		var pos2 = dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.minVal);
	    // 		var pos3 = dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, selection.maxVal);
	    // 		var pos4 = dimVals2pixels(zAxisAxis, 0, selection.maxVal);

	    // 		pos2.x += cellW - 1;
	    // 		pos3.x += cellW - 1;
	    // 		pos1.y += cellW - 1;
	    // 		pos2.y += cellW - 1;

	    // 		selectionCtx.save();
	    // 		selectionCtx.beginPath();
	    // 		selectionCtx.moveTo(pos1.x, pos1.y);
	    // 		selectionCtx.lineTo(pos2.x, pos2.y);
	    // 		selectionCtx.lineTo(pos3.x, pos3.y);
	    // 		selectionCtx.lineTo(pos4.x, pos4.y);
	    // 		selectionCtx.lineTo(pos1.x, pos1.y);
	    // 		selectionCtx.stroke();
	    // 		selectionCtx.restore();
	    // 	    }
	    // 	}
	    // }
	}
	
	hideSelectionRect();
    }

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
    }

    function mousePosIsInSelectableArea(pos) {

	return false;

	if(pos.x > leftMarg - 2 
	   && pos.x <= leftMarg + drawW + 2
	   && pos.y > topMarg - 2 
	   && pos.y <= topMarg + drawH + 2) {
	    return true;
	}
	return false;
    }

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

	    var dimAndVal = pixels2dimVals(currentMouse);
	    // var dimAndVal = mousePosToDimXYZ(currentMouse);

	    if(hoverText !== null) {
		if(mousePosIsInSelectableArea(currentMouse)) {
		    
		    if(dimAndVal.dim !== null) {
			s = "[dim " + dimAndVal.dim + " = " + dimAndVal.val + "]";
			var textW = getTextWidthCurrentFont(s);
			hoverText.style.font = fontSize + "px Arial";
			hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
			hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
			hoverText.innerHTML = s;
			hoverText.style.display = "block";
		    } else {
			hoverText.style.display = "none";
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
		    if(clickStart.dim == dimAndVal.dim) {
			var selectionRectCtx = selectionRect.getContext("2d");
			selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);
			
			if(selectionColors === null) {
			    parseSelectionColors();
			}

    			selectionRectCtx.strokeStyle = selectionColors.border;
			
			if(clickStart.dim == xAxisAxis) {
			    var pos1 = dimVals2pixels(xAxisAxis, clickStart.val, 0);
			    var pos2 = dimVals2pixels(xAxisAxis, clickStart.val, dim[yAxisAxis] - 1);
			    var pos3 = dimVals2pixels(xAxisAxis, dimAndVal.val, dim[yAxisAxis] - 1);
			    var pos4 = dimVals2pixels(xAxisAxis, dimAndVal.val, 0);
			    
			    selectionRectCtx.save();
			    selectionRectCtx.beginPath();
			    selectionRectCtx.moveTo(pos1.x, pos1.y);
			    selectionRectCtx.lineTo(pos2.x, pos2.y);
			    selectionRectCtx.lineTo(pos3.x, pos3.y);
			    selectionRectCtx.lineTo(pos4.x, pos4.y);
			    selectionRectCtx.lineTo(pos1.x, pos1.y);
			    selectionRectCtx.stroke();
			    selectionRectCtx.restore();
			} else if(clickStart.dim == yAxisAxis) {
			    var pos1 = dimVals2pixels(yAxisAxis, 0, clickStart.val);
			    var pos2 = dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, clickStart.val);
			    var pos3 = dimVals2pixels(yAxisAxis, dim[zAxisAxis] - 1, dimAndVal.val);
			    var pos4 = dimVals2pixels(yAxisAxis, 0, dimAndVal.val);

			    selectionRectCtx.save();
			    selectionRectCtx.beginPath();
			    selectionRectCtx.moveTo(pos1.x, pos1.y);
			    selectionRectCtx.lineTo(pos2.x, pos2.y);
			    selectionRectCtx.lineTo(pos3.x, pos3.y);
			    selectionRectCtx.lineTo(pos4.x, pos4.y);
			    selectionRectCtx.lineTo(pos1.x, pos1.y);
			    selectionRectCtx.stroke();
			    selectionRectCtx.restore();
			} else if(clickStart.dim == zAxisAxis) {
			    var pos1 = dimVals2pixels(zAxisAxis, 0, clickStart.val);
			    var pos2 = dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, clickStart.val);
			    var pos3 = dimVals2pixels(zAxisAxis, dim[xAxisAxis] - 1, dimAndVal.val);
			    var pos4 = dimVals2pixels(zAxisAxis, 0, dimAndVal.val);

			    selectionRectCtx.save();
			    selectionRectCtx.beginPath();
			    selectionRectCtx.moveTo(pos1.x, pos1.y);
			    selectionRectCtx.lineTo(pos2.x, pos2.y);
			    selectionRectCtx.lineTo(pos3.x, pos3.y);
			    selectionRectCtx.lineTo(pos4.x, pos4.y);
			    selectionRectCtx.lineTo(pos1.x, pos1.y);
			    selectionRectCtx.stroke();
			    selectionRectCtx.restore();
			}
		    } else { // dimensions are not the same
			hideSelectionRect();
		    }
		}
	    }
	}
    };


    var onMouseDown = function(e){
	if(unique > 0) {
	    if(e.which === 1){
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

		if(mousePosIsInSelectableArea(currentMouse)) {
		    // var dimAndVal = mousePosToDimXYZ(currentMouse);
		    var dimAndVal = pixels2dimVals(currentMouse);
		    
		    clickStart = dimAndVal;
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
    }

    var onMouseUp = function(e){
	if(unique > 0) {
	    selectionHolderElement.unbind('mouseup');
	    
	    if(clickStart !== null) {
		hideSelectionRect();
		
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

		// var dimAndVal = mousePosToDimXYZ(currentMouse);
		var dimAndVal = pixels2dimVals(currentMouse);

		if(clickStart.dim == dimAndVal.dim) {
		    newSelection(clickStart.dim, clickStart.val, dimAndVal.val, clickStart.ctrl);
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

		// var dimAndVal = mousePosToDimXYZ(currentMouse);
		var dimAndVal = pixels2dimVals(currentMouse);
		
		if(clickStart.dim == dimAndVal.dim) {
		    newSelection(clickStart.dim, clickStart.val, dimAndVal.val, clickStart.ctrl);
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

        $scope.addSlot(new Slot('Style',
				"raw",
				"Style",
				'Style determines how things are drawn. "raw" means drawing the raw values, "levels" means truncating values to a set of levels, and "curves" means drawing curves separating the levels.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('Levels',
				10,
				"Levels",
				'The number of levels to use when drawing (when applicable).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('Mode',
				"max",
				"Mode",
				'Mode selects how 3D data is represented in 2D. "max" ("min") means using the maximum (minimum) value, "mean" the mean value, and "median" the median value.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


	// Nexrad color key [ "#73feff", "#38d5ff", "#0880ff", "#73fa79", "#39d142", "#3da642", "#248f01", "#0b4100", "#fffb01", "#fca942", "#f94c01", "#ac1942", "#ab28aa", "#d82da9", "#f985ff"]
	// Koshimura color key [[0.058, 0.5, "#2892c7"], [0.501, 1.0, "#60a3b5"],  [1.001, 1.5, "#8cb8a4"],   [1.501, 2.0, "#b1cc91"],   [2.001, 3.0, "#d7e37d"],   [3.001, 4.0, "#fafa64"],   [4.001, 6.0, "#ffd64f"],   [6.001, 8.0, "#fca43f"],   [8.001, 10.0, "#f77a2d"],   [10.001, 12.0, "#f24d1f"],   [12.001, 15.0, "#e81014"],   [0.0, 0.0095, "#FFFFFF00"]] // last color is "no color"

        $scope.addSlot(new Slot('ColorKey',
				["#73feff", "#38d5ff", "#0880ff", "#73fa79", "#39d142", "#3da642", "#248f01", "#0b4100", "#fffb01", "#fca942", "#f94c01", "#ac1942", "#ab28aa", "#d82da9", "#f985ff"], // nexrad color codes
				"Color Key",
				'Mapping of values to colors for plotting.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	
        $scope.addSlot(new Slot('IgnoreExtremeOutliers',
				true,
				"Ignore Extreme Outliers",
				'Treat very extreme data points like null values (do not draw).',
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

        $scope.addSlot(new Slot('CellWidth',
				cellWidth,
				"Cell Width",
				'The size (in pixels) of the cells in the plot (set to 0 for automatic scaling).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


        $scope.addSlot(new Slot('DimensionX',
	 			xAxisAxis,
	 			"Dimension for X",
	 			'Which dimension of the 3D data to put on the X-axis of the visualization.',
	 			$scope.theWblMetadata['templateid'],
	 			undefined,
	 			undefined
	 		       ));
        $scope.addSlot(new Slot('DimensionY',
	 			yAxisAxis,
	 			"Dimension for Y",
	 			'Which dimension of the 3D data to put on the Y-axis of the visualization.',
	 			$scope.theWblMetadata['templateid'],
	 			undefined,
	 			undefined
	 		       ));
	

        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',
				"Grid Data",
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
				[[{'idSlot':'DataIdSlot', 'name':'3D Data', 'type':'3Darray', 'slot':'Data'}]],
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

        $scope.addSlot(new Slot('Data',
				[[[[1,1],[3,4]],[[3,1],[3,1]], [[2,1],[3,2]],[[3,2],[2,1]]]],
				"Data",
				'The slot where the input data should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Data').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

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
