var connection = require('./connection');
var config = require(global.__basename + '/config/config');

module.exports = connection(config.db);