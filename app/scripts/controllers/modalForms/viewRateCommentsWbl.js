//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013), v3.1(2015)
//
// Project Leader & Lead Meme Media Architect: Yuzuru Tanaka
// Webble System Lead Architect & Developer: Micke Nicander Kuwahara
// Server Side Developer: Giannis Georgalis
// Additional Support: Jonas Sjöbergh
//
// This file is part of Webble World (c).
// ******************************************************************************************
// Webble World is licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ******************************************************************************************
// The use of the word "Webble" or "webble" for the loadable meme media objects are limited
// only to objects that actually loads in this original Webble World Platform. Modifications
// of the meme media object code which leads to breaking of compatibility with the original
// Webble World platform, may no longer be referred to as a "Webble" or "webble".
// ******************************************************************************************
//====================================================================================================================
'use strict';

//====================================================================================================================
// WEBBLE SLOT CONNECTION FORM CONTROLLER
// This controls the Webbles slot connection form
//====================================================================================================================
ww3Controllers.controller('viewRateCommentsWblSheetCtrl', function ($scope, $modalInstance, $log, gettext, dbService, wblDefData) {

    //=== PROPERTIES ================================================================
    $scope.wblDefId = wblDefData.wblDefId;

    $scope.formItems = {
        wblDefName: wblDefData.wblDefName,
		formHeight: ($(document).height() * 0.75) + "px",
        errorMsg: ''
    };

	$scope.ratings = [];

	$scope.textParts = {
		starRatingTxt: [
			gettext("Terrible"),
			gettext("Very Bad"),
			gettext("Bad"),
			gettext("Could be better"),
			gettext("Fairly Ok"),
			gettext("Good"),
			gettext("Very Good"),
			gettext("Great!"),
			gettext("Amazing!"),
			gettext("Masterpiece!")
		],
		rateTxtVoters: gettext("votes")
	};

    //=== EVENT HANDLERS =====================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

	//========================================================================================
	// Get Star Img
	// Returns a lit star or an off star depending on the star index and the rate value of
	// the Webble.
	//========================================================================================
	$scope.getStarImg = function(rate, index){
		if(index < rate ){
			return '../../images/starOn.png';
		}
		else{
			return '../../images/starOff.png';
		}
	};
	//========================================================================================


	//========================================================================================
	// Get Rate Text
	// Returns a the text that comes with the selected rating.
	//========================================================================================
	$scope.getRateText = function(theRate){
		theRate = Math.ceil(parseInt(theRate));
		if(theRate == 0){
			return gettext("Unrated");
		}
		else{
			return $scope.textParts.starRatingTxt[theRate - 1];
		}
	};
	//========================================================================================



    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
		$modalInstance.close(null);
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
	dbService.getWblRate($scope.wblDefId).then(function (ratings) {
		$scope.ratings = ratings;
	});


});
//======================================================================================================================
