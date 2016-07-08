//======================================================================================================================
// Controllers for Charts for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('GenChartsCtrl', function($scope, $log, $timeout, $modal, $window, Slot, Enum, isEmpty, jsonQuery, isExist) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        chartHolder: ['background-color', 'border', 'padding', 'width', 'height'],
		theChart: ['background-color']
    };

	//TODO: Array of custom menu item keys and display names
	//$scope.customMenu = [{itemId: '[MENU ITEM ID]', itemTxt: '[MENU ITEM DISPLAY TEXT]'}];
	// EXAMPLE:
	$scope.customMenu = [{itemId: 'empty', itemTxt: 'Reset to Empty Chart'}, {itemId: 'example', itemTxt: 'Reset to Example Chart'}, {itemId: 'chartJsDocs', itemTxt: 'Chart.js Docs'}];

	var chartTypes = { line: 'Line', scatterPlot: 'Scatter Plot', bar: 'Bar - Vertical', horizontalBar: 'Bar - Horizontal', radar: 'Radar', polarArea: 'Polar', pie: 'Pie', doughnut: 'Doughnut' };
	var lastDrawTime = 0;
	var ctx;
	var canvasElement;
	var theChart;
	var gradient;

	// background images
	var bkgImgs = [];
	var imgUrls = [];
	var bkgImgsLoadedCounter = 0;
	var readyToDrawImages = false;

	// Empty Chart
	var emptyChart = { labels: [], datasets: [{ label: "Empty Dataset", data: [] }] };

	// Default Chart Settings
	var defaultChartSettings = {
		fill: false,
		lineTension: 0.3,
		borderCapStyle: 'butt',
		borderDash: [],
		borderDashOffset: 0.0,
		borderJoinStyle: 'miter',  // Options: 'round', 'bevel', 'miter'
		borderSkipped: [],	//String or Array<String>, Options are 'bottom', 'left', 'top', and 'right'
		pointBorderColor: "rgba(75,192,192,1)",
		pointBackgroundColor: "#fff",
		pointBorderWidth: 1,
		pointHoverRadius: 5,
		pointHoverBackgroundColor: "rgba(75,192,192,1)",
		pointHoverBorderColor: "rgba(220,220,220,1)",
		pointHoverBorderWidth: 2,
		pointRadius: 5,
		pointHitRadius: 10,
		pointStyle: 'triangle'	//String, Array<String>, Image, Array<Image> - The style of point. Options are 'circle', 'triangle', 'rect', 'rectRot', 'cross', 'crossRot', 'star', 'line', and 'dash'.
	};

	// Default Options
	var defaultVisualizationOptions = {
		title: {
			display: null,
			position: null,
			fullWidth: null,
			fontSize: null,
			fontFamily: null,
			fontColor: null,
			fontStyle: null,
			padding: null,
			text: null
		},
		legend: {
			display: null,
			position: null,
			fullWidth: null,
			onClick: null,
			labels: {
				boxWidth: null,
				fontSize: null,
				fontStyle: null,
				fontColor: null,
				fontFamily: null,
				padding: null
			}
		},
		tooltips: {
			enabled: null,
			custom: null,
			mode: null,
			backgroundColor: null,
			titleFontFamily: null,
			titleFontSize: null,
			titleFontStyle: null,
			titleFontColor: null,
			titleSpacing: null,
			titleMarginBottom: null,
			bodyFontFamily: null,
			bodyFontSize: null,
			bodyFontStyle: null,
			bodyFontColor: null,
			bodySpacing: null,
			footerFontFamily: null,
			footerFontSize: null,
			footerFontStyle: null,
			footerFontColor: null,
			footerSpacing: null,
			footerMarginTop: null,
			xPadding: null,
			yPadding: null,
			caretSize: null,
			cornerRadius: null,
			multiKeyBackground: null,
			callbacks: {
				beforeTitle: null,
				title: null,
				afterTitle: null,
				beforeBody: null,
				beforeLabel: null,
				label: null,
				afterLabel: null,
				afterBody: null,
				beforeFooter: null,
				footer: null,
				afterFooter: null
			}
		}
	};
	var defaultScaleOptions = {
		xAxes: [{
			type: null, //Options: "category", "linear", "logarithmic", "time", "radialLinear"
			display: null,
			position: null,	//Possible values are 'top', 'left', 'bottom' and 'right'.
			ticks: {
				beginAtZero: null,
				min: null,
				max: null,
				display: null,
				fontColor: null,
				fontFamily: null,
				fontSize: null,
				fontStyle: null,
				mirror: null,
				reverse: null,
				maxTicksLimit: null,
				stepSize: null
			},
			gridLines: {
				display: null,
				color: null,
				lineWidth: null,
				zeroLineWidth: null,
				zeroLineColor: null
			},
			scaleLabel: {
				display: null,
				labelString: null,
				fontColor: null,
				fontFamily: null,
				fontSize: null,
				fontStyle: null
			},
			time: { // X-Axis Only
				max: null,
				min: null,
				tooltipFormat: null,
				unit: null, // options: "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year"
				unitStepSize: null
			}
		}],
		yAxes: [{
			type: null, //Options: "category", "linear", "logarithmic", "time", "radialLinear"
			display: null,
			position: null,	//Possible values are 'top', 'left', 'bottom' and 'right'.
			ticks: {
				beginAtZero: null,
				min: null,
				max: null,
				display: null,
				fontColor: null,
				fontFamily: null,
				fontSize: null,
				fontStyle: null,
				mirror: null,
				reverse: null,
				maxTicksLimit: null,
				stepSize: null
			},
			gridLines: {
				display: null,
				color: null,
				lineWidth: null,
				zeroLineWidth: null,
				zeroLineColor: null
			},
			scaleLabel: {
				display: null,
				labelString: null,
				fontColor: null,
				fontFamily: null,
				fontSize: null,
				fontStyle: null
			}
		}]
	};
	var defaultAdvancedOptions = {
		onClick: null,
		hover: {
			mode: null,
			animationDuration: null,
			onHover: null
		},
		animation: {
			duration: null,
			easing: null,
			onProgress: null,
			onComplete: null
		}
	};

	// chart example data
	var exampleChart = {
		dataValueLabels: ["January","February","March","April","May","June"],
		chartData: [16,32,64,17,98,44],
		datasetLabels: ["My Score"],
		datasetBkgColors: [
			'rgba(255, 99, 132, 0.2)',
			'rgba(54, 162, 235, 0.2)',
			'rgba(255, 206, 86, 0.2)',
			'rgba(75, 192, 192, 0.2)',
			'rgba(153, 102, 255, 0.2)',
			'rgba(255, 159, 64, 0.2)'
		],
		datasetBorderColors: [
			'rgba(255,99,132,1)',
			'rgba(54, 162, 235, 1)',
			'rgba(255, 206, 86, 1)',
			'rgba(75, 192, 192, 1)',
			'rgba(153, 102, 255, 1)',
			'rgba(255, 159, 64, 1)'
		],
		datasetBorderWidth: 2
	};



	//=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        ctx = $scope.theView.parent().find("#theChart");
		canvasElement = ctx[0].getContext('2d');

        $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'chartType'){
				if($scope.getSlot('yAxisSettings')){  //If all slots have been created
					if($scope.gimme("chartType") > jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){
						$scope.getSlot('showLines').setDisabledSetting(Enum.SlotDisablingState.PropertyVisibility);
					}
					else{
						$scope.getSlot('showLines').setDisabledSetting(Enum.SlotDisablingState.None);
					}
				}
				$timeout(function(){ drawChart(); });
			}
			else if(eventData.slotName == 'gradientBkgColorArea'){
				var isOk = false;
				if(Array.isArray(eventData.slotValue) && !isEmpty(eventData.slotValue)){
					isOk = true;
					for(var i = 0; i < eventData.slotValue.length; i++){
						if(Array.isArray(eventData.slotValue[i])){
							for(var k = 0; k < eventData.slotValue[i].length; k++){
								if(eventData.slotValue[i][k].x == undefined || eventData.slotValue[i][k].y == undefined){
									isOk = false;
									break;
								}
							}
						}
						else if(eventData.slotValue[i].x == undefined || eventData.slotValue[i].y == undefined){
							isOk = false;
							break;
						}
					}
				}
				if(!isOk){
					$scope.set("gradientBkgColorArea", [{x: 0, y: 0}, {x: 0, y: 600}]);
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else if(eventData.slotName == 'patternBkgImage'){
				bkgImgs = [];
				bkgImgsLoadedCounter = 0;
				if(!isEmpty(eventData.slotValue)){
					imgUrls = eventData.slotValue;
					for (var i = 0; i < imgUrls.length; i++) {
						var img = new Image();
						img.onload = function() {
							++bkgImgsLoadedCounter;
							if (bkgImgsLoadedCounter >= imgUrls.length) {
								readyToDrawImages = true;
								$timeout(function(){ drawChart(); });
							}
						};
						img.src = imgUrls[i];
						bkgImgs.push(img);
					}
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else if(eventData.slotName == 'chartSettings'){
				if(isEmpty(eventData.slotValue)){
					$scope.set("chartSettings", defaultChartSettings);
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else if(eventData.slotName == 'xAxisSettings' || eventData.slotName == 'yAxisSettings'){
				if(isEmpty(eventData.slotValue)){
					$scope.set(eventData.slotName, ((eventData.slotName == 'xAxisSettings') ? defaultScaleOptions.xAxes[0] : defaultScaleOptions.yAxes[0]));
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else if(eventData.slotName == 'visualizationOptions'){
				if(isEmpty(eventData.slotValue)){
					$scope.set("visualizationOptions", defaultVisualizationOptions);
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else if(eventData.slotName == 'advancedRareOptions'){
				if(isEmpty(eventData.slotValue)){
					$scope.set("advancedRareOptions", defaultAdvancedOptions);
				}
				else{
					$timeout(function(){ drawChart(); });
				}
			}
			else{
				if(eventData.slotName.search("root") == -1) {
					if($scope.getSlot('yAxisSettings')) {  //If all slots have been created
						$timeout(function(){ drawChart(); });
					}
				}
			}
        });

        $scope.addSlot(new Slot('chartType',
			jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.bar),
            "Chart Type",
            "The chart type, such as bar, line, pie etc",
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: jsonQuery.allObjValuesAsArray(chartTypes)},
            undefined
        ));

		$scope.addSlot(new Slot('dataValueLabels',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.dataValueLabels : [],
			"Data Value Labels",
			"A list of labels for each data point (should therefore be as long as the data list)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('chartData',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.chartData : [],
			"Data",
			"The array of data (encapsulated with []) (or a nested array of multiple datasets) that is used to draw this chart",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetLabels',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.datasetLabels : [],
			"Dataset Labels",
			"An array of dataset labels (strings inside quotation marks \" \") \n(equal in amount and same order as the dataset data). \nIf there is only one dataset, only one label is needed",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBkgColors',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.datasetBkgColors : [],
			"Dataset Background Colors",
			"An array of dataset background colors \n(Quotation marked strings in any color format (for example: \"#ffffff\" \"rgba(255,67,250, 0.5)\")) \n(One value is used globaly, multiple is used for each data point in the same order as the dataset data)\n\nIf one color is represented by an array of colors, a gradient will be used",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBorderColors',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.datasetBorderColors : [],
			"Dataset Border Colors",
			"An array of dataset border colors \n(Quotation marked strings in any color format (for example: \"#ffffff\" \"rgba(255,67,250, 0.5)\")) \n(One value is used globaly, multiple is used for each data point in the same order as the dataset data)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBorderWidth',
			(!(theInitWblDef.private && theInitWblDef.private.isNotNewBorn)) ? exampleChart.datasetBorderWidth : [],
			"Dataset Border Width",
			"An array of dataset border widths \n(Quotation marked strings in any color format (for example: \"#ffffff\" \"rgba(255,67,250, 0.5)\")) \n(One value is used globaly, multiple is used for each data point in the same order as the dataset data)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('hoverBkgColor',
			"",
			"Hover Background Color",
			"The background Color of dataset items when the mouse hover over them",
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ColorPick},
			undefined
		));

		$scope.addSlot(new Slot('hoverBorderColor',
			"",
			"Hover Border Color",
			"The Border Color of dataset items when the mouse hover over them",
			$scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ColorPick},
			undefined
		));

		$scope.addSlot(new Slot('hoverBorderWidth',
			2,
			"Hover Border Width",
			"The Border width of dataset items when the mouse hover over them",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('gradientBkgColorArea',
			[{x: 0, y: 0}, {x: 0, y: 600}],
			"Gradient Color Area",
			"The start point and end point for the gradient background color fill effect. Can be a nested array of multiple start and end points.",
			"Advanced Fill Effects",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('patternBkgImage',
			[],
			"Background Fill Image",
			"The image for the background pattern fill effect. Can be an array of multiple images.",
			"Advanced Fill Effects",
			undefined,
			undefined
		));

		//Chart Type Specific Slots
		$scope.addSlot(new Slot('chartSettings',
			defaultChartSettings,
			"Chart Settings",
			"A set of chart specific settings, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\n[borderJoinStyle Options: 'round', 'bevel' or 'miter']. \n[pointStyle Options: (array is OK) 'circle', 'triangle', 'rect', 'rectRot', 'cross', 'crossRot', 'star', 'line', or 'dash'].",
			"Basic Chart Settings",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('showLines',
			true,
			"Show Lines",
			"Enables if the Line between the points should be drawn or not",
			"Basic Chart Settings",
			undefined,
			undefined
		));
		if($scope.gimme("chartType") > jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){  //Line, scatter
			$scope.getSlot('showLines').setDisabledSetting(Enum.SlotDisablingState.PropertyVisibility);
		}

		//Advanced Chart Options
		$scope.addSlot(new Slot('xAxisSettings',
			defaultScaleOptions.xAxes[0],
			"Advanced X-Axis Settings",
			"A set of X-Axis specific settings for the more advanced users, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\nFor the hardcore users familiar to the chart.js api who miss any option, just add it and it will be applied. (functions must be strings)",
			"Advanced Chart Settings",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('yAxisSettings',
			defaultScaleOptions.yAxes[0],
			"Advanced Y-Axis Settings",
			"A set of Y-Axis specific settings for the more advanced users, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\nFor the hardcore users familiar to the chart.js api who miss any option, just add it and it will be applied. (functions must be strings)",
			"Advanced Chart Settings",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('visualizationOptions',
			defaultVisualizationOptions,
			"Advanced Visualization Settings",
			"A set of visualization settings for the more advanced users, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\nFor the hardcore users familiar to the chart.js api who miss any option, just add it and it will be applied. (functions must be strings)",
			"Advanced Chart Settings",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('advancedRareOptions',
			defaultAdvancedOptions,
			"Advanced Rare Settings",
			"A set of left-over more unusually needed settings for the much more advanced users, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\nFor the hardcore users familiar to the chart.js api who miss any option, just add it and it will be applied. (functions must be strings)",
			"Advanced Chart Settings",
			{inputType: Enum.aopInputTypes.TextArea},
			undefined
		));

        $scope.setDefaultSlot('chartData');
        $scope.setResizeSlots('chartHolder:width', 'chartHolder:height');
    };
    //===================================================================================


	//========================================================================================
	// Draw Chart
	// Draws the chart as specified
	//========================================================================================
	var drawChart = function(){
		if(((new Date()).getTime() - lastDrawTime) < 200 && !readyToDrawImages){ return; }
		var chartData = $scope.gimme('chartData');
		var chartType = $scope.gimme('chartType');
		var scatterRequested = false;

		if(isEmpty($scope.gimme("chartData"))){ chartType = 2; }
		var chartPack = createChartPack(chartData, chartType);
		if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){ chartType = jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.line); }

		if(theChart){ theChart.destroy(); }
		if(ctx){
			theChart = new Chart(ctx, {
				type: Object.keys(chartTypes)[chartType],
				data: chartPack.content,
				options: chartPack.options
			});
			lastDrawTime = (new Date()).getTime();
		}
	}
	//========================================================================================


	//========================================================================================
	// Create Chart Pack
	// Creates a chart pack object with content json and options based on user settings.
	//========================================================================================
	var createChartPack = function(chartData, chartType){
		var chartPack = {content: emptyChart, options: createOptions(chartType)}

		if(!isEmpty(chartData)){
			var dataSets = [];
			var dataSetLabels = $scope.gimme("datasetLabels");
			if(chartData[0].length != undefined){
				for(var i = 0; i < chartData.length; i++){
					var DSLabel =  (dataSetLabels[i] != undefined ? dataSetLabels[i] : "Dataset " + (i+1));
					dataSets.push(createDatasetObject(chartData[i], chartType, DSLabel, i));
				}
			}
			else{
				dataSets.push(createDatasetObject(chartData, chartType, dataSetLabels[0]));
			}

			chartPack.content = {
				labels: $scope.gimme("dataValueLabels"),
				datasets: dataSets
			};
		}

		return chartPack;
	}
	//========================================================================================


	//========================================================================================
	// Create Dataset Object
	// Creates a dataset object based on user settings and chart type
	//========================================================================================
	var createDatasetObject = function(datasetData, chartType, datasetLabel, indexOfSets){
		var thisSetBkgColor = ($scope.gimme("datasetBkgColors").length == 1) ? $scope.gimme("datasetBkgColors")[0] : $scope.gimme("datasetBkgColors");
		var thisSetBorderColor = ($scope.gimme("datasetBorderColors").length == 1) ? $scope.gimme("datasetBorderColors")[0] : $scope.gimme("datasetBorderColors");
		var thisSetBorderWidth = ($scope.gimme("datasetBorderWidth").length == 1) ? $scope.gimme("datasetBorderWidth")[0] : $scope.gimme("datasetBorderWidth");

		if(indexOfSets != undefined){
			thisSetBkgColor = ($scope.gimme("datasetBkgColors")[indexOfSets] != undefined) ? $scope.gimme("datasetBkgColors")[indexOfSets] : "rgba(0,0,0,0.2)"
			thisSetBorderColor = ($scope.gimme("datasetBorderColors")[indexOfSets] != undefined) ? $scope.gimme("datasetBorderColors")[indexOfSets] : "rgba(0,0,0,1)"
			thisSetBorderWidth = ($scope.gimme("datasetBorderWidth")[indexOfSets] != undefined) ? $scope.gimme("datasetBorderWidth")[indexOfSets] : 1
		}

		var dataSetObj = {
			label: datasetLabel,
			//xAxisID: "",
			//yAxisID: "",
			backgroundColor: thisSetBkgColor,
			borderColor: thisSetBorderColor,
			borderWidth: thisSetBorderWidth,
			hoverBorderWidth: $scope.gimme("hoverBorderWidth"),
			data: datasetData
		}
		if($scope.gimme("hoverBkgColor") != ""){ dataSetObj.hoverBackgroundColor = $scope.gimme("hoverBkgColor"); }
		if($scope.gimme("hoverBorderColor") != ""){ dataSetObj.hoverBorderColor = $scope.gimme("hoverBorderColor"); }

		var bkgColors = $scope.gimme("datasetBkgColors");
		var newColorSet = [];
		var hasGradient = false;
		var gradientBkgColorArea = $scope.gimme("gradientBkgColorArea");
		var gradient;
		for(var i = 0; i < bkgColors.length; i++){
			if(Array.isArray(bkgColors[i])){
				if(!Array.isArray(gradientBkgColorArea[0])){
					gradient = canvasElement.createLinearGradient(gradientBkgColorArea[0].x, gradientBkgColorArea[0].y, gradientBkgColorArea[1].x, gradientBkgColorArea[1].y);
				}
				else if(gradientBkgColorArea[i] != undefined){
					gradient = canvasElement.createLinearGradient(gradientBkgColorArea[i][0].x, gradientBkgColorArea[i][0].y, gradientBkgColorArea[i][1].x, gradientBkgColorArea[i][1].y);
				}
				else{
					gradient = canvasElement.createLinearGradient(gradientBkgColorArea[0][0].x, gradientBkgColorArea[0][0].y, gradientBkgColorArea[0][1].x, gradientBkgColorArea[0][1].y);
				}

				for(var k = 0; k < bkgColors[i].length; k++){
					var colorStopPoint = k / (bkgColors[i].length - 1);
					if(k == 0){ colorStopPoint = 0 }
					else if(k == (bkgColors[i].length - 1)){ colorStopPoint = 1 }
					gradient.addColorStop(colorStopPoint , bkgColors[i][k]);
				}
				newColorSet.push(gradient);
				hasGradient = true;
			}
			else{
				newColorSet.push(bkgColors[i]);
			}
		}
		if(hasGradient){
			dataSetObj.backgroundColor = (newColorSet.length == 1) ? newColorSet[0] : newColorSet;
			if(indexOfSets != undefined){
				var defaultGradient = canvasElement.createLinearGradient(0, 0, 0, 450);
				defaultGradient.addColorStop(0 , "rgba(0,0,0,0.5)");
				defaultGradient.addColorStop(0.5 , "rgba(0,0,0,0.25)");
				defaultGradient.addColorStop(1 , "rgba(0,0,0,0)");
				dataSetObj.backgroundColor = (newColorSet[indexOfSets] != undefined) ? newColorSet[indexOfSets] : defaultGradient;
			}
		}

		if(bkgImgsLoadedCounter > 0 && bkgImgsLoadedCounter >= bkgImgs.length){
			readyToDrawImages = false;
			newColorSet = [];
			for(var i = 0; i < bkgImgs.length; i++){
				var fillPattern = canvasElement.createPattern(bkgImgs[i], 'repeat');
				newColorSet.push(fillPattern);
			}
			if(newColorSet.length > 0){
				dataSetObj.backgroundColor = (newColorSet.length == 1) ? newColorSet[0] : newColorSet
				if(indexOfSets != undefined){
					dataSetObj.backgroundColor = (newColorSet[indexOfSets] != undefined) ? newColorSet[indexOfSets] : "rgba(0,0,0,0.2)";
				}
			}
		}

		var whichSetting = "chartSettings", whichDefSetting = defaultChartSettings;
		if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.line) || chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){
			if(Array.isArray(dataSetObj.backgroundColor)){ dataSetObj.backgroundColor = dataSetObj.backgroundColor[0]; }
			if(Array.isArray(dataSetObj.borderColor)){ dataSetObj.borderColor = dataSetObj.borderColor[0]; }
			if(Array.isArray(dataSetObj.borderWidth)){ dataSetObj.borderWidth = dataSetObj.borderWidth[0]; }

			if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){
				var cd = $scope.gimme("chartData");
				if(!(cd.length > 0 && cd[0].x != undefined  && cd[0].y != undefined)){
					var modalInstance = $modal.open({templateUrl: 'askDataConversion-form.html', windowClass: 'modal-wblwrldform small'});
					modalInstance.result.then(function () {
						$timeout(function(){
							var cd = $scope.gimme("chartData");
							for(var i = 0; i < cd.length; i++){ cd[i] = {x: cd[i], y: cd[i]}; }
							$scope.gimme("chartData", cd);
						});
					}, function () { });
				}
			}
		}

		if(whichSetting != "" && whichDefSetting != undefined){
			var slot_ChartSetting = $scope.gimme(whichSetting);
			for(var item in whichDefSetting){
				var value = (slot_ChartSetting[item] != undefined) ? slot_ChartSetting[item] : whichDefSetting[item];

				// $SLOTNAME$ ?
				var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_ChartSetting[item]));
				if(slotValue != undefined){ value = slotValue; }

				// $gimme(SLOTNAME) ?
				var slotValue = $scope.gimme(item);
				if(slotValue != undefined){ value = slotValue; }

				dataSetObj[item] = value;
			}
		}

		return dataSetObj;
	}
	//========================================================================================



	//========================================================================================
	// Create Options
	// Creates a option object based on user settings and chart type
	//========================================================================================
	var createOptions = function(chartType){
		var chartOptions = { title: {}, legend: {}, tooltips: {} };

		if(!isEmpty($scope.gimme("chartData"))){
			chartOptions.maintainAspectRatio = false;

			// Scales X-Axis & Y-Axis Options
			chartOptions.scales = { xAxes: [{}], yAxes: [{}] };
			var axisSlots = ['xAxisSettings', 'yAxisSettings'];
			for(var i = 0; i < axisSlots.length; i++){
				var collectedAxisSettings = {};
				var slot_AxisSettings = $scope.gimme(axisSlots[i]);
				for(var item in slot_AxisSettings){
					if(typeof slot_AxisSettings[item] == 'object' && slot_AxisSettings[item] != null){
						for(var innerItem in slot_AxisSettings[item]){
							if(slot_AxisSettings[item][innerItem] != null){
								if(collectedAxisSettings[item] == undefined){collectedAxisSettings[item] = {};}

								// $SLOTNAME$ ?
								var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_AxisSettings[item][innerItem]));
								if(slotValue != undefined){ collectedAxisSettings[item][innerItem] = slotValue; }

								if(collectedAxisSettings[item][innerItem] == undefined){
									collectedAxisSettings[item][innerItem] = slot_AxisSettings[item][innerItem];
								}
							}

							// $gimme(SLOTNAME) ?
							var slotValue = $scope.gimme(innerItem);
							if(slotValue != undefined){
								if(collectedAxisSettings[item] == undefined){collectedAxisSettings[item] = {};}
								collectedAxisSettings[item][innerItem] = slotValue;
							}
						}
					}
					else if(slot_AxisSettings[item] != null){
						// $SLOTNAME$ ?
						var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_AxisSettings[item]));
						if(slotValue != undefined){ collectedAxisSettings[item] = slotValue; }

						if(collectedAxisSettings[item] == undefined){
							collectedAxisSettings[item] = slot_AxisSettings[item];
						}
					}

					// $gimme(SLOTNAME) ?
					var slotValue = $scope.gimme(item);
					if(slotValue != undefined){ collectedAxisSettings[item] = slotValue; }

					if(!isEmpty(collectedAxisSettings)){
						if(i == 0){ // xAxisSettings
							chartOptions.scales.xAxes[0] = collectedAxisSettings;
						}
						else{
							chartOptions.scales.yAxes[0] = collectedAxisSettings;
						}
					}
				}
			}

			// Visualization Related Options
			var slot_VisualizationSettings = $scope.gimme("visualizationOptions");
			var visAreas = ['title', 'legend', 'tooltips'];
			for(var i = 0; i < visAreas.length; i++){
				var collectedVisAreaSettings = {};
				for(var innerItem in slot_VisualizationSettings[visAreas[i]]){
					if(collectedVisAreaSettings[visAreas[i]] == undefined){ collectedVisAreaSettings[visAreas[i]] = {}; }
					if(typeof slot_VisualizationSettings[visAreas[i]][innerItem] == 'object' && slot_VisualizationSettings[visAreas[i]][innerItem] != null){
						for(var mostInnerItem in slot_VisualizationSettings[visAreas[i]][innerItem]){
							if(collectedVisAreaSettings[visAreas[i]][innerItem] == undefined){ collectedVisAreaSettings[visAreas[i]][innerItem] = {}; }
							if(slot_VisualizationSettings[visAreas[i]][innerItem][mostInnerItem] != null){
								// $SLOTNAME$ ?
								var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_VisualizationSettings[visAreas[i]][innerItem][mostInnerItem]));
								if(slotValue != undefined){ collectedVisAreaSettings[visAreas[i]][innerItem][mostInnerItem] = slotValue; }

								// Internal Value
								if(collectedVisAreaSettings[visAreas[i]][innerItem][mostInnerItem] == undefined){
									collectedVisAreaSettings[visAreas[i]][innerItem][mostInnerItem] = slot_VisualizationSettings[visAreas[i]][innerItem][mostInnerItem];
								}

								// $gimme(SLOTNAME) ?
								var slotValue = $scope.gimme(mostInnerItem);
								if(slotValue != undefined){
									collectedVisAreaSettings[visAreas[i]][innerItem][mostInnerItem] = slotValue;
								}
							}
						}
					}
					else{
						if(slot_VisualizationSettings[visAreas[i]][innerItem] != null){
							// $SLOTNAME$ ?
							var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_VisualizationSettings[visAreas[i]][innerItem]));
							if(slotValue != undefined){ collectedVisAreaSettings[visAreas[i]][innerItem] = slotValue; }

							// Internal Value
							if(collectedVisAreaSettings[visAreas[i]][innerItem] == undefined){
								collectedVisAreaSettings[visAreas[i]][innerItem] = slot_VisualizationSettings[visAreas[i]][innerItem];
							}

							// $gimme(SLOTNAME) ?
							var slotValue = $scope.gimme(innerItem);
							if(slotValue != undefined){
								collectedVisAreaSettings[visAreas[i]][innerItem] = slotValue;
							}
						}

					}
				}

				if(!isEmpty(collectedVisAreaSettings)){
					chartOptions[visAreas[i]] = collectedVisAreaSettings[visAreas[i]];
				}
			}

			// Advanced Rarely Used Options
			var slot_AdvRareSettings = $scope.gimme("advancedRareOptions");
			var collectedAdvRareSettings = {};
			for(var item in slot_AdvRareSettings){
				if(typeof slot_AdvRareSettings[item] == 'object' && slot_AdvRareSettings[item] != null){
					if(collectedAdvRareSettings[item] == undefined){ collectedAdvRareSettings[item] = {}; }
					for(var innerItem in slot_AdvRareSettings[item]){
						if(slot_AdvRareSettings[item][innerItem] != null){
							// $SLOTNAME$ ?
							var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_AdvRareSettings[item][innerItem]));
							if(slotValue != undefined){ collectedAdvRareSettings[item][innerItem] = slotValue; }

							// Internal Value
							if(collectedAdvRareSettings[item][innerItem] == undefined){
								collectedAdvRareSettings[item][innerItem] = slot_AdvRareSettings[item][innerItem];
							}

							// $gimme(SLOTNAME) ?
							var slotValue = $scope.gimme(innerItem);
							if(slotValue != undefined){
								collectedAdvRareSettings[item][innerItem] = slotValue;
							}
						}
					}
				}
				else{
					if(slot_AdvRareSettings[item] != null){
						// $SLOTNAME$ ?
						var slotValue = getSlotValueFromPossibleDollarNameString(String(slot_AdvRareSettings[item]));
						if(slotValue != undefined){ collectedAdvRareSettings[item] = slotValue; }

						// Internal Value
						if(collectedAdvRareSettings[item] == undefined){
							collectedAdvRareSettings[item] = slot_AdvRareSettings[item];
						}

						// $gimme(SLOTNAME) ?
						var slotValue = $scope.gimme(item);
						if(slotValue != undefined){
							collectedAdvRareSettings[item] = slotValue;
						}
					}
				}
			}
			if(!isEmpty(collectedAdvRareSettings)){
				for(var item in collectedAdvRareSettings) {
					chartOptions[item] = collectedAdvRareSettings[item];
				}
			}

			if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.line)){ //Line
				Chart.defaults.line.showLines = $scope.gimme("showLines");
			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){ //Scatter
				Chart.defaults.line.showLines = $scope.gimme("showLines");
				if(chartOptions.scales.xAxes[0]['type'] == undefined){ chartOptions.scales.xAxes[0]['type'] = 'linear'; }
				if(chartOptions.scales.xAxes[0]['position'] == undefined){ chartOptions.scales.xAxes[0]['position'] = 'bottom'; }
			}
		}

		return chartOptions;
	}
	//========================================================================================



	//========================================================================================
	// Get Slot Value From Possible Dollar Name String
	// Check if a string contains a possible slot name encapsulated by dollar signs and if it
	// does try to retrieve the value of that slot and return it.
	//========================================================================================
	var getSlotValueFromPossibleDollarNameString = function(strValue){
		var slotValue;
		if(strValue.substr(0, 1) == '$' && strValue.substr(strValue.length - 1, 1) == '$'){
			slotValue = $scope.gimme(strValue.substr(1, strValue.length - 2));
		}
		return slotValue;
	}
	//========================================================================================


	//===================================================================================
	// Create Custom Webble Definition
	// Adds a flag to the webble to identify if this webble is created from scratch and
	// code only or if it came with config file. It is used in order to create a more
	// eye pleasing chart for first time loaders of this webble
	//===================================================================================
	$scope.coreCall_CreateCustomWblDef = function(){
		var customWblDefPart = {
			isNotNewBorn: true
		};

		return customWblDefPart;
	};
	//===================================================================================


	//===================================================================================
	// Menu Item Activity Reaction
	// Manages the custom part of this webbles menu
	//===================================================================================
	$scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
		if(itemName == $scope.customMenu[0].itemId){  //empty
			$scope.set("dataValueLabels", []);
			$scope.set("chartData", []);
			$scope.set("datasetLabels", []);
			$scope.set("datasetBkgColors", []);
			$scope.set("datasetBorderColors", []);
			$scope.set("datasetBorderWidth", []);
		}
		else if(itemName == $scope.customMenu[1].itemId){  //example
			$scope.set("dataValueLabels", exampleChart.dataValueLabels);
			$scope.set("chartData", exampleChart.chartData);
			$scope.set("datasetLabels", exampleChart.datasetLabels);
			$scope.set("datasetBkgColors", exampleChart.datasetBkgColors);
			$scope.set("datasetBorderColors", exampleChart.datasetBorderColors);
			$scope.set("datasetBorderWidth", exampleChart.datasetBorderWidth);
			$scope.set("chartType", jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.bar));
		}
		else if(itemName == $scope.customMenu[2].itemId){  //chartJsDocs
			$window.open('http://www.chartjs.org', '_blank');
		}
	};
	//===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
