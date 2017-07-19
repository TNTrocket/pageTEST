var moment = require('moment');
var async = require('async');

var config = require(__dirname + '/../config/config');
var db = require(__dirname + '/lib/mysql.js').records;

let model = {};

model.city = (data, callback)=>{
    const fields = ['id', 'name', 'pinyin', 'opened'];
    if(!data.conditions){
        data.conditions = [];
    }
    data.conditions.push({field:'status' , op: '=', value: 1});

    let query_obj = {
        table: 'city',
        conditions: data.conditions,
        fields: fields
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch city error]:', err);
        }
        callback(result);
    })
}

model.column = (data, callback)=>{
    const fields = ['id', 'parent_id', 'banner_id', 'name', 'route', 'title', 'keywords', 'description', 'image'];
    if(!data.conditions){
        data.conditions = [];
    }
    data.conditions.push({field:'status' , op: '=', value: 1});

    let query_obj = {
        table: 'column',
        conditions: data.conditions,
        fields: fields
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch column error]:', err);
        }
        callback(result);
    })
}

model.banner = (data, callback)=>{
    const fields = ['id', 'city_id', 'name', 'alt', 'image', 'url'];
    if(!data.conditions){
        data.conditions = [];
    }
    data.conditions.push({field:'status' , op: '=', value: 1});

    let query_obj = {
        table: 'banner',
        conditions: data.conditions,
        fields: fields
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch banner error]:', err);
        }
        callback(result);
    })
}

model.article = (data, callback)=>{
    if(!data.conditions){
        data.conditions = [];
    }
    data.conditions.push( {field:'status' , op: '=', value: 1} );
    data.conditions.push( {field:'publish_at' , op: '<=', value: 'NOW()'} );

    let query_obj = {
        table: 'article',
        conditions: data.conditions,
    }

    if(data.fields !== undefined) {
        query_obj.fields = data.fields;
    }
    if(data.total_field !== undefined) {
        query_obj.total_field = data.total_field;
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch article error]:', err);
        }
        callback(result);
    })
}

model.link = (data, callback)=>{
    const fields = ['id', 'name', 'position', 'url'];
    if(!data.conditions){
        data.conditions = [];
    }

    let query_obj = {
        table: 'link',
        conditions: data.conditions,
        fields: fields
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch link error]:', err);
        }
        callback(result);
    })
}

model.student = (data, callback)=>{
    if(!data.conditions){
        data.conditions = [];
    }

    let query_obj = {
        table: 'student',
        conditions: data.conditions,
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch student error]:', err);
        }
        callback(result);
    })
}

model.teacher = (data, callback)=>{
    if(!data.conditions){
        data.conditions = [];
    }
    data.conditions.push( {field:'status' , op: '=', value: 1} );

    let query_obj = {
        table: 'teacher',
        conditions: data.conditions,
    }

    if(data.conditions_op){
        query_obj.conditions_op = data.conditions_op;
    }
    if(data.multi_conditions){
        query_obj.multi_conditions = data.multi_conditions;
    }
    if(data.order){
        query_obj.order = data.order;
    }
    if(data.limit){
        query_obj.limit = data.limit;
    }

    db.select(query_obj, (err, result)=>{
        if(err){
            console.log('[fetch teacher error]:', err);
        }
        callback(result);
    })
}

module.exports = model;
