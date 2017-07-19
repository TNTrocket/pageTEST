var mysql = require('mysql');

module.exports = function (settings) {
  return mysql.createPool({
    connectionLimit : settings.connectionLimit || 20,
    host     : settings.host,
    user     : settings.user,
    port     : settings.port,
    password : settings.password,
    database : settings.database
  });
}
