This describes how to connect visualization components to the data source Webble.

The data files are in general expected to be very large, so the data
is not put into any slot. The only way to access the data is through
code.

--------------------------------------------------------------------------------
------------------------------- Drag & Drop ------------------------------------
--------------------------------------------------------------------------------

The data source lists all available data fields with some extra
information (data types, number of items). These are draggable, and
one way to connect visualization components to the data source is to
drag these list items from the data source and drop them on
visualization Webbles (if they have been written to understand what
this means).

The drop event calls a function that takes two arguments, the event
(which has information regarding the component that received the drop)
and the user interface element that is the source (in this case the
data source). The second argument has an ID field that contains the
relevant information from the data source, which can be accessed like
this:

  $scope.theView.find('.dropReceiver').droppable({ 
    tolerance: 'pointer',
    drop: function(e, ui){
      if(e.target.id == "dropReceiver") {
        e.preventDefault();

	dataDropped(ui.draggable.attr('id')); // ui.draggable.attr('id') contains information from data source
      }}});

To access the Webble and set up connections between the visualization
Webble and the data source, things like these can be done
(dataSourceInfo is the ui.draggable.attr('id') from above):

  var srcWebble = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID); // getting the data source Webble
  var accessorFunctionList = srcWebble.scope().gimme(dataSourceInfo.slotName); // this slot lists functions for all the data fields provided (this slot is normally called 'DataAccess')
  var accessorFunctionsForDroppedField = accessorFunctionList[dataSourceInfo.fieldIdx]; // the functions for the field that was dragged and dropped
  var displayNameSource = dataSourceInfo.sourceName; // what the data source thinks it should be called in menus etc.
  var displayNameField = dataSourceInfo.fieldName; // what the data source thinks the data field should be called

--------------------------------------------------------------------------------
------------------------------- Using the data ---------------------------------
--------------------------------------------------------------------------------

Assuming we have a data source Webble and a data field that we want to
access the data from (which we may get by Drag&Drop or by a user
looking in the 'DataAccess' slot and doing things manually, or some
other way the visualization component implements itself), this is
what we need to do.

  var w = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID); // get hold of the Webble if we do not already have that
  var ls = w.scope().gimme(dataSourceInfo.slotName); // the slotname is normmal 'DataAccess'

  var fieldInfo = ls[srcIdx]; // here 'srcIDx' is the index of the data field we want to access
  var types = fieldInfo.type; // this is a list of types that the data fits, normally only one or two items (e.g. ["date", "number"], ["latitude", "number"], ["string"])
  var listeningFunction = fieldInfo.listen; // this is a function to call if we want to start listening for updates whenever subsets of data are selected
  var valueFunction = fieldInfo.val;  // this function tells us the value of data item
  var selectionStatusFunction = fieldInfo.sel; // this function tells us the selection status of a data item (not selected, selected into subset 1, etc.)
  var size = fieldInfo.size; // this is the number of data items available for this data field
  var pushingFunction = fieldInfo.newSel; // this is a function to call when we want to tell the data source that we have selected (new) subsets of data

  for(var itemIdx = 0; itemIdx < size; itemIdx++) {
      var value = valueFunction(itemIdx); // this can be a string, a 3-dimensional array, a number, a date, etc. depending on the data type
      var subset = selectionStatusFunction(itemIdx); // subset == 0 means that this data item is not selected, other values represent different subsets of data (integers > 0)
 
      if(subset == 0) {
	  // do something, e.g. draw data is washed out colors
      } else {
	  // do something, e.g. visualize the data
      }
  }

--------------------------------------------------------------------------------
------------------------------------- Colors -----------------------------------
--------------------------------------------------------------------------------

The data source also has a slot 'ColorScheme' that has information on
what colors the data source believes are used to visualize the data
(so all visualizations can use the same colors for the same subsets of
data). The slot contents are of this form:

{"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
 "selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
 "groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
           1:{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},
	   2:{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},
	   ...
 }}

"skin" are colors for texts, backgrounds, borders, etc.
"selection" are colors for displaying for example borders around selected areas
"groups" has colors for subset 0, subset 1, etc.
Colors are provided both as a fixed color and as a gradient colors.

