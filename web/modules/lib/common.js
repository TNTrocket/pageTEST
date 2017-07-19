exports.error_null = function(str){
    var err = new Error(str + " required");
    err.code = 121;
    return err;
}

exports.error_custom = function(str){
    var err = new Error(str);
    err.code = 122;
    return err;
}

exports.error_unknow = function(str){
    var err = new Error("Unknow Error");
    err.code = 123;
    return err;
}

exports.error = function(code, msg){
    var ret = {code: code, message: msg};
    return ret;
}

exports.success = function(msg, data){
    var ret = {code: 0, message: msg, result: data};
    return ret;
}
