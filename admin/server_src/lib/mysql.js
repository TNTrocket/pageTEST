'use strict';
var mysql = require('mysql'),
_ = require('underscore'),
config = require(__dirname + '/../config.js');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : config.mysql.host,
  user            : config.mysql.user,
  password        : config.mysql.password,
  database        : config.mysql.database
});
var db = {};
db.records = {};
db.records.select = (query_obj,records_select_cb)=>{
  let fields = '*',conditions = '',order = '',sql;
  if(query_obj.fields!==undefined){
    let str_arr = [];
    _.each(query_obj.fields,(field)=>{
        str_arr.push(trim(field))
    });
    fields = str_arr.join(',');     
  }    
  sql = "SELECT "+fields+" FROM `"+query_obj.table+"`";
  if(query_obj.conditions!==undefined){
    if(query_obj.conditions instanceof Array){
      let str_arr = [];   
      _.each(query_obj.conditions,(cond_item)=>{
          str_arr.push(db.tools.cond_parser(cond_item));
      });
      if(query_obj.conditions_op!==undefined){
        switch(query_obj.conditions_op){
          case 'OR':
            conditions = str_arr.join(' OR ');
            break;
          default:
            conditions = str_arr.join(' AND ');
        }
      }else{
        conditions = str_arr.join(' AND ');
      }
      sql = sql + " WHERE " + conditions; 
    }else if(query_obj.conditions instanceof Object){
      sql = sql + ' WHERE ' + db.tools.cond_parser(query_obj.conditions);
    }
  }
  if(query_obj.order!==undefined){
    let str_arr = [];
    _.each(query_obj.order,(value,key)=>{
        str_arr.push(key+" "+trim(value))
    });
    order = str_arr.join(',');
    sql = sql + " ORDER BY " + order;     
  }
  if(query_obj.limit!==undefined){
    let limit = query_obj.limit.join(',');
    sql = sql + " LIMIT " + limit;     
  }    
  console.log(sql);
  pool.query(sql,(err,records_select_result)=>{
    records_select_cb(err,records_select_result)
  });     
};
db.records.insert = (query_obj,records_insert_cb)=>{
  let sql = "INSERT INTO `"+query_obj.table+"` SET ";
  let str_arr = [];
  _.each(query_obj.data,(value,key)=>{
    str_arr.push("`"+key+"`='"+trim(value)+"'")
  });    
  sql = sql + str_arr.join(',');
  if(query_obj.duplicate!==undefined){
    let temp_arr = [];
    _.each(query_obj.duplicate,(value,key)=>{
      temp_arr.push(key+"="+trim(value)+"")
    });
    sql = sql + " ON DUPLICATE KEY UPDATE " + temp_arr.join(',')
  }

  console.log(sql);
  pool.query(sql,(err,records_insert_result)=>{
    records_insert_cb(err,records_insert_result)
  });     
};
db.records.update = (query_obj,records_update_cb)=>{
  let sql = "UPDATE `"+query_obj.table+"` SET ",
  conditions = '',
  str_arr = [];
  _.each(query_obj.data,(value,key)=>{
      str_arr.push("`"+key+"`='"+trim(value)+"'")
  });    
  sql = sql + str_arr.join(',');
  if(query_obj.conditions!==undefined){
    let str_arr = [];
    _.each(query_obj.conditions,(value,key)=>{
        str_arr.push(key+"='"+trim(value)+"'")
    });
    conditions = str_arr.join(' AND ');
    sql = sql + " WHERE " + conditions;     
  }
  console.log(sql);
  pool.query(sql,(err,records_update_result)=>{
      records_update_cb(err,records_update_result)
  });     
};
db.records.update_no_quote = (query_object,records_update_cb)=>{
    let sql = "UPDATE "+query_object.table+" SET ",
    conditions = '',
    str_arr = [];
    _.each(query_object.data,(value,key)=>{
        str_arr.push(key+"="+trim(value))
    });    
    sql = sql + str_arr.join(',');
    if(query_object.conditions!==undefined){
        let str_arr = [];
        _.each(query_object.conditions,(value,key)=>{
            str_arr.push(key+"='"+trim(value)+"'")
        });
        conditions = str_arr.join(' AND ');
        sql = sql + " WHERE " + conditions;     
    }
    console.log(sql);
    pool.query(sql,(err,records_update_result)=>{
        records_update_cb(err,records_update_result)
    });     
};
db.records.delete = (query_object,records_delete_cb)=>{
    let sql = "DELETE FROM "+query_object.table,
    conditions = '';
    if(query_object.conditions!==undefined){
        let str_arr = [];
        _.each(query_object.conditions,(value,key)=>{
            str_arr.push(key+"='"+trim(value)+"'")
        });
        conditions = str_arr.join(' AND ');
        sql = sql + " WHERE " + conditions;     
    }
    console.log(sql);
    pool.query(sql,(err,records_delete_result)=>{
        records_delete_cb(err,records_delete_result)
    });     
};
db.tools = {};
db.tools.cond_parser = (cond_item)=>{
  if(cond_item.op.toLocaleUpperCase() == 'LIKE'){
      return '`' + trim(cond_item.field) + '` LIKE ' + mysql_escape('%' + cond_item.value + '%');
  }
  else{
      if(isNaN(cond_item.value)||cond_item.value=='')
        cond_item.value = '\''+cond_item.value+'\'';

      return '`' + trim(cond_item.field) + '` ' + trim(cond_item.op) + ' ' + trim(cond_item.value);
  }
};

function mysql_escape (str) {
    return mysql.escape(str);
};

function trim(value){
  if(typeof(value)=='string'){
    return value.trim()
  }
  else
    return value
}
module.exports = db;



