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
// INTERACTION OBJECT CONTROLLER (MediaPlayerCtrl)
// This is the controller for the platform's video playing capabilities (non Webble related)
//====================================================================================================================
ww3Controllers.controller('InteractionObjectCtrl', function($scope){

    //=== PROPERTIES ================================================================
    $scope.color = '';
    $scope.pos = {left: 0, top: 0};
    $scope.display = 'none';
    $scope.tooltip = 'undefined';

    var index_ = -1;
    $scope.getIndex = function(){return index_;};
    $scope.setIndex = function(whatIndex){index_ = whatIndex;};

    var name_ = '';
    $scope.getName = function(){return name_;};
    $scope.setName = function(whatName){name_ = whatName;};



    //=== EVENT HANDLERS =====================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //=================================================================================
    // Get Is Enabled
    // Get if this object is enabled or not.
    //=================================================================================
    $scope.getIsEnabled = function(){
        return $scope.display == 'inline';
    };
    //=================================================================================


    //=================================================================================
    // Set Is Enabled
    // Set the enabling state for this object.
    //=================================================================================
    $scope.setIsEnabled = function(enableState){
        if(enableState){
            $scope.display = 'inline';
        }
        else{
            $scope.display = 'none';
        }
    };
    //=================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************

});
//======================================================================================================================
