const initialState = {
    data:[],
    message:'',
    loading:true,
};
export default function link(state, action = {}){
    if(!state)
        state = initialState
    switch(action.type){
        case 'POST_NEW_LINK_PENDING':
            state.loading = true;
            return Object.assign({}, state, state);
        case 'POST_NEW_LINK_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'GET_ALL_LINK_SUCCESS':
            return Object.assign({}, state, {data: action.payload});
        case 'REMOVE_LINK_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});            
        default:
            return state
    }
}

