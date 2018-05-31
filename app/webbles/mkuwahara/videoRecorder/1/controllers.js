//======================================================================================================================
// Controllers for Video Recorder Webble Template for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('videoRecorderWebbleCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    // $scope.stylesToSlots = {
    //     square: ['width', 'height', 'background-color', 'border', 'border-radius'],
    //     squareTxt: ['font-size', 'color', 'font-family']
    // };

    //$scope.customMenu = [{itemId: 'eat', itemTxt: 'Have Lunch'}, {itemId: 'drink', itemTxt: 'Have refreshment'}];

    //$scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];

    var internalFilesPath;

	// Video recording control objects (3rd party etc)
	var videoRecorder, recTimer = undefined, isRecording = false;

	$scope.vidRecVals = {
		imgSrc: '',
		stpManRecSrc: ''
	};

	var recModes = {
		auto: 0,
		manual: 1
	};



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// Click button event
	//===================================================================================
	$scope.clicking = function($event){
		if($scope.gimme('recordMode') == recModes.auto){
			if(isRecording){
				$timeout.cancel(recTimer);
				recTimer = undefined;
				isRecording = false;
				compileVideoAndSave();
				$log.log("...Recording Stopped!");
				$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recStrt.png';
			}
			else {
				isRecording = true;
				$log.log("Recording Started...");
				$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recStp.png';
				recTimer = $timeout(captureFrames, 0, false);
			}
		}
		else{
			isRecording = true;
			$log.log("Record Frame ...");
			recTimer = $timeout(captureFrames, 0, false);
		}
	};
	//===================================================================================


	//===================================================================================
	// Click Stop button event
	//===================================================================================
	$scope.clickingStp = function($event){
		if(isRecording){
			$timeout.cancel(recTimer);
			recTimer = undefined;
			isRecording = false;
			compileVideoAndSave();
			$log.log("...Recording Stopped!");
		}
	};
	//===================================================================================


	//===================================================================================
	// Capture Frames
	// is fired over and over again while the recording is enabled and for each time
	// saves a screen capture of the selected Webbles
	//===================================================================================
	var captureFrames = function(){
		if(videoRecorder == undefined){
			videoRecorder = new Whammy.Video(15);
		}

		html2canvas($("#workspaceSurface")[0], {
			onrendered: function(canvas) {
				if(videoRecorder != undefined){
					var frameImg = canvas.toDataURL("image/webp");
					if($scope.gimme('recordMode') == recModes.auto){
						videoRecorder.add(frameImg);
						recTimer = $timeout(captureFrames, 0, false);
					}
					else{
						var spf = parseInt($scope.gimme("secPerFrame") * 15);
						if(spf < 1){spf=1;}
						for(var i = 0; i < spf; i++){
							videoRecorder.add(frameImg);
						}
					}
				}
			}
		});
	};
	//===================================================================================


	//===================================================================================
	// Compile Video & Save
	// compiles the captured frames into a video and save it to browsers download
	// location
	//===================================================================================
	var compileVideoAndSave = function(){
		if(videoRecorder.frames.length > 0){
			$log.log("Creating Movie of " + videoRecorder.frames.length + " frames captured.");
			videoRecorder.compile(true, function(output){
				download(output, "WebbleVideo", "video/webm");
				videoRecorder = undefined;
			});
		}
		else{
			$log.log("No frames captured.");
		}

	};
	//===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);
		$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recStrt.png';
		$scope.vidRecVals.stpManRecSrc = internalFilesPath + '/images/recStp.png';


		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'recordMode'){
				if(isRecording){
					$timeout.cancel(recTimer);
					recTimer = undefined;
					isRecording = false;
					compileVideoAndSave();
					$log.log("...Recording Stopped!");
					$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recStrt.png';
				}

				if(eventData.slotValue == recModes.auto){
					$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recStrt.png';
				}
				else {
					$scope.vidRecVals.imgSrc = internalFilesPath + '/images/recSS.png';
				}
			}

			else if(eventData.slotName == 'execSnap'){
				if($scope.gimme('recordMode') == recModes.manual && eventData.slotValue != ""){
					isRecording = true;
					$log.log("Record Frame...");
					recTimer = $timeout(captureFrames, 0, false);
					$scope.getSlot('execSnap').setValue("");
				}
			}

		});


		$scope.addSlot(new Slot('recordMode',
			0,
			'Record Mode',
			'In Automatic mode the webble records as many frames per second it can and create a 15fps movie from them, in Manual mode the Webble will take a frame when either the user press the photo button or the Execute Snapshot slot is enabled',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Automatic", "Manual"]},
			undefined
		));

		$scope.addSlot(new Slot('execSnap',
			"",
			'Execute Snapshot',
			'In Manual Mode this slot if set to anything except empty string will take a frame snapshot of the current workspace',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('secPerFrame',
			1.0,
			'Seconds Per Frame',
			'In Manual Mode this value decides how long (in seconds) each individual frame should be displayed in the movie',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.theView.parent().draggable('option', 'cancel', '#VidRcrdBtn');
        $scope.theView.parent().find('#VidRcrdBtn').bind('contextmenu',function(){ return false; });
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

//======================================================================================================================
