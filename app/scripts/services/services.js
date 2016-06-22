//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013), v3.1(2015)
//
// Project Leader & Lead Meme Media Architect: Yuzuru Tanaka
// Webble System Lead Architect & Developer: Micke Nicander Kuwahara
// Server Side Developer: Giannis Georgalis
// Additional Support: Jonas Sjöbergh
//
// This file is part of Webble World (c).
// ******************************************************************************************
// Webble World is licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ******************************************************************************************
// The use of the word "Webble" or "webble" for the loadable meme media objects are limited
// only to objects that actually loads in this original Webble World Platform. Modifications
// of the meme media object code which leads to breaking of compatibility with the original
// Webble World platform, may no longer be referred to as a "Webble" or "webble".
// ******************************************************************************************
//====================================================================================================================

//===========================================================================================
// DESCRIPTION:
// This js file contains the SERVICES code.
//=========================================================================================
'use strict';


//=================================================================================
// Service that simulates Enum behavior and contains available enumerations
//=================================================================================
ww3Services.factory('Enum', function (gettext) {
    return {
        // The available features in the platform found in the menu
        availablePlatformPotentials: {
            None: 0,
            Slim: 1,
            Limited: 2,
            Full: 3,
            Custom: 4,
            Undefined: 5
        },

        //Available forms
        aopForms: {
            userReg: 0,
            wblProps: 1,
            slotConn: 2,
            protect: 3,
            addCustSlot: 4,
            infoMsg: 5,
            langChange: 6,
            publishWebble: 7,
            loadWebble: 8,
            openWorkspace: 9,
            platformProps: 10,
            about: 12,
            wblAbout: 13,
            wblSearch: 14,
            faq: 15,
            bundle: 16,
            deleteWorkspace: 17,
            rateWbl: 18,
            saveWorkspaceAs: 19,
            shareWorkspaces: 20,
			editCustMenuItems: 21,
			editCustInteractObj: 22,
			viewWblRatingAndComments: 23,
			exportWebble: 24,
			importWebble: 25
        },

        //Available undo operations
        undoOps: {
            setSlot: 0,
            loadWbl: 1,
            deleteWbl: 2,
            pasteWbl: 3,
            peelWbl: 4,
            connSlots: 5,
            addCustSlot: 6,
            removeCustSlot: 7,
            bundle: 8,
            unbundle: 9
        },

        //Available online transmit operations
        transmitOps: {
            setSlot: 0,
            setSelectState: 1,
            unselectWbls: 2,
            loadWbl: 3,
            deleteWbl: 4,
            pasteWbl: 5,
            peelWbl: 6,
            connSlots: 7,
            addCustSlot: 8,
            removeCustSlot: 9,
            bundle: 10,
            unbundle: 11,
            getCurrentChanges: 12
        },

        // Default Interaction objects that all webbles share
        availableOnePicks_DefaultInteractionObjects: {
            Menu: 0,
            Rotate: 1,
            Resize: 2,
            AssignParent: 3,
            Rescale: 5
        },

        // Default Interaction objects' Tooltip text
        availableOnePicks_DefaultInteractionObjectsTooltipTxt: {
            Menu: gettext("Open Menu"),
            Rotate: gettext("Rotate"),
            Resize: gettext("Resize"),
            AssignParent: gettext("Assign Parent"),
            Rescale: gettext("Rescale")
        },

        // Default menu choices that all webbles share
        availableOnePicks_DefaultWebbleMenuTargets: {
            Publish: 1,
            Duplicate: 2,
            Delete: 3,
            AssignParent: 4,
            RevokeParent: 5,
            ConnectSlots: 6,
            Props: 7,
            SharedDuplicate: 8,
            Bundle: 9,
            Unbundle: 10,
            BringFwd: 11,
            Protect: 12,
            AddCustomSlots: 13,
			EditCustomMenuItems: 14,
			EditCustomInteractionObjects: 15,
			Export: 16,
            About: 17
        },

		// Default menu choices Name Texts
		availableOnePicks_DefaultWebbleMenuTargetsNameTxt: {
			Publish: gettext("Publish"),
			Duplicate: gettext("Duplicate"),
			Delete: gettext("Delete"),
			AssignParent: gettext("Assign Parent"),
			RevokeParent: gettext("Revoke Parent"),
			ConnectSlots: gettext("Connect Slots"),
			Props: gettext("Properties"),
			SharedDuplicate: gettext("Shared Model Duplicate"),
			Bundle: gettext("Bundle"),
			Unbundle: gettext("Unbundle"),
			BringFwd: gettext("Bring to Front"),
			Protect: gettext("Set Protection"),
			AddCustomSlots: gettext("Add Custom Slots"),
			EditCustomMenuItems: gettext("Custom Menu Items"),
			EditCustomInteractionObjects: gettext("Custom Interaction Objects"),
			Export: gettext("Export"),
			About: gettext("About (share, rate etc.)")
		},

        // The different execution modes the webble world can be set to
        availableOnePicks_ExecutionModes: {
            Developer: 0,
            Admin: 1,
            SuperHighClearanceUser: 2,
            HighClearanceUser: 3,
            MediumClearanceUser: 4,
            LowClearanceUser: 5
        },

        availableOnePicks_ExecutionModesDisplayText: {
            Developer: gettext("Developer"),
            Admin: gettext("Admin"),
            SuperHighClearanceUser: gettext("Super High Clearance User"),
            HighClearanceUser: gettext("High Clearance User"),
            MediumClearanceUser:  gettext("Medium Clearance User"),
            LowClearanceUser:  gettext("Low Clearance User")
        },

		availableOnePicks_templateRevisionBehaviors: {
			askEverytime: 0,
			autoUpdate:  1,
			autoKeep:  2
		},

		availableOnePicks_templateRevisionBehaviorDisplayText: {
			askEverytime: gettext("Ask everytime"),
			autoUpdate:  gettext("Automatically upgrade to newer"),
			autoKeep:  gettext("Automatically keep current older")
		},

		availableOnePicks_untrustedWebblesBehavior: {
			allowAll: 0,
			askFirstTime:  1,
			askEveryTime:  2,
			neverAllow:  3
		},

		availableOnePicks_untrustedWebblesBehaviorDisplayText: {
			allowAll: gettext("Always Allow All"),
			askFirstTime:  gettext("Ask For First"),
			askEveryTime:  gettext("Ask For Everyone"),
			neverAllow:  gettext("Never Allow Any")
		},

        // The different available form input types used to interact with webble properties and similar
        aopInputTypes: {
            Undefined: 0,
            CheckBox: 1,
            ColorPick: 2,
            ComboBoxUseIndex: 3,
            ComboBoxUseValue: 4,
            FontFamily: 5,
            RadioButton: 6,
            Slider: 7,
            Point: 8,
            Numeral: 9,
            PasswordBox: 10,
            Size: 11,
            TextBox: 12,
            MultiListBox: 13,
            MultiCheckBox: 14,
            RichText: 15,
            DatePick: 16,
            ImagePick: 17,
            AudioPick: 18,
            VideoPick: 19,
            WebPick: 20,
            TextArea: 21
        },

        // The different types of visual selected states available
        availableOnePicks_SelectTypes: {
            AsNotSelected: 0,
            AsMainClicked: 1,
            AsChild: 2,
            AsHighlighted: 3,
            AsImportant: 4,
            AsToBeRemembered: 5,
            AsParent: 6,
            AsWaitingForParent: 7,
            AsWaitingForChild: 8,
            AsNewParent: 9,
            AsNewChild: 10
        },

        //Used for webble initation states
        // [Bitwise Flags]
        bitFlags_InitStates: {
            None: 0,
            InitBegun: 1,
            InitFinished: 2,
            ActiveReady: 4,
            AllDone: 8
        },

        //Used for settings and configuraions of the platform environment
        // [Bitwise Flags]
        bitFlags_PlatformConfigs: {
            None: 0,
            PlatformInteractionBlockEnabled: 1,
            MainMenuVisibilityEnabled: 2,
            PopupInfoEnabled: 4,
            autoBehaviorEnabled: 8
        },

        //Used for keeping track what the platform is doing
        // [Bitwise Flags]
        bitFlags_PlatformStates: {
            None: 0,
            WaitingForParent: 1,
            WaitingForAllSelect: 2
        },

        //Used for keeping track if a slot is disabled in some way or another (higher values include all lower ones)
        SlotDisablingState: {
            None: 0,
            PropertyEditing: 1,
            PropertyVisibility: 2,
            ConnectionVisibility: 4,
			AllVisibility: 8
        },

        //Slot manipulation result
        // [Bitwise Flags]
        bitFlags_SlotManipulations: {
            NonExisting: 0,
            Exists: 1,
            ValueChanged: 2
        },

        // The different types of available webble metadata
        // [Bitwise Flags]
        bitFlags_WebbleConfigs: {
            None: 0,
            IsMoving: 2,
            NoBubble: 4
        },

        // The different protections that can be set on a webble
        // [Bitwise Flags]
        bitFlags_WebbleProtection: {
            NO: 0,                              //No Operation Protection
            MOVE: 1,                            //Moving is not allowed
            RESIZE: 2,                          //Resizing is not allowed
            DUPLICATE: 4,                       //Copying is not allowed
            SHAREDMODELDUPLICATE: 8,            //Shared Copying is not allowed
            DELETE: 16,                         //Deleting is not allowed
            PUBLISH: 32,                        //Publishing is not allowed
            PROPERTY: 64,                       //Changing Attribute is not allowed
            PARENT_CONNECT: 128,                //Connecting to Ancestor is not allowed
            CHILD_CONNECT: 256,                 //Connecting from Descendant is not allowed
            PARENT_DISCONNECT: 512,             //Disconnecting from Ancestor is not allowed
            CHILD_DISCONNECT: 1024,             //Disconnecting Descendant is not allowed
            BUNDLE: 2048,                       //Bundling is not allowed
            UNBUNDLE: 4096,                     //Un-bundling is not allowed
            DEFAULT_MENU: 8192,                 //Default menu is not allowed
            INTERACTION_OBJECTS: 16384,         //Interaction Balls not allowed
            SELECTED: 32768,                    //selection is not allowed
            POPUP_MENU: 65536,                  //Popup Menu is not allowed
            NON_DEV_HIDDEN: 131072,             //Is not Visible unless in developer mode
            DRAG_CLONE: 262144,                 //Dragged Clone is not allowed (slot pos immediately updated)
            BUNDLE_LOCKED: 524288,              //Locking and trapping a Webble from being dragged inside a bundle is not allowed
			EXPORT: 1048576              		//Export is not allowed
        },

		availableWWEvents: {
			slotChanged: 0,
			deleted: 1,
			duplicated: 2,
			sharedModelDuplicated: 3,
			pasted: 4,
			gotChild: 5,
			peeled: 6,
			lostChild: 7,
			keyDown: 8,
			loadingWbl: 9,
			mainMenuExecuted: 10,
			wblMenuExecuted: 11

		}
    };
});
//=================================================================================


