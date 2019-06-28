//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================

wblwrld3App.controller("workboardWebbleCtrl", function($scope, $log, Slot, Enum) {
    // $scope is needed for angularjs to work properly and is
    // not recommended to be removed. Slot is a Webble World
    // available Service and is needed for any form of Slot
    // manipulation inside this template and is not
    // recommended to be removed.
    // cleanupService is just a custom service used as an
    // example, but any services needed must be included in
    // the controller call.

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        workboard: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
    };

    var currentRoot = null;
    var totalDays = 0;

    var currentMode = 'design';

    var currentTrial = -1;
    var currentPatient = -1;

    var listOfExceptionalEvents = [];

    var theTimeline = null;

    var scaleFactor = 14.3;
    
    var topSpace = 100;
    var leftSpace = 15;
    var exceptionalEventMargin = 50;

    var branchMargin = 30; // used to be 20
    var ptcMargin = 1;
    
    var listOfAllChildren = [];

    var myParent = null;
    var myParentId = null;
    var myWebble = null;    

    var myInstanceId = -1;

    var myPatientboard = null;

    var weAreLoadingATrial = false;
    var dataToSendToPatientBoard = null;

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBWorkboard: " + message);
	}
    };

    //=== EVENT HANDLERS ================================================================

    var forceSlotSetForPositions = false;

    var updateLayout = function() {
	if(currentRoot !== null) {
    	    currentRoot.totalH = getHeight(currentRoot);

	    setArmOrder(currentRoot, false);

    	    if(currentRoot.left != leftSpace + currentRoot.offsetUnits * scaleFactor) {
    		currentRoot.left = leftSpace;
		if(currentRoot.webble !== null) {
    		    //currentRoot.webble.scope().set('root:left', currentRoot.left + currentRoot.offsetUnits * scaleFactor);
    		    currentRoot.webble.scope().silentMoveLeft(currentRoot.left + currentRoot.offsetUnits * scaleFactor);
		}
    	    }
    	    if(currentRoot.top != topSpace) {
    		currentRoot.top = topSpace;
		if(currentRoot.webble !== null) {
    		    // currentRoot.webble.scope().set('root:top', currentRoot.top);
    		    currentRoot.webble.scope().silentMoveTop(currentRoot.top);
		}
    	    }
    	    
    	    if(forceSlotSetForPositions) {
		if(currentRoot.webble !== null) {
    		    // currentRoot.webble.scope().set('root:top', currentRoot.top);
    		    // currentRoot.webble.scope().set('root:left', currentRoot.left + currentRoot.offsetUnits * scaleFactor);
		    currentRoot.webble.scope().silentMove(currentRoot.left + currentRoot.offsetUnits * scaleFactor, currentRoot.top);
		}
    	    }

    	    moveChildren(currentRoot);
	}
    	totalDays = countDays(currentRoot);
    	if(theTimeline !== null) {
    	    theTimeline.scope().set('NoOfDays', totalDays);

	    var prot = theTimeline.scope().getProtection();
	    prot = prot | Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
	    theTimeline.scope().setProtection(prot);

	    theTimeline.scope().set('root:left', '0px');
	    theTimeline.scope().set('root:top', '30px');
    	}

	if(listOfExceptionalEvents.length > 0) {
	    // debugLog("updateLayout, exceptional events: " + listOfExceptionalEvents.length);

	    var y = topSpace + exceptionalEventMargin;
	    if(currentRoot !== null) {
		y += currentRoot.totalH;
	    }
	    var x = leftSpace;
	    
	    for(var i = 0; i < listOfExceptionalEvents.length; i++) {
		var s = listOfExceptionalEvents[i];
		if(s.webble !== null) {
		    var prot = s.webble.scope().getProtection();
		    var oldProt = prot;
		    prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
		    s.webble.scope().setProtection(prot);

		    if(s.type == 'biop' || s.type == 'blood' || s.type == 'imag') {
			// s.webble.scope().set('root:top', y + 80);
			s.webble.scope().silentMoveTop(y + 80);
			// debugLog("updateLayout, exceptional events, move Top " + i);
		    } else {
			// s.webble.scope().set('root:top', y);
			s.webble.scope().silentMoveTop(y);
			// debugLog("updateLayout, exceptional events, move Top " + i);
		    }
		    // s.webble.scope().set('root:left', x);
		    s.webble.scope().silentMoveLeft(x);
		    // debugLog("updateLayout, exceptional events, move left " + i);

		    s.webble.scope().setProtection(oldProt);
		}		    
		x += scaleFactor * 3;
	    }
	}
	
	//debugLog("----------------- update finished:");
    	//printTree(currentRoot);
    	forceSlotSetForPositions = false;
    };

    var getShadowFromWebble = function(child) {
	var i = 0;
	for(i = 0; i < listOfAllChildren.length; i++) {
	    //	    debugLog("checking pos " + i + ", " + (listOfAllChildren[i].webble == child) + " " + (listOfAllChildren[i].webble === child)); 
	    if(listOfAllChildren[i] !== null && listOfAllChildren[i].webble === child) {
		return listOfAllChildren[i];
	    }
	}
	return null;
    };


    //=== METHODS & FUNCTIONS ===========================================================

    var findPatientboard = function() {
	var name = $scope.gimme("PatientboardName");
	var w = $scope.getWebblesByDisplayName(name);

	if(w && w.length > 0) {
	    debugLog("found a patient board Webble: " + w);
	    myPatientboard = w[0];
	} else {
	    debugLog("could not find a patient board Webble");
	    myPatientboard = null;
	}
    };

    var patientActivate = function(shadow) {
	if(currentMode != 'patient') {
	    debugLog("got patientActivate request when not in patient mode, this should not happen");
	    return; // this should not happen
	}

	if(myPatientboard === null) {
	    findPatientboard();
	}

	if(myPatientboard !== null) {
	    var listToActivate = [shadow];
	    
	    var s = shadow;
	    while(s.parent !== null && !s.parent.isActivated) {
		s = s.parent;
		listToActivate.push(s);
	    }

	    var idx = 0;
	    for(idx = 0; idx < listToActivate.length; idx++) {
		s = listToActivate[idx];
		if(s.type == 'ptc') {
		    var idx2 = 0;
		    for(idx2 = 0; idx2 < s.children.length; idx2++) {
			var ss = s.children[idx2];
			listToActivate.push(ss);
		    }
		}
	    }

	    idx = listToActivate.length - 1;
	    while(idx >= 0) {
		listToActivate[idx].isActivated = true;
		try {
		    myPatientboard.scope().activate(listToActivate[idx]);
		} catch (e) {
		    debugLog("patient activate threw an exception. " + e);
		}
		idx--;
	    }
	    updateShadings();
	} else {
	    $scope.openForm(Enum.aopForms.infoMsg, {title: 'No Patientboard', content: 'The event cannot be activated for the patient because the Patientboard Webble cannot be found. Try setting the "PatientboardName" slot value to the "Display Name" of the Patient board Webble if one is already loaded. Otherwise, try loading a Patientboard Webble.'});

	}
    };
    
    var updateShadingsOne = function(shadow, deadPath) {
	var i;
	var ios;
	var io;

	if(shadow === null || shadow.webble === null) {
	    // debugLog("updateShadingsOne cannot do anything with null");
	    return;
	}
	
	var webble = shadow.webble;
	if(webble !== null) {
	    if(deadPath) {
		setShadeOut(shadow, webble, true, 'black');
		
		ios = webble.scope().theInteractionObjects;
		for(i = 0; i < ios.length; i++){
		    io = ios[i];
		    if(io.scope().getName() == 'patActivate'){
			io.scope().setIsEnabled(false);
		    }
		}

		webble.scope().addPopupMenuItemDisabled('patActivate');
		
		for(i = 0; i < shadow.children.length; i++) {
		    updateShadingsOne(shadow.children[i], true);
		}
	    } else {
		if(shadow.isActivated) {
		    setShadeOut(shadow, shadow.webble, false, 'red');

		    ios = webble.scope().theInteractionObjects;
		    for(i = 0; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'patActivate'){
			    io.scope().setIsEnabled(false);
			}
		    }
		    
		    webble.scope().addPopupMenuItemDisabled('patActivate');

		    var atLeastOneChildActivated = false;
		    for(i = 0; i < shadow.children.length; i++) {
			if(shadow.children[i].isActivated) {
			    atLeastOneChildActivated = true;
			}
		    }

		    for(i = 0; i < shadow.children.length; i++) {
			if(shadow.children[i].isActivated) {
			    updateShadingsOne(shadow.children[i], false);
			} else {
			    updateShadingsOne(shadow.children[i], atLeastOneChildActivated);
			}
		    }

		} else { // not activated
		    setShadeOut(shadow, shadow.webble, true, 'white');
		    
		    ios = webble.scope().theInteractionObjects;
		    for(i = 0; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'patActivate'){
			    io.scope().setIsEnabled(true);
			}
		    }
		    
		    webble.scope().removePopupMenuItemDisabled('patActivate');

		    for(i = 0; i < shadow.children.length; i++) {
			updateShadingsOne(shadow.children[i], false);
		    }
		}
	    }
	}
    };

    var updateShadings = function() {
	var i;
	var ios;
	var io;

	if(currentRoot !== null) {
	    updateShadingsOne(currentRoot, false);
	}
	
	for(i = 0; i < listOfExceptionalEvents.length; i++) {
	    // debugLog("updateShadings, exceptional event with children: " + i);
	    var shadow = listOfExceptionalEvents[i];
	    var webble = shadow.webble;
	    
	    if(webble !== null) {
		if(shadow.isActivated) {
		    setShadeOut(shadow, shadow.webble, false, 'white');
		} else {
		    setShadeOut(shadow, shadow.webble, true, 'white');
		}
		
		ios = webble.scope().theInteractionObjects;
		for(i = 0; i < ios.length; i++){
		    io = ios[i];
		    if(io.scope().getName() == 'patActivate'){
			io.scope().setIsEnabled(true);
		    }
		}
		
		webble.scope().removePopupMenuItemDisabled('patActivate');
	    }

	    // there should not be any children
	    for(var j = 0; j < shadow.children.length; j++) {
		debugLog("updateShadings, exceptional event with children: " + j);
		updateShadingsOne(shadow.children[j], false);
	    }
	}
    };

    var isAlwaysExceptional = function(shadow) {
	switch(shadow.type) {
	case 'surga':
	    return true;
	    
	case 'surgc':
	    return true;
	    
	case 'saesusar':
	    return true;
	    
	case 'rep':
	    return true;
	}
	return false;
    };
    
    var canBeExceptional = function(shadow) {
	switch(shadow.type) {
	case 'surga':
	    return true;
	    
	case 'surgc':
	    return true;
	    
	case 'saesusar':
	    return true;
	    
	case 'rep':
	    return true;
	    
	case 'com':
	    return true;
	    
	case 'pat':
	    return true;
	    
	case 'cons':
	    return true;
	    
	case 'biop':
	    return true;
	    
	case 'blood':
	    return true;
	    
	case 'imag':
	    return true;
	}
	return false;
    };

    var checkMovedWebble = function(shadow, x, y) {
	//	debugLog("check move " + shadow.type + " " + x + "," + y + "   " + shadow.left + "," + shadow.top);

	if(Math.abs(shadow.left + shadow.offsetUnits * scaleFactor - x) < 1 && Math.abs(shadow.top - y) < 1) {
	    //            debugLog("check move " + shadow.type + "." + shadow.id + " already in place");
            return;
	}

	// if(isNaN(x) || isNaN(y)) {		    
	//     x = parseInt(shadow.webble.scope().gimme("root:left"));
	//     y = parseInt(shadow.webble.scope().gimme("root:top"));
	//     debugLog("child pos contained NaN, " + x + ", " + y);
	// }
	
	var bestParent = null;
    	var bestDist = (x - leftSpace) * (x - leftSpace) + (y - topSpace) * (y - topSpace);
    	var bestChildPos = 0;
	
	// debugLog("checkMovedWebble, " + x + ", " + y + ", " + bestDist + "(root)");

	if(isNaN(x) || isNaN(y)) {		    
	    bestParent = shadow; // put it back
	} else {
	    treeLocationCheckLoopStopper = {};
	    
    	    ls = treeLocationCheck(currentRoot, bestParent, bestDist, bestChildPos, x, y);
    	    bestParent = ls[0];
    	    bestDist = ls[1];
    	    bestChildPos = ls[2];
	}
	
	var putBack = true;
	if(bestParent === null) {
            if(shadow.parent === null) {
                putBack = true;
            } else {
		putBack = false;
            }
	} else if((shadow.isBranch && shadow.children.length > 1) // moving branches is not allowed for now
		  // || (bestParent === null && shadow.parent === null)
		  || bestParent == shadow // we should be behind ourselves, do nothing
		  || (bestParent == shadow.parent && bestChildPos <  bestParent.children.length && bestParent.children[bestChildPos] == shadow) // we should be in the same spot, do nothing
		  || (bestParent == shadow.parent && shadow.children.length < 1 && bestChildPos >= bestParent.children.length) // we should move from one branch to another branch, but our branch will be empty when we leave and we move to an empty one
		 ) {
	    putBack = true;
	} else {
	    putBack = false;
	}
	
	if(putBack) {
	    //	    debugLog("check move put back " + shadow.type + "." + shadow.id + " to " + (shadow.left + shadow.offsetUnits * scaleFactor) + "," + shadow.top);

            // shadow.webble.scope().set('root:top', shadow.top + "px");
	    // shadow.webble.scope().set('root:left', (shadow.left + shadow.offsetUnits * scaleFactor) + "px");

	    shadow.webble.scope().silentMove((shadow.left + shadow.offsetUnits * scaleFactor), shadow.top);
	    

	} else {
	    if(bestParent == shadow.parent && bestParent !== null && bestParent.isBranch && shadow.children.length == 0) {
		// need to take care with the branches here
 		// debugLog("check move difficult CASE " + shadow.type + "." + shadow.id);
		// debugLog("check move put back " + shadow.type + "." + shadow.id + " to " + (shadow.left + shadow.offsetUnits * scaleFactor) + "," + shadow.top);
		// shadow.webble.scope().set('root:top', shadow.top + "px");
		// shadow.webble.scope().set('root:left', (shadow.left + shadow.offsetUnits * scaleFactor) + "px");
		shadow.webble.scope().silentMove((shadow.left + shadow.offsetUnits * scaleFactor), shadow.top);
	    }
	    else {
		
		removeEventFromTree(shadow);
		
		insertEventInTree(shadow, bestParent, bestChildPos);
		forceSlotSetForPositions = true;
		
	        updateLayout();
	    }
	}

    };

    var setArmOrder = function(shadow, state) {
	var webble = shadow.webble;
	if(webble !== null) {
	    var ios = webble.scope().theInteractionObjects;
	    for(var i = 0, io; i < ios.length; i++){
		io = ios[i];

		if(io.scope().getName() == 'armOrder'){
		    io.scope().setIsEnabled(state);
		}
	    }
        }	
    };
    
    var childSlotChange = function(shadow, slotPackage) {
        var x = 0;
        var y = 0;
        var units = 0;
	var i = 0;
        
	if(slotPackage.hasOwnProperty('OffsetNoofUnits')) {
	    units = slotPackage.OffsetNoofUnits;
	    if(typeof(units) == 'string') {
		units = parseInt(units);
	    }
	    shadow.offsetUnits = units;
	    
	    updateLayout();
	    
	    delete slotPackage.OffsetNoofUnits;
	}
	
	if(slotPackage.hasOwnProperty('NoOfUnits')) {
	    if(shadow.type == 'rad' || shadow.type == 'chem' || shadow.type == 'sup') {
		units = slotPackage.NoOfUnits;
		if(typeof(units) == 'string') {
		    units = parseInt(units);
		}
		shadow.w = scaleFactor*units;
		shadow.d = units;
		
		for(i = 0; i < shadow.offsets.length; i++) {
		    shadow.offsets[i][0] = shadow.w + 1;
		}
		updateLayout();

		if(shadow.microEvents.length > 0 || shadow.d > 1) {
		    shadow.webble.scope().removePopupMenuItemDisabled('microEvents');
		} else {
		    shadow.webble.scope().addPopupMenuItemDisabled('microEvents');
		}
		
		for(var eidx = 0; eidx < shadow.microEvents.length; eidx++) {
		    if(shadow.microEvents[eidx].day > shadow.d) {
			shadow.microEvents[eidx].day = shadow.d;
		    }
		}
		shadow.webble.scope().set("MicroEvents", shadow.microEvents);

	    }
	    delete slotPackage.NoOfUnits;
	}

	if(slotPackage.hasOwnProperty('pos')) {
	    // debugLog("tellParent found pos");
            
	    if(!shadow.isCurrentlyExceptional) {
		x = slotPackage.pos[0];
		y = slotPackage.pos[1];

		if(slotPackage.hasOwnProperty('ignoreIfPosIs')) {
		    ignoreIfx = slotPackage.ignoreIfPosIs[0];
		    ignoreIfy = slotPackage.ignoreIfPosIs[1];
		    
		    if(x != ignoreIfx || y != ignoreIfy) {
			// debugLog("Check pos change because it is different than what I expected, " + x + ", " + y + " instead of " + ignoreIfx +", " + ignoreIfy);
			checkMovedWebble(shadow, x, y);
		    } else {
			// debugLog("Ignore pos change because it was my request");
		    }
		} else {
		    // debugLog("Check pos change");
		    checkMovedWebble(shadow, x, y);
		}
	    } else {
		// debugLog("Ignore pos change of exceptional");
	    }
	    
	    if(slotPackage.hasOwnProperty('ignoreIfPosIs')) {
		delete slotPackage.ignoreIfPosIs;
	    }

            delete slotPackage.pos;
	}

	if(slotPackage.hasOwnProperty('root:top')) {
	    y = parseInt(slotPackage['root:top']);
	    if(Math.abs(y - shadow.top) > 1) {
		//	        debugLog("slot change root:top " + shadow.top + "->" + y);
		x = parseInt(shadow.webble.scope().gimme('root:left'));

		checkMovedWebble(shadow, x, y);
	    }
	    delete slotPackage['root:top'];
	}

	if(slotPackage.hasOwnProperty('root:left')) {
	    x = parseInt(slotPackage['root:left']);
	    var oldX = (shadow.left + shadow.offsetUnits*scaleFactor);
	    if(Math.abs(x - oldX) > 1) {
		//	        debugLog("slot change root:left " + oldX + "->" + x);
		y = parseInt(shadow.webble.scope().gimme('root:top'));
		
		checkMovedWebble(shadow, x, y);
	    }
	    delete slotPackage['root:left'];
	}


	if(slotPackage.hasOwnProperty('SubtreeDeletionRequest')) {
	    //	    debugLog("got SubtreeDeletionRequest from child.");
	    
	    removeSubtree(shadow);

	    updateLayout();

	    delete slotPackage.SubtreeDeletionRequest;
	}

	if(slotPackage.hasOwnProperty('DeletionRequest')) {
	    //	    debugLog("got DeletionRequest from child.");
	    
	    if(shadow.isBranch && shadow.children.length > 1) {
	        // do nothing
		$scope.openForm(Enum.aopForms.infoMsg, {title: 'Deletion Not Possible', content: 'This event cannot be deleted because it is a branching event with more than one child. It is not clear where the children of this event should be put. Try moving or deleting children first, until there is only one branch.'});

	    } else {


		for(var i = 0; i < listOfExceptionalEvents.length; i++) {
		    if(listOfExceptionalEvents[i] == shadow) {
			listOfExceptionalEvents.splice(i, 1);
			break;
		    }
		}

	        removeEventFromTree(shadow);

	        // listOfAllChildren[shadow.id] = null;
		// shadow.sentinel(); // this should remove watches we have on the child
		// deleteOneWebble(shadow);
	        
		deleteOneWebble(shadow);

	        updateLayout();
	    }
	    
	    delete slotPackage.DeletionRequest;
	}

	var duplicate = false;
	var duplicateSubtree = false;
	if(slotPackage.hasOwnProperty('SubtreeDuplicationRequest')) {
	    //	    debugLog("got SubtreeDuplicationRequest from child.");

	    duplicate = true;
	    duplicateSubtree = true;

	    delete slotPackage.SubtreeDuplicationRequest;
	}

	if(slotPackage.hasOwnProperty('DuplicationRequest')) {
	    //	    debugLog("got DuplicationRequest from child.");

	    duplicate = true;
	    duplicateSubtree = false;

	    delete slotPackage.DuplicationRequest;
	}

	if(duplicate) {
	    var closestBranch = null;
	    var node = shadow.parent;
	    while(node !== null) {
		if(node.isBranch) {
		    closestBranch = node;
		    break;
		}
		node = node.parent;
	    }
	    
	    if(closestBranch === null) {
	        // do nothing, no fork to attach a new branch to
		$scope.openForm(Enum.aopForms.infoMsg, {title: 'Duplication Not Possible', content: 'This event cannot be duplicated because there is no branching event ahead of it in the flow to attach a new branch to. Duplication is only possible after at least one registration/randomization/stratification has been added.'});

	    } else {
		printTree(currentRoot);
		duplicateEvent(shadow, closestBranch, duplicateSubtree);
		
		duplicateWebbles(shadow, duplicateSubtree);
	    }
	}
	
	// if(slotPackage.hasOwnProperty('SubtreeSelectionRequest')) {
	//     debugLog("got SubtreeSelectionRequest from child.");
	//     delete slotPackage.SubtreeSelectionRequest;
	// }

	if(slotPackage.hasOwnProperty('ArmOrderChangeRequest')) {
	    //	    debugLog("got ArmOrderChangeRequest from child.");
	    delete slotPackage.ArmOrderChangeRequest;

	    if(shadow.parent !== null && shadow.parent.isBranch && shadow.parent.children.length > 1) {
		var idx = 0;
		for(idx = 0; idx < shadow.parent.children.length; idx++) {
		    if(shadow.parent.children[idx] == shadow) {
			if(idx < shadow.parent.children.length - 1) {
			    shadow.parent.children[idx] = shadow.parent.children[idx+1];
			    shadow.parent.children[idx+1] = shadow;
			} else { //  last child
			    shadow.parent.children.splice(idx,1);
			    shadow.parent.children.splice(0, 0, shadow);			    
			}
    			updateLayout();		
			break;
		    }
		}
	    }
	}

	if(slotPackage.hasOwnProperty('PatientActivateRequest')) {
	    // debugLog("got PatientActivateRequest from child.");
	    delete slotPackage.PatientActivateRequest;

	    patientActivate(shadow);
	}

	if(slotPackage.hasOwnProperty('AssignStartEndDatesRequest')) {
	    //	    debugLog("got AssignStartEndDatesRequest from child.");
	    delete slotPackage.AssignStartEndDatesRequest;

	    var availableCRFlist = getAvailableCRFs();
	    
	    var notFound = false;

	    var myQList = [];

	    for(var i = 0; i < shadow.crfs.length; i++) {
		var id = shadow.crfs[i];

		//		debugLog("check assigned CRF " + id);

		notFound = true;
		for(var j = 0; j < availableCRFlist.length; j++) {
		    //		    debugLog("check against available CRF " + availableCRFlist[j].id);

		    if(availableCRFlist[j].id == id) {
			var crf = availableCRFlist[j];

			//			debugLog("available CRF " + availableCRFlist[j].id + " has " + crf.content.length + " questions");

			for(var qq = 0; qq < crf.content.length; qq++) {
			    var q = crf.content[qq];
			    //			    debugLog("check content " + availableCRFlist[j].id + " " + q.pos + " " + q.question + " " + q.type);

			    if(q.type == "Date") {
				var isStart = false;
				if(shadow.startDate.crf == id && shadow.startDate.q == q.pos) {
				    isStart = true;
				}
				var isEnd = false;
				if(shadow.endDate.crf == id && shadow.endDate.q == q.pos) {
				    isEnd = true;
				}
				
				myQList.push({crfid:crf.id, crfname:crf.name, question:q.question, pos:q.pos, 'isStart': isStart, 'isEnd': isEnd });
			    }
			}

			notFound = false;
			break;
		    }
		}
		if(notFound) {
		    debugLog("ERROR in Attach CRF call. Event has CRF with ID " + id + ", but no such CRF is available in this trial.");
		}
	    }

	    if(myQList.length <= 0) {
		for(var i = 0; i < shadow.crfs.length; i++) {
		    var id = shadow.crfs[i];
		    
		    notFound = true;
		    for(var j = 0; j < availableCRFlist.length; j++) {
			if(availableCRFlist[j].id == id) {
			    var crf = availableCRFlist[j];
			    for(var qq = 0; qq < crf.content.length; qq++) {
				var q = crf.content[qq];

				var isStart = false;
				if(shadow.startDate.crf == id && shadow.startDate.q == q.pos) {
				    isStart = true;
				}
				var isEnd = false;
				if(shadow.endDate.crf == id && shadow.endDate.q == q.pos) {
				    isEnd = true;
				}
				
				myQList.push({crfid:crf.id, crfname:crf.name, question:q.question, pos:q.pos, 'isStart': isStart, 'isEnd': isEnd });
			    }
			    
			    notFound = false;
			    break;
			}
		    }
		    if(notFound) {
			debugLog("ERROR in Attach CRF call. Event has CRF with ID " + id + ", but no such CRF is available in this trial.");
		    }
		}
	    }

	    if(myQList.length >= 1) {
		$scope.openForm('assignStartAndEndDatesForm', [{templateUrl: 'assignStartAndEndDatesForm.html', controller: 'assignStartAndEndDatesForm_Ctrl', size: 'lg'}, {wblScope: $scope, qList: myQList, eventShadow: shadow}], closeAssignStartAndEndDatesForm);
	    } else {
		$scope.openForm(Enum.aopForms.infoMsg, {title: 'No CRF Questions', content: 'Start and End dates cannot be assigned for this event because the CRFs assigned to this event do not contain any questions. Try adding another CRF.'});
	    }
	}

	if(slotPackage.hasOwnProperty('microEvents')) {
	    //	    debugLog("got MicroEvent request from child.");
	    delete slotPackage.microEvents;
	    
	    var availableCRFlist = getAvailableCRFs();
	    var crfList = [{id:null, name: ''}];
	    for(var crfIdx = 0; crfIdx < availableCRFlist.length; crfIdx++) {
		crfList.push(availableCRFlist[crfIdx]);
	    }

	    var newList = [];
	    for(var listIdx = 0; listIdx < shadow.microEvents.length; listIdx++) {
		newList.push({id: shadow.microEvents[listIdx].id, crf: shadow.microEvents[listIdx].crf, day: shadow.microEvents[listIdx].day});
	    }
	    
	    $scope.openForm('microEventForm', [{templateUrl: 'microEventForm.html', controller: 'microEventForm_Ctrl', size: 'lg'}, {wblScope: $scope, crfList: crfList, microEventList:  newList, eventShadow: shadow}], closeMicroEventForm);
	    
	    //	    $scope.openForm(Enum.aopForms.infoMsg, {title: 'MicroEvents', content: 'This is a place holder for the MicroEvents popup.'});
	}

	if(slotPackage.hasOwnProperty('CRFConnectRequest')) {
	    //	    debugLog("got CRFConnectRequest from child.");
	    delete slotPackage.CRFConnectRequest;
	    
	    var availableCRFlist = getAvailableCRFs();
	    var notFound = false;

	    for(var i = 0; i < shadow.crfs.length; i++) {
		var id = shadow.crfs[i];

		notFound = true;
		for(var j = 0; j < availableCRFlist.length; j++) {
		    if(availableCRFlist[j].id == id) {
			availableCRFlist[j].selected = true;
			notFound = false;
			break;
		    }
		}
		if(notFound) {
		    debugLog("ERROR in Attach CRF call. Event has CRF with ID " + id + ", but no such CRF is available in this trial.");
		}
	    }

            $scope.openForm('attachCRFForm', [{templateUrl: 'attachCRFform.html', controller: 'attachCRFform_Ctrl', size: 'lg'}, {wblScope: $scope, crfList: availableCRFlist, eventShadow: shadow}], closeAttachCRFForm);
	}

	// if(slotPackage.hasOwnProperty('CRFOpenRequest')) {
	//     debugLog("got CRFOpenRequest from child.");
	//     delete slotPackage.CRFOpenRequest;

	//     $scope.openForm(Enum.aopForms.infoMsg, {title: 'Open CRF', content:
	// 					    'This should show you the Open CRF form.<br>Which is not finished yet...'}
	// 		   );
	// }


	if(slotPackage.hasOwnProperty('ShiftDroppedNotification')) {
	    debugLog("got ShiftDroppedNotification from child.");
	    delete slotPackage.ShiftDroppedNotification;
	}

	if(slotPackage.hasOwnProperty('MovingRestrictedNotifiation')) {
	    debugLog("got MovingRestrictedNotifiation from child.");
	    delete slotPackage.MovingRestrictedNotifiation;
	}

	if(slotPackage.hasOwnProperty('DroppedNotification')) {
	    debugLog("got DroppedNotification from child.");
	    delete slotPackage.DroppedNotification;
	}

	if(slotPackage.hasOwnProperty('LabelAndTextDirty')) {
	    // call database
	    saveTrial();
	    delete slotPackage.LabelAndTextDirty;
	}

	if(slotPackage.hasOwnProperty('IsMandatory')) {
	    // call database
	    saveTrial();
	    delete slotPackage.IsMandatory;
	}

	saveTrial();
    };

    var closeMicroEventForm = function(returnContent) {
	//        debugLog("CloseMicroEventForm called.");
        if(returnContent !== null && returnContent !== undefined){
	    var shadow = returnContent.eventShadow;
	    var microEventList = returnContent.microEventList;
	    
	    var newList = [];

	    for(var i = 0; i < microEventList.length; i++) {
		newList.push(microEventList[i]);
		if(newList[i].day > shadow.d) {
		    newList[i].day = shadow.d;
		}
		if(newList[i].day < 1) {
		    newList[i].day = 1;
		}
	    }
	    
	    shadow.microEvents = newList;
	    if(shadow.webble !== null) {
		shadow.webble.scope().set("MicroEvents", shadow.microEvents);
	    }

	    saveTrial();
	}
    };

    var closeAttachCRFForm = function(returnContent){
        if(returnContent !== null && returnContent !== undefined){
	    var crfList = returnContent.crfList;
	    var shadow = returnContent.eventShadow;
	    
	    var newCrfs = [];

	    for(var i = 0; i < crfList.length; i++) {
		var crf = crfList[i];
		if(crf.selected) {
		    newCrfs.push(crf.id);
		}
	    }
	    
	    shadow.crfs = newCrfs;

	    var foundStart = false;
	    var foundEnd = false;
	    
	    for(var i = 0; i < shadow.crfs.length; i++) {
		//		debugLog("check " + shadow.crfs[i] + " to see if startDate " + shadow.startDate.crf + " is OK");
		if(shadow.startDate.crf !== null && shadow.startDate.crf == shadow.crfs[i]) {
		    foundStart = true;
		}
		//		debugLog("check " + shadow.crfs[i] + " to see if endDate " + shadow.endDate.crf + " is OK");
		if(shadow.endDate.crf !== null && shadow.endDate.crf == shadow.crfs[i]) {
		    foundEnd = true;
		}
	    }

	    if(shadow.startDate.crf !== null && !foundStart) {
		//		debugLog("CloseAttachCRFForm remove Start Date.");
		shadow.startDate.crf = null;
		shadow.startDate.q = null;
	    }

	    if(shadow.endDate.crf !== null && !foundEnd) {
		//		debugLog("CloseAttachCRFForm remove End Date.");
		shadow.endDate.crf = null;
		shadow.endDate.q = null;
	    }

	    if(shadow.crfs.length > 0) {
		shadow.webble.scope().removePopupMenuItemDisabled('assignStartEnd')
	    } else {
		shadow.webble.scope().addPopupMenuItemDisabled('assignStartEnd')
	    }

	    setShadeOutAuto(shadow, shadow.webble);

	    saveTrial();
        } else {
	    //            debugLog("CloseAttachCRFForm got no result.");
        }
    };


    var closeAssignStartAndEndDatesForm = function(returnContent){
        if(returnContent !== null && returnContent !== undefined){
	    //            debugLog("closeAssignStartAndEndDatesForm got a result.");
	    var myQList = returnContent.qList;
	    var shadow = returnContent.eventShadow;
	    
	    var setStart = false;
	    var setEnd = false;

	    for(var i = 0; i < myQList.length; i++) {
		var t = myQList[i];
		
		if(!setStart && t.isStart) {
		    setStart = true;
		    shadow.startDate.crf = t.crfid;
		    shadow.startDate.q = t.pos;
		}

		if(!setEnd && t.isEnd) {
		    setEnd = true;
		    shadow.endDate.crf = t.crfid;
		    shadow.endDate.q = t.pos;
		}
	    }
	    
	    if(!setStart) {
		shadow.startDate.crf = null;
		shadow.startDate.q = null;
	    }

	    if(!setEnd) {
		shadow.endDate.crf = null;
		shadow.endDate.q = null;
	    }

	    setShadeOutAuto(shadow, shadow.webble);

	    saveTrial();
        } else {
	    //            debugLog("closeAssignStartAndEndDatesForm got no result.");
        }
    };


    var printTreeLoopStopper = {};
    var printTree = function(root) {
        printTreeLoopStopper = {};
        printTreeSafe(root);
    };
    
    var printTreeSafe = function(root) {
    	if(root === null) {
    	    debugLog("null");
    	} else if(typeof root === 'undefined') {
	    debugLog("undefined");
	}
    	else
    	{
    	    if(printTreeLoopStopper[root.id]) {
    	        debugLog("printTree: There is a LOOP in the tree!");
    	        return;
    	    }
    	    printTreeLoopStopper[root.id] = true;
    	    
    	    var s = "";

    	    var i = 0;
    	    for(i = 0; i < root.offsets.length; i++) {
    		s += "(" + root.offsets[i][0].toString() + "," + root.offsets[i][1] + ") ";
    	    }

            s += ", children: [";
    	    for(i = 0; i < root.children.length; i++) {
    	        if(root.children[i] === null){
    	            s+= "null ";
		}else if(typeof root.children[i] === 'undefined'){
    	            s+= "undefined ";		    
    	        } else {
    		    s += root.children[i].type + "." + root.children[i].id + " ";
    	        }
    	    }
    	    s += "]";
    	    
	    if(root.parent === null) {
		s += ", parent = null ";
	    } else if(typeof root.parent === 'undefined') {
		s += ", parent = undefined ";
	    } else {
		s += ", parent = " + root.parent.type + "." + root.parent.id;
	    }

	    s += ", webble = " + root.webble;

    	    debugLog(root.type + "." + root.id + " (" + root.left + "," + root.top + ") days " + root.d + ", totH " + root.totalH + ", " + s);

    	    for(i = 0; i < root.children.length; i++) {
    		printTreeSafe(root.children[i]);
    	    }
    	}
    };

    var insertEventInTree = function (shadow, parent, childPos) {
    	// if(parent !== null) {
    	//     debugLog("insertEventInTree parent " + parent.type + " " + parent.id + ", childPos " + childPos);
    	// } else{
    	//     debugLog("insertEventInTree parent null, childPos " + childPos);
    	// }
	
	var child = null;
	var margin = 1;
	
    	if(parent === null) {
    	    // assign parent

    	    shadow.parent = null;

    	    // assign children to ourselves, and make us their parent
    	    
    	    if(currentRoot !== null) {
                shadow.children = [currentRoot];
    	        currentRoot.parent = shadow;
		
		
    		if(shadow.isBranch) {
    		    child = currentRoot;
		    margin = 1;
		    
		    if(shadow.type == 'ptc') {
			margin = ptcMargin;
		    } else {
			margin = branchMargin;
		    }
    		    shadow.offsets[shadow.offsets.length] = [shadow.w, child.totalH + margin];
    		}
            }
    	    currentRoot = shadow;
    	} else {
    	    // assign parent
    	    shadow.parent = parent;

    	    // assign children to ourselves, and make us their parent

    	    if(childPos < parent.children.length) {
    		child = parent.children[childPos];
    		child.parent = shadow;
		
    		shadow.children[shadow.children.length] = child;
		
    		// add extra node to attach to to ourselves if necesary
		
    		if(shadow.isBranch) {
		    margin = 1;
		    
		    if(shadow.type == 'ptc') {
			margin = ptcMargin;
		    } else {
			margin = branchMargin;
		    }
    		    shadow.offsets[shadow.offsets.length] = [shadow.w, child.totalH + margin];
    		}
    	    }

    	    parent.children[childPos] = shadow;

    	    // add extra node to attach to to parent if necesary

    	    if(parent.isBranch) {
    		if(parent.children.length >= parent.offsets.length) {
    		    parent.offsets[parent.offsets.length] = [parent.w, 0];
    		}
    	    }
	}
	//	debugLog("------------------ insert finished: ")
	printTree(currentRoot);
    };

    var duplicateWebbles = function (shadow, duplicateSubtree) {
	// set X och Y to something reasonable instead, and have AddEvent work as normal?

	var prot = shadow.webble.scope().getProtection();
	prot = prot & ~Enum.bitFlags_WebbleProtection.DUPLICATE; // clear the protection flag
	shadow.webble.scope().setProtection(prot);

	shadow.webble.scope().duplicate({x: 15, y: 15}, undefined);

	prot = prot | Enum.bitFlags_WebbleProtection.DUPLICATE; // set the protection flag again
	shadow.webble.scope().setProtection(prot);

	
	if(duplicateSubtree) {
	    var i = 0;
	    for(i = 0; i < shadow.children.length; i++) {
		duplicateWebbles(shadow.children[i], duplicateSubtree);
	    }
	}
    };

    var removeSubtree = function (shadow) {
	//    	debugLog("removeSubtree " + shadow.type + " " + shadow.id);

	// delete the Webbles

	deleteSubtreeWebbles(shadow, currentRoot);

	for(var i = 0; i < listOfExceptionalEvents.length; i++) {
	    if(listOfExceptionalEvents[i] == shadow) {
		listOfExceptionalEvents.splice(i, 1);
		deleteOneWebble(shadow);
		break;
	    }
	}

	// remove the nodes from our internal tree
	
	shadow.children = [];
	removeEventFromTree(shadow);
    };

    var deleteSubtreeWebbles = function (shadow) {
	var i = 0;

	for(i = 0; i < shadow.children.length; i++) {
	    deleteSubtreeWebbles(shadow.children[i]);
	}

	deleteOneWebble(shadow);
    };

    var deleteOneWebble = function(shadow) {
	if(shadow.sentinel !== null) {
	    shadow.sentinel();
	}
	listOfAllChildren[shadow.id] = null;

	var prot = shadow.webble.scope().getProtection();
	prot = prot & ~Enum.bitFlags_WebbleProtection.DELETE; // clear the protection flag
	prot = prot & ~Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;; // clear the protection flag
	shadow.webble.scope().setProtection(prot);

	// $scope.requestDeleteWebble(shadow.webble);
	$scope.requestDeleteWebble(shadow.webble, null);
    };

    var removeEventFromTree = function (shadow) {
	//    	debugLog("removeEventFromTree " + shadow.type + " " + shadow.id);
	node = currentRoot;
	
	if(shadow == currentRoot) {
	    if(shadow.children.length > 0) {
		// if we have more than one child, this will blow up
		currentRoot = shadow.children[0];
		currentRoot.parent = null;
		shadow.children = [];
	    } else {
		currentRoot = null;
	    }	   
	} else {
	    removeEventFromInsideOfTree(shadow, currentRoot);
	}
    };

    var removeEventFromInsideOfTree = function (shadow, node) {
	var i = 0;
	if(shadow.parent == node) {

	    for(i = 0; i < node.children.length; i++) {
		if(node.children[i] == shadow) {
		    if(shadow.children.length > 0) {
			// if we have more than one child, this will blow up
			node.children[i] = shadow.children[0];
			shadow.children[0].parent = node;
		    } else {
			// if parent is branch, we may need to remove one branch
			if(node.isBranch) {
			    node.children.splice(i, 1);
			    if(node.children.length + 1 < node.offsets.length) {
				node.offsets.splice(node.children.length + 1, 1);
			    }
			} else {
			    node.children = [];
			}
		    }
		    break;
		}
	    }
	    shadow.children = [];
	    shadow.parent = null;
	} else {
	    for(i = 0; i < node.children.length; i++) {
		removeEventFromInsideOfTree(shadow, node.children[i]); // could make this more efficient by not continuing if we already found the shadow in one subtree
	    }
	}
    };

    var thisIsADuplicateIWant = function(webble, node) {
    	if(node === null) {
	    return false;
	}
        
    	if(node.webble === null) {
	    //    	    debugLog("check against " + node.type + "." + node.id);
    	    
	    var eventType = webble.scope().gimme('MedEventType');
	    var units = webble.scope().gimme('NoOfUnits');
	    var offsetUnits = webble.scope().gimme('OffsetNoofUnits');

	    if(node.isBranch) {
		//    		debugLog(node.type + "." + node.id + " has no webble! " + eventType + " " + units + " " + offsetUnits + " vs. " + node.type + " " + node.h + " " + node.offsetUnits);
		if(eventType == node.type
		   // && units == node.h
		   && offsetUnits == node.offsetUnits) {
		    //		    debugLog("FOUND a fitting webble " + node.type + "." + node.id);
    	            return true;
		}
	    } else {
		//    		debugLog(node.type + "." + node.id + " has no webble! " + eventType + " " + units + " " + offsetUnits + " vs. " + node.type + " " + node.d + " " + node.offsetUnits);
		if(eventType == node.type
		   && units == node.d
		   && offsetUnits == node.offsetUnits) {
		    //		    debugLog("FOUND a fitting webble " + node.type + "." + node.id);
    	            return true;
		}	    
	    }
	}

	var i = 0;
	for(i = 0; i < node.children.length; i++) {
	    var res = thisIsADuplicateIWant(webble, node.children[i]);
	    //	    debugLog("checked child " + i + ", it was " + res);
	    if(res) {
		return res;
	    }
	}
	return false;
    };

    var thisIsADuplicateWeAlreadyAdded = function(webble, node) {
	//	debugLog("thisIsADuplicateWeAlreadyAdded");

    	if(node === null) {
	    return false;
	}
        
	//    	debugLog("check against " + node.type + "." + node.id);
    	if(node.webble === webble) {
	    //    	    debugLog("check against " + node.type + "." + node.id + " was a match!");
    	    return true;
	}

	var i = 0;
	for(i = 0; i < node.children.length; i++) {
	    var res = thisIsADuplicateWeAlreadyAdded(webble, node.children[i]);
	    if(res) {
		return res;
	    }
	}
	return false;
    };

    var findShadowForAlreadyAddedWebble = function(webble, node) {
	if(node === null) {
	    return null;
	}

	if(node.webble === webble) {
	    return node;
	}

	var i = 0;
	for(i = 0; i < node.children.length; i++) {
	    var res = findShadowForAlreadyAddedWebble(webble, node.children[i]);
	    if(res !== null) {
		return res;
	    }
	}
	return null;
    };


    var findShadowForWebble = function(webble, node) {
	//	debugLog("findShadowForWebble ");

	if(node === null) {
	    return null;
	}

	if(node.webble === null) {
	    var eventType = webble.scope().gimme('MedEventType');
	    var units = webble.scope().gimme('NoOfUnits');
	    var offsetUnits = webble.scope().gimme('OffsetNoofUnits');


	    if(node.isBranch) {
		//    		debugLog(node.type + "." + node.id + " has no webble! " + eventType + " " + units + " " + offsetUnits + " vs. " + node.type + " " + node.h + " " + node.offsetUnits);
		if(eventType == node.type
		   // && units == node.h
		   && offsetUnits == node.offsetUnits) {
		    //		    debugLog("FOUND a fitting webble " + node.type + "." + node.id);
    	            return node;
		}
	    } else {
		//    		debugLog(node.type + "." + node.id + " has no webble! " + eventType + " " + units + " " + offsetUnits + " vs. " + node.type + " " + node.d + " " + node.offsetUnits);
		if(eventType == node.type
		   && units == node.d
		   && offsetUnits == node.offsetUnits) {
		    //		    debugLog("FOUND a fitting webble " + node.type + "." + node.id);
    	            return node;
		}	    
	    }
	}

	var i = 0;
	for(i = 0; i < node.children.length; i++) {
	    var res = findShadowForWebble(webble, node.children[i]);
	    if(res !== null) {
		return res;
	    }
	}
	return null;
    };

    var duplicateEventHasArrived = function(webble) {
    	var shadow = findShadowForWebble(webble, currentRoot);
	
    	if(shadow !== null) {
    	    
    	    shadow.webble = webble;

    	    webble.scope().set("root:top", shadow.top);
    	    webble.scope().set("root:left", shadow.left + shadow.offsetUnits * scaleFactor);

	    webble.scope().set("root:z-index", getZindexForTypeOfShadow(shadow));

	    setChildProtectionsAndMenuItems(shadow, webble);
	    setShadeOutAuto(shadow, webble);

	    webble.scope().paste(myParent); // assign to my parent
    	    
	    //    	    debugLog("Found a shadow that fits the newly created event");
    	}
    };


    var findShadowForDatabaseWebble = function() {
	var i = 0;
	for(i = 0; i < listOfExceptionalEvents.length; i++) {
	    if(listOfExceptionalEvents[i].webble === null) {
		return listOfExceptionalEvents[i];
	    }
	}
	
	return findShadowForDatabaseWebbleMainTree(currentRoot);
    };
    
    var findShadowForDatabaseWebbleMainTree = function(node) {
	if(node === null) {
	    return null;
	}

	if(node.webble === null) {
	    return node;
	}

	var i = 0;
	for(i = 0; i < node.children.length; i++) {
	    var res = findShadowForDatabaseWebbleMainTree(node.children[i]);
	    if(res !== null) {
		return res;
	    }
	}
	return null;
    };


    var databaseEventWebbleHasArrived = function(webble) {
	debugLog("databaseEventWebbleHasArrived");

    	var shadow = findShadowForDatabaseWebble();
	
    	if(shadow !== null) {
	    webble.scope().paste(myParent); // assign to my parent, this should be done before setting root:top and root:left

    	    shadow.webble = webble;

    	    webble.scope().set("root:top", shadow.top);
    	    webble.scope().set("root:left", shadow.left + shadow.offsetUnits * scaleFactor);

	    // debugLog("set child root:left to " + shadow.left + " + " + shadow.offsetUnits + " * " + scaleFactor);


	    webble.scope().set("root:z-index", getZindexForTypeOfShadow(shadow));

   	    webble.scope().set("LabelText", shadow.label.text);
    	    webble.scope().set("LabelColor", shadow.label.color);
    	    webble.scope().set("LabelPos", shadow.label.position);
    	    webble.scope().set("LabelShape", shadow.label.shape);

    	    webble.scope().set("IsMandatory", shadow.mandatory);

    	    webble.scope().set("TreatmentArmText", shadow.treatmentarmlabel);
    	    webble.scope().set("EventText", shadow.eventText);
    	    webble.scope().set("EventColor", shadow.eventColor);

    	    webble.scope().set("MedEventType", shadow.type);

    	    webble.scope().set("OffsetNoofUnits", shadow.offsetUnits);
	    if(shadow.isBranch) {
    		webble.scope().set("NoOfUnits", shadow.totalH);
	    } else {
    		webble.scope().set("NoOfUnits", shadow.d);
	    }

	    webble.scope().set("MicroEvents", shadow.microEvents);

	    setChildProtectionsAndMenuItems(shadow, webble);
	    setShadeOutAuto(shadow, webble);

	    debugLog("paste child on parent");

	    // debugLog("child has root:left == " + webble.scope().gimme("root:left"));

    	    // webble.scope().set("root:top", shadow.top);
    	    // webble.scope().set("root:left", shadow.left + shadow.offsetUnits * scaleFactor);
    	}
	
	var newWeAreLoadingATrial = false;
	for(var i = 0; i < listOfAllChildren.length; i++) {
	    shadow = listOfAllChildren[i];
	    if(shadow !== null && shadow.webble === null) {
		newWeAreLoadingATrial = true;
		break;
	    }
	}

	if(weAreLoadingATrial && !newWeAreLoadingATrial && dataToSendToPatientBoard !== null) {
	    if(myPatientboard === null) {
		findPatientboard();
	    }

	    if(myPatientboard !== null) {
		myPatientboard.scope().loadTrial(dataToSendToPatientBoard, currentRoot, listOfExceptionalEvents); // do we need to wait until we have our Webbles, so the patient board has something to duplicate?
		dataToSendToPatientBoard = null;
	    }
	}

	weAreLoadingATrial = newWeAreLoadingATrial;	

	debugLog("weAreLoadingATrial = " + weAreLoadingATrial);
    };


    var getZindexForTypeOfShadow = function(shadow) {
	return getZIndexForType(shadow.type);
    };

    var getZIndexForType = function(t) {
	switch(t) {
    	case 'none':
	    return 5;
    	    break;
	    
    	case 'undef':
	    return 5;
    	    break;


    	case 'rad':
	    return 10;
    	    break;
    	case 'chem':		    
	    return 10;
    	    break;
    	case 'sup':		    
	    return 10;
    	    break;


    	case 'com':
	    return 15;
    	    break;
    	case 'pat':		    
	    return 15;
    	    break;
    	case 'cons':
	    return 15;
    	    break;



    	case 'biop':
	    return 25;
    	    break;
    	case 'blood':		    
	    return 25;
    	    break;
    	case 'imag':		    
	    return 25;
    	    break;


    	case 'surg':		    
	    return 20;
    	    break;
    	case 'surga':		    
	    return 20;
    	    break;
    	case 'surgc':		    
	    return 20;
    	    break;

    	case 'reg':		    
	    return 8;
    	    break;
    	case 'stratif':		    
	    return 8;
    	    break;

    	case 'ptc':		    
	    return 8;
    	    break;

    	case 'rand':		    
	    return 8;
    	    break;



    	case 'rep':		    
	    return 16;
    	    break;

    	case 'saesusar':		    
	    return 17;
    	    break;
	    
    	}
	return 1;
    };
    
    var duplicateEvent = function(oldShadow, parent, duplicateAllChildrenToo) {
	//    	debugLog("duplicateEvent " + oldShadow + " " + parent);

    	var newShadow = { };
    	newShadow.webble = null;
	newShadow.sentinel = null;

	debugLog("duplicateEvent");

        newShadow.id = listOfAllChildren.length;
    	listOfAllChildren.push(newShadow);
	newShadow.dbId = null;

	newShadow.isActivated = false;

    	newShadow.w = oldShadow.w;
    	newShadow.h = oldShadow.h;
    	newShadow.d = oldShadow.d;
	
    	newShadow.offsetUnits = oldShadow.offsetUnits;

    	newShadow.offsets = [];
    	newShadow.offsets[0] = [oldShadow.offsets[0][0], oldShadow.offsets[0][1]];
    	newShadow.children = [];

    	newShadow.totalH = oldShadow.totalH;

    	newShadow.isBranch = oldShadow.isBranch;

    	newShadow.type = oldShadow.type;

	newShadow.isCurrentlyExceptional = oldShadow.isCurrentlyExceptional; // should always be false

	newShadow.startDate = {};
	newShadow.startDate.crf = oldShadow.startDate.crf;
	newShadow.startDate.q = oldShadow.startDate.q;

	newShadow.endDate = {};
	newShadow.endDate.crf = oldShadow.endDate.crf;
	newShadow.endDate.q = oldShadow.endDate.q;

	newShadow.crfs = [];
	var i = 0;
	for(i = 0; i < oldShadow.crfs.length; i++) {
	    newShadow.crfs.push(oldShadow.crfs[i]);
	}

	if(newShadow.webble !== null) {
	    if(newShadow.crfs.length > 0) {
		newShadow.webble.scope().removePopupMenuItemDisabled('assignStartEnd')
	    } else {
		newShadow.webble.scope().addPopupMenuItemDisabled('assignStartEnd')
	    }
	}


	newShadow.microEvents = [];
	if(oldShadow.microEvents.length > 0) {
	    for(i = 0; i < oldShadow.microEvents.length; i++) {
		newShadow.microEvents.push(oldShadow.microEvents[i]);
	    }
	}
	if(newShadow.webble !== null) {
	    newShadow.webble.scope().set("MicroEvents", newShadow.microEvents);
	}

        insertEventInTree(newShadow, parent, parent.offsets.length - 1);    

	if(duplicateAllChildrenToo) {
	    for(i = 0; i < oldShadow.children.length; i++) {
		duplicateEvent(oldShadow.children[i], newShadow, true);
	    }
	}

    	updateLayout();
    }

    var setShadeOutAuto = function(shadow, webble) {
	// debugLog("setShadeOutAuto");
	if(webble !== null) {
	    if(currentMode == 'design') {
		if(shadow.crfs.length <= 0) {
		    webble.scope().set('ShadeOutColor', 'red');
		    webble.scope().set('ShadeOutEnabled', true);
		} else if(shadow.startDate === null || shadow.startDate.crf === null || shadow.startDate.q === null
			  || shadow.endDate === null || shadow.endDate.crf === null || shadow.endDate.q === null) {
		    webble.scope().set('ShadeOutColor', 'purple');
		    webble.scope().set('ShadeOutEnabled', true);		
		} else {
		    webble.scope().set('ShadeOutColor', 'red');
		    webble.scope().set('ShadeOutEnabled', false);
		}		
	    } else if(currentMode == 'patient') {
		webble.scope().set('ShadeOutColor', 'black');
		webble.scope().set('ShadeOutColor', 'white');
		webble.scope().set('ShadeOutEnabled', false);
	    } else {
		webble.scope().set('ShadeOutColor', 'red');
		webble.scope().set('ShadeOutEnabled', false);
	    }
	}
    };

    var setShadeOut = function(shadow, webble, status, color) {
	if(webble !== null) {
	    webble.scope().set('ShadeOutColor', color);
	    webble.scope().set('ShadeOutEnabled', status);
	}
    };

    var setChildProtectionsAndMenuItems = function(shadow, webble) {
	if(webble !== null) {
	    webble.scope().set('root:opacity', 1);

	    var prot = webble.scope().getProtection();

	    //	    debugLog("Going to fix protections on webble " + shadow.id + " which is '" + prot + "' now");

	    prot = prot | Enum.bitFlags_WebbleProtection.CHILD_CONNECT;
	    prot = prot | Enum.bitFlags_WebbleProtection.DELETE;
	    prot = prot | Enum.bitFlags_WebbleProtection.PUBLISH;
	    prot = prot | Enum.bitFlags_WebbleProtection.DUPLICATE;
	    prot = prot | Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;
	    prot = prot | Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE;
	    // prot = prot | Enum.bitFlags_WebbleProtection.;

	    if(currentMode != 'design') {
		prot = prot | Enum.bitFlags_WebbleProtection.MOVE;
	    }

	    webble.scope().setProtection(prot);

	    webble.scope().set("autoSlotConnEnabled", false);
	    webble.scope().connectSlots('','', {send: false, receive: false});

	    var ios = webble.scope().theInteractionObjects;
	    for(var i = 0, io; i < ios.length; i++){
		io = ios[i];
		if(io.scope().getName() == 'Resize'){
                    io.scope().setIsEnabled(false);
		}
		if(io.scope().getName() == 'Rotate'){
                    io.scope().setIsEnabled(false);
		}
		if(io.scope().getName() == 'patActivate'){
		    if(currentMode == 'patient') {
			io.scope().setIsEnabled(true);
		    } else {
			io.scope().setIsEnabled(false);
		    }
		}
		if(io.scope().getName() == 'noofDays'){
		    if(currentMode == 'design' && (shadow.type == 'rad' || shadow.type == 'chem' || shadow.type == 'sup')) {
			io.scope().setIsEnabled(true);
		    } else {
			io.scope().setIsEnabled(false);
		    }
		}

		if(io.scope().getName() == 'armOrder'){
		    io.scope().setIsEnabled(false);
		}

            }

	    webble.scope().addPopupMenuItemDisabled('EditCustomMenuItems');
	    webble.scope().addPopupMenuItemDisabled('EditCustomInteractionObjects');
	    webble.scope().addPopupMenuItemDisabled('Bundle');
	    webble.scope().addPopupMenuItemDisabled('BringFwd');
	    webble.scope().addPopupMenuItemDisabled('ConnectSlots');
	    webble.scope().addPopupMenuItemDisabled('Protect');
	    webble.scope().addPopupMenuItemDisabled('AddCustomSlots');
	    webble.scope().addPopupMenuItemDisabled('About');

	    webble.scope().addPopupMenuItemDisabled('openCRF');

	    if(currentMode != 'patient') {
		webble.scope().addPopupMenuItemDisabled('patActivate');
	    } else {
		webble.scope().removePopupMenuItemDisabled('patActivate');
	    }
	    
	    if(currentMode == 'design') {
		webble.scope().removePopupMenuItemDisabled('Props');
		webble.scope().removePopupMenuItemDisabled('tobdelete');
		webble.scope().removePopupMenuItemDisabled('tobduplicate');
		webble.scope().removePopupMenuItemDisabled('tobdeletesubtree');
		webble.scope().removePopupMenuItemDisabled('tobduplicatesubtree');
		webble.scope().removePopupMenuItemDisabled('connectCRF');
	    } else {
		webble.scope().addPopupMenuItemDisabled('Props');
		webble.scope().addPopupMenuItemDisabled('tobdelete');
		webble.scope().addPopupMenuItemDisabled('tobduplicate');
		webble.scope().addPopupMenuItemDisabled('tobdeletesubtree');
		webble.scope().addPopupMenuItemDisabled('tobduplicatesubtree');
		webble.scope().addPopupMenuItemDisabled('connectCRF');
	    }

	    if(shadow.crfs.length > 0 && currentMode == 'design') {
		webble.scope().removePopupMenuItemDisabled('assignStartEnd')
	    } else {
		webble.scope().addPopupMenuItemDisabled('assignStartEnd')
	    }

	    if(currentMode == 'design' && (shadow.microEvents.length > 0 || shadow.d > 1)) {
		webble.scope().removePopupMenuItemDisabled('microEvents');
	    } else {
		webble.scope().addPopupMenuItemDisabled('microEvents');
	    }

	    if(currentMode == 'design' && shadow.isCurrentlyExceptional) {
		// var prot = webble.scope().getProtection();
		// prot = prot | Enum.bitFlags_WebbleProtection.MOVE;
		// webble.scope().setProtection(prot);

		webble.scope().addPopupMenuItemDisabled('tobduplicate');
		webble.scope().addPopupMenuItemDisabled('tobdeletesubtree');
		webble.scope().addPopupMenuItemDisabled('tobduplicatesubtree');
	    }
	}
	//	    debugLog("Set protections on webble " + shadow.id + " to be '" + prot + "' now");
    };

    var addEvent = function (newChild) {
	debugLog("addEvent called");

    	var newShadow = { };
    	
    	var duplication = false;
    	
	if(thisIsADuplicateWeAlreadyAdded(newChild, currentRoot)) {
    	    var shadow = findShadowForAlreadyAddedWebble(newChild, currentRoot);

            if(shadow !== null) {
        	debugLog("addEvent has found something that was duplicated and already added!");
        	newShadow = shadow;
        	duplication = true;
            } 
	}

    	if(!duplication && thisIsADuplicateIWant(newChild, currentRoot)) {
    	    var shadow = findShadowForWebble(newChild, currentRoot);
	    
            if(shadow !== null) {
        	debugLog("addEvent has found something that was duplicated!");
        	newShadow = shadow;
        	duplication = true;
            } 
    	}

	if(weAreLoadingATrial && !duplication) {
	    for(var i = 0; i < listOfAllChildren.length; i++) {
		if(listOfAllChildren[i] !== null && listOfAllChildren[i].webble == newChild) {
		    // database Webble being loaded
		    newShadow = listOfAllChildren[i];
		    duplication = true;
		    break;
		}
	    }
	}
    	
    	newShadow.webble = newChild;

	if(!duplication) {
            debugLog("addEvent has found something that was dropped by the user!");

	    newShadow.isCurrentlyExceptional = false;

	    newShadow.sentinel = null;
	    
	    // debugLog("listOfAllChildren, addEvent");
            newShadow.id = listOfAllChildren.length;
            listOfAllChildren.push(newShadow);
	    newShadow.dbId = null;

	    newShadow.isActivated = false;
	    
    	    var x = parseFloat(newChild.scope().gimme('root:left'));
    	    var y = parseFloat(newChild.scope().gimme('root:top'));

    	    var w = 0;
    	    var h = 0;
    	    var days = 0;
	    
    	    var eventType = newChild.scope().gimme('MedEventType');

    	    var units = newChild.scope().gimme('NoOfUnits');
	    if(typeof(units) == 'string') {
		units = parseInt(units);
	    }

    	    var offsetUnits = newChild.scope().gimme('OffsetNoofUnits');
	    if(typeof(offsetUnits) == 'string') {
		offsetUnits = parseInt(offsetUnits);
	    }

    	    var offsets = [];
    	    var isBranch = false;
	    
	    var baseInfo = baseInfoForType(eventType, units);
	    
	    w = baseInfo.w;
	    days = baseInfo.days;
	    h = baseInfo.h;
	    offsets = baseInfo.offsets;	    
	    isBranch = baseInfo.isBranch;
	    
	    
    	    newShadow.w = w;
    	    newShadow.h = h;
    	    newShadow.d = days;
	    
	    newShadow.offsetUnits = offsetUnits;

    	    newShadow.offsets = offsets;
    	    newShadow.children = [];

    	    newShadow.totalH = h;

    	    newShadow.isBranch = isBranch;

    	    newShadow.type = eventType;

	    newShadow.startDate = {};
	    newShadow.startDate.crf = null;
	    newShadow.startDate.q = null;
	    
	    newShadow.endDate = {};
	    newShadow.endDate.crf = null;
	    newShadow.endDate.q = null;


	    newShadow.crfs = [];
	    newShadow.webble.scope().addPopupMenuItemDisabled('assignStartEnd')	    

	    newShadow.microEvents = [];

	    if(newShadow.webble !== null){
		if(newShadow.microEvents.length > 0 || newShadow.d > 1) {
		    newShadow.webble.scope().removePopupMenuItemDisabled('microEvents');
		} else {
		    newShadow.webble.scope().addPopupMenuItemDisabled('microEvents');
		}

		newShadow.webble.scope().set("MicroEvents", newShadow.microEvents);
	    }

	    //    	    debugLog("addEvent x " + x + ", y " + y + ", root " + currentRoot + ", days " + days);

	    // var ios = newShadow.webble.scope().theInteractionObjects;
	    // for(var i = 0, io; i < ios.length; i++){
	    // 	io = ios[i];
	    // 	if(io.scope().getName() == 'noofDays'){
	    // 	    if(newShadow.type == 'rad' || newShadow.type == 'chem' || newShadow.type == 'sup') {
	    // 		io.scope().setIsEnabled(true);
	    // 	    } else {
	    // 		io.scope().setIsEnabled(false);
	    // 	    }
	    // 	}
            // }
	    newShadow.webble.scope().set("root:z-index", getZindexForTypeOfShadow(newShadow));
	    

	    if( isAlwaysExceptional(newShadow)
		|| (currentRoot !== null && (y - (currentRoot.totalH + topSpace)) > exceptionalEventMargin && canBeExceptional(newShadow))
		|| (currentRoot === null && (y - topSpace) > exceptionalEventMargin) && canBeExceptional(newShadow)) {
		// add to the exceptional events list instead of to the normal tree

		listOfExceptionalEvents.push(newShadow);
		newShadow.parent = null;
		newShadow.isCurrentlyExceptional = true;
	    } else {
    		if(currentRoot === null) {
    		    forceSlotSetForPositions = true;
		    insertEventInTree(newShadow, null, 0);    
    		}
    		else {
    		    var bestParent = null;
    		    var bestDist = (x - leftSpace) * (x - leftSpace) + (y - topSpace) * (y - topSpace);
    		    var bestChildPos = 0;
		    
		    treeLocationCheckLoopStopper = {};
		    
    		    ls = treeLocationCheck(currentRoot, bestParent, bestDist, bestChildPos, x, y);
    		    bestParent = ls[0];
    		    bestDist = ls[1];
    		    bestChildPos = ls[2];

		    insertEventInTree(newShadow, bestParent, bestChildPos);    
    		}
	    }
	}	

	setChildProtectionsAndMenuItems(newShadow, newChild);
	setShadeOutAuto(newShadow, newChild);

	updateLayout();
	if(currentMode == 'patient') {
	    updateShadings();
	}
	
	
        // we should watch wblEventInfo.slotChanged but it does not work properly, so we implement our own version instead

	saveTrial();

	debugLog("Start listening to messages from child");

	newChild.scope().tellParent = {}; // clear out old messages 
        var sentinel = $scope.$watch(function(){ return newChild.scope().tellParent;}, function(newVal, oldVal) {
	    //	    debugLog("tellParent! ");

	    childSlotChange(newShadow, newVal)
	}, true);

	newShadow.sentinel = sentinel;
    };

    var DBIDs = 0;
    var getNewDBID = function () {
	DBIDs++;
	return DBIDs;
    };
    
    $scope.databaseCRFfunction = null;
    
    var getAvailableCRFs = function() {
	if($scope.databaseCRFfunction === null) {
	    return [{id: 1, name:"Surgery CRF", selection:false, content:[{pos:0, question:"Surgery Date", type:"Date"}, {pos:1, question:"Removed Tumor Volume", type:"Number"}]}, {id: 13, name:"Radio CRF", selection:false, content:[{pos:0, question:"Radio Therapy Date", type:"Date"}, {pos:1, question:"Radio Therapy Dose", type:"Number"}]}, {id: 22, name:"Chemo CRF", selection: false, content:[{pos:0, question:"Chemo Therapy Date", type:"Date"}, {pos:1, question:"Dose", type:"Number"}, {pos:2, question:"Medicine", type:"Text"}]}, {id: 20, name:"Registration CRF", selection: false, content:[{pos:0, question:"Registration Date", type:"Date"}, {pos:1, question:"Body Weight", type:"Number"}, {pos:2, question:"Blood Type", type:"Text"}]}];
	} else {
	    return $scope.databaseCRFfunction();
	}
    };


    var countDays = function(node) {
    	if(node == null) {
    	    return 0;
    	}
    	if(node.children.length == 0) {
    	    return node.d + node.offsetUnits;
    	}
    	var mx = 0;
    	var i = 0;
    	for(i = 0; i < node.children.length; i++) {
    	    var d = countDays(node.children[i]);
    	    if(d > mx) {
    		mx = d;
    	    }
    	}
    	return node.d + node.offsetUnits + mx;
    };

    var treeLocationCheckLoopStopper = {}
    
    var treeLocationCheck = function (node, bestParent, bestDist, bestChildPos, x, y) {
    	// if(node == null) {
    	//     debugLog("treeLocationCheck: node null, bestParent " + bestParent + ", bestDist " + bestDist + ", bestChildPos " + bestChildPos + ", x,y " + x + "," + y);
    	// }else {
    	//     debugLog("treeLocationCheck: node " + node.type + " " + node.id + ", bestParent " + bestParent + ", bestDist " + bestDist + ", bestChildPos " + bestChildPos + ", x,y " + x + "," + y);
    	// }
        
        if(node !== null && treeLocationCheckLoopStopper[node.id]) {
	    //	    debugLog("treeLocationCheck: there is a loop in the tree!");
	    return;
        }
        if(node !== null){
	    treeLocationCheckLoopStopper[node.id] = true;
        }
        
    	var l = node.left + node.offsetUnits * scaleFactor;
    	var t = node.top;

    	var i = 0;
	
    	for(i = 0; i < node.offsets.length; i++) {
    	    var x2 = l + node.offsets[i][0];
    	    var y2 = t + node.offsets[i][1];
	    
    	    var dx = x2 - x;
    	    var dy = y2 - y;
	    
    	    var dist = dx*dx + dy*dy;
	    
    	    // debugLog("treeLocationCheck: offsets on node " + node.type + " " + node.id + ", dist " + dist + ", childPos " + i + ", x2,y2 " + x2 + "," + y2);

    	    if(dist < bestDist) {
    		bestChildPos = i;
    		bestDist = dist;
    		bestParent = node;
    	    }
    	}

	//        debugLog("treeLocationCheck: children on node " + node.type + " " + node.id);

        var ls = [];
    	
    	for(i = 0; i < node.children.length; i++) {
    	    ls = treeLocationCheck(node.children[i], bestParent, bestDist, bestChildPos, x, y);
    	    if(ls[1] < bestDist) {
    		bestDist = ls[1];
    		bestParent = ls[0];
    		bestChildPos = ls[2];
    	    }
    	}

	//    	debugLog("treeLocationCheck: (After my subtrees) node " + node.type + ", bestParent " + bestParent + ", bestDist " + bestDist + ", bestChildPos " + bestChildPos + ", x,y " + x + "," + y);
    	ls = [bestParent, bestDist, bestChildPos];
    	return ls;
    };

    var getHeight = function(node) {
    	if(node == null) {
    	    return 0;
    	}
	
    	if(node.isBranch) {
    	    if(node.children.length == 0) {
    		node.totalH = node.h;
    		return node.h;
    	    }
    	    var tail = 0;
	    
	    var margin = 1;
	    if(node.type == 'ptc') {
		margin = ptcMargin;
	    } else {
    		margin = branchMargin;
	    }
	    
    	    var i = 0;
    	    for(i = 0; i < node.children.length; i++) {
    		var temp = getHeight(node.children[i]);
		
    		tail += temp;
		tail += margin;
    	    }
	    
	    if(node.type == 'rand') {
		tail += 25;
	    }
		
    	    node.totalH = tail;
    	    return tail;

    	} else {
    	    if(node.children.length == 0) {
    		node.totalH = node.h;
    		return node.h;
    	    }
    	    var tail = getHeight(node.children[0]);
	    
    	    if(node.h > tail) {
    		node.totalH = node.h;
    		return node.h;
    	    } else {
    		node.totalH = tail;
    		return tail;
    	    }
    	}
    };

    var moveChildren = function (node) {
    	var i = 0;
	
    	for(i = 0; i < node.children.length; i++) {
    	    node.children[i].left = node.left + node.offsets[i][0] + node.offsetUnits * scaleFactor;
	    if(node.children[i].webble !== null) {
    		// node.children[i].webble.scope().set('root:left', node.children[i].left + node.children[i].offsetUnits * scaleFactor);
    		node.children[i].webble.scope().silentMoveLeft(node.children[i].left + node.children[i].offsetUnits * scaleFactor);
	    }
    	    
	    node.children[i].top = node.top + node.offsets[i][1];
	    if(node.children[i].webble !== null) {
    		// node.children[i].webble.scope().set('root:top', node.children[i].top);
    		node.children[i].webble.scope().silentMoveTop(node.children[i].top);
	    }
	    
    	    if(node.isBranch) {
		var margin = 1;
		if(node.type == 'ptc') {
		    margin = ptcMargin;
		} else {
		    margin = branchMargin;
		}
    		node.offsets[i+1][1] = node.offsets[i][1] + node.children[i].totalH + margin;
    	    }
	    
	    if(node.children.length > 1 && currentMode == 'design') {
		setArmOrder(node.children[i], true);
	    } else {
		setArmOrder(node.children[i], false);
	    }		

    	    moveChildren(node.children[i]);
    	}
	
    	if(node.isBranch) {
	    if(node.webble !== null) {
    		node.webble.scope().set('NoOfUnits', node.totalH);
	    }
    	}
    };

    var clearTrial = function() {
	debugLog("clearTrial()");

	var i = 0;
	
	for(i = 0; i < listOfAllChildren.length; i++) {
	    var shadow = listOfAllChildren[i];
	    if(shadow !== null) {
		if(shadow.sentinel !== null) {
		    shadow.sentinel();
		}

		listOfAllChildren[shadow.id] = null;

		if(shadow.webble !== null) {
		    debugLog("request delete Webble for " + shadow.type + "." + shadow.id);

		    var prot = shadow.webble.scope().getProtection();
		    prot = prot & ~Enum.bitFlags_WebbleProtection.DELETE; // clear the protection flag
		    prot = prot & ~Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;; // clear the protection flag
		    shadow.webble.scope().setProtection(prot);
		    
		    // $scope.requestDeleteWebble(shadow.webble);
		    $scope.requestDeleteWebble(shadow.webble, null);
		}
	    }
	}

	currentRoot = null;
	listOfExceptionalEvents = [];
	listOfAllChildren = [];

    };


    var loadTrial = function(trialID) {

    };
    
    var loadTrialData = function(trialData) {
	debugLog("loadTrialData().\n" + trialData);

	if(typeof trialData === 'string') {
	    trialData = JSON.parse(trialData);
	}
	var i = 0;
	var event = null;
	var newShadow = null;
	var ls = [];

	var hackList = [];
	for(i = 0; i < listOfAllChildren.length; i++) {
	    if(listOfAllChildren[i] !== null && listOfAllChildren[i].webble !== null) {
		hackList.push(listOfAllChildren[i].webble);
	    }
	}

	clearTrial();

	if(trialData.hasOwnProperty("trial")) {
	    $scope.set("Trial", trialData.trial);
	}
	
	if(trialData.hasOwnProperty("events")) {
	    for(var e = 0; e < trialData.events.length; e++) {
		event = trialData.events[e];
    		newShadow = { };
    		newShadow.webble = null;
		newShadow.sentinel = null;

		newShadow.left = 0;
		newShadow.top = 0;

		newShadow.id = listOfAllChildren.length;
    		listOfAllChildren.push(newShadow);
		newShadow.dbId = event.dbId;

    		newShadow.type = typeIdToType(event.type_id);

		var baseInfo = baseInfoForType(newShadow.type, event.duration);

		newShadow.isActivated = false;

    		newShadow.w = baseInfo.w; 
    		newShadow.h = baseInfo.h; 
    		newShadow.d = event.duration;
		
    		newShadow.offsetUnits = event.preinterval;

    		newShadow.offsets = baseInfo.offsets;

    		newShadow.totalH = newShadow.h;

    		newShadow.isBranch = baseInfo.isBranch;

		newShadow.startDate = {};
		newShadow.startDate.crf = event.startdatecrfitemtemplate_id.crf;
		newShadow.startDate.q = event.startdatecrfitemtemplate_id.q;

		newShadow.endDate = {};
		newShadow.endDate.crf = event.enddatecrfitemtemplate_id.crf;
		newShadow.endDate.q = event.enddatecrfitemtemplate_id.q;

		newShadow.crfs = [];
		for(i = 0; i < event.crfs.length; i++) {
		    newShadow.crfs.push(event.crfs[i]);
		}

		newShadow.microEvents = [];
		if(event.microEvents.length > 0) {
		    for(i = 0; i < event.microEvents.length; i++) {
			newShadow.microEvents.push({id: event.microEvents[i].id, crf: event.microEvents[i].crf, day: event.microEvents[i].day});
		    }
		}

    		newShadow.children = []; 
		newShadow.parentId = event.source_dbId;
		if(newShadow.parentId === null) {
		    newShadow.parentId = '';
		}
		newShadow.parent = null;
		
		newShadow.armrank = event.armrank;
		newShadow.parallelrank = event.parallelrank;
		newShadow.mandatory = event.mandatory;
		var temp = event.treatmentelement.split(";");
		newShadow.eventColor = temp[0];
		newShadow.eventText =  temp[1];
		newShadow.treatmentarmlabel = event.treatmentarmlabel;
		newShadow.label = event.label;
	    }
	}

	// connect parents and children
	for(e = 0; e < listOfAllChildren.length; e++) {
	    newShadow = listOfAllChildren[e];
	    if(newShadow !== null && newShadow.parentId != '') {
		for(i = 0; i < listOfAllChildren.length; i++) {
		    if(listOfAllChildren[i] !== null && listOfAllChildren[i].dbId == newShadow.parentId) {
			newShadow.parent = listOfAllChildren[i];
			newShadow.parent.children.push(newShadow);
			break;
		    }
		}
	    }
	}

	// now that all children should be in the children lists, sort these list to the correct order
	for(e = 0; e < listOfAllChildren.length; e++) {
	    newShadow = listOfAllChildren[e];
	    if(newShadow !== null && newShadow.children.length > 1) {
		if(newShadow.type == 'ptc') {
		    newShadow.children.sort( function(a, b) { return a.parallelrank - b.parallelrank; } );
		} else {
		    newShadow.children.sort( function(a, b) { return a.armrank - b.armrank; } );
		}
	    }
	}

	// try to find the root node
	for(e = 0; e < listOfAllChildren.length; e++) {
	    newShadow = listOfAllChildren[e];
	    if(newShadow !== null && newShadow.parent === null) {
		if(newShadow.children.length > 0 || !canBeExceptional(newShadow)) {
		    currentRoot = newShadow;
		    break;
		}
	    }
	}
	
	// if no obvious root candidate was present, should we try one of the events that can be root but can be exceptional too?
	if(currentRoot === null) {
	    for(e = 0; e < listOfAllChildren.length; e++) {
		newShadow = listOfAllChildren[e];
		if(newShadow !== null && newShadow.parent === null) {
		    if(!isAlwaysExceptional(newShadow)) {
			currentRoot = newShadow;
			break;
		    }
		}
	    }
	}

	// add all the exceptional events to the list of exceptional events
	for(e = 0; e < listOfAllChildren.length; e++) {
	    newShadow = listOfAllChildren[e];
	    if(newShadow !== null) {
		if(newShadow.parent === null && newShadow != currentRoot) {
		    listOfExceptionalEvents.push(newShadow);
		    newShadow.isCurrentlyExceptional = true;
		} else {
		    newShadow.isCurrentlyExceptional = false;
		}
	    }
	}

	// set up the offsets for where new events can be dropped
	for(e = 0; e < listOfAllChildren.length; e++) {
	    newShadow = listOfAllChildren[e];
	    if(newShadow !== null && newShadow.isBranch) {
    		while(newShadow.children.length >= newShadow.offsets.length) {
    		    newShadow.offsets.push([newShadow.w, 0]);
    		}
	    }
	}

	updateLayout();

	// create webbles for the events
	var ls = $scope.getWebblesByDisplayName($scope.gimme('TOBEventName'));	
	if(ls.length > 0) {
	    var webble = ls[0];

	    // Sometimes we try to duplicate Webbles that will be deleted when the actual duplication happens but that are not deleted yet.
	    // This is a hack to avoid that.
	    for(i = 0; i < ls.length; i++) {
		var OK = true;
		for(var j = 0; j < hackList.length; j++) {
		    if(hackList[j] == ls[i]) {
			OK = false;
			debugLog("skip duplication candidate " + i + " because we asked for it to be deleted later.");
			break;
		    }
		}
		if(OK) {
		    webble = ls[i];
		    break;
		}
	    }

	    var prot = webble.scope().getProtection();
	    var originalProt = prot;
	    prot = prot & ~Enum.bitFlags_WebbleProtection.DUPLICATE; // clear the protection flag
	    webble.scope().setProtection(prot);
	    
	    weAreLoadingATrial = true;
	    for(e = 0; e < listOfAllChildren.length; e++) {
		if(listOfAllChildren[e] !== null) {
		    webble.scope().duplicate({x: 15, y: 15}, undefined);
		}
	    }	

	    webble.scope().setProtection(originalProt);
	} else {
	    $scope.openForm(Enum.aopForms.infoMsg, {title: 'No Events', content: 'When trying to load a trial from the database, no event Webbles were available to copy to create new events. Try setting the "TOBEventName" slot value to the "Display Name" of the Event Webble if one is already loaded. Otherwise, try loading a TOB Event Webble.'});
	}

	if(currentMode == 'patient') {
	    if(myPatientboard === null) {
		findPatientboard();
	    }

	    if(myPatientboard !== null) {
		if(trialData.hasOwnProperty("patientboardData")) {
		    dataToSendToPatientBoard = trialData.patientboardData;
		    updateShadings();
		} else {
		    dataToSendToPatientBoard = {};
		}
	    }
	}
    };

    var baseInfoForType = function(eventType, units) {
	var w = 0;
	var h = 0;
	var isBranch = false;
	var days = 0;
	var offsets = [];
	
    	switch(eventType) {
    	case 'none':
    	    break;

    	case 'undef':
    	    break;


    	case 'rad':
    	    w = scaleFactor * units;
    	    days = units;
    	    h = 50;
    	    offsets = [[w+1, 0]];
    	    break;
    	case 'chem':		    
    	    w = scaleFactor * units;
    	    days = units;
    	    h = 50
    	    offsets = [[w+1, 0]];
    	    break;
    	case 'sup':		    
    	    w = scaleFactor * units;
    	    days = units;
    	    h =  25;
    	    offsets = [[w+1, 0]];
    	    break;


    	case 'com':
    	    w = 0;
    	    h = 30;
    	    offsets = [[1, 0]];
    	    break;
    	case 'pat':		    
    	    w = 0;
    	    h = 30;
    	    offsets = [[1, 0]];
    	    break;
    	case 'cons':
    	    w = 0;
    	    h = 30;
    	    offsets = [[1, 0]];
    	    break;



    	case 'biop':
    	    w = 0;
    	    h = 50;	    
    	    offsets = [[1, 0]];
    	    break;
    	case 'blood':		    
    	    w = 0;
    	    h = 50;
    	    offsets = [[1, 0]];
    	    break;
    	case 'imag':		    
    	    w = 0;
    	    h = 50;
    	    offsets = [[1, 0]];
    	    break;


    	case 'surg':		    
    	    h = 50;
    	    w = scaleFactor;
    	    days = 1;
    	    offsets = [[w+1, 0]];
    	    break;
    	case 'surga':		    
    	    h = 50;
    	    w = scaleFactor;
    	    days = 1;
    	    offsets = [[w+1, 0]];
    	    break;
    	case 'surgc':		    
    	    h = 50;
    	    w = scaleFactor;
    	    days = 1;
    	    offsets = [[w+1, 0]];
    	    break;



    	case 'reg':		    
    	    w = 6;
    	    h = units;
    	    offsets = [[w, 0]];
    	    isBranch = true;
    	    break;
    	case 'stratif':		    
    	    w = 6;
    	    h = units;
    	    offsets = [[w, 0]];
    	    isBranch = true;
    	    break;

    	case 'ptc':		    
    	    w = 6;
    	    h = units;
    	    offsets = [[w, 0]];
    	    isBranch = true;
    	    break;

    	case 'rand':		    
    	    w = 2;
    	    h = units;
    	    offsets = [[w, 0]];
    	    isBranch = true;
    	    break;



    	case 'rep':		    
    	    w = 0;
    	    h = 0;
    	    offsets = [[1, 0]];
    	    break;

    	case 'saesusar':		    
    	    h = 0;
    	    w = 0;
    	    offsets = [[1, 0]];
    	    break;

    	}
	
	return {'days':days, 'w':w, 'h':h, 'offsets':offsets, 'isBranch':isBranch};
    };
    
    var typeToTypeInfoMap = {
	"none":{id:0, name:"none", description:"No Type", duration:7},
	"chem":{id:1, name:"chem", description:"Chemical Therapy Med Event", duration:7},
	"com":{id:2, name:"com", description:"Communication Med Event", duration:0},
	"cons":{id:3, name:"cons", description:"Consultation Med Event", duration:0},
	"pat":{id:4, name:"pat", description:"Patient Diary Communication", duration:0},
	"biop":{id:5, name:"biop", description:"Biopsy Med Event", duration:0},
	"blood":{id:6, name:"blood", description:"Blood diagnostic Med Event", duration:0},
	"imag":{id:7, name:"imag", description:"Image diagnostic Med Event", duration:0},
	"rad":{id:8, name:"rad", description:"Radio Therapy Med Event", duration:7},
	"rand":{id:9, name:"rand", description:"Randomization Med Event", duration:0},
	"rep":{id:10, name:"rep", description:"Report Med Event", duration:0},
	"saesusar":{id:11, name:"saesusar", description:"SAE / SUSAR Med Event", duration:0},
	"stratif":{id:12, name:"stratif", description:"Stratification Med Event", duration:0},
	"sup":{id:13, name:"sup", description:"Supportive Therapy Med Event", duration:7},
	"surg":{id:14, name:"surg", description:"Surgery (Scheduled) Med Event", duration:1},
	"surga":{id:15, name:"surga", description:"Surgery (due to accident) Med Event", duration:1},
	"surgc":{id:16, name:"surgc", description:"Surgery (due to complication) Med Event", duration:1},
	"reg":{id:17, name:"reg", description:"Registration Med Event", duration:0},
	"undef":{id:18, name:"undef", description:"Not yet defined", duration:0},
	"ptc":{id:19, name:"ptc", description:"ParallelTreatmentController", duration:0}
    };

    var typeToTypeId = function(shadowType) {
	return typeToTypeInfoMap[shadowType].id;
    };

    var typeIdToType = function(typeId) {
	for(var t in typeToTypeInfoMap) {
	    if(typeToTypeInfoMap[t].id == typeId) {
		return typeToTypeInfoMap[t].name;
	    }
	}
	return "none";
    };

    var exportShadow = function(shadow) {
	if(shadow) {
	    var i = 0;

	    res = {};
	    if(shadow.dbId === null || shadow.dbId === undefined || shadow.dbId == '') {
		shadow.dbId = getNewDBID();
	    }
	    res.id = shadow.id;
	    res.dbId = shadow.dbId;

	    res.duration = shadow.d;
	    res.preinterval = shadow.offsetUnits;
	    res.type_id = typeToTypeId(shadow.type);
	    if(shadow.webble !== null) {
		res.treatmentelement = shadow.webble.scope().gimme("EventColor") + ";" + shadow.webble.scope().gimme("EventText"); // Color + Text // fix! 
		res.treatmentarmlabel = shadow.webble.scope().gimme("TreatmentArmText");
		res.mandatory = shadow.webble.scope().gimme("IsMandatory");
	    } else {
		res.treatmentelement = "";
		res.treatmentarmlabel = "";
		res.mandatory = false;
	    }

	    res.source_id = '';
	    if(shadow.parent !== null) {
		if(shadow.parent.dbId === null || shadow.parent.dbId === undefined || shadow.parent.dbId == '') {
		    shadow.parent.dbId = getNewDBID();
		}

		res.source_id = shadow.parent.id;
		res.source_dbId = shadow.parent.dbId;
	    }
	    res.armrank = 0;
	    res.parallelrank = 0;
	    if(shadow.parent !== null && shadow.parent.isBranch) {
		for(i = 0; i < shadow.parent.children.length; i++) {
		    if(shadow.parent.children[i] == shadow) {
			if(shadow.parent.type == 'ptc') {
			    res.parallelrank = i;
			} else {
			    res.armrank = i;
			}
			break;
		    }
		}
	    }
	    res.treatmentarmpath = ""; // fix!
	    res.trial_id = currentTrial;
	    res.label_id = ''; // fix!
	    
	    // label
	    label = {};
	    label.id = ''; // fix!
	    if(shadow.webble !== null) {
		label.text = shadow.webble.scope().gimme("LabelText");
		label.color = shadow.webble.scope().gimme("LabelColor");
		label.position = shadow.webble.scope().gimme("LabelPos");
		label.shape = shadow.webble.scope().gimme("LabelShape");
	    } else {
		label.text = "";
		label.color = "";
		label.position = "";
		label.shape = "";
	    }
	    
	    res.label = label;
	    res.label_id = label.id;

	    res.startdatecrfitemtemplate_id = {crf:shadow.startDate.crf, q:shadow.startDate.q}; //fix!
	    res.enddatecrfitemtemplate_id = {crf:shadow.endDate.crf, q:shadow.endDate.q}; //fix!

	    // CRFs
	    res.crfs = [];
	    for(i = 0; i < shadow.crfs.length; i++) {
		res.crfs.push(shadow.crfs[i]);
	    }

	    // microEvents
	    res.microEvents = [];
	    for(i = 0; i < shadow.microEvents.length; i++) {
		res.microEvents.push({id: shadow.microEvents[i].id, crf: shadow.microEvents[i].crf, day: shadow.microEvents[i].day});
	    }
	    
	    return res;
	}
	else {
	    return "";
	}
    };

    var saveEventAndChildren = function(shadow, list) {
	var exp = exportShadow(shadow);
	list.push(exp);

	for(var i = 0; i < shadow.children.length; i++) {
	    saveEventAndChildren(shadow.children[i], list);
	}	
    };

    var saveTrial = function() {
	debugLog("saveTrial() called.");

	var res = {}

	var events = [];
	if(currentRoot != null) {
	    saveEventAndChildren(currentRoot, events)
	}
	
	var i = 0;
	for(i = 0; i < listOfExceptionalEvents.length; i++) {
	    var e = listOfExceptionalEvents[i];
	    var s = exportShadow(e);
	    events.push(s);
	}
	
	res.events = events;
	res.trial = $scope.gimme("Trial");

	if(currentMode == "patient" && myPatientboard !== null) {
	    res.patientboardData = myPatientboard.scope().gimme('SavedTrialData');
	}

	$scope.set('SavedTrialData', res);

	return res;
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

    // core: scope.wblEventInfo att lyssna p@ senare

    $scope.coreCall_Init = function(theInitWblDef){
        //TODO: Add template specific Slots on the following format...
        //$scope.addSlot(new Slot([NAME],
        //    [VALUE],
        //    [DISPLAY NAME],
        //    [DESCRIPTION],
        //    [CATEGORY],
        //    [METADATA],
        //    [ELEMENT POINTER]
        //));

	$scope.addSlot(new Slot('Mode',
				'design',
				'Mode',
				'The current mode (design/patient/analysis)',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));

	$scope.addSlot(new Slot('Trial',
				'',
				'Trial',
				'The ID of the trial.',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));

	$scope.addSlot(new Slot('Patient',
				'',
				'Patient',
				'The ID of the patient',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));

	$scope.addSlot(new Slot('NoOfDays',
				0,
				'No of Days',
				'The total number of days in this trial',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));

	$scope.addSlot(new Slot('PatientboardName',
				'TOBPatientboard',
				'Patient board name',
				'The name of the patient board Webble to connect with',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));

	$scope.addSlot(new Slot('TOBEventName',
				'TOBMedEvent',
				'TOB Event Name',
				'The name of a Webble to use to create new Webbles when loading events from the database.',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));


	$scope.addSlot(new Slot('SavedTrialData',
				{},
				'Saved Trial Data',
				'The data for this trial that we would like to store in the database.',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));


	$scope.addSlot(new Slot('LoadTrialData',
				{},
				'Load Trial Data',
				'Data for a trial that we would like to load from the database.',
				$scope.theWblMetadata.templateid,
				undefined,
				undefined));



        //NOTE: if you have strings in your code you want translated when language change, provide the translations
        //      in the area appointed above in the property section and wrap the string in a gettext() call or use
        //      'translate' filter in the view file


        //TODO: If you want to find your custom font families in the property dropdown list, add their main names as an array in lowercase to the metadata comboBoxContent object.
        //TODO: If you skip this you can still type by hand any font loaded into the system
        //$scope.getSlot('[SLOT NAME]').setMetaData({comboBoxContent: [ '[FONT NAME 1]', '[FONT NAME 2]' ]});
        // EXAMPLE:
        // $scope.getSlot('LabelTxt:font-family').setMetaData({comboBoxContent: [ 'ewert', 'freckle face' ]});


        //TODO: Set template specific Default slot for slot connections
        //$scope.setDefaultSlot([SLOT NAME]);
        // EXAMPLE:
        $scope.setDefaultSlot('');

        // TODO: Point the Resize default Interaction Object to selected Width and Height slots if this is wanted. If only one Width and Height Slot exist or none, the system automatically fix this.
        // $scope.setResizeSlots([WIDTH SLOT NAME], [HEIGHT SLOT NAME]);
        // EXAMPLE: $scope.setResizeSlots('square:width', 'square:height');

        // TODO: Set template specific child container for clipping effects etc... default container is within the core Webble.
        // EXAMPLE: $scope.setChildContainer([ELEMENT])

        // TODO: Create Initial template specific Value Listeners using angular $watch (additional $watch can be made and discarded in other places and times during the webbles life of course)
        // TODO: Remember to never listen to values containing complete webble references since they change constantly and creates watch loops
        // TODO You also use watches for slot value changes within yourself
        // $scope.$watch(function(){return [VALUE HOLDER TO WATCH];}, function(newVal, oldVal) {
        //  [CODE FOR TAKING CARE OF VALUE CHANGE]
        // }, true);
        // EXAMPLE (that uses the custom service for this Webble template):


	myInstanceId = $scope.getInstanceId();
	currentTrial = $scope.gimme("Trial");
	currentPatient = $scope.gimme("Patient");
	currentMode = $scope.gimme("Mode");

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    var newVal = eventData.slotValue;
	    if(newVal != "") {
		loadTrialData($scope.gimme("LoadTrialData"));
	    }
	}, myInstanceId, 'LoadTrialData');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    var previousMode = currentMode;
	    var newVal = eventData.slotValue;
	    
	    if(newVal.toLowerCase() == 'patient') {
		currentMode = 'patient';
	    }
	    else if(newVal.toLowerCase() == 'analysis') {
		currentMode = 'analysis';
	    }
	    else {
		currentMode = 'design';
	    }

	    if(currentMode == 'design') {
		if(myParent !== undefined && myParent !== null && myParent.scope() !== undefined) {
		    myParent.scope().set("grabDropped", true);
		}
	    } else {
		if(myParent !== undefined && myParent !== null && myParent.scope() !== undefined) {
		    myParent.scope().set("grabDropped", false);
		}
	    }

	    if(currentMode != previousMode) {
		// what do we do then?
	    }
	}, myInstanceId, 'Mode');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    var newVal = eventData.slotValue;
	    if(newVal < 0) {
		newVal = 0;
	    }
	}, myInstanceId, 'NoOfDays');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // call database
	    currentTrial = $scope.gimme("Trial");
	}, myInstanceId, 'Trial');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // call database
	    currentPatient = $scope.gimme("Patient");
	}, myInstanceId, 'Patient');


	$scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){
	    var newVal = eventData.childId;

	    if(newVal !== null) {
		debugLog("gotChild! " + newVal);

		var thisChild = $scope.getWebbleByInstanceId(newVal);
		var slots = thisChild.scope().getSlots();
		
		if(slots.hasOwnProperty('AbsoluteTime') && slots.hasOwnProperty('StartDate') && slots.hasOwnProperty('NoOfDays')) {
		    theTimeline = thisChild;

		    var prot = theTimeline.scope().getProtection();
		    prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
		    theTimeline.scope().setProtection(prot);

		    theTimeline.scope().set('root:left', '0px');
		    theTimeline.scope().set('root:top', '30px');
		    if(totalDays > 0) {
			theTimeline.scope().set('NoOfDays', totalDays);
		    } else {
			theTimeline.scope().set('NoOfDays', 1);
		    }
		    theTimeline.scope().set('AbsoluteTime', false);

		    theTimeline.scope().set("autoSlotConnEnabled", false);
		    theTimeline.scope().connectSlots('','', {send: false, receive: false});

		    theTimeline.scope().addPopupMenuItemDisabled('EditCustomMenuItems');
		    theTimeline.scope().addPopupMenuItemDisabled('EditCustomInteractionObjects');
		    theTimeline.scope().addPopupMenuItemDisabled('Bundle');
		    theTimeline.scope().addPopupMenuItemDisabled('BringFwd');
		    theTimeline.scope().addPopupMenuItemDisabled('ConnectSlots');
		    theTimeline.scope().addPopupMenuItemDisabled('Protect');
		    theTimeline.scope().addPopupMenuItemDisabled('AddCustomSlots');
		    theTimeline.scope().addPopupMenuItemDisabled('About');

		    prot = theTimeline.scope().getProtection();

		    prot = prot | Enum.bitFlags_WebbleProtection.CHILD_CONNECT;
		    prot = prot | Enum.bitFlags_WebbleProtection.DELETE;
		    prot = prot | Enum.bitFlags_WebbleProtection.PUBLISH;
		    prot = prot | Enum.bitFlags_WebbleProtection.DUPLICATE;
		    prot = prot | Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;
		    prot = prot | Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE;

		    // prot = prot | Enum.bitFlags_WebbleProtection.MOVE;

		    theTimeline.scope().setProtection(prot);

		    var ios = theTimeline.scope().theInteractionObjects;
		    for(var i = 0, io; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'Resize'){
			    io.scope().setIsEnabled(false);
			}
			if(io.scope().getName() == 'Rotate'){
			    io.scope().setIsEnabled(false);
			}
		    }

		    debugLog("found a timeline! " + newVal);
		}
	    }
	});


	$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
	    var newVal = eventData.targetId;

	    debugLog("loadingWebble! " + newVal);

	    if(currentMode == 'design' || weAreLoadingATrial) {
		
		var thisChild = $scope.getWebbleByInstanceId(newVal);
		
		var slots = thisChild.scope().getSlots();
		
		if(slots.hasOwnProperty('MedEventId')) {
		    // this is an event, start tracking it
		    
		    debugLog("found new event! " + newVal);
		    
                    if(thisIsADuplicateIWant(thisChild, currentRoot)) {
			//		    debugLog("I was waiting for this webble! " + newVal);
			duplicateEventHasArrived(thisChild);
                    } else if(weAreLoadingATrial) {
			databaseEventWebbleHasArrived(thisChild);
		    }
		    // else {
		    // 	// track this to see if it is pasted onto our parent window
		    // 	debugLog("track Webble " + newVal + " to see if it gets pasted");

		    // 	$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventDataInner){
		    // 	    debugLog("tracked Webble " + newVal + " was pasted!");
		    // 	    var newValInner = eventDataInner.targetId;
		    // 	    var parentId = eventDataInner.parentId;

		    // 	    if(newValInner !== null && parentId == myParentId) {
		    // 		debugLog("myParent had something pasted! " + newValInner);
		    // 		var thisChild = $scope.getWebbleByInstanceId(newValInner);
		    
		    // 		var slots = thisChild.scope().getSlots();
		    
		    // 		if(slots.hasOwnProperty('MedEventId')) {
		    // 		    // this is an event, take over as parent
		    
		    // 		    //			debugLog("found new event that I should steal! " + newValInner);
		    
		    // 		    addEvent(thisChild);
		    
		    // 		}
		    // 	    }
		    // 	}, newVal);
		    // }

		    debugLog("done with the found new event! " + newVal);
		}
	    }
	});
	
	$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventData){
	    var newVal = eventData.parentId;
	    debugLog("wblEventInfo.pasted! " + newVal + " (I am " + myInstanceId + ")");

	    if(myWebble === null) {
		myWebble = $scope.getWebbleByInstanceId(myInstanceId); // save a reference to ourselves
	    }

	    if(newVal !== null) {
		
		myParent = $scope.getWebbleByInstanceId(newVal);
		myParentId = newVal;

		if(currentMode == 'design') {
		    myParent.scope().set("grabDropped", true);
		} else {
		    myParent.scope().set("grabDropped", false);
		}

		//		debugLog("my parent: " + newVal + " " + myParent);
		
		// steal all MedEvent children it may already have

		$scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventDataInner){
		    var newValInner = eventDataInner.childId;
		    if(newValInner !== null && newValInner != myInstanceId) {
			debugLog("myParent.wblEventInfo.gotChild! " + newValInner);
			var thisChild = $scope.getWebbleByInstanceId(newValInner);
			
			var slots = thisChild.scope().getSlots();
			
			if(slots.hasOwnProperty('MedEventId')) {
			    // this is an event, take over as parent
			    
			    //			debugLog("found new event that I should steal! " + newValInner);
			    var alreadyKnown = false;
			    for(var i = 0; i < listOfAllChildren.length; i++) {
				if(listOfAllChildren[i] !== null && listOfAllChildren[i].webble == thisChild) {
				    // this means that it is a Webble that we loaded from the database
				    addEvent(thisChild); 
				    alreadyKnown = true;
				    break;
				}
			    } 

			    if(!alreadyKnown) {
				$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventDataInner2){
				    debugLog("child pasted, let's add this child: " + eventDataInner2.targetId);
				    var thisChild = $scope.getWebbleByInstanceId(eventDataInner2.targetId);
				    addEvent(thisChild);
				}, newValInner);
			    }
			    
			    // thisChild.scope().peel();
			    // thisChild.scope().paste(myWebble);
			}
		    }
		}, newVal);
	    }
	});

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
	    // debugLog("Unhandled interaction ball used: " + targetName);
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
	// debugLog("Unhandled menu item called: " + itemName);
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


