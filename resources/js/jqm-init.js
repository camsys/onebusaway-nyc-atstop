/*global $,document,console*/
/*global FastClick*/

/* initialize FastClick */
$(function () {
	FastClick.attach(document.body);
});

/* config jQM */
$(document).on("mobileinit", function () {
	console.log("jQuery Mobile initialized");
	$.mobile.loader.prototype.options.text = "LOADING";
	$.mobile.loader.prototype.options.textVisible = true;
	$.mobile.loader.prototype.options.textonly = true;
});