//=================================================================================
// A service that returns useful constant values useful for the application
//=================================================================================
ww3Services.factory('wwConsts', ['colorService', function(colorService) {
    return {
        unregUser: "guest",
        storedPlatformSettingsPathLastName: "_platformprops",
        workspaceQuickSavePathLastName: "_wsQuickSave",
        workspaceInternalSavePathName: "wsInternalSave",
        localhostCoreAddresses: "localhost:7000/",
        randomSeed: 1,
        palette: [
            {name: "red", value: colorService.rgbToHex(255, 0, 0)},
            {name: "blue", value: colorService.rgbToHex(7, 48, 255)},
            {name: "purple", value: colorService.rgbToHex(138, 43, 226)},
            {name: "magenta", value: colorService.rgbToHex(255, 0, 255)},
            {name: "darkgreen", value: colorService.rgbToHex(0, 128, 0)},
            {name: "orange", value: colorService.rgbToHex(255, 149, 0)},
            {name: "black", value: colorService.rgbToHex(0, 0, 0)},
            {name: "lightgreen", value: colorService.rgbToHex(0, 255, 0)},
            {name: "cyan", value: colorService.rgbToHex(0, 255, 255)},
            {name: "brown", value: colorService.rgbToHex(112, 0, 0)},
            {name: "grey", value: colorService.rgbToHex(112, 128, 144)},
            {name: "pink", value: colorService.rgbToHex(255, 105, 180)},
            {name: "yellowgreen", value: colorService.rgbToHex(154, 205, 50)},
            {name: "yellow", value: colorService.rgbToHex(255, 215, 0)},
            {name: "lightpink", value: colorService.rgbToHex(216, 191, 216)},
            {name: "olive", value: colorService.rgbToHex(128, 128, 0)}
        ],
        elementTransformations: [
            "RotateTransform",
            "SkewTransform",
            "ScaleTransform",
            "TranslateTransform",
            "PlaneProjection"
        ],
        languages: [
            {code: "auto", NativeName: "Default", EnglishName: "Default", ChangeStr: "Default"},
            {code: "en", NativeName: "English", EnglishName: "English", ChangeStr: "Change Language"},
            {code: "sv", NativeName: "Svenska", EnglishName: "Swedish", ChangeStr: "Ändra Språk"},
            {code: "ja", NativeName: "日本語", EnglishName: "Japanese", ChangeStr: "言語を変更する"},
            {code: "de", NativeName: "Deutsch", EnglishName: "German", ChangeStr: "Sprache ändern"},
			{code: "fi", NativeName: "Suomalainen", EnglishName: "Finnish", ChangeStr: "Muuta kieli"},
            {code: "fr", NativeName: "Français", EnglishName: "French", ChangeStr: "Changer de langue"},
            {code: "ru", NativeName: "русский", EnglishName: "Russian", ChangeStr: "Изменить язык"},
            {code: "he", NativeName: "עברית", EnglishName: "Hebrew", ChangeStr: "שנה שפה"},
            {code: "el", NativeName: "Ελληνικά", EnglishName: "Greek", ChangeStr: "Αλλαγή γλώσσας"},
            {code: "es", NativeName: "Español", EnglishName: "Spanish", ChangeStr: "Cambiar el idioma"}
        ],
        bundleContainerWblDef: {
            "webble": {
                "instanceid": 0,
                "defid": "bundleContainer",
                "templateid": "bundleTemplate",
                "templaterevision": "0",
                "displayname": "Bundle Container",
                "description": "",
                "keywords": "",
                "author": "",
                "image": "",
                "protectflags": 0,
                "modelsharees": {wbls: [], slots: []},
                "slotdata": {
                    "send": true,
                    "receive": true,
                    "selectslot": "",
                    "connslot": "",
                    "mcdata": [],
                    "slots": []
                },
                "children": [],
                "private": {}
            }
        },
        defaultFontFamilies: [
            'georgia',
            'serif',
            'palatino linotype',
            'book antiqua',
            'palatino',
            'times new roman',
            'times',
            'sans-serif',
            'arial',
            'helvetica',
            'arial black',
            'gadget',
            'comic sans ms',
            'cursive',
            'impact',
            'charcoal',
            'lucida sans unicode',
            'lucida grande',
            'tahoma',
            'geneva',
            'trebuchet ms',
            'verdana',
            'courier new',
            'courier',
            'monospace',
            'lucida console',
            'monaco'
        ]
    };
}]);
//=================================================================================


//=================================================================================
// Color hex and RGB value converter service.
//=================================================================================
ww3Services.factory('colorService', function() {
    var toHex = function(n) {
        n = parseInt(n,10);
        if (isNaN(n)) return "00";
        n = Math.max(0,Math.min(n,255));
        return "0123456789ABCDEF".charAt((n-n%16)/16) + "0123456789ABCDEF".charAt(n%16);
    };

    return {
        rgbToHex: function(R,G,B) {
            return "#" + toHex(R) + toHex(G) + toHex(B);
        },
        rgbStrToHex: function(rgbStr) {
            var RGBArray;
            if(rgbStr.search('rgba') != -1){
                RGBArray = rgbStr.replace(' ', '').replace('rgba(', '').replace(')', '').split(',');
                return "#" + toHex(RGBArray[3]*255) + toHex(RGBArray[0]) + toHex(RGBArray[1]) + toHex(RGBArray[2]);
            }
            else{
                RGBArray = rgbStr.replace(' ', '').replace('rgb(', '').replace(')', '').split(',');
                return "#" + toHex(RGBArray[0]) + toHex(RGBArray[1]) + toHex(RGBArray[2]);
            }
        },
        hexToRGB: function(h){
            var cutHex = function(h) {
                return (h.charAt(0)=="#") ? h.substring(1,7):h
            };
            var r = parseInt((cutHex(h)).substring(0,2),16);
            var g = parseInt((cutHex(h)).substring(2,4),16);
            var b = parseInt((cutHex(h)).substring(4,6),16);
            return {r: r,g: g,b: b};
        },
        hexToRGBAStr: function(h){
            var cutHex = function(h) {
                return (h.charAt(0)=="#") ? h.substring(1,9):h
            };
            var a = parseInt((cutHex(h)).substring(0,2),16) / 255;
            var r = parseInt((cutHex(h)).substring(2,4),16);
            var g = parseInt((cutHex(h)).substring(4,6),16);
            var b = parseInt((cutHex(h)).substring(6,8),16);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        }
    };
});
//=================================================================================

