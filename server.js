const url = require('url');
const Gun = require('gun/gun');
require('./gun-ws.js');
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
        // NOTE: Only works with lib/ws.js shim allowing a predefined WS as ws.web parameter in Gun constructor
        gun.server = new WebSocket.Server({ noServer: true, path: pathname});
        console.log('set peer',request.headers.host+pathname);
        gun.gun = new Gun({ 
            peers:[], // should we use self as peer?
            localStorage: false, 
            file: false, 
            ws: { noServer: true, path: pathname, web: gun.server }, 
            web: gun.server 
        });
        // gun.gun.on("in", function(msg) { console.log('got',msg ) });
        lru.set(pathname,gun);
      }
  }
  if (gun.server){
      // Handle Request
      console.log('handle connection...');
      //ws.emit('connection', socket);
      gun.server.handleUpgrade(request, socket, head, function (ws) {
              console.log('connecting to gun.. ', gun.gun.opt().opt )
              gun.server.emit('connection', ws, request);     
      });
    
  } else {
      socket.destroy();
  }
});


server.listen(3000);