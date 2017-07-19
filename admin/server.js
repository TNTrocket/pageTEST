require('babel-register');
const webpack = require('webpack');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./webpack.config');
const adminConfig = require('./admin.config');
const isProduction = process.env.NODE_ENV === 'production';
const isDeveloping = !isProduction;
const app = express();
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const model = require('./server_src/model');
const ueditor = require("ueditor");
const multer  = require('multer');
app.use(cookieParser());
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'upload/')
    }, 
    filename: function (req, file, cb) {
      let fileFormat = (file.originalname).split(".");
      cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
 });  
const upload = multer({storage:storage});
let upload_number = -1;

// Webpack developer
if (isDeveloping) {
  const compiler = webpack(config);
  app.use(require('webpack-dev-middleware')(compiler, {
    publicPath: config.output.publicPath,
    noInfo: true
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}
//  RESTful API
const publicPath = path.resolve(__dirname);
app.use(bodyParser.json({ type: 'application/json' }));
app.use(express.static(publicPath));
const port = isProduction ? (process.env.PORT || 80) : 3000;
app.use("/ueditor/ue", ueditor(path.join(__dirname, ''), function(req, res, next) {

  // ueditor 客户发起上传图片请求
  const img_url = '/upload';
  if(req.query.action === 'uploadimage'){

    // 这里你可以获得上传图片的信息
    let foo = req.ueditor;
    // 下面填写你要把图片保存到的路径 （ 以 path.join(__dirname, 'public') 作为根路径）
    res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
  }
  //  客户端发起图片列表请求
  else if (req.query.action === 'listimage'){
    var dir_url = 'your img_dir'; // 要展示给客户端的文件夹路径
    res.ue_list(dir_url) // 客户端会列出 dir_url 目录下的所有图片
  }
  // 客户端发起其它请求
  else {

    res.setHeader('Content-Type', 'application/json');
    // 这里填写 ueditor.config.json 这个文件的路径
    res.redirect('/ueditor/php/config.json')
}}));

// this is necessary to handle URL correctly since client uses Browser History
app.get('*', function (req, res){
  res.sendFile(path.resolve(__dirname, '', 'index.html'))
});

app.put('/api/login', function(req, res) {
  const credentials = req.body;
  const defaultCity = adminConfig.defaultCity;
  const adminAccount = adminConfig.adminAccount;
  let loginAdmin = null;
  console.log(credentials);

  for(let i = 0; i < adminAccount.length; i++){
    let item = adminAccount[i];
    if(credentials.user === item.user && credentials.password === item.password){
        loginAdmin = item;
        break;
    }
  }

  if(loginAdmin){
    //res.cookie('uid', '1', {domain:'127.0.0.1'});
    res.cookie('uid', loginAdmin.id, {path: '/'});
    res.cookie('city', defaultCity.id, { path: '/' });
    res.cookie('cityName',defaultCity.name, { path: '/' });
    res.json({'user': loginAdmin.user, 'role': loginAdmin.role, 'uid': loginAdmin.id});
  }else{
    res.status('500').send({'message' : 'Invalid user/password'});
  }
});
app.post('/api/logout', function(req, res) {
  res.clearCookie('uid');
  res.json({'user': 'admin', 'role': 'ADMIN'});
});

app.post('/api/my', function(req, res) {
  const adminAccount = adminConfig.adminAccount;
  let user_id = req.cookies.uid;
  let loginAdmin = {'user':'admin','role': 'ADMIN','id': 1};

  for(let i = 0; i < adminAccount.length; i++){
    let item = adminAccount[i];
    if(user_id === item.id){
        loginAdmin = item;
        break;
    }
  }
  res.json({'user': loginAdmin.user, 'role': loginAdmin.role, 'uid': loginAdmin.id});
});

app.post('/api/article/new', function(req, res) {
  model.newArticle(req,res);
});
app.post('/api/article/recycle', function(req, res) {
  model.recycleArticle(req,res);
});
app.post('/api/article/delete', function(req, res) {
  model.deleteArticle(req,res);
});
app.post('/api/article/recover', function(req, res) {
  model.recoverArticle(req,res);
});
app.post('/api/article/detail/:id', function(req, res) {
  model.detailArticle(req,res,req.params.id);
});
app.post('/api/article/update', function(req, res) {
  model.updateArticle(req,res);
});
app.post('/api/article/:city_id/:page', function(req, res) {
  let page = req.params.page-1;
  let city_id = req.params.city_id;
  model.articleList(req,res,city_id,page);
});
app.post('/api/recycle_article/:city_id/:page', function(req, res) {
  let page = req.params.page-1;
  let city_id = req.params.city_id;
  model.recycleArticleList(req,res,city_id,page);
});
app.post('/api/teacher/detail/:id', function(req, res) {
  model.detailTeacher(req,res,req.params.id);
});

app.post('/api/teacher/recycle', function(req, res) {
  model.recycleTeacher(req,res);
});
app.post('/api/teacher/new', function(req, res) {
  model.newTeacher(req,res);
});
app.post('/api/teacher/update/:id', function(req, res) {
  model.updateTeacher(req,res,req.params.id);
});
app.post('/api/teacher/:city_id/:page', function(req, res) {
  let page = req.params.page-1;
  let city_id = req.params.city_id;
  model.teacherList(req,res,city_id,page);
});

//全部有效的Banner
app.post('/api/banner/list/:city_id/all', function(req, res) {
  model.allBannerList(req,res);
});
app.post('/api/banner/new', function(req, res) {
  model.newBanner(req,res);
});
app.post('/api/banner/recycle', function(req, res) {
  model.recycleBanner(req,res);
});
app.post('/api/banner/detail/:id', function(req, res) {
  model.detailBanner(req,res,req.params.id);
});
app.post('/api/banner/update/:id', function(req, res) {
  model.updateBanner(req,res,req.params.id);
});
app.post('/api/banner/:city_id/:page', function(req, res) {
  let page = req.params.page-1;
  let city_id = req.params.city_id;
  model.bannerList(req,res,city_id,page);
});

app.post('/api/city/list', function(req, res) {
  model.cityList(req,res);
});
app.post('/api/city/new', function(req, res) {
  model.newCity(req,res);
});
app.post('/api/city/recycle', function(req, res) {
  model.recycleCity(req,res);
});
app.post('/api/city/detail/:id', function(req, res) {
  model.detailCity(req,res,req.params.id);
});
app.post('/api/city/update/:id', function(req, res) {
  model.updateCity(req,res,req.params.id);
});
app.post('/city/check-unique', function(req, res) {
  model.checkUniqueCity(req,res);
});

app.post('/api/link/new', function(req, res) {
  model.postNewLink(req,res);
});
app.post('/api/link/all', function(req, res) {
  model.getAllLink(req,res);
});
app.post('/api/link/delete/:id', function(req, res) {
  model.removeLink(req,res,req.params.id);
});

app.post('/api/column/all', function(req, res) {
  model.getAllColumn(req,res);
});

app.post('/api/column/detail/:id', function(req, res) {
  model.getColumnId(req,res,req.params.id);
});

app.post('/api/column/update/:id', function(req, res) {
  model.updateColumn(req,res,req.params.id);
});
app.post('/api/column/new', function(req, res) {
  model.newColumn(req,res);
});
app.post('/api/column/recycle/:id', function(req, res) {
  model.recycleColumn(req,res);
});

app.post('/file/upload',upload.single('file'),function(req, res) {
  console.log(req.file);
  upload_number--;
  let ret = {
    file:{
      uid: upload_number,      // 文件唯一标识，建议设置为负数，防止和内部产生的 id 冲突
      name: req.file.path,   // 文件名
      url: req.file.path,
      thumbUrl: req.file.path,
      status: 'done',  // 状态有：uploading done error removed
      removedesponse: '{"status": "success"}',  // 服务端响应内容
    }
  }
  res.json(ret);
});
app.listen(port, function (err, result) {
  if(err){
    console.log(err);
  }
  console.log('Server running on port ' + port);
});
