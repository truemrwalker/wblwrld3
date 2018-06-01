//======================================================================================================================
// Controllers for DigitalDashboardPluginItemSetMining for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('itemSetMiningPluginWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Item Set Mining";

    var myInstanceId = -1;
    var myPath = "";  // used by the background threads

    var dataName = "";
    var labelName = "";
    
    // graphics

    var textColor = "#000000";

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;

    var dropCanvas = null;
    var dropCtx = null;
    
    var hoverText = null;

    var selectionCanvas = null;
    var selectionCtx = null;
    var selectionColors = null;
    var selectionTransparency = 0.33;

    var selectionHolderElement = null;
    var selectionRect = null;

    var selections = []; // the graphical ones

    // layout
    var leftMarg = 20;
    var topMarg = 20;
    var headerTopMarg = 5;
    var rightMarg = 20;
    var bottomMarg = 20;
    var colMarg = 25;
    var fontSize = 11;

    var colorPalette = null;
    
    var useGlobalGradients = false;

    var clickStart = null;

    // data from parent

    var idArrays = [];
    var transactionArrays = [];
    var transactions = [];

    var columnIdArrays = [];
    var columnArrays = [];
    var haveCols = false;

    var sources = 0;
    var Ns = [];
    var N = 0;

    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
    var unique = 0; // number of data points with non-null values
    var NULLs = 0;

    var localSelections = []; // the data to send to the parent
    var localSelectionsCols = [];

    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;

    var onlyItemSetMining = true;
    var separateMiningForEachGroup = true;
    var includeUnselectedWhenMining = true;
    var includeEmptyTransactionsWhenCalculatingSupport = false;
    var minSupport = 0.2;
    var minConfidence = 0.5;
    var maximumNoofItemsAllowed = 100000;
    var tooManyItemsGenerated = false;

    var theRules = {};
    var sortedRules = [];
    var longestLeftHandSide = 0;
    var longestRightHandSide = 0;
    var maxNoofGroups = 0;

    var miningThread = null;

    var globalSelectionsWhenWeDidMining = [];

    var interfaceStrings = [
	"Minimum Support: ",
	", Minimum Confidence: ",
	"Separate mining in each group", 
	"Mine all data as one group",
	"Include unselected data as a group",
	"Ignore unselected data",
	"Include empty transactions when calculating support",
	"Ignore empty transactions when calculating support",
    ];

    var internalSelectionsInternallySetTo = {};

    var dropData = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"Data", "rotate":false, "forParent":{'idSlot':'DataIdSlot', 'name':'Transactions', 'type':'string', 'slot':'Transactions'}};
    var dropLabel = {'left':leftMarg, 'top':topMarg*2, 'right':leftMarg*2, 'bottom':topMarg * 3, "label":"Column labels", "rotate":false, "forParent":{'idSlot':'ColumnIdSlot', 'name':'Column Names', 'type':'string', 'slot':'ColumnNames'}};

    var allDropZones = [dropData, dropLabel];

    var dragZoneData = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var dragZoneLabels = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    var allDragNames = [dragZoneData, dragZoneLabels];
    $scope.dragNdropRepr = "Nothing to drag.";
    $scope.dragNdropID = "No drag data.";

    var alreadyLoggedBackgroundCapability = false;

    //=== EVENT HANDLERS ================================================================


    $scope.fixDraggable = function () {
	$scope.theView.find('.dragSrc').draggable({
	    helper: function() {		
		return $("<div id=\"" + $scope.dragNdropID + "\">" + $scope.dragNdropRepr + "</div>");
	    },
	    cursorAt: {top: 5, left: 5}
	});
    };

    $scope.fixDroppable = function () {
	$scope.theView.find('#selectionHolder').droppable({ 
	    over: function(e, ui) {
		if(e.target.id == "selectionHolder") {
		    updateDropZones(textColor, 1, true);
		}
	    },
	    out: function() {
		updateDropZones(textColor, 0.3, false);
	    },
	    tolerance: 'pointer',
	    drop: function(e, ui){
		if(e.target.id == "selectionHolder") {

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
			    f = dropZone.forParent;
			    ok = true;
			} 
		    } 
		    if(ok) {
			$scope.set('DataDropped', {"dataSourceField":ui.draggable.attr('id'), "pluginField":f});
		    } 
		}
		updateDropZones(textColor, 0.3, false);
	    }
	});
    };


    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard Item Set Mining: " + message);
	}
    }

    function shortenName(n) {
	var ss = n.split(":");
	return ss[ss.length - 1];
    }

    function getTextWidth(text, font) {
	if(ctx !== null && ctx !== undefined) {
	    ctx.font = font;
	    var metrics = ctx.measureText(text);
	    return Math.ceil(metrics.width);
	}
	return 0;
    };

    function getTextWidthCurrentFont(text) {
	if(ctx !== null && ctx !== undefined) {
	    var metrics = ctx.measureText(text);
	    return Math.ceil(metrics.width);
	}
	return 0;
    };

    function pixel2row(p) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(p < topMarg) {
	    return 0;
	}
	if(p > topMarg + drawH) {
	    return sortedRules.length - 1;
	}
	var r = Math.floor((p - topMarg) / (fontSize + 2));
	if(r < 0) {
	    return 0;
	}
	if(r > sortedRules.length - 1) {
	    return sortedRules.length - 1;
	}
	return r;
    };

    function row2pixel(r) {
	if(unique <= 0) {
	    return 0;
	}
	
	if(r < 0) {
	    return topMarg;
	}
	if(r >= sortedRules.length) {
	    return topMarg + drawH;
	}
	
	return Math.floor(topMarg + r * (fontSize + 2));
    };

    function saveSelectionsInSlot() {
	// debugLog("saveSelectionsInSlot");

	var result = {};
	result.selections = [];
	for(var sel = 0; sel < selections.length; sel++) {
	    result.selections.push({'row1':selections[sel][0], 'row2':selections[sel][1]});
	}

	internalSelectionsInternallySetTo = result;
	$scope.set('InternalSelections', result);
    };

    function setSelectionsFromSlotValue() {
	// debugLog("setSelectionsFromSlotValue");

	var slotSelections = $scope.gimme("InternalSelections");
	if(typeof slotSelections === 'string') {
	    slotSelections = JSON.parse(slotSelections);
	}

	if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
	    // debugLog("setSelectionsFromSlotValue got identical value");
	    return;
	}

	if(slotSelections.hasOwnProperty("selections")) {
	    var newSelections = [];
	    
	    if(unique > 0) {
		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
		    var newSel = slotSelections.selections[sel];
		    
		    var r1 = newSel.row1;
		    var r2 = newSel.row2;

		    if(r1 >= sortedRules.length) {
			// completely outside
			continue;
		    }
		    
		    r2 = Math.min(sortedRules.length - 1, r2);
		    
		    newSelections.push([r1,r2]);
		}

		if(newSelections.length > 0) {
		    selections = newSelections;
		    updateLocalSelections(false);
		    drawSelections();
		}
	    } else { // no data
		for(var sel = 0; sel < slotSelections.selections.length; sel++) {
		    var newSel = slotSelections.selections[sel];
		    
		    var r1 = newSel.row1;
		    var r2 = newSel.row2;

		    newSelections.push([r1,r2]);
		}
		selections = newSelections;
	    }
	}
	
	saveSelectionsInSlot();
    };

    function checkSelectionsAfterNewData() {
	// debugLog("checkSelectionsAfterNewData");

	var newSelections = [];

	for(var sel = 0; sel < selections.length; sel++) {
	    var newSel = selections[sel];
	    var r1 = newSel[0];
	    var r2 = newSel[1];

	    if(r1 >= sortedRules.length) {
		// completely outside
		continue;
	    }
	    
	    r2 = Math.min(sortedRules.length - 1, r2);
	    
	    newSelections.push([r1,r2]);
	}

	if(newSelections.length > 0) {
	    selections = newSelections;
	    drawSelections();
	    return false;
	}
	return true;
    };

    function updateLocalSelections(selectAll) {
	// debugLog("updateLocalSelections");

	var dirty = false;
	
	selections.sort(function(a,b){return ((a[1]-a[0]) - (b[1]-b[0]));}); // sort selections so smaller (area) ones are checked first.

	var selectedRows = [];
	for(var r = 0; r < sortedRules.length; r++) {
	    var groupId = 0;
	    
	    for(var span = 0; span < selections.length; span++) {
		if(selections[span][0] <= r
		   && r <= selections[span][1]) {
		    groupId = span + 1;
		    break;
		}
	    }
	    if(groupId > 0) {
		selectedRows.push([r, groupId]);
	    }
	}

	selectedRows.sort(function(a,b) { return b[1] - a[1];});

	var newLocalSelections = [];
	var defaultGroup = 0;
	if(sortedRules.length <= 0) {
	    defaultGroup = 1;
	}
	if(!includeUnselectedWhenMining || separateMiningForEachGroup) {
	    defaultGroup = 1;
	}
	
	for(var set = 0; set < idArrays.length; set++) {
	    newLocalSelections.push([]);
	
	    for(var i = 0; i < Ns[set]; i++) {
		newLocalSelections[set].push(defaultGroup);
		    
		if(includeUnselectedWhenMining && !separateMiningForEachGroup) {
		    var transactionDone = false;
		    for(var sr = 0; !transactionDone && sr < selectedRows.length; sr++) {
			var r = selectedRows[sr][0];
			var groupId = selectedRows[sr][1];
			
			var trans = transactions[set][i];
	
			var itemList = sortedRules[r][3][0][1].r1.items;
			
			var allFound = true;
			for(var item = 0; item < itemList.length; item++) {
			    var ruleItem = itemList[item];
			    var found = false;
			    for(var ti = 0; ti < trans.length; ti++) {
				var transItem = trans[ti];
				
				if(ruleItem == transItem) {
				    found = true;
				    break;
				}
			    }
			    if(!found) {
				allFound = false;
				break;
			    }
			}
			
			if(allFound && !onlyItemSetMining) {
			    itemList = sortedRules[r][3][0][1].r2.items;
			    for(var item = 0; item < itemList.length; item++) {
				var ruleItem = itemList[item];
				var found = false;
				for(var ti = 0; ti < trans.length; ti++) {
				    var transItem = trans[ti];
				    
				    if(ruleItem == transItem) {
					found = true;
					break;
				    }
				}
				if(!found) {
				    allFound = false;
				    break;
				}
			    }
			}

			if(allFound) {
			    newLocalSelections[set][i] = groupId;
			    transactionDone = true;
			}
		    }
		}
		if(newLocalSelections[set][i] != localSelections[set][i]) {
		    dirty = true;
		}
	    }
	}
	if(dirty) {
	    localSelections = newLocalSelections;
	}

	if(haveCols) {
	    defaultGroup = 0;
	    if(sortedRules.length <= 0) {
		defaultGroup = 1;
	    }

	    var newLocalSelectionsCols = [];
	    var defaultGroup = 0;
	    if(sortedRules.length <= 0) {
		defaultGroup = 1;
	    }
	
	    for(var set = 0; set < columnIdArrays.length; set++) {
		newLocalSelectionsCols.push([]);
		
		var column = columnArrays[set];
		
		for(var i = 0; i < column.length; i++) {
		    var c = column[i];
		    newLocalSelectionsCols[set].push(defaultGroup);
		    
		    var found = false;
		    for(var sr = 0; !found && sr < selectedRows.length; sr++) {
			var r = selectedRows[sr][0];
			var groupId = selectedRows[sr][1];
			
			var itemList = sortedRules[r][3][0][1].r1.items;
			for(var item = 0; item < itemList.length; item++) {
			    if(itemList[item] == c) {
				newLocalSelectionsCols[set][i] = groupId;
				found = true;
				break;
			    }
			}
			if(!found && !onlyItemSetMining) {
			    itemList = sortedRules[r][3][0][1].r2.items;
			    for(var item = 0; item < itemList.length; item++) {
				if(itemList[item] == c) {
				    newLocalSelectionsCols[set][i] = groupId;
				    found = true;
				    break;
				}
			    }
			}
		    }
		    if(newLocalSelectionsCols[set][i] != localSelectionsCols[set][i]) {
			dirty = true;
		    }
		}
	    }
	}


	if(dirty) {
	    var newSels = {'DataIdSlot':localSelections};
	    if(haveCols) {
		localSelectionsCols = newLocalSelectionsCols;
		newSels.ColumnIdSlot = localSelectionsCols;
	    }
	    
	    $scope.set('LocalSelections', newSels);
	    $scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
	} else {
	    // debugLog("local selections had not changed");
	}
	
    };


    function resetVars() {
	tooManyItemsGenerated = false;

	theRules = {};
	sortedRules = [];

	idArrays = [];
	transactionArrays = [];
	transactions = [];

	columnIdArrays = [];
	columnArrays = [];
	haveCols = false;

	sources = 0;
	Ns = [];
	N = 0;

	limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
	unique = 0; // number of data points with non-null values
	NULLs = 0;

	localSelections = []; // the data to send to the parent
	localSelectionsCols = [];

	noofGroups = 1;

	dataName = "";
	labelName = "";

	dragZoneData = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	dragZoneLabel = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
    };

    function parseData() {
	// debugLog("parseData");

	// parse parents instructions on where to find data, check that at least one data set is filled
	var atLeastOneFilled = false;

	var parentInput = $scope.gimme('DataValuesSetFilled');
	if(typeof parentInput === 'string') {
	    parentInput = JSON.parse(parentInput);
	}

	lastSeenData = JSON.stringify(parentInput);

	resetVars();

	if(parentInput.length > 0) {
	    haveCols = false;
	    var haveTrans = false;
	    for(var i = 0; i < parentInput.length; i++) {
		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Transactions") {
		    haveTrans = true;
		    
		    dragZoneData.name = "Data";
		    dropData.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneData.ID = JSON.stringify(dropData.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			dataName = shortenName(parentInput[i]["description"]);
			dragZoneData.name = dataName;
		    }
		}

		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Column Names") {
		    haveCols = true;

		    dragZoneLabel.name = "Col. Labels";
		    dropLabel.forParent.vizName = $scope.gimme("PluginName");
		    dragZoneLabel.ID = JSON.stringify(dropLabel.forParent);

		    if(parentInput[i].hasOwnProperty("description")) {
			labelName = shortenName(parentInput[i]["description"]);
			dragZoneLabel.name = labelName;
		    }
		}
	    }

	    if(haveTrans) {
		atLeastOneFilled = true;
	    }
	}
	
	// debugLog("read parent input ", atLeastOneFilled);
	
	var dataIsCorrupt = false;

	if(atLeastOneFilled) {
	    idArrays = $scope.gimme('DataIdSlot');
	    transactionArrays = $scope.gimme('Transactions');
	    
	    if(idArrays.length != transactionArrays.length) {
		dataIsCorrupt = true;
	    }
	    if(idArrays.length <= 0) {
		dataIsCorrupt = true;
	    }

    	    if(haveCols) {
    		columnIdArrays = $scope.gimme('ColumnIdSlot');
    		columnArrays = $scope.gimme('ColumnNames');
    		if(columnIdArrays.length != columnArrays.length
    		   || columnIdArrays.length != idArrays.length) {
    		    dataIsCorrupt = true;
    		}
    	    }

	    if(!dataIsCorrupt) {
		sources = idArrays.length;
		
		for(var source = 0; source < sources; source++) {
		    var idArray = idArrays[source];
		    var transactionArray = transactionArrays[source];
		    
		    if(idArray.length != transactionArray.length) {
			dataIsCorrupt = true;
		    }
		    if(idArray.length <= 0) {
			dataIsCorrupt = true;
		    }

    		    if(haveCols) {
    			var columnIdArray = columnIdArrays[source];
    			var columnArray = columnArrays[source];
    			if(columnIdArray.length != columnArray.length) {
    			    dataIsCorrupt = true;
    			} else if(columnArray.length <= 0) {
    			    dataIsCorrupt = true;
    			}
    		    }
		}
	    }

	    if(!dataIsCorrupt) {
		Ns = [];

		var firstNonNullData = true;

		for(var source = 0; source < sources; source++) {
		    var idArray = idArrays[source];
		    var transactionArray = transactionArrays[source];

		    N += idArray.length;
		    Ns.push(idArray.length);
		    
		    localSelections.push([]);
		    transactions.push([]);

		    for(i = 0; i < Ns[source]; i++) {
			localSelections[source].push(0);

			if(transactionArray[i] !== null) {
			    unique++;
			    if(firstNonNullData) {
				firstNonNullData = false;
			    }
			    var ls = transactionArray[i].split(",");
			    transactions[source].push(ls);
			} else {
			    transactions[source].push([]);
			    NULLs++;
			}
		    }
		    
    		    if(haveCols) {
    			var columnIdArray = columnIdArrays[source];
    			var columnArray = columnArrays[source];
			
    			localSelectionsCols.push([]);
			
    	    		for(i = 0; i < columnIdArray.length; i++) {
    	    		    localSelectionsCols[source].push(0);
    			}
    		    }
		}
		if(firstNonNullData) {
		    dataIsCorrupt = true; // only null values
		} else {
		    limits = {};
		}
	    }
	    
	    if(dataIsCorrupt) {
		debugLog("data is corrupt");
		resetVars();
	    } else {
		
		// TODO: check if we should keep the old selections
		// selections = [[limits.min, limits.max]];
	    }
	} else {
	    debugLog("no data");
	}

	updateGraphics();

	doMining();
    };

    function checkIfWeNeedToRedoMining() {
	var globalSelectionsPerIdSlot = $scope.gimme('GlobalSelections');
	var globalSelections = [];
	if(globalSelectionsPerIdSlot.hasOwnProperty("DataIdSlot")) {
	    globalSelections = globalSelectionsPerIdSlot["DataIdSlot"];
	}

	var dirty = false;
	if(globalSelections.length != globalSelectionsWhenWeDidMining.length) {
	    dirty = true;
	} else {
	    for(var set = 0; !dirty && set < globalSelections.length; set++) {
		if(globalSelections[set].length != globalSelectionsWhenWeDidMining[set].length) {
		    dirty = true;
		} else {

		    for(var i = 0; !dirty && i < globalSelections[set].length; i++) {
			if(globalSelections[set][i] != globalSelectionsWhenWeDidMining[set][i]) {
			    dirty = true;
			}
		    }
		}
	    }
	}

	if(dirty) {
	    doMining();
	}
    }

    function doMining() {
	if(unique > 0) {
	    if(typeof(Worker) !== "undefined") {
		if(!alreadyLoggedBackgroundCapability) {
		    alreadyLoggedBackgroundCapability = true;
		    debugLog("browser supports background threads");
		}
		doBackgroundMining();
	    } else {
		if(!alreadyLoggedBackgroundCapability) {
		    alreadyLoggedBackgroundCapability = true;
		    debugLog("Browser does not support background threads. Cluster in main thread.");
		}
		doMainThreadMining();
	    }
	} else {
	    updateGraphics();
	}
    };

    function doMainThreadMining() {
	// debugLog("doMainThreadMining");

	FPGrowth();
	sortedRules = [];
	if(!checkSize()) {
	    updateGraphics();
	}
	selectAll();
    };

    function doBackgroundMining() {
	// debugLog("doBackgroundMining");

	if(miningThread !== null) {
	    // already running. kill thread
	    miningThread.terminate();
	}
	
	miningThread = new Worker(myPath + '/fpgrowth.js');

	miningThread.addEventListener('message', function(e) {
	    miningFinished(e);
	}, false);
	
    	var globalSelectionsPerIdSlot = $scope.gimme('GlobalSelections');
	var globalSelections = [];
	if(globalSelectionsPerIdSlot.hasOwnProperty("DataIdSlot")) {
	    globalSelections = globalSelectionsPerIdSlot["DataIdSlot"];
	}

	globalSelectionsWhenWeDidMining = [];
	for(var set = 0; set < globalSelections.length; set++) {
	    globalSelectionsWhenWeDidMining.push([]);
	    for(var i = 0; i < globalSelections[set].length; i++) {
		globalSelectionsWhenWeDidMining[set].push(globalSelections[set][i]);
	    }
	}
	
	var data = {'transactions':transactions, 
		    'globalSelections':globalSelections,

		    'onlyItemSetMining':onlyItemSetMining,
		    'separateMiningForEachGroup':separateMiningForEachGroup,
		    'includeUnselectedWhenMining':includeUnselectedWhenMining,
		    'includeEmptyTransactionsWhenCalculatingSupport':includeEmptyTransactionsWhenCalculatingSupport,

		    'minSupport':minSupport,
		    'minConfidence':minConfidence,
		    'maximumNoofItemsAllowed':maximumNoofItemsAllowed,

		    'start':true};

	miningThread.postMessage(data); // start background thread
    };

    function miningFinished(e) {
	// debugLog("miningFinished");
	var data = e.data;
	
	theRules = data.theRules;
	tooManyItemsGenerated = data.tooManyItemsGenerated;
	sortedRules = [];

	if(!checkSize()) {
	    updateGraphics();
	}
	selectAll();
	
	if(miningThread !== null) {
	    miningThread.terminate();
	    miningThread = null;
	}
    };



    // ---------------------------------------------------------------------------------------------------------------------------------------
    //                   Mining stuff
    // ---------------------------------------------------------------------------------------------------------------------------------------

    function FPGrowth()
    {
        tooManyItemsGenerated = false;
	
    	var globalSelectionsPerIdSlot = $scope.gimme('GlobalSelections');
	var globalSelections = [];
	if(globalSelectionsPerIdSlot.hasOwnProperty("DataIdSlot")) {
	    globalSelections = globalSelectionsPerIdSlot["DataIdSlot"];
	}

	globalSelectionsWhenWeDidMining = [];
	for(var set = 0; set < globalSelections.length; set++) {
	    globalSelectionsWhenWeDidMining.push([]);
	    for(var i = 0; i < globalSelections[set].length; i++) {
		globalSelectionsWhenWeDidMining[set].push(globalSelections[set][i]);
	    }
	}

        // pass 1, count support for items

        var countsPerGroup = {};
	var totalsPerGroup = {};

        var groupIds = [];

	// var mapGroupIds = {"0":0};
	// var nextMapped = 1;

    	for(var set = 0; set < Ns.length; set++) {
    	    var selArray = [];
    	    if(set < globalSelections.length) {
    		selArray = globalSelections[set];
    	    }

	    groupIds.push([]);

    	    for(var i = 0; i < Ns[set]; i++) {
                var groupId = 0;
		
    		if(i < selArray.length) {
    		    groupId = selArray[i];
    		}

		// if(!mapGroupIds.hasOwnProperty(groupId)) {
		//     mapGroupIds[groupId] = nextMapped++;
		// }
		// groupId = mapGroupIds[groupId];
		
		if (!separateMiningForEachGroup) {
                    if (groupId > 0 || includeUnselectedWhenMining)
                    {
			groupId = 1;
                    }
		}
		
		groupIds[set].push(groupId);
		
		if (includeUnselectedWhenMining || groupId > 0) {
                    if (!countsPerGroup.hasOwnProperty(groupId)) {
			countsPerGroup[groupId] = {};
			totalsPerGroup[groupId] = 0;
		    }
                    

                    var counts = countsPerGroup[groupId];

                    var ls = transactions[set][i];

                    if (includeEmptyTransactionsWhenCalculatingSupport || ls.length > 0)
                    {
			totalsPerGroup[groupId] += 1;
                    }

                    for(var sidx = 0; sidx < ls.length; sidx++) {
			var s = ls[sidx];

			if (counts.hasOwnProperty(s)) {
                            counts[s] += 1;
			} else {
                            counts[s] = 1;
			}
                    }
		}
            }
	}

        var result = {};

        var itemsSoFar = 0;

        for(var groupId in countsPerGroup) {
            var minSupportGroup = Math.ceil(minSupport * totalsPerGroup[groupId]);

            var counts = countsPerGroup[groupId];

            var root = {'item':"", 
			'support':0,
			'sibling':null,
			'parent':null,
			'children':{}};

            // pass 1 finished, itemsToUse has the items in decreasing order

            var successors = {};

    	    for(var set = 0; set < Ns.length; set++) {
    		for(var idx = 0; idx < Ns[set]; idx++) {
                    if (groupIds[set][idx] == groupId) {
			var items = [];
			
			var ls = transactions[set][idx];
			for(var sidx = 0; sidx < ls.length; sidx++){
			    var s = ls[sidx];

			    // insert and keep list sorted
			    // linear search of index to instert at can be made faster (binary search works in sorted list), but use linear for now

                            var count = counts[s];
                            if (count >= minSupportGroup)
                            {
				items.push(s);

				var i = 0;
				while (i < items.length)
				{
                                    if (counts[items[i]] < count)
                                    {
					break;
                                    }
                                    i++;
				}

				if (i != items.length)
				{
                                    for (var j = items.length - 1; j > i; j--)
                                    {
					items[j] = items[j - 1];
                                    }
                                    items[i] = s;
				}
                            }
			}

			// items now has the items that are frequent enough, sorted
			if (items.length > 0)
			{
                            FPInsert(items, root, 1, successors);
			}
                    }
		}
	    }

            // we have the big tree. recursively extract item sets by building other trees

            var theResult = [];
            var emptyLs = [];

            RecursiveFPExtract(theResult, emptyLs, successors, root, minSupportGroup, itemsSoFar);
            itemsSoFar += theResult.length;

            result[groupId] = theResult;

	    if(itemsSoFar > maximumNoofItemsAllowed) {
		break;
	    }
        }

        if (itemsSoFar > maximumNoofItemsAllowed)
        {
            tooManyItemsGenerated = true;
        }
        else
        {
            RuleMining(result);
        }
    }

    function IsSubset(ls1, ls2) {
        var i1 = 0;
        var i2 = 0;

        while (i1 < ls1.length && i2 < ls2.length)
        {
            // we can actually break earlier if we find an item in the short list that we should have already seen in the long list since we know they are sorted
            if (ls1[i1] != ls2[i2])
            {
                i2++;
            }
            else
            {
                i1++;
                i2++;
            }
        }

        if (i1 != ls1.length)
        {
            return false;
        } 
        return true;
    }

    function RuleMining(FPGrowResult)
    {
        var rulesPerGroup = {};

        for(var groupId in FPGrowResult) {
            rulesPerGroup[groupId] = [];

            for(var rn1i = 0; rn1i < FPGrowResult[groupId].length; rn1i++) {
		var rn1 = FPGrowResult[groupId][rn1i];

                if (onlyItemSetMining)
                {
		    var r = {'r1':null,
			     'r2':null,
			     'top':0,
			     'bottom':0,
			     'confidence':0,
			     'stringRep':"",
			     'selectedGroup':0};

                    r.r1 = rn1;
                    r.r2 = rn1;

                    if (rn1.support > 0) {
                        r.confidence = rn1.support;
                    } else {
                        r.confidence = 0;
                    }

                    rulesPerGroup[groupId].push(r);
                } else {
		    for(var rn2i = 0; rn2i < FPGrowResult[groupId].length; rn2i++) {
			var rn2 = FPGrowResult[groupId][rn2i];

                        if (rn1 != rn2  // OK? Check later
			    && rn1.items.length < rn2.items.length 
			    && rn2.support >= rn1.support * minConfidence) {

                            if (IsSubset(rn1.items, rn2.items)) {
				
				var r = {'r1':null,
					 'r2':null,
					 'top':0,
					 'bottom':0,
					 'confidence':0,
					 'stringRep':"",
					 'selectedGroup':0};
                                r.r1 = rn1;
                                r.r2 = rn2;

                                if (rn1.support > 0) {
                                    r.confidence = rn2.support / rn1.support;
                                } else {
                                    r.confidence = 1;
                                }

                                rulesPerGroup[groupId].push(r);
                            }
                        }
                    }
                }
            }
        }
	
        theRules = rulesPerGroup; // return result here
    }

    function RecursiveFPExtract(result, tail, successors, root, minSupportGroup, itemsSoFar)
    {
        for(var s in successors) {
            
            var support = 0;
            var n = successors[s];
            while (n != null)
            {
                support += n.support;
                n = n.sibling;
            }

            if (support >= minSupportGroup)
            {
                var newTail = [];
                newTail.push(s);
		
		for(var sidx = 0; sidx < tail.length; sidx++) {
		    var ss = tail[sidx];
                    newTail.push(ss);
                }
		
		var rn = {'support':0, 'items':[]};
                rn.items = newTail;
                rn.support = support;

                result.push(rn);

                if(itemsSoFar + result.length > maximumNoofItemsAllowed) {
                    return;
                }


		var newRoot = {'item':"", 
			       'support':0,
			       'sibling':null,
			       'parent':null,
			       'children':{}};
                var newSuccessors = {};

                var added = 0;
                n = successors[s];
                while (n != null) {
                    var ls = [];

                    var nn = n.parent;
                    while (nn != null) {
                        if (nn.item != "")
                        {
                            ls.push(nn.item);
                        }
                        nn = nn.parent;
                    }

                    if (ls.length > 0)
                    {
                        ls.reverse();
                        FPInsert(ls, newRoot, n.support, newSuccessors);
                        added += 1;
                    }

                    n = n.sibling;
                }

                if (newRoot.support >= minSupportGroup) {
                    if (added > 0) {
                        RecursiveFPExtract(result, newTail, newSuccessors, newRoot, minSupportGroup, itemsSoFar);
                    }
                }
            }
        }
    }

    function FPInsert(items, root, support, successors) {
        root.support += support;

        var nextIdx = 0;
        var nextItem = items[nextIdx];
        while (root.children.hasOwnProperty(nextItem)) {
            root = root.children[nextItem];
            root.support += support;
            nextIdx++;
            if (nextIdx < items.length) {
                nextItem = items[nextIdx];
            } else {
                break;
            }
        }

        while (nextIdx < items.length) {
            nextItem = items[nextIdx];

	    var n = {'item':"", 
		     'support':0,
		     'sibling':null,
		     'parent':null,
		     'children':{}};
            n.item = nextItem;
            n.support = support;
            n.parent = root;
	    
            if (successors.hasOwnProperty(nextItem)) {
                n.sibling = successors[nextItem];
                successors[nextItem] = n;
            } else {
                successors[nextItem] = n;
            }

            root.children[nextItem] = n;
            root = n;

            nextIdx++;
        }
    }


    // ---------------------------------------------------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------------------------------

    function makeRulesPrintable() {
	var printableRules = {};

	longestLeftHandSide = 0;
	longestRightHandSide = 0;
	maxNoofGroups = 0;

	if(tooManyItemsGenerated) {
	    return;
	}

	for(var groupId in theRules) {
	    for(var i = 0; i < theRules[groupId].length; i++) {
		var r = theRules[groupId][i];
		
		var ss = rule2string(r);
		var s = ss[0];
		if(ss.length > 1) {
		    s = ss[0] + "-->" + ss[1];
		}
		
		if(printableRules.hasOwnProperty(s)) {
		    printableRules[s].push([groupId, r]);
		} else {
		    printableRules[s] = [[groupId, r]];
		}
	    }
	}

	var ruleList = [];
	for(var s in printableRules) {
	    var ls = printableRules[s];
	    var groups = [];
	    var totalSupport = 0;

	    for(var i = 0; i < ls.length; i++) {
		groups.push(ls[i][0]);
		totalSupport += ls[i][1].confidence;
	    }
	    groups.sort();

	    var noofGroups = ls.length;
	    maxNoofGroups = Math.max(maxNoofGroups, noofGroups);
	    
	    var ss = rule2string(ls[0][1]);

	    var leftHandSide = ss[0];
	    longestLeftHandSide = Math.max(longestLeftHandSide, getTextWidthCurrentFont(leftHandSide));
	    
	    if(onlyItemSetMining) {
		ruleList.push([noofGroups, groups.join(), totalSupport, ls, leftHandSide]);
	    } else {
		var rightHandSide = ss[1];
		longestRightHandSide = Math.max(longestRightHandSide, getTextWidthCurrentFont(rightHandSide));

		ruleList.push([noofGroups, groups.join(), totalSupport, ls, leftHandSide, rightHandSide]);	
	    }
	}

	ruleList.sort(function(a,b) { 
	    if(a[0] != b[0]) {
		return b[0] - a[0]; // largest number of groups first
	    }
	    // same number of groups, different groups
	    if(a[1] != b[1]) { // alphabetical on groups
		if(a[1] < b[1]) {
		    return 1;
		} else {
		    return -1;
		}
	    }
	    // same group
	    if(a[2] != b[2]) { 
		return b[2] - a[2]; // strongest support first
	    }
	    // same support
	    if(a[4] < b[4]) { // alphabetical
		return -1;
	    }
	    if(a[4] > b[4]) {
		return 1;
	    }
	    if(a.length > 5) {
		if(a[5] < b[5]) {
		    return -1;
		} 
		if(a[5] > b[5]) {
		    return 1;
		}
	    }
	    return 0;
	});

	sortedRules = ruleList;
    }

    function rule2string(r) {
	if(onlyItemSetMining) {
	    var ls = r.r1.items;
	    ls.sort();
	    return [ls.join()];
	} else {
	    var ls1 = r.r1.items;
	    ls1.sort();
	    
	    var ls2 = r.r2.items;
	    ls2.sort();

	    return [ls1.join(), ls2.join()];
	}
    }

    function checkSize() {
	fontSize = parseInt($scope.gimme("FontSize"));
	if(fontSize < 5) {
	    fontSize = 5;
	}
    	ctx.font = fontSize + "px Arial";

	topMarg = headerTopMarg*3 + (fontSize + 2) * 6;

	if(sortedRules.length <= 0) {
	    makeRulesPrintable();
	}

	var neededH = 0;
	var neededW = 0;

	if(sortedRules.length > 0) {
	    neededH = Math.ceil(sortedRules.length * Math.ceil(fontSize + 2));
	    
	    neededW = Math.ceil(longestLeftHandSide + colMarg);
	    if(!onlyItemSetMining) {
		neededW +=  Math.ceil(longestRightHandSide + colMarg);
	    }
	    
	    neededW += Math.ceil(maxNoofGroups * getTextWidthCurrentFont(" 0.00"));
	}
	
	for(var s = 0; s < interfaceStrings.length; s++) {
	    textW = getTextWidthCurrentFont(interfaceStrings[s]);
	    neededW = Math.max(textW, neededW);
	}
	
	var minSupS = minSupport.toString();
	if(minSupS.length > 5) {
	    minSupS = minSupport.toPrecision(3);
	}
	if(onlyItemSetMining) {
	    s = interfaceStrings[0] + minSupS;
	    textW = getTextWidthCurrentFont(s);
	    neededW = Math.max(textW, neededW);
	} else {
	    var minConfS = minConfidence.toString();
	    if(minConfS.length > 5) {
		minConfS = minConfidence.toPrecision(3);
		}
	    s = interfaceStrings[0] + minSupS + interfaceStrings[1] + minConfS;
	}
	textW = getTextWidthCurrentFont(s);
	neededW = Math.max(textW, neededW);
	    
	
	if(myCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    	    if(myCanvasElement.length > 0) {
    		myCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}
	
	if(ctx === null) {
    	    ctx = myCanvas.getContext("2d");
	}
	
    	var W = myCanvas.width;
    	if(typeof W === 'string') {
    	    W = parseFloat(W);
    	}
    	if(W < 1) {
    	    W = 1;
    	}
	
    	var H = myCanvas.height;
    	if(typeof H === 'string') {
    	    H = parseFloat(H);
    	}
    	if(H < 1) {
    	    H = 1;
    	}

	var slotW = parseInt($scope.gimme("DrawingArea:width"));
	var slotH = parseInt($scope.gimme("DrawingArea:height"));
	if(W != slotW) {
	    W = slotW;
	    myCanvas.width = W;
	}
	if(H != slotH) {
	    H = slotH;
	    myCanvas.height = H;
	}
	
	drawW = W - leftMarg - rightMarg;
	drawH = H - topMarg - bottomMarg;
	
	var change = false;
	if(drawW < neededW || drawW - neededW > 200) {
	    // debugLog("checkSize() changes width to " + (leftMarg + rightMarg + neededW));
	    $scope.set("DrawingArea:width", leftMarg + rightMarg + neededW);
	    change = true;
	}
	if(drawH < neededH || drawH - neededH > 200) {
	    // debugLog("checkSize() changes height to " + (topMarg + bottomMarg + neededH));
	    $scope.set("DrawingArea:height", topMarg + bottomMarg + neededH);
	    change = true;
	}
	if(change) {
	    return true;
	}
	return false;
    };
    
    function updateGraphics() {
    	// debugLog("updateGraphics()");

	if(myCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    	    if(myCanvasElement.length > 0) {
    		myCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
    		return;
    	    }
	}

	if(ctx === null) {
    	    ctx = myCanvas.getContext("2d");
	}

    	var W = myCanvas.width;
    	if(typeof W === 'string') {
    	    W = parseFloat(W);
    	}
    	if(W < 1) {
    	    W = 1;
    	}

    	var H = myCanvas.height;
    	if(typeof H === 'string') {
    	    H = parseFloat(H);
    	}
    	if(H < 1) {
    	    H = 1;
    	}

	drawW = W - leftMarg - rightMarg;
	drawH = H - topMarg - bottomMarg;

	// debugLog("Clear the canvas");
	ctx.clearRect(0,0, W,H);
    	drawBackground(W, H);
	drawDraggableDataLabels(W, H);

	drawRules(W, H);
	drawSelections();

	updateDropZones(textColor, 0.3, false);
    }; 

    function drawDraggableDataLabels(W, H) {
    	ctx.fillStyle = textColor;
    	ctx.font = fontSize + "px Arial";

	var str = "";
	var xw = -1;
	var yw = -1;
	if(dataName != "" && labelName != "") {
	    str = dataName + ", by " + labelName;
	    xw = getTextWidthCurrentFont(dataName);
	    yw = getTextWidthCurrentFont(labelName);
	} else if(dataName != "") {
	    str = dataName;
	    xw = getTextWidthCurrentFont(dataName);
	} else if(labelName != "") {
	    str = labelName;
	    yw = getTextWidthCurrentFont(labelName);
	}

	if(str != "") {
	    var w = getTextWidthCurrentFont(str);
	    var top = headerTopMarg;

	    var left = 0;
	    if(w < W) {
		left = Math.floor((W - w) / 2);
	    }

	    ctx.fillText(str, left, top + fontSize);

	    if(xw >= 0) {
		dragZoneData = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':dataName, 'ID':dragZoneData.ID};
	    }
	    if(yw >= 0) {
		dragZoneLabel = {'left':(left + w - yw), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':labelName, 'ID':dragZoneLabel.ID};
	    }
	    allDragNames = [dragZoneData, dragZoneLabel];
	}
    }

    function drawRules(W, H) {
	// debugLog("drawRules");

    	ctx.font = fontSize + "px Arial";

	for(r = 0; r < sortedRules.length; r++) {
	    var t = sortedRules[r];
	    var s = t[4];
	    var noofGroups = t[0];
	    var ls = t[3];

	    var col = "black";
	    if(separateMiningForEachGroup) {
		if(noofGroups == 1) {
		    col = getColorForGroup(ls[0][0]);
		    if(ls[0][0] == 0) {
			col = hexColorToRGBA(col, 0.5);
		    }
		}
	    }
	    
	    ctx.save();

	    var x = leftMarg;
	    var y = row2pixel(r) + fontSize;
	    ctx.fillStyle = col;
	    ctx.fillText(s, x, y); // left hand side of rule

	    x = leftMarg + longestLeftHandSide + colMarg;
	    if(!onlyItemSetMining) {
		s = t[5];
		ctx.fillText(s, x, y); // right hand side of rule
		x = leftMarg + longestLeftHandSide + colMarg + longestRightHandSide + colMarg;
	    }

	    for(var g = 0; g < ls.length; g++) {
		col = "black";
		
		if(separateMiningForEachGroup) {
		    col = getColorForGroup(ls[g][0]);
		    if(ls[g][0] == 0) {
			col = hexColorToRGBA(col, 0.5);
		    }
		}

		if(onlyItemSetMining) {
		    s = ls[g][1].confidence;
		} else {		    
		    s = ls[g][1].confidence.toString();
		    if(s.length > 4 || ls.length > 1) {
			s = ls[g][1].confidence.toPrecision(2);
		    }
		}
		ctx.fillStyle = col;
		ctx.fillText(s, x, y);
		
		textW = getTextWidthCurrentFont(s);
		x += textW + 2;
	    }

	    ctx.restore();
	}

	if(tooManyItemsGenerated) {
	    ctx.save();
	    ctx.fillStyle = "red";
    	    ctx.font = 2*fontSize + "px Arial";
	    var x = leftMarg;
	    var y = topMarg + 2*fontSize + 10;
	    ctx.fillText("Too many items generated!", x, y);
	    ctx.fillText("Mining Aborted!", x, y + 2*(fontSize + 5));
	    ctx.restore();
	}
	if(unique <= 0) {
	    ctx.save();
	    ctx.fillStyle = "red";
    	    ctx.font = 2*fontSize + "px Arial";
	    var x = leftMarg;
	    var y = topMarg + 2*fontSize + 10;
	    ctx.fillText("No data", x, y);
	    ctx.restore();
	}

	ctx.fillStyle = "black";
	var x = leftMarg;
	var y = headerTopMarg*2 + fontSize*2;
	
	var s = "";
	if(onlyItemSetMining) {
	    s = "Item Set Mining";
	} else {
	    s = "Rule Mining";
	}
	ctx.fillText(s, x, y);
	y += fontSize + 2;
	x += 20;
	
	var minSupS = minSupport.toString();
	if(minSupS.length > 5) {
	    minSupS = minSupport.toPrecision(3);
	}
	if(onlyItemSetMining) {
	    s = interfaceStrings[0] + minSupS;
	} else {
	    var minConfS = minConfidence.toString();
	    if(minConfS.length > 5) {
		minConfS = minConfidence.toPrecision(3);
	    }
	    s = interfaceStrings[0] + minSupS + interfaceStrings[1] + minConfS;
	}
	ctx.fillText(s, x, y);
	y += fontSize + 2;

	if(separateMiningForEachGroup) {
	    s = interfaceStrings[2];
	} else {
	    s = interfaceStrings[3];
	}
	ctx.fillText(s, x, y);
	y += fontSize + 2;

	if(includeUnselectedWhenMining) {
	    s = interfaceStrings[4];
	} else {
	    s = interfaceStrings[5];
	}
	ctx.fillText(s, x, y);
	y += fontSize + 2;
	
	if(includeEmptyTransactionsWhenCalculatingSupport) {
	    s = interfaceStrings[6];
	} else {
	    s = interfaceStrings[7];
	}
	ctx.fillText(s, x, y);
	y += fontSize + 2;
    }


    function drawBackground(W,H) {
	var colors = $scope.gimme("GroupColors");
	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
	}

	if(colors.hasOwnProperty("skin")) {
    	    var drewBack = false



	    if(colors.hasOwnProperty("skin") && colors.skin.hasOwnProperty("text")) {
		textColor = colors.skin.text;
	    } else {
		textColor = "#000000";
	    }

    	    if(colors.skin.hasOwnProperty("gradient")) {
    		var OK = true;
		
    		var grd = ctx.createLinearGradient(0,0,W,H);
    		for(var i = 0; i < colors.skin.gradient.length; i++) {
    		    var cc = colors.skin.gradient[i];
    		    if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
    			grd.addColorStop(cc.pos, cc.color);
    		    } else {
    			OK = false;
    		    }
    		}
    		if(OK) {
    		    ctx.fillStyle = grd;
    		    ctx.fillRect(0,0,W,H);
    		    drewBack = true;
    		}
    	    }
    	    if(!drewBack && colors.skin.hasOwnProperty("color")) {
    		ctx.fillStyle = colors.skin.color;
    		ctx.fillRect(0,0,W,H);
    		drewBack = true;
    	    }
	    
	    if(colors.skin.hasOwnProperty("border")) {
		ctx.fillStyle = colors.skin.border;

		ctx.fillRect(0,0, W,1);
		ctx.fillRect(0,H-1, W,H);
		ctx.fillRect(0,0, 1,H);
		ctx.fillRect(W-1,0, W,H);
	    }
	}
    };


    function updateDropZones(col, alpha, hover) {
	// debugLog("update the data drop zone locations");

	if(dropCanvas === null) {
   	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no drop canvas to draw on!");
    		return;
    	    }
	}

	if(dropCtx === null) {
    	    dropCtx = dropCanvas.getContext("2d");
	}
	
	if(!dropCtx) {
	    debugLog("no canvas to draw drop zones on");
	    return;
	}

	if(dropCtx) {
	    var W = dropCanvas.width;
	    var H = dropCanvas.height;

	    dropCtx.clearRect(0,0, W,H);

	    var marg1 = 8;
	    if(drawW < 40) {
		marg1 = 0;
	    }
	    var marg2 = 8;
	    if(drawH < 40) {
		marg2 = 0;
	    }

	    dropData.left = leftMarg - marg1;
	    dropData.top = headerTopMarg;
	    dropData.right = leftMarg + drawW + marg1;
	    dropData.bottom = Math.floor(H / 2) - marg2;

	    dropLabel.left = leftMarg - marg1;
	    dropLabel.top = Math.floor(H / 2) + marg2;
	    dropLabel.right = leftMarg + drawW + marg1;
	    dropLabel.bottom = H - headerTopMarg;

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
		    // dropCtx.strokeStyle = col;
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
			var tw = getTextWidth(str, fnt);
			var labelShift = Math.floor(fontSize / 2);
			if(dropZone.rotate) {
			    if(dropZone.left > W / 2) {
    				dropCtx.translate(dropZone.left - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
			    } else {
    				dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
			    }
    			    dropCtx.rotate(Math.PI/2);
			} else {
    			    dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), 
					      dropZone.top + Math.floor((dropZone.bottom - dropZone.top - fontSize) / 2));
			}
			dropCtx.fillText(str, 0, 0);
		    }
		    dropCtx.restore();
		}
	    }
	}
    }


    function getGradientColorForGroup(group, x1,y1, x2,y2, alpha) {
	if(useGlobalGradients) {
    	    if(myCanvas === null) {
    		var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    		if(myCanvasElement.length > 0) {
    		    myCanvas = myCanvasElement[0];
		}
	    }

    	    var W = myCanvas.width;
    	    if(typeof W === 'string') {
    		W = parseFloat(W);
    	    }
    	    if(W < 1) {
    		W = 1;
    	    }

    	    var H = myCanvas.height;
    	    if(typeof H === 'string') {
    		H = parseFloat(H);
    	    }
    	    if(H < 1) {
    		H = 1;
    	    }
	    
    	    x1 = 0;
    	    y1 = 0;
    	    x2 = W;
    	    y2 = H;
	}		
	
	if(colorPalette === null || colorPalette === undefined) {
    	    colorPalette = {};
	}

	var colors = $scope.gimme("GroupColors");
	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
	}
	
	group = group.toString();

	if(!colorPalette.hasOwnProperty(group)) {
    	    if(colors.hasOwnProperty('groups')) {
    		var groupCols = colors.groups;
		
    		for(var g in groupCols) {
    		    if(groupCols.hasOwnProperty(g)) {
    			colorPalette[g] = 'black';
			
    			if(groupCols[g].hasOwnProperty('color')) {
    			    colorPalette[g] = groupCols[g].color;
    			}
    		    }
    		}
    	    }
	}
	
	if(colors.hasOwnProperty("groups")) {
    	    var groupCols = colors.groups;
	    
    	    if(groupCols.hasOwnProperty(group) && ctx !== null && groupCols[group].hasOwnProperty('gradient')) {
    		var OK = true;
		
    		var grd = ctx.createLinearGradient(x1,y1,x2,y2);
    		for(var i = 0; i < groupCols[group].gradient.length; i++) {
    		    var cc = groupCols[group].gradient[i];
    		    if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
			if(alpha !== undefined) {
    			    grd.addColorStop(cc.pos, hexColorToRGBA(cc.color, alpha));
			}
			else {
    			    grd.addColorStop(cc.pos, cc.color);
			}
    		    } else {
    			OK = false;
    		    }
    		}
		
    		if(OK) {
    		    return grd;
    		}
    	    }
	}
	
	if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
    	    return 'black';
	} else {
    	    return colorPalette[group];
	}
    };

    function getColorForGroup(group) {
	if(colorPalette === null) {
    	    colorPalette = {};
	}

	group = group.toString();

	if(!colorPalette.hasOwnProperty(group)) {
    	    var colors = $scope.gimme("GroupColors");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    
    	    if(colors.hasOwnProperty("groups")) {
    		var groupCols = colors.groups;
		
    		for(var g in groupCols) {
    		    if(groupCols.hasOwnProperty(g)) {
    			colorPalette[g] = '#000000';
			
    			if(groupCols[g].hasOwnProperty('color')) {
    			    colorPalette[g] = groupCols[g].color;
    			}
    		    }
    		}
    	    }
	}
	
	if(colorPalette === null || !colorPalette.hasOwnProperty(group)) {
    	    return '#000000';
	} else {
    	    return colorPalette[group];
	}
    };

    function updateSize() {
	// debugLog("updateSize");

	if(checkSize()) {
	    // we will be called again when the resize comes through
	    return;
	}

	var rw = $scope.gimme("DrawingArea:width");
	if(typeof rw === 'string') {
    	    rw = parseFloat(rw);
	}
	if(rw < 1) {
    	    rw = 1;
	}

	var rh = $scope.gimme("DrawingArea:height");
	if(typeof rh === 'string') {
    	    rh = parseFloat(rh);
	}
	if(rh < 1) {
    	    rh = 1;
	}

	if(myCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theCanvas');
    	    if(myCanvasElement.length > 0) {
    		myCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to resize!");
    		return;
    	    }
	}
	myCanvas.width = rw;
	myCanvas.height = rh;

	if(selectionCanvas === null) {
    	    var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    	    if(selectionCanvasElement.length > 0) {
    		selectionCanvas = selectionCanvasElement[0];
    	    } else {
    		debugLog("no selectionCanvas to resize!");
    		return;
    	    }
	}
	selectionCanvas.width = rw;
	selectionCanvas.height = rh;
	selectionCanvas.style.left = 0;
	selectionCanvas.style.top = 0;

	if(selectionHolderElement === null) {
    	    selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
	}
	selectionHolderElement.width = rw;
	selectionHolderElement.height = rh;
	selectionHolderElement.top = 0;
	selectionHolderElement.left = 0;

	var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
	selectionRectElement.width = rw;
	selectionRectElement.height = rh;
	selectionRectElement.top = 0;
	selectionRectElement.left = 0;
	if(selectionRectElement.length > 0) {
    	    selectionRect = selectionRectElement[0];
	    selectionRect.width = rw;
	    selectionRect.height = rh;
	    selectionRect.top = 0;
	    selectionRect.left = 0;
	}
	
	var W = selectionCanvas.width;
	var H = selectionCanvas.height;
	drawW = W - leftMarg - rightMarg;
	drawH = H - topMarg - bottomMarg;

    	if(dropCanvas === null) {
    	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no drop canvas to resize!");
    	    }
	}
	if(dropCanvas) { 
	    dropCanvas.width = rw;
	    dropCanvas.height = rh;
	}

	updateGraphics();
    };

    function mySlotChange(eventData) {
	switch(eventData.slotName) {
	case "InternalSelections":
	    if(eventData.slotValue != internalSelectionsInternallySetTo) {
		setSelectionsFromSlotValue();
	    }
	    break;

	case "SelectAll":
	    if(eventData.slotValue) {
		selectAll();
		$scope.set("SelectAll",false);
	    }
	    break;

	case "FontSize":
	    sortedRules = [];
	    if(!checkSize()) {
		updateSize();
	    }
    	    break;
	    
	case "DrawingArea:height":
	    updateSize();
    	    break;
	case "DrawingArea:width":
	    updateSize();
    	    break;
	case "root:height":
	    updateSize();
    	    break;
	case "root:width":
	    updateSize();
    	    break;
	case "UseGlobalColorGradients":
	    if(eventData.slotValue) {
		useGlobalGradients = true;
	    } else {
		useGlobalGradients = false;
	    }
    	    updateGraphics();
    	    break;
	case "PluginName":
    	    $scope.displayText = eventData.slotValue;
    	    break;
	case "PluginType":
    	    if(eventData.slotValue != "VisualizationPlugin") {
    		$scope.set("PluginType", "VisualizationPlugin");
    	    }
    	    break;
    	    // if(eventData.slotValue != "Hybrid") {
    	    // 	$scope.set("PluginType", "Hybrid");
    	    // }
    	    // break;
	case "GlobalSelections":
	    if(separateMiningForEachGroup || !includeUnselectedWhenMining) {
		checkIfWeNeedToRedoMining();
	    } else {
    		updateGraphics();
	    }
    	    break;

	case 'OnlyItemSetMining':
	    var newVal = $scope.gimme('OnlyItemSetMining');
	    if(newVal && !onlyItemSetMining) {
		onlyItemSetMining = true;
		doMining();
	    } else if(!newVal && onlyItemSetMining) {
		onlyItemSetMining = false;
		doMining();
	    }
	    break;
	case 'SeparateMiningForEachGroup':
	    var newVal = $scope.gimme('SeparateMiningForEachGroup');
	    if(newVal && !separateMiningForEachGroup) {
		separateMiningForEachGroup = true;
		doMining();
	    } else if(!newVal && separateMiningForEachGroup) {
		separateMiningForEachGroup = false;
		doMining();
	    }
	    break;
	case 'IncludeUnselectedWhenMining':
	    var newVal = $scope.gimme('IncludeUnselectedWhenMining');
	    if(newVal && !includeUnselectedWhenMining) {
		includeUnselectedWhenMining = true;
		doMining();
	    } else if(!newVal && includeUnselectedWhenMining) {
		includeUnselectedWhenMining = false;
		doMining();
	    }
	    break;
	case 'IncludeEmptyTransactionsWhenCalculatingSupport':
	    var newVal = $scope.gimme('IncludeEmptyTransactionsWhenCalculatingSupport');
	    if(newVal && !includeEmptyTransactionsWhenCalculatingSupport) {
		includeEmptyTransactionsWhenCalculatingSupport = true;
		doMining();
	    } else if(!newVal && includeEmptyTransactionsWhenCalculatingSupport) {
		includeEmptyTransactionsWhenCalculatingSupport = false;
		doMining();
	    }
	    break;

	case 'MinSupport':
	    var newVal = parseFloat($scope.gimme('MinSupport'));
	    if(newVal != minSupport) {
		minSupport = newVal;
		if(minSupport < 0) {
		    minSupport = 0;
		}
		if(minSupport > 1) {
		    minSupport = 1;
		}
		doMining();
	    }
	    break;
	case 'MinConfidence':
	    var newVal = parseFloat($scope.gimme('MinConfidence'));
	    if(newVal != minConfidence) {
		minConfidence = newVal;
		if(minConfidence < 0) {
		    minConfidence = 0;
		}
		if(minConfidence > 1) {
		    minConfidence = 1;
		}
		doMining();
	    }
	    break;
	case 'MaximumNoofItemsAllowed':
	    var newVal = parseInt($scope.gimme('MaximumNoofItemsAllowed'));
	    if(newVal != maximumNoofItemsAllowed) {
		maximumNoofItemsAllowed = newVal;
		if(maximumNoofItemsAllowed < 1) {
		    maximumNoofItemsAllowed = 1;
		}
		if(tooManyItemsGenerated) {
		    doMining();
		}
	    }
	    break;

	case "Highlights":
    	    updateGraphics();
    	    break;
	case "GroupColors":
	    colorPalette = null;
	    parseSelectionColors();
    	    updateGraphics();
    	    break;
	case "DataValuesSetFilled":
    	    parseData();
    	    break;
	};
    };



    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(x1,x2, y1,y2, keepOld) {
	// debugLog("newSelection");

	if(unique > 0) {
	    y1 = Math.max(y1, topMarg);
	    y2 = Math.min(y2, topMarg + drawH);
	    
	    var newSel = [pixel2row(y1), pixel2row(y2)];
	    
	    var overlap = false;
	    for(var s = 0; s < selections.length; s++) {
		var sel = selections[s];
		if(sel[0] == newSel[0]
		   && sel[1] == newSel[1]) {
		    // debugLog("Ignoring selection because it overlaps 100% with already existing selection");
		    overlap = true;
		    break;
		}
	    }
	    
	    if(!overlap) {
		if(!keepOld) {
		    selections = [];
		}
		selections.push(newSel);
		drawSelections();
		updateLocalSelections(false);
		saveSelectionsInSlot();
	    }
	}
    };

    function selectAll() {
	if(unique <= 0) {
	    selections = [];
	} else {
	    selections = [[0, sortedRules.length - 1]];
	}
	drawSelections();
	updateLocalSelections(true);
	saveSelectionsInSlot();
    };

    function hexColorToRGBA(color, alpha) {
	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = parseInt(color.substr(1,2), 16);
	    var g = parseInt(color.substr(3,2), 16);
	    var b = parseInt(color.substr(5,2), 16);

	    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
	}
	return color;
    };

    function parseSelectionColors() {
	// debugLog("parseSelectionColors");

	var colors = $scope.gimme("GroupColors");
	if(typeof colors === 'string') {
    	    colors = JSON.parse(colors);
	}

	selectionColors = {};

	if(colors.hasOwnProperty('selection')) {
	    if(colors['selection'].hasOwnProperty('border')) {
		selectionColors.border = colors['selection']['border'];
	    } else {
		selectionColors.border = '#FFA500'; // orange
	    }
	    
	    if(colors['selection'].hasOwnProperty('color')) {
		selectionColors.color = hexColorToRGBA(colors['selection']['color'], selectionTransparency);
	    } else {
		selectionColors.color = hexColorToRGBA('#FFA500', selectionTransparency); // orange
	    }

	    if(colors['selection'].hasOwnProperty('gradient')) {
		if(selectionCanvas === null || selectionCtx === null) {
    		    var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    		    if(selectionCanvasElement.length > 0) {
    			selectionCanvas = selectionCanvasElement[0];
    			selectionCtx = selectionCanvas.getContext("2d");
    		    } else {
    			debugLog("no selectionCanvas to resize!");
    			return;
    		    }
		}

		selectionColors.grad = selectionCtx.createLinearGradient(0, 0, selectionCanvas.width, selectionCanvas.height);
		var atLeastOneAdded = false;
		for(var p = 0; p < colors['selection']['gradient'].length; p++) {
		    if(colors['selection']['gradient'][p].hasOwnProperty('pos') 
		       && colors['selection']['gradient'][p].hasOwnProperty('color')) {
			selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], hexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
			atLeastOneAdded = true;
		    }
		}
		if(!atLeastOneAdded) {
		    selectionColors.grad = selectionColors.color;
		}
	    } else {
		selectionColors.grad = selectionColors.color;
	    }
	}
    };

    function drawSelections() {
	// debugLog("drawSelections");
	if(selectionCanvas === null) {
    	    var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
    	    if(selectionCanvasElement.length > 0) {
    		selectionCanvas = selectionCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw selections on!");
    		return;
    	    }
	}

	if(selectionCtx === null) {
    	    selectionCtx = selectionCanvas.getContext("2d");
	}
	
	var W = selectionCanvas.width;
	var H = selectionCanvas.height;

	selectionCtx.clearRect(0,0, W,H);

	if(selectionColors === null) {
	    parseSelectionColors(W, H);
	}

	if(sortedRules.length > 0) {

	    for(sel = 0; sel < selections.length; sel++) {
		var y1 = row2pixel(selections[sel][0]);
		var y2 = row2pixel(selections[sel][1]);
		selectionCtx.fillStyle = selectionColors.grad;	    
		selectionCtx.fillRect(leftMarg - 2, y1, drawW + 4, y2 - y1 + fontSize + 2);
		selectionCtx.strokeStyle = selectionColors.border;	    
		selectionCtx.strokeRect(leftMarg - 2, y1, drawW + 4, y2 - y1 + fontSize + 2);
	    }
	}
	
	hideSelectionRect();
    };

    function hideSelectionRect() {
	if(selectionRect === null) {
    	    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    	    if(selectionRectElement.length > 0) {
    		selectionRect = selectionRectElement[0];
    	    } else {
    		debugLog("No selection rectangle!");
    	    }
	}
	if(selectionRect !== null) {
	    selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
	}
    };

    function mousePosIsInSelectableArea(pos) {
	if(pos.x > leftMarg - 5
	   && pos.x <= leftMarg + drawW + 5
	   && pos.y > topMarg - 5
	   && pos.y <= topMarg + drawH + 5) {
	    return true;
	}
	return false;
    };

    var onMouseMove = function(e){
	if(unique > 0) {
	    var currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

	    // // hover text

	    // if(hoverText === null) {
    	    // 	var elmnt = $scope.theView.parent().find('#mouseOverText');
    	    // 	if(elmnt.length > 0) {
    	    // 	    hoverText = elmnt[0];
    	    // 	} else {
    	    // 	    debugLog("No hover text!");
    	    // 	}
	    // }

	    // if(hoverText !== null) {
	    // 	if(mousePosIsInSelectableArea(currentMouse)) {
	    // 	    var x = pixel2valX(currentMouse.x);
	    // 	    var y = pixel2valY(currentMouse.y);

	    
	    // 	    var s = "[";

	    // 	    if(xType == 'date') {
	    // 		s += (date2text(Math.floor(x), limits.dateFormatX));
	    // 	    } else {
	    // 		s += number2text(x, limits.spanX);
	    // 	    }

	    // 	    s += ",";

	    // 	    if(yType == 'date') {
	    // 		s += (date2text(Math.floor(y), limits.dateFormatY));
	    // 	    } else {
	    // 		s += number2text(y, limits.spanY);
	    // 	    }
	    
	    // 	    s += "]";

	    // 	    // var s = "(" + number2text(x, limits.spanX) + "," + number2text(y, limits.spanY) + ")";
	    // 	    var textW = getTextWidthCurrentFont(s);
	    // 	    hoverText.style.font = fontSize + "px Arial";
	    // 	    hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
	    // 	    hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
	    // 	    hoverText.innerHTML = s;
	    // 	    hoverText.style.display = "block";
	    // 	} else {
	    // 	    hoverText.style.display = "none";
	    // 	}
	    // }

	    // selection rectangle, if clicked
	    
	    if(clickStart !== null) {
		if(selectionRect === null) {
    		    var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
    		    if(selectionRectElement.length > 0) {
    			selectionRect = selectionRectElement[0];
    		    } else {
    			debugLog("No selection rectangle!");
    		    }
		}
		if(selectionRect !== null) {
		    var x1 = currentMouse.x;
		    var w = 1;
		    if(clickStart.x < x1) {
			x1 = clickStart.x;
			w = currentMouse.x - x1;
		    } else {
			w = clickStart.x - x1;
		    }

		    var y1 = currentMouse.y;
		    var h = 1;
		    if(clickStart.y < y1) {
			y1 = clickStart.y;
			h = currentMouse.y - y1;
		    } else {
			h = clickStart.y - y1;
		    }
		    
		    var selectionRectCtx = selectionRect.getContext("2d");
		    selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);
		    
		    if(selectionColors === null) {
			parseSelectionColors();
		    }

		    selectionRectCtx.fillStyle = selectionColors.color;
		    selectionRectCtx.fillRect(x1, y1, w, h);
		    selectionRectCtx.save();
    		    selectionRectCtx.strokeStyle = selectionColors.border;
    		    selectionRectCtx.strokeRect(x1, y1, w, h);
		    selectionRectCtx.restore();
		}
	    }
	}
    };

    var onMouseDown = function(e){
	$scope.theView.find('.dragSrc').attr("id", "no drag data");
	$scope.theView.find('.dragSrc').draggable( 'disable' );

	if(unique > 0) {
	    if(e.which === 1){
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
		
		if(mousePosIsInSelectableArea(currentMouse)) {
		    clickStart = currentMouse;
		    if(e.ctrlKey || e.metaKey) {
			clickStart.ctrl = true;
		    } else {
			clickStart.ctrl = false;
		    }

		    selectionHolderElement.bind('mouseup', onMouseUp);
		    e.stopPropagation();
		} else {
		    clickStart = null;

		    // also do the drag&drop related stuff
		    var x = currentMouse.x;
		    var y = currentMouse.y;
		    
		    var found = false;
		    for(var dr = 0; dr < allDragNames.length; dr++){
			var drag = allDragNames[dr];
			if(drag.left >= 0
			   && x >= drag.left
			   && x <= drag.right
			   && y >= drag.top
			   && y <= drag.bottom) {
			    $scope.dragNdropRepr = drag.name;
			    $scope.dragNdropID = drag.ID;

			    $scope.theView.find('.dragSrc').draggable( 'enable' );
			    $scope.theView.find('.dragSrc').attr("id", drag.ID);

			    found = true;
			}
		    }
		    if(!found) {
			$scope.dragNdropRepr = "Nothing to drag.";
			$scope.dragNdropID = "No drag data.";
			$scope.theView.find('.dragSrc').attr("id", "no drag data");
			$scope.theView.find('.dragSrc').draggable( 'disable' );
		    }

		}
	    }
	}
    };

    var onMouseUp = function(e){
	if(unique > 0) {
	    selectionHolderElement.unbind('mouseup');
	    
	    // check new selection rectangle

	    if(clickStart !== null) {
		hideSelectionRect();
		
		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

		var x1 = currentMouse.x;
		var x2 = clickStart.x;
		if(x2 < x1) {
		    x1 = clickStart.x;
		    x2 = currentMouse.x;
		} 
		
		var y1 = currentMouse.y;
		var y2 = clickStart.y;
		if(y2 < y1) {
		    y1 = clickStart.y;
		    y2 = currentMouse.y;
		} 
		
		if(x1 == x2 && y1 == y2) {
		    // selection is too small, disregard
		    // debugLog("ignoring a selection because it is too small");
		} else {
		    newSelection(x1,x2, y1,y2, clickStart.ctrl);
		}
	    }
	}	
	clickStart = null;
    };

    var onMouseOut = function(e) {
	if(unique > 0) {
	    if(hoverText === null) {
    		var elmnt = $scope.theView.parent().find('#mouseOverText');
    		if(elmnt.length > 0) {
    		    hoverText = elmnt[0];
    		} else {
    		    debugLog("No hover text!");
    		}
	    }
	    if(hoverText !== null) {
		hoverText.style.display = "none";
	    }


	    if(clickStart !== null) {
		hideSelectionRect();

		currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

		var x1 = currentMouse.x;
		var x2 = clickStart.x;
		if(x2 < x1) {
		    x1 = clickStart.x;
		    x2 = currentMouse.x;
		} 
		
		var y1 = currentMouse.y;
		var y2 = clickStart.y;
		if(y2 < y1) {
		    y1 = clickStart.y;
		    y2 = currentMouse.y;
		} 
		
		if(x1 == x2 && y1 == y2) {
		    // selection is too small, disregard
		    // debugLog("ignoring a selection because it is too small");
		} else {
		    newSelection(x1,x2, y1,y2, clickStart.ctrl);
		}
	    }
	}	
	clickStart = null;
    };

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
    	    ctx = myCanvas.getContext("2d");
	} else {
    	    debugLog("no canvas to draw on!");
	}

	$scope.addSlot(new Slot('InternalSelections',
				{},
				"Internal Selections",
				'Slot to save the internal state of what is selected.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	// $scope.getSlot('InternalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('DataDropped',
				{},
				"Data Dropped",
				'Slot to notify parent that data has been dropped on this plugin using drag&drop.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataDropped').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('SelectAll',
				false,
				"Select All",
				'Slot to quickly reset all selections to select all available data.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('OnlyItemSetMining',
				true,
				"Only Item-Set Mining",
				'Only item-set mining, or rule mining on the item sets.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.addSlot(new Slot('SeparateMiningForEachGroup',
				true,
				"Separate Mining for each Group",
				'Do mining of rules/item sets globally, or generate rules for each group.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.addSlot(new Slot('IncludeUnselectedWhenMining',
				true,
				"Include Unselected when Mining",
				'Include unselected items when mining (will give rules for an unselected group etc. if turned off).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.addSlot(new Slot('IncludeEmptyTransactionsWhenCalculatingSupport',
				false,
				"Include Empty Transactions when Calculating Support",
				'Should the minimum support be compared to all data items, or only to items that have transactions?',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	$scope.addSlot(new Slot('MinSupport',
				0.2,
				"Minimum Support",
				'The lowest support necessary for transaction items to be included in the data mining.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.addSlot(new Slot('MinConfidence',
				0.5,
				"Minimum Confidence",
				'The lowest confidence necessary for rules to be included in the rule mining.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.addSlot(new Slot('MaximumNoofItemsAllowed',
				100000,
				"Maximum number of Items Allowed",
				'The maximum number of items allowed before giving up on the item mining (high values may cause the program to run out of memory).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	// internal slots specific to this Webble -----------------------------------------------------------

	$scope.addSlot(new Slot('FontSize',
				11,
				"Font Size",
				'The font size to use in the Webble interface.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


	// Dashboard Plugin slots -----------------------------------------------------------

	$scope.addSlot(new Slot('PluginName',
				"Item Set Mining",
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
	// $scope.addSlot(new Slot('PluginType',
	// 			"Hybrid",
	// 			"Plugin Type",
	// 			'The type of plugin this is. Should always be "Hybrid".',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 		       ));


	$scope.addSlot(new Slot('ExpectedFormat',
				[[{'idSlot':'DataIdSlot', 'name':'Transactions', 'type':'string', 'slot':'Transactions'},
				  {'idSlot':'ColumnIdSlot', 'name':'Column Names', 'type':'string', 'slot':'ColumnNames'}],
				 [{'idSlot':'DataIdSlot', 'name':'Transactions', 'type':'string', 'slot':'Transactions'}]
				 ],
				"Expected Format",
				'The input this plugin accepts.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));


	// $scope.addSlot(new Slot('FormatChanged',
	// 			false,
	// 			"Format Changed",
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 		       ));

	// slots for data input

	$scope.addSlot(new Slot('Transactions',
    				[["t1,t2,t3","t1,t3,t5"]],
    				"Transactions",
    				'The slot for input data with the item set transactions to do item set mining on.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
	$scope.getSlot('Transactions').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);



	$scope.addSlot(new Slot('ColumnNames',
    				[["C1","C2"]],
    				"Column Names",
    				'The slot for input data with the names for the transaction item names.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
	$scope.getSlot('ColumnNames').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	$scope.addSlot(new Slot('DataIdSlot',
    				[[1,2,3,4,5,6]],
    				"Data ID Slot",
    				'The slot where the IDs of the input data items should be put.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
	$scope.getSlot('DataIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	$scope.addSlot(new Slot('ColumnIdSlot',
    				[[1,2,3,4,5,6]],
    				"Column ID Slot",
    				'The slot where the IDs of the column name input data should be put.',
    				$scope.theWblMetadata['templateid'],
    				undefined,
    				undefined
    			       ));
	$scope.getSlot('ColumnIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	// // set to indicate that some slots have been reset by the properties form "submit" button because it cannot deal with all data types
	// $scope.addSlot(new Slot('PluginLostSomeInfo',
	// 			"",
	// 			"Plugin Lost Some Info",
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


	// Which data items have been selected locally (output from this webble)
	$scope.addSlot(new Slot('LocalSelections',
				{},
				"Local Selections",
				'Output Slot. A dictionary mapping data IDs to the group they are grouped into using only this plugin.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('LocalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	// set to indicate that the local selections have changed
	$scope.addSlot(new Slot('LocalSelectionsChanged',
				false,
				"Local Selections Changed",
				'Hack to work around problems in Webble World.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	// Which data items have been highlighted, locally (output from this webble)
	$scope.addSlot(new Slot('LocalHighlights',
				{},
				"Local Highlights",
				'Output Slot. A dictionary telling which data IDs should be highlighted.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('LocalHighlights').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	// set to indicate that the local Highlights have changed
	// $scope.addSlot(new Slot('LocalHighlightsChanged',
	// 			false,
	// 			'Local Highlights Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


	// Which data items have been selected, globally (input to this webble)
	$scope.addSlot(new Slot('GlobalSelections',
				{},
				"Global Selections",
				'Input Slot. A dictionary mapping data IDs to groups. Specifying what data items to draw in what colors.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('GlobalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	// set to indicate that the global selections have changed
	// $scope.addSlot(new Slot('GlobalSelectionsChanged',
	// 			false,
	// 			'Global Selections Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));

	// Which data items have been highlighted globally
	$scope.addSlot(new Slot('Highlights',
				{},
				"Highlights",
				'Input Slot. A dictionary specifying which IDs to highlight.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Highlights').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

	// set to indicate that some settings were changed, so we probably need new data
	// $scope.addSlot(new Slot('HighlightsChanged',
	// 			false,
	// 			'Global Highlights Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));

	// // colors of groups of data, and the background color theme
	$scope.addSlot(new Slot('GroupColors',
				{"skin":{"color":"#8FBC8F", "border":"#8FBC8F", "gradient":[{"pos":0, "color":"#E9F2E9"}, {"pos":0.75, "color":"#8FBC8F"}, {"pos":1, "color":"#8FBC8F"}]}, 
				 "selection":{"color":"#FFA500", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFEDCC"}, {"pos":1, "color":"#FFA500"}]}, 
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
					  }},
				"Group Colors",
				'Input Slot. Mapping group numbers to colors.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	// This tells us what fields of data the parent has filled for us, and what labels to use on axes for these fields.
	$scope.addSlot(new Slot('DataValuesSetFilled',
				[],
				"Data Values Set Filled",
				'Input Slot. Specifies which data slots were filled with data.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

	// set to indicate that the data has been updated
	// $scope.addSlot(new Slot('DataValuesChanged',
	// 			false,
	// 			'Data Values Changed',
	// 			'Hack to work around problems in Webble World.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined
	// 			));


	$scope.setDefaultSlot('');

	myInstanceId = $scope.getInstanceId();
	myPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	checkSize();
	updateGraphics();

	selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
	if(selectionHolderElement !== null){
	    selectionHolderElement.bind('mousedown', onMouseDown);
	    selectionHolderElement.bind('mousemove', onMouseMove);
	    selectionHolderElement.bind('mouseout', onMouseOut);
	} else {
	    debugLog("No selectionHolderElement, could not bind mouse listeners");
	}


	$scope.fixDroppable();
	$scope.fixDraggable();
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


    // TODO: POSSIBLE ADDITIONAL CUSTOM METHODS
    //========================================================================================
    // Custom template specific methods is very likely to be quite a few of in every Webble,
    // and they contain what ever the developer want them to contain.
    //========================================================================================
    // "Public" (accessible outside this controller)
    //    $scope.[CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }

    // "Private" (accessible only inside this controller)
    //    var [CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }
    //========================================================================================


    // TODO: POSSIBLE OVERRIDING WEBBLE CORE METHODS WITH CUSTOM PARTS
    //========================================================================================
    // In 99% of all Webble development there is probably no need to insert custom code inside
    // a Webble core function or in any way override Webble core behavior, but the possibility
    // exists as shown below if special circumstance and needs arise.
    //========================================================================================
    //    $scope.[NEW METHOD NAME] = $scope.$parent.[PARENT METHOD]   //Assign the Webble core method to a template method caller
    //
    //    $scope.$parent.[PARENT METHOD] = function([PARAMETERS]){    //Assign a new custom method to th Webble Core
    //        [CUSTOM CODE HERE]
    //
    //        $scope.[NEW METHOD NAME]();                             //Call the original function, in order to not break expected behavior
    //
    //        [MORE CUSTOM CODE HERE]
    //    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
