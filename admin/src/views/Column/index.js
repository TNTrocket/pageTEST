import React from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Cascader, Popover,Button,message} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getAllColumn,getColumnId,updateColumn} from '../../actions/column';
import {getAllBanner} from '../../actions/banner';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class Column extends React.Component {
    constructor (props,context) {
        super(props,context)
    }

    componentWillMount () {
      this.props.api.getAllColumn();
      this.props.api.getAllBanner(this.props.city);
      this.setState({
        columnId:'',
        parentId:0,
        update:false
      })
      this.props.form.resetFields(); 
    }

    componentWillReceiveProps(nextProps){
      const {Column} = nextProps;
      console.log('Column', Column);
      this.setState({
        bannerId: Column.form.bannerId,
        parentId: Column.form.parentId
      });

      if(Column.code=='columnUpdateOkay'&&this.state.update){
        this.props.api.getAllColumn();        
        this.props.form.resetFields();
        const columnId = this.state.columnId;

        this.props.api.getColumnId(columnId);

        message.success(Column.message);
        this.setState({
          update:false
        })
      }      
    }

    callback() {
    }

    handleSubmit(e) {
      e.preventDefault();
      const columnId = this.state.columnId;
      if(columnId==0){
        message.error("请选择栏目");
        return;
      }
      const obj = this.props.form.getFieldsValue();
      console.log('edit column:', obj);
      
      if(obj.parentId==undefined)
        obj.parentId = 0;
      if(!belongToSelf(obj.parentId,columnId,this.props.Column.column)){
        message.error("上级栏目不能为自己的子栏目或自己");
      }
      else if(!obj.name) {
        message.error("请输入栏目名字");
      }
      else if(!obj.route) {
        message.error("请输入栏目路由");
      }
      else if(!checkRoute(obj.route)){
        message.error("栏目路由只能输入字母和数字");
      }
      else{
        if(isNaN(obj.parentId)){
          obj.parentId = this.state.parentId;
        }
        if(isNaN(obj.bannerId)){
          obj.bannerId = this.state.bannerId;
        }

        this.props.api.updateColumn(columnId, obj);
        this.setState({
          update:true
        })        
      }

    }

    columnChange(value){
      this.setState({
        columnId:value,
      });
      console.log(value);
      this.props.form.resetFields();      
      this.props.api.getColumnId(value);
    }

    parentColumnChange(value){
      console.log('parentColumnChange', value);
      this.setState({
        parentId:value,
      });
    }

    render () {
        const { getFieldProps } = this.props.form;
        const formItemLayout = {
          labelCol: { span: 4 },
          wrapperCol: { span: 20 },
        };
        const options = this.props.Column.column;
        const selectOptions = selectOptionList(options);
        const selectOptionsView = [];
        const columnOptionsView = [];
        selectOptionsView.push(<Option key="0">最顶级</Option>)
        selectOptions.map((item)=>{
          selectOptionsView.push(<Option key={item.key}>{item.title}</Option>)
          columnOptionsView.push(<Option key={item.key}>{item.title}</Option>)          
        })
        const formData = this.props.Column.form;

        const nameProps = getFieldProps('name', {
          rules: [
            { required: true, whitespace: false, message: '请输入栏目名字' },
          ],
          initialValue: formData.name
        });

        const routeProps = getFieldProps('route', {
          rules: [
            { required: true, whitespace: false, message: '请输入栏目路由' },
          ],
          initialValue: formData.route
        });

        const bannerOptions = this.props.Banner.data;
        const bannerSelectOptionsView = [];
        bannerOptions.map((item)=>{
          bannerSelectOptionsView.push(<Option key={item.key}>{item.name}</Option>);   
        });
        
        return (
            <div>
              <Breadcrumb separator=">>" >
                <Breadcrumb.Item>网站栏目管理</Breadcrumb.Item>
                <Breadcrumb.Item>修改栏目</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span="1">
              </Col>
              <Col span="10">
              <Form horizontal onSubmit={this.handleSubmit.bind(this)} >
                <FormItem>
                  <label>请选择一个要修改的栏目：</label>
                  <Select
                    onChange={this.columnChange.bind(this)}
                    value = {this.state.columnId}
                  >
                  {columnOptionsView}                  
                  </Select>           
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="上级栏目"
                >
                  <Select
                    onChange={this.parentColumnChange.bind(this)}
                    {...getFieldProps('parentId', { initialValue: columnValue(formData.parentId,selectOptions)})}
                  >
                  {selectOptionsView}
                  </Select>               
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="栏目名字"
                  required
                >
                  <Input type="text" {...nameProps} placeholder="请输入栏目名字" />
                </FormItem> 
                <FormItem
                  {...formItemLayout}
                  label="栏目路由"
                  required
                >
                  <Input type="text" {...routeProps} placeholder="请输入栏目路由" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="关联Banner"                  
                >
                <Select showSearch
                  placeholder="请选择一个要关联的Banner"
                  optionFilterProp="children"
                  notFoundContent="无法找到"
                  {...getFieldProps('bannerId', { initialValue: bannerValue(formData.bannerId,bannerOptions) })}/*bannerValue(formData.bannerId,bannerOptions)*/
                >
                  {bannerSelectOptionsView}
                </Select>                
                </FormItem>     
                <FormItem
                  {...formItemLayout}
                  label="SEO标题"
                >
                  <Input type="text" {...getFieldProps('seoTitle', { initialValue: formData.seoTitle })} placeholder="请输入标题" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="关键字"
                >
                  <Input type="text" {...getFieldProps('keywords', { initialValue: formData.keywords })} placeholder="请输入关键字" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="栏目描述"
                >
                  <Input type="textarea" placeholder="随便写" {...getFieldProps('description', { initialValue: formData.description })} />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="栏目状态"
                >
                  <Checkbox {...getFieldProps('status', { initialValue: formData.status || false, valuePropName: 'checked'})}>有效</Checkbox>
                </FormItem>
                <FormItem>
                  <Input type="hidden" {...getFieldProps('city', { initialValue: this.props.city })} />                
                </FormItem>
                <FormItem wrapperCol={{ span: 16, offset: 8 }} style={{ marginTop: 24 }}>
                  <Button type="primary" htmlType="submit">确定</Button>
                </FormItem>
              </Form>               
              </Col>              
              </Row>             
            </div>
        )
    }
}

