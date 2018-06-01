//======================================================================================================================
// Controllers for DigitalDashboardPluginMapFlow for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('mapFlowPluginWebbleCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        mapDrawingArea: ['width', 'height', 'background-color']
    };

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    $scope.displayText = "Trajectories Map";

    var myInstanceId = -1;
    
    var lastSeenGlobalSelections = [];

    var mouseIsDown = false;
    var mouseDownPos = null;
    var selectionRect = null;
    var shiftPressed = false;
    var ctrlPressed = false;
    var shouldClearSelections = true;

    // graphics

    var ZEROTRANSPARENCY = 0.5;

    var selections = []; // the graphical ones

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
    
    var clickStart = null;

    // data from parent

    var lats1 = [];
    var lons1 = [];
    var timestamps = [];
    var trajectories = [];
    var trajectoryIDtoIdxMap = {};

    var analysisType = 0; // ['PassingAny', 'EnteringAny', 'LeavingAny', 'From1to2', 'Between1and2']
    var selectionType = 0; // ['IgnoreUnselectedPoints', 'SelectOneSelectsTrajectory', 'UnselectOneUnselectsTrajectory', 'UseAll']
    var renderStyle = 1; // ['Dots', 'DotsAndConnectingLines', 'Density']
    var timeFrame = 0; // minutes before/after entering/leaving to use (0 == full trajectory)

    var haveDots = false;
    var haveLines = false;

    var dotSize = 5;
    var lineWidth = 2;
    var transparency = 1;

    var Ns = [];
    var N = 0;

    var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
    var unique = 0; // number of data points with non-null values
    var NULLs = 0;

    var localSelections = []; // the data to send to the parent

    var noofGroups = 1;
    var drawH = 1;
    var drawW = 1;

    var internalSelectionsInternallySetTo = {};

    var myCanvas = null;
    var myCtx = null;
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

    var dropTime = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"Time stamp", "rotate":true, "forParent":{'idSlot':'DataIdSlot', 'name':'Timestamp', 'type':'date', 'slot':'Timestamp'}};
    var dropID = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "label":"Trajectory ID", "rotate":false, "forParent":{'idSlot':'DataIdSlot', 'name':'ID', 'type':'string|number', 'slot':'ID'}};
    var dropX = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "label":"Longitude", "rotate":false, "forParent":{'idSlot':'DataIdSlot', 'name':'Longitude', 'type':'longitude', 'slot':'Longitude'}};
    var dropY = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "label":"Latitude", "rotate":true, "forParent":{'idSlot':'DataIdSlot', 'name':'Latitude', 'type':'latitude', 'slot':'Latitude'}};

    var allDropZones = [dropX, dropY, dropID, dropTime];

    //=== EVENT HANDLERS ================================================================

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
		debugLog("drop location is: '" + e.target.id + "'");
		debugLog("dropped item is: '" + ui.draggable.attr('id') + "'");

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

    function mapMouseDown(e){
        if(e.which === 1){
            e.stopPropagation();
        }
    }
    
    function initializeMapAPI () {

	debugLog("initializeMapAPI");

	var currentPlace = new google.maps.LatLng(mapCenterLat, mapCenterLon);

        var mapOptions = {
            backgroundColor: "black",
            center: currentPlace,
            zoom: mapZoom
        };

	mapDiv = $scope.theView.parent().find("#mapDiv");
	mapDiv.bind('mousedown', mapMouseDown);
		
        map = new google.maps.Map(mapDiv[0], mapOptions);
        // placesService = new google.maps.places.PlacesService(map);
        infowindow = new google.maps.InfoWindow();

        google.maps.event.addListener(map,'center_changed',function() {
	    // debugLog("center_changed");

            var currentPlace = map.getCenter();

	    var newMapCenterLat = currentPlace.lat();
	    var newMapCenterLon = currentPlace.lng();
	    
	    if(newMapCenterLat != mapCenterLat 
	       || newMapCenterLon != mapCenterLon) {

		mapCenterLat = newMapCenterLat;
		mapCenterLon = newMapCenterLon;

		$scope.set('MapCenterLatitude', mapCenterLat);
		$scope.set('MapCenterLongitude', mapCenterLon);

		updateGraphics();
	    }
        });

        google.maps.event.addListener(map,'zoom_changed',function() {
	    // debugLog("zoom_changed");

	    var newMapZoom = map.getZoom();
	    if(newMapZoom != mapZoom) {
		mapZoom = newMapZoom;
		$scope.set('ZoomLevel', mapZoom);
		updateGraphics();
	    }
        });

	google.maps.event.addListener(map, 'mousemove', function (e) {
	    if (mouseIsDown) {
		if (selectionRect !== null)
		{
		    var bounds = new google.maps.LatLngBounds();
		    bounds.extend(mouseDownPos);
		    bounds.extend(e.latLng);
		    selectionRect.setBounds(bounds);
		} else {
		    var bounds = new google.maps.LatLngBounds();
		    bounds.extend(mouseDownPos);
		    bounds.extend(e.latLng);

		    var cols = $scope.gimme("GroupColors");
		    var col = "#FFEBCD";
		    var border = "#FFA500";

		    if(cols && cols.hasOwnProperty("selection")
		      ) {
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
	    } else {
		shouldClearSelections = true;
	    }

	    if (shiftPressed) {
		map.setOptions({
                    draggable: true
		});
            } else {
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
	    map.setOptions({
		draggable: true
            });	
	});

	google.maps.event.addListener(map, 'mouseout', function (e) {
	    if(selectionRect !== null) {
		// new selection
		newSelection(selectionRect, !shouldClearSelections);
	    }
	    mouseIsDown = false;
	    map.setOptions({
		draggable: true
            });	
	});
    }
    
    $(window).keydown(function (evt) {
        if (evt.which === 16) { // shift
            shiftPressed = true;
        }
        if (evt.which === 17) { // ctrl
            ctrlPressed = true;
        }	
    }).keyup(function (evt) {
        if (evt.which === 16) { // shift
            shiftPressed = false;
        }
        if (evt.which === 17) { // ctrl
            ctrlPressed = false;
        }	
    });


    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard Map Flow: " + message);
	}
    }

    function saveSelectionsInSlot() {
	// debugLog("saveSelectionsInSlot");

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
    };

    
    function updateLocalSelections(selectAll) {
	// debugLog("updateLocalSelections");

    	// var globalSelections = [];
    	// var globalSelectionsPerId = $scope.gimme('GlobalSelections');
    	// if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
    	//     globalSelections = globalSelectionsPerId['DataIdSlot'];
    	// }

	var nullAsUnselected = $scope.gimme('TreatNullAsUnselected');
	var nullGroup = 0;
	if(!nullAsUnselected) {
	    nullGroup = selections.length + 1; // get unused groupId
	}

	var dirty = false;

	if(selectAll) {

	}

	for(var trIdx = 0; trIdx < trajectories.length; trIdx++) { 
	    // var selected = false;
	    
	    // if(selectionType == 3) { // use all data
	    // 	selected = true;
	    // } else if(selectionType == 2) { // one unselected point unselects trajectory
	    // 	selected = true;

	    // 	for(var i = 0; i < trajectories[trIdx][1].length; i++) {
	    // 	    var tup = trajectories[trIdx][1][i];
	    // 	    var set = tup[3];
	    // 	    var setIdx = tup[4];

	    // 	    var selArray = [];
    	    // 	    if(set < globalSelections.length) {
    	    // 		selArray = globalSelections[set];
    	    // 	    }

            //         var groupId = 0;
    	    // 	    if(setIdx < selArray.length) {
    	    // 		groupId = selArray[setIdx];
    	    // 	    }
		    
	    // 	    if(groupId == 0) {
	    // 		selected = false;
	    // 		break;
	    // 	    }
	    // 	}
	    // } else if(selectionType == 1) { // one selected point selects trajectory
	    // 	selected = false;

	    // 	for(var i = 0; i < trajectories[trIdx][1].length; i++) {
	    // 	    var tup = trajectories[trIdx][1][i];
	    // 	    var set = tup[3];
	    // 	    var setIdx = tup[4];

	    // 	    var selArray = [];
    	    // 	    if(set < globalSelections.length) {
    	    // 		selArray = globalSelections[set];
    	    // 	    }

            //         var groupId = 0;
    	    // 	    if(setIdx < selArray.length) {
    	    // 		groupId = selArray[setIdx];
    	    // 	    }
		    
	    // 	    if(groupId > 0) {
	    // 		selected = true;
	    // 		break;
	    // 	    }
	    // 	}
	    // } else { // skip unselected points
	    // 	selected = true;
	    // }

	    // if(!selected) {
	    // 	var ls = trajectories[trIdx][1];
		
	    // 	for(var i = 0; i < ls.length; i++) {
	    // 	    var set = ls[i][3];
	    // 	    var setIdx = ls[i][4];
		    
	    // 	    if(set < localSelections.length) {
	    // 		var selArray = localSelections[set];
	    // 		if(setIdx < selArray.length) {
	    // 		    if(selArray[setIdx] != 0) { 
	    // 			dirty = true;
	    // 			selArray[setIdx] = 0;
	    // 		    }
	    // 		}
	    // 	    }
	    // 	}
	    // } else {

	    if(true) {
		// build list of which points are in which areas

		var ls = trajectories[trIdx][1];
		var ls2 = [];

		var atLeastOne = 0;

		for(var i = 0; i < ls.length; i++) {
		    var insideSpan = 0;

		    var set = ls[i][3];
		    var setIdx = ls[i][4];

		    ls2.push(0);

		    // var groupId = 0;
		    // if(selectionType == 3) { // use all data
		    // 	groupId = 1;
		    // } else {
		    // 	var selArray = [];
    		    // 	if(set < globalSelections.length) {
    		    // 	    selArray = globalSelections[set];
    		    // 	}

    		    // 	if(setIdx < selArray.length) {
    		    // 	    groupId = selArray[setIdx];
    		    // 	}
		    // }
		    var groupId = 1;
		    if(groupId > 0) {
			var lat = ls[i][1];
			var lon = ls[i][2];
			var p1 = new google.maps.LatLng(lat, lon);

			for(var span = 0; span < selections.length; span++) {
			    if(selections[span].getBounds().contains(p1)) {
				insideSpan = span + 1;
				ls2[i] = insideSpan;
				break;
			    }
			}
		    }

		    if(insideSpan > 0 && atLeastOne == 0) {
			atLeastOne = insideSpan;
		    }
		}


		if(analysisType == 0) {  // 'PassingAny'

		    for(var i = 0; i < ls.length; i++) {
			var set = ls[i][3];
			var setIdx = ls[i][4];
			
			if(set < localSelections.length) {
			    var selArray = localSelections[set];
			    if(setIdx < selArray.length) {

				var insideSpan = 0;
				if(timeFrame == 0) {
				    insideSpan = atLeastOne;
				} else {
				    // check before and after values in ls2

				    for(var j = 0; j < ls2.length; j++) {
					if(ls2[j] != 0) {
					    if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
						insideSpan = ls2[j];
						break;
					    }
					}
				    }
				}

				if(selArray[setIdx] != insideSpan) { 
				    dirty = true;
				    selArray[setIdx] = insideSpan;
				}
			    }
			}
		    }
		} else if(analysisType == 1) { // 'EnteringAny'

		    for(var i = 0; i < ls.length; i++) {
			var set = ls[i][3];
			var setIdx = ls[i][4];
			
			if(set < localSelections.length) {
			    var selArray = localSelections[set];
			    if(setIdx < selArray.length) {

				// check the "after" values in ls2

				var insideSpan = 0;
				if(timeFrame == 0) {
				    for(var j = i; j < ls2.length; j++) {
					if(ls2[j] != 0) {
					    insideSpan = ls2[j];
					    break;
					}
				    }
				} else {
				    // check the "after" values in ls2
				    for(var j = i; j < ls2.length; j++) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] != 0) {
						insideSpan = ls2[j];
						break;
					    }
					} else {
					    break;
					}
				    }
				}

				if(selArray[setIdx] != insideSpan) { 
				    dirty = true;
				    selArray[setIdx] = insideSpan;
				}
			    }
			}
		    }

		    
		} else if(analysisType == 2) { // 'LeavingAny' 

		    for(var i = 0; i < ls.length; i++) {
			var set = ls[i][3];
			var setIdx = ls[i][4];
			
			if(set < localSelections.length) {
			    var selArray = localSelections[set];
			    if(setIdx < selArray.length) {

				// check the "before" values in ls2

				var insideSpan = 0;
				if(timeFrame == 0) {
				    for(var j = i; j >= 0; j--) {
					if(ls2[j] != 0) {
					    insideSpan = ls2[j];
					    break;
					}
				    }
				} else {
				    // check the "after" values in ls2
				    for(var j = i; j >= 0; j--) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] != 0) {
						insideSpan = ls2[j];
						break;
					    }
					} else {
					    break;
					}
				    }
				}

				if(selArray[setIdx] != insideSpan) { 
				    dirty = true;
				    selArray[setIdx] = insideSpan;
				}
			    }
			}
		    }

		} else if(analysisType == 3) { // 'From1to2'

		    for(var i = 0; i < ls.length; i++) {
			var set = ls[i][3];
			var setIdx = ls[i][4];
			
			if(set < localSelections.length) {
			    var selArray = localSelections[set];
			    if(setIdx < selArray.length) {

				// check the "before" values in ls2

				var insideSpanBefore = 0;
				if(timeFrame == 0) {
				    for(var j = i; j >= 0; j--) {
					if(ls2[j] == 1) {
					    insideSpanBefore = ls2[j];
					    break;
					}
				    }
				} else {
				    for(var j = i; j >= 0; j--) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] == 1) {
						insideSpanBefore = ls2[j];
						break;
					    }
					} else {
					    break;
					}
				    }
				}

				// check the "after" values in ls2

				var insideSpanAfter = 0;
				if(timeFrame == 0) {
				    for(var j = i; j < ls2.length; j++) {
					if(ls2[j] == 2) {
					    insideSpanAfter = ls2[j];
					    break;
					}
				    }
				} else {
				    // check the "after" values in ls2
				    for(var j = i; j < ls2.length; j++) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] == 2) {
						insideSpanAfter = ls2[j];
						break;
					    }
					} else {
					    break;
					}
				    }
				}

				var insideSpan = 0;
				if(insideSpanBefore == 1 && insideSpanAfter == 2) {
				    insideSpan = 1;
				}
				
				if(selArray[setIdx] != insideSpan) { 
				    dirty = true;
				    selArray[setIdx] = insideSpan;
				}
			    }
			}
		    }
		    
		} else if(analysisType == 4) { // 'Between1and2'

		    for(var i = 0; i < ls.length; i++) {
			var set = ls[i][3];
			var setIdx = ls[i][4];
			
			if(set < localSelections.length) {
			    var selArray = localSelections[set];
			    if(setIdx < selArray.length) {

				// check the "before" values in ls2

				var insideSpanBefore1 = 0;
				var insideSpanBefore2 = 0;
				if(timeFrame == 0) {
				    for(var j = i; j >= 0; j--) {
					if(ls2[j] == 1) {
					    insideSpanBefore1 = ls2[j];
					    if(insideSpanBefore2 > 0) {
						break;
					    }
					}

					if(ls2[j] == 2) {
					    insideSpanBefore2 = ls2[j];

					    if(insideSpanBefore1 > 0) {
						break;
					    }
					}
				    }
				} else {
				    for(var j = i; j >= 0; j--) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] == 1) {
						insideSpanBefore1 = ls2[j];
						if(insideSpanBefore2 > 0) {
						    break;
						}
					    }

					    if(ls2[j] == 2) {
						insideSpanBefore2 = ls2[j];

						if(insideSpanBefore1 > 0) {
						    break;
						}
					    }
					} else {
					    break;
					}
				    }
				}

				// check the "after" values in ls2

				var insideSpanAfter1 = 0;
				var insideSpanAfter2 = 0;
				if(timeFrame == 0) {
				    for(var j = i; j < ls2.length; j++) {
					if(ls2[j] == 1) {
					    insideSpanAfter1 = ls2[j];
					    if(insideSpanAfter2 > 0) {
						break;
					    }
					}

					if(ls2[j] == 2) {
					    insideSpanAfter2 = ls2[j];
					    if(insideSpanAfter1 > 0) {
						break;
					    }
					}
				    }
				} else {
				    // check the "after" values in ls2
				    for(var j = i; j < ls2.length; j++) {
					if(Math.abs(ls[i][0] - ls[j][0]) < timeFrame*60*1000) {
					    if(ls2[j] == 1) {
						insideSpanAfter1 = ls2[j];
						if(insideSpanAfter2 > 0) {
						    break;
						}
					    }

					    if(ls2[j] == 2) {
						insideSpanAfter2 = ls2[j];
						if(insideSpanAfter1 > 0) {
						    break;
						}
					    }
					} else {
					    break;
					}
				    }
				}

				var insideSpan = 0;
				if(insideSpanBefore1 == 1 && insideSpanAfter2 == 2) {
				    insideSpan = 1;
				} else if(insideSpanBefore2 == 2 && insideSpanAfter1 == 1) {
				    insideSpan = 2;
				}
				
				if(selArray[setIdx] != insideSpan) { 
				    dirty = true;
				    selArray[setIdx] = insideSpan;
				}
			    }
			}
		    }

		}
	    }
	}

	if(dirty) {
	    $scope.set('LocalSelections', {'DataIdSlot':localSelections});
	    $scope.set('LocalSelectionsChanged', !$scope.gimme('LocalSelectionsChanged')); // flip flag to tell parent we updated something
	} else {
	    // debugLog("local selections had not changed");
	}
    };


    function resetVars() {
	lats1 = [];
	lons1 = [];
	timestamps = [];
	trajectoryIDtoIdxMap = {};
	trajectories = [];
	
	Ns = [];
	N = 0;
	
	limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
	unique = 0;
	NULLs = 0;

	localSelections = [];
    };

    function parseData() {
    	// debugLog("parseData");

    	// parse parents instructions on where to find data, check that at least one data set is filled
    	var atLeastOneFilled = false;

    	var parentInput = $scope.gimme('DataValuesSetFilled');
    	if(typeof parentInput === 'string') {
    	    parentInput = JSON.parse(parentInput);
    	}

    	resetVars();

    	if(parentInput.length > 0) {
    	    var haveX = false;
    	    var haveY = false;
    	    var haveTime = false;
    	    var haveID = false;

    	    for(var i = 0; i < parentInput.length; i++) {
    		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Latitude") {
    		    haveX = true;
    		}
		
    		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Longitude") {
    		    haveY = true;
    		}

    		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "Timestamp") {
    		    haveTime = true;
    		}
		
    		if(parentInput[i].hasOwnProperty("name") && parentInput[i].name == "ID") {
    		    haveID = true;
    		}
    	    }
	    
    	    if(haveX && haveY && haveTime && haveID) {
    		atLeastOneFilled = true;
    	    }
    	}
	
    	// debugLog("read parent input ", atLeastOneFilled);
	
    	var dataIsCorrupt = false;

    	if(atLeastOneFilled) {
    	    var idArrays = $scope.gimme('DataIdSlot');
    	    lons1 = $scope.gimme('Longitude');
    	    lats1 = $scope.gimme('Latitude');
	    timestamps  = $scope.gimme('Timestamp');
	    var ids =  $scope.gimme('ID');
	    
    	    if(idArrays.length != lons1.length
    	       || idArrays.length != lats1.length
	       || idArrays.length != timestamps.length
	       || idArrays.length != ids.length
	      ) {
    		dataIsCorrupt = true;
    	    }
	    
    	    if(idArrays.length <= 0) {
    		dataIsCorrupt = true;
    	    }
	    
    	    if(!dataIsCorrupt) {
    		var sources = lats1.length;
		
    		for(var source = 0; source < sources; source++) {
    		    var idArray = idArrays[source];
		    
    		    if(idArray.length != lons1[source].length
    		       || idArray.length != lats1[source].length
    		       || idArray.length != timestamps[source].length
    		       || idArray.length != ids[source].length
		      ) {
    			dataIsCorrupt = true;
    		    }
    		    if(idArray.length <= 0) {
    			dataIsCorrupt = true;
    		    }
    		}
    	    }

    	    if(!dataIsCorrupt) {
    		Ns = [];
    		var firstNonNullData = true;
    		var minXVal = 0;
    		var maxXVal = 0;
    		var minYVal = 0;
    		var maxYVal = 0;

    		for(var source = 0; source < lats1.length; source++) {
    		    var lon1 = lons1[source];
    		    var lat1 = lats1[source];

    		    N += lat1.length;
    		    Ns.push(lat1.length);
		    
    		    localSelections.push([]);

    		    for(i = 0; i < Ns[source]; i++) {
    			localSelections[source].push(0);

    			if(lon1[i] !== null 
    			   && lat1[i] !== null
			   && timestamps[source][i] !== null
			   && ids[source][i] !== null
    			  ) {
			    
    			    unique++;

    			    var x1 = lat1[i];
    			    var y1 = lon1[i];
			    
			    if(isNaN(x1) || isNaN(y1)) {
				dataIsCorrupt = true; // only null values
			    } else {
				var trID = ids[source][i];
				var t = timestamps[source][i];
				
				if(!trajectoryIDtoIdxMap.hasOwnProperty(trID)) {
				    trajectoryIDtoIdxMap[trID] = trajectories.length;
				    trajectories.push([trID, [[t, x1, y1, source, i]]]);
				} else {
				    trajectories[trajectoryIDtoIdxMap[trID]][1].push([t, x1, y1, source, i]);
				}
			    }

    			    if(firstNonNullData) {
    				firstNonNullData = false;

    				minXVal = x1;
    				maxXVal = x1;
    				minYVal = y1;
    				maxYVal = y1;

    			    } else {
    				minXVal = Math.min(x1, minXVal);
    				maxXVal = Math.max(x1, maxXVal);
    				minYVal = Math.min(y1, minYVal);
    				maxYVal = Math.max(y1, maxYVal);
    			    }
    			} else {
    			    NULLs++;
    			}
    		    }
    		}

    		if(firstNonNullData) {
    		    dataIsCorrupt = true; // only null values
    		} else {

    		    limits = {};
    		    limits.minX = minXVal;
    		    limits.maxX = maxXVal;
    		    limits.minY = minYVal;
    		    limits.maxY = maxYVal;

		    for(var idx = 0; idx < trajectories.length; idx++) {
			trajectories[idx][1].sort(function(a,b){return (a[0] - b[0]);}); // sort trajectory data points by timestamp
		    }
		    
    		    // debugLog("parseData limits: " + JSON.stringify(limits));
    		}
    	    }
	    
    	    if(dataIsCorrupt) {
    		debugLog("data is corrupt");
    		resetVars();
    	    }
    	} else {
    	    debugLog("no data");
    	}

    	if(unique > 0) {

	    haveDots = false;
	    haveLines = false;
	    if(renderStyle == 0) {
		haveDots = true;
		haveLines = false;
	    } else if(renderStyle == 1) {
		haveDots = true;
		haveLines = true;
	    }

    	    updateLocalSelections(false);

	    updateGraphics();

    	} else { // no data
    	    $scope.set('LocalSelections', {'DataIdSlot':[]});

	    updateGraphics();
	}

    }


    // ==========================================================
    // Drawing on a bitmap stuff
    // ==========================================================


    function blendRGBAs(r,g,b,alpha, offset, pixels) {
	if(pixels[offset+3] > 0 && alpha < 255) {
	    // something drawn here already, blend alpha

	    var oldA = pixels[offset+3] / 255.0;
	    var newA = alpha / 255.0;

	    var remainA = (1 - newA) * oldA;
	    
	    var outA = newA + remainA;
	    if(outA > 0) {
		var oldR = pixels[offset];
		var oldG = pixels[offset+1];
		var oldB = pixels[offset+2];

		var outR = Math.min(255, (oldR * remainA + newA * r) / outA);
		var outG = Math.min(255, (oldG * remainA + newA * g) / outA);
		var outB = Math.min(255, (oldB * remainA + newA * b) / outA);
	    } else {
		var outR = 0;
		var outG = 0;
		var outB = 0;
	    }
	    pixels[offset] = outR;
	    pixels[offset+1] = outG;
	    pixels[offset+2] = outB;
	    pixels[offset+3] = Math.min(255, outA * 255);
	} else {
	    pixels[offset] = r;
	    pixels[offset+1] = g;
	    pixels[offset+2] = b;
	    pixels[offset+3] = alpha;
	}
    }

    // This line drawing function was copied from http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
    // The code is not original to me. I was very slightly modified by me.
    /// <summary>
    /// Draws a colored line by connecting two points using a DDA algorithm (Digital Differential Analyzer).
    /// </summary>
    function drawLineDDA(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth)
    {
	var W = Math.floor(leftMarg + drawW);
	var H = Math.floor(topMarg + drawH);

	var ALW = Math.floor(ArrayLineWidth);

	var x1 = Math.round(X1);
	var y1 = Math.round(Y1);
	var x2 = Math.round(X2);
	var y2 = Math.round(Y2);

        // Distance start and end point
        var dx = x2 - x1;
        var dy = y2 - y1;

        // Determine slope (absoulte value)
        var len = dy >= 0 ? dy : -dy;
        var lenx = dx >= 0 ? dx : -dx;
	var fatX = true;
        if (lenx > len)
        {
            len = lenx;
	    fatX = false;
        }

        // Prevent divison by zero
        if (len != 0)
        {
            // Init steps and start
            var incx = dx / len;
            var incy = dy / len;
            var x = x1;
            var y = y1;

            // Walk the line!
            for (var i = 0; i < len; i++)
            {
		var ry = Math.round(y);
		var rx = Math.round(x);
		
		for(var w = 0; w < lineWidth; w++) {
		    if(ry >= topMarg && ry < H
		       && rx >= leftMarg && rx < W) {

			var offset = (ry * ALW + rx) * 4;

			blendRGBAs(r,g,b,alpha, offset, pixels);
		    }
		    if(fatX) {
			rx++;
		    } else {
			ry++;
		    }
		}
                x += incx;
                y += incy;
            }
        }
    }

    function drawLineDDAfullalpha(pixels, X1, Y1, X2, Y2, r, g, b, alpha, ArrayLineWidth)
    {
	var W = Math.floor(leftMarg + drawW);
	var H = Math.floor(topMarg + drawH);

	var ALW = Math.floor(ArrayLineWidth);

	var x1 = Math.round(X1);
	var y1 = Math.round(Y1);
	var x2 = Math.round(X2);
	var y2 = Math.round(Y2);

        // Distance start and end point
        var dx = x2 - x1;
        var dy = y2 - y1;

        // Determine slope (absoulte value)
        var len = dy >= 0 ? dy : -dy;
        var lenx = dx >= 0 ? dx : -dx;
	var fatX = true;
        if (lenx > len)
        {
            len = lenx;
	    fatX = false;
        }

        // Prevent divison by zero
        if (len != 0)
        {
            // Init steps and start
            var incx = dx / len;
            var incy = dy / len;
            var x = x1;
            var y = y1;

            // Walk the line!
            for (var i = 0; i < len; i++)
            {
		var ry = Math.round(y);
		var rx = Math.round(x);
		
		for(var w = 0; w < lineWidth; w++) {
		    if(ry >= topMarg && ry < H
		       && rx >= leftMarg && rx < W) {

			var offset = (ry * ALW + rx) * 4;

			pixels[offset] = r;
			pixels[offset+1] = g;
			pixels[offset+2] = b;
			pixels[offset+3] = alpha;
		    }
		    if(fatX) {
			rx++;
		    } else {
			ry++;
		    }
		}
                x += incx;
                y += incy;
            }
        }
    }

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

        for (var x = -halfDot; x < halfDot + 1; x++)
        {
	    if (x + xpos >= leftMarg && x + xpos < W) {
		var x2 = x * x;
		
		for (var y = -halfDot; y < halfDot + 1; y++)
		{
                    if(y + ypos >= topMarg && y + ypos < H)
                    {
			var y2 = y * y;
			
			if (y2 + x2 <= r2)
			{
			    var offset = (y * ALW + x) * 4;

			    blendRGBAs(r,g,b, alpha, startPixelIdx + offset, pixels);
			}
                    }
		}
	    }
        }
    }

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

        for (var x = -halfDot; x < halfDot + 1; x++)
        {
	    if (x + xpos >= leftMarg && x + xpos < W) {
		var x2 = x * x;
		
		for (var y = -halfDot; y < halfDot + 1; y++)
		{
                    if(y + ypos >= topMarg && y + ypos < H)
                    {
			var y2 = y * y;
			
			if (y2 + x2 <= r2)
			{
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

    function getGradientColorForGroup(group, x1,y1, x2,y2, alpha, myCanvas, myCtx) {
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
 	
    	group = group.toString();

    	if(!colorPalette.hasOwnProperty(group)) {
    	    if(currentColors.hasOwnProperty('groups')) {
    		var groupCols = currentColors.groups;
		
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
	
    	if(currentColors.hasOwnProperty("groups")) {
    	    var groupCols = currentColors.groups;
	    
    	    if(groupCols.hasOwnProperty(group) && myCtx !== null && groupCols[group].hasOwnProperty('gradient') && (x1 != x2 || y1 != y2)) {
    		var OK = true;
		
		try {
    		    var grd = myCtx.createLinearGradient(x1,y1,x2,y2);
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
    		} catch(e) {
		    OK = false;
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
    	    if(currentColors.hasOwnProperty("groups")) {
    		var groupCols = currentColors.groups;
		
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
    }

    function hexColorToRGBAvec(color, alpha) {
	var res = [];

	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = parseInt(color.substr(1,2), 16);
	    var g = parseInt(color.substr(3,2), 16);
	    var b = parseInt(color.substr(5,2), 16);
	    var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
	    return [r, g, b, a];
	}
	return [0, 0, 0, 255];
    }

    function hexColorToRGBA(color, alpha) {
	if(typeof color === 'string'
	   && color.length == 7) {
	    
	    var r = parseInt(color.substr(1,2), 16);
	    var g = parseInt(color.substr(3,2), 16);
	    var b = parseInt(color.substr(5,2), 16);

	    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
	}
	return color;
    }


    function drawFlow() {
    	if(unique <= 0) {
    	    return;
    	}

	if(mapDiv === null) {
	    debugLog("no mapDiv to draw on");
	    return;
	}

	if(!map) {
	    debugLog("map not loaded yet");
	    return;
	}

	debugLog("draw!");

	if(!currentColors) {
    	    currentColors = $scope.gimme("GroupColors");
    	    if(typeof currentColors === 'string') {
    		currentColors = JSON.parse(currentColors);
    	    }
	}

    	var globalSelections = [];
    	var globalSelectionsPerId = $scope.gimme('GlobalSelections');
    	if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
    	    globalSelections = globalSelectionsPerId['DataIdSlot'];
    	}

	lastSeenGlobalSelections = [];
	for(var set = 0; set < globalSelections.length; set++) {
	    lastSeenGlobalSelections.push([]);
	    for(var i = 0; i < globalSelections[set].length; i++) {
		lastSeenGlobalSelections[set].push(globalSelections[set][i]);
	    }
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
	} catch(e) {
	    debugLog("No map to draw on yet");
	    $timeout(function(){updateSize(); updateGraphics();});
	    return;
	}

	var col;
	var fill;

	var zeroTransp = ZEROTRANSPARENCY;
	if(transparency < 1) {
	    zeroTransp *= transparency;
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

	var drawPretty = true;
	if(unique > quickRenderThreshold) {
	    drawPretty = false;
	    var rgba0 = hexColorToRGBAvec(getColorForGroup(0), zeroTransp);
	    var rgbaText = hexColorToRGBAvec(textColor, 1.0);
	    var imData = myCtx.getImageData(0, 0, myCanvas.width, myCanvas.height);
	    var pixels = imData.data;
	} else {
    	    var col0 = hexColorToRGBA(getColorForGroup(0), zeroTransp, myCanvas, myCtx);
    	    var fill0 = getGradientColorForGroup(0, 0,0,drawW,drawH, zeroTransp, myCanvas, myCtx);
	}


	var selStatus = [];

	for(var trIdx = 0; trIdx < trajectories.length; trIdx++) { 
	    var selected = false;
	    
	    if(selectionType == 3) { // use all data
		selected = true;
	    } else if(selectionType == 2) { // one unselected point unselects trajectory
		selected = true;

		for(var i = 0; i < trajectories[trIdx][1].length; i++) {
		    var tup = trajectories[trIdx][1][i];
		    var set = tup[3];
		    var setIdx = tup[4];

		    var selArray = [];
    		    if(set < globalSelections.length) {
    			selArray = globalSelections[set];
    		    }

                    var groupId = 0;
    		    if(setIdx < selArray.length) {
    			groupId = selArray[setIdx];
    		    }
		    
		    if(groupId == 0) {
			selected = false;
			break;
		    }
		}
	    } else if(selectionType == 1) { // one selected point selects trajectory
		selected = false;

		for(var i = 0; i < trajectories[trIdx][1].length; i++) {
		    var tup = trajectories[trIdx][1][i];
		    var set = tup[3];
		    var setIdx = tup[4];

		    var selArray = [];
    		    if(set < globalSelections.length) {
    			selArray = globalSelections[set];
    		    }

                    var groupId = 0;
    		    if(setIdx < selArray.length) {
    			groupId = selArray[setIdx];
    		    }
		    
		    if(groupId > 0) {
			selected = true;
			break;
		    }
		}
	    } else { // skip unselected points
		selected = false;

		for(var i = 0; i < trajectories[trIdx][1].length; i++) {
		    var tup = trajectories[trIdx][1][i];
		    var set = tup[3];
		    var setIdx = tup[4];

		    var selArray = [];
    		    if(set < globalSelections.length) {
    			selArray = globalSelections[set];
    		    }

                    var groupId = 0;
    		    if(setIdx < selArray.length) {
    			groupId = selArray[setIdx];
    		    }
		    
		    if(groupId > 0) {
			selected = true;
			break;
		    }
		}
	    }

	    selStatus.push(selected);
	}

	for(var pass = 0; pass < 2; pass++) {
	    for(var trIdx = 0; trIdx < trajectories.length; trIdx++) { 
		selected = selStatus[trIdx];
		
		if(!selected && pass == 0
		   || selected && pass > 0) {
		    
		    if(haveLines) { // should draw lines

			var ls = trajectories[trIdx][1];
			if(ls.length > 1) {
			    var path = [];
			    for(var i = 0; i < ls.length; i++) {
				path.push({'lat':ls[i][1], 'lng':ls[i][2]});
			    }

			    if(drawPretty) {
				if(!selected) {
				    col = col0;
				} else {
				    col = "#000000"; // getColorForGroup(groupId);
				}
				
    				myCtx.save();
    				myCtx.beginPath();
    				myCtx.strokeStyle = col;
    				myCtx.lineWidth = lineWidth;
				
				var p1 = new google.maps.LatLng(ls[0][1], ls[0][2]);
				var p1px = proj.fromLatLngToPoint(p1);
    				var x1 = leftMarg + (p1px.x * scale - SWpx.x * scale) / WEpxs * drawW;
    				var y1 = topMarg + (p1px.y * scale - NEpx.y * scale) / NSpxs * drawH;

    				myCtx.moveTo(x1, y1);
				
				for(var i = 1; i < ls.length; i++) {
				    var p2 = new google.maps.LatLng(ls[i][1], ls[i][2]);
				    var p2px = proj.fromLatLngToPoint(p2);
    				    var x2 = leftMarg + (p2px.x * scale - SWpx.x * scale) / WEpxs * drawW;
    				    var y2 = topMarg + (p2px.y * scale - NEpx.y * scale) / NSpxs * drawH;

    				    myCtx.lineTo(x2, y2);
    				    myCtx.stroke();
				}

    				myCtx.restore();
			    } else {
				if(!selected) {
				    col = rgba0;
				} else {
				    // col = hexColorToRGBAvec(getColorForGroup(groupId), 1);
				    col = [0, 0, 0, Math.min(255, 255*transparency)];
				}

				var p1 = new google.maps.LatLng(ls[0][1], ls[0][2]);
				var p1px = proj.fromLatLngToPoint(p1);
    				var x1 = leftMarg + (p1px.x * scale - SWpx.x * scale) / WEpxs * drawW;
    				var y1 = topMarg + (p1px.y * scale - NEpx.y * scale) / NSpxs * drawH;

				for(var i = 1; i < ls.length; i++) {
				    var p2 = new google.maps.LatLng(ls[i][1], ls[i][2]);
				    var p2px = proj.fromLatLngToPoint(p2);
    				    var x2 = leftMarg + (p2px.x * scale - SWpx.x * scale) / WEpxs * drawW;
    				    var y2 = topMarg + (p2px.y * scale - NEpx.y * scale) / NSpxs * drawH;

				    if(col[3] >= 255) {
					drawLineDDAfullalpha(pixels, x1, y1, x2, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    } else {
					drawLineDDA(pixels, x1, y1, x2, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    }

				    // drawLineDDA(pixels, x1, y1, x2, y2, col[0], col[1], col[2], col[3], myCanvas.width);
				    
				    x1 = x2;
				    y1 = y2;
				}
			    }
			}
		    }

		    if(haveDots) { // should draw dots

			var ls = trajectories[trIdx][1];
			for(var i = 0; i < ls.length; i++) {
			    
			    var groupId = 0;
			    if(selectionType == 2 && !selected) {
				groupId = 0;
			    } else {
				var set = ls[i][3];
				var setIdx = ls[i][4];

				var selArray = [];
    				if(set < globalSelections.length) {
    				    selArray = globalSelections[set];
    				}
				
    				if(setIdx < selArray.length) {
    				    groupId = selArray[setIdx];
    				}
			    }

			    var p1 = new google.maps.LatLng(ls[i][1], ls[i][2]);
			    var p1px = proj.fromLatLngToPoint(p1);
    			    var x1 = leftMarg + (p1px.x * scale - SWpx.x * scale) / WEpxs * drawW;
    			    var y1 = topMarg + (p1px.y * scale - NEpx.y * scale) / NSpxs * drawH;

			    if(drawPretty) {
    				if(groupId <= 0) {
				    col = col0;
    				    if(!useGlobalGradients) {
    		     			fill = getGradientColorForGroup(0, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, zeroTransp, myCanvas, myCtx);
    				    } else {
					fill = fill0;
				    }
				} else {
    				    col = getColorForGroup(groupId);
				    if(transparency >= 1) {
    					fill = getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, 1, myCanvas, myCtx);
				    } else {
					fill = getGradientColorForGroup(groupId, x1-dotSize,y1-dotSize,x1+dotSize,y1+dotSize, transparency, myCanvas, myCtx);
				    }
				}

    				myCtx.save();
    				myCtx.beginPath();
    				myCtx.arc(x1, y1, dotSize, 0, 2 * Math.PI, false);
    				myCtx.fillStyle = fill;
    				myCtx.fill();
    				myCtx.lineWidth = 1;
    				myCtx.strokeStyle = col;
    				myCtx.stroke();
    				myCtx.restore();
			    } else {
    				if(groupId <= 0) {
				    rgba = rgba0;
				} else {
				    if(transparency >= 1) {
					rgba = hexColorToRGBAvec(getColorForGroup(groupId), 1);
				    } else {
					rgba = hexColorToRGBAvec(getColorForGroup(groupId), transparency);
				    }
				}

				if(groupId > 0 || zeroTransp > 0) {

				    if(rgba[3] >= 255) {
					drawDotfullalpha(x1, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    } else {
					drawDot(x1, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				    }

				    // drawDot(x1, y1, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], pixels, myCanvas.width);
				}
			    }
			}
		    }
		}
	    }
	}
	if(!drawPretty) {
	    myCtx.putImageData(imData, 0, 0);
	}
    }


    function checkColors(currentColors, lastColors) {
	if(currentColors == lastColors) {
	    return false;
	}

	if(!lastColors) {
	    return true;
	}

	if(!lastColors.hasOwnProperty("groups") && 
	   !currentColors.hasOwnProperty("groups"))
	{
	    return false;
	} else if(lastColors.hasOwnProperty("groups") 
		  && currentColors.hasOwnProperty("groups")) {
	    // check more

	    var groupCols = currentColors.groups;
	    var lastGroupCols = lastColors.groups;
	    
	    for(var g in groupCols) {
		if(!lastGroupCols.hasOwnProperty(g)) {
		    return true;
		}
	    }
	    for(var g in lastGroupCols) {
		if(!groupCols.hasOwnProperty(g)) {
		    return true;
		}
		
		if(groupCols[g].hasOwnProperty('color')
		   && (!lastGroupCols[g].hasOwnProperty('color')
		       || lastGroupCols[g].color != groupCols[g].color)) {
		    return true;
		}
		
		if(groupCols[g].hasOwnProperty('gradient')) {
		    if(!lastGroupCols[g].hasOwnProperty('gradient')
		      || lastGroupCols[g].gradient.length != groupCols[g].gradient.length) {
			return true;
		    }
		    
		    for(var i = 0; i < groupCols[g].gradient.length; i++) {
			var cc = groupCols[g].gradient[i];
			var cc2 = lastGroupCols[g].gradient[i];
			
			if(cc.hasOwnProperty('pos') != cc2.hasOwnProperty('pos')
			   || cc.hasOwnProperty('color') != cc2.hasOwnProperty('color')
			   || (cc.hasOwnProperty('pos') && cc.pos != cc2.pos)
			   || (cc.hasOwnProperty('color') && cc.color != cc2.color)) {
			    return true;
			}
		    }
		}
	    }
	} else {
	    return true;
	}

	return false;
    }
    
    function copyColors(colors) {
	var res = {};
	
	if(colors.hasOwnProperty('skin')) {
	    res.skin = {};
	    for(var prop in colors.skin) {
		res.skin[prop] = colors.skin[prop];
	    }
	}
	if(colors.hasOwnProperty('groups')) {
	    res.groups = {};
	    for(var prop in colors.groups) {
		res.groups[prop] = colors.groups[prop];
	    }
	}
	return res;
    }

    function updateGraphics() {
    	debugLog("updateGraphics()");

	if(currentColors === null) {
    	    var colors = $scope.gimme("GroupColors");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    currentColors = copyColors(colors);

	    if(!currentColors) {
		currentColors = {};
	    }
	}
	
	if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
	    textColor = currentColors.skin.text;
	} else {
	    textColor = "#000000";
	}
	
	drawFlow();
    }

    function getTextWidthCurrentFont(text) {
	if(dropCtx !== null && dropCtx !== undefined) {
	    var metrics = dropCtx.measureText(text);
	    return metrics.width;
	}
	return 0;
    }

    function updateDropZones(col, alpha, hover) {
	// update the data drop locations
	
	debugLog("update the data drop zone locations");

	if(dropCanvas === null) {
   	    var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
    	    if(myCanvasElement.length > 0) {
    		dropCanvas = myCanvasElement[0];
    	    } else {
    		debugLog("no canvas to draw on!");
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

	    dropY.left = 0;
	    dropY.top = topMarg + marg2;
	    dropY.right = leftMarg;
	    dropY.bottom = H - bottomMarg - marg2;
	    
	    dropTime.left = W - rightMarg;
	    dropTime.top = topMarg + marg2;
	    dropTime.right = W;
	    dropTime.bottom = H - bottomMarg - marg2;
	    
	    dropX.left = leftMarg + marg1;
	    dropX.top = H - bottomMarg;
	    dropX.right = W - rightMarg - marg1;
	    dropX.bottom = H;
	    
	    dropID.left = leftMarg + marg1;
	    dropID.top = 0;
	    dropID.right = W - rightMarg - marg1;
	    dropID.bottom = topMarg;

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
			var tw = getTextWidthCurrentFont(str);
			var labelShift = Math.floor(fontSize / 2);
			if(dropZone.rotate) {
			    if(dropZone.left > W / 2) {
    				dropCtx.translate(dropZone.left - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
			    } else {
    				dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
			    }
    			    dropCtx.rotate(Math.PI/2);
			} else {
			    if(dropZone.top < H / 2) {
    				dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
			    } else {
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


    function updateSize() {
	// debugLog("updateSize");

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

	if(mapDiv === null) {
	    mapDiv = $scope.theView.parent().find("#mapDiv");
	}
	if(mapDiv !== null) {
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

	updateGraphics();

	updateDropZones(textColor, 0.3, false);
    }

    function mySlotChange(eventData) {
    	// debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

    	switch(eventData.slotName) {
	case "SelectAll":
	    if(eventData.slotValue) {
		selectAll();
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
			updateGraphics();
		    }
		}
	    }
	    break;

    	case "TreatNullAsUnselected":
    	    updateLocalSelections(false);
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
		if(haveDots) { 
    		    updateGraphics();
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
		updateGraphics();
	    }
    	    break;
    	case "UnselectedTransparency":
	    var newVal = parseFloat($scope.gimme("UnselectedTransparency"));
	    if(newVal < 0) {
		newVal = 0;
	    } 
	    if(newVal > 1) {
		newVal = 1;
	    }
	    if(newVal != ZEROTRANSPARENCY) {
		ZEROTRANSPARENCY = newVal;
    		updateGraphics();
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
    	case "GlobalSelections":
	    checkIfGlobalSelectionsActuallyChanged();
    	    break;
    	case "Highlights":
    	    updateGraphics();
    	    break;
    	case "GroupColors":
	    colorPalette = null;
	    if(eventData.slotValue
	       && eventData.slotValue.hasOwnProperty('skin')
	       && eventData.slotValue.skin.hasOwnProperty('border')) {
		$scope.set("mapDrawingArea:background-color", eventData.slotValue.skin.border);
	    }

    	    var colors = $scope.gimme("GroupColors");
    	    if(typeof colors === 'string') {
    		colors = JSON.parse(colors);
    	    }
	    currentColors = copyColors(colors);

    	    updateGraphics();

	    updateDropZones(textColor, 0.3, false);
    	    break;
    	case "DataValuesSetFilled":
    	    parseData();
    	    break;

	case "RenderStyle":
	    var newRenderStyle = $scope.gimme("RenderStyle");
	    if(newRenderStyle >= 0 && newRenderStyle < 3) {
		if(newRenderStyle != renderStyle) {
		    renderStyle = newRenderStyle;
		    
		    haveDots = false;
		    haveLines = false;
		    if(renderStyle == 0) {
			haveDots = true;
			haveLines = false;
		    } else if(renderStyle == 1) {
			haveDots = true;
			haveLines = true;
		    }

		    updateGraphics();
		}
	    } else {
		$scope.set("RenderStyle", renderStyle);
	    }
	    break;
	case "AnalysisType":
	    var newAnalysisType = $scope.gimme("AnalysisType");
	    if(newAnalysisType >= 0 && newAnalysisType < 5) {
		if(newAnalysisType != analysisType) {
		    analysisType = newAnalysisType;
		    updateLocalSelections(false);
		}
	    } else {
		$scope.set("AnalysisType", analysisType);
	    }
	    break;
	case "SelectedData":
	    var newSelectionType = $scope.gimme("SelectedData");
	    if(newSelectionType >= 0 && newSelectionType < 4) {
		if(newSelectionType != selectionType) {
		    selectionType = newSelectionType;
		    updateLocalSelections(false);
		    updateGraphics();
		}
	    } else {
		$scope.set("SelectedData", selectionType);
	    }
	    break;
	case "TimeFrame":
	    var newTimeFrame = parseFloat($scope.gimme("TimeFrame"));
	    if(!isNaN(newTimeFrame) && newTimeFrame >= 0) {
		if(newTimeFrame != timeFrame) {
		    timeFrame = newTimeFrame;
		    updateLocalSelections(false);
		}
	    }
	    break;

    	};
    };


    function checkIfGlobalSelectionsActuallyChanged () {
    	var globalSelections = [];
	var globalSelectionsPerId = $scope.gimme('GlobalSelections');
	if(globalSelectionsPerId.hasOwnProperty('DataIdSlot')) {
	    globalSelections = globalSelectionsPerId['DataIdSlot'];
	}

	var dirty = false;
    	for(var set = 0; set < Ns.length; set++) {
	    var selArray = [];
	    if(set < globalSelections.length) {
		selArray = globalSelections[set];
	    }

	    var oldSelArray = [];
	    if(set < lastSeenGlobalSelections.length) {
		oldSelArray = lastSeenGlobalSelections[set];
	    }
	    
	    if(selArray.length != oldSelArray.length) {
		dirty = true;
		break;
	    }

    	    var lon1 = lons1[set];
    	    var lat1 = lats1[set];


    	    for(var i = 0; i < Ns[set]; i++) {
    		if(lon1[i] === null
    		   || lat1[i] === null
    		   ) {
    		    continue;
    		}

                var groupId = 0;
		if(i < selArray.length) {
		    groupId = selArray[i];
		}

                var oldGroupId = 0;
		if(i < oldSelArray.length) {
		    oldGroupId = oldSelArray[i];
		}
		
		if(groupId != oldGroupId) {
		    dirty = true;
		    break;
		}
	    }
	    
	    if(dirty) {
		break;
	    }
	}

	if(dirty) {
	    // debugLog("global selections dirty, redraw");
    	    updateGraphics();
	}
    }


    // ==============================
    // ------- Mouse Stuff ----------
    // ==============================

    function newSelection(rect, keepOld) {
	// debugLog("newSelection");

	if(unique > 0) {
	    if(!keepOld) {
		clearSelections();
	    }
	    selections.push(rect);
	    selectionRect = null;

	    updateLocalSelections(false);
	    saveSelectionsInSlot();
	}
    };

    function clearSelections() {
	for(var i = 0; i < selections.length; i++) {
	    selections[i].setMap(null);
	}
	selections = [];
    }

    function selectAll() {
	clearSelections();

	if(unique <= 0) {
	    // nothing to do
	} else {
	    var bounds = new google.maps.LatLngBounds();
	    var p1 = new google.maps.LatLng(limits.minX, limits.minY);
	    var p2 = new google.maps.LatLng(limits.maxX, limits.maxY);
	    bounds.extend(p1);
	    bounds.extend(p2);

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

	    selections.push(selectionRect);
	    selectionRect = null;
	}

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

        $scope.addSlot(new Slot('TimeFrame',
				timeFrame,
				"Time Frame",
				'How much of the trajectory to use, in minutes. For example, for "passing any selection" analysis, X minutes of data from the trajectory before entering the selection area and X minutes of data after leaving the selection area will be shown. 0 means the full trajectory.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('RenderStyle',
				renderStyle,
				"Render Style",
				'The way to display the data: as dots (each data point), as dots with connecting lines, as density (how many data points there are in each location).',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Dots', 'DotsAndConnectingLines', 'Density']},
				undefined
			       ));

        $scope.addSlot(new Slot('AnalysisType',
				analysisType,
				"Analysis Type",
				'The way selections work: trajectories passing through any selection, trajectories entering any selection, trajectories leaving any selection, trajectories from selection 1 to selection 2, trajectories from selection 1 to selection 2 or from 2 to 1.',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['PassingAny', 'EnteringAny', 'LeavingAny', 'From1to2', 'Between1and2']},
				undefined
			       ));

        $scope.addSlot(new Slot('SelectedData',
				selectionType,
				"Selected Data",
				'The way selecting subsets of data points on other components work: ignore unselected data points, one selected data point makes trajectory selected, one unselected data point unselects whole trajectory, always use all input data.',
				$scope.theWblMetadata['templateid'],
				{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['IgnoreUnselectedPoints', 'SelectOneSelectsTrajectory', 'UnselectOneUnselectsTrajectory', 'UseAll']},
				undefined
			       ));

	


	// $scope.getSlot('InternalSelections').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        // internal slots specific to this Webble -----------------------------------------------------------

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

        $scope.addSlot(new Slot('Transparency',
				transparency,
				"Transparency",
				'The transparency, from 0 to 1, of the plots (if many items overlap, setting transparency closer to 0 may make it clearer).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('UnselectedTransparency',
				ZEROTRANSPARENCY,
				"Unselected Transparency",
				'The transparency, from 0 to 1, of items that are not selected.',
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

        $scope.addSlot(new Slot('TreatNullAsUnselected',
				false,
				"Treat Null as Unselected",
				'Group data items with no value together with items that are not selected (otherwise they get their own group).',
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



        $scope.addSlot(new Slot('InternalSelections',
				{},
				"Internal Selections",
				'Slot to save the internal state of what is selected.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

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


        $scope.addSlot(new Slot('ExpectedFormat',
				[[{'idSlot':'DataIdSlot', 'name':'Latitude', 'type':'latitude', 'slot':'Latitude'},
				  {'idSlot':'DataIdSlot', 'name':'Longitude', 'type':'longitude', 'slot':'Longitude'},
				  {'idSlot':'DataIdSlot', 'name':'Timestamp', 'type':'date', 'slot':'Timestamp'},
				  {'idSlot':'DataIdSlot', 'name':'ID', 'type':'string|number', 'slot':'ID'}]],
				"Expected Format",
				'The input this plugin accepts.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('Latitude',
				[[1,1,3,4,3,1]],
				"Latitude",
				'The slot for the latitude information.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Latitude').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	
        $scope.addSlot(new Slot('Longitude',
				[[1,1,3,4,3,1]],
				"Longitude",
				'The slot for the longitude information.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Longitude').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('Timestamp',
				[['2011-02-02T18:02:00', '2011-02-02T18:03:00', '2011-02-02T18:02:00', '2011-02-02T13:03:00', '2011-02-02T19:06:00', '2011-02-02T18:04:00']],
				"Timestamp",
				'The slot for timestamps to order the trajectory information.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('Timestamp').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

        $scope.addSlot(new Slot('ID',
				[[1,1,1,2,2,3]],
				"ID",
				'The slot with information of which points belong to the same trajectory (e.g. Twitter user ID, probe car ID).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('ID').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);



	$scope.addSlot(new Slot('DataIdSlot',
				[[1,2,3,4,5,6]],
				"Data ID Slot",
				'The slot where the IDs of the input data items should be put.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));
	$scope.getSlot('DataIdSlot').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);


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

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	updateSize();
	updateGraphics();

	$scope.fixDroppable();

	$timeout(function(){initializeMapAPI(); updateSize(); updateGraphics();});
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

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
