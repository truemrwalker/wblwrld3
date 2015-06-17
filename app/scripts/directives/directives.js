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

//===========================================================================================
// DESCRIPTION:
// This js file contains the Main DIRECTIVES code for the core Webble World System.
//==========================================================================================
'use strict';


//=================================================================================
// Makes an element draggable
//=================================================================================
ww3Directives.directive('draggable', function() {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            var options = scope.$eval(attrs.draggable); //allow options to be passed in
            element.draggable(options);
        }
    };
});
//=================================================================================


//=================================================================================
// Makes a Webble metadata object draggable and droppable for Webble Def loading.
//=================================================================================
ww3Directives.directive('dragdropMetadata', function($log) {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            element.draggable({
                appendTo: 'body',
                cursor: 'pointer',
                cursorAt: {left: 50, top: 40},
                distance: 10,
                helper: function(){
                    return $('<div><img style="width: 50px; height: 40px; border: 1px solid #000000;" src="' + attrs['dragdropMetadata'] + '" /></div>');
                },
                opacity: 0.9,
                zIndex: 10000000
            });

            var formGotItFirst = false;
            $('.modal-wblwrldform').droppable({
                drop: function( event, ui ) {
                    formGotItFirst = true;
                }
            });

            $('.modal-backdrop').droppable({
                drop: function( event, ui ) {
                    if(!formGotItFirst){
                        if(ui.draggable.attr('id')){
                            scope.thePlatform.downloadWebbleDef(ui.draggable.attr('id'));
                            scope.thePlatform.waiting(false);
                        }
                    }
                    formGotItFirst = false;
                }
            });


        }
    };
});
//=================================================================================


//=================================================================================
// Makes an element resizable
//=================================================================================
ww3Directives.directive('resizable', function() {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            var settings = scope.$eval(attrs.resizable); //allow options to be passed in
            element.resizable(settings);
        }
    };
});
//=================================================================================

//=================================================================================
// Makes an element sortable
//=================================================================================
ww3Directives.directive('sortable', function() {
    return {
        restrict:'AC',
        link: function(scope, element, attrs) {
            var options = scope.$eval(attrs.sortable); //allow options to be passed in
            element.sortable(options);
        }
    };
});
//=================================================================================


//=================================================================================
// Makes (automatically) a $modal window draggable and resizable
// CURRENTLY NOT USED ANYWHERE
//=================================================================================
ww3Directives.directive('modalWindow', function($log, localStorageService){
    return {
        restrict: 'EA',
        link: function(scope, element) {
            var content = element.find('.modal-content');
            var formClass = element.find('.container-fluid').attr('data-formclass');
            if(!formClass){
                formClass = element.find('.container').attr('data-formclass');
            }

            if(formClass){
                content.addClass(formClass);
            }

            element.css('z-index', '100000');
        }
    }
});
//=================================================================================


//=================================================================================
// Star Rating
//=================================================================================
ww3Directives.directive('starRating', function (gettext) {
    return {
        restrict: 'A',
        template: '<ul class="rating">' +
            '<li ng-repeat="star in stars" ng-class="star" ng-click="toggle($index)" title="{{starRatingTxt[$index] | translate}}">' +
            '\u2605' +
            '</li>' +
            '</ul>',
        scope: {
            ratingValue: '=',
            max: '=',
            readonly: '@',
            onRatingSelected: '&'
        },
        link: function (scope, elem, attrs) {
            scope.starRatingTxt = [
                gettext("Terrible"),
                gettext("Very Bad"),
                gettext("Bad"),
                gettext("Could be better"),
                gettext("Fairly Ok"),
                gettext("Good"),
                gettext("Very Good"),
                gettext("Great!"),
                gettext("Amazing!"),
                gettext("Masterpiece!")
            ];

            var updateStars = function() {
                scope.stars = [];
                for (var  i = 0; i < scope.max; i++) {
                    scope.stars.push({filled: i < scope.ratingValue});
                }
            };

            scope.toggle = function(index) {
                if (scope.readonly && scope.readonly === 'true') {
                    return;
                }
                scope.ratingValue = index + 1;
                scope.onRatingSelected({rating: index + 1});
            };

            scope.$watch('ratingValue', function(oldVal, newVal) {
                if (newVal) {
                    updateStars();
                }
            });
        }
    }
});
//=================================================================================


