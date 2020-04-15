const url = require('url');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');
var server = http.createServer().listen(3000);

// LRU with last used sockets
const QuickLRU = require('quick-lru');
const lru = new QuickLRU({maxSize: 1});

//var wss_event = new WebSocket.Server({ noServer: true});

server.on('upgrade', async function (request, socket, head) {
  var pathname = url.parse(request.url).pathname || '/gun';
  console.log('Got WS request',pathname);
  var gun = false;
  if (pathname){
      if (lru.has(pathname)){
        // Existing Node
        console.log('Recycle id',pathname);
        gun = await lru.get(pathname);
      } else {
        // Create Node
        console.log('Create id',pathname);
        var wserver = new WebSocket.Server({ noServer: true});
        gun = new Gun({peers:[], ws: { path: pathname}, web: server });
        lru.set(pathname,gun);
      }
  }
  if (gun){
      // Handle Request
      console.log('handle connection...');
      //ws.emit('connection', socket);
      wserver.handleUpgrade(request, socket, head, function (ws) {
              console.log('connecting.. ')
              ws.emit('connection', socket);     
      });
    
  } else {
      socket.destroy();
  }
});