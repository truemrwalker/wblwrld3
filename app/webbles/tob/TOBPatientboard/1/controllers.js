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

wblwrld3App.controller("patientboardWebbleCtrl", function ($scope, $log, Slot, Enum) {
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
        patientboard: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
    };

    var currentTrial = -1;
    var currentPatient = -1;

    var currentRoot = null;
    var totalDays = 0;

    var listOfExceptionalEvents = [];

    var theTimeline = null;

    var scaleFactor = 14.3;
    
    var topSpace = 100;
    var leftSpace = 15;
    var exceptionalEventMargin = 50;

    var branchMargin = 20;
    var ptcMargin = 1;
    
    var listOfAllChildren = [];

    var myParent = null;
    var myWebble = null;

    var myInstanceId = -1;

    var haveBeenActivated = false;

    $scope.doDebugLogging = true;
    function debugLog(message) {
		if($scope.doDebugLogging) {
			$log.log("TOBPatientboard: " + message);
		}
    };

    //=== EVENT HANDLERS ================================================================

    var forceSlotSetForPositions = false;

    var updateLayout = function() {
		if(currentRoot !== null) {
			if(currentRoot.webble !== null) {
			var prot = currentRoot.webble.scope().getProtection();
			var oldProt = prot;
			prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
			currentRoot.webble.scope().setProtection(prot);
			}

				currentRoot.totalH = getHeight(currentRoot);

				if(currentRoot.isBranch) {
			if(currentRoot.webble !== null) {
					currentRoot.webble.scope().set('NoOfUnits', currentRoot.totalH);
			}
				}

				if(currentRoot.left != leftSpace) {
				currentRoot.left = leftSpace;
			if(currentRoot.webble !== null) {
					currentRoot.webble.scope().silentMoveLeft(currentRoot.left + currentRoot.offsetUnits * scaleFactor);
			}
				}
				if(currentRoot.top != topSpace) {
				currentRoot.top = topSpace;
			if(currentRoot.webble !== null) {
					currentRoot.webble.scope().silentMoveTop(currentRoot.top);
			}
				}

				if(forceSlotSetForPositions) {
			if(currentRoot.webble !== null) {
				currentRoot.webble.scope().silentMove(currentRoot.left + currentRoot.offsetUnits * scaleFactor, currentRoot.top);
			}
				}

			if(currentRoot.webble !== null) {
			currentRoot.webble.scope().setProtection(oldProt);
			}

				moveChildren(currentRoot);
		}
			totalDays = countDays(currentRoot);
			if(theTimeline !== null) {
				theTimeline.scope().set('NoOfDays', totalDays);

			// remove later
			var prot = theTimeline.scope().getProtection();
			prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
			theTimeline.scope().setProtection(prot);

			theTimeline.scope().set('root:left', '0px');
			theTimeline.scope().set('root:top', '30px');
			}

		if(listOfExceptionalEvents.length > 0) {
			var y = topSpace + exceptionalEventMargin;
			if(currentRoot !== null) {
			y += currentRoot.totalH;
			}

			for(var i = 0; i < listOfExceptionalEvents.length; i++) {
			var s = listOfExceptionalEvents[i];
			if(s.webble !== null) {
				// var prot = s.webble.scope().getProtection();
				// var oldProt = prot;
				// prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
				// s.webble.scope().setProtection(prot);

				var x = s.exceptionalDayOffset * scaleFactor + leftSpace;
				var day = s.exceptionalDayOffset;
				var yshift = 0;

				// debugLog("updateLayout exceptionals " + i + ", day " + day + ", armrank " + s.armrank);

				for(var other = 0; other < listOfExceptionalEvents.length; other++) {
				if(other != i && listOfExceptionalEvents[other].exceptionalDayOffset == day && listOfExceptionalEvents[other].armrank < s.armrank) {
					yshift += listOfExceptionalEvents[other].totalH + 10;
				}
				}
				// debugLog("updateLayout exceptionals " + i + ", day " + day + ", yshift " + yshift);

				// s.webble.scope().set('root:left', x);
				s.webble.scope().silentMoveLeft(x);


				if(s.type == 'biop' || s.type == 'blood' || s.type == 'imag') {
				// s.webble.scope().set('root:top', y + 80);
				s.webble.scope().silentMoveTop(y + 50 + yshift);
				} else {
				// s.webble.scope().set('root:top', y);
				s.webble.scope().silentMoveTop(y + yshift);
				}

				// s.webble.scope().setProtection(oldProt);
			}
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

    $scope.databaseCRFfunction = null;
    
    var getAvailableCRFs = function() {
		if($scope.databaseCRFfunction === null) {
			return [{id: 1, name:"Surgery CRF", selection:false, content:[{pos:0, question:"Surgery Date", type:"Date"}, {pos:1, question:"Removed Tumor Volume", type:"Number"}]}, {id: 13, name:"Radio CRF", selection:false, content:[{pos:0, question:"Radio Therapy Date", type:"Date"}, {pos:1, question:"Radio Therapy Dose", type:"Number"}]}, {id: 22, name:"Chemo CRF", selection: false, content:[{pos:0, question:"Chemo Therapy Date", type:"Date"}, {pos:1, question:"Dose", type:"Number"}, {pos:2, question:"Medicine", type:"Text"}]}, {id: 20, name:"Registration CRF", selection: false, content:[{pos:0, question:"Registration Date", type:"Date"}, {pos:1, question:"Body Weight", type:"Number"}, {pos:2, question:"Blood Type", type:"Text"}]}];
		} else {
			return $scope.databaseCRFfunction();
		}
    };
    // var getAvailableCRFs = function() {
    // 	return [{id: 1, name:"Surgery CRF", selection:false, content:[{pos:0, question:"Surgery Date", type:"Date"}, {pos:1, question:"Removed Tumor Volume", type:"Number"}]}, {id: 13, name:"Radio CRF", selection:false, content:[{pos:0, question:"Radio Therapy Date", type:"Date"}, {pos:1, question:"Radio Therapy Dose", type:"Number"}]}, {id: 22, name:"Chemo CRF", selection: false, content:[{pos:0, question:"Chemo Therapy Date", type:"Date"}, {pos:1, question:"Dose", type:"Number"}, {pos:2, question:"Medicine", type:"Text"}]}, {id: 20, name:"Registration CRF", selection: false, content:[{pos:0, question:"Registration Date", type:"Date"}, {pos:1, question:"Body Weight", type:"Number"}, {pos:2, question:"Blood Type", type:"Text"}]}];
    // };

    var instanciateCRF = function(shadow, crfTemplateId) {
		var i = 0;
		var availableCRFlist = getAvailableCRFs();
		var crfTemplate = null;

		for(i = 0; i < availableCRFlist.length; i++) {
			if(availableCRFlist[i].id == crfTemplateId) {
			crfTemplate = availableCRFlist[i];
			break;
			}
		}

		if(crfTemplate === null) {
			$scope.openForm(Enum.aopForms.infoMsg, {title: 'CRF not found', content: 'An event has been added where the template event has a template CRF that cannot be found, so the CRF instance for this event could not be created. This means that the trial is broken (events and CRFs are inconcistent).'});
		} else {

			var crfInstance = {};
			crfInstance.crfTemplate = crfTemplate;
			crfInstance.event = shadow;

			crfInstance.id = 0;

			crfInstance.content = [];

			for(i = 0; i < crfTemplate.content.length; i++) {
			var q = {};
			q.answer = null;
			q.pos = crfTemplate.content[i].pos;

			crfInstance.content.push(q);
			}
			return crfInstance;
		}

		return null;
    };

    var instanciateMicroEvent = function(shadow, microEventTemplate) {
		var i = 0;
		var availableCRFlist = getAvailableCRFs();
		var crfTemplate = null;

		var microEventInstance = {};

		microEventInstance.crf = null;
		microEventInstance.day = microEventTemplate.day;
		microEventInstance.id = shadow.microEvents.length; // Todo!
		microEventInstance.crfName = "";

		debugLog("instanciateMicroEvent day " + microEventInstance.day + ", crf " + microEventTemplate.crf);

		if(microEventTemplate.crf !== null) {

			for(i = 0; i < availableCRFlist.length; i++) {
			if(availableCRFlist[i].id == microEventTemplate.crf) {
				crfTemplate = availableCRFlist[i];
				break;
			}
			}

			if(crfTemplate === null) {
			$scope.openForm(Enum.aopForms.infoMsg, {title: 'CRF not found', content: 'An event has been added where the template event has a template CRF that cannot be found, so the CRF instance for this event could not be created. This means that the trial is broken (events and CRFs are inconcistent).'});
			} else {

			var crfInstance = {};
			crfInstance.crfTemplate = crfTemplate;
			crfInstance.event = shadow;

			crfInstance.id = 0;

			crfInstance.content = [];

			for(i = 0; i < crfTemplate.content.length; i++) {
				var q = {};
				q.answer = null;
				q.pos = crfTemplate.content[i].pos;

				crfInstance.content.push(q);
			}
			microEventInstance.crf = crfInstance;
			microEventInstance.crfName = crfTemplate.name;
			}
		}

		debugLog("instanciateMicroEvent day " + microEventInstance.day + ", crf " + microEventTemplate.crf);

		return microEventInstance;
    };

    var addEvent = function (webble) {
		var shadow = findShadowForWebble(webble, currentRoot);

		if(shadow === null) {
			var eventType = webble.scope().gimme('MedEventType');

			var i = 0;
			for(i = 0; i < listOfExceptionalEvents.length; i++) {
			var s = listOfExceptionalEvents[i];
			if(s.type == eventType && s.webble === null) {
				shadow = s;
				break;
			}
			}
		}

		if(shadow === null) {
			var eventType = webble.scope().gimme('MedEventType');

			debugLog("received new event that does not fit any event I am waiting for. " + eventType);
			printTree(currentRoot);
			for(var idx = 0; idx < listOfExceptionalEvents.length; idx++) {
			debugLog("exceptional event " + listOfExceptionalEvents[idx].type + " " + listOfExceptionalEvents[idx].exceptionalDayOffset);
			}

			$scope.openForm(Enum.aopForms.infoMsg, {title: 'Unexpected Event Added', content: 'An event has been added that was not expected.'});
		} else {
			shadow.webble = webble;
			setChildProtectionsAndMenuItems(shadow, shadow.webble);
			forceSlotSetForPositions = true;
			updateLayout();
			forceSlotSetForPositions = false;

			debugLog("Start listening to messages from child");

			saveTrial(); // need to update our saved state with things stored in the Webble, like the label

			webble.scope().tellParent = {}; // clear out old messages
				var sentinel = $scope.$watch(function(){ return webble.scope().tellParent;}, function(newVal, oldVal) {
			childSlotChange(shadow, newVal)
			}, true);

			shadow.sentinel = sentinel;
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

    var setChildProtectionsAndMenuItems = function(shadow, webble) {
		var prot = webble.scope().getProtection();

		//	    debugLog("TOBpatientboard: Going to fix protections on webble " + shadow.id + " which is '" + prot + "' now");

		prot = prot | Enum.bitFlags_WebbleProtection.CHILD_CONNECT;
		prot = prot | Enum.bitFlags_WebbleProtection.DELETE;
		prot = prot | Enum.bitFlags_WebbleProtection.PUBLISH;
		prot = prot | Enum.bitFlags_WebbleProtection.DUPLICATE;
		prot = prot | Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;
		prot = prot | Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE;
		// prot = prot | Enum.bitFlags_WebbleProtection.;

		if(shadow.isCurrentlyExceptional) {
			prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
		} else {
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
			io.scope().setIsEnabled(false);
			}
				if(io.scope().getName() == 'noofDays'){
			io.scope().setIsEnabled(false);
			}

				if(io.scope().getName() == 'armOrder'){
			if(shadow.isCurrentlyExceptional) {
				io.scope().setIsEnabled(true);
			} else {
				io.scope().setIsEnabled(false);
			}
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

		webble.scope().addPopupMenuItemDisabled('patActivate');

		webble.scope().addPopupMenuItemDisabled('Props');
		webble.scope().addPopupMenuItemDisabled('tobdelete');
		webble.scope().addPopupMenuItemDisabled('tobduplicate');
		webble.scope().addPopupMenuItemDisabled('tobdeletesubtree');
		webble.scope().addPopupMenuItemDisabled('tobduplicatesubtree');
		webble.scope().addPopupMenuItemDisabled('connectCRF');

		// remove later
		webble.scope().removePopupMenuItemDisabled('Protect');

		webble.scope().addPopupMenuItemDisabled('assignStartEnd')

		if(shadow.microEvents.length > 0) {
			shadow.webble.scope().removePopupMenuItemDisabled('microEvents');
		} else {
			shadow.webble.scope().addPopupMenuItemDisabled('microEvents');
		}
		shadow.webble.scope().set("MicroEvents", shadow.microEvents);

		if(shadow.crfs.length <= 0) {
			setShadeOut(shadow, webble, true, 'red');
			shadow.webble.scope().addPopupMenuItemDisabled('openCRF');
		} else {
			setShadeOut(shadow, webble, false, 'red');
			shadow.webble.scope().removePopupMenuItemDisabled('openCRF');
		}

		webble.scope().removePopupMenuItemDisabled('Props');

		//	    debugLog("TOBpatientboard: Set protections on webble " + shadow.id + " to be '" + prot + "' now");
    };

    var setShadeOut = function(shadow, webble, status, color) {
	webble.scope().set('ShadeOutColor', color);
	webble.scope().set('ShadeOutEnabled', status);
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
		    var prot = shadow.webble.scope().getProtection();
		    prot = prot & ~Enum.bitFlags_WebbleProtection.DELETE; // clear the protection flag
		    prot = prot & ~Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;; // clear the protection flag
		    shadow.webble.scope().setProtection(prot);
		    
		    debugLog("request delete " + shadow.type + "." + shadow.id);

		    $scope.requestDeleteWebble(shadow.webble);
		}
	    }
	}

	currentRoot = null;
	listOfExceptionalEvents = [];
	listOfAllChildren = [];
    };

    var findTemplateShadowTreeRecursion = function(template_dbId, node) {
	if(node === null) {
	    return null;
	}
	if(node.dbId == template_dbId) {
	    return node;
	}

	for(var i = 0; i < node.children.length; i++) {
	    var temp = findTemplateShadowTreeRecursion(template_dbId, node.children[i]);
	    if(temp !== null) {
		return temp;
	    }
	}

	return null;
    };

    var findTemplateShadow = function(template_dbId, workBoardCurrentRoot, workBoardListOfExceptionalEvents) {
	var res = findTemplateShadowTreeRecursion(template_dbId, workBoardCurrentRoot);
	
	if(res !== null) {
	    return res;
	}
	
	for(var i = 0; i < workBoardListOfExceptionalEvents.length; i++) {
	    if(workBoardListOfExceptionalEvents[i].dbId == template_dbId) {
		return workBoardListOfExceptionalEvents[i];
	    }
	}
	
	return null;
    };

    $scope.loadTrial = function(trialData, workBoardCurrentRoot, workBoardListOfExceptionalEvents) {
		debugLog("loadTrialData().\n" + trialData);

		var data = trialData;
		if(typeof trialData === 'string') {
			data = JSON.parse(trialData);
		}
		var i = 0;
		var event = null;
		var newShadow = null;
		var ls = [];
		var e = 0;

		clearTrial();

		if(data && data.trial && data.patient && data.events) {

			$scope.set("Trial", data.trial);
			$scope.set("Patient", data.patient);

			haveBeenActivated = true;

			for(e = 0; e < data.events.length; e++) {
			event = data.events[e];
				newShadow = {};
				newShadow.webble = null;
			newShadow.sentinel = null;

			newShadow.left = 0;
			newShadow.top = 0;

			newShadow.id = listOfAllChildren.length;
				listOfAllChildren.push(newShadow);
			newShadow.dbId = event.dbId;

			newShadow.templateEventId = event.template_id;
			newShadow.templateEventDbId = event.template_dbId;
			newShadow.templateEvent = findTemplateShadow(newShadow.templateEventDbId, workBoardCurrentRoot, workBoardListOfExceptionalEvents);

			var oldShadow = newShadow.templateEvent;
			if(oldShadow !== null) {
				oldShadow.isActivated = true;

					newShadow.w = oldShadow.w; // bug!?
					newShadow.h = oldShadow.h;
					newShadow.d = oldShadow.d;

					newShadow.offsetUnits = oldShadow.offsetUnits;

					newShadow.offsets = [];
					newShadow.offsets[0] = [oldShadow.offsets[0][0], oldShadow.offsets[0][1]];
					newShadow.children = [];

					newShadow.totalH = oldShadow.totalH;

					newShadow.isBranch = oldShadow.isBranch;

					newShadow.type = oldShadow.type;

				newShadow.startDate = {};
				newShadow.startDate.crf = oldShadow.startDate.crf;
				newShadow.startDate.q = oldShadow.startDate.q;

				newShadow.endDate = {};
				newShadow.endDate.crf = oldShadow.endDate.crf;
				newShadow.endDate.q = oldShadow.endDate.q;

				newShadow.crfs = [];
				var crfTemplates = getAvailableCRFs();

				for(i = 0; i < event.crfs.length; i++) {
				var crfInstance = {};
				for(var tmpl = 0; tmpl < crfTemplates.length; tmpl++) {
					if(crfTemplates[tmpl].id == event.crfs[i].template_id) {
					crfInstance.crfTemplate = crfTemplates[tmpl]; // find somewhere
					break;
					}
				}
				crfInstance.event = newShadow;
				crfInstance.id = event.crfs[i].id;
				crfInstance.content = event.crfs[i].content;

				newShadow.crfs.push(crfInstance);
				}

				newShadow.microEvents = [];
				if(oldShadow.microEvents.length > 0) {
				for(i = 0; i < event.microEvents.length; i++) {
					newShadow.microEvents.push(event.microEvents[i]); // need to instanciate CRFs here too, fix!
				}
				}

				if(oldShadow.offsets.length > 0) {
				if(oldShadow.type == 'ptc') {
					newShadow.offsets = [];
					for(i = 0; i < oldShadow.offsets.length; i++) {
					newShadow.offsets.push(oldShadow.offsets[i]);
					}
				}
				}

				newShadow.isCurrentlyExceptional = oldShadow.isCurrentlyExceptional;

				if (newShadow.isCurrentlyExceptional){
				newShadow.exceptionalDayOffset = event.exceptionalDayOffset;
				listOfExceptionalEvents.push(newShadow);
				} else {
				insertEventInTree(newShadow);
				}

					updateLayout();

				var prot = oldShadow.webble.scope().getProtection();
				var oldProt = prot;
				prot = prot & ~Enum.bitFlags_WebbleProtection.DUPLICATE; // clear the protection flag
				oldShadow.webble.scope().setProtection(prot);

				oldShadow.webble.scope().duplicate({x: 15, y: 15}, undefined);

				oldShadow.webble.scope().setProtection(oldProt);

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

			// now that all children should be in the children lists, sort these list to the correct order
			for(e = 0; e < listOfAllChildren.length; e++) {
			newShadow = listOfAllChildren[e];
			if(newShadow !== null && newShadow.children.length > 1) {
				if(newShadow.type == 'ptc') {
				newShadow.children.sort( function(a, b) { return a.parallelrank - b.parallelrank; } );
				} else {
				debugLog("Load event, we have an event with an armrank != 0. This should not happen.");
				newShadow.children.sort( function(a, b) { return a.armrank - b.armrank; } );
				}
			}
			}
		}
		updateLayout();
    };

    $scope.activate = function (oldShadow) {
	debugLog("Patientboard: Activate called for " + oldShadow.type + "." + oldShadow.id);

	haveBeenActivated = true;
	
	oldShadow.isActivated = true;

	var newShadow = {};

	newShadow.dbId = -1; // get one assigned later?
	
	newShadow.webble = null;
	newShadow.sentinel = null;

        newShadow.id = listOfAllChildren.length;
	listOfAllChildren.push(newShadow);

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

	newShadow.startDate = {};
	newShadow.startDate.crf = oldShadow.startDate.crf;
	newShadow.startDate.q = oldShadow.startDate.q;

	newShadow.endDate = {};
	newShadow.endDate.crf = oldShadow.endDate.crf;
	newShadow.endDate.q = oldShadow.endDate.q;

	newShadow.crfs = [];
	var i = 0;
	for(i = 0; i < oldShadow.crfs.length; i++) {
	    var crfInstance = instanciateCRF(newShadow, oldShadow.crfs[i]);
	    if(crfInstance !== null) {
		newShadow.crfs.push(crfInstance);
	    }
	}

	newShadow.microEvents = [];
	if(oldShadow.microEvents.length > 0) {
	    for(i = 0; i < oldShadow.microEvents.length; i++) {
		var microEventInstance = instanciateMicroEvent(newShadow, oldShadow.microEvents[i]);
		newShadow.microEvents.push(microEventInstance);
	    }
	}

	if(oldShadow.offsets.length > 0) {
	    if(oldShadow.type == 'ptc') {
		newShadow.offsets = [];
		for(i = 0; i < oldShadow.offsets.length; i++) {
		    newShadow.offsets.push(oldShadow.offsets[i]);
		}
	    }
	}
	
	newShadow.isCurrentlyExceptional = oldShadow.isCurrentlyExceptional;

	newShadow.templateEventId = oldShadow.id;
	newShadow.templateEventDbId = oldShadow.dbId;
	newShadow.templateEvent = oldShadow;

	if (newShadow.isCurrentlyExceptional){ 
	    newShadow.exceptionalDayOffset = totalDays; // add it to the last day as a first heuristic
	    newShadow.parent = null;
	    newShadow.armrank = 0;
	    for(i = 0; i < listOfExceptionalEvents.length; i++) {
		if(listOfExceptionalEvents[i].exceptionalDayOffset == newShadow.exceptionalDayOffset) {
		    newShadow.armrank++;
		}
	    }
	    listOfExceptionalEvents.push(newShadow);
	} else {
            insertEventInTree(newShadow);
	}

    	updateLayout();

	var prot = oldShadow.webble.scope().getProtection();
	var oldProt = prot;
	prot = prot & ~Enum.bitFlags_WebbleProtection.DUPLICATE; // clear the protection flag
	oldShadow.webble.scope().setProtection(prot);

	oldShadow.webble.scope().duplicate({x: 15, y: 15}, undefined);

	oldShadow.webble.scope().setProtection(oldProt);

	saveTrial();
    };

    var checkMovedWebble = function(shadow, x, y) {
	var oldX = shadow.exceptionalDayOffset * scaleFactor + leftSpace;
	var oldDay = shadow.exceptionalDayOffset;

	var newDay = Math.round((x - leftSpace) / scaleFactor);
	if(newDay < 0) {
	    newDay = 0;
	}

	debugLog("checkMovedWebble day " + oldDay + " to " + newDay);

	if(newDay != oldDay) {
	    shadow.exceptionalDayOffset = newDay;
	    var newArmrank = 0;
	    for(var i = 0; i < listOfExceptionalEvents.length; i++) {
		if(listOfExceptionalEvents[i] != shadow) {
		    if(listOfExceptionalEvents[i].exceptionalDayOffset == newDay) {
			newArmrank++;
		    }
		    if(listOfExceptionalEvents[i].exceptionalDayOffset == oldDay && listOfExceptionalEvents[i].armrank > shadow.armrank) {
			listOfExceptionalEvents[i].armrank--;
		    }
		}
	    }
	    shadow.armrank = newArmrank;
	    debugLog("move moved child to new position");
	    updateLayout();
	} else {
	    if(oldX != x) {
		debugLog("move moved child back to old position");
		updateLayout(); // move back
	    }
	}
    };

    var childSlotChange = function(shadow, slotPackage) {
        var x = 0;
        var y = 0;
        var units = 0;
	var i = 0;
        
	if(slotPackage.hasOwnProperty('OffsetNoofUnits')) {
	    debugLog("child has changed OffsetNoofUnits, this should not happen.");
	    delete slotPackage.OffsetNoofUnits;
	}
	
	if(slotPackage.hasOwnProperty('NoOfUnits')) {
	    if(!shadow.isBranch) {
		debugLog("child has changed NoOfUnits, this should not happen.");
	    } else {
		updateLayout();
	    }
	    delete slotPackage.NoOfUnits;
	}

	if(slotPackage.hasOwnProperty('pos')) {
	    if(shadow.isCurrentlyExceptional) {
		debugLog("exceptional child has changed pos, we should deal with this.");
		
		// Todo!!

		x = slotPackage.pos[0];
		y = slotPackage.pos[1];

		if(slotPackage.hasOwnProperty('ignoreIfPosIs')) {
		    ignoreIfx = slotPackage.ignoreIfPosIs[0];
		    ignoreIfy = slotPackage.ignoreIfPosIs[1];
		    
		    if(x != ignoreIfx || y != ignoreIfy) {
			checkMovedWebble(shadow, x, y);
		    } else {
			debugLog("Ignore pos change because it was my request");
		    }
		} else {
		    // debugLog("Check pos change");
		    checkMovedWebble(shadow, x, y);
		}
	    } else {
		debugLog("non-exceptional child has changed pos, this should not happen.");
	    }
	    
	    if(slotPackage.hasOwnProperty('ignoreIfPosIs')) {
		delete slotPackage.ignoreIfPosIs;
	    }

            delete slotPackage.pos;
	}

	if(slotPackage.hasOwnProperty('root:top')) {
	    debugLog("child has changed root:top, this should not happen?");

	    delete slotPackage['root:top'];
	}

	if(slotPackage.hasOwnProperty('root:left')) {
	    debugLog("child has changed root:left, this should not happen?");

	    delete slotPackage['root:left'];
	}


	if(slotPackage.hasOwnProperty('SubtreeDeletionRequest')) {
	    debugLog("got SubtreeDeletionRequest from child, Ignoring.");

	    delete slotPackage.SubtreeDeletionRequest;
	}

	if(slotPackage.hasOwnProperty('DeletionRequest')) {
	    debugLog("got DeletionRequest from child, Ignoring.");
	    
	    delete slotPackage.DeletionRequest;
	}

	if(slotPackage.hasOwnProperty('SubtreeDuplicationRequest')) {
	    debugLog("got SubtreeDuplicationRequest from child, Ignoring.");

	    delete slotPackage.SubtreeDuplicationRequest;
	}

	if(slotPackage.hasOwnProperty('DuplicationRequest')) {
	    debugLog("got DuplicationRequest from child, Ignoring.");

	    delete slotPackage.DuplicationRequest;
	}

	if(slotPackage.hasOwnProperty('ArmOrderChangeRequest')) {
	    debugLog("got ArmOrderChangeRequest from child.");
	    delete slotPackage.ArmOrderChangeRequest;

	    if(shadow.isCurrentlyExceptional) {
		// are there more events on the same day? Todo!

		debugLog("ArmOrderChangeRequest from exceptional day " + shadow.exceptionalDayOffset);
		
		var newArmrank = 0;
		var ls = [];
		
		for(var i = 0; i < listOfExceptionalEvents.length; i++) {
		    if(listOfExceptionalEvents[i] != shadow) {
			if(listOfExceptionalEvents[i].exceptionalDayOffset == shadow.exceptionalDayOffset) {
			    ls.push(listOfExceptionalEvents[i]);
			}
		    }
		}

		if(ls.length >= 1) {
		    if(shadow.armrank == ls.length) { // the last one (shadow itself is not included)
			debugLog("ArmOrderChangeRequest wrap ");
			for(i = 0; i < ls.length; i++) {
			    ls[i].armrank++;
			}
			shadow.armrank = 0;
		    } else {
			for(i = 0; i < ls.length; i++) {
			    if(ls[i].armrank == shadow.armrank + 1) {
				ls[i].armrank--;
				debugLog("ArmOrderChangeRequest switch ");
				shadow.armrank++;
				break;
			    }
			}
		    }
		    updateLayout();
		}		
	    }
	}

	if(slotPackage.hasOwnProperty('microEvents')) {
	    debugLog("got MicroEvent request from child.");
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
	}

	if(slotPackage.hasOwnProperty('CRFConnectRequest')) {
	    debugLog("got CRFConnectRequest from child. This should not happen.");
	    delete slotPackage.CRFConnectRequest;
	}

	if(slotPackage.hasOwnProperty('CRFOpenRequest')) {
	    debugLog("got CRFOpenRequest from child.");
	    delete slotPackage.CRFOpenRequest;
	    
	    var availableCRFlist = getAvailableCRFs();
	    var notFound = false;
	    var attachedCRFlist = [];

	    for(var i = 0; i < shadow.crfs.length; i++) {
	    	var id = shadow.crfs[i].crfTemplate.id;

	    	notFound = true;
	    	for(var j = 0; j < availableCRFlist.length; j++) {
	    	    if(availableCRFlist[j].id == id) {
	    		availableCRFlist[j].selected = true;
	    		attachedCRFlist.push(availableCRFlist[j]);
	    		notFound = false;
	    		break;
	    	    }
	    	}
	    	if(notFound) {
	    	    debugLog("ERROR in Open CRF call. Event has CRF with ID " + id + ", but no such CRF is available in this trial.");
	    	}
	    }

            $scope.openForm('listCRFForm', [{templateUrl: 'listCRFform.html', controller: 'listCRFform_Ctrl', size: 'lg'}, {wblScope: $scope, crfList: attachedCRFlist, crfs: shadow.crfs, eventShadow: shadow}], closeListCRFForm);
	}
    }

    var closeMicroEventForm = function(returnContent) {
	//        debugLog("CloseMicroEventForm called.");
	var somethingChanged = false;
        if(returnContent !== null && returnContent !== undefined){
	    var shadow = returnContent.eventShadow;
	    var microEventList = returnContent.microEventList;
	    
	    for(var i = 0; i < microEventList.length; i++) {
		if(microEventList[i].crf !== null) {
		    for(var j = 0; j < shadow.microEvents.length; j++) {
			if(microEventList[i].id == shadow.microEvents[j].id) {
			    
			    for(var q1 = 0; q1 < microEventList[i].crf.content.length; q1++) {
				for(var q2 = 0; q2 < shadow.microEvents[j].crf.content.length; q2++) {
				    if(microEventList[i].crf.content[q1].pos == shadow.microEvents[j].crf.content[q2].pos) {
					if(microEventList[i].crf.content[q1].answer != shadow.microEvents[j].crf.content[q2].answer) {
					    shadow.microEvents[j].crf.content[q2].answer = microEventList[i].crf.content[q1].answer;
					    somethingChanged = true;
					}
					break;
				    }
				}
			    }
			    break;
			}
		    }
		}
	    }
	    saveTrial();
	}
    };

    var closeListCRFForm = function(returnContent){
	debugLog("closeListCRFForm");
	var somethingChanged = false;
        if(returnContent !== null && returnContent !== undefined){
	    var crfs = returnContent.crfs;
	    var shadow = returnContent.eventShadow;
	    
	    for(var i = 0; i < crfs.length; i++) {
		for(var j = 0; j < shadow.crfs.length; j++) {
		    if(crfs[i].id == shadow.crfs[j].id) {
			debugLog("checking crf " + shadow.crfs[j].name);

			for(var q1 = 0; q1 < crfs[i].content.length; q1++) {
			    for(var q2 = 0; q2 < shadow.crfs[j].content.length; q2++) {
				if(crfs[i].content[q1].pos == shadow.crfs[j].content[q2].pos) {
				    debugLog("checking crf question " + shadow.crfs[j].content[q2].pos);
				    if(crfs[i].content[q1].answer != shadow.crfs[j].content[q2].answer) {
					debugLog("checking crf question, " + shadow.crfs[j].content[q2].answer + " != " + crfs[i].content[q1].answer);
					shadow.crfs[j].content[q2].answer = crfs[i].content[q1].answer;
					somethingChanged = true;
				    } else {
					debugLog("checking crf question, no change (" + shadow.crfs[j].content[q2].answer + ")");
				    }
				    break;
				}
			    }
			}
			break;
		    }
		}
	    }
	    saveTrial();
        } else {
	    //            debugLog("CloseListCRFForm got no result.");
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

    var findParent = function(shadow, root) {
	if(root === null) {
	    return null;
	}

	if(root.templateEvent == shadow.templateEvent.parent) {
	    return root;
	}
	
	var child = null;
	var i = 0;
	for(i = 0; i < root.children.length; i++) {
	    child = root.children[i];
	    var result = findParent(shadow, child);
	    if(result !== null) {
		return result;
	    }
	}
	return null;
    };

    var insertEventInTree = function (shadow) {
	
	var child = null;
	var margin = 1;
	
	if(shadow.templateEvent.parent === null) {
	    shadow.parent = null;
	    if(!shadow.isCurrentlyExceptional) { // should always be true, exceptional events should not be sent here
		currentRoot = shadow;
	    }
    	} else {
    	    // assign parent
	    var parent = findParent(shadow, currentRoot);

    	    shadow.parent = parent;

	    debugLog("pushing child " + shadow.type + "." + shadow.id + " to " + parent.type + "." + parent.id + " with " + parent.children.length + " children.");
	    if(parent.children.length > 0) {
		for(var debugPrintIdx = 0; debugPrintIdx < parent.children.length; debugPrintIdx++) {
		    debugLog("pushing child " + shadow.type + "." + shadow.id + " to " + parent.type + "." + parent.id + ", child " + debugPrintIdx + " = " + parent.children[debugPrintIdx] + ".");
		}
	    }
    	    parent.children.push(shadow);
	}
	//	debugLog("------------------ insert finished: ")
	printTree(currentRoot);
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
	    if(node.children[i].webble !== null) {
		var prot = node.children[i].webble.scope().getProtection();
		var oldProt = prot;
		prot = prot & ~Enum.bitFlags_WebbleProtection.MOVE; // clear the protection flag
		node.children[i].webble.scope().setProtection(prot);
	    }

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
	    
    	    if(node.type == 'ptc') {
		var margin = ptcMargin;
    		node.offsets[i+1][1] = node.offsets[i][1] + node.children[i].totalH + margin;
    	    }
	    
	    if(node.children[i].webble !== null) {
		node.children[i].webble.scope().setProtection(oldProt);
	    }

    	    moveChildren(node.children[i]);
    	}
	
    	if(node.isBranch) {
	    if(node.webble !== null) {
    		node.webble.scope().set('NoOfUnits', node.totalH);
	    }
    	}
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
	    res.id = shadow.id;
	    res.dbId = shadow.dbId;

	    res.template_id = shadow.templateEventId;
	    res.template_dbId = shadow.templateEventDbId;
	    res.patient_id = $scope.gimme("Patient");

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
			    if(i > 0) {
				debugLog("Save event, we have an event with an armrank != 0. This should not happen.");
				debugLog("" + shadow.type + "." + shadow.id + ", " + shadow.parent.type + "." + shadow.parent.id + ", index " + i + " out of " + shadow.parent.children.length);
			    }
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
	    var label = {};
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

	    res.status = "CURRENT"; // what is this?

	    // res.startdatecrfitemtemplate_id = {crf:shadow.startDate.crf, q:shadow.startDate.q}; //fix!
	    // res.enddatecrfitemtemplate_id = {crf:shadow.endDate.crf, q:shadow.endDate.q}; //fix!

	    // CRFs
	    res.crfs = [];
	    for(i = 0; i < shadow.crfs.length; i++) {
		var crf = shadow.crfs[i];
		res.crfs.push({id:crf.id, crfTemplate_id:crf.crfTemplate.id, content:crf.content, crfTemplate:crf.crfTemplate});
	    }

	    // microEvents
	    res.microEvents = [];
	    for(i = 0; i < shadow.microEvents.length; i++) {
		res.microEvents.push({id: shadow.microEvents[i].id, crf: shadow.microEvents[i].crf, day: shadow.microEvents[i].day}); // fix
	    }

	    if(shadow.isCurrentlyExceptional) {
		res.exceptionalDayOffset = shadow.exceptionalDayOffset;
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
	res.patient = $scope.gimme("Patient");

	$scope.set('SavedTrialData', res);

	return res;
    };

    var printStruct = function(res) {
	debugLog("trial: " + res.trial);
	debugLog("patient: " + res.patient);
	for(var i = 0; i < res.events.length; i++) {
	    var e = res.events[i];
	    debugLog("event " + i + " id " + e.id);
	    debugLog("event " + i + " template_id " + e.template_id);
	    debugLog("event " + i + " patient_id " + e.patient_id);
	    debugLog("event " + i + " duration " + e.duration);
	    debugLog("event " + i + " preinterval " + e.preinterval);
	    debugLog("event " + i + " type_id " + e.type_id);
	    debugLog("event " + i + " treatmentelement " + e.treatmentelement);
	    debugLog("event " + i + " treatmentarmlabel " + e.treatmentarmlabel);
	    debugLog("event " + i + " mandatory " + e.mandatory);
	    debugLog("event " + i + " source_id " + e.source_id);
	    debugLog("event " + i + " armrank " + e.armrank);
	    debugLog("event " + i + " parallelrank " + e.parallelrank);
	    debugLog("event " + i + " treatmentarmpath " + e.treatmentarmpath);
	    debugLog("event " + i + " trial_id " + e.trial_id);
	    debugLog("event " + i + " label_id " + e.label_id);
	    debugLog("event " + i + " label.id " + e.label.id);
	    debugLog("event " + i + " label.text " + e.label.text);
	    debugLog("event " + i + " label.color " + e.label.color);
	    debugLog("event " + i + " label.position " + e.label.position);
	    debugLog("event " + i + " label.shape " + e.label.shape);
	    debugLog("event " + i + " status " + e.status);
	    if(e.startdatecrfitemtemplate_id !== null) {
		debugLog("event " + i + " startdatecrfitemtemplate_id.crf " + e.startdatecrfitemtemplate_id.crf);
		debugLog("event " + i + " startdatecrfitemtemplate_id.q " + e.startdatecrfitemtemplate_id.q);
	    }
	    if(e.enddatecrfitemtemplate_id !== null) {
		debugLog("event " + i + " enddatecrfitemtemplate_id.crf " + e.enddatecrfitemtemplate_id.crf);
		debugLog("event " + i + " enddatecrfitemtemplate_id.q " + e.enddatecrfitemtemplate_id.q);
	    }
	    debugLog("event " + i + " exceptionalDayOffset " + e.exceptionalDayOffset);
	    for(var j = 0; j < e.crfs.length; j++) {
		debugLog("event " + i + " crf " + j + " crf " + e.crfs[j].id);
	    }
	    for(j = 0; j < e.microEvents.length; j++) {
		debugLog("event " + i + " microEvent " + j + " id " + e.microEvents[j].id);
		debugLog("event " + i + " microEvent " + j + " crf " + e.microEvents[j].crf);
		debugLog("event " + i + " microEvent " + j + " day " + e.microEvents[j].day);
	    }
	}
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

	$scope.addSlot(new Slot('SavedTrialData',
				{},
				'Saved Trial Data',
				'The data for this trial that we would like to store in the database.',
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
	    if(haveBeenActivated) {
		var newVal = eventData.targetId;

		debugLog("loadingWebble! " + newVal);

		var thisChild = $scope.getWebbleByInstanceId(newVal);
		
		var slots = thisChild.scope().getSlots();
		
		if(slots.hasOwnProperty('MedEventId')) {
		    // this is an event, start tracking it
		    
		    debugLog("TOBpatientboard: found new event! " + newVal);
		    
		    thisChild.scope().paste(myParent); // assign to my parent
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
		myParent.scope().set("grabDropped", false);
		
		// steal all MedEvent children it may already have?

		$scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventDataInner){
		    var newValInner = eventDataInner.childId;
		    if(newValInner !== null && newValInner != myInstanceId) {
			debugLog("myParent.wblEventInfo.gotChild! " + newValInner);
			var thisChild = $scope.getWebbleByInstanceId(newValInner);
			
			var slots = thisChild.scope().getSlots();
			
			if(slots.hasOwnProperty('MedEventId')) {
			    // this is an event, take over as parent
			    
			    //			debugLog("found new event that I should steal! " + newValInner);
			    
			    addEvent(thisChild);
			    
			    // thisChild.scope().peel();
			    // thisChild.scope().paste(myWebble);
			}
		    }
		}, newVal);
	    }
	});


	
	// initializeEventTypeEtc();
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
	    debugLog("Unhandled interaction ball used: " + targetName);
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
	debugLog("Unhandled menu item called: " + itemName);
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


wblwrld3App.controller("listCRFform_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBPatientboard: " + message);
	}
    };

    $scope.formProps = {
	eaType: props.eaType,
	crfs: props.crfs,
	crfList: props.crfList,
	eventShadow: props.eventShadow,
	possibleOpts: [],
	infoMsg: '',
	browser: BrowserDetect.browser
    };

    $scope.close = function (result) {
	debugLog("listCRFfor_Ctrl, close() called");
	if(result == 'close'){
	    $uibModalInstance.close({crfs: $scope.formProps.crfs, eventShadow: $scope.formProps.eventShadow});
	} else {
	    $uibModalInstance.close({crfs: $scope.formProps.crfs, eventShadow: $scope.formProps.eventShadow});
	    // $uibModalInstance.close(null);
	}
    };
    
    $scope.CRFinfo = function(crfID) {
	debugLog("CRFinfo called");
	var idx = 0;

	var notFound = true;
	for(var j = 0; j < $scope.formProps.crfList.length; j++) {
	    //	    debugLog("CRFinfo check idx " + j);
	    if($scope.formProps.crfList[j].id == crfID) {
		idx = j;
		notFound = false;
		debugLog("CRFinfo found CRF with id " + crfID);
		break;
	    }
	}

	var instanceIdx = 0;
	for(j = 0; j < $scope.formProps.crfs.length; j++) {
	    if($scope.formProps.crfs[j].crfTemplate.id == $scope.formProps.crfList[idx].id) {
		instanceIdx = j;
		debugLog("CRFinfo found CRF instance with template id " + crfID);
	    }
	}

	var content = [];
	for(var i = 0; i < $scope.formProps.crfs[instanceIdx].content.length; i++) {
	    for(j = 0; j < $scope.formProps.crfList[idx].content.length; j++) {
		if($scope.formProps.crfs[instanceIdx].content[i].pos == $scope.formProps.crfList[idx].content[j].pos) {
		    var htmlType = "text";
		    if($scope.formProps.crfList[idx].content[j].type == "Date") {
			htmlType = "datetime-local";
		    }
		    if($scope.formProps.crfList[idx].content[j].type == "Number") {
			htmlType = "number";
		    }
		    content.push( {'pos': $scope.formProps.crfs[instanceIdx].content[i].pos, 'question': $scope.formProps.crfList[idx].content[j].question, 'answer':$scope.formProps.crfs[instanceIdx].content[i].answer, 'type':$scope.formProps.crfList[idx].content[j].type, 'htmlType':htmlType} );
		    
		    debugLog("CRFinfo push " + 'pos' + $scope.formProps.crfs[instanceIdx].content[i].pos + ', question=' + $scope.formProps.crfList[idx].content[j].question + ', answer=' + $scope.formProps.crfs[instanceIdx].content[i].answer + ', type=' + $scope.formProps.crfList[idx].content[j].type );
		    
		    break;
		}
	    }
	}

	if(notFound) {
	    debugLog("ERROR in Attach CRF. CRF with ID " + id + " requested, but no such CRF is available in this trial.");
	} else {
	    //	    debugLog("CRFinfo open info form");
	    props.wblScope.openForm('viewCRFForm', [{templateUrl: 'viewCRFform.html', controller: 'viewCRFform_Ctrl', size: 'lg'}, {wblScope: props.wblScope, instanceIdx:instanceIdx, content:content, clickedIdx: idx, title:$scope.formProps.crfList[idx].name}], closeViewCRFForm);
	}
    };

    var closeViewCRFForm = function(returnContent){
	debugLog("CloseViewCRFForm called.");
	
        if(returnContent !== null && returnContent !== undefined){
	    var instanceIdx = returnContent.instanceIdx;
	    var content = returnContent.content;
	    
	    var oldContent = $scope.formProps.crfs[instanceIdx].content;
	    
	    for(var i = 0; i < oldContent.length; i++) {
		for(var j = 0; j < content.length; j++) {
		    if(content[j].pos == oldContent[i].pos) {
			debugLog("crf pos " + oldContent[i].pos + ", old value = " + oldContent[i].answer + ", new value " + content[j].answer);
			oldContent[i].answer = content[j].answer;
		    }
		}
	    }
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


wblwrld3App.controller("viewCRFform_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBPatientboard: " + message);
	}
    };

    $scope.formProps = {
	eaType: props.eaType,
	content: props.content,
	clickedIdx: props.clickedIdx,
	instanceIdx: props.instanceIdx,
	title: props.title,
	possibleOpts: [],
	infoMsg: '',
	browser: BrowserDetect.browser
    };

    $scope.close = function (result) {
	if(result == 'close'){
	    $uibModalInstance.close({content:$scope.formProps.content, instanceIdx: $scope.formProps.instanceIdx, clickedIdx: $scope.formProps.clickedIdx});
	} else {
	    $uibModalInstance.close({content:$scope.formProps.content, instanceIdx: $scope.formProps.instanceIdx, clickedIdx: $scope.formProps.clickedIdx});
	}
    };
    //========================================================================================
    
});

//========================================================================================




wblwrld3App.controller("microEventForm_Ctrl", function($scope, $log, $uibModalInstance, Slot, Enum, props, menuItemsFactoryService) {
    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBPatientboard: " + message);
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

    $scope.close = function (result) {
	debugLog("microEventForm.close() called");

	if(result == 'close'){
	    $uibModalInstance.close({microEventList: $scope.formProps.microEventList, eventShadow: $scope.formProps.eventShadow});
	} else {
	    $uibModalInstance.close({microEventList: $scope.formProps.microEventList, eventShadow: $scope.formProps.eventShadow});
	    // $uibModalInstance.close(null);
	}
    };
    
    $scope.CRFinfo = function(microEventId) {	
	//	debugLog("MicroEvent CRFinfo called");
	var idx = 0;
	var crfID = 0;
	var instanceIdx = 0;

	for(var j = 0; j < $scope.formProps.microEventList.length; j++) {
	    if($scope.formProps.microEventList[j].id == microEventId) {
		instanceIdx = j;
		crfID = $scope.formProps.microEventList[j].crf.crfTemplate.id;
		break;
	    }
	}

	var notFound = true;
	for(var j = 0; j < $scope.formProps.crfList.length; j++) {
	    if($scope.formProps.crfList[j].id == crfID) {
		idx = j;
		notFound = false;
		break;
	    }
	}

	var content = [];
	for(var i = 0; i < $scope.formProps.microEventList[instanceIdx].crf.content.length; i++) {
	    for(j = 0; j < $scope.formProps.crfList[idx].content.length; j++) {
		if($scope.formProps.microEventList[instanceIdx].crf.content[i].pos == $scope.formProps.crfList[idx].content[j].pos) {
		    var htmlType = "text";
		    if($scope.formProps.crfList[idx].content[j].type == "Date") {
			htmlType = "datetime-local";
		    }
		    if($scope.formProps.crfList[idx].content[j].type == "Number") {
			htmlType = "number";
		    }
		    content.push( {'pos': $scope.formProps.microEventList[instanceIdx].crf.content[i].pos, 'question': $scope.formProps.crfList[idx].content[j].question, 'answer':$scope.formProps.microEventList[instanceIdx].crf.content[i].answer, 'type':$scope.formProps.crfList[idx].content[j].type, 'htmlType':htmlType} );
		    break;
		}
	    }
	}


	if(notFound) {
	    debugLog("ERROR in Attach CRF. CRF with ID " + id + " requested, but no such CRF is available in this trial.");
	} else {
	    props.wblScope.openForm('viewCRFForm', [{templateUrl: 'viewCRFform.html', controller: 'viewCRFform_Ctrl', size: 'lg'}, {wblScope: props.wblScope, instanceIdx:instanceIdx, clickedCRFidx:idx, content:content, title:$scope.formProps.crfList[idx].name}], closeViewCRFForm);
	}
    };

    var closeViewCRFForm = function(returnContent){
	debugLog("CloseViewCRFForm (microEvents) called.");
	
        if(returnContent !== null && returnContent !== undefined){
	    var instanceIdx = returnContent.instanceIdx;
	    var content = returnContent.content;
	    
	    var oldContent = $scope.formProps.microEventList[instanceIdx].crf.content;
	    
	    for(var i = 0; i < oldContent.length; i++) {
		for(var j = 0; j < content.length; j++) {
		    if(content[j].pos == oldContent[i].pos) {
			oldContent[i].answer = content[j].answer;
		    }
		}
	    }
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
