//====================================================================================================================
// Filters for Game Manager Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//====================================================================================================================

// AngularJS Filters are powerful and very useful, but is never necessary. This file can be completely excluded in
// the final template. But if you have them and use them it is here where you put them.
// Remember to bind them to the wblwrld3App module to work properly as seen below in the example.

//EXAMPLE FILTER
//=======================================================================================
// STAR WRAPPER FILTER
// This Filter takes a string and put star characters in the beginning and end of it.
//=======================================================================================
wblwrld3App.filter( 'starMe', function () {
    return function (input) {
        return ('**' + input + '**');
    }}
);
//=================================================================================

//====================================================================================================================
