//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
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
wblwrld3App.controller('btnWebbleCtrl', function($scope, $log, Slot, Enum, gettext) {

    //=== PROPERTIES ====================================================================
    var currentBtnStyle = 'btn-primary';
    var currentBtnSize = '';
    var btnSizes = ['btn-lg', '', 'btn-sm', 'btn-xs'];

    $scope.stylesToSlots = {
        btnGrabber: ['background-color', 'border'],
        theBtn: ['font-size', 'font-weight', 'font-family', 'margin']
    };



    //=== EVENT HANDLERS ================================================================

    //===================================================================================
    // Click button event
    //===================================================================================
    $scope.clicking = function($event){
        var clickValue = 0;
        var increaseValue = 1;
        if(!isNaN(parseInt($scope.gimme('click')))){
            clickValue = parseInt($scope.gimme('click'))
        }
        if(!isNaN(parseInt($scope.gimme('clickIncrease')))){
            increaseValue = parseInt($scope.gimme('clickIncrease'))
        }

        $scope.set('click', clickValue + increaseValue);
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
        $scope.addSlot(new Slot('btnTxt',
            gettext("Click Me"),
            'Button Text',
            'The Text displayed on the button',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('btnDisabled',
            false,
            'Button Disabled',
            'If checked the button will be disabled',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('clickIncrease',
            1,
            'Click Increase',
            'The Value which will be added to the click indicator when the button is clicked',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('click',
            0,
            'Click',
            'The slot which is set (increased) when the button is clicked',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('btnStyle',
            'btn-primary',
            'Button Style',
            'The Style of the button',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['btn-default', 'btn-primary', 'btn-success', 'btn-info', 'btn-warning', 'btn-danger', 'btn-link']},
            undefined
        ));

        $scope.addSlot(new Slot('btnSize',
            1,
            'Button Size',
            'The Size of the button',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Large', 'Medium', 'Small', 'Extra Small']},
            undefined
        ));

        $scope.setDefaultSlot('click');

        //if double clicked un-select
        $scope.theView.find('#theBtn').bind('dblclick', function(event, ui){
            $scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
            event.stopPropagation();
        });

        // Slot Watches
        $scope.$watch(function(){return $scope.gimme('btnStyle');}, function(newVal, oldVal) {
            $scope.theView.find('#theBtn').removeClass(currentBtnStyle);
            currentBtnStyle = newVal;
            $scope.theView.find('#theBtn').addClass(newVal);
        }, true);

        $scope.$watch(function(){return $scope.gimme('btnSize');}, function(newVal, oldVal) {
            if(currentBtnSize != ''){
                $scope.theView.find('#theBtn').removeClass(currentBtnSize);
            }
            currentBtnSize = btnSizes[newVal];
            $scope.theView.find('#theBtn').addClass(btnSizes[newVal]);
        }, true);
    };
    //===================================================================================
});
//======================================================================================================================
