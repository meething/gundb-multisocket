const url = require('url');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');
var server = http.createServer();

// LRU with last used sockets
const QuickLRU = require('quick-lru');
const lru = new QuickLRU({maxSize: 1});

//var wss_event = new WebSocket.Server({ noServer: true});

server.on('upgrade', async function (request, socket, head) {
  var pathname = url.parse(request.url).pathname || '/gun';
  console.log('Got WS request',pathname);
  var gun = { gun: false, server: false};
  if (pathname){
      if (lru.has(pathname)){
        // Existing Node
        console.log('Recycle id',pathname);
        gun = await lru.get(pathname);
      } else {
        // Create Node
        console.log('Create id',pathname);
        // HOW HOW HOW ? IS it even possible to attach the WS to the Gun Object alone?
       // Works only when passing "server" to the web parameter, no WS/WSS)
        gun.server = new WebSocket.Server({ noServer: true});
        gun.gun = new Gun({peers:[], ws: { path: pathname, noServer: true, server: gun.server }, web: server});
        lru.set(pathname,gun);
      }
  }
  if (gun.server){
      // Handle Request
      console.log('handle connection...');
      //ws.emit('connection', socket);
      gun.server.handleUpgrade(request, socket, head, function (ws) {
              console.log('connecting to gun.. ')
              gun.server.emit('connection', ws);     
      });
    
  } else {
      socket.destroy();
  }
});


server.listen(3000);