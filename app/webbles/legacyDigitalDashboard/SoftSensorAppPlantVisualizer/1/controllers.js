//======================================================================================================================
// Controllers for SoftSensorAppPlantVisualizer for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('plantVisualizerPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Plant Visualizer";
    $scope.plantName = "";

    var myInstanceId = -1;
    
    // graphics

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    
    var hoverText = null;
    var dotSize = 1;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    // layout
    var leftMarg = 10;
    var topMarg = 10;
    var rightMarg = 10;
    var bottomMarg = 10;
    var fontSize = 11;

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var clickStart = null;

    // data from parent
    
    var plant = [];
    var sensors = [];

    var drawH = 1;
    var drawW = 1;
    var W = 1;
    var H = 1;

    var internalSelectionsInternallySetTo = {};

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("SoftSensor Plant Visualizer: " + message);
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

    function saveSelectionsInSlot() {
	// debugLog("saveSelectionsInSlot");

	var result = {};
	for(var i = 0; i < sensors.length; i++) {
	    result[sensors[i][0]] = sensors[i][sensors[i].length - 1];
	}

	internalSelectionsInternallySetTo = result;
	$scope.set('SelectedSensors', result);
	$scope.set('SelectionsChanged', true);
    };

    function setSelectionsFromSlotValue() {
	// debugLog("setSelectionsFromSlotValue");

	var slotSelections = $scope.gimme("SelectedSensors");
	if(typeof slotSelections === 'string') {
	    slotSelections = JSON.parse(slotSelections);
	}

	var dirty = false;
	for(var sensorName in slotSelections) {
	    for(var i = 0; i < sensors.length; i++) {
		if(sensors[i][0] == sensorName) {
		    var idx = sensors[i].length - 1;
		    if(slotSelections[sensorName] != sensors[i][idx]) {
			dirty = true;
			sensors[i][idx] = !sensors[i][idx];
		    }
		}
	    }
	}
	
	if(dirty) {
	    updateGraphics();
	    saveSelectionsInSlot();
	}
    };

    function checkSelectionsAfterNewData() {
	// debugLog("checkSelectionsAfterNewData");

	setSelectionsFromSlotValue();
    };

    function resetVars() {
	$scope.plantName = "";

	plant = [];
	sensors = [];
    };

    function parseData() {
	// debugLog("parseData");

	resetVars();

	var newPlant = $scope.gimme("PlantLayout");
    	if(typeof newPlant === 'string') {
    	    newPlant = JSON.parse(newPlant);
    	}
	// do some sanity checking of input here
	plant = newPlant;

	var newSensors = $scope.gimme("Sensors");
    	if(typeof newSensors === 'string') {
    	    newSensors = JSON.parse(newSensors);
    	}
	for(var i = 0; i < newSensors.length; i++) {
	    newSensors[i].push(true);
	}
	// do some sanity checking of input here
	sensors = newSensors;
	
	updateGraphics();

	checkSelectionsAfterNewData();
	saveSelectionsInSlot();
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

    	W = myCanvas.width;
    	if(typeof W === 'string') {
    	    W = parseFloat(W);
    	}
    	if(W < 1) {
    	    W = 1;
    	}

    	H = myCanvas.height;
    	if(typeof H === 'string') {
    	    H = parseFloat(H);
    	}
    	if(H < 1) {
    	    H = 1;
    	}

	// debugLog("Clear the canvas");
	ctx.clearRect(0,0, W,H);
	drawW = W - leftMarg - rightMarg;
	drawH = H - topMarg - bottomMarg * 2 - fontSize;

    	drawBackground(W, H);
    	drawPlant();
	drawSensors();
    }; 

    function drawBackground(W,H) {
    	var colors = $scope.gimme("GroupColors");
    	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
    	}

    	if(colors.hasOwnProperty("skin")) {
    	    var drewBack = false
    	    if(colors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
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



    function drawPlant() {
	for(var i = 0; i < plant.length; i++) {
	    var item = plant[i];
	    
	    switch (item[0]) {
	    case "line":
		drawLine(item);
		break;
	    case "rectangle":
		drawRect(item);
		break;
	    case "ellipse":
		drawEllipse(item);
		break;
	    }
    	}
    };

    function drawEllipse(ellipse) {
	var x1 = leftMarg + ellipse[1] * drawW;
	var y1 = topMarg + ellipse[2] * drawH;
	var w = ellipse[3] * drawW;
	var h = ellipse[4] * drawH;
	
	var rx = w / 2;
	var ry = h / 2;
	var cx = x1 + rx;
	var cy = y1 + ry;

	ctx.lineWidth = 1;
	ctx.strokeStyle = "black";
	
	// ctx.save();
	// ctx.beginPath();
	// ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
	// ctx.stroke();
	// ctx.restore();

	ctx.save();
	ctx.beginPath();

        ctx.translate(cx-rx, cy-ry);
        ctx.scale(rx, ry);
        ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);

        ctx.restore(); // restore to original state
	ctx.stroke();
    }

    function drawRect(rect) {
	var x1 = leftMarg + rect[1] * drawW;
	var y1 = topMarg + rect[2] * drawH;
	var w = rect[3] * drawW;
	var h = rect[4] * drawH;

	ctx.save();
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = "black";
    	ctx.beginPath();
	ctx.moveTo(x1, y1);

	ctx.lineTo(x1+w, y1);
	ctx.lineTo(x1+w, y1+h);
	ctx.lineTo(x1, y1+h);
	ctx.lineTo(x1, y1);
	
    	ctx.stroke();

	ctx.restore();
    }

    function drawLine(line) {
	var x1 = leftMarg + line[1] * drawW;
	var y1 = topMarg + line[2] * drawH;

	ctx.save();
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = "black";
    	ctx.beginPath();
	ctx.moveTo(x1, y1);

	for(var i = 0; 4 + i*2 < line.length; i++) {
	    var x2 = leftMarg + line[3 + i*2] * drawW;
	    var y2 = topMarg + line[4 + i*2] * drawH;
	    
	    ctx.lineTo(x2, y2);

	    x1 = x2;
	    y1 = y2;
	}
    	ctx.stroke();

	ctx.restore();
    }

    function drawSensors() {
	dotSize = parseInt($scope.gimme('DotSize'));
	if(typeof dotSize !== 'number') {
	    try {
		dotSize = parseInt(dotSize);
	    } catch(e) {
		dotSize = 1;
	    }
	}
	if(dotSize < 1) {
	    dotSize = 1;
	}

	var fillOn = getGradientColorForGroup(0, 0,0,W,H, 0.33);
    	var colOn = hexColorToRGBA(getColorForGroup(0), 0.33);
	var fillOff = getGradientColorForGroup(0, 0,0,W,H, 0.33);
    	var colOff = hexColorToRGBA(getColorForGroup(0), 0.33);
	var col;
	var fill;

	for(var i = 0; i < sensors.length; i++) {
	    var sensor = sensors[i];

	    var s = sensor[0];

	    var x = leftMarg + sensor[1] * drawW;
	    var y = topMarg + sensor[2] * drawH;

	    if(sensor[sensor.length - 1]) { // selected
		if(!useGlobalGradients) {
		    fillOn = getGradientColorForGroup(1, x-dotSize,y-dotSize,x+dotSize,y+dotSize, 0.33);
		}
		fill = fillOn;
		col = colOn;
	    } else {
		if(!useGlobalGradients) {
		    fillOff = getGradientColorForGroup(0, x-dotSize,y-dotSize,x+dotSize,y+dotSize, 0.33);
		}
		fill = fillOff;
		col = colOff;
	    }
	    
	    ctx.beginPath();
	    ctx.arc(x, y, dotSize, 0, 2 * Math.PI, false);
	    ctx.fillStyle = fill;
	    ctx.fill();
	    ctx.lineWidth = 1;
	    ctx.strokeStyle = col;
	    ctx.stroke();

	    var textW = getTextWidthCurrentFont(s);
	    ctx.fillStyle = "black";
    	    ctx.font = fontSize + "px Arial";
    	    ctx.fillText(s, x - textW/2, y - dotSize);
    	}
    };

    function getGradientColorForGroup(group, x1,y1, x2,y2, alpha) {
    	if(useGlobalGradients) {
    	    if(myCanvas === null) {
    		var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    		if(myCanvasElement.length > 0) {
    		    myCanvas = myCanvasElement[0];
		}
	    }

    	    W = myCanvas.width;
    	    if(typeof W === 'string') {
    		W = parseFloat(W);
    	    }
    	    if(W < 1) {
    		W = 1;
    	    }

    	    H = myCanvas.height;
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
	
	var grads = [[{"pos":0, "color":"#EEEEEE"}, {"pos":0.75, "color":"#A9A9A9"}], [{"pos":0, "color":"#E5FFCC"}, {"pos":0.75, "color":"#7FFF00"}]];
	
    	if(x1 != x2 || y1 != y2) {
    	    var OK = true;
	    
	    try {
    		var grd = ctx.createLinearGradient(x1,y1,x2,y2);
    		for(var i = 0; i < grads[group].length; i++) {
    		    var cc = grads[group][i];
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

	var cols = ["#A9A9A9", "#7FFF00"];
    	return cols[group];
    };

    function getColorForGroup(group) {
	var cols = ["#A9A9A9", "#7FFF00"];
    	return cols[group];
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
	
	W = selectionCanvas.width;
	H = selectionCanvas.height;
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
    };

    function mySlotChange(eventData) {
    	switch(eventData.slotName) {
	case "SelectedSensors":
	    if(eventData.slotValue != internalSelectionsInternallySetTo) {
		setSelectionsFromSlotValue();
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
    	    updateGraphics();
    	    break;
    	case "root:width":
	    updateSize();
    	    updateGraphics();
    	    break;
    	case "DotSize":
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

    	case "GroupColors":
	    colorPalette = null;
    	    updateGraphics();
    	    break;

	case "PlantLayout":
	    parseData();
	    break;
	case "Sensors":
	    parseData();
	    break;
	    
    	};
    };



    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function selectAll() {
	var dirty = false;
	for(var i = 0; i < sensors.length; i++) {
	    var idx = sensors[i].length - 1;
	    if(!sensors[i][idx]) {
		dirty = true;
	    }
	    sensors[i][idx] = true;
	}
	
	if(dirty) {
	    updateGraphics();
	}
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

    function closestSensor(x, y) {
	if(sensors.length <= 0) {
	    return -1;
	}
	
	var best = 0;
	var dx = (x - (leftMarg + sensors[0][1] * drawW));
	var dy = (y - (topMarg + sensors[0][2] * drawH));
	var bestDist = dx*dx + dy*dy;

	for(var i = 0; i < sensors.length; i++) {
	    dx = (x - (leftMarg + sensors[i][1] * drawW));
	    dy = (y - (topMarg + sensors[i][2] * drawH));
	    var dist = dx*dx + dy*dy;

	    if(dist < bestDist) {
		best = i;
		bestDist = dist;
	    }
	}
	return best;
    }

    var onMouseMove = function(e){
	if(sensors.length > 0) {
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

	    var alreadyDone = false;
	    if(hoverText !== null) {
		if(mousePosIsInSelectableArea(currentMouse)) {
		    var sen = closestSensor(currentMouse.x, currentMouse.y);
		    
		    if(sen >= 0) {
			var dx = (currentMouse.x - (leftMarg + sensors[sen][1] * drawW));
			var dy = (currentMouse.y - (topMarg + sensors[sen][2] * drawH));
			var bestDist = Math.sqrt(dx*dx + dy*dy);

			if(clickStart !== null) {
			    if(bestDist < dotSize + 1 && clickedSensor != sen) {
				var s = "[" + sensors[clickedSensor][0] + " --> " + sensors[sen][0] + "]";
				var textW = getTextWidthCurrentFont(s);
				hoverText.style.font = fontSize + "px Arial";
				hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
				hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
				hoverText.innerHTML = s;
				hoverText.style.display = "block";
				alreadyDone = true;
			    } else {
				var s = sensors[clickedSensor][0];
				var textW = getTextWidthCurrentFont(s);
				hoverText.style.font = fontSize + "px Arial";
				hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
				hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
				hoverText.innerHTML = s;
				hoverText.style.display = "block";
				alreadyDone = true;
			    }
			} else {
			    if(bestDist < dotSize + 3) {
				var s = "[" + sensors[sen][0] + "]";
				var textW = getTextWidthCurrentFont(s);
				hoverText.style.font = fontSize + "px Arial";
				hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
				hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
				hoverText.innerHTML = s;
				hoverText.style.display = "block";
				alreadyDone = true;
			    } else {
				hoverText.style.display = "none";
				alreadyDone = true;
			    }
			}
		    }
		}

		if(!alreadyDone) {
		    if(clickStart !== null) {
			var s = sensors[clickedSensor][0];
			var textW = getTextWidthCurrentFont(s);
			hoverText.style.font = fontSize + "px Arial";
			hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
			hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
			hoverText.innerHTML = s;
			hoverText.style.display = "block";
			alreadyDone = true;
		    }
		}
	    }
	}
    };

    var clickedSensor = -1;
    
    var onMouseDown = function(e){
	if(sensors.length > 0) {
            if(e.which === 1){
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
		if(mousePosIsInSelectableArea(currentMouse)) {

		    var sen = closestSensor(currentMouse.x, currentMouse.y);
		    
		    if(sen >= 0) {
			var dx = (currentMouse.x - (leftMarg + sensors[sen][1] * drawW));
			var dy = (currentMouse.y - (topMarg + sensors[sen][2] * drawH));
			var bestDist = Math.sqrt(dx*dx + dy*dy);
			
			if(bestDist < dotSize + 1) {
			    clickedSensor = sen;

			    // sensors[sen][sensors[sen].length - 1] = !sensors[sen][sensors[sen].length - 1];
			    // updateGraphics();
			    // saveSelectionsInSlot();
			}
			    
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
			clickedSensor = -1;
		    }
		} else {
		    clickStart = null;
		    clickedSensor = -1;
		}
            }
	}
    };

    var onMouseUp = function(e){
        selectionHolderElement.unbind('mouseup');
            
	// check new selection rectangle

	if(clickStart !== null) {
	    currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	    if(mousePosIsInSelectableArea(currentMouse)) {

		var sen = closestSensor(currentMouse.x, currentMouse.y);
		
		if(sen >= 0) {
		    var dx = (currentMouse.x - (leftMarg + sensors[sen][1] * drawW));
		    var dy = (currentMouse.y - (topMarg + sensors[sen][2] * drawH));
		    var bestDist = Math.sqrt(dx*dx + dy*dy);
		    
		    if(bestDist < dotSize + 1) {
			releasedSensor = sen;
			
			if(clickedSensor == releasedSensor
			   && clickedSensor >= 0) {
			    sensors[sen][sensors[sen].length - 1] = !sensors[sen][sensors[sen].length - 1];
			    updateGraphics();
			    saveSelectionsInSlot();
			}
			if(clickedSensor != releasedSensor
			   && clickedSensor >= 0
			   && releasedSensor >= 0) {
			    $scope.set("DroppedSensors", [sensors[clickedSensor][0], sensors[releasedSensor][0]]);
			    $scope.set("DroppedSensorsChanged", true);
			}
		    }
		}
	    }
	}
	clickStart = null;
	clickedSensor = -1;
    };

    var onMouseOut = function(e) {
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
	    // hideSelectionRect();

	    // currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	    // var x1 = currentMouse.x;
	    // var x2 = clickStart.x;
	    // if(x2 < x1) {
	    // 	x1 = clickStart.x;
	    // 	x2 = currentMouse.x;
	    // } 
	    
	    // var y1 = currentMouse.y;
	    // var y2 = clickStart.y;
	    // if(y2 < y1) {
	    // 	y1 = clickStart.y;
	    // 	y2 = currentMouse.y;
	    // } 
	    
	    // if(x1 == x2 && y1 == y2) {
	    // 	// selection is too small, disregard
	    // 	// debugLog("ignoring a selection because it is too small");
	    // } else {
	    // 	newSelection(x1,x2, y1,y2, clickStart.ctrl);
	    // }
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

        $scope.addSlot(new Slot('SelectedSensors',
				{},
				"Selected Sensors",
				'Slot to save the internal state of what is selected.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('SelectionsChanged',
				false,
				"Selections Changed",
				'Slot to indicate that the internal state of what is selected changed.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('DroppedSensors',
				[],
				"Dropped Sensors",
				'Slot to save if any sensor has been dropped on another.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	
        $scope.addSlot(new Slot('DroppedSensorsChanged',
				false,
				"Dropped Sensors Changed",
				'Flag to tell if the previous slot changed.',
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

        $scope.addSlot(new Slot('DotSize',
				5,
				"DotSize",
				'The size (in pixels) of the dots in the plot.',
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


        $scope.addSlot(new Slot('PlantLayout',
				[["line", 0, 0, 1,1]],
				'Plant Layout',
				'Vector graphics showing the plant layout.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));

        $scope.addSlot(new Slot('Sensors',
				[["Sensor 1", 0.05, 0.1]],
				'Sensors',
				'Locations and names of sensors that the user can click on.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));


        // Dashboard Plugin slots -----------------------------------------------------------

        $scope.addSlot(new Slot('PluginName',
				"Plant Visualizer",
				'Plugin Name',
				'The name to display in menus etc.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));


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


        $scope.setDefaultSlot('');

	myInstanceId = $scope.getInstanceId();

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	parseData();
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
