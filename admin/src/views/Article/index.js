import React,{PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Pagination, Cascader,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select,message} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getArticle,recycleArticle} from '../../actions/article';
import {getAllColumn} from '../../actions/column';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;
import '../table.less';

class Article extends React.Component {
    constructor (props,context) {
        super(props,context)
    }

    componentWillMount () {
      this.props.api.getAllColumn();

      const articleColumns = [
      {
          title: '标号',
          dataIndex: 'id',
          key: 'id',
          width:100,
          className:'table-react',
      },{
          title: '文章标题',
          dataIndex: 'title',
          key: 'title',
          width:200,
          className:'table-react',
      },{
          title: '类目',
          dataIndex: 'column',
          key: 'column',
          width:100,    
          className:'table-react',
      },{
          title: '发布时间',
          dataIndex: 'publish_at',
          key: 'publish_at',
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
              columns:articleColumns,
              data:[],
              loading:false,
              pagination:pagination,
              selectedRows:[],
              conditions:[],
              search_keywords: '',
              search_column_id: '',
              request:false
          }
      );
      this.props.api.getArticle(1,this.props.city);
    }

    componentWillReceiveProps(nextProps){
        const pagination = {
            total:nextProps.Article.data.total,
            current:this.state.pagination.current||1,
        };
        this.setState(
            {
                data:nextProps.Article.data.data,
                loading:nextProps.Article.loading,
                pagination:pagination,
            }
        )
        const {Article} = nextProps;
        if(Article.code=='articleRecycledOkay'&&this.state.request){
          message.success(Article.message);          
          this.setState({
            request:false,
            selectedRows:[]
          })
          if(this.state.conditions.length>0)
            this.props.api.getArticle(this.state.pagination.current,this.props.city,this.state.conditions);      
          else  
            this.props.api.getArticle(this.state.pagination.current,this.props.city);   
        }            
    }

    columnChange(value){
        let search_column_id = '';
        let conditions = [];      
      
        if(value!==undefined && value.length > 0){
            search_column_id = value[value.length-1];
            conditions.push( {field:'column_id',op:'=',value: search_column_id} );
        }

        const pager = this.state.pagination;
        const search_keywords = this.state.search_keywords;

        if(search_keywords != ''){
            conditions.push({field:'title',op:'LIKE',value: search_keywords} );
        }

        pager.current = 1;
        this.setState({
            pagination:pager,
            loading:true
        })
        this.setState({
            search_column_id: search_column_id,
            conditions:conditions,
            selectedRows:[],
        });
        this.props.api.getArticle(
          1,
          this.props.city,
          conditions
        ); 
    }       

    RowDelete(...args) {
      if(this.state.selectedRows.length==0){
        message.error('没有选中文章');          
        return
      }else{
        this.setState({request:true})
        this.props.api.recycleArticle(this.state.selectedRows);        
      }
    }

    handleInputChange(e) {
      console.log('search keywords:', e.target.value);
      this.setState({
        search_keywords: e.target.value
      });
    }

    RowSearch(){
      //let keywords=this.refs.searchBox.refs.input.value; 拿不到值
      const pager = this.state.pagination;
      const search_keywords = this.state.search_keywords;
      const search_column_id = this.state.search_column_id;

      let conditions = [];

      if(search_keywords != ''){
          conditions.push({field:'title',op:'LIKE',value: search_keywords} );
      }

      if(search_column_id != ''){
          conditions.push({field:'column_id',op:'=',value: search_column_id} );
      }
      
      pager.current = 1;
      this.setState({
          pagination:pager,
          loading:true
      })
      this.setState({
          search_column_id: search_column_id,
          conditions:conditions,
          selectedRows:[],
      });
      this.props.api.getArticle(
        1,
        this.props.city,
        conditions
      );
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
          this.props.api.getArticle(curPage,this.props.city,this.state.conditions);      
        else  
          this.props.api.getArticle(curPage,this.props.city);      
    }

    onRowChange(selectedRows) {
      console.log(this.state.selectedRows);
      this.setState({
        selectedRows:selectedRows
      })
    }

    editArticle(){
      const articleId = this.state.selectedRows[0];
      window.location.replace('/edit?id='+articleId);
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
                <Breadcrumb.Item>所有栏目</Breadcrumb.Item>
                <Breadcrumb.Item>文章列表</Breadcrumb.Item>
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
                <Button type="ghost" disabled={!ableToEdit} onClick={this.editArticle.bind(this)}>修改</Button>                       
                <span className="ant-divider"></span>
                <Button type="ghost" onClick={this.RowDelete.bind(this)}>删除</Button>
                  <Cascader options={options} expandTrigger="hover" 
                    onChange={this.columnChange.bind(this)} style={{marginTop:10,width:300}}
                  />                
              </div>
              <div style={{marginTop:10,width:300}}>

                  <Input type="text" ref='searchBox' onChange={this.handleInputChange.bind(this)} />
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
Article.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};
const mapStateToProps = (state) => {
    const {article,column} = state;
    return {
        Article:article,
        Column:column
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getArticle,recycleArticle,getAllColumn}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Article);