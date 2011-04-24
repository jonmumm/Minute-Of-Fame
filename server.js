var connect = require("connect");
var io = require("socket.io");

function start(controller) {

	// Set up the HTTP server for serving our static files
	var server = connect.createServer();
	
	server.use(connect.static(__dirname));
	server.use(require('browserify')({
		base: __dirname + '/js',
		mount: '/browserify.js',
	}));
	
	server.listen(7000); // Start server on port 5001
	
	var socket = io.listen(server);
	socket.on('connection', function(client) {
		console.log("Socket connected");
		
		controller.handleConnect(client);
		
		client.on('message', function(message) {
			controller.handleMessage(message, client);
		})
		
		client.on('disconnect', function() {
			controller.handleDisconnect(client);
		});
	});

	console.log("Server has started.");
}

exports.start = start;