//=================================================================================
// The Webble core directive
//=================================================================================
ww3Directives.directive('webble', function ($log, $compile, $timeout, Enum, Slot, bitflags, valMod, gettext) {
    return {
        restrict: 'A',
        controller: 'webbleCoreCtrl',
        compile: function (tElement, tAttrs) {
            return function (scope, element, attrs) {
                //=== SUPPORT PROPERTIES ================================================================
                var tempMemory = {};

                //=== METHODS & FUNCTIONS ================================================================

                //========================================================================================
                // Set CSS Style
                // This method apply a specified css style value to a specified style for a specified
                // element. The function is passed to the scope of the webble to call when slots with css
                // connections are changed
                //========================================================================================
                var setCSSStyle = function(whatElement, whatStyle, whatValue){
                    var transformSlots = [];
                    var filterSlots = [];
                    var elementName = '';

                    if(whatStyle.search(':') != -1){
                        elementName = whatStyle.substr(0, whatStyle.indexOf(':'));
                        whatStyle = whatStyle.substr(whatStyle.indexOf(':')+1);
                    }
                    if(whatStyle.search('transform') != -1 && whatStyle.search('transform-origin') == -1){
                        whatStyle = 'transform';

                        for(var slot in scope.getSlots()){
                            if(slot.search(elementName + ':transform') != -1 && slot.search('transform-origin') == -1){
                                transformSlots.push(scope.getSlot(slot));
                            }
                        }

                        whatValue = '';
                        for(var i = 0; i < transformSlots.length; i++){
                            var funcName = transformSlots[i].getName().substr(transformSlots[i].getName().lastIndexOf('-')+1);
                            var slotVal = transformSlots[i].getValue();
                            if(typeof slotVal != 'string' && isNaN(slotVal)){
                                var valStr = '';

                                if(funcName.search('matrix') != -1 && slotVal.length != undefined){
                                    for(var i = 0; i < slotVal.length; i++){
                                        valStr += slotVal[i];
                                        if((slotVal.length - 1) > i){
                                            valStr += ',';
                                        }
                                    }
                                }
                                else if(funcName == 'translate' || funcName == 'scale'){
                                    if(slotVal.x && slotVal.y){
                                        valStr = slotVal.x + ',' + slotVal.y;
                                    }
                                }
                                else if(funcName == 'translate3d' || funcName == 'scale3d'){
                                    if(slotVal.x && slotVal.y && slotVal.z){
                                        valStr = slotVal.x + ',' + slotVal.y + ',' + slotVal.z;
                                    }
                                }
                                else if(funcName == 'rotate3d'){
                                    if(slotVal.x && slotVal.y && slotVal.z && slotVal.angle){
                                        valStr = slotVal.x + ',' + slotVal.y + ',' + slotVal.z + ',' + slotVal.angle + 'deg';
                                    }
                                }
                                else if(funcName == 'skew'){
                                    if(slotVal['x-angle'] && slotVal['y-angle']){
                                        valStr = slotVal['x-angle'] + ',' + slotVal['y-angle'];
                                    }
                                }

                                if(valStr != ''){
                                    slotVal = valStr
                                }
                            }

                            if((funcName == 'rotate' || funcName == 'rotateX' || funcName == 'rotateY' || funcName == 'rotateZ' || funcName == 'skewX' || funcName == 'skewY') && slotVal.toString().search('deg') == -1){
                                slotVal = slotVal + 'deg';
                            }

                            if((funcName == 'translateX' || funcName == 'translateY' || funcName == 'translateY') && slotVal.toString().search('px') == -1){
                                slotVal = slotVal + 'px';
                            }

                            if((funcName == 'scaleX' || funcName == 'scaleY' || funcName == 'scaleZ') && slotVal == 0){
                                slotVal = 1;
                            }

                            whatValue += funcName + '(' + slotVal + ') ';
                        }
                    }
                    else if(whatStyle.search('filter') != -1){
                        whatStyle = 'filter';

                        for(var slot in scope.getSlots()){
                          if(slot.search(elementName + ':filter') != -1){
                              filterSlots.push(scope.getSlot(slot));
                          }
                        }

                        whatValue = '';
                        for(var i = 0; i < filterSlots.length; i++){
                          var funcName = filterSlots[i].getName().substr(filterSlots[i].getName().indexOf('-')+1);
                          var slotVal = filterSlots[i].getValue();
                          if(typeof slotVal != 'string' && isNaN(slotVal)){
                            var valStr = '';

                            if(funcName == 'blur'){
                                slotVal = parseFloat(slotVal) + 'px';
                            }
                            else if(funcName == 'brightness'){
                                slotVal = parseFloat(slotVal);
                            }
                            else if(funcName == 'contrast' || funcName == 'grayscale' || funcName == 'invert' || funcName == 'opacity' || funcName == 'saturate' || funcName == 'sepia'){
                                slotVal = parseFloat(slotVal) + '%';
                            }
                            else if(funcName == 'drop-shadow'){
                                slotVal = slotVal;
                            }
                            else if(funcName == 'hue-rotate'){
                              slotVal = parseFloat(slotVal) + 'deg';
                            }

                            if(valStr != ''){
                                slotVal = valStr
                            }
                          }

                          whatValue += funcName + '(' + slotVal + ') ';
                        }
                    }

                    if(whatStyle.search('transform-origin') == -1){
                        whatValue = valMod.addPxMaybe(whatStyle, whatValue)
                    }

                    try{
                        if((whatStyle == 'top' || whatStyle == 'height' || whatStyle == 'width') && whatValue.search('%') != -1){
                            var containerSize = {w: scope.getWSE() != undefined ? parseFloat(getUnits(scope.getWSE()[0], 'width').pixel) : $(document).width(), h: scope.getWSE() != undefined ? parseFloat(getUnits(scope.getWSE()[0], 'height').pixel) : $(document).height()} ;
                            var percentDuplicator = parseFloat(valMod.getValUnitSeparated(whatValue)[0]) / 100;
                            if(whatStyle != 'width'){
                                whatValue = valMod.addPxMaybe(whatStyle, (containerSize.h * percentDuplicator));
                            }
                            else{
                                whatValue = valMod.addPxMaybe(whatStyle, (containerSize.w * percentDuplicator));
                            }
                        }

                        if(BrowserDetect.browser != 'Firefox' && (whatStyle == 'filter' || whatStyle == 'perspective' || whatStyle == 'perspective-origin')){
                            whatStyle = '-webkit-' + whatStyle;
                        }

                        whatElement.css(whatStyle, whatValue);
                    }
                    catch(err){
                        $log.error(scope.strFormatFltr('setStyle failed, probably because the element was not a valid html element.\n\nError description: {0}',[err.message]));
                    }
                };
                //========================================================================================


                //========================================================================================
                // Webble Configuration
                // This method prepare the webble with all its needed element related issues, like
                // default slots, interaction balls and mouse events etc.
                //========================================================================================
                var webbleConfig = function(){
                    // Assign a function to the webble core controller that will handle css style changes
                    scope.setStyle = setCSSStyle;

                    // Add default slots
                    scope.addSlot(new Slot('root:z-index',
                        10,
                        gettext("Layer Order Index"),
                        gettext("The layer order index value (integer) which decides who's on top of who."),
                        'css',
                        undefined,
                        element
                    ));

                    scope.addSlot(new Slot('root:left',
                        20,
                        gettext("Horizontal Position"),
                        gettext("The Horizontal position (left right) of the element either on the screen or in relation to its parent element (% sign is allowed)"),
                        'css',
                        undefined,
                        element
                    ));

                    scope.addSlot(new Slot('root:top',
                        20,
                        gettext("Vertical Position"),
                        gettext("The Vertical position (up down) of the element either on the screen or in relation to its parent element (% sign is allowed)"),
                        'css',
                        undefined,
                        element
                    ));

                    scope.addSlot(new Slot('root:opacity',
                        1.0,
                        gettext("Opacity"),
                        gettext("A decimal value between 0 and 1 which describes the opacity of the element, 1 is opaque."),
                        'css',
                        undefined,
                        element
                    ));

                    scope.addSlot(new Slot('root:transform-scale',
                        [1,1],
                        gettext("Scale"),
                        gettext("The multiplier (decimal value) for the elements width and height to increase or decrease the scale of that attribute."),
                        'css',
                        {inputType: Enum.aopInputTypes.Point},
                        element
                    ));

                    scope.addSlot(new Slot('root:transform-rotate',
                        0,
                        gettext("Angle"),
                        gettext("The tilt rotate angle in degrees for the element in question."),
                        'css',
                        undefined,
                        element
                    ));

                    scope.addSlot(new Slot('autoSlotConnEnabled',
                        true,
                        gettext("Auto Slot-Conn Enabled"),
                        gettext("By default all webbles will try to auto establish a default slot connection when creating child parent relationship, if this is unchecked no such connection is made."),
                        'metadata',
                        undefined,
                        undefined
                    ));

                    //Create and Set Child Container
                    var childContainer = angular.element(document.createElement("div"));
                    childContainer.attr('id', 'wblChildContainer');
                    childContainer.css('position', 'absolute');
                    childContainer.css('left', 0 - scope.selectionBorder.width);
                    childContainer.css('top', 0 - scope.selectionBorder.width);
                    element.append(childContainer);
                    scope.$watch(function(){return scope.selectionBorder.width;}, function(newVal, oldVal) {
                        if (oldVal && newVal && (newVal !== oldVal)) {
                            childContainer.css('left', 0 - scope.selectionBorder.width);
                            childContainer.css('top', 0 - scope.selectionBorder.width);
                        }
                    }, true);
                    scope.setChildContainer(childContainer);

                    // Create Interaction objects and their Container
                    var ioContainer = angular.element(document.createElement("div"));
                    ioContainer.attr('id', 'ioContainer');
                    ioContainer.css('display', 'none');
                    element.append(ioContainer);
                    var baseWidth = parseInt(element.css('width'));
                    var baseHeight = parseInt(element.css('height'));
                    var ioColors = ['yellow','lightblue','pink','green','brown','purple','khaki','orange','red','cyanpink','marineblue','seagreen'];
                    var ioPos = [{left:-8,top:-8},{left:baseWidth-10,top:-8},{left:baseWidth-10,top:baseHeight-10},{left:-8,top:baseHeight-10},{left:8,top:-8},{left:baseWidth-10,top:8},{left:baseWidth-26,top:baseHeight-10},{left:-8,top:baseHeight-26},{left:24,top:-8},{left:baseWidth-10,top:24},{left:baseWidth-42,top:baseHeight-10},{left:-8,top:baseHeight-42}];

                    for (var i = 0; i < 12; i++){
                        var io = angular.element(document.createElement("div"));
                        io.addClass('interactionBall');
                        io.attr('ng-controller', 'InteractionObjectCtrl').attr('ng-class', 'color').attr('tooltip', '{{tooltip}}').attr('tooltip-placement', 'right');
                        io.attr('ng-style', '{"left": pos.left, "top": pos.top, "display": display}');

                        io.css('position', 'absolute').css('display', 'none');
                        $compile(io)(scope);
                        io.scope().setIndex(i);
                        io.scope().color = ioColors[i];
                        io.scope().pos.left = ioPos[i].left;
                        io.scope().pos.top = ioPos[i].top;
                        io.scope().thisIO = io;
                        io.bind('vmousedown', scope.activateInteractionObject);
                        scope.theInteractionObjects.push(io);
                        ioContainer.append(io);
                    }

                    // Create a watch for the positioning of every Interaction ball depending on visibility
                    scope.$watch(function(){return scope.getInteractionObjContainerVisibilty();}, function(newVal, oldVal) {
                        if (newVal && newVal == true) {
                            var baseWidth = parseInt(element.css('width'));
                            var baseHeight = parseInt(element.css('height'));
                            var ioPosW = ['x',baseWidth-10,baseWidth-10,'x','x',baseWidth-10,baseWidth-26,'x','x',baseWidth-10,baseWidth-42,'x'];
                            var ioPosH = ['x','x',baseHeight-10,baseHeight-10,'x','x',baseHeight-10,baseHeight-26,'x','x',baseHeight-10,baseHeight-42];
                            for (var i = 0, io; io = scope.theInteractionObjects[i]; i++){
                                if(ioPosW[i] != 'x'){
                                    io.scope().pos.left = ioPosW[i];
                                }
                                if(ioPosH[i] != 'x'){
                                    io.scope().pos.top = ioPosH[i];
                                }
                            }
                        }
                    }, true);

                    // Create a watch for the positioning of every Interaction ball depending on webble size
                    scope.$watch(function(){return [parseInt(element.css('width')), parseInt(element.css('height'))];}, function(newVal, oldVal) {
                        if (newVal && oldVal && (newVal !== oldVal)) {
                            var baseWidth = newVal[0];
                            var baseHeight = newVal[1];
                            var ioPosW = ['x',baseWidth-10,baseWidth-10,'x','x',baseWidth-10,baseWidth-26,'x','x',baseWidth-10,baseWidth-42,'x'];
                            var ioPosH = ['x','x',baseHeight-10,baseHeight-10,'x','x',baseHeight-10,baseHeight-26,'x','x',baseHeight-10,baseHeight-42];
                            for (var i = 0, io; io = scope.theInteractionObjects[i]; i++){
                                if(ioPosW[i] != 'x' && io.scope()){
                                    io.scope().pos.left = ioPosW[i];
                                }
                                if(ioPosH[i] != 'x' && io.scope()){
                                    io.scope().pos.top = ioPosH[i];
                                }
                            }
                        }
                    }, true);

                    // Create a watch for this webbles visibility
                    scope.$watch(function(){return scope.getWblVisibilty();}, function(newVal, oldVal) {
                        if(newVal == true){
                            element.css('display', 'inline');
                        }
                        else{
                            element.css('display', 'none');
                        }
                    }, true);

                    // Create a watch for this webbles interaction objects visibility
                    scope.$watch(function(){return scope.getInteractionObjContainerVisibilty();}, function(newVal, oldVal) {
                        if(newVal == true){
                            $(ioContainer).css('display', 'inline');
                        }
                        else{
                            $(ioContainer).css('display', 'none')
                        }
                    }, true);

                    // Create a watch for isBundled
                    scope.$watch(function(){return scope.getIsBundled();}, function(newVal, oldVal) {
                            if(newVal == true){
                                if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE_LOCKED, 10)) == 0){
                                    element.draggable('disable');
                                    element.unbind('vmousedown', mouseDownEventHandler);
                                }
                            }
                            else{
                                element.draggable('enable');
                                element.unbind('vmousedown', mouseDownEventHandler);
                                element.bind('vmousedown', mouseDownEventHandler);
                            }
                    }, true);


                    //========================================================================================
                    // Mouse Draggable
                    // catch draggable events for webble dragging movements
                    //========================================================================================
                    element.draggable({
                        opacity: function(){
                            if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.SELECTED, 10)) == 0 && (parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DRAG_CLONE, 10)) == 0){
                                return parseFloat(element.css('opacity')) / 2;
                            }
                            else{
                                return parseFloat(element.css('opacity'));
                            }
                        },
                        revert: function(){
                            return  scope.ctrlKeyIsDown;
                        },
                        start: function(event, ui){
                            scope.getCurrWSUndoMemory().unshift({op: Enum.undoOps.setSlot, target: scope.getInstanceId(), execData: [{slotname: 'root:left', slotvalue: scope.gimme('root:left')}, {slotname: 'root:top', slotvalue: scope.gimme('root:top')}]});
                            if(scope.altKeyIsDown && element.draggable('option', 'helper') == 'original' && element.scope().getSelectionState() != Enum.availableOnePicks_SelectTypes.AsMainClicked){
                                scope.requestWebbleSelection(element.scope().theView);
                            }

                            if (!scope.altKeyIsDown && scope.shiftKeyIsDown){
                                var childAbsPos = [];
                                for(var i = 0, kid; kid = scope.getChildren()[i]; i++){
                                    childAbsPos.push(scope.getWblAbsPosInPixels(kid));
                                }
                                tempMemory['childAbsPos'] = childAbsPos;
                            }

                            scope.setBubbleTxtVisibility(false);
                            scope.setWebbleConfig(bitflags.on(scope.getWebbleConfig(), Enum.bitFlags_WebbleConfigs.IsMoving));
                            if(element.draggable('option', 'helper') == 'original'){
                                scope.theView.css('cursor', 'pointer');
                                tempMemory['zindex'] = element.scope().gimme('root:z-index');
                                scope.setPlatformDoNotSaveUndoEnabled(true);
                                element.css('z-index', '20000');
                            }
                            else{
                                ui.helper.css('cursor', 'pointer');
                                ui.helper.css('z-index', '20000');
                            }
                        },
                        stop: function(event, ui){
                            scope.setWebbleConfig(bitflags.off(scope.getWebbleConfig(), Enum.bitFlags_WebbleConfigs.IsMoving));
                            if(element.draggable('option', 'helper') == 'original'){
                                scope.theView.css('cursor', 'arrow');
                                element.css('z-index', tempMemory['zindex'].toString());

                                if(!scope.theView.scope().getParent()){
                                    if(parseInt(element.css('left')) < 0){
                                        element.css('left', '0px');
                                    }

                                    if(parseInt(element.css('top')) < 0){
                                        element.css('top', '0px');
                                    }
                                }

                                if(parseInt(scope.theView.scope().gimme('root:left')) != parseInt(element.css('left'))){
                                    scope.theView.scope().set('root:left', element.css('left'));
                                }

                                if(parseInt(scope.theView.scope().gimme('root:top')) != parseInt(element.css('top'))){
                                    scope.theView.scope().set('root:top', element.css('top'));
                                }

                                if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DRAG_CLONE, 10)) != 0){
                                    tempMemory['leftPos'] = undefined;
                                    tempMemory['whenMovedLeftPos'] = undefined;
                                    tempMemory['whenMovedHorDir'] = undefined;
                                    tempMemory['topPos'] = undefined;
                                    tempMemory['whenMovedTopPos'] = undefined;
                                    tempMemory['whenMovedVertDir'] = undefined;
                                }

                            }
                            else{
                                ui.helper.css('cursor', 'arrow');
                                var valUnitPos = {x: valMod.getValUnitSeparated(scope.gimme('root:left')), y: valMod.getValUnitSeparated(scope.gimme('root:top'))};
                                var cssPos = {x: getUnits(ui.helper[0], 'left')[getUnitMap(valUnitPos.x[1])], y: getUnits(ui.helper[0], 'top')[getUnitMap(valUnitPos.y[1])]};
                                scope.setPlatformDoNotSaveUndoEnabled(true);
                                scope.set('root:left', cssPos.x.toFixed(2) + valUnitPos.x[1]);

                                if(valUnitPos.y[1] == '%'){
                                    var containerHeight = scope.getWSE() != undefined ? parseFloat(getUnits(scope.getWSE()[0], 'height').pixel) : $(document).height();
                                    var currentPixelValue = getUnits(ui.helper[0], 'top').pixel;
                                    cssPos.y = (currentPixelValue / containerHeight) * 100;
                                }
                                scope.setPlatformDoNotSaveUndoEnabled(true);
                                scope.set('root:top', cssPos.y.toFixed(2) + valUnitPos.y[1]);
                            }
                            $timeout(function(){scope.setPlatformDoNotSaveUndoEnabled(false);}, 200);
                        },
                        drag: function(event, ui){
                            if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.MOVE, 10)) !== 0 || scope.touchRescueFlags.interactionObjectActivated){
                                return false;
                            }
                            else{
                                // drag every selected webbles together
                                if (scope.altKeyIsDown && !scope.shiftKeyIsDown){
                                    var posDiff = {x: ui.position.left - getUnits(element[0], 'left').pixel, y: ui.position.top - getUnits(element[0], 'top').pixel};

                                    var mainSelectedWbls = [];
                                    for(var i = 0, aw; aw = scope.getActiveWebbles()[i]; i++){
                                        if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                                            if(aw.scope().getInstanceId() != scope.getInstanceId()){
                                                mainSelectedWbls.push(aw);
                                            }
                                        }
                                    }

                                    var rootMainSelectedWbls = [];
                                    for(var i = 0, msw; msw = mainSelectedWbls[i]; i++){
                                        var toproot = msw;
                                        var ancestors =  msw.scope().getAllAncestors(msw.scope().theView);
                                        for(var n = 0, a; a = ancestors[n]; n++){
                                            if (a.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                                                toproot = a;
                                            }
                                        }

                                        var wasAlreadyIn = false;
                                        for(var n = 0, rw; rw = rootMainSelectedWbls[n]; n++){
                                            if (rw.scope().getInstanceId() == toproot.scope().getInstanceId()){
                                                wasAlreadyIn = true;
                                                break;
                                            }
                                        }

                                        if(!wasAlreadyIn){
                                            rootMainSelectedWbls.push(toproot);
                                        }
                                    }

                                    var helpElement = angular.element(document.createElement("div"));
                                    helpElement.css('position', 'absolute');

                                    for(var i = 0, rmsw; rmsw = rootMainSelectedWbls[i]; i++){
                                        var cssPos = {x: getUnits(rmsw.parent()[0], 'left').pixel, y: getUnits(rmsw.parent()[0], 'top').pixel};
                                        rmsw.parent().parent().append(helpElement);
                                        helpElement.css('left', cssPos.x + posDiff.x);
                                        helpElement.css('top', cssPos.y + posDiff.y);
                                        var valUnitPos = {x: valMod.getValUnitSeparated(rmsw.scope().gimme('root:left')), y: valMod.getValUnitSeparated(rmsw.scope().gimme('root:top'))};
                                        cssPos = {x: getUnits(helpElement[0], 'left')[getUnitMap(valUnitPos.x[1])], y: getUnits(helpElement[0], 'top')[getUnitMap(valUnitPos.y[1])]};
                                        rmsw.scope().set('root:left', cssPos.x.toFixed(2) + valUnitPos.x[1]);

                                        if(valUnitPos.y[1] == '%'){
                                            var containerHeight = scope.getWSE() != undefined ? parseFloat(getUnits(scope.getWSE()[0], 'height').pixel) : $(document).height();
                                            var currentPixelValue = getUnits(helpElement[0], 'top').pixel;
                                            cssPos.y = (currentPixelValue / containerHeight) * 100;
                                        }

                                        rmsw.scope().set('root:top', cssPos.y.toFixed(2) + valUnitPos.y[1]);
                                    }
                                    helpElement.remove();
                                }
                                // drag selected parent without moving children
                                else if (!scope.altKeyIsDown && scope.shiftKeyIsDown){
                                    var helpElement = angular.element(document.createElement("div"));
                                    helpElement.css('position', 'absolute');

                                    for(var i = 0, kid; kid = scope.getChildren()[i]; i++){
                                        kid.parent().parent().append(helpElement);
                                        var currAbsPos = scope.getWblAbsPosInPixels(kid);
                                        var posDiff = {x: tempMemory['childAbsPos'][i].x - currAbsPos.x, y: tempMemory['childAbsPos'][i].y - currAbsPos.y} ;

                                        var cssPos = {x: getUnits(kid.parent()[0], 'left').pixel, y: getUnits(kid.parent()[0], 'top').pixel};
                                        helpElement.css('left', cssPos.x + posDiff.x);
                                        helpElement.css('top', cssPos.y + posDiff.y);
                                        var valUnitPos = {x: valMod.getValUnitSeparated(kid.scope().gimme('root:left')), y: valMod.getValUnitSeparated(kid.scope().gimme('root:top'))};
                                        cssPos = {x: getUnits(helpElement[0], 'left')[getUnitMap(valUnitPos.x[1])], y: getUnits(helpElement[0], 'top')[getUnitMap(valUnitPos.y[1])]};
                                        kid.scope().set('root:left', cssPos.x.toFixed(2) + valUnitPos.x[1]);

                                        if(valUnitPos.y[1] == '%'){
                                            var containerHeight = scope.getWSE() != undefined ? parseFloat(getUnits(scope.getWSE()[0], 'height').pixel) : $(document).height();
                                            var currentPixelValue = getUnits(helpElement[0], 'top').pixel;
                                            cssPos.y = (currentPixelValue / containerHeight) * 100;
                                        }

                                        kid.scope().set('root:top', cssPos.y.toFixed(2) + valUnitPos.y[1]);
                                    }
                                    helpElement.remove();
                                }

                                // If drag clone is not allowed then we update the position slots in real time together with the clone.
                                if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DRAG_CLONE, 10)) !== 0){
                                    var wblPos = {x: parseInt(scope.theView.scope().gimme('root:left')), y: parseInt(scope.theView.scope().gimme('root:top'))};
                                    var uiPos = {x: ui.position.left, y: ui.position.top}
                                    if(tempMemory['leftPos'] != undefined && wblPos.x != tempMemory['leftPos']){
                                        ui.position.left = wblPos.x;
                                        if(tempMemory['whenMovedLeftPos'] == undefined){
                                            tempMemory['whenMovedLeftPos'] = wblPos.x;
                                            tempMemory['whenMovedHorDir'] = uiPos.x - wblPos.x;
                                        }

                                        if((tempMemory['whenMovedHorDir'] < 0 && uiPos.x > wblPos.x) || (tempMemory['whenMovedHorDir'] > 0 && uiPos.x < wblPos.x)){
                                            tempMemory['leftPos'] = undefined;
                                            tempMemory['whenMovedLeftPos'] = undefined;
                                            tempMemory['whenMovedHorDir'] = undefined;
                                        }
                                    }

                                    if(tempMemory['topPos'] != undefined && wblPos.y != tempMemory['topPos']){
                                        ui.position.top = wblPos.y;
                                        if(tempMemory['whenMovedTopPos'] == undefined){
                                            tempMemory['whenMovedTopPos'] = wblPos.y;
                                            tempMemory['whenMovedVertDir'] = uiPos.y - wblPos.y;
                                        }

                                        if((tempMemory['whenMovedVertDir'] < 0 && uiPos.y > wblPos.y) || (tempMemory['whenMovedVertDir'] > 0 && uiPos.y < wblPos.y)){
                                            tempMemory['topPos'] = undefined;
                                            tempMemory['whenMovedTopPos'] = undefined;
                                            tempMemory['whenMovedVertDir'] = undefined;
                                        }
                                    }

                                    if(parseInt(scope.theView.scope().gimme('root:left')) != ui.position.left){
                                        scope.theView.scope().set('root:left', ui.position.left);
                                        tempMemory['leftPos'] = ui.position.left;
                                    }

                                    if(parseInt(scope.theView.scope().gimme('root:top')) != ui.position.top){
                                        scope.theView.scope().set('root:top', ui.position.top);
                                        tempMemory['topPos'] = ui.position.top;
                                    }
                                }

                                return true;
                            }
                        }
                    });
                    //========================================================================================


                    //========================================================================================
                    // Left Mouse Button Down
                    // catch mouse down events for selection of all sorts
                    //========================================================================================
                    var mouseDownEventHandler = function (event, ui) {
                        if(!scope.touchRescueFlags.interactionObjectActivated){
                            if(event.which === 3){
                                if((parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.POPUP_MENU, 10)) != 0){
                                    if (scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer && scope.altKeyIsDown){
                                        if(element.hasClass('context-menu-disabled')){
                                            element.contextMenu(true);
                                        }
                                    }
                                    else {
                                        if(!element.hasClass('context-menu-disabled')){
                                            element.contextMenu(false);
                                        }
                                    }
                                }
                                else if(element.hasClass('context-menu-disabled')){
                                    element.contextMenu(true);
                                }
                                event.stopPropagation();
                            }
                            else{
                                // Make sure this click is not for parent adding, if it is act upon it
                                if((parseInt(scope.getPlatformCurrentStates(), 10) & parseInt(Enum.bitFlags_PlatformStates.WaitingForParent, 10)) !== 0){
                                    scope.touchRescueFlags.interactionObjectActivated = true;
                                    scope.requestAssignParent(scope.theView);
                                    $timeout(function(){scope.touchRescueFlags.interactionObjectActivated = false;},500);
                                }
                                else{
                                    if(element.scope().getSelectionState() != Enum.availableOnePicks_SelectTypes.AsMainClicked && (parseInt(scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DRAG_CLONE, 10)) == 0){
                                        element.draggable('option', 'helper', 'clone');
                                    }
                                    else{
                                        element.draggable('option', 'helper', 'original');
                                    }

                                    for(var i = 0, aw; aw = scope.getActiveWebbles()[i]; i++){
                                        if(aw.scope().getSelectionState() != Enum.availableOnePicks_SelectTypes.AsMainClicked && aw.scope().getSelectionState() != Enum.availableOnePicks_SelectTypes.AsNotSelected){
                                            aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
                                        }
                                    }
                                }
                                event.stopPropagation();
                            }
                        }
                        else{
                            event.stopPropagation();
                        }
                    };
                    element.bind('vmousedown', mouseDownEventHandler);
                    //========================================================================================

                    // Call the webble scope to start its initiation
                    scope.wblInit(attrs.webble);
                };


                //=== WEBBLE DIRECTIVE INITIATION CODE =====================================================================
                var viewInitWatch = scope.$watch(function(){return element.parent().attr('id');}, function(newVal, oldVal, scope) {
                    if (newVal) {
                        if(element.parent().attr('id').search('workspaceSurface') != -1){
                            viewInitWatch();
                            var wIndex = parseInt(attrs.id.replace('w_', ''));

                            // Store the view appearance of this webble for fast retrieval
                            scope.theView = element.children().first();

							scope.wblIndex = wIndex;

                            // assign the element of the new webble to the webbleInstance list item for this webble as the pointer for finding and manipulating this instance
                            scope.getCurrWS().webbles[wIndex].wblElement = scope.theView;
                            webbleConfig();
                        }
                    }
                }, true);
            }
        }
    }
});
//=================================================================================


