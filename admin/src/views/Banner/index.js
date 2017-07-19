import React,{PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Pagination, Cascader,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select,message} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getBanner,recycleBanner} from '../../actions/banner';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
import '../table.less';

class Banner extends React.Component {
    constructor (props,context) {
        super(props,context)
    }

    componentWillMount () {
      const BannerColumns = [
      {
          title: '标号',
          dataIndex: 'id',
          key: 'id',
          width:100,
          className:'table-react',
      },{
          title: '名称',
          dataIndex: 'name',
          key: 'name',
          width:200,
          className:'table-react',
      },{
          title: 'Banner',
          dataIndex: 'image',
          key: 'image',
          render(text, row, index){
            const style={maxWidth:300, maxHeight:50}
            return {children:  <img src={text} style={style} />}
          },
          width:200,
          className:'table-react',
      }];      
      const pagination = {
          defaultPageSize:10,
          pageSize:10,
          total:0,
          current:1,
          className:'fix-footer',
          onChange:this.onPageChange.bind(this),

      };
      this.setState(
          {
              columns:BannerColumns,
              data:[],
              loading:false,
              pagination:pagination,
              selectedRows:[],
              conditions:[],
              request:false
          }
      );
      this.props.api.getBanner(1,this.props.city);
    }

    componentWillReceiveProps(nextProps){
        const pagination = {
            total:nextProps.Banner.data.total,
            current:this.state.pagination.current||1,
        };
        this.setState(
            {
                data:nextProps.Banner.data.data,
                loading:nextProps.Banner.loading,
                pagination:pagination,
            }
        )
        const {Banner} = nextProps;
        if(Banner.code=='bannerRecycledOkay'&&this.state.request){
          message.success(Banner.message);          
          this.setState({
            request:false,
            selectedRows:[]
          })
          if(this.state.conditions.length>0)
            this.props.api.getBanner(this.state.pagination.current,this.props.city,this.state.conditions);      
          else  
            this.props.api.getBanner(this.state.pagination.current,this.props.city);   
        }            
    }

    RowDelete(...args) {
      if(this.state.selectedRows.length==0){
        message.error('没有选中BANNER');          
        return
      }else{
        this.setState({request:true})
        this.props.api.recycleBanner(this.state.selectedRows);        
      }
    }



    onPageChange(curPage){
        const pager = this.state.pagination;
        pager.current = curPage;
        this.setState({
            pagination:pager,
            selectedRows:[],
            loading:true
        })
        if(this.state.conditions.length>0)
          this.props.api.getBanner(curPage,this.props.city,this.state.conditions);      
        else  
          this.props.api.getBanner(curPage,this.props.city);      
    }

    onRowChange(selectedRows) {
      this.setState({
        selectedRows:selectedRows
      })
    }

    editBanner(){
      const BannerId = this.state.selectedRows[0];
      this.context.router.push('/bannerEdit?id='+BannerId);
    }
    newBanner(){
      this.context.router.push('/bannerEdit');
    }
    render () {
        const rowSelection = {
          onChange:this.onRowChange.bind(this),
          selectedRowKeys:this.state.selectedRows,
          onSelectAll(selected, selectedRows, changeRows) {
          },
        };
        const ableToEdit = this.state.selectedRows.length == 1

        return (
            <div>
              <Breadcrumb separator=">>">
                <Breadcrumb.Item>BANNER广告管理</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span='1'>
              </Col>
              <Col span='22'>
              <Table
                  rowSelection={rowSelection}
                  columns={this.state.columns}
                  dataSource={this.state.data}
                  loading={this.state.loading}
                  pagination={this.state.pagination}
                  className="table-fixed-height"
                  bordered
              />
              <div style={{marginTop:10,width:400}}>
                <Button type="ghost" disabled={!ableToEdit} onClick={this.editBanner.bind(this)}>修改</Button>                       
                <span className="ant-divider"></span>
                <Button type="ghost" onClick={this.RowDelete.bind(this)} disabled={false}>删除</Button>
                <span className="ant-divider"></span>
                <Button type="ghost" onClick={this.newBanner.bind(this)}>新建</Button>              
              </div>
               </Col>
              <Col span='1'>
              </Col>       
              </Row>
            </div>

        )
    }
}
Banner.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};
const mapStateToProps = (state) => {
    const {banner,column} = state;
    return {
        Banner:banner,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getBanner,recycleBanner}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Banner);