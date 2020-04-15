const url = require('url');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');
var server = http.createServer().listen(3000);

var gun1 = Gun({peers:[], ws: { noServer: true}});
var gun2 = Gun({peers:[], ws: { noServer: true}});

const QuickLRU = require('quick-lru');
const lru = new QuickLRU({maxSize: 100});

var wss_event = new WebSocket.Server({ noServer: true});

server.on('upgrade', function (request, socket, head) {
  var pathname = url.parse(request.url).pathname;
  var gun
  if (lru.has(pathname)){
    
  } else {
    var gun = Gun({peers:[], ws: { noServer: true}});
    lru.set(pathname,gun);
  }
  
  if (pathname === '/gun1') {
      gun1.handleUpgrade(request, socket, head, function (ws) {
          gun1.emit('connection', ws);
      });
  } else if (pathname === '/gun2') {
      gun2.handleUpgrade(request, socket, head, function (ws) {
          gun2.emit('connection', ws);
      });
  } else {
      socket.destroy();
  }
});