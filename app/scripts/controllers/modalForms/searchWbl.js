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
// SEARCH WEBBLE FORM CONTROLLER
// This controls the form for browsing and searching for Webbles online
//====================================================================================================================
ww3Controllers.controller('searchWblSheetCtrl', function ($scope, $window, $modalInstance, $modal, $log, $http, $location, $timeout, dbService, gettext, Enum, platformScope, jsonQuery, appPaths) {

    //=== PROPERTIES ================================================================
    $scope.thePlatform = platformScope;

    // Form content needed for proper processing
    $scope.formItems = {
        noOfExistingWbls: '',
        searchSuggestions: [gettext("basic"), gettext("time"), gettext("text"), gettext("chart"), gettext("game"), gettext("color"), gettext("xml")],
        searchStr: '',
        sortedBy: 'rate',
        maxRate: 10,
        isReversed: true,
        searchResult: [],
        typeAheadResult: [],
        pageViewResult: [],
        selectedWbl: -1,
        currentUser: ($scope.thePlatform.user != undefined && $scope.thePlatform.user.username) ? $scope.thePlatform.user.username : 'guest',
        searchCriteria: '',
        searchStrResult: '',
        totalItems: 0,
        currentPage: 1,
        itemsPerPage: 25
    };

    $scope.textParts = {
        searchBoxTitle: gettext("Search"),
        noOfWebblesTxt: gettext("The Number of Available Webbles Right Now:"),
        notAvailable: 'N/A',
        resultTitle: gettext("Result: "),
        suggestionTxt: gettext("A variety of Webbles that might be of interest."),
        searchResultTxt: gettext("found by free text search of all fields containing search string "),
        starRatingTxt: [
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
        ],
        rateTxtVoters: gettext("votes"),
        next: gettext("Next"),
        prev: gettext("Previous"),
        noTrustIconInfo: gettext("This Webble is developed by a group or individual ouside your circle of trust."),
        haveTrustIconInfo: gettext("This Webble is developed by a group inside your circle of trust.")
    };

    // Form validation error message
    $scope.errorMsg = '';

    // help props
    var latestSearchStr = '';
    var locationSearchWSMemo;

    //=== EVENT HANDLERS =====================================================================


    //========================================================================================
    // Load Selected
    // When hitting ENTER key and the search is not filled in then maybe the user wants to
    // load the selected Webble instead if such exist.
    //========================================================================================
    $scope.loadSelected = function(){
        if($scope.formItems.searchStr == '' && $scope.formItems.selectedWbl > -1){
            $scope.close('submit');
        }
        $scope.formItems.searchStr = '';
    };
    //========================================================================================


    //========================================================================================
    // Arrow Key Pressed
    // When hitting any ARROW key the selected Webble or page should change.
    //========================================================================================
    $scope.arrowKeyPressed = function(key){
		if(!$('#searchBox').is(':focus')){
			if(key == 38 || key == 40){
				var nextItem = key == 40 ? 1 : (-1);
				var nextSelectedPageViewItem = $scope.formItems.selectedWbl - (($scope.formItems.currentPage - 1) * $scope.formItems.itemsPerPage) + nextItem;

				if($scope.formItems.selectedWbl == -1){
					nextSelectedPageViewItem = 0;
				}

				if(nextSelectedPageViewItem < $scope.formItems.pageViewResult.length && nextSelectedPageViewItem >= 0){
					for(var i = 0, wbl; wbl = $scope.formItems.pageViewResult[i]; i++){
						wbl['selectColor'] = 'transparent';
					}

					$scope.formItems.pageViewResult[nextSelectedPageViewItem].selectColor = '#FFDB58';
					$scope.formItems.selectedWbl = (($scope.formItems.currentPage - 1) * $scope.formItems.itemsPerPage) + nextSelectedPageViewItem;
					$('.modal').scrollTop(230 * nextSelectedPageViewItem);
				}
			}
			else{
				var nextPage = key == 39 ? 1 : (-1);
				var nextSelectedPage = $scope.formItems.currentPage + nextPage;

				if(nextSelectedPage <= $scope.formItems['numPages'] && nextSelectedPage >= 1){
					for(var i = 0, wbl; wbl = $scope.formItems.pageViewResult[i]; i++){
						wbl['selectColor'] = 'transparent';
					}
					$scope.formItems.currentPage = nextSelectedPage;
					$scope.pageSelect($scope.formItems.currentPage);
				}
			}
		}
    };
    //========================================================================================



    //========================================================================================
    // Make Auto Search
    // On click at one of the suggested search words, fire a search using that word.
    //========================================================================================
    $scope.makeAutoSearch = function(whatSearchTxt){
        $scope.search(true, whatSearchTxt);
    };
    //========================================================================================


    //========================================================================================
    // Select Webble
    // On click at one of the Webbles it becomes selected
    //========================================================================================
    $scope.selectWbl = function(wblListIndex){
        for(var i = 0, wbl; wbl = $scope.formItems.pageViewResult[i]; i++){
            wbl['selectColor'] = 'transparent';
        }
        $scope.formItems.pageViewResult[wblListIndex].selectColor = '#FFDB58';
        $scope.formItems.selectedWbl = (($scope.formItems.currentPage - 1) * $scope.formItems.itemsPerPage) + wblListIndex;

        if(!locationSearchWSMemo){
            var pathQuery = $location.search();
            if(pathQuery.workspace){
                locationSearchWSMemo = pathQuery.workspace;
                $location.search('workspace', null);
            }
        }

        $location.search('webble', $scope.formItems.searchResult[$scope.formItems.selectedWbl].webble.defid);
    };
    //========================================================================================


    //========================================================================================
    // Mouse Enter Leave
    // Regulates the background color of the webble metadata based on mouse enter or leave.
    //========================================================================================
    $scope.mouseEnterLeave = function(index, isEnter){
        if($scope.formItems.selectedWbl !== (($scope.formItems.currentPage - 1) * $scope.formItems.itemsPerPage) + index){
            if(isEnter){
                $scope.formItems.pageViewResult[index].selectColor = '#FFE5B4';
            }
            else{
                $scope.formItems.pageViewResult[index].selectColor = 'transparent';
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Resort
    // Sorts the array of Webbles in the search result list according to the selected
    // order by criteria.
    //========================================================================================
    $scope.reSort = function(){
        if(latestSearchStr != 'aperitifPack'){
            $scope.search(true, latestSearchStr);
        }
        else{
            if($scope.formItems.sortedBy == 'name'){
                $scope.formItems.searchResult.sort(compareName);
            }
            else if($scope.formItems.sortedBy == 'rate'){
                $scope.formItems.searchResult.sort(compareRate);
            }
            else if($scope.formItems.sortedBy == 'developer'){
                $scope.formItems.searchResult.sort(compareDev);
            }
            else if($scope.formItems.sortedBy == 'date'){
                $scope.formItems.searchResult.sort(compareDate);
            }

            if($scope.formItems.isReversed){
                $scope.formItems.searchResult.reverse();
            }

            $scope.formItems.currentPage = 1;
            $scope.formItems.pageViewResult = $scope.formItems.searchResult.length < $scope.formItems.itemsPerPage ? $scope.formItems.searchResult : $scope.formItems.searchResult.slice(0, $scope.formItems.itemsPerPage);

            if($scope.formItems.pageViewResult.length > 0){
                $scope.selectWbl(0);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Toggle Reverse
    // reverse the current list of webbles
    //========================================================================================
    $scope.toggleReverse = function(){
        if(latestSearchStr != 'aperitifPack'){
            $scope.search(true, latestSearchStr);
        }
        else{
            $scope.formItems.searchResult.reverse();
            $scope.formItems.currentPage = 1;
            $scope.formItems.pageViewResult = $scope.formItems.searchResult.length < $scope.formItems.itemsPerPage ? $scope.formItems.searchResult : $scope.formItems.searchResult.slice(0, $scope.formItems.itemsPerPage);

            if($scope.formItems.pageViewResult.length > 0){
                $scope.selectWbl(0);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Page Select
    // When user selects a page this event handler is fired to go and get the items for that
    // page
    //========================================================================================
    $scope.pageSelect = function(){
        var page = $scope.formItems.currentPage;
        var start = (page - 1) * $scope.formItems.itemsPerPage;
        for(var i = 0, wbl; wbl = $scope.formItems.pageViewResult[i]; i++){
            wbl['selectColor'] = 'transparent';
        }
        $scope.formItems.selectedWbl = -1;

        if(start == $scope.formItems.searchResult.length){
            $http.get('/api/webbles?limit=' + $scope.formItems.itemsPerPage + '&orderby=' + getSortStr() + '&start=' + (page - 1) + '&q=' + latestSearchStr + '&verify=1').then(function(resp){
                for(var i = 0, wbl; wbl = resp.data[i]; i++){
                    wbl['selectColor'] = 'transparent';
                    wbl.rating = parseInt(wbl.rating);
                    wbl['rateShow'] = true;
					wbl['socialMediaUrl'] = 'https://wws.meme.hokudai.ac.jp/#app?webble=' + wbl.webble.defid;
					wbl['socialMediaModelName'] = 'Cool Webble, ' + wbl.webble.displayname + ', found in Webble World. Check it out!';
                }

                $scope.formItems.searchResult = $scope.formItems.searchResult.concat(resp.data);

                if($scope.formItems.searchResult.length == ($scope.formItems['numPages'] * $scope.formItems.itemsPerPage)){
                    $scope.formItems.totalItems = $scope.formItems.searchResult.length + $scope.formItems.itemsPerPage + 1;
                    $scope.formItems.searchCriteria = $scope.formItems.searchResult.length + '+ ' + $scope.textParts.searchResultTxt;
                }
                else if(resp.data.length < $scope.formItems.itemsPerPage && page == ($scope.formItems['numPages'] - 1)){
                    $scope.formItems.totalItems = $scope.formItems.searchResult.length;
                    $scope.formItems.searchCriteria = $scope.formItems.searchResult.length + ' ' + $scope.textParts.searchResultTxt;
                }

                $scope.formItems.pageViewResult = resp.data;

            });
        }
        else{
            $scope.formItems.pageViewResult = $scope.formItems.searchResult.slice(start, (start + $scope.formItems.itemsPerPage));
        }
    };
    //========================================================================================

    //    copyPublishedTemplateAsMyUnpublishedTemplate
//    jsonQuery.allValByKey(wbl.webble, 'webble').length;

    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Compare Name
    // Sort functions for Display name
    //========================================================================================
    var compareName = function(a,b) {
        if (a.webble.displayname > b.webble.displayname)
            return 1;
        if (a.webble.displayname < b.webble.displayname)
            return -1;
        return 0;
    };
    //========================================================================================


    //========================================================================================
    // Compare Rating
    // Sort functions for user ratings
    //========================================================================================
    var compareRate = function(a,b) {
        if (a.rating > b.rating)
            return -1;
        if (a.rating < b.rating)
            return 1;
        return 0;
    };
    //========================================================================================


    //========================================================================================
    // Compare Developer
    // Sort functions for Developer's name
    //========================================================================================
    var compareDev = function(a,b) {
        if (a.webble.author.toLowerCase() < b.webble.author.toLowerCase())
            return -1;
        if (a.webble.author.toLowerCase() > b.webble.author.toLowerCase())
            return 1;
        return 0;
    };
    //========================================================================================


    //========================================================================================
    // Compare Date
    // Sort functions for date of publish
    //========================================================================================
    var compareDate = function(a,b) {
        if (a.updated < b.updated)
            return -1;
        if (a.updated > b.updated)
            return 1;
        return 0;
    };
    //========================================================================================


    //========================================================================================
    // Get Sort String
    // Get a query string for sorting (orderby) based on current form setting.
    //========================================================================================
    var getSortStr = function() {
        var sortStr = '';

        if($scope.formItems.sortedBy == 'name'){
            sortStr = 'displayname';
        }
        else if($scope.formItems.sortedBy == 'rate'){
            sortStr = 'rating';
        }
        else if($scope.formItems.sortedBy == 'developer'){
            sortStr = 'author';
        }
        else if($scope.formItems.sortedBy == 'date'){
            sortStr = 'updated';
        }

        if($scope.formItems.isReversed){
            sortStr = '-' + sortStr;
        }

        return sortStr;
    };
    //========================================================================================


    //========================================================================================
    // Get Aperitif Webbles
    // Get a small list of high ranked webbles for pleasing display.
    //========================================================================================
    var getAperitifWebbles =  function() {
        return $http.get('/api/webbles?limit=' + Math.floor($scope.formItems.itemsPerPage / 2)  + '&orderby=-rating' + '&verify=1').then(function(resp){
            $scope.formItems.searchCriteria = $scope.textParts.suggestionTxt;

            for(var i = 0, mru; mru = resp.data[i]; i++){
                mru['selectColor'] = 'transparent';
                mru.rating = parseInt(mru.rating);
                mru['rateShow'] = true;
				mru['socialMediaUrl'] = 'https://wws.meme.hokudai.ac.jp/#app?webble=' + mru.webble.defid;
				mru['socialMediaModelName'] = 'Cool Webble, ' + mru.webble.displayname + ', found in Webble World. Check it out!';
            }

            $scope.formItems.searchResult = resp.data;
            $scope.formItems.totalItems = $scope.formItems.searchResult.length;
            $scope.formItems.currentPage = 1;
            $scope.formItems.pageViewResult = $scope.formItems.searchResult;
            latestSearchStr = 'aperitifPack';

            $('#searchBox').focus();
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
    // Get Webbles
    // Get Webble names for auto fill-in as a help for searching
    //========================================================================================
    $scope.getWebbles =  function(queryStr) {
        return $http.get('/api/webbles?limit=' + $scope.formItems.itemsPerPage + '&orderby=' + getSortStr() + '&q=' + queryStr + '&verify=1').then(function(resp){
            $scope.formItems.typeAheadResult = resp.data;
            return resp.data;
        });
    };
    //========================================================================================


    //========================================================================================
    // Clear Type Ahead List
    // to make sure that
    //========================================================================================
    $scope.clearTypeAheadList =  function() {
        var leftOver = [];
        for(var i = 0, tal; tal = $scope.formItems.typeAheadResult[i]; i++){
            if($scope.formItems.searchStr == tal.webble.displayname){
                leftOver.push(tal);
            }
        }
        $scope.formItems.typeAheadResult = leftOver;
    };
    //========================================================================================


    //========================================================================================
    // Is Owned
    // checks weather the current selected is one that the current user published or not
    // If so, that user will be allowed to delete the Webble
    //========================================================================================
    $scope.isOwned = function(index){
        if(index >= 0 && $scope.formItems.searchResult.length > 0){
            if(($scope.formItems.currentUser == $scope.formItems.searchResult[index].webble.author) && ($scope.formItems.searchResult[index].webble.defid != $scope.formItems.searchResult[index].webble.templateid)){
                return true;
            }
        }

        return false;
    };
    //========================================================================================


    //========================================================================================
    // Search
    // Make a call to the server with the search query or if already collected take from
    // internal memory
    //========================================================================================
    $scope.search = function(forceDBQuery, preDefinedSearchStr){
        var searchStrToUse = preDefinedSearchStr != undefined ? preDefinedSearchStr : $scope.formItems.searchStr;
        if(searchStrToUse != ''){
            latestSearchStr = searchStrToUse;
            if($scope.formItems.typeAheadResult.length > 0 && $scope.formItems.typeAheadResult.length <= $scope.formItems.itemsPerPage && !forceDBQuery){
                $scope.formItems.searchCriteria = $scope.textParts.searchResultTxt;
                $scope.formItems.searchStrResult = '"' + latestSearchStr + '"';
                for(var i = 0, wbl; wbl = $scope.formItems.typeAheadResult[i]; i++){
                    wbl['selectColor'] = 'transparent';
                    wbl.rating = parseInt(wbl.rating);
                    wbl['rateShow'] = true;
					wbl['socialMediaUrl'] = 'https://wws.meme.hokudai.ac.jp/#app?webble=' + wbl.webble.defid;
					wbl['socialMediaModelName'] = 'Cool Webble, ' + wbl.webble.displayname + ', found in Webble World. Check it out!';
                }
                $scope.formItems.searchResult = $scope.formItems.typeAheadResult;
                $scope.formItems.currentPage = 1;

                if($scope.formItems.searchResult.length == $scope.formItems.itemsPerPage){
                    $scope.formItems.totalItems = $scope.formItems.searchResult.length + $scope.formItems.itemsPerPage + 1;
                    $scope.formItems.searchCriteria = $scope.formItems.itemsPerPage + '+ ' + $scope.formItems.searchCriteria;
                }
                else{
                    $scope.formItems.totalItems = $scope.formItems.searchResult.length;
                    $scope.formItems.searchCriteria = $scope.formItems.searchResult.length + ' ' + $scope.formItems.searchCriteria;
                }

                $scope.formItems.pageViewResult = $scope.formItems.searchResult;

                if($scope.formItems.pageViewResult.length > 0){
                    $scope.selectWbl(0);
                }

                $scope.formItems.typeAheadResult = [];
            }
            else{
                return $http.get('/api/webbles?limit=' + $scope.formItems.itemsPerPage + '&orderby=' + getSortStr() + '&q=' + latestSearchStr + '&verify=1').then(function(resp){
                    $scope.formItems.searchCriteria = $scope.textParts.searchResultTxt;
                    $scope.formItems.searchStrResult = '"' + latestSearchStr + '"';
                    for(var i = 0, wbl; wbl = resp.data[i]; i++){
                        wbl['selectColor'] = 'transparent';
                        wbl.rating = parseInt(wbl.rating);
                        wbl['rateShow'] = true;
						wbl['socialMediaUrl'] = 'https://wws.meme.hokudai.ac.jp/#app?webble=' + wbl.webble.defid;
						wbl['socialMediaModelName'] = 'Cool Webble, ' + wbl.webble.displayname + ', found in Webble World. Check it out!';
                    }

                    $scope.formItems.searchResult = resp.data;
                    $scope.formItems.currentPage = 1;

                    if($scope.formItems.searchResult.length == $scope.formItems.itemsPerPage){
                        $scope.formItems.totalItems = $scope.formItems.searchResult.length + $scope.formItems.itemsPerPage + 1;
                        $scope.formItems.searchCriteria = $scope.formItems.itemsPerPage + '+ ' + $scope.formItems.searchCriteria;
                    }
                    else{
                        $scope.formItems.totalItems = $scope.formItems.searchResult.length;
                        $scope.formItems.searchCriteria = $scope.formItems.searchResult.length + ' ' + $scope.formItems.searchCriteria;
                    }

                    $scope.formItems.pageViewResult = $scope.formItems.searchResult;

                    if($scope.formItems.pageViewResult.length > 0){
                        $scope.selectWbl(0);
                    }
                });
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Rate This
    // Opens a modal window which lets the user rate the chosen Webble and comment on it.
    //========================================================================================
    $scope.rateThis = function(wbl){
        $scope.thePlatform.openForm(Enum.aopForms.rateWbl, {wblDefId: wbl.webble.defid, wblDefName: wbl.webble.displayname}, function(done){
            if(done != null){
                wbl['rateShow'] = false;
            }
        });
    };
    //========================================================================================


    //========================================================================================
    // Get Star Img
    // Returns a lit star or an off star depending on the star index and the rate value of
    // the Webble.
    //========================================================================================
    $scope.getStarImg = function(rate, index){
        if(index < rate ){
            return '../../images/starOn.png';
        }
        else{
            return '../../images/starOff.png';
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Rate Text
    // Returns a the text that comes with the selected rating.
    //========================================================================================
    $scope.getRateText = function(theRate){
        if(theRate == 0){
            return gettext("Unrated");
        }
        else{
            return $scope.textParts.starRatingTxt[theRate - 1];
        }
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        $scope.errorMsg = '';
        if (result == 'submit') {
            if($scope.formItems.selectedWbl >= 0){
                $scope.thePlatform.downloadWebbleDef($scope.formItems.searchResult[$scope.formItems.selectedWbl].webble.defid);
            }
        }
        else if (result == 'delete') {
            var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

            modalInstance.result.then(function () {
                dbService.deleteWebbleDef($scope.formItems.searchResult[$scope.formItems.selectedWbl].webble.defid).then(function(data){
                    $scope.formItems.searchResult.splice($scope.formItems.selectedWbl, 1);
                    $scope.formItems.pageViewResult.splice($scope.formItems.selectedWbl - (($scope.formItems.currentPage - 1) * $scope.formItems.itemsPerPage), 1);
                    $scope.formItems.selectedWbl = -1;
                    $scope.formItems.noOfExistingWbls -= 1;
                    $scope.formItems.totalItems -= 1;
                },function(eMsg){
                    $scope.serviceError(eMsg);
                });
            }, function () { });
        }
        else if (result == 'cancel') {
            $location.search('webble', null);
            if(locationSearchWSMemo != undefined){
                $location.search('workspace', locationSearchWSMemo);
            }
            $modalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    dbService.getWebbleCount().then(function(count) {
        $scope.formItems.noOfExistingWbls = count;
        getAperitifWebbles();
    },function(eMsg){
        $scope.formItems.noOfExistingWbls = $scope.textParts.notAvailable;
        $log.log('The server could not return any proper amount of webbles');
    });
});
//======================================================================================================================
