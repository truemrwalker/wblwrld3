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
// ABOUT WEBBLE WORLD FORM CONTROLLER
// This controls the Platforms About form
//====================================================================================================================
ww3Controllers.controller('AboutWebbleSheetCtrl', function ($scope, $modalInstance, $log, wblData, gettext, dbService, Enum, isEmpty, valMod) {

    //=== PROPERTIES ================================================================

    $scope.formData = wblData;
	var wblDefMetaData = $scope.formData.wblPlatformScope.getWebbleDefsMetaDataMemory();
	var updateData = null;

    $scope.tooltip = {
        displayname: gettext("This is the currently chosen display name for this Webble Instance, may be changed in properties"),
        instanceid: gettext("This is the session instance id for this particular Webble"),
        defid: gettext("This is the name of the Webble definition this Webble was created from"),
        author: gettext("This is the user name of the author for this Webble definition"),
        description: gettext("This is the description of this Webble Definition"),
        keywords: gettext("This is the keywords selected for this Webble Definition"),
        templateid: gettext("This is the name of the template this Webble is created from. If you click the 'Create Sandbox Copy' button you create an identical copy of this Webble template (HTML5 code) and place it in your sandbox template editor for developing your own version based on this."),
        templaterevision: gettext("This is the revision number of the template being used")
    };

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
    // Adjust Tooltip Placement By Device Width
    // the placement of the tooltip is by default at the bottom, but with smaller devices in
    // some rare cases that should be set to right instead.
    //========================================================================================
    $scope.adjustTooltipPlacementByDeviceWidth = function(){
        if($(document).width() < 410){
            return 'right';
        }
        else{
            return 'left';
        }
    };
    //========================================================================================

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
	// Rate This
	// Opens a modal window which lets the user rate the chosen Webble and comment on it.
	//========================================================================================
	$scope.rateThis = function(wbl){
		$scope.formData.wblPlatformScope.openForm(Enum.aopForms.rateWbl, {wblDefId: wbl.defid, wblDefName: wbl.displayname}, function(done){
			if(done != null){
				wbl['rateShow'] = false;
				dbService.getWebbleDef(wbl.defid).then(function(data) {
					$scope.formData.rating = data.rating;
					$scope.formData.ratingCount = data.rating_count;
				},function(eMsg){
					$log.log("Rating data not available from server: " + eMsg);
				});
			}
		});
	};
	//========================================================================================


	//========================================================================================
	// View Comments
	// Opens a modal window which lets the user read all other users rating and comments.
	//========================================================================================
	$scope.viewComments = function(wbl){
		$scope.formData.wblPlatformScope.openForm(Enum.aopForms.viewWblRatingAndComments, {wblDefId: wbl.defid, wblDefName: wbl.displayname}, null);
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
    // Make Copy
    // Makes a template copy for the selected Webble and puts in the users sandbox.
    //========================================================================================
    $scope.makeCopy = function (templateId) {
        dbService.copyPublishedTemplateAsMyUnpublishedTemplate(templateId).then(function(data){
            $scope.formData.wblPlatformScope.showQIM(gettext("Template code copied to your Template Editor"), undefined, undefined, undefined, '#c7fcff');
        },function(eMsg){
            $scope.errorMsg = eMsg;
        });
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $modalInstance.close(updateData);
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
	$scope.formData['socialMediaUrl'] = 'https://wws.meme.hokudai.ac.jp/#app?webble=' + $scope.formData.defid;
	$scope.formData['socialMediaModelName'] = 'Cool Webble, ' + $scope.formData.displayname + ', found in Webble World. Check it out!';
	$scope.formData['rateShow'] = true;
	$scope.formData.description = valMod.urlify($scope.formData.description);

	dbService.getWebbleDef($scope.formData.defid).then(function(data) {
		if($scope.formData.rating == 0 && $scope.formData.ratingCount == 0){
			$scope.formData.rating = data.rating;
			$scope.formData.ratingCount = data.rating_count;
		}
		if($scope.formData.image == "images/notFound.png" || $scope.formData.image == ""){
			if(data.webble.image != "" && data.webble.image != "images/notFound.png"){
				$scope.formData.image = data.webble.image;
			}
			else{
				$scope.formData.image = "images/icons/No_Image_Available.png";
			}
		}

		if($scope.formData.templaterevision == data.webble.templaterevision){
			var updateObj = {};
			if($scope.formData.displayname != data.webble.displayname){
				$scope.formData.displayname = data.webble.displayname;
				updateObj['displayname'] = data.webble.displayname;
			}
			if($scope.formData.author != data.webble.author){
				$scope.formData.author = data.webble.author;
				updateObj['author'] = data.webble.author;
			}
			if($scope.formData.description != data.webble.description){
				$scope.formData.description = data.webble.description;
				$scope.formData.description = valMod.urlify($scope.formData.description);
				updateObj['description'] = data.webble.description;
			}
			if($scope.formData.keywords != data.webble.keywords){
				$scope.formData.keywords = data.webble.keywords;
				updateObj['keywords'] = data.webble.keywords;
			}

			if(!isEmpty(updateObj)){
				updateData = updateObj;
			}
		}
	},function(eMsg){
		$log.log("Webble data not available from server: " + eMsg);
	});

	dbService.getWblRate($scope.formData.defid).then(function (ratings) {
		for(var i = 0; i < ratings.length; i++){
			if($scope.formData.wblPlatformScope.user.username == ratings[i].author){
				$scope.formData['rateShow'] = false;
				break;
			}
		}
	});

});
//======================================================================================================================
