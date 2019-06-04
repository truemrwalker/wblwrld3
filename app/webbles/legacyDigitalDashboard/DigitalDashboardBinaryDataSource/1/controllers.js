//======================================================================================================================
// View for DigitalDashboard for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('binaryDataWebbleCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        DrawingArea: ['width', 'height']
    };

	$scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data'}];

    var dispText = "BINARY Data Source";
    $scope.displayText = dispText;
	var preDebugMsg = "DigitalDashboard BINARY source: ";
	var fullyLoaded = false;

	var idSlotName = "TheIdSlot";
    var internalIdSlotSet = false;
    var oldIdSlotData = [];
    var fileName = "";

    var fieldNames = [];
    var fieldTypes = [];
    var noofRows = 0;

    var fontSize = 11;
    var textColor = "black";

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;

    var fileType = "none";
	var rockstarFileContents = [];
	var densityFileContents = [];

	$scope.dragNdropData = [{"name":"No Data", "id":-1}];

    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Files Added
	// This event handler handles what to do after files have been dropped and added.
	//===================================================================================
	$scope.onFilesAdded = function(files) {
		fileType = "none";
		rockstarFileContents = [];
		densityFileContents = [];

		if(files !== undefined && files.length > 0) {
			for(var i = 0; i < files.length; i++) {
				var f = files[i];
				var reader = new FileReader();

				// Closure to capture the file information.
				reader.onload = function(e) {
					if(checkIfRockstar(e.target.result)) {
						if(fileType != "none" && fileType != "rockstar") {
							//$log.log(preDebugMsg + "WARNING: multiple files with inconsistent types, will not load all files (last file wins).");
						}
						//$log.log(preDebugMsg + "Found Rockstar type file.");
						fileType = "rockstar";

						var contents = parseRockstarFormat(e.target.result);
						rockstarFileContents.push(contents);
						$scope.set("Data", convertFromRockstar(rockstarFileContents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
					}
					else {
						if(fileType != "none" && fileType != "density") {
							//$log.log(preDebugMsg + "WARNING: multiple files with inconsistent types, will not load all files (last file wins).");
						}
						//$log.log(preDebugMsg + "Found file with no type marking, assuming density data file.");
						fileType = "density";

						var contents = parseDensityFormat(e.target.result);
						densityFileContents.push(contents);
						contents = [];
						$scope.set("Data", convertFromDensity(densityFileContents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
						densityFileContents = [];
					}
				};

				// Read in the image file as an Array Buffer.
				fileName = f.name;
				reader.readAsArrayBuffer(f);
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// My Slot Change
	// This event handler reacts to slot changes within this Webble.
	//===================================================================================
	function mySlotChange(eventData) {
		////$log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// //$log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);

		if(eventData.slotName == idSlotName) {
			// this is not allowed unless it is a set from the parseData() function
			if(!internalIdSlotSet) {
				$scope.set(idSlotName, oldIdSlotData);
			}
		}
		else {
			switch(eventData.slotName) {
				case "Data":
					parseData();
					break;
				case "PluginName":
					var newVal = eventData.slotValue;
					$scope.displayText = newVal;
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
			"BINARY Data Source",
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

		$scope.addSlot(new Slot('Data',
			[],
			'Data',
			'The data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot("Data").setDisabledSetting(Enum.SlotDisablingState.PropertyEditingAndValue);

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

		// check when we get loaded (fully loaded)
		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			if(eventData.targetId == $scope.getInstanceId()) {
				// //$log.log(preDebugMsg + "I was loaded");
				fullyLoaded = true;
				parseData();
			}
		});
	};
	//===================================================================================


	//===================================================================================
	// Check if Rockstar
	// This method checks whether the file comming in is of Rockstar format or not.
	//===================================================================================
	function checkIfRockstar(fileContents) {
		var ROCKSTAR_MAGICstr = "fadedacec0c0d0d0";
		var tmpUInt = new Uint32Array(fileContents);
		var concat_magic = tmpUInt[1].toString(16) + tmpUInt[0].toString(16);

		return ROCKSTAR_MAGICstr == concat_magic;
	};
	//===================================================================================


	//===================================================================================
	// Convert from Rockstar
	// This method converts the file content from Rockstar format to an internal more
	// optimal format.
	//===================================================================================
	function convertFromRockstar(rockstarFileContents) {
		var data = {};
		data.fieldNames = ["id", "pos 0", "pos 1", "pos 2", "pos 3", "pos 4", "pos 5", "corevel 0", "corevel 1", "corevel 2", "bulkvel 0", "bulkvel 1", "bulkvel 2",  "m", "r", "child_r", "vmax_r", "mgrav", "vmax", "rvmax", "rs", "klypin_rs", "vrms", "J 0", "J 1", "J 2", "energy", "spin", "alt_m 0", "alt_m 1", "alt_m 2", "alt_m 3", "Xoff", "Voff", "b_to_a", "c_to_a", "A 0", "A 1", "A 2", "bullock_spin", "kin_to_pot", "m_pe_b", "m_pe_d", "num_p", "num_child_particles", "p_start", "desc", "flags", "n_core", "min_pos_err", "min_vel_err", "min_bulkvel_err"];
		data.fieldTypes = [];
		data.columns = [];
		for(var i = 0; i < data.fieldNames.length; i++) {

			if(["id", "p_start", "desc", "flags"].indexOf(data.fieldNames[i]) >= 0) {
				data.fieldTypes.push("string"); // use strings for the 64 bit integers for now, javascript cannot handle them well
			} else if(["num_p", "num_child_particles", "n_core"].indexOf(data.fieldNames[i]) >= 0) {
				data.fieldTypes.push("number"); // assume these 64 bit integers can be rounded to javascript numbers and the loss of precision is acceptable
			} else {
				data.fieldTypes.push("number");
			}

			data.columns.push([]);
		}

		for(var file = 0; file < rockstarFileContents.length; file++) {
			for(var halo = 0; halo < rockstarFileContents[file].halos.length; halo++) {
				for(var i = 0; i < data.fieldNames.length; i++) {
					if(["num_p", "num_child_particles", "n_core"].indexOf(data.fieldNames[i]) >= 0) {
						data.columns[i].push(parseInt(rockstarFileContents[file].halos[halo][data.fieldNames[i]].hi.toString(16) + rockstarFileContents[file].halos[halo][data.fieldNames[i]].lo.toString(16), 16)); // convert to javascript number, assume precision loss is acceptable
					} else if(data.fieldTypes[i] == "number") {
						var idx = data.fieldNames[i].indexOf(" ");
						if(idx > 0) {
							var fn = data.fieldNames[i].substring(0, idx);
							var j = parseInt(data.fieldNames[i].substring(idx + 1));

							data.columns[i].push(rockstarFileContents[file].halos[halo][fn][j]);
						} else {
							data.columns[i].push(rockstarFileContents[file].halos[halo][data.fieldNames[i]]);
						}
					} else if(data.fieldNames[i] == "id") {
						data.columns[i].push( file.toString(16) + " " + rockstarFileContents[file].halos[halo][data.fieldNames[i]].hi.toString(16) + rockstarFileContents[file].halos[halo][data.fieldNames[i]].lo.toString(16) );
					} else {
						data.columns[i].push( rockstarFileContents[file].halos[halo][data.fieldNames[i]].hi.toString(16) + rockstarFileContents[file].halos[halo][data.fieldNames[i]].lo.toString(16) );
					}
				}
			}
		}

		return data;
	};
	//===================================================================================


	//===================================================================================
	// Convert From Density
	// This method converts the file content from density format to an internal more
	// optimal format.
	//===================================================================================
	function convertFromDensity(densityFileContents) {
		var data = {};
		data.fieldNames = ["Dimensions", "3D Array"];
		data.fieldTypes = ["number", "3Darray"];
		data.columns = [[], []];
		var dim = 256;

		for(var file = 0; file < densityFileContents.length; file++) {
			data.columns[0].push(dim);
			data.columns[1].push(densityFileContents[file]);
		}

		return data;
	};
	//===================================================================================


	//===================================================================================
	// Parse Rockstar Format
	// This method parses the Rockstar formatted data into JSON.
	//===================================================================================
	function parseRockstarFormat(binaryArray) {
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

		if(concat_magic != ROCKSTAR_MAGICstr) {
			//$log.log(preDebugMsg + "This does not look like a Rockstar file.");
			//$log.log(preDebugMsg + "ROCKSTAR_MAGIC   =" + ROCKSTAR_MAGIC.toString(16));
			//$log.log(preDebugMsg + "ROCKSTAR_MAGICstr=" + ROCKSTAR_MAGICstr);
			//$log.log(preDebugMsg + "concat_magic     =" + concat_magic);
			//$log.log(preDebugMsg + "hi=" + header.magic.hi.toString(16) + ", lo=" + header.magic.lo.toString(16));
		} else {
			//$log.log(preDebugMsg + "This file seems to be a Rockstar file.");
			//$log.log(preDebugMsg + "ROCKSTAR_MAGIC   =" + ROCKSTAR_MAGIC.toString(16));
			//$log.log(preDebugMsg + "ROCKSTAR_MAGICstr=" + ROCKSTAR_MAGICstr);
			//$log.log(preDebugMsg + "concat_magic     =" + concat_magic);
			//$log.log(preDebugMsg + "hi=" + header.magic.hi.toString(16) + ", lo=" + header.magic.lo.toString(16));
		}

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
		//$log.log(preDebugMsg + "num_halos: " + header.num_halos.hi.toString(16) + " " + header.num_halos.lo.toString(16));
		if(header.num_halos.hi > 0) {
			//$log.log(preDebugMsg + "WARNING: Too many halos, will only read the first " + header.nu_halos.lo + " halos.");
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
	};
	//===================================================================================


	//===================================================================================
	// Parse Density Format Format
	// This method parses the Density formatted data into JSON.
	//===================================================================================
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
	};
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the Data.
	//===================================================================================
	var parseData = function() {
		if(!fullyLoaded) {
			return;
		}

		//$log.log(preDebugMsg + "parseData()");
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
		} else {
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
		var data = $scope.gimme("Data");
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
		}
		else {
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

					// //$log.log(preDebugMsg + "set " + slotName + " to " + JSON.stringify(vectorsForSlots[i]));
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
			$scope.displayText = dispText + ": " + fileName + " corrupt";
			$scope.dragNdropData = [{"name":"No Data", "id":-1}];
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
			$scope.dragNdropData = ls;

			//$log.log(preDebugMsg + "Finished parsing data.");
			var oldJSON = {};
			var newJSON = resJSON;

			try {
				oldJSON = $scope.gimme("ProvidedFormat");
				if(typeof oldJSON === 'string') {
					oldJSON = JSON.parse(oldJSON);
				}
			}
			catch (Exception) {
				oldJSON = {};
			}

			if (JSON.stringify(oldJSON) != JSON.stringify(newJSON)) {
				$scope.set("ProvidedFormat", newJSON);
				$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
			}
			else {
				$scope.set("DataChanged", !$scope.gimme("DataChanged"));
			}

			$scope.displayText = dispText + ": " + fileName;
		}

		updateView();
	};
	//===================================================================================


	//===================================================================================
	// Update View
	// This method updates the view to reflect current data and status.
	//===================================================================================
	function updateView() {
		var rw = $scope.gimme("DrawingArea:width");
		if(typeof rw === 'string') {
			rw = parseFloat(rw);
		}
		if(rw < 1) {
			rw = 1;
		}

		var rh = $scope.gimme("DrawingArea:height");
		if(typeof rh === 'string') {
			rh = parseFloat(rh);
		}
		if(rh < 1) {
			rh = 1;
		}

		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			} else {
				//$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		myCanvas.width = rw;
		myCanvas.height = rh;

		var text = buildInfoText();
		checkNeededSize(text);
		drawBackground();
		drawDataInfo(text);
		$scope.displayText = dispText + ": " + (fileName != "" ? fileName : "None");
	};
	//===================================================================================


	//===================================================================================
	// Get Text Width
	// This method returns the width of a specified text and font.
	//===================================================================================
	function getTextWidth(text, font) {
		if(ctx !== null && ctx !== undefined) {
			ctx.font = font;
			var metrics = ctx.measureText(text);
			return metrics.width;
		}
		return 0;
	};
	//===================================================================================


	//===================================================================================
	// Check Needed Size
	// This method checks what size is needed for the drawing surface.
	//===================================================================================
	function checkNeededSize(text) {
		var w = 0;
		for(var i = 0; i < text.length; i++) {
			w = Math.max(w, getTextWidth(text[i], fontSize + "px Arial"));
		}
		var h = fontSize * (fieldNames.length + 3);

		var currentW = $scope.gimme("DrawingArea:width");
		if(typeof currentW === 'string') {
			currentW = currentW.replace("px", "");
			currentW = parseFloat(currentW);
		}

		var currentH = $scope.gimme("DrawingArea:height");
		if(typeof currentH === 'string') {
			currentH = currentH.replace("px", "");
			currentH = parseFloat(currentH);
		}

		if(w > currentW - 10 || w < currentW - 10 - 100) {
			$scope.set("DrawingArea:width", w + 10);
		}
		if(h > currentH - 10 || w < h < currentH - 10 - 30) {
			$scope.set("DrawingArea:height", h + 10);
		}
	};
	//===================================================================================


	//===================================================================================
	// Build Info text
	// This method builds and create the info text describing the data.
	//===================================================================================
	function buildInfoText() {
		var text = [];

		if(noofRows <= 0) {
			text = ["No data"];
		}
		else {
			if(fileName != "") {
				text = ["File: " + fileName];
			}

			text.push(noofRows + " rows of data.");
			text.push(fieldTypes.length + " columns.");

			for(var i = 0; i < fieldTypes.length; i++) {
				text.push(fieldNames[i] + " (" + fieldTypes[i] + ")");
			}
		}
		return text;
	};
	//===================================================================================


	//===================================================================================
	// Draw Data Info
	// This method draws the data info text on the canvas surface.
	//===================================================================================
	function drawDataInfo(text) {
		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			}
			else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(ctx === null) {
			ctx = myCanvas.getContext("2d");
		}

		var W = myCanvas.width;
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		ctx.fillStyle = textColor;
		ctx.font = fontSize + "px Arial";

		for(var i = 0; i < text.length; i++) {
			ctx.fillText(text[i], 5, 5 + fontSize + i*fontSize);
		}
	};
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background of the canvas surface.
	//===================================================================================
	function drawBackground() {
		if(myCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theCanvas');
			if(myCanvasElement.length > 0) {
				myCanvas = myCanvasElement[0];
			} else {
				//$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(ctx === null) {
			ctx = myCanvas.getContext("2d");
		}

		var W = myCanvas.width;
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		var H = myCanvas.height;
		if(typeof H === 'string') {
			H = parseFloat(H);
		}
		if(H < 1) {
			H = 1;
		}

		// //$log.log(preDebugMsg + "Clear the canvas");
		ctx.clearRect(0,0, W,H);

		var colors = $scope.gimme("GroupColors");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		if(colors.hasOwnProperty("skin")) {
			var drewBack = false
			if(colors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
				var OK = true;
				var grd = ctx.createLinearGradient(0,0,W,H);
				for(var i = 0; i < colors.skin.gradient.length; i++) {
					var cc = colors.skin.gradient[i];
					if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
						grd.addColorStop(cc.pos, cc.color);
					} else {
						OK = false;
					}
				}
				if(OK) {
					ctx.fillStyle = grd;
					ctx.fillRect(0,0,W,H);
					drewBack = true;
				}
			}
			if(!drewBack && colors.skin.hasOwnProperty("color")) {
				ctx.fillStyle = colors.skin.color;
				ctx.fillRect(0,0,W,H);
				drewBack = true;
			}

			if(colors.skin.hasOwnProperty("border")) {
				ctx.fillStyle = colors.skin.border;

				ctx.fillRect(0,0, W,1);
				ctx.fillRect(0,H-1, W,H);
				ctx.fillRect(0,0, 1,H);
				ctx.fillRect(W-1,0, W,H);
			}

			if(colors.skin.hasOwnProperty("text")) {
				textColor = colors.skin.text;
			} else {
				textColor = "black";
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Webble template Menu Item Activity Reaction
	// If this template has its own custom menu items that needs to be taken care of,
	// then it is here where that should be executed.
	// If this function is empty and unused it can safely be deleted.
	//===================================================================================
	$scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
		if(itemName == $scope.customMenu[0].itemId){  //clearData
			fileType = "none";
			rockstarFileContents = [];
			densityFileContents = [];
			fileName = "";
			fieldNames = [];
			fieldTypes = [];
			noofRows = 0;
			$scope.dragNdropData = [{"name":"No Data", "id":-1}];
			$scope.set("Data", "");
		}
	};
	//===================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================


