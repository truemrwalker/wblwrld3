//======================================================================================================================
// Controllers for DigitalDashboardPluginLinearRegression for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('linearRegressionPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "LinearRegression";
    $scope.dataSetName = "";

    var myInstanceId = -1;
    var myPath = "";

    // graphics

    var bgCanvas = null;
    var bgCtx = null;
    var axesCanvas = null;
    var axesCtx = null;
    var dotCanvas = null;
    var dotCtx = null;

    var quickRenderThreshold = 500;
    
    var currentColors = null;
    var textColor = "#000000";
    
    var hoverText = null;
    var mouseIsOverMe = false;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    var backgroundThread = null;

    // layout
    var leftMarg = 35;
    var topTopMarg = 20;
    var topMarg = 45; // calculated as topTopMarg + fontSize + headerMarg
    var headerMarg = 10;
    var rightMarg = 20;
    var bottomMarg = 20;
    var nullMarg = 30;

    var fontSize = 11;
    var dotSize = 5;
    var transparency = 0.6; // for the data lines

    var colorPalette = null;
    var useGlobalGradients = false;

    var clickStart = null;

    // data from parent

    var idArrays = [];
    var coordArrays = [];
    var coordTypes = [];
    var coordLimits = [];

    var zoomMinX = 0;
    var zoomMaxX = 0;
    var zoomMinY = 0;
    var zoomMaxY = 0;
    var maxMaxX = 0;
    var minMinY = 0;
    var maxMaxY = 0;

    var linearRegressionRes = [];

    var Ns = [];
    var N = 0;

    var unique = 0; // number of data points with non-null values
    var NULLs = 0;

    var localSelections = []; // the data to send to the parent

    var drawH = 1;
    var drawW = 1;

    var internalSelectionsInternallySetTo = {};

    var lastSeenGlobalSelections = [];

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

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard LinearRegression: " + message);
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
    // function pixel2valX(maxX, p) {
    // 	if(unique <= 0) {
    // 	    return 0;
    // 	}
	
    // 	if(p < leftMarg) {
    // 	    return 0;
    // 	}
    // 	if(p > leftMarg + drawW) {
    // 	    return maxX;
    // 	}
    // 	return parseInt((p - leftMarg) / drawW * maxX);
    // };

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
    // function pixel2valY(p) {
    // 	if(unique <= 0) {
    // 	    return 0;
    // 	}
	
    // 	if(p < topMarg) {
    // 	    return coordLimits[0].max; // flip Y-axis
    // 	}
    // 	if(p > topMarg + drawH) {
    // 	    return coordLimits[0].min; // flip Y-axis
    // 	}
    // 	return coordLimits[0].min + (drawH - (p - topMarg)) / drawH * (coordLimits[0].max - coordLimits[0].min); // flip Y-axis
    // };


    function saveSelectionsInSlot() {
    	// debugLog("saveSelectionsInSlot");

	var result = {};
	result.selections = [];
	for(var sel = 0; sel < selections.length; sel++) {
	    result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1], 'minY':selections[sel][2], 'maxY':selections[sel][3]});
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
	    var newSelections = [];

	    if(unique > 0) {
		// var maxX = 0;
		// for(var set = 0; set < coordArrays[0].length; set++) {
		//     if(coordArrays[0][set].length > maxX) {
		// 	maxX = coordArrays[0][set].length;
		//     }
		// }

		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
		    var newSel = slotSelections.selections[sel];
		    
		    var X1 = newSel.minX;
		    var X2 = newSel.maxX;

		    var Y1 = newSel.minY;
		    var Y2 = newSel.maxY;

		    if(X2 < 0 
		       || X1 > maxMaxX
		       || Y2 < minMinY // coordLimits[0].min 
		       || Y1 > maxMaxY){ //coordLimits[0].max) {
			// completely outside
			continue;
		    }
		    
		    X1 = Math.max(0, X1);
		    X2 = Math.min(maxMaxX, X2);

		    Y1 = Math.max(coordLimits[0].min, Y1);
		    Y2 = Math.min(coordLimits[0].max, Y2);
		    
		    // newSelections.push([X1,X2,Y1,Y2, val2pixelX(maxX, X1),val2pixelX(maxX, X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
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

	if(unique > 0) {

	    for(var sel = 0; sel < selections.length; sel++) {
		var newSel = selections[sel];
		var X1 = newSel[0];
		var X2 = newSel[1];

		var Y1 = newSel[2];
		var Y2 = newSel[3];

		if(X2 < 0 
		   || X1 > maxMaxX
		   || Y2 < minMinY // coordLimits[0].min 
		   || Y1 > maxMaxY){ //coordLimits[0].max) {
		    // completely outside
		    continue;
		}
		
		X1 = Math.max(0, X1);
		X2 = Math.min(maxMaxX, X2);
		
		Y1 = Math.max(minMinY, Y1);
		Y2 = Math.min(maxMaxY, Y2);
		
		newSelections.push([X1,X2,Y1,Y2, val2pixelX(X1),val2pixelX(X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
	    }
	    
	    if(newSelections.length > 0) {
		selections = newSelections;
    		saveSelectionsInSlot();
		drawSelections();
	    } else {
		selectAll();
	    }
	}
    };

    function selectAll() {
	if(unique <= 0) {
	    selections = [];
	} else {
	    selections = [[0, maxMaxX, minMinY, maxMaxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
	}
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
    };


    function updateLocalSelections(selectAll) {
    	// debugLog("updateLocalSelections");

    	var dirty = false;

    	selections.sort(function(a,b){return (Math.abs(a[1]-a[0]) - Math.abs(b[1]-b[0]));}); // sort selections so smaller (area) ones are checked first.
	
    	var idMap = {};
    	var nextId = 1;

	var missingVal = $scope.gimme('ValueForMissingDataPoints');
	if(missingVal == "null") {
	    missingVal = null;
	} else {
	    missingVal = parseFloat(missingVal);
	}

    	for(var set = 0; set < Ns.length; set++) {
    	    var selArray = localSelections[set];

	    for(var i = 0; i < Ns[set]; i++) {
		var newVal = 1;
		var x = i;
		var y = coordArrays[0][set][i];
		var y2 = y;

		if(linearRegressionRes.length > 0) {
		    y2 = linearRegressionRes[set][i];
		}

		if(y === null) {
		    newVal = nullGroup;
		} else {
		    if(selectAll) {
			newVal = 1;
		    } else {
			var groupId = 0;
			
			for(var span = 0; span < selections.length; span++) {
			    if(selections[span][0] <= x
			       && x <= selections[span][1]
			       && ((y != missingVal && selections[span][2] <= y
				    && y <= selections[span][3])
				   || (selections[span][2] <= y2
				       && y2 <= selections[span][3]))
			      ) {
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
	$scope.dataSetName = "";
	
	// data from parent
	
	idArrays = [];
	coordArrays = [];
	coordTypes = [];
	coordLimits = [];
	
	Ns = [];
	N = 0;
	
	unique = 0; // number of data points with non-null values
	NULLs = 0;
	
	localSelections = []; // the data to send to the parent

	linearRegressionRes = [];
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

	var haveMore = false;

	if(parentInput.length > 0) {
	    var haveDependent = false;
	    var haveRegressor1 = false;

	    var type1 = "string";
	    var type2 = "string";
	    var moreTypes = [];

	    var name1 = "";
	    var name2 = "";
	    var moreNames = [];

	    var corrupt = false;

	    for(var i = 0; i < parentInput.length; i++) {
		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Dependent") {
		    haveDependent = true;
		    
		    if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
			type1 = 'date';
		    } else if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "number") {
			type1 = 'number';
		    }

		    if(parentInput[i].hasOwnProperty("description")) {
			name1 = parentInput[i]["description"];
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Regressor 1") {
		    haveRegressor1 = true;
		    
		    if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "date") {
			type2 = 'date';
		    } else if(parentInput[i].hasOwnProperty("type") && parentInput[i].type == "number") {
			type2 = 'number';
		    }

		    if(parentInput[i].hasOwnProperty("description")) {
			name2 = parentInput[i]["description"];
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Optional Regressors") {
		    haveMore = true;

                    if (parentInput[i].hasOwnProperty("packedTypes")) {
			var splitStr = parentInput[i].packedTypes.split(';');
    			
			for(var s = 0; s < splitStr.length; s++) {
			    moreTypes.push(splitStr[s]); // we get an extra empty string here if there is a terminating ";"
    			}
		    }
		    
                    if (parentInput[i].hasOwnProperty("packedDescriptions")) {
			var splitStr = parentInput[i].packedDescriptions.split(';');

			for(var s = 0; s < splitStr.length; s++) {
			    moreNames.push(splitStr[s]); // we get an extra empty string here if there is a terminating ";"
			}
		    }
		}
	    }

	    if(!corrupt && haveDependent && haveRegressor1) {
		atLeastOneFilled = true;
	    }
	}
	
	// debugLog("read parent input ", atLeastOneFilled);
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    idArrays = $scope.gimme('DataIdSlot');
	    var c1Arrays = $scope.gimme('Dependent');
	    var c2Arrays = $scope.gimme('Regressor1');
	    var moreArrays = $scope.gimme('MoreRegressors');

	    if(idArrays.length != c1Arrays.length
	       || idArrays.length != c1Arrays.length) {
		dataIsCorrupt = true;
	    }
	    if(idArrays.length <= 0) {
		dataIsCorrupt = true;
	    }

	    if(haveMore) {
		for(var more = 0; more < moreArrays.length; more++) { 
		    if(moreArrays[more].length != idArrays.length) {
			dataIsCorrupt = true;
		    }
		}
	    }
	    
	    if(!dataIsCorrupt) {
		var sets = idArrays.length;
		
		for(var set = 0; set < sets; set++) {
		    var idArray = idArrays[set];
		    var c1Array = c1Arrays[set];
		    var c2Array = c2Arrays[set];
		    
		    if(idArray.length != c1Array.length
		       || idArray.length != c2Array.length) {
			dataIsCorrupt = true;
		    }
		    if(idArray.length <= 0) {
			dataIsCorrupt = true;
		    }

		    if(haveMore) {
			for(var more = 0; more < moreArrays.length; more++) {
			    if(moreArrays[more][set].length != idArray.length) {
				dataIsCorrupt = true;
			    }
			}
		    }
		}
	    }

	    if(!dataIsCorrupt) {
		coordTypes.push(type1);
		coordTypes.push(type2);
		
		coordLimits.push({'min':0, 'max':0});
		coordLimits.push({'min':0, 'max':0});

		coordArrays.push([]); // for Dependent
		coordArrays.push([]); // for Regressor1

		if(haveMore) {
		    for(var more = 0; more < moreArrays.length; more++) {
			coordTypes.push(moreTypes[more]);
			coordLimits.push({'min':0, 'max':0});
			coordArrays.push([]);
		    }
		}
		
		Ns = [];
		for(var set = 0; set < sets; set++) {
		    var c1Array = c1Arrays[set];
		    var c2Array = c2Arrays[set];
		    
		    N += c1Array.length;
		    Ns.push(c1Array.length);
		    
		    localSelections.push([]);

		    coordArrays[0].push(c1Array);
		    coordArrays[1].push(c2Array);
		    
		    if(haveMore) {
			for(var more = 0; more < moreArrays.length; more++) {
			    coordArrays[2+more].push(moreArrays[more][set]);
			}
		    }
		}
		
		if(coordArrays.length != coordTypes.length
		   || coordArrays.length != coordLimits.length) {
		    dataIsCorrupt = true;
		}

		for(var set = 0; set < sets; set++) {
		    for(i = 0; i < Ns[set]; i++) {
			localSelections[set].push(-1);
		    }
		}

		for(var coord = 0; coord < coordArrays.length; coord++) {
		    var firstNonNullData = true;

		    for(set = 0; set < Ns.length; set++) {
			for(var i = 0; i < Ns[set]; i++) {
			    var val = coordArrays[coord][set][i];
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
		    }
		    if(firstNonNullData) {
			dataIsCorrupt = true; // only null values
		    } else {

			zoomMinX = 0;
			zoomMaxX = 0;
			for(var set = 0; set < sets; set++) {
			    zoomMaxX = Math.max(Ns[set], zoomMaxX);
			}

			zoomMinY = coordLimits[0].min;
			zoomMaxY = coordLimits[0].max;
			$scope.set("MinX", zoomMinX);
			$scope.set("MaxX", zoomMaxX);
			$scope.set("MinY", zoomMinY);
			$scope.set("MaxY", zoomMaxY);

			maxMaxX = zoomMaxX;
			maxMaxY = zoomMaxY;
			minMinY = zoomMinY;

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

	    if(coordArrays.length > 0) {
		unique = unique / coordArrays.length;
	    }
	    
	    if(dataIsCorrupt) {
		debugLog("data is corrupt");
		resetVars();
	    }
	} else {
	    // debugLog("no data");
	}

	checkSelectionsAfterNewData();
	updateSize();
	updateGraphicsHelper(false, true, false);

	if(unique > 0) {
	    updateLocalSelections(false);

	    linearRegression();

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


    function doBackgroundLinearRegression() {
	// debugLog("doBackgroundLinearRegression");

	if(backgroundThread !== null) {
	    // already running. kill thread
	    backgroundThread.terminate();
	}
	
	backgroundThread = new Worker(myPath + '/regression.js');

	backgroundThread.addEventListener('message', function(e) {
	    linearRegressionFinished(e);
	}, false);

	var missingVal = $scope.gimme('ValueForMissingDataPoints');
	if(missingVal == "null") {
	    missingVal = null;
	} else {
	    missingVal = parseFloat(missingVal);
	}
	
	var data = {'missingVal':missingVal, 
		    'coordArrays':coordArrays,
		    'start':true};
	backgroundThread.postMessage(data); // start background thread
    };

    function linearRegressionFinished(e) {
	// debugLog("linearRegressionFinished");
	var data = e.data;
	
	linearRegressionRes = data.linearRegressionRes;

	minMinY = coordLimits[0].min;
	maxMaxY = coordLimits[0].max;

	debugLog("min max in data are: " + minMinY + " and " + maxMaxY);

	for(var set = 0; set < linearRegressionRes.length; set++) {
	    for(var i = 0; i < linearRegressionRes[set].length; i++) {
		minMinY = Math.min(minMinY, linearRegressionRes[set][i]);
		maxMaxY = Math.max(maxMaxY, linearRegressionRes[set][i]);
	    }
	}

	zoomMaxY = maxMaxY;
	zoomMinY = minMinY;
	$scope.set("MinY", zoomMinY);
	$scope.set("MaxY", zoomMaxY);

	selectAll();

	debugLog("min max in regression+data are: " + minMinY + " and " + maxMaxY);

	$scope.set('LinearRegressionResult', linearRegressionRes[0]); // fix this later, more than one set should give what behavior?
	$scope.set('DataChanged', true);

	// debugLog("linearRegression,  finished");

	updateSelectionsWhenZoomingOrResizing();
	updateGraphicsHelper(false, true, false);
	
	if(backgroundThread !== null) {
	    backgroundThread.terminate();
	    backgroundThread = null;
	}
    };


    function linearRegression () {
	if(unique > 0) {
	    if(typeof(Worker) !== "undefined") {
		debugLog("browser supports background threads");
		doBackgroundLinearRegression();
	    } else {
		debugLog("Browser does not support background threads. Do linearRegression in main thread.");
		linearRegressionMainThread();
	    }
	}
    }

    function linearRegressionMainThread () {
	// simple "Ordinary least squares"

	// solve for beta
	// beta = invert( transp(X) * X ) * transp(X)*y
	
	// use beta to fill in missing values
	// y = X * beta

	// debugLog("linearRegression");

	var missingVal = $scope.gimme('ValueForMissingDataPoints');
	if(missingVal == "null") {
	    missingVal = null;
	} else {
	    missingVal = parseFloat(missingVal);
	}

	// build X from inputs where Y has a value

	// debugLog("linearRegression, build X and y");

	X = [];
	y = [];
	var ys = 0;
	for(var set = 0; set < coordArrays[0].length; set++) {
	    for(var i = 0; i < coordArrays[0][set].length; i++) {
		if(coordArrays[0][set][i] != missingVal) {
		    y.push(coordArrays[0][set][i]);

		    X.push([]);
		    for(var par = 1; par < coordArrays.length; par++) { 
			// skip first parameter, which is the dependent
			X[ys].push(coordArrays[par][set][i]);
		    }

		    ys++;
		}
	    }
	}

	// debugLog("linearRegression, XtX");

	var XtX = [];
	for(i = 0; i < X[0].length; i++) { 
	    XtX.push([]);
	    for(var j = 0; j < X[0].length; j++) {
		XtX[i].push(0);

		// XtX[i,j] = 0;
		for(var idx = 0; idx < X.length; idx++) {
		    XtX[i][j] += X[idx][i] * X[idx][j];
		}
	    }
	}

	// debugLog("linearRegression, invert XtX");
	var inv = invert(XtX);

	if(inv.length <= 0) {
	    // not invertible
	    
	    linearRegressionRes = [];
	    return;
	}
	
	// debugLog("linearRegression,  Xty");

	var Xty = [];
	for(i = 0; i < X[0].length; i++) {
	    Xty.push(0);
	    for(j = 0; j < y.length; j++) {
		Xty[i] += X[j][i] * y[j]; // want transpose of X, thus j and i are reversed
	    }
	}

	// debugLog("linearRegression,  beta");
	var beta = [];
	for(i = 0; i < inv.length; i++) {
	    beta.push(0);
	    
	    for(j = 0; j < inv.length; j++) { 
		beta[i] += inv[i][j] * Xty[j];
	    }
	}

	// debugLog("linearRegression,  predict");
	var predictions = [];

	for(var set = 0; set < coordArrays[0].length; set++) {
	    predictions.push([]);
	    for(var i = 0; i < coordArrays[0][set].length; i++) {
		predictions[set].push(0);
		for(var par = 1; par < coordArrays.length; par++) { 
		    predictions[set][i] += coordArrays[par][set][i] * beta[par - 1];
		}
	    }
	}

	// debugLog("linearRegression,  set slots");

	linearRegressionRes = predictions;

	minMinY = coordLimits[0].min;
	maxMaxY = coordLimits[0].max;
	for(var set = 0; set < linearRegressionRes.length; set++) {
	    for(var i = 0; i < linearRegressionRes[set]; i++) {
		minMinY = Math.min(minMinY, linearRegressionRes[set][i]);
		maxMaxY = Math.max(maxMaxY, linearRegressionRes[set][i]);
	    }
	}

	$scope.set('LinearRegressionResult', linearRegressionRes[0]); // fix this later, more than one set should give what behavior?
	$scope.set('DataChanged', true);

	// debugLog("linearRegression,  finished");

	updateSelectionsWhenZoomingOrResizing();
	updateGraphicsHelper(false, true, false);
    }

    function invert(M) {
	// debugLog("invert");

	// debugLog("invert, augment matrix");
	var augM = [];
	for(var row = 0; row < M.length; row++) {
	    augM.push([]);
	    for(var col = 0; col < M.length; col++) {
		augM[row].push(M[row][col]);
	    }
	    for(col = 0; col < M.length; col++) {
		if(col == row) {
		    augM[row].push(1);
		} else {
		    augM[row].push(0);
		}
	    }
	}

	// debugLog("invert, Gauss-Jordan");
	for(var i = 0; i < M.length; i++) {
	    //// find largest pivot
	    var max = Math.abs(augM[i][i]);
	    var maxrow = i;
	    for(var j = i; j < M.length; j++) {
	    	if(Math.abs(augM[i][j]) > max) {
	    	    max = Math.abs(augM[j][i]);
		    maxrow = j;
	    	}
	    }
	    if(maxrow != i) {
		var temp = augM[i];
		augM[i] = augM[maxrow];
		augM[maxrow] = temp;
	    }
	    
	    var scale = augM[i][i];

	    if(scale == 0) {
		debugLog('matrix is not invertible');
		return [];
	    }

	    for(var j = i; j < augM[i].length; j++) {
		augM[i][j] /= scale;
	    }

	    for(var i2 = 0; i2 < M.length; i2++) {
		if(i != i2) {
		    var fact = augM[i2][i];
		    for(var j = i; j < augM[i2].length; j++) {
			augM[i2][j] -= augM[i][j] * fact;
		    }
		}
	    }
	}

	// debugLog("invert, extract invert matrix");
	var res = [];
	for(i = 0; i < M.length; i++) {
	    res.push([]);
	    for(j = 0; j < M.length; j++) {
		res[i].push(augM[i][M.length + j]);
	    }
	}
	// debugLog("invert, finished");
	return res;
    }
    
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

	zoomMinX = Math.max(parseFloat($scope.gimme("MinX")), 0);
	zoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), maxMaxX);
	zoomMinY = Math.max(parseFloat($scope.gimme("MinY")), minMinY);
	zoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), maxMaxY);

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
		redrawLines = true;
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
	    drawTimeSeries(W, H);
	}

	drawSelections();

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

	// X axis

	axesCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

	if(unique > 0) {
	    var LABELS = 5;
	    for(var i = 0; i < LABELS+1; i++) {
		var pos = leftMarg + i/LABELS*drawW;

		var s = "";
		s = pixel2valX(pos);
		
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
		s = number2text(pixel2valY(pos), coordLimits[0].span);
		
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

	if(unique > 0) {
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

	    if(zoomMinY < 0 && zoomMaxY > 0) {
		var pos = val2pixelY(0);

		var col = col = hexColorToRGBA(textColor, 0.5);
    		
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

    function drawTimeSeries(W, H) {
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

	// debugLog("drawTimeSeries");

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

	var missingVal = $scope.gimme('ValueForMissingDataPoints');
	if(missingVal == "null") {
	    missingVal = null;
	} else {
	    missingVal = parseFloat(missingVal);
	}

	// first draw all the unselected data, and first the training data
	var drawPretty = true;
	if(unique > quickRenderThreshold) {
	    drawPretty = false;
	    var rgba0 = hexColorToRGBAvec(getColorForGroup(0), 0.33);
	    var imData = dotCtx.getImageData(0, 0, dotCanvas.width, dotCanvas.height);
	    var pixels = imData.data;
	} else {
	    var col0 = hexColorToRGBA(getColorForGroup(0), 0.33);
	    var fill0 = getGradientColorForGroup(0, 0,0,W,H, 0.33, dotCanvas, dotCtx);
	}

    	for(var set = 0; set < coordArrays[0].length; set++) {
    	    var yArray = coordArrays[0][set];

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < yArray.length; i++) {
    		if(yArray[i] === null
		   || yArray[i] == missingVal) {
    		    continue;
    		}
		
		if(i < zoomMinX
		   || i > zoomMaxX
		   || yArray[i] < zoomMinY
		   || yArray[i] > zoomMaxY) {
		    continue; // outside zoomed range
		}

                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId == 0) {
                    var x = val2pixelX(i);
                    var y = val2pixelY(yArray[i]);

		    if(drawPretty) {
			dotCtx.beginPath();
			dotCtx.arc(x, y, dotSize+4, 0, 2 * Math.PI, false);
			dotCtx.lineWidth = 1;
			dotCtx.strokeStyle = col0;
			dotCtx.stroke();
		    } else {
			drawDotOutline(x, y, dotSize*1.5+8, 6, rgba0[3], rgba0[0], rgba0[1], rgba0[2], W, H, pixels);
		    }
		}
            }
    	}

	// next, draw all the selected data on top, first the training data
    	for(var set = 0; set < Ns.length; set++) {
    	    var yArray = coordArrays[0][set];

	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

    	    for(var i = 0; i < yArray.length; i++) {
    		if(yArray[i] === null
		   || yArray[i] == missingVal
		  ) {
    		    continue;
    		}

		if(i < zoomMinX
		   || i > zoomMaxX
		   || yArray[i] < zoomMinY
		   || yArray[i] > zoomMaxY) {
		    continue; // outside zoomed range
		}
		
                var groupId = 0;

		if(i < selArray.length) {
		    groupId = selArray[i];
		}

		if(groupId != 0) {
                    var x = val2pixelX(i);
                    var y = val2pixelY(yArray[i]);

		    if(drawPretty) {
    			var col = getColorForGroup(groupId);

			dotCtx.beginPath();
			dotCtx.arc(x, y, dotSize+4, 0, 2 * Math.PI, false);
			dotCtx.lineWidth = 1;
			dotCtx.strokeStyle = col;
			dotCtx.stroke();
		    } else {
			rgba = hexColorToRGBAvec(getColorForGroup(groupId), 1);
			drawDotOutline(x, y, dotSize*1.5+8, 6, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
		    }
		}
            }
    	}
	
	// =========================================================
	// next, draw the filled in (linearRegression result) values
	// =========================================================

	if(linearRegressionRes.length > 0) {
    	    for(var set = 0; set < coordArrays[0].length; set++) {
    		var yArray = linearRegressionRes[set];

		var selArray = [];
		if(set < globalSelections.length) {
		    selArray = globalSelections[set];
		}

    		for(var i = 0; i < yArray.length; i++) {
                    var groupId = 0;

		    if(i < zoomMinX
		       || i > zoomMaxX
		       || yArray[i] < zoomMinY
		       || yArray[i] > zoomMaxY) {
			continue; // outside zoomed range
		    }

		    if(i < selArray.length) {
			groupId = selArray[i];
		    }

		    if(groupId == 0) {
			var x = val2pixelX(i);
			var y = val2pixelY(yArray[i]);
			
			if(drawPretty) {
			    if(!useGlobalGradients) {
    		     		fill0 = getGradientColorForGroup(0, x-dotSize,y-dotSize,x+dotSize,y+dotSize, 0.33, dotCanvas, dotCtx);
			    }

			    dotCtx.beginPath();
			    dotCtx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
			    dotCtx.fillStyle = fill0;
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

    	    for(var set = 0; set < Ns.length; set++) {
    		var yArray = linearRegressionRes[set];

		var selArray = [];
		if(set < globalSelections.length) {
		    selArray = globalSelections[set];
		}

    		for(var i = 0; i < yArray.length; i++) {
		    if(i < zoomMinX
		       || i > zoomMaxX
		       || yArray[i] < zoomMinY
		       || yArray[i] > zoomMaxY) {
			continue; // outside zoomed range
		    }

                    var groupId = 0;

		    if(i < selArray.length) {
			groupId = selArray[i];
		    }

		    if(groupId != 0) {
			var x = val2pixelX(i);
			var y = val2pixelY(yArray[i]);

			if(drawPretty) {
    			    var col = getColorForGroup(groupId);
    			    var fill = getGradientColorForGroup(groupId, x-dotSize,y-dotSize,x+dotSize,y+dotSize, 1, dotCanvas, dotCtx);

			    dotCtx.beginPath();
			    dotCtx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
			    dotCtx.fillStyle = fill;
			    dotCtx.fill();
			    dotCtx.lineWidth = 1;
			    dotCtx.strokeStyle = col;
			    dotCtx.stroke();
			} else {
			    rgba = hexColorToRGBAvec(getColorForGroup(groupId), 1);
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

    function drawDotOutline(X, Y, DOTSIZE, LineWidth, alpha, r, g, b, Width, Height, pixels) {
	var dotSize = Math.round(DOTSIZE);
	var lineW = Math.round(LineWidth);

	if(lineW >= dotSize) { // just draw a filled dot
	    drawDot(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels);
	    return;
	}

        var xpos = Math.round(X);
	var ypos = Math.round(Y);
	var W = Math.floor(Width);
	var H = Math.floor(Height);
	var halfDot = Math.round(DOTSIZE/2);

        var startPixelIdx = (ypos * W + xpos) * 4;

        var r2 = Math.ceil(dotSize * dotSize / 4.0);
	var r2inner = Math.ceil((dotSize - lineW) * (dotSize - lineW) / 4.0);

        for (var x = -halfDot; x < halfDot + 1; x++)
        {
	    if (x + xpos >= 0 && x + xpos < W) {
		var x2 = x * x;
		
		for (var y = -halfDot; y < halfDot + 1; y++)
		{
		    if(y + ypos >= 0 && y + ypos < H)
		    {
			var y2 = y * y;
			
			var sum = y2 + x2;
			if (sum <= r2 && sum > r2inner)
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

    // function val2pixelX(maxX, idx) {
    // 	if(unique <= 0) {
    // 	    return 0;
    // 	}
	
    // 	if(idx < 0) {
    // 	    return leftMarg;
    // 	}
    // 	if(idx > maxX) {
    // 	    return leftMarg + drawW;
    // 	}
	
    // 	return leftMarg + idx / maxX * drawW;
    // };

    // function val2pixelY(v) {
    // 	if(unique <= 0) {
    // 	    return 0;
    // 	}
	
    // 	if(v < coordLimits[0].min) {
    // 	    return topMarg + drawH; // flip Y-axis
    // 	}
    // 	if(v > coordLimits[0].max) {
    // 	    return topMarg; // flip Y-axis
    // 	}
	
    // 	return topMarg + drawH - ((v - coordLimits[0].min) / (coordLimits[0].max - coordLimits[0].min) * drawH); // flip Y-axis
    // };

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

	// update selections
	updateSelectionsWhenZoomingOrResizing();

	updateGraphicsHelper(bgDirty, dotDirty, axesDirty);
    }

    function updateSelectionsWhenZoomingOrResizing() {
	if(unique > 0) {
	    for(var sel = 0; sel < selections.length; sel++) {
		var s = selections[sel];
		s[4] = val2pixelX(s[0]);
		s[5] = val2pixelX(s[1]);
		s[6] = val2pixelY(s[2]);
		s[7] = val2pixelY(s[3]);
	    }
	}
    }

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {
	case "SelectAll":
	    if(eventData.slotValue) {
		selectAll();
		$scope.set("SelectAll",false);
	    }
	    break;
	// case "SelectAll":
	//     selectAll();
	//     break;

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

    	case "MaxX":
	    var newZoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), maxMaxX);
	    if(newZoomMaxX <= zoomMinX) {
		newZoomMaxX = Math.min(zoomMinX + 1, maxMaxX, zoomMaxX);
	    }

	    $scope.set("MaxX", newZoomMaxX);

	    if(newZoomMaxX != zoomMaxX) {
		zoomMaxX = newZoomMaxX;
		updateSelectionsWhenZoomingOrResizing();
    		updateGraphicsHelper(false, true, true);
	    }
    	    break;
    	case "MaxY":
	    var newZoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), maxMaxY);
	    if(newZoomMaxY <= zoomMinY) {
		newZoomMaxY = Math.min(zoomMinY + 1, maxMaxY, zoomMaxY);
	    }

	    $scope.set("MaxY", newZoomMaxY);

	    if(newZoomMaxY != zoomMaxY) {
		zoomMaxY = newZoomMaxY;
		updateSelectionsWhenZoomingOrResizing();
    		updateGraphicsHelper(false, true, true);
	    }
    	    break;
    	case "MinX":
	    var newZoomMinX = Math.max(parseFloat($scope.gimme("MinX")), 0);
	    if(newZoomMinX >= zoomMaxX) {
		newZoomMinX = Math.max(zoomMaxX - 1, 0, zoomMinX);
	    }

	    $scope.set("MinX", newZoomMinX);

	    if(newZoomMinX != zoomMinX) {
		zoomMinX = newZoomMinX;
		updateSelectionsWhenZoomingOrResizing();
    		updateGraphicsHelper(false, true, true);
	    }
    	    break;
    	case "MinY":
	    var newZoomMinY = Math.max(parseFloat($scope.gimme("MinY")), minMinY);
	    if(newZoomMinY >= zoomMaxY) {
		newZoomMinY = Math.max(zoomMaxY - 1, minMinY, zoomMinY);
	    }

	    $scope.set("MinY", newZoomMinY);

	    if(newZoomMinY != zoomMinY) {
		zoomMinY = newZoomMinY;
		updateSelectionsWhenZoomingOrResizing();
    		updateGraphicsHelper(false, true, true);
	    }
    	    break;

	case "ValueForMissingDataPoints":
	    if(unique > 0) {
		linearRegression();
	    }
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
	case "InternalSelections":
	    if(eventData.slotValue != internalSelectionsInternallySetTo) {
		setSelectionsFromSlotValue();
	    }
	    break;

	// case 'LineTransparency':
	//     var newVal = parseFloat($scope.gimme('LineTransparency'));
	//     if(newVal < 0) {
	// 	newVal = 0;
	//     }
	//     if(newVal > 1) {
	// 	newVal = 1;
	//     }
	//     if(newVal != transparency) {
	// 	transparency = newVal;
	// 	updateGraphics();
	//     }

    	case "FontSize":
	    updateSize();
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

    	    var yArray = coordArrays[0][set];

    	    for(var i = 0; i < Ns[set]; i++) {
    		if(yArray[i] === null) {
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
	    selections = [[0, maxMaxX, minMinY, maxMaxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
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

	selectionCtx.fillStyle = selectionColors.grad;	    
	selectionCtx.strokeStyle = selectionColors.border;

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

	    // hover text
	    mouseIsOverMe = true;

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

		    
		    var s = "[" + x + "," + number2text(y, coordLimits[0].span) + "]";

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
		    if(e.ctrlKey) {
			clickStart.ctrl = true;
		    } else {
			clickStart.ctrl = false;
		    }
		    
		    selectionHolderElement.bind('mouseup', onMouseUp);
		    e.stopPropagation();
		} else {
		    clickStart = null;
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



    function keyPressed(eventData) {
	if(mouseIsOverMe && !eventData.key.released) {
	    // var keyCode = eventData.key.code;
	    var keyName = eventData.key.name;

	    switch(keyName) {
	    case '+':
	    case "= +":
		zoomIn();
		break;
	    case '-':
	    case "- _":
		zoomOut();
		break;
	    case "Left Arrow":
		panLeft();
		break;
	    case "Right Arrow":
		panRight();
		break;
	    case "Down Arrow":
		panDown();
		break;
	    case "Up Arrow":
		panUp();
		break;

	    case 'z':
	    case 'Z':
		zoomIn();
		break;
	    case 'x':
	    case 'X':
		zoomOut();
		break;
	    case 'a':
	    case 'A':
		panLeft();
		break;
	    case 'd':
	    case 'D':
		panRight();
		break;
	    case 's':
	    case 'S':
		panDown();
		break;
	    case 'w':
	    case 'W':
		panUp();
		break;
	    }
	}
    }

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

	zoomMinX = Math.max(0, midX - halfSpan * 2);
	zoomMaxX = Math.min(maxMaxX, midX + halfSpan * 2);

	var midY = (zoomMinY + zoomMaxY) / 2;
	halfSpan = (zoomMaxY - zoomMinY) / 2;

	zoomMinY = Math.max(minMinY, midY - halfSpan * 2);
	zoomMaxY = Math.min(maxMaxY, midY + halfSpan * 2);

	$scope.set("MinX", zoomMinX);
	$scope.set("MaxX", zoomMaxX);
	$scope.set("MinY", zoomMinY);
	$scope.set("MaxY", zoomMaxY);
	updateSelectionsWhenZoomingOrResizing();
	updateGraphicsHelper(false, false, false);
    }

    function panLeft() {
	if(zoomMinX > 0) {
	    var shift = zoomMinX;
	    var halfSpan = (zoomMaxX - zoomMinX) / 2;
	    if(shift < halfSpan) {
		zoomMinX = 0;
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
	if(zoomMaxX < maxMaxX) {
	    var shift = maxMaxX - zoomMaxX;
	    var halfSpan = (zoomMaxX - zoomMinX) / 2;
	    if(shift < halfSpan) {
		zoomMaxX = maxMaxX;
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
	if(zoomMinY > minMinY) {
	    var shift = zoomMinY - minMinY;
	    var halfSpan = (zoomMaxY - zoomMinY) / 2;
	    if(shift < halfSpan) {
		zoomMinY = minMinY;
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
	if(zoomMaxY < maxMaxY) {
	    var shift = maxMaxY - zoomMaxY;
	    var halfSpan = (zoomMaxY - zoomMinY) / 2;
	    if(shift < halfSpan) {
		zoomMaxY = maxMaxY;
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
	// 		       ));

        // internal slots specific to this Webble -----------------------------------------------------------

        $scope.addSlot(new Slot('ValueForMissingDataPoints',
				"null",
				"Value for Missing Data Points",
				'What values indicate missing values (to be filled in) in the dependent (i.e. null, 0, -1).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('DotSize',
				2,
				"DotSize",
				'The size (in pixels) of the dots in the plot.',
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
				500,
				"Quick Render Threshold",
				'The number of data items to accept before switching to faster (but less pretty) rendering.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        // $scope.addSlot(new Slot('LineTransparency',
	// 			0.6,
	// 			"Line Transparency",
	// 			'Transparency can be set from 0 to 1. When there are many lines, using a lower transparency can make things clearer.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 		       ));

        $scope.addSlot(new Slot('FontSize',
				11,
				"Font Size",
				'The font size to use in the Webble interface.',
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
				"LinearRegression",
				'Plugin Name',
				'The name to display in menus etc.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));

        $scope.addSlot(new Slot('PluginType',
				"Hybrid",
				"Plugin Type",
				'The type of plugin this is. Should always be "Hybrid".',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


        $scope.addSlot(new Slot('ExpectedFormat',
				[[{'idSlot':'DataIdSlot', 'name':'Dependent', 'type':'number', 'slot':'Dependent'},
				  {'idSlot':'DataIdSlot', 'name':'Regressor 1', 'type':'number', 'slot':'Regressor1'},
				  {'idSlot':'DataIdSlot', 'name':'Optional Regressors', 'type':'number', 'slot':'MoreRegressors', 'zeroOrMore':true}
				 ]],
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

        $scope.addSlot(new Slot('Dependent',
				[[1,null,3,null,3,null]],
				"Dependent",
				'The data for the dependent variable.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Dependent').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('Regressor1',
				[[1,1,3,4,3,1]],
				"Regressor 1",
				'The data for the first regressor.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Regressor1').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('MoreRegressors',
				[[[1,2,3,4,5,6],[3,2,1,2,3,4]]],
				"More Regressors",
				'A slot that takes an array with more regressors.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('MoreRegressors').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);


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


        $scope.addSlot(new Slot('ProvidedFormat',
				{"format":{"sets":[{"name":"LinearRegressionResult","fieldList":[{"slot":"LinearRegressionResult","name":"LinearRegression Result","type":"number"}], "idSlot":"DataIdSlot","useInputIDs":true}]}},
				'Provided Format',
				'A JSON description of what data the Webble provides.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
    	// $scope.getSlot('ProvidedFormat').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	
        $scope.addSlot(new Slot('LinearRegressionResult',
				[],
				'LinearRegression Result',
				'Data generated by linear linearRegression on the input data.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
    	$scope.getSlot('LinearRegressionResult').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('ProvidedFormatChanged',
				false,
				'Provided Format Changed',
				'This slot changes value (between true and false) every time the Provided Format slot changes (slot changes are not always caught otherwise).',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
        $scope.addSlot(new Slot('DataChanged',
				false,
				'Data Changed',
				'This slot changes value (between true and false) when the data in the generated slots change but the format remained the same (slot changes are not always caught otherwise).', 
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));


        $scope.setDefaultSlot('');

	myInstanceId = $scope.getInstanceId();
	myPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

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

	$scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
	    keyPressed(eventData);
	});

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
