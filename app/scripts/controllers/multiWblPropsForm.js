//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013)
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
ww3Controllers.controller('multiWblPropsFormCtrl', function ($scope, $log, gettext, colorService, valMod) {

    //=== PROPERTIES ================================================================
    $scope.wsFarRightPos = $(document).width() - 255;
    $scope.wsFarTopPos = 0;
    $scope.mwpHeight = $(document).height() - 200;
    $scope.mwpWidth = 250;
    $scope.inputWidth = '90%';
    $scope.inputHeight = '23px';
    $scope.propList = [];
    var wblSelectWatch;



    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Change Box
    // Toggles between simple text input or text area when double click on the writing surface.
    //========================================================================================
    $scope.changeBox = function($event, prop){
        prop.wantLargeTxt = !prop.wantLargeTxt;
        $event.stopPropagation();
    };
    //========================================================================================


    //========================================================================================
    // A watch for form visibility
    //========================================================================================
    $scope.$watch(function(){return $scope.getMWPVisibility();}, function(newVal, oldVal) {
        if(newVal == 'inline-block'){
            $scope.propList = getValidPropList();

            //Begin watching number of selected Webbles
            wblSelectWatch = $scope.$watch(function(){return $scope.getSelectedWebbles().length;}, function(newVal, oldVal) {
                if(newVal != oldVal){
                    if(newVal == 0){
                        $scope.propList = [];
                    }
                    else{
                        $scope.propList = getValidPropList();
                    }
                }
            }, true);
        }
        else if(newVal == 'none'){
            if(wblSelectWatch){
                wblSelectWatch();
            }

            $scope.wsFarRightPos = $(document).width() - 260;
            $scope.wsFarTopPos = 0;
            $scope.wsHeight = parseInt($scope.getSurfaceHeight()) - 30 + 'px';
            $scope.mwpWidth = 250;
        }
    }, true);
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Get Valid Property List
    // Picks out all slots / properties from all selected Webbles that are shared among them
    // and return it.
    //========================================================================================
    var getValidPropList = function(){
        var finalWblProps = [];

        for(var i = 0, sw; sw = $scope.getSelectedWebbles()[i]; i++){
            var wblProps = [];
            for(var slot in sw.scope().getSlots()){
                var val = sw.scope().gimme(slot);
                if(slot.search('color') != -1 && val.toString().search('rgb') != -1){
                    val = colorService.rgbStrToHex(val.toString());
                }
                else if(slot.search('top') != -1 || slot.search('left') != -1 || slot.search('font-size') != -1 || slot.search('width') != -1 || slot.search('height') != -1){
                    var valUnit = valMod.getValUnitSeparated(val);
                    var noOfDec = 2;
                    if(valUnit[1] == '%'){ noOfDec = 0; }
                    if(!isNaN(valUnit[0])){
                        val = valUnit[0].toFixed(2) + valUnit[1];
                    }
                }

                wblProps.push({key: slot, value: val, wantLargeTxt: false});
            }

            if(finalWblProps.length == 0){
                finalWblProps = wblProps;
            }
            else{
                var t;
                for(var n = 0, wp; wp = wblProps[n]; n++){
                    for(var t = 0, fwp; fwp = finalWblProps[t]; t++){
                        if(wp.key == fwp.key){
                            fwp['survivor'] = true;
                            if(fwp.value != wp.value){
                                fwp.value = '';
                            }
                            break;
                        }
                    }
                }

                var stillRemoving = true;
                while(stillRemoving){
                    stillRemoving = false;
                    for(var t = 0, fwp; fwp = finalWblProps[t]; t++){
                        if(!fwp['survivor']){
                            finalWblProps.splice(t, 1);
                            stillRemoving = true;
                            break;
                        }
                    }
                }
            }
        }

        return finalWblProps;
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Close
    // Close this form (hide it from view)
    //========================================================================================
    $scope.close = function(){
        $scope.setMWPVisibility('none');
    };
    //========================================================================================


    //========================================================================================
    // Get Input Type
    // Depending on browser and slot type the input type and size differs
    //========================================================================================
    $scope.getInputType = function(whatSlotName){
        var browser = BrowserDetect.browser;

        if(browser == 'Chrome' && whatSlotName.search('color') != -1){
            $scope.inputWidth = '24px';
            $scope.inputHeight = '24px';
            return 'color';
        }
        else{
            $scope.inputWidth = '90%';
            $scope.inputHeight = '23px';
            return 'text';
        }
    };
    //========================================================================================


    //========================================================================================
    // Push Changes
    // Push all slot changes to the Webbles selected
    //========================================================================================
    $scope.pushChanges = function(){
        for(var i = 0, sw; sw = $scope.getSelectedWebbles()[i]; i++){
            for(var n = 0, pi; pi = $scope.propList[n]; n++){
                if(pi.value != ''){
                    sw.scope().set(pi.key, pi.value);
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Push Changes
    // Push all slot changes to the Webbles selected
    //========================================================================================
    $scope.pullChanges = function(){
        $scope.propList = getValidPropList();
    };
    //========================================================================================


    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************

});
//======================================================================================================================
