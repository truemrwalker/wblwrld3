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
    var threeDPlusContainer, threeDPlusHolder, info, info2;

    var internalFilesPath;

    //Used for keeping track if a slot is disabled in some way or another (higher values include all lower ones)
    var availableDataTypes = {
	Unidentified: 0,
	Classic: 1,
	SpaceDensity: 2,
	SkyReflectivity: 3
    };

    // JSON 3D Points data
    // var liveData = [];
    var dataType = availableDataTypes.Unidentified;
    var allDataPointsSorted = [];
    var minValueThreshold = 0, maxValueThreshold = 0, thresholdRange = 0;
    var chromaticScale, centerPoint;
    var geoLocationAvailable = false;
    var currentMapZoom = 11;
    var currentMapType = "roadmap";
    var currentHeightMap = "";
    var noOfDataPointsForEachXYZ = [0, 0, 0];
    var loopDataSliceTracking, loopTimeSliceTimer;

    // three.js objects
    var scene, camera, renderer;
    var light, lightAmb;
    var controls;

    // three.js world axes and other support objects (geometry, mesh, material etc)
    var axes, mapPlane, mapImageTexture, mapTerrianTexture;

    // Loaded 3D mesh, created by 3D live data
    var pointsMeshes = [], particles, uniforms;
    var shaderMaterial, dotsGeometry;
    var positions, colors, sizes, matrixLocations, mapCoordinates, reflectivities, densities;

    // Mouse Interaction
    var raycaster, intersects;
    var mouse, mouse_click, isMouseClicked = false, INTERSECTED, particleOriginalSize = 1.0;
    var intersectedMemory = new Float32Array( 4 );

    // Data related constants
    var dBZChromaNarrow = ['666467', '00E6EA', '01A1F9', '0000F4', '03FE00', '01C700', '008D01', 'FCFE00', 'E5BC00', 'FF9406', 'FA0000', 'D00500', 'C00001', 'F804FF'];
    var dBZChromaFull = ['646368', 'C9FBFC', 'CE9BD6',  '98679E',  '712D66',  'CDCD9B',  '969A5F', '666467', '00E6EA', '01A1F9', '0000F4', '03FE00', '01C700', '008D01', 'FCFE00', 'E5BC00', 'FF9406', 'FA0000', 'D00500', 'C00001', 'F804FF', '9A54C8', 'FDFDFD'];
    var cloudyChroma = ['white', 'eeeeee', '43464c'];


    // Webble Menu and Interaction Balls
    $scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data Slot'}, {itemId: 'nextTimeSlice', itemTxt: 'Next Time Slice'}];
    $scope.customInteractionBalls = [{index: 4, name: 'clearData', tooltipTxt: 'Clear Data Slot'}, {index: 5, name: 'nextTimeSlice', tooltipTxt: 'Next Time Slice'}];


    // Drag & Drop of data fields (Jonas)
    var dropCanvas = null;

    var dropVal = {'left':0, 'top':0, 'right':300, 'bottom':250, "forMapping":{'name':'Values', 'type':['number']}, "label":"Values", "rotate":false};
    var drop3D = {'left':0, 'top':300, 'right':300, 'bottom':500, "forMapping":{'name':'3D', 'type':['3Darray']}, "label":"3D data", "rotate":false};
    var dropZ = {'left':300, 'top':0, 'right':400, 'bottom':500, "forMapping":{'name':'Z', 'type':['number']}, "label":"Z coordinates", "rotate":true};
    var dropY = {'left':400, 'top':0, 'right':500, 'bottom':500, "forMapping":{'name':'Y', 'type':['latitude','number']}, "label":"Y Coordinates", "rotate":true};
    var dropX = {'left':500, 'top':0, 'right':600, 'bottom':500, "forMapping":{'name':'X', 'type':['longitude','number']}, "label":"X coordinates", "rotate":true};
    
    var allDropZones = [dropVal, drop3D, dropZ, dropY, dropX];

    var droppedDataMappings = []; // to keep track of what has been dropped on us so far

    var myInstanceId = -1;

    var droppedDataInfo = {"type":"none"};
    var droppedDataInfoTypes = {
	"none":0,
	"only3D":1,
	"latlon3D":2,
	"latlonval":3,
	"latlonval3D":4,
	"latlonz":5,
	"latlonz3D":6 ,
	"latlonzval":7,
	"latlonzval3D":8,
	"val3D":9,
	"xy3D":10,
	"xyval":11,
	"xyval3D":12,
	"xyz":13,
	"xyz3D":14,
	"xyzval":15,
	"xyzval3D":16
    };

    var colorMethod = 0;
    var colorKey = [ "#73feff", "#38d5ff", "#0880ff", "#73fa79", "#39d142", "#3da642", "#248f01", "#0b4100", "#fffb01", "#fca942", "#f94c01", "#ac1942", "#ab28aa", "#d82da9", "#f985ff"];
    var colorScheme = {"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
		       "selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
		       "groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
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
				 14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
    var groupColors = {}; // cache the colors above 

    
    var cubeNo = -1; // when we have more than one cube of 3D data but only render one, this is used to keep track of which one
    
    var classicThreshold = 1000; // if we have more values than this, draw data with points instead of objects
    var independentScaling = false;

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
    
	if (latitude > 84 || latitude < -80) {
	    throw new RangeError('latitude out of range (must be between 80 deg S and 84 deg N)');
	}
	while(longitude < -180) {
	    longitude += 360;
	}
	while(longitude > 180) {
	    longitude -+ 360;
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
	if (latitude < 0) northing += 1e7;

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




    //=== EVENT HANDLERS ================================================================


    //===================================================================================
    // Mouse move event handler for within the 3D view
    //===================================================================================
    function on3DMouseMove( event ) {
	event.preventDefault();

	mouse.x = ( event.offsetX / parseFloat($scope.gimme('threeDPlusHolder:width')) ) * 2 - 1;
	mouse.y = - ( event.offsetY / parseFloat($scope.gimme('threeDPlusHolder:height')) ) * 2 + 1;
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
	    event.stopImmediatePropagation();
	    mouse_click.x = ( event.offsetX / parseFloat($scope.gimme('threeDPlusHolder:width')) ) * 2 - 1;
	    mouse_click.y = - ( event.offsetY / parseFloat($scope.gimme('threeDPlusHolder:height')) ) * 2 + 1;
	}
    }
    //===================================================================================


    //===================================================================================
    // Is Info Text Displayed As It Should
    // Makes sure the info text box has been updated and rendered correctly before
    // calling the calculation heavy Redraw function.
    //===================================================================================
    function isInfoTextDisplayedAsItShould() {
	if(!$scope.waiting()){$scope.waiting(true);}
	if(info.innerHTML !== "" && $scope.waiting()){ $timeout(redrawScene, 100); }
	else{ $timeout(isInfoTextDisplayedAsItShould, 10); }
    }
    //===================================================================================


    //===================================================================================
    // Loop Time Slice Forward
    // time triggered event that for each tick moves to the next data set ackording to
    // ordered timestamps
    //===================================================================================
    function loopTimeSliceForward() {
	if(dataType == availableDataTypes.SkyReflectivity && loopDataSliceTracking){
	    loopDataSliceTracking.currentSlice++;
	    if(loopDataSliceTracking.currentSlice == (loopDataSliceTracking.availableSlices.length)){
		loopDataSliceTracking.currentSlice = 0;
	    }
	    $scope.set("currentDataSet", loopDataSliceTracking.availableSlices[loopDataSliceTracking.currentSlice].toString());

	    var loopTimeCycle = parseInt($scope.gimme("loopTimeSlices"));
	    if(loopTimeCycle > 0){
		loopTimeSliceTimer = $timeout(loopTimeSliceForward, loopTimeCycle * 1000);
	    }
	}
    }
    //===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
    	// Assigning jquery access elements
        threeDPlusContainer = $scope.theView.parent().find("#threeDPlusContainer");
        threeDPlusHolder = $scope.theView.parent().find("#threeDPlusHolder");
	internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

	// Pre Assigning js library variables that are being used
	chromaticScale = chroma.scale(['green', 'red']);
	centerPoint = new THREE.Vector3(0,0,0);

	// Info text div
	info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '12px';
	info.style.left = '14px';
	info.style.width = '30%';
	info.style.textAlign = 'left';
	info.style.color = 'white';
	info.innerHTML = '';
	($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild( info );

	info2 = document.createElement( 'div' );
	info2.style.position = 'absolute';
	info2.style.top = '12px';
	info2.style.right = '14px';
	info2.style.width = '40%';
	info2.style.textAlign = 'right';
	info2.style.color = 'yellow';
	info2.innerHTML = '';
	($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild( info2 );

	// Webble Event Listener: Slot Change
	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // Resize 3D Viewport if Webble size change
	    if(eventData.slotName == 'threeDPlusHolder:width' || eventData.slotName == 'threeDPlusHolder:height'){
		if(renderer){
		    renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));

		    if(controls !== undefined){
			controls.handleResize();
		    }
		}

		updateDropZonesSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height'))); // Jonas

	    }

	    else if(eventData.slotName == 'AxesEnabled'){
		if(eventData.slotValue && axes == undefined || !eventData.slotValue && axes !== undefined){
		    executeAxisVisbilityState();
		}
	    }

	    else if(eventData.slotName == "ClassicModeThreshold") {
		var newClassicThreshold = parseInt(eventData.slotValue);
		if(newClassicThreshold >= 0 && classicThreshold != newClassicThreshold) {
		    classicThreshold = newClassicThreshold;
		    redrawScene();
		}
	    }

	    else if(eventData.slotName == "ScaleAxesIndependently") {
		var newindependentScaling = eventData.slotValue;
		if(newindependentScaling && !independentScaling) {
		    independentScaling = true;
		    redrawScene();
		} else if(!newindependentScaling && independentScaling) {
		    independentScaling = false;
		    redrawScene();
		}
	    }

	    else if(eventData.slotName == "ColorKey") {
		colorKey = eventData.slotValue;
		if(typeof colorKey[0] != 'string' && colorKey[0].length > 1) { // colors and limits
    		    colorKey.sort(function (a,b) { return a[0] - b[0]; });
		}
		
		if(colorMethod == 2) {// using color key
		    for(var src = 0; src < droppedDataMappings.length; src++) {
    			if(droppedDataMappings[src].active) {
			    redrawScene();
			    break;
			}
		    }
		}
	    } else if(eventData.slotName == "ColorMethod") {
		var newCM = eventData.slotValue;
		if(newCM != colorMethod) {
		    colorMethod = newCM;
		    for(var src = 0; src < droppedDataMappings.length; src++) {
			if(droppedDataMappings[src].active) {
			    redrawScene();
			    break;
			}
		    }
		}
	    } else if(eventData.slotName == "ColorMethod") {
		redrawScene();
	    } else if(eventData.slotName == "ColorScheme") {
		colorScheme = eventData.slotValue;
		buildColorCache();
		redrawScene();
	    }

	    else if(eventData.slotName == 'glowAlphaTexture' || eventData.slotName == 'PixelColorBlending'){
		if(particles){
		    particles.material = createShaderMaterial();
		}
	    }

	    else if(eventData.slotName == 'DataPointSize'){
		if(dataType == availableDataTypes.Classic){
		    redrawScene();
		}
	    }

	    else if(eventData.slotName == 'currentDataSet'){
		if(dataType == availableDataTypes.SkyReflectivity){
		    if(eventData.slotValue != info2.innerHTML){

			for(var i = 0; i < loopDataSliceTracking.availableSlices.length; i++){
			    if(loopDataSliceTracking.availableSlices[i].toString() == eventData.slotValue){
				loopDataSliceTracking.currentSlice = i;
				break;
			    }
			}
			redrawScene();
		    }
		}
	    }

	    else if(eventData.slotName == 'dBZColorsEnabled'){
		var chromeArr = cloudyChroma;
		if(eventData.slotValue == true){ chromeArr = dBZChromaNarrow; }
		if(chromeArr != $scope.gimme("particleColorArray")){
		    $scope.set("particleColorArray", chromeArr);
		}
	    }

	    else if(eventData.slotName == 'mapZoom'){
		if(!isNaN(eventData.slotValue) && eventData.slotValue > 0 && eventData.slotValue <= 22 && eventData.slotValue != currentMapZoom){
		    enableGeoLocationSupport();
		}
		else{
		    $scope.set("mapZoom", 11);
		}
	    }

	    else if(eventData.slotName == 'mapType'){
		if((eventData.slotValue == "roadmap" || eventData.slotValue == "satellite" || eventData.slotValue == "hybrid" || eventData.slotValue == "terrain") && eventData.slotValue != currentMapType){
		    enableGeoLocationSupport();
		}
		else{
		    $scope.set("mapType", "roadmap");
		}
	    }

	    else if(eventData.slotName == 'manualHeightMap'){
		if(eventData.slotValue != currentHeightMap){
		    enableGeoLocationSupport();
		}
	    }

	    else if(eventData.slotName == 'backsideMapEnabled'){
		enableGeoLocationSupport();
	    }

	    else if(eventData.slotName == 'loopTimeSlices'){
		if(dataType == availableDataTypes.SkyReflectivity && loopDataSliceTracking && eventData.slotValue > 0){
		    loopTimeSliceTimer = $timeout(loopTimeSliceForward, parseInt(eventData.slotValue) * 1000);
		}
		else{
		    $timeout.cancel(loopTimeSliceTimer);
		    loopDataSliceTracking = undefined;
		}
	    }

	    else if(eventData.slotName == 'particleMinMaxSizes'){
		if(dataType == availableDataTypes.SpaceDensity){
		    if(eventData.slotValue.min != undefined && eventData.slotValue.max != undefined){
			if(particles){
			    setParticleAttributes(particles.geometry.attributes.density.array, [], particles.geometry.attributes.size.array);
			    particles.geometry.attributes.size.needsUpdate = true;
			}
		    }
		    else{
			$scope.set("particleMinMaxSizes", {min: 0.1, max: 3.0});
		    }
		}
	    }

	    else if(eventData.slotName == 'particleColorArray'){
		try {
		    if(dataType != availableDataTypes.SkyReflectivity){ chromaticScale = chroma.scale(eventData.slotValue); }
		    else { chromaticScale = chroma.scale(eventData.slotValue).domain([0, 35, 65]); }

		    if(particles){
			$scope.waiting(true);
			$timeout(function () {
			    if(dataType == availableDataTypes.SkyReflectivity){ setParticleAttributes(particles.geometry.attributes.reflectivity.array, particles.geometry.attributes.customColor.array, []); }
			    else{ setParticleAttributes(particles.geometry.attributes.density.array, particles.geometry.attributes.customColor.array, []); }
			    particles.geometry.attributes.customColor.needsUpdate = true;
			    $scope.waiting(false);
			}, 100);
		    }
		} catch(e) {
		    $scope.set("particleColorArray", ['white', 'black']);
		}
	    }

	    else if(eventData.slotName == 'particleMinMaxAlpha'){
		if(dataType == availableDataTypes.SpaceDensity){
		    if(eventData.slotValue.underThreshold != undefined && eventData.slotValue.aboveThreshold != undefined && eventData.slotValue.betweenThresholdMin != undefined && eventData.slotValue.betweenThresholdMax != undefined){
			if(particles){
			    $scope.waiting(true);
			    $timeout(function () {
				setParticleAttributes(particles.geometry.attributes.density.array, particles.geometry.attributes.customColor.array, []);
				particles.geometry.attributes.customColor.needsUpdate = true;
				$scope.waiting(false);
			    }, 100);
			}
		    }
		    else{
			$scope.set("particleMinMaxAlpha", {underThreshold: 0.0, aboveThreshold: 0.7, betweenThresholdMin: 0.1, betweenThresholdMax: 0.7});
		    }
		}
	    }

	    else if(eventData.slotName == 'particleDistance'){
		// todo, fix this later
	    }

	    else if(eventData.slotName == 'minThreshold' || eventData.slotName == 'maxThreshold'){
		if(dataType == availableDataTypes.SpaceDensity){
		    if(particles){
			$scope.waiting(true);
			minValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("minThreshold"))];
			maxValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("maxThreshold")) - 1];
			thresholdRange = Math.abs(maxValueThreshold - minValueThreshold);

			$timeout(function () {
			    setParticleAttributes(particles.geometry.attributes.density.array, particles.geometry.attributes.customColor.array, []);
			    particles.geometry.attributes.customColor.needsUpdate = true;
			    $scope.waiting(false);
			}, 100);
		    }
		}
	    }

	    else if(eventData.slotName == 'colorBoostEnabled'){
		if(particles && dataType == availableDataTypes.SpaceDensity){
		    $scope.waiting(true);
		    $timeout(function () {
			setParticleAttributes(particles.geometry.attributes.density.array, particles.geometry.attributes.customColor.array, []);
			particles.geometry.attributes.customColor.needsUpdate = true;
			$scope.waiting(false);
		    }, 100);
		}
	    }

	    else if(eventData.slotName == 'objectTargetEnabled'){
		if(controls != undefined){
		    if(eventData.slotValue == true){
			controls.target = centerPoint;
			camera.lookAt(centerPoint);
		    }
		    else{
			controls.target.set(0, 0, 0);
			camera.lookAt(new THREE.Vector3(0,0,0));
		    }
		}
	    }

	    else if(eventData.slotName == 'autoOrbit'){
		if(controls != undefined){
		    controls.autoRotate = eventData.slotValue;
		}
	    }
	});


	myInstanceId = $scope.getInstanceId();

	// Webble Event Listeners: Was Pasted
	$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventData){
	    // Fix so that Mouse interaction in child works as expected
	    $scope.getParent().scope().theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
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

	$scope.addSlot(new Slot('jsonDataInfo',
				"NO DATA LOADED",
				'JSON Data Info',
				'Information and/or description of currently loaded JSON Data',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.TextBox},
				undefined
			       ));
	$scope.getSlot("jsonDataInfo").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

	$scope.addSlot(new Slot('objectTargetEnabled',
				false,
				'Orbit Object Enabled',
				'If enabled the Orbit control will spin around the center of the current loaded data, otherwise orbit around the ceneter of the world (0,0,0)',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('autoOrbit',
				false,
				'Auto Orbit',
				'If enabled the camera will automaticly orbit around the orbit center, otherwise manual orbit only',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	//*** Combined Sky Reflectivety & Space Density Slots
	$scope.addSlot(new Slot('glowAlphaTexture',
				1,
				'Glow Alpha Texture',
				'A glow effect texture for each data point',
				"Sky Reflectivity & Space Density",
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["None", "spark.png", "gradient.png", "cloudy.png"]},
				undefined
			       ));

	$scope.addSlot(new Slot('PixelColorBlending',
				1,
				'Pixel Color Blending',
				'How pixels on top of each other should blend',
				"Sky Reflectivity & Space Density",
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["No Blending", "Normal", "Additive"]},
				undefined
			       ));

	$scope.addSlot(new Slot('particleColorArray',
				['black', 'white'],
				'Particle Color Array',
				'The chromatic scale being used from lower to higher values of a particle. (any number of colors are allowed in any color format)',
				"Sky Reflectivity & Space Density",
				undefined,
				undefined
			       ));

	//*** Sky Reflectivety
	$scope.addSlot(new Slot('currentDataSet',
				"None",
				'Current data Set',
				'If multiple datasets are loaded (separated by time stamps) this is where one can select which dataset at what time one wants to study',
				"Sky Reflectivity",
				{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ["None"]},
				undefined
			       ));
	$scope.getSlot("currentDataSet").setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	$scope.addSlot(new Slot('dBZColorsEnabled',
				false,
				'Enable dBZ Color Scheme',
				'When enabled the Reflectivity color scheme that will be used is the international meteorology dBZ color scheme used in weather radar data',
				"Sky Reflectivity",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('mapZoom',
				11,
				'Map Zoom Level',
				'The current zoom level for the Google static map being used (ranging from 1-22 where 11 being default)',
				"Sky Reflectivity",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('mapType',
				"roadmap",
				'Map Type',
				'The current map type, such as road map or satellite image etc',
				"Sky Reflectivity",
				{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ["roadmap", "satellite", "hybrid", "terrain"]},
				undefined
			       ));

	$scope.addSlot(new Slot('manualHeightMap',
				"",
				'Height Map',
				'Since there is currently no open web service for retrieving height maps for a specific region, the user needs to manually create and apply such a height map to get the altitude of a map area to show.',
				"Sky Reflectivity",
				{inputType: Enum.aopInputTypes.ImagePick},
				undefined
			       ));

	$scope.addSlot(new Slot('backsideMapEnabled',
				false,
				'Map Backside Visible',
				'If Enabled the map will be visible also on the backside of the plane, otherwise a dark soil texture will be used instead for representing the back side.',
				"Sky Reflectivity",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('loopTimeSlices',
				0,
				'Loop Time Slices',
				'If set to 0 no looping will be enabled, but any other positive vaIue will indicate the number of seconds before the data set for the next time slice will be loaded. When reaching the end the first data set will be reloaded and the looping continues.',
				"Sky Reflectivity",
				undefined,
				undefined
			       ));

	//*** Space Density Slots
	$scope.addSlot(new Slot('particleMinMaxSizes',
				{min: 0.1, max: 3.0},
				'Particle Min/Max Size',
				'The minimum & maximum size of a particle (applied to particles depending on their data value compared to each other)',
				"Space Density",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('particleMinMaxAlpha',
				{underThreshold: 0.0, aboveThreshold: 0.7, betweenThresholdMin: 0.1, betweenThresholdMax: 0.7},
				'Particle Min/Max Alpha',
				'The alpha value of a particle depending on its  data value within the thresholds.',
				"Space Density",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('particleDistance',
				3.0,
				'Particle Distance',
				'The distance between each particle.',
				"Space Density",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('minThreshold',
				0.0,
				'Minimum Threshold',
				'The minimum percentage point of all data points that should be considered lowest minimum.',
				"Space Density",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('maxThreshold',
				0.99,
				'Maximum Threshold',
				'The maximum percentage point of all data points that should be considered highest maximum.',
				"Space Density",
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('colorBoostEnabled',
				true,
				'Color Boost Enabled',
				'When enabled the colors of the space points will be much more colorful and enhanced, not necessarily correct, but perhaps more beautiful.',
				"Space Density",
				undefined,
				undefined
			       ));


	//*** Classic Slots
	$scope.addSlot(new Slot('DataPointSize',
				0.2,
				'Data Point Size',
				'The size of the mesh geometry for each data point',
				"Classic",
				undefined,
				undefined
			       ));


	// =========== slots from Jonas ====================

	$scope.addSlot(new Slot('ColorScheme',
				colorScheme,
    				"Color Scheme",
    				'Input Slot. Mapping group numbers to colors.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));


        $scope.addSlot(new Slot('ColorMethod',
				colorMethod,
				"Color Method",
				'How to pick colors for the data.',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Group Color + Alpha (min to max)", "Group Color + Alpha (histogram)", "Color Key"]},
				undefined
			       ));
	
        $scope.addSlot(new Slot('ColorKey',
				colorKey, 
				"Color Key",
				'The color key (mapping from value to color) to use when "Color Method" is set to "Color Key".',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	
        $scope.addSlot(new Slot('ClassicModeThreshold',
				classicThreshold, 
				"Classic Mode Threshold",
				'If there are more objects (data values) than this, draw data with points instead of objects.',
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

	//=======

	// Webble initiations
        $scope.setResizeSlots('threeDPlusHolder:width', 'threeDPlusHolder:height');
        $scope.theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
        threeDPlusHolder.bind('contextmenu',function(){ if(!$scope.altKeyIsDown){return false;} });

	buildColorCache();

	// WebGL presence check
	if (Detector.webgl) {
	    init3D();
	    executeAxisVisbilityState();
	    redrawScene();
	} else {
	    var warning = Detector.getWebGLErrorMessage();
	    warning.innerText = "Your Browser does not support WebGL and can therefore not display 3D graphics. \nWe recommend that you change browser.";
	    ($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(warning);
	}
	
	updateDropZonesSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height'))); // Jonas
	$scope.setupDroppable(); // start listening to drag&drop events
    };
    //===================================================================================


    //=== WEBBLE SUPPORT FUNCTIONS ======================================================================
    //========================================================================================
    // Rename Keys
    // Change the key names of a object if given the object to change and an object mapping
    // current key with a string of the new key name
    //========================================================================================
    var renameKeys = function(obj, newKeys) {
	const keyValues = Object.keys(obj).map(key => {
	    const newKey = newKeys[key] || key;
	    return { [newKey]: obj[key] };
	});
	return Object.assign({}, ...keyValues);
    };
    //========================================================================================



    //=== THREE.JS BASIC FUNCTIONS ======================================================================

    //========================================================================================
    // Initiate 3D
    // Initiates the scene, renderer and the camera controller for 3D drawing.
    //========================================================================================
    var init3D = function() {
	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
	($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(renderer.domElement);

	// camera
	camera = new THREE.PerspectiveCamera(75, parseInt($scope.gimme('threeDPlusHolder:width')) / parseInt($scope.gimme('threeDPlusHolder:height')), 0.000001, 100000);
	camera.position.set(0, 0, 15);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	// scene
	scene = new THREE.Scene();

	// fog
	scene.fog = new THREE.FogExp2(0x000000, 0.0007);

	// Light
	lightAmb = new THREE.AmbientLight( 0xF0F0F0, 0.0 ); // soft white light
	scene.add( lightAmb );

	light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set( 10, 10, 10 ).normalize();
	scene.add( light );

	// Particle Interaction
	raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 4;
	mouse = new THREE.Vector2();
	mouse_click = new THREE.Vector2();
	threeDPlusHolder[0].addEventListener( 'mousemove', on3DMouseMove, false );
	threeDPlusHolder[0].addEventListener( 'mousedown', on3DMouseClick, false );

        // controls
	// controls = new THREE.OrbitControls( camera, threeDPlusHolder[0] );
	controls = new THREE.TrackballControls( camera, threeDPlusHolder[0] );
	controls.rotateSpeed = 1.5;
	controls.zoomSpeed = 1.5;
	controls.panSpeed = 1.0;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.keys = [ 65, 83, 68 ];
	controls.addEventListener( 'change', render );
    };
    //========================================================================================


    //========================================================================================
    // Animate
    // the animation cycle control function
    //========================================================================================
    var animate = function() {
	requestAnimationFrame( animate );

	light.position.copy( camera.position );
	
	if(controls !== undefined){
	    controls.update();
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
	if(particles != undefined && (dataType == availableDataTypes.SpaceDensity || dataType == availableDataTypes.SkyReflectivity) && isMouseClicked) {
	    var geometry = particles.geometry;
	    var attributes = geometry.attributes;

	    raycaster.setFromCamera( mouse_click, camera );
	    intersects = raycaster.intersectObject( particles, true );

	    var onlyVisibleIntersects = [];
	    for(var i = 0; i < intersects.length; i++){
		var index = intersects[i].index;
		if(attributes.customColor.array[index * 4 + 3 ] > 0){
		    onlyVisibleIntersects.push(intersects[i]);
		}
	    }
	    intersects = onlyVisibleIntersects;

	    if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].index ) {
		    if(INTERSECTED != null && INTERSECTED != undefined && intersectedMemory[0] != undefined){
			attributes.customColor.array[ INTERSECTED * 4 + 0 ] = intersectedMemory[0]; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = intersectedMemory[1]; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = intersectedMemory[2]; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = intersectedMemory[3];
			attributes.size.array[ INTERSECTED ] = intersectedMemory[4];
		    };
		    INTERSECTED = intersects[ 0 ].index;
		    intersectedMemory[0] = attributes.customColor.array[ INTERSECTED * 4 + 0 ]; intersectedMemory[1] = attributes.customColor.array[ INTERSECTED * 4 + 1 ]; intersectedMemory[2] = attributes.customColor.array[ INTERSECTED * 4 + 2 ]; intersectedMemory[3] = attributes.customColor.array[ INTERSECTED * 4 + 3 ];
		    intersectedMemory[4] = attributes.size.array[ INTERSECTED ];
		    attributes.customColor.array[ INTERSECTED * 4 + 0 ] = 1.0; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = 0.0; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = 0.0; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = 1.0;
		    attributes.size.array[ INTERSECTED ] = (dataType == availableDataTypes.SpaceDensity) ? 100.0 : 25.0;
		    attributes.customColor.needsUpdate = true;
		    attributes.size.needsUpdate = true;

		    var dataValue;
		    var location;
		    if(dataType == availableDataTypes.SpaceDensity) {
			dataValue = attributes.density.array[ INTERSECTED ];
			location = "[" + attributes.matrixLocation.array[ INTERSECTED * 3 + 0 ] + "][" + attributes.matrixLocation.array[ INTERSECTED * 3 + 1 ] + "][" + attributes.matrixLocation.array[ INTERSECTED * 3 + 2 ] + "]";
		    }
		    else{
			dataValue = attributes.reflectivity.array[ INTERSECTED ];
			location = "[" + attributes.mapCoordinate.array[ INTERSECTED * 3 + 0 ] + "][" + attributes.mapCoordinate.array[ INTERSECTED * 3 + 1 ] + "][" + attributes.mapCoordinate.array[ INTERSECTED * 3 + 2 ] + "]";
		    }

		    if(!info.innerHTML.includes("Rendering")){ info.innerHTML = location + ": " + dataValue; }
		}
	    } else {
		if(INTERSECTED != null && INTERSECTED != undefined && intersectedMemory[0] != undefined){
		    attributes.customColor.array[ INTERSECTED * 4 + 0 ] = intersectedMemory[0]; attributes.customColor.array[ INTERSECTED * 4 + 1 ] = intersectedMemory[1]; attributes.customColor.array[ INTERSECTED * 4 + 2 ] = intersectedMemory[2]; attributes.customColor.array[ INTERSECTED * 4 + 3 ] = intersectedMemory[3];
		    attributes.size.array[ INTERSECTED ] = intersectedMemory[4];
		    INTERSECTED = null;
		    attributes.customColor.needsUpdate = true;
		    attributes.size.needsUpdate = true;
		};
		if(!info.innerHTML.includes("Rendering")){ info.innerHTML = ""; }
	    }

	    isMouseClicked = false;
	}
	else if(pointsMeshes.length > 0 && dataType == availableDataTypes.Classic){
	    raycaster.setFromCamera( mouse, camera );
	    intersects = raycaster.intersectObjects( pointsMeshes );
	    if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
		    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		    INTERSECTED = intersects[ 0 ].object;
		    INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
		    INTERSECTED.material.emissive.setHex( 0xffffff );

		    // update text, if it has a "name" field.
		    if ( INTERSECTED.name ) {
			if(!info.innerHTML.includes("Rendering")){
			    info.innerHTML = INTERSECTED.name + ": ( x = " + INTERSECTED.position.x.toFixed(2) + ", y = " + INTERSECTED.position.y.toFixed(2) + ", z = " + INTERSECTED.position.z.toFixed(2) + " )";
			}
		    }
		    else {
			if(!info.innerHTML.includes("Rendering")){ info.innerHTML = ""; }
		    }
		}
	    } else {
		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		INTERSECTED = null;
		if(!info.innerHTML.includes("Rendering")){ info.innerHTML = ""; }
	    }
	    //--------------------------------------
	}

	renderer.render(scene, camera);
    };
    //========================================================================================



    //=== WEBBLE-CHANGE-DEPENDANT RE-RENDERING FUNCTIONS ======================================================================


    //========================================================================================
    // Redraw Points Cloud
    // draw lots of points in space
    //========================================================================================
    function redrawPointsCloud(keepScene, have3D) {
	var haveX = false;
	var haveY = false;
	var haveZ = false;
	var haveValues = false;

    	if(colorScheme !== null && colorScheme !== undefined
	   && colorScheme.hasOwnProperty("skin") 
	   && colorScheme.skin.hasOwnProperty("color")) {
	    var temp = hexColorToRGBAvec(colorScheme.skin.color, 1);
	    // var bgCol = temp[0] * 255 * 255 + temp[1] * 255 + temp[2];

	    scene.background = new THREE.Color(temp[0], temp[1], temp[2]);

	} else {
	    scene.background = new THREE.Color( 0x000000 ); //space black
	}

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
	}
	if(!have3D) {
	    noOfPoints = droppedDataInfo.sizeX; // conservative estimate, we may use fewer
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

		    var particleDist = $scope.gimme("particleDistance");

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
			    
			    if(geoLocationAvailable) {
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

	colors = []; sizes = []; densities = [];
	colors = new Float32Array( noOfPoints * 4 );
	sizes = new Float32Array( noOfPoints );
	densities = new Float32Array( noOfPoints );

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
				
				densities[densArrIndex++] = density;

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
					    if(geoLocationAvailable) {
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

		    if(i == 0) {
			densityMin = density;
			densityMax = density;

		    } else {
			densityMin = Math.min(densityMin, density);
			densityMax = Math.max(densityMax, density);
		    }

		    densities[densArrIndex++] = density;

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

			if(i == 0) {
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
		    positions[ posArrIndex + 2 ] = (positions[ posArrIndex + 2 ] - minY) * scaleY;
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
	minValueThreshold = densityMean - 5 * densityStdDv;
	maxValueThreshold = densityMean + 5 * densityStdDv;

	thresholdRange = Math.abs(maxValueThreshold - minValueThreshold);

	setParticleAttributes(densities, colors, sizes); // this updates colors etc.

	if(!keepScene) {
	    $log.log("centerPoint = new THREE.Vector3(" + ((maxX - minX) * scaleX / 2) + ", " +((maxZ - minZ) * scaleZ / 2) + ", " + ((maxY - minY) * scaleY / 2) + ")");
	    centerPoint = new THREE.Vector3((maxX - minX) * scaleX / 2 , (maxZ - minZ) * scaleZ / 2, (maxY - minY) * scaleY / 2);

	    dotsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	    dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
	    dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
	    dotsGeometry.addAttribute( 'density', new THREE.BufferAttribute( densities, 1 ) );
	    dotsGeometry.addAttribute( 'matrixLocation', new THREE.BufferAttribute( matrixLocations, 3 ) );
	    
	    particles = new THREE.Points( dotsGeometry, shaderMaterial );
	    particles.geometry.boundingBox = null;
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
	    camera.position.set(camX, camZ, camY);

	    if($scope.gimme("objectTargetEnabled")){
		camera.lookAt(centerPoint);
		controls.target = centerPoint;
	    }
	    else{
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		controls.target = new THREE.Vector3(0, 0, 0);
	    }
	} else {
	    dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
	    dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
	    dotsGeometry.addAttribute( 'density', new THREE.BufferAttribute( densities, 1 ) );
	}
    }

    //========================================================================================
    // Redraw Scene
    // Clear the 3D scene from current mesh and redraw it with current slot settings
    //========================================================================================
    var redrawScene = function(){
	redrawSceneHelper(false);
    }
    
    function redrawSceneHelper(keepScene) {
        if(scene){
	    $log.log("redrawScene");

	    if(keepScene) {
		if(dotsGeometry === null || dotsGeometry === undefined) {
		    keepScene = false;
		}
	    }

	    if(!keepScene) {

		// Clean away old point meshes from the scene
		for( var i=0 ; i < pointsMeshes.length ; i++ ) {
		    pointsMeshes[i].geometry.dispose();
		    pointsMeshes[i].material.dispose();
		    scene.remove(pointsMeshes[i]);
		}

		if(particles != undefined) {
		    particles.geometry.dispose();
		    particles.material.dispose();
		    scene.remove(particles);
		    particles = undefined;
		}
	    }

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
		// a 3D cube full of values, for example the space data

		$log.log("redraw scene with 3D data (space density?) as points cloud");

		redrawPointsCloud(keepScene, true);

	    } else if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
		      || droppedDataInfo.type == droppedDataInfoTypes.xyz
		      || droppedDataInfo.type == droppedDataInfoTypes.xyval

		      || droppedDataInfo.type == droppedDataInfoTypes.latlonzval
		      || droppedDataInfo.type == droppedDataInfoTypes.latlonz
		      || droppedDataInfo.type == droppedDataInfoTypes.latlonval
		     ) { 
		// lots of tuples of x, y, z (location), and values, for example halos in space,
		// but not tuples with latitude and longitude

		if(droppedDataInfo.sizeX > classicThreshold) {
		    $log.log("redraw scene with 'xyzval' data (tuples, halos?) as point cloud");

		    redrawPointsCloud(keepScene, false);

		} else {
		    $log.log("redraw scene with 'xyzval' data (tuples, halos?) in classic mode");
		
		    if(droppedDataInfo.latlon) {
			geoLocationAvailable = true;
		    } else {		    
			geoLocationAvailable = false;
		    }
		    
		    var meshSize = $scope.gimme("DataPointSize");
		    if(isNaN(meshSize)) {
			meshSize = 1;
		    }
		    var geometry1 = new THREE.SphereBufferGeometry( meshSize, 32, 32 ) ;

		    var maxX = 0;
		    var minX = 0;
		    var maxY = 0;
		    var minY = 0;
		    var maxZ = 0;
		    var minZ = 0;

		    var maxV = 0;
		    var minV = 0;

		    var scale = 1;
		    
		    if(droppedDataInfo.type == droppedDataInfoTypes.xyzval) {
			maxV = droppedDataInfo.funValues(0);
			minV = maxV;
			for(var idx = 1; idx < droppedDataInfo.sizeX; idx++) {
			    var val = droppedDataInfo.funValues(idx);
			    maxV = Math.max(maxV, val);
			    minV = Math.min(minV, val);
			}
			scale = maxV - minV;

			var sizes = $scope.gimme("particleMinMaxSizes").min;
			var minSize = sizes.min;
			var maxSize = sizes.max;
			var spanSize = maxSize - minSize;
			if(spanSize <= 0) {
			    spanSize = 1;
			}
		    }

		    var first = true;
		    
		    for(var idx = 0; idx < droppedDataInfo.sizeX; idx++) {
			var val = 1;
			var name = idx;
			if(droppedDataInfo.type == droppedDataInfoTypes.xyzval) {
			    var val = droppedDataInfo.funValues(idx);
			    name = val; // "idx: val"?
			}

			var x = droppedDataInfo.funX(idx);
			var y = droppedDataInfo.funY(idx);
			var z = 1; 
			if(droppedDataInfo.type == droppedDataInfoTypes.xyzval
			   || droppedDataInfo.type == droppedDataInfoTypes.xyz) {
			    z = droppedDataInfo.funZ(idx);
			} else if(droppedDataInfo.type == droppedDataInfoTypes.xyval) {
			    z = droppedDataInfo.funValues(idx);
			}

			if(val !== null
			   && x !== null
			   && y !== null
			   && z !== null) {

			    if(first) {
				maxX = x;
				minX = x;
				maxY = y;
				minY = y;
				maxZ = z;
				minZ = z;
				first = false;
			    } else {
				maxX = Math.max(maxX, x);
				minX = Math.min(minX, x);
				maxY = Math.max(maxY, y);
				minY = Math.min(minY, y);
				maxZ = Math.max(maxZ, z);
				minZ = Math.min(minZ, z);
			    }
			    
			    var groupId = droppedDataInfo.selFunX(idx);
			    
			    var material = null;
			    if(groupColors.hasOwnProperty(groupId)) {
				material = new THREE.MeshLambertMaterial( {
				    color: groupColors[groupId],
				    reflectivity: 0,
				    transparent: true,
				    opacity: 0.8
				} );
			    } else {
				material = new THREE.MeshLambertMaterial( {
				    color: "0x777777",
				    reflectivity: 0,
				    transparent: true,
				    opacity: 0.8
				} );
			    }
			    
			    var geometry = geometry1; // size = meshSize
			    if(droppedDataInfo.type == droppedDataInfoTypes.xyzval) { // we have values, make size depend on value
				var rad = ((val - minV) / (maxV - minV) * meshSize * 2 + meshSize) / 2; // this looks OK
				// var rad = minSize + (val - minV) / scale * maxSize / spanSize;
				geometry = new THREE.SphereBufferGeometry( rad, 32, 32 ) ;
			    }

			    var mesh = new THREE.Mesh( geometry, material ) ;

			    // position the mesh in space
			    mesh.position.set(x, y, z) ;
			    mesh.name = name;

			    pointsMeshes.push(mesh);

			    // add the mesh to the scene
			    scene.add( mesh ) ;
			}
		    }

		    centerPoint = new THREE.Vector3((maxX + minX) / 2 , (maxY + minY) / 2, (maxZ + minZ) / 2);

		    camera.position.set(maxX + 1, maxY + 1, maxZ + 1);
		    if($scope.gimme("objectTargetEnabled")){
			camera.lookAt(centerPoint);
			controls.target = centerPoint;
		    }
		    else{
			camera.lookAt(new THREE.Vector3(0, 0, 0));
			controls.target = new THREE.Vector3(0, 0, 0);
		    }
		} // number of objects < classicThreshold

	    } else { // if droppedDataInfo.type == ...
		$log.log("redraw scene called but with an unsupported data type");
	    }

	    enableGeoLocationSupport();
	    
	    animate();
	    $scope.waiting(false);

	    $timeout(function () { info.innerHTML = ""; }, 2000)
        } // if scene
    };

    //========================================================================================


    //========================================================================================
    // Create Shader Material
    // Creates a shader material based on current slot settings.
    //========================================================================================
    var createShaderMaterial = function(){
	var texturePath = ($scope.gimme("glowAlphaTexture") == 2) ? '/gradient.png' : (($scope.gimme("glowAlphaTexture") == 3) ? '/cloudy.png' : '/spark.png');
	var isTextureEnabled = ($scope.gimme("glowAlphaTexture") != 0);
	var blendMode = THREE.NormalBlending;
	if($scope.gimme("PixelColorBlending") == 0){ blendMode = THREE.NoBlending }else if($scope.gimme("PixelColorBlending") == 2){ blendMode = THREE.AdditiveBlending }

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




    //-------
    // Jonas: this color related stuff could be cleaned up a bit
    //-------
    function buildColorCache() {
	groupColors = {};
    	if(colorScheme !== null && colorScheme !== undefined
	   && colorScheme.hasOwnProperty('groups')) {
	    for(var group in colorScheme.groups) {
		if(colorScheme.groups.hasOwnProperty(group)
		   && colorScheme.groups[group].hasOwnProperty('color')) {
		    groupColors[group] = hexColorToRGBAvec(colorScheme.groups[group].color, 1);
		}
	    }
	}
    }	

    //-------
    // Jonas: this color related stuff could be cleaned up a bit
    //-------
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

    //-------
    // Jonas: this color related stuff could be cleaned up a bit
    // This function finds the index of a value in a sorted vector,
    // and is used to choose a color based on all the values present
    //-------
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

    //-------
    // Jonas: this color related stuff could be cleaned up a bit
    // This function assigns a color of a cell based on the slot that
    // specifies how to choose colors and the value in a cell (and
    // possible all the other available values).
    //-------
    function groupAndValTo3Dcolor(val, groupId, allValues, alpha) {
    	var rgba = [0, 0, 0, 1];

    	if(colorMethod == 1) { // using histograms
    	    var len = allValues.length;
    	    var idx = Math.max(0, binLookup(allValues, val, 0, len));
	    
	    if(groupColors.hasOwnProperty(groupId)) {
    		var crgba = groupColors[groupId];
	    } else {
		var crgba = [1, 1, 1, 1];
	    }

    	    for(var c = 0; c < 3; c++) {
    		rgba[c] = crgba[c] * 0.25 + 0.75 * idx / (len - 1);
    	    }
    	} else if(colorMethod == 0) { // using min/max
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

    	} else if(colorMethod == 2) { // color key
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
    // Set Particle Attributes
    // Apply attributes, such as size and color, to each particle based on the data value for
    // each data point (and possible required min/max size slots)
    //========================================================================================
    var setParticleAttributes = function(dataValArr, colorAttrArr, sizeAttrArr){
	var minSize, maxSize, sizeSpan, pAlpha, ut, at, btma, btmi;
	var sizeArrOk = false, colorArrOk = false;

	if(dataType == availableDataTypes.SpaceDensity){
	    minSize = $scope.gimme("particleMinMaxSizes").min;
	    maxSize = $scope.gimme("particleMinMaxSizes").max;
	    sizeSpan = maxSize - minSize;
	    
	    sizeArrOk = (sizeAttrArr.length != undefined && sizeAttrArr.length == dataValArr.length);
	    pAlpha = $scope.gimme("particleMinMaxAlpha");
	    ut = pAlpha.underThreshold; at = pAlpha.aboveThreshold; btma = pAlpha.betweenThresholdMax; btmi = pAlpha.betweenThresholdMin;
	}

	colorArrOk = (colorAttrArr.length != undefined && colorAttrArr.length == dataValArr.length * 4);


	for( var i=0 ; i < dataValArr.length ; i++ ) {

	    var val = Math.min(Math.max(minValueThreshold, dataValArr[i]), maxValueThreshold);
	    var pct = (val - minValueThreshold) / thresholdRange;
	    
	    if(sizeArrOk){ 
		sizeAttrArr[i] = minSize + sizeSpan * pct; 
	    }

	    if(colorArrOk){
		var colVal, alphaVal;

		
		//-------
		// Jonas: I changed a lot of stuff here, but the whole function should probably be rewritten later.
		//-------
		if(droppedDataInfo.size3D > 0
		   || droppedDataInfo.sizeX > classicThreshold) {
		    // points cloud

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

		    var allValues = [minValueThreshold, maxValueThreshold];
		    
		    colVal = groupAndValTo3Dcolor(val, groupId, allValues, alphaVal);

		    if(groupId <= 0) {
			alphaVal *= 0.01;
			
			// colVal = [0, 0, 0];
			// alphaVal = 0;
		    } else {
		    }

		}
		else if(dataType == availableDataTypes.SkyReflectivity){
		    colVal = (dataValArr[i] < 0) ? chromaticScale(0).gl() : chromaticScale(dataValArr[i]).gl();
		    alphaVal = (dataValArr[i] <= 0) ? 0.0 : (dataValArr[i] / 65);
		}

		colorAttrArr[ (i * 4) + 0 ] = colVal[0];
		colorAttrArr[ (i * 4) + 1 ] = colVal[1];
		colorAttrArr[ (i * 4) + 2 ] = colVal[2];
		colorAttrArr[ (i * 4) + 3 ] = alphaVal;
	    }
	}
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
    // Enable Geo Location Support
    // Turns on or off the visibility of all geo location support, such as a map plane and a
    // blue sky etc.
    //========================================================================================
    var enableGeoLocationSupport = function(){
	if(scene){
	    // Make sure the visibility of x y z axes is correct
	    if(geoLocationAvailable){
		scene.background = new THREE.Color( 0x478AFF ); //Sky blue
		$scope.getSlot("currentDataSet").setDisabledSetting(Enum.SlotDisablingState.None);
		lightAmb.intensity = 1.0;
		light.intensity = 0.0;

		if(scene.getObjectByName('Map_Plane') != undefined){
		    scene.remove(mapPlane);
		    mapPlane = undefined;
		}

		var mapCenter = [liveData[0].lat.vals[0] + ((liveData[0].lat.vals[liveData[0].lat.vals.length -1] - liveData[0].lat.vals[0]) / 2), liveData[0].long.vals[0] + ((liveData[0].long.vals[liveData[0].long.vals.length -1] - liveData[0].long.vals[0]) / 2)];
		currentMapZoom = $scope.gimme("mapZoom");
		currentMapType = $scope.gimme("mapType");
		currentHeightMap = $scope.gimme("manualHeightMap");
		if(currentHeightMap == ""){ currentHeightMap = internalFilesPath + '/Flat_HeightMap.png'}
		var dispScale = 50;
		var planeFront = 'http://maps.google.com/maps/api/staticmap?center=' + mapCenter[0] + ',' + mapCenter[1] + '&zoom=' + currentMapZoom + '&size=512x512&scale=2&maptype=' + currentMapType + '&sensor=false&language=&markers=';
		var planeBack = ($scope.gimme("backsideMapEnabled")) ? planeFront : internalFilesPath + '/soil.png';

		var loader = new THREE.TextureLoader();
		loader.crossOrigin = '';
		loader.load(
		    planeFront,
		    function ( textureFront ) {
			mapImageTexture = textureFront;
			loader.load(
			    currentHeightMap, //WHAT TO DO ABOUT THIS???????? NEEDS ACTUAL DATA IN REALTIME!!!
			    function ( textureTopology ) {
				mapTerrianTexture = textureTopology;
				loader.load(
				    planeBack,
				    function ( textureBack ) {
				 	var geometry = new THREE.PlaneGeometry(noOfDataPointsForEachXYZ[0], noOfDataPointsForEachXYZ[1], noOfDataPointsForEachXYZ[0]/2, noOfDataPointsForEachXYZ[1]/2);
				 	var materials = [new THREE.MeshPhongMaterial({map: mapImageTexture, displacementMap: mapTerrianTexture, displacementScale: dispScale, side: THREE.FrontSide}), new THREE.MeshPhongMaterial({map: textureBack, displacementMap: mapTerrianTexture, displacementScale: dispScale, side: THREE.BackSide})];

				 	for (var i = 0, len = geometry.faces.length; i < len; i++) {
				 	    var face = geometry.faces[i].clone();
				 	    face.materialIndex = 1;
				 	    geometry.faces.push(face);
				 	    geometry.faceVertexUvs[0].push(geometry.faceVertexUvs[0][i].slice(0));
				 	}
				 	mapPlane = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
				 	mapPlane.rotation.x = -Math.PI / 2;
				 	mapPlane.position.y = -0.1;
				 	mapPlane.name = "Map_Plane";

				 	scene.add(mapPlane);
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
		// scene.background = new THREE.Color( 0x000000 ); //space black
		$scope.getSlot("currentDataSet").setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
		lightAmb.intensity = 0.0;
		light.intensity = 1.0;
		scene.remove(mapPlane);
		mapPlane = undefined;
	    }
	}
    };
    //========================================================================================


    //========================================================================================
    // Clear Data From Scene
    // Removes all data related meshes and geometry and resets the background
    //========================================================================================
    var clearDataFromScene = function() {
	if(scene){
	    scene.background = new THREE.Color( 0x000000 ); //space black
	    $scope.getSlot("currentDataSet").setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	    lightAmb.intensity = 0.0;
	    light.intensity = 1.0;
	    if(mapPlane != undefined){
		mapPlane.geometry.dispose();
		mapPlane.material.dispose();
		scene.remove(mapPlane);
		mapPlane = undefined;
	    }
	    for( var i=0 ; i < pointsMeshes.length ; i++ ) {
		pointsMeshes[i].geometry.dispose();
		pointsMeshes[i].material.dispose();
		scene.remove(pointsMeshes[i]);
	    }
	    if(particles != undefined) {
		particles.geometry.dispose();
		particles.material.dispose();
		scene.remove(particles);
		particles = undefined;
	    }

	    camera.position.set(0, 0, 15);
	    camera.lookAt(new THREE.Vector3(0, 0, 0));
	    controls.target = new THREE.Vector3(0, 0, 0);
	}
	info.innerHTML = "";
	info2.innerHTML = "";
    };
    //========================================================================================



    //=== ADDITIONAL SUPPORT FUNCTIONS ======================================================================

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
    // Get Distance Between Map Coordinates
    // Calculates the distance in metres between two map coordinates expressed in latitudes
    // and longitudes.
    //========================================================================================
    var getDistanceBetweenMapCoordinates = function (lat1, lon1, lat2, lon2){
	var R = 6378.137; // Radius of earth in KM
	var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
	var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
	    Math.sin(dLon/2) * Math.sin(dLon/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;
	return d * 1000; // meters
    };
    //========================================================================================




    //====================================================================================================
    //=== FUNCTIONS FOR Drag & Drop of data from Data Source Webble ======================================
    //====================================================================================================

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
		$log.log("drop event");
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

    function dataDropped(dataSourceInfoStr, targetField) {

	$log.log("dataDropped");

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


    function checkMappingsAndParseData() {

    	var atLeastOneActive = false;

	droppedDataInfo.latlon = false;
	droppedDataInfo.size3D = 0;

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
		    }
    		}
	    } // for each data field

	    geoLocationAvailable = false;

	    if(have3D && haveX && haveY && haveZ && haveValues
	       && size3Dx == sizeX
	       && size3Dy == sizeY
	       && size3Dz == sizeZ
	       && size3Dv == sizeValues
	      ) { // 3D + x + y + z + values

		$log.log("3D + x + y + z + values");

		atLeastOneActive = true;

		if(haveLatitude && haveLongitude) {
		    droppedDataInfo.type = droppedDataInfoTypes.latlonzval3D;
		    droppedDataInfo.latlon = true;
	    	    // geoLocationAvailable = true;
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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(geoLocationAvailable) {
	    	    dataType = availableDataTypes.SkyReflectivity;
	    	    info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		} else {
	    	    $scope.getSlot("glowAlphaTexture").setValue(1);
	    	    dataType = availableDataTypes.SpaceDensity;
	    	    info.innerHTML = "Prepare Rendering of Space Density Data...";
		}
		//-------

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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(geoLocationAvailable) {
	    	    dataType = availableDataTypes.SkyReflectivity;
	    	    info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		} else {
	    	    $scope.getSlot("glowAlphaTexture").setValue(1);
	    	    dataType = availableDataTypes.SpaceDensity;
	    	    info.innerHTML = "Prepare Rendering of Space Density Data...";
		}
		//-------

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

		$log.log("3D + x + y + values");

		if(haveLatitude && haveLongitude) {
		    droppedDataInfo.type = droppedDataInfoTypes.latlonval3D;
	    	    droppedDataInfo.latlon = true;
		    // geoLocationAvailable = true;
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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(geoLocationAvailable) {
	    	    dataType = availableDataTypes.SkyReflectivity;
	    	    info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		} else {
	    	    $scope.getSlot("glowAlphaTexture").setValue(1);
	    	    dataType = availableDataTypes.SpaceDensity;
	    	    info.innerHTML = "Prepare Rendering of Space Density Data...";
		}
		//-------

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

		$log.log("3D + x + y");

		if(haveLatitude && haveLongitude) {
		    droppedDataInfo.type = droppedDataInfoTypes.latlon3D;
		    droppedDataInfo.latlon = true;
		    // geoLocationAvailable = true;
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
		
		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(geoLocationAvailable) {
	    	    dataType = availableDataTypes.SkyReflectivity;
	    	    info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		} else {
	    	    $scope.getSlot("glowAlphaTexture").setValue(1);
	    	    dataType = availableDataTypes.SpaceDensity;
	    	    info.innerHTML = "Prepare Rendering of Space Density Data...";
		}
		//-------

		var ls2 = []; // fields to listen to
    		for(var ff = 0; ff < droppedDataMappings[src].map.length; ff++) {
		    if(droppedDataMappings[src].map[ff].name == "Values"
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

	    } else if(have3D && haveValues
		      && size3Dv == sizeValues
		     ) { // 3D + values

		$log.log("3D + values");

		atLeastOneActive = true;

		droppedDataInfo.type = droppedDataInfoTypes.val3D;

		droppedDataInfo.fun3D = fun3D;
		droppedDataInfo.funValues = funValues;

		droppedDataInfo.selFunValues = selFunValues;
		droppedDataInfo.selFun3D = selFun3D;

		droppedDataInfo.size3D = size3D;
		droppedDataInfo.size3Dv = size3Dv;
		droppedDataInfo.sizeValues = sizeValues;

		//-------
		// Jonas: this part should probably be rewritten
		//-------
	    	$scope.getSlot("glowAlphaTexture").setValue(1);
	    	dataType = availableDataTypes.SpaceDensity;
	    	info.innerHTML = "Prepare Rendering of Space Density Data...";
		//-------

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

		droppedDataInfo.type = droppedDataInfoTypes.only3D;

		droppedDataInfo.fun3D = fun3D;

		droppedDataInfo.selFun3D = selFun3D;

		droppedDataInfo.size3D = size3D;
		droppedDataInfo.size3Dv = size3Dv;

		//-------
		// Jonas: this part should probably be rewritten
		//-------
	    	$scope.getSlot("glowAlphaTexture").setValue(1);
	    	dataType = availableDataTypes.SpaceDensity;
	    	info.innerHTML = "Prepare Rendering of Space Density Data...";
		//-------
		
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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(sizeX > classicThreshold) {
		    if(geoLocationAvailable) {
	    		dataType = availableDataTypes.SkyReflectivity;
	    		info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		    } else {
	    		$scope.getSlot("glowAlphaTexture").setValue(1);
	    		dataType = availableDataTypes.SpaceDensity;
	    		info.innerHTML = "Prepare Rendering of Space Density Data...";
		    }
		} else {
	    	    info.innerHTML = "Prepare Rendering of Classic point Data...";
		}
		//-------

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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(sizeX > classicThreshold) {
		    if(geoLocationAvailable) {
	    		dataType = availableDataTypes.SkyReflectivity;
	    		info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		    } else {
	    		$scope.getSlot("glowAlphaTexture").setValue(1);
	    		dataType = availableDataTypes.SpaceDensity;
	    		info.innerHTML = "Prepare Rendering of Space Density Data...";
		    }
		} else {
	    	    info.innerHTML = "Prepare Rendering of Classic point Data...";
		}
		//-------

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

		//-------
		// Jonas: this part should probably be rewritten
		//-------
		if(sizeX > classicThreshold) {
		    if(geoLocationAvailable) {
	    		dataType = availableDataTypes.SkyReflectivity;
	    		info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
		    } else {
	    		$scope.getSlot("glowAlphaTexture").setValue(1);
	    		dataType = availableDataTypes.SpaceDensity;
	    		info.innerHTML = "Prepare Rendering of Space Density Data...";
		    }
		} else {
	    	    info.innerHTML = "Prepare Rendering of Classic point Data...";
		}
		//-------
		
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
	    // $scope.getSlot('liveDataJSON').setValue({status: 'loaded'});
	    $scope.set('jsonDataInfo', "DATA LOADED AND AVAILABLE. [ Data type: " + getKeyByValue(availableDataTypes, dataType) + " ]");

	    $scope.waiting(true);
	    isInfoTextDisplayedAsItShould();

	} else { // no data to draw
	    $log.log("Data dropped but still no data to draw");

	    droppedDataInfo.type = droppedDataInfoTypes.none;

	    // 		dataType = availableDataTypes.Unidentified;
	    // 		info.innerHTML = "Rendering Data Unidentified and Ignored...";

	    // liveData = []; 
	    geoLocationAvailable = false; 
	    allDataPointsSorted = []; 
	    loopDataSliceTracking = undefined;

	    // $scope.getSlot('liveDataJSON').setValue({status: 'empty'});
	    $scope.set('jsonDataInfo', "NO DATA LOADED");
	    clearDataFromScene();
	}
    }

    
    //====================================================================================================
    // ------------------- reacting to changes in other components
    //====================================================================================================
    var lastSeenDataSeqNo = -1;
    function redrawOnNewData(seqNo) {
	$log.log("redrawOnNewData " + seqNo);
	if(lastSeenDataSeqNo != seqNo) {
	    lastSeenDataSeqNo = seqNo;
	    checkMappingsAndParseData();
	}
    }
    
    var lastSeenSelectionSeqNo = -1;
    function redrawOnNewSelections(seqNo) {
	$log.log("redrawOnNewSelections " + seqNo);
	if(lastSeenSelectionSeqNo != seqNo) {
	    lastSeenSelectionSeqNo = seqNo;
	    redrawSceneHelper(true);
	}
    }

    //====================================================================================================



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
		$scope.set('liveDataJSON', {});
	    }
	    //=============================================

	    //=== Next Time Slice ====================================
	    if (targetName == $scope.customInteractionBalls[1].name){ //nextTimeSlice
		$timeout(loopTimeSliceForward, 500);
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
	    $scope.set('liveDataJSON', {});
	}

	else if(itemName == $scope.customMenu[1].itemId){  //nextTimeSlice
	    $timeout(loopTimeSliceForward, 500);
	}
    };
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
