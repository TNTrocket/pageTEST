import api from '../api'
export function getCity(page, conditions) {
    return {
        type: 'GET_CITY_DATA',
        /**payload: {
            promise: api.post('/city/list')
        }*/
        payload: {
            promise: api.post('/city/list', {
                data:{
                    conditions:conditions
                }
            })
        }
    }
};

export function initial() {
    return {
        type: 'INITIAL_CITY'
    }
};

export function recycleCity(arr) {
    return {
        type: 'RECYCLE_CITY',
        payload: {
            promise: api.post('/city/recycle',
                {
                    data:arr
            })
        }
    }
};

export function getCityDetail(id) {
    return {
        type: 'GET_CITY_DETAIL',
        payload: {
            promise: api.post('/city/detail/'+id)
        }
    }
};

export function newCity(obj) {
    return {
        type: 'NEW_CITY',
        payload: {
            promise: api.post('/city/new',
                {
                    data:obj
            })
        }
    }
};

export function updateCity(obj,id) {
    return {
        type: 'UPDATE_CITY',
        payload: {
            promise: api.post('/city/update/'+id,
                {
                    data:obj
            })
        }
    }
};

export function checkCity(obj) {
    return {
        type: 'CHECK_CITY',
        payload: {
            promise: api.post('/city/check-unique', {data: obj})
        }
    }
};
