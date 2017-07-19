import React,{PropTypes} from 'react'
import { Row, Col, Icon, Menu, Dropdown,Affix,Select} from 'antd'
import './index.less'

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;
const Option = Select.Option;

import { logout } from '../../actions/user';

export default class Header extends React.Component {
  constructor (props,context) {
    super(props,context);
  }
  handleClick (key) {
    this.props.actions.logout();
    this.context.router.push('/login');
  }
  handleChange (key) {
  }  
  componentWillMount() {
  }

  render () {
    const {user} = this.props;
    const {city} = this.props;
    let citySelectOptions = [];
    let defValue='';
    city.data.map((item)=>{
      let key = 'city-'+item.key;
      if(item.key==this.props.cityValue){
        defValue = item.name
      }
      citySelectOptions.push(<Option key={key} value={item.key.toString()} >{item.name}</Option>)
    })
    return (
      <Affix>
      <div className='ant-layout-header'>
        <Row type="flex" justify="center" align="middle">
        <Col span='8'></Col>
        <Col span='4'>
        <Select          
          style={{ width: 100 }}
          placeholder="请选择城市"
          defaultValue={this.props.cityValue}
          onChange={this.props.cityChange}
        >
        {citySelectOptions}
        </Select>  
        </Col>
        <Col span='4'>
        <Menu onClick={this.handleClick.bind(this)} mode="horizontal">       
          <Menu.Item key="content-management">
            <Icon type="hdd" />内容管理
          </Menu.Item>
          <SubMenu class='header-menu-item-right' title={<span><Icon type="user" />{user.user}</span>}>
            <Menu.Item key="user:logout">注销</Menu.Item>
          </SubMenu>
        </Menu>        
        </Col>
        <Col span='8'></Col>
        </Row>
     

      </div>
          </Affix>
    )
  }
}
Header.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};


