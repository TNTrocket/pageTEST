'use strict';
const config = {};
config.mysql = {}
config.mysql = {
    host: 'rdsj876108xwow3m0b63.mysql.rds.aliyuncs.com',
    //host:global.dev?'127.0.0.1':'127.0.0.1',
    user: 'web_page',
    //user:global.dev?'root':'root',
    password: '51@webPage',
    // password:global.d	ev?'qwer1234':'qwer1234',
    database: 'web_page',
    //database:global.dev?'xswy':'xswy',
}
config.api_server = global.dev?'http://localhost:1225/':'http://47.90.4.51:3389/';
config.cdn_server = global.dev?'http://localhost:1225/img/':'http://47.90.4.51:3389/img/';
module.exports = config;
