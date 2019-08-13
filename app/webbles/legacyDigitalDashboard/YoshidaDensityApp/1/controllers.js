//======================================================================================================================
// Controllers for HandsOnPortal Density App for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('densityAppWebbleCtrl', function($scope, $log, Slot, Enum, $location, $timeout, wwConsts) {

	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		densityAppWrapper: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
	};

	$scope.displayText = "Loading the 3D Density environment. Please wait...";
	var preDebugMsg = "SpaceDensityApp: ";

	var neededChildren = {};
	var loadedChildren = {};
	var listeners = [];
	var setupDone = false;
	var hopSuppWbl;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Resize
	// This event handler manages what to do when the window view resizes
	//===================================================================================
	function onResize() {
		$log.log(preDebugMsg + "onResize called");

		var windowWidth = $(window).width();
		var windowHeight = $(window).height();

		if(hopSuppWbl != undefined && hopSuppWbl.scope().isInPortal()) {
			windowHeight -= 100;
		}

		var dataLeft = 250;
		var dataTop  = 10;
		var vizLeft = 5;
		var vizTop = 105;
		if(windowHeight < windowWidth) {
			dataLeft = 5;
			dataTop = 105
			vizLeft = 250;
			vizTop = 10
		}

		var fontSize = 11;

		if(loadedChildren["DigitalDashboardSmartDataSource"].length > 0) {
			var datasrc = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardSmartDataSource"][0]);
			datasrc.scope().set("root:top", dataTop);
			datasrc.scope().set("root:left", dataLeft);
		}

		if(loadedChildren["DigitalDashboardPlugin3DDensityPlotAdv"].length > 0) {
			var n = 256;
			var cw = Math.max(1, Math.min(Math.ceil((windowWidth - vizLeft - 50) / 2 / (2*n)), Math.floor((windowHeight - vizTop - 60) / (2*n))));
			var zoom = Math.max(200, Math.min(windowWidth - vizLeft - 2*cw * 256 - 50, windowHeight - vizTop - 60));

			var viz = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPlugin3DDensityPlotAdv"][0]);
			viz.scope().set("root:top", vizTop);
			viz.scope().set("root:left", vizLeft);
			viz.scope().set("DrawingArea:width", cw * 256 * 2 + 20);
			viz.scope().set("DrawingArea:height", cw * 256 * 2 + 20);
			viz.scope().set("CellWidth", cw);
			viz.scope().set("ZoomSpace", zoom);

			$log.log(preDebugMsg + "viz moved and set to " + vizTop + " " + vizLeft + " " + cw + " " + zoom);
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
	// Load Webble Defs
	// This method sets up and begin loading all the webbles that are needed for this
	// application.
	//===================================================================================
	var loadWebbleDefs = function() {
		neededChildren = {};
		loadedChildren = {};

		neededChildren["HoPSupport"] = 1;
		neededChildren["DigitalDashboard"] = 1;
		neededChildren["DigitalDashboardPlugin3DDensityPlotAdv"] = 1;
		neededChildren["DigitalDashboardSmartDataSource"] = 1;

		for(var w in neededChildren) {
			loadedChildren[w] = [];
		}

		$scope.downloadWebbleDef("DigitalDashboard");
	};
	//===================================================================================


	//===================================================================================
	// Add Newly Loaded Child
	// This method adds a specific newly loaded child to
	//===================================================================================
	var addNewlyLoadedChild = function(webbleID, templateId) {
		// $log.log(preDebugMsg + "addNewlyLoadedChild, " + webbleID + " " + templateId);
		if(!setupDone) {
			if(loadedChildren.hasOwnProperty(templateId)) {
				loadedChildren[templateId].push(webbleID);
			} else {
				return;
			}

			if(templateId == "HoPSupport") {
				hopSuppWbl = $scope.getWebbleByInstanceId(webbleID);
			}

			if(templateId.indexOf("DataSource") >= 0) {
				listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
					dataSourceUpdated(loadedChildren["DigitalDashboardSmartDataSource"][0]);
				}, webbleID, 'ProvidedFormatChanged'));
				listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
					dataSourceUpdated(loadedChildren["DigitalDashboardSmartDataSource"][0]);
				}, webbleID, 'DataChanged'));
			}

			$scope.getWebbleByInstanceId(webbleID).scope().set("root:opacity", 0);

			// $log.log(preDebugMsg + "check if we should duplicate " + templateId);
			// check if this is a newly loaded template and if we should duplicate this
			if(loadedChildren[templateId].length == 1) {
				if(neededChildren[templateId] > loadedChildren[templateId].length) {
					var original = $scope.getWebbleByInstanceId(webbleID); // duplicate this Webble to get as many as we need
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
	// This method sets all loaded webble's slots to be exactly as they should.
	//===================================================================================
	var setAllWebbleSlotsEtc = function() {
		if(setupDone) {
			return;
		}

		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		if(hopSuppWbl != undefined && hopSuppWbl.scope().isInPortal()) {
			windowHeight -= 100;
		}

		for (var t in loadedChildren) {
			if (loadedChildren.hasOwnProperty(t)) {
				for(var w = 0; w < loadedChildren[t].length; w++) {
					$scope.getWebbleByInstanceId(loadedChildren[t][w]).scope().set("root:opacity", 1);
				}
			}
		}

		var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
		dashboard.scope().set("root:top", 10);
		dashboard.scope().set("root:left", 5);
		dashboard.scope().set("DrawingArea:width", 120);
		dashboard.scope().set("DrawingArea:height", 60);

		dashboard.scope().set("Colors", {"skin":{"text":"#FFFFFF","color":"#000000","border":"#DD6A3D","gradient":[{"pos":0,"color":"#000000"},{"pos":0.75,"color":"#000000"},{"pos":1,"color":"#000000"}]},"selection":{"color":"#FFFACD","border":"#FF2500","gradient":[{"pos":0,"color":"#FFFACD"},{"pos":1,"color":"#FFFFDD"}]},"groups":{"0":{"color":"#888888","gradient":[{"pos":0,"color":"#888888"},{"pos":0.75,"color":"#999999"}]},"1":{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},"2":{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},"3":{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},"4":{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},"5":{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},"6":{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},"7":{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},"8":{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},"9":{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},"10":{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},"11":{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},"12":{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},"13":{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},"14":{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}});

		var dataLeft = 250;
		var dataTop  = 10;
		var vizLeft = 5;
		var vizTop = 105;
		if(windowHeight < windowWidth) {
			dataLeft = 5;
			dataTop = 105
			vizLeft = 250;
			vizTop = 10
		}

		var fontSize = 11;

		var datasrc = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardSmartDataSource"][0]);
		datasrc.scope().set("root:top", dataTop);
		datasrc.scope().set("root:left", dataLeft);
		datasrc.scope().set("Data", {});

		datasrc.scope().paste(dashboard);

		var n = 256;
		var cw = Math.max(1, Math.min(Math.ceil((windowWidth - vizLeft - 50) / 2 / (2*n)), Math.floor((windowHeight - vizTop - 60) / (2*n))));
		var zoom = Math.max(200, Math.min(windowWidth - vizLeft - 2*cw * 256 - 50, windowHeight - vizTop - 60));

		var viz = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPlugin3DDensityPlotAdv"][0]);
		viz.scope().set("root:top", vizTop);
		viz.scope().set("root:left", vizLeft);
		viz.scope().set("CellWidth", cw);
		viz.scope().set("ZoomSpace", zoom);

		viz.scope().paste(dashboard);

		$timeout(function(){
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]).scope().set("Mapping",
				{"plugins":[{"name":"Density Plot Advanced","grouping":true,"sets":[{"fields":[{"name":"3D Density Data","assigned":[{"sourceName":"SMART Data Source","dataSetName":"SMART Data Source: ","dataSetIdx":0,"fieldName":"3D Array"}],"template":false,"added":false}]}]}]}
			)},
		1);

		setupDone = true;
		$scope.displayText = "Density App Loaded";
	};
	//===================================================================================


	//===================================================================================
	// Data Source Updated
	// This method handles data source updates.
	//===================================================================================
	function dataSourceUpdated(webbleID) {
		$timeout(function() {
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]).scope().set("Mapping",
				{"plugins":[{"name":"Density Plot Advanced","grouping":true,"sets":[{"fields":[{"name":"3D Density Data","assigned":[{"sourceName":"SMART Data Source","dataSetName":"SMART Data Source: ","dataSetIdx":0,"fieldName":"3D Array"}],"template":false,"added":false}]}]}]}
			)},
		1);
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
