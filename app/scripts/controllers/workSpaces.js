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
// WORK SURFACE CONTROLLER (WorkSpacesCtrl)
// This is the controller for the work surface where workspaces live (which in turn have room for webbles)
//====================================================================================================================
ww3Controllers.controller('WorkSpacesCtrl', function($scope, $log, $modal, $timeout, $rootScope, $location, wwConsts, dbService, localStorageService, Enum, bitflags, gettext){

    //=== PROPERTIES ================================================================
    //---Edit Workspace Name control props--------------------
    var editMemory = '';
    $scope.allowedEditMode = true;

    //---Bubble Text props--------------------
    var bubbleTxt_ = '';
    $scope.getBubbleTxt = function(){return bubbleTxt_;};
    $scope.setBubbleTxt = function(newTxt){bubbleTxt_ = newTxt};

    var isBubbleTxtVisible_ = false;
    $scope.getBubbleTxtVisibility = function(){return isBubbleTxtVisible_;};
    // SET is more complex and found further below

    var bubbleTxtPos_ = {x: -1000, y: -1000};
    $scope.putBelow = '';
    var bblTxtCaller_ = undefined;
    var displayTimer_;
    // ----------------------------------------

    //--- style fixes-----------------------
    $scope.getAdjustedTopPos = function(){return (parseInt($scope.wsTopPos) + 5) + 'px';};   //;
    // ----------------------------------------

    // texts
    $scope.noConnExistMsg = gettext("No Webbles are connected with eachother or share their model");
    $scope.noTrustIconInfo = gettext("Following Webbles in this workspace are from a source outside your circle of trust: ");
	$scope.sandboxPresentIconInfo = gettext("Following Webbles in this workspace were originally loaded from the sandbox (they might have been published since then, but not yet reloaded): ");



    //=== EVENT HANDLERS =====================================================================

	//========================================================================================
	// Load workspaces when user logs in
	//========================================================================================
	$scope.$on('auth:login', function(event, user) {
        $scope.loadAvailableWorkspaces();
	});
    //========================================================================================


    //========================================================================================
    // UnLoad workspaces when user logs out
    //========================================================================================
    $scope.$on('auth:logout', function() {
		unloadAvailableWorkspaces();
	});
    //========================================================================================


	//========================================================================================
    // Catch a dropped file and if it is a Webble definition file it will load the Webble.
    //========================================================================================
    $scope.onEventHandler_FileDrop = function(e){
        // fetch FileList object
        var files = e.target.files || e['dataTransfer'].files;

        // process all File objects
        for (var i = 0, file; file = files[i]; i++) {
            var fileExtension = file.name.substr(file.name.lastIndexOf('.'));

            if(fileExtension == '.json'){
                var reader = new FileReader();
                reader.onload = function(e) {
                    var theWebbleDef = JSON.parse(e.target.result);
                    if(theWebbleDef['webble'] != undefined){
                        // Check if the webble def has already been loaded before...
                        var webbleDefExist = false;
                        for (var i = 0, ewd; ewd = $scope.getWebbleDefs()[i]; i++){
                            if (ewd['wblDefId'] == theWebbleDef['webble']['defid']){
                                webbleDefExist = true;
                                break;
                            }
                        }
                        if (!webbleDefExist){
                            $scope.getWebbleDefs().push({wblDefId: theWebbleDef['webble']['wblDefId'], json: theWebbleDef});
                        }

                        $scope.loadWebbleFromDef(theWebbleDef, null);
                    }
                    else{
                        $scope.showQIM(gettext("The Webble Definition file was somehow not formatted correctly so therefore Webble loading was canceled."));
                    }
                };
                reader.readAsText(file);
            }
            else{
                $scope.showQIM(gettext("The provided file is not of json type, and will therefore be ignored."));
            }
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Load the available workspaces - i.e. the ones owned by the user or the
    // ones which are shared with the user
    //========================================================================================
    $scope.loadAvailableWorkspaces = function() {
        dbService.getAvailableWorkspaces().then(
            function(workspaces) {
                var theWSToLoad;
                if(workspaces.length > 0){
                    $scope.setAvailableWorkspaces(workspaces);

                    for(var n = 0, aws; aws = workspaces[n]; n++){
                        if($scope.getRecentWS() == aws.id){
                            theWSToLoad = aws;
                            break;
                        }
                    }

                    var pathQuery = $location.search();
                    if(pathQuery.workspace){
                       theWSToLoad = {id: pathQuery.workspace, name: '', creator: '', is_shared: false};

                       var loadingAllowed = false;
                       for(var i = 0; i < workspaces.length; i++){
                           if(workspaces[i].id == pathQuery.workspace){
                              theWSToLoad = workspaces[i];
                              loadingAllowed = true;
                              break;
                          }
                       }

                       if(!loadingAllowed){
                          $scope.showQIM(gettext("You tried to load a linked workspace that you do not have access to or does not exist, therefore ignored."), 3000, {w: 230, h: 90});
                          $scope.waiting(false);
                          theWSToLoad = undefined;
                       }
                    }
                }

                //If unsaved work is done we do not delete it by loading previous WS or creating a new empty one
                if($scope.getCurrWS()){
                    if($scope.getCurrWS().webbles.length == 0){
                        if(theWSToLoad){
                            $scope.insertWS(theWSToLoad);
                        }
                        else{
                            $scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
                        }
                    }
                }
                else{
                    if(theWSToLoad){
                        $scope.insertWS(theWSToLoad);
                    }
                    else{
                        $scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
                    }
                }
            },
            function () {
                $log.log("ERROR WHILE LOADING LIST OF AVAILABLE WORKSPACES")
            }
        );
    };
    //========================================================================================


    //========================================================================================
    // Load/Unload the available workspaces - i.e. the ones owned by the user or the
    // ones which are shared with the user
    //========================================================================================
    var unloadAvailableWorkspaces = function() {
        $scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************


    //========================================================================================
    // Get Surface Height
    // Returns the available height which the surface can use of the browser window.
    //========================================================================================
    $scope.getSurfaceHeight = function(){
        return ($(window).height() - parseInt($scope.wsTopPos)) + 'px';
    };
    //========================================================================================


    //========================================================================================
    // Returns the adjusted position of the bubble Text element
    //========================================================================================
    $scope.getBubbleTxtPos = function(){
        var adjBblTxtPos = {x: bubbleTxtPos_.x, y: bubbleTxtPos_.y - 30};
        if(adjBblTxtPos.y < 0 && adjBblTxtPos.y > -1000){
            $scope.putBelow = 'top';
            adjBblTxtPos.y = bubbleTxtPos_.y + parseInt(bblTxtCaller_.parent().css('height')) + 25;
        }
        else{
            $scope.putBelow = '';
        }
        return adjBblTxtPos;
    };
    //========================================================================================


    //========================================================================================
    // Sets the position of the bubble Text element
    //========================================================================================
    $scope.setBubbleTxtPos = function(newPos, caller){
        bblTxtCaller_ = caller;
        if(newPos.x && newPos.y){
            bubbleTxtPos_ = newPos;
        }
    };
    //========================================================================================


    //========================================================================================
    // Sets the visibility of the bubble Text element
    //========================================================================================
    $scope.setBubbleTxtVisibility = function(newVisibilityState, howLong){
        if(newVisibilityState == true){
            if(displayTimer_){
                $timeout.cancel(displayTimer_);
            }
            isBubbleTxtVisible_ = true;
            displayTimer_ = $timeout(function(){$scope.setBubbleTxtVisibility(false, 0);}, howLong);
        }
        else{
            $scope.putBelow = '';
            bubbleTxt_ = '';
            isBubbleTxtVisible_ = false;
            bblTxtCaller_ = undefined;
            bubbleTxtPos_ = {x: -1000, y: -1000};
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.setMenuModeEnabled(true);

    // We must manually fire the call for fetching user workspaces if it has not been called already (workspace was
    // created after login authentication was confirmed).
    if($scope.user && $scope.getAvailableWorkspaces().length == 0){
        $scope.loadAvailableWorkspaces();
    }
    else if(!$scope.user && $scope.getAvailableWorkspaces().length == 0){
        $scope.insertWS({ id: undefined, name: '', creator: '', is_shared: false});
    }
});
//======================================================================================================================
