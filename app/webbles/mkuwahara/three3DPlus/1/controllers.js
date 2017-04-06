//======================================================================================================================
// Controllers for 3D World Plus Container for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('threeDPlusCtrl', function($scope, $log, $timeout, Slot, Enum, isEmpty) {

    // WebGL presence check
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        threeDPlusContainer: ['background-color', 'border', 'border-radius'],
        threeDPlusHolder: ['width', 'height', 'background-color', 'border', 'border-radius']
    };

    var scene, camera, renderer;
    var geometry, material, mesh;
    var ambientLight, directionalLights = [];
    //var loader = new THREE.JSONLoader();
    //var controls;

    var threeDPlusContainer, threeDPlusHolder;

    var prevGeometry = -1;


    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        threeDPlusContainer = $scope.theView.parent().find("#threeDPlusContainer");
        threeDPlusHolder = $scope.theView.parent().find("#threeDPlusHolder");

        // $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			// if(eventData.slotName == 'threeDPlusHolder:width' || eventData.slotName == 'threeDPlusHolder:height'){
			// 	if(renderer){
			// 		renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
			// 	}
			// }
			// else if(eventData.slotName == 'geometry' || eventData.slotName == 'meshJSON' || eventData.slotName == 'meshDataOverride' || eventData.slotName == 'meshColor' || eventData.slotName == 'imgTexture'
			// 	|| eventData.slotName == 'geometryWidth' || eventData.slotName == 'geometryHeight' || eventData.slotName == 'geometryDepth' || eventData.slotName == 'ambientLightColor'
			// 	|| eventData.slotName == 'dirLightColor' || eventData.slotName == 'geometryWidthSegments' || eventData.slotName == 'geometryHeightSegments' || eventData.slotName == 'geometryDepthSegments'
			// 	|| eventData.slotName == 'geometryRadius' || eventData.slotName == 'geometryInnerBottomRadius' || eventData.slotName == 'phiLength' || eventData.slotName == 'thetaLength'
			// 	|| eventData.slotName == 'geometryRadiusSegments' || eventData.slotName == 'openCapEnabled' || eventData.slotName == 'geometryTubeDiameter'){
			// 	redrawScene();
			// }
        // });
        //
        // $scope.addSlot(new Slot('geometry',
        //     1,
        //     'Geometry',
        //     'Either one of the predefined geometries or one found in the JSON mesh data',
        //     $scope.theWblMetadata['templateid'],
        //     {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Mesh Data', 'Box', 'Sphere', 'Plane', 'Cylinder', 'Ring', 'Circle', 'Icosahedron', 'Octahedron', 'Tetrahedron', 'Torus', 'Torus Knot']},
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('autoAnimateEnabled',
        //     true,
        //     'Auto Animation Enabled',
        //     'When enabled the loaded mesh will rotate on its own, when unchecked it will be still.',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('meshJSON',
			// {},
        //     'JSON Mesh',
        //     'A mesh described as a JSON object',
        //     $scope.theWblMetadata['templateid'],
        //     {inputType: Enum.aopInputTypes.TextArea},
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('meshDataOverride',
        //     false,
        //     'Override Mesh Data',
        //     'If checked then material values etc will be picked up via slots and not from the original mesh data JSON object.',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('meshColor',
        //     '#00ff00',
        //     'Mesh Color',
        //     'Color of the current mesh',
        //     $scope.theWblMetadata['templateid'],
			// {inputType: Enum.aopInputTypes.ColorPick},
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('imgTexture',
        //     '',
        //     'Image Texture',
        //     'An image that will be used as texture of the 3D object instead of just using color',
        //     $scope.theWblMetadata['templateid'],
        //     {inputType: Enum.aopInputTypes.ImagePick},
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryWidth',
        //     2,
        //     'Geometry Width',
        //     'If applicable to the selected geometry this is the width that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryHeight',
        //     2,
        //     'Geometry Height',
        //     'If applicable to the selected geometry this is the height that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryDepth',
        //     2,
        //     'Geometry Depth',
        //     'If applicable to the selected geometry this is the depth that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryRadius',
        //     1.5,
        //     'Geometry Radius',
        //     'If applicable to the selected geometry this is the radius (also outer and top radius) that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryInnerBottomRadius',
        //     1.5,
        //     'Geometry Second Radius',
        //     'If applicable to the selected geometry this is the radius used for inner and bottom radius',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryTubeDiameter',
        //     0.4,
        //     'Geometry Tube Diameter',
        //     'If applicable to the selected geometry (mainly Torus) this is the diameter used for the tube.',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('phiLength',
        //     Math.PI * 2,
        //     'Geometry Horizontal Sweep angle',
        //     'If applicable to the selected geometry this is the horizontal sweep angle (in rad) size that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('thetaLength',
        //     Math.PI * 2,
        //     'Geometry Vertical Sweep angle',
        //     'If applicable to the selected geometry this is the vertical sweep angle (in rad) size that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('openCapEnabled',
        //     false,
        //     'Geometry Open Cap Enabled',
        //     'If applicable to the selected geometry this checkbox either close or open the ends of the geometry (basically cylinder only)',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryWidthSegments',
        //     32,
        //     'Geometry Width Segments',
        //     'If applicable to the selected geometry this is the number of segements of the width that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryHeightSegments',
        //     32,
        //     'Geometry Height Segments',
        //     'If applicable to the selected geometry this is the number of segements of the height that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryDepthSegments',
        //     32,
        //     'Geometry Depth Segments',
        //     'If applicable to the selected geometry this is the number of segements of the depth that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('geometryRadiusSegments',
        //     32,
        //     'Geometry Radius Segments',
        //     'If applicable to the selected geometry this is the number of segements of the radius that are used',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('ambientLightColor',
        //     '#999999',
        //     'Ambient Light Color',
        //     'The color of the ambient light',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));
        //
        // $scope.addSlot(new Slot('dirLightColor',
        //     '#ffffff',
        //     'Directional Light Color',
        //     'The color of the directional light',
        //     $scope.theWblMetadata['templateid'],
        //     undefined,
        //     undefined
        // ));

        $scope.setResizeSlots('threeDPlusHolder:width', 'threeDPlusHolder:height');

        $scope.theView.parent().draggable('option', 'cancel', '#threeDPlusHolder');
        threeDPlusHolder.bind('contextmenu',function(){ if(!$scope.altKeyIsDown){return false;} });

		if (Detector.webgl) {
			init();
			redrawScene();
		} else {
			var warning = Detector.getWebGLErrorMessage();
			warning.innerText = "Your Browser does not support WebGL and can therefore not display 3D graphics. \nWe recommend that you change browser.";
			($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(warning);
		}
    };
    //===================================================================================


    //===================================================================================
    // Webble template Interaction Object Activity Reaction
    // If this template has its own custom Interaction balls that needs to be taken care
    // of when activated, then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
//    $scope.coreCall_Event_InteractionObjectActivityReaction = function(event){
//        var targetName = $(event.target).scope().getName();
//
//        if (targetName != ""){
//            //=== [TARGET NAME] ====================================
//            //if (targetName == $scope.customInteractionBalls[0].name){
//            //    [CODE FOR MOUSE DOWN]
//            //    $scope.theView.mouseup(function(event){
//            //        [CODE FOR MOUSE UP]
//            //    });
//            //    $scope.theView.mousemove(function(event){
//            //        [CODE FOR MOUSE MOVE]
//            //    });
//            //}
//            //=============================================
//
//            //=== Jump ====================================
//            // EXAMPLE:
//            //if (targetName == $scope.customInteractionBalls[0].name){ //jump
//            //    $scope.set('root:left', 0);
//            //    $scope.set('root:top', 0);
//            //}
//            //=============================================
//        }
//    };
//    //===================================================================================
//
//
//    //===================================================================================
//    // Webble template Menu Item Activity Reaction
//    // If this template has its own custom menu items that needs to be taken care of,
//    // then it is here where that should be executed.
//    // If this function is empty and unused it can safely be deleted.
//    //===================================================================================
//    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
//        //if(itemName == $scope.customMenu[0].itemId){  //[CUSTOM ITEM NAME]
//        //    [CODE FOR THIS MENU ITEM GOES HERE]
//        //}
//
//        // EXAMPLE:
//        //if(itemName == $scope.customMenu[0].itemId){  //eat
//        //    $log.log('Are you hungry?');
//        //}
//        //else if(itemName == $scope.customMenu[1].itemId){  //drink
//        //    $log.log('Are you thirsty?')
//        //}
//    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
//    $scope.coreCall_CreateCustomWblDef = function(){
//        var customWblDefPart = {
//
//        };
//
//        return customWblDefPart;
//    };
    //===================================================================================



    //========================================================================================
    // Initiate
    // Initiates the scene, renderer and the camera controller.
    //========================================================================================
    var init = function() {
        // scene
        scene = new THREE.Scene();
        //scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

        // camera
        camera = new THREE.PerspectiveCamera(45, parseInt($scope.gimme('threeDPlusHolder:width')) / parseInt($scope.gimme('threeDPlusHolder:height')), 0.1, 1000);   //***POSSLOT: FOV, clipping plane
        camera.position.z = 5;  //***POSSLOT: camera position

        // renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(parseInt($scope.gimme('threeDPlusHolder:width')), parseInt($scope.gimme('threeDPlusHolder:height')));
        //Attach renderer
        ($scope.theView.parent().find('#threeDPlusHolder')[ 0 ]).appendChild(renderer.domElement);

        // //Controls
        // controls = new THREE.TrackballControls( camera, threeDPlusHolder[0] );
        // controls.rotateSpeed = 3.0;
        // controls.zoomSpeed = 1.2;
        // controls.panSpeed = 0.8;
        // controls.noZoom = false;
        // controls.noPan = false;
        // controls.staticMoving = true;
        // controls.dynamicDampingFactor = 0.3;

        animate();
    };
    //========================================================================================


    //========================================================================================
    // Animate
    // the animation cycle control function
    //========================================================================================
    var animate = function() {
        // request new frame
        requestAnimationFrame(function(){ animate(); });

        //var geo = $scope.gimme('geometry');
		if(mesh/* && $scope.gimme('autoAnimateEnabled')*/){
			mesh.rotation.x += 0.02;
			mesh.rotation.y += 0.02;
		}

		// render
		renderer.render(scene, camera);
		//controls.update();
    };
    //========================================================================================


    //========================================================================================
    // Redraw Scene
    // Clear the 3D scene from current mesh and redraw it with current slot settings
    //========================================================================================
    var redrawScene = function(){
        if(scene){
            //Geometry
            //var geo = $scope.gimme('geometry');
            var meshData;

            // Clean old settings
            if(mesh){ scene.remove(mesh); }
            if(ambientLight){ scene.remove(ambientLight); }

            for(var i = 0; i < directionalLights.length; i++){
                if(directionalLights[i]){ scene.remove(directionalLights[i]); }
            }
            directionalLights = [];


			//light (subtle ambient)
			ambientLight = new THREE.AmbientLight('#999999');

			// light (directional)
			directionalLights.push(new THREE.DirectionalLight('#ffffff'));
			directionalLights[directionalLights.length - 1].position.set(1, 1, 1).normalize();
			scene.add(directionalLights[directionalLights.length - 1]);
            scene.add(ambientLight);

            // if(geo == 0){ //mesh data
            //     meshData = loader.parse($scope.gimme('meshJSON'));
            //     geometry = meshData.geometry;
            // }
            // else if(geo == 1){ //box
                geometry = new THREE.BoxGeometry(2, 2, 2, 32, 32, 32);
            // }
            // else if(geo == 2){ //sphere
            //     geometry = new THREE.SphereGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryWidthSegments'), $scope.gimme('geometryHeightSegments'), 0, $scope.gimme('phiLength'), 0, $scope.gimme('thetaLength'));
            // }
            // else if(geo == 3){ //plane
            //     geometry = new THREE.PlaneGeometry($scope.gimme('geometryWidth'), $scope.gimme('geometryHeight'), $scope.gimme('geometryWidthSegments'), $scope.gimme('geometryHeightSegments'));
            // }
            // else if(geo == 4){ //cylinder
            //     geometry = new THREE.CylinderGeometry($scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryInnerBottomRadius')), $scope.gimme('geometryHeight'), parseInt($scope.gimme('geometryRadiusSegments')), $scope.gimme('geometryHeightSegments'), $scope.gimme('openCapEnabled'));
            // }
            // else if(geo == 5){ //ring
            //     geometry = new THREE.RingGeometry(parseInt($scope.gimme('geometryInnerBottomRadius')), $scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryRadiusSegments')), 16, 0, $scope.gimme('thetaLength'));
            // }
            // else if(geo == 6){ //circle
            //     geometry = new THREE.CircleGeometry($scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryRadiusSegments')), 0, $scope.gimme('thetaLength'));
            // }
            // else if(geo == 7){ //icosahedron
            //     geometry = new THREE.IcosahedronGeometry($scope.gimme('geometryRadius'));
            // }
            // else if(geo == 8){ //octahedron
            //     geometry = new THREE.OctahedronGeometry($scope.gimme('geometryRadius'));
            // }
            // else if(geo == 9){ //tetrahedron
            //     geometry = new THREE.TetrahedronGeometry($scope.gimme('geometryRadius'));
            // }
            // else if(geo == 10){ //torus
            //     geometry = new THREE.TorusGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryTubeDiameter'), parseInt($scope.gimme('geometryRadiusSegments')), parseInt($scope.gimme('geometryRadiusSegments')), $scope.gimme('thetaLength'));
            // }
            // else if(geo == 11){ //torus knot
            //     geometry = new THREE.TorusKnotGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryTubeDiameter'), parseInt($scope.gimme('geometryRadiusSegments')), parseInt($scope.gimme('geometryRadiusSegments')));
            // }


            // if(geo == 0){
            //     if(!$scope.gimme('meshDataOverride') && meshData && meshData.materials[0]){
            //         material = new THREE.MeshFaceMaterial( meshData.materials );
            //         material = new THREE.MeshFaceMaterial( meshData.materials );
            //     }
            //     else{
            //         material = new THREE.MeshLambertMaterial({color: $scope.gimme('meshColor')});
            //     }
            // }
            // else{
				// var texture = $scope.gimme('imgTexture');
				// if(texture != ''){
				// 	material = new THREE.MeshLambertMaterial({
				// 		map: THREE.ImageUtils.loadTexture($scope.gimme('imgTexture'))
				// 	});
				// }
				// else{
					material = new THREE.MeshLambertMaterial({color: '#00ff00'});
				//}
            //}

			mesh = new THREE.Mesh(geometry, material);

            scene.add(mesh);
            //prevGeometry = geo;
        }
    };
    //========================================================================================


    //========================================================================================
    // Render
    // Doing the rendering for the power example scene
    //========================================================================================
    var render = function() {
        // var timer = Date.now() * 0.0002;
        //
        //
        //
        //
        // camera.lookAt( scene.position );
        //
        // renderer.render( scene, camera );
    };
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
