#Basic Webble Template API

**Dear Webble Developer**,

Welcome to current version of Webble World 3. We invite you to start developing your own Webble Templates and upload them to the Online Webble repository for the world to share.

In the files provided you will find the necessary information (as comments and TODO's) that you need to build your Webble template.   You can also download and read the Webble World Manual found online.

Also, be aware of the order the webble files load in case you have some crucial dependencies. First is the manifest files and the library files included in it, next the styles.css is loaded followed by the services, filters, directives and finally the controller. The last file of all to be loaded is the view.html. Because of this one should not run any code inside the controller (or the other js files) that is dependent on the DOM before it actually exist. Such code should be called from or inside the `$scope.coreCall_Init` function which is automatically called by the Webble as soon as all files are loaded.

Below is also a large list of available Webble Core and Platform access methods for all sort of needs. Also listed are
existing services, directives and filters that your Webble might want to use to make magic happen.

(Note. Remember to turn on Debug Logging in Webble World when coding so that you can use $log.log() and the console the best way)

* ![Method][meth] = Method
* ![Property][prop] = Property
* ![Directive][dir] = Directive
* ![Enum][enum] = Enumerations
* ![Class][class] = Class

<!------------------------------------------------------------------------------------------------------------------->
##Webble Core

The **Webble Core** is exactly what it sounds like. The heart of a Webble and what makes it such. Within the Webble-template
**_$scope_**, the core can be reached to get following methods and data:

###_activateBorder_ ![Method][meth]
Activate Border shows or hides the webble border. But also allow to change border style, width and color. This is automatically set when selection state is altered, but for more fine grain controll this may be used. All parameters have a default value and are therefore optional.

####activateBorder(isEnabled, whatColor, whatWidth, whatStyle, glowEnabled)

* **Parameters:**
    * isEnabled (Boolean) If the border should be visible or not
    * whatColor (Color String) Hexadecimal color value "#000000", color name "black", rgb or rgba value (rgb(0, 0, 0)) are allowed
    	* OPTIONAL
        * default: "#46f03e"
    * whatWidth (Integer) the width of the border
    	* OPTIONAL
        * default: 3
    * whatStyle (String) any available css border style value
    	* OPTIONAL
        * default: "solid"
    * glowEnabled (Boolean) If true creates a glow effect around the border
    	* OPTIONAL
        * default: false
* **Returns:**
    * Nothing

```JavaScript
// Sets the Webbles border to be yellow, thick, dottet with glow
$scope.activateBorder(true, "yellow", 6, "dotted", true);
```
###_activateMenuItem_ ![Method][meth]
Activates (fires) any of the available context menu items for the Webble and executes the code related to the menu item found by the id provided as parameter. Existing default menu items can be viewed [here](#availableOnePicks_DefaultWebbleMenuTargets)

####activateMenuItem(itemName)

* **Parameters:**
    * itemName (String) Menu item id name
        * For default items the Enum name is used as string, and NOT the Enum Integer
* **Returns:**
    * Nothing

```JavaScript
// Force the About info form for this Webble to be opened
$scope.activateMenuItem("About");
```
###_addPopupMenuItemDisabled_ ![Method][meth]
Disables Webble's popup menu items identified by ItemId (string) which for default menu items are the following:
<a name="defMenuItems"></a>

* Publish
* Duplicate
* Delete
* AssignParent
* RevokeParent
* ConnectSlots
* Props
* SharedDuplicate
* Bundle
* Unbundle
* BringFwd
* Protect
* AddCustomSlots
* About
 
Custom Menu Items can also be disabled the same way using their ItemId string.

####addPopupMenuItemDisabled(whatItem)

* **Parameters:**
    * whatItem (String) The name id of the menu item wished to be disabled
* **Returns:**
    * Nothing

```JavaScript
// Disables (Makes invisible) the previously created custom menu item "MyCustMenuItem" so it cannot be interacted with.
$scope.addPopupMenuItemDisabled("MyCustMenuItem");
```
###_addSlot_ ![Method][meth]
Adds a slot (an instance of the slot 'class') to the list of slots.
A new instance of the Slot class is created by calling  
`new Slot(slotName, slotValue, slotDisplayName, slotDisplayDescription, slotCategory, slotMetaData, slotElementPointer)`  
Details about the [Slot](#slot) class can be found below under [Services](#services)

####addSlot(whatSlot)

* **Parameters:**
    * whatSlot (Slot Object)
* **Returns:**
    * (Boolean) True of False depending on success

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
<a name="connectSlots"></a>
###_connectSlots_ ![Method][meth]
Creates a slot communication channel and connects a parent slot with this Webbles selected slot with a direction enabled object. When connection is created a slot value exchange is immediately done for each direction enabled. If both is enabled SEND is executed first from the child to the parent. (meaning that RECEIVE will contain the same value the child already sent)

####connectSlots(parentSlot, childSlot, directions)

* **Parameters:**
    * parentSlot (String) Name id of the slot in parent Webble used for slot communication
    * childSlot (String) Name id of the slot in self Webble used for slot communication
    * directions (Object) Boolean value for each object key representing enabled or not
        * `{send: false, receive: false}`
* **Returns:**
    * Nothing

```JavaScript
// Create a dual direction slot connection fro this Webble to its parent
$scope.connectSlots("theParentSlot", "MySlot", {send: true, receive: true});
```
###_createWblDef_ ![Method][meth]
Creates a webble definition JSON object containing an exact description of the webble, with its slots, position, relationships metadata etc.  This is the object that describes each Webble at its current state and which is stored in the server database when published.
Provide true if the Webble def should be used outside the Webble in question and positions should be absolute for each containing Webble instead of relative to its parents (Most common and useful is true). (A Webble def created, using false cannot be used when loading new Webbles).

####createWblDef(withAbsPosAndExternalUse)

* **Parameters:**
    * withAbsPosAndExternalUse (Boolean) When true the Webble definition will contain the absolute position instead of relative and can be used when loading new webbles ([loadWebbleFromDef](#loadWebbleFromDef)).
        * OPTIONAL
* **Returns:**
    * (JSON) the webble definition JSON object just created

```JavaScript
// Displays the Webbles configuration data in the console
$log.log( $scope.createWblDef() );
```
###_duplicate_ ![Method][meth]
Duplicate the Webble itself and creates a copy at a specified offset position from the original self and when done call the provided callback function (if provided) with the new copy as a parameter.

####duplicate(whatOffset, whatCallbackMethod)

* **Parameters:**
    * whatOffset (Object) x and y position from the position of self where the copy should appear
        *  e.g. {x: 15, y: 15}
    * whatCallbackMethod (Function) To be called when the duplication is finished. Will be called with Duplicate Webble pointer as parameter.
        * OPTIONAL
* **Returns:**
    * (Boolean) True or False wheather the attempt to duplicate succeeds or not

```JavaScript
// Creates a duplicate of self 100 pixels to the right (does not call any callback function)
$scope.duplicate({x: 100, y: 0});
```
###_getChildContainer_ ![Method][meth]
The childcontainer is a jquery element object pointing at the place in the webble where children should be DOM pasted. Default value usually works fine, but for Webbles using clipping this might be useful to change.

####getChildContainer()

* **Parameters:**
    * None
* **Returns:**
    * (JQuery Element) The DOM element where children are pasted within the DOM tree for the Webble

```JavaScript
// Get the JQuery elelment in the Webble that holds the children webbles views
$scope.getChildContainer();
```
###_getChildren_ ![Method][meth]
Returns an array of The children Webbles for the specific webble. To access a method inside a Webble retrieved from e.g. `getChild()` one uses the AngularJS `scope()` method for the specified Webble pointer as seen in the code example below.

####getChildren()

* **Parameters:**
    * None
* **Returns:**
    * (Array) A Webble Element Pointer for each child of the Webble

```JavaScript
// Log the full name of each child in the console
for(var i = 0, c; c = $scope.getChildren()[i]; i++){
   $log.log( c.scope().getWebbleFullName() );
}
```
###_getConnectedSlot_ ![Method][meth]
Returns the name of the  currently connected slot in the parent webble to be used in slot communication. No Set method exists since that is all managed internally when creating a slot communication. Slot communications are always stored and managed by the child Webble.

####getConnectedSlot()

* **Parameters:**
    * None
* **Returns:**
    * (String) Name id of the slot in parent Webble used for slot communication

```JavaScript
// Gets the name of the connected slot in the parent webble
var parentsConnSlot = $scope.getConnectedSlot();
```
###_getDefaultSlot_ ![Method][meth]
Returns the default slot used for auto connection if that is enabled. When this is set any parent child connection automatically also get a slot connection using this value as to which slot to connect, provided both parent and child have this value set and no previous connection has been done already. A Webble can only have one default slot.

####getDefaultSlot()

* **Parameters:**
    * None
* **Returns:**
    * (String) Id name of the slot in question
        * `undefined` if no default slot exists
 
```JavaScript
// Displays in the console the current default slot for this Webble
$log.log( $scope.getDefaultSlot() );
```
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
###_getInstanceName_ ![Method][meth]
Get Current Instance display Name (Same name which is found at the top of the Webbles Properties/slots form)

####getInstanceName()

* **Parameters:**
    * None
* **Returns:**
    * (String) Current Display Name of the Webble

```JavaScript
// Get Webble current set display name for the specific instance 
var currentDisplayName = $scope.getInstanceName();
```
###_getInteractionObjContainerVisibilty_ ![Method][meth]
Tells us if any or none of the interaction objects are visible or not. Method mainly used internally.

####getInteractionObjContainerVisibilty()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or false if the interaction objects are currently visible or not (Webble selected and border turned on)

```JavaScript
//
if ( $scope.getInteractionObjContainerVisibilty() ){
	$log.log("They are visible")
}
```
###_getInteractionObjectByName_ ![Method][meth]
Returns the Interaction object that match the name sent as a parameter, if not found `undefined` is returned.

####getInteractionObjectByName(whatName)

* **Parameters:**
    * whatName (String) 
* **Returns:**
    * (Object Pointer) an Interaction Object and all its internals
        * `undefined` if not found

```JavaScript
// Disables the Interaction Object with name "MyOwnIO" (Fails if does not exist)
$scope.getInteractionObjectByName("MyOwnIO").setIsEnabled(false);
```
###_getIsBundled_ ![Method][meth]
Returns an integer flag that indicates if this Webble is bundled or not. 0 means not bundled, any value above 0 means how many nested bundles the Webble is within.

####getIsBundled()

* **Parameters:**
    * None
* **Returns:**
    * (Integer) 0 or Above. where 0 means not bundled and values above means amount of nested bundles.

```JavaScript
// Prints in the console the amount of bundles the Webble is within
$log.log( $scope.getIsBundled() );
```
###_getIsCreatingModelSharee_ ![Method][meth]
Returns boolean Flag for this webble to know whether it is currently in the process of creating a model-Sharee. Rarely used, but might be useful is some specific and time critical situations.

####getIsCreatingModelSharee()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False depending if the Webble is busy creating model-sharee or not.

```JavaScript
// Checks if the Webble is busy creating a model-sharee, and if so informs about it in the console
if( $scope.getIsCreatingModelSharee() ){
	$log.log( "I am Busy!"):
}
```
###_getModelSharees_ ![Method][meth]
Returns a list of Webbles whom which this one, share model (slots) with.

####getModelSharees()

* **Parameters:**
    * None
* **Returns:**
    * (Array) List of Webble pointers (which the Webble share slots with)

```JavaScript
// Prints in the console the Instance Id for every Webble this one shares model (slots) with
for(var i = 0, ms; ms = $scope.getModelSharees()[i]; i++){
	$log.log( ms.scope().getInstanceId() );
}
```
###_getParent_ ![Method][meth]
Returns the parent webble, if any, otherwise NULL.

####getParent()

* **Parameters:**
    * None
* **Returns:**
    * (Webble Pointer) Element Pointer for the parent of the Webble
        * Null if empty

```JavaScript
// get the webbles parents full display name (Fails if NULL)
var myParentsFullDisplayName = $scope.getParent().scope().getWebbleFullName();
```
###_getProtection_ ![Method][meth]
Returns a bit flag value property which keeps track of any protection setting this webble is currently using. See [bitFlags_WebbleProtection](#bitFlags_WebbleProtection) in [Services](#services) for more info of available protection options.

####getProtection()

* **Parameters:**
    * None
* **Returns:**
    * Bit Flag (Integer (Binary)) Containing a Bit flag value that indicates weather a protection is enabled or not (1 or 0)

```JavaScript
// Gets current Webble protection settings and checks if it is protected against Moving, if so print to the console
if((parseInt($scope.getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.MOVE, 10)) !== 0){
	$log.log("This Webble is not allowed to move");
}
```
###_getResizeSlots_ ![Method][meth]
If there are any slots that controls the Webble size, either css generated or developer assigned, they can be found here.

####getResizeSlots()

* **Parameters:**
    * None
* **Returns:**
    * (Object) Size object with width and height keys
	    * e.g. {width: 100, height: 50}
		* unassigned Size Slots returns {width: undefined, height: undefined}

```JavaScript
// Prints the Webble width and height to the console
var wblSize = $scope.getResizeSlots();
$log.log( "width: " + wblSize.width + ", Height: " + wblSize.height );
```
###_getRotateSlot_ ![Method][meth]
Returns the name of the slot that holds the Webbles rotation value. Mainly used by interaction ball: Rotate

####getRotateSlot()

* **Parameters:**
    * None
* **Returns:**
    * (String) Name of the slot that keeps the rotation value of the Webble
	    * Default: 'root:transform-rotate'

```JavaScript
// Prints the name of the rotate Webble slot in the console
$log.log( $scope.getRotateSlot() );
```
###_getSelectedSlot_ ![Method][meth]
Returns the name of the currently selected slot in this webble which is used in slot communication with its parent. No Set method exists since that is all managed internally when creating a slot communication ([`connectSlots`](#connectSlots)).

####getSelectedSlot()

* **Parameters:**
    * None
* **Returns:**
    * (String) Name id of the slot in this Webble used for slot communication

```JavaScript
// Gets the name of the slot that is currently selected slot for slot communication
var selSlot = $scope.getSelectedSlot();
```
###_getSelectionState_ ![Method][meth]
Returns the webbles selection State, which informs if this webble is selected or not and if so, how and for what purpose.
The available different states can be viewed [here](#availableOnePicks_SelectTypes)

####getSelectionState()

* **Parameters:**
    * None
* **Returns:**
    * Enum Value (Integer) Represents which type of selection the Webble is currently under

```JavaScript
// Checks if the Webble is fully main selected, and if so displays info about it in the console
if ( $scope.getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked ){
	$log.log("This Webble is Fully Selected with green border and interaction balls");
}
```
###_getSlot_ ![Method][meth]
Returns a slot (complete 'class' instance) specified by its id name.

####getSlot(whatSlotName)

* **Parameters:**
    * whatSlotName (String)
* **Returns:**
    * (Slot Object) to access all different layers of the Slots metadata etc.

```JavaScript
// Gets a specific Slot "MySlot" and displays its description in the console
$log.log( $scope.getSlot("MySlot").getDisplayDescription() );
```
###_getSlots_ ![Method][meth]
Returns the complete object-list of slots.

####getSlots()

* **Parameters:**
    * None
* **Returns:**
    * (JSON) For iterating over all slots to access all keys (slot id) 

```JavaScript
// Iterates the complete slot list and prints the slot key (slot name) in the console description in the console
for(var slot in $scope.getSlots()){
	$log.log( slot );
}
```
###_getSlotConnDir_ ![Method][meth]
Returns the slot connection direction object which informs if SEND and RECEIVE are enabled or not.
The object returned informs of what communication directions are currently enabled.

####getSlotConnDir()

* **Parameters:**
    * None
* **Returns:**
    * (Object) Boolean value for each object key representing enabled or not
        * `{send: false, receive: false}`

```JavaScript
// Checks if this Webble is sending slot values and print to the console if it is.
if( $scope.getSlotConnDir().send ){
	$log.log("This Webble is sending slot data")
};
```
###_getWblVisibilty_ ![Method][meth]
Tells us if the Webble are visible or not (true or false).

####getWblVisibilty()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False if the Webble is visible or not

```JavaScript
// Prints to the concole the webbles visibility state
$log.log( $scope.getWblVisibilty() );
```
###_getWebbleConfig_ ![Method][meth]
Returns a bitflag that holds some of the few Webble states available. Which states can be seen [here](#bitFlags_WebbleConfigs).

####getWebbleConfig()

* **Parameters:**
    * None
* **Returns:**
    * (Integer (Binary)) A bit flag value that contains some states a Webble can be in (Mainly _Moving_)

```JavaScript
// checks if the Webble is not moving, and if so, informs about it in the console
if((parseInt($scope.getWebbleConfig(), 10) & parseInt(Enum.bitFlags_WebbleConfigs.IsMoving, 10)) == 0){
	$log.log( "The Webble is not Moving" );
}
```
###_getWebbleFullName()_ ![Method][meth]
Get Webble Full Name, returns this webbles user defined display name together with its instance id and its template id. Mainly used for display purposes.

####getWebbleFullName

* **Parameters:**
    * None
* **Returns:**
    * (String) A composition of Display Name, Instance Id and Template Id for the Webble

```JavaScript
// Display the full name of the Webble in the console
var wblFullName = $scope.getWebbleFullName();
$log.log(wblFullName);
```
###_gimme_ ![Method][meth]
Returns the value of a slot found by slot name provided as parameter. if no slot by the specified name is found undefined is returned. The Value can be of any type, including string, number, array, object or even NULL etc.

####gimme(slotName)

* **Parameters:**
    * slotName (String)
* **Returns:**
    * (Various) The Value of the slot instance
        * `undefined` if no slot of provided name exists

```JavaScript
// Displays the slot value for "MySlot" in the console window
$log.log( $scope.gimme("MySlot") );
```
###_isPopupMenuItemDisabled_ ![Method][meth]
Returns true if the Webble's popup menu item identified by ItemId (string) is disabled, otherwise false. Available default menu items can be viewed [here](#defMenuItems):

####isPopupMenuItemDisabled(whatItem)

* **Parameters:**
    * whatItem (String) The name id of the menu item wished to be informed about
* **Returns:**
    * (Boolean) True of False depending on if it is disabled or not

```JavaScript
// check if "BringFwd" menu item is disabled and if it is enable it
if( $scope.isPopupMenuItemDisabled("BringFwd") ){
	$scope.removePopupMenuItemDisabled("BringFwd");
}
```
###_paste_ ![Method][meth]
Paste connects the webble to a parent-webble provided as a parameter. If provioded parent is already related method will fail, since circular relationships are not allowed.

####paste(parent)

* **Parameters:**
    * parent (Webble Pointer)
        * candidate for being a parent to the Webble
* **Returns:**
    * (Boolean) True of False depending on success of creating relationship

```JavaScript
// Paste a webble to another Webble and create a parent child relationship
$scope.paste(otherWbl);
```
###_peel_ ![Method][meth]
Peel removes the parent for the Webble and make it an orphan again

####peel()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True of False depending on success of breaking relationship

```JavaScript
// disconnect from current parent webble
$scope.peel();
```
###_registerOnlineDataListener_ ![Method][meth]
Registers Online Data Listene and lets the webble join a uniquely identified online data broadcasting virtual room for sending and receiving messages via the server online to other users. One must provide a unique id for the message area, an event handler method that receives all incoming messages for that room and optional if one wish to exclude sending messages to oneself (current user) in the message dispatching.
The callback eventHandler for incoming messages provided when registering (above) will be sent the incoming data as the first parameter and the sending user as the second (Se code example below). 

####registerOnlineDataListener(msgRoomId, eventHandler, excludeSelf)

* **Parameters:**
    * msgRoomId (String) A unique name of the virtual online communication room
	* eventHandler (Function) Event listener that will recieve all incoming messages
	* excludeSelf (Boolean) True or False if messages sent by self (current user (not Webble)) should also be recieved or ignored
* **Returns:**
    * Nothing

```JavaScript
// Register a online message room by the id "MyRoom" and a event listener function that will take care of any incoming message
$scope.registerOnlineDataListener("MyRoom", function(data, username) {
	$log.log("data sent by: " + username);
	$log.log("data collected by webble: " + $scope.getInstanceId());
	$log.log("data text: " + data);
}, false);
```
<a name="registerWWEventListener"></a>    											
###_registerWWEventListener_ ![Method][meth]
Registers an event listener for a specific event (see [availableWWEvents](#availableWWEvents)) for a specific target (self, other or all) (targetData can be set for slotChange as a slotName or an array of slotnames to narrow down event further but not used for other events) and the callback function the webble wish to be called if the event fires. The callback function will then be handed a datapack object containing needed information to react to the event accordingly. All callback functions are sent a datapack object as a parameter when they fire which includes different things depending on the event. The targetId post in these datapacks are only useful when the webble are listening to multiple webbles with the same callback. If targetId is undefined the webble will be listening to itself, or if the targetId match an existing Webble then that will be listened to, and if the targetId is set to NULL it will listen to all webbles.

**Returning Data for each event type**

* **slotChanged**: {targetId: [Instance Id for webble getting slot changed], slotName: [Slot Name], slotValue: [Slot Value], timestamp: [a chronological timestamp value]}
* **deleted:** {targetId: [Instance Id for webble being deleted], timestamp: [a chronical timestamp value]}
* **duplicated:** {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
* **sharedModelDuplicated:** {targetId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy], timestamp: [a chronological timestamp value]}
* **pasted:** {targetId: [Instance Id for webble being pasted], parentId: [Instance Id for Webble that is pasted upon], timestamp: [a chronological timestamp value]}
* **gotChild:** {targetId: [Instance Id for webble getting child], childId: [Instance Id for Webble that was pasted], timestamp: [a chronological timestamp value]}
* **peeled:** {targetId: [Instance Id for Webble leaving parent], parentId: [Instance Id for Webble that lost its child], timestamp: [when it happened as ms integer]}
* **lostChild:** {targetId: [Instance Id for Webble losing child], childId: [Instance Id for Webble that was peeled away], timestamp: [when it happened as ms integer]}
* **keyDown:** {targetId: null[=UNSPECIFIED], key: {code: [key code], name: [key name], released: [True When Key Released], timestamp: [a chronological timestamp value]}
* **loadingWbl:** {targetId: [Instance Id for webble that got loaded], timestamp: [a chronological timestamp value]}
* **mainMenuExecuted:** {targetId: null[=UNSPECIFIED], menuId: [menu sublink id], timestamp: [a chronological timestamp value]}
* **wblMenuExecuted:** {targetId: [Instance Id for the Webble executing menu], menuId: [menu item name], timestamp: [a chronological timestamp value]}

####registerWWEventListener(eventType, callbackFunc, targetId, targetData)

* **Parameters:**
    * eventType (Integer (Enum)) Which event that is of interest, selected by using the availableWWEvents Enum Service
	    * e.g. Enum.availableWWEvents.slotChanged
	* callbackFunc (Function) The function that will be called when the event fires and which will retrieve the event data.
	* targetId (Integer) Instance Id of the Webble whose event are being listened to.
	    * `undefined` is self
		* `null` is all
	* targetData (String or Array of Strings) Only used with slotChanged event and then is the name (or names) of the slot(s) being listened to.
* **Returns:**
    * (Function) A function that can be called (without any parameters) to stop and kill the event listener.

```JavaScript
// One simple example of adding a webble world event listener, in this case for slot-change, and in the callback function manage possible event-fire situations.
var slotChangeListener = $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	if(eventData.slotName == "msg"){
		if(eventData.slotValue == "go big"){
			$scope.set("square:width", 300);
			$scope.set("square:height", 300);
		}
		else if(eventData.slotValue == "go small"){
			$scope.set("square:width", 30);
			$scope.set("square:height", 30);
		}
		else if(eventData.slotValue == "stop"){
			// Kill event listener
			slotChangeListener()
		}
	}	
	else if(eventData.slotName == "squareTxt:font-size"){
		if(parseInt(eventData.slotValue) > 40){
			$log.log("Don't Scream!")
		}
	}
});
```
###_removePopupMenuItemDisabled_ ![Method][meth]
Enables (previously disabled) Webble's popup menu items identified by ItemId (string) and make it visible in the Webble context menu again. Available default menu items can be viewed [here](#defMenuItems):

####removePopupMenuItemDisabled(whatItem)

* **Parameters:**
    * whatItem (String) The name id of the menu item wished to be enabled
* **Returns:**
    * Nothing

```JavaScript
// Enables (Makes visible) previously disabled default menu item "BringFwd" so it can be interacted with again.
$scope.removePopupMenuItemDisabled("BringFwd");
```
###_removeSlot_ ![Method][meth]
Removes a slot found by name from the object-list of slots.

####removeSlot(whatSlotName)

* **Parameters:**
    * whatSlotName (String)
* **Returns:**
    * Nothing

```JavaScript
// Removes (Deletes) the slot "MySlot" from the Webble slot list
$scope.removeSlot("MySlot");
```
###_sendOnlineData_ ![Method][meth]
Lets the webble send data over the internet via the Webble server to any other webble and user online that is currently listening. It only works if the user has previously registered an online room as mentioned above. the webble must provide the room id to which the data is being sent and the the data, which can be basically anything, must still be json approved.

####sendOnlineData(whatRoom, whatData)

* **Parameters:**
    * whatRoom (String) The unique name id of the room to send the data to
	* whatData (String) Sent as a string but can be any stringified data, like an array or json object, that can be parsed back at arrival for better managing
* **Returns:**
    * Nothing
	
```JavaScript
// Sending an online message to "MyRoom" which will be broadcasted to all current user sessions that listens world wide
$scope.sendOnlineData("My Room", "How about a game of chess, professor Falken?");
```
###_set_ ![Method][meth]
This method sets a new value to the slot with the name and value sent as a parameters. If a value is of completely wrong type or nonsensical the set will be ignored and the old value will remain. The method also returns a bit Enum flag value to tell how the set process succeeded (`Enum.bitFlags_SlotManipulations`)

####set(slotName, slotValue)

* **Parameters:**
    * slotName (String)
    * slotValue (Any)
* **Returns:**
    * (Integer) Enum Value
        * 0: `NonExisting` (The slot did not exist)
        * 1: `Exists` (The slot exists but no value was changed)
        * 2: `ValueChanged` (The slot value was changed)

```JavaScript
// Set the slot "MySlot" to the string value of "Hello World"
$scope.set("MySlot", "Hello World");
```
###_setChildContainer_ ![Method][meth]
Default value for child container usually works fine, but for Webbles using clipping a need to place the children elsewhere in the internal Webble DOM might be useful. If one wishes to set it back to the default value one need to save away that before making any changes. If Set to `undefined` no child can be pasted.

####setChildContainer(newContainer)

* **Parameters:**
    * newContainer (JQuery Element)
        * DOM tree element within the Webble where children Webbles should be pasted
        * `undefined` blocks pasting 
* **Returns:**
    * Nothing

```JavaScript
// Set the JQuery elelment in the Webble that will hold the children webbles
$scope.setChildContainer(newContainer);
```
###_setDefaultSlot_ ![Method][meth]
Sets the current default slot for the Webble. If set to `undefined` no default slot connection is attempted.

####setDefaultSlot(newDefaultSlot)

* **Parameters:**
    * newDefaultSlot (String) Slot Id Name
        * Set to `undefined` for no default connection
* **Returns:**
    * Nothing

```JavaScript
// Sets the slot "msg" to be the default slot
$scope.setDefaultSlot("msg");
```
###_setProtection_ ![Method][meth]
Sets the Bit Flag value which holds information of which Protections are enabled or not.

####setProtection(protectionCode)

* **Parameters:**
    * protectionCode (Integer (Binary)) Bit flag value that indicates all protection states as enabled or not (1 or 0)
* **Returns:**
    * None

```JavaScript
// Turns on protection against Move and Duplicate in the current Protection Flag.
var thisWblProt = $scope.getProtection();
thisWblProt = bitflags.on(thisWblProt, Enum.bitFlags_WebbleProtection.MOVE);
thisWblProt = bitflags.on(thisWblProt, Enum.bitFlags_WebbleProtection.DUPLICATE);
$scope.setProtection(thisWblProt);
```
###_setResizeSlots_ ![Method][meth]
Sets (assigns) which slots that represents the width and height of the webble. If CSS slots for width and height are created the Webble will call this itself using the slots it found as an educated guess to be used, but the developer can at any time reassign with this method.

####setResizeSlots(widthSlotName, heightSlotName)

* **Parameters:**
    * widthSlotName (String) the name of the slot which holds the value of the webbles outer width
	* heightSlotName (String) the name of the slot which holds the value of the webbles outer height
* **Returns:**
    * Nothing

```JavaScript
// Assigns Size slots for the Webble by pointing at two existing slots to represent the main size.
$scope.setResizeSlots("wblMainWidth", "wblMainHeight");
```
###_setRotateSlot_ ![Method][meth]
Sets the name of the slot that holds the Webbles rotation value. Mainly used by interaction ball: Rotate

####setRotateSlot(rotateSlotName)

* **Parameters:**
    * rotateSlotName (String)
* **Returns:**
    * Nothing

```JavaScript
// Assigns the name of the rotate Webble slot in the console
$scope.setRotateSlot("myOwnRotateSlot");
```
###_setSelectionState_ ![Method][meth]
Sets the webbles selection State to a specific selection type and makes the Webble display it accordingly (turning on or off different colored borders etc.).
The available different states can be viewed [here](#availableOnePicks_SelectTypes)

####setSelectionState(newSelectionState)

* **Parameters:**
    * newSelectionState (Enum Value)
* **Returns:**
    * Nothing

```JavaScript
// Turns off any current selection state for the Webble
$scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
```
###_setWblVisibilty_ ![Method][meth]

####setWblVisibilty(newVal)

* **Parameters:**
  * newVal (Boolean) True or False if one wants the Webble to be visible or not 
* **Returns:**
  * Nothing

```JavaScript
// Makes the Webble invisible
$scope.setWblVisibilty(false);
```
###_setWebbleConfig_ ![Method][meth]
Sets a bitflag that holds some of the few external Webble states available. Which states that are included can be seen [here](#bitFlags_WebbleConfigs)

####setWebbleConfig(whatNewConfigState)

* **Parameters:**
    * whatNewConfigState (Integer (Binary)) the new config bit flag value for the Webble
* **Returns:**
    * Nothing

```JavaScript
// Sets the Webble to never display any Info bubble text when e.g. being selected
$scope.setWebbleConfig(bitflags.on($scope.getWebbleConfig(), Enum.bitFlags_WebbleConfigs.NoBubble));
```
###_sharedModelDuplicate_ ![Method][meth]
Shared Model Duplicate, duplicates itself at a specified offset position from the original and let the copy share the same model (all slots) and when done call the optional provided callback function with the new copy provided as a parameter.

####sharedModelDuplicate(whatOffset, whatCallbackMethod)

* **Parameters:**
	* whatOffset (Object) x and y position from the position of self where the copy should appear
        *  e.g. {x: 15, y: 15}
    * whatCallbackMethod (Function) To be called when the duplication is finished. Will be called with Duplicate Webble pointer as parameter.
        * OPTIONAL
* **Returns:**
    * (Boolean) True or False wheather the attempt to model duplicate succeeds or not

```JavaScript
// Creates a model duplicate of self 20 pixels to the right and 20 below with a provide callback function
$scope.sharedModelDuplicate({x: 20, y: 20}, function(newWbl){ $log.log( newWbl.scope().getInstanceId(); ) });
```
###_theInteractionObjects_ ![Property][prop]
Contains a list of [Interaction object](#io) pointers (colored balls around the Webble border which gives the user the power to interact with the webble more easy)

####theInteractionObjects

* **Get & Set:**
    * (Array) interaction object instance pointers for accessing their internals

```JavaScript
// Disables the Interaction Object with index value 6
$scope.theInteractionObjects[6].scope().setIsEnabled(false);
```
###_theView_  ![Property][prop]
The unique template element (JQuery) for a webble, in order to get access to the inner scope of self or another Webble mainly for performing Jquery operations.

####theView

* **Get & Set:**
    * (Webble Pointer) Pointer to the Webble Element
        * to access the View in the DOM and the Webble scope

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

####theWblMetadata["KEY"]

* **Get & Set:**
    * (Various) Value of the selected key

```JavaScript
// Get a Webble description text
var descriptionTxt = $scope.theWblMetadata['description'];
// Get a Webble old instance Id
var oldInstanceId = $scope.theWblMetadata['instancedeid'];
```
###_touchRescueFlags_ ![Property][prop]
A set of boolean flags for helping the devloper rescuing some (weird) touch event behaviors. Mainly used for reading.

####touchRescueFlags

* **Get & Set:**
    * (Object) A set of dedicated object keys containing boolean values that control some environment behavior.
	    * doubleTapTemporarelyDisabled: (Boolean) tells whether double tap behavior is blocked or not
		* interactionObjectActivated: (Boolean) tells whether Interaction Objects are active or disabled.
    };

```JavaScript
// Turns off double tap functionality and then turns it on again after one second
$scope.touchRescueFlags.doubleTapTemporarelyDisabled = true;
$timeout(function(){$scope.touchRescueFlags.doubleTapTemporarelyDisabled = false;}, 1000);
```
###_unregisterOnlineDataListener_ ![Method][meth]
Lets the webble leave a uniquely identified online data broadcasting virtual room used for sending and receiving messages at their own will. This is an optional method since the system will clean up by itself if the Webbles just dissapear without unregistering.

####unregisterOnlineDataListener(whatRoom)

* **Parameters:**
    * whatRoom (String) The unique name of the virtual online communication room
* **Returns:**
    * Nothing

```JavaScript
// Unregister listening to the broadcasting of online messages from the virtual room called "MyRoom"
$scope.unregisterOnlineDataListener("MyRoom");
```
###_additionalWblRequests.displayNameProp.setDisabledSetting_ ![Method][meth]
Since a Webbles display name is not an actual slot, but is displayed in the slot property form, there might be situations where one wishes to control this 'fake' slots Disabled settings. This method allows the user to set the disableSetting for the displayname property.

####additionalWblRequests.displayNameProp.setDisabledSetting(newDisabledSetting)

* **Parameters:**
    * newDisabledSetting (Integer (Enum)) the new disabled setting
* **Returns:**
    * Nothing

```JavaScript
// Reassign the disabled setting of the displayname property to not allowed for property form editing
$scope.additionalWblRequests.displayNameProp.setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);
```
###_additionalWblRequests.displayNameProp.getDisabledSetting_ ![Method][meth]
Since a Webbles display name is not an actual slot, but is displayed in the slot property form, there might be situations where one wishes to control this 'fake' slots Disabled settings. This method allows the user to get the current disableSetting for the displayname property.

####additionalWblRequests.displayNameProp.setDisabledSetting()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Retrieves the disabled setting of the displayname property
var whatCurrSetting = $scope.additionalWblRequests.displayNameProp.getDisabledSetting();
```
<!------------------------------------------------------------------------------------------------------------------->
##Platform
The **Platform** is the actual Webble World environment and it includes many helpful methods to access sections of the
system and specific Webbles. Also in this case it is reached from within the `$scope` of the Webble-template.

###_altKeyIsDown_ ![Property][prop]
Boolean Flag for the ALT key on the Keyboard, weather it is currently pressed or not. Can also be set for simulating key press within the platform.

####altKeyIsDown

* **Get & Set:**
    * (Boolean) True or False whether the key is down or not

```JavaScript
// Tells the console if the ALT key is pressed or not
$log.log("The ALT key is down: " + $scope.altKeyIsDown);
```
###_BlockAddUndo_ ![Method][meth]
If one have a long range of slot or Webble operation one does not want to be a part of the undo stack then set this to true just before starting the process and then later call the unblock method to return to normal mode again. Basically not used outside the core but available if ever reasons arise.
	
####BlockAddUndo()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// These slot changes can never be undone or redone individually only as a complete package due to the BlockAddUndo
$scope.BlockAddUndo();
$scope.set("msg", "You Love Me!");
$scope.set("root:left", 700);
$scope.set("root:top", 500);
$scope.set("root:transform-rotate", 45);
$scope.UnblockAddUndo();
```
###_BlockNextAddUndo_ ![Method][meth]
If a Webble wishes to perform a Webble operation or slot-set one does not want to be a part of the undo stack, then call this method (without any parameters) just after calling the slot set or operation call, and the wish will be granted. (also works the other way around if one wishes to make the platform forget about the previous operation before the new one, but then the method is called before any Webble operation).
	
####BlockNextAddUndo()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Will make the platform forget about the most recent latest slot change or webble operation and make it undoable.
$scope.BlockNextAddUndo();
```
###_cleanActiveWS_ ![Method][meth]
Clean Active Workspace, cleans out everything (every Webble) from the current selected workspace and resets the workspace.

####cleanActiveWS()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Clean out all webbles and reset the workspace
$scope.cleanActiveWS();
```
###_ctrlKeyIsDown_ ![Property][prop]
Boolean Flag for the CTRL key on the Keyboard, weather it is currently pressed or not. Can also be set for simulating key press within the platform.

####ctrlKeyIsDown

* **Get & Set:**
    * (Boolean) True or False whether the key is down or not

```JavaScript
// Tells the console if the CTRL key is pressed or not
$log.log("The CTRL key is down: " + $scope.ctrlKeyIsDown);
```
###_debugValue.txt_ ![Property][prop]
If one is debugging, and one wants to display a text in the menu section where "debug Logging On" is displayed, one can use this variable.

####debugValue.txt

* **Get & Set:**
    * (String) any optional text
	
```JavaScript
// Sets the debugValue.txt to the Webbles "MySlot" slot value
$scope.debugValue.txt = $scope.gimme("MySlot");
```
###_downloadWebbleDef_ ![Method][meth]
Downloads a webble identified by its unique name, either from server of from memory. The callbackmethod, if provided, will be called when the new Webble is loaded, providing a webble metadata package as a parameter which contains a Webble Pointer, an old instance id and the webble definition json. (Take note though, that it will be for the the most recent Webble loaded (if a compound set of many was requested) and not the compound Webble itself.
	
####downloadWebbleDef(whatWblDefId, whatCallbackMethod)

* **Parameters:**
    * whatWblDefId (String) A Unique Webble id that will identify which Webble is requested
	* whatCallbackMethod (Function) Callback function that will be called when the new Webble is finished loading, providing a webble metadata package as a parameter which contains a Webble Pointer to the morst recent Webble loaded (if a compound set was loaded), old instance id and the webble definition json.
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Loads a Webble from the internal Webble Server and when it arrives make it (or at least its latest template) say its name in the console
$scope.downloadWebbleDef("genericCharts", function(newWblDef){
	$log.log( newWblDef.wbl.scope().getWebbleFullName() + " has arrived!" );
});
```
###_executeMenuSelection_ ![Method][meth]
Executes the correct action, based on menu (or corresponding shortcut selection which can be examined in the Webble World 3 Platform). When calling this method it will have the same effect as if the user have clicked on the specified menu option in the top main menu.

#####Available menu sublink names

* **shortcutinfo:** Displays a form with some shortcut keys information
* **altf2:** Toggles Main menu visibility
* **altf3:** Toggles Debug logging
* **altf5:** Quick saves workspace
* **altf6:** Quick loads previously quick saved workspace
* **altf8:** Loads a Fundamental Webble
* **altf9:** Change current Platform language to English
* **altf10:** Opens up the platform language change form
* **altshiftpagedown:** Reset Webble World Intro to first time visitor mode
* **altshiftend:** Clear all Webble world cookies and local storage user data.
* **esc:** Cancel what is currently going on (e.g. Close form)
* **leftarrow:** Move current selected Webble to the left
* **rightarrow:** Move current selected Webble to the right
* **uparrow:** Move current selected Webble upwards
* **downarrow:** Move current selected Webble downwards
* **gestSwipeDown:** Shows top main menu (only on tablets)
* **gestSwipeUp:** Hides top main menu (only on tablets)
* **newws:** New Workspace (Clear away current)
* **openws:** Open Workspace (opens workspace selection form)
* **savews:** Saves current workspace (with current name if exists otherwise dipslays form for giving name)
* **savewsas:** Dipslays form for giving save name to workspace
* **sharews:** Share workspace opens form for selecting users to share with 
* **deletews:** Delete Current open Workspace (opens confirmation box)
* **browse:** Opens Webble browser
* **loadwbl:** Load Webble opens form for loading webble online or local
* **impwbl:** Import Webble opens form for selecting import file
* **pub:** Publish Webble opens the form for doing just that
* **expwbl:** Export Webble opens form for doing that
* **upload:**: Switch to the Webble Template Editor
* **undo:**: Undo the last Webble operation
* **redo:** Redo the last undone Webble operation
* **selectall:** Select all selects all Webbles in the workspace
* **deselectall:** Deselect all deselects all Webbles in the workspace
* **duplicate:** Duplicate creates a duplicate of all selected Webbles
* **sharedduplicate:** Shared Duplicate creates a shared duplicate of all selected Webbles
* **bundle:** Bundle creates a bundle of all selected Webbles
* **delete:** Delete, deletes all selected Webbles
* **wblprops:** Webble Props open the multi Webble slot change form
* **platformprops:** Opens the platform settings form
* **toggleconn:** Toggle Connection View toggles the connection view visualization
* **wsinfo:** Workspace information displays a form with active Webbles information
* **fullscrn:** Fullscreen toggles fullscreen mode
* **docs:** Opens up the Webble manual in a new browser tab
* **tutorials:** Opens a new browser tab for Webble YouTube tutorials
* **faq:** FAQ opens up the FAQ form
* **openchat:** Open Chat opens the chat form
* **support:** Support opens the user defined mail program for writing mail to Webble World Support team
* **community:** Opens a new browser tab for StackOverflow developers community page
* **devpack:** Developers Package download a zipfile with Webble template development files
* **git:**Opens a new browser tab for Webbel World GitHub page
* **bugreport:** Bug report opens the user defined mail program for writing mail to Webble World debug team
* **about:** About opens up the Webble world About information form
* **profile:** Switch to the user profile page
* **notif:** Switch to the user notification settings tab in the profile page
* **groups:** Switch to the user groups settings tab in the profile page
* **logout:** Logs out the current logged in user
	
####executeMenuSelection(sublink, whatKeys)

* **Parameters:**
    * sublink (String) the name of the submenu item wished to be executed
	* whatKeys (Object) object with object-keys that describe which keys have been pressed. 
	    * OPTIONAL
	    * default: {theAltKey: false, theShiftKey: false, theCtrlKey: false, theKey: ''}
		* `theKey` uses a readable key name value (not key code). Such name can be retrieved by [this](#fromKeyCode) service
* **Returns:**
    * (Boolean) True or false whether any action was executed or not

```JavaScript
// Select all Webbles and then duplicate them and finish by deselect them ($timeout is used to make sure one process finish before the next one starts (not always needed, but sometimes, for time critical operations))
$timeout(function(){
	$scope.executeMenuSelection("selectall");
	$timeout(function(){
		$scope.executeMenuSelection("duplicate");
		$timeout(function(){
			$scope.executeMenuSelection("deselectall");
		});
	});
});
```
###_getActiveWebbles_ ![Method][meth]
Returns a list (array) of all the current active webbles (in the active Workspace).

####getActiveWebbles()

* **Parameters:**
    * None
* **Returns:**
    * (Array) All Webbles (Webble Pointer) that is currently active (exists) in the current workspace

```JavaScript
// Iterate through all active Webbles and make them tell the console their full name
for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
	$log.log( aw.scope().getWebbleFullName() );
}
```
###_getAllAncestors_ ![Method][meth]
Returns a list (array) of all ancestors (parents and parents parents etc) of the defined webble. The list is ordered from the closest to the furthest away.

####getAllAncestors(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble whose information we are after
* **Returns:**
    * (Array) All Webbles (Webble Pointer) that is an ancestor of the parameter Webble

```JavaScript
// Iterate through all ancestor Webbles and make them tell the console their instance Id
for(var i = 0, anc; anc = $scope.getAllAncestors($scope.theView)[i]; i++){
	$log.log(i + ": " + anc.scope().getInstanceId());
}
```
###_getAllDescendants_ ![Method][meth]
Returns all webbles of those that are children or grandchildren etc of the webble specified in the parameter, which is also included at the top of the list.
	
####getAllDescendants(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble whose information we are after
* **Returns:**
    * (Array) All Webbles (Webble Pointer) that is a descendant of the parameter Webble (including self)

```JavaScript
// Iterate through all descendants (and self) and give each its own colored border (as long as the palette is big enough)
for(var n = 0, d; d = $scope.getAllDescendants($scope.theView)[n]; n++){
	d.scope().activateBorder(true, wwConsts.palette[n].name, 4, "dashed", true);
}
```
###_getBundleMaster_ ![Method][meth]
Returns the bundle master of the specified Webble if it has one, otherwise undefined. Bundle master is the outermost bundle webble, counted from a specific Webble.

####getBundleMaster(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble whose possible Bundle master we are after
* **Returns:**
    * (Webble Pointer) The Bundle Master for the specified Webble if found, otherwise `undefined`
	    * May be self

```JavaScript
// Check if one is bundled and if so, tell it to the console
if( $scope.getBundleMaster($scope.theView) ){
	$log.log("I am bundled!");
}
```
###_getCurrentExecutionMode_ ![Method][meth]
Gets the current active execution mode level (developer, admin, etc which can be studied in detail [here](#availableOnePicks_ExecutionModes)). Execution mode is a way to control behavior and flow in a Webble depending on user type.

####getCurrentExecutionMode()

* **Parameters:**
    * None
* **Returns:**
    * (Integer (Enum)) the current execution mode value as found [here](#availableOnePicks_ExecutionModes)

```JavaScript
// Checks if the execution mode is Admin, and if so prints to the console
if( $scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Admin){
	$log.log("You are in Admin Mode");
}
```
###_getCurrentLanguage_ ![Method][meth]
Returns the current language (language code) being used by the Webble World Platform.

####getCurrentLanguage()

* **Parameters:**
    * None
* **Returns:**
    * (String) the language code for the Webble World platform
	    * e.g. "en-us"

```JavaScript
// Writes the platform language code to the console
$log.log($scope.getCurrentLanguage());
```
###_getCurrentPlatformPotential_ ![Method][meth]
Returns the current Platform potential state, which tells us if the system is running at full sped or not, or being blocked and protected agains full use in some way. (See [Enum](#enum) and [availablePlatformPotentials](#availablePlatformPotentials) for more details about various potential states).

####getCurrentPlatformPotential()

* **Parameters:**
    * None
* **Returns:**
    * (Integer(Enum)) The numerical representative for the current state of the platform potential mode

```JavaScript
// Warn the user running Webble world in any limited mode that this Webble does not accept that
if ( $scope.getCurrentPlatformPotential() != Enum.availablePlatformPotentials.Full ) { 
	showQIM("This Webble only work properly in Full platform state."); 
}
```
###_getCurrWS_ ![Method][meth]
Returns the current active workspace object. Rarely, close too never, used outside the Webble core, but if ever needed, here it is.
Contains id, name, webbles, if its shared and more.

####getCurrWS()

* **Parameters:**
    * None
* **Returns:**
    * (Object) Json object that holds all available data about the workspace, including all attached Webbles and any current metadata

```JavaScript
// Prints the name of the current workspace to the console
$log.log( $scope.getCurrWS().name );
```
###_getIsFormOpen_ ![Method][meth]
Informs if there is a Webble World form currently open or not

####getIsFormOpen()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether a webble world form is open or not

```JavaScript
// Tells the console if there is any form open or not
$log.log("A form is currently open: " + $scope.getIsFormOpen());
```
###_getPendingChild_ ![Method][meth]
Returns the future child waiting to be assigned a parent. Usually only used by the core, but it is there if ever needed.

####getPendingChild()

* **Parameters:**
    * None
* **Returns:**
    * (Webble Pointer) the Webble which is pending as a child waiting for a being assigned a parent.
	    * `undefined` when no Webble is pending

```JavaScript
// If there is a pending child then print its instance id in the console
if( $scope.getPendingChild() ){
	$log.log( $scope.getPendingChild().scope().getInstanceId );
}
```
###_getPlatformBkgColor_ ![Method][meth]
Quick way to retrieve the current background color of the platform. 

####getPlatformBkgColor()

* **Parameters:**
    * None
* **Returns:**
    * (String) the current background color of the platform workspace

```JavaScript
// Tells the console which color the platform currently use
$log.log($scope.getPlatformBkgColor());
```
###_getPlatformCurrentStates_ ![Method][meth]
Gets a bit flag holder that contains various states this platform has to pay attention too. Very unlikely needed by a Webble developer, but it is still there if that would be the case. See [Services](#services) and [bitFlags_PlatformStates](#bitFlags_PlatformStates) for more details.

####getPlatformCurrentStates()

* **Parameters:**
    * None
* **Returns:**
    * (Integer(Binary)) Platform state value (often related to various _busy_ states)

```JavaScript
// Checks if platform is currently waiting for parent selection, and if so tella bout it in the console
if((parseInt(scope.getPlatformCurrentStates(), 10) & parseInt(Enum.bitFlags_PlatformStates.WaitingForParent, 10)) !== 0){
	$log.log("You are supposed to pick a parent webble now.")
}
```
###_getPlatformElement_ ![Method][meth]
Returns the jquery element of this platform. (Most often used for mouse event handling outside of the scope of the Webble)
####getPlatformElement()

* **Parameters:**
    * None
* **Returns:**
    * (Jquery Element Pointer) The Platform (work surface) of Webble World as a Jquery Element

```JavaScript
// Turns off the default mouse event for a part of the Webble and create a custom mouse down event for the Webble that in turn will create a mouse up and mouse move event for the whole platform in order to not loose scope outside the webbles element boundaries
$scope.theView.parent().draggable('option', 'cancel', '#myWblElement');
$scope.theView.parent().find("#myWblElement").bind('vmousedown', mouseDownEventHandler);
var mouseDownEventHandler = function (e) {
	$log.log("Mouse is Down");

	$scope.getPlatformElement().bind('mouseup', function(e){
		$scope.getPlatformElement().unbind('mousemove');
		$scope.getPlatformElement().unbind('mouseup');
		$log.log("Mouse is Up");
	});
	
	$scope.getPlatformElement().bind('mousemove', function(e){
		$log.log("Mouse is Moving");
	});
};
```
###_getPlatformSettingsFlags_ ![Method][meth]
Returns a bit flag value that holds various settings which controls user enabled platform environment values. See [Services](#services) and [bitFlags_PlatformConfigs](#bitFlags_PlatformConfigs) for more details.

####getPlatformSettingsFlags()

* **Parameters:**
    * None
* **Returns:**
    * (Integer(Binary)) Platform configuration settings value (often user related)

```JavaScript
// Checks if the main menu is visible, and if not tells about it via the console
if((parseInt($scope.getPlatformSettingsFlags(), 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) != 0){
	$log.log("The main menu is hidden");
}
```
###_getSelectedWebbles_ ![Method][meth]
Returns a list (array) of all webbles which are "Main" selected.

####getSelectedWebbles()

* **Parameters:**
    * None
* **Returns:**
    * (Array) All Webbles (Webble Pointer) that is currently "Main"-selected

```JavaScript
// Iterate through all "Main"-selected Webbles and make them turn 45 degrees
for(var i = 0, aw; aw = $scope.getSelectedWebbles()[i]; i++){
	aw.scope().set("root:transform-rotate", 45);
}
```
###_getSysLanguage_ ![Method][meth]
Returns the default language (language code) of the browser.

####getSysLanguage()

* **Parameters:**
    * None
* **Returns:**
    * (String) the language code for the browser
	    * e.g. "en-us"

```JavaScript
// Writes the system language code to the console
$log.log($scope.getSysLanguage());
```
###_getTopParent_ ![Method][meth]
Returns the top parent for a specific Webble. If no top parent exist the webble itself is returned (since it is obviously the top). (Top Parent is the parent in a chain of related Webbles that has no parent of its own)
	
####getTopParent(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble who we are after
* **Returns:**
    * (Webble Pointer) the Webble that is top parent

```JavaScript
// activate a purple double glowing border for the top parent webble, which ever it is.
topParent = $scope.getTopParent($scope.theView);
topParent.scope().activateBorder(true, "purple", 4, "double", true);
```
###_getWblAbsPosInPixels_ ![Method][meth]
Returns the calculated absolute position in pixels for the specified webbles within the work surface.

####getWblAbsPosInPixels(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble whose absolute position we are after
* **Returns:**
    * (Object) Position object with an x and y key (Webbles top left)
	    * e.g. {x: 0, y: 0}

```JavaScript
// Make the Webble tell the console its absolute position on the workspace (and not its relative position to its parent)
var absPos = $scope.getWblAbsPosInPixels($scope.theView);
$log.log("I am located at left: " + absPos.x + " and top: " + absPos.y);
```
###_getWebbleCenterPos_ ![Method][meth]
Returns the calculated absolute center position for the specified webble within the work surface.

####getWebbleCenterPos(whatWebble)

* **Parameters:**
    * whatWebble (Webble Pointer) The Webble whose center we are after
* **Returns:**
    * (Object) Center Position object with an x and y key
	    * e.g. {x: 0, y: 0}

```JavaScript
// Make the Webble tell the console its absolute center position on the workspace
var absCenterPos = $scope.getWebbleCenterPos($scope.theView);
$log.log("My Center is located at left: " + absCenterPos.x + " and top: " + absCenterPos.y);
```
###_getWebblesByDisplayName_ ![Method][meth]
Returns a list of Webbles (of all active Webbles) with a certain display name.

####getWebblesByDisplayName(whatWebbleDisplayName)

* **Parameters:**
    * whatWebbleDisplayName (String) the display name used to search for active Webbles
* **Returns:**
    * (Array) a list of all Webbles that have the spcified display name

```JavaScript
// Get all Webbles that has the display name "Fundamental Webble" and write their instance id to the console
for(var i = 0, aw; aw = $scope.getWebblesByDisplayName("Fundamental Webble")[i]; i++){
	$log.log(aw.scope().getInstanceId());
}
```
###_getWebbleByInstanceId_ ![Method][meth]
Return the unique Webble (of all active Webbles) with a specific instance id.

####getWebbleByInstanceId(whatInstanceId)

* **Parameters:**
    * whatInstanceId (Integer) the instance id of the active Webble being searched for
* **Returns:**
    * (Webble Pointer) the Webble that have the spcified instance id

```JavaScript
// Get the Webble that has instance id 2, and if it exists write its template id to the console
var theWbl = $scope.getWebbleByInstanceId(2);
if(theWbl){
	$log.log(theWbl.scope().theWblMetadata['templateid']);
}
```
###_getWebblesByTemplateId_ ![Method][meth]
Returns a list of Webbles (of all active Webbles) with a specific template id.

####getWebblesByTemplateId(whatTemplateid)

* **Parameters:**
    * whatTemplateid (String) the template id used to search for active Webbles
* **Returns:**
    * (Array) a list of all Webbles that have the specified template id

```JavaScript
// Get all Webbles that is of template identified as "fundamental" and write their instance id to the console
for(var i = 0, aw; aw = $scope.getWebblesByTemplateId("fundamental")[i]; i++){
	$log.log(aw.scope().getInstanceId());
}
```
###_getWinningSlotValueAmongAllWebbles_ ![Method][meth]
Looks for either the highest or the lowest value from all existing Webbles of a specified slot and return that value and the Webble who had it. Any slot value type can be compared, but numbers are probably the only thing that works well. (Slots with numbers and text like "25px" works fine too since they get parsed). If numbers are equal, the first value found will be winning.

####getWinningSlotValueAmongAllWebbles()

* **Parameters:**
    * whatSlot (String) the name of the slot which will be compared
	* lowestWins (Boolean) if true, the lowest value will be searched for (instead of the highest)
* **Returns:**
    * (Object) an object with two keys for value (Float) and value owner's Instance Id (Integer)
	    * eg. `{value: 0, owner: undefined}` before comparison starts 

```JavaScript
// Find the Webble that has the highest z-index value and display it in the console
var mostHighZ = $scope.getWinningSlotValueAmongAllWebbles('root:z-index', false);
$log.log( "Webble " + mostHighZ.owner + " has the highest Z-index value of " + mostHighZ.value );
```
###_getWSE_ ![Method][meth]
Returns the DOM element (not the jquery element) of the current selected work surface. (This is where top parent webbles are glued onto in the DOM). Most likely never needed by the Webble developer.

####getWSE()

* **Parameters:**
    * None
* **Returns:**
    * (DOM Element Pointer) Work Space Element in the DOM tree where all Webbles resides

```JavaScript
//  Adds a image of a cute kitten on the work space surface (Which most likely annoy the hell out of most Webble World users and make them avoid your Webbles again :-) )
var cuteKittenImgUrl = "https://lh3.ggpht.com/4kCi1_H566RFQrBcNYk5hKyA0TzlaxANZww2Kgf7Wp0dXmXyEQNw1ETG96OgG72oag=h900";
var cuteKittenImg = $('<img id="cuteKitten">');
cuteKittenImg.attr('src', cuteKittenImgUrl);
$scope.getWSE().append(cuteKittenImg);
```
###_isSystemDoneLoadingWebbles_ ![Method][meth]
Returns true or false whether the system is done loading Webbles or not. False if it is still busy loading Webbles and True if it is done and finished and went back to idling.
	
####isSystemDoneLoadingWebbles()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether the system is done loading Webbles or not

```JavaScript
// Checks if the system is done loading webbles and if so tells the console about it.
if($scope.isSystemDoneLoadingWebbles()){
	$log.log( "The system is done loading Webbles for now" );
};
```
###_loadWblFromURL_ ![Method][meth]
Tries to load a Webble JSON file from a URL provided as a parameter. The callbackmethod if provided will be called when the new Webble is loaded, providing a webble metadata package as a parameter which contains a Webble Pointer, an old instance id and the webble definition json. (Take note though, that it will be for the the most recent Webble loaded (if a compound set of many was requested) and not the compound Webble itself.
	
####loadWblFromURL(whatUrl, whatCallbackMethod)

* **Parameters:**
    * whatUrl (String) a URL string to where a Webble JSON config file is located
	* whatCallbackMethod (Function) Callback function that will be called when the new Webble is finished loading, providing a webble metadata package as a parameter which contains a Webble Pointer to the morst recent Webble loaded (if a compound set was loaded), old instance id and the webble definition json.
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Loads a Webble from an external server and when it arrives make it (or at least its latest template) say its name in the console
$scope.loadWblFromURL("https://www.myServer.com/myWebbles/bestWblEver.json", function(newWbl){
	$log.log( newWbl.scope().getWebbleFullName() + " has arrived!" );
});
```
<a name="_loadWebbleFromDef_"></a>
###_loadWebbleFromDef_ ![Method][meth]
Loads a webble from a JSON definition provided as a parameter. The callbackmethod if provided will be called when the new Webble is loaded, providing a webble metadata package as a parameter which contains a Webble Pointer, an old instance id and the webble definition json. (Take note though, that it will be for the the most recent Webble loaded (if a compound set of many was requested) and not the compound Webble itself.
	
####loadWebbleFromDef(whatWblDef, whatCallbackMethod)

* **Parameters:**
    * whatWblDef (JSON Object) The Webble definition config object
	* whatCallbackMethod (Function) Callback function that will be called when the new Webble is finished loading, providing a webble metadata package as a parameter which contains a Webble Pointer to the morst recent Webble loaded (if a compound set was loaded), old instance id and the webble definition json.
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Odd way of loading an exact copy of oneself
$scope.loadWebbleFromDef($scope.createWblDef(true));
```
###_openForm_ ![Method][meth]
Open Form creates and opens a modal form window for a specific use that can be used to edit or consume any data. For more details of available forms see Services [aopForms](#aopForms). Most predefined forms requires very specific configured content to siplay properly and is not really meant to be used from within Webble code, but if ever needed the possibility exists.
For Custom simple message popups please use `Enum.aopForms.infoMsg` form with a content parameter config as such:  
`{title: 'title text', content: 'body text'}`. (Content can also contain html and css).  
The Webble-template builder can provide his own form html, controller and style class and call this method with an empty name and include whats needed in the content parameter configured as such:  
Array [{templateUrl: "absolute or relative path to form html file", controller: "Name of the controller method", size: "'lg' for large, 'sm' for small or blank '' for normal"}, "Form Content in any form and type (string, array, object etc)"].  
Callback function is used for catching form response data (not available in infoMsg)
	
####openForm(whatForm, content, callbackFunc)

* **Parameters:**
    * whatForm (Integer(Enum)) see [aopForms](#aopForms) in servcies for available forms
	    * Value not recognized by aopForms will assumme a custom form request
	* content (Object) an object with different keys or value depending on which form is called for 
	* callbackFunc (Function) after the form is closed this function will be called, and depending on which form that was used the provided data object will contain different keys and values
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Opens a pre configured aopForm for Webble browser and Webble search
$scope.openForm(Enum.aopForms.wblSearch, $scope, null);

// Opens simple info message form
$scope.openForm(Enum.aopForms.infoMsg, {title: 'Welcome to My Webble', content:
	"<p>This Webble is the best and greatest Webble ever made " +
	"since dawn of time and it will make America great again.</p>"}
);

// Opens a custom form using custom html and javascript, found in the Webble template (see source code cooments for detailed usage)
$scope.openForm('MyCustomForm', [{templateUrl: 'my-custom-form.html', controller: 'MyCustomForm_Ctrl', size: 'lg', backdrop: 'static'}, {formInputData1: $scope.gimme("mySlot"), formInputData2: $scope.gimme("myOtherSlot")}], function(returnContent){
	$log.log(returnContent);
});
```
###_requestAssignParent_ ![Method][meth]
Request Assign Parent, deals with the interaction process of creating a child-parent relationship due to user interaction. The target parameter is the child if no child is pending, and it is the parent if there is a pending child. This method is usually NEVER called from outside the platform, instead. for forcing parent-child relationship, one usually calls the Webble Core's `paste()` method instead.
	
####requestAssignParent(target)

* **Parameters:**
    * target (Webble Pointer) the Webble that is being assigned child or parent status
* **Returns:**
    * Nothing

```JavaScript
// Initiate a parent-child relationship creation where the user is supposed to click on possible parent for the Webble already assigned as child
$scope.requestAssignParent($scope.theView);
```
###_requestDeleteWebble_ ![Method][meth]
Deletes a specified webble from the system. (the last (optional) parameter is a function that will be called when the job is done)

####requestDeleteWebble(target, callbackFunc)

* **Parameters:**
    * target (Webble Pointer) the Webble that is targeted for the operation
	* callbackFunc (Function) Callback function that will be called when the Webble has been deleted
	    * OPTIONAL
	* noWaitIndicator (Boolean) If True no waiting indicator will be shown while deleting the Webble in question.
	    * OPTIONAL
* **Returns:**
    * (Boolean) True or False whether the attempt to delete was successful or not

```JavaScript
// Murder the Webbles first-born child if there are any children
if($scope.getChildren().length > 0){
	$scope.requestDeleteWebble($scope.getChildren()[0], function(){
		$log.log("Ah! Finally you are dead you parasite!");
	});
}
```
###_requestExportWebble_ ![Method][meth]
Opens the Export Webble input form for the user to exports a specified Webble and all its needed templates (incl code files) to a webble code package file which can be imported to any other Webble World platform.

####requestExportWebble(whatWbl)

* **Parameters:**
    * whatWbl (Webble Pointer) the Webble that is targeted for the operation
* **Returns:**
    * Nothing

```JavaScript
// Opens up the export form for this Webble
$scope.requestExportWebble($scope.theView);
```
###_requestPublishWebble_ ![Method][meth]
Prepare for Webble publishing and opens up a user input form where the user needs to fill in required data before the Webble can be published to a specified place somewhere (server or local).
	
####requestPublishWebble(whatWbl)

* **Parameters:**
    * whatWbl (Webble Pointer) the Webble that is targeted for the operation
* **Returns:**
    * Nothing

```JavaScript
// Opens up the publish form for this Webble
$scope.requestPublishWebble($scope.theView);
```
###_requestWebbleSelection_ ![Method][meth]
Method that selects (activate border and Interaction Balls) the Webble provided as parameter as Main-selected and all its children as and Child-selected.

####requestWebbleSelection(target)

* **Parameters:**
    * target (Webble Pointer) the Webble that is targeted for the operation
* **Returns:**
    * Nothing

```JavaScript
// Select this Webble and its children
$scope.requestWebbleSelection($scope.theView);
```
###_resetSelections_ ![Method][meth]
Reset Selections, resets the work surface by removing all Webble selections and undo any half finished connections.

####resetSelections()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Resets all selections and remove any pending parent child relationship creation.
$scope.resetSelections();
```
###_selectAllWebbles_ ![Method][meth]
Makes all Webbles "Main" selected (With green solid border and visible Interaction objects).

####selectAllWebbles()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Selects alla Webbles
$scope.selectAllWebbles();
```
###_setExecutionMode_ ![Method][meth]
Sets the current active execution mode level (developer, admin, etc which can be studied in detail [here](#availableOnePicks_ExecutionModes)). Execution mode is a way to control behavior and flow in a Webble depending on user type.

####setExecutionMode(whatExecutionModeIndex)

* **Parameters:**
    * whatExecutionModeIndex (Integer (Enum)) the index number for the execution mode wished to be assigned
* **Returns:**
    * Nothing

```JavaScript
// Setting (force) the Webble World Execution Mode to be in Admin mode
$scope.setExecutionMode(Enum.availableOnePicks_ExecutionModes.Admin);
```
###_setPendingChild_ ![Method][meth]
Sets the future child waiting to be assigned a parent. Usually only used by the core, but it is there if ever needed.

####setPendingChild(newPC)

* **Parameters:**
    * newPC (Webble Pointer) the webble which will be assigned to wait for a parent selection (by user mouse click)
* **Returns:**
    * Nothing

```JavaScript
// Iterate through all active Webbles and assign the first valid one as parent to this Webble
for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
	if (aw.scope() && aw.scope().getInstanceId() != $scope.getInstanceId()){
		$scope.setPendingChild($scope.theView);
		$scope.requestAssignParent(aw);
		break;
	}
}
```
###setTextSelectionMode ![Method][meth]
This method make sets the current dragging vs text selection mode in a text element in a Webble.

####setTextSelectionMode(txtSelEnabled, wbl, txtElemId)

* **Parameters:**
    * txtSelEnabled (Boolean) True of False if text is selectable or not (if text can be selected it cannot drag the Webble anymore)
	* wbl (Webble Pointer) The Webble View that one wish to affect
	* txtElemId (String) The Element ID of the text element one wish to affect
* **Returns:**
    * Nothing

```JavaScript
// Enables text selection on a specific text element in a specific Webble
$scope.setTextSelectionMode(true, $scope.theView, "#squareTxt");
```
###_setPlatformBkgColor_ ![Method][meth]
Quick way to set the current background color of the platform. This setting only lasts before next change or end of the user session. It will not affect the users default background color in future sessions.

####setPlatformBkgColor(newPlatformBkgColor)

* **Parameters:**
    * newPlatformBkgColor (Color String) Hexadecimal value "#000000", color name "black", rgb or rgba value (rgb(0, 0, 0)) are allowed
* **Returns:**
    * Nothing

```JavaScript
// Sets the workspace platform background to purple
$scope.setPlatformBkgColor("purple");
```
###_setPlatformCurrentStates_ ![Method][meth]
Sets a bit flag holder that contains various states this platform has to pay attention too. Very unlikely needed by a Webble developer, but it is still there if so. See [Services](#services) and [bitFlags_PlatformStates](#bitFlags_PlatformStates) for more details.

####setPlatformCurrentStates(newPCS)

* **Parameters:**
    * newPCS (Integer(Binary)) a bit flag integer for platform busy state
* **Returns:**
    * Nothing

```JavaScript
// Stop any possible current parent selection process and resets the Webble selection
$scope.setPendingChild(undefined);
$scope.setPlatformCurrentStates(bitflags.off($scope.getPlatformCurrentStates(), Enum.bitFlags_PlatformStates.WaitingForParent));
$scope.unselectAllWebbles();
```
###_setWaitingServiceDeactivationState_ ![Method][meth]
Allows you to turn off (or on) the displaying of all and every waiting graphics for Webble World

####setWaitingServiceDeactivationState(newState)

* **Parameters:**
    * newState (Boolean) True or False for OFF or ON of showing waiting graphics
* **Returns:**
    * Nothing

```JavaScript
// Makes sure no "work in progress" graphics are displayed from here on now
$scope.setWaitingServiceDeactivationState(true);
```
###_shiftKeyIsDown_ ![Property][prop]
Boolean Flag for the SHIFT key on the Keyboard, weather it is currently pressed or not. Can also be set for simulating key press within the platform.

####shiftKeyIsDown

* **Get & Set:**
    * (Boolean) True or False whether the key is down or not

```JavaScript
// Tells the console if the SHIFT key is pressed or not
$log.log("The SHIFT key is down: " + $scope.shiftKeyIsDown);
```
###_showQIM_ ![Method][meth]
Shows the Quick Info Message box with the specified text for either 2.5 seconds or the specified time of either default size or the specified size at either the center of the screen or the specified position using either default color or the specified color (which can be an array of colors for gradient effect). If qimDominance is set to true, any other QIM messages will be discarded while the dominant one is still displayed. If one call the function with empty text and time set to 0, the current QIM message (if any) will immediately close down.
	
####showQIM(qimText, qimTime, qimSize, qimPos, qimColor, qimDominance)

* **Parameters:**
    * qimText (String) The text being displaid
	    * If Empty (and qimTime = 0) will close the Quick Info Message Box
	* qimTime (Integer) the number of milliseconds the Quick Info Message Box will be displayed
	    * OPTIONAL
		* Default: 2500 ms
	* qimSize (Object(Vector)) an object with _w_ and _h_ as keys (value in pixels)
	    * e.g. {w: 100, h: 100}
		* OPTIONAL
		* Default: {w: 250, h: 100} 
	* qimPos (Object(Vector)) an object with _x_ and _y_ as keys (value in pixels)
	    * e.g. {x: 100, y: 100}
		* OPTIONAL
		* Default: Centered in browser window
	* qimColor (Color String OR Array(of Color Strings)) Hexadecimal color value "#000000", color name "black", rgb or rgba value (rgb(0, 0, 0)) are allowed. If an array is used then a color gradience will be created.
    	* OPTIONAL
        * default: Gradient light yellow / Khaki
	* qimDominance (Boolean) By default any current Quick Info Message Box is replaced if a new one is called, but if this parameter is set to true, then any further calls of this method will be ignored (not qued)
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Displays a Quick Info Message Box with custom settings
$scope.showQIM("You are Awsome!", 3000, {w: 400, h: 200}, undefined, ["red", "orange", "yellow"]);
```
###_strFormatFltr_ ![Method][meth]
Fast access to filter that lets you write dynamic string outputs in an efficient way.

####strFormatFltr(stringFormat)

* **Parameters:**
    * stringFormat (String) String with parameters inside it
	    * e.g. "This is {0} stringformat string that I made {1}.", ["my", "myself"] (the values in the array can be variables)
* **Returns:**
    * (String) the correct formatted string

```JavaScript
// Report error to the console about non existing webble tempalte of a certain revision
$log.error($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist.', [whatTemplateId, whatTemplateRevision]));
```
###_UnblockAddUndo_ ![Method][meth]
If one have a long range of slot or Webble operation one does not want to be a part of the undo stack then set this to true just before starting the process and then later call the unblock method to return to normal mode again. Basically not used outside the core but available if ever reasons arise.
	
####UnblockAddUndo()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// These slot changes can never be undone or redone individually only as a complete package due to the BlockAddUndo
$scope.BlockAddUndo();
$scope.set("msg", "You Love Me!");
$scope.set("root:left", 700);
$scope.set("root:top", 500);
$scope.set("root:transform-rotate", 45);
$scope.UnblockAddUndo();
```
###_unselectAllWebbles_ ![Method][meth]
Makes all Webbles unselected (Without any border).

####unselectAllWebbles()

* **Parameters:**
    * None
* **Returns:**
    * Nothing

```JavaScript
// Unselects alla Webbles
$scope.unselectAllWebbles();
```
###_waiting_ ![Method][meth]
Turns on or off the appearance indicator ('is loading' gif image) in waiting mode. returns current waiting state if parameter is undefined.

####waiting(isWaitingEnabled)

* **Parameters:**
    * isWaitingEnabled (Boolean)
* **Returns:**
    * (Boolean) if parameter is `undefined` returns the curent status of is waiting mode ('is loading' gif image visibility)

```JavaScript
// Turns on the waiting visualizer to inform the user that work is being done. (Don't forget to turn it off later though)
$scope.waiting(true);
```
<!------------------------------------------------------------------------------------------------------------------->
##Workspace
The **Workspace** is the area where the Webbles resides and are modified and/or used. It contains mainly internal methods,
but a few useful help functions exists. Even here those are accessed via the Webble-template's `$scope`.

###_getBubbleTxt_ ![Method][meth]
The Bubble Text object can be used to display short info at specific locations, mostly Webbles. This method returns the current bubble text.
	
####getBubbleTxt()

* **Parameters:**
    * None
* **Returns:**
    * (String) The text currently assigned to the bubble text object

```JavaScript
// Use an AngularJS value watch to catch when the bubble text change and if it does, print it to the console
$scope.$watch(function(){ return $scope.getBubbleTxt(); }, function(newVal, oldVal) {
	if(newVal != ""){
		$log.log(newVal);	
	}
}, true);
```
###_getBubbleTxtPos_ ![Method][meth]
Returns the current (absolute) position on the workspace for the bubble text object, but adjusted for avoiding display outside the window frame and in relation to the possible Webble being targeted.

####getBubbleTxtPos()

* **Parameters:**
    * None
* **Returns:**
    * (Object(vector)) an object with _x_ and _y_ keys for the bubble text position
	    * e.g. {x: 100, y: 100}

```JavaScript
// Prints to the console the adjusted bubble text object position
$log.log( $scope.getBubbleTxtPos() );
```
###_getBubbleTxtVisibility_ ![Method][meth]
Returns the bubble text current visibility status.

####getBubbleTxtVisibility()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether the bubble text object is visible or not

```JavaScript
// Use an AngularJS value watch to catch when the bubble becomes visible and if it does, print the current bubble text to the console
$scope.$watch(function(){ return $scope.getBubbleTxtVisibility(); }, function(newVal, oldVal) {
	if(newVal == true){
		$log.log($scope.getBubbleTxt());
	}
}, true);
```
###_getSurfaceHeight_ ![Method][meth]
Fast access to get the current height of the work surface area as a css value with 'px' at the end.

####getSurfaceHeight()

* **Parameters:**
    * None
* **Returns:**
    * (String) the height of the workspace surface as a css value with pixels.
	    * e.g. "900px"

```JavaScript
// Print to the console the current height of the workspace area
$log.log( $scope.getSurfaceHeight() );
```
###_setBubbleTxt_ ![Method][meth]
Sets the bubble text to a speciefied text.

####setBubbleTxt(newTxt)

* **Parameters:**
    * newTxt (String) the new text which the bibble text object will hold
* **Returns:**
    * Nothing

```JavaScript
// Set the bubble text to a new string
$scope.setBubbleTxt("This is awsome!");
```
###_setBubbleTxtPos_ ![Method][meth]
Sets the new (absolute) position on the workspace for the bubble text object (and optionally includes the Webble being targeted).

####setBubbleTxtPos(newPos, caller)

* **Parameters:**
    * newPos (Object(vector)) an object with _x_ and _y_ keys for the bubble text position
	    * e.g. {x: 100, y: 100}
		* When disabled positioned offside at {x: -1000, y: -1000}
	* caller (Webble Pointer) Informs the bubble text which Webble is being targeted for text display
	    * OPTIONAL
* **Returns:**
    * Nothing

```JavaScript
// Place the bubble text object at a new non-webble-related position
$scope.setBubbleTxtPos({x: 150, y: 150});
```
###_setBubbleTxtVisibility_ ![Method][meth]
When calling this with true and a time, the bubble text object will appear at its assigned (and adjusted) position, showing its assigned text for the amount of milliseconds defined. When that time has passed the bubble text object will hide and resets itself, both its text and position.

####setBubbleTxtVisibility(newVisibilityState, howLong)

* **Parameters:**
    * newVisibilityState (Boolean) True or false whether the bubble text object should be visible or not
	* howLong (Integer) Time in milliseconds for how long the bubble text object should be visible before it goes invisible again
* **Returns:**
    * Nothing

```JavaScript
// Assigns a bubble text object to the webble and display its text for 3.5 seconds
$scope.setBubbleTxt("Booo!");
var absPos = $scope.getWblAbsPosInPixels($scope.theView);
$scope.setBubbleTxtPos(absPos, $scope.theView);
$scope.setBubbleTxtVisibility(true, 3500);
```
<!------------------------------------------------------------------------------------------------------------------->
<a name="io"></a>
##Interaction Object
The **Interaction Objects** are those small balls that each Webble has on the border when "_Main_" selected. There are 12
of them avialable around the border, but by default only 3-4 are activated. The Webble-template developer may configure and
activate (or deactivate) freely any of those for its own need. In the Webble-template the developer just define an Interaction object array object and all is set up automatically, but if the need for fine grain power exist, then that is also available. To access the Interaction object array one use `$scope.theInteractionObjects` and to access a specific interaction object method one use `$scope.theInteractionObjects[i].scope().ioMethod();`.  
As a Webble template developer one can manipulate the default interaction objects to the fullest, but one should probably avoid it if possible because it will confuse Webble users who are used to certain behaviors.

###_color_ ![Property][prop]
a property that contains the color of the Interaction Object

####color

* **Get & Set:**
    * (Color String) the color of the interaction object

```JavaScript
// Iterates all a Webbles interaction objects and prints their colors to the console
for (var i = 0; i < $scope.theInteractionObjects.length; i++ ){
	$log.log( $scope.theInteractionObjects[i].scope().color );
}
```
###_getIndex_ ![Method][meth]
Returns the index of the Interaction object, from 0 to 11, in order to grab the one interaction object one really wants. the index value and IO array value are most likely the same, but this method can be used to identify an Interaction object outside its array.  
The index positions are as follows (note the circular assignment of index value):  
![IO Pos Info][ioposinfo]	
####getIndex()

* **Parameters:**
    * None
* **Returns:**
    * (Integer) The index value of the interaction object which tells where along the Webble border the IO is stationed and found

```JavaScript
// Iterates all a Webbles interaction objects to find the specific one with color pink and print its index value to the console
for(var i = 0; i < $scope.theInteractionObjects.length; i++){
	if($scope.theInteractionObjects[i].scope().color == "pink"){
		$log.log( $scope.theInteractionObjects[i].scope().getIndex() );
	}
}
```
###_getIsEnabled_ ![Method][meth]
Returns if this object is enabled or not. (false = invisible)

####getIsEnabled()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether teh interaction object is enabled or not

```JavaScript
// Iterates all a Webbles interaction objects and prints if they are enabled or not
for (var i = 0; i < $scope.theInteractionObjects.length; i++ ){
	$log.log("IO with index " + i + " is enabled: " + $scope.theInteractionObjects[i].scope().getIsEnabled());
}
```
###_getName_ ![Method][meth]
Returns the name that the interaction object is identified by and which is used to trigger custom behavior.

####getName()

* **Parameters:**
    * None
* **Returns:**
    * (String) the unique id name this interaction object go by
	    * Empty string for disabled interaction objects

```JavaScript
// Iterates all a Webbles interaction objects and prints their unique id name to the console
for(var i = 0; i < $scope.theInteractionObjects.length; i++){	
	$log.log( $scope.theInteractionObjects[i].scope().getName() );
}
```
###_pos_ ![Property][prop]
A property that contains the position of the Interaction Object relative to its Webble (in pixels). (In 99.99% of the cases this is completelly auto adjusted by the Webble, but it is available to enforce if needed)
	
####pos

* **Get & Set:**
    * (Object(vector)) a position object with _left_ and _top_ keys telling the position of the interaction ball
	    * e.g. {left: 0, top: 0}

```JavaScript
// Iterates all a Webbles interaction objects and prints their position in pixels (reltive to its Webble) to the console
for (var i = 0; i < $scope.theInteractionObjects.length; i++ ){
	$log.log( $scope.theInteractionObjects[i].scope().pos );
}
```
###_setIsEnabled_ ![Method][meth]
Sets the enabling state (true or false) for this object (true = visible). The effect of a interaction object being triggered by a user must be handled in the `coreCall_Event_InteractionObjectActivityReaction` method inside the Webble template controller (See source code and comments for details).

####setIsEnabled(enableState)

* **Parameters:**
    * enableState (Boolean) True or False whether the interaction object should be enabled or not
* **Returns:**
    * Nothing

```JavaScript
// configures, initiate and enables a new interaction object for the Webble
$scope.theInteractionObjects[6].scope().setName("selfDestruct");
$scope.theInteractionObjects[6].scope().tooltip = "Self Destruct";
$scope.theInteractionObjects[6].scope().setIsEnabled(true);
```
###_setName_ ![Method][meth]
Sets the name that the interaction object is identified by and which is used to trigger custom behavior.

####setName(whatName)

* **Parameters:**
    * whatName (String) the unique id name this interaction object should go by
* **Returns:**
    * Nothing

```JavaScript
// Assign a new name to the interaction object with index 6
$scope.theInteractionObjects[6].scope().setName("selfDestruct");
```
###_tooltip_ ![Property][prop]
A property that contains the Text which is displayed when hoovering the Interaction Object with the mouse. The text usually describes what the interaction object does.

####tooltip

* **Get & Set:**
    * (String) text that will be displayed as a tooltip when the mouse hoovers above the Interaction ball
	    * "undefined" for disabled interaction objects

```JavaScript
// Iterates all a Webbles interaction objects and prints their tooltip text to the console
for (var i = 0; i < $scope.theInteractionObjects.length; i++ ){
	$log.log( $scope.theInteractionObjects[i].scope().tooltip );
}
```
<!------------------------------------------------------------------------------------------------------------------->
##Directives
AngularJS **Directives** can be very powerful and we recommend the Webble-template developers to create their own for their
Webbles (though not any requirment). But there are also a few simple ones already available in the platform core too, that can be easily applied. Just apply the directive name as instructed below either as a tag attribute or class name.

###_draggable_ ![Directive][dir]
Makes an element draggable (JQuery style) (initiated either as an Attribute or Class). For more information about the draggable options see JQuerys [draggable](http://api.jqueryui.com/draggable/) page online.

####draggable [optional: draggable="{options}" ]

* **Parameters:**
    * (Object) a jquery draggable options object (See [draggable](http://api.jqueryui.com/draggable/)).
	   * OPTIONAL

```HTML
<!-- Make the span element draggable inside the div by adding the attribute "draggable" -->
<div id="myWebbleView" ng-controller="myWebbleCtrl">
    <span id="myWblTxt" draggable>{{gimme('myTxtSlot')}}</span>
</div>
```
###_ng-size_ ![Directive][dir]
Make sure that the `<select>` tags 'size' value can be set dynamically (e.g. from a slot)

####ng-size"{{value}}"

* **Parameters:**
    * value (Float) the height value wished to oppose on the `<select>` element

```HTML
<!-- Make the size of the select list dynamicly controlled by a slot -->
<div class="myClass">
	<select id="mySelect" ng-size="{{gimme('mySelectListSizeSlot')}}" ng-options="li for li in myList.items" style="width: auto;">
	</select>
</div>
```
###_sortable_ ![Directive][dir]
Makes a list element sortable (JQuery style) (initiated either as an Attribute or Class). For more information about the sortable options see JQuerys [sortable](http://api.jqueryui.com/sortable/) page online.

####sortable [ optional: 'sortable="{options}" ]

* **Parameters:**
    * (Object) a jquery sortable options object (See [draggable](http://api.jqueryui.com/sortable/)).
	   * OPTIONAL

```HTML
<!-- Make the ui list element sortable inside the div by adding the attribute "sortable" -->
<div id="myWebbleView" ng-controller="myWebbleCtrl">
    <ul id="myList" sortable>
		<li>Item 1</li>
		<li>Item 2</li>
		<li>Item 3</li>
		<li>Item 4</li>
		<li>Item 5</li>
	</ul>
</div>
```
<!------------------------------------------------------------------------------------------------------------------->
<a name="services"></a>
##Services
In the **Services** can be found multiple help functions and support methods along with various providers of data of all
sorts. If one want to use a service in a Webble the name of the service must be included at the top of the controller 
function declaration (e.g. `Enum` or `wwConst` etc.). The ones that could be of interest for a Webble-template developer, besides the ones he/she would create themselves inside the template, are the following.

###_**=== bitflags ===**_ ![Property][prop]
The `bitflags` service contains a few easy to access methods for bitwise operations. (remember to also add it to the top of the controller)

####**bitflags.METHOD(PARAMETERS)**

```JavaScript
// Toggles the Protection flag for a specific protection item and set it to the Webble
var newProtection = $scope.getProtection();
var protectKey = Enum.bitFlags_WebbleProtection.DELETE;
newProtection = bitflags.toggle(newProtection, protectKey);
$scope.setProtection(newProtection);
```
###_off_ ![Method][meth]
Bit-Flag Operation which turns a binary flag off from a provided set of bitflags and returns the altered set of bitflags.

####bitflags.off(whatFlagSelection, whatBitFlag)

* **Parameters:**
    * whatFlagSelection (Integer) a set of bitflags
	    * e.g. 0110 = 5 or 100101 = 37
	* whatBitFlag (Integer) the bit flag we are after
	    * e.g. 3rd = 4 or 6th = 32
* **Returns:**
    * (Integer) the new and altered bitflag set

```JavaScript
// Turns OFF the Protection flag for a specific protection item and set it to the Webble
var newProtection = $scope.getProtection();
var protectKey = Enum.bitFlags_WebbleProtection.PUBLISH;
newProtection = bitflags.off(newProtection, protectKey);
$scope.setProtection(newProtection);
```
###_on_ ![Method][meth]
Bit-Flag Operation which turns a binary flag on from a provided set of bitflags and returns the altered set of bitflags.

####bitflags.on(whatFlagSelection, whatBitFlag)

* **Parameters:**
    * whatFlagSelection (Integer) a set of bitflags
	    * e.g. 0110 = 5 or 100101 = 37
	* whatBitFlag (Integer) the bit flag we are after
	    * e.g. 3rd = 4 or 6th = 32
* **Returns:**
    * (Integer) the new and altered bitflag set

```JavaScript
// Turns ON the Protection flag for a specific protection item and set it to the Webble
var newProtection = $scope.getProtection();
var protectKey = Enum.bitFlags_WebbleProtection.BUNDLE;
newProtection = bitflags.on(newProtection, protectKey);
$scope.setProtection(newProtection);
```
###_toggle_ ![Method][meth]
Bit-Flag Operation which toggles a binary flags from on to off or vice versa from a provided set of bitflags and returns the altered set of bitflags.

####bitflags.toggle(whatFlagSelection, whatBitFlag)

* **Parameters:**
    * whatFlagSelection (Integer) a set of bitflags
	    * e.g. 0110 = 5 or 100101 = 37
	* whatBitFlag (Integer) the bit flag we are after
	    * e.g. 3rd = 4 or 6th = 32
* **Returns:**
    * (Integer) the new and altered bitflag set

```JavaScript
// Toggles the Protection flag for a specific protection item and set it to the Webble
var newProtection = $scope.getProtection();
var protectKey = Enum.bitFlags_WebbleProtection.MOVE;
newProtection = bitflags.toggle(newProtection, protectKey);
$scope.setProtection(newProtection);
```
###_**=== colorService ===**_ ![Property][prop]
The `colorService` service contains a range of useful methods for color related rgb and hec color conversions etc. To access any of the specific colorService methods just call colorService (remember to also add it to the top of the controller) envoking the colorService method one is after (including any possible parameters).

####**colorService.METHOD_NAME(PARAMETERS)**

```JavaScript
// Get the RGBA value as a string from the hex value for opaque "red"
$log.log( colorService.hexToRGBAStr("#ffff0000") );
```
###_rgbToHex_ ![Method][meth]
Returns a hexadecimal color value converted from three rgb values.

####colorService.rgbToHex(R,G,B)

* **Parameters:**
    * R (Integer) the "Red" value for a RGB color, ranging from 0-255
	* G (Integer) the "Green" value for a RGB color, ranging from 0-255
	* B (Integer) the "Blue" value for a RGB color, ranging from 0-255
* **Returns:**
    * (String) the hexadecimal value corresponding to the RGB values provided as parameters
	    * e.g. "#22FA86" (from R=34, G=250, B=134)

```JavaScript
// Print the hex value from three separate R, G and B values to the console
$log.log( colorService.rgbToHex(34,250,134) );
```
###_rgbStrToHex_ ![Method][meth]
Returns a rgb value as a string converted from a hexadecimal color value.

####colorService.rgbStrToHex(rgbStr)

* **Parameters:**
    * rgbStr (String) a rgb value as a string
	    * e.g. "rgb(0,0,0)"
* **Returns:**
    * (String) the hexadecimal value corresponding to the RGB string value provided as parameter
	    * e.g. "#1BD659" (from "rgb(27,214,89)")

```JavaScript
// Print the hex value from a rgb value provided as a string "rgb(0,0,0)"
$log.log( colorService.rgbStrToHex("rgb(27,214,89)") );
```	
###_hexToRGB_ ![Method][meth]
Returns a set of three rgb values in an object converted from a hexadecimal color value.

####colorService.hexToRGB(hex)

* **Parameters:**
    * hex (String) a classic hexadecimal color string
	    * e.g. "#FF00FF"
* **Returns:**
    * (Object) contains three keys for r, g and b
	    * e.g. {r: 255, g: 0, b: 255}

```JavaScript
// Print the separate R, G and B value from a hexadecimal color string "#AA6607"
var rgb = colorService.hexToRGB("#AA6607");
$log.log( "R: " + rgb.r + ", G: " + rgb.g + ", B: " + rgb.b );
```
###_hexToRGBAStr_ ![Method][meth]
Returns a RGBA (including opacity) value as a string converted from a hexadecimal color value with opacity. (Observe the switched order of the opacity value)

####colorService.hexToRGBAStr(hex)

* **Parameters:**
    * hex (String) a classic hexadecimal color string with opacity
	    * e.g. "#FFFF00FF" 
* **Returns:**
    * (String) a rgba value as a string
		* e.g. "rgba(255,0,25,1)"
		
```JavaScript
// Print the RGBA value as a string from a hexadecimal color string "#FFAA6607" to the console
$log.log( colorService.hexToRGBAStr("#FFAA6607") );
```
###_**=== dbService ===**_ ![Property][prop]
The `dbService` service contains predefined database queries for accessing Webbles and webble meta data. Only one is currently offered properly for external use by Webble Developers (see below), but there are plenty more available. (remember to also add it to the top of the controller)

####**dbService.QUERYMETHOD(PARAMETERS)**

```JavaScript
// Ask the Webble World Server and its database to returned the stored Webble definition JSON object for a specified Webble Template
dbService.getWebbleDef("fundamental").then(function(data) {
	// Print the retrieved JSON object to the console
	$log.log( data );
},function(eMsg){
	// If error, print the retrieved error message to the console
	$log.log( eMsg );
});
```
###_getMyAccessKey_ ![Method][meth]
Service that fetches an access key object that is associated either with the user's account or with the groups, including the parent groups, to which the user belongs.	     

####dbService.getMyAccessKey(realm, resource)

* **Parameters:**
    * realm (String) Any string uniquely identifying the issuer of the access key
	     * usually the domain name of the target service e.g., google.com, amazon.co.uk, microsoft.co.br, etc.
	* resource (String) Any string uniquely identifying the resource(s) to which this key provides access to
	     * usually an identifier refering to the target services e.g., maps, all, office2014_xp_pro, etc.
* **Returns:**
    * (Promise) a promise that is fulfilled on success with the access key object and rejected on failure with a user friendly string message that describes the error

```JavaScript
// Ask the server for this current Webble Worlds users API keys for a specific realm and resource
dbService.getMyAccessKey(realm, resource).then( function(returningKey) {
	// DO WHAT YOU ARE SUPPOSED TO DO TO ACCESS THE API WITH THE KEYS YOU RETRIEVED.
},function(err) {
	$log.log(err);
});
```
<a name="enum"></a>
###_**=== Enum ===**_ ![Property][prop]
The `Enum` service contains numerous enumaration lists for quicker and more structured and readable coding. To access any of the specific Enum obejcts just call Enum (remember to also add it to the top of the controller) envoking the enum object one is after and then the enum item available in that enum list.

####**Enum.OBJECT_NAME.ITEM_NAME**

```JavaScript
if ( $scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.HighClearanceUser ) {
	alert("Good for you!");
}
```
<a name="availablePlatformPotentials"></a>
###_availablePlatformPotentials_ ![Enum][enum]
Available Platform states has mainly to do with access to the Webble World Service and Database, and is therefore hardly never needed for a Webble developer to be concerned about, but it does exist. It can be set only from the server and internally by server admins.

####Enum.availablePlatformPotentials

* None: 0
* Slim: 1
* Limited: 2
* Full: 3
    * Default (99.999% of the time)
* Custom: 4
* Undefined: 5

```JavaScript
// Warn the user running Webble world in any limited mode that this Webble does not accept that
if ( $scope.getCurrentPlatformPotential() != Enum.availablePlatformPotentials.Full ) { 
	showQIM("This Webble only works properly in Full platform state."); 
}
```
<a name="aopForms"></a>
###_aopForms_ ![Enum][enum]
Available forms and modal windows that can be opened and displayed inside Webble World.

####Enum.aopForms

* userReg: 0 _(User Registration)_
* wblProps: 1 _(Weble Properties/Slots)_
* slotConn: 2 _(Slot Connection)_
* protect: 3 _(Protection)_
* addCustSlot: 4 _(Add Custom Slots)_
* infoMsg: 5 _(Custom Information Message)_
* langChange: 6 _(Language Change)_
* publishWebble: 7 _(Publish Webble)_
* loadWebble: 8 _(Load Webble)_
* saveWorkspace: 9 _(Save Workspace)_
* platformProps: 10 _(Platform Properties)_
* about: 12 _(About Weble World Platform)_
* wblAbout: 13 _(About Specific Webble)_
* wblSearch: 14 _(Webble Browser and Search)_
* faq: 15 _(Frequently Asked Questions)_
* bundle: 16 _(Bundle Webbles)_
* deleteWorkspace: 17 _(Delete Workspace)_
* rateWbl: 18 _(Rate Webble)_
* saveWorkspaceAs: 19 _(Save Workspace As...)_
* shareWorkspaces: 20 _(Share Workspace)_
* editCustMenuItems: 21 _(Edit Custom Menu Items)_
* editCustInteractObj: 22 _(Edit Custom Interaction Objects)_
* viewWblRatingAndComments: 23 _(View a Specific Webbles Rating and User Comments)_
* exportWebble: 24 _(Export Webble)_
* importWebble: 25 _(Import Webble)_

```JavaScript
// Opens the Webble World platform About Window
$scope.openForm(Enum.aopForms.about, null, null);
```
###_availableOnePicks_DefaultInteractionObjects_ ![Enum][enum]
All default Interaction objects that all webbles share.

####Enum.availableOnePicks_DefaultInteractionObjects

* Menu: 0 _(Open Webble Context Menu)_
* Rotate: 1 _(Rotate Webble)_
* Resize: 2 _(Resize Webble)_
* AssignParent _(Assign Parent)_

```JavaScript
// Check if the target name variable is set to assign parent, and if so call that method
if (targetName == getKeyByValue(Enum.availableOnePicks_DefaultInteractionObjects, Enum.availableOnePicks_DefaultInteractionObjects.AssignParent)){
	$scope.assignParent();
}
```
###_availableOnePicks_DefaultInteractionObjectsTooltipTxt_ ![Enum][enum]
Tooltip Text for default Interaction objects that all webbles share for fast access and corresponding to `availableOnePicks_DefaultInteractionObjects`.

####Enum.availableOnePicks_DefaultInteractionObjectsTooltipTxt

* Menu: "Open Menu"
* Rotate: "Rotate"
* Resize: "Resize"
* AssignParent: "Assign Parent"

```JavaScript
// Print to the console, the default Interaction Tooltip text in the current platform language for rotate IO
var rotateIO = Enum.availableOnePicks_DefaultInteractionObjects.Rotate;
$log.log( gettextCatalog.getString(Enum.availableOnePicks_DefaultInteractionObjectsTooltipTxt[rotateIO]) );
```    
<a name="availableOnePicks_DefaultWebbleMenuTargets"></a>
###_availableOnePicks_DefaultWebbleMenuTargets_ ![Enum][enum]
The default context menu choices that all webbles share.

####Enum.availableOnePicks_DefaultWebbleMenuTargets

* Publish: 1 _(Publish Webble)_
* Duplicate: 2 _(Duplicate Webble)_
* Delete: 3 _()Delete Webble_
* AssignParent: 4 _(Assign Parent to Webble)_
* RevokeParent: 5 _(Revoke Parent from Webble)_
* ConnectSlots: 6 _(Connect Slots to and from Webble)_
* Props: 7 _(Properies and Slots)_
* SharedDuplicate: 8 _(Share Model Duplicate Webble)_
* Bundle: 9 _(Bundle Webble)_
* Unbundle: 10 _(Undbundle Webble)_
* BringFwd: 11 _(Bring Forward Webble (z-index))_
* Protect: 12 _(Set Protection Flags for Webble)_
* AddCustomSlots: 13 _(Add Custom Slots to Webble)_
* EditCustomMenuItems: 14 _(Edit Custom Menu Items for Webble)_
* EditCustomInteractionObjects: 15 _(Edit Custom Interaction Objects for Webble)_
* About: 16 _(Display Information of Webble)_

```JavaScript
// Check if the enumNumId variable is set to BringFwd, and if so tell the console about it
if (enumNumId == Enum.availableOnePicks_DefaultWebbleMenuTargets.BringFwd) {
	$log.log("Bring Forward was picked");
}
```
###_availableOnePicks_DefaultWebbleMenuTargetsNameTxt_ ![Enum][enum]
Webble Menu Text for default context menu items that all webbles share for fast access and corresponding to `availableOnePicks_DefaultWebbleMenuTargets`.

####Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt

* Publish: "Publish"
* Duplicate: "Duplicate"
* Delete: "Delete"
* AssignParent: "Assign Parent"
* RevokeParent: "Revoke Parent"
* ConnectSlots: "Connect Slots"
* Props: "Properties"
* SharedDuplicate: "Shared Model Duplicate"
* Bundle: "Bundle"
* Unbundle: "Unbundle"
* BringFwd: "Bring to Front"
* Protect: "Set Protection"
* AddCustomSlots: "Add Custom Slots"
* EditCustomMenuItems: "Custom Menu Items"
* EditCustomInteractionObjects: "Custom Interaction Objects"
* About: "About"

```JavaScript
// Print to the console, the default Webble menu text in the current platform language for Props
var props = Enum.availableOnePicks_DefaultWebbleMenuTargets.Props;
$log.log( gettextCatalog.getString(Enum.availableOnePicks_DefaultWebbleMenuTargetsNameTxt[props]) );
```   
<a name="availableOnePicks_ExecutionModes"></a>
###_availableOnePicks_ExecutionModes_ ![Enum][enum]
The different execution modes the webble world can be set to.

####Enum.availableOnePicks_ExecutionModes

* Developer: 0
* Admin: 1
* SuperHighClearanceUser: 2
* HighClearanceUser: 3
* MediumClearanceUser: 4
* LowClearanceUser: 5

```JavaScript
// Check if current execution mode is the highest "Developer", and if so tell the console about it
if ($scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.Developer){
	$log.log("Currently running in the highest Execution Mode");
}
```
###_availableOnePicks_ExecutionModesDisplayText_ ![Enum][enum]
Execution Mode Name Text for available various execution modes corresponding to `availableOnePicks_ExecutionModes`.

####Enum.availableOnePicks_ExecutionModesDisplayText

* Developer: "Developer"
* Admin: "Admin"
* SuperHighClearanceUser: "Super High Clearance User"
* HighClearanceUser: "High Clearance User"
* MediumClearanceUser: "Medium Clearance User"
* LowClearanceUser: "Low Clearance User"

```JavaScript
// Print to the console, the execution mode text in the current platform language for Developer
var dev = Enum.availableOnePicks_ExecutionModes.Developer;
$log.log( gettextCatalog.getString(Enum.availableOnePicks_ExecutionModesDisplayText[dev]) );
```
<a name="availableOnePicks_SelectTypes"></a>
###_availableOnePicks_SelectTypes_ ![Enum][enum]
The different types of selected states available which a Webble can be in (both highly visual and semi-visual states). This is what controlls the default behavior of the Webble border (color and looks)

####Enum.availableOnePicks_SelectTypes

* AsNotSelected: 0 _(Not Selected)_
* AsMainClicked: 1 _(Main Selected)_
* AsChild: 2 _(Child)_
* AsHighlighted: 3 _(Only Highlighted)_
* AsImportant: 4 _(Important)_
* AsToBeRemembered: 5 _(Keep in mind)_
* AsParent: 6 _(Parent)_
* AsWaitingForParent: 7 _(Waiting for Parent)_
* AsWaitingForChild: 8 _(Waiting for Child)_
* AsNewParent: 9 _(New Parent)_
* AsNewChild: 10 _(New Child)_

```JavaScript
// Remove all selection for the Webble
$scope.setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
```
###_aopInputTypes_ ![Enum][enum]
The different available form input types used to interact with webble properties and similar. Mainly used by Webble developer when creating slots, as a metadata instruction, when the auto generated display type is not enough. The look and feel of each input type depends on the browser.

####Enum.aopInputTypes

* Undefined: 0 _(The initial default value, later adjusted either by the system or the user, usually no need to ever set manually, but if you do, you get a slot without any content value)_
* CheckBox: 1 _(A classic check box (Boolean), Usually auto detected)_
* ColorPick: 2 _(Color Picker, Manual assignment required)_
* ComboBoxUseIndex: 3 _(Drop down box, slot store integer index value, Manual assignment required (incl. list))_
* ComboBoxUseValue: 4 _(Drop down box, slot store string list option value, Manual assignment required (incl. list))_
* FontFamily: 5 _(Drop down box, slot store string font value, auto detected from CSS otherwise manual assignment required (incl. list). Additional font options from online needs to be added manually)_
* RadioButton: 6 _(Clasic radio button, slot store string option value, Manual assignment required (incl. list))_
* Slider: 7 _(Slider (Numerical), Manual assignment required (incl. Min/Max))_
* Point: 8 _(Two Numerical input boxes, for x and y, Manual assignment required and values need to be either Object {x: 0, y: 0} or Array [0, 0])_
* Numeral: 9 _(Classic text input box (small width) (Numerical (Integer & Float)), Usually auto detected)_
* PasswordBox: 10 _(Classic password input box (medium width), with hidden input value, Manual assignment required)_
* Size: 11 _(Two Numerical input boxes, for width and height, Manual assignment required and values need to be either Object {w: 0, h: 0} or Array [0, 0])_
* TextBox: 12 _(A classic text input box (String), Usually auto detected (also common fallback when auto detection fails))_
* MultiListBox: 13 _(Multi select list box, slot store array of index values, manual assignment required (incl. list))_
* MultiCheckBox: 14 _(A set of classic Check boxes, slot store array of index values, manual assignment required (incl. list))_
* RichText: 15 _(Simple Text editor, with basic formatting (HTML enhanced String), manual assignment required)_
* DatePick: 16 _(Date Picker, JavaScript Date() value object or String, manual assignment required)_
* ImagePick: 17 _(File Select & Text Input (with image view), Slot store as string, manual assignment required)_
* AudioPick: 18 _(File Select & Text Input (with audio player), Slot store as string, manual assignment required)_
* VideoPick: 19 _(File Select & Text Input (with video player), Slot store as string, manual assignment required)_
* WebPick: 20 _(Text Input (with iframe web viewer), Slot store as string, manual assignment required)_
* TextArea: 21 _(Classic text area input, Slot store as string, auto detected if slot initial value is very long string, otherwise manual assignment required)_

```JavaScript
// Create a new slot of drop down box type tracking index value
$scope.addSlot(new Slot('myFavoriteFruit',
	0,
	'My Favorite Fruit',
	'This is my currently favorite fruit',
	$scope.theWblMetadata['templateid'],
	{inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ["Apple", "Pear", "Orange", "Kiwi", "Banana"]},
	undefined
));
```
###_bitFlags_InitStates_ ![Enum][enum]
Used for webble initation states (Bitwise Flags). This is in all known cases completely irrelevant for a Webble developer and can be ignored, but if ever a reason to track these states occure, then these are the different states available.

####Enum.bitFlags_InitStates

* None: 0 _()_
* InitBegun: 1 _(The Webble Core Init Method have just begun its work)_
* InitFinished: 2 _(The Webble Core Init Method have just finished its work)_
* ActiveReady: 4 _(Not used)_
* AllDone: 8 _(Not used)_

```JavaScript
// Check if the Webble is in the middle of initiation and if so tell the console about it
var isInitStart = ((parseInt($scope.getInitiationState(), 10) & parseInt(Enum.bitFlags_InitStates.InitBegun, 10)) !== 0);
var isInitNotDone = ((parseInt($scope.getInitiationState(), 10) & parseInt(Enum.bitFlags_InitStates.InitFinished, 10)) === 0);
if(isInitStart && isInitNotDone){
	$log.log("I am in the middle of something!");
}
```
<a name="bitFlags_PlatformConfigs"></a>	
###_bitFlags_PlatformConfigs_ ![Enum][enum]
Used for settings and configuraions of the platform environment.

####Enum.bitFlags_PlatformConfigs

* None: 0
* PlatformInteractionBlockEnabled: 1 _(Is User interaction blocked (currently not in use))_
* MainMenuVisibilityEnabled: 2 _(Is main menu visible or not)_
* PopupInfoEnabled: 4 _(Are Popup info messages enabled or not (setting currently disregarded))_
* autoBehaviorEnabled: 8 _(Is auto behavior (slot default connection etc.) enabled or not)_

```JavaScript
// Tell the console if the menu is open or not
var ps = $scope.getPlatformSettingsFlags();
var menuIsOpen = ((parseInt(ps, 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) != 0)
$log.log( "Menu Open: " + menuIsOpen );
```	
<a name="bitFlags_PlatformStates"></a>
###_bitFlags_PlatformStates_ ![Enum][enum]
Used for keeping track of some things the platform is doing (Bitwise Flags). This is in all known cases completely irrelevant for a Webble developer and can be ignored, but if ever a reason to track these states occure, then these are the different states available.

####Enum.bitFlags_PlatformStates

* None: 0
* WaitingForParent: 1 _(Is Waiting for the user to click a Webble, which will then be assigned as parent)_
* WaitingForAllSelect: 2 _(Is in the progress of selecting all Webbles and turn on their highlight borders)_

```JavaScript
// Check if the platform is waiting for a parent selection, and if so tell it to the console
if((parseInt($scope.getPlatformCurrentStates(), 10) & parseInt(Enum.bitFlags_PlatformStates.WaitingForParent, 10)) !== 0){
	$log.log("We are waiting!!")
}
```
<a name="SlotDisablingState"></a>		
###_SlotDisablingState_ ![Enum][enum]
Used for keeping track if a slot is disabled in some way or another. Each higher value include all lower ones.

####Enum.SlotDisablingState

* None: 0 _(Fully Enabled Slot)_
* PropertyEditing: 1 _(Slot cannot be edited in the slot/property form (but viewed))_
* PropertyEditingAndValue: 2 _(Slot cannot be edited and its value cannot be seen))_
* PropertyVisibility: 4 _(Slot cannot be seen in the slot/property form (but seen and used in the slot connection form))_
* ConnectionVisibility: 8 _(Slot cannot be used to create connections and does not show up in the slot connection form)_
* AllVisibility: 16 _(Can only be used internally by the Webble Developer and is never visible for external use in any way)_

```JavaScript
// Make the slot "MySlot" invisible in the property form
$scope.getSlot('MySlot').setDisabledSetting(Enum.SlotDisablingState.PropertyVisibility);
```
<a name="bitFlags_WebbleConfigs"></a>
###_bitFlags_WebbleConfigs_ ![Enum][enum]
The different types of some available core internal webble metadata (Bitwise Flags).

####Enum.bitFlags_WebbleConfigs

* None: 0
* IsMoving: 2 _(The Webble is currently being moved (dragged) (or not))_
* NoBubble: 4 _(The Webble will not display a information bubble text box (or will))_

```JavaScript
// Check if the Webble allows Bubble info text or not, and if not, write to the console
if ((parseInt($scope.getWebbleConfig(), 10) & parseInt(Enum.bitFlags_WebbleConfigs.NoBubble, 10)) != 0){
	$log.log("What do you have against bubbles?")
}
```
<a name="bitFlags_WebbleProtection"></a>    
###_bitFlags_WebbleProtection_ ![Enum][enum]
The different protections that can be set on a webble (Bitwise Flags).

####Enum.bitFlags_WebbleProtection

* x: 0 _()_
* NO: 0 _(No Operation Protection)_
* MOVE: 1 _(Moving is not allowed)_
* RESIZE: 2 _(Resizing is not allowed)_
* DUPLICATE: 4 _(Duplication is not allowed)_
* SHAREDMODELDUPLICATE: 8 _(Shared Model Duplication is not allowed)_
* DELETE: 16 _(Deleting is not allowed)_
* PUBLISH: 32 _(Publishing is not allowed)_
* PROPERTY: 64 _(Changing slots are not allowed)_
* PARENT_CONNECT: 128 _(Assigning a parent is not allowed)_
* CHILD_CONNECT: 256 _(Have children is not allowed)_
* PARENT_DISCONNECT: 512 _(Peel from parent is not allowed)_
* CHILD_DISCONNECT: 1024 _(Remove children is not allowed)_
* BUNDLE: 2048 _(Bundling is not allowed)_
* UNBUNDLE: 4096 _(Un-bundling is not allowed)_
* DEFAULT_MENU: 8192 _(Default menu is not allowed (but custom menu item is)_
* INTERACTION_OBJECTS: 16384 _(Interaction Balls not allowed)_
* SELECTED: 32768 _(selection is not allowed)_
* POPUP_MENU: 65536 _(Popup Menu is not allowed)_
* NON_DEV_HIDDEN: 131072 _(Is not Visible unless in developer mode)_
* DRAG_CLONE: 262144 _(Dragged Clone is not allowed (slot pos immediately updated))_
* BUNDLE_LOCKED: 524288 _(Locking and trapping a Webble from being dragged inside a bundle is not allowed)_
* EXPORT: 1048576 _(Export is not allowed)_

```JavaScript
// Check if the Webble is allowed to get published, and if not write to the console
if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) !== 0){
	$log.log("You are not allowed to be shared to the world, you poor, poor thing.");
}
```                                         
<a name="availableWWEvents"></a>
###_availableWWEvents_ ![Enum][enum]
The different Webble World Events that a Webble can listen to. (See [registerWWEventListener](#registerWWEventListener)) for details on how to create and manage a Webble Event Listener).

####Enum.availableWWEvents

* slotChanged: 0
* deleted: 1
* duplicated: 2
* sharedModelDuplicated: 3
* pasted: 4
* gotChild: 5
* peeled: 6
* lostChild: 7
* keyDown: 8
* loadingWbl: 9
* mainMenuExecuted: 10
* wblMenuExecuted: 11

```JavaScript
// One simple example of adding a webble world event listener, in this case for slot-change, and in the callback function manage possible event-fire situations.
var slotChangeListener = $scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
	if(eventData.slotName == "msg"){
		if(eventData.slotValue == "go big"){
			$scope.set("square:width", 300);
			$scope.set("square:height", 300);
		}
		else if(eventData.slotValue == "go small"){
			$scope.set("square:width", 30);
			$scope.set("square:height", 30);
		}
		else if(eventData.slotValue == "stop"){
			// Kill event listener
			slotChangeListener()
		}
	}	
	else if(eventData.slotName == "squareTxt:font-size"){
		if(parseInt(eventData.slotValue) > 40){
			$log.log("Don't Scream!")
		}
	}
});
```
###_**=== isExist ===**_ ![Property][prop]
The `isExist` service checks if something exist somewhere, for example if a specific value exists in a specific array. To access any of the specific isExist methods just call isExist (remember to also add it to the top of the controller) envoking the method one is after. Both service methods can return the index of the find instead of just true or false

####**isExist.METHOD(PARAMETERS)**

```JavaScript
// tell the console if a specific value existst in a specified array
var myArray = [17, 21, 39, 198, 12], myValue = 39;
$log.log( myValue + " exists in myArray: " + isExist.valueInArray(myArray, myValue) );
```
###_valueInArray_ ![Method][meth]
Checks whether a specified value exists in a provided array and if so returns the result either as a Boolean or as the index value of the find.

####isExist.valueInArray(theArray, theValue, retAsIndex)

* **Parameters:**
    * theArray (Array) the array to search inside
	* theValue (Any) the value to look for in the array
	* retAsIndex (Boolean) whether the return value should be the index of the find or just a Boolean
	    * OPTIONAL
* **Returns:**
    * (Boolean / Integer) Either True or False for locating the value or the index of the value if requested

```JavaScript
// tell the console at what index a specific value existst in a specified array
var myArray = [17, 21, 39, 198, 12], myValue = 39;
$log.log( myValue + " exists in myArray at index: " + isExist.valueInArray(myArray, myValue, true) );
```	
###_valueInArrayOfObj_ ![Method][meth]
Checks whether a specified object key value exists in a provided array of objects and if so returns the result either as a Boolean or as the index value of the find. Can take an array of keys for nested objects.

####isExist.valueInArrayOfObj(theArray, theValue, theObjKey, retAsIndex)

* **Parameters:**
    * theArray (Array) the array to search inside
	* theValue (Any) the value to look for in the array
	* theObjKey (String) the key name of the object being examined
	* retAsIndex (Boolean) whether the return value should be the index of the find or just a Boolean
	    * OPTIONAL
* **Returns:**
    * (Boolean / Integer) Either True or False for locating the value or the index of the value if requested

```JavaScript
// tell the console at what index a specific value existst in a specified array of objects under a specific object key
var myArray = [{name: "Bob", city: "London", age: 45}, {name: "Janet", city: "New York", age: 39}, {name: "Ryu", city: "Tokyo", age: 17}], myValue = 39, myKey = "age";
$log.log( myValue + " exists in myArray under object key '" + myKey + "' at index: " + isExist.valueInArrayOfObj(myArray, myValue, myKey, true) );
```
###_**=== jsonQuery ===**_ ![Property][prop]
The `jsonQuery` service contains a collection of methods to query a json object (incl. nested objects) for different things. To access any of the specific  jsonQuery methods just call jsonQuery (remember to also add it to the top of the controller) envoking the method one is after.

####**jsonQuery.METHOD(PARAMETERS)**

```JavaScript
// tell the console at which index a specific value would be stored if the object where it is found would be an array
var myObj = {name: "Bob", city: "London", age: 35, weight: 87.5, work: "CG Artist"};
var myValue = "87.5";
var theIndex = jsonQuery.getArrayIndexByObjValue(myObj, myValue);
$log.log( "If myObj was converted to an array, the value " + myValue + " would be stored at index: " + theIndex );
```
###_allValByKey_ ![Method][meth]
Search through an object and returns all values (stored in an array) which was found under the provided key.

####jsonQuery.allValByKey(obj, key)

* **Parameters:**
    * obj (Object) an ordinary key-value object
	* key (String) the key which will be looked for in the provided object
* **Returns:**
    * (Array) all the values found under the specified key

```JavaScript
// Lists all values for a specified key in a specified object and print it to the console.
var myObj = {dad: {name: "Bob", city: "London", age: 35}, mom: {name: "Lisa", city: "London", age: 41}};
var myKey = "age";
$log.log( "These are the values for the key '" + myKey + "' in myObj: " + jsonQuery.allValByKey(myObj, myKey) );
```
###_allObjWithKey_ ![Method][meth]
Search through an object and returns an array of generated objects which contains the provided key and its value.

####jsonQuery.allObjWithKey(obj, key)

* **Parameters:**
    * obj (Object) an ordinary key-value object (nested is allowed)
	* key (String) the key which will be looked for in the provided object
* **Returns:**
    * (Array) a set of generated objects with the specified key and value

```JavaScript
// Write to the console the generated array of objects created when looking for a certain key in a certain object
var myObj = {dad: {name: "Bob", city: "London", age: 35}, mom: {name: "Lisa", city: "Cambridge", age: 41}};
var myKey = "city";
$log.log( jsonQuery.allObjWithKey(myObj, myKey) );
```
###_allObjValuesAsArray_ ![Method][meth]
Returns an array of all values found in an object (object values are returned as objects and are not cut up any further). Kind of works like an object to array converter.

####jsonQuery.allObjValuesAsArray(obj)

* **Parameters:**
    * obj (Object) an ordinary key-value object (nested is allowed)
* **Returns:**
    * (Array) a set of all values found in an object, now stored in an array

```JavaScript
// Write to the console all values found in the outer object
var myObj = {dad: {name: "Bob", city: "London", age: 35}, mom: {name: "Lisa", city: "Cambridge", age: 41}};		
$log.log( jsonQuery.allObjValuesAsArray(myObj) );
```
###_getArrayIndexByObjValue_ ![Method][meth]
Returns the index of an array where a value was found in an object after it has been converted to an array.

####jsonQuery.getArrayIndexByObjValue(obj, val);

* **Parameters:**
    * obj (Object) an ordinary key-value object (nested is allowed)
	* val (Any) the value we are looking for
* **Returns:**
    * (Integer) the index of the value after the object was converted to an array

```JavaScript
// tell the console at which index a specific value would be stored if the object where it is found would be an array
var myObj = {name: "Bob", city: "London", age: 35, weight: 87.5, work: "CG Artist"};
var myValue = "87.5";
var theIndex = jsonQuery.getArrayIndexByObjValue(myObj, myValue);
$log.log( "If myObj was converted to an array, the value " + myValue + " would be stored at index: " + theIndex );
```
###_**=== mathy ===**_ ![Property][prop]
The `mathy` service contains a collection of math support functions. To access any of the specific collection of math support functions methods just call collection of math support functions (remember to also add it to the top of the controller) envoking the method one is after.

####**mathy.METHOD(PARAMETER)**

```JavaScript
// write the number of decimals to the console
$log.log( mathy.countDecimals(7.456) );
```
###_countDecimals_ ![Method][meth]
Returns the number of decimals in a float number.

####mathy.countDecimals(theValue)

* **Parameters:**
    * theValue (Float) the decimal number being investigated
* **Returns:**
    * (Integer) the number of decimals the provided value containes

```JavaScript
// write the number of decimals in this value of pi to the console
$log.log( mathy.countDecimals(3.141592653589793) );
```
###_getRotationDegrees_ ![Method][meth]
Returns the rotation in degrees of a specified jquery element.

####mathy.getRotationDegrees(jquery-element)

* **Parameters:**
    * jquery-element (Element Pointer (JQuery)) the element which current rotation is sought after
* **Returns:**
    * (Float) the roatation (in degrees) that the provided JQuery elememnt has

```JavaScript
// print to the console the rotation in degrees which the specified JQuery elelemnt inside the Webble currently has
$log.log( mathy.getRotationDegrees($scope.theView.parent().find("#myInnerElement")) );
```
###_monthDiff_ ![Method][meth]
Returns the number of months between two dates.

####mathy.monthDiff(d1, d2)

* **Parameters:**
    * d1 (Object (Date)) the first start date
	* d2 (Object (Date)) the second end date
* **Returns:**
    * (Integer) the number of months between the two provided dates

```JavaScript
// print to the console the number of months bewteen the specified dates
$log.log( mathy.monthDiff(new Date(1989,11,9), new Date(2001,9,11)) );
```
<a name="slot"></a>
###_**=== Slot ===**_ ![Class][class]
The `Slot` class service is an object instance provider for the class concept of 'Slot'.  
The Slot class service contains a vast range of methods and properties which describes the slot instance in various useful ways.  
One create a new Slot instance with the use of the `new` command. One Creator is provided with seven parameters that will fully initiate the Webble. Some values may be undefined if not used, and some values will be auto generated if needed.
Good to know is that only the unique name, the value, the slot category and the metadata are saved in the JSON configuration file. Other values must be recreated at slot creation (usually during Webble initiation) and are not stored, or manually stored by the Webble developer using `coreCall_CreateCustomWblDef` in the Webble controller.  
If you want a special behavior, like for example a custom gimme, then you override the getValue method for the specified slot instance in your Webble init function at slot creation time. (remember to also add it to the top of the controller). To access any of the specific Slot methods just call them via the Slot instance (created with `new`) and then envoke the method one is after.

####**new Slot(sName, sValue, sDispName, sDispDesc, sCat, sMetaData, sElementPntr)**

* **Creator Parameters:**
    * sName (String) the name of the slot
	    * Unique name (within the Webble instance)
	* sValue (Any) the value of the slot
	    * The initiating value type, will set the Slot on the path, trying its best to keep it to that type
		* `undefined` and `null` are also allowed (though rarely used or needed)
	* sDispName (String) a readable descriptive name of the slot for external display
	    * If not assigned, the Slot will use its sName also as sDispName
	* sDispDesc (String) a deeper description of the slot and its purpose
	    * May be left out, but strongly discouraged, since this is the only way for a user to understand the slot
	* sCat (String) the category definition name of the slot
	    * Custom grouping name in order to sort slots nicely in the property form
	    * Usually set to the Webble template id `$scope.theWblMetadata['templateid']`
		* Can be empty string
	* sMetaData (Object) the metadata of the slot with various custom and slot value type specific content 
	    * e.g. `{inputType: Enum.aopInputTypes.[INPUT TYPE]}` (See Enum Service for details for options)
		* Study the Webble template controller template for further details of available metadata content
		* metadata may, and is often, undefined, since the Slot usually can guess pretty well on its own what to do
		* a Webble template developer can add custom slot metadata for all internal use (which is also stored)
	* sElementPntr (Element Pointer) the element pointer to the element where a CSS-related slot connects its value
		* Usually never set to anything except `undefined`, since this is only needed by CSS slots and they are usually auto generated. (see the Webble template controller template for further details on how to auto create CSS related slots)

```JavaScript
// Create a new slot instance and add it to the webbles slot list
$scope.addSlot(new Slot('msg',
	"Hello Webble",
	"Message",
	"Text displayed on the Webble",
	$scope.theWblMetadata['templateid'],
	undefined,
	undefined
));
```
###_getName_ ![Method][meth]
Returns the unique name of the slot instance.

####[slotInstance].getName()

* **Parameters:**
    * None
* **Returns:**
    * (String) the unique name of the slot

```JavaScript
// Iterate over all slots and print their name to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getName() );
}
```		
###_setName_ ![Method][meth]
Let you assign a new name to the slot, if ever requested, though probably not.

####[slotInstance].setName(newSlotName)

* **Parameters:**
    * newSlotName (String) the name of the slot
* **Returns:**
    * Nothing

```JavaScript
// Reassign the name of a slot
$scope.getSlot("mySlot").setName("yourSlot");
```	
###_getValue_ ![Method][meth]
Returns the value of the slot instance. (Rarely used outside the inner core, instead one should use `$scope.gimme("SLOT-NAME")` for retrieving slot values, but if, for some reason, one need to access the slot value on this fundamental level, this is the method to use)

####[slotInstance].getValue()

* **Parameters:**
    * None
* **Returns:**
    * (Any) the value of the slot, whatever it might be

```JavaScript
// Iterate over all slots and print their value to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getValue() );
}
```	
###_setValue_ ![Method][meth]
Let you assign a new value to the slot. (Should be used with enormous care, since it is kind of bypassing the Webble core system, where one would use the `$scope.set("SLOT-NAME", NEW VALUE)` for setting new slot values, while when assigning a slot directly with `setValue` non of the Webbles other systems trigger, like slot connections or slot change events (as designed). Having said that, there sometimes are reasons where one would want exactly that to happen, change a slot value secretely kind of, and if so, then this is the method to use)

####[slotInstance].setValue(newValue)

* **Parameters:**
    * newValue (Any) whatever the new value should be
	    * The initial value set at slot creation, will always dictate the value type, and therefore affect any new values being assigned, converting it to the original type. 
* **Returns:**
    * Nothing

```JavaScript
// Reassign the value of a slot
$scope.getSlot("mySlot").setValue(42);
```	
###_getCategory_ ![Method][meth]
Returns the category of the slot instance.

####[slotInstance].getCategory()

* **Parameters:**
    * None
* **Returns:**
    * (String) the category group name id for the slot

```JavaScript
// Iterate over all slots and print their category to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getCategory() );
}
```	
###_setCategory_ ![Method][meth]
Let you assign a new category to the slot.

####[slotInstance].setCategory(newCat)

* **Parameters:**
    * newCat (String) the new catgory name
* **Returns:**
    * Nothing

```JavaScript
// Reassign the category of a slot
$scope.getSlot("mySlot").setCategory("My Best Category");
```	
###_getElementPntr_ ![Method][meth]
Returns the JQuery element pointer of the slot instance, which contains a css style value that is connected with the slot value. (Rarely, if ever, used externally)

####[slotInstance].getElementPntr()

* **Parameters:**
    * None
* **Returns:**
    * (Element Pointer (JQuery)) the element which contains the CSS style value the slot affects

```JavaScript
// Iterate over all slots and print their element pointer to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getElementPntr() );
}
```	
###_setElementPntr_ ![Method][meth]
Let you assign a new JQuery element pointer to the slot. This is never done externally, but all managed internally in the Webble core when auto generating CSS related slots, but if a crazy need ever occurs to assign this manually this is the method to do it with.

####[slotInstance].setElementPntr(newElementPntr)

* **Parameters:**
    * newElementPntr (Element Pointer (JQuery)) the element whose CSS style value should be affected by the slot value
* **Returns:**
    * Nothing

```JavaScript
// Reassign the element Pointer of a slot
$scope.getSlot("mySlot").setElementPntr($scope.theView.parent().find("#SomeOtherWebbleElement"));
```	
###_getDisplayName_ ![Method][meth]
Returns the display name of the slot instance.

####[slotInstance].getDisplayName()

* **Parameters:**
    * None
* **Returns:**
    * (String) the readable nice display name for the slot

```JavaScript
// Iterate over all slots and print their display name to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getDisplayName() );
}
```	
###_getExtDisplayName_ ![Method][meth]
Returns the extended display name of the slot instance. The extended name is the display name followed by the slots unique name within hard brackes like this "Display Name [slotname]".

####[slotInstance].getExtDisplayName()

* **Parameters:**
    * None
* **Returns:**
    * (String) display name and slot name in combination
	    * e.g. "The Best Slot Ever [myBestSlot]"

```JavaScript
// Iterate over all slots and print their extended display name to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getExtDisplayName() );
}
```	
###_setDisplayName_ ![Method][meth]
Let you assign the display name of the slot.

####[slotInstance].setDisplayName(newDisplayName)

* **Parameters:**
    * newDisplayName (String) a new display name
* **Returns:**
    * Nothing

```JavaScript
// Reassign the display name of a slot
$scope.getSlot("mySlot").setDisplayName("A Better Name");
```	
###_getDisplayDescription_ ![Method][meth]
Returns the display description text of the slot instance.

####[slotInstance].getDisplayDescription()

* **Parameters:**
    * None
* **Returns:**
    * (String) the description text of the slot

```JavaScript
// Iterate over all slots and print their description text to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getDisplayDescription() );
}
```	
###_setDisplayDescription_ ![Method][meth]
Let you assign the display description text to the slot.

####[slotInstance].setDisplayDescription(newDisplayDescription)

* **Parameters:**
    * newDisplayDescription (String) the new display description text
* **Returns:**
    * Nothing

```JavaScript
// Reassign the display description text of a slot
$scope.getSlot("mySlot").setDisplayDescription("This slot contains its value in gold");
```	
###_getMetaData_ ![Method][meth]
Returns the metadata of the slot instance.

####[slotInstance].getMetaData()

* **Parameters:**
    * None
* **Returns:**
    * (Object) the meta data object the slot contains
	    * `null` by default (also after being assigned `undefined`)

```JavaScript
// Iterate over all slots and print their metadata object to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getMetaData() );
}
```	
###_setMetaData_ ![Method][meth]
Let you assign metadata to the slot. (Remember to get the current metadata before adding new, in order to avoid loosing any essential metadata the slot already carry). This is usually never called after the slot is created, but the possibility exists. 

####[slotInstance].setMetaData(newMetaData)

* **Parameters:**
    * newMetaData (Object) a new or updated metadata object (with predefined and/or custom keys)
* **Returns:**
    * Nothing

```JavaScript
// Reassign and update the metadata of a slot
var mySlotMetaData = $scope.getSlot("mySlot").getMetaData();
mySlotMetaData["myCustomKey"] = 42;
$scope.getSlot("mySlot").setMetaData(mySlotMetaData);
```	
###_getDisabledSetting_ ![Method][meth]
Returns the current disabled setting of the slot instance. Existing disabled states can be found in the service Enum library for [SlotDisablingState](#SlotDisablingState).

####[slotInstance].getDisabledSetting()

* **Parameters:**
    * None
* **Returns:**
    * (Integer (Enum)) the current disabled state for the slot
	    * default state is 0 (None)

```JavaScript
// Iterate over all slots and print their disabled state to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getDisabledSetting() );
}
```	
###_setDisabledSetting_ ![Method][meth]
Let you assign a new disabled setting to the slot.

####[slotInstance].setDisabledSetting(newDisabledSetting)

* **Parameters:**
    * newDisabledSetting (Integer (Enum)) the new disabled setting
* **Returns:**
    * Nothing

```JavaScript
// Reassign the disabled setting of the slot to not allowed for property form editing
$scope.getSlot("mySlot").setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);
```	
###_getDoNotIncludeInUndo_ ![Method][meth]
Returns the flag of the slot instance which tells whether it should be registered by undo/redo.

####[slotInstance].getDoNotIncludeInUndo()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether slot changes should be registered by the undo/redo system or not

```JavaScript
// Iterate over all slots and print their "Do not include in Redo"-flag to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getDoNotIncludeInUndo() );
}
```	
###_setDoNotIncludeInUndo_ ![Method][meth]
Let you assign the flag of the slot instance which tells whether it should be registered by undo/redo. If set to true the system will not register its activities for undo purposes. (can still be undone but only to the value before the flag was set to false, which might only be its intiation value).

####[slotInstance].setDoNotIncludeInUndo(newDoNotIncludeInUndo)

* **Parameters:**
    * newDoNotIncludeInUndo (Boolean) True or False whether slot changes should be registered by the undo/redo system or not
* **Returns:**
    * Nothing

```JavaScript
// Reassign the "Do not include in Redo"-flag of a slot
$scope.getSlot("mySlot").setDoNotIncludeInUndo(true);
```	
###_getIsCustomMade_ ![Method][meth]
Returns the "Is Custom Made"-flag of the slot instance. Being custom made means basically that the slot was custom created by a user in realtime and was not included in the Webbble templates initial slots. It may also mean that it was a slot being auto generated by the Webble, but at some time after Webble initiation. Custom slots are also stored ans saved in the Webble Definition JSON file. The main difference between custom made and template-made slots are thet the custom made can be deleted by any user via the Webble World interface.

####[slotInstance].getIsCustomMade()

* **Parameters:**
    * None
* **Returns:**
    * (Boolean) True or False whether the slot is custom made or not

```JavaScript
// Iterate over all slots and print their custom-made state to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getIsCustomMade() );
}
```	
###_setIsCustomMade_ ![Method][meth]
Let you assign "Is Custom Made"-flag to the slot. This flag is usually set automatically by the core system and should maybe not be set by the Webble template developer, but if one wish to tamper with this anyway, this is the method to use. (Remember that custom-made slots can be deleted by the Webble user inside the slot property form (but only for the active instance, duplicates will reinvent the slot at initiation)).

####[slotInstance].setIsCustomMade(customMadeState)

* **Parameters:**
    * customMadeState (Boolean) True or False whether the slot is custom made or not
* **Returns:**
    * Nothing

```JavaScript
// Reassign the "custom-made"-state of a slot
$scope.getSlot("mySlot").setIsCustomMade(true);
```	
###_getOriginalType_ ![Method][meth]
Returns the original value-type that the slot was asigned at creation partly based on the type of the value assigned but also based on metadata information. Besides traditional types like `string` and `number`, slots may also be `array`, `date` and `vector` (array with only two values). The main purpose of this attribute is to manage slot changes when a newly assigned slot value is of a different or  ambiguous type which needs to be tweaked or converted to better fit the original idea of the slot. If one expect a slot to contain an array, it would be rather annoying if it suddenly contained something completely different for example. There is not external set method for this attribute, since it is completely handled internally at Slot creation.

####[slotInstance].getOriginalType()

* **Parameters:**
    * None
* **Returns:**
    * (String) the type of a slot value (with some slot enahanced differences from traditional JavaScript)

```JavaScript
// Iterate over all slots and print their X to the console
for(slot in $scope.getSlots()){
	$log.log( $scope.getSlot(slot).getOriginalType() );
}
```
###_**=== strCatcher ===**_ ![Property][prop]
The `strCatcher` service contains a range of english string collections for all CSS related attributes. To access any of the specific strCatcher properties just call strCatcher (remember to also add it to the top of the controller) envoking the strCatcher method one is after (optional including the css definition). Each CSS attribute key is in upper case and without hyphens.

####**strCatcher.PROPERTY_NAME().CSS-DEFINITION**

```JavaScript
// Print the description of the CSS attribute for background-color to the console
$log.log( strCatcher.cssAttrDescs().BACKGROUNDCOLOR );
```
###_cssAttrNames_ ![Method][meth]
Returns a list of all english readable labels for all existing CSS attributes.

####strCatcher.cssAttrNames()

* **Parameters:**
    * None
* **Returns:**
    * (Array (of Strings)) List of english readable names for all CSS attributes

```JavaScript
// Print the label of the CSS attribute for background-color to the console
$log.log( strCatcher.cssAttrNames().BACKGROUNDCOLOR );
```
###_cssAttrDescs_ ![Method][meth]
Returns a list of all english readable descriptions for all existing CSS attributes.

####strCatcher.cssAttrDescs()

* **Parameters:**
    * None
* **Returns:**
    * (Array (of Strings)) List of english readable descriptions for all CSS attributes

```JavaScript
// Print the description of the CSS attribute for background-color to the console
$log.log( strCatcher.cssAttrDescs().BACKGROUNDCOLOR );
```
###_**=== valMod ===**_ ![Property][prop]
The `valMod` service contains a collection of methods that modify or separate values or fix values that was not in correct format. To access any of the specific valMod methods just call valMod (remember to also add it to the top of the controller) envoking the method one is after.

####**valMod.METHOD(PARAMETERS)**

```JavaScript
// Adds `px` behind a numerical value if it needs it before assigning it to the slot (done internally so completely unnecessary operation)
$scope.set("mySlot", valMod.addPxMaybe("mySlot", 42));
```
###_getValUnitSeparated_ ![Method][meth]
When applied to a value (mainly slot values with CSS connection) it will attempt to separate the value from any possible present unit string and return an array with the value and the unit string separated, like for example "23px" --> [23, "px"]. Values that does not confrom to this format just returns rubbish that can be ignored. This method mainly applies to CSS values with units like "px", "em", "%" etc. This method is mainly used internally by the Webble World core, but it is also available for possible external use.

####valMod.getValUnitSeparated(theValue)

* **Parameters:**
    * theValue (Any) the value which is being targeted
* **Returns:**
    * (Array (Vector)) if succeded an array with the value at index 0 and the unit string at index 1
	    * failing separations returns arrays filled with useles trash e.g. `[NaN, "rgb(51, 51, 51)"]` which are supposed to be ignored

```JavaScript
// Iterate over all slots and print their Value-Unit separated version the slot value to the console (no matter of how successful that separation was)
for(slot in $scope.getSlots()){
	$log.log( valMod.getValUnitSeparated($scope.getSlot(slot).getValue()) );
}
```
###_addPxMaybe_ ![Method][meth]
Returns a modified slot value (provided as a parameter together with the slots name (which for success is mainly autogenerated CSS related slot names)). The modification will be the original numerical value with the `px` unit applied to it and returned as a string. This method is mainly used internally by the Webble World core, but it is also available for possible external use. The reason for this service method is to avoid problems with CSS values that must have a unit of some kind e.g. `left`, `top`, `width` etc.

####valMod.addPxMaybe(theName, theVal)

* **Parameters:**
    * theName (String) the name of the slot which holds the value
	* theVal (Float (Any)) The value (which should be numerical for successful modifiation but could be any) where modifcation is being applied upon if needed
* **Returns:**
    * (String) the modified value

```JavaScript
// Adds `px` behind a numerical value if it needs it before assigning it to the slot (bypassing the normal core system).
$scope.getSlot(myNicestWebbleElement:left).setValue(valMod.addPxMaybe("myNicestWebbleElement:left", 42));
```
###_getFormatedDate_ ![Method][meth]
Takes a JavaScript date and returns it as a string formatted to the iso format yyyy-mm-dd.

####valMod.getFormatedDate(inDate)

* **Parameters:**
    * inDate (Object (Date)) any JavaScript date
* **Returns:**
    * (String) date in iso format yyyy-mm-dd

```JavaScript
// Print the current date in iso-format yyyy-mm-dd to the console 
$log.log(valMod.getFormatedDate(Date.now()));
```
###_fixBrokenObjStrToProperObject_ ![Method][meth]
Takes a string which failed being parsed into a json object, tries to fix and mend it and create a proper object and then return it. If the method fails the attempt it will return an empty object `{}`. Mainly used internally to fix crazy custom managed slot values, but is also available externally.

####valMod.fixBrokenObjStrToProperObject(strToFix)

* **Parameters:**
    * strToFix (String) a string that might be possible to convert into a JSON object
* **Returns:**
    * (Object) a JSON object with all keys and values in its proper place
	    * If the method fails an empty object `{}` is returned

```JavaScript
// print to the console a proper converted Object fixed from an object-like string
var objStr = "{steve:42,john:78,anna:27}";
try{
	$log.log(JSON.parse(objStr));
	$log.log("JSON Parsed!");
}
catch(e){
	$log.log("JSON Failed...");
	var fixedVal = valMod.fixBrokenObjStrToProperObject(objStr);
	if(!isEmpty(fixedVal)){
		$log.log("...But Webble World Parsing succeded!");
		$log.log( fixedVal );
	}
	else{
		$log.log("All parsing attempts failed!");
	}
}
```
###_fixBrokenArrStrToProperArray_ ![Method][meth]
Takes a string which failed being parsed into an array, tries to fix and mend it and create a proper array and then return it. If the method fails the attempt it will return an empty array `[]`. Mainly used internally to fix crazy custom managed slot values, but is also available externally.

####valMod.fixBrokenArrStrToProperArray(strToFix)

* **Parameters:**
    * strToFix (String) a string that might be possible to convert into an array
* **Returns:**
    * (Array) an array with all values and indexes in its proper place
	    * If the method fails an empty array `[]` is returned

```JavaScript
var arrStr = "chocolate,vanilla,strawberry";
try{
	$log.log(JSON.parse(arrStr));
	$log.log("JSON Parsed!");
}
catch(e){
	$log.log("JSON Failed...");
	var fixedVal = valMod.fixBrokenArrStrToProperArray(arrStr);
	if(!isEmpty(fixedVal)){
		$log.log("...But Webble World Parsing succeded!");
		$log.log( fixedVal );
	}
	else{
		$log.log("All parsing attempts failed!");
	}
}
```
###_urlify_ ![Method][meth]
Takes a text string and and adds html link-tags `<a></a>` around any url-addresses found inside the provided text and returns the new and improved version for web display with clickable links.

####valMod.urlify(text)

* **Parameters:**
    * text (String) a text string with possible url links in it
* **Returns:**
    * (String) a text where all urls are fixed for html display with surrounding `<a>` tags

```JavaScript
// takes a text with containing urls and make it ready for html display with clickable links (and print the result to the console)
var theTxt = "If you want to study something on your own, then https://www.khanacademy.org/ is a good place to go."
$log.log( valMod.urlify(theTxt) );
```
###_urlifyWithImages_ ![Method][meth]
Takes a text string and and adds html link-tags `<a></a>` around any url-addresses found inside the provided text and create img tags for links that are images `<img />`, and returns the new and improved version for web display with clickable links and visible images.

####valMod.urlifyWithImages(text)

* **Parameters:**
    * text (String) a text string with possible url links in it (including image urls)
* **Returns:**
    * (String) a text where all urls are fixed for html display with surrounding `<a>` tags and images with `<img>` tags

```JavaScript
// takes a text with containing urls & image links and make it ready for html display with clickable links and visible images (and print the result to the console)
var theTxt = "If you http://www.clipartkid.com/images/531/pix-for-pointing-at-you-clipart-hk5GgR-clipart.png want to study something on your own, then https://www.khanacademy.org/ is a good place to go."
$log.log( valMod.urlifyWithImages(theTxt) );
```
###_SlimTextFromLinksAndHtml_ ![Method][meth]
Takes a text string and and removes any url links and images and replace them with short info about their existance and returns the new and improved and slimmer version.

####valMod.SlimTextFromLinksAndHtml(text)

* **Parameters:**
    * text (String) a text string with possible url links an image urls in it
* **Returns:**
    * (String) a slimmer version than the provided text that has stripped away any links and images
	    * removed links are replaced with "[LINK]" and removed images are replaced with "[IMAGE]"

```JavaScript
// print to the console a slimmed down text without any possible urls and image links.
var theTxt = "If you http://www.clipartkid.com/images/531/pix-for-pointing-at-you-clipart-hk5GgR-clipart.png want to study something on your own, then https://www.khanacademy.org/ is a good place to go."
$log.log( valMod.SlimTextFromLinksAndHtml(theTxt) );
```
###_findAndRemoveValueInArray_ ![Method][meth]
Iterates through a provided array and if the specified value is found, it is removed and the adjusted array is then returned.

####valMod.findAndRemoveValueInArray(theArray, theValue)

* **Parameters:**
    * theArray (Array) the array that is being investigated
	* theValue (Any) the value which is being removed, if found
* **Returns:**
    * (Array) the new and changed array where the provided value has been removed, if it was found

```JavaScript
// take an array and remove one value if it exists and then print the resulting array to the console
var myArr = ["chocolate", "vanilla", "strawberry", "mango", "banana"];
$log.log( valMod.findAndRemoveValueInArray(myArr, "mango") );
```
###_**=== wwConsts ===**_ ![Property][prop]
The `wwConsts` service contains a range of useful constants for quicker and more structured and readable coding. To access any of the specific wwConsts objects just call wwConsts (remember to also add it to the top of the controller) envoking the wwConsts object one is after and then the wwConsts item available in that enum list.

####**wwConsts.CONSTANT_NAME**

```JavaScript
// Iterates over the default font family list and print each name to the console
for(var i = 0; i < wwConsts.defaultFontFamilies.length; i++){
	$log.log(wwConsts.defaultFontFamilies[i]);
}
```
###_palette_ ![Property][prop]
Returns an array of carefully selected mix of colors to be used in various settings and situations. The palette contains 16 colors in the following order: red, blue, purple, magenta, darkgreen, orange, black, lightgreen, cyan, brown, grey, pink, yellowgreen, yellow, lightpink and olive. The color names are CSS3 compatible.

####wwConsts.palette

* **Returns:**
    * (Array(of Objects)) Each object contains a color-name and a color-value (as a hexadecimal (#ffffff))
	    * e.g. {name: "red", value: "#ff0000"}

```JavaScript
// Change the color-slot every 3 seconds using the palette constant
var colorIndex = 0;
var changeColor = function(){
	if(colorIndex > 15){ colorIndex = 0; }
	$scope.set("MyColorSlot", wwConsts.palette[colorIndex++].value);
	$timeout(changeColor, 300);
};
```
###_lightPalette_ ![Property][prop]
Returns an array of carefully selected mix of lighter colors to be used in various settings and situations. The light palette contains 16 light colors in the following order: webble world yellow (wblWrldYellow), pink, LightSalmon, Coral, BurlyWood, Chocolate, LightSkyBlue, Aquamarine, PaleGreen, Plum, MistyRose, LightCyan, Silver, PeachPuff, LightSteelBlue and Tomato. Except for the first color (Webble World Yellow) the other color names are CSS3 compatible.

####wwConsts.lightPalette

* **Returns:**
    * (Array(of Objects)) Each object contains a color-name and a color-value (as a hexadecimal (#ffffff))
	    * e.g. {name: "wblWrldYellow", value: "#FFF68F"}

```JavaScript
// Change the color-slot every 3 seconds using the light palette constant
var colorIndex = 0;
var changeColor = function(){
	if(colorIndex > 15){ colorIndex = 0; }
	$scope.set("MyColorSlot", wwConsts.lightPalette[colorIndex++].value);
	$timeout(changeColor, 300);
};
```
<a name="languages"></a>
###_languages_ ![Property][prop]
A small subset of avilable languages, where some are present inside Webble World, which contains language code, language name in english and in the language itself and the phrase "Change Language" in each language. This is mainly used internally, but it is there to use also for Webble developers if ever needed. The language codes are the international recognized codes. Following languages are included: English, Swedish, Japanese, German, Finnish, French, Russian, Hebrew, Greek and Spanish.

####wwConsts.languages

* **Returns:**
    * (Array (of Objects)) each object have a set of language describing keys
	    * e.g. {code: "sv", NativeName: "Svenska", EnglishName: "Swedish", ChangeStr: "Ändra Språk"},

```JavaScript
// Tell the console how to say "Change Language" in Swedish
for(var i = 0; i < wwConsts.languages.length; i++){
	if(wwConsts.languages[i].code == "sv"){
		$log.log("In Swedish the phrase 'Change language' looks like this: '" + wwConsts.languages[i].ChangeStr + "'.");
	}
}
```
###_defaultFontFamilies_ ![Property][prop]
Returns a list of the names for the default font families supported by most browsers and which Webble World also fully support withou any additional downloads. The names are CSS3 compatible.

####wwConsts.defaultFontFamilies

* **Returns:**
    * (Array(of Strings)) each item is just a string name of the font family

```JavaScript
// Iterates over the default font family list and print each name to the console
for(var i = 0; i < wwConsts.defaultFontFamilies.length; i++){
	$log.log(wwConsts.defaultFontFamilies[i]);
}
```
###_**=== Solo Service Collection ===**_ ![Property][prop]
Here follow a set of single services with only one method and task where each one has to be added separately to the top of the controller if being used.

<a name="fromKeyCode"></a>    
###_fromKeyCode_ ![Method][meth]
Simple service that returns the name of a key on the keyboard based on the key code value. (remember to also add it to the top of the controller).

####fromKeyCode(keycode)

* **Parameters:**
    * keycode (Integer) The key code for a specific key, usually provided from a key down event
* **Returns:**
    * (String) a name of a key board key
	    * e.g. 'Down Arrow' (from key code: 40)

```JavaScript
// Tells the console which key has a certain key code
var keyCode = 27;
$log.log( "The key with key-code " + keyCode + " is the " + fromKeyCode(27) + " key." );
```
###_getKeyByValue_ ![Method][meth]
A service which takes an associative array and a value and returns the name of the key containing that value, or if not found, returns null. (remember to also add it to the top of the controller)
	
####getKeyByValue(object, value)

* **Parameters:**
    * object (Object) any object with a set of keys and values
	* value (Any) any value that might be found in the object parameter
* **Returns:**
    * (String) the name of the key which contained the value provided as a parameter

```JavaScript
// write to the console the key name for the current selection state of the Webble
$log.log( getKeyByValue(Enum.availableOnePicks_SelectTypes, $scope.getSelectionState())  );
```
###_getTimestamp_ ![Method][meth]
Returns a unix like time stamp value. (useful for e.g. unique identifiers). (remember to also add it to the top of the controller).

####getTimestamp()

* **Parameters:**
    * None
* **Returns:**
    * (Float) a large numerical value based on the current exact time (in ms) (therefore unique)

```JavaScript
// tell the timestamp value to the console 
var myTimeStamp = getTimestamp();
$log.log( "My Time Stamp: " + myTimeStamp );
```
###_getUrlVars_ ![Method][meth]
Simple service that returns an object containing the URL parameters from the current URL. (remember to also add it to the top of the controller).

####getUrlVars()

* **Parameters:**
    * None
* **Returns:**
    * (Object) object containing the URL parameters as keys with their values as value, from the current URL
	    * e.g. {webble: "genericCharts", workspace: "57ea3170cd612d24248ca7a4"}

```JavaScript
// Print to the console all current URL parameters and their values
$log.log( getUrlVars() );
```
###_isEmpty_ ![Method][meth]
A service that checks weather an object, string or array is empty or not. (remember to also add it to the top of the controller).

####isEmpty(obj)

* **Parameters:**
    * obj (Any) a string, object or array that is being tested for being empty
* **Returns:**
    * (Boolean) True or False whether the provided parameter was empty or not

```JavaScript
var myArr = ["chocolate", "vanilla", "strawberry", "mango", "banana"], myObj = {}, myStr = "";
$log.log( " myArr is empty: " + isEmpty(myArr) + "\n myObj is empty: " + isEmpty(myObj) + "\n myStr is empty: " + isEmpty(myStr) );
```
###_isSafeFontFamily_ ![Method][meth]
Simple service that tests if the provided font name is a safe and a known one (part of the default) and returns the result. (remember to also add it to the top of the controller).

####isSafeFontFamily(fontFamilyNameToTest)

* **Parameters:**
    * fontFamilyNameToTest (String) the name of the font family
* **Returns:**
    * (Boolean) True or False whether the font is safe or not

```JavaScript
// Tells the console whether the fon "Georgia" is a safe font to use in the browser
var fontFamily = "Georgia";
$log.log( fontFamily + " is a safe font to use: " + isSafeFontFamily(fontFamily) );
```
###_isValidEnumValue_ ![Method][meth]
A service which tests that a specified value is contained within the range of values inside a specific Enum (or other object) value collection. Values are validated both by key name and/or by key value. (remember to also add it to the top of the controller)
	
####isValidEnumValue(enumToTest, valueToTest)

* **Parameters:**
    * enumToTest (Object) the set of key-values that is being tested 
	* valueToTest (Any) a value to test against
* **Returns:**
    * (Boolean) True or False whether the value was present or not

```JavaScript
// Tell the console if a specifc value is valid for exec mode settings
var whatValue = 7
$log.log( whatValue + " is a valid exec mode value: " + isValidEnumValue(Enum.availableOnePicks_ExecutionModes, whatValue) );
```
###_isValidStyleValue_ ![Method][meth]
A service that tests if a specified style value within a specified style setting is a valid option. (remember to also add it to the top of the controller).

####isValidStyleValue(styleToTest, possibleStyleValue);

* **Parameters:**
    * styleToTest (String) the name if the style being tested
	    * e.g. "margin-left"
	* possibleStyleValue (Any) the value which will attempted to apply on the provided css style
* **Returns:**
    * (Boolean) True or False whether the value is valid or not

```JavaScript
// tells the console whether a specific value is valid for a specific css style
var theStyle = "background-color", theValue = "#ff00ff";
$log.log( theValue + " is a valid value for the css style of " + theStyle + ": " + isValidStyleValue(theStyle, theValue) );
```
<!------------------------------------------------------------------------------------------------------------------->
##Filters
With AngularJS **Filters** one can alter and modify any value in many powerful ways with ease and speed, and it is recommended to
that webble template developers create filters of their own to empower their Webbles. But the platform has a few ones available too, that might be useful. Filters can eather be accessed as traditional AngularJS filters in HTML `{{ INPUT | FILTER }}` or via JavaScript as a method using the `$filter` keyword `$filter('FILTER-NAME')(PARAMETERS)`.

###_bitwiseAnd_ ![Method][meth]
A bitwise test filter that returns true or false if a bit-flag is set or not

####IN JS:$filter("bitwiseAnd")(firstNumber, secondNumber);     IN HTML: {{ firstNumber | bitwiseAnd : secondNumber }}

* **Parameters:**
    * firstNumber (Integer (bitwise)) the set of bit-flags where one flag will be tested for being on or off
	* secondNumber (Integer (bitwise)) the exact bit-flag which the first set of flags will be compared with.
* **Returns:**
    * (Boolean) True or False whether the targeted bit-flag is On or Off.

```JavaScript
// test if the webble is protected against a specific protection type
var wblProtections = $scope.getProtection();
var testFlag = Enum.bitFlags_WebbleProtection.DELETE;
var theFlagTest = $filter("bitwiseAnd")(wblProtections, testFlag);
$log.log("This Webble is protected from 'Deletion': " + theFlagTest);
```
###_nativeName_ ![Method][meth]
Takes an international language code and returns the readable _native_ name of that language. Not all languages are available, only those represented in the [languages](#languages) method of the `wwConst` service .

####IN JS: $filter("nativeName")(langCode) ... IN HTML: {{ "langCode" | nativeName }}

* **Parameters:**
    * langCode (String) international language code
	    * en = english, sv = swedish, fi = finnish etc.
* **Returns:**
    * (String) the native name of the language provided as parameter

```JavaScript
// Print to the console the native name of the specified language provided as language code
var langCode = "sv";
$log.log( $filter('nativeName')(langCode) );
```
###_nativeString_ ![Method][meth]
Takes an international language code and returns the readable sentence for the phrase "Change To LANG" in the native text of that language where LANG is the native name of the specified language. Not all languages are available, only those represented in the [languages](#languages) method of the `wwConst` service .
	
####IN JS: $filter("nativeString")(langCode) ... IN HTML: {{ "langCode" | nativeString }}

* **Parameters:**
    * langCode (String) international language code
	    * en = english, sv = swedish, fi = finnish etc.
* **Returns:**
    * (String) the native phrase for "Change to LANG" where LANG is the native name of the language provided as parameter

```JavaScript
// Print to the console the native phrase "Change to LANG" of the specified language provided as language code
var langCode = "sv";
$log.log( $filter('nativeString')(langCode) );
```
###_stringFormat_ ![Method][meth]
Takes a text and a set of dynamic values and returns the formatted string where the dynamic values have been properly merged within the text. 

####IN JS: $filter("stringFormat")(template, values);     IN HTML: {{ template | stringFormat : [value1, value2, etc] }}

* **Parameters:**
    * template (String) String with parameter placeholders inside it
	    * e.g. "This is {0} stringformat string that I made {1}.", ["my", "myself"] (the values in the array can be dynamic variables)
	* values (Array) the values that will be replacing the placeholders in the text
* **Returns:**
    * (String) the correct formatted string

```JavaScript
// print to the console a text with dynamic place holders
var theTxt = "This is {0} stringformat-string that {1} made {2}.";
var theReplacementVals1 = ["my", "I", "myself"];
var theReplacementVals2 = ["Zlatan's", "he", "himself"];
$log.log($filter("stringFormat")(theTxt, theReplacementVals1));
$log.log($filter("stringFormat")(theTxt, theReplacementVals2));
```
<!------------------------------------------------------------------------------------------------------------------->
##Extra Additional
Additional methods/Properties/Dynamic Objects that are not located anywhere above, but is still within the system and can be used by any Webble developer if needed. Currently only one such support function exists.

###_BrowserDetect_ ![Property][prop]
A dynamicly generated system property that contains information about the current browser, device version and Operating System for the current Webble user.

Available Information Keys are:

* browser
* version
* OS
* device

####BrowserDetect

* **Parameters:**
    * None
* **Returns:**
    * (Object) a set of keys which informs about the users browser, device and OS

```JavaScript
// Tell the console what the current computer device is, in more details. 
var sys = BrowserDetect;
$log.log("This is a " + sys.device + ", running on " + sys.OS + " using browser " + sys.browser + " of version " + sys.version + ".");
```

[prop]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-P-icon.png
[meth]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-M-icon.png
[dir]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-D-icon.png
[enum]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-E-icon.png
[class]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-C-icon.png
[ioposinfo]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/ioPosInfo.png
