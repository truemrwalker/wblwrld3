#Basic Webble Template API

**Dear Webble Developer**,

Welcome to current version of Webble World 3. We invite you to start developing your own Webble Templates and upload them to the Online Webble repository for the world to share.

In the files provided you will find the necessary information (as comments and TODO's) that you need to build your Webble template.   You can also download and read the Webble World Manual found online.

Also, be aware of the order the webble files load in case you have some crucial dependencies. First is the manifest files and the library files included in it, next the styles.css is loaded followed by the services, filters, directives and finally the controller. The last file of all to be loaded is the view.html. Because of this one should not run any code inside the controller (or the other js files) that is dependent on the DOM before it actually exist. Such code should be called from or inside the `$scope.coreCall_Init` function which is automatically called by the Webble as soon as all files are loaded.

Below is also a large list of available Webble Core and Platform access methods for all sort of needs. Also listed are
existing services, directives and filters that your Webble might want to use to make magic happen.

* ![Method][meth] = Method
* ![Property][prop] = Property

<!------------------------------------------------------------------------------------------------------------------->
##Webble Core

The **Webble Core** is exactly what it sounds like. The heart of a Webble and what makes it such. Within the Webble-template
**_$scope_**, the core can be reached to get following methods and data:

###_getInstanceId_  ![Method][meth]
Returns the unique identifier for a particular Webble instance. No Set method exists, since this value is controlled by the system and never change during the instance lifetime of a Webble.

####getInstanceId()

* **Parameters:**
    * None
* **Returns:**
    * (Integer) Webble Instance Id
        * _Unique Value_

```JavaScript
// Example of Getting own Instance Id
var ownInstanceId = $scope.getInstanceId();
// Example of Getting first Webble childs Instance Id
var childInstanceId = $scope.getChildren()[0].scope().getInstanceId();
```	
###_theView_  ![Property][prop]
The unique template element (JQuery) for a webble, in order to get access to the inner scope of self or another Webble mainly for performing Jquery operations. 
```JavaScript
// Get accesss to a inner JQuery element of the Webble using theView
var innerElement = $scope.theView.parent().find("#MyInnerElement");
```
###_theWblMetadata_  ![Property][prop]
JSON object that holds all metadata that this webble need to keep about itself.  
Those available from core are:

* **_defid_**: definition id when last published  
* **_templateid_**: id of the template used  
* **_templaterevision_**: the current revision of the template being used  
* **_author_**: the user name who published this Webble  
* **_displayname_**: the user friendly name of this Webble instance as of the time of publishing (inherited by default from its definition) and perhaps not the current one  
* **_description_**: an _author_-written text to describe the Webble (may be in any language)  
* **_keywords_**: an _author_-written list of descriptive words to categorize the Webble (may be in any language)  
* **_image_**: a data block and/or url to an image selected by _author_ to represent the Webble visually before being loaded  
* **_instanceid_**: NOT the current instance id as mentioned above, but the old instance id this Webble had the last time it got published. This value is kept in order to restore connections of all sorts and identify current Webble instances from knowledge of previous instances.

```JavaScript
// Get a Webble description text
var descriptionTxt = $scope.theWblMetadata['description'];
// Get a Webble old instance Id
var oldInstanceId = $scope.theWblMetadata['instancedeid'];
```
###_getInstanceName()_ ![Method][meth]
Get Current Instance display Name (Same name which is found at the top of the Webbles Properties/slots form)
```JavaScript
// Get Webble current set display name for the specific instance 
var currentDisplayName = $scope.getInstanceName();
```
###_getWebbleFullName()_ ![Method][meth]
Get Webble Full Name, returns this webbles user defined display name together with its instance id and its template id. Mainly used for display purposes.
```JavaScript
// Display the full name of the Webble in the console
var wblFullName = $scope.getWebbleFullName();
$log.log(wblFullName);
```
###_getChildren()_ ![Method][meth]
Returns an array of The children Webbles for the specific webble. To access a method inside a Webble retrieved from e.g. `getChild()` one uses the AngularJS `scope()` method for the specified Webble pointer as seen in the code example below.
```JavaScript
// Log the full name of each child in the console
for(var i = 0, c; c = $scope.getChildren()[i]; i++){
   $log.log( c.scope().getWebbleFullName() );
}
```
###_getParent()_ ![Method][meth]
Returns the parent webble, if any, otherwise NULL.
```JavaScript
// get the webbles parents full display name
var myParentsFullDisplayName = $scope.getParent().scope().getWebbleFullName();
```
###_paste(parent)_ ![Method][meth]
Paste connects the webble to a parent-webble provided as a parameter
```JavaScript
// Paste a webble to another Webble and create a parent child relationship
$scope.paste(otherWbl);
```
###_peel()_ ![Method][meth]
Peel removes the parent for the Webble and make it an orphan again
```JavaScript
// disconnect from current parent webble
$scope.peel();
```
###_getChildContainer()_ ![Method][meth]
The childcontainer is a jquery element object pointing at the place in the webble where children should be DOM pasted. Default value usually works fine, but for Webbles using clipping this might be useful to change.
```JavaScript
// Get the JQuery elelment in the Webble that holds the children webbles views
$scope.getChildContainer();
```
###_setChildContainer(newContainer)_ ![Method][meth]
Default value for child container usually works fine, but for Webbles using clipping a need to place the children elsewhere in the internal Webble DOM might be useful. If one wishes to set it back to the default value one need to save away that before making any changes. If Set to `undefined` no child can be pasted.
```JavaScript
// Set the JQuery elelment in the Webble that will hold the children webbles
$scope.setChildContainer(newContainer);
```
###_gimme(slotName)_ ![Method][meth]
Returns the value of a slot found by slot name provided as parameter. if no slot by the specified name is found undefined is returned.
The Value can be of any type, including string, number, array, object etc.
```JavaScript
// Displays the slot value for "MySlot" in the console window
$log.log( $scope.gimme("MySlot") );
```
###_set(slotName, slotValue)_ ![Method][meth]
Sets a new value to the slot with the name and value sent as a parameters. If a value is of completely wrong type or nonsensical the set will be ignored and the old value will remain.
The method then returns a bit flag value to tell how the set process succeeded

* 0: `NonExisting` (The slot did not exist)
* 1: `Exists` (The slot exists but no value was changed)
* 2: `ValueChanged` (The slot value was changed)

```JavaScript
// Set the slot "MySlot" to the string value of "Hello World"
$scope.set("MySlot", "Hello World");
```
###_addSlot(whatSlot)_ ![Method][meth]
Adds a slot (an instance of the slot 'class') to the list of slots.
A new instance of the Slot class is created by calling  
`new Slot(slotName, slotValue, slotDisplayName, slotDisplayDescription, slotCategory, slotMetaData, slotElementPointer)`  
Details about the [Slot](#slot) class can be found below under [Services](#services)
```JavaScript
// Creates and adds a new slot "msg"
var newSlot = new Slot('msg',
	"Hello Webble",
	'Message',
	'Text displayed on the Webble',
	$scope.theWblMetadata['templateid'],
	undefined,
	undefined
));
$scope.addSlot(newSlot);
```
###_getSlot(whatSlotName)_ ![Method][meth]
Returns a slot (complete 'class' instance) specified by its id name.
```JavaScript
// Gets a specific Slot "MySlot" and displays its description in the console
$log.log( $scope.getSlot("MySlot").getDisplayDescription() );
```
###_getSlots()_ ![Method][meth]
Returns the complete object-list of slots.
```JavaScript
// Iterates the complete slot list and prints the slot key (slot name) in the console description in the console
for(var slot in $scope.getSlots()){
	$log.log( slot );
}
```
###_removeSlot(whatSlotName)_ ![Method][meth]
Removes a slot found by name from the object-list of slots.
```JavaScript
// Removes (Deletes) the slot "MySlot" from the Webble slot list
$scope.removeSlot("MySlot");
```
###_getDefaultSlot()_ ![Method][meth]
Returns the default slot used for auto connection if that is enabled. When this is set any parent child connection automatically also get a slot connection using this value as to which slot to connect, provided both parent and child have this value set and no previous connection has been done already. A Webble can only have one default slot. 
```JavaScript
// Displays in the console the current default slot for this Webble
$log.log( $scope.getDefaultSlot() );
```
###_setDefaultSlot(newDefaultSlot)_ ![Method][meth]
Sets the current default slot for the Webble. If set to `undefined` no default slot connection is attempted.
```JavaScript
// Sets the slot "msg" to be the default slot
$scope.setDefaultSlot("msg");
```
###_getSelectedSlot()_ ![Method][meth]
Returns the name of the currently selected slot in this webble which is used in slot communication with its parent. No Set method exists since that is all managed internally when creating a slot communication.
```JavaScript
// Gets the name of the slot that is currently selected slot for slot communication
var selSlot = $scope.getSelectedSlot();
```
###_getConnectedSlot()_ ![Method][meth]
Returns the name of the  currently connected slot in the parent webble to be used in slot communication. No Set method exists since that is all managed internally when creating a slot communication. Slot communications are always stored and managed by the child Webble.
```JavaScript
// Gets the name of the connected slot in the parent webble
var parentsConnSlot = $scope.getConnectedSlot();
```
###_getSlotConnDir()_ ![Method][meth]
Returns the slot connection direction object which informs if SEND and RECEIVE are enabled or not.
The object returned looks like follow with a boolean value set to each key: `{send: false, receive: false}`
```JavaScript
// Checks if this Webble is sending slot values and print to the console if it is.
if( $scope.getSlotConnDir().send ){
	$log.log("This Webble is sending slot data")
};
```
###_connectSlots(parentSlot, childSlot, directions)_ ![Method][meth]
Creates a slot communication channelConnects a parent conn slot found by name with this Webbles selected slot found by name with a direction object with this format {send: false, receive: false}.
```JavaScript
//

```
    $scope.connectSlots(parentSlot, childSlot, directions);

###_()_ ![Method][meth]
This property keeps track of any protection setting this webble is currently using. See bitFlags_WebbleProtection in Services for more info of available options.
```JavaScript
//

```
    $scope.getProtection();

###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setProtection(protectionCode);
    
###_()_ ![Method][meth]
Disable or enable (previously disabled) Webble's popup menu items identified by ItemId (string) which for default menu items are the following: 'Publish', 'Duplicate', 'Delete', 'AssignParent', 'RevokeParent', 'ConnectSlots', 'Props', 'SharedDuplicate', 'Bundle', 'Unbundle', 'BringFwd', 'Protect', 'AddCustomSlots' and 'About'. One can also check weather an item is disabled or not.
```JavaScript
//

```
    $scope.addPopupMenuItemDisabled(whatItem)
    
###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.removePopupMenuItemDisabled(whatItem)

###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.isPopupMenuItemDisabled(whatItem)    

###_()_ ![Method][meth]
Selection State informs if this webble is selected and how and for what
```JavaScript
//

```
    $scope.getSelectionState();
    
###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setSelectionState(newSelectionState)

###_()_ ![Method][meth]
Activate Border shows or hides the webble border. But also allow to change border style, width and color. This is automatically set when selection state is altered, but for more fine grian controll this may be used.
```JavaScript
//

```
    $scope.activateBorder(isEnabled, whatColor, whatWidth, whatStyle, glowEnabled);

###_()_ ![Method][meth]
A list of Interaction objects that will give the user the power to interact with the webble more easy
```JavaScript
//

```
    $scope.theInteractionObjects;

###_()_ ![Method][meth]
Get Interaction Object By Name iterates all the Interaction objects and return the one that match the name sent as a parameter, if not found undefined is returned.
```JavaScript
//

```
    $scope.getInteractionObjectByName(whatName);

###_()_ ![Method][meth]
Tells us if the interaction objects are visible or not
```JavaScript
//

```
    $scope.getInteractionObjContainerVisibilty();

###_()_ ![Method][meth]
ActivateMenuItem reacts on context menu item click or can be used to manually activate a Webble menu option.
```JavaScript
//

```
    $scope.activateMenuItem(itemName);

###_()_ ![Method][meth]
Create Webble Definition, creates a webble definition object containing an exact description of the webble. Provide bool true if the Webble def should be used outside the Webble in question and positions should be absolute for each containing Webble instead of relative to its parents.
```JavaScript
//

```
    $scope.createWblDef(withAbsPosAndExternalUse);

###_()_ ![Method][meth]
Duplicate, duplicates itself at a specified offset position from the original and when done call the provided callback function with the new copy provided as a parameter.
```JavaScript
//

```
    $scope.duplicate(whatOffset, whatCallbackMethod);

###_()_ ![Method][meth]
Shared Model Duplicate, duplicates itself at a specified offset position from the original and let the copy share the same model (all slots) and when done call the provided callback function with the new copy provided as a parameter.
```JavaScript
//

```
    $scope.sharedModelDuplicate(whatOffset, whatCallbackMethod);

###_()_ ![Method][meth]
If there are any slots that controls Webble size they can be found or set here
```JavaScript
//

```
    $scope.getResizeSlots();
    $scope.setResizeSlots(widthSlotName, heightSlotName);

###_()_ ![Method][meth]
Changeable Slot name for the slot to be used with interaction ball: Rotate
```JavaScript
//

```
    $scope.getRotateSlot();
    
###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setRotateSlot(rotateSlotName);

###_()_ ![Method][meth]
Tells us if the Webble are visible or not (true or false) and a set for changing that.
```JavaScript
//

```
    $scope.getWblVisibilty();

###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setWblVisibilty(newVal);

###_()_ ![Method][meth]
A set of bit flags that control some of the Webble settings available (None[0], IsMoving[2], NoBubble[4])
```JavaScript
//

```
    $scope.getWebbleConfig() = function(){return theWebbleSettingFlags_;};
    
###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setWebbleConfig(whatNewConfigState);

###_()_ ![Method][meth]
Flag to indicate if this Webble is bundled or not. (The SET methods is mainly to be used internally by the core but it is possible to access it via the scope if needed)
```JavaScript
//

```
    $scope.getIsBundled();
    
###_()_ ![Method][meth]
```JavaScript
//

```
    $scope.setIsBundled(newBundleState);

###_()_ ![Method][meth]
List of Webbles whom which this one, share model (slots) with
```JavaScript
//

```
    $scope.getModelSharees();

###_()_ ![Method][meth]
Flag for this webble to know when its currently creating a modelSharee.
```JavaScript
//

```
    $scope.getIsCreatingModelSharee();

###_()_ ![Method][meth]
A set of flags for rescuing weird touch event behavior
```JavaScript
//

```
    $scope.touchRescueFlags = {
        doubleTapTemporarelyDisabled: false,
        interactionObjectActivated: false
    };
    	
###_()_ ![Method][meth]
Register Webble World Event Listener
Register an event listener for a specific event for a specific target (self, other or all) (targetData can be set for slotChange as a slotName to narrow down event further) and the callback function the webble wish to be called if the event fire. The callback function will then be handed a datapack object containing needed information to react to the event accordingly. (see wwEventListeners_) if targetId is undefined the webble will be listening to itself and if the targetId is set to null it will listen to all webbles.
```JavaScript
//

```
	$scope.registerWWEventListener(eventType, callbackFunc, targetId, targetData);
	
###_()_ ![Method][meth]
All callback functions are sent a datapack object as a parameter when they fire which includes different things depending on the event. The targetId post in these datapacks are only useful when the webble are listening to multiple webbles with the same callback.
```JavaScript
//

```
	wwEventListeners_ = {
		slotChanged:		 		Returning Data: {targetId: [Instance Id for webble getting slot changed], slotName: [Slot Name], slotValue: [Slot Value], timestamp: [a chronological timestamp value]}
		deleted: 	                Returning Data: {targetId: [Instance Id for webble being deleted], timestamp: [a chronical timestamp value]}
		duplicated: 	            Returning Data: {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
		sharedModelDuplicated: 		Returning Data: {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
		pasted: 	                Returning Data: {targetId: [Instance Id for webble being pasted], parentId: [Instance Id for Webble that is pasted upon], timestamp: [a chronological timestamp value]}
		gotChild: 					Returning Data: {targetId: [Instance Id for webble getting child], childId: [Instance Id for Webble that was pasted], timestamp: [a chronological timestamp value]}
		peeled: 	                Returning Data: {targetId: [Instance Id for Webble leaving parent], parentId: [Instance Id for Webble that lost its child], timestamp: [when it happened as ms integer]}
		lostChild: 		            Returning Data: {targetId: [Instance Id for Webble losing child], childId: [Instance Id for Webble that was peeled away], timestamp: [when it happened as ms integer]}
		keyDown: 					Returning Data: {targetId: null[=UNSPECIFIED], key: {code: [key code], name: [key name], released: [True When Key Released], timestamp: [a chronological timestamp value]}
		loadingWbl: 				Returning Data: {targetId: [Instance Id for webble that got loaded], timestamp: [a chronological timestamp value]}
		mainMenuExecuted: 		    Returning Data: {targetId: null[=UNSPECIFIED], menuId: [menu sublink id], timestamp: [a chronological timestamp value]}
		wblMenuExecuted: 	        Returning Data: {targetId: [Instance Id for the Webble executing menu], menuId: [menu item name], timestamp: [a chronological timestamp value]}
	};
	
###_()_ ![Method][meth]
Register Online Data Listener Lets the webble join a uniquely identified online data broadcasting virtual room for sending and receiving messages via the server online to other users. One must provide a unique id for the message area, an event handler method that receives all incoming messages for that room and optional if one wish to exclude the current user in the message dispatching.
```JavaScript
//

```
    $scope.registerOnlineDataListener(msgRoomId, eventHandler, excludeSelf);

###_()_ ![Method][meth]
The callback eventHandler for incoming messages provided when registering (above) will be sent the incoming data as the first parameter and the sending user as the second
USAGE EXAMPLE
```JavaScript
//

```
    var onOnlineDataArrive = function(data, username) {
        $log.log(data);
        $log.log("data sent by " + username);
    };
    
###_()_ ![Method][meth]
Unregister Online Data Listener
Lets the webble leave a uniquely identified online data broadcasting virtual room used for sending and receiving messages at their own will. This is an optional method. The system will clean up by itself if the Webbles disappears.
```JavaScript
//

```
    $scope.unregisterOnlineDataListener(whatRoom);
    
###_()_ ![Method][meth]
Send Online Data
Lets the webble sends data over the internet via the Webble server to any other webble and user online that is currently listening. It only works if the user has previously registered an online room. the webble must provide the room id to which the data is being sent and the of course the data which can be anything json approved.
```JavaScript
//

```
    $scope.sendOnlineData(whatRoom, whatData);
    
<!------------------------------------------------------------------------------------------------------------------->
##Platform
The **Platform** is the actual Webble World environment and it includes many helpful methods to access sections of the
system and specific Webbles. Also in this case it is reached from within the `$scope` of the Webble-template.

    // Gets and Sets current active execution mode level (developer, admin, etc)
    $scope.getCurrentExecutionMode();
    $scope.setExecutionMode(whatExecutionModeIndex);

    // Returns a bit flag container that keeps track of various settings which configures the platform environment
    // See SERVICES bitFlags_PlatformConfigs for more details.
    $scope.getPlatformSettingsFlags();

    // Gets or Sets a bit flag container that keeps track of various states this platform has to deal with
    // See SERVICES bitFlags_PlatformStates for more details.
    $scope.getPlatformCurrentStates();
    $scope.setPlatformCurrentStates(newPCS);

    // This is the jquery element of this platform
    $scope.getPlatformElement();

    // This is the DOM element (not the jquery element) of the current selected work surface.
    // (This is where top parent webbles are glued onto in the DOM)
    $scope.getWSE();

    // future child waiting to be assigned a parent. Usually only needed by the core, but it is there if ever needed.
    $scope.getPendingChild();
    $scope.setPendingChild(newPC);

    // If one have a slot or Webble operation one does not want to be a part of the undo stack then set this to true
    // just before calling the slot set or operation call. (set it back to false is not needed since the system reset
    // that on its own)
    $scope.BlockNextAddUndo();
    
    // If one have a long range of slot or Webble operation one does not want to be a part of the undo stack then set this to true
    // just before calling starting the process and call the unblock method to return to normal mode again
    $scope.BlockAddUndo();
    $scope.UnblockAddUndo();

    // A set of flags for rescuing weird touch event behavior
    $scope.touchRescuePlatformFlags = {
        noParentSelectPossibleYet: false
    };

    // Reset Selections, resets the work surface by removing all selections and half finished connections.
    $scope.resetSelections();

    // Clean Active Workspace, cleans out everything from the current selected workspace and resets the webbles therein.
    $scope.cleanActiveWS()

    // Load Webble from URL, tries to load a Webble JSON file from a URI provided as a parameter. The callbackmethod if
    // provided will be called when the new Webble is loaded including a ref point to the new Webble.
    $scope.loadWblFromURL(whatUrl, whatCallbackMethod);

    // Download Webble Defintion File, loads a webble identified by a unique name, either from server of from memory.
    // The callbackmethod if provided will be called when the new Webble is loaded including a ref point to the new
    // Webble.
    $scope.downloadWebbleDef(whatWblDefId, whatCallbackMethod);

    // Load From Definition File, loads a webble from a JSON definition provided as a parameter. The callbackmethod if
    // provided will be called when the new Webble is loaded including a ref point to the new Webble.
    $scope.loadWebbleFromDef(whatWblDef, whatCallbackMethod);

    // Waiting, turns on or off the appearance indicators ('is loading' gif image) in waiting mode. returns current waiting state if parameter is undefined.
    $scope.waiting(isWaitingEnabled);

    // Get Bundle Master, returns the bundle master of the specified Webble if it has one otherwise undefined.
    $scope.getBundleMaster(whatWebble);

    // Get Current Active Workspace, returns the current active workspace.
    $scope.getCurrWS();

    // Get Number of All Webbles in All Workspaces, returns the amount of Webbles currently in the platform
    // (all workspaces included).
    $scope.getNoOfAllWebblesInAllWS();

    // Get Current Active Webbles, returns a list of the current active webbles (in the active Workspace).
    $scope.getActiveWebbles();

    // Get Selected Webbles, returns a list of all webbles "Main" selected (in the active Workspace).
    $scope.getSelectedWebbles();

    // Get Webble Absolute Position In Pixels, calculates the specified webbles absolute position within the work surface.
    $scope.getWblAbsPosInPixels(whatWebble);

    // Get Webble Center Position, calculates the specified webbles absolute center position within the work surface.
    $scope.getWebbleCenterPos(whatWebble);
    
    // Get the top parent for a specific Webble and returns it. If no top parent exist the webble itself is returned 
    // (since it is obviously the top)
    $scope.getTopParent(whatWebble);

    // Get All Ancestors, finds all ancestors (parents and parents parents etc) of the defined webble and returns the list.
    $scope.getAllAncestors(whatWebble);

    // Get All Descendants, returns all webbles of those that are children or grandchildren etc of the webble specified
    // in the parameter, which is also included in the top of the list.
    $scope.getAllDescendants(whatWebble);

    // Looks for either the highest or the lowest value from all existing Webbles of a specified slot and return that value.
    $scope.getWinningSlotValueAmongAllWebbles(whatSlot, lowestWins){

    // Request Webble Selection, deals with the interaction process of making webbles MAIN selected properly
    $scope.requestWebbleSelection(target);

    // Publish Webble, saves and publish Webble definition to a specified place somewhere (server or local). Includes
    // form input requiremnets from user.
    $scope.requestPublishWebble(whatWbl);
    
    // Exports a Webble and all its needed templates (incl code files) to a webble code package file which can be 
    // imported to any other Webble World platform.
    $scope.requestExportWebble(whatWbl);

    // Request Delete Webble, deletes a specified webble from the system. (the last (optional) parameter is a function that will be called when job is done)
    $scope.requestDeleteWebble(target, callbackFunc);

    // Request Assign Parent, deals with the interaction process of assigning child parent relationship due to user
    // interaction. The target is the child if no child is pending, and it is the parent if there is a pending child.
    // This method is usually never called from outside the platform, instead for forcing parent-child relationship one
    // usually calls the Webble Core's paste() method instead.
    $scope.requestAssignParent(target);

    // Shows the Quick Info Message box with the specified text for either 2.5 seconds or the specified time of either
    // default size or the specified size at either the center of the screen or the specified position using either 
    // default color or the specified color (which can be an array of colors for gradient effect). 
    // If qimDominance is set to true, any other QIM messages will be discarded while the dominant one is still displayed.
    // If one call the function with empty text and time set to 0, the current QIM message (if any) will immediately close down.
    $scope.showQIM(qimText, qimTime, qimSize, qimPos, qimColor, qimDominance);

    // Open Form, Creates and opens a modal form window for a specific use that can be used to edit or consume any data.
    // For more details of available forms see SERVICES aopForms.
    // For Custom simple message popups please use Enum.aopForms.infoMsg form with a content parameter config as such:
    // {title: 'title text', content: 'body text'}. (Content can also contain html and css)
    // The Webble-template builder can provide his own form html, controller and style class and call this method with
    // an empty name and include whats needed in the content parameter configured as such:
    // Array [{templateUrl: "absolute or relative path to form html file", controller: "Name of the controller method",
    //        size: "'lg' for large, 'sm' for small or blank '' for normal"}, "Form Content in any form and type (string, array, object etc)"].
    // Callback function is used for catching form response data (not available in infoMsg)
    $scope.openForm(whatForm, content, callbackFunc);

    // Default Service Error can be used as a generic fail message for promises that cannot be kept.
    $scope.serviceError(errorMsg);

    // Get Webbles By Template Id, returna a list of Webbles with a specific template id. (found in active Workspace)
    $scope.getWebblesByTemplateId(whatTemplateid);

    // Get Webble By Instance Id, return the unique Webble with a specific instance id. (found in active Workspace)
    $scope.getWebbleByInstanceId(whatInstanceId);

    // Get Webbles By Display Name, returns a list of Webbles with a certain display name. (found in active Workspace)
    $scope.getWebblesByDisplayName(whatWebbleDisplayName);

    // Select All Webbles, make all webbles "Main" selected.
    $scope.selectAllWebbles();

    // Unselect All Webbles, makes all webbles unselected
    $scope.unselectAllWebbles();

    // Execute Menu Selection, executes the correct action, based on menu or shortcut selection.
    // For more details of avialable selections please see SERVICES menuItemsFactoryService, where the itemnames are
    // used as a sublink call. Additionally exists short cut keys outside the menu, which can be examined in the
    // Webble World 3 Platform by pressing Alt+F1.
    $scope.executeMenuSelection(sublink, whatKeys);

    // Fast access to filter that lets you write dynamic string outputs in an efficient way.
    $scope.strFormatFltr("string with parameters, like {0} and {1} inside it", [parameter0, parameter1]);

    // Returns the default language (code) of the browser
    $scope.getSysLanguage();

    // Returns the current language (code) being used by the Webble World Platform
    $scope.getCurrentLanguage();

	// Informs if there is a Webble World form currently open or not
	$scope.getIsFormOpen();
		
    // Flags for some specific keyboard keys, weather they are currently pressed or not
    $scope.altKeyIsDown = false;
    $scope.shiftKeyIsDown = false;
    $scope.ctrlKeyIsDown = false;
    
    // Allows you to turn off (or on) the displaying of all and every waiting graphics for Webble World
    $scope.setWaitingServiceDeactivationState(newState);
        
    // If debugging and one want to display a text in the menu section where debug enabled is displayed, one can use this variable
    $scope.debugValue.txt
    
    // Quick way to retrieve or set the current background color of the platform. 
    $scope.getPlatformBkgColor();
    $scope.setPlatformBkgColor(newPlatformBkgColor);

<!------------------------------------------------------------------------------------------------------------------->
##Workspace
The **Workspace** is the area where the Webbles resides and are modified and/or used. It contains mainly internal methods,
but a few useful help functions exists. Even here those are accessed via the Webble-template's `$scope`.

    // The Bubble Text object can be used to display short info at specific locations, mainly Webbles. The following 
    // methods are available to manipulate that.
    $scope.getBubbleTxt();
    $scope.setBubbleTxt(newTxt);
    $scope.getBubbleTxtVisibility();
    $scope.setBubbleTxtPos(newPos);
    $scope.setBubbleTxtVisibility(newVisibilityState, howLong); //state is true or false and how long is time in milliseconds
    
    // Fast access to get the current height of the work surface area as a css value with 'px' at the end
     $scope.getSurfaceHeight();

<!------------------------------------------------------------------------------------------------------------------->
##Interaction Object
The **Interaction Object** is those small balls that each Webble has on the border when "_Main_" selected. There are 12
avialable around the border, but by default only 3-4 are activated. The Webble-template developer may configure and
activate (or deactivate) freely any of those for its own need. In the Webble-template the developer most easy just
define a Interaction object array object and all is set up automatically, but if the need for fine grain power exist,
then that is also available.

    // The Color of the Interaction Object
    $scope.color = '';

    // The position of the Interaction Object. (In 99.99% of the cases this is completelly auto adjusted by the Webble,
    // but it is available to enforce if needed)
    $scope.pos = {left: 0, top: 0};

    // The Text displayed when hoovering the Interaction Object, which usually describes what it does
    $scope.tooltip = 'undefined';

    // Index of the Interaction object available 0-11 in order to grab the one interaction object one really wants.
    // The index positions are as follows
    //     0,4,8-----1
    //     |         5
    //     |         9
    //     11        |
    //     7         |
    //     3----2,6,10
    $scope.getIndex();

    // The name that the interaction object is identified by and is used to trigger custom behavior
    $scope.getName();
    $scope.setName(whatName);

    // Get Is Enabled, gets if this object is enabled or not. (false = not visible)
    $scope.getIsEnabled();

    // Set Is Enabled, sets the enabling state (true or false) for this object. (false = not visible)
    $scope.setIsEnabled(enableState);

<!------------------------------------------------------------------------------------------------------------------->
##Directives
AngularJS **Directives** can be very powerful and we recommend the Webble-template developers to create their own for their
Webbles, but there are a few simple ones already available in the platform core that can be easily used too. Just apply
the directive name as instructed either as a tag attribute or class name.

    // Makes an element draggable (JQuery style) (Attribute or Class)
    draggable [optional: draggable="{options}" ]

    // Makes an element resizable (JQuery style) (Attribute or Class)
    resizable [ optional: 'resizable="{options}" ]

    // Makes an element sortable (JQuery style) (Attribute or Class)
    sortable [ optional: 'sortable="{options}" ]

    // make sure the select tags 'size' value can be set dynamically.
    ng-size"{{value}}"

    // Resize the element's width to the same size as the current window size
    fullspread

<!------------------------------------------------------------------------------------------------------------------->
<a name="services"></a>
##Services
In the **Services** can be found multiple help functions and support methods along with various providers av data of all
sorts. If one want to use a service in a Webble the name of the service must be included at the top of the controller 
function declaration (e.g. `Enum` or `wwConst` etc.). The ones that could be of interest for a Webble-template developer, except the ones he/she would create themselves inside the template are the following.

    //Available Platform states
    Enum.availablePlatformPotentials
    { None: 0, Slim: 1, Limited: 2, Full: 3, Custom: 4, Undefined: 5 }

    //Available forms and modal windows
    Enum.aopForms
    { userReg: 0, wblProps: 1, slotConn: 2, protect: 3, addCustSlot: 4, infoMsg: 5, langChange: 6, publishWebble: 7,
      loadWebble: 8, saveWorkspace: 9, platformProps: 10, about: 12, wblAbout: 13, wblSearch: 14, faq: 15, bundle: 16,
      deleteWorkspace: 17, rateWbl: 18, saveWorkspaceAs: 19, shareWorkspaces: 20, editCustMenuItems: 21, editCustInteractObj: 22,
	  viewWblRatingAndComments: 23, exportWebble: 24, importWebble: 25 }

    // Default Interaction objects that all webbles share
    Enum.availableOnePicks_DefaultInteractionObjects
    { Menu: 0, Rotate: 1, Resize: 2, AssignParent: 3 }

    // Tooltip Text for default Interaction objects that all webbles share
    Enum.availableOnePicks_DefaultInteractionObjectsTooltipTxt
    { Menu: gettext("Open Menu"), Rotate: gettext("Rotate"), Resize: gettext("Resize"), AssignParent: gettext("Assign Parent") }

    // Default context menu choices that all webbles share
    Enum.availableOnePicks_DefaultWebbleMenuTargets
    { Publish: 1, Duplicate: 2, Delete: 3, AssignParent: 4, RevokeParent: 5, ConnectSlots: 6, Props: 7,
      SharedDuplicate: 8, Bundle: 9, Unbundle: 10, BringFwd: 11, Protect: 12, AddCustomSlots: 13, 
      EditCustomMenuItems: 14, EditCustomInteractionObjects: 15, About: 16}
      
    // Default menu choices Name Texts
	Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt
	{ Publish: gettext("Publish"), Duplicate: gettext("Duplicate"), Delete: gettext("Delete"), 
	  AssignParent: gettext("Assign Parent"), RevokeParent: gettext("Revoke Parent"), 
	  ConnectSlots: gettext("Connect Slots"), Props: gettext("Properties"), 
	  SharedDuplicate: gettext("Shared Model Duplicate"), Bundle: gettext("Bundle"), Unbundle: gettext("Unbundle"),
	  BringFwd: gettext("Bring to Front"), Protect: gettext("Set Protection"), 
	  AddCustomSlots: gettext("Add Custom Slots"), EditCustomMenuItems: gettext("Custom Menu Items"), 
	  EditCustomInteractionObjects: gettext("Custom Interaction Objects"), About: gettext("About")}

    // The different execution modes the webble world can be set to
    Enum.availableOnePicks_ExecutionModes
    { Developer: 0, Admin: 1, SuperHighClearanceUser: 2, HighClearanceUser: 3, MediumClearanceUser: 4, LowClearanceUser: 5 },

    // Text for the different execution modes the webble world can be set to
    Enum.availableOnePicks_ExecutionModesDisplayText
    { Developer: gettext("Developer"), Admin: gettext("Admin"), SuperHighClearanceUser: gettext("Super High Clearance User"),
      HighClearanceUser: gettext("High Clearance User"), MediumClearanceUser:  gettext("Medium Clearance User"),
      LowClearanceUser:  gettext("Low Clearance User") }

    // The different types of visual selected states available
    Enum.availableOnePicks_SelectTypes
    { AsNotSelected: 0, AsMainClicked: 1, AsChild: 2, AsHighlighted: 3, AsImportant: 4, AsToBeRemembered: 5, AsParent: 6,
      AsWaitingForParent: 7, AsWaitingForChild: 8, AsNewParent: 9, AsNewChild: 10 }

    // The different available form input types used to interact with webble properties and similar
    Enum.aopInputTypes
    { Undefined: 0, CheckBox: 1, ColorPick: 2, ComboBoxUseIndex: 3, ComboBoxUseValue: 4, FontFamily: 5, RadioButton: 6,
      Slider: 7, Point: 8, Numeral: 9, PasswordBox: 10, Size: 11, TextBox: 12, MultiListBox: 13, MultiCheckBox: 14,
      RichText: 15, DatePick: 16, ImagePick: 17, AudioPick: 18, VideoPick: 19, WebPick: 20, TextArea: 21 }

    //Used for webble initation states [Bitwise Flags]
    Enum.bitFlags_InitStates
    { None: 0, InitBegun: 1, InitFinished: 2, ActiveReady: 4, AllDone: 8 }
    
    //Used for keeping track what the platform is doing [Bitwise Flags]
    Enum.bitFlags_PlatformStates
    { None: 0, WaitingForParent: 1, WaitingForAllSelect: 2 }

    //Used for keeping track if a slot is disabled in some way or another (higher values include all lower ones)
    Enum.SlotDisablingState
    { None: 0, PropertyEditing: 1, PropertyVisibility: 2, ConnectionVisibility: 4, AllVisibility: 8 }

    // The different types of available webble metadata [Bitwise Flags]
    Enum.bitFlags_WebbleConfigs
    { None: 0, IsMoving: 2, NoBubble: 4 }

    // The different protections that can be set on a webble [Bitwise Flags] (See Webble Protection in a live Webble for further details)
    Enum.bitFlags_WebbleProtection
    { NO, MOVE, RESIZE, DUPLICATE, SHAREDMODELDUPLICATE, DELETE, PUBLISH, PROPERTY, PARENT_CONNECT, CHILD_CONNECT, 
      PARENT_DISCONNECT, CHILD_DISCONNECT, BUNDLE, UNBUNDLE, DEFAULT_MENU, INTERACTION_OBJECTS, SELECTED, POPUP_MENU,
      NON_DEV_HIDDEN, DRAG_CLONE, BUNDLE_LOCKED, EXPORT }
                                                              
    // The different Webble World Events that a Webble can listen to  
    Enum.availableWWEvents
    { slotChanged: 0, deleted: 1, duplicated: 2, sharedModelDuplicated: 3, pasted: 4, gotChild: 5, peeled: 6, 
      lostChild: 7, keyDown: 8, loadingWbl: 9, mainMenuExecuted: 10, wblMenuExecuted: 11 }
      
    // A service that returns useful constant values
    wwConsts.palette
    wwConsts.lightPalette
    wwConsts.elementTransformations
    wwConsts.languages
    wwConsts.defaultFontFamilies

    // Color hex and RGB value converter service.
    colorService.rgbToHex(R,G,B);
    colorService.rgbStrToHex(rgbStr);
    colorService.hexToRGB(hex);
    colorService.hexToRGBAStr(hex)

    // String Catcher returns a proper string for name and description of CSS attributes
    strCatcher.cssAttrNames
    strCatcher.cssAttrDescs

    // Is Safe Font Family, tests if the provided font name is a safe and known one.
    isSafeFontFamily(fontFamilyNameToTest);

    // Service that calls for personal API access keys for a specific realm and resource previously stored in current user's user profile.
    dbService.getMyAccessKey(realm, resource).then(
        function(returningKey) {
            // DO WHAT YOU ARE SUPPOSED TO DO TO ACCESS THE API WITH THE KEYS YOU RETRIEVED.
        },
        function(err){$log.log(err);}
    );

    // Get CSS Class property value, returns the class value for a specific property found within loaded style sheets.
    getCSSClassPropValue(style, selector, sheet);

    // Get Uri Variables, returns a JavaScript Object containing the URL parameters from the current URL
    getUrlVars();

    // Keyboard key name from key code, returns the name of a key on the keyboard based on the key code value.
    fromKeyCode(keycode);

    // Bit Flag Operations, turns binary flags on and off.
    bitflags.off(whatFlagSelection, whatBitFlag);
    bitflags.on(whatFlagSelection, whatBitFlag);
    bitflags.toggle(whatFlagSelection, whatBitFlag);

    // Get Key By Value, gets a associative array and a value and returns the name of the key containing that value or,
    // if not found, returns null.
    getKeyByValue(object, value);

    // Is Valid Enum Value, tests that a specified value is contained within the range of values inside a specific Enum
    // value collection. Values is validated both by key name and/or by key value.
    isValidEnumValue(enumToTest, valueToTest);
    
    // isExist, A service that checks if something exist somewhere. For example if a specific value exists in a 
    // specific array. valueInArrayOfObj can take an array of keys for nested objects. Both service methods can return 
    // the index of the find instead of just true or false if retAsIndex is set to true
    isExist.valueInArray(theArray, theValue, retAsIndex);
    isExist.valueInArrayOfObj(theArray, theValue, theObjKey, retAsIndex);

    // Is Valid Style Value, tests that a specified style value within a specified style setting is a valid option.
    isValidStyleValue(styleToTest, possibleStyleValue);

    // JSON Query, a collection of functions to query a json object.
    jsonQuery.allValByKey(obj, key);
    jsonQuery.allObjWithKey(obj, key);
    jsonQuery.allObjValuesAsArray(obj);
    jsonQuery.getArrayIndexByObjValue(obj, val);

    // Get Timestamp, creates a unix like time stamp value.
    getTimestamp();

<a name="slot"></a>

    // Slot (class service), is an object instance provider for the class concept of 'Slot'. If you want a special
    // behavior, like for example a custom gimme, then you override the getValue method for the specified slot instance
    // in your Webble init function at slot creation time.
    // Good to know is that only the unique name, the value, the slot category and the metadata are saved in the JSON 
    // configuration file. Other values must be recreated at slot creation (usually during Webble initiation) and are 
    // not stored.
    
    new Slot(sName, sValue, sDispName, sDispDesc, sCat, sMetaData, sElementPntr);
        [slotInstance].getName();
        [slotInstance].setName(newSlotName);
        [slotInstance].getValue();
        [slotInstance].setValue(newValue);
        [slotInstance].getCategory();
        [slotInstance].setCategory(newCat);
        [slotInstance].getTimestamp();
        [slotInstance].resetTimestamp();
        [slotInstance].setTimestamp();
        [slotInstance].setCustomTimestamp(newTimestampValue);
        [slotInstance].getTimestampMemory();
        [slotInstance].setTimestampMemory();
        [slotInstance].getElementPntr();
        [slotInstance].setElementPntr(newElementPntr);
        [slotInstance].getDisplayName();
        [slotInstance].getExtDisplayName();
        [slotInstance].setDisplayName(newDisplayName);
        [slotInstance].getDisplayDescription();
        [slotInstance].setDisplayDescription(newDisplayDescription);
        [slotInstance].getMetaData();
        [slotInstance].setMetaData(newMetaData);
        [slotInstance].getDisabledSetting();
        [slotInstance].setDisabledSetting(newDisabledSetting);        
        [slotInstance].getDoNotIncludeInUndo();
        [slotInstance].setDoNotIncludeInUndo(newDoNotIncludeInUndo);        
        [slotInstance].getIsCustomMade();
        [slotInstance].setIsCustomMade(customMadeState);
        [slotInstance].getOriginalType();

    // Value Modifier and Separator, a collection of functions that modify or separate values or fix values that was not in correct format
    valMod.getValUnitSeparated(theValue);       //for css values with units
    valMod.addPxMaybe(theName, theVal);         //for css values who requires a unit    
    valMod.getFormatedDate(inDate);				//Formats and return a javascript date to the iso format yyyy-mm-dd.
    valMod.fixBrokenObjStrToProperObject(strToFix);   	//Gets a string which failed being parsed as a json object, tries to fix and mend it and create a proper object from it, or if not returns an empty object.
    valMod.fixBrokenArrStrToProperArray(strToFix);		//Gets a string which failed being parsed as an array, tries to fix and mend it and create a proper array from it, or if not returns an empty array.
    valMod.urlify(text);                  		//Adds html link tag around html addresses found inside provided text and returns the new and improved version
    valMod.urlifyWithImages(text);              //Adds html link tag around html addresses found inside provided text and create img tags for links that are images and returns the new and improved version
    valMod.SlimTextFromLinksAndHtml(text);      //Remove all links and replace them with ifdo about their existance and also removes all html tags in the text and returns the new and improved version
    valMod.findAndRemoveValueInArray(theArray, theValue); 	//Iterates through an array and if the specified value is found it is removed and the array is returned

    // Is Empty, checks weather an object is empty (in every way that may be).
    isEmpty(obj);

    // A collection of math support functions
    mathy.countDecimals(theValue);				//Returns the number of decimals in a float number
    mathy.getRotationDegrees(jquery-element);  	//Get rotation in degrees of a specified jquery element
    mathy.monthDiff(date 1, date 2)				//returns the number of months between two dates

<!------------------------------------------------------------------------------------------------------------------->
##Filters
With AngularJS **Filters** one can alter and modify any value in many powerful ways with ease and speed and is recommended to
be created and used within the Webble-template itself, but the platform has a few available too, that might be useful.

    // takes a language code and turn it into the readable native name of that language
    IN JS: nativeName(input);     IN HTML: {{ input | nativeName }}

    // takes a language code and turn it into a readable sentence for the line 'Change To LANG' in the native text of
    // that language
    IN JS: nativeString(input);     IN HTML: {{ input | nativeString }}

    // Simple string formatting filter.
    IN JS: stringFormat(template, values);     IN HTML: {{ template | stringFormat : [variable1, variable2, etc] }}

    // A bitwise test filter that return true or false if bit is set or not
    IN JS:bitwiseAnd(firstNumber, secondNumber);     IN HTML: {{ firstNumber | bitwiseAnd : secondNumber }}

<!------------------------------------------------------------------------------------------------------------------->
##Extra Additional
Extra functions that is within the system and can be used by any Webble developer

	// Detecting the current browser, version and OS
    // USAGE EXAMPLE
    var thisMachine = BrowserDetect;
    if(thisMachine.browser == "Chrome"){ /* Do Something */ }
    if(thisMachine.version == "12.5"){ /* Do Something */ }
    if(thisMachine.OS == "Windows"){ /* Do Something */ }
    if(thisMachine.device == "iPad"){ /* Do Something */ }

[prop]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-P-icon.png
[meth]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-M-icon.png
