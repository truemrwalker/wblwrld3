/*\
title: $:/plugins/webbleworld/webbleinfo.js
type: application/javascript
module-type: widget


\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "webbleworld";
exports.platforms = ["browser"];
exports.synchronous = false;

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WebbleImgWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

var WebbleListWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WebbleImgWidget.prototype = new Widget();
WebbleListWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WebbleImgWidget.prototype.render = function(parent,nextSibling) {

	// Compute our attributes
	this.computeAttributes();

	// Execute our logic
	this.execute();

	var info = this.createInfo(parent,nextSibling);

	// Insert the chart into the DOM and render any children
	parent.insertBefore(info,nextSibling);
	this.domNodes.push(info);
};

WebbleListWidget.prototype.render = function(parent,nextSibling) {

	// Compute our attributes
	this.computeAttributes();

	// Execute our logic
	this.execute();

	var list = this.createList(parent,nextSibling);

	// Insert the chart into the DOM and render any children
	parent.insertBefore(list,nextSibling);
	this.domNodes.push(list);
};

WebbleImgWidget.prototype.createInfo = function(parent,nextSibling) {
	var self = this;

	var img = document.createElement("img");

	$tw.utils.httpRequest({
		url: "https://localhost:7443/api/webbles/"+this.webble,
		callback: function (error,data){

			if (error) {
				console.log("ERROR:"+error);
			}
			else {
				// $tw.wiki.addTiddler({title:tiddlername, text:data, type: "text/x-markdown"});
			    console.log(data);
				//img.src = "http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg";

				var w = JSON.parse(data);
				//img.src = w.webble.image;
				img.src = "https://localhost:7443/" + w.webble.image;
			}
  	}});
	return img;
};

WebbleListWidget.prototype.createList = function(parent,nextSibling) {
	var self = this;

	var ul = document.createElement("ul");

	$tw.utils.httpRequest({
		url: "https://localhost:7443/api/webbles?q="+this.query,
		callback: function (error,data){

			if (error) {
				console.log("ERROR:"+error);
			}
			else {
				// $tw.wiki.addTiddler({title:tiddlername, text:data, type: "text/x-markdown"});
			    console.log(data);
				//img.src = "http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg";

				var webbles = JSON.parse(data);
				webbles.forEach(function(w) {
					var li = document.createElement("li");
					var textNode = document.createTextNode(w.webble.displayname);
					li.appendChild(textNode);
					ul.appendChild(li);
				});
			}
  	}});
	return ul;
};

/*
Compute the internal state of the widget
*/
WebbleImgWidget.prototype.execute = function() {

	// Get the parameters from the attributes
	this.webble = this.getAttribute("webble","fundamental");
};

WebbleListWidget.prototype.execute = function() {

	// Get the parameters from the attributes
	this.query = this.getAttribute("query","basic");
};

exports.webbleimage = WebbleImgWidget;
exports.webblelist = WebbleListWidget;

})();