//=================================================================================
// Webble work surface
//=================================================================================
ww3Directives.directive('workSurface', function ($log, $timeout, $swipe, Enum) {
    return{
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.setWSE(element);

            // A scroll solution for the Multi webble slot/prop form
            $('.inlineWblFormWindow').on('DOMMouseScroll mousewheel', function(ev) {
                var $this = $(this),
                    scrollTop = this.scrollTop,
                    scrollHeight = this.scrollHeight,
                    height = $this.height(),
                    delta = (ev.type == 'DOMMouseScroll' ?
                        ev.originalEvent.detail * -40 :
                        ev.originalEvent.wheelDelta),
                    up = delta > 0;

                var prevent = function() {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.returnValue = false;
                    return false;
                };

                if (!up && -delta > scrollHeight - height - scrollTop) {
                    // Scrolling down, but this will take us past the bottom.
                    $this.scrollTop(scrollHeight);
                    return prevent();
                } else if (up && delta > scrollTop) {
                    // Scrolling up, but this will take us past the top.
                    $this.scrollTop(0);
                    return prevent();
                }
            });

            // Prepare for the possibility to load Webbles via file drop
            if (window.File && window.FileList && window.FileReader) {
                element.on('dragover', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                element.on('dragenter', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                element.on('drop', function(e){
                    if(e && e.originalEvent && e.originalEvent['dataTransfer']){
                        if(e.originalEvent['dataTransfer'].files.length) {
                            e.preventDefault();
                            e.stopPropagation();
                            scope.onEventHandler_FileDrop(e.originalEvent);
                        }
                    }
                });
            }
            else{
                $log.warn('This browser does not support file drop.');
            }
        }
    }
});
//=================================================================================


//=================================================================================
// Webble Platform Directive
//=================================================================================
ww3Directives.directive('webblePlatform', function ($log, Enum, getKeyByValue, gettext, isEmpty) {
    return {
        restrict: 'C',
        compile: function (tElement, tAttrs) {
            return function (scope, element, attrs) {
                scope.setPlatformElement(element);

                $.contextMenu({
                    selector: '.webble',
                    trigger: 'right',
                    build: function($trigger, e){
                        var xOffSet = 10;
                        var theActiveTrigger = $trigger;
                        if(theActiveTrigger.scope().getIsBundled() == true && (parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE_LOCKED, 10)) == 0){
                            theActiveTrigger = scope.getBundleMaster(theActiveTrigger);
                        }
                        var theWblCM = {};

                        if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.POPUP_MENU, 10)) == 0 || (scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer && scope.altKeyIsDown)){
                            if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DEFAULT_MENU, 10)) == 0 || (scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer && scope.altKeyIsDown)){
                                var dmi = {
                                    publish: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Publish),
                                    duplicate: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Duplicate),
                                    delete: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Delete),
                                    revokeParent: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.RevokeParent),
                                    connectSlots: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.ConnectSlots),
                                    assignParent: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.AssignParent),
                                    props: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Props),
                                    bundle: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Bundle),
                                    unbundle: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Unbundle),
                                    sharedDuplicate: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.SharedDuplicate),
                                    bringFwd: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.BringFwd),
                                    protect: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.Protect),
                                    addCustomSlots: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.AddCustomSlots),
									EditCustomMenuItems: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.EditCustomMenuItems),
									EditCustomInteractionObjects: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.EditCustomInteractionObjects),
                                    about: getKeyByValue(Enum.availableOnePicks_DefaultWebbleMenuTargets, Enum.availableOnePicks_DefaultWebbleMenuTargets.About)
                                };

                                if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.publish)){
                                    theWblCM[dmi.publish] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Publish};
                                }
                                if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DUPLICATE, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.duplicate)){
                                    theWblCM[dmi.duplicate] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Duplicate};
                                }
                                if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DELETE, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.delete)){
                                    theWblCM[dmi.delete] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Delete};
                                }
                                if(theActiveTrigger.scope().getParent()){
									var parentDisconnectAllowed = (parseInt(theActiveTrigger.scope().getParent().scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.CHILD_DISCONNECT, 10));
                                    if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT, 10)) == 0 && parentDisconnectAllowed == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.revokeParent)){
                                        theWblCM[dmi.revokeParent] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.RevokeParent};
                                    }
                                    if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.connectSlots)){
                                        theWblCM[dmi.connectSlots] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.ConnectSlots};
                                    }
                                }
                                else{
                                    if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PARENT_CONNECT, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.assignParent)){
                                        theWblCM[dmi.assignParent] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.AssignParent};
                                    }
                                }
                                if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PROPERTY, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.props)){
                                    theWblCM[dmi.props] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Props};
                                }
                                if(!(theActiveTrigger.scope().getIsBundled() || theActiveTrigger.scope().theWblMetadata['templateid'] == 'bundleTemplate')){
                                    if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.bundle)){
                                        theWblCM[dmi.bundle] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Bundle};
                                    }
                                }
                                else{
                                    if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.UNBUNDLE, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.unbundle)){
                                        theWblCM[dmi.unbundle] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Unbundle};
                                    }
                                }
                                if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE, 10)) == 0 && !theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.sharedDuplicate)){
                                    theWblCM[dmi.sharedDuplicate] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.SharedDuplicate};
                                }

                                if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.bringFwd)){
                                    theWblCM[dmi.bringFwd] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.BringFwd};
                                }
                                if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.protect)){
                                    theWblCM[dmi.protect] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.Protect};
                                }
                                if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.addCustomSlots)){
                                    theWblCM[dmi.addCustomSlots] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.AddCustomSlots};
                                }
								if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.EditCustomMenuItems) || (scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer && scope.altKeyIsDown)){
									theWblCM[dmi.EditCustomMenuItems] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.EditCustomMenuItems};
								}
								if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.EditCustomInteractionObjects)){
									theWblCM[dmi.EditCustomInteractionObjects] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.EditCustomInteractionObjects};
								}
                                if(!theActiveTrigger.scope().isPopupMenuItemDisabled(dmi.about)){
                                    theWblCM[dmi.about] = {name: Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt.About};
                                }
                            }

                            if(theActiveTrigger.scope().theView.scope().customMenu){
                                for(var i = 0; i < theActiveTrigger.scope().theView.scope().customMenu.length; i++){
                                    if(!theActiveTrigger.scope().isPopupMenuItemDisabled(theActiveTrigger.scope().theView.scope().customMenu[i].itemId)){
                                      theWblCM[theActiveTrigger.scope().theView.scope().customMenu[i].itemId] = {name: theActiveTrigger.scope().theView.scope().customMenu[i].itemTxt};
                                    }
                                }
                            }

							if(theActiveTrigger.scope().theView.scope().internalCustomMenu){
								for(var i = 0; i < theActiveTrigger.scope().theView.scope().internalCustomMenu.length; i++){
									if(!theActiveTrigger.scope().isPopupMenuItemDisabled(theActiveTrigger.scope().theView.scope().internalCustomMenu[i].itemId)){
										theWblCM[theActiveTrigger.scope().theView.scope().internalCustomMenu[i].itemId] = {name: theActiveTrigger.scope().theView.scope().internalCustomMenu[i].itemTxt};
									}
								}
							}

                            if((parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DEFAULT_MENU, 10)) != 0 && !theActiveTrigger.scope().theView.scope().customMenu){
                                theWblCM['none'] = {name: gettext("Default Menu Disabled")};
                            }

                            if(isEmpty(theWblCM)){
                                theWblCM['nada'] = {name: ""};
                                xOffSet = -10000;
                            }
                        }
                        else{
                            theWblCM['nada'] = {name: ""};
                            xOffSet = -10000;
                        }

                        return {
                            callback: function(key, opt){
                                var theActiveTrigger = opt.$trigger;
                                if(theActiveTrigger.scope().getIsBundled() == true && (parseInt(theActiveTrigger.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE_LOCKED, 10)) == 0){
                                    theActiveTrigger = scope.getBundleMaster(theActiveTrigger);
                                }
                                theActiveTrigger.scope().activateMenuItem(key);
                            },
                            items: theWblCM,
                            zIndex: +10000,
                            reposition: false,
                            position: function(opt, x, y){opt.$menu.css({top: y+5, left: x+xOffSet});}
                        };
                    }
                });
            }
        }
    }
});
//=================================================================================


