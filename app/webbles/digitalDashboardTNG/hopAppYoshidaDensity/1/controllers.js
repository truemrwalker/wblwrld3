//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG Hands-on-Portal Yoshida Space Density App for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopAppDensityAppLoaderWebbleCtrl', function($scope, $log, Slot, Enum, $location, $timeout, wwConsts) {
	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		hopAppDensityAppLoaderWebble: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
		densityAppText: ['color']
	};

	$scope.displayText = "Loading the Density environment. Please wait...";
	var preDebugMsg = "hopAppDensityAppLoaderWebble: ";

	// The Webble templates required for the application
	var hopSupportName = "HoPSupport";
	var f3Name = "hopVizFake3DWebble";
	var barName = "hopVizBarChartWebble";
	var r3Name = "three3DPlus";
	var scatterName = "hopVizScatterPlotWebble";
	var dataSrcName = "hopFileDataWebble";

	var neededChildren = {};
	var loadedChildren = {};
	var setupDone = false;
	var listeners = [];
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

		var usefulW = windowWidth - 20 - leftMarg; // scroll bar on the side takes up some space
		var usefulH = windowHeight - 30 - topMarg;
		var ratio = usefulH / usefulW;
		var rows = [0, 100, 200, 300];
		var cols = [250, 350, 450, 550];
		var ws = [200, 200, 200, 200];
		var hs = [200, 200, 200, 200];

		$log.log(preDebugMsg + "ratio " + ratio);

		if(ratio > 0.95) {
			// everything top to bottom
			vizHeight = Math.max(300, Math.floor(usefulH / 4) - rowMarg);
			vizWidth = Math.max(300, Math.floor(usefulW));

			rows[0] = topMarg;
			rows[1] = topMarg + (rowMarg + vizHeight);
			rows[2] = topMarg + (rowMarg + vizHeight)*3;
			rows[3] = topMarg + (rowMarg + vizHeight)*2;

			cols[0] = leftMarg;
			cols[1] = leftMarg;
			cols[2] = leftMarg;
			cols[3] = leftMarg;

			ws[0] = vizWidth;
			ws[1] = vizWidth;
			ws[2] = vizWidth;
			ws[3] = vizWidth;

			hs[0] = vizHeight;
			hs[1] = vizHeight;
			hs[2] = vizHeight;
			hs[3] = vizHeight;
		}
		else if(ratio > 0.7) {
			// 3Ds in right col, rest in left
			vizHeight = Math.max(200, Math.floor(usefulH / 2) - rowMarg);
			vizWidth = Math.max(200, 2 * Math.floor(usefulW / 3) - colMarg);
			var leftW = Math.max(150, dataWidth, Math.floor(vizWidth / 2));
			vizWidth = Math.max(200, usefulW - leftW - colMarg);

			rows[0] = topMarg;
			rows[1] = topMarg + (rowMarg + vizHeight);
			rows[2] = topMarg + (rowMarg + vizHeight);
			rows[3] = topMarg;

			cols[0] = leftMarg + (colMarg + leftW);
			cols[1] = leftMarg + (colMarg + leftW);
			cols[2] = leftMarg;
			cols[3] = leftMarg;

			ws[0] = vizWidth;
			ws[1] = vizWidth;
			ws[2] = vizWidth;
			ws[3] = leftW;

			hs[0] = vizHeight;
			hs[1] = vizHeight;
			hs[2] = vizHeight;
			hs[3] = vizHeight;
		}
		else 	if(ratio > 0.33) {
			// 3Ds side by side, rest below
			vizHeight = Math.max(200, 2*Math.floor(usefulH / 3) - rowMarg);
			vizWidth = Math.max(200, Math.floor(usefulW / 2) - colMarg);
			var bh = Math.max(150, Math.floor(vizHeight / 2));
			vizHeight = Math.max(200, usefulH - bh - rowMarg);

			rows[0] = topMarg;
			rows[1] = topMarg;
			rows[2] = topMarg + (rowMarg + vizHeight);
			rows[3] = topMarg + (rowMarg + vizHeight);

			cols[0] = leftMarg;
			cols[1] = leftMarg + (colMarg + vizWidth);
			cols[2] = leftMarg;
			cols[3] = leftMarg + dataWidth;

			ws[0] = vizWidth;
			ws[1] = vizWidth;
			ws[2] = vizWidth;
			ws[3] = vizWidth;

			hs[0] = vizHeight;
			hs[1] = vizHeight;
			hs[2] = vizHeight;
			hs[3] = bh;
		}
		else {
			// everything side by side
			vizHeight = Math.max(200, usefulH);
			vizWidth = Math.max(200, Math.floor((usefulW - dataWidth - colMarg) / 3 - colMarg));

			rows[0] = topMarg;
			rows[1] = topMarg;
			rows[2] = topMarg;
			rows[3] = topMarg;

			cols[0] = leftMarg + dataWidth + colMarg;
			cols[1] = leftMarg + dataWidth + colMarg + (colMarg + vizWidth);
			cols[2] = leftMarg;
			cols[3] = leftMarg + dataWidth + colMarg + (colMarg + vizWidth)*2;

			ws[0] = vizWidth;
			ws[1] = vizWidth;
			ws[2] = vizWidth;
			ws[3] = vizWidth;

			hs[0] = vizHeight;
			hs[1] = vizHeight;
			hs[2] = vizHeight;
			hs[3] = vizHeight;
		}

		if(loadedChildren.hasOwnProperty(hopSupportName) && loadedChildren[hopSupportName].length > 0) {
			var hopSupp = $scope.getWebbleByInstanceId(loadedChildren[hopSupportName][0]);
			hopSupp.scope().set("root:top", rows[2]);
			hopSupp.scope().set("root:left", cols[2]);
		}

		if(loadedChildren.hasOwnProperty(dataSrcName) && loadedChildren[dataSrcName].length > 0) {
			var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
			datasrc.scope().set("root:top", rows[2]);
			datasrc.scope().set("root:left", cols[2]);
		}

		if(loadedChildren.hasOwnProperty(r3Name) && loadedChildren[r3Name].length > 0) {
			var r3 = $scope.getWebbleByInstanceId(loadedChildren[r3Name][0]);
			r3.scope().set("root:top", rows[0] - rows[2]);
			r3.scope().set("root:left", cols[0] - cols[2]);
			r3.scope().set("threeDPlusHolder:width", ws[0] - 20);
			r3.scope().set("threeDPlusHolder:height", hs[0] - 10);
		}

		if(loadedChildren.hasOwnProperty(f3Name) && loadedChildren[f3Name].length > 0) {
			var f3 = $scope.getWebbleByInstanceId(loadedChildren[f3Name][0]);
			f3.scope().set("root:top", rows[1] - rows[2]);
			f3.scope().set("root:left", cols[1] - cols[2]);
			f3.scope().set("DrawingArea:width", ws[1]);
			f3.scope().set("DrawingArea:height", hs[1]);
		}

		if(loadedChildren.hasOwnProperty(barName) && loadedChildren[barName].length > 0) {
			var barChart = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
			barChart.scope().set("root:top", rows[3] - rows[2]);
			barChart.scope().set("root:left", cols[3] - cols[2]);
			barChart.scope().set("DrawingArea:width", ws[3]);
			barChart.scope().set("DrawingArea:height", hs[3]);
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
		if(setupDone) { return; }

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
		$scope.set("densityAppText:color", "white");
		$scope.set("root:z-index", 20);
		$scope.displayText = "Density App Loading & Mapping Data...";

		var hopSupp = $scope.getWebbleByInstanceId(loadedChildren[hopSupportName][0]);
		hopSupp.scope().set("root:z-index", 1);

		var r3 = $scope.getWebbleByInstanceId(loadedChildren[r3Name][0]);
		r3.scope().set('MultipleSelectionsDifferentGroups', true);
		r3.scope().set('localGlobalColorEqual', true);
		r3.scope().set('predefVisualConfig', 2);

		var f3 = $scope.getWebbleByInstanceId(loadedChildren[f3Name][0]);
		f3.scope().set('MultipleSelectionsDifferentGroups', true);
		f3.scope().set('DimensionX', 2);
		f3.scope().set('DimensionY', 0);

		var barChart1 = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
		barChart1.scope().set("PluginName", "Bar Chart 1");
		barChart1.scope().set('MultipleSelectionsDifferentGroups', true);
		barChart1.scope().set('BarSeparatorWidth', 1);
		barChart1.scope().set('MinimumBarWidth', 2);
		barChart1.scope().set('UseLogaritmicCounts', true);

		var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);
		datasrc.scope().set("FontSize", 9);

		r3.scope().paste(datasrc);
		r3.scope().connectSlots("ColorScheme", "ColorScheme", {send: true, receive: true});
		f3.scope().paste(datasrc);
		barChart1.scope().paste(datasrc);

		onResize(); // do the layout
		datasrc.scope().set("PreDefinedColorScheme", 12); // or 12?

		var url = "https://dr-hato.se/data/R001_S020_ng256_dens.zip";
		datasrc.scope().inputURL = url;
		datasrc.scope().onInputURLChange();

		// wait for everyone to initialize properly, so use a timeout
		$timeout(function() {setupDone = true; setMappings();}, 1);
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
		var other3D = false;
		var name3D = [];
		var lex = {};
		var curMapping = "";

		for(var f = 0 ; f < dataFields.length; f++) {
			fieldName = dataFields[f].name;
			var info = {"webbleID":sourceInstanceId, "type":dataFields[f].type, "slotName":"DataAccess", "fieldIdx":f, "sourceName":sourceName, "fieldName":fieldName};
			lex[fieldName] = {"name":fieldName, "type":dataFields[f].type.join("|"), "noofRows":dataFields[f].size, "id":JSON.stringify(info)};
			curMapping += fieldName + "--" + dataFields[f].type.join("|") + ";";

			if(dataFields[f].type == "3Darray") {
				other3D = true;
				name3D.push(fieldName);
			}
		}

		if(curMapping != lastSeenMapping) {
			lastSeenMapping = curMapping;
			$log.log(preDebugMsg + "pause updates");
			datasrc.scope().pauseUpdates(true);
			var r3 = $scope.getWebbleByInstanceId(loadedChildren[r3Name][0]);
			var f3 = $scope.getWebbleByInstanceId(loadedChildren[f3Name][0]);
			var barChart1 = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);
			r3.scope().clearData();
			f3.scope().clearData();
			barChart1.scope().clearData();

			if(other3D) {
				var lastIdx = "";
				var secondLastIdx = "";
				for(var f = 0 ; f < dataFields.length; f++) {
					fieldName = dataFields[f].name;

					if(fieldName.indexOf("idx -> ")  >= 0 ) {
						secondLastIdx = lastIdx;
						lastIdx = fieldName;
					}
				}

				if(lastIdx != "") {
					barChart1.scope().fakeDrop(lex[lastIdx].id, 'data');
				}

				f3.scope().fakeDrop(lex["X coordinates"].id, 'X');
				f3.scope().fakeDrop(lex["Y coordinates"].id, 'Y');
				f3.scope().fakeDrop(lex["Z coordinates"].id, 'Z');
				f3.scope().fakeDrop(lex[name3D[0]].id, 'data');

				r3.scope().fakeDrop(lex["Y coordinates"].id, 'Y');
				r3.scope().fakeDrop(lex["Z coordinates"].id, 'Z');
				if(lastIdx != "") {
					r3.scope().fakeDrop(lex[lastIdx].id, 'Values');
				}
				r3.scope().fakeDrop(lex[name3D[0]].id, '3D');
				r3.scope().fakeDrop(lex["X coordinates"].id, 'X');
			}

			$log.log(preDebugMsg + "unpause updates");
			datasrc.scope().pauseUpdates(false);

			$timeout(function() {
				selectAll();
				$scope.displayText = "Density App Loaded";
				$scope.set("root:z-index", 5);
				$scope.set("densityAppText:color", "black");
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
		neededChildren[f3Name] = 1;
		neededChildren[barName] = 1;
		neededChildren[r3Name] = 1;
		neededChildren[dataSrcName] = 1;

		for(var w in neededChildren) {
			loadedChildren[w] = [];
		}

		$scope.downloadWebbleDef(dataSrcName);
	};
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

		if(loadedChildren.hasOwnProperty(f3Name) && loadedChildren[f3Name].length > 0) {
			$scope.getWebbleByInstanceId(loadedChildren[f3Name][0]).scope().selectAll();
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
