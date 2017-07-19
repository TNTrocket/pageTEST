import api from '../api'
export function getAllColumn() {
    return {
        type: 'GET_ALL_COLUMN',
        payload: {
            promise: api.post('/column/all')
        }
    }
};

export function initial() {
    return {
        type: 'INITIAL_COLUMN'
    }
};

export function getColumnId(id) {
    return {
        type: 'GET_COLUMN_ID',
        payload: {
            promise: api.post('/column/detail/'+id)
        }
    }
};

export function updateColumn(id,obj) {
	console.log(obj);
    return {
        type: 'UPDATE_COLUMN',
        payload: {
            promise: api.post('/column/update/'+id,
            	{
            		data:{
                        name:obj.name,
                        parent_id:obj.parentId,
                		title:obj.seoTitle,
                		keywords:obj.keywords,
                		description:obj.description,
                        banner_id: obj.bannerId || 0,
                        status: obj.status,
                        route: obj.route
            		}	
            })
        }
    }
};

export function newColumn(obj) {
    console.log(obj);
    return {
        type: 'NEW_COLUMN',
        payload: {
            promise: api.post('/column/new',
                {
                    data:{
                        name:obj.name,
                        parent_id:obj.parentId,
                        title:obj.seoTitle,
                        keywords:obj.keywords,
                        description:obj.description,
                        banner_id: obj.bannerId || 0,
                        route: obj.route
                    }   
            })
        }
    }
};