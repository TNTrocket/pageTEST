const initialState = {
    data:[],
    message:'',
    code:'',
    form:{},
    loading:true,
};
export default function article(state, action = {}){
    if(!state)
        state = initialState
    switch(action.type){
        case 'GET_ARTICLE_DATA_PENDING':
            state.loading = true;
            return Object.assign({}, state, state);
        case 'GET_ARTICLE_DATA_SUCCESS':
            return Object.assign({}, state, {data: action.payload,loading:false});
        case 'GET_RECYCLE_ARTICLE_DATA_SUCCESS':
            return Object.assign({}, state, {data: action.payload,loading:false});
        case 'NEW_ARTICLE_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'RECYCLE_ARTICLE_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'DELETE_ARTICLE_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'RECOVER_ARTICLE_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'UPDATE_ARTICLE_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});            
        case 'GET_ARTICLE_DETAIL_SUCCESS':
            return Object.assign({}, state, {form: action.payload,loading:false});                                             
        default:
            return state
    }
}

