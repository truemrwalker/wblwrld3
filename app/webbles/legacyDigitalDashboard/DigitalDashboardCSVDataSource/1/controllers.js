//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('csvDataWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

    //=== PROPERTIES ====================================================================

    $scope.customMenu = [];

    $scope.customInteractionBalls = [];

    var myInstanceId = -1;

    var idSlotName = "TheIdSlot";
    var internalIdSlotSet = false;
    var oldIdSlotData = [];

    var fullyLoaded = false;


    var fontSize = 11;
    var visualWidth = 300;
    var textColor = "black";

    var fieldNames = [];
    var fieldTypes = [];
    var noofRows = 0;

    var myCanvasElement = null;
    var myCanvas = null;
    var ctx = null;

    //=== EVENT HANDLERS ================================================================

    $scope.pluginName = "CSV Data Source";
    $scope.dragNdropData = {'fields':[{"name":"No Data", "id":-1, "type":"none"}], "rows":0, "cols":0, "file":""};
    $scope.dataListStyle = {'padding':'10px', 'font-size':fontSize, 'font-family':'arial', 'background-color':'lightgrey', 'color':textColor, 'border':'2px solid #4400aa', 'width':visualWidth + 'px'};

    //=== METHODS & FUNCTIONS ===========================================================

    $scope.fixDraggable = function () {
        $timeout(function()
		 {	
		     $scope.theView.find(".digitalDashboardCSVSourceDataDrag").draggable({  
			 helper:"clone"
		     });
		 }, 1);
    };


    $scope.doDebugLogging = true;
    function debugLog(message) {
	if($scope.doDebugLogging) {
	    $log.log("DigitalDashboard CSV source: " + message);
	}
    };


    var parseData = function() {
	// if($scope.theInitiationState_ >= Enum.bitFlags_InitStates.InitFinished) { 
	if(!fullyLoaded) {
	    return;
	}
	
	// debugLog("parseData()");

	var fieldNameString = "";
        try
        {
	    fieldNameString = $scope.gimme("DataNames");
        }
        catch (Exception)
        {
	    fieldNameString = "";
        }
        var fieldTypeString = "";
        try
        {
	    fieldTypeString = $scope.gimme("DataTypes");
        }
        catch (Exception)
        {
	    fieldTypeString = "";
        }

        var slotList = $scope.getSlots();
        var typeMap = {};

        var slotsToAdd = [];

        var fieldNamesV = fieldNameString.trim().replace(";", "").split(',');
        var fieldTypesV = fieldTypeString.trim().replace(";", "").split(',');

        fieldNames = [];
        fieldTypes = [];
	noofRows = 0;

        var vectorsForSlots = [];
        var theIdList = [];

        typeMap[idSlotName] = "ID";

        // if (firstTime && idSlotName in slotList)
        // {
        //     RemoveSlot(idSlotName);
        // }
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
	setsJSON.sets.push({"name":"CSVSet", "fieldList":fieldsJSON, "idSlot":idSlotName});
	resJSON["format"] = setsJSON;
	
        var XMLlist = [];
        var metadataAddedFlags = [];

        if($scope.pluginName)
        {
	    setsJSON.sets[0]["name"] = $scope.pluginName;
        }

        var dataIsCorrupt = false;

        if (fieldNamesV.length != fieldTypesV.length)
        {
	    dataIsCorrupt = true;
        }

        var p1 = 0;
        var p2 = p1 + 1;

	/////////////////////////////////////////////////////////
	///////  Check field names and field types //////////////
	/////////////////////////////////////////////////////////

        if (!dataIsCorrupt)
        {
	    var dataString = $scope.gimme("Data");
	    
	    while (p2 < dataString.length && dataString[p2] != ';')
	    {
                p2++;
	    }
	    if (p2 < dataString.length)
	    {
                var firstRow = dataString.substr(p1, p2 - p1);

                var items = firstRow.split(',');

                for (var i = 0; i < items.length; i++)
                {
		    var fname = "";
		    if (i < fieldNamesV.length)
		    {
                        fname = fieldNamesV[i];
		    }
		    else
		    {
                        fname = "F" + i;
		    }

		    if (i == fieldNamesV.length - 1 && fname[fname.length - 1] == ';')
		    {
                        fname = fname.replace(";", "");
		    }

		    if (fieldNames.indexOf(fname) < 0)
		    {
                        fieldNames.push(fname);
		    }
		    else
		    {
                        var j = 0;
                        var nn = fname + j;
                        while (fieldNames.indexOf(nn) >= 0)
                        {
			    j++;
			    nn = fname + j;
                        }
                        fieldNames.push(nn);
                        fname = nn;
		    }

		    var ftype = "";

		    if (i < fieldTypesV.length)
		    {
                        ftype = fieldTypesV[i];

                        if (i == fieldTypesV.length - 1 && ftype[ftype.length - 1] == ';')
                        {
			    ftype = ftype.replace(";", "");
                        }
		    }
		    else
		    {
                        ftype = "string";
		    }

		    fieldTypes.push(ftype);
		    
		    var slotName = fname + "Slot";
		    slotName = "DataSlot" + i;

		    // if (firstTime && slotList.indexOf(slotName) >= 0)
		    // {
		    //     RemoveSlot(slotName);
		    // }

		    if (!(slotName in slotList))
		    {
                        slotsToAdd.push(slotName);
		    } else {
			$scope.getSlot(slotName).setDisabledSetting(Enum.SlotDisablingState.AllVisibility);
		    }

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
	    else
	    {
                dataIsCorrupt = true;
	    }
        }

	/////////////////////////////////////////////////////////
	///////  Create Slots ///////////////////////////////////
	/////////////////////////////////////////////////////////

        if (!dataIsCorrupt)
        {
	    // // Do this if we want to pre-allocate the arrays to their final size
	    // var countRows = 0;
	    // p1 = 0;
	    // var moreLines = true;
	    // while (moreLines)
	    // {
	    //     p2 = p1 + 1;
	    //     while (p2 < dataString.length && dataString[p2] != ';')
	    //     {
	    //         p2++;
	    //     }

	    //     if (p2 < dataString.length)
	    //     {
	    //         countRows++;

	    //         p1 = p2;
	    //         while (p1 < dataString.length && (dataString[p1] == '\n' || dataString[p1] == ';'))
	    //         {
	    //             p1++;
	    //         }

	    //         if (p1 >= dataString.length)
	    //         {
	    //             moreLines = false;
	    //         }
	    //     }
	    //     else
	    //     {
	    //         moreLines = false;
	    //     }
	    // } // while more lines

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

	    vectorsForSlots = [];
	    vectorsForSlots.length = fieldTypes.length;

	    for (sIdx = 0; sIdx < fieldTypes.length; sIdx++)
	    {
		var ftype = fieldTypes[sIdx];
		
		vectorsForSlots[sIdx] = [];
	    }

	    
	    var id = 0;
	    p1 = 0;
	    var moreLines = true;
	    while (moreLines)
	    {
                p2 = p1 + 1;
                while (p2 < dataString.length && dataString[p2] != ';')
                {
		    p2++;
                }

                if (p2 < dataString.length)
                {
		    var row = dataString.substr(p1, p2 - p1);

		    id++;

		    theIdList.push(id);

		    var items = row.split(',');

		    if (items.length != fieldNames.length)
		    {
                        dataIsCorrupt = true;
                        break;
		    }

		    for (i = 0; i < items.length; i++)
		    {
                        var ftype = fieldTypes[i];

                        var value = items[i];

                        if (ftype == "integer")
                        {
			    try
			    {
                                if (value === "")
                                {
				    vectorsForSlots[i].push(null);
                                }
                                else
                                {
				    vectorsForSlots[i].push(parseInt(value));
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
				    vectorsForSlots[i].push(null);
                                }
                                else
                                {
				    vectorsForSlots[i].push(Number(value));
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
				    vectorsForSlots[i].push(null);
                                }
                                else
                                {
				    var dateTemp = Date.parse(value);
				    if(isNaN(dateTemp)) {
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
				    vectorsForSlots[i].push(dateTemp);
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
                                vectorsForSlots[i].push(null);
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
				    vectorsForSlots[i].push(vec);
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
                                        if (!metadataAddedFlags[i])
                                        {
					    var metaDataString = metadata.join(",");
					    XMLlist[i]["metadata"] = metaDataString;
					    metadataAddedFlags[i] = true;
                                        }
                                        vectorsForSlots[i].push(vec);
				    }
                                }
			    }
                        }
                        else if (ftype == "string" || ftype == "text")
                        {
			    try
			    {
                                vectorsForSlots[i].push(value);
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
                                vectorsForSlots[i].push(value);
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

		    p1 = p2;
		    while (p1 < dataString.length && (dataString[p1] == '\n' || dataString[p1] == ';'))
		    {
                        p1++;
		    }

		    if (p1 >= dataString.length)
		    {
                        moreLines = false;
		    }
                }
                else
                {
		    moreLines = false;
                }
	    } // while more lines


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

		noofRows = theIdList.length;
		
		internalIdSlotSet = true;
		oldIdSlotData = theIdList;
                $scope.set(idSlotName, theIdList);
		internalIdSlotSet = false;
	    }
        }

        if (dataIsCorrupt)
        {
	    $scope.dragNdropData.fields = [{"name":"No Data", "id":-1}];
	    setsJSON.sets = [];
	    $scope.set("ProvidedFormat", resJSON);
	    $scope.set("ProvidedFormatChanged", !$scope.gimme("ProvidedFormatChanged"));
	    // $scope.tellParent['ProvidedFormat'] = true;
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
        }

        // firstTime = false;
	updateView();

        $timeout(function()
		 {	
		     $scope.fixDraggable();
		 },1);
    };


    function updateView() {
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
	newStyle.width = visualWidth + "px";

	$scope.dataListStyle = newStyle;
    }

    function mySlotChange(eventData) {
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
    	    case "DataTypes":
    		parseData();
    		break;
    	    case "DataNames":
    		parseData();
    		break;

    	    case "PluginName":
		var newVal = eventData.slotValue;
		$scope.pluginName = newVal;
		// updateView();
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
    	    case "Width":
		visualWidth = parseInt($scope.gimme("Width"));
		if(visualWidth < 50) {
		    visualWidth = 50;
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
				"1,2,3;2,2,2;3,3,3;3,2,1;",
				'Data',
				'The CSV data.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));

        $scope.addSlot(new Slot('FontSize',
				fontSize,
				"Font Size",
				'The font size to use in the Webble interface.',
				$scope.theWblMetadata['templateid'],
				undefined,
				undefined
			       ));

        $scope.addSlot(new Slot('Width',
				visualWidth,
				"Width",
				'The width of the Webble on screen.',
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
	
        $scope.addSlot(new Slot('DataTypes',
				"number,number,number;",
				'Data Types',
				'Description of the CSV data.',
				$scope.theWblMetadata['templateid'],
				undefined,                                 
				undefined
			       ));
	
        $scope.addSlot(new Slot('DataNames',
				"FirstField,Field2,Last;",
				'Data Names',
				'Description of the CSV data.',
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
	
        $scope.setDefaultSlot('');

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

        $timeout(function()
		 {	
		     $scope.fixDraggable();
		 },1);
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
