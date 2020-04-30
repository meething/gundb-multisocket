/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020
 */

const fs = require("fs");
const url = require("url");
const Gun = require("gun/gun"); // do not load storage adaptors by default
require("gun/sea");
require("gun/lib/then");
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
  config.options.key= process.env.SSLKEY ? fs.readFileSync(process.env.SSLKEY) : fs.readFileSync('/home/coder/ssl/rig/privkey.pem'),
  config.options.cert= process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) :  fs.readFileSync('/home/coder/ssl/rig/fullchain.pem')

  var server = https.createServer(config.options);
  server.listen(process.env.PORT || 8767);
}
let sigs ={};
async function hasValidToken(msg,pathname) {
  return new Promise((res,rej)=>{
  var sg = null;
  var token = null;
  token = (msg && msg.headers && msg.headers.token) ? msg.headers.token : '"fail"';
  sg = sigs && pathname && sigs.hasOwnProperty(pathname) ? sigs[pathname] : false;
  //console.log("validating", msg ,"pathname",pathname, "sigs[pathname]",sigs[pathname],"token",token,sigs);
  var result = false;
  console.log(token,sg,sigs);
  try { result = JSON.parse(token) === sg } catch(err){ console.log("error?",err); } 
  console.log("result",result, JSON.parse(token), sg);
  return res(result);
  });
}
// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 10, onEviction: false });

server.on("upgrade", async function(request, socket, head) {
  var parsed = url.parse(request.url,true);
  console.log("parsed",parsed);
  var sig = parsed.query && parsed.query.sig ? parsed.query.sig : false; 
  console.log(parsed.query,parsed.query.sig);
  var pathname = parsed.pathname || "/gun";
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
      if(sig) {
        if(sigs.hasOwnProperty(pathname)){
	  if(sig != sigs[pathname]) { console.log("someone is trying to overwrite our room",sig,pathname); return; }
	}
	sigs[pathname]=sig;
        console.log("stored sig ",sig,"to pathname",pathname);
        Gun.on('opt', function (ctx) {
        if (ctx.once) return
        ctx.on('in', function (msg) {
          var to = this.to;
          if (msg.put) {
            if (hasValidToken(msg,pathname)) {
              console.log('writing',msg,sig);
              to.next(msg)
            } else {
              console.log('not writing',msg,sig);
            }
          } else {
            to.next(msg)
          }
        })
        })
      }
      var g = gun.gun = Gun({
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
