"use strict";

const fs = require("fs");
const net = require("net");
const colors = require("chalk");
const Helper = require("./helper");

class Identification {
	constructor(startedCallback) {
		this.connectionId = 0;
		this.connections = new Map();

		if (typeof Helper.config.oidentd === "string") {
			this.oidentdFile = Helper.expandHome(Helper.config.oidentd);
			log.info(`Oidentd file: ${colors.green(this.oidentdFile)}`);

			this.refresh();
		}

		if (Helper.config.identd.enable) {
			if (this.oidentdFile) {
				log.warn("Using both identd and oidentd at the same time, this is most likely not intended.");
			}

			const server = net.createServer(this.serverConnection.bind(this));
			server.listen({
				port: Helper.config.identd.port || 113,
				host: Helper.config.bind || Helper.config.host,
			}, () => {
				const address = server.address();
				log.info(`Identd server available on ${colors.green(address.address + ":" + address.port)}`);

				startedCallback(this);
			});
		} else {
			startedCallback(this);
		}
	}

	serverConnection(socket) {
		socket.on("data", (data) => {
			this.respondToIdent(socket, data);
			socket.end();
		});
	}

	respondToIdent(socket, data) {
		data = data.toString().split(",");

		const lport = parseInt(data[0]);
		const fport = parseInt(data[1]);

		if (lport < 1 || fport < 1 || lport > 65535 || fport > 65535) {
			return;
		}

		for (const connection of this.connections.values()) {
			if (connection.socket.remoteAddress === socket.remoteAddress
			&& connection.socket.remotePort === fport
			&& connection.socket.localPort === lport
			&& connection.socket.localAddress === socket.localAddress) {
				return socket.write(`${lport}, ${fport} : USERID : UNIX : ${connection.user}\r\n`);
			}
		}

		socket.write(`${lport}, ${fport} : ERROR : NO-USER\r\n`);
	}

	addSocket(socket, user) {
		const id = ++this.connectionId;

		this.connections.set(id, {socket, user});

		if (this.oidentdFile) {
			this.refresh();
		}

		return id;
	}

	removeSocket(id) {
		this.connections.delete(id);

		if (this.oidentdFile) {
			this.refresh();
		}
	}

	refresh() {
		let file = "# Warning: file generated by The Lounge: changes will be overwritten!\n";

		this.connections.forEach((connection) => {
			file += `to ${connection.socket.remoteAddress}`
				+ ` lport ${connection.socket.localPort}`
				+ ` from ${connection.socket.localAddress}`
				+ ` fport ${connection.socket.remotePort}`
				+ ` { reply "${connection.user}" }\n`;
		});

		fs.writeFile(this.oidentdFile, file, {flag: "w+"}, function(err) {
			if (err) {
				log.error("Failed to update oidentd file!", err);
			}
		});
	}
}

module.exports = Identification;
