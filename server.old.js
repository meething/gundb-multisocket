/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020
 */

var no = require('gun/lib/nomem')(); // no-memory storage adapter for RAD

const fs = require("fs");
const url = require("url");
const Gun = require("gun"); // load defaults

const http = require("http");
const https = require("https");
const WebSocket = require("ws");
var debug = process.env.DEBUG || true;
var config = {};

config.options = {
  key: process.env.SSLKEY ? fs.readFileSync(process.env.SSLKEY) : false,
  cert: process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) :  false
}

if (!process.env.SSL) {
  var server = http.createServer();
  server.listen(process.env.PORT || 3000);
} else {
  var server = https.createServer(config.options);
  server.listen(process.env.PORT || 443);
}

// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 49, onEviction: false });

server.on("upgrade", async function(request, socket, head) {
  var pathname = url.parse(request.url).pathname || "/gun";
  if (debug) console.log("Got WS request", pathname);
  var gun = { gun: false, server: false };
  if (pathname) {
    if (lru.has(pathname)) {
      // Existing Node
      if (debug) console.log("Recycle id", pathname);
      gun = await lru.get(pathname);
    } else {
      // Create Node
      if (debug) console.log("Create id", pathname);
      if (debug) console.log("set peer", request.headers.host + pathname);
      gun.gun = new Gun({
        peers: [], // should we use self as peer?
        localStorage: false,
        store: no,
        file: "tmp" + pathname, // make sure not to reuse same storage context
        radisk: true, // important for nomem!
        multicast: false,
        ws: { noServer: true, path: pathname }
      });
      gun.server = gun.gun.back('opt.ws.web'); // this is the websocket server
      gun.server.setMaxListeners(50); // allow 50 listeners
      lru.set(pathname, gun);
    }
  }
  if (gun.server) {
    // Handle Request
    gun.server.handleUpgrade(request, socket, head, function(ws) {
      if (debug) console.log("connecting to gun instance", gun.gun.opt()._.opt.ws.path);
      gun.server.emit("connection", ws, request);
    });
  } else {
    if (debug) console.log("destroying socket", pathname);
    socket.destroy();
  }
});
