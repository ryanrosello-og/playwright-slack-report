// Named CommonJS exports are also visible to the production dynamic import().
const mock = require('./proxy-scenario.cjs').loadUndici();
exports.ProxyAgent = mock.ProxyAgent;
exports.fetch = mock.fetch;
