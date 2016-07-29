//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013), v3.1(2015)
//
// Project Leader & Lead Meme Media Architect: Yuzuru Tanaka
// Webble System Lead Architect & Developer: Micke Nicander Kuwahara
// Server Side Developer: Giannis Georgalis
// Additional Support: Jonas Sjöbergh
//
// This file is part of Webble World (c).
// ******************************************************************************************
// Webble World is licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ******************************************************************************************
// The use of the word "Webble" or "webble" for the loadable meme media objects are limited
// only to objects that actually loads in this original Webble World Platform. Modifications
// of the meme media object code which leads to breaking of compatibility with the original
// Webble World platform, may no longer be referred to as a "Webble" or "webble".
// ******************************************************************************************
//====================================================================================================================
'use strict';

//====================================================================================================================
//
// PLATFORM ROOT CONTROLLER (PlatformCtrl)
//
// This is the main controller for the Webble World platform
//
//====================================================================================================================
ww3Controllers.controller('PlatformCtrl', function ($scope, $rootScope, $location, $modal, $log, $q, $http, $route, $filter, $window, $compile, $timeout, localStorageService, gettext, gettextCatalog, Enum, wwConsts, dbService, menuItemsFactoryService, appPaths, bitflags, getKeyByValue, getUrlVars, fromKeyCode, isValidEnumValue, isValidStyleValue, getCSSClassPropValue, jsonQuery, Slot, authService, valMod, socket, strCatcher, isExist, mathy) {    // DEBUG Mode announcement if logging is not commented out, and even with an alert if this is a non-localhost version
    $log.log('This application currently run in DEBUG mode.');

    //=== PLATFORM PROPERTIES =============================================

    // User Authentication Related
    //-------------------------------
    var authPrompt = null;      // Authentication prompt modal
    // Login / Logout buttons
    $scope.login = function() { openAuthPrompt(false); };
    $scope.signup = function() { openAuthPrompt(true); };
    $scope.logout = function() { authService.logout(); };


    // Filters
    //-------------------------------
    $scope.strFormatFltr = $filter('stringFormat');
    //-------------------------------


    // Appearance and View Template Related
    //-------------------------------------
    $scope.bkgLogoClass = 'noLogoBkg';
    $scope.setBkgLogoClass = function(whatClass){$scope.bkgLogoClass = whatClass;};
    $scope.wsTopPos = '0px';
    $scope.progressManager = {
        isWorking: false,
        isLoading: false,
        soFarLevel: 0
    };
	var waitingServiceDeactivated_ = false;
	$scope.setWaitingServiceDeactivationState = function(newState){waitingServiceDeactivated_ = newState};
    $scope.mouseCursor = 'default';
    $scope.ExistingBitFlagsForPlatformConfigs = Enum.bitFlags_PlatformConfigs;
    var platformBkgColor_ = '#ffffff';
    $scope.getPlatformBkgColor = function(){return platformBkgColor_;};
    $scope.setPlatformBkgColor = function(newPlatformBkgColor){platformBkgColor_ = newPlatformBkgColor;};
    var mwpVisibility_ = 'none';
    $scope.getMWPVisibility = function(){return mwpVisibility_;};
    $scope.setMWPVisibility = function(newVal){if(newVal == 'inline-block' || newVal == 'none'){mwpVisibility_ = newVal;}else{mwpVisibility_ = 'none';}};
    var vcvVisibility_ = 'none';
    $scope.getVCVVisibility = function(){return vcvVisibility_;};
    $scope.setVCVVisibility = function(newVal){if(newVal == 'inline-block' || newVal == 'none'){vcvVisibility_ = newVal;}else{vcvVisibility_ = 'none';}};
	var appViewOpen = true;
	var templateRevisionBehavior_ = Enum.availableOnePicks_templateRevisionBehaviors.askEverytime;
	var untrustedWblsBehavior_ = Enum.availableOnePicks_untrustedWebblesBehavior.allowAll;
	var slimWblBrowserEnabled_ = false;
	$scope.getSlimWblBrowserEnabled = function(){return slimWblBrowserEnabled_;};
	var sharedWS_NoQIM_Enabled_ = false;
    //-------------------------------


    // Quick Info Message
    //-------------------------------------
    $scope.qimTxt = '';
    $scope.qimPos = {x: 0, y: 0};
    $scope.qimSize = {w: 0, h: 0};
    $scope.qimVisibility = false;
	var qimDominance_ = false;
	var qimTimer_;
    // ----------------------------------------


    // Language Related
    //-------------------------------
    var sysLanguage = $window.navigator.userLanguage || $window.navigator.language;
    $scope.getSysLanguage = function() { return sysLanguage.toLowerCase(); };
    $scope.getCurrentLanguage = function(){ return gettextCatalog.currentLanguage; };
    $scope.stringCollection = {
        logging: gettext("Debug Logging On")
    };
    $scope.langChangeTooltipTxt = '';
	$scope.flagImageFound = true;
	$scope.imgError = function(){$scope.flagImageFound = false;}
    //-------------------------------


    // Menu Related
    //-------------------------------
    $scope.menuItems = angular.copy(menuItemsFactoryService.menuItems);
    $scope.getMenuItem = function(itemName){ for (var i = 0,item; item = $scope.menuItems[i]; i++) { if(item.itemName == itemName){ return item; } for (var n = 0, subitem; subitem = item.sublinks[n]; n++) { if(subitem.sublink_itemName == itemName){ return subitem; } } } };
    var originalWebbleMenu_ = angular.copy(menuItemsFactoryService.menuItems[1].sublinks);
	var updatedContent = [
		{name: 'docs', date: '2015-09-02'},
		{name: 'devpack', date: '2015-09-02'}
	];
	$scope.getUpdateDate = function(whatContent){
		for(var i = 0; i < updatedContent.length; i++){
			if(updatedContent[i].name == whatContent){
				return updatedContent[i].date;
			}
		}
		return '';
	};
	$scope.isContentUpdated = function(whatContent){
		for(var i = 0; i < updatedContent.length; i++){
			if(updatedContent[i].name == whatContent && (mathy.monthDiff((new Date(updatedContent[i].date)), (new Date())) <= 1)){
				return true;
			}
		}
		return false;
	};
	$scope.socialMedia = {
		Url: "https://wws.meme.hokudai.ac.jp/",
		Text: gettext("Webble World, meme media object tool for building and using Webble applications")
	};
	$scope.userMenuTxts = {
		signUp: gettext("Sign Up"),
		login: gettext("Login"),
		profileSettings: gettext("Profile Settings"),
		groups: gettext("Groups"),
		adminsDen: gettext("Admin's Den"),
		logout: gettext("Logout")
	};
    //-------------------------------


    // Is Enabled-Flags
    //-------------------------------
    $scope.isLoggingEnabled = wwGlobals.loggingEnabled;
    var menuModeEnabled_ = false;
	$scope.getMenuModeEnabled = function() { return menuModeEnabled_; };
    $scope.setMenuModeEnabled = function(newState){ if(!hardcoreMenuNonBlock){ menuModeEnabled_ = newState;} };
    var isFormOpen_ = false;
    $scope.getIsFormOpen = function(){ return isFormOpen_;};
    $scope.altKeyIsDown = false;
    $scope.shiftKeyIsDown = false;
    $scope.ctrlKeyIsDown = false;
    var isRedoWanted_ = false;
	var blockNextAddUndo_ = false;
	$scope.BlockNextAddUndo = function(){ blockNextAddUndo_ = true; };
	var blockAllAddUndoUntilWeSayOtherwise_ = false;
	$scope.BlockAddUndo = function(){ blockAllAddUndoUntilWeSayOtherwise_ = true; };
	$scope.UnblockAddUndo = function(){ blockAllAddUndoUntilWeSayOtherwise_ = false; };
	var hardcoreMenuNonBlock = false;
    //-------------------------------


    // Route Message Related
    //-------------------------------
    var videoRequest_ = '';
    $scope.getVideoRequest = function(){return videoRequest_;};
    $scope.setVideoRequest = function(whatVR){videoRequest_ = whatVR;};


    // Platform Core Features Related
    //-------------------------------

    // Flag that tells us weather the platform is running at its full potential or only with limited powers
    var currentPlatformPotential_ = Enum.availablePlatformPotentials.Undefined;

    // Webble Instance Id counter, that assign session unique id's for the Webbles created.
    var wblInstanceIdCounter_ = 0;
    $scope.getNewInstanceId = function(){wblInstanceIdCounter_++; return wblInstanceIdCounter_;};

	//Used internally only for angular tracking
	var nextUniqueId = 0;

    // Current workspace and the webbles they contain
    var currWS_ = undefined;
    $scope.getCurrWS = function(){return currWS_;};

    // A list of available (at server) workspaces
    var availableWorkspaces_ = [];
    $scope.setAvailableWorkspaces = function (newArrayOfWS) {availableWorkspaces_ = newArrayOfWS;};
    $scope.getAvailableWorkspaces = function() { return availableWorkspaces_; };

    // A list of available sandbox webble templates
    var availableSandboxWebbles_ = [];
	var listOfLoadedSandboxWebbles_ = [];
	$scope.getIsSandboxPresent = function(){return (listOfLoadedSandboxWebbles_.length > 0 );};

    // A list of open workspaces last time we checked
    var recentWS_ = undefined;
    $scope.getRecentWS = function() { return recentWS_; };

    // A list of all at least once loaded webble definitions since system startup.
    // (A webble definition is a named JSON object containing one or more webbles of one or several templates)
    var webbleDefs_ = [];
    $scope.getWebbleDefs = function(){ return webbleDefs_; };
	var webbleDefMetaDataMemory_ = {};
	$scope.getWebbleDefsMetaDataMemory = function(){ return webbleDefMetaDataMemory_; };

    // A list of all at least once loaded webble templates since system startup. A webble template is a definition of a webble type which owns its own specific view.html file
    var webbleTemplates_ = [];

    // if the webble template currently being loaded requires external libraries outside what Webble World already provides, then those are saved as an array of text-links in this property while loading them
    var wblManifestLibs = [];
    var prevLoadedManifestLibs = [];

    // Current Supported mode level
    var currentExecutionMode_ = Enum.availableOnePicks_ExecutionModes.HighClearanceUser;
    //var currentExecutionMode_ = Enum.availableOnePicks_ExecutionModes.SuperHighClearanceUser;
    $scope.getCurrentExecutionMode = function(){return currentExecutionMode_;};
    //SET more complex and found further down

    // When duplicating or creating webbles in large quantities this property keeps track of the amount of webbles being inserted
    var noOfNewWebbles_ = 0;

	// When deleting Webbles en masse, we keep track of the group to be deleted and kill them one by one
	var victimsOfDeletion_ = [];

    //A list of newly created Webbles and its original def objects used during initiation
    var underDevelopmentData_ = [];
    $scope.AddUDD = function(wblInitObject){underDevelopmentData_.push(wblInitObject);};

    // A list of newly created webbles predecessors history linkage, used to be able to recreate parent child relations etc
    var relationConnHistory_ = [];

    // A list of newly created webbles predecessors history linkage, used to be able to recreate shared model relations beyond family ties
    var longtermrelationConnHistory_ = [];

    // When duplicating or creating webbles en masse this property keeps track of the amount of new templates being loaded
    var noOfNewTemplates_ = 0;

    // When loading a workspace this property keeps track of the amount of new independent Webble families being loaded
    var wblFamiliesInLineForInsertion_ = [];

    // a bit flag container that keeps track of various settings which configures the platform environment
    var platformSettingsFlags_ = Enum.bitFlags_PlatformConfigs.None;
    $scope.getPlatformSettingsFlags = function(){return platformSettingsFlags_};

    // The name or the JSON def object of the last inserted webble def... for future fast retrieval
    var recentWebble_ = [];

    // When duplicating Webbles 'en masse' this little list keeps track of where we are in the process.
    var pendingWebbleDuplees_ = [];

    // If a load has been called with a callback method assigned then it has to be saved away until the new webble is finished loading and tells so
    var pendingCallbackMethod_ = null;

    // Memory of a webble to be used as parameter in callback method
    var pendingCallbackArgument_ = null;

    // a bit flag container that keeps track of various boolean states this platform has to deal with
    var platformCurrentStates_ = Enum.bitFlags_PlatformStates.None;
    $scope.getPlatformCurrentStates = function(){return platformCurrentStates_;};
    $scope.setPlatformCurrentStates = function(newPCS){platformCurrentStates_ = newPCS;};

    // This is the jquery element of this platform
    var platformElement_ = undefined;
    $scope.getPlatformElement = function(){return platformElement_;};
    $scope.setPlatformElement = function(whatPlatformElement){ if(platformElement_ == undefined){ platformElement_ = whatPlatformElement; }};

    // This is the DOM element of the current selected work surface
    var workSurfaceElement_ = undefined;
    $scope.getWSE = function(){ return workSurfaceElement_;};
    $scope.setWSE = function(currWSE){workSurfaceElement_ = currWSE;};

    // future child waiting to be assigned a parent
    var pendingChild_ = undefined;
    $scope.getPendingChild = function(){return pendingChild_;};
    $scope.setPendingChild = function(newPC){pendingChild_ = newPC;};

    // If the system is bundling, maybe one would like to know (for example avoiding too much $apply)
    var isBundling_ = false;
    $scope.getIsBundling = function() { return isBundling_; };

    // Remember who is being share model duplicated when doing all selected
    var sharedModelTemplate = undefined;

	// Remember duplication event data while we still are configuration the duplicated webble(s)
	var duplEventData;

    // Image container element for auto generated images
    var autoGenImageFrame;

	// memory variable to remember which Webble was recently main selected (in case we have to unselect it for a while)
	var lastMainSelectedWbl = undefined;

	// memory variable to remember the name of a chosen Webble, as we enter the Export-form and use after submission
	var WblNameOfPossibleExport_ = "";

	// The start time of application usage
    var applicationStartTime_ = new Date();

    //Temporary watches used in special situations
    var watchingForWebbleExtermination;

    // When switching path, the ws must be saved internally or it will be lost or damaged, this is where it is kept
    var quickSavedWS;

	// If user wants to load a WS without cleaning workboard beforehand, we store the request here and clean first and then call for the new WS.
	var pendingWS;

    // Instead of direct calling location path change, this value is set to the requested path and when all needed prep
    // work is done, then the path is changed
    var locationPathChangeRequest = '';

	// usually undefined, but can be set to point at a current open ModalInstance in order to give the platform power to manipulate it
	var platformAccessedMI;

	// A container for global dynamically created functions generated by code, users, Webbles etc. together with a parser and stringifier for the same
	$scope.wsDynamicJSFuncs = {};
	$scope.wsDynJSFuncMemory = "";
	$scope.wsDynJSFuncParse = function(key, value) {
		if(value && (typeof value === 'string') && value.indexOf("function") === 0){
			var postLabel = ($scope.wsDynJSFuncMemory != "") ? $scope.wsDynJSFuncMemory + "_" : "";
			$scope.wsDynamicJSFuncs[(postLabel + key)] = new Function('return ' + value)();
			$scope.wsDynJSFuncMemory = "";
			return $scope.wsDynamicJSFuncs[(postLabel + key)];
		}
		return value;
	};

	// Flags that keeps track of current Webble loading processes
	var webbleCreationInProcess = false;
	var webblesWaitingToBeLoaded = [];
	var downloadingManifestLibs = false;
	var pleaseQuickLoadInternalSavedWS = false;
	var isDraggingWblBrowserItem = false;

	// Flags that keeps track of platform states
	var waitingForNumberKey_ = 0;

    // flags that knows weather the current workspace is shared and therefore wishes to emit its changes to the outside world
    var liveOnlineInteractionEnabled_ = false;
    $scope.getLOIEnabled = function(){ return liveOnlineInteractionEnabled_; };
    var emitLockEnabled_ = false;
    $scope.getEmitLockEnabled = function(){ return emitLockEnabled_; };
    $scope.setEmitLockEnabled = function(emitLockState){ emitLockEnabled_ = emitLockState; };
	var dontAskJustDoIt = false;
	var hasBeenUpdated_ = false;

    //Trust related variables
    var listOfUntrustedWbls_ = [];
	var listOfTrustedWbls_ = [];
    $scope.getIsUntrustedWblsExisting = function(){return (listOfUntrustedWbls_.length > 0)};
    // $scope.getListAsStringOfUniqueUntrustedWbls() Found further below returns a list of unique untrusted Webbles currently loaded
	var hasAlreadyAsked = false;

    // A set of flags for rescuing weird touch event behavior
    $scope.touchRescuePlatformFlags = {
        noParentSelectPossibleYet: false
    };

    // A set of flags for situations when default behavior needs to be set aside
    $scope.globalByPassFlags = {
		byPassBlockingDeleteProtection: false,
		byPassBlockingPeelProtection: false,
		itHasAlreadyBeenShownThisSession: false
    };

	// A list of custom webble online message rooms that has been created for this session and socket which can be used
	// to communicate between webbles both locally (over the internet) or with other users online
	var onlineMsgRooms = [];

	// This is an object that contains all callback functions registered by webbles within Webble World for all existing
	// events.
	// All callback functions are sent a datapack object as a parameter when they fire which includes different things
	// depending on the event. The targeId post in these datapacks are only useful when the webble are listening to
	// multiple webbles with the same callback.
	var wwEventListeners_ = {
		slotChanged: [],	 		//Returning Data: {targetId: [Instance Id for webble getting slot changed], slotName: [Slot Name], slotValue: [Slot Value], timestamp: [a chronological timestamp value]}
		deleted: [],                //Returning Data: {targetId: [Instance Id for webble being deleted], timestamp: [a chronical timestamp value]}
		duplicated: [],             //Returning Data: {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
		sharedModelDuplicated: [],	//Returning Data: {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
		pasted: [],                 //Returning Data: {targetId: [Instance Id for webble being pasted], parentId: [Instance Id for Webble that is pasted upon], timestamp: [a chronological timestamp value]}
		gotChild: [],				//Returning Data: {targetId: [Instance Id for webble getting child], childId: [Instance Id for Webble that was pasted], timestamp: [a chronological timestamp value]}
		peeled: [],                 //Returning Data: {targetId: [Instance Id for Webble leaving parent], parentId: [Instance Id for Webble that lost its child], timestamp: [when it happened as ms integer]}
		lostChild: [],              //Returning Data: {targetId: [Instance Id for Webble losing child], childId: [Instance Id for Webble that was peeled away], timestamp: [when it happened as ms integer]}
		keyDown: [],				//Returning Data: {targetId: null[=UNSPECIFIED], key: {code: [key code], name: [key name], released: [True When Key Released], timestamp: [a chronological timestamp value]}
		loadingWbl: [],				//Returning Data: {targetId: [Instance Id for webble that got loaded], timestamp: [a chronological timestamp value]}
		mainMenuExecuted: [],       //Returning Data: {targetId: null[=UNSPECIFIED], menuId: [menu sublink id], timestamp: [a chronological timestamp value]}
		wblMenuExecuted: []         //Returning Data: {targetId: [Instance Id for the Webble executing menu], menuId: [menu item name], timestamp: [a chronological timestamp value]}
	};

	// a queue of handles that should be called (one by one in order) due to events triggered and some helper variables to do that user friendly
	var queueOfHandlersToBeTriggered = [];
	var unqueueingStartTime = 0;
	var unqueueingStartTimeCounter = 0;
	var unqueueingActive = false;
	var unqueueUntriggeredHandlersModal;
    //-------------------------------


    // EasterEgg Properties
    //-------------------------------
    var soFarWord_ = '';
    var eeWord_ = ['KUWAHARA', 'TANAKA', 'MADEINJAPAN'];
    var eeFunc_ = [
        function(){
            $('html > head').append($('<style>.easterEgg { background: center / 239px 222px no-repeat fixed url("https://wws.meme.hokudai.ac.jp/images/extra/mnk.jpg"); }</style>'));
            $scope.bkgLogoClass = 'easterEgg';
            alert('Micke Nicander Kuwahara made this, how about that!!');
        },
        function(){
            $window.open('http://www.amazon.com/Meme-Media-Market-Architectures-Distributing/dp/0471453781/ref=sr_1_5?ie=UTF8&s=books&qid=1252565397&sr=8-5', '_blank');
        },
        function(){
            $window.open('https://www.google.se/search?q=Japan&hl=en&safe=off&rlz=1C1DVCA_enJP357JP357&prmd=imvnsu&source=lnms&tbm=isch&sa=X&ei=tvrzT5zxEeXEmAXa68mEBQ&ved=0CGgQ_AUoAQ&biw=1920&bih=1085', '_blank');
        }
    ];
    //-------------------------------


    // Temporary while developing and debugging
    //-------------------------------
    $scope.debugValue = { txt: '---' };
    //-------------------------------


    //=== EVENT HANDLERS =====================================================================


    //========================================================================================
    // Catch and react on key down events
    //========================================================================================
    $scope.onEventHandler_KeyDown = function($event){
        if($event.altKey && !$scope.altKeyIsDown){
            $scope.altKeyIsDown = true;
        }
        if($event.shiftKey && !$scope.shiftKeyIsDown){
            $scope.shiftKeyIsDown = true;
        }
        if($event.ctrlKey && !$scope.ctrlKeyIsDown){
            $scope.ctrlKeyIsDown = true;
        }

		if($event.keyCode != 18 && $event.keyCode != 16 && $event.keyCode != 13 && $event.keyCode != 17){
            if($scope.executeMenuSelection('', {theAltKey: $event.altKey, theShiftKey: $event.shiftKey, theCtrlKey: $event.ctrlKey, theKey: fromKeyCode($event.keyCode)})){
                $event.preventDefault();
            }
            else{
                var selectedWbls = [];
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    if(aw.scope() != undefined){
                        if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                            selectedWbls.push(aw.scope().getInstanceId());
                        }
                    }
                }
				$scope.fireWWEventListener(Enum.availableWWEvents.keyDown, {targetId: null, key: {code: $event.keyCode, name: fromKeyCode($event.keyCode), released: false}, timestamp: (new Date()).getTime()});
            }
        }

		if($event.keyCode == 13 && isFormOpen_ && platformAccessedMI){
			platformAccessedMI.close();
			platformAccessedMI = undefined;
		}

		// Quick way to load one of a list of recent Webbles
		if(waitingForNumberKey_ > 0){
			if($event.keyCode >= 49 && $event.keyCode <= 57 || $event.keyCode >= 97 && $event.keyCode <= 105){
				var index = (($event.keyCode < 97) ? $event.keyCode : ($event.keyCode - 48)) - 49;
				if(index < recentWebble_.length){
					$scope.loadWebbleFromDef(recentWebble_[index], null);
					if(!$scope.shiftKeyIsDown){
						waitingForNumberKey_ = 0;
						if(isFormOpen_ && platformAccessedMI){
							platformAccessedMI.close();
							platformAccessedMI = undefined;
						}
					}
				}
			}
		}
    };
    //========================================================================================


    //========================================================================================
    // Catch and react on key up events
    //========================================================================================
    $scope.onEventHandler_KeyUp = function($event){
        if($event.keyCode == 18 && $scope.altKeyIsDown){
            $scope.altKeyIsDown = false;
        }
        if($event.keyCode == 16 && $scope.shiftKeyIsDown){
            $scope.shiftKeyIsDown = false;
        }
        if($event.keyCode == 17 && $scope.ctrlKeyIsDown){
            $scope.ctrlKeyIsDown = false;
        }
		$scope.fireWWEventListener(Enum.availableWWEvents.keyDown, {targetId: null, key: {code: $event.keyCode, name: fromKeyCode($event.keyCode), released: true}, timestamp: (new Date()).getTime()});
    };
    //========================================================================================


    //========================================================================================
    // Authentication Event-handlers
    //========================================================================================
    $scope.$on('auth:required', function() {
        openAuthPrompt(false);
    });
    //-----------------------------------------------------------
    $scope.$on('auth:login', function(event, user) {
        var hasUserChanged = ($scope.user == undefined || $scope.user == null || $scope.user.email != user.email);
        $scope.user = user;

        // Set user platform settings if that is not blocked by overrides
        if (!wblwrldSystemOverrideSettings.ignore_UserSettings && hasUserChanged){
            loadUserSettings();
        }
        else{ untrustedWblsBehavior_ = Enum.availableOnePicks_untrustedWebblesBehavior.askFirstTime; }

        if(wblwrldSystemOverrideSettings.sysLang == ''){
            if (gettextCatalog.currentLanguage != user.languages[0]){
                gettextCatalog.currentLanguage = user.languages[0] || 'en';
            }
        }

        loadSandboxWblDefs();

        if($scope.user.role == 'adm'){
            unansweredQPending();
        }
    });
    //-----------------------------------------------------------
    $scope.$on('auth:logout', function() {
        $scope.user = null;
        $scope.cleanActiveWS();
        availableWorkspaces_ = [];
        availableSandboxWebbles_ = [];
		untrustedWblsBehavior_ = Enum.availableOnePicks_untrustedWebblesBehavior.allowAll;
		currentExecutionMode_ = Enum.availableOnePicks_ExecutionModes.HighClearanceUser;
        $scope.getMenuItem('webbles').sublinks = angular.copy(originalWebbleMenu_);
    });
    //========================================================================================


    //========================================================================================
    // Live Online Interaction Event-handlers (for custom Webbles)
    //========================================================================================
    var onInfo = function(data) {		//Used for user custom made webble communication
		for(var i = 0; i < onlineMsgRooms.length; i++){
			if(onlineMsgRooms[i].msgRoomId == data.id){
				for(var n = 0; n < onlineMsgRooms[i].joinedWbls.length; n++){
					if(onlineMsgRooms[i].joinedWbls[n].callback != undefined){
						if(data.user != ($scope.user.username ? $scope.user.username : $scope.user.email) || (onlineMsgRooms[i].joinedWbls[n].excludeSelf == false) ){
							onlineMsgRooms[i].joinedWbls[n].callback(data.msg, data.user);
						}
					}
				}
			}
		}
	};
	//========================================================================================


    //========================================================================================
	// Live Online Interaction Event-handlers (for shared workspaces)
	//========================================================================================
	var onComm = function(data) {
        if (data && data.user && !(data.user == $scope.user.username || data.user == $scope.user.email)) {
            //Lock
            $scope.setEmitLockEnabled(true);

			// Do the requested operation
            if(data.op == Enum.transmitOps.setSelectState){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl && theWbl.scope().getSelectionState() != data.selectState){ theWbl.scope().setSelectionState(data.selectState); }
            }
            else if(data.op == Enum.transmitOps.setSlot){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
                    theWbl.scope().set(data.slotName, data.slotValue);
                    if(data.slotName == 'root:left' || data.slotName == 'root:top'){
                        if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("moved webble ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
                    }
                    else{
						if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("set slot ") + ' "' + data.slotName + '" ' + gettextCatalog.getString("to") + ' ' + data.slotValue + ' ' + gettextCatalog.getString("for webble") + ' [' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
                    }
                }
            }
            else if(data.op == Enum.transmitOps.loadWbl){
                $scope.loadWebbleFromDef(data.wblDef);
				$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("loaded webble ") + '[' + data.wblDef.webble.defid + ']'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});} });
            }
            else if(data.op == Enum.transmitOps.deleteWbl){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
				var wblName = "";
                if(theWbl){
					wblName = theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')';
					$scope.requestDeleteWebble(theWbl);
				}
				$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("deleted webble ") + '[' + wblName + ']'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});} });
            }
            else if(data.op == Enum.transmitOps.pasteWbl){
                var theChild = $scope.getWebbleByInstanceId(data.child);
                var theParent = $scope.getWebbleByInstanceId(data.parent);
                if(theChild && theParent){ theChild.scope().paste(theParent); }
				$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("pasted webble ") + '[' + theChild.scope().theWblMetadata['displayname'] + ' (' + data.target + ')] onto new parent [' + theParent.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);} });
            }
            else if(data.op == Enum.transmitOps.peelWbl){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
					var parentName = theWbl.scope().getParent().scope().theWblMetadata['displayname'] + ' (' + theWbl.scope().getParent().scope().getInstanceId() + ')'
                    theWbl.scope().peel();
					$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("peeled webble ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')] from its parent [' + parentName + ']'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);} });
                }
            }
            else if(data.op == Enum.transmitOps.connSlots){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
                    theWbl.scope().connectSlots(data.parentSlot, data.childSlot, data.directions);
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("connected child slot ") + ' "' + data.childSlot + '" ' + gettextCatalog.getString("with parent slot") + ' ' + data.parentSlot + ' ' + gettextCatalog.getString("for webble") + ' [' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
                }
            }
            else if(data.op == Enum.transmitOps.addCustSlot){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
                    var theNewSlot = new Slot(data.slot.name,
						data.slot.value,
						data.slot.displayName,
						data.slot.desc,
						data.slot.cat,
						data.slot.metadata,
                        undefined
                    );
                    theNewSlot.setIsCustomMade(true);

                    if(data.slot.elPntr){
                        // make sure all elements has ids, the same way that they got them when the custom slot was created
                        var index = 0;
                        theWbl.scope().theView.find('*').addBack().each(function(){
                            var tagName = $(this).get(0).tagName;
                            var elmId = $(this).attr('id');
                            if(!elmId){
                                index++;
                                elmId = 'myElement' + index + '_' + tagName;
                                $(this).attr('id', elmId);
                            }
                        });

                        var elementId = '#' + theNewSlot.getName().substr(0, theNewSlot.getName().indexOf(':'));
                        var theElmnt = theWbl.scope().theView.parent().find(elementId);
                        theNewSlot.setElementPntr(theElmnt);
                        theWbl.scope().setStyle(theElmnt, theNewSlot.getName(), theNewSlot.getValue());
                    }
                    theWbl.scope().addSlot(theNewSlot);
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("created custom slot ") + ' "' + data.slot.name + '" ' + gettextCatalog.getString("for Webble") + ' [' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')] ' + gettextCatalog.getString("with value") + ' ' + data.slot.value), 4000, {w: 250, h: 150}, {x: 0, y: parseInt($scope.wsTopPos)});}
                }
            }
            else if(data.op == Enum.transmitOps.removeCustSlot){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
                    theWbl.scope().removeSlot(data.slotname);
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("deleted custom slot ") + ' "' + data.slotname + '" ' + gettextCatalog.getString("for webble") + ' [' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
                }
            }
            else if(data.op == Enum.transmitOps.bundle){
                var bundleDef = wwConsts.bundleContainerWblDef;
                var bundleContentStr = data.bundleData;
                bundleDef['webble']['private'] = {bundlecontent: bundleContentStr, creatingbundle: true};
                $scope.loadWebbleFromDef(bundleDef, $scope.connectBundleContent);
				$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("bundled a bunch of webbles")), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);} });
            }
            else if(data.op == Enum.transmitOps.unbundle){
                var theWbl = $scope.getWebbleByInstanceId(data.target);
                if(theWbl){
					var listOfBundleChildren = [];
					var bundleName = theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')';
					for(var i = 0, bcWbl; bcWbl = $scope.getAllDescendants(theWbl.scope().theView)[i]; i++){
						bcWbl.scope().setIsBundled(bcWbl.scope().getIsBundled() - 1);
						if(bcWbl.scope().theWblMetadata['templateid'] != theWbl.scope().theView.scope().theWblMetadata['templateid']){
							listOfBundleChildren.push(bcWbl.scope().theWblMetadata['defid']);
						}
					}

					while(theWbl.scope().getChildren().length > 0){
						theWbl.scope().getChildren()[0].scope().peel();
					}

					$scope.addUndo({op: Enum.undoOps.unbundle, target: undefined, execData: [{wblDef: theWbl.scope().createWblDef(true)}]});
					$scope.requestDeleteWebble(theWbl.scope().theView, false);
					$scope.updateListOfUntrustedWebbles(listOfBundleChildren);
					$timeout(function(){ $scope.setEmitLockEnabled(false);}, 100);
					$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("unbundled the bundle with id ") + '[' + bundleName + ']'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);} });
                }
            }
			else if(data.op == Enum.transmitOps.sharedModelDuplicate){
				var theWbl = $scope.getWebbleByInstanceId(data.target);
				var theSMCWbl = $scope.getWebbleByInstanceId(data.SMC);
				if(theWbl && theSMCWbl){
					theSMCWbl = {wbl: theSMCWbl};
					theWbl.scope().connectSharedModel(theSMCWbl);
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("shared model duplicated ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]' + gettextCatalog.getString("with new loaded webble") + ' [' + theSMCWbl.wbl.scope().theWblMetadata['displayname'] + ' (' + theSMCWbl.wbl.scope().getInstanceId() + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);}
				}
			}
			else if(data.op == Enum.transmitOps.setProtection){
				var theWbl = $scope.getWebbleByInstanceId(data.target);
				if(theWbl){
					theWbl.scope().setProtection(data.protectionSetting);
					for(var i = 0, selWbl; selWbl = $scope.getSelectedWebbles()[i]; i++ ){
						selWbl.scope().setProtection(data.protectionSetting);
					}
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("changed webble protection flags for webble ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]' + gettextCatalog.getString("and any other webble currently selected")), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
				}
			}
			else if(data.op == Enum.transmitOps.setCustomMenu){
				var theWbl = $scope.getWebbleByInstanceId(data.target);
				if(theWbl){
					// Store the customizations in a slot
					if(theWbl.scope().gimme('customContextMenu') == null){
						theWbl.scope().addSlot(new Slot('customContextMenu',
							{},
							'Custom Context Menu',
							'Data for customizing the Webble Context Menu',
							'wblIntrnlCstm',
							undefined,
							undefined
						));
					}
					theWbl.scope().getSlot('customContextMenu').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);

					var ccm = { dmi: [], cmi: [] };

					for(var i = 0, fdmi; fdmi = data.customMenu.dmi[i]; i++){
						if(!fdmi.enabled){
							ccm.dmi.push(fdmi.id);
						}
					}

					for(var i = 0, fcmi; fcmi = data.customMenu.cmi[i]; i++){
						var storabelAP = [];
						for(var j = 0, fap; fap = fcmi.actionPack[j]; j++){
							storabelAP.push({
								slot: fap.slot,
								formula: fap.formula
							});
						}

						if(fcmi.id != '' && fcmi.name != '' && storabelAP.length > 0){
							ccm.cmi.push({
								id: fcmi.id,
								name: fcmi.name,
								actionPack: storabelAP,
								enabled: fcmi.enabled
							});
						}
					}

					if(ccm.dmi.length != 0 || ccm.cmi.length != 0){
						theWbl.scope().set('customContextMenu', ccm);
					}
					else{
						theWbl.scope().removeSlot('customContextMenu');
					}

					// Make the changes and enable all modifications and customizations
					for(var i = 0, dmi; dmi = data.customMenu.dmi[i]; i++){
						if(dmi.enabled){
							theWbl.scope().removePopupMenuItemDisabled(dmi.id)
						}
						else{
							theWbl.scope().addPopupMenuItemDisabled(dmi.id);
						}
					}

					theWbl.scope().internalCustomMenu = [];
					for(var i = 0, cmi; cmi = data.customMenu.cmi[i]; i++){
						theWbl.scope().internalCustomMenu.push({itemId: cmi.id, itemTxt: cmi.name});
						if(cmi.enabled){
							theWbl.scope().removePopupMenuItemDisabled(cmi.id)
						}
						else{
							theWbl.scope().addPopupMenuItemDisabled(cmi.id);
						}
					}
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("customized the webble menu for webble ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
				}
			}
			else if(data.op == Enum.transmitOps.setCustomIO) {
				var theWbl = $scope.getWebbleByInstanceId(data.target);
				if(theWbl){
					// Store the customizations in a slot
					if(theWbl.scope().gimme('customInteractionObjects') == null){
						theWbl.scope().addSlot(new Slot('customInteractionObjects',
							{},
							'Custom Interaction Objects',
							'Data for customizing the Webblw Interaction Objects',
							'wblIntrnlCstm',
							undefined,
							undefined
						));
					}

					var cio = [];
					var isUnedited = true;
					for(var i = 0, fio; fio = data.theIO[i]; i++){
						if(fio.name != ''){
							var storableAP = [];
							for(var j = 0, fap; fap = fio.actionPack[j]; j++){
								storableAP.push({
									slot: fap.slot,
									formula: fap.formula
								});
							}
							cio.push({
								index: fio.index,
								name: fio.name,
								tooltip: fio.tooltip,
								action: fio.action,
								actionPack: storableAP,
								mouseEvType: fio.mouseEvType,
								enabled: fio.enabled
							});
						}
						else{
							cio.push({ index: fio.index, name: '', tooltip: 'undefined', action: 'None', actionPack: [], mouseEvType: '', enabled: false });
						}
					}

					theWbl.scope().set('customInteractionObjects', cio);

					for(var i = 0, io; io = cio[i]; i++) {
						theWbl.scope().theInteractionObjects[i].scope().setName(io.name);
						theWbl.scope().theInteractionObjects[i].scope().tooltip = io.tooltip;
						theWbl.scope().theInteractionObjects[i].scope().setIsEnabled(io.enabled);
					}
					theWbl.scope().getSlot('customInteractionObjects').setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
					if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("customized the Interaction objects for webble ") + '[' + theWbl.scope().theWblMetadata['displayname'] + ' (' + data.target + ')]'), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}
				}
			}
            else if(data.op == Enum.transmitOps.getCurrentChanges){
                if(data.updatedWSDef && !hasBeenUpdated_){
					var currentWS = JSON.stringify(getWSDef(undefined));
					var otherWS = JSON.stringify(data.updatedWSDef);
					if(currentWS != otherWS){ $timeout(function(){insertUpdatedWS(data.updatedWSDef);}); }
					$scope.setEmitLockEnabled(false);
					$timeout(function(){ if(!sharedWS_NoQIM_Enabled_){$scope.showQIM(('(' + data.user + ') ' + gettextCatalog.getString("sent real-time current updated version of this workspace.")), 4000, undefined, {x: 0, y: parseInt($scope.wsTopPos)}, undefined, true);} });
                }

                if(!data.updatedWSDef){
                    $scope.setEmitLockEnabled(false);
					socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges, updatedWSDef: getWSDef()});
                }
				hasBeenUpdated_ = true;
            }
            else{
                $log.log('unknown transmit operation');
            }

            //Unlock
            if(data.op != Enum.transmitOps.loadWbl && data.op != Enum.transmitOps.getCurrentChanges && data.op != Enum.transmitOps.bundle && data.op != Enum.transmitOps.unbundle){
                $scope.setEmitLockEnabled(false);
            }
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Platform Initial setup
    //========================================================================================
    var platformCtrlSetup = function () {
        // make sure we have a platform menu even when deep linking to an area that does not really care for one, but need it
        if($location.path() != '' && $location.path().search('mediaplayer') == -1){
            $scope.setMenuModeEnabled(true);
        }

        // Fire up and enable all $watch(es)
        watchConfiguration();

        if(!localStorageService.isSupported()){
            $log.warn('This browser does not support Local storage service!');
        }

        var storedLoggingEnabledVal = localStorageService.get('isLoggingEnabled');
        if(storedLoggingEnabledVal == 'true' || storedLoggingEnabledVal == 'false'){
            //noinspection RedundantConditionalExpressionJS
            $scope.isLoggingEnabled = storedLoggingEnabledVal == 'true' ? true : false;
            wwGlobals.loggingEnabled = $scope.isLoggingEnabled;
        }

        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);

        currentPlatformPotential_ = Enum.availablePlatformPotentials.None;
        dbService.doDBAvailabilityTest().then(
            function(data){
                $log.log('Web Service Status: ' + data.webservicestatus + '\n' + 'Database Status: ' + data.dbStatus);
                if(data.dbStatus.search('Ready and responding') > -1) {
                    currentPlatformPotential_ = Enum.availablePlatformPotentials.Full;
                }
                else {
                    currentPlatformPotential_ = Enum.availablePlatformPotentials.Limited;
                    if(!wwDef.WEBSERVICE_ENABLED){
                        currentPlatformPotential_ = wwDef.PLATFORM_DEFAULT_LEVEL;
                        $log.warn('Webservice connection is disabled by code and instead the data delivered is hardcoded.');
                        $log.warn($scope.strFormatFltr('The platform potential has defaulted to the system forced value of [{0} - {1}]. To change this you must change the wwDef settings in app.js.', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_)]));
                    }
                    else{
                        $log.warn($scope.strFormatFltr('The current chosen platform potential is not full(3), instead it is of a lower value ({0} - {1}), \nthe reason for this may be service disabled or system forced limitations.', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_)]));
                    }
                }
            },
            function(errorMessage){
                currentPlatformPotential_ = Enum.availablePlatformPotentials.Limited;
                $log.warn($scope.strFormatFltr('The current chosen platform potential is not full(3), instead it is of a lower value ({0} - {1}), since there seem to be no web service available. Following error message was returned: {2}', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_), errorMessage]));
            }
        ).then(function() { initPlatform(); });
    };
    //========================================================================================


    //========================================================================================
    // This method initiates the webble system platform and makes it ready to interact with
    // the user and enable webble management.
    //========================================================================================
    var initPlatform = function () {
        // Override any internal system settings that has been declared 'externally' from the override javascript file
        platformBkgColor_ = wblwrldSystemOverrideSettings.platform_Background != '' ? wblwrldSystemOverrideSettings.platform_Background : platformBkgColor_;
        if(wblwrldSystemOverrideSettings.systemMenuVisibility != ''){
            if(wblwrldSystemOverrideSettings.systemMenuVisibility == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else if(wblwrldSystemOverrideSettings.systemMenuVisibility == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        if(wblwrldSystemOverrideSettings.sysLang != ''){
            gettextCatalog.currentLanguage = wblwrldSystemOverrideSettings.sysLang;
        }
        if(wblwrldSystemOverrideSettings.popupEnabled != ''){
            if(wblwrldSystemOverrideSettings.popupEnabled == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(wblwrldSystemOverrideSettings.popupEnabled == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
        }
        if(wblwrldSystemOverrideSettings.autoBehaviorEnabled != ''){
          if(wblwrldSystemOverrideSettings.autoBehaviorEnabled == 'true'){
            platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
          }
          else if(wblwrldSystemOverrideSettings.autoBehaviorEnabled == 'false'){
            platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
          }
        }
        $scope.setExecutionMode(wblwrldSystemOverrideSettings.requestedPlatformPotential != -1 ? wblwrldSystemOverrideSettings.requestedPlatformPotential : currentExecutionMode_);
        $rootScope.pageTitle = wblwrldSystemOverrideSettings.pageTitle != '' ? wblwrldSystemOverrideSettings.pageTitle : $rootScope.pageTitle;

        if(wblwrldSystemOverrideSettings.autoLoadedWebblePath.toString().search('http') > -1){
            $scope.loadWblFromURL(wblwrldSystemOverrideSettings.autoLoadedWebblePath, null);
        }
        else if(wblwrldSystemOverrideSettings.autoLoadedWebblePath != ''){
            $scope.loadWblFromURL(appPaths.currentAppUriCore + appPaths.webbleAccessPath + wblwrldSystemOverrideSettings.autoLoadedWebblePath, null);
        }
		if(wblwrldSystemOverrideSettings.templateRevisionBehavior >= 0 && wblwrldSystemOverrideSettings.templateRevisionBehavior <= 2){
			templateRevisionBehavior_ = wblwrldSystemOverrideSettings.templateRevisionBehavior;
		}
		if(wblwrldSystemOverrideSettings.untrustedWblsBehavior >= 0 && wblwrldSystemOverrideSettings.untrustedWblsBehavior <= 3){
			untrustedWblsBehavior_ = wblwrldSystemOverrideSettings.untrustedWblsBehavior;
		}
		if(wblwrldSystemOverrideSettings.slimWblBrowserEnabled != ""){
			if(wblwrldSystemOverrideSettings.slimWblBrowserEnabled == 'true'){
				slimWblBrowserEnabled_ = true;
			}
			else if(wblwrldSystemOverrideSettings.slimWblBrowserEnabled == 'false'){
				slimWblBrowserEnabled_ = false;
			}
		}
		if(wblwrldSystemOverrideSettings.sharedWS_NoQIM_Enabled != ""){
			if(wblwrldSystemOverrideSettings.sharedWS_NoQIM_Enabled == 'true'){
				sharedWS_NoQIM_Enabled_ = true;
			}
			else if(wblwrldSystemOverrideSettings.sharedWS_NoQIM_Enabled == 'false'){
				sharedWS_NoQIM_Enabled_ = false;
			}
		}

        // Configure quick language change button if needed
        if(gettextCatalog.currentLanguage.search('en') == -1){
            $scope.langChangeTooltipTxt = "Change Language";
        }
        else{
            if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
            }
        }

		if($location.path() == '/app'){ displayImportantDevMessage(); }

        var pathQuery = $location.search();
        if(pathQuery.webble && !pathQuery.workspace){
            $timeout(function(){$scope.downloadWebbleDef(pathQuery.webble)});
        }
    };
    //========================================================================================


	//========================================================================================
	// This method displays a hard coded important message to every Webble World visitor the
	// first few times they visit from the development team.
	//========================================================================================
	var displayImportantDevMessage = function(){
		if(!$scope.globalByPassFlags.itHasAlreadyBeenShownThisSession){
			$scope.globalByPassFlags.itHasAlreadyBeenShownThisSession = true;

			//---------------------------------------------------
			//IMPORTANT MESSAGE FROM THE DEV TEAM
			var postedDate = "2015-06-15";
			var cookie = localStorageService.get('alertInfoNews' + postedDate);
			var readTimes = (cookie != undefined) ? parseInt(cookie) : 0;
			var monthsSincePublish = mathy.monthDiff((new Date(postedDate)), (new Date()));
			if(monthsSincePublish <= 2){
				if( readTimes < 3 ){
					localStorageService.add('alertInfoNews' + postedDate, (readTimes + 1));
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettextCatalog.getString("Important News") + '!!! ' + postedDate + ' ' + gettextCatalog.getString("Displayed") + ' ' + (readTimes + 1) + ' ' + gettextCatalog.getString("of") + ' 3 ' + gettextCatalog.getString("times"), size: 'lg', content:
					'<h2>' + gettextCatalog.getString("For Webble Template Developer") + '</h2>' +
					'<p>' +
					gettextCatalog.getString("The latest major Webble world system update also included updating AngularJS framework to 1.3.") + '&nbsp;' +
					gettextCatalog.getString("These changes includes a change of how to declare the Webble controller function (not as a global function anymore, but registered with the Webble World App).") + '&nbsp;' +
					gettextCatalog.getString("This means that all Webbles you have made before this change (published and unpublished) are no longer working properly.") + '&nbsp;' +
					'</br></br><strong>' + gettextCatalog.getString("But it is relatively easy to fix.") + '</strong>&nbsp;' +
					gettextCatalog.getString("Open your Webbles controller file and change the controller declaration line from...") + '&nbsp;' +
					'</br></br><strong>' + gettextCatalog.getString("BEFORE:") + '</strong> <span style="font-family: courier, monospace;">function FUNCTION-NAME($scope, $log, $timeout, Slot, Enum, ETC) { </span>&nbsp;' +
					'</br>' + gettextCatalog.getString("to...") + '&nbsp;' +
					'</br><strong>' + gettextCatalog.getString("AFTER:") + '</strong> <span style="font-family: courier, monospace;">wblwrld3App.controller("FUNCTION-NAME", function($scope, $log, $timeout, Slot, Enum, ETC) { </span>&nbsp;</br></br>' +
					gettextCatalog.getString("Be aware that the controller name is now a string and that the function parameters are just examples and may differ in your Webble (except $scope).") + '&nbsp;</br>' +
					gettextCatalog.getString("You must also change the last line of the function in order to close it properly, from a single curly parenthesis...") + '&nbsp;' +
					'</br></br><strong>' + gettextCatalog.getString("BEFORE:") + '</strong> <span style="font-family: courier, monospace;">} </span>&nbsp;' +
					'</br>' + gettextCatalog.getString("to the following...") + ' &nbsp;' +
					'</br><strong>' + gettextCatalog.getString("AFTER:") + '</strong> <span style="font-family: courier, monospace;">}); </span>&nbsp;</br></br>' +
					gettextCatalog.getString("Thats it. Now the Webble should work just fine.") + '&nbsp;</br>' +
					gettextCatalog.getString("If you have problem understanding above explanation, you can always start a new Webble template project and look at the controller file how it is supposed to look now.") + '&nbsp;</br></br>' +
					gettextCatalog.getString("Another change is the replacement of eventInfo and wblEventInfo with a new internal Event Listener system. If your Webbles use watches to listen to any of those data objects they are now deprecated and have to be changed to the new event handling object.") + '&nbsp;' +
					'</br><i>' + gettextCatalog.getString("Example:") + '</i> <span style="font-family: courier, monospace;">$scope.registerWWEventListener(Enum.availableWWEvents.gotChild, function(eventData){Your callback code}); </span>&nbsp;</br></br>' +
					gettextCatalog.getString("We also strongly recommend to foremost use this internal event listener and secondly use $watches as a part of your Webble solution.") + '&nbsp;</br>' +
					gettextCatalog.getString("Download and read the Development Pack and the ReadMe and the wblCore reference code as well as the updated Webble World Manual (chapter 3) for more details on all that.") + '&nbsp;' +
					'</p>' +
					'<p>' +
					'<i><strong>~' + gettextCatalog.getString("Webble World Development Team, Hokkaido University") + '~</strong></i>' +
					'</p>'
					});
				}
			}
			//---------------------------------------------------
		}
	};

    //========================================================================================
    // This method sets up and configures all $watch(ed)
    // variables that the system and platform need to
    // consider for optimal experience.
    //========================================================================================
    var watchConfiguration = function(){
        // Listen to menu visibility, in order to adjust workspace top alignment
        $scope.$watch(function(){ //noinspection JSBitwiseOperatorUsage
            return ($scope.getMenuModeEnabled() && (parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10))); }, function(newValue, oldValue) {
            if(!newValue){
                $scope.wsTopPos = '0px';
            }
            else{
                $scope.wsTopPos = $('#mainmenu').css('height');
            }
        });


        $scope.$watch(function(){ return parseInt($('#mainmenu').css('height')); }, function(newValue, oldValue) {
            if(!isNaN(newValue) && newValue > 0){
				if(newValue > 500 && ((((new Date()).getTime() - applicationStartTime_.getTime())/1000)/60).toFixed(6) < 0.03){ $log.log("Odd attempt by the main menu to set workspace top pos to extreme value has just been thwarted"); return; }
                $scope.wsTopPos = newValue + 'px';
            }
        });

        // Listen to platform potential, in order to set menu item availability
        $scope.$watch(function(){ return currentPlatformPotential_; }, function(newValue, oldValue) {
            for (var i = 0,item; item = $scope.menuItems[i]; i++) {
                item.visibility_enabled = true;
                for (var n = 0, subitem; subitem = item.sublinks[n]; n++) {
                    subitem.visibility_enabled = true;
                }
            }
            platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);

            if (newValue == Enum.availablePlatformPotentials.Limited || newValue == Enum.availablePlatformPotentials.Slim || newValue == Enum.availablePlatformPotentials.None) {
                $scope.getMenuItem('webbles').visibility_enabled = false;
                $scope.getMenuItem('docs').visibility_enabled = false;
                $scope.getMenuItem('faq').visibility_enabled = false;
                $scope.getMenuItem('support').visibility_enabled = false;
                $scope.getMenuItem('devpack').visibility_enabled = false;
                $scope.getMenuItem('bugreport').visibility_enabled = false;

                if (newValue == Enum.availablePlatformPotentials.Slim || newValue == Enum.availablePlatformPotentials.None) {
                    $scope.getMenuItem('workspace').visibility_enabled = false;
                    $scope.getMenuItem('edit').visibility_enabled = false;
                    $scope.getMenuItem('view').visibility_enabled = false;
                }
                if (newValue == Enum.availablePlatformPotentials.None) {
                    platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                }
            }
        });

        // Listen to location path change, in order to alter menu item availability
        $scope.$watch(function(){ return $location.path(); }, function(newValue, oldValue) {
            if(newValue != oldValue){
                for (var i = 0,item; item = $scope.menuItems[i]; i++) {
                    item.visibility_enabled = true;
                    for (var n = 0, subitem; subitem = item.sublinks[n]; n++) {
                        subitem.visibility_enabled = true;
                    }
                }
                if(newValue != '/app'){
                    $scope.getMenuItem('workspace').visibility_enabled = false;

                    $scope.getMenuItem('edit').visibility_enabled = false;

                    $scope.getMenuItem('toggleconn').visibility_enabled = false;
                    $scope.getMenuItem('wsinfo').visibility_enabled = false;

                    $scope.getMenuItem('webbles').visibility_enabled = false;
					appViewOpen = false;
                }
                else{
					quickLoadInternalSavedWS();
					displayImportantDevMessage();
					appViewOpen = true;
                }

                if(oldValue == '/templates'){
                    loadSandboxWblDefs();

                    var newWblTemplateList = [];
                    for (var i = 0; i < webbleTemplates_.length; i++){
                        if (webbleTemplates_[i]['templaterevision'] != 0 || webbleTemplates_[i]['templateid'] == 'bundleTemplate'){
                            newWblTemplateList.push(webbleTemplates_[i]);
                        }
                    }
                    webbleTemplates_ = newWblTemplateList;
                }
            }
        });

        // Listen to Current Workspace Name so that the web site title can adjust ackordingly
        $scope.$watch(function(){ return (currWS_ ? currWS_.name : ''); }, function(newValue, oldValue) {
            if(newValue != oldValue){
                if(newValue != ''){
                    $rootScope.pageTitle = newValue + gettext(" in") + " Webble World" + " " + wwDef.WWVERSION;
                }
                else{
                    $rootScope.pageTitle = "Webble World" + " " + wwDef.WWVERSION + " - " + gettext("Where memes comes alive");
                }
            }
        });
    };
    //========================================================================================


    //========================================================================================
    // Open Authentication Prompt
    // Open modal for letting user login properly and be aunthenticated.
    //========================================================================================
    var openAuthPrompt = function(authOfferToRegisterByDefault) {
        if (authPrompt != null)
            return authPrompt;

        authPrompt = $modal.open({
            templateUrl: 'views/login.html',
            backdrop: 'static',
            controller: 'LoginCtrl',
            resolve: { authOfferToRegisterByDefault: function() { return authOfferToRegisterByDefault; } }
        });
        authPrompt.result.catch(function() { authService.onAuthCancelled(); } )
            .finally(function() { authPrompt = null; });
        return authPrompt;
    };
    //========================================================================================


    //========================================================================================
    // Load Sandbox Webble Definitions
    // Asks the server for any existing sandbox webble under development that the current
    // user has in his possession.
    //========================================================================================
    var loadSandboxWblDefs = function(callback) {
        dbService.getAllDevelopmentWebbleDefs().then(
            function(sandboxWblDefs) {
                availableSandboxWebbles_ = sandboxWblDefs;
                $scope.getMenuItem('webbles').sublinks = angular.copy(originalWebbleMenu_);

                if(availableSandboxWebbles_.length > 0){
                    var wblMenuList = $scope.getMenuItem('webbles').sublinks;
                    var divider = {"sublink_itemName": "divider", "title": "---", "visibility_enabled": true};
                    wblMenuList.push(divider);

                    for(var i = 0; i < availableSandboxWebbles_.length; i++){
                        var sbwItem = {"sublink_itemName": availableSandboxWebbles_[i].id, "title": gettext("Load Sandbox Webble") + ': ' + availableSandboxWebbles_[i].webble.displayname, "shortcut": "", "visibility_enabled": true};
                        wblMenuList.push(sbwItem);
                    }

					if (pleaseQuickLoadInternalSavedWS){ dontAskJustDoIt = true; quickLoadInternalSavedWS(); }
                }

				if(callback){ callback(); }
            },
            function (msg) {
                $log.log("Error while loading list of available sandbox webbles")
                $log.log(msg);
            }
        );
    };
    //========================================================================================


    //========================================================================================
    //= This method loads the Webble world platform settings from the local storage if it
    //= exists.
    //========================================================================================
    var loadUserSettings = function() {
        if($scope.user){
            var rootPathName = $scope.user.email;
            var storedPlatformSettings = localStorageService.get(rootPathName + wwConsts.storedPlatformSettingsPathLastName);

            if(storedPlatformSettings){
                try{
                    storedPlatformSettings = JSON.parse(storedPlatformSettings);
                }
                catch(err){
                    $log.error($scope.strFormatFltr('parsing user settings failed. File corrupt and will be reset.\n\nError description: {0}',[err.message]));
                    localStorageService.remove(rootPathName + wwConsts.storedPlatformSettingsPathLastName);
                    return;
                }

                platformBkgColor_ = storedPlatformSettings.platformBkgColor != undefined ? storedPlatformSettings.platformBkgColor : platformBkgColor_;
                $scope.setExecutionMode(storedPlatformSettings.currentExecutionMode != undefined ? storedPlatformSettings.currentExecutionMode : null);
                if(storedPlatformSettings.popupEnabled != undefined){
                    if(storedPlatformSettings.popupEnabled == true || storedPlatformSettings.popupEnabled == 'true'){
                        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
                    }
                    else if(storedPlatformSettings.popupEnabled == false || storedPlatformSettings.popupEnabled == 'false'){
                        platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
                    }
                }
                if(storedPlatformSettings.autoBehaviorEnabled != undefined){
                  if(storedPlatformSettings.autoBehaviorEnabled == true || storedPlatformSettings.autoBehaviorEnabled == 'true'){
                    platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
                  }
                  else if(storedPlatformSettings.autoBehaviorEnabled == false || storedPlatformSettings.autoBehaviorEnabled == 'false'){
                    platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
                  }
                }
                if(storedPlatformSettings.systemMenuVisibility != undefined){
                    if(storedPlatformSettings.systemMenuVisibility == true || storedPlatformSettings.systemMenuVisibility == 'true'){
                        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                    }
                    else if(storedPlatformSettings.systemMenuVisibility == false || storedPlatformSettings.systemMenuVisibility == 'false'){
                        platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                    }
                }
                recentWebble_ = storedPlatformSettings.recentWebble != undefined ? (Object.prototype.toString.call(storedPlatformSettings.recentWebble) !== '[object Array]' ? storedPlatformSettings.recentWebble = [storedPlatformSettings.recentWebble] : storedPlatformSettings.recentWebble) : recentWebble_;
				if($location.search().workspace == undefined){
					recentWS_ = storedPlatformSettings.recentWS != undefined ? storedPlatformSettings.recentWS : recentWS_;
				}
				if(storedPlatformSettings.templateRevisionBehavior != undefined){
					templateRevisionBehavior_ = storedPlatformSettings.templateRevisionBehavior;
				}
				if(storedPlatformSettings.untrustedWblsBehavior != undefined){
					untrustedWblsBehavior_ = storedPlatformSettings.untrustedWblsBehavior;
				}
				else{
					untrustedWblsBehavior_ = 1; // default behavior for logged in users
				}
				if(storedPlatformSettings.slimWblBrowserEnabled != undefined){
					slimWblBrowserEnabled_ = storedPlatformSettings.slimWblBrowserEnabled;
				}
				if(storedPlatformSettings.sharedWS_NoQIM_Enabled != undefined){
					sharedWS_NoQIM_Enabled_ = storedPlatformSettings.sharedWS_NoQIM_Enabled;
				}
            }
            else{
                $log.log('No stored platform settings object found for the user [' + $scope.user.email + '].');
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Set Platform Properties
    // This method sets a specified platform property found by name to a specified value and
    // if requested saves it.
    //========================================================================================
    var setPlatformProperties = function(whatPlatformPropName, whatPlatformPropValue, shouldSave) {
        var propWasSet = true;

        if(whatPlatformPropName == 'platformBkgColor'){
            platformBkgColor_ = isValidStyleValue('color', whatPlatformPropValue) ? whatPlatformPropValue : platformBkgColor_;
        }
        else if(whatPlatformPropName == 'currentExecutionMode'){
            $scope.setExecutionMode(isValidEnumValue(Enum.availableOnePicks_ExecutionModes, whatPlatformPropValue) ? (isNaN(whatPlatformPropValue) ? Enum.availableOnePicks_ExecutionModes[whatPlatformPropValue] : whatPlatformPropValue) : null);
        }
        else if(whatPlatformPropName == 'popupEnabled'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
        }
        else if(whatPlatformPropName == 'autoBehaviorEnabled'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
        }
        else if(whatPlatformPropName == 'systemMenuVisibility'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        else if(whatPlatformPropName == 'recentWebble'){
			if(Object.prototype.toString.call( whatPlatformPropValue ) !== '[object Array]') { whatPlatformPropValue = [whatPlatformPropValue]; }
            recentWebble_ = whatPlatformPropValue;
        }
        else if(whatPlatformPropName == 'recentWS'){
            recentWS_ = whatPlatformPropValue;
        }
        else {
            propWasSet = false;
        }

        if (propWasSet && shouldSave)
            $scope.saveUserSettings(false);

        return propWasSet;
    };
    //========================================================================================


	//========================================================================================
	// Prepare Download Webble Template
	// This method is checking the available version of the template being requested to make
	// sure it exists or if there is a newer and better version perhaps.
	// If any of the above mentioned this method tries to fix it if it can or abort.
	//========================================================================================
	var prepareDownloadWblTemplate = function(whatTemplateId, whatTemplateRevision, whatWblDef){
		if(whatTemplateId != 'bundleTemplate'){
			var isInSandbox = null;
			for(var i = 0; i < availableSandboxWebbles_.length; i++){
				if(whatTemplateId == availableSandboxWebbles_[i].webble.templateid){
					isInSandbox = availableSandboxWebbles_[i];
					break;
				}
			}
			if(isInSandbox == null){
				dbService.getWebbleDef(whatTemplateId).then(function(data) {
					var wblTemplateFileList = sortFileListInOrderOfLoading(data.files);
					var topAvailableTemplateVersion = data.webble.templaterevision;
					if(topAvailableTemplateVersion > whatTemplateRevision){
						if(templateRevisionBehavior_ == Enum.availableOnePicks_templateRevisionBehaviors.askEverytime && !dontAskJustDoIt){
							if (confirm($scope.strFormatFltr('There is a more recent version [{2}] of the Webble template "{0}" available than the version [{1}] that was requested. Do you want to use the newer version instead (OK) or stick with the requested older version (Cancel). (Be aware that a newer template version may not be fully compatible with your other Webbles)', [whatTemplateId, whatTemplateRevision, topAvailableTemplateVersion])) == true) {
								downloadWblTemplate(whatTemplateId, topAvailableTemplateVersion, whatWblDef, wblTemplateFileList);
							} else {
								downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, wblTemplateFileList);
							}
						}
						else if(templateRevisionBehavior_ == Enum.availableOnePicks_templateRevisionBehaviors.autoUpdate || dontAskJustDoIt){
							downloadWblTemplate(whatTemplateId, topAvailableTemplateVersion, whatWblDef, wblTemplateFileList);
						}
						else{
							downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, wblTemplateFileList);
						}
					}
					else if(topAvailableTemplateVersion < whatTemplateRevision){
						if (confirm($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist, but there is a template with the same name of lower revision "{2}" available. Do you want to use that one instead (OK) or abandon the loading (Cancel)', [whatTemplateId, whatTemplateRevision, topAvailableTemplateVersion])) == true) {
							downloadWblTemplate(whatTemplateId, topAvailableTemplateVersion, whatWblDef, wblTemplateFileList);
						} else {
							forceResetDownloadFlagsAndMemories();
						}
					}
					else{
						downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, wblTemplateFileList);
					}
				},function(eMsg){
					isInSandbox = null;
					for(var i = 0; i < availableSandboxWebbles_.length; i++){
						if(whatTemplateId == availableSandboxWebbles_[i].webble.templateid){
							isInSandbox = availableSandboxWebbles_[i];
							break;
						}
					}

					if(isInSandbox != null){
						downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, sortFileListInOrderOfLoading(isInSandbox.files));
					}
					else{
						forceResetDownloadFlagsAndMemories();
						$log.error($scope.strFormatFltr('The server does not contain any Webble template with the id "{0}" (of any revision) and can therefore not be loaded. Mission Aborted', [whatTemplateId]));
						alert($scope.strFormatFltr('The server does not contain any Webble template with the id "{0}" (of any revision) and can therefore not be loaded. Mission Aborted', [whatTemplateId]));
					}
				});
			}
			else{
				downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, sortFileListInOrderOfLoading(isInSandbox.files));
			}
		}
		else{
			downloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef, sortFileListInOrderOfLoading(["controllers.js", "styles.css", "view.html"]));
		}
	}
	//========================================================================================


    //========================================================================================
    // Download Webble Template
    // This method loads a new set of webble template files and then adds a new instance of a
    // webble templates using that set to the list of webble templates.
    //========================================================================================
    var downloadWblTemplate = function(whatTemplateId, whatTemplateRevision, whatWblDef, wblTemplateFileList){
        var corePath = $scope.getTemplatePath(whatTemplateId, whatTemplateRevision);

		if(corePath.search(appPaths.webbleSandboxCore) != -1){
			var loadedBefore = false;
			for(var j = 0; j < listOfLoadedSandboxWebbles_.length; j++){
				if(listOfLoadedSandboxWebbles_[j] == whatTemplateId){
					loadedBefore = true;
					break;
				}
			}
			if(!loadedBefore){
				listOfLoadedSandboxWebbles_.push(whatTemplateId);
			}
		}

        $.ajax({url: corePath + appPaths.webbleView,
            success: function(){
				if(wblTemplateFileList.int[0] == appPaths.webbleManifest){
					$.ajax({url: corePath + appPaths.webbleManifest,
						success: function(data){
							if(data["libs"]){
								for(var i = 0; i < data["libs"].length;i++){
									if(!isExist.valueInArray(prevLoadedManifestLibs, data["libs"][i])){
										var urlPath = data["libs"][i];
										if(data["libs"][i].search('http') == -1){
											urlPath = corePath + "/" + data["libs"][i];
										}
										wblManifestLibs.push(urlPath);
										prevLoadedManifestLibs.push(urlPath);
									}
								}
							}
						},
						complete: function(){
							if(wblTemplateFileList.int[0] == appPaths.webbleManifest){ wblTemplateFileList.int.splice(0, 1); }
							finalize3rdPartyFileListAndLoadThem(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
						}
					});
				}
				else{
					finalize3rdPartyFileListAndLoadThem(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
				}
            },
            error: function(){
                $log.error($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist or was broken and can therefore not be loaded.', [whatTemplateId, whatTemplateRevision]));

				if (dontAskJustDoIt) {
					prepareDownloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef);
				}
				else{
					if (confirm($scope.strFormatFltr('It seems the attempt to load the Webble template "{0}" of revision [{1}] did not exist, do you wish to try to load the template using another revision instead (OK) or abandon the loading (Cancel)', [whatTemplateId, whatTemplateRevision])) == true) {
						prepareDownloadWblTemplate(whatTemplateId, whatTemplateRevision, whatWblDef);
					} else {
						// Remove it from the list of healthy compound webbles
						for (var i = 0; i < webbleDefs_.length; i++){
							if (webbleDefs_[i]['defId'] == whatWblDef.webble.defid){
								webbleDefs_.splice(i, 1);
								break;
							}
						}
						forceResetDownloadFlagsAndMemories();
					}
				}
            }
        });
    };
    //========================================================================================


	//========================================================================================
	// Download Webble Template Manifest File
	// This method loads all files (one by one) found in the webble templates manifest file.
	// When done it continues loading the rest of the template.
	//========================================================================================
	var finalize3rdPartyFileListAndLoadThem = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList){
		for(var i = 0; i < wblTemplateFileList.ext.length;i++){
			var urlPath = corePath + "/" + wblTemplateFileList.ext[i];
			if(!isExist.valueInArray(prevLoadedManifestLibs, urlPath)){
				wblManifestLibs.push(urlPath);
				prevLoadedManifestLibs.push(urlPath);
			}
		}

		if(wblManifestLibs.length > 0 && !downloadingManifestLibs){
			downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
		}
		else{
			downloadWblTemplatePartTwo(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
		}
	};
	//========================================================================================


    //========================================================================================
    // Download Webble Template Manifest File
    // This method loads all files (one by one) found in the webble templates manifest file.
    // When done it continues loading the rest of the template.
    //========================================================================================
    var downloadWblTemplateManifestFile = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList){
        if(wblManifestLibs.length > 0 && !downloadingManifestLibs){
            downloadingManifestLibs = true;
            var libItem = wblManifestLibs.shift();
            var libItemExt = libItem.substr(libItem.lastIndexOf('.')+1);

            if(libItemExt == 'css'){
                $.ajax({url: libItem,
                    success: function(){
                        $('<link rel="stylesheet" type="text/css" href="' + libItem + '" >').appendTo("head");
                    },
                    complete: function(){
                        downloadingManifestLibs = false;
                        downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
                    }
                });
            }
            else{
                $.getScript( libItem )
                    .always(function( jqxhr, settings, exception ) {
                        downloadingManifestLibs = false;
                        downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
                    });
            }
        }
        else{
            downloadWblTemplatePartTwo(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
        }
    };
    //========================================================================================


    //========================================================================================
    // Download Webble Template Part Two
    // This method loads the second half of the required template files after any possible
    // manifest files have been loaded.
    //========================================================================================
    var downloadWblTemplatePartTwo = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList){
		if(wblTemplateFileList.int[0] == appPaths.webbleCSS){
			var wblTemplateCSSFile = wblTemplateFileList.int.splice(0, 1);
			$('<link rel="stylesheet" type="text/css" href="' + corePath + wblTemplateCSSFile + '" >').appendTo("head");
			loadTemplatesInternalJavaScripts(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
		}
		else{
			loadTemplatesInternalJavaScripts(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
		}
    };
    //========================================================================================


	//========================================================================================
	// Load Templates Internal JavaScripts
	// Loads the next internal Javascript file for the currently being loaded webble template
	// and after finished load the next or if finished insert the webble.
	//========================================================================================
	var loadTemplatesInternalJavaScripts = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList){
		if(wblTemplateFileList.int.length > 0) {
			var wblTemplateJsFile = wblTemplateFileList.int.shift();
			$.getScript(corePath + wblTemplateJsFile)
				.always(function() {
					loadTemplatesInternalJavaScripts(whatTemplateId, whatTemplateRevision, whatWblDef, corePath, wblTemplateFileList);
				}
			);
		}
		else{
			var wblTemplateExists = false;
			for(var i = 0; i < webbleTemplates_.length; i++){
				if(webbleTemplates_[i].templateid == whatTemplateId){
					webbleTemplates_[i].templaterevision = whatTemplateRevision;
					wblTemplateExists = true;
					break;
				}
			}

			if(!wblTemplateExists){
				webbleTemplates_.push({templateid: whatTemplateId, templaterevision: whatTemplateRevision});
			}

			noOfNewTemplates_--;

			// if no more templates are being loaded Insert the webble into the desktop
			if (noOfNewTemplates_ == 0){
				insertWebble(whatWblDef);
			}
		}
	};
	//========================================================================================

	//========================================================================================
	// Sort File List In Order Of Loading
	// This method takes the file list provided by the webble def file from the server and
	// group it in extrenal 3rd party files and internal files and also sort it in order of
	// required loading.
	//========================================================================================
	var sortFileListInOrderOfLoading = function(unsortedFileList){
		var sortedFileList = {ext: [], int: []};
		if(unsortedFileList){
			var possibleKnownFiles = [appPaths.webbleManifest, appPaths.webbleCSS, appPaths.webbleService, appPaths.webbleFilter, appPaths.webbleDirective, appPaths.webbleCtrl];

			for(var i = 0; i < possibleKnownFiles.length; i++){
				var existIndex = isExist.valueInArray(unsortedFileList, possibleKnownFiles[i].substr(1), true);
				if(existIndex != -1){
					sortedFileList.int.push(possibleKnownFiles[i]);
					unsortedFileList.splice(existIndex, 1);
				}
			}

			for(var i = 0; i < unsortedFileList.length; i++){
				var fileExt = unsortedFileList[i].substr(unsortedFileList[i].lastIndexOf('.')+1);
				if(fileExt == "css" || fileExt == "js"){
					sortedFileList.ext.push(unsortedFileList[i]);
				}
			}
		}

		return sortedFileList;
	};
	//========================================================================================


	//========================================================================================
	// Force Reset Download Flags And Memories
	// This method resets all flags and memory variables by force due to failed and aborted
	// attempt to load a Webble.
	//========================================================================================
	var forceResetDownloadFlagsAndMemories = function(){
		relationConnHistory_ = [];
		pendingCallbackMethod_ = null;
		pendingCallbackArgument_ = null;
		webbleCreationInProcess = false;
		duplEventData = undefined;
		$scope.waiting(false);
		$scope.resetSelections();
		wblFamiliesInLineForInsertion_ = [];
		longtermrelationConnHistory_ = [];
		var pathQuery = $location.search();
		if(pathQuery.webble && pathQuery.workspace){
			var requestedWbl = pathQuery.webble;
			$location.search('webble', null);
			$scope.downloadWebbleDef(requestedWbl)
		}
	};
	//========================================================================================


    //========================================================================================
    // Insert Webble Definition
    // This method creates and insert a webble definition, a number of related webbles of a
    // number of specified classes.
    //========================================================================================
    var insertWebble = function(whatWblDef){
		// Check if the webble def has already been loaded before... (only to keep track, nothing else)
		var webbleDefExist = false;
        for (var i = 0, ewd; ewd = webbleDefs_[i]; i++){
			if (ewd['defid'] == whatWblDef['webble']['defid'] && ewd['author'] == whatWblDef['webble']['author']){
				webbleDefExist = true;
				break;
			}
		}
		if (!webbleDefExist){ webbleDefs_.push(whatWblDef['webble']); }

        var webblesToInsert = jsonQuery.allValByKey(whatWblDef, 'webble');
        noOfNewWebbles_ = webblesToInsert.length;

		// make sure to list trusted and untrusted webbles properly
        if(whatWblDef.is_verified && whatWblDef.is_trusted === false){
            listOfUntrustedWbls_.push(whatWblDef.webble.defid);
        }
		else if(whatWblDef.is_verified && whatWblDef.is_trusted === true){
			listOfTrustedWbls_.push(whatWblDef.webble.defid);
		}
        if(whatWblDef.is_trusted == undefined){
			var webbleDefIsPreviouslyTrusted = false;
			for (var i = 0, tw; tw = listOfTrustedWbls_[i]; i++){
				if (tw == whatWblDef.webble.defid){
					webbleDefIsPreviouslyTrusted = true;
					break;
				}
			}
			if (!webbleDefIsPreviouslyTrusted){ listOfUntrustedWbls_.push(whatWblDef.webble.defid); }
		}

        if(currWS_){
            for(var i = 0; i < webblesToInsert.length; i++){
				if(webblesToInsert[i].templateid != 'bundleTemplate'){
					for(var j = 0; j < webbleTemplates_.length; j++){
						if(webblesToInsert[i].templateid == webbleTemplates_[j].templateid){
							webblesToInsert[i].templaterevision = webbleTemplates_[j].templaterevision;
						}
					}
				}
				currWS_.webbles.push({wblDef: webblesToInsert[i], uniqueId: nextUniqueId++, viewPath: $scope.getTemplatePath(webblesToInsert[i].templateid, webblesToInsert[i].templaterevision) + '/view.html'});
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Insert Workspace
    // This method Inserts a workspace and calls for the insertion of its stored webbles.
    //========================================================================================
    var insertUpdatedWS = function(wsDef){
        wblInstanceIdCounter_ = 0;

        currWS_ = {
            id: wsDef.id,
            name: wsDef.name,
            webbles: [],
            undoMemory: [],
            redoMemory: [],
            creator: wsDef.creator,
            is_shared: wsDef.is_shared
        };

        if(wsDef.webbles){
            if(wsDef.webbles.length > 0){
                $scope.setEmitLockEnabled(true);
                wblFamiliesInLineForInsertion_ = wsDef.webbles;
                var wblFamily = wblFamiliesInLineForInsertion_.shift();
                $scope.loadWebbleFromDef(wblFamily);
            }
			else{
				$scope.setEmitLockEnabled(false);
			}
        }
		else{
			$scope.setEmitLockEnabled(false);
		}
    };
    //========================================================================================


    //========================================================================================
    // Service Response: Get Webble Definition Completed
    // This method manages a successful response form the web service containing the requested
    // data of a Webble definition defined by name and developer.
    //========================================================================================
    var serviceRes_getWebbleDef_Completed = function(whatWblDefId, whatCallBackMethod, data){
        if(data['webble'] != undefined){
            if(data['webble']['defid'] != whatWblDefId){
                $log.error('The Webble Definition file was somehow not formatted correctly so therefore Webble loading was canceled.');
				$scope.waiting(false);
            }
            else{
				if($scope.user != undefined && !data['is_trusted'] && untrustedWblsBehavior_ != Enum.availableOnePicks_untrustedWebblesBehavior.allowAll && (!$scope.getIsUntrustedWblsExisting() || untrustedWblsBehavior_ == Enum.availableOnePicks_untrustedWebblesBehavior.askEveryTime)){
					if(untrustedWblsBehavior_ == Enum.availableOnePicks_untrustedWebblesBehavior.neverAllow){
						$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Untrusted Webbles Allowed"), content: gettext("You are attempting to load an untrusted Webble, which according to your platform settings are not allowed and the operation will therefore immediately be canceled.")}, null);
						forceResetDownloadFlagsAndMemories();
						if($scope.getActiveWebbles().length == 0){
							$scope.cleanActiveWS();
						}
					}
					else {
						var modalInstance = $modal.open({templateUrl: 'views/modalForms/allowNonTrustedSomething.html', windowClass: 'modal-wblwrldform small'});
						modalInstance.result.then(function () {
							webbleDefMetaDataMemory_[whatWblDefId] = {rating: data.rating, ratingCount: data.rating_count, image: data.webble.image, created: data.created, updated: data.updated, isShared: data.is_shared, isTrusted: data.is_trusted, isVerified: data.is_verified};
							$scope.loadWebbleFromDef(data, whatCallBackMethod);
						}, function () {
							$scope.waiting(false);
						});
						hasAlreadyAsked = true;
					}
				}
				else{
					webbleDefMetaDataMemory_[whatWblDefId] = {rating: data.rating, ratingCount: data.rating_count, image: data.webble.image, created: data.created, updated: data.updated, isShared: data.is_shared, isTrusted: data.is_trusted, isVerified: data.is_verified};
					$scope.loadWebbleFromDef(data, whatCallBackMethod);
				}
            }
        }
        else{
            $log.log($scope.strFormatFltr('No webble definition file was found in the database for the webble called {0}.', [whatWblDefId]));
            $scope.waiting(false);
        }
    };
    //========================================================================================


    //========================================================================================
    // Update Undo/Redo List
    // This method make sure that all operations pointing at a Webble that has been deleted
    // is now pointing at undefined and if that webble gets reintroduced the undefined is
    // changed to the new instance id created.
    //========================================================================================
    var updateUndoRedoList = function(whatTargetId, whatChangeId){
        for(var i = 0, op; op = $scope.getCurrWSUndoMemory()[i]; i++){
            if(op.target == whatTargetId){
                op.target = whatChangeId;
            }
            else if(op.execData && op.execData[0] && op.execData[0].parent){
                if(op.execData[0].parent == whatTargetId){
                    op.execData[0].parent = whatChangeId;
                }
            }
        }
        for(var i = 0, op; op = $scope.getCurrWSRedoMemory()[i]; i++){
            if(op.target == whatTargetId){
                op.target = whatChangeId;
            }
            else if(op.execData[0] && op.execData[0].parent){
                if(op.execData[0].parent == whatTargetId){
                    op.execData[0].parent = whatChangeId;
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Execute Undo / Redo
    // This method reverts the last change of collected undoable operations or redo a
    // previous undone.
    //========================================================================================
    var executeUndoRedo = function(isRedo){
        var theOpList, theOp; var actionDirectionStr = "Undid";
        if(!isRedo){ theOpList = $scope.getCurrWSUndoMemory(); }
        else{ theOpList = $scope.getCurrWSRedoMemory(); actionDirectionStr = "Redid";}

        if(theOpList.length > 0){ theOp = theOpList.shift(); } else{ return; }

        var target = theOp.target != undefined ? $scope.getWebbleByInstanceId(theOp.target) : undefined;
        var data = theOp.execData;
        var currState = {op: theOp.op, target: theOp.target, execData: undefined};
        var currStateData = [];
        switch (theOp.op){
            case Enum.undoOps.setSlot:
                if(!target){ return; }
				$scope.BlockAddUndo();
                for(var i = 0; i < data.length; i++){
                    currStateData.push({slotname: data[i].slotname, slotvalue: target.scope().gimme(data[i].slotname)});
					if(data[i].slotname == "customContextMenu"){
						for(var defItem in Enum.availableOnePicks_DefaultWebbleMenuTargets) {
							var wasFound = false;
							if(data[i].slotvalue.dmi) {
								for (var n = 0, dmi; dmi = data[i].slotvalue.dmi[n]; n++) {
									if (dmi == defItem) {
										wasFound = true;
										break;
									}
								}
							}
							if(wasFound){ target.scope().addPopupMenuItemDisabled(defItem); }
							else{ target.scope().removePopupMenuItemDisabled(defItem); }
						}

						target.scope().internalCustomMenu = [];
						if(data[i].slotvalue.cmi) {
							for (var n = 0, cmi; cmi = data[i].slotvalue.cmi[n]; n++) {
								target.scope().internalCustomMenu.push({itemId: cmi.id, itemTxt: cmi.name});
								if(cmi.enabled){ target.scope().removePopupMenuItemDisabled(cmi.id) }
								else{ target.scope().addPopupMenuItemDisabled(cmi.id);}
							}
						}
					}

					if(data[i].slotname == "customInteractionObjects"){
						for(var n = 0; n < target.scope().theInteractionObjects.length; n++){
							var wasFound = false;
							for(var dio in Enum.availableOnePicks_DefaultInteractionObjects){
								var index = Enum.availableOnePicks_DefaultInteractionObjects[dio];
								if(target.scope().theInteractionObjects[n].scope().getIndex() == index){
									if((index) != Enum.availableOnePicks_DefaultInteractionObjects.Rescale || ($scope.user != undefined && $scope.user.role == 'adm')){
										target.scope().theInteractionObjects[n].scope().setIsEnabled(true);
										wasFound = true;
										break;
									}
								}
							}
							if(target.scope().theView.scope().customInteractionBalls){
								for(var n = 0, cib; cib = target.scope().theView.scope().customInteractionBalls[n]; n++){
									if(target.scope().theInteractionObjects[n].scope().getIndex() == cib.index){
										target.scope().theInteractionObjects[n].scope().setIsEnabled(true);
										wasFound = true;
										break;
									}
								}
							}
							if(!wasFound){
								target.scope().theInteractionObjects[n].scope().tooltip = "";
								target.scope().theInteractionObjects[n].scope().setName("");
								target.scope().theInteractionObjects[n].scope().setIsEnabled(false);
							}
						}


						for(var n = 0, io; io = data[i].slotvalue[n]; n++) {
							target.scope().theInteractionObjects[n].scope().setName(io.name);
							target.scope().theInteractionObjects[n].scope().tooltip = io.tooltip;
							target.scope().theInteractionObjects[n].scope().setIsEnabled(io.enabled);
						}
					}
                    target.scope().set(data[i].slotname, data[i].slotvalue);
                }
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$log.log(actionDirectionStr + " some slot set.");
                break;
            case Enum.undoOps.loadWbl:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.deleteWbl;
                currState.target = undefined;
                currStateData.push({wbldef: target.scope().createWblDef(true), SMM: data[0].SMM});
                $scope.requestDeleteWebble(target);
                currState.execData = currStateData;
                $timeout(function(){ $scope.UnblockAddUndo(); });
                if(!isRedo){$log.log(actionDirectionStr + " a webble created");}else{$log.log(actionDirectionStr + " a webble deletion");}
                break;
            case Enum.undoOps.deleteWbl:
				$scope.BlockAddUndo();
				var smmData = data[0].SMM;
				var opDirIsRedo = isRedo;
                $scope.loadWebbleFromDef(data[0].wbldef, function(wblData){
					var target = wblData.wbl.scope().getInstanceId();
					var currState = {op: Enum.undoOps.loadWbl, target: target, execData: [{oldid: wblData.oldInstanceId, SMM: smmData}]};
                    updateUndoRedoList(wblData.oldInstanceId, target);
					if(smmData){ $scope.getWebbleByInstanceId(smmData).scope().connectSharedModel(wblData); }
					$timeout(function(){ $scope.UnblockAddUndo(); });
                    if(!opDirIsRedo){ $scope.getCurrWSRedoMemory().unshift(currState); } else{ $scope.getCurrWSUndoMemory().unshift(currState); }
                });
                if(!isRedo){$log.log(actionDirectionStr + " a webble deletion");}else{$log.log(actionDirectionStr + " a deletion of a webble previously created");}
                break;
            case Enum.undoOps.pasteWbl:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.peelWbl;
				var t = theOp.target;
                currStateData.push({parent: target.scope().getParent().scope().getInstanceId()});
                target.scope().peel();
                target.scope().activateBorder(true, 'gold', undefined, undefined, true);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$timeout(function(){ ($scope.getWebbleByInstanceId(t)).scope().activateBorder(false); }, 3000);
				$log.log(actionDirectionStr + " a paste to parent.");
                break;
            case Enum.undoOps.peelWbl:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.pasteWbl;
                var parent = $scope.getWebbleByInstanceId(data[0].parent);
				var t = theOp.target, p = data[0].parent;
                target.scope().paste(parent);
                target.scope().activateBorder(true, 'pink', undefined, undefined, true);
                parent.scope().activateBorder(true, 'darkred', undefined, undefined, true);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$timeout(function(){ ($scope.getWebbleByInstanceId(t)).scope().activateBorder(false); ($scope.getWebbleByInstanceId(p)).scope().activateBorder(false); }, 3000);
				$log.log(actionDirectionStr + " a peel from parent.");
                break;
            case Enum.undoOps.connSlots:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currStateData.push({connslot: target.scope().getConnectedSlot(), selectslot: target.scope().getSelectedSlot(), slotdir: target.scope().getSlotConnDir()});
                target.scope().connectSlots(data[0].connslot, data[0].selectslot, data[0].slotdir);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$log.log(actionDirectionStr + " a slot connection.");
                break;
            case Enum.undoOps.addCustSlot:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.removeCustSlot;
                currStateData.push({slotname: data[0].slotname, slotvalue: target.scope().gimme(data[0].slotname), slotcat: target.scope().getSlot(data[0].slotname).getCategory()});
                target.scope().removeSlot(data[0].slotname);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$log.log(actionDirectionStr + " an add custom slot " + data[0].slotname);
                break;
            case Enum.undoOps.removeCustSlot:
                if(!target){ return; }
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.addCustSlot;
                currStateData.push({slotname: data[0].slotname});
                var displayInfo = strCatcher.getAutoGeneratedDisplayInfo(data[0].slotname);
                var cSlot = new Slot(data[0].slotname,
                    data[0].slotvalue,
                    displayInfo.name,
                    displayInfo.desc,
                    data[0].slotcat,
                    undefined,
                    undefined
                );
                cSlot.setIsCustomMade(true);
                if(cSlot.getCategory() == 'custom-css'){
                    var elementId = '#' + cSlot.getName().substr(0, cSlot.getName().indexOf(':'));
                    var theElmnt = target.scope().theView.parent().find(elementId);
                    cSlot.setElementPntr(theElmnt);
                    target.scope().setStyle(theElmnt, cSlot.getName(), cSlot.getValue());
                }
                target.scope().addSlot(cSlot);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); });
				$log.log(actionDirectionStr + " a remove custom slot " + data[0].slotname);
                break;
            case Enum.undoOps.bundle:
				$scope.BlockAddUndo();
                currState.op = Enum.undoOps.unbundle;
                currState.target = undefined;
                for(var i = 0, bcWbl; bcWbl = target.scope().getAllDescendants(target)[i]; i++){
                    bcWbl.scope().setIsBundled(bcWbl.scope().getIsBundled() - 1);
                }
                while(target.scope().getChildren().length > 0){
                    target.scope().getChildren()[0].scope().peel();
                }
                currStateData.push({wblDef: target.scope().createWblDef(true)});
                $scope.requestDeleteWebble(target.scope().theView);
                currState.execData = currStateData;
				$timeout(function(){ $scope.UnblockAddUndo(); }, 300);
				$log.log(actionDirectionStr + " a bundle.");
                break;
            case Enum.undoOps.unbundle:
				$scope.BlockAddUndo();
                data[0].wblDef['webble']['private']['creatingbundle'] = true;
                isRedoWanted_ = isRedo;
                $scope.loadWebbleFromDef(data[0].wblDef, $scope.connectBundleContentFromUndo);
				$timeout(function(){ $scope.UnblockAddUndo(); }, 300);
				$log.log(actionDirectionStr + " an unbundle.");
                return;
                break;
            case Enum.undoOps.sharedModelDuplicateSettings:
				if(!target){ return; }
				$scope.BlockAddUndo();
				currState.op = Enum.undoOps.sharedModelDuplicateSettings;
				var currentSharedModelSlotsSettings = {}
				for(var slot in target.scope().getSlots()) {
					currentSharedModelSlotsSettings[slot] = target.scope().getSlot(slot)['isShared'];
					target.scope().getSlot(slot)['isShared'] = data[0].sas[slot];
				}
				currStateData.push({sas: currentSharedModelSlotsSettings});
				currState.execData = currStateData;
				for(var n = 0, ms; ms = target.scope().getModelSharees()[n]; n++){
					ms.scope().getSlots()[slot]['isShared'] = data[0].sas[slot];
				}
				$scope.UnblockAddUndo();
				$log.log(actionDirectionStr + " which slots are model sharing.");
				break;
            case Enum.undoOps.setProtection:
				if(!target){ return; }
				$scope.BlockAddUndo();
				currState.op = Enum.undoOps.setProtection;
				currStateData.push({currProtection: target.scope().getProtection()});
				currState.execData = currStateData;
				target.scope().setProtection(data[0].currProtection);
				$scope.UnblockAddUndo();
				$log.log(actionDirectionStr + " set protection.");
				break;
        }

        if(theOp.op != Enum.undoOps.deleteWbl){
            if(!isRedo){
                $scope.getCurrWSRedoMemory().unshift(currState);
            }
            else{
                $scope.getCurrWSUndoMemory().unshift(currState);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Delete Webble
    // This method deletes the webble provided as parameter from the platform list of webbles
    // in the current active workspace.
    //========================================================================================
    var deleteWbl = function(target, callbackFunc){
		if(target == undefined){ target = (victimsOfDeletion_.length > 0) ? victimsOfDeletion_.pop() : null; }

		if(target != null && target != undefined && target.scope() != undefined && target.scope().theWblMetadata != undefined){
			if(target.scope().theWblMetadata['templateid'] == 'bundleTemplate'){
				target.scope().killBundleSlotWatches();
			}

			//If the webble to be deleted has a parent, disconnect that first
			$scope.globalByPassFlags.byPassBlockingPeelProtection = true;
			if(target.scope().peel(true) == null){ return false; }
			$scope.globalByPassFlags.byPassBlockingPeelProtection = false;

			var targetInstanceId = target.scope().getInstanceId();
			var targetDefId = target.scope().theWblMetadata['defid'];
			var targetIndex;

			$scope.fireWWEventListener(Enum.availableWWEvents.deleted, {targetId: targetInstanceId, timestamp: (new Date()).getTime()});

			//Delete shared model connections
			for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
				if(aw.scope() !== undefined) {
					if(aw.scope().getInstanceId() != targetInstanceId){
						for(var n = 0, ms; ms = aw.scope().getModelSharees()[n]; n++){
							if(ms.scope().getInstanceId() == targetInstanceId){
								aw.scope().getModelSharees().splice(n, 1);

								if(aw.scope().getModelSharees().length == 0){
									for(var slot in aw.scope().getSlots()){
										aw.scope().getSlot(slot)['isShared'] = undefined;
									}
								}

								break;
							}
						}
					}
					else{
						targetIndex = i;
					}
				}
			}

			// Unregister all css slot watches in the webble for proper clean-up
			for(var slot in target.scope().getSlots()){
				var thisSlot = target.scope().getSlot(slot);
				if(thisSlot.cssValWatch){
					thisSlot.cssValWatch();
				}
			}

			// Remove all event handlers for this Webble
			for(var event in wwEventListeners_){
				var newList = [];
				for(var i = 0; i < wwEventListeners_[event].length; i++){
					if(wwEventListeners_[event][i].listenerId != targetInstanceId){
						newList.push(wwEventListeners_[event][i]);
					}
				}
				wwEventListeners_[event] = newList;
			}

			//Remove any possible Online message listeners for this Webble
			$scope.unregisterOnlineMsgRoomListener(targetInstanceId);


			var untrustIndex = -1;
			for(var i = 0; i < listOfUntrustedWbls_.length; i++){
				if(listOfUntrustedWbls_[i] == targetDefId){
					untrustIndex = i;
					break;
				}
			}
			if(untrustIndex != -1){ listOfUntrustedWbls_.splice(i,1); }

			$scope.getCurrWS().webbles.splice(targetIndex, 1);
			target.parent().remove();

			if(victimsOfDeletion_.length == 0){
				$timeout(function(){$scope.waiting(false);});
				if(callbackFunc){ callbackFunc(); }
			}
			else{
				deleteWbl(undefined, callbackFunc);
			}
		}
    };
    //========================================================================================


    //========================================================================================
    // Connect Child Parent
    // This method connects two webbles as child and parent.
    //========================================================================================
    var connectChildParent = function(child, parent, ignoreTesting){
        if (parent && child){

			if(!ignoreTesting){
				// Check so that the child doesn't already have a parent
				if (child.scope().getParent() != undefined){
					$log.warn($scope.strFormatFltr('This child [{0}] already has a parent [{1}] and does not want another [{2}]', [child.scope().getWebbleFullName(), child.scope().getParent().scope().getWebbleFullName(), parent.scope().getWebbleFullName()]));
					return;
				}

				// Check so that child and parent are'nt already related in an unnatural way
				for(var i = 0, d; d = $scope.getAllDescendants(child)[i]; i++){
					if (d.scope().getInstanceId() == parent.scope().getInstanceId()){
						$log.warn('Incest is not allowed!!');
						return;
					}
				}
			}

            if(child.scope().paste(parent)){
				if(!ignoreTesting){
					for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
						if (aw.scope().getInstanceId() == parent.scope().getInstanceId()){
							aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNewParent);
						}
						else if (aw.scope().getInstanceId() == child.scope().getInstanceId()){
							aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNewChild);
						}
					}
				}
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Selected Top Parents
    // This method finds the all selected top parents (parent without any own parent or a
    // parent that is not selected).
    //========================================================================================
    var getSelectedTopParents = function(){
        var superParents = [];

        for(var i = 0, sw; sw = $scope.getSelectedWebbles()[i]; i++){
            var theOneToPick = sw;
            if(sw.scope().getParent()){
                for(var n = 0, anc; anc = $scope.getAllAncestors(sw)[n]; n++){
                    if(anc.scope().getSelectionState() ==  Enum.availableOnePicks_SelectTypes.AsMainClicked){
                        theOneToPick = anc;
                    }
                }
            }
            var isFound = false;
            for(var n = 0, sp; sp = superParents[n]; n++){
                if(sp.scope().getInstanceId() == theOneToPick.scope().getInstanceId()){
                    isFound = true;
                    break;
                }
            }

            if(!isFound){
                superParents.push(theOneToPick);
            }
        }

        return superParents;
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var duplicateAllSelectedWebbles = function(){
        pendingWebbleDuplees_ = getSelectedTopParents();
        duplicateNextSelectedWbl();
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var duplicateNextSelectedWbl = function(){
        var duplee = pendingWebbleDuplees_.shift();
        if(duplee){
            duplee.scope().duplicate({x: 15, y: 15}, duplicateNextSelectedWbl);
        }
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var sharedModelDuplicateAllSelectedWebbles = function(){
        sharedModelTemplate = undefined;
        pendingWebbleDuplees_ = getSelectedTopParents();
        sharedModelDuplicateNextSelectedWbl(null);
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var sharedModelDuplicateNextSelectedWbl = function(wblData){
        if(wblData != null && sharedModelTemplate != undefined){
            sharedModelTemplate.scope().connectSharedModel(wblData);
        }
        sharedModelTemplate = pendingWebbleDuplees_.shift();
        if(sharedModelTemplate){
            sharedModelTemplate.scope().sharedModelDuplicate({x: 15, y: 15}, sharedModelDuplicateNextSelectedWbl);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Publish Webble Content
    // Gets the content to fill this form properly
    //========================================================================================
    var getPublishWebbleContent = function(whatWebble){
        autoGenImageFrame = angular.element(document.createElement("div"));
        autoGenImageFrame.attr('id', 'autoGenImageFrame');
        var theWblFamily = $scope.getAllDescendants(whatWebble);
        var ltrb = {l: 10000, t: 10000, r: 0, b: 0};
        for(var i = 0, wbl; wbl = theWblFamily[i]; i++){
            var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
			var widthUnits = 0, heightUnits = 0;
			try{ widthUnits = Math.round(getUnits(wbl.parent()[0], 'width').pixel); }catch(e){}
			try{ heightUnits = Math.round(getUnits(wbl.parent()[0], 'height').pixel); }catch(e){}
            var wblLTRB = {l: wblLTPos.x, t: wblLTPos.y, r: wblLTPos.x + widthUnits, b: wblLTPos.y + heightUnits};
            if(wblLTRB.l < ltrb.l){
                ltrb.l = wblLTRB.l;
            }
            if(wblLTRB.t < ltrb.t){
                ltrb.t = wblLTRB.t;
            }
            if(wblLTRB.r > ltrb.r){
                ltrb.r = wblLTRB.r;
            }
            if(wblLTRB.b > ltrb.b){
                ltrb.b = wblLTRB.b;
            }
        }

        $scope.getWSE().append(autoGenImageFrame);
        autoGenImageFrame.css('background-color', 'transparent');
        autoGenImageFrame.css('position', 'absolute');
        autoGenImageFrame.css('left', ltrb.l);
        autoGenImageFrame.css('top', ltrb.t);
        autoGenImageFrame.css('width', (ltrb.r - ltrb.l + 7));
        autoGenImageFrame.css('height', (ltrb.b - ltrb.t + 7));

        for(var i = 0, wbl; wbl = theWblFamily[i]; i++){
            var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
            wbl.parent().clone().css('left', (wblLTPos.x - ltrb.l)).css('top', (wblLTPos.y - ltrb.t)).prependTo(autoGenImageFrame);
        }

        var theWblDef = whatWebble.scope().createWblDef(true);
        theWblDef.webble.author = $scope.user.username;

        return {
            wblDef: theWblDef,
            isSameAuthor: $scope.user.username == whatWebble.scope().theWblMetadata['author'],
            theWblElement: autoGenImageFrame,
            sandboxWblList: availableSandboxWebbles_
        };
    };
    //========================================================================================


    //========================================================================================
    // Publish Webble Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var publishWebbleReturned = function(returnData){
        $scope.getWSE().find('#autoGenImageFrame').remove();
        if(returnData){
			$scope.waiting(true);
            var theWbl = $scope.getWebbleByInstanceId(returnData.instanceid);
            theWbl.scope().theWblMetadata['defid'] = returnData.defid;
            theWbl.scope().theWblMetadata['displayname'] = returnData.displayname;
            theWbl.scope().theWblMetadata['description'] = returnData.description;
            theWbl.scope().theWblMetadata['keywords'] = returnData.keywords;
            theWbl.scope().theWblMetadata['image'] = returnData.image;
			theWbl.scope().theWblMetadata['author'] = $scope.user.username;

			if(returnData.sandboxWblPublished){
				quickSaveWSInternal();

				var sandboxMemoryToBeCleared = [];
				for(var i = 0; i < webbleTemplates_.length; i++){
					if(webbleTemplates_[i].templaterevision == 0){
						sandboxMemoryToBeCleared.push(webbleTemplates_[i].templateid)
					}
				}
				for(var j = 0; j < sandboxMemoryToBeCleared.length; j++){
					for(var i = 0; i < webbleTemplates_.length; i++){
						if(webbleTemplates_[i].templateid == sandboxMemoryToBeCleared[j]){
							webbleTemplates_.splice(i, 1);
							break;
						}
					}
					for(var k = 0; k < listOfLoadedSandboxWebbles_.length; k++){
						if(listOfLoadedSandboxWebbles_[k] == sandboxMemoryToBeCleared[j]){
							listOfLoadedSandboxWebbles_.splice(k, 1);
							break;
						}
					}
				}
                loadSandboxWblDefs();
				dontAskJustDoIt = true;
				quickLoadInternalSavedWS();
            }

			$scope.waiting(false);
			$scope.showQIM(gettext("Webble Successfully Published"));
        }
		if(lastMainSelectedWbl != undefined){ lastMainSelectedWbl.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked); lastMainSelectedWbl = undefined; }
    };
    //========================================================================================


	//========================================================================================
	// Get Export Webble Content
	// Gets the content to fill this form properly
	//========================================================================================
	var getExportWebbleContent = function(theWbl, allDescendents){
		var theWblDef = theWbl.scope().createWblDef(true);
		var theWblTemplateList = [];
		for(var i = 0, w; w = allDescendents[i]; i++){
			var theSandboxId = null;
			if(w.scope().theWblMetadata['templateid'] != "bundleTemplate"){
				for(var n = 0, sbw; sbw = availableSandboxWebbles_[n]; n++){
					if(sbw.webble.templateid == w.scope().theWblMetadata['templateid']){
						theSandboxId = sbw.id;
					}
				}
			}

			var templateInfo = {templateId: w.scope().theWblMetadata['templateid'], templateRevision: w.scope().theWblMetadata['templaterevision'], sandboxId: theSandboxId};
			if(templateInfo.sandboxId != undefined){templateInfo.templateRevision = 0}
			var alreadyExist = false;
			for(var n = 0; n < theWblTemplateList.length; n++){
				if(templateInfo.templateId == theWblTemplateList[n].templateId && templateInfo.templateRevision == theWblTemplateList[n].templateRevision && templateInfo.sandboxId == theSandboxId){
					alreadyExist = true;
					break;
				}
			}

			if(!alreadyExist && templateInfo.templateId != "bundleTemplate"){
				theWblTemplateList.push(templateInfo)
			}
		}

		WblNameOfPossibleExport_ = theWblDef.webble.defid;
		return {
			wblDef: theWblDef,
			wblTemplateList: theWblTemplateList,
			platformScope: $scope
		};
	};
	//========================================================================================


	//========================================================================================
	// Export Webble Returned
	// Manages the return data from this form when submitted
	//========================================================================================
	var exportWebbleReturned = function(returnData){
		if(returnData){
			$scope.showQIM(gettext("Webble Successfully Exported to your local computer's browser download folder."), 4000);
		}
	};
	//========================================================================================


    //========================================================================================
    // Load Webble Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var loadWebbleReturned = function(returnData){
        if(returnData){
            if(returnData.webble){
                $scope.loadWebbleFromDef(returnData, null);
            }
            else if(returnData.wblUrl){
                $scope.loadWblFromURL(returnData.wblUrl, null);
            }
        }
    };
    //========================================================================================


	//========================================================================================
	// Import Webble Returned
	// Manages the return data from this form when submitted
	//========================================================================================
	$scope.importWebbleReturned = function(returnData){
		if(returnData){
			if(returnData.webble){
				loadSandboxWblDefs(function(){
					$scope.loadWebbleFromDef(returnData, null);
					$timeout(function(){ $scope.showQIM(gettext("The Webble Package have been imported correctly.")); });
				});
			}
		}
	};
	//========================================================================================


    //========================================================================================
    // Get Platform Properties Content
    // Gets the content to fill this form properly
    //========================================================================================
    var getPlatformPropsContent = function(){
        return {
            platformBkgColor: platformBkgColor_,
            currentExecutionMode: currentExecutionMode_,
            popupEnabled: (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.PopupInfoEnabled) != 0,
            autoBehaviorEnabled: (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled) != 0,
			loggingEnabled: $scope.isLoggingEnabled,
			slimWblBrowserEnabled: slimWblBrowserEnabled_,
			sharedWS_NoQIM_Enabled: sharedWS_NoQIM_Enabled_,
			templateRevisionBehavior: templateRevisionBehavior_,
			untrustedWblsBehavior: untrustedWblsBehavior_
        };
    };
    //========================================================================================


    //========================================================================================
    // platform Properties Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var platformPropsReturned = function(returnData){
        if(returnData){
            platformBkgColor_ = returnData.platformBkgColor;
            $scope.setExecutionMode(returnData.currentExecutionMode);
            if(returnData.popupEnabled == true){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(returnData.popupEnabled == false){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }

            if(returnData.autoBehaviorEnabled == true){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
            else if(returnData.autoBehaviorEnabled == false){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }

			if (returnData.loggingEnabled != $scope.isLoggingEnabled) {
				$scope.isLoggingEnabled = !$scope.isLoggingEnabled;
				wwGlobals.loggingEnabled = $scope.isLoggingEnabled;
				localStorageService.add('isLoggingEnabled', $scope.isLoggingEnabled.toString());
			}

			templateRevisionBehavior_ = returnData.templateRevisionBehavior;
			untrustedWblsBehavior_ = returnData.untrustedWblsBehavior;
			slimWblBrowserEnabled_ = returnData.slimWblBrowserEnabled;
			sharedWS_NoQIM_Enabled_ = returnData.sharedWS_NoQIM_Enabled;

            $scope.saveUserSettings(false);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Workspace Definition
    // Creates and return the content of the workspace (all webbles) in a proper workspace
    // definition object.
    //========================================================================================
    var getWSDef = function(whoCreated){
        var theActiveWS = $scope.getCurrWS();
        var ws = {
            "id": theActiveWS.id,
            "name": theActiveWS.name,
            "creator": (whoCreated ? whoCreated : theActiveWS.creator)
        };

        var wbls = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if(!aw.scope().getParent()){
                wbls.push(aw.scope().createWblDef(true));
            }
        }
        ws["webbles"] = wbls;

        return ws;
    };
    //========================================================================================


    //========================================================================================
    // Has Unanswered FAQ Pending
    // Tells weather there are any pending questions without answers in the FAQ.
    //========================================================================================
    var unansweredQPending = function(){
        dbService.getFAQs().then(function(data){
            if(data.length){
                for(var i = 0, faq; faq = data[i]; i++){
                    if(faq.a == 'Unanswered' || faq.a == ''){
                        $scope.openForm(Enum.aopForms.infoMsg, {
                                title: gettext("Pending Questions in the FAQ"),
                                content: gettext("There are pending questions in the FAQ waiting for your attention. Please visit there and give some good answers.")}
                        );
                        break;
                    }
                }
            }
        },function(eMsg){
            //no info needed
        });
    };
    //========================================================================================


    //========================================================================================
    // Quick Save Save Workspace Internal
    // Tries to save the current active workspace
    //========================================================================================
    var quickSaveWSInternal = function(){
        quickSavedWS = getWSDef();
        $scope.cleanActiveWS();
    };
    //========================================================================================


    //========================================================================================
    // Quick Load Internal Saved Workspace
    // Tries to restore an auto saved workspace
    //========================================================================================
    var quickLoadInternalSavedWS = function(){
		pleaseQuickLoadInternalSavedWS = false;
        if(quickSavedWS){
            if(quickSavedWS.id){
                $scope.insertWS(quickSavedWS);
            }
            else{
                wblFamiliesInLineForInsertion_ = angular.copy(quickSavedWS.webbles);
                quickSavedWS = undefined;
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
            }
        }
		else{
			dontAskJustDoIt = false;
		}
    };
    //========================================================================================


    //========================================================================================
    // Update WorkSurfce
    // Make sure the Webble is loaded and Displayed as it should before it is happy by regular
    // check that Angular has applied everything as it should.
    //========================================================================================
    var updateWorkSurfce = function() {
        if(!$scope.$$phase){
            $scope.$apply();
        }
        if($scope.waiting()){
            $timeout(updateWorkSurfce, 100);
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

	//========================================================================================
	// Register Webble World Event Listener
	// Register an event listener for a specific event for a specific target (self, other or
	// all) and the callback function the webble wish to be called if the event fire.
	// The callback function will then be handed a datapack object containing needed
	// information to react to the event accordingly. (see wwEventListeners_)
	// if targetId is undefined the webble will be listening to itself and if the targetId is
	// set to null it will listen to all webbles.
	//========================================================================================
	$scope.regWblWrldListener = function(listenerId, eventType, callbackFunc, targetId, targetData){
		var eventKey = getKeyByValue(Enum.availableWWEvents, eventType);
		var uid = Math.random() + (nextUniqueId++);
		wwEventListeners_[eventKey].push({uid: uid, listenerId: listenerId, callback: callbackFunc, target: targetId, targetData: targetData});
		return function(){
			for(var i = 0; i < wwEventListeners_[eventKey].length; i++){
				if(wwEventListeners_[eventKey][i].uid == uid){
					wwEventListeners_[eventKey].splice(i, 1);
					break;
				}
			}
		}
	}
	//========================================================================================


	//========================================================================================
	// Fire Webble World Event Listener
	// This method is called if any event anywhere is fired and this in turn will create a
	// queue of handlers that will be notified of the triggered event. If the queue is not already
	// being managed and is not empty then start unqueueing handlers
	//========================================================================================
	$scope.fireWWEventListener = function(eventType, eventData){
		var queueWasEmpty = (queueOfHandlersToBeTriggered.length == 0) ? true : false;
		var eventKey = getKeyByValue(Enum.availableWWEvents, eventType);
		for(var i = 0; i < wwEventListeners_[eventKey].length; i++){
			if(wwEventListeners_[eventKey][i].target === null || eventData.targetId == wwEventListeners_[eventKey][i].target){
				if(wwEventListeners_[eventKey][i].targetData === undefined || eventData.slotName === undefined || (eventData.slotName !== undefined && wwEventListeners_[eventKey][i].targetData == eventData.slotName)){
					queueOfHandlersToBeTriggered.push({cb: wwEventListeners_[eventKey][i].callback, ed: eventData});
				}
			}
		}
		if(!unqueueingActive){
			unqueueingStartTime = (new Date()).getTime();
			unqueueingStartTimeCounter = 1;
			unqueueUntriggeredHandlers();
		}
	}
	//========================================================================================


	//========================================================================================
	// Unqueue Untriggered Handlers
	// This method remove one handler at a time from the queue and calls it.
	//========================================================================================
	var unqueueUntriggeredHandlers = function(timeKeeper){
		unqueueingActive = true;

		while(queueOfHandlersToBeTriggered.length > 0){
			if(unqueueUntriggeredHandlersModal && timeKeeper != undefined && ((new Date()).getTime() - timeKeeper) > 2000){
				$log.log('Still processing event que... If you want to quit waiting, just reload the browser tab.');
				timeKeeper = (new Date()).getTime();
				$timeout(function(){ unqueueUntriggeredHandlers(timeKeeper); }, 500);
				return;
			}

			if(((new Date()).getTime() - unqueueingStartTime) > 20000){
				$log.log('We have been managing event handlers for more than ' + (20 * unqueueingStartTimeCounter) + ' seconds now, and we are still not finished... Please be patient.')
				if(!unqueueUntriggeredHandlersModal && unqueueingStartTimeCounter != 3 && !$scope.isLoggingEnabled){
					$scope.showQIM(gettext("We have been managing event handlers for more than") + " " + (20 * unqueueingStartTimeCounter) + " " + gettext("seconds now, and we are still not finished...") + "\n\n" + gettext("Please be patient."), 1000000, {w: 300, h: 130}, undefined, wwConsts.lightPalette[(unqueueingStartTimeCounter - 1) % wwConsts.lightPalette.length].value);
				}
				unqueueingStartTimeCounter++;
				unqueueingStartTime = (new Date()).getTime();

				if(unqueueingStartTimeCounter == 4){
					$('.quickInfoBox').hide(); $scope.qimVisibility = false;
					timeKeeper = (new Date()).getTime();
					if(!$scope.isLoggingEnabled){
						unqueueUntriggeredHandlersModal = $modal.open({templateUrl: 'views/modalForms/longTimeWaitingKillPerhaps.html', windowClass: 'modal-wblwrldform small'});
						unqueueUntriggeredHandlersModal.result.then(function () {
							$scope.showQIM(gettext("You killed the Webble processing and might now continue working, but don't blame us if any of the unfinished Webbles do not work as you expect. :-)"), 4500, {w: 300, h: 100}, undefined, wwConsts.lightPalette[0].value);
							queueOfHandlersToBeTriggered = [];
							unqueueUntriggeredHandlersModal = undefined;
						}, function () {
							if(queueOfHandlersToBeTriggered.length > 0){
								$scope.showQIM(gettext("We have been managing event handlers for more than") + " " + (20 * (unqueueingStartTimeCounter - 1)) + " " + gettext("seconds now, and we are still not finished...") + "\n\n" + gettext("Please be patient."), 1000000, {w: 300, h: 130}, undefined, wwConsts.lightPalette[(unqueueingStartTimeCounter - 2) % wwConsts.lightPalette.length].value);
							}
							unqueueUntriggeredHandlersModal = undefined;
						});
					}
				}

				if(unqueueUntriggeredHandlersModal && unqueueingStartTimeCounter == 6){
					timeKeeper = undefined
					unqueueUntriggeredHandlersModal.dismiss();
				}
				$timeout(function(){ unqueueUntriggeredHandlers(timeKeeper); }, 500);
				return;
			}

			if(queueOfHandlersToBeTriggered.length > 0){
				var theCallbackObject = queueOfHandlersToBeTriggered.shift();
				theCallbackObject.cb(theCallbackObject.ed);
			}

			if(queueOfHandlersToBeTriggered.length == 0 && ((new Date()).getTime() - unqueueingStartTime) > 30000){
				if(unqueueUntriggeredHandlersModal || $scope.qimVisibility){
					if(unqueueUntriggeredHandlersModal) { unqueueUntriggeredHandlersModal.dismiss(); }
					$log.log('Currently Finished processing events... The platform is all yours.')
					if(!$scope.isLoggingEnabled){
						$scope.showQIM(gettext("Sorry for the delay, but now we are done. \n\n Enjoy your stay!"), 3500, {w: 250, h: 130}, undefined, wwConsts.lightPalette[0].value);
					}
				}
			}
		}
		unqueueingActive = false;
	}
	//========================================================================================


	//========================================================================================
	// Register Online Message Room Listener
	// This method lets the webble register a manager for sending and receiving messages via
	// the server online to other users.
	//========================================================================================
	$scope.registerOnlineMsgRoomListener = function(whatWblId, msgRoomId, eventHandler, excludeSelf){
		var roomExists = true;
		if(onlineMsgRooms.length == 0){ socket.addListener('interaction:info', onInfo); }

		if(!isExist.valueInArrayOfObj(onlineMsgRooms, msgRoomId, "msgRoomId")){
			roomExists = false;
			socket.emit('interaction:started', msgRoomId);
		}

		if(roomExists){
			for(var i = 0; i < onlineMsgRooms.length; i++){
				if(onlineMsgRooms[i].msgRoomId == msgRoomId){
					if(!isExist.valueInArrayOfObj(onlineMsgRooms[i].joinedWbls, whatWblId, "wblId")){
						onlineMsgRooms[i].joinedWbls.push({wblId: whatWblId, callback: eventHandler, excludeSelf: (excludeSelf ? true : false)});
					}
				}
			}
		}
		else{
			onlineMsgRooms.push({msgRoomId: msgRoomId, joinedWbls: [{wblId: whatWblId, callback: eventHandler, excludeSelf: (excludeSelf ? true : false)}]});
		}
	};
	//========================================================================================


	//========================================================================================
	// Unregister Online Message Room Listener
	// This method finds all instances for a webble in all or a specific room and unregister
	// its online message managing participation.
	//========================================================================================
	$scope.unregisterOnlineMsgRoomListener = function(whatWblId, whatRoom){
		var roomKillList = []
		for(var i = 0; i < onlineMsgRooms.length; i++){
			if(whatRoom == undefined || onlineMsgRooms[i].msgRoomId == whatRoom){
				var newJoinedWblsList = onlineMsgRooms[i].joinedWbls;
				for(var n = onlineMsgRooms[i].joinedWbls.length - 1; n >= 0; n--){
					if(onlineMsgRooms[i].joinedWbls[n].wblId == whatWblId){
						newJoinedWblsList.splice(n, 1);
					}
				}
				if(onlineMsgRooms[i].joinedWbls.length != newJoinedWblsList.length){ onlineMsgRooms[i].joinedWbls = newJoinedWblsList; }
				if(onlineMsgRooms[i].joinedWbls.length == 0){ roomKillList.push(i) }
				if(whatRoom != undefined){ break; }
			}
		}

		for(var i = (roomKillList.length - 1); i >= 0; i--){
			socket.emit('interaction:ended', onlineMsgRooms[i].msgRoomId);
			onlineMsgRooms.splice(i, 1);
		}

		if(onlineMsgRooms.length == 0){
			socket.removeListener('interaction:info');
		}
	};
	//========================================================================================


	//========================================================================================
	// Send Online Message
	// This method make a socker emit call on behalf of a custom webble to the server and
	// anyone online listening.
	//========================================================================================
	$scope.sendOnlineMsg = function(whatRoom, whatMsg){
		socket.emit('interaction:info', {id: whatRoom, user: ($scope.user.username ? $scope.user.username : $scope.user.email), msg: whatMsg});
	}
	//========================================================================================


	//========================================================================================
    // Get Template Path
    // This method gets the path to the template as either from the sandbox if a webble by
    // the defined id exists there or otherwise from the default repository.
    //========================================================================================
    $scope.getTemplatePath = function(whatTemplateId, whatTemplateRevision){
        var corePath = '';
        var isInSandbox = false;

        for(var i = 0; i < availableSandboxWebbles_.length; i++){
            if(whatTemplateId == availableSandboxWebbles_[i].webble.templateid){
                isInSandbox = true;
                corePath = appPaths.webbleSandboxCore + availableSandboxWebbles_[i].id + '/0';
                break;
            }
        }

        if(!isInSandbox){
			corePath = appPaths.webbleRepCore + whatTemplateId + '/' + whatTemplateRevision;
        }

        return corePath;
    };
    //========================================================================================


    //========================================================================================
    // Save Platform Properties
    // This method saves the platform properties for current user to the local storage.
    //========================================================================================
    $scope.saveUserSettings = function(isSaveImportantOnly){
        if($scope.user){
            var platformProps = null;
            var rootPathName = $scope.user.email;

            if (isSaveImportantOnly) {
                // Get current user platform settings
                var org_pp = localStorageService.get(rootPathName + wwConsts.storedPlatformSettingsPathLastName);
                if(org_pp){
                    platformProps = JSON.parse(org_pp);
                    platformProps['recentWebble'] = recentWebble_;
                    platformProps['recentWS'] = recentWS_;
                }
            }

            if(!isSaveImportantOnly || platformProps == null)
            {
                // Store the platforms settings to the user profile
                platformProps = {
                    'platformBkgColor': platformBkgColor_,
                    'currentExecutionMode': currentExecutionMode_,
                    'popupEnabled': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.PopupInfoEnabled) != 0,
                    'autoBehaviorEnabled': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled) != 0,
                    'systemMenuVisibility': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled) != 0,
                    'recentWebble': recentWebble_,
					'recentWS': recentWS_,
					'templateRevisionBehavior': templateRevisionBehavior_,
					'untrustedWblsBehavior': untrustedWblsBehavior_,
					'slimWblBrowserEnabled': slimWblBrowserEnabled_,
					'sharedWS_NoQIM_Enabled': sharedWS_NoQIM_Enabled_
                };
            }
            localStorageService.add(rootPathName + wwConsts.storedPlatformSettingsPathLastName, JSON.stringify(platformProps));

        }
    };
    //========================================================================================


    //========================================================================================
    // Insert Workspace
    // This method Inserts a workspace and calls for the insertion of its stored webbles.
    //========================================================================================
    $scope.insertWS = function(wsDef){
		if($scope.getActiveWebbles().length > 0){
			pendingWS = wsDef;
			$scope.cleanActiveWS();
			return;
		}
		else{ pendingWS = undefined; }

        $scope.waiting(true);
        $timeout(updateWorkSurfce, 100);

        wblInstanceIdCounter_ = 0;
        if(currWS_ && currWS_.is_shared && liveOnlineInteractionEnabled_){
            liveOnlineInteractionEnabled_ = false;
			hasBeenUpdated_ = false;
            socket.emit('interaction:ended', currWS_.id);
            socket.removeListener('interaction:comm');
            $log.log('Live Online Interaction for shared workspace turned OFF');
        }

        currWS_ = {
            id: wsDef.id,
            name: wsDef.name,
            webbles: [],
            undoMemory: [],
            redoMemory: [],
            creator: wsDef.creator,
            is_shared: wsDef.is_shared
        };
		recentWS_ = wsDef.id;

		//Shared Workspace Live Interaction
		if(currWS_.is_shared){
			socket.emit('interaction:started', wsDef.id);
			socket.addListener('interaction:comm', onComm);
			liveOnlineInteractionEnabled_ = true;
			$log.log('Live Online Interaction for shared workspace turned ON');
		}

        if(wsDef.webbles){
            if(wsDef.webbles.length > 0){
                $scope.setEmitLockEnabled(true);
                wblFamiliesInLineForInsertion_ = wsDef.webbles;
                var wblFamily = wblFamiliesInLineForInsertion_.shift();
                $scope.loadWebbleFromDef(wblFamily);
            }
            else{
                $scope.waiting(false);
				if(currWS_.is_shared && !hasBeenUpdated_){ socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges}); }
            }
        }
        else{
            if(wsDef.id){
                dbService.getWorkspace(wsDef.id).then(
                    function(workspace) {
                        currWS_.name = workspace.name;
                        currWS_.creator = workspace.creator;
                        if(workspace.webbles.length > 0 && !($scope.altKeyIsDown && $scope.ctrlKeyIsDown)){
                            $scope.setEmitLockEnabled(true);
                            wblFamiliesInLineForInsertion_ = workspace.webbles;
                            var wblFamily = wblFamiliesInLineForInsertion_.shift();
                            $scope.loadWebbleFromDef(wblFamily);
                        }
                        else{
                            $scope.waiting(false);
							if(currWS_.is_shared && !hasBeenUpdated_){ socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges}); }
                        }
                    },
                    function () {
                        $log.log("ERROR WHILE LOADING WORKSPACE WITH ID " + wsDef.id);
                    }
                );
            }
            else{
                $scope.waiting(false);
            }
        }

        if(wsDef.id){
            $location.search('workspace', wsDef.id);
        }
        else{
            $location.search('workspace', null);
        }
    };
    //========================================================================================


    //========================================================================================
    // Reset Selections
    // This method resets the work surface by removing all selections and half finished
    // connections.
    //========================================================================================
    $scope.resetSelections = function(){
        // Pending clicks gets reset
        $scope.setPendingChild(undefined);
        $scope.setPlatformCurrentStates(bitflags.off($scope.getPlatformCurrentStates(), Enum.bitFlags_PlatformStates.WaitingForParent));

        // remove any webble selection
        $scope.unselectAllWebbles();
    };
    //========================================================================================


    //========================================================================================
    // Clean Active Workspace
    // This method cleans out everything from the current selected workspace and resets the
    // webbles therein.
    //========================================================================================
    $scope.cleanActiveWS = function(){
        var wblsToKill = [];
        $scope.waiting(true);

        $scope.globalByPassFlags.byPassBlockingDeleteProtection = true;

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope() && !aw.scope().getParent()){
                wblsToKill.push(aw);
            }
        }

        for(var i = 0, wtk; wtk = wblsToKill[i]; i++){
            $scope.requestDeleteWebble(wtk);
        }

		if(liveOnlineInteractionEnabled_){
			liveOnlineInteractionEnabled_ = false;
			hasBeenUpdated_ = false;
			socket.emit('interaction:ended', currWS_.id);
			socket.removeListener('interaction:comm');
			$log.log('Live Online Interaction for shared workspace turned OFF');
		}

        if($scope.getActiveWebbles().length > 0){
            watchingForWebbleExtermination = $scope.$watch(function(){return $scope.getActiveWebbles().length;}, function(newVal, oldVal) {
                if(newVal == 0){
                    watchingForWebbleExtermination();
                    $scope.globalByPassFlags.byPassBlockingDeleteProtection = false;
					if(!pendingWS){
						$scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
					}
                    $scope.saveUserSettings(true);
                    if(locationPathChangeRequest != ''){
                        var thePathToGo = locationPathChangeRequest;
                        locationPathChangeRequest = '';
                        $scope.waiting(false);
                        $location.path(thePathToGo);
                    }
					if(pendingWS){
						$scope.insertWS(pendingWS);
					}
                }
            }, true);
        }
        else{
            if(locationPathChangeRequest != ''){
                var thePathToGo = locationPathChangeRequest;
                locationPathChangeRequest = '';
                $location.path(thePathToGo);
            }
			$scope.globalByPassFlags.byPassBlockingDeleteProtection = false;
			$scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
			$scope.saveUserSettings(true);
            $scope.waiting(false);
        }

        listOfUntrustedWbls_ = [];
		listOfLoadedSandboxWebbles_ = [];
    };
    //========================================================================================


    //========================================================================================
    // Load Webble From URL
    // This method tries to load a Webble JSON file from a URI provided as a parameter.
    //========================================================================================
    $scope.loadWblFromURL = function(whatUrl, whatCallbackMethod) {
        dbService.getWebbleDefByURL(whatUrl).then(function(data){
            if(data['webble'] && data['webble']['defid']){
                $scope.loadWebbleFromDef(data, null);
            }
            else{
                $log.error('The Webble Definition file was somehow not formatted correctly so therefore Webble loading was canceled.');
            }
        },function(eMsg){
            $scope.serviceError(eMsg);
        });
    };
    //========================================================================================


    //========================================================================================
    // Download Webble
    // This method calls the server to load a webble. If the webble has been loaded previously
    // it is stored in memory and the system will call it from there instead of the server.
    //========================================================================================
    $scope.downloadWebbleDef = function(whatWblDefId, whatCallbackMethod) {
        if (whatWblDefId != ""){
            $scope.waiting(true);
            $timeout(updateWorkSurfce, 100);
            dbService.getWebbleDef(whatWblDefId, true).then(function(data){serviceRes_getWebbleDef_Completed(whatWblDefId, whatCallbackMethod, data);},function(eMsg){$scope.serviceError(eMsg);});
        }
    };
    //========================================================================================


	//========================================================================================
    // Load From Definition File
    // This method loads a webble from a JSON definition provided as a parameter.
    //========================================================================================
    $scope.loadWebbleFromDef = function(whatWblDef, whatCallbackMethod){
		if(whatWblDef){
			if($scope.user != undefined && (listOfUntrustedWbls_.length == 0 || untrustedWblsBehavior_ >= Enum.availableOnePicks_untrustedWebblesBehavior.askEveryTime) && !hasAlreadyAsked){
				hasAlreadyAsked = false;
				var listOfWebblesToTrustCheck = [whatWblDef.webble.defid];
				dbService.verifyWebbles(listOfWebblesToTrustCheck).then(function(listOfConfirmedTrust){
					if((listOfConfirmedTrust.length == 0 || listOfConfirmedTrust[0] == false) && untrustedWblsBehavior_ > Enum.availableOnePicks_untrustedWebblesBehavior.allowAll){
						if(untrustedWblsBehavior_ == Enum.availableOnePicks_untrustedWebblesBehavior.neverAllow){
							$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Untrusted Webbles Allowed"), content: gettext("You are attempting to load an untrusted Webble, which according to your platform settings are not allowed and the operation will therefore immediately be canceled.")}, null);
							forceResetDownloadFlagsAndMemories();
							if($scope.getActiveWebbles().length == 0){
								$scope.cleanActiveWS();
							}
						}
						else{
							var modalInstance = $modal.open({templateUrl: 'views/modalForms/allowNonTrustedSomething.html', windowClass: 'modal-wblwrldform small'});
							modalInstance.result.then(function () {
								loadWebbleFromDef_AfterTrustCheck(whatWblDef, whatCallbackMethod);
							}, function () {
								forceResetDownloadFlagsAndMemories();
								if($scope.getActiveWebbles().length == 0){
									$scope.cleanActiveWS();
								}
							});
						}
					}
					else{
						loadWebbleFromDef_AfterTrustCheck(whatWblDef, whatCallbackMethod);
					}
				},function(eMsg){
					$scope.serviceError(eMsg);
				});
			}
			else{
				loadWebbleFromDef_AfterTrustCheck(whatWblDef, whatCallbackMethod);
			}
		}
		hasAlreadyAsked = false;
    };
    //========================================================================================


	//========================================================================================
	// Load From Definition File
	// This method loads a webble from a JSON definition provided as a parameter.
	//========================================================================================
	var loadWebbleFromDef_AfterTrustCheck = function(whatWblDef, whatCallbackMethod){
		if(webbleCreationInProcess){
			webblesWaitingToBeLoaded.push({wblDef: whatWblDef, callBack: whatCallbackMethod});
			return;
		}
		webbleCreationInProcess =  true;

		if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.loadWbl, wblDef: whatWblDef});
		}

		if(!$scope.waiting()){
			$scope.waiting(true);
			$timeout(updateWorkSurfce, 100);
		}
		pendingCallbackMethod_ = whatCallbackMethod;
		var insideRecentList = isExist.valueInArrayOfObj(recentWebble_, whatWblDef.webble.defid, ['webble', 'defid'], true);
		if(insideRecentList >= 0){ recentWebble_.splice(insideRecentList, 1); }
		recentWebble_.unshift(whatWblDef);
		if(recentWebble_.length > 5){ recentWebble_.pop(); }
		$scope.saveUserSettings(true);

		// Find the template files and the template name of each webble within the def file.
		var webbleAtomsList = jsonQuery.allValByKey(whatWblDef, 'webble');
		var containingNewWblTemplates = [];

		// Make a list of templates never before loaded
		for(var i = 0; i < webbleAtomsList.length; i++){
			var existAlready = false;

			for (var t = 0; t < webbleTemplates_.length; t++){
				if (webbleAtomsList[i]['templateid'] == webbleTemplates_[t]['templateid'] && webbleAtomsList[i]['templaterevision'] == webbleTemplates_[t]['templaterevision']){
					existAlready = true;
					break;
				}
			}
			for(var n = 0; n < containingNewWblTemplates.length; n++) {
				if(containingNewWblTemplates[n]['templateid'] == webbleAtomsList[i]['templateid'] && containingNewWblTemplates[n]['templaterevision'] == webbleAtomsList[i]['templaterevision']){
					existAlready = true;
					break;
				}
			}
			if(!existAlready){
				containingNewWblTemplates.push({templateid: webbleAtomsList[i]['templateid'], templaterevision: webbleAtomsList[i]['templaterevision']});
			}
		}

		if (containingNewWblTemplates.length == 0){
			insertWebble(whatWblDef);
		}
		else{
			noOfNewTemplates_ = containingNewWblTemplates.length;
			for(var i = 0; i < containingNewWblTemplates.length; i++){
				prepareDownloadWblTemplate(containingNewWblTemplates[i]['templateid'], containingNewWblTemplates[i]['templaterevision'], whatWblDef);
			}
		}
	};
	//========================================================================================



    //========================================================================================
    // Webble Initiation Done
    // This method informs the system that a specific Webble has finished initiating and may
    // now be manipulated with by the platform, for example being assigned a parent or a
    // child.
    //========================================================================================
    $scope.wblInitiationDone = function(whatWebble){
		$scope.fireWWEventListener(Enum.availableWWEvents.loadingWbl, {targetId: whatWebble.scope().getInstanceId(), timestamp: (new Date()).getTime()});

        var thisIsFirst = false;
        // if new webbles are still being added
        if (noOfNewWebbles_ != 0 && whatWebble != undefined){
            // If there is no relationConnHistory items then this is the first webble in the chain which we save away for callback info
            if(relationConnHistory_.length == 0){
				thisIsFirst = true;
                var oldId = underDevelopmentData_[underDevelopmentData_.length-1].initWblDef['instanceid'];
                if(pendingCallbackMethod_ != null){
                    pendingCallbackArgument_ = {wbl: whatWebble, oldInstanceId: oldId, wbldef: underDevelopmentData_[underDevelopmentData_.length-1].initWblDef};
                }
            }

            // Create a an item of ancient history info about the webble who made the call
            var relationHistory = {};
            relationHistory['currWebble'] = whatWebble;

            for(var i = 0, udd; udd = underDevelopmentData_[i]; i++){
                if (udd.newInstanceId == relationHistory.currWebble.scope().getInstanceId()){
                    relationHistory['oldId'] = udd.initWblDef['instanceid'];

                    // If this is the first one and its a duplicate being made than set the eventInfo correctly to inform of this duplication going on
                    if(thisIsFirst && relationConnHistory_.length == 0 && relationHistory['oldId'] != udd.newInstanceId && $scope.getWebbleByInstanceId(relationHistory['oldId']) != undefined){
                        if(!$scope.getWebbleByInstanceId(relationHistory['oldId']).scope().getIsCreatingModelSharee()){
							duplEventData = {targetId: relationHistory['oldId'], copyId: udd.newInstanceId, timestamp: (new Date()).getTime()};
						}
                    }

                    // keep track of children connection
                    var oldChildren = [];
                    var childrenFromDef = udd.initWblDef.children;
                    for(var n = 0, c; c = childrenFromDef[n]; n++){
                        oldChildren.push(c['webble']['instanceid']);
                    }
                    relationHistory['oldChildren'] = oldChildren;

                    // keep track of modelsharees connection
                    var oldModelSharees = [];
                    var modelShareesFromDef = udd.initWblDef.modelsharees.wbls;
                    var slotShareesFromDef = udd.initWblDef.modelsharees.slots;
                    for(var n = 0, ms; ms = modelShareesFromDef[n]; n++){
                        oldModelSharees.push(ms);
                    }
                    relationHistory['oldModelSharees'] = oldModelSharees;
                    relationHistory['oldModelShareesSlots'] = slotShareesFromDef;

                    relationConnHistory_.push(relationHistory);
                    underDevelopmentData_.splice(i, 1);
                    break;
                }
            }

            // If all webbles set to be inserted has done so start the setting of relationships
            if (relationConnHistory_.length == noOfNewWebbles_){

                for(var i = 0, rch; rch = relationConnHistory_[i]; i++){

                    // Connect all children and parents
                    if (rch.oldChildren.length > 0){
                        for(var n = 0, c; c = rch.oldChildren[n]; n++){
                            for(var t = 0, rch2; rch2 = relationConnHistory_[t]; t++){
                                if (c == rch2.oldId){
                                    connectChildParent(rch2.currWebble, rch.currWebble, true);
                                    break;
                                }
                            }
                        }
                    }

                    // Connect all modelsharees
                    if (rch.oldModelSharees.length > 0){
                        for(var n = 0, ms; ms = rch.oldModelSharees[n]; n++){
                            for(var t = 0, rch2; rch2 = relationConnHistory_[t]; t++){
                                if (ms == rch2.oldId){
                                    var alreadyExist = false;

                                    for(var p = 0, nms; nms = rch.currWebble.scope().getModelSharees()[p]; p++){
                                        if(rch2.currWebble.scope().getInstanceId() == nms.scope().getInstanceId()){
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if(!alreadyExist){
                                        rch.currWebble.scope().connectSharedModel({wbl: rch2.currWebble, oldInstanceId: rch2.oldId});
                                    }

                                    for(var slot in rch.currWebble.scope().getSlots()){
                                        rch.currWebble.scope().getSlots()[slot]['isShared'] = false;
                                    }
                                    for(var p = 0, nmsSlot; nmsSlot = rch.oldModelShareesSlots[p]; p++){
                                        rch.currWebble.scope().getSlots()[nmsSlot]['isShared'] = true;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                noOfNewWebbles_ = 0;
            }
			whatWebble.scope().wblStateFlags.readyToStoreUndos = true;
        }

        if (noOfNewWebbles_ == 0){
            longtermrelationConnHistory_ = longtermrelationConnHistory_.concat(relationConnHistory_);
            relationConnHistory_ = [];

			var topParent = $scope.getTopParent(whatWebble);
			if(!pendingCallbackMethod_ || pendingCallbackMethod_.toString().search('sharedModelCandidate') == -1){
				$scope.addUndo({op: Enum.undoOps.loadWbl, target: topParent.scope().getInstanceId(), execData: [{oldid: topParent.scope().theWblMetadata['instanceid']}]});
			}

            var pcm = pendingCallbackMethod_;
            pendingCallbackMethod_ = null;
            var pca = pendingCallbackArgument_;
            pendingCallbackArgument_ = null;
			webbleCreationInProcess = false;
            if (pcm != null){
                pcm(pca);
            }

			if(duplEventData){
				var ded = duplEventData;
				duplEventData = undefined;
				$scope.fireWWEventListener(Enum.availableWWEvents.duplicated, ded);
			}

            // close "wait please" info
            $scope.waiting(false);
            $scope.resetSelections();

            if(wblFamiliesInLineForInsertion_.length > 0){
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
            }
            else{
                $scope.waiting(true);
                for(var i = 0, rch; rch = longtermrelationConnHistory_[i]; i++){
                    // Connect all modelsharees
                    if (rch.oldModelSharees.length > 0){
                        for(var n = 0, ms; ms = rch.oldModelSharees[n]; n++){
                            for(var t = 0, rch2; rch2 = longtermrelationConnHistory_[t]; t++){
                                if (ms == rch2.oldId){
                                    var alreadyExist = false;

                                    for(var p = 0, nms; nms = rch.currWebble.scope().getModelSharees()[p]; p++){
                                        if(rch2.currWebble.scope().getInstanceId() == nms.scope().getInstanceId()){
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if(!alreadyExist){
                                        rch.currWebble.scope().connectSharedModel({wbl: rch2.currWebble, oldInstanceId: rch2.oldId});
                                    }

                                    for(var slot in rch.currWebble.scope().getSlots()){
                                        rch.currWebble.scope().getSlots()[slot]['isShared'] = false;
                                    }
                                    for(var p = 0, nmsSlot; nmsSlot = rch.oldModelShareesSlots[p]; p++){
                                        rch.currWebble.scope().getSlots()[nmsSlot]['isShared'] = true;
                                    }

                                    break;
                                }
                            }
                        }
                    }
                }
                longtermrelationConnHistory_ = [];
                $scope.setEmitLockEnabled(false);
				dontAskJustDoIt = false;
                $scope.waiting(false);

				if(!webbleCreationInProcess && webblesWaitingToBeLoaded.length > 0){
					var lwfdPack = webblesWaitingToBeLoaded.shift();
					$scope.loadWebbleFromDef(lwfdPack.wblDef, lwfdPack.callBack);
				}
				else{
					if(currWS_.is_shared && !hasBeenUpdated_){ socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges}); }
					var pathQuery = $location.search();
					if(pathQuery.webble && pathQuery.workspace){
						var requestedWbl = pathQuery.webble;
						$location.search('webble', null);
						$scope.downloadWebbleDef(requestedWbl)
					}
				}
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Waiting
    // This method turns on or off the appearance indicators in waiting mode
    //========================================================================================
    $scope.waiting = function(isWaitingEnabled) {
		if(isWaitingEnabled){
			if(!waitingServiceDeactivated_) {
				$scope.progressManager.isWorking = true;
				$scope.mouseCursor = 'wait';
			}
		}
		else{
			if(isWaitingEnabled == undefined){
				return $scope.progressManager.isWorking;
			}
			else{
				$scope.progressManager.isWorking = false;
				$scope.mouseCursor = 'default';
			}
		}

        return undefined;
    };
    //========================================================================================


    //========================================================================================
    // Show Quick Info Message
    // Shows the Quick Info Message box with the specicified text for either 2 seconds or the
    // specified time of either default size or the specified size at either the center of
    // the screen or the specified position.
    //========================================================================================
    $scope.showQIM = function(qimText, qimTime, qimSize, qimPos, qimColor, qimDominance){
		if(qimDominance_){ return; }
		if(qimTimer_){ $timeout.cancel(qimTimer_); }

        var showTime = 2500;
        var calcQIMSize = {w: 250, h: 100};
        $scope.qimTxt = qimText;
        if(qimSize && qimSize.w && qimSize.h){
            calcQIMSize = qimSize;
        }
        $scope.qimSize = {w: calcQIMSize.w + 'px', h: calcQIMSize.h + 'px'};

        if(qimPos && qimPos.x != undefined && qimPos.y != undefined){
            $scope.qimPos = {x: qimPos.x + 'px', y: qimPos.y + 'px'};
        }
        else{
            $scope.qimPos = {x: (($(document).width() / 2) - (calcQIMSize.w / 2)) + 'px', y: '30%'}
        }

        if(qimTime){
            showTime = qimTime;
        }

        if(qimColor){
			if($.isArray(qimColor)){
				var gradColorStr = ""
				for(var i = 0; i < qimColor.length; i++){
					if(i > 0){ gradColorStr += ", " }
					gradColorStr += qimColor[i];
				}
				$('.quickInfoBox').css('background-color', qimColor[0]);
				if(qimColor.length > 1){
					$('.quickInfoBox').css('background', '-webkit-linear-gradient(left top, ' + gradColorStr + ')');
					$('.quickInfoBox').css('background', '-moz-linear-gradient(left top, ' + gradColorStr + ')');
					$('.quickInfoBox').css('background', '-ms-linear-gradient(left, ' + gradColorStr + ')');
					$('.quickInfoBox').css('background', '-o-linear-gradient(left, ' + gradColorStr + ')');
				}
				else{
					$('.quickInfoBox').css('background', qimColor[0]);
				}
			}
			else{
				$('.quickInfoBox').css('background-color', qimColor);
				$('.quickInfoBox').css('background', qimColor);
			}
        }
		else if($('.quickInfoBox').css('background-color') != "#fff68f"){
			$('.quickInfoBox').css('background-color', "#fff68f");
			$('.quickInfoBox').css('background', '-webkit-linear-gradient(left top, white, #fff68f 20%, khaki 70%, #cdc673');
			$('.quickInfoBox').css('background', '-moz-linear-gradient(left top, white, #fff68f 20%, khaki 70%, #cdc673');
			$('.quickInfoBox').css('background', '-ms-linear-gradient(left, white, #fff68f 20%, khaki 70%, #cdc673');
			$('.quickInfoBox').css('background', '-o-linear-gradient(left, white, #fff68f 20%, khaki 70%, #cdc673');
		}

		if(qimDominance != undefined && qimDominance == true){ qimDominance_ = true; }

        $scope.qimVisibility = true;
        $('.quickInfoBox').fadeIn(200);
		qimTimer_ = $timeout(function(){$('.quickInfoBox').fadeOut(500, function(){ qimDominance_ = false; $scope.qimVisibility = false; qimTimer_ = undefined; })}, showTime);
    };
    //========================================================================================


	//========================================================================================
    // Configure Bundle
    // This method opens the form that lets the user configure the design of the bundle being
    // created.
    //========================================================================================
    $scope.configureBundle = function(whatWbls){
        var wblsSlotsList = [];
        var protectionBlockEnabled = false;

        for(var i = 0, wbl; wbl = whatWbls[i]; i++){
            if((parseInt(wbl.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE, 10)) !== 0){
                protectionBlockEnabled = true;
                break;
            }

            var wblPack = {wbl: wbl, fullName: wbl.scope().getWebbleFullName()};
            wblPack['slots'] = [];

            if(wbl.scope().theWblMetadata['templateid'] != 'bundleTemplate'){
                angular.forEach(wbl.scope().getSlots(), function (value, key) {
                    if(!(key.search('root') != -1 && value.getCategory() == 'css')){
                        var tmp = {};
                        tmp['id'] = key;
                        tmp['name'] = value.getDisplayName();
                        tmp['value'] = value.getValue();
                        tmp['isSelected'] = false;
                        this.push(tmp);
                    }
                }, wblPack['slots']);
            }

            wblsSlotsList.push(wblPack);
        }

        if(protectionBlockEnabled){
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Bundle Failed"), content: gettext("One Webble is protected from Bundling and therefore this operation is canceled.")}, null);
            return;
        }

        if(wblsSlotsList.length > 0){
            $scope.openForm(Enum.aopForms.bundle, wblsSlotsList, $scope.createBundle);
        }
        else{
            $scope.showQIM(gettext("No Webbles to bundle are selected."));
        }
    };
    //========================================================================================


    //========================================================================================
    // Create Bundle
    // This method handles the returning info/data from the Bundling form and start the
    // process of creating a Bundle.
    //========================================================================================
    $scope.createBundle = function(bundleContent){
        if(bundleContent != null){
            isBundling_ = true;
            var bundleDef = wwConsts.bundleContainerWblDef;
            var bundleContentStr = $scope.stringatizeBundleContent(bundleContent);
            if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
				socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.bundle, bundleData: bundleContentStr});
                $scope.setEmitLockEnabled(true);
            }
            bundleDef['webble']['private'] = {bundlecontent: bundleContentStr, creatingbundle: true};
            $scope.loadWebbleFromDef(bundleDef, $scope.connectBundleContent);
        }
    };
    //========================================================================================


    //========================================================================================
    // Connect Bundle Content
    // This method connects the selected webbles to the bundle webble and flag them as
    // bundled before deselecting them
    //========================================================================================
    $scope.connectBundleContent = function(newBundleData){
        var bndl = newBundleData.wbl;
        var bundleContentStr = newBundleData.wbldef.private.bundlecontent;

        var bundleContentWblsOnly = [];
        for(var i = 0, bcs; bcs = bundleContentStr[i]; i++){
            bundleContentWblsOnly.push($scope.getWebbleByInstanceId(bcs.wbl));
        }

        for(var i = 0, bw; bw = bundleContentWblsOnly[i]; i++){
            if(bw.scope().getParent() == undefined){
                bw.scope().paste(bndl);
            }
            bw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
        }

		$timeout(function(){ isBundling_ = false; });
    };
    //========================================================================================


    //========================================================================================
    // Connect Bundle Content from Undo
    // This method calls the original connect bundle content method but first store a redo
    // object for an unbundle.
    //========================================================================================
    $scope.connectBundleContentFromUndo = function(newBundleData){
        var bndl = newBundleData.wbl;

        if(!isRedoWanted_){
            $scope.getCurrWSRedoMemory().unshift({op: Enum.undoOps.bundle, target: bndl.scope().getInstanceId(), execData: []});
        }
        else{
            $scope.getCurrWSUndoMemory().unshift({op: Enum.undoOps.bundle, target: bndl.scope().getInstanceId(), execData: []});
        }

		updateUndoRedoList(bndl.scope().theWblMetadata['instanceid'], bndl.scope().getInstanceId());
        $scope.connectBundleContent(newBundleData);
    };
    //========================================================================================


    //========================================================================================
    // Stringatize Bundle Content
    // This method takes a bundle content object and make its references into id strings
    // instead.
    //========================================================================================
    $scope.stringatizeBundleContent = function(bundleContent){
        var bundleContentStr = [];
        for(var i = 0, bc; bc = bundleContent[i]; i++){
            var slots = [];
            for(var n = 0, s; s = bc.slots[n]; n++){
                slots.push(s.getName());
            }
            bundleContentStr.push({wbl: bc.wbl.scope().getInstanceId(), slots: slots});
        }

        return bundleContentStr;
    };
    //========================================================================================


    //========================================================================================
    // Get Bundle Master
    // This method returns the bundle master of the specified Webble if it has one otherwise
    // undefined.
    //========================================================================================
    $scope.getBundleMaster = function(whatWebble){
        var bundleMaster = undefined;
        if(whatWebble.scope().getIsBundled() > 0){
            bundleMaster = $scope.getBundleMaster(whatWebble.scope().getParent());
        }
        else if(whatWebble.scope().theWblMetadata['templateid'] == 'bundleTemplate'){
            return whatWebble;
        }

        return bundleMaster;
    };
    //========================================================================================


	//========================================================================================
	// Update list of untrusted Webbles
	// This method checks within all active Webbles whether any template id from the provided
	// list of webble templates exists, and if so check if they are trusted or not, and if
	// not add them to the untrusted webble list.
	//========================================================================================
	$scope.updateListOfUntrustedWebbles = function(wblTmpltList){
		var listOfWebblesToTrustCheck = [];
		for(var i = 0, ubWbl; ubWbl = wblTmpltList[i]; i++){
			var alreadyInList = false;
			for(var n = 0; n < listOfWebblesToTrustCheck.length; n++){
				if(listOfWebblesToTrustCheck[n] == ubWbl){
					alreadyInList = true;
					break;
				}
			}
			if(!alreadyInList){
				listOfWebblesToTrustCheck.push(ubWbl);
			}
		}

		dbService.verifyWebbles(listOfWebblesToTrustCheck).then(function(listOfConfirmedTrust){
			var listOfUntrustedWblTemplates = [];
			for(var i = 0; i < listOfConfirmedTrust.length; i++){
				if(!listOfConfirmedTrust[i]){
					listOfUntrustedWblTemplates.push(listOfWebblesToTrustCheck[i]);
				}
			}

			var newListOfUntrustedWbls = [];
			for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
				for(var k = 0; k < listOfUntrustedWblTemplates.length; k++){
					if(aw.scope().theWblMetadata['defid'] == listOfUntrustedWblTemplates[k]){
						newListOfUntrustedWbls.push(listOfUntrustedWblTemplates[k]);
					}
				}
			}
			listOfUntrustedWbls_ = newListOfUntrustedWbls;
		},function(eMsg){
			$scope.serviceError(eMsg);
		});
	};
	//========================================================================================



	//========================================================================================
	// Get List Of Unique Sandbox Webbles as String
	// This method creates a list of unique sandbox Webbles.
	//========================================================================================
	$scope.getListAsStringOfLoadedSandboxWebbles = function(){
		var uniqueLoadedSandboxList = [], uniqueLoadedSandboxListAsStr = '';
		for(var i = 0; i < listOfLoadedSandboxWebbles_.length; i++){
			var alreadyExist = false;
			for(var n = 0; n < uniqueLoadedSandboxList.length; n++){
				if(listOfLoadedSandboxWebbles_[i] == uniqueLoadedSandboxList[n]){
					alreadyExist = true;
					break;
				}
			}
			if(!alreadyExist){
				uniqueLoadedSandboxList.push((listOfLoadedSandboxWebbles_[i]));
			}
		}

		for(var n = 0; n < uniqueLoadedSandboxList.length; n++){
			uniqueLoadedSandboxListAsStr += '\n"' + uniqueLoadedSandboxList[n] + '"';
		}

		return uniqueLoadedSandboxListAsStr;
	};
	//========================================================================================



    //========================================================================================
    // Get List Of Unique Untrusted Webbles as String
    // This method creates a list of unique Untrusted Webbles.
    //========================================================================================
    $scope.getListAsStringOfUniqueUntrustedWbls = function(){
        var uniqueUntrustList = [], uniqueUntrustListAsStr = '';
        for(var i = 0; i < listOfUntrustedWbls_.length; i++){
            var alreadyExist = false;
            for(var n = 0; n < uniqueUntrustList.length; n++){
                if(listOfUntrustedWbls_[i] == uniqueUntrustList[n]){
                  alreadyExist = true;
                  break;
                }
            }
            if(!alreadyExist){
                uniqueUntrustList.push((listOfUntrustedWbls_[i]));
            }
        }

        for(var n = 0; n < uniqueUntrustList.length; n++){
            uniqueUntrustListAsStr += '\n"' + uniqueUntrustList[n] + '"';
        }

        return uniqueUntrustListAsStr;
    };
    //========================================================================================


    //========================================================================================
    // Set Execution Mode
    // This method sets the execution mode index (integer indicating the operation mode level
    // of the system and its webbles).
    //========================================================================================
    $scope.setExecutionMode = function(whatExecutionModeIndex) {
        if(whatExecutionModeIndex == null || hardcoreMenuNonBlock){ return; }
        currentExecutionMode_ = whatExecutionModeIndex;

        if(currWS_){
            if (currentExecutionMode_ == Enum.availableOnePicks_ExecutionModes.Developer) {
                for(var n = 0, wbl; wbl = currWS_.webbles[n]; n++){
                    if(wbl.wblElement.scope()){
                        if((parseInt(wbl.wblElement.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) !== 0){
                            wbl.wblElement.scope().setWblVisibilty(true);
                        }
                    }
                }
            }
            else{
                for(var n = 0, wbl; wbl = currWS_.webbles[n]; n++){
                    if(wbl.wblElement.scope()){
                        if((parseInt(wbl.wblElement.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) !== 0){
                            wbl.wblElement.scope().setWblVisibilty(false);
                        }
                    }
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Current Active Workspace Undo Memory
    // This method returns the undo memory of the current active workspace.
    //========================================================================================
    $scope.getCurrWSUndoMemory = function(){
        return currWS_.undoMemory;
    };
    //========================================================================================


    //========================================================================================
    // Get Current Active Workspace Redo Memory
    // This method returns the redo memory of the current active workspace.
    //========================================================================================
    $scope.getCurrWSRedoMemory = function(){
        return currWS_.redoMemory;
    };
    //========================================================================================


	//========================================================================================
	// Get Top Parent
	// This method finds the top parent for a specific Webble and returns it. If no top
	// parent exist the webble itself is returned (since it is obviously the top)
	//========================================================================================
	$scope.getTopParent = function(whatWebble){
		var superParent = whatWebble;

		for(var n = 0, anc; anc = $scope.getAllAncestors(whatWebble)[n]; n++){
			if(anc.scope().getParent() == undefined){
				superParent = anc;
			}
		}

		return superParent;
	};
	//========================================================================================


    //========================================================================================
    // Get Current Active Webbles
    // This method returns a list of the current active webbles.
    //========================================================================================
    $scope.getActiveWebbles = function(){
        var awList = [];
        var currWS = $scope.getCurrWS();
        if(currWS){
            for(var i = 0, wi; wi = currWS.webbles[i]; i++){
                awList.push(wi.wblElement);
            }
        }
        return awList;
    };
    //========================================================================================


    //========================================================================================
    // Get Selected Webbles
    // This method returns a list of all webbles main selected.
    //========================================================================================
    $scope.getSelectedWebbles = function(){
        var swList = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().getSelectionState() ==  Enum.availableOnePicks_SelectTypes.AsMainClicked){
                swList.push(aw);
            }
        }
        return swList;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble Absolute Position In Pixels
    // This method calculates the specified webbles absolute position within the work surface.
    //========================================================================================
    $scope.getWblAbsPosInPixels = function(whatWebble){
        var theFullPos = {x: 0, y: 0};
        if(whatWebble){
            var ancestors = $scope.getAllAncestors(whatWebble);
			try{ theFullPos.x = Math.round(getUnits(whatWebble.parent()[0], 'left').pixel); }catch(e){}
			try{ theFullPos.y = Math.round(getUnits(whatWebble.parent()[0], 'top').pixel); }catch(e){}
            for(var i = 0, a; a = ancestors[i]; i++){
                theFullPos.x += Math.round(getUnits(a.parent()[0], 'left').pixel);
                theFullPos.y += Math.round(getUnits(a.parent()[0], 'top').pixel);
            }
        }

        return theFullPos;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble Center Position
    // This method calculates the specified webbles center position within the work surface.
    //========================================================================================
    $scope.getWebbleCenterPos = function(whatWebble){
        var wblPos = $scope.getWblAbsPosInPixels(whatWebble);
        var wblSize = {w: Math.round(getUnits(whatWebble.parent()[0], 'width').pixel), h: Math.round(getUnits(whatWebble.parent()[0], 'height').pixel)};

        return {x: wblPos.x + (wblSize.w / 2), y: wblPos.y + (wblSize.h / 2)};
    };
    //========================================================================================


    //========================================================================================
    // Get All Ancestors
    // This method finds all ancestors (parents and parents parents etc) of the defined
    //= webble and return the list.
    //========================================================================================
    $scope.getAllAncestors = function(whatWebble){
        var ancestors = [];

        var parent = whatWebble.scope().getParent();
        if (parent && parent != null){
            ancestors.push(parent);
            ancestors = ancestors.concat($scope.getAllAncestors(parent));
        }

        return ancestors;
    };
    //========================================================================================


    //========================================================================================
    // Get All Descendants
    // This method returns all webbles of those that are children or grandchildren of
    // the webble specified in the parameter which is also included in the top of the list.
    //========================================================================================
    $scope.getAllDescendants = function(whatWebble){
        var familyMembers = [];
        if(whatWebble){
            familyMembers.push(whatWebble);
            for (var i = 0, c; c = whatWebble.scope().getChildren()[i]; i++){
                familyMembers = familyMembers.concat($scope.getAllDescendants(c));
            }
        }
        return familyMembers;
    };
    //========================================================================================


    //========================================================================================
    // Get Winning Slot Value Among All Webbles
    // Looks for either the highest or the lowest value from all existing Webbles of a
    // specified slot and return that value.
    //========================================================================================
    $scope.getWinningSlotValueAmongAllWebbles = function(whatSlot, lowestWins){
        var winner = {value: 0, owner: undefined};

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            var thisWblValue = aw.scope().gimme(whatSlot);
            if(lowestWins){
                if(thisWblValue < winner.value){
                    winner.value = thisWblValue;
                    winner.owner = aw.scope().getInstanceId();
                }
            }
            else{
                if(thisWblValue > winner.value){
                    winner.value = thisWblValue;
                    winner.owner = aw.scope().getInstanceId();
                }
            }
        }

        return winner;
    };
    //========================================================================================


    //========================================================================================
    // Request Webble Selection
    // Deals with the interaction process of making webbles selected
    //========================================================================================
    $scope.requestWebbleSelection = function(target){
        var familyMembers = $scope.getAllDescendants(target);
        for(var i = 0, fm; fm = familyMembers[i]; i++){
            if (fm.scope().getInstanceId() == target.scope().getInstanceId()){
                fm.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
            }
            else{
                fm.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsChild);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Publish Webble
    // This method saves and publish Webble definition to a specified place somewhere.
    //========================================================================================
    $scope.requestPublishWebble = function(whatWbl){
        if($scope.user){
            if($scope.user.username){
                var allFamily = $scope.getAllDescendants(whatWbl);
                allFamily = allFamily.concat($scope.getAllAncestors(whatWbl));
                for(var i = 0, w; w = allFamily[i]; i++){
                    if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) !== 0){
                        $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Publish Webble Attempt Failed"), content: gettext("One or more of the Webbles included in the publish attempt is protected from publishing and therefore this operation is canceled.")}, null);
                        return false;
                    }
                }

				if(whatWbl.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){ lastMainSelectedWbl = whatWbl; }
                $scope.resetSelections();
                $timeout(function(){$scope.openForm(Enum.aopForms.publishWebble, getPublishWebbleContent(whatWbl), publishWebbleReturned);}, 100);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Need a username..."), content: gettext("In order to publish a Webble, you need a proper username which you have not yet. Please visit your user-profile page and rectify that.")}, null);
            }
        }
        else{
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Publish Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles. Please sign in and try again.")}, null);
        }
    };
    //========================================================================================


    //========================================================================================
	// Export Webble
	// This method Exports a Webble and all its needed templates (incl code files) to a
	// webble code package file which can be imported to any other Webble World platform.
	//========================================================================================
	$scope.requestExportWebble = function(whatWbl){
		var allDescendents = $scope.getAllDescendants(whatWbl);
		for(var i = 0, w; w = allDescendents[i]; i++){
			if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.EXPORT, 10)) !== 0){
				$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Export Webble Attempt Failed"), content: gettext("One or more of the Webbles included in the Export attempt is protected from export and therefore this operation is canceled.")}, null);
				return false;
			}
		}

		$timeout(function(){$scope.openForm(Enum.aopForms.exportWebble, getExportWebbleContent(whatWbl, allDescendents), exportWebbleReturned);}, 100);
	};
	//========================================================================================


    //========================================================================================
    // Request Delete Webble
    // This method deletes a specified webble from the system.
    //========================================================================================
    $scope.requestDeleteWebble = function(target, callbackFunc){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
			socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.deleteWbl, target: target.scope().getInstanceId()});
        }
        $scope.addUndo({op: Enum.undoOps.deleteWbl, target: undefined, execData: [{wbldef: target.scope().createWblDef(true)}]});

		victimsOfDeletion_ = victimsOfDeletion_.concat($scope.getAllDescendants(target));
		if(!$scope.globalByPassFlags.byPassBlockingDeleteProtection){
			for(var i = 0, w; w = victimsOfDeletion_[i]; i++){
				if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DELETE, 10)) !== 0){
					victimsOfDeletion_ = [];
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Deletion Failed"), content: gettext("One or more of the Webbles included in the deletion attempt is protected from deletion and therefore this operation is canceled.")}, null);
					return false;
				}
			}
		}


		if(!$scope.waiting()){
			$timeout(function(){$scope.waiting(true);});
		}

		$timeout(function(){deleteWbl(undefined, callbackFunc);});

        return true;
    };
    //========================================================================================


    //========================================================================================
    // Request Assign Parent
    // Deals with the interaction process of assigning child parent
    //========================================================================================
    $scope.requestAssignParent = function(target){
        if(!$scope.touchRescuePlatformFlags.noParentSelectPossibleYet){
            $scope.touchRescuePlatformFlags.noParentSelectPossibleYet = true;

            // AssignParent - Prepare to wait for the user to pick a parent
            if (pendingChild_ == undefined){
                pendingChild_ = target;
                platformCurrentStates_ = bitflags.on(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForParent);

                //Select mark the pending child so that the user see what is going on
                target.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsWaitingForParent);
            }

            // AcceptChild - Assign a parent and a child to the webbles candidate for the job
            else{
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
                }
                if (target.scope().getInstanceId() != pendingChild_.scope().getInstanceId()){
                    pendingChild_.scope().wblStateFlags.pasteByUser = true;
                    connectChildParent(pendingChild_, target);
                }
                pendingChild_ = undefined;
                platformCurrentStates_ = bitflags.off(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForParent);
            }
            $timeout(function(){$scope.touchRescuePlatformFlags.noParentSelectPossibleYet = false;}, 500);
        }
    };
    //========================================================================================


    //========================================================================================
    // Open Form
    // This method Creates and opens a modal form window for a specific use that can be used
    // to edit or consume any data.
    //========================================================================================
    $scope.openForm = function(whatForm, content, callbackFunc){
        var modalOptions = {};

		if(content == undefined || content == null){
            content = [];
        }

        if(whatForm == Enum.aopForms.wblProps){
            modalOptions.templateUrl = 'views/modalForms/propertySheet.html';
            modalOptions.controller = 'propertySheetCtrl';
            modalOptions.resolve = {
                templateId: function(){ return content[0]; },
                props: function(){ return content[1]; }
            };
			modalOptions.size = 'lg';
        }
        else if(whatForm == Enum.aopForms.wblAbout){
            modalOptions.templateUrl = 'views/modalForms/wblAbout.html';
            modalOptions.controller = 'AboutWebbleSheetCtrl';
            modalOptions.resolve = {
                wblData: function(){ return content; }
            };
			modalOptions.size = 'lg';
        }
        else if(whatForm == Enum.aopForms.openWorkspace){
            modalOptions.templateUrl = 'views/modalForms/openWSSheet.html';
            modalOptions.controller = 'openWSSheetCtrl';
            modalOptions.resolve = {
                availWS: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.saveWorkspaceAs){
            modalOptions.templateUrl = 'views/modalForms/saveWSAsSheet.html';
            modalOptions.controller = 'saveWSAsSheetCtrl';
            modalOptions.resolve = {
                wsData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.shareWorkspaces){
            modalOptions.templateUrl = 'views/modalForms/shareWSSheet.html';
            modalOptions.controller = 'shareWSSheetCtrl';
            modalOptions.resolve = {
                wsData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.faq){
            modalOptions.templateUrl = 'views/modalForms/faqSheet.html';
            modalOptions.controller = 'faqSheetCtrl';
            modalOptions.resolve = {
                currUser: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.slotConn){
            modalOptions.templateUrl = 'views/modalForms/slotConnSheet.html';
            modalOptions.controller = 'slotConnSheetCtrl';
            modalOptions.resolve = {
                childSlots: function(){ return content[0]; },
                parentSlots: function(){ return content[1]; },
                currSelected: function(){ return content[2]; },
                slotConnDir: function(){ return content[3]; }
            };
			modalOptions.size = 'lg';
        }
        else if(whatForm == Enum.aopForms.protect){
            modalOptions.templateUrl = 'views/modalForms/wblProtectionSheet.html';
            modalOptions.controller = 'protectSheetCtrl';
            modalOptions.resolve = {
                protectSettings: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.addCustSlot){
            modalOptions.templateUrl = 'views/modalForms/addCustSlotSheet.html';
            modalOptions.controller = 'AddCustomSlotSheetCtrl';
            modalOptions.resolve = {
                wblView: function(){ return content; }
            };
        }
		else if(whatForm == Enum.aopForms.editCustMenuItems){
			modalOptions.templateUrl = 'views/modalForms/editCustMenuItemsSheet.html';
			modalOptions.controller = 'editCustMenuItemsSheetCtrl';
			modalOptions.resolve = {
				wblView: function(){ return content; }
			};
			modalOptions.size = 'lg';
		}
		else if(whatForm == Enum.aopForms.editCustInteractObj){
			modalOptions.templateUrl = 'views/modalForms/editCustInteractObjSheet.html';
			modalOptions.controller = 'editCustInteractObjSheetCtrl';
			modalOptions.resolve = {
				wblView: function(){ return content; }
			};
			modalOptions.size = 'lg';
		}
        else if(whatForm == Enum.aopForms.infoMsg){
            modalOptions.templateUrl = 'views/modalForms/infoMsg.html';
            modalOptions.controller = 'infoMsgCtrl';
            modalOptions.resolve = {
                infoTitle: function(){ return content.title; },
                infoContent: function(){ return content.content; }
            };
			modalOptions.size = (content.size != undefined) ? content.size : 'md';
        }
        else if(whatForm == Enum.aopForms.publishWebble){
            modalOptions.templateUrl = 'views/modalForms/publishWebbleSheet.html';
            modalOptions.controller = 'publishWebbleSheetCtrl';
            modalOptions.resolve = {
                formContent: function(){ return content; }
            };
        }
		else if(whatForm == Enum.aopForms.exportWebble){
			modalOptions.templateUrl = 'views/modalForms/exportWebbleSheet.html';
			modalOptions.controller = 'exportWebbleSheetCtrl';
			modalOptions.resolve = {
				formContent: function(){ return content; }
			};
		}
        else if(whatForm == Enum.aopForms.bundle){
            modalOptions.templateUrl = 'views/modalForms/bundleSheet.html';
            modalOptions.controller = 'bundleSheetCtrl';
            modalOptions.resolve = {
                wblsSlots: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.loadWebble){
            modalOptions.templateUrl = 'views/modalForms/loadWebbleSheet.html';
            modalOptions.controller = 'loadWebbleSheetCtrl';
        }
		else if(whatForm == Enum.aopForms.importWebble){
			modalOptions.templateUrl = 'views/modalForms/importWebbleSheet.html';
			modalOptions.controller = 'importWebbleSheetCtrl';
		}
        else if(whatForm == Enum.aopForms.platformProps){
            modalOptions.templateUrl = 'views/modalForms/platformPropsSheet.html';
            modalOptions.controller = 'platformPropsSheetCtrl';
            modalOptions.resolve = {
                platformProps: function(){ return content; }
            };
			modalOptions.size = 'lg';
        }
        else if(whatForm == Enum.aopForms.langChange){
            modalOptions.templateUrl = 'views/modalForms/platformLangSheet.html';
            modalOptions.controller = 'platformLangPickSheetCtrl';
        }
        else if(whatForm == Enum.aopForms.rateWbl){
            modalOptions.templateUrl = 'views/modalForms/rateWblSheet.html';
            modalOptions.controller = 'rateWblSheetCtrl';
            modalOptions.resolve = {
                wblDefData: function(){ return content; }
            };
        }
		else if(whatForm == Enum.aopForms.viewWblRatingAndComments){
			modalOptions.templateUrl = 'views/modalForms/viewRateCommentsWblSheet.html';
			modalOptions.controller = 'viewRateCommentsWblSheetCtrl';
			modalOptions.resolve = {
				wblDefData: function(){ return content; }
			};
			modalOptions.size = 'lg';
		}
        else if(whatForm == Enum.aopForms.wblSearch){
            modalOptions.templateUrl = 'views/modalForms/searchWblSheet.html';
            modalOptions.controller = 'searchWblSheetCtrl';
            modalOptions.resolve = {
                platformScope: function(){ return content; }
            };
            modalOptions.size = 'lg';
			//modalOptions.backdrop = 'static';
        }
        else if(whatForm == Enum.aopForms.about){
            modalOptions.templateUrl = 'views/modalForms/about.html';
            modalOptions.controller = 'AboutSheetCtrl';
        }
        else{
            if(content.length && content.length > 1){
                modalOptions.templateUrl = content[0].templateUrl;
                modalOptions.controller = content[0].controller;
                modalOptions.resolve = {
                    props: function(){ return content[1]; }
                };
                modalOptions.size = content[0].size;
            }
            else{
                return;
            }
        }

        isFormOpen_ = true;
        var modalInstance = $modal.open(modalOptions);
		modalInstance.opened.then(function() { if(whatForm == Enum.aopForms.infoMsg){ platformAccessedMI = modalInstance; } });
        modalInstance.result.then(function (returnValue) {
            if(callbackFunc != undefined && callbackFunc != null){
                callbackFunc(returnValue);
            }
            isFormOpen_ = false;
			platformAccessedMI = undefined;
        }, function () {
            if(callbackFunc != undefined && callbackFunc != null){
                callbackFunc();
            }
            isFormOpen_ = false;
			platformAccessedMI = undefined;
        });
    };
    //========================================================================================


    //========================================================================================
    // Default Service Error
    // when a web service fails this method handles it by displaying an error message to the
    // user.
    //========================================================================================
    $scope.serviceError = function(errorMsg){
        $log.error('ERROR * ERROR * ERROR * ERROR\n' + errorMsg);
    };
    //========================================================================================


    //========================================================================================
    // Get Webbles By Template Id
    // This method return a list of Webbles with a specific template id.
    //========================================================================================
    $scope.getWebblesByTemplateId = function(whatTemplateid){
        var theFoundWebbles = [];

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().theWblMetadata['templateid'] == whatTemplateid){
                theFoundWebbles.push(aw);
            }
        }

        return theFoundWebbles;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble By Instance Id
    // This method return the unique Webbles with a specific instance id.
    //========================================================================================
    $scope.getWebbleByInstanceId = function(whatInstanceId){
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope() && aw.scope().getInstanceId() == whatInstanceId){
                return aw;
            }
        }
        return undefined;
    };
    //========================================================================================


    //========================================================================================
    // Get Webbles By Display Name
    // This method return a list of Webbles with a certain display name.
    //========================================================================================
    $scope.getWebblesByDisplayName = function(whatWebbleDisplayName){
        var theFoundWebbles = [];

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().getInstanceName() == whatWebbleDisplayName){
                theFoundWebbles.push(aw);
            }
        }
        return theFoundWebbles;
    };
    //========================================================================================


    //========================================================================================
    // Add Undo
    // Adds another operation to the undo list (if the list allows it)
    //========================================================================================
    $scope.addUndo = function(newOp){
		if((!blockAllAddUndoUntilWeSayOtherwise_ && !blockNextAddUndo_ && (!isBundling_ || (isBundling_ && newOp.op == Enum.undoOps.bundle)))){
			$scope.getCurrWSUndoMemory().unshift(newOp);
			if($scope.getCurrWSUndoMemory().length > 500){ $scope.getCurrWSUndoMemory().pop(); }
		}
		blockNextAddUndo_ = false;
    };
    //========================================================================================


    //========================================================================================
    // Select All Webbles
    // This method make all webbles selected
    //========================================================================================
    $scope.selectAllWebbles = function(){
        platformCurrentStates_ = bitflags.on(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForAllSelect);
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            $scope.requestWebbleSelection(aw.scope().theView);
        }
        platformCurrentStates_ = bitflags.off(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForAllSelect);
    };
    //========================================================================================


    //========================================================================================
    // Unselect All Webbles
    // This method make all webbles unselected
    //========================================================================================
    $scope.unselectAllWebbles = function(){
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if(aw.scope() != undefined){
                aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Open Work Space  By Name
    // This method opens a work space with the specified name
    //========================================================================================
    $scope.openWSByName = function(selectedWS){
        for(var i = 0; i < availableWorkspaces_.length; i++){
            if(selectedWS == availableWorkspaces_[i].name){
                $scope.setEmitLockEnabled(true);
                $scope.insertWS(availableWorkspaces_[i]);
                $scope.saveUserSettings(true);
                break;
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Save Work Space By Name
    // This method saves current work space with the specified name
    //========================================================================================
    $scope.saveWSByName = function(newWSName){
        if(newWSName != null){
            if(currWS_.name != newWSName){
                currWS_.id = undefined;
                currWS_.name = newWSName;
            }
            $timeout(function(){$scope.executeMenuSelection('savews', null);}, 100);
        }
    };
    //========================================================================================


    //========================================================================================
    // Execute Menu Selection
    // Execute the correct action, based on menu or shortcut selection.
    //========================================================================================
    $scope.executeMenuSelection = function(sublink, whatKeys) {
        if(isFormOpen_){
            return false;
        }

        if((parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.PlatformInteractionBlockEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.PlatformInteractionBlockEnabled, 10)){
            return false;
        }
        else if (currentPlatformPotential_ == Enum.availablePlatformPotentials.None) {
            return false;
        }

		//Panic Access if Webble World Main Menu has been removed hard by a Webble
		if(whatKeys != null && whatKeys.theAltKey == true && whatKeys.theCtrlKey == true && whatKeys.theKey == "NUM 0"){
			$scope.setExecutionMode(0);
			$scope.setMenuModeEnabled(true);
			hardcoreMenuNonBlock = true;
			return true;
		}

		var actionWasExecuted = true;
        if(whatKeys == null || $scope.getCurrentExecutionMode() > Enum.availableOnePicks_ExecutionModes.SuperHighClearanceUser){
            whatKeys = {theAltKey: false, theShiftKey: false, theCtrlKey: false, theKey: ''};
        }


        //==== NON-MENU KEYBOARD ============================
        if (sublink == 'shortcutinfo' || (whatKeys.theAltKey && whatKeys.theKey == 'F1')){
			$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Non-Menu Shortcut Keys"), content:
					'<strong>Alt+F1</strong>:' + gettextCatalog.getString("Display non-menu Shortcut keys and additional quick help info.") + '<br>' +
					'<strong>Alt+F2</strong>:' + gettextCatalog.getString("Toggle Main menu visibility.") + '<br>' +
					'<strong>Alt+F3</strong>:' + gettextCatalog.getString("Toggle Console Debug Logging.") + '<br>' +
					'<strong>Alt+F5</strong>:' + gettextCatalog.getString("Quick Save Current Desktop.") + '<br>' +
					'<strong>Alt+F6</strong>:' + gettextCatalog.getString("Quick Load Previusly Quick-Saved Desktop.") + '<br>' +
					'<strong>F8 (Alt+F8)</strong>:' + gettextCatalog.getString("Quick Load A Fundamental Webble.") + '<br>' +
					'<strong>F9 (Alt+F9)</strong>:' + gettextCatalog.getString("Quick Toggles between System Language and English.") + '<br>' +
					'<strong>Alt+F10</strong>:' + gettextCatalog.getString("Open System Language Select Form") + '<br>' +
					'<strong>Alt+Shift+PageDown (Ctrl+Shift+PageDown)</strong>:' + gettextCatalog.getString("Reset Webble World Intro to first time visitor mode.") + '<br>' +
					'<strong>Alt+Shift+End (Ctrl+Shift+End)</strong>:' + gettextCatalog.getString("Clear all Webble world cookies and local storage user data.") + '<br>' +
					'<strong>Esc</strong>:' + gettextCatalog.getString("Cancel what is currently going on (e.g. Close form).") + '<br>' +
					'<strong>Enter</strong>:' + gettextCatalog.getString("In the Webble Browser the Enter Key execute a search or load the selected Webble, and in some other forms the enter key executes a submit, though not in all.") + '<br>' +
					'<strong>Alt+' + gettextCatalog.getString("Arrow Keys") + '</strong>:' + gettextCatalog.getString("Move current selected Webble in that directiont.") + '<br>' +
					'<strong>Alt (' + gettextCatalog.getString("in Development mode") + ')</strong>:' + gettextCatalog.getString("Allows the user to override some protection, like for example,displaying Webble menu even though it is turned off.") + '<br>' +
					'<strong>Alt+Ctrl+Num 0</strong>:' + gettextCatalog.getString("In case some Webbles have attempted to lock down the system this 'Panic Feature' returns a lost Webble World Main menu and sets the user to highest level of Developer in order to get back to work.") + '<br>' }
			);
        }
		//Toggle Main Menu visibility
        else if (sublink == 'altf2' || (whatKeys.theAltKey && whatKeys.theKey == 'F2')){
            if((parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else{
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        else if (sublink == 'altf3' || (whatKeys.theAltKey && whatKeys.theKey == 'F3'))
        {
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited && currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.isLoggingEnabled = !$scope.isLoggingEnabled;
                wwGlobals.loggingEnabled = $scope.isLoggingEnabled;
                localStorageService.add('isLoggingEnabled', $scope.isLoggingEnabled.toString());
            }
        }
        else if (sublink == 'altf5' || (whatKeys.theAltKey && whatKeys.theKey == 'F5'))
        {
            if($scope.getActiveWebbles().length > 0){
                var rootPathName = 'guest';
                if($scope.user){
                    rootPathName = $scope.user.email;
                }
                localStorageService.add(rootPathName + wwConsts.workspaceQuickSavePathLastName, JSON.stringify(getWSDef(rootPathName), function (key, value) { if(typeof value === "function"){ return String(value); } return value; }));

                $scope.showQIM(gettext("Current workspace quick saved"));
            }
        }
        else if (sublink == 'altf6' || (whatKeys.theAltKey && whatKeys.theKey == 'F6'))
        {
            $scope.cleanActiveWS();
            var rootPathName = 'guest';
            if($scope.user){
                rootPathName = $scope.user.email;
            }

            var quickSavedWS = localStorageService.get(rootPathName + wwConsts.workspaceQuickSavePathLastName);

            if(quickSavedWS){
                quickSavedWS = JSON.parse(quickSavedWS, function(key, value) {
					if(value && (typeof value === 'string') && value.indexOf("function") === 0){
						return new Function('return ' + value)();
					}
					return value;
				});
                wblFamiliesInLineForInsertion_ = quickSavedWS.webbles;
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
                $scope.showQIM(gettext("Recent Quick saved workspace has been restored"));
            }
            else{
                $scope.showQIM(gettext("No Quick-Save Workspace in Storage"));
            }
        }
        else if (sublink == 'altf8' || (whatKeys.theKey == 'F8' || (whatKeys.theAltKey && whatKeys.theKey == 'F8')))
        {
            $scope.downloadWebbleDef("fundamental");
        }
        else if (sublink == 'altf9' || (whatKeys.theKey == 'F9' || (whatKeys.theAltKey && whatKeys.theKey == 'F9')))
        {
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited && currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(gettextCatalog.currentLanguage.search('en') == -1){
                    gettextCatalog.currentLanguage = 'en';
                    $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
					$scope.flagImageFound = true;
                }
                else if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                    gettextCatalog.currentLanguage = $scope.getSysLanguage() || 'en';
                    $scope.langChangeTooltipTxt = "Change Language";
					$scope.flagImageFound = true;
                }
            }
        }
        else if (sublink == 'altf10' || (whatKeys.theAltKey && whatKeys.theKey == 'F10'))
        {
			var beforeLang = gettextCatalog.currentLanguage;
            $scope.openForm(Enum.aopForms.langChange, null, function(){
                if(gettextCatalog.currentLanguage.search('en') == -1){
                    $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
                }
                else if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                    $scope.langChangeTooltipTxt = "Change Language";
                }
                else{
                    $scope.langChangeTooltipTxt = "";
                }
				if(beforeLang != gettextCatalog.currentLanguage){ $scope.flagImageFound = true; }
            });
        }
        else if(sublink == 'altshiftpagedown' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theShiftKey && whatKeys.theKey == 'PageDown')){
            localStorageService.remove('IntroDisabled');
            $log.info('Intro video blocking was deleted and the intro will play next time the page is reloaded');
        }
        else if(sublink == 'altshiftend' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theShiftKey && whatKeys.theKey == 'End')){
            localStorageService.clearAll();
            $log.info('All cookies and local storage data was just cleared.');
        }
        else if (sublink == 'esc' || (whatKeys.theKey == 'Esc')){
            $scope.resetSelections();
        }
        else if ((sublink == 'leftarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Left Arrow'))) {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:left'));
                    aw.scope().set('root:left', (isNaN(valUnit[0]) ? '' : (valUnit[0] - 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'rightarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Right Arrow'))) {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:left'));
                    aw.scope().set('root:left', (isNaN(valUnit[0]) ? '' : (valUnit[0] + 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'uparrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Up Arrow'))) {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:top'));
                    aw.scope().set('root:top', (isNaN(valUnit[0]) ? '' : (valUnit[0] - 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'downarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Down Arrow'))) {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:top'));
                    aw.scope().set('root:top', (isNaN(valUnit[0]) ? '' : (valUnit[0] + 2.0)) + valUnit[1]);
                }
            }
        }

        //==== NON-MENU TOUCH GESTURES (On WorkSurface)============================

        else if (sublink == 'gestSwipeDown') { //Show Main Menu visibility
			if(BrowserDetect.OS != 'Windows'){ platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled); }
        }
        else if (sublink == 'gestSwipeUp') {//Hide Main Menu visibility
			if(BrowserDetect.OS != 'Windows'){ platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled); }
        }

        //==== MAIN MENU ============================

        //==== WORKSPACE ============================
        else if(sublink == 'newws' || (whatKeys.theAltKey && whatKeys.theKey == 'N')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.webbles. length > 0){
                    var modalInstance = $modal.open({templateUrl: 'views/modalForms/clearSomething.html', windowClass: 'modal-wblwrldform small'});
					modalInstance.opened.then(function() { isFormOpen_ = true; platformAccessedMI = modalInstance; });
                    modalInstance.result.then(function () {
                        $scope.setEmitLockEnabled(true);
                        $scope.cleanActiveWS();
						isFormOpen_ = false;
                    }, function () {
						isFormOpen_ = false;
                    });
                }
                else{
                    $scope.cleanActiveWS();
                }
            }
        }
        else if(sublink == 'openws' || (whatKeys.theAltKey && whatKeys.theKey == 'O')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                dbService.getAvailableWorkspaces().then(
                    function(workspaces) {
                        availableWorkspaces_ = workspaces;
                        if(availableWorkspaces_.length > 0){
                            $scope.openForm(Enum.aopForms.openWorkspace, availableWorkspaces_, function(selectedWS){
                                if(selectedWS){
                                    listOfUntrustedWbls_ = [];
                                    for(var i = 0; i < availableWorkspaces_.length; i++){
                                        if(selectedWS == availableWorkspaces_[i].id){
                                            $scope.setEmitLockEnabled(true);
                                            $scope.insertWS(availableWorkspaces_[i]);
                                        }
                                    }
                                    $scope.saveUserSettings(true);
                                }
                            });
                        }
                        else{
                            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Workspaces Available"), content: gettext("You do not have any saved workspaces available to open. You must create some first.")}, null);
                        }
                    },
                    function () {
                        $log.log("ERROR WHILE LOADING LIST OF AVAILABLE WORKSPACES")
                    }
                );
            }
        }
        else if(sublink == 'savews' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'S')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.name != ''){
                    if($scope.user && $scope.user.username){
						$scope.waiting(true);
                        dbService.saveWorkspace(getWSDef($scope.user.username)).then(function(data){
                            if(data.id){
                                currWS_.id = data.id;
                                currWS_.creator = $scope.user.username;
                                $location.search('workspace', data.id);

                                if(recentWS_ != currWS_.id){
                                    recentWS_ = currWS_.id;
                                    $scope.saveUserSettings(true);
                                }
                            }

                            var isNew = true;
                            for(var i = 0, aws; aws = $scope.getAvailableWorkspaces()[i]; i++){
                                if(aws.id == currWS_.id){
                                    isNew = false;
                                    break;
                                }
                            }

                            if(isNew){
                                $scope.getAvailableWorkspaces().push(data);
                            }

							$scope.waiting(false);
                            $scope.showQIM(gettext("Workspace Saved"));
                        },function(eMsg){
							$scope.waiting(false);
                            $scope.serviceError(eMsg);
                        });
                    }
                    else{
                        $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Save Workspace Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles and you need a valid username. Please sign in and/or make sure you have a proper username in your profile and try again.")}, null);
                    }
                }
                else{
                    $scope.executeMenuSelection('savewsas', null);
                }
            }
        }
        else if(sublink == 'savewsas' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'S')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && $scope.user && $scope.user.username){
                    $scope.openForm(Enum.aopForms.saveWorkspaceAs, null, function(newWSName){
                        $scope.saveWSByName(newWSName);
                    });
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Save Workspace Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles and you need a valid username. Please sign in and/or make sure you have a proper username in your profile and try again.")}, null);
                }
            }
        }
        else if(sublink == 'sharews' || (whatKeys.theAltKey && whatKeys.theKey == 'J')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.id != undefined){
                    if(currWS_.creator == $scope.user.name.full || currWS_.creator == $scope.user.username){
						$scope.openForm(Enum.aopForms.shareWorkspaces, currWS_, function(currWSCollaborators){
							if(currWSCollaborators.length > 0){
								if(!currWS_.is_shared){ currWS_.is_shared = true; }
								if(!liveOnlineInteractionEnabled_){
									$timeout(function(){
										socket.emit('interaction:started', currWS_.id);
										socket.addListener('interaction:comm', onComm);
										liveOnlineInteractionEnabled_ = true;
										$log.log('Live Online Interaction for shared workspace (' + currWS_.name + ') turned ON');
										socket.emit('interaction:comm', {id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges});
									});
								}
							}
							else{
								if(liveOnlineInteractionEnabled_){
									if(currWS_.is_shared){ currWS_.is_shared = false; }
									liveOnlineInteractionEnabled_ = false;
									socket.emit('interaction:ended', currWS_.id);
									socket.removeListener('interaction:comm');
									$log.log('Live Online Interaction for shared workspace (' + currWS_.name + ') turned OFF');
								}
							}
						});
                    }
                    else{
                        $scope.showQIM(gettext("You Do not own this Workspace, and can therefore not share it."), 3300);
                    }
                }
                else{
                    $scope.showQIM(gettext("No Workspace to share."));
                }
            }
        }
        else if(sublink == 'deletews' || (whatKeys.theAltKey && whatKeys.theKey == 'X')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.id != undefined){
                    if(currWS_.creator == $scope.user.name.full || currWS_.creator == $scope.user.username){
                        var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

                        modalInstance.result.then(function () {
                            dbService.deleteWS(currWS_.id).then(function(data){
                                for(var i = 0, aws; aws = $scope.getAvailableWorkspaces()[i]; i++){
                                    if(aws.id == currWS_.id){
                                        $scope.getAvailableWorkspaces().splice(i, 1);
                                        break;
                                    }
                                }
                                $scope.cleanActiveWS();
                                $scope.showQIM(gettext("Workspace successfully deleted from server"));
                            },function(eMsg){
                                $scope.serviceError(eMsg);
                            });
                        }, function () { });
                    }
                    else{
                        $scope.showQIM(gettext("You Do not own this Workspace, and can therefore not delete it. But you can remove yourself as a Workspace collaborator"), 4000, {w: 250, h: 90});
                        var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

                        modalInstance.result.then(function () {
                            dbService.removeMeAsWSCollaborator(currWS_.id).then(function(data){
                                $scope.cleanActiveWS();
                                $scope.showQIM(gettext("You were successfully removed from the Workspace sharing collaborator list"));
                            },function(eMsg){
                                $scope.serviceError(eMsg);
                            });
                        }, function () { });
                    }
                }
            }
        }

        //==== WEBBLES ============================

        else if(sublink == 'browse' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'B')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.openForm(Enum.aopForms.wblSearch, $scope, null);
            }
        }
		else if(sublink == 'recentwbl' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'R')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
				if (recentWebble_.length > 0){
					if(recentWebble_.length > 1){
						var content = "<b>Press the number key of the Webble wanted.. </br>(Hold SHIFT to press multiple times):</b></br></br>";
						for(var rw = 0; rw < recentWebble_.length; rw++){
							content += (rw + 1) + ": " + recentWebble_[rw].webble.displayname + "</br>";
						}
						$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Load Recent Webble"), content: content/*gettext("You do not have any saved workspaces available to open. You must create some first.")*/}, function(){ waitingForNumberKey_ = 0; });
						$timeout(function(){ waitingForNumberKey_ = recentWebble_.length });
					}
					else{
						$scope.loadWebbleFromDef(recentWebble_[0], null);
					}
				}
				else{
					$scope.showQIM(gettext("No Recently loaded Webbles stored"));
				}
			}
		}
        else if(sublink == 'loadwbl' || (whatKeys.theAltKey && whatKeys.theKey == 'L')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.openForm(Enum.aopForms.loadWebble, null, loadWebbleReturned);
            }
        }
		else if(sublink == 'impwbl' || (whatKeys.theAltKey && whatKeys.theKey == 'I')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
				$scope.openForm(Enum.aopForms.importWebble, null, $scope.importWebbleReturned);
			}
		}
        else if(sublink == 'pub' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'P')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var selectedWbls = $scope.getSelectedWebbles();
                if(selectedWbls.length == 1){
                    $scope.requestPublishWebble(selectedWbls[0]);
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Cannot do that..."), content: gettextCatalog.getString("This operation only works with one selected Webble at a time, and you have") + ' ' + selectedWbls.length + ' ' + gettextCatalog.getString("Webbles selected.")}, null);
                }
            }
        }
		else if(sublink == 'expwbl' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'E')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
				var selectedWbls = $scope.getSelectedWebbles();
				if(selectedWbls.length == 1){
					$scope.requestExportWebble(selectedWbls[0]);
				}
				else{
					$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Cannot do that..."), content: gettextCatalog.getString("This operation only works with one selected Webble at a time, and you have") + ' ' + selectedWbls.length + ' ' + gettextCatalog.getString("Webbles selected.")}, null);
				}
			}
		}
        else if(sublink == 'upload' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'U')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                locationPathChangeRequest = '/templates';
                $scope.waiting(true);
                quickSaveWSInternal();
            }
        }

        //==== EDIT ============================
        else if(sublink == 'undo' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Z')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                executeUndoRedo(false);
            }
        }
        else if(sublink == 'redo' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Y')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                executeUndoRedo(true);
            }
        }
        else if(sublink == 'selectall' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'A')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.selectAllWebbles();
            }
        }
        else if(sublink == 'deselectall' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'A')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.unselectAllWebbles();
            }
        }
        else if(sublink == 'duplicate' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'D')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                duplicateAllSelectedWebbles();
            }
        }
        else if(sublink == 'sharedduplicate' || (whatKeys.theAltKey && whatKeys.theShiftKey  && whatKeys.theKey == 'D')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                sharedModelDuplicateAllSelectedWebbles();
            }
        }
        else if(sublink == 'bundle' || (whatKeys.theAltKey && whatKeys.theShiftKey  && whatKeys.theKey == 'B')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var selectionsCorrect = true;
                var bundleTopParents = getSelectedTopParents();
                for(var i = 0, tp; tp = bundleTopParents[i]; i++){
                    if(tp.scope().getParent() != undefined){
                        selectionsCorrect = false;
                        break;
                    }
                }

                if(selectionsCorrect){
                    var allWblsToBeBundled = [];
                    for(var i = 0, tp; tp = bundleTopParents[i]; i++){
                        allWblsToBeBundled = allWblsToBeBundled.concat($scope.getAllDescendants(tp));
                    }
                    $scope.configureBundle(allWblsToBeBundled);
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {
                        title: gettext("Bundle Selection Broken"),
                        content: gettext("A Webble Bundle can only be made with complete Webble families, and not just with parts. Please select only single Webbles and/or super parents (Webbles with children and grandchildren but no parents of their own).")
                    });
                }
            }
        }
        else if(sublink == 'delete' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && !whatKeys.theShiftKey && whatKeys.theKey == 'Delete')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var wblsToDel = getSelectedTopParents();
                for(var i = 0; i < wblsToDel.length; i++){
					$scope.requestDeleteWebble(wblsToDel[i]);
                }
            }
        }
        else if(sublink == 'wblprops' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'K')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
				if(mwpVisibility_ == 'none'){
					mwpVisibility_ = 'inline-block';
				}
				else{
					mwpVisibility_ = 'none';
				}
            }
        }
        else if(sublink == 'platformprops' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'K')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.openForm(Enum.aopForms.platformProps, getPlatformPropsContent(), platformPropsReturned);
            }
        }

        //==== VIEW ============================
        else if(sublink == 'toggleconn' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 9')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(vcvVisibility_ == 'none'){
                    vcvVisibility_ = 'inline-block';
                }
                else{
                    vcvVisibility_ = 'none';
                }
            }
        }
        else if(sublink == 'wsinfo' || (whatKeys.theAltKey && whatKeys.theKey == 'W')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var appTime = ((((new Date()).getTime() - applicationStartTime_.getTime())/1000)/60).toFixed(2);
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Webble World Platform Information"), content:
                    '<strong>' + gettextCatalog.getString("Application Runtime") + '</strong>: ' + appTime + ' ' + gettextCatalog.getString("minutes") + '.<br>' +
					'<strong>' + gettextCatalog.getString("No of loaded Webbles") + '</strong>: ' + $scope.getActiveWebbles().length + '<br>' +
					'<strong>' + gettextCatalog.getString("No of different Webble Templates used") + '</strong>: ' + webbleTemplates_.length + '<br>' +
					'<strong>' + gettextCatalog.getString("No of different Webble Definitions used") + '</strong>: ' + webbleDefs_.length + '<br>' +
					'<strong>' + gettextCatalog.getString("No of different Sandbox Webbles used") + '</strong>: ' + listOfLoadedSandboxWebbles_.length + '<br>'
                });
            }
        }
        else if(sublink == 'fullscrn' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'F')){
            toggleFullScreen();
        }

        //==== HELP ============================
        else if(sublink == 'docs' || (whatKeys.theAltKey && whatKeys.theKey == 'M')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.open(appPaths.webbleDocRelPath);
            }
        }
		else if(sublink == 'tutorials' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'U')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
				$window.open('https://www.youtube.com/playlist?list=PL1sLx5eXq85NvFtnzhpOm4lNJFsDE6DlZ', '_blank');
			}
		}
        else if(sublink == 'faq' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'F')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.openForm(Enum.aopForms.faq, {userEmail: ($scope.user != undefined ? $scope.user.email : 'guest'), isAdmin: ($scope.user != undefined && $scope.user.role == 'adm')}, null);
            }
        }
        else if(sublink == 'openchat' || (whatKeys.theAltKey && whatKeys.theKey == 'C')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.$broadcast("showChat");
            }
        }
        else if(sublink == 'support' || (whatKeys.theAltKey && whatKeys.theKey == 'H')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.location = "mailto:mkuwahara@meme.hokudai.ac.jp?subject=Webble World Support Request";
            }
        }
		else if(sublink == 'community' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'C')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
				$window.open('http://stackoverflow.com/', '_blank');
			}
		}
        else if(sublink == 'devpack' || (whatKeys.theAltKey && whatKeys.theKey == 'G')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.open('data/WebbleDevPack.zip');
            }
        }
		else if(sublink == 'git' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'G')){
			if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
				$window.open('https://github.com/truemrwalker/wblwrld3', '_blank');
			}
		}
        else if(sublink == 'bugreport' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 7')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.location = "mailto:mkuwahara@meme.hokudai.ac.jp?subject=Webble World Bug Report";
            }
        }
        else if(sublink == 'about' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 5')){
            $scope.openForm(Enum.aopForms.about, null, null);
        }

        //==== USER MENU ============================
        else if(sublink == 'profile'){
            locationPathChangeRequest = '/profile';
            quickSaveWSInternal();
        }
        else if (sublink == 'notif'){
	        locationPathChangeRequest = '/profile'; // ditto
            quickSaveWSInternal();
        }
        else if (sublink == 'groups'){
	        locationPathChangeRequest = '/groups'; // ditto
            quickSaveWSInternal();
        }
        else if (sublink == 'adm'){
          locationPathChangeRequest = '/adm'; // ditto
          quickSaveWSInternal();
        }
        else if (sublink == 'logout'){
	        $scope.logout();
        }

        //==== AND OTHER ============================
        else{
            var testIfSBWClick = false;
            for(var i = 0; i < availableSandboxWebbles_.length; i++){
                if(sublink == availableSandboxWebbles_[i].id){
                    testIfSBWClick = true;
                    $scope.loadWebbleFromDef(availableSandboxWebbles_[i], null);
                    break;
                }
            }

            if(!testIfSBWClick){
                actionWasExecuted = false;

                //Easter egg check
                if (appViewOpen && !whatKeys.theAltKey && whatKeys.theKey != null && whatKeys.theKey != ''){
                    var specialIndex = -1;
                    soFarWord_ += whatKeys.theKey.toString();
                    for (var i = 0; i < eeWord_.length; i++) {
                        if (soFarWord_.toLowerCase() == eeWord_[i].substring(0, soFarWord_.length).toLowerCase()){
                            specialIndex = i;
                            break;
                        }
                    }

                    if(specialIndex != -1){
                        if(soFarWord_.length == eeWord_[specialIndex].length && soFarWord_ == eeWord_[specialIndex]){
                            eeFunc_[specialIndex]();
                            soFarWord_ = '';
                        }
                    }
                    else{
                        soFarWord_ = '';
                    }
                }
            }
        }
		$scope.fireWWEventListener(Enum.availableWWEvents.mainMenuExecuted, {targetId: null, menuId: sublink, timestamp: (new Date()).getTime()});

        return actionWasExecuted;
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************

	if(($location.search()).np != "true"){
		authService.tryLoginIfSessionActive();
	}

    platformCtrlSetup();

});
//====================================================================================================================
