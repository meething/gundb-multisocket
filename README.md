# GunDB Multiserver

A server that serves ephemeral Gun instances through websocket paths

## Example
```
// Add a New Peer /gun1
var gun1 = Gun({peers:["https://gundb-multiserver.glitch.me/gun1"], localStorage: false});
// Add Jack
gun1.get('jack').put({ name: "Jack" });
// Jack is HERE!
gun1.get('jack').on(function(data, key){
  console.log("gun 1 update:", data);
});

// Add a New Peer /gun2
var gun2 = Gun({peers:["https://gundb-multiserver.glitch.me/gun2"], localStorage: false});
// Add Jill
gun2.get('jill').put({ name: "Jill"});
// Jill is HERE!
gun2.get('jill').on(function(data, key){
  console.log("gun 2 update:", data);
});

// Peer 1 DO NOT know Jack!
gun2.get('jack').on(function(data, key){
  console.log("gun 2 update:", data);
});
// Peer 2 DO NOT know Jill!
gun1.get('jill').on(function(data, key){
  console.log("gun 1 update:", data);
});
```

