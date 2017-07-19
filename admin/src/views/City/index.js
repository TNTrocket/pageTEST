import React,{PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Pagination, Cascader,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select,message} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getCity,recycleCity} from '../../actions/city';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
import '../table.less';

class City extends React.Component {
    constructor (props,context) {
        super(props,context)
    }

    componentWillMount () {
      const CityColumns = [
      {
          title: '标号',
          dataIndex: 'id',
          key: 'id',
          width:100,
          className:'table-react',
      },{
          title: '城市',
          dataIndex: 'name',
          key: 'name',
          width:200,
          className:'table-react',
      },{
          title: '拼音',
          dataIndex: 'pinyin',
          key: 'pinyin',
          width:200,
          className:'table-react',
      },{
          title: '开通状态',
          dataIndex: 'opened',
          key: 'opened',
          width:200,
          className:'table-react',
      }];      
      /*const pagination = {
          defaultPageSize:10,
          pageSize:10,
          total:0,
          current:1,
          className:'fix-footer',
          onChange:this.onPageChange.bind(this),

      };*/
      this.setState(
          {
              columns:CityColumns,
              data:[],
              loading:false,
              //pagination:pagination,
              selectedRows:[],
              //conditions:[],
              request:false
          }
      );
      this.props.api.getCity();
    }

    componentWillReceiveProps(nextProps){
        /*const pagination = {
            total:nextProps.Banner.data.total,
            current:this.state.pagination.current||1,
        };*/
        this.setState(
            {
                data:nextProps.City.data,
                loading:nextProps.City.loading,
                //pagination:pagination,
            }
        )
        const {City} = nextProps;
        if(City.code=='cityRecycledOkay'&&this.state.request){
          message.success(City.message);          
          this.setState({
            request:false,
            selectedRows:[]
          })
          this.props.api.getCity();
          /*if(this.state.conditions.length>0)
            this.props.api.getCity(this.state.pagination.current,this.props.city,this.state.conditions);      
          else  
            this.props.api.getCity();  */ 
        }            
    }

    RowDelete(...args) {
      if(this.state.selectedRows.length==0){
        message.error('没有选中城市');          
        return
      }else{
        this.setState({request:true})
        this.props.api.recycleCity(this.state.selectedRows);        
      }
    }

    onRowChange(selectedRows) {
      this.setState({
        selectedRows:selectedRows
      })
    }

    editCity(){
      const CityId = this.state.selectedRows[0];
      this.context.router.push('/cityEdit?id='+CityId);
    }
    newCity(){
      this.context.router.push('/cityEdit');
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
                <Breadcrumb.Item>城市管理</Breadcrumb.Item>
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
                  pagination={false}
                  className="table-fixed-height"
                  bordered
              />
              <div style={{marginTop:10,width:400}}>
                <Button type="ghost" disabled={!ableToEdit} onClick={this.editCity.bind(this)}>修改</Button>                       
                <span className="ant-divider"></span>
                
                <Button type="ghost" onClick={this.newCity.bind(this)}>新建</Button>              
              </div>
               </Col>
              <Col span='1'>
              </Col>       
              </Row>
            </div>

        )
    }
}

/*
城市删除功能暂时去掉
<Button type="ghost" onClick={this.RowDelete.bind(this)} disabled={false}>删除</Button>
                <span className="ant-divider"></span>
*/

City.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};
const mapStateToProps = (state) => {
    const {city,column} = state;
    return {
        City:city,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getCity,recycleCity}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(City);