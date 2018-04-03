//======================================================================================================================
// Controllers for 3D World Plus Container for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('threeDPlusCtrl', function($scope, $log, $timeout, Slot, Enum, isEmpty, isValidStyleValue, getKeyByValue, colorService) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        threeDPlusContainer: ['background-color', 'border', 'border-radius'],
        threeDPlusHolder: ['width', 'height', 'background-color', 'border', 'border-radius']
    };

    // JQuery Elements
    var threeDPlusContainer, threeDPlusHolder;
	var dropCanvas = null; //Drag & Drop of data fields
	var selectCanvas, selectCtx;
    var info;

    // Watches for specific non-webble value changes
	var watchingForPredefinedColorKeyChanges, watchingForColorKeyChanges, changeTime = 0, watchingForPredefinedGeoAreaChanges;

    // Basic Webble Proeprties
    var internalFilesPath;

	// Webble Menu and Interaction Balls
	$scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data Slot'}, {itemId: 'toggleInfoVisibility', itemTxt: 'Toggle Info Text Visibility (Showing)'}];
	$scope.customInteractionBalls = [{index: 4, name: 'clearData', tooltipTxt: 'Clear Data Slot'}];

	// three.js objects
	var scene, camera, renderer; //Main
	var light, lightAmb; //Lights
	var controls, clock, defaultControlSpeed = 10, camPosOrigin; //Camera controls
	var particles, dotsGeometry, axes, mapPlane; //Meshes & Geometries
	var mapPlaneColorTexture, mapPlaneDisplacementTexture; //Textures
	var shaderMaterial, uniforms; // Shaders & Materials
	var positions, colors, sizes, matrixLocations, mapCoordinates, dataValues;  //Point Particle information

	// Enumeration Definitions
	var CameraInteractionMode = { Fly: 0, Orbit: 1, Trackball: 2 }; //Available types of camera control modes
	var pixelColorBlending = { None: 0, Normal: 1, Additive: 2, Subtractive: 3, Multiply: 4};
	var availableTextures = {None: 0, Spark: 1, FadingCircle: 2, Cloud_1: 3, Cloud_2: 4, Smoke: 5};
	var predefinedColorSchemes = { None: 0, dBZ_Few: 1, dBZ_Many: 2, Tsunami_Flood: 3, Tsunami_Damage: 4};
	var colorMethodOptions = { GroupColAlphaMinMax: 0, GroupColAlphaHisto: 1, ColorKey: 2 };
	var droppedDataInfoTypes = { none: 0, only3D: 1, latlon3D: 2, latlonval: 3, latlonval3D: 4, latlonz: 5, latlonz3D: 6, latlonzval: 7, latlonzval3D: 8, val3D: 9, xy3D: 10, xyval: 11, xyval3D: 12, xyz: 13, xyz3D: 14, xyzval: 15, xyzval3D: 16 };
	var distributionTypes = {Linear: 0, Logarithmic: 1};
	var valueAffectAttributes = {None: 0, Size: 1, Opacity: 2, Both: 3};

	// Mouse 3D-world Interaction
	var raycaster, intersects, INTERSECTED;
	var mouse, mouse_click, isMouseClicked = false, intersectedMemory = new Array( 5 ), intSecAreaMem = [];
	var isMouseDown = false, startMouseClickX = startMouseClickY = 0, currMouseMoveX = currMouseMoveY = 0, selectionAreaData = [];
	var SELECT_COLOR = [1.0, 1.0, 0.0, 1.0];

	// data drop zone properties
	var dropVal = {'left':0, 'top':0, 'right':300, 'bottom':250, "forMapping":{'name':'Values', 'type':['number']}, "label":"Values", "rotate":false};
	var drop3D = {'left':0, 'top':300, 'right':300, 'bottom':500, "forMapping":{'name':'3D', 'type':['3Darray']}, "label":"3D data", "rotate":false};
	var dropZ = {'left':300, 'top':0, 'right':400, 'bottom':500, "forMapping":{'name':'Z', 'type':['number']}, "label":"Z coordinates", "rotate":true};
	var dropY = {'left':400, 'top':0, 'right':500, 'bottom':500, "forMapping":{'name':'Y', 'type':['latitude','number']}, "label":"Y Coordinates", "rotate":true};
	var dropX = {'left':500, 'top':0, 'right':600, 'bottom':500, "forMapping":{'name':'X', 'type':['longitude','number']}, "label":"X coordinates", "rotate":true};
	var allDropZones = [dropVal, drop3D, dropZ, dropY, dropX];

	// Color schemes and chroma gradients series for displaying data in various color variations and color grouping
	var colorMethod = colorMethodOptions.GroupColAlphaMinMax;
	var colorKey = [ "#73feff", "#38d5ff", "#0880ff", "#73fa79", "#39d142", "#3da642", "#248f01", "#0b4100", "#fffb01", "#fca942", "#f94c01", "#ac1942", "#ab28aa", "#d82da9", "#f985ff"];
	var colorScheme = {
		"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
		"selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
		"groups":{
			0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
			1:{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},
			2:{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},
			3:{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},
			4:{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},
			5:{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},
			6:{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},
			7:{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},
			8:{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},
			9:{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},
			10:{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},
			11:{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},
			12:{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},
			13:{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},
			14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}
		}
	};
	var groupColors = {}; // cache the colors above
	var predefinedColorKeySets = [   // Color Chroma series (for data value color hues)
		// Tohoku Tsunami flooding data colors
		[[0.058, 0.5, "#2892C7"], [0.501, 1.0, "#60A3B5"], [1.001, 1.5, "#8CB8A4"],   [1.501, 2.0, "#B1CC91"],   [2.001, 3.0, "#D7E37D"],   [3.001, 4.0, "#FAFA64"],   [4.001, 6.0, "#FFD64F"], [6.001, 8.0, "#FCA43F"],   [8.001, 10.0, "#F77A2D"],   [10.001, 12.0, "#F24D1F"],   [12.001, 15.0, "#E81014"],   [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; }),

		// Tohoku Tsunami structure damage data colors
		[[0.237, 8, "#2191CB"], [8.001, 16.0, "#74ABAD"], [16.001, 24, "#ACC993"],   [24.001, 32.0, "#E3EB75"],   [32.001, 40.0, "#FCDE56"],   [40.001, 48.0, "#FCA03D"],   [48.001, 56.0, "#F56325"], [56.001, 64.0, "#E81014"], [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; }),

		// JMA weather radar data
		[[-100, 0.01, "#00000000"], [0.01, 1, "#F2F2FF"], [1, 5, "#A0D2FF"], [5, 10, "#218CFF"], [10, 20, "#0041FF"], [20, 30, "#FAF500"], [30, 50, "#FF9900"], [50, 80, "#FF2800"], [80, 100000, "#B40068"]],

		// JMA weather radar colors (same colors as JMA radar data), no numeric limits, just colors
		["#F2F2FF", "#A0D2FF", "#218CFF", "#0041FF", "#FAF500", "#FF9900", "#FF2800", "#B40068"],

		// JMA weather radar colors - accumulated rainfall in mm (same colors as JMA radar data)
		[[0, 0.5, "#00000000"], [0.5, 10, "#F2F2FF"], [10, 20, "#A0D2FF"], [20, 50, "#218CFF"], [50, 100, "#0041FF"], [100, 200, "#FAF500"], [200, 300, "#FF9900"], [300, 400, "#FF2800"], [400, 100000, "#B40068"]],

		// JMA weather radar colors - snow depth in cm (same colors as JMA radar data)
		[[-1, 0, "#00000000"], [0.05, 0.1, "#F2F2FF"], [0.1, 5, "#A0D2FF"], [5, 20, "#218CFF"], [20, 50, "#0041FF"], [50, 100, "#FAF500"], [100, 150, "#FF9900"], [150, 200, "#FF2800"], [200, 100000, "#B40068"]],

		// JMA weather radar colors - temperature data
		[[-300, -15, "#002080"],[-15, -10, "#0041FF"],[-10, -5, "#0096FF"],[-5, 0, "#B9EBFF"],[0, 5, "#FFFFF0"],[5, 10, "#FFFF96"],[10, 15, "#FAF500"],[15, 20, "#FF9900"],[20, 25, "#FF2800"], [25, 6000, "#B40068"]],

		// JMA weather radar colors - wind speed data
		[[0, 5, "#F2F2FF"], [5, 10, "#0041FF"], [10, 15, "#FAF500"], [15, 20, "#FF9900"], [20, 25, "#FF2800"], [25, 3000, "#B6046A"]],

		// JMA weather radar colors - Sunlight
		[[0, 70, "#242450"], [70, 80, "#454A77"], [80, 90, "#CED2F3"], [90, 100, "#EEEEFF"], [100, 110, "#FFF0B4"], [110, 120, "#FFF000"], [120, 130, "#FF9900"], [130, 10000, "#FF1A1A"]],

		// JMA weather radar colors - comparative (%) (from rainfall image)
		[[0, 10, "#783705"], [10, 20, "#F5780F"], [20, 50, "#FFC846"], [50, 100, "#FFE5BF"], [100, 150, "#49F3D6"], [150, 250, "#1FCCAF"], [250, 400, "#009980"], [400, 10000, "#004D40"]],

		// NEXRAD colors
		["#73FEFF", "#38D5FF", "#0880FF", "#73FA79", "#39D142", "#3DA642", "#248F01", "#0B4100", "#FFFB01", "#FCA942", "#F94C01", "#AC1942", "#AB28AA", "#D82DA9", "#F985FF"],

		// NEXRAD scale (mm/hour)
		[[0, 0.07, "#00000000"], [0.07, 0.15, "#73FEFF"], [0.15, 0.32, "#38D5FF"], [0.32, 0.65, "#0880FF"], [0.65, 1.3, "#73FA79"], [1.3, 2.7, "#39D142"], [2.7, 5.6, "#3DA642"], [5.6, 12, "#248F01"], [12, 24, "#0B4100"], [24, 49, "#FFFB01"], [49, 100, "#FCA942"], [100, 205, "#F94C01"], [205, 421, "#AC1942"], [421, 865, "#AB28AA"], [865, 1776, "#D82DA9"], [1776, 1000000, "#F985FF"]],

		// WSI Radar colors
		["#72f842", "#39d000", "#2ba500", "#3da642", "#248f01", "#1d7600", "#0b4100", "#fffb01", "#fca942", "#fcaa7a", "#aa7942", "#f94c01", "#d81e00", "#ac1942", "#f952aa"],

		// WSI Radar (mm/hour)
		[[0, 0.07, "#00000000"], [0.07, 0.15, "#72f842"], [0.15, 0.32, "#39d000"], [0.32, 0.65, "#2ba500"], [0.65, 1.3, "#3da642"], [1.3, 2.7, "#248f01"], [2.7, 5.6, "#1d7600"], [5.6, 12, "#0b4100"], [12, 24, "#fffb01"], [24, 49, "#fca942"], [49, 100, "#fcaa7a"], [100, 205, "#aa7942"], [205, 421, "#f94c01"], [421, 865, "#d81e00"], [865, 1776, "#ac1942"], [1776, 1000000, "#f952aa"]],

		// NOAA dBZ scale for weather radar
		[[-30, -25, "#CCFDFF"], [-24.999, -20.0, "#CC99C6"], [-19.999, -15, "#99679B"],   [-14.999, -10.0, "#6B326F"],   [-9.999, -5.0, "#CCCB99"],   [-4.999, 0, "#989D64"],   [0.001, 5.0, "#636465"], [5.001, 10.0, "#02E9E7"], [10.001, 15.0, "#009EF2"], [15.001, 20.0, "#0702F2"], [20.001, 25.0, "#03FC03"], [25.001, 30.0, "#00C300"], [30.001, 35.0, "#008D00"], [35.001, 40.0, "#FBF904"], [40.001, 45.0, "#E4BB00"], [45.001, 50.0, "#FA9807"], [50.001, 55.0, "#FD0000"], [55.001, 60.0, "#CA0500"], [60.001, 65.0, "#BB0000"], [65.001, 70.0, "#F601FE"], [70.001, 75.0, "#9953C8"], [75.001, 100.0, "#FFFFFF"]],

		// Natural clouds
		[[-100, 0.01, '#00000000'], [0.01, 30, '#ffffff'], [30, 50, '#eeeeee'], [50, 80, '#43464c'], [80, 100000, '#111111']],

		// Natural Water
		[[0.0, 0.0095, "#FFFFFF00"], [0.237, 16.0, "#3ADEFF"], [16.001, 40.0, "#54A1FF"], [40.001, 64.0, "#3D3AFF"]],

		// Natural gas clouds in Space
		[[-10, 1, "#FFFFFF00"], [1.001, 30.0, "#3C202F22"], [30.001, 80.0, "#E27A79"], [80.001, 130.0, "#ECB888"], [130.001, 200.0, "#F75145"], [200.001, 1000.0, "#ffffff"]]
	];

	// 3D Data properties
	var droppedDataMappings = []; // to keep track of what has been dropped on us so far
	var droppedDataInfo = {type: "none"};
	var cubeNo = -1; // when we have more than one cube of 3D data but only render one, this is used to keep track of which one
	var centerPoint;
	var nullCounts3D = [];
	var nullCountsVals = 0;

	//??? OLD JSON 3D Points data
	var minValueThreshold = 0.1, maxValueThreshold = 0.9, thresholdRange = 0;

	// Geo map 3D space properties
	var meterPerThreeJSUnit = 10;
	var predefCoords;
	var defaultCoord = {"min": {"lat": 43.060657562278806, "lon": 141.35618090629578}, "max": {"lat": 43.061535504191355, "lon": 141.35668516159058}};

	// Various Webble control properties
	var myInstanceId = -1;
	var independentScaling = false; //If true, the scales of each axis will be set independently, otherwise they will use the same scaling (i.e. set this to false if the data on each axis has the same measuring unit, for example distances in meters).
	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;



    //=== EVENT HANDLERS ================================================================

    //===================================================================================
    // Mouse move event handler for within the 3D view
    //===================================================================================
    function on3DMouseMove( event ) {
		event.preventDefault();

		mouse.x = ( event.offsetX / renderer.domElement.width ) * 2 - 1;
		mouse.y = - ( event.offsetY / renderer.domElement.height ) * 2 + 1;

		// Enable controller again if it has been turned off
		if((!$scope.ctrlKeyIsDown || !$scope.altKeyIsDown) && !controls.enabled){ controls.enabled = true; }

		if(isMouseDown){
			if($scope.shiftKeyIsDown){
				currMouseMoveX = event.offsetX;
				currMouseMoveY = event.offsetY;
				selectionAreaData[1] = [mouse.x, mouse.y];
				selectCtx.clearRect(0,0,selectCanvas[0].width,selectCanvas[0].height);
				selectCtx.beginPath();
				selectCtx.rect(startMouseClickX, startMouseClickY, (currMouseMoveX - startMouseClickX), (currMouseMoveY - startMouseClickY));
				selectCtx.stroke();
			}

			if($scope.altKeyIsDown){
				selectCtx.clearRect(0,0,selectCanvas[0].width,selectCanvas[0].height);
				var point = [event.offsetX, event.offsetY];
				selectionAreaData.push(point);
				selectCtx.lineTo(point[0], point[1] );
				selectCtx.stroke();
			}
		}
    }
    //===================================================================================


    //===================================================================================
    // Mouse click event handler for within the 3D view
    // If CTRL key is held the normal 3D view behavor is ignored and instead the mouse
    // click position is stored.
    //===================================================================================
    function on3DMouseClick( event ) {
		if($scope.ctrlKeyIsDown){
			isMouseClicked = true;
			if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Fly){ event.stopImmediatePropagation(); }

			mouse_click.x =  ( event.offsetX / renderer.domElement.width ) * 2 - 1;
			mouse_click.y =  - ( event.offsetY / renderer.domElement.height ) * 2 + 1;

			selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);

			if($scope.shiftKeyIsDown || $scope.altKeyIsDown){
				isMouseDown = true;
				controls.enabled = false;
				selectCtx.strokeStyle = getColorContrast();
				selectCtx.setLineDash([6]);
				selectCtx.lineWidth = 3;
				selectCtx.globalAlpha=0.5

				if($scope.shiftKeyIsDown){
					startMouseClickX = event.offsetX;
					startMouseClickY = event.offsetY;
					selectionAreaData = [[mouse_click.x, mouse_click.y], [mouse_click.x, mouse_click.y]];
				}

				if($scope.altKeyIsDown){
					selectCtx.beginPath();
					selectCtx.moveTo(event.offsetX, event.offsetY);
					selectionAreaData = [[event.offsetX, event.offsetY]];
				}
			}
		}
    }
    //===================================================================================


	//===================================================================================
	// Mouse Up event handler for within the 3D view
	//===================================================================================
	function on3DMouseUp( event ) {
    	if(isMouseDown){
    		isMouseDown = false;
			selectCtx.closePath();

			if(particles){
				var distArr = [camera.position.distanceTo( centerPoint ), camera.position.distanceTo( particles.geometry.boundingBox.min ), camera.position.distanceTo( particles.geometry.boundingBox.max )];
				var minDist = Math.min(...distArr);
				var stepSizeDef = [2 / selectCanvas[0].width, 2 / selectCanvas[0].height];
				var stepSizeMod = [
					(minDist < 100) ? (stepSizeDef[0] * 5) : ((minDist < 300) ? (stepSizeDef[0] * 3) : ((minDist < 500) ? stepSizeDef[0] : (stepSizeDef[0] / 2) )),
					(minDist < 100) ? (stepSizeDef[1] * 5) : ((minDist < 300) ? (stepSizeDef[1] * 3) : ((minDist < 500) ? stepSizeDef[1] : (stepSizeDef[1] / 2) ))
				];

				if(selectionAreaData.length == 2){
					var minX = 1, minY = 1, maxX = -1, maxY = -1;
					for(var i = 0, sad; sad = selectionAreaData[i]; i++){
						if(sad[0] < minX){ minX = sad[0] }
						if(sad[0] > maxX){ maxX = sad[0] }
						if(sad[1] < minY){ minY = sad[1] }
						if(sad[1] > maxY){ maxY = sad[1] }
					}

					var cx = minX, cy = minY;
					selectionAreaData = [];
					while(cy < maxY){
						while(cx < maxX){
							selectionAreaData.push(new THREE.Vector2(cx, cy));
							cx += stepSizeMod[0];
						}
						cx = minX;
						cy += stepSizeMod[1];
					}
				}
				else if(selectionAreaData.length > 2){
					selectCtx.stroke();

					var cx = 0, cy = 0;
					var insideSelArea = selectionAreaData;
					selectionAreaData = [];
					tempiTempoData = [];
					while(cy < selectCanvas[0].height){
						while(cx < selectCanvas[0].width){
							if(isInside([cx, cy], insideSelArea)){
								selectionAreaData.push(new THREE.Vector2((cx * stepSizeDef[0]) - 1, -((cy * stepSizeDef[1]) - 1)));
							}
							cx += 1;
						}
						cx = 0;
						cy += 1;
					}
				}

				// if(selectionAreaData.length > 10000){
				// 	var insideSelArea = selectionAreaData;
				// 	selectionAreaData = [];
				// 	var jump = insideSelArea.length / 10000;
				// 	var counter = 0;
				// 	for(var i = 0; i < insideSelArea.length; i++){
				// 		counter++;
				// 		if(counter > jump){
				// 			selectionAreaData.push(insideSelArea[i]);
				// 			counter = 0;
				// 		}
				// 	}
				// }

				$log.log("sends " + selectionAreaData.length + " points to be intersected");

				displayHourglassBeforeUpdateSelection();
			}
			else{
				selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);
			}
    	}
	}
	//===================================================================================


	//========================================================================================
	// Data Dropped
	// When data is dropped onto the 3D webble, this method handles what to do.
	//========================================================================================
	function dataDropped(dataSourceInfoStr, targetField) {
		try {
			var dataSourceInfo = JSON.parse(dataSourceInfoStr); // data arrives in string format, make it an object

			if(dataDropTypeCheck(dataSourceInfo.type, targetField.type)) {

				var srcWebble = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID);

				var accessorFunctionList = srcWebble.scope().gimme(dataSourceInfo.slotName);
				var accessorFunctions = accessorFunctionList[dataSourceInfo.fieldIdx];

				var displayNameS = dataSourceInfo.sourceName;
				var displayNameF = dataSourceInfo.fieldName;

				var somethingChanged = false;

				var newSrc = true;
				var mapSrcIdx = 0;
				for(var i = 0; i < droppedDataMappings.length; i++) {
					if(droppedDataMappings[i].srcID == dataSourceInfo.webbleID) {
						newSrc = false;
						mapSrcIdx = i;
						break;
					}
				}
				if(newSrc) {
					mapSrcIdx = droppedDataMappings.length;
					droppedDataMappings.push({'srcID':dataSourceInfo.webbleID, 'map':[], 'active':false, 'clean':true, 'slotName':dataSourceInfo.slotName});
					somethingChanged = true;
				}

				var found = false;
				for(var i = 0; i < droppedDataMappings[mapSrcIdx].map.length; i++) {
					if(droppedDataMappings[mapSrcIdx].map[i].name == targetField.name) { // already had something mapped here
						if(droppedDataMappings[mapSrcIdx].map[i].srcIdx == dataSourceInfo.fieldIdx) {
							// same field dropped in same place again, nothing to do
						} else {
							// inform previous source that we are no longer using the data
							if(droppedDataMappings[mapSrcIdx].hasOwnProperty("newSelections")
								&& droppedDataMappings[mapSrcIdx].newSelections !== null) {
								droppedDataMappings[mapSrcIdx].newSelections(myInstanceId, null, false); // let them know we are no longer actively visualizing (which we maybe were before)
							}

							var onlyOne = true;
							for(var ii = 0; ii < droppedDataMappings[mapSrcIdx].map.length; ii++) {
								if(ii != i && droppedDataMappings[mapSrcIdx].map[ii].srcIdx == droppedDataMappings[mapSrcIdx].map[i].srcIdx) {
									// same data field is present on a different axis or similar
									onlyOne = false;
								}
							}
							if(onlyOne) {
								//  if this was the only field listening to updates, stop listening to updates
								if(droppedDataMappings[mapSrcIdx].map[i].hasOwnProperty("listen")
									&& droppedDataMappings[mapSrcIdx].map[i].listen !== null) {
									droppedDataMappings[mapSrcIdx].map[i].listen(myInstanceId, false, null, null, []);
								}
							}

							// replace old mapping
							droppedDataMappings[mapSrcIdx].map[i].srcIdx = dataSourceInfo.fieldIdx;
							droppedDataMappings[mapSrcIdx].clean = false;
							somethingChanged = true;
						}
						found = true;
						break;
					}
				}

				if(!found) {
					droppedDataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':targetField.name, 'listen':null});
					droppedDataMappings[mapSrcIdx].clean = false;
					somethingChanged = true;
				}

				if(somethingChanged) {
					checkMappingsAndParseData();
				}

			}
		} catch(e) {
			// probably not something for us, ignore this drop
		}
	}
	//========================================================================================


	//========================================================================================
	// Redraw On New Data
	// reacting to changes in other components (new data forcing a redraw)
	//========================================================================================
	function redrawOnNewData(seqNo) {
		$log.log("redrawOnNewData " + seqNo);
		if(lastSeenDataSeqNo != seqNo) {
			lastSeenDataSeqNo = seqNo;
			checkMappingsAndParseData();
		}
	}
	//========================================================================================


	//========================================================================================
	// Redraw On New Selections
	// reacting to changes in other components (new selection forcing a redraw)
	//========================================================================================
	function redrawOnNewSelections(seqNo) {
		$log.log("redrawOnNewSelections " + seqNo);
		if(lastSeenSelectionSeqNo != seqNo) {
			lastSeenSelectionSeqNo = seqNo;
			$timeout(function () { displayHourglassBeforeRedrawScene(true); });
		}
	}
	//====================================================================================================


    //===================================================================================
    // Display Hourglass Before Redraw
    // Makes sure the loading screen has been updated and rendered correctly before
    // calling the calculation heavy Redraw function.
    //===================================================================================
    function displayHourglassBeforeRedrawScene(keepScene) {
		if(!$scope.waiting()){ $scope.waiting(true); info[0].innerHTML = "Loading Data Points..."; }
		if($scope.waiting() && info[0].innerHTML != ""){ $timeout(function () {	redrawScene(keepScene); }, 100); }
		else{ $timeout(function () { displayHourglassBeforeRedrawScene(keepScene); }, 10); }
    }
    //===================================================================================


	//===================================================================================
	// Display Hourglass Before Redraw
	// Makes sure the loading screen has been updated and rendered correctly before
	// calling the calculation heavy Redraw function.
	//===================================================================================
	function displayHourglassBeforeUpdateSelection() {
		if(!$scope.waiting()){ $scope.waiting(true); info[0].innerHTML = "Updating Data Point Selections..."; }
		if($scope.waiting() && info[0].innerHTML != ""){ $timeout(function () {	selectionAreaData.unshift("Ready"); }, 100); }
		else{ $timeout(function () { displayHourglassBeforeUpdateSelection(); }, 10); }
	}
	//===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
    	// Assigning jquery access elements and other access parameters
        threeDPlusContainer = $scope.theView.parent().find("#threeDPlusContainer");
        threeDPlusHolder = $scope.theView.parent().find("#threeDPlusHolder");
		selectCanvas = $scope.theView.parent().find('#theSelectCanvas');
		selectCtx = selectCanvas[0].getContext('2d');
        internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

		$.ajax({url: internalFilesPath + '/images/GeoData/Coordinates.json',
			success: function(data){
				if(data["Coordinates"]){
					predefCoords = data["Coordinates"];
				}
			},
			error: function(){
				$log.error("Failed loading predefined map coordinates file, please use custom coordinates slot instead");
			}
		});

        // Three pre defines
		centerPoint = new THREE.Vector3(0,0,0);

		// Shortcut internal data cache for optimizations
		myInstanceId = $scope.getInstanceId();

		// Info text divs (array of three elements in the top left and right corner and the bottom)
		info = createInfoElements();

		// Webble Event Listener: Slot Change
		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    	// Resize 3D Viewport if Webble size change
	    	if(eventData.slotName == 'threeDPlusHolder:width' || eventData.slotName == 'threeDPlusHolder:height'){
                if(renderer && $scope.gimme('threeDPlusHolder:width') != null && $scope.gimme('threeDPlusHolder:height') != null){
                	renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
                    if(controls !== undefined && $scope.gimme("cameraControllerMode") == CameraInteractionMode.Trackball){ controls.handleResize(); }
					updateDropZonesSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
                }
	    	}

			if(eventData.slotName == 'threeDPlusHolder:background-color'){
	    		$timeout(function () {
	    			if($scope.gimme("localGlobalColorEqual")){ colorScheme.skin.color = eventData.slotValue; }
					if(scene){ setBackgroundColor(); }
	    		}, 100);
			}

			if(eventData.slotName == 'threeDPlusContainer:background-color'){
	    		if(scene){ colorScheme.skin.border = eventData.slotValue; }
			}

			else if(eventData.slotName == 'AxesEnabled'){
				if(eventData.slotValue && axes == undefined || !eventData.slotValue && axes !== undefined){
					executeAxisVisbilityState();
				}
			}

			else if(eventData.slotName == "ScaleAxesIndependently") {
				if(eventData.slotValue != independentScaling) {
					independentScaling = eventData.slotValue;
					$timeout(function () { displayHourglassBeforeRedrawScene(false); });
				}
			}

			else if(eventData.slotName == 'predefinedColorKey'){
	    		if(eventData.slotValue > 0){
					$scope.set("ColorKey", predefinedColorKeySets[eventData.slotValue - 1]);
				}
			}

			else if(eventData.slotName == "ColorKey") {
				colorKey = eventData.slotValue;
				if(typeof colorKey[0] != 'string' && colorKey[0].length > 1) { // colors and limits
					colorKey.sort(function (a,b) { return a[0] - b[0]; });
				}

				if(colorMethod == colorMethodOptions.ColorKey) {
					for(var src = 0; src < droppedDataMappings.length; src++) {
						if(droppedDataMappings[src].active) {
							$timeout(function () { displayHourglassBeforeRedrawScene(false); });
							break;
						}
					}
				}

				var isSame = -1;
				for(var i = 0; i < predefinedColorKeySets.length; i++){
					if(JSON.stringify(predefinedColorKeySets[i]) == JSON.stringify(colorKey)){
						isSame = i;
						break;
					}
				}
				var pck = $scope.gimme("predefinedColorKey");
				if(isSame == -1 && pck != 0){ $scope.set("predefinedColorKey", 0); }
				else if(isSame > -1 && isSame != (pck - 1)){ $scope.getSlot("predefinedColorKey").setValue((isSame + 1)); }
			}

			else if(eventData.slotName == "ColorMethod") {
				var newCM = eventData.slotValue;
				if(newCM != colorMethod) {
					colorMethod = newCM;
					for(var src = 0; src < droppedDataMappings.length; src++) {
						if(droppedDataMappings[src].active) {
							$timeout(function () { displayHourglassBeforeRedrawScene(false); });
							break;
						}
					}
				}
			}

	    	else if(eventData.slotName == "ColorScheme") {
				colorScheme = eventData.slotValue;
				buildColorCache();
				$scope.getSlot("threeDPlusContainer:background-color").setValue(colorScheme.skin.border);
				if($scope.gimme("localGlobalColorEqual")){ $scope.getSlot("threeDPlusHolder:background-color").setValue(colorScheme.skin.color); }
				$timeout(function () { displayHourglassBeforeRedrawScene(false); });
	    	}

			else if(eventData.slotName == "localGlobalColorEqual") {
				if(eventData.slotValue){ $scope.set("threeDPlusHolder:background-color", colorScheme.skin.color); }
			}

	    	else if(eventData.slotName == 'particleAlphaTexture' || eventData.slotName == 'PixelColorBlending'){
				if(particles){
		    		particles.material = createShaderMaterial();
				}
	    	}

			else if(eventData.slotName == 'particleMinSize' || eventData.slotName == 'particleMaxSize'){
				if(!isNaN(eventData.slotValue)){
					if(particles){
						setParticleAttributes(particles.geometry.attributes.dataValue.array, [], particles.geometry.attributes.size.array);
						particles.geometry.attributes.size.needsUpdate = true;
					}
				}
				else{
					$scope.set(eventData.slotName, (eventData.slotName == 'particleMinSize' ? 0.1 : 3.0));
				}
			}

			else if(eventData.slotName == 'particleMinAlpha' || eventData.slotName == 'particleMaxAlpha'){
				if(!isNaN(eventData.slotValue)){
					if(particles){
						setParticleAttributes(particles.geometry.attributes.dataValue.array, particles.geometry.attributes.customColor.array, []);
						particles.geometry.attributes.customColor.needsUpdate = true;
					}
				}
				else{
					$scope.set(eventData.slotName, (eventData.slotName == 'particleMinAlpha' ? 0.0 : 1.0));
				}
			}

			else if(eventData.slotName == "particleAttributesDistributionType" || eventData.slotName == "particleAttributesValueAffect") {
				$timeout(function () { displayHourglassBeforeRedrawScene(false); });
			}

			else if(eventData.slotName == 'preDefinedGeoArea'){
	    		if($scope.gimme('customGeoMapImage') != null && $scope.gimme('customHeightMapImage') != null){
					if(eventData.slotValue != "None"){
						$scope.getSlot('customGeoMapImage').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
						$scope.getSlot('customHeightMapImage').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
					}
					else{
						$scope.getSlot('customGeoMapImage').setDisabledSetting(Enum.SlotDisablingState.None);
						$scope.getSlot('customHeightMapImage').setDisabledSetting(Enum.SlotDisablingState.None);
					}
					enableGeoLocationSupport();
				}
			}

			else if(eventData.slotName == 'backsideMapEnabled' || eventData.slotName == 'customGeoMapImage' || eventData.slotName == 'customHeightMapImage' || eventData.slotName == 'heightMapStrength' || eventData.slotName == 'mapOpacity'){
				enableGeoLocationSupport();
			}

			else if(eventData.slotName == 'cameraControllerMode'){
	    		if(renderer){
					setCameraControls();
				}
			}

			else if(eventData.slotName == 'objectTargetEnabled'){
				if(controls != undefined){
					var tPoint = new THREE.Vector3(0,0,0);
					if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Orbit && eventData.slotValue == true){
						tPoint = centerPoint;
					}
					if(controls.target){ controls.target = tPoint; }
					camera.lookAt(tPoint);
				}
			}

			else if(eventData.slotName == 'autoOrbit'){
				if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Orbit && controls != undefined){
					controls.autoRotate = eventData.slotValue;
				}
			}
		});


		// Webble Event Listeners: Was Pasted
		$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventData){
			// Fix so that Mouse interaction in child works as expected
			$scope.getParent().scope().theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
		});


		// Webble Event Listeners: Key Down
		$scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
			if(eventData.key.released){
				if(eventData.key.code == 107){ //+
					if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Fly && controls.movementSpeed){
						controls.movementSpeed += 10; controls.rollSpeed = controls.movementSpeed / 100;
						info[2].innerHTML = "Fly Controls (movement speed: " + controls.movementSpeed + " (Num +/-)) (WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw) ( .(dot): Reset Camera)";
					}
					else if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Orbit && controls.zoomSpeed){
						if($scope.shiftKeyIsDown){ controls.zoomSpeed += 10; }
						else{ controls.zoomSpeed += 1; }
						info[2].innerHTML = "Orbit Controls (zoom speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Orbit: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right)";
					}
					else if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Trackball && controls.zoomSpeed){
						if($scope.shiftKeyIsDown){ controls.zoomSpeed += 10; controls.rotateSpeed += 10; controls.panSpeed += 10; }
						else{ controls.zoomSpeed += 1; controls.rotateSpeed += 1; controls.panSpeed += 1; }
						info[2].innerHTML = "Trackball Controls (Movement speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Rotate: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right)";
					}
				}
				else if(eventData.key.code == 109){ //-
					if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Fly && controls.movementSpeed && controls.movementSpeed > 10){
						controls.movementSpeed -= 10; controls.rollSpeed = controls.movementSpeed / 100;
						info[2].innerHTML = "Fly Controls (movement speed: " + controls.movementSpeed + " (Num +/-)) (WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw) ( .(dot): Reset Camera)";
					}
					else if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Orbit && controls.zoomSpeed){
						if($scope.shiftKeyIsDown && controls.zoomSpeed > 10){ controls.zoomSpeed -= 10; }
						else if(controls.zoomSpeed > 1){ controls.zoomSpeed -= 1; }
						info[2].innerHTML = "Orbit Controls (zoom speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Orbit: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right)"
					}
					else if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Trackball && controls.zoomSpeed){
						if($scope.shiftKeyIsDown && controls.zoomSpeed > 10){ controls.zoomSpeed -= 10; controls.rotateSpeed -= 10; controls.panSpeed -= 10; }
						else if(controls.zoomSpeed > 1){ controls.zoomSpeed -= 1; controls.rotateSpeed -= 1; controls.panSpeed -= 1; }
						info[2].innerHTML = "Trackball Controls (Movement speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Rotate: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right)";
					}
				}
				else if(eventData.key.code == 110 && camera && camPosOrigin){
					var ccm = $scope.gimme("cameraControllerMode");
					if(ccm == CameraInteractionMode.Orbit || ccm == CameraInteractionMode.Trackball){ controls.reset() }
					camera.position.set(camPosOrigin.x, camPosOrigin.y, camPosOrigin.z);

					if($scope.gimme("objectTargetEnabled")){
						camera.lookAt(centerPoint);
						if(controls.target){ controls.target = centerPoint; }
					}
					else{
						camera.lookAt(new THREE.Vector3(0, 0, 0));
						if(controls.target){ controls.target = new THREE.Vector3(0, 0, 0); }
					}
				}
			}
		});


		// SLOTS
		//=======

		//*** Global Slots
		$scope.addSlot(new Slot('AxesEnabled',
			true,
			'Axes Enabled',
			'Shows or hides X, Y and Z axes in the 3D space',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ScaleAxesIndependently',
			independentScaling,
			"Scale Axes Independently",
			'If true, the scales of each axis will be set independently, otherwise they will use the same scaling (i.e. set this to false if the data on each axis has the same measuring unit, for example distances in meteres).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('cameraControllerMode',
			CameraInteractionMode.Orbit,
			"Camera Controller Mode",
			'The type of camera controller to be used for moving around and look at the data',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Fly", "Orbit", "Trackball"]},
			undefined
		));

		$scope.addSlot(new Slot('objectTargetEnabled',
			true,
			'Orbit Data Enabled',
			'(FOR ORBIT CONTROL ONLY) If enabled the Orbit control will spin around the center of the current loaded data, otherwise around the center of the world (0,0,0)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('autoOrbit',
			false,
			'Auto Orbit',
			'(FOR ORBIT CONTROL ONLY) If enabled the camera will automatically orbit around the orbit center, otherwise manual orbit only',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		//*** Particle Properties (base values)
		$scope.addSlot(new Slot('particleAlphaTexture',
			availableTextures.Spark,
			'Particle Alpha Texture',
			'A texture for each data point',
			"Particle Properties",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["None", "Spark", "Fading Circle", "Cloud 1", "Cloud 2", "Smoke"]},
			undefined
		));

		$scope.addSlot(new Slot('PixelColorBlending',
			pixelColorBlending.Normal,
			'Pixel Color Blending',
			'How pixels on top of each other should blend',
			"Particle Properties",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["No Blending", "Normal", "Additive", "Subtractive", "Multiply"]},
			undefined
		));

		$scope.addSlot(new Slot('particleMinSize',
			10,
			'Particle Minimum Size',
			'The minimum size of an individual particle, as modified by data values',
			"Particle Properties",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('particleMaxSize',
			30,
			'Particle Maximum Size',
			'The maximum size of an individual particle, as modified by data values',
			"Particle Properties",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('particleMinAlpha',
			0.0,
			'Particle Minimum Opacity',
			'The minimum opacity of an individual particle, as modified by data values',
			"Particle Properties",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('particleMaxAlpha',
			1.0,
			'Particle Maximum Opacity',
			'The maximum opacity of an individual particle, as modified by data values',
			"Particle Properties",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('particleAttributesDistributionType',
			distributionTypes.Linear,
			'Data Distribution Type',
			'Type of distribution for applying attribute (size, color, alpha etc) differences based on data values',
			"Particle Properties",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Linear", "Logarithmic"]},
			undefined
		));

		$scope.addSlot(new Slot('particleAttributesValueAffect',
			valueAffectAttributes.Both,
			'Data Value Attribute Affect',
			'What attributes of the particle points that are being affected by the data value',
			"Particle Properties",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["None", "Size", "Opacity", "Both"]},
			undefined
		));


		//*** Geographic map display Attributes
		$scope.addSlot(new Slot('preDefinedGeoArea',
			"None",
			'Geographical Area',
			'Predefined 3D map setups for a number of regions with Open Street maps and Terrain height maps (as well as distance measurements)',
			"Geography",
			{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ["None", "Kobe", "Tohoku"]},
			undefined
		));

		$scope.addSlot(new Slot('customGeoMapImage',
			"",
			'Geo Map Image Link',
			'Link to a custom Geo Map image, if the provided areas is not enough',
			"Geography",
			{inputType: Enum.aopInputTypes.ImagePick},
			undefined
		));

		$scope.addSlot(new Slot('customHeightMapImage',
			"",
			'Height Map Image Link',
			'Link to a custom Height Map image, if the provided areas is not enough',
			"Geography",
			{inputType: Enum.aopInputTypes.ImagePick},
			undefined
		));

		$scope.addSlot(new Slot('customMinMaxCoordinates',
			defaultCoord,
			'Custom Min/Max Geo Coordinates',
			'Custom Min/Max Geo Coordinates if such coordinates are not already found in the data. Use format "[[lat-min, long-min], [lat-max, long-max]]"',
			"Geography",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('backsideMapEnabled',
			false,
			'Map Backside Visible',
			'If Enabled the map will be visible also on the backside of the plane, otherwise a dark soil texture will be used instead for representing the back side.',
			"Geography",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('mapOpacity',
			1.0,
			'Map Opacity',
			'The trancparency of the map image. 1 is fully opaque, and 0 is 100% transparent.',
			"Geography",
			undefined,
			undefined
		));


		//*** Data Grouping and Selection Slots
		$scope.addSlot(new Slot('ColorScheme',
			colorScheme,
			"Color Scheme",
			'Input Slot. Mapping group numbers to colors.',
			"Data Group Visualization",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('localGlobalColorEqual',
			false,
			"Sync Background Colors",
			'If checked the Webble will sync the local background color with the global (skin color) and use the skin color, if not, the local background color will be used instead and skin will be ignored ',
			"Data Group Visualization",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ColorMethod',
			colorMethod,
			"Color Method",
			'How to pick colors for the data.',
			"Data Group Visualization",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Group Color + Alpha (min to max)", "Group Color + Alpha (histogram)", "Color Key"]},
			undefined
		));

		$scope.addSlot(new Slot('predefinedColorKey',
			predefinedColorSchemes.None,
			'Predefined Color Key Sets',
			'Predefined options of the color key scale being used from lower to higher values of a particle.',
			"Data Group Visualization",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Manual Input", "Tohoku Flooding", "Tohoku Structural Damage", "JMA Radar Data", "JMA Colors", "JMA Accumulated Rainfall", "JMA Snow Depth (cm)", "JMA Temperature", "JMA Wind Speed", "JMA Sunlight (relative)", "JMA Comparative (%)", "NEXRAD Colors", "NEXRAD (mm/h)", "WSI Radar Colors", "WSI Radar (mm/h)", "NOAA Radar Reflection", "Natural Clouds", "Natural Water", "Natural Space"]},
			undefined
		));

		$scope.addSlot(new Slot('ColorKey',
			colorKey,
			"Color Key",
			'The color key (mapping from value to color) to use when "Color Method" is set to "Color Key".',
			"Data Group Visualization",
			undefined,
			undefined
		));
		//=======


		// If Property form is open, make sure color key changes is visualised properly inside the form in real time
		$scope.$watch(function(){ return ($scope.getIsFormOpen()); }, function(newValue, oldValue) {
			if(newValue == true){
				$timeout(function () {
					// Color Key and Color scheme elements
					var pckElem = $('[uib-tooltip=predefinedColorKey]').siblings().find('select');
					var ckElemI = $('[uib-tooltip=ColorKey]').siblings().first().find('input');
					var ckElemT = $('[uib-tooltip=ColorKey]').siblings().first().find('textarea');
					var cmElem = $('[uib-tooltip=ColorMethod]').siblings().find('select');

					if(pckElem.length > 0){
						watchingForPredefinedColorKeyChanges = $scope.$watch(function(){ return pckElem.prop('selectedIndex'); }, function(newVal, oldVal) {
							if(newVal != oldVal && ((new Date()).getTime() - changeTime) > 1000){
								if(newVal > 0){
									$timeout(function () {
										changeTime = (new Date()).getTime();
										ckElemI.val(JSON.stringify(predefinedColorKeySets[newVal - 1]));
										ckElemT.val(JSON.stringify(predefinedColorKeySets[newVal - 1]));
										cmElem.val(2).change();
									});
								}
							}
						}, true);

						watchingForColorKeyChanges = $scope.$watch(function(){ return [ckElemI.val(), ckElemT.text()]; }, function(newVal, oldVal) {
							if(newVal != oldVal && ((new Date()).getTime() - changeTime) > 1000){
								$timeout(function () { changeTime = (new Date()).getTime(); pckElem.val(0).change(); });
							}
						}, true);
					}

					// Map related elements
					var pgaElem = $('[uib-tooltip=preDefinedGeoArea]').siblings().find('select');
					var gmilElem = $('[uib-tooltip=customGeoMapImage]').parent();
					var hmilElem = $('[uib-tooltip=customHeightMapImage]').parent();
					var gcElem = $('[uib-tooltip=customMinMaxCoordinates]').parent();

					if(pgaElem.length > 0){
						watchingForPredefinedGeoAreaChanges = $scope.$watch(function(){ return pgaElem.prop('selectedIndex'); }, function(newVal, oldVal) {
							if(newVal != oldVal){
								if(newVal > 0){
									$timeout(function () {
										gmilElem.hide();
										hmilElem.hide()
										gcElem.hide();
									});
								}
								else{
									$timeout(function () {
										gmilElem.show();
										hmilElem.show()
										gcElem.show();
									});
								}
							}
						}, true);
					}
				}, 500);
			}
			else{
				if(watchingForPredefinedColorKeyChanges != undefined){ watchingForPredefinedColorKeyChanges(); watchingForPredefinedColorKeyChanges = undefined; }
				if(watchingForColorKeyChanges != undefined){ watchingForColorKeyChanges(); watchingForColorKeyChanges = undefined; }
				if(watchingForPredefinedGeoAreaChanges != undefined){ watchingForPredefinedGeoAreaChanges(); watchingForPredefinedGeoAreaChanges = undefined; }
			}
		}, true);


		// Webble initiations
		$scope.setResizeSlots('threeDPlusHolder:width', 'threeDPlusHolder:height');
		$scope.theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
		threeDPlusHolder.bind('contextmenu',function(){ if(!$scope.altKeyIsDown){return false;} });

		buildColorCache();

		// WebGL presence check
		if (Detector.webgl) {
			init3D();
			executeAxisVisbilityState();
			$timeout(function () { displayHourglassBeforeRedrawScene(false); });
		} else {
			var warning = Detector.getWebGLErrorMessage();
			warning.innerText = "Your Browser does not support WebGL and can therefore not display 3D graphics. \nWe recommend that you change browser.";
			($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(warning);
		}

		updateDropZonesSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
		$scope.setupDroppable(); // start listening to drag&drop events
    };
    //===================================================================================



    //=== THREE.JS BASIC FUNCTIONS ======================================================================

    //========================================================================================
    // Initiate 3D
    // Initiates the scene, renderer and the camera controller for 3D drawing.
    //========================================================================================
	var init3D = function() {
		// renderer
		renderer = new THREE.WebGLRenderer({ alpha: false });
		renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
		($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(renderer.domElement);

		// camera
		camera = new THREE.PerspectiveCamera(75, parseInt($scope.gimme('threeDPlusHolder:width')) / parseInt($scope.gimme('threeDPlusHolder:height')), 1, 100000);
		camera.position.set(7, 7, 15);
		camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
		camera.lookAt(new THREE.Vector3(0, 0, 0));

		// scene
		scene = new THREE.Scene();

		// fog
		//scene.fog = new THREE.FogExp2(0x000000, 0.0007); //Baked into the scene if used, and cannot be altered... it does not work well with large objects far away so I suggest to leave off

		// Light
		lightAmb = new THREE.AmbientLight( 0xF0F0F0, 0.0 ); // soft white light
		lightAmb.name = 'Ambient_Light';
		scene.add( lightAmb );

		light = new THREE.DirectionalLight( 0xffffff, 1.0 );
		light.position.set( 10, 10, 10 ).normalize();
		light.name = 'Directional_Light';
		scene.add( light );

		// Particle Interaction
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();
		mouse_click = new THREE.Vector2();
		threeDPlusHolder[0].addEventListener( 'mousemove', on3DMouseMove, false );
		threeDPlusHolder[0].addEventListener( 'mousedown', on3DMouseClick, false );
		threeDPlusHolder[0].addEventListener( 'mouseup', on3DMouseUp, false );

		// controls
		setCameraControls();
	};
    //========================================================================================


    //========================================================================================
    // Animate
    // the animation cycle control function
    //========================================================================================
	var animate = function() {
		requestAnimationFrame( animate );

		light.position.copy( camera.position );

		if(controls != undefined){
			var camCtrl = $scope.gimme("cameraControllerMode");
			if (camCtrl == CameraInteractionMode.Fly && clock){
				controls.update( clock.getDelta() );
			}
			else{ controls.update(); }
		}

		render();
	};
    //========================================================================================


    //========================================================================================
    // Render
    // Doing the time tick periodic rendering of the scene
    //========================================================================================
	var render = function() {

		// Raycast Mouse interaction
		//--------------------------------------
		if(particles != undefined && isMouseClicked) {
			var geometry = particles.geometry;
			var attributes = geometry.attributes;

			if(!isMouseDown){
				raycaster.setFromCamera( mouse_click, camera );
				intersects = raycaster.intersectObject( particles );

				var onlyVisibleIntersects = [];
				for(var i = 0; i < intersects.length; i++){
					var index = intersects[i].index;
					if(attributes.customColor.array[index * 4 + 3 ] > 0){
						onlyVisibleIntersects.push(intersects[i]);
					}
				}
				intersects = onlyVisibleIntersects;
			}

			for (var i = 0, isam; isam = intSecAreaMem[i]; i++){
				attributes.customColor.array[ isam[0] * 4 + 0 ] = isam[1]; attributes.customColor.array[ isam[0] * 4 + 1 ] = isam[2]; attributes.customColor.array[ isam[0] * 4 + 2 ] = isam[3]; attributes.customColor.array[ isam[0] * 4 + 3 ] = isam[4];
				attributes.size.array[ isam[0] ] = isam[5];
			}

		 	if ( intersects.length > 0 && controls.enabled) {
		 		if ( INTERSECTED != intersects[ 0 ].index ) {
		 			if(INTERSECTED != null && INTERSECTED != undefined && intersectedMemory[0] != undefined){
		 				attributes.customColor.array[ INTERSECTED * 4 + 0 ] = intersectedMemory[0]; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = intersectedMemory[1]; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = intersectedMemory[2]; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = intersectedMemory[3];
		 				attributes.size.array[ INTERSECTED ] = intersectedMemory[4];
		 			};
		 			INTERSECTED = intersects[ 0 ].index;
		 			intersectedMemory[0] = attributes.customColor.array[ INTERSECTED * 4 + 0 ]; intersectedMemory[1] = attributes.customColor.array[ INTERSECTED * 4 + 1 ]; intersectedMemory[2] = attributes.customColor.array[ INTERSECTED * 4 + 2 ]; intersectedMemory[3] = attributes.customColor.array[ INTERSECTED * 4 + 3 ];
		 			intersectedMemory[4] = attributes.size.array[ INTERSECTED ];
		 			attributes.customColor.array[ INTERSECTED * 4 + 0 ] = SELECT_COLOR[0]; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = SELECT_COLOR[1]; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = SELECT_COLOR[2]; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = SELECT_COLOR[3];
		 			attributes.size.array[ INTERSECTED ] = attributes.size.array[ INTERSECTED ] * 2;
		 			attributes.customColor.needsUpdate = true;
		 			attributes.size.needsUpdate = true;

		 			var dataValue = attributes.dataValue.array[ INTERSECTED ];

		 			info[0].innerHTML = dataValue;
		 		}
		 	} else {
		 		if(INTERSECTED != null && INTERSECTED != undefined && intersectedMemory[0] != undefined){
		 			attributes.customColor.array[ INTERSECTED * 4 + 0 ] = intersectedMemory[0]; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = intersectedMemory[1]; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = intersectedMemory[2]; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = intersectedMemory[3];
		 			attributes.size.array[ INTERSECTED ] = intersectedMemory[4];
		 			INTERSECTED = null;
		 			attributes.customColor.needsUpdate = true;
		 			attributes.size.needsUpdate = true;
					info[0].innerHTML = "";
		 		};
		 	}
		}
		isMouseClicked = false;
		intersects = [];

		if(particles != undefined && selectionAreaData.length > 0 && selectionAreaData[0] == "Ready"){
			selectionAreaData[0] = "Running";
			var geometry = particles.geometry;
			var attributes = geometry.attributes;

			var intersectsArea = [];
			for(var i = 1, vmp; vmp = selectionAreaData[i]; i++){
				raycaster.setFromCamera( vmp, camera );
				intersectsArea = intersectsArea.concat(raycaster.intersectObject( particles ));
			}
			selectionAreaData = [];

			var intersectsAreaNoDoubles = [];
			for(var i = 0, ia; ia = intersectsArea[i]; i++){
				var addOk = true;
				for(var j = 0, iand; iand = intersectsAreaNoDoubles[j]; j++){
					if(iand.index == ia.index){
						addOk = false;
					}
				}

				if(addOk){
					intersectsAreaNoDoubles.push(ia);
				}
			}

			var onlyVisibleIntersects = [];
			for(var i = 0; i < intersectsAreaNoDoubles.length; i++){
				var index = intersectsAreaNoDoubles[i].index;
				if(attributes.customColor.array[index * 4 + 3 ] > 0){
					onlyVisibleIntersects.push(intersectsAreaNoDoubles[i]);
				}
			}
			intersectsAreaNoDoubles = onlyVisibleIntersects;

			$log.log(intersectsAreaNoDoubles.length + " number of points selected");

			for (var i = 0, isam; isam = intSecAreaMem[i]; i++){
				attributes.customColor.array[ isam[0] * 4 + 0 ] = isam[1]; attributes.customColor.array[ isam[0] * 4 + 1 ] = isam[2]; attributes.customColor.array[ isam[0] * 4 + 2 ] = isam[3]; attributes.customColor.array[ isam[0] * 4 + 3 ] = isam[4];
				attributes.size.array[ isam[0] ] = isam[5];
			}
			intSecAreaMem = [];
			if ( intersectsAreaNoDoubles.length > 0 ) {
				for (var i = 0, iand; iand = intersectsAreaNoDoubles[i]; i++){
					var INTSEC = iand.index;
					var iam = new Array( 6 );
					iam[0] = INTSEC;
					iam[1] = attributes.customColor.array[ INTSEC * 4 + 0 ]; iam[2] = attributes.customColor.array[ INTSEC * 4 + 1 ]; iam[3] = attributes.customColor.array[ INTSEC * 4 + 2 ]; iam[4] = attributes.customColor.array[ INTSEC * 4 + 3 ];
					iam[5] = attributes.size.array[ INTSEC ];
					intSecAreaMem.push(iam);
					attributes.customColor.array[ INTSEC * 4 + 0 ] = SELECT_COLOR[0]; attributes.customColor.array[ INTSEC * 4 + 1 ] = SELECT_COLOR[1]; attributes.customColor.array[ INTSEC * 4 + 2 ] = SELECT_COLOR[2]; attributes.customColor.array[ INTSEC * 4 + 3 ] = SELECT_COLOR[3];
					attributes.size.array[ INTSEC ] = attributes.size.array[ INTSEC ] * 2;
				}
			}
			attributes.customColor.needsUpdate = true;
			attributes.size.needsUpdate = true;

			selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);
			$timeout(function () { $scope.waiting(false); info[0].innerHTML = "" });
		}

		//--------------------------------------

		renderer.render(scene, camera);
	};
    //========================================================================================



    //=== WEBBLE-CHANGE-DEPENDANT RE-RENDERING FUNCTIONS ======================================================================

	//========================================================================================
	// Redraw Scene
	// Redrawing scene, but first manage if everything will be cleared before the redrawing
	// or if some should be kept and just updated
	//========================================================================================
	function redrawScene(keepScene) {
		if(scene){
			$log.log("redrawScene");

			if(keepScene) {
				if(dotsGeometry === null || dotsGeometry === undefined) {
					keepScene = false;
				}
			}

			if(!keepScene) {
				if(particles != undefined) {
					particles.geometry.dispose();
					particles.material.dispose();
					scene.remove(particles);
					particles = undefined;
				}
			}

			// a 3D cube full of values, for example the space data
			if(droppedDataInfo.type == droppedDataInfoTypes.only3D
				|| droppedDataInfo.type == droppedDataInfoTypes.val3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xy3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xyz3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xyval3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xyzval3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlon3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonz3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonval3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval3D
			) {
				$log.log("redraw scene with 3D data (space density?) as points cloud");
				redrawPointsCloud(keepScene, true);
			}

			// lots of tuples of x, y, z (location), and values, for example halos in space, but not tuples with latitude and longitude
			else if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
				|| droppedDataInfo.type == droppedDataInfoTypes.xyz
				|| droppedDataInfo.type == droppedDataInfoTypes.xyval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonz
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonval
			){
				$log.log("redraw scene with 'xyzval' data (tuples, halos?) as point cloud");
				redrawPointsCloud(keepScene, false);
			}

			// Data type not identified
			else if(droppedDataInfo.type == droppedDataInfoTypes.none){
				$log.log("redraw scene called but with an unsupported data type");
				$timeout(function () { $scope.showQIM("The data was found but not identified. Drawing not possible at this time.", 4000); });
			}

			animate();
			$timeout(function () { $scope.waiting(false); info[0].innerHTML = "";});
		} // if scene
	};
	//========================================================================================


    //========================================================================================
    // Redraw Points Cloud
    // draw lots of points in space
    //========================================================================================
	function redrawPointsCloud(keepScene, have3D) {
		var haveX = false;
		var haveY = false;
		var haveZ = false;
		var haveValues = false;

		setBackgroundColor();

		cubeNo = -1;
		if(have3D) {
			for(var c = 0; c < droppedDataInfo.size3D; c++) {
				// find first selected 3D data set
				var ldb = droppedDataInfo.fun3D(c);

				if(ldb !== null) {
					var groupId = droppedDataInfo.selFun3D(c);
					if(groupId > 0) {
						cubeNo = c;
						break;
					}
				}
			}
		}
		var noOfPoints = 0;

		if(have3D && cubeNo >= 0) {
			noOfPoints = droppedDataInfo.size3Dv / droppedDataInfo.size3D; // conservative estimate, we may use fewer
			$log.log("Have " + noOfPoints + " data points.");
			if(cubeNo < nullCounts3D.length) {
				noOfPoints -= nullCounts3D[cubeNo];
			}
			$log.log("Will draw " + noOfPoints + " data points.");
		}
		if(!have3D) {
			noOfPoints = droppedDataInfo.sizeX; // conservative estimate, we may use fewer
			$log.log("Have " + noOfPoints + " data points.");
			noOfPoints -= nullCountsVals;
			$log.log("Will draw " + noOfPoints + " data points.");
		}

		if(!keepScene) {
			shaderMaterial = createShaderMaterial();

			// Particle geometry
			dotsGeometry = new THREE.BufferGeometry();

			positions = []; matrixLocations = [];
			positions = new Float32Array( noOfPoints * 3 );
			matrixLocations = new Uint32Array( noOfPoints * 3 );
		}

		if(have3D) {
			cubeNo = -1;
			for(var c = 0; c < droppedDataInfo.size3D; c++) {
				// find first selected 3D data set
				var ldb = droppedDataInfo.fun3D(c);

				if(ldb !== null) {
					var groupId = droppedDataInfo.selFun3D(c);
					if(groupId > 0) {
						cubeNo = c;
						break;
					}
				}
			}

			if(cubeNo >= 0) {

				if(droppedDataInfo.type == droppedDataInfoTypes.xy3D
					|| droppedDataInfo.type == droppedDataInfoTypes.xyval3D

					|| droppedDataInfo.type == droppedDataInfoTypes.latlon3D
					|| droppedDataInfo.type == droppedDataInfoTypes.latlonval3D
				) {
					haveX = true;
					haveY = true;
				}
				if(droppedDataInfo.type == droppedDataInfoTypes.xyz3D
					|| droppedDataInfo.type == droppedDataInfoTypes.xyzval3D

					|| droppedDataInfo.type == droppedDataInfoTypes.latlonz3D
					|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval3D
				) {
					haveX = true;
					haveY = true;
					haveZ = true;
				}

				if(!keepScene) {

					var particleDist = 3.0;

					var minX = 0;
					var minY = 0;
					var minZ = 0;

					var maxX = (ldb[0][0].length - 1);
					var maxY = (ldb[0].length - 1);
					var maxZ = (ldb.length - 1);

					if(droppedDataInfo.type == droppedDataInfoTypes.val3D) {
						droppedDataInfo.sizeX = maxX + 1;
						droppedDataInfo.sizeY = maxY + 1;
					}

					var scaleX = particleDist;
					var scaleY = particleDist;
					var scaleZ = particleDist;

					if(haveX && haveY) {
						var minX = droppedDataInfo.funX(0);
						var minY = droppedDataInfo.funY(0);

						if(droppedDataInfo.latlon) {
							var temp = convertLatLngToUtm(minY, minX);
							minX = temp[0];
							minY = temp[1];
						}

						maxX = droppedDataInfo.funX(droppedDataInfo.sizeX - 1);
						maxY = droppedDataInfo.funY(droppedDataInfo.sizeY - 1);
						if(droppedDataInfo.latlon) {
							var temp = convertLatLngToUtm(maxY, maxX);
							maxX = temp[0];
							maxY = temp[1];
						}

					} else {
						if(haveX) {
							var minX = droppedDataInfo.funX(0);

							maxX = droppedDataInfo.funX(droppedDataInfo.sizeX - 1);
						}

						if(haveY) {
							var minY = droppedDataInfo.funY(0);

							maxY = droppedDataInfo.funY(droppedDataInfo.sizeY - 1);

							if(droppedDataInfo.latlon) {
								minY = latToY(minY);

								maxY = latToY(maxY);
							}
						}
					}

					if(haveZ) {
						var minZ = droppedDataInfo.funZ(0);

						maxZ = droppedDataInfo.funZ(droppedDataInfo.sizeZ - 1);
					}

					if(maxX > minX) {
						scaleX = 1000 / (maxX - minX);
					}
					if(maxY > minY) {
						scaleY = 1000 / (maxY - minY);
					}
					if(maxZ > minZ) {
						scaleZ = 1000 / (maxZ - minZ);
					}

					if(!independentScaling) {
						scaleX = Math.min(scaleX, scaleY, scaleZ);
						scaleY = scaleX;
						scaleZ = scaleX;
					}
				}
			} // cubeNo >= 0
		}

		colors = []; sizes = []; dataValues = [];
		colors = new Float32Array( noOfPoints * 4 );
		sizes = new Float32Array( noOfPoints );
		dataValues = new Float32Array( noOfPoints );

		var densityMin = 0;
		var densityMax = 0;
		var densitySum = 0;
		var densitySqSum = 0;
		var N = 0;

		var first = true;

		var posArrIndex = 0, densArrIndex = 0;

		if(have3D) {
			if(cubeNo >= 0) {
				var c = cubeNo;

				var ldb = droppedDataInfo.fun3D(c);

				for( var i=0 ; i < ldb.length ; i++ ) {
					// // if we have z-value data, check if z is selected
					// var zGroup = 1;
					// if(haveZ) {
					//     zGroup = droppedDataInfo.selFunZ();
					// }

					for (var k = 0; k < ldb[i].length; k++) {

						// var yGroup = 1;
						// if(haveY) {
						// 	yGroup = droppedDataInfo.selFunY();
						// }

						for (var n = 0; n < ldb[i][k].length; n++) {

							// var xGroup = 1;
							// if(haveX) {
							//     xGroup = droppedDataInfo.selFunX();
							// }

							// var vGroup = 1;
							// if(haveValues) {
							//     vGroup = droppedDataInfo.selFunValues();
							// }

							var density = ldb[i][k][n];

							if(density !== null) {

								densitySum += density;
								densitySqSum += density*density;
								N += 1;

								if(first) {
									first = false;
									densityMin = density;
									densityMax = density;
								} else {
									densityMin = Math.min(densityMin, density);
									densityMax = Math.max(densityMax, density);
								}

								dataValues[densArrIndex++] = density;

								if(!keepScene) {

									if(haveX && haveY) {
										var posY = droppedDataInfo.funY(k);
										var posX = droppedDataInfo.funX(n);

										if(droppedDataInfo.latlon) {
											var temp = convertLatLngToUtm(posY, posX);
											posX = temp[0];
											posY = temp[1];
										}

										positions[ posArrIndex + 2 ] = ((maxY - minY) - (posY - minY)) * scaleY;
										positions[ posArrIndex + 0 ] = (posX - minX) * scaleX;

									} else {
										if(haveY) {
											var posY = droppedDataInfo.funY(k);
											if(droppedDataInfo.latlon) {
												posY = latToY(posY);
											}
											positions[ posArrIndex + 2 ] = ((maxY - minY) - (posY - minY)) * scaleY;
										} else {
											// positions[ posArrIndex + 2 ] = k * particleDist;
											positions[ posArrIndex + 2 ] = (maxY - k) * scaleY;
										}

										if(haveX) {
											var posX = droppedDataInfo.funX(n);
											positions[ posArrIndex + 0 ] = (posX - minX) * scaleX;
										} else {
											// positions[ posArrIndex + 0 ] = n * particleDist;
											positions[ posArrIndex + 0 ] = n * scaleX;
										}
									}

									if(haveZ) {
										var posZ = droppedDataInfo.funZ(i);
										positions[ posArrIndex + 1 ] = (posZ - minZ) * scaleZ;
									} else {
										// positions[ posArrIndex + 1 ] = i * particleDist;
										positions[ posArrIndex + 1 ] = i * scaleZ;
									}

									matrixLocations[ posArrIndex + 1 ] = i;
									matrixLocations[ posArrIndex + 2 ] = k;
									matrixLocations[ posArrIndex + 0 ] = n;

									posArrIndex += 3;
								} // if value in cell not null
							} // if not keepScene
						} // for each X
					} // for each Y
				} // for each Z
			} // if we have a selected 3D object
		} else { // we do not have 3D object

			if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval) {
				haveX = true;
				haveY = true;
				haveZ = true;
				haveValues = true;
			}
			if(droppedDataInfo.type == droppedDataInfoTypes.xyz
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonz) {
				haveX = true;
				haveY = true;
				haveZ = true;
				haveValues = false;
			}
			if(droppedDataInfo.type == droppedDataInfoTypes.xyval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonval) {
				haveX = true;
				haveY = true;
				haveZ = false;
				haveValues = true;
			}

			var firstNonNull = true;

			for( var i=0 ; i < droppedDataInfo.sizeX; i++ ) {

				var x = droppedDataInfo.funX(i);
				var y = droppedDataInfo.funY(i);
				var z = 0;
				var v = 0;

				if(haveZ) {
					z = droppedDataInfo.funZ(i);
				}
				if(haveValues) {
					v = droppedDataInfo.funValues(i);
				}

				if(haveValues && !haveZ) {
					z = v;
				}
				if(haveZ && !haveValues) {
					v = 1;
				}

				if(x !== null
					&& y !== null
					&& z !== null
					&& v !== null) {

					var density = v;

					densitySum += density;
					densitySqSum += density*density;
					N += 1;

					if(firstNonNull) {
						densityMin = density;
						densityMax = density;
					} else {
						densityMin = Math.min(densityMin, density);
						densityMax = Math.max(densityMax, density);
					}

					dataValues[densArrIndex++] = density;

					if(!keepScene) {
						if(droppedDataInfo.latlon) {
							if(haveX && haveY) {
								var temp = convertLatLngToUtm(y, x);
								x = temp[0];
								y = temp[1];
							} else {
								if(haveY) {
									y = latToY(y);
								}
							}
						}

						if(firstNonNull) {
							minX = x;
							minY = y;
							minZ = z;

							maxX = x;
							maxY = y;
							maxZ = z;
						} else {
							minX = Math.min(minX, x);
							minY = Math.min(minY, y);
							minZ = Math.min(minZ, z);

							maxX = Math.max(maxX, x);
							maxY = Math.max(maxY, y);
							maxZ = Math.max(maxZ, z);
						}

						positions[ posArrIndex + 2 ] = y;
						positions[ posArrIndex + 0 ] = x;
						positions[ posArrIndex + 1 ] = z;

						matrixLocations[ posArrIndex + 1 ] = i;
						matrixLocations[ posArrIndex + 2 ] = i;
						matrixLocations[ posArrIndex + 0 ] = i;

						posArrIndex += 3;
					} // if not keepScene
					firstNonNull = false;
				} // if x,y,z, and value are not null
			} // for each value

			if(!keepScene) {
				var scaleX = 1;
				var scaleY = 1;
				var scaleZ = 1;

				if(maxX > minX) {
					scaleX = 1000 / (maxX - minX);
				}
				if(maxY > minY) {
					scaleY = 1000 / (maxY - minY);
				}
				if(maxZ > minZ) {
					scaleZ = 1000 / (maxZ - minZ);
				}

				if(!independentScaling) {
					scaleX = Math.min(scaleX, scaleY, scaleZ);
					scaleY = scaleX;
					scaleZ = scaleX;
				}

				posArrIndex = 0;
				for( var i=0 ; i < droppedDataInfo.sizeX; i++ ) {
					positions[ posArrIndex + 2 ] = (maxY - minY - (positions[ posArrIndex + 2 ] - minY)) * scaleY;
					positions[ posArrIndex + 0 ] = (positions[ posArrIndex + 0 ] - minX) * scaleX;
					positions[ posArrIndex + 1 ] = (positions[ posArrIndex + 1 ] - minZ) * scaleZ;

					posArrIndex += 3;
				} // for each value we have
			} // if not keepScene
		} // no 3D object

		// Jonas: do we still need the thresholds, or can we do this in some other way? (Maybe the data source can remove outliers and set them to null, for example).
		var densityMean = densitySum / N;
		var densityVariance = (densitySqSum - densitySum*densitySum / N) / N;
		var densityStdDv = Math.sqrt(densityVariance);
		//???
		minValueThreshold = densityMean - 5 * densityStdDv;
		maxValueThreshold = densityMean + 5 * densityStdDv;

		thresholdRange = Math.abs(maxValueThreshold - minValueThreshold);

		setParticleAttributes(dataValues, colors, sizes); // this updates colors etc.

		if(!keepScene) {
			$log.log("centerPoint = new THREE.Vector3(" + ((maxX - minX) * scaleX / 2) + ", " +((maxZ - minZ) * scaleZ / 2) + ", " + ((maxY - minY) * scaleY / 2) + ")");
			centerPoint = new THREE.Vector3((maxX - minX) * scaleX / 2 , (maxZ - minZ) * scaleZ / 2, (maxY - minY) * scaleY / 2);

			dotsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
			dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
			dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
			dotsGeometry.addAttribute( 'dataValue', new THREE.BufferAttribute( dataValues, 1 ) );
			dotsGeometry.addAttribute( 'matrixLocation', new THREE.BufferAttribute( matrixLocations, 3 ) );

			particles = new THREE.Points( dotsGeometry, shaderMaterial );
			particles.renderOrder = 10;
			particles.geometry.computeBoundingBox();
			particles.name = 'Particles';
			scene.add( particles );

			var camX = scaleX * (maxX - minX + ((maxX - minX) / 20));
			var camY = scaleY * (maxY - minY + ((maxY - minY) / 20));
			var camZ = scaleZ * (maxZ - minZ + ((maxZ - minZ) / 20));
			if(maxZ == minZ) {
				camZ = scaleZ;
			}
			if(maxX == minX) {
				camX = scaleX;
			}
			if(maxY == minY) {
				camY = scaleY;
			}

			$log.log("camera.position.set(" + camX + ", " + camZ + ", " + camY + ")");
			defaultControlSpeed = Math.ceil(((Math.max(camX, camY, camZ)/10)+1)/10)*10;
			camera.position.set(camX, camZ, camY);
			camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};

			if($scope.gimme("objectTargetEnabled")){
				camera.lookAt(centerPoint);
				if(controls.target){ controls.target = centerPoint; }
			}
			else{
				camera.lookAt(new THREE.Vector3(0, 0, 0));
				if(controls.target){ controls.target = new THREE.Vector3(0, 0, 0); }
			}
		} else {
			dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
			dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
			dotsGeometry.addAttribute( 'dataValue', new THREE.BufferAttribute( dataValues, 1 ) );
		}
	}
	//========================================================================================



	//=== ADDITIONAL 3D DRAWING SUPPORT FUNCTIONS ======================================================================

    //========================================================================================
    // Create Shader Material
    // Creates a shader material based on current slot settings.
    //========================================================================================
	var createShaderMaterial = function(){
		var texturePath = getTextureImageFilePath();
		var isTextureEnabled = ($scope.gimme("particleAlphaTexture") != availableTextures.None);
		var pcb = $scope.gimme("PixelColorBlending");
		var blendMode = THREE.NormalBlending;
		if(pcb == pixelColorBlending.None){ blendMode = THREE.NoBlending }
		//if pcb == pixelColorBlending.Normal blend mode is already set to normal
		else if($scope.gimme("PixelColorBlending") == pixelColorBlending.Additive){ blendMode = THREE.AdditiveBlending }
		else if($scope.gimme("PixelColorBlending") == pixelColorBlending.Subtractive){ blendMode = THREE.SubtractiveBlending }
		else if($scope.gimme("PixelColorBlending") == pixelColorBlending.Multiply){ blendMode = THREE.MultiplyBlending }

		uniforms = {
			texture:   { value: new THREE.TextureLoader().load( internalFilesPath + texturePath ) },
			textureEnabled :  { value: isTextureEnabled }
		};

		var shaderMaterial = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader:   $scope.theView.parent().find("#vertexshader")[0].textContent,
			fragmentShader: $scope.theView.parent().find("#fragmentshader")[0].textContent,
			blending:       blendMode,
			depthTest:      false,
			transparent:    true
		});

		return shaderMaterial;
	};
    //========================================================================================


	//========================================================================================
	// Set Particle Attributes
	// Apply attributes, such as size and color, to each particle based on the data value for
	// each data point (and possible required min/max size slots)
	//========================================================================================
	var setParticleAttributes = function(dataValArr, colorAttrArr, sizeAttrArr){
		var sizeArrOk = (sizeAttrArr.length != undefined && sizeAttrArr.length == dataValArr.length);
		var colorArrOk = (colorAttrArr.length != undefined && colorAttrArr.length == dataValArr.length * 4);
		var minSize = $scope.gimme("particleMinSize");
		var maxSize = $scope.gimme("particleMaxSize");
		var sizeSpan = maxSize - minSize;
		var pAlpha, ut, at, btma, btmi;



		//???
		pAlpha = {underThreshold: 0.0, aboveThreshold: 1.0, betweenThresholdMin: 0.5, betweenThresholdMax: 1.0}
		ut = pAlpha.underThreshold; at = pAlpha.aboveThreshold; btma = pAlpha.betweenThresholdMax; btmi = pAlpha.betweenThresholdMin;





		for( var i=0 ; i < dataValArr.length ; i++ ) {

			var val = dataValArr[i];
			//???
			var pct = (val - minValueThreshold) / (thresholdRange != 0 ? thresholdRange : 1);

			if(sizeArrOk){
				sizeAttrArr[i] = minSize + sizeSpan * pct;
			}

			if(colorArrOk){
				var colVal, alphaVal;

				//-------
				// Jonas: I changed a lot of stuff here, but the whole function should probably be rewritten later.
				//-------
				if(droppedDataInfo.size3D > 0 || droppedDataInfo.sizeX > 0) {
					// points cloud

					//???
					alphaVal = (dataValArr[i] < minValueThreshold) ? ut : ((dataValArr[i] > maxValueThreshold) ? at : ((pct * btma) + btmi));

					// when 3DArray exists, dataValArr index maps to x,y,z indeces in 3D cube as:
					// y = k
					// x = n
					// z = i
					// posArrIndex + 1

					// matrixLocations[ posArrIndex + 1 ] = i;
					// matrixLocations[ posArrIndex + 2 ] = k;
					// matrixLocations[ posArrIndex + 0 ] = n;
					// densArrIndex++  -->  posArrIndex += 3;
					// dataValArr[i] --> i*3 == posArrIndex, posArrIndex+1 == z index, posArrIndex+2 == y index, posArrIndex+0 == x index


					// x,y,z,val maps to indeces as:
					// dataValArr[i]  -->  i*3 == posArrIndex, matrixLocations[posArrIndex] == selection function index
					//

					var posArrIndex = i*3;


					var groupId = 1;

					switch(droppedDataInfo.type) {
						// 	// this only works when there are no null values

						// case droppedDataInfoTypes.val3D:
						// 	var itemIdx = cubeNo * dataValArr.length + i;
						// 	groupId = droppedDataInfo.selFunValues(itemIdx);
						// 	break;

						// case droppedDataInfoTypes.xy3D:
						// case droppedDataInfoTypes.latlon3D:
						// 	var z = Math.floor(i / droppedDataInfo.sizeX / droppedDataInfo.sizeY);
						// 	var rem = i - z * droppedDataInfo.sizeX * droppedDataInfo.sizeY
						// 	var y = Math.floor(rem / droppedDataInfo.sizeX);
						// 	var x = rem - y * droppedDataInfo.sizeX;

						// 	groupId = droppedDataInfo.selFunY(y);
						// 	if(groupId > 0) {
						// 	    groupId = droppedDataInfo.selFunX(x);
						// 	}
						// 	break;

						// case droppedDataInfoTypes.xyz3D:
						// case droppedDataInfoTypes.latlonz3D:
						// 	var z = Math.floor(i / droppedDataInfo.sizeX / droppedDataInfo.sizeY);
						// 	var rem = i - z * droppedDataInfo.sizeX * droppedDataInfo.sizeY
						// 	var y = Math.floor(rem / droppedDataInfo.sizeX);
						// 	var x = rem - y * droppedDataInfo.sizeX;

						// 	groupId = droppedDataInfo.selFunZ(z);
						// 	if(groupId > 0) {
						// 	    groupId = droppedDataInfo.selFunY(y);
						// 	}
						// 	if(groupId > 0) {
						// 	    groupId = droppedDataInfo.selFunX(x);
						// 	}
						// 	break;

						// case droppedDataInfoTypes.xyval3D:
						// case droppedDataInfoTypes.latlonval3D:
						// case droppedDataInfoTypes.xyzval3D:
						// case droppedDataInfoTypes.latlonzval3D:

						// 	var itemIdx = cubeNo * dataValArr.length + i;
						// 	groupId = droppedDataInfo.selFunValues(itemIdx);
						// 	break;

						// case droppedDataInfoTypes.xyval:
						// case droppedDataInfoTypes.latlonval:
						// case droppedDataInfoTypes.xyz:
						// case droppedDataInfoTypes.latlonz:
						// case droppedDataInfoTypes.xyzval:
						// case droppedDataInfoTypes.latlonzval:
						// 	groupId = droppedDataInfo.selFunX(i);
						// 	break;


						// this only works when there are no null values

						case droppedDataInfoTypes.val3D:
							var cubeXidx = matrixLocations[posArrIndex];
							var cubeYidx = matrixLocations[posArrIndex+2];
							var cubeZidx = matrixLocations[posArrIndex+1];

							var itemIdx = cubeNo * Math.floor(droppedDataInfo.size3Dv / droppedDataInfo.size3D) + cubeXidx + droppedDataInfo.sizeX*(cubeYidx + droppedDataInfo.sizeY*cubeZidx);
							groupId = droppedDataInfo.selFunValues(itemIdx);
							break;

						case droppedDataInfoTypes.xy3D:
						case droppedDataInfoTypes.latlon3D:
							var cubeYidx = matrixLocations[posArrIndex+2];

							groupId = droppedDataInfo.selFunY(cubeYidx);
							if(groupId > 0) {
								var cubeXidx = matrixLocations[posArrIndex];
								groupId = droppedDataInfo.selFunX(cubeXidx);
							}
							break;

						case droppedDataInfoTypes.xyz3D:
						case droppedDataInfoTypes.latlonz3D:
							var cubeZidx = matrixLocations[posArrIndex+1];
							groupId = droppedDataInfo.selFunZ(cubeZidx);

							if(groupId > 0) {
								var cubeYidx = matrixLocations[posArrIndex+2];
								groupId = droppedDataInfo.selFunY(cubeYidx);
							}
							if(groupId > 0) {
								var cubeXidx = matrixLocations[posArrIndex];
								groupId = droppedDataInfo.selFunX(cubeXidx);
							}
							break;

						case droppedDataInfoTypes.xyval3D:
						case droppedDataInfoTypes.latlonval3D:
						case droppedDataInfoTypes.xyzval3D:
						case droppedDataInfoTypes.latlonzval3D:

							var cubeXidx = matrixLocations[posArrIndex];
							var cubeYidx = matrixLocations[posArrIndex+2];
							var cubeZidx = matrixLocations[posArrIndex+1];

							var itemIdx = cubeNo * Math.floor(droppedDataInfo.size3Dv / droppedDataInfo.size3D) + cubeXidx + droppedDataInfo.sizeX*(cubeYidx + droppedDataInfo.sizeY*cubeZidx);
							groupId = droppedDataInfo.selFunValues(itemIdx);
							break;

						case droppedDataInfoTypes.xyval:
						case droppedDataInfoTypes.latlonval:
						case droppedDataInfoTypes.xyz:
						case droppedDataInfoTypes.latlonz:
						case droppedDataInfoTypes.xyzval:
						case droppedDataInfoTypes.latlonzval:
							groupId = droppedDataInfo.selFunX(matrixLocations[posArrIndex]);
							break;

					} // switch droppedDataInfo.type

					//???
					var allValues = [minValueThreshold, maxValueThreshold];

					colVal = groupAndValTo3Dcolor(val, groupId, allValues, alphaVal);

					if(groupId <= 0) {
						alphaVal *= 0.01;
					}

				}

				colorAttrArr[ (i * 4) + 0 ] = colVal[0];
				colorAttrArr[ (i * 4) + 1 ] = colVal[1];
				colorAttrArr[ (i * 4) + 2 ] = colVal[2];
				colorAttrArr[ (i * 4) + 3 ] = colVal[3];
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Enable Geo Location Support
	// Turns on or off the visibility of all geo location support, such as a map plane and a
	// blue sky etc.
	//========================================================================================
	var enableGeoLocationSupport = function(){
		if(scene){
			var preDefArea = $scope.gimme("preDefinedGeoArea");
			var custGeoMap = $scope.gimme("customGeoMapImage");
			var custHeightMap = $scope.gimme("customHeightMapImage");

			if(preDefArea != "None" || custGeoMap != "" || custHeightMap != ""){
				lightAmb.intensity = 1.0;
				light.intensity = 0.1;

				if(mapPlane != undefined){
					scene.remove(mapPlane);
					mapPlane = undefined;
				}

				var planeFront, heightMap, coords = $scope.gimme("customMinMaxCoordinates");
				if(preDefArea != "None"){
					planeFront = internalFilesPath + '/images/GeoData/' + preDefArea + '-map.jpg';
					heightMap = internalFilesPath + '/images/GeoData/' + preDefArea + '-disp.png';
					if(predefCoords != undefined) { coords = predefCoords[preDefArea]; }
				}
				else{
					planeFront = (custGeoMap != "" ? custGeoMap : internalFilesPath + '/images/Empty_GeoMap.png');
					heightMap = (custHeightMap != "" ? custHeightMap : internalFilesPath + '/images/Flat_HeightMap.png');
					if(coords.max == undefined || coords.min == undefined || coords.max.lat == undefined) { coords = defaultCoord; }
				}

				var planeBack = ($scope.gimme("backsideMapEnabled")) ? planeFront : internalFilesPath + '/images/soil.png';

				var loader = new THREE.TextureLoader();
				loader.crossOrigin = '';
				loader.load(
					planeFront,
					function ( textureFront ) {
						mapPlaneColorTexture = textureFront;
						loader.load(
							heightMap,
							function ( textureTopology ) {
								mapPlaneDisplacementTexture = textureTopology;
								loader.load(
									planeBack,
									function ( textureBack ) {
										var geoPosMin = convertLatLngToUtm(coords.min.lat, coords.min.lon);
										var geoPosMax = convertLatLngToUtm(coords.max.lat, coords.max.lon);
										var scale = ((1000 / (geoPosMax[0]-geoPosMin[0])) < (1000 / (geoPosMax[1]-geoPosMin[1])) ? (1000 / (geoPosMax[0]-geoPosMin[0])) : (1000 / (geoPosMax[1]-geoPosMin[1])));

										// Getting the XYZ positions for each corner from real world coordinates
										var cld = geoPosMin;											//Corner-Left-Down
										var clu = convertLatLngToUtm(coords.min.lat, coords.max.lon);   //Corner-Left-Up
										var crd = convertLatLngToUtm(coords.max.lat, coords.min.lon);	//Corner-Right-Down
										var cru = geoPosMax;											//Corner-Right-Up

										// Creating the geometry vertices, scaled and translated similar to the data
										var geometry = new THREE.Geometry();
										geometry.vertices.push(new THREE.Vector3((cld[0]-cld[0]) * scale,0,(cru[1]-cld[1]) * scale)); //cld
										geometry.vertices.push(new THREE.Vector3((clu[0]-cld[0]) * scale,0,(cru[1]-clu[1]) * scale)); //clu
										geometry.vertices.push(new THREE.Vector3((crd[0]-cld[0]) * scale,0,(cru[1]-crd[1]) * scale)); //crd
										geometry.vertices.push(new THREE.Vector3((cru[0]-cld[0]) * scale,0,(cru[1]-cru[1]) * scale)); //cru

										// Creating the geometry faces and the UV coordinates
										geometry.faces.push( new THREE.Face3(2,0,1) );
										geometry.faces.push( new THREE.Face3(1,3,2) );
										geometry.faceVertexUvs[0].push([ new THREE.Vector2(0,1), new THREE.Vector2(0,0), new THREE.Vector2(1,0) ]);
										geometry.faceVertexUvs[0].push([ new THREE.Vector2(1,0), new THREE.Vector2(1,1), new THREE.Vector2(0,1) ]);

										// Create a new instance of the subdivision modifier and pass the number of divisions, and if shape should be retained and then apply it to the geometry.
										var modifier = new THREE.SubdivisionModifier(7, true);
										modifier.modify( geometry );

										// Make the faces double sided with independant textures for each side
										for (var i = 0, len = geometry.faces.length; i < len; i++) {
											var face = geometry.faces[i].clone();
											face.materialIndex = 1;
											geometry.faces.push(face);
											geometry.faceVertexUvs[0].push(geometry.faceVertexUvs[0][i].slice(0));
										}

										// Creating the materials (using textures) for the geometry
										var displacementScale = coords.highestPointMeter * scale * 2; // double it for a more visual effect ...but not reality accuracy
										var materials = [new THREE.MeshPhongMaterial({map: mapPlaneColorTexture, displacementMap: mapPlaneDisplacementTexture, displacementScale: displacementScale, side: THREE.FrontSide, depthWrite: false, transparent: ($scope.gimme("mapOpacity") < 1), opacity: $scope.gimme("mapOpacity")}), new THREE.MeshPhongMaterial({map: textureBack, side: THREE.BackSide, depthWrite: false, transparent: ($scope.gimme("mapOpacity") < 1), opacity: $scope.gimme("mapOpacity")})];

										// Creating a mesh using the geometry and materials created above and add it to the scene
										mapPlane = new THREE.Mesh( geometry, new THREE.MultiMaterial(materials) ) ;
										mapPlane.renderOrder = 0;
										mapPlane.name = 'Map_Plane';
										scene.add( mapPlane );

										if(particles == undefined){
											var xPos = geometry.vertices[1].x / 2;
											centerPoint = new THREE.Vector3( xPos, 0, geometry.vertices[0].z / 2);
											camera.position.set(xPos, xPos, geometry.vertices[0].z);
											camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
											camera.lookAt(centerPoint);
											if(controls.target){ controls.target = centerPoint; }
										}
										light.target = mapPlane;
									},
									function ( xhr ) { /*Do nothing */},
									function ( xhr ) { $log.log( 'An error happened when loading soil texture' ); }
								);
							},
							function ( xhr ) { /*Do nothing */},
							function ( xhr ) { $log.log( 'An error happened when loading terrain topology texture' ); }
						);
					},
					function ( xhr ) { /*Do nothing */},
					function ( xhr ) { $log.log( 'An error happened when loading map texture' ); }
				);
			}
			else {
				lightAmb.intensity = 0.1;
				light.intensity = 1.0;

				if(mapPlane != undefined){
					scene.remove(scene.getObjectByName('Map_Plane'));
					mapPlane = undefined;
				}

				if(particles == undefined) {
					var ccm = $scope.gimme("cameraControllerMode");
					if(ccm == CameraInteractionMode.Orbit || ccm == CameraInteractionMode.Trackball){ controls.reset() }
					camera.position.set(7, 7, 15);
					camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
					camera.lookAt(new THREE.Vector3(0, 0, 0));
				}
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Clear Data From Scene
	// Removes all data related meshes and geometry and resets the background
	//========================================================================================
	$scope.clearData = function() {
		droppedDataMappings = [];
		droppedDataInfo = {type: "none"};
		cubeNo = -1;
		centerPoint = new THREE.Vector3(0,0,0);
		myInstanceId = -1;
		lastSeenDataSeqNo = -1;
		lastSeenSelectionSeqNo = -1;

		if(scene){
			setBackgroundColor();

			if(particles != undefined) {
				particles.geometry.dispose();
				particles.material.dispose();
				scene.remove(particles);
				particles = undefined;
			}

			var ccm = $scope.gimme("cameraControllerMode");
			if(ccm == CameraInteractionMode.Orbit || ccm == CameraInteractionMode.Trackball){ controls.reset() }
			if($scope.gimme("preDefinedGeoArea") != "None" && mapPlane != undefined){
				lightAmb.intensity = 1.0;
				light.intensity = 0.1;
				var xPos = mapPlane.geometry.vertices[1].x / 2;
				centerPoint = new THREE.Vector3( xPos, 0, mapPlane.geometry.vertices[0].z / 2);
				camera.position.set(xPos, xPos, mapPlane.geometry.vertices[0].z);
				camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
				camera.lookAt(centerPoint);
				if(controls.target){ controls.target = centerPoint; }
			}
			else{
				lightAmb.intensity = 0.1;
				light.intensity = 1.0;
				camera.position.set(7, 7, 15);
				camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
				camera.lookAt(new THREE.Vector3(0, 0, 0));
				if(controls){ controls.target = new THREE.Vector3(0, 0, 0); }
			}
		}
		for(var i = 0; i < (info.length - 1); i++){ info[i].innerHTML = ""; }
		$log.log("Cleared and reset the Scene and all data");
	};
	//========================================================================================


	//========================================================================================
	// Build Color Cache
	// Creates a color group cache from the color scheme
	//========================================================================================
	function buildColorCache() {
		groupColors = {};
		if(colorScheme !== null && colorScheme !== undefined && colorScheme.hasOwnProperty('groups')) {
			for(var group in colorScheme.groups) {
				if(colorScheme.groups.hasOwnProperty(group)&& colorScheme.groups[group].hasOwnProperty('color')) {
					groupColors[group] = hexColorToRGBAvec(colorScheme.groups[group].color, 1);
				}
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// Hex Color To RGBA (Vector)
	// Converts a color and an alpha value into a RGBA separated array
	//========================================================================================
	function hexColorToRGBAvec(color, alpha) {
		var res = [];

		if(typeof color === 'string'
			&& color.length == 7) {

			var r = parseInt(color.substr(1,2), 16) / 255;
			var g = parseInt(color.substr(3,2), 16) / 255;
			var b = parseInt(color.substr(5,2), 16) / 255;
			var a = Math.max(0, Math.min(1, alpha));
			return [r, g, b, a];
		}
		return [1, 1, 1, alpha];
	}
	//========================================================================================


	//========================================================================================
	// binLookup
	// This function finds the index of a value in a sorted vector, and is used to choose a
	// color based on all the values present
	//========================================================================================
	function binLookup(ls, val, start, end) {
		if(start == end) {
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
				return binLookup(ls, val, mid, end);
			} else {
				return binLookup(ls, val, start, mid);
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// Group And Value To 3D Color
	// This function assigns a color of a cell based on the slot that specifies how to choose
	// colors and the value in a cell (and possible all the other available values).
	//========================================================================================
	function groupAndValTo3Dcolor(val, groupId, allValues, alpha) {
		var rgba = [0, 0, 0, 1];

		if(colorMethod == colorMethodOptions.GroupColAlphaHisto) {
			var len = allValues.length;
			var idx = Math.max(0, binLookup(allValues, val, 0, len));

			if(groupColors.hasOwnProperty(groupId)) {
				var crgba = groupColors[groupId];
			}
			else {
				var crgba = [1, 1, 1, 1];
			}

			for(var c = 0; c < 3; c++) {
				rgba[c] = crgba[c] * 0.25 + 0.75 * idx / (len - 1);
			}
		}
		else if(colorMethod == colorMethodOptions.GroupColAlphaMinMax) {
			var span = allValues[1] - allValues[0];
			var prop = 1;
			if(span > 0) {
				prop = (val - allValues[0]) / span;
			}

			if(groupColors.hasOwnProperty(groupId)) {
				var crgba = groupColors[groupId];
			}
			else {
				var crgba = [1, 1, 1, 1];
			}

			for(var c = 0; c < 3; c++) {
				rgba[c] = crgba[c]; // * 0.25 + 0.75 * prop;
			}

		}
		else if(colorMethod == colorMethodOptions.ColorKey) {
			var idx = 0;
			if(colorKey && colorKey.length > 0) {
				if(typeof colorKey[0] != 'string' && colorKey[0].length > 1) { // colors and limits

					if(val <= colorKey[0][0]) {
						idx = 0;
					}
					else if(val >= colorKey[colorKey.length - 1][1]) {
						idx = colorKey.length - 1;
					}
					else {
						for(var i = 0; i < colorKey.length; i++) {
							idx = i;
							if(val < colorKey[i][1]) {
								break;
							}
						}
					}

					var cc = colorKey[idx][2];
					if(cc.length == 9) { // contains alpha
						var alphaCC = parseInt(cc.substr(7,2), 16);
						var cc = cc.substr(0,7);
						rgba = hexColorToRGBAvec(cc, alphaCC / 255.0);
					}
					else {
						rgba = hexColorToRGBAvec(cc, alpha);
					}

				}
				else { // only colors
					var span = allValues[allValues.length - 1] - allValues[0];
					var prop = 0;
					if(span > 0) {
						prop = (val - allValues[0]) / span;
					}
					idx = Math.min(colorKey.length - 1, Math.round(prop * colorKey.length));

					var cc = colorKey[idx];
					if(cc.length == 9) { // contains alpha
						var alphaCC = parseInt(cc.substr(7,2), 16);
						rgba = hexColorToRGBAvec(cc, alphaCC / 255.0);
					} else {
						rgba = hexColorToRGBAvec(cc, alpha);
					}
				}
			}
		}

		return rgba;
	}
	//========================================================================================



    //=== ADDITIONAL SUPPORT FUNCTIONS ======================================================================

	//========================================================================================
	// Create Info Elements
	// Creates three Jquery text element for info display in top left, top right and bottom
	// area of the render window
	//========================================================================================
	var createInfoElements = function() {
		var ies = [3];
		for(var i = 0; i < 3; i++){
			var ie = document.createElement( 'div' );
			var ieStyle = 'position: absolute; top: 12px; left: 14px; width: 30%; text-align: left; color: white; font-size: 14px; font-weight: normal;';
			if(i == 1){ ieStyle = 'position: absolute; top: 12px; right: 14px; width: 40%; text-align: right; color: yellow; font-size: 14px; font-weight: normal;'; }
			if(i == 2){ ieStyle = 'position: absolute; bottom: 10px; left: 14px; width: 100%; text-align: left; color: lightGray; font-size: 12px; font-weight: normal;'; }
			ie.setAttribute( 'style', ieStyle );
			ie.innerHTML = '';
			ies[i] = ie;
			($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild( ies[i] );
		}

		return ies;
	};
	//========================================================================================


    //========================================================================================
    // Build Axis
    // Creates one axis in a specific color and style
    //========================================================================================
	var buildAxis = function( src, dst, colorHex, dashed ) {
		var geom = new THREE.Geometry(),
			mat;

		if(dashed) {
			mat = new THREE.LineDashedMaterial({ linewidth: 5, color: colorHex, dashSize: 3, gapSize: 3 });
		} else {
			mat = new THREE.LineBasicMaterial({ linewidth: 5, color: colorHex });
		}

		geom.vertices.push( src.clone() );
		geom.vertices.push( dst.clone() );
		geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

		var axis = new THREE.Line( geom, mat, THREE.LineSegments );

		return axis;
	};
    //========================================================================================


    //========================================================================================
    // Build Axes
    // Creates a set of 6 axes starting from the origo point in all postive and negative
    // x,y,z directions of a specified length.
    //========================================================================================
	var buildAxes = function( length ) {
		var axes = new THREE.Object3D();

		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
		axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

		return axes;
	};
    //========================================================================================


	//========================================================================================
	// Execute Axis Visbility State
	// Turns on or off the visibility of the x y z axis depending on its current enabled state
	//========================================================================================
	var executeAxisVisbilityState = function(){
		if(scene){
			// Make sure the visibility of x y z axes is correct
			if($scope.gimme("AxesEnabled") && axes == undefined){
				axes = buildAxes( 1000 );
				axes.name = 'Axes';
				scene.add(axes);
			}
			else if(!$scope.gimme("AxesEnabled") && axes !== undefined){
				scene.remove(axes);
				axes = undefined;
			}

			animate();
		}
	};
	//========================================================================================


	//========================================================================================
	// Get Texture Image Path
	// Creates the texture image path for a selected texture.
	//========================================================================================
	var getTextureImageFilePath = function(){
		var pat = $scope.gimme("particleAlphaTexture");
		var texturePath = '/images/';
		if(pat == availableTextures.None){ texturePath += "empty.png" }
		else if(pat == availableTextures.Spark){ texturePath += "Particle Texture - Spark 01.png" }
		else if(pat == availableTextures.FadingCircle){ texturePath += "Particle Texture - Fading Edges Circle 01.png" }
		else if(pat == availableTextures.Cloud_1){ texturePath += "Particle Texture - Cloud 01.png" }
		else if(pat == availableTextures.Cloud_2){ texturePath += "Particle Texture - Cloud 02.png" }
		else if(pat == availableTextures.Smoke){ texturePath += "Particle Texture - Smoke 01.png" }

		return texturePath;
	};
	//========================================================================================


	//========================================================================================
	// Get XYZ From Coordinates
	// Return the three.js XYZ position from map coordinates (where the minCoord is the zero
	// position). The method returns the three.js units distance and from zero coordinate to
	// thisCoord as the X, Y and Z distance from zero.
	// coord variables come as arrays [lat, long]
	//========================================================================================
	var getXYZFromCoords = function(minCoord, thisCoord, height){
		if(typeof(Number.prototype.toRadians) === "undefined") {
			Number.prototype.toRadians = function() {
				return this * Math.PI / 180;
			}
		}

		var R = 6371e3; // metres
		var lat1 = minCoord[0], lon1 = minCoord[1], lat2 = thisCoord[0], lon2 = thisCoord[1];
		lat2 = lat1;

		var φ1 = lat1.toRadians();
		var φ2 = lat2.toRadians();
		var Δφ = (lat2-lat1).toRadians();
		var Δλ = (lon2-lon1).toRadians();

		var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

		var dx = R * c;

		lat2 = thisCoord[0]
		lon2 = lon1;
		φ2 = lat2.toRadians();
		Δφ = (lat2-lat1).toRadians();
		Δλ = (lon2-lon1).toRadians();

		var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

		var dz = R * c;

		var dy = (height != undefined ? height : 0);

		return [dx/meterPerThreeJSUnit, dy/meterPerThreeJSUnit, dz/meterPerThreeJSUnit];
	};
	//========================================================================================


	//========================================================================================
	// Get Distance Between Map Coordinates
	// Calculates the distance in metres between two map coordinates expressed in latitudes
	// and longitudes.
	//========================================================================================
	var getDistanceBetweenMapCoordinates = function (lat1, lon1, lat2, lon2){
		var R = 6378.137; // Radius of earth in KM
		var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
		var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;
		return d * 1000; // meters
	};
	//========================================================================================


	//========================================================================================
	// Set Background Color
	// Sets the background color of the render window based on either skin or webble
	// background values.
	//========================================================================================
	var setBackgroundColor = function (){
		if(colorScheme !== null && colorScheme !== undefined && colorScheme.hasOwnProperty("skin") && colorScheme.skin.hasOwnProperty("color") && isAnyDataActive()) {
			//var canvasBkgColor = hexColorToRGBAvec(colorScheme.skin.color, 1);
			var theColor = ($scope.gimme("localGlobalColorEqual") ? colorScheme.skin.color : $scope.gimme("threeDPlusHolder:background-color"));
			scene.background = new THREE.Color(theColor);
			$scope.set("threeDPlusContainer:background-color", colorScheme.skin.border);
			if($scope.gimme("localGlobalColorEqual")){ $scope.getSlot("threeDPlusHolder:background-color").setValue(colorScheme.skin.color); }
		}
		else {
			scene.background = new THREE.Color( $scope.gimme("threeDPlusHolder:background-color") );
		}

		// Set text contrast
		var fore = [getColorContrast(undefined, ['darkgreen', 'yellow']), getColorContrast(undefined, ['darkred', 'pink']), getColorContrast()];
		for(var i = 0; i < info.length; i++){ $(info[i]).css('color', fore[i]); }

	};
	//========================================================================================


	//========================================================================================
	// Get Color Contrast
	// gets the contrast color of either the background color or an optional color sent as
	// a hex string parameter and an optional two color array if black and white is not enough.
	//========================================================================================
	var getColorContrast = function(inColor, contrastOptionArray ){
		if(inColor == undefined){ inColor = scene.background.getHexString() };
		if(contrastOptionArray == undefined){ contrastOptionArray = ['black', 'white'] };
		var rgb = chroma(inColor).rgba()
		var o = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
		return ((o > 125) ? contrastOptionArray[0] : contrastOptionArray[1]);
	};
	//========================================================================================


	//========================================================================================
	// Set Camera Controls
	// sets the controls variable that manage the camera movement to be of a certain kind
	// with a certain behavior.
	//========================================================================================
	var setCameraControls = function(){
		var camCtrl = $scope.gimme("cameraControllerMode");
		if(controls){ controls.dispose(); controls = undefined; }
		if(clock){ clock = undefined; }

		if (camCtrl == CameraInteractionMode.Fly){
			clock = new THREE.Clock();
			controls = new THREE.FlyControls( camera, threeDPlusHolder[0] );
			controls.domElement = threeDPlusHolder[0];
			controls.movementSpeed = defaultControlSpeed;
			controls.rollSpeed = defaultControlSpeed / 10;
			controls.autoForward = false;
			controls.dragToLook = true;
			info[2].innerHTML = "Fly Controls (movement speed: " + controls.movementSpeed + " (Num +/-)) (WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw) ( .(dot): Reset Camera)";
		}
		else if(camCtrl == CameraInteractionMode.Orbit){
			controls = new THREE.OrbitControls( camera, threeDPlusHolder[0] );
			controls.zoomSpeed = defaultControlSpeed / 10;
			controls.autoRotate = $scope.gimme('autoOrbit');
			info[2].innerHTML = "Orbit Controls (zoom speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Orbit: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right) ( .(dot): Reset Camera)";
		}
		else if(camCtrl == CameraInteractionMode.Trackball){
			controls = new THREE.TrackballControls( camera, threeDPlusHolder[0] );
			controls.zoomSpeed = defaultControlSpeed / 10;
			controls.rotateSpeed = defaultControlSpeed / 10;
			controls.panSpeed = defaultControlSpeed / 10;
			controls.noZoom = false;
			controls.noPan = false;
			controls.staticMoving = true;
			controls.dynamicDampingFactor = 0.3;
			controls.addEventListener( 'change', render );
			info[2].innerHTML = "Trackball Controls (Movement speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Rotate: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right) ( .(dot): Reset Camera)w";
		}

		var tPoint = new THREE.Vector3(0,0,0);
		if(camCtrl == CameraInteractionMode.Orbit && $scope.gimme("objectTargetEnabled") == true){
			tPoint = centerPoint;
		}
		if(controls.target){ controls.target = tPoint; }
		camera.lookAt(tPoint);
	};
	//========================================================================================


	//========================================================================================
	// Is Any Data Active
	// Returns true if there is any data active (Valid and displayed) in the Webble
	//========================================================================================
	var isAnyDataActive = function(){
		var isAnyActive = false;
		for(var src = 0; src < droppedDataMappings.length; src++) {
			if(droppedDataMappings[src].active){
				isAnyActive = true;
				break;
			}
		}
		return isAnyActive;
	};
	//========================================================================================


	//========================================================================================
	// Is Inside
	// Returns true if a point is inside a polygon area of points
	//========================================================================================
	function isInside(point, polyArea) {
		var x = point[0], y = point[1];

		var inside = false;
		for (var i = 0, j = polyArea.length - 1; i < polyArea.length; j = i++) {
			var xi = polyArea[i][0], yi = polyArea[i][1];
			var xj = polyArea[j][0], yj = polyArea[j][1];

			var intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	};
	//========================================================================================



	//=== FUNCTIONS FOR DRAG & DROP FUNCTIONALITY IN RELATION TO DATA SOURCES =========================================

	//========================================================================================
	// Update Drop Zones Size
	// Webble resize triggered event that make sure the data drop zones elements also change
	// accordingly.
	//========================================================================================
	function updateDropZonesSize(W, H) {
		if(dropCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(canvasElement.length > 0) {
				dropCanvas = canvasElement[0];
			}
		}

		var b1 = $scope.gimme("threeDPlusHolder:border");
		var b2 = $scope.gimme("threeDPlusContainer:border");

		var b1v = parseInt(b1);
		var b2v = parseInt(b2);
		var border = 10;
		if(!isNaN(b1v)) {
			border += b1v;
		}
		if(!isNaN(b2v)) {
			border += b2v;
		}

		if(dropCanvas) {
			dropCanvas.width = W + border * 2;
			dropCanvas.height = H + border * 2;
			selectCanvas[0].width = dropCanvas.width - 22;
			selectCanvas[0].height = dropCanvas.height - 22;
		}

		var margW = 20;
		var margH = 20;
		var zoneW = Math.floor((W - margW * 5) / 5);
		var zoneH = Math.floor((H - margH * 3) / 2);

		if(zoneW < 10) {
			Math.floor(W / 5);
			margW = 0;
		}
		if(zoneW < 1) {
			zoneW = 1;
			margW = 0;
		}

		if(zoneH < 10) {
			zoneH = Math.floor(H / 2);
			margH = 0;
		}
		if(zoneH < 1) {
			zoneH = 1;
			margH = 0;
		}

		dropVal.left = margW;
		dropVal.top = margH;
		dropVal.right = margW + zoneW * 2;
		dropVal.bottom = margH + zoneH;

		drop3D.left = margW;
		drop3D.top = margH * 2 + zoneH;
		drop3D.right = margW + zoneW * 2;
		drop3D.bottom = H - margH;

		dropZ.left = margW * 2 + zoneW * 2;
		dropZ.top = margH;
		dropZ.right = margW * 2 + zoneW * 3;
		dropZ.bottom = H - margH;

		dropY.left = margW * 3 + zoneW * 3;
		dropY.top = margH;
		dropY.right = margW * 3 + zoneW * 4;
		dropY.bottom = H - margH;

		dropX.left = margW * 4 + zoneW * 4;
		dropX.top = margH;
		dropX.right = margW * 4 + zoneW * 5;
		dropX.bottom = H - margH;
	}
	//========================================================================================


	//========================================================================================
	// Get Text Width of Current Font
	// Returns the text width for the current font of the text displayed in the drag and drop
	// areas.
	//========================================================================================
	function getTextWidthCurrentFont(text) {
		if(dropCanvas !== null && dropCanvas !== undefined) {
			var dropCtx = dropCanvas.getContext("2d");
			if(dropCtx !== null && dropCtx !== undefined) {
				var metrics = dropCtx.measureText(text);
				return metrics.width;
			}
		}
		return 0;
	}
	//========================================================================================


	//========================================================================================
	// Update Drop Zones
	// Make sure each dropzone element for different data is proportioned correctly depending
	// on Webble size etc.
	//========================================================================================
	function updateDropZones(alpha, hover) {
		if(dropCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(canvasElement.length > 0) {
				dropCanvas = canvasElement[0];
			}
		}

		if(dropCanvas) {
			var dropCtx = dropCanvas.getContext("2d");

			var W = dropCanvas.width;
			var H = dropCanvas.height;

			var margW = 20;
			var margH = 20;
			var zoneW = Math.floor((W - margW * 5) / 5);
			var zoneH = Math.floor((H - margH * 3) / 2);

			if(zoneW < 10) {
				Math.floor(W / 5);
				margW = 0;
			}
			if(zoneW < 1) {
				zoneW = 1;
				margW = 0;
			}

			if(zoneH < 10) {
				zoneH = Math.floor(H / 2);
				margH = 0;
			}
			if(zoneH < 1) {
				zoneH = 1;
				margH = 0;
			}

			dropVal.left = margW;
			dropVal.top = margH;
			dropVal.right = margW + zoneW * 2;
			dropVal.bottom = margH + zoneH;

			drop3D.left = margW;
			drop3D.top = margH * 2 + zoneH;
			drop3D.right = margW + zoneW * 2;
			drop3D.bottom = H - margH;

			dropZ.left = margW * 2 + zoneW * 2;
			dropZ.top = margH;
			dropZ.right = margW * 2 + zoneW * 3;
			dropZ.bottom = H - margH;

			dropY.left = margW * 3 + zoneW * 3;
			dropY.top = margH;
			dropY.right = margW * 3 + zoneW * 4;
			dropY.bottom = H - margH;

			dropX.left = margW * 4 + zoneW * 4;
			dropX.top = margH;
			dropX.right = margW * 4 + zoneW * 5;
			dropX.bottom = H - margH;

			dropCtx.clearRect(0,0, W,H);

			var fontSize = 11; // get this from CSS, maybe?
			var textColor = "black"; // get this from CSS, maybe?

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
						var tw = getTextWidthCurrentFont(str);
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
	//========================================================================================


	//========================================================================================
	// Setup Droppable
	// Creates the drop zone event listening for data drops
	//========================================================================================
	$scope.setupDroppable = function () {
		$scope.theView.find('#theDropCanvas').droppable({
			over: function (e, ui) {
				if (e.target.id == "theDropCanvas") {
					updateDropZones(1, true);
				}
			},
			out: function () {
				updateDropZones(0.3, false);
			},
			tolerance: 'pointer',
			drop: function (e, ui) {
				if (e.target.id == "theDropCanvas") {

					e.preventDefault();

					var xpos = e.offsetX;
					var ypos = e.offsetY;
					var ok = false;

					var x = e.originalEvent.pageX - $(this).offset().left;
					var y = e.originalEvent.pageY - $(this).offset().top;

					xpos = x;
					ypos = y;

					for (var d = 0; !ok && d < allDropZones.length; d++) {
						var dropZone = allDropZones[d];

						if (xpos <= dropZone.right
							&& xpos >= dropZone.left
							&& ypos >= dropZone.top
							&& ypos < dropZone.bottom) {

							f = dropZone.forMapping;
							ok = true;
						}
					}

					if (ok) {
						dataDropped(ui.draggable.attr('id'), f);
					}
				}

				updateDropZones(0.3, false);
			}
		});
	};
	//========================================================================================


	//========================================================================================
	// Data Drop Type Check
	// Check that the data dropped is something we can understand and use
	//========================================================================================
	function dataDropTypeCheck(t1, t2) {
		for(var i = 0; i < t1.length; i++) {
			for(var j = 0; j < t2.length; j++) {
				if(t1[i] == t2[j]) {
					// found a compatible interpretation of the types
					return 1;
				}
			}
		}
		return 0;
	}
	//========================================================================================


	//========================================================================================
	// Check Mappings & Parse Data
	// Parse the data received and figure out how to visualize it the best way possible
	//========================================================================================
	function checkMappingsAndParseData() {
		var atLeastOneActive = false;
		droppedDataInfo.latlon = false;
		droppedDataInfo.size3D = 0;

		for(var src = 0; src < droppedDataMappings.length; src++) {
			droppedDataMappings[src].active = false;
		}

		for(var src = 0; src < droppedDataMappings.length; src++) {
			var w = $scope.getWebbleByInstanceId(droppedDataMappings[src].srcID);
			var ls = w.scope().gimme(droppedDataMappings[src].slotName);

			var have3D = false;
			var haveX = false;
			var haveY = false;
			var haveZ = false;
			var haveValues = false;

			var haveLatitude = false;
			var haveLongitude = false;

			var size3D = 0;
			var size3Dv = 0;
			var size3Dx = 0;
			var size3Dy = 0;
			var size3Dz = 0;

			var sizeX = 0;
			var sizeY = 0;
			var sizeZ = 0;
			var sizeValues = 0;

			var fun3D = null;
			var funX = null;
			var funY = null;
			var funZ = null;
			var funValues = null;

			var selFun3D = null;
			var selFunX = null;
			var selFunY = null;
			var selFunZ = null;
			var selFunValues = null;

			for(var f = 0; f < droppedDataMappings[src].map.length; f++) {
				if(atLeastOneActive) { // only draw the first data set if we have many
					break;
				}

				if(droppedDataMappings[src].map[f].name == "3D") {
					have3D = true;

					var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
					if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, drop3D.forMapping.type)) {
						have3D = false;
					}
					else {
						size3D = fieldInfo.size;
						fun3D = fieldInfo.val;
						selFun3D = fieldInfo.sel;

						for(var d = 0; d < fieldInfo.size; d++) {
							var data = fieldInfo.val(d);
							if(data !== null) {
								size3Dz = data.length;
								if(size3Dz > 0) {
									size3Dy = data[0].length;
								}
								if(size3Dy > 0) {
									size3Dx = data[0][0].length;
								}
							}
							break;
						}
						size3Dv = size3D * size3Dz * size3Dy * size3Dx;
						droppedDataMappings[src].map[f].listen = fieldInfo.listen;
					}
				}

				if(droppedDataMappings[src].map[f].name == "X") {
					haveX = true;

					var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
					if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, dropX.forMapping.type)) {
						haveX = false;
					}
					else {
						sizeX = fieldInfo.size;
						funX = fieldInfo.val;
						selFunX = fieldInfo.sel;

						if(fieldInfo.type.indexOf("longitude") >= 0) {
							haveLongitude = true;
						}
						droppedDataMappings[src].map[f].listen = fieldInfo.listen;
					}
				}

				if(droppedDataMappings[src].map[f].name == "Y") {
					haveY = true;

					var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
					if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, dropY.forMapping.type)) {
						haveY = false;
					}
					else {
						sizeY = fieldInfo.size;
						funY = fieldInfo.val;
						selFunY = fieldInfo.sel;

						if(fieldInfo.type.indexOf("latitude") >= 0) {
							haveLatitude = true;
						}
						droppedDataMappings[src].map[f].listen = fieldInfo.listen;
					}
				}

				if(droppedDataMappings[src].map[f].name == "Z") {
					haveZ = true;

					var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
					if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, dropZ.forMapping.type)) {
						haveZ = false;
					}
					else {
						sizeZ = fieldInfo.size;
						funZ = fieldInfo.val;
						selFunZ = fieldInfo.sel;
						droppedDataMappings[src].map[f].listen = fieldInfo.listen;
					}
				}

				if(droppedDataMappings[src].map[f].name == "Values") {
					haveValues = true;

					var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
					if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, dropVal.forMapping.type)) {
						haveValues = false;
					}
					else {
						sizeValues = fieldInfo.size;
						funValues = fieldInfo.val;
						selFunValues = fieldInfo.sel;
						droppedDataMappings[src].map[f].listen = fieldInfo.listen;
					}
				}
			} // for each data field

			if(have3D && haveX && haveY && haveZ && haveValues
				&& size3Dx == sizeX
				&& size3Dy == sizeY
				&& size3Dz == sizeZ
				&& size3Dv == sizeValues
			) { // 3D + x + y + z + values

				$log.log("3D + x + y + z + values");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonzval3D;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyzval3D;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funZ = funZ;
				droppedDataInfo.funValues = funValues;
				droppedDataInfo.fun3D = fun3D;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunZ = selFunZ;
				droppedDataInfo.selFunValues = selFunValues;
				droppedDataInfo.selFun3D = selFun3D;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = sizeZ;
				droppedDataInfo.sizeValues = sizeValues;
				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "Values"
						|| droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
						|| droppedDataMappings[src].map[ff].name == "Z"
						|| droppedDataMappings[src].map[ff].name == "3D"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "3D") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(have3D && haveX && haveY && haveZ
				&& size3Dx == sizeX
				&& size3Dy == sizeY
				&& size3Dz == sizeZ
			) { // 3D + x + y + z

				$log.log("3D + x + y + z");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonz3D;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyz3D;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funZ = funZ;
				droppedDataInfo.fun3D = fun3D;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunZ = selFunZ;
				droppedDataInfo.selFun3D = selFun3D;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = sizeZ;
				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
						|| droppedDataMappings[src].map[ff].name == "Z"
						|| droppedDataMappings[src].map[ff].name == "3D"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "3D") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(have3D && haveX && haveY && haveValues
				&& size3Dx == sizeX
				&& size3Dy == sizeY
				&& size3Dv == sizeValues
			) { // no Z

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				$log.log("3D + x + y + values");

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonval3D;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyval3D;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funValues = funValues;
				droppedDataInfo.fun3D = fun3D;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunValues = selFunValues;
				droppedDataInfo.selFun3D = selFun3D;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = size3Dz;
				droppedDataInfo.sizeValues = sizeValues;
				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "Values"
						|| droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
						|| droppedDataMappings[src].map[ff].name == "3D"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "3D") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(have3D && haveX && haveY
				&& size3Dx == sizeX
				&& size3Dy == sizeY
			) { // 3D + x + y

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				$log.log("3D + x + y");

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlon3D;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xy3D;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.fun3D = fun3D;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFun3D = selFun3D;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = size3Dz;
				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "3D"
						|| droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "3D") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(have3D && haveValues
				&& size3Dv == sizeValues
			) { // 3D + values

				$log.log("3D + values");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				droppedDataInfo.type = droppedDataInfoTypes.val3D;

				droppedDataInfo.fun3D = fun3D;
				droppedDataInfo.funValues = funValues;

				droppedDataInfo.selFunValues = selFunValues;
				droppedDataInfo.selFun3D = selFun3D;

				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;
				droppedDataInfo.sizeValues = sizeValues;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "Values"
						|| droppedDataMappings[src].map[ff].name == "3D"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "3D") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(have3D) { // 3D
				$log.log("3D");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;
				droppedDataInfo.type = droppedDataInfoTypes.only3D;
				droppedDataInfo.fun3D = fun3D;
				droppedDataInfo.selFun3D = selFun3D;
				droppedDataInfo.size3D = size3D;
				droppedDataInfo.size3Dv = size3Dv;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "3D"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(haveX && haveY && haveZ && haveValues
				&& sizeX == sizeY
				&& sizeX == sizeZ
				&& sizeX == sizeValues
			) { // x + y + z + values

				$log.log("x + y + z + values");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonzval;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyzval;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funZ = funZ;
				droppedDataInfo.funValues = funValues;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunZ = selFunZ;
				droppedDataInfo.selFunValues = selFunValues;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = sizeZ;
				droppedDataInfo.sizeValues = sizeValues;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "Values"
						|| droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
						|| droppedDataMappings[src].map[ff].name == "Z"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "Values") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
			else if(haveX && haveY && haveZ
				&& sizeX == sizeY
				&& sizeX == sizeZ
			) { // x + y + z

				$log.log("x + y + z");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonz;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyz;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funZ = funZ;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunZ = selFunZ;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeZ = sizeZ;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
						|| droppedDataMappings[src].map[ff].name == "Z"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "X") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			} else if(haveX && haveY && haveValues
				&& sizeX == sizeY
				&& sizeX == sizeValues
			) { // x + y + val

				$log.log("x + y + val");

				atLeastOneActive = true;
				droppedDataMappings[src].active = true;

				if(haveLatitude && haveLongitude) {
					droppedDataInfo.type = droppedDataInfoTypes.latlonval;
					droppedDataInfo.latlon = true;
				}
				else {
					droppedDataInfo.type = droppedDataInfoTypes.xyval;
				}

				droppedDataInfo.funX = funX;
				droppedDataInfo.funY = funY;
				droppedDataInfo.funValues = funValues;

				droppedDataInfo.selFunX = selFunX;
				droppedDataInfo.selFunY = selFunY;
				droppedDataInfo.selFunValues = selFunValues;

				droppedDataInfo.sizeX = sizeX;
				droppedDataInfo.sizeY = sizeY;
				droppedDataInfo.sizeValues = sizeValues;

				countNullValues(have3D); // we want to know how many of the points we can draw
				var ls2 = []; // fields to listen to
				for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
					if(droppedDataMappings[src].map[ff].name == "Values"
						|| droppedDataMappings[src].map[ff].name == "X"
						|| droppedDataMappings[src].map[ff].name == "Y"
					) {
						ls2.push(droppedDataMappings[src].map[ff].srcIdx);

						if(droppedDataMappings[src].map[ff].name == "Values") {
							droppedDataMappings[src].listen = droppedDataMappings[src].map[ff].listen;
						}
					}
				}
				droppedDataMappings[src].listen(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, ls2);

			}
		} // for each source

		if(atLeastOneActive) {
			$timeout(function () { displayHourglassBeforeRedrawScene(false); });
		}
		else { // no data to draw
			$log.log("Data dropped but still no data to draw");
			droppedDataInfo.type = droppedDataInfoTypes.none;
		}
	}
	//========================================================================================


	//========================================================================================
	// Count NULL values
	// Goes through the data once to count how many points we have
	// that have NULL values for their coordinates or measurements
	// (i.e. how many of the points we will be unable to draw).
	//
	// The count of NULL values needs to be done per 3D-cube (if we
	// have more than one) or once for the whole set of data if we
	// have separate arrays of X/Y/Z/Values.
	//========================================================================================
	function countNullValues(have3D) {
		var haveX = false;
		var haveY = false;
		var haveZ = false;
		var haveValues = false;

		nullCounts3D = [];
		nullCountsVals = 0;

		if(have3D) {
			if(droppedDataInfo.type == droppedDataInfoTypes.xy3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xyval3D

				|| droppedDataInfo.type == droppedDataInfoTypes.latlon3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonval3D
			) {
				haveX = true;
				haveY = true;
			}
			if(droppedDataInfo.type == droppedDataInfoTypes.xyz3D
				|| droppedDataInfo.type == droppedDataInfoTypes.xyzval3D

				|| droppedDataInfo.type == droppedDataInfoTypes.latlonz3D
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval3D
			) {
				haveX = true;
				haveY = true;
				haveZ = true;
			}

			for(var c = 0; c < droppedDataInfo.size3D; c++) {
				var nullCount = 0;

				var ldb = droppedDataInfo.fun3D(c);

				for( var i=0 ; i < ldb.length ; i++ ) {

					for (var k = 0; k < ldb[i].length; k++) {

						for (var n = 0; n < ldb[i][k].length; n++) {

							var density = ldb[i][k][n];

							if(density === null) {
								nullCount += 1;
							} else {
								var posX = 0;
								var posY = 0;
								var posZ = 0;

								if(haveX && haveY) {
									posY = droppedDataInfo.funY(k);
									posX = droppedDataInfo.funX(n);
									if(droppedDataInfo.latlon) {
										var temp = convertLatLngToUtm(posY, posX);
										posX = temp[0];
										posY = temp[1];
									}
								} else {
									if(haveY) {
										posY = droppedDataInfo.funY(k);
										if(geoLocationAvailable) {
											posY = latToY(posY);
										}
									}
									if(haveX) {
										posX = droppedDataInfo.funX(n);
									}
								}

								if(haveZ) {
									posZ = droppedDataInfo.funZ(i);
								}

								if(posX === null
									|| posY === null
									|| posZ === null) {
									nullCount += 1;
								}
							} // density not null
						} // for each X
					} // for each Y
				} // for each Z

				nullCounts3D.push(nullCount);

			} //  for each 3D cube
		} else { // no 3D cube of data

			var nullCount = 0;

			if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonzval) {
				haveX = true;
				haveY = true;
				haveZ = true;
				haveValues = true;
			}
			if(droppedDataInfo.type == droppedDataInfoTypes.xyz
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonz) {
				haveX = true;
				haveY = true;
				haveZ = true;
				haveValues = false;
			}
			if(droppedDataInfo.type == droppedDataInfoTypes.xyval
				|| droppedDataInfo.type == droppedDataInfoTypes.latlonval) {
				haveX = true;
				haveY = true;
				haveZ = false;
				haveValues = true;
			}

			for( var i=0 ; i < droppedDataInfo.sizeX; i++ ) {
				var x = droppedDataInfo.funX(i);
				var y = droppedDataInfo.funY(i);
				var z = 0;
				var v = 0;

				if(haveZ) {
					z = droppedDataInfo.funZ(i);
				}
				if(haveValues) {
					v = droppedDataInfo.funValues(i);
				}

				if(haveValues && !haveZ) {
					z = v;
				}
				if(haveZ && !haveValues) {
					v = 1;
				}

				if(x === null
					|| y === null
					|| z === null
					|| v === null) {
					nullCount += 1;
				} else {
					if(droppedDataInfo.latlon) {
						if(haveX && haveY) {
							var temp = convertLatLngToUtm(y, x);
							x = temp[0];
							y = temp[1];
						} else {
							if(haveY) {
								y = latToY(y);
							}
						}
						if(x === null
							|| y === null) {
							nullCount += 1;
						}
					} // if geolocated data
				} // if x, y, z, val are not null
			} // for each point

			nullCountsVals = nullCount;
		} // no 3D cube data
	}
	//===================================================================================


    //=== WEBBLE BUILT IN FUNCTIONS ======================================================================

    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
	$scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
		var targetName = $(event.target).scope().getName();

		if (targetName != ""){
			//=== Clear Data Slot ====================================
			if (targetName == $scope.customInteractionBalls[0].name){ //clearData
				$scope.clearData();
			}
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
		if(itemName == $scope.customMenu[0].itemId){  //clearData
			$scope.clearData();
		}

		if(itemName == $scope.customMenu[1].itemId){  //Toggle Info Text visibility
			for(var i = 0; i < info.length; i++){
				$(info[i]).toggle();
			}
			$scope.customMenu[1].itemTxt = 'Toggle Info Text Visibility (' + ($(info[2]).is(":visible") ? 'Showing' : 'Hidden') + ')';
		}
	};
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
