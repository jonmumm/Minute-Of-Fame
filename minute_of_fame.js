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
var users = {};
var performance = {};
performance.ongoing = false;

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
	
	// Remove user from queue if user is in it
	if (queueFindIndex(user) >= 0) {
		queueRemoveUser(user);
	}
	
	if (performance.ongoing) {
		// If user is performing, cancel performance
		if (performance.user.id == user.id) {
			performanceCancel();
		}
	}

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
	
	// If nobody is performing, start next performance
	if (queue.length == 1 && !performance.ongoing) {
		performanceNext();
	}
}

function queueLeave(params) {
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
	
	queue.splice(index, 1);
	
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
var performanceCommands = {
	cancel: performanceCancel,
}
commands.inject("performance", performanceCommands);

function performanceCancel(params, client) {	
	// Mark as not performing
	performance.ongoing = false;
	
	var command = {
		type: "performance",
		actions: "cancel",
		params: {
			performance: performance,
		}
	}
	
	socket.broadcast(command);
	
	// TODO: Save performance to database
	
	// Start the next performance
	performanceNext();
}

//****************************************************
// Performance Command Senders
//****************************************************
function performanceIntro() {
	var user = performance.user;
	
	var command = {
		type: "performance",
		action: "intro",
		params: {
			performance: performance,
		}
	}
	
	var client = socket.clientsIndex[user.id];
	client.broadcast(command);
}

function performanceStart() {
	// Mark that we have left staging
	performance.staging = false;

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
	performance.ongoing = false;
	
	var command = {
		type: "performance",
		action: "end",
		params: {
			performance: performance,
		}
	}
	
	socket.broadcast(command);
	
	// TODO: Save performance to database
	
	// Start the next performance
	performanceNext();
}

//****************************************************
// Performance Helper Functions
//****************************************************
function performanceNext() {
	// If there are people in the queue
	if (queue.length > 0) {
		// Get the next perfomer
		var user = queue[0];

		// Update the performance object
		performance.ongoing = true;
		performance.staging = true;
		performance.user = user;

		// Put the performer on stage
		stageEnter();
		
		// Start the performance introduction
		performanceIntro();		
	}
}

//****************************************************
// Stage Command Receivers
//****************************************************
var stageCommands = {
	status: stageStatus,
}
commands.inject("stage", stageCommands);

// Update the ready variable from the performer on stage
function stageStatus(params, client) {
	var ready = params.ready;
	
	performance.user.ready = ready;
}

//****************************************************
// Stage Command Senders
//****************************************************
function stageEnter() {
	var user = performance.user;
	
	var command = {
		type: "stage",
		action: "enter",
		params: {
			performance: performance,
		}
	}
	
	var client = socket.clientsIndex[user.id];
	client.send(command);
	
	stageCheckTimer(15);
}

function stageCheckTimer(seconds) {
	setTimeout(function() {
		stageCheck();
	}, seconds * 1000);
	
	var command = {
		type: "stage",
		action: "checkTimer",
		params: {
			user: queue[0],
		}
	}
	
	socket.broadcast(command);
}

function stageCheck() {
	// Check if performer is ready
	if (performance.user.ready) {
		performanceStart();
	} else {
		performanceNext();
	}
}























