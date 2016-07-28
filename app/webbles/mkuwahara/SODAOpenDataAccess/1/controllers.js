//======================================================================================================================
// Controllers for Soap Client Webble for Webble World v3.0 (2013)
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
wblwrld3App.controller('mnkOpenDataCtrl', function($scope, $log, $timeout, Slot, Enum, dbService) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        //SoClHolder: ['width', 'height', 'background-color', 'border', 'border-radius'],
        //SoClDisplay:['width', 'font-family', 'font-size', 'font-weight']
    };

    $scope.customMenu = [
      	{itemId: 'findData', itemTxt: 'Find Open Data'}
    ];


    //var mnkOpenDataDisplay;

	var internalFilesPath;


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================





    //===================================================================================
    // Webble template Initialization

    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);



		//mnkOpenDataDisplay = $scope.theView.parent().find("#mnkOpenDataDisplay");


		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'openDataSodaEndPoint'){
			    getData();
			}
		});

        $scope.addSlot(new Slot('openDataSodaEndPoint',
            "",
            'Endpoint URI',
            'This is the URI endpoint address to the specific open data you want to access',
            $scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('retrievedData',
			{},
            'Retrieved Data',
            'This is the data retrieved from the end point address',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
		$scope.getSlot('retrievedData').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing); //ConnectionVisibility
    };
    //===================================================================================


    //===================================================================================
    // Get Data
    // Make a ajax call to get the data at the endpoint address
    //===================================================================================
    var getData = function(){
      	var endpoint = $scope.gimme('openDataSodaEndPoint');
		if(endpoint != ""){
			$.ajax({
				url: endpoint,
				type: "GET",
				data: {
					//"filter" : "COUNTRY:-;REGION:AFR;REGION:AMR;REGION:SEAR;REGION:EUR;REGION:EMR;REGION:WPR;REGION:GLOBAL"
						//"$limit" : 50
					//	"$$app_token" : "YOURAPPTOKENHERE"
				},
				success: function(data){
					$scope.set("retrievedData", data);
					$log.log("Data Arrived Safely");
					//for(var i = 0; i < data.length; i++){
					//	$log.log(data[i].year);
					//}

					//if(typeof data != "Object"){
					//	data = JSON.parse(data);
					//}

					//$log.log(Object.keys(data[0]));

					//$log.log(JSON.stringify(data, undefined, 1));

					//$log.log(new Date(data[0]['release_date']));

					$log.log(data);
				},
				error: function(err){
					$log.log(err.statusText + ": " + err.responseText);
					//$scope.showQIM("ERROR!!!\n\n" + err.statusText + "\n" + err.responseText);
				}
			});
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
		if(itemName == $scope.customMenu[0].itemId){  //Find data
        	$scope.openForm(Enum.aopForms.infoMsg, {title: 'How to Search for Open Data', content:
        		'<p>One way to find Open Data end point addresses is to search for it via the Open Data Network available ' +
        		'at the follwoing link <a href="http://www.opendatanetwork.com/" target="_blank">http://www.opendatanetwork.com/</a>.</p>' +
        		'<p>There one can search for all types of open data in multiple categories avaialble online. Once a specific data set is found ' +
				'one locates the green API button to the right of the data description and click that.</p>' +
				'<p><img src="https://dev.socrata.com/img/odn_dataset.png" style="width: 95%;" /></p>' +
				'<p>A new page opens where the endpoint address can be located behind a red gear icon a little bit down on the page.</p>' +
				'<p><img src="' + internalFilesPath + '/images/endpoint.png" style="width: 95%;" /></p>' +
				'Copy that address and paste it in the Webble\'s endpoint address slot and the data will be retrieved for further manipulation.</p>' +
				'<p>If you find and view a Soda dataset directly, there will be an API Documentation button under Export and then SODA API.</p>' +
				'<p class="showImgBtn1" tabindex="0" style="font-weight: bold; text-decoration: underline; color: #0000ff;">Show Image</p>' +
				'<p class="moreInfoImg1" ><img src="https://dev.socrata.com/img/sidebar.gif" style="width: 95%;" /></p>' +
				'<p>If you’re viewing a dataset in Data Lens, there will be an API button you can click to get the API endpoint and a link to API documentation.</p>' +
				'<p class="showImgBtn2" tabindex="0" style="font-weight: bold; text-decoration: underline; color: #0000ff;">Show Image</p>' +
				'<p class="moreInfoImg2" ><img src="https://dev.socrata.com/img/data_lens.png" style="width: 95%;" /></p>' +
				'<hr>' +
				'<p><span style="font-weight: bold;">Other data resources available Online (No API key needed):</span>' +
				'</br><a href="https://data.medicare.gov" target="_blank">https://data.medicare.gov</a>' +
				'</br><a href="https://data.sfgov.org" target="_blank">https://data.sfgov.org/</a>' +
				'</br><a href="https://www.census.gov/data/developers/data-sets.html" target="_blank">https://www.census.gov/data/developers/data-sets.html</a><span></span>' +
				'</br><a href="http://apps.who.int/gho/data/node.home" target="_blank">http://apps.who.int/gho/data/node.home</a><span> (NOT HTTPS)</span>' +
				'</br><a href="http://oppnadata.se/dataset" target="_blank">http://oppnadata.se/dataset</a><span> (SWEDISH)</span>' +
				'</p>' +
				'<p style="font-weight: bold;">Remember that only data sources served over secure https is by default allowed.</p>'
			});
        }
    };
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//*********************************************************************************************************************
