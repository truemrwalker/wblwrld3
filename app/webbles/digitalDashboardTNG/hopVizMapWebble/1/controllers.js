//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP Map Visualisation Webble for Webble World v3.0 (2013)
// // Created By: Jonas Sjobergh
// // Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizMapWebbleCtrl', function($scope, $log, $timeout, $location, Slot, Enum, dbService, gettext) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		mapDrawingArea: ['width', 'height', 'background-color']
	};

	$scope.displayText = "Map";
	var preDebugMsg = "hopVizMapWebble: ";

	var myInstanceId = -1;
	var dataMappings = [];

	var mouseIsDown = false;
	var mouseDownPos = null;
	var selectionRect = null;
	var shiftPressed = false;
	var ctrlPressed = false;
	var shouldClearSelections = true;
	var noofLevels = 10;
	var parsingDataNow = false;

	// graphics
	var mapOp = 0;
	var selections = []; // the graphical ones
	var circles = [];
	var lines = [];

	// layout
	var leftMarg = 10;
	var topMarg = 10;
	var rightMarg = 10;
	var bottomMarg = 10;
	var fontSize = 11;
	var colorPalette = null;
	var useGlobalGradients = false;
	var quickRenderThreshold = 500;
	var textColor = "#000000";
	var currentColors = null;
	var lowValCol = "#0000FF";
	var highValCol = "#FF5500";
	var map3Dto2D = 1; // {0:min value, 1:max value, 2:mean value, 3:histogram}
	var colorMethod = 0; // {0:group color + alpha for value, 1:heat map colors, 2:color key}
	var colorKey = [[0.058, 0.5, "#2892c7"], [0.501, 1.0, "#60a3b5"],  [1.001, 1.5, "#8cb8a4"],   [1.501, 2.0, "#b1cc91"],   [2.001, 3.0, "#d7e37d"],   [3.001, 4.0, "#fafa64"],   [4.001, 6.0, "#ffd64f"],   [6.001, 8.0, "#fca43f"],   [8.001, 10.0, "#f77a2d"],   [10.001, 12.0, "#f24d1f"],   [12.001, 15.0, "#e81014"],   [0.0, 0.0095, "#FFFFFF00"]];

	// Popular Colorkey values
	// Nexrad color key [ "#73feff", "#38d5ff", "#0880ff", "#73fa79", "#39d142", "#3da642", "#248f01", "#0b4100", "#fffb01", "#fca942", "#f94c01", "#ac1942", "#ab28aa", "#d82da9", "#f985ff"]
	// Koshimura color key flooding [[0.058, 0.5, "#2892c7"], [0.501, 1.0, "#60a3b5"],  [1.001, 1.5, "#8cb8a4"],   [1.501, 2.0, "#b1cc91"],   [2.001, 3.0, "#d7e37d"],   [3.001, 4.0, "#fafa64"],   [4.001, 6.0, "#ffd64f"],   [6.001, 8.0, "#fca43f"],   [8.001, 10.0, "#f77a2d"],   [10.001, 12.0, "#f24d1f"],   [12.001, 15.0, "#e81014"],   [0.0, 0.0095, "#FFFFFF00"]] // last color is "no color"
	// Koshimura color key buildings [[0.237, 8, "#2892c7"], [8.001, 16.0, "#"],  [16.001, 24, "#"],   [24.001, 32.0, "#"],   [32.001, 40.0, "#"],   [40.001, 48.0, "#"],   [48.001, 56.0, "#"],   [56.001, 64.0, "#"],   [0.0, 0.0095, "#FFFFFF00"]] // last color is "no color"

	var clickStart = null;

	// data from parent
	var alwaysVote = false;
	var dotSize = 5;
	var lineWidth = 2;
	var transparency = 1;
	var lineMod = 0; // 0 = line width, 1 = line opacity, 2 = both
	var limits = {'minLon':0, 'maxLon':0, 'minLat':0, 'maxLat':0};
	var unique = 0; // number of data points with non-null values
	var grouping = true;
	var nullAsUnselected = false;
	var nullGroup = 0;
	var noofGroups = 1;
	var drawH = 1;
	var drawW = 1;
	var internalSelectionsInternallySetTo = {};

	var myCanvas = null;
	var myCtx = null;
	var uCanvas = null;
	var uCtx = null;
	var dropCanvas = null;
	var dropCtx = null;

	// map stuff
	var map = null;
	var mapDiv = null;
	var mapZoom = 8;
	var mapCenterLat = 43.0667;
	var mapCenterLon = 141.35;
	var mapLeftLon = 0;
	var mapRightLon = 0;
	var mapTopLat = 0;
	var mapBottomLat = 0;

	var dropXfr = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'Start Longitude', 'type':['longitude']}, "label":"Line src lon", "rotate":false};
	var dropYfr = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'Start Latitude', 'type':['latitude']}, "label":"Line src lat", "rotate":true};
	var dropXto = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'End Longitude', 'type':['longitude']}, "label":"Line dst lon", "rotate":false};
	var dropYto = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'End Latitude', 'type':['latitude']}, "label":"Line dst lat", "rotate":true};
	var dropXpt = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'Point Longitude', 'type':['longitude']}, "label":"Pt lon", "rotate":false};
	var dropYpt = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'Point Latitude', 'type':['latitude']}, "label":"Pt lat", "rotate":true};
	var dropVpt = {'left':leftMarg, 'top':topMarg, 'right':2*leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'Point Value', 'type':['number']}, "label":"Pt Values", "rotate":false};
	var drop3D = {'left':leftMarg, 'top':topMarg*3, 'right':3*leftMarg, 'bottom':topMarg * 5, "forMapping":{'name':'3D', 'type':['3Darray']}, "label":"3D data", "rotate":false};
	var drop3DCells = {'left':leftMarg, 'top':topMarg*3, 'right':3*leftMarg, 'bottom':topMarg * 5, "forMapping":{'name':'3D Cells', 'type':['number']}, "label":"3D Cells", "rotate":false};
	var allDropZones = [dropXpt, dropXfr, dropXto, dropYpt, dropYfr, dropYto, dropVpt, drop3D, drop3DCells];

	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		try {
			switch(eventData.slotName) {
				case "MapOpacity":
					var newOp = Math.min(100, Math.max(0, eventData.slotValue));
					if(newOp != mapOp) {
						mapOp = newOp;

						if(map !== null) {
							var styles = [{
								stylers: [
									{ lightness: mapOp }
								]
							}];
							var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});
							map.mapTypes.set('map_style', styledMap);
							map.setMapTypeId('map_style');
						}
					}
					break;
				case "ClearData":
					if(eventData.slotValue) {
						$scope.clearData();
						$scope.set("ClearData",false);
					}
					break;
				case "NoofLevels":
					var newNoofLevels = eventData.slotValue;
					if(newNoofLevels > 0 && newNoofLevels != noofLevels) {
						noofLevels = newNoofLevels;

						if(colorMethod == 6 || colorMethod == 7) {
							for(var src = 0; src < dataMappings.length; src++) {
								if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {
									updateGraphics();
									break;
								}
							}
						}
					}
					else {
						$scope.set("NoofLevels", noofLevels);
					}
					break;
				case "Pre-setColorKey":
					newVal = eventData.slotValue;
					switch(newVal) {
						// From Tohoku (Koshimura-sensei) -----------------------------
						case 1: // Tohoku flooding data colors
							var ck = [[0.058, 0.5, "#2892C7"], [0.501, 1.0, "#60A3B5"],  [1.001, 1.5, "#8CB8A4"],   [1.501, 2.0, "#B1CC91"],   [2.001, 3.0, "#D7E37D"],   [3.001, 4.0, "#FAFA64"],   [4.001, 6.0, "#FFD64F"],   [6.001, 8.0, "#FCA43F"],   [8.001, 10.0, "#F77A2D"],   [10.001, 12.0, "#F24D1F"],   [12.001, 15.0, "#E81014"],   [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; });
							$scope.set("ColorKey", ck);
							break;
						case 2: // Tohoku structure damage data colors
							var ck = [[0.237, 8, "#2191CB"], [8.001, 16.0, "#74ABAD"],  [16.001, 24, "#ACC993"],   [24.001, 32.0, "#E3EB75"],   [32.001, 40.0, "#FCDE56"],   [40.001, 48.0, "#FCA03D"],   [48.001, 56.0, "#F56325"],  [56.001, 64.0, "#E81014"], [0.0, 0.0095, "#FFFFFF00"]].sort(function (a,b) { return a[0] - b[0]; });
							$scope.set("ColorKey", ck);
							break;

						// From JMA (weather data, for Miyoshi-sensei) -----------------------------
						case 3: // JMA colors (same colors as JMA radar data), no numeric limits, just colors
							var ck = ["#F2F2FF", "#A0D2FF", "#218CFF", "#0041FF", "#FAF500", "#FF9900", "#FF2800", "#B40068"];
							$scope.set("ColorKey", ck);
							break;
						case 4: // JMA radar data
							var ck = [[-100, 0.01, "#00000000"], [0.01, 1, "#F2F2FF"], [1, 5, "#A0D2FF"], [5, 10, "#218CFF"], [10, 20, "#0041FF"], [20, 30, "#FAF500"], [30, 50, "#FF9900"], [50, 80, "#FF2800"], [80, 100000, "#B40068"]];
							$scope.set("ColorKey", ck);
							break;
						case 5: // JMA accumulated rainfall in mm (same colors as JMA radar data)
							var ck = [[0, 0.5, "#00000000"], [0.5, 10, "#F2F2FF"], [10, 20, "#A0D2FF"], [20, 50, "#218CFF"], [50, 100, "#0041FF"], [100, 200, "#FAF500"], [200, 300, "#FF9900"], [300, 400, "#FF2800"], [400, 100000, "#B40068"]];
							$scope.set("ColorKey", ck);
							break;
						case 6: // JMA snow depth in cm (same colors as JMA radar data)
							var ck = [[-1, 0, "#00000000"], [0.05, 0.1, "#F2F2FF"], [0.1, 5, "#A0D2FF"], [5, 20, "#218CFF"], [20, 50, "#0041FF"], [50, 100, "#FAF500"], [100, 150, "#FF9900"], [150, 200, "#FF2800"], [200, 100000, "#B40068"]];
							$scope.set("ColorKey", ck);
							break;
						case 7: // JMA temperature data
							var ck = [[-300, -5, "#002080"],[-5, 0, "#0041FF"],[0, 5, "#0096FF"],[5, 10, "#B9EBFF"],[10, 15, "#FFFFF0"],[15, 20, "#FFFF96"],[20, 25, "#FAF500"],[25, 30, "#FF9900"],[30, 35, "#FF2800"], [35, 6000, , "#B40068"]];
							var ck = [[-300, -15, "#002080"],[-15, -10, "#0041FF"],[-10, -5, "#0096FF"],[-5, 0, "#B9EBFF"],[0, 5, "#FFFFF0"],[5, 10, "#FFFF96"],[10, 15, "#FAF500"],[15, 20, "#FF9900"],[20, 25, "#FF2800"], [25, 6000, , "#B40068"]];
							$scope.set("ColorKey", ck);
							break;
						case 8: // JMA wind speed data
							var ck = [[0, 5, "#F2F2FF"], [5, 10, "#0041FF"], [10, 15, "#FAF500"], [15, 20, "#FF9900"], [20, 25, "#FF2800"], [25, 3000, "#B6046A"]];
							$scope.set("ColorKey", ck);
							break;
						case 9: // JMA Sunlight
							var ck = [[0, 70, "#242450"], [70, 80, "#454A77"], [80, 90, "#CED2F3"], [90, 100, "#EEEEFF"], [100, 110, "#FFF0B4"], [110, 120, "#FFF000"], [120, 130, "#FF9900"], [130, 10000, "#FF1A1A"]];
							$scope.set("ColorKey", ck);
							break;
						case 10: // JMA comparative (%) (from rainfall image)
							var ck = [[0, 10, "#783705"], [10, 20, "#F5780F"], [20, 50, "#FFC846"], [50, 100, "#FFE5BF"], [100, 150, "#49F3D6"], [150, 250, "#1FCCAF"], [250, 400, "#009980"], [400, 10000, "#004D40"]];
							$scope.set("ColorKey", ck);
							break;

						// Also weather related  --------------------------
						case 11: // NEXRAD colors
							var ck = [ "#73FEFF", "#38D5FF", "#0880FF", "#73FA79", "#39D142", "#3DA642", "#248F01", "#0B4100", "#FFFB01", "#FCA942", "#F94C01", "#AC1942", "#AB28AA", "#D82DA9", "#F985FF"];
							$scope.set("ColorKey", ck);
							break;
						case 12: // NEXRAD scale mm/hour
							var ck = [[0, 0.07, "#00000000"], [0.07, 0.15, "#73FEFF"], [0.15, 0.32, "#38D5FF"], [0.32, 0.65, "#0880FF"], [0.65, 1.3, "#73FA79"], [1.3, 2.7, "#39D142"], [2.7, 5.6, "#3DA642"], [5.6, 12, "#248F01"], [12, 24, "#0B4100"], [24, 49, "#FFFB01"], [49, 100, "#FCA942"], [100, 205, "#F94C01"], [205, 421, "#AC1942"], [421, 865, "#AB28AA"], [865, 1776, "#D82DA9"], [1776, 1000000, "#F985FF"]];
							$scope.set("ColorKey", ck);
							break;
						case 13: // WSI Radar colors
							var ck = ["#72f842", "#39d000", "#2ba500", "#3da642", "#248f01", "#1d7600", "#0b4100", "#fffb01", "#fca942", "#fcaa7a", "#aa7942", "#f94c01", "#d81e00", "#ac1942", "#f952aa"];
							$scope.set("ColorKey", ck);
							break;
						case 14: // WSI Radar (mm/hour)
							var ck = [[0, 0.07, "#00000000"], [0.07, 0.15, "#72f842"], [0.15, 0.32, "#39d000"], [0.32, 0.65, "#2ba500"], [0.65, 1.3, "#3da642"], [1.3, 2.7, "#248f01"], [2.7, 5.6, "#1d7600"], [5.6, 12, "#0b4100"], [12, 24, "#fffb01"], [24, 49, "#fca942"], [49, 100, "#fcaa7a"], [100, 205, "#aa7942"], [205, 421, "#f94c01"], [421, 865, "#d81e00"], [865, 1776, "#ac1942"], [1776, 1000000, "#f952aa"]];
							$scope.set("ColorKey", ck);
							break;
					} // switch newVal
					break;
				case "ColorKey":
					colorKey = eventData.slotValue;
					if(typeof colorKey[0] != 'string' && colorKey[0].length > 1) { // colors and limits
						colorKey.sort(function (a,b) { return a[0] - b[0]; });
					}
					$scope.set("Pre-setColorKey", 0); // manual input

					if(colorMethod == 4 || colorMethod == 5) {
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {// using color key
								updateGraphics();
								break;
							}
						}
					}
					break;
				case "ColorMethod":
					var newCM = eventData.slotValue;
					if(newCM != colorMethod) {
						colorMethod = newCM;
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {
								updateGraphics();
								break;
							}
						}
					}
					break;
				case "3Dto2Dmapping":
					var new3dto2d = eventData.slotValue;
					if(new3dto2d != map3Dto2D ) {
						map3Dto2D = new3dto2d;
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {
								updateGraphics();
								break;
							}
						}
					}
					break;
				case "HeatMapLowValueColor":
					lowValCol = eventData.slotValue;
					if(colorMethod == 3 || colorMethod == 2) { // heat map color methods
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {
								// $log.log(preDebugMsg + "HeatMapLowValueColor change calls updateGraphics");
								updateGraphics();
							}
						}
					}
					break;
				case "HeatMapHighValueColor":
					highValCol = eventData.slotValue;
					if(colorMethod == 3 || colorMethod == 2) { // heat map color methods
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4 || dataMappings[src].vizType == 2)) {
								// $log.log(preDebugMsg + "HeatMapHighValueColor change calls updateGraphics");
								updateGraphics();
							}
						}
					}
					break;
				case "SelectAll":
					if(eventData.slotValue) {
						$scope.selectAll();
						$scope.set("SelectAll",false);
					}
					break;
				case "ZoomLevel":
					var newZoom = parseInt(eventData.slotValue);
					if(mapZoom != newZoom) {
						mapZoom = newZoom;
						if(map){
							if(map.getZoom() != mapZoom){
								map.setZoom(mapZoom);
								updateGraphics();
							}
						}
					}
					break;
				case "MapCenterLatitude":
					var newLat = parseFloat(eventData.slotValue);
					if(newLat != mapCenterLat) {
						mapCenterLat = newLat;
						mapCenterLon = parseFloat($scope.gimme("MapCenterLongitude"));

						if(map){
							var currentPlace = new google.maps.LatLng(mapCenterLat, mapCenterLon);
							map.panTo(currentPlace);
						}
					}
					break;
				case "MapCenterLongitude":
					var newLon = parseFloat(eventData.slotValue);
					if(newLon != mapCenterLon) {
						mapCenterLat = parseFloat($scope.gimme("MapCenterLatitude"));
						mapCenterLon = newLon;

						if(map){
							var currentPlace = new google.maps.LatLng(mapCenterLat, mapCenterLon);
							map.panTo(currentPlace);
						}
					}
					break;
				case "InternalSelections":
					if(eventData.slotValue != internalSelectionsInternallySetTo) {
						setSelectionsFromSlotValue();
					}
					break;
				case "QuickRenderThreshold":
					var newThreshold = parseFloat($scope.gimme("QuickRenderThreshold"));
					if(!isNaN(newThreshold) && isFinite(newThreshold) && newThreshold > 0) {
						if(newThreshold != quickRenderThreshold) {
							var oldState = unique > quickRenderThreshold;
							var newState = unique > newThreshold;
							quickRenderThreshold = newThreshold;
							if(oldState != newState) {
								// $log.log(preDebugMsg + "QuickRenderThreshold change calls updateGraphics");
								updateGraphics();
							}
						}
					}
					break;
				case "TreatNullAsUnselected":
					var newNullAsUnselected = $scope.gimme('TreatNullAsUnselected');
					if(newNullAsUnselected != nullAsUnselected) {
						updateLocalSelections(false);
					}
					break;
				case "MultipleSelectionsDifferentGroups":
					var newMultipleSelectionsDifferentGroups = $scope.gimme('MultipleSelectionsDifferentGroups');
					if(newMultipleSelectionsDifferentGroups != grouping) {
						updateLocalSelections(false);
					}
					break;
				case "mapDrawingArea:height":
					updateSize();
					break;
				case "mapDrawingArea:width":
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
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 0)) {
								updateGraphics();
								break;
							}
						}
					}
					break;
				case "LineModification":
					var newVal = parseInt($scope.gimme("LineModification"));
					if(newVal == 0 && lineMod != 0 || newVal == 1 && lineMod != 1 || newVal == 2 && lineMod != 2) {
						lineMod = newVal;
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && dataMappings[src].vizType == 5) {
								updateGraphics();
								break;
							}
						}

					}
					break;
				case "LineWidth":
					var newVal = parseInt($scope.gimme("LineWidth"));
					if(newVal < 1) {
						newVal = 1;
					}
					if(newVal != lineWidth) {
						lineWidth = newVal;
						for(var src = 0; src < dataMappings.length; src++) {
							if(dataMappings[src].active && (dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5)) {
								// $log.log(preDebugMsg + "LineWidth change calls updateGraphics");
								updateGraphics();
								break;
							}
						}
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
						// $log.log(preDebugMsg + "Transparency change calls updateGraphics");
						updateGraphics();
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
				case "ColorScheme":
					colorPalette = null;
					if(eventData.slotValue && eventData.slotValue.hasOwnProperty('skin') && eventData.slotValue.skin.hasOwnProperty('border')) {
						$scope.set("mapDrawingArea:background-color", eventData.slotValue.skin.border);
					}

					var colors = $scope.gimme("ColorScheme");
					if(typeof colors === 'string') {
						colors = JSON.parse(colors);
					}
					currentColors = legacyDDSupLib.copyColors(colors);
					updateGraphics();
					updateDropZones(textColor, 0.3, false);
					break;
			};
		} catch(exc) {
			$log.log(preDebugMsg + "Error when getting a slot set");
		}
	}
	//===================================================================================


	//===================================================================================
	// Map Mouse Down
	// This event handler stop mouse left click propagation (Normal Webble behavior) on
	// the Webble.
	//===================================================================================
	function mapMouseDown(e){
		if(e.which === 1){
			e.stopPropagation();
		}
	}
	//===================================================================================


	//===================================================================================
	// Key Down / Key Up
	// These event handlers manages keyboard press down and key release.
	//===================================================================================
	$(window).keydown(function (evt) {
		if (evt.which === 16) { // shift
			shiftPressed = true;
			map.setOptions({
				draggable: true
			});
		}
		if (evt.which === 17) { // ctrl
			ctrlPressed = true;
		}
		if(evt.which === 224 /*firefox command key*/ || evt.which === 91 /*safari/chrome left command key*/ || evt.which === 93 /*safari/chrome right command key*/) { // opera uses 17, which is covered by the normal code above
			ctrlPressed = true;
		}
	}).keyup(function (evt) {
		if (evt.which === 16) { // shift
			shiftPressed = false;
			map.setOptions({
				draggable: false
			});
		}
		if (evt.which === 17) { // ctrl
			ctrlPressed = false;
		}
		if(evt.which === 224 /*firefox command key*/ || evt.which === 91 /*safari/chrome left command key*/ || evt.which === 93 /*safari/chrome right command key*/) { // opera uses 17, which is covered by the normal code above
			ctrlPressed = false;
		}
	});
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
			myCtx = myCanvas.getContext("2d");
		}
		else {
			$log.log(preDebugMsg + "no canvas to draw on!");
		}

		var myCanvasElement = $scope.theView.parent().find('#theUnCanvas');
		if(myCanvasElement.length > 0) {
			uCanvas = myCanvasElement[0];
			uCtx = uCanvas.getContext("2d");
		}
		else {
			$log.log(preDebugMsg + "no canvas to draw on!");
		}

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

		// internal slots specific to this Webble -----------------------------------------------------------

		$scope.addSlot(new Slot('MapOpacity',
			mapOp,
			"Map Opacity",
			'Raise this value to make the colors of the map less strong. Scale from 0 (normal map) to 100 (completely white).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

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

		$scope.addSlot(new Slot('LineModification',
			lineMod,
			"Line Modification",
			'What should be changed for lines when there is line data + extra values. (The line width, the line opacity, or both)',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Line Width", "Opacity", "Both"]},
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

		$scope.addSlot(new Slot('3Dto2Dmapping',
			map3Dto2D,
			"3D to 2D mapping",
			'How to represent 3D data in 2D (i.e. show the average value, or the maximum value, etc.).',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Min", "Max", "Mean"]},
			undefined
		));

		$scope.addSlot(new Slot('ColorMethod',
			colorMethod,
			"Color Method",
			'How to pick colors for heat map style data.',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Group Color + Alpha (min to max)", "Group Color + Alpha (histogram)", "Heat Map Colors (min to max)", "Heat Map Colors (histogram)", "Color Key", "Color Key Level Curves", "Truncated Levels", "Level Curves"]},
			undefined
		));

		colorKey.sort(function (a,b) { return a[0] - b[0]; });
		$scope.addSlot(new Slot('ColorKey',
			colorKey,
			"Color Key",
			'The color key (mapping from value to color) to use when "Color Method" is set to "Color Key".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Pre-setColorKey',
			0,
			"Pre-set Color Key",
			'Choose a predefined color key (or "manual input" to type in a different color key manually).',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Manual Input", "Tohoku Flooding", "Tohoku Structural Damage", "JMA Colors", "JMA Radar Data", "JMA Accumulated Rainfall", "JMA Snow Depth (cm)", "JMA Temperature", "JMA Wind Speed", "JMA Sunlight (relative)", "JMA Comparative (%)", "NEXRAD Colors", "NEXRAD (mm/h)", "WSI Radar Colors", "WSI Radar (mm/h)"]},
			undefined
		));

		$scope.addSlot(new Slot('NoofLevels',
			noofLevels,
			"Number of Levels",
			'Number of levels to truncate to when truncating values.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('HeatMapLowValueColor',
			lowValCol,
			"Heat Map Low Value Color",
			'The color to use for the low values in the heat map plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('HeatMapHighValueColor',
			highValCol,
			"Heat Map High Value Color",
			'The color to use for the high values in the heat map plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ZoomLevel',
			mapZoom,
			"Zoom Level",
			'The zoom level of the map.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MapCenterLatitude',
			mapCenterLat,
			"Map Center Latitude",
			'Where the map is centered.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MapCenterLongitude',
			mapCenterLon,
			"Map Center Longitude",
			'Where the map is centered.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
			grouping,
			"Multiple Selections -> Different Groups",
			'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('TreatNullAsUnselected',
			nullAsUnselected,
			"Treat Null as Unselected",
			'Group data items with no value together with items that are not selected (otherwise they get their own group).',
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

		// Dashboard Plugin slots -----------------------------------------------------------

		$scope.addSlot(new Slot('PluginName',
			"Map",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginType',
			"VisualizationPlugin",
			"Plugin Type",
			'The type of plugin this is. Should always be "VisualizationPlugin".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// colors of groups of data, and the background color theme
		$scope.addSlot(new Slot('ColorScheme',
			{"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
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
					14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}},
			"Color Scheme",
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot('ColorScheme');
		myInstanceId = $scope.getInstanceId();

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		updateSize();
		updateGraphics();
		$scope.fixDroppable();

		if(!$scope.isThisLibLoadedAlready("https://maps.googleapis.com/maps/api/js")){
			$scope.addThisLibToLoadedAlreadyList("https://maps.googleapis.com/maps/api/js");
			if(($location.search()).np != "true"){
				dbService.getMyAccessKey("www.google.com", "maps").then(
					function(returningKey) {
						if(returningKey){
							var urlPath = "https://maps.googleapis.com/maps/api/js?key=";
							$.getScript( urlPath +  returningKey)
								.always(function( jqxhr, settings, exception ) {
									$timeout(function(){initializeMapAPI();});
								});
						}
						else{
							$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Access Key Found"), content: gettext("There was no key of the specified realm (www.google.com) and resource (maps) saved in your user profile. So we loaded a very limited non-api map instead.")}, null);
							$.getScript("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=isNaN")
								.always(function( jqxhr, settings, exception ) {
									$timeout(function(){initializeMapAPI();});
								});
						}
					},
					function (err) {
						$log.log("ERROR: " + err);
						$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No User and Access Key Found"), content: gettext("This Webble requires a logged in user and a valid Google Map API key to function properly and neither were found, so we loaded a very limited non-api map instead.")}, null);
						$.getScript("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=isNaN")
							.always(function( jqxhr, settings, exception ) {
								$timeout(function(){initializeMapAPI();});
							});
					}
				);
			}
			else{
				$.getScript("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=isNaN")
					.always(function( jqxhr, settings, exception ) {
						$timeout(function(){initializeMapAPI();});
					});
			}
		}
		else{
			$timeout(function(){initializeMapAPI();});
		}
	};
	//===================================================================================


	// ============================================================
	// ------- Methods Similar to all Visualization Webbles -------
	// ============================================================

	//===================================================================================
	// Fix Droppable
	// This method fixes the droppable behavior to behave as wanted.
	//===================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('#theCanvas').droppable({
			over: function(e, ui) {
				if(e.target.id == "theCanvas") {
					updateDropZones(textColor, 1, true);
				}
			},
			out: function() {
				updateDropZones(textColor, 0.3, false);
			},
			tolerance: 'pointer',
			drop: function(e, ui){
				if(e.target.id == "theCanvas") {
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

						if(xpos <= dropZone.right && xpos >= dropZone.left && ypos >= dropZone.top && ypos < dropZone.bottom) {
							f = dropZone.forMapping;
							ok = true;
						}
					}
					if(ok) {
						dataDropped(ui.draggable.attr('id'), f);
					}
				}
				updateDropZones(textColor, 0.3, false);
			}
		});
	};
	//===================================================================================


	//===================================================================================
	// Fake Drop
	// This method imitates a data drop.
	//===================================================================================
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
	//===================================================================================


	//===================================================================================
	// Clear Data
	// This method clears away all data.
	//===================================================================================
	$scope.clearData = function() {
		var oldMappings = dataMappings;
		resetVars();
		dataMappings = [];
		parsingDataNow = true;

		for(var src = 0; src < oldMappings.length; src++) {
			if(oldMappings[src].hasOwnProperty("newSelections") && oldMappings[src].newSelections !== null) {
				oldMappings[src].newSelections(myInstanceId, null, false, true);
			}

			if(oldMappings[src].hasOwnProperty("listen") && oldMappings[src].listen !== null) {
				oldMappings[src].listen(myInstanceId, false, null, null, []);
			}

			for(var i = 0; i < oldMappings[src].map.length; i++) {
				if(oldMappings[src].map[i].hasOwnProperty("listen") && oldMappings[src].map[i].listen !== null) {
					oldMappings[src].map[i].listen(myInstanceId, false, null, null, []);
				}

				if(oldMappings[src].map[i].hasOwnProperty("newSelections") && oldMappings[src].map[i].newSelections !== null) {
					oldMappings[src].map[i].newSelections(myInstanceId, null, false, true);
				}
			}
		}
		parsingDataNow = false;
		updateGraphics();
	};
	//===================================================================================


	//===================================================================================
	// Type Check
	// This method check the types for the specified parameters.
	//===================================================================================
	function typeCheck(t1, t2) {
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
	//===================================================================================


	//===================================================================================
	// Check Mappings and Parse Data
	// This method checks the mappings and parse the data.
	//===================================================================================
	function checkMappingsAndParseData() {
		// $log.log(preDebugMsg + "checkMappingsAndParseData");
		parsingDataNow = true;
		var somethingChanged = false;
		var atLeastOneActive = false;

		for(var src = 0; src < dataMappings.length; src++) {
			var typeError = false;
			var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
			var ls = w.scope().gimme(dataMappings[src].slotName);
			var haveLineStartLon = false;
			var haveLineStartLat = false;
			var haveLineEndLon = false;
			var haveLineEndLat = false;
			var havePointLon = false;
			var havePointLat = false;
			var havePointVal = false;
			var have3D = false;
			var have3DCells = false;

			for(var f = 0; f < dataMappings[src].map.length; f++) {
				if(dataMappings[src].map[f].name == "Start Longitude") {
					haveLineStartLon = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropXfr.forMapping.type)) {
						typeError = true;
						haveLineStartLon = false;
					}
				}
				if(dataMappings[src].map[f].name == "Start Latitude") {
					haveLineStartLat = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropYfr.forMapping.type)) {
						typeError = true;
						haveLineStartLat = false;
					}
				}
				if(dataMappings[src].map[f].name == "End Longitude") {
					haveLineEndLon = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropXto.forMapping.type)) {
						typeError = true;
						haveLineEndLon = false;
					}
				}
				if(dataMappings[src].map[f].name == "End Latitude") {
					haveLineEndLat = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropYto.forMapping.type)) {
						typeError = true;
						haveLineEndLat = false;
					}
				}
				if(dataMappings[src].map[f].name == "Point Longitude") {
					havePointLon = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropXpt.forMapping.type)) {
						typeError = true;
						havePointLon = false;
					}
				}
				if(dataMappings[src].map[f].name == "Point Latitude") {
					havePointLat = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropYpt.forMapping.type)) {
						typeError = true;
						havePointLat = false;
					}
				}
				if(dataMappings[src].map[f].name == "Point Value") {
					havePointVal = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropVpt.forMapping.type)) {
						typeError = true;
						havePointVal = false;
					}
				}
				if(dataMappings[src].map[f].name == "3D") {
					have3D = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, drop3D.forMapping.type)) {
						typeError = true;
						have3D = false;
					}
				}
				if(dataMappings[src].map[f].name == "3D Cells") {
					have3DCells = true;
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, drop3DCells.forMapping.type)) {
						typeError = true;
						have3DCells = false;
					}
				}
				if(dataMappings[src].map[f].listen === null) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;
				}
			}

			var canActivate = false;
			var vizType = 0;
			if(havePointLon && havePointLat && have3D) {
				// TODO: do various dimensionality checks here too
				vizType = 3; // 3D heatmap
				canActivate = true;
				atLeastOneActive = true;

				if(have3DCells) {
					vizType = 4; // 3D heatmap + internal cell selections
				}
			}
			else if(havePointLon && havePointLat && havePointVal) {
				// TODO: do various dimensionality checks here too
				vizType = 2; // 2D heatmap
				canActivate = true;
				atLeastOneActive = true;
			}
			else if(haveLineStartLon && haveLineStartLat && haveLineEndLon && haveLineEndLat && havePointVal) {
				// TODO: do various dimensionality checks here too
				$log.log(preDebugMsg + "found lines + values");
				vizType = 5; // lines + values
				canActivate = true;
				atLeastOneActive = true;
			}
			else if(haveLineStartLon && haveLineStartLat && haveLineEndLon && haveLineEndLat) {
				// TODO: do various dimensionality checks here too
				$log.log(preDebugMsg + "found lines");
				vizType = 1; // lines
				canActivate = true;
				atLeastOneActive = true;
			}
			else if(havePointLon && havePointLat) {
				// TODO: do various dimensionality checks here too
				vizType = 0; // points
				canActivate = true;
				atLeastOneActive = true;
			}

			if(dataMappings[src].active != canActivate) {
				// we can start visualizing this data
				dataMappings[src].clean = false;
				somethingChanged = true;
			}

			if(canActivate && vizType != dataMappings[src].vizType) {
				dataMappings[src].vizType = vizType;
				somethingChanged = true;
			}

			if(canActivate) {
				var ls2 = [];
				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					// lex[dataMappings[src].map[ff].idx] = true;
					ls2.push(dataMappings[src].map[ff].srcIdx);
				}

				// start listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					if((dataMappings[src].vizType == 0 && (dataMappings[src].map[i].name == "Point Longitude" || dataMappings[src].map[i].name == "Point Latitude")) || (dataMappings[src].vizType == 1 && (dataMappings[src].map[i].name == "Start Longitude" || dataMappings[src].map[i].name == "Start Latitude" || dataMappings[src].map[i].name == "End Longitude" || dataMappings[src].map[i].name == "End Latitude")) || (dataMappings[src].vizType == 5 && (dataMappings[src].map[i].name == "Start Longitude" || dataMappings[src].map[i].name == "Start Latitude" || dataMappings[src].map[i].name == "End Longitude" || dataMappings[src].map[i].name == "End Latitude" || dataMappings[src].map[i].name == "Point Value")) || (dataMappings[src].vizType == 2 && (dataMappings[src].map[i].name == "Point Longitude" || dataMappings[src].map[i].name == "Point Latitude" || dataMappings[src].map[i].name == "Point Value")) || (dataMappings[src].vizType == 3 && (dataMappings[src].map[i].name == "Point Longitude" || dataMappings[src].map[i].name == "Point Latitude" || dataMappings[src].map[i].name == "3D")) || (dataMappings[src].vizType == 4 && (dataMappings[src].map[i].name == "Point Longitude" || dataMappings[src].map[i].name == "Point Latitude" || dataMappings[src].map[i].name == "3D Cells" || dataMappings[src].map[i].name == "3D"))) {
						// $log.log(preDebugMsg + "Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
							dataMappings[src].map[i].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
						}
						dataMappings[src].map[i].active = true;
					}
					else {
						// $log.log(preDebugMsg + "Stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
							dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
						}
						dataMappings[src].map[i].active = false;
					}
				}
			}
			else {
				// stop listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					dataMappings[src].map[i].active = false;
					if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
						// $log.log(preDebugMsg + "Not active, stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
					}
				}
			}
			dataMappings[src].active = canActivate;
		}

		if(somethingChanged || atLeastOneActive) {
			parseData();
		}
		else {
			parsingDataNow = false;
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Data
	// This method checks weather it is time to redraw based on new data.
	//===================================================================================
	function redrawOnNewData(seqNo) {
		if(lastSeenDataSeqNo != seqNo) {
			lastSeenDataSeqNo = seqNo;
			checkMappingsAndParseData();
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Selections
	// This method checks weather it is time to redraw based on new Selections.
	//===================================================================================
	function redrawOnNewSelections(seqNo) {
		if(lastSeenSelectionSeqNo != seqNo) {
			lastSeenSelectionSeqNo = seqNo;
			updateGraphics();
		}
	}
	//===================================================================================


	//===================================================================================
	// Data Dropped
	// This method manages what to do with the data being dropped.
	//===================================================================================
	function dataDropped(dataSourceInfoStr, targetField) {
		try {
			var dataSourceInfo = JSON.parse(dataSourceInfoStr);

			if(typeCheck(dataSourceInfo.type, targetField.type)) {
				var srcWebble = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID);
				var accessorFunctionList = srcWebble.scope().gimme(dataSourceInfo.slotName);
				var accessorFunctions = accessorFunctionList[dataSourceInfo.fieldIdx];
				var displayNameS = dataSourceInfo.sourceName;
				var displayNameF = dataSourceInfo.fieldName;
				var somethingChanged = false;
				var newSrc = true;
				var mapSrcIdx = 0;
				for(var i = 0; i < dataMappings.length; i++) {
					if(dataMappings[i].srcID == dataSourceInfo.webbleID) {
						newSrc = false;
						mapSrcIdx = i;
						break;
					}
				}
				if(newSrc) {
					mapSrcIdx = dataMappings.length;
					dataMappings.push({'srcID':dataSourceInfo.webbleID, 'map':[], 'active':false, 'clean':true, 'slotName':dataSourceInfo.slotName});
					somethingChanged = true;
				}

				var found = false;
				for(var i = 0; i < dataMappings[mapSrcIdx].map.length; i++) {
					if(dataMappings[mapSrcIdx].map[i].name == targetField.name) { // already had something mapped here
						if(dataMappings[mapSrcIdx].map[i].srcIdx == dataSourceInfo.fieldIdx) {
							// same field dropped in same place again, nothing to do
						}
						else {
							// inform previous source that we are no longer using the data
							if(dataMappings[mapSrcIdx].hasOwnProperty("newSelections")) {
								dataMappings[mapSrcIdx].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
							}

							var onlyOne = true;
							for(var ii = 0; ii < dataMappings[mapSrcIdx].map.length; ii++) {
								if(ii != i && dataMappings[mapSrcIdx].map[ii].srcIdx == dataMappings[mapSrcIdx].map[i].srcIdx) {
									// same data field on a different axis
									onlyOne = false;
								}
							}
							if(onlyOne) {
								//  if this was the only field listening to updates, stop listening
								// $log.log(preDebugMsg + "Last one, stop listening to " + dataMappings[mapSrcIdx].map[i].name);

								dataMappings[mapSrcIdx].map[i].listen(myInstanceId, false, null, null, []);
							}

							// replace old mapping
							dataMappings[mapSrcIdx].map[i].srcIdx = dataSourceInfo.fieldIdx;
							dataMappings[mapSrcIdx].clean = false;
							somethingChanged = true;
						}
						found = true;
						break;
					}
				}

				if(!found) {
					dataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':targetField.name, 'listen':null});
					dataMappings[mapSrcIdx].clean = false;
					somethingChanged = true;
				}

				if(somethingChanged) {
					checkMappingsAndParseData();
				}

			}
			else {
				$log.log(preDebugMsg + dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
			}
		} catch(e) {
			// not proper JSON, probably something random was dropped on us so let's ignore this event
		}
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
			var bounds = selections[sel].getBounds();
			var ne = bounds.getNorthEast();
			var sw = bounds.getSouthWest();
			result.selections.push({'minX':sw.lat(), 'maxX':ne.lat(), 'minY':sw.lng(), 'maxY':ne.lng()});
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

		if(slotSelections.hasOwnProperty("selections")) {
			clearSelections();
			var cols = $scope.gimme("GroupColors");
			var col = "#FFEBCD";
			var border = "#FFA500";

			if(cols && cols.hasOwnProperty("selection")) {
				if(cols.selection.hasOwnProperty("color")) {
					col = cols.selection.color;
				}
				if(cols.selection.hasOwnProperty("border")) {
					border = cols.selection.border;
				}
			}

			for(var sel = 0; sel < slotSelections.selections.length; sel++) {
				var newSel = slotSelections.selections[sel];
				var X1 = newSel.minX;
				var X2 = newSel.maxX;
				var Y1 = newSel.minY;
				var Y2 = newSel.maxY;
				var bounds = new google.maps.LatLngBounds();
				var p1 = new google.maps.LatLng(newSel.minX, newSel.minY);
				var p2 = new google.maps.LatLng(newSel.maxX, newSel.maxY);
				bounds.extend(p1);
				bounds.extend(p2);
				selectionRect = new google.maps.Rectangle({
					map: map,
					bounds: bounds,
					fillOpacity: 0.25,
					strokeWeight: 0.95,
					strokeColor: border,
					fillColor: col,
					clickable: false
				});
				selections.push(selectionRect);
				selectionRect = null;
			}
		}
		updateLocalSelections(false);
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Update Local Selections
	// This method updates the local selections to be in phase with global ones.
	//===================================================================================
	function updateLocalSelections(selectAll) {
		// $log.log(preDebugMsg + "updateLocalSelections");
		nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
		nullGroup = 0;
		if(!nullAsUnselected) {
			nullGroup = selections.length + 1; // get unused groupId
		}
		grouping = $scope.gimme('MultipleSelectionsDifferentGroups');
		selections.sort(function(a,b){var neA = a.getBounds().getNorthEast(); var neB = b.getBounds().getNorthEast(); var swA = a.getBounds().getSouthWest(); var swB = b.getBounds().getSouthWest(); return ((neA.lat()-swA.lat()) * (neA.lng() - swA.lng())) - ((neB.lat()-swB.lat()) * (neB.lng() - swB.lng()));}); // sort selections so smaller (area) ones are checked first.

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var srcsrc = src;
				if(dataMappings[src].vizType == 0 || dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5 || dataMappings[src].vizType == 2) {
					if(dataMappings[src].hasOwnProperty("newSelectionsLat") && dataMappings[src].newSelectionsLat !== null) {
						dataMappings[src].newSelectionsLat(myInstanceId, null, false, true);
					}
					if(dataMappings[src].hasOwnProperty("newSelectionsLon") && dataMappings[src].newSelectionsLon !== null) {
						dataMappings[src].newSelectionsLon(myInstanceId, null, false, true);
					}
					if(dataMappings[src].hasOwnProperty("newSelections") && dataMappings[src].newSelections !== null) {
						dataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAll);
					}
					if(dataMappings[src].hasOwnProperty("newSelectionsCells") && dataMappings[src].newSelectionsCells !== null) {
						dataMappings[src].newSelectionsCells(myInstanceId, null, false, true);
					}
				}
				else if(dataMappings[src].vizType == 3) {
					var haveLat = false;
					var haveLon = false;
					if(dataMappings[src].hasOwnProperty("newSelectionsLat") && dataMappings[src].newSelectionsLat !== null) {
						haveLat = true;
					}
					if(dataMappings[src].hasOwnProperty("newSelectionsLon") && dataMappings[src].newSelectionsLon !== null) {
						haveLon = true;
					}
					if(haveLat) {
						dataMappings[src].newSelectionsLat(myInstanceId, function(idx) { return mySelectionStatusLat(srcsrc, idx); }, haveLon, selectAll);
					}
					if(haveLon) {
						dataMappings[src].newSelectionsLon(myInstanceId, function(idx) { return mySelectionStatusLon(srcsrc, idx); }, false, selectAll);
					}
					if(dataMappings[src].hasOwnProperty("newSelections") && dataMappings[src].newSelections !== null) {
						dataMappings[src].newSelections(myInstanceId, null, false, true);
					}
					if(dataMappings[src].hasOwnProperty("newSelectionsCells") && dataMappings[src].newSelectionsCells !== null) {
						dataMappings[src].newSelectionsCells(myInstanceId, null, false, true);
					}
				}
				else if(dataMappings[src].vizType == 4) {
					var haveLat = false;
					var haveLon = false;
					var haveCells = false;
					if(dataMappings[src].hasOwnProperty("newSelectionsCells") && dataMappings[src].newSelectionsCells !== null) {
						haveCells = true;
					}
					if(haveCells) {
						dataMappings[src].newSelectionsCells(myInstanceId, function(idx) { return mySelectionStatusCells(srcsrc, idx); }, haveLat || haveLon, selectAll);
					}
					if(haveLat) {
						dataMappings[src].newSelectionsLat(myInstanceId, function(idx) { return mySelectionStatusLat(srcsrc, idx); }, haveLon, selectAll);
					}
					if(haveLon) {
						dataMappings[src].newSelectionsLon(myInstanceId, function(idx) { return mySelectionStatusLon(srcsrc, idx); }, false, selectAll);
					}
					if(dataMappings[src].hasOwnProperty("newSelections") && dataMappings[src].newSelections !== null) {
						dataMappings[src].newSelections(myInstanceId, null, false, true);
					}
				}
			}
			else {
				dataMappings[src].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					if(dataMappings[src].map[ff].hasOwnProperty("listen") && dataMappings[src].map[ff].listen !== null) {
						// $log.log(preDebugMsg + "Not active (selection), stop listening to " + dataMappings[src].map[ff].name + " " + dataMappings[src].map[ff].srcIdx);
						dataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status
	// This method returns this Webbles selection status.
	//===================================================================================
	function mySelectionStatus(src, idx) {
		if(dataMappings[src].active) {
			if(dataMappings[src].vizType == 0) { // points
				var lon = dataMappings[src].valFunLon1(idx);
				var lat = dataMappings[src].valFunLat1(idx);
				var groupId = 0;

				if(lon1 === null || lat1 === null) {
					groupId = nullGroup;
				}
				else {
					var p1 = new google.maps.LatLng(lat, lon);
					for(var span = 0; span < selections.length; span++) {
						if(selections[span].getBounds().contains(p1)) {
							groupId = span + 1;
							break;
						}
					}
				}
				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
			else if(dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5) { // lines
				var lon1 = dataMappings[src].valFunLon1(idx);
				var lat1 = dataMappings[src].valFunLat1(idx);
				var lon2 = dataMappings[src].valFunLon2(idx);
				var lat2 = dataMappings[src].valFunLat2(idx);
				var groupId = 0;

				if(lon1 === null || lat1 === null || lon2 === null || lat2 === null) {
					groupId = nullGroup;
				}
				else {
					var p1 = new google.maps.LatLng(lat1, lon1);
					var p2 = new google.maps.LatLng(lat2, lon2);
					for(var span = 0; span < selections.length; span++) {
						var sb = selections[span].getBounds();
						if(sb.contains(p1) || sb.contains(p2)) {
							groupId = span + 1;
							break;
						}
					}
				}
				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
			else if(dataMappings[src].vizType == 2) { // points and values, heatmap
				var lon = dataMappings[src].valFunLon1(idx);
				var lat = dataMappings[src].valFunLat1(idx);
				var v = dataMappings[src].valFunVal(idx);
				var groupId = 0;

				if(lon1 === null || lat1 === null || v === null) {
					groupId = nullGroup;
				}
				else {
					var p1 = new google.maps.LatLng(lat, lon);
					for(var span = 0; span < selections.length; span++) {
						if(selections[span].getBounds().contains(p1)) {
							groupId = span + 1;
							break;
						}
					}
				}
				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets all the main variables for the plugin Webble getting it ready
	// for new fresh data.
	//===================================================================================
	function resetVars() {
		limits = {'minLon':0, 'maxLon':0, 'minLat':0, 'maxLat':0};
		unique = 0;
		NULLs = 0;
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		resetVars();
		parsingDataNow = true;
		var dataIsCorrupt = false;

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
				var ls = w.scope().gimme(dataMappings[src].slotName);

				for(var f = 0; f < dataMappings[src].map.length; f++) {
					if(dataMappings[src].map[f].active) {
						var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
						dataMappings[src].map[f].listen = fieldInfo.listen;

						if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) { // 3D data and lat/lon vectors
							if(dataMappings[src].map[f].name == "Point Longitude") {
								dataMappings[src].valFunLon = fieldInfo.val;
								dataMappings[src].selFunLon = fieldInfo.sel;
								dataMappings[src].sizeLon = fieldInfo.size;
								dataMappings[src].newSelectionsLon = fieldInfo.newSel;
							}
							if(dataMappings[src].map[f].name == "Point Latitude") {
								dataMappings[src].valFunLat = fieldInfo.val;
								dataMappings[src].selFunLat = fieldInfo.sel;
								dataMappings[src].sizeLat = fieldInfo.size;
								dataMappings[src].newSelectionsLat = fieldInfo.newSel;
							}
							if(dataMappings[src].map[f].name == "3D") {
								dataMappings[src].valFun = fieldInfo.val;
								dataMappings[src].selFun = fieldInfo.sel;
								dataMappings[src].size = fieldInfo.size;
								dataMappings[src].newSelections = fieldInfo.newSel;
							}
							if(dataMappings[src].map[f].name == "3D Cells" && dataMappings[src].vizType == 4) {
								dataMappings[src].selFunCells = fieldInfo.sel;
								dataMappings[src].sizeCells = fieldInfo.size;
								dataMappings[src].newSelectionsCells = fieldInfo.newSel;
							}
						}
						else { // points, lines, or points with values (heat map)
							if(dataMappings[src].map[f].name == "Start Longitude") {
								dataMappings[src].valFunLon1 = fieldInfo.val;
								dataMappings[src].selFun = fieldInfo.sel;
								dataMappings[src].size = fieldInfo.size;
								dataMappings[src].newSelections = fieldInfo.newSel;
							}
							if(dataMappings[src].map[f].name == "Start Latitude") {
								dataMappings[src].valFunLat1 = fieldInfo.val;
							}
							if(dataMappings[src].map[f].name == "End Longitude") {
								dataMappings[src].valFunLon2 = fieldInfo.val;
							}
							if(dataMappings[src].map[f].name == "End Latitude") {
								dataMappings[src].valFunLat2 = fieldInfo.val;
							}
							if(dataMappings[src].map[f].name == "Point Longitude") {
								dataMappings[src].valFunLon1 = fieldInfo.val;
								dataMappings[src].selFun = fieldInfo.sel;
								dataMappings[src].size = fieldInfo.size;
								dataMappings[src].newSelections = fieldInfo.newSel;
							}
							if(dataMappings[src].map[f].name == "Point Latitude") {
								dataMappings[src].valFunLat1 = fieldInfo.val;
							}
							if(dataMappings[src].map[f].name == "Point Value") {
								dataMappings[src].valFunVal = fieldInfo.val;
							}
						}
					}
				}
			}
			dataMappings[src].clean = true;
		}

		var first = true;
		var firstVal = true;

		for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				if(dataMappings[src].vizType == 0) {
					var flon = dataMappings[src].valFunLon1;
					var flat = dataMappings[src].valFunLat1;
					for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
						var lon = flon(i);
						var lat = flat(i);

						if(lon !== null && lat !== null) {
							unique++;
							if(first) {
								first = false;
								limits.minLat = lat;
								limits.maxLat = lat;
								limits.minLon = lon;
								limits.maxLon = lon;
							}
							else {
								limits.minLat = Math.min(limits.minLat, lat);
								limits.minLon = Math.min(limits.minLon, lon);
								limits.maxLat = Math.max(limits.maxLat, lat);
								limits.maxLon = Math.max(limits.maxLon, lon);
							}
						}
						else {
							NULLS++;
						}
					}
				}
				else if(dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5) {
					var flon1 = dataMappings[src].valFunLon1;
					var flat1 = dataMappings[src].valFunLat1;
					var flon2 = dataMappings[src].valFunLon2;
					var flat2 = dataMappings[src].valFunLat2;

					if(dataMappings[src].vizType == 5) {
						var fval = dataMappings[src].valFunVal;
					}

					for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
						var lon1 = flon1(i);
						var lat1 = flat1(i);
						var lon2 = flon2(i);
						var lat2 = flat2(i);
						var w = 1;
						if(dataMappings[src].vizType == 5) {
							w = fval(i);
						}

						if(lon1 !== null && lat1 !== null && lon2 !== null && lat2 !== null && w !== null) {
							unique++;
							if(first) {
								first = false;
								limits.minLat = Math.min(lat1, lat2);
								limits.maxLat = Math.max(lat1, lat2);
								limits.minLon = Math.min(lon1, lon2);
								limits.maxLon = Math.max(lon1, lon2);
								limits.minVal = w;
								limits.maxVal = w;
							}
							else {
								limits.minLat = Math.min(limits.minLat, lat1, lat2);
								limits.minLon = Math.min(limits.minLon, lon1, lon2);
								limits.maxLat = Math.max(limits.maxLat, lat1, lat2);
								limits.maxLon = Math.max(limits.maxLon, lon1, lon2);
								limits.minVal = Math.min(limits.minVal, w);
								limits.maxVal = Math.max(limits.maxVal, w);
							}
						}
						else {
							NULLS++;
						}
					}
				}
				else if(dataMappings[src].vizType == 2) {
					var flon = dataMappings[src].valFunLon1;
					var flat = dataMappings[src].valFunLat1;
					var fval = dataMappings[src].valFunVal;
					for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
						var lon = flon(i);
						var lat = flat(i);
						var val = fval(i);

						if(lon !== null && lat !== null && val !== null) {
							unique++;
							if(first) {
								first = false;
								limits.minLat = lat;
								limits.maxLat = lat;
								limits.minLon = lon;
								limits.maxLon = lon;
							}
							else {
								limits.minLat = Math.min(limits.minLat, lat);
								limits.minLon = Math.min(limits.minLon, lon);
								limits.maxLat = Math.max(limits.maxLat, lat);
								limits.maxLon = Math.max(limits.maxLon, lon);
							}

							if(firstVal) {
								firstVal = false;
								limits.minVal = val;
								limits.maxVal = val;
							}
							else {
								limits.minVal = Math.min(limits.minVal, val);
								limits.maxVal = Math.max(limits.maxVal, val);
							}
						}
						else {
							NULLS++;
						}
					}
				}
				else if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) {
					var flon = dataMappings[src].valFunLon;
					var flat = dataMappings[src].valFunLat;
					var f = dataMappings[src].valFun;

					for(i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
						var val = f(i);
						if(val !== null) {
							unique++;
							if(val.length < 1 || val[0].length != dataMappings[src].sizeLat || val[0][0].length != dataMappings[src].sizeLon) {
								$log.log(preDebugMsg + "Error: Sizes of 3D array and of longitude/latitude arrays do not match");
								dataIsCorrupt = true;
							}
						}
						else {
							NULLS++;
						}
					}

					var firstLon = true;
					var firstLat = true;

					for(i = 0; !dataIsCorrupt && i < dataMappings[src].sizeLat; i++) {
						var lat = flat(i);
						if(lat === null) {
							$log.log(preDebugMsg + "Error: null values not allowed in longitude/latitude arrays");
							dataIsCorrupt = true;
						}
						else {
							if(firstLat) {
								firstLat = false;
								limits.minLat = lat;
								limits.maxLat = lat;
							}
							else {
								limits.minLat = Math.min(limits.minLat, lat);
								limits.maxLat = Math.max(limits.maxLat, lat);
							}
						}
					}
					for(i = 0; !dataIsCorrupt && i < dataMappings[src].sizeLon; i++) {
						var lon = flon(i);
						if(lon === null) {
							$log.log(preDebugMsg + "Error: null values not allowed in longitude/latitude arrays");
							dataIsCorrupt = true;
						}
						else {
							if(firstLon) {
								firstLon = false;
								limits.minLon = lon;
								limits.maxLon = lon;
							}
							else {
								limits.minLon = Math.min(limits.minLon, lon);
								limits.maxLon = Math.max(limits.maxLon, lon);
							}
						}
					}
					if(!firstLon && !firstLat) {
						first = false;
					}
				}
			} // is active
		} // for all data sources

		if(unique <= 0) {
			dataIsCorrupt = true; // only null values
		}

		if(dataIsCorrupt) {
			$log.log(preDebugMsg + "data is corrupt");
			resetVars();
		}

		parsingDataNow = false;
		if(unique > 0) {
			updateGraphics();
			if(selections.length) {
				updateLocalSelections(false);
			}
			else {
				$scope.selectAll();
			}
		}
		else { // no data
			updateGraphics();
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics
	// This method updates the graphics.
	//===================================================================================
	function updateGraphics() {
		// $log.log(preDebugMsg + "updateGraphics()");
		if(currentColors === null) {
			var colors = $scope.gimme("ColorScheme");
			if(typeof colors === 'string') {
				colors = JSON.parse(colors);
			}
			currentColors = legacyDDSupLib.copyColors(colors);

			if(!currentColors) {
				currentColors = {};
			}
		}

		if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
			textColor = currentColors.skin.text;
		}
		else {
			textColor = "#000000";
		}

		if(myCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theCanvas');
			if(canvasElement.length > 0) {
				myCanvas = canvasElement[0];
			}
		}
		if(myCtx === null) {
			myCtx = myCanvas.getContext("2d");
		}
		myCtx.clearRect(0,0, myCanvas.width, myCanvas.height);

		if(uCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theUnCanvas');
			if(canvasElement.length > 0) {
				uCanvas = canvasElement[0];
			}
		}
		if(uCtx === null) {
			uCtx = uCanvas.getContext("2d");
		}
		uCtx.clearRect(0,0, uCanvas.width, uCanvas.height);
		drawData();
	}
	//===================================================================================


	//===================================================================================
	// Update Drop Zones
	// This method update the drop zones, based on mouse movement etc.
	//===================================================================================
	function updateDropZones(col, alpha, hover) {
		// update the data drop locations
		// $log.log(preDebugMsg + "update the data drop zone locations");
		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(dropCtx === null) {
			dropCtx = dropCanvas.getContext("2d");
		}

		if(!dropCtx) {
			$log.log(preDebugMsg + "no canvas to draw drop zones on");
			return;
		}

		if(dropCtx) {
			var W = dropCanvas.width;
			var H = dropCanvas.height;
			var marg1 = 20;
			if(drawW < 40) {
				marg1 = 0;
			}
			var marg2 = 20;
			if(drawH < 40) {
				marg2 = 0;
			}

			dropYpt.left = 0;
			dropYpt.top = topMarg + marg2;
			dropYpt.right = leftMarg;
			dropYpt.bottom = H - bottomMarg - marg2;

			dropYfr.left = W - rightMarg;
			dropYfr.top = topMarg + marg2;
			dropYfr.right = W;
			dropYfr.bottom = topMarg + Math.floor(drawH / 2) - 1 - marg2;

			dropYto.left = W - rightMarg;
			dropYto.top = topMarg + Math.floor(drawH / 2) + 1 + marg2;
			dropYto.right = W;
			dropYto.bottom = H - bottomMarg - marg2;

			dropXpt.left = leftMarg + marg1;
			dropXpt.top = H - bottomMarg;
			dropXpt.right = W - rightMarg - marg1;
			dropXpt.bottom = H;

			dropXfr.left = leftMarg + marg1;
			dropXfr.top = 0;
			dropXfr.right = leftMarg + Math.floor(drawW / 2) - 1 - marg1;
			dropXfr.bottom = topMarg;

			dropXto.left = leftMarg + Math.floor(drawW / 2) + 1 + marg1;
			dropXto.top = 0;
			dropXto.right = W - rightMarg - marg1;
			dropXto.bottom = topMarg;

			dropVpt.left = (leftMarg + marg1) * 2;
			dropVpt.top = (topMarg + marg2) * 2;
			dropVpt.right = leftMarg + Math.floor(drawW / 2) - 1 - marg1;
			dropVpt.bottom = topMarg + Math.floor(drawH / 2) - 1 - marg2;

			drop3D.left = (leftMarg + marg1) * 2;
			drop3D.top = topMarg + Math.floor(drawH / 2) + 1 + marg2;
			drop3D.right = leftMarg + Math.floor(drawW / 2) - 1 - marg1;
			drop3D.bottom = H - (bottomMarg + marg2) * 2;

			drop3DCells.left = leftMarg + Math.floor(drawW / 2) + 1 + marg1;
			drop3DCells.top = topMarg + Math.floor(drawH / 2) + 1 + marg2;
			drop3DCells.right = W - 2 * (rightMarg + marg1);
			drop3DCells.bottom = H - (bottomMarg + marg2) * 2;

			dropCtx.clearRect(0,0, W,H);

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
						var tw = legacyDDSupLib.getTextWidthCurrentFont(dropCtx, str);
						var labelShift = Math.floor(fontSize / 2);
						if(dropZone.rotate) {
							if(dropZone.left > W / 2) {
								dropCtx.translate(dropZone.left - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							else {
								dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							dropCtx.rotate(Math.PI/2);
						}
						else {
							if(dropZone.top < H / 2) {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
							}
							else {
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

		var rw = $scope.gimme("mapDrawingArea:width");
		if(typeof rw === 'string') {
			rw = parseFloat(rw);
		}
		if(rw < 1) {
			rw = 1;
		}

		var rh = $scope.gimme("mapDrawingArea:height");
		if(typeof rh === 'string') {
			rh = parseFloat(rh);
		}
		if(rh < 1) {
			rh = 1;
		}

		var W = rw;
		var H = rh;
		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg;

		if(mapDiv === null || mapDiv === undefined) {
			var mapDivLs = $scope.theView.parent().find("#mapDiv");
			if(mapDivLs.length > 0) {
				mapDiv = mapDivLs[0];
			}
		}
		if(mapDiv) {
			mapDiv.width = drawW;
			mapDiv.height = drawH;
			mapDiv.top = topMarg;
			mapDiv.left = leftMarg;

			if(map){
				var currentPlace = new google.maps.LatLng(mapCenterLat, mapCenterLon);
				map.panTo(currentPlace);
			}
		}

		if(map) {
			google.maps.event.trigger(map, "resize");
		}

		if(myCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theCanvas');
			if(canvasElement.length > 0) {
				myCanvas = canvasElement[0];
			}
		}

		if(myCtx === null) {
			myCtx = myCanvas.getContext("2d");
		}

		myCanvas.width = W;
		myCanvas.height = H;

		if(uCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theUnCanvas');
			if(canvasElement.length > 0) {
				uCanvas = canvasElement[0];
			}
		}
		if(uCtx === null) {
			uCtx = uCanvas.getContext("2d");
		}
		uCanvas.width = W;
		uCanvas.height = H;

		if(dropCanvas === null) {
			var canvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(canvasElement.length > 0) {
				dropCanvas = canvasElement[0];
			}
		}

		if(dropCtx === null) {
			dropCtx = dropCanvas.getContext("2d");
		}
		if(dropCanvas) {
			dropCanvas.width = W;
			dropCanvas.height = H;
		}

		// $log.log(preDebugMsg + "updateSize calls updateGraphics");
		updateGraphics();
		updateDropZones(textColor, 0.3, false);
	}
	//===================================================================================


	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(rect, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		if(unique > 0) {
			if(!keepOld) {
				clearSelections();
			}
			selections.push(rect);
			selectionRect = null;
			updateLocalSelections(false);
			saveSelectionsInSlot();
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Selection Rectangles
	// This method updates the selection rectanglle.
	//===================================================================================
	function updateSelectionRectangles() {}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	$scope.selectAll = function() {
		clearSelections();
		if(unique <= 0) {
			// nothing to do
		}
		else {
			var bounds = new google.maps.LatLngBounds();
			var p1 = new google.maps.LatLng(limits.minLat, limits.minLon);
			var p2 = new google.maps.LatLng(limits.maxLat, limits.maxLon);
			bounds.extend(p1);
			bounds.extend(p2);
			var cols = $scope.gimme("ColorScheme");
			var col = "#FFEBCD";
			var border = "#FFA500";

			if(cols && cols.hasOwnProperty("selection")) {
				if(cols.selection.hasOwnProperty("color")) {
					col = cols.selection.color;
				}
				if(cols.selection.hasOwnProperty("border")) {
					border = cols.selection.border;
				}
			}

			selectionRect = new google.maps.Rectangle({
				map: map,
				bounds: bounds,
				fillOpacity: 0.25,
				strokeWeight: 0.95,
				strokeColor: border,
				fillColor: col,
				clickable: false
			});

			selections.push(selectionRect);
			selectionRect = null;
		}
		updateLocalSelections(true);
		saveSelectionsInSlot();
	};
	//===================================================================================


	// ==============================================
	// ------- Unique Methods for this Webble -------
	// ==============================================

	//===================================================================================
	// Initialize Map API
	// This method initilize the map (GoogleMap) API.
	//===================================================================================
	function initializeMapAPI () {
		try {
			var testGoogleMapsAPIPresence = new google.maps.LatLng(mapCenterLat, mapCenterLon);
		} catch (e) {
			$timeout(function(){initializeMapAPI();}, 500);
			return;
		}

		$log.log(preDebugMsg + "initializeMapAPI");
		var currentPlace = new google.maps.LatLng(mapCenterLat, mapCenterLon);
		var mapOptions = {
			backgroundColor: "black",
			center: currentPlace,
			zoom: mapZoom
		};

		var mapDivLs = $scope.theView.parent().find("#mapDiv");
		mapDivLs.bind('mousedown', mapMouseDown);

		if(mapDivLs.length > 0) {
			mapDiv = mapDivLs[0];
		}

		map = new google.maps.Map(mapDiv, mapOptions);
		infowindow = new google.maps.InfoWindow();

		google.maps.event.addListener(map,'center_changed',function() {
			// $log.log(preDebugMsg + "center_changed");
			var currentPlace = map.getCenter();
			var newMapCenterLat = currentPlace.lat();
			var newMapCenterLon = currentPlace.lng();

			if(newMapCenterLat != mapCenterLat || newMapCenterLon != mapCenterLon) {
				mapCenterLat = newMapCenterLat;
				mapCenterLon = newMapCenterLon;
				$scope.set('MapCenterLatitude', mapCenterLat);
				$scope.set('MapCenterLongitude', mapCenterLon);

				// $log.log(preDebugMsg + "map center_changed calls updateGraphics");
				updateGraphics();
			}
		});

		google.maps.event.addListener(map,'zoom_changed',function() {
			// $log.log(preDebugMsg + "zoom_changed");
			var newMapZoom = map.getZoom();
			if(newMapZoom != mapZoom) {
				mapZoom = newMapZoom;
				$scope.set('ZoomLevel', mapZoom);

				// $log.log(preDebugMsg + "map zoom_changed calls updateGraphics");
				updateGraphics();
			}
		});

		google.maps.event.addListener(map, 'mousemove', function (e) {
			if (mouseIsDown) {
				if (selectionRect !== null) {
					var bounds = new google.maps.LatLngBounds();
					bounds.extend(mouseDownPos);
					bounds.extend(e.latLng);
					selectionRect.setBounds(bounds);
				}
				else {
					var bounds = new google.maps.LatLngBounds();
					bounds.extend(mouseDownPos);
					bounds.extend(e.latLng);
					var cols = $scope.gimme("GroupColors");
					var col = "#FFEBCD";
					var border = "#FFA500";

					if(cols && cols.hasOwnProperty("selection")) {
						if(cols.selection.hasOwnProperty("color")) {
							col = cols.selection.color;
						}
						if(cols.selection.hasOwnProperty("border")) {
							border = cols.selection.border;
						}
					}

					selectionRect = new google.maps.Rectangle({
						map: map,
						bounds: bounds,
						fillOpacity: 0.25,
						strokeWeight: 0.95,
						strokeColor: border,
						fillColor: col,
						clickable: false
					});
				}
			}
		});

		google.maps.event.addListener(map, 'mousedown', function (e) {
			mouseIsDown = true;
			mouseDownPos = e.latLng;

			if(ctrlPressed) {
				shouldClearSelections = false;
			}
			else {
				shouldClearSelections = true;
			}

			if (shiftPressed) {
				map.setOptions({
					draggable: true
				});
			}
			else {
				map.setOptions({
					draggable: false
				});
			}
		});

		google.maps.event.addListener(map, 'mouseup', function (e) {
			if(selectionRect !== null) {
				// new selection
				newSelection(selectionRect, !shouldClearSelections);
			}
			mouseIsDown = false;
		});

		google.maps.event.addListener(map, 'mouseout', function (e) {
			if(selectionRect !== null) {
				// new selection
				newSelection(selectionRect, !shouldClearSelections);
			}
			mouseIsDown = false;
		});

		updateSize();
		updateGraphics();
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status Latitude
	// This method checks and return the selection status for latitude values.
	//===================================================================================
	function mySelectionStatusLat(src, idx) {
		if(dataMappings[src].active) {
			if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) { // 3D data and lat/lon vectors
				var lat = dataMappings[src].valFunLat(idx);
				var groupId = 0;

				if(lat === null) {
					groupId = nullGroup;
				}
				else {
					for(var span = 0; span < selections.length; span++) {
						var b = selections[span].getBounds();
						var ne = b.getNorthEast();
						var sw = b.getSouthWest();
						var l1 = sw.lat();
						var l2 = ne.lat();
						if(lat >= l1 && lat <= l2) {
							groupId = span + 1;
							break;
						}
					}
				}

				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status Longitude
	// This method checks and return the selection status for longitude values.
	//===================================================================================
	function mySelectionStatusLon(src, idx) {
		if(dataMappings[src].active) {
			if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) { // 3D data and lat/lon vectors
				var lon = dataMappings[src].valFunLon(idx);
				var groupId = 0;

				if(lon === null) {
					groupId = nullGroup;
				}
				else {
					// normalize longitude
					while(lon < -180) {
						lon += 360;
					}
					while(lon > 180) {
						lon -= 360;
					}

					for(var span = 0; span < selections.length; span++) {
						var b = selections[span].getBounds();
						var ne = b.getNorthEast();
						var sw = b.getSouthWest();
						var l1 = sw.lng();
						var l2 = ne.lng();

						if(l2 < l1) { // selection crosses date line
							if((lon >= l1 && lon <= 180) || (lon >= -180 && lon <= l2)) {
								groupId = span + 1;
								break;
							}
						}
						else {
							if(lon >= l1 && lon <= l2) {
								groupId = span + 1;
								break;
							}
						}
					}
				}

				if(!grouping && groupId > 0) {
					groupId = 1;
				}
				return groupId;
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status Cells
	// This method checks and return the selection status for cells.
	//===================================================================================
	function mySelectionStatusCells(src, idx) {
		if(dataMappings[src].active) {
			if(dataMappings[src].vizType == 4) { // 3D data and lat/lon vectors
				if(dataMappings[src].size) {
					var cube = dataMappings[src].valFun(0);
					var cubeNo = 0;
					var x = 0;
					var y = 0;
					var z = 0;

					if(cube.length > 0 && cube[0].length > 0 && cube[0][0].length > 0) {
						var dimZ = cube.length;
						var dimY = cube[0].length;
						var dimX = cube[0][0].length;
						cubeNo = Math.floor(idx / dimZ / dimY / dimX);
						var rem = idx - cubeNo * dimZ * dimY * dimX;
						z = Math.floor(rem / dimY / dimX);
						rem = rem - z * dimY * dimX;
						y = Math.floor(rem / dimX);
						x = rem - dimX * y;
						var lat = dataMappings[src].valFunLat(y);
						var lon = dataMappings[src].valFunLon(x);
						var groupId = 0;

						if(lon === null || lat === null) {
							groupId = nullGroup;
						}
						else {
							// normalize longitude
							while(lon < -180) {
								lon += 360;
							}
							while(lon > 180) {
								lon -= 360;
							}

							for(var span = 0; span < selections.length; span++) {
								var b = selections[span].getBounds();
								var ne = b.getNorthEast();
								var sw = b.getSouthWest();
								var lat1 = sw.lat();
								var lat2 = ne.lat();

								if(lat >= lat1 && lat <= lat2) {
									// lat OK
									var lon1 = sw.lng();
									var lon2 = ne.lng();

									if(lon2 < lon1) { // selection crosses date line
										if((lon >= lon1 && lon <= 180) || (lon >= -180 && lon <= lon2)) {
											groupId = span + 1;
											break;
										}
									}
									else {
										if(lon >= lon1 && lon <= lon2) {
											groupId = span + 1;
											break;
										}
									}
								}
							}
						}

						if(!grouping && groupId > 0) {
							groupId = 1;
						}
						return groupId;
					}
				}
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not original to us. It was very slightly modified by Jonas.
	// Draws a colored line by connecting two points using a DDA algorithm
	// (Digital Differential Analyzer).
	//===================================================================================
	function drawLineDDA(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth, lineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);

		// Distance start and end point
		var dx = x2 - x1 + 1;
		var dy = y2 - y1 + 1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		var fatX = true;
		if (lenx > len) {
			len = lenx;
			fatX = false;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				var ry = Math.round(y);
				var rx = Math.round(x);

				for(var w = 0; w < lineWidth; w++) {
					if(ry >= topMarg && ry < H && rx >= leftMarg && rx < W) {
						var offset = (ry * ALW + rx) * 4;
						legacyDDSupLib.blendRGBAs(r,g,b,alpha, offset, pixels);
					}
					if(fatX) {
						rx++;
					}
					else {
						ry++;
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA Full Alpha
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not original to us. It was very slightly modified by Jonas.
	// Draws a colored line by connecting two points using a DDA algorithm
	// (with full alpha) (Digital Differential Analyzer).
	//===================================================================================
	function drawLineDDAfullalpha(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth, lineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);

		// Distance start and end point
		var dx = x2 - x1 + 1;
		var dy = y2 - y1 + 1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		var fatX = true;
		if (lenx > len) {
			len = lenx;
			fatX = false;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				var ry = Math.round(y);
				var rx = Math.round(x);

				for(var w = 0; w < lineWidth; w++) {
					if(ry >= topMarg && ry < H && rx >= leftMarg && rx < W) {
						var offset = (ry * ALW + rx) * 4;
						pixels[offset] = r;
						pixels[offset+1] = g;
						pixels[offset+2] = b;
						pixels[offset+3] = alpha;
					}
					if(fatX) {
						rx++;
					}
					else {
						ry++;
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Put Pixel
	// This method puts (draws) a pixel on top of the map at specific point.
	//===================================================================================
	function putPixel(X, Y, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var x = Math.round(X);
		var y = Math.round(Y);
		var startPixelIdx = (y * ALW + x) * 4;

		if (x >= leftMarg && x < W) {
			if(y >= topMarg && y < H) {
				legacyDDSupLib.blendRGBAs(r,g,b, alpha, startPixelIdx, pixels);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Put Pixel Full Alpha
	// This method puts (draws) a pixel on top of the map at specific point
	// (with full Alpha).
	//===================================================================================
	function putPixelFullAlpha(X, Y, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var x = Math.round(X);
		var y = Math.round(Y);
		var startPixelIdx = (y * ALW + x) * 4;

		if (x >= leftMarg && x < W) {
			if(y >= topMarg && y < H) {
				pixels[startPixelIdx] = r;
				pixels[startPixelIdx + 1] = g;
				pixels[startPixelIdx + 2] = b;
				pixels[startPixelIdx + 3] = alpha;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Fill Rectangle
	// This method draws a filled rectangle on top of the map at specific point.
	//===================================================================================
	function fillRect(X1, Y1, X2, Y2, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var xpos = Math.round(X1);
		var ypos = Math.round(Y1);
		var xend = Math.round(X2);
		var yend = Math.round(Y2);
		for (var x = xpos; x <= xend; x++) {
			if (x >= leftMarg && x < W) {
				for (var y = ypos; y <= yend; y++) {
					if(y >= topMarg && y < H) {
						var offset = (y * ALW + x) * 4;
						legacyDDSupLib.blendRGBAs(r,g,b, alpha, offset, pixels);
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Fill Rectangle Full Alpha
	// This method draws a filled rectangle on top of the map at specific point
	// (with full alpha).
	//===================================================================================
	function fillRectFullAlpha(X1, Y1, X2, Y2, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var xpos = Math.round(X1);
		var ypos = Math.round(Y1);
		var xend = Math.round(X2);
		var yend = Math.round(Y2);

		for (var x = xpos; x <= xend; x++) {
			if (x >= leftMarg && x < W) {
				for (var y = ypos; y <= yend; y++) {
					if(y >= topMarg && y < H) {
						var offset = (y * ALW + x) * 4;
						pixels[offset] = r;
						pixels[offset + 1] = g;
						pixels[offset + 2] = b;
						pixels[offset + 3] = alpha;
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot
	// This method draws a dot on top of the map at specific point.
	//===================================================================================
	function drawDot(X, Y, DOTSIZE, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * ALW + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= leftMarg && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= topMarg && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * ALW + x) * 4;
							legacyDDSupLib.blendRGBAs(r,g,b, alpha, startPixelIdx + offset, pixels);
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot Full Alpha
	// This method draws a dot on top of the map at specific point (with full alpha).
	//===================================================================================
	function drawDotfullalpha(X, Y, DOTSIZE, alpha, r, g, b, pixels, ArrayLineWidth) {
		var W = Math.floor(leftMarg + drawW);
		var H = Math.floor(topMarg + drawH);
		var ALW = Math.floor(ArrayLineWidth);
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * ALW + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= leftMarg && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= topMarg && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * ALW + x) * 4;
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
	//===================================================================================


	//===================================================================================
	// Draw Cartesian Plot
	// This method draws a cartesian plot on top of the map.
	//===================================================================================
	function drawCartesianPlot(src) {
		if(unique <= 0 || parsingDataNow) {
			return;
		}

		if(mapDiv === null) {
			$log.log(preDebugMsg + "no mapDiv to draw on");
			return;
		}

		if(!map) {
			$log.log(preDebugMsg + "map not loaded yet");
			return;
		}

		// $log.log(preDebugMsg + "draw!");
		currentColors = $scope.gimme("ColorScheme");
		if(typeof currentColors === 'string') {
			currentColors = JSON.parse(currentColors);
		}

		var scale = Math.pow(2, mapZoom);
		try {
			var mapBounds = map.getBounds();
			var mapNE = mapBounds.getNorthEast();
			var mapSW = mapBounds.getSouthWest();
			var proj = map.getProjection();
			var NEpx = proj.fromLatLngToPoint(mapNE);
			var SWpx = proj.fromLatLngToPoint(mapSW);
			var NSpxs = SWpx.y * scale - NEpx.y * scale; // subtracting small numbers gives loss of precision?
			var WEpxs = NEpx.x * scale - SWpx.x * scale;
			var mapMinLat = mapSW.lat();
			var mapMaxLat = mapNE.lat();
			var mapMinLon = mapSW.lng();
			var mapMaxLon = mapNE.lng();
			var passDateLine = false;
			if(mapMinLon > mapMaxLon) {
				passDateLine = true;
			}

			var worldWidth = 256 * scale;
			var mapWorldWraps = false;
			if(drawW > worldWidth) {
				mapWorldWraps = true;
			}
			var currentPlace = map.getCenter();
			var pCenter = proj.fromLatLngToPoint(currentPlace);
		} catch(e) {
			$log.log(preDebugMsg + "No map to draw on yet");
			$timeout(function(){updateSize(); updateGraphics();});
			return;
		}

		var col;
		var fill;
		var zeroTransp = 0.33;
		if(transparency < 1) {
			zeroTransp *= transparency;
		}

		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var rgbaText = hexColorToRGBAvec(textColor, 1.0);
			var imData = myCtx.getImageData(0, 0, myCanvas.width, myCanvas.height);
			var imData0 = uCtx.getImageData(0, 0, uCanvas.width, uCanvas.height);
			var pixels = imData.data;
			var pixels0 = imData0.data;
		}
		else {
			var col0 = hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var fill0 = legacyDDSupLib.getGradientColorForGroup(0,0,0,drawW,drawH, zeroTransp, uCanvas, uCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
		}

		if(dataMappings[src].active) {
			var fsel = dataMappings[src].selFun;
			var size = dataMappings[src].size;

			if(dataMappings[src].vizType == 0) { // points
				var flat1 = dataMappings[src].valFunLat1;
				var flon1 = dataMappings[src].valFunLon1;

				for(var i = 0; i < size; i++) {
					var lon1 = flon1(i);
					var lat1 = flat1(i);

					if(lon1 !== null && lat1 !== null) {
						var groupId = fsel(i);
						var p1 = new google.maps.LatLng(lat1, lon1);
						if(mapBounds.contains(p1)) {
							var p1px = proj.fromLatLngToPoint(p1);

							var x1 = leftMarg + Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
							var y1 = topMarg + (p1px.y * scale - NEpx.y * scale);

							var offset = 0;
							while(x1 + offset <= leftMarg + drawW) {
								if(drawPretty) {
									if(groupId == 0) {
										if(!useGlobalGradients) {
											fill = legacyDDSupLib.getGradientColorForGroup(0, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, zeroTransp, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										else {
											fill = fill0;
										}

										uCtx.save();
										uCtx.beginPath();
										uCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
										uCtx.fillStyle = fill;
										uCtx.fill();
										uCtx.lineWidth = 1;
										uCtx.strokeStyle = col;
										uCtx.stroke();
										uCtx.restore();
									}
									else {
										if(transparency >= 1) {
											fill = legacyDDSupLib.getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, 1, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										else {
											fill = legacyDDSupLib.getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, transparency, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										myCtx.save();
										myCtx.beginPath();
										myCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
										myCtx.fillStyle = fill;
										myCtx.fill();
										myCtx.lineWidth = 1;
										myCtx.strokeStyle = col;
										myCtx.stroke();
										myCtx.restore();
									}
								}
								else { // drawPretty is false
									if(groupId == 0) {
										drawDotfullalpha(x1 + offset, y1, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], pixels0, uCanvas.width);
									}
									else {
										if(transparency >= 1) {
											rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), 1);
											drawDotfullalpha(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
										}
										else {
											rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
											drawDot(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
										}
									}
								}
								offset += worldWidth;
							}

							offset = -worldWidth;
							while(x1 + offset >= leftMarg) {
								if(drawPretty) {
									if(groupId == 0) {
										if(!useGlobalGradients) {
											fill = legacyDDSupLib.getGradientColorForGroup(0, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, zeroTransp, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										else {
											fill = fill0;
										}
										uCtx.save();
										uCtx.beginPath();
										uCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
										uCtx.fillStyle = fill;
										uCtx.fill();
										uCtx.lineWidth = 1;
										uCtx.strokeStyle = col;
										uCtx.stroke();
										uCtx.restore();
									}
									else {
										if(transparency >= 1) {
											fill = legacyDDSupLib.getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, 1, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										else {
											fill = legacyDDSupLib.getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, transparency, myCanvas, myCtx, useGlobalGradients, $scope.theView.parent().find('#theCanvas'), colorPalette, currentColors);
										}
										myCtx.save();
										myCtx.beginPath();
										myCtx.arc(x1 + offset, y1, dotSize, 0, 2 * Math.PI, false);
										myCtx.fillStyle = fill;
										myCtx.fill();
										myCtx.lineWidth = 1;
										myCtx.strokeStyle = col;
										myCtx.stroke();
										myCtx.restore();
									}
								}
								else { // drawPretty is false
									if(groupId == 0) {
										drawDotfullalpha(x1 + offset, y1, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], pixels0, uCanvas.width);
									}
									else {
										if(transparency >= 1) {
											rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), 1);
											drawDotfullalpha(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
										}
										else {
											rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
											drawDot(x1 + offset, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
										}
									}
								}
								offset -= worldWidth;
							}
						}
					}
				}
			}
			else if(dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5) { // lines
				var flat1 = dataMappings[src].valFunLat1;
				var flon1 = dataMappings[src].valFunLon1;
				var flat2 = dataMappings[src].valFunLat2;
				var flon2 = dataMappings[src].valFunLon2;
				var fval = null;
				if(dataMappings[src].vizType == 5) {
					fval = dataMappings[src].valFunVal;

					if(limits.minVal == limits.maxVal) {
						limits.minVal = 0;
						if(limits.maxVal < 0) {
							limits.minVal = limits.maxVal;
							limits.maxVal = 0;
						}
					}
				}

				for(var i = 0; i < size; i++) {
					var lon1 = flon1(i);
					var lat1 = flat1(i);
					var lon2 = flon2(i);
					var lat2 = flat2(i);
					var w = 1;
					if(fval !== null) {
						w = fval(i);
					}

					if(lon1 !== null && lat1 !== null && lon2 !== null && lat2 !== null && w !== null) {
						var groupId = fsel(i);
						var bounds = new google.maps.LatLngBounds();
						var p1 = new google.maps.LatLng(lat1, lon1);
						var p2 = new google.maps.LatLng(lat2, lon2);
						bounds.extend(p1);
						bounds.extend(p2);

						if(bounds.intersects(mapBounds)) {
							var p1px = proj.fromLatLngToPoint(p1);
							var p2px = proj.fromLatLngToPoint(p2);

							if(true || mapWorldWraps) {
								var x1 = leftMarg + Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
								var x2 = leftMarg + Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
							}
							else {
								if(passDateLine && (lon1[i] > 180)) {
									var x1 = Math.floor(leftMarg + drawW - (NEpx.x * scale - p1px.x * scale));
								}
								else {
									var x1 = leftMarg + Math.floor(p1px.x * scale - SWpx.x * scale);
								}
								if(passDateLine && (lon2[i] > 180)) {
									var x2 = Math.floor(leftMarg + drawW - (NEpx.x * scale - p2px.x * scale));
								}
								else {
									var x2 = leftMarg + Math.floor(p2px.x * scale - SWpx.x * scale);
								}
							}

							var y1 = topMarg + (p1px.y * scale - NEpx.y * scale);
							var y2 = topMarg + (p2px.y * scale - NEpx.y * scale);
							var lw = lineWidth;
							var op = 1;

							if(fval !== null) {
								if(lineMod == 0 || lineMod == 2) {
									lw = 1 + lineWidth * Math.log(1+(w - limits.minVal)) / Math.log(1+(limits.maxVal - limits.minVal));
								}
								if(lineMod == 1 || lineMod == 2) {
									op = Math.log(1+(w - limits.minVal)) / Math.log(1+(limits.maxVal - limits.minVal));
								}
							}

							var offset = 0;
							while(x1 + offset <= leftMarg + drawW || x2 + offset <= leftMarg + drawW) {
								if(drawPretty) {
									if(groupId == 0) {
										col = col0;
										var temp = col0[3];
										col[3] *= op;
										uCtx.save();
										uCtx.beginPath();
										uCtx.strokeStyle = col;
										uCtx.lineWidth = lw;
										uCtx.moveTo(x1 + offset, y1);
										uCtx.lineTo(x2 + offset, y2);
										uCtx.stroke();
										uCtx.restore();
										col0[3] = temp;
									}
									else {
										col = hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), op * transparency);
										myCtx.save();
										myCtx.beginPath();
										myCtx.strokeStyle = col;
										myCtx.lineWidth = lw;
										myCtx.moveTo(x1 + offset, y1);
										myCtx.lineTo(x2 + offset, y2);
										myCtx.stroke();
										myCtx.restore();
									}
								}
								else {
									if(groupId == 0) {
										col = rgba0;
										// TODO: now we redraw with full alpha (ignoring previously drawn unselected data), maybe we should use alpha?
										// TODO: That makes everything slower, but it also makes places with lots of unselected data very very gray.
										drawLineDDA(pixels0, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], Math.ceil(col[3] * op), uCanvas.width, lw);
									}
									else {
										col = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), op * transparency);
										if(col[3] >= 255) {
											drawLineDDAfullalpha(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width, lw);
										}
										else {
											drawLineDDA(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width, lw);
										}
									}
								}
								offset += worldWidth;
							}

							offset = -worldWidth;
							while(x1 + offset >= leftMarg || x2 + offset >= leftMarg) {
								if(drawPretty) {
									if(groupId == 0) {
										col = col0;
										var temp = col0[3];
										col[3] *= op;
										uCtx.save();
										uCtx.beginPath();
										uCtx.strokeStyle = col;
										uCtx.lineWidth = lw;
										uCtx.moveTo(x1 + offset, y1);
										uCtx.lineTo(x2 + offset, y2);
										uCtx.stroke();
										uCtx.restore();
										col0[3] = temp;
									}
									else {
										col = hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), op*transparency);
										myCtx.save();
										myCtx.beginPath();
										myCtx.strokeStyle = col;
										myCtx.lineWidth = lw;
										myCtx.moveTo(x1 + offset, y1);
										myCtx.lineTo(x2 + offset, y2);
										myCtx.stroke();
										myCtx.restore();
									}
								}
								else {
									if(groupId == 0) {
										col = rgba0;
										drawLineDDA(pixels0, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], Math.ceil(col[3] * op), uCanvas.width);

									}
									else {
										col = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), op * transparency);
										if(col[3] >= 255) {
											drawLineDDAfullalpha(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width, lw);
										}
										else {
											drawLineDDA(pixels, x1 + offset, y1, x2 + offset, y2, col[0], col[1], col[2], col[3], myCanvas.width, lw);
										}
									}
								}
								offset -= worldWidth;
							}
						}
					}
				}
			}
		}

		if(!drawPretty) {
			// if we do not use timeout here, sometimes only one of the canvases redraw properly (for example when resizing)
			$timeout(function() {
				uCtx.putImageData(imData0, 0, 0);
			}, 1);
			$timeout(function() {
				myCtx.putImageData(imData, 0, 0);
			}, 1);
		}
	}
	//===================================================================================


	//===================================================================================
	// Gamma Exp
	// This method returns the exponent gamma value
	//===================================================================================
	function gammaExp(c) {
		if(c <= 0.04045) {
			return c / 12.92;
		}
		return Math.pow((c + 0.055) / 1.055, 2.4);
	}
	//===================================================================================


	//===================================================================================
	// Color to Gray Scale RGB
	// This method converts a RGB color value to a gray scale value.
	//===================================================================================
	function colorToGrayscaleRGB(r,g,b) {
		var rg = gammaExp(r);
		var gg = gammaExp(g);
		var bg = gammaExp(b);
		var yg = 0.2124*rg + 0.7152*gg + 0.0722*bg;

		if(yg <= 0.0031308) {
			return 12.92 * yg;
		}
		return 1.055 * Math.pow(yg, 1/2.4) - 0.055;
	}
	//===================================================================================


	//===================================================================================
	// Color to Gray Scale
	// This method converts a color vector value to a gray scale value.
	//===================================================================================
	function colorToGrayscale(vec) {
		var gray = Math.floor(colorToGrayscaleRGB(vec[0], vec[1], vec[2]));
		var res = [gray, gray, gray, vec[3]];
		return res;
	}
	//===================================================================================


	//===================================================================================
	// Draw Heat Map
	// This method draws a heat map on top of the map.
	//===================================================================================
	function drawHeatmap(src) {
		if(unique <= 0 || parsingDataNow) {
			return;
		}

		if(mapDiv === null) {
			$log.log(preDebugMsg + "no mapDiv to draw on");
			return;
		}

		if(!map) {
			$log.log(preDebugMsg + "map not loaded yet");
			return;
		}

		$log.log(preDebugMsg + "drawHeatmap");

		currentColors = $scope.gimme("ColorScheme");
		if(typeof currentColors === 'string') {
			currentColors = JSON.parse(currentColors);
		}

		var scale = Math.pow(2, mapZoom);
		try {
			var mapBounds = map.getBounds();
			var mapNE = mapBounds.getNorthEast();
			var mapSW = mapBounds.getSouthWest();
			var proj = map.getProjection();
			var NEpx = proj.fromLatLngToPoint(mapNE);
			var SWpx = proj.fromLatLngToPoint(mapSW);
			var mapMinLat = mapSW.lat();
			var mapMaxLat = mapNE.lat();
			var mapMinLon = mapSW.lng();
			var mapMaxLon = mapNE.lng();
			var passDateLine = false;
			if(mapMinLon > mapMaxLon) {
				passDateLine = true;
			}

			var worldWidth = 256 * scale;
			var mapWorldWraps = false;
			if(drawW > worldWidth) {
				mapWorldWraps = true;
			}

			var currentPlace = map.getCenter();
			var pCenter = proj.fromLatLngToPoint(currentPlace);
			var NSpxs = SWpx.y * scale - NEpx.y * scale; // subtracting small numbers gives loss of precision?
			var WEpxs = NEpx.x * scale - SWpx.x * scale;
		} catch(e) {
			$log.log(preDebugMsg + "No map to draw on yet");
			$timeout(function(){updateSize(); updateGraphics();});
			return;
		}

		var col;
		var fill;
		var zeroTransp = 0.3;
		if(transparency < 1) {
			zeroTransp *= transparency;
		}
		var zeroTranspAlpha = Math.floor(255*zeroTransp);
		var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
		var rgbaText = hexColorToRGBAvec(textColor, 1.0);
		var imData = myCtx.getImageData(0, 0, myCanvas.width, myCanvas.height);
		var pixels = imData.data;
		var valSpan = (limits.maxVal - limits.minVal);
		var latPerPixel = (mapNE.lat() - mapSW.lat()) / myCanvas.height;
		var lonPerPixel = (mapNE.lng() - mapSW.lng()) / myCanvas.width;
		var selectionsOnScreen = [];
		var atLeastOneSelectionOnScreen = false;
		for(var span = 0; span < selections.length; span++) {
			var selBounds = selections[span].getBounds();

			if(selBounds.intersects(mapBounds)) {
				atLeastOneSelectionOnScreen = true;
				var selSW = selBounds.getSouthWest();
				var selNE = selBounds.getNorthEast();
				var selMinLat = selSW.lat();
				var selMaxLat = selNE.lat();
				var selMinLon = selSW.lng();
				var selMaxLon = selNE.lng();

				while(selMinLon < -180) {
					selMinLon += 360;
				}
				while(selMinLon > 180) {
					selMinLon -= 360;
				}

				while(selMaxLon < -180) {
					selMaxLon += 360;
				}
				while(selMaxLon > 180) {
					selMaxLon -= 360;
				}

				var splitSelInTwo = false;
				if(mapMaxLon < mapMinLon) {
					if(selMaxLon < selMinLon) {
						// map crosses dateline, so does selection
						selMinLon = Math.max(selMinLon, mapMinLon);
						selMaxLon = Math.min(selMaxLon, mapMaxLon);
						splitSelInTwo = true;
					}
					else {
						// map crosses dateline, selection does not check which side of the dateline we are on
						if(selMinLon > mapMaxLon) { // we are to the west of the dateline
							selMinLon = Math.max(selMinLon, mapMinLon);
						}
						else {
							selMaxLon = Math.min(selMaxLon, mapMaxLon);
						}
					}
				}
				else {
					if(selMaxLon < selMinLon) {
						// only selection crosses dateline check which side of the dateline the map is on
						if(selMinLon > mapMaxLon) {
							selMinLon = -180;
						}
						else {
							selMaxLon = 180;
						}
					}
					else {
						// neither crosses dateline, simplest case
						selMinLon = Math.max(selMinLon, mapMinLon);
						selMaxLon = Math.min(selMaxLon, mapMaxLon);
					}
				}

				selMinLat = Math.max(selMinLat, mapMinLat);
				selMaxLat = Math.min(selMaxLat, mapMaxLat);
				var p1 = new google.maps.LatLng(selMinLat, selMinLon);
				var p2 = new google.maps.LatLng(selMaxLat, selMaxLon);
				var p1px = proj.fromLatLngToPoint(p1);
				var p2px = proj.fromLatLngToPoint(p2);

				if(mapWorldWraps) {
					var x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
					while(x1 < 0) {
						x1 += worldWidth;
					}
					var x2 = Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
					while(x2 < 0) {
						x2 += worldWidth;
					}
				}
				else {
					if(selMinLon > 180) {
						var x1 = Math.floor(drawW - NEpx.x * scale + p1px.x * scale);
					}
					else {
						var x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
					}

					if(selMaxLon > 180) {
						var x2 = Math.floor(drawW - NEpx.x * scale + p2px.x * scale);
					}
					else {
						var x2 = Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
					}
				}
				var y1 = Math.floor(p1px.y * scale - NEpx.y * scale); // add topMarg later
				y1 = Math.max(0, Math.min(drawH, y1));
				var y2 = Math.floor(p2px.y * scale - NEpx.y * scale); // add topMarg later
				y2 = Math.max(0, Math.min(drawH, y2));

				if(splitSelInTwo) {
					selectionsOnScreen.push([x1, y2, drawW, y1]); // flip y-axis
					selectionsOnScreen.push([0, y2, x2, y1]); // flip y-axis
				}
				else {
					selectionsOnScreen.push([x1, y2, x2, y1]); // flip y-axis
				}
			}
		}

		if(atLeastOneSelectionOnScreen) { // if no selections are in the visible area, there will be nothing to draw
			if(dataMappings[src].active && dataMappings[src].vizType == 2) { // 2D data with values, heatmap
				var fsel = dataMappings[src].selFun;
				var size = dataMappings[src].size;
				var flat1 = dataMappings[src].valFunLat1;
				var flon1 = dataMappings[src].valFunLon1;
				var fval = dataMappings[src].valFunVal;
				var voteMatrix = [];
				for(var j = 0; j <= drawH; j++) {
					voteMatrix.push([]);
					for(var i = 0; i <= drawW; i++) {
						voteMatrix[j].push([]);
					}
				}

				for(var i = 0; i < size; i++) {
					var lon1 = flon1(i);
					var lat1 = flat1(i);
					var v = fval(i);

					if(lon1 !== null && lat1 !== null && v !== null) {
						var inside = false;

						if(mapWorldWraps) {
							inside = true;
						}
						else {
							var latInside = false;
							if((mapMinLat <= lat1 && mapMaxLat >= lat1) || (Math.abs(lat1 - mapMinLat) <= limits.minLatDiff || Math.abs(lat1 - mapMaxLat) <= limits.minLatDiff)) {
								latInside = true;
							}

							var lonInside = false;
							var normalizedLon = lon1; // Google Maps API wants longitudes to be in -180 to 180, some data sets are in 0 to 360
							while(normalizedLon < -180) {
								normalizedLon += 360;
							}
							while(normalizedLon > 180) {
								normalizedLon -= 360;
							}

							if((!passDateLine && mapMinLon <= normalizedLon && mapMaxLon >= normalizedLon) || (passDateLine && (mapMinLon <= normalizedLon || mapMaxLon >= normalizedLon)) || (Math.abs(lon1 - mapMinLon) <= limits.minLonDiff || Math.abs(lon1 - mapMaxLon) <= limits.minLonDiff)) {
								lonInside = true;
							}

							if(latInside && lonInside) {
								inside = true;
							}
						}

						// TODO: when really zoomed in, we should probably use one cell outside in each direction too, since parts of these cells should also be drawn

						if(inside) {
							var p1 = new google.maps.LatLng(lat1, lon1);
							var p1b = new google.maps.LatLng(lat1, normalizedLon);
							var p1px = proj.fromLatLngToPoint(p1);

							if(mapWorldWraps) {
								x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
								while(x1 < 0) {
									x1 += worldWidth;
								}
							}
							else {
								if(lon1 > 180) {
									x1 = Math.floor(drawW - NEpx.x * scale + p1px.x * scale);
								}
								else {
									x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
								}
							}

							if(x1 >= 0 && x1 <= drawW) {
								// add leftMarg later
								var y1 = Math.floor(p1px.y * scale - NEpx.y * scale); // add topMarg later
								y1 = Math.max(0, Math.min(drawH, y1));
								var groupId = fsel(i);
								var found = false;
								for(var g = 0; g < voteMatrix[y1][x1].length; g++) {
									if(voteMatrix[y1][x1][g][0] == groupId) {
										found = true;
										switch(map3Dto2D) {
											case 0: // min
												voteMatrix[y1][x1][g][1] = Math.min(voteMatrix[y1][x1][g][1], v);
												break;
											case 1: // max
												voteMatrix[y1][x1][g][1] = Math.max(voteMatrix[y1][x1][g][1], v);
												break;
											case 2: // mean
												voteMatrix[y1][x1][g][1] += v;
												break;
											default: // mean
												voteMatrix[y1][x1][g][1] += v;
												break;
										}
										voteMatrix[y1][x1][g][2] += 1;
										break;
									}
								}
								if(!found) {
									voteMatrix[y1][x1].push([groupId, v, 1]);
								}
							}
						} // if inside drawing area
					} // if not null
				} // for each data value

				var allValues = [];
				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0) {
							var winner = 0;
							var best = voteMatrix[j][i][0][2];
							for(var w = 1; w < voteMatrix[j][i].length; w++) {
								if(voteMatrix[j][i][w][2] > best) {
									best = voteMatrix[j][i][w][2]; // group with most votes get to draw
									winner = w;
								}
							}

							if(voteMatrix[j][i][winner][0] == 0) { // if unselected wins and there are other options, use the second highest
								var first = true;
								var winner = 0;
								var best = voteMatrix[j][i][0][2];
								for(var w = 0; w < voteMatrix[j][i].length; w++) {
									if(voteMatrix[j][i][w][0] > 0) {
										if(first || voteMatrix[j][i][w][2] > best) {
											best = voteMatrix[j][i][w][2]; // group with most votes get to draw
											winner = w;
											first = false;
										}
									}
								}
							}

							// winning group draws average score
							var av = 0;
							switch(map3Dto2D) {
								case 0: // min
									av = voteMatrix[j][i][winner][1];
									break;
								case 1: // max
									av = voteMatrix[j][i][winner][1];
									break;
								case 2: // mean
									av = voteMatrix[j][i][winner][1] / voteMatrix[j][i][winner][2];
									break;
								default: // mean
									av = voteMatrix[j][i][winner][1] / voteMatrix[j][i][winner][2];
									break;
							}
							if(colorMethod == 1 || colorMethod == 3) { // using histograms
								allValues.push(av);
							}
							else if(colorMethod == 0 || colorMethod == 2 || colorMethod == 6 || colorMethod == 7 || colorMethod == 4 || colorMethod == 5 ) { // using min/max (the colorKey may also need min/max values)
								if(allValues.length == 0) {
									allValues.push(av);
									allValues.push(av);
								}
								else {
									allValues[0] = Math.min(av, allValues[0]);
									allValues[1] = Math.max(av, allValues[1]);
								}
							}
							voteMatrix[j][i] = [av, voteMatrix[j][i][winner][0]]; // data value, groupId
						}
					}
				}

				if(colorMethod == 1 || colorMethod == 3) { // using histograms
					allValues.sort(function(a, b){return a-b});
					var allValuesUnique = [allValues[0]];
					var lastVal = allValues[0];
					for(var v = 1; v < allValues.length; v++) {
						if(allValues[v] != lastVal) {
							lastVal = allValues[v];
							allValuesUnique.push(allValues[v]);
						}
					}
					allValues = allValuesUnique;
				}

				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0) {
							voteMatrix[j][i] = [groupAndValTo3Dcolor(voteMatrix[j][i][0], voteMatrix[j][i][1], allValues)]; // groupAndValTo3Dcolor(data value, groupId, vector with values)
						}
						else {
							voteMatrix[j][i] = []; // points on screen not corresponding to data points
						}
					}
				}

				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0 && voteMatrix[j][i][0] !== null) { // why are there null here??
							// find how far to the left, right, top, bottom we should go from here before another cell with data is found

							// this breaks for diagonal stuff, we assume neighboring cell is in same column or row
							var sameColor = true;
							var myColor = voteMatrix[j][i][0];
							var leftmostInSelection = false;
							var leftmostOnScreen = true;
							for(var left = i - 1; left >= 0; left--) {
								if(voteMatrix[j][left].length > 0) {
									leftmostOnScreen = false;
									leftmostInSelection = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[j][left][0] === null /*why are there null here??*/ || voteMatrix[j][left][0][0] != myColor[0] || voteMatrix[j][left][0][1] != myColor[1] || voteMatrix[j][left][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
							}

							var rightmostInSelection = false;
							var rightmostOnScreen = true;
							for(var right = i + 1; right < drawW; right++) {
								if(voteMatrix[j][right].length > 0) {
									rightmostInSelection = false;
									rightmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[j][right][0] === null || voteMatrix[j][right][0][0] != myColor[0] || voteMatrix[j][right][0][1] != myColor[1] || voteMatrix[j][right][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
							}

							var topmostInSelection = false;
							var topmostOnScreen = true;
							for(var top = j - 1; top >= 0; top--) {
								if(voteMatrix[top][i].length > 0) {
									topmostInSelection = false;
									topmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[top][i][0] === null || voteMatrix[top][i][0][0] != myColor[0] || voteMatrix[top][i][0][1] != myColor[1] || voteMatrix[top][i][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
							}

							var botmostInSelection = false;
							var botmostOnScreen = true;
							for(var bot = j + 1; bot < drawH; bot++) {
								if(voteMatrix[bot][i].length > 0) {
									botmostInSelection = false;
									botmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[bot][i][0] === null || voteMatrix[bot][i][0][0] != myColor[0] || voteMatrix[bot][i][0][1] != myColor[1] || voteMatrix[bot][i][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
							}

							var x1 = Math.floor((i + left) / 2 + 1);
							var x2 = Math.floor((i + right) / 2);

							// TODO: this part is broken when the map has wrapped around and we are off a few world spins to the left or right.

							if(leftmostInSelection) {
								x1 = i;
							}
							else if(leftmostOnScreen && rightmostOnScreen) {
								x1 = left;
								x2 = right;
								sameColor = false;
							}
							else if(leftmostOnScreen) {
								x1 = i;
								sameColor = false;
							}
							else {
								Math.floor((i + left) / 2 + 1);
							}

							if(rightmostInSelection) {
								x2 = i;
							}
							else if(rightmostOnScreen && leftmostOnScreen) {
								x2 = right;
								sameColor = false;
							}
							else if(rightmostOnScreen) {
								x2 = i;

								sameColor = false;
							} else {
								x2 = Math.floor((i + right) / 2);
							}

							var y1 = Math.floor((j + top) / 2 + 1);
							var y2 = Math.floor((j + bot) / 2);

							if(topmostInSelection) {
								y1 = j;
							}
							else if(topmostOnScreen && botmostOnScreen) {
								y1 = top;
								y2 = bot;
								sameColor = false;
							}
							else if(topmostOnScreen) {
								y1 = j;
								sameColor = false;
							}
							else {
								y1 = Math.floor((j + top) / 2 + 1);
							}

							if(botmostInSelection) {
								y2 = j;
							}
							else if(botmostOnScreen && topmostOnScreen) {
								y2 = bot;
								sameColor = false;
							}
							else if(botmostOnScreen) {
								y2 = j;
								sameColor = false;
							}
							else {
								y2 = Math.floor((j + bot) / 2);
							}

							if(!(colorMethod == 5 || colorMethod == 7)) { // not drawing curves
								sameColor = false;
							}

							if(!sameColor) { // we should draw this cell
								var rgba = voteMatrix[j][i][0];
								x1 += leftMarg;
								x2 += leftMarg;
								y1 += topMarg;
								y2 += topMarg;

								while(x2 < leftMarg) {
									x1 += worldWidth;
									x2 += worldWidth;
								}
								while(x1 > leftMarg + drawW) {
									x1 -= worldWidth;
									x2 -= worldWidth;
								}

								var offset = 0;
								while(x2 + offset > leftMarg && x1 + offset < leftMarg + drawW) {
									fillRect(x1 + offset,y1, x2 + offset,y2, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
									offset += worldWidth;
								}

								offset = -worldWidth;
								while(x2 + offset > leftMarg && x1 + offset < leftMarg + drawW) {
									fillRect(x1 + offset,y1, x2 + offset,y2, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
									offset -= worldWidth;
								}
							}
						}
					}
				}
			} // if src is correct type
		} // if there is at least one selection rectangle overlapping the visible area

		$timeout(function() {
			myCtx.putImageData(imData, 0, 0);
		}, 1);
	}
	//===================================================================================


	//===================================================================================
	// Draw 3D
	// This method draws 3D on top of the map.
	//===================================================================================
	function draw3D(src) {
		if(unique <= 0 || parsingDataNow) {
			return;
		}

		if(mapDiv === null) {
			$log.log(preDebugMsg + "no mapDiv to draw on");
			return;
		}

		if(!map) {
			$log.log(preDebugMsg + "map not loaded yet");
			return;
		}

		$log.log(preDebugMsg + "draw3D");

		currentColors = $scope.gimme("ColorScheme");
		if(typeof currentColors === 'string') {
			currentColors = JSON.parse(currentColors);
		}

		var scale = Math.pow(2, mapZoom);
		try {
			var mapBounds = map.getBounds();
			var mapNE = mapBounds.getNorthEast();
			var mapSW = mapBounds.getSouthWest();
			var proj = map.getProjection();
			var NEpx = proj.fromLatLngToPoint(mapNE);
			var SWpx = proj.fromLatLngToPoint(mapSW);
			var mapMinLat = mapSW.lat();
			var mapMaxLat = mapNE.lat();
			var mapMinLon = mapSW.lng();
			var mapMaxLon = mapNE.lng();
			var passDateLine = false;
			if(mapMinLon > mapMaxLon) {
				passDateLine = true;
			}

			var worldWidth = 256 * scale;
			var mapWorldWraps = false;
			if(drawW > worldWidth) {
				mapWorldWraps = true;
			}

			var currentPlace = map.getCenter();
			var pCenter = proj.fromLatLngToPoint(currentPlace);
			var NSpxs = SWpx.y * scale - NEpx.y * scale; // subtracting small numbers gives loss of precision?
			var WEpxs = NEpx.x * scale - SWpx.x * scale;
		} catch(e) {
			$log.log(preDebugMsg + "No map to draw on yet");
			$timeout(function(){updateSize(); 	$log.log(preDebugMsg + "drawHeatmap timeout function calls updateGraphics"); updateGraphics();});
			return;
		}

		var col;
		var fill;
		var zeroTransp = 0.3;
		if(transparency < 1) {
			zeroTransp *= transparency;
		}
		var zeroTranspAlpha = Math.floor(255*zeroTransp);
		var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
		var rgbaText = hexColorToRGBAvec(textColor, 1.0);
		var imData = myCtx.getImageData(0, 0, myCanvas.width, myCanvas.height);
		var pixels = imData.data;
		var latPerPixel = (mapNE.lat() - mapSW.lat()) / myCanvas.height;
		var lonPerPixel = (mapNE.lng() - mapSW.lng()) / myCanvas.width;
		var selectionsOnScreen = [];
		var atLeastOneSelectionOnScreen = false;
		for(var span = 0; span < selections.length; span++) {
			var selBounds = selections[span].getBounds();

			if(selBounds.intersects(mapBounds)) {
				atLeastOneSelectionOnScreen = true;
				var selSW = selBounds.getSouthWest();
				var selNE = selBounds.getNorthEast();
				var selMinLat = selSW.lat();
				var selMaxLat = selNE.lat();
				var selMinLon = selSW.lng();
				var selMaxLon = selNE.lng();

				while(selMinLon < -180) {
					selMinLon += 360;
				}
				while(selMinLon > 180) {
					selMinLon -= 360;
				}

				while(selMaxLon < -180) {
					selMaxLon += 360;
				}
				while(selMaxLon > 180) {
					selMaxLon -= 360;
				}

				var splitSelInTwo = false;
				if(mapMaxLon < mapMinLon) {
					if(selMaxLon < selMinLon) {
						// map crosses dateline, so does selection
						selMinLon = Math.max(selMinLon, mapMinLon);
						selMaxLon = Math.min(selMaxLon, mapMaxLon);
						splitSelInTwo = true;
					}
					else {
						// map crosses dateline, selection does not check which side of the dateline we are on
						if(selMinLon > mapMaxLon) { // we are to the west of the dateline
							selMinLon = Math.max(selMinLon, mapMinLon);
						}
						else {
							selMaxLon = Math.min(selMaxLon, mapMaxLon);
						}
					}
				}
				else {
					if(selMaxLon < selMinLon) {
						// only selection crosses dateline check which side of the dateline the map is on
						if(selMinLon > mapMaxLon) {
							selMinLon = -180;
						}
						else {
							selMaxLon = 180;
						}
					}
					else {
						// neither crosses dateline, simplest case
						selMinLon = Math.max(selMinLon, mapMinLon);
						selMaxLon = Math.min(selMaxLon, mapMaxLon);
					}
				}

				selMinLat = Math.max(selMinLat, mapMinLat);
				selMaxLat = Math.min(selMaxLat, mapMaxLat);
				var p1 = new google.maps.LatLng(selMinLat, selMinLon);
				var p2 = new google.maps.LatLng(selMaxLat, selMaxLon);
				var p1px = proj.fromLatLngToPoint(p1);
				var p2px = proj.fromLatLngToPoint(p2);

				if(mapWorldWraps) {
					var x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
					while(x1 < 0) {
						x1 += worldWidth;
					}
					var x2 = Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
					while(x2 < 0) {
						x2 += worldWidth;
					}
				}
				else {
					if(selMinLon > 180) {
						var x1 = Math.floor(drawW - NEpx.x * scale + p1px.x * scale);
					}
					else {
						var x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
					}

					if(selMaxLon > 180) {
						var x2 = Math.floor(drawW - NEpx.x * scale + p2px.x * scale);
					}
					else {
						var x2 = Math.floor(drawW/2 + p2px.x * scale - pCenter.x * scale);
					}
				}
				var y1 = Math.floor(p1px.y * scale - NEpx.y * scale); // add topMarg later
				y1 = Math.max(0, Math.min(drawH, y1));
				var y2 = Math.floor(p2px.y * scale - NEpx.y * scale); // add topMarg later
				y2 = Math.max(0, Math.min(drawH, y2));

				if(splitSelInTwo) {
					selectionsOnScreen.push([x1, y2, drawW, y1]); // flip y-axis
					selectionsOnScreen.push([0, y2, x2, y1]); // flip y-axis
				}
				else {
					selectionsOnScreen.push([x1, y2, x2, y1]); // flip y-axis
				}
			}
		}

		if(atLeastOneSelectionOnScreen) { // if no selections are in the visible area, there will be nothing to draw
			if(dataMappings[src].active && dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) { // 3D data and lats/lons
				var haveCells = (dataMappings[src].vizType == 4);
				if(haveCells) {
					var fselCells = dataMappings[src].selFunCells;
				}

				var fsel = dataMappings[src].selFun;
				var size = dataMappings[src].size;
				var fval = dataMappings[src].valFun;
				var flat = dataMappings[src].valFunLat;
				var fselLat = dataMappings[src].selFunLat;
				var sizeLat = dataMappings[src].sizeLat;
				var flon = dataMappings[src].valFunLon;
				var fselLon = dataMappings[src].selFunLon;
				var sizeLon = dataMappings[src].sizeLon;
				var voteMatrix = [];

				for(var j = 0; j <= drawH; j++) {
					voteMatrix.push([]);
					for(var i = 0; i <= drawW; i++) {
						voteMatrix[j].push([]);
					}
				}

				for(var c = 0; c < size; c++) {
					var groupId = fsel(c);

					if(groupId > 0) {
						var cube = fval(c);
						var dimZ = cube.length;

						for(var z = 0; z < dimZ; z++) {
							// TODO: we currently do not listen to selections on Z, maybe do this in the future?
							var dimY = cube[z].length;

							for(var y = 0; y < dimY; y++) {
								if(fselLat(y) > 0) {
									var lat = flat(y);
									var latInside = false;
									if((mapMinLat <= lat && mapMaxLat >= lat) || (Math.abs(lat - mapMinLat) <= limits.minLatDiff || Math.abs(lat - mapMaxLat) <= limits.minLatDiff)) {
										latInside = true;
									}

									if(latInside) {
										var dimX = cube[z][y].length;

										for(var x = 0; x < dimX; x++) {
											if(fselLon(x) > 0) {
												var v = cube[z][y][x];
												var lon = flon(x);
												var inside = false;

												if(mapWorldWraps) {
													inside = true;
												}
												else {
													var lonInside = false;
													var normalizedLon = lon; // Google Maps API wants longitudes to be in -180 to 180, some data sets are in 0 to 360
													while(normalizedLon < -180) {
														normalizedLon += 360;
													}
													while(normalizedLon > 180) {
														normalizedLon -= 360;
													}

													if((!passDateLine && mapMinLon <= normalizedLon && mapMaxLon >= normalizedLon) || (passDateLine && (mapMinLon <= normalizedLon || mapMaxLon >= normalizedLon)) || (Math.abs(lon - mapMinLon) <= limits.minLonDiff || Math.abs(lon - mapMaxLon) <= limits.minLonDiff)) {
														lonInside = true;
													}

													if(latInside && lonInside) {
														inside = true;
													}
												}

												// TODO: when really zoomed in, we should probably use one cell outside in each direction too, since parts of these cells should also be drawn
												if(inside) {
													if(haveCells) {
														var cellIdx = ((c * dimZ + z) * dimY + y) * dimX + x;
														groupId = fselCells(cellIdx);
													}

													// if(groupId > 0) { // include group 0 too, for now

													var p1 = new google.maps.LatLng(lat, lon);
													var p1px = proj.fromLatLngToPoint(p1);

													if(mapWorldWraps) {
														x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
														while(x1 < 0) {
															x1 += worldWidth;
														}
													}
													else {
														if(lon > 180) {
															x1 = Math.floor(drawW - NEpx.x * scale + p1px.x * scale);
														}
														else {
															x1 = Math.floor(drawW/2 + p1px.x * scale - pCenter.x * scale);
														}
													}

													if(x1 >= 0 && x1 <= drawW) {
														var y1 = Math.floor(p1px.y * scale - NEpx.y * scale); // add topMarg later
														y1 = Math.max(0, Math.min(drawH, y1));

														// TODO: we currently do not listen to selections on Z, maybe do this in the future?

														var found = false;
														for(var g = 0; g < voteMatrix[y1][x1].length; g++) {
															if(voteMatrix[y1][x1][g][0] == groupId) {
																found = true;

																if(v !== null) {
																	if(voteMatrix[y1][x1][g][1] !== null) {
																		switch(map3Dto2D) {
																			case 0: // min
																				voteMatrix[y1][x1][g][1] = Math.min(voteMatrix[y1][x1][g][1], v);
																				break;
																			case 1: // max
																				voteMatrix[y1][x1][g][1] = Math.max(voteMatrix[y1][x1][g][1], v);
																				break;
																			case 2: // mean
																				voteMatrix[y1][x1][g][1] += v;
																				break;
																			default: // mean
																				voteMatrix[y1][x1][g][1] += v;
																				break;
																		}
																		voteMatrix[y1][x1][g][2] += 1;
																	}
																	else { // only saw null values so far
																		voteMatrix[y1][x1][g][1] = v;
																		voteMatrix[y1][x1][g][2] = 1;
																	}
																}
																break;
															}
														}
														if(!found) {
															if(v !== null) {
																voteMatrix[y1][x1].push([groupId, v, 1]);
															}
															else {
																voteMatrix[y1][x1].push([groupId, v, 0]);
															}
														}
													}
													// } // if cell selected or no selection info available for cells
												} // if inside drawing area
												// } // if the value in the cell is not null
											} // if x selected
										} // for each x
									} // if latInside
								} // if y selected
							} // for each y
						} // for each z
					} // if cube selected
				} // for each cube

				var allValues = [];

				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0) {
							var winner = 0;
							var best = voteMatrix[j][i][0][2];
							for(var w = 1; w < voteMatrix[j][i].length; w++) {
								if(voteMatrix[j][i][w][2] > best) {
									best = voteMatrix[j][i][w][2]; // group with most votes get to draw
									winner = w;
								}
							}

							if(voteMatrix[j][i][winner][0] == 0) { // if unselected wins and there are other options, use the second highest
								var first = true;
								var winner = 0;
								var best = voteMatrix[j][i][0][2];
								for(var w = 0; w < voteMatrix[j][i].length; w++) {
									if(voteMatrix[j][i][w][0] > 0) {
										if(first || voteMatrix[j][i][w][2] > best) {
											best = voteMatrix[j][i][w][2]; // group with most votes get to draw
											winner = w;
											first = false;
										}
									}
								}
							}

							// winning group draws average score
							var av = 0;
							if(voteMatrix[j][i][winner][1] !== null) {
								switch(map3Dto2D) {
									case 0: // min
										av = voteMatrix[j][i][winner][1];
										break;
									case 1: // max
										av = voteMatrix[j][i][winner][1];
										break;
									case 2: // mean
										av = voteMatrix[j][i][winner][1] / voteMatrix[j][i][winner][2];
										break;
									default: // mean
										av = voteMatrix[j][i][winner][1] / voteMatrix[j][i][winner][2];
										break;
								}
								if(colorMethod == 1 || colorMethod == 3) { // using histograms
									allValues.push(av);
								} else if(colorMethod == 0 || colorMethod == 2 || colorMethod == 6 || colorMethod == 7 || colorMethod == 4 || colorMethod == 5 /*the colorKey may also need min/max values*/) { // using min/max
									if(allValues.length == 0) {
										allValues.push(av);
										allValues.push(av);
									}
									else {
										allValues[0] = Math.min(av, allValues[0]);
										allValues[1] = Math.max(av, allValues[1]);
									}
								}
							}
							else {
								av = null;
							}
							voteMatrix[j][i] = [av, voteMatrix[j][i][winner][0]]; // data value, groupId
						}
					}
				}

				if(colorMethod == 1 || colorMethod == 3) { // using histograms
					allValues.sort(function(a, b){return a-b});

					if(allValues.length > 0) {
						var allValuesUnique = [allValues[0]];
						var lastVal = allValues[0];
						for(var v = 1; v < allValues.length; v++) {
							if(allValues[v] != lastVal) {
								lastVal = allValues[v];
								allValuesUnique.push(allValues[v]);
							}
						}
						allValues = allValuesUnique;
					}
				}

				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0) {
							if(voteMatrix[j][i][1] > 0 && voteMatrix[j][i][0] !== null) {
								voteMatrix[j][i] = [groupAndValTo3Dcolor(voteMatrix[j][i][0], voteMatrix[j][i][1], allValues)]; // groupAndValTo3Dcolor(data value, groupId, vector with values)
							}
							else {
								voteMatrix[j][i] = [null];// unselected data or null values
							}
						}
						else {
							voteMatrix[j][i] = []; // points on screen not corresponding to data points
						}
					}
				}

				for(var j = 0; j <= drawH; j++) {
					for(var i = 0; i <= drawW; i++) {
						if(voteMatrix[j][i].length > 0 && voteMatrix[j][i][0] !== null) { // we have something to draw here
							// find how far to the left, right, top, bottom we should go from here before another cell with data is found
							// this breaks for diagonal stuff, we assume neighboring cell is in same column or row
							var sameColor = true;
							var myColor = voteMatrix[j][i][0];
							var leftmostInSelection = false;
							var leftmostOnScreen = true;
							for(var left = i - 1; left >= 0; left--) {
								if(voteMatrix[j][left].length > 0) {
									leftmostOnScreen = false;
									leftmostInSelection = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[j][left][0] === null || voteMatrix[j][left][0][0] != myColor[0] || voteMatrix[j][left][0][1] != myColor[1] || voteMatrix[j][left][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
								else {
									var inside = false;
									for(var span = 0; span < selectionsOnScreen.length; span++) {
										if(selectionsOnScreen[span][0] <= left && selectionsOnScreen[span][2] >= left) {
											inside = true;
											break;
										}
									}
									if(!inside) {
										leftmostInSelection = true;
										break;
									}
								}
							}

							var rightmostInSelection = false;
							var rightmostOnScreen = true;
							for(var right = i + 1; right < drawW; right++) {
								if(voteMatrix[j][right].length > 0) {
									rightmostInSelection = false;
									rightmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[j][right][0] === null || voteMatrix[j][right][0][0] != myColor[0] || voteMatrix[j][right][0][1] != myColor[1] || voteMatrix[j][right][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
								else {
									var inside = false;
									for(var span = 0; span < selectionsOnScreen.length; span++) {
										if(selectionsOnScreen[span][0] <= right && selectionsOnScreen[span][2] >= right) {
											inside = true;
											break;
										}
									}
									if(!inside) {
										rightmostInSelection = true;
										break;
									}
								}
							}

							var topmostInSelection = false;
							var topmostOnScreen = true;
							for(var top = j - 1; top >= 0; top--) {
								if(voteMatrix[top][i].length > 0) {
									topmostInSelection = false;
									topmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[top][i][0] === null || voteMatrix[top][i][0][0] != myColor[0] || voteMatrix[top][i][0][1] != myColor[1] || voteMatrix[top][i][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
								else {
									var inside = false;
									for(var span = 0; span < selectionsOnScreen.length; span++) {
										if(selectionsOnScreen[span][1] <= top && selectionsOnScreen[span][3] >= top) {
											inside = true;
											break;
										}
									}
									if(!inside) {
										topmostInSelection = true;
										break;
									}
								}
							}

							var botmostInSelection = false;
							var botmostOnScreen = true;
							for(var bot = j + 1; bot < drawH; bot++) {
								if(voteMatrix[bot][i].length > 0) {
									botmostInSelection = false;
									botmostOnScreen = false;

									if(colorMethod == 5 || colorMethod == 7) { // curves
										if(voteMatrix[bot][i][0] === null || voteMatrix[bot][i][0][0] != myColor[0] || voteMatrix[bot][i][0][1] != myColor[1] || voteMatrix[bot][i][0][2] != myColor[2]) {
											sameColor = false;
										}
									}
									break;
								}
								else {
									var inside = false;
									for(var span = 0; span < selectionsOnScreen.length; span++) {
										if(selectionsOnScreen[span][1] <= bot && selectionsOnScreen[span][3] >= bot) {
											inside = true;
											break;
										}
									}
									if(!inside) {
										botmostInSelection = true;
										break;
									}
								}
							}

							var x1 = Math.floor((i + left) / 2 + 1);
							var x2 = Math.floor((i + right) / 2);

							// TODO: this part is broken when the map has wrapped around and we are off a few world spins to the left or right.

							if(leftmostInSelection) {
								x1 = i;
								sameColor = false;
							}
							else if(leftmostOnScreen && rightmostOnScreen) {
								x1 = left;
								x2 = right;
								sameColor = false;
							}
							else if(leftmostOnScreen) {
								x1 = i;
								sameColor = false;
							}
							else {
								Math.floor((i + left) / 2 + 1);
							}

							if(rightmostInSelection) {
								x2 = i;
								sameColor = false;
							}
							else if(rightmostOnScreen && leftmostOnScreen) {
								x2 = right;
								sameColor = false;
							}
							else if(rightmostOnScreen) {
								x2 = i;
								sameColor = false;
							}
							else {
								x2 = Math.floor((i + right) / 2);
							}

							var y1 = Math.floor((j + top) / 2 + 1);
							var y2 = Math.floor((j + bot) / 2);

							if(topmostInSelection) {
								y1 = j;
								sameColor = false;
							}
							else if(topmostOnScreen && botmostOnScreen) {
								y1 = top;
								y2 = bot;
								sameColor = false;
							}
							else if(topmostOnScreen) {
								y1 = j;
								sameColor = false;
							}
							else {
								y1 = Math.floor((j + top) / 2 + 1);
							}

							if(botmostInSelection) {
								y2 = j;
								sameColor = false;
							}
							else if(botmostOnScreen && topmostOnScreen) {
								y2 = bot;
								sameColor = false;
							}
							else if(botmostOnScreen) {
								y2 = j;
								sameColor = false;
							}
							else {
								y2 = Math.floor((j + bot) / 2);
							}

							if(!(colorMethod == 5 || colorMethod == 7)) { // not drawing curves
								sameColor = false;
							}

							if(!sameColor) {
								var rgba = voteMatrix[j][i][0];
								x1 += leftMarg;
								x2 += leftMarg;
								y1 += topMarg;
								y2 += topMarg;

								while(x2 < leftMarg) {
									x1 += worldWidth;
									x2 += worldWidth;
								}
								while(x1 > leftMarg + drawW) {
									x1 -= worldWidth;
									x2 -= worldWidth;
								}

								var offset = 0;
								while(x2 + offset > leftMarg && x1 + offset < leftMarg + drawW) {
									fillRect(x1 + offset,y1, x2 + offset,y2, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
									offset += worldWidth;
								}

								offset = -worldWidth;
								while(x2 + offset > leftMarg && x1 + offset < leftMarg + drawW) {
									fillRect(x1 + offset,y1, x2 + offset,y2, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
									offset -= worldWidth;
								}
							}
						}
					}
				}
			} // if src is correct type
		} // if at least one selection rectangle overlaps the visible area

		$timeout(function() {
			myCtx.putImageData(imData, 0, 0);
		}, 1);
	}
	//===================================================================================


	//===================================================================================
	// Draw 3D
	// This method draws 3D on top of the map.
	//===================================================================================
	function groupAndValTo3Dcolor(val, groupId, allValues) {
		var rgba = [0, 0, 0, 1];
		var alpha = transparency;
		if(groupId <= 0) {
			alpha *= 0.33;
		}

		if(colorMethod == 1 || colorMethod == 3) { // using histograms
			var len = allValues.length;
			var idx = Math.max(0, legacyDDSupLib.binLookup(allValues, val, 0, len));

			if(colorMethod == 1) { // group color + alpha
				rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), alpha);
				for(var c = 0; c < 3; c++) {
					rgba[c] = Math.floor(rgba[c] * 0.5 + 255 * 0.5 * idx / (len - 1));
				}
			}
			else { // heat map color
				var prop = idx / (len - 1);
				var col1 = hexColorToRGBAvec($scope.gimme("HeatMapLowValueColor"), alpha);
				var col2 = hexColorToRGBAvec($scope.gimme("HeatMapHighValueColor"), alpha);
				for(var c = 0; c < 3; c++) {
					rgba[c] = Math.floor(col1[c] * (1 - prop) + col2[c] * prop);
				}
				rgba[3] = Math.max(0, Math.min(255, Math.round(alpha * 255)));;
			}
		}
		else if(colorMethod == 0 || colorMethod == 2) { // using min/max
			var span = allValues[1] - allValues[0];
			var prop = 1;
			if(span > 0) {
				prop = (val - allValues[0]) / span;
			}

			if(colorMethod == 0) { // group color + alpha
				rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), alpha);
				for(var c = 0; c < 3; c++) {
					rgba[c] = Math.floor(rgba[c] * 0.5 + 255 * 0.5 * prop);
				}
			}
			else { // heat map colors
				var col1 = hexColorToRGBAvec($scope.gimme("HeatMapLowValueColor"), alpha);
				var col2 = hexColorToRGBAvec($scope.gimme("HeatMapHighValueColor"), alpha);
				for(var c = 0; c < 3; c++) {
					rgba[c] = Math.floor(col1[c] * (1 - prop) + col2[c] * prop);
				}
				rgba[3] = Math.max(0, Math.min(255, Math.round(alpha * 255)));;
			}
		}
		else if(colorMethod == 4 || colorMethod == 5) { // color key
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
						rgba = hexColorToRGBAvec(cc, alpha * alphaCC / 255.0);
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
						rgba = hexColorToRGBAvec(cc, alpha * alphaCC / 255.0);
					}
					else {
						rgba = hexColorToRGBAvec(cc, alpha);
					}
				}
			}
		}
		else if(colorMethod == 6 || colorMethod == 7) { // truncate to levels
			var prop = 0;
			var col1 = hexColorToRGBAvec($scope.gimme("HeatMapLowValueColor"), alpha);

			if(noofLevels > 1) {
				var span = allValues[allValues.length - 1] - allValues[0];
				if(span > 0) {
					prop = (val - allValues[0]) / span;
				}

				prop = Math.floor(Math.min(noofLevels - 1, (noofLevels * prop))) / (noofLevels - 1);
				var col2 = hexColorToRGBAvec($scope.gimme("HeatMapHighValueColor"), alpha);

				for(var c = 0; c < 3; c++) {
					rgba[c] = Math.floor(col1[c] * (1 - prop) + col2[c] * prop);
				}
				rgba[3] = col1[3];
			}
			else {
				rgba = col1;
			}
		}
		return rgba;
	}
	//===================================================================================


	//===================================================================================
	// Draw Data
	// This method draws the data on top of the map.
	//===================================================================================
	function drawData() {
		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				if(dataMappings[src].vizType == 0 || dataMappings[src].vizType == 1 || dataMappings[src].vizType == 5) { // points or lines
					drawCartesianPlot(src);
				}
				else if(dataMappings[src].vizType == 2) {
					drawHeatmap(src);
				}
				else if(dataMappings[src].vizType == 3 || dataMappings[src].vizType == 4) {
					draw3D(src);
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Clear Selections
	// This method clear away all selections.
	//===================================================================================
	function clearSelections() {
		for(var i = 0; i < selections.length; i++) {
			selections[i].setMap(null);
		}
		selections = [];
	}
	//===================================================================================


	//===================================================================================
	// Hex Color to RGBA Vector
	// This method converts a hexadecimal color value to a RGBA vector.
	//===================================================================================
	function hexColorToRGBAvec(color, alpha) {
		var res = [];

		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
			return [r, g, b, a];
		}
		return [0, 0, 0, 255];
	}
	//===================================================================================


	//===================================================================================
	// Hex Color to RGBA
	// This method converts a hexadecimal color value to a RGBA color.
	//===================================================================================
	function hexColorToRGBA(color, alpha) {
		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
		}
		return color;
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