//=================================================================================
// String Catcher
// Returns a proper string for name and description of CSS attributes
//=================================================================================
ww3Services.factory('strCatcher', function(gettext) {
    var cssNames = {
        ALIGNCONTENT: gettext("Align Content"),
        ALIGNITEMS: gettext("Align Items"),
        ALIGNSELF: gettext("Align Self"),
        //ANIMATION: gettext("xxx"),
        //ANIMATIONDELAY: gettext("xxx"),
        //ANIMATIONDIRECTION: gettext("xxx"),
        //ANIMATIONDURATION: gettext("xxx"),
        //ANIMATIONFILLMODE: gettext("xxx"),
        //ANIMATIONITERATIONCOUNT: gettext("xxx"),
        //ANIMATIONNAME: gettext("xxx"),
        //ANIMATIONPLAYSTATE: gettext("xxx"),
        //ANIMATIONTIMINGFUNCTION: gettext("xxx"),
        BACKFACEVISIBILITY: gettext("Backface visibility"),
        BACKGROUND: gettext("Background"),
        BACKGROUNDATTACHMENT: gettext("Background Attachment"),
        BACKGROUNDCLIP: gettext("Background Clip"),
        BACKGROUNDCOLOR: gettext("Background Color"),
        BACKGROUNDIMAGE: gettext("Background Image"),
        BACKGROUNDORIGIN: gettext("Background Origin"),
        BACKGROUNDPOSITION: gettext("Background Position"),
        BACKGROUNDREPEAT: gettext("Background Repeat"),
        BACKGROUNDSIZE: gettext("Background Size"),
        BORDER: gettext("Border"),
        BORDERBOTTOM: gettext("Border Bottom"),
        BORDERBOTTOMCOLOR: gettext("Border Bottom Color"),
        BORDERBOTTOMLEFTRADIUS: gettext("Border Bottom Left Radius"),
        BORDERBOTTOMRIGHTRADIUS: gettext("Border Bottom Right Radius"),
        BORDERBOTTOMSTYLE: gettext("Border Bottom Style"),
        BORDERBOTTOMWIDTH: gettext("Border Bottom Width"),
        BORDERCOLLAPSE: gettext("Border Collapse"),
        BORDERCOLOR: gettext("Border Color"),
        BORDERIMAGE: gettext("Border Image"),
        BORDERIMAGEOUTSET: gettext("Border Image Outset"),
        BORDERIMAGEREPEAT: gettext("Border Image Repeat"),
        BORDERIMAGESLICE: gettext("Border Image Slice"),
        BORDERIMAGESOURCE: gettext("Border Image Source"),
        BORDERIMAGEWIDTH: gettext("Border Image Width"),
        BORDERLEFT: gettext("Border Left"),
        BORDERLEFTCOLOR: gettext("Border Left Color"),
        BORDERLEFTSTYLE: gettext("Border Left Style"),
        BORDERLEFTWIDTH: gettext("Border Left Width"),
        BORDERRADIUS: gettext("Border Radius"),
        BORDERRIGHT: gettext("Border Right"),
        BORDERRIGHTCOLOR: gettext("Border Right Color"),
        BORDERRIGHTSTYLE: gettext("Border Right Style"),
        BORDERRIGHTWIDTH: gettext("Border Right Width"),
        BORDERSPACING: gettext("Border Spacing"),
        BORDERSTYLE: gettext("Border Style"),
        BORDERTOP: gettext("Border Top"),
        BORDERTOPCOLOR: gettext("Border Top Color"),
        BORDERTOPLEFTRADIUS: gettext("Border Top Left Radius"),
        BORDERTOPRIGHTRADIUS: gettext("Border Top Right Radius"),
        BORDERTOPSTYLE: gettext("Border Top Style"),
        BORDERTOPWIDTH: gettext("Border Top Width"),
        BORDERWIDTH: gettext("Border Width"),
        BOTTOM: gettext("Bottom Position"),
        //BOXDECORATIONBREAK: gettext("xxx"),
        BOXSHADOW: gettext("Box Shadow"),
        //BOXSIZING: gettext("xxx"),
        //BREAKAFTER: gettext("xxx"),
        //BREAKBEFORE: gettext("xxx"),
        //BREAKINSIDE: gettext("xxx"),
        CAPTIONSIDE: gettext("Caption Side"),
        CLEAR: gettext("Clear"),
        CLIP: gettext("Clip"),
        COLOR: gettext("Foreground Color"),
        COLUMNCOUNT: gettext("Column Count"),
        //COLUMNFILL: gettext("xxx"),
        COLUMNGAP: gettext("Column Gap"),
        COLUMNRULE: gettext("Column Rule"),
        COLUMNRULECOLOR: gettext("Column Rule Color"),
        COLUMNRULESTYLE: gettext("Column Rule Style"),
        COLUMNRULEWIDTH: gettext("Column Rule Width"),
        COLUMNSPAN: gettext("Column Span"),
        COLUMNWIDTH: gettext("Column Width"),
        COLUMNS: gettext("Columns"),
        //CONTENT: gettext("xxx"),
        //COUNTERINCREMENT: gettext("xxx"),
        //COUNTERRESET: gettext("xxx"),
        CURSOR: gettext("Cursor"),
        //DIRECTION: gettext("xxx"),
        //DISPLAY: gettext("xxx"),
        //EMPTYCELLS: gettext("xxx"),
        FILTERBLUR: gettext("Image Filter Blur"),
        FILTERBRIGHTNESS: gettext("Image Filter Brightness"),
        FILTERCONTRAST: gettext("Image Filter Contrast"),
        FILTERDROPSHADOW: gettext("Image Filter DropShadow"),
        FILTERGRAYSCALE: gettext("Image Filter Grayscale"),
        FILTERHUEROTATE: gettext("Image Filter Hue Rotate"),
        FILTERINVERT: gettext("Image Filter Invert"),
        FILTEROPACITY: gettext("Image Filter Opacity"),
        FILTERSATURATE: gettext("Image Filter Saturate"),
        FILTERSEPIA: gettext("Image Filter Sepia"),
        //FLEX: gettext("xxx"),
        //FLEXBASIS: gettext("xxx"),
        //FLEXDIRECTION: gettext("xxx"),
        //FLEXFLOW: gettext("xxx"),
        //FLEXGROW: gettext("xxx"),
        //FLEXSHRINK: gettext("xxx"),
        //FLEXWRAP: gettext("xxx"),
        FLOAT: gettext("Float"),
        FONT: gettext("Font"),
        FONTFAMILY: gettext("Font Family"),
        //FONTFEATURESETTINGS: gettext("xxx"),
        //FONTKERNING: gettext("xxx"),
        //FONTLANGUAGEOVERRIDE: gettext("xxx"),
        FONTSIZE: gettext("Font Size"),
        FONTSIZEADJUST: gettext("Font Size Adjust"),
        //FONTSTRETCH: gettext("xxx"),
        FONTSTYLE: gettext("Font Style"),
        //FONTSYNTHESIS: gettext("xxx"),
        FONTVARIANT: gettext("Font Variant"),
        //FONTVARIANTALTERNATES: gettext("xxx"),
        //FONTVARIANTCAPS: gettext("xxx"),
        //FONTVARIANTEASTASIAN: gettext("xxx"),
        //FONTVARIANTLIGATURES: gettext("xxx"),
        //FONTVARIANTNUMERIC: gettext("xxx"),
        //FONTVARIANTPOSITION: gettext("xxx"),
        FONTWEIGHT: gettext("Font Weight"),
        //HANGINGPUNCTUATION: gettext("xxx"),
        HEIGHT: gettext("Height"),
        //HYPHENS: gettext("xxx"),
        //ICON: gettext("xxx"),
        //IMAGEORIENTATION: gettext("xxx"),
        //IMAGERENDERING: gettext("xxx"),
        //IMAGERESOLUTION: gettext("xxx"),
        //IMEMODE: gettext("xxx"),
        //JUSTIFYCONTENT: gettext("xxx"),
        LEFT: gettext("Left Position"),
        LETTERSPACING: gettext("Letter Spacing"),
        //LINEBREAK: gettext("xxx"),
        LINEHEIGHT: gettext("Line Height"),
        LISTSTYLE: gettext("List Style"),
        LISTSTYLEIMAGE: gettext("List Style Image"),
        LISTSTYLEPOSITION: gettext("List Style Position"),
        LISTSTYLETYPE: gettext("List Style Type"),
        MARGIN: gettext("Margin"),
        MARGINBOTTOM: gettext("Margin Bottom"),
        MARGINLEFT: gettext("Margin Left"),
        MARGINRIGHT: gettext("Margin Right"),
        MARGINTOP: gettext("Margin Top"),
        //MARK: gettext("xxx"),
        //MARKAFTER: gettext("xxx"),
        //MARKBEFORE: gettext("xxx"),
        //MARKS: gettext("xxx"),
        //MASK: gettext("xxx"),
        //MASKTYPE: gettext("xxx"),
        MAXHEIGHT: gettext("Max Height"),
        MAXWIDTH: gettext("Max Width"),
        MINHEIGHT: gettext("Min Height"),
        MINWIDTH: gettext("Min Width"),
        //NAVDOWN: gettext("xxx"),
        //NAVINDEX: gettext("xxx"),
        //NAVLEFT: gettext("xxx"),
        //NAVRIGHT: gettext("xxx"),
        //NAVUP: gettext("xxx"),
        //OBJECTFIT: gettext("xxx"),
        //OBJECTPOSITION: gettext("xxx"),
        OPACITY: gettext("Opacity"),
        //ORDER: gettext("xxx"),
        //ORPHANS: gettext("xxx"),
        OUTLINE: gettext("Outline"),
        OUTLINECOLOR: gettext("Outline Color"),
        OUTLINEOFFSET: gettext("Outline Offset"),
        OUTLINESTYLE: gettext("Outline Style"),
        OUTLINEWIDTH: gettext("Outline Width"),
        OVERFLOW: gettext("Overflow"),
        //OVERFLOWWRAP: gettext("xxx"),
        OVERFLOWX: gettext("Overflow X"),
        OVERFLOWY: gettext("Overflow Y"),
        PADDING: gettext("Padding"),
        PADDINGBOTTOM: gettext("Padding Bottom"),
        PADDINGLEFT: gettext("Padding Left"),
        PADDINGRIGHT: gettext("Padding Right"),
        PADDINGTOP: gettext("Padding Top"),
        //PAGEBREAKAFTER: gettext("xxx"),
        //PAGEBREAKBEFORE: gettext("xxx"),
        //PAGEBREAKINSIDE: gettext("xxx"),
        PERSPECTIVE: gettext("3D Perspective"),
        PERSPECTIVEORIGIN: gettext("3d Perspective Origin"),
        //PHONEMES: gettext("xxx"),
        POSITION: gettext("Position"),
        //QUOTES: gettext("xxx"),
        RESIZE: gettext("Resize"),
        //REST: gettext("xxx"),
        //RESTAFTER: gettext("xxx"),
        //RESTBEFORE: gettext("xxx"),
        RIGHT: gettext("Right Position"),
        //TABSIZE: gettext("xxx"),
        //TABLELAYOUT: gettext("xxx"),
        TEXTALIGN: gettext("Text Alignment"),
        //TEXTALIGNLAST: gettext("xxx"),
        //TEXTCOMBINEUPRIGHT: gettext("xxx"),
        TEXTDECORATION: gettext("Text Decoration"),
        //TEXTDECORATIONCOLOR: gettext("xxx"),
        //TEXTDECORATIONLINE: gettext("xxx"),
        //TEXTDECORATIONSTYLE: gettext("xxx"),
        TEXTINDENT: gettext("Text Indent"),
        //TEXTJUSTIFY: gettext("xxx"),
        //TEXTORIENTATION: gettext("xxx"),
        //TEXTOVERFLOW: gettext("xxx"),
        TEXTSHADOW: gettext("Text Shadow"),
        //TEXTTRANSFORM: gettext("xxx"),
        //TEXTUNDERLINEPOSITION: gettext("xxx"),
        TOP: gettext("Top Position"),
        TRANSFORMROTATE: gettext("Transform Rotate"),
        TRANSFORMSKEWX: gettext("Transform Skew X"),
        TRANSFORMSKEWY: gettext("Transform Skew Y"),
        TRANSFORMROTATEX: gettext("Transform Rotate X"),
        TRANSFORMROTATEY: gettext("Transform Rotate Y"),
        TRANSFORMROTATEZ: gettext("Transform Rotate Z"),
        TRANSFORMSCALEX: gettext("Transform Scale X"),
        TRANSFORMSCALEY: gettext("Transform Scale Y"),
        TRANSFORMSCALEZ: gettext("Transform Scale Z"),
        TRANSFORMTRANSLATEX: gettext("Transform Translate X"),
        TRANSFORMTRANSLATEY: gettext("Transform Translate Y"),
        TRANSFORMTRANSLATEZ: gettext("Transform Translate Z"),
        //TRANSFORM: gettext("xxx"),
        TRANSFORMORIGIN: gettext("Transform Origin"),
        //TRANSFORMSTYLE: gettext("xxx"),
        TRANSITION: gettext("Transition"),
        TRANSITIONDELAY: gettext("Transition Delay"),
        TRANSITIONDURATION: gettext("Transition Duration"),
        TRANSITIONPROPERTY: gettext("Transition Property"),
        TRANSITIONTIMINGFUNCTION: gettext("Transition Timing Function"),
        //UNICODEBIDI: gettext("xxx"),
        VERTICALALIGN: gettext("Vertical Align"),
        VISIBILITY: gettext("Visibility"),
        //VOICEBALANCE: gettext("xxx"),
        //VOICEDURATION: gettext("xxx"),
        //VOICEPITCH: gettext("xxx"),
        //VOICEPITCHRANGE: gettext("xxx"),
        //VOICERATE: gettext("xxx"),
        //VOICESTRESS: gettext("xxx"),
        //VOICEVOLUME: gettext("xxx"),
        WHITESPACE: gettext("White Space"),
        //WIDOWS: gettext("xxx"),
        WIDTH: gettext("Width"),
        WORDBREAK: gettext("Word Break"),
        WORDSPACING: gettext("Word Spacing"),
        WORDWRAP: gettext("Word Wrap"),
        //WRITINGMODE: gettext("xxx"),
        ZINDEX: gettext("Z-index (Layer Index)")
    };
    var cssDescs = {
        ALIGNCONTENT: gettext("Aligns the flexible container's items when the items do not use all available space on the cross-axis (vertically)"),
        ALIGNITEMS: gettext("Default alignment for items inside the flexible container"),
        ALIGNSELF: gettext("Alignment for the selected item inside the flexible container"),
        //ANIMATION: gettext("xxx"),
        //ANIMATIONDELAY: gettext("xxx"),
        //ANIMATIONDIRECTION: gettext("xxx"),
        //ANIMATIONDURATION: gettext("xxx"),
        //ANIMATIONFILLMODE: gettext("xxx"),
        //ANIMATIONITERATIONCOUNT: gettext("xxx"),
        //ANIMATIONNAME: gettext("xxx"),
        //ANIMATIONPLAYSTATE: gettext("xxx"),
        //ANIMATIONTIMINGFUNCTION: gettext("xxx"),
        BACKFACEVISIBILITY: gettext("Whether or not an element should be visible when not facing the screen"),
        BACKGROUND: gettext("Set different background properties in one declaration"),
        BACKGROUNDATTACHMENT: gettext("Whether a background image is fixed or scrolls with the rest of the page"),
        BACKGROUNDCLIP: gettext("Specifies the painting area of the background"),
        BACKGROUNDCOLOR: gettext("The background color of the element"),
        BACKGROUNDIMAGE: gettext("Sets one or more background images for an element, using the form: url([LINK])"),
        BACKGROUNDORIGIN: gettext("Specifies what the background-position property should be relative to"),
        BACKGROUNDPOSITION: gettext("Sets the starting position of a background image"),
        BACKGROUNDREPEAT: gettext("Sets if/how a background image will be repeated"),
        BACKGROUNDSIZE: gettext("Specifies the size of the background images"),
        BORDER: gettext("Sets all the border properties in one declaration"),
        BORDERBOTTOM: gettext("Sets all the bottom border properties in one declaration"),
        BORDERBOTTOMCOLOR: gettext("Sets the color of an element's bottom border"),
        BORDERBOTTOMLEFTRADIUS: gettext("Sets the left radius (corner) of an element's bottom border"),
        BORDERBOTTOMRIGHTRADIUS: gettext("Sets the right radius (corner) of an element's bottom border"),
        BORDERBOTTOMSTYLE: gettext("Sets the style of an element's bottom border"),
        BORDERBOTTOMWIDTH: gettext("Sets the width of an element's bottom border"),
        BORDERCOLLAPSE: gettext("Whether the table borders are collapsed into a single border or detached as in standard HTML"),
        BORDERCOLOR: gettext("Sets the color of an element's four borders"),
        BORDERIMAGE: gettext("Shorthand property for setting the border-image-source, border-image-slice, border-image-width, border-image-outset and border-image-repeat properties"),
        BORDERIMAGEOUTSET: gettext("Specifies the amount by which the border image area extends beyond the border box"),
        BORDERIMAGEREPEAT: gettext("Specifies whether the image-border should be repeated, rounded or stretched"),
        BORDERIMAGESLICE: gettext("Specifies the inward offsets of the image-border"),
        BORDERIMAGESOURCE: gettext("Specifies an image to be used, instead of the border styles given by the border-style properties, using the form: url([LINK])"),
        BORDERIMAGEWIDTH: gettext("Specifies the widths of the image-border"),
        BORDERLEFT: gettext("Sets all the left border properties in one declaration"),
        BORDERLEFTCOLOR: gettext("Sets the color of an element's left border"),
        BORDERLEFTSTYLE: gettext("Sets the style of an element's left border"),
        BORDERLEFTWIDTH: gettext("Sets the width of an element's left border"),
        BORDERRADIUS: gettext("Shorthand property for setting the four border-*-radius properties"),
        BORDERRIGHT: gettext("Sets all the right border properties in one declaration"),
        BORDERRIGHTCOLOR: gettext("Sets the color of an element's right border"),
        BORDERRIGHTSTYLE: gettext("Sets the style of an element's right border"),
        BORDERRIGHTWIDTH: gettext("Sets the width of an element's right border"),
        BORDERSPACING: gettext("Sets the distance between the borders of adjacent cells (only for the 'separated borders' model)"),
        BORDERSTYLE: gettext("Sets the style of an element's four borders. For example: dotted, solid, double or dashed"),
        BORDERTOP: gettext("Sets all the top border properties in one declaration"),
        BORDERTOPCOLOR: gettext("Sets the color of an element's top border"),
        BORDERTOPLEFTRADIUS: gettext("Sets the left radius (corner) of an element's top border"),
        BORDERTOPRIGHTRADIUS: gettext("Sets the right radius (corner) of an element's top border"),
        BORDERTOPSTYLE: gettext("Sets the style of an element's top border"),
        BORDERTOPWIDTH: gettext("Sets the width of an element's top border"),
        BORDERWIDTH: gettext("The width in pixels of the border (0 = no border)"),
        BOTTOM: gettext("Sets the bottom edge of an element to a unit above/below the bottom edge of its containing element"),
        //BOXDECORATIONBREAK: gettext("xxx"),
        BOXSHADOW: gettext("Sets all the box shadow properties in one declaration"),
        //BOXSIZING: gettext("xxx"),
        //BREAKAFTER: gettext("xxx"),
        //BREAKBEFORE: gettext("xxx"),
        //BREAKINSIDE: gettext("xxx"),
        CAPTIONSIDE: gettext("Specifies the placement of a table caption"),
        CLEAR: gettext("Specifies which side(s) of an element other floating elements are not allowed"),
        CLIP: gettext("Specify a rectangle to clip an absolutely positioned element. The rectangle is specified as four coordinates, from the top-left corner (Does not work if overflow is 'visible')"),
        COLOR: gettext("The foreground color of this element."),
        COLUMNCOUNT: gettext("Specifies the number of columns an element should be divided into"),
        //COLUMNFILL: gettext("xxx"),
        COLUMNGAP: gettext("Specifies the gap between the columns"),
        COLUMNRULE: gettext("Shorthand property for setting all the column-rule-* properties"),
        COLUMNRULECOLOR: gettext("Specifies the color of the rule between columns"),
        COLUMNRULESTYLE: gettext("Specifies the style of the rule between columns"),
        COLUMNRULEWIDTH: gettext("Specifies the width of the rule between columns"),
        COLUMNSPAN: gettext("Specifies how many columns an element should span across"),
        COLUMNWIDTH: gettext("Specifies the width of the columns"),
        COLUMNS: gettext("Shorthand property for setting column-width and column-count"),
        //CONTENT: gettext("xxx"),
        //COUNTERINCREMENT: gettext("xxx"),
        //COUNTERRESET: gettext("xxx"),
        CURSOR: gettext("Specifies the type of cursor to be displayed when pointing on an element"),
        //DIRECTION: gettext("xxx"),
        //DISPLAY: gettext("xxx"),
        //EMPTYCELLS: gettext("xxx"),
        FILTERBLUR: gettext("Applies a Gaussian blur to the input image. a value of ‘radius’ defines the value of how many pixels on the screen blend into each other.EXAMPLE: 5px (Do not forget 'px'"),
        FILTERBRIGHTNESS: gettext("Applies a linear multiplier to input image, making it appear more or less bright. A value of 0% will create an image that is completely black. A value of 100% leaves the input unchanged. Values of an amount over 100% are allowed.EXAMPLE: 50% (Do not forget '%'"),
        FILTERCONTRAST: gettext("Adjusts the contrast of the input. A value of 0% will create an image that is completely black. A value of 100% leaves the input unchanged. Values of amount over 100% are allowed.EXAMPLE: 50% (Do not forget '%'"),
        FILTERDROPSHADOW: gettext("Applies a drop shadow effect to the input image. [offset-x] [offset-y](required) [blur-radius](optional) [spread-radius](optional)[color](optional).EXAMPLE: 5px 5px 10px red (Do not forget 'px'"),
        FILTERGRAYSCALE: gettext("Converts the input image to grayscale. A value of 100% is completely grayscale. A value of 0% leaves the input unchanged.EXAMPLE: 50% (Do not forget '%'"),
        FILTERHUEROTATE: gettext("Applies a hue rotation on the input image. The value of ‘angle’ defines the number of degrees around the color circle the input samples will be adjusted. A value of 0deg leaves the input unchanged..EXAMPLE: 50deg (Do not forget 'deg'"),
        FILTERINVERT: gettext("Inverts the samples in the input image. A value of 100% is completely inverted. A value of 0% leaves the input unchanged.EXAMPLE: 50% (Do not forget '%'"),
        FILTEROPACITY: gettext("Applies transparency to the samples in the input image. A value of 0% is completely transparent. A value of 100% leaves the input unchanged.EXAMPLE: 50% (Do not forget '%'"),
        FILTERSATURATE: gettext("Saturates the input image. A value of 0% is completely un-saturated. A value of 100% leaves the input unchanged.EXAMPLE: 50% (Do not forget '%'"),
        FILTERSEPIA: gettext("Converts the input image to sepia. A value of 100% is completely sepia. A value of 0% leaves the input unchanged.EXAMPLE: 50% (Do not forget '%'"),
        //FLEX: gettext("xxx"),
        //FLEXBASIS: gettext("xxx"),
        //FLEXDIRECTION: gettext("xxx"),
        //FLEXFLOW: gettext("xxx"),
        //FLEXGROW: gettext("xxx"),
        //FLEXSHRINK: gettext("xxx"),
        //FLEXWRAP: gettext("xxx"),
        FLOAT: gettext("Specifies whether or not a box (an element) should float"),
        FONT: gettext("Shorthand property sets all the font properties in one declaration"),
        FONTFAMILY: gettext("Sets the font family for a text"),
        //FONTFEATURESETTINGS: gettext("xxx"),
        //FONTKERNING: gettext("xxx"),
        //FONTLANGUAGEOVERRIDE: gettext("xxx"),
        FONTSIZE: gettext("Sets the size of a font"),
        FONTSIZEADJUST: gettext("This property gives you better control of the font size when the first selected font is not available"),
        //FONTSTRETCH: gettext("xxx"),
        FONTSTYLE: gettext("Specifies the font style for a text"),
        //FONTSYNTHESIS: gettext("xxx"),
        FONTVARIANT: gettext("In a small-caps font, all lowercase letters are converted to uppercase letters. However, the converted uppercase letters appears in a smaller font size than the original uppercase letters in the text"),
        //FONTVARIANTALTERNATES: gettext("xxx"),
        //FONTVARIANTCAPS: gettext("xxx"),
        //FONTVARIANTEASTASIAN: gettext("xxx"),
        //FONTVARIANTLIGATURES: gettext("xxx"),
        //FONTVARIANTNUMERIC: gettext("xxx"),
        //FONTVARIANTPOSITION: gettext("xxx"),
        FONTWEIGHT: gettext("Sets how thick or thin characters in text should be displayed"),
        //HANGINGPUNCTUATION: gettext("xxx"),
        HEIGHT: gettext("Sets the height of an element (% sign is allowed)"),
        //HYPHENS: gettext("xxx"),
        //ICON: gettext("xxx"),
        //IMAGEORIENTATION: gettext("xxx"),
        //IMAGERENDERING: gettext("xxx"),
        //IMAGERESOLUTION: gettext("xxx"),
        //IMEMODE: gettext("xxx"),
        //JUSTIFYCONTENT: gettext("xxx"),
        LEFT: gettext("Depending on element 'position', the left property sets the left edge of an element to a unit to the left/right of the left edge of its containing element or to its normal position"),
        LETTERSPACING: gettext("Increases or decreases the space between characters in a text"),
        //LINEBREAK: gettext("xxx"),
        LINEHEIGHT: gettext("Specifies the line height"),
        LISTSTYLE: gettext("Sets all the list properties in one declaration"),
        LISTSTYLEIMAGE: gettext("Replaces the list-item marker with an image, using the form: url([LINK])"),
        LISTSTYLEPOSITION: gettext("Specifies if the list-item markers should appear inside or outside the content flow"),
        LISTSTYLETYPE: gettext("Specifies the type of list-item marker in a list, e.g. 'disc', 'square', 'circle' etc"),
        MARGIN: gettext("Sets all the margin properties in one declaration"),
        MARGINBOTTOM: gettext("Sets the bottom margin of an element"),
        MARGINLEFT: gettext("Sets the left margin of an element"),
        MARGINRIGHT: gettext("Sets the right margin of an element"),
        MARGINTOP: gettext("Sets the top margin of an element"),
        //MARK: gettext("xxx"),
        //MARKAFTER: gettext("xxx"),
        //MARKBEFORE: gettext("xxx"),
        //MARKS: gettext("xxx"),
        //MASK: gettext("xxx"),
        //MASKTYPE: gettext("xxx"),
        MAXHEIGHT: gettext("Sets the maximum height of an element, no matter what the height value is set to"),
        MAXWIDTH: gettext("Sets the maximum width of an element, no matter what the width value is set to"),
        MINHEIGHT: gettext("Sets the minimum height of an element, no matter what the height value is set to"),
        MINWIDTH: gettext("Sets the minimum width of an element, no matter what the width value is set to"),
        //NAVDOWN: gettext("xxx"),
        //NAVINDEX: gettext("xxx"),
        //NAVLEFT: gettext("xxx"),
        //NAVRIGHT: gettext("xxx"),
        //NAVUP: gettext("xxx"),
        //OBJECTFIT: gettext("xxx"),
        //OBJECTPOSITION: gettext("xxx"),
        OPACITY: gettext("Sets the opacity level for an element"),
        //ORDER: gettext("xxx"),
        //ORPHANS: gettext("xxx"),
        OUTLINE: gettext("An outline is a line that is drawn around elements (outside the borders) to make the element 'stand out'. The outline shorthand property sets all the outline properties in one declaration"),
        OUTLINECOLOR: gettext("Specifies the color of an outline"),
        OUTLINEOFFSET: gettext("This property offsets an outline, and draws it beyond the border edge"),
        OUTLINESTYLE: gettext("Specifies the style of an outline. e.g. dotted, dashed, solid etc"),
        OUTLINEWIDTH: gettext("Specifies the width of an outline"),
        OVERFLOW: gettext("Specifies what happens if content overflows an element's box"),
        //OVERFLOWWRAP: gettext("xxx"),
        OVERFLOWX: gettext("Specifies what to do with the left/right edges of the content - if it overflows the element's content area"),
        OVERFLOWY: gettext("Specifies what to do with the top/bottom edges of the content - if it overflows the element's content area"),
        PADDING: gettext("Sets all the padding properties in one declaration"),
        PADDINGBOTTOM: gettext("Sets the bottom padding (space) of an element"),
        PADDINGLEFT: gettext("Sets the left padding (space) of an element"),
        PADDINGRIGHT: gettext("Sets the right padding (space) of an element"),
        PADDINGTOP: gettext("Sets the top padding (space) of an element"),
        //PAGEBREAKAFTER: gettext("xxx"),
        //PAGEBREAKBEFORE: gettext("xxx"),
        //PAGEBREAKINSIDE: gettext("xxx"),
        PERSPECTIVE: gettext("This property defines how many pixels a 3D element is placed from the view. This property allows you to change the perspective on how 3D elements are viewed"),
        PERSPECTIVEORIGIN: gettext("This property defines where a 3D element is based in the x- and the y-axis. This property allows you to change the bottom position of 3D elements"),
        //PHONEMES: gettext("xxx"),
        POSITION: gettext("Specifies the type of positioning method used for an element (static, relative, absolute or fixed)"),
        //QUOTES: gettext("xxx"),
        RESIZE: gettext("Specifies whether or not an element is resizable by the user"),
        //REST: gettext("xxx"),
        //RESTAFTER: gettext("xxx"),
        //RESTBEFORE: gettext("xxx"),
        RIGHT: gettext("Depending on element 'position', the right property sets the right edge of an element to a unit to the left/right of the right edge of its containing element or to its normal position"),
        //TABSIZE: gettext("xxx"),
        //TABLELAYOUT: gettext("xxx"),
        TEXTALIGN: gettext("Specifies the horizontal alignment of text in an element"),
        //TEXTALIGNLAST: gettext("xxx"),
        //TEXTCOMBINEUPRIGHT: gettext("xxx"),
        TEXTDECORATION: gettext("Specifies the decoration added to text, e.g. 'underline', 'overline' etc"),
        //TEXTDECORATIONCOLOR: gettext("xxx"),
        //TEXTDECORATIONLINE: gettext("xxx"),
        //TEXTDECORATIONSTYLE: gettext("xxx"),
        TEXTINDENT: gettext("Specifies the indentation of the first line in a text-block"),
        //TEXTJUSTIFY: gettext("xxx"),
        //TEXTORIENTATION: gettext("xxx"),
        //TEXTOVERFLOW: gettext("xxx"),
        TEXTSHADOW: gettext("A Text Shadow defined by horizontal offset, vertical offset, blur-radius and color value."),
        //TEXTTRANSFORM: gettext("xxx"),
        //TEXTUNDERLINEPOSITION: gettext("xxx"),
        TOP: gettext("Depending on element 'position', the top property sets the top edge of an element to a unit to the above/below of the top edge of its containing element or to its normal position"),
        TRANSFORMROTATE: gettext("Defines a 2D rotation, the angle is specified in the parameter"),
        TRANSFORMSKEWX: gettext("Defines a 2D skew transformation along the X-axis"),
        TRANSFORMSKEWY: gettext("Defines a 2D skew transformation along the Y-axis"),
        TRANSFORMROTATEX: gettext("Defines a 3D rotation along the X-axis"),
        TRANSFORMROTATEY: gettext("Defines a 3D rotation along the Y-axis"),
        TRANSFORMROTATEZ: gettext("Defines a 3D rotation along the Z-axis"),
        TRANSFORMSCALEX: gettext("Defines a scale transformation by giving a value for the X-axis"),
        TRANSFORMSCALEY: gettext("Defines a scale transformation by giving a value for the Y-axis"),
        TRANSFORMSCALEZ: gettext("Defines a scale transformation by giving a value for the Z-axis"),
        TRANSFORMTRANSLATEX: gettext("Defines a translation (move), using only the value for the X-axis"),
        TRANSFORMTRANSLATEY: gettext("Defines a translation (move), using only the value for the Y-axis"),
        TRANSFORMTRANSLATEZ: gettext("Defines a translation (move), using only the value for the Z-axis"),
        //TRANSFORM: gettext("xxx"),
        TRANSFORMORIGIN: gettext("This property allows you to change the position of transformed elements. (At what point of origin in the element will the transformation originate)"),
        //TRANSFORMSTYLE: gettext("xxx"),
        TRANSITION: gettext("Shorthand property for the four transition properties: transition-property, transition-duration, transition-timing-function, and transition-delay"),
        TRANSITIONDELAY: gettext("Specifies when the transition effect will start, defined in seconds (s) or milliseconds (ms)"),
        TRANSITIONDURATION: gettext("Specifies how many seconds (s) or milliseconds (ms) a transition effect takes to complete"),
        TRANSITIONPROPERTY: gettext("Specifies the name of the CSS property the transition effect is for ('all' is used for every css property)"),
        TRANSITIONTIMINGFUNCTION: gettext("Specifies the speed curve of the transition effect, like 'ease', 'linear', 'ease-in' etc"),
        //UNICODEBIDI: gettext("xxx"),
        VERTICALALIGN: gettext("Sets the vertical alignment of an element"),
        VISIBILITY: gettext("Specifies whether or not an element is visible. (Non visible elements does not exist at all as far as Webble world and the browser knows)"),
        //VOICEBALANCE: gettext("xxx"),
        //VOICEDURATION: gettext("xxx"),
        //VOICEPITCH: gettext("xxx"),
        //VOICEPITCHRANGE: gettext("xxx"),
        //VOICERATE: gettext("xxx"),
        //VOICESTRESS: gettext("xxx"),
        //VOICEVOLUME: gettext("xxx"),
        WHITESPACE: gettext("Specifies how white-space inside an element is handled"),
        //WIDOWS: gettext("xxx"),
        WIDTH: gettext("Sets the width of an element (% sign is allowed)."),
        WORDBREAK: gettext("specifies line breaking rules for all languages except Chinese, Japanese and Korean"),
        WORDSPACING: gettext("Increases or decreases the white space between words"),
        WORDWRAP: gettext("This property allows long words to be able to be broken and wrap onto the next line"),
        //WRITINGMODE: gettext("xxx"),
        ZINDEX: gettext("Specifies the stack order of an element")
    };

    return {
        cssAttrNames: function(){
            return cssNames;
        },
        cssAttrDescs: function(){
            return cssDescs;
        },
        getAutoGeneratedDisplayInfo: function(whatSlotName){
            var newSlotDisplayInfo = {
                name: gettext("Custom") + " (" + whatSlotName + ")",
                desc: gettext("This slot is a custom slot added by a user or the Webble itself.")
            };

            var slotNameModStr = whatSlotName.replace(/-/g, '').substr(whatSlotName.indexOf(':')+1).toUpperCase();
            if(slotNameModStr.lastIndexOf('_') != -1){
                slotNameModStr = slotNameModStr.substr(0, slotNameModStr.lastIndexOf('_'));
            }

            var possibleCSSName = cssNames[slotNameModStr];
            if(possibleCSSName != undefined){
                newSlotDisplayInfo.name = possibleCSSName;
                newSlotDisplayInfo.desc = cssDescs[slotNameModStr];
            }
            return newSlotDisplayInfo;
        }
    }
});
//=================================================================================


