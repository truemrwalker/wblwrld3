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
// PUBLISH WEBBLE FORM CONTROLLER
// This controls the form for uploading Webble template files
//====================================================================================================================
ww3Controllers.controller('publishWebbleSheetCtrl', function ($scope, $uibModalInstance, $log, $uibModal, $timeout, dbService, localStorageService, gettext, formContent, jsonQuery) {

    //=== PROPERTIES ================================================================

    // The base Webble def object to be saved
    var theWblDef = formContent.wblDef;
    var theWblElement = formContent.theWblElement;
    var theAutoGenImage;

    // list of all webbles included in the webble def to be published
    var listOfIncludedWebbles = [];

    // list of sandbox webbles that need to be published separately too
    var listOfSandboxWebbles = [];

    // The data to be returned when the form is finished executing the publish
    var returnData = null;

    var lastIsCustomCheck;

    // Form content needed for proper processing
    $scope.formItems = {
        currDefId: theWblDef.webble.defid,
        newDefId: '',
        saveTarget: 'online',
        currDisplayName: theWblDef.webble.displayname,
        currDesc: theWblDef.webble.description,
        currKeywords: theWblDef.webble.keywords,
        currImg: theWblDef.webble.image,
        imgType: 'auto',
        isSameAuthor: formContent.isSameAuthor,
        pubGroups: [],
        selectedPubGroups: []
    };

    // Information tooltip texts
    $scope.infoTooltip = {
        currDefId: gettext("This is the name which this top Webble was published as previously (if reused, the Webble will overwrite and replace the current one found by that name.)"),
        newDefId: gettext("This is the name you want your Webble to be identified by (unless you will use the current name and replace that Webble with this new one)"),
        saveTarget: gettext("Here you decide weather to publish this Webble online to the public server or only locally to your computer"),
        currDisplayName: gettext("This is a user friendly display name used by this Webble instance, your new Webble will use this value as its default display name"),
        currDesc: gettext("This is the description of this Webble as will be shown after publish. Any URL links will become clickable. If the knowledge exist one may also use HTML tags and CSS to pimp up the text further if that is of any need."),
        currKeywords: gettext("These are the descriptive keywords this Webble will be more easly searched and found by"),
        imgView: gettext("This is the image that is representing this Webble in search engines"),
        imgTypeSelect: gettext("Using the auto generated image is recomended but if you prefer a custom image that is possible."),
        imgPick: gettext("Pick a local image to use to represent your Webble. [Max Size: 300kb]"),
        currPubGroups: gettext("Select which groups this Webble should be associated with and trusted by. No group means the Webble will always be considered untrusted.")
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

            var reader = new FileReader();

            reader.onload = function (e) {
                if(e.target.result.toString().search('data:image') != -1){
                    $scope.formItems.currImg = e.target.result;
                    $scope.errorMsg = '';
                }
                else{
                    $scope.errorMsg = gettext("The file selected is not an image file and will therefore not be used as such. Auto generated image will be used instead.");
                    $scope.formItems.currImg = theAutoGenImage;
                    $('#customFileFormContainer')[0].reset();
                }
                if(!$scope.$$phase){ $scope.$apply(); }
            };

            if(input.files[0].size < 300000){
                reader.readAsDataURL(input.files[0]);
            }
            else{
                $scope.errorMsg = gettext("The file selected is too large. Max size allowed is 300kb. Please resize image or choose a smaller one.");
                $('#customFileFormContainer')[0].reset();
            }
        }
        if(!$scope.$$phase){ $scope.$apply(); }
    };
    //========================================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Publish The Webble
    // executes the publish operations of the webble definition to the server.
    //========================================================================================
    var publishTheWebble = function(){
        var groups = [];
        for(var i = 0; i < $scope.formItems.pubGroups.length; i++){
            for(var k = 0; k < $scope.formItems.selectedPubGroups.length; k++){
                if($scope.formItems.selectedPubGroups[k].id == $scope.formItems.pubGroups[i].id){
                    groups.push(i);
                    break;
                }
            }
        }

        dbService.publishWebbleDef(theWblDef, groups).then(function(data){
			$uibModalInstance.close(returnData);
        },function(eMsg){
            $scope.errorMsg = eMsg;
        });
    };
    //========================================================================================


    //========================================================================================
    // Publish All Sandbox Webbles
    // executes the publish of sandbox webbles operations to the server.
    //========================================================================================
    var publishAllSandboxWebbles = function(){
        var sbw = listOfSandboxWebbles.splice(0, 1);
        dbService.publishWebbleDef(sbw[0]).then(function(data){
            if(listOfSandboxWebbles.length > 0){
                publishAllSandboxWebbles();
            }
            else if(listOfIncludedWebbles.length > 1){
                publishTheWebble();
            }
            else{
				$uibModalInstance.close(returnData);
            }
        },function(eMsg){
            $scope.errorMsg = eMsg;
        });
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
    // Is Online Selected
    // returns true or false weather save target is set to online or not.
    //========================================================================================
    $scope.isOnlineSelected = function () {
        return $scope.formItems.saveTarget == 'online';
    };
    //========================================================================================


    //========================================================================================
    // Is Custom Selected
    // returns true or false weather the option to select a custom image is set or not.
    //========================================================================================
    $scope.isCustomSelected = function () {
        if($scope.formItems.imgType != 'custom' && $scope.formItems.imgType != lastIsCustomCheck){
            $scope.errorMsg = '';
        }
        lastIsCustomCheck = $scope.formItems.imgType;
        return $scope.formItems.imgType == 'custom';
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $scope.errorMsg = '';
        if (result == 'submit') {
            if($scope.formItems.newDefId != ''){
                theWblDef.webble.defid = $scope.formItems.newDefId
            }
            else if(!$scope.formItems.isSameAuthor){
                $scope.errorMsg = gettext("You have to provide a Webble Definition Id");
                return;
            }

            theWblDef.webble.displayname = $scope.formItems.currDisplayName;
            theWblDef.webble.description = $scope.formItems.currDesc;
            theWblDef.webble.keywords = $scope.formItems.currKeywords;

            returnData = {
                instanceid: theWblDef.webble.instanceid,
                defid: theWblDef.webble.defid,
                displayname: theWblDef.webble.displayname,
                description: theWblDef.webble.description,
                keywords: theWblDef.webble.keywords,
                image: theWblDef.webble.image,
                sandboxWblPublished: false
            };

            if($scope.formItems.saveTarget == 'online'){
                theWblDef.webble.image = $scope.formItems.currImg;
                returnData.image = theWblDef.webble.image;
                listOfIncludedWebbles = jsonQuery.allValByKey(theWblDef, 'webble');
                listOfSandboxWebbles = [];

                for(var i = 0; i < listOfIncludedWebbles.length; i++){
                    if(listOfIncludedWebbles[i].templaterevision == 0 && listOfIncludedWebbles[i].templateid != 'bundleTemplate'){
                        var alreadyInTheList = false;
                        for(var n = 0; n < listOfSandboxWebbles.length; n++){
                            if(listOfIncludedWebbles[i].templateid == listOfSandboxWebbles[n].webble.templateid){
                                alreadyInTheList = true;
                            }
                        }

                        if(!alreadyInTheList){
                            var sbwId = '';
                            for(var s = 0; s < formContent.sandboxWblList.length; s++){
                                if(listOfIncludedWebbles[i].templateid == formContent.sandboxWblList[s].webble.templateid){
                                    sbwId = formContent.sandboxWblList[s].id;
                                    break;
                                }
                            }
                            listOfSandboxWebbles.push({id: sbwId, webble: listOfIncludedWebbles[i]});
                        }
                    }
                }

                if(listOfSandboxWebbles.length == 0){
                    publishTheWebble();
                }
                else{
                    var modalInstance = $uibModal.open({templateUrl: 'views/modalForms/publishSandboxWblsToo.html', windowClass: 'modal-wblwrldform small'});

                    modalInstance.result.then(function () {
                        returnData.sandboxWblPublished = true;
                        publishAllSandboxWebbles();
                    }, function () { });
                }
            }
            else{
                var blob = new Blob([JSON.stringify(theWblDef)], {type: "text/plain;charset=utf-8"});
                saveAs(blob, theWblDef.webble.defid + ".json");
				$uibModalInstance.close(returnData);
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
    html2canvas(theWblElement, {
        onrendered: function(canvas) {
            theAutoGenImage = canvas.toDataURL();
            $scope.formItems.currImg = theAutoGenImage;
            if(!$scope.$$phase){ $scope.$apply(); }
        }
    });

    dbService.getMyGroups().then(function(myGroups){
        $scope.formItems.pubGroups = myGroups;
    },function(eMsg){
        $scope.errorMsg = eMsg;
    });




});
//======================================================================================================================
