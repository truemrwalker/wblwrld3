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

//===========================================================================================
// DESCRIPTION:
// This js file contains the Main app FILTERS code.
//==========================================================================================
'use strict';


//=================================================================================
// takes a language code and turn it into the readable native name of that language
//=================================================================================
ww3Filters.filter('nativeName', ['wwConsts', function (wwConsts) {
    return function (input) {
        var langNativeName = input;
        for(var i = 0; i < wwConsts.languages.length; i++){
            if(input){
                if(input.search(wwConsts.languages[i].code) != -1){
                    langNativeName = wwConsts.languages[i].NativeName;
                    break;
                }
            }
        }
        return langNativeName;
    };
}]);
//=================================================================================


//=================================================================================
// takes a language code and turn it into a readable sentence for the line
// 'Change To LANG' in the native text of that language
//=================================================================================
ww3Filters.filter('nativeString', ['wwConsts', function (wwConsts) {
    return function (input) {
        var nativeStr = wwConsts.languages[0].NativeName;

        for(var i = 0, nl; nl = wwConsts.languages[i]; i++){
            if(input){
                if(input.search(nl.code) != -1){
                    nativeStr = nl.ChangeStr;
                    break;
                }
            }
        }

        return nativeStr;
    };
}]);
//=================================================================================


//=================================================================================
// Take a menu title and recognize if it needs to be modified in any way, and if
// so, do that and return the new and improved menu title.
//=================================================================================
ww3Filters.filter('titleMod', function (gettext) {
    return function (menuItemTitle, menuItemId, extraData) {
        if(menuItemId == 'workspace'){
            var wsName = '---';
            if(extraData != undefined){
                if(extraData.name != ''){
                    wsName = extraData.name;
                }
            }

            menuItemTitle += ': ' + wsName;
        }

        return menuItemTitle;
    };
});
//=================================================================================


//=================================================================================
// Simple string formatting filter.
// Usage: {{template | stringFormat:[variable1, variable2, etc] }}
//=================================================================================
ww3Filters.filter('stringFormat', function () {
    // function _toFormattedString is based on String.js from http://ajaxcontroltoolkit.codeplex.com/SourceControl/latest#Client/MicrosoftAjax/Extensions/String.js
    // as seen in http://stackoverflow.com/questions/2534803/string-format-in-javascript
    // and then transformed into a filter as found in http://davidjs.com/2013/07/string-format-in-angularjs/
    function toFormattedString(useLocale, format, values) {
        var result = '';

        for (var i = 0; ; ) {
            // Find the next opening or closing brace
            var open = format.indexOf('{', i);
            var close = format.indexOf('}', i);
            if ((open < 0) && (close < 0)) {
                // Not found: copy the end of the string and break
                result += format.slice(i);
                break;
            }
            if ((close > 0) && ((close < open) || (open < 0))) {

                if (format.charAt(close + 1) !== '}') {
                    throw new Error('format stringFormatBraceMismatch');
                }

                result += format.slice(i, close + 1);
                i = close + 2;
                continue;
            }

            // Copy the string before the brace
            result += format.slice(i, open);
            i = open + 1;

            // Check for double braces (which display as one and are not arguments)
            if (format.charAt(i) === '{') {
                result += '{';
                i++;
                continue;
            }

            if (close < 0) throw new Error('format stringFormatBraceMismatch');

            // Find the closing brace

            // Get the string between the braces, and split it around the ':' (if any)
            var brace = format.substring(i, close);
            var colonIndex = brace.indexOf(':');
            var argNumber = parseInt((colonIndex < 0) ? brace : brace.substring(0, colonIndex), 10);

            if (isNaN(argNumber)) throw new Error('format stringFormatInvalid');

            var argFormat = (colonIndex < 0) ? '' : brace.substring(colonIndex + 1);

            var arg = values[argNumber];
            if (typeof (arg) === "undefined" || arg === null) {
                arg = '';
            }

            // If it has a toFormattedString method, call it.  Otherwise, call toString()
            if (arg['toFormattedString']) {
                result += arg['toFormattedString'](argFormat);
            } else if (useLocale && arg['localeFormat']) {
                result += arg['localeFormat'](argFormat);
            } else if (arg.format) {
                result += arg.format(argFormat);
            } else
                result += arg.toString();

            i = close + 1;
        }

        return result;
    }

    return function (/*string*/template, /*array*/values) {
        if (!values || !values.length || !template) {
            return template;
        }
        return toFormattedString(false, template, values);
    };
});
//=================================================================================


//=================================================================================
// A bitwise test filter that return true or false if bit is set or not
//=================================================================================
ww3Filters.filter('bitwiseAnd', function () {
    return function (firstNumber, secondNumber) {
        return ((parseInt(firstNumber, 10) & parseInt(secondNumber, 10)) === parseInt(secondNumber, 10));
    };
});
//=================================================================================
