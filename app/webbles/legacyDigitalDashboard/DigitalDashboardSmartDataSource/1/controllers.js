//======================================================================================================================
// Controllers for Digital Dashboard Smart Data Source for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('smartDataWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    var dispText = "SMART Data Source";
    $scope.displayText = "SMART Data Source";

    // $scope.tellParent = {}; // the wblEventInfo.slotChanged does not seem to work properly, so we make our own version instead...

    var myInstanceId = -1;

    var idSlotName = "TheIdSlot";
    var internalIdSlotSet = false;
    var oldIdSlotData = [];

    var fullyLoaded = false;

    var fileName = "";

    var noofRows = 0;

    var fontSize = 11;
    var textColor = "black";

    var rockstarFileContents = [];
    var densityFileContents = [];

    var fieldNames = [];
    var fieldTypes = [];

    //=== EVENT HANDLERS ================================================================

    $scope.pluginName = "SMART Data Source";
    $scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
    $scope.dataListStyle = {'padding':'10px', 'font-size':fontSize, 'font-family':'arial', 'background-color':'lightgrey', 'color':textColor, 'border':'2px solid #4400aa'};

    $scope.fixDraggable = function () {
        $timeout(function()
		 {	
		     // $log.log("fixDraggable waited for timeout, actually runs now.");
		     // $(".digitalDashboardSmartDataSourceDataDrag").draggable({  
		     $scope.theView.find(".digitalDashboardSmartDataSourceDataDrag").draggable({  
			 helper:"clone"
		     });
		 }, 1);
    };

    // $scope.fixDroppable = function () {
    // 	$log.log("fixDroppable runs now");

    // 	$('.dataDrop').droppable({ 
    // 	    drop: function(e, ui){ 
    // 		console.log("dropped item is: '" + ui.draggable.attr('id') + "'");
    // 	    }
    // 	});
    // };


    var fileReaderOnLoadCallback = function(e, reader) {

	var dataFileType = reader.dataFileType;
	var contents = e.target.result;

	fileReaderOnLoadCallbackHelper(dataFileType, contents, reader);
    }
    
    function fileReaderOnLoadCallbackHelper(dataFileType, contents, reader) {

	if(dataFileType == "zip") {
	    debugLog("we seem to have a zip file");

	    // use a BlobReader to read the zip from a Blob object
	    var blob = new Blob([contents]);
	    
	    var myPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

	    zip.workerScripts = {
		deflater: [myPath + '/z-worker.js', myPath + '/pako.js', myPath + '/pako_codecs.js'],
		inflater: [myPath + '/z-worker.js', myPath + '/pako.js', myPath + '/pako_codecs.js']
	    };

	    // zip.workerScripts = {
	    // 	// deflater: [myPath + '/z-worker.js', myPath + '/pako_deflate.min.js', myPath + '/pako_codecs.js'],
	    // 	deflater: [myPath + '/z-worker.js', myPath + '/deflate.js'],
	    // 	inflater: [myPath + '/z-worker.js', myPath + '/inflate.js']
	    // };





	    ///////////////////////////////////

	    // use a BlobReader to read the zip from a Blob object
	    zip.createReader(new zip.BlobReader(blob), function(reader) {

	    	// get all entries from the zip
	    	reader.getEntries(function(entries) {
	    	    for(var ent = 0; ent < entries.length; ent++) {

	    		// get first entry content as text
			var fn = entries[ent].filename;

			if(fn.indexOf(".csv") >= 0
			   || fn.indexOf(".txt") >= 0
			   || fn.indexOf(".json") >= 0
			  ) {
			    debugLog("this entry is probably text");

	    		    entries[ent].getData(new zip.TextWriter(), function(text) {
	    			// text contains the entry data as a String
	    			// console.log(text);

				fileReaderOnLoadCallbackHelper("text", text, reader);

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

			if(fn.indexOf(".bin") >= 0
			   || fn.indexOf(".dat") >= 0
			  ) {
			    debugLog("this entry is probably binary");

	    		    entries[ent].getData(new zip.BlobWriter(), function(blob) {
	    			// text contains the entry data as a String
				
				var breader = new FileReader();
				breader.onload = function(e) { fileReaderOnLoadCallback(e, breader);};
				breader.theFileWhenRetrying = reader.theFileWhenRetrying;
				breader.dataFileType = "binary";

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
	    /////////////////////////////////////




	//     zip.createReader(new zip.BlobReader(blob), function(zreader) {
	// 	// get all entries from the zip
	// 	zreader.getEntries(function(entries) {

	// 	    debugLog("Iterate over zip file contents");

	// 	    if (entries.length) {

	// 		for(var ent = 0; ent < entries.length; ent++) {
	// 		    var fn = entries[ent].filename;

	// 		    debugLog("Zip file content no " + ent + " " + fn);


	// 		    entries[0].getData(new zip.TextWriter(), function(text) {
	// 			// text contains the entry data as a String
	// 			console.log("example code");
	// 			console.log(text);

	// 			// close the zip reader
	// 			reader.close(function() {
	// 			    // onclose callback
	// 			});

	// 		    }, function(current, total) {
	// 			// onprogress callback
	// 		    });


	// 		    if(fn.indexOf(".csv") >= 0
	// 		       || fn.indexOf(".txt") >= 0
	// 		       || fn.indexOf(".json") >= 0
	// 		      ) {
	// 			debugLog("this entry is probably text");

	// 			entries[ent].getData(new zip.TextWriter(), function(text) {
	// 			    // text contains the entry data as a String

	// 			    debugLog("unpacked this text zip file entry");

	// 			    contents = text;
	// 			    dataFileType = "text";

	// 			    fileReaderOnLoadCallbackHelper(dataFileType, contents, reader);
				    
	// 			}, function(current, total) {
	// 			    // onprogress callback
	// 			});
				
	// 		    } else if(fn.indexOf(".bin") >= 0
	// 			      || fn.indexOf(".dat") >= 0) {
	// 			debugLog("this entry is probably binary");
				
	// 			entries[ent].getData(new zip.BlobWriter(), function(binaryBlob) {
	// 			    debugLog("unpacked this binary zip file entry");

	// 			    contents = binaryBlob;
	// 			    dataFileType = "binary";
				    
	// 			    fileReaderOnLoadCallbackHelper(dataFileType, contents, reader);

	// 			}, function(current, total) {
	// 			    // onprogress callback
	// 			});


	// 		    } else {
	// 			debugLog("this entry has unknown file type");
				
	// 		    }
	// 		}
	// 	    }
	// 	    // close the zip reader
	// 	    zreader.close(function() {
	// 		// onclose callback
	// 	    });
	// 	});
	//     }, function(error) {
	// 	// onerror callback
	//     });


	} // if("zip")

	if(dataFileType == "gz") {
	    var compressedContents = new Uint8Array(contents);
	    
	    try {
		debugLog("Try to decompress gzip file");
		
		var unzipResult = pako.inflate(compressedContents);
		
		debugLog("We have contents of gzip file");

		var fn = reader.zippedfn;

		if(fn.indexOf(".csv") >= 0
		   || fn.indexOf(".txt") >= 0
		   || fn.indexOf(".json") >= 0
		  ) {

		    var bb = new Blob([unzipResult.buffer]);

		    reader.dataFileType = "text";
		    reader.readAsText(bb);
		    return;

		} else if(fn.indexOf(".bin") >= 0
			  || fn.indexOf(".dat") >= 0) {
		    contents = unzipResult.buffer;
		    dataFileType = "binary";
		} else {
		    debugLog("gunzip worked, but the resulting contents are of an unknown type; treating as text.");
		    
		    var bb = new Blob(unzipResult);

		    reader.dataFileType = "text";
		    reader.readAsText(bb);
		    return;
		}
	    } catch (err) {
		debugLog("error when decompressing gzip file");
		debugLog(err);
	    }
	}

	if(dataFileType == "json") {
	    $scope.set("Data", convertFromJSON(contents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
	} 

	if(dataFileType == "text") {
	    
	    var cleanContents = contents.replace(/[\r\n]+/g, "\n");
	    $scope.set("Data", convertFromTextData(cleanContents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
	}

	if(dataFileType == "binary") {
	    if(checkIfRockstar(contents)) {
		if(fileType != "none" && fileType != "rockstar") {
		    debugLog("WARNING: multiple files with inconsistent types, will not load all files (last file wins).");
		}
		debugLog("Found Rockstar type file.");
		fileType = "rockstar";

		var rockstarContents = parseRockstarFormat(contents);
		rockstarFileContents.push(rockstarContents);
		
		$scope.set("Data", convertFromRockstar(rockstarFileContents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
	    } else if(checkIfDensity(contents)) {
		if(fileType != "none" && fileType != "density") {
		    debugLog("WARNING: multiple files with inconsistent types, will not load all files (last file wins).");
		}
		debugLog("Found file that looks like density data file.");
		fileType = "density";

		var densityContents = parseDensityFormat(contents);
		densityFileContents.push(densityContents);
		contents = [];
		
		$scope.set("Data", convertFromDensity(densityFileContents)); // later, fix this so we do not have to store the whole file in a slot, discard after parsing
		densityFileContents = [];
	    } else {
		debugLog("Found file with no type marking, trying to parse as text.");
		
		reader.dataFileType = "text";
		reader.readAsText(reader.theFileWhenRetrying);
	    }
	}
    };
    

    $scope.onFilesAdded = function(files) {

	fileType = "none"; // "none", "rockstar", "density", "csv", "json"
	rockstarFileContents = [];
	densityFileContents = [];

        if(files !== undefined && files.length > 0) {
	    for(var i = 0; i < files.length; i++) {
		var f = files[i];
		
		var reader = new FileReader();
		
		// Closure to capture the file information.
		reader.onload = function(e) { fileReaderOnLoadCallback(e, reader);};

		fileName = f.name;
		var fn = f.name.toLowerCase();

		if(fn.indexOf(".gz") >= 0) {  // add all other supported file types too

		    // assume compressed data
		    reader.theFileWhenRetrying = f;
		    reader.dataFileType = "gz";
		    reader.readAsArrayBuffer(f);
		    reader.zippedfn = fn;

		} else if(fn.indexOf(".zip") >= 0) {

		    // assume compressed data
		    reader.theFileWhenRetrying = f;
		    reader.dataFileType = "zip";
		    reader.readAsArrayBuffer(f);

		} else if(fn.indexOf(".csv") >= 0
			  || fn.indexOf(".txt") >= 0
			  || fn.indexOf(".json") >= 0
			 ) {
		    // assume ascii data
		    reader.dataFileType = "text";
		    if(fn.indexOf(".json") >= 0) {
			reader.dataFileType = "json";
		    }
		    reader.readAsText(f);
		} else if(fn.indexOf(".bin") >= 0) {
		    // assume binary data
		    reader.theFileWhenRetrying = f;
		    reader.dataFileType = "binary";
		    reader.readAsArrayBuffer(f);
		} else if(fn.indexOf(".dat") >= 0) {
		    // assume binary data ? be prepared to reevaluate to text data
		    reader.theFileWhenRetrying = f;
		    reader.dataFileType = "binary";
		    reader.readAsArrayBuffer(f);
		} else {
		    debugLog("Cannot guess file type from file name, assuming text data.");
		    // assume ascii data
		    reader.dataFileType = "text";
		    reader.readAsText(f);
		}

	    }
	}
    };

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard SMART source: " + message);
	}
    };


    function checkIfDensity(fileContents) {
	try {

	    var tmpFloat = new Float32Array(fileContents);
	    
	    var dim = 256;
	    if(tmpFloat.length != dim*dim*dim
	      && 16908288 != tmpFloat.length) { // Todo: Why is the file size this size??
		return false;
	    } else {
		return true;
	    }
	} catch(e) {
	    return false;
	}
    }

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

    function convertFromRockstar(rockstarFileContents) {
	var data = {};
	data.fieldNames = ["id", "pos 0", "pos 1", "pos 2", "pos 3", "pos 4", "pos 5", "corevel 0", "corevel 1", "corevel 2", "bulkvel 0", "bulkvel 1", "bulkvel 2",  "m", "r", "child_r", "vmax_r", "mgrav", "vmax", "rvmax", "rs", "klypin_rs", "vrms", "J 0", "J 1", "J 2", "energy", "spin", "alt_m 0", "alt_m 1", "alt_m 2", "alt_m 3", "Xoff", "Voff", "b_to_a", "c_to_a", "A 0", "A 1", "A 2", "bullock_spin", "kin_to_pot", "m_pe_b", "m_pe_d", "num_p", "num_child_particles", "p_start", "desc", "flags", "n_core", "min_pos_err", "min_vel_err", "min_bulkvel_err"];
	data.fieldTypes = [];
	data.columns = [];
	data.metaData = {};

	for(var i = 0; i < data.fieldNames.length; i++) {
	    // if(["id", "num_p", "num_child_particles", "p_start", "desc", "flags", "n_core"].indexOf(data.fieldNames[i]) >= 0) {
	    // 	data.fieldTypes.push("string"); // use strings for the 64 bit integers for now, javascript cannot handle them well
	    // } else {
	    // 	data.fieldTypes.push("number");
	    // }

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
    }

    function parseRockstarFormat(binaryArray) {
	
	// Components.utils.import("resource://gre/modules/ctypes.jsm");

	// first, read the header. 

	var ROCKSTAR_MAGIC = 0xfadedacec0c0d0d0;
	var ROCKSTAR_MAGICstr = "fadedacec0c0d0d0";
	var BINARY_HEADER_SIZE = 256;
	var VERSION_MAX_SIZE = 12;

	header = {};

	var hArray = binaryArray.slice(0, BINARY_HEADER_SIZE);

	// var tmpULong = new Uint64Array(hArray);
	// var tmpLong = new Int64Array(hArray);

	var tmpFloat = new Float32Array(hArray);
	var tmpInt = new Int32Array(hArray);
	var tmpUInt = new Uint32Array(hArray);

	// header.magic = tmpULong[0];
	header.magic = {"lo":tmpUInt[0], "hi":tmpUInt[1]};
	var concat_magic = header.magic.hi.toString(16) + header.magic.lo.toString(16);

	// if(concat_magic != ROCKSTAR_MAGIC.toString(16)) {
	if(concat_magic != ROCKSTAR_MAGICstr) {
	    debugLog("This does not look like a Rockstar file.");
	    debugLog("ROCKSTAR_MAGIC   =" + ROCKSTAR_MAGIC.toString(16));
	    debugLog("ROCKSTAR_MAGICstr=" + ROCKSTAR_MAGICstr);
	    debugLog("concat_magic     =" + concat_magic);
	    debugLog("hi=" + header.magic.hi.toString(16) + ", lo=" + header.magic.lo.toString(16));
	} else {
	    debugLog("This file seems to be a Rockstar file.");
	    debugLog("ROCKSTAR_MAGIC   =" + ROCKSTAR_MAGIC.toString(16));
	    debugLog("ROCKSTAR_MAGICstr=" + ROCKSTAR_MAGICstr);
	    debugLog("concat_magic     =" + concat_magic);
	    debugLog("hi=" + header.magic.hi.toString(16) + ", lo=" + header.magic.lo.toString(16));
	}

	
	// header.snap = tmpLong[1];
	// header.chunk = tmpLong[2];
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

        // header.num_halos = tmpLong[8];
	// header.num_particles = tmpLong[9];
        header.num_halos = {"lo":tmpUInt[16], "hi":tmpInt[17]};
	if(header.num_halos.hi > 0) {
	    debugLog("WARNING: Too many halos, will only read the first " + header.nu_halos.lo + " halos.");
	    debugLog("num_halos: " + header.num_halos.hi.toString(16) + " " + header.num_halos.lo.toString(16));
	}
        header.num_particles = {"lo":tmpUInt[18], "hi":tmpInt[19]};

        header.box_size = tmpFloat[20];
	header.particle_mass = tmpFloat[21];

	// header.particle_type = tmpLong[11];
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
	
	// var tmpLong = new Int64Array(dArray);
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



	// -------------------
	// this part eats up all the memory, and we do not use the IDs anyway, so skip this
	// -------------------
	// // var particles = [];
	// // for(var i = 0; i < header.num_particles.lo; i++) {
	// //     var part = {"lo":tmpUInt[cur32idx], "hi":tmpInt[cur32idx + 1]};
	// //     cur32idx += 2;
	// //     particles.push(part);
	// // }

	return {"halos":halos, "header":header};
    }




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


    function convertFromDensity(densityFileContents) {
	var data = {};
	data.fieldNames = ["Dimensions", "3D Array"];
	data.fieldTypes = ["number", "3Darray"];
	data.columns = [[], []];
	data.metaData = {};

	var dim = 256;

	for(var file = 0; file < densityFileContents.length; file++) {
	    data.columns[0].push(dim);
	    data.columns[1].push(densityFileContents[file]);
	}
	
	return data;
    }


    var parseData = function() {
    	// if($scope.theInitiationState_ >= Enum.bitFlags_InitStates.InitFinished) { 
    	if(!fullyLoaded) {
    	    return;
    	}
	
    	debugLog("parseData()");

        var slotList = $scope.getSlots();
        var typeMap = {};

        var slotsToAdd = [];

        var vectorsForSlots = [];
        var theIdList = [];

        typeMap[idSlotName] = "ID";

        if (!(idSlotName in slotList))
        {
    	    slotsToAdd.push(idSlotName);
        } else {
    	    $scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
    	}

    	var resJSON = {};
    	var setsJSON = {};
        var fieldsJSON = [];
    	setsJSON.sets = [];
    	setsJSON.sets.push({"name":"SMART", "fieldList":fieldsJSON, "idSlot":idSlotName});
    	resJSON["format"] = setsJSON;
	
        var XMLlist = [];
        var metadataAddedFlags = [];

        if($scope.displayText != "")
        {
    	    setsJSON.sets[0]["name"] = $scope.displayText;
        }

        var dataIsCorrupt = false;

	var data = $scope.gimme("Data");
	if(data) {
	    if(data.hasOwnProperty("fieldNames")) {
		fieldNames = data.fieldNames;
	    } else {
		dataIsCorrupt = true;
	    }
	    if(data.hasOwnProperty("fieldTypes")) {
		fieldTypes = data.fieldTypes;
	    } else {
		dataIsCorrupt = true;
	    }
	} else {
	    dataIsCorrupt = true;
	}

    	/////////////////////////////////////////////////////////
    	///////  Setup slot stuff ///////////////////////////////
    	/////////////////////////////////////////////////////////

	if (!dataIsCorrupt) {

	    for (var i = 0; i < fieldNames.length; i++)
	    {
		var slotName = fname + "Slot";
		slotName = "DataSlot" + i;

		if (!(slotName in slotList))
		{
		    slotsToAdd.push(slotName);
		} else {
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

		if(data.hasOwnProperty("metaData") && data.metaData.hasOwnProperty(i)) {
    		    XMLlist[i]["metadata"] = data.metaData[i];
    		    metadataAddedFlags[i] = true;
		}
	    }
	}
	else
	{
	    dataIsCorrupt = true;
	}

    	/////////////////////////////////////////////////////////
    	///////  Create Slots ///////////////////////////////////
    	/////////////////////////////////////////////////////////

    	if (!dataIsCorrupt)
    	{
    	    var sIdx = 0;
	    
    	    for (sIdx = 0; sIdx < slotsToAdd.length; sIdx++) 
    	    {
    		var s = slotsToAdd[sIdx];
		
    		$scope.addSlot(new Slot(s,                  // Name
    					[],                              // Value
    					s,                                  // Display Name
    					'Slot containing the data from field ' + s,             // Description
    					$scope.theWblMetadata['templateid'],        // Category (common to set to the template id)
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
	    } else {
		dataIsCorrupt = true;
	    }

    	    if (!dataIsCorrupt)
    	    {
    		for (var i = 0; i < fieldTypes.length; i++)
    		{
    		    var fname = fieldNames[i];
    		    var slotName = fname + "Slot";
    		    slotName = "DataSlot" + i;

    		    // debugLog("set " + slotName + " to " + JSON.stringify(vectorsForSlots[i]));
    	    	    $scope.set(slotName, vectorsForSlots[i]);
    		}
		
    		internalIdSlotSet = true;
    		oldIdSlotData = theIdList;
    		$scope.set(idSlotName, theIdList);
    		internalIdSlotSet = false;
    	    }
    	}

    	if (dataIsCorrupt)
    	{
    	    debugLog("Could not parse data correctly.");
    	    setsJSON.sets = [];
    	    $scope.set("ProvidedFormat", resJSON);
    	    $scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
    	    // $scope.tellParent['ProvidedFormat'] = true;

    	    $scope.displayText = dispText + ": " + fileName + " corrupt";

	    $scope.dragNdropData.fields = [{"name":"No Data", "id":-1}];
    	}
    	else
    	{
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
	    
    	    // debugLog("Finished parsing data.");
    	    var oldJSON = {};
    	    // var newJSON = JSON.stringify(resJSON);
    	    var newJSON = resJSON;

    	    try
    	    {
    		oldJSON = $scope.gimme("ProvidedFormat");
    		if(typeof oldJSON === 'string') {
    		    oldJSON = JSON.parse(oldJSON);
    		}
    	    }
    	    catch (Exception)
    	    {
    		oldJSON = {};
    	    }

    	    if (JSON.stringify(oldJSON) != JSON.stringify(newJSON))
    	    {
    		$scope.set("ProvidedFormat", newJSON);
    		// $scope.tellParent['ProvidedFormat'] = true;
    		$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
    	    } else {
    		// $scope.tellParent['Data'] = true;
    		$scope.set("DataChanged", !$scope.gimme("DataChanged"));
    	    }
	    
            $scope.displayText = dispText + ": " + fileName;
    	}

	updateView();

        $timeout(function()
		 {	
		     $scope.fixDraggable();
		 },1);
		 

    	// firstTime = false;

    };


    function convertFromJSON(fileContents) {
	// debugLog("convertFromJSON");

	if(typeof fileContents === 'string') {
	    try {
		return JSON.parse(fileContents);
	    } catch(e) {
		debugLog("Could not parse JSON data.");
	    }
	} else {
	    debugLog("Data does not look like JSON data.");
	}
	data.fieldNames = [];
	data.fieldTypes = [];
	data.columns = [];
	data.metaData = {};
	return data;
    }

    function isASCII(str) {
	return /^[\x00-\x7F]*$/.test(str);
    }

    function convertFromTextData(fileContents) {
	// debugLog("convertFromTextData");

	var data = {};
	data.fieldNames = [];
	data.fieldTypes = [];
	data.columns = [];
	data.metaData = {};

        var dataIsCorrupt = false;

        var p1 = 0;
        var p2 = p1;

    	/////////////////////////////////////////////////////////
    	///////  Check field names and field types //////////////
    	/////////////////////////////////////////////////////////

    	/////////////////////////////////////////////////////////
    	///////  Guess row separator  ///////////////////////////
    	/////////////////////////////////////////////////////////

	var haveHeader = false;

	var semiColonIsSeparator = false;
	var newLineIsSeparator = true;

	var separator = ',';

	// try to figure out row separator

	var semiColonsBeforeNewLine = 0;
	while (p2 < fileContents.length && fileContents[p2] != '\n') {
	    if(fileContents[p2] == ';') {
		semiColonsBeforeNewLine++;
		semiColonIsSeparator = true;
	    }
	    p2++;
	}
	if(p2 >= fileContents.length) {
	    newLineIsSeparator = false;
	}
	if(newLineIsSeparator && semiColonsBeforeNewLine != 1) {
	    semiColonIsSeparator = false;
	}

	if(newLineIsSeparator && semiColonIsSeparator) {
	    debugLog("Row separator is ';\\n'");
	} else if(newLineIsSeparator && !semiColonIsSeparator) {
	    debugLog("Row separator is '\\n'");
	} else if(!newLineIsSeparator && semiColonIsSeparator) {
	    debugLog("Row separator is ';'");
	} else {
	    debugLog("Row separator is unclear... there is only one row?");
	    // dataIsCorrupt = true;
	}

    	/////////////////////////////////////////////////////////
    	///////  Guess field separator (column separator) ///////
    	/////////////////////////////////////////////////////////

	if (!dataIsCorrupt)
	{
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

	    while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
		if(fileContents[p2] == '#') {
		    hashesBeforeNewLine1++;

		    if(p2 == 0) {
			firstLineStartsWithHash = true;
		    }
		}
		if(fileContents[p2] == ';') {
		    semiColonsBeforeNewLine1++;
		}
		if(fileContents[p2] == ':') {
		    colonsBeforeNewLine1++;
		}
		if(fileContents[p2] == '\t') {
		    tabsBeforeNewLine1++;

		    // if(p2 == 1 && firstLineStartsWithHash) {
		    // 	firstLineStartsWithHashAndSpaceOrTab = true;
		    // }
		}
		if(fileContents[p2] == ',') {
		    commasBeforeNewLine1++;
		}
		if(fileContents[p2] == ' ') {
		    spacesBeforeNewLine1++;

		    // if(p2 == 1 && firstLineStartsWithHash) {
		    // 	firstLineStartsWithHashAndSpaceOrTab = true;
		    // }
		}
		if(fileContents[p2] == ')') {
		    rightparBeforeNewLine1++;
		}
		p2++;
	    }
	    while (p2 < fileContents.length && ((newLineIsSeparator && fileContents[p2] == '\n') || (semiColonIsSeparator && fileContents[p2] == ';'))) {
		p2++;
	    }

	    var onlyOneRow = 1;
	    var onlyOneColumn = 0;

	    var semiColonsBeforeNewLine2 = 0;
	    var colonsBeforeNewLine2 = 0;
	    var tabsBeforeNewLine2 = 0;
	    var spacesBeforeNewLine2 = 0;
	    var commasBeforeNewLine2 = 0;
	    while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {

		onlyOneRow = 0;

		if(fileContents[p2] == ';') {
		    semiColonsBeforeNewLine2++;
		}
		if(fileContents[p2] == ':') {
		    colonsBeforeNewLine2++;
		}
		if(fileContents[p2] == '\t') {
		    tabsBeforeNewLine2++;
		}
		if(fileContents[p2] == ',') {
		    commasBeforeNewLine2++;
		}
		if(fileContents[p2] == ' ') {
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

	    } else {

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
	    } else if(separatorIsSemiColon) {
		// separatorIsSemiColon = false;
		separatorIsColon = false;
		separatorIsTab = false;
		separatorIsComma = false;
		separatorIsSpace = false;
		separatorIsSpaceAndHeaderPars = false;

		separator = ';';
	    } else if(separatorIsColon) {
		separatorIsSemiColon = false;
		// separatorIsColon = false;
		separatorIsTab = false;
		separatorIsComma = false;
		separatorIsSpace = false;
		separatorIsSpaceAndHeaderPars = false;

		separator = ':';
	    } else if(separatorIsTab) {
		separatorIsSemiColon = false;
		separatorIsColon = false;
		// separatorIsTab = false;
		separatorIsComma = false;
		separatorIsSpace = false;
		separatorIsSpaceAndHeaderPars = false;

		separator = '\t';
	    } else if(separatorIsSpace) {
		separatorIsSemiColon = false;
		separatorIsColon = false;
		separatorIsTab = false;
		separatorIsComma = false;
		// separatorIsSpace = false;
		separatorIsSpaceAndHeaderPars = false;

		separator = ' ';
	    } else if(separatorIsSpaceAndHeaderPars) {
		separatorIsSemiColon = false;
		separatorIsColon = false;
		separatorIsTab = false;
		separatorIsComma = false;
		separatorIsSpace = false;
		// separatorIsSpaceAndHeaderPars = false;

		separator = ' ';
	    } else {

		res = checkForVariousTypesOfComments(fileContents, semiColonIsSeparator, newLineIsSeparator);
		separator = res.sep;
		fileContents = res.fileContents;

		if(separator == "") {

		    debugLog("Could not determine column separator. " + commasBeforeNewLine1 + " and " + commasBeforeNewLine2 + " commas, " + tabsBeforeNewLine1 + " and " + tabsBeforeNewLine2 + " TABs. Assume only one column.");
		    onlyOneColumn = 1;
		    // dataIsCorrupt = true;
		}
	    }
	}
	
    	/////////////////////////////////////////////////////////
    	///////  Guess field names //////////////////////////////
    	/////////////////////////////////////////////////////////

	if (!dataIsCorrupt)
	{
	    if(onlyOneColumn) {
		// debugLog("Using '" + separator + "' as column separator");
		if(!onlyOneRow) {
		    p1 = 0;
		    p2 = p1;
		    while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
			p2++;
		    }
	            var firstRow = fileContents.substr(p1, p2 - p1);
		    
		    while (p2 < fileContents.length && ((newLineIsSeparator && fileContents[p2] == '\n') || (semiColonIsSeparator && fileContents[p2] == ';'))) {
			p2++;
		    }
		    p1 = p2;
		    while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
			p2++;
		    }
	            var secondRow = fileContents.substr(p1, p2 - p1);
		    if(firstRow.match("[a-zA-Z]+") && !secondRow.match("[a-zA-Z]+")) {
			data.fieldNames.push(firstRow);
			data.fieldTypes.push("number");
			data.columns.push([]);

			haveHeader = true;
		    } else {
			data.fieldNames.push("UnNamedField");
			data.fieldTypes.push("number");
			data.columns.push([]);
		    }
		} else {
		    data.fieldNames.push("UnNamedField");
		    data.fieldTypes.push("number");
		    data.columns.push([]);
		}
	    } else {
		debugLog("Using '" + separator + "' as column separator");
		
		// try to guess column names
		p1 = 0;
		p2 = p1;

		while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
	            p2++;
		}

		if (p2 <= fileContents.length)
		{
	            var firstRow = fileContents.substr(p1, p2 - p1);

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
			while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
			    if(fileContents[p2] == ' ') {
				lastPossibleEnd = p2;
			    }
			    if(fileContents[p2] == ')') {
				if(firstPar) {
				    firstPar = false;
				} else {
				    // definately separate around here
				    if(lastPossibleEnd > lastPossibleStart) {
					// we saw some space, so we may have things like "(1) first col name (2) second col name"
					var newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
					items.push(newItem);
					lastPossibleStart = lastPossibleEnd + 1;
				    } else {
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
	            for (var i = 0; i < items.length; i++)
	            {
			if(!items[i].match("[a-zA-Z]+")) {
			    allStrings = false;
			    break;
			}
		    }
		    
		    if(allStrings && !onlyOneRow) { // probably header
			for (var i = 0; i < items.length; i++)
			{
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

		    } else {
			for (var i = 0; i < items.length; i++)
			{
			    data.fieldNames.push("UnNamedField" + i);
			    data.fieldTypes.push("number");
			    data.columns.push([]);
			}
		    }
		} else { // p2 <= fileContents.length
		    data.fieldNames.push("UnNamedField");
		    data.fieldTypes.push("number");
		    data.columns.push([]);
		}
	    } // more than one column
	} // data not corrupt

    	/////////////////////////////////////////////////////////
    	///////  Guess data types ///////////////////////////////
    	/////////////////////////////////////////////////////////

	var vectorLengths = [];

	var minMax = [];
	for(var i = 0; i < data.fieldTypes.length; i++) {
	    minMax.push({"min":null, "max":null});
	    vectorLengths.push(0);
	}

	if (!dataIsCorrupt) {
	    p1 = 0;
	    var moreLines = true;
	    var firstLine = true;
	    while (moreLines)
	    {
		p2 = p1 + 1;
		while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
		    p2++;
		}
		
		if (p2 <= fileContents.length)
		{
		    if(firstLine && haveHeader) {
			firstLine = false;
		    } else {

			var row = fileContents.substr(p1, p2 - p1);
			
			if(onlyOneColumn) {
			    var nval = parseFloat(row);
			    var num = !isNaN(nval) && isFinite(nval);
			    if(!num) {
				data.fieldTypes[0] = "string";
			    } else {
				if(minMax[0].min === null) {
				    minMax[0].min = nval;
				} else {
				    minMax[0].min = Math.min(minMax[0].min, nval);
				}
				if(minMax[0].max === null) {
				    minMax[0].max = nval;
				} else {
				    minMax[0].max = Math.max(minMax[0].max, nval);
				}
			    }
    			    var items = [row];

			} else {
			    var items = row.split(separator);

			    if (items.length != data.fieldNames.length)
			    {
				dataIsCorrupt = true;
				debugLog("Rows have different number of columns");
				break;
			    }

			    for (var i = 0; i < items.length; i++)
			    {
				var nval = parseFloat(items[i]);
				var num = !isNaN(nval) && isFinite(items[i]);
				if(!num) {
				    data.fieldTypes[i] = "string";
				    
				    var nColons = charCount(":", items[i]);
				    var nAts = charCount("@", items[i]);
				    
				    if(nAts > 0
				       && (nColons == nAts || nColons == nAts - 1)) { // last item does not have a : as separator, so the counts normally differ by 1
					if(vectorLengths[i] == 0 || vectorLengths[i] == nAts) {
					    data.fieldTypes[i] = "vector";
					} else {
					    data.fieldTypes[i] = "string";
					}
					vectorLengths[i] == nAts;
				    }
				} else {
				    if(minMax[i].min === null) {
					minMax[i].min = nval;
				    } else {
					minMax[i].min = Math.min(minMax[i].min, nval);
				    }
				    if(minMax[i].max === null) {
					minMax[i].max = nval;
				    } else {
					minMax[i].max = Math.max(minMax[i].max, nval);
				    }
				}
			    }
			}
		    }
		    
		    p1 = p2;
		    while (p1 < fileContents.length && ((newLineIsSeparator && fileContents[p1] == '\n') || (semiColonIsSeparator && fileContents[p1] == ';'))) {
			p1++;
		    }
		    
		    if (p1 >= fileContents.length)
		    {
			moreLines = false;
		    }
		}
		else
		{
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
		if (fname.toLowerCase().indexOf("time") >= 0) {
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

    	if (!dataIsCorrupt)
    	{
    	    /////////////////////////////////////////////////////////
    	    ///////  Parse data and create vectors //////////////////
    	    /////////////////////////////////////////////////////////

	    noofRows = 0;
	    
    	    var id = 0;
    	    p1 = 0;
    	    var moreLines = true;
    	    var firstLine = true;
    	    while (moreLines)
    	    {
    		p2 = p1 + 1;
    		while (p2 < fileContents.length && (!newLineIsSeparator || fileContents[p2] != '\n') && (!semiColonIsSeparator || fileContents[p2] != ';')) {
    		    p2++;
    		}

    		if (p2 <= fileContents.length)
    		{
    		    if(firstLine && haveHeader) {
    			firstLine = false;
    		    } else {

			noofRows++;

    			var row = fileContents.substr(p1, p2 - p1);

    			if(onlyOneColumn) {
    			    var items = [row];
    			} else {
    			    var items = row.split(separator);

    			    if (items.length != data.fieldNames.length)
    			    {
    				dataIsCorrupt = true;
    				debugLog("Rows have different number of columns.");
    				break;
    			    }
    			}

    			for (i = 0; i < items.length; i++)
    			{
    			    var ftype = data.fieldTypes[i];

    			    var value = items[i];

    			    if (ftype == "integer")
    			    {
    				try
    				{
    				    if (value === "")
    				    {
    					data.columns[i].push(null);
    				    }
    				    else
    				    {
    					data.columns[i].push(parseInt(value));
    				    }
    				}
    				catch (Exception)
    				{
    				    dataIsCorrupt = true;
    				    break;
    				}
    			    }
    			    else if (ftype == "num" || ftype == "number" || ftype == "numeral" || ftype == "float" || ftype == "double" || ftype == "latitude" || ftype == "longitude")
    			    {
    				try
    				{
    				    if (value === "")
    				    {
    					data.columns[i].push(null);
    				    }
    				    else
    				    {
    					data.columns[i].push(Number(value));
    				    }
    				}
    				catch (Exception)
    				{
    				    dataIsCorrupt = true;
    				    break;
    				}
    			    }
    			    else if (ftype == "time" || ftype == "date" || ftype == "datetime")
    			    {
    				try
    				{
    				    if (value === "")
    				    {
    					data.columns[i].push(null);
    				    }
    				    else
    				    {
    					var dateTemp = Date.parse(value);
    					if(isNaN(dateTemp)) {
    					    var numVal = parseFloat(value);
    					    if(!isNaN(numVal) && isFinite(value)) {
    						dateTemp = numVal;
    					    } else {
    						try {
    						    if(value.length == 8) {
    							var today = new Date();
							
    							dateTemp = (new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(value.substr(0,2)), parseInt(value.substr(3,2)), parseInt(value.substr(6,2)))).getTime();
    						    } else {
    							dateTemp = null;
    						    }
    						} catch(e) {
    						    dateTemp = null;
    						}
    					    }
    					}
    					data.columns[i].push(dateTemp);
    				    }
    				}
    				catch (Exception)
    				{
    				    dataIsCorrupt = true;
    				    break;
    				}

    			    }
    			    else if (ftype == "vector")
    			    {
    				if (value === "")
    				{
    				    data.columns[i].push(null);
    				}
    				else
    				{
    				    var vec = [];
    				    var metadata = [];
    				    var temp = value.split(':');
				    
    				    for (sIdx = 0; sIdx < temp.length; sIdx++)
    				    {
    					var s = temp[sIdx];
    					var d = 0;

    					if(s.indexOf('@') < 0) {

    					    try
    					    {
    						var ss = s;
    						if (s.length > 0 && s[s.length - 1] == ';')
    						{
    						    ss = s.substr(0, s.length - 1);
    						}
						
    						d = Number(ss);
    						vec.push(d);
    					    }
    					    catch (Exception)
    					    {
    						dataIsCorrupt = true;
    					    }
    					} else {
    					    try
    					    {
    						var ss = s;
    						if (s.length > 0 && s[s.length - 1] == ';')
    						{
    						    ss = s.substr(0, s.length - 1);
    						}
    						var pairTemp = ss.split('@');
    						var tag = pairTemp[0];
    						var val = Number(pairTemp[1]);
    						// metadata.push(tag + ",");
    						metadata.push(tag);
    						vec.push(val);
    					    }
    					    catch (Exception)
    					    {
    						dataIsCorrupt = true;
    						break;
    					    }
    					}
    				    }

    				    if (metadata.length == 0)
    				    {
    					data.columns[i].push(vec);
    				    }
    				    else
    				    {
    					if (metadata.length != vec.length)
    					{
    					    dataIsCorrupt = true;
    					    break;
    					}
    					else
    					{
					    if(!data.metaData.hasOwnProperty(i)) {
    						var metaDataString = metadata.join(",");
    						data.metaData[i] = metaDataString;
    					    }
    					    data.columns[i].push(vec);
    					}
    				    }
    				}
    			    }
    			    else if (ftype == "string" || ftype == "text")
    			    {
    				try
    				{
    				    data.columns[i].push(value);
    				}
    				catch (Exception)
    				{
    				    dataIsCorrupt = true;
    				    break;
    				}
    			    }
    			    else
    			    {
    				try
    				{
    				    data.columns[i].push(value);
    				}
    				catch (Exception)
    				{
    				    dataIsCorrupt = true;
    				    break;
    				}

    			    }
    			}

    			if (dataIsCorrupt)
    			{
    			    break;
    			}
    		    }

    		    p1 = p2;
    		    while (p1 < fileContents.length && ((newLineIsSeparator && fileContents[p1] == '\n') || (semiColonIsSeparator && fileContents[p1] == ';'))) {
    			p1++;
    		    }

    		    if (p1 >= fileContents.length)
    		    {
    			moreLines = false;
    		    }
    		}
    		else
    		{
    		    moreLines = false;
    		}
    	    } // while more lines
    	}
	
	if(dataIsCorrupt) {
	    data.fieldNames = [];
	    data.fieldTypes = [];
	    data.columns = [];
	    data.metaData = {};
	}
	return data;
    }

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
	} else {
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
	} else {
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
	    } else {
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
	    } else {
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
	    } else {
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
				} else {
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

    // var oldParseData = function() {
    // 	// if($scope.theInitiationState_ >= Enum.bitFlags_InitStates.InitFinished) { 
    // 	if(!fullyLoaded) {
    // 	    return;
    // 	}
	
    // 	debugLog("oldParseData()");

    //     var slotList = $scope.getSlots();
    //     var typeMap = {};

    //     var slotsToAdd = [];

    //     fieldNames = [];
    //     fieldTypes = [];

    //     var vectorsForSlots = [];
    //     var theIdList = [];

    //     typeMap[idSlotName] = "ID";

    //     if (!(idSlotName in slotList))
    //     {
    // 	    slotsToAdd.push(idSlotName);
    //     } else {
    // 	    $scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
    // 	}

    // 	var resJSON = {};
    // 	var setsJSON = {};
    //     var fieldsJSON = [];
    // 	setsJSON.sets = [];
    // 	setsJSON.sets.push({"name":"SMARTSet", "fieldList":fieldsJSON, "idSlot":idSlotName});
    // 	resJSON["format"] = setsJSON;
	
    //     var XMLlist = [];
    //     var metadataAddedFlags = [];

    //     if($scope.displayText != "")
    //     {
    // 	    setsJSON.sets[0]["name"] = $scope.displayText;
    //     }

    //     var dataIsCorrupt = false;

    //     var p1 = 0;
    //     var p2 = p1;

    // 	/////////////////////////////////////////////////////////
    // 	///////  Check field names and field types //////////////
    // 	/////////////////////////////////////////////////////////

    // 	/////////////////////////////////////////////////////////
    // 	///////  Guess row separator  ///////////////////////////
    // 	/////////////////////////////////////////////////////////

    // 	var haveHeader = false;

    // 	var semiColonIsSeparator = false;
    // 	var newLineIsSeparator = true;

    // 	var separator = ',';

    // 	if (!dataIsCorrupt)
    // 	{
    // 	    var dataString = $scope.gimme("Data");
	    
    // 	    // try to figure out row separator
    // 	    p1 = 0;
    // 	    p2 = p1;
	    
    // 	    var semiColonsBeforeNewLine = 0;
    // 	    while (p2 < dataString.length && dataString[p2] != '\n') {
    // 		if(dataString[p2] == ';') {
    // 		    semiColonsBeforeNewLine++;
    // 		    semiColonIsSeparator = true;
    // 		}
    // 		p2++;
    // 	    }
    // 	    if(p2 >= dataString.length) {
    // 		newLineIsSeparator = false;
    // 	    }
    // 	    if(newLineIsSeparator && semiColonsBeforeNewLine != 1) {
    // 		semiColonIsSeparator = false;
    // 	    }

    // 	    if(newLineIsSeparator && semiColonIsSeparator) {
    // 		debugLog("Row separator is ';\\n'");
    // 	    } else if(newLineIsSeparator && !semiColonIsSeparator) {
    // 		debugLog("Row separator is '\\n'");
    // 	    } else if(!newLineIsSeparator && semiColonIsSeparator) {
    // 		debugLog("Row separator is ';'");
    // 	    } else {
    // 		debugLog("Row separator is unclear... there is only one row?");
    // 		// dataIsCorrupt = true;
    // 	    }
    // 	}

    // 	/////////////////////////////////////////////////////////
    // 	///////  Guess field separator (column separator) ///////
    // 	/////////////////////////////////////////////////////////

    // 	if (!dataIsCorrupt)
    // 	{
    // 	    // try to figure out column separator
    // 	    p1 = 0;
    // 	    p2 = p1;
    // 	    var semiColonsBeforeNewLine1 = 0;
    // 	    var colonsBeforeNewLine1 = 0;
    // 	    var tabsBeforeNewLine1 = 0;
    // 	    var spacesBeforeNewLine1 = 0;
    // 	    var commasBeforeNewLine1 = 0;
    // 	    var rightparBeforeNewLine1 = 0;
    // 	    var hashesBeforeNewLine1 = 0;
    // 	    while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 		if(dataString[p2] == '#') {
    // 		    hashesBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == ';') {
    // 		    semiColonsBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == ':') {
    // 		    colonsBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == '\t') {
    // 		    tabsBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == ',') {
    // 		    commasBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == ' ') {
    // 		    spacesBeforeNewLine1++;
    // 		}
    // 		if(dataString[p2] == ')') {
    // 		    rightparBeforeNewLine1++;
    // 		}
    // 		p2++;
    // 	    }
    // 	    while (p2 < dataString.length && ((newLineIsSeparator && dataString[p2] == '\n') || (semiColonIsSeparator && dataString[p2] == ';'))) {
    // 		p2++;
    // 	    }

    // 	    var onlyOneRow = 1;
    // 	    var onlyOneColumn = 0;

    // 	    var semiColonsBeforeNewLine2 = 0;
    // 	    var colonsBeforeNewLine2 = 0;
    // 	    var tabsBeforeNewLine2 = 0;
    // 	    var spacesBeforeNewLine2 = 0;
    // 	    var commasBeforeNewLine2 = 0;
    // 	    while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {

    // 		onlyOneRow = 0;

    // 		if(dataString[p2] == ';') {
    // 		    semiColonsBeforeNewLine2++;
    // 		}
    // 		if(dataString[p2] == ':') {
    // 		    colonsBeforeNewLine2++;
    // 		}
    // 		if(dataString[p2] == '\t') {
    // 		    tabsBeforeNewLine2++;
    // 		}
    // 		if(dataString[p2] == ',') {
    // 		    commasBeforeNewLine2++;
    // 		}
    // 		if(dataString[p2] == ' ') {
    // 		    spacesBeforeNewLine2++;
    // 		}
    // 		p2++;
    // 	    }

    // 	    var separatorIsSemiColon = false;
    // 	    var separatorIsColon = false;
    // 	    var separatorIsTab = false;
    // 	    var separatorIsComma = false;
    // 	    var separatorIsSpace = false;
    // 	    var separatorIsSpaceAndHeaderPars = false;

    // 	    if(onlyOneRow) {
		
    // 		// var mostFrequent = Math.max(semiColonsBeforeNewLine1, commasBeforeNewLine1, tabsBeforeNewLine1, colonsBeforeNewLine1, spacesBeforeNewLine1);
		
    // 		if(tabsBeforeNewLine1 > 0) {
    // 		    separatorIsTab = true;
    // 		} else if(commasBeforeNewLine1 > 0) {
    // 		    separatorIsComma = true;
    // 		} else if(semiColonsBeforeNewLine1 > 0) {
    // 		    separatorIsSemiColon = true;
    // 		} else if(spacesBeforeNewLine1 > 0) {
    // 		    separatorIsSpace = true;
    // 		} else if(colonsBeforeNewLine1 > 0) {
    // 		    separatorIsColon = true;
    // 		} 

    // 	    } else {

    // 		if(semiColonsBeforeNewLine2 == semiColonsBeforeNewLine1 && semiColonsBeforeNewLine2 > 0) {
    // 		    separatorIsSemiColon = true;
    // 		}
    // 		if(commasBeforeNewLine2 == commasBeforeNewLine1 && commasBeforeNewLine2 > 0) {
    // 		    separatorIsComma = true;
    // 		}
    // 		if(tabsBeforeNewLine2 == tabsBeforeNewLine1 && tabsBeforeNewLine2 > 0) {
    // 		    separatorIsTab = true;
    // 		}
    // 		if(colonsBeforeNewLine2 == colonsBeforeNewLine1 && colonsBeforeNewLine2 > 0) {
    // 		    separatorIsColon = true;
    // 		}
    // 		if(spacesBeforeNewLine2 == spacesBeforeNewLine1 && spacesBeforeNewLine2 > 0) {
    // 		    separatorIsSpace = true;
    // 		}

    // 		if(spacesBeforeNewLine2 + 1 == rightparBeforeNewLine1 && spacesBeforeNewLine2 > 0 && spacesBeforeNewLine2 != spacesBeforeNewLine1) {
    // 		    separatorIsSpaceAndHeaderPars = true;
    // 		}

    // 	    }

    // 	    if(separatorIsComma) {
    // 		separatorIsSemiColon = false;
    // 		separatorIsColon = false;
    // 		separatorIsTab = false;
    // 		// separatorIsComma = false;
    // 		separatorIsSpace = false;
    // 		separatorIsSpaceAndHeaderPars = false;

    // 		separator = ',';
    // 	    } else if(separatorIsSemiColon) {
    // 		// separatorIsSemiColon = false;
    // 		separatorIsColon = false;
    // 		separatorIsTab = false;
    // 		separatorIsComma = false;
    // 		separatorIsSpace = false;
    // 		separatorIsSpaceAndHeaderPars = false;

    // 		separator = ';';
    // 	    } else if(separatorIsColon) {
    // 		separatorIsSemiColon = false;
    // 		// separatorIsColon = false;
    // 		separatorIsTab = false;
    // 		separatorIsComma = false;
    // 		separatorIsSpace = false;
    // 		separatorIsSpaceAndHeaderPars = false;

    // 		separator = ':';
    // 	    } else if(separatorIsTab) {
    // 		separatorIsSemiColon = false;
    // 		separatorIsColon = false;
    // 		// separatorIsTab = false;
    // 		separatorIsComma = false;
    // 		separatorIsSpace = false;
    // 		separatorIsSpaceAndHeaderPars = false;

    // 		separator = '\t';
    // 	    } else if(separatorIsSpace) {
    // 		separatorIsSemiColon = false;
    // 		separatorIsColon = false;
    // 		separatorIsTab = false;
    // 		separatorIsComma = false;
    // 		// separatorIsSpace = false;
    // 		separatorIsSpaceAndHeaderPars = false;

    // 		separator = ' ';
    // 	    } else if(separatorIsSpaceAndHeaderPars) {
    // 		separatorIsSemiColon = false;
    // 		separatorIsColon = false;
    // 		separatorIsTab = false;
    // 		separatorIsComma = false;
    // 		separatorIsSpace = false;
    // 		// separatorIsSpaceAndHeaderPars = false;

    // 		separator = ' ';
    // 	    } else {
    // 		debugLog("Could not determine column separator. " + commasBeforeNewLine1 + " and " + commasBeforeNewLine2 + " commas, " + tabsBeforeNewLine1 + " and " + tabsBeforeNewLine2 + " TABs. Assume only one column.");
    // 		onlyOneColumn = 1;
    // 		// dataIsCorrupt = true;
    // 	    }
    // 	}
	
    // 	/////////////////////////////////////////////////////////
    // 	///////  Guess field names //////////////////////////////
    // 	/////////////////////////////////////////////////////////

    // 	if (!dataIsCorrupt)
    // 	{
    // 	    if(onlyOneColumn) {
    // 		// debugLog("Using '" + separator + "' as column separator");
    // 		if(!onlyOneRow) {
    // 		    p1 = 0;
    // 		    p2 = p1;
    // 		    while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 			p2++;
    // 		    }
    // 	            var firstRow = dataString.substr(p1, p2 - p1);
		    
    // 		    while (p2 < dataString.length && ((newLineIsSeparator && dataString[p2] == '\n') || (semiColonIsSeparator && dataString[p2] == ';'))) {
    // 			p2++;
    // 		    }
    // 		    p1 = p2;
    // 		    while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 			p2++;
    // 		    }
    // 	            var secondRow = dataString.substr(p1, p2 - p1);
    // 		    if(firstRow.match("[a-zA-Z]+") && !secondRow.match("[a-zA-Z]+")) {
    // 			fieldNames.push(firstRow);
    // 			fieldTypes.push("number");

    // 			haveHeader = true;
    // 		    } else {
    // 			fieldNames.push("UnNamedField");
    // 			fieldTypes.push("number");
    // 		    }
    // 		} else {
    // 		    fieldNames.push("UnNamedField");
    // 		    fieldTypes.push("number");
    // 		}
    // 	    } else {
    // 		debugLog("Using '" + separator + "' as column separator");
		
    // 		// try to guess column names
    // 		p1 = 0;
    // 		p2 = p1;

    // 		while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 	            p2++;
    // 		}

    // 		if (p2 <= dataString.length)
    // 		{
    // 	            var firstRow = dataString.substr(p1, p2 - p1);

    // 	            var items = firstRow.split(separator);
    // 		    if(separatorIsSpaceAndHeaderPars) {
    // 			items = [];
    // 			p1 = 0;
    // 			p2 = p1;
    // 			var lastPossibleStart = 0;
    // 			var lastPossibleEnd = 0;
    // 			var firstPar = true;
    // 			while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 			    if(dataString[p2] == ' ') {
    // 				lastPossibleEnd = p2;
    // 			    }
    // 			    if(dataString[p2] == ')') {
    // 				if(firstPar) {
    // 				    firstPar = false;
    // 				} else {
    // 				    // definately separate around here
    // 				    if(lastPossibleEnd > lastPossibleStart) {
    // 					// we saw some space, so we may have things like "(1) first col name (2) second col name"
    // 					var newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
    // 					items.push(newItem);
    // 					lastPossibleStart = lastPossibleEnd + 1;
    // 				    } else {
    // 					lastPossibleEnd = p2 - 1;
    // 					if(lastPossibleEnd <= lastPossibleStart) {
    // 					    lastPossibleEnd = lastPossibleStart;
    // 					}
    // 					var newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
    // 					items.push(newItem);
    // 					lastPossibleStart = lastPossibleEnd + 1;
    // 				    }
    // 				}
    // 			    }

    // 			    p2++;
    // 			}

    // 			// add last item
    // 			lastPossibleEnd = p2;
    // 			if(lastPossibleEnd <= lastPossibleStart) {
    // 			    lastPossibleEnd = lastPossibleStart;
    // 			}
    // 			newItem = firstRow.substr(lastPossibleStart, lastPossibleEnd - lastPossibleStart);
    // 			items.push(newItem);
    // 		    }

    // 		    var allStrings = true;
    // 	            for (var i = 0; i < items.length; i++)
    // 	            {
    // 			if(!items[i].match("[a-zA-Z]+")) {
    // 			    allStrings = false;
    // 			    break;
    // 			}
    // 		    }
		    
    // 		    if(allStrings && !onlyOneRow) { // probably header
    // 			for (var i = 0; i < items.length; i++)
    // 			{
    // 			    fieldNames.push(items[i]);
    // 			    fieldTypes.push("number");
    // 			}

    // 			if(hashesBeforeNewLine1 == 1) {
    // 			    if(fieldNames[0][0] == "#") {
    // 				fieldNames[0] = fieldNames[0].substr(1, fieldNames[0].length - 1);
    // 			    }
    // 			}

    // 			haveHeader = true;

    // 		    } else {
    // 			for (var i = 0; i < items.length; i++)
    // 			{
    // 			    fieldNames.push("UnNamedField" + i);
    // 			    fieldTypes.push("number");
    // 			}
    // 		    }
    // 		} else { // p2 <= dataString.length
    // 		    fieldNames.push("UnNamedField");
    // 		    fieldTypes.push("number");
    // 		}
    // 	    } // more than one column
    // 	} // data not corrupt

    // 	/////////////////////////////////////////////////////////
    // 	///////  Guess data types ///////////////////////////////
    // 	/////////////////////////////////////////////////////////

    // 	var minMax = [];
    // 	for(var i = 0; i < fieldTypes.length; i++) {
    // 	    minMax.push({"min":null, "max":null});
    // 	}

    // 	if (!dataIsCorrupt) {
    // 	    p1 = 0;
    // 	    var moreLines = true;
    // 	    var firstLine = true;
    // 	    while (moreLines)
    // 	    {
    // 		p2 = p1 + 1;
    // 		while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 		    p2++;
    // 		}
		
    // 		if (p2 <= dataString.length)
    // 		{
    // 		    if(firstLine && haveHeader) {
    // 			firstLine = false;
    // 		    } else {

    // 			var row = dataString.substr(p1, p2 - p1);
			
    // 			if(onlyOneColumn) {
    // 			    var nval = parseFloat(row);
    // 			    var num = !isNaN(nval) && isFinite(nval);
    // 			    if(!num) {
    // 				fieldTypes[0] = "string";
    // 			    } else {
    // 				if(minMax[0].min === null) {
    // 				    minMax[0].min = nval;
    // 				} else {
    // 				    minMax[0].min = Math.min(minMax[0].min, nval);
    // 				}
    // 				if(minMax[0].max === null) {
    // 				    minMax[0].max = nval;
    // 				} else {
    // 				    minMax[0].max = Math.max(minMax[0].max, nval);
    // 				}
    // 			    }
    // 			    var items = [row];

    // 			} else {
    // 			    var items = row.split(separator);

    // 			    if (items.length != fieldNames.length)
    // 			    {
    // 				dataIsCorrupt = true;
    // 				debugLog("Rows have different number of columns");
    // 				break;
    // 			    }

    // 			    for (var i = 0; i < items.length; i++)
    // 			    {
    // 				var nval = parseFloat(items[i]);
    // 				var num = !isNaN(nval) && isFinite(items[i]);
    // 				if(!num) {
    // 				    fieldTypes[i] = "string";
    // 				} else {
    // 				    if(minMax[i].min === null) {
    // 					minMax[i].min = nval;
    // 				    } else {
    // 					minMax[i].min = Math.min(minMax[i].min, nval);
    // 				    }
    // 				    if(minMax[i].max === null) {
    // 					minMax[i].max = nval;
    // 				    } else {
    // 					minMax[i].max = Math.max(minMax[i].max, nval);
    // 				    }
    // 				}
    // 			    }
    // 			}
    // 		    }
		    
    // 		    p1 = p2;
    // 		    while (p1 < dataString.length && ((newLineIsSeparator && dataString[p1] == '\n') || (semiColonIsSeparator && dataString[p1] == ';'))) {
    // 			p1++;
    // 		    }
		    
    // 		    if (p1 >= dataString.length)
    // 		    {
    // 			moreLines = false;
    // 		    }
    // 		}
    // 		else
    // 		{
    // 		    moreLines = false;
    // 		}
    // 	    }
    // 	}

    // 	/////////////////////////////////////////////////////////
    // 	///////  Setup slot stuff ///////////////////////////////
    // 	/////////////////////////////////////////////////////////

    // 	if (!dataIsCorrupt) {

    // 	    for (var i = 0; i < items.length; i++)
    // 	    {
    // 		var slotName = fname + "Slot";
    // 		slotName = "DataSlot" + i;

    // 		if (!(slotName in slotList))
    // 		{
    // 		    slotsToAdd.push(slotName);
    // 		} else {
    // 		    $scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
    // 		}

    // 		var ftype = fieldTypes[i];
    // 		var fname = fieldNames[i];

    // 		if (ftype == "number" && fname.toLowerCase().indexOf("latitude") >= 0) {
    // 		    ftype = "latitude";
    // 		}
    // 		if (ftype == "number" && fname.toLowerCase().indexOf("longitude") >= 0) {
    // 		    ftype = "longitude";
    // 		}
    // 		if (fname.toLowerCase().indexOf("time") >= 0) {
    // 		    if(ftype != "number" || minMax[i].max - minMax[i].min > 1) {
    // 			ftype = "date";
    // 		    }
    // 		}
    // 		if (fname.toLowerCase().indexOf("date") >= 0) {
    // 		    if(ftype != "number" || minMax[i].max - minMax[i].min > 1) {
    // 			ftype = "date";
    // 		    }
    // 		}
    // 		fieldTypes[i] = ftype;

    // 		typeMap[fname] = ftype;
    // 		typeMap[slotName] = ftype;
		
    // 		var field = {};
    // 		field.slot = slotName;
    // 		field.name = fname;
    // 		field.type = ftype;
    // 		fieldsJSON.push(field);

    // 		XMLlist.push(field);
    // 		metadataAddedFlags.push(false);
    // 	    }
    // 	}
    // 	else
    // 	{
    // 	    dataIsCorrupt = true;
    // 	}

    // 	/////////////////////////////////////////////////////////
    // 	///////  Create Slots ///////////////////////////////////
    // 	/////////////////////////////////////////////////////////

    // 	if (!dataIsCorrupt)
    // 	{
    // 	    var sIdx = 0;
	    
    // 	    for (sIdx = 0; sIdx < slotsToAdd.length; sIdx++) 
    // 	    {
    // 		var s = slotsToAdd[sIdx];
		
    // 		$scope.addSlot(new Slot(s,                  // Name
    // 					[],                              // Value
    // 					s,                                  // Display Name
    // 					'Slot containing the data from field ' + s,             // Description
    // 					$scope.theWblMetadata['templateid'],        // Category (common to set to the template id)
    // 					undefined,                                 
    // 					undefined
    // 				       ));
    // 		$scope.getSlot(s).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
    // 	    }

    // 	    vectorsForSlots = [];
    // 	    vectorsForSlots.length = fieldTypes.length;

    // 	    for (sIdx = 0; sIdx < fieldTypes.length; sIdx++)
    // 	    {
    // 		// var ftype = fieldTypes[sIdx];
		
    // 		vectorsForSlots[sIdx] = [];
    // 	    }

    // 	    /////////////////////////////////////////////////////////
    // 	    ///////  Parse data and create vectors //////////////////
    // 	    /////////////////////////////////////////////////////////

    // 	    noofRows = 0;
	    
    // 	    var id = 0;
    // 	    p1 = 0;
    // 	    var moreLines = true;
    // 	    var firstLine = true;
    // 	    while (moreLines)
    // 	    {
    // 		p2 = p1 + 1;
    // 		while (p2 < dataString.length && (!newLineIsSeparator || dataString[p2] != '\n') && (!semiColonIsSeparator || dataString[p2] != ';')) {
    // 		    p2++;
    // 		}

    // 		if (p2 <= dataString.length)
    // 		{
    // 		    if(firstLine && haveHeader) {
    // 			firstLine = false;
    // 		    } else {

    // 			noofRows++;

    // 			var row = dataString.substr(p1, p2 - p1);

    // 			id++;

    // 			theIdList.push(id);

    // 			if(onlyOneColumn) {
    // 			    var items = [row];
    // 			} else {
    // 			    var items = row.split(separator);

    // 			    if (items.length != fieldNames.length)
    // 			    {
    // 				dataIsCorrupt = true;
    // 				debugLog("Rows have different number of columns.");
    // 				break;
    // 			    }
    // 			}

    // 			for (i = 0; i < items.length; i++)
    // 			{
    // 			    var ftype = fieldTypes[i];

    // 			    var value = items[i];

    // 			    if (ftype == "integer")
    // 			    {
    // 				try
    // 				{
    // 				    if (value === "")
    // 				    {
    // 					vectorsForSlots[i].push(null);
    // 				    }
    // 				    else
    // 				    {
    // 					vectorsForSlots[i].push(parseInt(value));
    // 				    }
    // 				}
    // 				catch (Exception)
    // 				{
    // 				    dataIsCorrupt = true;
    // 				    break;
    // 				}
    // 			    }
    // 			    else if (ftype == "num" || ftype == "number" || ftype == "numeral" || ftype == "float" || ftype == "double" || ftype == "latitude" || ftype == "longitude")
    // 			    {
    // 				try
    // 				{
    // 				    if (value === "")
    // 				    {
    // 					vectorsForSlots[i].push(null);
    // 				    }
    // 				    else
    // 				    {
    // 					vectorsForSlots[i].push(Number(value));
    // 				    }
    // 				}
    // 				catch (Exception)
    // 				{
    // 				    dataIsCorrupt = true;
    // 				    break;
    // 				}
    // 			    }
    // 			    else if (ftype == "time" || ftype == "date" || ftype == "datetime")
    // 			    {
    // 				try
    // 				{
    // 				    if (value === "")
    // 				    {
    // 					vectorsForSlots[i].push(null);
    // 				    }
    // 				    else
    // 				    {
    // 					var dateTemp = Date.parse(value);
    // 					if(isNaN(dateTemp)) {
    // 					    var numVal = parseFloat(value);
    // 					    if(!isNaN(numVal) && isFinite(value)) {
    // 						dateTemp = numVal;
    // 					    } else {
    // 						try {
    // 						    if(value.length == 8) {
    // 							var today = new Date();
							
    // 							dateTemp = (new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(value.substr(0,2)), parseInt(value.substr(3,2)), parseInt(value.substr(6,2)))).getTime();
    // 						    } else {
    // 							dateTemp = null;
    // 						    }
    // 						} catch(e) {
    // 						    dateTemp = null;
    // 						}
    // 					    }
    // 					}
    // 					vectorsForSlots[i].push(dateTemp);
    // 				    }
    // 				}
    // 				catch (Exception)
    // 				{
    // 				    dataIsCorrupt = true;
    // 				    break;
    // 				}

    // 			    }
    // 			    else if (ftype == "vector")
    // 			    {
    // 				if (value === "")
    // 				{
    // 				    vectorsForSlots[i].push(null);
    // 				}
    // 				else
    // 				{
    // 				    var vec = [];
    // 				    var metadata = [];
    // 				    var temp = value.split(':');
				    
    // 				    for (sIdx = 0; sIdx < temp.length; sIdx++)
    // 				    {
    // 					var s = temp[sIdx];
    // 					var d = 0;

    // 					if(s.indexOf('@') < 0) {

    // 					    try
    // 					    {
    // 						var ss = s;
    // 						if (s.length > 0 && s[s.length - 1] == ';')
    // 						{
    // 						    ss = s.substr(0, s.length - 1);
    // 						}
						
    // 						d = Number(ss);
    // 						vec.push(d);
    // 					    }
    // 					    catch (Exception)
    // 					    {
    // 						dataIsCorrupt = true;
    // 					    }
    // 					} else {
    // 					    try
    // 					    {
    // 						var ss = s;
    // 						if (s.length > 0 && s[s.length - 1] == ';')
    // 						{
    // 						    ss = s.substr(0, s.length - 1);
    // 						}
    // 						var pairTemp = ss.split('@');
    // 						var tag = pairTemp[0];
    // 						var val = Number(pairTemp[1]);
    // 						// metadata.push(tag + ",");
    // 						metadata.push(tag);
    // 						vec.push(val);
    // 					    }
    // 					    catch (Exception)
    // 					    {
    // 						dataIsCorrupt = true;
    // 						break;
    // 					    }
    // 					}
    // 				    }

    // 				    if (metadata.length == 0)
    // 				    {
    // 					vectorsForSlots[i].push(vec);
    // 				    }
    // 				    else
    // 				    {
    // 					if (metadata.length != vec.length)
    // 					{
    // 					    dataIsCorrupt = true;
    // 					    break;
    // 					}
    // 					else
    // 					{
    // 					    if (!metadataAddedFlags[i])
    // 					    {
    // 						var metaDataString = metadata.join(",");
    // 						XMLlist[i]["metadata"] = metaDataString;
    // 						metadataAddedFlags[i] = true;
    // 					    }
    // 					    vectorsForSlots[i].push(vec);
    // 					}
    // 				    }
    // 				}
    // 			    }
    // 			    else if (ftype == "string" || ftype == "text")
    // 			    {
    // 				try
    // 				{
    // 				    vectorsForSlots[i].push(value);
    // 				}
    // 				catch (Exception)
    // 				{
    // 				    dataIsCorrupt = true;
    // 				    break;
    // 				}
    // 			    }
    // 			    else
    // 			    {
    // 				try
    // 				{
    // 				    vectorsForSlots[i].push(value);
    // 				}
    // 				catch (Exception)
    // 				{
    // 				    dataIsCorrupt = true;
    // 				    break;
    // 				}

    // 			    }
    // 			}

    // 			if (dataIsCorrupt)
    // 			{
    // 			    break;
    // 			}
    // 		    }

    // 		    p1 = p2;
    // 		    while (p1 < dataString.length && ((newLineIsSeparator && dataString[p1] == '\n') || (semiColonIsSeparator && dataString[p1] == ';'))) {
    // 			p1++;
    // 		    }

    // 		    if (p1 >= dataString.length)
    // 		    {
    // 			moreLines = false;
    // 		    }
    // 		}
    // 		else
    // 		{
    // 		    moreLines = false;
    // 		}
    // 	    } // while more lines


    // 	    if (!dataIsCorrupt)
    // 	    {
    // 		for (var i = 0; i < fieldTypes.length; i++)
    // 		{
    // 		    var fname = fieldNames[i];
    // 		    var slotName = fname + "Slot";
    // 		    slotName = "DataSlot" + i;

    // 		    // debugLog("set " + slotName + " to " + JSON.stringify(vectorsForSlots[i]));
    // 	    	    $scope.set(slotName, vectorsForSlots[i]);
    // 		}
		
    // 		internalIdSlotSet = true;
    // 		oldIdSlotData = theIdList;
    // 		$scope.set(idSlotName, theIdList);
    // 		internalIdSlotSet = false;
    // 	    }
    // 	}

    // 	if (dataIsCorrupt)
    // 	{
    // 	    debugLog("Could not parse data correctly.");
    // 	    setsJSON.sets = [];
    // 	    $scope.set("ProvidedFormat", resJSON);
    // 	    $scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
    // 	    // $scope.tellParent['ProvidedFormat'] = true;

    // 	    $scope.displayText = dispText + ": " + fileName + " corrupt";

    // 	    $scope.dragNdropData.fields = [{"name":"No Data", "id":-1}];
    // 	}
    // 	else
    // 	{
    // 	    var ls = [];
    // 	    var sourceName = $scope.gimme("PluginName");
    // 	    var dataSetName = sourceName;
    // 	    var dataSetIdx = 0;
    // 	    var fieldName = "";

    // 	    for(var f = 0 ; f < fieldNames.length; f++) {
    // 		fieldName = fieldNames[f];
    // 		var info = {"sourceName":sourceName, "dataSetName":dataSetName, "dataSetIdx":dataSetIdx, "fieldName":fieldName};
		
    // 		ls.push({"name":fieldName + " (" + fieldTypes[f] + ")", "id":JSON.stringify(info)});
    // 	    }
    // 	    $scope.dragNdropData.fields = ls;
	    
    // 	    debugLog("Finished parsing data.");
    // 	    var oldJSON = {};
    // 	    // var newJSON = JSON.stringify(resJSON);
    // 	    var newJSON = resJSON;

    // 	    try
    // 	    {
    // 		oldJSON = $scope.gimme("ProvidedFormat");
    // 		if(typeof oldJSON === 'string') {
    // 		    oldJSON = JSON.parse(oldJSON);
    // 		}
    // 	    }
    // 	    catch (Exception)
    // 	    {
    // 		oldJSON = {};
    // 	    }

    // 	    if (JSON.stringify(oldJSON) != JSON.stringify(newJSON))
    // 	    {
    // 		$scope.set("ProvidedFormat", newJSON);
    // 		// $scope.tellParent['ProvidedFormat'] = true;
    // 		$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
    // 	    } else {
    // 		// $scope.tellParent['Data'] = true;
    // 		$scope.set("DataChanged", !$scope.gimme("DataChanged"));
    // 	    }
	    
    //         $scope.displayText = dispText + ": " + fileName;
    // 	}

    // 	updateView();

    // 	// firstTime = false;

    // };

    function updateView() {
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
		// $scope.dataListStyle['background-color'] = grd;
    		// drewBack = true;
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
    }

    function charCount(c, str) {
	var res = 0;

	var idx = str.indexOf(c);

	while(idx >= 0) {
	    res++;
	    
	    idx = str.indexOf(c, idx + 1);
	}

	return res;
    }

    function mySlotChange(eventData) {
    	//debugLog("mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
    	// debugLog("mySlotChange() " + eventData.slotName);

	if(eventData.slotName == idSlotName) {
	    // this is not allowed unless it is a set from the parseData() function
	    if(!internalIdSlotSet) {
		$scope.set(idSlotName, oldIdSlotData);
	    }		
	} else {
    	    switch(eventData.slotName) {
    	    case "Data":
    		parseData();
    		break;
    		// case "DataTypes":
    		// 	parseData();
    		// 	break;
    		// case "DataNames":
    		// 	parseData();
    		// 	break;

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
	    }
	}
    };

    //===================================================================================
    // Webble template Initialization
    // If any initiation needs to be done when the webble is created it is here that
    // should be executed. the saved def object is sent as a parameter in case it
    // includes data this webble needs to retrieve.
    // If this function is empty and unused it can safely be deleted.
    // Possible content for this function is as follows:
    // *Add own slots
    // *Set the default slot
    // *Set Custom Child Container
    // *Create Value watchers for slots and other values
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

	$scope.addSlot(new Slot('Data',
				{"fieldNames":["time","field 2"],"fieldTypes":["number","string"],"columns":[[1, "first"], [2, "second"], [2.5, "third"]]},	
				'Data',
				'The data.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
	// $scope.addSlot(new Slot('Data',
	// 			"1,2,3;2,2,2;3,3,3;3,2,1;",
	// 			'Data',
	// 			'The data.',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,                                 
	// 			undefined
	// 		       ));

        $scope.addSlot(new Slot('FontSize',
				fontSize,
				"Font Size",
				'The font size to use in the Webble interface.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('GroupColors',
{"skin":{"color":"#FFFACD", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFFEF5"}, {"pos":0.75, "color":"#FFFACD"}, {"pos":1, "color":"#FFFACD"}]}, // lemon
				 "selection":{"color":"#FFEBCD", "border":"#FFA500", "gradient":[{"pos":0, "color":"#FFFBF5"}, {"pos":1, "color":"#FFEBCD"}]}, // whiteish
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
	
	// $scope.addSlot(new Slot('DataTypes',
	// 			"number,number,number;",
	// 			'Data Types',
	// 			'Description of the CSV data (generated from data).',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,                                 
	// 			undefined
	// 		       ));
	
	// $scope.addSlot(new Slot('DataNames',
	// 			"FirstField,Field2,Last;",
	// 			'Data Names',
	// 			'Description of the CSV data (generated from data).',
	// 			$scope.theWblMetadata['templateid'],
	// 			undefined,                                 
	// 			undefined
	// 		       ));

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
	
	$scope.setDefaultSlot('');


	// $scope.theView.parent().draggable('option', 'cancel', '#fieldsToDrag');
	// $scope.theView.parent().draggable('option', 'cancel', '#fieldsToDrag2');
	// $scope.theView.parent().draggable('option', 'cancel', 'fieldsToDrag');
	// $scope.theView.parent().draggable('option', 'cancel', 'fieldsToDrag2');

	// hack to restore status of any slots that were saved but
	// lost their state settings
	var slotDict = $scope.getSlots();
	if(slotDict.hasOwnProperty(idSlotName)) {
	    $scope.getSlot(idSlotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	}
	for(var slotName in slotDict) {
	    if(slotName.substring(0, 8) == "DataSlot") {
		$scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
	    }
	}


	myInstanceId = $scope.getInstanceId();

	$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	    mySlotChange(eventData);
	});

	$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
	    if(eventData.targetId == myInstanceId) {
		// debugLog("I was loaded");
		fullyLoaded = true;
		parseData();
	    }
	}); // check when we get loaded (fully loaded)

	// $scope.fixDroppable();
	$scope.fixDraggable();
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
	var targetName = $(event.target).scope().getName();

	if (targetName != ""){
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
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
	var customWblDefPart = {

	};

	return customWblDefPart;
    };
    //===================================================================================


    // TODO: POSSIBLE ADDITIONAL CUSTOM METHODS
    //========================================================================================
    // Custom template specific methods is very likely to be quite a few of in every Webble,
    // and they contain what ever the developer want them to contain.
    //========================================================================================
    // "Public" (accessible outside this controller)
    //    $scope.[CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }

    // "Private" (accessible only inside this controller)
    //    var [CUSTOM NEW METHOD NAME] = function([PARAMETERS]){
    //        [CUSTOM CODE HERE]
    //    }
    //========================================================================================


    // TODO: POSSIBLE OVERRIDING WEBBLE CORE METHODS WITH CUSTOM PARTS
    //========================================================================================
    // In 99% of all Webble development there is probably no need to insert custom code inside
    // a Webble core function or in any way override Webble core behavior, but the possibility
    // exists as shown below if special circumstance and needs arise.
    //========================================================================================
    //    $scope.[NEW METHOD NAME] = $scope.$parent.[PARENT METHOD]   //Assign the Webble core method to a template method caller
    //
    //    $scope.$parent.[PARENT METHOD] = function([PARAMETERS]){    //Assign a new custom method to th Webble Core
    //        [CUSTOM CODE HERE]
    //
    //        $scope.[NEW METHOD NAME]();                             //Call the original function, in order to not break expected behavior
    //
    //        [MORE CUSTOM CODE HERE]
    //    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