wblwrld3App.controller("attachCRFform_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBMedEvent: " + message);
	}
    };

    $scope.formProps = {
	eaType: props.eaType,
	crfList: props.crfList,
	eventShadow: props.eventShadow,
	possibleOpts: [],
	infoMsg: '',
	browser: BrowserDetect.browser
    };

    $scope.close = function (result) {
	if(result == 'cancel'){
	    $uibModalInstance.close(null);
	}
	else if(result == 'submit'){
	    $uibModalInstance.close({crfList: $scope.formProps.crfList, eventShadow: $scope.formProps.eventShadow});
	} else {
	    $uibModalInstance.close(null);
	}
    };
    
    $scope.CRFinfo = function(crfID) {
	//	debugLog("CRFinfo called");
	var idx = 0;

	var notFound = true;
	for(var j = 0; j < $scope.formProps.crfList.length; j++) {
	    //	    debugLog("CRFinfo check idx " + j);
	    if($scope.formProps.crfList[j].id == crfID) {
		idx = j;
		notFound = false;
		//		debugLog("CRFinfo found CRF with id " + crfID);
		break;
	    }
	}

	if(notFound) {
	    debugLog("ERROR in Attach CRF. CRF with ID " + id + " requested, but no such CRF is available in this trial.");
	} else {
	    //	    debugLog("CRFinfo open info form");
	    props.wblScope.openForm('viewCRFForm', [{templateUrl: 'viewCRFform.html', controller: 'viewCRFform_Ctrl', size: 'lg'}, {wblScope: props.wblScope, clickedCRF:$scope.formProps.crfList[idx].content, title:$scope.formProps.crfList[idx].name}], closeViewCRFForm);
	}
    };

    var closeViewCRFForm = function(returnContent){
	//        debugLog("CloseViewCRFForm called.");
    };

    $scope.getRowBkgColor = function(rowIndex){
	if((rowIndex+1)%2 == 0){
	    return '#fffe9b';
	}
	else{
	    return 'transparent';
	}
    };

});
//========================================================================================


