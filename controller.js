var minute_of_fame = require('./minute_of_fame');

// NOTE: If we were to implement multiple drafts, that logic would be handled here

function handleConnect(client) {
	minute_of_fame.connect(client);
}

function handleDisconnect(client) {
	minute_of_fame.disconnect(client);
}

function handleMessage(message, client) {
	minute_of_fame.runCommand(message, client);
}

exports.handleConnect = handleConnect;
exports.handleDisconnect = handleDisconnect;
exports.handleMessage = handleMessage;