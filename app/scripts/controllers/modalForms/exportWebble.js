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
// EXPORT WEBBLE FORM CONTROLLER
// This controls the form for exporting Webble to the local computer incl code
//====================================================================================================================
ww3Controllers.controller('exportWebbleSheetCtrl', function ($scope, $uibModalInstance, $log, $uibModal, $timeout, dbService, localStorageService, gettext, formContent) {

    //=== PROPERTIES ================================================================

    // The needed Webble info data
	var thePlatform = formContent.platformScope;
    var theWblDef = formContent.wblDef;
    var theWblTemplateList = formContent.wblTemplateList;

    // Form content needed for proper processing
    $scope.formItems = {
        wblDispName: theWblDef.webble.displayname,
        templateList: theWblTemplateList,
		exportWebbleData: '',
		closeBtnTxt: 'Cancel',
		exportBtnTxt: 'Export',
		exportDisabled: false
    };

    // Information tooltip texts
    $scope.infoTooltip = {
        wblDispName: gettext("This is the current display name of the main parent Webble to be exported."),
        templateList: gettext("These are the included Webble templates whose code files will be included in the export packaged, described by template Id, revision no and if it is sandbox or not.")
	};

    // Form validation error message
    $scope.errorMsg = "";



    //=== EVENT HANDLERS =====================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Export The Webble
    // executes the export operation of the webble to the server.
    //========================================================================================
    var generateExportWebbleData = function () {
        return JSON.stringify({ webble: theWblDef, templates: theWblTemplateList });
    };
    //========================================================================================



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
        if (result == 'export') {
			$timeout(function(){ $scope.formItems.exportDisabled = true; });
			$timeout(function(){
				$scope.formItems.exportBtnTxt = "Exported";
				$scope.formItems.closeBtnTxt= "Close";
			}, 1000);
        }
        else{
			$uibModalInstance.close();
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.formItems.exportWebbleData = generateExportWebbleData();

});
//======================================================================================================================
