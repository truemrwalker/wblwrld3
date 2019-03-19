//======================================================================================================================
// Controllers for NeuralNetworkActivationVisualization for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('neuralNetworkActivationVisualizationWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Neural Network Activation Visualization";
    $scope.dataSetName = "";

    var myInstanceId = -1;
    
    // graphics

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    
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
    var topMarg = 20;
    var rightMarg = 20;
    var bottomMarg = 15;
    var fontSize = 11;

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var inputValues = [];
    var networkLayout = [];
    var networkActivations = [];

    var clickStart = null;

    // data from parent

    var dotSize = 5;
    var dotMargin = 1;
    var layerMargin = 1;
    var lineWidth = 2;
    var transparency = 1;

    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;

    //=== EVENT HANDLERS ================================================================

    $scope.onFilesAdded = function(files) {
        if(files !== undefined && files.length > 0) {
	    var f = files[0];

	    var reader = new FileReader();
	    
	    // Closure to capture the file information.
	    reader.onload = function(e) {
		var contents = e.target.result.replace(/[\r\n]+/g, "\n");
		parseFile(contents);
	    };
	    
	    reader.readAsText(f);
	    $scope.dataSetName = f.name;
	}
    };

    function parseFile(contents) {
	try {
	    if(typeof contents === 'string') {
		contents = JSON.parse(contents);
		$scope.set("Network", contents);
		return;
	    }
	} catch (e) {

	}
    }

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("Neural Network Activation Visualization: " + message);
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

    function pixel2valX(p) {
    	// if(unique <= 0) {
    	//     return 0;
    	// }
	
    	// if(p < leftMarg + leftShift) {
    	//     return limits.minX;
    	// }
    	// if(p > leftMarg + leftShift + drawW) {
    	//     return limits.maxX;
    	// }
    	// return limits.minX + (p - leftMarg - leftShift) / drawW * (limits.spanX);
    };

    function pixel2valY(p) {
    	// if(unique <= 0) {
    	//     return 0;
    	// }
	
    	// if(p < topMarg + topShift) {
    	//     return limits.maxY; // flip Y-axis
    	// }
    	// if(p > topMarg + topShift + drawH) {
    	//     return limits.minY; // flip Y-axis
    	// }
    	// var mappedLat = limits.minYmapped + (drawH - (p - topMarg - topShift)) / drawH * limits.spanYmapped; // flip Y-axis

    	// while (mappedLat < -20037508.3427892)
        // {
        //     mappedLat += 20037508.3427892;
        // }
        // while (mappedLat > 20037508.3427892)
        // {
        //     mappedLat -= 20037508.3427892;
        // }

        // var num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * mappedLat) / 6378137.0))); // ok??
        // return num7 * 57.295779513082323;
    };


    function latToY(lat) {
    	var a = lat * 0.017453292519943295;
        return 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
    }

    function val2pixelY(lat) {
    	// if(lat < limits.minY) {
    	//     return topMarg + topShift + drawH;
    	// }
    	// if(lat > limits.maxY) {
    	//     return topMarg + topShift;
    	// }
        // var mappedLat = latToY(lat);
        // return Math.round(topMarg + topShift + drawH - ((mappedLat - limits.minYmapped) / limits.spanYmapped * drawH));
    }

    function val2pixelX(lon) {
    	// if(lon < limits.minX) {
    	//     return leftMarg + leftShift;
    	// }
    	// if(lon > limits.maxX) {
    	//     return leftMarg + leftShift + drawW;
    	// }
    	// return Math.round(leftMarg + leftShift + (lon - limits.minX) / limits.spanX * drawW);
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
	    // var newSelections = [];
	    
	    // if(unique > 0) {
	    // 	for(var sel = 0; sel < slotSelections.selections.length; sel++) {
	    // 	    var newSel = slotSelections.selections[sel];
		    
	    // 	    var X1 = newSel.minX;
	    // 	    var X2 = newSel.maxX;

	    // 	    var Y1 = newSel.minY;
	    // 	    var Y2 = newSel.maxY;

	    // 	    if(X2 < limits.minX 
	    // 	       || X1 > limits.maxX
	    // 	       || Y2 < limits.minY 
	    // 	       || Y1 > limits.maxY) {
	    // 		// completely outside
	    // 		continue;
	    // 	    }
		    
	    // 	    X1 = Math.max(limits.minX, X1);
	    // 	    X2 = Math.min(limits.maxX, X2);

	    // 	    Y1 = Math.max(limits.minY, Y1);
	    // 	    Y2 = Math.min(limits.maxY, Y2);
		    
	    // 	    newSelections.push([X1,X2,Y1,Y2, val2pixelX(X1),val2pixelX(X2),val2pixelY(Y2),val2pixelY(Y1)]); // flip Y-axis
	    // 	}

	    // 	// debugLog("new selections: " + JSON.stringify(newSelections));
	    // 	if(newSelections.length > 0) {
	    // 	    selections = newSelections;
	    // 	    updateLocalSelections(false);
	    // 	    drawSelections();
	    // 	}
	    // } else { // no data
	    // 	for(var sel = 0; sel < slotSelections.selections.length; sel++) {
	    // 	    var newSel = slotSelections.selections[sel];
		    
	    // 	    var X1 = newSel.minX;
	    // 	    var X2 = newSel.maxX;

	    // 	    var Y1 = newSel.minY;
	    // 	    var Y2 = newSel.maxY;

	    // 	    newSelections.push([X1,X2,Y1,Y2, 0,0,0,0]);
	    // 	}
	    // 	selections = newSelections;
	    // }
	}
	
	saveSelectionsInSlot();
    };

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

    function updateGraphics() {
    	// debugLog("updateGraphics()");

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
    	drawNetwork(W, H);
	drawSelections();
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


    function drawNetwork(W, H) {
	// debugLog("draw!");

	if(networkLayout.length < 1) {
	    debugLog("No network to draw");
	    return;
	}

	if(inputValues.length != networkLayout[0].length) {
	    debugLog("input length not same as size of first network layer");
	    return;
	}

	var col;
	var fill;
	var zeroTransp = 0.33;
	if(transparency < 1) {
	    zeroTransp *= transparency;
	}
    	var col = hexColorToRGBA(getColorForGroup(0), zeroTransp);
    	var fill = getGradientColorForGroup(0, 0,0,W,H, zeroTransp);

	var noofLayers = networkLayout.length;
	
	var layerH = Math.floor((drawH - 2*dotSize) / (noofLayers - 1));
	var lMarg = layerMargin;
	if(layerH < dotSize + layerMargin) {
	    layerH = dotSize + layerMargin;
	} else {
	    lMarg = layerH - dotSize;
	}

	var maxActNode = [];
	var maxActEdge = [];

	networkActivations = [];
	for(var l = 0; l < noofLayers; l++) { // activate nodes
	    var maxAct = 0;
	    var layer = networkLayout[l];
	    var noofNodes = layer.length;

	    networkActivations.push([]);

	    for(var n = 0; n < noofNodes; n++) {
		if(l == 0) {
		    networkActivations[l].push(inputValues[n]);
		} else { 
		    networkActivations[l].push(0);
		}
	    }

	    if(l > 0) {
		for(var n = 0; n < networkLayout[l-1].length; n++) {
		    var edges = networkLayout[l-1][n];
		    for(var e = 0; e < edges.length; e++) {
			networkActivations[l][edges[e].n] += edges[e].w * networkActivations[l-1][n];
			
			// if(networkActivations[l][edges[e].n] > Math.abs(maxAct)) {
			//     maxAct = Math.abs(networkActivations[l][edges[e].n]);
			// }
		    }
		}
	    }

	    if(l > 0) {
		for(var n = 0; n < noofNodes; n++) {
		    networkActivations[l][n] = activation(networkActivations[l][n]);
		    
		    if(networkActivations[l][n] > Math.abs(maxAct)) {
			maxAct = Math.abs(networkActivations[l][n]);
		    }
		}
	    }
	    

	    if(maxAct == 0) {
		maxAct = 1;
	    }
	    maxActNode.push(maxAct);
	    // debugLog("Layer " + l + " maxAct " + maxAct);
	}

	for(var l = 0; l < noofLayers - 1; l++) { // draw edges
	    var layer = networkLayout[l];
	    var noofNodes = layer.length;
	    var noofNodes2 = networkLayout[l+1].length;

	    var maxAct = maxActNode[l];

	    var oneNodeW = Math.floor((drawW - 2*dotSize) / (noofNodes - 1));
	    var marg = dotMargin;
	    if(oneNodeW < dotSize*2 + dotMargin) {
		oneNodeW = dotSize*2 + dotMargin;
		marg = dotMargin;
	    } else {
		marg = oneNodeW - dotSize*2;
	    }

	    var oneNodeW2 = Math.floor((drawW - 2*dotSize) / (noofNodes2 - 1));
	    var marg2 = dotMargin;
	    if(oneNodeW2 < dotSize*2 + dotMargin) {
		oneNodeW2 = dotSize*2 + dotMargin;
		marg2 = dotMargin;
	    } else {
		marg2 = oneNodeW2 - dotSize*2;
	    }

	    var y1 = l * layerH + topMarg + dotSize;
	    var y2 = (l+1) * layerH + topMarg + dotSize;

	    for(var n = 0; n < noofNodes; n++) {
		var x1 = n * oneNodeW + leftMarg + dotSize;

		var edges = networkLayout[l][n];
		for(var e = 0; e < edges.length; e++) {
		    var act = networkActivations[l][n] * edges[e].w;
		    var x2 = edges[e].n * oneNodeW2 + leftMarg + dotSize;
		    
		    col = activationToCol(act, maxAct);

    		    ctx.save();
    		    ctx.beginPath();
		    ctx.moveTo(x1,y1);
		    ctx.lineTo(x2,y2);
    		    ctx.lineWidth = lineWidth;
    		    ctx.strokeStyle = col;
    		    ctx.stroke();
    		    ctx.restore();
		}
	    }
	}

	for(var l = 0; l < noofLayers; l++) { // draw nodes
	    var layer = networkLayout[l];
	    var noofNodes = layer.length;

	    var maxAct = maxActNode[l];

	    var oneNodeW = Math.floor((drawW - 2*dotSize) / (noofNodes - 1));
	    var marg = dotMargin;
	    if(oneNodeW < dotSize*2 + dotMargin) {
		oneNodeW = dotSize*2 + dotMargin;
		marg = dotMargin;
	    } else {
		marg = oneNodeW - dotSize*2;
	    }

	    var y = l * layerH + topMarg + dotSize;

	    for(var n = 0; n < noofNodes; n++) {
		var x = n * oneNodeW + leftMarg + dotSize;
		var act = networkActivations[l][n];

		col = activationToCol(act, maxAct);
		fill = activationToFill(act, maxAct);

    		ctx.save();
    		ctx.beginPath();
    		ctx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
    		ctx.fillStyle = fill;
    		ctx.fill();
    		ctx.lineWidth = 1;
    		ctx.strokeStyle = col;
    		ctx.stroke();
    		ctx.restore();
	    }
	}
    };

    function activation(val) {
	// var e2x = Math.exp(-2 * val);
	// var res = (1 + e2x) / (1 - e2x);
	
	var res = (1 / (1 + Math.exp(-val))) * 2 - 1;

	// debugLog("activation(" + val + ") -> " + res);
	
	return res;
    }
    
    function activationToCol(act, maxAct) {
	var prop = 1;

	if(maxAct != 0) {
	    prop = Math.abs(act / maxAct);
	}


	var ls = [];

    	var colors = $scope.gimme("GroupColors");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}
    	if(colors.hasOwnProperty('groups')) {
    	    var groupCols = colors.groups;
		
    	    for(var g in groupCols) {
    		if(g > 0 && groupCols.hasOwnProperty(g)) {
    		    if(groupCols[g].hasOwnProperty('color')) {
			ls.push([g, groupCols[g].color]);
		    }
		}
	    }
	}
	
	ls.sort(function(a,b){return (a[0] - b[0]);});

	if(ls.length > 1) {
	    if(act > 0) {
		// use ls[0][1]
		return hexColorToRGBAprop(ls[0][1], prop, transparency);
	    } else {
		// use ls[1][1]
		return hexColorToRGBAprop(ls[1][1], prop, transparency);
	    }
	} else if(ls.length > 0) {
	    // use ls[0][1] for both positive and negative
	    return hexColorToRGBAprop(ls[0][1], prop, transparency);
	} else {
	    // use greyscale
	    return hexColorToRGBAprop("#FFFFFF", prop, transparency);
	}
	
	return "black";
    }
    
    function activationToFill(act, maxAct) {
	var prop = 1;

	if(maxAct != 0) {
	    prop = Math.abs(act / maxAct);
	}


	var ls = [];

    	var colors = $scope.gimme("GroupColors");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}
    	if(colors.hasOwnProperty('groups')) {
    	    var groupCols = colors.groups;
		
    	    for(var g in groupCols) {
    		if(g > 0 && groupCols.hasOwnProperty(g)) {
    		    if(groupCols[g].hasOwnProperty('color')) {
			ls.push([g, groupCols[g].color]);
		    }
		}
	    }
	}
	
	ls.sort(function(a,b){return (a[0] - b[0]);});

	if(ls.length > 1) {
	    if(act > 0) {
		// use ls[0][1]
		return hexColorToRGBAprop(ls[0][1], prop, 1);//transparency);
	    } else {
		// use ls[1][1]
		return hexColorToRGBAprop(ls[1][1], prop, 1);//transparency);
	    }
	} else if(ls.length > 0) {
	    // use ls[0][1] for both positive and negative
	    return hexColorToRGBAprop(ls[0][1], prop, 1);//transparency);
	} else {
	    // use greyscale
	    return hexColorToRGBAprop("#FFFFFF", prop, 1);//transparency);
	}
	
	return "black";
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

    	var colors = $scope.gimme("GroupColors");
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
    	    var colors = $scope.gimme("GroupColors");
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
	for(var sel = 0; sel < selections.length; sel++) {
	    var s = selections[sel];
	    s[4] = val2pixelX(s[0]);
	    s[5] = val2pixelX(s[1]);
	    s[6] = val2pixelY(s[2]);
	    s[7] = val2pixelY(s[3]);
	}
	// debugLog("updateSize updated selections to: " + JSON.stringify(selections));

	updateGraphics();
    };

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {

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
    	case "DotSize":
	    var newVal = parseInt($scope.gimme("DotSize"));
	    if(newVal < 1) {
		newVal = 1;
	    } 
	    if(newVal != dotSize) {
		dotSize = newVal;
    		updateGraphics();
	    }
    	    break;
    	case "DotMargin":
	    var newVal = parseInt($scope.gimme("DotMargin"));
	    if(newVal < 1) {
		newVal = 1;
	    } 
	    if(newVal != dotMargin) {
		dotMargin = newVal;
    		updateGraphics();
	    }
    	    break;
    	case "LayerMargin":
	    var newVal = parseInt($scope.gimme("LayerMargin"));
	    if(newVal < 1) {
		newVal = 1;
	    } 
	    if(newVal != layerMargin) {
		layerMargin = newVal;
    		updateGraphics();
	    }
    	    break;
    	case "LineWidth":
	    var newVal = parseInt($scope.gimme("LineWidth"));
	    if(newVal < 1) {
		newVal = 1;
	    } 
	    if(newVal != lineWidth) {
		lineWidth = newVal;
    		updateGraphics();
	    }
    	    break;
    	case "Transparency":
	    var newVal = parseFloat($scope.gimme("Transparency"));
	    if(newVal < 0) {
		newVal = 0;
	    } 
	    if(newVal > 1) {
		newVal = 1;
	    }
	    if(newVal != transparency) {
		transparency = newVal;
    		updateGraphics();
	    }
    	    break;
    	case "GroupColors":
	    colorPalette = null;
	    parseSelectionColors();
    	    updateGraphics();
	    drawSelections();
    	    break;

    	case "Input":
	    var newVal = $scope.gimme("Input");
	    if(newVal != inputValues && newVal instanceof Array) {
		inputValues = newVal;
    		updateGraphics();
	    } else {
		$scope.set("Input", inputValues);
	    }
    	    break;
    	case "Network":
	    var newVal = $scope.gimme("Network");
	    if(newVal != networkLayout) {
		networkLayout = newVal;
    		updateGraphics();
	    }
    	    break;

    	};
    };



    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(x1,x2, y1,y2, keepOld) {
	// debugLog("newSelection");

	// debugLog("newSelection " + x1 + " " + x2 + " " + y1 + " " + y2 + " " + keepOld);

	// if(unique > 0) {
	//     x1 = Math.max(x1, leftMarg + leftShift);
	//     x2 = Math.min(x2, leftMarg + leftShift + drawW);

	//     y1 = Math.max(y1, topMarg + topShift);
	//     y2 = Math.min(y2, topMarg + topShift + drawH);
	    
	//     var newSel = [pixel2valX(x1), pixel2valX(x2), pixel2valY(y2), pixel2valY(y1), // y1 and y2 need to be switched here, because we flip the y axis
	// 		  x1,x2,y1,y2];
	//     // debugLog("newSel: " + JSON.stringify(newSel));
	    
	//     var overlap = false;
	//     for(var s = 0; s < selections.length; s++) {
	// 	var sel = selections[s];
	// 	if(sel[4] == newSel[4]
	// 	   && sel[5] == newSel[5]
	// 	   && sel[6] == newSel[6]
	// 	   && sel[7] == newSel[7]) {
	// 	    // debugLog("Ignoring selection because it overlaps 100% with already existing selection");
	// 	    overlap = true;
	// 	    break;
	// 	}
	//     }

	//     if(!overlap) {
	// 	if(!keepOld) {
	// 	    selections = [];
	// 	}
	// 	selections.push(newSel);
	// 	drawSelections();
	// 	updateLocalSelections(false);
	// 	saveSelectionsInSlot();
	//     }
	// }
    };

    function selectAll() {
	// if(unique <= 0) {
	//     selections = [];
	// } else {
	//     selections = [[limits.minX, limits.maxX, limits.minY, limits.maxY, leftMarg + leftShift, leftMarg + leftShift + drawW, topMarg + topShift, topMarg + topShift + drawH]];
	// }
	// drawSelections();
	// updateLocalSelections(true);
	// saveSelectionsInSlot();
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

    function hexColorToRGBAprop(color, prop, alpha) {
	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = Math.floor(prop * parseInt(color.substr(1,2), 16));
	    var g = Math.floor(prop * parseInt(color.substr(3,2), 16));
	    var b = Math.floor(prop * parseInt(color.substr(5,2), 16));

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

	for(sel = 0; sel < selections.length; sel++) {
	    selectionCtx.fillStyle = selectionColors.grad;	    
	    selectionCtx.fillRect(selections[sel][4], selections[sel][6], selections[sel][5] - selections[sel][4], selections[sel][7] - selections[sel][6]);

	    selectionCtx.fillStyle = selectionColors.border;
	    selectionCtx.fillRect(selections[sel][4],   selections[sel][6], 1, selections[sel][7]-selections[sel][6]);
	    selectionCtx.fillRect(selections[sel][4],   selections[sel][6], selections[sel][5] - selections[sel][4], 1);
	    selectionCtx.fillRect(selections[sel][4],   selections[sel][7]-1, selections[sel][5] - selections[sel][4], 1);
	    selectionCtx.fillRect(selections[sel][5]-1, selections[sel][6], 1, selections[sel][7]-selections[sel][6]);
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
	// if(pos.x > leftMarg - 5
	//    && pos.x <= leftMarg + leftShift*2 + drawW + 5
	//    && pos.y > topMarg - 5
	//    && pos.y <= topMarg + topShift*2 + drawH + 5) {
	//     return true;
	// }
	return false;
    };

    var onMouseMove = function(e){
	// if(unique > 0) {
        //     var currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	//     // hover text

	//     if(hoverText === null) {
    	// 	var elmnt = $scope.theView.parent().find('#mouseOverText');
    	// 	if(elmnt.length > 0) {
    	// 	    hoverText = elmnt[0];
    	// 	} else {
    	// 	    debugLog("No hover text!");
    	// 	}
	//     }

	//     if(hoverText !== null) {
	// 	if(mousePosIsInSelectableArea(currentMouse)) {
	// 	    var x = pixel2valX(currentMouse.x);
	// 	    var y = pixel2valY(currentMouse.y);

		    
	// 	    var s = "[" + x + "," + y + "]";

	// 	    var textW = getTextWidthCurrentFont(s);
	// 	    hoverText.style.font = fontSize + "px Arial";
	// 	    hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
	// 	    hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
	// 	    hoverText.innerHTML = s;
	// 	    hoverText.style.display = "block";
	// 	} else {
	// 	    hoverText.style.display = "none";
	// 	}
	//     }

	//     // selection rectangle, if clicked
	    
	//     if(clickStart !== null) {
	// 	if(selectionRect === null) {
    	// 	    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    	// 	    if(selectionRectElement.length > 0) {
    	// 		selectionRect = selectionRectElement[0];
    	// 	    } else {
    	// 		debugLog("No selection rectangle!");
    	// 	    }
	// 	}
	// 	if(selectionRect !== null) {
	// 	    var x1 = currentMouse.x;
	// 	    var w = 1;
	// 	    if(clickStart.x < x1) {
	// 		x1 = clickStart.x;
	// 		w = currentMouse.x - x1;
	// 	    } else {
	// 		w = clickStart.x - x1;
	// 	    }

	// 	    var y1 = currentMouse.y;
	// 	    var h = 1;
	// 	    if(clickStart.y < y1) {
	// 		y1 = clickStart.y;
	// 		h = currentMouse.y - y1;
	// 	    } else {
	// 		h = clickStart.y - y1;
	// 	    }
		    
	// 	    var selectionRectCtx = selectionRect.getContext("2d");
	// 	    selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);
		    
	// 	    if(selectionColors === null) {
	// 		parseSelectionColors();
	// 	    }

	// 	    selectionRectCtx.fillStyle = selectionColors.color;
	// 	    selectionRectCtx.fillRect(x1, y1, w, h);
	// 	    selectionRectCtx.save();
    	// 	    selectionRectCtx.strokeStyle = selectionColors.border;
    	// 	    selectionRectCtx.strokeRect(x1, y1, w, h);
	// 	    selectionRectCtx.restore();
	// 	}
	//     }
	// }
    };

    var onMouseDown = function(e){
	// if(unique > 0) {
        //     if(e.which === 1){
	// 	currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
	// 	if(mousePosIsInSelectableArea(currentMouse)) {
	// 	    clickStart = currentMouse;
	// 	    if(e.ctrlKey) {
	// 		clickStart.ctrl = true;
	// 	    } else {
	// 		clickStart.ctrl = false;
	// 	    }

	// 	    selectionHolderElement.bind('mouseup', onMouseUp);
	// 	    e.stopPropagation();
	// 	} else {
	// 	    clickStart = null;
	// 	}
        //     }
	// }
    };

    var onMouseUp = function(e){
	// if(unique > 0) {
        //     selectionHolderElement.unbind('mouseup');
            
	//     // check new selection rectangle

	//     if(clickStart !== null) {
	// 	hideSelectionRect();
		
	// 	currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	// 	var x1 = currentMouse.x;
	// 	var x2 = clickStart.x;
	// 	if(x2 < x1) {
	// 	    x1 = clickStart.x;
	// 	    x2 = currentMouse.x;
	// 	} 
		
	// 	var y1 = currentMouse.y;
	// 	var y2 = clickStart.y;
	// 	if(y2 < y1) {
	// 	    y1 = clickStart.y;
	// 	    y2 = currentMouse.y;
	// 	} 
		
	// 	if(x1 == x2 && y1 == y2) {
	// 	    // selection is too small, disregard
	// 	    // debugLog("ignoring a selection because it is too small");
	// 	} else {
	// 	    newSelection(x1,x2, y1,y2, clickStart.ctrl);
	// 	}
	//     }
	// }	
	// clickStart = null;
    };

    var onMouseOut = function(e) {
	// if(unique > 0) {
	//     if(hoverText === null) {
    	// 	var elmnt = $scope.theView.parent().find('#mouseOverText');
    	// 	if(elmnt.length > 0) {
    	// 	    hoverText = elmnt[0];
    	// 	} else {
    	// 	    debugLog("No hover text!");
    	// 	}
	//     }
	//     if(hoverText !== null) {
	// 	hoverText.style.display = "none";
	//     }


	//     if(clickStart !== null) {
	// 	hideSelectionRect();

	// 	currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	// 	var x1 = currentMouse.x;
	// 	var x2 = clickStart.x;
	// 	if(x2 < x1) {
	// 	    x1 = clickStart.x;
	// 	    x2 = currentMouse.x;
	// 	} 
		
	// 	var y1 = currentMouse.y;
	// 	var y2 = clickStart.y;
	// 	if(y2 < y1) {
	// 	    y1 = clickStart.y;
	// 	    y2 = currentMouse.y;
	// 	} 
		
	// 	if(x1 == x2 && y1 == y2) {
	// 	    // selection is too small, disregard
	// 	    // debugLog("ignoring a selection because it is too small");
	// 	} else {
	// 	    newSelection(x1,x2, y1,y2, clickStart.ctrl);
	// 	}
	//     }
	// }	
	// clickStart = null;
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
				dotSize,
				"Dot Size",
				'The size (in pixels) of the dots in the plot.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('LineWidth',
			lineWidth,
				"Line Width",
				'The width (in pixels) of the lines in the plot.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('Transparency',
				transparency,
				"Transparency",
				'The transparency, from 0 to 1, of the plots (if many items overlap, setting transparency closer to 0 may make it clearer).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('DotMargin',
				dotMargin,
				"Dot Margin",
				'The margin between nodes.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('LayerMargin',
				layerMargin,
				"Layer Margin",
				'The margin between layers.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


        // Dashboard Plugin slots -----------------------------------------------------------


        $scope.addSlot(new Slot('Network',
				[ // list of layers
				    [ // list of nodes in layer
					[{"n":0, "w":0.1}, {"n":3, "w":0.7}, {"n":5, "w":0.3}],
					[{"n":2, "w":0.8}, {"n":1, "w":0.5}, {"n":4, "w":0.1}],
					[{"n":1, "w":0.9}, {"n":2, "w":0.7}, {"n":3, "w":0.6}],
					[{"n":0, "w":0.8}, {"n":4, "w":0.1}, {"n":5, "w":0.7}],
					[{"n":3, "w":0.9}, {"n":4, "w":0.7}, {"n":5, "w":0.7}],
					[{"n":2, "w":0.2}, {"n":3, "w":0.9}, {"n":4, "w":0.3}]
				    ],
				    [ // list of nodes in layer
					[{"n":0, "w":0.1}, {"n":1, "w":0.3}],
					[{"n":0, "w":0.8}, {"n":1, "w":0.1}],
					[{"n":0, "w":0.9}, {"n":1, "w":0.6}],
					[{"n":0, "w":0.8}, {"n":1, "w":0.7}],
					[{"n":0, "w":0.9}, {"n":1, "w":0.7}],
					[{"n":0, "w":0.2}, {"n":1, "w":0.3}]
				    ],
				    [[], []]
				],
				"Network",
				'The Neural Net to visualize.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	
        $scope.addSlot(new Slot('Input',
				[0.91,0.9,0.3,0.4,0.3,0.8],
				"Input",
				'The input for the Neural Net to respond to.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        // // colors of groups of data, and the background color theme
        $scope.addSlot(new Slot('GroupColors',
				{"skin":{"color":"#8FBC8F", "border":"#8FBC8F", "gradient":[{"pos":0, "color":"#E9F2E9"}, {"pos":0.75, "color":"#8FBC8F"}, {"pos":1, "color":"#8FBC8F"}]}, 
				 "selection":{"color":"#FFA500", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFEDCC"}, {"pos":1, "color":"#FFA500"}]}, 
				 "groups":{0:{"color":"#A9A9A9", "gradient":[{"pos":0, "color":"#EEEEEE"}, {"pos":0.75, "color":"#A9A9A9"}]},
					   1:{"color":"#7FFF00", "gradient":[{"pos":0, "color":"#E5FFCC"}, {"pos":0.75, "color":"#7FFF00"}]},
					   2:{"color":"#8A2BE2", "gradient":[{"pos":0, "color":"#E8D5F9"}, {"pos":0.75, "color":"#8A2BE2"}]},
					   3:{"color":"#0000FF", "gradient":[{"pos":0, "color":"#CCCCFF"}, {"pos":0.75, "color":"#0000FF"}]},
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



        $scope.setDefaultSlot('');

	myInstanceId = $scope.getInstanceId();

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	networkLayout = $scope.gimme("Network");
	inputValues = $scope.gimme("Input");

	updateSize();
	updateGraphics();

	selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
	if(selectionHolderElement !== null){
	    selectionHolderElement.bind('mousedown', onMouseDown);
	    selectionHolderElement.bind('mousemove', onMouseMove);
	    selectionHolderElement.bind('mouseout', onMouseOut);
	} else {
	    debugLog("No selectionHolderElement, could not bind mouse listeners");
	}
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

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
