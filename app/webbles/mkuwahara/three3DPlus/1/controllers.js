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


    // Basic Webble Properties

    var internalFilesPath;

    // Webble Menu and Interaction Balls
    $scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data Slot'}, {itemId: 'toggleInfoVisibility', itemTxt: 'Toggle Info Text Visibility (Showing)'}];
    $scope.customInteractionBalls = [{index: 4, name: 'clearData', tooltipTxt: 'Clear Data Slot'}];

    // three.js objects
    var scene, camera, renderer; //Main
    var camFrustum = new THREE.Frustum(); //Selection support
    var light, lightAmb; //Lights
    var controls, clock, defaultControlSpeed = 10, camPosOrigin; //Camera controls
    var particles, dotsGeometry, axes, gridsContainer, mapPlane; //Meshes & Geometries
    var mapPlaneColorTexture, mapPlaneDisplacementTexture; //Textures
    var shaderMaterial, uniforms; // Shaders & Materials
    var positions, colors, sizes, matrixLocations, mapCoordinates, dataValues;  //Point Particle information

    // Additional system control objects (3rd party etc)
    var videoRecorder, isBusyCaptureMovieFrame = false;

    // Enumeration Definitions
    var CameraInteractionMode = { Fly: 0, Orbit: 1, Trackball: 2 }; //Available types of camera control modes
    var pixelColorBlending = { None: 0, Normal: 1, Additive: 2, Subtractive: 3, Multiply: 4};
    var availableTextures = {None: 0, Spark: 1, FadingCircle: 2, Cloud_1: 3, Cloud_2: 4, Smoke: 5};
    var colorMethodOptions = { GroupColAlphaMinMax: 0, GroupColAlphaHisto: 1, ColorKey: 2 };
    var droppedDataInfoTypes = { none: 0, only3D: 1, latlon3D: 2, latlonval: 3, latlonval3D: 4, latlonz: 5, latlonz3D: 6, latlonzval: 7, latlonzval3D: 8, val3D: 9, xy3D: 10, xyval: 11, xyval3D: 12, xyz: 13, xyz3D: 14, xyzval: 15, xyzval3D: 16 };
    var distributionTypes = {Linear: 0, Logarithmic: 1};
    var valueAffectAttributes = {None: 0, Size: 1, Opacity: 2, Both: 3};
    var selectTypes = {None: 0, OneClick: 1, SquareArea: 2, FreehandArea: 3};
    var mapFetchingStates = {Ready: 0, Busy: 1, WillRepeat: 2};

    // Predefined Slot settings for optimal visualization (based on data type)
    var availablePredefVisualConfig = [
	{name: "None", slotConfigs: []},
	{name: "Tsunami", slotConfigs: [{name: "particleAlphaTexture", value: availableTextures.Spark}, {name: "particleMinSize", value: 10}, {name: "particleMaxSize", value: 30}, {name: "particleMinAlpha", value: 0}, {name: "particleMaxAlpha", value: 1}, {name: "ColorMethod", value: colorMethodOptions.ColorKey}, {name: "predefinedColorKey", value: 2}, {name: "threeDPlusHolder:background-color", value: "#94eef8"}]},
	{name: "Space", slotConfigs: [{name: "particleAlphaTexture", value: availableTextures.Spark}, {name: "particleMinSize", value: 1}, {name: "particleMaxSize", value: 15}, {name: "particleMinAlpha", value: 0}, {name: "particleMaxAlpha", value: 0.8}, {name: "ColorMethod", value: colorMethodOptions.ColorKey}, {name: "predefinedColorKey", value: 18}, {name: "threeDPlusHolder:background-color", value: "#000000"}]},
	{name: "Clouds", slotConfigs: [{name: "particleAlphaTexture", value: availableTextures.Cloud_2}, {name: "particleMinSize", value: 1}, {name: "particleMaxSize", value: 75}, {name: "particleMinAlpha", value: 0}, {name: "particleMaxAlpha", value: 0.5}, {name: "ColorMethod", value: colorMethodOptions.ColorKey}, {name: "predefinedColorKey", value: 16}, {name: "threeDPlusHolder:background-color", value: "#94eef8"}]},
	{name: "Space - No Color", slotConfigs: [{name: "particleAlphaTexture", value: availableTextures.Spark}, {name: "particleMinSize", value: 2}, {name: "particleMaxSize", value: 27}, {name: "particleMinAlpha", value: 1}, {name: "particleMaxAlpha", value: 1}, {name: "ColorMethod", value: colorMethodOptions.ColorKey}, {name: "predefinedColorKey", value: 19}, {name: "threeDPlusHolder:background-color", value: "#000000"}]}
    ];

    // Mouse 3D-world Interaction
    var raycaster, INTERSECTED;
    var mouse_click, intersectedMemory = new Array( 5 ), intSecAreaMem = [];
    var selectionAreaData = [], selelectionType = selectTypes.None;
    var SELECT_COLOR = [1.0, 1.0, 0.0, 1.0];

    var insideParticlesIdxs = []; // index of particle if particle is in user selected area

    // Drag & Drop data drop zone properties
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
	// 1 Tohoku-dai Tsunami flooding data colors
	{ name: "Tsunami Flooding Data", pcks: [[0.058, 0.5, "#2892C7"], [0.501, 1.0, "#60A3B5"], [1.001, 1.5, "#8CB8A4"],   [1.501, 2.0, "#B1CC91"],   [2.001, 3.0, "#D7E37D"],   [3.001, 4.0, "#FAFA64"],   [4.001, 6.0, "#FFD64F"], [6.001, 8.0, "#FCA43F"],   [8.001, 10.0, "#F77A2D"],   [10.001, 12.0, "#F24D1F"],   [12.001, 15.0, "#E81014"],   [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; }) },

	// 2 Tohoku-dai Tsunami structure damage data colors
	{ name: "Tsunami Structure Damage Data", pcks: [[0.237, 8, "#2191CB"], [8.001, 16.0, "#74ABAD"], [16.001, 24, "#ACC993"],   [24.001, 32.0, "#E3EB75"],   [32.001, 40.0, "#FCDE56"],   [40.001, 48.0, "#FCA03D"],   [48.001, 56.0, "#F56325"], [56.001, 64.0, "#E81014"], [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; }) },

	// 3 JMA weather radar data
	{ name: "JMA Weather Radar Data", pcks: [[-100, 0.01, "#00000000"], [0.01, 1, "#F2F2FF"], [1, 5, "#A0D2FF"], [5, 10, "#218CFF"], [10, 20, "#0041FF"], [20, 30, "#FAF500"], [30, 50, "#FF9900"], [50, 80, "#FF2800"], [80, 100000, "#B40068"]] },

	// 4 JMA weather radar colors (same colors as JMA radar data), no numeric limits, just colors
	{ name: "JMA Weather Radar Data (No Numeric Limits)", pcks: ["#F2F2FF", "#A0D2FF", "#218CFF", "#0041FF", "#FAF500", "#FF9900", "#FF2800", "#B40068"] },

	// 5 JMA weather radar colors - accumulated rainfall in mm (same colors as JMA radar data)
	{ name: "JMA Weather Radar Data - Accumulated Rainfall in mm", pcks: [[0, 0.5, "#00000000"], [0.5, 10, "#F2F2FF"], [10, 20, "#A0D2FF"], [20, 50, "#218CFF"], [50, 100, "#0041FF"], [100, 200, "#FAF500"], [200, 300, "#FF9900"], [300, 400, "#FF2800"], [400, 100000, "#B40068"]] },

	// 6 JMA weather radar colors - snow depth in cm (same colors as JMA radar data)
	{ name: "JMA Weather Radar Data - Snow Depth in cm", pcks: [[-1, 0, "#00000000"], [0.05, 0.1, "#F2F2FF"], [0.1, 5, "#A0D2FF"], [5, 20, "#218CFF"], [20, 50, "#0041FF"], [50, 100, "#FAF500"], [100, 150, "#FF9900"], [150, 200, "#FF2800"], [200, 100000, "#B40068"]] },

	// 7 JMA weather radar colors - temperature data
	{ name: "JMA Weather Radar Data - Temperature", pcks: [[-300, -15, "#002080"],[-15, -10, "#0041FF"],[-10, -5, "#0096FF"],[-5, 0, "#B9EBFF"],[0, 5, "#FFFFF0"],[5, 10, "#FFFF96"],[10, 15, "#FAF500"],[15, 20, "#FF9900"],[20, 25, "#FF2800"], [25, 6000, "#B40068"]] },

	// 8 JMA weather radar colors - wind speed data
	{ name: "JMA Weather Radar Data - Wind Speed", pcks: [[0, 5, "#F2F2FF"], [5, 10, "#0041FF"], [10, 15, "#FAF500"], [15, 20, "#FF9900"], [20, 25, "#FF2800"], [25, 3000, "#B6046A"]] },

	// 9 JMA weather radar colors - Sunlight
	{ name: "JMA Weather Radar Data - Sunlight", pcks: [[0, 70, "#242450"], [70, 80, "#454A77"], [80, 90, "#CED2F3"], [90, 100, "#EEEEFF"], [100, 110, "#FFF0B4"], [110, 120, "#FFF000"], [120, 130, "#FF9900"], [130, 10000, "#FF1A1A"]] },

	// 10 JMA weather radar colors - comparative (%) (from rainfall image)
	{ name: "JMA Weather Radar Data - Comparative Image (%)", pcks: [[0, 10, "#783705"], [10, 20, "#F5780F"], [20, 50, "#FFC846"], [50, 100, "#FFE5BF"], [100, 150, "#49F3D6"], [150, 250, "#1FCCAF"], [250, 400, "#009980"], [400, 10000, "#004D40"]] },

	// 11 NEXRAD colors
	{ name: "NEXRAD Data", pcks: ["#73FEFF", "#38D5FF", "#0880FF", "#73FA79", "#39D142", "#3DA642", "#248F01", "#0B4100", "#FFFB01", "#FCA942", "#F94C01", "#AC1942", "#AB28AA", "#D82DA9", "#F985FF"] },

	// 12 NEXRAD scale (mm/hour)
	{ name: "NEXRAD Data - Scale (mm/hour)", pcks: [[0, 0.07, "#00000000"], [0.07, 0.15, "#73FEFF"], [0.15, 0.32, "#38D5FF"], [0.32, 0.65, "#0880FF"], [0.65, 1.3, "#73FA79"], [1.3, 2.7, "#39D142"], [2.7, 5.6, "#3DA642"], [5.6, 12, "#248F01"], [12, 24, "#0B4100"], [24, 49, "#FFFB01"], [49, 100, "#FCA942"], [100, 205, "#F94C01"], [205, 421, "#AC1942"], [421, 865, "#AB28AA"], [865, 1776, "#D82DA9"], [1776, 1000000, "#F985FF"]] },

	// 13 WSI Radar colors
	{ name: "WSI Radar Data", pcks: ["#72f842", "#39d000", "#2ba500", "#3da642", "#248f01", "#1d7600", "#0b4100", "#fffb01", "#fca942", "#fcaa7a", "#aa7942", "#f94c01", "#d81e00", "#ac1942", "#f952aa"] },

	// 14 WSI Radar (mm/hour)
	{ name: "WSI Radar Data (mm/hour)", pcks: [[0, 0.07, "#00000000"], [0.07, 0.15, "#72f842"], [0.15, 0.32, "#39d000"], [0.32, 0.65, "#2ba500"], [0.65, 1.3, "#3da642"], [1.3, 2.7, "#248f01"], [2.7, 5.6, "#1d7600"], [5.6, 12, "#0b4100"], [12, 24, "#fffb01"], [24, 49, "#fca942"], [49, 100, "#fcaa7a"], [100, 205, "#aa7942"], [205, 421, "#f94c01"], [421, 865, "#d81e00"], [865, 1776, "#ac1942"], [1776, 1000000, "#f952aa"]] },

	// 15 NOAA dBZ scale for weather radar
	{ name: "NOAA dBZ Scale for Weather Radar", pcks: [[-30, -25, "#CCFDFF"], [-24.999, -20.0, "#CC99C6"], [-19.999, -15, "#99679B"],   [-14.999, -10.0, "#6B326F"],   [-9.999, -5.0, "#CCCB99"],   [-4.999, 0, "#989D64"],   [0.001, 5.0, "#636465"], [5.001, 10.0, "#02E9E7"], [10.001, 15.0, "#009EF2"], [15.001, 20.0, "#0702F2"], [20.001, 25.0, "#03FC03"], [25.001, 30.0, "#00C300"], [30.001, 35.0, "#008D00"], [35.001, 40.0, "#FBF904"], [40.001, 45.0, "#E4BB00"], [45.001, 50.0, "#FA9807"], [50.001, 55.0, "#FD0000"], [55.001, 60.0, "#CA0500"], [60.001, 65.0, "#BB0000"], [65.001, 70.0, "#F601FE"], [70.001, 75.0, "#9953C8"], [75.001, 100.0, "#FFFFFF"]] },

	// 16 Natural clouds
	{ name: "Natural Clouds", pcks: [[-100, 0.01, '#00000000'], [0.01, 30, '#ffffff'], [30, 50, '#eeeeee'], [50, 80, '#43464c'], [80, 100000, '#111111']] },

	// 17 Natural Water
	{ name: "Natural Water", pcks: [[0.0, 0.0095, "#FFFFFF00"], [0.237, 16.0, "#3ADEFF"], [16.001, 40.0, "#54A1FF"], [40.001, 64.0, "#3D3AFF"]] },

	// 18 Natural gas clouds in Space
	{ name: "Natural Gas Clouds in Space", pcks: [[-10, 1, "#FFFFFF00"], [1.001, 30.0, "#3C202F22"], [30.001, 80.0, "#E27A79"], [80.001, 130.0, "#ECB888"], [130.001, 200.0, "#F75145"], [200.001, 1000.0, "#ffffff"]] },

	// 19 Colorless stars in Space
	{ name: "Colorless Light in Space", pcks: [[ -10, 1, "#FFFFFF22" ], [ 1.001, 30, "#22222288" ], [ 30.001, 80, "#777777BB" ], [ 80.001, 130, "#AAAAAAFF" ], [ 130.001, 200, "#DDDDDDFF" ], [ 200.001, 1000, "#FFFFFFFF" ] ] }
    ];

    // 3D Data properties
    var droppedDataMappings = []; // to keep track of what has been dropped on us so far
    var droppedDataInfo = {type: "none"};
    var cubeNo = -1; // when we have more than one cube of 3D data but only render one, this is used to keep track of which one
    var centerPoint;

    var nullCounts3D = [];
    var nullCountsVals = 0;
    var minmaxCounts3D = [];
    var minmaxCountsVals = [];
    var minmaxCountsMap = null;
    var curMinmaxCounts = null;
    

    //??? OLD JSON 3D Points data TODO: do something better with these
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
    var mapFetchingStatus = mapFetchingStates.Ready;
    var maxMax = 1000; //The max distance in any XYZ direction that any data point is from origo




    //=== EVENT HANDLERS ================================================================


    //===================================================================================
    // Mouse move event handler for within the 3D view
    //===================================================================================
    function on3DMouseMove( event ) {
	event.preventDefault();

	// Enable controller again if it has been turned off
	if((!$scope.ctrlKeyIsDown || !$scope.altKeyIsDown) && !controls.enabled){ controls.enabled = true; }

	if(selelectionType == selectTypes.SquareArea){//$scope.shiftKeyIsDown
	    selectionAreaData[1] = [event.offsetX, event.offsetY];
	    selectCtx.clearRect(0,0,selectCanvas[0].width,selectCanvas[0].height);
	    selectCtx.beginPath();
	    selectCtx.rect(selectionAreaData[0][0], selectionAreaData[0][1], (selectionAreaData[1][0] - selectionAreaData[0][0]), (selectionAreaData[1][1] - selectionAreaData[0][1]));
	    selectCtx.stroke();
	}
	else if(selelectionType == selectTypes.FreehandArea){//$scope.altKeyIsDown
	    selectCtx.clearRect(0,0,selectCanvas[0].width,selectCanvas[0].height);
	    var point = [event.offsetX, event.offsetY];
	    selectionAreaData.push(point);
	    selectCtx.lineTo(point[0], point[1] );
	    selectCtx.stroke();
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
	    selelectionType = selectTypes.OneClick;
	    if($scope.gimme("cameraControllerMode") == CameraInteractionMode.Fly){ event.stopImmediatePropagation(); }

	    mouse_click.x =  ( event.offsetX / renderer.domElement.width ) * 2 - 1;
	    mouse_click.y =  - ( event.offsetY / renderer.domElement.height ) * 2 + 1;

	    selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);

	    if($scope.shiftKeyIsDown || $scope.altKeyIsDown){
		controls.enabled = false;
		selectCtx.strokeStyle = getColorContrast();
		selectCtx.setLineDash([6]);
		selectCtx.lineWidth = 3;
		selectCtx.globalAlpha=0.5

		if($scope.shiftKeyIsDown){
		    selelectionType = selectTypes.SquareArea;
		    selectionAreaData = [[event.offsetX, event.offsetY], [event.offsetX, event.offsetY]];
		}

		if($scope.altKeyIsDown){
		    selelectionType = selectTypes.FreehandArea;
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
	if(selelectionType != selectTypes.None){
	    selectCtx.closePath();

	    if(particles){
		displayHourglassBeforeUpdateSelection();
	    }
	    else{
		selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);
		selelectionType = selectTypes.None;
	    }
    	}
    };
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
    //========================================================================================


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
    // Display Hourglass Before Update Selection
    // Makes sure the loading screen has been updated and rendered correctly before
    // calling the calculation heavy Redraw function.
    //===================================================================================
    function displayHourglassBeforeUpdateSelection() {
	if(!$scope.waiting()){ $scope.waiting(true); info[0].innerHTML = "Updating Data Point Selections..."; }
	if($scope.waiting() && info[0].innerHTML != ""){ $timeout(function () {	makeSelection(); }, 100); }
	else{ $timeout(function () { displayHourglassBeforeUpdateSelection(); }, 10); }
    };
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

	    else if(eventData.slotName == 'gridEnabled'){
		if(eventData.slotValue && gridsContainer == undefined || !eventData.slotValue && gridsContainer !== undefined){
		    executeGridVisbilityState();
		}
	    }

	    else if(eventData.slotName == 'gridProperties'){
		if($scope.gimme("gridEnabled") && gridsContainer !== undefined){
		    scene.remove(gridsContainer);
		    gridsContainer = undefined;
		    executeGridVisbilityState();
		}
	    }

	    else if(eventData.slotName == 'predefinedColorKey'){
	    	if(eventData.slotValue > 0){
		    $scope.set("ColorKey", predefinedColorKeySets[eventData.slotValue - 1].pcks);
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
		    if(JSON.stringify(predefinedColorKeySets[i].pcks) == JSON.stringify(colorKey)){
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

	    else if(eventData.slotName == "predefVisualConfig") {
		for(var i = 0; i < availablePredefVisualConfig[eventData.slotValue].slotConfigs.length; i++){
		    $scope.set(availablePredefVisualConfig[eventData.slotValue].slotConfigs[i].name, availablePredefVisualConfig[eventData.slotValue].slotConfigs[i].value);
		    $scope.getSlot(eventData.slotName).setValue(0);
		}
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
		    $timeout(function () { enableGeoLocationSupport(); })
		}
	    }

	    else if(eventData.slotName == 'backsideMapEnabled' || eventData.slotName == 'customGeoMapImage' || eventData.slotName == 'customHeightMapImage' || eventData.slotName == 'heightMapStrength' || eventData.slotName == 'mapOpacity'){
		$timeout(function () { enableGeoLocationSupport(); })
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
	    
	    else if(eventData.slotName == 'SelectAll'){
		if(eventData.slotValue) {
		    $scope.selectAll();
		    $scope.set("SelectAll",false);
		}
	    }

    	    else if(eventData.slotName == 'MultipleSelectionsDifferentGroups') {
    		updateLocalSelections(false);
	    }
	    
	    else if(eventData.slotName == 'ClearData') {
		if(eventData.slotValue) {
		    $scope.clearData();
		    $scope.set("ClearData",false);
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

	//???
	$scope.addSlot(new Slot('gridEnabled',
				false,
				'Grid Enabled',
				'Shows or hides X, Y and Z Grids in the 3D space',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('gridProperties',
				{
				    dimensions: { w:2405, d:1000, h:800 },
				    colors: { xw: "red", yh: "green", zd: "blue", globalTransparency: 0.4 },
				    labels: {
					x: ['', "\'14","\'13","\'12","\'11","\'10","\'09","\'08","\'07","\'06","\'05"],
					y: ["2%", "4%", "6%", "8%"],
					z: ["1-month","3-month","6-month","1-year","2-year","3-year","5-year","7-year","10-year", "20-year","30-year"]
				    },
				    centerPointOrigoOffset: {
					x: 0,
					y: 0,
					z: 0
				    }
				},
				'Grid Properties',
				'Various properties that constitute the grid, such as dimensions, colors and labels',
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

	$scope.addSlot(new Slot('predefVisualConfig',
				0,
				'Predefined Visual Configuration',
				'Sets multiple slots to its optimal value to best visualize certain types of data',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: [availablePredefVisualConfig[0].name, availablePredefVisualConfig[1].name, availablePredefVisualConfig[2].name, availablePredefVisualConfig[3].name, availablePredefVisualConfig[4].name]},
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
				{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ["None", "Kobe", "Kochi"]},
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
				0,
				'Predefined Color Key Sets',
				'Predefined options of the color key scale being used from lower to higher values of a particle.',
				"Data Group Visualization",
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: getPCKNameArray()},
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


	$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
				true,
				"Multiple Selections -> Different Groups",
				'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
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

	$scope.addSlot(new Slot('ClearData',
				false,
				"Clear Data",
				'Slot to quickly reset to having no data.',
				$scope.theWblMetadata['templateid'],
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
					ckElemI.val(JSON.stringify(predefinedColorKeySets[newVal - 1].pcks));
					ckElemT.val(JSON.stringify(predefinedColorKeySets[newVal - 1].pcks));
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
	    executeGridVisbilityState();
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
	renderer = new THREE.WebGLRenderer({ alpha: false, preserveDrawingBuffer: true });
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

	//??? Maybe nice to have
	//var gridHelper = new THREE.GridHelper(10, 10);
	// scene.add(gridHelper);

	// Particle Interaction
	raycaster = new THREE.Raycaster();
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

	// Capture Movie frames (if SHIFT down and not busy)
	if(!$scope.getIsFormOpen()){
	    if($scope.shiftKeyIsDown && !$scope.ctrlKeyIsDown && !$scope.altKeyIsDown && !isBusyCaptureMovieFrame){
		if(videoRecorder == undefined){
		    $log.log("Start Recording of Movie Frames");
		    videoRecorder = new Whammy.Video(15);
		}
		isBusyCaptureMovieFrame = true;
		$timeout(function () {
		    videoRecorder.add(renderer.domElement.toDataURL("image/webp"));
		    isBusyCaptureMovieFrame = false;
		});
	    }

	    // Compile Movie from captured frames (if no key down and frames captured)
	    if(!$scope.shiftKeyIsDown && !$scope.ctrlKeyIsDown && !$scope.altKeyIsDown && videoRecorder != undefined && videoRecorder.frames.length > 0){
		$timeout(function () {
		    $log.log("Stop Recording of Movie Frames");
		    $log.log("Creating Movie of " + videoRecorder.frames.length + " frames captured.");
		    videoRecorder.compile(false, function(output){
			download(output, "3DWebbleVideoTest", "video/webm");
			videoRecorder = undefined;
		    });
		});
	    }
	}

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

		if(minmaxCountsMap !== null) { // we may need to redraw the map if we have new data (because the position of the map may then change)
		    $timeout(function () { enableGeoLocationSupport(); });
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

		    var particleDist = 3.0; // TODO: look this over and do something better?

		    // var minX = 0;
		    // var minY = 0;
		    // var minZ = 0;

		    // var maxX = (ldb[0][0].length - 1);
		    // var maxY = (ldb[0].length - 1);
		    // var maxZ = (ldb.length - 1);
		    
		    curMinmaxCounts = minmaxCounts3D[cubeNo];

		    var minX = curMinmaxCounts.minX;
		    var minY = curMinmaxCounts.minY;
		    var minZ = curMinmaxCounts.minZ;

		    var maxX = curMinmaxCounts.maxX;
		    var maxY = curMinmaxCounts.maxY;
		    var maxZ = curMinmaxCounts.maxZ;

		    if(droppedDataInfo.type == droppedDataInfoTypes.val3D) {
			droppedDataInfo.sizeX = ldb[0][0].length;
			droppedDataInfo.sizeY = ldb[0].length;
			// droppedDataInfo.sizeX = maxX + 1;
			// droppedDataInfo.sizeY = maxY + 1;
		    }

		    var scaleX = particleDist;
		    var scaleY = particleDist;
		    var scaleZ = particleDist;

		    if(maxX > minX) { 
			scaleX = 1000 / curMinmaxCounts.spanX;
		    }
		    if(maxY > minY) {
			scaleY = 1000 / curMinmaxCounts.spanY;
		    }
		    if(maxZ > minZ) {
			scaleZ = 1000 / curMinmaxCounts.spanZ;
		    }

		    if(minmaxCountsMap !== null && droppedDataInfo.latlon) {
			minX = Math.min(minX, minmaxCountsMap.minX);
			maxX = Math.max(maxX, minmaxCountsMap.maxX);
			minY = Math.min(minY, minmaxCountsMap.minY);
			maxY = Math.max(maxY, minmaxCountsMap.maxY);

			if(maxX > minX) { 
			    scaleX = 1000 / (maxX - minX);
			} else {
			    scaleX = particleDist;
			}
			if(maxY > minY) {
			    scaleY = 1000 / (maxY - minY);
			} else {
			    scaleX = particleDist;
			}
		    }

		    if(!independentScaling) {
			scaleX = Math.min(scaleX, scaleY, scaleZ);
			scaleY = scaleX;
			scaleZ = scaleX;
		    }

		    $log.log("MAP Redraw points (3d) using (" + minX + ", " + minY + "), (" + maxX + ", " + maxY + "), " + scaleX + "-" + scaleY + "-" + scaleZ);
		    // $log.log("3D min [" + minX + "," + minY + "," + minZ + "], max [" + maxX + "," + maxY + "," + maxZ + "], scale [" + scaleX + "," + scaleY + "," + scaleZ + "]");
		}
	    } // cubeNo >= 0
	} 

	colors = []; sizes = []; dataValues = [];
	colors = new Float32Array( noOfPoints * 4 );
	sizes = new Float32Array( noOfPoints );
	dataValues = new Float32Array( noOfPoints );

	var posArrIndex = 0, dataValArrIndex = 0;

	if(have3D) {
	    if(cubeNo >= 0) {
		var c = cubeNo;

		var ldb = droppedDataInfo.fun3D(c);

		if(!keepScene) {
		    var spanY = maxY - minY;
		    if(spanY == 0) {
			spanY = 1;
		    }
		}

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

			    var val = ldb[i][k][n];

			    if(val !== null) {

				dataValues[dataValArrIndex++] = val;

				if(!keepScene) {

				    if(haveX && haveY) {
					var posY = droppedDataInfo.funY(k);
					var posX = droppedDataInfo.funX(n);

					if(droppedDataInfo.latlon) {
					    var temp = convertLatLngToUtm(posY, posX);
					    posX = temp[0];
					    posY = temp[1];
					}
					
					positions[ posArrIndex + 2 ] = (spanY - (posY - minY)) * scaleY;
					positions[ posArrIndex + 0 ] = (posX - minX) * scaleX;

				    } else {
					if(haveY) {
					    var posY = droppedDataInfo.funY(k);
					    if(droppedDataInfo.latlon) {
						posY = latToY(posY);
					    }
					    positions[ posArrIndex + 2 ] = (spanY - (posY - minY)) * scaleY;
					} else {
					    // positions[ posArrIndex + 2 ] = k * particleDist;
					    positions[ posArrIndex + 2 ] = (spanY - (k - minY)) * scaleY;
					}

					if(haveX) {
					    var posX = droppedDataInfo.funX(n);
					    positions[ posArrIndex + 0 ] = (posX - minX) * scaleX;
					} else {
					    // positions[ posArrIndex + 0 ] = n * particleDist;
					    positions[ posArrIndex + 0 ] = (n - minX) * scaleX;
					}
				    }

				    if(haveZ) {
					var posZ = droppedDataInfo.funZ(i);
					positions[ posArrIndex + 1 ] = (posZ - minZ) * scaleZ;
				    } else {
					// positions[ posArrIndex + 1 ] = i * particleDist;
					positions[ posArrIndex + 1 ] = (i - minZ) * scaleZ;
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

	    curMinmaxCounts = minmaxCountsVals;

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

	    if(!keepScene) {

		var particleDist = 3.0; // TODO: look this over and do something better?

		var scaleX = particleDist;
		var scaleY = particleDist;
		var scaleZ = particleDist;

		var minX = curMinmaxCounts.minX;
		var minY = curMinmaxCounts.minY;
		var minZ = curMinmaxCounts.minZ;

		var maxX = curMinmaxCounts.maxX;
		var maxY = curMinmaxCounts.maxY;
		var maxZ = curMinmaxCounts.maxZ;


		if(maxX > minX) { 
		    scaleX = 1000 / curMinmaxCounts.spanX;
		}
		if(maxY > minY) {
		    scaleY = 1000 / curMinmaxCounts.spanY;
		}
		if(maxZ > minZ) {
		    scaleZ = 1000 / curMinmaxCounts.spanZ;
		}

		if(minmaxCountsMap !== null && droppedDataInfo.latlon) {
		    minX = Math.min(minX, minmaxCountsMap.minX);
		    maxX = Math.max(maxX, minmaxCountsMap.maxX);
		    minY = Math.min(minY, minmaxCountsMap.minY);
		    maxY = Math.max(maxY, minmaxCountsMap.maxY);

		    if(maxX > minX) { 
			scaleX = 1000 / (maxX - minX);
		    } else {
			scaleX = particleDist;
		    }
		    if(maxY > minY) {
			scaleY = 1000 / (maxY - minY);
		    } else {
			scaleX = particleDist;
		    }
		}

		var spanY = maxY - minY;
		if(spanY == 0) {
		    spanY = 1;
		}

		if(!independentScaling) {
		    scaleX = Math.min(scaleX, scaleY, scaleZ);
		    scaleY = scaleX;
		    scaleZ = scaleX;
		}

		$log.log("MAP Redraw points (vals) using (" + minX + ", " + minY + "), (" + maxX + ", " + maxY + "), " + scaleX + "-" + scaleY + "-" + scaleZ);
		// $log.log("Values min [" + minX + "," + minY + "," + minZ + "], max [" + maxX + "," + maxY + "," + maxZ + "], scale [" + scaleX + "," + scaleY + "," + scaleZ + "]");
	    }

	    for(var i=0 ; i < droppedDataInfo.sizeX; i++ ) {

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

		    dataValues[dataValArrIndex++] = v;

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

			positions[ posArrIndex + 2 ] = (spanY - (y - minY)) * scaleY;
			positions[ posArrIndex + 0 ] = (x - minX) * scaleX;
			positions[ posArrIndex + 1 ] = (z - minZ) * scaleZ;

			matrixLocations[ posArrIndex + 1 ] = i;
			matrixLocations[ posArrIndex + 2 ] = i;
			matrixLocations[ posArrIndex + 0 ] = i;

			posArrIndex += 3;
		    } // if not keepScene

		    firstNonNullVal = false;
		} // if x,y,z, and value are not null
	    } // for each value
	} // no 3D object

	setParticleAttributes(dataValues, colors, sizes); // this updates colors etc.

	if(!keepScene) {
	    $log.log("centerPoint = new THREE.Vector3(" + ((maxX - minX) * scaleX / 2) + ", " +((maxZ - minZ) * scaleZ / 2) + ", " + ((maxY - minY) * scaleY / 2) + ")");
	    centerPoint = new THREE.Vector3((maxX - minX) * scaleX / 2 , (maxZ - minZ) * scaleZ / 2, (maxY - minY) * scaleY / 2);
	    maxMax = Math.max((Math.abs(minX) * scaleX), (Math.abs(maxX) * scaleX), (Math.abs(minY) * scaleY), (Math.abs(maxY) * scaleY), (Math.abs(minZ) * scaleZ), (Math.abs(maxZ) * scaleZ));

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



	//??? TODO: look over this and see if there is something better to do
	pAlpha = {underThreshold: 0.0, aboveThreshold: 1.0, betweenThresholdMin: 0.5, betweenThresholdMax: 1.0}
	ut = pAlpha.underThreshold; at = pAlpha.aboveThreshold; btma = pAlpha.betweenThresholdMax; btmi = pAlpha.betweenThresholdMin;

	var alphaSpan = btma - btmi;

	
	// var allValues = [minValueThreshold, maxValueThreshold];
	var allValues = [curMinmaxCounts.minV, curMinmaxCounts.maxV];
	if(colorArrOk && colorMethod == 1) { // histograms
	    allValues = [];
	    for(var i = 0; i < dataValArr.length; i++) {
		allValues.push(dataValArr[i]);
	    }
	    allValues.sort(function (a,b) { return a - b; });
	}

	for( var i=0 ; i < dataValArr.length ; i++ ) {

	    // var val = Math.min(Math.max(minValueThreshold, dataValArr[i]), maxValueThreshold);
	    var val = dataValArr[i];
	    var pct = 1; 
	    
	    if(curMinmaxCounts !== null) {
		pct = (val - curMinmaxCounts.minV) / curMinmaxCounts.spanV;
	    } else {
		pct = 1;
	    }
	    
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

		    // alphaVal = (dataValArr[i] < minValueThreshold) ? ut : ((dataValArr[i] > maxValueThreshold) ? at : ((pct * btma) + btmi));
		    alphaVal = pct * alphaSpan + btmi;

		    // when 3DArray exists, dataValArr index maps to x,y,z indeces in 3D cube as:
		    // y = k
		    // x = n
		    // z = i
		    // posArrIndex + 1 

		    // matrixLocations[ posArrIndex + 1 ] = i;
		    // matrixLocations[ posArrIndex + 2 ] = k;
		    // matrixLocations[ posArrIndex + 0 ] = n;
		    // dataValArrIndex++  -->  posArrIndex += 3;
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
		    
		    if(groupId <= 0) {
			colVal = [0, 0, 0, 0];
			alphaVal = 0;

			// alphaVal *= 0.01;
		    } else {
			colVal = groupAndValTo3Dcolor(val, groupId, allValues, alphaVal);
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
    // Make Selection
    // Depending on mouse interaction figure out which data points have been selected and
    // make them thus.
    //========================================================================================
    var makeSelection = function(){
	var attributes = particles.geometry.attributes;

	var insideParticles = [];

	camFrustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

	if(selelectionType == selectTypes.OneClick){
	    raycaster.setFromCamera( mouse_click, camera );
	    var intersects = raycaster.intersectObject( particles );

	    for(var i = 0; i < intersects.length; i++){
		var index = intersects[i].index;
		// if(attributes.customColor.array[index * 4 + 3 ] > 0){
		    insideParticles.push(intersects[i].index);
		// }
	    }
	    insideParticles = [insideParticles[0]];
	}

	else if(selelectionType == selectTypes.SquareArea){
	    var minX = 100000, minY = 100000, maxX = -1, maxY = -1;
	    for(var i = 0, sad; sad = selectionAreaData[i]; i++){
		if(sad[0] < minX){ minX = sad[0] }
		if(sad[0] > maxX){ maxX = sad[0] }
		if(sad[1] < minY){ minY = sad[1] }
		if(sad[1] > maxY){ maxY = sad[1] }
	    }

	    for(var i = 0; i < attributes.dataValue.count; i++){
		var pos = new THREE.Vector3(attributes.position.array[ i * 3 + 0], attributes.position.array[ i * 3 + 1], attributes.position.array[ i * 3 + 2]);
		var screenXYPos = toScreenXY(pos);
		if(screenXYPos.x > minX && screenXYPos.x < maxX && screenXYPos.y > minY && screenXYPos.y < maxY){
		    // if(attributes.customColor.array[i * 4 + 3 ] > 0){
			if (camFrustum.containsPoint(pos)) {
			    insideParticles.push(i);
			}
		    // }
		}
	    }
	}
	else if(selelectionType == selectTypes.FreehandArea){
	    selectCtx.stroke();

	    for(var i = 0; i < attributes.dataValue.count; i++){
		var pos = new THREE.Vector3(attributes.position.array[ i * 3 + 0], attributes.position.array[ i * 3 + 1], attributes.position.array[ i * 3 + 2]);
		var screenXYPos = toScreenXY(pos);

		if(isInside([screenXYPos.x, screenXYPos.y], selectionAreaData)){
		    // if(attributes.customColor.array[i * 4 + 3 ] > 0){
			if (camFrustum.containsPoint(pos)) {
			    insideParticles.push(i);
			}
		    // }
		}
	    }
	}

	$log.log(insideParticles.length + " number of points inside the selected area");

	for (var i = 0, isam; isam = intSecAreaMem[i]; i++){
	    attributes.customColor.array[ isam[0] * 4 + 0 ] = isam[1]; attributes.customColor.array[ isam[0] * 4 + 1 ] = isam[2]; attributes.customColor.array[ isam[0] * 4 + 2 ] = isam[3]; attributes.customColor.array[ isam[0] * 4 + 3 ] = isam[4];
	    attributes.size.array[ isam[0] ] = isam[5];
	    info[1].innerHTML = "";
	}
	intSecAreaMem = [];
	if ( insideParticles.length > 0 ) {
	    for (var i = 0; i < insideParticles.length; i++){
		var INTSEC = insideParticles[i];
		var iam = new Array( 6 );
		iam[0] = INTSEC;
		iam[1] = attributes.customColor.array[ INTSEC * 4 + 0 ]; iam[2] = attributes.customColor.array[ INTSEC * 4 + 1 ]; iam[3] = attributes.customColor.array[ INTSEC * 4 + 2 ]; iam[4] = attributes.customColor.array[ INTSEC * 4 + 3 ];
		iam[5] = attributes.size.array[ INTSEC ];
		intSecAreaMem.push(iam);
		attributes.customColor.array[ INTSEC * 4 + 0 ] = SELECT_COLOR[0]; attributes.customColor.array[ INTSEC * 4 + 1 ] = SELECT_COLOR[1]; attributes.customColor.array[ INTSEC * 4 + 2 ] = SELECT_COLOR[2]; attributes.customColor.array[ INTSEC * 4 + 3 ] = SELECT_COLOR[3];
		attributes.size.array[ INTSEC ] = attributes.size.array[ INTSEC ] * 2;
		if(insideParticles.length == 1 && attributes.position.array[ INTSEC * 3 + 0 ] != undefined){ info[1].innerHTML = "x: " + attributes.position.array[ INTSEC * 3 + 0 ] + ", y: " + attributes.position.array[ INTSEC * 3 + 1 ] + ", z: " + attributes.position.array[ INTSEC * 3 + 2 ] }
	    }
	}
	attributes.customColor.needsUpdate = true;
	attributes.size.needsUpdate = true;

	selectCtx.clearRect(0, 0, selectCanvas[0].width, selectCanvas[0].height);
	selelectionType = selectTypes.None;
	$timeout(function () { $scope.waiting(false); info[0].innerHTML = "" });


	var selectAll = false;
	if(insideParticles.length <= 0 || 
	   insideParticles.length == attributes.dataValue.count) {
	    selectAll = true;
	}

	insideParticlesIdxs = [];

	if(!selectAll) {
	    for(var j = 0; j < insideParticles.length; j++) { 
		var i = insideParticles[j];

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
		    var cubeXidx = matrixLocations[i * 3];
		    var cubeYidx = matrixLocations[i * 3 + 2];
		    var cubeZidx = matrixLocations[i * 3 + 1];
		    
		    var itemIdx = cubeNo * Math.floor(droppedDataInfo.size3Dv / droppedDataInfo.size3D) + cubeXidx + droppedDataInfo.sizeX*(cubeYidx + droppedDataInfo.sizeY*cubeZidx);
		    insideParticlesIdxs.push(itemIdx);
		} else if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
			  || droppedDataInfo.type == droppedDataInfoTypes.xyz
			  || droppedDataInfo.type == droppedDataInfoTypes.xyval
			  || droppedDataInfo.type == droppedDataInfoTypes.latlonzval
			  || droppedDataInfo.type == droppedDataInfoTypes.latlonz
			  || droppedDataInfo.type == droppedDataInfoTypes.latlonval) {

		    var itemIdx = matrixLocations[i * 3];
		    insideParticlesIdxs.push(itemIdx);
		}
	    } 
	}
	
	updateLocalSelections(selectAll);

    };
    //========================================================================================


    //========================================================================================
    // Enable Geo Location Support
    // Turns on or off the visibility of all geo location support, such as a map plane and a
    // blue sky etc.
    //========================================================================================
    var enableGeoLocationSupport = function(){

	var oldcounts = null;
	if(minmaxCountsMap !== null) {
	    oldcounts = {"x1":minmaxCountsMap.minX,
			 "x2":minmaxCountsMap.maxX,
			 "y1":minmaxCountsMap.minY,
			 "y2":minmaxCountsMap.maxY};
	}
	var needToRedrawDataToo = false;

	minmaxCountsMap = null; // reset this (possibly unnecessary), and fill it with current values if we still have a map

	if(scene){
	    if(mapPlane != undefined){
		light.target.position.set( 0, 0, 0 );
		scene.remove(mapPlane);
		mapPlane = undefined;
	    }

	    var preDefArea = $scope.gimme("preDefinedGeoArea");
	    var custGeoMap = $scope.gimme("customGeoMapImage");
	    var custHeightMap = $scope.gimme("customHeightMapImage");
	    if(preDefArea != "None" || custGeoMap != "" || custHeightMap != ""){
		if(mapFetchingStatus == mapFetchingStates.Ready){
		    mapFetchingStatus = mapFetchingStates.Busy;
		    lightAmb.intensity = 1.0;
		    light.intensity = 0.1;

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

		    var geoPosMin = convertLatLngToUtm(coords.min.lat, coords.min.lon);
		    var geoPosMax = convertLatLngToUtm(coords.max.lat, coords.max.lon);
		    minmaxCountsMap = {"minX":Math.min(geoPosMin[0], geoPosMax[0]), "maxX":Math.max(geoPosMin[0], geoPosMax[0]),
				       "minY":Math.min(geoPosMin[1], geoPosMax[1]), "maxY":Math.max(geoPosMin[1], geoPosMax[1])};


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

					    minmaxCountsMap = {"minX":Math.min(geoPosMin[0], geoPosMax[0]), "maxX":Math.max(geoPosMin[0], geoPosMax[0]),
							       "minY":Math.min(geoPosMin[1], geoPosMax[1]), "maxY":Math.max(geoPosMin[1], geoPosMax[1])};

 					    var particleDist = 3.0;// TODO: do something better here

					    var minX = minmaxCountsMap.minX;
					    var minY = minmaxCountsMap.minY;

					    var maxX = minmaxCountsMap.maxX;
					    var maxY = minmaxCountsMap.maxY;

					    var scaleX = particleDist;
					    var scaleY = particleDist;
					    
					    if(curMinmaxCounts !== null && droppedDataInfo.latlon) {
						minX = Math.min(minX, curMinmaxCounts.minX);
						maxX = Math.max(maxX, curMinmaxCounts.maxX);
						minY = Math.min(minY, curMinmaxCounts.minY);
						maxY = Math.max(maxY, curMinmaxCounts.maxY);

						if((minX != curMinmaxCounts.minX && (oldcounts === null || oldcounts.x1 != minX))
						   || (maxX != curMinmaxCounts.maxX && (oldcounts === null || oldcounts.x2 != maxX))
						   || (minY != curMinmaxCounts.minY && (oldcounts === null || oldcounts.y1 != minY))
						   || (maxY != curMinmaxCounts.maxY && (oldcounts === null || oldcounts.y2 != maxY))
						  ) {
						    needToRedrawDataToo = true;
						}
					    }

					    if(needToRedrawDataToo) {
						$log.log("Need to redraw data MAP");
						$timeout(function () { displayHourglassBeforeRedrawScene(false); });
					    } else {
						$log.log("Skip redrawing data, they are already fine MAP");
					    }

					    if(maxX > minX) { 
						scaleX = 1000 / (maxX - minX);
					    }
					    var spanY = 1;
					    if(maxY > minY) {
						spanY = maxY - minY;
						scaleY = 1000 / spanY;
					    }

					    var scaleZ = scaleX;
					    if(curMinmaxCounts !== null) { 
						if(curMinmaxCounts.maxZ > curMinmaxCounts.minZ) {
						    scaleZ = 1000 / curMinmaxCounts.spanZ;
						}
					    }

					    if(!independentScaling) {
						scaleX = Math.min(scaleX, scaleY, scaleZ);
						scaleY = scaleX;
						scaleZ = scaleX;
					    }

					    $log.log("MAP enableGeo using (" 
						     + minX 
						     + ", " 
						     + minY 
						     + "), (" 
						     + maxX 
						     + ", " 
						     + maxY 
						     + "), " 
						     + scaleX 
						     + "-" 
						     + scaleY 
						     + "-" 
						     + scaleZ);

					    // Getting the XYZ positions for each corner from real world coordinates
					    var cld = geoPosMin;											//Corner-Left-Down
					    var clu = convertLatLngToUtm(coords.min.lat, coords.max.lon);   //Corner-Left-Up
					    var crd = convertLatLngToUtm(coords.max.lat, coords.min.lon);	//Corner-Right-Down
					    var cru = geoPosMax;											//Corner-Right-Up

					    // Creating the geometry vertices, scaled and translated similar to the data
					    var geometry = new THREE.Geometry();
					    geometry.vertices.push(new THREE.Vector3((cld[0]-minX) * scaleX,0,(spanY - (cld[1] - minY)) * scaleY)); //cld
					    geometry.vertices.push(new THREE.Vector3((clu[0]-minX) * scaleX,0,(spanY - (clu[1] - minY)) * scaleY)); //clu
					    geometry.vertices.push(new THREE.Vector3((crd[0]-minX) * scaleX,0,(spanY - (crd[1] - minY)) * scaleY)); //crd
					    geometry.vertices.push(new THREE.Vector3((cru[0]-minX) * scaleX,0,(spanY - (cru[1] - minY)) * scaleY)); //cru


					    // $log.log("drawing map at pixels " + ((cld[0]-minX) * scaleX) + ", " + ((spanY - (cld[1] - minY)) * scaleY));
					    // $log.log("drawing map at pixels " + ((clu[0]-minX) * scaleX) + ", " + ((spanY - (clu[1] - minY)) * scaleY));
					    // $log.log("drawing map at pixels " + ((crd[0]-minX) * scaleX) + ", " + ((spanY - (crd[1] - minY)) * scaleY));
					    // $log.log("drawing map at pixels " + ((cru[0]-minX) * scaleX) + ", " + ((spanY - (cru[1] - minY)) * scaleY));

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

					    // TODO: which scale to use here?? scaleZ is actual meters, so everything will look ridiculously flat when not zooming in
					    var displacementScale = coords.highestPointMeter * scaleZ * 2; // double it for a more visual effect ...but not reality accuracy

					    var materials = [new THREE.MeshPhongMaterial({map: mapPlaneColorTexture, displacementMap: mapPlaneDisplacementTexture, displacementScale: displacementScale, side: THREE.FrontSide, depthWrite: false, transparent: ($scope.gimme("mapOpacity") < 1), opacity: $scope.gimme("mapOpacity")}), new THREE.MeshPhongMaterial({map: textureBack, side: THREE.BackSide, depthWrite: false, transparent: ($scope.gimme("mapOpacity") < 1), opacity: $scope.gimme("mapOpacity")})];

					    // Creating a mesh using the geometry and materials created above and add it to the scene
					    mapPlane = new THREE.Mesh( geometry, new THREE.MultiMaterial(materials) ) ;
					    mapPlane.renderOrder = 0;
					    mapPlane.isMap = true;

					    if(particles == undefined){
						var xPos = geometry.vertices[1].x / 2;
						centerPoint = new THREE.Vector3( xPos, 0, geometry.vertices[0].z / 2);
						camera.position.set(xPos, xPos, geometry.vertices[0].z);
						camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
						camera.lookAt(centerPoint);
						if(controls.target){ controls.target = centerPoint; }
					    }
					    light.target = mapPlane;
					    scene.add( mapPlane );

					    var willRepeatMapFetch = (mapFetchingStatus == mapFetchingStates.WillRepeat);
					    mapFetchingStatus = mapFetchingStates.Ready;
					    if(willRepeatMapFetch){ enableGeoLocationSupport(); }
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
		else{
		    mapFetchingStatus = mapFetchingStates.WillRepeat;
		}
	    }
	    else {
		lightAmb.intensity = 0.1;
		light.intensity = 1.0;

		if(particles == undefined) {
		    var ccm = $scope.gimme("cameraControllerMode");
		    if(ccm == CameraInteractionMode.Orbit || ccm == CameraInteractionMode.Trackball){ controls.reset() }
		    camera.position.set(7, 7, 15);
		    camPosOrigin = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
		    camera.lookAt(new THREE.Vector3(0, 0, 0));
		}
	    }
	}

	if(oldcounts !== null && 
	   curMinmaxCounts !== null && droppedDataInfo.latlon
	   && minmaxCountsMap === null) {

	    var minX = Math.min(curMinmaxCounts.minX, oldcounts.x1);
	    var maxX = Math.max(curMinmaxCounts.maxX, oldcounts.x2);
	    var minY = Math.min(curMinmaxCounts.minY, oldcounts.y1);
	    var maxY = Math.max(curMinmaxCounts.maxY, oldcounts.y2);
	    if(minX != curMinmaxCounts.minX
	       || maxX != curMinmaxCounts.maxX
	       || minY != curMinmaxCounts.minY
	       || maxY != curMinmaxCounts.maxY
	      ) {
		needToRedrawDataToo = true;
	    }
 	}

	if(needToRedrawDataToo) {
	    $log.log("Need to redraw data MAP");
	    $timeout(function () { displayHourglassBeforeRedrawScene(false); });
	} else {
	    $log.log("Skip redrawing data, they are already fine MAP");
	}
     };
    //========================================================================================


    //========================================================================================
    // Clear Data From Scene
    // Removes all data related meshes and geometry and resets the background
    //========================================================================================
    $scope.clearData = function() {

	$scope.clearDataMappings();

	centerPoint = new THREE.Vector3(0,0,0);

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
	// TODO: this color related stuff could be cleaned up a bit
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
		if(mid == start) {
		    return -1;
		} else {
		    return binLookup(ls, val, mid, end);
		}
	    } else {
		if(mid == end) {
		    return -1;
		} else {
		    return binLookup(ls, val, start, mid);
		}
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
	// TODO: this color related stuff could be cleaned up a bit
    	var rgba = [0, 0, 0, 1];

    	if(colorMethod == colorMethodOptions.GroupColAlphaHisto) {
    	    var len = allValues.length;
    	    var idx = Math.max(0, binLookup(allValues, val, 0, len));
	    
	    var prop = 1;
	    if(len > 1) {
		prop = idx / (len-1);
	    }

	    if(groupColors.hasOwnProperty(groupId)) {
    		var crgba = groupColors[groupId];
	    } else {
		var crgba = [1, 1, 1, 1];
	    }

    	    for(var c = 0; c < 3; c++) {
    		rgba[c] = crgba[c] * 0.5 + 0.5 * (prop + (1-prop)*crgba[c]);
    	    }
	    rgba[3] = prop * crgba[3];

    	} else if(colorMethod == colorMethodOptions.GroupColAlphaMinMax) {
    	    var span = allValues[1] - allValues[0];
    	    var prop = 1;
    	    if(span > 0) {
    		prop = (val - allValues[0]) / span;
    	    }

	    if(groupColors.hasOwnProperty(groupId)) {
    		var crgba = groupColors[groupId];
	    } else {
		var crgba = [1, 1, 1, 1];
	    }

    	    for(var c = 0; c < 3; c++) {
    		rgba[c] = crgba[c]; // * 0.25 + 0.75 * prop;
    	    }

    	} else if(colorMethod == colorMethodOptions.ColorKey) {
    	    var idx = 0;
    	    if(colorKey && colorKey.length > 0) {
    		if(typeof colorKey[0] != 'string' && colorKey[0].length > 1) { // colors and limits
		    
		    if(val <= colorKey[0][0]) {
			idx = 0;
		    } else if(val >= colorKey[colorKey.length - 1][1]) {
    			idx = colorKey.length - 1;
		    } else {
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
    		    } else {
    			rgba = hexColorToRGBAvec(cc, alpha);
    		    }

    		} else { // only colors
    		    var span = allValues[allValues.length - 1] - allValues[0];
    		    var prop = 0;
    		    if(span > 0) {
    			prop = (val - allValues[0]) / span;
    		    }
    		    idx = Math.min(colorKey.length - 1, Math.round(prop * colorKey.length));

    		    var cc = colorKey[idx];
    		    if(cc.length == 9) { // contains alpha
    			var alphaCC = parseInt(cc.substr(7,2), 16);
    			rgba = hexColorToRGBAvec(cc, alpha * alphaCC / 255.0);
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
    var buildAxes = function() {
	var axes = new THREE.Object3D();
	var length = maxMax * 1.2;
	if(length < 1000){length = 1000;}

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
		axes = buildAxes();
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
    // Label Axis
    // Creates a label for each grid axis for each step
    //========================================================================================
    function labelGridAxis(width, data, direction){
	var separator = 2*width/data.length,
	p = {
	    x:0,
	    y:0,
	    z:0
	},
	dobj = new THREE.Object3D();

	for ( var i = 0; i < data.length; i ++ ) {
	    var label = makeTextSprite(data[i]);

	    label.position.set(p.x,p.y,p.z);

	    dobj.add( label );
	    if (direction=="y"){
		p[direction]+=separator;
	    }else{
		p[direction]-=separator;
	    }

	}
	return dobj;
    }
    //========================================================================================


    //========================================================================================
    // Make Text Sprite
    // Creates a Text sprite to display along the grid side
    // This was written by Lee Stemkoski
    // https://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
    //========================================================================================
    var makeTextSprite = function( message, parameters ){
	if ( parameters === undefined ) parameters = {};

	var fontface = parameters["fontface"] || "Helvetica";
	var fontsize = parameters["fontsize"] || 70;
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = fontsize + "px " + fontface;

	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;

	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";
	context.fillText( message, 0, fontsize);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas)
	texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial({ map: texture, useScreenCoordinates: false});
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;
    }
    //========================================================================================


    //========================================================================================
    // Create A Grid
    // Creates a grid based on the options parameters provided
    // e.g. opts: { height: 500, width: 500, linesHeight: 10, linesWidth: 10, color: 0xFF0000 }
    //========================================================================================
    var createAGrid = function(opts){
	var gridTransparency = $scope.gimme("gridProperties").colors.globalTransparency;

	var config = opts || {
	    height: 500,
	    width: 500,
	    linesHeight: 10,
	    linesWidth: 10,
	    color: 0xDD006C
	};

	var material = new THREE.LineBasicMaterial({
	    color: config.color,
	    transparent: (gridTransparency != 1.0),
	    opacity: gridTransparency
	});

	var gridObject = new THREE.Object3D(),
	gridGeo= new THREE.Geometry(),
	stepw = 2*config.width/config.linesWidth,
	steph = 2*config.height/config.linesHeight;

	//width
	for ( var i = - config.width; i <= config.width; i += stepw ) {
	    gridGeo.vertices.push( new THREE.Vector3( - config.height, i,0 ) );
	    gridGeo.vertices.push( new THREE.Vector3(  config.height, i,0 ) );

	}
	//height
	for ( var i = - config.height; i <= config.height; i += steph ) {
	    gridGeo.vertices.push( new THREE.Vector3( i,- config.width,0 ) );
	    gridGeo.vertices.push( new THREE.Vector3( i, config.width, 0 ) );
	}

	var line = new THREE.Line( gridGeo, material, THREE.LinePieces );
	gridObject.add(line);

	return gridObject;
    }
    //========================================================================================


    //========================================================================================
    // Build Grids
    // Creates a set of 3 grids centered in Origo
    // x,y,z directions of a specified length.
    //========================================================================================
    var buildGrids = function( ) {
	var gridProps = $scope.gimme("gridProperties");
	var gridDimensions = gridProps.dimensions;
	var gridColors = gridProps.colors;
	var gridLabels = gridProps.labels;
	var origoOffset = gridProps.centerPointOrigoOffset;

	var width = gridDimensions.w/2;
	var depth = gridDimensions.d/2;
	var height = gridDimensions.h/2;
	var a = gridLabels.y.length;
	var b = gridLabels.x.length;
	var c = gridLabels.z.length;

	var boundingGrid = new THREE.Object3D();

	// x-y width back wall
	var newGridXY = createAGrid({
	    height: width,
	    width: height,
	    linesHeight: b,
	    linesWidth: a,
	    color: new THREE.Color( gridColors.xw )
	});
	//newGridXY.position.y = height;
	newGridXY.position.z = -depth;
	boundingGrid.add(newGridXY);

	// x-z depth floor
	var newGridYZ = createAGrid({
	    height: width,
	    width: depth,
	    linesHeight: b,
	    linesWidth: c,
	    color: new THREE.Color( gridColors.zd )
	});
	newGridYZ.rotation.x = Math.PI/2;
	newGridYZ.position.y = -height;
	boundingGrid.add(newGridYZ);

	// y-z height side wall
	var newGridXZ = createAGrid({
	    height: depth,
	    width: height,
	    linesHeight:c,
	    linesWidth: a,
	    color: new THREE.Color( gridColors.yh )
	});
	newGridXZ.position.x = width;
	//newGridXZ.position.y = height;
	newGridXZ.rotation.y = Math.PI/2;
	boundingGrid.add(newGridXZ);

	var labelsW = labelGridAxis(width, gridLabels.x,"x");
	labelsW.position.x = width+40;
	labelsW.position.y = -height -40;
	labelsW.position.z = depth;
	boundingGrid.add(labelsW);

	var labelsH = labelGridAxis(height, gridLabels.y,"y");
	labelsH.position.x = width;
	labelsH.position.y = - height +(2*height/a)-20;
	labelsH.position.z = depth;
	boundingGrid.add(labelsH);

	var labelsD = labelGridAxis(depth, gridLabels.z, "z");
	labelsD.position.x = width;
	labelsD.position.y = -(height)-40;
	labelsD.position.z = depth-40;
	boundingGrid.add(labelsD);

	boundingGrid.position.x = origoOffset.x;
	boundingGrid.position.y = origoOffset.y;
	boundingGrid.position.z = origoOffset.z;

	scene.add(boundingGrid);

	return boundingGrid;
    };
    //========================================================================================


    //========================================================================================
    // Execute Grid Visbility State
    // Turns on or off the visibility of the x y z grids depending on its current enabled state
    //========================================================================================
    var executeGridVisbilityState = function (){
	if(scene){
	    // Make sure the visibility of x y z axes is correct
	    if($scope.gimme("gridEnabled") && gridsContainer == undefined){
		gridsContainer = buildGrids( );
		gridsContainer.name = 'Grids';
		scene.add(gridsContainer);
	    }
	    else if(!$scope.gimme("gridEnabled") && gridsContainer !== undefined){
		scene.remove(gridsContainer);
		gridsContainer = undefined;
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
	lat2 = lat1; // TODO: check if this is really correct

	var φ1 = lat1.toRadians();
	var φ2 = lat2.toRadians();
	var Δφ = (lat2-lat1).toRadians(); // always 0?
	var Δλ = (lon2-lon1).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var dx = R * c;

	lat2 = thisCoord[0]
	lon2 = lon1; // TODO: check if this is really correct
	φ2 = lat2.toRadians();
	Δφ = (lat2-lat1).toRadians();
	Δλ = (lon2-lon1).toRadians(); // always 0?

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var dz = R * c;

	var dy = (height !== undefined ? height : 0);

	// TODO: check if this really works near the poles and when wrapping the date line, wrapping the 0 meridian etc.

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
	var sys = BrowserDetect;
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
	    info[2].innerHTML = "Fly Controls (movement speed: " + controls.movementSpeed + " (Num +/-)) (WASD: move, R|F: up | down, Q|E: roll, up|down: pitch, left|right: yaw) ( .(dot): Reset Camera) ( HOLD SHIFT: Record Movie)";
	}
	else if(camCtrl == CameraInteractionMode.Orbit){
	    controls = new THREE.OrbitControls( camera, threeDPlusHolder[0] );
	    controls.zoomSpeed = defaultControlSpeed / 10;
	    controls.autoRotate = $scope.gimme('autoOrbit');

	    if(sys.device != "Custom PC"){
		info[2].innerHTML = "Orbit Controls (Orbit: One Finger, Zoom: Two Fingers, Pan: Three Fingers)";
	    }
	    else{
		info[2].innerHTML = "Orbit Controls (zoom speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Orbit: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right) ( .(dot): Reset Camera) ( HOLD SHIFT: Record Movie)";
	    }
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
	    info[2].innerHTML = "Trackball Controls (Movement speed: " + controls.zoomSpeed + " (Num +/- (hold Shift for large steps))) (Rotate: Mouse left, Zoom: Mouse Middle, Pan: Mouse Right) ( .(dot): Reset Camera) ( HOLD SHIFT: Record Movie)";
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


    //========================================================================================
    // To Screen XY
    // Gets a vector3 world position and returns its 2D XY position inside the rendering div
    // (0,0 is the top left corner of the rendering div and not the screen of the web window)
    //========================================================================================
    function toScreenXY (position) {
	var pos = position.clone();
	var projScreenMat = new THREE.Matrix4();
	projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
	pos.applyMatrix4(projScreenMat);

	return { x: ( pos.x + 1 ) * renderer.domElement.width / 2, y: ( - pos.y + 1) * renderer.domElement.height / 2 };
    }
    //========================================================================================


    //========================================================================================
    // Get Predefined Color Key Name Array
    // Creates an array of name for each predefined color key set with manual input to
    // start with.
    //========================================================================================
    function getPCKNameArray (position) {
	var pckNames = ["Manual Input"];
	for(var i = 0; i < predefinedColorKeySets.length; i++){
	    pckNames.push(predefinedColorKeySets[i].name);
	}

	return pckNames;
    }
    //========================================================================================


    //====================================================================================================
    //=== FUNCTIONS FOR Drag & Drop of data from Data Source Webble ======================================
    //====================================================================================================

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
	    over: function(e, ui) {
		if(e.target.id == "theDropCanvas") {
		    updateDropZones(1, true);
		}
	    },
	    out: function() {
		updateDropZones(0.3, false);
	    },
	    tolerance: 'pointer',
	    drop: function(e, ui){
		// $log.log("drop event");
		if(e.target.id == "theDropCanvas") {

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

			    f = dropZone.forMapping;
			    ok = true;
			} 
		    }

		    if(ok) {
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

	    droppedDataMappings[src].newSelections = null;

    	    for(var f = 0; f < droppedDataMappings[src].map.length; f++) {

		droppedDataMappings[src].active = false;

		if(atLeastOneActive) { // only draw the first data set if we have many
		    break;
		}

    		if(droppedDataMappings[src].map[f].name == "3D") {
    		    have3D = true;
		    
    		    var fieldInfo = ls[droppedDataMappings[src].map[f].srcIdx];
		    if(droppedDataMappings[src].map[f].srcIdx >= ls.length || !dataDropTypeCheck(fieldInfo.type, drop3D.forMapping.type)) {
			have3D = false;
		    } else {
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
		    } else {
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
		    } else {
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
		    } else {
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
		    } else {
			sizeValues = fieldInfo.size;
			funValues = fieldInfo.val;
			selFunValues = fieldInfo.sel;
			droppedDataMappings[src].map[f].listen = fieldInfo.listen;
			droppedDataMappings[src].newSelections = fieldInfo.newSel;
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
		} else {
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

	    } else if(have3D && haveX && haveY && haveZ
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
	    	    // geoLocationAvailable = true;
		} else {
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

	    } else if(have3D && haveX && haveY && haveValues
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
		} else {
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

	    } else if(have3D && haveX && haveY
		      && size3Dx == sizeX
		      && size3Dy == sizeY
		     ) { // 3D + x + y

		atLeastOneActive = true;
		droppedDataMappings[src].active = true;

		$log.log("3D + x + y");

		if(haveLatitude && haveLongitude) {
		    droppedDataInfo.type = droppedDataInfoTypes.latlon3D;
		    droppedDataInfo.latlon = true;
		} else {
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
		    if(droppedDataMappings[src].map[ff].name == "X"
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

	    } else if(have3D && haveValues
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

	    } else if(have3D) { // 3D

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

	    } else if(haveX && haveY && haveZ && haveValues
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
		} else {
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

	    } else if(haveX && haveY && haveZ
		      && sizeX == sizeY
		      && sizeX == sizeZ
		     ) { // x + y + z

		$log.log("x + y + z");

		atLeastOneActive = true;
		droppedDataMappings[src].active = true;

		if(haveLatitude && haveLongitude) {
		    droppedDataInfo.type = droppedDataInfoTypes.latlonz;
		    droppedDataInfo.latlon = true;
		} else {
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
		} else {
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
	} else { // no data to draw
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

    	minmaxCounts3D = [];
    	minmaxCountsVals = null;
	
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
				
    				var posX = n;
    				var posY = k;
    				var posZ = i;

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
    				} else {
    				    if(c < minmaxCounts3D.length) {
    					minmaxCounts3D[c].minV = Math.min(minmaxCounts3D[c].minV, density);
    					minmaxCounts3D[c].maxV = Math.max(minmaxCounts3D[c].maxV, density);
    					minmaxCounts3D[c].minX = Math.min(minmaxCounts3D[c].minX, posX);
    					minmaxCounts3D[c].maxX = Math.max(minmaxCounts3D[c].maxX, posX);
    					minmaxCounts3D[c].minY = Math.min(minmaxCounts3D[c].minY, posY);
    					minmaxCounts3D[c].maxY = Math.max(minmaxCounts3D[c].maxY, posY);
    					minmaxCounts3D[c].minZ = Math.min(minmaxCounts3D[c].minZ, posZ);
    					minmaxCounts3D[c].maxZ = Math.max(minmaxCounts3D[c].maxZ, posZ);
    				    } else {
    					minmaxCounts3D.push({'minV':density, 'maxV':density,
    							     'minX':posX, 'maxX':posX,
    							     'minY':posX, 'maxY':posY,
    							     'minZ':posZ, 'maxZ':posZ});
    				    }
    				}
    			    } // density not null
    			} // for each X
    		    } // for each Y
    		} // for each Z
		
    		nullCounts3D.push(nullCount);
    		if(c >= minmaxCounts3D.length) {
    		    minmaxCounts3D.push({'minV':0, 'maxV':0, 'spanV':1,
    					 'minX':0, 'maxX':0, 'spanX':1,
    					 'minY':0, 'maxY':0, 'spanY':1,
    					 'minZ':0, 'maxZ':0, 'spanZ':1});
    		} else {
    		    minmaxCounts3D[c].spanV = (minmaxCounts3D[c].maxV - minmaxCounts3D[c].minV);
    		    if(minmaxCounts3D[c].spanV == 0) {
    		    	minmaxCounts3D[c].spanV = 1;
    		    }
    		    minmaxCounts3D[c].spanX = (minmaxCounts3D[c].maxX - minmaxCounts3D[c].minX);
    		    if(minmaxCounts3D[c].spanX == 0) {
    		    	minmaxCounts3D[c].spanX = 1;
    		    }
    		    minmaxCounts3D[c].spanY = (minmaxCounts3D[c].maxY - minmaxCounts3D[c].minY);
    		    if(minmaxCounts3D[c].spanY == 0) {
    		    	minmaxCounts3D[c].spanY = 1;
    		    }
    		    minmaxCounts3D[c].spanZ = (minmaxCounts3D[c].maxZ - minmaxCounts3D[c].minZ);
    		    if(minmaxCounts3D[c].spanZ == 0) {
    		    	minmaxCounts3D[c].spanZ = 1;
    		    }
    		}

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
		    }

    		    if(x === null 
    		       || y === null) {
    			nullCount += 1;
    		    } else {
    			if(minmaxCountsVals === null) {
    			    minmaxCountsVals = {'minV':v, 'maxV':v,
    						'minX':x, 'maxX':x,
    						'minY':y, 'maxY':y,
    						'minZ':z, 'maxZ':z};
    			} else {
    			    minmaxCountsVals.minV = Math.min(minmaxCountsVals.minV, v);
    			    minmaxCountsVals.maxV = Math.max(minmaxCountsVals.maxV, v);
    			    minmaxCountsVals.minX = Math.min(minmaxCountsVals.minX, x);
    			    minmaxCountsVals.maxX = Math.max(minmaxCountsVals.maxX, x);
    			    minmaxCountsVals.minY = Math.min(minmaxCountsVals.minY, y);
    			    minmaxCountsVals.maxY = Math.max(minmaxCountsVals.maxY, y);
    			    minmaxCountsVals.minZ = Math.min(minmaxCountsVals.minZ, z);
    			    minmaxCountsVals.maxZ = Math.max(minmaxCountsVals.maxZ, z);
    			}
    		    }
    		} // if x, y, z, val are not null
    	    } // for each point 

    	    nullCountsVals = nullCount;

    	    if(minmaxCountsVals === null) {
    		minmaxCountsVals = {'minV':0, 'maxV':0, 'spanV':1,
    				    'minX':0, 'maxX':0, 'spanX':1,
    				    'minY':0, 'maxY':0, 'spanY':1,
    				    'minZ':0, 'maxZ':0, 'spanZ':1
    				   };
    	    } else {
    		minmaxCountsVals.spanV = (minmaxCountsVals.maxV - minmaxCountsVals.minV);
    		if(minmaxCountsVals.spanV == 0) {
    		    minmaxCountsVals.spanV = 1;
    		}
    		minmaxCountsVals.spanX = (minmaxCountsVals.maxX - minmaxCountsVals.minX);
    		if(minmaxCountsVals.spanX == 0) {
    		    minmaxCountsVals.spanX = 1;
    		}
    		minmaxCountsVals.spanY = (minmaxCountsVals.maxY - minmaxCountsVals.minY);
    		if(minmaxCountsVals.spanY == 0) {
    		    minmaxCountsVals.spanY = 1;
    		}
    		minmaxCountsVals.spanZ = (minmaxCountsVals.maxZ - minmaxCountsVals.minZ);
    		if(minmaxCountsVals.spanZ == 0) {
    		    minmaxCountsVals.spanZ = 1;
    		}
    	    }
    	} // no 3D cube data
    }
    //===================================================================================


    //=== Jonas New Stuff ===============================================================================

    //========================================================================================
    // Fake Drop 
    // A way for other Webbles to fake a drag&drop event of data onto
    // this Webble.  This sets up a connection to a data source Webble
    // just as if the user had dropped some data field on the
    // specified drop zone.
    // ========================================================================================
    $scope.fakeDrop = function(dataSourceInfo, vizualizationFieldName) {
	var ok = false;
	var f = null;

	for(var d = 0; !ok && d < allDropZones.length; d++) {
	    var dropZone = allDropZones[d];
	    
	    if(dropZone.forMapping.name == vizualizationFieldName) {
		f = dropZone.forMapping;
		ok = true;
	    }
	}

	if(ok) {
	    dataDropped(dataSourceInfo, f);
	}
    };
    // ========================================================================================

    //========================================================================================
    // Clear Data Mappings
    // A way for the Webble itself and for other Webbles to make this
    // Webble reset all data source connections and forget all the
    // data dropped onto it before.
    // ========================================================================================
    $scope.clearDataMappings = function() {
	var oldMappings = droppedDataMappings;

	droppedDataMappings = [];

	for(var src = 0; src < oldMappings.length; src++) {
	    if(oldMappings[src].hasOwnProperty("listen")
	       && oldMappings[src].listen !== null) {
		oldMappings[src].listen(myInstanceId, false, null, null, []);
	    }
	    
	    for(var i = 0; i < oldMappings[src].map.length; i++) {
		if(oldMappings[src].map[i].hasOwnProperty("listen")
		   && oldMappings[src].map[i].listen !== null) {
		    oldMappings[src].map[i].listen(myInstanceId, false, null, null, []);
		}

		if(oldMappings[src].map[i].hasOwnProperty("newSelections")
		   && oldMappings[src].map[i].newSelections !== null) {
		    oldMappings[src].map[i].newSelections(myInstanceId, null, false, true);
		}
	    }

	    if(oldMappings[src].hasOwnProperty("newSelections")
	       && oldMappings[src].newSelections !== null) {
		oldMappings[src].newSelections(myInstanceId, null, false, true);
	    }
	}
	
	droppedDataInfo = {type: "none"};
	cubeNo = -1;
    };
    // ========================================================================================

    //========================================================================================
    // Select All
    // 
    // Selects all the data (resetting any previous seletions).
    // ========================================================================================
    $scope.selectAll = function() {
	updateLocalSelections(true);
	// saveSelectionsInSlot();
    }
    // ========================================================================================

    //========================================================================================
    // Update Local Selections
    // 
    // This tells the parent Webble that we have new user selections
    // (and prepares our own callback function that the parent will
    // later use to check selection status of individual points).
    // ========================================================================================
    function updateLocalSelections(selectAll) {

	// var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
	// if(newGrouping != grouping) {
	//     grouping = newGrouping;
	//     dirty = true;
	// }
	
	for(var src = 0; src < droppedDataMappings.length; src++) { 
	    if(droppedDataMappings[src].active) {
		var srcsrc = src;

    		if(droppedDataMappings[src].hasOwnProperty("newSelections")
		   && droppedDataMappings[src].newSelections !== null) {
		    droppedDataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAll);
		}

	    } else {
    		if(droppedDataMappings[src].hasOwnProperty("newSelections")
		   && droppedDataMappings[src].newSelections !== null) {
		    droppedDataMappings[src].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
		}

		for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
		    if(droppedDataMappings[src].map[ff].hasOwnProperty("listen") && droppedDataMappings[src].map[ff].listen !== null) {
			droppedDataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
		    }
		}
	    }
	}
    }
    // ========================================================================================

    //========================================================================================
    // My Selection Status
    // 
    // Callback function used by the parent Webble to query if a point
    // is in the user selected area or not.
    // ========================================================================================
    function mySelectionStatus(src, idx) {
	var grouping = $scope.gimme('MultipleSelectionsDifferentGroups'); 

	if(droppedDataMappings[src].active) {
	    if(insideParticlesIdxs.length > 0) {
		var insideIdx = binLookup(insideParticlesIdxs, idx, 0, insideParticlesIdxs.length);
		if(insideIdx >= 0) {
		    return 1;
		} else {
		    return 0;
		}
	    } else { 
		return 1; // no selection, treat everything as selected
	    }
	}
	return 1;

    }
    // ========================================================================================



    // ----------------------------------------------------------------------------------------
    // This part is not mine, it is adapted from TimothyGu/utm
    // https://github.com/TimothyGu/utm

    var K0 = 0.9996;

    var E = 0.00669438;
    var E2 = Math.pow(E, 2);
    var E3 = Math.pow(E, 3);
    var E_P2 = E / (1 - E);

    var SQRT_E = Math.sqrt(1 - E);
    var _E = (1 - SQRT_E) / (1 + SQRT_E);
    var _E2 = Math.pow(_E, 2);
    var _E3 = Math.pow(_E, 3);
    var _E4 = Math.pow(_E, 4);
    var _E5 = Math.pow(_E, 5);

    var M1 = 1 - E / 4 - 3 * E2 / 64 - 5 * E3 / 256;
    var M2 = 3 * E / 8 + 3 * E2 / 32 + 45 * E3 / 1024;
    var M3 = 15 * E2 / 256 + 45 * E3 / 1024;
    var M4 = 35 * E3 / 3072;

    var P2 = 3 / 2 * _E - 27 / 32 * _E3 + 269 / 512 * _E5;
    var P3 = 21 / 16 * _E2 - 55 / 32 * _E4;
    var P4 = 151 / 96 * _E3 - 417 / 128 * _E5;
    var P5 = 1097 / 512 * _E4;

    var R = 6378137;

    function convertLatLngToUtm(lat, lon) {
	var latitude = lat; // * 180 / Math.PI;
	var longitude = lon; // * 180 / Math.PI;

	latitude = Math.min(84, Math.max(-80, latitude)); // truncate to allowed range, TODO: do this better later

	if (latitude > 84 || latitude < -80) {
	    throw new RangeError('latitude out of range (must be between 80 deg S and 84 deg N)');
	}
	while(longitude < -180) {
	    longitude += 360;
	}
	while(longitude > 180) {
	    longitude -= 360;
	}

	var latRad = latitude / 180 * Math.PI;
	var latSin = Math.sin(latRad);
	var latCos = Math.cos(latRad);

	var latTan = Math.tan(latRad);
	var latTan2 = Math.pow(latTan, 2);
	var latTan4 = Math.pow(latTan, 4);

	var zoneNum = latLonToZoneNumber(latitude, longitude);

	var lonRad = longitude / 180 * Math.PI;
	var centralLon = zoneNumberToCentralLongitude(zoneNum);
	var centralLonRad = centralLon / 180 * Math.PI;

	var n = R / Math.sqrt(1 - E * latSin * latSin);
	var c = E_P2 * latCos * latCos;

	var a = latCos * (lonRad - centralLonRad);
	var a2 = Math.pow(a, 2);
	var a3 = Math.pow(a, 3);
	var a4 = Math.pow(a, 4);
	var a5 = Math.pow(a, 5);
	var a6 = Math.pow(a, 6);

	var m = R * (M1 * latRad -
		     M2 * Math.sin(2 * latRad) +
		     M3 * Math.sin(4 * latRad) -
		     M4 * Math.sin(6 * latRad));
	var easting = K0 * n * (a +
				a3 / 6 * (1 - latTan2 + c) +
				a5 / 120 * (5 - 18 * latTan2 + latTan4 + 72 * c - 58 * E_P2)) + 500000;
	var northing = K0 * (m + n * latTan * (a2 / 2 +
					       a4 / 24 * (5 - latTan2 + 9 * c + 4 * c * c) +
					       a6 / 720 * (61 - 58 * latTan2 + latTan4 + 600 * c - 330 * E_P2)));
	// if (latitude < 0) { 
	//     northing += 1e7;
	// }

	easting += zoneNum * 668000; // scale to size of largest zone (stretches things near the poles a lot

	return [easting, northing];
    }


    function latLonToZoneNumber(latitude, longitude) {
	if (56 <= latitude && latitude < 64 && 3 <= longitude && longitude < 12) return 32;

	if (72 <= latitude && latitude <= 84 && longitude >= 0) {
	    if (longitude <  9) return 31;
	    if (longitude < 21) return 33;
	    if (longitude < 33) return 35;
	    if (longitude < 42) return 37;
	}

	return Math.floor((longitude + 180) / 6) + 1;
    }

    function zoneNumberToCentralLongitude(zoneNum) {
	return (zoneNum - 1) * 6 - 180 + 3;
    }

    // ------------------------------ end of code to convert lat/lng to utm -----------------------------------





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
