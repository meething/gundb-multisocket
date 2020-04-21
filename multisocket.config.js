module.exports = {
  apps : [{
    name: 'multisocket",
    script: 'server.js',
    watch: true
    env: {
      SSL : false,
      SSLKEY : 'cert/server.key',
      SSLCERT  : 'cert/server.cert',
      DEBUG : false
    }
  }]
};
