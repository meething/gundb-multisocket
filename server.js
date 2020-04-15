const url = require('url');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');
var server = http.createServer().listen(3000);

// LRU with last used sockets
const QuickLRU = require('quick-lru');
const lru = new QuickLRU({maxSize: 100});

var wss_event = new WebSocket.Server({ noServer: true});

server.on('upgrade', async function (request, socket, head) {
  var pathname = url.parse(request.url).pathname || '/gun';
  var gun = false;
  if (pathname){
      if (lru.has(pathname)){
        // Existing Node
        gun = await lru.get(pathname);
      } else {
        // Create Node
        gun = await Gun({peers:[], ws: { noServer: true}});
        lru.set(pathname,gun);
      }
  }
  if (gun){
      // Handle Request
      gun.handleUpgrade(request, socket, head, function (ws) {
              gun.emit('connection', ws);
      });
  } else {
      socket.destroy();
  }
});