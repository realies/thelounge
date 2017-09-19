"use strict";

const $ = require("jquery");
const input = $("#input");

var serverHash = -1;
var lastMessageId = -1;

module.exports = {
	serverHash,
	lastMessageId,
	confirmExit,
	forceFocus,
	move,
	resetHeight,
	setNick,
	toggleNickEditor,
	toggleNotificationMarkers,
	requestIdleCallback,
};

function resetHeight(element) {
	element.style.height = element.style.minHeight;
}

// Triggering click event opens the virtual keyboard on mobile
// This can only be called from another interactive event (e.g. button click)
function forceFocus() {
	input.trigger("click").focus();
}

function toggleNickEditor(toggle) {
	$("#nick").toggleClass("editable", toggle);
	$("#nick-value").attr("contenteditable", toggle);
}

function setNick(nick) {
	// Closes the nick editor when canceling, changing channel, or when a nick
	// is set in a different tab / browser / device.
	toggleNickEditor(false);

	$("#nick-value").text(nick);
}

const favicon = $("#favicon");

function toggleNotificationMarkers(newState) {
	// Toggles the favicon to red when there are unread notifications
	if (favicon.data("toggled") !== newState) {
		var old = favicon.attr("href");
		favicon.attr("href", favicon.data("other"));
		favicon.data("other", old);
		favicon.data("toggled", newState);
	}

	// Toggles a dot on the menu icon when there are unread notifications
	$("#viewport .lt").toggleClass("notified", newState);
}

function confirmExit() {
	if ($("body").hasClass("public")) {
		window.onbeforeunload = function() {
			return "Are you sure you want to navigate away from this page?";
		};
	}
}

function move(array, old_index, new_index) {
	if (new_index >= array.length) {
		let k = new_index - array.length;
		while ((k--) + 1) {
			this.push(undefined);
		}
	}
	array.splice(new_index, 0, array.splice(old_index, 1)[0]);
	return array;
}

function requestIdleCallback(callback, timeout) {
	if (window.requestIdleCallback) {
		// During an idle period the user agent will run idle callbacks in FIFO order
		// until either the idle period ends or there are no more idle callbacks eligible to be run.
		window.requestIdleCallback(callback, {timeout: timeout});
	} else {
		callback();
	}
}
