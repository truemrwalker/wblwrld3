//======================================================================================================================
// Controllers for HandsOnPortalSoftSensorApp for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('softSensorAppWebbleCtrl', function($scope, $log, Slot, Enum, $location, $timeout, wwConsts) {

	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		softSensorAppWrapper: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
	};

	$scope.displayText = "Loading the Soft Sensor environment. Please wait...";
	var preDebugMsg = "SoftSensorApp: ";

	var neededChildren = {};
	var loadedChildren = {};
	var webbleDefNames = {};
	var setupDone = false;
	var dataSourcesToListenTo = [];
	var listeners = [];
	var times = [];
	var dependents = [];
	var inputs = [];
	var mappingSet = 0;
	var mappingSourceName = "";
	var mappingSetName = "";
	var mappingSetIdx = 0;
	var plantSelections = {};
	var droppedSensors = [];



	//=== EVENT HANDLERS ================================================================


	//=== METHODS & FUNCTIONS ===========================================================


	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		//$log.log(preDebugMsg + "starting");

		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			var newLoadedWblId = eventData.targetId;
			//$log.log(preDebugMsg + "loadingWebble: " + newLoadedWblId);
			if(setupDone) { // check if data source Webble
				var thisChild = $scope.getWebbleByInstanceId(newLoadedWblId);
				var templateId = thisChild.scope().theWblMetadata['templateid'];

				if(templateId == "DigitalDashboardSmartDataSource") {
					dataSourcesToListenTo.push(newLoadedWblId);
					listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventDataInner){
						childSlotchange(eventDataInner.targetId, eventDataInner.slotName);
					}, newLoadedWblId, 'ProvidedFormatChanged'));

					listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventDataInner){
						childSlotchange(eventDataInner.targetId, eventDataInner.slotName);
					}, newLoadedWblId, 'DataChanged'));

					if(thisChild !== undefined && thisChild.scope() !== undefined) {
						checkDataSource(newLoadedWblId);
					}
				}

				if(neededChildren.hasOwnProperty(templateId)) {
					loadedChildren[templateId].push(newLoadedWblId);
					if(loadedChildren[templateId].length == 1 && neededChildren[templateId] > 1) {
						var original = thisChild;
						for(var copies = loadedChildren[templateId].length; copies < neededChildren[templateId]; copies++) {
							//$log.log(preDebugMsg + "making more " + templateId + " Webbles.");
							original.scope().duplicate({x: 15, y: 15}, undefined);
						}
					} else {
						checkIfAllWebblesAreAvailableAgain();
					}
				}
			} else {
				var thisChild = $scope.getWebbleByInstanceId(newLoadedWblId);
				var templateId = thisChild.scope().theWblMetadata['templateid'];

				if(templateId && templateId !== "") {
					addNewlyLoadedChild(newLoadedWblId, templateId);
				}
			}
		});

		$scope.set("softSensorAppWrapper:opacity", 0.1);
		
		loadWebbleDefs();
	};
	//===================================================================================


	//===================================================================================
	// Child Slot Changes
	// This method reacts on changes in certain slot changes in children.
	//===================================================================================
	function childSlotchange(childId, slotName) {
		//$log.log(preDebugMsg + "childSlotChange");
		if(slotName == 'DataChanged' || slotName == 'ProvidedFormatChanged') {
			checkDataSource(childId);
		}
	};
	//===================================================================================


	//===================================================================================
	// Add Newly Loaded Child
	// This method add newly loaded child to the list of webbles to be managed.
	//===================================================================================
	var addNewlyLoadedChild = function(webbleID, templateId) {
		//$log.log(preDebugMsg + "addNewlyLoadedChild, " + webbleID + " " + templateId);
		if(!setupDone) {
			if(loadedChildren.hasOwnProperty(templateId)) {
				loadedChildren[templateId].push(webbleID);
			} else {
				return;
			}

			var newWbl = $scope.getWebbleByInstanceId(webbleID);
			newWbl.scope().wblStateFlags.rootOpacityMemory = 0.0;
			newWbl.scope().set("root:opacity", 0);

			//$log.log(preDebugMsg + "check if we should duplicate " + templateId);
			// check if this is a newly loaded template and if we should duplicate this
			if(loadedChildren[templateId].length >= 1) {
				if(neededChildren[templateId] > loadedChildren[templateId].length) {
					var original = $scope.getWebbleByInstanceId(webbleID);
					for(var copies = loadedChildren[templateId].length; copies < neededChildren[templateId]; copies++) {
						//$log.log(preDebugMsg + "making more " + templateId + " Webbles.");
						original.scope().duplicate({x: 15, y: 15}, undefined);
					}
					return; // wait for the duplicates to arrive
				}
			}

			//$log.log(preDebugMsg + " check if we have everything");
			// check if all the Webbles we need are here yet
			var allHere = true;
			for (var type in neededChildren) {
				if (neededChildren.hasOwnProperty(type)) {
					//$log.log(preDebugMsg + "check if we have " + type + ", want " + neededChildren[type] + ", have " + loadedChildren[type].length);
					if(neededChildren[type] > loadedChildren[type].length) {
						//$log.log(preDebugMsg + "not enough " + type);
						allHere = false;

						if(loadedChildren[type].length == 0) {
							//$log.log(preDebugMsg + "Need to download Webble definition for " + type + "(" + webbleDefNames[type] + ")");
							$scope.downloadWebbleDef(webbleDefNames[type]);
						}
						break;
					}
				}
			}

			if(allHere) {
				//$log.log(preDebugMsg + "all Webbles loaded.");
				setAllWebbleSlotsEtc();
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Check Data Source
	// This method checks the data source.
	//===================================================================================
	function checkDataSource(webbleID) {
		//$log.log(preDebugMsg + "checkDataSource");
		var webble = $scope.getWebbleByInstanceId(webbleID);
		var format = webble.scope().gimme('ProvidedFormat');
		if(typeof format === 'string') {
			format = JSON.parse(format);
		}

		var dataSets = [];
		if(format && format.hasOwnProperty("format") && format.format.hasOwnProperty("sets")) {
			for(var s  = 0; s < format.format.sets.length; s++) {
				var set = format.format.sets[s];

				if(set.hasOwnProperty("idSlot") && set.hasOwnProperty("fieldList") && set["fieldList"].length > 0) {
					var ss = {};
					if(set.hasOwnProperty("name")) {
						ss.name = set.name;
					} else {
						ss.name = sourceName;
					}
					ss.fieldList = [];
					ss.idSlot = set.idSlot;

					for(var f = 0; f < set["fieldList"].length; f++) {
						var ff = {};
						ff.name = set["fieldList"][f].name;
						ff.type = set["fieldList"][f].type;
						ff.slot = set["fieldList"][f].slot;
						ss.fieldList.push(ff);
					}
					dataSets.push(ss);
				}
			}
		}

		if(dataSets.length > 0) {
			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			webble.scope().paste(dashboard);
			webble.scope().set("root:top", 395);
			webble.scope().set("root:left", 10);
			webble.scope().wblStateFlags.rootOpacityMemory = 0.95;
			webble.scope().set("root:opacity", 0.95);
			var sourceName = webble.scope().gimme("PluginName");

			for(s = 0; s < dataSets.length; s++) {
				var set = dataSets[s];
				var setName = sourceName;
				if(set.hasOwnProperty("name")) {
					setName = set.name;
				}
				var newTimes = [];
				var newDependents = [];
				var newInputs = [];
				var firstNonTime = true;

				for(var f = 0; f < set["fieldList"].length; f++) {
					var field = set.fieldList[f];

					if(field.type.indexOf("number") >= 0) {
						var n = field.name.toLowerCase();

						if(n.indexOf("time") >= 0) {
							// time, use as X axis for plots but do not send to regression Webble
							newTimes.push(f);
						} else {
							if(firstNonTime) {
								firstNonTime = false;
								newDependents.push(f);
							} else {
								newInputs.push(f);
							}
						}
					} else if(field.type.indexOf("date") >= 0) {
						var n = field.name.toLowerCase();

						if(n.indexOf("time") >= 0) {
							// time, use as X axis for plots but do not send to regression Webble
							newTimes.push(f);
						}
					}
				}

				if(newTimes.length > 0 && newDependents.length > 0 && newInputs.length > 0) {
					times = newTimes;
					dependents = newDependents;
					inputs = newInputs;
					mappingSet = set;
					mappingSourceName = sourceName;
					mappingSetName = setName;
					mappingSetIdx = s;

					loadMoreWebbles(times, dependents, inputs);
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Load More Webbles
	// This method load more Webbles.
	//===================================================================================
	function loadMoreWebbles (times, dependents, inputs) {
		neededChildren["DigitalDashboardPluginScatterPlots"] = dependents.length + inputs.length;

		if(neededChildren["DigitalDashboardPluginScatterPlots"] > 22) {
			neededChildren["DigitalDashboardPluginScatterPlots"] = 22;
		}

		neededChildren["DigitalDashboardPluginLinearRegression"] = 1;
		neededChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"] = 1;

		checkIfWebblesAreStillLoaded();
		duplicateNeededWebblesAgain();
		checkIfAllWebblesAreAvailableAgain();
	};
	//===================================================================================


	//===================================================================================
	// Check if Webbles are Still Loaded
	// This method checks if Webbles are still loaded.
	//===================================================================================
	function checkIfWebblesAreStillLoaded() {
		for(var templateId in neededChildren) {
			if(neededChildren[templateId] > 0) {
				var toRemove = [];

				for(var i = 0; i < loadedChildren[templateId].length; i++) {
					var webble = $scope.getWebbleByInstanceId(loadedChildren[templateId][i]);

					if(!webble) {
						toRemove.push(i);
					}
				}

				var removed = 0;
				for(i = 0; i < toRemove.length; i++) {
					loadedChildren[templateId].splice(toRemove[i] - removed, 1);
					removed++;
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Duplicate Needed Webbles Again
	// This method duplicates needed Webbles once again.
	//===================================================================================
	function duplicateNeededWebblesAgain() {
		for(var templateId in neededChildren) {
			if(neededChildren[templateId] > 0) {
				if(loadedChildren[templateId].length == 0) {
					$scope.downloadWebbleDef(webbleDefNames[type]);
					return;

				} else if(neededChildren[templateId] > loadedChildren[templateId].length) {
					var original = $scope.getWebbleByInstanceId(loadedChildren[templateId][0]);
					for(var copies = loadedChildren[templateId].length; copies < neededChildren[templateId]; copies++) {
						original.scope().duplicate({x: 15, y: 15}, undefined);
					}
					return;
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Check if All Webbles are Available Again
	// This method checks if all Webbles are once again available.
	//===================================================================================
	function checkIfAllWebblesAreAvailableAgain() {
		for(var templateId in neededChildren) {
			if(neededChildren[templateId] > 0) {
				if(neededChildren[templateId] > loadedChildren[templateId].length) {
					return;
				}
			}
		}
		initializeWebblesAndMapData();
	};
	//===================================================================================


	//===================================================================================
	// Initialize Webbles and Map Data
	// This method initialize all Webbles and map the data.
	//===================================================================================
	function initializeWebblesAndMapData() {
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginScatterPlots"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][i]);
			plugin.scope().set("DrawingArea:width", 180);
			plugin.scope().set("DrawingArea:height", 160);
			plugin.scope().set("DotSize", 1);
			plugin.scope().set('DrawMean', false);
			plugin.scope().set('Draw0', true);

			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			plugin.scope().paste(dashboard);
			if(i < 7) {
				plugin.scope().set("root:top", 180*i + 20);
				plugin.scope().set("root:left", 300);
			} else if(i < 14) {
				plugin.scope().set("root:top", 180*(i-7) + 20);
				plugin.scope().set("root:left", 500);
			} else {
				plugin.scope().set("root:top", 180*(i-14) + 20);
				plugin.scope().set("root:left", 700);
			}
		}

		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegression"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegression"][i]);
			plugin.scope().set("DrawingArea:width", 800);
			plugin.scope().set("DrawingArea:height", 300);

			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			plugin.scope().paste(dashboard);
			plugin.scope().set("ValueForMissingDataPoints", 0);
			plugin.scope().set("DotSize", 1);
			plugin.scope().set("root:top", 320*i + 20);
			plugin.scope().set("root:left", 900);
		}

		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][i]);
			plugin.scope().set("DrawingArea:width", 800);
			plugin.scope().set("DrawingArea:height", 300);

			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			plugin.scope().paste(dashboard);
			plugin.scope().set("ValueForMissingDataPoints", 0);
			plugin.scope().set("DotSize", 1);
			plugin.scope().set("root:top", 320*loadedChildren["DigitalDashboardPluginLinearRegression"].length + 320*i + 20);
			plugin.scope().set("root:left", 900);
		}
		$timeout(function(){buildMapping(times, dependents, inputs, mappingSet, mappingSourceName, mappingSetName, mappingSetIdx, plantSelections, droppedSensors);}, 1); // the slot sets have not gone through for the name changes on the plugins, so we have to wait. ugly hack solution to wait for other changes to finish
	};
	//===================================================================================


	//===================================================================================
	// Build Mapping
	// This method builds the data mapping.
	//===================================================================================
	function buildMapping(times, dependents, inputs, set, sourceName, setName, setIdx, plantSelections, droppedSensors) {
		//$log.log(preDebugMsg + "buildMapping");
		if(times.length <= 0 || dependents.length <= 0 || inputs.length <= 0 || loadedChildren["DigitalDashboard"][0] <= 0 || loadedChildren["DigitalDashboardPluginScatterPlots"][0] <= 0 || loadedChildren["DigitalDashboardPluginLinearRegression"][0] <= 0 || loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][0] <= 0) {
			return;
		}

		var mapping = {};
		mapping.plugins = [];
		var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
		var colors = dashboard.scope().gimme("Colors");
		var clickedColors = {};
		for(var cset in colors) {
			clickedColors[cset] = colors[cset];
		}
		clickedColors["skin"] = {"color":"#F6A2B3","border":"#DC143C","gradient":[{"pos":0,"color":"#F48A9F"},{"pos":0.1,"color":"#FDE8EC"},{"pos":0.9,"color":"#FDE8EC"}, {"pos":1,"color":"#F48A9F"}]};

		// time and dependent
		var plugin = {};
		plugin.grouping = true;
		plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][0]).scope().gimme("PluginName");
		plugin.sets = [{"fields":[{"name":"dataX","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"FirstField"}],"template":false,"added":false},{"name":"dataY","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"Field2"}],"template":false,"added":false}]}];
		var addDependent = true;
		if(droppedSensors.length >= 2) {
			var found0 = false;
			var found1 = false;
			for(var i = 0; i < inputs.length; i++) {
				if(set.fieldList[inputs[i]].name == droppedSensors[0]) {
					plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}];
					found0 = true;
				}
				if(set.fieldList[inputs[i]].name == droppedSensors[1]) {
					plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}];
					found1 = true;
				}

				if(found1 && found0) {
					addDependent = false;
					break;
				}
			}
		}

		if(addDependent) {
			plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[times[0]].name}];
			plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[dependents[0]].name}];
		}

		mapping.plugins.push(plugin);

		// all input paramenters
		for(var i = 0; i < inputs.length; i++) {
			if(i + 1 < loadedChildren["DigitalDashboardPluginScatterPlots"].length) {
				var webble = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][1+i]);

				if(!plantSelections.hasOwnProperty(set.fieldList[inputs[i]].name)
					|| plantSelections[set.fieldList[inputs[i]].name]) {
					webble.scope().set("GroupColors", colors);
				} else {
					webble.scope().set("GroupColors", clickedColors);
				}

				plugin = {};
				plugin.grouping = true;
				plugin.name = webble.scope().gimme("PluginName");
				plugin.sets = [{"fields":[{"name":"dataX","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"FirstField"}],"template":false,"added":false},{"name":"dataY","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"Field2"}],"template":false,"added":false}]}];
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[times[0]].name}];
				plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}];

				mapping.plugins.push(plugin);
			}
		}

		// linear regression
		plugin = {};
		plugin.grouping = true;
		plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegression"][0]).scope().gimme("PluginName");
		plugin.sets = [{"fields":[{"name":"Dependent","assigned":[],"template":false,"added":false},{"name":"Regressor 1","assigned":[],"template":false,"added":false},{"name":"Optional Regressors","assigned":[],"template":true,"added":false}]}];
		plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[dependents[0]].name}];
		var first = true;
		for(i = 0; i < inputs.length; i++) {
			if(!plantSelections.hasOwnProperty(set.fieldList[inputs[i]].name) || plantSelections[set.fieldList[inputs[i]].name]) {
				if(first) {
					plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}];
					first = false;
				} else {
					plugin.sets[0].fields.push({"name":"Optional Regressors","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}],"template":false,"added":true});
				}
			}
		}
		mapping.plugins.push(plugin);

		// linear regression, regularization
		plugin = {};
		plugin.grouping = true;
		plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][0]).scope().gimme("PluginName");
		plugin.sets = [{"fields":[{"name":"Dependent","assigned":[],"template":false,"added":false},{"name":"Regressor 1","assigned":[],"template":false,"added":false},{"name":"Optional Regressors","assigned":[],"template":true,"added":false}]}];
		plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[dependents[0]].name}];
		var first = true;
		for(i = 0; i < inputs.length; i++) {
			if(!plantSelections.hasOwnProperty(set.fieldList[inputs[i]].name) || plantSelections[set.fieldList[inputs[i]].name]) {
				if(first) {
					plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}];
					first = false;
				} else {
					plugin.sets[0].fields.push({"name":"Optional Regressors","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[inputs[i]].name}],"template":false,"added":true});
				}
			}
		}
		mapping.plugins.push(plugin);

		//$log.log(preDebugMsg + "build this mapping: " + JSON.stringify(mapping));
		$timeout(function(){$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]).scope().set("Mapping", mapping); resetAllSelections();}, 1);
	};
	//===================================================================================


	//===================================================================================
	// Clear All Plots
	// This method clear all plots.
	//===================================================================================
	function clearAllPlots() {
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginScatterPlots"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][i]);
			plugin.scope().set('DataValuesSetFilled', []);
		}
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegression"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegression"][i]);
			plugin.scope().set('DataValuesSetFilled', []);
		}
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][i]);
			plugin.scope().set('DataValuesSetFilled', []);
		}
	};
	//===================================================================================


	//===================================================================================
	// Reset All Selections
	// This method resets all selections.
	//===================================================================================
	function resetAllSelections() {
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginScatterPlots"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][i]);
			plugin.scope().set("SelectAll", !plugin.scope().gimme("SelectAll"));
		}
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegression"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegression"][i]);
			plugin.scope().set("SelectAll", !plugin.scope().gimme("SelectAll"));
		}
		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][i]);
			plugin.scope().set("SelectAll", !plugin.scope().gimme("SelectAll"));
		}
	};
	//===================================================================================


	//===================================================================================
	// Set All Webble Slots Etc
	// This method sets all the Webble slots and other things.
	//===================================================================================
	var setAllWebbleSlotsEtc = function() {
		if(setupDone) {
			return;
		}

		for (var t in loadedChildren) {
			if (loadedChildren.hasOwnProperty(t)) {
				for(var w = 0; w < loadedChildren[t].length; w++) {
					var wbl = $scope.getWebbleByInstanceId(loadedChildren[t][w]);
					wbl.scope().wblStateFlags.rootOpacityMemory = 1;
					wbl.scope().set("root:opacity", 1);
				}
			}
		}

		// Digital Dashboard
		var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
		dashboard.scope().set("root:top", 0);
		dashboard.scope().set("root:left", 0);
		dashboard.scope().set("dashboardBackgroundBox:opacity", 0.05);
		dashboard.scope().set("Colors", {"skin":{"color":"#ffe6cc","border":"#ffa94d","gradient":[{"pos":0,"color":"#fff3e6"},{"pos":0.75,"color":"#ffe6cc"},{"pos":1,"color":"#ffdab3"}]},"selection":{"color":"#FFEBCD","border":"#FFA500","gradient":[{"pos":0,"color":"#FFFBF5"},{"pos":1,"color":"#FFEBCD"}]},"groups":{"0":{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},"1":{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},"6":{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},"3":{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},"4":{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},"5":{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},"2":{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},"7":{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},"8":{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},"9":{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},"10":{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},"11":{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},"12":{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},"13":{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},"14":{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}});

		for(var i = 0; i < loadedChildren["DigitalDashboardPluginScatterPlots"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][i]);
			plugin.scope().set("DrawingArea:width", 180);
			plugin.scope().set("DrawingArea:height", 160);
			plugin.scope().paste(dashboard);

			if(i < 7) {
				plugin.scope().set("root:top", 180*i + 20);
				plugin.scope().set("root:left", 300);
			} else if(i < 14) {
				plugin.scope().set("root:top", 180*(i-7) + 20);
				plugin.scope().set("root:left", 500);
			} else {
				plugin.scope().set("root:top", 180*(i-14) + 20);
				plugin.scope().set("root:left", 700);
			}
		}

		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegression"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegression"][i]);
			plugin.scope().set("DrawingArea:width", 800);
			plugin.scope().set("DrawingArea:height", 300);
			plugin.scope().paste(dashboard);
			plugin.scope().set("ValueForMissingDataPoints", 0);
			plugin.scope().set("DotSize", 1);
			plugin.scope().set("root:top", 320*i + 20);
			plugin.scope().set("root:left", 900);
		}

		for(var i = 0; i < loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"][i]);
			plugin.scope().set("DrawingArea:width", 800);
			plugin.scope().set("DrawingArea:height", 300);
			plugin.scope().paste(dashboard);
			plugin.scope().set("ValueForMissingDataPoints", 0);
			plugin.scope().set("DotSize", 1);
			plugin.scope().set("root:top", 320*loadedChildren["DigitalDashboardPluginLinearRegression"].length + 320*i + 20);
			plugin.scope().set("root:left", 900);
		}

		for(var i = 0; i < loadedChildren["DigitalDashboardSmartDataSource"].length; i++) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardSmartDataSource"][i]);
			plugin.scope().wblStateFlags.rootOpacityMemory = 1;
			plugin.scope().set("root:opacity", 1);
			plugin.scope().set("backgroundBox:height", "75px");
			plugin.scope().set("PluginName", "Data");
			plugin.scope().paste(dashboard);
			plugin.scope().set("root:top", 395);
			plugin.scope().set("root:left", 10);

			var id = loadedChildren["DigitalDashboardSmartDataSource"][i];
			dataSourcesToListenTo.push(loadedChildren["DigitalDashboardSmartDataSource"][i]);
			listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventDataInner){
				childSlotchange(eventDataInner.targetId, eventDataInner.slotName);
			}, id, 'ProvidedFormatChanged'));

			listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventDataInner){
				childSlotchange(eventDataInner.targetId, eventDataInner.slotName);
			}, id, 'DataChanged'));

			checkDataSource(loadedChildren["DigitalDashboardSmartDataSource"][i]);
		}

		for(var i = 0; i < loadedChildren["SoftSensorAppPlantVisualizer"].length; i++) {
			//$log.log(preDebugMsg + "found a plant visualizer");
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["SoftSensorAppPlantVisualizer"][i]);
			plugin.scope().set("DrawingArea:width", 250);
			plugin.scope().set("DrawingArea:height", 350);
			plugin.scope().set("root:top", 20);
			plugin.scope().set("root:left", 10);
			plugin.scope().set("PlantLayout", [["line", 0.1, 0.25, 0.3, 0.25],["line", 0.1, 0.25, 0.3, 0.25],["rectangle", 0.3,0.15, 0.2,0.65],["line", 0.05,0.55, 0.2,0.55],["line", 0.25,0.5, 0.25,0.4, 0.3,0.4],["line", 0.25,0.6, 0.25,0.65, 0.3,0.65], ["ellipse", 0.2,0.5, 0.1,0.1],["line", 0.4,0.15, 0.4,0.1, 0.7,0.1, 0.7,0.2], ["ellipse", 0.6,0.2, 0.2,0.2], ["line", 0.7,0.4, 0.7,0.45], ["ellipse", 0.55,0.45, 0.3,0.2], ["line", 0.7,0.65, 0.7,0.75, 0.55,0.75, 0.55,0.2, 0.5,0.2], ["line", 0.7,0.7, 0.95,0.7], ["line", 0.4,0.8, 0.4,0.9, 0.6, 0.9], ["ellipse", 0.6, 0.85, 0.1,0.1], ["line", 0.7,0.9, 0.95,0.9]]);
			plugin.scope().set("Sensors", [["F1", 0.2,0.25], ["T3", 0.1,0.55], ["F4", 0.17,0.55], ["T4", 0.27,0.4], ["T5", 0.3,0.35], ["P2", 0.5,0.3], ["T6", 0.5,0.4], ["T1", 0.5,0.1], ["P1", 0.56,0.1], ["F5", 0.65,0.75], ["L1", 0.85,0.55], ["F3", 0.85,0.7], ["L2", 0.7,0.85], ["T2", 0.45,0.9], ["F2", 0.75,0.9], ["F6", 0.9,0.9] ]);
			plugin.scope().set("DotSize", 7);
			plugin.scope().set("GroupColors", dashboard.scope().gimme("Colors"));
			plugin.scope().set("SelectionsChanged", false);

			var id = loadedChildren["SoftSensorAppPlantVisualizer"][i];
			listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
				plantSelectionsChanged(eventData.targetId, eventData.slotName);
			}, id));
		}

		$scope.getWebbleByInstanceId(loadedChildren["HoPSupport"][0]).scope().set("root:opacity", 0.2);

		setupDone = true;
		$scope.set("softSensorAppWrapper:opacity", 0.2);
		$scope.displayText = "Soft Sensor App Loaded";

		if(loadedChildren["DigitalDashboardSmartDataSource"].length > 0) {
			var plugin = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardSmartDataSource"][0]);
			plugin.scope().set("Data", {"fieldNames":["time","BOTTOMothers","T1","T2","T3","T4","T5","T6","T7","P1","P2","L1","L2","F1","F2","F3","F4","F5","F6"],"fieldTypes":["date","number","number","number","number","number","number","number","number","number","number","number","number","number","number","number","number","number","number"],"columns":[[946652400000,978274800000,980953200000,983372400000,986050800000,988642800000,991321200000,993913200000,996591600000,999270000000,1001862000000,1004540400000,1007132400000,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1956495600000,1988118000000,2019654000000,2051190000000,2082726000000,2114348400000,2145884400000,2177420400000,2208956400000,2240578800000,2272114800000,2303650800000,2335186800000,2366809200000,2398345200000,2429881200000,2461417200000,2493039600000,-631184400000,-599648400000,-568112400000,-536490000000,-504954000000,-473418000000,-441882000000,-410259600000,-378723600000,-347187600000,-315651600000,-284029200000,-252493200000,-220957200000,-189421200000,-157798800000,-126262800000,-94726800000,-63190800000,-31568400000,-32400000,31503600000,63039600000,94662000000,126198000000,157734000000,189270000000,220892400000,252428400000,283964400000,315500400000,347122800000,378658800000,410194800000,441730800000,473353200000,504889200000,536425200000,567961200000,599583600000,631119600000,662655600000,694191600000,725814000000,757350000000,788886000000,820422000000,852044400000,883580400000,915116400000,-59011491600000,-58979955600000,-58948419600000,-58916883600000,-58885347600000,-58853725200000,-58822189200000,-58790653200000,-58759117200000,-58727494800000,-58695958800000,-58664422800000,-58632886800000,-58601264400000,-58569728400000,-58538192400000,-58506656400000,-58475034000000,-58443498000000,-58411962000000,-58380426000000,-58348803600000,-58317267600000,-58285731600000,-58254195600000,-58222573200000,-58191037200000,-58159501200000,-58127965200000,-58096342800000,-58064806800000,-58033270800000,-58001734800000,-57970112400000,-57938576400000,-57907040400000,-57875504400000,-57843882000000,-57812346000000,-57780810000000,-57749274000000,-57717651600000,-57686115600000,-57654579600000,-57623043600000,-57591421200000,-57559885200000,-57528349200000,-57496813200000,-57465190800000,-57433654800000,-57402118800000,-57370582800000,-57338960400000,-57307424400000,-57275888400000,-57244352400000,-57212730000000,-57181194000000,-57149658000000,-57118122000000,-57086499600000,-57054963600000,-57023427600000,-56991891600000,-56960269200000,-56928733200000,-56897197200000,-56865661200000,-56834038800000,-56802502800000,-56770966800000,-56739430800000,-56707808400000,-56676272400000,-56644736400000,-56613200400000,-56581578000000,-56550042000000,-56518506000000,-56486970000000,-56455347600000,-56423811600000,-56392275600000,-56360739600000,-56329117200000,-56297581200000,-56266045200000,-56234509200000,-56202886800000,-56171350800000,-56139814800000,-56108278800000,-56076656400000,-56045120400000,-56013584400000,-55982048400000,-55950426000000,-55918890000000,-55887354000000,-55855818000000,-55824282000000,-55792746000000,-55761210000000,-55729674000000,-55698051600000,-55666515600000,-55634979600000,-55603443600000,-55571821200000,-55540285200000,-55508749200000,-55477213200000,-55445590800000,-55414054800000,-55382518800000,-55350982800000,-55319360400000,-55287824400000,-55256288400000,-55224752400000,-55193130000000,-55161594000000,-55130058000000,-55098522000000,-55066899600000,-55035363600000,-55003827600000,-54972291600000,-54940669200000,-54909133200000,-54877597200000,-54846061200000,-54814438800000,-54782902800000,-54751366800000,-54719830800000,-54688208400000,-54656672400000,-54625136400000,-54593600400000,-54561978000000,-54530442000000,-54498906000000,-54467370000000,-54435747600000,-54404211600000,-54372675600000,-54341139600000,-54309517200000,-54277981200000,-54246445200000,-54214909200000,-54183286800000,-54151750800000,-54120214800000,-54088678800000,-54057056400000,-54025520400000,-53993984400000,-53962448400000,-53930826000000,-53899290000000,-53867754000000,-53836218000000,-53804595600000,-53773059600000,-53741523600000,-53709987600000,-53678365200000,-53646829200000,-53615293200000,-53583757200000,-53552134800000,-53520598800000,-53489062800000,-53457526800000,-53425904400000,-53394368400000,-53362832400000,-53331296400000,-53299674000000,-53268138000000,-53236602000000,-53205066000000,-53173443600000,-53141907600000,-53110371600000,-53078835600000,-53047213200000,-53015677200000,-52984141200000,-52952605200000,-52920982800000,-52889446800000,-52857910800000,-52826374800000,-52794752400000,-52763216400000,-52731680400000],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01697514,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01784433,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01817963,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01835069,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0184946,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01865395,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01880694,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01895573,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0190538,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01910192],[87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8,87.8],[53.096714,53.06852,53.031137,52.994132,52.96599,52.954092,52.958675,52.985324,53.026334,53.074587,53.122236,53.160492,53.183001,53.188546,53.172511,53.138582,53.094355,53.048387,53.008885,52.983553,52.975412,52.981286,53.005757,53.039097,53.074748,53.105434,53.123182,53.126032,53.112051,53.079509,53.036559,52.989713,52.947004,52.915179,52.899308,52.898783,52.909698,52.934776,52.963752,52.989625,53.007284,53.009039,53.001607,52.974521,52.936338,52.893067,52.851382,52.818116,52.797252,52.791772,52.795276,52.814785,52.838858,52.862939,52.880099,52.885363,52.882969,52.862333,52.830388,52.791996,52.753538,52.720383,52.69784,52.688098,52.687821,52.702374,52.723045,52.745231,52.762745,52.7707,52.77077,52.758483,52.733246,52.700378,52.665764,52.634686,52.611543,52.599921,52.599622,52.606151,52.623371,52.643225,52.660532,52.673119,52.674264,52.668315,52.648817,52.621801,52.592323,52.563393,52.541223,52.528222,52.524024,52.527173,52.540361,52.558955,52.576173,52.588696,52.593454,52.593468,52.579298,52.557498,52.531929,52.50615,52.484145,52.469628,52.464784,52.464757,52.475497,52.490593,52.507431,52.52091,52.527424,52.530549,52.521379,52.504617,52.483142,52.460365,52.439878,52.425791,52.417975,52.417835,52.423308,52.436583,52.451019,52.4643,52.473154,52.477579,52.474289,52.461534,52.443986,52.42422,52.405384,52.390617,52.381823,52.381445,52.381881,52.393252,52.406159,52.419231,52.42869,52.433279,52.433309,52.426231,52.412223,52.395439,52.378507,52.364044,52.354282,52.353241,52.353239,52.359459,52.369824,52.382425,52.391565,52.398967,52.400317,52.396888,52.3861,52.372449,52.3576,52.343767,52.333283,52.32859,52.328479,52.332393,52.341038,52.352938,52.362449,52.368929,52.371787,52.371792,52.364599,52.353195,52.340541,52.32741,52.317345,52.312509,52.312455,52.312455,52.318216,52.328029,52.337423,52.344822,52.346889,52.346892,52.346892,52.337067,52.326308,52.315566,52.304608,52.299348,52.295372,52.295353,52.299544,52.307841,52.316553,52.324443,52.329525,52.329901,52.329902,52.323164,52.314615,52.304264,52.294976,52.288072,52.286171,52.286168,52.286168,52.290391,52.298816,52.306727,52.31181,52.312013,52.312013,52.312013,52.304407,52.296089,52.28685,52.280499,52.276505,52.276492,52.276492,52.276492,52.284445,52.290384,52.2971,52.297814,52.302006,52.302036,52.294744,52.28729,52.279365,52.272224,52.267026,52.266709,52.266708,52.266708,52.270904,52.277719,52.283421,52.287427,52.288133,52.288135,52.285732,52.28051,52.273138,52.266752,52.26112,52.258836,52.256742,52.256738,52.260667,52.265122,52.269433,52.273709,52.277933,52.277984,52.277984,52.274134,52.267271,52.262299,52.256599,52.254265,52.250351,52.250336,52.250336,52.254574,52.258833,52.263078,52.267301,52.267323,52.267323,52.267323,52.26336,52.256454,52.251897,52.247889,52.247769,52.247768,52.247768,52.247768,52.251793,52.25587,52.256247,52.26047,52.260477,52.260478,52.25698,52.25288,52.248836,52.244903,52.241169,52.240966,52.240966,52.240966,52.244799,52.247633,52.249457,52.253607],[105.16053,105.09205,105.02,104.95577,104.91136,104.88739,104.88483,104.90739,104.94649,104.993,105.03649,105.06737,105.07907,105.06885,105.03026,104.97618,104.91537,104.85861,104.8174,104.79344,104.78803,104.80295,104.83576,104.87732,104.91859,104.95106,104.96759,104.96602,104.94,104.89627,104.84509,104.7941,104.75443,104.73039,104.72071,104.72952,104.75574,104.79157,104.82966,104.86191,104.88163,104.88499,104.87136,104.83578,104.79212,104.7471,104.70903,104.68462,104.67195,104.67475,104.69476,104.72506,104.75922,104.7901,104.81188,104.81925,104.81339,104.78866,104.75168,104.71173,104.67822,104.65187,104.63694,104.63492,104.64882,104.67381,104.70417,104.73354,104.75619,104.76765,104.76699,104.75078,104.71979,104.68576,104.65398,104.62875,104.61279,104.60786,104.61591,104.63607,104.66221,104.68947,104.71217,104.72575,104.72939,104.71941,104.69724,104.66833,104.63877,104.6146,104.59734,104.59062,104.59365,104.60855,104.63063,104.65506,104.67711,104.69239,104.69767,104.69442,104.6791,104.65553,104.62856,104.60574,104.58786,104.57923,104.57784,104.58855,104.60658,104.6281,104.64884,104.66485,104.67266,104.67285,104.66241,104.64398,104.62203,104.59991,104.58211,104.57099,104.5697,104.5742,104.58837,104.60669,104.62564,104.64158,104.65128,104.65341,104.64825,104.6341,104.61559,104.59587,104.57862,104.56662,104.56165,104.56393,104.57498,104.59053,104.60744,104.62283,104.63372,104.6382,104.63662,104.62652,104.61159,104.59453,104.57815,104.56573,104.56012,104.55829,104.56598,104.57866,104.59323,104.60763,104.61873,104.62447,104.62466,104.61886,104.60684,104.59213,104.57726,104.56475,104.55719,104.55574,104.55836,104.56818,104.58079,104.59399,104.60485,104.61188,104.61385,104.61129,104.60183,104.58972,104.57631,104.56452,104.55607,104.55249,104.55342,104.56057,104.57072,104.58237,104.59331,104.60112,104.60478,104.60489,104.59814,104.58813,104.5766,104.56524,104.55639,104.55152,104.55074,104.5549,104.56352,104.57367,104.58347,104.59139,104.5959,104.59678,104.59341,104.58558,104.57545,104.56557,104.55678,104.55179,104.54952,104.55036,104.55652,104.56486,104.57386,104.5815,104.58673,104.58853,104.58831,104.58233,104.57385,104.56477,104.55623,104.55066,104.54828,104.54827,104.55063,104.55718,104.56503,104.57226,104.57821,104.58074,104.58077,104.57801,104.57135,104.56351,104.55535,104.5492,104.54487,104.54473,104.54541,104.55069,104.55753,104.56441,104.57022,104.57371,104.57394,104.57394,104.56866,104.56238,104.55526,104.54951,104.54499,104.5427,104.54269,104.54564,104.55104,104.55679,104.56295,104.56678,104.56849,104.56849,104.56663,104.56146,104.55556,104.54924,104.54453,104.54192,104.54185,104.54201,104.54638,104.55196,104.55735,104.56157,104.56442,104.56455,104.56455,104.56041,104.55496,104.54951,104.54497,104.54232,104.54026,104.54009,104.54312,104.54774,104.55251,104.5565,104.5593,104.56095,104.56095,104.55915,104.55516,104.55056,104.54618,104.54328,104.54106,104.54104,104.54104,104.54494,104.54884,104.55323,104.55607,104.55827],[183.87156,183.87156,183.87156,183.85321,183.87156,183.88991,183.88991,183.90826,183.90826,183.90826,183.92661,183.94495,183.94495,183.94495,183.94495,183.94495,183.9633,183.94495,183.94495,183.94495,183.92661,183.94495,183.94495,183.94495,183.94495,183.94495,183.92661,183.94495,183.94495,183.94495,183.92661,183.90826,183.92661,183.90826,183.90826,183.88991,183.88991,183.87156,183.85321,183.83486,183.83486,183.81651,183.81651,183.81651,183.81651,183.81651,183.79817,183.79817,183.77982,183.77982,183.79817,183.79817,183.77982,183.77982,183.79817,183.77982,183.79817,183.79817,183.79817,183.79817,183.79817,183.79817,183.81651,183.81651,183.81651,183.81651,183.83486,183.81651,183.81651,183.81651,183.81651,183.81651,183.83486,183.83486,183.83486,183.85321,183.87156,183.88991,183.90826,183.92661,183.90826,183.88991,183.88991,183.88991,183.90826,183.92661,183.92661,183.92661,183.94495,183.94495,183.94495,183.94495,183.94495,183.92661,183.94495,183.94495,183.94495,183.92661,183.90826,183.90826,183.92661,183.90826,183.92661,183.92661,183.92661,183.92661,183.92661,183.92661,183.94495,183.94495,183.9633,183.94495,183.92661,183.94495,183.94495,183.94495,183.9633,183.94495,183.94495,183.94495,183.94495,183.94495,183.92661,183.92661,183.90826,183.92661,183.94495,183.9633,183.9633,183.94495,183.9633,183.98165,183.9633,183.9633,183.9633,183.98165,184,184,184,184,184,183.98165,183.98165,183.9633,183.9633,183.94495,183.92661,183.92661,183.92661,183.94495,183.92661,183.92661,183.92661,183.90826,183.92661,183.94495,183.94495,183.92661,183.94495,183.92661,183.92661,183.90826,183.92661,183.90826,183.90826,183.88991,183.88991,183.87156,183.88991,183.88991,183.90826,183.90826,183.92661,183.94495,183.94495,183.94495,183.94495,183.94495,183.94495,183.94495,183.92661,183.90826,183.92661,183.92661,183.90826,183.92661,183.90826,183.88991,183.90826,183.90826,183.88991,183.88991,183.88991,183.88991,183.88991,183.87156,183.87156,183.87156,183.87156,183.87156,183.87156,183.85321,183.85321,183.83486,183.83486,183.83486,183.81651,183.83486,183.83486,183.83486,183.83486,183.81651,183.81651,183.79817,183.81651,183.81651,183.81651,183.79817,183.77982,183.77982,183.76147,183.74312,183.74312,183.74312,183.74312,183.74312,183.74312,183.74312,183.72477,183.72477,183.74312,183.74312,183.72477,183.74312,183.76147,183.76147,183.74312,183.74312,183.72477,183.70642,183.68807,183.70642,183.72477,183.74312,183.74312,183.74312,183.74312,183.74312,183.74312,183.76147,183.76147,183.74312,183.76147,183.76147,183.76147,183.76147,183.74312,183.76147,183.76147,183.76147,183.76147,183.76147,183.76147,183.74312,183.74312,183.72477,183.74312,183.76147,183.76147,183.76147,183.76147,183.76147,183.77982,183.76147,183.77982,183.76147,183.77982,183.76147,183.74312,183.74312,183.72477,183.74312,183.76147,183.76147,183.76147,183.74312,183.74312,183.74312,183.76147,183.77982,183.76147,183.77982,183.77982,183.77982,183.76147,183.76147,183.76147,183.74312,183.74312,183.74312],[105.27414,105.20581,105.13294,105.06792,105.02125,105.00017,105.00588,105.0349,105.07895,105.12831,105.17216,105.20107,105.20839,105.19175,105.15326,105.09868,105.03723,104.97966,104.93578,104.91279,104.91327,104.93534,104.97284,105.01733,105.05954,105.09073,105.10407,105.09642,105.06835,105.02481,104.97261,104.92103,104.87909,104.85417,104.84968,104.86471,104.89528,104.93432,104.97369,105.00537,105.02265,105.02206,105.00244,104.96797,104.92388,104.87794,104.83832,104.8119,104.80291,104.81181,104.83591,104.86916,104.90502,104.93611,104.95603,104.96079,104.94882,104.92237,104.88585,104.84545,104.8084,104.78156,104.76929,104.77304,104.79088,104.81884,104.85101,104.88092,104.90239,104.91137,104.90563,104.8861,104.8565,104.8216,104.78771,104.76109,104.7464,104.74571,104.75825,104.78127,104.80949,104.83747,104.85964,104.87156,104.87088,104.85736,104.83359,104.80421,104.77392,104.74845,104.73223,104.72801,104.73591,104.75373,104.77773,104.80325,104.82524,104.83922,104.84256,104.83455,104.81643,104.79193,104.765,104.74073,104.72364,104.71641,104.72007,104.7335,104.75358,104.77631,104.79731,104.81258,104.81888,104.81512,104.80161,104.78134,104.75819,104.73591,104.7186,104.70932,104.70963,104.7187,104.73487,104.75457,104.77413,104.78961,104.79815,104.798,104.78917,104.77301,104.7532,104.73304,104.71599,104.70524,104.70263,104.70845,104.72118,104.73802,104.75576,104.77103,104.78099,104.78377,104.77858,104.76682,104.75057,104.73258,104.71634,104.70463,104.69984,104.70229,104.71177,104.72583,104.74134,104.75581,104.76639,104.77101,104.76871,104.76026,104.74692,104.73134,104.71606,104.70414,104.69767,104.69776,104.70384,104.71511,104.72867,104.74215,104.75291,104.75909,104.75934,104.7537,104.743,104.72975,104.71608,104.70439,104.69683,104.69482,104.69858,104.70699,104.71819,104.73056,104.74135,104.74856,104.75098,104.74787,104.74016,104.72924,104.71695,104.70573,104.69745,104.69367,104.69509,104.70112,104.71078,104.72144,104.73152,104.73906,104.74276,104.7418,104.73644,104.72741,104.71679,104.7065,104.69803,104.69309,104.69257,104.69618,104.70357,104.71252,104.72184,104.72961,104.73427,104.73476,104.73159,104.72472,104.71577,104.70638,104.6981,104.69242,104.69039,104.69234,104.69727,104.70466,104.71297,104.72039,104.72588,104.7279,104.72606,104.72146,104.71412,104.7057,104.69761,104.69126,104.68807,104.6884,104.69199,104.69824,104.70548,104.71246,104.71802,104.72106,104.7208,104.71769,104.71216,104.70537,104.69806,104.6918,104.68774,104.68676,104.68878,104.69285,104.69873,104.70504,104.71094,104.71497,104.71605,104.71466,104.7108,104.70486,104.6986,104.69248,104.68811,104.68592,104.68637,104.68927,104.69425,104.69995,104.70529,104.70968,104.71191,104.71183,104.70893,104.70414,104.69852,104.69318,104.68862,104.68608,104.68539,104.68708,104.69072,104.69547,104.70036,104.70449,104.70744,104.70794,104.70687,104.70381,104.69932,104.69457,104.69006,104.68689,104.68545,104.68615,104.68864,104.69241,104.69689,104.70094,104.70387,104.70546],[88.8469,88.85107,88.862638,88.863865,88.838935,88.780882,88.686755,88.561663,88.415989,88.266057,88.127443,88.014536,87.93672,87.897426,87.895984,87.920738,87.95635,87.986969,87.996625,87.977336,87.924548,87.840924,87.733716,87.61657,87.504319,87.410359,87.344641,87.31218,87.312902,87.341255,87.383438,87.424647,87.451039,87.453504,87.42606,87.3693,87.288245,87.193655,87.098839,87.016104,86.955595,86.923501,86.92078,86.94518,86.985538,87.029492,87.063916,87.078937,87.068551,87.031049,86.970916,86.894113,86.813303,86.739685,86.68317,86.650797,86.644277,86.663589,86.700193,86.743564,86.781486,86.805544,86.808087,86.786251,86.742851,86.681776,86.613379,86.548413,86.495799,86.462769,86.452511,86.465409,86.496906,86.537382,86.576606,86.605312,86.616996,86.607563,86.577469,86.530199,86.473412,86.416435,86.367837,86.33476,86.321481,86.328014,86.352385,86.388919,86.426987,86.458653,86.476871,86.476874,86.457813,86.422346,86.37485,86.32473,86.279649,86.246649,86.229895,86.230888,86.2491,86.279875,86.314998,86.346412,86.367913,86.374165,86.363558,86.337385,86.298687,86.254836,86.213241,86.180515,86.161212,86.157529,86.168614,86.192513,86.223703,86.254518,86.277862,86.289026,86.285443,86.267321,86.23678,86.198761,86.160815,86.128492,86.106919,86.09946,86.105016,86.122846,86.149424,86.177956,86.202296,86.217103,86.21934,86.208945,86.187816,86.157594,86.124614,86.094904,86.073043,86.062658,86.064028,86.078035,86.10036,86.125839,86.149022,86.164954,86.170645,86.164638,86.148511,86.123607,86.093854,86.065174,86.042276,86.028695,86.025785,86.034093,86.051515,86.073744,86.095453,86.112389,86.121176,86.120091,86.108553,86.088535,86.062723,86.036458,86.013526,85.99837,85.991998,85.995744,86.00786,86.026498,86.046726,86.064346,86.075586,86.078508,86.07289,86.058692,86.037512,86.014637,85.993425,85.977433,85.969031,85.968853,85.977735,85.993009,86.010697,86.027358,86.039652,86.045069,86.042042,86.032362,86.016358,85.996002,85.975876,85.959162,85.948611,85.945898,85.949458,85.959417,85.974035,85.989099,86.001092,86.008031,86.008365,86.001242,85.988322,85.970784,85.952375,85.936038,85.924223,85.918283,85.919737,85.926835,85.938791,85.952526,85.964716,85.972619,85.97486,85.970878,85.960631,85.945849,85.928512,85.912044,85.899165,85.891346,85.888713,85.892818,85.902073,85.91388,85.925484,85.934248,85.939081,85.937936,85.932181,85.922136,85.908551,85.893471,85.880632,85.871268,85.866816,85.867495,85.873943,85.884042,85.89476,85.904075,85.910231,85.911965,85.909352,85.901434,85.890103,85.87702,85.86505,85.856009,85.850078,85.849726,85.853465,85.86095,85.870875,85.880194,85.887783,85.891735,85.890455,85.88568,85.877517,85.866688,85.855197,85.845893,85.839801,85.837267,85.838485,85.843173,85.850441,85.858962,85.866369,85.871546,85.872942,85.870447,85.864951,85.856704,85.847067,85.837873,85.831234,85.827343,85.827981,85.831348,85.837406,85.845271,85.852945,85.858775,85.861686,85.861217,85.858115,85.852591,85.845069,85.836721,85.828803,85.824469],[72.66197,72.60663,72.553056,72.504664,72.463552,72.431617,72.408031,72.391262,72.378246,72.36664,72.353194,72.335168,72.310511,72.278755,72.241743,72.201437,72.160953,72.123926,72.092767,72.069699,72.054669,72.04642,72.042325,72.039771,72.036024,72.028305,72.014359,71.993359,71.966074,71.93519,71.902806,71.872117,71.845949,71.826764,71.814978,71.809606,71.808791,71.810025,71.81084,71.808552,71.800888,71.786937,71.766389,71.741921,71.715229,71.689144,71.666315,71.648979,71.638277,71.633716,71.634199,71.636828,71.639858,71.640778,71.637417,71.628616,71.613833,71.594798,71.57315,71.551094,71.53096,71.51544,71.505584,71.501387,71.501967,71.505298,71.509514,71.512594,71.512293,71.507396,71.497172,71.482455,71.465127,71.44668,71.429284,71.415139,71.405842,71.401653,71.401974,71.405522,71.410265,71.414539,71.416403,71.414383,71.407835,71.396722,71.382521,71.36748,71.352624,71.340148,71.331487,71.327242,71.327175,71.330149,71.334551,71.339178,71.342285,71.342348,71.338487,71.330574,71.319502,71.306988,71.294149,71.282698,71.27432,71.269581,71.268671,71.270984,71.274993,71.279473,71.283098,71.284556,71.282677,71.277189,71.268213,71.257454,71.246569,71.236532,71.228556,71.223629,71.222129,71.223488,71.22683,71.230833,71.234591,71.23666,71.236185,71.232716,71.226123,71.217181,71.207802,71.19886,71.191411,71.186384,71.184288,71.185215,71.1885,71.192555,71.196454,71.199279,71.200087,71.198373,71.193725,71.187281,71.179709,71.171838,71.164858,71.159594,71.156892,71.156636,71.158945,71.162432,71.165742,71.168465,71.169681,71.16877,71.16537,71.160154,71.153643,71.146788,71.140224,71.135067,71.131971,71.131227,71.132353,71.135106,71.138097,71.140812,71.142334,71.142309,71.140101,71.13602,71.130297,71.124315,71.118569,71.113745,71.110485,71.109256,71.110138,71.112367,71.114894,71.117746,71.119825,71.120526,71.119541,71.11653,71.112305,71.107332,71.102086,71.097449,71.093983,71.092165,71.092081,71.093717,71.096403,71.098827,71.100791,71.101713,71.101276,71.099283,71.095637,71.0909,71.086122,71.081775,71.078121,71.075835,71.075169,71.075754,71.077601,71.079516,71.081375,71.082581,71.082589,71.081026,71.078483,71.074647,71.07047,71.066482,71.062997,71.06042,71.059161,71.059295,71.060123,71.061582,71.063059,71.064103,71.064491,71.063598,71.061168,71.058205,71.054575,71.050818,71.047313,71.044464,71.042927,71.04255,71.043442,71.045184,71.046881,71.047998,71.048573,71.04811,71.046494,71.043906,71.04095,71.037934,71.034818,71.03217,71.030386,71.02975,71.030288,71.031121,71.032375,71.033539,71.034598,71.034962,71.034028,71.032512,71.030207,71.027298,71.024711,71.022218,71.020551,71.01962,71.019443,71.020186,71.021564,71.022884,71.023782,71.024441,71.024274,71.023343,71.021277,71.018594,71.015909,71.013716,71.011926,71.011014,71.01063,71.011015,71.012115,71.013429,71.014496,71.015082,71.015382,71.01459,71.013653,71.011966,71.009878,71.008013,71.00637,71.005249,71.004725,71.004946,71.00586,71.007125,71.008418,71.009238,71.009336,71.009247],[1.6937811,1.6913787,1.6887165,1.6863295,1.684676,1.6840651,1.6845725,1.6860917,1.6882747,1.6907418,1.6930261,1.6947144,1.695489,1.6952242,1.6939716,1.6919688,1.6896093,1.6873799,1.6856705,1.6848477,1.6850106,1.6861192,1.6879164,1.6900717,1.6921918,1.6938796,1.6948261,1.6948597,1.6939712,1.6923587,1.6903118,1.6882434,1.6865534,1.6855715,1.685457,1.686195,1.6876356,1.6895038,1.6914415,1.693083,1.6941373,1.6944202,1.6938545,1.6925851,1.6908493,1.6889926,1.6873537,1.6862713,1.6859143,1.6863541,1.6874695,1.6890451,1.6907769,1.6923488,1.6934617,1.6939271,1.6936494,1.6927093,1.691264,1.6896102,1.688058,1.6869226,1.6864027,1.686581,1.6873875,1.6886842,1.6902118,1.6916778,1.692825,1.6934297,1.6933877,1.6927069,1.6915491,1.6901101,1.6886867,1.6875379,1.6868923,1.6868542,1.6874099,1.688442,1.6897629,1.6911005,1.692229,1.692924,1.6930708,1.6926296,1.6917191,1.690515,1.6892205,1.6881006,1.6873818,1.6871662,1.6875,1.6882863,1.6893868,1.6905848,1.6916731,1.6924332,1.6927274,1.6925039,1.6918235,1.6908157,1.6896783,1.6886107,1.687842,1.6875029,1.6876334,1.688219,1.689116,1.6901778,1.6911883,1.6919719,1.6923726,1.6923291,1.6918367,1.6910302,1.6900428,1.6890671,1.6882925,1.6878509,1.6878302,1.6882056,1.6889224,1.6898263,1.6907645,1.691526,1.6920151,1.6921105,1.6918118,1.6911868,1.6903407,1.6894628,1.6887012,1.6881942,1.688046,1.6882661,1.6888146,1.6895672,1.6903883,1.6911203,1.6916463,1.6918548,1.6917153,1.6912514,1.6905715,1.6897895,1.689062,1.6885244,1.6882844,1.6883623,1.6887585,1.6893788,1.6901008,1.6907852,1.6913234,1.691616,1.6915917,1.6912763,1.6907338,1.6900596,1.6893854,1.6888429,1.6885233,1.6884943,1.6887497,1.6892302,1.6898493,1.6904862,1.6910196,1.6913744,1.6914482,1.6912629,1.6908301,1.6902698,1.6896718,1.6891343,1.6887763,1.688654,1.6887871,1.6891373,1.6896455,1.6902147,1.6907348,1.691112,1.6912747,1.6912025,1.6909072,1.6904471,1.6899083,1.6894011,1.6890042,1.6888208,1.6888553,1.6891027,1.6895173,1.6900044,1.6904827,1.6908685,1.6910854,1.6910995,1.6909123,1.6905557,1.6901017,1.6896337,1.6892474,1.6890169,1.688966,1.6891087,1.6894259,1.6898309,1.6902704,1.6906582,1.6909078,1.6909883,1.6908911,1.6906155,1.6902458,1.6898319,1.6894556,1.6891831,1.6890789,1.6891466,1.6893605,1.6896907,1.6900823,1.6904562,1.6907366,1.6908759,1.69084,1.6906776,1.6903793,1.6900126,1.6896482,1.6893578,1.6891966,1.6891921,1.6893312,1.6896034,1.6899349,1.6902689,1.6905462,1.6907262,1.6907605,1.6906658,1.6904445,1.6901547,1.6898348,1.6895432,1.6893481,1.6892859,1.6893567,1.6895288,1.6897932,1.6900941,1.6903803,1.6905864,1.6906695,1.690645,1.6905048,1.6902561,1.6899797,1.6897059,1.6894936,1.6893803,1.6893772,1.6894982,1.6897121,1.6899728,1.6902287,1.690448,1.6905846,1.6906015,1.6905018,1.6903165,1.6900823,1.6898399,1.6896235,1.6894956,1.6894499,1.6895092,1.6896718,1.6898746,1.6900988,1.690305,1.6904576,1.6905081,1.6904819,1.6903677,1.69018,1.6899669,1.6897539,1.6895972,1.6895213,1.6895344,1.6896342,1.6897881,1.6899942,1.6901851,1.6903353,1.6904344],[1.6937801,1.6913784,1.6887162,1.6863321,1.6846708,1.6840647,1.6845766,1.6860832,1.6882808,1.6907482,1.6930283,1.6947121,1.6954903,1.6952212,1.693971,1.6919679,1.6896063,1.6873719,1.6856767,1.6848425,1.6850066,1.6861077,1.6879215,1.6900715,1.6922001,1.6938853,1.6948221,1.6948585,1.6939755,1.6923473,1.6903202,1.6882422,1.6865533,1.6855754,1.6854592,1.6861927,1.6876353,1.6895056,1.6914423,1.6930815,1.6941398,1.6944266,1.6938505,1.6925961,1.6908508,1.688995,1.6873472,1.6862675,1.6859191,1.6863514,1.6874693,1.6890456,1.6907783,1.6923456,1.69346,1.6939274,1.6936458,1.6927024,1.6912632,1.6896011,1.6880517,1.6869269,1.6864017,1.6865769,1.687392,1.6886903,1.6902087,1.6916834,1.6928309,1.6934243,1.6933858,1.6927093,1.6915428,1.690109,1.6886927,1.6875348,1.686891,1.6868489,1.6874148,1.68844,1.6897615,1.6910973,1.6922255,1.6929265,1.6930697,1.6926378,1.6917229,1.6905161,1.6892193,1.6881108,1.6873794,1.6871714,1.6874941,1.6882847,1.6893836,1.6905897,1.6916715,1.6924435,1.6927224,1.6925148,1.6918258,1.6908142,1.689674,1.6886131,1.6878393,1.6874972,1.6876358,1.6882243,1.6891201,1.690176,1.6911845,1.69197,1.6923732,1.6923359,1.6918316,1.6910327,1.6900367,1.6890719,1.6882905,1.6878504,1.6878316,1.6882088,1.6889257,1.6898241,1.6907628,1.6915283,1.692011,1.6921142,1.6918191,1.691184,1.6903445,1.689457,1.6886995,1.6881932,1.6880464,1.6882683,1.6888177,1.6895595,1.6903915,1.6911233,1.6916475,1.6918603,1.6917138,1.6912539,1.6905662,1.6897922,1.6890571,1.6885226,1.6882849,1.6883636,1.6887544,1.6893757,1.6901053,1.6907877,1.6913246,1.6916112,1.6915912,1.6912743,1.6907319,1.6900564,1.6893908,1.6888409,1.6885287,1.6884947,1.6887412,1.6892258,1.6898516,1.6904836,1.6910153,1.6913698,1.6914481,1.6912612,1.6908269,1.690275,1.6896696,1.6891396,1.6887757,1.6886533,1.6887879,1.6891394,1.6896407,1.6902173,1.6907371,1.6911081,1.6912748,1.6912019,1.6909055,1.6904457,1.6899054,1.6894076,1.6890092,1.6888202,1.688856,1.6890992,1.6895186,1.6900071,1.690489,1.6908702,1.6910856,1.6910989,1.6909105,1.6905536,1.6900997,1.689631,1.6892439,1.6890117,1.6889662,1.6891041,1.6894273,1.6898335,1.6902729,1.6906529,1.6909083,1.6909875,1.6908903,1.6906151,1.6902441,1.6898357,1.6894596,1.6891827,1.6890795,1.6891417,1.6893542,1.689693,1.6900831,1.6904485,1.6907379,1.6908708,1.6908394,1.6906767,1.6903782,1.6900117,1.6896524,1.6893577,1.6892014,1.6891922,1.6893367,1.6896051,1.689927,1.6902648,1.6905469,1.6907265,1.6907602,1.6906652,1.6904432,1.6901588,1.6898332,1.6895419,1.6893472,1.6892867,1.6893568,1.6895297,1.6897939,1.6900905,1.6903767,1.6905868,1.6906754,1.690645,1.6905043,1.6902556,1.6899845,1.6897051,1.6894933,1.6893802,1.6893773,1.6894986,1.6897135,1.6899667,1.6902292,1.690443,1.6905798,1.6906017,1.6905009,1.690316,1.6900814,1.6898452,1.6896231,1.6894948,1.6894492,1.6895094,1.6896669,1.6898822,1.6900998,1.6903064,1.690458,1.6905134,1.6904816,1.6903673,1.6901794,1.6899657,1.6897605,1.6896009,1.6895221,1.6895345,1.6896345,1.6897936,1.6899903,1.6901862,1.6903356,1.6904292],[49.971454,50.101924,50.198083,50.242897,50.230116,50.165459,50.063554,49.94504,49.83244,49.746721,49.703465,49.711105,49.768323,49.864416,49.982437,50.098806,50.191225,50.241776,50.241879,50.194074,50.108935,50.003371,49.897186,49.810301,49.758221,49.749974,49.787564,49.863181,49.963532,50.068741,50.15796,50.214399,50.227413,50.196082,50.127983,50.037305,49.94063,49.855898,49.798605,49.779038,49.800517,49.858356,49.942634,50.036129,50.121496,50.181295,50.204809,50.188617,50.13722,50.060982,49.975107,49.89486,49.835392,49.807213,49.815444,49.857995,49.92701,50.00922,50.088704,50.150126,50.181394,50.177773,50.140803,50.078544,50.003764,49.929393,49.869183,49.834899,49.831992,49.860896,49.915836,49.986626,50.059133,50.119833,50.156619,50.16317,50.139092,50.090048,50.0256,49.958065,49.899723,49.861632,49.849937,49.867025,49.909239,49.968399,50.033231,50.091221,50.1313,50.145847,50.133308,50.096286,50.04264,49.982452,49.926792,49.886231,49.867668,49.874625,49.905436,49.953437,50.010596,50.065117,50.106671,50.127427,50.123703,50.097484,50.053921,50.001342,49.949647,49.908471,49.885374,49.884087,49.904958,49.943284,49.99227,50.041869,50.083253,50.108388,50.112476,50.09574,50.061741,50.017486,49.970326,49.929765,49.903061,49.895423,49.907191,49.936558,49.977144,50.021849,50.062092,50.089849,50.100491,50.092196,50.06684,50.03021,49.989294,49.95109,49.922568,49.909776,49.914127,49.93475,49.967521,50.006503,50.043736,50.072483,50.086937,50.085076,50.067007,50.037393,50.00158,49.965886,49.937113,49.920977,49.919465,49.933047,49.958977,49.992493,50.026871,50.055625,50.073514,50.07723,50.066309,50.043452,50.013222,49.980674,49.952134,49.933347,49.927212,49.934501,49.954133,49.981916,50.012852,50.040738,50.060448,50.068833,50.064012,50.047578,50.022825,49.994621,49.967698,49.947001,49.936927,49.939062,49.952337,49.974204,50.000958,50.027242,50.048076,50.059089,50.059453,50.048344,50.02831,50.004134,49.979287,49.958705,49.946218,49.943931,49.952018,49.968973,49.990859,50.014234,50.034875,50.048101,50.052195,50.046133,50.031785,50.011676,49.98918,49.969611,49.955504,49.949807,49.95361,49.965951,49.984164,50.005242,50.024919,50.039496,50.046382,50.044439,50.033911,50.017596,49.998279,49.979201,49.963885,49.955794,49.955376,49.963641,49.978094,49.995933,50.014768,50.030213,50.039777,50.041576,50.035475,50.022767,50.006715,49.989359,49.974697,49.964289,49.961014,49.964665,49.975059,49.989412,50.006089,50.020918,50.031888,50.03676,50.034465,50.02563,50.012832,49.997826,49.983292,49.97206,49.965989,49.966591,49.973485,49.984957,49.998963,50.013285,50.024694,50.031642,50.032324,50.027295,50.017079,50.004238,49.990566,49.97914,49.97174,49.969636,49.97311,49.981686,49.993717,50.006183,50.017244,50.024906,50.028253,50.025846,50.019179,50.008826,49.997076,49.986522,49.978328,49.97433,49.975125,49.980802,49.989868,50.000499,50.011161,50.019615,50.024677,50.02497,50.020402,50.012398,50.002745,49.992989,49.984358,49.97882,49.977058,49.979964],[49.309712,49.235543,49.235011,49.316526,49.473221,49.673273,49.887604,50.076254,50.209182,50.267963,50.251152,50.167008,50.035521,49.882752,49.731942,49.619715,49.570343,49.592778,49.690713,49.834639,50.002723,50.160599,50.279676,50.337714,50.328997,50.259169,50.14235,50.000181,49.854084,49.737888,49.66891,49.667139,49.730643,49.842148,49.984979,50.125937,50.241853,50.307635,50.315366,50.266804,50.171524,50.048242,49.917805,49.800929,49.726511,49.703337,49.74289,49.829505,49.949202,50.076617,50.186854,50.260177,50.282846,50.253992,50.180608,50.075923,49.959945,49.847862,49.770251,49.735593,49.75485,49.818317,49.917463,50.031405,50.134325,50.212497,50.247822,50.235731,50.181601,50.095723,49.993861,49.892744,49.811895,49.76782,49.767272,49.815091,49.894594,49.992901,50.089613,50.168807,50.212102,50.214747,50.178096,50.109205,50.021183,49.931044,49.850864,49.798692,49.788926,49.818466,49.880117,49.964069,50.052255,50.12774,50.178572,50.19288,50.171959,50.118511,50.044938,49.964372,49.889438,49.835941,49.813,49.827867,49.873558,49.943065,50.021287,50.093116,50.147521,50.170874,50.161809,50.123534,50.062991,49.992182,49.923386,49.867916,49.838955,49.840271,49.871923,49.927356,49.995099,50.06171,50.116367,50.147349,50.149192,50.123823,50.07632,50.01448,49.953319,49.898489,49.863571,49.855241,49.873676,49.916016,49.973843,50.033266,50.084947,50.121439,50.131946,50.117953,50.082596,50.032119,49.976606,49.924643,49.888127,49.872636,49.881584,49.913006,49.959726,50.012972,50.062537,50.100382,50.117608,50.112826,50.087636,50.046106,49.998124,49.949647,49.91049,49.889579,49.889869,49.91113,49.948697,49.99457,50.040443,50.078995,50.101449,50.104144,50.088341,50.055125,50.013792,49.970504,49.932543,49.9069,49.900659,49.911896,49.940327,49.979036,50.019367,50.057428,50.082629,50.092103,50.08437,50.061018,50.027238,49.988251,49.951719,49.924151,49.912198,49.917141,49.93672,49.967823,50.005136,50.038793,50.066463,50.081435,50.079933,50.064178,50.036947,50.002863,49.971399,49.943586,49.926241,49.924938,49.937968,49.961603,49.992189,50.023762,50.051141,50.068605,50.072266,50.062927,50.042233,50.014199,49.984704,49.957961,49.93872,49.932269,49.938525,49.956444,49.982489,50.011759,50.036906,50.056468,50.065259,50.062092,50.047723,50.024241,49.998617,49.972504,49.951328,49.940871,49.941482,49.953289,49.973079,49.998431,50.022066,50.041899,50.05422,50.056846,50.047808,50.030561,50.008769,49.985217,49.964538,49.9507,49.947013,49.953184,49.96797,49.987952,50.010127,50.029375,50.043948,50.049362,50.046755,50.034062,50.016852,49.995142,49.976483,49.960738,49.952755,49.95455,49.964382,49.979439,50.000497,50.018478,50.033859,50.043111,50.043297,50.036435,50.021226,50.004782,49.986566,49.971232,49.961637,49.959079,49.965072,49.976168,49.992283,50.008906,50.023333,50.033718,50.03777,50.033734,50.024943,50.00998,49.994562,49.980614,49.969259,49.963598,49.965487,49.972944,49.986245,50.001009,50.014421,50.024949,50.031931,50.032819,50.028039,50.015968],[7.7525534,7.7534909,7.7537865,7.753345,7.7523215,7.7508529,7.7492985,7.7479484,7.746978,7.7466158,7.7469248,7.7477986,7.7490841,7.7505581,7.7519135,7.7529354,7.7534183,7.753183,7.7523959,7.7511836,7.7498073,7.7485114,7.7475144,7.7470816,7.7471233,7.7477691,7.7488545,7.7501167,7.7513753,7.7524446,7.7529319,7.7529706,7.7524055,7.7513795,7.750169,7.7490028,7.7480485,7.7474555,7.7473689,7.7478333,7.7486689,7.7497439,7.7509555,7.7518836,7.7525585,7.7526596,7.7523678,7.7515475,7.7505087,7.7494376,7.7484967,7.7478478,7.7476398,7.7479108,7.7485715,7.7494979,7.7505572,7.7514645,7.7521333,7.7524217,7.752247,7.7515987,7.750752,7.749791,7.7488966,7.7482231,7.7479553,7.7480317,7.7484795,7.7492991,7.7501981,7.7510838,7.7517859,7.7521191,7.7520241,7.7516464,7.7509343,7.7500967,7.7492294,7.7486274,7.7482263,7.748234,7.7485467,7.7491401,7.7499312,7.7507324,7.7513835,7.7517592,7.7518748,7.751593,7.7510594,7.7503255,7.7496061,7.7489605,7.7485465,7.7484073,7.7486019,7.7490032,7.7497246,7.7504103,7.7510665,7.7515408,7.751692,7.7515509,7.7511604,7.7505371,7.7498494,7.7491985,7.7487976,7.7485992,7.7486885,7.7490199,7.7495582,7.7501579,7.7508398,7.7512149,7.7514942,7.7514161,7.7511417,7.7506585,7.7500639,7.7495164,7.7490543,7.7488191,7.7487626,7.7490208,7.7494369,7.7499609,7.7505232,7.7509761,7.751267,7.7513516,7.7511352,7.7507675,7.7502546,7.7497402,7.7492673,7.7490353,7.7489189,7.7490718,7.7493814,7.7498157,7.7503166,7.7507581,7.7510994,7.7511851,7.75114,7.750836,7.7503964,7.7499403,7.7495249,7.7492223,7.7490372,7.7491205,7.7493593,7.7497167,7.7501349,7.7505667,7.7508707,7.7510617,7.7510029,7.7508258,7.7504872,7.7501076,7.7497188,7.7494198,7.74921,7.7492058,7.7493736,7.7496103,7.7499889,7.7503712,7.7507248,7.7508673,7.7509322,7.7508041,7.7505733,7.750238,7.7498826,7.7495889,7.7493846,7.7492835,7.749358,7.749579,7.749878,7.7501952,7.750501,7.7507277,7.7508429,7.750761,7.7506224,7.7503324,7.7500128,7.7497288,7.7494923,7.7493901,7.7494033,7.7495582,7.7498104,7.7500856,7.7503661,7.7505789,7.7506999,7.750751,7.7506353,7.7503952,7.7501215,7.7498716,7.7496207,7.7494928,7.7494587,7.7495577,7.7497368,7.7499757,7.7502259,7.750483,7.7506115,7.7506466,7.7505899,7.7504601,7.7502118,7.7499925,7.7497837,7.7495956,7.749525,7.7495687,7.7496795,7.7499069,7.7501406,7.7503214,7.750489,7.7505925,7.7505744,7.7504816,7.7502824,7.7500798,7.7498663,7.7496977,7.7496476,7.7496305,7.749709,7.7498439,7.7500511,7.7502226,7.7504056,7.7504842,7.7505296,7.7504951,7.7503651,7.7501665,7.7499841,7.7498405,7.7497163,7.7496767,7.7497027,7.7498025,7.7499656,7.7501395,7.7502843,7.7504293,7.7504523,7.7504542,7.7503768,7.7502265,7.7500858,7.7499083,7.7497723,7.7497381,7.7497207,7.7498108,7.7499038,7.7500752,7.7502492,7.7503616,7.7504138,7.7504011,7.7503952,7.7502731,7.7501428,7.750001,7.7498561,7.7497508,7.7497787,7.7497981,7.7498888,7.750001,7.7501409,7.7502481,7.75034,7.7503785,7.7503576,7.7503003,7.7501869,7.7500652,7.7499389,7.7498542,7.7498176,7.7498184,7.7498864,7.749975],[1.5299423,1.5299399,1.5299384,1.5299389,1.5299291,1.5299236,1.5299227,1.529914,1.5299162,1.5299175,1.5299163,1.5299214,1.529931,1.5299374,1.5299415,1.5299442,1.5299427,1.5299479,1.5299397,1.5299334,1.529932,1.529921,1.5299219,1.5299212,1.5299225,1.529924,1.5299301,1.5299288,1.5299362,1.5299391,1.5299422,1.5299423,1.5299344,1.5299374,1.5299286,1.5299277,1.5299219,1.5299241,1.5299233,1.5299267,1.529927,1.5299343,1.5299346,1.5299371,1.5299398,1.5299382,1.5299395,1.5299331,1.5299326,1.5299273,1.5299197,1.5299232,1.5299268,1.5299236,1.5299213,1.5299314,1.5299279,1.529934,1.5299356,1.5299358,1.529936,1.5299334,1.5299269,1.5299256,1.5299242,1.5299242,1.5299193,1.5299282,1.5299271,1.5299285,1.5299316,1.529934,1.5299322,1.5299362,1.5299355,1.5299303,1.5299276,1.529925,1.5299209,1.5299176,1.529925,1.5299255,1.5299237,1.5299275,1.5299264,1.5299309,1.5299358,1.5299354,1.5299332,1.529935,1.5299328,1.5299289,1.5299279,1.5299296,1.5299218,1.529924,1.529925,1.5299292,1.5299325,1.5299316,1.5299312,1.5299379,1.5299323,1.5299336,1.5299317,1.5299281,1.5299245,1.5299241,1.5299199,1.5299229,1.5299217,1.5299299,1.5299332,1.529927,1.5299323,1.5299321,1.5299291,1.5299339,1.5299291,1.5299272,1.5299263,1.5299251,1.5299271,1.5299248,1.5299286,1.5299216,1.5299246,1.5299281,1.5299316,1.5299375,1.5299298,1.5299283,1.529934,1.5299277,1.5299256,1.5299208,1.5299212,1.5299253,1.5299255,1.5299276,1.5299291,1.5299327,1.5299322,1.5299365,1.5299327,1.5299345,1.5299338,1.529928,1.529925,1.5299186,1.5299229,1.5299173,1.5299172,1.5299223,1.5299167,1.5299195,1.5299251,1.5299316,1.5299256,1.5299327,1.5299291,1.5299314,1.5299235,1.52993,1.5299245,1.5299269,1.5299233,1.5299281,1.5299223,1.5299267,1.5299265,1.5299293,1.5299253,1.5299255,1.5299275,1.5299267,1.5299259,1.5299258,1.5299235,1.5299227,1.5299244,1.5299253,1.5299191,1.5299222,1.5299253,1.5299181,1.5299256,1.529926,1.529918,1.5299195,1.5299234,1.5299206,1.5299199,1.5299174,1.5299166,1.5299199,1.5299156,1.5299149,1.529917,1.5299161,1.529916,1.5299197,1.5299154,1.5299196,1.5299159,1.5299165,1.5299202,1.5299115,1.5299128,1.5299113,1.5299113,1.529915,1.5299137,1.5299169,1.5299106,1.5299146,1.5299163,1.5299199,1.5299207,1.5299168,1.5299193,1.5299187,1.5299148,1.529913,1.5299127,1.5299146,1.5299164,1.5299173,1.5299194,1.5299171,1.5299141,1.529919,1.5299224,1.5299138,1.5299117,1.5299152,1.529917,1.5299117,1.5299135,1.5299122,1.5299139,1.5299091,1.5299102,1.5299106,1.5299144,1.5299131,1.529913,1.5299142,1.5299137,1.5299097,1.5299122,1.5299155,1.5299083,1.5299118,1.5299106,1.5299108,1.5299165,1.5299098,1.529914,1.5299131,1.5299114,1.5299127,1.5299123,1.5299139,1.5299081,1.5299112,1.529904,1.5299042,1.529909,1.5299095,1.5299097,1.5299104,1.529908,1.5299135,1.5299064,1.5299131,1.5299061,1.5299124,1.5299133,1.5299095,1.5299139,1.5299058,1.5299046,1.5299079,1.529907,1.5299095,1.5299072,1.5299094,1.5299061,1.5299063,1.5299131,1.5299072,1.5299102,1.5299098,1.529913,1.529908,1.5299079,1.5299113,1.5299069,1.5299061],[8.9300808,8.930689,8.9313331,8.9315621,8.9320212,8.9314958,8.9307699,8.9308583,8.9293708,8.9287476,8.9283651,8.9285791,8.9285601,8.929156,8.9296522,8.9299083,8.9309197,8.9316239,8.931007,8.9316683,8.9312102,8.9311735,8.9296361,8.9291311,8.9286825,8.9283553,8.9287568,8.928807,8.9292169,8.9305178,8.9299619,8.9312898,8.9313489,8.9311324,8.9309273,8.9305486,8.9299714,8.92938,8.9290533,8.9287233,8.9286286,8.9286037,8.9295522,8.9291818,8.9305935,8.9307444,8.9312647,8.9313317,8.9308373,8.9306434,8.9301015,8.929631,8.9291736,8.9291006,8.928889,8.9289792,8.9295063,8.9301852,8.9302647,8.9309347,8.9309318,8.9308962,8.9308793,8.9308693,8.9300485,8.9298027,8.9293928,8.9288396,8.9288825,8.9293845,8.929458,8.9296124,8.9301496,8.9304052,8.9305771,8.9310896,8.9309177,8.9308887,8.9300293,8.9298436,8.9296712,8.9294475,8.929331,8.9290698,8.929256,8.9289354,8.9298641,8.9301021,8.9307116,8.9300849,8.9309593,8.9304524,8.9307571,8.9301102,8.9298993,8.9291368,8.9293243,8.9288231,8.9296082,8.9287086,8.9297088,8.9300874,8.9309377,8.9305274,8.9303821,8.9309127,8.930434,8.9300622,8.9296862,8.9297092,8.929534,8.9293865,8.9292693,8.9291216,8.9298473,8.9300349,8.9305294,8.9304134,8.9306657,8.9304639,8.9304423,8.930093,8.9298453,8.9296865,8.9296416,8.9292824,8.9296074,8.9293494,8.9292029,8.9300665,8.9300651,8.9304995,8.9305403,8.9305167,8.9304979,8.9302248,8.9303141,8.9304304,8.9294147,8.9292785,8.9294303,8.929371,8.9297333,8.9298913,8.9302403,8.9303309,8.9304725,8.9305629,8.9303132,8.9302255,8.9303973,8.9300351,8.9295514,8.9296233,8.9295497,8.9296529,8.9297389,8.9299737,8.9301665,8.9301355,8.930132,8.9306939,8.9301477,8.9302606,8.9309672,8.9301612,8.9296701,8.929687,8.9297617,8.9298542,8.9296837,8.9298156,8.9300429,8.9299406,8.9302453,8.9300958,8.9303042,8.9304222,8.9300921,8.9298356,8.9301997,8.9294596,8.9294258,8.9298089,8.9296106,8.9298037,8.9300271,8.9300914,8.9303729,8.9299058,8.9300594,8.9303756,8.930141,8.9302256,8.9299875,8.9295967,8.9294333,8.9296043,8.9295831,8.9297773,8.9299628,8.930039,8.9303426,8.9299603,8.9303313,8.9304508,8.9302029,8.9303949,8.9298444,8.929781,8.9297306,8.9299414,8.9295967,8.929887,8.9298715,8.9299045,8.9303406,8.9300886,8.9299537,8.9300988,8.930098,8.9304119,8.9303061,8.9298223,8.9298629,8.9303833,8.929748,8.9298853,8.9298338,8.9299627,8.9301989,8.9299837,8.930006,8.9301556,8.9299827,8.9300878,8.9299357,8.9298655,8.930237,8.9299561,8.9296114,8.9296556,8.929759,8.9298889,8.9300623,8.9298318,8.9301952,8.9301804,8.9301878,8.9300635,8.9301976,8.9299005,8.9299298,8.9300537,8.9299135,8.9295787,8.9295196,8.9297267,8.9299567,8.9298953,8.9298329,8.9302445,8.9300745,8.9302032,8.9300361,8.9301494,8.9298724,8.9301803,8.9299901,8.9300759,8.9301365,8.9297063,8.9298817,8.9299412,8.9301585,8.9297605,8.9300584,8.9300673,8.9302148,8.9300101,8.9303337,8.9299294,8.9297882,8.9297873,8.9298032,8.9296424,8.9298938,8.9300557,8.9301062,8.9301735,8.9297771,8.9299304,8.9299537,8.9300456,8.9301515,8.9297745,8.930093,8.9298625,8.9297834,8.9299956],[3.0702514,3.0071275,2.9705896,2.9674615,2.9996107,3.0591075,3.1369707,3.2175035,3.2853839,3.3277706,3.3383507,3.3163296,3.2673815,3.2015648,3.1289942,3.0664192,3.0247392,3.0113583,3.0303255,3.075144,3.1393645,3.2100975,3.2740878,3.3180113,3.3347769,3.3224367,3.2842425,3.2279637,3.1632062,3.1032015,3.0591084,3.0392199,3.0475883,3.0804364,3.1335352,3.1951105,3.2547753,3.2995027,3.3217231,3.3181772,3.2902584,3.2441035,3.1879764,3.1312795,3.0870687,3.0621054,3.0617204,3.0846845,3.1268876,3.1802491,3.2341331,3.2788015,3.3048558,3.3085924,3.2899765,3.2527742,3.2047368,3.1526969,3.1094331,3.0813564,3.0746738,3.088122,3.1208522,3.1662388,3.2140697,3.2575573,3.2863352,3.295797,3.2850968,3.2566169,3.2162014,3.1705208,3.1283551,3.0985033,3.0857258,3.0927505,3.11678,3.1539931,3.1966586,3.2375613,3.2673854,3.2813437,3.2774422,3.2566916,3.2232372,3.1840364,3.1445141,3.1140264,3.097857,3.0984347,3.1149583,3.1449368,3.1820003,3.2188402,3.2494702,3.2668049,3.2687146,3.2547067,3.2283847,3.1948077,3.1594124,3.1293723,3.1099319,3.1057891,3.1158358,3.1390714,3.170422,3.2037904,3.2337449,3.2531305,3.2593106,3.2514536,3.2313602,3.2031527,3.1719441,3.1430645,3.122696,3.1140998,3.1187356,3.1357034,3.1614823,3.1908735,3.218948,3.2399534,3.2496109,3.2469461,3.2327745,3.2093159,3.1827907,3.1557417,3.1344717,3.1229725,3.1228489,3.1342055,3.1547935,3.1797652,3.2048551,3.2262871,3.2383022,3.2398362,3.2308786,3.2129556,3.1900424,3.165491,3.144953,3.1316791,3.1282291,3.1352714,3.1508892,3.1721534,3.1950196,3.2156522,3.2294182,3.2342875,3.229436,3.2159602,3.196959,3.1752719,3.1550206,3.1405657,3.1344463,3.1374313,3.1487917,3.1660896,3.1862923,3.2059081,3.2207116,3.2278924,3.22684,3.2171353,3.2018554,3.1832166,3.164587,3.1494203,3.1412539,3.1405848,3.1480179,3.1616768,3.1784196,3.1964953,3.2112802,3.2203832,3.2223093,3.2167265,3.2050967,3.1893071,3.1723019,3.1573404,3.1476428,3.1447716,3.1486751,3.1587527,3.1734753,3.1888008,3.2034653,3.2140624,3.2181178,3.2156861,3.2071599,3.1939748,3.180076,3.1660453,3.1551475,3.1501654,3.1516231,3.1585027,3.1697829,3.1834438,3.1970328,3.2078625,3.2135333,3.2135408,3.207915,3.1979349,3.1854422,3.1726679,3.1617161,3.1553015,3.1541354,3.1585261,3.1675196,3.1794652,3.1913617,3.202212,3.2095149,3.2119616,3.2089637,3.2012026,3.1910832,3.1793499,3.1683719,3.1608643,3.157686,3.1595191,3.1655276,3.1752875,3.1857845,3.1959119,3.2038851,3.2082076,3.2074173,3.2024446,3.1944346,3.1844624,3.1743992,3.1662069,3.1617249,3.161401,3.1651948,3.172241,3.1813706,3.1906038,3.1987771,3.2038699,3.2055049,3.2024998,3.1968034,3.1880415,3.1794629,3.1710899,3.1653064,3.163387,3.1650911,3.1697997,3.1779419,3.186017,3.193925,3.2000359,3.2027164,3.2020551,3.1973734,3.1912874,3.1834268,3.175775,3.1698308,3.166483,3.1667766,3.1696853,3.1754628,3.1824428,3.1893999,3.1955048,3.1992537,3.1997319,3.197708,3.192538,3.1861298,3.1796194,3.1734821,3.1691627,3.1679272,3.1692732,3.1735973,3.1793833,3.1854656,3.1910136,3.1955825,3.1978292,3.1974932,3.1937354],[4.5550851,4.6284507,4.6890604,4.7246847,4.7284793,4.7010496,4.6491018,4.5835724,4.5166652,4.4605954,4.4247543,4.4153185,4.4337173,4.4765882,4.536825,4.6025049,4.6606634,4.6994307,4.7108713,4.6943089,4.6537277,4.5977821,4.5371276,4.4831403,4.4452817,4.429517,4.4389352,4.4713422,4.5213507,4.579722,4.634294,4.674729,4.6925492,4.6849869,4.6545635,4.608043,4.5543065,4.5035113,4.4646942,4.444362,4.4461415,4.4692173,4.5100121,4.5603736,4.6111474,4.6516217,4.67396,4.6742462,4.6530736,4.6154496,4.568907,4.5221759,4.4837588,4.4603186,4.4559641,4.4712451,4.5033564,4.5466397,4.5926394,4.6322946,4.6575672,4.6641349,4.6510045,4.6216346,4.5821826,4.5399377,4.5026007,4.4771881,4.4680646,4.476427,4.5008444,4.5369065,4.5777775,4.6154715,4.6425587,4.6538775,4.6476278,4.6257568,4.5929551,4.5553695,4.5204,4.494145,4.4812098,4.4838454,4.5014634,4.5305927,4.566139,4.6010166,4.6285086,4.6432132,4.6429426,4.627721,4.6014003,4.5688286,4.5363027,4.5098152,4.4941751,4.492059,4.503571,4.5261512,4.5565566,4.5882301,4.6154381,4.6324088,4.6363204,4.6270882,4.6065142,4.5789171,4.5493447,4.5236625,4.5062845,4.5002178,4.5066234,4.5238456,4.5489011,4.577013,4.6027563,4.6212642,4.6288723,4.6244744,4.6093666,4.5868067,4.5606287,4.536093,4.51784,4.5088272,4.5106789,4.5228954,4.5429074,4.5674855,4.5914264,4.6104239,4.620929,4.62088,4.6106975,4.5927411,4.5708332,4.5484884,4.5299868,4.519019,4.517311,4.5249579,4.540539,4.5611468,4.5827946,4.6013994,4.613159,4.6162392,4.6098761,4.5959746,4.5771927,4.5568707,4.538978,4.5266735,4.522115,4.5261322,4.5376769,4.5546998,4.5741036,4.5918287,4.6048225,4.6104877,4.6078343,4.597767,4.582553,4.5644262,4.547224,4.534304,4.5276299,4.5285379,4.5364516,4.5501087,4.5667485,4.5834247,4.5967935,4.6044309,4.6049983,4.598541,4.5865708,4.5714709,4.5558265,4.5424783,4.5342853,4.5325954,4.5372141,4.5474308,4.5615065,4.5766155,4.5898383,4.5984208,4.6012665,4.5978941,4.5886183,4.576139,4.5620654,4.5493486,4.5402395,4.5364602,4.5383518,4.5457623,4.5567543,4.5696988,4.5822246,4.5913228,4.5959579,4.5951012,4.5889741,4.5789382,4.5666318,4.5548974,4.5453917,4.5400844,4.5398252,4.5447158,4.5534679,4.5646369,4.5762343,4.5857924,4.5915743,4.592582,4.5887215,4.5809757,4.5707408,4.5596915,4.5499225,4.5437104,4.5413158,4.5439173,4.5503313,4.5595132,4.5701217,4.5796788,4.5865731,4.589516,4.5879652,4.5823184,4.5741841,4.5646658,4.5558197,4.5486643,4.5450514,4.5452672,4.5495193,4.5564878,4.5655054,4.5742939,4.5816386,4.5859292,4.5863451,4.5829393,4.5768643,4.5688124,4.5603921,4.5532369,4.5484487,4.5471238,4.5494671,4.5547829,4.5620958,4.5702176,4.5773758,4.582596,4.5845018,4.5831809,4.5785097,4.5720423,4.5644239,4.5574629,4.5522111,4.5496855,4.5503116,4.5538054,4.5597276,4.5666172,4.5732552,4.5784052,4.5815041,4.5814934,4.5789267,4.5739011,4.5678112,4.5615519,4.5561634,4.5528336,4.5520834,4.5540531,4.5583464,4.5640091,4.5701153,4.5754933,4.5793024,4.5805824,4.5792489,4.5755948,4.5707284,4.5652203,4.5600537,4.5561103,4.5540366,4.5546569],[15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]],"metaData":{}} );
		}
	};
	//===================================================================================


	//===================================================================================
	// Plant Seection Changed
	// This method reacts to plant selection being changed.
	//===================================================================================
	function plantSelectionsChanged(id, slotName) {
		var plugin = $scope.getWebbleByInstanceId(id);
		if(plugin.scope().gimme("SelectionsChanged")) {
			plugin.scope().set("SelectionsChanged", false);
			//$log.log(preDebugMsg + "plant selections changed");
			plantSelections = plugin.scope().gimme("SelectedSensors");
			droppedSensors = plugin.scope().gimme("DroppedSensors");

			if(times.length > 0 && inputs.length > 0 && dependents.length > 0) {
				buildMapping(times, dependents, inputs, mappingSet, mappingSourceName, mappingSetName, mappingSetIdx, plantSelections, droppedSensors);
			}
		}

		if(plugin.scope().gimme("DroppedSensorsChanged")) {
			plugin.scope().set("DroppedSensorsChanged", false);
			plantSelections = plugin.scope().gimme("SelectedSensors");
			droppedSensors = plugin.scope().gimme("DroppedSensors");

			if(times.length > 0 && inputs.length > 0 && dependents.length > 0) {
				buildMapping(times, dependents, inputs, mappingSet, mappingSourceName, mappingSetName, mappingSetIdx, plantSelections, droppedSensors);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Load Webble Defs
	// This method load Webble def package.
	//===================================================================================
	var loadWebbleDefs = function() {
		neededChildren = {};
		loadedChildren = {};

		loadedChildren["HoPSupport"] = [];
		loadedChildren["DigitalDashboard"] = [];
		loadedChildren["DigitalDashboardPluginScatterPlots"] = [];
		loadedChildren["DigitalDashboardPluginLinearRegression"] = [];
		loadedChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"] = [];
		loadedChildren["DigitalDashboardSmartDataSource"] = [];
		loadedChildren["SoftSensorAppPlantVisualizer"] = [];

		webbleDefNames["HoPSupport"] = "HoPSupport";
		webbleDefNames["DigitalDashboard"] = "DigitalDashboard";
		webbleDefNames["DigitalDashboardPluginScatterPlots"] = "DigitalDashboardPluginScatterPlots";
		webbleDefNames["DigitalDashboardPluginLinearRegression"] = "DigitalDashboardPluginLinearRegression";
		webbleDefNames["DigitalDashboardPluginLinearRegressionTikhonovRegularization"] = "DigitalDashboardPluginLinearRegressionTikhonovRegularization";
		webbleDefNames["SoftSensorAppPlantVisualizer"] = "SoftSensorAppPlantVisualizer";
		webbleDefNames["DigitalDashboardSmartDataSource"] = "DigitalDashboardSmartDataSource";

		neededChildren["HoPSupport"] = 1;
		neededChildren["DigitalDashboard"] = 1;
		neededChildren["DigitalDashboardSmartDataSource"] = 1;
		neededChildren["DigitalDashboardPluginScatterPlots"] = 1;
		neededChildren["DigitalDashboardPluginLinearRegression"] = 1;
		neededChildren["DigitalDashboardPluginLinearRegressionTikhonovRegularization"] = 1;
		neededChildren["SoftSensorAppPlantVisualizer"] = 1;

		$scope.downloadWebbleDef(webbleDefNames["DigitalDashboard"]);
	};
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
