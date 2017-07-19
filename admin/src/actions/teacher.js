import api from '../api'
export function getTeacher(page,city_id,conditions) {
    return {
        type: 'GET_TEACHER_DATA',
        payload: {
            promise: api.post('/teacher/'+city_id+'/'+page,{
            	data:{
            		conditions:conditions
            	}
            })
        }
    }
};
export function initial() {
    return {
        type: 'INITIAL_TEACHER'
    }
};
export function recycleTeacher(arr) {
    return {
        type: 'RECYCLE_TEACHER',
        payload: {
            promise: api.post('/teacher/recycle',
                {
                    data:arr
            })
        }
    }
};
export function getTeacherDetail(id) {
    return {
        type: 'GET_TEACHER_DETAIL',
        payload: {
            promise: api.post('/teacher/detail/'+id)
        }
    }
};
export function newTeacher(obj) {
    return {
        type: 'NEW_TEACHER',
        payload: {
            promise: api.post('/teacher/new',
                {
                    data:obj
            })
        }
    }
};
export function updateTeacher(obj,id) {
    return {
        type: 'UPDATE_TEACHER',
        payload: {
            promise: api.post('/teacher/update/'+id,
                {
                    data:obj
            })
        }
    }
};