//======================================================================================================================
// Controllers for 3D World Container for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('threeDCtrl', function($scope, $log, $timeout, Slot, Enum, isEmpty) {

    // WebGL presence check
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        threeDContainer: ['background-color', 'border', 'border-radius'],
        threeDHolder: ['width', 'height', 'background-color', 'border', 'border-radius']
    };

    var scene, camera, renderer;
    var geometry, material, mesh;
    var ambientLight, directionalLights = [];
    var loader = new THREE.JSONLoader();
    var controls;

    var threeDContainer, threeDHolder;

    var prevGeometry = -1;

    //Power Example variables
    //-----------------------
    var clothGeometry;
    var poleMeshGroup = [];
    var object;
    var rotate = true;
    var pins;
    //-----------------------


    //=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        threeDContainer = $scope.theView.parent().find("#threeDContainer");
        threeDHolder = $scope.theView.parent().find("#threeDHolder");

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == 'threeDHolder:width' || eventData.slotName == 'threeDHolder:height'){
				if(renderer){
					renderer.setSize(parseInt($scope.gimme('threeDHolder:width')), parseInt($scope.gimme('threeDHolder:height')));
				}
			}
			else if(eventData.slotName == 'geometry' || eventData.slotName == 'meshJSON' || eventData.slotName == 'meshDataOverride' || eventData.slotName == 'meshColor' || eventData.slotName == 'imgTexture'
				|| eventData.slotName == 'geometryWidth' || eventData.slotName == 'geometryHeight' || eventData.slotName == 'geometryDepth' || eventData.slotName == 'ambientLightColor'
				|| eventData.slotName == 'dirLightColor' || eventData.slotName == 'geometryWidthSegments' || eventData.slotName == 'geometryHeightSegments' || eventData.slotName == 'geometryDepthSegments'
				|| eventData.slotName == 'geometryRadius' || eventData.slotName == 'geometryInnerBottomRadius' || eventData.slotName == 'phiLength' || eventData.slotName == 'thetaLength'
				|| eventData.slotName == 'geometryRadiusSegments' || eventData.slotName == 'openCapEnabled' || eventData.slotName == 'geometryTubeDiameter'){
				redrawScene();
			}
		});

        $scope.addSlot(new Slot('geometry',
            0,
            'Geometry',
            'Either one of the predefined geometries or one found in the JSON mesh data',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Mesh Data', 'Box', 'Sphere', 'Plane', 'Cylinder', 'Ring', 'Circle', 'Icosahedron', 'Octahedron', 'Tetrahedron', 'Torus', 'Torus Knot', 'Power Example']},
            undefined
        ));

        $scope.addSlot(new Slot('autoAnimateEnabled',
            true,
            'Auto Animation Enabled',
            'When enabled the loaded mesh will rotate on its own, when unchecked it will be still.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('meshJSON',
			{},
            'JSON Mesh',
            'A mesh described as a JSON object',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));

        $scope.addSlot(new Slot('meshDataOverride',
            false,
            'Override Mesh Data',
            'If checked then material values etc will be picked up via slots and not from the original mesh data JSON object.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('meshColor',
            '#00ff00',
            'Mesh Color',
            'Color of the current mesh',
            $scope.theWblMetadata['templateid'],
			{inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('imgTexture',
            '',
            'Image Texture',
            'An image that will be used as texture of the 3D object instead of just using color',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ImagePick},
            undefined
        ));

        $scope.addSlot(new Slot('geometryWidth',
            2,
            'Geometry Width',
            'If applicable to the selected geometry this is the width that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryHeight',
            2,
            'Geometry Height',
            'If applicable to the selected geometry this is the height that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryDepth',
            2,
            'Geometry Depth',
            'If applicable to the selected geometry this is the depth that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryRadius',
            1.5,
            'Geometry Radius',
            'If applicable to the selected geometry this is the radius (also outer and top radius) that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryInnerBottomRadius',
            1.5,
            'Geometry Second Radius',
            'If applicable to the selected geometry this is the radius used for inner and bottom radius',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryTubeDiameter',
            0.4,
            'Geometry Tube Diameter',
            'If applicable to the selected geometry (mainly Torus) this is the diameter used for the tube.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('phiLength',
            Math.PI * 2,
            'Geometry Horizontal Sweep angle',
            'If applicable to the selected geometry this is the horizontal sweep angle (in rad) size that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('thetaLength',
            Math.PI * 2,
            'Geometry Vertical Sweep angle',
            'If applicable to the selected geometry this is the vertical sweep angle (in rad) size that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('openCapEnabled',
            false,
            'Geometry Open Cap Enabled',
            'If applicable to the selected geometry this checkbox either close or open the ends of the geometry (basically cylinder only)',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryWidthSegments',
            32,
            'Geometry Width Segments',
            'If applicable to the selected geometry this is the number of segements of the width that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryHeightSegments',
            32,
            'Geometry Height Segments',
            'If applicable to the selected geometry this is the number of segements of the height that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryDepthSegments',
            32,
            'Geometry Depth Segments',
            'If applicable to the selected geometry this is the number of segements of the depth that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('geometryRadiusSegments',
            32,
            'Geometry Radius Segments',
            'If applicable to the selected geometry this is the number of segements of the radius that are used',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('ambientLightColor',
            '#999999',
            'Ambient Light Color',
            'The color of the ambient light',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('dirLightColor',
            '#ffffff',
            'Directional Light Color',
            'The color of the directional light',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.setResizeSlots('threeDHolder:width', 'threeDHolder:height');

        $scope.theView.parent().draggable('option', 'cancel', '#threeDHolder');
        threeDHolder.bind('contextmenu',function(){ if(!$scope.altKeyIsDown){return false;} });

		if (Detector.webgl) {
			if($scope.gimme('geometry') == 0 && isEmpty($scope.gimme('meshJSON'))){
				$.ajax({url: $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']) + "/BlenderExampleMesh.json",
				 	success: function(data){
						$scope.set('meshJSON', data);
						init();
						redrawScene();
				 	},
				 	error: function(){
				 		$log.error("Failed reading default Blender Example Mesh data from Webble Server");
				 	}
				});
			}
			else{
				init();
				redrawScene();
			}
		} else {
			var warning = Detector.getWebGLErrorMessage();
			warning.innerText = "Your Browser does not support WebGL and can therefore not display 3D graphics. \nWe recommend that you change browser.";
			($scope.theView.parent().find('#threeDHolder')[ 0 ]).appendChild(warning);
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
        scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

        // camera
        camera = new THREE.PerspectiveCamera(45, parseInt($scope.gimme('threeDHolder:width')) / parseInt($scope.gimme('threeDHolder:height')), 0.1, 1000);   //***POSSLOT: FOV, clipping plane
        camera.position.z = 5;  //***POSSLOT: camera position

        // renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(parseInt($scope.gimme('threeDHolder:width')), parseInt($scope.gimme('threeDHolder:height')));
        //Attach renderer
        ($scope.theView.parent().find('#threeDHolder')[ 0 ]).appendChild(renderer.domElement);

        //Controls
        controls = new THREE.TrackballControls( camera, threeDHolder[0] );
        controls.rotateSpeed = 3.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

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

        var geo = $scope.gimme('geometry');
        if(geo != 12){
            if(mesh && $scope.gimme('autoAnimateEnabled')){
                mesh.rotation.x += 0.02;
                mesh.rotation.y += 0.02;
            }

            // render
            renderer.render(scene, camera);
            controls.update();
        }
        else{
            var time = Date.now();

            windStrength = Math.cos( time / 7000 ) * 20 + 40;
            windForce.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) ).normalize().multiplyScalar( windStrength );

            simulate(time, clothGeometry);
            render();
        }
    };
    //========================================================================================


    //========================================================================================
    // Redraw Scene
    // Clear the 3D scene from current mesh and redraw it with current slot settings
    //========================================================================================
    var redrawScene = function(){
        if(scene){
            //Geometry
            var geo = $scope.gimme('geometry');
            var meshData;

            // Clean old settings
            if(mesh){ scene.remove(mesh); }
            if(ambientLight){ scene.remove(ambientLight); }

            for(var i = 0; i < directionalLights.length; i++){
                if(directionalLights[i]){ scene.remove(directionalLights[i]); }
            }
            directionalLights = [];

            if(object){ scene.remove(object); }

            for(var i = 0; i < poleMeshGroup.length; i++){
                if(poleMeshGroup[i]){ scene.remove(poleMeshGroup[i]); }
            }

            if(geo == 12){
                renderer.setClearColor( scene.fog.color );

                renderer.gammaInput = true;
                renderer.gammaOutput = true;
                renderer.shadowMapEnabled = true;

                camera = new THREE.PerspectiveCamera( 30, parseInt($scope.gimme('threeDHolder:width')) / parseInt($scope.gimme('threeDHolder:height')), 1, 10000 );
                camera.position.y = 50;
                camera.position.z = 1500;

                ambientLight = new THREE.AmbientLight(0x666666);

                var light;

                light = new THREE.DirectionalLight( 0xdfebff, 1.75 );
                light.position.set( 50, 200, 100 );
                light.position.multiplyScalar( 1.3 );

                light.castShadow = true;

                light.shadowMapWidth = 2048;
                light.shadowMapHeight = 2048;

                var d = 300;

                light.shadowCameraLeft = -d;
                light.shadowCameraRight = d;
                light.shadowCameraTop = d;
                light.shadowCameraBottom = -d;

                light.shadowCameraFar = 1000;
                light.shadowDarkness = 0.5;

                directionalLights.push(light);
                scene.add( light );

                light = new THREE.DirectionalLight( 0x3dff0c, 0.35 );
                light.position.set( 0, -1, 0 );

                directionalLights.push(light);
                scene.add( light );
            }
            else if(prevGeometry == 12){
                renderer.setClearColor( 0x000000, 0 );

                renderer.gammaInput = false;
                renderer.gammaOutput = false;
                renderer.shadowMapEnabled = false;

                camera = new THREE.PerspectiveCamera(45, parseInt($scope.gimme('threeDHolder:width')) / parseInt($scope.gimme('threeDHolder:height')), 0.1, 1000);
                camera.position.y = 0;
                camera.position.z = 5;

                //Controls
                controls = new THREE.TrackballControls( camera, threeDHolder[0] );
                controls.rotateSpeed = 3.0;
                controls.zoomSpeed = 1.2;
                controls.panSpeed = 0.8;
                controls.noZoom = false;
                controls.noPan = false;
                controls.staticMoving = true;
                controls.dynamicDampingFactor = 0.3;
            }

            if(geo != 12){
                //light (subtle ambient)
                ambientLight = new THREE.AmbientLight($scope.gimme('ambientLightColor'));

                // light (directional)
                directionalLights.push(new THREE.DirectionalLight($scope.gimme('dirLightColor')));
                directionalLights[directionalLights.length - 1].position.set(1, 1, 1).normalize();
                scene.add(directionalLights[directionalLights.length - 1]);
            }
            scene.add(ambientLight);

            if(geo == 0){ //mesh data
                meshData = loader.parse($scope.gimme('meshJSON'));
                geometry = meshData.geometry;
            }
            else if(geo == 1){ //box
                geometry = new THREE.BoxGeometry($scope.gimme('geometryWidth'), $scope.gimme('geometryHeight'), $scope.gimme('geometryDepth'), $scope.gimme('geometryWidthSegments'), $scope.gimme('geometryHeightSegments'), $scope.gimme('geometryDepthSegments'));
            }
            else if(geo == 2){ //sphere
                geometry = new THREE.SphereGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryWidthSegments'), $scope.gimme('geometryHeightSegments'), 0, $scope.gimme('phiLength'), 0, $scope.gimme('thetaLength'));
            }
            else if(geo == 3){ //plane
                geometry = new THREE.PlaneGeometry($scope.gimme('geometryWidth'), $scope.gimme('geometryHeight'), $scope.gimme('geometryWidthSegments'), $scope.gimme('geometryHeightSegments'));
            }
            else if(geo == 4){ //cylinder
                geometry = new THREE.CylinderGeometry($scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryInnerBottomRadius')), $scope.gimme('geometryHeight'), parseInt($scope.gimme('geometryRadiusSegments')), $scope.gimme('geometryHeightSegments'), $scope.gimme('openCapEnabled'));
            }
            else if(geo == 5){ //ring
                geometry = new THREE.RingGeometry(parseInt($scope.gimme('geometryInnerBottomRadius')), $scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryRadiusSegments')), 16, 0, $scope.gimme('thetaLength'));
            }
            else if(geo == 6){ //circle
                geometry = new THREE.CircleGeometry($scope.gimme('geometryRadius'), parseInt($scope.gimme('geometryRadiusSegments')), 0, $scope.gimme('thetaLength'));
            }
            else if(geo == 7){ //icosahedron
                geometry = new THREE.IcosahedronGeometry($scope.gimme('geometryRadius'));
            }
            else if(geo == 8){ //octahedron
                geometry = new THREE.OctahedronGeometry($scope.gimme('geometryRadius'));
            }
            else if(geo == 9){ //tetrahedron
                geometry = new THREE.TetrahedronGeometry($scope.gimme('geometryRadius'));
            }
            else if(geo == 10){ //torus
                geometry = new THREE.TorusGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryTubeDiameter'), parseInt($scope.gimme('geometryRadiusSegments')), parseInt($scope.gimme('geometryRadiusSegments')), $scope.gimme('thetaLength'));
            }
            else if(geo == 11){ //torus knot
                geometry = new THREE.TorusKnotGeometry($scope.gimme('geometryRadius'), $scope.gimme('geometryTubeDiameter'), parseInt($scope.gimme('geometryRadiusSegments')), parseInt($scope.gimme('geometryRadiusSegments')));
            }
            else if(geo == 12){ //Power Scene
                // ground

                var initColor = new THREE.Color( 0x497f13 );
                var initTexture = THREE.ImageUtils.generateDataTexture( 1, 1, initColor );

                var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, map: initTexture } );

                var groundTexture = THREE.ImageUtils.loadTexture( $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']) + "/images/grasslight-big.jpg", undefined, function() { groundMaterial.map = groundTexture } );
                groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
                groundTexture.repeat.set( 25, 25 );
                groundTexture.anisotropy = 16;

                mesh = new THREE.Mesh( new THREE.PlaneGeometry( 20000, 20000 ), groundMaterial );
                mesh.position.y = -250;
                mesh.rotation.x = - Math.PI / 2;
                mesh.receiveShadow = true;

                // cloth material

                var clothTexture = THREE.ImageUtils.loadTexture( $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']) + '/images/circuit_pattern.png' );
                clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
                clothTexture.anisotropy = 16;

                var clothMaterial = new THREE.MeshPhongMaterial( { alphaTest: 0.5, ambient: 0xffffff, color: 0xffffff, specular: 0x030303, emissive: 0x111111, shiness: 10, map: clothTexture, side: THREE.DoubleSide } );

                // cloth geometry
                clothGeometry = new THREE.ParametricGeometry( clothFunction, cloth.w, cloth.h );
                clothGeometry.dynamic = true;
                clothGeometry.computeFaceNormals();

                var uniforms = { texture:  { type: "t", value: clothTexture } };
                var vertexShader = $scope.theView.parent().find("#vertexShaderDepth")[0].textContent;
                var fragmentShader = $scope.theView.parent().find("#fragmentShaderDepth")[0].textContent;

                // cloth mesh
                object = new THREE.Mesh( clothGeometry, clothMaterial );
                object.position.set( 0, 0, 0 );
                object.castShadow = true;
                object.receiveShadow = true;
                scene.add( object );

                object.customDepthMaterial = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );

                // poles

                var poleGeo = new THREE.BoxGeometry( 5, 375, 5 );
                var poleMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shiness: 100 } );

                var pMesh = new THREE.Mesh( poleGeo, poleMat );
                pMesh.position.x = -125;
                pMesh.position.y = -62;
                pMesh.receiveShadow = true;
                pMesh.castShadow = true;
                poleMeshGroup.push(pMesh);
                scene.add( pMesh );

                pMesh = new THREE.Mesh( poleGeo, poleMat );
                pMesh.position.x = 125;
                pMesh.position.y = -62;
                pMesh.receiveShadow = true;
                pMesh.castShadow = true;
                poleMeshGroup.push(pMesh);
                scene.add( pMesh );

                pMesh = new THREE.Mesh( new THREE.BoxGeometry( 255, 5, 5 ), poleMat );
                pMesh.position.y = -250 + 750/2;
                pMesh.position.x = 0;
                pMesh.receiveShadow = true;
                pMesh.castShadow = true;
                poleMeshGroup.push(pMesh);
                scene.add( pMesh );

                var gg = new THREE.BoxGeometry( 10, 10, 10 );
                pMesh = new THREE.Mesh( gg, poleMat );
                pMesh.position.y = -250;
                pMesh.position.x = 125;
                pMesh.receiveShadow = true;
                pMesh.castShadow = true;
                poleMeshGroup.push(pMesh);
                scene.add( pMesh );

                pMesh = new THREE.Mesh( gg, poleMat );
                pMesh.position.y = -250;
                pMesh.position.x = -125;
                pMesh.receiveShadow = true;
                pMesh.castShadow = true;
                poleMeshGroup.push(pMesh);
                scene.add( pMesh );
            }


            if(geo == 0){
                if(!$scope.gimme('meshDataOverride') && meshData && meshData.materials[0]){
                    material = new THREE.MeshFaceMaterial( meshData.materials );
                }
                else{
                    material = new THREE.MeshLambertMaterial({color: $scope.gimme('meshColor')});
                }
            }
            else{
                if(geo != 12){
                    var texture = $scope.gimme('imgTexture');
                    if(texture != ''){
                        material = new THREE.MeshLambertMaterial({
                            map: THREE.ImageUtils.loadTexture($scope.gimme('imgTexture'))
                        });
                    }
                    else{
                        material = new THREE.MeshLambertMaterial({color: $scope.gimme('meshColor')});
                    }
                }
            }

            if(geo != 12) {
                mesh = new THREE.Mesh(geometry, material);
            }

            scene.add(mesh);
            prevGeometry = geo;
        }
    };
    //========================================================================================


    //========================================================================================
    // Render
    // Doing the rendering for the power example scene
    //========================================================================================
    var render = function() {
        var timer = Date.now() * 0.0002;

        var p = cloth.particles;

        for ( var i = 0, il = p.length; i < il; i ++ ) {

            clothGeometry.vertices[ i ].copy( p[ i ].position );

        }

        clothGeometry.computeFaceNormals();
        clothGeometry.computeVertexNormals();

        clothGeometry.normalsNeedUpdate = true;
        clothGeometry.verticesNeedUpdate = true;

        if ( rotate ) {

            camera.position.x = Math.cos( timer ) * 1500;
            camera.position.z = Math.sin( timer ) * 1500;

        }

        camera.lookAt( scene.position );

        renderer.render( scene, camera );
    };
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================