//=================================================================================
// Service that returns currently used path locations for documents etc
//=================================================================================
ww3Services.factory('appPaths', [function() {
    return {
        currentAppUriCore: document.URL.replace('#/app', ''),
        webbleAccessPath: 'api/webbles/',
        webbleDocRelPath: 'docs/WebbleWorld3Manual.pdf',
        webbleDevPackRelPath: 'data/WebbleWorldDevelopersPack.zip',
        webbleFMWS_ServiceAddress: '',
        webbleRepCore: '../files/webbles/',
		localDevWebbleRepCore: '../webbles/',
        webbleSandboxCore: '../files/devwebbles/',
        webbleView: '/view.html',
        webbleCtrl: '/controllers.js',
        webbleDirective: '/directives.js',
        webbleCSS: '/styles.css',
        webbleFilter: '/filters.js',
        webbleService: '/services.js',
        webbleManifest: '/manifest.json'
    };
}]);
//=================================================================================


//=================================================================================
// Is Safe Font Family
// A service that test if the provided font name is a safe and known one.
//=================================================================================
ww3Services.factory('isSafeFontFamily', [function() {
    return function(fontFamilyNameToTest){
        var okFonts = ['georgia', 'serif', 'palatino linotype', 'book antiqua', 'palatino', 'times new roman', 'times', 'sans-serif', 'arial', 'helvetica', 'arial black', 'gadget', 'comic sans ms', 'cursive', 'impact', 'charcoal', 'lucida sans unicode', 'lucida grande', 'tahoma', 'geneva', 'trebuchet ms', 'verdana', 'courier new', 'courier', 'monospace', 'lucida console', 'monaco'];
        var result = false;
        fontFamilyNameToTest = fontFamilyNameToTest.toString().toLowerCase();
        for(var i = 0; i < okFonts.length; i++){
            if(fontFamilyNameToTest == okFonts[i]){
                result = true;
                break;
            }
        }
        return result;
    };
}]);
//=================================================================================


