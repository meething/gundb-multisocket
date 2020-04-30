module.exports = {
  apps : [{
    name: 'multisocket',
    script: 'server.js',
    watch: true,
    env: {
      DEBUG : true
    }
  }]
};
