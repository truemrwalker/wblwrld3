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
ww3Controllers.controller('rateWblSheetCtrl', function ($scope, $modalInstance, $log, gettext, dbService, wblDefData) {

    //=== PROPERTIES ================================================================
    $scope.wblDefId = wblDefData.wblDefId;

    $scope.formItems = {
        wblDefName: wblDefData.wblDefName,
        maxRate: 10,
        rating: 1,
        comment: '',
        errorMsg: ''
    };

	$scope.ratings = [];

    //=== EVENT HANDLERS =====================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $scope.formItems.errorMsg = '';
        if(!$scope.$$phase){ $scope.$apply(); }

        if (result == 'submit') {
            dbService.setWblRate($scope.wblDefId, $scope.formItems.rating, $scope.formItems.comment).then(function(webbles){
                $modalInstance.close('submitted');
            },function(eMsg){
                $scope.formItems.errorMsg = eMsg;
                if(!$scope.$$phase){ $scope.$apply(); }
            });
        }
        else{
            $modalInstance.close(null);
        }
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
