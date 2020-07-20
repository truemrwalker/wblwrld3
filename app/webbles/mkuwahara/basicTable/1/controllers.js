//======================================================================================================================
// Controllers for Basic Table for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('tableCtrl', function($scope, $log, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        tableContainer: ['background-color'],
        tableroot: ['color', 'font-family'],//, 'border', 'background-color'],
        tableheader: ['background-color', 'color', 'font-family', 'font-size']
    };

    $scope.customMenu = [
        {itemId: 'addRow', itemTxt: 'Add Row'},
        {itemId: 'removeRow', itemTxt: 'Delete Row'},
        {itemId: 'addCol', itemTxt: 'Add Column'},
        {itemId: 'removeCol', itemTxt: 'Delete Column'}
    ];

    $scope.headersOrder = ["Name", "Surname", "City"];

    $scope.initHeadersOrder = "Name,Surname,City";
    $scope.initTableData = {
        tabledata: [
            {Name: "Hans", Surname: "Mueller", City: "Leipzig"},
            {Name: "Dieter", Surname: "Zumpe", City: "Berlin"},
            {Name: "Bernd", Surname: "Danau", City: "Muenchen"}
        ]
    };
    var blankTable = {tabledata: []};

    var latestClick = {
        rowIndex: undefined,
        colName: undefined
    };

    $scope.cellEdit = {
        cellName: "",
        newVal: "",
        colIndex: undefined
    };




    //=== EVENT HANDLERS ================================================================

    //========================================================================================
    // Change Sorting
    //========================================================================================
    $scope.changeSorting = function(column, index) {
        if($scope.cellEdit.cellName != index + '_-1'){
            var rowOrderBy = $scope.gimme('rowOrderBy');
            var rowOrderIsReversed = $scope.gimme('rowOrderIsReversed');
            if (rowOrderBy == column) {
                $scope.set('rowOrderIsReversed', !rowOrderIsReversed);
            } else {
                $scope.set('rowOrderBy', column);
                $scope.set('rowOrderIsReversed', false);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Remember Click
    //========================================================================================
    $scope.rememberClick = function(rowIndex, colName){
        if($scope.ctrlKeyIsDown){
            var newCellName = colName + '_' + rowIndex;
            if($scope.cellEdit.cellName == newCellName){
                $scope.cellEdit.cellName = "";
            }
            else{
                $scope.cellEdit.cellName = newCellName;
            }
			$scope.set('selectedCellContent', '');
        }
		else{
			if($scope.cellEdit.cellName == ""){
				var thePrevCell = $scope.theView.parent().find("#" + latestClick.colName + "_" + latestClick.rowIndex);
				var theCurrentCell = $scope.theView.parent().find("#" + colName + "_" + rowIndex);
				thePrevCell.css('border', $scope.gimme('tableBorder'));
				theCurrentCell.css('border', $scope.gimme('selectedCellBorder'));
				$scope.set('selectedCellContent', theCurrentCell.find("span").text());
			}
		}

        latestClick.rowIndex = rowIndex;
        latestClick.colName = colName;
    };
    //========================================================================================

    //========================================================================================
    // Close Edit
    //========================================================================================
    $scope.closeEdit = function(){
        $scope.cellEdit.cellName = "";
    };
    //========================================================================================




    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			var newVal = eventData.slotValue;
			if(eventData.slotName == 'headersOrder'){
				if(newVal.search){
					var workList = [];
					if(newVal.search(';') != -1){
						workList = newVal.split(';');
					}
					else if(newVal.search(',') != -1){
						workList = newVal.split(',');
					}

					else if(newVal.search(' ') != -1){
						workList = newVal.split(' ');
					}

					if(workList.length > 0){
						$scope.headersOrder = [];
						for(var i = 0; i < workList.length; i++){
							$scope.headersOrder.push(workList[i]);
						}
					}
					else{
						$scope.headersOrder = [];
					}
				}
			}
			else if(eventData.slotName == 'tableData'){
				if(!newVal.tabledata){
					$scope.set('tableData', blankTable);
				}
			}
		});

        $scope.addSlot(new Slot('tableData',
            $scope.initTableData,
            'Table Data',
            'A json string that describes the data to be displayed in the table. Example: {tabledata: [{COLUMN-NAME: "ROW-VALUE"}]}',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

        $scope.addSlot(new Slot('headersOrder',
            $scope.initHeadersOrder,
            'Headers Order',
            'An ordered list of the table headers inside hard brackets [] and divide with comma',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('rowOrderBy',
            $scope.headersOrder[0],
            'Row Order By',
            'Which column to order the rows in the table by',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('rowOrderIsReversed',
            false,
            'Row Order Is Reversed',
            'If checked the order of the rows sorted by the selected column is reversed',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('evenRowBkgColor',
            '#EAF2D3',
            'Even Row Background Color',
            'the background color of every even row',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('oddRowBkgColor',
            '#ffffff',
            'Odd Row Background Color',
            'the background color of every odd row',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('tableBorder',
            '1px solid #98bf21',
            'Table Border',
            'the border of the table',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('cellFontSize',
            '1em',
            'Cell Fontsize',
            'the font size of the text in the table cells',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('cellPadding',
            '3px 15px 2px 7px',
            'Cell Padding',
            'the top - left - bottom - right padding of the cell in relation to the content',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

		$scope.addSlot(new Slot('selectedCellBorder',
			'2px solid orange',
			'Selected Cell Border',
			'The border for a selected cell (clicked on)',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('selectedCellContent',
			'',
			'Selected Cell Content',
			'The content of the current selected cell',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

        $scope.$watch(function(){return $scope.cellEdit.cellName;}, function(newVal, oldVal) {
            if($scope.cellEdit.newVal != $scope.headersOrder[$scope.cellEdit.colIndex]){
                var hoSlot = angular.copy($scope.gimme('headersOrder'));
                var workList = [];
                if(hoSlot.search){
                    if(hoSlot.search(';') != -1){
                        workList = hoSlot.split(';');
                    }
                    else if(hoSlot.search(',') != -1){
                        workList = hoSlot.split(',');
                    }
                    else if(hoSlot.search(' ') != -1){
                        workList = hoSlot.split(' ');
                    }
                }

                var changed = {old: workList[$scope.cellEdit.colIndex], new: $scope.cellEdit.newVal};
                workList[$scope.cellEdit.colIndex] = $scope.cellEdit.newVal;
                $scope.set('headersOrder', workList.toString());

                var tData = angular.copy($scope.gimme('tableData')) ;
                for(var i = 0; i < tData.tabledata.length; i++){
                    var val = tData.tabledata[i][changed.old];
                    tData.tabledata[i][changed.new] = val;
                    delete tData.tabledata[i][changed.old];
                }
                $scope.set('tableData', tData);
            }

            var s = parseInt(newVal.substr(0, newVal.indexOf('_')));
            if(!isNaN(s)){
                $scope.cellEdit.newVal = $scope.headersOrder[s];
                $scope.cellEdit.colIndex = s;
            }
            else{
                $scope.cellEdit.newVal = "";
                $scope.cellEdit.colIndex = undefined;
            }
        }, true);
    };
    //===================================================================================


	//===================================================================================
	// Compare Values
	// Method that compares the table data object array rows by the current sortBy key
	// ether in ascending or descending order and return the result to the Array Sort
	// method that used it.
	//===================================================================================
	function compareValues(key, order = false) {
		return function innerSort(a, b) {
			if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
				// property doesn't exist on either object
				return 0;
			}

			const varA = (typeof a[key] === 'string')
				? a[key].toUpperCase() : a[key];
			const varB = (typeof b[key] === 'string')
				? b[key].toUpperCase() : b[key];

			let comparison = 0;
			if (varA > varB) {
				comparison = 1;
			} else if (varA < varB) {
				comparison = -1;
			}
			return (
				(order === true) ? (comparison * -1) : comparison
			);
		};
	}
	//===================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){

        if(itemName == $scope.customMenu[0].itemId){  //add row
            var newRow = {};
            for(var i = 0; i < $scope.headersOrder.length; i++){
                newRow[$scope.headersOrder[i]] = "---";
            }

            var tData = angular.copy($scope.gimme('tableData')) ;
            tData.tabledata.push(newRow);
            $scope.set('tableData', tData);
        }
        if(itemName == $scope.customMenu[1].itemId){  //delete row
            var tData = angular.copy($scope.gimme('tableData')) ;
			tData.tabledata.sort(compareValues($scope.gimme('rowOrderBy'), $scope.gimme('rowOrderIsReversed')));
			tData.tabledata.splice(latestClick.rowIndex, 1);
            $scope.set('tableData', tData);
        }
        if(itemName == $scope.customMenu[2].itemId){  //add col
            var hData = angular.copy($scope.headersOrder);
            var colName = 'COL_' + (hData.length + 1);
            hData.push(colName);
            $scope.set('headersOrder', hData.toString());

            var tData = angular.copy($scope.gimme('tableData')) ;
            for(var i = 0; i < tData.tabledata.length; i++){
                tData.tabledata[i][colName] = "---";
            }
            $scope.set('tableData', tData);
        }
        if(itemName == $scope.customMenu[3].itemId){  //delete col
            var colIndex;
            for(var i = 0; i < $scope.headersOrder.length; i++){
                if($scope.headersOrder[i] == latestClick.colName){
                    colIndex = i;
                    break;
                }
            }

            if(colIndex){
                var hData = angular.copy($scope.headersOrder) ;
                hData.splice(colIndex, 1);
                $scope.set('headersOrder', hData.toString());

                var tData = angular.copy($scope.gimme('tableData')) ;
                for(var i = 0; i < tData.tabledata.length; i++){
                    delete tData.tabledata[i][latestClick.colName];
                }
                $scope.set('tableData', tData);
            }
        }
    };
    //===================================================================================


    //========================================================================================
    // Get Row Background Color
    //========================================================================================
    $scope.getRowBkgColor = function(rowIndex){
        if((rowIndex+1)%2 == 0){
            return $scope.gimme('evenRowBkgColor');
        }
        else{
            return $scope.gimme('oddRowBkgColor');
        }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
