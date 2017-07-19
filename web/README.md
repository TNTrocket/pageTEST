# 选师无忧 —— 网站前台

node 		版本 —— v6.5.0
npm			版本 —— v3.10.3
express  	版本 —— v4.13.1

端口：3001

前端安装
    cd web
    npm install

本地启动
	npm start 

模板
	电脑版	./web/views/desktop
	手机版	./web/views/mobile

服务器启动
	pm2 start ./bin/www


配置文件 web/config/config.js
    db 数据库用户名与密码
    db.logSQL 是否在控制台打印SQL语句
定位
    网站首页加载完才使用百度API，须要用户允许，没有权限会失败

