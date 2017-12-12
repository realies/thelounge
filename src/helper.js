"use strict";

const pkg = require("../package.json");
var _ = require("lodash");
var path = require("path");
var os = require("os");
var fs = require("fs");
var net = require("net");
var bcrypt = require("bcryptjs");
const colors = require("colors/safe");

let homePath;
let configPath;
let usersPath;
let storagePath;
let packagesPath;

const Helper = {
	config: null,
	expandHome,
	getHomePath,
	getPackagesPath,
	getPackageModulePath,
	getStoragePath,
	getConfigPath,
	getUsersPath,
	getUserConfigPath,
	getUserLogsPath,
	setHome,
	getVersion,
	getGitCommit,
	ip2hex,

	password: {
		hash: passwordHash,
		compare: passwordCompare,
		requiresUpdate: passwordRequiresUpdate,
	},
};

module.exports = Helper;

Helper.config = require(path.resolve(path.join(
	__dirname,
	"..",
	"defaults",
	"config.js"
)));

function getVersion() {
	const gitCommit = getGitCommit();
	return gitCommit ? `source (${gitCommit})` : `v${pkg.version}`;
}

let _gitCommit;
function getGitCommit() {
	if (_gitCommit !== undefined) {
		return _gitCommit;
	}
	try {
		_gitCommit = require("child_process")
			.execSync("git rev-parse --short HEAD 2> /dev/null") // Returns hash of current commit
			.toString()
			.trim();
		return _gitCommit;
	} catch (e) {
		// Not a git repository or git is not installed
		_gitCommit = null;
		return null;
	}
}

function setHome(newPath) {
	homePath = expandHome(newPath);
	configPath = path.join(homePath, "config.js");
	usersPath = path.join(homePath, "users");
	storagePath = path.join(homePath, "storage");
	packagesPath = path.join(homePath, "packages", "node_modules");

	// Reload config from new home location
	if (fs.existsSync(configPath)) {
		const userConfig = require(configPath);

		if (_.isEmpty(userConfig)) {
			log.warn(`The file located at ${colors.green(configPath)} does not appear to expose anything.`);
			log.warn(`Make sure it is non-empty and the configuration is exported using ${colors.bold("module.exports = { ... }")}.`);
			log.warn("Using default configuration...");
		}

		this.config = _.merge(this.config, userConfig);
	}

	if (!this.config.displayNetwork && !this.config.lockNetwork) {
		this.config.lockNetwork = true;

		log.warn(`${colors.bold("displayNetwork")} and ${colors.bold("lockNetwork")} are false, setting ${colors.bold("lockNetwork")} to true.`);
	}

	// Load theme color from manifest.json
	const manifest = require("../public/manifest.json");
	this.config.themeColor = manifest.theme_color;

	// TODO: Remove in future release
	if (this.config.debug === true) {
		log.warn("debug option is now an object, see defaults file for more information.");
		this.config.debug = {ircFramework: true};
	}

	// TODO: Remove in future release
	// Backwards compatibility for old way of specifying themes in settings
	if (this.config.theme.includes(".css")) {
		log.warn(`Referring to CSS files in the ${colors.green("theme")} setting of ${colors.green(configPath)} is ${colors.bold.red("deprecated")} and will be removed in a future version.`);
	} else {
		this.config.theme = `themes/${this.config.theme}.css`;
	}
}

function getHomePath() {
	return homePath;
}

function getConfigPath() {
	return configPath;
}

function getUsersPath() {
	return usersPath;
}

function getUserConfigPath(name) {
	return path.join(usersPath, name + ".json");
}

function getUserLogsPath(name, network) {
	return path.join(homePath, "logs", name, network);
}

function getStoragePath() {
	return storagePath;
}

function getPackagesPath() {
	return packagesPath;
}

function getPackageModulePath(packageName) {
	return path.join(Helper.getPackagesPath(), packageName);
}

function ip2hex(address) {
	// no ipv6 support
	if (!net.isIPv4(address)) {
		return "00000000";
	}

	return address.split(".").map(function(octet) {
		var hex = parseInt(octet, 10).toString(16);

		if (hex.length === 1) {
			hex = "0" + hex;
		}

		return hex;
	}).join("");
}

// Expand ~ into the current user home dir.
// This does *not* support `~other_user/tmp` => `/home/other_user/tmp`.
function expandHome(shortenedPath) {
	if (!shortenedPath) {
		return "";
	}

	const home = os.homedir().replace("$", "$$$$");
	return path.resolve(shortenedPath.replace(/^~($|\/|\\)/, home + "$1"));
}

function passwordRequiresUpdate(password) {
	return bcrypt.getRounds(password) !== 11;
}

function passwordHash(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(11));
}

function passwordCompare(password, expected) {
	return bcrypt.compare(password, expected);
}
