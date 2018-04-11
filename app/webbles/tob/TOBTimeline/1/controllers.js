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

wblwrld3App.controller("timelineWebbleCtrl", function($scope, $log, Slot, Enum) {
    // $scope is needed for angularjs to work properly and is
    // not recommended to be removed. Slot is a Webble World
    // available Service and is needed for any form of Slot
    // manipulation inside this template and is not
    // recommended to be removed.
    // cleanupService is just a custom service used as an
    // example, but any services needed must be included in
    // the controller call.

    //=== PROPERTIES ====================================================================

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
    // $scope.customMenu = [];

    //TODO: Array of customized Interaction Balls
    // $scope.customInteractionBalls = [];


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    $scope.canvasSize = {'width':100, 'height':142};

    var scaleFactor = 14.3;
    
    var leftBit = 15;
    var topSpace = 22;
    var smallBar = 10;
    var bigBar = 20;
    
    var timelineY = 32;
    var timelineWidth = 2;
    
    var fontSize = 20;

    $scope.doDebugLogging = false;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("TOBTimeline: " + message);
	}
    };

    var redrawTimeline = function () {
	// debugLog("redrawTimeline()");

	if(parseInt($scope.gimme('root:left')) < 0) {
	    $scope.set('root:left', '0px');
	}
	if(parseInt($scope.gimme('root:top')) < 0) {
	    $scope.set('root:top', '0px');
	}

	var days = Number($scope.gimme('NoOfDays'));
	
	if(isNaN(days)) {
	    days = 1;
	}

	if(days < 0) {
	    days = 0;
	}

	// if(days < 1) {
	//     days = 1;
	// }

	// debugLog("left " + $scope.gimme('root:left') + ", top " + $scope.gimme('root:top') + ", noofdays " + $scope.gimme('NoOfDays'));

	var dx = days * scaleFactor;

	var absolute = $scope.gimme('AbsoluteTime');
	
	if(absolute) {
	    var startDate = new Date($scope.gimme('StartDate').toString());
	    var now = new Date();

	    // debugLog("absolute: " + startDate.toDateString() + ", " + now.toDateString());
	}

	var canvas = $scope.theView.parent().find("#theCanvas").get(0);
	var context = canvas.getContext("2d");

	canvas.width = dx + leftBit * 3 + 2;
	canvas.height = 42 + 2;


	// the actual time line
	var y = timelineY;

	context.beginPath();
	context.moveTo(0, y);
	context.lineTo(dx + leftBit * 2, y);
	context.lineWidth = timelineWidth;
	context.strokeStyle = 'black';
	context.stroke();

	// the arrow head
	context.beginPath();
	context.moveTo(dx + leftBit * 2, topSpace);
	context.lineTo(dx + leftBit * 3, y);
	context.lineTo(dx + leftBit * 2, topSpace + (y - topSpace) * 2);
	context.closePath();
	// context.lineWidth = timelineWidth;
	// context.strokeStyle = 'black';
	// context.stroke();
	context.fillStyle = 'black';
	context.fill();

	if(absolute) {
	    var diffToNow = Math.floor((now - startDate) / (24*3600000));

	    // debugLog("absolute: " + startDate.toDateString() + ", " + now.toDateString() + ", " + diffToNow);
	    // debugLog("absolute: " + startDate.toString() + ", " + now.toString() + ", " + diffToNow);
	    
	    if(diffToNow >= 0 && diffToNow < days) {
		x = diffToNow * scaleFactor + leftBit;
		y = 0;

		// red vertical line
		context.beginPath();
		context.moveTo(x-timelineWidth, y);
		context.lineTo(x-timelineWidth, y + topSpace + bigBar);
		context.lineWidth = timelineWidth * 2;
		context.strokeStyle = 'red';
		context.setLineDash([4,2]);
		context.stroke();
		context.setLineDash([0,0]);
	    }
	}
	
	for(d = 0; d <= days; d++) {
	    if(d % 7 == 0) {
		x = d * scaleFactor + leftBit;
		y = topSpace;

		// medium vertical line
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x, y + bigBar);
		context.lineWidth = timelineWidth;
		context.strokeStyle = 'black';
		context.stroke();

		if(!absolute) {
		    // label
		    context.font = 'bold ' + fontSize.toString() + 'pt arial';
		    context.textAlign = 'center';
		    context.fillStyle = 'black';
		    context.fillText(d.toString(), x, fontSize);
		    // context.strokeStyle = 'black';
		    // context.strokeText(d.toString(), x, fontSize);
		} else {
		    // label
		    context.font = 'bold 12pt arial';
		    
		    context.textAlign = 'center';
		    context.fillStyle = 'black';
		    context.strokeStyle = 'black';

		    var dt = new Date();
		    dt.setDate(startDate.getDate() + d);
		    var formatted = dt.getFullYear() + "-" + (dt.getMonth() + 1).toString() + "-" + dt.getDate();
		    // context.strokeText(formatted, x, fontSize);
		    context.fillText(formatted, x, fontSize);
		    
		    // debugLog("absolute: " + startDate.toDateString() + ", " + dt.toDateString() + ", " + d);
		}
	    } else {
		x = d * scaleFactor + leftBit;
		y = topSpace + (bigBar - smallBar) / 2;

		// small vertical line
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x, y + smallBar);
		context.lineWidth = timelineWidth;
		context.strokeStyle = 'black';
		context.stroke();
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

	$scope.addSlot(new Slot('NoOfDays',
				0,
				'No of Days',
				'The total number of days of the trial.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('StartDate',
				(new Date()).toDateString(),
				'Start Date',
				'The date of the first day of the trial',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined));

	$scope.addSlot(new Slot('AbsoluteTime',
				false,
				'Absolute Time',
				'Should the timeline show actual dates (true) or relative dates (i.e. days into the trial; false).',
				$scope.theWblMetadata['templateid'],
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

	var myInstanceId = $scope.getInstanceId();

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    redrawTimeline();
	}, myInstanceId, 'root:left');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    redrawTimeline();
	}, myInstanceId, 'root:top');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    redrawTimeline();
	}, myInstanceId, 'NoOfDays');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    redrawTimeline();
	}, myInstanceId, 'StartDate');

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    redrawTimeline();
	}, myInstanceId, 'AbsoluteTime');

        // $scope.$watch(function(){return $scope.gimme('NoOfDays');}, function(newVal, oldVal) {	    
	//     redrawTimeline();
        // }, true);

	// $scope.$watch(function(){return $scope.gimme('StartDate');}, function(newVal, oldVal) {
	//     if($scope.gimme('AbsoluteTime')) {
	// 	redrawTimeline();
	//     }
	// }, true);

	// $scope.$watch(function(){return $scope.gimme('AbsoluteTime');}, function(newVal, oldVal) {
	//     redrawTimeline();
	// }, true);

	redrawTimeline();
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

        if (targetName !== ""){
	    // debugLog("TOBTimeline: Unhandled interaction ball used: " + targetName);
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
	// debugLog("TOBTimeline: Unhandled menu item called: " + itemName);
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