--------------------------------------------------------------------------------
----------------------- Listening for data subset selection --------------------
--------------------------------------------------------------------------------

The data source keeps track of what subsets of the data are selected
by all the visualization components currently visualizing data. If we
want to update the visualization based on the user selecting subsets
of data, we can listen for updates of the selection status like this:

  listeningFunction(myInstanceId, true, redrawOnNewSelections, redrawOnNewData, listOfFeaturesWeCareAbout);

'myInstanceId' is the Webble ID, used as an identifier so the data
source can tell different visualization components apart.

The second parameter tells the data source if we want to start (or
keep on) listening ("true") or if we want to stop listening ("false").

'redrawOnNewSelections' and 'redrawOnNewData' are two callback
functions that the data source will call when there are changes to
either the selections of subsets or when new data is loaded.

'listOfFeaturesWeCareAbout' is an array with the indexes of data
features we want to listen to changes on (normally the data fields we
are visualizing).

To stop listening, we can call:

  listeningFunction(myInstanceId, false, null, null, []);

The callback functions will receive one argument, which is a sequence
number so we can tell if this is a new update or the same update as
some other update we have received some other way (for instance
listening to more than one field will normally result in several calls
of the redrawOnNewData function if the user does something that
affects several data fields).

Here are two simple examples of callback functions:

    var lastSeenDataSeqNo = -1;
    function redrawOnNewData(seqNo) {
	if(lastSeenDataSeqNo != seqNo) {
	    lastSeenDataSeqNo = seqNo;
	    checkDataFieldTypesAndParseDataAgain();
	}
    }

    var lastSeenSelectionSeqNo = -1;
    function redrawOnNewSelections(seqNo) {
	if(lastSeenSelectionSeqNo != seqNo) {
	    lastSeenSelectionSeqNo = seqNo;
	    updateGraphics();
	}
    }

--------------------------------------------------------------------------------
----------------------- Pushing your own data subset selections ----------------
--------------------------------------------------------------------------------

If we allow user interactions and want to tell the data source about
what the user has selected using our visualization, we use the
'pushingFunction' from above.

  pushingFunction(myInstanceId, function(idx) { return mySelectionStatus(idx); }, false);

'myInstanceId' is the Webble ID, used to tell different visualization
components apart. This is used to replace our old selections with the
new ones instead of just adding more selections.

The second argument should be a function that takes one argument, the
data item index, and returns 0 if that item is not selected in our
visualization and 1 if it is selected. If we have more than one subset
selected, we can return 0 for data that is not selected and a
different number for each subset (e.g. for some data items we return
1, for data items belonging to another subset we return 2).

The third argument can be set to "true" to indicate that we will very
shortly make one more push of new selections and that the data source
should wait with telling all listeners to redraw the visualizations
until we have pushed the next set of selections too. This can be used
when we are visualizing several data fields at once and make
selections on several of them (e.g. we may allow a user to select an
area on a map where we display both the 'latitude' data field and the
'longitude' data field, so selections will cause calls to the two
pushingFunctions for both of these fields). 

When we stop visualizing data (for instance because we start
visualizing some other data feature instead) we should tell the data
source that our selections are no longer relevant.

  pushingFunction(myInstanceId, null, false);

Here is an example of a function for selection status:

  function mySelectionStatus(idx) {
      if(active) { // we are currently visualizing

	  var value = valueFunction(itemIdx); // the value function from above
	  
	  var groupId = 0;

	  if(value === null) {
	      groupId = nullGroup; // perhaps we have a special group for null values, perhaps we treat them as not selected (i.e. nullGroup = 0)
	  } else {
	      for(var span = 0; span < userSelections.length; span++) {
		  if(userSelections[span].min <= value && userSelections[span].max >= value) {
		      groupId = span + 1;
		  }
	      }
	      if(onlySelectedOrNot) {
		  if(groupId > 1) {
		      groupId = 1;
		  }
	      }
	  }
	  return groupId;
      }
      return 1;
  }

Just changing the behavior of our function ("mySelectionStatus" above)
will change the visualizations of components that happen to redraw
their visualization after we do our changes, but it will not tell
other components that they need to redraw. Calling the pushingFunction
will make sure that all components that are listening are told to
redraw.
