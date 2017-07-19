import api from '../api'
export function getArticle(page,city_id,conditions) {
    return {
        type: 'GET_ARTICLE_DATA',
        payload: {
            promise: api.post('/article/'+city_id+'/'+page,{
            	data:{
            		conditions:conditions
            	}
            })
        }
    }
};

export function getRecycleArticle(page,city_id,conditions) {
    return {
        type: 'GET_RECYCLE_ARTICLE_DATA',
        payload: {
            promise: api.post('/recycle_article/'+city_id+'/'+page,{
            	data:{
            		conditions:conditions
            	}            	
            })
        }
    }
};


export function newArticle(obj) {
    return {
        type: 'NEW_ARTICLE',
        payload: {
            promise: api.post('/article/new',
            	{
            		data:{
            		title:obj.title,
            		tag:obj.tags,
            		keywords:obj.keywords,
            		content:obj.content,
            		column_id:obj.columnId,
                    city_id:obj.cityId,
                    image:obj.image,
                    information: obj.information,
                    description: obj.description,
                    publish_at:obj.publish_at,
            		status:1
            		}
            })
        }
    }
};

export function recycleArticle(arr) {
    return {
        type: 'RECYCLE_ARTICLE',
        payload: {
            promise: api.post('/article/recycle',
            	{
            		data:arr
            })
        }
    }
};
export function deleteArticle(arr) {
    return {
        type: 'DELETE_ARTICLE',
        payload: {
            promise: api.post('/article/delete',
            	{
            		data:arr
            })
        }
    }
};
export function recoverArticle(arr) {
    return {
        type: 'RECOVER_ARTICLE',
        payload: {
            promise: api.post('/article/recover',
            	{
            		data:arr
            })
        }
    }
};
export function getArticleContent(articleId) {
    return {
        type: 'GET_ARTICLE_DETAIL',
        payload: {
            promise: api.post('/article/detail/'+articleId)
        }
    }
};
export function updateArticle(obj) {
    return {
        type: 'UPDATE_ARTICLE',
        payload: {
            promise: api.post('/article/update',
            	{
            		data:obj	
            })
        }
    }
};