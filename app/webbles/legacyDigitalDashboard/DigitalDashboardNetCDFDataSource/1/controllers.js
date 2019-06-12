//======================================================================================================================
// Controllers for Digital Dashboard NetCDF Data Source Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('netCDFDataWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================
	$scope.customMenu = [{itemId: 'clearData', itemTxt: 'Clear Data'}];

    $scope.pluginName =	"netCDF Data Source";
	var preDebugMsg = "DigitalDashboard netCDF source: ";

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
	var names = ["", "BYTE", "CHAR", "SHORT", "INT", "FLOAT", "DOUBLE"];
	var sizes = [0, 1, 1, 2, 4, 4, 8];

	$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
	$scope.dataListStyle = {'padding':'10px', 'font-size':fontSize, 'font-family':'arial', 'background-color':'lightgrey', 'color':textColor, 'border':'2px solid #4400aa'};

    //=== EVENT HANDLERS ================================================================

	//===================================================================================
	// On Files Added
	// This event handler takes care of data files being dropped and added to the Webble.
	//===================================================================================
	$scope.onFilesAdded = function(files) {
		$log.log(preDebugMsg + "Files added");

		if(files !== undefined && files.length > 0) {
			data = {};
			data.fieldNames = [];
			data.fieldTypes = [];
			data.columns = [];
			data.metaData = {};
			var f = files[0];
			var reader = new FileReader();
			reader.fileList = files;
			reader.fileIdx = 0;
			reader.onload = function(e) { readerCtlCallback(e, reader);};
			reader.readAsArrayBuffer(f);
		}
	};
	//===================================================================================


	//===================================================================================
	// Reader Control Callback
	// This event handler manages the callback call from the finished file reader in
	// order to access, parse and interpret the NetCDF data.
	//===================================================================================
	function readerCtlCallback(e, reader) {
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
				data.fieldTypes.push(info[f][1]);
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

			// -----------------------------------------
			// read header
			// -----------------------------------------
			var ZERO = 0;
			var NC_DIMENSION = 10;
			var NC_VARIABLE = 11;
			var NC_ATTRIBUTE = 12;
			var recordDimension = -1;
			var offset = 4;

			// -----------------------------------------
			// header: read numrecs
			// -----------------------------------------
			var numrecs = dv.getUint32(offset, false);
			offset += 4;

			// -----------------------------------------
			// header: read dim_array
			// -----------------------------------------
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

				// -----------------------------------------
				// header, dim_array: read all dimensions
				// -----------------------------------------
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
						$log.log(preDebugMsg + "Found record dimension? dim " + d + " has dim length " + l);
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

			// -----------------------------------------
			// header: read gatt_array // global attributes
			// -----------------------------------------
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

				// -----------------------------------------
				// header, read gatt_array: read each global attribute
				// -----------------------------------------
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
						// do nothing
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

			// -----------------------------------------
			// header: read var_array
			// -----------------------------------------
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

				// -----------------------------------------
				// header, read var_array: read each variable
				// -----------------------------------------
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

					// ---------------------------
					// read vatt_array
					// ---------------------------
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

						// -----------------------------------------
						// header, read var_array, read vatt_array: read each variable attribute
						// -----------------------------------------
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
								//do nothing
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
					}
					else {
						dataFileIsCorrupt = true;
					}

					// ---------------------------
					// end of read vatt_array
					// ---------------------------

					// read type
					var varType = dv.getUint32(offset, false);
					offset += 4;
					if(varType > 0 && varType < 7) {
						//do nothing
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

			// -----------------------------------------
			// read data
			// -----------------------------------------
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
								$log.log(preDebugMsg + "reading one 64 bit float: " + temp1.toString(16) + " " + temp2.toString(16) + " and got " + val + " at offset " + myOffset + " (" + (myOffset % 4) + " " + (myOffset % 8) + ")");
								var dddd = new Date(1858,11,17);
								var dddd2 = new Date(dddd.getTime() + 24*60*60*1000 * val);
								$log.log(preDebugMsg + "if 64 bit float is days since 1858-11-17, this represents " + dddd2);

								myOffset += 8;
								break;
							default:
								dataFileIsCorrupt = true;
						}

						if(t == 2) {
							values = String.fromCharCode(values);
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

						values = val;

						if(offset % 4 != 0) {
							offset += 4 - (offset % 4);
						}
					}
					else { // not scalar
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
							}
							else {
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
						data.fieldTypes.push(myType);
						data.columns.push([]);
					}

					data.columns[field].push(values);
					maxOffset = Math.max(maxOffset, varArray[v][5] + varArray[v][4]);
				}
			}

			// read records
			var noofRecords = 0;
			offset = maxOffset;

			for(var rec = 0; !dataFileIsCorrupt && rec < numrecs; rec++) {
				for(var v = 0; !dataFileIsCorrupt && v < varArray.length; v++) {
					var dimIdLs = varArray[v][1];

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
							data.fieldTypes.push("number");
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

							if(offset % 4 != 0) {
								offset += 4 - (offset % 4);
							}

						}
						else { // not scalar
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
						data.fieldTypes[field] = myType;
					}
				}
				noofRecords++;
			}

			// do something with records
			$log.log(preDebugMsg + "found " + noofRecords + " records in the file");
		}

		if(dataFileIsCorrupt) {
			$log.log(preDebugMsg + "ERROR: File is not a correctly formatted netCDF file, " + myFileName);
			data = {};
			data.fieldNames = [];
			data.fieldTypes = [];
			data.columns = [];
			data.metaData = {};
		}

		var foundSomething = false;

		for(var i = reader.fileIdx + 1; !foundSomething && i < reader.fileList.length; i++) {
			foundSomething = true;
			var f = reader.fileList[i];
			var reader2 = new FileReader();
			reader2.fileList = reader.fileList;
			reader2.fileIdx = i;
			reader2.onload = function(e) { readerCtlCallback(e, reader2);};
			reader2.readAsArrayBuffer(f);
		}

		if(!foundSomething) {
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
	// Get Information From NetCDF File Name
	// This method extracts information from the NetCDF file name.
	//===================================================================================
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
	};
	//===================================================================================


	//===================================================================================
	// Check If NetCDF
	// This method checks whether the file dropped is actuallu a NetCDF file.
	//===================================================================================
	function checkIfNetCDF(dv) {
		$log.log(preDebugMsg + "Check if file is netCDF");
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
	};
	//===================================================================================


	//===================================================================================
	// Parse Data Helper
	// This method helps with the parsing of the NetCDF data.
	//===================================================================================
	var parseDataHelper = function(data) {
		// if($scope.theInitiationState_ >= Enum.bitFlags_InitStates.InitFinished) {
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
			$log.log(preDebugMsg + "Could not parse data correctly.");
			setsJSON.sets = [];
			$scope.set("ProvidedFormat", resJSON);
			$scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
			$scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};

			// $scope.displayText = dispText + ": " + fileName + " corrupt";
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
				//do nothing
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
