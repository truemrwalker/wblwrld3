//======================================================================================================================
// Controllers for Google Map for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('googleMapCtrl', function($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        googleMapContainer: ['width', 'height', 'background-color']
    };

    //TODO: Array of custom menu item keys and display names
    //$scope.customMenu = [{itemId: '[MENU ITEM ID]', itemTxt: '[MENU ITEM DISPLAY TEXT]'}];
    // EXAMPLE:

    //TODO: Array of customized Interaction Balls
    //$scope.customInteractionBalls = [{index: [POSITION INDEX 0-11], name: '[IDENTIFIER]', tooltipTxt: '[DISPLAY TEXT]'}];
    // EXAMPLE:

    var mapContainer, mapCanvas;
    var map, currentPlace, placesService, infowindow;
    var markers = [], listeners = [];

    //=== EVENT HANDLERS ================================================================
    var onMouseDown = function(e){
        if(e.which === 1){
            e.stopPropagation();
        }
    };

    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        mapContainer = $scope.theView.parent().find("#googleMapContainer");
        mapCanvas = $scope.theView.parent().find("#map-canvas");

        $scope.addSlot(new Slot('currentLat',
            43.08,
            'Current Latitude',
            'The current latitude position',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('currentLong',
            141.34,
            'Current Longitude',
            'The current longitude position',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('currentZoom',
            8,
            'Current Zoom',
            'The current zoom level',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('searchStr',
            "",
            'Search String',
            'Search string to locate one or many positions on the map within 50 km from the map center',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.setDefaultSlot('searchStr');

        $scope.$watch(function(){return $scope.gimme('currentLat');}, function(newVal, oldVal) {
            if(map){
                if(currentPlace.lat() != newVal){
                    currentPlace = new google.maps.LatLng(parseFloat($scope.gimme('currentLat')),parseFloat($scope.gimme('currentLong')));
                    map.panTo(currentPlace);
                }

            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('currentLong');}, function(newVal, oldVal) {
            if(map){
                if(currentPlace.lng() != newVal){
                    currentPlace = new google.maps.LatLng(parseFloat($scope.gimme('currentLat')),parseFloat($scope.gimme('currentLong')));
                    map.panTo(currentPlace);
                }
            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('currentZoom');}, function(newVal, oldVal) {
            if(map){
                if(map.getZoom() != newVal){
                    map.setZoom(parseInt(newVal));
                }
            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('searchStr');}, function(newVal, oldVal) {
            if(placesService && newVal != ''){
                var request = {
                    location: currentPlace,
                    radius: '50000',
                    query: newVal
                };

                placesService.textSearch(request, searchCallback);
            }
            else{
                for (var i = 0; i < markers.length; i++) {
                    google.maps.event.removeListener(listeners[i]);
                    markers[i].setMap(null);
                }
                markers = [];
            }
        }, true);

        mapCanvas.bind('mousedown', onMouseDown);
        initializeGoogleMap();
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
            //if (targetName == $scope.customInteractionBalls[0].name){ //jump
            //    $scope.set('root:left', 0);
            //    $scope.set('root:top', 0);
            //}
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
        //if(itemName == $scope.customMenu[0].itemId){  //eat
        //    $log.log('Are you hungry?');
        //}
        //else if(itemName == $scope.customMenu[1].itemId){  //drink
        //    $log.log('Are you thirsty?')
        //}
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


    //========================================================================================
    // Google Map Api initiation
    //========================================================================================
    var initializeGoogleMap = function() {
        currentPlace = new google.maps.LatLng(-33.8665433,151.1956316);
        var mapOptions = {
            backgroundColor: "black",
            center: currentPlace,
            zoom: $scope.gimme('currentZoom')
        };
        map = new google.maps.Map(mapCanvas[0], mapOptions);
        placesService = new google.maps.places.PlacesService(map);
        infowindow = new google.maps.InfoWindow();

        google.maps.event.addListener(map,'center_changed',function() {
            currentPlace = map.getCenter();
            $scope.set('currentLat', currentPlace.lat());
            $scope.set('currentLong', currentPlace.lng());
        });

        google.maps.event.addListener(map,'zoom_changed',function() {
            $scope.set('currentZoom', map.getZoom());
        });


    };
    //========================================================================================


    //========================================================================================
    // Search Callback
    //========================================================================================
    var searchCallback = function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < markers.length; i++) {
                google.maps.event.removeListener(listeners[i]);
                markers[i].setMap(null);
            }
            markers = [];

            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
        else{
            $log.log(status);
        }
    };
    //========================================================================================


    //========================================================================================
    // Create Marker
    //========================================================================================
    var createMarker = function(place) {
        var placeLoc = place.geometry.location;
        markers.push(new google.maps.Marker({
            map: map,
            position: place.geometry.location
        }));

        var index = markers.length - 1;
        listeners.push(google.maps.event.addListener(markers[index], 'click', function() {
            infowindow.setContent(place.name);
            infowindow.open(map, this);
            map.setCenter(markers[index].getPosition());
            map.setZoom(17);
        }));
    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
