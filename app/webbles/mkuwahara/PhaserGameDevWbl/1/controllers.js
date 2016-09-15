//======================================================================================================================
// Controllers for Phaser Game Dev Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
wblwrld3App.controller('phaserGameDevCtrl', function($scope, $log, $timeout, $window, Slot, Enum) {

    //=== PROPERTIES =====================================================================
    $scope.stylesToSlots = {
		phaserGameDevContainer: [ 'width', 'height', 'background-color', 'border', 'border-radius']
    };

	$scope.customMenu = [{itemId: 'allaboutPhaser', itemTxt: 'All About Phaser'}, {itemId: 'makeowngame', itemTxt: 'Make your own game'}];

	$scope.resizingPos = {x: 790, y: 590};

    var internalFilesPath;

	// JQuery Element Variable for Phaser Game Canvas
	var phaserGameDevCanvasHolder;

	// Phaser Game Core Variables
	$scope.gameCore = undefined;
	var game, music, cursors;

	// Phaser Game suggested state Variables
	var Main = function () {}, Splash = function () {}, Game = function () {};

	// Phaser Game Example Variables
	var gameOptions = { playMusic: true };
	var startBtn, platforms, player, stars, muteBtn, fullscreenBtn, scoreText;


	//=== EVENT HANDLERS ================================================================



    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
		phaserGameDevCanvasHolder = $scope.theView.parent().find("#phaserGameDevCanvasHolder");
		internalFilesPath = $scope.getTemplatePath($scope.theWblMetadata['templateid'], $scope.theWblMetadata['templaterevision']);

		// TODO: (POSSIBLE) If one does not want the game area to be draggable or have any Webble type right click context menu.
		// $scope.theView.parent().draggable('option', 'cancel', '#phaserGameDevCanvasHolder');
		// $scope.theView.parent().find('#phaserGameDevCanvasHolder').bind('contextmenu',function(){ return false; });

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotName == "phaserGameDevContainer:width" || eventData.slotName == "phaserGameDevContainer:height"){
				$scope.resizingPos.x = parseInt($scope.gimme("phaserGameDevContainer:width")) - 30;
				$scope.resizingPos.y = parseInt($scope.gimme("phaserGameDevContainer:height")) - 30;
				$timeout(function(){
					$scope.gameCore.scale.refresh();
					if($scope.gameCore.scale.height > (parseInt($scope.gimme("phaserGameDevContainer:height")) - 30)){
						$scope.set("phaserGameDevContainer:height", $scope.gameCore.scale.height + 30);
					}
					if((parseInt($scope.gimme("phaserGameDevContainer:height")) - 40) > $scope.gameCore.scale.height){
						$scope.set("phaserGameDevContainer:height", $scope.gameCore.scale.height + 30);
					}
				}, 100);
			}
			else if(eventData.slotName == "gameInputFocus" && $scope.gameCore && $scope.gameCore.input){
				if(eventData.slotValue == true){
					$scope.gameCore.input.enabled = true;
				}
				else{
					player.animations.stop();
					player.frame = 4;
					$scope.gameCore.input.enabled = false;
				}
			}
		});

		// Just another example slot for how the game and the Webble might be interacting
		$scope.addSlot(new Slot('gameScore',
			0,
			'Game Score',
			'The current game score',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.getSlot('gameScore').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

		$scope.addSlot(new Slot('gameInputFocus',
			true,
			'Game Input Focus',
			'If checked true then the game will listen to mouse and keyboard inputs, otherwise it will not',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Make sure that a dying Webble switches off game related stuff
		$scope.registerWWEventListener(Enum.availableWWEvents.deleted, function(eventData){
			music.destroy();
			$scope.gameCore.cache.removeSound('upbeat');
		});

		// Initiate the Phaser Game
		$scope.gameCore = new Phaser.Game(parseInt($scope.gimme("phaserGameDevContainer:width"))-30, parseInt($scope.gimme("phaserGameDevContainer:height"))-30, Phaser.AUTO, phaserGameDevCanvasHolder[0]);
		$scope.gameCore.state.add('Main', Main);
		$scope.gameCore.state.start('Main');
    };
    //===================================================================================


	//===================================================================================
	// Main Prototype
	// The Preload, Create and Update functions for the Main (Init) state of the Game app
	//===================================================================================
	Main.prototype = {
		preload: function () {
			// Use this if your resources are located on other domains
			//$scope.gameCore.load.crossOrigin = true;

			$scope.gameCore.load.audio('upbeat', internalFilesPath + '/resource_snd_music_upbeatsugar.mp3');
		},

		create: function () {
			music = $scope.gameCore.add.audio('upbeat');
			music.loop = true;
			music.play();

			$scope.gameCore.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
			$scope.gameCore.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

			$scope.gameCore.state.add('Splash', Splash);
			$scope.gameCore.state.start('Splash');
		},

		update: function() {
		},

		render: function() {
		}
	};
	//===================================================================================


	//===================================================================================
	// Splash Prototype
	// The Preload, Create and Update functions for the Splash state of the Game app
	//===================================================================================
	Splash.prototype = {
		preload: function () {
			$scope.gameCore.load.image('logo', window.location.origin + '/images/wbls/phaser.png');
			$scope.gameCore.load.spritesheet('startButton', internalFilesPath + '/resource_img_sprite_button.png', 193, 71);
		},

		create: function() {
			var logo = $scope.gameCore.add.sprite($scope.gameCore.world.centerX, $scope.gameCore.world.centerY, 'logo');
			logo.anchor.setTo(0.5, 0.6);

			$scope.gameCore.state.add("Game",Game);

			startBtn = $scope.gameCore.add.button($scope.gameCore.world.centerX - 95, $scope.gameCore.world.centerY + 180, 'startButton', function() {
				$scope.gameCore.state.start("Game", true);
			}, this, 2, 1, 0);
			startBtn.onInputOver.add(function() {
				$log.log('over');
			}, this);
			startBtn.onInputOut.add(function() {
				$log.log('out');
			}, this);
			startBtn.onInputUp.add(function() {
				$log.log('up');
			}, this);
		}
	};
	//===================================================================================


	//===================================================================================
	// Game Prototype
	// The Preload, Create and Update functions for the Game state of the Game app
	//===================================================================================
	Game.prototype = {
		preload: function () {
			$scope.gameCore.load.image('sky', internalFilesPath + '/resource_img_static_sky.png');
			$scope.gameCore.load.image('ground', internalFilesPath + '/resource_img_static_platform.png');
			$scope.gameCore.load.image('star', internalFilesPath + '/resource_img_static_star.png');
			$scope.gameCore.load.spritesheet('dude', internalFilesPath + '/resource_img_sprite_dude.png', 32, 48);
			$scope.gameCore.load.spritesheet('muteButton', internalFilesPath + '/resource_img_sprite_mutebutton.png', 50, 50);
			$scope.gameCore.load.spritesheet('fullscreenButton', internalFilesPath + '/resource_img_sprite_fullscreenbutton.png', 30, 30);
		},

		create: function() {
			//  We're going to be using physics, so enable the Arcade Physics system
			$scope.gameCore.physics.startSystem(Phaser.Physics.ARCADE);

			//  A simple background for our game
			$scope.gameCore.add.sprite(0, 0, 'sky');

			//  The platforms group contains the ground and the 2 ledges we can jump on
			platforms = $scope.gameCore.add.group();
			//  We will enable physics for any object that is created in this group
			platforms.enableBody = true;
			// Here we create the ground.
			var ground = platforms.create(0, $scope.gameCore.world.height - 64, 'ground');
			//  Scale it to fit the width of the game (the original sprite is 400x32 in size)
			ground.scale.setTo(2, 2);
			//  This stops it from falling away when you jump on it
			ground.body.immovable = true;
			//  Now let's create two ledges
			var ledge = platforms.create(400, 400, 'ground');
			ledge.body.immovable = true;
			ledge = platforms.create(-150, 250, 'ground');
			ledge.body.immovable = true;

			// The player and its settings
			player = $scope.gameCore.add.sprite(32, $scope.gameCore.world.height - 150, 'dude');
			//  We need to enable physics on the player
			$scope.gameCore.physics.arcade.enable(player);
			//  Player physics properties. Give the little guy a slight bounce.
			player.body.bounce.y = 0.2;
			player.body.gravity.y = 300;
			player.body.collideWorldBounds = true;
			//  Our two animations, walking left and right.
			player.animations.add('left', [0, 1, 2, 3], 10, true);
			player.animations.add('right', [5, 6, 7, 8], 10, true);

			//  Finally some stars to collect
			stars = $scope.gameCore.add.group();
			//  We will enable physics for any star that is created in this group
			stars.enableBody = true;
			//  Here we'll create 12 of them evenly spaced apart
			for (var i = 0; i < 12; i++)
			{
				//  Create a star inside of the 'stars' group
				var star = stars.create(i * 70, 0, 'star');
				//  Let gravity do its thing
				star.body.gravity.y = 300;
				//  This just gives each star a slightly random bounce value
				star.body.bounce.y = 0.7 + Math.random() * 0.2;
			}

			//  The score
			$scope.set('gameScore', 0);
			scoreText = $scope.gameCore.add.text(16, 16, 'score: ' + $scope.gimme('gameScore'), { fontSize: '32px', fill: '#000' });

			// Mute Button
			muteBtn = $scope.gameCore.add.button($scope.gameCore.world.width - 95, 5, 'muteButton', function() {
				if(muteBtn.frame == 1){
					muteBtn.frame = 0;
					music.pause();
				}
				else{
					muteBtn.frame = 1;
					music.play();
				}
			}, this);
			if(music.paused == true){
				muteBtn.frame = 0;
			}
			else{
				muteBtn.frame = 1;
			}


			// Fullscreen Button
			fullscreenBtn = $scope.gameCore.add.button($scope.gameCore.world.width - 40, 15, 'fullscreenButton', function() {
				if(fullscreenBtn.frame == 0){
					fullscreenBtn.frame = 1;
					$scope.gameCore.scale.startFullScreen(false);

				}
				else{
					fullscreenBtn.frame = 0;
					$scope.gameCore.scale.stopFullScreen();
				}
			}, this);
			if($scope.gameCore.scale.isFullScreen){
				fullscreenBtn.frame = 1;
			}
			else{
				fullscreenBtn.frame = 0;
			}

			//  Our controls.
			cursors = $scope.gameCore.input.keyboard.createCursorKeys();

			$scope.gameCore.input.onDown.add(function() {
				if($scope.gimme('gameScore') == 120){
					$scope.set('gameScore', 0);
					$scope.gameCore.state.start("Splash", true);
			 	}
			}, this);
		},

		update: function() {
			//  Collide the player and the stars with the platforms
			$scope.gameCore.physics.arcade.collide(player, platforms);
			$scope.gameCore.physics.arcade.collide(stars, platforms);

			//  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
			$scope.gameCore.physics.arcade.overlap(player, stars, function(player, star) {
				// Removes the star from the screen
				star.kill();
				//  Add and update the score
				$scope.set('gameScore', $scope.gimme('gameScore') + 10);
				scoreText.text = 'Score: ' + $scope.gimme('gameScore');

				if($scope.gimme('gameScore') == 120){
					$scope.gameCore.add.text(282, 202, 'Winner!', { fontSize: '64px', fill: '#000' });
					$scope.gameCore.add.text(280, 200, 'Winner!', { fontSize: '64px', fill: '#ff0' });
				}
			}, null, this);

			//  Reset the players velocity (movement)
			player.body.velocity.x = 0;

			if($scope.gimme('gameScore') < 120){
				if (cursors.left.isDown) {
					//  Move to the left
					player.body.velocity.x = -150;
					player.animations.play('left');
				}
				else if (cursors.right.isDown) {
					//  Move to the right
					player.body.velocity.x = 150;
					player.animations.play('right');
				}
				else {
					//  Stand still
					player.animations.stop();
					player.frame = 4;
				}

				//  Allow the player to jump if they are touching the ground.
				if (cursors.up.isDown && player.body.touching.down) {
					player.body.velocity.y = -350;
				}
			}
			else{
				player.animations.stop();
				player.frame = 4;
			}
		}
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
        if(itemName == $scope.customMenu[0].itemId){  //allaboutPhaser
			$window.open('http://phaser.io', '_blank');
        }
        else if(itemName == $scope.customMenu[1].itemId){  //makeowngame
			$scope.openForm(Enum.aopForms.infoMsg, {title: 'Make your own game', content:
			'<p>To make your own game, create a sandbox copy of this Webble and then go to the Webble Template Editor and ' +
			'start developing your own game using JavaScript and the included Phaser API which you can read more about at the follwoing link <a href="http://phaser.io/learn" target="_blank">http://phaser.io/learn</a>.</p>' +
			'<p>You can add all your own code and files and 3rd party libraries like when developing ordinary Webble templates, but here with the focus to create a game Webble. ' +
			'This Webbles includes a simple game and some common basic features for you to learn from and use in your own game, but what you do not use you can discard.</p>'
			});
		}
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


    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

// More Controllers may of course be added here if needed
//======================================================================================================================
