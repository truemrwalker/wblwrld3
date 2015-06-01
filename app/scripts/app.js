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

//======================================================================================================================
// DESCRIPTION:
// This js file contains the app module configuration code.
//======================================================================================================================
'use strict';

//================================================================================================================
// Declaration of application global keyword definitions.
//================================================================================================================
var wwDef = {
    EMPTY: 0,
    WEBSERVICE_ENABLED: true,
    PLATFORM_DEFAULT_LEVEL: 3 // 0=None, 1=Slim, 2=Limited, 3=Full, 4=Custom, 5=Undefined
};
//================================================================================================================


//================================================================================================================
// Declaration of application global variables.
//================================================================================================================
var wwGlobals = {
    loggingEnabled: false
};
//================================================================================================================


//================================================================================================================
// Declaration of application dependency modules.
//================================================================================================================
var ww3Services = angular.module('wblwrld3App.services', ['ngResource']);
var ww3Filters = angular.module('wblwrld3App.filters', []);
var ww3Directives = angular.module('wblwrld3App.directives', []);
var ww3Controllers = angular.module('wblwrld3App.controllers', []);
//================================================================================================================


//================================================================================================================
// Declaration of application module and which filters and services etc it is depended upon.
//================================================================================================================
var wblwrld3App = angular.module('wblwrld3App', [
    'ngSanitize',
    'ngRoute',
    'ngAnimate',
    'ngTouch',
    'angular-gestures',
    'gettext',
    'ui.bootstrap',
	'xeditable',
	'ui.ace',
	'angularFileUpload',
	'textAngular',
    'LocalStorageModule',
    'wblwrld3App.services',
    'wblwrld3App.filters',
    'wblwrld3App.directives',
    'wblwrld3App.controllers'], function($rootScopeProvider) {
        //Since many webbles have many watches it needs a few more iterations available than the default 10 without
        //error out when creating many webbles at the same time
        $rootScopeProvider.digestTtl(100);
    }
);
//================================================================================================================


//================================================================================================================
// Decorates the $log service so that it becomes conditional without having to comment $log out.
//================================================================================================================
wblwrld3App.config(function($provide) {
    $provide.decorator('$log', function($delegate) {
        //Saving the original behavior
        var _log = $delegate.log;
        var _info = $delegate.info;
        var _warn = $delegate.warn;
        var _error = $delegate.error;

        // Make the logging functions conditional based on logging enabled value
        $delegate.log = function(message) {
            if(wwGlobals.loggingEnabled == true){
                _log(message);
            }
        };
//
        $delegate.info = function(message) {
            if(wwGlobals.loggingEnabled == true){
                _info(message);
            }
        };

        $delegate.warn = function(message) {
            if(wwGlobals.loggingEnabled == true){
                _warn(message);
            }
        };

        $delegate.error = function(message) {
            if(wwGlobals.loggingEnabled == true){
                _error(message);
            }
        };

        return $delegate;
    });
});
//================================================================================================================


//================================================================================================================
// Application configuration for enabling some lazy loading of directives and filters etc.
//================================================================================================================
wblwrld3App.config(function( $controllerProvider, $provide, $compileProvider, $filterProvider ) {
    // Let's keep the older references.
    wblwrld3App._controller = wblwrld3App.controller;
    wblwrld3App._service = wblwrld3App.service;
    wblwrld3App._factory = wblwrld3App.factory;
    wblwrld3App._value = wblwrld3App.value;
    wblwrld3App._directive = wblwrld3App.directive;
    wblwrld3App._filter = wblwrld3App.filter;


    // Provider-based controller.
    wblwrld3App.controller = function( name, constructor ) {
        $controllerProvider.register( name, constructor );
        return( this );
    };

    // Provider-based service.
    wblwrld3App.service = function( name, constructor ) {
        $provide.service( name, constructor );
        return( this );
    };

    // Provider-based factory.
    wblwrld3App.factory = function( name, factory ) {
        $provide.factory( name, factory );
        return( this );
    };

    // Provider-based value.
    wblwrld3App.value = function( name, value ) {
        $provide.value( name, value );
        return( this );
    };

    // Provider-based directive.
    wblwrld3App.directive = function( name, factory ) {
        $compileProvider.directive( name, factory );
        return( this );
    };

    // Provider-based filter.
    wblwrld3App.filter = function( name, filterFunc ) {
        $filterProvider.register( name, filterFunc );
        return( this );
    };
});
//================================================================================================================

