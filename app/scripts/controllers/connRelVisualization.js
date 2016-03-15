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
// WEBBLE PROPERTIES FORM CONTROLLER
// This controls the Webbles slot and property form
//====================================================================================================================
ww3Controllers.controller('VisualConnViewCtrl', function ($scope, $log, gettext, wwConsts) {

    //=== PROPERTIES ================================================================
    $scope.connArrows = [];
    $scope.sharedModelMarkers = [];


    //=== EVENT HANDLERS =====================================================================


    //========================================================================================
    // A watch for form visibility
    //========================================================================================
    $scope.$watch(function(){return $scope.getVCVVisibility();}, function(newVal, oldVal) {
        if(newVal == 'inline-block'){
            $('#connViz').attr('height', $(window).height() - parseInt($scope.wsTopPos) - 20).attr('width', $(window).width() - 20);
            $scope.connArrows = getValidConnView();
            $scope.sharedModelMarkers = getValidMSView();
        }
    }, true);
    //========================================================================================


    //========================================================================================
    // Hide Visual Connection View
    // If user click somewhere on the arrow view it closes and hides and the user can start
    // manipulating the Webbles again.
    //========================================================================================
    $scope.hideVCV = function(){
        $scope.setVCVVisibility('none');
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Get Valid Connection View
    // Creates a list of arrows and text to visualize how the current Webbles are related and
    // communicates.
    //========================================================================================
    var getValidConnView = function(){
        var validConnList = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            var parent = aw.scope().getParent();
            if(parent){
                var cPos = $scope.getWebbleCenterPos(aw);
                var pPos = $scope.getWebbleCenterPos(parent);
                var mPos = {x: cPos.x + ((pPos.x - cPos.x) / 2), y: cPos.y + ((pPos.y - cPos.y) / 2)};
                var cPosTxtOffset = {x: 0, y: 0}, pPosTxtOffset = {x: 0, y: 0};
                var startMarker = '#markerChild';
                var endMarker = '#markerParent';
                var midMarker = '#markerNoArrow';
                var cSlot = aw.scope().getSelectedSlot();
                var pSlot = aw.scope().getConnectedSlot();
                var path = 'M' + cPos.x + ',' + cPos.y + ' L' + mPos.x + ',' + mPos.y + ' L' + pPos.x + ',' + pPos.y;

                var slotConnDir = aw.scope().getSlotConnDir();
                if(slotConnDir.send && slotConnDir.receive){ midMarker = '#markerDblArrow'; }
                else if(slotConnDir.send && !slotConnDir.receive){
                    if(cPos.x > pPos.x){
                        midMarker = '#markerLArrow'
                    }
                    else{
                        midMarker = '#markerRArrow'
                    }
                }
                else if(!slotConnDir.send && slotConnDir.receive){
                    if(cPos.x > pPos.x){
                        midMarker = '#markerRArrow'
                    }
                    else{
                        midMarker = '#markerLArrow'
                    }
                }

                if(cPos.x > pPos.x){
                    mPos = {x: pPos.x + ((cPos.x - pPos.x) / 2), y: pPos.y + ((cPos.y - pPos.y) / 2)};
                    path = 'M' + pPos.x + ',' + pPos.y + ' L' + mPos.x + ',' + mPos.y + ' L' + cPos.x + ',' + cPos.y;
                    startMarker = '#markerParent';
                    endMarker = '#markerChild';
                }

				if((cPos.x - pPos.x) > 0){
					cPosTxtOffset.x = -20;
					pPosTxtOffset.x = 20;
				}
				else{
					cPosTxtOffset.x = 20;
					pPosTxtOffset.x = -20;
				}

				if((cPos.y - pPos.y) > 0){
					cPosTxtOffset.y = -20;
					pPosTxtOffset.y = -20;
				}
				else{
					cPosTxtOffset.y = 20;
					pPosTxtOffset.y = 20;
				}

                validConnList.push({cPos: cPos, pPos: pPos, path: path, cSlot: cSlot, pSlot: pSlot, startMarker: startMarker, endMarker: endMarker, midMarker: midMarker, cPosTxtOffset: cPosTxtOffset, pPosTxtOffset: pPosTxtOffset});
            }
        }

        return validConnList;
    };
    //========================================================================================


    //========================================================================================
    // Get Valid Model Sharee View
    // Creates a list of Model-Sharee markers with color and numbers to visualize how the
    // current Webbles are sharing model with other Webbles.
    //========================================================================================
    var getValidMSView = function(){
        var validMSList = [];
        var msCollections = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if(aw.scope().getModelSharees().length > 0){
                var msCollection = {};
                for(var n = 0, ms; ms = aw.scope().getModelSharees()[n]; n++){
                    msCollection[ms.scope().getInstanceId().toString()] = ms;
                }
                msCollection[aw.scope().getInstanceId().toString()] = aw;

                var existsAlready = false;
                for(var n = 0, msc; msc = msCollections[n]; n++){
                    if(aw.scope().getInstanceId().toString() in msc){
                        existsAlready = true;
                        break;
                    }
                }

                if(!existsAlready){
                    msCollections.push(msCollection);
                }
            }
        }

        for(var n = 0, msc; msc = msCollections[n]; n++){
            for(var wbl in msc){
                validMSList.push({wPos: $scope.getWblAbsPosInPixels(msc[wbl]), color: wwConsts.palette[n].value, numVal: (n + 1)});
            }
        }

        return validMSList;
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************


    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************

});
//======================================================================================================================
