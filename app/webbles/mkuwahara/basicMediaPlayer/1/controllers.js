//======================================================================================================================
// Controllers for Media Player Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================
wblwrld3App.controller('mediaPlayerWebbleCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		mediaPlayerContainer: ['background-color', 'border', 'border-radius', 'padding']
    };

	var randomNum = Math.floor((Math.random() * 2) + 1);
	$scope.rewiderPos = 315;
	var lastTime = 0;
	var isInternalPleaseIgnore = false;

	var theMediaPlayer, theVideoPlayer, theAudioPlayer;

    $scope.customMenu = [{itemId: 'play', itemTxt: 'Play'}, {itemId: 'pause', itemTxt: 'Pause'}, {itemId: 'restart', itemTxt: 'Restart'}];



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// Event Handler - On Current Time Change
	// Updates the currTime slot when the time change in whole seconds
	//===================================================================================
	var eventHandler_OnCurrTimeChange = function(e){
		var thisTime = parseInt(theMediaPlayer.currentTime);
		if(thisTime != lastTime){
			isInternalPleaseIgnore = true;
			$scope.set('currTime', thisTime);
			lastTime = thisTime;
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
		theMediaPlayer = $scope.theView.parent().find("#theVideoPlayer").get(0);
		theVideoPlayer = $scope.theView.parent().find("#theVideoPlayer").get(0);
		theAudioPlayer = $scope.theView.parent().find("#theAudioPlayer").get(0);

		//--------------------
		// EVENT LISTENERS

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'playerType'){
				var playerTimePos = theMediaPlayer.currentTime;
				var isPaused = theMediaPlayer.paused;
				var autoEnabled = theMediaPlayer.autoplay;
				theMediaPlayer.autoplay = false;
				theMediaPlayer.pause();
				if(newVal == 0){
					theMediaPlayer = $scope.theView.parent().find("#theVideoPlayer").get(0);
				}
				else if(newVal == 1){
					theMediaPlayer = $scope.theView.parent().find("#theAudioPlayer").get(0);
				}
				theMediaPlayer.autoplay = autoEnabled;
				theMediaPlayer.currentTime = playerTimePos;
				theMediaPlayer.pause();
				if (!isPaused && theMediaPlayer.paused) {
					theMediaPlayer.play();
				}
			}
			else if(eventData.slotName == 'mediaSrc'){
				if(theMediaPlayer.currentSrc != newVal){
					$timeout(function(){
						theVideoPlayer.load();
						theAudioPlayer.load();
					});
				}
			}
			else if(eventData.slotName == 'mediaWidth'){
				var newPos = parseInt(newVal) - 5;
				if($scope.rewiderPos != newPos){
					$scope.rewiderPos = newPos + 'px';
				}
			}
			else if(eventData.slotName == 'controlsEnabled'){
				if(newVal == true || newVal == false){
					theVideoPlayer.controls = newVal;
					theAudioPlayer.controls = newVal;
				}
			}
			else if(eventData.slotName == 'autplaEnabled'){
				if(newVal == true || newVal == false){
					theVideoPlayer.autoplay = false;
					theAudioPlayer.autoplay = false;
					theMediaPlayer.autoplay = newVal;
				}
			}
			else if(eventData.slotName == 'playerAction'){
				if(newVal == 1){  //play
					theMediaPlayer.play();
				}
				else if(newVal == 2){  //pause
					theMediaPlayer.pause();
				}
				else if(newVal == 3){  //restart
					theMediaPlayer.currentTime = 0;
					theMediaPlayer.play();
				}
				$scope.set('playerAction', 0);
			}
			else if(eventData.slotName == 'currTime'){
				if(!isInternalPleaseIgnore){
					theMediaPlayer.currentTime = newVal;
				}
				isInternalPleaseIgnore = false;
			}
			else if(eventData.slotName == 'isLoopEnabled'){
				var isTrueSet = (newVal.toString().toLowerCase() === 'true');
				if(isTrueSet == true || isTrueSet == false){
					theVideoPlayer.loop = isTrueSet;
					theAudioPlayer.loop = isTrueSet;
				}
			}
			else if(eventData.slotName == 'isMuteEnabled'){
				var isTrueSet = (newVal.toString().toLowerCase() === 'true');
				if(isTrueSet == true || isTrueSet == false){
					theVideoPlayer.muted = isTrueSet;
					theAudioPlayer.muted = isTrueSet;
				}
			}
			else if(eventData.slotName == 'playbackRate'){
				var theValue = parseFloat(newVal);
				if(!isNaN(theValue)){
					theVideoPlayer.playbackRate = theValue;
					theAudioPlayer.playbackRate = theValue;
				}
			}
			else if(eventData.slotName == 'volume'){
				var theValue = parseFloat(newVal);
				if(!isNaN(theValue) && theValue >= 0 && theValue <= 1 ){
					theVideoPlayer.volume = theValue;
					theAudioPlayer.volume = theValue;
				}
			}
		});

		$scope.addSlot(new Slot('playerType',
			randomNum == 1 ? 0 : 1,
			'Player Type',
			'If the player should be displayed as an audio or video player',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Video Player', 'Audio Player']},
			undefined
		));

		$scope.addSlot(new Slot('mediaSrc',
			randomNum == 1 ? 'https://192.168.12.186:7443/media/intro.mp4' : 'http://k003.kiwi6.com/hotlink/hwukwylzbf/ThankYouForTheMusic.mp3',
			'Media Link',
			'The source link for the media file to be played',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.AudioPick},
			undefined
		));

		$scope.addSlot(new Slot('mediaWidth',
			320,
			'Media Display Width',
			'The width of the media display area (blank = default size and/or auto adjust)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('controlsEnabled',
			true,
			'Controls Enabled',
			'Wheter the media player controls should be available or not',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('autplaEnabled',
            true,
            'Autoplay Enabled',
            'Sets whether a media file should autostart when loaded or not',
            $scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.CheckBox},
            undefined
        ));

		$scope.addSlot(new Slot('playerAction',
			0,
			'Set Player Action',
			'Set an action on the media player',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Nothing', 'Play', 'Pause', 'Restart']},
			undefined
		));

		$scope.addSlot(new Slot('currTime',
			0,
			'Current Time',
			'The current time in whole seconds of the current playback',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('isLoopEnabled',
			false,
			'Loop Enabled',
			'When checked the media file will loop in infinity',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('isMuteEnabled',
			false,
			'Mute Enabled',
			'When checked the sound of the media file will be muted',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('playbackRate',
			1.0,
			'Playback Speed',
			'The playback speed (1.0 is normal speed)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('volume',
			1.0,
			'Volume',
			'The volume of the audio playback',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('subSrc',
			'',
			'Subtitle Link',
			'The source link for the subtitle file to be displayed',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot('mediaSrc');

		$scope.theView.parent().find("#theVideoPlayer").get(0).ontimeupdate = eventHandler_OnCurrTimeChange;
		$scope.theView.parent().find("#theAudioPlayer").get(0).ontimeupdate = eventHandler_OnCurrTimeChange;
    };
    //===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
        if(itemName == $scope.customMenu[0].itemId){  //play
			theMediaPlayer.play();
        }
        else if(itemName == $scope.customMenu[1].itemId){  //pause
			theMediaPlayer.pause();
        }
		else if(itemName == $scope.customMenu[2].itemId){  //restart
			theMediaPlayer.currentTime = 0;
			theMediaPlayer.play();
		}
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
