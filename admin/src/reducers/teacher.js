const initialState = {
    data:[],
    message:'',
    code:'',
    form:{},
    loading:true,
};
export default function teacher(state, action = {}){
    if(!state)
        state = initialState
    switch(action.type){
        case 'INITIAL_TEACHER':
            return Object.assign({}, state, initialState);         
        case 'GET_TEACHER_DATA_SUCCESS':
            console.log(action);
            return Object.assign({}, state, {data: action.payload,loading:false});                                       
        case 'RECYCLE_TEACHER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});           
        case 'NEW_TEACHER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'UPDATE_TEACHER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'GET_TEACHER_DETAIL_SUCCESS':
            return Object.assign({}, state, {form: action.payload,loading:false});                                        
        default:
            return state
    }
}

