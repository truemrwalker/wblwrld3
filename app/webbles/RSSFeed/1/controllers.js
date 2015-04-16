//======================================================================================================================
// Controllers for RSS Feed Webble for Webble World v3.0 (2013)
// Created By: TrueMrWalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
function rssFeedCtrl($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
      rssContainer: ['background-color', 'border', 'border-radius', 'padding'],
      rssFeed: ['font-family', 'font-size', 'font-weight', 'color']
    };

    $scope.formProps = {
          thePickableItemList: [],
          listSelectionIndex: 0
      };

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

        $scope.addSlot(new Slot('rssURL',
            'http://rss.cnn.com/rss/edition.rss',
            'RSS URL',
            'This is the URL to the RSS feed accessed',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('feedList',
          [],
          'Feed List',
          'This is the List of items returned from the RSS feed URL',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));
        $scope.getSlot('feedList').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectItemsByTag',
            'title',
            'Select By',
            'This is the tag to use when creating a list to select items by.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('selectListHeight',
          10,
          'List Height',
          'The height of the displayed list of selectable items.',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));

        $scope.addSlot(new Slot('noOfItems',
            4,
            'No of RSS Items',
            'The amount of items which the returned RSS feed contains.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('selectedItemIndex',
            -1,
            'Selected Index',
            'The index value for the selected item in the RSS feed.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('selectedItemObject',
          '',
          'Item Object',
          'The full data object for the item found by index.',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));
        $scope.getSlot('selectedItemObject').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemAuthor',
            '',
            'Author',
            'The author of the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemAuthor').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemCategories',
            [],
            'Categories',
            'The category key words of the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemCategories').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemPubDate',
            new Date(),
            'Published Date',
            'The publishing date of the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemPubDate').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemTitle',
            '',
            'Title',
            'The title of the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemTitle').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemLink',
            '',
            'Link',
            'The link for the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemLink').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemContentSnippet',
            '',
            'Content Snippet',
            'The Content snippet of the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemContentSnippet').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemContent',
          '',
          'Content',
          'The Full Content of the selected item found by index.',
          $scope.theWblMetadata['templateid'],
          undefined,
          undefined
        ));
        $scope.getSlot('selectedItemContent').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('selectedItemImage',
            '../../images/notFound.png',
            'Image',
            'Image or Thumbnail possibly accompanying the selected item found by index.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('selectedItemImage').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);


        $scope.setDefaultSlot('rssURL');


        $scope.$watch(function(){return $scope.gimme('rssURL');}, function(newVal, oldVal) {
              if(newVal != ''){
                 google.load('feeds', '1', {'callback':rssCall});
              }
        }, true);

        $scope.$watch(function(){return $scope.gimme('noOfItems');}, function(newVal, oldVal) {
            if(!isNaN(newVal)){
                google.load('feeds', '1', {'callback':rssCall});
            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('selectedItemIndex');}, function(newVal, oldVal) {
            var feedList = $scope.gimme('feedList');
            if(newVal < feedList.length){
              if(newVal != -1){
                  setSelectedItemValues(feedList[newVal]);
              }
              else{
                  setSelectedItemValues();
              }

              if($scope.formProps.thePickableItemList[newVal] != $scope.formProps.listSelectionIndex){
                  $scope.formProps.listSelectionIndex = $scope.formProps.thePickableItemList[newVal];
              }
            }
            else{
              if(isNaN(oldVal)){
                oldVal = -1;
              }
              $scope.set('selectedItemIndex', oldVal)
            }
        }, true);

        $scope.$watch(function(){return $scope.formProps.listSelectionIndex;}, function(newVal, oldVal) {
            var currIndex = parseInt($scope.gimme('selectedItemIndex'));
            if(currIndex == -1 || newVal != $scope.formProps.thePickableItemList[currIndex]){
                for(var i = 0; i < $scope.formProps.thePickableItemList.length; i++){
                    if(newVal == $scope.formProps.thePickableItemList[i]){
                        $scope.set('selectedItemIndex', i);
                    }
                }
            }
        }, true);
    };
    //===================================================================================


    //========================================================================================
    // RSS Call
    // Make a call for a RSS feed at the current URL
    //========================================================================================
    var rssCall = function () {
        var rssUrl = $scope.gimme('rssURL');
        var feed = new google.feeds.Feed(rssUrl);
        feed.setNumEntries($scope.gimme('noOfItems'));
        feed.load(function(result) {
            if (!result.error) {
                $scope.set('feedList', result.feed.entries);

                var selTag = $scope.gimme('selectItemsByTag');
                var newSelList = [];
                for(var i = 0, item; item = result.feed.entries[i]; i++){
                    newSelList.push(item[selTag]);
                }
                $scope.formProps.thePickableItemList = newSelList;

                var selIndex = parseInt($scope.gimme('selectedItemIndex'));
                if(selIndex >= $scope.gimme('noOfItems')){
                    $scope.set('selectedItemIndex', -1);
                }
                else{
                    setSelectedItemValues(result.feed.entries[selIndex]);
                }

                if($scope.formProps.thePickableItemList[selIndex] != $scope.formProps.listSelectionIndex){
                    $scope.formProps.listSelectionIndex = $scope.formProps.thePickableItemList[selIndex];
                }
            }
        });
    }
    //========================================================================================


  //========================================================================================
  // Set Selected Item Values
  // Set dedicated slots to contain the content of the selected item from the RSS feed list
  //========================================================================================
    var setSelectedItemValues = function(selItem){
      if(selItem){
          $scope.set('selectedItemObject', selItem);
          $scope.set('selectedItemAuthor', selItem.author);
          $scope.set('selectedItemCategories', selItem.categories);
          $scope.set('selectedItemPubDate', selItem.publishedDate);
          $scope.set('selectedItemTitle', selItem.title);
          $scope.set('selectedItemLink', selItem.link);
          $scope.set('selectedItemContentSnippet', selItem.contentSnippet);
          $scope.set('selectedItemContent', selItem.content);
          if(selItem.mediaGroups && selItem.mediaGroups[0] && selItem.mediaGroups[0].contents && selItem.mediaGroups[0].contents[0] && selItem.mediaGroups[0].contents[0].url){
              $scope.set('selectedItemImage', selItem.mediaGroups[0].contents[0].url);
          }
          else{
              $scope.set('selectedItemImage', '../../images/notFound.png');
          }
      }
      else{
          $scope.set('selectedItemObject', undefined);
          $scope.set('selectedItemAuthor', '');
          $scope.set('selectedItemCategories', []);
          $scope.set('selectedItemPubDate', new Date());
          $scope.set('selectedItemTitle', '');
          $scope.set('selectedItemLink', '');
          $scope.set('selectedItemContentSnippet', '');
          $scope.set('selectedItemContent', '');
          $scope.set('selectedItemImage', '../../images/notFound.png');
      }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================

}
//=======================================================================================


//======================================================================================================================
