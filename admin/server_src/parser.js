'use strict';
let parser = {};
let moment = require('moment');
let _ = require('underscore');
parser.cityData = (cities) =>{
	let ret_arr = [];
	for(let i=0;i<cities.length;i++){
		ret_arr.push({
			key:cities[i].id,
			id:cities[i].id,
			name:cities[i].name,
			value:cities[i].id,
			pinyin:cities[i].pinyin,
			opened: cities[i].opened == 1 ? '已开通' : '待开通'
		})
	}
	return ret_arr;
}
parser.cityDetail = (city) =>{
	return {
		id: city.id,
		name: city.name,
		pinyin: city.pinyin,
		opened: city.opened.toString()
	};
}

parser.linkData = (links) =>{
	let ret_arr = [];
	for(let i=0;i<links.length;i++){
		ret_arr.push({
			key:links[i].id,
			name:links[i].name,
			url:links[i].url,
			contact:links[i].contact
		})
	}
	return ret_arr;
}

parser.columnData = (columns) =>{
	let clone_arr = [];
	let ret_arr = [];
	for(let i=0;i<columns.length;i++){
		if(columns[i].parent_id==0){
			ret_arr.push({
				id:columns[i].id,
				value:columns[i].id,
				parent_id:columns[i].parent_id,
				label:columns[i].name,
				children:[]
			})			
		}else{
			clone_arr.push({
				id:columns[i].id,
				value:columns[i].id,				
				parent_id:columns[i].parent_id,
				label:columns[i].name,
				children:[]
			})						
		}              
	}
	while(clone_arr.length!=0){
		let pop_arr = clone_arr.pop();
		appendTree(ret_arr,pop_arr);
		appendTree(clone_arr,pop_arr);
	}
	return ret_arr;
}

parser.columnDetail = (column) =>{
	return {
		name:column.name==null?'':column.name,
		parentId:column.parent_id==null?'':column.parent_id,
		seoTitle:column.title==null?'':column.title,
		keywords:column.keywords==null?'':column.keywords,
		description:column.description==null?'':column.description,
		bannerId: column.banner_id == 0 ?'':column.banner_id,
		route: column.route==null?'':column.route,
		status: column.status == 1 ? true : false
	}
}

parser.articleList = (articles) =>{
	let ret_arr = [];
	for(let i=0;i<articles.length;i++){
		ret_arr.push({
			key:articles[i].id,
			id:articles[i].id,
			title:articles[i].title,
			updated_at:articles[i].update_at==null?articles[i].created_at:articles[i].update_at,
			publish_at: moment(articles[i].publish_at).format('YYYY-MM-DD HH:mm:ss'),
			column:articles[i].column_id
		})
	}
	return ret_arr;
}
parser.teacherList = (teachers) =>{
	let ret_arr = [];
	for(let i=0;i<teachers.length;i++){
		ret_arr.push({
			key:teachers[i].id,
			id:teachers[i].id,
			title:teachers[i].nick_name,
			updated_at: moment(teachers[i].updated_at==null?teachers[i].created_at:teachers[i].updated_at).format('YYYY-MM-DD HH:mm:ss'),
			column:'名师团队'
		})
	}
	return ret_arr;
}
parser.articleDetail = (article) =>{
	return {
		title:article.title,
		tag:article.tag,
		columnId:article.column_id,
		columnArr:article.columnArr,
		keywords:article.keywords,
		content:article.content,
		publish_at: moment(article.publish_at).format('YYYY-MM-DD HH:mm:ss'),
		information:article.information,
		description:article.description,
		image:article.image
	};
}
parser.teacherDetail = (teacher) =>{
	return {
		nick_name:teacher.nick_name,
		teaching:teacher.teaching,
		avatar:teacher.avatar,
		title:teacher.title,
		xueke: teacher.xueke,
		students: teacher.students,
		description:teacher.description
	};
}
parser.bannerList = (banners) =>{
	let ret_arr = [];
	for(let i=0;i<banners.length;i++){
		let position = '';
		switch(banners[i].position){
			case 'webhome':
				position = '电脑版首页';
				break;
			case 'webpage':
				position = '电脑版内页';
				break;
			case 'waphome':
				position = '手机版首页';
				break;
			case 'wappage':
				position = '手机版内页';
				break;
		}
		ret_arr.push({
			key:banners[i].id,
			id:banners[i].id,
			image:banners[i].image,
			name:'[' + position + '] ' + banners[i].name
		})
	}
	return ret_arr;
}
parser.bannerDetail = (banner) =>{
	return {
		id: banner.id,
		name: banner.name,
		image: banner.image,
		alt:banner.alt,
		url:banner.url,
		position: banner.position
	};
}
function appendTree(array,target){
	array.map((item)=>{
		if(item.children.length!=0){
			appendTree(item.children,target)
		}
		if(item.id==target.parent_id){
			item.children.push(target)
		}
	})
}

module.exports = parser;