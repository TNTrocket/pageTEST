import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Router, Route, IndexRedirect, useRouterHistory} from 'react-router';
import {createHistory} from 'history'
import configureStore from './store/configureStore';
import App from './views/App';
import Login from './views/Login';
import Article from './views/Article';
import Column from './views/Column';
import AddColumn from './views/Column/add';
import Link from './views/Link';
import Recycle from './views/Recycle';
import Compose from './views/Compose';
import Teacher from './views/Teacher';
import TeacherEdit from './views/Teacher/edit';
import Banner from './views/Banner';
import BannerEdit from './views/Banner/edit';
import City from './views/City';
import CityEdit from './views/City/edit';


import Edit from './views/Compose/edit';
import {getCookie} from './utils';

const history = useRouterHistory(createHistory)({ basename: '' });
const store = configureStore();

const validate = (next, replace, callback)=>{
  const isLoggedIn = !!getCookie('uid');  
  if (!isLoggedIn && next.location.pathname != '/login') {
    replace('/login')
  }
  callback()
};

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
        <Route path="/" onEnter={validate}>
          <IndexRedirect to="column" />
          <Route component={App}>
            <Route path="column" component={Column}/>
            <Route path="addColumn" component={AddColumn}/>
            <Route path="article" component={Article}/>
            <Route path="link" component={Link}/>
            <Route path="compose" component={Compose}/>
            <Route path="edit" component={Edit}/>
            <Route path="teacher" component={Teacher} />   
            <Route path="teacherEdit" component={TeacherEdit} />     
            <Route path="banner" component={Banner} />   
            <Route path="bannerEdit" component={BannerEdit} />   
            <Route path="recycle" component={Recycle}/>
            <Route path="city" component={City} />
            <Route path="cityEdit" component={CityEdit} />

          </Route>
          <Route path="login" component={Login}/>
        </Route>
      </Router>
  </Provider>,
  document.getElementById('root')
);
