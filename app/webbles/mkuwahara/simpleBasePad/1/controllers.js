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
    var originalWblChildContainer, basePadTitle, basePadFoundation;
	var indexSortedChildren = [];
	var blockChildMoveReaction = true;

    //$scope.customMenu = [{itemId: 'eat', itemTxt: 'Have Lunch'}, {itemId: 'drink', itemTxt: 'Have refreshment'}];

    //$scope.addPopupMenuItemDisabled('BringFwd');
    //$scope.removePopupMenuItemDisabled([ITEM-ID]);
	//$scope.isPopupMenuItemDisabled([ITEM-ID]);

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
					}
					else{
						unConfigChildrenForUnrestrictedSlotConn();
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


        $scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){
			var newChild = $scope.getWebbleByInstanceId(eventData.childId);
			newChild.scope().basePadTracker = {index: -1, pos: [parseInt(newChild.scope().gimme("root:left")), parseInt(newChild.scope().gimme("root:top"))]}
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
			var thisWbl = $(event.target.offsetParent);
			var targetName = $(event.target).scope().getName();

			if (targetName == "connectSpaghettiSlots"){
				$scope.openForm('CSCMForm', [{templateUrl: 'child-slotconn-manager-form.html', controller: 'CSCMForm_Ctrl', size: 'lg'}, {wbl: thisWbl}], closeCSCMForm);
			}
			if(thisWbl.scope().gimme("ownIOFunc")){
				thisWbl.scope().gimme("ownIOFunc")(event);
			}
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
		c.scope().theInteractionObjects[ioIndex].scope().tooltip = "Connect Slot";
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
			var thisWbl = $scope.getWebbleByInstanceId($(this)[0].$parent.getInstanceId());

			if(itemName == "connectSpaghettiSlots"){
				$scope.openForm('CSCMForm', [{templateUrl: 'child-slotconn-manager-form.html', controller: 'CSCMForm_Ctrl', size: 'lg'}, {wbl: thisWbl}], closeCSCMForm);
			}

			if(thisWbl.scope().gimme("ownCustomMenuFunc")){
				thisWbl.scope().gimme("ownCustomMenuFunc")(itemName);
			}
		};

		if(!c.scope().customMenu){ c.scope().customMenu = []; }
		c.scope().customMenu.push({itemId: 'connectSpaghettiSlots', itemTxt: 'Connect Slot'});
		c.scope().addPopupMenuItemDisabled('ConnectSlots');
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
	// Close Child Slot Conn Manager Form
	//========================================================================================
	var displayBubbleText = function(whatWbl, whatTxt){
		if ((parseInt(whatWbl.scope().getWebbleConfig(), 10) & parseInt(Enum.bitFlags_WebbleConfigs.NoBubble, 10)) == 0){
			$scope.setBubbleTxt(whatTxt);
			var absPos = whatWbl.scope().getWblAbsPosInPixels(whatWbl.scope().theView);
			$scope.setBubbleTxtPos({x: absPos.x, y: absPos.y}, whatWbl.scope().theView);
			$scope.setBubbleTxtVisibility(true, 3500);
		}
	}
	//========================================================================================



	//========================================================================================
	// Close Child Slot Conn Manager Form
	//========================================================================================
	var closeCSCMForm = function(returnContent){
		if(returnContent != null){
			//setEAData(returnContent, false);
		}
	}
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
        //if(itemName == $scope.customMenu[0].itemId){  //[CUSTOM ITEM NAME]
        //    [CODE FOR THIS MENU ITEM GOES HERE]
        //}

        // EXAMPLE:
        // if(itemName == $scope.customMenu[0].itemId){  //eat
        //     $log.log('Are you hungry?');
        // }
        // else if(itemName == $scope.customMenu[1].itemId){  //drink
        //     $log.log('Are you thirsty?')
        // }
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
			noOfChildrenMemory: $scope.getChildren().length
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
	$scope.formProps = {
		data: [],
		info: "Nothing to say"
	};


	//========================================================================================
	// Close
	// Closes the modal form and send the resulting content back to the creator
	//========================================================================================
	$scope.close = function (result) {
		if(result == 'cancel'){
			$uibModalInstance.close(null);
		}
		else if(result == 'submit'){
			$uibModalInstance.close($scope.formProps.data);
		}
	};
	//========================================================================================


	//=== CTRL MAIN CODE ======================================================================
	//$scope.formProps.data = angular.copy(props.eaData);

	// if($scope.formProps.EAData.length == 0 || ($scope.formProps.EAData[$scope.formProps.EAData.length - 1].eventGroup.length > 0 || $scope.formProps.EAData[$scope.EAData.length - 1].actionGroup.length > 0)){
	// 	$scope.formProps.EAData.push({eventGroup: [], actionGroup: [], strVal: ''});
	// }
});
//=======================================================================================
