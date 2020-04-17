# GunDB MultiSocket
Single `HTTP/S` server providing `WebSocket` Path based routing to ephemeral [GunDB](https://gun.eco) instances for mesh isolation.

### Gun WS Flow

<img src="https://user-images.githubusercontent.com/1423657/79556065-d4b55e00-80a0-11ea-8a6a-b85aa0c90cf0.png" width=500/>


### Example
```
localStorage.clear();

var random1 = Math.random().toString(36).substring(7);
var gun1 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random1], musticast: false, localStorage: false, radisk: false, file: false});
gun1.get('zero1').put({ name: "Jack" });
// This should be triggered
gun1.get('zero1').on(function(data, key){
  console.log("gun 1 update:", data);
});
// This should never be triggered
gun1.get('zero2').on(function(data, key){
  console.log("gun 1-2 update:", data);
});

var random2 = Math.random().toString(36).substring(7);
var gun2 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random2], multicast: false, localStorage: false, radisk: false, file: false});
gun2.get('zero2').put({ name: "Jill"});
gun2.get('zero2').on(function(data, key){
  console.log("gun 2 update:", data);
});
```

###### Credits
This project is a component of [Gun Meething](https://github.com/meething/webrtc-gun) powered by [GunDB](https://gun.eco)

