//======================================================================================================================
// Controllers for Digital Dashboard for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('digitalDashboardWebbleCtrl', function($scope, $log, Slot, Enum, jsonQuery) {
	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		dashboardBackgroundBox: ['width', 'height', 'background-color', 'border', 'border-radius', 'font-size', 'color', 'font-family', 'opacity']
	};

	$scope.customMenu = [{itemId: 'connectDataToPlugin', itemTxt: 'Data -> Visualizations'}, {itemId: 'connectPluginAndData', itemTxt: 'Visualizations -> Data'}];

	$scope.customInteractionBalls = [];

	var myInstanceId = -1;
	var preDebugMsg = "DigitalDashboard: ";

	var listOfDataSources = []; // data sources have: {id (Webble ID), name (for menus etc.), dataSets}.
	// The 'dataSets' is an array of sets.
	// Sets have {name, idSlot, fields}. The index can be used to identify them.
	// The 'fields' is an array of fields, each field has {name, type (array with strings with typenames), slot (slotname)}.
	// The order in the 'fields' array is important.

	var listOfPlugins = []; // plugins have: {id (Webble ID), name, active (flag to show if it is currently use), grouping (flag to show if separate groups should be separate groups globally too, get different colors), format}
	// The 'format' is an array for sets, each sets have {filled (flag to show if this has data assigned), sources (array of assigned sources when filled), fields (an array)}
	// A field has {idSlot (slotname), name, type (array of strings), slot (slotname), assigned}
	// 'assigned' is a dictionary mapping assigned[ dataSource.id.toString() + " " + index in the 'dataSets'] --> [dataSource.id, index in 'dataSets', index in the 'fields' of the dataSet]

	var nextDataID = 0; // for giving globally unique IDs to data items
	var mapOfDataIDsToUniqueIDs = {}; // mapOfDataIDsToUniqueIDs[ dataSource.id (string) ] [ idSlot (slotname) ] --> array with IDs to use instead of the IDs in that slot
	var selectionStatusOfIDs = []; // vector with vectors with selection statuses, [group ID on plugin 1, group ID on plugin 2, etc.]

	var mapPluginNameToId = {};
	var mapDataSourceNameToId = {};
	var mapPluginIdToIdx = {}; // Webble ID to index of listOfPlugins
	var mapDataSourceIdToIdx = {}; // Webble ID to index of listOfDataSources

	var currentColors = {};

	var internalMappingSetTo = {};

	var fullyLoaded = false;
	var childrenToWaitFor = 0;

	var pasteListeners = [];
	// var loadListenIDs = [];
	var selfListeners = [];
	var globalPasteInterestList = [];



	//=== EVENT HANDLERS ================================================================


	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		resetVars();

		// ugly hack to see if we need to wait for children to load before we set the mapping slot
		childrenToWaitFor = jsonQuery.allValByKey(theInitWblDef, 'webble').length;

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

		myInstanceId = $scope.getInstanceId();

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			if(eventData.targetId == myInstanceId) {
				//$log.log(preDebugMsg + "I was loaded, " + eventData.targetId);

				if(childrenToWaitFor <= 0) {
					//$log.log(preDebugMsg + "I was fully loaded");
					fullyLoaded = true;
					newMapping($scope.gimme("Mapping"));
				} else {
					//$log.log(preDebugMsg + "We still need to wait for children to load");
				}
			}
		})); // check when we get loaded (fully loaded)

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			newColors(eventData.slotValue);
		}, myInstanceId, 'Colors'));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotValue){
				$scope.set("enableSelectAll", false);
				$scope.selectAll();
			}
		}, myInstanceId, 'enableSelectAll'));

		// 0:{'color':'#', 'gradient':[{'pos':0, 'color':'#'}, {'pos':0.75, 'color':'#'}]},
		$scope.addSlot(new Slot('Colors',
			{"skin":{"color":"#FFFACD", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFFEF5"}, {"pos":0.75, "color":"#FFFACD"}, {"pos":1, "color":"#FFFACD"}]}, // lemon
				// "skin":{"color":"#8FBC8F", "border":"#8FBC8F", "gradient":[{"pos":0, "color":"#E9F2E9"}, {"pos":0.75, "color":"#8FBC8F"}, {"pos":1, "color":"#8FBC8F"}]},  // green
				// "selection":{"color":"#FFA500", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFEDCC"}, {"pos":1, "color":"#FFA500"}]}, // orange
				"selection":{"color":"#FFEBCD", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFFBF5"}, {"pos":1, "color":"#FFEBCD"}]}, // whiteish
				"groups":{0:{"color":"#A9A9A9", "gradient":[{"pos":0, "color":"#EEEEEE"}, {"pos":0.75, "color":"#A9A9A9"}]},
					1:{"color":"#0000FF", "gradient":[{"pos":0, "color":"#CCCCFF"}, {"pos":0.75, "color":"#0000FF"}]},
					2:{"color":"#7FFF00", "gradient":[{"pos":0, "color":"#E5FFCC"}, {"pos":0.75, "color":"#7FFF00"}]},
					3:{"color":"#8A2BE2", "gradient":[{"pos":0, "color":"#E8D5F9"}, {"pos":0.75, "color":"#8A2BE2"}]},
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

					// Alternative Colors
					// "groups":{0:{"color":"#808080", "gradient":[{"pos":0, "color":"#E6E6E6"}, {"pos":0.75, "color":"#808080"}, {"pos":1, "color":"#808080"}]},
					// 	   1:{"color":"red", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"red"}, {"pos":1, "color":"red"}]},
					// 	   2:{"color":"green", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"green"}, {"pos":1, "color":"green"}]},
					// 	   3:{"color":"blue", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"blue"}, {"pos":1, "color":"blue"}]},
					// 	   4:{"color":"orange", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"orange"}, {"pos":1, "color":"orange"}]},
					// 	   5:{"color":"yellow", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"yellow"}, {"pos":1, "color":"yellow"}]},
					// 	   6:{"color":"brown", "gradient":[{"pos":0, "color":"white"}, {"pos":0.95, "color":"brown"}, {"pos":1, "color":"brown"}]}
				}},
			'Colors',
			'Colors to use for different groups of data',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Mapping',
			{},
			'Mapping',
			'Mapping of data fields and visualization input fields, i.e. what data should be visualized where?',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('enableSelectAll',
			false,
			'Enable Select All',
			'Make all plugins select all data',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.lostChild, function(eventData){
			removeChild(eventData.childId);
		}));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
			// clean up when we are deleted
			for(var i = 0; i < selfListeners.length; i++) {
				selfListeners[i]();
			}
			selfListeners = [];

			for(i = 0; i < listOfPlugins.length; i++) {
				for(var j = 0; j < listOfPlugins[i].listeners.length; j++) {
					listOfPlugins[i].listeners[j]();
				}
			}

			for(i = 0; i < listOfDataSources.length; i++) {
				for(j = 0; j < listOfDataSources[i].listeners.length; j++) {
					listOfDataSources[i].listeners[j]();
				}
			}

			resetVars();
		}));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventData){
			var childId = eventData.targetId;

			for(var i = 0; i < globalPasteInterestList.length; i++) {
				if(globalPasteInterestList[i] == childId) {
					// //$log.log(preDebugMsg + "Child " + childId + " was pasted, add");

					globalPasteInterestList.splice(i, 1);
					var thisChild = $scope.getWebbleByInstanceId(childId);
					addChild(childId, thisChild);

					if(!fullyLoaded) {
						childrenToWaitFor--;
						if(childrenToWaitFor <= 0) {
							//$log.log(preDebugMsg + "I was fully loaded, last child arrived.");
							fullyLoaded = true;
							newMapping($scope.gimme("Mapping"));
						} else {
							//$log.log(preDebugMsg + "We still need to wait for more children to arrive.");
						}
					}

					break;
				}
			}
		}));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){
			// wait until the child is pasted, because it may not be fully loaded otherwise
			var childId = eventData.childId;
			var thisChild = $scope.getWebbleByInstanceId(childId);

			if(thisChild === undefined || thisChild.scope() === undefined) {
				// //$log.log(preDebugMsg + "child is not finished loading, wait for pasted event");

				globalPasteInterestList.push(childId);
				// //$log.log(preDebugMsg + "Wait for child " + childId + " to be pasted, then add");

				// // loadListenIDs.push(eventData.childId);

				// pasteListeners.push([eventData.childId, $scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventDataInner){
				//     //$log.log(preDebugMsg + "child pasted, let's add this child: " + eventDataInner.targetId);
				//     var thisChild = $scope.getWebbleByInstanceId(eventDataInner.targetId);

				//     for(var pl = 0; pl < pasteListeners.length; pl++) {
				// 	if(pasteListeners[pl][0] == eventDataInner.targetId) {
				// 	    pasteListeners[pl][1]();
				// 	    pasteListeners.splice(pl, 1);
				// 	    break;
				// 	}
				//     }

				//     addChild(eventDataInner.targetId, thisChild);

				//     if(!fullyLoaded) {
				// 	childrenToWaitFor--;
				// 	if(childrenToWaitFor <= 0) {
				// 	    //$log.log(preDebugMsg + "I was fully loaded, last child arrived.");
				// 	    fullyLoaded = true;
				// 	    newMapping($scope.gimme("Mapping"));
				// 	} else {
				// 	    //$log.log(preDebugMsg + "We still need to wait for more children to arrive.");
				// 	}
				//     }

				// }, eventData.childId)]);
			} else {
				// //$log.log(preDebugMsg + "child is already loaded, add immediately (since the pasted event sometimes does not fire)");
				// //$log.log(preDebugMsg + "Add child " + childId + " now");
				var thisChild = $scope.getWebbleByInstanceId(eventData.childId);
				addChild(eventData.childId, thisChild);


				if(!fullyLoaded) {
					childrenToWaitFor--;
					if(childrenToWaitFor <= 0) {
						//$log.log(preDebugMsg + "I was fully loaded, last child arrived.");
						fullyLoaded = true;
						newMapping($scope.gimme("Mapping"));
					} else {
						//$log.log(preDebugMsg + "We still need to wait for more children to arrive.");
					}
				}

			}
		}));

		selfListeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			// //$log.log(preDebugMsg + "mapping slot set: " + JSON.stringify(eventData.slotValue));
			if(eventData.slotValue != internalMappingSetTo) {
				if(JSON.stringify(eventData.slotValue) != JSON.stringify(internalMappingSetTo)) {
					var possiblyNewerValue = $scope.gimme('Mapping');

					if(possiblyNewerValue != internalMappingSetTo
						&& JSON.stringify(possiblyNewerValue) != JSON.stringify(internalMappingSetTo)) {

						// //$log.log(preDebugMsg + "SlotSet new mapping:" + JSON.stringify(eventData.slotValue));
						// //$log.log(preDebugMsg + "SlotSet possibly newer mapping:" + JSON.stringify(possiblyNewerValue));
						// //$log.log(preDebugMsg + "SlotSet old mapping:" + JSON.stringify(internalMappingSetTo));

						newMapping(eventData.slotValue);
					}
				}
			}
		}, myInstanceId, 'Mapping'));
	};
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method forces all variables to its init reset empty state
	// (if the same workspace is loaded twice, these are not reset properly, so we have
	// to do it ourselves...)
	//===================================================================================
	function resetVars() {
		myInstanceId = -1;
		listOfDataSources = [];
		listOfPlugins = [];

		nextDataID = 0;
		mapOfDataIDsToUniqueIDs = {};
		selectionStatusOfIDs = [];

		mapPluginNameToId = {};
		mapDataSourceNameToId = {};
		mapPluginIdToIdx = {};
		mapDataSourceIdToIdx = {};

		currentColors = {};

		internalMappingSetTo = {};

		fullyLoaded = false;
		childrenToWaitFor = 0;
		pasteListeners = [];
	};
	//===================================================================================


	//===================================================================================
	// Build Plugin List For Forms
	// This method builds the list of plugins for the forms
	//===================================================================================
	function buildPluginListForForms() {
		// //$log.log(preDebugMsg + "buildPluginListForForms");
		var plugins = [];

		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = {};
			plugin.name = listOfPlugins[p].name;
			plugin.grouping = listOfPlugins[p].grouping;
			plugin.sets = [];
			plugin.idx = p;
			plugin.id = listOfPlugins[p].id;
			plugin.acceptsMultipleSources = false;

			for(var s = 0; s < listOfPlugins[p].format.length; s++) {
				var set = {};
				set.fields = [];
				plugin.sets.push(set);

				var idSlotsInSet = {};

				for(var f = 0; f < listOfPlugins[p].format[s].fields.length; f++) {
					var field = {};
					field.name = listOfPlugins[p].format[s].fields[f].name;
					field.type = listOfPlugins[p].format[s].fields[f].type;
					field.assigned = listOfPlugins[p].format[s].fields[f].assigned;
					field.template = listOfPlugins[p].format[s].fields[f].template;
					field.added = listOfPlugins[p].format[s].fields[f].added;

					idSlotsInSet[listOfPlugins[p].format[s].fields[f].idSlot] = true;

					set.fields.push(field);
				}

				if(Object.keys(idSlotsInSet).length > 1) {
					plugin.acceptsMultipleSources = true;
				}
			}
			plugins.push(plugin);
		}
		return plugins;
	};
	//===================================================================================


	//===================================================================================
	// Build Data Source List For forms
	// This method builds the list of data sources for the forms
	//===================================================================================
	function buildDataSourceListForForms() {
		// //$log.log(preDebugMsg + "buildDataSourceListForForms");
		var dataSources = [];

		for(var ds = 0; ds < listOfDataSources.length; ds++) {
			var source = {};
			source.name = listOfDataSources[ds].name;
			source.sets = [];
			source.id = listOfDataSources[ds].id;

			for(var s = 0; s < listOfDataSources[ds].dataSets.length; s++) {
				var setName = listOfDataSources[ds].dataSets[s].name;

				var set = {};
				set.fields = [];
				set.name = setName;
				source.sets.push(set);

				for(var f = 0; f < listOfDataSources[ds].dataSets[s].fields.length; f++) {
					var field = {};
					field.name = setName + ": " + listOfDataSources[ds].dataSets[s].fields[f].name;
					field.type = listOfDataSources[ds].dataSets[s].fields[f].type;

					set.fields.push(field);
				}
			}
			dataSources.push(source);
		}
		return dataSources;
	};
	//===================================================================================


	//===================================================================================
	// Open Connection Form Viz To Data To Viz
	// This method opens the form that let one connect data with visualizing plugins
	//===================================================================================
	function openConnectionformViz2Data2Viz(data2viz) {
		// //$log.log(preDebugMsg + "openConnectionformViz2Data2Viz");
		var dataSources = buildDataSourceListForForms();
		var plugins = buildPluginListForForms();

		if(data2viz) {
			$scope.openForm('connectionData2VizForm', [{templateUrl: 'connectionData2VizForm.html', controller: 'connectionViz2Data2VizForm_Ctrl', size: 'lg'}, {wblScope: $scope, plugins:plugins, dataSources:dataSources}], closeConnectionform);
		} else {
			$scope.openForm('connectionViz2DataForm', [{templateUrl: 'connectionViz2DataForm.html', controller: 'connectionViz2Data2VizForm_Ctrl', size: 'lg'}, {wblScope: $scope, plugins:plugins, dataSources:dataSources}], closeConnectionform);
		}
	};
	//===================================================================================


	//===================================================================================
	// Close Connection Form
	// This method closes the form that let one connect data with visualizing plugins
	// and collect the choices made and react to it accordingly.
	//===================================================================================
	function closeConnectionform(returnContent){
		// //$log.log(preDebugMsg + "closeConnectionform");
		if(returnContent !== null && returnContent !== undefined){
			var newList = returnContent.plugins;

			var groupingDirty = [];
			var redoMapping = false;
			for(var p = 0; p < newList.length; p++) {
				if(newList[p].grouping != listOfPlugins[p].grouping) {
					if(listOfPlugins[p].active) {
						groupingDirty.push(p);
					}
					listOfPlugins[p].grouping = newList[p].grouping;
					redoMapping = true;
				}

				// check if fields were added or removed
				for(var set = 0; set < listOfPlugins[p].format.length; set++) {
					var oldFields = listOfPlugins[p].format[set].fields;
					var newFields = newList[p].sets[set].fields;
					var setDirty = false;

					// first check if we should remove
					var toRemove = [];
					for(var f1 = 0; f1 < oldFields.length; f1++) {
						if(oldFields[f1].added) { // only added fields may have been removed
							var stillHere = false;
							for(var f2 = 0; f2 < newFields.length; f2++) {
								if(newFields[f2].added && newFields[f2].assigned === oldFields[f1].assigned) { // this works?
									stillHere = true;
									break;
								}
							}
							if(!stillHere) {
								toRemove.push(f1);
							}
						}
					}

					var alreadyRemoved = 0;
					for(var r = 0; r < toRemove.length; r++) {
						oldFields.splice(toRemove[r] - alreadyRemoved, 1);
						alreadyRemoved++;
						setDirty = true;
					}

					// check if we should add fields
					for(var f1 = 0; f1 < newFields.length; f1++) {
						if(newFields[f1].added) { // only added fields may have been added
							var isNew = true;
							for(var f2 = 0; f2 < oldFields.length; f2++) {
								if(oldFields[f2].added && oldFields[f2].assigned === newFields[f1].assigned) { // this works?
									isNew = false;
									break;
								}
							}

							if(isNew) {
								var newField = {};
								newField.name = newFields[f1].name;
								newField.assigned = newFields[f1].assigned;
								newField.template = false;
								newField.added = true;

								for(var f2 = 0; f2 < oldFields.length; f2++) {
									if(oldFields[f2].template && oldFields[f2].name == newField.name) {
										newField.type = oldFields[f2].type;
										newField.idSlot = oldFields[f2].idSlot;
										newField.slot = oldFields[f2].slot;
										break;
									}
								}

								oldFields.splice(f1, 0, newField);
								setDirty = true;
							}
						}
					}

					if(setDirty) {
						listOfPlugins[p].format[set].sources = ["fields added"];
					}
				}
			}

			if(returnContent.somethingChanged) {
				checkAssignedDataFields();
				redoMapping = false; // checkAssignedDataFields will do it for us
				for(var pp in returnContent.changedPlugins) {
					if(returnContent.changedPlugins.hasOwnProperty(pp)) {
						var p = returnContent.changedPlugins[pp];

						if(listOfPlugins[p].active) {
							sendDataToPlugin(p); // this may send the data twice
						}
					}
				}
			}

			if(groupingDirty.length == 1) {
				updateSelections(groupingDirty[0]);
			} else if(groupingDirty.length > 0) {
				updateSelections();
			}

			if(redoMapping) {
				buildNewMapping();
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble Is Plugin?
	// This method checks weather a webble is a dashboard v.2 plugin webble for
	// visualization purpose
	//===================================================================================
	function webbleIsPlugin(webble) {
		try {
			return webble.scope().gimme('PluginType') == "VisualizationPlugin" || webble.scope().gimme('PluginType') == "Hybrid";
		} catch(e) {
			return false;
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble Is Hybrid?
	// This method checks weather a webble is a dashboard v.2 plugin webble of hybrid
	// type.
	//===================================================================================
	function webbleIsHybrid(webble) {
		try {
			return webble.scope().gimme('PluginType') == "Hybrid";
		} catch(e) {
			return false;
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble Is DataSource?
	// This method checks weather a webble is a dashboard v.2 plugin webble for
	// data source purpose.
	//===================================================================================
	function webbleIsDataSource(webble) {
		try {
			return webble.scope().gimme('PluginType') == "DataSource" || webble.scope().gimme('PluginType') == "Hybrid";
		} catch(e) {
			return false;
		}
	};
	//===================================================================================


	//===================================================================================
	// Add Child
	// This method adds a webble if it is of proper type (dashboard plugin) as a child.
	//===================================================================================
	function addChild(id, webble) {
		// //$log.log(preDebugMsg + "addChild");
		if(webbleIsPlugin(webble)) {
			addPlugin(id, webble);
		}

		if(webbleIsDataSource(webble)) { // for hybrid plugins, we want to add the plugin part first and the data source second (this is used when data is generated that is concatenated onto the input data)
			addDataSource(id, webble);
		}
	};
	//===================================================================================


	//===================================================================================
	// Add Data Source
	// This method adds a specific data source plugin Webble to this one as a child and
	// make needed registrations and changes.
	//===================================================================================
	function addDataSource(id, webble) {
		// //$log.log(preDebugMsg + "addDataSource (add child)");
		try {
			var name = webble.scope().gimme("PluginName").toString();
		} catch(e) {
			name = "Unnamed Data Source";
		}

		if(mapDataSourceNameToId.hasOwnProperty(name)) {
			var i = 2;
			var tryNewName = true;
			var newName = name;
			while(tryNewName) {
				newName = name + i;
				if(mapDataSourceNameToId.hasOwnProperty(newName)) {
					i++;
				} else {
					tryNewName = false;
					name = newName;
				}
			}
			try {
				webble.scope().set("PluginName", newName);
			} catch(e) {
				//$log.log(preDebugMsg + "Something went wrong when assigning new name to data source");
			}
		}

		mapDataSourceNameToId[name] = id;
		mapDataSourceIdToIdx[id.toString()] = listOfDataSources.length;

		var ds = {};
		ds.id = id;
		ds.name = name;
		ds.dataSets = parseDataSourceProvidedData(id, webble, name);

		listOfDataSources.push(ds);

		// we may have received a new mapping for this source too
		var mapping = $scope.gimme("Mapping");
		if(mapping != internalMappingSetTo) {
			newMapping(mapping);
		}

		// autoAssignDataFields();
		checkAssignedDataFields();

		// add listener to check when format or data have changed!

		var listeners = [];
		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			dataSourceChangeFormat(ds.id);
		}, ds.id, 'ProvidedFormatChanged'));

		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			dataSourceChangeData(ds.id);
		}, ds.id, 'DataChanged'));

		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			dataSourceChangeName(ds.id);
		}, ds.id, 'PluginName'));

		ds.listeners = listeners;

		var scp = webble.scope();
		if(scp !== undefined) { // if the data source also has a color field, set that
			try {
				scp.set("GroupColors", $scope.gimme('Colors'));
			} catch(e) {
				//$log.log(preDebugMsg + "Something went wrong when setting colors of new data source.");
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Parse Data Source Provide Data
	// This method checks parse the data source plugin provided data and tries to make
	// sense of it.
	//===================================================================================
	function parseDataSourceProvidedData(id, webble, sourceName) {
		// //$log.log(preDebugMsg + "parseDataSourceProvidedData");
		try {
			var format = webble.scope().gimme('ProvidedFormat');
		} catch(e) {
			format = {};
			//$log.log(preDebugMsg + "Something went wrong when reading format of data source.");
		}

		if(typeof format === 'string') {
			format = JSON.parse(format);
		}

		var res = [];

		if(format.hasOwnProperty("format") && format.format.hasOwnProperty("sets")) {
			for(var s  = 0; s < format.format.sets.length; s++) {
				var set = format.format.sets[s];

				if(set.hasOwnProperty("idSlot") && set.hasOwnProperty("fieldList") && set["fieldList"].length > 0) {
					var ss = {};
					if(set.hasOwnProperty("name")) {
						ss.name = set.name;
					} else {
						ss.name = sourceName;
					}
					ss.fields = [];
					ss.idSlot = set.idSlot;

					if(set.hasOwnProperty("useInputIDs") && set["useInputIDs"]) {
						ss.noID = true;
					} else {
						ss.noID = false;
					}

					if(!mapOfDataIDsToUniqueIDs.hasOwnProperty(id.toString())) {
						mapOfDataIDsToUniqueIDs[id.toString()] = {};
					}

					if(ss.noGeneratedID) {
						// do nothing now
						// when input data is assigned we copy the IDs from there
					} else {
						if(webble !== undefined && webble.scope() !== undefined && Object.prototype.toString.call(webble.scope().gimme(ss.idSlot)) === '[object Array]') {
							var needToMap = true;
							var idsToMap = webble.scope().gimme(ss.idSlot);
							if(mapOfDataIDsToUniqueIDs[id.toString()].hasOwnProperty(ss.idSlot)) {
								// already mapped (same idSlot for some other data set)
								var oldCache = mapOfDataIDsToUniqueIDs[id.toString()][ss.idSlot].id;
								if(oldCache.length != idsToMap.length) {
									needToMap = true;
								} else {
									needToMap = false;
								}
							}

							if(needToMap) {
								var mappedIds = [];
								var selectionList = [];
								for(var idToMap = 0; idToMap < idsToMap.length; idToMap++) {
									mappedIds.push(nextDataID++);
									selectionList.push(1);
									selectionStatusOfIDs.push(null);
								}
								mapOfDataIDsToUniqueIDs[id.toString()][ss.idSlot] = {};
								mapOfDataIDsToUniqueIDs[id.toString()][ss.idSlot].id = mappedIds;
								mapOfDataIDsToUniqueIDs[id.toString()][ss.idSlot].sel = selectionList;
							}
						}

						for(var f = 0; f < set["fieldList"].length; f++) {
							var ff = {};
							ff.name = set["fieldList"][f].name;
							ff.type = set["fieldList"][f].type;
							ff.slot = set["fieldList"][f].slot;

							if(set["fieldList"][f].hasOwnProperty("metadata")) {
								ff.metadata = set["fieldList"][f].metadata;
							}

							ss.fields.push(ff);
						}

						res.push(ss);
					}
				}
			}
		}

		return res;
	};
	//===================================================================================


	//===================================================================================
	// Add Plugin
	// This method adds a specific visualization plugin webble to this one as a child and
	// make needed registrations and changes.
	//===================================================================================
	function addPlugin(id, webble) {
		// //$log.log(preDebugMsg + "addPlugin (add child)");
		var name = webble.scope().gimme("PluginName").toString();

		if(mapPluginNameToId.hasOwnProperty(name)) {
			var i = 2;
			var tryNewName = true;
			while(tryNewName) {
				var newName = name + i;
				if(mapPluginNameToId.hasOwnProperty(newName)) {
					i++;
				} else {
					tryNewName = false;
					name = newName;
				}
			}
			try {
				webble.scope().set("PluginName", newName);
			} catch(e) {
				//$log.log(preDebugMsg + "Something went wrong when setting new name on plugin.");
			}
		}

		mapPluginNameToId[name] = id;
		mapPluginIdToIdx[id.toString()] = listOfPlugins.length;

		var p = {};
		p.id = id;
		p.name = name;
		p.active = false;
		p.grouping = true;
		p.format = parsePluginFormat(webble);

		listOfPlugins.push(p);

		// autoAssignDataFields();
		buildNewMapping();

		// add listener to check when the selections change!!
		var listeners = [];
		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			vizPluginChangeSelections(p.id);
		}, p.id, 'LocalSelectionsChanged'));

		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			vizPluginChangeName(p.id);
		}, p.id, 'PluginName'));

		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			vizPluginDataDrop(p.id);
		}, p.id, 'DataDropped'));

		var scp = webble.scope();
		if(scp !== undefined) {
			try {
				scp.set("GroupColors", $scope.gimme('Colors'));
			} catch(e) {
				//$log.log(preDebugMsg + "Something went wrong when setting colors on new plugin.");
			}
		}

		p.listeners = listeners;
	};
	//===================================================================================


	//===================================================================================
	// Parse Plugin Format
	// This method parse the webble dashboard plugin format to know how to structure and
	// display things as requested.
	//===================================================================================
	function parsePluginFormat(webble) {
		// //$log.log(preDebugMsg + "parsePluginFormat");
		var format = webble.scope().gimme('ExpectedFormat');

		if(typeof format === 'string') {
			format = JSON.parse(format);
		}

		var res = [];

		for(var s = 0; s < format.length; s++) {
			var set = format[s];
			var resSet = {};
			resSet.filled = false;
			resSet.fields = [];

			var uniqueTemplateNames = {};

			for(var f = 0; f < set.length; f++) {
				var field = set[f];
				// field.idSlot;
				// field.name;
				// field.type;
				// field.slot;
				// field.zeroOrMore

				resField = {};
				resField.name = field.name;
				resField.slot = field.slot;
				resField.idSlot = field.idSlot;
				resField.type = [];
				var types = field.type.split("|");
				for(var t = 0; t < types.length; t++) {
					resField.type.push(types[t]);
				}

				if(field.hasOwnProperty("zeroOrMore") && field.zeroOrMore) {
					resField.template = true;
					resField.added = false;

					var uniqueCounter = 2;
					var orgName = resField.name;
					while(uniqueTemplateNames.hasOwnProperty(resField.name)) {
						resField.name = orgName + uniqueCounter++;
					}
					uniqueTemplateNames[resField.name] = true;
				} else {
					resField.template = false;
					resField.added = false;
				}

				resField.assigned = {};

				resSet.fields.push(resField);
			}
			res.push(resSet);
		}

		return res;
	};
	//===================================================================================


	//===================================================================================
	// Remove Child
	// This method removes a child of any plugin-type identified by internal id.
	//===================================================================================
	function removeChild(id) {
		// //$log.log(preDebugMsg + "removeChild");
		var ids = id.toString();

		if(mapPluginIdToIdx.hasOwnProperty(ids)) {
			removePlugin(id);
		}

		if(mapDataSourceIdToIdx.hasOwnProperty(ids)) {
			removeDataSource(id);
		}
	};
	//===================================================================================


	//===================================================================================
	// Remove Data Source
	// This method removes a data source plugin identified by internal id.
	//===================================================================================
	function removeDataSource(id) {
		// //$log.log(preDebugMsg + "removeDataSource");

		for(var n in mapDataSourceNameToId) {
			if(mapDataSourceNameToId[n] == id) {
				delete mapDataSourceNameToId[n];
			}
		}

		var idx = mapDataSourceIdToIdx[id.toString()];
		delete mapDataSourceIdToIdx[id.toString()];

		for(var i = 0; i < listOfDataSources[idx].listeners.length; i++) {
			listOfDataSources[idx].listeners[i]();
		}

		listOfDataSources.splice(idx, 1);

		for(var i = idx; i < listOfDataSources.length; i++) {
			mapDataSourceIdToIdx[listOfDataSources[i].id.toString()] = i;
		}

		if(mapOfDataIDsToUniqueIDs.hasOwnProperty(id)) {
			for(var idSlot in mapOfDataIDsToUniqueIDs[id]) {
				for(var i = 0; i < mapOfDataIDsToUniqueIDs[id][idSlot].id.length; i++) {
					selectionStatusOfIDs[mapOfDataIDsToUniqueIDs[id][idSlot].id[i]] = null;
				}
			}
			delete mapOfDataIDsToUniqueIDs[id];
		}

		checkAssignedDataFields();
	};
	//===================================================================================


	//===================================================================================
	// Remove Plugin
	// This method removes a visualization plugin identified by internal id.
	//===================================================================================
	function removePlugin(id) {
		// //$log.log(preDebugMsg + "removePlugin");
		var idx = mapPluginIdToIdx[id.toString()];

		// stop listeneing to slot updates
		for(var i = 0; i < listOfPlugins[idx].listeners.length; i++) {
			listOfPlugins[idx].listeners[i]();
		}

		listOfPlugins[idx].active = false;
		updateSelections(idx);
		for(var i = 0; i < selectionStatusOfIDs.length; i++) {
			if(selectionStatusOfIDs[i] !== null) {
				if(idx < selectionStatusOfIDs[i].length) {
					selectionStatusOfIDs[i].splice(idx,1);
				}
			}
		}

		for(var n in mapPluginNameToId) {
			if(mapPluginNameToId[n] == id) {
				delete mapPluginNameToId[n];
			}
		}

		delete mapPluginIdToIdx[id.toString()];
		listOfPlugins.splice(idx, 1);

		for(var i = idx; i < listOfPlugins.length; i++) {
			mapPluginIdToIdx[listOfPlugins[i].id.toString()] = i;
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Plugin Change Selections
	// This method reacts to when a specific plugin webble have changed its selection and
	// make sure that is communicated and displayed properly in all plugins.
	//===================================================================================
	function vizPluginChangeSelections(pluginID) {
		var webble = $scope.getWebbleByInstanceId(pluginID);
		if(webble === undefined) {
			// //$log.log(preDebugMsg + "vizPluginChangeSelections, slot change from an unfinished Webble, ignore");
			return;
		}

		// //$log.log(preDebugMsg + "vizPluginChangeSelections " + pluginID);
		var id = pluginID.toString();
		if(mapPluginIdToIdx.hasOwnProperty(id)) {
			var idx = mapPluginIdToIdx[id];
			if(listOfPlugins[idx].active) {
				updateSelections(idx);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Plugin Change Name
	// This method reacts to when a specific plugin webble have changed its name and
	// make sure that is communicated and displayed properly in all plugins.
	//===================================================================================
	function vizPluginChangeName(pluginID) {
		var webble = $scope.getWebbleByInstanceId(pluginID);
		if(webble === undefined) {
			// //$log.log(preDebugMsg + "vizPluginChangeName, slot change from an unfinished Webble, ignore");
			return;
		}

		// //$log.log(preDebugMsg + "vizPluginChangeName " + pluginID);
		var id = pluginID.toString();
		if(mapPluginIdToIdx.hasOwnProperty(id)) {
			var idx = mapPluginIdToIdx[id];
			var webble = $scope.getWebbleByInstanceId(pluginID);
			var name = webble.scope().gimme("PluginName").toString();

			if(mapPluginNameToId.hasOwnProperty(name) && mapPluginNameToId[name] != pluginID) {
				var i = 2;
				var tryNewName = true;
				while(tryNewName) {
					var newName = name + i;
					if(mapPluginNameToId.hasOwnProperty(newName)) {
						i++;
					} else {
						tryNewName = false;
						name = newName;
					}
				}
				try {
					webble.scope().set("PluginName", newName); // this will trigger a new message back here
				} catch(e) {
					//$log.log(preDebugMsg + "Something went wrong when updating name on plugin.");
				}
			} else { // name is OK
				var toRemove = [];
				for(var s in mapPluginNameToId) {
					if(mapPluginNameToId[s] == pluginID) {
						toRemove.push(s);
					}
				}
				for(s = 0; s < toRemove.length; s++) {
					delete mapPluginNameToId[toRemove[s]];
				}
				mapPluginNameToId[name] = pluginID;
				listOfPlugins[idx].name = name;
				buildNewMapping();
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Data Source Change Name
	// This method reacts to when a specific data source plugin webble have changed its
	// name and make sure that is communicated and displayed properly in all plugins.
	//===================================================================================
	function dataSourceChangeName(sourceID) {
		var webble = $scope.getWebbleByInstanceId(sourceID);
		if(webble === undefined) {
			// //$log.log(preDebugMsg + "dataSourceChangeName, slot change from an unfinished Webble, ignore");
			return;
		}

		var id = sourceID.toString();
		if(mapDataSourceIdToIdx.hasOwnProperty(id)) {
			var idx = mapDataSourceIdToIdx[id];
			var ds = listOfDataSources[idx];
			var webble = $scope.getWebbleByInstanceId(sourceID);
			var name = webble.scope().gimme("PluginName").toString();

			if(mapDataSourceNameToId.hasOwnProperty(name) && mapDataSourceNameToId[name] != sourceID) {
				var i = 2;
				var tryNewName = true;
				while(tryNewName) {
					var newName = name + i;
					if(mapDataSourceNameToId.hasOwnProperty(newName)) {
						i++;
					} else {
						tryNewName = false;
						name = newName;
					}
				}

				try{
					webble.scope().set("PluginName", newName); // this will trigger a new message back here
				} catch(e) {
					//$log.log(preDebugMsg + "Something went wrong when updating name on data source.");
				}
			} else { // name is OK
				var toRemove = [];
				for(var s in mapDataSourceNameToId) {
					if(mapDataSourceNameToId[s] == sourceID) {
						toRemove.push(s);
					}
				}
				for(s = 0; s < toRemove.length; s++) {
					delete mapDataSourceNameToId[toRemove[s]];
				}
				mapDataSourceNameToId[name] = sourceID;
				ds.name = name;
				buildNewMapping();
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Data Source Change Format
	// This method reacts to when a specific data source plugin webble have changed its
	// format and make sure that is communicated and displayed properly in all plugins.
	//===================================================================================
	function dataSourceChangeFormat(sourceID) {
		var webble = $scope.getWebbleByInstanceId(sourceID);
		if(webble === undefined) {
			// //$log.log(preDebugMsg + "dataSourceChangeFormat, slot change from an unfinished Webble, ignore");
			return;
		}

		var id = sourceID.toString();
		if(mapDataSourceIdToIdx.hasOwnProperty(id)) {
			var idx = mapDataSourceIdToIdx[id];
			var ds = listOfDataSources[idx];
			var webble = $scope.getWebbleByInstanceId(sourceID);
			var name = webble.scope().gimme("PluginName").toString();

			ds.dataSets = parseDataSourceProvidedData(sourceID, webble, name);
			// autoAssignDataFields();
			checkAssignedDataFields();
			dataSourceUpdated(idx);
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Data Source Change Data
	// This method reacts to when a specific data source plugin webble have changed its
	// data and makes sure that is communicated and displayed properly in all plugins.
	//===================================================================================
	function dataSourceChangeData(sourceID) {
		var webble = $scope.getWebbleByInstanceId(sourceID);
		if(webble === undefined) {
			// //$log.log(preDebugMsg + "dataSourceChangeData, slot change from an unfinished Webble, ignore");
			return;
		}

		var id = sourceID.toString();
		if(mapDataSourceIdToIdx.hasOwnProperty(id)) {
			var idx = mapDataSourceIdToIdx[id];
			checkIfIDsNeedToBeRemapped(idx);
			dataSourceUpdated(idx);
		}
	};
	//===================================================================================


	//===================================================================================
	// Visualization Plugin Data Drop
	// This method reacts to when some data has been dropped on a specific plugin and
	// makes sure to react to it properly.
	//===================================================================================
	function vizPluginDataDrop(pluginID) {
		// //$log.log(preDebugMsg + "drag&drop data connection requested");

		var webble = $scope.getWebbleByInstanceId(pluginID);
		if(!webble) {
			//$log.log(preDebugMsg + "Drag&Drop Error: could not find the vizualization Webble, id=" + pluginID);
		} else {
			var id = pluginID.toString();
			if(!mapPluginIdToIdx.hasOwnProperty(id)) {
				//$log.log(preDebugMsg + "Drag&Drop Error: could not find the vizualization Webble, id=" + pluginID + " (internal inconsistency, this should not happen).");
			} else {
				var idx = mapPluginIdToIdx[id];
				if(! (idx < listOfPlugins.length)) {
					//$log.log(preDebugMsg + "Drag&Drop Error: could not find the vizualization Webble, id=" + pluginID + " (internal inconsistency, this should not happen).");
				} else {
					var plugin = listOfPlugins[idx];
					var slotContent = webble.scope().gimme("DataDropped");
					if(!(slotContent && slotContent.hasOwnProperty("dataSourceField") && slotContent.hasOwnProperty("pluginField"))) {
						//$log.log(preDebugMsg + "Drag&Drop Error: drag&drop information malformed: '" + slotContent + "'");
					} else {
						var datasrc = null;
						try {
							datasrc = JSON.parse(slotContent.dataSourceField);
						} catch(e) {
							// not JSON, something else was dropped
							datasrc = null;
						}

						var listToAssign = [];
						var viz2viz = false;
						if(datasrc && datasrc.hasOwnProperty("vizName")) {
							// this is a vizualization plugin to another vizualization plugin drag&drop
							viz2viz = true;
							var idx2 = 0;
							for(idx2 = 0; idx2 < listOfPlugins.length; idx2++) {
								if(listOfPlugins[idx2].name == datasrc.vizName) {
									for(var set = 0; set < listOfPlugins[idx2].format.length; set++) {
										if(listOfPlugins[idx2].format[set].filled) { // first filled set, this is the active one
											for(var ff2 = 0; ff2 < listOfPlugins[idx2].format[set].fields.length; ff2++) {
												if(listOfPlugins[idx2].format[set].fields[ff2].name == datasrc.name && ((!listOfPlugins[idx2].format[set].fields[ff2].added && !listOfPlugins[idx2].format[set].fields[ff2].template) || (listOfPlugins[idx2].format[set].fields[ff2].added && datasrc.idx == ff2))) {
													// we found the correct field
													// need to check type compatibility
													// need to copy the assigned status

													for(var assignedID in listOfPlugins[idx2].format[set].fields[ff2].assigned) {
														if(listOfPlugins[idx2].format[set].fields[ff2].assigned.hasOwnProperty(assignedID)) {
															var ass = listOfPlugins[idx2].format[set].fields[ff2].assigned[assignedID];
															try {
																var dsId = parseInt(ass[0]);
																var dsIdx = mapDataSourceIdToIdx[dsId];
																listToAssign.push([dsIdx, ass[0], ass[1], ass[2]]);
															} catch(e) {
																//$log.log(preDebugMsg + "could not assign data correctly");
															}

															// assignedIDlist.push(assignedID);
															// assignedNewValList.push(listOfPlugins[idx2].format[set].fields[ff2].assigned[assignedID]);
														}
													}
												}
											}
										}
									}
								}
							}
						}

						var somethingChanged = false;

						if(!viz2viz && ! (datasrc && datasrc.hasOwnProperty("sourceName") && mapDataSourceNameToId.hasOwnProperty(datasrc.sourceName))) {
							//$log.log(preDebugMsg + "Drag&Drop Error: Data source unknown. Is the data source connected to the Digital Dashboard parent Webble?");
						} else if(!viz2viz) {
							// this is a drag&drop from a data source to a vizualization plugin
							var dsId = mapDataSourceNameToId[datasrc.sourceName];
							if(!mapDataSourceIdToIdx.hasOwnProperty(dsId)) {
								//$log.log(preDebugMsg + "Drag&Drop Error: Data source unknown (internal consistency error, this should not happen).");
							} else {
								var dsIdx = mapDataSourceIdToIdx[dsId];

								if(! (dsIdx < listOfDataSources.length && datasrc.hasOwnProperty("dataSetIdx") && datasrc.dataSetIdx < listOfDataSources[dsIdx].dataSets.length && datasrc.hasOwnProperty("fieldName"))) {
									//$log.log(preDebugMsg + "Drag&Drop Error: Data source information incorrect.");
								} else {
									var found = false;
									var fieldName = datasrc.fieldName;
									for(var ff = 0; ff < listOfDataSources[dsIdx].dataSets[datasrc.dataSetIdx].fields.length; ff++) {
										if(listOfDataSources[dsIdx].dataSets[datasrc.dataSetIdx].fields[ff].name == fieldName) {
											found = true;
											// we have found the correct data source field
											listToAssign.push([dsIdx, dsId, datasrc.dataSetIdx, ff]);
										}
									}

									if(!found) {
										//$log.log(preDebugMsg + "Drag&Drop Error: could not find the fields to connect.");
									}
								}
							}
						}

						for(var a = 0; a < listToAssign.length; a++) {
							var ass = listToAssign[a];
							dsIdx = ass[0];
							dsId = ass[1];
							dataSetIdx = ass[2];
							ff = ass[3];

							var assignedID = dsId.toString() + " " + dataSetIdx;
							var newVal = [dsId.toString(), dataSetIdx, ff];

							// find all plugin input fields that match (could be one per set)
							for(var set = 0; set < plugin.format.length; set++) {
								var fields = plugin.format[set].fields;
								var removePreviousStuff = false;
								var allSeenIDslots = {};
								var countSeenIDslots = 0;

								for(var f = 0; f < fields.length; f++) {
									if(!allSeenIDslots.hasOwnProperty(fields[f].idSlot)) {
										countSeenIDslots++;
										allSeenIDslots[fields[f].idSlot] = true;
									}
								}

								if(countSeenIDslots > 1) {
									// this is a plugin that takes input from many different data sources
									// (for example the heat map that takes vectors from one and column labels from another source)
									// this leads to problems when we add many sets of data (not the same number of sets from each
									// source), so reset all such plugins when adding new data like this (remove previous assignments).
									removePreviousStuff = true;
								}

								for(var f = 0; f < fields.length; f++) {
									if(fields[f].name == slotContent.pluginField.name) {
										// check if this is a template field (add one more field)
										// or a field that has been added before (then find the correct clone)
										// or a normal field

										var match = false;
										if(fields[f].template && slotContent.pluginField.template) {
											// add a new field
											match = true;
										}
										if(fields[f].added && slotContent.pluginField.added && f == slotContent.pluginField.idx) {
											// this is the cloned field we want to update
											match = true;
										}
										if(!fields[f].added && !fields[f].template && !slotContent.pluginField.added && !slotContent.pluginField.template) {
											// normal field
											match = true;
										}

										if(match) {
											var typeOK = false;
											for(var tt = 0; tt < fields[f].type.length; tt++) {
												if(fields[f].type[tt] == listOfDataSources[dsIdx].dataSets[dataSetIdx].fields[ff].type) {								    // acceptable data type
													typeOK = true;

													if(fields[f].template) {
														// we need to add a new clone field
														var field = {};
														field.name = fields[f].name;
														field.type = fields[f].type;
														field.idSlot = fields[f].idSlot;
														field.slot = fields[f].slot;
														field.template = false;
														field.added = true;
														field.assigned = {};
														field.assigned[assignedID] = newVal;
														fields.push(field); // is this OK?
														somethingChanged = true;
													} else {
														if(fields[f].hasOwnProperty("assigned") && removePreviousStuff) {
															fields[f].assigned = {};
														}
														if(!fields[f].hasOwnProperty("assigned") || !fields[f].assigned.hasOwnProperty(assignedID) || fields[f].assigned[assignedID].toString() != newVal.toString()) {
															fields[f].assigned[assignedID] = newVal;
															somethingChanged = true;
														}
													}
													break; // no need to check more types
												}
											}

											if(!typeOK) {
												//$log.log(preDebugMsg + "Drag&Drop Error: assigned data field has a data type that is not supported by the visualization.");
											}
											break; // stop looking for a matching field
										}
									} // if name matches
								} // for each field in this format set
							} // for each set in the plugin expected format
						} // for each item to assign in listToAssign

						if(somethingChanged) {
							//$log.log(preDebugMsg + "Drag&Drop: successfully assigned data to vizualization.");
							checkAssignedDataFields(); // Check data types, send data, etc. Will also build a new mapping (adding any unaffected plugins)
							if(listOfPlugins[idx].active) {
								sendDataToPlugin(idx); // this may send the data twice, since checkAssignedDataFields sends data if this plugin gets activated or changes data source (but not if it changes fields from the same source)
							}
						}
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Check If IDs Need To Be Remapped
	// This method checks if a specific plugin with a specific id needs to be remapped
	// due to changes somewhere else.
	//===================================================================================
	function checkIfIDsNeedToBeRemapped(idx) {
		// //$log.log(preDebugMsg + "checkIfIDsNeedToBeRemapped");

		var ds = listOfDataSources[idx];
		var webble = $scope.getWebbleByInstanceId(ds.id);

		if(!mapOfDataIDsToUniqueIDs.hasOwnProperty(ds.id.toString())) {
			mapOfDataIDsToUniqueIDs[ds.id.toString()] = {};
		}

		for(var dss = 0; dss < ds.dataSets.length; dss++) {
			var needToMap = true;
			if(ds.dataSets[dss].noID) { // hybrid that just adds data, never need to remap
				needToMap = false;
			} else {
				var idSlot = ds.dataSets[dss].idSlot;

				// we should check for hybrids here!!
				var scp = webble.scope();
				if(scp !== undefined) {
					var idsToMap = scp.gimme(idSlot);
					if(idsToMap === undefined) {
						// this happens when we get slots set from loading a Webble in an order we are not happy with
						// child is still being loaded, so do not need to do anything
						needToMap = false;
					} else {
						if(mapOfDataIDsToUniqueIDs[ds.id.toString()].hasOwnProperty(idSlot)) {
							// already mapped (same idSlot for some other data set)
							var oldCache = mapOfDataIDsToUniqueIDs[ds.id.toString()][idSlot];
							if(oldCache.length != idsToMap.length) {
								needToMap = true;
							} else {
								needToMap = false;
							}
						}
					}

					if(needToMap) {
						var mappedIds = [];
						var selectionList = [];
						for(var idToMap = 0; idToMap < idsToMap.length; idToMap++) {
							mappedIds.push(nextDataID++);
							selectionList.push(1);
							selectionStatusOfIDs.push(null);
						}
						mapOfDataIDsToUniqueIDs[ds.id.toString()][idSlot] = {};
						mapOfDataIDsToUniqueIDs[ds.id.toString()][idSlot].id = mappedIds;
						mapOfDataIDsToUniqueIDs[ds.id.toString()][idSlot].sel = selectionList;
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Data Source Update
	// This method handles what needs to be done when a data source has been updated.
	//===================================================================================
	function dataSourceUpdated(idx) {
		// //$log.log(preDebugMsg + "dataSourceUpdated " + idx);

		var needsData = [];
		var ds = listOfDataSources[idx];

		var mySources = {};
		for(var dss = 0; dss < ds.dataSets.length; dss++) {
			var assignedID = ds.id.toString() + " " + dss;
			mySources[assignedID] = true;
		}

		for(var p = 0; p < listOfPlugins.length; p++) {
			var added = false;
			var plugin = listOfPlugins[p];
			if(plugin.active) {
				for(var is = 0; !added && is < plugin.format.length; is++) {
					if(plugin.format[is].filled) {
						var sourcesPerId = plugin.format[is].sources;
						for(var idSlot in sourcesPerId) {
							var sources = sourcesPerId[idSlot];

							for(var s = 0; s < sources.length; s++) {
								if(mySources.hasOwnProperty(sources[s])) {
									needsData.push(p);
									added = true;
									break;
								}
							}
						}
					}
				}
			}
		}

		for(p = 0; p < needsData.length; p++) {
			sendDataToPlugin(needsData[p]);
		}
	};
	//===================================================================================


	//===================================================================================
	// Get Original Data Source For Hybrid Data Source
	// This method gets the original data source to be used by a hybrid plugin.
	//===================================================================================
	function getOriginalDataSourceForHybridDataSource(dataSource, dataSet) {
		var inputDataIDSlot = listOfDataSources[dataSource].dataSets[dataSet].idSlot;
		var dataSourceId = listOfDataSources[dataSource].id;

		if(mapPluginIdToIdx.hasOwnProperty(dataSourceId)) {
			var hybridIdx = mapPluginIdToIdx[dataSourceId];
			if(listOfPlugins[hybridIdx].active) {
				var hybridInputSet = listOfPlugins[hybridIdx].format[0].fields; // find first filled set
				var hybridSourcesPerIdSlot = [];
				for(var hi = 0; hi < listOfPlugins[hybridIdx].format.length; hi++) {
					if(listOfPlugins[hybridIdx].format[hi].filled) {
						hybridInputSet = listOfPlugins[hybridIdx].format[hi].fields;
						hybridSourcesPerIdSlot = listOfPlugins[hybridIdx].format[hi].sources;
						break;
					}
				}

				if(hybridSourcesPerIdSlot.hasOwnProperty(inputDataIDSlot)) {
					var hybridSources = hybridSourcesPerIdSlot[inputDataIDSlot];

					for(var hf = 0; hf < hybridInputSet.length; hf++) {
						if(hybridInputSet[hf].idSlot == inputDataIDSlot) {
							var hybridInputField = hybridInputSet[hf];

							for(var haa = 0; haa < hybridSources.length; haa++) {
								var ha = hybridSources[haa];
								var idSourceId = hybridInputField.assigned[ha][0].toString();
								var idSource = mapDataSourceIdToIdx[idSourceId];
								var idDataSet = hybridInputField.assigned[ha][1];

								return {'dataSourceId':idSourceId.toString(), 'dataSet':idDataSet, 'dataSourceIdx':idSource};
							}
						}
					}
				}
			}
		}
		return {};
	};
	//===================================================================================


	//===================================================================================
	// Update Selections
	// This method update selections of all plugins that need to be updated due to
	// changes somewhere.
	//===================================================================================
	function updateSelections(changedPluginIdx) {
		// //$log.log(preDebugMsg + "updateSelections");

		if(changedPluginIdx === undefined) {
			// reset all
			for(var i = 0; i < selectionStatusOfIDs.length; i++) {
				selectionStatusOfIDs[i] = null;
			}
		}

		var lastField = listOfPlugins.length;

		// add more fields if we have more plugins now than last time we did this
		for(var i = 0; i < selectionStatusOfIDs.length; i++) {
			if(selectionStatusOfIDs[i] !== null) {
				while(selectionStatusOfIDs[i].length < lastField + 1) {
					selectionStatusOfIDs[i].push(-1);
				}
			}
		}

		for(var i = 0; i < selectionStatusOfIDs.length; i++) {
			if(selectionStatusOfIDs[i] !== null && lastField < selectionStatusOfIDs[i].length) {
				selectionStatusOfIDs[i][lastField] = 1;
			}
		}

		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = listOfPlugins[p];

			if(plugin.active) {
				// [plugin p group, last field=global group]
				// group=0 unselected
				// group=-1, not sent to this plugin
				var webble = $scope.getWebbleByInstanceId(plugin.id);
				var localSelectionsPerIdSlot = {};
				if(webble !== undefined && webble.scope() !== undefined) {
					localSelectionsPerIdSlot = webble.scope().gimme('LocalSelections');
				}

				var inputSet = plugin.format[0].fields; // find first filled set
				var sourcesPerIdSlot = {};
				for(var i = 0; i < plugin.format.length; i++) {
					if(plugin.format[i].filled) {
						inputSet = plugin.format[i].fields;
						sourcesPerIdSlot = plugin.format[i].sources;
						break;
					}
				}

				for(var inputIdSlot in sourcesPerIdSlot) {
					var sources = sourcesPerIdSlot[inputIdSlot];
					var localSelections = [];

					if(localSelectionsPerIdSlot.hasOwnProperty(inputIdSlot)) {
						var localSelections = localSelectionsPerIdSlot[inputIdSlot];
					}
					for(var aa = 0; aa < sources.length; aa++) {
						var a = sources[aa];
						var asplit = a.split(" ");
						var dataSourceId = asplit[0];
						var dataSource = mapDataSourceIdToIdx[dataSourceId];
						var dataSet = Number(asplit[1]);
						var idArray = [];
						if(listOfDataSources[dataSource].dataSets[dataSet].noID) { // this is a hybrid data source that uses IDs from another data source
							var org = getOriginalDataSourceForHybridDataSource(dataSource, dataSet);
							if(org.hasOwnProperty('dataSet')) {
								idArray = mapOfDataIDsToUniqueIDs[org.dataSourceId][listOfDataSources[org.dataSourceIdx].dataSets[org.dataSet].idSlot].id;
							}
						} else { // normal data source
							idArray = mapOfDataIDsToUniqueIDs[dataSourceId.toString()][listOfDataSources[dataSource].dataSets[dataSet].idSlot].id;
						}

						var selectionArray = [];
						if(aa < localSelections.length) {
							selectionArray = localSelections[aa];
						}

						if(idArray.length != selectionArray.length) {
							if(selectionArray.length == 0) {
								//not set yet?
								for(var i = 0; i < idArray.length; i++) {
									var id = idArray[i];
									if(selectionStatusOfIDs[id] === null) {
										selectionStatusOfIDs[id] = [];
										while(selectionStatusOfIDs[id].length < lastField + 1) {
											selectionStatusOfIDs[id].push(-1);
										}
									}
									selectionStatusOfIDs[id][p] = 1;
								}
							} else {
								//$log.log(preDebugMsg + "ID list and selection list have different lengths, plugin " + plugin.name + " data set " + aa);
								for(var i = 0; i < idArray.length; i++) {
									var id = idArray[i];
									if(selectionStatusOfIDs[id] === null) {
										selectionStatusOfIDs[id] = [];
										while(selectionStatusOfIDs[id].length < lastField + 1) {
											selectionStatusOfIDs[id].push(-1);
										}
									}
									selectionStatusOfIDs[id][p] = -1;
								}
							}
						} else {
							for(var i = 0; i < idArray.length; i++) {
								var id = idArray[i];
								if(selectionStatusOfIDs[id] === null) {
									selectionStatusOfIDs[id] = [];
									while(selectionStatusOfIDs[id].length < lastField + 1) {
										selectionStatusOfIDs[id].push(-1);
									}
								}
								if(plugin.grouping) {
									selectionStatusOfIDs[id][p] = selectionArray[i];
								} else {
									if(selectionArray[i] == 0) {
										selectionStatusOfIDs[id][p] = 0;
									} else {
										selectionStatusOfIDs[id][p] = 1;
									}
								}
								if(selectionArray[i] == 0) {
									selectionStatusOfIDs[id][lastField] = 0;
								}
							}
						}
					}
				}
			}

			if(!plugin.active && changedPluginIdx == p) {
				// we should clear out the cache of selection statuses
				for(var i = 0; i < selectionStatusOfIDs.length; i++) {
					if(selectionStatusOfIDs[i] !== null) {
						if(p < selectionStatusOfIDs[i].length) {
							selectionStatusOfIDs[i][p] = -1;
						}
					}
				}
			}
		}

		var groupIdMapping = {};
		var nextGroupId = 1;
		for(var i = 0; i < selectionStatusOfIDs.length; i++) {
			if(selectionStatusOfIDs[i] !== null) {
				if(selectionStatusOfIDs[i][lastField] != 0) {
					var s = selectionStatusOfIDs[i].join(" "); // this includes the last field, which is unnecessary, but should not hurt
					if(!groupIdMapping.hasOwnProperty(s)) {
						groupIdMapping[s] = nextGroupId++;
					}
					selectionStatusOfIDs[i][lastField] = groupIdMapping[s];
				}
			}
		}

		for(var sourceID in mapOfDataIDsToUniqueIDs) {
			for(var idSlot in mapOfDataIDsToUniqueIDs[sourceID]) {
				var ids = mapOfDataIDsToUniqueIDs[sourceID][idSlot].id;
				var sels = mapOfDataIDsToUniqueIDs[sourceID][idSlot].sel;
				for(var i = 0; i < ids.length; i++) {
					if(selectionStatusOfIDs[ids[i]] === null) {
						// //$log.log(preDebugMsg + "selectionStatusOfIDs is null when it should not be? ids = " + JSON.stringify(ids) + ", i=" + i + ", selectionStatusOfIDs = " + JSON.stringify(selectionStatusOfIDs));
						// //$log.log(preDebugMsg + "ERROR: selectionStatusOfIDs is null when it should not be?"); // this happens when this data is not assigned to any visualization plugin at all
						sels[i] = 0; // this should not happen TODO!
					} else {
						sels[i] = selectionStatusOfIDs[ids[i]][lastField];
					}
				}
			}
		}

		// //$log.log(preDebugMsg + "updateSelections result: " + JSON.stringify(selectionStatusOfIDs));

		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = listOfPlugins[p];

			if(plugin.active) {
				// [plugin p group, last field=global group]
				// group=0 unselected
				// group=-1, not sent to this plugin
				var webble = $scope.getWebbleByInstanceId(plugin.id);
				var selectionArraysPerIdSlot = {};
				var inputSet = plugin.format[0].fields; // find first filled set
				var sourcesPerIdSlot = {};
				for(var i = 0; i < plugin.format.length; i++) {
					if(plugin.format[i].filled) {
						inputSet = plugin.format[i].fields;
						sourcesPerIdSlot = plugin.format[i].sources;
						break;
					}
				}

				for(var idSlot in sourcesPerIdSlot) {
					var sources = sourcesPerIdSlot[idSlot];
					var selectionArrays = [];
					selectionArraysPerIdSlot[idSlot] = selectionArrays;

					for(var aa = 0; aa < sources.length; aa++) {
						var a = sources[aa];
						var asplit = a.split(" ");
						var dataSourceId = asplit[0];
						var dataSource = mapDataSourceIdToIdx[dataSourceId];
						var dataSet = Number(asplit[1]);

						if(listOfDataSources[dataSource].dataSets[dataSet].noID) { // this is a hybrid data source that uses IDs from another data source
							var org = getOriginalDataSourceForHybridDataSource(dataSource, dataSet);
							if(org.hasOwnProperty('dataSet')) {
								selectionArrays.push(mapOfDataIDsToUniqueIDs[org.dataSourceId][listOfDataSources[org.dataSourceIdx].dataSets[org.dataSet].idSlot].sel);
							}
						} else { // normal (not hybrid) data source
							selectionArrays.push(mapOfDataIDsToUniqueIDs[dataSourceId.toString()][listOfDataSources[dataSource].dataSets[dataSet].idSlot].sel);
						}
					}
				}

				if(webble !== undefined && webble.scope() !== undefined) {
					try {
						webble.scope().set('GlobalSelections', selectionArraysPerIdSlot);
					} catch(e) {
						//$log.log(preDebugMsg + "Something went wrong when updating global selections on plugin " + plugin.name);
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Check Assigned Data Fields
	// This method checks the assigned data fields so that they are up to date.
	//===================================================================================
	function checkAssignedDataFields() {
		// //$log.log(preDebugMsg + "checkAssignedDataFields");
		var needsData = [];

		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = listOfPlugins[p];
			var oldActive = plugin.active;
			var changed = false;

			plugin.active = false;

			// //$log.log(preDebugMsg + "plugin " + p + " oldActive = " + oldActive);

			// check if some old assignments should be removed
			for(var is = 0; is < plugin.format.length; is++) {
				var inputSet = plugin.format[is].fields;

				for(var f = 0; f < inputSet.length; f++) {
					var inputField = inputSet[f];

					if(inputField.template && !inputField.added) {
						// this field is just a template, does not have to have anything assigned
					} else {
						var toRemove = [];
						for(var a in inputField.assigned) {
							var OK = false;
							if(inputField.assigned.hasOwnProperty(a)) {
								var dsID = inputField.assigned[a][0].toString();

								if(mapDataSourceIdToIdx.hasOwnProperty(dsID)) {
									var ds = mapDataSourceIdToIdx[dsID];

									if(ds < listOfDataSources.length && inputField.assigned[a][1] < listOfDataSources[ds].dataSets.length && inputField.assigned[a][2] < listOfDataSources[ds].dataSets[inputField.assigned[a][1]].fields.length) {
										var dataField = listOfDataSources[ds].dataSets[inputField.assigned[a][1]].fields[inputField.assigned[a][2]];
										OK = false;
										if(inputField.type !== undefined) {
											for(var t = 0; t < inputField.type.length; t++) {
												if(dataField.type == inputField.type[t]) {
													OK = true;
													break;
												}
											}
										} else {
											//$log.log(preDebugMsg + "no type for field " + dataField.name);
										}
									} else {
										OK = false;
									}
								} else {
									OK = false;
								}
							}

							if(!OK) {
								toRemove.push(a);
							}
						}

						for(a = 0; a < toRemove.length; a++) {
							delete inputField.assigned[toRemove[a]];
						}
					}
				}
			}

			// check if some sets are completely filled from the same data sources
			for(var is = 0; is < plugin.format.length; is++) {
				var inputSet = plugin.format[is].fields;
				var setIsFilled = true;
				var OKsourcesPerIdSlot = {};
				var OK = true;

				for(var f = 0; f < inputSet.length; f++) {
					var inputField = inputSet[f];
					var idSlot = inputField.idSlot;

					if(!OKsourcesPerIdSlot.hasOwnProperty(idSlot)) {
						OKsourcesPerIdSlot[idSlot] = [];
					}
				}

				for(var idSlot in OKsourcesPerIdSlot) {
					idSetIsFilled = false;
					OKsources = [];
					for(var f = 0; f < inputSet.length; f++) {
						var inputField = inputSet[f];
						if(inputField.idSlot == idSlot && (!inputField.template || inputField.added)) {
							firstField = inputField;
							break;
						}
					}

					for(var a in firstField.assigned) {
						var OK = true;

						for(var f = 0; f < inputSet.length; f++) {
							var inputField = inputSet[f];
							if(inputField.template && !inputField.added) {
								// ignore template fields
							} else {
								if(inputField.idSlot == idSlot) {
									if(!inputField.assigned.hasOwnProperty(a)) {
										OK = false;
									}
								}
							}
						}

						if(OK) {
							idSetIsFilled = true;
							OKsources.push(a);
						}
					}

					OKsourcesPerIdSlot[idSlot] = OKsources;
					if(!idSetIsFilled) {
						setIsFilled = false;
					}
				}

				if(!plugin.active && (plugin.format[is].filled != setIsFilled || JSON.stringify(plugin.format[is].sources) != JSON.stringify(OKsourcesPerIdSlot))) { // if it is already activated, a set that did not change is already used so other changes are not important
					changed = true;
				}

				plugin.format[is].filled = setIsFilled;
				if(setIsFilled) {
					plugin.active = true;
					plugin.format[is].sources = OKsourcesPerIdSlot;
				} else {
					plugin.format[is].sources = {};
				}
			}

			if(changed || plugin.active != oldActive) {
				needsData.push(p);
			}
		}

		for(p = 0; p < needsData.length; p++) {
			sendDataToPlugin(needsData[p]);
		}

		buildNewMapping();

		if(needsData.length == 1) {
			updateSelections(needsData[0]);
		} else if(needsData.length > 0) {
			updateSelections();
		}
	};
	//===================================================================================


	//===================================================================================
	// Build New Mapping
	// This method creates a new mapping of the data source and plugins.
	//===================================================================================
	function buildNewMapping() {
		if(!fullyLoaded) {
			return;
		}

		// //$log.log(preDebugMsg + "buildNewMapping()");

		var mapping = {};
		mapping.plugins = [];

		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = listOfPlugins[p];
			var pMapping = {};

			mapping.plugins.push(pMapping);
			pMapping.name = plugin.name;
			pMapping.grouping = plugin.grouping;
			pMapping.sets = [];

			for(var is = 0; is < plugin.format.length; is++) {
				var inputSet = plugin.format[is].fields;
				var setMapping = {};
				pMapping.sets.push(setMapping);
				setMapping.fields = [];

				for(var f = 0; f < inputSet.length; f++) {
					var inputField = inputSet[f];
					var fMapping = {};
					setMapping.fields.push(fMapping);
					fMapping.name = inputField.name;
					fMapping.assigned = [];
					fMapping.template = inputField.template;
					fMapping.added = inputField.added;

					for(var a in inputField.assigned) {
						if(inputField.assigned.hasOwnProperty(a)) {
							var aMap = {};
							var dsID = inputField.assigned[a][0].toString();

							if(mapDataSourceIdToIdx.hasOwnProperty(dsID)) {
								var ds = mapDataSourceIdToIdx[dsID];
								if(ds < listOfDataSources.length && inputField.assigned[a][1] < listOfDataSources[ds].dataSets.length && inputField.assigned[a][2] < listOfDataSources[ds].dataSets[inputField.assigned[a][1]].fields.length) {
									aMap.sourceName = listOfDataSources[ds].name;
									aMap.dataSetName = listOfDataSources[ds].dataSets[inputField.assigned[a][1]].name;
									aMap.dataSetIdx = inputField.assigned[a][1];
									aMap.fieldName = listOfDataSources[ds].dataSets[inputField.assigned[a][1]].fields[inputField.assigned[a][2]].name;
									fMapping.assigned.push(aMap);
								}
							}
						}
					}
				}
			}
		}

		var oldMapping = $scope.gimme("Mapping");
		if(JSON.stringify(oldMapping) != JSON.stringify(mapping)) {
			// //$log.log(preDebugMsg + "BuildMapping new mapping:" + JSON.stringify(mapping));
			// //$log.log(preDebugMsg + "BuildMapping old mapping:" + JSON.stringify(oldMapping));
			internalMappingSetTo = mapping;
			$scope.set("Mapping", mapping);
		}
	};
	//===================================================================================


	//===================================================================================
	// New Mapping
	// This method initiates the new mapping of the data source and plugins.
	//===================================================================================
	function newMapping(newMapping) {
		// //$log.log(preDebugMsg + "newMapping");
		internalMappingSetTo = newMapping;
		if(!fullyLoaded) {
			return;
		}

		// plugins not mentioned in the new mapping are left unchanged
		var somethingWrong = false;
		try {
			if(typeof newMapping === 'string') {
				newMapping = JSON.parse(newMapping);
			}
		} catch(e) {
			somethingWrong = true;
		}

		// first, sanity check all the mappings
		if(somethingWrong || !newMapping.hasOwnProperty("plugins")) {
			somethingWrong = true;
		} else {
			for(var pm = 0; pm < newMapping.plugins.length; pm++) {
				var mplugin = newMapping.plugins[pm];
				var plugin = null;

				for(var p = 0; p < listOfPlugins.length; p++) {
					if(listOfPlugins[p].name == mplugin.name) {
						plugin = listOfPlugins[p];
						break;
					}
				}

				if(plugin === null) {
					//$log.log(preDebugMsg + "newMapping, unknown plugin: " + JSON.stringify(mplugin));
					somethingWrong = true;
					break;
				}

				if(mplugin.sets.length != plugin.format.length) {
					//$log.log(preDebugMsg + "newMapping, format lengths are different: " + JSON.stringify(mplugin.sets) + " " + JSON.stringify(plugin.format));
					somethingWrong = true;
					break;
				}

				for(var set = 0; !somethingWrong && set < mplugin.sets.length; set++) {
					var mfields = mplugin.sets[set].fields;
					var fields = plugin.format[set].fields;

					if(mfields.length != fields.length) {
						// we may have some added fields that we need to add, if so, add them
						// first remove all old added fields
						var toRemove = [];
						for(var f2 = 0; f2 < fields.length; f2++) {
							if(fields[f2].added) {
								toRemove.push(f2);
							}
						}

						var removed = 0;
						for(var f2 = 0; f2 < toRemove.length; f2++) {
							fields.splice(toRemove[f2] - removed, 1);
							removed++;
						}

						// add new fields for the added ones in the mapping
						for(var f1 = 0; f1 < mfields.length; f1++) {
							if(mfields[f1].added) {
								var OK = false;
								var newField = {};
								newField.name = mfields[f1].name;

								for(var f2 = 0; f2 < fields.length; f2++) {
									if(fields[f2].template && fields[f2].name == mfields[f1].name) {
										OK = true;
										newField.type = fields[f2].type;
										newField.slot = fields[f2].slot;
										newField.idSlot = fields[f2].idSlot;
										break;
									}
								}
								newField.added = true;
								newField.template = false;
								newField.assigned = {};
								fields.splice(f1, 0, newField);
							}
						}
					}

					if(mfields.length != fields.length) {
						//$log.log(preDebugMsg + "newMapping, field lengths are different: " + JSON.stringify(mfields) + " " + JSON.stringify(fields));
						somethingWrong = true;
						break;
					}

					// check types of added fields again, since they somehow end up without types etc. sometimes
					for(var f1 = 0; f1 < fields.length; f1++) {
						if(fields[f1].added) {
							for(var f2 = 0; f2 < fields.length; f2++) {
								if(fields[f2].template && fields[f2].name == fields[f1].name) {
									fields[f1].type = fields[f2].type;
									fields[f1].slot = fields[f2].slot;
									fields[f1].idSlot = fields[f2].idSlot;
									break;
								}
							}
						}
					}

					for(var f = 0; !somethingWrong && f < mfields.length; f++) {
						for(var a = 0; !somethingWrong && a < mfields[f].assigned.length; a++) {
							var dsName = mfields[f].assigned[a].sourceName;
							if(!mapDataSourceNameToId.hasOwnProperty(dsName)) {
								//$log.log(preDebugMsg + "newMapping, unknown data source: " + JSON.stringify(dsName) + " " + JSON.stringify(mapDataSourceNameToId));
								somethingWrong = true;
								break;
							}
							var dsId = mapDataSourceNameToId[dsName];
							if(!mapDataSourceIdToIdx.hasOwnProperty(dsId)) {
								//$log.log(preDebugMsg + "newMapping, data source index unknown (should not happen): " + JSON.stringify(dsId) + " " + JSON.stringify(mapDataSourceIdToIdx));
								somethingWrong = true;
								break;
							}
							var dsIdx = mapDataSourceIdToIdx[dsId];
							if(dsIdx >= listOfDataSources.length || mfields[f].assigned[a].dataSetIdx >= listOfDataSources[dsIdx].dataSets.length) {
								//$log.log(preDebugMsg + "newMapping, data source index too high (should not happen) or assigned set index too high: " + JSON.stringify(dsIdx) + " " + JSON.stringify(mfields[f]) + " " + JSON.stringify(listOfDataSources[dsIdx]));
								somethingWrong = true;
								break;
							}
							var found = false;
							for(var ff = 0; ff < listOfDataSources[dsIdx].dataSets[mfields[f].assigned[a].dataSetIdx].fields.length; ff++) {
								if(listOfDataSources[dsIdx].dataSets[mfields[f].assigned[a].dataSetIdx].fields[ff].name == mfields[f].assigned[a].fieldName) {
									found = true;
									break;
								}
							}
							if(!found) {
								somethingWrong = true;
								break;
							}
						}
					}
				}
			}
		}

		if(somethingWrong) {
			buildNewMapping();
		} else {
			// since all mappings were OK, go through and update
			var dirty = {};

			for(var pm = 0; pm < newMapping.plugins.length; pm++) {
				var mplugin = newMapping.plugins[pm];
				var plugin = null;

				for(var p = 0; p < listOfPlugins.length; p++) {
					if(listOfPlugins[p].name == mplugin.name) {
						plugin = listOfPlugins[p];
						break;
					}
				}

				plugin.grouping = mplugin.grouping;

				for(var set = 0; set < mplugin.sets.length; set++) {
					var mfields = mplugin.sets[set].fields;
					var fields = plugin.format[set].fields;

					for(var f = 0; f < mfields.length; f++) {
						var oldAssigned = fields[f].assigned;
						fields[f].assigned = {}; // clear out all old assigned data

						for(var a = 0; a < mfields[f].assigned.length; a++) {
							var dsName = mfields[f].assigned[a].sourceName;
							var dsId = mapDataSourceNameToId[dsName];
							var dsIdx = mapDataSourceIdToIdx[dsId];
							var fieldIdx = false;
							for(var ff = 0; ff < listOfDataSources[dsIdx].dataSets[mfields[f].assigned[a].dataSetIdx].fields.length; ff++) {
								if(listOfDataSources[dsIdx].dataSets[mfields[f].assigned[a].dataSetIdx].fields[ff].name == mfields[f].assigned[a].fieldName) {
									fieldIdx = ff;
									break;
								}
							}

							var assignedID = dsId.toString() + " " + mfields[f].assigned[a].dataSetIdx;
							var newVal = [dsId.toString(), mfields[f].assigned[a].dataSetIdx, fieldIdx];
							fields[f].assigned[assignedID] = newVal;

							if(!oldAssigned.hasOwnProperty(assignedID) || oldAssigned[assignedID][2] != newVal[2]) {
								dirty[p] = true;
							}
						}
					}
				}
			}

			checkAssignedDataFields(); // Check data types, send data, etc. Will also build a new mapping (adding any unaffected plugins)

			for(var p in dirty) {
				var pIdx = Number(p);
				sendDataToPlugin(pIdx);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Send Data to Plugin
	// This method sends the data to the plugin.
	//===================================================================================
	function sendDataToPlugin(pluginIdx) {
		// //$log.log(preDebugMsg + "sendDataToPlugin " + pluginIdx);
		var plugin = listOfPlugins[pluginIdx];
		var webble = $scope.getWebbleByInstanceId(plugin.id);

		if(webble === undefined || webble.scope() === undefined) {
			// this can happen if our child has not finished loading yet
		} else {
			if(plugin.active) {
				var filledFormat = [];
				var inputSet = plugin.format[0].fields; // find first filled set
				var sourcesPerIdSlot = {};
				for(var i = 0; i < plugin.format.length; i++) {
					if(plugin.format[i].filled) {
						inputSet = plugin.format[i].fields;
						sourcesPerIdSlot = plugin.format[i].sources;
						break;
					}
				}

				var selectionArraysPerIdSlot = {};

				for(var idSlot in sourcesPerIdSlot) {
					selectionArraysPerIdSlot[idSlot] = [];
					var idSlotsMapped = {};
					var multipliedSlots = {};

					for(f = 0; f < inputSet.length; f++) {
						var fieldFormat = {};
						var inputField = inputSet[f];
						if(inputField.template && !inputField.added) {
							// skip this field
						} else {
							if(inputField.idSlot == idSlot) {
								var dataArrays = [];
								var idArrays = [];
								selectionArrays = selectionArraysPerIdSlot[idSlot];
								sources = sourcesPerIdSlot[idSlot];

								for(var aa = 0; aa < sources.length; aa++) {
									var a = sources[aa];
									var dataSourceId = inputField.assigned[a][0].toString();
									var dataSource = mapDataSourceIdToIdx[dataSourceId];
									var dataSet = inputField.assigned[a][1];
									var dataField = inputField.assigned[a][2];
									var sourceWebble = $scope.getWebbleByInstanceId(dataSourceId);

									if(sourceWebble !== undefined && sourceWebble.scope() !== undefined) {
										var idSlotCheckSource = dataSourceId + " " + dataSet;
										var idSlotCheckPlugin = a + " " + inputField.idSlot;
										var IDsAreAlreadyHandled = false;

										if(listOfDataSources[dataSource].dataSets[dataSet].noID) { // this is a hybrid data source that uses IDs from another data source
											IDsAreAlreadyHandled = true;
											var deactivate = true;
											var org = getOriginalDataSourceForHybridDataSource(dataSource, dataSet);
											if(org.hasOwnProperty('dataSet')) {
												idArrays.push(mapOfDataIDsToUniqueIDs[org.dataSourceId][listOfDataSources[org.dataSourceIdx].dataSets[org.dataSet].idSlot].id);
												selectionArrays.push(mapOfDataIDsToUniqueIDs[org.dataSourceId][listOfDataSources[org.dataSourceIdx].dataSets[org.dataSet].idSlot].sel);
												deactivate = false;
											}
											if(deactivate) {
												plugin.active = false;
											}
										}

										if(idSlotsMapped.hasOwnProperty(idSlotCheckPlugin) && idSlotsMapped[idSlotCheckPlugin] != idSlotCheckSource) {
											// two fields that should come from the same data set do not
											plugin.active = false;
											break;
										} else {
											idSlotsMapped[idSlotCheckPlugin] = idSlotCheckSource;
											if(!IDsAreAlreadyHandled) {
												idArrays.push(mapOfDataIDsToUniqueIDs[dataSourceId.toString()][listOfDataSources[dataSource].dataSets[dataSet].idSlot].id);
												selectionArrays.push(mapOfDataIDsToUniqueIDs[dataSourceId.toString()][listOfDataSources[dataSource].dataSets[dataSet].idSlot].sel);
											}
											if(Object.prototype.toString.call(sourceWebble.scope().gimme(listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].slot)) === '[object Array]') {
												dataArrays.push(sourceWebble.scope().gimme(listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].slot));
											} else {
												plugin.active = false; // no data yet
											}
										}
									}
								}

								if(inputField.added) { // this is a field added from a template field, and we may need to pack many copies of this into one slot
									if(multipliedSlots.hasOwnProperty(inputField.name)) {
										dataArraysList = multipliedSlots[inputField.name].dataArraysList;
										dataArraysList.push(dataArrays);
										fieldFormat = multipliedSlots[inputField.name].fieldFormat;
										fieldFormat.packedTypes += listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].type + ";";
										fieldFormat.packedDescriptions += listOfDataSources[dataSource].dataSets[dataSet].name + ": " + listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].name + ";";
									} else {
										fieldFormat.packedTypes = listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].type + ";";
										fieldFormat.packedDescriptions = listOfDataSources[dataSource].dataSets[dataSet].name + ": " + listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].name + ";";
										fieldFormat.idSlot = inputField.idSlot;
										fieldFormat.slot = inputField.slot;
										fieldFormat.description = listOfDataSources[dataSource].dataSets[dataSet].name + ": " + listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].name;
										fieldFormat.type = listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].type;
										fieldFormat.name = inputField.name;

										if(listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].hasOwnProperty("metadata")) {
											fieldFormat.metadata = listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].metadata;
										}
										multipliedSlots[inputField.name] = {'fieldFormat':fieldFormat, 'dataArraysList':[dataArrays], 'idArrays':idArrays};
									}
								} else { // a regular field (not added)
									webble.scope().set(inputField.slot, dataArrays);
									webble.scope().set(inputField.idSlot, idArrays);
									fieldFormat.idSlot = inputField.idSlot;
									fieldFormat.slot = inputField.slot;
									fieldFormat.description = listOfDataSources[dataSource].dataSets[dataSet].name + ": " + listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].name;
									fieldFormat.type = listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].type;
									fieldFormat.name = inputField.name;

									if(listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].hasOwnProperty("metadata")) {
										fieldFormat.metadata = listOfDataSources[dataSource].dataSets[dataSet].fields[dataField].metadata;
									}

									filledFormat.push(fieldFormat);
								}
							}
						}
					}

					for(var mField in multipliedSlots) {
						dataArraysList = multipliedSlots[inputField.name].dataArraysList;
						idArrays = multipliedSlots[inputField.name].idArrays;

						webble.scope().set(inputField.slot, dataArraysList);
						webble.scope().set(inputField.idSlot, idArrays)

						fieldFormat = multipliedSlots[inputField.name].fieldFormat;
						filledFormat.push(fieldFormat);
					}
				}
				if(plugin.active) {
					try {
						webble.scope().set('DataValuesSetFilled', filledFormat);
						// tell plugin that the data may be new even if the format is not! (should not be necessary, since it is a new object)
						webble.scope().set('GlobalSelections', selectionArraysPerIdSlot);
					} catch(e) {
						//$log.log(preDebugMsg + "Something went wrong when sending data to plugin " + plugin.name);
					}
				}
			} else {
				plugin.active = false;
			}

			if(!plugin.active) {
				try {
					webble.scope().set('DataValuesSetFilled', []);
				} catch(e) {
					//$log.log(preDebugMsg + "Something went wrong when clearing data of plugin " + plugin.name);
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// New Colors
	// This method sets new colors for the plugins.
	//===================================================================================
	function newColors(newColorDictionary) {
		// //$log.log(preDebugMsg + "newColors");
		var colorDictionary = newColorDictionary;
		try {
			if(typeof colorDictionary === 'string') {
				colorDictionary = JSON.parse(colorDictionary);
			}
		} catch(e) {
			colorDictionary = currentColors;
		}

		if(Object.keys(colorDictionary).length <= 1 && Object.keys(currentColors).length > 0) {
			colorDictionary = currentColors; // the slot value was probably broken JSON, so we got an empty dictionary from the Webble platform
		}

		if(colorDictionary != newColorDictionary) {
			$scope.set('Colors', colorDictionary);
		} else {
			currentColors = newColorDictionary;

			for(var p = 0; p < listOfPlugins.length; p++) {
				try {
					var webble = $scope.getWebbleByInstanceId(listOfPlugins[p].id);
					if(webble !== undefined && webble.scope() !== undefined) {
						try {
							webble.scope().set("GroupColors", colorDictionary);
						} catch(e) {
							//$log.log(preDebugMsg + "Something went wrong when setting colors on plugin.");
						}
					} else {
						//$log.log(preDebugMsg + "my child with ID " + listOfPlugins[p].id + " is still undefined, could not set colors.");
					}
				} catch(e) {
					//$log.log(preDebugMsg + "Trying to set colors of child with ID " + listOfPlugins[p].id + " crashed.");
				}
			}

			for(var p = 0; p < listOfDataSources.length; p++) {
				try {
					var webble = $scope.getWebbleByInstanceId(listOfDataSources[p].id);
					if(webble !== undefined && webble.scope() !== undefined) {
						try {
							webble.scope().set("GroupColors", colorDictionary);
						} catch(e) {
							//$log.log(preDebugMsg + "Something went wrong when setting colors on data source.");
						}
					} else {
						//$log.log(preDebugMsg + "my data source with ID " + listOfDataSources[p].id + " is still undefined, could not set colors.");
					}
				} catch(e) {
					//$log.log(preDebugMsg + "Trying to set colors of data source with ID " + listOfDataSources[p].id + " crashed.");
				}
			}

			if(colorDictionary.hasOwnProperty("skin")) {
				if(colorDictionary.skin.hasOwnProperty("text")) {
					$scope.set("dashboardBackgroundBox:color", colorDictionary.skin.text);
				}
				if(colorDictionary.skin.hasOwnProperty("color")) {
					$scope.set("dashboardBackgroundBox:background-color", colorDictionary.skin.color);
				}
				if(colorDictionary.skin.hasOwnProperty("border")) {
					$scope.set("dashboardBackgroundBox:border", colorDictionary.skin.border);
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Auto Design Data Fields
	// This method is supposed to auto design Data fields.
	// DECREMENTED
	//===================================================================================
	/*function autoAssignDataFields() {
		// //$log.log(preDebugMsg + "autoAssignDataFields");
		for(var p = 0; p < listOfPlugins.length; p++) {
			var plugin = listOfPlugins[p];

			for(var is = 0; is < plugin.format.length; is++) {
				var inputSet = plugin.format[is].fields;

				for(var f = 0; f < inputSet.length; f++) {
					var inputField = inputSet[f];
					var candidate = null;

		    		for(var ds = 0; ds < listOfDataSources.length; ds++) {
		    			if(plugin.id != listOfDataSources[ds].id) {
		    				for(var dss = 0; dss < listOfDataSources[ds].dataSets.length; dss++) {
		    					var dataSet = listOfDataSources[ds].dataSets[dss];
		    					var assignedID = listOfDataSources[ds].id.toString() + " " + dss;

								if(!inputField.assigned.hasOwnProperty(assignedID)) {
									var OK = true;

				    				for(var df = 0; OK && df < dataSet.fields.length; df++) {
				    					var dataField = dataSet.fields[df];

				    					for(var t = 0; t < inputField.type.length; t++) {
				    						if(dataField.type == inputField.type[t]) {
				    							// a match!
												if(candidate !== null) {
													// more than one candidate
						    						OK = false;
												} else {
													candidate = df;
												}
				    						}
				    					}
				    				}

				    				if(OK && candidate !== null) {
				    					inputField.assigned[assignedID] = [listOfDataSources[ds].id.toString(), dss, candidate];
				    				}
								}
		    				}
		    			}
		    		}
				}
			}
		}
	};*/
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points in every plugin
	//===================================================================================
	$scope.selectAll = function() {
		for(var p = 0; p < listOfPlugins.length; p++) {
			try {
				var webble = $scope.getWebbleByInstanceId(listOfPlugins[p].id);
				if(webble !== undefined && webble.scope() !== undefined) {
					try {
						webble.scope().set("SelectAll", true);
					} catch(e) {
						//$log.log(preDebugMsg + "Something went wrong when doing select all on plugin.");
					}
				} else {
					//$log.log(preDebugMsg + "my child with ID " + listOfPlugins[p].id + " is still undefined, could not set selections.");
				}
			} catch(e) {
				//$log.log(preDebugMsg + "Trying to set selections for child with ID " + listOfPlugins[p].id + " crashed.");
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble template Interaction Object Activity Reaction
	// If this template has its own custom Interaction balls that needs to be taken care
	// of when activated, then it is here where that should be executed.
	// If this function is empty and unused it can safely be deleted.
	//===================================================================================
	$scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
		var targetName = $(event.target).scope().getName();

		if (targetName != ""){
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
		if(itemName == 'connectDataToPlugin'){
			//$log.log('DigitalDashboard: connect menu item called.');
			openConnectionformViz2Data2Viz(true);
		} else if(itemName == 'connectPluginAndData') {
			//$log.log('DigitalDashboard: connect menu item called.');
			openConnectionformViz2Data2Viz(false);
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble template Create Custom Webble Definition
	// If this template wants to store its own private data in the Webble definition it
	// can create that custom object here and return to the core.
	// If this function is empty and unused it can safely be deleted.
	//===================================================================================
	$scope.coreCall_CreateCustomWblDef = function(){
		var customWblDefPart = {};
		return customWblDefPart;
	};
	//===================================================================================


	//=== CTRL MAIN CODE ======================================================================

});
//======================================================================================================================



//=======================================================================================
// CONNECTION VISUALIZATION TO DATA TO VISUALITION FORM CONTROLLER
// This is the Viz2Data2Viz Form controller for this Webble Template
//=======================================================================================
wblwrld3App.controller("connectionViz2Data2VizForm_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
	var preDebugMsg = "DigitalDashboard connectionViz2DataForm: ";

	$scope.formProps = {
		eaType: props.eaType,
		plugins: props.plugins,
		dataSources: props.dataSources,
		somethingChanged: false,
		changedPlugins: {},
		possibleOpts: [],
		infoMsg: '',
		browser: BrowserDetect.browser
	};

	$scope.close = function (result) {
		// //$log.log(preDebugMsg + "close");

		$uibModalInstance.close({plugins: $scope.formProps.plugins, somethingChanged: $scope.formProps.somethingChanged, changedPlugins: $scope.formProps.changedPlugins});
	};

	$scope.differentIds = function(dataSource, plugin) {
		if(plugin.id != dataSource.id) {
			return true;
		} else {
			return false;
		}
	};

	$scope.clearFields = function(dataSource, plugin) {
		// //$log.log(preDebugMsg + "clearFields");

		for(var ps = 0; ps < plugin.sets.length; ps++) {

			for(var ds = 0; ds < dataSource.sets.length; ds++) {

				var assignedID = dataSource.id.toString() + " " + ds;

				for(var inpF = 0; inpF < plugin.sets[ps].fields.length; inpF++) {

					if(plugin.sets[ps].fields[inpF].assigned.hasOwnProperty(assignedID)) {
						delete plugin.sets[ps].fields[inpF].assigned[assignedID];
						$scope.formProps.changedPlugins[plugin.idx.toString()] = plugin.idx;
						$scope.formProps.somethingChanged = true;
					}
				}
			}
		}

		props.wblScope.openForm(Enum.aopForms.infoMsg, {title: 'Cleared', content: 'The visualization plugin will no longer get data from this data source.'});
	};

	$scope.connectFields = function(dataSource, plugin) {
		// //$log.log(preDebugMsg + "connectFields");

		var pluginGrouping = plugin.grouping;
		var pluginName = plugin.name;

		var pluginSets = [];

		for(var ps = 0; ps < plugin.sets.length; ps++) {
			var pluginSet = {};
			pluginSet.dataSets = [];
			pluginSet.idx = ps;

			for(var ds = 0; ds < dataSource.sets.length; ds++) {
				var dataSet = {};
				dataSet.fields = [];
				dataSet.idx = ds;

				var assignedID = dataSource.id.toString() + " " + ds;

				for(var inpF = 0; inpF < plugin.sets[ps].fields.length; inpF++) {
					var field = {};
					field.name = plugin.sets[ps].fields[inpF].name;
					field.idx = inpF;
					field.origIdx = inpF;
					field.input = null;

					field.template = plugin.sets[ps].fields[inpF].template;
					field.added = plugin.sets[ps].fields[inpF].added;

					field.inputList = [];
					field.inputList.push({id:null, name: ''});

					for(var dataF = 0; dataF < dataSource.sets[ds].fields.length; dataF++) {
						for(var t = 0; t < plugin.sets[ps].fields[inpF].type.length; t++) {
							if(plugin.sets[ps].fields[inpF].type[t] == dataSource.sets[ds].fields[dataF].type) {
								var input = {};
								input.name = dataSource.sets[ds].fields[dataF].name;
								input.id = dataF;

								if(plugin.sets[ps].fields[inpF].assigned.hasOwnProperty(assignedID)
									&& plugin.sets[ps].fields[inpF].assigned[assignedID][2] == dataF) {
									// this field is assigned here already
									field.input = dataF;
								}

								field.inputList.push(input);
							}
						}
					}

					dataSet.fields.push(field);
				}

				pluginSet.dataSets.push(dataSet);
			}

			pluginSets.push(pluginSet);
		}

		//$log.log(preDebugMsg + "open form with pluginSets = " + JSON.stringify(pluginSets));

		props.wblScope.openForm('connectionFieldsForm', [{templateUrl: 'connectionFieldsForm.html', controller: 'connectionFieldsForm_Ctrl', size: 'lg'},
				{wblScope: props.wblScope,
					pluginSets:pluginSets,
					pluginName:pluginName,
					pluginGrouping:pluginGrouping,
					pluginIdx:plugin.idx,
					dataSourceId:dataSource.id}],
			closeFieldConnectionform);
	};


	$scope.connectFieldsMultiple = function(plugin, dataSources) {
		// //$log.log(preDebugMsg + "connectFieldsMultiple");

		var pluginGrouping = plugin.grouping;
		var pluginName = plugin.name;

		var pluginSets = [];

		for(var ps = 0; ps < plugin.sets.length; ps++) {
			var pluginSet = {};
			pluginSet.dataSets = [];
			pluginSet.idx = ps;

			var multipleDataSet = {};
			multipleDataSet.fields = [];
			multipleDataSet.idx = -1;

			for(var inpF = 0; inpF < plugin.sets[ps].fields.length; inpF++) {
				var field = {};
				field.name = plugin.sets[ps].fields[inpF].name;
				field.idx = inpF;
				field.origIdx = inpF;
				field.input = null;

				field.template = plugin.sets[ps].fields[inpF].template;
				field.added = plugin.sets[ps].fields[inpF].added;

				field.inputList = [];
				field.inputList.push({id:null, name: ''});

				var idx = 0;
				for(var d = 0; d < dataSources.length; d++) {
					var dataSource = dataSources[d];

					for(var ds = 0; ds < dataSource.sets.length; ds++) {

						var assignedID = dataSource.id.toString() + " " + ds;

						for(var dataF = 0; dataF < dataSource.sets[ds].fields.length; dataF++) {
							for(var t = 0; t < plugin.sets[ps].fields[inpF].type.length; t++) {
								if(plugin.sets[ps].fields[inpF].type[t] == dataSource.sets[ds].fields[dataF].type) {
									var input = {};
									input.name = dataSource.sets[ds].fields[dataF].name;
									input.id = idx;

									input.dataSourceIdx = d;
									input.dataSourceId = dataSource.id;
									input.assignedID = assignedID;
									input.dataSet = ds;
									input.dataField = dataF;

									if(plugin.sets[ps].fields[inpF].assigned.hasOwnProperty(assignedID)
										&& plugin.sets[ps].fields[inpF].assigned[assignedID][2] == dataF) {
										// this field is assigned here already
										field.input = idx;
									}

									field.inputList.push(input);
								}
							}
							idx++;
						}
					}
				}
				multipleDataSet.fields.push(field);
			}
			pluginSet.dataSets.push(multipleDataSet);
			pluginSets.push(pluginSet);
		}
		// //$log.log(preDebugMsg + "open form with pluginSets = " + JSON.stringify(pluginSets));

		props.wblScope.openForm('connectionFieldsForm', [{templateUrl: 'connectionFieldsForm.html', controller: 'connectionFieldsForm_Ctrl', size: 'lg'},
				{wblScope: props.wblScope,
					pluginSets:pluginSets,
					pluginName:pluginName,
					pluginGrouping:pluginGrouping,
					pluginIdx:plugin.idx,
					dataSourceId:dataSource.id}],
			closeFieldConnectionMultipleform);
	};


	function closeFieldConnectionform(returnContent) {
		// //$log.log(preDebugMsg + "closeFieldConnectionform");

		if(returnContent !== null && returnContent !== undefined) {
			var plugin = null;
			var changed = false;

			// //$log.log(preDebugMsg + "returnContent = " + JSON.stringify(returnContent));
			var p;

			for(p = 0; p < $scope.formProps.plugins.length; p++) {
				if($scope.formProps.plugins[p].idx == returnContent.pluginIdx) {
					plugin = $scope.formProps.plugins[p];

					plugin.grouping = returnContent.pluginGrouping;
					break;
				}
			}

			if(plugin !== null) {
				// var newPluginSet = returnContent.pluginSets[returnContent.pluginIdx];
				// var oldPluginSet = plugin.sets[newPluginSet.idx];

				var newPluginSet = returnContent.pluginSets;
				var oldPluginSet = plugin.sets;

				if(returnContent.fieldsAddedOrRemoved) {
					// check if we need to remove something

					changed = true;
					$scope.formProps.changedPlugins[p.toString()] = p;

					for(var pset = 0; pset < oldPluginSet.length; pset++) {
						var toRemove = [];

						for(var f = 0; f < oldPluginSet[pset].fields.length; f++) {
							var field = oldPluginSet[pset].fields[f];
							var origIdx = f;
							var stillHere = false;

							var ds = 0;
							var dataSet = newPluginSet[pset].dataSets[ds]; // all dataSets should be the same in the field setup, just take the first

							for(var f2 = 0; f2 < dataSet.fields.length; f2++) {
								if(origIdx == dataSet.fields[f2].origIdx) {
									stillHere = true;
									break;
								}
							}

							if(!stillHere) {
								// removed
								toRemove.push(origIdx);
							}
						}

						var alreadyRemoved = 0;
						for(var r = 0; r < toRemove.length; r++) {
							var origIdx = toRemove[r];

							oldPluginSet[pset].fields.splice(origIdx - alreadyRemoved, 1);
							alreadyRemoved++;
						}
					}

					// check if we need to add something

					for(var pset = 0; pset < newPluginSet.length; pset++) {
						var ds = 0;
						var dataSet = newPluginSet[pset].dataSets[ds]; // all dataSets should be the same in the field setup, just take the first

						for(var f = 0; f < dataSet.fields.length; f++) {
							var field = dataSet.fields[f];
							if(field.origIdx < 0) { // added now
								var newField = {};
								newField.name = field.name;

								for(var f2 = 0; f2 < oldPluginSet[pset].fields.length; f2++) {
									if(oldPluginSet[pset].fields[f2].template
										&& oldPluginSet[pset].fields[f2].name == newField.name) {
										newField.type = oldPluginSet[pset].fields[f2].type;
										break;
									}
								}

								newField.added = true;
								newField.template = false;
								newField.assigned = {};

								oldPluginSet[pset].fields.splice(field.idx, 0, newField);
							}
						}
					}
				}

				for(var pset = 0; pset < newPluginSet.length; pset++) {

					for(var ds = 0; ds < newPluginSet[pset].dataSets.length; ds++) {
						var dataSet = newPluginSet[pset].dataSets[ds];

						var assignedID = returnContent.dataSourceId.toString() + " " + ds;

						for(var f = 0; f < dataSet.fields.length; f++) {
							var field = dataSet.fields[f];

							// //$log.log(preDebugMsg + "field.input = " + field.input);

							if(field.input !== null) {
								// something was selected
								var selectedDataField = null;
								for(var ff = 0; ff < field.inputList.length; ff++) {
									if(field.inputList[ff].id == field.input) {
										selectedDataField = field.inputList[ff];
										break;
									}
								}
								if(selectedDataField === null) {
									field.input = null;
								}
								if(oldPluginSet[pset].fields[f].assigned.hasOwnProperty(assignedID)
									&& oldPluginSet[pset].fields[f].assigned[assignedID][2] == selectedDataField.id) {
									// no change
								} else {
									oldPluginSet[pset].fields[f].assigned[assignedID] = [returnContent.dataSourceId.toString(), ds, selectedDataField.id];
									changed = true;
									$scope.formProps.changedPlugins[p.toString()] = p;
								}
							}

							if(field.input === null) {
								if(oldPluginSet[pset].fields[f].assigned.hasOwnProperty(assignedID)) {
									delete oldPluginSet[pset].fields[f].assigned[assignedID];
									changed = true;
									$scope.formProps.changedPlugins[p.toString()] = p;
								} else {
									// no change
								}
							}
						}
					}
				}
			}
		}

		if(changed) {
			$scope.formProps.somethingChanged = true;
		}
	};


	function closeFieldConnectionMultipleform(returnContent) {
		// //$log.log(preDebugMsg + "closeFieldConnectionMultipleform");

		if(returnContent !== null && returnContent !== undefined) {
			var plugin = null;
			var changed = false;

			// //$log.log(preDebugMsg + "returnContent = " + JSON.stringify(returnContent));

			for(var p = 0; p < $scope.formProps.plugins.length; p++) {
				if($scope.formProps.plugins[p].idx == returnContent.pluginIdx) {
					plugin = $scope.formProps.plugins[p];

					plugin.grouping = returnContent.pluginGrouping;
					break;
				}
			}

			if(plugin !== null) {
				// var newPluginSet = returnContent.pluginSets[returnContent.pluginIdx];
				// var oldPluginSet = plugin.sets[newPluginSet.idx];
				var newPluginSet = returnContent.pluginSets;
				var oldPluginSet = plugin.sets;

				for(var pset = 0; pset < newPluginSet.length; pset++) {
					var dataSet = newPluginSet[pset].dataSets[0];

					for(var f = 0; f < dataSet.fields.length; f++) {
						var field = dataSet.fields[f];

						for(var ds = 0; ds < newPluginSet[pset].dataSets.length; ds++) {

							if(field.input !== null) {
								// something was selected
								var selectedDataField = null;
								var assignedID = "";
								returnContent.dataSourceId.toString() + " " + ds;

								for(var ff = 0; ff < field.inputList.length; ff++) {
									if(field.inputList[ff].id == field.input) {
										selectedDataField = field.inputList[ff];
										break;
									}
								}
								if(selectedDataField === null) {
									field.input = null;
								}
								if(selectedDataField !== null) {
									assignedID = selectedDataField.assignedID;

									if(oldPluginSet[pset].fields[f].assigned.hasOwnProperty(assignedID)
										&& oldPluginSet[pset].fields[f].assigned[assignedID][2] == selectedDataField.dataField) {
										// no change
									} else {
										oldPluginSet[pset].fields[f].assigned[assignedID] = [selectedDataField.dataSourceId.toString(), selectedDataField.dataSet, selectedDataField.dataField];
										changed = true;
										$scope.formProps.changedPlugins[p.toString()] = p;
									}
								}
							}

							if(field.input === null) {
								var toRemove = []; // remove any previously assigned things
								for(var assignedID in oldPluginSet[pset].fields[f].assigned) {
									toRemove.push(assignedID);
								}
								for(var ai = 0; ai < toRemove.length; ai++) {
									var assignedID = toRemove[ai];
									delete oldPluginSet[pset].fields[f].assigned[assignedID];
									changed = true;
									$scope.formProps.changedPlugins[p.toString()] = p;
								}
							} else {
								// no change
							}
						}
					}
				}
			}
		}

		if(changed) {
			$scope.formProps.somethingChanged = true;
		}
	};


	$scope.getRowBkgColor = function(rowIndex) {
		if((rowIndex+1)%2 == 0){
			return '#fffe9b';
		}
		else{
			return 'transparent';
		}
	};
});
//======================================================================================================================



//=======================================================================================
// CONNECTION FIELDS FORM CONTROLLER
// This is the Connection Fields Form controller for this Webble Template
//=======================================================================================
wblwrld3App.controller("connectionFieldsForm_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {	
	var preDebugMsg = "DigitalDashboard connectionFieldsForm: ";

	$scope.formProps = {
		eaType: props.eaType,
		dataSourceId: props.dataSourceId,
		pluginIdx: props.pluginIdx,
		pluginName: props.pluginName,
		pluginGrouping: props.pluginGrouping,
		pluginSets: props.pluginSets,
		fieldsAddedOrRemoved: false,
		possibleOpts: [],
		infoMsg: '',
		browser: BrowserDetect.browser
	};

	$scope.close = function (result) {
		// //$log.log(preDebugMsg + "close");

		if(result == 'cancel'){
			$uibModalInstance.close(null);
		}
		else if(result == 'submit'){
			$uibModalInstance.close({dataSourceId: $scope.formProps.dataSourceId,
				pluginGrouping: $scope.formProps.pluginGrouping,
				pluginIdx: $scope.formProps.pluginIdx,
				pluginSets: $scope.formProps.pluginSets,
				fieldsAddedOrRemoved: $scope.formProps.fieldsAddedOrRemoved});
		} else {
			$uibModalInstance.close(null);
		}
	};

	$scope.removeField = function (inpPluginSet, inpDataSet, inpField) {
		// //$log.log(preDebugMsg + "removeField");
		// //$log.log(preDebugMsg + "removeField: " + JSON.stringify(inpField));

		$scope.formProps.fieldsAddedOrRemoved = true;

		var ps = inpPluginSet.idx
		var pluginSet = $scope.formProps.pluginSets[ps];
		var ds = inpDataSet.idx;

		var inpF = inpField.idx;

		var templ = pluginSet.dataSets[ds].fields[inpF];

		for(var ds = 0; ds < pluginSet.dataSets.length; ds++) { // add and remove for all dataSources
			for(var dataF = inpF+1; dataF < pluginSet.dataSets[ds].fields.length; dataF++) {
				pluginSet.dataSets[ds].fields[dataF].idx--;
			}

			pluginSet.dataSets[ds].fields.splice(inpF, 1);
		}

	};

	$scope.addField = function (inpPluginSet, inpDataSet, inpField) {
		// //$log.log(preDebugMsg + "addField");
		// //$log.log(preDebugMsg + "addField: " + JSON.stringify(inpField));

		$scope.formProps.fieldsAddedOrRemoved = true;

		var ps = inpPluginSet.idx
		var pluginSet = $scope.formProps.pluginSets[ps];
		var ds = inpDataSet.idx;

		var inpF = inpField.idx;

		var templ = pluginSet.dataSets[ds].fields[inpF];

		for(var ds = 0; ds < pluginSet.dataSets.length; ds++) { // add and remove for all dataSources
			var newField = {};
			newField.name = templ.name;
			newField.idx = templ.idx + 1; // update all other indexes too
			newField.origIdx = -1;
			newField.input = null;

			newField.template = false;
			newField.added = true;

			newField.inputList = [];
			for(var inpIdx = 0; inpIdx < templ.inputList.length; inpIdx++) {
				var newInput = {};
				newInput.name = templ.inputList[inpIdx].name;
				newInput.id = templ.inputList[inpIdx].id;

				newField.inputList.push(newInput);
			}

			if(newField.idx < pluginSet.dataSets[ds].fields.length) {
				for(var dataF = newField.idx; dataF < pluginSet.dataSets[ds].fields.length; dataF++) {
					pluginSet.dataSets[ds].fields[dataF].idx++;
				}

				pluginSet.dataSets[ds].fields.splice(newField.idx, 0, newField);
			} else {
				pluginSet.dataSets[ds].fields.push(newField);
			}
		}
	};

	$scope.getRowBkgColor = function(rowIndex) {
		if((rowIndex+1)%2 == 0){
			return '#fffe9b';
		}
		else{
			return 'transparent';
		}
	};
});
//======================================================================================================================
