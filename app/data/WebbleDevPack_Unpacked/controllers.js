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
wblwrld3App.controller('fundamentalWebbleCtrl', function($scope, $log, Slot, Enum, cleanupService, gettextCatalog, gettext, dbService) {
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
    //TODO: An object with element-id keys holding arrays of css style names that should be converted to slots
    // These slots will be found by the name format '[TEMPLATE ID]_[ELEMENT NAME]:[CSS ATTRIBUTE NAME]'
    //$scope.stylesToSlots = {
    //    [ELEMENT NAME]: ['[CSS ATTRIBUTE NAME]']
    //};
    // EXAMPLE:
    $scope.stylesToSlots = {
        square: ['width', 'height', 'background-color', 'border', 'border-radius'],
        squareTxt: ['font-size', 'color', 'font-family']
    };

    //TODO: Array of custom menu item keys and display names
    //$scope.customMenu = [{itemId: '[MENU ITEM ID]', itemTxt: '[MENU ITEM DISPLAY TEXT]'}];
    // EXAMPLE:
    $scope.customMenu = [{itemId: 'eat', itemTxt: 'Have Lunch'}, {itemId: 'drink', itemTxt: 'Have refreshment'}];

    //TODO: If you want to hide (disable) any of the Webble's menu options one can do that easily using the itemId as an identifier.
    //TODO: Default menu options are identified by Enum.availableOnePicks_DefaultWebbleMenuTargets found in README
    //$scope.addPopupMenuItemDisabled([ITEM-ID]);
    // EXAMPLE:
    $scope.addPopupMenuItemDisabled('BringFwd');
    //TODO: Later, one can enable an option again or check status
    //$scope.removePopupMenuItemDisabled([ITEM-ID]);
	//$scope.isPopupMenuItemDisabled([ITEM-ID]);

    //TODO: Array of customized Interaction Balls
    //$scope.customInteractionBalls = [{index: [POSITION INDEX 0-11], name: '[IDENTIFIER]', tooltipTxt: '[DISPLAY TEXT]'}];
    // EXAMPLE:
    $scope.customInteractionBalls = [{index: 4, name: 'jump', tooltipTxt: 'Jump Home'}];

    //TODO: If your Webble contains strings in more languages beyond English, please insert them in its proper string
    //TODO: catalog for the languages in question.
    //TODO: Remember to make sure that both 'gettextCatalog' and 'gettext' services are included in the controller call above.
    //gettextCatalog.setStrings('[LANGUAGE CODE]', {"[ENGLISH STRING]": "[TRANSLATED STRING]", "[ENGLISH STRING]": "[TRANSLATED STRING]"});
    // EXAMPLE:
    gettextCatalog.setStrings('sv', {"Hi": "Hejsan", "Content:": "Innehåll:"});
    gettextCatalog.setStrings('no', {"Hi": "Hei", "Content:": "Innhold:"});
    gettextCatalog.setStrings('fi', {"Hi": "Hei", "Content:": "pitoisuus:"});

    //TODO: If you want to use dynamic online custom fonts, Webble World support that with use of WebFont loader that may access fonts at Google Fonts, Typekit, Fonts.com, and Fontdeck
    //TODO: Just add the following line below with the font provider and required parameters as shown
    //WebFont.load({
    //    google: { families: [ '[FONT FAMILY NAME]' ] },
    //    typekit: { id: 'xxxxxx' },
    //    monotype: { projectId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', version: 12345 },
    //    fontdeck: { id: 'xxxxx' }
    //});
    //EXAMPLE:
    WebFont.load({
        google: { families: [ 'Ewert::latin', 'Freckle+Face::latin' ] }
    });

    //TODO: If you have images and other resources uploaded in your webble template folder, and need to access them with a relative path, use this variable to store that path
    //TODO: but make the call from within the init function as seen below
    //var internalFilesPath;


    //TODO: If your Webble is using an api that requires a personal Access key to work, we recommend that you do not share your personal key in your Webble for everyone to use. Instead you should store the
    //TODO: needed keys in your user profile and request them here, meaning that if another Webble World User is using this (your) Webble, they too need to have a valid access key of their own, stored in
    //TODO: their profile for the Webble to work, and your access keys will not be abused.
    //TODO: The realm could for example be 'google' and the resource could for example be 'map'.
    //TODO: In order to allow others to use the Webble with their own keys, the realm and resource should be declared in the Webble description.
    //TODO: If there are some crucial dependencies between loading the API and the init of the Webble this code may better serve inside the coreCall_Init function to avoid breaks.
//    var myAccessKeyForSomething;
//    dbService.getMyAccessKey(realm, resource).then(
//        function(returningKey) {
//            if(returningKey){
//                var myAccessKeyForSomething = returningKey;
//                // DO WHAT YOU ARE SUPPOSED TO DO TO ACCESS THE API WITH THE KEYS YOU RETRIEVED.
//                  // For example:
//                  var urlPath = "https://maps.googleapis.com/maps/api/js?key=";
//                  $.getScript( urlPath +  myAccessKeyForSomething)
//                    .always(function( jqxhr, settings, exception ) {
//                      // DO WHAT YOU ARE SUPPOSED TO DO TO WHEN THE LIBRARY IS LOADED.
//                  });
//            }
//            else{
//                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Access Key Found"), content: gettext("There was no key of the specified realm and resource saved in your user profile.")}, null);
//            }
//        },
//        function (err) {
//            $log.log("ERROR: " + err);
//        }
//    );




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
          //TODO: If you have images and other resources uploaded in your webble template folder, and need to access them with a relative path, just call the getTemplatePath() function as shown below
          //TODO: to get the correct location for this Webble and its resource files
          //internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

        //TODO: Add template specific Slots on the following format...
        //$scope.addSlot(new Slot([NAME],
        //    [VALUE],
        //    [DISPLAY NAME],
        //    [DESCRIPTION],
        //    [CATEGORY],
        //    [METADATA],
        //    [ELEMENT POINTER]
        //));

        // EXAMPLE:
        $scope.addSlot(new Slot('msg',                  // Name
            gettext("Hi"),                              // Value
            'Message',                                  // Display Name
            'Text displayed on the Webble',             // Description
            $scope.theWblMetadata['templateid'],        // Category (common to set to the template id)
            undefined,                                  // Metadata... an object that may contain whatever or just be
                                                        // left undefined.
                                                        // Besides any custom data, the following content makes sense to
                                                        // a Webble:
                                                        // {inputType: Enum.aopInputTypes.[INPUT TYPE]}  //See Services for details for options
                                                        // {noFloatValRound: true}  // stops rounding long floats in property form
                                                        // {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an integer (index)
                                                        // {inputType: Enum.aopInputTypes.ComboBoxUseValue, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
                                                        // {inputType: Enum.aopInputTypes.RadioButton, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is a string (selected content)
                                                        // {inputType: Enum.aopInputTypes.MultiListBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
                                                        // {inputType: Enum.aopInputTypes.MultiCheckBox, comboBoxContent: ['OPTION 1', 'OPTION 2', ETC]}  //Slot value is an array
                                                        // {inputType: Enum.aopInputTypes.Slider, sliderMinMax: [0, 100]}
                                                        // {inputType: Enum.aopInputTypes.DatePick}  // slot value is date filtered: $filter('date')(new Date(), 'yyyy-MM-dd');
                                                        // If not set the Property form will make a pretty good guess
                                                        // instead, which in most cases are more than enough.
            undefined                                   // Element Pointer (undefined if not connected with CSS and those
                                                        // slots are automatically created above, not manually)
        ));
        //TODO: If you want to disable the access of a slot then do that setting the slots DisabledSetting
        //TODO: ranging between None (default), PropertyEditing, PropertyVisibility and ConnectionVisibility(basically invisible)
        //$scope.getSlot([SLOT NAME]).setDisabledSetting(Enum.SlotDisablingState.[SELECTED ACCESS STATE]);

        //NOTE: if you have strings in your code you want translated when language change, provide the translations
        //      in the area appointed above in the property section and wrap the string in a gettext() call or use
        //      'translate' filter in the view file


        //TODO: If you want to find your custom font families in the property dropdown list, add their main names as an array in lowercase to the metadata comboBoxContent object.
        //TODO: If you skip this you can still type by hand any font loaded into the system
        //$scope.getSlot('[SLOT NAME]').setMetaData({comboBoxContent: [ '[FONT NAME 1]', '[FONT NAME 2]' ]});
        // EXAMPLE:
        $scope.getSlot('squareTxt:font-family').setMetaData({comboBoxContent: [ 'ewert', 'freckle face' ]});


        //TODO: Set template specific Default slot for slot connections
        //$scope.setDefaultSlot([SLOT NAME]);
        // EXAMPLE:
        $scope.setDefaultSlot('msg');

        //TODO: Point the Resize default Interaction Object to selected Width and Height slots if this is wanted. If only one Width and Height Slot exist or none, the system automatically fix this.
        //$scope.setResizeSlots([WIDTH SLOT NAME], [HEIGHT SLOT NAME]);
        // EXAMPLE: $scope.setResizeSlots('square:width', 'square:height');

        //TODO: By default there is no active interaction object for scaling since it has some offset problems in regard to the mouse (jquery issue), but if you want one you can enable it here
        // EXAMPLE: $scope.theInteractionObjects[Enum.availableOnePicks_DefaultInteractionObjects.Rescale].scope().setIsEnabled(true);

        //TODO: Set template specific child container for clipping effects etc... default container is within the core Webble.
        // EXAMPLE: $scope.setChildContainer([ELEMENT])

        //TODO: If you want some part of your webble to not be affected by webble default dragging behavior and/or popup menu, the easiest way is to turn it off for that particular element
        //$scope.theView.parent().draggable('option', 'cancel', '#ID_OF_ELEMENT');
        //$scope.theView.parent().find('#ID_OF_ELEMENT').bind('contextmenu',function(){ return false; });
        // EXAMPLE: $scope.theView.parent().draggable('option', 'cancel', '#squareTxt');
        // EXAMPLE: $scope.theView.parent().find('#squareTxt').bind('contextmenu',function(){ return false; });

        //TODO: Create Initial template specific Value Listeners using angular $watch (additional $watch can be made and discarded in other places and times during the webbles life of course)
        //TODO: Remember to never listen to values containing complete webble references since they change constantly and creates watch loops
        //TODO You also use watches for slot value changes within yourself
        //$scope.$watch(function(){return [VALUE HOLDER TO WATCH];}, function(newVal, oldVal) {
        //  [CODE FOR TAKING CARE OF VALUE CHANGE]
        //}, true);
        //EXAMPLE (that uses the custom service for this Webble template):
        $scope.$watch(function(cleanupService){return $scope.gimme('msg');}, function(newVal, oldVal) {
            if(newVal.toLowerCase() == 'love'){
                alert('Aaah, you are so cute!');
            }
            else{
                var cleanedMsg = cleanupService(newVal);
                if(cleanedMsg != newVal){
                    $scope.set('msg', cleanedMsg);
                }
            }
        }, true);
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
            if (targetName == $scope.customInteractionBalls[0].name){ //jump
                $scope.set('root:left', 0);
                $scope.set('root:top', 0);
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
        //if(itemName == $scope.customMenu[0].itemId){  //[CUSTOM ITEM NAME]
        //    [CODE FOR THIS MENU ITEM GOES HERE]
        //}

        // EXAMPLE:
        if(itemName == $scope.customMenu[0].itemId){  //eat
            $log.log('Are you hungry?');
        }
        else if(itemName == $scope.customMenu[1].itemId){  //drink
            $log.log('Are you thirsty?')
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
