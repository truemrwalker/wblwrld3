//======================================================================================================================
// Controllers for Charts for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('ChartsCtrl', function($scope, $log, $timeout, Slot, Enum, gettext, isEmpty, localStorageService) {

    //=== PROPERTIES ====================================================================
    $scope.canvasSize = {
        width: 300,
        height: 300
    };

    $scope.stylesToSlots = {
        chartHolder: ['background-color', 'border', 'padding']
    };

    var exampleDataBarLike = {
        labels : ["January","February","March","April","May","June","July"],
        datasets : [
            {
                fillColor : "rgba(220,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
                pointColor : "rgba(220,220,220,1)",
                pointStrokeColor : "#fff",
                data : [65,59,90,81,56,55,40]
            },
            {
                fillColor : "rgba(151,187,205,0.5)",
                strokeColor : "rgba(151,187,205,1)",
                pointColor : "rgba(151,187,205,1)",
                pointStrokeColor : "#fff",
                data : [28,48,40,19,96,27,100]
            }
        ]
    };

	var emptyChart = {
		labels : [],
		datasets : [
		]
	};

    var exampleDataPieLike = {
        "dataset":[
            {
                value : 30,
                color: "#D97041"
            },
            {
                value : 90,
                color: "#C7604C"
            },
            {
                value : 24,
                color: "#21323D"
            },
            {
                value : 58,
                color: "#9D9B7F"
            },
            {
                value : 82,
                color: "#7D4F6D"
            },
            {
                value : 8,
                color: "#584A5E"
            }
        ]
    };

    var options = {};
    var ctx;



    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        ctx = $scope.theView.parent().find("#theChart").get(0).getContext("2d");

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'chartWidth'){
				$scope.canvasSize.width = parseInt(eventData.slotValue);
				$timeout(function(){drawChart($scope.gimme('dataObject'), $scope.gimme('chartType'));}, 200);
			}
			else if(eventData.slotName == 'chartHeight'){
				$scope.canvasSize.height = parseInt(eventData.slotValue);
				$timeout(function(){drawChart($scope.gimme('dataObject'), $scope.gimme('chartType'));}, 200);
			}
			else if(eventData.slotName == 'dataObject'){
				drawChart(eventData.slotValue, $scope.gimme('chartType'));
			}
			else if(eventData.slotName == 'chartType'){
				drawChart($scope.gimme('dataObject'), eventData.slotValue);
			}
		});


        $scope.addSlot(new Slot('dataObject',
            exampleDataBarLike,
            gettext("Data"),
            gettext("The json data that is used to draw this chart"),
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

        $scope.addSlot(new Slot('chartType',
            0,
            gettext("Chart Type"),
            gettext("The chart type, such as bar, line pie etc"),
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Line', 'Bar', 'Radar', 'Polar', 'Pie', 'Doughnut']},
            undefined
        ));

        $scope.addSlot(new Slot('chartWidth',
            $scope.canvasSize.width,
            gettext("Chart Width"),
            gettext("The chart width"),
            $scope.theWblMetadata['templateid'],
            undefined,
            $scope.theView.parent().find("#theChart")
        ));

        $scope.addSlot(new Slot('chartHeight',
            $scope.canvasSize.height,
            gettext("Chart Heigh"),
            gettext("The chart height"),
            $scope.theWblMetadata['templateid'],
            undefined,
            $scope.theView.parent().find("#theChart")
        ));

        $scope.setDefaultSlot('dataObject');
        $scope.setResizeSlots('chartWidth', 'chartHeight');
    };
    //===================================================================================


    //========================================================================================
    // Draw Chart
    // Draws the chart as specified
    //========================================================================================
    var drawChart = function(chartData, chartType){
		if(isEmpty(chartData)){
			chartData = emptyChart;
			$log.log("Empty Data");
		}

		if(ctx){
            if(!chartData.datasets && !chartData.dataset){
                chartData = JSON.parse(chartData);
            }

            if(chartType < 3 && !chartData.datasets){
                $scope.set('dataObject', exampleDataBarLike);
            }
            else if(chartType > 2 && !chartData.dataset){
                $scope.set('dataObject', exampleDataPieLike);
            }
            else{
                switch (chartType){
                    case 0: //Line
                        new Chart(ctx).Line(chartData,options);
                        break;
                    case 1: //Bar
                        new Chart(ctx).Bar(chartData,options);
                        break;
                    case 2: //Radar
                        new Chart(ctx).Radar(chartData,options);
                        break;
                    case 3: //Polar
                        new Chart(ctx).PolarArea(chartData.dataset,options);
                        break;
                    case 4: //Pie
                        new Chart(ctx).Pie(chartData.dataset,options);
                        break;
                    case 5: //Doughnut
                        new Chart(ctx).Doughnut(chartData.dataset,options);
                        break;
                }
            }
        }
    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
