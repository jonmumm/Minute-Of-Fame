var commands = require('./js/commands');

exports.connect = connect;
exports.disconnect = disconnect;
exports.runCommand = runCommand;

//****************************************************
// Public Functions
//****************************************************
function connect(client) {

}

function disconnect(client) {
	removeTeam(client);
}

function runCommand(command, client) {
	if (commands.validate(command)) {
		commands.run(command, client);
	} else {
		console.error("Invalid command from client.");
	}
}

