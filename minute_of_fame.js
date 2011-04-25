var commands = require('./js/commands');

exports.connect = connect;
exports.disconnect = disconnect;
exports.runCommand = runCommand;

//****************************************************
// Public Functions
//****************************************************
function connect(client) {
	// Set the socket if it doesn't exist yet
	if (!socket) {
		socket = client.listener;
	}
	
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

var socket;

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
// User Command Receivers
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
	};
	
	client.send(command);
}

//****************************************************
// Queue Command Receivers
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
	
	socket.broadcast(command);
	
	if (queue.length == 1) {
		queueNext();
	}
}

function queueLeave(params, client) {
	var user = params.user;
	
	queueRemoveUser(user);
}

//****************************************************
// Queue Command Senders
//****************************************************
function queueNext() {
	var command = {
		type: "queue",
		action: "next",
		params: {},
	}
	
	var client = socket.clientsIndex[queue[0].id];
	client.send(command);
}

//****************************************************
// Queue Helper Functions
//****************************************************
function queueRemoveUser(user) {
	var index = queueFindIndex(user);
	
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
	
	socket.broadcast(command);
}

function queueFindIndex(user) {
	for (var i = 0; i < queue.length; i++) {
		if (user.id == queue[i].id) return i;
	}
	
	return -1;
}

//****************************************************
// Performance Command Receivers
//****************************************************
function performanceStart() {
	var command = {
		type: "performance",
		action: "start",
		params: {
			performance: performance,
		}
	}
	
	socket.broadcast(command);
}

function performanceEnd() {
	// TODO: Save performance to database
	
	var command = {
		type: "performance",
		action: "end",
		params: {
			performance: performance,
		}
	}
	
	backstageCheckTimer(15);
}

//****************************************************
// Backstage Command Receivers
//****************************************************
var backstageCommands = {
	status: backstageStatus,
}
commands.inject("backstage", backstageCommands);

function backstageStatus(params, client) {
	var ready = params.ready;
	
	queueRemoveUser(queue[0]);
	// TODO: Somewhere here we ahve to check if there are people in the queue before starting the next and backstage timer
	queueNext();
	
	if (ready) {
		performanceStart();
	} else {
		backstageCheckTimer(30);
	}
}

//****************************************************
// Backstage Command Senders
//****************************************************
function backstageCheck() {
	var command = {
		type: "backstage",
		action: "check",
		params: {
			user: queue[0],
		}
	}
	
	var client = socket.clientsIndex[queue[0].id];
	
	client.send(command);
}

function backstageCheckTimer(seconds) {
	setTimeout(function() {
		backstageCheck();
	}, seconds * 1000);
	
	var command = {
		type: "backstage",
		action: "checkTimer",
		params: {
			user: queue[0],
		}
	}
	
	socket.send(command);
}























