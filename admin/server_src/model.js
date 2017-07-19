'use strict';
let db = require(__dirname + '/lib/mysql.js').records;
let parser = require(__dirname + '/parser');
let async = require('async');
let model = {};

model.cityList = (req,res)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = [];
		//默认查询有效的城市
		data.conditions.push({field:'status' , op: '=', value: 1});
	}	

	let query_obj = {
		table:'city',
		conditions:data.conditions
	}
	db.select(query_obj,(err,result)=>{
		if(err) console.log(err)
		let ret = parser.cityData(result);	
		res.json(ret);
	})
}
model.recycleCity = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'city',
			data:{status:0},
			conditions:{id:record}
		}
		db.update(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'城市已移除到回收站','code':'cityRecycledOkay'});
	})
};
model.detailCity = (req, res, cityId)=>{
	let query_obj = {
		table:'city',
		conditions:{field: 'id', op:'=' ,value: cityId}
	}
	db.select(query_obj,(err,dbRet)=>{
		if(err) console.log(err)
		let ret = {};
		if(dbRet.length > 0){
			ret = parser.cityDetail(dbRet[0]);
		}
		res.json(ret);				
	})
};
model.newCity = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'city',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'城市添加完成','code':'cityAddedOkay'});
	})
}
model.updateCity = (req,res,id)=>{
	const data = req.body;
	let query_obj = {
		table:'city',
		data:data,
		conditions:{id:id}
	}
	db.update(query_obj,(err,ret)=>{
		if(err) console.log(err)
	    res.json({'message':'城市修改完成','code':'cityUpdatedOkay'});
	})
}
// 功能未完善
model.checkUniqueCity = (req,res,id)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = []
	}
	console.log('checkUniqueCity', data);
	let query_obj_total = {
		fields:['count(*) as total'],
		table:'city',
		conditions:data.conditions
	}
	db.select(query_obj_total,(err,total)=>{
		if(err) console.log(err)

		res.json({'message':'检测城市名称是否存在','code':'cityCheckUniquedOkay', check_unique:  total[0].total > 0 ? true : false });	    
	})
}

model.postNewLink = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'link',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'链接添加完成','code':'linkAddedOkay'});
	})
}

model.getAllLink = (req,res)=>{
	let query_obj = {
		table:'link',
		order:{id:'desc'}
	}
	db.select(query_obj,(err,result)=>{
		if(err) console.log(err)
		let ret = parser.linkData(result);
    	res.json(ret);
	})
}
model.removeLink = (req,res,id)=>{
	let query_obj = {
		table:'link',
		conditions:{id:id}
	}
	db.delete(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'链接删除成功','code':'linkRemoveOkay'});
	})	
}
model.getAllColumn = (req,res)=>{
	/*const data = req.body;
	if(data.conditions==undefined){
		data.conditions = []
	}
	data.conditions.push({field:'status',op:'=',value:1});*/

	let query_obj = {
		table:'column',
		//conditions:data.conditions
	}
	db.select(query_obj,(err,result)=>{
		if(err) console.log(err)
		let ret = parser.columnData(result);
    	res.json(ret);
	})
}
model.getColumnId = (req,res,id)=>{
	let query_obj = {
		table:'column',
		conditions:{field:'id',op:'=',value:id}
	}
	db.select(query_obj,(err,result)=>{
		if(err) console.log(err)
		let ret = {};
		if(result.length > 0){
			ret = parser.columnDetail(result[0]);
		}
		res.json(ret)
	})	
}

