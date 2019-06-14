//======================================================================================================================
// Controllers for [WEBBLE TEMPLATE NAME] for Webble World v3.0 (2013)
// Created By: [WEBBLE TEMPLATE AUTHOR]
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('tobAppWebbleCtrl', function($scope, $log, Slot, Enum, $location, $timeout, gettext, gettextCatalog) {
	// $scope is needed for angularjs to work properly and should not be removed. Slot is a Webble World
	// available Service and is needed for any form of Slot manipulation inside this template and should neither be
	// removed.
	// cleanupService is just a custom service used as an example, but any services needed (Core Services and Webble
	// specific) must be included in the controller call. If your Webble support multiple languages, include
	// gettextCatalog and gettext in your controller, if not, then they may be removed.
	// dbService is basically only needed to access API access keys, if such are not needed it can be removed.
	// Try to avoid running any code at the creation of the controller, unless you know it is completely independent
	// of any of the other files, this is due to file loading order. Instead make your first code calls inside the
	// coreCall_Init function which will be called as soon as all files including the DOM of the Webble is done loading.

	//=== PROPERTIES ====================================================================
	$scope.stylesToSlots = {
		tobAppWrapper: ['width', 'height', 'background-color', 'border', 'border-radius', 'opacity'],
	};

	$scope.customMenu = [];

	$scope.displayText = "Loading TOB. Please wait...";

	$scope.trial = "T.T";
	$scope.patient = "P";
	$scope.trialID = "";
	$scope.patientID = "";

	var neededChildren = {};
	var loadedChildren = {};
	var webbleDefNames = {};

	var mode = "design";
	var status = "running";

	var setupDone = false;

	var inObtima = false;
	var staticObtimaURL = "https://localhost:8443/obtima/pages/jonasTestPage.jsf";
	var obtimaURL = "https://localhost:8443/obtima";

	var obtimaCRFs = [];
	var obtimaTrial = null;
	var obtimaData = null;

	var dataSourcesToListenTo = [];
	var listeners = [];

	var whatIThinkTheTrialIs = {};

	$scope.doDebugLogging = true;
	function debugLog(message) {
		if($scope.doDebugLogging) {
			$log.log("TOBApp: " + message);
		}
	};

	//=== EVENT HANDLERS ================================================================


	//=== METHODS & FUNCTIONS ===========================================================


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
		$scope.setDefaultSlot('');

		// debugLog("starting");


		// ======================================================================= \\
		// ============== First, check if we are running inside ObTiMA or not ==== \\
		// ======================================================================= \\

		var url = (window.location != window.parent.location)
			? document.referrer
			: document.location;

		debugLog("I believe my parent is on URL: " + url);
		// debugLog("I believe my parent is on URL: " + JSON.stringify(url));

		// debugLog("Referrer: " + JSON.stringify(document.referrer));
		// debugLog("(My) Location: " + JSON.stringify(document.location));

		if(false) { // old way of guessing if running inside Obtima. Now use an explicit parameter instead
			var urlLower = url.toString().toLowerCase();
			inObtima = false;

			if(urlLower.indexOf("obtima") >= 0) {
				inObtima = true;
			}
		}

		gettextCatalog.setStrings('ja', {"Event Repository":"イベント", "Clinical Trial Master Plan":"マスタープラン", "TOB":"トライアル・アウトライン・ビルダー"});
		gettextCatalog.setStrings('sv', {"Event Repository":"Händelse Katalog", "Clinical Trial Master Plan":"Övergripande Schema", "TOB":"Medicinska Försök Designer"});

		// ============================================================================ \\
		// == This is for interacting with the database, which currently is not done == \\
		// ============================================================================ \\

		$scope.addSlot(new Slot('SavedTrialData',
			{},
			'Saved Trial Data',
			'The data for this trial that we would like to store in the database.',
			$scope.theWblMetadata.templateid,
			undefined,
			undefined));



		// =================================================================================== \\
		// == Listen for Webbles being loaded, and catch the ones we requested to be loaded == \\
		// =================================================================================== \\

		$scope.registerWWEventListener(Enum.availableWWEvents.loadingWbl, function(eventData){
			var newVal = eventData.targetId;

			// debugLog("loadingWebble! " + newVal);

			if(setupDone && mode == "analysis") {
				dataSourcesToListenTo.push(newVal);
				listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
					childSlotchange(newVal);
				}, newVal, 'ProvidedFormatChanged'));

				if(thisChild !== undefined && thisChild.scope() !== undefined) {
					checkDataSource(newVal);
				}
			}


			var thisChild = $scope.getWebbleByInstanceId(newVal);
			var name = thisChild.scope().theWblMetadata['displayname'];

			if(name && name !== "") {
				addNewlyLoadedChild(newVal, name);
			}

		});




		// =================================================================================== \\
		// ======== Check for arguments such as what trial to load or what patient to use.  == \\
		// ======== Also check for what mode to run in: design, patient, analysis, publish. == \\
		// =================================================================================== \\
		// debugLog("checking args");
		var pathQuery = $location.search();
		if(pathQuery.trial){
			if(setupDone) {
				$scope.displayText = "Trial: " + pathQuery.trial;
			}
			$scope.trial = pathQuery.trial;
			// $timeout(function(){$scope.downloadWebbleDef(pathQuery.webble)});
		}

		if(pathQuery.trialID){
			$scope.trialID = pathQuery.trialID;
		}
		if(pathQuery.patientID){
			$scope.patientID = pathQuery.patientID;
		}


		if(pathQuery.patient){
			$scope.patient = pathQuery.patient;
			// $timeout(function(){$scope.downloadWebbleDef(pathQuery.webble)});
		}

		status = "development";
		if(pathQuery.trialStatus) {
			if(pathQuery.trialStatus == "RUNNING") {
				status = "running";
			} else {
				status = "development";
			}
		}
		debugLog("status = " + status);

		mode = "design";
		if(pathQuery.tobMode) {
			if(pathQuery.tobMode == "design") {
				mode = "design";
			} else if(pathQuery.tobMode == "patient") {
				mode = "patient";
			} else if(pathQuery.tobMode == "analysis") {
				mode = "analysis";
			} else if(pathQuery.tobMode == "publish") {
				mode = "publish";
			} else {
				mode = "design";
			}
		}
		debugLog("mode = " + mode);

		if(mode != "publish") {
			loadWebbleDefs(status, mode);

			$scope.set("tobAppWrapper:opacity", 0.1);
		}
		// debugLog("Finished loading");

		// check if obtima mode flag present
		if(pathQuery.inObtima) {
			if(pathQuery.inObtima == "true") {
				inObtima = true;
			} else if(pathQuery.inObtima == "false") {
				inObtima = false;
			} else {
				// inObtima = false;
				debugLog("inObtima option present with unexpected value: '" + pathQuery.inObtima + "', will use default value.");
			}
		} else {
			debugLog("No inObtima option, use default value.");
		}
		debugLog("inObtima = " + inObtima);



		// =================================================================================== \\
		// ====================== When running inside ObTiMA, remove Webble World menu etc. == \\
		// =================================================================================== \\

		if(inObtima) {
			// debugLog("setting background color");
			$scope.setPlatformBkgColor("white");

			// debugLog("setting execution mode");
			$scope.setExecutionMode(1);

			// debugLog("setting platform flags");
			$scope.setMWPVisibility(false);
			$scope.setVCVVisibility(false);
			$scope.setMenuModeEnabled(false);

			// $rootScope.pageTitle = wblwrldSystemOverrideSettings.pageTitle != '' ? wblwrldSystemOverrideSettings.pageTitle : $rootScope.pageTitle;
		}


		if(inObtima) {


			// ===================================================================================== \\
			// ======== If ObTiMA can generate pages with the information we need from the        == \\
			// ======== database, that may be the cleanest way (only one way to access database). == \\
			// ======== In such cases, TOB would access pages like this (probably). Proof of      == \\
			// ======== concept worked fine.                                                      == \\
			// ===================================================================================== \\
			var useHTTPrequests = false;
			if( useHTTPrequests ) {

				debugLog("Try loading some things from ObTiMA");
				var tempURL = url.toString();
				var idx = tempURL.indexOf("obtima/pages");

				obtimaURL = tempURL.substr(0, idx) + "obtima/pages/jonasTestPage.jsf";
				debugLog("ObTiMA URL: " + obtimaURL);

				var xhr = new XMLHttpRequest();
				xhr.open('GET', obtimaURL, true);
				xhr.onreadystatechange= function() {

					if (this.readyState!==4) {
						debugLog("XMLHttpRequest readyState = 4");
						return;
					}

					if (this.status!==200) {
						debugLog("XMLHttpRequest status != 200, " + this.status);
						return; // or whatever error handling you want
					}

					// debugLog("Possibly succeeded loading some things from ObTiMA");
					// debugLog(this.responseText);
					obtimaCRFs = parseCRFs(this);
				};

				xhr.send();
				// debugLog("Request sent to ObTiMA");
			}


			requestObTiMAdata();
		} else {
			debugLog("We are not running inside ObTiMA");
			requestObTiMAdata();
		}


		listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		}));

	};
	//===================================================================================




	// ======================================================================================== \\
	// ======== This code was used to talk to the ObTiMA database for the P-medicine review. == \\
	// ======== It assumes that the ObTiMA database runs on the same machine, and that there == \\
	// ======== is a Web service that accepts requests:                                      == \\
	// ========    "designMode", "patientMode", and "analysisMode"                           == \\
	// ========     (that include the trial ID and possibly the patient ID)                  == \\
	// ======== This code does not allow writing to the database, which strictly speaking    == \\
	// ======== is also necessary.                                                           == \\
	// ======================================================================================== \\
	function requestObTiMAdata() {
		var xhr = new XMLHttpRequest();
		if($scope.trialID != "") {
			if(mode == "design") {
				xhr.open('GET', "https://localhost:7500" + "/" + $scope.trialID + "/designMode", true);
			} else if(mode == "patient") {
				if($scope.patientID != "") {
					xhr.open('GET', "https://localhost:7500" + "/" + $scope.trialID + "/patientMode/" + $scope.patientID, true);
				} else {
					debugLog("No patient specified");
					return;
				}
			} else if(mode == "analysis") {
				xhr.open('GET', "https://localhost:7500" + "/" + $scope.trialID + "/analysisMode", true);
			} else {
				debugLog("unknown mode");
				return;
			}
		} else {
			debugLog("No trial specified");
			return;
		}

		xhr.onreadystatechange= function() {

			if (this.readyState!==4) {
				$log.log("XMLHttpRequest readyState != 4, use default CRFs instead.");
				loadDefaultCRFs();
				return;
			}

			if (this.status!==200) {
				$log.log("XMLHttpRequest status != 200, " + this.status + ". Use default CRFs instead.");

				loadDefaultCRFs();

				return; // or whatever error handling you want
			}

			debugLog("We got data from the REST service");
			parseObTiMAdata(this.responseText);

		};

		xhr.send();
	}


	function loadDefaultCRFs() {
		var resText = JSON.stringify({"crfTemplates":[
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":902550,"itemposition":0,"question":"Pseudonym","itemdescription":"This is the pseudonym","type":"INPUT_TEXT"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900861,"itemposition":1,"question":"Name:","itemdescription":"Name:","type":"INPUT_TEXT"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900865,"itemposition":2,"question":"First Name:","itemdescription":"First Name:","type":"INPUT_TEXT"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900869,"itemposition":3,"question":"Birth Date:","itemdescription":"Birth Date:","type":"SELECT_INPUT_DATE"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900873,"itemposition":4,"question":"Which Gender:","itemdescription":"Which Gender:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901270,"itemposition":5,"question":"Age:","itemdescription":"Age:","type":"INPUT_NUMBER"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900884,"itemposition":6,"question":"Reason for Diagnosis","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900895,"itemposition":7,"question":"Has a Syndrome:","itemdescription":"Has Syndrome:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900906,"itemposition":8,"question":"Has an Aniridia:","itemdescription":"Has Aniridia:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900917,"itemposition":9,"question":"Has a Hemihypertrophy:","itemdescription":"Has Hemihypertrophy:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900928,"itemposition":10,"question":"Has an Urogenital Malformation:","itemdescription":"Has Urogenital Malformation:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900939,"itemposition":11,"question":"Has a Wiedemann-Beckwith Syndrome:","itemdescription":"Has Wiedemann Beckwith Syndrome:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900950,"itemposition":12,"question":"Has a Dennis Drash Syndrome:","itemdescription":"Has Dennis Drash Syndrome:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900961,"itemposition":13,"question":"Has another Syndrome:","itemdescription":"Has another Syndrome:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":900979,"itemposition":14,"question":"Is there a syndrome in the family known:","itemdescription":"Is there a familial syndrome?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901008,"itemposition":15,"question":"Is a familial cancer known:","itemdescription":"Is  a familial cancer known?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901019,"itemposition":16,"question":"Date of Diagnosis:","itemdescription":"Date of Diagnosis","type":"SELECT_INPUT_DATE"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901023,"itemposition":17,"question":"Has Metastasis:","itemdescription":"Has Metastasis:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901034,"itemposition":18,"question":"Metastasis after preoperative Chemotherapy:","itemdescription":"Metastasis after preoperative Chemotherapy?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901211,"itemposition":19,"question":"Isolated lung metastasis:","itemdescription":"Has the patient an isolated lung metastasis?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901222,"itemposition":20,"question":"Initial Tumour Stage:","itemdescription":"What is the initial tumour stage?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901233,"itemposition":21,"question":"Primary surgery:","itemdescription":"Was the patient primarily operated?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901244,"itemposition":22,"question":"Bilateral Tumour:","itemdescription":"Was the patient a bilateral tumour?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901255,"itemposition":23,"question":"Was the patient randomised:","itemdescription":"Was the patient randomised:","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":901266,"itemposition":24,"question":"If yes, to which randomisation arm:","itemdescription":"To which arm was teh patient randomised?","type":"SELECT_ONE_MENU"},
				{"id":900859,"name":"F1-Registration","description":"F1-Registration","position":1,"grposition":0,"grname":"F1 Registration Group","itemid":903287,"itemposition":25,"question":"If yes, treatment given:","itemdescription":"To which arm was teh patient randomised?","type":"SELECT_ONE_MENU"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901057,"itemposition":0,"question":"Date of surgery:","itemdescription":"DAte of surgery","type":"SELECT_INPUT_DATE"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901072,"itemposition":2,"question":"Tumour volume at diagnosis:","itemdescription":"What was the tumour volume at diagnosis?","type":"INPUT_NUMBER"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901083,"itemposition":3,"question":"Tumour volume after preoperative chemotherapy:","itemdescription":"What was the tumour volume after preoperative chemotherapy?","type":"INPUT_NUMBER"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901101,"itemposition":4,"question":"Tumour volume after preoperative chemotherapy in CT:","itemdescription":"What was the tumour volume after preoperative chemotherapy in CT?","type":"INPUT_NUMBER"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901126,"itemposition":5,"question":"Tumour volume after preoperative chemotherapy in MRI:","itemdescription":"What was the tumour volume after preoperative chemotherapy in MRI?","type":"INPUT_NUMBER"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901158,"itemposition":6,"question":"Where was surgery done:","itemdescription":"Where was the surgery done?","type":"SELECT_ONE_MENU"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":903492,"itemposition":7,"question":"Which kind of surgery:","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":903420,"itemposition":9,"question":"Which Tumor Resection:","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901055,"name":"F3 - Surgery","description":"This is the surgical CRF","position":3,"grposition":0,"grname":"F3 Surgery Group","itemid":901193,"itemposition":10,"question":"Number of surgeries done before:","itemdescription":"How many surgeries in Wilms Tumour are done before?","type":"INPUT_NUMBER"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901407,"itemposition":0,"question":"Local stage:","itemdescription":"What is teh local tumor stage?","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901459,"itemposition":1,"question":"Which Nephroblastoma (local):","itemdescription":"Which Nephroblastoma diagnosed by local pathologist:","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901472,"itemposition":2,"question":"Which Nephroblastoma (Panel):","itemdescription":"Which Nephroblastoma:","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901451,"itemposition":3,"question":"Panel Histology:","itemdescription":"What is teh Panel Histology?","type":"INPUT_TEXT"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":903946,"itemposition":4,"question":"Final Histology","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901455,"itemposition":5,"question":"Other Tumor","itemdescription":"Name of another Tumor","type":"INPUT_TEXT"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":903873,"itemposition":6,"question":"Tumorregression","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901614,"itemposition":7,"question":"Tumor bleeding","itemdescription":"Is there a tumor bleeding","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901711,"itemposition":8,"question":"Which PathologicalAnaplasia:","itemdescription":"Which PathologicalAnaplasia:","type":"SELECT_ONE_MENU"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901625,"itemposition":9,"question":"Tumor volume at diagnosis:","itemdescription":"How big is the tumor at diagnosis?","type":"INPUT_NUMBER"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901636,"itemposition":10,"question":"Tumor volume after preoperative chemotherapy:","itemdescription":"How big is the tumor after preoperative chemotherapy?","type":"INPUT_NUMBER"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901654,"itemposition":11,"question":"Tumor volume after preoperative chemotherapy in CT:","itemdescription":"How big is the tumor after preoperative chemotherapy in CT?","type":"INPUT_NUMBER"},
				{"id":901403,"name":"F4 - Histology","description":"Histological CRF","position":2,"grposition":0,"grname":"F4 Histology Group","itemid":901679,"itemposition":12,"question":"Tumor volume after preoperative chemotherapy in MRI:","itemdescription":"How big is the tumor after preoperative chemotherapy in MRI?","type":"INPUT_NUMBER"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901888,"itemposition":0,"question":"Date of radiotherapy start","itemdescription":"Start of radiotherapy","type":"SELECT_INPUT_DATE"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901892,"itemposition":1,"question":"Time between surgery and irradiation in days:","itemdescription":"Please enter description","type":"INPUT_NUMBER"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901934,"itemposition":2,"question":"Applied radiation dose","itemdescription":"cumulative dose given","type":"INPUT_NUMBER"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901945,"itemposition":3,"question":"What is irradiated","itemdescription":"Field that is irradiated","type":"SELECT_ONE_MENU"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901960,"itemposition":4,"question":"Was there a central planning","itemdescription":"Was there a central planning of adiotherapy?","type":"SELECT_ONE_MENU"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901971,"itemposition":5,"question":"Is radiotherapy needed","itemdescription":"Needs the patient radiotherapy?","type":"SELECT_ONE_MENU"},
				{"id":901404,"name":"F5 - Radiotherapy","description":"Radiotherapeutic CRF","position":4,"grposition":0,"grname":"F5 Radiotherapie Group","itemid":901978,"itemposition":6,"question":"Was radiotherapy given","itemdescription":"Was the patient irradiated?","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902027,"itemposition":0,"question":"Is the patient LFU","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902038,"itemposition":1,"question":"Date of LFU","itemdescription":"Please enter description","type":"SELECT_INPUT_DATE"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902057,"itemposition":2,"question":"Did the patient relapse","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902185,"itemposition":3,"question":"What kind of relapse","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902053,"itemposition":4,"question":"date of relapse","itemdescription":"Please enter description","type":"SELECT_INPUT_DATE"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902089,"itemposition":5,"question":"Did the patient die?","itemdescription":"Did the patient die?","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902107,"itemposition":6,"question":"Date of death","itemdescription":"Please enter description","type":"SELECT_INPUT_DATE"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902132,"itemposition":7,"question":"Date of last information about patient","itemdescription":"Please enter description","type":"SELECT_INPUT_DATE"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902136,"itemposition":8,"question":"Status of the patient","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902151,"itemposition":9,"question":"Did the patient develop a second malignancy?","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902170,"itemposition":10,"question":"Type of second maligancy","itemdescription":"Please enter description","type":"INPUT_TEXT"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902174,"itemposition":11,"question":"What type of patient","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902309,"itemposition":12,"question":"Time to relapse (years)","itemdescription":"Please enter description","type":"INPUT_NUMBER"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902320,"itemposition":13,"question":"Time to death (years)","itemdescription":"Please enter description","type":"INPUT_NUMBER"},
				{"id":901405,"name":"F9- Follow-up","description":"Follow-up CRF","position":5,"grposition":0,"grname":"F9 Follow-up","itemid":902331,"itemposition":14,"question":"Type of tumour","itemdescription":"Please enter description","type":"SELECT_ONE_MENU"}
			]});

		parseObTiMAdata(resText);

	}

	// ==================================================================================== \\
	// ======== Data from the ObTiMA database is parsed like this. Any format is fine in == \\
	// ======== general, but this is the format used during the P-medicine reveiw.       == \\
	// ==================================================================================== \\
	function parseObTiMAdata(resText) {
		debugLog("parsing ObTiMA data");
		var res = JSON.parse(resText);

		var crfs = [];
		var crfDict = {};

		if(res.hasOwnProperty("crfTemplates")) {
			for(var i = 0; i < res.crfTemplates.length; i++) {
				var c = res.crfTemplates[i];
				var crf = {};

				if(crfDict.hasOwnProperty(c.id)) {
					crf = crfDict[c.id];
				} else {
					crf.id = c.id;
					crf.pos = c.position;
					crf.name = c.name;
					crf.desc = c.description

					crf.selection = false;
					crf.content = [];

					crfDict[c.id] = crf;
				}

				var crfItem = {};
				crfItem.pos = c.itemposition;
				crfItem.grpos = c.grposition;
				crfItem.question = c.question;
				crfItem.type = c.type;
				if(crfItem.type == "INPUT_NUMBER") {
					crfItem.type = "Number";
				}
				if(crfItem.type == "SELECT_INPUT_DATE") {
					crfItem.type = "Date";
				}
				crfItem.desc = c.itemdescription;
				crfItem.id = c.itemid;

				crf.content.push(crfItem);
			}
		}

		for(var c in crfDict) {
			crfs.push(crfDict[c]);
		}

		obtimaCRFs = crfs;

		var dbTrial = {"trial":$scope.trial};
		var eventDbId = {};

		if(res.hasOwnProperty("eventTemplates")) {
			dbTrial.events = [];

			var eventDict = {};
			for(var i = 0; i < res.eventTemplates.length; i++) {
				var e = res.eventTemplates[i];

				var event = {};
				if(eventDict.hasOwnProperty(e.id)) {
					event = eventDict[e.id];
				} else {
					event.dbId = e.id;
					event.name = e.name;
					event.crfs = [];

					eventDict[e.id] = event;
				}

				event.crfs.push(e.childcrftemplate_id);
			}

			var lastEventID = "";
			var lastEventDBID = "";
			var id = 1;
			for(var e in eventDict) {
				event = eventDict[e]; // pick one
				dbTrial.events.push({"dbId":event.dbId, "id":id,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":lastEventID,"source_dbId":lastEventDBID,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":$scope.trialID,"label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":event.crfs,"microEvents":[]});
				lastEventID = id.toString();
				lastEventDBID = event.dbId;

				eventDbId[event.dbId] = id;

				id++;
			}
		}

		if(($scope.trial == "KO" || $scope.trial == "Kidney One")
			&& (!dbTrial.hasOwnProperty("events")
				|| dbTrial.events.length == 0)) {
			// add some KO data to KO if the database is not correctly filled


			// ======================================================================================= \\
			// ======== Horrible hack to make the P-medicine demo look OK even if the database does == \\
			// ======== not contain the necessary TOB specific data that should have been there.    == \\
			// ========       This code should be removed once the database communicatio works.     == \\
			// ======================================================================================= \\

			var temp = {"events":[{"id":0,"dbId":"9","duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":900859,"q":16},"enddatecrfitemtemplate_id":{"crf":900859,"q":16},"crfs":[900859],"microEvents":[]},{"id":1,"dbId":1,"duration":28,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;","treatmentarmlabel":"","mandatory":true,"source_id":0,"source_dbId":"9","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901403,"q":0},"enddatecrfitemtemplate_id":{"crf":901403,"q":0},"crfs":[901403],"microEvents":[]},{"id":2,"dbId":3,"duration":1,"preinterval":7,"type_id":14,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":1,"source_dbId":1,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901055,"q":0},"enddatecrfitemtemplate_id":{"crf":901055,"q":0},"crfs":[901055],"microEvents":[]},{"id":3,"dbId":2,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":2,"source_dbId":3,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":900859,"q":16},"enddatecrfitemtemplate_id":{"crf":900859,"q":16},"crfs":[900859,901405],"microEvents":[]},{"id":4,"dbId":4,"duration":28,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;AV-1","treatmentarmlabel":"I","mandatory":true,"source_id":3,"source_dbId":2,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":5,"dbId":5,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"II","mandatory":true,"source_id":3,"source_dbId":2,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":6,"dbId":7,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":7,"dbId":6,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":8,"dbId":8,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"III","mandatory":true,"source_id":3,"source_dbId":2,"armrank":2,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":9,"dbId":11,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":10,"dbId":9,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":11,"dbId":12,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":12,"dbId":14,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":13,"dbId":10,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":14,"dbId":13,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]}],"trial":"KO"};

			// var temp ={"events":[{"id":0,"dbId":"9","duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":["901405","901404","901055","901403","900859"],"microEvents":[]},{"id":1,"dbId":1,"duration":28,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;","treatmentarmlabel":"","mandatory":true,"source_id":0,"source_dbId":"9","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":2,"dbId":3,"duration":1,"preinterval":7,"type_id":14,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":1,"source_dbId":1,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":3,"dbId":2,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":2,"source_dbId":3,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":4,"dbId":4,"duration":28,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;AV-1","treatmentarmlabel":"I","mandatory":true,"source_id":3,"source_dbId":2,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":5,"dbId":5,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"II","mandatory":true,"source_id":3,"source_dbId":2,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":6,"dbId":7,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":7,"dbId":6,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":8,"dbId":8,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"III","mandatory":true,"source_id":3,"source_dbId":2,"armrank":2,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":9,"dbId":11,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":10,"dbId":9,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":11,"dbId":12,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":12,"dbId":14,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":13,"dbId":10,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":14,"dbId":13,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]}],"trial":"KO"};

			// var temp = {"events":[{"id":0,"dbId":"9","duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":["901405","901404","901055","901403","900859"],"microEvents":[]},{"id":1,"dbId":1,"duration":28,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;","treatmentarmlabel":"","mandatory":true,"source_id":0,"source_dbId":"9","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":3,"dbId":3,"duration":1,"preinterval":7,"type_id":14,"treatmentelement":";","treatmentarmlabel":"","mandatory":true,"source_id":1,"source_dbId":1,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":2,"dbId":2,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":3,"source_dbId":3,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":4,"dbId":4,"duration":28,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;AV-1","treatmentarmlabel":"I","mandatory":true,"source_id":2,"source_dbId":2,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":5,"dbId":5,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":";","treatmentarmlabel":"II","mandatory":true,"source_id":2,"source_dbId":2,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":7,"dbId":7,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":6,"dbId":6,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":8,"dbId":8,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":";","treatmentarmlabel":"III","mandatory":true,"source_id":2,"source_dbId":2,"armrank":2,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":11,"dbId":11,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":9,"dbId":9,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":11,"source_dbId":11,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":12,"dbId":12,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":11,"source_dbId":11,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":14,"dbId":14,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":10,"dbId":10,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":14,"source_dbId":14,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":13,"dbId":13,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":14,"source_dbId":14,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]}],"trial":"KO"};
			dbTrial.events = temp.events;

		} else if(($scope.trial == "KO" || $scope.trial == "Kidney One")
			&& dbTrial.hasOwnProperty("events")
			&& dbTrial.events.length == 1) {
			var rootId = dbTrial.events[0].id;
			var rootDbId = dbTrial.events[0].dbId;

			var temp = {"events":[{"id":0,"dbId":"9","duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":900859,"q":16},"enddatecrfitemtemplate_id":{"crf":900859,"q":16},"crfs":[900859],"microEvents":[]},{"id":1,"dbId":1,"duration":28,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;","treatmentarmlabel":"","mandatory":true,"source_id":0,"source_dbId":"9","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901403,"q":0},"enddatecrfitemtemplate_id":{"crf":901403,"q":0},"crfs":[901403],"microEvents":[]},{"id":2,"dbId":3,"duration":1,"preinterval":7,"type_id":14,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":1,"source_dbId":1,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901055,"q":0},"enddatecrfitemtemplate_id":{"crf":901055,"q":0},"crfs":[901055],"microEvents":[]},{"id":3,"dbId":2,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":2,"source_dbId":3,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":900859,"q":16},"enddatecrfitemtemplate_id":{"crf":900859,"q":16},"crfs":[900859,901405],"microEvents":[]},{"id":4,"dbId":4,"duration":28,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;AV-1","treatmentarmlabel":"I","mandatory":true,"source_id":3,"source_dbId":2,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":5,"dbId":5,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"II","mandatory":true,"source_id":3,"source_dbId":2,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":6,"dbId":7,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":7,"dbId":6,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":8,"dbId":8,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"III","mandatory":true,"source_id":3,"source_dbId":2,"armrank":2,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":9,"dbId":11,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":10,"dbId":9,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":11,"dbId":12,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":12,"dbId":14,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":13,"dbId":10,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]},{"id":14,"dbId":13,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":901404,"q":0},"enddatecrfitemtemplate_id":{"crf":901404,"q":0},"crfs":[901404],"microEvents":[]}],"trial":"KO"};

			// var temp = {"events":[{"id":0,"dbId":"9","duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":["901405","901404","901055","901403","900859"],"microEvents":[]},{"id":1,"dbId":1,"duration":28,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;","treatmentarmlabel":"","mandatory":true,"source_id":0,"source_dbId":"9","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":2,"dbId":3,"duration":1,"preinterval":7,"type_id":14,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":1,"source_dbId":1,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":3,"dbId":2,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":2,"source_dbId":3,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":4,"dbId":4,"duration":28,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;AV-1","treatmentarmlabel":"I","mandatory":true,"source_id":3,"source_dbId":2,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":5,"dbId":5,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"II","mandatory":true,"source_id":3,"source_dbId":2,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":6,"dbId":7,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":7,"dbId":6,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":5,"source_dbId":5,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":8,"dbId":8,"duration":0,"preinterval":7,"type_id":9,"treatmentelement":"undefined;","treatmentarmlabel":"III","mandatory":true,"source_id":3,"source_dbId":2,"armrank":2,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":9,"dbId":11,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":10,"dbId":9,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AVD","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":11,"dbId":12,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":9,"source_dbId":11,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":12,"dbId":14,"duration":0,"preinterval":0,"type_id":19,"treatmentelement":"undefined;","treatmentarmlabel":"","mandatory":true,"source_id":8,"source_dbId":8,"armrank":1,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":13,"dbId":10,"duration":128,"preinterval":0,"type_id":1,"treatmentelement":"#99ccff;AV-2","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]},{"id":14,"dbId":13,"duration":14,"preinterval":7,"type_id":8,"treatmentelement":"#FF9999;","treatmentarmlabel":"","mandatory":true,"source_id":12,"source_dbId":14,"armrank":0,"parallelrank":1,"treatmentarmpath":"","trial_id":"KO","label_id":"","label":{"id":"","text":"","color":"white","position":[0,-40],"shape":"rectangle"},"startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"crfs":[],"microEvents":[]}],"trial":"KO"};

			temp.events[1].source_id = rootId;
			temp.events[1].source_dbId = rootDbId;
			temp.events[0] = dbTrial.events[0];
			dbTrial.events = temp.events;
		}

		if(res.hasOwnProperty("eventInstances")) {
			dbTrial.patientboardData = {};
			dbTrial.patientboardData.events = [];
			dbTrial.patientboardData.trial = $scope.trialID;
			dbTrial.patientboardData.patient = $scope.patientID;

			var eventDict = {};
			for(var i = 0; i < res.eventInstances.length; i++) {
				var e = res.eventInstances[i];

				var event = {};
				if(eventDict.hasOwnProperty(e.id)) {
					event = eventDict[e.id];
				} else {
					event.dbId = e.id;
					event.name = e.name;
					event.template_dbId = e.templid;

					event.crfs = [];

					eventDict[e.id] = event;
				}

				event.crfs.push(e.childcrfinstance_id);
			}

			var lastEventID = "";
			var lastEventDBID = "";
			var id = 1;

			for(var e in eventDict) {
				var temp = 0;
				if(eventDbId.hasOwnProperty(event.template_dbId)) {
					temp = eventDbId[event.template_dbId];
				}
				event = eventDict[e];

				dbTrial.patientboardData.events.push({"id":id,"dbId":event.dbId,"template_id":temp,"template_dbId":event.template_dbId,"patient_id":$scope.patientID,"duration":0,"preinterval":0,"type_id":12,"treatmentelement":"","treatmentarmlabel":"","mandatory":false,"source_id":"","armrank":0,"parallelrank":0,"treatmentarmpath":"","trial_id":$scope.trialID,"label_id":"","label":{"id":"","text":"","color":"","position":"","shape":""},"status":"CURRENT","startdatecrfitemtemplate_id":{"crf":null,"q":null},"enddatecrfitemtemplate_id":{"crf":null,"q":null},"wantedCrfs":event.crfs,"crfs":[],"microEvents":[]});

				lastEventID = id.toString();
				lastEventDBID = event.dbId;
				id++;
			}
		}

		if(res.hasOwnProperty("crfInstances")) {
			crfInstanceDict = {};
			for(var i = 0; i < res.crfInstances.length; i++) {
				var c = res.crfInstances[i];
				var crf = {};

				if(crfInstanceDict.hasOwnProperty(c.crfid)) {
					crf = crfInstanceDict[c.crfid];
				} else {
					crf.dbId = c.crfid;
					crf.id = c.crfid;
					crf.template_dbId = c.basecrftemplate_id;
					crf.template_id = c.basecrftemplate_id;

					crf.content = [];

					crfInstanceDict[c.crfid] = crf;
				}

				var crfItem = {};
				crfItem.id = c.id;
				crfItem.templateItem_dbId = c.basecrfitemtemplate_id;
				crfItem.templateItem_id = c.basecrfitemtemplate_id;
				crfItem.answer = c.value;

				crfItem.pos = 0;
				var found = false;
				for(var tmpl in crfDict) {
					for(var cont = 0; !found && cont < crfDict[tmpl].content.length; cont++) {
						if(crfDict[tmpl].content[cont].id == crfItem.templateItem_id) {
							crfItem.pos = crfDict[tmpl].content[cont].pos;
							found = true;
							if(crfDict[tmpl].content[cont].type == "Number" && crfItem.answer !== null) {
								try {
									crfItem.answer = parseFloat(crfItem.answer);
								} catch(e) {}
							}
							if(crfDict[tmpl].content[cont].type == "Date" && crfItem.answer !== null) {
								try {
									var d = new Date(Date.parse(crfItem.answer));
									// var s = d.toISOString();
									crfItem.answer = d;
								} catch(e) {}
							}
						}
					}
					if(found) {
						break;
					}
				}

				crf.content.push(crfItem);
			}

			for(var c1 in crfInstanceDict) {
				for(var e = 0; e < dbTrial.patientboardData.events.length; e++) {
					for(var c2 = 0; c2 < dbTrial.patientboardData.events[e].wantedCrfs.length; c2++) {
						if(crfInstanceDict[c1].id == dbTrial.patientboardData.events[e].wantedCrfs[c2]) {
							dbTrial.patientboardData.events[e].crfs.push(crfInstanceDict[c1]);
						}
					}
				}
			}
		}


		if(res.hasOwnProperty("allData") && mode == "analysis") {
			var csv = "";
			var patDict = {};
			var typeDict = {};
			var nameDict = {};

			var unknown = 0;

			for(var i = 0; i < res.allData.length; i++) {
				var d = res.allData[i];

				var pat = d.patient_id;
				var data = {};
				if(patDict.hasOwnProperty(pat)) {
					data = patDict[pat];
				} else {
					patDict[pat] = data;
				}

				var dd = {};
				if(data.hasOwnProperty(d.basecrftemplate_id)) {
					dd = data[d.basecrftemplate_id];
				} else {
					data[d.basecrftemplate_id] = dd;
				}

				dd[d.basecrfitemtemplate_id] = d.value;

				var tmpl = d.basecrftemplate_id;
				if(!typeDict.hasOwnProperty(tmpl)) {
					typeDict[tmpl] = {};
					nameDict[tmpl] = {};
				}

				if(!typeDict[tmpl].hasOwnProperty(d.basecrfitemtemplate_id)) {
					var tt = "string";
					var name = "unknown" + unknown++;

					if(crfDict.hasOwnProperty(tmpl)) {
						for(var cont = 0; cont < crfDict[tmpl].content.length; cont++) {
							if(crfDict[tmpl].content[cont].id == d.basecrfitemtemplate_id) {
								if(crfDict[tmpl].content[cont].type == "Number") {
									tt = "number";
								} else if(crfDict[tmpl].content[cont].type == "Date") {
									tt = "date";
								} else {
									tt = "string";
								}
								name = crfDict[tmpl].content[cont].question;
								break;
							}
						}
					}

					typeDict[tmpl][d.basecrfitemtemplate_id] = tt;
					nameDict[tmpl][d.basecrfitemtemplate_id] = name.replace(",", ".").replace(";", "/").replace(":", "/");
				}
			}

			var csv = [];
			for(var pat in patDict) {
				var patCSV = [pat];
				for(var tmpl in typeDict) {
					for(var item in typeDict[tmpl]) {
						var val = null;
						if(patDict[pat].hasOwnProperty(tmpl)
							&& patDict[pat][tmpl].hasOwnProperty(item)) {
							val = patDict[pat][tmpl][item];

							if(val !== null) {
								if(typeDict[tmpl][item] == "number") {
									try {
										val = parseFloat(val);
									} catch(e) {
										val = null;
									}
									if(isNaN(val)) {
										val = null;
									}
								} else if(typeDict[tmpl][item] == "date") {
									try {
										var d = new Date(Date.parse(val));
										val = d.toISOString();
									} catch(e) {
										val = null;
									}
								} else if(val !== null) {
									val = val.replace(",", ".").replace(";", "/").replace(";", "/");
								}
							}
						}
						patCSV.push(val);
					}
				}

				csv.push(patCSV.join());
			}

			var typeV = ["string"];
			var nameV = ["ID"];
			for(var tmpl in typeDict) {
				for(var item in typeDict[tmpl]) {
					typeV.push(typeDict[tmpl][item]);
					nameV.push(nameDict[tmpl][item]);
				}
			}

			obtimaData = {};
			obtimaData.csvStr = csv.join(";");
			obtimaData.nameStr = nameV.join() + ";";
			obtimaData.typeStr = typeV.join() + ";";
		}

		if(setupDone) {
			obtimaTrial = dbTrial;
			var webble = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			webble.scope().set('LoadTrialData', obtimaTrial);

			// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
			// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
			// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
			// if(obtimaData !== null && mode == "analysis" && loadedChildren["DigitalDashboardCSVDataSource"].length > 0) {
			// 	dataSourcesToListenTo.push(loadedChildren["DigitalDashboardCSVDataSource"][0]);
			// 	listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			// 		childSlotchange(loadedChildren["DigitalDashboardCSVDataSource"][0]);
			// 	}, loadedChildren["DigitalDashboardCSVDataSource"][0], 'ProvidedFormatChanged'));
			//
			// 	var webble = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardCSVDataSource"][0]);
			// 	webble.scope().set('DataTypes', obtimaData.typeStr);
			// 	webble.scope().set('DataNames', obtimaData.nameStr);
			// 	webble.scope().set('Data', obtimaData.csvStr);
			// }
		} else {
			obtimaTrial = dbTrial;
		}
	}


	function childSlotchange(childId) {
		// debugLog("childSlotChange");
		checkDataSource(childId);
	}



	// ========================================================================================= \\
	// ======== Code used to parse CRF data from the ObTiMA database for the proof of concept == \\
	// ======== using HTTP requests and pages generated by ObTiMA.                            == \\
	// ========================================================================================= \\
	function parseCRFs(response) {
		var txt = response.responseText;
		var matches = txt.match(/<tr><td>CRFTEMPLATE<.td>(\s*<td>[^<]*<.td>)*\s*<.tr>/igm);
		var crfs = [];
		for(var mm = 0; mm < matches.length; mm++) {
			var m = matches[mm];
			var crf = {};
			var start = m.indexOf("<td>") + 4;
			var end =  m.indexOf("</td>", start); // this is the header, skip

			start = m.indexOf("<td>", end) + 4;
			end =  m.indexOf("</td>", start);
			crf.id = m.substring(start, end);

			start = m.indexOf("<td>", end) + 4;
			end =  m.indexOf("</td>", start);
			crf.pos = m.substring(start, end);

			start = m.indexOf("<td>", end) + 4;
			end =  m.indexOf("</td>", start);
			crf.name = m.substring(start, end);

			start = m.indexOf("<td>", end) + 4;
			end =  m.indexOf("</td>", start);
			crf.desc = m.substring(start, end);

			crf.selection = false;
			crf.content = [];

			crfs.push(crf);
		}
		debugLog("found CRFs: " + JSON.stringify(crfs));
		return crfs;
	}



	// ======================
	// Not related to ObTiMA
	// ======================
	function mySlotChange(eventData) {

		switch(eventData.slotName) {
			case 'SavedTrialData':
				var newVal = $scope.gimme('SavedTrialData');
				if(newVal != whatIThinkTheTrialIs
					&& JSON.stringify(newVal) != JSON.stringify(whatIThinkTheTrialIs)) {
					dataInputOnSlot(newVal);
				}
				break;
		}
	}


	function dataInputOnSlot(newTrial) {
		whatIThinkTheTrialIs = newTrial;

		var webble = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
		webble.scope().set('LoadTrialData', newTrial);
	}


	function workBoardSaveDataChange() {
		var webble = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
		var trialData = webble.scope().gimme('SavedTrialData');
		if(typeof trialData === 'string') {
			try {
				trialData = JSON.parse(trialData);
			} catch(e) {
				trialData = {errorLog:trialData};
			}
		}

		whatIThinkTheTrialIs = trialData;
		$scope.set('SavedTrialData', trialData);
	}

	function ourDataSlotChanged() {

	}

	function sendCRFs() {
		// debugLog("sendCRFs()");
		return obtimaCRFs;
	}

	var addNewlyLoadedChild = function(webbleID, name) {
		// debugLog("addNewlyLoadedChild, " + webbleID + " " + name);
		if(!setupDone) {

			if(name == "Basic Window") {
				loadedChildren[name].push(webbleID);
			} else if(name == "TOBMedEvent") {
				loadedChildren[name].push(webbleID);
			} else if(name == "TOBTimeline") {
				loadedChildren[name].push(webbleID);
			} else if(name == "TOBWorkboard") {
				loadedChildren[name].push(webbleID);

				listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
					workBoardSaveDataChange();
				}, webbleID, 'SavedTrialData'));

			} else if(name == "TOBPatientboard") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboard") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginBarChart") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginHeatMap") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginScatterPlots") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginLifeTable") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginItemSetMining") {
				loadedChildren[name].push(webbleID);
			} else if(name == "DigitalDashboardPluginParallelCoordinateHolder") {
				loadedChildren[name].push(webbleID);

			// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
			// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
			// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
			// } else if(name == "DigitalDashboardCSVDataSource") {
			// 	loadedChildren[name].push(webbleID);
			} else {
				return;
			}

			//$scope.getWebbleByInstanceId(webbleID).scope().set("root:opacity", 0);


			// debugLog("check if we should duplicate " + name);
			// check if this is a newly loaded template and if we should duplicate this
			if(loadedChildren[name].length == 1) {
				if(neededChildren[name] > 1) {
					var original = $scope.getWebbleByInstanceId(webbleID);
					for(var copies = 1; copies < neededChildren[name]; copies++) {
						// debugLog("making more " + name + " Webbles.");
						original.scope().duplicate({x: 15, y: 15}, undefined);
					}

					return; // wait for the duplicates to arrive
				}
			}

			// debugLog(" check if we have everything");
			// check if all the Webbles we need are here yet
			var allHere = true;
			for (var type in neededChildren) {
				if (neededChildren.hasOwnProperty(type)) {
					// debugLog("check if we have " + type + ", want " + neededChildren[type] + ", have " + loadedChildren[type].length);
					if(neededChildren[type] > loadedChildren[type].length) {
						// debugLog("not enough " + type);
						allHere = false;

						if(loadedChildren[type].length == 0) {
							// debugLog("Need to download Webble definition for " + type + "(" + webbleDefNames[type] + ")");
							$scope.downloadWebbleDef(webbleDefNames[type]);
						}
						break;
					}
				}
			}

			if(allHere) {
				// debugLog("all Webbles loaded.");
				setAllWebbleSlotsEtc();
			}
		}
	};

	// ======================================================================= \\
	// ============ This code checks any dropped in data to see if we can ==== \\
	// ============ visualize this in some interesting way. The default   ==== \\
	// ============ behavior is perhaps not that great and could be refined == \\
	// ============ a lot. Loads visualization Webbles and sends data to  ==== \\
	// ============ them. The data to visualize can be changed by the user === \\
	// ============ later. =================================================== \\
	// ======================================================================= \\
	function checkDataSource(webbleID) {
		debugLog("checkDataSource");
		var webble = $scope.getWebbleByInstanceId(webbleID);

		var format = webble.scope().gimme('ProvidedFormat');
		if(typeof format === 'string') {
			format = JSON.parse(format);
		}

		var dataSets = [];

		if(format.hasOwnProperty("format") && format.format.hasOwnProperty("sets")) {
			for(var s  = 0; s < format.format.sets.length; s++) {
				var set = format.format.sets[s];

				if(set.hasOwnProperty("idSlot") && set.hasOwnProperty("fieldList") && set["fieldList"].length > 0) {
					var ss = {};
					if(set.hasOwnProperty("name")) {
						ss.name = set.name;
					} else {
						ss.name = sourceName;
					}
					ss.fieldList = [];
					ss.idSlot = set.idSlot;


					for(var f = 0; f < set["fieldList"].length; f++) {
						var ff = {};
						ff.name = set["fieldList"][f].name;
						ff.type = set["fieldList"][f].type;
						ff.slot = set["fieldList"][f].slot;

						ss.fieldList.push(ff);
					}

					dataSets.push(ss);
				}
			}
		}

		if(dataSets.length > 0) {
			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			webble.scope().paste(dashboard);
			webble.scope().set("root:top", 10);
			webble.scope().set("root:left", 300);
			webble.scope().set("root:opacity", 0.05);

			var sourceName = webble.scope().gimme("PluginName");

			for(s = 0; s < dataSets.length; s++) {
				var set = dataSets[s];

				var setName = sourceName;
				if(set.hasOwnProperty("name")) {
					setName = set.name;
				}

				var toAssign = {};
				var vectors = [];
				var totals = [];

				for(var f = 0; f < set["fieldList"].length; f++) {
					var field = set.fieldList[f];

					if(field.type.indexOf("vector") >= 0) {
						vectors.push(f);
					} else {
						var n = field.name.toLowerCase();

						if(field.type.indexOf("date") >= 0) {
							if(n.indexOf("death") >= 0) {
								toAssign["deathDate"] = f;
							}
							if(n.indexOf("relap") >= 0) {
								toAssign["relapseDate"] = f;
							}
							if(n.indexOf("diag") >= 0) {
								toAssign["diagDate"] = f;
							}
							if(n.indexOf("lfu") >= 0 || n.indexOf("follow") >= 0) {
								toAssign["lfuDate"] = f;
							}
							if(n.indexOf("last") >= 0 || n.indexOf("follow") >= 0) {
								toAssign["lastDate"] = f;
							}
						}

						if(field.type.indexOf("number") >= 0) {
							if(n.indexOf(" to " >= 0) || n.indexOf("time") >= 0) {
								if(n.indexOf("death") >= 0) {
									toAssign["death"] = f;
								}
								if(n.indexOf("relap") >= 0) {
									toAssign["relapse"] = f;
								}
								if(n.indexOf("lfu") >= 0|| n.indexOf("follow") >= 0) {
									toAssign["lfu"] = f;
								}
							}

							if(n.indexOf("tot") >= 0) {
								totals.push(f);
							}
						}

						if(n.indexOf("volume change") >= 0) {
							toAssign["volumeChange"] = f;
						}
						if(n.indexOf("stage") >= 0) {
							toAssign["localStage"] = f;
						}
						if(n.indexOf("hist") >= 0) {
							toAssign["histology"] = f;
						}
						if(n.indexOf("treatm") >= 0) {
							toAssign["treatment"] = f;
						}
					}
				}

				if(buildMapping(toAssign, vectors, totals, set, sourceName, setName, s)) {
					break;
				}
			}
		}
	}



	// ======================================================================= \\
	// ============ This code assigns data to visualization components.   ==== \\
	// ============ It tries to make intelligent guesses about what data  ==== \\
	// ============ we have.   =============================================== \\
	// ======================================================================= \\
	function buildMapping(toAssign, vectors, totals, set, sourceName, setName, setIdx) {
		// debugLog("buildMapping");

		var haveLifetable = false;
		var mapping = {};
		mapping.plugins = [];

		if(toAssign.hasOwnProperty("deathDate")
			&& toAssign.hasOwnProperty("diagDate")) {
			haveLifetable = true;

			var plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false},{"name":"Date of Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false},{"name":"Time to Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false}]}];

			if(toAssign.hasOwnProperty("lfuDate") || toAssign.hasOwnProperty("lastDate")) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}];
				plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["deathDate"]].name}];
				if(toAssign.hasOwnProperty("lastDate")) {
					plugin.sets[0].fields[2].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lastDate"]].name}];
				} else {
					plugin.sets[0].fields[2].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfuDate"]].name}];
				}
			} else {
				plugin.sets[2].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}];
				plugin.sets[2].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["deathDate"]].name}];
			}

			mapping.plugins.push(plugin);
		} else if(toAssign.hasOwnProperty("death")) {
			haveLifetable = true;

			var plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false},{"name":"Date of Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false},{"name":"Time to Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false}]}];

			if(toAssign.hasOwnProperty("lfu")) {
				plugin.sets[1].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["death"]].name}];
				plugin.sets[1].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfu"]].name}];
			} else {
				plugin.sets[3].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["death"]].name}];
			}

			mapping.plugins.push(plugin);
		}

		if(toAssign.hasOwnProperty("relapseDate")
			&& toAssign.hasOwnProperty("diagDate")) {
			haveLifetable = true;

			var plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][1]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false},{"name":"Date of Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false},{"name":"Time to Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false}]}];

			if(toAssign.hasOwnProperty("lfuDate") || toAssign.hasOwnProperty("lastDate")) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}];
				plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapseDate"]].name}];
				if(toAssign.hasOwnProperty("lastDate")) {
					plugin.sets[0].fields[2].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lastDate"]].name}];
				} else {
					plugin.sets[0].fields[2].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfuDate"]].name}];
				}
			} else {
				plugin.sets[2].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}];
				plugin.sets[2].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapseDate"]].name}];
			}

			mapping.plugins.push(plugin);
		} else if(toAssign.hasOwnProperty("relapse")) {
			haveLifetable = true;

			var plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][1]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false},{"name":"Date of Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false},{"name":"Time to Last Follow-Up","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Date of Diagnosis","assigned":[],"template":false,"added":false},{"name":"Date of Death","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Time to Death","assigned":[],"template":false,"added":false}]}];

			if(toAssign.hasOwnProperty("lfu")) {
				plugin.sets[1].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapse"]].name}];
				plugin.sets[1].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfu"]].name}];
			} else {
				plugin.sets[3].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapse"]].name}];
			}

			mapping.plugins.push(plugin);
		}

		if(vectors.length > 0) {
			var plugin = {};
			plugin.grouping = true;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginHeatMap"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Vectors","assigned":[],"template":false,"added":false},{"name":"Column Names","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Vectors","assigned":[],"template":false,"added":false}]}];

			plugin.sets[1].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[vectors[0]].name}];

			mapping.plugins.push(plugin);


			var heatMapFormat = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginHeatMap"][0]).scope().gimme("ProvidedFormat");
			var heatMapName = plugin.name;
			var heatMapSetIdx = 0;
			var heatMapSetName = heatMapFormat.format.sets[heatMapSetIdx].name;


			plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginItemSetMining"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"Transactions","assigned":[],"template":false,"added":false}]},{"fields":[{"name":"Transactions","assigned":[],"template":false,"added":false},{"name":"Column Names","assigned":[],"template":false,"added":false}]}];

			plugin.sets[0].fields[0].assigned = [{"sourceName":heatMapName, "dataSetName":heatMapSetName, "dataSetIdx":heatMapSetIdx, "fieldName":heatMapFormat.format.sets[heatMapSetIdx].fieldList[0].name}];

			mapping.plugins.push(plugin);
		}

		if(totals.length > 1) {
			var plugin = {};
			plugin.grouping = false;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"dataX","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"FirstField"}],"template":false,"added":false},{"name":"dataY","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"Field2"}],"template":false,"added":false}]}];

			plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[totals[0]].name}];
			plugin.sets[0].fields[1].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[totals[1]].name}];

			mapping.plugins.push(plugin);
		}

		if(toAssign.hasOwnProperty("treatment")
			|| toAssign.hasOwnProperty("histology")
			|| toAssign.hasOwnProperty("localStage")
		) {
			var plugin = {};
			plugin.grouping = true;
			plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginBarChart"][0]).scope().gimme("PluginName");
			plugin.sets = [{"fields":[{"name":"data","assigned":[{"sourceName":"CSV Data Source","dataSetName":"CSV Data Source","dataSetIdx":0,"fieldName":"Field2"}],"template":false,"added":false}]},{"fields":[{"name":"data","assigned":[],"template":false,"added":false},{"name":"weights","assigned":[],"template":false,"added":false}]}];

			if(toAssign.hasOwnProperty("histology")) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["histology"]].name}];
			} else if(toAssign.hasOwnProperty("localStage")) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["localStage"]].name}];
			} else if(toAssign.hasOwnProperty("treatment")) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["treatment"]].name}];
			}

			mapping.plugins.push(plugin);
		}

		var plugin = {};
		plugin.grouping = true;
		plugin.name = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginParallelCoordinateHolder"][0]).scope().gimme("PluginName");
		plugin.sets = [{"fields":[{"name":"Coordinate 1","assigned":[],"template":false,"added":false},{"name":"Coordinate 2","assigned":[],"template":false,"added":false},{"name":"Optional Coordinate","assigned":[],"template":true,"added":false}]}];
		idx = 0;

		if(toAssign.hasOwnProperty("histology")) {
			plugin.sets[0].fields[idx].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["histology"]].name}];
			idx++;
		}
		if(toAssign.hasOwnProperty("localStage")) {
			plugin.sets[0].fields[idx].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["localStage"]].name}];
			idx++;
		}
		if(toAssign.hasOwnProperty("treatment")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["treatment"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["treatment"]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("volumeChange")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["volumeChange"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["volumeChange"]].name}],"template":false,"added":true});
			}
		}
		for(var t = 0; t < totals.length; t++) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[totals[t]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[totals[t]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("diagDate")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["diagDate"]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("lfuDate")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfuDate"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lfuDate"]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("lastDate")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lastDate"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["lastDate"]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("deathDate")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["deathDate"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["deathDate"]].name}],"template":false,"added":true});
			}
		}
		if(toAssign.hasOwnProperty("relapseDate")) {
			if(idx < 2) {
				plugin.sets[0].fields[0].assigned = [{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapseDate"]].name}];
				idx++;
			} else {
				plugin.sets[0].fields.push({"name":"Optional Coordinate","assigned":[{"sourceName":sourceName, "dataSetName":setName, "dataSetIdx":setIdx, "fieldName":set.fieldList[toAssign["relapseDate"]].name}],"template":false,"added":true});
			}
		}

		mapping.plugins.push(plugin);

		// debugLog("build this mapping: " + JSON.stringify(mapping));

		$timeout(function(){
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]).scope().set("Mapping", mapping);
		}, 1);

		$timeout(function(){
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginParallelCoordinateHolder"][0]).scope().set("ResetAllSelections", true);
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][0]).scope().set("ResetAllSelections", true);
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][1]).scope().set("ResetAllSelections", true);
			$scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginBarChart"][0]).scope().set("ResetAllSelections", true);
		}, 1);

		return haveLifetable;
	}



	// =============================================================== \\
	// ============ Set Webble properties of Webbles we loaded.   ==== \\
	// =============================================================== \\
	var setProtections = function(webble, inRepo, isWindow, isDashboard) {
		var prot = webble.scope().getProtection();

		if(!isWindow) {
			prot = prot | Enum.bitFlags_WebbleProtection.CHILD_CONNECT;
		}

		prot = prot | Enum.bitFlags_WebbleProtection.PUBLISH;

		if(!inRepo) {
			if(!isWindow && !isDashboard) {
				prot = prot | Enum.bitFlags_WebbleProtection.DUPLICATE;
			}
			prot = prot | Enum.bitFlags_WebbleProtection.PARENT_DISCONNECT;
			prot = prot | Enum.bitFlags_WebbleProtection.SHAREDMODELDUPLICATE;
			prot = prot | Enum.bitFlags_WebbleProtection.DELETE;
		}

		webble.scope().setProtection(prot);

		webble.scope().set("autoSlotConnEnabled", false);
		webble.scope().connectSlots('','', {send: false, receive: false});

		var ios = webble.scope().theInteractionObjects;
		for(var i = 0, io; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'Resize'){
				io.scope().setIsEnabled(false);
			}
			if(io.scope().getName() == 'Rotate'){
				io.scope().setIsEnabled(false);
			}
		}

		webble.scope().addPopupMenuItemDisabled('EditCustomMenuItems');
		webble.scope().addPopupMenuItemDisabled('EditCustomInteractionObjects');
		webble.scope().addPopupMenuItemDisabled('Bundle');
		webble.scope().addPopupMenuItemDisabled('BringFwd');
		webble.scope().addPopupMenuItemDisabled('ConnectSlots');
		webble.scope().addPopupMenuItemDisabled('Protect');
		webble.scope().addPopupMenuItemDisabled('AddCustomSlots');
		webble.scope().addPopupMenuItemDisabled('About');
		webble.scope().addPopupMenuItemDisabled('AssignParent');

		// if(!isDashboard) {
		//     webble.scope().addPopupMenuItemDisabled('Props');
		// }
	};



	// ==================================================================== \\
	// ============ Set Webble more properties of Webbles we loaded.   ==== \\
	// ============ Size, position, child/parent relationships etc.    ==== \\
	// ==================================================================== \\
	var setAllWebbleSlotsEtc = function() {
		if(setupDone) {
			return;
		}

		for (var t in loadedChildren) {
			if (loadedChildren.hasOwnProperty(t)) {
				for(var w = 0; w < loadedChildren[t].length; w++) {
					$scope.getWebbleByInstanceId(loadedChildren[t][w]).scope().set("root:opacity", 1);
				}
			}
		}

		var tt = gettext("Event Repository");
		debugLog("language test " + tt);

		var tt2 = gettextCatalog.getString("Event Repository");
		var tobtt = gettextCatalog.getString("TOB");
		debugLog("language test 2 " + tt2 + " " + tobtt);


		if(mode == "design" && status == "development") {
			// repository window
			var repo = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][0]);
			repo.scope().set("root:top", 0);
			repo.scope().set("root:left", 0);
			repo.scope().set("titleBarTxt", gettextCatalog.getString("Event Repository"));
			repo.scope().set("titleBarVisible", true);
			repo.scope().set("verticalStretch", true);
			repo.scope().set("contentClickBehavior", 2);
			repo.scope().set("killDefectors", true);
			repo.scope().set("windowContainer:width", 160);
			repo.scope().set("miniBtnVisible", false);
			repo.scope().set("maxiBtnVisible", false);
			repo.scope().set("closeBtnVisible", false);

			// workboard window
			var wbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][1]);
			wbw.scope().set("root:top", 0);
			wbw.scope().set("root:left", 160);
			if($scope.trial !== "") {
				wbw.scope().set("titleBarTxt", gettextCatalog.getString("Clinical Trial Master Plan") + ": " + $scope.trial);
			} else {
				wbw.scope().set("titleBarTxt", gettextCatalog.getString("Clinical Trial Master Plan"));
			}
			wbw.scope().set("titleBarVisible", true);
			wbw.scope().set("verticalStretch", true);
			wbw.scope().set("contentClickBehavior", 0);
			wbw.scope().set("killDefectors", false);
			wbw.scope().set("horizontalStretch", true);
			wbw.scope().set("grabDropped", true);
			wbw.scope().set("miniBtnVisible", false);
			wbw.scope().set("maxiBtnVisible", false);
			wbw.scope().set("closeBtnVisible", false);

			// workboard
			var wb = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			wb.scope().paste(wbw);
			wb.scope().set("root:top", 0);
			wb.scope().set("root:left", 0);
			wb.scope().set("Mode", "design");
			wb.scope().set("TOBEventName", "TOBMedEvent");
			wb.scope().set("workboard:opacity", 0.1);

			wb.scope().set("Trial", $scope.trialID);
			wb.scope().databaseCRFfunction = sendCRFs;

			// timeline
			var tl = $scope.getWebbleByInstanceId(loadedChildren["TOBTimeline"][0]);
			tl.scope().paste(wb);
			tl.scope().set('root:left', '0px');
			tl.scope().set('root:top', '30px');

			// events
			var e0 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][0]);
			e0.scope().paste(repo);
			e0.scope().set("root:top", 20);
			e0.scope().set("root:left", 20);
			e0.scope().set("MedEventId", -1);
			e0.scope().set("MedEventType", 'chem');

			var e1 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][1]);
			e1.scope().paste(repo);
			e1.scope().set("root:top", 80);
			e1.scope().set("root:left", 20);
			e1.scope().set("MedEventId", -1);
			e1.scope().set("MedEventType", 'rad');

			var e2 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][2]);
			e2.scope().paste(repo);
			e2.scope().set("root:top", 140);
			e2.scope().set("root:left", 20);
			e2.scope().set("MedEventId", -1);
			e2.scope().set("MedEventType", 'sup');

			var e3 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][3]);
			e3.scope().paste(repo);
			e3.scope().set("root:top", 200);
			e3.scope().set("root:left", 30);
			e3.scope().set("MedEventId", -1);
			e3.scope().set("MedEventType", 'rand');
			e3.scope().set("NoOfUnits", 45);

			var e4 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][4]);
			e4.scope().paste(repo);
			e4.scope().set("root:top", 190);
			e4.scope().set("root:left", 50);
			e4.scope().set("MedEventId", -1);
			e4.scope().set("MedEventType", 'reg');
			e4.scope().set("NoOfUnits", 70);

			var e5 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][5]);
			e5.scope().paste(repo);
			e5.scope().set("root:top", 190);
			e5.scope().set("root:left", 70);
			e5.scope().set("MedEventId", -1);
			e5.scope().set("MedEventType", 'stratif');
			e5.scope().set("NoOfUnits", 70);

			var e6 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][6]);
			e6.scope().paste(repo);
			e6.scope().set("root:top", 190);
			e6.scope().set("root:left", 90);
			e6.scope().set("MedEventId", -1);
			e6.scope().set("MedEventType", 'ptc');
			e6.scope().set("NoOfUnits", 70);

			var e7 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][7]);
			e7.scope().paste(repo);
			e7.scope().set("root:top", 285);
			e7.scope().set("root:left", 25);
			e7.scope().set("MedEventId", -1);
			e7.scope().set("MedEventType", 'com');

			var e8 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][8]);
			e8.scope().paste(repo);
			e8.scope().set("root:top", 285);
			e8.scope().set("root:left", 60);
			e8.scope().set("MedEventId", -1);
			e8.scope().set("MedEventType", 'pat');

			var e9 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][9]);
			e9.scope().paste(repo);
			e9.scope().set("root:top", 285);
			e9.scope().set("root:left", 95);
			e9.scope().set("MedEventId", -1);
			e9.scope().set("MedEventType", 'cons');

			var e10 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][10]);
			e10.scope().paste(repo);
			e10.scope().set("root:top", 390);
			e10.scope().set("root:left", 25);
			e10.scope().set("MedEventId", -1);
			e10.scope().set("MedEventType", 'blood');

			var e11 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][11]);
			e11.scope().paste(repo);
			e11.scope().set("root:top", 390);
			e11.scope().set("root:left", 60);
			e11.scope().set("MedEventId", -1);
			e11.scope().set("MedEventType", 'imag');

			var e12 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][12]);
			e12.scope().paste(repo);
			e12.scope().set("root:top", 390);
			e12.scope().set("root:left", 95);
			e12.scope().set("MedEventId", -1);
			e12.scope().set("MedEventType", 'biop');

			var e13 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][13]);
			e13.scope().paste(repo);
			e13.scope().set("root:top", 392);
			e13.scope().set("root:left", 25);
			e13.scope().set("MedEventId", -1);
			e13.scope().set("MedEventType", 'surga');

			var e14 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][14]);
			e14.scope().paste(repo);
			e14.scope().set("root:top", 392);
			e14.scope().set("root:left", 60);
			e14.scope().set("MedEventId", -1);
			e14.scope().set("MedEventType", 'surg');

			var e15 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][15]);
			e15.scope().paste(repo);
			e15.scope().set("root:top", 392);
			e15.scope().set("root:left", 95);
			e15.scope().set("MedEventId", -1);
			e15.scope().set("MedEventType", 'surgc');

			var e16 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][16]);
			e16.scope().paste(repo);
			e16.scope().set("root:top", 430);
			e16.scope().set("root:left", 35);
			e16.scope().set("MedEventId", -1);
			e16.scope().set("MedEventType", 'rep');

			var e17 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][17]);
			e17.scope().paste(repo);
			e17.scope().set("root:top", 430);
			e17.scope().set("root:left", 75);
			e17.scope().set("MedEventId", -1);
			e17.scope().set("MedEventType", 'saesusar');

			setProtections(e0, true, false, false);
			setProtections(e1, true, false, false);
			setProtections(e2, true, false, false);
			setProtections(e3, true, false, false);
			setProtections(e4, true, false, false);
			setProtections(e5, true, false, false);
			setProtections(e6, true, false, false);
			setProtections(e7, true, false, false);
			setProtections(e8, true, false, false);
			setProtections(e9, true, false, false);
			setProtections(e10, true, false, false);
			setProtections(e11, true, false, false);
			setProtections(e12, true, false, false);
			setProtections(e13, true, false, false);
			setProtections(e14, true, false, false);
			setProtections(e15, true, false, false);
			setProtections(e16, true, false, false);
			setProtections(e17, true, false, false);

			setProtections(repo, false, true, false);
			setProtections(wbw, false, true, false);
			setProtections(wb, false, false, false);
			setProtections(tl, false, false, false);


			repo.scope().set("contentClickBehavior", 0);
			repo.scope().set("contentClickBehavior", 2);

		}

		else if(mode == "design" && status == "running") {
			// workboard window
			var wbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][0]);
			wbw.scope().set("root:top", 0);
			wbw.scope().set("root:left", 0);
			if($scope.trial !== "") {
				wbw.scope().set("titleBarTxt", gettextCatalog.getString("Clinical Trial Master Plan") + ": " + $scope.trial + " (RUNNING)");
			} else {
				wbw.scope().set("titleBarTxt", gettextCatalog.getString("Clinical Trial Master Plan"));
			}
			wbw.scope().set("titleBarVisible", true);
			wbw.scope().set("verticalStretch", true);
			wbw.scope().set("contentClickBehavior", 0);
			wbw.scope().set("killDefectors", false);
			wbw.scope().set("horizontalStretch", true);
			wbw.scope().set("grabDropped", false);
			wbw.scope().set("miniBtnVisible", false);
			wbw.scope().set("maxiBtnVisible", false);
			wbw.scope().set("closeBtnVisible", false);

			// workboard
			var wb = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			wb.scope().paste(wbw);
			wb.scope().set("root:top", 0);
			wb.scope().set("root:left", 0);
			wb.scope().set("Mode", "running");
			wb.scope().set("TOBEventName", "TOBMedEvent");
			wb.scope().set("workboard:opacity", 0.1);

			wb.scope().set("Trial", $scope.trialID);
			wb.scope().databaseCRFfunction = sendCRFs;

			// timeline
			var tl = $scope.getWebbleByInstanceId(loadedChildren["TOBTimeline"][0]);
			tl.scope().paste(wb);
			tl.scope().set('root:left', '0px');
			tl.scope().set('root:top', '30px');

			// events
			var e0 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][0]);
			e0.scope().set("root:top", 20);
			e0.scope().set("root:left", 50);
			e0.scope().set("MedEventId", -1);
			e0.scope().set("MedEventType", 'chem');
			//e0.scope().set("root:opacity", 0);

			setProtections(e0, true, false, false);
			setProtections(wbw, false, true, false);
			setProtections(wb, false, false, false);
			setProtections(tl, false, false, false);
		}

		else if(mode == "patient") {
			// workboard window
			var wbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][0]);
			wbw.scope().set("root:top", 0);
			wbw.scope().set("root:left", 0);
			wbw.scope().set("titleBarTxt", gettextCatalog.getString("Clinical Trial Master Plan"));
			wbw.scope().set("titleBarVisible", true);
			wbw.scope().set("verticalStretch", true);
			wbw.scope().set("contentClickBehavior", 0);
			wbw.scope().set("killDefectors", false);
			wbw.scope().set("horizontalStretch", true);
			wbw.scope().set("grabDropped", false);
			// wbw.scope().set("windowContainer:height", "50%");
			wbw.scope().set("miniBtnVisible", false);
			wbw.scope().set("maxiBtnVisible", false);
			wbw.scope().set("closeBtnVisible", false);

			// workboard
			var wb = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			wb.scope().paste(wbw);
			wb.scope().set("root:top", 0);
			wb.scope().set("root:left", 0);
			wb.scope().set("Mode", "patient");
			wb.scope().set("TOBEventName", "TOBMedEvent");
			wb.scope().set("PatientboardName", "TOBPatientboard");
			wb.scope().set("workboard:opacity", 0.1);

			wb.scope().set("Patient", $scope.patientID);
			wb.scope().set("Trial", $scope.trialID);
			wb.scope().databaseCRFfunction = sendCRFs;

			// timeline
			var tl = $scope.getWebbleByInstanceId(loadedChildren["TOBTimeline"][0]);
			tl.scope().paste(wb);
			tl.scope().set('root:left', '0px');
			tl.scope().set('root:top', '30px');

			// events
			var e0 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][0]);
			e0.scope().set("root:top", 1000);
			e0.scope().set("root:left", 0);
			e0.scope().set("MedEventId", -1);
			e0.scope().set("MedEventType", 'chem');
			//e0.scope().set("root:opacity", 0);

			// patientboard window
			var pbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][1]);
			pbw.scope().set("root:top", "50%");
			pbw.scope().set("root:left", 0);
			pbw.scope().set("titleBarTxt", gettextCatalog.getString("Personal Treatment Plan"));
			pbw.scope().set("titleBarVisible", true);
			pbw.scope().set("verticalStretch", true);
			pbw.scope().set("contentClickBehavior", 0);
			pbw.scope().set("killDefectors", false);
			pbw.scope().set("horizontalStretch", true);
			pbw.scope().set("grabDropped", false);
			pbw.scope().set("miniBtnVisible", false);
			pbw.scope().set("maxiBtnVisible", false);
			pbw.scope().set("closeBtnVisible", false);

			// patientboard
			var pb = $scope.getWebbleByInstanceId(loadedChildren["TOBPatientboard"][0]);
			pb.scope().paste(pbw);
			pb.scope().set("root:top", 0);
			pb.scope().set("root:left", 0);
			pb.scope().set("patientboard:opacity", 0.1);

			pb.scope().set("Patient", $scope.patientID);
			pb.scope().set("Trial", $scope.trialID);
			pb.scope().databaseCRFfunction = sendCRFs;

			// timeline
			var tl2 = $scope.getWebbleByInstanceId(loadedChildren["TOBTimeline"][1]);
			tl2.scope().paste(pb);
			tl2.scope().set('root:left', '0px');
			tl2.scope().set('root:top', '30px');

			setProtections(e0, true, false, false);
			setProtections(wbw, false, true, false);
			setProtections(wb, false, false, false);
			setProtections(tl, false, false, false);
			setProtections(pbw, false, true, false);
			setProtections(pb, false, false, false);
			setProtections(tl2, false, false, false);

		}

		else if(mode == "analysis") {
			// $scope.openForm(Enum.aopForms.infoMsg, {title: 'Analysis Mode not Implemented', content: 'The TOB data analysis mode has not been implemented in the HTML5 version of TOB yet.'});


			// workboard window
			var wbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][0]);
			wbw.scope().set("root:top", 0);
			wbw.scope().set("root:left", 0);
			wbw.scope().set("titleBarTxt", "Clinical Trial Master Plan");
			wbw.scope().set("titleBarVisible", true);
			wbw.scope().set("verticalStretch", true);
			wbw.scope().set("contentClickBehavior", 0);
			wbw.scope().set("killDefectors", false);
			wbw.scope().set("horizontalStretch", true);
			wbw.scope().set("grabDropped", false);
			// wbw.scope().set("windowContainer:height", "50%");
			wbw.scope().set("miniBtnVisible", false);
			wbw.scope().set("maxiBtnVisible", false);
			wbw.scope().set("closeBtnVisible", false);

			// workboard
			var wb = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			wb.scope().paste(wbw);
			wb.scope().set("root:top", 0);
			wb.scope().set("root:left", 0);
			wb.scope().set("Mode", "analysis");
			wb.scope().set("TOBEventName", "TOBMedEvent");
			wb.scope().set("PatientboardName", "TOBPatientboard");
			wb.scope().set("workboard:opacity", 0.1);

			wb.scope().set("Trial", $scope.trialID);
			wb.scope().databaseCRFfunction = sendCRFs;

			// timeline
			var tl = $scope.getWebbleByInstanceId(loadedChildren["TOBTimeline"][0]);
			tl.scope().paste(wb);
			tl.scope().set('root:left', '0px');
			tl.scope().set('root:top', '30px');

			// events
			var e0 = $scope.getWebbleByInstanceId(loadedChildren["TOBMedEvent"][0]);
			e0.scope().set("root:top", 20);
			e0.scope().set("root:left", 50);
			e0.scope().set("MedEventId", -1);
			e0.scope().set("MedEventType", 'chem');
			//e0.scope().set("root:opacity", 0);

			// analysis window

			var pbw = $scope.getWebbleByInstanceId(loadedChildren["Basic Window"][1]);
			pbw.scope().set("root:top", "50%");
			pbw.scope().set("root:left", 0);
			pbw.scope().set("titleBarTxt", "Data Analysis");
			pbw.scope().set("titleBarVisible", true);
			pbw.scope().set("verticalStretch", true);
			pbw.scope().set("contentClickBehavior", 0);
			pbw.scope().set("killDefectors", false);
			pbw.scope().set("horizontalStretch", true);
			pbw.scope().set("grabDropped", false);
			pbw.scope().set("miniBtnVisible", false);
			pbw.scope().set("maxiBtnVisible", false);
			pbw.scope().set("closeBtnVisible", false);

			// Digital Dashboard
			var dashboard = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboard"][0]);
			dashboard.scope().paste(pbw);
			dashboard.scope().set("root:top", 0);
			dashboard.scope().set("root:left", 0);
			dashboard.scope().set("dashboardBackgroundBox:opacity", 0.1);
			dashboard.scope().set("Colors",
				{"skin":{"color":"#FFFACD","border":"#FFA500","gradient":[{"pos":0,"color":"#FFFEF5"},{"pos":0.75,"color":"#FFFACD"},{"pos":1,"color":"#FFFACD"}]},"selection":{"color":"#FFEBCD","border":"#FFA500","gradient":[{"pos":0,"color":"#FFFBF5"},{"pos":1,"color":"#FFEBCD"}]},"groups":{"0":{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},"1":{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},"4":{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},"5":{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},"6":{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},"2":{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},"3":{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},"7":{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},"8":{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},"9":{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},"10":{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},"11":{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},"12":{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},"13":{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},"14":{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}}
			);
			var plugin1 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][0]);
			plugin1.scope().set("PluginName", "Death");
			plugin1.scope().set("DrawingArea:width", 240);
			plugin1.scope().set("DrawingArea:height", 150);
			plugin1.scope().set("TreatNullAsAlive", true);
			plugin1.scope().paste(dashboard);
			plugin1.scope().set("root:top", 20);
			plugin1.scope().set("root:left", 20);

			var plugin2 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginLifeTable"][1]);
			plugin2.scope().set("PluginName", "Relapse");
			plugin2.scope().set("DrawingArea:width", 240);
			plugin2.scope().set("DrawingArea:height", 150);
			plugin2.scope().set("TreatNullAsAlive", true);
			plugin2.scope().paste(dashboard);
			plugin2.scope().set("root:top", 20);
			plugin2.scope().set("root:left", 270);

			var plugin3 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginHeatMap"][0]);
			plugin3.scope().set("SortRows", true);
			plugin3.scope().set("SortCols", true);
			plugin3.scope().set("HotColor", "#FF3300");
			plugin3.scope().paste(dashboard);
			plugin3.scope().set("root:top", 20);
			plugin3.scope().set("root:left", 520);

			var plugin4 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginBarChart"][0]);
			plugin4.scope().set("DrawingArea:width", 240);
			plugin4.scope().set("DrawingArea:height", 150);
			plugin4.scope().paste(dashboard);
			plugin4.scope().set("root:top", 215);
			plugin4.scope().set("root:left", 20);

			var plugin5 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginScatterPlots"][0]);
			plugin5.scope().set("DrawingArea:width", 240);
			plugin5.scope().set("DrawingArea:height", 150);
			plugin5.scope().paste(dashboard);
			plugin5.scope().set("root:top", 215);
			plugin5.scope().set("root:left", 270);

			var plugin6 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginItemSetMining"][0]);
			plugin6.scope().paste(dashboard);
			plugin6.scope().set("root:top", 415);
			plugin6.scope().set("root:left", 10);

			var plugin7 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardPluginParallelCoordinateHolder"][0]);
			plugin7.scope().set("DrawingArea:width", 400);
			plugin7.scope().set("DrawingArea:height", 240);
			plugin7.scope().paste(dashboard);
			plugin7.scope().set("root:top", 415);
			plugin7.scope().set("root:left", 320);

			// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
			// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
			// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
			// var plugin8 = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardCSVDataSource"][0]);
			// plugin8.scope().set("root:opacity", 0.05);
			// // plugin8.scope().paste(dashboard);
			// plugin8.scope().set("root:top", 10);
			// plugin8.scope().set("root:left", 800);

			setProtections(e0, true, false, false);
			setProtections(wbw, false, true, false);
			setProtections(wb, false, false, false);
			setProtections(tl, false, false, false);
			setProtections(pbw, false, true, false);
			setProtections(dashboard, false, true, true);
			setProtections(plugin1, false, false, true);
			setProtections(plugin2, false, false, true);
			setProtections(plugin3, false, false, true);
			setProtections(plugin4, false, false, true);
			setProtections(plugin5, false, false, true);
			setProtections(plugin6, false, false, true);
			setProtections(plugin7, false, false, true);
			//setProtections(plugin8, false, false, true);

		}

		else {
			$scope.openForm(Enum.aopForms.infoMsg, {title: 'Unknown Mode Requested', content: 'The TOB was invoced with unrecognized arguments: status = ' + status + ", mode = " + mode + " and does not know what to do."});
		}

		setupDone = true;

		$scope.displayText = "TOB App";
		if($scope.trial !== "") {
			$scope.displayText = "Trial: " + $scope.trial;
		}

		if(obtimaTrial !== null) {
			var webble = $scope.getWebbleByInstanceId(loadedChildren["TOBWorkboard"][0]);
			webble.scope().set('LoadTrialData', obtimaTrial);
		}

		// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
		// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
		// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
		// if(obtimaData !== null && mode == "analysis" && loadedChildren["DigitalDashboardCSVDataSource"].length > 0) {
		// 	dataSourcesToListenTo.push(loadedChildren["DigitalDashboardCSVDataSource"][0]);
		// 	listeners.push($scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
		// 		childSlotchange(loadedChildren["DigitalDashboardCSVDataSource"][0]);
		// 	}, loadedChildren["DigitalDashboardCSVDataSource"][0], 'ProvidedFormatChanged'));
		//
		// 	var webble = $scope.getWebbleByInstanceId(loadedChildren["DigitalDashboardCSVDataSource"][0]);
		// 	webble.scope().set('DataTypes', obtimaData.typeStr);
		// 	webble.scope().set('DataNames', obtimaData.nameStr);
		// 	webble.scope().set('Data', obtimaData.csvStr);
		// }

	};

	// var slotListToName = function(slots) {
	// 	if(slots.hasOwnProperty("titleBarTxt") && slots.hasOwnProperty("killDefectors")) {
	// 	    return "Basic Window";
	// 	}
	// 	if(slots.hasOwnProperty("PatientboardName")) {
	// 	    return "TOBWorkboard";
	// 	}
	// 	if(slots.hasOwnProperty("MedEventId")) {
	// 	    return "TOBMedEvent";
	// 	}
	// 	if(!slots.hasOwnProperty("PatientboardName") && slots.hasOwnProperty("SavedTrialData")) {
	// 	    return "TOBPatientboard";
	// 	}
	// 	if(slots.hasOwnProperty("AbsoluteTime") && slots.hasOwnProperty("StartDate") && slots.hasOwnProperty("NoOfDays")) {
	// 	    return "TOBTimeline";
	// 	}
	// 	// if(slots.hasOwnProperty("")) {
	// 	// }
	// 	return "";
	// };


	// ============================================================================ \\
	// ============ Listing what Webbles should be loaded based on TOB mode.   ==== \\
	// ============================================================================ \\
	var loadWebbleDefs = function(status, mode) {
		neededChildren = {};
		loadedChildren = {};

		neededChildren["Basic Window"] = 1;
		neededChildren["TOBMedEvent"] = 1;
		neededChildren["TOBTimeline"] = 1;
		neededChildren["TOBWorkboard"] = 1;
		neededChildren["TOBPatientboard"] = 0;

		loadedChildren["Basic Window"] = [];
		loadedChildren["TOBMedEvent"] = [];
		loadedChildren["TOBTimeline"] = [];
		loadedChildren["TOBWorkboard"] = [];
		loadedChildren["TOBPatientboard"] = [];

		loadedChildren["DigitalDashboard"] = [];
		loadedChildren["DigitalDashboardPluginBarChart"] = [];
		loadedChildren["DigitalDashboardPluginHeatMap"] = [];
		loadedChildren["DigitalDashboardPluginScatterPlots"] = [];
		loadedChildren["DigitalDashboardPluginLifeTable"] = [];
		loadedChildren["DigitalDashboardPluginItemSetMining"] = [];
		loadedChildren["DigitalDashboardPluginParallelCoordinateHolder"] = [];

		// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
		// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
		// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
		//loadedChildren["DigitalDashboardCSVDataSource"] = [];

		webbleDefNames["Basic Window"] = "basicWindow";
		webbleDefNames["TOBMedEvent"] = "TOBMedEvent";
		webbleDefNames["TOBTimeline"] = "TOBTimeline";
		webbleDefNames["TOBWorkboard"] = "TOBWorkboard";
		webbleDefNames["TOBPatientboard"] = "TOBPatientboard";

		webbleDefNames["DigitalDashboard"] = "DigitalDashboard";
		webbleDefNames["DigitalDashboardPluginBarChart"] = "DigitalDashboardPluginBarChart";
		webbleDefNames["DigitalDashboardPluginHeatMap"] = "DigitalDashboardPluginHeatMap";
		webbleDefNames["DigitalDashboardPluginScatterPlots"] = "DigitalDashboardPluginScatterPlots";
		webbleDefNames["DigitalDashboardPluginLifeTable"] = "DigitalDashboardPluginLifeTable";
		webbleDefNames["DigitalDashboardPluginItemSetMining"] = "DigitalDashboardPluginItemSetMining";
		webbleDefNames["DigitalDashboardPluginParallelCoordinateHolder"] = "DigitalDashboardPluginParallelCoordinateHolder";

		// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
		// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
		// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
		//webbleDefNames["DigitalDashboardCSVDataSource"] = "DigitalDashboardCSVDataSource";

		if(mode == "design" && status == "development") {

			neededChildren["Basic Window"] = 2;
			neededChildren["TOBMedEvent"] = 18; // 18 Webbles in Repository Window

		} else if(mode == "patient") {
			// debugLog("load patientboard Webble");

			neededChildren["Basic Window"] = 2;
			neededChildren["TOBMedEvent"] = 1;
			neededChildren["TOBPatientboard"] = 1;
			neededChildren["TOBTimeline"] = 2;

			// ls.push("TOBPatientboard");
		} else if(mode == "analysis") {
			// debugLog("we should load Dashboard etc.");

			neededChildren["Basic Window"] = 2;
			neededChildren["TOBMedEvent"] = 1;
			neededChildren["TOBTimeline"] = 1;

			neededChildren["DigitalDashboard"] = 1;
			neededChildren["DigitalDashboardPluginBarChart"] = 1;
			neededChildren["DigitalDashboardPluginHeatMap"] = 1;
			neededChildren["DigitalDashboardPluginScatterPlots"] = 1;
			neededChildren["DigitalDashboardPluginLifeTable"] = 2;
			neededChildren["DigitalDashboardPluginItemSetMining"] = 1;
			neededChildren["DigitalDashboardPluginParallelCoordinateHolder"] = 1;

			// TODO: DigitalDashboardCSVDataSource IS THE TEMPLATE NAME AND NOT THE DISPLAY NAME< NEED TO BE FIXED IF THIS WEBBLE IS BEING USED
			// TODO: DigitalDashboardCSVDataSource IS ALSO EXTREMELY OUT OF DATE AND NOT WORKING PROPERLY BETTER TO USE THE DigitalDashboardSmartDataSource WHICH DO THE SAME BUT MUCH BETTER
			// TODO: OR BETTER YET, SWITCH TO THE NEW VERSION OF DIGITAL DASHBOARD 3.0 TNG
			//neededChildren["DigitalDashboardCSVDataSource"] = 1;
		}

		$scope.downloadWebbleDef(webbleDefNames["TOBWorkboard"]);
	};

	//===================================================================================
	// Webble template Interaction Object Activity Reaction
	// If this template has its own custom Interaction balls that needs to be taken care
	// of when activated, then it is here where that should be executed.
	// If this function is empty and unused it can safely be deleted.
	//===================================================================================
	$scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
		var targetName = $(event.target).scope().getName();

		if (targetName != ""){
			//=== [TARGET NAME] ====================================
			//=============================================
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
