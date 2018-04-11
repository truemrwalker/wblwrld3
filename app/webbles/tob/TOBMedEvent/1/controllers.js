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

wblwrld3App.controller("medEventWebbleCtrl", function($scope, $log, Slot, Enum) {
    // $scope is needed for angularjs to work properly and is
    // not recommended to be removed. Slot is a Webble World
    // available Service and is needed for any form of Slot
    // manipulation inside this template and is not
    // recommended to be removed.
    // cleanupService is just a custom service used as an
    // example, but any services needed must be included in
    // the controller call.

    //=== PROPERTIES ====================================================================

    var allowedTypes = {
	'none':'0',        //No type  [0]
	'chem':'1',        //Chemo Therapy Med Event  [1]
	'com':'2',         //Communication Med Event  [2]
	'cons':'3',        //Consultation Med Event  [3]
	'pat':'4',         //Patient diary Med Event  [4]
	'biop':'5',        //Biop Med Event  [5]
	'blood':'6',       //Blood diagnostic Med Event  [6]
	'imag':'7',        //Image diagnostic Med Event  [7]
	'rad':'8',         //Radio Therapy Med Event  [8]
	'rand':'9',        //Randomization Med Event  [9]
	'rep':'10',        //Report Med Event  [10]
	'saesusar':'11',   //SAE / SUSAR Med Event  [11]
	'stratif':'12',    //Stratification Med Event  [12]
	'sup':'13',        //Supportive Therapy Med Event  [13]
	'surg':'14',       //Surgery (Scheduled) Med Event  [14]
	'surga':'15',      //Surgery (due to accident) Med Event  [15]
	'surgc':'16',      //Surgery (due to complication) Med Event  [16]
	'reg':'17',        //Registration Med Event  [17]
	'undef':'18',      //Not yet defined  [18]
	'ptc':'19'         //Parallel Treatment Container  [19]
    };

    var labelShapes = {'rectangle':true, 'ellipse':true, 'none':true};
    var labelShape = 'rectangle';

    var borderWidth = 1;
    var firstBoxWidth = 37;
    var oneDayScaleFactor = 14.3;

    var shadowUsesBackgroundColor = false;
    var shadowUsesColor = false;
    var shadowUsesBorderColor = false;
    var isRandom = false;
    var isStratif = false;
    var isReg = false;
    var isSaesusar = false;
    var isTriangle = false;

    var myInstanceId = -1;

    $scope.microEvents = [];

    $scope.internalNoofPixelsW = 7 * oneDayScaleFactor;
    $scope.internalNoofPixelsH = 20;
    $scope.totalWidth = 7 * oneDayScaleFactor;

    $scope.shadowMode = false;

    $scope.internalMedEventText = '';

    $scope.internalFirstBoxText = '';

    $scope.internalMedEventStyle = {'height': $scope.internalNoofPixelsH + 'px', 'width':$scope.internalNoofPixelsW + 'px', 'background-color': 'grey', 'border': '2px solid black', 'border-radius':'5px', 'font-family': 'Arial', 'font-size': '12px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden'};

    $scope.internalLabelStyle = {'position':'absolute', 'color':'red', 'background-color':'pink', 'top':'-35px', 'left':'0px', 'height':'30px', 'width':'30px', 'font-size':'22px', 'font-family':'arial', 'padding':'3px', 'text-overflow':'ellipsis', 'overflow':'hidden'};
    $scope.internalLabelText = '';

    $scope.internalArmLabelStyle = {'position':'absolute', 'color':'black', 'background-color':'white', 'top':'10px', 'left':'-33px', 'width':'30px', 'height':'30px', 'border':'1px solid black', 'border-radius':'15px', 'text-overflow':'ellipsis', 'overflow':'hidden', 'font-size':'22px', 'font-family':'arial', 'padding':'0 0 0 5px', 'z-index':10 };
    $scope.internalArmLabelText = '';

    $scope.tellParent = {}; // the wblEventInfo.slotChanged does not seem to work properly, so we make our own version instead...

    function truncate(number)
    {
	return number > 0
            ? Math.floor(number)
            : Math.ceil(number);
    };

    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBMedEvent: " + message);
	}
    };

    $scope.silentMoveLeft = function(newLeft) {
	var left = truncate(newLeft);
	if(isNaN(left)) {
	    debugLog("silentMoveLeft has NaN, ignore");
	} else {
	    var oldLeft = parseInt($scope.gimme("root:left"));
	    if(oldLeft != left) {
		var oldTop = parseInt($scope.gimme("root:top"));
		$scope.tellParent['ignoreIfPosIs'] = [left, oldTop];
	 	$scope.set('root:left', left);
	    }
	}
    };
    
    $scope.silentMoveTop = function(newTop) {
	var top = truncate(newTop);
	if(isNaN(top)) {
	    debugLog("silentMoveTop has NaN, ignore."); 
	} else {
            var oldTop = parseInt($scope.gimme("root:top"));
	    if(oldTop != top) {
		var oldLeft = parseInt($scope.gimme("root:left"));
		$scope.tellParent['ignoreIfPosIs'] = [oldLeft, top];
		
    		$scope.set('root:top', top);
	    }
	}
    };
    
    $scope.silentMove = function(newLeft, newTop) {
	var left = truncate(newLeft);
	var top = truncate(newTop);
	if(isNaN(left) || isNaN(top)) {
	    debugLog("silentMove has NaN, ignore.");
	} else {
	    var oldLeft = parseInt($scope.gimme("root:left"));
            var oldTop = parseInt($scope.gimme("root:top"));
	    if(oldTop != top || oldLeft != left) {
		$scope.tellParent['ignoreIfPosIs'] = [left, top];

    		$scope.set('root:left', left);
    		$scope.set('root:top', top);
	    }
	}
    };

    //TODO: An object with element-id keys holding arrays of css style names that should be converted to slots
    // These slots will be found by the name format '[TEMPLATE ID]_[ELEMENT NAME]:[CSS ATTRIBUTE NAME]'
    //$scope.stylesToSlots = {
    //    [ELEMENT NAME]: ['[CSS ATTRIBUTE NAME]']
    //};
    // EXAMPLE:
    // $scope.stylesToSlots = {
    // 	eventTextSpan: ['font-size', 'color', 'font-family']
    // };

    //TODO: Array of custom menu item keys and display names
    $scope.customMenu = [{itemId: 'tobdelete', itemTxt: 'Delete One'}, {itemId: 'tobdeletesubtree', itemTxt: 'Delete From Here'}, {itemId: 'tobduplicate', itemTxt: 'Duplicate One'}, {itemId: 'tobduplicatesubtree', itemTxt: 'Duplicate From Here'}, {itemId: 'patActivate', itemTxt: 'Activate for Patient'}, {itemId: 'connectCRF', itemTxt: 'Assign CRF'}, {itemId: 'openCRF', itemTxt: 'Open CRF'}, {itemId: 'assignStartEnd', itemTxt: 'Assign Start/End Dates'}, {itemId: 'microEvents', itemTxt: 'MicroEvents'}];

    //TODO: Array of customized Interaction Balls
    $scope.customInteractionBalls = [{index: 7, name: 'armOrder', tooltipTxt: 'Arm Order'}, {index: 4, name: 'patActivate', tooltipTxt: 'Activate for Patient'}, {index:6, name:'noofDays', tooltipTxt:'Number of Days'}];


    //=== EVENT HANDLERS ================================================================

    var myNormalZIndex = 10;
    $scope.tobEventMouseLeave = function () {
	$scope.set("root:z-index", myNormalZIndex);
	// $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
    };

    $scope.tobEventMouseEnter = function () {
	// debugLog("TOBMedEvent: mouseEnter");
	$scope.set("root:z-index", 50);
	// $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
    };

    $scope.tobEventMouseClick = function () {
	$scope.setSelectionState(!$scope.getSelectionState());
    };

    //=== METHODS & FUNCTIONS ===========================================================

    var updateStatusMarker = function() {
	//	debugLog("updateStatusMarker starts");

	var newShadowMode = $scope.gimme('StatusMarkerEnabled');

	if(!newShadowMode) {
	    //	    debugLog("updateStatusMarker turn off");
	    $scope.statusMarkerMode = false;
	} else {
	    //	    debugLog("updateStatusMarker turn on");

	    var col = $scope.gimme('StatusMarkerColor');
	    $scope.statusMarkerMode = true;
	    $scope.statusMarkerColor = col;

	    //	    debugLog("updateStatusMarker color: " + col);
	}
	//	debugLog("updateStatusMarker ends");
    };
    
    var updateShadow = function() {
	var newShadowMode = $scope.gimme('ShadeOutEnabled');

	if(!newShadowMode) {
	    $scope.shadowMode = false;
	} else {
	    var shadowColor = $scope.gimme('ShadeOutColor');
	    $scope.shadowMode = true;
	    
	    if(shadowUsesBackgroundColor) {
		$scope.shadowStyle['background-color'] = shadowColor;
		$scope.shadowStyle['opacity'] = 0.75;
	    }
	    if(shadowUsesColor) {
		$scope.shadowStyle['color'] = shadowColor;
		$scope.shadowStyle['opacity'] = 0.5;
	    }
	    if(shadowUsesBorderColor) {
		$scope.shadowStyle['border-color'] = shadowColor;
		$scope.shadowStyle['opacity'] = 0.75;
	    }
	    if(isRandom) {
		$scope.internalMedEventShadowStyle['border-left'] = '2px solid ' + shadowColor.toString();
		$scope.upperTriangleShadowStyle['border-color'] = shadowColor.toString() + ' transparent transparent transparent';
		$scope.lowerTriangleShadowStyle['border-color'] = 'transparent transparent ' + shadowColor.toString() + ' transparent';

		$scope.internalMedEventShadowStyle['opacity'] = 0.75;
		$scope.upperTriangleShadowStyle['opacity'] = 0.75;
		$scope.lowerTriangleShadowStyle['opacity'] = 0.75;
	    }
	    if(isReg) {
		$scope.shadowStyle['border-left'] = '3px solid ' + shadowColor;
		$scope.shadowStyle['border-right'] = '1px solid ' + shadowColor;
		$scope.shadowStyle['opacity'] = 0.75;
	    }
	    if(isStratif) {
		$scope.shadowStyle['border-left'] = '6px solid ' + shadowColor;
		$scope.shadowStyle['opacity'] = 0.75;
	    }
	    if(isSaesusar) {
		$scope.upperTriangleShadowStyle['border-bottom-color'] = shadowColor;
		$scope.lowerTriangleShadowStyle['border-top-color'] = shadowColor;
		$scope.upperTriangleShadowStyle['opacity'] = 0.75;
		$scope.lowerTriangleShadowStyle['opacity'] = 0.75;
	    }
	    if(isTriangle) {
		$scope.shadowStyle['border-color'] = 'transparent transparent ' + shadowColor + ' transparent';
		$scope.shadowStyle['opacity'] = 0.75;
	    }
	}
    };

    var updateEventType = function (newVal) {
	// debugLog("TOBMedEvent: " + myInstanceId + "  updateEventType " + newVal);

        var temp = '';

	shadowUsesColor = false;
	shadowUsesBackgroundColor = false;
	shadowUsesBorderColor = false;
        isRandom = false;
	isReg = false;
	isStratif = false;
	isSaesusar = false;
	isTriangle = false;

	$scope.statusMarkerLeft = '5px';
	$scope.statusMarkerTop = '5px';

	switch(newVal) {
	case 'none':
	    $scope.internalMedEventGenre='rectangle';
	    $scope.internalNoofPixelsH = 20;

	    temp = firstBoxWidth + $scope.internalNoofPixelsW + 2 * borderWidth;
	    $scope.outerBoxStyle = {'height': ($scope.internalNoofPixelsH+2).toString()+'px', 'width':temp.toString() + 'px', 'border': '1px solid black'};

	    $scope.totalWidth = temp;

	    $scope.internalFirstBoxText = 'none';
	    
	    $scope.internalFirstBoxStyle = {'float':'left', 'height': $scope.internalNoofPixelsH, 'width':firstBoxWidth.toString() + 'px', 'background-color': 'white', 'border-right': '1px solid black', 'border-radius':'0px', 'font-family': 'Arial', 'font-size':'12px', 'color':'black', 'margin':'0 0 0 0'};
	    $scope.internalMedEventStyle = {'float':'left', 'height': $scope.internalNoofPixelsH, 'width':$scope.internalNoofPixelsW+'px', 'background-color': 'grey', 'border': '0px', 'border-radius':'0px', 'font-family': 'Arial', 'font-size': '12px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'margin':'0 0 0 0'};

	    $scope.shadowStyle = {'position':'absolute', 'top':0, 'left':0, 'height': $scope.internalNoofPixelsH + 2 * borderWidth + 'px', 'width':$scope.totalWidth + 'px', 'background-color':'rgba(0,0,0,0.5)', 'border':'none'};
	    shadowUsesBackgroundColor = true;
	    break;

	case 'undef':
	    $scope.internalMedEventGenre='rectangle';
	    $scope.internalNoofPixelsH = 20;

	    temp = firstBoxWidth + $scope.internalNoofPixelsW + 2 * borderWidth;
	    $scope.outerBoxStyle = {'height': ($scope.internalNoofPixelsH+2).toString()+'px', 'width':temp.toString() + 'px', 'border': '1px solid black'};

	    $scope.totalWidth = temp;

	    $scope.internalFirstBoxText = 'undef';
	    
	    $scope.internalFirstBoxStyle = {'float':'left', 'height': $scope.internalNoofPixelsH, 'width':firstBoxWidth.toString() + 'px', 'background-color': 'white', 'border-right': '1px solid black', 'border-radius':'0px', 'font-family': 'Arial', 'font-size':'12px', 'color':'black', 'margin':'0 0 0 0'};
	    $scope.internalMedEventStyle = {'float':'left', 'height': $scope.internalNoofPixelsH, 'width':$scope.internalNoofPixelsW+'px', 'background-color': 'grey', 'border': '0px', 'border-radius':'0px', 'font-family': 'Arial', 'font-size': '12px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'margin':'0 0 0 0'};

	    $scope.shadowStyle = {'position':'absolute', 'top':0, 'left':0, 'height': $scope.internalNoofPixelsH + 2 * borderWidth + 'px', 'width':$scope.totalWidth + 'px', 'background-color':'rgba(0,0,0,0.5)', 'border':'none'};
	    shadowUsesBackgroundColor = true;
	    break;

	case 'rad':	    
	    $scope.internalMedEventGenre='radio';
	    $scope.internalNoofPixelsH = 50;

	    $scope.internalFirstBoxText = '';

	    temp = firstBoxWidth + $scope.internalNoofPixelsW + 2 * borderWidth;
	    $scope.outerBoxStyle = {'height': ($scope.internalNoofPixelsH+2).toString()+'px', 'width':temp.toString() + 'px', 'border': '1px solid black'};

	    $scope.totalWidht = temp;

	    $scope.internalFirstBoxStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':firstBoxWidth.toString() + 'px', 'background-color': '#ffff00', 'border-right': '1px solid black', 'border-radius':'0px', 'font-family': 'Arial', 'font-size':'42px', 'color':'black', 'margin':'0 0 0 0'};
	    $scope.internalMedEventStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':$scope.internalNoofPixelsW+'px', 'background-color': '#FF9999', 'border': '0px', 'border-radius':'0px', 'font-family': 'Arial', 'font-size': '28px', 'color': 'black', 'font-weight':'bold', 'text-overflow':'ellipsis', 'overflow':'hidden', 'margin':'0 0 0 0', 'padding':'3px 5px 5px 3px'};
	    
	    $scope.shadowStyle = {'position':'absolute', 'top':0, 'left':0, 'height': $scope.internalNoofPixelsH + 2 * borderWidth + 'px', 'width':$scope.totalWidth + 'px', 'background-color':'rgba(0,0,0,0.5)', 'border':'none'};
	    shadowUsesBackgroundColor = true;

	    break;
	case 'chem':		    
	    $scope.internalMedEventGenre='rectangle';
	    $scope.internalNoofPixelsH = 50;

	    temp = firstBoxWidth + $scope.internalNoofPixelsW + 2 * borderWidth;
	    $scope.outerBoxStyle = {'height': ($scope.internalNoofPixelsH+2).toString()+'px', 'width':temp.toString() + 'px', 'border': '1px solid black'};

	    $scope.totalWidth = temp;

	    $scope.internalFirstBoxText = 'C';

	    $scope.internalFirstBoxStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':firstBoxWidth.toString() + 'px', 'background-color': '#99cc00', 'border-right': '1px solid black', 'border-radius':'0px', 'font-family': 'Arial', 'font-size':'42px', 'font-weight':'bold', 'color':'black', 'margin':'0 0 0 0'};

	    $scope.internalMedEventStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':$scope.internalNoofPixelsW+'px', 'background-color': '#99ccff', 'border': '0px', 'border-radius':'0px', 'font-family': 'Arial', 'font-size': '28px', 'font-weight':'bold', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'margin':'0 0 0 0'};

	    $scope.shadowStyle = {'position':'absolute', 'top':0, 'left':0, 'height': $scope.internalNoofPixelsH + 2 * borderWidth + 'px', 'width':$scope.totalWidth + 'px', 'background-color':'rgba(0,0,0,0.5)', 'border':'none'};
	    shadowUsesBackgroundColor = true;

	    break;
	case 'sup':		    
	    $scope.internalMedEventGenre='rectangle';
	    $scope.internalNoofPixelsH = 25;

	    temp = firstBoxWidth + $scope.internalNoofPixelsW + 2 * borderWidth;
	    $scope.outerBoxStyle = {'height': ($scope.internalNoofPixelsH+2).toString()+'px', 'width':temp.toString() + 'px', 'border': '1px solid black'};

	    $scope.totalWidth = temp;

	    $scope.internalFirstBoxText = 'S';

	    $scope.internalFirstBoxStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':firstBoxWidth.toString() + 'px', 'background-color': 'orange', 'border-right': '1px solid black', 'border-radius':'0px', 'font-family': 'Arial', 'font-size':'21px', 'font-weight':'bold', 'color':'black', 'margin':'0 0 0 0', 'padding-left':'2px'};
	    $scope.internalMedEventStyle = {'float':'left', 'height': $scope.internalNoofPixelsH+'px', 'width':$scope.internalNoofPixelsW+'px', 'background-color': 'DodgerBlue', 'border': '0px', 'border-radius':'0px', 'font-family': 'Arial', 'font-size': '20px', 'font-weight':'bold', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'margin':'0 0 0 0', 'padding-left':'2px'};

	    $scope.shadowStyle = {'position':'absolute', 'top':0, 'left':0, 'height': $scope.internalNoofPixelsH + 2 * borderWidth + 'px', 'width':$scope.totalWidth + 'px', 'background-color':'rgba(0,0,0,0.5)', 'border':'none'};
	    shadowUsesBackgroundColor = true;

	    break;

	case 'com':		    
	    $scope.internalMedEventGenre='ball';
	    $scope.internalMedEventStyle = {'height':'30px', 'width':'30px', 'background-color': 'blue', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'10px', 'left':'-15px'};

	    $scope.shadowStyle = {'height':'30px', 'width':'30px', 'background-color': 'blue', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'-20px', 'left':'-15px'};
	    shadowUsesBackgroundColor = true;
	    shadowUsesBorderColor = true;
	    $scope.statusMarkerLeft = '-5px';
	    break;
	case 'pat':		    
	    $scope.internalMedEventGenre='ball';
	    $scope.internalMedEventStyle = {'height':'30px', 'width':'30px', 'background-color': 'red', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'10px', 'left':'-15px'};

	    $scope.shadowStyle = {'height':'30px', 'width':'30px', 'background-color': 'blue', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'-20px', 'left':'-15px'};
	    shadowUsesBackgroundColor = true;
	    shadowUsesBorderColor = true;
	    $scope.statusMarkerLeft = '-5px';
	    break;
	case 'cons':		    
	    $scope.internalMedEventGenre='ball';
	    $scope.internalMedEventStyle = {'height':'30px', 'width':'30px', 'background-color': 'yellow', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'10px', 'left':'-15px'};

	    $scope.shadowStyle = {'height':'30px', 'width':'30px', 'background-color': 'blue', 'border': '1px solid black', 'border-radius':'15px', 'font-family': 'Arial', 'font-size': '10px', 'color': 'black', 'text-overflow':'ellipsis', 'overflow':'hidden', 'padding':'7px', 'position':'relative', 'top':'-20px', 'left':'-15px'};
	    shadowUsesBackgroundColor = true;
	    shadowUsesBorderColor = true;
	    $scope.statusMarkerLeft = '-5px';
	    break;



	case 'biop':		    
	    $scope.internalMedEventGenre='biop';

	    $scope.internalMedEventGenre='arr';
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'blue', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'blue', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black', 'opacity':0.75};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-55px';
	    break;
	case 'blood':		    
	    $scope.internalMedEventGenre='blood';

	    $scope.internalMedEventGenre='arr';
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'red', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'blue', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black', 'opacity':0.75};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-55px';
	    break;
	case 'imag':		    
	    $scope.internalMedEventGenre='imag';

	    $scope.internalMedEventGenre='arr';
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'yellow', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '60px', 'font-weight':'bold', 'color': 'blue', 'position':'absolute', 'top':'-76px', 'left':'-13px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black', 'opacity':0.75};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-55px';
	    break;




	case 'surg':		    
	    $scope.internalMedEventGenre='s';
	    $scope.internalNoofPixelsH = 25;
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'blue', 'position':'relative', 'left':'-10px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};

	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'grey', 'position':'relative', 'left':'-37px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '-5px';
	    break;
	case 'surga':		    
	    $scope.internalMedEventGenre='s';
	    $scope.internalNoofPixelsH = 25;
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'yellow', 'position':'relative', 'left':'-10px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};

	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'grey', 'position':'relative', 'left':'-37px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '-5px';
	    break;
	case 'surgc':		    
	    $scope.internalMedEventGenre='s';
	    $scope.internalNoofPixelsH = 25;
	    $scope.internalMedEventStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'red', 'position':'relative', 'left':'-10px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};

	    $scope.shadowStyle = {'font-family': 'Arial', 'font-size': '35px', 'font-weight':'bold', 'color': 'grey', 'position':'relative', 'left':'-37px', 'text-shadow':'-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black'};
	    shadowUsesColor = true;

	    $scope.statusMarkerLeft = '-5px';
	    break;



	case 'reg':		    
	    $scope.internalMedEventGenre='vertical';
	    $scope.internalNoofPixelsH = $scope.gimme('NoOfUnits');
	    $scope.internalMedEventStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'6px', 'border-left':'3px solid black', 'border-right':'1px solid black', 'position':'relative', 'top':'-6px'};

	    $scope.shadowStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'6px', 'border-left':'3px solid black', 'border-right':'1px solid black', 'position':'relative', 'top':(-$scope.internalNoofPixelsH - 18) + 'px'};
	    isReg = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-5px';

	    break;
	case 'stratif':		    
	    $scope.internalMedEventGenre='vertical';
	    $scope.internalNoofPixelsH = $scope.gimme('NoOfUnits');
	    $scope.internalMedEventStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'6px', 'border-left':'6px solid black', 'position':'relative', 'top':'-6px'};

	    $scope.shadowStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'6px', 'border-left':'6px solid black', 'position':'relative', 'top':(-$scope.internalNoofPixelsH - 18) + 'px'};
	    isStratif = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-5px';
	    break;

	case 'ptc':		    
	    $scope.internalMedEventGenre='parallel';
	    $scope.internalNoofPixelsH = $scope.gimme('NoOfUnits');
	    $scope.internalMedEventStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'15px', 'border-top': '6px solid blue', 'border-bottom': '6px solid blue', 'border-left': '6px solid blue', 'border-radius':'0px', 'border-right':'0px', 'font-family': 'Arial', 'font-size': '12px', 'color': 'yellow', 'text-overflow':'ellipsis', 'overflow':'hidden', 'position':'relative', 'top':'-6px'};
	    $scope.shadowStyle = {'height':($scope.internalNoofPixelsH + 12) + 'px', 'width':'15px', 'border-top': '6px solid blue', 'border-bottom': '6px solid blue', 'border-left': '6px solid blue', 'border-radius':'0px', 'border-right':'0px', 'font-family': 'Arial', 'font-size': '12px', 'color': 'yellow', 'text-overflow':'ellipsis', 'overflow':'hidden', 'position':'relative', 'top':(-$scope.internalNoofPixelsH - 18) + 'px'};
	    shadowUsesBorderColor = true;

	    $scope.statusMarkerLeft = '0px';
	    $scope.statusMarkerTop = '-5px';
	    break;

	case 'rand':		    
	    $scope.internalMedEventGenre='randomizer';
	    $scope.internalNoofPixelsH = $scope.gimme('NoOfUnits');
	    $scope.internalMedEventStyle = {'height':($scope.internalNoofPixelsH + 2).toString() + 'px', 'width':'2px', 'border-left':'2px solid red', 'position':'absolute', 'top':'-1px'};

	    $scope.upperTriangleStyle = {'height':'0px', 'width':'0px', 'border-style': 'solid', 'border-color':'red transparent transparent transparent', 'border-width':'24px 12px 0 12px', 'position':'absolute', 'top':'-22px', 'left':'-11px'};
	    $scope.lowerTriangleStyle = {'height':'0px', 'width':'0px', 'border-style': 'solid', 'border-color':'transparent transparent red transparent', 'border-width':'0 10px 24px 12px', 'position':'absolute', 'top':$scope.internalNoofPixelsH + 'px', 'left':'-11px'};


	    $scope.internalMedEventShadowStyle = {'height':($scope.internalNoofPixelsH + 2).toString() + 'px', 'width':'2px', 'border-left':'2px solid red', 'position':'absolute', 'top':'-1px'};

	    $scope.upperTriangleShadowStyle = {'height':'0px', 'width':'0px', 'border-style': 'solid', 'border-color':'red transparent transparent transparent', 'border-width':'24px 12px 0 12px', 'position':'absolute', 'top':'-22px', 'left':'-11px'};
	    $scope.lowerTriangleShadowStyle = {'height':'0px', 'width':'0px', 'border-style': 'solid', 'border-color':'transparent transparent red transparent', 'border-width':'0 10px 24px 12px', 'position':'absolute', 'top':$scope.internalNoofPixelsH + 'px', 'left':'-11px'};
	    isRandom = true;

	    $scope.statusMarkerLeft = '-5px';
	    $scope.statusMarkerTop = '-15px';
	    break;

	case 'rep':		    
	    $scope.internalMedEventGenre='triangle';
	    $scope.internalTriangleStyle = {'height':'3px', 'width':'7px', 'border-style': 'solid', 'border-color':'transparent transparent #99ccff transparent', 'border-width':'0 15px 26px 15px', 'position':'relative', 'left':'-13px', 'top':'15px'};

	    $scope.shadowStyle = {'height':'3px', 'width':'7px', 'border-style': 'solid', 'border-color':'transparent transparent #99ccff transparent', 'border-width':'0 15px 26px 15px', 'position':'relative', 'left':'-13px', 'top':'-11px'};
	    isTriangle = true;

	    $scope.statusMarkerLeft = '0px';
	    break;

	case 'saesusar':		    
	    $scope.internalMedEventGenre='diamond';
	    $scope.upperTriangleStyle = {'height':'0px', 'width':'0px', 'border': '17px solid transparent', 'border-bottom-color':'red', 'position':'relative', 'top':'-7px', 'left':'-17px'};
	    $scope.lowerTriangleStyle = {'content':'', 'position':'absolute', 'top':'27px', 'left':'-17px', 'width':'0px', 'height':'0px', 'border':'17px solid transparent', 'border-top-color':'red'};

	    $scope.upperTriangleShadowStyle = {'height':'0px', 'width':'0px', 'border': '17px solid transparent', 'border-bottom-color':'red', 'position':'relative', 'top':'-41px', 'left':'-17px'};
	    $scope.lowerTriangleShadowStyle = {'content':'', 'position':'absolute', 'top':'27px', 'left':'-17px', 'width':'0px', 'height':'0px', 'border':'17px solid transparent', 'border-top-color':'red'};
	    isSaesusar = true;
	    $scope.statusMarkerLeft = '0px';
	    break;

	}
	
	$scope.set('EventColor', $scope.internalMedEventStyle['background-color']);
    };
    
    var initializeEventTypeEtc = function () {
	// debugLog("TOBMedEvent: " + myInstanceId + "  initializeEventTypeEtc");
	var col = $scope.gimme('EventColor');
	
	var etype = $scope.gimme('MedEventType');
	
	updateEventType(etype);
	
	if(col != 'grey') {
	    $scope.set('EventColor', col);
	}

	var w = $scope.gimme('NoOfUnits');

	updateNoOfUnits(w);
    };

    var updateNoOfUnits = function (newVal) {
	// debugLog("TOBMedEvent: " + myInstanceId + "  updateNoOfUnits " + newVal);
	var temp = newVal * oneDayScaleFactor - firstBoxWidth;
	
	if(temp != $scope.internalNoofPixelsW) {
	    $scope.internalNoofPixelsW = temp;
	    $scope.totalWidth = newVal * oneDayScaleFactor + 2 * borderWidth;

	    if($scope.internalMedEventGenre == 'rectangle' || $scope.internalMedEventGenre == 'radio') {
		$scope.internalMedEventStyle['width'] = $scope.internalNoofPixelsW + 'px';
		$scope.outerBoxStyle['width'] = ($scope.internalNoofPixelsW + firstBoxWidth + 2*borderWidth).toString() + 'px';
		
		$scope.shadowStyle['width'] = $scope.totalWidth;

		$scope.tellParent['NoOfUnits'] = newVal;
	    }
	}

	if($scope.internalMedEventGenre == 'randomizer' || $scope.internalMedEventGenre == 'parallel' || $scope.internalMedEventGenre == 'vertical') {
	    $scope.internalNoofPixelsH = newVal;

	    if(typeof($scope.internalNoofPixelsH) == 'string') {
		$scope.internalNoofPixelsH = parseInt($scope.internalNoofPixelsH);
	    }

	    if($scope.internalMedEventGenre == 'randomizer') {
		$scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 2) + 'px';
		$scope.lowerTriangleStyle['top'] = $scope.internalNoofPixelsH + 'px';

		$scope.internalMedEventShadowStyle['height'] = ($scope.internalNoofPixelsH + 2) + 'px';
		$scope.lowerTriangleShadowStyle['top'] = $scope.internalNoofPixelsH + 'px';
	    } else if($scope.internalMedEventGenre == 'parallel') {
		$scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';

		$scope.shadowStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';
		$scope.shadowStyle['top'] = (-$scope.internalNoofPixelsH - 18) + 'px'
	    } else {
		$scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';

		$scope.shadowStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';
		$scope.shadowStyle['top'] = (-$scope.internalNoofPixelsH - 18) + 'px';
	    }
	}

    };


    var updateEventText = function (newVal) {
	$scope.internalMedEventText = newVal;
	$scope.tellParent['LabelAndTextDirty'] = true;
    };

    var updateArmLabel = function (newVal) {
	$scope.internalArmLabelText = newVal;
	$scope.tellParent['LabelAndTextDirty'] = true;
    };
    
    var updateLabelText = function (newVal) {
	$scope.internalLabelText = newVal;
	$scope.tellParent['LabelAndTextDirty'] = true;
    };

    var updateLabelColor = function (newVal) {
	if(labelShape != 'none') {
	    $scope.internalLabelStyle['background-color'] = newVal;
	}
	$scope.tellParent['LabelAndTextDirty'] = true;
    };

    var updateLabelPos = function (newVal) {
	$scope.internalLabelStyle['margin-left'] = newVal[0].toString() + 'px';
	$scope.internalLabelStyle['margin-top'] = (Number(newVal[1]) - $scope.internalNoofPixelsH).toString() + 'px';
	$scope.tellParent['LabelAndTextDirty'] = true;
    };

    var updateLabelShape = function (newVal) {
	labelShape = newVal;
	
	switch(newVal) {
	case 'none': 
	    $scope.internalLabelStyle['border'] = '0px';
	    delete $scope.internalLabelStyle['background-color'];
	    break;
	case 'rectangle':
	    $scope.internalLabelStyle['border'] = '1px solid black';
	    $scope.internalLabelStyle['border-radius'] = '0px';
	    $scope.internalLabelStyle['background-color'] = $scope.gimme('LabelColor');
	    $scope.internalLabelStyle['width'] = '70px';
	    $scope.internalLabelStyle['height'] = '31px';
	    break;
	case 'ellipse':
	    $scope.internalLabelStyle['border'] = '1px solid black';
	    $scope.internalLabelStyle['border-radius'] = '15px';
	    $scope.internalLabelStyle['padding'] = '3px';
	    $scope.internalLabelStyle['background-color'] = $scope.gimme('LabelColor');
	    $scope.internalLabelStyle['width'] = '30px';
	    $scope.internalLabelStyle['height'] = '30px';
	    break;
	default:
	}
	$scope.tellParent['LabelAndTextDirty'] = true;
    };

    var updateMicroEvents = function(newValue) {
	//	debugLog("updateMicroEvents");

	var newList = [];
	for(var i = 0; i < newValue.length; i++) {
	    if(newValue[i] !== undefined && newValue[i] !== null && newValue[i].id !== undefined && newValue[i].crf !== undefined && newValue[i].day !== undefined) {
		newList.push(newValue[i]);
		//		debugLog("push " + i + " " + newValue[i].id + " " + newValue[i].crf + " " + newValue[i].day);
	    } else {
		//		debugLog("skip " + i);
	    }
	}
	$scope.microEvents = newList;
    };

    $scope.getMicroEventColor = function(id) {
	//	debugLog("getMicroEventColor(" + id + ")");

	for(var i = 0; i < $scope.microEvents.length; i++) {
	    if($scope.microEvents[i].id == id) {
		if($scope.microEvents[i].crf !== null) {
		    return "green";
		} else {
		    return "red";
		}
	    }
	}
	return "black";
    };
    
    $scope.getMicroEventPosition = function(id) {
	//	debugLog("getMicroEventPosition(" + id + ")");
	
	for(var i = 0; i < $scope.microEvents.length; i++) {
	    if($scope.microEvents[i].id == id) {
		return (oneDayScaleFactor * ($scope.microEvents[i].day - 0.5) - 8).toString() + "px";
	    }
	}
	return "0px";	
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

	$scope.addPopupMenuItemDisabled('Bundle');
	$scope.addPopupMenuItemDisabled('BringFwd');
	$scope.addPopupMenuItemDisabled('ConnectSlots');
	$scope.addPopupMenuItemDisabled('Protect');
	$scope.addPopupMenuItemDisabled('AddCustomSlots');
	$scope.addPopupMenuItemDisabled('About');

//	$scope.addPopupMenuItemDisabled('Publish');
	$scope.addPopupMenuItemDisabled('Duplicate');
	$scope.addPopupMenuItemDisabled('Delete');
	$scope.addPopupMenuItemDisabled('RevokeParent');
//	$scope.addPopupMenuItemDisabled('Props');
	$scope.addPopupMenuItemDisabled('BringFwd');
	$scope.addPopupMenuItemDisabled('SharedDuplicate');

	$scope.addPopupMenuItemDisabled('patActivate');
	$scope.addPopupMenuItemDisabled('tobdelete');
	$scope.addPopupMenuItemDisabled('tobduplicate');
	$scope.addPopupMenuItemDisabled('tobdeletesubtree');
	$scope.addPopupMenuItemDisabled('tobduplicatesubtree');
	$scope.addPopupMenuItemDisabled('connectCRF');
	$scope.addPopupMenuItemDisabled('assignStartEnd');
	$scope.addPopupMenuItemDisabled('microEvents');

        //TODO: Add template specific Slots on the following format...
        //$scope.addSlot(new Slot([NAME],
        //    [VALUE],
        //    [DISPLAY NAME],
        //    [DESCRIPTION],
        //    [CATEGORY],
        //    [METADATA],
        //    [ELEMENT POINTER]
        //));

	$scope.addSlot(new Slot('MedEventId',
				0,
				'Med Event Id',
				'The ID of this event',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('MedEventType',
				'rad',
				'Med Event Type',
				'The Event Type of this event',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	//    $scope.addSlot(new Slot('MedEventType',
	//            0,
	//				'Med Event Type',
	//				'The Event Type of this event',
	//            $scope.theWblMetadata['templateid'],
	//            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Normal', 'Detached', 'Detached with copy']},
	//            undefined
	//        ));

	$scope.addSlot(new Slot('NoOfUnits',
				7,
				'No of Units',
				'No of days this treatment event takes.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('OffsetNoofUnits',
				0,
				'Offset no of Units',
				'The number of days to wait before this event should start (counted from the previous event).',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('IsMandatory',
				true,
				'Is Mandatory',
				'Is the event mandatory or not?',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('MedEventMode',
				'design',
				'Med Event Mode',
				'The mode this event should operate in (design/patientOverview/patientFlow/analysis)',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('EventColor',
				'grey',
				'Event Color',
				'The color of the user specified part of this event.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('EventText',
				'',
				'Event Text',
				'Descriptive text to display on the Event.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('TreatmentArmText',
				'',
				'Treatment Arm Label Text',
				'Text to put as label for the treatment arm',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('LabelText',
				'',
				'Label Text',
				'Text to put in the label',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('LabelShape',
				'rectangle',
				'Label Shape',
				'Shape of the label (ellipse, rectangle, none)',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('LabelColor',
				'white',
				'Label Color',
				'The color of the label.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('LabelPos',
				[0,-40],
				'Label Pos',
				'The position of the label.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('StatusMarkerEnabled',
				false,
				'Status Marker Enabled',
				'',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('StatusMarkerColor',
				'red',
				'Status Marker Color',
				'',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	//	$scope.addSlot(new Slot('DroppedNotification',
	//				false,
	//				'Dropped Notification',
	//				'Set to true to informt the controller that this event has been dropped onto the trial flow chart.',
	//				$scope.theWblMetadata['templateid'],
	//				undefined,
	//				undefined));

	//	$scope.addSlot(new Slot('ShiftDroppedNotification',
	//				false,
	//				'Shift Dropped Notification',
	//				'Set to true to informt the controller that this event has been dropped onto the trial flow chart, and that the SHIFT key was held down.',
	//				$scope.theWblMetadata['templateid'],
	//				undefined,
	//				undefined));

	//	$scope.addSlot(new Slot('MovingRestrictedNotifiation',
	//				false,
	//				'Moving Restricted Notification',
	//				'',
	//				$scope.theWblMetadata['templateid'],
	//				undefined,
	//				undefined));

	$scope.addSlot(new Slot('ShadeOutEnabled',
				false,
				'Shade Out Enabled',
				'Should the event be shaded (black=not reachable, white=future event, red=no CRF attached, etc.)',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('ShadeOutColor',
				'#ff0000',
				'Shade Out Color',
				'What color should this event be shaded?',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));


	$scope.addSlot(new Slot('MicroEvents',
				[],
				'Micro Events',
				'A list of any micro events this event has',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));


	// $scope.addSlot(new Slot('ParentMoveLeft',
	// 			0,
	// 			'Parent Move Left',
	// 			'Set root:left without notifying the parent.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined));

	// $scope.addSlot(new Slot('ParentMoveTop',
	// 			0,
	// 			'Parent Move Top',
	// 			'Set root:top without notifying the parent.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined));

	// $scope.addSlot(new Slot('HeightIncludingChildren',
	// 			100,
	// 			'Height Including Children',
	// 			'The total height of the subtree rooted in this event.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined));

	// $scope.addSlot(new Slot('SetPosOfChildren',
	// 			false,
	// 			'Set Pos of Children',
	// 			'Used by the controller to force the event to update the positions of all its children.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,
	// 			undefined));

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

        var medEventTypeWatcher = $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    
	    if(!allowedTypes[newVal]) {
		newVal = 'undef';
	    }

	    updateEventType(newVal);
	}, myInstanceId, 'MedEventType');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    if(newVal != 50) {
		myNormalZIndex = newVal;
	    }
	}, myInstanceId, 'root:z-index');


	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    if(newVal < 0) {
		newVal = 0;
	    }
	    
	    $scope.tellParent['OffsetNoofUnits'] = newVal;
	}, myInstanceId, 'OffsetNoofUnits');


	// NoOfUnits
	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    if(newVal < 0) {
		newVal = 0;
	    }

	    updateNoOfUnits(newVal);
	}, myInstanceId, 'NoOfUnits');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    $scope.internalMedEventStyle['background-color'] = newVal;
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'EventColor');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateEventText(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'EventText');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateArmLabel(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'TreatmentArmText');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateLabelText(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'LabelText');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateLabelColor(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'LabelColor');


	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateLabelPos(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = true;
	}, myInstanceId, 'LabelPos');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    if(!labelShapes[newVal]) {
		newVal = 'rectangle';
	    }
	    
	    updateLabelShape(newVal);
	    $scope.tellParent['LabelAndTextDirty'] = newVal;
	}, myInstanceId, 'LabelShape');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateMicroEvents(newVal);
	}, myInstanceId, 'MicroEvents');


	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateShadow();
	}, myInstanceId, 'ShadeOutEnabled');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateShadow();
	}, myInstanceId, 'ShadeOutColor');


	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateStatusMarker();
	}, myInstanceId, 'StatusMarkerEnabled');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    updateStatusMarker();
	}, myInstanceId, 'StatusMarkerColor');


	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    $scope.tellParent['IsMandatory'] = newVal;
	}, myInstanceId, 'IsMandatory');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    var left = parseInt($scope.gimme("root:left"));
            var top = parseInt($scope.gimme("root:top"));
            
            // debugLog("root:left changed, " + $scope.gimme("root:left") + ", " + $scope.gimme("root:top") + " (" + left + ", " + top + ")");
            // if(isNaN(left)) {
	    // 	debugLog("new pos is NaN");
            // }
	    
	    $scope.tellParent['pos'] = [left, top];
	}, myInstanceId, 'root:left');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    // debugLog("TOBMedEvent: " + myInstanceId + "  slot listener, " + eventData.slotName + " is now " + eventData.slotValue);
	    var newVal = eventData.slotValue;
	    var left = parseInt($scope.gimme("root:left"));
            var top = parseInt($scope.gimme("root:top"));

	    // debugLog("root:top changed, " + $scope.gimme("root:left") + ", " + $scope.gimme("root:top") + " (" + left + ", " + top + ")");
            // if(isNaN(top)) {
	    // 	debugLog("new pos is NaN");
            // }
	    
            $scope.tellParent['pos'] = [left, top];
	}, myInstanceId, 'root:top');










        // var medEventTypeWatcher = $scope.$watch(function(){return $scope.gimme('MedEventType');}, function(newVal, oldVal) {
	//     // debugLog("MedEventType watch, newVal: " + newVal + ", oldVal: " + oldVal);

	//     if(!allowedTypes[newVal]) {
	// 	newVal = 'undef';
	//     }

	//     updateEventType(newVal);
	    
        // }, true);

	// $scope.$watch(function(){return $scope.gimme('root:z-index');}, function(newVal, oldVal) {
	//     if(newVal != 50) {
	// 	myNormalZIndex = newVal;
	//     }
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('OffsetNoofUnits');}, function(newVal, oldVal) {
	//     if(newVal < 0) {
	// 	newVal = 0;
	//     }
	    
	//     $scope.tellParent['OffsetNoofUnits'] = newVal;
	// }, true);

	// //	$scope.$watch(function(){return $scope.gimme('root:top');}, function(newVal, oldVal) {
	// //	    $scope.tellParent['root:top'] = newVal;
	// //	}, true);

	// //	$scope.$watch(function(){return $scope.gimme('root:left');}, function(newVal, oldVal) {
	// //	    $scope.tellParent['root:left'] = newVal;
	// //	}, true);
	

	// $scope.$watch(function(){return $scope.gimme('NoOfUnits');}, function(newVal, oldVal) {
	//     if(newVal < 0) {
	// 	newVal = 0;
	//     }

	//     var temp = newVal * oneDayScaleFactor - firstBoxWidth;
	    
	//     if(temp != $scope.internalNoofPixelsW) {
	// 	$scope.internalNoofPixelsW = temp;
	// 	$scope.totalWidth = newVal * oneDayScaleFactor + 2 * borderWidth;

	// 	if($scope.internalMedEventGenre == 'rectangle' || $scope.internalMedEventGenre == 'radio') {
	// 	    $scope.internalMedEventStyle['width'] = $scope.internalNoofPixelsW + 'px';
	// 	    $scope.outerBoxStyle['width'] = ($scope.internalNoofPixelsW + firstBoxWidth + 2*borderWidth).toString() + 'px';
		    
	// 	    $scope.shadowStyle['width'] = $scope.totalWidth;

	// 	    $scope.tellParent['NoOfUnits'] = newVal;
	// 	}
	//     }

	//     if($scope.internalMedEventGenre == 'randomizer' || $scope.internalMedEventGenre == 'parallel' || $scope.internalMedEventGenre == 'vertical') {
	// 	$scope.internalNoofPixelsH = newVal;

	// 	if(typeof($scope.internalNoofPixelsH) == 'string') {
	// 	    $scope.internalNoofPixelsH = parseInt($scope.internalNoofPixelsH);
	// 	}

	// 	if($scope.internalMedEventGenre == 'randomizer') {
	// 	    $scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 2) + 'px';
	// 	    $scope.lowerTriangleStyle['top'] = $scope.internalNoofPixelsH + 'px';

	// 	    $scope.internalMedEventShadowStyle['height'] = ($scope.internalNoofPixelsH + 2) + 'px';
	// 	    $scope.lowerTriangleShadowStyle['top'] = $scope.internalNoofPixelsH + 'px';
	// 	} else if($scope.internalMedEventGenre == 'parallel') {
	// 	    $scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';

	// 	    $scope.shadowStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';
	// 	    $scope.shadowStyle['top'] = (-$scope.internalNoofPixelsH - 18) + 'px'
	// 	} else {
	// 	    $scope.internalMedEventStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';

	// 	    $scope.shadowStyle['height'] = ($scope.internalNoofPixelsH + 12) + 'px';
	// 	    $scope.shadowStyle['top'] = (-$scope.internalNoofPixelsH - 18) + 'px';
	// 	}
	//     }
	    
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('EventColor');}, function(newVal, oldVal) {
	//     $scope.internalMedEventStyle['background-color'] = newVal;
	//     $scope.tellParent['LabelAndTextDirty'] = newVal;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('EventText');}, function(newVal, oldVal) {
	//     updateEventText(newVal);
	//     $scope.tellParent['LabelAndTextDirty'] = newVal;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('TreatmentArmText');}, function(newVal, oldVal) {
	//     updateArmLabel(newVal);
	//     $scope.tellParent['LabelAndTextDirty'] = newVal;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('LabelText');}, function(newVal, oldVal) {
	//     updateLabelText(newVal);
	//     $scope.tellParent['LabelAndTextDirty'] = newVal;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('LabelColor');}, function(newVal, oldVal) {
	//     updateLabelColor(newVal);
	//     $scope.tellParent['LabelAndTextDirty'] = newVal;
	// }, true);


	// $scope.$watch(function(){return $scope.gimme('LabelPos');}, function(newVal, oldVal) {
	//     updateLabelPos(newVal);
	//     $scope.tellParent['LabelAndTextDirty'] = true;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('LabelShape');}, 
	// 	      function(newVal, oldVal) {
	// 		  if(!labelShapes[newVal]) {
	// 		      newVal = 'rectangle';
	// 		  }
			  
	// 		  updateLabelShape(newVal);
	// 		  $scope.tellParent['LabelAndTextDirty'] = newVal;
	// 	      }, 
	// 	      true);

	// $scope.$watch(function(){return $scope.gimme('MicroEvents');}, function(newVal, oldVal) {
	//     updateMicroEvents(newVal);
	// }, true);


	// $scope.$watch(function(){return $scope.gimme('ShadeOutEnabled');}, function(newVal, oldVal) {
	//     updateShadow();
	// }, true);
	// $scope.$watch(function(){return $scope.gimme('ShadeOutColor');}, function(newVal, oldVal) {
	//     updateShadow();
	// }, true);


	// $scope.$watch(function(){return $scope.gimme('StatusMarkerEnabled');}, function(newVal, oldVal) {
	//     updateStatusMarker();
	// }, true);
	// $scope.$watch(function(){return $scope.gimme('StatusMarkerColor');}, function(newVal, oldVal) {
	//     updateStatusMarker();
	// }, true);


	// $scope.$watch(function(){return $scope.gimme('IsMandatory');}, function(newVal, oldVal) {
	//     $scope.tellParent['IsMandatory'] = newVal;
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('root:left');}, function(newVal, oldVal) {
	//     var left = parseInt($scope.gimme("root:left"));
        //     var top = parseInt($scope.gimme("root:top"));
            
        //     // debugLog("root:left changed, " + $scope.gimme("root:left") + ", " + $scope.gimme("root:top") + " (" + left + ", " + top + ")");
        //     // if(isNaN(left)) {
	//     // 	debugLog("new pos is NaN");
        //     // }
	    
	//     $scope.tellParent['pos'] = [left, top];
	// }, true);
	// $scope.$watch(function(){return $scope.gimme('root:top');}, function(newVal, oldVal) {
	//     var left = parseInt($scope.gimme("root:left"));
        //     var top = parseInt($scope.gimme("root:top"));

	//     // debugLog("root:top changed, " + $scope.gimme("root:left") + ", " + $scope.gimme("root:top") + " (" + left + ", " + top + ")");
        //     // if(isNaN(top)) {
	//     // 	debugLog("new pos is NaN");
        //     // }
	    
        //     $scope.tellParent['pos'] = [left, top];
	// }, true);


	updateLabelShape($scope.gimme('LabelShape'));
	updateLabelPos($scope.gimme('LabelPos'));
	updateLabelColor($scope.gimme('LabelColor'));
	updateLabelText($scope.gimme('LabelText'));
	updateArmLabel($scope.gimme('TreatmentArmText'));

	initializeEventTypeEtc();

	/*	
		var childMovingStoppedWatch = $scope.$watch(function(){ return $scope.getWebbleConfig();}, function(newVal, oldVal) {
		debugLog("Watch on MedEvent.getWebbleConfig triggered! " + parseInt(newVal, 10) 
		+ " " + ((parseInt(newVal, 10) & parseInt(Enum.bitFlags_WebbleConfigs.IsMoving, 10))));
		
		if( (parseInt(newVal, 10) & parseInt(Enum.bitFlags_WebbleConfigs.IsMoving, 10)) === 0) {
		
		debugLog("Detected movement stopping!");
		
		var left = parseInt($scope.gimme("root:left"));
		var top = parseInt($scope.gimme("root:top"));
		
		if(Math.abs(lastLeft - left) > 1 && Math.abs(lastTop - top) > 1) {
		lastLeft = left;
		lastTop = top;
		
		debugLog("Detected a dragging movement!");
		
		$scope.tellParent['pos'] = [left, top];
		}
		
		}
		}, true);
	*/	
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    var interactionBallLastPos = [0,0];
    var interactionBallLastWidth = 0;
    var interactionBallLastNoofUnits = 0;

    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
        var targetName = $(event.target).scope().getName();

        if (targetName != ""){
	    if (targetName == 'armOrder'){
		// debugLog("Arm Order using ball");
		$scope.tellParent['ArmOrderChangeRequest'] = true;
	    }
	    else if (targetName == 'patActivate'){
		// debugLog("Patient Activate using ball");
		$scope.tellParent['PatientActivateRequest'] = true;
	    }
	    else if (targetName == 'noofDays'){
		// debugLog("Noof Days using ball");
		//		$scope.tellParent['NoofDaysRequest'] = true;



                interactionBallLastPos = {x: event.clientX, y: event.clientY};
		interactionBallLastWidth = $scope.gimme('width');
		interactionBallLastNoofUnits = $scope.gimme('NoOfUnits');

                $scope.getPlatformElement().bind('vmouseup', function(event){
                    $scope.getPlatformElement().unbind('vmousemove');
                    $scope.getPlatformElement().unbind('vmouseup');
                });

                $scope.getPlatformElement().bind('vmousemove', function(event){
                    // Set the scale slot
		    var newVal = interactionBallLastNoofUnits + (event.clientX - interactionBallLastPos.x) / oneDayScaleFactor;
		    if(newVal < 1) {
			newVal = 1;
		    }
                    $scope.set('NoOfUnits', newVal);
                });

	    } else {
		debugLog("Unhandled interaction ball used: " + targetName);
	    }
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
	if(itemName == 'tobdelete') {
	    // debugLog("Delete called");
	    //	    $scope.set('DeletionRequest', true);
	    $scope.tellParent['DeletionRequest'] = true;
	}
	else if(itemName == 'tobduplicate') {
	    // debugLog("Duplicate called");
	    //	    $scope.set('DuplicationRequest', true);
	    $scope.tellParent['DuplicationRequest'] = true;
	} else if(itemName == 'tobdeletesubtree') {
	    // debugLog("Delete subtree called");
	    $scope.tellParent['SubtreeDeletionRequest'] = true;
	}
	else if(itemName == 'tobduplicatesubtree') {
	    // debugLog("Duplicate subtree called");
	    $scope.tellParent['SubtreeDuplicationRequest'] = true;
	}
	else if(itemName == 'assignStartEnd') {
	    // debugLog("Start&End Dates called");
	    //	    $scope.set('AssignStartEndDatesRequest', true);
	    $scope.tellParent['AssignStartEndDatesRequest'] = true;
	}
	else if(itemName == 'connectCRF') {
	    // debugLog("CRF connect called");
	    //	    $scope.set('CRFConnectRequest', true);
	    $scope.tellParent['CRFConnectRequest'] = true;
	}
	else if(itemName == 'openCRF') {
	    $scope.tellParent['CRFOpenRequest'] = true;
	}
	else if(itemName == 'patActivate') {
	    // debugLog("Patient Activate called");
	    //	    $scope.set('PatientActivateRequest', true);
	    $scope.tellParent['PatientActivateRequest'] = true;
	}
	else if(itemName == 'microEvents') {
	    // debugLog("MicroEvents called");
	    $scope.tellParent['microEvents'] = true;
	}
	else {
	    debugLog("Unhandled menu item called: " + itemName);
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
