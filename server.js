var Gun = require('gun');
var server = require('http').createServer().listen(3000);
var gun1 = Gun({web: server, path: '/gun1'});
var gun2 = Gun({web: server, path: '/gun2'});