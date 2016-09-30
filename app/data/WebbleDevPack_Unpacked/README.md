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
###_theInteractionObjects_ ![Property][prop]
Contains a list of [Interaction object](#io) pointers (colored balls around the Webble border which gives the user the power to interact with the webble more easy)

####theInteractionObjects

* **Get & Set:**
    * (Array) interaction object instance pointers for accessing their internals

```JavaScript
// Disables the Interaction Object with index value 6
$scope.theInteractionObjects[6].scope().setIsEnabled(false);
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
###_registerWWEventListener_ ![Method][meth]
Registers an event listener for a specific event (see [availableWWEvents](#availableWWEvents)) for a specific target (self, other or all) (targetData can be set for slotChange as a slotName to narrow down event further but not used for other events) and the callback function the webble wish to be called if the event fires. The callback function will then be handed a datapack object containing needed information to react to the event accordingly. All callback functions are sent a datapack object as a parameter when they fire which includes different things depending on the event. The targetId post in these datapacks are only useful when the webble are listening to multiple webbles with the same callback. If targetId is undefined the webble will be listening to itself, or if the targetId match an existing Webble then that will be listened to, and if the targetId is set to NULL it will listen to all webbles.

**Returning Data for each event type**

* slotChanged: {targetId: [Instance Id for webble getting slot changed], slotName: [Slot Name], slotValue: [Slot Value], timestamp: [a chronological timestamp value]}
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
	* targetData (String) Only used with slotChanged event and then is the name of the slot being listened to (if only one is enough)
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
    
<!------------------------------------------------------------------------------------------------------------------->
##Platform
The **Platform** is the actual Webble World environment and it includes many helpful methods to access sections of the
system and specific Webbles. Also in this case it is reached from within the `$scope` of the Webble-template.

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

    
    $scope.getPendingChild();

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
$scope.downloadWebbleDef("genericCharts", function(newWbl){
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
###_requestDeleteWebble_ ![Method][meth]
Deletes a specified webble from the system. (the last (optional) parameter is a function that will be called when the job is done)

####requestDeleteWebble(target, callbackFunc)

* **Parameters:**
    * target (Webble Pointer) the Webble that is targeted for the operation
	* callbackFunc (Function) Callback function that will be called when the Webble has been deleted
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
###_altKeyIsDown_ ![Property][prop]
Boolean Flag for the ALT key on the Keyboard, weather it is currently pressed or not. Can also be set for simulating key press within the platform.

####altKeyIsDown

* **Get & Set:**
    * (Boolean) True or False whether the key is down or not

```JavaScript
// Tells the console if the ALT key is pressed or not
$log.log("The ALT key is down: " + $scope.altKeyIsDown);
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
###_ctrlKeyIsDown_ ![Property][prop]
Boolean Flag for the CTRL key on the Keyboard, weather it is currently pressed or not. Can also be set for simulating key press within the platform.

####ctrlKeyIsDown

* **Get & Set:**
    * (Boolean) True or False whether the key is down or not

```JavaScript
// Tells the console if the CTRL key is pressed or not
$log.log("The CTRL key is down: " + $scope.ctrlKeyIsDown);
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
###_debugValue.txt_ ![Property][prop]
If one is debugging, and one wants to display a text in the menu section where "debug Logging On" is displayed, one can use this variable.

####debugValue.txt

* **Get & Set:**
    * (String) any optional text
	
```JavaScript
// Sets the debugValue.txt to the Webbles "MySlot" slot value
$scope.debugValue.txt = $scope.gimme("MySlot");
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
<!------------------------------------------------------------------------------------------------------------------->
<a name="services"></a>
##Services
In the **Services** can be found multiple help functions and support methods along with various providers of data of all
sorts. If one want to use a service in a Webble the name of the service must be included at the top of the controller 
function declaration (e.g. `Enum` or `wwConst` etc.). The ones that could be of interest for a Webble-template developer, besides the ones he/she would create themselves inside the template, are the following.

<a name="enum"></a>
###_Enum_ ![Property][prop]
The `Enum` service contains numerous enumaration lists for quicker and more structured and readable coding. To access any of the specific Enum obejcts just call Enum (remember to also add it to the top of the controller) envoking the enum object one is after and then the enum item available in that enum list.
e.g. `if ( $scope.getCurrentExecutionMode() == Enum.availableOnePicks_ExecutionModes.HighClearanceUser ) { alert("Good for you!"); }`

####Enum.ENUM_OBJECT_NAME.ENUM_OBJECT_ITEM_NAME

<a name="availablePlatformPotentials"></a>
#####Enum.availablePlatformPotentials
Available Platform states has mainly to do with access to the Webble World Service and Database, and is therefore hardly never needed for a Webble developer to be concerned about, but it does exist. It can be set only from the server and internally by server admins.

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
#####Enum.aopForms
Available forms and modal windows that can be opened and displayed inside Webble World.

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


    
    // Default Interaction objects that all webbles share
    Enum.availableOnePicks_DefaultInteractionObjects
    { Menu: 0, Rotate: 1, Resize: 2, AssignParent: 3 }

    // Tooltip Text for default Interaction objects that all webbles share
    Enum.availableOnePicks_DefaultInteractionObjectsTooltipTxt
    { Menu: gettext("Open Menu"), Rotate: gettext("Rotate"), Resize: gettext("Resize"), AssignParent: gettext("Assign Parent") }

<a name="availableOnePicks_DefaultWebbleMenuTargets"></a>

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

<a name="availableOnePicks_ExecutionModes"></a>

    // The different execution modes the webble world can be set to
    Enum.availableOnePicks_ExecutionModes
    { Developer: 0, Admin: 1, SuperHighClearanceUser: 2, HighClearanceUser: 3, MediumClearanceUser: 4, LowClearanceUser: 5 },

    // Text for the different execution modes the webble world can be set to
    Enum.availableOnePicks_ExecutionModesDisplayText
    { Developer: gettext("Developer"), Admin: gettext("Admin"), SuperHighClearanceUser: gettext("Super High Clearance User"),
      HighClearanceUser: gettext("High Clearance User"), MediumClearanceUser:  gettext("Medium Clearance User"),
      LowClearanceUser:  gettext("Low Clearance User") }

<a name="availableOnePicks_SelectTypes"></a>

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
    
<a name="bitFlags_PlatformConfigs"></a>	
	
	//Used for settings and configuraions of the platform environment
        // [Bitwise Flags]
        bitFlags_PlatformConfigs: {
            None: 0,
            PlatformInteractionBlockEnabled: 1,
            MainMenuVisibilityEnabled: 2,
            PopupInfoEnabled: 4,
            autoBehaviorEnabled: 8
        },
	
<a name="bitFlags_PlatformStates"></a>		
	
    //Used for keeping track what the platform is doing [Bitwise Flags]
    Enum.bitFlags_PlatformStates
    { None: 0, WaitingForParent: 1, WaitingForAllSelect: 2 }

    //Used for keeping track if a slot is disabled in some way or another (higher values include all lower ones)
    Enum.SlotDisablingState
    { None: 0, PropertyEditing: 1, PropertyVisibility: 2, ConnectionVisibility: 4, AllVisibility: 8 }

<a name="bitFlags_WebbleConfigs"></a>

    // The different types of available webble metadata [Bitwise Flags]
    Enum.bitFlags_WebbleConfigs
    { None: 0, IsMoving: 2, NoBubble: 4 }

    // The different protections that can be set on a webble [Bitwise Flags] (See Webble Protection in a live Webble for further details)
    
<a name="bitFlags_WebbleProtection"></a>    
    
    Enum.bitFlags_WebbleProtection
    { NO, MOVE, RESIZE, DUPLICATE, SHAREDMODELDUPLICATE, DELETE, PUBLISH, PROPERTY, PARENT_CONNECT, CHILD_CONNECT, 
      PARENT_DISCONNECT, CHILD_DISCONNECT, BUNDLE, UNBUNDLE, DEFAULT_MENU, INTERACTION_OBJECTS, SELECTED, POPUP_MENU,
      NON_DEV_HIDDEN, DRAG_CLONE, BUNDLE_LOCKED, EXPORT }
                                            
<a name="availableWWEvents"></a>    											
											
    // The different Webble World Events that a Webble can listen to  
    Enum.availableWWEvents
    { slotChanged: 0, deleted: 1, duplicated: 2, sharedModelDuplicated: 3, pasted: 4, gotChild: 5, peeled: 6, 
      lostChild: 7, keyDown: 8, loadingWbl: 9, mainMenuExecuted: 10, wblMenuExecuted: 11 }


* **Parameters:**
    * ()
* **Returns:**
    * ()

```JavaScript
// 

```

      
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

<a name="fromKeyCode"></a>    

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
[dir]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/Letter-D-icon.png
[ioposinfo]: https://raw.githubusercontent.com/truemrwalker/wblwrld3/master/app/images/icons/ioPosInfo.png
