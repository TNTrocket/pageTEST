const initialState = {
    data:[],
    message:'',
    code:'',
    form:{},
    loading:true,
};
export default function banner(state, action = {}){
    if(!state)
        state = initialState
    console.log(action.type);
    switch(action.type){
        case 'INITIAL_BANNER':
            return Object.assign({}, state, initialState);
        case 'GET_ALL_BANNER_DATA_SUCCESS':
            console.log(action);
            return Object.assign({}, state, {data: action.payload,loading:false});
        case 'GET_BANNER_DATA_SUCCESS':
            console.log(action);
            return Object.assign({}, state, {data: action.payload,loading:false});                          
        case 'RECYCLE_BANNER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});           
        case 'NEW_BANNER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'UPDATE_BANNER_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'GET_BANNER_DETAIL_SUCCESS':
            return Object.assign({}, state, {form: action.payload,loading:false});                                        
        default:
            return state
    }
}

