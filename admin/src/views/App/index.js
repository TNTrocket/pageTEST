import React, {PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Affix , Row, Col} from 'antd';

import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LeftNavBar from '../../components/LeftNavBar';
import {fetchProfile, logout} from '../../actions/user';
import {getCity} from '../../actions/city';
import cookie from 'react-cookie';

import 'antd/dist/antd.less';
import './index.less';

class App extends React.Component {
  constructor(props,context) {
    super(props,context);   
  }

  componentWillMount() {
    const {actions} = this.props;
    actions.fetchProfile();
    actions.getCity();
    this.setState({
      cityName:cookie.load('cityName')||'',
      city:cookie.load('city')
    })    

  }

  componentWillReceiveProps(nextProps){
  }

  cityChange(cityId) {
    cookie.save('city', cityId, { path: '/' });
    const cities = this.props.city.data;
    cities.map((item)=>{
      if(item.key==cityId)
        cookie.save('cityName',item.name, { path: '/' });

    })
    this.context.router.go('/column');

  }
  render() {
    const {user,actions,city} = this.props;     
    return (
        <div className="ant-layout-main">
          <Header user={user} {...this.props} city={city} cityValue={this.state.cityName} cityChange={this.cityChange.bind(this)}/>
          <div className="ant-layout-container">
            <div className="ant-layout-content">
                    <Col span="3">
                      <LeftNavBar />
                    </Col>
                    <Col span="21" className="mainContent">
                        {React.cloneElement(this.props.children,{city:this.state.city,key:this.state.key})}
                    </Col>
            </div>
          </div>
          <Footer />
        </div>
    );
  }
}

App.propTypes = {
  user: PropTypes.object,
  children: PropTypes.node.isRequired,
};

App.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const {user,city} = state;
  return {
      user: user ? user : null,
      city: city ? city : []
  };
};
function mapDispatchToProps(dispatch) {
  return {actions: bindActionCreators({fetchProfile, logout,getCity}, dispatch)};
}
export default connect(mapStateToProps, mapDispatchToProps)(App);
