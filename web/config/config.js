exports.db = {
  host: 'localhost',
  //host: global.dev ? 'localhost' : 'localhost',//本地:localhost git:mysql
  user: 'root',
  //user: global.dev ? 'root' : 'root',
  password: '123456',
  //password: global.dev ? 'qwer1234' : 'qwer1234',
  database: 'xswy',
  logSql: true,
  //database: global.dev ? 'xswy' : 'xswy',
  connectionLimit: 10,	//最大读取的记录数
  //supportBigNumbers: true //数据库处理大数字(长整型和含小数),时应该启用 (默认: false)
};

exports.config = {
	site:'http://51xuanshi.com',
	redirectSite: '51xuanshi.com',
    siteName: '选师无忧',
    defaultCity: {id: 1, pinyin: 'gz', name: '广州'},
    //defaultCity: {id: 2, pinyin: 'sz', name: '深圳'},
	//用于分页
	PAGE_SIZE: 20,

	//auth
	authSecret: '4ea5c508a6566e76240543f8feb06fd457777be39549c4016436afda65d2330e',
	authCookieMaxAge: 900000,
	authCookieDomain: '51xuanshi.com',

	//cache time (s)
	cacheTime: 60
};

var onlineURL = 'http://pkt.zoosnet.net/LR/Chatpre.aspx?id=PKT51831902&lng=cn#sem';

exports.online = {name: '在线咨询', route: onlineURL}

// 手机版栏目
exports.topMenu = [
	{id: 1, name: '首页', route: '/'},
	{id: 2, name: '高中辅导', route: '/gaozhongfudao/'},
	{id: 3, name: '初中辅导', route: '/chuzhongfudao/'},
	{id: 4, name: '小学辅导', route: '/xiaoxuefudao/'},
	{id: 5, name: '提分技巧', route: '/tifenjiqiao/'},
	{id: 6, name: '名师团队', route: '/mingshituandui/'},
	{id: 7, name: '提分案例', route: '/tifenanli/'},
	{id: 8, name: '在线咨询', route: onlineURL},
];

exports.findTeacher = {id: 9, name: '找老师', route: '/zhaolaoshi/'};

exports.subMenu = [
	{id: 10, name: '无忧概况', image: '/assets/img/wap19.png', route: '/xuanshiwuyou/'},
	{id: 11, name: '星级老师', image: '/assets/img/wap20.png', route: '/mingshituandui/xingjilaoshi'},
	{id: 12, name: '优惠活动', image: '/assets/img/wap21.png', route: '/youhuihuodong/'},
	{id: 13, name: '无忧路线', image: '/assets/img/wap22.png', route: '/wuyouluxian/'},
]

exports.jiazhangfankui = {id: 53, name: '家长反馈', route: '/jiazhangfankui/'};

exports.columnNews = {
    id: 14,
    name: '新闻头条',
    route: '/xinwentoutiao/',
    childColumns: [
        {id: 15, name: '家长加油', image: '/assets/img/wap39.jpg', route: '/jiazhangjiayou/'},
        {id: 16, name: '中考资讯', image: '/assets/img/wap40.jpg', route: '/zhongkaozixun/'},
        {id: 17, name: '高考资讯', image: '/assets/img/wap41.jpg', route: '/gaokaozixun/'},
        {id: 18, name: '家教微问', image: '/assets/img/wap42.jpg', route: '/jiajiaoweiwen/'},
        {id: 19, name: '升学资讯', image: '/assets/img/wap43.jpg', route: '/shengxuezixun/'},
        {id: 20, name: '学科辅导', image: '/assets/img/wap44.jpg', route: '/xuekefudao/'},
    ]
};

// 电脑版栏目
exports.webTopColumns = [
    {id: 54, name: '教育头条', route: '/jiaoyutoutiao'},
    {id: 55, name: '家长课堂', route: '/jiazhangketang'},
    {id: 56, name: '关于我们', route: '/guanyuwomen'}
];

exports.webAllFirstColumns = [
    {id: 61, name: '高中', route: '/gaozhongfudao'},
    {id: 62, name: '初中', route: '/chuzhongfudao'},
    {id: 63, name: '小学', route: '/xiaoxuefudao'},
    {id: 64, name: '艺术爱好', route: '/yishuaihao'}
];

exports.webOtherColumns = [
    {id: 58, name: '最新资讯', route: '/zuixinzixun'},
    {id: 57, name: '热门推荐', route: '/rementuijian'},
    {id: 11, name: '星级老师', route: '/xingjilaoshi'},
    {id: 59, name: '优秀学员', route: '/youxiuxueyuan'},
    {id: 60, name: '学习乐园', route: '/xuexileyuan'}
];
