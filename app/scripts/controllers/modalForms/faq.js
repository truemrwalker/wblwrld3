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
// PLATFORM FAQ FORM CONTROLLER
// This controls the form for managing FAQ
//====================================================================================================================
ww3Controllers.controller('faqSheetCtrl', function ($scope, $uibModalInstance, $log, $uibModal, gettext, currUser, dbService, Enum) {

    //=== PROPERTIES ================================================================

    $scope.formItems = {
        faqList: [],
        thisUser: currUser,
        newQ: '',
        errorMsg: ''
    };

    $scope.textParts = {
        fromYou: gettext("Asked by you")
    };



    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Add New Question
    // when the 'Ask' button is clicked the content of the new question text box is added to
    // the new question list.
    //========================================================================================
    $scope.askNewQ = function(){
        if($scope.formItems.newQ != ''){
            var question = $scope.formItems.newQ;
            $scope.formItems.newQ = '';
            if(question[question.length - 1] != '?'){
                question += '?';
            }
            var nq = {q: question, a: '', qu: $scope.formItems.thisUser.userEmail, au: ''};
            dbService.addFAQ(nq).then(function(data){
                $scope.formItems.faqList.push(data);
            },function(eMsg){
                $log.error('ERROR * ERROR * ERROR * ERROR\n' + eMsg);
            });
        }
    };
    //========================================================================================


    //========================================================================================
    // Answer Question
    // when the 'Answer' button is clicked the content of the current answer text box is
    // sent to the server for this question
    //========================================================================================
    $scope.answerQ = function(whatFAQ){
        if(whatFAQ.a != '' && whatFAQ.a != 'Unanswered'){
            dbService.answerFAQ(whatFAQ).then(function(data){
                whatFAQ['answered'] = true;
            },function(eMsg){
                $log.error('ERROR * ERROR * ERROR * ERROR\n' + eMsg);
            });
        }
    };
    //========================================================================================


    //========================================================================================
    // Delete Question
    // when the 'Delete' button is clicked the user is asked if he really want to delete the
    // question, if confirmed then the server is called for question deletion.
    //========================================================================================
    $scope.deleteQ = function(whatFAQ){
        var modalInstance = $uibModal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

        modalInstance.result.then(function () {
            dbService.deleteFAQ(whatFAQ).then(function(data){
                for(var i = 0, faq; faq = $scope.formItems.faqList[i]; i++){
                    if(whatFAQ.id == faq.id){
                        $scope.formItems.faqList.splice(i, 1);
                        break;
                    }
                }
            },function(eMsg){
                $scope.serviceError(eMsg);
            });
        }, function () { });
    };
    //========================================================================================


    //========================================================================================
    // Clear Answered
    // If the question is being edited, then the 'Answered' flag needs to be cleared
    //========================================================================================
    $scope.clearAnswered = function(whatFAQ){
        if(whatFAQ['answered']){
            whatFAQ['answered'] = false;
        }
    };
    //========================================================================================


    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Compare Questions
    // Sort list alphabetical of FAQ based on questions
    //========================================================================================
    var compareQ = function(a,b) {
        if (a.q < b.q)
            return -1;
        if (a.q > b.q)
            return 1;
        return 0;
    };
    //========================================================================================


    //========================================================================================
    // Compare Is Answered
    // Sort list by unanswered first
    //========================================================================================
    var compareA = function(a,b) {
        if (a['answered'] < b['answered'])
            return -1;
        if (a['answered'] > b['answered'])
            return 1;
        return 0;
    };
    //========================================================================================


    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Has Pending Questions
    // Checks weather this user has any pending questions or not
    //========================================================================================
    $scope.hasPendingQuestions = function () {
        for(var i = 0, faq; faq = $scope.formItems.faqList[i]; i++){
            if(faq.qu == $scope.formItems.thisUser.userEmail && (faq.a == '' || faq.a == 'Unanswered')){
                return true;
            }
        }

        return false;
    };
    //========================================================================================


    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
		$uibModalInstance.close(null);
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //*****************************************************************************************************************
    dbService.getFAQs().then(function(data){
        if(data.length){
            data.sort(compareQ);
            for(var i = 0, faq; faq = data[i]; i++){
                if(faq.a == 'Unanswered' || faq.a == ''){
                    faq.a = '';
                    faq['answered'] = false;
                }
                else{
                    faq['answered'] = true;
                }
            }
            data.sort(compareA);
            $scope.formItems.faqList = data;
        }
        else{
            $log.log('The list of questions was empty');
        }
    },function(eMsg){
        $log.error('ERROR * ERROR * ERROR * ERROR\n' + eMsg);
    });
});
//======================================================================================================================
