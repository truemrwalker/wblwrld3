//======================================================================================================================
// Controllers for TIME for Webble World v3.0 (2013)
// Created By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// TIME WEBBLE CONTROLLER
// This is the Main controller for the TIME Webble Template
//=======================================================================================
function timeWebbleCtrl($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================

    // make sure timer shuts down when the Webble does.
    var killTimer;

    $scope.stylesToSlots = {
        timeBox: ['opacity', 'width', 'height', 'background-color', 'border'],
        timeTxt: ['font-size', 'color', 'font-family']
    };



    //=== EVENT HANDLERS ================================================================

    //===================================================================================
    // Timer
    // Is fired every 50 ms to update concerned time slots.
    //===================================================================================
    $scope.timer = function(){
        var now = new Date();

        if($scope.gimme('year') != now.getFullYear()){
            $scope.set('year', now.getFullYear());
        }

        if($scope.gimme('month') != (now.getMonth() + 1)){
            $scope.set('month', (now.getMonth() + 1));
        }

        if($scope.gimme('day') != now.getDate()){
            $scope.set('day', now.getDate());
        }

        if($scope.gimme('hour') != now.getHours()){
            $scope.setPlatformDoNotSaveUndoEnabled(true);
            $scope.set('hour', now.getHours());
        }

        var decVal = (now.getHours() + (now.getMinutes() / 60)).toFixed(2);
        if($scope.gimme('hourDecimal') != decVal){
            $scope.setPlatformDoNotSaveUndoEnabled(true);
            $scope.set('hourDecimal', parseFloat(decVal));
        }

        if($scope.gimme('minute') != now.getMinutes()){
            $scope.setPlatformDoNotSaveUndoEnabled(true);
            $scope.set('minute', now.getMinutes());
        }

        if($scope.gimme('second') != now.getSeconds()){
            $scope.setPlatformDoNotSaveUndoEnabled(true);
            $scope.set('second', now.getSeconds());
        }

        $scope.setPlatformDoNotSaveUndoEnabled(true);
        $scope.set('millisecond', now.getMilliseconds());

        var newTime = addZero($scope.gimme('hour')) + ':' + addZero($scope.gimme('minute')) + ':' + addZero($scope.gimme('second'));
        if($scope.gimme('currTime') != newTime){
            $scope.setPlatformDoNotSaveUndoEnabled(true);
            $scope.set('currTime', newTime);
        }

        var newDate = $scope.gimme('year') + '-' + addZero($scope.gimme('month')) + '-' + addZero($scope.gimme('day'));
        if($scope.gimme('currDate') != newDate){
            $scope.set('currDate', newDate);
        }

        killTimer = $timeout($scope.timer, 50);
    };
    //===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    // If any initiation needs to be done when the webble is created it is here.
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

        $scope.addSlot(new Slot('currTime',
            '',
            'Current Time',
            'Current Full Time',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currTime').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('currDate',
            '',
            'Current Date',
            'Current Full Date',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('currDate').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('hour',
            0,
            'Hour',
            'Current Hour',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('hour').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('hourDecimal',
            0,
            'Hour (Decimal)',
            'Current Hour as a decimal value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('hourDecimal').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('minute',
            0,
            'Minute',
            'Current Minute',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('minute').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('second',
            0,
            'Second',
            'Current Second',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('second').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('millisecond',
            0,
            'Millisecond',
            'Current millisecond',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('millisecond').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('year',
            1970,
            'Year',
            'Current Year',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('year').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('month',
            1,
            'Month',
            'Current Month',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('month').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('day',
            1,
            'Day',
            'Current Day',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('day').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);


        $scope.getSlot('timeTxt:font-family').setMetaData({comboBoxContent: [ 'digital_dreamregular' ]});
        $scope.setDefaultSlot('currTime');
        $scope.setResizeSlots('timeBox:width', 'timeBox:height');


        $scope.$watch(function(){return $scope.wblEventInfo.deleted;}, function(newVal, oldVal) {
            if(newVal != null){
                $timeout.cancel(killTimer);
            }
        }, true);
    };
    //===================================================================================

    //===================================================================================
    // Add Zero
    // Adds a leading zero to values that needs that
    //===================================================================================
    var addZero = function(n){
        return Number(n)<10? '0'+n:''+n;
    };
    //===================================================================================



    //=== CTRL MAIN CODE ======================================================================
    killTimer = $timeout($scope.timer, 50);
}
//======================================================================================================================