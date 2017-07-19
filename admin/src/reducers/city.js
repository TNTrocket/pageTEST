const initialState = {
    data:[],
    message:'',
    code:'',
    form:{},
    loading:true,
    check_unique: false
};
export default function article(state, action = {}){
    if(!state)
        state = initialState
    switch(action.type){
        case 'GET_CITY_DATA_PENDING':
            state.loading = true;
            return Object.assign({}, state, state);
        case 'INITIAL_CITY':
            return Object.assign({}, state, initialState); 
        case 'GET_CITY_DATA_SUCCESS':
            return Object.assign({}, state, {data: action.payload,loading:false});
        case 'RECYCLE_CITY_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});           
        case 'NEW_CITY_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'UPDATE_CITY_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'GET_CITY_DETAIL_SUCCESS':
            return Object.assign({}, state, {form: action.payload,loading:false});
        case 'CHECK_CITY':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        default:
            return state
    }
}

