//======================================================================================================================
// Controllers for Free Hand Draw for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
function freeHandDrawingCtrl($scope, $log, $timeout, Slot, Enum, colorService) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        drawingHolder: ['border', 'padding'],
        drawingContainer: ['background-color', 'border', 'width', 'height']
    };

    $scope.customMenu = [{itemId: 'clearDrawing', itemTxt: 'Clear Drawing'}];

    var drawSurface, ctx, drawingContainer;
    var lastMouse = {x: 0, y: 0};
    var imgData = [];
    var lineData;
    var gco;


    //=== EVENT HANDLERS ================================================================
    var onMouseMove = function(e){

        var currentMouse= {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

        ctx.beginPath();
        ctx.moveTo(lastMouse.x, lastMouse.y);
        ctx.lineTo(currentMouse.x, currentMouse.y);
        ctx.stroke();
        ctx.closePath();

        lastMouse = currentMouse;
        lineData.points.push(lastMouse);
    };

    var onMouseDown = function(e){
        if(e.which === 1){
            lastMouse= {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

            if(ctx.globalCompositeOperation != "destination-out"){
                gco = ctx.globalCompositeOperation;
            }

            if(parseFloat($scope.gimme('toolType')) == 1){
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "rgba(0,0,0,1)";
            }
            else{
                ctx.globalCompositeOperation = gco;
                var rgbColor = colorService.hexToRGB($scope.gimme('brushColor'));
                ctx.strokeStyle = "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + parseFloat($scope.gimme('brushOpacity')) + ")";
            }

            ctx.lineWidth = parseInt($scope.gimme('brushSize'));
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            lineData = {color: $scope.gimme('brushColor'), opacity: $scope.gimme('brushOpacity'), size: $scope.gimme('brushSize'), points: [lastMouse]};
            drawSurface.bind('mousemove', onMouseMove);
            drawSurface.bind('mouseup', onMouseUp);
            e.stopPropagation();
        }
    };

    var onMouseUp = function(e){
        drawSurface.unbind('mousemove');
        drawSurface.unbind('mouseup');
        imgData.push(lineData);
    };

    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        drawSurface = $scope.theView.parent().find("#drawSurface");
        drawingContainer = $scope.theView.parent().find("#drawingContainer");
        ctx = drawSurface[0].getContext("2d");

        $scope.addSlot(new Slot('toolType',
            0,
            'Tool Type',
            'The current tool used on the canvas',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Brush', 'Eraser']},
            undefined
        ));

        $scope.addSlot(new Slot('brushColor',
            '#ff0000',
            'Brush Color',
            'The current color of the brush',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ColorPick},
            undefined
        ));

        $scope.addSlot(new Slot('brushOpacity',
            1,
            'Brush Opacity',
            'The current opacity of the brush',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('brushSize',
            5,
            'Brush Size',
            'The current size of the brush',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('shadowEnabled',
            true,
            'Shadow Enabled',
            'If there will be a shadow cast from the drawing surface',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('clearCanvasRequest',
            false,
            'Clear Canvas Request',
            'If checked the Canvas will be cleared and current drawing deleted',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('imageData',
            undefined,
            'Image Data',
            'The drawn image',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('imageData').setDisabledSetting(Enum.SlotDisablingState.ConnectionVisibility);

        $scope.setResizeSlots('drawingContainer:width', 'drawingContainer:height');

        drawSurface.bind('mousedown', onMouseDown);

        $scope.$watch(function(){return $scope.gimme('drawingContainer:width');}, function(newVal, oldVal) {
            drawSurface[0].width = parseInt($scope.gimme('drawingContainer:width'));
        }, true);

        $scope.$watch(function(){return $scope.gimme('drawingContainer:height');}, function(newVal, oldVal) {
            drawSurface[0].height = parseInt($scope.gimme('drawingContainer:height'));
        }, true);

        $scope.$watch(function(){return $scope.gimme('shadowEnabled');}, function(newVal, oldVal) {
            if(newVal == true){
                drawingContainer.css('-moz-box-shadow', '10px 10px 5px #888888');
                drawingContainer.css('-webkit-box-shadow', '0px 10px 5px #888888');
                drawingContainer.css('box-shadow', '10px 10px 5px #888888');
            }
            else{
                drawingContainer.css('-moz-box-shadow', '');
                drawingContainer.css('-webkit-box-shadow', '');
                drawingContainer.css('box-shadow', '');
            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('clearCanvasRequest');}, function(newVal, oldVal) {
            if(newVal == true || newVal > 0 && newVal != oldVal){
                ctx.clearRect(0,0,parseInt($scope.gimme('drawingContainer:width')),parseInt($scope.gimme('drawingContainer:height')));
                imgData = [];
                $scope.getSlot('clearCanvasRequest').setValue(false);
            }
        }, true);

        // Reload saved image
        if(theInitWblDef.private != undefined && theInitWblDef.private.imageData != undefined){
            $timeout(function(){redrawPreviousImg(theInitWblDef.private.imageData);}, 400);
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
        if(itemName == $scope.customMenu[0].itemId){  //clearDrawing
            ctx.clearRect(0,0,parseInt($scope.gimme('drawingContainer:width')),parseInt($scope.gimme('drawingContainer:height')));
            imgData = [];
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
            imageData: imgData
        };

        return customWblDefPart;
    };
    //===================================================================================


    //========================================================================================
    // Redraw Previous Image
    // If this webble had an image before this method redraws it
    //========================================================================================
    var redrawPreviousImg = function(theImgData){
        for(var i = 0; i <  theImgData.length; i++){
            var rgbColor = colorService.hexToRGB(theImgData[i].color);
            ctx.strokeStyle = "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + parseFloat(theImgData[i].opacity) + ")";
            ctx.lineWidth = theImgData[i].size;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            var thePnts = theImgData[i].points;
            for(var n = 0; n < thePnts.length - 1; n++){
                ctx.beginPath();
                ctx.moveTo(thePnts[n].x, thePnts[n].y);
                ctx.lineTo(thePnts[n+1].x, thePnts[n+1].y);
                ctx.stroke();
                ctx.closePath();
            }
            imgData.push(theImgData[i]);
        }
    }
    //========================================================================================



    //=== CTRL MAIN CODE ======================================================================

}
//=======================================================================================
