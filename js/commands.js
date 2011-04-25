var Commands = {};

function validate(command) {
	// Check that the message is a command
	if (!command.hasOwnProperty("type") || !command.hasOwnProperty("action") || !command.hasOwnProperty("params")) {		
		return false;
	}
	
	// Check that the command has a valid type and action
	if (!Commands.hasOwnProperty(command.type) || !Commands[command.type].hasOwnProperty(command.action)) {
		return false;
	}
	
	return true;	
}

function run(command, client) {
	console.log(command);
	if (client) {
		Commands[command.type][command.action](command.params, client);
	} else {
		Commands[command.type][command.action](command.params);
	}	
}

function inject(type, functions) {
	Commands[type] = functions;
}

exports.validate = validate;
exports.run = run;
exports.inject = inject;