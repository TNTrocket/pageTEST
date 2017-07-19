import React,{PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Pagination, Cascader,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select,message} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getTeacher,recycleTeacher} from '../../actions/teacher';
import {getAllColumn} from '../../actions/column';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
import '../table.less';

class Teacher extends React.Component {
    constructor (props,context) {
        super(props,context)
    }

    componentWillMount () {
      this.props.api.getAllColumn();

      const TeacherColumns = [
      {
          title: '标号',
          dataIndex: 'id',
          key: 'id',
          width:100,
          className:'table-react',
      },{
          title: '老师',
          dataIndex: 'title',
          key: 'title',
          width:200,
          className:'table-react',
      },{
          title: '更新时间',
          dataIndex: 'updated_at',
          key: 'updated_at',
          width:100,    
          className:'table-react',
      },{
          title: '类目',
          dataIndex: 'column',
          key: 'column',
          width:100,    
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
              columns:TeacherColumns,
              data:[],
              loading:false,
              pagination:pagination,
              selectedRows:[],
              conditions:[],
              request:false
          }
      );
      this.props.api.getTeacher(1,this.props.city);
    }

    componentWillReceiveProps(nextProps){
        const pagination = {
            total:nextProps.Teacher.data.total,
            current:this.state.pagination.current||1,
        };
        this.setState(
            {
                data:nextProps.Teacher.data.data,
                loading:nextProps.Teacher.loading,
                pagination:pagination,
            }
        )
        const {Teacher} = nextProps;
        if(Teacher.code=='teacherRecycledOkay'&&this.state.request){
          message.success(Teacher.message);          
          this.setState({
            request:false,
            selectedRows:[]
          })
          if(this.state.conditions.length>0)
            this.props.api.getTeacher(this.state.pagination.current,this.props.city,this.state.conditions);      
          else  
            this.props.api.getTeacher(this.state.pagination.current,this.props.city);   
        }            
    }

    columnChange(value){
      // if(value!==undefined){
      //   const pager = this.state.pagination;
      //   pager.current = 1;
      //   this.setState({
      //       pagination:pager,
      //       loading:true
      //   })           
      //   this.setState({
      //     conditions:[{field:'column_id',op:'=',value:value[value.length-1]}],
      //     selectedRows:[],
      //   });
      //   this.props.api.getTeacher(
      //     1,
      //     this.props.city,
      //     [{field:'column_id',op:'=',value:value[value.length-1]}]
      //   );         
      // }
    }       

    RowDelete(...args) {
      if(this.state.selectedRows.length==0){
        message.error('没有选中老师');          
        return
      }else{
        this.setState({request:true})
        this.props.api.recycleTeacher(this.state.selectedRows);        
      }
    }

    RowSearch(){
      let keywords=this.refs.searchBox.refs.input.value;
    }

    onPageChange(curPage){
        console.log(this.state.conditions);
        const pager = this.state.pagination;
        pager.current = curPage;
        this.setState({
            pagination:pager,
            selectedRows:[],
            loading:true
        })
        if(this.state.conditions.length>0)
          this.props.api.getTeacher(curPage,this.props.city,this.state.conditions);      
        else  
          this.props.api.getTeacher(curPage,this.props.city);      
    }

    onRowChange(selectedRows) {
      console.log(this.state.selectedRows);
      this.setState({
        selectedRows:selectedRows
      })
    }

    editTeacher(){
      const teacherId = this.state.selectedRows[0];
      this.context.router.push('/teacherEdit?id='+teacherId);
    }
    newTeacher(){
      this.context.router.push('/teacherEdit');
    }
    render () {
        const rowSelection = {
          onChange:this.onRowChange.bind(this),
          selectedRowKeys:this.state.selectedRows,
          onSelectAll(selected, selectedRows, changeRows) {
          },
        };
        const options = this.props.Column.column;
        const ableToEdit = this.state.selectedRows.length == 1

        return (
            <div>
              <Breadcrumb separator=">>">
                <Breadcrumb.Item>名师团队</Breadcrumb.Item>
                <Breadcrumb.Item>老师管理</Breadcrumb.Item>
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
                <Button type="ghost" disabled={!ableToEdit} onClick={this.editTeacher.bind(this)}>修改</Button>                       
                <span className="ant-divider"></span>
                <Button type="ghost" onClick={this.RowDelete.bind(this)} disabled={false}>删除</Button>
                <span className="ant-divider"></span>
                <Button type="ghost" onClick={this.newTeacher.bind(this)}>新建</Button>

                  <Cascader options={options} expandTrigger="hover" 
                    onChange={this.columnChange.bind(this)} style={{marginTop:10,width:300}}
                  />                
              </div>
              <div style={{marginTop:10,width:300}}>

                  <Input type="text" ref='searchBox'/>
                  <Button type="ghost" onClick={this.RowSearch.bind(this)} style={{marginTop:10,width:300}}>搜索</Button>
               </div>
               </Col>
              <Col span='1'>
              </Col>       
              </Row>
            </div>

        )
    }
}
Teacher.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};
const mapStateToProps = (state) => {
    const {teacher,column} = state;
    console.log(teacher);
    return {
        Teacher:teacher,
        Column:column
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getAllColumn,getTeacher,recycleTeacher}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Teacher);