//=================================================================================
// If enter key is pressed then fire the provided attribute method
//=================================================================================
ww3Directives.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs['ngEnter']);
                });
                event.preventDefault();
            }
        });
    };
});
//=================================================================================


//=================================================================================
// If Escape key is pressed then fire the provided attribute method
//=================================================================================
ww3Directives.directive('ngEscape', function () {
	return function (scope, element, attrs) {
		element.bind("keydown", function (event) {
			if(event.which === 27) {
				scope.$apply(function (){
					scope.$eval(attrs['ngEscape']);
				});
				event.preventDefault();
			}
		});
	};
});
//=================================================================================


//=================================================================================
// If up or down key is pressed then fire the provided attribute method
//=================================================================================
ww3Directives.directive('ngArrowKeys', function () {
    return function (scope, element, attrs) {
        element.bind("keydown", function (event) {
            if(event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40) {
                scope.$apply(function (){
                    scope.$eval(attrs['ngArrowKeys'] + '(' + event.which + ');');
                });
                event.preventDefault();
            }
        });
    };
});
//=================================================================================


//=================================================================================
// make sure the select tags 'size' value can be set dynamically.
//=================================================================================
ww3Directives.directive('ngSize', function(){
    return function(scope, elem, attrs) {
        attrs.$observe('ngSize', function(size) {
            elem.attr('size', size);
        });
    };
});
//=================================================================================