//================================================================================================================
// Authentication interceptor
//================================================================================================================
wblwrld3App.config(['$httpProvider', function($httpProvider) {

    $httpProvider.interceptors.push(['$q', 'authServiceDelayed', function($q, authServiceDelayed) {

	    return {
/*
		     'response': function(response) {
			     console.log("OKEY DOKEY", response.config.url);
			     return response;
		     },
*/
		    'responseError': function (rejection) {

			    switch (rejection.status) {

				    case 401:
					    return authServiceDelayed.get().onAuthRequired(rejection);
				    case 403:
					    return authServiceDelayed.get().onAuthForbidden(rejection);
				    default:
					    return $q.reject(rejection); // Default behavior
			    }
		    }
	    };
    }]);
}]);
//================================================================================================================


//================================================================================================================
// Disables the blocking of cross domain resources
//================================================================================================================
wblwrld3App.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}]);
//================================================================================================================


//================================================================================================================
// Application configuration and route provider info,
// for how to route and navigate the user within the application.
//================================================================================================================
wblwrld3App.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            template: '<div></div>',
            controller: 'ReRouteCtrl'
        })
        .when('/app', {
            templateUrl: 'views/workSpaces.html',
            controller: 'WorkSpacesCtrl',
		    reloadOnSearch: false
		    //resolve: { workspaces: function(WorkspacesLoader) { return new WorkspacesLoader(); } }
        })
        .when('/mediaplayer/:vidId', {
            templateUrl: 'views/mediaplayer.html',
            controller: 'MediaPlayerCtrl'
        })
        .when('/profile', {
            templateUrl: 'views/profile.html',
            controller: 'ProfileCtrl',
            reloadOnSearch: false
        })
	    .when('/login', {
		    templateUrl: 'views/login.html',
		    controller: 'LoginCtrl',
		    reloadOnSearch: false,
		    resolve: { authOfferToRegisterByDefault: function() { return false; } }
	    })
	    .when('/signup', {
		    templateUrl: 'views/login.html',
		    controller: 'LoginCtrl',
		    reloadOnSearch: false,
		    resolve: { authOfferToRegisterByDefault: function() { return true; } }
	    })
        .when('/templates', {
			templateUrl: 'views/templates.html',
			controller: 'TemplatesCtrl',
			resolve: { templates: function(TemplatesLoader) { return new TemplatesLoader(); } }
        })
        .when('/draw', {
			templateUrl: 'views/draw.html',
			controller: 'DrawCtrl'
        })
        .when('/groups', {
			templateUrl: 'views/groups.html',
			controller: 'GroupsCtrl',
		    reloadOnSearch: false
        })
	    .when('/data', {
		    templateUrl: 'views/data.html',
		    controller: 'DataCtrl',
		    reloadOnSearch: false
	    })
      .when('/adm', {
        templateUrl: 'views/adm.html',
        controller: 'AdmCtrl',
        reloadOnSearch: false
      })
        .otherwise({redirectTo: '/'});

}]);
//================================================================================================================

//================================================================================================================
// Translation Support And Webble World Global rootScope Variables
//================================================================================================================

//================================================================================================================
wblwrld3App.run(['$window', '$location', '$rootScope', 'gettextCatalog', 'gettext',
function($window, $location, $rootScope, gettextCatalog, gettext) {

    gettextCatalog.currentLanguage = $window.navigator.userLanguage || $window.navigator.language || 'en';
    gettextCatalog.debug = false;

    $rootScope.pageTitle = gettext("Webble World 3.0 - Where memes comes alive");

	// Allow for more generic controllers that can either be used as routes OR as modals
	//
	$rootScope.$close = function(result) {
		$location.url('/app');
	};
	$rootScope.$dismiss = function (result) {
		$location.url('/app');
	};

	$rootScope.$selectTab = function(tab) {
		$location.search('tab', tab);
	};
	$rootScope.$setSelectedTab = function(tabs, defaultTab) {

		var sp = $location.search();
		if (sp.tab && tabs[sp.tab] !== undefined)
			tabs[sp.tab] = true;
		else if (defaultTab)
			tabs[defaultTab] = true;
	};
}]);

//================================================================================================================

//======================================================================================================================