const selectOptionList=(options)=>{
  let children = [];
  let title = '';
  walkObject(options,title,children)
  return children;
}

const walkObject = (tar,title,arr)=>{
  tar.map((item)=>{
    let tempTitle = title+item.label+'/';
    arr.push({key:item.id,title:tempTitle});
    if(item.children.length>0){
      walkObject(item.children,tempTitle,arr);
    }
  })
}

const columnValue = (id,options)=>{
  for(let i=0;i<options.length;i++){
    if(options[i].key==id)
      return options[i].title;
  }
}

const bannerValue = (id,options)=>{  
  for(let i=0;i<options.length;i++){    
    if(options[i].key==id)
      return options[i].name;
  }
}

const belongToSelf =(updateColumnId,originalColumnId,options)=>{
  if(updateColumnId==0){
    return true;
  }else if(updateColumnId==originalColumnId){
    return false;
  }else{
    let childrenArr = [];
    getChildrenIdArr(originalColumnId,options,childrenArr);
    for(let i=0;i<childrenArr.length;i++){
      if(updateColumnId==childrenArr[i])
        return false
    }
    return true

  }
}

const belongWalk = (id,tar,obj)=>{
  tar.map((item)=>{
    if(item.id==id){
      obj.children = item.children;
      return true;
    }
    if(item.children.length>0){
      belongWalk(id,item.children,obj)
    }
  })
}

const childrenWalk = (tar,arr)=>{
  tar.map((item)=>{
    arr.push(item.id);
    if(item.children.length>0){
      childrenWalk(item.children,arr)
    }
  })
}

const getChildrenIdArr = (id,options,arr)=>{
  let obj = {};
  belongWalk(id,options,obj);
  childrenWalk(obj.children,arr)
}

const checkRoute = (route) =>{
  var re =  /^[0-9a-zA-Z]*$/g;
  if (!re.test(route)) return false;
  
  return true;
}

Column = Form.create()(Column);
const mapStateToProps = (state) => {
    const {column, banner} = state;
    return {
        Column:column,
        Banner: banner
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getAllColumn,getColumnId,updateColumn,getAllBanner}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Column);