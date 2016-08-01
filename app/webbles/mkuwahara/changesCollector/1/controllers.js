//======================================================================================================================
// Controllers for changesCollector for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('changesCollectorCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
		ccContainer: ['width', 'height', 'background-color', 'border', 'border-radius', 'color']
    };

	// Watch pointers
	var keyPress;


    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// onResize event handler
	//===================================================================================
	var onResize = function(e){
		$scope.set('windowWidth', $(window).width());
		$scope.set('windowHeight', $(window).height());
		if(!$scope.$$phase){ $scope.$apply(); }
	};
	//===================================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'mouseEventsEnabled'){
				if(eventData.slotValue == true){
					var workspaceSurface = $("#workspaceSurface");
					workspaceSurface.bind("mousemove.wwplatform", function(e){
						var coords = getCrossBrowserElementCoords(e);
						$scope.set('mouseXPos', coords.x);
						$scope.set('mouseYPos', coords.y);
						if(!$scope.$$phase){ $scope.$apply(); }
					});
					workspaceSurface.bind("mousedown.wwplatform", function(e){
						var coords = getCrossBrowserElementCoords(e);
						$scope.set('lastClickPos', coords);
						$scope.set('numberOfClicks', parseInt($scope.gimme('numberOfClicks')) + 1);
						$scope.set('whichButtonClicked', e.which == 1 ? "Left" : (e.which == 2 ? "Middle" : "Right") );
						setAckompanyKeys(e);
						setClickedWebble(e);
						if(!$scope.$$phase){ $scope.$apply(); }
					});
					workspaceSurface.bind("dblclick.wwplatform", function(e){
						$scope.set('numberOfDblClicks', parseInt($scope.gimme('numberOfDblClicks')) + 1);
						if(!$scope.$$phase){ $scope.$apply(); }
					});
					workspaceSurface.bind('wheel.wwplatform', function(e){
						$scope.set('lastScrollDelta', e.originalEvent.wheelDelta);
						setAckompanyKeys(e);
						setClickedWebble(e);
						if(!$scope.$$phase){ $scope.$apply(); }
					});
					keyPress = $scope.registerWWEventListener(Enum.availableWWEvents.keyDown, function(eventData){
						if(!$scope.getIsFormOpen() && !eventData.key.released){
							$scope.set('lastPressedKey', eventData.key.name);
							$scope.set('lastPressedKeyCode', eventData.key.code);
							if(eventData.key.code != 8){
								$scope.set('keyDownSequence', $scope.gimme('keyDownSequence') + getProperKeySymbol(eventData.key.code));
							}
							else{
								var currStr = $scope.gimme('keyDownSequence');
								if(currStr.length-1 >= 0){
									$scope.set('keyDownSequence', currStr.substr(0,currStr.length-1));
								}
							}

						}
					});
				}
				else{
					$("#workspaceSurface").unbind(".wwplatform");
					keyPress();
				}
			}
			else if(eventData.slotName == 'specialSymbols'){
				if(eventData.slotValue != ""){
					copyToClipboard(eventData.slotValue);
					$scope.set('specialSymbols', "");
				}
			}
			else if(eventData.slotName == 'mainMenuEnabled'){
				var isMainMenuEnabled = ((parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10));
				if(isMainMenuEnabled != eventData.slotValue){
					$timeout(function(){$scope.executeMenuSelection('altf2');});
				}
			}
		});

		$scope.addSlot(new Slot('mouseEventsEnabled',
			true,
			'Mouse & Keyboard Events Enabled',
			'Turns on or off the event listeners for mouse and keyboard events such as mouse move, mouse button down, key down etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('mainMenuEnabled',
			((parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)),
			'Main Menu Enabled',
			'Turns on or off (and shows current status of) the visibility for the top most main menu of Webble World.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('mouseXPos',
			0,
			'Mouse Horizontal Position',
			'If the mouse events are enabled this slot contains the current horizontal(x) position of the mouse pointer',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("mouseXPos").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('mouseYPos',
			0,
			'Mouse Vertical Position',
			'If the mouse events are enabled this slot contains the current vertical(y) position of the mouse pointer',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("mouseYPos").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('lastClickPos',
			{x: 0, y: 0},
			'Last Click Position',
			'If the mouse events are enabled this slot contains the mouse position for  the last mouse button click',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("lastClickPos").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('numberOfClicks',
			0,
			'No of Clicks',
			'If the mouse events are enabled this slot contains the amount of button clicks the user has made',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("numberOfClicks").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('numberOfDblClicks',
			0,
			'No of Double Clicks',
			'If the mouse events are enabled this slot contains the amount of double clicks the user has made',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("numberOfDblClicks").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('whichButtonClicked',
			'None',
			'Which Click Button',
			'If the mouse events are enabled this slot contains the name of the mouse button clicked',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("whichButtonClicked").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('ackompanyKey',
			"",
			'Mouse Key',
			'If the mouse events are enabled this slot contains the name of which ctrl/alt/shift key combination was held while clicking the mouse',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("ackompanyKey").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('clickedWebble',
			"",
			'Clicked Webble',
			'If the mouse events are enabled this slot contains the template name, display name and instance id of the webble that was clicked, if a webble was clicked',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("clickedWebble").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('lastScrollDelta',
			0,
			'Last Scroll Delta',
			'If the mouse events are enabled this slot contains the delta value for the most recent mouse wheel scroll direction',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("lastScrollDelta").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('lastPressedKey',
			"",
			'Last Pressed Key',
			'If the mouse and keyboard events are enabled this slot contains the name of the last key pressed on the keyboard',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("lastPressedKey").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('lastPressedKeyCode',
			"",
			'Last Pressed Key Code',
			'If the mouse and keyboard events are enabled this slot contains the key code of the last key pressed on the keyboard',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("lastPressedKeyCode").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('keyDownSequence',
			"",
			'Key Down Sequence',
			'If the mouse and keyboard events are enabled this slot contains the string created by the keys that have been pushed since the Webble was created',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("keyDownSequence").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('windowWidth',
			$(window).width(),
			'Window Width',
			'The currrent inner (viewport) width of the browser window',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("windowWidth").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('windowHeight',
			$(window).height(),
			'Window Height',
			'The currrent inner (viewport) height of the browser window',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("windowHeight").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('screenWidth',
			screen.width,
			'Screen Width',
			'The width of the computer screen',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("screenWidth").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('screenHeight',
			screen.height,
			'Screen Height',
			'The height of the computer screen',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("screenHeight").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('specialSymbols',
			"",
			'Special Symbols',
			'Easy access to special symbols. Select the one you want, submit and get a quick way to copy it to the clipboard',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['¡','£','¤','¥','¦','§','¨','©','ª','«','¬','®','¯','°','±','²','³','´','µ','¶','·','¸','¹','º','»','¼','½','¾','¿','×','÷','ƒ','ˆ','˜','–','—','‘','’','‚','“','”','„','†','‡','•','…','‰','′','″','‹','›','‾','⁄','€','ℑ','ℓ','№','℘','ℜ','™','ℵ','←','↑','→','↓','↔','↵','⇐','⇑','⇒','⇓','⇔','∀','∂','∃','∅','∇','∈','∉','∋','∏','∑','−','∗','√','∝','∞','∠','∧','∨','∩','∪','∫','∴','∼','≅','≈','≠','≡','≤','≥','⊂','⊃','⊄','⊆','⊇','⊕','⊗','⊥','⋅','⌈','⌉','⌊','⌋','⟨','⟩','◊','♠','♣','♥','♦']},
			undefined
		));

		$scope.addSlot(new Slot('animationEasings',
			"",
			'Animation Easings',
			"Easy access to all avialble animation easings that javascript and css provides. Select the one you want, submit and connect it to some Webble slot for maximum effect. \nFor detailed Information on easings please visit http://easings.net",
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ["easeInSine","easeOutSine","easeInOutSine","easeInQuad","easeOutQuad","easeInOutQuad","easeInCubic","easeOutCubic","easeInOutCubic","easeInQuart","easeOutQuart","easeInOutQuart","easeInQuint","easeOutQuint","easeInOutQuint","easeInExpo","easeOutExpo","easeInOutExpo","easeInCirc","easeOutCirc","easeInOutCirc","easeInBack","easeOutBack","easeInOutBack","easeInElastic","easeOutElastic","easeInOutElastic","easeInBounce","easeOutBounce","easeInOutBounce"]},
			undefined
		));

		$scope.addSlot(new Slot('hostCoreUrl',
			location.host,
			'Host Core URL',
			'the core url of the current website',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("hostCoreUrl").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('currentFullUrl',
			location.href,
			'Full URL',
			'the full url of the current web page',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("currentFullUrl").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('urlPathPart',
			location.pathname,
			'URL Path Part',
			'the path part of the url of the current web page',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("urlPathPart").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('urlHashPart',
			location.hash,
			'URL Hash Part',
			'the hash part of the url of the current web page',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("urlHashPart").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('urlSearchPart',
			location.search,
			'URL Search Part',
			'the search part of the url of the current web page',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("urlSearchPart").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('currentBrowser',
			BrowserDetect.browser,
			'Current Browser',
			'the browser currently in use',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("currentBrowser").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('currentOS',
			BrowserDetect.OS,
			'Current OS',
			'the OS platform which the current browser is compiled for',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("currentOS").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('currentDevice',
			BrowserDetect.device,
			'Current Device',
			'the Device which the current browser is running on',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("currentDevice").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('NavigaterUserAgent',
			navigator.userAgent,
			'Navigator User Agent',
			'the exact content of the method call for navigator.userAgent as displayed on this device.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("NavigaterUserAgent").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('geoLocationLat',
			0,
			'Geo Location Latitude',
			'the latitude location of your ip-address',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("geoLocationLat").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('geoLocationLong',
			0,
			'Geo Location Longitude',
			'the longitude location of your ip-address',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("geoLocationLong").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.$watch(function(){
			return (parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10); }, function(newValue, oldValue) {
				if(newValue != $scope.gimme("mainMenuEnabled")){
					$scope.set("mainMenuEnabled", newValue);
				}
		});

		$(window).bind("resize", onResize);
		$timeout(function(){
			onResize();
			$scope.set('lastClickPos', {x: 0, y: 0});
			$scope.set('numberOfClicks', 0);
			$scope.set('whichButtonClicked', "None");
			$scope.set('numberOfDblClicks', 0);
			$scope.set('ackompanyKey', '');
			$scope.set('clickedWebble', '');
			$scope.set('lastPressedKey', '');
			$scope.set('lastPressedKeyCode', 0);
			$scope.set('keyDownSequence', "");
			getLocation();
		}, 200);
    };
    //===================================================================================



	//========================================================================================
	// Set Clicked Webble
	// sets which webble the current mouse operation occurred on if any.
	//========================================================================================
	var setClickedWebble = function(e) {
		if(e.target.id != "workspaceSurface"){
			var currentElement = $(e.target);
			var searchValue = currentElement[0].id != undefined ? currentElement[0].id : "   ";
			var svP1 = searchValue.substr(0, 2), svP2 = parseInt(searchValue.substr(2));
			while(!(svP1 == "w_" && !isNaN(svP2))){
				currentElement = currentElement.parent();
				searchValue = currentElement[0].id != undefined ? currentElement[0].id : "   ";
				svP1 = searchValue.substr(0, 2);
				svP2 = parseInt(searchValue.substr(2));
			}
			var theWbl = $scope.getWebbleByInstanceId(svP2+1);
			$scope.set('clickedWebble', theWbl.scope().getWebbleFullName());
		}
		else{
			$scope.set('clickedWebble', "");
		}
	};
	//========================================================================================



	//========================================================================================
	// Set Ackompany Keys
	// sets wether any of the ALT, CTRL, SHIFT or META keys are set.
	//========================================================================================
	var setAckompanyKeys = function(e) {
		var clickKeys = "";
		if (e.altKey) {
			clickKeys += " Alt "
		}
		if (e.ctrlKey) {
			clickKeys += " Ctrl "
		}
		if (e.shiftKey) {
			clickKeys += " Shift "
		}
		if (e.metaKey) {
			clickKeys += " Meta "
		}
		$scope.set('ackompanyKey', clickKeys);
	};
	//========================================================================================



	//========================================================================================
	// Get Location
	// Locates the current Geo Position for the users ip.
	//========================================================================================
	var getLocation = function() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(setPosition);
		} else {
			return "Geolocation is not supported by this browser.";
		}
	};
	//========================================================================================



	//========================================================================================
	// Set Position
	// sets the latitude and longitude from the current geo location to its proper slots.
	//========================================================================================
	function setPosition(position) {
		$scope.set('geoLocationLat', position.coords.latitude);
		$scope.set('geoLocationLong', position.coords.longitude);
	}
	//========================================================================================



	//========================================================================================
	// Copy To Clipboard
	// Gives the user the chance to quickly get the symbol selected to the clipboard.
	//========================================================================================
	var copyToClipboard = function(selectedSymbol){
		window.prompt("Copy to clipboard: Ctrl+C, Enter", selectedSymbol);
	};
	//========================================================================================



	//===================================================================================
	// Accepts a MouseEvent as input and returns the x and y
	// coordinates relative to the target element.
	//===================================================================================
	var getCrossBrowserElementCoords = function (mouseEvent){
		var result = {
			x: 0,
			y: 0
		};

		if (!mouseEvent){
			mouseEvent = window.event;
		}

		if (mouseEvent.pageX || mouseEvent.pageY){
			result.x = mouseEvent.pageX;
			result.y = mouseEvent.pageY;
		}
		else if (mouseEvent.clientX || mouseEvent.clientY){
			result.x = mouseEvent.clientX + document.body.scrollLeft +
			document.documentElement.scrollLeft;
			result.y = mouseEvent.clientY + document.body.scrollTop +
			document.documentElement.scrollTop;
		}

		if (mouseEvent.target){
			var offEl = mouseEvent.target;
			var offX = 0;
			var offY = 0;

			if (typeof(offEl.offsetParent) != "undefined"){
				while (offEl){
					offX += offEl.offsetLeft;
					offY += offEl.offsetTop;

					offEl = offEl.offsetParent;
				}
			}
			else{
				offX = offEl.x;
				offY = offEl.y;
			}

			result.x -= offX;
			result.y -= offY;
		}

		return result;
	};
	//===================================================================================



	//===================================================================================
	// Tries to return the actual key symbol as it was typed from the users keyboard to
	// simulate a text box input.
	//===================================================================================
	var getProperKeySymbol = function(n){
		if( 47<=n && n<=90 ){
			if(!$scope.shiftKeyIsDown){
				return (String.fromCharCode(n)).toLowerCase();
			}
			else{
				if(48<=n && n<=56){
					if(n==49) return '!';
					if(n==50) return '"';
					if(n==51) return '#';
					if(n==52) return '$';
					if(n==53) return '%';
					if(n==54) return '&';
					if(n==55) return "'";
					if(n==56) return '(';
					if(n==57) return ')';
				}
				else{
					return String.fromCharCode(n);
				}
			}
		}
		if( 96<=n && n<=105){ return (n-96); }
		if(n==9)  return '    ';
		if(n==32) return ' ';
		if(n==37) return '←';
		if(n==38) return '↑';
		if(n==39) return '→';
		if(n==40) return '↓';

		if(!$scope.shiftKeyIsDown){
			if(n==189) return '-';
			if(n==222) return '^';
			if(n==220 || n==226) return '\\';
			if(n==192) return '@';
			if(n==219) return '[';
			if(n==187) return ';';
			if(n==186) return ':';
			if(n==221) return ']';
			if(n==188) return ',';
			if(n==190) return '.';
			if(n==191) return '/';
			if(n==110) return '.';
			if(n==111) return '/';
			if(n==106) return '*';
			if(n==107) return '+';
			if(n==109) return '-';
		}
		else{
			if(n==189) return '=';
			if(n==222) return '~';
			if(n==220) return '|';
			if(n==226) return '_';
			if(n==192) return '\`';
			if(n==219) return '{';
			if(n==187) return '+';
			if(n==186) return '*';
			if(n==221) return '}';
			if(n==188) return '<';
			if(n==190) return '>';
			if(n==191) return '?';
		}
		return '';
	};
	//===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
