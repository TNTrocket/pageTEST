import api from '../api'
export function getBanner(page,city_id,conditions) {
    return {
        type: 'GET_BANNER_DATA',
        payload: {
            promise: api.post('/banner/'+city_id+'/'+page,{
            	data:{
            		conditions:conditions
            	}
            })
        }
    }
};
export function getAllBanner(city_id,conditions) {
    return {
        type: 'GET_ALL_BANNER_DATA',
        payload: {
            promise: api.post('/banner/list/'+city_id+'/all',{
                data:{
                    conditions:conditions
                }
            })
        }
    }
};

export function initial() {
    return {
        type: 'INITIAL_BANNER'
    }
};
export function recycleBanner(arr) {
    return {
        type: 'RECYCLE_BANNER',
        payload: {
            promise: api.post('/banner/recycle',
                {
                    data:arr
            })
        }
    }
};
export function getBannerDetail(id) {
    return {
        type: 'GET_BANNER_DETAIL',
        payload: {
            promise: api.post('/banner/detail/'+id)
        }
    }
};
export function newBanner(obj) {
    return {
        type: 'NEW_BANNER',
        payload: {
            promise: api.post('/banner/new',
                {
                    data:obj
            })
        }
    }
};
export function updateBanner(obj,id) {
    return {
        type: 'UPDATE_BANNER',
        payload: {
            promise: api.post('/banner/update/'+id,
                {
                    data:obj
            })
        }
    }
};