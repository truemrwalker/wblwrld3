//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP File Data Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopFileDataWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

	//=== PROPERTIES ====================================================================

	// some Webble stuff
	$scope.stylesToSlots = {};
	$scope.customMenu = [];
	$scope.customInteractionBalls = [];

	$scope.pluginName =	"Data Source (Generic)";
	var preDebugMsg = "hopFileDataWebble: ";

	// supposedly unique identifier, used to keep track of different data sources
	var myInstanceId = -1;

	// flag to keep track if we are still being loaded (so we should avoid doing some things)
	var fullyLoaded = false;

	// --------------------------------------------------------------------------------
	// Info on the data we provide
	// --------------------------------------------------------------------------------
	// dataFields is an array with one item for each data field we
	// provide (which is often more data fields than are in the files,
	// since we provide 3D data as 1D data too and things like that).
	// [ { idx:"index of this data field (in this array)",
	//     listen:"function to add a listener on this data field" addListeningViz(vizId, listening, callbackForNewSelections, callbackForNewData, listOfInterestingFeatures),
	//     name:"name of this data field, e.g. 'Timestamp'"
	//     newSel:"function to add a new set of selections of the data based on this field"
	//     sel:"function to get the selection status of each data item on this field" data item index -> 0(unselected), or 1,2,3,... (subgroup this item belongs to)
	//     size:"the number of data items for this data field"
	//     type:"the data types of this field", e.g. ["number", "date"] or ["3Darray"]
	//     val:"a function that returns the values of the data items", val(data item index) -> the value
	//   }, {....}, ....]
	var dataFields = [];

	// --------------------------------------------------------------------------------
	// for data in GrADS format
	// --------------------------------------------------------------------------------
	var theHeaderGrADS = {}; // the GrADS header
	var data = {};
	var seenDensities = [];
	var seenRockstars = [];
	var xVecIdx = 0;
	var yVecIdx = 0;
	var zVecIdx = 0;
	var tVecIdx = -1;
	var eVecIdx = -1;
	var last3Didx = -1;

	// --------------------------------------------------------------------------------
	// Things for displaying ourselves graphically
	// --------------------------------------------------------------------------------
	var fontSize = 11;
	var textColor = "black";
	var myCanvasElement = null;
	var myCanvas = null;
	var ctx = null;
	var fileName = ""; // name of last file read, which is shown graphically to the user

	// --------------------------------------------------------------------------------
	// Things for keeping track of selected subsets of the data and updating all listening visualization components
	// about changes in selection status.
	// --------------------------------------------------------------------------------
	// Components may be listening to more than one field, and will then get multiple messages that the selection status
	// has changed. This number helps them keep track of whether to redraw again or not.
	var selectionUpdateNumber = 0;

	// Same, but for updates when the data contents change.
	var dataUpdateNumber = 0;

	// flag to keep track of if we are sending "newData" messages (which will generally generate lots of
	// "newSelections" messages from the visualization components) or not.
	var sendingDataMess = false;

	// flags to track what parts of the data have new selections, to know which listeners to update
	var selectionsDirtyStatus = [];
	var vizSelectionsCache = [];
	var vizSelectionsCacheRepresentatives = [];

	// Keeping track of all selections of all active visualization components
	var vizSelectionFunctions = [];

	// Mapping selected subsets on different components to one integer. 0 means "not selected".
	var mapSelectionsToGroupId = {"next":1}; // TODO: this does not work very well right now
	var mapVizToNumber = {"next":0};

	// one list item for each feature. each item contains the info for the interested visualization component
	var dataListeners = [];

	// the strings used for months in the data files we have
	var months = {"jan":0,"feb":1,"mar":2, "apr":3, "may":4, "jun":5, "jul":6, "aug":7, "sep":8, "oct":9, "nov":10, "dec":11, "JAN":0,"FEB":1,"MAR":2, "APR":3, "MAY":4, "JUN":5, "JUL":6, "AUG":7, "SEP":8, "OCT":9, "NOV":10, "DEC":11};

	// Update this to change the visual representation (angular will automatically update according to this list)
	$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":[], "noofRows":0}], "file":""};
	$scope.dataListStyle = {'padding':'10px', 'font-size':fontSize, 'font-family':'arial', 'background-color':'lightgrey', 'color':textColor, 'border':'2px solid #4400aa'};

	$scope.inputURL = "";

	// Tohoku Tsunami data
	var tohokuMinLon = 133.3269583;
	var tohokuMaxLon = 133.6901483;
	var tohokuDx = tohokuMaxLon - tohokuMinLon;
	var tohokuMinLat = 33.3864755;
	var tohokuMaxLat = 33.6015194;
	var tohokuDy = tohokuMaxLat - tohokuMinLat;
	var tohokuMinLon = 133.32595825195312;
	var tohokuMaxLon = 133.70361328125;
	var tohokuDx = tohokuMaxLon - tohokuMinLon;
	var tohokuMinLat = 33.38472625520925;
	var tohokuMaxLat = 33.597748814379344;
	var tohokuDy = tohokuMaxLat - tohokuMinLat;
	var tohokuBldNull = -99;
	var tohokuFloodingNull = -99;
	var tohoku2Ds = []; // (should be 33133824 bytes, 3504x2364 32bit floats)
	var tohokuTimes = []; // (should be 33133824 bytes, 3504x2364 32bit floats)
	// { "selections": [  {   "minX": 33.52164771893553,   "maxX": 33.597748814379344,   "minY": 133.6208724975586,   "maxY": 133.70361328125  } ]}
	// { "selections": [  {   "minX": 33.5963189611327,   "maxX": 33.597748814379344,   "minY": 133.70189666748047,   "maxY": 133.7039566040039  } ]}
	// { "selections": [  {   "minX": 33.38472625520925,   "maxX": 33.39977526599773,   "minY": 133.32595825195312,   "maxY": 133.33110809326172  } ]}



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Input URL Change
	// This event handler reacts to change of URL value
	// ===================================================================================
	$scope.onInputURLChange = function() {
		$log.log(preDebugMsg + "inputURL changed: '" + $scope.inputURL + "'");
		if($scope.inputURL !== undefined && $scope.inputURL != "") {
			$log.log(preDebugMsg + "inputURL is valid URL: '" + $scope.inputURL + "'");

			// we may get several files, so clear out old data now and then do not clear when reading files
			resetVars();

			var firstNetCDF = true;
			var haveCtl = false;
			var haveDats = 0;
			var ctl = null;

			// $log.log(preDebugMsg + "Guess file type");

			var request = new XMLHttpRequest();
			request.open('GET', $scope.inputURL, true);
			request.responseType = 'blob';

			var f = $scope.inputURL;
			var fn = f.toLowerCase();

			// add all other supported file types too?
			if(fn.indexOf(".gz") >= 0) {
				request.onload = function() {
					var reader = new FileReader();
					reader.zippedfn = fn;
					reader.onload = function(e) { fileReaderOnLoadCallbackGZip(e, reader);};
					reader.readAsArrayBuffer(request.response);
				};
			}
			else if(fn.indexOf(".zip") >= 0) {
				request.onload = function() {
					var reader = new FileReader();
					reader.zippedfn = fn;
					reader.onload = function(e) { fileReaderOnLoadCallbackZip(e, reader);};
					reader.readAsArrayBuffer(request.response);
				};

			}
			else if(fn.indexOf(".csv") >= 0 || fn.indexOf(".txt") >= 0 || fn.indexOf(".json") >= 0) {
				// assume text format, some form of comma or tab separated stuff (or JSON) read each file immediately
				request.onload = function() {
					var reader = new FileReader();
					reader.fileName = fn;
					reader.onload = function(e) { fileReaderOnLoadCallbackText(e, reader);};
					reader.readAsText(request.response);
				};
			}
			else if(fn.indexOf(".nc") >= 0) {
				// assume netCDF format
				request.onload = function() {
					var reader = new FileReader();
					reader.fileList = [f];
					reader.fileIdx = 0;
					reader.onload = function(e) { fileReaderOnLoadCallbackNetCDF(e, reader);};
					reader.readAsArrayBuffer(request.response);
				};
			}
			else if(fn.indexOf(".bin") >= 0) {
				// this can be several different formats

				// rockstar format has magic number density format has fixed file size if we have ctl file, guess GrADS
				haveDats++;
			}
			else if(fn.indexOf(".dat") >= 0) {
				// if we also have a ctl file, guess GrADS
				haveDats++;
			}

				// else if(f.name == "dbz.ctl") {
				// 	// assume GrADS format
				// 	haveCtl = true;
				// 	ctl = f;
				// }
				//
				// else if(fn.indexOf(".ctl") >= 0) {
				// 	if(!haveCtl) {
				// 	    ctl = f;
				// 	}
				// 	haveCtl = true;
			// }

			else {
				$log.log(preDebugMsg + "Cannot guess file type from file name, assuming text data.");
			}

			if(haveCtl && haveDats > 0) {
				// guess GrADS
				// var reader = new FileReader();
				// reader.fileList = files;
				// reader.onload = function(e) { fileReaderOnLoadCallbackGrADS(e, reader);};
				// reader.readAsText(ctl);
			}
			else if(haveDats > 0) {
				// some binary format, read files and check for different types based on file contents
				if(fn.indexOf(".dat") >= 0 || fn.indexOf(".bin") >= 0) {
					request.onload = function() {
						reader.fileList = [f];
						reader.theFileWhenRetrying = fn;
						reader.fileName = fn;
						reader.lastFile = true;
						reader.onload = function(e) { fileReaderOnLoadCallbackBinary(e, reader);};
						reader.readAsArrayBuffer(request.response);
					};
				}
			}
			request.send();
		}
	};
	//===================================================================================


	//===================================================================================
	// On Files Added
	// This event handler reacts to files being added
	// ===================================================================================
	$scope.onFilesAdded = function(files) {
		if(files !== undefined && files.length > 0) {
			// First, check if we can guess the file format.
			// If so, send files off to a function that can handle that format.

			// we may get several files, so clear out old data now and then do not clear when reading files
			resetVars();

			var firstNetCDF = true;
			var haveCtl = false;
			var haveDats = 0;
			var ctl = null;

			// var archive = false; // zip, tgz, gz, lzh, etc.
			// var textFile = false; // csv, txt, etc.
			// var rockstar = false; // rockstar format begins with a magic number we can check for
			// var density = false; // density files have a fixed file size we can check for
			// var netCDF = false; // .nc and some other variations

			// $log.log(preDebugMsg + "Guess file type");
			for(var i = 0; i < files.length; i++) {
				var f = files[i];
				var fn = f.name.toLowerCase();

				// add all other supported file types too?
				if(fn.indexOf(".gz") >= 0) {
					// read each file immediately
					var reader = new FileReader();
					reader.zippedfn = fn;
					reader.onload = function(e) { fileReaderOnLoadCallbackGZip(e, reader);};
					reader.readAsArrayBuffer(f);
				}
				else if(fn.indexOf(".zip") >= 0) {
					// read each file immediately
					var reader = new FileReader();
					reader.onload = function(e) { fileReaderOnLoadCallbackZip(e, reader);};
					reader.readAsArrayBuffer(f);
				}
				else if(fn.indexOf(".csv") >= 0 || fn.indexOf(".txt") >= 0 || fn.indexOf(".json") >= 0) {
					// assume text format, some form of comma or tab separated stuff (or JSON) read each file immediately
					var reader = new FileReader();
					reader.fileName = fn;
					reader.onload = function(e) { fileReaderOnLoadCallbackText(e, reader);};
					reader.readAsText(f);
				}
				else if(fn.indexOf(".nc") >= 0) {
					// assume netCDF format
					// Start reading netCDF files immediately, but do this only once
					if(firstNetCDF) {
						firstNetCDF = false;
						var reader = new FileReader();
						reader.fileList = files;
						reader.fileIdx = 0;
						reader.onload = function(e) { fileReaderOnLoadCallbackNetCDF(e, reader);};
						reader.readAsArrayBuffer(f);
					}
				}
				else if(fn.indexOf(".bin") >= 0) {
					// this can be several different formats
					// rockstar format has magic number density format has fixed file size if we have ctl file, guess GrADS
					haveDats++;
				}
				else if(fn.indexOf(".dat") >= 0) {
					// if we also have a ctl file, guess GrADS
					haveDats++;
				}
				else if(f.name == "dbz.ctl") {
					// assume GrADS format
					haveCtl = true;
					ctl = f;
				}
				else if(fn.indexOf(".ctl") >= 0) {
					if(!haveCtl) {
						ctl = f;
					}
					haveCtl = true;
				}
				else {
					$log.log(preDebugMsg + "Cannot guess file type from file name, assuming text data.");
				}
			}

			if(haveCtl && haveDats > 0) {
				// guess GrADS
				var reader = new FileReader();
				reader.fileList = files;
				reader.onload = function(e) { fileReaderOnLoadCallbackGrADS(e, reader);};
				reader.readAsText(ctl);
			}
			else if(haveDats > 0) {
				// some binary format, read files and check for different types based on file contents
				var lastBinFile = 0;
				for(var i = 0; i < files.length; i++) {
					var f = files[i];
					var fn = f.name.toLowerCase();

					if(fn.indexOf(".dat") >= 0 || fn.indexOf(".bin") >= 0) {
						lastBinFile = i;
					}
				}

				for(var i = 0; i < files.length; i++) {
					var f = files[i];
					var fn = f.name.toLowerCase();

					if(fn.indexOf(".dat") >= 0 || fn.indexOf(".bin") >= 0) {
						if(i == lastBinFile) {
							var reader = binFileReaderCreator(files, f, fn, true);
						}
						else {
							var reader = binFileReaderCreator(files, f, fn, false);
						}
						reader.readAsArrayBuffer(f);
					}
				}
			}
		}
	};
	//===================================================================================


	// ===================================================================================
	// My Slot Change
	// This event handler reacts to changes on our input slots.
	// ===================================================================================
	function mySlotChange(eventData) {
		switch(eventData.slotName) {
			case "PluginName":
				var newVal = eventData.slotValue;
				$scope.pluginName = newVal;
				break;
			case "ColorScheme":
				$scope.set('PreDefinedColorScheme', 0);
				updateView();
				break;
			case 'PreDefinedColorScheme':
				var newVal = eventData.slotValue;
				switch(newVal) {
					case 0: // manual input, nothing to do
						break;
					case 1: // white bg, high contrast colors
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#ffffff",
								"border":"#000000",
								"gradient":[{"pos":0,"color":"#f0f0ff"},{"pos":0.05,"color":"#ffffff"},{"pos":0.95,"color":"#ffffff"},{"pos":1,"color":"#f0f0ff"}]},
							"selection":{"color":"#c6dbef",
								"border":"#6baed6",
								"gradient":[{"pos":0,"color":"#eff3ff"},{"pos":1,"color":"#c6dbef"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#a6cee3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#a6cee3"}]},
								2:{"color":"#1f78b4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#1f78b4"}]},
								3:{"color":"#b2df8a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#b2df8a"}]},
								4:{"color":"#33a02c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#33a02c"}]},
								5:{"color":"#fb9a99","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fb9a99"}]},
								6:{"color":"#e31a1c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e31a1c"}]},
								7:{"color":"#fdbf6f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdbf6f"}]},
								8:{"color":"#ff7f00","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ff7f00"}]},
								9:{"color":"#cab2d6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#cab2d6"}]},
								10:{"color":"#6a3d9a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#6a3d9a"}]},
								11:{"color":"#ffff99","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffff99"}]},
								12:{"color":"#b15928","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#b15928"}]},
								13:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 2: // white bg, high contrast colors
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#ffffff",
								"border":"#000000",
								"gradient":[{"pos":0,"color":"#f0f0ff"},{"pos":0.05,"color":"#ffffff"},{"pos":0.95,"color":"#ffffff"},{"pos":1,"color":"#f0f0ff"}]},
							"selection":{"color":"#c6dbef",
								"border":"#6baed6",
								"gradient":[{"pos":0,"color":"#eff3ff"},{"pos":1,"color":"#c6dbef"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#e41a1c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e41a1c"}]},
								2:{"color":"#377eb8","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#377eb8"}]},
								3:{"color":"#4daf4a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#4daf4a"}]},
								4:{"color":"#984ea3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#984ea3"}]},
								5:{"color":"#ff7f00","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ff7f00"}]},
								6:{"color":"#ffff33","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffff33"}]},
								7:{"color":"#a65628","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#a65628"}]},
								8:{"color":"#f781bf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f781bf"}]},
								9:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 3: // white bg, red to purple via yellow
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#ffffff",
								"border":"#000000",
								"gradient":[{"pos":0,"color":"#f0f0ff"},{"pos":0.05,"color":"#ffffff"},{"pos":0.95,"color":"#ffffff"},{"pos":1,"color":"#f0f0ff"}]},
							"selection":{"color":"#c6dbef",
								"border":"#6baed6",
								"gradient":[{"pos":0,"color":"#eff3ff"},{"pos":1,"color":"#c6dbef"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#9e0142","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9e0142"}]},
								2:{"color":"#d53e4f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#d53e4f"}]},
								3:{"color":"#f46d43","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f46d43"}]},
								4:{"color":"#fdae61","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdae61"}]},
								5:{"color":"#fee08b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fee08b"}]},
								6:{"color":"#ffffbf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffbf"}]},
								7:{"color":"#e6f598","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e6f598"}]},
								8:{"color":"#abdda4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#abdda4"}]},
								9:{"color":"#66c2a5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#66c2a5"}]},
								10:{"color":"#3288bd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#3288bd"}]},
								11:{"color":"#5e4fa2","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#5e4fa2"}]},
								12:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 4: // white bg, brown to green, red to purple via yellow
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#ffffff",
								"border":"#000000",
								"gradient":[{"pos":0,"color":"#f0f0ff"},{"pos":0.05,"color":"#ffffff"},{"pos":0.95,"color":"#ffffff"},{"pos":1,"color":"#f0f0ff"}]},
							"selection":{"color":"#c6dbef",
								"border":"#6baed6",
								"gradient":[{"pos":0,"color":"#eff3ff"},{"pos":1,"color":"#c6dbef"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#8c510a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c510a"}]},
								2:{"color":"#bf812d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#bf812d"}]},
								3:{"color":"#dfc27d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#dfc27d"}]},
								4:{"color":"#f6e8c3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f6e8c3"}]},
								5:{"color":"#c7eae5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#c7eae5"}]},
								6:{"color":"#80cdc1","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#80cdc1"}]},
								7:{"color":"#35978f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#35978f"}]},
								8:{"color":"#01665e","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#01665e"}]},
								9:{"color":"#9e0142","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9e0142"}]},
								10:{"color":"#d53e4f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#d53e4f"}]},
								11:{"color":"#f46d43","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f46d43"}]},
								12:{"color":"#fdae61","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdae61"}]},
								13:{"color":"#fee08b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fee08b"}]},
								14:{"color":"#ffffbf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffbf"}]},
								15:{"color":"#e6f598","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e6f598"}]},
								16:{"color":"#abdda4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#abdda4"}]},
								17:{"color":"#66c2a5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#66c2a5"}]},
								18:{"color":"#3288bd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#3288bd"}]},
								19:{"color":"#5e4fa2","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#5e4fa2"}]},
								20:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 5: // white bg, purple
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#ffffff",
								"border":"#000000",
								"gradient":[{"pos":0,"color":"#f0f0ff"},{"pos":0.05,"color":"#ffffff"},{"pos":0.95,"color":"#ffffff"},{"pos":1,"color":"#f0f0ff"}]},
							"selection":{"color":"#c6dbef",
								"border":"#6baed6",
								"gradient":[{"pos":0,"color":"#eff3ff"},{"pos":1,"color":"#c6dbef"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#4d004b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#4d004b"}]},
								2:{"color":"#810f7c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#810f7c"}]},
								3:{"color":"#88419d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#88419d"}]},
								4:{"color":"#8c6bb1","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c6bb1"}]},
								5:{"color":"#8c96c6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c96c6"}]},
								6:{"color":"#9ebcda","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9ebcda"}]},
								7:{"color":"#bfd3e6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#bfd3e6"}]},
								8:{"color":"#e0ecf4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e0ecf4"}]},
								9:{"color":"#f7fcfd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f7fcfd"}]},
								10:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 6: // cream bg, high contrast colors
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#fff2e6",
								"border":"#663300",
								"gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
							"selection":{"color":"#ffbf80",
								"border":"#ffa64d",
								"gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#a6cee3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#a6cee3"}]},
								2:{"color":"#1f78b4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#1f78b4"}]},
								3:{"color":"#b2df8a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#b2df8a"}]},
								4:{"color":"#33a02c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#33a02c"}]},
								5:{"color":"#fb9a99","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fb9a99"}]},
								6:{"color":"#e31a1c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e31a1c"}]},
								7:{"color":"#fdbf6f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdbf6f"}]},
								8:{"color":"#ff7f00","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ff7f00"}]},
								9:{"color":"#cab2d6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#cab2d6"}]},
								10:{"color":"#6a3d9a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#6a3d9a"}]},
								11:{"color":"#ffff99","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffff99"}]},
								12:{"color":"#b15928","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#b15928"}]},
								13:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 7: // cream bg, high contrast colors 2
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#fff2e6",
								"border":"#663300",
								"gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
							"selection":{"color":"#ffbf80",
								"border":"#ffa64d",
								"gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#e41a1c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e41a1c"}]},
								2:{"color":"#377eb8","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#377eb8"}]},
								3:{"color":"#4daf4a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#4daf4a"}]},
								4:{"color":"#984ea3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#984ea3"}]},
								5:{"color":"#ff7f00","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ff7f00"}]},
								6:{"color":"#ffff33","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffff33"}]},
								7:{"color":"#a65628","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#a65628"}]},
								8:{"color":"#f781bf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f781bf"}]},
								9:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 8: // cream bg, heat map colors
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#fff2e6",
								"border":"#663300",
								"gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
							"selection":{"color":"#ffbf80",
								"border":"#ffa64d",
								"gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#9e0142","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9e0142"}]},
								2:{"color":"#d53e4f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#d53e4f"}]},
								3:{"color":"#f46d43","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f46d43"}]},
								4:{"color":"#fdae61","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdae61"}]},
								5:{"color":"#fee08b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fee08b"}]},
								6:{"color":"#ffffbf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffbf"}]},
								7:{"color":"#e6f598","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e6f598"}]},
								8:{"color":"#abdda4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#abdda4"}]},
								9:{"color":"#66c2a5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#66c2a5"}]},
								10:{"color":"#3288bd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#3288bd"}]},
								11:{"color":"#5e4fa2","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#5e4fa2"}]},
								12:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 9: // cream bg, two gradations
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#fff2e6",
								"border":"#663300",
								"gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
							"selection":{"color":"#ffbf80",
								"border":"#ffa64d",
								"gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#8c510a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c510a"}]},
								2:{"color":"#bf812d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#bf812d"}]},
								3:{"color":"#dfc27d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#dfc27d"}]},
								4:{"color":"#f6e8c3","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f6e8c3"}]},
								5:{"color":"#c7eae5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#c7eae5"}]},
								6:{"color":"#80cdc1","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#80cdc1"}]},
								7:{"color":"#35978f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#35978f"}]},
								8:{"color":"#01665e","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#01665e"}]},
								9:{"color":"#9e0142","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9e0142"}]},
								10:{"color":"#d53e4f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#d53e4f"}]},
								11:{"color":"#f46d43","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f46d43"}]},
								12:{"color":"#fdae61","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdae61"}]},
								13:{"color":"#fee08b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fee08b"}]},
								14:{"color":"#ffffbf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffbf"}]},
								15:{"color":"#e6f598","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e6f598"}]},
								16:{"color":"#abdda4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#abdda4"}]},
								17:{"color":"#66c2a5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#66c2a5"}]},
								18:{"color":"#3288bd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#3288bd"}]},
								19:{"color":"#5e4fa2","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#5e4fa2"}]},
								20:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 10: // cream, purples
						var scheme = {"skin":{
								"text":"#000000",
								"color":"#fff2e6",
								"border":"#663300",
								"gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
							"selection":{"color":"#ffbf80",
								"border":"#ffa64d",
								"gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#4d004b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#4d004b"}]},
								2:{"color":"#810f7c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#810f7c"}]},
								3:{"color":"#88419d","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#88419d"}]},
								4:{"color":"#8c6bb1","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c6bb1"}]},
								5:{"color":"#8c96c6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#8c96c6"}]},
								6:{"color":"#9ebcda","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9ebcda"}]},
								7:{"color":"#bfd3e6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#bfd3e6"}]},
								8:{"color":"#e0ecf4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e0ecf4"}]},
								9:{"color":"#f7fcfd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f7fcfd"}]},
								10:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 11: // black bg, heat map
						var scheme = {"skin":{
								"text":"#FFFACD",
								"color":"#000000",
								"border":"#DD6A3D",
								"gradient":[{"pos":0,"color":"#000000"},{"pos":0.75,"color":"#333333"},{"pos":1,"color":"#444444"}]},
							"selection":{"color":"#FFFAFA","border":"#FF2500","gradient":[{"pos":0.2,"color":"#FFFAFA"},{"pos":1,"color":"#FFFFFF"}]},
							"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
								1:{"color":"#9e0142","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9e0142"}]},
								2:{"color":"#d53e4f","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#d53e4f"}]},
								3:{"color":"#f46d43","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#f46d43"}]},
								4:{"color":"#fdae61","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fdae61"}]},
								5:{"color":"#fee08b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fee08b"}]},
								6:{"color":"#ffffbf","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffbf"}]},
								7:{"color":"#e6f598","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e6f598"}]},
								8:{"color":"#abdda4","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#abdda4"}]},
								9:{"color":"#66c2a5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#66c2a5"}]},
								10:{"color":"#3288bd","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#3288bd"}]},
								11:{"color":"#5e4fa2","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#5e4fa2"}]},
								12:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
					case 12: // black bg, bright colors
						var scheme = {"skin":{
								"text":"#FFFACD",
								"color":"#000000",
								"border":"#DD6A3D",
								"gradient":[{"pos":0,"color":"#000000"},{"pos":0.75,"color":"#333333"},{"pos":1,"color":"#444444"}]},
							"selection":{"color":"#FFFAFA","border":"#FF2500","gradient":[{"pos":0.2,"color":"#FFFAFA"},{"pos":1,"color":"#FFFFFF"}]},
							"groups":{
								"0":{"color":"#444444","gradient":[{"pos":0,"color":"#444444"},{"pos":0.75,"color":"#777777"}]},
								"1":{"color":"#ffffcc","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffffcc"}]},
								"2":{"color":"#ffeda0","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#ffeda0"}]},
								"3":{"color":"#fed976","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fed976"}]},
								"4":{"color":"#feb24c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#feb24c"}]},
								"5":{"color":"#fd8d3c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fd8d3c"}]},
								"6":{"color":"#fc4e2a","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#fc4e2a"}]},
								"7":{"color":"#e31a1c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#e31a1c"}]},
								"8":{"color":"#bd0026","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#bd0026"}]},
								"9":{"color":"#800026","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#800026"}]},
								"10":{"color":"#08306b","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#08306b"}]},
								"11":{"color":"#08519c","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#08519c"}]},
								"12":{"color":"#2171b5","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#2171b5"}]},
								"13":{"color":"#4292c6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#4292c6"}]},
								"14":{"color":"#6baed6","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#6baed6"}]},
								"15":{"color":"#9ecae1","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#9ecae1"}]},
								"16":{"color":"#c6dbef","gradient":[{"pos":0,"color":"#FFFFFF"},{"pos":0.75,"color":"#c6dbef"}]}}};
						$scope.set('ColorScheme', scheme);
						break;
				}
				break;
			case "FontSize":
				fontSize = parseInt($scope.gimme("FontSize"));
				if(fontSize < 5) {
					fontSize = 5;
				}
				updateView();
				break;
			case "DrawingArea:height":
				updateView();
				break;
			case "DrawingArea:width":
				updateView();
				break;
		}
	}
	//===================================================================================



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		// turn off Webble things that we do not want to allow
		$scope.addPopupMenuItemDisabled('EditCustomMenuItems');
		$scope.addPopupMenuItemDisabled('EditCustomInteractionObjects');
		$scope.addPopupMenuItemDisabled('AddCustomSlots');

		var ios = $scope.theInteractionObjects;
		for(var i = 0, io; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'Resize'){
				io.scope().setIsEnabled(false);
			}
			if(io.scope().getName() == 'Rotate'){
				io.scope().setIsEnabled(false);
			}
		}

		// Add our slots
		//--------------

		// === Base slots ===

		$scope.addSlot(new Slot('PluginName',
			$scope.pluginName,
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginType',
			"DataSource",
			"Plugin Type",
			'The type of plugin this is. Should always be "DataSource".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// === Input slots ===

		$scope.addSlot(new Slot('OverrideEndian',
			0,
			"Override Endian",
			'Force interpretation of float binary data to little endian (1), big endian (0), or trust the file specification (-1).',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Trust Specification", "Force Little Endian", "Force Big Endian"]},
			undefined
		));

		$scope.addSlot(new Slot('FontSize',
			11,
			"Font Size",
			'The font size to use in the Webble interface.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PreDefinedColorScheme',
			0,
			"Pre-Defined Color Scheme",
			'Used to select one of several pre-defined color schemes.',
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Manual Input",
					"White + High Contrast Colors A",
					"White + High Contrast Colors B",
					"White + Heat Map Colors",
					"White + Two Gradations",
					"White + Purple",
					"Cream + High Contrast Colors A",
					"Cream + High Contrast Colors B",
					"Cream + Heat Map Colors",
					"Cream + Two Gradations",
					"Cream + Purple",
					"Black + Heat Map Colors",
					"Black + Bright Colors"
				]},
			undefined
		));

		$scope.addSlot(new Slot('ColorScheme',
			{"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
				"selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
				"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
					1:{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},
					2:{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},
					3:{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},
					4:{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},
					5:{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},
					6:{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},
					7:{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},
					8:{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},
					9:{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},
					10:{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},
					11:{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},
					12:{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},
					13:{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},
					14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}},
			"Color Scheme",
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// === Output slots ===

		$scope.addSlot(new Slot('ProvidedFormatChanged',
			false,
			'Provided Format Changed',
			'This slot changes value (between true and false) every time the format of the data provided changes, for example if a file with a different type of data is loaded.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DataChanged',
			false,
			'Data Changed',
			'This slot changes value (between true and false) when the data provided changed, even if the provided features etc. did not change.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('DataAccess',
			[],
			'Data Access',
			'This slot contains functions that visualization Webbles can use to access the data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot('ColorScheme');

		myInstanceId = $scope.getInstanceId();

		// start listening to changes on the input slots
		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			if(eventData.targetId == myInstanceId) {
				// $log.log(preDebugMsg + "I was loaded");
				fullyLoaded = true;
			}
		}); // check when we get loaded (fully loaded)

		updateView();

		// setup the things needed for Drag&Drop of field names from us to the visualization Webbles
		$scope.fixDraggable();
	};
	//===================================================================================


	//==========================================================================================
	//=== For updates to listening visualization Webbles when new data or selections arrive. ===
	//==========================================================================================

	//===================================================================================
	// Pause Updates
	// Used by other Webbles that know more than we do to tell use to pause updates for
	// a while.
	//===================================================================================
	$scope.pauseUpdates = function(pauseNow) {
		if(pauseNow) {
			sendingDataMess = true;
		}
		else {
			sendingDataMess = false;
			sendNewSelectionMessageAll(); // tell everyone that the pause is over
		}
	};
	//===================================================================================


	//===================================================================================
	// Send New Selection Message All
	// Tells everyone listening that a new selection has happened.
	//===================================================================================
	function sendNewSelectionMessageAll() {
		for(var feat = 0; feat < dataFields.length; feat++) {
			selectionsDirtyStatus[feat] = true;
			vizSelectionsCache[feat] = [];
			// vizSelectionFunctions[feat] = []; ?? bug ??
		}
		sendNewSelectionMessages();
	}
	//===================================================================================


	//===================================================================================
	// Send New Data Message
	// Tell all listening components that we have loaded new data
	//===================================================================================
	function sendNewDataMessage() {
		// ignore all "newSelections" messages while we tell everyone about the new data
		sendingDataMess = true;
		dataUpdateNumber++;
		for(var f = 0; f < dataListeners.length; f++) {
			for(var v = 0; v < dataListeners[f].length; v++) {
				dataListeners[f][v].newData(dataUpdateNumber);
			}
		}
		sendingDataMess = false;

		// tell everyone that the selections are also changed
		sendNewSelectionMessageAll();
	}
	//===================================================================================


	//===================================================================================
	// Send Give Up Message
	// Tell all listening components that we have loaded new data that is not compatible
	// with what they had before, so they should reset
	//===================================================================================
	function sendGiveUpMessage() {
		$log.log(preDebugMsg + "Data format has changed to something incompatible, tell everyone to clear out their visualization settings.");
		// ignore all "newSelections" messages while we tell everyone about the new data
		sendingDataMess = true;
		dataUpdateNumber++;
		for(var f = 0; f < dataListeners.length; f++) {
			for(var v = 0; v < dataListeners[f].length; v++) {
				var web = $scope.getWebbleByInstanceId(dataListeners[f][v].id);
				web.scope().clearData();
			}
		}
		sendingDataMess = false;
	}
	//===================================================================================


	//===================================================================================
	// Send New Selection Message
	// Selection status of the data items This sends the actual update messages to
	// visualization components listening to updates on various data fields.
	//===================================================================================
	function sendNewSelectionMessages() {
		if(!sendingDataMess) {
			selectionUpdateNumber++;

			var allDirty = true;
			for(var feat = 0; feat < dataFields.length && feat < selectionsDirtyStatus.length; feat++) {
				if(!selectionsDirtyStatus[feat]) {
					allDirty = false;
					break;
				}
			}
			if(allDirty) {
				mapSelectionsToGroupId = {"next":1};
			}

			for(var feat = 0; feat < dataFields.length && feat < selectionsDirtyStatus.length && feat < dataListeners.length; feat++) {
				if(selectionsDirtyStatus[feat]) {
					for(var v = 0; v < dataListeners[feat].length; v++) {
						if(dataListeners[feat][v].listening
							&& dataListeners[feat][v].newSelections !== null) {
							dataListeners[feat][v].newSelections(selectionUpdateNumber);
						}
					}
					selectionsDirtyStatus[feat] = false;
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	//======================== For data access by visualization Webbles =================
	//===================================================================================

	//===================================================================================
	// Add Viz Selection
	// Receiving updates from visualization Webbles when they have new selections.
	//===================================================================================
	function addVizSelection(newViz, fun, featureIdx, firstOfMany, selectAll) {
		var add = true;
		var dirty = true;

		// TODO: we need to listen for updates on this Webble getting deleted, so we can clean up our list when that happens.

		if(!mapVizToNumber.hasOwnProperty(newViz)) {
			var no = mapVizToNumber.next;
			mapVizToNumber.next = mapVizToNumber.next + 1;

			mapVizToNumber[newViz] = Math.pow(8, no);
			// TODO: this part should probably be done better. Or at least be rescaled from time to time.
		}

		if(featureIdx < dataFields.length) {
			for(var viz = 0; viz < vizSelectionFunctions[featureIdx].length; viz++) {
				if(vizSelectionFunctions[featureIdx][viz][1] == newViz) {
					// this visualization component already registered a function and wants to replace it
					add = false;

					if(vizSelectionFunctions[featureIdx][viz][0] === null && fun === null) {
						dirty = false; // had no function before, still have no function, nothing to do
					}
					else {
						if(vizSelectionFunctions[featureIdx][viz][0] === null && selectAll) {
							dirty = false; // we had no function before, and the current function says "selected" for everything
						}
						if(vizSelectionFunctions[featureIdx][viz][2] && selectAll) {
							dirty = false; // the previous function said selected for everything, and so does the new one
						}
						if(vizSelectionFunctions[featureIdx][viz][2] && fun === null) {
							dirty = false; // the previous function said selected for everything, and now we have no function
						}

						vizSelectionFunctions[featureIdx][viz][0] = fun;
						vizSelectionFunctions[featureIdx][viz][2] = selectAll;
					}
					break;
				}
			}

			if(add) {
				vizSelectionFunctions[featureIdx].push([fun, newViz, selectAll]);

				if(fun === null || selectAll) {
					dirty = false; // we had no selection function before, and still do not or we have one that says "selected" for everything
				}
			}

			// check this feature and any related features as dirty
			if(dirty) {
				for(var feat = 0; feat < dataFields[featureIdx].slaves.length; feat++) {
					var s = dataFields[featureIdx].slaves[feat];
					selectionsDirtyStatus[s] = true;
					vizSelectionsCache[s] = [];
				}
			}

		}
		else {
			if(fun !== null) {
				$log.log(preDebugMsg + "Request for registering new selections on an unknown feature.");
			}
			dirty = false;
		}

		// tell all active viz to redraw
		if(!firstOfMany) {
			sendNewSelectionMessages();
		}
	}
	//===================================================================================


	//===================================================================================
	// Cache Setup
	// Sets up the cache
	//===================================================================================
	function cacheSetup() {
		vizSelectionsCache = [];
		vizSelectionsCacheRepresentatives = [];

		for(var f = 0; f < dataFields.length; f++) {
			vizSelectionsCache.push([]);
			vizSelectionsCacheRepresentatives.push(f);
		}

		for(var featureIdx = 0; featureIdx < dataFields.length; featureIdx++) {
			for(var feat = 0; feat < dataFields[featureIdx].masters.length; feat++) {
				var f = dataFields[featureIdx].masters[feat][0];

				// no remap of value index, assume we can use the same cache
				if(dataFields[featureIdx].masters[feat][1] === null) {
					if(f < vizSelectionsCacheRepresentatives[featureIdx]) {
						vizSelectionsCacheRepresentatives[featureIdx] = f;
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Value is Selected
	// Reporting the selection status of data items (used by visualization Webbles).
	//===================================================================================
	function valueIsSelected(featureIdx, valueIdx) {
		if(featureIdx < dataFields.length) {
			var fRep = vizSelectionsCacheRepresentatives[featureIdx];

			// cache hit
			if(valueIdx < vizSelectionsCache[fRep].length && vizSelectionsCache[fRep][valueIdx] >= 0) {
				return vizSelectionsCache[fRep][valueIdx];
			}

			while(!(valueIdx < vizSelectionsCache[fRep].length)) {
				vizSelectionsCache[fRep].push(-1);
			}

			var res = 0;
			var alreadySeen = {};
			var sawSomething = false;

			for(var feat = 0; feat < dataFields[featureIdx].masters.length; feat++) {
				var f = dataFields[featureIdx].masters[feat][0];

				for(var viz = 0; viz < vizSelectionFunctions[f].length; viz++) {

					// this component is no longer visualizing this data
					if(vizSelectionFunctions[f][viz][0] === null) {
						// nothing to do
					}
					else {
						var groupId = 0;
						var vizId = vizSelectionFunctions[f][viz][1];
						var found = false;
						if(alreadySeen.hasOwnProperty(vizId)) {
							for(var ff = 0; ff < alreadySeen[vizId].length; ff++) {
								if(alreadySeen[vizId][ff][0] === dataFields[featureIdx].masters[feat][1]) {
									found = true;
									groupId = alreadySeen[vizId][ff][1]; // we already asked about something that used the same data item identifier
									break;
								}
							}
							if(!found) {
								alreadySeen[vizId].push([dataFields[featureIdx].masters[feat][1], -1]);
							}
						} else {
							alreadySeen[vizId] = [[dataFields[featureIdx].masters[feat][1], -1]];
						}

						if(!found) {
							// if we have a function that selects everything
							if(vizSelectionFunctions[f][viz][2]) {
								groupId = 1;
							}
							else {
								var vIdx = valueIdx;
								if(dataFields[featureIdx].masters[feat][1] !== null) {
									vIdx = dataFields[featureIdx].masters[feat][1](valueIdx); // remap to appropriate index value
								}
								groupId = vizSelectionFunctions[f][viz][0](vIdx);
							}
							alreadySeen[vizId][1] = groupId;
						}

						if(groupId == 0) {
							vizSelectionsCache[fRep][valueIdx] = 0;
							return 0;
						}

						if(!found) {
							var shift = mapVizToNumber[vizId];
							res += shift * groupId;
							sawSomething = true;
						}
					}
				}
			}

			if(sawSomething) {
				if(!mapSelectionsToGroupId.hasOwnProperty(res)) {
					mapSelectionsToGroupId[res] = mapSelectionsToGroupId.next;
					mapSelectionsToGroupId.next = mapSelectionsToGroupId.next + 1;
				}

				var groupId = mapSelectionsToGroupId[res];
				vizSelectionsCache[fRep][valueIdx] = groupId;
				return groupId;
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Fix Draggable
	// Initialize drag&drop dragging source
	// ===================================================================================
	$scope.fixDraggable = function () {
		$timeout(function()
		{
			$scope.theView.find(".hopFileDataWebbleDrag").draggable({
				helper:"clone"
			});
		}, 1);
	};
	// ===================================================================================


	//===================================================================================
	//======================== For file input ===========================================
	//===================================================================================

	//===================================================================================
	// Check if Density
	// We have density data from the Tokyo University group that is binary data and
	// always has a fixed size. Check the file size of binary files to see if they may
	// contain this type of data.
	// ===================================================================================
	function checkIfDensity(fileContents) {
		try {
			var tmpFloat = new Float32Array(fileContents);
			var dim = 256;
			// Todo: Why is the file size this size??
			if(tmpFloat.length != dim*dim*dim && 16908288 != tmpFloat.length) {
				return false;
			}
			else {
				return true;
			}
		} catch(e) {
			return false;
		}
	}
	// ===================================================================================


	//===================================================================================
	// Check if Rockstar
	// Rockstar is a binary data format used by several astrophysics systems.
	// Rockstar files always start with a 64 bit magic number.
	// Check if a file starts with this number and if so assume it to be Rockstar format
	// data.
	// ===================================================================================
	function checkIfRockstar(fileContents) {
		var ROCKSTAR_MAGICstr = "fadedacec0c0d0d0";
		try {
			var tmpUInt = new Uint32Array(fileContents);
			var concat_magic = tmpUInt[1].toString(16) + tmpUInt[0].toString(16);
			return ROCKSTAR_MAGICstr == concat_magic;
		} catch(e) {
			return false;
		}
	}
	// ===================================================================================


	//===================================================================================
	// Reset Variables
	// Resets all vital variables in order to be able to fill with new fresh data
	// ===================================================================================
	function resetVars() {
		theHeaderGrADS = {}; // the GrADS header
		data = {};
		data.fieldNames = [];
		data.fieldTypes = [];
		data.columns = [];
		seenDensities = [];
		seenRockstars = [];
		dataFields = [];
		fileName = "";
		mapSelectionsToGroupId = {"next":1};
		xVecIdx = 0;
		yVecIdx = 0;
		zVecIdx = 0;
		tVecIdx = -1;
		eVecIdx = -1;
		last3Didx = -1;
		tohoku2Ds = [];
		tohokuTimes = [];
	}
	// ===================================================================================


	//===================================================================================
	// Binary File Reader Creator
	// Creates a binary file reader
	// ===================================================================================
	function binFileReaderCreator(list, retry, fname, last) {
		var reader = new FileReader();
		reader.fileList = list;
		reader.theFileWhenRetrying = retry;
		reader.fileName = fname;
		reader.lastFile = last;
		reader.onload = function(e) { fileReaderOnLoadCallbackBinary(e, reader);};

		return reader;
	}
	// ===================================================================================


	//===================================================================================
	//======================== Utility stuff ============================================
	//===================================================================================

	//===================================================================================
	// Trim
	// Trim whitespace from start and end of strings and replace multiple whitespace with
	// one space
	// ===================================================================================
	function trim(str) {
		return str.replace(/^\s+|\s+$/g,'').replace(/\s+/g, ' ');
	}
	// ===================================================================================


	//===================================================================================
	// Char Count
	// Counts the number of times a certain character occurs in a string
	// ===================================================================================
	function charCount(c, str) {
		var res = 0;
		var idx = str.indexOf(c);

		while(idx >= 0) {
			res++;
			idx = str.indexOf(c, idx + 1);
		}
		return res;
	}
	// ===================================================================================


	//===================================================================================
	// File Reader On Load Callback GZip
	// Read file after Unpacking compressed GZip file
	// ===================================================================================
	function fileReaderOnLoadCallbackGZip(e, reader) {
		var compressedContents = new Uint8Array(e.target.result);
		try {
			// $log.log(preDebugMsg + "Try to decompress gzip file");
			var unzipResult = pako.inflate(compressedContents);
			// $log.log(preDebugMsg + "We have contents of gzip file");
			var fn = reader.zippedfn;

			if(fn.indexOf(".csv") >= 0 || fn.indexOf(".txt") >= 0 || fn.indexOf(".json") >= 0) {
				var bb = new Blob([unzipResult.buffer]);

				reader.fileName = fn.replace(".gz", "");
				reader.onload = function(e) { fileReaderOnLoadCallbackText(e, reader);};
				reader.readAsText(bb);
			}
			else if(fn.indexOf(".bin") >= 0 || fn.indexOf(".dat") >= 0) {
				contents = unzipResult.buffer;

				reader.lastFile = true; // TODO: what if there are more than one file?
				reader.theFileWhenRetrying = null; // TODO: what to do here?
				fileReaderOnLoadCallbackBinaryHelper(contents, reader);
			}
			else {
				$log.log(preDebugMsg + "gunzip worked, but the resulting contents are of an unknown type; treating as text.");
				var bb = new Blob(unzipResult);

				reader.dataFileType = "text";
				reader.readAsText(bb);
			}
		} catch (err) {
			$log.log(preDebugMsg + "error when decompressing gzip file");
			$log.log(preDebugMsg + err);
		}
	}
	// ===================================================================================


	//===================================================================================
	// File Reader On Load Callback Zip
	// Read file after Unpacking compressed Zip file
	// ===================================================================================
	function fileReaderOnLoadCallbackZip(e, reader) {
		// $log.log(preDebugMsg + "we seem to have a zip file");

		// use a BlobReader to read the zip from a Blob object
		var blob = new Blob([e.target.result]);
		var myPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

		zip.workerScripts = {
			deflater: [myPath + '/z-worker.js', myPath + '/pako.js', myPath + '/pako_codecs.js'],
			inflater: [myPath + '/z-worker.js', myPath + '/pako.js', myPath + '/pako_codecs.js']
		};

		zip.createReader(new zip.BlobReader(blob), function(reader) {
			// get all entries from the zip
			reader.getEntries(function(entries) {
				for(var ent = 0; ent < entries.length; ent++) {
					// get first entry content as text
					var fn = entries[ent].filename;

					if(fn.indexOf(".csv") >= 0 || fn.indexOf(".txt") >= 0 || fn.indexOf(".json") >= 0 ) {
						// $log.log(preDebugMsg + "this entry is probably text");
						entries[ent].getData(new zip.TextWriter(), function(text) {
							reader.fileName = fn;
							fileReaderOnLoadCallbackTextHelper(text, reader);

							// close the zip reader
							if(ent >= entries.length - 1) {
								reader.close(function() {
									// onclose callback
								});
							}
						}, function(current, total) {
							// onprogress callback
						});
					}

					if(fn.indexOf(".nc") >= 0) {
						entries[ent].getData(new zip.BlobWriter(), function(blob) {
							// text contains the entry data as a String
							var ncreader = new FileReader();
							ncreader.fileList = [fn];
							ncreader.fileIdx = 0;
							ncreader.fileName = fn;
							ncreader.onload = function(e) { fileReaderOnLoadCallbackNetCDF(e, ncreader);};
							ncreader.theFileWhenRetrying = reader.theFileWhenRetrying;
							ncreader.lastFile = true; // TODO, what if there are many files in the archive?
							ncreader.readAsArrayBuffer(blob);

							// close the zip reader
							if(ent >= entries.length - 1) {
								reader.close(function() {
									// onclose callback
								});
							}
						});

					}
					else if(fn.indexOf(".bin") >= 0 || fn.indexOf(".dat") >= 0 ) {
						// $log.log(preDebugMsg + "this entry is probably binary");
						entries[ent].getData(new zip.BlobWriter(), function(blob) {
							// text contains the entry data as a String
							var breader = new FileReader();
							breader.fileName = fn;
							breader.onload = function(e) { fileReaderOnLoadCallbackBinary(e, breader);};
							breader.theFileWhenRetrying = reader.theFileWhenRetrying;
							breader.lastFile = true; // TODO, what if there are many files in the archive?
							breader.readAsArrayBuffer(blob);

							// close the zip reader
							if(ent >= entries.length - 1) {
								reader.close(function() {
									// onclose callback
								});
							}
						}, function(current, total) {
							// onprogress callback
						});
					}
				}
			});
		}, function(error) {
			// onerror callback
		});
	}
	// ===================================================================================


	//===================================================================================
	//======================== Parsing NetCDF files =====================================
	//===================================================================================

	//===================================================================================
	// Get Info from NetCDF File Name
	// Extract information from the NetCDF file name
	// ===================================================================================
	function getInfoFromNetCDFfileName(fileName) {
		var bandExp = /B([0-9][0-9]?)/;
		var ymdExp = /([0-9][0-9][0-9][0-9])[^0-9]?([0-9][0-9])[^0-9]?([0-9][0-9])/;
		var ymdhmsExp = /([0-9][0-9][0-9][0-9])[^0-9]?([0-9][0-9])[^0-9]?([0-9][0-9])[^0-9]?([0-9][0-9])[^0-9]?([0-9][0-9])[^0-9]?([0-9][0-9])/;
		var res = [];
		var match = bandExp.exec(fileName);
		if(match && match.length > 0) {
			res.push(["Band", "number", parseInt(match[1])]);
		}

		match = ymdhmsExp.exec(fileName);
		if(match && match.length > 0) {
			res.push(["TimeStamp", "date", new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]))]);
		}
		else {
			match = ymdExp.exec(fileName);
			if(match && match.length > 0) {
				res.push(["TimeStamp", "date", new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))]);
			}
		}
		return res;
	}
	// ===================================================================================


	//===================================================================================
	// File Reader on Load Callback NetCDF
	// Read file after loading NetCDF file
	// ===================================================================================
	function fileReaderOnLoadCallbackNetCDF(e, reader) {
		var dv = new DataView(e.target.result);
		var myFileName = reader.fileList[reader.fileIdx].name;
		var info = getInfoFromNetCDFfileName(myFileName);
		info.push(["FileNo.", "number", reader.fileIdx]);

		for(var f = 0; f < info.length; f++) {
			var found = false;
			for(var field = 0; field < data.fieldNames.length; field++) {
				if(data.fieldNames[field] == info[f][0]) {
					found = true;
					break;
				}
			}
			if(!found) {
				field = data.fieldNames.length;
				data.fieldNames.push(info[f][0]);
				data.fieldTypes.push([info[f][1]]);
				data.columns.push([]);
			}

			data.columns[field].push(info[f][2]);
		}

		var littleEndian = false;
		// netCDF always uses Bigendian
		var ver = checkIfNetCDF(dv);
		var dataFileIsCorrupt = true;

		if(ver > 0) {
			dataFileIsCorrupt = false;

			// read header
			var ZERO = 0;
			var NC_DIMENSION = 10;
			var NC_VARIABLE = 11;
			var NC_ATTRIBUTE = 12;
			var recordDimension = -1;
			var offset = 4;

			// header: read numrecs
			var numrecs = dv.getUint32(offset, false);
			offset += 4;

			// header: read dim_array
			var dimArr = dv.getUint32(offset, false);
			offset += 4;
			var dimensionArray = [];

			if(dimArr == 0) {
				var temp = dv.getUint32(offset, false);
				offset += 4;

				if(temp != 0) {
					$log.log(preDebugMsg + "expected another 0 when dimension array is absent");
					dataFileIsCorrupt = true;
				}

				// nothing to do
			}
			else if(dimArr == NC_DIMENSION) {
				var dimArrN = dv.getUint32(offset, false);
				offset += 4;

				// header, dim_array: read all dimensions
				for(var d = 0; !dataFileIsCorrupt && d < dimArrN; d++) {
					// read name
					var strL = dv.getUint32(offset, false);
					offset += 4;
					var name = "";
					for(var c = 0; c < strL; c++) {
						var cc = dv.getUint8(offset);
						offset += 1;
						name += String.fromCharCode(cc);
					}
					if(offset % 4 != 0) {
						offset += 4 - (offset % 4);
					}

					// read dimension length
					var l = dv.getUint32(offset, false);
					offset += 4;

					if(l == 0) {
						// $log.log(preDebugMsg + "Found record dimension? dim " + d + " has dim length " + l);
						if(recordDimension >= 0) {
							$log.log(preDebugMsg + "ERROR: Found more than one record dimension!!");
						}
						recordDimension = d;
					}
					dimensionArray.push([name, l]);
				}
			}
			else {
				$log.log(preDebugMsg + "ERROR: unknown tag when expecting 0 or dimension array.");
				dataFileIsCorrupt = true;
			}

			// header: read gatt_array // global attributes
			var gattArr = dv.getUint32(offset, false);
			offset += 4;
			var gattArray = [];

			if(gattArr == 0) {
				// nothing to do
				var temp = dv.getUint32(offset, false);
				offset += 4;

				if(temp != 0) {
					$log.log(preDebugMsg + "expected another 0 when global attribute array is absent");
					dataFileIsCorrupt = true;
				}
			}
			else if(gattArr == NC_ATTRIBUTE) {
				var gattArrN = dv.getUint32(offset, false);
				offset += 4;

				// header, read gatt_array: read each global attribute
				for(var d = 0; !dataFileIsCorrupt && d < gattArrN; d++) {
					// read name
					var strL = dv.getUint32(offset, false);
					offset += 4;

					var name = "";
					for(var c = 0; c < strL; c++) {
						var cc = dv.getUint8(offset);
						offset += 1;
						name += String.fromCharCode(cc);
					}
					if(offset % 4 != 0) {
						offset += 4 - (offset % 4);
					}

					// read type
					var gattType = dv.getUint32(offset, false);
					offset += 4;

					if(gattType > 0 && gattType < 7) {
						//Do Nothing?
					}
					else {
						$log.log(preDebugMsg + "ERROR: unknown data type in global attributes array.");
						dataFileIsCorrupt = true;
					}

					// read #elems
					var l = dv.getUint32(offset, false);
					offset += 4;

					var ls = [];

					// read elements
					for(var a = 0; !dataFileIsCorrupt && a < l; a++) {
						var val = 0;

						switch(gattType) {
							case 1: // byte
								val = dv.getInt8(offset);
								offset += 1;
								break;
							case 2: // char
								val = String.fromCharCode(dv.getUint8(offset));
								offset += 1;
								break;
							case 3: // short
								val = dv.getInt16(offset, false);
								offset += 2;
								break;
							case 4: // int
								val = dv.getInt32(offset, false);
								offset += 4;
								break;
							case 5: // float
								val = dv.getFloat32(offset, false);
								offset += 4;
								break;
							case 6: // double
								val = dv.getFloat64(offset, false);
								offset += 8;
								break;
							default:
								dataFileIsCorrupt = true;
						}
						ls.push(val);
					}
					if(offset % 4 != 0) {
						offset += 4 - (offset % 4);
					}
					if(gattType == 2) {
						ls = ls.join("");
					}
					gattArray.push([name, gattType, ls]);
				}
			}
			else {
				dataFileIsCorrupt = true;
			}

			// header: read var_array
			var varArr = dv.getUint32(offset, false);
			offset += 4;
			var varArray = [];

			if(varArr == 0) {
				// nothing to do
				var temp = dv.getUint32(offset, false);
				offset += 4;

				if(temp != 0) {
					$log.log(preDebugMsg + "expected another 0 when variable array is absent");
					dataFileIsCorrupt = true;
				}
			}
			else if(varArr == NC_VARIABLE) {
				var varArrN = dv.getUint32(offset, false);
				offset += 4;

				// header, read var_array: read each variable
				for(var varArrD = 0; !dataFileIsCorrupt && varArrD < varArrN; varArrD++) {
					// read name
					var strL = dv.getUint32(offset, false);
					offset += 4;
					var vname = "";
					for(var c = 0; c < strL; c++) {
						var cc = dv.getUint8(offset);
						offset += 1;
						vname += String.fromCharCode(cc);
					}
					if(offset % 4 != 0) {
						offset += 4 - (offset % 4);
					}

					// read #elems
					var dimIdN = dv.getUint32(offset, false);
					offset += 4;

					// read [dimid ...]
					var dimIdLs = [];
					for(var dim = 0; !dataFileIsCorrupt && dim < dimIdN; dim++) {
						var dimId = dv.getUint32(offset, false); // this is the index into the dimensionArray
						offset += 4;
						dimIdLs.push(dimId);
					}

					// read vatt_array
					var vattArr = dv.getUint32(offset, false);
					offset += 4;
					var vattArray = [];

					if(vattArr == 0) {
						// nothing to do
						var temp = dv.getUint32(offset, false);
						offset += 4;

						if(temp != 0) {
							$log.log(preDebugMsg + "expected another 0 when variable attribute array is absent");
							dataFileIsCorrupt = true;
						}

					}
					else if(vattArr == NC_ATTRIBUTE) {
						var vattArrN = dv.getUint32(offset, false);
						offset += 4;

						// header, read var_array, read vatt_array: read each variable attribute
						for(var d = 0; !dataFileIsCorrupt && d < vattArrN; d++) {
							// read name
							var strL = dv.getUint32(offset, false);
							offset += 4;

							var name = "";
							for(var c = 0; c < strL; c++) {
								var cc = dv.getUint8(offset);
								offset += 1;
								name += String.fromCharCode(cc);
							}
							if(offset % 4 != 0) {
								offset += 4 - (offset % 4);
							}

							// read type
							var vattType = dv.getUint32(offset, false);
							offset += 4;

							if(vattType > 0 && vattType < 7) {

							} else {
								$log.log(preDebugMsg + "ERROR: unknown data type in global attributes array.");
								dataFileIsCorrupt = true;
							}

							// read #elems
							var l = dv.getUint32(offset, false);
							offset += 4;
							var ls = [];

							// read elements
							for(var a = 0; !dataFileIsCorrupt && a < l; a++) {
								var val = 0;
								switch(vattType) {
									case 1: // byte
										val = dv.getInt8(offset);
										offset += 1;
										break;
									case 2: // char
										val = String.fromCharCode(dv.getUint8(offset));
										offset += 1;
										break;
									case 3: // short
										val = dv.getInt16(offset, false);
										offset += 2;
										break;
									case 4: // int
										val = dv.getInt32(offset, false);
										offset += 4;
										break;
									case 5: // float
										val = dv.getFloat32(offset, false);
										offset += 4;
										break;
									case 6: // double
										val = dv.getFloat64(offset, false);
										offset += 8;
										break;
									default:
										dataFileIsCorrupt = true;
								}
								ls.push(val);
							}
							if(offset % 4 != 0) {
								offset += 4 - (offset % 4);
							}
							if(vattType == 2) {
								ls = ls.join("");
							}
							vattArray.push([name, vattType, ls]);
						}
					} else {
						dataFileIsCorrupt = true;
					}
					// end of read vatt_array

					// read type
					var varType = dv.getUint32(offset, false);
					offset += 4;

					if(varType > 0 && varType < 7) {
						// Do nothing?
					}
					else {
						$log.log(preDebugMsg + "ERROR: unknown data type in variable array.");
						dataFileIsCorrupt = true;
					}

					// read vsize
					var varSize = dv.getUint32(offset, false);
					offset += 4;

					// read begin
					var varOffset = dv.getUint32(offset, false); // this is the offset in the file where the data for this variable begins
					offset += 4;
					if(ver == 2) {
						// 64-bit offset
						var temp = dv.getUint32(offset, false);
						offset += 4;
						$log.log(preDebugMsg + "ERROR: we cannot deal with 64-bit offsets currently.");
						dataFileIsCorrupt = true;
					}

					varArray.push([vname, dimIdLs, vattArray, varType, varSize, varOffset]);
				}
			}
			else {
				dataFileIsCorrupt = true;
			}

			// read data
			var maxOffset = offset;

			// read data for non-record variables
			for(var v = 0; !dataFileIsCorrupt && v < varArray.length; v++) {
				var dimIdLs = varArray[v][1];
				var hasNullVal = false;
				var nullRep = null;
				for(var i = 0; !dataFileIsCorrupt && i < varArray[v][2].length; i++) {
					if(varArray[v][2][i][0] == "_FillValue") {
						nullRep = varArray[v][2][i][2]; // this is a list of values, usually only one
						hasNullVal = true;
					}
				}

				if(dimIdLs.length > 0 && dimIdLs[0] == recordDimension) {
					// record variable, skip now
					continue;
				}
				else {
					var t = varArray[v][3];
					var myOffset = varArray[v][5];
					var val = 0;
					var myType = "string";

					if(dimIdLs.length == 0) {
						// scalar variable
						switch(t) {
							case 1: // byte
								val = dv.getInt8(myOffset);
								myOffset += 1;
								break;
							case 2: // char
								val = String.fromCharCode(dv.getUint8(myOffset));
								myOffset += 1;
								break;
							case 3: // short
								val = dv.getInt16(myOffset, false);
								myOffset += 2;
								break;
							case 4: // int
								val = dv.getInt32(myOffset, false);
								myOffset += 4;
								break;
							case 5: // float
								val = dv.getFloat32(myOffset, false);
								myOffset += 4;
								break;
							case 6: // double
								val = dv.getFloat64(myOffset, false);

								var temp1 = dv.getUint32(myOffset, false);
								var temp2 = dv.getUint32(myOffset + 4, false);
								// $log.log(preDebugMsg + "reading one 64 bit float: " + temp1.toString(16) + " " + temp2.toString(16) + " and got " + val + " at offset " + myOffset + " (" + (myOffset % 4) + " " + (myOffset % 8) + ")");
								var dddd = new Date(1858,11,17);
								var dddd2 = new Date(dddd.getTime() + 24*60*60*1000 * val);
								// $log.log(preDebugMsg + "if 64 bit float is days since 1858-11-17, this represents " + dddd2);

								myOffset += 8;
								break;
							default:
								dataFileIsCorrupt = true;
						}

						if(t == 2) {
							values = String.fromCharCode(values);
							myType = "string";
						}
						else {
							myType = "number";
						}

						if(hasNullVal) {
							for(var nn = 0; nn < nullRep.length; nn++) {
								if(val == nullRep[nn]) {
									val = null;
								}
							}
						}

						values = val;

						if(offset % 4 != 0) {
							offset += 4 - (offset % 4);
						}
					}
					else {
						// not scalar
						if(dimIdLs.length == 1) {
							var values = [];
							var nValues = dimensionArray[dimIdLs[0]][1];

							for(var i = 0; !dataFileIsCorrupt && i < nValues; i++) {
								switch(t) {
									case 1: // byte
										val = dv.getInt8(myOffset);
										myOffset += 1;
										break;
									case 2: // char
										val = String.fromCharCode(dv.getUint8(myOffset));
										myOffset += 1;
										break;
									case 3: // short
										val = dv.getInt16(myOffset, false);
										myOffset += 2;
										break;
									case 4: // int
										val = dv.getInt32(myOffset, false);
										myOffset += 4;
										break;
									case 5: // float
										val = dv.getFloat32(myOffset, false);
										myOffset += 4;
										break;
									case 6: // double
										val = dv.getFloat64(myOffset, false);
										myOffset += 8;
										break;
									default:
										dataFileIsCorrupt = true;
								}

								if(hasNullVal) {
									for(var nn = 0; nn < nullRep.length; nn++) {
										if(val == nullRep[nn]) {
											val = null;
										}
									}
								}
								values.push(val);
							}

							if(t == 2) {
								values = values.join("");
								myType = "string";
							}
							else {
								myType = "vector";
							}
						}
						else if(dimIdLs.length == 2) {
							var values = [];
							var nValues = 1;

							for(var x = 0; !dataFileIsCorrupt && x < dimensionArray[dimIdLs[0]][1]; x++) {
								values.push([]);
								for(var y = 0; !dataFileIsCorrupt && y < dimensionArray[dimIdLs[1]][1]; y++) {
									switch(t) {
										case 1: // byte
											val = dv.getInt8(myOffset);
											myOffset += 1;
											break;
										case 2: // char
											val = String.fromCharCode(dv.getUint8(myOffset));
											myOffset += 1;
											break;
										case 3: // short
											val = dv.getInt16(myOffset, false);
											myOffset += 2;
											break;
										case 4: // int
											val = dv.getInt32(myOffset, false);
											myOffset += 4;
											break;
										case 5: // float
											val = dv.getFloat32(myOffset, false);
											myOffset += 4;
											break;
										case 6: // double
											val = dv.getFloat64(myOffset, false);
											myOffset += 8;
											break;
										default:
											dataFileIsCorrupt = true;
									}

									if(hasNullVal) {
										for(var nn = 0; nn < nullRep.length; nn++) {
											if(val == nullRep[nn]) {
												val = null;
											}
										}
									}
									values[x].push(val);
								}
							}
							values = [values]; // make into a 3D object with one height level
							myType = "3Darray";
						}
						else if(dimIdLs.length == 3) {
							var values = [];
							var nValues = 1;

							for(var x = 0; !dataFileIsCorrupt && x < dimensionArray[dimIdLs[0]][1]; x++) {
								values.push([]);

								for(var y = 0; !dataFileIsCorrupt && y < dimensionArray[dimIdLs[1]][1]; y++) {
									values[x].push([]);

									for(var z = 0; !dataFileIsCorrupt && z < dimensionArray[dimIdLs[2]][1]; z++) {
										switch(t) {
											case 1: // byte
												val = dv.getInt8(myOffset);
												myOffset += 1;
												break;
											case 2: // char
												val = String.fromCharCode(dv.getUint8(myOffset));
												myOffset += 1;
												break;
											case 3: // short
												val = dv.getInt16(myOffset, false);
												myOffset += 2;
												break;
											case 4: // int
												val = dv.getInt32(myOffset, false);
												myOffset += 4;
												break;
											case 5: // float
												val = dv.getFloat32(myOffset, false);
												myOffset += 4;
												break;
											case 6: // double
												val = dv.getFloat64(myOffset, false);
												myOffset += 8;
												break;
											default:
												dataFileIsCorrupt = true;
										}

										if(hasNullVal) {
											for(var nn = 0; nn < nullRep.length; nn++) {
												if(val == nullRep[nn]) {
													val = null;
												}
											}
										}

										values[x][y].push(val);
									}
								}
							}
							myType = "3Darray";
						}
						else {
							$log.log(preDebugMsg + "WARNING: dimensionality is higher than this system expects. Making one big 1-dimensional vector.");
							var values = [];
							var nValues = 1;

							for(var dim = 0; !dataFileIsCorrupt && dim < dimIdLs.length; dim++) {
								nValues *= dimensionArray[dimIdLs[dim]][1];
							}

							for(var i = 0; !dataFileIsCorrupt && i < nValues; i++) {
								switch(t) {
									case 1: // byte
										val = dv.getInt8(myOffset);
										myOffset += 1;
										break;
									case 2: // char
										val = String.fromCharCode(dv.getUint8(myOffset));
										myOffset += 1;
										break;
									case 3: // short
										val = dv.getInt16(myOffset, false);
										myOffset += 2;
										break;
									case 4: // int
										val = dv.getInt32(myOffset, false);
										myOffset += 4;
										break;
									case 5: // float
										val = dv.getFloat32(myOffset, false);
										myOffset += 4;
										break;
									case 6: // double
										val = dv.getFloat64(myOffset, false);
										myOffset += 8;
										break;
									default:
										dataFileIsCorrupt = true;
								}

								if(hasNullVal) {
									for(var nn = 0; nn < nullRep.length; nn++) {
										if(val == nullRep[nn]) {
											val = null;
										}
									}
								}

								values.push(val);
							}

							if(t == 2) {
								values = values.join("");
								myType = "string";
							} else {
								myType = "vector";
							}
						} // high dimension
					} // not scalar

					// put values somewhere
					var found = false;
					for(var field = 0; field < data.fieldNames.length; field++) {
						if(data.fieldNames[field] == varArray[v][0]) {
							found = true;
							break;
						}
					}

					if(!found) {
						field = data.fieldNames.length;
						data.fieldNames.push(varArray[v][0]);
						data.fieldTypes.push([myType]);
						data.columns.push([]);
					}

					data.columns[field].push(values);
					maxOffset = Math.max(maxOffset, varArray[v][5] + varArray[v][4]);
				}
			}

			// read records

			// var records = [];
			var noofRecords = 0;
			offset = maxOffset;

			for(var rec = 0; !dataFileIsCorrupt && rec < numrecs; rec++) {
				for(var v = 0; !dataFileIsCorrupt && v < varArray.length; v++) {
					var dimIdLs = varArray[v][1];
					// var thisRec = [];
					if(dimIdLs.length > 0 && dimIdLs[0] == recordDimension) {
						// record variable
						var found = false;
						for(var field = 0; field < data.fieldNames.length; field++) {
							if(data.fieldNames[field] == varArray[v][0]) {
								found = true;
								break;
							}
						}

						if(!found) {
							field = data.fieldNames.length;
							data.fieldNames.push(varArray[v][0]);
							data.fieldTypes.push(["number"]);
							data.columns.push([]);
						}

						var myType = data.fieldTypes[field];
						var t =  varArray[v][3];

						if(dimIdLs.length == 1) { // first item in dimIdLs is the record dimension
							// scalar variable
							switch(t) {
								case 1: // byte
									val = dv.getInt8(offset);
									offset += 1;
									break;
								case 2: // char
									val = String.fromCharCode(dv.getUint8(offset));
									offset += 1;
									break;
								case 3: // short
									val = dv.getInt16(offset, false);
									offset += 2;
									break;
								case 4: // int
									val = dv.getInt32(offset, false);
									offset += 4;
									break;
								case 5: // float
									val = dv.getFloat32(offset, false);
									offset += 4;
									break;
								case 6: // double
									val = dv.getFloat64(offset, false);
									offset += 8;
									break;
								default:
									dataFileIsCorrupt = true;
							}

							values = val;
							if(t == 2) {
								values = String.fromCharCode(val);
								myType = "string";
							} else {
								myType = "number";
							}

							if(hasNullVal) {
								for(var nn = 0; nn < nullRep.length; nn++) {
									if(val == nullRep[nn]) {
										val = null;
									}
								}
							}

							if(offset % 4 != 0) {
								offset += 4 - (offset % 4);
							}
						}
						else {
							// not scalar
							var values = [];
							var nValues = 1;

							// first item in dimIdLs is the record dimension
							for(var dim = 1; dim < dimIdLs.length; dim++) {
								nValues *= dimensionArray[dimIdLs[dim]][1];
							}

							myType = "vector"; // do more things here

							for(var i = 0; !dataFileIsCorrupt && i < nValues; i++) {
								switch(t) {
									case 1: // byte
										val = dv.getInt8(offset);
										offset += 1;
										break;
									case 2: // char
										val = String.fromCharCode(dv.getUint8(offset));
										offset += 1;
										break;
									case 3: // short
										val = dv.getInt16(offset, false);
										offset += 2;
										break;
									case 4: // int
										val = dv.getInt32(offset, false);
										offset += 4;
										break;
									case 5: // float
										val = dv.getFloat32(offset, false);
										offset += 4;
										break;
									case 6: // double
										val = dv.getFloat64(offset, false);
										offset += 8;
										break;
									default:
										dataFileIsCorrupt = true;
								}

								if(hasNullVal) {
									for(var nn = 0; nn < nullRep.length; nn++) {
										if(val == nullRep[nn]) {
											val = null;
										}
									}
								}

								values.push(val);
							}

							if(offset % 4 != 0) {
								offset += 4 - (offset % 4);
							}
							if(t == 2) {
								values = values.join("");
							}
						}
						data.columns[field].push(values);
						data.fieldTypes[field] = [myType];
						// thisRec.push(values);
					}
				}
				// records.push(thisRec);
				noofRecords++;
			}

			// do something with records

			// $log.log(preDebugMsg + "found " + records.length + " records in the file");
			$log.log(preDebugMsg + "found " + noofRecords + " records in the file");
		}

		if(dataFileIsCorrupt) {
			$log.log(preDebugMsg + "ERROR: File is not a correctly formatted netCDF file, " + myFileName);
		}

		var foundSomething = false;
		for(var i = reader.fileIdx + 1; !foundSomething && i < reader.fileList.length; i++) {
			foundSomething = true;
			var f = reader.fileList[i];
			var reader2 = new FileReader();
			reader2.fileList = reader.fileList;
			reader2.fileIdx = i;
			reader2.onload = function(e) { fileReaderOnLoadCallbackNetCDF(e, reader2);};
			reader2.readAsArrayBuffer(f);
		}

		if(!foundSomething) {
			convertNetCDF();
		}
	}
	//===================================================================================


	//===================================================================================
	// Check if NetCDF
	// Checks if a file is of NetCDF type
	// ===================================================================================
	function checkIfNetCDF(dv) {
		// $log.log(preDebugMsg + "Check if file is netCDF");
		var offset = 0;
		var c = dv.getUint8(offset);
		var d = dv.getUint8(offset + 1);
		var f = dv.getUint8(offset + 2);
		var ver = dv.getUint8(offset + 3);

		if(c != 67 || d != 68 || f != 70) {
			// first three bytes should be "CDF"
			return -1;
		}

		if(ver != 1 && ver != 2) {
			// unknown version number
			return -1;
		}

		return ver;
	}
	//===================================================================================


	//===================================================================================
	// Convert NetCDF
	// Converts (Parses) the NetCDF file to useful format
	// ===================================================================================
	function convertNetCDF() {
		if(!fullyLoaded) {
			return;
		}

		var bandFieldIdx = -1;
		var timeFieldIdx = -1;

		for(var f = 0; f < data.fieldNames.length; f++) {
			var fieldInf = {};

			fieldInf.name = data.fieldNames[f];
			fieldInf.type = data.fieldTypes[f];
			fieldInf.size = data.columns[f].length;
			fieldInf.idx = f;
			fieldInf.listen = addListeningViz;

			// fields that need updating when this field changes
			fieldInf.slaves = [f];
			// fields that when change also affects this field, and a function to transform the index to the appropriate value
			fieldInf.masters = [[f, null]];

			fieldInf.val = valHelper(f);
			fieldInf.newSel = addSelHelper(f);
			fieldInf.sel = selHelper(f);

			dataFields.push(fieldInf);

			if(fieldInf.name == "Band") {
				bandFieldIdx = f;
			}
			if(fieldInf.name == "TimeStamp") {
				timeFieldIdx = f;
			}
		}

		var noofFields = dataFields.length;
		for(var f = 0; f < noofFields; f++) {
			dataFields[f].slaves = [];
			dataFields[f].masters = [];

			for(var ff = 0; ff < noofFields; ff++) {
				dataFields[f].slaves.push(ff);
				dataFields[f].masters.push([ff, null]);
			}
		}

		// TODO: we would like to add the longitude and latitude fields (now vectors)
		var masters = [];
		var ourStartIdx = 0;
		var xIdx = -1;
		var xIdxSize = 0;
		var yIdx = -1;
		var yIdxSize = 0;
		var zIdx = -1;
		var zIdxSize = 0;
		var firstV = true;

		for(var f = ourStartIdx; f < data.fieldNames.length; f++) {
			if(data.fieldTypes[f][0] == "vector") {
				var vLen = data.columns[f][0].length;
				var found = false;

				for(var f2 = ourStartIdx; f2 < data.fieldNames.length; f2++) {
					if(data.fieldTypes[f2][0] == "3Darray") {
						var xLen = data.columns[f2][0][0][0].length;
						var yLen = data.columns[f2][0][0].length;
						var zLen = data.columns[f2][0].length;
						if(zLen == 1) {
							zIdx = -1;
							zIdxSize = 1;
						}

						if(xLen != yLen) {
							if(xLen == vLen) {
								// guess that this is the x dimension
								xIdx = f;
								xIdxSize = xLen;
								found = true;
							}
							if(yLen == vLen) {
								yIdx = f;
								yIdxSize = yLen;
								found = true;
							}
						}
						else {
							if(xLen == vLen) {
								if(firstV) {
									xIdx = f;
									xIdxSize = xLen;
									found = true;
								}
								else {
									yIdx = f;
									yIdxSize = yLen;
									found = true;
								}
							}
						}
					}
				}

				if(found) {
					var isNumNow = false;
					for(var t = 0; t < data.fieldTypes[f].length; t++) {
						if(data.fieldTypes[f][t] == "number") {
							isNumNow = true;
						}
					}
					if(!isNumNow) {
						data.fieldTypes[f].push("number");
					}
				}
				firstV = false;
			}
		}

		if(xIdx >= 0) {
			var fieldInf = {};
			fieldInf.name = "X coordinates";
			fieldInf.type = ["number", "longitude"]; // lat? lon?
			fieldInf.size = xIdxSize;
			fieldInf.listen = addListeningViz;
			fieldInf.val = function(idx) { return data.columns[xIdx][0][idx]; };
			var xVecIdx = dataFields.length;
			masters.push([xVecIdx, transformCellIdxToXidxHelper]);
			fieldInf.slaves = [xVecIdx];
			fieldInf.masters = [[xVecIdx, null]];
			fieldInf.newSel = addSelHelper(xVecIdx);
			fieldInf.sel = selHelper(xVecIdx);

			dataFields.push(fieldInf);
		}

		if(yIdx >= 0) {
			var fieldInf = {};
			fieldInf.name = "Y coordinates";
			fieldInf.type = ["number", "latitude"]; // lat? lon?
			fieldInf.size = yIdxSize;
			fieldInf.listen = addListeningViz;
			fieldInf.val = function(idx) { return data.columns[yIdx][0][idx]; };
			var yVecIdx = dataFields.length;
			masters.push([yVecIdx, transformCellIdxToYidxHelper]);
			fieldInf.slaves = [yVecIdx];
			fieldInf.masters = [[yVecIdx, null]];
			fieldInf.newSel = addSelHelper(yVecIdx);
			fieldInf.sel = selHelper(yVecIdx);

			dataFields.push(fieldInf);
		}

		if(zIdxSize == 1) {
			var fieldInf = {};
			fieldInf.name = "Z coordinates";
			fieldInf.type = ["number"]; // lat? lon?
			fieldInf.size = zIdxSize;
			fieldInf.listen = addListeningViz;
			fieldInf.val = function(idx) { return 0; }; // return data.columns[zIdx][0][idx]; }; // this is not correct, what to do when there is and when there is not a Z-array to use?
			var zVecIdx = dataFields.length;
			masters.push([zVecIdx, transformCellIdxToZidxHelper]);
			fieldInf.slaves = [zVecIdx];
			fieldInf.masters = [[zVecIdx, null]];
			fieldInf.newSel = addSelHelper(zVecIdx);
			fieldInf.sel = selHelper(zVecIdx);

			dataFields.push(fieldInf);
		}

		// provide data as idx -> x, y, z, val1, val2, etc.
		// ----------------------------------------------------------------
		var first = true;
		var ourStartIdx = 0;
		for(var f = ourStartIdx; f < data.fieldNames.length; f++) {
			if(data.fieldTypes[f][0] == "3Darray") {
				var cubeValuesSize = data.columns[f].length * data.columns[f][0].length * data.columns[f][0][0].length * data.columns[f][0][0][0].length;
				var ff = f;

				if(first) {
					var fieldInf = {};
					fieldInf.name = "idx -> X";
					fieldInf.type = ["number", "longitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
						return coords[3];
					};

					var ffx = f;
					var listenerFeatureIdxX = dataFields.length;
					fieldInf.sel = selHelper(listenerFeatureIdxX);
					fieldInf.newSel = addSelHelper(listenerFeatureIdxX);

					fieldInf.slaves = [listenerFeatureIdxX];
					fieldInf.masters = [[listenerFeatureIdxX, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxX);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxX);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Y";
					fieldInf.type = ["number", "latitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
						return coords[2];
					};

					var ffy = f;
					var listenerFeatureIdxY = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxY);
					fieldInf.sel = selHelper(listenerFeatureIdxY);

					fieldInf.slaves = [listenerFeatureIdxY];
					fieldInf.masters = [[listenerFeatureIdxY, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxY);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxY);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Z";
					fieldInf.type = ["number"];
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
						return coords[1];
					};

					var ffz = f;
					var listenerFeatureIdxZ = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxZ);
					fieldInf.sel = selHelper(listenerFeatureIdxZ);

					fieldInf.slaves = [listenerFeatureIdxZ];
					fieldInf.masters = [[listenerFeatureIdxZ, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxZ);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxZ);
					}

					dataFields.push(fieldInf);

					// we have "band" data
					if(bandFieldIdx >= 0) {
						var fieldInf = {};
						fieldInf.name = "idx -> Band";
						fieldInf.type = ["number"];
						fieldInf.size = cubeValuesSize;
						fieldInf.listen = addListeningViz;
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
							return dataFields[bandFieldIdx].val(coords[0]);
						};

						var ffb = f;
						var listenerFeatureIdxB = dataFields.length;
						fieldInf.newSel = addSelHelper(listenerFeatureIdxB);
						fieldInf.sel = selHelper(listenerFeatureIdxB);

						fieldInf.slaves = [listenerFeatureIdxB];
						fieldInf.masters = [[listenerFeatureIdxB, null]];
						for(var fff = ourStartIdx; fff < noofFields; fff++) {
							fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
							dataFields[fff].slaves.push(listenerFeatureIdxB);
						}
						for(var fff = 0; fff < masters.length; fff++) {
							fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
							dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxB);
						}

						dataFields.push(fieldInf);
					}
				}

				first = false;
				var fieldInf = {};
				fieldInf.name = "idx -> " + data.fieldNames[f];
				fieldInf.type = ["number"];
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				var fieldIdx = dataFields.length;
				var originalFieldIdx = f;
				fieldInf.val = valHelper1D(originalFieldIdx);
				fieldInf.newSel = addSelHelper(fieldIdx);
				fieldInf.sel = selHelper(fieldIdx);
				fieldInf.slaves = [fieldIdx];
				fieldInf.masters = [[fieldIdx, null]];

				for(var fff = 0; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
					dataFields[fff].slaves.push(fieldIdx);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(fieldIdx);
				}
				dataFields.push(fieldInf);
			}
		}

		// all cube cells depend on all other cube cells, for now
		for(var f1 = noofFields + masters.length; f1 < dataFields.length; f1++) {
			for(var f2 = f1 + 1; f2 < dataFields.length; f2++) {
				dataFields[f1].slaves.push(f2);
				dataFields[f1].masters.push([f2, null]);
				dataFields[f2].slaves.push(f1);
				dataFields[f2].masters.push([f1, null]);
			}
		}

		parsingFinished();
	}
	//===================================================================================


	//===================================================================================
	// Parsing Finished
	// Method that do what is needed to be done after file parsing is finished.
	// ===================================================================================
	function parsingFinished() {
		selectionsDirtyStatus = [];
		while(dataFields.length > selectionsDirtyStatus.length) {
			selectionsDirtyStatus.push(true);
		}

		vizSelectionFunctions = [];
		while(dataFields.length > vizSelectionFunctions.length) {
			vizSelectionFunctions.push([]);
		}

		while(dataFields.length > dataListeners.length) {
			dataListeners.push([]);
		}

		cacheSetup();

		var ls = [];
		var sourceName = $scope.gimme("PluginName");
		var dataSetName = sourceName;
		var dataSetIdx = 0;
		var fieldName = "";

		for(var f = 0 ; f < dataFields.length; f++) {
			fieldName = dataFields[f].name;
			var info = {"webbleID":myInstanceId, "type":dataFields[f].type, "slotName":"DataAccess", "fieldIdx":f, "sourceName":sourceName, "fieldName":fieldName};
			ls.push({"name":fieldName, "type":dataFields[f].type.join("|"), "noofRows":dataFields[f].size, "id":JSON.stringify(info)});
		}

		var visualizationCanKeepGoing = true;
		if(ls.length < $scope.dragNdropData.fields) {
			visualizationCanKeepGoing = false;
		}
		else {
			for(var i = 0; i < ls.length && i < $scope.dragNdropData.fields.length; i++) {
				if(ls[i].type != $scope.dragNdropData.fields[i].type) {
					visualizationCanKeepGoing = false;
				}
			}
		}

		$scope.dragNdropData.fields = ls;
		$scope.set("DataAccess", dataFields);

		updateView();

		$timeout(function() { $scope.fixDraggable(); },1);

		// tell all visualization components that the data has changed
		mapSelectionsToGroupId = {"next":1};

		if(visualizationCanKeepGoing) {
			sendNewDataMessage();
		}
		else {
			sendGiveUpMessage();
		}

		$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
		$scope.set("DataChanged", !$scope.gimme("DataChanged"));
	}
	//===================================================================================


	//===================================================================================
	//======================== Parsing various text formats =============================
	//===================================================================================

	//===================================================================================
	// Load By Function Call
	// Method that loads data based on function call.
	// ===================================================================================
	$scope.loadByFunctionCall = function(contents) {
		// $log.log(preDebugMsg + "loadByFunctionCall");
		try {
			if(typeof contents === 'string') {
				var jsonContents = JSON.parse(contents);
			}
			else {
				jsonContents = contents;
			}

			if(jsonContents.hasOwnProperty("fieldNames") && jsonContents.hasOwnProperty("fieldTypes") && jsonContents.hasOwnProperty("columns")) {
				data = {};
				data.fieldNames = [];
				data.fieldTypes = [];
				data.columns = [];

				for(var f = 0; f < jsonContents.columns.length; f++) {
					data.columns.push(jsonContents.columns[f]);
					data.fieldNames.push(jsonContents.fieldNames[f]);
					data.fieldTypes.push(jsonContents.fieldTypes[f]);
				}
			}


			for(var f = 0; f < data.fieldNames.length; f++) {
				var fieldInf = {};
				fieldInf.name = data.fieldNames[f];
				fieldInf.type = [data.fieldTypes[f]];
				if(fieldInf.type[0] == "latitude" || fieldInf.type[0] == "longitude") {
					fieldInf.type.push("number");
				}
				fieldInf.size = data.columns[f].length;
				fieldInf.idx = f;

				fieldInf.listen = addListeningViz;

				// fields that need updating when this field changes
				fieldInf.slaves = [f];
				// fields that when change also affects this field, and a function to transform the index to the appropriate value
				fieldInf.masters = [[f, null]];

				fieldInf.val = valHelper(f);
				fieldInf.newSel = addSelHelper(f);
				fieldInf.sel = selHelper(f);

				dataFields.push(fieldInf);
			}

			var noofFields = dataFields.length;
			for(var f = 0; f < noofFields; f++) {
				dataFields[f].slaves = [];
				dataFields[f].masters = [];

				for(var ff = 0; ff < noofFields; ff++) {
					dataFields[f].slaves.push(ff);
					dataFields[f].masters.push([ff, null]);
				}
			}

			parsingFinished();
		} catch(e) {
			$log.log(preDebugMsg + "Could not parse JSON data.");
			//dataIsCorrupt = true;
		}
	}
	//===================================================================================


	//===================================================================================
	// File Reader on Load Callback Text
	// Method that reads the text data result after load callback.
	// ===================================================================================
	function fileReaderOnLoadCallbackText(e, reader) {
		fileReaderOnLoadCallbackTextHelper(e.target.result, reader);
	}
	//===================================================================================


	//===================================================================================
	// File Reader on Load Callback Text Helper
	// Method that reads the text data content after load callback.
	// ===================================================================================
	function fileReaderOnLoadCallbackTextHelper(contents, reader) {
		var dataIsCorrupt = false;

		if(!data.hasOwnProperty("fieldNames")) {
			data.fieldNames = [];
		}
		if(!data.hasOwnProperty("fieldTypes")) {
			data.fieldTypes = [];
		}
		if(!data.hasOwnProperty("columns")) {
			data.columns = [];
		}

		if(!data.hasOwnProperty("metaData")) {
			data.metaData = {};
		}

		if(reader.fileName.indexOf(".json") >= 0) {
			try {
				var jsonContents = JSON.parse(contents);

				if(jsonContents.hasOwnProperty("fieldNames") && jsonContents.hasOwnProperty("fieldTypes") && jsonContents.hasOwnProperty("columns")) {
					for(var f = 0; f < jsonContents.columns.length; f++) {
						data.columns.push(jsonContents.columns[f]);
						data.fieldNames.push(jsonContents.fieldNames[f]);
						data.fieldTypes.push(jsonContents.fieldTypes[f]);
					}
				}
			} catch(e) {
				$log.log(preDebugMsg + "Could not parse JSON data.");
				dataIsCorrupt = true;
			}
		}
		else { // not JSON
			var cleanContents = contents.replace(/[\r\n]+/g, "\n");
			var p1 = 0;
			var p2 = p1;

			//  Check field names and field types

			//  Guess row separator
			var haveHeader = false;
			var semiColonIsSeparator = false;
			var newLineIsSeparator = true;
			var separator = ',';

			// try to figure out row separator
			var semiColonsBeforeNewLine = 0;
			while (p2 < cleanContents.length && cleanContents[p2] != '\n') {
				if(cleanContents[p2] == ';') {
					semiColonsBeforeNewLine++;
					semiColonIsSeparator = true;
				}
				p2++;
			}
			if(p2 >= cleanContents.length) {
				newLineIsSeparator = false;
			}
			if(newLineIsSeparator && semiColonsBeforeNewLine != 1) {
				semiColonIsSeparator = false;
			}

			if(newLineIsSeparator && semiColonIsSeparator) {
				$log.log(preDebugMsg + "Row separator is ';\\n'");
			}
			else if(newLineIsSeparator && !semiColonIsSeparator) {
				$log.log(preDebugMsg + "Row separator is '\\n'");
			}
			else if(!newLineIsSeparator && semiColonIsSeparator) {
				$log.log(preDebugMsg + "Row separator is ';'");
			}
			else {
				$log.log(preDebugMsg + "Row separator is unclear... there is only one row?");
				// dataIsCorrupt = true;
			}

			//  Guess field separator (column separator)
			if (!dataIsCorrupt){
				// try to figure out column separator
				p1 = 0;
				p2 = p1;
				var semiColonsBeforeNewLine1 = 0;
				var colonsBeforeNewLine1 = 0;
				var tabsBeforeNewLine1 = 0;
				var spacesBeforeNewLine1 = 0;
				var commasBeforeNewLine1 = 0;
				var rightparBeforeNewLine1 = 0;
				var hashesBeforeNewLine1 = 0;

				// var firstLineStartsWithHash = false;
				// var firstLineStartsWithHashAndSpaceOrTab = false;

				while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
					if(cleanContents[p2] == '#') {
						hashesBeforeNewLine1++;

						if(p2 == 0) {
							firstLineStartsWithHash = true;
						}
					}
					if(cleanContents[p2] == ';') {
						semiColonsBeforeNewLine1++;
					}
					if(cleanContents[p2] == ':') {
						colonsBeforeNewLine1++;
					}
					if(cleanContents[p2] == '\t') {
						tabsBeforeNewLine1++;

						// if(p2 == 1 && firstLineStartsWithHash) {
						// 	firstLineStartsWithHashAndSpaceOrTab = true;
						// }
					}
					if(cleanContents[p2] == ',') {
						commasBeforeNewLine1++;
					}
					if(cleanContents[p2] == ' ') {
						spacesBeforeNewLine1++;

						// if(p2 == 1 && firstLineStartsWithHash) {
						// 	firstLineStartsWithHashAndSpaceOrTab = true;
						// }
					}
					if(cleanContents[p2] == ')') {
						rightparBeforeNewLine1++;
					}
					p2++;
				}
				while (p2 < cleanContents.length && ((newLineIsSeparator && cleanContents[p2] == '\n') || (semiColonIsSeparator && cleanContents[p2] == ';'))) {
					p2++;
				}

				var onlyOneRow = 1;
				var onlyOneColumn = 0;
				var semiColonsBeforeNewLine2 = 0;
				var colonsBeforeNewLine2 = 0;
				var tabsBeforeNewLine2 = 0;
				var spacesBeforeNewLine2 = 0;
				var commasBeforeNewLine2 = 0;
				while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
					onlyOneRow = 0;

					if(cleanContents[p2] == ';') {
						semiColonsBeforeNewLine2++;
					}
					if(cleanContents[p2] == ':') {
						colonsBeforeNewLine2++;
					}
					if(cleanContents[p2] == '\t') {
						tabsBeforeNewLine2++;
					}
					if(cleanContents[p2] == ',') {
						commasBeforeNewLine2++;
					}
					if(cleanContents[p2] == ' ') {
						spacesBeforeNewLine2++;
					}
					p2++;
				}

				var separatorIsSemiColon = false;
				var separatorIsColon = false;
				var separatorIsTab = false;
				var separatorIsComma = false;
				var separatorIsSpace = false;
				var separatorIsSpaceAndHeaderPars = false;

				if(onlyOneRow) {
					// var mostFrequent = Math.max(semiColonsBeforeNewLine1, commasBeforeNewLine1, tabsBeforeNewLine1, colonsBeforeNewLine1, spacesBeforeNewLine1);

					if(tabsBeforeNewLine1 > 0) {
						separatorIsTab = true;
					} else if(commasBeforeNewLine1 > 0) {
						separatorIsComma = true;
					} else if(semiColonsBeforeNewLine1 > 0) {
						separatorIsSemiColon = true;
					} else if(spacesBeforeNewLine1 > 0) {
						separatorIsSpace = true;
					} else if(colonsBeforeNewLine1 > 0) {
						separatorIsColon = true;
					}
				}
				else {
					if(semiColonsBeforeNewLine2 == semiColonsBeforeNewLine1 && semiColonsBeforeNewLine2 > 0) {
						separatorIsSemiColon = true;
					}
					if(commasBeforeNewLine2 == commasBeforeNewLine1 && commasBeforeNewLine2 > 0) {
						separatorIsComma = true;
					}
					if(tabsBeforeNewLine2 == tabsBeforeNewLine1 && tabsBeforeNewLine2 > 0) {
						separatorIsTab = true;
						// firstLineStartsWithHashAndSpaceOrTab = false;
					}
					if(colonsBeforeNewLine2 == colonsBeforeNewLine1 && colonsBeforeNewLine2 > 0) {
						separatorIsColon = true;
					}
					if(spacesBeforeNewLine2 == spacesBeforeNewLine1 && spacesBeforeNewLine2 > 0) {
						separatorIsSpace = true;
						// firstLineStartsWithHashAndSpaceOrTab = false;
					}
					if(spacesBeforeNewLine2 + 1 == rightparBeforeNewLine1 && spacesBeforeNewLine2 > 0 && spacesBeforeNewLine2 != spacesBeforeNewLine1) {
						separatorIsSpaceAndHeaderPars = true;
						// firstLineStartsWithHashAndSpaceOrTab = false;
					}

					// if(spacesBeforeNewLine2 + 1 == spacesBeforeNewLine1 && firstLineStartsWithHashAndSpaceOrTab && spacesBeforeNewLine1 > 0) {
					//     separatorIsSpace = true;
					// }
					// if(tabsBeforeNewLine2 + 1 == tabsBeforeNewLine1 && firstLineStartsWithHashAndSpaceOrTab && tabsBeforeNewLine2 > 0) {
					//     separatorIsTab = true;
					// }
				}

				if(separatorIsComma) {
					separatorIsSemiColon = false;
					separatorIsColon = false;
					separatorIsTab = false;
					// separatorIsComma = false;
					separatorIsSpace = false;
					separatorIsSpaceAndHeaderPars = false;
					separator = ',';
				}
				else if(separatorIsSemiColon) {
					// separatorIsSemiColon = false;
					separatorIsColon = false;
					separatorIsTab = false;
					separatorIsComma = false;
					separatorIsSpace = false;
					separatorIsSpaceAndHeaderPars = false;
					separator = ';';
				}
				else if(separatorIsColon) {
					separatorIsSemiColon = false;
					// separatorIsColon = false;
					separatorIsTab = false;
					separatorIsComma = false;
					separatorIsSpace = false;
					separatorIsSpaceAndHeaderPars = false;
					separator = ':';
				}
				else if(separatorIsTab) {
					separatorIsSemiColon = false;
					separatorIsColon = false;
					// separatorIsTab = false;
					separatorIsComma = false;
					separatorIsSpace = false;
					separatorIsSpaceAndHeaderPars = false;
					separator = '\t';
				}
				else if(separatorIsSpace) {
					separatorIsSemiColon = false;
					separatorIsColon = false;
					separatorIsTab = false;
					separatorIsComma = false;
					// separatorIsSpace = false;
					separatorIsSpaceAndHeaderPars = false;
					separator = ' ';
				}
				else if(separatorIsSpaceAndHeaderPars) {
					separatorIsSemiColon = false;
					separatorIsColon = false;
					separatorIsTab = false;
					separatorIsComma = false;
					separatorIsSpace = false;
					// separatorIsSpaceAndHeaderPars = false;
					separator = ' ';
				}
				else {
					res = checkForVariousTypesOfComments(cleanContents, semiColonIsSeparator, newLineIsSeparator);
					separator = res.sep;
					cleanContents = res.fileContents;

					if(separator == "") {
						$log.log(preDebugMsg + "Could not determine column separator. " + commasBeforeNewLine1 + " and " + commasBeforeNewLine2 + " commas, " + tabsBeforeNewLine1 + " and " + tabsBeforeNewLine2 + " TABs. Assume only one column.");
						onlyOneColumn = 1;
						// dataIsCorrupt = true;
					}
				}
			}

			//  Guess field names
			if (!dataIsCorrupt) {
				if(onlyOneColumn) {
					// $log.log(preDebugMsg + "Using '" + separator + "' as column separator");
					if(!onlyOneRow) {
						p1 = 0;
						p2 = p1;
						while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
							p2++;
						}
						var firstRow = cleanContents.substr(p1, p2 - p1);

						while (p2 < cleanContents.length && ((newLineIsSeparator && cleanContents[p2] == '\n') || (semiColonIsSeparator && cleanContents[p2] == ';'))) {
							p2++;
						}
						p1 = p2;
						while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
							p2++;
						}
						var secondRow = cleanContents.substr(p1, p2 - p1);
						if(firstRow.match("[a-zA-Z]+") && !secondRow.match("[a-zA-Z]+")) {
							data.fieldNames.push(firstRow);
							data.fieldTypes.push("number");
							data.columns.push([]);
							haveHeader = true;
						}
						else {
							data.fieldNames.push("UnNamedField");
							data.fieldTypes.push("number");
							data.columns.push([]);
						}
					}
					else {
						data.fieldNames.push("UnNamedField");
						data.fieldTypes.push("number");
						data.columns.push([]);
					}
				}
				else {
					$log.log(preDebugMsg + "Using '" + separator + "' as column separator");
					// try to guess column names
					p1 = 0;
					p2 = p1;

					while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
						p2++;
					}

					if (p2 <= cleanContents.length) {
						var firstRow = cleanContents.substr(p1, p2 - p1);
						var items = firstRow.split(separator);

						// if((separatorIsSpace || separatorIsTab)
						//    && firstLineStartsWithHashAndSpaceOrTab) {
						// 	items = items.slice(1, items.length); // remove first #
						// }

						if(separatorIsSpaceAndHeaderPars) {
							items = [];
							p1 = 0;
							p2 = p1;
							var lastPossibleStart = 0;
							var lastPossibleEnd = 0;
							var firstPar = true;
							while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
								if(cleanContents[p2] == ' ') {
									lastPossibleEnd = p2;
								}
								if(cleanContents[p2] == ')') {
									if(firstPar) {
										firstPar = false;
									} else {
										// definately separate around here
										if(lastPossibleEnd > lastPossibleStart) {
											// we saw some space, so we may have things like "(1) first col name (2) second col name"
											var newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
											items.push(newItem);
											lastPossibleStart = lastPossibleEnd + 1;
										}
										else {
											lastPossibleEnd = p2 - 1;
											if(lastPossibleEnd <= lastPossibleStart) {
												lastPossibleEnd = lastPossibleStart;
											}
											var newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
											items.push(newItem);
											lastPossibleStart = lastPossibleEnd + 1;
										}
									}
								}
								p2++;
							}

							// add last item
							lastPossibleEnd = p2;
							if(lastPossibleEnd <= lastPossibleStart) {
								lastPossibleEnd = lastPossibleStart;
							}
							newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
							items.push(newItem);
						}

						var allStrings = true;
						for (var i = 0; i < items.length; i++) {
							if(!items[i].match("[a-zA-Z]+")) {
								allStrings = false;
								break;
							}
						}

						if(allStrings && !onlyOneRow) { // probably header
							for (var i = 0; i < items.length; i++) {
								data.fieldNames.push(items[i]);
								data.fieldTypes.push("number");
								data.columns.push([]);
							}

							// strip off # if the first character on the line is #
							if(hashesBeforeNewLine1 == 1) {
								if(data.fieldNames[0][0] == "#") {
									data.fieldNames[0] = data.fieldNames[0].substr(1, data.fieldNames[0].length - 1);
								}
							}
							haveHeader = true;
						}
						else {
							for (var i = 0; i < items.length; i++){
								data.fieldNames.push("UnNamedField" + i);
								data.fieldTypes.push("number");
								data.columns.push([]);
							}
						}
					}
					else { // p2 <= cleanContents.length
						data.fieldNames.push("UnNamedField");
						data.fieldTypes.push("number");
						data.columns.push([]);
					}
				} // more than one column
			} // data not corrupt

			//  Guess data types
			var vectorLengths = [];
			var sawNonNullValueInColumn = [];
			var minMax = [];
			for(var i = 0; i < data.fieldTypes.length; i++) {
				minMax.push({"min":null, "max":null});
				vectorLengths.push(0);
				sawNonNullValueInColumn.push(false);
			}

			if (!dataIsCorrupt) {
				p1 = 0;
				var moreLines = true;
				var firstLine = true;
				while (moreLines){
					p2 = p1 + 1;
					while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
						p2++;
					}

					if (p2 <= cleanContents.length) {
						if(firstLine && haveHeader) {
							firstLine = false;
						}
						else {
							var row = cleanContents.substr(p1, p2 - p1);

							if(onlyOneColumn) {
								var nval = parseFloat(row);
								var num = !isNaN(nval) && isFinite(nval);
								if(!num) {
									data.fieldTypes[0] = "string";
								}
								else {
									if(minMax[0].min === null) {
										minMax[0].min = nval;
									}
									else {
										minMax[0].min = Math.min(minMax[0].min, nval);
									}

									if(minMax[0].max === null) {
										minMax[0].max = nval;
									}
									else {
										minMax[0].max = Math.max(minMax[0].max, nval);
									}
								}
								var items = [row];
							}
							else {
								var items = row.split(separator);

								if (items.length != data.fieldNames.length) {
									dataIsCorrupt = true;
									$log.log(preDebugMsg + "Rows have different number of columns");
									break;
								}

								for (var i = 0; i < items.length; i++) {
									if(items[i].length <= 0) {
										// null value, can be any type
									}
									else {
										var nval = parseFloat(items[i]);
										var num = !isNaN(nval) && isFinite(items[i]);
										if(!num) {
											data.fieldTypes[i] = "string";
											var nColons = charCount(":", items[i]);
											var nAts = charCount("@", items[i]);

											if(nAts > 0 && (nColons == nAts || nColons == nAts - 1)) { // last item does not have a : as separator, so the counts normally differ by 1
												if(vectorLengths[i] == 0 || vectorLengths[i] == nAts) {
													data.fieldTypes[i] = "vector";
												}
												else {
													data.fieldTypes[i] = "string";
												}
												vectorLengths[i] == nAts;
											}
										}
										else {
											if(minMax[i].min === null) {
												minMax[i].min = nval;
											}
											else {
												minMax[i].min = Math.min(minMax[i].min, nval);
											}

											if(minMax[i].max === null) {
												minMax[i].max = nval;
											}
											else {
												minMax[i].max = Math.max(minMax[i].max, nval);
											}
										}
									}
								}
							}
						}

						p1 = p2;
						while (p1 < cleanContents.length && ((newLineIsSeparator && cleanContents[p1] == '\n') || (semiColonIsSeparator && cleanContents[p1] == ';'))) {
							p1++;
						}

						if (p1 >= cleanContents.length) {
							moreLines = false;
						}
					}
					else {
						moreLines = false;
					}
				}
			}

			if(!dataIsCorrupt) {
				for(var i = 0; i < data.fieldTypes.length; i++) {
					var ftype = data.fieldTypes[i];
					var fname = data.fieldNames[i];

					if (ftype == "number" && fname.toLowerCase().indexOf("latitude") >= 0) {
						ftype = "latitude";
					}
					if (ftype == "number" && fname.toLowerCase().indexOf("longitude") >= 0) {
						ftype = "longitude";
					}

					if (fname.toLowerCase().indexOf("time") >= 0 && fname.toLowerCase().indexOf("time to") < 0) {
						if(ftype != "number" || minMax[i].max - minMax[i].min > 1) {
							ftype = "date";
						}
					}
					if (fname.toLowerCase().indexOf("date") >= 0) {
						if(ftype != "number" || minMax[i].max - minMax[i].min > 1) {
							ftype = "date";
						}
					}
					data.fieldTypes[i] = ftype;
				}
			}

			if (!dataIsCorrupt) {
				//  Parse data and create vectors
				noofRows = 0;
				var id = 0;
				p1 = 0;
				var moreLines = true;
				var firstLine = true;
				while (moreLines) {
					p2 = p1 + 1;
					while (p2 < cleanContents.length && (!newLineIsSeparator || cleanContents[p2] != '\n') && (!semiColonIsSeparator || cleanContents[p2] != ';')) {
						p2++;
					}

					if (p2 <= cleanContents.length) {
						if(firstLine && haveHeader) {
							firstLine = false;
						}
						else {
							noofRows++;
							var row = cleanContents.substr(p1, p2 - p1);

							if(onlyOneColumn) {
								var items = [row];
							}
							else {
								var items = row.split(separator);

								if (items.length != data.fieldNames.length) {
									dataIsCorrupt = true;
									$log.log(preDebugMsg + "Rows have different number of columns.");
									break;
								}
							}

							for (i = 0; i < items.length; i++) {
								var ftype = data.fieldTypes[i];
								var value = items[i];

								if (ftype == "integer") {
									try {
										if (value === "") {
											data.columns[i].push(null);
										}
										else {
											data.columns[i].push(parseInt(value));
										}
									} catch (Exception) {
										dataIsCorrupt = true;
										break;
									}
								}
								else if (ftype == "num" || ftype == "number" || ftype == "numeral" || ftype == "float" || ftype == "double" || ftype == "latitude" || ftype == "longitude") {
									try {
										if (value === "") {
											data.columns[i].push(null);
										}
										else {
											data.columns[i].push(Number(value));
										}
									} catch (Exception) {
										dataIsCorrupt = true;
										break;
									}
								}
								else if (ftype == "time" || ftype == "date" || ftype == "datetime") {
									try {
										if (value === "") {
											data.columns[i].push(null);
										}
										else {
											var dateTemp = Date.parse(value);

											if(isNaN(dateTemp)) {
												var numVal = parseFloat(value);
												if(!isNaN(numVal) && isFinite(value)) {
													dateTemp = numVal;
												}
												else {
													try {
														if(value.length == 8) {
															var today = new Date();
															dateTemp = (new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(value.substr(0,2)), parseInt(value.substr(3,2)), parseInt(value.substr(6,2)))).getTime();
														}
														else {
															dateTemp = null;
														}
													} catch(e) {
														dateTemp = null;
													}
												}
											}
											data.columns[i].push(dateTemp);
										}
									} catch (Exception) {
										dataIsCorrupt = true;
										break;
									}
								}
								else if (ftype == "vector") {
									if (value === "") {
										data.columns[i].push(null);
									}
									else {
										var vec = [];
										var metadata = [];
										var temp = value.split(':');

										for (sIdx = 0; sIdx < temp.length; sIdx++) {
											var s = temp[sIdx];
											var d = 0;

											if(s.indexOf('@') < 0) {
												try {
													var ss = s;
													if (s.length > 0 && s[s.length - 1] == ';') {
														ss = s.substr(0, s.length - 1);
													}
													d = Number(ss);
													vec.push(d);
												} catch (Exception) {
													dataIsCorrupt = true;
												}
											}
											else {
												try {
													var ss = s;
													if (s.length > 0 && s[s.length - 1] == ';') {
														ss = s.substr(0, s.length - 1);
													}
													var pairTemp = ss.split('@');
													var tag = pairTemp[0];
													var val = Number(pairTemp[1]);
													// metadata.push(tag + ",");
													metadata.push(tag);
													vec.push(val);
												} catch (Exception) {
													dataIsCorrupt = true;
													break;
												}
											}
										}

										if (metadata.length == 0) {
											data.columns[i].push(vec);
										}
										else {
											if (metadata.length != vec.length) {
												dataIsCorrupt = true;
												break;
											}
											else {
												if(!data.metaData.hasOwnProperty(i)) {
													var metaDataString = metadata.join(",");
													data.metaData[i] = metaDataString;
												}
												data.columns[i].push(vec);
											}
										}
									}
								}
								else if (ftype == "string" || ftype == "text") {
									try {
										data.columns[i].push(value);
									} catch (Exception) {
										dataIsCorrupt = true;
										break;
									}
								}
								else {
									try {
										data.columns[i].push(value);
									} catch (Exception) {
										dataIsCorrupt = true;
										break;
									}
								}
							}

							if (dataIsCorrupt) {
								break;
							}
						}

						p1 = p2;
						while (p1 < cleanContents.length && ((newLineIsSeparator && cleanContents[p1] == '\n') || (semiColonIsSeparator && cleanContents[p1] == ';'))) {
							p1++;
						}

						if (p1 >= cleanContents.length) {
							moreLines = false;
						}
					}
					else {
						moreLines = false;
					}
				} // while more lines
			}
		} // end of "not JSON"

		for(var f = 0; f < data.fieldNames.length; f++) {
			var fieldInf = {};
			fieldInf.name = data.fieldNames[f];
			fieldInf.type = [data.fieldTypes[f]];
			if(fieldInf.type[0] == "latitude" || fieldInf.type[0] == "longitude") {
				fieldInf.type.push("number");
			}
			fieldInf.size = data.columns[f].length;
			fieldInf.idx = f;
			fieldInf.listen = addListeningViz;

			// fields that need updating when this field changes
			fieldInf.slaves = [f];
			// fields that when change also affects this field, and a function to transform the index to the appropriate value
			fieldInf.masters = [[f, null]];

			fieldInf.val = valHelper(f);
			fieldInf.newSel = addSelHelper(f);
			fieldInf.sel = selHelper(f);

			dataFields.push(fieldInf);
		}

		var noofFields = dataFields.length;
		for(var f = 0; f < noofFields; f++) {
			dataFields[f].slaves = [];
			dataFields[f].masters = [];

			for(var ff = 0; ff < noofFields; ff++) {
				dataFields[f].slaves.push(ff);
				dataFields[f].masters.push([ff, null]);
			}
		}

		parsingFinished();
	}
	//===================================================================================


	//===================================================================================
	// Is ASCII?
	// Method that returns if a string (character) is ascii or not.
	// ===================================================================================
	function isASCII(str) {
		return /^[\x00-\x7F]*$/.test(str);
	}
	// ===================================================================================


	//===================================================================================
	// Check For Various Types of Comments
	// Method that checks if the file content contains comments
	// ===================================================================================
	function checkForVariousTypesOfComments(fileContents, semiColonIsSeparator, newLineIsSeparator) {
		var p0 = 0;
		var p1 = 0;
		var p2 = p1;
		var firstRow = "";
		var secondRow = "";
		var newFileContents = fileContents;

		while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
			p2++;
		}

		firstRow = fileContents.slice(0, p2);

		while (p2 < fileContents.length && ((newLineIsSeparator && fileContents[p2] == '\n') || (semiColonIsSeparator && fileContents[p2] == ';'))) {
			p2++;
		}

		p1 = p2;

		while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
			p2++;
		}

		secondRow = fileContents.slice(p1, p2);

		while(firstRow[0] == "#" && secondRow[0] == "#") {
			while (p2 < fileContents.length && ((newLineIsSeparator && fileContents[p2] == '\n') || (semiColonIsSeparator && fileContents[p2] == ';'))) {
				p2++;
			}

			firstRow = secondRow;
			p0 = p1;
			newFileContents = fileContents.slice(p0, fileContents.length);
			p1 = p2;

			while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
				p2++;
			}

			secondRow = fileContents.slice(p1, p2);
		}

		// var spaces1 = charCount(" ", firstRow);
		var tabs1 = charCount("\t", firstRow);
		var colons1 = charCount(":", firstRow);
		var semiColons1 = charCount(";", firstRow);
		var commas1 = charCount(",", firstRow);
		var ws1 = firstRow.match(/\s+/g);
		if(ws1) {
			ws1 = ws1.length;
		}
		else {
			ws1 = 0;
		}

		// var spaces2 = charCount(" ", secondRow);
		var tabs2 = charCount("\t", secondRow);
		var colons2 = charCount(":", secondRow);
		var semiColons2 = charCount(";", secondRow);
		var commas2 = charCount(",", secondRow);
		var ws2 = secondRow.match(/\s+/g);
		if(ws2) {
			ws2 = ws2.length;
		}
		else {
			ws2 = 0;
		}

		if(commas2 == commas1 && commas2 > 0) {
			return {"fileContents":newFileContents, "sep":","};
		}
		if(semiColons2 == semiColons1 && semiColons2 > 0) {
			return {"fileContents":newFileContents, "sep":";"};
		}
		if(colons2 == colons1 && colons2 > 0) {
			return {"fileContents":newFileContents, "sep":":"};
		}
		if(tabs2 == tabs1 && tabs2 > 0) {
			return {"fileContents":newFileContents, "sep":"\t"};
		}
		// if(spaces2 == spaces1 && spaces2 > 0) {
		//     newFileContents = newFileContents.replace(/[ ]+/g, " ")
		//     return {"fileContents":newFileContents, "sep":" "};
		// }
		if(ws2 == ws1 && ws2 > 0) {
			newFileContents = newFileContents.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n");
			return {"fileContents":newFileContents, "sep":" "};
		}

		var lineSep = "\n";
		if(newLineIsSeparator && semiColonIsSeparator) {
			lineSep = ";\n";
		} else if(semiColonIsSeparator) {
			lineSep = ";";
		}

		// nothing matched
		if(firstRow[0] == "#") {
			firstRow2 = firstRow.replace(/^#+[ \t]+/, "");

			// spaces1 = charCount(" ", firstRow2);
			tabs1 = charCount("\t", firstRow2);
			colons1 = charCount(":", firstRow2);
			semiColons1 = charCount(";", firstRow2);
			commas1 = charCount(",", firstRow2);
			ws1 = firstRow2.match(/\s+/g);
			if(ws1) {
				ws1 = ws1.length;
			}
			else {
				ws1 = 0;
			}

			if(commas2 == commas1 && commas2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":","};
			}
			if(semiColons2 == semiColons1 && semiColons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":";"};
			}
			if(colons2 == colons1 && colons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":":"};
			}
			if(tabs2 == tabs1 && tabs2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":"\t"};
			}
			// if(spaces2 == spaces1 && spaces2 > 0) {
			// 	newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
			// 	newFileContents = newFileContents.replace(/[ ]+/g, " ")
			// 	return {"fileContents":newFileContents, "sep":" "};
			// }
			if(ws2 == ws1 && ws2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				newFileContents = newFileContents.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n");
				return {"fileContents":newFileContents, "sep":" "};
			}
		}

		if(firstRow.indexOf("//") > 0) {
			firstRow2 = firstRow.replace(/\s*\/\/.*/, "");

			// spaces1 = charCount(" ", firstRow2);
			tabs1 = charCount("\t", firstRow2);
			colons1 = charCount(":", firstRow2);
			semiColons1 = charCount(";", firstRow2);
			commas1 = charCount(",", firstRow2);
			ws1 = firstRow2.match(/\s+/g);
			if(ws1) {
				ws1 = ws1.length;
			}
			else {
				ws1 = 0;
			}

			if(commas2 == commas1 && commas2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":","};
			}
			if(semiColons2 == semiColons1 && semiColons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":";"};
			}
			if(colons2 == colons1 && colons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":":"};
			}
			if(tabs2 == tabs1 && tabs2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":"\t"};
			}
			// if(spaces2 == spaces1 && spaces2 > 0) {
			// 	newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
			// 	newFileContents = newFileContents.replace(/[ ]+/g, " ")
			// 	return {"fileContents":newFileContents, "sep":" "};
			// }
			if(ws2 == ws1 && ws2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				newFileContents = newFileContents.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n");
				return {"fileContents":newFileContents, "sep":" "};
			}
		}

		if(firstRow.indexOf("//") > 0 && firstRow[0] == "#") {
			firstRow2 = firstRow.replace(/\s*\/\/.*/, "");
			firstRow2 = firstRow2.replace(/^#+[ \t]+/, "");

			// spaces1 = charCount(" ", firstRow2);
			tabs1 = charCount("\t", firstRow2);
			colons1 = charCount(":", firstRow2);
			semiColons1 = charCount(";", firstRow2);
			commas1 = charCount(",", firstRow2);
			ws1 = firstRow2.match(/\s+/g);
			if(ws1) {
				ws1 = ws1.length;
			}
			else {
				ws1 = 0;
			}

			if(commas2 == commas1 && commas2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":","};
			}
			if(semiColons2 == semiColons1 && semiColons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":";"};
			}
			if(colons2 == colons1 && colons2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":":"};
			}
			if(tabs2 == tabs1 && tabs2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				return {"fileContents":newFileContents, "sep":"\t"};
			}
			// if(spaces2 == spaces1 && spaces2 > 0) {
			// 	newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
			// 	newFileContents = newFileContents.replace(/[ ]+/g, " ")
			// 	return {"fileContents":newFileContents, "sep":" "};
			// }
			if(ws2 == ws1 && ws2 > 0) {
				newFileContents = firstRow2 + lineSep + fileContents.slice(p1, fileContents.length);
				newFileContents = newFileContents.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n");
				return {"fileContents":newFileContents, "sep":" "};
			}

			if(ws1 > 0 && ws2 > ws1) {
				var items1 = firstRow2.split(" ");

				if(items1.length > 0) {
					var exp = /\[([0-9]+)\]/;
					var match = exp.exec(items1[items1.length - 1]);

					if(match) {
						var arrayLength = parseInt(match[1]);

						if(ws2 == ws1 + arrayLength) {
							var firstRow3 = "";
							for(var i = 0; i < items1.length - 1; i++) {
								if(i > 0) {
									firstRow3 += " " + items1[i];
								}
								else {
									firstRow3 += items1[i];
								}
							}
							for(var i = 0; i < arrayLength; i++) {
								firstRow3 += " data[" + i + "]";
							}

							newFileContents = firstRow3 + lineSep + fileContents.slice(p1, fileContents.length);
							newFileContents = newFileContents.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n");
							return {"fileContents":newFileContents, "sep":" "};

						}
					}
				}
			}
		}

		return {"fileContents":fileContents, "sep":""}; // fail
	}
	//===================================================================================


	//===================================================================================
	//======================== Parsing various binary formats ===========================
	//===================================================================================

	//===================================================================================
	// File Reader on Load Callback Binary
	// Method that reads the binary data result after load callback.
	// ===================================================================================
	function fileReaderOnLoadCallbackBinary(e, reader) {
		fileReaderOnLoadCallbackBinaryHelper(e.target.result, reader);
	}
	//===================================================================================


	//===================================================================================
	// File Reader on Load Callback Binary Helper
	// Method that reads the binary data content after load callback.
	// ===================================================================================
	function fileReaderOnLoadCallbackBinaryHelper(contents, reader) {
		if(checkIfRockstar(contents)) {
			// $log.log(preDebugMsg + "Found Rockstar type file.");

			var rockstarContents = parseRockstarFormat(contents);
			seenRockstars.push(rockstarContents);
			if(reader.lastFile) {
				convertRockstars();
			}
		}
		else if(reader.fileName == "damagebld.dat") {
			// Guess this is flooding data from the Tohoku University group. (should be 330400 bytes, 350x236 32bit floats)
			// $log.log(preDebugMsg + "This looks like tsunami damage data");
			parseTohokuBuildingDamageData(contents, reader.lastFile);
		}
		else if(reader.fileName.indexOf("inund") == 0) {
			// Guess this is flooding data from the Tohoku University group (should be 33133824 bytes, 3504x2364 32bit floats)
			// $log.log(preDebugMsg + "This looks like tsunami flooding data");
			parseTohokuFloodingData(contents, reader.fileName, reader.lastFile);
		}
		else if(checkIfDensity(contents)) {
			// $log.log(preDebugMsg + "Found file that looks like density data file.");
			var densityContents = parseDensityFormat(contents);
			seenDensities.push(densityContents);

			if(reader.lastFile) {
				convertDensities();
			}
		}
		else {
			// .dat can also be text files, retry as text
			$log.log(preDebugMsg + "This is either an unknown binary format or text data. Retrying as text data.");
			var newReader = new FileReader();
			newReader.onload = function(e) { fileReaderOnLoadCallbackText(e, reader);};
			newReader.readAsText(reader.theFileWhenRetrying);
		}
	}
	// ===================================================================================


	//===================================================================================
	//======================== Parsing tsunami data =====================================
	//===================================================================================

	// ===================================================================================
	// Tohoku X to Longitude
	// Method that converts Tohoku tsunami X data to longitude value.
	// ===================================================================================
	function tohokuXtoLongitude(idx, len) {
		// lower left corner is roughly 33.3864755,133.3269583
		// upper right corner is roughly 33.6015194,133.6901483 ?
		return tohokuMinLon + tohokuDx * idx / len;
	}
	// ===================================================================================


	// ===================================================================================
	// Tohoku Y to Latitude
	// Method that converts Tohoku tsunami Y data to latitude value.
	// ===================================================================================
	function tohokuYtoLatitude(idx, len) {
		// lower left corner is roughly 33.3864755,133.3269583
		// upper right corner is roughly 33.6015194,133.6901483 ?
		return tohokuMinLat + tohokuDy * idx / len;
	}
	// ===================================================================================


	// ===================================================================================
	// Parse Tohoku Building Damage Data
	// Method that parses Building Damage data.
	// ===================================================================================
	function parseTohokuBuildingDamageData(contents, lastFile) {
		// should be 330400 bytes, 350x236 32bit floats
		var littleEndian = true;
		var tmpFloat = new Float32Array(contents);

		if(tmpFloat.length != 82600) {
			$log.log(preDebugMsg + "Error: Unexpected file size of tsunami damage data.");
			return;
		}

		tmpFloat = null;
		var dv = new DataView(contents);
		var data = [];
		var yDim = 236;
		var xDim = 350;

		for(var j = 0; j < yDim; j++) {
			data.push([]);
			for(var i = 0; i < xDim; i++) {
				data[j].push(0);
			}
		}

		var offset = 0;
		for(var j = 0; j < yDim; j++) {
			for(var i = 0; i < xDim; i++) {
				data[yDim - 1 - j][i] = dv.getFloat32(offset, littleEndian);

				if(data[yDim - 1 - j][i] == tohokuBldNull) {
					data[yDim - 1 - j][i] = null;
				}
				offset += 4;
			}
		}

		tohokuTimes.push(null);
		tohoku2Ds.push(data);

		if(lastFile) {
			convertTohokuData();
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Parse Tohoku Flooding Data
	// Method that parses flooding data.
	// ===================================================================================
	function parseTohokuFloodingData(contents, fileName, lastFile) {
		// filenames can be "inund[0-9]+.dat" for max inundation or "inund5000xxx.dat", where xxx goes from 000 to 360 and is the 30-second interval after the earthquake (total 3hrs)
		var littleEndian = true;
		var tmpFloat = new Float32Array(contents);

		if(tmpFloat.length != 8283456) {
			$log.log(preDebugMsg + "Error: Unexpected file size of flooding data.");
			return;
		}

		var timeSlice = get30secondIntervalFromFileName(fileName);
		tmpFloat = null;
		var dv = new DataView(contents);
		var data = [];
		var yDim = 2364;
		var xDim = 3504;

		for(var j = 0; j < yDim; j++) {
			data.push([]);
			for(var i = 0; i < xDim; i++) {
				data[j].push(0);
			}
		}

		var offset = 0;
		for(var j = 0; j < yDim; j++) {
			for(var i = 0; i < xDim; i++) {
				data[yDim - 1 - j][i] = dv.getFloat32(offset, littleEndian);

				if(data[yDim - 1 - j][i] == tohokuFloodingNull) {
					data[yDim - 1 - j][i] = null;
				}

				offset += 4;
			}
		}

		tohokuTimes.push(timeSlice);
		tohoku2Ds.push(data);

		if(lastFile) {
			convertTohokuData();
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Get 30 Second Interval From File Name
	// Method that gets the 30 second interval from the file name.
	// ===================================================================================
	function get30secondIntervalFromFileName(fileName) {
		var p = fileName.indexOf(".dat");
		if(p > 3) {
			var s = fileName.substr(p - 3, 3);
			var res = parseInt(s);
			// $log.log(preDebugMsg + "get30secondIntervalFromFileName(" + fileName + ") -> " + p + " " + s + " -> " + res);

			if(!isNaN(res)) {
				return res;
			}
		}
		return -1;
	}
	// ===================================================================================


	// ===================================================================================
	// Convert Tohoku Data
	// Method that converts the Tohoku data.
	// ===================================================================================
	function convertTohokuData() {
		var haveFlooding = false;
		var haveBld = false;
		for(var i = 0; i < tohokuTimes.length; i++) {
			if(tohokuTimes[i] === null) {
				haveBld = true;
			} else {
				haveFlooding = true;
			}
		}

		// first add all flooding data, then add all non-flooding data
		for(var pass = 0; pass < 2; pass++) {
			var ourStartIdx = data.fieldNames.length;
			var flooding = false;

			if(haveFlooding && pass == 1) {
				flooding = true;
				data.fieldNames.push("Tsunami Flooding");
				data.fieldNames.push("Time Slice");
				data.fieldTypes.push(["3Darray"]);
				data.fieldTypes.push(["number"]);
				data.columns.push([]);
				data.columns.push([]);

				for(var i = 0; i < tohokuTimes.length; i++) {
					if(tohokuTimes[i] !== null) {
						data.columns[ourStartIdx].push([tohoku2Ds[i]]); // convert to 3D with one level for now, TODO: do this better later
						data.columns[ourStartIdx + 1].push(tohokuTimes[i]);
					}
				}
			}
			else if(haveBld && pass == 0) {
				data.fieldNames.push("Tsunami damage");
				data.fieldTypes.push(["3Darray"]);
				data.columns.push([]);

				for(var i = 0; i < tohokuTimes.length; i++) {
					if(tohokuTimes[i] === null) {
						data.columns[ourStartIdx].push([tohoku2Ds[i]]); // convert to 3D with one level for now, TODO: do this better later
					}
				}
			}
			else {
				continue;
			}


			var fieldInf = {};
			var f = ourStartIdx;
			fieldInf.name = data.fieldNames[ourStartIdx];
			fieldInf.type = data.fieldTypes[ourStartIdx];
			fieldInf.size = data.columns[ourStartIdx].length;
			fieldInf.idx = ourStartIdx;

			fieldInf.listen = addListeningViz;

			fieldInf.slaves = [ourStartIdx, ourStartIdx + 1]; // fields that need updating when this field changes
			if(flooding) {
				fieldInf.masters = [[ourStartIdx, null], [ourStartIdx + 1, null]]; // fields that when change
			}
			else {
				fieldInf.masters = [[ourStartIdx, null]]; // fields that when chang
			}
			// also affects this field, and a function to transform the index to the appropriate value

			fieldInf.val = get3DdataAs3DHelper(ourStartIdx);
			fieldInf.newSel = addSelHelper(ourStartIdx);
			fieldInf.sel = selHelper(ourStartIdx);

			dataFields.push(fieldInf);

			if(flooding) {
				var fieldInf = {};
				fieldInf.name = data.fieldNames[ourStartIdx + 1];
				fieldInf.type = data.fieldTypes[ourStartIdx + 1];
				fieldInf.size = data.columns[ourStartIdx + 1].length;
				fieldInf.idx = ourStartIdx + 1;
				fieldInf.listen = addListeningViz;

				// fields that need updating when this field changes
				fieldInf.slaves = [ourStartIdx, ourStartIdx + 1];
				// fields that when change also affects this field, and a function to transform the index to the appropriate value
				fieldInf.masters = [[ourStartIdx, null], [ourStartIdx + 1, null]];

				fieldInf.val = valHelper(ourStartIdx + 1);
				fieldInf.newSel = addSelHelper(ourStartIdx + 1);
				fieldInf.sel = selHelper(ourStartIdx + 1);
				dataFields.push(fieldInf);
			}

			var noofFields = dataFields.length;
			var masters = [];

			// add the x-labels (the x coordinates)
			var fieldInf = {};
			fieldInf.name = "Longitude";
			fieldInf.type = ["number", "longitude"];
			fieldInf.size = data.columns[ourStartIdx][0][0][0].length;
			fieldInf.listen = addListeningViz;

			// fieldInf.val = function(idx) { return idx; };
			if(flooding) {
				fieldInf.val = function(idx) { return tohokuXtoLongitude(idx, 3504); };
			}
			else {
				fieldInf.val = function(idx) { return tohokuXtoLongitude(idx, 350); };
			}

			xVecIdx = dataFields.length;
			masters.push([xVecIdx, transformCellIdxToXidxHelper]); // TODO, this can be made fast, since the size is fixed
			fieldInf.slaves = [xVecIdx];
			fieldInf.masters = [[xVecIdx, null]];
			fieldInf.newSel = addSelHelper(xVecIdx);
			fieldInf.sel = selHelper(xVecIdx);
			dataFields.push(fieldInf);

			// add the y-labels (the y coordinates)
			var fieldInf = {};
			fieldInf.name = "Latitude";
			fieldInf.type = ["number", "latitude"]; // lat? lon?
			fieldInf.size = data.columns[ourStartIdx][0][0].length;
			fieldInf.listen = addListeningViz;

			// fieldInf.val = function(idx) { return idx; };
			if(flooding) {
				fieldInf.val = function(idx) { return tohokuYtoLatitude(idx, 2364); };
			}
			else {
				fieldInf.val = function(idx) { return tohokuYtoLatitude(idx, 236); };
			}

			yVecIdx = dataFields.length;
			masters.push([yVecIdx, transformCellIdxToYidxHelper]); // TODO, this can be made fast, since the size is fixed
			fieldInf.slaves = [yVecIdx];
			fieldInf.masters = [[yVecIdx, null]];
			fieldInf.newSel = addSelHelper(yVecIdx);
			fieldInf.sel = selHelper(yVecIdx);
			dataFields.push(fieldInf);

			// add the z-labels (the z coordinates)
			var fieldInf = {};
			fieldInf.name = "Z coordinates";
			fieldInf.type = ["number"];
			fieldInf.size = data.columns[ourStartIdx][0].length;
			fieldInf.listen = addListeningViz;
			fieldInf.val = function(idx) { return idx; };
			zVecIdx = dataFields.length;
			masters.push([zVecIdx, transformCellIdxToZidxHelper]); // TODO, this can be made fast, since the size is fixed
			fieldInf.slaves = [zVecIdx];
			fieldInf.masters = [[zVecIdx, null]];
			fieldInf.newSel = addSelHelper(zVecIdx);
			fieldInf.sel = selHelper(zVecIdx);

			dataFields.push(fieldInf);

			// provide data as idx -> x, y, z, val1, val2, etc.
			for(var f = 0; f < 1; f++) {
				if(data.fieldTypes[f][0] == "3Darray") {
					var cubeValuesSize = data.columns[f].length * data.columns[f][0].length * data.columns[f][0][0].length * data.columns[f][0][0][0].length;
					var ff = f;

					var fieldInf = {};
					fieldInf.name = "idx -> Longitude";
					fieldInf.type = ["number", "longitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					if(flooding) {
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
							return tohokuXtoLongitude(coords[3], 3504);
						};
					}
					else {
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
							return tohokuXtoLongitude(coords[3], 350);
						};
					}

					var ffx = f;
					var listenerFeatureIdxX = dataFields.length;
					fieldInf.sel = selHelper(listenerFeatureIdxX);
					fieldInf.newSel = addSelHelper(listenerFeatureIdxX);

					fieldInf.slaves = [listenerFeatureIdxX];
					fieldInf.masters = [[listenerFeatureIdxX, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxX);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxX);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Latitude";
					fieldInf.type = ["number", "latitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					if(flooding) {
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
							return tohokuYtoLatitude(coords[2], 2364);
						};
					}
					else {
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
							return tohokuYtoLatitude(coords[2], 236);
						};
					}

					var ffy = f;
					var listenerFeatureIdxY = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxY);
					fieldInf.sel = selHelper(listenerFeatureIdxY);
					fieldInf.slaves = [listenerFeatureIdxY];
					fieldInf.masters = [[listenerFeatureIdxY, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxY);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxY);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Z";
					fieldInf.type = ["number"];
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
						return coords[1];
					};

					var ffz = f;
					var listenerFeatureIdxZ = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxZ);
					fieldInf.sel = selHelper(listenerFeatureIdxZ);

					fieldInf.slaves = [listenerFeatureIdxZ];
					fieldInf.masters = [[listenerFeatureIdxZ, null]];
					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(listenerFeatureIdxZ);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxZ);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};

					if(flooding) {
						fieldInf.name = "idx -> Flooding level";
					}
					else {
						fieldInf.name = "idx -> Damage";
					}
					fieldInf.type = ["number"];
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;

					var fieldIdx = dataFields.length;
					var originalFieldIdx = f;

					fieldInf.val = valHelper1D(originalFieldIdx); // TODO, this can be made fast, since the size is fixed
					fieldInf.newSel = addSelHelper(fieldIdx);
					fieldInf.sel = selHelper(fieldIdx);

					fieldInf.slaves = [fieldIdx];
					fieldInf.masters = [[fieldIdx, null]];

					for(var fff = ourStartIdx; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
						dataFields[fff].slaves.push(fieldIdx);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(fieldIdx);
					}

					dataFields.push(fieldInf);
				}
			}

			// all cube cells depend on all other cube cells, for now
			for(var f1 = noofFields + masters.length; f1 < dataFields.length; f1++) {
				for(var f2 = f1 + 1; f2 < dataFields.length; f2++) {
					dataFields[f1].slaves.push(f2);
					dataFields[f1].masters.push([f2, null]);
					dataFields[f2].slaves.push(f1);
					dataFields[f2].masters.push([f1, null]);
				}
			}
		}

		tohokuTimes = [];
		tohoku2Ds = [];
		parsingFinished();
	}
	// ===================================================================================


	// ===================================================================================
	// Parse Rockstar Format
	// Method that Parses the Rockstar file format
	// ===================================================================================
	function parseRockstarFormat(binaryArray) {
		// Components.utils.import("resource://gre/modules/ctypes.jsm");

		// first, read the header.
		var ROCKSTAR_MAGIC = 0xfadedacec0c0d0d0;
		var ROCKSTAR_MAGICstr = "fadedacec0c0d0d0";
		var BINARY_HEADER_SIZE = 256;
		var VERSION_MAX_SIZE = 12;
		header = {};
		var hArray = binaryArray.slice(0, BINARY_HEADER_SIZE);
		var tmpFloat = new Float32Array(hArray);
		var tmpInt = new Int32Array(hArray);
		var tmpUInt = new Uint32Array(hArray);
		header.magic = {"lo":tmpUInt[0], "hi":tmpUInt[1]};
		var concat_magic = header.magic.hi.toString(16) + header.magic.lo.toString(16);
		header.snap = {"lo":tmpUInt[2], "hi":tmpInt[3]};
		header.chunk = {"lo":tmpUInt[4], "hi":tmpInt[5]};
		header.scale = tmpFloat[6];
		header.Om = tmpFloat[7];
		header.Ol = tmpFloat[8];
		header.h0 = tmpFloat[9];
		header.bounds = [];
		for(var i = 0; i < 6; i++) {
			header.bounds.push(tmpFloat[10 + i]);
		}

		header.num_halos = {"lo":tmpUInt[16], "hi":tmpInt[17]};
		if(header.num_halos.hi > 0) {
			$log.log(preDebugMsg + "WARNING: Too many halos, will only read the first " + header.nu_halos.lo + " halos.");
			$log.log(preDebugMsg + "num_halos: " + header.num_halos.hi.toString(16) + " " + header.num_halos.lo.toString(16));
		}
		header.num_particles = {"lo":tmpUInt[18], "hi":tmpInt[19]};

		header.box_size = tmpFloat[20];
		header.particle_mass = tmpFloat[21];

		header.particle_type = {"lo":tmpUInt[22], "hi":tmpInt[23]};

		header.format_revision = tmpInt[24];

		header.rockstar_version = [];
		for(var i = 0; i < VERSION_MAX_SIZE; i++) {
			header.rockstar_version.push(hArray[200 + i]);
		}

		// ignore the unused part
		// now read all halos in this file as specified in the header
		var halos = [];
		var dArray = binaryArray.slice(BINARY_HEADER_SIZE, binaryArray.length);
		var cur32idx = 0;
		var tmpInt = new Int32Array(dArray);
		var tmpUInt = new Uint32Array(dArray);
		var tmpFloat = new Float32Array(dArray);

		for(var halo = 0; halo < header.num_halos.lo; halo++) {
			var h = {};
			h.id = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;
			h.pos = [];
			for(var i = 0; i < 6; i++) {
				h.pos.push(tmpFloat[cur32idx + i]);
			}
			cur32idx += 6;

			h.corevel = [];
			for(var i = 0; i < 3; i++) {
				h.corevel.push(tmpFloat[cur32idx + i]);
			}
			cur32idx += 3;
			h.bulkvel = [];
			for(var i = 0; i < 3; i++) {
				h.bulkvel.push(tmpFloat[cur32idx + i]);
			}
			cur32idx += 3;

			h.m = tmpFloat[cur32idx++];
			h.r = tmpFloat[cur32idx++];
			h.child_r = tmpFloat[cur32idx++];
			h.vmax_r = tmpFloat[cur32idx++];
			h.mgrav = tmpFloat[cur32idx++];
			h.vmax = tmpFloat[cur32idx++];
			h.rvmax = tmpFloat[cur32idx++];
			h.rs = tmpFloat[cur32idx++];
			h.klypin_rs = tmpFloat[cur32idx++];
			h.vrms = tmpFloat[cur32idx++];

			h.J = [];
			h.J.push(tmpFloat[cur32idx++]);
			h.J.push(tmpFloat[cur32idx++]);
			h.J.push(tmpFloat[cur32idx++]);

			h.energy = tmpFloat[cur32idx++];
			h.spin = tmpFloat[cur32idx++];

			h.alt_m = [];
			h.alt_m.push(tmpFloat[cur32idx++]);
			h.alt_m.push(tmpFloat[cur32idx++]);
			h.alt_m.push(tmpFloat[cur32idx++]);
			h.alt_m.push(tmpFloat[cur32idx++]);

			h.Xoff = tmpFloat[cur32idx++];
			h.Voff = tmpFloat[cur32idx++];
			h.b_to_a = tmpFloat[cur32idx++];
			h.c_to_a = tmpFloat[cur32idx++];

			h.A = [];
			h.A.push(tmpFloat[cur32idx++]);
			h.A.push(tmpFloat[cur32idx++]);
			h.A.push(tmpFloat[cur32idx++]);

			h.b_to_a2 = tmpFloat[cur32idx++];
			h.c_to_a2 = tmpFloat[cur32idx++];

			h.A2 = [];
			h.A2.push(tmpFloat[cur32idx++]);
			h.A2.push(tmpFloat[cur32idx++]);
			h.A2.push(tmpFloat[cur32idx++]);

			h.bullock_spin = tmpFloat[cur32idx++];
			h.kin_to_pot = tmpFloat[cur32idx++];
			h.m_pe_b = tmpFloat[cur32idx++];
			h.m_pe_d = tmpFloat[cur32idx++];

			// +35 32bits, long longs not aligned?
			cur32idx += 1; // for alignment ??

			h.num_p = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;

			h.num_child_particles = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;
			h.p_start = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;
			h.desc = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;
			h.flags = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;
			h.n_core = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
			cur32idx += 2;

			h.min_pos_err = tmpFloat[cur32idx++];
			h.min_vel_err = tmpFloat[cur32idx++];
			h.min_bulkvel_err = tmpFloat[cur32idx++];

			halos.push(h);

			cur32idx += 1; // for alignment ??
		}
		return {"halos":halos, "header":header};
	}
	// ===================================================================================

	// ===================================================================================
	// Convert Rockstar
	// This method converts the rockstar data to Dashboard useful things
	// ===================================================================================
	function convertRockstars() {
		var fieldNames = ["id", "pos 0", "pos 1", "pos 2", "pos 3", "pos 4", "pos 5", "corevel 0", "corevel 1", "corevel 2", "bulkvel 0", "bulkvel 1", "bulkvel 2",  "m", "r", "child_r", "vmax_r", "mgrav", "vmax", "rvmax", "rs", "klypin_rs", "vrms", "J 0", "J 1", "J 2", "energy", "spin", "alt_m 0", "alt_m 1", "alt_m 2", "alt_m 3", "Xoff", "Voff", "b_to_a", "c_to_a", "A 0", "A 1", "A 2", "bullock_spin", "kin_to_pot", "m_pe_b", "m_pe_d", "num_p", "num_child_particles", "p_start", "desc", "flags", "n_core", "min_pos_err", "min_vel_err", "min_bulkvel_err"];
		var fieldTypes = [];
		var ourStartIdx = data.fieldNames.length;

		for(var i = 0; i < fieldNames.length; i++) {
			if(["id", "p_start", "desc", "flags"].indexOf(fieldNames[i]) >= 0) {
				fieldTypes.push(["string"]); // use strings for the 64 bit integers for now, javascript cannot handle them well
			}
			else if(["num_p", "num_child_particles", "n_core"].indexOf(fieldNames[i]) >= 0) {
				fieldTypes.push(["number"]); // assume these 64 bit integers can be rounded to javascript numbers and the loss of precision is acceptable
			}
			else {
				fieldTypes.push(["number"]);
			}
			data.columns.push([]);
		}

		for(var file = 0; file < seenRockstars.length; file++) {
			for(var halo = 0; halo < seenRockstars[file].halos.length; halo++) {
				for(var i = 0; i < fieldNames.length; i++) {
					if(["num_p", "num_child_particles", "n_core"].indexOf(fieldNames[i]) >= 0) {
						data.columns[i + ourStartIdx].push(parseInt(seenRockstars[file].halos[halo][fieldNames[i]].hi.toString(16) + seenRockstars[file].halos[halo][fieldNames[i]].lo.toString(16), 16)); // convert to javascript number, and hope that the precision loss is acceptable
					}
					else if(fieldTypes[i][0] == "number") {
						var idx = fieldNames[i].indexOf(" ");
						if(idx > 0) {
							var fn = fieldNames[i].substring(0, idx);
							var j = parseInt(fieldNames[i].substring(idx + 1));

							data.columns[i + ourStartIdx].push(seenRockstars[file].halos[halo][fn][j]);
						}
						else {
							data.columns[i + ourStartIdx].push(seenRockstars[file].halos[halo][fieldNames[i]]);
						}
					}
					else if(fieldNames[i] == "id") {
						data.columns[i + ourStartIdx].push( file.toString(16) + " " + seenRockstars[file].halos[halo][fieldNames[i]].hi.toString(16) + seenRockstars[file].halos[halo][fieldNames[i]].lo.toString(16) );
					}
					else {
						data.columns[i + ourStartIdx].push( seenRockstars[file].halos[halo][fieldNames[i]].hi.toString(16) + seenRockstars[file].halos[halo][fieldNames[i]].lo.toString(16) );
					}
				}
			}
		}

		seenRockstars = [];

		for(var f0 = 0; f0 < fieldNames.length; f0++) {
			data.fieldNames.push(fieldNames[f0]);
			data.fieldTypes.push(fieldTypes[f0]);
			var f = f0 + ourStartIdx;
			var fieldInf = {};
			fieldInf.name = data.fieldNames[f];
			fieldInf.type = data.fieldTypes[f];
			fieldInf.size = data.columns[f].length;
			fieldInf.idx = f;
			fieldInf.listen = addListeningViz;

			// fields that need updating when this field changes
			fieldInf.slaves = [f];
			// fields that when change also affects this field, and a function to transform the index to the appropriate value
			fieldInf.masters = [[f, null]];

			fieldInf.val = valHelper(f);
			fieldInf.newSel = addSelHelper(f);
			fieldInf.sel = selHelper(f);

			dataFields.push(fieldInf);
		}

		var noofFields = dataFields.length;
		for(var f = 0; f < noofFields; f++) {
			dataFields[f].slaves = [];
			dataFields[f].masters = [];

			for(var ff = 0; ff < noofFields; ff++) {
				dataFields[f].slaves.push(ff);
				dataFields[f].masters.push([ff, null]);
			}
		}

		parsingFinished();
	}
	// ===================================================================================


	// ===================================================================================
	// Parse Density Format
	// Method that parses the space density data.
	// This format comes from the Tokyo University astrophysics group.
	// A 256x256x256 binary grid of density data.
	// ===================================================================================
	function parseDensityFormat(binaryArray) {
		// read a 3D array of 256x256x256 floats
		var dim = 256;
		var cur32idx = 0;
		var tmpFloat = new Float32Array(binaryArray);
		var densities = [];

		for(var a = 0; a < dim; a++) {
			densities.push([]);
			for(var b = 0; b < dim; b++) {
				densities[a].push([]);
				for(var c = 0; c < dim; c++) {
					densities[a][b].push(tmpFloat[(a*dim + b) * (2 * (dim/2 + 1)) + c]);
				}
			}
		}
		return densities;
	}
	// ===================================================================================


	// ===================================================================================
	// Convert Densities
	// Method that converts the density values to Dashboard useful things.
	// ===================================================================================
	function convertDensities() {
		// TODO: (what if we have files of different types?)

		var ourStartIdx = data.fieldNames.length;
		data.fieldNames.push("Density 3D Array");
		data.fieldNames.push("File No.");
		data.fieldTypes.push(["3Darray"]);
		data.fieldTypes.push(["number"]);
		data.columns.push([]);
		data.columns.push([]);

		var dim = 256;

		for(var file = 0; file < seenDensities.length; file++) {
			data.columns[ourStartIdx].push(seenDensities[file]);
			data.columns[ourStartIdx + 1].push(file);
		}

		seenDensities = [];
		var fieldInf = {};
		var f = ourStartIdx;
		fieldInf.name = data.fieldNames[ourStartIdx];
		fieldInf.type = data.fieldTypes[ourStartIdx];
		fieldInf.size = data.columns[ourStartIdx].length;
		fieldInf.idx = ourStartIdx;
		fieldInf.listen = addListeningViz;

		// fields that need updating when this field changes
		fieldInf.slaves = [ourStartIdx, ourStartIdx + 1];
		// fields that when change also affects this field, and a function to transform the index to the appropriate value
		fieldInf.masters = [[ourStartIdx, null], [ourStartIdx + 1, null]];

		fieldInf.val = get3DdataAs3DHelper(ourStartIdx); // TODO, this can be made fast, since the size is fixed
		fieldInf.newSel = addSelHelper(ourStartIdx);
		fieldInf.sel = selHelper(ourStartIdx);

		dataFields.push(fieldInf);

		var fieldInf = {};
		fieldInf.name = data.fieldNames[ourStartIdx + 1];
		fieldInf.type = data.fieldTypes[ourStartIdx + 1];
		fieldInf.size = data.columns[ourStartIdx + 1].length;
		fieldInf.idx = ourStartIdx + 1;
		fieldInf.listen = addListeningViz;

		// fields that need updating when this field changes
		fieldInf.slaves = [ourStartIdx, ourStartIdx + 1];
		// fields that when change also affects this field, and a function to transform the index to the appropriate value
		fieldInf.masters = [[ourStartIdx, null], [ourStartIdx + 1, null]];

		fieldInf.val = valHelper(ourStartIdx + 1);
		fieldInf.newSel = addSelHelper(ourStartIdx + 1);
		fieldInf.sel = selHelper(ourStartIdx + 1);
		dataFields.push(fieldInf);
		var noofFields = dataFields.length;
		var masters = [];

		// add the x-labels (the x coordinates)
		var fieldInf = {};
		fieldInf.name = "X coordinates";
		fieldInf.type = ["number"]; // lat? lon?
		fieldInf.size = dim;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return idx; };
		xVecIdx = dataFields.length;
		masters.push([xVecIdx, transformCellIdxToXidxHelper]); // TODO, this can be made fast, since the size is fixed
		fieldInf.slaves = [xVecIdx];
		fieldInf.masters = [[xVecIdx, null]];
		fieldInf.newSel = addSelHelper(xVecIdx);
		fieldInf.sel = selHelper(xVecIdx);

		dataFields.push(fieldInf);

		// add the y-labels (the y coordinates)
		var fieldInf = {};
		fieldInf.name = "Y coordinates";
		fieldInf.type = ["number"]; // lat? lon?
		fieldInf.size = dim;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return idx; };
		yVecIdx = dataFields.length;
		masters.push([yVecIdx, transformCellIdxToYidxHelper]); // TODO, this can be made fast, since the size is fixed
		fieldInf.slaves = [yVecIdx];
		fieldInf.masters = [[yVecIdx, null]];
		fieldInf.newSel = addSelHelper(yVecIdx);
		fieldInf.sel = selHelper(yVecIdx);

		dataFields.push(fieldInf);

		// add the z-labels (the z coordinates)
		var fieldInf = {};
		fieldInf.name = "Z coordinates";
		fieldInf.type = ["number"];
		fieldInf.size = dim;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return idx; };
		zVecIdx = dataFields.length;
		masters.push([zVecIdx, transformCellIdxToZidxHelper]); // TODO, this can be made fast, since the size is fixed
		fieldInf.slaves = [zVecIdx];
		fieldInf.masters = [[zVecIdx, null]];
		fieldInf.newSel = addSelHelper(zVecIdx);
		fieldInf.sel = selHelper(zVecIdx);

		dataFields.push(fieldInf);

		// provide data as idx -> x, y, z, val1, val2, etc.
		// ----------------------------------------------------------------
		for(var f = 0; f < 1; f++) {
			if(data.fieldTypes[f][0] == "3Darray") {
				var cubeValuesSize = data.columns[f].length * data.columns[f][0].length * data.columns[f][0][0].length * data.columns[f][0][0][0].length;
				var ff = f;
				var fieldInf = {};
				fieldInf.name = "idx -> X";
				fieldInf.type = ["number"]; // lat? lon?
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				fieldInf.val = function(valueIdx) {
					var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
					return coords[3];
				};

				var ffx = f;
				var listenerFeatureIdxX = dataFields.length;
				fieldInf.sel = selHelper(listenerFeatureIdxX);
				fieldInf.newSel = addSelHelper(listenerFeatureIdxX);
				fieldInf.slaves = [listenerFeatureIdxX];
				fieldInf.masters = [[listenerFeatureIdxX, null]];
				for(var fff = ourStartIdx; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
					dataFields[fff].slaves.push(listenerFeatureIdxX);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxX);
				}

				dataFields.push(fieldInf);

				var fieldInf = {};
				fieldInf.name = "idx -> Y";
				fieldInf.type = ["number"]; // lat? lon?
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				fieldInf.val = function(valueIdx) {
					var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
					return coords[2];
				};

				var ffy = f;
				var listenerFeatureIdxY = dataFields.length;
				fieldInf.newSel = addSelHelper(listenerFeatureIdxY);
				fieldInf.sel = selHelper(listenerFeatureIdxY);
				fieldInf.slaves = [listenerFeatureIdxY];
				fieldInf.masters = [[listenerFeatureIdxY, null]];
				for(var fff = ourStartIdx; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
					dataFields[fff].slaves.push(listenerFeatureIdxY);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxY);
				}

				dataFields.push(fieldInf);

				var fieldInf = {};
				fieldInf.name = "idx -> Z";
				fieldInf.type = ["number"];
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				fieldInf.val = function(valueIdx) {
					var coords = getCidxXYZfromIdx(ff, valueIdx); // TODO, this can be made fast, since the size is fixed
					return coords[1];
				};

				var ffz = f;
				var listenerFeatureIdxZ = dataFields.length;
				fieldInf.newSel = addSelHelper(listenerFeatureIdxZ);
				fieldInf.sel = selHelper(listenerFeatureIdxZ);
				fieldInf.slaves = [listenerFeatureIdxZ];
				fieldInf.masters = [[listenerFeatureIdxZ, null]];
				for(var fff = ourStartIdx; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
					dataFields[fff].slaves.push(listenerFeatureIdxZ);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxZ);
				}

				dataFields.push(fieldInf);

				var fieldInf = {};
				fieldInf.name = "idx -> Density";
				fieldInf.type = ["number"];
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				var fieldIdx = dataFields.length;
				var originalFieldIdx = f;
				fieldInf.val = valHelper1D(originalFieldIdx); // TODO, this can be made fast, since the size is fixed
				fieldInf.newSel = addSelHelper(fieldIdx);
				fieldInf.sel = selHelper(fieldIdx);
				fieldInf.slaves = [fieldIdx];
				fieldInf.masters = [[fieldIdx, null]];

				for(var fff = ourStartIdx; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]); // TODO, this can be made fast, since the size is fixed
					dataFields[fff].slaves.push(fieldIdx);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(fieldIdx);
				}

				dataFields.push(fieldInf);
			}
		}

		// all cube cells depend on all other cube cells, for now
		for(var f1 = noofFields + masters.length; f1 < dataFields.length; f1++) {
			for(var f2 = f1 + 1; f2 < dataFields.length; f2++) {
				dataFields[f1].slaves.push(f2);
				dataFields[f1].masters.push([f2, null]);
				dataFields[f2].slaves.push(f1);
				dataFields[f2].masters.push([f1, null]);
			}
		}

		parsingFinished();
	}
	// ===================================================================================


	// ===================================================================================
	// File Reader on Load Callback GrADS
	// Method that reads the GrADS data result after load callback.
	// Parse the GrADS control file, store results in variable 'theHeaderGrADS'
	// ===================================================================================
	function fileReaderOnLoadCallbackGrADS(e, reader) {
		var dset = ""; // the file name specifier
		var title = ""; // data set name
		var undefVal = null; // the value used to indicate "no value"
		var xdef = {};
		var ydef = {"reverse":false};
		var zdef = {"reverse":false};
		var tdef = {};
		var edef = {};
		var vars = [];
		var endian = "";
		var contents = e.target.result.replace(/[\r\n]+/g, "\n");
		var lines = contents.split("\n");

		for(var l = 0; l < lines.length; l++) {
			var line = lines[l];
			if(line[0] != "*") { // lines starting with * are comments
				var fields = trim(line).split(" ");
				var head = fields[0].toLowerCase();

				if(head == "dset") {
					for(var f = 1; f < fields.length; f++) {
						if(fields[f][0] == "^" || fields[f][0] == "/" ) {
							if(fields[f][0] == "^") {
								dset = fields[f].substr(1);
							}
							else {
								dset = fields[f];
							}

							if(dset.indexOf("%e") > 0) {
								edef["inFilename"] = true;
							}
							else {
								edef["inFilename"] = false;
							}

							if(dset.indexOf("%y") > 0 || dset.indexOf("%m") > 0 || dset.indexOf("%d") > 0 || dset.indexOf("%h") > 0) {
								tdef["inFilename"] = true;
							}
							else {
								tdef["inFilename"] = false;
							}
							break;
						}
					}
				}
				else if(head == "title") {
					if(fields.length > 1) {
						title = fields[1];
						for(var f = 2; f < fields.length; f++) {
							title = title + " " + fields[f];
						}
					}
				}
				else if(head == "undef" && fields.length > 1) {
					undefVal = parseFloat(fields[1]);
				}
				else if(head == "xdef" || head == "ydef" || head == "zdef" || head == "edef") {
					if(head == "xdef") {
						theDef = xdef;
					}
					else if(head == "ydef") {
						theDef = ydef;
					}
					else if(head == "zdef") {
						theDef = zdef;
					}
					else {
						theDef = edef;
					}

					if(fields.length > 4 && fields[2].toLowerCase() == "linear") {
						theDef.length = parseInt(fields[1]);
						theDef.vals = [];
						var val = parseFloat(fields[3]);
						var step = parseFloat(fields[4]);
						for(var x = 0; x < theDef.length; x++) {
							theDef.vals.push(val);
							val += step;
						}
					}
					else if(fields.length > 2 && fields[2].toLowerCase() == "names") {
						theDef.length = parseInt(fields[1]);
						theDef.vals = [];
						if(fields.length >= theDef.length + 3) { // same line
							for(var x = 0; x < theDef.length; x++) {
								theDef.vals.push(fields[3 + x]);
							}
						}
						else {
							var idx = 3;
							var curLine = l;
							for(var x = 0; x < theDef.length; x++) {
								if(idx < fields.length) {
									theDef.vals.push(fields[idx]);
									idx++;
								}
								else {
									curLine++;
									idx = 0;
									while(curLine < lines.length) {
										fields = trim(lines[curLine]).split(" ");
										if(fields.length > 0) {
											break;
										}
									}

									if(idx < fields.length) {
										theDef.vals.push(fields[idx]); // strings
										idx++;
									}
								}
							}
							l = curLine;
						}
					}
					else if(fields.length > 2 && fields[2].toLowerCase() == "levels") {
						theDef.length = parseInt(fields[1]);
						theDef.vals = [];
						if(fields.length >= theDef.length + 3) { // same line
							for(var x = 0; x < theDef.length; x++) {
								theDef.vals.push(parseFloat(fields[3 + x]));
							}
						}
						else {
							var idx = 3;
							var curLine = l;
							for(var x = 0; x < theDef.length; x++) {
								if(idx < fields.length) {
									theDef.vals.push(parseFloat(fields[idx]));
									idx++;
								}
								else {
									curLine++;
									idx = 0;
									while(curLine < lines.length) {
										fields = trim(lines[curLine]).split(" ");
										if(fields.length > 0) {
											break;
										}
									}

									if(idx < fields.length) {
										theDef.vals.push(parseFloat(fields[idx]));
										idx++;
									}
								}
							}
							l = curLine;
						}
					}
				}
				else if(head == "vars") {
					var noofVars = parseInt(fields[1]);

					for(var v = 0; v < noofVars; v++) {
						l++;
						var vline = lines[l];
						var vfields = trim(vline).split(" ");

						var longName = vfields[3];
						for(var f = 4; f < vfields.length; f++) {
							longName = longName + " " + vfields[f];
						}
						vars.push({"shortName":vfields[0], "zSteps":parseInt(vfields[1]), "longName":longName, "units":parseInt(vfields[2])});
					}
				}
				else if(head == "endvars") {
					// nothing to do
				}
				else if(head == "options") {
					if(fields.length > 1) {
						if(fields[1] == "yrev") {
							ydef.reverse = true;
						}
						if(fields[1] == "zrev") {
							zdef.reverse = true;
						}

						if(fields[1] == "big_endian") {
							endian = "big";
						}
						if(fields[1] == "little_endian") {
							endian = "little";
						}
						if(fields[1] == "cray_32bit_ieee") {
							endian = "cray";
						}
					}
				}
				else if(head == "tdef") {
					var theDef = tdef;

					if(fields.length > 3 && fields[2].toLowerCase() == "linear") {
						theDef.length = parseInt(fields[1]);
						theDef.vals = [];
						var val = parseGrADSdate(fields[3]);
						if(fields.length > 4) {
							var step = fields[4];
						}
						else if(val.length > 6) {
							var step = val[6];
						}

						var dateString = ("0000" + val[0]).slice(-4) + "-" + ("00" + (1 + val[1])).slice(-2) + "-" + ("00" + val[2]).slice(-2) + "T" + ("00" + val[3]).slice(-2) + ":" + ("00" + val[4]).slice(-2) + ":" + ("00" + val[5]).slice(-2) + "+09:00"; // time zone?
						var startDate = new Date(dateString);
						var stepVal = parseInt(step.match(/[0-9][0-9]*/)[0]);
						var msIncrement = 0;
						var isMs = false;
						var isMo = false;
						var isYr = false;
						if(step.indexOf("mn") > 0) {
							msIncrement = stepVal * 1000 * 60;
							isMs = true;
						}
						else if(step.indexOf("hr") > 0) {
							msIncrement = stepVal * 1000 * 60 * 60;
							isMs = true;
						}
						else if(step.indexOf("dy") > 0) {
							msIncrement = stepVal * 1000 * 60 * 60 * 24;
							isMs = true;
						}
						else if(step.indexOf("mo") > 0) {
							isMo = true;
						}
						else if(step.indexOf("yr") > 0) {
							isYr = true;
						}

						for(var x = 0; x < theDef.length; x++) {
							var timeStamp = startDate;
							if(isMs) {
								timeStamp = new Date(startDate.getTime() + msIncrement * x);
							}
							if(isYr) {
								timeStamp = new Date(startDate.getFullYear() + stepVal * x,startDate.getMonth(),startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
							}
							if(isMo) {
								timeStamp = new Date(startDate.getFullYear(),startDate.getMonth() + stepVal * x,startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
							}

							theDef.vals.push(timeStamp.getTime());
						}

					}
					else if(fields.length > 2 && fields[2].toLowerCase() == "levels") {
						theDef.length = parseInt(fields[1]);
						theDef.vals = [];
						if(fields.length >= theDef.length + 3) {
							for(var x = 0; x < theDef.length; x++) {
								theDef.vals.push(parseGrADSdate(fields[3 + x]));
							}
						}
					}
				}
			}
		}

		var header = {"dset":dset, "title":title, "undefVal":undefVal, "xdef":xdef, "ydef":ydef, "zdef":zdef, "tdef":tdef, "edef":edef, "vars":vars, "endian":endian};
		theHeaderGrADS = header;
		parseGrADSdataFiles(header, e, reader, 0);
	}
	// ===================================================================================


	// ===================================================================================
	// Parse GrADS Date
	// Method that converts a string with a date in GrADS format to a date object
	// ===================================================================================
	function parseGrADSdate(str) {
		var hour = 0;
		var min = 0;
		var sec = 0;
		var tStr = ["", "", ""];
		var tIdx = 0;

		for(var c = 0; c < str.length && str[c] != "Z" && str[c] != "z"; c++) {
			if(str[c] == ":") {
				tIdx++;
			}
			else {
				if(tIdx < 3) {
					tStr[tIdx] = tStr[tIdx] + str[c];
				}
			}
		}

		if(tStr[0] != "") {
			hour = parseInt(tStr[0]);
		}
		if(tStr[1] != "") {
			min = parseInt(tStr[1]);
		}
		if(tStr[2] != "") {
			sec = parseInt(tStr[2]);
		}

		c++; // now after Z, the date position
		var datePart = str.substr(c);
		var day = 0;
		var charCodeZero = "0".charCodeAt(0);
		var charCodeNine = "9".charCodeAt(0);

		var cc = datePart.charCodeAt(0);
		if(cc >= charCodeZero && cc <= charCodeNine) {
			day = datePart.match(/[0-9][0-9]*/)[0];
			c += day.length;
			day = parseInt(day);
		}

		var mon = str.substr(c, 3);
		var mon = months[mon];
		var year = parseInt(str.substr(c+3, 4));
		if(str.length == c + 3 + 2) {
			// two digit year implies year between 1950 and 2049
			if(year < 50) {
				year += 2000;
			}
			else {
				year += 1900;
			}
		}

		// this should strictly speaking not happen according to the standard, but in our example data files there was
		// no space between the date and the time increment specification
		var extra = "";
		if(str.length > c + 7) {
			extra = str.substr(c+7);
		}

		return [year, mon, day, hour, min, sec, extra];
	}
	// ===================================================================================


	// ===================================================================================
	// Parse GrADS Data Files
	// Method that parse all the binary data files in the GrADS format.
	// Requires the GrADS header file to be parsed first
	// ===================================================================================
	function parseGrADSdataFiles(header, e, reader, startFidx) {
		// $log.log(preDebugMsg + "parseGrADSdataFiles");
		data = {};
		data.fieldNames = [];
		data.fieldTypes = [];
		data.columns = [];
		data.metaData = {};

		for(var v = 0; v < header.vars.length; v++) {
			data.fieldNames.push(header.vars[v].longName);
			data.fieldTypes.push(["3Darray"]);
			data.columns.push([]);
		}

		data.fieldNames.push("Time Stamp");
		data.fieldTypes.push(["date"]);
		data.columns.push([]);

		if((header.edef.hasOwnProperty("vals") && header.edef.vals.length > 0) || header.edef.inFilename) {
			data.fieldNames.push("Band");
			data.fieldTypes.push(["number"]);
			data.columns.push([]);
		}

		var foundSomething = false;
		for(var fidx = startFidx; !foundSomething && fidx < reader.fileList.length; fidx++) {
			var f = reader.fileList[fidx];
			var myidx = fidx;
			var fn = f.name.toLowerCase();

			// $log.log(preDebugMsg + "check " + fidx + " " + fn);

			if(fn.indexOf(".dat") >= 0 || fn.indexOf(".bin") >= 0) {
				// assume binary data
				foundSomething = true;
				reader.onload = function(e2) { gradsBinFileReaderOnLoadCallback(e2, reader, header, f.name, myidx + 1);};

				// $log.log(preDebugMsg + "Read " + f.name + " (idx " + fidx + ")");
				reader.readAsArrayBuffer(f);
			}
		}
	}
	// ===================================================================================


	// ===================================================================================
	// GrADS Binary File Reader on Load Callback
	// Method that parse one binary data file in the GrADS format
	// ===================================================================================
	function gradsBinFileReaderOnLoadCallback(e2, reader, header, fname, startFidx) {
		// $log.log(preDebugMsg + "gradsBinFileReaderOnLoadCallback");
		// $log.log(preDebugMsg + "callback on " + fname);
		var vs = header.vars.length;
		fileName = fname;
		var skipped = 0;
		var used = 0;
		var sum = 0;
		var vmax = 0;
		var vmin = 0;
		var nans = 0;
		var offset = 0;
		var dv = new DataView(e2.target.result);
		var littleEndian = false;
		if(header.endian == "big") {
			littleEndian = false;
		}
		else if(header.endian == "little") {
			littleEndian = true;
		}

		var override = $scope.gimme("OverrideEndian");
		if(override == 2) {
			littleEndian = false;
		}
		else if(override == 1) {
			littleEndian = true;
		}

		var es = 1;
		if(!header.edef.inFilename && header.edef.hasOwnProperty("vals") && header.edef.vals.length > 0) {
			es = header.edef.vals.length;
		}

		var ts = 1;
		if(header.tdef.vals.length > 0 && !header.tdef.inFilename) {
			ts = header.tdef.vals.length;
		}

		// temporary ugly hack to not run out of memory
		if(ts > 8) {
			ts = 8;
		}

		var t = 0;
		if(header.tdef.inFilename) {
			t = getTimeFromFileNameAsDatetime(fname, header);
			data.columns[header.vars.length].push(t);
		}

		var e = 0;
		if(header.edef.inFilename) {
			e = getEfromFilename(fname, header);
			data.columns[header.vars.length + 1].push(e);
		}

		for(var e = 0; e < es; e++) {
			if(!header.edef.inFilename) {
				if(header.edef.hasOwnProperty("vals") && header.edef.vals.length > 0) { // esemble is often not used, then skip this field
					data.columns[header.vars.length + 1].push(parseInt(header.edef.vals[e]));
				}
			}

			for(var t = 0; t < ts; t++) {
				if(!header.tdef.inFilename) {
					if(t < header.tdef.vals.length) {
						data.columns[header.vars.length].push(header.tdef.vals[t]);
					}
					else {
						data.columns[header.vars.length].push(0);
					}
				}

				for(var v = 0; v < header.vars.length; v++) {
					var cube = [];

					if(header.vars[v].zSteps == 0) { // data not corresponding to any Z-level
						header.vars[v].zSteps = 1;
					}

					for(var z = 0; z < header.vars[v].zSteps && z < header.zdef.length; z++) {
						cube.push([]);

						for(var y = 0; y < header.ydef.length; y++) {
							cube[z].push([]);

							for(var x = 0; x < header.xdef.length; x++) {
								var val = dv.getFloat32(offset, littleEndian);

								if(isNaN(val)) {
									$log.log(preDebugMsg + "Got NaN when reading float");
									$log.log(preDebugMsg + "dv.getFloat32(" + offset + ", " + littleEndian + "); --> " + val);
									// $log.log(preDebugMsg + "dims: " + header.xdef.length + "," + header.ydef.length + "," + header.zdef.length + "(" + header.vars[v].zSteps + ") --> " + 4 * header.xdef.length * header.ydef.length * header.zdef.length + " (" + 4 * header.xdef.length * header.ydef.length * header.vars[v].zSteps + ")");
									var b0 = dv.getUint8(offset + 0);
									var b1 = dv.getUint8(offset + 1);
									var b2 = dv.getUint8(offset + 2);
									var b3 = dv.getUint8(offset + 3);
									$log.log(preDebugMsg + "Bytes: " + b0.toString(16) + " "  + b1.toString(16) + " "  + b2.toString(16) + " "  + b3.toString(16));
								}

								if(isNaN(val)) {
									nans++;
									val = 0;
								}

								offset += 4;
								if(val != header.undefVal) {
									cube[z][y].push(val);

									if(used <= 0) {
										vmin = val;
										vmax = val;
									}
									else {
										vmin = Math.min(vmin, val);
										vmax = Math.max(vmax, val);
									}
									sum += val;
									used++;
								}
								else {
									cube[z][y].push(null);
									skipped++;
								}
							}
						}
					}

					data.columns[v].push(cube);
					cube = [];
				} // for each variable v
			} // for each timestamp t
		} // for each ensemble e

		// $log.log(preDebugMsg + "used " + used + " values, skipped " + skipped + " values because they matched the null value.");
		if(nans > 0) {
			$log.log(preDebugMsg + "WARNING: found " + nans + " values that were not correct floats.");
		}

		// check if there are more files and if there are, parse the next one
		var foundSomething = false;
		for(var fidx = startFidx; !foundSomething && fidx < reader.fileList.length; fidx++) {
			var f = reader.fileList[fidx];
			var myidx = fidx;
			var fn = f.name.toLowerCase();

			if(fn.indexOf(".dat") >= 0) {
				// assume binary data
				foundSomething = true;
				reader.onload = function(e2) { gradsBinFileReaderOnLoadCallback(e2, reader, header, f.name, myidx + 1);};
				// $log.log(preDebugMsg + "Read " + f.name);
				reader.readAsArrayBuffer(f);
			}
		}

		// if this was the last file to parse, move on to the next step
		if(!foundSomething) {
			convertGrADS(data);
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Get E From Filename
	// The ensemble value can be encoded in the filename, if it is, this is how to read
	// it back
	// ===================================================================================
	function getEfromFilename(fname, header) {
		var idx = header.dset.lastIndexOf("/");
		var ds = header.dset.toLowerCase();

		if(idx >= 0) {
			ds = ds.substring(idx + 1);
		}

		ds = ds.replace("%m2", "[0-9]*").replace("%d2", "[0-9]*").replace("%h2", "[0-9]*").replace("%n2", "[0-9]*").replace("%y2", "[0-9]*").replace("%y4", "[0-9]*");
		var f = fname.toLowerCase();

		if(header.edef.hasOwnProperty("vals")) {
			for(var e = 0; e < header.edef.vals.length; e++) {
				var exp = new RegExp(ds.replace("%e", header.edef.vals[e]));

				if(exp.test(f)) {
					return Number(header.edef.vals[e]);
				}
			}
		}
		return 0;
	}
	// ===================================================================================


	// ===================================================================================
	// Get Time From Filename
	// The time stamp value can be encoded in the filename, and if it is use this to get
	// the value.
	// ===================================================================================
	function getTimeFromFileName(fname, header) {
		// ignore the header.dset information for now, since it seems to be broken in the example files we have.
		var c = fname.indexOf(".dat");
		if(fname.indexOf(").dat") > 0) {
			c = fname.indexOf(".dat") - 4;
		}
		var s = fname.substr(c - 14, 14);

		// assume yyyymmddhhmmss for now
		return s.substr(0, 4) + "-" + s.substr(4,2) + "-" + s.substr(6,2) + "T" + s.substr(8,2) + ":" + s.substr(10,2) + ":" + s.substr(12);
	}
	// ===================================================================================


	// ===================================================================================
	// Get Time From Filename as DateTime
	// The time stamp value can be encoded in the filename, and if it is use this to get
	// the value a a datetime value.
	// ===================================================================================
	function getTimeFromFileNameAsDatetime(fname, header) {
		// ignore the header.dset information for now, since it seems to be broken in the example files we have.
		var c = fname.indexOf(".dat");
		if(fname.indexOf(").dat") > 0) {
			c = fname.indexOf(".dat") - 4;
		}
		var s = fname.substr(c - 14, 14);

		// assume yyyymmddhhmmss for now
		var ds = s.substr(0, 4) + "-" + s.substr(4,2) + "-" + s.substr(6,2) + "T" + s.substr(8,2) + ":" + s.substr(10,2) + ":" + s.substr(12);
		// $log.log(preDebugMsg + "filename: '" + fname + "', date string: '" + ds + "'");
		return new Date(ds);
	}
	// ===================================================================================


	// ===================================================================================
	// Value Helper 1D
	// This helper support method returns a specified field value into another format
	// ===================================================================================
	function valHelper1D(originalFieldIdx) {
		return function(idx) { return get3DdataAs1D(originalFieldIdx, idx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Selection Helper
	// This helper support method returns a specified field value as selected
	// ===================================================================================
	function selHelper(fieldIdx) {
		return function(idx) { return valueIsSelected(fieldIdx, idx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Add Selection Helper
	// This helper support method returns a specified field value after it been added
	// ===================================================================================
	function addSelHelper(fieldIdx) {
		return function(viz, fun, firstOfMany, selectAll) { return addVizSelection(viz, fun, fieldIdx, firstOfMany, selectAll); };
	}
	// ===================================================================================


	// ===================================================================================
	// Convert GrADS
	// This method converts GrADS data into a Dashboard useful things
	// ===================================================================================
	function convertGrADS(data) {
		if(!fullyLoaded) {
			return;
		}

		// $log.log(preDebugMsg + "convertGrADS()");
		var error = false;
		var newFormat = true;
		// GrADS data is stored as records with [timestamp, ensemble value, 3D cube, more 3D cubes, ...], so the same timestamp can be repeated (if there are several ensembles at each timestamp) and the ensemble value can also be repeated (if there are several timestamps).
		var eVecIdx = -1;
		var tVecIdx = -1;

		for(var f = 0; f < data.fieldNames.length; f++) {
			var fieldInf = {};
			fieldInf.name = data.fieldNames[f];
			fieldInf.type = data.fieldTypes[f];
			fieldInf.size = data.columns[f].length;
			fieldInf.idx = f;
			fieldInf.listen = addListeningViz;

			// fields that need updating when this field changes
			fieldInf.slaves = [f];
			// fields that when change also affects this field, and a function to transform the index to the appropriate value
			fieldInf.masters = [[f, null]];

			if(fieldInf.type[0] == "3Darray") {
				var ff = f;
				var temp = function(idx) { return get3DdataAs3D(ff, idx); };
				fieldInf.val = temp;
				fieldInf.newSel = addSelHelper(ff);
				fieldInf.sel = selHelper(ff);
				last3Didx = f;
			}
			else {
				// time or ensemble
				var fff = f;
				fieldInf.val = valHelper(fff);

				if(data.fieldNames[f] == "Time Stamp") {
					tVecIdx = f;
					fieldInf.newSel = addSelHelper(tVecIdx);
					fieldInf.sel = selHelper(tVecIdx);
				}
				else {
					eVecIdx = f;
					fieldInf.newSel = addSelHelper(eVecIdx);
					fieldInf.sel = selHelper(eVecIdx);
				}
			}
			dataFields.push(fieldInf);
		}

		// the first fields all affect each other
		var noofFields = dataFields.length;
		for(var f = 0; f < noofFields; f++) {
			dataFields[f].slaves = [];
			dataFields[f].masters = [];

			for(var ff = 0; ff < noofFields; ff++) {
				dataFields[f].slaves.push(ff);
				dataFields[f].masters.push([ff, null]);
			}
		}

		// Add X, Y, Z labels as variables too
		var masters = [];
		// add the x-labels (the x coordinates)
		var fieldInf = {};
		fieldInf.name = "X coordinates";
		fieldInf.type = ["number", "longitude"]; // lat? lon?
		fieldInf.size = theHeaderGrADS.xdef.length;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return theHeaderGrADS.xdef.vals[idx]; };
		xVecIdx = dataFields.length;
		masters.push([xVecIdx, transformCellIdxToXidxHelper]);
		fieldInf.slaves = [xVecIdx];
		fieldInf.masters = [[xVecIdx, null]];
		fieldInf.newSel = addSelHelper(xVecIdx);
		fieldInf.sel = selHelper(xVecIdx);

		dataFields.push(fieldInf);

		// add the y-labels (the y coordinates)
		var fieldInf = {};
		fieldInf.name = "Y coordinates";
		fieldInf.type = ["number", "latitude"]; // lat? lon?
		fieldInf.size = theHeaderGrADS.ydef.length;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return theHeaderGrADS.ydef.vals[idx]; };
		yVecIdx = dataFields.length;
		masters.push([yVecIdx, transformCellIdxToYidxHelper]);
		fieldInf.slaves = [yVecIdx];
		fieldInf.masters = [[yVecIdx, null]];
		fieldInf.newSel = addSelHelper(yVecIdx);
		fieldInf.sel = selHelper(yVecIdx);

		dataFields.push(fieldInf);

		// add the z-labels (the z coordinates)
		var fieldInf = {};
		fieldInf.name = "Z coordinates";
		fieldInf.type = ["number"];
		fieldInf.size = theHeaderGrADS.zdef.length;
		fieldInf.listen = addListeningViz;
		fieldInf.val = function(idx) { return theHeaderGrADS.zdef.vals[idx]; };
		zVecIdx = dataFields.length;
		masters.push([zVecIdx, transformCellIdxToZidxHelper]);
		fieldInf.slaves = [zVecIdx];
		fieldInf.masters = [[zVecIdx, null]];
		fieldInf.newSel = addSelHelper(zVecIdx);
		fieldInf.sel = selHelper(zVecIdx);

		dataFields.push(fieldInf);

		// provide data as idx -> x, y, z, val1, val2, etc.
		var first = true;
		for(var f = 0; f < data.fieldNames.length; f++) {
			if(data.fieldTypes[f][0] == "3Darray") {
				var cubeValuesSize = data.columns[f].length * data.columns[f][0].length * data.columns[f][0][0].length * data.columns[f][0][0][0].length;
				var ff = f;

				if(first) {
					var fieldInf = {};
					fieldInf.name = "idx -> X";
					fieldInf.type = ["number", "longitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx);
						return theHeaderGrADS.xdef.vals[coords[3]];
					};

					var ffx = f;
					var listenerFeatureIdxX = dataFields.length;
					fieldInf.sel = selHelper(listenerFeatureIdxX);
					fieldInf.newSel = addSelHelper(listenerFeatureIdxX);

					fieldInf.slaves = [listenerFeatureIdxX];
					fieldInf.masters = [[listenerFeatureIdxX, null]];
					for(var fff = 0; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
						dataFields[fff].slaves.push(listenerFeatureIdxX);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxX);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Y";
					fieldInf.type = ["number", "latitude"]; // lat? lon?
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx);
						return theHeaderGrADS.ydef.vals[coords[2]];
					};

					var ffy = f;
					var listenerFeatureIdxY = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxY);
					fieldInf.sel = selHelper(listenerFeatureIdxY);

					fieldInf.slaves = [listenerFeatureIdxY];
					fieldInf.masters = [[listenerFeatureIdxY, null]];
					for(var fff = 0; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
						dataFields[fff].slaves.push(listenerFeatureIdxY);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxY);
					}

					dataFields.push(fieldInf);

					var fieldInf = {};
					fieldInf.name = "idx -> Z";
					fieldInf.type = ["number"];
					fieldInf.size = cubeValuesSize;
					fieldInf.listen = addListeningViz;
					fieldInf.val = function(valueIdx) {
						var coords = getCidxXYZfromIdx(ff, valueIdx);
						return theHeaderGrADS.zdef.vals[coords[1]];
					};

					var ffz = f;
					var listenerFeatureIdxZ = dataFields.length;
					fieldInf.newSel = addSelHelper(listenerFeatureIdxZ);
					fieldInf.sel = selHelper(listenerFeatureIdxZ);

					fieldInf.slaves = [listenerFeatureIdxZ];
					fieldInf.masters = [[listenerFeatureIdxZ, null]];
					for(var fff = 0; fff < noofFields; fff++) {
						fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
						dataFields[fff].slaves.push(listenerFeatureIdxZ);
					}
					for(var fff = 0; fff < masters.length; fff++) {
						fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
						dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxZ);
					}

					dataFields.push(fieldInf);

					if(tVecIdx >= 0) {
						var fieldInf = {};
						fieldInf.name = "idx -> " + data.fieldNames[tVecIdx];
						fieldInf.type = ["date"];
						fieldInf.size = cubeValuesSize;
						fieldInf.listen = addListeningViz;
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx);
							return data.columns[tVecIdx][coords[0]];
						};

						var fft = f;
						var listenerFeatureIdxT = dataFields.length;
						fieldInf.newSel = addSelHelper(listenerFeatureIdxT);
						fieldInf.sel = selHelper(listenerFeatureIdxT);

						fieldInf.slaves = [listenerFeatureIdxT];
						fieldInf.masters = [[listenerFeatureIdxT, null]];
						for(var fff = 0; fff < noofFields; fff++) {
							fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
							dataFields[fff].slaves.push(listenerFeatureIdxT);
						}
						for(var fff = 0; fff < masters.length; fff++) {
							fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
							dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxT);
						}

						dataFields.push(fieldInf);
					}

					if(eVecIdx >= 0) {
						var fieldInf = {};
						fieldInf.name = "idx -> " + data.fieldNames[eVecIdx];
						fieldInf.type = ["number"];
						fieldInf.size = cubeValuesSize;
						fieldInf.listen = addListeningViz;
						fieldInf.val = function(valueIdx) {
							var coords = getCidxXYZfromIdx(ff, valueIdx);
							return data.columns[eVecIdx][coords[0]];
						};

						var ffe = f;
						var listenerFeatureIdxE = dataFields.length;
						fieldInf.newSel = addSelHelper(listenerFeatureIdxE);
						fieldInf.sel = selHelper(listenerFeatureIdxE);

						fieldInf.slaves = [listenerFeatureIdxE];
						fieldInf.masters = [[listenerFeatureIdxE, null]];
						for(var fff = 0; fff < noofFields; fff++) {
							fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
							dataFields[fff].slaves.push(listenerFeatureIdxE);
						}
						for(var fff = 0; fff < masters.length; fff++) {
							fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
							dataFields[masters[fff][0]].slaves.push(listenerFeatureIdxE);
						}

						dataFields.push(fieldInf);
					}
					// coords[0] for time, ensemble, cubeIdx
					// coords[3] for z
					// coords[2] for y
					// coords[1] for x
				}

				first = false;
				var fieldInf = {};
				fieldInf.name = "idx -> " + data.fieldNames[f];
				fieldInf.type = ["number"];
				fieldInf.size = cubeValuesSize;
				fieldInf.listen = addListeningViz;
				var fieldIdx = dataFields.length;
				var originalFieldIdx = f;
				fieldInf.val = valHelper1D(originalFieldIdx);
				fieldInf.newSel = addSelHelper(fieldIdx);
				fieldInf.sel = selHelper(fieldIdx);
				fieldInf.slaves = [fieldIdx];
				fieldInf.masters = [[fieldIdx, null]];

				for(var fff = 0; fff < noofFields; fff++) {
					fieldInf.masters.push([fff, transformCellIdxToCubeIdxHelper(f)]);
					dataFields[fff].slaves.push(fieldIdx);
				}
				for(var fff = 0; fff < masters.length; fff++) {
					fieldInf.masters.push([masters[fff][0], masters[fff][1](f)]);
					dataFields[masters[fff][0]].slaves.push(fieldIdx);
				}

				dataFields.push(fieldInf);
			}
		}

		// all cube cells depend on all other cube cells, for now
		for(var f1 = noofFields + masters.length; f1 < dataFields.length; f1++) {
			for(var f2 = f1 + 1; f2 < dataFields.length; f2++) {
				dataFields[f1].slaves.push(f2);
				dataFields[f1].masters.push([f2, null]);
				dataFields[f2].slaves.push(f1);
				dataFields[f2].masters.push([f1, null]);
			}
		}

		parsingFinished();

		if(error){
			$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
			$scope.set("DataChanged", !$scope.gimme("DataChanged"));
			$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":[], "noofRows":0}], "file":""};
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Value Helper
	// This helper support method returns a specified column value
	// ===================================================================================
	function valHelper(col) {
		return function(idx) {
			// $log.log(preDebugMsg + "function for T or E, idx " + col) ;
			if(col < data.columns.length && idx >= 0 && idx < data.columns[col].length) {
				return data.columns[col][idx];
			}
			return null;
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Update View
	// This method updates the view of the Webble to properly represent the contained data
	// ===================================================================================
	function updateView() {
		// $log.log(preDebugMsg + "updateView()");
		$scope.dragNdropData.file = fileName;
		var colors = $scope.gimme("ColorScheme");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false
			if(!drewBack && colors.skin.hasOwnProperty("color")) {
				$scope.dataListStyle['background-color'] = colors.skin.color;
				drewBack = true;
			}

			if(colors.skin.hasOwnProperty("border")) {
				$scope.dataListStyle['border'] = '2px solid ' + colors.skin.border;
			}

			if(colors.skin.hasOwnProperty("text")) {
				$scope.dataListStyle['color'] = colors.skin.text;
			}
			else {
				$scope.dataListStyle['color'] = "black";
			}
		}

		var newStyle = {};
		for(var s in $scope.dataListStyle) {
			newStyle[s] = $scope.dataListStyle[s];
		}

		newStyle.fontSize = fontSize;
		$scope.dataListStyle = newStyle;
	}
	// ===================================================================================


	// ===================================================================================
	// Add Listening Viz
	// This method add listening functionality to visualizer
	// ===================================================================================
	function addListeningViz(vizId, listening, callbackForNewSelections, callbackForNewData, listOfInterestingFeatures) {
		var shouldUpdate = false;

		for(var f = 0; f < dataFields.length; f++) {
			while(f >= dataListeners.length) {
				dataListeners.push([]);
			}

			var listenHere = false;
			if(listening) { // turn on listening, or change what is listened to
				for(var f2 = 0; f2 < listOfInterestingFeatures.length; f2++) {
					if(listOfInterestingFeatures[f2] == f) {
						listenHere = true;
						break;
					}
				}
			}

			var found = false;
			for(var v = 0; v < dataListeners[f].length; v++) {
				if(dataListeners[f][v].id == vizId) { // found the right component
					found = true;
					if(dataListeners[f][v].listening) { // was already listening
						if(!listenHere) { // no longer interested
							// dataListeners[f][v].listening = false;  // maybe if we run for a long time we should clean this up
							dataListeners[f].splice(v, 1);
						}
					}
					else { // was not listening previously
						if(listenHere) { // but want to listen from now
							dataListeners[f][v] = {'id':vizId, 'listening':true, 'newData':callbackForNewData, 'newSelections':callbackForNewSelections};
							shouldUpdate = true;
						}
					}
					break;
				}
			}
			if(!found) { // did not listen previously
				if(listenHere) { // but want to listen from now
					dataListeners[f].push({'id':vizId, 'listening':true, 'newData':callbackForNewData, 'newSelections':callbackForNewSelections});
					shouldUpdate = true;
				}
			}
		}

		if(shouldUpdate) {
			callbackForNewSelections(selectionUpdateNumber);
		}
	}
	// ===================================================================================


	//===================================================================================
	// Data Access functions
	//===================================================================================

	// ===================================================================================
	// Get 3D Data as 3D Helper
	// This method gets 3D data
	// ===================================================================================
	function get3DdataAs3DHelper(feature) {
		return function(idx) { return get3DdataAs3D(feature, idx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Get 3D Data as 3D Helper
	// This method gets 3D data. Returns one complete 3D cube
	// ===================================================================================
	function get3DdataAs3D(feature, idx) {
		if(feature >= 0 && idx >= 0 && feature < dataFields.length && feature < data.columns.length && idx < data.columns[feature].length && dataFields[feature].type[0] == "3Darray") {
			return data.columns[feature][idx];
		}
		else
		{
			return null;
		}
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Cube Idx Helper
	// This method transforms a cell Idx value to a 3D Cube Idx value
	// ===================================================================================
	function transformCellIdxToCubeIdxHelper(featureIdx) {
		return function (idx) { return transformCellIdxToCubeIdx(idx, featureIdx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Cube Idx
	// This method transforms a cell Idx value to a 3D Cube Idx value
	// We need the featureIdx because different data fields can have different number of
	// height levels (z.length)
	// ===================================================================================
	function transformCellIdxToCubeIdx(idx, featureIdx) {
		if(featureIdx >= 0 && idx >= 0 && featureIdx < dataFields.length && featureIdx < data.columns.length && dataFields[featureIdx].type[0] == "3Darray") {
			var cubeNo = 0;

			if(data.columns[featureIdx].length > 0 && data.columns[featureIdx][0].length > 0 && data.columns[featureIdx][0][0].length > 0 && data.columns[featureIdx][0][0][0].length > 0) {
				var dimZ = data.columns[featureIdx][0].length;
				var dimY = data.columns[featureIdx][0][0].length;
				var dimX = data.columns[featureIdx][0][0][0].length;

				return Math.floor(idx / dimZ / dimY / dimX);
			}
		}
		return 0;
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Xidx Helper
	// This method transforms a cell Idx value to a Xidx value
	// ===================================================================================
	function transformCellIdxToXidxHelper(featureIdx) {
		return function (idx) { return transformCellIdxToXidx(idx, featureIdx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Xidx
	// This method transforms a cell Idx value to a Xidx value
	// ===================================================================================
	function transformCellIdxToXidx(idx, featureIdx) {
		if(featureIdx >= 0 && idx >= 0 && featureIdx < dataFields.length && featureIdx < data.columns.length && dataFields[featureIdx].type[0] == "3Darray") {
			var cubeNo = 0;
			var x = 0;
			var y = 0;
			var z = 0;

			if(data.columns[featureIdx].length > 0 && data.columns[featureIdx][0].length > 0 && data.columns[featureIdx][0][0].length > 0 && data.columns[featureIdx][0][0][0].length > 0) {
				var dimZ = data.columns[featureIdx][0].length;
				var dimY = data.columns[featureIdx][0][0].length;
				var dimX = data.columns[featureIdx][0][0][0].length;

				cubeNo = Math.floor(idx / dimZ / dimY / dimX);
				var rem = idx - cubeNo * dimZ * dimY * dimX;

				z = Math.floor(rem / dimY / dimX);
				rem = rem - z * dimY * dimX;

				y = Math.floor(rem / dimX);

				x = rem - dimX * y;
				return x;
			}
		}
		return 0;
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Yidx Helper
	// This method transforms a cell Idx value to a Yidx value
	// ===================================================================================
	function transformCellIdxToYidxHelper(featureIdx) {
		return function (idx) { return transformCellIdxToYidx(idx, featureIdx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Yidx
	// This method transforms a cell Idx value to a Yidx value
	// ===================================================================================
	function transformCellIdxToYidx(idx, featureIdx) {
		if(featureIdx >= 0 && idx >= 0 && featureIdx < dataFields.length && featureIdx < data.columns.length && dataFields[featureIdx].type[0] == "3Darray") {
			var cubeNo = 0;
			var y = 0;
			var z = 0;

			if(data.columns[featureIdx].length > 0 && data.columns[featureIdx][0].length > 0 && data.columns[featureIdx][0][0].length > 0 && data.columns[featureIdx][0][0][0].length > 0) {
				var dimZ = data.columns[featureIdx][0].length;
				var dimY = data.columns[featureIdx][0][0].length;
				var dimX = data.columns[featureIdx][0][0][0].length;

				cubeNo = Math.floor(idx / dimZ / dimY / dimX);
				var rem = idx - cubeNo * dimZ * dimY * dimX;

				z = Math.floor(rem / dimY / dimX);
				rem = rem - z * dimY * dimX;

				y = Math.floor(rem / dimX);

				return y;
			}
		}
		return 0;
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Zidx Helper
	// This method transforms a cell Idx value to a Zidx value
	// ===================================================================================
	function transformCellIdxToZidxHelper(featureIdx) {
		return function (idx) { return transformCellIdxToZidx(idx, featureIdx); };
	}
	// ===================================================================================


	// ===================================================================================
	// Transform Cell Idx to Zidx
	// This method transforms a cell Idx value to a Zidx value
	// ===================================================================================
	function transformCellIdxToZidx(idx, featureIdx) {
		if(featureIdx >= 0 && idx >= 0 && featureIdx < dataFields.length && featureIdx < data.columns.length && dataFields[featureIdx].type[0] == "3Darray") {
			var cubeNo = 0;
			var z = 0;

			if(data.columns[featureIdx].length > 0 && data.columns[featureIdx][0].length > 0 && data.columns[featureIdx][0][0].length > 0 && data.columns[featureIdx][0][0][0].length > 0) {
				var dimZ = data.columns[featureIdx][0].length;
				var dimY = data.columns[featureIdx][0][0].length;
				var dimX = data.columns[featureIdx][0][0][0].length;

				cubeNo = Math.floor(idx / dimZ / dimY / dimX);
				var rem = idx - cubeNo * dimZ * dimY * dimX;

				z = Math.floor(rem / dimY / dimX);
				return z;
			}
		}
		return 0;
	}
	// ===================================================================================


	// ===================================================================================
	// Get Cidx XYZ from Idx
	// This method gets the Cidx XYZ value from the Idx
	// ===================================================================================
	function getCidxXYZfromIdx(feature, idx) {
		var res = [-1, -1, -1, -1];

		if(feature >= 0 && idx >= 0 && feature < dataFields.length && feature < data.columns.length && dataFields[feature].type[0] == "3Darray") {
			var cubeNo = 0;
			var x = 0;
			var y = 0;
			var z = 0;

			if(data.columns[feature].length > 0 && data.columns[feature][0].length > 0 && data.columns[feature][0][0].length > 0 && data.columns[feature][0][0][0].length > 0) {
				var dimZ = data.columns[feature][0].length;
				var dimY = data.columns[feature][0][0].length;
				var dimX = data.columns[feature][0][0][0].length;

				cubeNo = Math.floor(idx / dimZ / dimY / dimX);
				var rem = idx - cubeNo * dimZ * dimY * dimX;

				z = Math.floor(rem / dimY / dimX);
				rem = rem - z * dimY * dimX;

				y = Math.floor(rem / dimX);

				x = rem - dimX * y;

				res = [cubeNo, z, y, x];
			}
		}
		return res;
	}
	// ===================================================================================


	// ===================================================================================
	// Get 3D Data as 1D
	// This method gets 3D data as 1D. Returns the value in one cell in a 3D cube
	// ===================================================================================
	function get3DdataAs1D(feature, idx) {
		if(feature >= 0 && idx >= 0 && feature < dataFields.length && feature < data.columns.length && dataFields[feature].type[0] == "3Darray") {
			var cubeNo = 0;
			var x = 0;
			var y = 0;
			var z = 0;

			if(data.columns[feature].length > 0 && data.columns[feature][0].length > 0 && data.columns[feature][0][0].length > 0 && data.columns[feature][0][0][0].length > 0) {
				var dimZ = data.columns[feature][0].length;
				var dimY = data.columns[feature][0][0].length;
				var dimX = data.columns[feature][0][0][0].length;

				cubeNo = Math.floor(idx / dimZ / dimY / dimX);
				var rem = idx - cubeNo * dimZ * dimY * dimX;

				z = Math.floor(rem / dimY / dimX);
				rem = rem - z * dimY * dimX;

				y = Math.floor(rem / dimX);

				x = rem - dimX * y;

				return data.columns[feature][cubeNo][z][y][x];
			}
		}
		return null;
	}
	// ===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
