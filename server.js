/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020 (QXIP, QVDEV)
 */

const url = require("url");
var rimraf = require("rimraf");
const Gun = require("gun/gun");
require("./gun-ws.js");
require("./mem.js");
const http = require("http");
const WebSocket = require("ws");

// Optional File Webservice
var express = require('express');
var app = express();
let path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

var server = http.createServer({}, app);

// LRU with last used sockets
const QuickLRU = require("quick-lru");
var evict = function(key, value) {
  console.log("Garbage Collect", key);
  if (key)
    rimraf("tmp/" + key, function() {
      console.log("Cleaned up ID", key);
    });
};
const lru = new QuickLRU({ maxSize: 100, onEviction: evict });

server.on("upgrade", async function(request, socket, head) {
  var pathname = url.parse(request.url).pathname || "/gun";
  console.log("Got WS request", pathname);
  var gun = { gun: false, server: false };
  if (pathname) {
    if (lru.has(pathname)) {
      // Existing Node
      console.log("Recycle id", pathname);
      gun = await lru.get(pathname);
    } else {
      // Create Node
      console.log("Create id", pathname);
      // NOTE: Only works with lib/ws.js shim allowing a predefined WS as ws.web parameter in Gun constructor
      gun.server = new WebSocket.Server({ noServer: true, path: pathname });
      console.log("route to peer", request.headers.host + pathname);
      gun.gun = new Gun({
        peers: [], // should we use self as peer?
        localStorage: false,
        axe: false,
        file: false, //"tmp/" + pathname,
        multicast: false,
        ws: { noServer: true, path: pathname, web: gun.server },
        web: gun.server
      });
      lru.set(pathname, gun);
    }
  }
  if (gun.server) {
    // Handle Request
    gun.server.handleUpgrade(request, socket, head, function(ws) {
      console.log("connecting to gun instance", gun.gun.opt()._.opt.ws.path);
      gun.server.emit("connection", ws, request);
    }); 
  } else {
    socket.destroy();
  }
});

//
server.listen(3000, () => console.log(`Meething/Gun Server Ready!`))
