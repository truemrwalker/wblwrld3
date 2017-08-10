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
    var liveData = [];
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
		chromaticScale = chroma.scale(['white', 'black']);
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
				}
			}

			else if(eventData.slotName == 'AxesEnabled'){
				if(eventData.slotValue && axes == undefined || !eventData.slotValue && axes !== undefined){
					executeAxisVisbilityState();
				}
			}

			// Recieve and interpret new 3d Points JSON Data and draw 3D ackordingly
			else if(eventData.slotName == 'liveDataJSON'){

				var isFake = false;
				if(Object.keys(eventData.slotValue).length == undefined || eventData.slotValue.status == "empty"){
					isFake = true;
				}
				else if(Object.keys(eventData.slotValue).length == 3) {
					if (JSON.stringify(eventData.slotValue) == '{"fieldNames":["time","field 2"],"fieldTypes":["number","string"],"columns":[[1,"first"],[2,"second"],[2.5,"third"]]}') {
						isFake = true;
					}
				}

				if(!isEmpty(eventData.slotValue) && !isFake){
					info.innerHTML = "";
					var newData = angular.copy(eventData.slotValue);
					liveData = []; geoLocationAvailable = false; allDataPointsSorted = [], loopDataSliceTracking = undefined;

					if(eventData.slotValue.columns != undefined){
						if(newData.columns.length > 0 && newData.columns[0].length > 0) {
							for ( var n = 0; n < newData.columns[0].length; n ++ ) {
								var newPoint = [];
								for ( var i = 0; i < newData.columns.length; i ++ ) {
									newPoint.push(newData.columns[i][n]);
								}
								liveData.push(newPoint);
							}
						}
					}
					else if(newData.length == 2 && newData[0].data.length > 0){
						noOfDataPointsForEachXYZ = [newData[0].xdef.vals.length, newData[0].zdef.vals.length, newData[0].ydef.vals.length];
						liveData = newData;
						const newKeys = { xdef: "long", ydef: "lat", zdef: "alt" };
						liveData[0] = renameKeys(newData[0], newKeys);
						var cdsSlot = $scope.getSlot("currentDataSet");
						var dataTimeStamps = angular.copy(liveData[1].data).sort(function(a, b){return (new Date(a).getTime())-(new Date(b).getTime())});
						for(var i = 0; i < dataTimeStamps.length; i++){ dataTimeStamps[i] = dataTimeStamps[i].toString()}
						for(var i = 0; i < liveData[1].data.length; i++){ liveData[1].data[i] = liveData[1].data[i].toString()}
						cdsSlot.setMetaData({inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: dataTimeStamps});
						cdsSlot.setValue(dataTimeStamps[0]);
						loopDataSliceTracking = {availableSlices: dataTimeStamps, currentSlice: 0};
						var chromeArr = cloudyChroma;
						if($scope.gimme("dBZColorsEnabled")){ chromeArr = dBZChromaNarrow; }
						chromaticScale = chroma.scale(chromeArr).domain([0, 35, 65]);
						$scope.getSlot("particleColorArray").setValue(chromeArr);
						$scope.getSlot("glowAlphaTexture").setValue(3);
					}

					if(liveData.length == 1 && liveData[0].length == 2 && liveData[0][0] == liveData[0][1].length){
						$scope.getSlot("glowAlphaTexture").setValue(1);
						dataType = availableDataTypes.SpaceDensity;
						info.innerHTML = "Prepare Rendering of Space Density Data...";
					}
					else if(liveData.length > 0 && liveData[0].length >= 3){
						dataType = availableDataTypes.Classic;
						info.innerHTML = "Prepare Rendering of Classic point Data...";
					}
					else if(liveData.length == 2 && liveData[0].alt != undefined && liveData[1].name == "Time Stamp"){
						dataType = availableDataTypes.SkyReflectivity;
						geoLocationAvailable = true;
						info.innerHTML = "Prepare Rendering of Sky Reflectivity Data...";
					}
					else{
						dataType = availableDataTypes.Unidentified;
						info.innerHTML = "Rendering Data Unidentified and Ignored...";
					}

					$scope.getSlot('liveDataJSON').setValue({status: 'loaded'});
					$scope.set('jsonDataInfo', "DATA LOADED AND AVAILABLE. [ Data type: " + getKeyByValue(availableDataTypes, dataType) + " ]");

					$scope.waiting(true);
					isInfoTextDisplayedAsItShould();
				}
				else {
					liveData = []; geoLocationAvailable = false; allDataPointsSorted = []; loopDataSliceTracking = undefined;
					$scope.getSlot('liveDataJSON').setValue({status: 'empty'});
					$scope.set('jsonDataInfo', "NO DATA LOADED");
					clearDataFromScene();
				}
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
							setParticleAttributes(particles.geometry.attributes.density.array, particles.geometry.attributes.size.array, []);
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
							if(dataType == availableDataTypes.SkyReflectivity){ setParticleAttributes(particles.geometry.attributes.reflectivity.array, particles.geometry.attributes.customColor.array); }
							else{ setParticleAttributes(particles.geometry.attributes.density.array, [], particles.geometry.attributes.customColor.array); }
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
								setParticleAttributes(particles.geometry.attributes.density.array, [], particles.geometry.attributes.customColor.array);
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
				if(dataType == availableDataTypes.SpaceDensity){
					if(particles){
						var ldb = liveData[0][1];

						var posArrIndex = 0, densArrIndex = 0;
						var particleDist = eventData.slotValue;
						var posArr = particles.geometry.attributes.position.array;
						for( var i=0 ; i < ldb.length ; i++ ) {
							for (var k = 0; k < ldb[i].length; k++) {
								for (var n = 0; n < ldb[i][k].length; n++) {
									posArr[ posArrIndex + 0 ] = i * particleDist;
									posArr[ posArrIndex + 1 ] = k * particleDist;
									posArr[ posArrIndex + 2 ] = n * particleDist;
									posArrIndex += 3;
								}
							}
						}
						centerPoint = new THREE.Vector3((ldb.length * particleDist) / 2 , (ldb[0].length * particleDist) / 2, (ldb[0][0].length * particleDist) / 2);
						particles.geometry.attributes.position.needsUpdate = true;
					}
				}
			}

			else if(eventData.slotName == 'minThreshold' || eventData.slotName == 'maxThreshold'){
				if(dataType == availableDataTypes.SpaceDensity){
					if(particles){
						$scope.waiting(true);
						minValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("minThreshold"))];
						maxValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("maxThreshold")) - 1];
						thresholdRange = Math.abs(maxValueThreshold - minValueThreshold);

						$timeout(function () {
							setParticleAttributes(particles.geometry.attributes.density.array, [], particles.geometry.attributes.customColor.array);
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
						setParticleAttributes(particles.geometry.attributes.density.array, [], particles.geometry.attributes.customColor.array);
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

		$scope.addSlot(new Slot('liveDataJSON',
			{},
			'JSON Data',
			'JSON Data Object (which hopefully contains 3D translatable world Point data)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("liveDataJSON").setDisabledSetting(Enum.SlotDisablingState.PropertyVisibility);

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
		//=======

		// Webble initiations
        $scope.setResizeSlots('threeDPlusHolder:width', 'threeDPlusHolder:height');
        $scope.theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
        threeDPlusHolder.bind('contextmenu',function(){ if(!$scope.altKeyIsDown){return false;} });

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
		controls = new THREE.OrbitControls( camera, threeDPlusHolder[0] );
	};
    //========================================================================================


	//========================================================================================
	// Animate
	// the animation cycle control function
	//========================================================================================
	var animate = function() {
		requestAnimationFrame( animate );

		light.position.copy( camera.position );
		controls.update();

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
    // Redraw Scene
    // Clear the 3D scene from current mesh and redraw it with current slot settings
    //========================================================================================
    var redrawScene = function(){
        if(scene){
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

			// If LiveData exists, then try to draw it
			if(!isEmpty(liveData)) {

				// SKY REFLECTIVITY
				if(dataType == availableDataTypes.SkyReflectivity){
					var noOfPoints = noOfDataPointsForEachXYZ[0]*noOfDataPointsForEachXYZ[1]*noOfDataPointsForEachXYZ[2];

					shaderMaterial = createShaderMaterial();

					// Particle geometry
					dotsGeometry = new THREE.BufferGeometry();

					allDataPointsSorted = [];
					positions = []; colors = []; sizes = []; reflectivities = []; matrixLocations = []; mapCoordinates = [];
					positions = new Float32Array( noOfPoints * 3 );
					colors = new Float32Array( noOfPoints * 4 );
					sizes = new Float32Array( noOfPoints );
					reflectivities = new Float32Array( noOfPoints );
					matrixLocations = new Uint32Array( noOfPoints * 3 );
					mapCoordinates = new Float32Array( noOfPoints * 3 );

					var posArrIndex = 0, reflArrIndex = 0;
					var particleDist = 1; var halfLat = liveData[0].data[0][0].length / 2; var halfLong = liveData[0].data[0][0][0].length / 2;
					var currDataSet = liveData[1].data.indexOf($scope.gimme("currentDataSet"));
					for( var a=0 ; a < liveData[0].data[currDataSet].length ; a++ ) {  // iterate all altitudes
					 	for (var la = 0; la < liveData[0].data[currDataSet][a].length; la++) {  // iterate all latitudes
					 		for (var lo = 0; lo < liveData[0].data[currDataSet][a][la].length; lo++) {  // iterate all longitudes
								sizes[reflArrIndex] = 10;

					 			var reflectivity = liveData[0].data[currDataSet][a][la][lo];
					 			allDataPointsSorted.push(reflectivity);
					 			reflectivities[reflArrIndex++] = reflectivity;

								positions[ posArrIndex + 0 ] = (lo * particleDist) - halfLong;
								positions[ posArrIndex + 1 ] = (a * (particleDist * 1)) + 15;
								positions[ posArrIndex + 2 ] = (la * particleDist) - halfLat;

					 			matrixLocations[ posArrIndex + 0 ] = la;
					 			matrixLocations[ posArrIndex + 1 ] = lo;
								matrixLocations[ posArrIndex + 2 ] = a;

								mapCoordinates[ posArrIndex + 0 ] = liveData[0].lat.vals[la];
								mapCoordinates[ posArrIndex + 1 ] = liveData[0].long.vals[lo];
								mapCoordinates[ posArrIndex + 2 ] = liveData[0].alt.vals[a];

								posArrIndex += 3;
					 		}
					 	}
					}

					centerPoint = new THREE.Vector3(0 , noOfDataPointsForEachXYZ[1] / 4, 0);
					allDataPointsSorted.sort(function(a, b){return a-b});

					setParticleAttributes(reflectivities, colors);

					dotsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
					dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
					dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
					dotsGeometry.addAttribute( 'reflectivity', new THREE.BufferAttribute( reflectivities, 1 ) );
					dotsGeometry.addAttribute( 'matrixLocation', new THREE.BufferAttribute( matrixLocations, 3 ) );
					dotsGeometry.addAttribute( 'mapCoordinate', new THREE.BufferAttribute( mapCoordinates, 3 ) );

					particles = new THREE.Points( dotsGeometry, shaderMaterial );
					particles.geometry.boundingBox = null;
					scene.add( particles );

					info2.innerHTML = $scope.gimme("currentDataSet");

					centerPoint = new THREE.Vector3(0 , noOfDataPointsForEachXYZ[1] / 4, 0);
					if($scope.gimme("objectTargetEnabled")){
						camera.position.set(0, noOfDataPointsForEachXYZ[1] / 2, noOfDataPointsForEachXYZ[2] / 2);
						camera.lookAt(centerPoint);
						controls.target = centerPoint;
					}
					else{
						camera.position.set(0, noOfDataPointsForEachXYZ[1] / 1.5, noOfDataPointsForEachXYZ[2] / 1.5);
						camera.lookAt(new THREE.Vector3(0, 0, 0));
						controls.target = new THREE.Vector3(0, 0, 0);
					}
				}

				// SPACE DENSITY
				else if(dataType == availableDataTypes.SpaceDensity){
					var ldb = liveData[0][1], noOfPoints = ldb.length * ldb[0].length * ldb[0][0].length;

					shaderMaterial = createShaderMaterial();

					// Particle geometry
					dotsGeometry = new THREE.BufferGeometry();

					allDataPointsSorted = [];
					positions = []; colors = []; sizes = []; densities = []; matrixLocations = [];
					positions = new Float32Array( noOfPoints * 3 );
					colors = new Float32Array( noOfPoints * 4 );
					sizes = new Float32Array( noOfPoints );
					densities = new Float32Array( noOfPoints );
					matrixLocations = new Uint32Array( noOfPoints * 3 );

					var posArrIndex = 0, densArrIndex = 0;
					var particleDist = $scope.gimme("particleDistance");
					for( var i=0 ; i < ldb.length ; i++ ) {
						for (var k = 0; k < ldb[i].length; k++) {
							for (var n = 0; n < ldb[i][k].length; n++) {
								var density = ldb[i][k][n];
								allDataPointsSorted.push(density);
								densities[densArrIndex++] = density;

								positions[ posArrIndex + 0 ] = i * particleDist;
								positions[ posArrIndex + 1 ] = k * particleDist;
								positions[ posArrIndex + 2 ] = n * particleDist;

								matrixLocations[ posArrIndex + 0 ] = i;
								matrixLocations[ posArrIndex + 1 ] = k;
								matrixLocations[ posArrIndex + 2 ] = n;

								posArrIndex += 3;
							}
						}
					}
					centerPoint = new THREE.Vector3((ldb.length * particleDist) / 2 , (ldb[0].length * particleDist) / 2, (ldb[0][0].length * particleDist) / 2);

					allDataPointsSorted.sort(function(a, b){return a-b});
					minValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("minThreshold"))];
					maxValueThreshold = allDataPointsSorted[Math.floor(allDataPointsSorted.length * $scope.gimme("maxThreshold")) - 1];
					thresholdRange = Math.abs(maxValueThreshold - minValueThreshold);

					setParticleAttributes(densities, colors, sizes);

					dotsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
					dotsGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
					dotsGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 4 ) );
					dotsGeometry.addAttribute( 'density', new THREE.BufferAttribute( densities, 1 ) );
					dotsGeometry.addAttribute( 'matrixLocation', new THREE.BufferAttribute( matrixLocations, 3 ) );

					particles = new THREE.Points( dotsGeometry, shaderMaterial );
					particles.geometry.boundingBox = null;
					scene.add( particles );

					camera.position.set((ldb.length * particleDist) + (ldb.length/20), (ldb[0].length * particleDist) + (ldb[0].length/20), (ldb[0][0].length * particleDist) + (ldb[0][0].length/20));
					if($scope.gimme("objectTargetEnabled")){
						camera.lookAt(centerPoint);
						controls.target = centerPoint;
					}
					else{
						camera.lookAt(new THREE.Vector3(0, 0, 0));
						controls.target = new THREE.Vector3(0, 0, 0);
					}
				}

				// CLASSIC SPHERES IN 3D WORLD
				else if(dataType == availableDataTypes.Classic){

					//Identify possible colors fields in the data
					var colorArr = [];
					for( var i=0 ; i < liveData.length ; i++ ) {
						for( var n=0 ; n < liveData[i].length ; n++ ) {
							if(isValidStyleValue('color', liveData[i][n])){
								colorArr.push(liveData[i][n])
								break;
							}
						}
					}

					// If no color was found, give random color
					if(isEmpty(colorArr)) {
						for( var i=0 ; i < liveData.length ; i++ ) {
							colorArr.push(Math.random() * 0xffffff);
						}
					}

					// Assign material
					// material describes the surface of the shape
					var materials = [];
					for( var i=0 ; i < liveData.length ; i++ ) {
						materials.push(new THREE.MeshLambertMaterial( {
							color: colorArr[i],
							reflectivity: 0,
							transparent: true,
							opacity: 0.8
						} ));
					}

					//Identify possible name fields in the data
					var nameArr = [];
					for( var i=0 ; i < liveData.length ; i++ ) {
						for( var n=0 ; n < liveData[i].length ; n++ ) {
					 		if(!isValidStyleValue('color', liveData[i][n]) && isNaN(liveData[i][n])){
					 			nameArr.push(liveData[i][n])
					 			break;
					 		}
					 	}
					}

					//Identify x, y and z field indexes in the data
					var xIndex, yIndex, zIndex;
					var allX = [], allY = [], allZ = [];
					for( var i=0 ; i < liveData.length ; i++ ) {
						for( var n=0 ; n < liveData[i].length ; n++ ) {
							if(!isNaN(liveData[i][n])){
								if(xIndex == undefined){xIndex = n}
								else if(yIndex == undefined){yIndex = n}
								else if(zIndex == undefined){zIndex = n}

								if(n == xIndex){ allX.push(liveData[i][n]); }
								else if(n == yIndex){ allY.push(liveData[i][n]); }
								else if(n == zIndex){ allZ.push(liveData[i][n]); }
							}
						}
					}
					allX.sort(function(a, b){return a-b});
					allY.sort(function(a, b){return a-b});
					allZ.sort(function(a, b){return a-b});
					centerPoint = new THREE.Vector3(allX[allX.length-1] - ((allX[allX.length-1] - allX[0]) / 2) , allY[allY.length-1] - ((allY[allY.length-1] - allY[0]) / 2), allZ[allZ.length-1] - ((allZ[allZ.length-1] - allZ[0]) / 2));

					var meshSize = $scope.gimme("DataPointSize");
					var geometry = new THREE.SphereBufferGeometry( (isNaN(meshSize) ? 1.0 : meshSize), 32, 32 ) ;

					// loop through the points and add them to the scene
					for( var i=0 ; i < liveData.length ; i++ ) {
						var mesh = new THREE.Mesh( geometry, materials[i] ) ;

					 	// position the mesh in space
					 	mesh.position.set(liveData[i][xIndex], liveData[i][yIndex], liveData[i][zIndex] ) ;
					 	mesh.name = nameArr[i];

					 	pointsMeshes.push(mesh);

					 	// add the mesh to the scene
					 	scene.add( mesh ) ;
					}

					camera.position.set(allX[allX.length - 1] + 1, allY[allY.length - 1] + 1, allZ[allZ.length - 1] + 1);
					if($scope.gimme("objectTargetEnabled")){
						camera.lookAt(centerPoint);
						controls.target = centerPoint;
					}
					else{
						camera.lookAt(new THREE.Vector3(0, 0, 0));
						controls.target = new THREE.Vector3(0, 0, 0);
					}
				}

				// NOT IDENTIFIED
				else if(dataType == availableDataTypes.Unidentified){
					$timeout(function () { $scope.showQIM("The data was found but not identified. Drawing impossible!", 4000); })
				}

				$timeout(function () { info.innerHTML = ""; }, 2000)
			}

			enableGeoLocationSupport();

			animate();
			$scope.waiting(false);
        }
    };
    //========================================================================================


	//========================================================================================
	// Create Shader Material
	// Creates a shader material based on current slot settings.
	//========================================================================================
	var createShaderMaterial = function(){
		var texturePath = ($scope.gimme("glowAlphaTexture") == 2) ? '/images/gradient.png' : (($scope.gimme("glowAlphaTexture") == 3) ? '/images/cloudy.png' : '/images/spark.png');
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


	//========================================================================================
	// Set Particle Attributes
	// Apply attributes, such as size and color, to each particle based on the data value for
	// each data point (and possible required min/max size slots)
	//========================================================================================
	var setParticleAttributes = function(dataValArr, colorAttrArr, sizeAttrArr){
		var minSize, maxSize, pAlpha, ut, at, btma, btmi;
		var sizeArrOk = false, colorArrOk = false;
		if(dataType == availableDataTypes.SpaceDensity){
			minSize = $scope.gimme("particleMinMaxSizes").min;
			maxSize = $scope.gimme("particleMinMaxSizes").max;
			sizeArrOk = (sizeAttrArr.length != undefined && sizeAttrArr.length == dataValArr.length);
			pAlpha = $scope.gimme("particleMinMaxAlpha");
			ut = pAlpha.underThreshold; at = pAlpha.aboveThreshold; btma = pAlpha.betweenThresholdMax; btmi = pAlpha.betweenThresholdMin;
		}
		colorArrOk = (colorAttrArr.length != undefined && colorAttrArr.length == dataValArr.length * 4);

		for( var i=0 ; i < dataValArr.length ; i++ ) {
			var pct = (dataType == availableDataTypes.SpaceDensity) ? ((dataValArr[i] - minValueThreshold) / thresholdRange) : 0;

			if(sizeArrOk){ sizeAttrArr[i] = (dataValArr[i] < minValueThreshold) ? minSize : ((dataValArr[i] > maxValueThreshold) ? maxSize : (pct * maxSize)); }

			if(colorArrOk){
				var colVal, alphaVal;
				if(dataType == availableDataTypes.SpaceDensity){
					if($scope.gimme('colorBoostEnabled') == true){
						colVal = (dataValArr[i] < minValueThreshold) ? chromaticScale(0.0).rgb() : ((dataValArr[i] > maxValueThreshold) ? chromaticScale(1.0).rgb() : chromaticScale(pct).rgb());
					}
					else{
						colVal = (dataValArr[i] < minValueThreshold) ? chromaticScale(0.0).gl() : ((dataValArr[i] > maxValueThreshold) ? chromaticScale(1.0).gl() : chromaticScale(pct).gl());
					}
					alphaVal = (dataValArr[i] < minValueThreshold) ? ut : ((dataValArr[i] > maxValueThreshold) ? at : ((pct * btma) + btmi));
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
				if(currentHeightMap == ""){ currentHeightMap = internalFilesPath + '/images/Flat_HeightMap.png'}
				var dispScale = 50;
				var planeFront = 'http://maps.google.com/maps/api/staticmap?center=' + mapCenter[0] + ',' + mapCenter[1] + '&zoom=' + currentMapZoom + '&size=512x512&scale=2&maptype=' + currentMapType + '&sensor=false&language=&markers=';
				var planeBack = ($scope.gimme("backsideMapEnabled")) ? planeFront : internalFilesPath + '/images/soil.png';

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
				scene.background = new THREE.Color( 0x000000 ); //space black
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
