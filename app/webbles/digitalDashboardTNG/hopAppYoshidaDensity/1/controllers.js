//======================================================================================================================
// Controllers for HandsOnPortalDensityApp for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
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
    };

    $scope.customMenu = [];

    $scope.displayText = "Loading the Density environment. Please wait...";


    // ---------------------------------------------------------------------------------------
    // -- These should be the actual Webble names that Webbles are published under -----------
    // ---------------------------------------------------------------------------------------
    var f3Name = "hopVizFake3DWebble";
    var barName = "hopVizBarChartWebble";
    var r3Name = "three3DPlus";
    var scatterName = "hopVizScatterPlotWebble";
    var dataSrcName = "hopFileDataWebble";
    // ---------------------------------------------------------------------------------------

    var neededChildren = {};
    var loadedChildren = {};
    var templateName2instanceName = {"three3DPlus":"Basic three.js 3D Plus Webble"};
    
    var setupDone = false;

    var listeners = [];

    var inPortal = false;

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("hopAppDensityAppLoaderWebble: " + message);
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

	var r3 = $scope.getWebbleByInstanceId(loadedChildren[r3Name][0]);
	r3.scope().set('MultipleSelectionsDifferentGroups', true);
	r3.scope().set('localGlobalColorEqual', true);
	r3.scope().set('predefVisualConfig', 2);
	// r3.scope().set('particleMinMaxSizes', {"min": 0.25, "max": 8});
	// r3.scope().set('particleMinMaxAlpha', { "underThreshold": 0.01, "aboveThreshold": 0.75, "betweenThresholdMin": 0.01, "betweenThresholdMax": 0.75});
	// r3.scope().set('PixelColorBlending', 2);

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

	// wait for everyone to initialize properly, so use a timeout (a bit ugly, but still...)

        $timeout(function() {setupDone = true; setMappings();}, 1);
	
	$scope.displayText = "Density App Loaded";
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

	    debugLog("pause updates");
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
	
	neededChildren[f3Name] = 1;
	neededChildren[barName] = 1;
	neededChildren[r3Name] = 1;
	neededChildren[dataSrcName] = 1;

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

	if(loadedChildren.hasOwnProperty(f3Name) && loadedChildren[f3Name].length > 0) {
	    $scope.getWebbleByInstanceId(loadedChildren[f3Name][0]).scope().selectAll();
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
	
	var usefulW = windowWidth - 20 - leftMarg; // scroll bar on the side takes up some space
	var usefulH = windowHeight - 30 - topMarg;

	var ratio = usefulH / usefulW;
	
	var rows = [0, 100, 200, 300];
	var cols = [250, 350, 450, 550];
	var ws = [200, 200, 200, 200];
	var hs = [200, 200, 200, 200];

	debugLog("ratio " + ratio);

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

	} else if(ratio > 0.7) {
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

	} else 	if(ratio > 0.33) {
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

	} else {
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
