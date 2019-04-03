//======================================================================================================================
// Controllers for HandsOnPortalTravelApp for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
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

    $scope.customMenu = [];

    $scope.displayText = "Loading the Travel environment. Please wait...";


    // ---------------------------------------------------------------------------------------
    // -- These should be the actual Webble names that Webbles are published under -----------
    // ---------------------------------------------------------------------------------------
    var barName = "hopVizBarChartWebble";
    var mapName = "hopVizMapWebble";
    var dataSrcName = "hopFileDataWebble";
    // ---------------------------------------------------------------------------------------

    var neededChildren = {};
    var loadedChildren = {};
    var templateName2instanceName = {};
    
    var setupDone = false;

    var listeners = [];

    var inPortal = false;

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("hopAppTravelAppLoaderWebble: " + message);
	}
    };

    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================


    //===================================================================================
    // Webble template Initialization
    // If any initiation needs to be done when the webble is created it is here that
    // should be executed. the saved def object is sent as a parameter in case it
    // includes data this webble needs to retrieve.
    // If this function is empty and unused it can safely be deleted.
    // Possible content for this function is as follows:
    // *Add own slots
    // *Set the default slot
    // *Set Custom Child Container
    // *Create Value watchers for slots and other values
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        $scope.setDefaultSlot('');


	// ===============================================================================
	// -------- Guess if we are running in the Hands-on Portal or in Webble World ----
	// ===============================================================================

	var url = (window.location != window.parent.location)
            ? document.referrer
            : document.location;

	debugLog("I believe my parent is on URL: " + url);
	var urlLower = url.toString().toLowerCase();
	inPortal = false;

	if(urlLower.indexOf("/portal/") >= 0) {
	    inPortal = true;
	} else {
		if(urlLower.indexOf(wwConsts.currentOnlineServer + "#/app") >= 0) {
		inPortal = false;
	    } else {
		inPortal = true;
	    }
	}

	debugLog("In Portal: " + inPortal);

	// ===============================================================================
	// -------- When running in the Hands-on Portal, turn off menus etc. -------------
	// ===============================================================================

	if(inPortal) {
	    $scope.setExecutionMode(1);

	    $scope.setMWPVisibility(false);
	    $scope.setVCVVisibility(false);
	    $scope.setMenuModeEnabled(false);
	}

	$scope.set("root:opacity", 0.1);


	$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
	    var newVal = eventData.targetId;

	    // debugLog("loadingWebble! " + newVal);

	    if(setupDone) {
		// no need to do anything
	    } else {
		var thisChild = $scope.getWebbleByInstanceId(newVal);
		var name = thisChild.scope().theWblMetadata['displayname'];

		if(name && name !== "") {
		    addNewlyLoadedChild(newVal, name);  
		}
	    }

	});

	listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	}));

	loadWebbleDefs();

	$(window).bind("resize", onResize); // to update the Webble sizes when the browser window is resized
    };
    //===================================================================================

    function mySlotChange(eventData) {
    }
    
    var addNewlyLoadedChild = function(webbleID, instName) {
	debugLog("addNewlyLoadedChild, " + webbleID + " " + instName);

	if(!setupDone) {
	    
	    var name = instName;
	    for(var templateName in templateName2instanceName) {
		if(templateName2instanceName[templateName] == instName) {
		    name = templateName;
		    break;
		}
	    }

	    if(loadedChildren.hasOwnProperty(name)) {
		loadedChildren[name].push(webbleID);
	    } else {
		return;
	    }
	    
	    if(name.indexOf("Data") >= 0) {
		// debugLog("add listeners to data source");
		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
		    // debugLog("Listener for data change");
		    dataSourceUpdated(loadedChildren[dataSrcName][0]);
		}, webbleID, 'DataChanged'));
	    }

	    $scope.getWebbleByInstanceId(webbleID).scope().set("root:opacity", 0);

	    // debugLog("check if we should duplicate " + name);
	    // check if this is a newly loaded template and if we should duplicate this
	    if(loadedChildren[name].length == 1) {
		if(neededChildren[name] > loadedChildren[name].length) {
		    var original = $scope.getWebbleByInstanceId(webbleID); // duplicate this Webble to get as many as we need
		    for(var copies = loadedChildren[name].length; copies < neededChildren[name]; copies++) {
			// debugLog("making more " + name + " Webbles.");
			original.scope().duplicate({x: 15, y: 15}, undefined);
		    }
		    
		    return; // wait for the duplicates to arrive
		}
	    }
	    
	    // debugLog(" check if we have everything");
	    // check if all the Webbles we need are here yet
	    var allHere = true;
	    for (var type in neededChildren) {
		if (neededChildren.hasOwnProperty(type)) {
		    // debugLog("check if we have " + type + ", want " + neededChildren[type] + ", have " + loadedChildren[type].length);
		    if(neededChildren[type] > loadedChildren[type].length) {
			// debugLog("not enough " + type);
			allHere = false;

			if(loadedChildren[type].length == 0) {
			    // debugLog("load one " + type);
			    $scope.downloadWebbleDef(type);
			}
			break;
		    }
		}
	    }

	    if(allHere) {
		// debugLog("all Webbles loaded.");
		setAllWebbleSlotsEtc();
	    }
	} 
    };
    
    var setAllWebbleSlotsEtc = function() {
	if(setupDone) {
	    return;
	}

	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	if(!inPortal) {
	    windowHeight -= 100;
	}

	for (var t in loadedChildren) {
            if (loadedChildren.hasOwnProperty(t)) {
                for(var w = 0; w < loadedChildren[t].length; w++) {
                    $scope.getWebbleByInstanceId(loadedChildren[t][w]).scope().set("root:opacity", 1);
                }
            }
	}

	var fontSize = 11;

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

	// wait for everyone to initialize properly, so use a timeout (a bit ugly, but still...)

        $timeout(function() {setupDone = true; setMappings();}, 1);
	
	$scope.displayText = "Travel App Loaded";
    };


    var lastSeenMapping = "";
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
		} else {
		    lat2 = fieldName;
		}
	    } else if(n.indexOf("lon") >= 0) {
		if(lon1 == "") {
		    lon1 = fieldName;
		} else {
		    lon2 = fieldName;
		}
	    } else if (lex[fieldName].type == "number") {
		num = fieldName;
	    }
	}

	if(curMapping != lastSeenMapping) {
	    lastSeenMapping = curMapping;

	    debugLog("pause updates");
	    datasrc.scope().pauseUpdates(true);

	    var map = $scope.getWebbleByInstanceId(loadedChildren[mapName][0]);
	    var barChart1 = $scope.getWebbleByInstanceId(loadedChildren[barName][0]);

	    map.scope().clearData();
	    barChart1.scope().clearData();

	    if(lat1 != ""
	       && lat2 != ""
	       && lon1 != ""
	       && lon2 != "") {

		map.scope().fakeDrop(lex[lat1].id, 'Start Latitude');
		map.scope().fakeDrop(lex[lon1].id, 'Start Longitude');
		map.scope().fakeDrop(lex[lat2].id, 'End Latitude');
		map.scope().fakeDrop(lex[lon2].id, 'End Longitude');

		if(num != "") {
		    map.scope().fakeDrop(lex[num].id, 'Point Value');
		    barChart1.scope().fakeDrop(lex[num].id, 'data');
		}
	    }
	    
	    debugLog("unpause updates");
	    datasrc.scope().pauseUpdates(false);

	    $timeout(function()
	 	     {

			 selectAll();		     
		     }, 1);
	}
    }

    var loadWebbleDefs = function() {
	neededChildren = {};
	loadedChildren = {};
	
	neededChildren[mapName] = 1;
	neededChildren[barName] = 1;
	neededChildren[dataSrcName] = 1;

	templateName2instanceName[mapName] = mapName;
	templateName2instanceName[barName] = barName;
	templateName2instanceName[dataSrcName] = dataSrcName;

	for(var w in neededChildren) {
	    loadedChildren[w] = [];
	}

	$scope.downloadWebbleDef(dataSrcName);
    }


    var lastFormatString = "";
    function dataSourceUpdated(datasrcWebbleID) {
	// debugLog("dataSource was updated with new data");

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

    function selectAll() {
	debugLog("Select all data in all components");
	
	var datasrc = $scope.getWebbleByInstanceId(loadedChildren[dataSrcName][0]);

	debugLog("pause updates");
	datasrc.scope().pauseUpdates(true);

	if(loadedChildren.hasOwnProperty(mapName) && loadedChildren[mapName].length > 0) {
	    $scope.getWebbleByInstanceId(loadedChildren[mapName][0]).scope().selectAll();
	}
	if(loadedChildren.hasOwnProperty(barName) && loadedChildren[barName].length > 0) {
	    $scope.getWebbleByInstanceId(loadedChildren[barName][0]).scope().selectAll();
	}

	debugLog("unpause updates");
	datasrc.scope().pauseUpdates(false);
    }

    function onResize() {	
	// debugLog("onResize called");

	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	if(!inPortal) {
	    windowHeight -= 100;
	}

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

	debugLog("ratio " + ratio);

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

	} else {
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
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
	var targetName = $(event.target).scope().getName();

	if (targetName != ""){
	    //=== [TARGET NAME] ====================================
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
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
	var customWblDefPart = {

	};

	return customWblDefPart;
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
