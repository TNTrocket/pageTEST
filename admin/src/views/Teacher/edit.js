import React, {PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Cascader, Popover,Button,message} from 'antd';
import {Breadcrumb,Form,Radio,Input,Upload,Checkbox,Select} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getTeacherDetail,newTeacher,updateTeacher,initial} from '../../actions/teacher';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class TeacherEdit extends React.Component {
    constructor (props,context) {
        super(props,context)
    }
    componentWillMount () {
      this.props.form.resetFields();      
      let teacherId = this.props.location.query.id;
      if(teacherId==undefined){
        this.setState({
          action:'new',
          fileList:[],
          request:false
        })
        this.props.api.initial();
      }else{
        this.setState({
          action:'update',
          fileList:[],
          request:false
        })
        this.props.api.getTeacherDetail(teacherId);
      }
    }
    componentWillReceiveProps(nextProps){
      const {TeacherEdit} = nextProps;
      if(TeacherEdit.code=='teacherUpdatedOkay'&&this.state.request){
        message.success(TeacherEdit.message);
        this.setState({
          request:false
        });
        this.context.router.push('/teacher');
      }  

      if(TeacherEdit.code=='teacherAddedOkay'&&this.state.request){
        message.success(TeacherEdit.message);
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

      if(this.state.fileList == 0 &&  this.state.action=='new'){
          message.error('请上传一张老师图片。');
          return;
      }

      const obj = this.props.form.getFieldsValue();
      console.log('teacher data', obj);
      if(this.state.action=='new'){
        obj.avatar = this.state.fileList[0].response.file.name;
        this.props.api.newTeacher(obj);
      }else{
        obj.avatar = this.state.fileList.length > 0 ? this.state.fileList[0].response.file.name : this.props.TeacherEdit.form.avatar;
        this.props.api.updateTeacher(obj,this.props.location.query.id);
      }
      this.setState({
        request:true
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
        const formData = this.props.TeacherEdit.form;

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
                <Breadcrumb.Item>名师团队</Breadcrumb.Item>
                <Breadcrumb.Item>老师管理</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span="1">
              </Col>
              <Col span="6">
              <Form horizontal onSubmit={this.handleSubmit.bind(this)} >
                <FormItem
                  {...formItemLayout}
                  label="姓名"
                >
                  <Input type="text" {...getFieldProps('nick_name', { initialValue: formData.nick_name })} placeholder="请输入姓名" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="教龄"
                >
                  <Input type="number" {...getFieldProps('teaching', { initialValue: formData.teaching })} placeholder="请输入教龄" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="学生数"
                >
                  <Input type="number" {...getFieldProps('students', { initialValue: formData.students })} placeholder="学生数" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="学科"
                >
                  <Input type="text" {...getFieldProps('xueke', { initialValue: formData.xueke })} placeholder="教导学科" />
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
                <FormItem
                  {...formItemLayout}
                  label="简短介绍"
                >
                  <Input type="text" {...getFieldProps('title', { initialValue: formData.title })} placeholder="简短介绍" />
                </FormItem>               
                <FormItem
                  {...formItemLayout}
                  label="详细介绍"
                >
                  <Input type="textarea" placeholder="随便写" {...getFieldProps('description', { initialValue: formData.description })} />
                </FormItem>
                <FormItem>
                  <Input type="hidden" {...getFieldProps('city_id', { initialValue: this.props.city })} />                
                </FormItem>
                <FormItem wrapperCol={{ span: 16, offset: 8 }} style={{ marginTop: 24 }}>
                  <Button type="ghost" htmlType="submit">确定</Button>
                </FormItem>
              </Form>               
              </Col>              
              </Row>             
            </div>
        )
    }
}

TeacherEdit.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};

TeacherEdit = Form.create()(TeacherEdit);
const mapStateToProps = (state) => {
    const {teacher} = state;
    return {
        TeacherEdit:teacher,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getTeacherDetail,newTeacher,updateTeacher,initial}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(TeacherEdit);