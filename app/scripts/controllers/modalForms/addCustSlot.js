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
// ADD CUSTOM SLOT FORM CONTROLLER
// This controls the Webbles add custom slots form
//====================================================================================================================
ww3Controllers.controller('AddCustomSlotSheetCtrl', function ($scope, $modalInstance, $log, $timeout, gettext, Slot, wblView, mathy, strCatcher) {

    //=== PROPERTIES ================================================================
    var thisWbl = wblView;

    $scope.formitem = {
        sa: {
            nsName: '',
            nsValue: ''
        },
        css: {
            elements: [{e: null, v: 'none', n: gettext("None")}],
            selectedElement: '',
            elementName: '',
            elementAttribute: ['---'],
            selectedElementAttribute: '',
            nsFullName: ''
        },
        merge: {
            nsName: '',
            slotList: [],
            selectedSlots: []
        }
    };

    $scope.tooltip = {
        sa: {
            nsName: gettext("The name that will identify the new custom slot"),
            nsValue: gettext("The initiation value of the slot, may be left empty")
        },
        css: {
            elements: gettext("These are the visual elements found within this Webble and whose css attributes can be turned into slots"),
            elementName: gettext("This is the id of this visual element, which is also the first name of the new slot"),
            elementAttribute: gettext("These are the available CSS attributes for the selected visual element"),
            nsFullName: gettext("This is the full name for the new slot")
        },
        merge: {
            nsName: gettext("The name that will identify the new custom slot"),
            slotlist: gettext("Select the slots you also want combined into a combo slot.")
        }
    };

    // Available CSS Properties
    var cssAttributes = [
        'align-content',
        'align-items',
        'align-self',
        //'animation',
        //'animation-delay',
        //'animation-direction',
        //'animation-duration',
        //'animation-fill-mode',
        //'animation-iteration-count',
        //'animation-name',
        //'animation-play-state',
        //'animation-timing-function',
        'backface-visibility',
        'background',
        'background-attachment',
        'background-clip',
        'background-color',
        'background-image',
        'background-origin',
        'background-position',
        'background-repeat',
        'background-size',
        'border',
        'border-bottom',
        'border-bottom-color',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
        'border-bottom-style',
        'border-bottom-width',
        'border-collapse',
        'border-color',
        'border-image',
        'border-image-outset',
        'border-image-repeat',
        'border-image-slice',
        'border-image-source',
        'border-image-width',
        'border-left',
        'border-left-color',
        'border-left-style',
        'border-left-width',
        'border-radius',
        'border-right',
        'border-right-color',
        'border-right-style',
        'border-right-width',
        'border-spacing',
        'border-style',
        'border-top',
        'border-top-color',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-top-style',
        'border-top-width',
        'border-width',
        'bottom',
        //'box-decoration-break',
        'box-shadow',
        //'box-sizing',
        //'break-after',
        //'break-before',
        //'break-inside',
        'caption-side',
        'clear',
        'clip',
        'color',
        'column-count',
        //'column-fill',
        'column-gap',
        'column-rule',
        'column-rule-color',
        'column-rule-style',
        'column-rule-width',
        'column-span',
        'column-width',
        'columns',
        //'content',
        //'counter-increment',
        //'counter-reset',
        'cursor',
        //'direction',
        //'display',
        //'empty-cells',
        'filter-blur',
        'filter-brightness',
        'filter-contrast',
        'filter-drop-shadow',
        'filter-grayscale',
        'filter-hue-rotate',
        'filter-invert',
        'filter-opacity',
        'filter-saturate',
        'filter-sepia',
        //'flex',
        //'flex-basis',
        //'flex-direction',
        //'flex-flow',
        //'flex-grow',
        //'flex-shrink',
        //'flex-wrap',
        'float',
        'font',
        'font-family',
        //'font-feature-settings',
        //'font-kerning',
        //'font-language-override',
        'font-size',
        'font-size-adjust',
        //'font-stretch',
        'font-style',
        //'font-synthesis',
        'font-variant',
        //'font-variant-alternates',
        //'font-variant-caps',
        //'font-variant-east-asian',
        //'font-variant-ligatures',
        //'font-variant-numeric',
        //'font-variant-position',
        'font-weight',
        //'hanging-punctuation',
        'height',
        //'hyphens',
        //'icon',
        //'image-orientation',
        //'image-rendering',
        //'image-resolution',
        //'ime-mode',
        //'justify-content',
        'left',
        'letter-spacing',
        //'line-break',
        'line-height',
        'list-style',
        'list-style-image',
        'list-style-position',
        'list-style-type',
        'margin',
        'margin-bottom',
        'margin-left',
        'margin-right',
        'margin-top',
        //'mark',
        //'mark-after',
        //'mark-before',
        //'marks',
        //'mask',
        //'mask-type',
        'max-height',
        'max-width',
        'min-height',
        'min-width',
        //'nav-down',
        //'nav-index',
        //'nav-left',
        //'nav-right',
        //'nav-up',
        //'object-fit',
        //'object-position',
        'opacity',
        //'order',
        //'orphans',
        'outline',
        'outline-color',
        'outline-offset',
        'outline-style',
        'outline-width',
        'overflow',
        //'overflow-wrap',
        'overflow-x',
        'overflow-y',
        'padding',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'padding-top',
        //'page-break-after',
        //'page-break-before',
        //'page-break-inside',
        'perspective',
        'perspective-origin',
        //'phonemes',
        'position',
        //'quotes',
        'resize',
        //'rest',
        //'rest-after',
        //'rest-before',
        'right',
        //'tab-size',
        //'table-layout',
        'text-align',
        //'text-align-last',
        //'text-combine-upright',
        'text-decoration',
        //'text-decoration-color',
        //'text-decoration-line',
        //'text-decoration-style',
        'text-indent',
        //'text-justify',
        //'text-orientation',
        //'text-overflow',
        'text-shadow',
        //'text-transform',
        //'text-underline-position',
        'top',
        'transform-rotate',
        'transform-skewX',
        'transform-skewY',
        'transform-rotateX',
        'transform-rotateY',
        'transform-rotateZ',
        'transform-scaleX',
        'transform-scaleY',
        'transform-scaleZ',
        'transform-translateX',
        'transform-translateY',
        'transform-translateZ',
        //'transform',
        'transform-origin',
        //'transform-style',
        'transition',
        'transition-delay',
        'transition-duration',
        'transition-property',
        'transition-timing-function',
      //  'unicode-bidi',
        'vertical-align',
        'visibility',
      //  'voice-balance',
      //  'voice-duration',
      //  'voice-pitch',
      //  'voice-pitch-range',
      //  'voice-rate',
      //  'voice-stress',
      //  'voice-volume',
        'white-space',
      //  'widows',
        'width',
        'word-break',
        'word-spacing',
        'word-wrap',
      //  'writing-mode',
        'z-index',
    ];

    // Form validation error message
    $scope.formProps = {
      errorMsg: '',
      errorMsgColor: 'red'
    };


    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Element Change
    // When the select list for elements change this function is triggered
    //========================================================================================
    $scope.elementChange = function(){
        if($scope.formitem.css.selectedElement.v == 'none'){
            $scope.formitem.css.elementName = '';
            $scope.formitem.css.elementAttribute = ['---'];
            $scope.formitem.css.selectedElementAttribute = $scope.formitem.css.elementAttribute[0];
            $scope.formProps.errorMsg = '';
            $scope.formProps.errorMsgColor = 'red';
        }
        else{
            $scope.formitem.css.elementName = $scope.formitem.css.selectedElement.v;
            $scope.formitem.css.elementAttribute = $scope.formitem.css.elementAttribute.concat(cssAttributes);
            $scope.formitem.css.selectedElementAttribute = $scope.formitem.css.elementAttribute[0];
            $scope.formProps.errorMsg = 'Note: All CSS Attributes does not have effect on every type of Element. And which value that is valid for each attribute depends on the attribute. Some CSS attribute also require other attributes in order to work properly. Read more about CSS at w3schools.com';
            $scope.formProps.errorMsgColor = 'blue';
        }
    };
    //========================================================================================


    //========================================================================================
    // Element Attribute Change
    // When the select list for elements change this function is triggered
    //========================================================================================
    $scope.elementAttributeChange = function(){
        if($scope.formitem.css.selectedElementAttribute == '---'){
            $scope.formitem.css.nsFullName = '';
        }
        else{
            $scope.formitem.css.nsFullName = $scope.formitem.css.elementName + ':' + $scope.formitem.css.selectedElementAttribute;
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************


    //========================================================================================
    // Get Available Elements
    // Returns all html elements within this Webble for display on drop-down list.
    //========================================================================================
    var getAvailableElements = function(){
        var aeList = [];
        var tagName = thisWbl.parent().get(0).tagName;
        var elmId = thisWbl.parent().attr('id');
        aeList.push({e: thisWbl.parent(), v: 'root', n: tagName + '[Webble Root]'});

        var index = 0;
        thisWbl.find('*').addBack().each(function(){
            var tagName = $(this).get(0).tagName;
            var elmId = $(this).attr('id');
            if(!elmId){
                index++;
                elmId = 'myElement' + index + '_' + tagName;
                $(this).attr('id', elmId);
            }
            aeList.push({e: $(this), v: elmId, n: tagName + '[' + elmId + ']'});
        });

        return aeList;
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
        if (result == 'submit') {
            var sltNm = '';
            var sltVl = '';
            var sltElmnt = undefined;
            var sltCtgr = 'custom';

            if($scope.formitem.sa.nsName != ''){
                sltNm = $scope.formitem.sa.nsName;
                sltVl = $scope.formitem.sa.nsValue;
            }
            else if($scope.formitem.css.nsFullName != ''){
                sltNm = $scope.formitem.css.nsFullName;
                sltElmnt = $scope.formitem.css.selectedElement.e;
                sltCtgr = 'custom-css';
                var cssAttr = $scope.formitem.css.selectedElementAttribute;

                if(cssAttr.search('transform') != -1){
                    sltVl =  mathy.getRotationDegrees(sltElmnt);
                }
                else{
                    sltVl = sltElmnt.css(cssAttr);
                }
            }
            else if($scope.formitem.merge.nsName != ''){
                sltNm = $scope.formitem.merge.nsName;
                var sltVl = $scope.formitem.merge.selectedSlots;
                var sltCtgr = 'custom-merged';
            }

            if(sltNm != ''){
                if (sltNm in thisWbl.scope().getSlots()){
                  $log.log(sltNm+"!!!");
                    $scope.formProps.errorMsgColor = 'red';
                    $scope.formProps.errorMsg = gettext("A webble with that name already exist, please come up with a new name.");
                    if(!$scope.$$phase){ $scope.$apply(); }
                    $timeout(function(){$scope.formProps.errorMsg = ''; if(!$scope.$$phase){ $scope.$apply(); }}, 5000);
                    return;
                }

                var customDispInfo = strCatcher.getAutoGeneratedDisplayInfo(sltNm);
                var theNewSlot = new Slot(sltNm,
                    sltVl,
                    customDispInfo.name,
                    customDispInfo.desc,
                    sltCtgr,
                    undefined,
                    sltElmnt
                );
                theNewSlot.setIsCustomMade(true);
                thisWbl.scope().addSlot(theNewSlot);

                $modalInstance.close(true);
            }
            else{
                $scope.formProps.errorMsgColor = 'red';
                $scope.formProps.errorMsg = gettext("There is nothing to submit, so what are you trying to do?");
                if(!$scope.$$phase){ $scope.$apply(); }
                $timeout(function(){$scope.formProps.errorMsg = ''; if(!$scope.$$phase){ $scope.$apply(); }}, 3000);
            }
        }
        else{
            $modalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    $scope.formitem.css.elements = $scope.formitem.css.elements.concat(getAvailableElements());
    $scope.formitem.css.selectedElement = $scope.formitem.css.elements[0];
    $scope.formitem.css.selectedElementAttribute = $scope.formitem.css.elementAttribute[0];
    angular.forEach(thisWbl.scope().getSlots(), function (value, key) {
        if(!value.getValue() || !(value.getValue().toString().search('=') != -1 || value.getCategory() == 'custom-merged')){
            this.push(key);
        }
    }, $scope.formitem.merge.slotList);
});
//======================================================================================================================
