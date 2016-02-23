//======================================================================================================================
// Controllers for Date Picker Webble for Webble World v3.0 (2013)
// Created By: TrueMrWalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('dateWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        dateContainer: ['background-color', 'border', 'padding'],
        datepicker: ['font-size', 'font-weight', 'font-family']
    };

    $scope.formProps = {
        dateValue: new Date(),
        isDisabled: false
    };

    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var theDatePicker;

    //=== EVENT HANDLERS ================================================================


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
        theDatePicker = $scope.theView.parent().find('#datepicker');
        theDatePicker.datepicker();
        theDatePicker.datepicker( "option", "autoSize", true );
        theDatePicker.datepicker( "option", "dateFormat", "yy-mm-dd" );
        theDatePicker.datepicker( "option", "firstDay", 1 );
        theDatePicker.datepicker( "setDate", new Date() );

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'currentDate'){
				$scope.formProps.dateValue = eventData.slotValue;
				setSeparateDatePartSlots();
			}
			// Make sure the readonly slot sets the corresponding ng-model value
			else if(eventData.slotName == 'isDisabled'){
				if(eventData.slotValue != $scope.formProps.isDisabled && (eventData.slotValue.toString().toLowerCase() == 'true' || eventData.slotValue.toString().toLowerCase() == 'false')){
					$scope.formProps.isDisabled = (eventData.slotValue.toString().toLowerCase() == 'true');
				}
			}
		});

        $scope.addSlot(new Slot('currentDate',
            getFormatedDate(new Date()),
            'Selected Date',
            'This is the date currently selected',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('isDisabled',
            $scope.formProps.isDisabled,
            "Date Input Disabled",
            "Weather the date can be edited or not",
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('currentWeekdayNumeral',
            new Date($scope.gimme('currentDate')).getDay(),
            'Selected Weekday (numeral)',
            'This is the weekday as a number of the currently selected date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currentWeekdayNumeral').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('currentWeekdayString',
            weekdays[new Date($scope.gimme('currentDate')).getDay()-1],
            'Selected Weekday (text)',
            'This is the weekday by name of the currently selected date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currentWeekdayString').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('currentMonthNumeral',
            new Date($scope.gimme('currentDate')).getMonth() + 1,
            'Selected Month (numeral)',
            'This is the month as a number of the currently selected date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currentMonthNumeral').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('currentMonthString',
            months[new Date($scope.gimme('currentDate')).getMonth()],
            'Selected Month (text)',
            'This is the month by name of the currently selected date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currentMonthString').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('currentDateNumeral',
            new Date($scope.gimme('currentDate')).getDate(),
            'Selected Date (of the month)',
            'This is the date of the month of the currently selected date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currentDateNumeral').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.setDefaultSlot('currentDate');

		$scope.$watch(function(){return $scope.formProps.dateValue;}, function(newVal, oldVal) {
			if(getFormatedDate(newVal) != $scope.gimme('currentDate')){
				$scope.set('currentDate', getFormatedDate(newVal));
				setSeparateDatePartSlots();
			}
		}, true);
    };
    //===================================================================================


    //===================================================================================
    // Get Formated Date
    // Formats and return a javascript date to the iso format yyyy-mm-dd.
    //===================================================================================
    var getFormatedDate = function(inDate){
        var newFormatedDate = '';

        if(!inDate.getFullYear){
            inDate = new Date(inDate);
        }

        if(inDate.getFullYear && inDate != 'Invalid Date'){
          var month = inDate.getMonth()+1;
          var day = inDate.getDate();
          newFormatedDate = inDate.getFullYear() + '-' + (month<10 ? '0' : '') + month + '-' + (day<10 ? '0' : '') + day;
        }
        else{
            $scope.showQIM("Date must be of proper format, preferably Iso standard yyyy-mm-dd", 3000);
        }

        return newFormatedDate;
    }
    //===================================================================================


    //===================================================================================
    // Set Separate Date Part Slots
    // When a date has been set also set separate weekday, month and date slots too.
    //===================================================================================
    var setSeparateDatePartSlots = function(){
        var currentDate = $scope.formProps.dateValue;

        if(!currentDate.getDay){
            currentDate = new Date(currentDate);
        }

        $scope.set('currentWeekdayNumeral', currentDate.getDay());
        $scope.set('currentWeekdayString', weekdays[currentDate.getDay()-1]);
        $scope.set('currentMonthNumeral', currentDate.getMonth()+1);
        $scope.set('currentMonthString', months[currentDate.getMonth()]);
        $scope.set('currentDateNumeral', currentDate.getDate());
    }
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================

