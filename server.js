var Gun = require('gun');
var server = require('http').createServer().listen(3000);
var gun = Gun({web: server});