//=================================================================================
// Service that returns needed name and id values for the menu items and sub items.
//=================================================================================
ww3Services.factory('menuItemsFactoryService', function (gettext) {
    var theMenu = [
        {"itemName": "workspace", "title": gettext("Workspace"), "description": "", "visibility_enabled": true,
            "sublinks": [
                {"sublink_itemName": "newws", "title": gettext("New"), "shortcut": "(Alt+N)", "visibility_enabled": true},
                {"sublink_itemName": "openws", "title": gettext("Open"), "shortcut": "(Alt+O)", "visibility_enabled": true},
                {"sublink_itemName": "savews", "title": gettext("Save"), "shortcut": "(Alt+S)", "visibility_enabled": true},
                {"sublink_itemName": "savewsas", "title": gettext("Save As"), "shortcut": "(Alt+Shift+S)", "visibility_enabled": true},
                {"sublink_itemName": "sharews", "title": gettext("Share"), "shortcut": "(Alt+J)", "visibility_enabled": true},
                {"sublink_itemName": "deletews", "title": gettext("Delete"), "shortcut": "(Alt+X)", "visibility_enabled": true}
            ]},
        {"itemName": "webbles", "title": gettext("Webbles"), "description": "", "visibility_enabled": true,
            "sublinks": [
                {"sublink_itemName": "browse", "title": gettext("Browser"), "shortcut": "(Alt+B)", "visibility_enabled": true},
                {"sublink_itemName": "divider", "title": "---", "visibility_enabled": true},
				{"sublink_itemName": "recentwbl", "title": gettext("Recent"), "shortcut": "(Alt+R)", "visibility_enabled": true},
                {"sublink_itemName": "loadwbl", "title": gettext("Load"), "shortcut": "(Alt+L)", "visibility_enabled": true},
				{"sublink_itemName": "impwbl", "title": gettext("Import"), "shortcut": "(Alt+I)", "visibility_enabled": true},
                {"sublink_itemName": "pub", "title": gettext("Publish"), "shortcut": "(Alt+P)", "visibility_enabled": true},
				{"sublink_itemName": "expwbl", "title": gettext("Export"), "shortcut": "(Alt+E)", "visibility_enabled": true},
                {"sublink_itemName": "divider", "title": "---", "visibility_enabled": true},
                {"sublink_itemName": "upload", "title": gettext("Template Editor"), "shortcut": "(Alt+U)", "visibility_enabled": true}
            ]},
        {"itemName": "edit", "title": gettext("Edit"), "description": "", "visibility_enabled": true,
            "sublinks": [
                {"sublink_itemName": "undo", "title": gettext("Undo"), "shortcut": "(Alt+Z | Ctrl+Z)", "visibility_enabled": true},
                {"sublink_itemName": "redo", "title": gettext("Redo"), "shortcut": "(Alt+Y | Ctrl+Y)", "visibility_enabled": true},
                {"sublink_itemName": "selectall", "title": gettext("Select All"), "shortcut": "(Alt+A)", "visibility_enabled": true},
                {"sublink_itemName": "deselectall", "title": gettext("Deselect All"), "shortcut": "(Alt+Shift+A)", "visibility_enabled": true},
                {"sublink_itemName": "duplicate", "title": gettext("Duplicate"), "shortcut": "(Alt+D)", "visibility_enabled": true},
                {"sublink_itemName": "sharedduplicate", "title": gettext("Shared Duplicate"), "shortcut": "(Alt+Shift+D)", "visibility_enabled": true},
                {"sublink_itemName": "bundle", "title": gettext("Bundle"), "shortcut": "(Alt+Shift+B)", "visibility_enabled": true},
                {"sublink_itemName": "delete", "title": gettext("Delete"), "shortcut": "(Alt+Del | Ctrl+Del)", "visibility_enabled": true},
                {"sublink_itemName": "wblprops", "title": gettext("Multi Webble Properties"), "shortcut": "(Alt+K)", "visibility_enabled": true},
                {"sublink_itemName": "divider", "title": "---", "visibility_enabled": true},
                {"sublink_itemName": "platformprops", "title": gettext("Platform Properties"), "shortcut": "(Alt+Shift+K)", "visibility_enabled": true}
            ]},
        {"itemName": "view", "title": gettext("View"), "description": "", "visibility_enabled": true,
            "sublinks": [
                {"sublink_itemName": "toggleconn", "title": gettext("Toggle Connection View"), "shortcut": "(Alt+Num9)", "visibility_enabled": true},
                {"sublink_itemName": "wsinfo", "title": gettext("Active Workspace Info"), "shortcut": "(Alt+W)", "visibility_enabled": true},
				{"sublink_itemName": "shortcutinfo", "title": gettext("Shortcut Keys Info"), "shortcut": "(Alt+F1)", "visibility_enabled": true},
                {"sublink_itemName": "fullscrn", "title": gettext("Toggle Fullscreen"), "shortcut": "(Alt+F)", "visibility_enabled": true}
            ]},
        {"itemName": "help", "title": gettext("Help"), "description": "", "visibility_enabled": true,
            "sublinks": [
                {"sublink_itemName": "docs", "title": gettext("Documentation"), "shortcut": "(Alt+M)", "visibility_enabled": true},
				{"sublink_itemName": "tutorials", "title": gettext("Tutorial Vids"), "shortcut": "(Alt+Shift+U)", "visibility_enabled": true},
                {"sublink_itemName": "faq", "title": gettext("FAQ"), "shortcut": "(Alt+Shift+F)", "visibility_enabled": true},
                {"sublink_itemName": "openchat", "title": gettext("Open Chat"), "shortcut": "(Alt+C)", "visibility_enabled": true},
                {"sublink_itemName": "support", "title": gettext("Support"), "shortcut": "(Alt+H)", "visibility_enabled": true},
				{"sublink_itemName": "community", "title": gettext("Developer Community"), "shortcut": "(Alt+Shift+C)", "visibility_enabled": true},
                {"sublink_itemName": "devpack", "title": gettext("Download Developers Package"), "shortcut": "(Alt+G)", "visibility_enabled": true},
				{"sublink_itemName": "git", "title": gettext("Webble Platform On GitHub"), "shortcut": "(Alt+Shift+G)", "visibility_enabled": true},
                {"sublink_itemName": "bugreport", "title": gettext("Report Bug"), "shortcut": "(Alt+Num7)", "visibility_enabled": true},
                {"sublink_itemName": "about", "title": gettext("About"), "shortcut": "(Alt+Num5)", "visibility_enabled": true}
            ]}
    ];

    return {
        menuItems: theMenu
    };
});
//=================================================================================


