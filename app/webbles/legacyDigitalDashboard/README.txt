---------------------------------------------
OVERVIEW
---------------------------------------------

This is the old version of the "Digital Dashboard" for data
visualization.

There is a re-implementation of most of these components done for the
Hands-on Portal projects. These Webbles are named
"hop[viz|app|data]componentName" and do mostly the same things.


---------------------------------------------
HOW TO SET UP
---------------------------------------------

The Digital Dashboard components expect to be connected in specific
ways. This is how you set it up.

The component called "DigitalDashboard" is expected to be loaded and
to be the parent of all other components.

At least one data loading component is needed. Usually the
"DigitalDashboardSmartDataSource" is a good choice since it can read
several common formats. Load this (or some other data component) and
connect it as a child of the DigitalDashboard by rightclicking on the
DigitalDashboardSmartDataSource, selecting "add parent" and then
clicking on the DigitalDashboard component. The data components load
data in various formats and then present them to the other components
in a standard format so no other component needs to know what the
original format of the data may have been. You can connect more than
one data component and use data from several components at once.

To make something interesting happen, at least one visualization
component is also needed, for example the
"DigitalDashboardPluginScatterPlot". These components should also be
connected to the DigitalDashboard as child components (just like the
data component above).

---------------------------------------------
HOW TO LOAD DATA
---------------------------------------------

Data files from the local system can be loaded by using drag&drop
(dropping files on the "drop data here" part of the data component),
clicking "load file" and browsing to the file, etc. Some components
also allow you to copy-paste data or type data manually directly into
a slot (no file needed).

---------------------------------------------
HOW TO SEND DATA TO VISUALIZATION COMPONENTS
---------------------------------------------

Once at least one data component is connected to the DigitalDashboard,
that component has data loaded, and at least one visualization
component is also connected to the DigitalDashboard, data can be visualized. 

One way to choose what data to visualize in which component is to
right-click on the DigitalDashboard and choose either of the menu
options 'Data -> Visualizations' or 'Visualizations -> Data'. A window
opens where each visualization component is listed with the inputs it
expects before it can start visualizing. 

Some components have different sets of data they can display. For
example the DigitalDashboardPluginBarChart can visualize data with
only one input (for example a set of numerical data) or visualize data
with two inputs (one set with the values, one set with the weights to
give each of the values). If more than one such set is filled with
information on what data to use, the first set will be used.

Each input field can be set to one output field from some data source
component. Only fields with matching data types can be selected.

Once a visualization component has one of its sets of inputs it needs
filled with output fields from some data component (normally, all
fields should/must be from the same data component, though there are
exceptions), the data will be visualized once the form is closed.

Some data components and some visualization components also support
drag&drop of data fields to connect data component outputs to
visualization component inputs. To do this, click and then drag on
field name in the list of data output fields displayed by the data
component. Once this is dragged over the visualization component to
connect to, the visualization component will display different areas
to drop the field name in to connect it to different input fields. If
the data types do not match, no connection will be made, though.

---------------------------------------------
HOW TO INTERACT WITH THE SYSTEM
---------------------------------------------

Once data is visualized, it is possible to select subsets of data and
compare them to each other etc. Most components allow you to
click-and-drag in the visualization to select data. Most components
will remove any old selections and make a new selection if you
click-and-drag and they will keep the old selections and add one more
selection if you hold Ctrl while you click-and-drag.

What happens when there is more than one selection can be set to
treating data as either selected or not-selected, or to display data
in the different selections in different colors. This is changed using
the 'Data -> Visualizations' menu above, where there is a checkbox for
each component to choose if several selection lead to different colors
or not.

Most components have many options to change the look or
behavior. Right-click on a visualization component and open the
"Properties" to see the options available. For the
DigitalDashboardPluginScatterPlot it is for example possible to change
the size of the dots in the plot.

---------------------------------------------
PREDEFINED SETUPS
---------------------------------------------

There are a few Webbles that load a lot of Digital Dashboard Webbles
and then set up data connections, layout the Webbles, etc. to create a
finished visualization setup. Some of them also contain data, so the
setup loads with some data already loaded and ready to visualize.

These Webbles are: 
 YoshidaDensityApp (no data loaded)
 YoshidaHaloMergeApp
 YoshidaSimulationResultApp
 MiyoshiHimawariApp
 SoftSensorApp
