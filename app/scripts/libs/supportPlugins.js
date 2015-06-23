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
// This js file contains several useful javascript plugins that the application can and need
// to use. Which probably at some time should be converted into directives, filters or
// services instead when possible
//==========================================================================================
'use strict';

// ========== PROPERTIES ==========


// ========== SAFE AND ENHANCED SYSTEM INITIATION ==========
//==================================================================
// This code Avoid `console` errors in browsers that lack a console.
//==================================================================
if (!(window.console && console.log)) {
    (function () {
        var noop = function () {
        };
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}
//==================================================================


// ========== USEFUL FUNCTIONS ==========
// Place any jQuery/helper plugins in here.

//========================================================================================================
//* Project: Twitter Bootstrap Hover Drop down
//* Author: Cameron Spear
//* Contributors: Mattia Larentis
//*
//* Dependencies: Bootstrap's Dropdown plugin, jQuery
//*
//* A simple plugin to enable Bootstrap dropdowns to active on hover and provide a nice user experience.
//    *
//* License: MIT
//*
//* http://cameronspear.com/blog/twitter-bootstrap-dropdown-on-hover-plugin/
//========================================================================================================
;(function($, window, undefined) {
    // outside the scope of the jQuery plugin to
    // keep track of all dropdowns
    var $allDropdowns = $();

    // if instantlyCloseOthers is true, then it will instantly
    // shut other nav items when a new one is hovered over
    $.fn.dropdownHover = function(options) {

        // the element we really care about
        // is the dropdown-toggle's parent
        $allDropdowns = $allDropdowns.add(this.parent());


        return this.each(function() {
            var $this = $(this),
                $parent = $this.parent(),
                defaults = {
                    delay: 100,
                    instantlyCloseOthers: true
                },
                data = {
                    delay: $(this).data('delay'),
                    instantlyCloseOthers: $(this).data('close-others')
                },
                settings = $.extend(true, {}, defaults, options, data),
                timeout;

            $parent.hover(function(event) {
                // so a neighbor can't open the dropdown
                if(!$parent.hasClass('open') && !$this.is(event.target)) {
                    return true;
                }

                if(settings.instantlyCloseOthers === true)
                    $allDropdowns.removeClass('open');

                window.clearTimeout(timeout);
                $parent.addClass('open');

                //M. Kuwahara added this to make sure the menu close at click
                //---------------------------------------------------------
                $parent.find('.menuItemText').click(function() {
                    $allDropdowns.removeClass('open');
                });
                //---------------------------------------------------------

            }, function() {
                timeout = window.setTimeout(function() {
                    $parent.removeClass('open');
                }, settings.delay);
            });

            // this helps with button groups!
            $this.hover(function() {
                if(settings.instantlyCloseOthers === true)
                    $allDropdowns.removeClass('open');

                window.clearTimeout(timeout);
                $parent.addClass('open');
            });

            // handle submenus
            $parent.find('.dropdown-submenu').each(function(){
                var $this = $(this);
                var subTimeout;
                $this.hover(function() {
                    window.clearTimeout(subTimeout);
                    $this.children('.dropdown-menu').show();
                    // always close submenu siblings instantly
                    $this.siblings().children('.dropdown-menu').hide();
                }, function() {
                    var $submenu = $this.children('.dropdown-menu');
                    subTimeout = window.setTimeout(function() {
                        $submenu.hide();
                    }, settings.delay);
                });
            });
        });
    };

    $(document).ready(function() {
        // apply dropdownHover to all elements with the data-hover="dropdown" attribute
        $('[data-hover="dropdown"]').dropdownHover();
    });
})(jQuery, this);
//========================================================================================================


//========================================================================================================
// Launch and Cancel Fullscreen
//========================================================================================================
function toggleFullScreen() {
    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}
//========================================================================================================


//========================================================================================================
// Browser information
//========================================================================================================
var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++)	{
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        { 	string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {		// for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        { 		// for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
            string: navigator.userAgent,
            subString: "iPhone",
            identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]

};
BrowserDetect.init();
//========================================================================================================


//========================================================================================================
// Get style value in specified unit
//========================================================================================================
//(function(){

// pass to string.replace for camel to hyphen
var hyphenate = function(a, b, c){
    return b + "-" + c.toLowerCase();
};

// get computed style property
var getStyle = function(target, prop){
    if(window.getComputedStyle){ // gecko and webkit
        prop = prop.replace(/([a-z])([A-Z])/, hyphenate);  // requires hyphenated, not camel
        return window.getComputedStyle(target, null).getPropertyValue(prop);
    }
    if(target.currentStyle){
        return target.currentStyle[prop];
    }
    return target.style[prop];
};

var getUnitMap = function(cssUnit){
    var map = {  // list of all units and their identifying string
        pixel : "px",
        percent : "%",
        inch: "in",
        cm : "cm",
        mm : "mm",
        point : "pt",
        pica : "pc",
        em : "em",
        ex : "ex"
    };

    if(!cssUnit){
        return map;
    }
    else{
        for(var item in map){
            if(map[item] == cssUnit){
                return item;
            }
        }
    }
    return undefined;
};

// get object with units
var getUnits = function(target, prop){

    var baseline = 100;  // any number serves
    var item;  // generic iterator

    var map = {  // list of all units and their identifying string
        pixel : "px",
        percent : "%",
        inch: "in",
        cm : "cm",
        mm : "mm",
        point : "pt",
        pica : "pc",
        em : "em",
        ex : "ex"
    };

    var factors = {};  // holds ratios
    var units = {};  // holds calculated values

    var value = getStyle(target, prop);  // get the computed style value
    var numeric = value.match(/-?\d+/);  // get the numeric component (including negative numbers)

    if(numeric === null) {  // if match returns null, throw error...  use === so 0 values are accepted
        throw "Invalid property value returned";
    }
    numeric = numeric[0];  // get the string

    var unit = value.match(/\D+$/);  // get the existing unit
    unit = (unit == null) ? map.pixel : unit[0]; // if its not set, assume px - otherwise grab string

    var activeMap;  // a reference to the map key for the existing unit
    for(item in map){
        if(map[item] == unit){
            activeMap = item;
            break;
        }
    }
    if(!activeMap) { // if existing unit isn't in the map, throw an error
        throw "Unit not found in map";
    }

    var temp = document.createElement("div");  // create temporary element
    temp.style.overflow = "hidden";  // in case baseline is set too low
    temp.style.visibility = "hidden";  // no need to show it

    target.parentElement.appendChild(temp); // insert it into the parent for em and ex

    for(item in map){  // set the style for each unit, then calculate it's relative value against the baseline
        temp.style.width = baseline + map[item];
        factors[item] = baseline / temp.offsetWidth;
    }

    for(item in map){  // use the ratios figured in the above loop to determine converted values
        units[item] = numeric * (factors[item] * factors[activeMap]);
    }

    target.parentElement.removeChild(temp);  // clean up

    return units;  // returns the object with converted unit values...

};

//    // expose
//    window.getUnits = this.getUnits = getUnits;
//})();
//========================================================================================================