model.updateColumn = (req,res,id)=>{
	const data = req.body;
	//console.log(data);
	data.status = data.status ? 1 : 0;
	let query_obj = {
		table:'column',
		data:data,
		conditions:{id:id}
	}
	db.update(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'栏目更新成功','code':'columnUpdateOkay'});
	})	
}
model.newColumn = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'column',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'栏目添加成功','code':'columnAddedOkay'});
	})	
}
model.recycleColumn  = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'column',
		data:{status:0},
		conditions:{id:id}
	}
	db.update(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'已放入回收站','code':'columnRecycledOkay'});
	})	
}
model.newArticle = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'article',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'文章添加完成','code':'articleAddedOkay'});
	})
}
model.updateArticle = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'article',
		data:{
			title:data.title,
			column_id:data.columnId,
			image:data.image,
            information: data.information,
			content:data.content,
			tag:data.tags,
			keywords:data.keywords,
            description: data.description,
            publish_at:data.publish_at
		},
		conditions:{id:data.articleId}
	}
	db.update(query_obj,(err,ret)=>{
		if(err) console.log(err)
	    res.json({'message':'文章修改完成','code':'articleUpdatedOkay'});
	})
}
model.recycleArticle = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'article',
			data:{status:0},
			conditions:{id:record}
		}
		db.update(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'文章已放入回收站','code':'articleRecycledOkay'});		
	})
};
model.deleteArticle = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'article',
			conditions:{id:record}
		}
		db.delete(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'文章已删除','code':'articleDeletedOkay'});		
	})
};
model.detailArticle = (req,res,articleId)=>{
	let query_obj = {
		table:'article',
		conditions:{field:'id',op:'=',value:articleId}
	}
	db.select(query_obj,(err,dbRet)=>{
		if(err) console.log(err)

		if(dbRet.length > 0){
			let query_obj = {
				fields:['id','parent_id'],
				table:'column'
			}
			db.select(query_obj,(err,colRet)=>{
				let markId = dbRet[0].column_id;
				let columnArr = [];
				columnArr.push(markId);
				walkObject(markId,colRet,columnArr);
				console.log(columnArr);
				dbRet[0].columnArr = columnArr;
				let ret = parser.articleDetail(dbRet[0]);
				res.json(ret);			
			})
		}
		else{
			res.json(null);
		}
	})
};
model.recoverArticle = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'article',
			data:{status:1},
			conditions:{id:record}
		}
		db.update(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'文章已还原','code':'articleRecoverOkay'});		
	})
};
model.teacherList = (req,res,city_id,page)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = []
	}
	data.conditions.push({field:'city_id',op:'=',value:city_id});
	data.conditions.push({field:'status',op:'=',value:1});

	let ret_obj = {}
	let query_obj_total = {
		fields:['count(*) as total'],
		table:'teacher',
		conditions:data.conditions
	}
	db.select(query_obj_total,(err,total)=>{
		ret_obj.total = total[0].total;
		let query_obj = {
			table:'teacher',
			conditions:data.conditions,
			order:{id:'desc'},
			limit:[page*10,10]
		}
		db.select(query_obj,(err,result)=>{
			if(err) console.log(err)

			let ret = parser.teacherList(result);
			ret_obj.data = ret;
			res.json(ret_obj)					
			// async.eachSeries(result,(record,callback)=>{
			// 	let query_obj = {
			// 		table:'column',
			// 		conditions:{field:'id',op:'=',value:record.column_id}
			// 	}
			// 	db.select(query_obj,(err,columnResult)=>{
			// 		record.column_id = columnResult[0].name;
			// 		callback()
			// 	})

			// },(err)=>{
			// 	let ret = parser.teacherList(result);
			// 	ret_obj.data = ret;
			// 	res.json(ret_obj)				

			// })


		})		
	})
}
model.recycleTeacher = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'teacher',
			data:{status:0},
			conditions:{id:record}
		}
		db.update(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'老师已删除','code':'teacherRecycledOkay'});		
	})
};
model.newTeacher = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'teacher',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'老师资料添加完成','code':'teacherAddedOkay'});
	})
}
model.updateTeacher = (req,res,id)=>{
	const data = req.body;
	let query_obj = {
		table:'teacher',
		data:data,
		conditions:{id:id}
	}
	db.update(query_obj,(err,ret)=>{
		if(err) console.log(err)
	    res.json({'message':'老师资料修改完成','code':'teacherUpdatedOkay'});
	})
}
model.detailTeacher = (req,res,teacherId)=>{
	let query_obj = {
		table:'teacher',
		conditions:{field:'id',op:'=',value:teacherId}
	}
	db.select(query_obj,(err,dbRet)=>{
		if(err) console.log(err)
		let ret = {};
		if(dbRet.length > 0){
			ret =  parser.teacherDetail(dbRet[0]);
		}
		res.json(ret);				
	})
};

