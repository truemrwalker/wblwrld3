//======================================================================================================================
// Controllers for Bundle Container for Webble World v3.0 (2013)
// Created By: Micke Nicander Kuwahara
//======================================================================================================================

//=======================================================================================
// BUNDLE CONTAINER WEBBLE CONTROLLER
// This is not a loadable Webble, but instead a code generated Webble that is created
// only to enclose a group of Webbles as a bundle.
//=======================================================================================
function bundleContainerCtrl($scope, $log, Slot, gettext, jsonQuery, Enum) {

    //=== PROPERTIES ====================================================================
    $scope.stylesToSlots = {
        bundleContainer: ['border', 'background-color']
    };

    // the webbles and their slots that this bundle is caring for.
    var bundleContent = [];
    var bundleSlots = [];

    // Keeping track of bundle slot watches being created
    var bundleSlotSetupIndex = 0;

    // remember how many children this bundle expects to get
    var expectedRelatives = 0;

    // un-watcher for waiting for children
    var childWaitingWatch;

    // un-watcher for bundle slots
    var bundleSlotWatches = [];


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        var currentBundleBabies = jsonQuery.allValByKey(theInitWblDef.private, 'wbl').length;
        var currentAllBabies = jsonQuery.allValByKey(theInitWblDef, 'webble').length;

        expectedRelatives = currentBundleBabies;
        if(currentAllBabies > currentBundleBabies){
            expectedRelatives = currentAllBabies;
        }

        $scope.theInteractionObjects[Enum.availableOnePicks_DefaultInteractionObjects.Rescale].scope().setIsEnabled(true);

        // watch for getting all relatives connected
        childWaitingWatch = $scope.$watch(function(){return ($scope.getAllDescendants($scope.theView).length - 1);}, function(newVal, oldVal) {
            if(newVal == expectedRelatives){
                childWaitingWatch();
                configBundleMaster(theInitWblDef.private.bundlecontent, theInitWblDef.private.creatingbundle);
            }
        }, true);
    };
    //===================================================================================


    //===================================================================================
    // Config Bundle Master
    // After all bundle content descendants are loaded properly this method takes care of
    // adjusting, configure and setup the Bundle master to work as intended.
    //===================================================================================
    var configBundleMaster = function(bundleContentStr, isCreating, valMod){
        // if the bundleContentStr contains oldids we must first rectify that
        if(isCreating == undefined){
            for(var i = 0, bcs; bcs = bundleContentStr[i]; i++){
                for(var n = 0, d; d = $scope.getAllDescendants($scope.theView)[n]; n++){
                    if(bcs.wbl == d.scope().theWblMetadata['instanceid']){
                        bcs.wbl = d.scope().getInstanceId();
                        break;
                    }
                }
            }
        }

        // make the bundleContentString into a reference object
        for(var i = 0, bcs; bcs = bundleContentStr[i]; i++){
            var theWbl = $scope.getWebbleByInstanceId(bcs.wbl);
            theWbl.scope().setIsBundled(true);
            var slots = [];
            for(var n = 0, s; s = bcs.slots[n]; n++){
                var reducedSlotName = s.lastIndexOf('_') != -1 ? s.substr(0, s.lastIndexOf('_')) : s;
                slots.push(theWbl.scope().getSlot(reducedSlotName));
            }
            bundleContent.push({wbl: theWbl, slots: slots});
        }

        // Catch size and position of the bundle
        var leftTopMostPos = {x: 10000, y: 10000};
        var rightBottomMostPos = {x: 0, y: 0};
        for(var i = 0, bw; bw = bundleContent[i]; i++){
            var wblPos = $scope.getWblAbsPosInPixels(bw.wbl);
            var wblSize = {w: Math.round(getUnits(bw.wbl.parent()[0], 'width').pixel), h: Math.round(getUnits(bw.wbl.parent()[0], 'height').pixel)};

            if(wblPos.x < leftTopMostPos.x){ leftTopMostPos.x = wblPos.x; }
            if(wblPos.y < leftTopMostPos.y){ leftTopMostPos.y = wblPos.y; }
            if((wblPos.x + wblSize.w) > rightBottomMostPos.x){ rightBottomMostPos.x = (wblPos.x + wblSize.w); }
            if((wblPos.y + wblSize.h) > rightBottomMostPos.y){ rightBottomMostPos.y = (wblPos.y + wblSize.h); }
        }

        // If the bundle master is not already positioned correctly, do that
        if(isCreating != undefined && isCreating == true){
            var bundlePos = $scope.getWblAbsPosInPixels($scope.theView);
            var jumpDistance = {w: (leftTopMostPos.x - 1) - bundlePos.x, h: (leftTopMostPos.y - 1) - bundlePos.y};
            $scope.set('root:left', leftTopMostPos.x - 1);
            $scope.set('root:top', leftTopMostPos.y - 1);

            for(var i = 0, bw; bw = bundleContent[i]; i++){
                if(bw.wbl.scope().getParent().scope().getInstanceId() == $scope.getInstanceId()){
                    var cssPos = {x: getUnits(bw.wbl.parent()[0], 'left').pixel, y: getUnits(bw.wbl.parent()[0], 'top').pixel};
                    bw.wbl.scope().set('root:left', cssPos.x - jumpDistance.w);
                    bw.wbl.scope().set('root:top', cssPos.y - jumpDistance.h);
                }
            }
        }

        $scope.theView.css('height', (rightBottomMostPos.y - leftTopMostPos.y + 1) + 'px');
        $scope.theView.css('width', (rightBottomMostPos.x - leftTopMostPos.x + 1) + 'px');

        for(var i = 0, bc; bc = bundleContent[i]; i++){
            for(var n = 0, slot; slot = bc.slots[n]; n++){
                var slotName = slot.getName() + '_' + bundleSlotSetupIndex++;
                if(isCreating != undefined && isCreating == true){
                    $scope.addSlot(new Slot(slotName,
                        slot.getValue(),
                        slot.getDisplayName(),
                        slot.getDisplayDescription(),
                        'bundle',
                        slot.getMetaData(),
                        undefined
                    ));
                }
                $scope.getSlot(slotName)['bundleTarget'] = bc.wbl;
                bundleSlots.push($scope.getSlot(slotName));
            }
        }

        $scope.addUndo({op: Enum.undoOps.bundle, target: $scope.getInstanceId(), execData: []}, !$scope.getPlatformDoNotSaveUndoEnabled());

        bundleSlotSetupIndex = 0;
        createBundleSlotWatches();
    };
    //===================================================================================


    //===================================================================================
    // Create Bundle Slot Watches
    // Set up watches for all slots that is related with bundle content.
    //===================================================================================
    var createBundleSlotWatches = function(){
        if(bundleSlotSetupIndex < bundleSlots.length){
            var slotName = bundleSlots[bundleSlotSetupIndex].getName();
            bundleSlotSetupIndex++;
            for(var slot in $scope.getSlots()){
                if(slot == slotName){
                    var wbl = $scope.getSlot(slot)['bundleTarget'];
                    if(wbl != undefined){
                        var reducedSlotName = slot.lastIndexOf('_') != -1 ? slot.substr(0, slot.lastIndexOf('_')) : slot;
                        bundleSlotWatches.push($scope.$watch(function(){return $scope.gimme(slot);}, function(newVal, oldVal) {
                            if(newVal != oldVal){
                                wbl.scope().set(reducedSlotName, newVal);
                                if(reducedSlotName.search(':width') != -1 || reducedSlotName.search(':height') != -1){
                                    checkForBundleResize();
                                }
                            }
                            if(bundleSlotSetupIndex <= bundleSlots.length){
                                bundleSlotWatches.push($scope.$watch(function(){return wbl.scope().gimme(reducedSlotName);}, function(newVal, oldVal) {
                                    if(newVal != oldVal){
                                        $scope.set(slot, newVal);
                                        if(slot.search(':width') != -1 || slot.search(':height') != -1){
                                            checkForBundleResize();
                                        }
                                    }
                                    if(bundleSlotSetupIndex < bundleSlots.length){
                                        createBundleSlotWatches();
                                    }
                                }, true));
                            }
                        }, true));
                    }
                    break;
                }
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // Check For Bundle Resize
    // If the Bundle content is stretching outside or shrinking inside the bundle, then
    // resize the bundle container to fit perfectly
    //===================================================================================
    var checkForBundleResize = function(){
        // Catch size and position of the bundle
        var leftTopMostPos = $scope.getWblAbsPosInPixels($scope.theView);
        var rightBottomMostPos = {x: 0, y: 0};
        for(var i = 0, bw; bw = bundleContent[i]; i++){
            var wblPos = $scope.getWblAbsPosInPixels(bw.wbl);
            var wblSize = {w: Math.round(getUnits(bw.wbl.parent()[0], 'width').pixel), h: Math.round(getUnits(bw.wbl.parent()[0], 'height').pixel)};

            if((wblPos.x + wblSize.w) > rightBottomMostPos.x){ rightBottomMostPos.x = (wblPos.x + wblSize.w); }
            if((wblPos.y + wblSize.h) > rightBottomMostPos.y){ rightBottomMostPos.y = (wblPos.y + wblSize.h); }
        }

        $scope.theView.css('height', (rightBottomMostPos.y - leftTopMostPos.y + 1) + 'px');
        $scope.theView.css('width', (rightBottomMostPos.x - leftTopMostPos.x + 1) + 'px');
    };
    //===================================================================================


    //===================================================================================
    // Kill Bundle-Slot Watches
    // If a bundle is being deleted, then watches need to be removed beforehand or we
    // get a lot of errors.
    //===================================================================================
    $scope.killBundleSlotWatches = function(){
        for(var i = 0; i < bundleSlotWatches.length; i++){
            bundleSlotWatches[i]();
        }
    };
    //===================================================================================


    //===================================================================================
    // Create Custom Webble Definition
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
        var customWblDefPart = {
            bundlecontent: $scope.stringatizeBundleContent(bundleContent)
        };

        return customWblDefPart;
    };
    //===================================================================================
}
//=======================================================================================

//======================================================================================================================
