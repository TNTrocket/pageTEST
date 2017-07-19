import api from '../api'
export function postNewLink(obj) {
	console.log(obj);
    return {
        type: 'POST_NEW_LINK',
        payload: {
            promise: api.post('/link/new',
            	{
            		data:{
            		position:obj.position,
            		name:obj.name,
            		url:obj.url,
            		contact:obj.contact            			
            		}	
            })
        }
    }
};
export function getAllLink() {
    return {
        type: 'GET_ALL_LINK',
        payload: {
            promise: api.post('/link/all')
        }
    }
};
export function removeLink(id) {
    return {
        type: 'REMOVE_LINK',
        payload: {
            promise: api.post('/link/delete/'+id)
        }
    }
};