import React, {PropTypes} from 'react'
import { Row, Col, Collapse, Menu,Table, Icon ,Cascader, Popover,Button,message} from 'antd';
import {Breadcrumb,Form,Radio,Input,Upload,Checkbox,Select,Switch} from 'antd';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {getCityDetail,newCity,updateCity, initial} from '../../actions/city';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const Option = Select.Option;

class CityEdit extends React.Component {
    constructor (props,context) {
        super(props,context)
    }
    componentWillMount () {
      this.props.form.resetFields();      
      let CityId = this.props.location.query.id;
      if(CityId==undefined){
        this.setState({
          action:'new',
          request:false
        })
        this.props.api.initial();
      }else{
        this.setState({
          action:'update',
          request:false
        })
        this.props.api.getCityDetail(CityId);
      }
    }
    componentWillReceiveProps(nextProps){
      const {CityEdit} = nextProps;
      if(CityEdit.code=='cityUpdatedOkay'&&this.state.request){
        message.success(CityEdit.message);
        this.setState({
          request:false
        });
        this.context.router.push('/city');
      }  

      if(CityEdit.code=='cityAddedOkay'&&this.state.request){
        message.success(CityEdit.message);
        this.setState({
          request:false
        });
        this.props.form.resetFields();
      }       
    }

    callback() {
    }

    nameExists(rule, value, callback) {
      //console.log('this.props.city', this.props.city);
      if (!value) {
        callback();
      } else {
        /*setTimeout(() => {
          if (value === 'aaa') {
            callback([new Error('城市不能重复开通。')]);
          } else {
            callback();
          }
        }, 800);*/
        callback();
      }
    }

    pinyinExists(rule, value, callback) {
      if (!value) {
        callback();
      } else {
        callback();
      }
    }

    handleSubmit(e) {
      e.preventDefault();
      this.props.form.validateFields((errors, values) => {
        if (!!errors) {
          console.log('Errors in form!!!');
          return;
        }
        const obj = this.props.form.getFieldsValue();
        
        if(this.state.action=='new'){
          this.props.api.newCity(obj);          
        }else{
          this.props.api.updateCity(obj,this.props.location.query.id);
        }
        this.setState({
          request:true
        })
      });

      /*const obj = this.props.form.getFieldsValue();
      if(this.state.action=='new'){
        //this.props.api.newCity(obj);
        this.props.form.resetFields();
      }else{
        this.props.api.updateCity(obj,this.props.location.query.id);
      }
      this.setState({
        request:true
      })*/
    }

    render () {
        const formData = this.props.CityEdit.form;

        const { getFieldProps } = this.props.form;

        const nameProps = getFieldProps('name', {
          rules: [
            { required: true, message: '城市名称不能为空' },
            { validator: this.nameExists },
          ],
          initialValue: formData.name
        });

        const pinyinProps = getFieldProps('pinyin', {
          rules: [
            { required: true, message: '城市拼音不能为空' },
            { validator: this.pinyinExists },
          ],
          initialValue: formData.pinyin
        });

        const openedProps = getFieldProps('opened', {
          rules: [
            { required: true, whitespace: false, message: '请选择是否开通' },
          ],
          initialValue: formData.opened
        });
        const valueSwitch = formData && formData.opened == 1 ? 'checked' : '';
        //const valueSwitch = '';
        console.log(formData, valueSwitch);

        const formItemLayout = {
          labelCol: { span: 4 },
          wrapperCol: { span: 20 },
        };
        
        //const ableToUpload = this.state.fileList.length == 0

        return (
            <div>
              <Breadcrumb separator=">>" >
                <Breadcrumb.Item>城市管理</Breadcrumb.Item>
                <Breadcrumb.Item>新增城市 or 修改城市</Breadcrumb.Item>
              </Breadcrumb>
              <Row style={{marginTop:20}}>
              <Col span="1">
              </Col>
              <Col span="6">
              <Form horizontal onSubmit={this.handleSubmit.bind(this)} >
                <FormItem
                  {...formItemLayout}
                  label="城市名称"
                  hasFeedback
                >
                  <Input type="text" { ...nameProps } placeholder="请输入城市名称" />
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="城市拼音"
                  hasFeedback
                >
                  <Input type="text" { ...pinyinProps } placeholder="请输入城市拼音" />
                </FormItem>
                <FormItem
                  label="开通"
                  {...formItemLayout}
                >
                  
                   <Select 
                  style={{ width: 200 }}
                  placeholder="请选择位置"
                  optionFilterProp="children"
                  notFoundContent="无法找到"
                  {...openedProps}
                >
                  <Option value="1">开通</Option>
                  <Option value="0">待开通</Option>
                </Select>
                  
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

CityEdit.contextTypes = {
  store: PropTypes.object.isRequired,
  router: React.PropTypes.object.isRequired,
};

CityEdit = Form.create()(CityEdit);
const mapStateToProps = (state) => {
    const {city} = state;
    return {
        CityEdit:city,
    };
};

function mapDispatchToProps(dispatch) {
    return {api: bindActionCreators({getCityDetail,newCity,updateCity,initial}, dispatch)};
}

export default connect(mapStateToProps, mapDispatchToProps)(CityEdit);