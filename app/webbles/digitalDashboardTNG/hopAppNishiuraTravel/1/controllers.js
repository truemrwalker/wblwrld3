//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG Hands-on-Portal Nishiura Travel App for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopAppTravelAppLoaderWebbleCtrl', function($scope, $log, Slot, Enum, $location, $timeout, wwConsts) {
	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		hopAppTravelAppLoaderWebble: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
	};

	$scope.displayText = "Loading the Travel environment. Please wait...";
	var preDebugMsg = "hopAppTravelAppLoaderWebble: ";

	// The Webble templates required for the application
	var hopSupportName = "HoPSupport";
	var barName = "hopVizBarChartWebble";
	var mapName = "hopVizMapWebble";
	var dataSrcName = "hopFileDataWebble";

	var neededChildren = {};
	var loadedChildren = {};
	var setupDone = false;
	var listeners = [];
	var hopSuppWbl;
	var lastSeenMapping = "";
	var lastFormatString = "";



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Resize
	// This Event handler takes care of window resize so that the component layout is
	// always at its best.
	//===================================================================================
	function onResize() {
		// $log.log(preDebugMsg + "onResize called");
		var windowWidth = $(window).width();
		var windowHeight = $(window).height() - 100;
		var topMarg = 10;
		var leftMarg = 10;
		var rowMarg = 20;
		var colMarg = 10;
		var vizHeight = 100;
		var vizWidth = 100;
		var dataWidth = 315;
		var three = false;
		var one = false;

		if(windowHeight < 600) {
			topMarg = 0;
		}

		if(windowWidth < 600) {
			leftMarg = 0;
		}

		var usefulW = windowWidth - dataWidth - 20 - leftMarg; // scroll bar on the side takes up some space
		var usefulH = windowHeight - 30 - topMarg;
		var ratio = usefulH / usefulW;
		var rows = [0, 100, 200];
		var cols = [250, 350, 450];
		var ws = [200, 200, 200];
		var hs = [200, 200, 200];

		$log.log(preDebugMsg + "ratio " + ratio);

		if(ratio > 0.4) {
			// top to bottom
			vizHeight = Math.max(150, Math.floor(usefulH / 3) - rowMarg);
			vizWidth = Math.max(300, Math.floor(usefulW));
			rows[0] = topMarg;
			rows[1] = topMarg + (rowMarg + vizHeight)*2;
			cols[0] = dataWidth;
			cols[1] = dataWidth;
			ws[0] = vizWidth;
			ws[1] = vizWidth;
			hs[0] = vizHeight*2 + rowMarg;
			hs[1] = vizHeight;
		}
		else {
			// side by side
			vizHeight = Math.max(300, Math.floor(usefulH));
			vizWidth = Math.max(300, Math.floor(usefulW / 3) - colMarg);
			rows[0] = topMarg;
			rows[1] = topMarg;
			cols[0] = dataWidth;
			cols[1] = dataWidth + (vizWidth + colMarg) * 2;
			ws[0] = vizWidth*2 + colMarg;
			ws[1] = vizWidth;
			hs[0] = vizHeight;
			hs[1] = vizHeight;
		}

		if(loadedChildren.hasOwnProperty(hopSupportName) && loadedChildren[hopSupportName].length > 0) {
			var hopSupp = $scope.getWebbleByInstanceId(loadedChildren[hopSupportName][0]);
			hopSupp.scope().set("root:top", topMarg);
			hopSupp.scope().set("root:left", leftMarg);
		}

		if(loadedChildren.hasOwnProperty(dataSrcName) && loadedChildren[dataSrcName].length > 0) {
			var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
			datasrc.scope().set("root:top", topMarg);
			datasrc.scope().set("root:left", leftMarg);
		}

		if(loadedChildren.hasOwnProperty(mapName) && loadedChildren[mapName].length > 0) {
			var map = $scope.getWebbleByInstanceId(loadedChildren[mapName][0]);
			map.scope().set("root:top", rows[0] - topMarg);
			map.scope().set("root:left", cols[0] - leftMarg);
			map.scope().set("mapDrawingArea:width", ws[0]);
			map.scope().set("mapDrawingArea:height", hs[0]);
		}

		if(loadedChildren.hasOwnProperty(barName) && loadedChildren[barName].length > 0) {
			var barChart = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
			barChart.scope().set("root:top", rows[1] - topMarg);
			barChart.scope().set("root:left", cols[1] - leftMarg);
			barChart.scope().set("DrawingArea:width", ws[1]);
			barChart.scope().set("DrawingArea:height", hs[1]);
		}
	}
	//===================================================================================


	//===================================================================================
	// Data Source Updated
	// This event handler reacts to data source updates and make sure all visualization
	// Webbles change accordingly.
	//===================================================================================
	function dataSourceUpdated(datasrcWebbleID) {
		// $log.log(preDebugMsg + "dataSource was updated with new data");
		if(!setupDone) {
			return;
		}

		var datasrc = $scope.getWebbleByInstanceId(datasrcWebbleID);
		var dataFields = datasrc.scope().gimme("DataAccess");
		var newFormatStr = JSON.stringify(dataFields);
		if(newFormatStr != lastFormatString) {
			setMappings();
			lastFormatString = newFormatStr;
		}
	}
	//===================================================================================



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		$scope.set("root:opacity", 0.1);

		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			var newVal = eventData.targetId;
			// $log.log(preDebugMsg + "loadingWebble! " + newVal);

			if(!setupDone) {
				var thisChild = $scope.getWebbleByInstanceId(newVal);
				var templateId = thisChild.scope().theWblMetadata['templateid'];

				if(templateId && templateId !== "") {
					addNewlyLoadedChild(newVal, templateId);
				}
			}

		});

		loadWebbleDefs();
		$(window).bind("resize", onResize); // to update the Webble sizes when the browser window is resized
	};
	//===================================================================================


	//===================================================================================
	// Add Newly Loaded Child
	// This method adds a specific newly loaded child to the list of webbles being
	// maintained and manipulated
	//===================================================================================
	var addNewlyLoadedChild = function(webbleID, templateId) {
		$log.log(preDebugMsg + "addNewlyLoadedChild, " + webbleID + " " + templateId);

		if(!setupDone) {
			if(loadedChildren.hasOwnProperty(templateId)) {
				loadedChildren[templateId].push(webbleID);
			}
			else {
				return;
			}

			var newWbl = $scope.getWebbleByInstanceId(webbleID);
			if(templateId == "HoPSupport") { hopSuppWbl = newWbl; }
			newWbl.scope().set("root:opacity", 0);

			if(templateId.indexOf("Data") >= 0) {
				// $log.log(preDebugMsg + "add listeners to data source");
				listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
					// $log.log(preDebugMsg + "Listener for data change");
					dataSourceUpdated(loadedChildren[dataSrcName][0]);
				}, webbleID, 'DataChanged'));
			}

			// $log.log(preDebugMsg + "check if we should duplicate " + templateId);
			// check if this is a newly loaded template and if we should duplicate this
			if(loadedChildren[templateId].length == 1) {
				if(neededChildren[templateId] > loadedChildren[templateId].length) {
					var original = newWbl; // duplicate this Webble to get as many as we need
					for(var copies = loadedChildren[templateId].length; copies < neededChildren[templateId]; copies++) {
						// $log.log(preDebugMsg + "making more " + templateId + " Webbles.");
						original.scope().duplicate({x: 15, y: 15}, undefined);
					}
					return; // wait for the duplicates to arrive
				}
			}

			// $log.log(preDebugMsg + " check if we have everything");
			// check if all the Webbles we need are here yet
			var allHere = true;
			for (var type in neededChildren) {
				if (neededChildren.hasOwnProperty(type)) {
					// $log.log(preDebugMsg + "check if we have " + type + ", want " + neededChildren[type] + ", have " + loadedChildren[type].length);
					if(neededChildren[type] > loadedChildren[type].length) {
						// $log.log(preDebugMsg + "not enough " + type);
						allHere = false;

						if(loadedChildren[type].length == 0) {
							// $log.log(preDebugMsg + "load one " + type);
							$scope.downloadWebbleDef(type);
						}
						break;
					}
				}
			}

			if(allHere) {
				// $log.log(preDebugMsg + "all Webbles loaded.");
				setAllWebbleSlotsEtc();
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Set All Webble Slots Etc
	// This method sets all slots and connections for the loaded Webble components
	// included within in order to make this app work as it should.
	//===================================================================================
	var setAllWebbleSlotsEtc = function() {
		if(setupDone) {
			return;
		}

		var windowWidth = $(window).width();
		var windowHeight = $(window).height() - 100;

		for (var t in loadedChildren) {
			if (loadedChildren.hasOwnProperty(t)) {
				for(var w = 0; w < loadedChildren[t].length; w++) {
					$scope.getWebbleByInstanceId(loadedChildren[t][w]).scope().set("root:opacity", 1);
				}
			}
		}

		var fontSize = 11;

		var hopSupp = $scope.getWebbleByInstanceId(loadedChildren[hopSupportName][0]);
		hopSupp.scope().set("root:z-index", 1);

		var map = $scope.getWebbleByInstanceId(loadedChildren[mapName][0]);
		map.scope().set('MultipleSelectionsDifferentGroups', true);
		map.scope().set('MapOpacity', 55);
		map.scope().set('LineWidth', 3);
		map.scope().set('LineModification', 2);
		map.scope().set('Transparency', 0.5);
		map.scope().set('MapCenterLatitude', 21.61);
		map.scope().set('MapCenterLongitude', 38.69);
		map.scope().set('ZoomLevel', 3);
		map.scope().set('particleMinMaxSizes', {"min": 0.25, "max": 8});

		var barChart1 = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
		barChart1.scope().set("PluginName", "Bar Chart 1");
		barChart1.scope().set('MultipleSelectionsDifferentGroups', true);
		barChart1.scope().set('BarSeparatorWidth', 1);
		barChart1.scope().set('MinimumBarWidth', 2);
		barChart1.scope().set('UseLogaritmicCounts', true);

		var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
		datasrc.scope().set("FontSize", 9);

		map.scope().paste(datasrc);
		barChart1.scope().paste(datasrc);

		onResize(); // do the layout
		datasrc.scope().set("PreDefinedColorScheme", 2);

		var url = "https://dr-hato.se/data/country2countryNoDomestic.zip";
		datasrc.scope().inputURL = url;
		datasrc.scope().onInputURLChange();

		// wait for everyone to initialize properly, so use a timeout
		$timeout(function() {setupDone = true; setMappings();}, 1);
		$scope.displayText = "Travel App Loaded";
	};
	//===================================================================================


	//===================================================================================
	// Set Mappings
	// This method sets all the data mappings between the data manager webble and the
	// visualization Webbles.
	//===================================================================================
	function setMappings() {
		var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
		var sourceInstanceId = loadedChildren[dataSrcName][0];
		var sourceName = datasrc.scope().gimme("PluginName");
		var dataSetName = sourceName;
		var dataSetIdx = 0;
		var fieldName = "";
		var dataFields = datasrc.scope().gimme("DataAccess");
		var lex = {};
		var curMapping = "";
		var lat1 = "";
		var lat2 = "";
		var lon1 = "";
		var lon2 = "";
		var num = "";

		for(var f = 0 ; f < dataFields.length; f++) {
			fieldName = dataFields[f].name;
			var info = {"webbleID":sourceInstanceId, "type":dataFields[f].type, "slotName":"DataAccess", "fieldIdx":f, "sourceName":sourceName, "fieldName":fieldName};
			lex[fieldName] = {"name":fieldName, "type":dataFields[f].type.join("|"), "noofRows":dataFields[f].size, "id":JSON.stringify(info)};
			curMapping += fieldName + "--" + dataFields[f].type.join("|") + ";";
			var n = fieldName.toLowerCase();

			if(n.indexOf("lat") >= 0) {
				if(lat1 == "") {
					lat1 = fieldName;
				}
				else {
					lat2 = fieldName;
				}
			}
			else if(n.indexOf("lon") >= 0) {
				if(lon1 == "") {
					lon1 = fieldName;
				}
				else {
					lon2 = fieldName;
				}
			}
			else if (lex[fieldName].type == "number") {
				num = fieldName;
			}
		}

		if(curMapping != lastSeenMapping) {
			lastSeenMapping = curMapping;
			$log.log(preDebugMsg + "pause updates");
			datasrc.scope().pauseUpdates(true);
			var map = $scope.getWebbleByInstanceId(loadedChildren[mapName][0]);
			var barChart1 = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
			map.scope().clearData();
			barChart1.scope().clearData();

			if(lat1 != "" && lat2 != "" && lon1 != "" && lon2 != "") {
				map.scope().fakeDrop(lex[lat1].id, 'Start Latitude');
				map.scope().fakeDrop(lex[lon1].id, 'Start Longitude');
				map.scope().fakeDrop(lex[lat2].id, 'End Latitude');
				map.scope().fakeDrop(lex[lon2].id, 'End Longitude');

				if(num != "") {
					map.scope().fakeDrop(lex[num].id, 'Point Value');
					barChart1.scope().fakeDrop(lex[num].id, 'data');
				}
			}

			$log.log(preDebugMsg + "unpause updates");
			datasrc.scope().pauseUpdates(false);

			$timeout(function() {
				selectAll();
			}, 1);
		}
	}
	//===================================================================================


	//===================================================================================
	// Load Webble Defs
	// This method loads all the required Webbles that is required for this application
	// to run properly.
	//===================================================================================
	var loadWebbleDefs = function() {
		neededChildren = {};
		loadedChildren = {};

		neededChildren[hopSupportName] = 1;
		neededChildren[mapName] = 1;
		neededChildren[barName] = 1;
		neededChildren[dataSrcName] = 1;

		for(var w in neededChildren) {
			loadedChildren[w] = [];
		}

		$scope.downloadWebbleDef(dataSrcName);
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data for all components.
	//===================================================================================
	function selectAll() {
		$log.log(preDebugMsg + "Select all data in all components");
		var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
		$log.log(preDebugMsg + "pause updates");
		datasrc.scope().pauseUpdates(true);

		if(loadedChildren.hasOwnProperty(mapName) && loadedChildren[mapName].length > 0) {
			$scope.getWebbleByInstanceId(loadedChildren[mapName][0]).scope().selectAll();
		}
		if(loadedChildren.hasOwnProperty(barName) && loadedChildren[barName].length > 0) {
			$scope.getWebbleByInstanceId(loadedChildren[barName][0]).scope().selectAll();
		}

		$log.log(preDebugMsg + "unpause updates");
		datasrc.scope().pauseUpdates(false);
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
