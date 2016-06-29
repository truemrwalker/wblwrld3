//======================================================================================================================
// Controllers for Logic Gate Webble for Webble World v3.0 (2013)
// Created By: TrueMrWalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================
wblwrld3App.controller('logicGateCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
	$scope.customMenu = [
		{itemId: 'info', itemTxt: 'How does this work?'}
	];

	$scope.gateVals = {
		imgSrc: '',
		in1: 0,
		in2: 0
	};

	var isDraggingState = 0;
	var listOfCurrentLGWebbles = [];
	var gateImage, lineDrawingArea;
	var possibleParent = undefined;
	var possibleInput = "";

    // internal images
    var internalFilesPath;


    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// Update Slot is fired when the user change the value of any input boxes
	//===================================================================================
	$scope.updateSlot = function(inSlot){
		var slotVal = $scope.gimme(inSlot);
		var inputboxVal = (inSlot == "input_1") ? $scope.gateVals.in1 : $scope.gateVals.in2;
		if(slotVal != inputboxVal){
			$scope.set(inSlot, inputboxVal);
		}
	};
	//===================================================================================


	//===================================================================================
	// mouseDownEventHandler checks if Webble is being dragged and if so remove line
	//===================================================================================
	var mouseDownEventHandler = function (e) {
		if(e.which == 1){
			isDraggingState = 1;

			$scope.getPlatformElement().bind('mouseup', function(e){
				$scope.getPlatformElement().unbind('mousemove');
				$scope.getPlatformElement().unbind('mouseup');
				isDraggingState = 0;
				if(possibleParent != undefined){
					possibleParent.scope().theView.parent().find("#redPoint" + possibleParent.scope().getInstanceId()).html("");
					$scope.connectSlots("", "", {send: false, receive: false}, true);
					$timeout(function(){ $scope.paste(possibleParent.scope().theView); });
					$timeout(function(){$scope.set("root:left", parseInt($scope.gimme("root:left")) - 70);});
				}
				$timeout(function(){ possibleParent = undefined; });

				if($scope.shiftKeyIsDown){
					$scope.connectSlots("", "", {send: false, receive: false});
					$timeout(function(){ $scope.peel(); });

				}
			});

			$scope.getPlatformElement().bind('mousemove', function(e){
				if(isDraggingState == 1){
					isDraggingState = 2;
					lineDrawingArea.html("");
					listOfCurrentLGWebbles = [];
					for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
						if (aw.scope().theWblMetadata['templateid'] == $scope.theWblMetadata['templateid'] && aw.scope().getInstanceId() != $scope.getInstanceId()){
							var absPos = aw.offset();
							listOfCurrentLGWebbles.push({
								wbl: aw,
								pos: {x: absPos.left - 5, y: absPos.top - 5 - parseInt($scope.wsTopPos)}
							});
						}
					}
				}

				if(isDraggingState == 2 && !$scope.getParent()){
					var nonePPExist = true;
					for(var i = 0; i < listOfCurrentLGWebbles.length; i++){
						var mousePos = {x: e.clientX + 100, y: e.clientY - parseInt($scope.wsTopPos)}
						var RPElemId = "#redPoint" + listOfCurrentLGWebbles[i].wbl.scope().getInstanceId();
						if(mousePos.x > (listOfCurrentLGWebbles[i].pos.x) && mousePos.x < (listOfCurrentLGWebbles[i].pos.x + 120) && mousePos.y > (listOfCurrentLGWebbles[i].pos.y -10) && mousePos.y < (listOfCurrentLGWebbles[i].pos.y + 60)){
							nonePPExist = false;
							possibleParent = listOfCurrentLGWebbles[i].wbl;
							if((listOfCurrentLGWebbles[i].pos.y + 60) - mousePos.y > 35){
								possibleInput = "input_1";
								possibleParent.scope().theView.parent().find(RPElemId).first().html("<div style='position: absolute; background-color: #ff0000; width: 10px; height: 10px; border-radius: 5px; left: 2px; top: 10px;'></div>");
							}
							else if(possibleParent.scope().gimme("gateType") != "PLAIN_IN" && possibleParent.scope().gimme("gateType") != "NOT"){
								possibleInput = "input_2";
								possibleParent.scope().theView.parent().find(RPElemId).first().html("<div style='position: absolute; background-color: #ff0000; width: 10px; height: 10px; border-radius: 5px; left: 2px; top: 30px;'></div>");
							}
							else{
								nonePPExist = true;
							}
						}
						else{
							listOfCurrentLGWebbles[i].wbl.scope().theView.parent().find(RPElemId).html("");
						}
					}
					if(nonePPExist){ possibleParent = undefined; }
				}
			});
		}
	};
	//===================================================================================


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
        internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);
		gateImage = $scope.theView.parent().find("#gateImage");
		lineDrawingArea = $scope.theView.parent().find("#lineDrawingArea");

		//Bind Mouse Move Event handler to the Webble
		gateImage.bind('vmousedown', mouseDownEventHandler);

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'gateType'){
				$scope.gateVals.imgSrc = internalFilesPath + '/images/' + newVal + '.png';
				calcOut();
			}
			else if(eventData.slotName == 'input_1'){
				$scope.gateVals.in1 = newVal;
				calcOut();
			}
			else if(eventData.slotName == 'input_2'){
				$scope.gateVals.in2 = newVal;
				calcOut();
			}
			else if(eventData.slotName == 'root:left' || eventData.slotName == 'root:top'){
				prepareDrawLine($scope.getConnectedSlot());
			}
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.pasted, function(eventData){
			var theParent = $scope.getParent();

			if(theParent.scope().theWblMetadata['templateid'] == $scope.theWblMetadata['templateid']) {
				if($scope.getConnectedSlot() == "" || (possibleInput != "" && $scope.getConnectedSlot() != possibleInput)){
					var inputSlot = (possibleInput != "") ? possibleInput : "input_1";

					var noOfChildrenConnectedToRequestedInput = 0;
					for(var i= 0, pc; pc = $scope.getParent().scope().getChildren()[i]; i++ ){
						if(pc.scope().getInstanceId() != $scope.getInstanceId()){
							if(pc.scope().getConnectedSlot() == inputSlot){ noOfChildrenConnectedToRequestedInput++ }
						}
					}

					if(noOfChildrenConnectedToRequestedInput > 0){
						$scope.showQIM("Cannot connect two logic gates to the same input.");
						$scope.connectSlots("", "", {send: false, receive: false});
						if(possibleInput != ""){
							$scope.peel();
							return;
						}
					}
					else{
						$scope.connectSlots(inputSlot, "output", {send: true, receive: false});
					}
				}
			}

			$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
				if($scope.getParent() != undefined){
					var newVal = eventData.slotValue;
					if($scope.getSelectedSlot() == "output"){
						if((eventData.slotName == 'input_1' && $scope.getConnectedSlot() == 'input_1') || (eventData.slotName == 'input_2' && $scope.getConnectedSlot() == 'input_2')){
							var noOfChildrenConnectedToRequestedInput = 0;
							for(var i= 0, pc; pc = $scope.getParent().scope().getChildren()[i]; i++ ){
								if(pc.scope().getInstanceId() != $scope.getInstanceId()){
									if(pc.scope().getConnectedSlot() == eventData.slotName){ noOfChildrenConnectedToRequestedInput++ }
								}
							}

							if(noOfChildrenConnectedToRequestedInput == 0 && newVal != $scope.gimme("output")){
								$scope.getParent().scope().set(eventData.slotName, $scope.gimme("output"));
							}
						}
					}
				}
			}, $scope.getParent().scope().getInstanceId());

			prepareDrawLine($scope.getConnectedSlot());
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.peeled, function(eventData){
			lineDrawingArea.html("");
		});

        $scope.addSlot(new Slot('gateType',
            'AND',
            'The Gate Type',
            'The type of gate used',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'PLAIN_IN']},
            undefined
        ));

        $scope.addSlot(new Slot('input_1',
			$scope.gateVals.in1,
            'Input 1',
            'This is the first (primary) input value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('input_2',
			$scope.gateVals.in2,
            'Input 2',
            'This is the second (secondary) input value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('output',
            0,
            'Output',
            'This is the output value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

		$scope.addSlot(new Slot('showInOutVals',
			true,
			'Display In/Out Values',
			'If this is marked the input and output values are displayed and the input values can be edited',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot("output");


		// watches if connected slot in parent change
		$scope.$watch(function(){ return ($scope.getConnectedSlot()); }, function(newValue, oldValue) {
			prepareDrawLine(newValue);
		});
    };
    //===================================================================================



    //========================================================================================
    // Calculate Output
    // set the out put correwctly according to current gate and the current input
    //========================================================================================
    var calcOut = function(){
        var in1 = parseInt($scope.gimme('input_1'));
        if(in1 != 1){ in1 = 0; }
        var in2 = parseInt($scope.gimme('input_2'));
        if(in2 != 1){ in2 = 0; }
        var out = 0;

        switch($scope.gimme('gateType')){
          case 'AND':
            if(in1 == 1 && in2 == 1){
              out = 1;
            }
            break;
          case 'OR':
            if(in1 == 1 || in2 == 1){
              out = 1;
            }
            break;
          case 'NOT':
            if(in1 == 0){
              out = 1;
            }
            break;
          case 'NAND':
            if(!(in1 == 1 && in2 == 1)){
              out = 1;
            }
            break;
          case 'NOR':
            if(in1 == 0 && in2 == 0){
              out = 1;
            }
            break;
          case 'XOR':
            if(in1 != in2){
              out = 1;
            }
            break;
          case 'XNOR':
            if(in1 == in2){
              out = 1;
            }
            break;
		  case 'PLAIN_IN':
			out = in1;
			break;
        }

        $scope.set('output', out);
    };
    //========================================================================================


	//========================================================================================
	// Prepare Draw Line
	// Check if a line can and should be drawn and if get the correct coordinates to give to
	// the line drawing function before evoking it.
	//========================================================================================
	var prepareDrawLine = function(connSlot) {
		if(connSlot == "input_1" || connSlot == "input_2") {
			var theParent = $scope.getParent();
			if (theParent != undefined) {
				var px = (-1) * parseInt($scope.gimme("root:left")) + 6;
				var py = (-1) * parseInt($scope.gimme("root:top")) + ((connSlot == "input_1") ? 14 : 34);
				drawline(94, 24, px, py);
			}
		}
		else{
			lineDrawingArea.html("");
		}
	};
	//========================================================================================


	//========================================================================================
	// Draw Line
	// Use a div to draw a line from one point to another
	//========================================================================================
	var drawline = function(ax, ay, bx, by) {
		if (ax > bx) {
			bx = ax + bx;
			ax = bx - ax;
			bx = bx - ax;
			by = ay + by;
			ay = by - ay;
			by = by - ay;
		}

		var angle = Math.atan((ay - by) / (bx - ax));
		angle = (angle * 180 / Math.PI);
		angle = -angle;
		var length = Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));

		var style = ""
		style += "left:" + (ax) + "px;"
		style += "top:" + (ay) + "px;"
		style += "width:" + length + "px;"
		style += "height:2px;"
		style += "background-color:black;"
		style += "position:absolute;"
		style += "transform:rotate(" + angle + "deg);"
		style += "-ms-transform:rotate(" + angle + "deg);"
		style += "transform-origin:0% 0%;"
		style += "-moz-transform:rotate(" + angle + "deg);"
		style += "-moz-transform-origin:0% 0%;"
		style += "-webkit-transform:rotate(" + angle + "deg);"
		style += "-webkit-transform-origin:0% 0%;"
		style += "-o-transform:rotate(" + angle + "deg);"
		style += "-o-transform-origin:0% 0%;"
		style += "-webkit-box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, .1);"
		style += "box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, .1);"
		style += "z-index:99;"

		lineDrawingArea.html("<div style='" + style + "'></div>");
	}
	//========================================================================================


	//===================================================================================
	// Webble template Menu Item Activity Reaction
	// If this template has its own custom menu items that needs to be taken care of,
	// then it is here where that should be executed.
	// If this function is empty and unused it can safely be deleted.
	//===================================================================================
	$scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
		if(itemName == $scope.customMenu[0].itemId){  //info
			$scope.openForm(Enum.aopForms.infoMsg, {title: 'How to Use Logic Gate Webble', content:
				"<p>The logic gates can be connected by just dropping them on each other and pointing at which input gate  " +
				"one wish to use (highlighted red). Only one gate can be connected for each input.</p>" +
				"<p>When a Logic gate is connected, a line is drawn to show the connection. If the gate is moved the line is hidden until " +
				"the user drops the gate and the line is then redrawn again.</p>" +
				"<p>If the SHIFT key on the keyboard is held when dropping a gate the gate will be disconnected from the gate it was connected to.</p>" +
				"<p>You cannot edit any input value which is currently connected to another gates output.</p>"}
			);
		}
	};
	//===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
