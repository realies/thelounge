"use strict";

const expect = require("chai").expect;
const fs = require("fs");
const path = require("path");

describe("public folder", function() {
	const publicFolder = path.join(__dirname, "..", "..", "public");

	it("font awesome files are copied", function() {
		expect(fs.existsSync(path.join(publicFolder, "fonts", "fontawesome-webfont.woff"))).to.be.true;
		expect(fs.existsSync(path.join(publicFolder, "fonts", "fontawesome-webfont.woff2"))).to.be.true;
	});

	it("index.html is copied", function() {
		expect(fs.existsSync(path.join(publicFolder, "index.html"))).to.be.true;
	});

	it("javascript files are built", function() {
		expect(fs.existsSync(path.join(publicFolder, "js", "bundle.js"))).to.be.true;
		expect(fs.existsSync(path.join(publicFolder, "js", "bundle.vendor.js"))).to.be.true;
	});

	it("javascript map is created", function() {
		expect(fs.existsSync(path.join(publicFolder, "js", "bundle.js.map"))).to.be.true;
	});

	it("loading-slow-alert.js is copied", function() {
		expect(fs.existsSync(path.join(publicFolder, "js", "loading-slow-alert.js"))).to.be.true;
	});
});
