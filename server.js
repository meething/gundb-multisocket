/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020
 */

var no = require('gun/lib/nomem')(); // no-memory storage adapter for RAD
const fs = require("fs");
const url = require("url");
const Gun = require("gun"); // load defaults
//require("./gun-ws.js"); // required to allow external websockets into gun constructor
//require("./mem.js"); // disable to allow file writing for debug
require("gun/sea");
require("gun/lib/then");
const SEA = Gun.SEA;
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
var debug = process.env.DEBUG || true;
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
  return true;
}
// LRU with last used sockets
const QuickLRU = require("quick-lru");
const lru = new QuickLRU({ maxSize: 10, onEviction: false });

server.on("upgrade", async function(request, socket, head) {
  let parsed = url.parse(request.url,true);
  if(debug) console.log("parsed",parsed);
  let sig = parsed.query && parsed.query.sig ? parsed.query.sig : false; 
  let creator = parsed.query && parsed.query.creator ? parsed.query.creator  : "server";
  let pathname = parsed.pathname || "/gun";
  if (debug) console.log("Got WS request", pathname);

  var gun = { gun: false, server: false };
  if (pathname) {
    let roomname = pathname.split("").slice(1).join(""); 
    console.log("roomname",roomname);
    if (lru.has(pathname)) {
      // Existing Node
      if (debug) console.log("Recycle id", pathname);
      gun = await lru.get(pathname);
    } else {
      // Create Node
      if (debug) console.log("Create id", pathname);
      // NOTE: Only works with lib/ws.js shim allowing a predefined WS as ws.web parameter in Gun constructor
      //gun.server = new WebSocket.Server({ noServer: true, path: pathname });
      if (debug) console.log("set peer", request.headers.host + pathname);
      if(sig) {
      	sigs[pathname]=sig;
        if(debug) console.log("stored sig ",sig,"to pathname",pathname);
      }
      //console.log("gunsea",Gun.SEA);
      //SEA.throw = 1;
      /*Gun.on('opt',function(ctx){
        if(ctx.once) return;
	ctx.on('in',function(msg){
          console.log(msg);
          this.to.next(msg);
        })
      })*/
      const g = gun.gun = Gun({
        peers: [], // should we use self as peer?
        localStorage: false,
        store: no,
        file: "tmp" + pathname, // make sure not to reuse same storage context
        radisk: true, // important for nomem!
        multicast: false,
        ws: { noServer: true, path: pathname }
      });
      gun.server = gun.gun.back('opt.ws.web'); // this is the websocket server
      lru.set(pathname, gun);
      let obj = {roomname:roomname,creator:creator,socket:{}};
      if(sig) {
        let user = g.user();
        user.create(roomname,sig,async function(dack){
          console.log("We've got user create ack",dack,roomname,sig);
          if(dack.err){ console.log("error in user.create",dack.err); }
          user.auth(roomname,sig,async function(auth){
            console.log("We've got user auth ack",auth);
            if(auth.err){ console.log('error in auth',auth.err); }
            //console.log("auth",auth,roomname,sig);
            Object.assign(obj,{
              pub:dack.pub,
              passwordProtected:true
            });
            console.log("putting object to user",obj,user);
            let roomnode = await user.get(roomname).put(obj).then();
            console.log("roomnode?",roomnode);
            let putnode = g.get('rtcmeeting').get(roomname);
            let grack = await putnode.put(roomnode).then()
            console.log("put object",grack);
          });
        });
      } else {
        Object.assign(obj,{passwordProtected:false});
        let roomnode = g.get("rtcmeeting").get(roomname).put(obj,function(grack){
          console.log("room created",grack);
        });
      }
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
