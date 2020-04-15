var Gun = require('gun');
var http = require('http');
var server = http.createServer().listen(300);
var wss_event = new WebSocket.Server({
noServer: true
});
server.on('upgrade', function (request, socket, head) {
  var pathname = url.parse(request.url).pathname;
  if (pathname === '/sim_world') {
      wss_event.handleUpgrade(request, socket, head, function (ws) {
          wss_event.emit('connection', ws);
      });
  } else {
      socket.destroy();
  }
});