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
// IMPORT WEBBLE FORM CONTROLLER
// This controls the form for uploading Webble template files
//====================================================================================================================
ww3Controllers.controller('importWebbleSheetCtrl', function ($scope, $modalInstance, $log, gettext, localStorageService) {

    //=== PROPERTIES ================================================================

    // Form content needed for proper processing
    $scope.formItems = {
        selectedLocalFile: undefined
    };

    // Information tooltip texts
    $scope.infoTooltip = {
        localFile: gettext("Select the Webble-package for import where you have stored it on your local computer. (previously exported Webble)")
    };

    // Form validation error message
    $scope.errorMsg = 'This Feature is not yet fully implemented, but as soon as it is you will find it here.';


    //=== EVENT HANDLERS =====================================================================


    //========================================================================================
    // Local File Changed
    // When a file is selected make sure it is a proper webble import file of war type,
    // if it is not, rescue the situation by displaying needed error messages.
    //========================================================================================
    $scope.localFileChanged = function(input){
        $scope.errorMsg = '';
        if (input.files && input.files[0]) {
            var fileExt = input.files[0].name.substr(input.files[0].name.lastIndexOf('.')).toLowerCase();

            if(fileExt == '.war'){

				//Possible file reading and validity confirmation
				var reader = new FileReader();
				reader.onload = function (e) {
					$scope.formItems.selectedLocalFile = e.target.result;
				};
				reader.readAsText(input.files[0]);

            }
            else{
                $scope.formItems.selectedLocalFile = undefined;
                $('#localFileFormContainer')[0].reset();
                $scope.errorMsg = gettext("Webble-packages for import are saved as *.war files, and that was not a *.war file and will therefore not import any Webble obviously");
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
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $scope.errorMsg = '';
        if (result == 'submit') {
            $modalInstance.close($scope.formItems.selectedLocalFile);
        }
        else{
            $modalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
});
//======================================================================================================================
