/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020
 */

const fs = require("fs");
const url = require("url");
const Gun = require("gun/gun"); // do not load storage adaptors by default
require("./gun-ws.js"); // required to allow external websockets into gun constructor
require("./mem.js"); // disable to allow file writing for debug
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
var debug = process.env.DEBUG || false;
var config = {};
config.options = {
}


if (!process.env.hasOwnProperty('SSL')||process.env.SSL == false) {
  var server = http.createServer();
  server.listen(process.env.PORT || 8767);
} else {
  config.options.key= process.env.SSLKEY ? fs.readFileSync(process.env.SSLKEY) : fs.readFileSync('cert/server.key'),
  config.options.cert= process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) :  fs.readFileSync('cert/server.cert')

  var server = https.createServer(config.options);
  server.listen(process.env.PORT || 443);
}

// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 10, onEviction: false });

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
      // NOTE: Only works with lib/ws.js shim allowing a predefined WS as ws.web parameter in Gun constructor
      gun.server = new WebSocket.Server({ noServer: true, path: pathname });
      if (debug) console.log("set peer", request.headers.host + pathname);
      gun.gun = new Gun({
        peers: [], // should we use self as peer?
        localStorage: false,
        file: false, // "tmp/" + pathname,
        radisk: false,
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
      if (debug) console.log("connecting to gun instance", gun.gun.opt()._.opt.ws.path);
      gun.server.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