model.articleList = (req,res,city_id,page)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = []
	}
	data.conditions.push({field:'city_id',op:'=',value:city_id});
	data.conditions.push({field:'status',op:'=',value:1});

	let ret_obj = {}
	let query_obj_total = {
		fields:['count(*) as total'],
		table:'article',
		conditions:data.conditions
	}
	db.select(query_obj_total,(err,total)=>{
		ret_obj.total = total[0].total;
		let query_obj = {
			table:'article',
			conditions:data.conditions,
			order:{id:'desc'},
			limit:[page*10,10]
		}
		db.select(query_obj,(err,result)=>{
			if(err) console.log(err)
			async.eachSeries(result,(record,callback)=>{
				let query_obj = {
					table:'column',
					conditions:{field:'id',op:'=',value:record.column_id}
				}
				db.select(query_obj,(err,columnResult)=>{
					record.column_id = columnResult[0].name;
					callback()
				})

			},(err)=>{
				let ret = parser.articleList(result);
				ret_obj.data = ret;
				res.json(ret_obj)				

			})


		})		
	})
}
model.recycleArticleList = (req,res,city_id,page)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = []
	}
	data.conditions.push({field:'city_id',op:'=',value:city_id});
	data.conditions.push({field:'status',op:'=',value:"0"});
	let ret_obj = {}
	let query_obj_total = {
		fields:['count(*) as total'],
		table:'article',
		conditions:data.conditions
	}
	db.select(query_obj_total,(err,total)=>{
		ret_obj.total = total[0].total;
		let query_obj = {
			table:'article',
			conditions:data.conditions,
			order:{id:'desc'},
			limit:[page*10,10]
		}
		db.select(query_obj,(err,result)=>{
			if(err) console.log(err)
			async.eachSeries(result,(record,callback)=>{
				let query_obj = {
					table:'column',
					conditions:{field:'id',op:'=',value:record.column_id}
				}
				db.select(query_obj,(err,columnResult)=>{
					record.column_id = columnResult[0].name;
					callback()
				})

			},(err)=>{
				let ret = parser.articleList(result);
				ret_obj.data = ret;
				res.json(ret_obj)				

			})


		})		
	})
}

// Banner 暂时不需要区分开各城市
model.allBannerList = (req,res)=>{
	const data = req.body;
	const city_id = req.params.city_id;
	if(data.conditions==undefined){
		data.conditions = [];
		//默认查询有效的城市
		
	}
	data.conditions.push({field: 'status' , op: '=', value: 1});
	/*data.conditions.push({field: 'city_id', op: '=', value: city_id});*/

	let query_obj = {
		table:'banner',
		conditions:data.conditions
	}
	db.select(query_obj,(err,result)=>{
		if(err) console.log(err)
		let ret = parser.bannerList(result);
		res.json(ret);
	})
}
model.bannerList = (req,res,city_id,page)=>{
	const data = req.body;
	if(data.conditions==undefined){
		data.conditions = [];
		data.conditions.push({field: 'status' , op: '=', value: 1});
	}
	/*data.conditions.push({field:'city_id',op:'=',value:city_id});*/

	let ret_obj = {}
	let query_obj_total = {
		fields:['count(*) as total'],
		table:'banner',
		conditions:data.conditions
	}
	db.select(query_obj_total,(err,total)=>{
		ret_obj.total = total[0].total;
		let query_obj = {
			table:'banner',
			conditions:data.conditions,
			order:{id:'desc'},
			limit:[page*10,10]
		}
		db.select(query_obj,(err,result)=>{
			if(err) console.log(err)
			let ret = parser.bannerList(result);
			ret_obj.data = ret;
			res.json(ret_obj)					
		})		
	})
}
model.recycleBanner = (req,res)=>{
	const data = req.body;
	async.eachSeries(data,(record,callback)=>{
		let query_obj = {
			table:'banner',
			conditions:{id:record}
		}
		db.delete(query_obj,(err,update_ret)=>{
			callback()
		})

	},(err,async_res)=>{
		if(err) console.log(err)
    	res.json({'message':'BANNER已删除','code':'bannerRecycledOkay'});		
	})
};
model.detailBanner = (req,res,bannerId)=>{
	let query_obj = {
		table:'banner',
		conditions:{field:'id',op:'=',value:bannerId}
	}
	db.select(query_obj,(err,dbRet)=>{
		if(err) console.log(err)
		let ret = {};
		if(dbRet.length > 0){
			ret = parser.bannerDetail(dbRet[0]);
		}
		res.json(ret);				
	})
};
model.newBanner = (req,res)=>{
	const data = req.body;
	let query_obj = {
		table:'banner',
		data:data
	}
	db.insert(query_obj,(err,result)=>{
		if(err) console.log(err)
    	res.json({'message':'BANNER添加完成','code':'bannerAddedOkay'});
	})
}
model.updateBanner = (req,res,id)=>{
	const data = req.body;
	let query_obj = {
		table:'banner',
		data:data,
		conditions:{id:id}
	}
	db.update(query_obj,(err,ret)=>{
		if(err) console.log(err)
	    res.json({'message':'BANNER修改完成','code':'bannerUpdatedOkay'});
	})
}
function walkObject(markId,arr,tarArr){
	for(let i=0;i<arr.length;i++){
		if(arr[i].id==markId){
			if(arr[i].parent_id!=0)
				tarArr.unshift(arr[i].parent_id)
			{
				if(arr[i].parent_id!=0){
					walkObject(arr[i].parent_id,arr,tarArr)
				}else{
					return
				}				
			}

		}
	}
}
module.exports = model;