const initialState = {
    column:[],
    form:{},
    message:'',
    loading:true,
};
export default function column(state, action = {}){
    if(!state)
        state = initialState
    switch(action.type){
        case 'INITIAL_COLUMN':
            return Object.assign({}, state, initialState);
        case 'GET_ALL_COLUMN_SUCCESS':
            return Object.assign({}, state, {column: action.payload});
        case 'GET_COLUMN_ID_SUCCESS':
            return Object.assign({}, state, {form: action.payload});            
        case 'UPDATE_COLUMN_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        case 'NEW_COLUMN_SUCCESS':
            return Object.assign({}, state, {message: action.payload.message,code:action.payload.code,loading:false});
        default:
            return state
    }
}