//=================================================================================
// Web service Caller
// Calls a designated web service and returns the promised result, if service is
// enabled that is, otherwise returns the call content as a resolved response.
//=================================================================================
ww3Services.factory('webService', ['$http', '$q', '$log', 'appPaths', function($http, $q, $log, appPaths) {
    return {
        post: function(restPath, inData){
            var deferred = $q.defer();
            if(wwDef.WEBSERVICE_ENABLED){
                $http.post(appPaths.webbleFMWS_ServiceAddress + restPath, inData)
                    .success(function(outData) {
                        deferred.resolve(outData);
                    })
                    .error(function(errorMessage){
                        deferred.reject(errorMessage);
                    });
            }
            else{
                deferred.resolve(inData);
            }
            return deferred.promise;
        },
        put: function(restPath, inData){
            var deferred = $q.defer();
            if(wwDef.WEBSERVICE_ENABLED){
                $http.put(appPaths.webbleFMWS_ServiceAddress + restPath, inData)
                    .success(function(outData) {
                        deferred.resolve(outData);
                    })
                    .error(function(errorMessage){
                        deferred.reject(errorMessage);
                    });
            }
            else{
                deferred.resolve(inData);
            }
            return deferred.promise;
        },
        "delete": function(restPath, inData){
            var deferred = $q.defer();
            if(wwDef.WEBSERVICE_ENABLED){
                $http.delete(appPaths.webbleFMWS_ServiceAddress + restPath)
                    .success(function(outData) {
                        deferred.resolve(outData);
                    })
                    .error(function(errorMessage){
                        deferred.reject(errorMessage);
                    });
            }
            else{
                deferred.resolve(inData);
            }
            return deferred.promise;
        },
        get: function(restPath, inData){
            var deferred = $q.defer();
            if(wwDef.WEBSERVICE_ENABLED){
                $http.get(appPaths.webbleFMWS_ServiceAddress + restPath)
                    .success(function(outData) {
                        deferred.resolve(outData);
                    })
                    .error(function(errorMessage){
                        deferred.reject(errorMessage);
                    });
            }
            else{
                deferred.resolve(inData);
            }
            return deferred.promise;
        }
    };
}]);
//=================================================================================

