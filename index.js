var server = require("./server");
var controller = require("./controller");

console.log("Starting server");

server.start(controller);