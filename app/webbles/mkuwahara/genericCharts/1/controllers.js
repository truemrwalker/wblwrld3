//======================================================================================================================
// Controllers for Charts for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('GenChartsCtrl', function($scope, $log, $timeout, $modal, Slot, Enum, isEmpty, jsonQuery, isExist) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        chartHolder: ['background-color', 'border', 'padding', 'width', 'height'],
		theChart: ['background-color']
    };

	var chartTypes = { line: 'Line', scatterPlot: 'Scatter Plot', bar: 'Bar - Vertical', horizontalBar: 'Bar - Horizontal', radar: 'Radar', polarArea: 'Polar', pie: 'Pie', doughnut: 'Doughnut' };
	var lastDrawTime = 0;
	var ctx;
	var theChart;

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

	var fullChartOptionsObj = {
		responsive: true,
		responsiveAnimationDuration: 0,
		maintainAspectRatio: true,
		events: ["mousemove", "mouseout", "click", "touchstart", "touchmove", "touchend"],
		onClick: null,
		legendCallback: function (chart) { },
		title: {
			display: false,
			position: 'top',
			fullWidth: true,
			fontSize: 12,
			fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
			fontColor: "#666",
			fontStyle: 'bold',
			padding: 10,
			text: ''
		},
		legend: {
			display: true,
			position: 'top',
			fullWidth: true,
			onClick: function (event, legendItem) {
			},
			labels: {
				boxWidth: 40,
				fontSize: 12,
				fontStyle: "normal",
				fontColor: "#666",
				fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
				padding: 10,
				generateLabels: function(chart) { }
			}
		},
		tooltips: {
			enabled: true,
			custom: null,
			mode: 'single',
			backgroundColor: 'rgba(0,0,0,0.8)',
			titleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
			titleFontSize: 12,
			titleFontStyle: "bold",
			titleFontColor: "#fff",
			titleSpacing: 2,
			titleMarginBottom: 6,
			bodyFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
			bodyFontSize: 12,
			bodyFontStyle: "normal",
			bodyFontColor: "#fff",
			bodySpacing: 2,
			footerFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
			footerFontSize: 12,
			footerFontStyle: "bold",
			footerFontColor: "#fff",
			footerSpacing: 2,
			footerMarginTop: 6,
			xPadding: 6,
			yPadding: 6,
			caretSize: 5,
			cornerRadius: 6,
			multiKeyBackground: "#fff",
			callbacks: {
				beforeTitle: [],
				title: [],
				afterTitle: [],
				beforeBody: [],
				beforeLabel: "",
				label: "",
				afterLabel: "",
				afterBody: [],
				beforeFooter: [],
				footer: [],
				afterFooter: []
			}
		},
		hover: {
			mode: 'single',
			animationDuration: 400,
			onHover: null
		},
		animation: {
			duration: 1000,
			easing: "easeOutQuart",
			onProgress: null,
			onComplete: null
		},
		elements: {
			arc: {
				backgroundColor: 'rgba(0,0,0,0.1)',
				borderColor: '#fff',
				borderWidth: 2
			},
			line: {
				tension: 0.4,
				backgroundColor: 'rgba(0,0,0,0.1)',
				borderWidth: 3,
				borderColor: 'rgba(0,0,0,0.1)',
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				fill: false
			},
			point: {
				radius: 3,
				pointStyle: 'circle',
				backgroundColor: 'rgba(0,0,0,0.1)',
				borderWidth: 1,
				borderColor: 'rgba(0,0,0,0.1)',
				hitRadius: 1,
				hoverRadius: 4,
				hoverBorderWidth: 1
			},
			rectangle: {
				backgroundColor: 'rgba(0,0,0,0.1)',
				borderWidth: 0,
				borderColor: 'rgba(0,0,0,0.1)',
				borderSkipped: 'bottom'
			}
		},
		Scales: {
			xAxes: [{
				type: "", //Options: "category", "linear", "logarithmic", "time", "radialLinear"
				display: true,
				position: "left", //Possible values are 'top', 'left', 'bottom' and 'right'.
				beforeUpdate: undefined,
				beforeSetDimensions: undefined,
				afterSetDimensions: undefined,
				beforeDataLimits: undefined,
				afterDataLimits: undefined,
				beforeBuildTicks: undefined,
				afterBuildTicks: undefined,
				beforeTickToLabelConversion: undefined,
				afterTickToLabelConversion: undefined,
				beforeCalculateTickRotation: undefined,
				afterCalculateTickRotation: undefined,
				beforeFit: undefined,
				afterFit: undefined,
				afterUpdate: undefined,
				gridLines: {
					display: true,
					color: "rgba(0, 0, 0, 0.1)",
					lineWidth: 1,
					drawBorder: true,
					drawOnChartArea: true,
					drawTicks: true,
					tickMarkLength: 10,
					zeroLineWidth: 1,
					zeroLineColor: "rgba(0, 0, 0, 0.25)",
					offsetGridLines: false
				},
				scaleLabel: {
					display: false,
					labelString: "",
					fontColor: "#666",
					fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
					fontSize: 12,
					fontStyle: "normal"
				},
				ticks: {
					autoSkip: true,
					callback: function(value) { return '' + value; },
					display: true,
					fontColor: "#666",
					fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
					fontSize: 12,
					fontStyle: "normal",
					labelOffset: 0,
					maxRotation: 90,
					minRotation: 0,
					mirror: false,
					padding: 10,
					reverse: false,
					beginAtZero: true,
					min: 0,
					max: 100,
					maxTicksLimit: 11,
					stepSize: 1,
					suggestedMax: 100,
					suggestedMin: 0,
					// Below only available with Radar and Polar
					backdropColor: 'rgba(255, 255, 255, 0.75)',
					backdropPaddingX: 2,
					backdropPaddingY: 2,
					showLabelBackdrop: true
				},
				time: { // X-Axis Only
					displayFormats: {
						millisecond: 'SSS [ms]',
						second: 'h:mm:ss a',
						minute: 'h:mm:ss a',
						hour: 'MMM D, hA',
						day: 'll',
						week: 'll',
						month: 'MMM YYYY',
						quarter: '[Q]Q - YYYY',
						year: 'YYYY'
					},
					isoWeekday: false,
					max: (new Date()).getTime(),
					min: (new Date()).getTime(),
					parser: "", // Can also be function
					round: "",
					tooltipFormat: '',
					unit: "", // options: "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year"
					unitStepSize: 1
				},
				// Radar And Polar Only
				lineArc: false,
				angleLines: {
					display: true,
					color: 'rgba(0, 0, 0, 0.1)',
					lineWidth: 1
				},
				pointLabels: {  // only apply if lineArc is false.
					callback: undefined,
					fontColor: '#666',
					fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
					fontSize: 10,
					fontStyle: 'normal'
				}
			}],
			yAxes: [{

			}]
		}
	};






    // GLOBAL CHART OPTIONS

	//Chart.defaults.global.defaultColor = 'rgb(0, 0, 0, 0.1)';
	//Chart.defaults.global.defaultFontColor = '#666';
	//Chart.defaults.global.defaultFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.defaultFontSize = 12;
	//Chart.defaults.global.defaultFontStyle = 'normal';
	//Chart.defaults.global.responsive = true;
	//Chart.defaults.global.responsiveAnimationDuration = 0;
	//Chart.defaults.global.maintainAspectRatio = true;
	//Chart.defaults.global.events = ["mousemove", "mouseout", "click", "touchstart", "touchmove", "touchend"];
	//Chart.defaults.global.onClick = null;
	//Chart.defaults.global.legendCallback = function (chart) { };
	//Chart.defaults.global.title.display = false;
	//Chart.defaults.global.title.position = 'top';
	//Chart.defaults.global.title.fullWidth = true;
	//Chart.defaults.global.title.fontSize = 12;
	//Chart.defaults.global.title.fontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.title.fontColor = "#666";
	//Chart.defaults.global.title.fontStyle = 'bold';
	//Chart.defaults.global.title.padding = 10;
	//Chart.defaults.global.title.text = '';
	//Chart.defaults.global.legend.display = true;
	//Chart.defaults.global.legend.position = 'top';
	//Chart.defaults.global.legend.fullWidth = true;
	//Chart.defaults.global.legend.onClick = function(event, legendItem) {};
	//Chart.defaults.global.legend.labels = {};
	//Chart.defaults.global.legend.labels.boxWidth = 40;
	//Chart.defaults.global.legend.labels.fontSize = 12;
	//Chart.defaults.global.legend.labels.fontStyle = "normal";
	//Chart.defaults.global.legend.labels.fontColor = "#666";
	//Chart.defaults.global.legend.labels.fontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.legend.labels.padding = 10;
	//Chart.defaults.global.legend.labels.generateLabels = function(chart) { };
	//Chart.defaults.global.tooltips.enabled = true;
	//Chart.defaults.global.tooltips.custom = null;
	//Chart.defaults.global.tooltips.mode = 'single';
	//Chart.defaults.global.tooltips.backgroundColor = 'rgba(0,0,0,0.8)';
	//Chart.defaults.global.tooltips.titleFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.tooltips.titleFontSize = 12;
	//Chart.defaults.global.tooltips.titleFontStyle = "bold";
	//Chart.defaults.global.tooltips.titleFontColor = "#fff";
	//Chart.defaults.global.tooltips.titleSpacing = 2;
	//Chart.defaults.global.tooltips.titleMarginBottom = 6;
	//Chart.defaults.global.tooltips.bodyFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.tooltips.bodyFontSize = 12;
	//Chart.defaults.global.tooltips.bodyFontStyle = "normal";
	//Chart.defaults.global.tooltips.bodyFontColor = "#fff";
	//Chart.defaults.global.tooltips.bodySpacing = 2;
	//Chart.defaults.global.tooltips.footerFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
	//Chart.defaults.global.tooltips.footerFontSize = 12;
	//Chart.defaults.global.tooltips.footerFontStyle = "bold";
	//Chart.defaults.global.tooltips.footerFontColor = "#fff";
	//Chart.defaults.global.tooltips.footerSpacing = 2;
	//Chart.defaults.global.tooltips.footerMarginTop = 6;
	//Chart.defaults.global.tooltips.xPadding = 6;
	//Chart.defaults.global.tooltips.yPadding = 6;
	//Chart.defaults.global.tooltips.caretSize = 5;
	//Chart.defaults.global.tooltips.cornerRadius = 6;
	//Chart.defaults.global.tooltips.multiKeyBackground = "#fff";
	//Chart.defaults.global.tooltips.callbacks = {};
	//Chart.defaults.global.tooltips.callbacks.beforeTitle = [];
	//Chart.defaults.global.tooltips.callbacks.title = [];
	//Chart.defaults.global.tooltips.callbacks.afterTitle = [];
	//Chart.defaults.global.tooltips.callbacks.beforeBody = [];
	//Chart.defaults.global.tooltips.callbacks.beforeLabel = "";
	//Chart.defaults.global.tooltips.callbacks.label = "";
	//Chart.defaults.global.tooltips.callbacks.afterLabel = "";
	//Chart.defaults.global.tooltips.callbacks.afterBody = [];
	//Chart.defaults.global.tooltips.callbacks.beforeFooter = [];
	//Chart.defaults.global.tooltips.callbacks.footer = [];
	//Chart.defaults.global.tooltips.callbacks.afterFooter = [];
	//Chart.defaults.global.hover.mode = 'single';
	//Chart.defaults.global.hover.animationDuration = 400;
	//Chart.defaults.global.hover.onHover = null;
	//Chart.defaults.global.animation.duration = 1000;
	//Chart.defaults.global.animation.easing = "easeOutQuart";
	//Chart.defaults.global.animation.onProgress = null;
	//Chart.defaults.global.animation.onComplete = null;
	//Chart.defaults.global.elements.arc.backgroundColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.arc.borderColor = '#fff';
	//Chart.defaults.global.elements.arc.borderWidth = 2;
	//Chart.defaults.global.elements.line.tension = 0.4;
	//Chart.defaults.global.elements.line.backgroundColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.line.borderWidth = 3;
	//Chart.defaults.global.elements.line.borderColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.line.borderCapStyle = 'butt';
	//Chart.defaults.global.elements.line.borderDash = [];
	//Chart.defaults.global.elements.line.borderDashOffset = 0.0;
	//Chart.defaults.global.elements.line.borderJoinStyle = 'miter';
	//Chart.defaults.global.elements.line.fill = true;
	//Chart.defaults.global.elements.point.radius = 3;
	//Chart.defaults.global.elements.point.pointStyle = 'circle';
	//Chart.defaults.global.elements.point.backgroundColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.point.borderWidth = 1;
	//Chart.defaults.global.elements.point.borderColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.point.hitRadius = 1;
	//Chart.defaults.global.elements.point.hoverRadius = 4;
	//Chart.defaults.global.elements.point.hoverBorderWidth = 1;
	//Chart.defaults.global.elements.rectangle.backgroundColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.rectangle.borderWidth = 0;
	//Chart.defaults.global.elements.rectangle.borderColor = 'rgba(0,0,0,0.1)';
	//Chart.defaults.global.elements.rectangle.borderSkipped = 'bottom';
	//Chart.defaults.line.showLines = true;
	//Chart.defaults.bar.hover.mode =	"label";
	//Chart.defaults.bar.scales.xAxes = [{ type: "Category", display:	true, id: "x-axis-0", stacked: false, categoryPercentage: 0.8, barPercentage: 0.9, gridLines: {offsetGridLines: true}}];
	//Chart.defaults.bar.scales.yAxes	[{ type: "linear", display: true, id: "y-axis-0", stacked: false }];
	//Chart.defaults.horizontalBar.hover.mode =	"label";
	//Chart.defaults.horizontalBar.scales.xAxes = [{ type: "linear", display: true, id: "y-axis-0", stacked: false, position: "bottom" }];
	//Chart.defaults.horizontalBar.scales.yAxes = [{ type: "Category", display:	true, id: "x-axis-0", stacked: false, categoryPercentage: 0.8, barPercentage: 0.9, gridLines: {offsetGridLines: true}, position: "left"}];
	//Chart.defaults.radar.scale = { type: "radialLinear" };
	//Chart.defaults.radar.elements.line = { lineTension: 0 };
	//Chart.defaults.polarArea.scale = { type: "", lineArc: true };
	//Chart.defaults.polarArea.animation = { animateRotate: true, animateScale: true };
	//Chart.defaults.polarArea.legend = { labels: { generateLabels: function(data) {} }, onClick: function(event, legendItem) {} };
	//Chart.defaults.polarArea.legendCallback = function(chart){};
	//Chart.defaults.doughnut.cutoutPercentage = 50;
	//Chart.defaults.doughnut.rotation = -0.5 * Math.PI;
	//Chart.defaults.doughnut.circumference = 2 * Math.PI;
	//Chart.defaults.doughnut.animation = { animateRotate: true, animateScale: false };
	//Chart.defaults.doughnut.legend = { labels: { generateLabels: function(chart) {} }, onClick: function(event, legendItem) {} };
	//Chart.defaults.pie.cutoutPercentage = 0;
	//Chart.defaults.pie.rotation = -0.5 * Math.PI;
	//Chart.defaults.pie.circumference = 2 * Math.PI;
	//Chart.defaults.pie.animation = { animateRotate: true, animateScale: false };
	//Chart.defaults.pie.legend = { labels: { generateLabels: function(chart) {} }, onClick: function(event, legendItem) {} };


	//Add to advanced option slot
	//Chart.defaults.global.elements.rectangle.borderSkipped = 'top';



	//=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        ctx = $scope.theView.parent().find("#theChart");

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
			[],
			"Data Value Labels",
			"A list of labels for each data point (should therefore be as long as the data list)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('chartData',
			[],
			"Data",
			"The array of data (encapsulated with []) (or a nested array of multiple datasets) that is used to draw this chart",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetLabels',
			[],
			"Dataset Labels",
			"An array of dataset labels (strings inside quotation marks \" \") \n(equal in amount and same order as the dataset data). \nIf there is only one dataset, only one label is needed",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBkgColors',
			[],
			"Dataset Background Colors",
			"An array of dataset background colors \n(Quotation marked strings in any color format (for example: \"#ffffff\" \"rgba(255,67,250, 0.5)\")) \n(One value is used globaly, multiple is used for each data point in the same order as the dataset data)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBorderColors',
			[],
			"Dataset Border Colors",
			"An array of dataset border colors \n(Quotation marked strings in any color format (for example: \"#ffffff\" \"rgba(255,67,250, 0.5)\")) \n(One value is used globaly, multiple is used for each data point in the same order as the dataset data)",
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('datasetBorderWidth',
			[],
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

		//Chart Type Specific Slots
		$scope.addSlot(new Slot('chartSettings',
			defaultChartSettings,
			"Line Chart Settings",
			"A set of Line chart specific settings, which can be set either as is or by referencing slot names as a string (encapsulated by dollar signs (\"$SLOTNAME$\")). \nA third alternative is to create a slot with the same name as the setting targeted and it will then use that slot value instead and ignore the specific setting value. \n\nIf set to empty the slot resets to default. \n\n[borderJoinStyle Options: 'round', 'bevel' or 'miter']. \n[pointStyle Options: (array is OK) 'circle', 'triangle', 'rect', 'rectRot', 'cross', 'crossRot', 'star', 'line', or 'dash'].",
			"Chart Type Specific",
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('showLines',
			true,
			"Show Lines",
			"Enables if the Line between the points should be drawn or not",
			"Chart Type Specific",
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

        $scope.setDefaultSlot('chartData');
        $scope.setResizeSlots('chartHolder:width', 'chartHolder:height');
    };
    //===================================================================================


	//========================================================================================
	// Draw Chart
	// Draws the chart as specified
	//========================================================================================
	var drawChart = function(){
		if(((new Date()).getTime() - lastDrawTime) < 200){ return; }
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
					dataSets.push(createDatasetObject(chartData[i], chartType, DSLabel));
				}
			}
			else{
				dataSets.push(createDatasetObject(chartData, chartType, dataSetLabels[0]));//(dataSetLabels[0] != undefined ? dataSetLabels[0] : "Undefined")
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
	var createDatasetObject = function(datasetData, chartType, datasetLabel){
		var dataSetObj = {
			label: datasetLabel,
			//xAxisID: "",
			//yAxisID: "",
			backgroundColor: ($scope.gimme("datasetBkgColors").length == 1) ? $scope.gimme("datasetBkgColors")[0] : $scope.gimme("datasetBkgColors"),
			borderColor: ($scope.gimme("datasetBorderColors").length == 1) ? $scope.gimme("datasetBorderColors")[0] : $scope.gimme("datasetBorderColors"),
			borderWidth: ($scope.gimme("datasetBorderWidth").length == 1) ? $scope.gimme("datasetBorderWidth")[0] : $scope.gimme("datasetBorderWidth"),
			hoverBorderWidth: $scope.gimme("hoverBorderWidth"),
			data: datasetData
		}
		if($scope.gimme("hoverBkgColor") != ""){ dataSetObj.hoverBackgroundColor = $scope.gimme("hoverBkgColor"); }
		if($scope.gimme("hoverBorderColor") != ""){ dataSetObj.hoverBorderColor = $scope.gimme("hoverBorderColor"); }

		var whichSetting = "chartSettings", whichDefSetting = defaultChartSettings;
		if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.line) || chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){
			if($scope.gimme("datasetBkgColors").length > 1){ dataSetObj.backgroundColor = $scope.gimme("datasetBkgColors")[0]; }
			if($scope.gimme("datasetBorderColors").length > 1){ dataSetObj.borderColor = $scope.gimme("datasetBorderColors")[0]; }

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
		var chartOptions = {};

		if(isEmpty($scope.gimme("chartData"))){
			chartOptions.responsive = true;
		}
		else{
			chartOptions.responsive = true;
			chartOptions.maintainAspectRatio = false;
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

			if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.line)){ //Line
				Chart.defaults.line.showLines = $scope.gimme("showLines");
			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.scatterPlot)){ //Scatter
				Chart.defaults.line.showLines = $scope.gimme("showLines");
				if(chartOptions.scales.xAxes[0]['type'] == undefined){ chartOptions.scales.xAxes[0]['type'] = 'linear'; }
				if(chartOptions.scales.xAxes[0]['position'] == undefined){ chartOptions.scales.xAxes[0]['position'] = 'bottom'; }
			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.bar) || chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.horizontalBar)){ //Vertical or Horizontal Bar

			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.radar)){ //Radar


			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.polarArea)){ //Polar

			}
			else if(chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.pie) || chartType == jsonQuery.getArrayIndexByObjValue(chartTypes, chartTypes.doughnut)){ //Pie or Doughnut

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



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