//=================================================================================
// Database interaction Service.
// Makes a service call for retrieving DB data of specified type.
//=================================================================================
ww3Services.factory('dbService', function($log, $http, webService, getFakeData) {
    return {
        doDBAvailabilityTest: function() {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/info/availability');
            }
            else{
                return webService.get('', getFakeData.anyFakeData());
            }
        },
        getAvailableWorkspaces: function(username) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/workspaces');
            }
            else{
                return webService.get('', getFakeData.anyFakeData(username));
            }
        },
        getWorkspace: function(wsDefId) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/workspaces/' + encodeURIComponent(wsDefId));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wsDefId));
            }
        },
        saveWorkspace: function(wsDef) {
            if(wwDef.WEBSERVICE_ENABLED){
                var ws = { workspace: wsDef };
                return (wsDef.id == undefined) ? webService.post('/api/workspaces', ws) : webService.put('/api/workspaces/' + encodeURIComponent(wsDef.id), ws);
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wsDef));
            }
        },
        deleteWS: function(wsId) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.delete('/api/workspaces/' + encodeURIComponent(wsId));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wsId));
            }
        },

	    /**
	     * Fetches a fully formed webble definition.
	     *
	     * @param {string} defid - The id of the webble (webble.defid)
	     * @param {bool} verify - Verify whether the webble is trusted or not (optional)
	     *
	     * @returns {*} a promise that is fulfilled on success with the published webble definition
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
        getWebbleDef: function(defid, verify) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/webbles/' + encodeURIComponent(defid) + (verify ? '?verify=1' : ''));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(defid));
            }
        },

	    getAllDevelopmentWebbleDefs: function() {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/dev/webbles');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData());
		    }
	    },

        getWebbleDefByURL: function(wblUrl) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get(wblUrl);
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wblUrl));
            }
        },

		/**
		 *   "FAKE" PLACEHOLDER SERVICE FOR EXPORT WEBBLE (currently returns a webble def as temp-holder return data)
		 */
		exportWebble: function(wblDef, wblTemplateList) {
			if(wwDef.WEBSERVICE_ENABLED){
				var verify = undefined;
				return webService.get('/api/webbles/' + encodeURIComponent(wblDef.webble.defid) + (verify ? '?verify=1' : ''));
			}
			else{
				return webService.get('', getFakeData.anyFakeData(wblDef));
			}
		},

		/**
		 *   "FAKE" PLACEHOLDER SERVICE FOR IMPORT WEBBLE (currently returns a clock webble def as temp-holder return data)
		 */
		importWebble: function(wblExpImpPack) {
			if(wwDef.WEBSERVICE_ENABLED){
				var verify = undefined;
				return webService.get('/api/webbles/' + encodeURIComponent("clock") + (verify ? '?verify=1' : ''));
			}
			else{
				return webService.get('', getFakeData.anyFakeData(wblDef));
			}
		},

	    /**
	     * Publishes a webble and makes it available for anybody to GET.
	     *
	     * @param {Object} wblDef - A fully- or partially- formed webble definition
	     * @param {Array.<number>} groups - An array of indexes of the user's groups (optional).
	     *      E.g., [ 0, 2 ] publishes the webble under the first and the third user groups in which
	     *      the currently logged-in user belongs
	     *
	     * @returns {*} a promise that is fulfilled on success with the published webble definition
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
        publishWebbleDef: function(wblDef, groups) {
            if(wwDef.WEBSERVICE_ENABLED){

	            var url = wblDef.id ? '/api/dev/webbles/' + encodeURIComponent(wblDef.id) + '/publish' :
		            '/api/webbles/' + encodeURIComponent(wblDef.webble.defid);

                return webService.put(url, { webble: wblDef.webble, groups: groups });
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wblDef));
            }
        },

	    /**
	     * Makes a full copy of a published webble template as an unpublished template of the current user.
	     * The source webble template can be owned by any user and should not be "copy-protected".
	     * The target unpublished template has the same ID as the source, published webble template.
	     *
	     * @param templateId - The id of the target template
	     *
	     * @returns {*} a promise that is fulfilled on success with the template webble definition
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
	    copyPublishedTemplateAsMyUnpublishedTemplate: function(templateId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.post('/api/dev/webbles/' + encodeURIComponent(templateId));
		    }
		    else{
			    return webService.get('', getFakeData.anyFakeData(templateId));
		    }
	    },

        getTemplateMetadata: function(templateId) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/dev/templates/' + encodeURIComponent(templateId));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(templateId));
            }
        },
        getWebbleSearchMetaData: function() {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/webbles');
            }
            else{
                return webService.get('', getFakeData.anyFakeData());
            }
        },
	    getWebbleCount: function() {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/webbles?count=1');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData());
		    }
	    },

	    /**
	     * Searches and fetches all the webble definitions whose metadata match a specific substring
	     *
	     * @param {string} queryStr - A string to match against the metadata of the published webble definitions
	     * @param {bool} verify - Verify whether the webble is trusted or not (optional)
	     *
	     * @returns {*} a promise that is fulfilled on success with a list of all the matching published webble definitions
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
        getSearchResult: function(queryStr, verify) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/webbles?q=' + encodeURIComponent(queryStr) + (verify ? '&verify=1' : ''));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(queryStr));
            }
        },

      /**
       * Checks whether the webbles with the given ids are trusted by the current user
       *
       * @param {Array} webbleIdList - a list of webble ids
       *
       * @returns {Array.<bool>} an array with boolean values such that result[i] == true iff webbleIdList[i] is
       * trusted, otherwise false
       */
        verifyWebbles: function(webbleIdList) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.put('/api/verify/webbles', { webbles: webbleIdList });
            }
            else{
                return webService.get('', getFakeData.anyFakeData(webbleIdList));
            }
        },

        setWblRate: function(wblDefId, rate, comment) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.put('/api/webbles/' + encodeURIComponent(wblDefId) + '/rating', {
	                rating: rate,
	                post: {
		                title: null,
		                keywords: null,
		                body: comment,
		                author: null
	                }
                });
            }
            else{
                return webService.get('', getFakeData.anyFakeData({wblDefId: wblDefId, rate: rate, comment: comment}));
            }
        },
	    getWblRate: function(wblDefId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/webbles/' + encodeURIComponent(wblDefId) + '/rating');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData(wblDefId));
		    }
	    },
        deleteWebbleDef: function(wblDefId) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.delete('/api/webbles/' + encodeURIComponent(wblDefId));
            }
            else{
                return webService.get('', getFakeData.anyFakeData(wblDefId));
            }
        },

	    // User-centric operations
	    //

	    /**
	     * Fetches a list with all the groups to which the current user belongs
	     *
	     * @returns {*} a promise that is fulfilled on success with a list of group definitions
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
	    getMyGroups: function() {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/users/groups');
		    }
		    else{
			    return webService.get('', getFakeData.anyFakeData());
		    }
	    },

	    /**
	     * Fetches all the webbles that are managed by the current user and optionally match the given string
	     *
	     * @param queryStr - A string to match against the metadata of the published webble definitions
	     *
	     * @returns {*} a promise that is fulfilled on success with a list of webble metadata
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
	    getMyWebbles: function(queryStr) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/mywebbles');
		    }
		    else{
			    return webService.get('', getFakeData.anyFakeData(queryStr));
		    }
	    },

	    /**
	     * Fetches an access key object that is associated either with the user's account or with the
	     * groups, including the parent groups, to which the user belongs
	     *
	     * @param {string} realm - Any string uniquely identifying the issuer of the access key -
	     *      usually the domain name of the target service e.g., google.com, amazon.co.uk, microsoft.co.br, etc.
	     * @param {string} resource - Any string uniquely identifying the resource(s) to which this key provides
	     *      access to - usually an identifier refering to the target services e.g., maps, all, office2014_xp_pro, etc.
	     *
	     * @returns {*} a promise that is fulfilled on success with the access key object
	     *      and rejected on failure with a user friendly string message that describes the error
	     */
	    getMyAccessKey: function (realm, resource) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/licenses/key?realm=' + encodeURIComponent(realm) + '&resource=' + encodeURIComponent(resource))
				    .then(function(result) {
					    try {
						    return angular.fromJson(result); // Try to parse as json
					    } catch (err) {
						    return result;
					    }
				    });
		    }
		    else {
			    return webService.get('', getFakeData.anyFakeData(realm, resource));
		    }
	    },

	    // Sharing support
	    //
	    addWblCollaborator: function(wblDefId, userArray) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.put('/api/webbles/' + encodeURIComponent(wblDefId) + '/share', {users: userArray});
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData({wblDefId: wblDefId, userArray: userArray}));
		    }
	    },
	    removeWblCollaborators: function(wblDefId, userArray) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.put('/api/webbles/' + encodeURIComponent(wblDefId) + '/share?delete', {users: userArray});
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData({wblDefId: wblDefId, userArray: userArray}));
		    }
	    },
	    clearWblCollaborators: function(wblDefId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.delete('/api/webbles/' + encodeURIComponent(wblDefId) + '/share');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData(wblDefId));
		    }
	    },
	    getWblCollaborators: function(wblDefId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/webbles/' + encodeURIComponent(wblDefId) + '/share');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData(wblDefId));
		    }
	    },
	    addWSCollaborator: function(wsId, userArray) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.put('/api/workspaces/' + encodeURIComponent(wsId) + '/share', {users: userArray});
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData({wsId: wsId, userArray: userArray}));
		    }
	    },
	    removeWSCollaborators: function(wsId, userArray) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.put('/api/workspaces/' + encodeURIComponent(wsId) + '/share?delete=1', {users: userArray});
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData({wsId: wsId, userArray: userArray}));
		    }
	    },
      removeMeAsWSCollaborator: function(wsId) {
          if(wwDef.WEBSERVICE_ENABLED){
              return webService.delete('/api/workspaces/' + encodeURIComponent(wsId) + '/share?me=1');
          }
          else{
              return webService.get('', getFakeData.anyFakeData(wsId));
          }
      },
	    clearWSCollaborators: function(wsId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.delete('/api/workspaces/' + encodeURIComponent(wsId) + '/share');
		    }
		    else{
          return webService.get('', getFakeData.anyFakeData(wsId));
		    }
	    },
	    getWSCollaborators: function(wsId) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.get('/api/workspaces/' + encodeURIComponent(wsId) + '/share');
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData(wsId));
		    }
	    },

        getFAQs: function() {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.get('/api/support/qa');
            }
            else{
                return webService.get('', getFakeData.anyFakeData());
            }
        },
        addFAQ: function(newQ) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.post('/api/support/qa', { qa: newQ });
            }
            else{
                return webService.get('', getFakeData.anyFakeData(newQ));
            }
        },
        answerFAQ: function(aFAQ) {
            if(wwDef.WEBSERVICE_ENABLED){
                return webService.put('/api/support/qa/' + encodeURIComponent(aFAQ.id), { qa: aFAQ });
            }
            else{
                return webService.get('', getFakeData.anyFakeData(aFAQ));
            }
        },
	    deleteFAQ: function(aFAQ) {
		    if(wwDef.WEBSERVICE_ENABLED){
			    return webService.delete('/api/support/qa/' + encodeURIComponent(aFAQ.id));
		    }
		    else{
                return webService.get('', getFakeData.anyFakeData(aFAQ));
		    }
	    }
    };
});
//=================================================================================


//=================================================================================
// Get Fake Data
// A service that contains hardcoded data to be given as a substitute for real data
//=================================================================================
ww3Services.factory('getFakeData', function($log, webService) {
    return {
        anyFakeData: function(parameter) {
            return {};
        }
    };
});
//=================================================================================


//=================================================================================
// Get CSS Class property value
// A service that returns the class value for a specific property found within
// loaded style sheets.
//=================================================================================
ww3Services.factory('getCSSClassPropValue', [function() {
    return function(style, selector, sheet){
        var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
        for (var i = 0, l = sheets.length; i < l; i++) {
            var theSheet = sheets[i];
            if(theSheet.href.search(document.domain) != -1){
                if( !theSheet.cssRules ) { continue; }
                for (var j = 0, k = theSheet.cssRules.length; j < k; j++) {
                    var rule = theSheet.cssRules[j];
                    if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
                        return rule.style[style];
                    }
                }
            }
        }
        return null;
    }
}]);
//=================================================================================


//=================================================================================
// Get Uri Variables
// A service that returns a JavaScript Object containing the URL parameters
//=================================================================================
ww3Services.factory('getUrlVars', [function() {
    return function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
}]);
//=================================================================================


//=================================================================================
// Keyboard key name from key code
// A service that returns the name of a key on the keyboard based on the key code
// value.
//=================================================================================
ww3Services.factory('fromKeyCode', [function() {
    return function(n){
        if( 47<=n && n<=90 ) return String.fromCharCode(n);
        if( 96<=n && n<=105) return 'NUM '+(n-96);
        if(112<=n && n<=135) return 'F'+(n-111);

        if(n==3)  return 'Cancel'; //DOM_VK_CANCEL
        if(n==6)  return 'Help';   //DOM_VK_HELP
        if(n==8)  return 'Backspace';
        if(n==9)  return 'Tab';
        if(n==12) return 'NUM 5';  //DOM_VK_CLEAR
        if(n==13) return 'Enter';
        if(n==16) return 'Shift';
        if(n==17) return 'Ctrl';
        if(n==18) return 'Alt';
        if(n==19) return 'Pause|Break';
        if(n==20) return 'CapsLock';
        if(n==27) return 'Esc';
        if(n==32) return 'Space';
        if(n==33) return 'PageUp';
        if(n==34) return 'PageDown';
        if(n==35) return 'End';
        if(n==36) return 'Home';
        if(n==37) return 'Left Arrow';
        if(n==38) return 'Up Arrow';
        if(n==39) return 'Right Arrow';
        if(n==40) return 'Down Arrow';
        if(n==42) return '*'; //Opera
        if(n==43) return '+'; //Opera
        if(n==44) return 'PrntScrn';
        if(n==45) return 'Insert';
        if(n==46) return 'Delete';

        if(n==91) return 'WIN Start';
        if(n==92) return 'WIN Start Right';
        if(n==93) return 'WIN Menu';
        if(n==106) return '*';
        if(n==107) return '+';
        if(n==108) return 'Separator'; //DOM_VK_SEPARATOR
        if(n==109) return '-';
        if(n==110) return '.';
        if(n==111) return '/';
        if(n==144) return 'NumLock';
        if(n==145) return 'ScrollLock';

//Media buttons (Inspiron laptops)
        if(n==173) return 'Media Mute On|Off';
        if(n==174) return 'Media Volume Down';
        if(n==175) return 'Media Volume Up';
        if(n==176) return 'Media >>';
        if(n==177) return 'Media <<';
        if(n==178) return 'Media Stop';
        if(n==179) return 'Media Pause|Resume';

        if(n==182) return 'WIN My Computer';
        if(n==183) return 'WIN Calculator';
        if(n==186) return '; :';
        if(n==187) return '= +';
        if(n==188) return ', <';
        if(n==189) return '- _';
        if(n==190) return '. >';
        if(n==191) return '/ ?';
        if(n==192) return '\` ~';
        if(n==219) return '[ {';
        if(n==220) return '\\ |';
        if(n==221) return '] }';
        if(n==222) return '\' "';
        if(n==224) return 'META|Command';
		if(n==226) return '\\ _';
        if(n==229) return 'WIN IME';

        if(n==255) return 'Device-specific'; //Dell Home button (Inspiron laptops);

        return null;
    }
}]);
//=================================================================================


//=================================================================================
// Bit Flag Operations
// A service that turns binary flags on and off.
//=================================================================================
ww3Services.factory('bitflags', [function() {
    return {
        off: function(whatFlagSelection, whatBitFlag) {
            return (whatFlagSelection & ~whatBitFlag);
        },
        on: function(whatFlagSelection, whatBitFlag) {
            return (whatFlagSelection | whatBitFlag);
        },
        toggle: function(whatFlagSelection, whatBitFlag) {
            return (whatFlagSelection ^ whatBitFlag);
        }
    }
}]);
//=================================================================================


