import React, {PropTypes} from 'react'
import { Row, Col, Collapse, Cascader,Table, Icon ,Pagination, Popover,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select, Upload, DatePicker, message} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getAllColumn} from '../../actions/column';
import {getArticleContent,updateArticle} from '../../actions/article';

const moment = require('moment');

const FormItem = Form.Item;
const Option = Select.Option;

import Ueditor from './ueditor';

class Edit extends React.Component {
    constructor (props,context) {
        super(props,context)
    }
    componentWillMount () {
      let articleId = this.props.location.query.id;

      this.props.api.getAllColumn();
      this.props.api.getArticleContent(articleId);
      this.setState({
        columnId:0,
        fileList:[],
        create:false
      });      
    }

    componentWillReceiveProps(nextProps){
      const {Article} = nextProps;
      
      this.setState({
        columnId: Article.form.columnId
      }); 
      if(Article.code=='articleUpdatedOkay'&&this.state.create){
        message.success(Article.message);
        this.setState({
          create:false
        });
      } 
    }

    callback() {
    }

    handleChange() {
    }

    handleChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功。`);
        this.setState({fileList:info.fileList});
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败。`);
      }
    }

    handleSubmit(e) {
      e.preventDefault();
      this.props.form.validateFields((errors, values) => {
        let content = UE.getEditor("content").getContent();
        const obj = this.props.form.getFieldsValue();
        obj.content = content;
        
        if(isNaN(obj.columnId)){
          obj.columnId = this.state.columnId;
        }
        //obj.columnId = obj.columnArr[obj.columnArr.length-1];
        obj.articleId = this.props.location.query.id;
        obj.publish_at = moment(obj.publish_at).format('YYYY-MM-DD HH:mm:ss');
        if(this.state.fileList.length > 0){
          obj.image = this.state.fileList[0].response.file.name
        }
        else if(this.props.Article.form.image){
          obj.image = this.props.Article.form.image;
        }
        else{
          obj.image = '';
        }
        
        this.props.api.updateArticle(obj);
        this.setState({
          create:true
        });
        this.context.router.push('/article');
      });
    }    

    columnChange(value){
      console.log(value)
      this.setState({
        //columnId:value[value.length-1],
        columnId:value,
      });
    }

    render () {
        const { getFieldProps } = this.props.form;
        const formItemLayout = {
          labelCol: { span: 2 },
          wrapperCol: { span: 12},
        };      
        const options = this.props.Column.column;
        const formData = this.props.Article.form;

        const selectOptions = selectOptionList(options);
        const selectOptionsView = [];
        selectOptions.map((item)=>{
          selectOptionsView.push(<Option key={item.key}>{item.title}</Option>)    
        });

        const articleColumnProps = getFieldProps('columnId', {
          rules: [
            { required: true, whitespace: false, message: '请选择一个栏目' },
          ],
          initialValue: columnValue(formData.columnId,selectOptions)
        }); 

        const titleProps = getFieldProps('title', {
          rules: [
            { required: true, whitespace: false, message: '请输入文章标题' },
          ],
          initialValue: formData.title
        });  

        const propsUpload = {
          name: 'file',
          action: '/file/upload',
          listType: 'picture',
          defaultFileList: this.state.fileList,
          onChange: this.handleChange.bind(this),
        };
        const ableToUpload = this.state.fileList && this.state.fileList.length == 0;

        return (

            <div>
              <Breadcrumb separator=">>">
                <Breadcrumb.Item>文章列表</Breadcrumb.Item>
                <Breadcrumb.Item>发布文章 or 修改文章</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>

              <Form horizontal onSubmit={this.handleSubmit.bind(this)}>
                <FormItem
                  {...formItemLayout}
                  label="文章标题"
                  required
                >
                  <Input type="text" {...titleProps} placeholder="请输入标题" />
                </FormItem>
                
                <FormItem
                  {...formItemLayout}
                  label="栏目选项"
                >
                  <Select
                    showSearch
                    placeholder="请选择文章所属栏目"
                    optionFilterProp="children"
                    notFoundContent="无法找到"
                    {...articleColumnProps}
                  >
                  {selectOptionsView}
                  </Select>
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="缩略图"   
                >
                <Upload {...propsUpload} disabled={!ableToUpload}>
                  <Button type="ghost">
                    <Icon type="upload" /> 点击上传
                  </Button>
                </Upload>  
                </FormItem>

                {(formData.image) ? (
                    <FormItem
                      {...formItemLayout}
                      label="原缩略图"
                    >
                      <img src={formData.image} style={{maxWidth:300, maxHeight:100}} />
                    </FormItem>
                ) : ''}

                <FormItem
                  {...formItemLayout}
                  label="简短描述"
                >
                  <Input type="textarea" {...getFieldProps('information', { initialValue: formData.information })} rows="3" placeholder="请输入文章的简短介绍" />
                </FormItem>

                <FormItem
                  {...formItemLayout}
                  label="文章内容"
                >
                <Ueditor id='content' height={400} value={formData.content} />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="Tag标签"
                >
                  <Input type="text" {...getFieldProps('tags', { initialValue: formData.tag })} placeholder="请输入标签" />
                </FormItem>            
                <FormItem
                  {...formItemLayout}
                  label="SEO关键字"
                >
                  <Input type="text" {...getFieldProps('keywords', { initialValue: formData.keywords })} placeholder="请输入关键字" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="SEO描述"
                >
                  <Input type="textarea" {...getFieldProps('description', { initialValue: formData.description })} rows="3" placeholder="请输入文章的SEO描述" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="发布时间"
                >
                  <DatePicker showTime {...getFieldProps('publish_at', { initialValue: formData.publish_at })} format="yyyy-MM-dd HH:mm:ss" placeholder="请选择时间" />
                </FormItem>

                <FormItem wrapperCol={{ span: 16, offset: 4 }} style={{ marginTop: 24 }}>
                  <Button type="primary" htmlType="submit">确定</Button>
                </FormItem>
              </Form>
              </Row>          
            </div>
        )
    }
}
/*
<FormItem
                  {...formItemLayout}
                  label="栏目选项"
                  required
                >
                  <Cascader options={options} expandTrigger="hover" {...getFieldProps('columnArr',{ initialValue: formData.columnArr })}
                  />                  
                </FormItem>
*/

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
  console.log('columnValue');
  for(let i=0;i<options.length;i++){
    if(options[i].key==id){
      return options[i].title;
    }
  }
}

Edit.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};

Edit = Form.create()(Edit);

const mapStateToProps = (state) => {
    const {column,article} = state;
    return {
        Column:column,
        Article:article
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getAllColumn,getArticleContent,updateArticle}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Edit);