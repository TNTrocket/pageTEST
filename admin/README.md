## React Ant.Design Admin UI

## Features

- [React](https://facebook.github.io/react/)
- [Redux](https://github.com/reactjs/redux)
- [Ant.Design](http://ant.design/)
- [Babel](https://babeljs.io/)
- [webpack](https://webpack.github.io/)
- [mocha](https://mochajs.org/)
- [enzyme](https://github.com/airbnb/enzyme)

## Getting Started

Just clone the repo and install the necessary node modules:

```shell
$ git clone https://github.com/fireyy/react-antd-admin
$ cd react-antd-admin
$ npm install
$ npm start
```

## Run test spec

```shell
$ npm run test
```


后台更新
    安装新插件 npm install cookie-parser

    新增新配置文件 admin.config.js 此文件保存后台的管理员帐号和默认城市  注：此文件修改后要生效要重启后台服务



    城市更改
    ALTER TABLE  `city` ADD  `opened` TINYINT( 1 ) NOT NULL DEFAULT  '1' COMMENT  '城市是否开通，1开通，0未开通' AFTER  `status`