# GunDB Multiserver

A server that serves ephemeral Gun instances through websocket paths

## Example
```
localStorage.clear();

// Generate an instance
var gun1 = Gun({peers:["https://gundb-multiserver.glitch.me/gun111"], musticast: false, localStorage: false, radisk: false, file: false});
gun1.get('zero1').put({ name: "Jack" });

// This should be triggered
gun1.get('zero1').on(function(data, key){
  console.log("gun 1 update:", data);
});

// This should never be triggered
gun1.get('zero2').on(function(data, key){
  console.log("gun 1 update:", data);
});

// Add data to a new Instance
var gun2 = Gun({peers:["https://gundb-multiserver.glitch.me/gun222"], multicast: false, localStorage: false, radisk: false, file: false});
gun2.get('zero2').put({ name: "Jill"});
gun2.get('zero2').on(function(data, key){
  console.log("gun 2 update:", data);
});


```