wblwrld3App.controller("viewCRFform_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBWorkboard: " + message);
	}
    };

    $scope.formProps = {
	eaType: props.eaType,
	clickedCRF: props.clickedCRF,
	title: props.title,
	possibleOpts: [],
	infoMsg: '',
	browser: BrowserDetect.browser
    };

    $scope.close = function (result) {
	if(result == 'close'){
	    $uibModalInstance.close(null);
	} else {
	    $uibModalInstance.close(null);
	}
    };
    //========================================================================================
    
});



wblwrld3App.controller("assignStartAndEndDatesForm_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBWorkboard: " + message);
	}
    };

    $scope.formProps = {
        eaType: props.eaType,
        qList: props.qList,
	eventShadow: props.eventShadow,
        possibleOpts: [],
        infoMsg: '',
        browser: BrowserDetect.browser
    };

    $scope.close = function (result) {
        if(result == 'cancel'){
	    $uibModalInstance.close(null);
        }
        else if(result == 'submit'){
	    $uibModalInstance.close({qList: $scope.formProps.qList, eventShadow: $scope.formProps.eventShadow});
        } else {
	    $uibModalInstance.close(null);
	}
    };
    
    $scope.getRowBkgColor = function(rowIndex){
        if((rowIndex+1)%2 == 0){
            return '#fffe9b';
        }
        else{
            return 'transparent';
        }
    };

});
//========================================================================================





