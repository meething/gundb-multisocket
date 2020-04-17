![image](https://user-images.githubusercontent.com/1423657/79577881-b6ae2480-80c5-11ea-925c-8d69c2168613.png)

# GunDB MultiSocket
Single `HTTP/S` server providing `WebSocket` Path based routing to ephemeral [GunDB](https://gun.eco) instances in mesh isolation.

### Notes
* uses its own [mem](https://github.com/meething/gundb-multisocket/blob/master/mem.js) storage adaptor to avoid any disk writes
* uses its own [websockets](https://github.com/meething/gundb-multisocket/blob/master/gun-ws.js) adaptor allowing injection into Gun contructors
* MUST be served through SSL and can easily be deployed on [glitch](https://glitch.com/~gundb-multiserver) and other platforms.

### Installation
```
npm install
npm start
```

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/https://github.com/meething/gundb-multisocket/gundb-multisocket)

#### Gun WS Flow

<img src="https://user-images.githubusercontent.com/1423657/79556065-d4b55e00-80a0-11ea-8a6a-b85aa0c90cf0.png" width=500/>

#### Example
```
localStorage.clear();

var random1 = Math.random().toString(36).substring(7);
var gun1 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random1], musticast: false, localStorage: false, radisk: false, file: false});
gun1.get('jack').put({ name: "Jack" });
// This should be triggered
gun1.get('jack').on(function(data, key){
  console.log("gun 1 update:", data);
});
// This should never be triggered
gun1.get('jill').on(function(data, key){
  console.log("Jack should NOT see Jill's update", data);
});

var random2 = Math.random().toString(36).substring(7);
var gun2 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random2], multicast: false, localStorage: false, radisk: false, file: false});
gun2.get('jill').put({ name: "Jill"});
gun2.get('jill').on(function(data, key){
  console.log("gun 2 update:", data);
});
```

###### Credits
This project is a component of [Gun Meething](https://github.com/meething/webrtc-gun) powered by [GunDB](https://gun.eco)


