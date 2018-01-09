"use strict";

global.log = require("../log.js");

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const program = require("commander");
const colors = require("colors/safe");
const Helper = require("../helper");
const Utils = require("./utils");

if (require("semver").lt(process.version, "6.0.0")) {
	log.warn(`Support of Node.js v4 is ${colors.bold.red("deprecated")} and will be removed in The Lounge v3.`);
	log.warn("Please upgrade to Node.js v6 or more recent.");
}

program.version(Helper.getVersion(), "-v, --version")
	.option("--home <path>", `${colors.bold.red("[DEPRECATED]")} Use the ${colors.green("THELOUNGE_HOME")} environment variable instead.`)
	.option(
		"-c, --config <key=value>",
		"override entries of the configuration file, must be specified for each entry that needs to be overriden",
		Utils.parseConfigOptions
	)
	.on("--help", Utils.extraHelp);

// Parse options from `argv` returning `argv` void of these options.
const argvWithoutOptions = program.parseOptions(process.argv);

if (program.home) {
	log.warn(`${colors.bold("--home")} is ${colors.bold.red("deprecated")} and will be removed in The Lounge v3. Use the ${colors.bold("THELOUNGE_HOME")} environment variable instead.`);
}

// Check if the app was built before calling setHome as it wants to load manifest.json from the public folder
if (!fs.existsSync(path.join(
	__dirname,
	"..",
	"..",
	"public",
	"manifest.json"
))) {
	log.error(`The client application was not built. Run ${colors.bold("NODE_ENV=production npm run build")} to resolve this.`);
	process.exit(1);
}

if (process.env.LOUNGE_HOME) {
	log.warn(`${colors.green("LOUNGE_HOME")} is ${colors.bold.red("deprecated")} and will be removed in The Lounge v3.`);
	log.warn(`Use ${colors.green("THELOUNGE_HOME")} instead.`);
}

let home = process.env.THELOUNGE_HOME || program.home || process.env.LOUNGE_HOME;

if (!home) {
	home = Utils.defaultHome();
}

Helper.setHome(home);

// Merge config key-values passed as CLI options into the main config
_.merge(Helper.config, program.config);

require("./start");
require("./config");
if (!Helper.config.public && !Helper.config.ldap.enable) {
	require("./users");
}
require("./install");
require("./uninstall");

// TODO: Remove this when releasing The Lounge v3
if (process.argv[1].endsWith(`${require("path").sep}lounge`)) {
	log.warn(`The ${colors.red("lounge")} CLI is ${colors.bold.red("deprecated")} and will be removed in v3.`);
	log.warn(`Use ${colors.green("thelounge")} instead.`);
	process.argv[1] = "thelounge";
}

// `parse` expects to be passed `process.argv`, but we need to remove to give it
// a version of `argv` that does not contain options already parsed by
// `parseOptions` above.
// This is done by giving it the updated `argv` that `parseOptions` returned,
// except it returns an object with `args`/`unknown`, so we need to concat them.
// See https://github.com/tj/commander.js/blob/fefda77f463292/index.js#L686-L763
program.parse(argvWithoutOptions.args.concat(argvWithoutOptions.unknown));

if (!program.args.length) {
	program.help();
}