wblwrld3App.controller("microEventForm_Ctrl", function ($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBWorkboard: " + message);
	}
    };

    $scope.formProps = {
        eaType: props.eaType,
        crfList: props.crfList,
	microEventList: props.microEventList,
	eventShadow: props.eventShadow,
	maxDays: props.eventShadow.d,
        possibleOpts: [],
        infoMsg: '',
        browser: BrowserDetect.browser
    };

    $scope.addMicroEvent = function() {
	//	debugLog("addMicroEvent called");

	var newId = 0;
	var newDay = 1;
	for(var i = 0; i < $scope.formProps.microEventList.length; i++) {
	    //	    debugLog("we already have id " + $scope.formProps.microEventList[i].id + " on day " + $scope.formProps.microEventList[i].day);

	    if($scope.formProps.microEventList[i].id >= newId) {
		newId = $scope.formProps.microEventList[i].id + 1;
	    }

	    if($scope.formProps.microEventList[i].day >= newDay) {
		newDay = $scope.formProps.microEventList[i].day + 1;
	    }
	}

	if(newDay > $scope.formProps.eventShadow.d) {
	    newDay = $scope.formProps.eventShadow.d;
	}

	//	debugLog("new id " + newId + ", new day " + newDay);
	
	$scope.formProps.microEventList.push({id: newId, day:newDay, crf:null});
    };

    $scope.removeMicroEvent = function(id) {
	//	debugLog("removeMicroEvent called " + id);

	var idx = -1;
	for(var i = 0; i < $scope.formProps.microEventList.length; i++) {
	    //	    debugLog("idx " + i + " has id " + $scope.formProps.microEventList[i].id);
	    if($scope.formProps.microEventList[i].id == id) {
		idx = i;
		break;
	    }
	}

	if(idx >= 0) {
	    $scope.formProps.microEventList.splice(idx, 1);
	}
    };

    $scope.close = function (result) {
	//	debugLog("microEventForm.close() called");

        if(result == 'cancel'){
	    $uibModalInstance.close(null);
        }
        else if(result == 'submit'){
	    $uibModalInstance.close({microEventList: $scope.formProps.microEventList, eventShadow: $scope.formProps.eventShadow});
        } else {
	    $uibModalInstance.close(null);
	}
    };
    
    $scope.CRFinfo = function(crfID) {
	//	debugLog("MicroEvent CRFinfo called");
	var idx = 0;

	var notFound = true;
	for(var j = 0; j < $scope.formProps.crfList.length; j++) {
	    //	    debugLog("CRFinfo check idx " + j);
	    if($scope.formProps.crfList[j].id == crfID) {
		idx = j;
		notFound = false;
		break;
	    }
	}

	if(notFound) {
	    debugLog("ERROR in Attach CRF. CRF with ID " + id + " requested, but no such CRF is available in this trial.");
	} else {
	    props.wblScope.openForm('viewCRFForm', [{templateUrl: 'viewCRFform.html', controller: 'viewCRFform_Ctrl', size: 'lg'}, {wblScope: props.wblScope, clickedCRF:$scope.formProps.crfList[idx].content, title:$scope.formProps.crfList[idx].name}], closeViewCRFForm);
	}
    };

    var closeViewCRFForm = function(returnContent){
	//        debugLog("CloseViewCRFForm called.");
    };

    $scope.getRowBkgColor = function(rowIndex){
        if((rowIndex+1)%2 == 0){
            return '#fffe9b';
        }
        else{
            return 'transparent';
        }
    };
});
//========================================================================================

