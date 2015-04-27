//======================================================================================================================
// Controllers for Tabs & Pages Webble for Webble World v3.0 (2013)
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
function TNPCtrl($scope, $log, $timeout, Slot, Enum, dbService, jsonQuery, isEmpty) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        tnpHolder: ['background-color', 'border', 'border-radius', 'padding'],
        tabsContent: ['width', 'height', 'background-color']
    };

    // Webble elements
    var tnpHolder, tnpTabs, tabsContent, tnpTabs_a, tnpPages;

    // Child Control variables
    var expectedRelatives = 0;
    var childContainers = {};
    var childContainersMemory;
    var childPosMemory;

    // un-watcher for waiting for children
    var childWaitingWatch;

    // Flags to keep track of stuff going on internally
    var isInit = true; //if the webble are still initiating
    var doNotBother = false; //if the webble should not react on slot change
    var isMoving = false;

    $scope.whatElementIsAsking = {
      tabsContent: 0,
      classicTabsContainer: 1,
      bookPagesContainer: 2
    };

    var internalFilesPath;

    //Tab Variables
    var colorList = [];

    //Book and page variables
    var currentCCId;
    var binderWidthMultiplier = 0.04;
    var bookWidth = 0, bookHeight = 0, bookPadding = 0, bookBorderWidth = 0, binderWidth = 0, pageBorderWidth = 0, pageMargin = 0, pageWidth = 0, pageHeight = 0;
	var flipSpeed = 10;
	var flipLengthPerCall = 10;
    var flipSound;


    //=== EVENT HANDLERS ================================================================


    //===================================================================================
    // Tab Click
    // Make sure content change properly when a tab is clicked
    //===================================================================================
    var tabClick = function(e) {
        e.preventDefault();
        if ($(this).closest("li").attr("class") == "tnpCurrent"){ //detection for current tab
            return;
        }
        else{
            activateTabAndContent($(this));
        }
    }
    //===================================================================================


    //===================================================================================
    // Tab Hover
    // Make sure content change properly when a tab is hovered
    //===================================================================================
    var tabIn = function(e) {
        e.preventDefault();
        if ($(this).closest("li").attr("class") == "tnpCurrent"){ //detection for current tab
            return;
        }
        else{
            $(e.currentTarget).css('background-color',  $scope.gimme('hoverTabBackgroundColor'));
            $(e.currentTarget).find('.tnpTabsAfterA').css('background-color',  $scope.gimme('hoverTabBackgroundColor'));
        }
    }

    var tabOut = function(e) {
        e.preventDefault();
        if ($(this).closest("li").attr("class") == "tnpCurrent"){ //detection for current tab
            return;
        }
        else{
            var tabIndex = parseInt($(e.currentTarget).attr('name').replace('tab', ''));
            if(tabIndex > 0 && colorList[tabIndex - 1]){
                $(e.currentTarget).css('background-color',  colorList[tabIndex - 1]);
                $(e.currentTarget).find('.tnpTabsAfterA').css('background-color',  colorList[tabIndex - 1]);
            }
            else{
                $(e.currentTarget).css('background-color',  $scope.gimme('closedTabBackgroundColor'));
                $(e.currentTarget).find('.tnpTabsAfterA').css('background-color',  $scope.gimme('closedTabBackgroundColor'));
            }
        }
    }
    //===================================================================================


    //===================================================================================
    // Set Page Target At Mouse Over
    // When mouse is above a specific page it is set to be child container target.
    //===================================================================================
    var setPageTargetAtMouseOver = function(e) {
        e.preventDefault();
        var pageTarget = $(e.target);
        var pageTargetId = pageTarget.attr('id');
        if(pageTarget == undefined || pageTargetId == undefined || pageTargetId.search('flipPage') == -1 || pageTargetId == currentCCId){
            return;
        }

        $scope.setChildContainer(pageTarget);
        currentCCId = pageTargetId;
        $scope.set('currentSelectedTab', parseInt(pageTargetId.replace('flipPage', '')));
    }
    //===================================================================================


    //===================================================================================
    // Page Click
    // Deals with page flipping when a page is clicked
    //===================================================================================
    var pageClick = function(e) {
        e.preventDefault();
        if(isMoving){return;};

        var pageTarget = $(e.target);
        var targetId = pageTarget.attr('id');

        if($scope.getSelectionState() == Enum.availableOnePicks_SelectTypes.AsNewParent){ return; }

        var pageNo = parseInt(targetId.replace('flipPage', ''));
        isMoving = true;

        if(isPageOdd(pageNo)){
            var pageToShow = $scope.theView.parent().find('#flipPage' + (pageNo + 1));
            pageToShow.css('left', ((pageWidth*2) + bookPadding) + 'px');
            pageToShow.css('width', '0px');
            pageToShow.css("z-index", parseInt(pageToShow.css("z-index")) + 600);

            flipToLeft(pageNo, ((pageWidth*2) + bookPadding), 0, true);
        }
        else{
            var pageToShow = $scope.theView.parent().find('#flipPage' + (pageNo - 1));
            pageToShow.css('left', bookPadding + 'px');
            pageToShow.css('width', '0px');
            pageToShow.css("z-index", parseInt(pageToShow.css("z-index")) + 600);

            var pageToShow2 = $scope.theView.parent().find('#flipPage' + (pageNo - 2));
            pageToShow2.css('width', '0px');
            pageToShow2.css("z-index", parseInt(pageToShow2.css("z-index")) + 500);

            flipToRight(pageNo, bookPadding, 0, true);
        }
    }
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
        internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);
        expectedRelatives = jsonQuery.allValByKey(theInitWblDef, 'webble').length;
        tnpHolder = $scope.theView.parent().find("#tnpHolder");
        tnpTabs = $scope.theView.parent().find("#tnpTabs");
        tabsContent = $scope.theView.parent().find("#tabsContent");
        tnpTabs_a = $scope.theView.parent().find("#tnpTabs a");
        tnpPages = $scope.theView.parent().find(".bookPage");

        if(theInitWblDef.private){
          childContainersMemory = theInitWblDef.private.childContainers;
          childPosMemory = theInitWblDef.private.childPos;
        }

        // --- SLOTS ---

        $scope.addSlot(new Slot('tabDisplayStyle',
            0,
            'Tabs Display Style',
            'Whether each tab should be displayed as classic tabs or as pages in a book',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Classic Tabs', 'Book Pages']},
            undefined
        ));

        $scope.addSlot(new Slot('noOfTabs',
            3,
            'No of Tabs/Pages',
            'The number of tabs (or pages) to be generated',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('currentSelectedTab',
            0,
            'Current Tab/Page',
            'The current selected tab (or page)',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('tabNames',
            '',
            'Tab Names List',
            'The names of the existing tabs from left to right (separated by either comma[,], semicolon[;] or space [ ]. Left blank, generates names by the webble',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('closedTabBackgroundColor',
            '#E6D675',
            'Closed Tab Background Color',
            'The background color of a closed and non-activated tab',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('tabBkgColorList',
          '',
          'Tab Color List',
          'Unique background colors of the existing tabs from left to right (separated by either comma[,], semicolon[;] or space [ ]. Left blank, uses the default Closed Tab Background color instead',
          $scope.theWblMetadata['templateid'],
          {inputType: Enum.aopInputTypes.TextBox},
          undefined
        ));

        $scope.addSlot(new Slot('openTabBackgroundColor',
            '#f9ffd7',
            'Open Tab Background Color',
            'The background color of an open and activated tab',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('hoverTabBackgroundColor',
            '#ffffff',
            'Hover Tab Background Color',
            'The background color of a tab which the mouse pointer is hovering above',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('tabPadding',
            '10px 30px',
            'Tab Padding',
            'The surrounding padding of the tab name and its borders',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('tabTextColor',
            '#000000',
            'Tab Text Color',
            'The color of the tab name text',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('tabText_font-family',
            'Arial',
            'Tab Font Family',
            'The font family of the tab name text',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('tabTextFontSize',
            '15px',
            'Tab Font Size',
            'The font size of the tab name text',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('tabTextFontWeight',
            'normal',
            'Tab Font Weight',
            'The font weight of the tab name text',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('bookPadding',
            5,
            'Book Edge Padding',
            'The distance between the book cover edge and the boke page edge',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('bookBorderWidth',
            2,
            'Book Border Width',
            'The Border width of the Book cover',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('book:border-color',
            '#8B4513',
            'Book Border Color',
            'The Border color of the Book cover',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('book:background-color',
            '#A52A2A',
            'Book Background Color',
            'The Background color of the Book cover',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('bookBkgImage',
            '',
            'Book Cover Background Image',
            'The Background image of the Book cover',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ImagePick},
            undefined
        ));

        $scope.addSlot(new Slot('bookBinderEnabled',
            true,
            'Book Binder Enabled',
            'If checked an image of binding rings will be shown, otherwise not.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('pageBorderWidth',
            1,
            'Page Border Width',
            'The Border width of each page in the book',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('pageBorderColor',
            '#000000',
            'Page Border Color',
            'The Border color of each page in the book',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('pageBkgColor',
            '#ffffff',
            'Page Background Color',
            'The Background color of each page in the book',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('pageBkgImage',
            '',
            'Page Background Image',
            'The Background image of all Book pages',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ImagePick},
            undefined
        ));

		$scope.addSlot(new Slot('pageBkgImageStretchEnabled',
			false,
			'Page Background Image Stretch Enabled',
			'Default behavior is that a background image is displayed with its real size and if smaller than the surface repeats itself. But if checked the imnage does not repeat but instead stretch to fit the surface exactly',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));


        // --- WATCHES ---

        // listen to page type display style
        $scope.$watch(function(){return $scope.gimme('tabDisplayStyle');}, function(newVal, oldVal) {
          var whatStyle = parseInt(newVal);
          if(!isNaN(whatStyle)){
              configureTabs($scope.gimme('noOfTabs'));
          }
        }, true);

        // listen to number of tabs/pages
        $scope.$watch(function(){return $scope.gimme('noOfTabs');}, function(newVal, oldVal) {
            var noOfPages = parseInt(newVal);
            if(!isNaN(noOfPages)){
                configureTabs(noOfPages);
            }
        }, true);

        // listen to selected current tab
        $scope.$watch(function(){return $scope.gimme('currentSelectedTab');}, function(newVal, oldVal) {
              var currentPage = parseInt(newVal);
              if(!isInit && currentPage > 0){
                  if($scope.gimme('tabDisplayStyle') == 0){
                      if(tnpTabs_a && currentPage <= tnpTabs_a.length){
                          activateTabAndContent(newVal);
                      }
                      else{
                          if(tnpTabs_a && tnpTabs_a.length > 0){
                            $scope.set('currentSelectedTab', parseInt(tnpTabs.find('[class=tnpCurrent]').find('a').attr('name').replace('tab', '')));
                          }
                          else{
                            $scope.set('currentSelectedTab', 0);
                          }
                      }
                  }
                  else{
                      if(tnpPages && currentPage <= tnpPages.length){
                          $timeout(function(){activateTabAndContent($scope.gimme('currentSelectedTab'))});
                      }
                      else{
                        if(tnpPages && tnpPages.length > 0){
                            $scope.set('currentSelectedTab', parseInt(currentCCId.replace('flipPage', '')));
                        }
                        else{
                            $scope.set('currentSelectedTab', 0);
                        }
                      }
                  }
              }
        }, true);

        // listen to names of the tabs
        $scope.$watch(function(){return $scope.gimme('tabNames');}, function(newVal, oldVal) {
            if(!doNotBother){
                configureTabNames();
            }
            doNotBother = false;
        }, true);

        // listen to unique background colors of the tabs
        $scope.$watch(function(){return $scope.gimme('tabBkgColorList');}, function(newVal, oldVal) {
            if(!doNotBother){
                configureTabColors();
            }
            doNotBother = false;
        }, true);

        // listen to a set of decoration slots for tabs
        $scope.$watch(function(){return [$scope.gimme('closedTabBackgroundColor'), $scope.gimme('openTabBackgroundColor'), $scope.gimme('tabPadding'), $scope.gimme('tabTextColor'), $scope.gimme('tabText_font-family'), $scope.gimme('tabTextFontSize'), $scope.gimme('tabTextFontWeight')];}, function(newVal, oldVal) {
            if(!isInit && newVal[0] != undefined){
                if($scope.gimme('tabDisplayStyle') == 0){
                    configureTabs($scope.gimme('noOfTabs'));
                }
            }
        }, true);

        // listen to book proportions slots
        $scope.$watch(function(){return [$scope.gimme('bookPadding'), $scope.gimme('bookBorderWidth')];}, function(newVal, oldVal) {
            if(!isInit && newVal[0] != undefined){
                if($scope.gimme('tabDisplayStyle') == 1){
                    adjustBookProportions();
                }
            }
        }, true);

        // listen to page design slots
        $scope.$watch(function(){return [$scope.gimme('pageBorderWidth'), $scope.gimme('pageBorderColor'), $scope.gimme('pageBkgColor'), $scope.gimme('pageBkgImage'), $scope.gimme('pageBkgImageStretchEnabled')];}, function(newVal, oldVal) {
            if(!isInit && newVal[0] != undefined){
                if($scope.gimme('tabDisplayStyle') == 1){
                    tnpPages.each(function(index) {
                        $(this).css("border-width", parseInt($scope.gimme('pageBorderWidth')) + "px");
                        $(this).css("border-color", $scope.gimme('pageBorderColor'));
                        $(this).css("background-color", $scope.gimme('pageBkgColor'));
                        var pageBkgImage = $scope.gimme('pageBkgImage');
                        $(this).css("background-image", pageBkgImage != "" ? "url(" + pageBkgImage + ")" : "");
						if($scope.gimme('pageBkgImageStretchEnabled')){
							$(this).css("background-size", '100% 100%');
							$(this).css("background-repeat", 'no-repeat');
						}
						else{
							$(this).css("background-size", 'auto auto');
							$(this).css("background-repeat", 'repeat');
						}
                    });
                }
            }
        }, true);

        // listen to book design slots
        $scope.$watch(function(){return [$scope.gimme('bookBkgImage'), $scope.gimme('bookBinderEnabled')];}, function(newVal, oldVal) {
          if(!isInit && newVal[0] != undefined){
            if($scope.gimme('tabDisplayStyle') == 1){
                var bookBkgImage = $scope.gimme('bookBkgImage');
                $scope.theView.parent().find('#theBook').css("background-image", bookBkgImage != "" ? "url(" + bookBkgImage + ")" : "");
                $scope.theView.parent().find('#theBinder').css("display", $scope.gimme('bookBinderEnabled') == true ? "initial" : "none");
            }
          }
        }, true);

      // Make sure the Surrounding Holder has the proper height depending on the height of the content area
        $scope.$watch(function(){return $scope.gimme('tabsContent:height');}, function(newVal, oldVal) {
            h = newVal.search('%') != -1 ? (parseInt(newVal)/ 100) * $(window).height() : parseInt(newVal);
            if(!isNaN(h)){
                setTNPHolderHeight(h);
                var p1 = parseInt(tnpHolder.css('padding-top')) * 2;
                var p2 = 0;
                if(tnpTabs_a && tnpTabs_a.length > 0){
                    p2 = (parseInt(tnpTabs_a.css('padding-top')) * 2) + parseInt(tnpTabs_a.css('line-height'));
                }
                tnpHolder.css('height', (h + p1 + p2) + 'px');

                //Book related
                if($scope.gimme('tabDisplayStyle') == 1){
                    adjustBookProportions();
                }
            }
        }, true);

      // Make sure the Surrounding Holder has the proper width depending on the width of the content area
        $scope.$watch(function(){return $scope.gimme('tabsContent:width');}, function(newVal, oldVal) {
          var w = newVal.search('%') != -1 ? (parseInt(newVal)/ 100) * $(window).width() : parseInt(newVal);
          if(!isNaN(w)){
            var p = parseInt(tnpHolder.css('padding-left')) * 2;
            tnpHolder.css('width', (w + p) + 'px');

            //Book related
            if($scope.gimme('tabDisplayStyle') == 1){
                adjustBookProportions();
            }
          }
        }, true);

        // Remember which child goes in what container
        $scope.$watch(function(){return $scope.wblEventInfo.gotChild;}, function(newVal, oldVal) {
            if(!isInit && newVal != null && !isNaN(newVal) && !childContainers[newVal]){
                if(parseInt($scope.gimme('noOfTabs')) > 0){
                    childContainers[newVal] = $scope.getChildContainer().attr('id');
                }
            }
        }, true);

        // Remove this child's container Memory
        $scope.$watch(function(){return $scope.wblEventInfo.lostChild;}, function(newVal, oldVal) {
          if(newVal != null && !isNaN(newVal)){
              delete childContainers[newVal];

              if($scope.gimme('noOfTabs') == 0 && isEmpty(childContainers) && (tnpTabs_a.length > 0 || tnpPages.length > 0)){
                  configureTabs(0);
                  $scope.showQIM('Since there are no tab folders to hold any child Webbles, they have all been peeled and are now orphans', 4000);
              }
          }
        }, true);

        // Keeping track of children wandering outside visible area an put them back in
        $scope.$watch(function(){return $scope.eventInfo.slotChanged;}, function(newVal, oldVal) {
          if(newVal != null && newVal.instanceid && childContainers[newVal.instanceid] && $($scope.getChildContainer()).attr('id') != 'wblChildContainer'){
              if(newVal.slotname == 'root:left' || newVal.slotname == 'root:top'){
                  if(newVal.slotname == 'root:left'){
                      if(parseInt(newVal.slotvalue) < 0){
                          if($scope.gimme('tabDisplayStyle') == 0){
                              $scope.getWebbleByInstanceId(newVal.instanceid).scope().set('root:left', 0);
                          }
                          else{
                            $scope.getWebbleByInstanceId(newVal.instanceid).scope().set('root:left', 0);
                          }
                      }
                      else{
                          if($scope.gimme('tabDisplayStyle') == 0){
                              var tcWidth = $scope.gimme('tabsContent:width');
                              tcWidth = tcWidth.search('%') != -1 ? (parseInt(tcWidth)/ 100) * $(window).width() : parseInt(tcWidth);
                              if(parseInt(newVal.slotvalue) > (tcWidth - 20)){
                                  var thisWbl = $scope.getWebbleByInstanceId(newVal.instanceid);
                                  thisWbl.scope().set('root:left', tcWidth - 30);
                              }
                          }
                          else{
                              if(parseInt(newVal.slotvalue) > (pageWidth - 20)){
                                  var thisWbl = $scope.getWebbleByInstanceId(newVal.instanceid);
                                  thisWbl.scope().set('root:left', pageWidth - 30);
                              }
                          }
                      }
                  }
                  else if(newVal.slotname == 'root:top'){
                      if(parseInt(newVal.slotvalue) < 0){
                          if($scope.gimme('tabDisplayStyle') == 0){
                              $scope.getWebbleByInstanceId(newVal.instanceid).scope().set('root:top', 0);
                          }
                          else{
                              $scope.getWebbleByInstanceId(newVal.instanceid).scope().set('root:top', 0);
                          }
                      }
                      else{
                          if($scope.gimme('tabDisplayStyle') == 0){
                              var tcHeight = $scope.gimme('tabsContent:height');
                              tcHeight = tcHeight.search('%') != -1 ? (parseInt(tcHeight)/ 100) * $(window).height() : parseInt(tcHeight);
                              if(parseInt(newVal.slotvalue) > (tcHeight - 20)){
                                  var thisWbl = $scope.getWebbleByInstanceId(newVal.instanceid);
                                  thisWbl.scope().set('root:top', tcHeight - 30);
                              }
                          }
                          else{
                              if(parseInt(newVal.slotvalue) > (pageHeight - 20)){
                                var thisWbl = $scope.getWebbleByInstanceId(newVal.instanceid);
                                thisWbl.scope().set('root:top', pageHeight - 30);
                              }
                          }
                      }
                  }
              }
          }
        }, true);

        // Finalize the initiation
        finalInitiation();
    };
    //===================================================================================


    //===================================================================================
    // Configure Tabs
    // This method adds or removes tabs to the Webble according to the number of tabs
    // requested
    //===================================================================================
    var configureTabs = function(noOfTabs){
        if(noOfTabs == 0 && $scope.getChildren().length > 0){
            cutOffAllChildren();
        }
        else{
            // IF TABS
            if($scope.gimme('tabDisplayStyle') == 0){
                var theBook = $scope.theView.parent().find('#theBook');
                if(theBook.length > 0){
                    theBook.hide();
                }

                var currentNoOfTabs = tnpTabs_a != undefined ? tnpTabs_a.length : 0;
                var tabsToMake = noOfTabs;
                var tabNameIndex = 1;

                //Clear away all tabs to prepare to make new ones
                if(tnpTabs_a != undefined){
                  tnpTabs_a.unbind("click");
                  tnpTabs_a.unbind("mouseenter mouseleave");
                  tnpTabs.find("li").attr("class",""); //Reset class's
                  tnpTabs.find("li").remove();
                }

                while(tabsToMake > 0){
                  var newTabName = 'tab' + tabNameIndex;
                  var newTab = $("<li>").append($("<a>", {href: "#", name: newTabName, style: "padding: " + $scope.gimme('tabPadding') + "; color: " + $scope.gimme('tabTextColor') + "; font-family: " + $scope.gimme('tabText_font-family') + "; font-size: " + $scope.gimme('tabTextFontSize') + (!isNaN($scope.gimme('tabTextFontSize')) ? "px" : "") + "; font-weight: " + $scope.gimme('tabTextFontWeight') + ";"}).append(newTabName));
                  newTab.css('background-color', $scope.gimme('closedTabBackgroundColor'));//+
                  tnpTabs.append(newTab);
                  if(tabsContent.find("[id='" + newTabName + "']").length == 0){
                    var newTabContentArea = $("<div>", {id: newTabName});
                    tabsContent.append(newTabContentArea);
                  }
                  tabNameIndex++;
                  tabsToMake--;
                }

                if(currentNoOfTabs > noOfTabs){
                    var loseAllChildren = false;
                    for(var c in childContainers){
                      var tabIndex = parseInt(childContainers[c].replace('tab', ''));
                      if(tabIndex > noOfTabs){
                        if(noOfTabs > 0){
                          $scope.theView.parent().find('#tab1').append($scope.getWebbleByInstanceId(c).scope().theView.parent());
                          childContainers[c] = 'tab1';
                        }
                      }
                    }

                    var allContentAreas = tabsContent.find("[id^='tab']");
                    for(var i = (currentNoOfTabs - 1); i > (noOfTabs - 1); i--){
                      $(allContentAreas[i]).remove();
                    }
                }

                if(noOfTabs == 0){
                    if(!isInit){
                      $scope.setChildContainer(undefined);
                    }
                    tnpTabs_a = undefined;
                    $scope.set('currentSelectedTab', 0);
                }
                else{
                    tnpTabs_a = $scope.theView.parent().find("#tnpTabs a");
                    tnpTabs_a.append($("<span>", {class: 'tnpTabsAfterA'}).css('background-color', $scope.gimme('closedTabBackgroundColor')));
                    tnpTabs_a.click(tabClick);
                    tnpTabs_a.hover(tabIn, tabOut);
                    $scope.theView.parent().draggable('option', 'cancel', '#tnpTabs li');
                    configureTabNames();
                    configureTabColors();
                    setTNPHolderHeight($scope.gimme('tabsContent:height').search('%') != -1 ? (parseInt($scope.gimme('tabsContent:height'))/ 100) * $(window).height() : parseInt($scope.gimme('tabsContent:height')));
                    var cst = parseInt($scope.gimme('currentSelectedTab'));
                    if(cst > 0 && cst <= tnpTabs_a.length){ activateTabAndContent(cst); }
                    else{ $scope.set('currentSelectedTab', 1); }

                    if(theBook.length > 0){
                        for(var c in childContainers){
                            var tabIndex = parseInt(childContainers[c].replace('flipPage', ''));
                            childContainers[c] = 'tab' + tabIndex;
                            var containerName = "#tab" + tabIndex;
                            $scope.theView.parent().find(containerName).append($scope.getWebbleByInstanceId(c).scope().theView.parent());
                        }
                        theBook.remove();
                    }
                }
            }
            // IF BOOK
            else if($scope.gimme('tabDisplayStyle') == 1){
                if(tnpTabs_a != undefined && tnpTabs_a.length > 0){
                    $scope.theView.parent().find('#classicTabsContainer').hide();
                }

                var currentNoOfPages = tnpPages != undefined ? tnpPages.length : 0;
                var pagesToMake = noOfTabs;
                bookWidth = $scope.gimme('tabsContent:width');
                bookWidth = bookWidth.search('%') != -1 ? (parseInt(bookWidth)/ 100) * $(window).width() : parseInt(bookWidth);
                bookHeight = $scope.gimme('tabsContent:height');
                bookHeight = bookHeight.search('%') != -1 ? (parseInt(bookHeight)/ 100) * $(window).height() : parseInt(bookHeight);
                bookPadding = parseInt($scope.gimme('bookPadding'));
                bookBorderWidth = parseInt($scope.gimme('bookBorderWidth'));
                var bookBorderColor = $scope.gimme('book:border-color');
                var bookBkgColor = $scope.gimme('book:background-color');
                var bookBkgImage = $scope.gimme('bookBkgImage');
                var bookBinderEnabled = $scope.gimme('bookBinderEnabled');
                binderWidth = bookWidth * binderWidthMultiplier;
                pageBorderWidth = parseInt($scope.gimme('pageBorderWidth'));
                var pageBorderColor = $scope.gimme('pageBorderColor');
                var pageBkgColor = $scope.gimme('pageBkgColor');
                var pageBkgImage = $scope.gimme('pageBkgImage');
                pageMargin = bookPadding + bookBorderWidth;
                pageWidth = (bookWidth / 2) - (pageMargin);
                pageHeight = bookHeight - ((pageMargin * 2));

                var theBook = $scope.theView.parent().find('#theBook');
                if(theBook.length == 0 && noOfTabs > 0){
                    theBook = $("<div />", {id: "theBook", class: "bookCover"});
                    theBook.css("width", bookWidth + "px");
                    theBook.css("height", bookHeight + "px");
                    theBook.css("border", bookBorderWidth + "px solid " + bookBorderColor);
                    theBook.css("background-color", bookBkgColor);
                    $scope.getSlot('book:border-color').setElementPntr(theBook);
                    $scope.getSlot('book:background-color').setElementPntr(theBook);
                    theBook.css("background-image", bookBkgImage != "" ? "url(" + bookBkgImage + ")" : "");
                    $scope.theView.parent().find('#bookPagesContainer').append(theBook);

                    var theBinder = $("<div />", {id: "theBinder", class: "bookBinder"});
                    theBinder.css("height", pageHeight + "px");
                    theBinder.css("width", binderWidth + "px");
                    theBinder.css("top", (pageMargin) + "px");
                    theBinder.css("left", ((bookWidth / 2) - (binderWidth / 2)) + "px");
                    theBinder.css("background-image", "url("+ internalFilesPath + "/images/parchmentRings.gif)");
                    theBinder.css("display", bookBinderEnabled == true ? "initial" : "none");
                    theBook.append(theBinder);
                }

                for(var i = 1; i <= pagesToMake; i++){
                    var thePage = $scope.theView.parent().find('#flipPage' + i);
                    if(thePage.length != 1){
                        thePage = $("<div />", {id: "flipPage" + i, class: "bookPage"});
                        thePage.css("left", (pageWidth + bookPadding) + "px");
                        thePage.css("top", bookPadding + "px");
                        thePage.css("width", pageWidth + "px");
                        thePage.css("height", pageHeight + "px");
                        thePage.css("border", pageBorderWidth + "px solid " + pageBorderColor);
                        thePage.css("background-color", pageBkgColor);
						if($scope.gimme('pageBkgImageStretchEnabled')){
							thePage.css("background-size", '100% 100%');
							thePage.css("background-repeat", 'no-repeat');
						}
                        thePage.css("background-image", pageBkgImage != "" ? "url(" + pageBkgImage + ")" : "");
                        theBook.append(thePage);

                        var myPngDiv;
                        if(isPageOdd(i)){
                            myPngDiv = $("<div />", {name: "pageShadow", class: "oddPageShadow"});
                        }
                        else{
                            myPngDiv = $("<div />", {name: "pageShadow", class: "evenPageShadow"});
                        }
                        myPngDiv.css("width", (pageWidth * 0.1) + "px");
                        myPngDiv.css("height", pageHeight + "px");
                        thePage.append(myPngDiv);

                        thePage.click(pageClick);
                        thePage.mouseover(setPageTargetAtMouseOver);
                    }
                    thePage.css("z-index", pagesToMake - i);
                }

                if(pagesToMake < currentNoOfPages){
                    var loseAllChildren = false;
                    for(var c in childContainers){
                        var pageIndex = parseInt(childContainers[c].replace('flipPage', ''));
                        if(pageIndex > pagesToMake){
                            if(pagesToMake > 0){
                                $scope.theView.parent().find('#flipPage1').append($scope.getWebbleByInstanceId(c).scope().theView.parent());
                                childContainers[c] = 'flipPage1';
                            }
                        }
                    }

                    theBook.find("[id^='flipPage']").each(function(index) {
                        var pageNo = parseInt($(this).attr('id').replace('flipPage', ''));

                        if(pageNo > pagesToMake){
                            $(this).remove();
                        }
                    });
                }

                tnpPages = $scope.theView.parent().find(".bookPage");
                $scope.theView.parent().draggable('option', 'cancel', '.bookPage');

                if(pagesToMake == 0){
                    if(!isInit){
                        $scope.setChildContainer(undefined);
                    }
                    tnpPages = undefined;
                    $scope.set('currentSelectedTab', 0);

                    if(theBook.length > 0){
                        theBook.remove();
                        $scope.getSlot('book:border-color').setElementPntr(undefined);
                        $scope.getSlot('book:background-color').setElementPntr(undefined);
                    }
                }
                if(theBook.length > 0 && pagesToMake > 0){
                    currentCCId = "flipPage1";
                    adjustBookProportions();
                    if(!isInit){
                        var cst = parseInt($scope.gimme('currentSelectedTab'));
                        if(cst > 0 && cst <= tnpPages.length){ $timeout(function(){activateTabAndContent($scope.gimme('currentSelectedTab'))}); }
                        else{ $scope.set('currentSelectedTab', 1); }
                    }
                }

                if(tnpTabs_a != undefined && tnpTabs_a.length > 0){
                    tnpTabs_a.unbind("click");
                    tnpTabs_a.unbind("mouseenter mouseleave");
                    tnpTabs.find("li").attr("class",""); //Reset class's
                    tnpTabs.find("li").remove();
                    tnpTabs_a = undefined;

                    for(var c in childContainers){
                        var tabIndex = parseInt(childContainers[c].replace('tab', ''));
                        childContainers[c] = 'flipPage' + tabIndex;
                        var containerName = "#flipPage" + tabIndex;
                        $scope.theView.parent().find(containerName).append($scope.getWebbleByInstanceId(c).scope().theView.parent());
                    }

                    tabsContent.find("[id^='tab']").each(function(index) {
                        $(this).remove();
                    });

                    $scope.theView.parent().find('#classicTabsContainer').show();
                }

                var currUnit = $scope.gimme('tabsContent:height').search('%') != -1 ? '%' : 'px';
                $scope.set('tabsContent:height', (parseFloat($scope.gimme('tabsContent:height'))+0.001) + currUnit);
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // Adjust Book Proportions
    // When something change style wise that effects the whole book layout, make sure the
    // change is made correctly all over
    //===================================================================================
    var adjustBookProportions = function() {
        bookWidth = $scope.gimme('tabsContent:width');
        bookWidth = bookWidth.search('%') != -1 ? (parseInt(bookWidth)/ 100) * $(window).width() : parseInt(bookWidth);
        bookHeight = $scope.gimme('tabsContent:height');
        bookHeight = bookHeight.search('%') != -1 ? (parseInt(bookHeight)/ 100) * $(window).height() : parseInt(bookHeight);
        bookPadding = parseInt($scope.gimme('bookPadding'));
        bookBorderWidth = parseInt($scope.gimme('bookBorderWidth'));
        binderWidth = bookWidth * binderWidthMultiplier;
        pageMargin = bookPadding + bookBorderWidth;
        pageWidth = (bookWidth / 2) - pageMargin;
        pageHeight = bookHeight - ((pageMargin * 2));

        var theBook = $scope.theView.parent().find('#theBook');
        theBook.css("width", bookWidth + "px");
        theBook.css("height", bookHeight + "px");
        theBook.css("border-width", bookBorderWidth + "px");

        var theBinder = $scope.theView.parent().find('#theBinder');
        theBinder.css("height", pageHeight + "px");
        theBinder.css("width", binderWidth + "px");
        theBinder.css("top", (bookPadding) + "px");
        theBinder.css("left", ((bookWidth / 2) - bookBorderWidth - (binderWidth / 2)) + "px");

        tnpPages.each(function(index) {
            $(this).css("width", pageWidth + "px");
            $(this).css("height", pageHeight + "px");
            $(this).css("left", (pageWidth + bookPadding) + "px");
            $(this).css("top", bookPadding + "px");
            $(this).css("z-index", tnpPages.length - index);
            var pageShadow = $(this).find('[name=pageShadow]');
            pageShadow.css("width", (pageWidth * 0.1) + "px");
            pageShadow.css("height", pageHeight + "px");
        });

        tnpHolder.css('height', (bookHeight + (parseInt(tnpHolder.css('padding')) * 2)) + 'px');
        tnpHolder.css('width', (bookWidth + (parseInt(tnpHolder.css('padding')) * 2)) + 'px');
    }
    //===================================================================================


    //===================================================================================
    // Is Page Even
    // Returns true if page number is odd, false if it is even
    //===================================================================================
    var isPageOdd = function(pageNo) {
        return ( pageNo%2 )
    }
    //===================================================================================


    //===================================================================================
    // Configure Tab Names
    // This method make sure the tab names are properly set.
    //===================================================================================
    var configureTabNames = function(){
        if($scope.gimme('tabDisplayStyle') == 0){
            if(!tnpTabs_a){ return; }

            var nameList = [];
            var nameListString = $scope.gimme('tabNames');
            var separator = ','
            if(nameListString.search(';') != -1){
              nameList = nameListString.split(';');
              separator = ';';
            }
            else if(nameListString.search(',') != -1){
              nameList = nameListString.split(',');
              separator = ',';
            }
            else if(nameListString.search(' ') != -1){
              nameList = nameListString.split(' ');
              separator = ' ';
            }
            else if(nameListString.length > 0){
              nameList.push(nameListString);
            }
            else{
              for(var i = 0; i < tnpTabs_a.length; i++){
                nameList.push('tab' + (i + 1));
              }
            }

            for(var i = 0; i < tnpTabs_a.length; i++){
              if(nameList[i]){
                $(tnpTabs_a[i])[0].firstChild.nodeValue = nameList[i];
              }
              else{
                nameList.push($(tnpTabs_a[i])[0].firstChild.nodeValue);
              }
            }

            var newNameListStr = ''
            for(var i = 0; i < nameList.length; i++){
              if(newNameListStr != ''){
                newNameListStr += separator;
              }
              newNameListStr += nameList[i];
            }

            if(nameListString != newNameListStr){
              doNotBother = true;
              $scope.set('tabNames', newNameListStr);
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // Configure Tab Names
    // This method make sure the tab names are properly set.
    //===================================================================================
    var configureTabColors = function(){
        if($scope.gimme('tabDisplayStyle') == 0) {
            if (!tnpTabs_a) {
                return;
            }

            colorList = [];
            var colorListString = $scope.gimme('tabBkgColorList');
            var separator = ','
            if (colorListString.search(';') != -1) {
                colorList = colorListString.split(';');
                separator = ';';
            }
            else if (colorListString.search(',') != -1) {
                colorList = colorListString.split(',');
                separator = ',';
            }
            else if (colorListString.search(' ') != -1) {
                colorList = colorListString.split(' ');
                separator = ' ';
            }
            else if (colorListString.length > 0) {
                colorList.push(colorListString);
            }

          parseInt($scope.gimme('currentSelectedTab'));

            for (var i = 0; i < tnpTabs_a.length; i++) {
                if (colorList[i] && i != (parseInt($scope.gimme('currentSelectedTab')) - 1)) {
                    $(tnpTabs_a[i]).css('background-color', colorList[i]);
                    $(tnpTabs_a[i]).find('.tnpTabsAfterA').css('background-color', colorList[i]);
                }
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // Final Initiation
    // This method finish up the initiation of the Webble
    //===================================================================================
    var finalInitiation = function(){
        // If this wbl will get children then Set up a watch for when all children are connected

        soundManager.setup({
          url: internalFilesPath + '/sounds/',
          debugMode: false,
          onready: function() {
              flipSound = soundManager.createSound({
                  id: 'flipPageSound',
                  url: internalFilesPath + '/sounds/page-flip-02.mp3'
              });
          },
          ontimeout: function() {
            $log.log("SoundManager2 could not initiate properly");
          }
        });

        if(expectedRelatives > 0){
            childWaitingWatch = $scope.$watch(function(){return ($scope.getAllDescendants($scope.theView).length - 1);}, function(newVal, oldVal) {
                if(newVal == expectedRelatives){
                    childWaitingWatch();
                    var newCC = {};
                    for(var c in childContainersMemory){
                      for(var n = 0, d; d = $scope.getAllDescendants($scope.theView)[n]; n++){
                        if(d.scope().theWblMetadata['instanceid'] == c){
                          newCC[d.scope().getInstanceId()] = childContainersMemory[c];
                        }
                      }
                    }

                    for(var c in newCC){
                        var thisWbl = $scope.getWebbleByInstanceId(c).scope();
                        $scope.theView.parent().find('#' + newCC[thisWbl.getInstanceId()]).append(thisWbl.theView.parent());
                        thisWbl.set('root:left', childPosMemory[thisWbl.theWblMetadata['instanceid']].x);
                        thisWbl.set('root:top', childPosMemory[thisWbl.theWblMetadata['instanceid']].y);
                    }
                    childContainers = newCC;
                    isInit = false;

                    var cst = parseInt($scope.gimme('currentSelectedTab'));
                    if(cst > 0 && cst <= tnpPages.length){ $timeout(function(){activateTabAndContent($scope.gimme('currentSelectedTab'))}); }
                    else{ $scope.set('currentSelectedTab', 1); }
                }
            }, true);
        }
        else {
            isInit = false;
        }
    };
    //===================================================================================


    //===================================================================================
    // Set TNPHolder Height
    // This method sets the tnpHolder element to its proper height
    //===================================================================================
    var setTNPHolderHeight = function(whatContentHeight){
        var p1 = parseInt(tnpHolder.css('padding')) * 2;
        var p2 = 0;
        if(tnpTabs_a && tnpTabs_a.length > 0){
            p2 = (parseInt(tnpTabs_a.css('padding-top')) * 2) + parseInt(tnpTabs_a.css('line-height'));
        }
        tnpHolder.css('height', (whatContentHeight + p1 + p2) + 'px');
    };
    //===================================================================================


    //===================================================================================
    // Activate Tab And Content
    // Make the correct tab and content page activated
    //===================================================================================
    var activateTabAndContent = function(requestedTab){
        if($scope.gimme('tabDisplayStyle') == 0){
            if(!isNaN(parseInt(requestedTab))){
              requestedTab = tnpTabs.find('[name=' + 'tab' + requestedTab + ']');
            }
            var tabIndex = parseInt(requestedTab.attr('name').replace('tab', ''));
            tabsContent.find("[id^='tab']").hide(); // Hide all content
            tnpTabs.find("li").attr("class",""); //Reset class's
            tnpTabs.find("li").find('.tnpTabsAfterA').removeClass("tnpCurrentAfterA"); //Remove class
            tnpTabs_a.css('background-color',  $scope.gimme('closedTabBackgroundColor')); //Return to base color
            tnpTabs_a.find('.tnpTabsAfterA').css('background-color',  $scope.gimme('closedTabBackgroundColor')); //Return to base color
            for (var i = 0; i < tnpTabs_a.length; i++) {
                if (colorList[i]) {
                    $(tnpTabs_a[i]).css('background-color', colorList[i]);
                    $(tnpTabs_a[i]).find('.tnpTabsAfterA').css('background-color', colorList[i]);
                }
            }
            requestedTab.parent().attr("class","tnpCurrent"); // Activate this
            requestedTab.css("background-color", $scope.gimme('openTabBackgroundColor')); // Set active color
            requestedTab.find('.tnpTabsAfterA').addClass("tnpCurrentAfterA").css("background-color", $scope.gimme('openTabBackgroundColor')); // Activate this
            tabsContent.find('#' + requestedTab.attr('name')).show(); // Show content for the current tab
            $scope.setChildContainer(tabsContent.find('#' + requestedTab.attr('name')));
            $scope.set('currentSelectedTab', tabIndex);
        }
        else if($scope.gimme('tabDisplayStyle') == 1){
            var openPageIndex = currentCCId != undefined ? parseInt(currentCCId.replace('flipPage', '')) : 0;
            if(openPageIndex > 0){
                if(!isPageOdd(openPageIndex)){openPageIndex += 1}
            }

            if(requestedTab != openPageIndex && requestedTab != (openPageIndex - 1)){
                var noOfFlips = ((requestedTab - openPageIndex) + (Math.abs((requestedTab - openPageIndex))%2)) / 2;

                if(noOfFlips > 0){
                    for(var i = 0; i < noOfFlips; i++){
                        var pageToHide = $scope.theView.parent().find('#flipPage' + openPageIndex);
                        var pageToShow = $scope.theView.parent().find('#flipPage' + (openPageIndex + 1));
                        var currentNoOfPages = tnpPages != undefined ? tnpPages.length : 0;
                        pageToShow.css("left", bookPadding + 'px');
                        pageToShow.css("z-index", currentNoOfPages - (parseInt(pageToShow.css("z-index")) - 1));
                        pageToHide.css("z-index", currentNoOfPages - (parseInt(pageToHide.css("z-index")) - 1));
                        pageToHide.css("left", bookPadding + 'px');
                        pageToHide.css("width", pageWidth+'px');
                        openPageIndex += 2;
                    }
                }
                else{
                  openPageIndex -= 1;
                  for(var i = 0; i < Math.abs(noOfFlips); i++){
                        var pageToHide = $scope.theView.parent().find('#flipPage' + (openPageIndex));
                        var pageToShow = $scope.theView.parent().find('#flipPage' + (openPageIndex - 1));
                        var pageToShow2 = $scope.theView.parent().find('#flipPage' + (openPageIndex - 2));
                        var currentNoOfPages = tnpPages != undefined ? tnpPages.length : 0;
                        pageToShow.css("left", (pageWidth + bookPadding) + 'px');
                        pageToShow.css("z-index", currentNoOfPages - (parseInt(pageToShow.css("z-index")) - 1));
                        pageToShow2.css("width", pageWidth+'px');
                        pageToHide.css("z-index", currentNoOfPages - (parseInt(pageToHide.css("z-index")) - 1));
                        pageToHide.css("left", (pageWidth + bookPadding) + 'px');
                        pageToHide.css("width", pageWidth+'px');
                        openPageIndex -= 2;
                    }
                }

                $scope.setChildContainer($scope.theView.parent().find('#flipPage' + requestedTab));
                currentCCId = 'flipPage' + requestedTab;
            }
        }
    }
    //===================================================================================


    //===================================================================================
    // Cut Off All Children
    // Make all children into orphans
    //===================================================================================
    var cutOffAllChildren = function(){
        for(var c in childContainers){
            var thisWbl = $scope.getWebbleByInstanceId(c);
            thisWbl.scope().peel();
        }
    }
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
      var childPos = {};
      for(var c in childContainers){
        var thisWbl = $scope.getWebbleByInstanceId(c).scope();
        var wblPos = {x: thisWbl.gimme('root:left'), y: thisWbl.gimme('root:top')};
        childPos[c] = wblPos;
      }

        var customWblDefPart = {
            childContainers: childContainers,
            childPos: childPos
        };

        return customWblDefPart;
    };
    //===================================================================================


    //===================================================================================
    // Should It Show
    // Checks if the content element should be visible or not and return the answer
    //===================================================================================
    $scope.shouldItShow = function(whatElemAsking){
      if(whatElemAsking == $scope.whatElementIsAsking.tabsContent){
          return ($scope.gimme('noOfTabs') > 0);
      }
      else if(whatElemAsking == $scope.whatElementIsAsking.classicTabsContainer){
          return ($scope.gimme('tabDisplayStyle') == 0);
      }
      else if(whatElemAsking == $scope.whatElementIsAsking.bookPagesContainer){
          return ($scope.gimme('tabDisplayStyle') == 1);
      }
      else{
          return false;
      }
    };
    //===================================================================================

var sindex = 0;
    //===================================================================================
    // Flip To Left
    // Make the clicked page move from left side to right side in a visually pleasing
    // matter.
    //===================================================================================
    var flipToLeft = function(pageNo, pLeftPos, pWidth, playSound){
		var pageToHide = $scope.theView.parent().find('#flipPage' + pageNo);
		var pageToShow = $scope.theView.parent().find('#flipPage' + (pageNo + 1));

		if(pageToShow.length == 0){
		  isMoving = false;
		  return;
		}

		if(flipSound && playSound){flipSound.play();}

		if(pLeftPos <= bookPadding){
            isMoving = false;
            var currentNoOfPages = tnpPages != undefined ? tnpPages.length : 0;

            pageToShow.css("left", (bookPadding) + 'px');
            pageToShow.css("z-index", currentNoOfPages - (parseInt(pageToShow.css("z-index")) - 601));
            pageToShow.css("width", (pageWidth) + 'px');

            pageToHide.css("z-index", currentNoOfPages - (parseInt(pageToHide.css("z-index")) - 1));
            pageToHide.css("left", (bookPadding) + 'px');
            pageToHide.css("width", (pageWidth) + 'px');

            $scope.setChildContainer(pageToShow);
            currentCCId = 'flipPage' + (pageNo + 1);
            $scope.set('currentSelectedTab', parseInt(currentCCId.replace('flipPage', '')));

            return;
		}

		flipLengthPerCall = pageWidth / 40;
		var currLeft = pLeftPos - (flipLengthPerCall * 2);
		var currWidth = pWidth + flipLengthPerCall;
		var hideWidth = pageWidth - currWidth;

		pageToShow.css("left", currLeft+'px');
		pageToShow.css("width", currWidth+'px');

		pageToHide.css("width", hideWidth+'px');

		$timeout(function(){flipToLeft(pageNo, currLeft, currWidth);}, flipSpeed, false);
    };
    //===================================================================================


    //===================================================================================
    // Flip To Right
    // Make the clicked page move from right side to left side in a visually pleasing
    // matter.
    //===================================================================================
    var flipToRight = function(pageNo, pLeftPos, pWidth, playSound){
        var pageToHide = $scope.theView.parent().find('#flipPage' + pageNo);
        var pageToShow = $scope.theView.parent().find('#flipPage' + (pageNo - 1));
        var pageToShow2 = $scope.theView.parent().find('#flipPage' + (pageNo - 2));

        if(pageToShow.length == 0){
            isMoving = false;
            return;
        }

        if(flipSound && playSound){flipSound.play();}

        if(pLeftPos >= (pageWidth + bookPadding)){
            isMoving = false;
            var currentNoOfPages = tnpPages != undefined ? tnpPages.length : 0;

            pageToShow.css("left", (pageWidth + bookPadding) + 'px');
            pageToShow.css("z-index", currentNoOfPages - (parseInt(pageToShow.css("z-index")) - 601));
            pageToShow.css("width", (pageWidth) + 'px');

            pageToShow2.css("z-index", (parseInt(pageToShow2.css("z-index")) - 500));
            pageToShow2.css("width", pageWidth+'px');

            pageToHide.css("z-index", currentNoOfPages - (parseInt(pageToHide.css("z-index")) - 1));
            pageToHide.css("left", (pageWidth + bookPadding) + 'px');
            pageToHide.css("width", pageWidth+'px');

            $scope.setChildContainer(pageToShow);
            currentCCId = 'flipPage' + (pageNo - 1);
            $scope.set('currentSelectedTab', parseInt(currentCCId.replace('flipPage', '')));

            return;
        }

		flipLengthPerCall = pageWidth / 40;
        var currLeft = pLeftPos + (flipLengthPerCall);
        var currWidth = pWidth + (flipLengthPerCall);
        var hideWidth = pageWidth - currWidth;

        pageToShow.css("left", currLeft+'px');
        pageToShow.css("width", currWidth+'px');

        if(pageToShow2.length == 1){
            pageToShow2.css("width", currWidth+'px');
        }
        else{
            pageToHide.css("width", hideWidth+'px');
            pageToHide.css("left", currLeft+'px');
        }

        $timeout(function(){flipToRight(pageNo, currLeft, currWidth);}, flipSpeed, false);
    };
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

}
//=======================================================================================

//======================================================================================================================
