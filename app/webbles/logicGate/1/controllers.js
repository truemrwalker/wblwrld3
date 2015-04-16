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
function logicGateCtrl($scope, $log, Slot, Enum) {
    // $scope is needed for angularjs to work properly and is not recommended to be removed. Slot is a Webble World
    // available Service and is needed for any form of Slot manipulation inside this template and is not recommended
    // to be removed.
    // cleanupService is just a custom service used as an example, but any services needed must be included in
    // the controller call. If your Webble support multiple languages include gettextCatalog and gettext in your
    // controller, if not, then they may be removed.
    // dbService is basically only needed to access API access keys, if such are not needed it can be removed
    // Try to avoid running any code at the creation of the controller, unless you know it is completely independent
    // of any of the other files, this is due to file loading order. Instead make your first code calls inside the
    // coreCall_Init function which will be called as soon as all files including the DOM of the Webble is done loading.

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        //square: ['width', 'height', 'background-color', 'border', 'border-radius'],
    };



    // internal images
    var internalFilesPath;

    $scope.imgSrc = internalFilesPath + '/images/AND.png';


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
        internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

        $scope.addSlot(new Slot('gateType',
            'AND',
            'The Gate Type',
            'The type of gate used',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']},
            undefined
        ));

        $scope.addSlot(new Slot('input_1',
            0,
            'Input 1',
            'This is the first (primary) input value',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('input_2',
            0,
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


        $scope.$watch(function(){return $scope.gimme('gateType');}, function(newVal, oldVal) {
            $scope.imgSrc = internalFilesPath + '/images/' + newVal + '.png';
            calcOut();
        }, true);

        $scope.$watch(function(){return $scope.gimme('input_1');}, function(newVal, oldVal) {
            calcOut();
        }, true);

        $scope.$watch(function(){return $scope.gimme('input_2');}, function(newVal, oldVal) {
            calcOut();
        }, true);
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
        }

        $scope.set('output', out);
    }
    //========================================================================================





    //=== CTRL MAIN CODE ======================================================================

}
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
