var commands = require('./js/commands');

exports.connect = connect;
exports.disconnect = disconnect;
exports.runCommand = runCommand;

//****************************************************
// Public Functions
//****************************************************
function connect(client) {
	sessionJoin(client);
}

function disconnect(client) {
	sessionLeave(client);
}

function runCommand(command, client) {
	if (commands.validate(command)) {
		commands.run(command, client);
	} else {
		console.error("Invalid command from client.");
	}
}

//****************************************************
// Session Variables
//****************************************************
// TODO: Make this dynamic
var opentok = {
	apiKey: "413302",
	sessionId: "156a7a54a8c4714330c86f0be8faf65cfc896a2d",
	token: "devtoken",
}

var queue = new Array();

var performance = {};

var users = {};

//****************************************************
// Session Helper Functions
//****************************************************
function sessionJoin(client) {
	// Make the user var and store it
	var user = {
		id: client.sessionId,
		joinTime: new Date(),
	}
	users[client.sessionId] = user;
	
	var command = {
		type: "session",
		action: "join",
		params: {
			performance: performance,
			queue: queue,
			opentok: opentok,
			user: user,
		}
	}
	
	client.send(command);
	
	// TODO: Maybe broadcast new user has joined
}

function sessionLeave(client) {
	var user = users[client.sessionId];
	
	// Remove user from queue (if user is in it)
	queueRemoveUser(user, client);
	
	// TODO: Check if the user is the one performing
	
	// TODO: Maybe broadcast user has left to decrement user count
}

//****************************************************
// User Command Handlers
//****************************************************
var userCommands = {
	login: userLogin,
}
commands.inject("user", userCommands);

function userLogin(params, client) {
	var user = params.user;
	
	users[client.sessionId] = user;
	
	var command = {
		type: "user",
		action: "loginComplete",
		params: {
			user: user,
		}
	}
	
	client.send(command);
}

//****************************************************
// Queue Command Handlers
//****************************************************
var queueCommands = {
	join: queueJoin,
	leave: queueLeave,
}
commands.inject("queue", queueCommands);

function queueJoin(params, client) {
	var user = params.user;
	
	queue.push(user);
	
	var command = {
		type: "queue",
		action: "join",
		params: {
			user: user,
		}
	}
	
	client.send(command);
	client.broadcast(command);
}

function queueLeave(params, client) {
	var user = params.user;
	
	queueRemoveUser(user);
}

// Helper function
function queueRemoveUser(user, client) {
	var index = queue.indexOf(user);
	
	if (index >= 0) {
		queue.splice(index, 1);
	}
	
	var command = {
		type: "queue",
		action: "leave",
		params: {
			user: user,
		}
	}
	
	// client.send(command);
	client.broadcast(command);
}


//****************************************************
// Performance Command Handlers
//****************************************************
var performanceCommands = {
	ready: performanceReady,
	end: performanceEnd,
}
commands.inject("performance", performanceCommands);

function performanceReady(params, client) {
	
}

function performanceEnd(params, client) {
	
}

























