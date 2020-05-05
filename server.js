/* Gun Multi-WS Monster */
/* Spawn multiple Gun WebSockets from the same HTTP/HTTPS server
 * Each Gun is scoped to its ws.path and intended for ephemeral usage
 * MIT Licensed (C) QXIP 2020
 */
const no = require('gun/lib/nomem')(); // no-memory storage adapter for RAD
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
let debug = process.env.DEBUG || true;
let relaypeers = process.env.RELAY || 'https://mg.rig.airfaas.com/'; // FOR FUTURE DAISY-CHAINING
let config = {};
if(debug) console.log(SEA, Gun.SEA);
config.options = {
}
if (!process.env.hasOwnProperty('SSL')||process.env.SSL == false) {
  var server = http.createServer();
  server.listen(process.env.PORT || 3000);
} else {
  config.options.key= process.env.SSLKEY ? fs.readFileSync(process.env.SSLKEY) : false,
  config.options.cert= process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) :  false

  var server = https.createServer(config.options);
  server.listen(process.env.PORT || 443);
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
  pathname = pathname.replace(/^\/\//g,'/');
  if (debug) console.log("Got WS request", pathname);

  var gun = { gun: false, server: false };
  if (pathname) {
    let roomname = pathname.split("").slice(1).join(""); 
    if(debug) console.log("roomname",roomname);
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
      	sigs[roomname]=sig;
        if(debug) console.log("stored sig ",sig,"to pathname",roomname);
      }
      //console.log("gunsea",Gun.SEA);
      //SEA.throw = 1;
      /*Gun.on('opt',function(ctx){
        if(ctx.once) return;
	ctx.on('in',function(msg){
          if(debug) console.log(msg);
          this.to.next(msg);
        })
      })*/
      let qs = ["sig="+encodeURIComponent((sig ? sig :'')),"creator="+encodeURIComponent((creator ? creator : ''))].join("&");
      let relaypath = roomname+'?'+qs;
      let peers = []; //relaypeers.split(',').map(function(p){ return p+relaypath; });
      if(debug) console.log("peers",peers);
      const g = gun.gun = Gun({
        peers: peers, // should we use self as peer?
        localStorage: false,
        store: no,
        file: "tmp" + pathname, // make sure not to reuse same storage context
        radisk: true, // important for nomem!
        multicast: false,
        ws: { noServer: true, path: pathname }
      });
      gun.server = gun.gun.back('opt.ws.web'); // this is the websocket server
      lru.set(pathname, gun);
      let obj = {
        roomname:roomname,
        creator:creator
      };
      if(debug) console.log('object is',obj);
      if(sig) {
        let user = g.user();
        user.create(roomname,sig, function(dack){
          if(debug) console.log("We've got user create ack",dack,roomname,sig);
          if(dack.err){ console.log("error in user.create",dack.err); }
          user.auth(roomname,sig, function(auth){
            if(debug) console.log("We've got user auth ack",auth);
            if(auth.err){ console.log('error in auth',auth.err); }
            //console.log("auth",auth,roomname,sig);
            Object.assign(obj,{
              pub:dack.pub,
              passwordProtected:'true'
            });
            if(debug) console.log("putting",roomname,"with object",obj, `to user ${dack.pub}`);
            user.get(roomname).put(obj,function(roomack){ //TODO: @marknadal fix me
              if(debug) console.log("roomnode?",roomack);
              var roomnode = user.get(roomname);
              g.get('rtcmeeting').get(roomname).put(roomnode,function(puback){
                if(debug) console.log("put object",puback);
              });
            });
          });
        });
      } else {
        Object.assign(obj,{passwordProtected:false});
        g.get("rtcmeeting").get(roomname).put(obj,function(grack){
          if(debug) console.log("room created",grack);
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