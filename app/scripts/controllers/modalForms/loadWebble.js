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
// LOAD WEBBLE FORM CONTROLLER
// This controls the form for uploading Webble template files
//====================================================================================================================
ww3Controllers.controller('loadWebbleSheetCtrl', function ($scope, $uibModalInstance, $log, gettext) {

    //=== PROPERTIES ================================================================

    // Form content needed for proper processing
    $scope.formItems = {
        loadTarget: 'local',
        wblURL: '',
        selectedLocalFile: undefined,
		selectedLocalFileName: '',
		noFileChosenTxt: gettext("No file chosen")
    };

    // Information tooltip texts
    $scope.infoTooltip = {
        loadTarget: gettext("Here you decide weather to load the Webble with an URL from an online server or by file from your local computer"),
        wblURL: gettext("if your Webble is online, write the URL for it here."),
        localFile: gettext("if your Webble is on your local computer, select the file from here.")
    };

    // Form validation error message
    $scope.errorMsg = '';


    //=== EVENT HANDLERS =====================================================================


    //========================================================================================
    // Local File Changed
    // When a file is selected make sure it is a proper webble def file of json type,
    // if it is not, rescue the situation by displaying needed error messages.
    //========================================================================================
    $scope.localFileChanged = function(input){
        $scope.errorMsg = '';
        if (input.files && input.files[0]) {
            var fileExt = input.files[0].name.substr(input.files[0].name.lastIndexOf('.')).toLowerCase();

            if(fileExt == '.json'){
				$scope.formItems.selectedLocalFileName = input.files[0].name;
                var reader = new FileReader();

                reader.onload = function (e) {
                    var theWebbleDef = JSON.parse(e.target.result);

                    if(theWebbleDef['webble'] != undefined){
                        $scope.formItems.selectedLocalFile = theWebbleDef;
                    }
                    else{
                        $scope.formItems.selectedLocalFile = undefined;
                        $('#localFileFormContainer')[0].reset();
                        $scope.errorMsg = gettext("The chosen file was somehow not formatted correctly so therefore it will not load any Webble.");
						$scope.formItems.selectedLocalFileName = $scope.formItems.noFileChosenTxt;
                        if(!$scope.$$phase){ $scope.$apply(); }
                    }
                };

                reader.readAsText(input.files[0]);
            }
            else{
                $scope.formItems.selectedLocalFile = undefined;
                $('#localFileFormContainer')[0].reset();
                $scope.errorMsg = gettext("Webbles are saved as json files, that was not a json file and will therefore not load any Webble obviously");
				$scope.formItems.selectedLocalFileName = $scope.formItems.noFileChosenTxt;
                if(!$scope.$$phase){ $scope.$apply(); }
            }
        }
        if(!$scope.$$phase){ $scope.$apply(); }
    };
    //========================================================================================



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
    // Is Online Selected
    // returns true or false weather save target is set to online or not.
    //========================================================================================
    $scope.isOnlineSelected = function () {
        if ($scope.formItems.loadTarget == 'online') {
            $scope.formItems.selectedLocalFile = undefined;
            $('#localFileFormContainer')[0].reset();
            return true;
        }
        else{
            return false;
        }
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $scope.errorMsg = '';
        if (result == 'submit') {
            if($scope.formItems.selectedLocalFile){
				$uibModalInstance.close($scope.formItems.selectedLocalFile);
            }
            else{
				$uibModalInstance.close({wblUrl: $scope.formItems.wblURL});
            }
        }
        else{
			$uibModalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
	$scope.formItems.selectedLocalFileName = $scope.formItems.noFileChosenTxt;
});
//======================================================================================================================
