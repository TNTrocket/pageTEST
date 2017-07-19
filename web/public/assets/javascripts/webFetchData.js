
function getWebArticleList (params, ctrlID) {
    if(!params.page_size){
        params.page_size = 10;
    }
    $.ajax({
        type: "POST",
        url: "/api/article/list",
        data: params,
        success: function(data){            
            var template = '<li><div class="title"><a href="{href}">{title}</a></div><div class="date">{date}</div></li>';
            var returnData = '';
            var returnErrorData = '<div style="text-align:left; padding:20px 0;">{message}</div>';
            if(data.code == 200){
                if(data.results.length > 0){
                    data.results.map(function (item) {
                        returnData += template.replace('{href}', item.route).replace('{title}', item.title).replace('{date}', item.publish_date);
                    });
                    $("#" + ctrlID).html( '<ul>' + returnData + '</ul>' );
                }
                else{
                    $("#" + ctrlID).html( returnErrorData.replace('{message}', '暂时没有相关数据') );
                }                
            }
            else{
                $("#" + ctrlID).html( returnErrorData.replace('{message}', '查询数据发生错误,信息:' + data.message) );
            }          
        },
        error: function(data){
            console.log(data);
        }
    });
}

function setNewCity (newCityId, newCityName) {
    //console.log('设置城市', newCityId, newCityName);
    // 要设置的城市与当前城市的编号或名称是否相同
    if(newCityId == currentCity.id || newCityName == currentCity.name || newCityName.substring(0, newCityName.length-1) == currentCity.name){
        hiddenCityPage();
    }
    else{
        var message = '当前城市为' + currentCity.name + ',您确定要切换为' + newCityName;
        if(newCityId === 0){
            message = '你当前位置为' + currentCity.name + '是否切换为' + newCityName + '本地';
        }
        if(window.confirm(message)){
            $.ajax({
                type: "POST",
                url: "/api/set/city",
                data: {city_id: newCityId, city_name: newCityName},
                success: function(data){
                    console.log(data);
                    if(data.code == 200){
                        window.location.href = data.redirectURL;// + ':3001'//正式站必须去掉后面端口
                    }
                    else{
                        alert(data.message);
                        hiddenCityPage();
                    }
                },
                error: function(data){
                    console.log(data);
                }
            });
        }
        else{
            hiddenCityPage();
        }
    }
}

function hiddenCityPage(){
    $('#myCityModal').modal('hide');
}

function searchCity () {
    var cityName= $('#searchCityName').val();  
    $.ajax({
        type: "POST",
        url: "/api/search/city",
        data: {city_name: cityName},
        success: function(data){
            console.log(data);
            if(data.code == 200){
                var str = '';
                var template = '<div class="city {onClass}" onClick="setNewCity({cityId}, \"{cityName}\"")">{cityName}</div>';
                data.results.map(function (item) {
                    str += template.replace('{onClass}', item.id == currentCity.id ? 'on' : '').replace('{cityId}', item.id).replace('{cityName}', item.name).replace('{cityName}', item.name);
                });
                $('#divCityList').html(str);
            }
            else{
                alert(data.message);
            }
        },
        error: function(data){
            console.log(data);
        }
    });    
}
