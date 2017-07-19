import React,{PropTypes} from 'react'
import {Menu,Icon,Affix} from 'antd';
const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

export default class LeftNavBar extends React.Component{
    constructor(props,context){
      super(props,context)
    }
    componentWillMount () {
    }

    handleClick(key){
      switch(key.key){
        case 'column':
        this.context.router.push('/column');
        break;
        case 'addColumn':
        this.context.router.push('/addColumn');
        break;
        case 'article':
        this.context.router.push('/article');
        break;
        case 'teacher':
        this.context.router.push('/teacher');
        break;        
        case 'link':
        this.context.router.push('/link');
        break;
        case 'compose':
        this.context.router.push('/compose');
        break;              
        case 'recycle':
        this.context.router.push('/recycle');
        break;
        case 'banner':
        this.context.router.push('/banner');
        break; 
        case 'city':
        this.context.router.push('/city');
        break;   
      }
    }

    render() {
        return (
          <Affix offsetTop={48}>
          <Menu onClick={this.handleClick.bind(this)}
            defaultOpenKeys={['leftNavBar']}
            mode="inline"
            style={{height:'100%'}}
          >
            <SubMenu key="leftNavBar" title={<span><Icon type="inbox" /><span>内容管理</span></span>} >
              <Menu.Item key="column">网站栏目管理</Menu.Item>
              <Menu.Item key="addColumn">添加网站栏目</Menu.Item>
              <Menu.Item key="teacher">名师团队</Menu.Item>              
              <Menu.Item key="article">所有文档列表</Menu.Item>
              <Menu.Item key="compose"><a href="/compose">发布文章</a></Menu.Item>
              
              <Menu.Item key="link">友情链接</Menu.Item>          
              <Menu.Item key="banner">BANNER广告管理</Menu.Item>
              <Menu.Item key="city">城市管理</Menu.Item>             

            </SubMenu>
            <SubMenu key="leftRecycleNavBar" title={<span><Icon type="inbox" /><span>回收站</span></span>} >
              <Menu.Item key="recycle">文章列表</Menu.Item>
            </SubMenu>
          </Menu>
          </Affix>
        );
    }
}
LeftNavBar.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};
LeftNavBar.propTypes = {
  location: PropTypes.object,
};