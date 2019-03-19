//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('imageSetWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };
    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    var dispText = "Image Set";
    $scope.displayText = "Image Set";

    // $scope.tellParent = {}; // the wblEventInfo.slotChanged does not seem to work properly, so we make our own version instead...

    var myInstanceId = -1;

    var idSlotName = "TheIdSlot";
    var internalIdSlotSet = false;
    var oldIdSlotData = [];

    var fullyLoaded = false;

    var fileName = "";

    var fieldNames = [];
    var fieldTypes = [];
    var noofRows = 0;

    var fontSize = 11;
    var textColor = "black";

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionHolderElement = null;


    var imageSets = {};
    var selections = [false, false];

    var mode = "abs";

    //=== EVENT HANDLERS ================================================================

    var onMouseDown = function(e){
	if(e.which === 1){
	    debugLog("mouse Clicked");
	    currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
	    
	    var ctrl = false;
	    if(e.ctrlKey || e.metaKey) {
		ctrl = true;
	    }

	    var shift = false;
	    if(e.shiftKey) {
		shift = true;
	    }

	    var clicked = false;
	    for(var name in imageSets) {
		if(currentMouse.x >= imageSets[name].x1
		   && currentMouse.x <= imageSets[name].x2
		   && currentMouse.y >= imageSets[name].y1
		   && currentMouse.y <= imageSets[name].y2) {

		    for(var i = 0; i < imageSets[name].v.length; i++) {
			if(currentMouse.x >= imageSets[name].v[i].x1
			   && currentMouse.x <= imageSets[name].v[i].x2
			   && currentMouse.y >= imageSets[name].v[i].y1
			   && currentMouse.y <= imageSets[name].v[i].y2) {

			    clicked = {"name":name, "idx":i};
			    break;
			}
		    }
		}
		if(clicked) {
		    break;
		}
	    }

	    if(clicked) {
		e.stopPropagation();

		if(shift) {
		    
		    // delete if generated image
		    if(imageSets[clicked.name].v[clicked.idx].generated) {

			var check = imageSets[clicked.name].v[clicked.idx].mode + " " + clicked.name + " " + imageSets[clicked.name].v[clicked.idx].idx1 + " - " + imageSets[clicked.name].v[clicked.idx].idx2;

			imageSets[clicked.name].v.splice(clicked.idx, 1);

			delete alreadyAdded[check];

			updateView();
		    }

		} else {

		    var selIdx = 0;
		    if(ctrl) {
			selIdx = 1;
		    }

		    selections[selIdx] = clicked;

		    var have0 = false;
		    if(selections[0]) {
			if(imageSets.hasOwnProperty(selections[0].name)
			   && selections[0].idx < imageSets[selections[0].name].v.length) {
			    have0 = true;
			}
		    }

		    var have1 = false;
		    if(selections[1]) {
			if(imageSets.hasOwnProperty(selections[1].name)
			   && selections[1].idx < imageSets[selections[1].name].v.length) {
			    have1 = true;
			}
		    }

		    if(have0 && have1 && selections[0].name == selections[1].name && selections[0].idx != selections[1].idx) {
			addNewImage(selections[0].name, selections[0].idx, selections[1].idx);
		    }
		}

		drawSelections();
	    }
	}
    }


    $scope.onFilesAdded = function(files) {
        if(files !== undefined && files.length > 0) {
	    for(var i = 0; i < files.length; i++) {
		var f = files[i];
		
		var reader = new FileReader();
		reader.fileName = f.name;

		// Closure to capture the file information.
		reader.onload = function(e) {
		    var image = new Image();
		    image.title = e.target.fileName;
		    image.src = e.target.result;

		    var n = fileNameToLex(image.title);
		    n.image = image;

		    n.generated = false;
		    n.mode = "file";

		    if(imageSets.hasOwnProperty(n.name)) {
			imageSets[n.name].v.push(n);
		    } else {
			imageSets[n.name] = {"v":[n]};
		    }

		    updateView()
		};
		
		// Read in the image file as a data URL
		reader.readAsDataURL(f);
	    }
	}
	
    };

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard Image Set: " + message);
	}
    };

    function drawSelections() {
	debugLog("drawSelections");

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

	var have0 = false;
	if(selections[0]) {
	    if(imageSets.hasOwnProperty(selections[0].name)
	       && selections[0].idx < imageSets[selections[0].name].v.length) {
		selectionCtx.fillStyle = "#00FF00";
		
		var x1 = imageSets[selections[0].name].v[selections[0].idx].x1;
		var x2 = imageSets[selections[0].name].v[selections[0].idx].x2;
		var y1 = imageSets[selections[0].name].v[selections[0].idx].y1;
		var y2 = imageSets[selections[0].name].v[selections[0].idx].y2;		

		selectionCtx.fillRect(x1-1, y1-1, x2 - x1 + 2, 1);
		selectionCtx.fillRect(x1-1, y2+1, x2 - x1 + 2, 1);
		selectionCtx.fillRect(x1-1, y1-1, 1, y2-y1 + 2);
		selectionCtx.fillRect(x2+1, y1-1, 1, y2-y1 + 2);

		have0 = true;
	    }
	}

	var have1 = false;
	if(selections[1]) {
	    if(imageSets.hasOwnProperty(selections[1].name)
	       && selections[1].idx < imageSets[selections[1].name].v.length) {
		selectionCtx.fillStyle = "#FF0000";
		
		var x1 = imageSets[selections[1].name].v[selections[1].idx].x1;
		var x2 = imageSets[selections[1].name].v[selections[1].idx].x2;
		var y1 = imageSets[selections[1].name].v[selections[1].idx].y1;
		var y2 = imageSets[selections[1].name].v[selections[1].idx].y2;		

		selectionCtx.fillRect(x1-1, y1-1, x2 - x1 + 2, 1);
		selectionCtx.fillRect(x1-1, y2+1, x2 - x1 + 2, 1);
		selectionCtx.fillRect(x1-1, y1-1, 1, y2-y1 + 2);
		selectionCtx.fillRect(x2+1, y1-1, 1, y2-y1 + 2);

		have1 = true;
	    }
	}
    }

    var alreadyAdded = {};

    function addNewImage(name, idx1, idx2) {
	var check = mode + " " + name + " " + idx1 + " - " + idx2;
	if(alreadyAdded.hasOwnProperty(check)) {
	    return;
	} else {
	    alreadyAdded[check] = true;
	}
	
	var im1 = imageSets[name].v[idx1];
	var im2 = imageSets[name].v[idx2];

	var w1 = im1.image.width;
	var w2 = im2.image.width;
	var h1 = im1.image.height;
	var h2 = im2.image.height;
	
	if(w1 != w2 
	   || h1 != h2) {
	    debugLog("Warning: image dimensions are not the same (" + w1 + "," + h1 + ") and (" + w2 + "," + h2 + ")");
	}

	var w = Math.min(im1.image.width, im2.image.width);
	var h = Math.min(im1.image.height, im2.image.height);

	var imData1 = ctx.getImageData(im1.x1, im1.y1, w, h);
	var pixels1 = imData1.data;

	var imData2 = ctx.getImageData(im2.x1, im2.y1, w, h);
	var pixels2 = imData2.data;

	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = w;
	tempCanvas.height = h;
	var tempCtx = tempCanvas.getContext('2d');
	var imDataTemp = tempCtx.getImageData(0, 0, w, h);
	var pixelsTemp = imDataTemp.data;

	var minR = 0;
	var minG = 0;
	var minB = 0;
	var maxR = 0;
	var maxG = 0;
	var maxB = 0;
	var isColor = false;

	if(mode == "minmax"
	   || mode == "hotcold") {

	    var first = true;

	    for(var ww = 0; ww < w; ww++) {
		for(var hh = 0; hh < h; hh++) {
		    var offset = (hh * w + ww) * 4
		    var r = pixels1[offset] - pixels2[offset];
		    var g = pixels1[offset+1] - pixels2[offset+1];
		    var b = pixels1[offset+2] - pixels2[offset+2];

		    if(r != g
		       || g != b
		       || b != r) {
			isColor = true;
		    }

		    if(first) {
			first = false;
			minR = r;
			minG = g;
			minB = b;
			maxR = r;
			maxG = g;
			maxB = b;
		    } else {
			minR = Math.min(minR, r);
			minG = Math.min(minG, g);
			minB = Math.min(minB, b);
			maxR = Math.max(maxR, r);
			maxG = Math.max(maxG, g);
			maxB = Math.max(maxB, b);
		    }
		}
	    }
	}

	for(var ww = 0; ww < w; ww++) {
	    for(var hh = 0; hh < h; hh++) {
		var offset = (hh * w + ww) * 4
		var r = pixels1[offset] - pixels2[offset];
		var g = pixels1[offset+1] - pixels2[offset+1];
		var b = pixels1[offset+2] - pixels2[offset+2];
		// var a = pixels1[offset+3] - pixels2[offset+3];

		if(mode == "abs") {
		    r = Math.abs(r);
		    g = Math.abs(g);
		    b = Math.abs(b);
		} else if(mode == "sub") {
		    r = Math.max(0, Math.min(255, (r + 255) / 2));
		    g = Math.max(0, Math.min(255, (g + 255) / 2));
		    b = Math.max(0, Math.min(255, (b + 255) / 2));
		} else if(mode == "hotcold") {
		    if(isColor) {
			debugLog("WARNING: 'hotcold' mode cannot be used with color images. Using 'minmax' instead.");
			r = Math.max(0, Math.min(255, (r - minR) / (maxR - minR) * 255));
			g = Math.max(0, Math.min(255, (g - minG) / (maxG - minG) * 255));
			b = Math.max(0, Math.min(255, (b - minB) / (maxB - minB) * 255));
		    } else {
			if(r < 0) {
			    r = 0;
			    g = 0;
			    b = Math.abs(b);
			} else {
			    r = r;
			    g = 0;
			    b = 0;
			}
		    }
		} else if(mode == "minmax") {
		    r = Math.max(0, Math.min(255, (r - minR) / (maxR - minR) * 255));
		    g = Math.max(0, Math.min(255, (g - minG) / (maxG - minG) * 255));
		    b = Math.max(0, Math.min(255, (b - minB) / (maxB - minB) * 255));
		} else {
		    r = Math.max(0, Math.min(255, (r + 255) / 2));
		    g = Math.max(0, Math.min(255, (g + 255) / 2));
		    b = Math.max(0, Math.min(255, (b + 255) / 2));
		}
		
		pixelsTemp[offset] = r;
		pixelsTemp[offset+1] = g;
		pixelsTemp[offset+2] = b;
		pixelsTemp[offset+3] = 255;
	    }
	}

	tempCtx.putImageData(imDataTemp, 0, 0);

	var newIm = new Image(w, h);
	newIm.src = tempCanvas.toDataURL('image/png');

	var newProps = [];
	for(var p = 0; p < imageSets[name].v[idx1].props.length; p++) {
	    newProps.push(imageSets[name].v[idx1].props[p]);
	}
	newProps.push("FilterWith_" + mode);
	for(var p = 0; p < imageSets[name].v[idx2].props.length; p++) {
	    newProps.push(imageSets[name].v[idx2].props[p]);
	}

	imageSets[name].v.push({"image":newIm, "props":newProps, "generated":true, "mode":mode, "idx1":idx1, "idx2":idx2});
	updateView();
    }

    function fileNameToLex(fname) {
	// strip file extension

	var lastPeriod = fname.lastIndexOf(".");
	var n = fname;
	if(lastPeriod > 0) {
	    n = fname.substr(0, lastPeriod);
	}

	// see if we find some separator that seems promising

	var separators = ["-", ".", " ", "_"];

	var bestSep = "";
	var bestCount = 0;

	for(var s = 0; s < separators.length; s++) {
	    // var exp = "/[" + separators[s] + "]/g";

	    // var hits = n.match(exp);
	    // if(hits && hits.length > bestCount) {
	    // 	bestSep = separators[s];
	    // 	bestCount = hits.length;
	    // }
	    
	    var hits = 0;
	    var lastIdx = -1;
	    
	    var nextIdx = n.indexOf(separators[s], lastIdx+1);
	    while(nextIdx >= 0) {
		lastIdx = nextIdx;
		hits++;

		nextIdx = n.indexOf(separators[s], lastIdx+1);
	    }
	    if(hits > bestCount) {
	    	bestSep = separators[s];
	    	bestCount = hits;
	    }
	}

	// assume first field is name, rest are properties
	if(bestCount > 0) {
	    var v = n.split(bestSep);
	    var name = v[0];
	    var props = v.splice(1, v.length - 1);
	} else {
	    var name = n;
	    var props = [];
	}

	return {"name":name, "props":props};
    }


    function updateView() {
	debugLog("updateView");

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

	var resize = checkNeededSize();

	if(!resize) {
	    debugLog("actually draw");

	    if(ctx) {
		ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
	    }

	    drawBackground();

	    drawImages();

	    drawSelections();
	} else {
	    debugLog("resize, wait");
	}
    }

    function getTextWidth(text) {
    	if(ctx !== null && ctx !== undefined) {
    	    ctx.font = fontSize + "px Arial";
    	    var metrics = ctx.measureText(text);
    	    return metrics.width;
    	}
    	return 0;
    }


    function checkNeededSize() {
	var w = 20;
	var h = 15;

	for(var name in imageSets) {
	    var hh = 0;
	    var ww = -5 + getTextWidth(name);
	    
	    for(var i = 0; i < imageSets[name].v.length; i++) {
		var im  = imageSets[name].v[i].image;
		ww += 5 + Math.max(im.width, getTextWidth(imageSets[name].v[i].props.join(".")));
		hh = Math.max(hh, im.height + fontSize);
	    }

	    h += 5 + hh;
	    w = Math.max(w, ww + 10*2);
	}

    	var currentW = $scope.gimme("DrawingArea:width");
    	if(typeof currentW === 'string') {
	    currentW = currentW.replace("px", "");
    	    currentW = parseFloat(currentW);
    	}

    	var currentH = $scope.gimme("DrawingArea:height");
    	if(typeof currentH === 'string') {
	    currentH = currentH.replace("px", "");
    	    currentH = parseFloat(currentH);
    	}

	var resize = false;
    	if(w > currentW || w < currentW - 10 - 100) {
    	    $scope.set("DrawingArea:width", w + 10);
	    resize = true;
    	}

    	if(h > currentH || h < currentH - 10 - 30) {
    	    $scope.set("DrawingArea:height", h + 10);
	    resize = true;
    	}

	return resize;
    }

    function drawImages() {
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

    	ctx.fillStyle = textColor;
    	ctx.font = fontSize + "px Arial";

	var h = 10;
	for(var name in imageSets) {
	    var w = 10;
	    var hh = 0;

	    ctx.fillText(name, w, h + fontSize);
	    w += Math.ceil(getTextWidth(name) + 5);

	    imageSets[name].x1 = w;
	    imageSets[name].x2 = w;
	    imageSets[name].y1 = h;
	    imageSets[name].y2 = h;

	    for(var i = 0; i < imageSets[name].v.length; i++) {

		var im  = imageSets[name].v[i].image;
		
		ctx.drawImage(im, w, h);
		
		ctx.fillText(imageSets[name].v[i].props.join("."), w, h + fontSize + im.height);
		
		imageSets[name].v[i].x1 = w;
		imageSets[name].v[i].x2 = w + im.width;
		imageSets[name].v[i].y1 = h;
		imageSets[name].v[i].y2 = h + im.height;

		imageSets[name].x2 = Math.max(w + im.width, imageSets[name].x2);
		imageSets[name].y2 = Math.max(h + im.height, imageSets[name].y2);

		w += 5 + Math.ceil(Math.max(im.width, getTextWidth(imageSets[name].v[i].props.join("."))));

		hh = Math.ceil(Math.max(hh, im.height + fontSize));
	    }

	    h += Math.ceil(5 + hh);
	}
    }

    function drawDataInfo(text) {
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

    	ctx.fillStyle = textColor;
    	ctx.font = fontSize + "px Arial";

	for(var i = 0; i < text.length; i++) {
    	    ctx.fillText(text[i], 5, 5 + fontSize + i*fontSize);
	}
    }

    function drawBackground() {
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

	    if(colors.skin.hasOwnProperty("text")) {
		textColor = colors.skin.text;
	    } else {
		textColor = "black";
	    }

    	}
    }

    $scope.saveAllGenerated = function() {
	debugLog("Save All Files clicked");

	filesToSave = [];

	for(var name in imageSets) {
	    for(var i = 0; i < imageSets[name].v.length; i++) {
	
		if(imageSets[name].v[i].generated) {

		    var im  = imageSets[name].v[i].image;

		    var fileName = name + "." + imageSets[name].v[i].props.join(".") + ".png";
		    
		    filesToSave.push({"filename":fileName, "url":im.src});
		}
	    }
	}

	if(filesToSave.length > 0) {
	    downloadFiles();
	}
    };

    var filesToSave = [];
    function downloadFiles() {
	function downloadNext(i) {
            if(i >= filesToSave.length) {
		return;
            }
	    
            var a = document.createElement('a');
            // a.href = filesToSave[i].download;
            a.href = filesToSave[i].url;

            a.target = '_parent';
            // Use a.download if available, it prevents plugins from opening.
            if ('download' in a) {
		a.download = filesToSave[i].filename;
            }
            // Add a to the doc for click to work.
            (document.body || document.documentElement).appendChild(a);
            if (a.click) {
		a.click(); // The click method is supported by most browsers.
            } else {
		$(a).click(); // Backup using jquery
            }
            // Delete the temporary link.
            a.parentNode.removeChild(a);
            // Download the next file with a small timeout. The timeout is necessary
            // for IE, which will otherwise only download the first file.
            setTimeout(function () { downloadNext(i + 1); }, 500);
	}
	// Initiate the first download.
	downloadNext(0);
    }

    function mySlotChange(eventData) {
    	//debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

	if(eventData.slotName == idSlotName) {
	    // this is not allowed unless it is a set from the parseData() function
	    if(!internalIdSlotSet) {
		$scope.set(idSlotName, oldIdSlotData);
	    }		
	} else {
    	    switch(eventData.slotName) {
    	    case "Data":
    		// parseData();
    		break;
    		// case "DataTypes":
    		// 	parseData();
    		// 	break;
    		// case "DataNames":
    		// 	parseData();
    		// 	break;

	    case "ManipulationMode":
		mode = eventData.slotValue;
		break;

    	    case "PluginName":
		var newVal = eventData.slotValue;
		$scope.displayText = newVal;
		// debugLog("updated displayText to '" + newVal + "'");

		// $scope.tellParent['PluginName'] = true;
    		break;

    	    case "GroupColors":
		colorPalette = null;
    		updateView();
    		break;
    	    case "FontSize":
		fontSize = parseInt($scope.gimme("FontSize"));
		if(fontSize < 5) {
		    fontSize = 5;
		}
		updateView();
    		break;
    	    case "DrawingArea:height":
		debugLog("DrawingArea:height slotSet");
		updateView();
    		break;
    	    case "DrawingArea:width":
		debugLog("DrawingArea:width slotSet");
		updateView();
    		break;
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


	$scope.addSlot(new Slot('PluginName',
				"Image Set", 
				'Plugin Name',
				'The name to display in menus etc.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));

	$scope.addSlot(new Slot('PluginType',
				"DataSource",
				"Plugin Type",
				'The type of plugin this is. Should always be "DataSource".',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	// $scope.addSlot(new Slot('Data',
	// 			[],
	// 			'Data',
	// 			'The data.',
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

        $scope.addSlot(new Slot('ManipulationMode',
				mode,
				"Manipulation Mode",
				'The way images are combined. "abs" = new image which is the absolute value of the pixelwise difference. "sub" = subtract image 2 from image 2, scale the resulting intensity back to [0, 255]. "hotcold", differences in one direction shown in red, differences in the other direction in blue. "minmax", subtract and scale resulting intensity to [0, 255] and stretching the intensity as much as possible.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

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

	$scope.addSlot(new Slot('ProvidedFormat',
				{},
				'Provided Format',
				'A JSON description of what data the Webble provides (generated automatically from the CSV).',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
	
	// $scope.addSlot(new Slot('DataTypes',
	// 			"number,number,number;",
	// 			'Data Types',
	// 			'Description of the CSV data (generated from data).',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,                                 
	// 			undefined
	// 		       ));
	
	// $scope.addSlot(new Slot('DataNames',
	// 			"FirstField,Field2,Last;",
	// 			'Data Names',
	// 			'Description of the CSV data (generated from data).',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,                                 
	// 			undefined
	// 		       ));

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


	// $scope.theView.parent().draggable('option', 'cancel', '#fieldsToDrag');
	// $scope.theView.parent().draggable('option', 'cancel', '#fieldsToDrag2');
	// $scope.theView.parent().draggable('option', 'cancel', 'fieldsToDrag');
	// $scope.theView.parent().draggable('option', 'cancel', 'fieldsToDrag2');

	// hack to restore status of any slots that were saved but
	// lost their state settings
	var slotDict = $scope.getSlots();
	if(slotDict.hasOwnProperty(idSlotName)) {
	    $scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	}
	for(var slotName in slotDict) {
	    if(slotName.substring(0, 8) == "DataSlot") {
		$scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	    }
	}


	myInstanceId = $scope.getInstanceId();

	selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
	if(selectionHolderElement !== null){
	    selectionHolderElement.bind('mousedown', onMouseDown);
	    // selectionHolderElement.bind('mousemove', onMouseMove);
	    // selectionHolderElement.bind('mouseout', onMouseOut);
	} else {
	    debugLog("No selectionHolderElement, could not bind mouse listeners");
	}

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
	    if(eventData.targetId == myInstanceId) {
		// debugLog("I was loaded");
		fullyLoaded = true;
		updateView();
		// parseData();
	    }
	}); // check when we get loaded (fully loaded)

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