//=================================================================================
// Routes video elements after finished playing to specified method
//=================================================================================
ww3Directives.directive('afterVideoPlayed', function(){
    return {
        link: function(scope, element, attrs) {
            element.on('ended', function(e) {
                scope.$apply(attrs['afterVideoPlayed']);
            });
        }
    };
});
//=================================================================================


//=================================================================================
// Resize the element to the same size as the current window size
//=================================================================================
ww3Directives.directive('fullspread', function ($window, $parse) {
    return function (scope, element, attrs) {
        var heightModifier = 1;
        if(attrs['fullspread'] != undefined && !isNaN(attrs['fullspread'])){
            heightModifier = attrs['fullspread'];
        }

        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            element.width(newValue.w);
            element.height(newValue.h * heightModifier);

        }, true);

        w.bind('resize', function () {
            if(!scope.$$phase){ scope.$apply(); }
        });
    }
});
//=================================================================================


//=================================================================================
// Listens to and setup management for Mouse Wheel events
//=================================================================================
ww3Directives.directive('msdWheel', ['$parse', function($parse){
    return {
        restrict: 'A, C',
        link: function(scope, element, attr) {
            var expr = $parse(attr['msdWheel']),
                fn = function(event, delta, deltaX, deltaY){
                    scope.$apply(function(){
                        expr(scope, {
                            $event: event,
                            $delta: delta,
                            $deltaX: deltaX,
                            $deltaY: deltaY
                        });
                    });
                },
                hamster;

            if (typeof Hamster === 'undefined') {
                // fallback to standard wheel event
                element.bind('wheel', function(event){
                    scope.$apply(function() {
                        expr(scope, {
                            $event: event
                        });
                    });
                });
                return;
            }

            // don't create multiple Hamster instances per element
            if (!(hamster = element.data('hamster'))) {
                hamster = Hamster(element[0]);
                element.data('hamster', hamster);
            }

            // bind Hamster wheel event
            hamster.wheel(fn);

            // unbind Hamster wheel event
            scope.$on('$destroy', function(){
                hamster.unwheel(fn);
            });
        }
    };
}]);
//=================================================================================


