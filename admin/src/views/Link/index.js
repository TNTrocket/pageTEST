import React from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Pagination, Popover,Button,Timeline} from 'antd';
import {Breadcrumb,Form,Radio,Input,Tooltip,Checkbox,Select,message,Card} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {postNewLink,getAllLink,removeLink} from '../../actions/link';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class Link extends React.Component {
    constructor (props,context) {
        super(props,context)

    }

    componentWillMount () {
      this.setState({
        post:false,
        delete:false
      })
      this.props.api.getAllLink();
    }

    componentWillReceiveProps(nextProps){
      const {link} = nextProps;
      if(link.code=='linkAddedOkay'&&this.state.post){
        message.success(link.message);
        this.setState({
          post:false
        })        
        this.handleReset(this)
        this.props.api.getAllLink();
      }
      if(link.code=='linkRemoveOkay'&&this.state.delete){
        message.success(link.message);
        this.setState({
          delete:false
        })        
        this.props.api.getAllLink();
      }      
    }
    callback() {

    }

    handleReset(e) {
      this.props.form.resetFields();
    }

    handleSubmit(e) {
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((errors, values) => {
        if (!!errors) {
          return;
        }
        this.props.api.postNewLink(this.props.form.getFieldsValue());
        this.setState({
          post:true
        })
      });
    }

    deleteLink(key){
        this.props.api.removeLink(key);
        this.setState({
          delete:true
        })        
    }

    render () {
        const { getFieldProps } = this.props.form;
        const positionProps = getFieldProps('position', {
          rules: [
            { required: true, whitespace: false, message: '请选择位置' },
          ],
        });        
        const nameProps = getFieldProps('name', {
          rules: [
            { required: true, whitespace: false, message: '请填写网站名称' },
          ],
        });
        const urlProps = getFieldProps('url', {
          rules: [
            { required: true, whitespace: false, message: '请填写URL' },
          ],
        });                          
        const formItemLayout = {
          labelCol:{ span: 4 },
          wrapperCol:{ span: 20 },
        };      
        const allLinks = this.props.link.data;
        const linkContent = allLinks.map((item)=>{
          let key = 'link-'+item.key;
          let button = (
            <div>
              <Button type="ghost" onClick={this.deleteLink.bind(this,item.key)}>删除</Button>
            </div>            
            )
          return (
            <Card key={key} title={item.name} extra={button} 
            style={{marginBottom:20}}>
              <p>{item.url}</p>
              <p>{item.contact}</p>
            </Card>
          )
        })
        return (
            <div>
              <Breadcrumb separator=">>" >
                <Breadcrumb.Item>友情链接</Breadcrumb.Item>
                <Breadcrumb.Item>添加友情链接</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span="1">
              </Col>
              <Col span="6">
              <Form horizontal onSubmit={this.handleSubmit.bind(this)}>
                <FormItem
                  {...formItemLayout}
                  label="添加位置"
                  required             
                >
                <Select showSearch
                  style={{ width: 200 }}
                  placeholder="请选择位置"
                  optionFilterProp="children"
                  notFoundContent="无法找到"
                  {...positionProps}
                >
                  <Option value="homepage">首页</Option>
                  <Option value="footer">底部</Option>
                </Select>                
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="网站名称"
                  required
                >
                  <Input type="text" {...nameProps} placeholder="请输入标题" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="网站网址"
                  required
                >
                  <Input type="text" {...urlProps} placeholder="请输入关键字" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="联系方式"
                >
                  <Input type="contact" placeholder="随便写" {...getFieldProps('contact', { initialValue: '' })} />
                </FormItem>
                <FormItem wrapperCol={{ span: 16, offset: 4 }} style={{ marginTop: 24 }}>
                  <Button type="ghost" htmlType="submit">确定</Button>
                </FormItem>
              </Form>
              </Col>
              <Col span='1'>
              </Col>
              <Col span='15'>
              {linkContent}
              </Col>     
              <Col span='1'>
              </Col>
              </Row>            
            </div>
        )
    }
}
Link = Form.create()(Link);

const mapStateToProps = (state) => {
    const {link} = state;
    return {
        link:link,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({postNewLink,getAllLink,removeLink}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(Link);