import React, {PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Cascader, Popover,Button,message} from 'antd';
import {Breadcrumb,Form,Radio,Input,Upload,Checkbox,Select} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getBannerDetail,newBanner,updateBanner,initial} from '../../actions/banner';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class BannerEdit extends React.Component {
    constructor (props,context) {
        super(props,context)
    }
    componentWillMount () {
      this.props.form.resetFields();      
      let BannerId = this.props.location.query.id;
      if(BannerId==undefined){
        this.setState({
          action:'new',
          request:false,
          fileList:[],
        })
        this.props.api.initial();
      }else{
        this.setState({
          action:'update',
          request:false,
          fileList:[]
        })
        this.props.api.getBannerDetail(BannerId);
      }
    }
    componentWillReceiveProps(nextProps){
      const {BannerEdit} = nextProps;
      if(BannerEdit.code=='bannerUpdatedOkay'&&this.state.request){
        message.success(BannerEdit.message);
        this.setState({
          request:false
        });
        this.context.router.push('/banner');
      }  

      if(BannerEdit.code=='bannerAddedOkay'&&this.state.request){
        message.success(BannerEdit.message);
        this.setState({
          request:false
        });
        this.props.form.resetFields();
        this.setState({fileList: []});
      }       
    }

    callback() {
    }

    handleSubmit(e) {
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((errors, values) => {
        if (!!errors) {
          return;
        }
        else if(this.state.fileList == 0 &&  this.state.action=='new'){
          message.error('请上传一张Banner图片。');
          return;
        }
        const obj = this.props.form.getFieldsValue();        
        if(this.state.action=='new'){
          obj.image = this.state.fileList[0].response.file.name;
          this.props.api.newBanner(obj);
        }else{
          obj.image = this.state.fileList.length > 0 ? this.state.fileList[0].response.file.name : this.props.BannerEdit.form.image;
          this.props.api.updateBanner(obj,this.props.location.query.id);
        }

        this.setState({
          request:true
        })
      });
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
    

    render () {
        const { getFieldProps } = this.props.form;

        const formItemLayout = {
          labelCol: { span: 4 },
          wrapperCol: { span: 20 },
        };
        const formData = this.props.BannerEdit.form;

        const positionProps = getFieldProps('position', {
          rules: [
            { required: true, whitespace: false, message: '请选择位置' },
          ],
          initialValue: formData.position
        });
        const nameProps = getFieldProps('name', {
          rules: [
            { required: true, whitespace: false, message: '请为Banner定义一个名称' },
          ],
          initialValue: formData.name
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
              <Breadcrumb separator=">>" >
                <Breadcrumb.Item>BANNER广告管理</Breadcrumb.Item>
                <Breadcrumb.Item>BANNER上传</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span="1">
              </Col>
              <Col span="6">
              <Form horizontal onSubmit={this.handleSubmit.bind(this)} >
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
                  <Option value="waphome">手机版首页</Option>
                  <Option value="wappage">手机版内页</Option>
                  <Option value="webhome">电脑版首页</Option>
                  <Option value="webpage">电脑版内页</Option>
                </Select>                
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="名称"
                  required
                >
                  <Input type="text" {...nameProps} placeholder="请输入名称" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="ALT属性"
                >
                  <Input type="text" {...getFieldProps('alt', { initialValue: formData.alt })} placeholder="请输入Alt属性" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="URL"
                >
                  <Input type="url" {...getFieldProps('url', { initialValue: formData.url })} placeholder="请输入 URL" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="Banner图"   
                >
                <Upload {...propsUpload} disabled={!ableToUpload}>
                  <Button type="ghost">
                    <Icon type="upload" /> 点击上传
                  </Button>
                </Upload>  
                </FormItem>
                {(this.state.action!='new') ? (
                    <FormItem
                      {...formItemLayout}
                      label="原Banner"
                    >
                      <img src={formData.image} style={{maxWidth:300, maxHeight:100}} />
                    </FormItem>
                ) : ''}
                

                <FormItem>
                  <Input type="hidden" {...getFieldProps('city_id', { initialValue: this.props.city })} />                
                </FormItem>
                <FormItem wrapperCol={{ span: 16, offset: 8 }} style={{ marginTop: 24 }}>
                  <Button type="ghost" htmlType="submit">保存</Button>
                </FormItem>
              </Form>               
              </Col>              
              </Row>             
            </div>
        )
    }
}

BannerEdit.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};

BannerEdit = Form.create()(BannerEdit);
const mapStateToProps = (state) => {
    const {banner} = state;
    return {
        BannerEdit:banner,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getBannerDetail,newBanner,updateBanner,initial}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(BannerEdit);