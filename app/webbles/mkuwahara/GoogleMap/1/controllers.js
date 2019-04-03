//======================================================================================================================
// Controllers for Google Map for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('googleMapCtrl', function($scope, $log, $timeout, Slot, Enum, dbService, gettext) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        googleMapContainer: ['width', 'height', 'background-color']
    };

    var mapContainer, mapCanvas;
    var map, currentPlace, placesService, infowindow;
    var markers = [], listeners = [];


	//TODO: If your Webble is using an api that requires a personal Access key to work, we recommend that you do not share your personal key in your Webble for everyone to use. Instead you should store the
	//TODO: needed keys in your user profile and request them here, meaning that if another Webble World User is using this (your) Webble, they too need to have a valid access key of their own, stored in
	//TODO: their profile for the Webble to work, and your access keys will not be abused.
	//TODO: The realm could for example be 'google' and the resource could for example be 'map'.
	//TODO: In order to allow others to use the Webble with their own keys, the realm and resource should be declared in the Webble description.
	//TODO: If there are some crucial dependencies between loading the API and the init of the Webble this code may better serve inside the coreCall_Init function to avoid breaks.

	var myAccessKeyForSomething;



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

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'currentLat'){
				if(map){
					if(currentPlace.lat() != newVal){
						currentPlace = new google.maps.LatLng(parseFloat($scope.gimme('currentLat')),parseFloat($scope.gimme('currentLong')));
						map.panTo(currentPlace);
					}

				}
			}
			else if(eventData.slotName == 'currentLong'){
				if(map){
					if(currentPlace.lng() != newVal){
						currentPlace = new google.maps.LatLng(parseFloat($scope.gimme('currentLat')),parseFloat($scope.gimme('currentLong')));
						map.panTo(currentPlace);
					}
				}
			}
			else if(eventData.slotName == 'currentZoom'){
				if(map){
					if(map.getZoom() != newVal){
						map.setZoom(parseInt(newVal));
					}
				}
			}
			else if(eventData.slotName == 'searchStr'){
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
			}
		});

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

        mapCanvas.bind('mousedown', onMouseDown);

		// dbService.getMyAccessKey("googleapis", "maps").then(
		// 	function(returningKey) {
		// 		if(returningKey){
		// 			var myAccessKeyForSomething = returningKey;
		// 			// DO WHAT YOU ARE SUPPOSED TO DO TO ACCESS THE API WITH THE KEYS YOU RETRIEVED.
		// 			// For example:
		// 			var urlPath = "https://maps.googleapis.com/maps/api/js?key=";
		// 			$log.log(myAccessKeyForSomething);
		// 			$timeout(
		// 				$.getScript( urlPath +  myAccessKeyForSomething)
		// 					.always(function( jqxhr, settings, exception ) {

		$timeout(function(){initializeGoogleMap();});

		//					})
		// 			);
		// 		}
		// 		else{
		// 			$scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Access Key Found"), content: gettext("There was no key of the specified realm and resource saved in your user profile.")}, null);
		// 		}
		// 	},
		// 	function (err) {
		// 		$log.log("ERROR: " + err);
		// 	}
		// );
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
    };
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
