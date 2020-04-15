const url = require('url');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');
var server = http.createServer().listen(3000);

var wss_event = new WebSocket.Server({ noServer: true});

server.on('upgrade', function (request, socket, head) {
  var pathname = url.parse(request.url).pathname;
  if (pathname === '/gun1') {
      wss_event.handleUpgrade(request, socket, head, function (ws) {
          wss_event.emit('connection', ws);
      });
  } else if (pathname === '/gun2') {
      wss_event.handleUpgrade(request, socket, head, function (ws) {
          wss_event.emit('connection', ws);
      });
  } else {
      socket.destroy();
  }
});