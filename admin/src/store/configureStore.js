import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';

import promiseMiddleware from '../middlewares/promiseMiddleware'

import user from '../reducers/user';
import city from '../reducers/city';
import link from '../reducers/link';
import column from '../reducers/column';
import article from '../reducers/article';
import teacher from '../reducers/teacher';
import banner from '../reducers/banner';



const reducer = combineReducers({user,city,link,column,article,teacher,banner});

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  promiseMiddleware({promiseTypeSuffixes: ['PENDING', 'SUCCESS', 'ERROR']})
)(createStore);

export default function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}
