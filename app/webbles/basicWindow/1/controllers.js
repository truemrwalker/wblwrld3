//======================================================================================================================
// Controllers for Window Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
//=======================================================================================
function windowContainerCtrl($scope, $log, $timeout, Slot, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        windowContainer: ['width', 'height', 'box-shadow'],
        winTitleBar: ['font-size', 'font-family'],
        winTitleBarTxt: ['color'],
        winBorder: ['background-color', 'border'],
        winArea: ['background-color', 'border', 'overflow']
    };

    $scope.winStyles = {
        titlebarDisplay: 'block',
        minimizeBtnDisplay: 'block',
        maximizeBtnDisplay: 'block',
        closeBtnDisplay: 'block',
        resizingXPos: '290px',
        rememberSize: {w: 300, h: 200},
        rememberPos: {x: 10, y: 10}
    };

    var winContents = [];

    var wtb;
    var wtbt;
    var winBrdr;
    var winArea;


    //=== EVENT HANDLERS ================================================================
    $scope.minimizeWin = function(){
        if(parseInt($scope.gimme('windowContainer:height')) > 35){
            $scope.winStyles.rememberSize.w = parseInt($scope.gimme('windowContainer:width'));
            $scope.winStyles.rememberSize.h = parseInt($scope.gimme('windowContainer:height'));
            $scope.set('windowContainer:width', parseInt(wtbt.css('width')) + 85);
            $scope.set('windowContainer:height', 35);
        }
        else{
            $scope.set('windowContainer:width', $scope.winStyles.rememberSize.w);
            $scope.set('windowContainer:height', $scope.winStyles.rememberSize.h);
        }
    };


    $scope.maximizeWin = function(){
        if(parseInt($scope.gimme('windowContainer:height')) != (parseInt($scope.getSurfaceHeight()) - 17)){
            $scope.winStyles.rememberSize.w = parseInt($scope.gimme('windowContainer:width'));
            $scope.winStyles.rememberSize.h = parseInt($scope.gimme('windowContainer:height'));
            $scope.winStyles.rememberPos.x = parseInt($scope.gimme('root:left'));
            $scope.winStyles.rememberPos.y = parseInt($scope.gimme('root:top'));
            $scope.set('root:left', 0);
            $scope.set('root:top', 0);
            $scope.set('windowContainer:width', parseInt($(document).width()) - 37);
            $scope.set('windowContainer:height', parseInt($scope.getSurfaceHeight()) - 17);
        }
        else{
            $scope.set('windowContainer:width', $scope.winStyles.rememberSize.w);
            $scope.set('windowContainer:height', $scope.winStyles.rememberSize.h);
            $scope.set('root:left', $scope.winStyles.rememberPos.x);
            $scope.set('root:top', $scope.winStyles.rememberPos.y);
        }
    };


    $scope.closeWin = function(){
        for(var i = 0; i < winContents.length; i++){
            winContents[i].moveWatch();
        }

        $scope.requestDeleteWebble($scope.theView, false);
    };


    var onChild_mouseDownEH = function(event, ui){
        var ccb = $scope.gimme('contentClickBehavior');
        if(ccb > 0){
            if(event.which === 1){
                if(ccb == 1){
                    var thisChild = $scope.getWebbleByInstanceId($(event.target).scope().getInstanceId());
                    thisChild.scope().theView.unbind('vmousedown', onChild_mouseDownEH);
                    thisChild.scope().wblStateFlags.pasteByUser = true;
                    thisChild.scope().peel();
                }
                else if(ccb == 2){
                    var thisChild = $scope.getWebbleByInstanceId($(event.target).scope().getInstanceId());
                    thisChild.scope().theView.unbind('vmousedown', onChild_mouseDownEH);
                    thisChild.scope().duplicate({x: 0, y: 0}, function(args){
                        var thatChild = args.wbl;
                        thatChild.scope().wblStateFlags.pasteByUser = true;
                        thatChild.scope().paste($scope.theView);
                    });
                    thisChild.scope().wblStateFlags.pasteByUser = true;
                    thisChild.scope().peel();
                }
            }
        }
    };


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        wtb = $scope.theView.parent().find('#winTitleBar');
        wtbt = $scope.theView.parent().find('#winTitleBarTxt');
        winBrdr = $scope.theView.parent().find('#winBorder');
        winArea = $scope.theView.parent().find('#winArea');

        $scope.theView.parent().find('#winArea').draggable({
            drag: function(event, ui){
                event.stopPropagation();
                return false;
            }
        });

        $scope.addSlot(new Slot('titleBarTxt',
            'Empty',
            'Titlebar Text',
            'The text displayed on the windows titlebar',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('titleBarVisible',
            true,
            'Titlebar Visible',
            'If checked then the titlebar is visible, otherwise not.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('miniBtnVisible',
            true,
            'Minimize Button Visible',
            'If checked then the minimize button is visible, otherwise not.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('maxiBtnVisible',
            true,
            'Maximize Button Visible',
            'If checked then the maximize button is visible, otherwise not.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('closeBtnVisible',
            true,
            'Close Button Visible',
            'If checked then the close button is visible, otherwise not.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('horizontalStretch',
            false,
            'Horizontal Stretch',
            'If checked then the window will stretch its size to fill all space to the right.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('verticalStretch',
            false,
            'Vertical Stretch',
            'If checked then the window will stretch its size to fill all space downward.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('contentClickBehavior',
            0,
            'Content Click Behavior',
            'Decides how the content behaves when clicked; Normal: Moves, Detached: lose the parent window and becomes free, detached leaving copy: gets free but leave a copy child in the window.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['Normal', 'Detached', 'Detached with copy']},
            undefined
        ));

        $scope.addSlot(new Slot('grabDropped',
            false,
            'Enable Catching',
            'When checked, than this window webble will catch any webble that drops upon it and make it its child.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('killDefectors',
            false,
            'Delete Orphans',
            'When checked, than this window webble will delete any child that leaves without getting a new parent immediatelly after being dropped.',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('bkgImgSrc',
            '',
            'Background Image',
            'If background image is preferable than color, this is where you set that.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ImagePick},
            undefined
        ));


        $scope.setDefaultSlot('titleBarTxt');
        $scope.setChildContainer($scope.theView.parent().find('#winArea'));


        $scope.$watch(function(){ return $scope.gimme('titleBarVisible');}, function(newVal, oldVal) {
            if(newVal != undefined){
                if(newVal == true){
                    $scope.winStyles.titlebarDisplay = 'block';
                    winBrdr.css('height', (parseInt(winBrdr.css('height')) - 25) + 'px');
                }
                else{
                    $scope.winStyles.titlebarDisplay = 'none';
                    winBrdr.css('height', (parseInt(winBrdr.css('height')) + 25) + 'px');
                }
                $scope.set('winBorder:height', parseInt($scope.gimme('windowContainer:height')) + 0.01);
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('miniBtnVisible');}, function(newVal, oldVal) {
            if(newVal == true){
                $scope.winStyles.minimizeBtnDisplay = 'block';
            }
            else{
                $scope.winStyles.minimizeBtnDisplay = 'none';
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('maxiBtnVisible');}, function(newVal, oldVal) {
            if(newVal == true){
                $scope.winStyles.maximizeBtnDisplay = 'block';
            }
            else{
                $scope.winStyles.maximizeBtnDisplay = 'none';
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('closeBtnVisible');}, function(newVal, oldVal) {
            if(newVal == true){
                $scope.winStyles.closeBtnDisplay = 'block';
            }
            else{
                $scope.winStyles.closeBtnDisplay = 'none';
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('horizontalStretch');}, function(newVal, oldVal) {
            if(newVal == true){
                $scope.set('windowContainer:width',(parseInt($(document).width()) - 37 - parseInt($scope.gimme('root:left'))));
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('verticalStretch');}, function(newVal, oldVal) {
            if(newVal == true){
                $scope.set('windowContainer:height', parseInt($scope.getSurfaceHeight()) - 17 - parseInt($scope.gimme('root:top')));
            }
        }, true);

        // Make sure all parts of the windows is resized accordingly
        $scope.$watch(function(){ return $scope.gimme('windowContainer:width');}, function(newVal, oldVal) {
            if($scope.winStyles.resizingXPos != newVal){
                $scope.winStyles.resizingXPos = newVal;
            }

            var newVal = parseInt(newVal);
            if(parseInt(wtb.css('width')) != newVal){
                wtb.css('width', newVal + 'px');
            }

            if(parseInt(winBrdr.css('width')) != newVal){
                winBrdr.css('width', newVal + 'px');
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('windowContainer:height');}, function(newVal, oldVal) {
            var newVal = parseInt(newVal);
            if(!isNaN(newVal)){
                var titleBarHeight = 20;
                if(!$scope.gimme('titleBarVisible')){
                    var titleBarHeight = 0;
                }

                if(parseInt(winBrdr.css('height')) != (newVal - titleBarHeight)){
                    winBrdr.css('height', (newVal - titleBarHeight) + 'px');
                }
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('root:left');}, function(newVal, oldVal) {
            if($scope.gimme('horizontalStretch') == true){
                $scope.set('windowContainer:width',(parseInt($(document).width()) - 37 - parseInt($scope.gimme('root:left'))));
            }
        }, true);

        $scope.$watch(function(){ return $scope.gimme('root:top');}, function(newVal, oldVal) {
            if($scope.gimme('verticalStretch') == true){
                $scope.set('windowContainer:height', parseInt($scope.getSurfaceHeight()) - 17 - parseInt($scope.gimme('root:top')));
            }
        }, true);


        $scope.$watch(function(){ return $scope.wblEventInfo.gotChild;}, function(newVal, oldVal) {
            if(newVal){
                $timeout(function(){bindChildTighter(newVal);});
            }
        }, true);

        $scope.$watch(function(){ return $scope.wblEventInfo.lostChild;}, function(newVal, oldVal) {
            if(newVal){
                var thisChild = $scope.getWebbleByInstanceId(newVal);
                thisChild.scope().theView.unbind('vmousedown', onChild_mouseDownEH);

                if(!$scope.gimme('killDefectors')){
                    for(var i = 0; i < winContents.length; i++){
                        if(winContents[i].wblId == newVal){
                            winContents[i].moveWatch();
                            winContents.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }, true);

        $scope.$watch(function(){ return $scope.eventInfo.deletingWebble;}, function(newVal, oldVal) {
            if(newVal != null){
                $timeout(function(){cleanDeleted(newVal.instanceId);}, 250);

            }
        }, true);
    };
    //===================================================================================


    //===================================================================================
    // Bind Child Tighter
    // get som additional control over all added children
    //===================================================================================
    var bindChildTighter = function(wblId){
        var thisChild = $scope.getWebbleByInstanceId(wblId);

        thisChild.scope().theView.bind('vmousedown', onChild_mouseDownEH);

        if(parseInt(thisChild.scope().gimme("root:left")) < 0){
            thisChild.scope().set("root:left", 0);
        }

        if(parseInt(thisChild.scope().gimme("root:top")) < 0){
            thisChild.scope().set("root:top", 0);
        }

        var childMoving = $scope.$watch(function(){ return thisChild.scope().getWebbleConfig();}, function(newVal, oldVal) {
            if($scope.gimme('killDefectors')){
                if((parseInt(newVal, 10) & parseInt(Enum.bitFlags_WebbleConfigs.IsMoving, 10)) == 0){
                    $timeout(function(){killOrphans(thisChild);}, 250);
                }
            }
        }, true);
        winContents.push({wblId: wblId, moveWatch: childMoving});
    };
    //===================================================================================


    //===================================================================================
    // Kill Orphans
    // If the leaving webble must have a new parent make sure it has or kill it
    //===================================================================================
    var killOrphans = function(thisChild){
        var parent = thisChild.scope().getParent();
        if(!parent || parent.scope().getInstanceId() != $scope.getInstanceId()){
            for(var i = 0; i < winContents.length; i++){
                if(winContents[i].wblId == thisChild.scope().getInstanceId()){
                    winContents[i].moveWatch();
                    winContents.splice(i, 1);
                    break;
                }
            }
        }
        if(!parent){
            $scope.requestDeleteWebble(thisChild);
        }
    };
    //===================================================================================


    //===================================================================================
    // Clean Deleted
    // If any child is deleted make sure the tight connection list is cleaned too.
    //===================================================================================
    var cleanDeleted = function(deadId){
        var lostChildren = [];
        for(var i = 0; i < winContents.length; i++){
            if(winContents[i].wblId == deadId){
                winContents[i].moveWatch();
                winContents.splice(i, 1);
                break;
            }
        }
    }
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

}
//=======================================================================================