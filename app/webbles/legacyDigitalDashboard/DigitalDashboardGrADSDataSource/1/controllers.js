//======================================================================================================================
// View for DigitalDashboard GrADS Data Source Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('gradsDataWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================
    $scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data'}];

    $scope.pluginName =	"GRADS Data Source";
	var preDebugMsg = "DigitalDashboard GrADS source: ";

    var idSlotName = "TheIdSlot";
    var internalIdSlotSet = false;
    var oldIdSlotData = [];
    var fullyLoaded = false;
    var fileName = "";
    var data = {};
    var fieldNames = [];
    var fieldTypes = [];
    var noofRows = 0;
    var fontSize = 11;
    var textColor = "black";
    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;
    var fileType = "none";

	$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
	$scope.dataListStyle = {'padding':'10px', 'font-size':fontSize, 'font-family':'arial', 'background-color':'lightgrey', 'color':textColor, 'border':'2px solid #4400aa'};
	var months = {"jan":0,"feb":1,"mar":2, "apr":3, "may":4, "jun":5, "jul":6, "aug":7, "sep":8, "oct":9, "nov":10, "dec":11, "JAN":0,"FEB":1,"MAR":2, "APR":3, "MAY":4, "JUN":5, "JUL":6, "AUG":7, "SEP":8, "OCT":9, "NOV":10, "DEC":11};



    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Files Added
	// This event handler takes care of data files being dropped and added to the Webble.
	//===================================================================================
	$scope.onFilesAdded = function(files) {
		if(files !== undefined && files.length > 1) {
			var haveCtl = false;
			var haveDats = 0;
			var ctl = null;
			for(var i = 0; i < files.length; i++) {
				var f = files[i];

				if(f.name.indexOf(".dat") > 0) {
					haveDats++;
				}

				if(f.name.indexOf(".bin") > 0) {
					haveDats++;
				}

				if(f.name == "dBZ.ctl") {
					haveCtl = true;
					ctl = f;
				} else if(!haveCtl && f.name.indexOf(".ctl") > 0) {
					haveCtl = true;
					ctl = f;
				}
			}

			if(haveCtl && haveDats > 0) {
				var reader = new FileReader();

				reader.fileList = files;
				reader.onload = function(e) { readerCtlCallback(e, reader);};
				reader.readAsText(ctl);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Reader Control Callback
	// This event handler takes care of the data reader callback in order to extract the
	// required GrADS data and parse it for further use.
	//===================================================================================
	function readerCtlCallback(e, reader) {
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

		// $log.log(preDebugMsg + contents);

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
				} else if(head == "title") {
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
								} else {
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
						if(step.indexOf("mn") > 0) { // stepIdx = 4;
							msIncrement = stepVal * 1000 * 60;
							isMs = true;
						} else if(step.indexOf("hr") > 0) { // stepIdx = 3;
							msIncrement = stepVal * 1000 * 60 * 60;
							isMs = true;
						} else if(step.indexOf("dy") > 0) { // stepIdx = 2;
							msIncrement = stepVal * 1000 * 60 * 60 * 24;
							isMs = true;
						} else if(step.indexOf("mo") > 0) { // stepIdx = 1;
							isMo = true;
						} else if(step.indexOf("yr") > 0) { // stepIdx = 0;
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

		//$log.log(preDebugMsg + title);
		//$log.log(preDebugMsg + undefVal);
		//$log.log(preDebugMsg + xdef);
		//$log.log(preDebugMsg + ydef);
		//$log.log(preDebugMsg + zdef);
		//$log.log(preDebugMsg + tdef);
		//$log.log(preDebugMsg + vars);
		//$log.log(preDebugMsg + endian);
		var header = {"dset":dset, "title":title, "undefVal":undefVal, "xdef":xdef, "ydef":ydef, "zdef":zdef, "tdef":tdef, "edef":edef, "vars":vars, "endian":endian};

		parseGrADSdataFiles(header, e, reader, 0);
	};
	//===================================================================================


	//===================================================================================
	// Binary File Reader On Load Callback
	// This event handler takes care of the binary data reader callback in order to
	// extract the required GrADS data from the binary files and parse it for further use
	//===================================================================================
	function binFileReaderOnLoadCallback(e2, reader, header, fname, startFidx) {
		// $log.log(preDebugMsg + "binFileReaderOnLoadCallback");
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
		var override = $scope.gimme("OverrideEndian");
		var es = 1;
		var ts = 1;
		var t = 0;
		var e = 0;

		if(header.endian == "big") {
			littleEndian = false;
		}
		else if(header.endian == "little") {
			littleEndian = true;
		}

		if(override == 0) {
			littleEndian = false;
		} else if(override == 1) {
			littleEndian = true;
		}

		if(!header.edef.inFilename && header.edef.hasOwnProperty("vals") && header.edef.vals.length > 0) {
			es = header.edef.vals.length;
		}

		if(header.tdef.vals.length > 0 && !header.tdef.inFilename) {
			ts = header.tdef.vals.length;
		}

		// temporary hack to not run out of memory
		if(ts > 8) {
			ts = 8;
		}

		if(header.tdef.inFilename) {
			t = getTimeFromFileNameAsDatetime(fname, header);
			data.columns[header.vars.length].push(t);
		}

		if(header.edef.inFilename) {
			e = getEfromFilename(fname, header);
			data.columns[header.vars.length + 1].push(e);
		}

		for(var e = 0; e < es; e++) {
			if(!header.edef.inFilename) {
				if(header.edef.hasOwnProperty("vals") && header.edef.vals.length > 0) { // ensemble is often not used, then skip this field
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
									//$log.log(preDebugMsg + "Got NaN when reading float");
									//$log.log(preDebugMsg + "dv.getFloat32(" + offset + ", " + littleEndian + "); --> " + val);
									// $log.log(preDebugMsg + "dims: " + header.xdef.length + "," + header.ydef.length + "," + header.zdef.length + "(" + header.vars[v].zSteps + ") --> " + 4 * header.xdef.length * header.ydef.length * header.zdef.length + " (" + 4 * header.xdef.length * header.ydef.length * header.vars[v].zSteps + ")");

									var b0 = dv.getUint8(offset + 0);
									var b1 = dv.getUint8(offset + 1);
									var b2 = dv.getUint8(offset + 2);
									var b3 = dv.getUint8(offset + 3);

									//$log.log(preDebugMsg + "Bytes: " + b0.toString(16) + " "  + b1.toString(16) + " "  + b2.toString(16) + " "  + b3.toString(16));
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
				} // for each variable v
			} // for each timestamp t
		} // for each ensemble e

		//$log.log(preDebugMsg + "used " + used + " values, skipped " + skipped + " values because they matched the null value.");
		if(nans > 0) {
			//$log.log(preDebugMsg + "WARNING: found " + nans + " values that were not correct floats.");
		}
		if(used > 0) {
			//$log.log(preDebugMsg + "min " + vmin + ", max " + vmax + ", av. " + (sum / used));
		}

		var foundSomething = false;
		for(var fidx = startFidx; !foundSomething && fidx < reader.fileList.length; fidx++) {
			var f = reader.fileList[fidx];
			var myidx = fidx;
			var fn = f.name.toLowerCase();

			if(fn.indexOf(".dat") >= 0) {
				// assume binary data
				foundSomething = true;

				reader.onload = function(e2) { binFileReaderOnLoadCallback(e2, reader, header, f.name, myidx + 1);};

				// $log.log(preDebugMsg + "Read " + f.name);
				reader.readAsArrayBuffer(f);
			}
		}

		// console.log("startIdx " + startFidx + ", found? " + foundSomething);
		// console.log(reader.fileList);

		if(!foundSomething) {
			// $log.log(preDebugMsg + fname + " seems to be the last file");
			parseDataHelper(data);
		}
	};
	//===================================================================================


	//===================================================================================
	// My Slot Change
	// This event handler takes care of all internal slot changes that is needed to react
	// upon.
	//===================================================================================
	function mySlotChange(eventData) {
		//$log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);

		if(eventData.slotName == idSlotName) {
			// this is not allowed unless it is a set from the parseData() function
			if(!internalIdSlotSet) {
				$scope.set(idSlotName, oldIdSlotData);
			}
		}
		else {
			switch(eventData.slotName) {
				case "PluginName":
					var newVal = eventData.slotValue;
					$scope.pluginName = newVal;
					break;
				case "GroupColors":
					colorPalette = null;
					updateView();
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
	};
	//===================================================================================



    //=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
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

		$scope.addSlot(new Slot('OverrideEndian',
			-1,
			"Override Endian",
			'Force interpretation of float binary data to little endian (1), big endian (0), or trust the file specification (-1).',
			$scope.theWblMetadata['templateid'],
			undefined,
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

		$scope.addSlot(new Slot('GroupColors',
			{"skin":{"color":"#8FBC8F", "border":"#8FBC8F", "gradient":[{"pos":0, "color":"#E9F2E9"}, {"pos":0.75, "color":"#8FBC8F"}, {"pos":1, "color":"#8FBC8F"}]},
				"selection":{"color":"#FFA500", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFEDCC"}, {"pos":1, "color":"#FFA500"}]},
				"groups":{0:{"color":"#A9A9A9", "gradient":[{"pos":0, "color":"#EEEEEE"}, {"pos":0.75, "color":"#A9A9A9"}]},
					1:{"color":"#0000FF", "gradient":[{"pos":0, "color":"#CCCCFF"}, {"pos":0.75, "color":"#0000FF"}]},
					2:{"color":"#7FFF00", "gradient":[{"pos":0, "color":"#E5FFCC"}, {"pos":0.75, "color":"#7FFF00"}]},
					3:{"color":"#8A2BE2", "gradient":[{"pos":0, "color":"#E8D5F9"}, {"pos":0.75, "color":"#8A2BE2"}]},
					4:{"color":"#FF7F50", "gradient":[{"pos":0, "color":"#FFE5DC"}, {"pos":0.75, "color":"#FF7F50"}]},
					5:{"color":"#DC143C", "gradient":[{"pos":0, "color":"#F8D0D8"}, {"pos":0.75, "color":"#DC143C"}]},
					6:{"color":"#006400", "gradient":[{"pos":0, "color":"#CCE0CC"}, {"pos":0.75, "color":"#006400"}]},
					7:{"color":"#483D8B", "gradient":[{"pos":0, "color":"#DAD8E8"}, {"pos":0.75, "color":"#483D8B"}]},
					8:{"color":"#FF1493", "gradient":[{"pos":0, "color":"#FFD0E9"}, {"pos":0.75, "color":"#FF1493"}]},
					9:{"color":"#1E90FF", "gradient":[{"pos":0, "color":"#D2E9FF"}, {"pos":0.75, "color":"#1E90FF"}]},
					10:{"color":"#FFD700", "gradient":[{"pos":0, "color":"#FFF7CC"}, {"pos":0.75, "color":"#FFD700"}]},
					11:{"color":"#8B4513", "gradient":[{"pos":0, "color":"#E8DAD0"}, {"pos":0.75, "color":"#8B4513"}]},
					12:{"color":"#FFF5EE", "gradient":[{"pos":0, "color":"#FFFDFC"}, {"pos":0.75, "color":"#FFF5EE"}]},
					13:{"color":"#00FFFF", "gradient":[{"pos":0, "color":"#CCFFFF"}, {"pos":0.75, "color":"#00FFFF"}]},
					14:{"color":"#000000", "gradient":[{"pos":0, "color":"#CCCCCC"}, {"pos":0.75, "color":"#000000"}]}
				}},
			"Group Colors",
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ProvidedFormat',
			{},
			'Provided Format',
			'A JSON description of what data the Webble provides (generated automatically from the CSV).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ProvidedFormatChanged',
			false,
			'Provided Format Changed',
			'This slot changes value (between true and false) every time the Provided Format slot changes (slot changes are not always caught otherwise).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('DataChanged',
			false,
			'Data Changed',
			'This slot changes value (between true and false) when the data in the generated slots change but the format remained the same (slot changes are not always caught otherwise).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// hack to restore status of any slots that were saved but lost their state settings
		var slotDict = $scope.getSlots();
		if(slotDict.hasOwnProperty(idSlotName)) {
			$scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
		}
		for(var slotName in slotDict) {
			if(slotName.substring(0, 8) == "DataSlot") {
				$scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
			}
		}

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			if(eventData.targetId == $scope.getInstanceId()) {
				// $log.log(preDebugMsg + "I was loaded");
				fullyLoaded = true;
			}
		}); // check when we get loaded (fully loaded)

		$scope.fixDraggable();
	};
	//===================================================================================


	//===================================================================================
	// Fix Draggable
	// This method fixes draggable issues
	//===================================================================================
	$scope.fixDraggable = function () {
		$timeout(function() {
			$scope.theView.find(".digitalDashboardDataSourceDataDrag").draggable({
				helper:"clone"
			});
		}, 1);
	};
	//===================================================================================


	//===================================================================================
	// Trim
	// This method trims the specified string from unwanted characters.
	//===================================================================================
	function trim(str) {
		return str.replace(/^\s+|\s+$/g,'').replace(/\s+/g, ' ');
	};
	//===================================================================================


	//===================================================================================
	// Parse GrADS Date
	// This method parses the GrADS Date content.
	//===================================================================================
	function parseGrADSdate(str) {
		var hour = 0, min = 0, sec = 0;
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

		var extra = ""; // this should strictly speaking not happen according to the standard, but in our example data files there was no space between the date and the time increment specification
		if(str.length > c + 7) {
			extra = str.substr(c+7);
		}

		return [year, mon, day, hour, min, sec, extra];
	};
	//===================================================================================


	//===================================================================================
	// Parse GrADS Data Files
	// This method parses the GrADS Data Files content.
	//===================================================================================
	function parseGrADSdataFiles(header, e, reader, startFidx) {
		// $log.log(preDebugMsg + "parseGrADSdataFiles");
		data = {};
		data.fieldNames = [];
		data.fieldTypes = [];
		data.columns = [];
		data.metaData = {};

		for(var v = 0; v < header.vars.length; v++) {
			data.fieldNames.push(header.vars[v].longName);
			data.fieldTypes.push("3Darray");
			data.columns.push([]);
		}

		data.fieldNames.push("Time Stamp");
		data.fieldTypes.push("date");
		data.columns.push([]);

		if((header.edef.hasOwnProperty("vals")
			&& header.edef.vals.length > 0)
			|| header.edef.inFilename) {
			data.fieldNames.push("Band");
			data.fieldTypes.push("number");
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

				reader.onload = function(e2) { binFileReaderOnLoadCallback(e2, reader, header, f.name, myidx + 1);};

				// $log.log(preDebugMsg + "Read " + f.name + " (idx " + fidx + ")");
				reader.readAsArrayBuffer(f);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Get E From File Name
	// This method tries to extract the E value from the file name.
	//===================================================================================
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
	};
	//===================================================================================


	//===================================================================================
	// Get Time From File Name
	// This method tries to extract the Time value from the file name.
	//===================================================================================
	function getTimeFromFileName(fname, header) {
		// ignore the header.dset information for now, since it seems to be broken in the example files we have.
		var c = fname.indexOf(".dat");
		var s = fname.substr(c - 14, 14);

		// assume yyyymmddhhmmss for now
		return s.substr(0, 4) + "-" + s.substr(4,2) + "-" + s.substr(6,2) + "T" + s.substr(8,2) + ":" + s.substr(10,2) + ":" + s.substr(12);
	};
	//===================================================================================


	//===================================================================================
	// Get Time From File Name as Datetime
	// This method tries to extract the Time value from the file name as a Datetime value
	//===================================================================================
	function getTimeFromFileNameAsDatetime(fname, header) {
		// ignore the header.dset information for now, since it seems to be broken in the example files we have.
		var c = fname.indexOf(".dat");
		var s = fname.substr(c - 14, 14);

		// assume yyyymmddhhmmss for now
		var ds = s.substr(0, 4) + "-" + s.substr(4,2) + "-" + s.substr(6,2) + "T" + s.substr(8,2) + ":" + s.substr(10,2) + ":" + s.substr(12);
		// $log.log(preDebugMsg + "filename: '" + fname + "', date string: '" + ds + "'");
		return new Date(ds);
	};
	//===================================================================================


	//===================================================================================
	// Parse Data Helper
	// This method helps with the parsing of the GrADS data content.
	//===================================================================================
	var parseDataHelper = function(data) {
		if(!fullyLoaded) {
			return;
		}

		// $log.log(preDebugMsg + "parseData()");
		var fieldNameString = "";
		var slotList = $scope.getSlots();
		var typeMap = {};
		var slotsToAdd = [];
		fieldNames = [];
		fieldTypes = [];
		var vectorsForSlots = [];
		var theIdList = [];
		typeMap[idSlotName] = "ID";

		if (!(idSlotName in slotList)) {
			slotsToAdd.push(idSlotName);
		}
		else {
			$scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
		}

		var resJSON = {};
		var setsJSON = {};
		var fieldsJSON = [];
		setsJSON.sets = [];
		setsJSON.sets.push({"name":"BINARYSet", "fieldList":fieldsJSON, "idSlot":idSlotName});
		resJSON["format"] = setsJSON;
		var XMLlist = [];
		var metadataAddedFlags = [];

		if($scope.displayText != "") {
			setsJSON.sets[0]["name"] = $scope.displayText;
		}

		var dataIsCorrupt = false;

		if(data) {
			if(data.hasOwnProperty("fieldNames")) {
				fieldNames = data.fieldNames;
			}
			else {
				dataIsCorrupt = true;
			}

			if(data.hasOwnProperty("fieldTypes")) {
				fieldTypes = data.fieldTypes;
			}
			else {
				dataIsCorrupt = true;
			}
		} else {
			dataIsCorrupt = true;
		}

		/////////////////////////////////////////////////////////
		///////  Setup slot stuff ///////////////////////////////
		/////////////////////////////////////////////////////////

		if (!dataIsCorrupt) {
			for (var i = 0; i < fieldNames.length; i++) {
				var slotName = fname + "Slot";
				slotName = "DataSlot" + i;

				if (!(slotName in slotList)) {
					slotsToAdd.push(slotName);
				}
				else {
					$scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
				}

				var ftype = fieldTypes[i];
				var fname = fieldNames[i];
				fieldTypes[i] = ftype;
				typeMap[fname] = ftype;
				typeMap[slotName] = ftype;
				var field = {};
				field.slot = slotName;
				field.name = fname;
				field.type = ftype;
				fieldsJSON.push(field);

				XMLlist.push(field);
				metadataAddedFlags.push(false);
			}
		}
		else {
			dataIsCorrupt = true;
		}

		/////////////////////////////////////////////////////////
		///////  Create Slots ///////////////////////////////////
		/////////////////////////////////////////////////////////

		if (!dataIsCorrupt) {
			var sIdx = 0;

			for (sIdx = 0; sIdx < slotsToAdd.length; sIdx++) {
				var s = slotsToAdd[sIdx];

				$scope.addSlot(new Slot(s,
					[],
					s,
					'Slot containing the data from field ' + s,
					$scope.theWblMetadata['templateid'],
					undefined,
					undefined
				));
				$scope.getSlot(s).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
			}

			vectorsForSlots = data.columns;
			if(vectorsForSlots.length > 0) {
				noofRows = vectorsForSlots[0].length;

				for(var i = 0; i < vectorsForSlots[0].length; i++) {
					theIdList.push(i);
				}
			}
			else {
				dataIsCorrupt = true;
			}

			if (!dataIsCorrupt) {
				for (var i = 0; i < fieldTypes.length; i++) {
					var fname = fieldNames[i];
					var slotName = fname + "Slot";
					slotName = "DataSlot" + i;

					// $log.log(preDebugMsg + "set " + slotName + " to " + JSON.stringify(vectorsForSlots[i]));
					$scope.set(slotName, vectorsForSlots[i]);
				}

				internalIdSlotSet = true;
				oldIdSlotData = theIdList;
				$scope.set(idSlotName, theIdList);
				internalIdSlotSet = false;
			}
		}

		if (dataIsCorrupt) {
			//$log.log(preDebugMsg + "Could not parse data correctly.");
			setsJSON.sets = [];
			$scope.set("ProvidedFormat", resJSON);
			$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));

			// $scope.displayText = dispText + ": " + fileName + " corrupt";
			$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
		}
		else {
			var ls = [];
			var sourceName = $scope.gimme("PluginName");
			var dataSetName = sourceName;
			var dataSetIdx = 0;
			var fieldName = "";

			for(var f = 0 ; f < fieldNames.length; f++) {
				fieldName = fieldNames[f];
				var info = {"sourceName":sourceName, "dataSetName":dataSetName, "dataSetIdx":dataSetIdx, "fieldName":fieldName};

				ls.push({"name":fieldName + " (" + fieldTypes[f] + ")", "id":JSON.stringify(info)});
			}
			$scope.dragNdropData.fields = ls;

			// $log.log(preDebugMsg + "Finished parsing data.");
			var oldJSON = {};
			var newJSON = resJSON;

			try {
				oldJSON = $scope.gimme("ProvidedFormat");
				if(typeof oldJSON === 'string') {
					oldJSON = JSON.parse(oldJSON);
				}
			} catch (Exception) {
				oldJSON = {};
			}

			if (JSON.stringify(oldJSON) != JSON.stringify(newJSON)) {
				$scope.set("ProvidedFormat", newJSON);
				$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
			}
			else {
				$scope.set("DataChanged", !$scope.gimme("DataChanged"));
			}

			// $scope.displayText = dispText + ": " + fileName;
		}

		updateView();

		$timeout(function() {
			$scope.fixDraggable();
			},1);
	};
	//===================================================================================


	//===================================================================================
	// Update View
	// This method updates view to mirror the current loaded data and webble settings
	//===================================================================================
	function updateView() {
		// $log.log(preDebugMsg + "updateView()");
		$scope.dragNdropData.file = fileName;
		$scope.dragNdropData.rows = noofRows;
		$scope.dragNdropData.cols = fieldTypes.length;

		var colors = $scope.gimme("GroupColors");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false
			if(colors.skin.hasOwnProperty("gradient")) {
				// Do Nothing
			}
			if(!drewBack && colors.skin.hasOwnProperty("color")) {
				$scope.dataListStyle['background-color'] = colors.skin.color;
				drewBack = true;
			}

			if(colors.skin.hasOwnProperty("border")) {
				$scope.dataListStyle['border'] = '2px solid ' + colors.skin.border;
			}

			if(colors.skin.hasOwnProperty("text")) {
				$scope.dataListStyle['color'] = colors.skin.text;
			} else {
				$scope.dataListStyle['color'] = "black";
			}
		}

		var newStyle = {};
		for(var s in $scope.dataListStyle) {
			newStyle[s] = $scope.dataListStyle[s];
		}

		newStyle.fontSize = fontSize;
		$scope.dataListStyle = newStyle;
	};
	//===================================================================================


	//===================================================================================
	// Char Count
	// This method counts the number of times a specified characters appears in a
	// specified string.
	//===================================================================================
	function charCount(c, str) {
		var res = 0;
		var idx = str.indexOf(c);

		while(idx >= 0) {
			res++;
			idx = str.indexOf(c, idx + 1);
		}

		return res;
	};
	//===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
		if(itemName == $scope.customMenu[0].itemId){  //clearData
			fileName = "";
			data = {};
			fieldNames = [];
			fieldTypes = [];
			noofRows = 0;
			fileType = "none";
			$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
		}
    };
    //===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
