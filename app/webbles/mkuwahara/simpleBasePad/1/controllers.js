//======================================================================================================================
// Controllers for Base Pad for Webble World v3.0 (2013)
// Created By: TrueMrWalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('simpleBasePadCtrl', function($scope, $log, $timeout, Slot, Enum, valMod) {
    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		basePadFoundation: ['width', 'height', 'background-color', 'border', 'border-radius'],
		basePadTitle: ['color', 'font-family', 'font-size', 'font-weight']
    };

	$scope.customMenu = [{itemId: 'manageSlotConn', itemTxt: 'Manage Child Slot Connections'}];
	$scope.addPopupMenuItemDisabled('manageSlotConn');

    $scope.wblStyles = {
    	txtAlign: "left",
		lineHeight: "1em",
		position: "relative",
		left: 0,
		marginLeft: 0,
		overflow: 'hidden'
	};

    var textPosOptions = ['Top Left', 'Top Center', 'Top Right', 'Center Left', 'Center Center', 'Center Right', 'Bottom Left', 'Bottom Center', 'Bottom Right'];
	var clippingOptions = ['None', 'Hidden', 'Scroll'];
	var slotConnRequestType = {byMenu: 0, byIO: 1};
    var originalWblChildContainer, basePadTitle, basePadFoundation;
	var indexSortedChildren = [];
	var blockChildMoveReaction = true;
	var pendingSlotConn = {
		first: undefined,
		target: undefined
	};
	var activeSlotConns = [];
	var oldiesExist = false;


    //$scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];


    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		originalWblChildContainer = $scope.getChildContainer();
		basePadTitle = $scope.theView.parent().find("#basePadTitle");
		basePadFoundation = $scope.theView.parent().find("#basePadFoundation");

		// Create a mouse click event handler
		basePadFoundation.bind('vmousedown', function(event, ui){
			if(pendingSlotConn.first != undefined){
				$scope.showQIM("", 0);
				$scope.openForm('CSCMForm', [{templateUrl: 'child-slotconn-manager-form.html', controller: 'CSCMForm_Ctrl', size: 'lg', backdrop: 'static'}, {newSlotRequest: pendingSlotConn, asc: activeSlotConns}], closeCSCMForm);
			}
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.targetId == $scope.getInstanceId()){
				if(eventData.slotName == 'basePadTextPos'){
					positionTheText(textPosOptions[eventData.slotValue]);
				}
				else if(eventData.slotName == 'basePadFoundation:height' || eventData.slotName == 'basePadTitle:font-size' || eventData.slotName == 'basePadTitle:font-weight' || eventData.slotName == 'basePadTitle:font-family'){
					positionTheText(textPosOptions[$scope.gimme("basePadTextPos")]);
				}
				else if(eventData.slotName == 'horizontalAlignChildren' || eventData.slotName == 'verticalAlignChildren' || eventData.slotName == 'childrenXYPadding' ||  eventData.slotName == 'prioVertical'){
					$timeout(function(){ alignChildren(); });
				}
				else if(eventData.slotName == 'basePadFoundation:width'){
					if($scope.gimme("verticalAlignChildren") && $scope.gimme("horizontalAlignChildren")){
						alignChildren();
					}
				}
				else if(eventData.slotName == 'parentClipping'){
					var newContainer = originalWblChildContainer;
					if(eventData.slotValue > 0){
						newContainer = basePadFoundation;
						if(eventData.slotValue == 1){ $scope.wblStyles.overflow = 'hidden'; }
						else{ $scope.wblStyles.overflow = 'auto'; }
					}
					else{ $scope.wblStyles.overflow = 'visible'; }
					if($scope.getChildContainer() !== newContainer){
						$scope.setChildContainer(newContainer);
						for(var i = 0, c; c = $scope.getChildren()[i]; i++){
							$scope.getChildContainer().append(c.scope().theView.parent());
						}
					}
				}
				else if(eventData.slotName == 'enableWildWestSpaghetti'){
					if(eventData.slotValue){
						configChildrenForUnrestrictedSlotConn();
						$scope.removePopupMenuItemDisabled("manageSlotConn");
					}
					else{
						unConfigChildrenForUnrestrictedSlotConn();
						$scope.addPopupMenuItemDisabled('manageSlotConn');
						activeSlotConns = [];
					}
				}
			}
			else{
				var alteredChild = $scope.getWebbleByInstanceId(eventData.targetId);
				if(alteredChild && alteredChild.scope().getParent() != undefined && alteredChild.scope().getParent().scope().getInstanceId() == $scope.getInstanceId()){
					if(eventData.slotName == 'basePadChildIndex'){
						var pushMod = (alteredChild.scope().basePadTracker) ? ((alteredChild.scope().gimme("basePadChildIndex") < alteredChild.scope().basePadTracker.index) ? 1 : (-1)) : 0;
						for(var i = 0, c; c = $scope.getChildren()[i]; i++){
							if(c.scope().gimme("basePadChildIndex") == eventData.slotValue && eventData.targetId != c.scope().getInstanceId()){
								c.scope().getSlot("basePadChildIndex").setValue(eventData.slotValue + pushMod);
								break;
							}
						}
						sortChildrenByIndex();
						if($scope.gimme("verticalAlignChildren") || $scope.gimme("horizontalAlignChildren")){
							alignChildren();
						}
					}
					else if(!blockChildMoveReaction && (eventData.slotName == 'root:left' || eventData.slotName == 'root:top')){
						if($scope.gimme("verticalAlignChildren") || $scope.gimme("horizontalAlignChildren")){
							var newIndex = ((parseInt(alteredChild.scope().gimme(eventData.slotName))- alteredChild.scope().basePadTracker.pos[((eventData.slotName == 'root:left') ? 0 : 1)]) < 0) ? 0 : ($scope.getChildren().length + 1);
							if(alteredChild.scope().basePadTracker && alteredChild.scope().basePadTracker.index > 0){
								alteredChild.scope().getSlot("basePadChildIndex").setValue(newIndex);
								$timeout(function(){ sortChildrenByIndex(); alignChildren(); });
							}
						}
						else{
							alteredChild.scope().basePadTracker.pos = [parseInt(alteredChild.scope().gimme("root:left")), parseInt(alteredChild.scope().gimme("root:top"))];
						}
					}

					childSlotConnComunication();
				}
			}
		}, null);


		$scope.addSlot(new Slot('enableWildWestSpaghetti',
			false,
			'Enable Unrestricted Slot Communication',
			'If marked this will allow all Child Webbles to communicate any number of slots with any other sibling freely without parent child relationship. \nThis goes against the Meme Media Concept and very likely causes spaghetti issues and becomed hard to follow and maintain. This feature is implemented for the purpose to compare Meme Media strategy with lack of strategy.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.addSlot(new Slot('basePadText',
            "Base Pad Child Controller",
            'Text',
            'Text displayed on the base pad webble',
			"BasePad Text",
            undefined,
            undefined
        ));

		$scope.addSlot(new Slot('basePadTextPos',
			0,
			'Text Position',
			'The position of the text in the basePad',
			"BasePad Text",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: textPosOptions},
			undefined
		));

		$scope.addSlot(new Slot('childrenXYPadding',
			[10,10],
			'Children Padding',
			'The padding distance horizontal (x) and vertical (y) between children when the are aligned',
			"Children Positioning",
			{inputType: Enum.aopInputTypes.Point},
			undefined
		));

		$scope.addSlot(new Slot('horizontalAlignChildren',
			false,
			'Horizontal Align Children Enabled',
			'When checked the children will be aligned horizontally',
			"Children Positioning",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('verticalAlignChildren',
			false,
			'Verical Align Children Enabled',
			'When checked the children will be aligned vertically',
			"Children Positioning",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('prioVertical',
			false,
			'Vertical Priority',
			'When not checked the children will be aligned from left to right first, if checked the from top to bottom first, using the size of the parent as reference',
			"Children Positioning",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('parentClipping',
			0,
			'Parent Clipping',
			'When checked the children will be constrained to be within the parents area only and those outside will be clipped',
			"Children Positioning",
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: clippingOptions},
			undefined
		));

		if(theInitWblDef.private.childrenSlotConns){
			for(var i = 0, csc; csc = theInitWblDef.private.childrenSlotConns[i]; i++ ){
				var oldSlotConn = {
					uid: csc.uid,
					wbl1Id: csc.wbl1Id,
					wbl1Pntr: undefined,
					wbl1Slot: csc.wbl1Slot,
					wbl2Id: csc.wbl2Id,
					wbl2Pntr: undefined,
					wbl2Slot: csc.wbl2Slot,
					wbl1Dirs: csc.wbl1Dirs
				};
				activeSlotConns.push(oldSlotConn);
				oldiesExist = true;
			}
		}

        $scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){
			var newChild = $scope.getWebbleByInstanceId(eventData.childId);
			newChild.scope().basePadTracker = {index: -1, pos: [parseInt(newChild.scope().gimme("root:left")), parseInt(newChild.scope().gimme("root:top"))]};
			var prevIndex = newChild.scope().gimme("basePadChildIndex");
			if(!prevIndex){
				newChild.scope().addSlot(new Slot("basePadChildIndex",
					$scope.getChildren().length,
					"BasePad Child Index",
					"This is a index value given to this Webble by its basepad parent to keep track of it.",
					"basePad Parent Tracking",
					undefined
				));
			}
			else{ newChild.scope().getSlot("basePadChildIndex").setIsCustomMade(false); }
			sortChildrenByIndex();

			if($scope.gimme("verticalAlignChildren") || $scope.gimme("horizontalAlignChildren")){
				$timeout(function(){ alignChildren(); });
			}

			if($scope.gimme("enableWildWestSpaghetti")){
				configChildFUSC(newChild);
			}
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.lostChild, function(eventData){
			var oldChild = $scope.getWebbleByInstanceId(eventData.childId);
			oldChild.scope().removeSlot("basePadChildIndex");
			oldChild.scope().removeSlot("ownIOFunc");
			oldChild.scope().removeSlot("ownCustomMenuFunc");
			valMod.findAndRemoveValueInArray(indexSortedChildren, oldChild);
			sortChildrenByIndex();
			if($scope.gimme("verticalAlignChildren") || $scope.gimme("horizontalAlignChildren")){
				oldChild.scope().set("root:left", parseInt(oldChild.scope().gimme("root:left"))+ 20);
				oldChild.scope().set("root:top", parseInt(oldChild.scope().gimme("root:top"))+ 20);
				$timeout(function(){ alignChildren(); });
			}

			if($scope.gimme("enableWildWestSpaghetti")){
				unConfigChildFUSC(oldChild);
			}
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.duplicated, function(eventData){
			var isOneOfMine = false;
			for(var i = 0, c; c = $scope.getChildren()[i]; i++){
				if(c.scope().getInstanceId() == eventData.targetId){
					isOneOfMine = true;
					break;
				}
			}
			if(isOneOfMine){
				var theCopy = $scope.getWebbleByInstanceId(eventData.copyId);
				theCopy.scope().removeSlot("basePadChildIndex");
				theCopy.scope().removeSlot("ownIOFunc");
				theCopy.scope().removeSlot("ownCustomMenuFunc");
			}
		}, null);

		$timeout(function(){ blockChildMoveReaction = false; }, 2000);
    };
    //===================================================================================


	//===================================================================================
	// Sort Children By Index
	// orders the list of children by index (that was assigned as the child was pasted)
	//===================================================================================
	var sortChildrenByIndex = function(){
		indexSortedChildren = $scope.getChildren();
		indexSortedChildren.sort(function(a,b) {return (a.scope().gimme("basePadChildIndex") > b.scope().gimme("basePadChildIndex")) ? 1 : ((b.scope().gimme("basePadChildIndex") > a.scope().gimme("basePadChildIndex")) ? -1 : 0);} );

		for(var i = 0, c; c = indexSortedChildren[i]; i++) {
			if(c.scope().gimme("basePadChildIndex") != (i + 1)){
				c.scope().set("basePadChildIndex", (i + 1));
			}
			if(c.scope().basePadTracker){c.scope().basePadTracker.index = c.scope().gimme("basePadChildIndex");}
		}

		return indexSortedChildren;
	};
	//===================================================================================


	//===================================================================================
	// Align Children
	//===================================================================================
	var alignChildren = function(){
		blockChildMoveReaction = true;
		var isVert = $scope.gimme("verticalAlignChildren");
		var isHor = $scope.gimme("horizontalAlignChildren");
		var isVertPrio = $scope.gimme("prioVertical");
		var padding = $scope.gimme("childrenXYPadding");//[parseInt($scope.gimme("childrenXYPadding")[0]), parseInt($scope.gimme("childrenXYPadding")[1])];
		var currentLeft = padding[0];
		var currentTop = padding[1];

		if(isHor && !isVert){
			for(var i = 0, c; c = indexSortedChildren[i]; i++){
				if(!c.scope().getResizeSlots().width){ displayBubbleText(c, "I do not have any accurate width or height so I will be ignored"); continue; }
				c.scope().set("root:left", currentLeft);
				c.scope().set("root:top", padding[1]);
				c.scope().basePadTracker.pos = [parseInt(c.scope().gimme("root:left")), parseInt(c.scope().gimme("root:top"))];
				currentLeft += (parseInt(c.scope().gimme(c.scope().getResizeSlots().width)) + padding[0]);
			}
		}
		else if(!isHor && isVert){
			for(var i = 0, c; c = indexSortedChildren[i]; i++){
				if(!c.scope().getResizeSlots().height){ displayBubbleText(c, "I do not have any accurate width or height so I will be ignored"); continue; }
				c.scope().set("root:top", currentTop);
				c.scope().set("root:left", padding[0]);
				c.scope().basePadTracker.pos = [parseInt(c.scope().gimme("root:left")), parseInt(c.scope().gimme("root:top"))];
				currentTop += (parseInt(c.scope().gimme(c.scope().getResizeSlots().height)) + padding[1]);
			}
		}
		else if(isHor && isVert && !isVertPrio){
			var topCHeight = 0;
			for(var i = 0, c; c = indexSortedChildren[i]; i++){
				if(!c.scope().getResizeSlots().width || !c.scope().getResizeSlots().height){ displayBubbleText(c, "I do not have any accurate width or height so I will be ignored"); continue; }
				if(currentLeft > padding[0] && (currentLeft + parseInt(c.scope().gimme(c.scope().getResizeSlots().width)) > parseInt($scope.gimme("basePadFoundation:width")))){
					currentLeft = padding[0];
					currentTop += (topCHeight + padding[1]);
					topCHeight = 0;
				}
				c.scope().set("root:left", currentLeft);
				c.scope().set("root:top", currentTop);
				c.scope().basePadTracker.pos = [parseInt(c.scope().gimme("root:left")), parseInt(c.scope().gimme("root:top"))];
				currentLeft += (parseInt(c.scope().gimme(c.scope().getResizeSlots().width)) + padding[0]);
				var cHeight = parseInt(c.scope().gimme(c.scope().getResizeSlots().height));
				if(cHeight > topCHeight){ topCHeight = cHeight; }
			}
		}
		else if(isHor && isVert && isVertPrio){
			var topCWidth = 0;
			for(var i = 0, c; c = indexSortedChildren[i]; i++){
				if(!c.scope().getResizeSlots().width || !c.scope().getResizeSlots().height){ displayBubbleText(c, "I do not have any accurate width or height so I will be ignored"); continue; }
				if(currentTop > padding[1] && (currentTop + parseInt(c.scope().gimme(c.scope().getResizeSlots().height)) > parseInt($scope.gimme("basePadFoundation:height")))){
					currentTop = padding[1];
					currentLeft += (topCWidth + padding[0]);
					topCWidth = 0;
				}
				c.scope().set("root:left", currentLeft);
				c.scope().set("root:top", currentTop);
				c.scope().basePadTracker.pos = [parseInt(c.scope().gimme("root:left")), parseInt(c.scope().gimme("root:top"))];
				currentTop += (parseInt(c.scope().gimme(c.scope().getResizeSlots().height)) + padding[1]);
				var cWidth = parseInt(c.scope().gimme(c.scope().getResizeSlots().width));
				if(cWidth > topCWidth){ topCWidth = cWidth; }
			}
		}
		$timeout(function(){ blockChildMoveReaction = false; });
	};
	//===================================================================================


	//========================================================================================
	// Config Children For Unrestricted Slot Connection
	//========================================================================================
	var configChildrenForUnrestrictedSlotConn = function(){
		for(var i = 0, c; c = $scope.getChildren()[i]; i++){
			configChildFUSC(c);
		}
	};
	//========================================================================================


	//========================================================================================
	// Config Child For Unrestricted Slot Connection
	// this emthods configs the provided children for unrestricted slot conns
	//========================================================================================
	var configChildFUSC = function(c){
		//Create a IO ball for this child
		var prevFunc = c.scope().gimme("ownIOFunc");
		if(!prevFunc){
			c.scope().addSlot(new Slot("ownIOFunc",
				c.scope().theView.scope().coreCall_Event_InteractionObjectActivityReaction,
				"This Webbles IO Funcion",
				"This is memory slot for a Webble to remember its own custom IO behavior.",
				"basePad Parent Tracking",
				undefined
			));
		}
		else{
			c.scope().getSlot("ownIOFunc").setValue(c.scope().theView.scope().coreCall_Event_InteractionObjectActivityReaction);
			c.scope().getSlot("ownIOFunc").setIsCustomMade(false);
		}
		c.scope().getSlot('ownIOFunc').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		c.scope().theView.scope().coreCall_Event_InteractionObjectActivityReaction = function(event){
			childSlotConnMenuIOExecuted(slotConnRequestType.byIO, $scope.getWebbleByInstanceId($(event.target.offsetParent).scope().getInstanceId()), $(event.target).scope().getName(), event);
		};

		var ioIndex = 11;
		if(c.scope().theInteractionObjects[11].scope().getName() != ""){
			for(var n = (c.scope().theInteractionObjects.length - 1), io; io = c.scope().theInteractionObjects[n]; n--){
				if(io.scope().getName() == ""){
					ioIndex = n;
				}
			}
		}

		c.scope().theInteractionObjects[ioIndex].scope().setName("connectSpaghettiSlots");
		c.scope().theInteractionObjects[ioIndex].scope().tooltip = "Slot Connection";
		c.scope().theInteractionObjects[ioIndex].scope().setIsEnabled(true);

		// Create a menu Item for this child
		var prevFunc = c.scope().gimme("ownCustomMenuFunc");
		if(!prevFunc){
			c.scope().addSlot(new Slot("ownCustomMenuFunc",
				c.scope().theView.scope().coreCall_Event_WblMenuActivityReaction,
				"This Webbles Custom Menu Function",
				"This is memory slot for a Webble to remember its own custom menu behavior.",
				"basePad Parent Tracking",
				undefined
			));
		}
		else{
			c.scope().getSlot("ownCustomMenuFunc").setValue(c.scope().theView.scope().coreCall_Event_WblMenuActivityReaction);
			c.scope().getSlot("ownCustomMenuFunc").setIsCustomMade(false);
		}
		c.scope().getSlot('ownCustomMenuFunc').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

		c.scope().theView.scope().coreCall_Event_WblMenuActivityReaction = function(itemName){
			childSlotConnMenuIOExecuted(slotConnRequestType.byMenu, $scope.getWebbleByInstanceId($(this)[0].$parent.getInstanceId()), itemName);
		};

		if(!c.scope().customMenu){ c.scope().customMenu = []; }
		c.scope().customMenu.push({itemId: 'connectSpaghettiSlots', itemTxt: 'Slot Connection'});
		c.scope().addPopupMenuItemDisabled('ConnectSlots');

		// Create a mouse click event handler
		c.scope().theView.bind('vmousedown', function(event, ui){
			if(pendingSlotConn.first != undefined){
				pendingSlotConn.second = $scope.getWebbleByInstanceId($(event.target).scope().getInstanceId());
				pendingSlotConn.second.scope().activateBorder(true, "#ff5afb", 3, "dotted", true);
				$scope.showQIM("", 0);
				$scope.openForm('CSCMForm', [{templateUrl: 'child-slotconn-manager-form.html', controller: 'CSCMForm_Ctrl', size: 'lg', backdrop: 'static'}, {newSlotRequest: pendingSlotConn, asc: activeSlotConns}], closeCSCMForm);
			}
		});

		if(oldiesExist){
			var noOfUndefinedDiscoveries = 0;
			for(var i = 0; i < activeSlotConns.length; i++){
				if(activeSlotConns[i].wbl1Pntr == undefined || activeSlotConns[i].wbl2Pntr == undefined){
					noOfUndefinedDiscoveries++;
					if(activeSlotConns[i].wbl1Pntr == undefined){
						if(activeSlotConns[i].wbl1Id == c.scope().theWblMetadata['instanceid']){
							activeSlotConns[i].wbl1Id = c.scope().getInstanceId();
							activeSlotConns[i].wbl1Pntr = c;
						}
					}

					if(activeSlotConns[i].wbl2Pntr == undefined){
						if(activeSlotConns[i].wbl2Id == c.scope().theWblMetadata['instanceid']){
							activeSlotConns[i].wbl2Id = c.scope().getInstanceId();
							activeSlotConns[i].wbl2Pntr = c;
						}
					}
				}
			}
			if(noOfUndefinedDiscoveries == 0){ oldiesExist = false; }
		}
	};
	//========================================================================================


	//========================================================================================
	// Child Slot Connection Menu IO Executed
	//========================================================================================
	var childSlotConnMenuIOExecuted = function(whatFireType, whatWbl, whatItem, whatIOEvent){
		if (whatItem == "connectSpaghettiSlots"){
			pendingSlotConn.first = whatWbl;
			whatWbl.scope().activateBorder(true, "#ff5afb", 3, "dotted", true);
			$scope.showQIM("Click target webble to create new Slot connection or click basePad Webble for manage/view existing connections", 5000);
		}

		if(whatFireType == slotConnRequestType.byIO && whatWbl.scope().gimme("ownIOFunc")){
			whatWbl.scope().gimme("ownIOFunc")(whatIOEvent);
		}
		else if(whatWbl.scope().gimme("ownCustomMenuFunc")){
			whatWbl.scope().gimme("ownCustomMenuFunc")(whatItem);
		}
	};
	//========================================================================================


	//========================================================================================
	// Un-Config Children For Unrestricted Slot Connection
	//========================================================================================
	var unConfigChildrenForUnrestrictedSlotConn = function(){
		for(var i = 0, c; c = $scope.getChildren()[i]; i++){
			unConfigChildFUSC(c);
		}
	};
	//========================================================================================


	//========================================================================================
	// Un-Config Children For Unrestricted Slot Connection
	//========================================================================================
	var unConfigChildFUSC = function(c){
		//Remove IO ball for this child
		for(var n = (c.scope().theInteractionObjects.length - 1), io; io = c.scope().theInteractionObjects[n]; n--){
			if(io.scope().getName() == "connectSpaghettiSlots"){
				io.scope().setName("");
				io.scope().tooltip = "";
				io.scope().setIsEnabled(false);
				break;
			}
		}
		c.scope().theView.scope().coreCall_Event_InteractionObjectActivityReaction = c.scope().gimme("ownIOFunc");
		c.scope().removeSlot("ownIOFunc");

		// Remove menu Item for every child
		if(c.scope().customMenu){
			for(var n = 0; n < c.scope().customMenu.length; n++){
				if(c.scope().customMenu[n].itemId == 'connectSpaghettiSlots'){
					c.scope().customMenu.splice(n, 1);
					break;
				}
			}
		}
		c.scope().removePopupMenuItemDisabled('ConnectSlots');
		if(typeof c.scope().gimme("ownCustomMenuFunc") == 'function'){
			c.scope().theView.scope().coreCall_Event_WblMenuActivityReaction = c.scope().gimme("ownCustomMenuFunc");
		}
		else{
			c.scope().theView.scope().coreCall_Event_WblMenuActivityReaction = undefined;
		}

		c.scope().removeSlot("ownCustomMenuFunc");
	};
	//========================================================================================


	//========================================================================================
	// display Bubble text
	// this method display provided bubble text for the webble provided as parameter.
	//========================================================================================
	var displayBubbleText = function(whatWbl, whatTxt){
		if ((parseInt(whatWbl.scope().getWebbleConfig(), 10) & parseInt(Enum.bitFlags_WebbleConfigs.NoBubble, 10)) == 0){
			$scope.setBubbleTxt(whatTxt);
			var absPos = whatWbl.scope().getWblAbsPosInPixels(whatWbl.scope().theView);
			$scope.setBubbleTxtPos({x: absPos.x, y: absPos.y}, whatWbl.scope().theView);
			$scope.setBubbleTxtVisibility(true, 3500);
		}
	};
	//========================================================================================


	//========================================================================================
	// Execute All Slot Connection Comunication
	// this method iterates all slot connections and make sure all slots are set ackordingly
	// and have communicated latest value.
	//========================================================================================
	var childSlotConnComunication = function(){
		for(var i = 0; i < activeSlotConns.length; i++){

		}
	};
	//========================================================================================


	//========================================================================================
	// Close Child Slot Conn Manager Form
	//========================================================================================
	var closeCSCMForm = function(returnContent){
		if(Object.prototype.toString.call( returnContent ) === '[object Array]'){
			activeSlotConns = returnContent;
			childSlotConnComunication();
		}
		if(pendingSlotConn.first){ pendingSlotConn.first.scope().activateBorder(false); pendingSlotConn.first = undefined; }
		if(pendingSlotConn.second){ pendingSlotConn.second.scope().activateBorder(false); pendingSlotConn.second = undefined; }
	};
	//========================================================================================


	//===================================================================================
	// Position The Text
	//===================================================================================
	var positionTheText = function(pos){
		$scope.wblStyles.lineHeight = "1em";
		$scope.wblStyles.position = "relative";
		$scope.wblStyles.left = 0;
		$scope.wblStyles.marginLeft = 0;
		switch (pos){
			case 'Top Left':
				$scope.wblStyles.txtAlign = "left";
				break;
			case 'Top Center':
				$scope.wblStyles.txtAlign = "center";
				break;
			case 'Top Right':
				$scope.wblStyles.txtAlign = "right";
				break;
			case 'Center Left':
				$scope.wblStyles.txtAlign = "left";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Center Center':
				$scope.wblStyles.txtAlign = "center";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Center Right':
				$scope.wblStyles.txtAlign = "right";
				$scope.wblStyles.lineHeight = (parseInt($scope.gimme("basePadFoundation:height")) - 40) + "px";
				break;
			case 'Bottom Left':
				$scope.wblStyles.txtAlign = "left";
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.marginLeft = "7px";
				break;
			case 'Bottom Center':
				$scope.wblStyles.txtAlign = "center";
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.left = "50%";
				$scope.wblStyles.marginLeft = "-50%";
				break;
			case 'Bottom Right':
				$scope.wblStyles.txtAlign = "right";
				$scope.wblStyles.position = "absolute";
				$scope.wblStyles.left = "100%";
				$scope.wblStyles.marginLeft = "-101%";
				break;
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
            //=== [TARGET NAME] ====================================
            //if (targetName == $scope.customInteractionBalls[0].name){
            //    [CODE FOR MOUSE DOWN]
            //    $scope.theView.mouseup(function(event){
            //        [CODE FOR MOUSE UP]
            //    });
            //    $scope.theView.mousemove(function(event){
            //        [CODE FOR MOUSE MOVE]
            //    });
            //}
            //=============================================

            //=== Jump ====================================
            // EXAMPLE:
            // if (targetName == $scope.customInteractionBalls[0].name){ //jump
            //     $scope.set('root:left', 0);
            //     $scope.set('root:top', 0);
            // }
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
        if(itemName == $scope.customMenu[0].itemId){  //manageSlotConn
			$scope.openForm('CSCMForm', [{templateUrl: 'child-slotconn-manager-form.html', controller: 'CSCMForm_Ctrl', size: 'lg', backdrop: 'static'}, {newSlotRequest: pendingSlotConn, asc: activeSlotConns}], closeCSCMForm);
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
    	var slimASC = [];
		for(var i = 0; i < activeSlotConns.length; i++){
			slimASC.push({
				uid: activeSlotConns[i].uid,
				wbl1Id: activeSlotConns[i].wbl1Id,
				wbl1Slot: activeSlotConns[i].wbl1Slot,
				wbl2Id: activeSlotConns[i].wbl2Id,
				wbl2Slot: activeSlotConns[i].wbl2Slot,
				wbl1Dirs: activeSlotConns[i].wbl1Dirs
			})
		}

        var customWblDefPart = {
			childrenSlotConns: slimASC
        };

        return customWblDefPart;
    };
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================

//=======================================================================================
// EVENT ACTION MAIN FORM CONTROLLER
// This is the controller for this Webbles Event Action Manager Form
//=======================================================================================
wblwrld3App.controller('CSCMForm_Ctrl', function($scope, $log, $uibModalInstance, $timeout, Slot, Enum, isEmpty, props) {
	var slotConnRequestData = props.newSlotRequest;
	var activeSlotConns = props.asc;

	$scope.formProps = {
		wblData: {
			first: {
				name : (slotConnRequestData.first) ? slotConnRequestData.first.scope().getWebbleFullName() : "",
				slots: [{key: 'none', name: "None", cat: '', val: 'none'}],
				selectedSlot: "none",
				slotConnDir: {
					send: false,
					receive: false
				}
			},
			second: {
				name : (slotConnRequestData.second) ? slotConnRequestData.second.scope().getWebbleFullName() : "",
				slots: [{key: 'none', name: "None", cat: '', val: 'none'}],
				selectedSlot: "none"
			}
		},
		infoTooltips: {
			slots1: "Select the slot to cennect for the first Webble",
			slots2: "Select the slot to cennect for the second Webble",
			slotDir: "The directions any change of slot values will be communicated",
			slotConns: "Current active slot connections, previously created for the Webbles in question (color marked)",
			delete: "Deletes this slot connection"
		},
		asc: [],
		info: ""
	};


	//========================================================================================
	// Adjust Tooltip Placement By Device Width
	// the placement of the tooltip is by default at the bottom, but with smaller devices in
	// some rare cases that should be set to right instead.
	//========================================================================================
	$scope.adjustTooltipPlacementByDeviceWidth = function(){
		if($(document).width() < 410){
			return 'right';
		}
		else{
			return 'left';
		}
	};
	//========================================================================================


	//========================================================================================
	// Delete Slot Connection Request
	// Deletes the slot conn provided as argument.
	//========================================================================================
	$scope.deleteSlotConnRequest = function(scuid){
		for (var i = 0; i < activeSlotConns.length; i++){
			if(activeSlotConns[i].uid == scuid){
				activeSlotConns.splice(i, 1);
				break;
			}
		}

		for (var i = 0; i < $scope.formProps.asc.length; i++){
			if($scope.formProps.asc[i].uid == scuid){
				$scope.formProps.asc.splice(i, 1);
				break;
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Get Webble Color
	// returns the color of the webble in the slot conn to identify it as 1st or 2nd.
	//========================================================================================
	$scope.getWblColor = function(whatWblId){
		if(slotConnRequestData.first){
			if(whatWblId == slotConnRequestData.first.scope().getInstanceId()){
				return "#0000FF";
			}
			else if(slotConnRequestData.second && whatWblId == slotConnRequestData.second.scope().getInstanceId()){
				return "#ff7f2e";
			}
			else{
				return "#000000";
			}
		}
		else{
			return "#000000";
		}
	};
	//========================================================================================


	//========================================================================================
	// Get Webble Name
	// returns a readable name identifyer of the webble.
	//========================================================================================
	$scope.getWblName = function(whatUID, whatWblId){
		for (var i = 0, asc; asc = $scope.formProps.asc[i]; i++){
			if(asc.uid == whatUID){
				if(whatWblId == asc.wbl1Id){
					return asc.wbl1Pntr.scope().getWebbleFullName();
				}
				else{
					return asc.wbl2Pntr.scope().getWebbleFullName();
				}
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Get Adjusted Slot Name
	// returns a slot name that contains a space character after semicolon (:) in order to
	// word warp more visually pleasing.
	//========================================================================================
	$scope.getAdjSlotName = function(whatUID, whatWblId, whatSlotName){
		for (var i = 0, asc; asc = $scope.formProps.asc[i]; i++){
			if(asc.uid == whatUID){
				if(whatWblId == asc.wbl1Id){
					return ((asc.wbl1Pntr.scope().getSlot(whatSlotName).getExtDisplayName()).replace(':', ": "));
				}
				else{
					return ((asc.wbl2Pntr.scope().getSlot(whatSlotName).getExtDisplayName()).replace(':', ": "));
				}
			}
		}
	};
	//========================================================================================


	//========================================================================================
	// Close
	// Closes the modal form and send the resulting content back to the creator
	//========================================================================================
	$scope.close = function (result) {
		$scope.formProps.info = "";
		if(result == 'close'){
			$uibModalInstance.close(activeSlotConns);
		}
		else if(result == 'submit'){
			if($scope.formProps.wblData.first.selectedSlot != "none" && $scope.formProps.wblData.second.selectedSlot != "none" && ($scope.formProps.wblData.first.slotConnDir.send || $scope.formProps.wblData.first.slotConnDir.receive)){
				var newSlotConn = {
					uid: new Date().getTime(),
					wbl1Id: slotConnRequestData.first.scope().getInstanceId(),
					wbl1Pntr: slotConnRequestData.first,
					wbl1Slot: $scope.formProps.wblData.first.selectedSlot,
					wbl2Id: slotConnRequestData.second.scope().getInstanceId(),
					wbl2Pntr: slotConnRequestData.second,
					wbl2Slot: $scope.formProps.wblData.second.selectedSlot,
					wbl1Dirs: { send: $scope.formProps.wblData.first.slotConnDir.send, receive: $scope.formProps.wblData.first.slotConnDir.receive }
				};
				activeSlotConns.push(newSlotConn);
				$scope.formProps.asc.push(newSlotConn);
				$scope.formProps.wblData.first.selectedSlot = 'none';
				$scope.formProps.wblData.second.selectedSlot = 'none';
				$scope.formProps.wblData.first.slotConnDir.send = false;
				$scope.formProps.wblData.first.slotConnDir.receive = false;
			}
			else{
				$scope.formProps.info = "No proper slot connection configured (missing slots or directions) so we ignore that submit.";
				$timeout(function(){ $scope.formProps.info = ""; }, 5000);
			}
		}
	};
	//========================================================================================


	//=== CTRL MAIN CODE ======================================================================
	if(slotConnRequestData.first){
		angular.forEach(slotConnRequestData.first.scope().getSlots(), function (value, key) {
			if(value.getDisabledSetting() < Enum.SlotDisablingState.ConnectionVisibility){
				var tmp = {};
				tmp['key'] = key;
				tmp['name'] = value.getExtDisplayName();
				tmp['cat'] = value.getCategory();
				tmp['val'] = value.getValue();
				this.push(tmp);
			}
		}, $scope.formProps.wblData.first.slots);
	}

	if(slotConnRequestData.second){
		angular.forEach(slotConnRequestData.second.scope().getSlots(), function (value, key) {
			if(value.getDisabledSetting() < Enum.SlotDisablingState.ConnectionVisibility){
				var tmp = {};
				tmp['key'] = key;
				tmp['name'] = value.getExtDisplayName();
				tmp['cat'] = value.getCategory();
				tmp['val'] = value.getValue();
				this.push(tmp);
			}
		}, $scope.formProps.wblData.second.slots);
	}

	for (var i = 0; i < activeSlotConns.length; i++){
		if((activeSlotConns[i].wbl1Pntr != undefined && activeSlotConns[i].wbl2Pntr != undefined) && (slotConnRequestData.first == undefined || activeSlotConns[i].wbl1Id == slotConnRequestData.first.scope().getInstanceId() || activeSlotConns[i].wbl2Id == slotConnRequestData.first.scope().getInstanceId())){
			$scope.formProps.asc.push(activeSlotConns[i]);
		}
	}

});
//=======================================================================================