//=================================================================================
// Get Key By Value
// A service that gets a associative array and a value and returns the name of the
// key containing that value or, if not found, returns null.
//=================================================================================
ww3Services.factory('getKeyByValue', [function() {
    return function(object, value){
        for( var prop in object ) {
            if( object.hasOwnProperty( prop ) ) {
                if( object[ prop ] === value )
                    return prop;
            }
        }
        return '';
    }
}]);
//=================================================================================


//=================================================================================
// isExist
// A service that checks if something exist somewhere. For example if a specific
// value exists in a specific array.
//=================================================================================
ww3Services.factory('isExist', [function() {
  return {
      valueInArray: function(theArray, theValue) {
          var doesExist = false;
          for (var i = 0; i < theArray.length; i++) {
              if(theArray[i] == theValue){
                  doesExist = true;
                  break;
              }
          }
          return doesExist;
      }
  }
}]);
//=================================================================================


//=================================================================================
// Is Valid Enum Value
// A service that test that a specified value is contained within the range of
// values inside a specific Enum value collection.
// Values is validated both by key name and/or by key value.
//=================================================================================
ww3Services.factory('isValidEnumValue', [function() {
    return function(enumToTest, valueToTest){
        var result = false;
        for(var enumVal in enumToTest){
            if(valueToTest == enumVal || valueToTest == enumToTest[enumVal]){
                result = true;
                break;
            }
        }
        return result;
    }
}]);
//=================================================================================


//=================================================================================
// Is Valid Style Value
// A service that test that a specified style value within a specified style
// setting is a valid option.
//=================================================================================
ww3Services.factory('isValidStyleValue', function(isSafeFontFamily) {
    return function(styleToTest, possibleStyleValue){
        var result = true;
        var testElement = document.createElement("div");
        var queriedStyleValue;
        if(styleToTest.search('color') != -1){
            testElement.style.backgroundColor = '';
            testElement.style.backgroundColor = possibleStyleValue;
            queriedStyleValue = testElement.style.backgroundColor;
            if (queriedStyleValue.length == 0){
                result=false;
            }
        }
        else if(styleToTest == 'overflow'){
            testElement.style.overflow = '';
            testElement.style.overflow = possibleStyleValue;
            queriedStyleValue = testElement.style.overflow;
            if (queriedStyleValue.length == 0){
                result=false;
            }
        }
        else if(styleToTest == 'border-style'){
            testElement.style.borderStyle = '';
            testElement.style.borderStyle = possibleStyleValue;
            queriedStyleValue = testElement.style.borderStyle;
            if (queriedStyleValue.length == 0){
                result=false;
            }
        }
        else if(styleToTest == 'font-family'){
            if (!isSafeFontFamily(possibleStyleValue)){
                result=false;
            }
        }

        return result;
    }
});
//=================================================================================


//=================================================================================
// JSON Query
// A collection of functions to query a json object.
//=================================================================================
ww3Services.factory('jsonQuery', [function() {
    return {
        allValByKey: function(obj, key) {
            var objects = [];
            for (var i in obj) {
                if (!obj.hasOwnProperty(i)){ continue; }

                //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
                if (i == key) {
                    objects.push(obj[i]);
                }

                if (typeof obj[i] == 'object') {
                    var moreVals = this.allValByKey(obj[i], key);
                    if(moreVals.length > 0){
                        objects = objects.concat(moreVals);
                    }
                }
            }
            return objects;
        },
        allObjWithKey: function(obj, key) {
            var objects = [];
            for (var i in obj) {
                if (!obj.hasOwnProperty(i)){ continue; }

                //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
                if (i == key) {
                    var newObj = {};
                    newObj[i] = obj[i];
                    objects.push(newObj);
                }

                if (typeof obj[i] == 'object') {
                    var moreVals = this.allObjWithKey(obj[i], key);
                    if(moreVals.length > 0){
                        objects = objects.concat(moreVals);
                    }
                }
            }
            return objects;
        }
    }
}]);
//=================================================================================


//=========================================================================================
// Get Timestamp
// This method creates a unix like time stamp value. (to be used as an update control for
// slot changes).
//=========================================================================================
ww3Services.factory('getTimestamp', function() {
    return function(){
        return new Date().getTime() / 1000;
    };
});
//=========================================================================================


//=================================================================================
// Slot (class service)
// This is an object instance provider for the class concept of 'Slot'
//=================================================================================
ww3Services.factory('Slot', function($log, Enum, getTimestamp, isValidEnumValue) {
    //CONSTRUCTOR
    function Slot(sName, sValue, sDispName, sDispDesc, sCat, sMetaData, sElementPntr){
        //Properties
        //============
        var name_ = undefined;
        this.getName = function(){return name_;};
        this.setName = function(newSlotName){name_ = newSlotName;};

        var value_ = undefined;
        this.getValue = function(){return value_;};
        this.setValue = function(newValue){value_ = newValue;};

        var category_ = undefined;
        this.getCategory = function(){return category_;};
        this.setCategory = function(newCat){category_ = newCat;};

        var timestamp_ = 0;
        this.getTimestamp = function(){return timestamp_;};
        this.resetTimestamp = function(){timestamp_ = 0;};
        this.setTimestamp = function(){timestamp_ = getTimestamp();};
        this.setCustomTimestamp = function(newTimestampValue){timestamp_ = newTimestampValue;};

        var elementPntr_ = undefined;
        this.getElementPntr = function(){return elementPntr_;};
        this.setElementPntr = function(newElementPntr){elementPntr_ = newElementPntr;};

        var displayName_ = '';
        this.getDisplayName = function(){return displayName_;};
        this.getExtDisplayName = function(){return displayName_ + ' [' + name_ + ']';};
        this.setDisplayName = function(newDisplayName){displayName_ = newDisplayName;};

        var displayDescription_ = '';
        this.getDisplayDescription = function() {return displayDescription_;};
        this.setDisplayDescription = function(newDisplayDescription){displayDescription_ = newDisplayDescription;};

        var metaData_ = null;
        this.getMetaData = function(){return metaData_;};
        this.setMetaData = function(newMetaData){metaData_ = newMetaData;};

        var disabledSettings_ = Enum.SlotDisablingState.None;
        this.getDisabledSetting = function() {return disabledSettings_;};
        this.setDisabledSetting = function(newDisabledSetting){disabledSettings_ = newDisabledSetting;};

        var isCustomMade_ = false;
        this.getIsCustomMade = function(){return isCustomMade_;};
        this.setIsCustomMade = function(customMadeState){isCustomMade_ = customMadeState;};

		var originalType_ = '';
		this.getOriginalType = function(){return originalType_;};

        this.cssValWatch = undefined;

        //prop initiation
        //================
        if(sName != undefined && sName != ''){
            name_ = sName;
        }
        value_ = sValue;
        if (sDispName == undefined || sDispName == ''){
            sDispName = sName;
        }
        displayName_ = sDispName;
        displayDescription_ = sDispDesc;

        category_ = sCat;
        if(sMetaData != undefined){
            metaData_ = sMetaData;
        }
        if(sElementPntr != undefined){
            elementPntr_ = sElementPntr;
        }

		originalType_ = typeof value_;
		if(metaData_ != null && (metaData_.inputType == Enum.aopInputTypes.Point || metaData_.inputType == Enum.aopInputTypes.Size)){
			originalType_ = 'vector';
		}
		else if(Object.prototype.toString.call( value_ ) === '[object Array]') {
			originalType_ = 'array';
		}
    }

    return Slot;
});
//=================================================================================


//=================================================================================
// Value Modifier and Separator
// A collection of functions that modify or separate values
//=================================================================================
ww3Services.factory('valMod', function($log, localStorageService) {
    return {
        getValUnitSeparated: function(theValue, noPxAddon){
            if(theValue != undefined){
                var valAsStr = theValue.toString();
                var numVal = '';
                var valStrEnd = '';
                for(var i = 0; i < valAsStr.length; i++){
                    if(!isNaN(valAsStr[i]) || valAsStr[i] == '.' || (i == 0 && valAsStr[i] == '-')){
                        numVal += valAsStr[i];
                    }
                    else{
                        valStrEnd = valAsStr.substr(i);
                        break;
                    }
                }

                if(!noPxAddon){
                    return [parseFloat(numVal), valStrEnd == '' ? 'px' : valStrEnd];
                }
                else{
                    return [parseFloat(numVal), valStrEnd];
                }
            }
            else{
                return ['', ''];
            }
        },
        addPxMaybe: function(theName, theVal) {
            if(theName.search('top') != -1 || theName.search('left') != -1 || theName.search('font-size') != -1 || theName.search('width') != -1 || theName.search('height') != -1){
                if(!isNaN(theVal)){
                    theVal = theVal + 'px';
                }
            }
            return theVal;
        },
        stringify: function(theVal) {
            if($.isArray(theVal)){
                theVal = '[' + theVal.toString() + ']';
            }
            else{
                try {
                    var tempVal = JSON.stringify(theVal);

                    if(tempVal.toString().search('hashKey') != -1){
                        theVal = angular.toJson(theVal);
                    }
                    else{
                        theVal = tempVal
                    }
                } catch(err) { /*Don't need to do any catching, just ignore the failed attempt and return the original value*/ }
            }
            return theVal;
        },
        parse: function(theVal) {
            if(theVal[0] == '[' && theVal[theVal.length-1] == ']'){
                theVal = theVal.replace('[', '').replace(']', '').split(',');
            }
            else{
                try {
                    theVal = JSON.parse(theVal);

                } catch(err) { /*Don't need to do any catching, just ignore the failed attempt and return the original value*/ }
            }
            return theVal;
        },
		//Formats and return a javascript date to the iso format yyyy-mm-dd.
		getFormatedDate: function(inDate) {
			var newFormatedDate = '';

			if(!inDate.getFullYear){
				inDate = new Date(inDate);
			}

			if(inDate.getFullYear && inDate != 'Invalid Date'){
				var month = inDate.getMonth()+1;
				var day = inDate.getDate();
				newFormatedDate = inDate.getFullYear() + '-' + (month<10 ? '0' : '') + month + '-' + (day<10 ? '0' : '') + day;
			}
			else{
				$log.log("Date must be of proper format, preferably Iso standard yyyy-mm-dd");
			}

			return newFormatedDate;
		}
    }
});
//=================================================================================


//=========================================================================================
// Is Empty
// Checks weather an object is empty (in every way that may be).
//=========================================================================================
ww3Services.factory('isEmpty', function($log) {
    return function(obj){
        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and toValue enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }

        return true;
    };
});
//=========================================================================================


//=================================================================================
// Mathy
// A collection of math support functions
//=================================================================================
ww3Services.factory('mathy', function($log, localStorageService) {
    return {
        countDecimals: function(theValue){
            if (!isNaN(theValue) && (theValue % 1) != 0){
                return theValue.toString().split(".")[1].length;
            }
            return 0;
        },
        getRotationDegrees: function(obj) {
            var matrix = obj.css("-webkit-transform") ||
                obj.css("-moz-transform")    ||
                obj.css("-ms-transform")     ||
                obj.css("-o-transform")      ||
                obj.css("transform");

            if(matrix !== 'none') {
                var values = matrix.split('(')[1].split(')')[0].split(',');
                var a = values[0];
                var b = values[1];
                var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
            }
            else {
                var angle = 0;
            }

            return (angle < 0) ? angle +=360 : angle;
        },
		monthDiff: function(d1, d2){
			var months;
			months = (d2.getFullYear() - d1.getFullYear()) * 12;
			months -= d1.getMonth() + 1;
			months += d2.getMonth();
			return months <= 0 ? 0 : months;
		}
    }
});
//=================================================================================
