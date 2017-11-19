"use strict";

const $ = require("jquery");
const socket = require("../socket");
const templates = require("../../views");
const options = require("../options");
const webpush = require("../webpush");
const storage = require("../localStorage");

socket.on("configuration", function(data) {
	if (!options.initialize) {
		return;
	}

	$("#settings").html(templates.windows.settings(data));
	$("#connect").html(templates.windows.connect(data));

	$("#play").on("click", () => {
		const pop = new Audio();
		pop.src = "audio/pop.ogg";
		pop.play();
	});

	options.initialize();
	webpush.initialize();

	// TODO: #sign-in needs to be handled in auth.js otherwise its broken
	const forms = $("#sign-in, #connect, #change-password");

	forms.on("submit", "form", function() {
		const form = $(this);
		const event = form.data("event");

		form.find(".btn").attr("disabled", true);

		const values = {};
		$.each(form.serializeArray(), function(i, obj) {
			if (obj.value !== "") {
				values[obj.name] = obj.value;
			}
		});

		if (values.user) {
			storage.set("user", values.user);
		}

		socket.emit(event, values);

		return false;
	});

	forms.on("focusin", ".nick", function() {
		// Need to set the first "lastvalue", so it can be used in the below function
		const nick = $(this);
		nick.data("lastvalue", nick.val());
	});

	forms.on("input", ".nick", function() {
		const nick = $(this).val();
		const usernameInput = forms.find(".username");

		// Because this gets called /after/ it has already changed, we need use the previous value
		const lastValue = $(this).data("lastvalue");

		// They were the same before the change, so update the username field
		if (usernameInput.val() === lastValue) {
			usernameInput.val(nick);
		}

		// Store the "previous" value, for next time
		$(this).data("lastvalue", nick);
	});
});
