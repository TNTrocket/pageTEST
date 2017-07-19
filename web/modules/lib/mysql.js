var mysql = require('mysql');
var config = require(__dirname + '/../../config/config');
var pool_connection = require(global.__basename + '/modules/connections/mysql/web');

// let db_config_obj = config.db; 
// let pool_connection = mysql.createPool({
//     host     : db_config_obj.host,
//     user     : db_config_obj.user,
//     password : db_config_obj.password,
//     database : db_config_obj.database
// });

const pool = {
    'query': function(sql, callback){

        pool_connection.query(sql, function(err, rows) {
            if(err) {
                console.log("[error][pool.query]:", err);
            }else{
                //callback(err, rows);
            }
            callback(err, rows);
            // pool_connection.end();
        });
    }
};

var db = {};
db.records = {};
db.records.select = (query_obj, records_select_cb)=> {
    let sql = '', fields = '*', andConditions = '', orConditions = '', order = '', query_string = '';
    if(query_obj.fields !== undefined) {
        let str_arr = [];
        query_obj.fields.map( (field) => {
            str_arr.push( trimField(field) );
        });
        fields = str_arr.join(', ');  
    }
    else if(query_obj.total_field !== undefined){
        fields = 'COUNT(' + trimField(query_obj.total_field) + ') AS total';
    }
    sql = 'SELECT ' + fields + ' FROM `' + query_obj.table + '`';

    // 全部 OR 或 AND 用这个就可以了
    if(query_obj.conditions !== undefined) {
        query_string = query_string + conditions_parser(query_obj.conditions, query_obj.conditions_op || 'AND');
    }
    
    // 有 OR 又有 AND 要加上这个
    if(query_obj.multi_conditions !== undefined) {
        let str_arr = [];
        query_obj.multi_conditions.map( (item) => {
            str_arr.push( '(' + conditions_parser(item.conditions, item.conditions_op) + ')' );
        });

        if(query_string == ''){
            query_string = query_string + conditions_op_parser(str_arr, query_obj.multi_conditions_op || 'AND');
        }
        else{
            query_string = '(' + query_string + ') AND (' + conditions_op_parser(str_arr, query_obj.multi_conditions_op || 'AND') + ')';
        }
    }
    if(query_string != ''){
        sql = sql + ' WHERE ' + query_string;
    }

    if(query_obj.order !== undefined){
        let str_arr = [];
        query_obj.order.map( (item) => {
            if(item.field == 'RAND()'){
                str_arr.push( item.field + ' ');
            }
            else{
                str_arr.push( trimField(item.field) + ' ' + (item.sort || 'DESC') );
            }
        });
        order = str_arr.join(', ');
        sql = sql + ' ORDER BY ' + order;
    }

    if(query_obj.limit !== undefined) {
        let limit = query_obj.limit.join(', ');
        sql = sql + ' LIMIT ' + limit;
    }

    if(config.db.logSQL){
        console.log('[fetch ' + query_obj.table + ' sql]:', sql);
    }

    pool.query(sql, (err,records_select_result) => {
        records_select_cb(err, records_select_result);
    });
};

function conditions_op_parser (conditions, conditions_op){
    let query_string = '';
    if(conditions_op !== undefined) {
        switch(conditions_op.toLocaleUpperCase()) {
            case 'OR':
                query_string = conditions.join(' OR ');
                break;
            default:
                query_string = conditions.join(' AND ');
                break;
        }
    }
    else{
        query_string = conditions.join(' AND ');
    }
    
    return query_string;
}

function conditions_parser (conditions, conditions_op) {
    let query_string = '';
    if(conditions instanceof Array) {
        let str_arr = [];
        conditions.map( (item) => {
            str_arr.push(condition_parser(item));
        });
        query_string = conditions_op_parser(str_arr, conditions_op);
    }
    else if(conditions instanceof Object){
        query_string = condition_parser(conditions);
    }

    return query_string;
}

function condition_parser (condition) {
    let query_string = '', query_value = '', query_field = trimField(condition.field);

    if(condition.value instanceof Array){
        query_value = condition.value.join(',');
    }
    else{
        query_value = condition.value
    }

    switch( condition.op.toLocaleUpperCase() ){
        case 'IN':
            query_string =  query_field + ' IN (' + query_value +')';
            break;
        case 'NOT IN':
            query_string = query_field + ' NOT IN (' + query_value +')';
            break;
        case 'ISNULL':
            query_string = ' ISNULL (' + query_field +')';
            break;
        case '!ISNULL':
            query_string = ' !ISNULL (' + query_field +')';
            break;
        case 'LIKE':
        case 'LIKE_BOTH':
            // 模糊查询前后匹配
            query_string =  query_field + ' LIKE ' + trim('%' + query_value + '%');
            break;
        case 'LIKE_BEFORE':
            // 模糊查询 匹配前方
            query_string =  query_field + ' LIKE ' + trim('%' + query_value);
            break;
        case 'LIKE_AFTER':
            // 模糊查询 匹配后方
            query_string =  query_field + ' LIKE ' + trim(query_value + '%');
            break;
        default :
            query_string = query_field + ' ' + condition.op + ' ' + trim(query_value);
            break;
    }

    return query_string;
}

function trimField (field) {
    return '`' + field + '`';
}

function trim (value) {
    if(typeof(value)=='string'){
        if(value.toLocaleUpperCase() == 'NOW()'){
            return value;
        }
        else{
            return mysql_escape(value.trim());
        }        
    }
    else{
        return mysql_escape(value);
    }
}

function mysql_escape (str) {
    return mysql.escape(str);
};

module.exports = db;
