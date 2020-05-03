![image](https://user-images.githubusercontent.com/1423657/80729669-deab7800-8b08-11ea-88a5-13cdbcaee38c.png)

#### Gun MultiSocket
Single `HTTP/S` server providing multiple ephemeral [GunDB](https://gun.eco) `WebSocket` instances with  path based routing and mesh isolation.

### Notes
* uses its own [mem](https://github.com/meething/gundb-multisocket/blob/master/mem.js) storage adaptor to avoid any disk writes
* uses its own [websockets](https://github.com/meething/gundb-multisocket/blob/master/gun-ws.js) adaptor allowing injection into Gun contructors
* MUST be served through SSL and can easily be deployed on [glitch](https://glitch.com/~gundb-multiserver) and other platforms.

### Configuration
* requires a valid set of SSL/TLS certificates _(letsencrypt)_

### Installation
```
npm install
```

### Usage
#### npm
Explode your ENV variables manually and launch using npm:
```
SSL=true SSLKEY=/path/to/privkey.pem SSLCERT=/path/to/fullchain.pem npm start
```
#### pm2
Configure the options in `multisocket.config.js` and launch using pm2:
```
pm2 start multisocket.config.js
```

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/https://github.com/meething/gundb-multisocket/gundb-multisocket)

#### Gun WS Flow

<img src="https://user-images.githubusercontent.com/1423657/79556065-d4b55e00-80a0-11ea-8a6a-b85aa0c90cf0.png" width=500/>

#### Practical Example
In this example we want the data of Jack and Jill to be partitioned and not shared between different ws /paths
```
localStorage.clear();

// Create the first gun endpoint
var random1 = Math.random().toString(36).substring(7);
var gun1 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random1], musticast: false, localStorage: false, radisk: false, file: false});
// Create Jack
gun1.get('jack').put({ name: "Jack" });

// This should be triggered for Jack only
gun1.get('jack').on(function(data, key){
  console.log("gun 1 update:", data);
});
// This should never be triggered! It's from Jill after all.
gun1.get('jill').on(function(data, key){
  console.log("Jack should NOT see Jill's update", data);
});

// Create the second gun endpoint
var random2 = Math.random().toString(36).substring(7);
var gun2 = Gun({peers:["https://gundb-multiserver.glitch.me/"+random2], multicast: false, localStorage: false, radisk: false, file: false});
// Create Jill
gun2.get('jill').put({ name: "Jill"});
// This should be triggered for Jill only
gun2.get('jill').on(function(data, key){
  console.log("gun 2 update:", data);
});
```

###### Credits
This project is a component of [Gun Meething](https://github.com/meething/webrtc-gun) powered by [GunDB](https://gun.eco)


