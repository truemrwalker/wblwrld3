//======================================================================================================================
// Controllers for NeuralNetworkInput for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('neuralNetworkInputWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Neural Network Input";
    $scope.dataSetName = "";

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var myInstanceId = -1;

    var marg = 10;
    var spacing = 2;
    
    // graphics
    var input = [];

    var dataBase = [];
    var selectedIdx = -1;
    var selectedName = "";

    //=== EVENT HANDLERS ================================================================

    $scope.onFilesAdded = function(files) {
        if(files !== undefined && files.length > 0) {
	    var f = files[0];

	    var reader = new FileReader();
	    
	    // Closure to capture the file information.
	    reader.onload = function(e) {
		var contents = e.target.result.replace(/[\r\n]+/g, "\n");
		parseFile(contents, f.name);
	    };
	    
	    $scope.dataSetName = f.name;
	    reader.readAsText(f);
	}
	
    };

    var onMouseDown = function(e){
	if(dataBase.length > 0) {
            if(e.which === 1){
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
		e.stopPropagation();

		var idx = Math.floor((currentMouse.y - 2*marg) / (spacing + fontSize) - 1);
		if(idx >= 0 && idx < dataBase.length) {
		    var y1 = marg*2 + (idx + 1) * (spacing + fontSize);
		    var y2 = y1 + fontSize;

		    if(currentMouse.y >= y1 && currentMouse.y <= y2) {
			selectedIdx = idx;
			selectedName = dataBase[idx][0];
			$scope.set("InputVector", dataBase[selectedIdx][1]);
		    }
		}
		
            }
	}
    };



    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("Neural Network Input: " + message);
	}
    }

    function parseFile(contents, fileName) {
	try {
	    if(typeof contents === 'string') {
		contents = JSON.parse(contents);
		dataBase = contents;
		checkData();
		// $scope.set("InputVector", contents);
		// updateSize();
		return;
	    }
	} catch (e) {

	}
	
	if(contents instanceof Array) { // from slot set of "FileContents"
	    dataBase = contents;
	    checkData();
	    return;
	}


	var p = 0;
	
	var lex = {" ":0, ",":0, "\t":0, "\n":0, ";":0};
	var best = "\n";
	var bestn = 0;
	
        while (p < contents.length) {
	    if(lex.hasOwnProperty(contents[p])) {
		lex[contents[p]] += 1;
		
		if(lex[contents[p]] > bestn) {
		    bestn = lex[contents[p]];
		    best = contents[p];
		}
	    }
	    p++;
	}

	dataBase = [];

	p1 = 0;
	p2 = p1+1;
	
	var firstRow = true;

        while (p2 < contents.length) {
	    if(contents[p2] == "\n" || p2 == contents.length - 1) {
		if(p2 == contents.length - 1 && contents[p2] != "\n") {
		    p2++; // include last character too
		}
                var thisRow = contents.substr(p1, p2 - p1);
		
                var items = thisRow.split(best);
		var name = items[0];
		var vals = [];
		for(var i = 1; i < items.length; i++) {
		    var val = parseFloat(items[i]);

		    if(val !== null && val !== undefined && !isNaN(val)) {
			vals.push(val);
		    }
		}

		var data = [name, vals];
		if(vals.length > 0) {
		    dataBase.push(data);
		}
		
		firstRow = false;
		
		while(contents[p2] == "\n") {
		    p2++;
		}
		p1 = p2;
		p2 = p1 + 1;
	    } else {
		p2++;
	    }
	}
	
	$scope.set("FileContents", dataBase);
	$scope.dataSetName = fileName;
	
	checkData();

	// var v = contents.split(best);
	// var res = [];
	// for(var i = 0; i < v.length; i++) {
	//     var val = parseFloat(v[i]);
	//     if(val !== null && val !== undefined && !isNaN(val)) {
	// 	res.push(val);
	//     }
	// }
	// input = res;
	// $scope.set("InputVector", res);
	// updateSize();
    }

    function checkData() {
	var foundSelection = false;
	for(var i = 0; i < dataBase.length; i++) {
	    if(dataBase[i].length != 2) {
		dataBase = [];
		break;
	    }
	    if(dataBase[i][0] == selectedName) {
		selectedIdx = i;
		foundSelection = true;
		$scope.set("InputVector", dataBase[selectedIdx][1]);
	    }
	}

	if(!foundSelection) {
	    selectedIdx = -1;
	}

	updateSize();
    }
    
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
	
	var W = myCanvas.width;
	var H = myCanvas.height;

	if((dataBase.length + 1) * (spacing + fontSize) + 3*marg > H) {
    	    $scope.set("DrawingArea:height", Math.ceil((dataBase.length + 1) * (spacing + fontSize) + 3*marg));
	    H = Math.ceil((dataBase.length + 1) * (spacing + fontSize) + 3*marg);
	}

	drawW = W;
	drawH = H;


	drawBackground(W,H);

	var iv = $scope.gimme("InputVector");
	var t = "";
	if(iv.length <= 0 && dataBase.length <= 0) {
	    t = "No data";
	} else {
	    t = dataBase.length.toString() + " vectors. " + iv.length.toString() + " data items in selected vector.";
	}

	var maxTW = 0;
	
	ctx.font = fontSize + "px Arial";
	ctx.fillStyle = "black";

	var tw = getTextWidthCurrentFont(t);
	if(tw > maxTW) {
	    maxTW = tw;
	}

	var x = 0;
	if(tw < drawW) {
	    Math.floor(x = (drawW - tw) / 2);
	}
	var y = marg;
	// if(fontSize * (rows+1) < drawH) {
	//     y = Math.floor(drawH - fontSize * (rows+1)) / 2;
	// }

	ctx.fillText(t, x, y + fontSize);

	for(var i = 0; i < dataBase.length; i++) {
	    t = dataBase[i][0];

	    if(i == selectedIdx) {
		ctx.font = "bold " + fontSize + "px Arial";
		ctx.fillStyle = "red";
	    }

	    var tw = getTextWidthCurrentFont(t);
	    if(tw > maxTW) {
		maxTW = tw;
	    }

	    var x = marg;
	    var y = marg*2 + (i + 1) * (spacing + fontSize);

	    ctx.fillText(t, x, y + fontSize);

	    if(i == selectedIdx) {
		ctx.font = fontSize + "px Arial";
		ctx.fillStyle = "black";
	    }
	}

	if(maxTW + 2*marg > W) {
    	    $scope.set("DrawingArea:width", Math.ceil(maxTW + 2*marg));
	}
    }
    
    function getTextWidthCurrentFont(text) {
	if(ctx !== null && ctx !== undefined) {
	    var metrics = ctx.measureText(text);
	    return metrics.width;
	}
	return 0;
    }

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {

    	case "FontSize":
	    updateSize();
    	    break;

    	case "FileContents":
	    $scope.dataSetName = "";
	    parseFile($scope.gimme("FileContents"));
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
    	case "GroupColors":
	    colorPalette = null;
	    updateSize();
    	    break;

    	case "InputVector":
	    var newVal = $scope.gimme("InputVector");
	    if(newVal != input) {
		input = newVal;
		updateSize();
	    }
    	    break;

    	};
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
	
        $scope.addSlot(new Slot('InputVector',
				[0.91,0.9,0.3,0.4,0.3,0.8],
				"Input Vector",
				'The input to send to the Neural Net.',
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

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

        $scope.addSlot(new Slot('FileContents',
				[["V1",[0.91,0.9,0.3,0.4,0.3,0.8]], ["Zeros", [0,0,0,0,0,0]], ["Ones", [1,1,1,1,1,1]], ["Half-Half", [0,0,0,1,1,1]]],
				"File Contents",
				'A list of vectors to select the input vector from.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.setDefaultSlot('');

	myInstanceId = $scope.getInstanceId();

	var selectionHolderElement = null; 
    	selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
	selectionHolderElement.bind('mousedown', onMouseDown);


	updateSize();
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
