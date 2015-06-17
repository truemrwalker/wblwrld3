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
//
// MEDIA PLAYER CONTROLLER (MediaPlayerCtrl)
//
// This is the controller for the platform's video playing capabilities (non Webble related)
//
//====================================================================================================================
ww3Controllers.controller('MediaPlayerCtrl', function($scope, $log, $window, $routeParams, $location, localStorageService){

    //=== PROPERTIES ================================================================
    $scope.videoWidth = $window.document.width;
    $scope.videoHeight = $window.document.height * 0.9;
    $scope.skipVideoBtnVisibility = false;



    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Catch the ending of the video
    //========================================================================================
    $scope.onEventHandler_VideoEnd_RedirectVisitor = function($event) {
        var asNormal = true;

        if($routeParams['vidId']){
            if($routeParams['vidId'] == 'intro'){
                if(localStorageService.get('IntroDisabled') == undefined){
                    $scope.setBkgLogoClass('logoBkg');
                }
                localStorageService.add('IntroDisabled', 'true');
            }
            else if($routeParams['vidId'] == 'outro'){
                asNormal = false;
                window.location.replace("https://www.google.com/search?q=Webble%20World&ie=utf-8&oe=utf-8&aq=t");
            }
        }

        if(asNormal){
            $location.path('/app');
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.setMenuModeEnabled(false);

    if($routeParams['vidId']){
        var browser = BrowserDetect.browser;
        if($routeParams['vidId'] == 'intro'){
            $scope.skipVideoBtnVisibility = true;
            if(browser == 'Chrome' || browser == 'Opera' || browser == 'Firefox'){
                $scope.videoSrc = 'media/intro.ogg';
            }
            else{
                $scope.videoSrc = 'media/intro.mp4';
            }
        }
        else{
            $log.error($scope.strFormatFltr('The media player was called with non valid video request value: {0}', [$routeParams['vidId']]));
            $scope.onEventHandler_VideoEnd_RedirectVisitor(null);
        }
    }
    else{
        $log.error('The media player was called with an empty video request value.');
        $scope.onEventHandler_VideoEnd_RedirectVisitor(null);
    }
});
//====================================================================================================================
