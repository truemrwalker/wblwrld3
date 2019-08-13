//======================================================================================================================
// Controllers for Digital Dashboard Plugin  Neural Network Activation Visualization for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
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

	$scope.displayText = "Neural Network Activation Visualization";
	$scope.dataSetName = "";
	var preDebugMsg = "Digital Dashboard Neural Network Activation Visualization: ";

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

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
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
				}
				else {
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
		}
	}
	//===================================================================================


	//===================================================================================
	// On Files Added
	// This event handler manages file drops.
	//===================================================================================
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
	//===================================================================================



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
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
		}
		else {
			//$log.log(preDebugMsg + "no canvas to draw on!");
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

		// colors of groups of data, and the background color theme
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

		networkLayout = $scope.gimme("Network");
		inputValues = $scope.gimme("Input");

		updateSize();
		updateGraphics();
	};
	//===================================================================================


	//===================================================================================
	// Parse File
	// This method parses the file.
	//===================================================================================
	function parseFile(contents) {
		try {
			if(typeof contents === 'string') {
				contents = JSON.parse(contents);
				$scope.set("Network", contents);
				return;
			}
		} catch (e) { }
	}
	//===================================================================================


	//===================================================================================
	// Save Selections in Slot
	// This method saves the selection into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		var result = {};
		result.selections = [];
		for(var sel = 0; sel < selections.length; sel++) {
			result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1], 'minY':selections[sel][2], 'maxY':selections[sel][3]});
		}

		internalSelectionsInternallySetTo = result;
		$scope.set('InternalSelections', result);
	}
	//===================================================================================


	//===================================================================================
	// Set Selections From a Slot
	// This method sets the selections based on the value in a slot.
	//===================================================================================
	function setSelectionsFromSlotValue() {
		// $log.log(preDebugMsg + "setSelectionsFromSlotValue");
		var slotSelections = $scope.gimme("InternalSelections");
		if(typeof slotSelections === 'string') {
			slotSelections = JSON.parse(slotSelections);
		}

		if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
			// $log.log(preDebugMsg + "setSelectionsFromSlotValue got identical value");
			return;
		}
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Check Selections After New Data
	// This method checks the validity of the selection after new data have been added.
	//===================================================================================
	function checkSelectionsAfterNewData() {
		// $log.log(preDebugMsg + "checkSelectionsAfterNewData");
		return true;
	};
	//===================================================================================

	//===================================================================================
	// Update Graphics
	// This method updates the graphics.
	//===================================================================================
	function updateGraphics() {
		// $log.log(preDebugMsg + "updateGraphics()");
		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
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

		// $log.log(preDebugMsg + "Clear the canvas");
		ctx.clearRect(0,0, W,H);

		drawBackground(W, H);
		drawNetwork(W, H);
		drawSelections();
	}
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background based on the specified width and height.
	//===================================================================================
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
					}
					else {
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
	}
	//===================================================================================


	//===================================================================================
	// Update Size
	// This method updates the size.
	//===================================================================================
	function updateSize() {
		// $log.log(preDebugMsg + "updateSize");
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
			}
			else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		myCanvas.width = rw;
		myCanvas.height = rh;

		if(selectionCanvas === null) {
			var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
			if(selectionCanvasElement.length > 0) {
				selectionCanvas = selectionCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no selectionCanvas to resize!");
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
		// $log.log(preDebugMsg + "updateSize found selections: " + JSON.stringify(selections));
		// $log.log(preDebugMsg + "updateSize updated selections to: " + JSON.stringify(selections));

		updateGraphics();
	}
	//===================================================================================


	//===================================================================================
	// Parse Selection Colors
	// This method selects parses the selection colors.
	//===================================================================================
	function parseSelectionColors() {
		// $log.log(preDebugMsg + "parseSelectionColors");
		var colors = $scope.gimme("GroupColors");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		selectionColors = {};

		if(colors.hasOwnProperty('selection')) {
			if(colors['selection'].hasOwnProperty('border')) {
				selectionColors.border = colors['selection']['border'];
			}
			else {
				selectionColors.border = '#FFA500'; // orange
			}

			if(colors['selection'].hasOwnProperty('color')) {
				selectionColors.color = localHexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = localHexColorToRGBA('#FFA500', selectionTransparency); // orange
			}

			if(colors['selection'].hasOwnProperty('gradient')) {
				if(selectionCanvas === null || selectionCtx === null) {
					var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
					if(selectionCanvasElement.length > 0) {
						selectionCanvas = selectionCanvasElement[0];
						selectionCtx = selectionCanvas.getContext("2d");
					}
					else {
						//$log.log(preDebugMsg + "no selectionCanvas to resize!");
						return;
					}
				}

				selectionColors.grad = selectionCtx.createLinearGradient(0, 0, selectionCanvas.width, selectionCanvas.height);
				var atLeastOneAdded = false;
				for(var p = 0; p < colors['selection']['gradient'].length; p++) {
					if(colors['selection']['gradient'][p].hasOwnProperty('pos')
						&& colors['selection']['gradient'][p].hasOwnProperty('color')) {
						selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], localHexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
						atLeastOneAdded = true;
					}
				}
				if(!atLeastOneAdded) {
					selectionColors.grad = selectionColors.color;
				}
			}
			else {
				selectionColors.grad = selectionColors.color;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Selections
	// This method draws the selections.
	//===================================================================================
	function drawSelections() {
		if(selectionCanvas === null) {
			var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
			if(selectionCanvasElement.length > 0) {
				selectionCanvas = selectionCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw selections on!");
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
	}
	//===================================================================================


	//===================================================================================
	// Hide Selection Rectangle
	// This method hides the selection rectangle the user created.
	//===================================================================================
	function hideSelectionRect() {
		if(selectionRect === null) {
			var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
			if(selectionRectElement.length > 0) {
				selectionRect = selectionRectElement[0];
			}
			else {
				//$log.log(preDebugMsg + "No selection rectangle!");
			}
		}
		if(selectionRect !== null) {
			selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
		}
	}
	//===================================================================================


	//===================================================================================
	// Latitude to Y
	// This method converts a latitude value to an Y value for the display.
	//===================================================================================
	function latToY(lat) {
		var a = lat * 0.017453292519943295;
		return 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
	}
	//===================================================================================


	//===================================================================================
	// Draw Network
	// This method draws the neural network.
	//===================================================================================
	function drawNetwork(W, H) {
		// $log.log(preDebugMsg + "draw!");
		if(networkLayout.length < 1) {
			//$log.log(preDebugMsg + "No network to draw");
			return;
		}

		if(inputValues.length != networkLayout[0].length) {
			//$log.log(preDebugMsg + "input length not same as size of first network layer");
			return;
		}

		var col;
		var fill;
		var zeroTransp = 0.33;
		if(transparency < 1) {
			zeroTransp *= transparency;
		}
		var col = localHexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors"))), zeroTransp);
		var fill = legacyDDSupLib.getGradientColorForGroup(0, 0,0,W,H, zeroTransp, myCanvas, ctx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, ((typeof $scope.gimme("GroupColors") === 'string') ? JSON.parse($scope.gimme("GroupColors")):$scope.gimme("GroupColors")));
		var noofLayers = networkLayout.length;
		var layerH = Math.floor((drawH - 2*dotSize) / (noofLayers - 1));
		var lMarg = layerMargin;
		if(layerH < dotSize + layerMargin) {
			layerH = dotSize + layerMargin;
		}
		else {
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
				}
				else {
					networkActivations[l].push(0);
				}
			}

			if(l > 0) {
				for(var n = 0; n < networkLayout[l-1].length; n++) {
					var edges = networkLayout[l-1][n];
					for(var e = 0; e < edges.length; e++) {
						networkActivations[l][edges[e].n] += edges[e].w * networkActivations[l-1][n];
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
			// $log.log(preDebugMsg + "Layer " + l + " maxAct " + maxAct);
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
			}
			else {
				marg = oneNodeW - dotSize*2;
			}

			var oneNodeW2 = Math.floor((drawW - 2*dotSize) / (noofNodes2 - 1));
			var marg2 = dotMargin;
			if(oneNodeW2 < dotSize*2 + dotMargin) {
				oneNodeW2 = dotSize*2 + dotMargin;
				marg2 = dotMargin;
			}
			else {
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
			}
			else {
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
	}
	//===================================================================================


	//===================================================================================
	// Activation
	// This method calculates a result from a specific value for activation.
	//===================================================================================
	function activation(val) {
		var res = (1 / (1 + Math.exp(-val))) * 2 - 1;
		// $log.log(preDebugMsg + "activation(" + val + ") -> " + res);
		return res;
	}
	//===================================================================================


	//===================================================================================
	// Activation to Column
	// This method takes an activation and returns a calculated color.
	//===================================================================================
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
				return localHexColorToRGBAprop(ls[0][1], prop, transparency);
			}
			else {
				// use ls[1][1]
				return localHexColorToRGBAprop(ls[1][1], prop, transparency);
			}
		}
		else if(ls.length > 0) {
			// use ls[0][1] for both positive and negative
			return localHexColorToRGBAprop(ls[0][1], prop, transparency);
		}
		else {
			// use greyscale
			return localHexColorToRGBAprop("#FFFFFF", prop, transparency);
		}

		return "black";
	}
	//===================================================================================


	//===================================================================================
	// Activation to Fill
	// This method takes an activation and return a color for fill.
	//===================================================================================
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
				return localHexColorToRGBAprop(ls[0][1], prop, 1);//transparency);
			}
			else {
				// use ls[1][1]
				return localHexColorToRGBAprop(ls[1][1], prop, 1);//transparency);
			}
		}
		else if(ls.length > 0) {
			// use ls[0][1] for both positive and negative
			return localHexColorToRGBAprop(ls[0][1], prop, 1);//transparency);
		}
		else {
			// use greyscale
			return localHexColorToRGBAprop("#FFFFFF", prop, 1);//transparency);
		}

		return "black";
	}
	//===================================================================================


	//===================================================================================
	// Local Hex Color To RGBA
	// This method converts a hex color to a RGBA value.
	// Using a local version of the method for this Webble only instead of the library
	// version.
	//===================================================================================
	function localHexColorToRGBA(color, alpha) {
		if(typeof color === 'string'
			&& color.length == 7) {

			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);

			return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
		}
		return color;
	}
	//===================================================================================


	//===================================================================================
	// Local Hex Color To RGBA Property
	// This method converts a hex color to a RGBA value using a specified property value.
	// Using a local version of the method for this Webble only, instead of the library
	// version.
	//===================================================================================
	function localHexColorToRGBAprop(color, prop, alpha) {
		if(typeof color === 'string'
			&& color.length == 7) {

			var r = Math.floor(prop * parseInt(color.substr(1,2), 16));
			var g = Math.floor(prop * parseInt(color.substr(3,2), 16));
			var b = Math.floor(prop * parseInt(color.substr(5,2), 16));

			return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
		}
		return color;
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
