var express = require('express');
var router = express.Router();

var http = require('http');
var util = require('util');
var moment = require('moment');
var async = require('async');
var request = require('superagent');
var CryptoJS = require("crypto-js");

var service_module = require(__dirname + '/../modules/service');

const mysql = require('mysql');
const config = require('../config/config');

const pool = {
  'query': function(sql, callback) {

    let db_config_obj = config.db;

    let pool_connection = mysql.createPool({
      host: db_config_obj.host,
      user: db_config_obj.user,
      port: db_config_obj.port,
      password: db_config_obj.password,
      database: db_config_obj.database
    });

    pool_connection.query(sql, function(err, rows) {
      if (err) {
        console.log("[error][pool.query]:", err);
      } else {
        //callback(err, rows);
      }
      callback(err, rows);
      pool_connection.end();
    });
  }
};

const mysql_escape = function(str) {
  return mysql.escape(str);
};

const options = {
  domain: config.config.authCookieDomain,
  maxAge: config.config.authCookieMaxAge
};

const foo = function(str) {
  str = '00' + str;
  return str.substring(str.length - 2, str.length);
};

const fetchArticleRoute = function(article) {
  let dtPublish = new Date(article.publish_at);
  let year = dtPublish.getFullYear();
  let month = foo(dtPublish.getMonth() + 1);
  let day = foo(dtPublish.getDate());
  let route = '/article/:year/:month/:day/:id.html';

  return (route.replace(':year', year).replace(':month', month).replace(':day', day).replace(':id', article.id));
};

const fetchTeacherRoute = function(teacher) {
  let dtTemp = new Date(teacher.created_at);
  let year = dtTemp.getFullYear();
  let month = foo(dtTemp.getMonth() + 1);
  let day = foo(dtTemp.getDate());
  let route = '/teacher/:year/:month/:day/:id.html';

  return (route.replace(':year', year).replace(':month', month).replace(':day', day).replace(':id', teacher.id));
};

const fetchCurrentCityId = function(req, res) {
  let city_id = req.cookies.current_city_id || req.header('current_city_id') || config.config.defaultCity.id;
  return city_id;
};

const fetchCurrentCity = function(req, res, callback) {
  let city = req.cookies.current_city || req.header('current_city') || config.config.defaultCity;
  if (req.subdomains && req.subdomains != '' && req.subdomains != 'www' && (city && req.subdomains != city.pinyin)) {
    fetchCityForPinyin(req.subdomains, (result) => {
      if (result.length > 0) {
        res.clearCookie('current_city_id', options);
        res.clearCookie('current_city', options);

        city = result[0];

        res.cookie('current_city_id', city.id, options);
        res.cookie('current_city', city, options);
      }
      callback(city);
    });
  } else {
    callback(city);
  }
};

const check = function(req) {
  let deviceAgent = req.headers['user-agent'] || req.get('User-Agent'); // 不知为什么黎哥那边经常拿不到值
  //console.log('[User-Agent]: ' + deviceAgent);
  if (deviceAgent) {
    deviceAgent = deviceAgent.toLowerCase();
    return (deviceAgent.match(/(iphone|ipod|ipad|android)/));
  } else {
    return false;
  }
};

const renderData = function(data, path, req, res, next) {
  if (check(req)) {
    res.render('mobile/' + path, data);
  } else {
    res.render('desktop/' + path, data);
  }
};

/*
    CSS 样式
    首页：       index
    名师团队：   teacher
    提分案例：   tifenanli
    找老师：     findTeacher
    提分技巧：   tifenjiqiao  （高中、初中、小学）
    新闻头条：   news （家长加油、高考|中考|升学资讯、学科辅导、家教微问）
    无忧概况：   wuyou （无忧路线）
    通用栏目：   public
    文章页：     article
*/

/*
    获取栏目的所有文章
    参数：column       当前栏目    Object
*/
const fetchColumnArticleList = function(column, req, res, next) {
  let city = null;
  let banner = null;
  let articleList = [];
  let thisColumn = column;
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'public' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: thisColumn.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        service_module.article({ conditions: conditions }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              articleList.push(item);
            });
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.articleList = articleList;
      data.column = thisColumn;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'column', req, res, next);
    }
  );
};

/*
    获取栏目（新闻头条、家长加油、高考|中考|升学资讯、学科辅导、家教微问）的所有文章

    家长加油调用中考资讯
    中考资讯调用高考资讯
    高考资讯调用家教微问
    家教微问调用升学资讯
    升学资讯调用学科辅导
    学科辅导调用新闻资讯
    新闻资讯调用家长加油

    参数：column       当前栏目    Object
    参数：relatedColumnId 相关栏目 ID
*/
const fetchNewsArticleList = function(column, relatedColumnId, req, res, next) {
  let city = null;
  let banner = null;
  let articleList = [];
  let relatedArticleList = []; //相关文章|猜你喜欢
  let thisColumn = column;
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'news' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: thisColumn.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        service_module.article({ conditions: conditions, limit: [0, 5] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              articleList.push(item);
            });
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: relatedColumnId });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        service_module.article({ conditions: conditions, order: [{ field: 'RAND()' }], limit: [0, 5] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              relatedArticleList.push(item);
            });
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.articleList = articleList;
      data.relatedArticleList = relatedArticleList;
      data.column = thisColumn;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'news', req, res, next);
    }
  );
};

/*
    获取顶级辅导栏目、提分技巧栏目的所有子栏目
    参数：column       顶级栏目    Object
    参数：template     模板名称    String
    参数：css          样式名称    String
*/
const fetchTopColumnChild = function(column, template, css, req, res, next) {
  let city = null;
  let child_column = [];
  let banner = null;
  let thisColumn = column;
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: css };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.column({ conditions: conditions, order: orderBy }, function(result) {
          result.map(function(item) {
            item.newRoute = '/' + thisColumn.route + '/' + item.route;
            child_column.push(item);
          });
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.child_column = child_column;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, template, req, res, next);
    }
  );
};

/*
    获取二级辅导栏目以及其文章列表
    参数：column 父级栏目 Object
*/
const fudaoSecond = function(column, req, res, next) {
  let city = null;
  let thisColumn = null;
  let banner = null;
  let thisColumnArtilce = [];
  let parentColumn = column;
  let data = { title: parentColumn.name, column_id: parentColumn.id, css: 'public' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'parent_id', op: '=', value: parentColumn.id });
        conditions.push({ field: 'route', op: '=', value: req.params.second });
        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.column({ conditions: conditions, order: orderBy }, function(result) {
          if (result.length > 0) {
            thisColumn = result[0];
            data.title = thisColumn.name;
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        if (thisColumn) {
          let conditions = [];
          conditions.push({ field: 'column_id', op: '=', value: thisColumn.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });

          let orderBy = [];
          orderBy.push({ field: 'publish_at' });
          orderBy.push({ field: 'id' });

          service_module.article({ conditions: conditions, order: orderBy }, function(result) {
            if (result.length > 0) {
              result.map(function(item) {
                item.route = fetchArticleRoute(item);
                if (item.image && item.image.charAt(0) != '/') {
                  item.image = '/' + item.image;
                }
                thisColumnArtilce.push(item);
              });
            }

            callback();
          });
        } else {
          callback();
        }

      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.articleList = thisColumnArtilce;
      data.column = thisColumn;
      data.banner = banner;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'column', req, res, next);
    }
  );
};

const fetchCityList = function(callback) {
  let orderBy = [{ field: 'id', sort: 'ASC' }];
  service_module.city({ order: orderBy }, function(result) {
    cityList = result;
    callback(cityList);
  });
};

// 电脑版顶部栏目
const fetchWebTopColumn = function(callback) {
  let webTopColumns = config.webTopColumns;

  async.eachSeries(webTopColumns, function(item, secondCallback) {
    let conditions = [];
    conditions.push({ field: 'parent_id', op: '=', value: item.id });
    let orderBy = [];
    orderBy.push({ field: 'order_no', sort: 'DESC' });
    orderBy.push({ field: 'id', sort: 'ASC' });

    service_module.column({ conditions: conditions, order: orderBy }, function(result) {
      item.childColumns = [];

      result.map(function(childItem) {
        childItem.route = item.route + '/' + childItem.route;
        item.childColumns.push(childItem);
      });
      secondCallback();
    });
  }, function(err) {
    if (err) {
      console.log("[fetch top column's child error]:", err);
      return next(err);
    }

    callback(webTopColumns);
  });
}

// 全部科目
const fetchWebAllColumn = function(callback) {
  let webAllColumns = config.webAllFirstColumns;

  async.eachSeries(webAllColumns, function(item, secondCallback) {
    let conditions = [];
    conditions.push({ field: 'parent_id', op: '=', value: item.id });
    let orderBy = [];
    orderBy.push({ field: 'order_no', sort: 'DESC' });
    orderBy.push({ field: 'id', sort: 'ASC' });

    service_module.column({ conditions: conditions, order: orderBy }, function(result) {
      item.childColumns = [];

      async.eachSeries(result, function(childItem, thirdCallback) {
        childItem.route = item.route + '/' + childItem.route;
        item.childColumns.push(childItem);

        let childConditions = [];
        childConditions.push({ field: 'parent_id', op: '=', value: childItem.id });

        service_module.column({ conditions: childConditions, order: orderBy }, function(thirdResult) {
          childItem.childColumns = [];

          if (thirdResult.length > 0) {
            thirdResult.map(function(thirdChildItem) {
              thirdChildItem.route = childItem.route + '/' + thirdChildItem.route;
              childItem.childColumns.push(thirdChildItem);
            });
          }
          thirdCallback();
        });
      });
      secondCallback();
    });
  }, function(err) {
    if (err) {
      console.log("[fetch all column's child error]:", err);
      return next(err);
    }
    callback(webAllColumns);
  });
}

// 电脑版内页 友情链接
const fetchWebLinks = function(callback) {
  let links = [];
  let orderBy = []
  orderBy.push({ field: 'created_at', sort: 'DESC' });
  orderBy.push({ field: 'id', sort: 'ASC' });

  service_module.link({ order: orderBy }, function(result) {
    if (result.length > 0) {
      result.map(function(item) {
        links.push(item);
      });
    }
    callback(links);
  });
}

const fetchBreadcrumb = function(breadcrumb, columnId, callback) {
  fetchColumn(columnId, (result) => {
    if (result.length > 0) {
      let data = result[0];
      let item = {};
      item.id = data.id;
      item.name = data.name;
      item.route = data.route; //route + '/' + data.route;
      //console.log('fetchBreadcrumb:', item);
      breadcrumb.push(item);
      if (data.parent_id == '0') {
        callback(breadcrumb);
      } else {
        fetchBreadcrumb(breadcrumb, data.parent_id, callback);
      }
    } else {
      callback(breadcrumb);
    }
  });
}

const fetchRelatedArticleList = function(city, callback) {
  let relatedArticleList = [];
  let relatedColumnConditions = [];

  relatedColumnConditions.push({ field: 'name', op: '=', value: '语文' });
  relatedColumnConditions.push({ field: 'name', op: '=', value: '数学' });
  relatedColumnConditions.push({ field: 'name', op: '=', value: '英语' });
  relatedColumnConditions.push({ field: 'name', op: '=', value: '物理' });
  relatedColumnConditions.push({ field: 'name', op: '=', value: '化学' });

  let multi_conditions = [];
  multi_conditions.push({ conditions: relatedColumnConditions, conditions_op: 'or' });

  service_module.column({ multi_conditions: multi_conditions }, function(result) {
    relatedColumnIds = [];
    result.map((item) => {
      relatedColumnIds.push(item.id);
    });
    let conditions = [];
    conditions.push({ field: 'column_id', op: 'IN', value: relatedColumnIds.join(',') });
    conditions.push({ field: 'city_id', op: '=', value: city.id });
    let orderBy = [{ field: 'RAND()' }];
    service_module.article({ conditions: conditions, order: orderBy, limit: [0, 6] }, function(articleResult) {
      if (articleResult.length > 0) {
        articleResult.map(function(item) {
          item.route = fetchArticleRoute(item);
          if (item.image && item.image.charAt(0) != '/') {
            item.image = '/' + item.image;
          }
          relatedArticleList.push(item);
        });
      }
      callback(relatedArticleList);
    });
  });
};

const fetchChildColumn = function(column, callback) {
  let childColumns = [];
  let route = '/';

  async.series([
      function(callback) {
        if (column.parent_id > 0) {
          let conditions = [{ field: 'id', op: '=', value: column.parent_id }];
          service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
            if (result.length > 0) {
              route += result[0].route + '/';
            }
            callback();
          });
        } else {
          callback();
        }
      },
      function(callback) {
        let conditions = [{ field: 'parent_id', op: '=', value: column.id }];
        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });
        service_module.column({ conditions: conditions, order: orderBy, limit: [0, 6] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = route + column.route + '/' + item.route;
              childColumns.push(item);
            });
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[fetchChildColumn Error]:", err);
        return next(err);
      }
      callback(childColumns);
    }
  );
};

const fetchAllChildColumn = function(column, callback) {
  //console.log('[fetchAllChildColumn]:', column.id, column.name);
  let childColumns = [];
  let conditions = [{ field: 'parent_id', op: '=', value: column.id }];
  service_module.column({ conditions: conditions }, function(result) {
    //console.log('[fetchAllChildColumn 1]:', result.length);
    if (result.length > 0) {
      result.map((item) => {
        //console.log('[fetchAllChildColumn 1]:', ' ======== id:', item.id, ' ===== parent_id:', item.parent_id, ' ===== name:', item.name);
        childColumns.push(item.id);
      });
      conditions = [{ field: 'parent_id', op: 'IN', value: childColumns.join(',') }];
      service_module.column({ conditions: conditions }, function(result) {
        //console.log('[fetchAllChildColumn 2]:', result.length);
        if (result.length > 0) {
          result.map((item) => {
            //console.log('[fetchAllChildColumn 2]:', ' ======== id:', item.id, ' ===== parent_id:', item.parent_id, ' ===== name:', item.name);
            childColumns.push(item.id);
          });
        }
        callback(childColumns);
      });
    } else {
      callback(childColumns);
    }
  });
}

const fetchPaginationArticle = function(column, city, callback) {
  let articleList = [];
  let articleTotal = 0;
  let childColumns = [];
  async.series([
      function(callback) {
        fetchAllChildColumn(column, (result) => {
          if (result.length > 0) {
            childColumns = result;
          }
          childColumns.push(column.id);
          callback();
        });
      },
      function(callback) {
        // 文章列表
        let conditions = [{ field: 'column_id', op: 'IN', value: childColumns.join(',') }, { field: 'city_id', op: '=', value: city.id }];
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'DESC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 10] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.publish_at).format('YYYY-MM-DD');
              articleList.push(item);
            });
          }
          callback();
        });
      },
      function(callback) {
        // 文章统计
        let conditions = [{ field: 'column_id', op: 'IN', value: childColumns.join(',') }, { field: 'city_id', op: '=', value: city.id }];

        service_module.article({ conditions: conditions, total_field: 'id' }, function(result) {
          articleTotal = result[0].total;
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[fetchPaginationArticle Error]:", err);
        return next(err);
      }
      callback(articleList, articleTotal);
    }
  );
};

const fetchPaginationArticleForColumnName = function(columnName, city, callback) {
  let articleList = [];
  let articleTotal = 0;
  let column_ids = [];
  async.series([
      function(callback) {
        // 栏目
        let conditions = [{ field: 'name', op: '=', value: columnName }];

        service_module.column({ conditions: conditions }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              column_ids.push(item.id);
            });
          }
          callback();
        });
      },
      function(callback) {
        // 文章列表
        if (column_ids.length > 0) {
          let conditions = [{ field: 'column_id', op: 'IN', value: column_ids.join(',') }, { field: 'city_id', op: '=', value: city.id }];
          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 10] }, function(result) {
            if (result.length > 0) {
              result.map(function(item) {
                item.route = fetchArticleRoute(item);
                item.publish_date = moment(item.publish_at).format('YYYY-MM-DD');
                articleList.push(item);
              });
            }
            callback();
          });
        } else {
          callback();
        }
      },
      function(callback) {
        // 文章统计
        if (column_ids.length > 0) {
          let conditions = [{ field: 'column_id', op: 'IN', value: column_ids.join(',') }, { field: 'city_id', op: '=', value: city.id }];

          service_module.article({ conditions: conditions, total_field: 'id' }, function(result) {
            articleTotal = result[0].total;
            callback();
          });
        } else {
          callback();
        }
      }
    ],
    function(err) {
      if (err) {
        console.log("[fetchPaginationArticle Error]:", err);
        return next(err);
      }
      callback(articleList, articleTotal);
    }
  );
};

const fetchWebColumnArticle = function(column, req, res, next) {
  let thisColumn = column;
  let city = null;
  let data = { title: thisColumn.name, column: thisColumn };
  let webTopColumns = config.webTopColumns; //电脑版顶部栏目
  let webAllColumns = config.webAllFirstColumns; //全部科目
  let cityList = [];
  let breadcrumb = [];
  let relatedArticleList = [],
    articleList = [],
    articleTotal = 0;
  let banner = {};
  let childColumns = [];
  let links = [];

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchWebTopColumn((result) => {
          webTopColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchWebAllColumn((result) => {
          webAllColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchCityList((result) => {
          cityList = result;
          callback();
        });
      },
      function(callback) {
        // Banner
        fetchBanner(thisColumn, 'webpage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        // links
        fetchWebLinks((result) => {
          links = result;
          callback();
        });
      },
      function(callback) {
        // breadcrumb
        fetchBreadcrumb(breadcrumb, thisColumn.id, (result) => {
          breadcrumb = result;
          callback();
        });
      },
      function(callback) {
        // 推荐阅读
        fetchRelatedArticleList(city, (result) => {
          relatedArticleList = result;
          callback();
        });
      },
      function(callback) {
        // 子栏目
        fetchChildColumn(thisColumn, (result) => {
          childColumns = result;
          callback();
        });
      },
      function(callback) {
        // 文章列表 与 文章统计
        fetchPaginationArticle(thisColumn, city, (list, total) => {
          articleList = list;
          articleTotal = total;
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[column fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';

      data.city_id = city.id;
      data.cityList = cityList;
      data.currentCity = city;

      data.webTopColumns = webTopColumns;
      data.webAllColumns = webAllColumns;
      data.childColumns = childColumns;
      data.banner = banner;
      data.links = links;
      data.breadcrumb = breadcrumb;
      data.articleList = articleList;
      data.articleTotal = articleTotal;
      data.relatedArticleList = relatedArticleList;
      data.isHome = false;

      res.render('desktop/column', data);
    }
  );
}

const fetchWebKemuColumnArticle = function(column, kemu, route, req, res, next) {
  let thisColumn = column;
  let city = null;
  let data = { title: kemu, column: thisColumn };
  let webTopColumns = config.webTopColumns; //电脑版顶部栏目
  let webAllColumns = config.webAllFirstColumns; //全部科目
  let cityList = [],
    currentCity = city;
  let breadcrumb = [];
  let relatedArticleList = [],
    articleList = [],
    articleTotal = 0;
  let banner = {};
  let childColumns = [];
  let links = [];

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        if (thisColumn.id) {
          fetchColumn(thisColumn.id, (result) => {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        } else {
          let conditions = [];
          conditions.push({ field: 'name', op: '=', value: thisColumn.name });

          let multi_conditions = [];
          multi_conditions.push({ conditions: conditions, conditions_op: 'or' });

          service_module.column({ multi_conditions: multi_conditions, limit: [0, 1] }, function(result) {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        }
      },
      function(callback) {
        fetchWebTopColumn((result) => {
          webTopColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchWebAllColumn((result) => {
          webAllColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchCityList((result) => {
          cityList = result;
          callback();
        });
      },
      function(callback) {
        // links
        fetchWebLinks((result) => {
          links = result;
          callback();
        });
      },
      function(callback) {
        // Banner
        fetchBanner(thisColumn, 'webpage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
        /*if(thisColumn.id){
            fetchWebBanner(banner, thisColumn.id, callback);
        }
        else{
            callback();
        }*/
      },
      function(callback) {
        // breadcrumb
        breadcrumb.push({ name: kemu, route: route });
        if (column.id) {
          fetchBreadcrumb(breadcrumb, column.id, (result) => {
            breadcrumb = result;
            callback();
          });
        } else {
          callback();
        }
      },
      function(callback) {
        // 推荐阅读
        fetchRelatedArticleList(city, (result) => {
          relatedArticleList = result;
          callback();
        });
      },
      function(callback) {
        // 子栏目
        if (!thisColumn.id) {
          callback();
        } else {
          fetchChildColumn(thisColumn, (result) => {
            childColumns = result;
            callback();
          });
        }

      },
      function(callback) {
        // 文章列表 与 文章统计
        fetchPaginationArticleForColumnName(kemu, city, (list, total) => {
          articleList = list;
          articleTotal = total;
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[column fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';

      data.city_id = city.id;
      data.cityList = cityList;
      data.currentCity = city;

      data.webTopColumns = webTopColumns;
      data.webAllColumns = webAllColumns;
      data.childColumns = childColumns;
      data.banner = banner;
      data.links = links;
      data.breadcrumb = breadcrumb;
      data.articleList = articleList;
      data.articleTotal = articleTotal;
      data.relatedArticleList = relatedArticleList;
      data.isHome = false;

      res.render('desktop/column', data);
    }
  );
}

const fetchWebColumnInfo = function(column, template, req, res, next) {
  let thisColumn = column;
  let city = null;
  let data = { title: thisColumn.name };
  let webTopColumns = config.webTopColumns; //电脑版顶部栏目
  let webAllColumns = config.webAllFirstColumns; //全部科目
  let cityList = [],
    currentCity = city;
  let breadcrumb = [];
  let links = [];

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        if (thisColumn.id) {
          fetchColumn(thisColumn.id, (result) => {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        } else {
          let conditions = [];
          conditions.push({ field: 'name', op: '=', value: thisColumn.name });
          conditions.push({ field: 'id', op: '=', value: 1 });

          let orderBy = [];
          orderBy.push({ field: 'order_no', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          let multi_conditions = [];
          multi_conditions.push({ conditions: conditions, conditions_op: 'or' });

          service_module.column({ multi_conditions: multi_conditions, order: orderBy, limit: [0, 1] }, function(result) {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        }
      },
      function(callback) {
        fetchWebTopColumn((result) => {
          webTopColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchWebAllColumn((result) => {
          webAllColumns = result;
          callback();
        });
      },
      function(callback) {
        fetchCityList((result) => {
          cityList = result;
          callback();
        });
      },
      function(callback) {
        // links
        fetchWebLinks((result) => {
          links = result;
          callback();
        });
      },
      function(callback) {
        // breadcrumb
        if (thisColumn.id) {
          fetchBreadcrumb(breadcrumb, thisColumn.id, (result) => {
            breadcrumb = result;
            callback();
          });
        } else {
          breadcrumb.push(thisColumn);
          callback();
        }
      }
    ],
    function(err) {
      if (err) {
        console.log("[fetch ColumnInfo Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';

      data.city_id = city.id;
      data.cityList = cityList;
      data.currentCity = city;

      data.webTopColumns = webTopColumns;
      data.webAllColumns = webAllColumns;
      data.breadcrumb = breadcrumb;
      data.links = links;
      data.isHome = false;

      res.render('desktop/' + template, data);
    }
  );
}

/*router.get('*', function (req, res, next) {
    let city = req.cookies.city || config.config.defaultCity;

    if( req.subdomains && req.subdomains != '' && req.subdomains != 'www' && (city && req.subdomains != city.pinyin) ){
        fetchCityForPinyin(req.subdomains, (result) => {
            //console.log('defaultCity', result);
            if(result.length > 0){
                res.clearCookie('current_city_id', options);
                res.clearCookie('current_city', options);
                res.cookie('current_city_id', result[0].id, options);
                res.cookie('current_city', result[0], options);
                res.redirect('/');//子域名访问重定向到首页
                //console.log('set defaultCity and next');
            }
            else{
                next();
            }
        });
    }
    else{
        next();
    }
});*/

/* 首页 */
router.get('/', function(req, res, next) {
  let city = null;
  let thisColumn = config.topMenu[0];
  let data = { title: config.config.siteName, column_id: thisColumn.id, css: 'index' };
  let student = [],
    cityList = [];
  let banners = [];

  if (check(req)) {
    //手机版
    let newsArticle = [],
      jiazhangfankui = [];

    async.series([
        function(callback) {
          fetchCurrentCity(req, res, (result) => {
            city = result;
            callback();
          });
        },
        function(callback) {
          fetchColumn(thisColumn.id, (result) => {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        },
        function(callback) {
          let conditions = [];
          conditions.push({ field: 'column_id', op: '=', value: config.columnNews.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });

          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 5] }, function(result) {
            if (result.length > 0) {
              result.map(function(item) {
                item.route = fetchArticleRoute(item);
                if (item.image && item.image.charAt(0) != '/') {
                  item.image = '/' + item.image;
                }
                newsArticle.push(item);
              });
            }
            callback();
          });
        },
        function(callback) {
          let orderBy = [{ field: 'RAND()' }];
          service_module.student({ order: orderBy, limit: [0, 5] }, function(result) {
            student = result;
            callback();
          });
        },
        function(callback) {
          let conditions = [];
          conditions.push({ field: 'column_id', op: '=', value: config.jiazhangfankui.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });
          conditions.push({ field: 'image', op: '<>', value: '' });
          conditions.push({ field: 'image', op: '!isnull' });

          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 3] }, function(result) {
            jiazhangfankui = result;
            callback();
          });
        },
        function(callback) {
          fetchCityList((result) => {
            cityList = result;
            callback();
          });
        },
        function(callback) {
          let conditions = [{ field: 'position', op: '=', value: 'waphome' }];
          service_module.banner({ conditions: conditions }, function(result) {
            banners = result;
            callback();
          });
        }
      ],
      function(err) {
        if (err) {
          console.log("[index fetch Error]:", err);
          return next(err);
        }
        data.city_id = city.id;
        data.cityList = cityList;
        data.currentCity = city;

        data.seoTitle = replaceSeo(thisColumn.title, city);
        data.keywords = replaceSeo(thisColumn.keywords, city);
        data.description = replaceSeo(thisColumn.description, city);
        data.newsArticle = newsArticle;
        data.student = student;
        data.jiazhangfankui = jiazhangfankui;
        data.banners = banners;
        data.isHome = true;

        res.render('mobile/index', data);
      }
    );
  } else {
    let webTopColumns = config.webTopColumns; //电脑版顶部栏目
    let webAllColumns = config.webAllFirstColumns; //全部科目
    let newsArticleList = [],
      hotArticleList = [],
      youxiuxueyuanArticleList = [],
      xuexileyuanArticleList = [];
    let xingjilaoshiColumn = config.webOtherColumns[2];
    let teacherList = [];
    let links = [];

    async.series([
        function(callback) {
          fetchCurrentCity(req, res, (result) => {
            city = result;
            callback();
          });
        },
        function(callback) {
          fetchColumn(1, (result) => {
            if (result.length > 0) {
              thisColumn = result[0];
            }
            callback();
          });
        },
        function(callback) {
          fetchWebTopColumn((result) => {
            webTopColumns = result;
            callback();
          });
        },
        function(callback) {
          fetchWebAllColumn((result) => {
            webAllColumns = result;
            callback();
          });
        },
        function(callback) {
          fetchCityList((result) => {
            cityList = result;
            callback();
          });
        },
        function(callback) {
          // links
          fetchWebLinks((result) => {
            links = result;
            callback();
          });
        },
        function(callback) {
          let orderBy = [{ field: 'RAND()' }];
          service_module.student({ order: orderBy, limit: [0, 10] }, function(result) {
            result.map(function(item) {
              if (item.mobile_no) {
                if (item.mobile_no.length > 6) {
                  item.mobile_no = item.mobile_no.substring(0, 3) + '*****' + item.mobile_no.substring(item.mobile_no.length - 3, item.mobile_no.length);
                } else {
                  item.mobile_no = item.mobile_no;
                }
              } else {
                item.mobile_no = '';
              }
              student.push(item);
            });
            callback();
          });
        },
        function(callback) {
          let conditions = [{ field: 'city_id', op: '=', value: city.id }];
          let orderBy = [{ field: 'RAND()' }];
          service_module.teacher({ conditions: conditions, order: orderBy, limit: [0, 8] }, function(result) {
            result.map(function(item) {
              item.route = fetchTeacherRoute(item);
              if (item.avatar && item.avatar.charAt(0) != '/') {
                item.avatar = '/' + item.avatar;
              }
              item.city_name = city.name;
              teacherList.push(item);
            });
            callback();
          });
        },
        function(callback) {
          xingjilaoshiColumn.childColumns = [];

          let conditions = [{ field: 'parent_id', op: '=', value: xingjilaoshiColumn.id }];

          let orderBy = [];
          orderBy.push({ field: 'order_no', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'ASC' });

          service_module.column({ conditions: conditions, order: orderBy, limit: [0, 5] }, function(result) {
            result.map(function(item) {
              item.route = xingjilaoshiColumn.route + '/' + item.route;
              xingjilaoshiColumn.childColumns.push(item);
            });
            callback();
          });
        },
        function(callback) {
          // 最新资讯
          let newsColumn = config.webOtherColumns[0];
          let conditions = [{ field: 'column_id', op: '=', value: newsColumn.id }, { field: 'city_id', op: '=', value: city.id }];
          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 3] }, function(result) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.publish_at).format('YYYY-MM-DD HH:mm:ss');
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              newsArticleList.push(item);
            });
            callback();
          });
        },
        function(callback) {
          // 热门推荐
          let hotColumn = config.webOtherColumns[1];
          let conditions = [{ field: 'column_id', op: '=', value: hotColumn.id }, { field: 'city_id', op: '=', value: city.id }];
          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 2] }, function(result) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.publish_at).format('YYYY-MM-DD HH:mm:ss');
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              hotArticleList.push(item);
            });
            callback();
          });
        },
        function(callback) {
          // 优秀学员
          let youxiuxueyuanColumn = config.webOtherColumns[3];
          let conditions = [{ field: 'column_id', op: '=', value: youxiuxueyuanColumn.id }, { field: 'city_id', op: '=', value: city.id }];
          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 12] }, function(result) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              youxiuxueyuanArticleList.push(item);
            });
            callback();
          });
        },
        function(callback) {
          // 学习乐园
          let xuexileyuanColumn = config.webOtherColumns[4];
          let conditions = [{ field: 'column_id', op: '=', value: xuexileyuanColumn.id }, { field: 'city_id', op: '=', value: city.id }];
          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions, order: orderBy, limit: [0, 10] }, function(result) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.created_at).format('YYYY-MM-DD');
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }
              xuexileyuanArticleList.push(item);
            });
            callback();
          });
        },
        function(callback) {
          let conditions = [{ field: 'position', op: '=', value: 'webhome' }];
          service_module.banner({ conditions: conditions }, function(result) {
            banners = result;
            callback();
          });
        }
      ],
      function(err) {
        if (err) {
          console.log("[index fetch Error]:", err);
          return next(err);
        }
        data.city_id = city.id;
        data.cityList = cityList;
        data.currentCity = city;

        data.seoTitle = replaceSeo(thisColumn.title, city);
        data.keywords = replaceSeo(thisColumn.keywords, city);
        data.description = replaceSeo(thisColumn.description, city);

        data.newsArticleList = newsArticleList;
        data.hotArticleList = hotArticleList;
        data.youxiuxueyuanArticleList = youxiuxueyuanArticleList;
        data.xuexileyuanArticleList = xuexileyuanArticleList;
        data.banners = banners;
        data.links = links;
        data.student = student;
        data.teacherList = teacherList;
        data.xingjilaoshiColumn = xingjilaoshiColumn;
        data.webTopColumns = webTopColumns;
        data.webAllColumns = webAllColumns;
        data.isHome = true;
        console.log('data.currentCity', data.currentCity);
        res.render('desktop/index', data);
      }
    );
  }
});

// 用户服务协议
router.get('/yonghuxieyi', function(req, res, next) {
  res.render('yonghuxieyi', { title: '选师无忧用户服务协议' });
});

// 电脑版登录
router.get('/denglu', function(req, res, next) {
  let thisColumn = { name: '登录' };

  fetchWebColumnInfo(thisColumn, 'denglu', req, res, next);
});

// 电脑版找回密码
router.get('/zhaohuimima', function(req, res, next) {
  let thisColumn = { name: '找回密码' };

  fetchWebColumnInfo(thisColumn, 'zhaohuimima', req, res, next);
});

// 电脑版注册
router.get('/zhuce', function(req, res, next) {
  let thisColumn = { name: '注册' };

  fetchWebColumnInfo(thisColumn, 'zhuce', req, res, next);
});

// 电脑版老师注册
router.get('/zhuce/laoshi', function(req, res, next) {
  let thisColumn = { name: '老师注册' };

  fetchWebColumnInfo(thisColumn, 'zhuce-laoshi', req, res, next);
});

// 电脑版家长注册
router.get('/zhuce/jiazhang', function(req, res, next) {
  let thisColumn = { name: '家长注册' };

  fetchWebColumnInfo(thisColumn, 'zhuce-jiazhang', req, res, next);
});

// 电脑版 关于我们
router.get('/guanyuwomen', function(req, res, next) {
  let thisColumn = config.webTopColumns[2];

  fetchWebColumnInfo(thisColumn, 'guanyuwomen', req, res, next);
});

// 电脑版 联系我们
router.get('/lianxiwomen', function(req, res, next) {
  let thisColumn = { name: '联系我们', route: 'lianxiwomen' };

  fetchWebColumnInfo(thisColumn, 'guanyuwomen', req, res, next);
});

// 电脑版 无忧简介
router.get('/wuyoujianjie', function(req, res, next) {
  let thisColumn = { name: '无忧简介', route: 'wuyoujianjie' };

  fetchWebColumnInfo(thisColumn, 'guanyuwomen', req, res, next);
});

// 电脑版 使用流程
router.get('/shiyongliucheng', function(req, res, next) {
  let thisColumn = { name: '使用流程', route: 'shiyongliucheng' };

  fetchWebColumnInfo(thisColumn, 'shiyongliucheng', req, res, next);
});

// 电脑版 APP下载
router.get('/appxiazai', function(req, res, next) {
  let thisColumn = { name: 'APP下载', route: 'appxiazai' };

  fetchWebColumnInfo(thisColumn, 'appxiazai', req, res, next);
});

router.get('/activity', function(req, res, next) {
  let thisColumn = { name: 'activity', route: 'activity' };

  fetchWebColumnInfo(thisColumn, 'activity', req, res, next);
});
// 电脑版 APP下载 家长端
router.get('/appxiazai/jiazhang', function(req, res, next) {
  let thisColumn = { name: 'APP下载', route: 'appxiazai' };

  fetchWebColumnInfo(thisColumn, 'appxiazai-jiazhang', req, res, next);
});

// 电脑版 APP下载 老师端
router.get('/appxiazai/laoshi', function(req, res, next) {
  let thisColumn = { name: 'APP下载', route: 'appxiazai' };

  fetchWebColumnInfo(thisColumn, 'appxiazai-laoshi', req, res, next);
});

// 电脑版 成为老师
router.get('/chengweilaoshi', function(req, res, next) {
  let thisColumn = { name: '成为老师', route: 'chengweilaoshi' };

  fetchWebColumnInfo(thisColumn, 'chengweilaoshi', req, res, next);
});

// 电脑版 星级老师
router.get('/xingjilaoshi', function(req, res, next) {
  let thisColumn = { name: '星级老师', route: 'xingjilaoshi' };

  fetchWebColumnInfo(thisColumn, 'xingjilaoshi', req, res, next);
});

// 电脑版 网站地图
router.get('/wangzhanditu', function(req, res, next) {
  let thisColumn = { name: '网站地图', route: 'wangzhanditu' };

  fetchWebColumnInfo(thisColumn, 'wangzhanditu', req, res, next);
});
/// 优秀学员
router.get('/youxiuxueyuan', function(req, res, next) {
  let thisColumn = config.webOtherColumns[3];

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版教育头条
router.get('/jiaoyutoutiao', function(req, res, next) {
  let thisColumn = config.webTopColumns[0];

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版教育头条 - 二级栏目
router.get('/jiaoyutoutiao/:second', function(req, res, next) {
  let thisColumn = config.webTopColumns[0];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      fetchWebColumnArticle(result[0], req, res, next);
    } else {
      fetchWebColumnArticle(thisColumn, req, res, next);
    }
  });
});

// 电脑版 家长课堂
router.get('/jiazhangketang', function(req, res, next) {
  let thisColumn = config.webTopColumns[1];

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版 家长课堂 - 二级栏目
router.get('/jiazhangketang/:second', function(req, res, next) {
  let thisColumn = config.webTopColumns[1];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      fetchWebColumnArticle(result[0], req, res, next);
    } else {
      fetchWebColumnArticle(thisColumn, req, res, next);
    }
  });
});

// 电脑版 最新资讯
router.get('/zuixinzixun', function(req, res, next) {
  let thisColumn = config.webOtherColumns[0];
  //console.log(thisColumn);

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版 热门推荐
router.get('/rementuijian', function(req, res, next) {
  let thisColumn = config.webOtherColumns[1];
  //console.log(thisColumn);

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版 学习乐园
router.get('/xuexileyuan', function(req, res, next) {
  let thisColumn = config.webOtherColumns[4];
  //console.log(thisColumn);

  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 电脑版 学习乐园 - 二级栏目
router.get('/xuexileyuan/:second', function(req, res, next) {
  let thisColumn = config.webOtherColumns[4];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      fetchWebColumnArticle(result[0], req, res, next);
    } else {
      fetchWebColumnArticle(thisColumn, req, res, next);
    }
  });
});

// 高中辅导页
router.get('/gaozhongfudao/', function(req, res, next) {
  if (check(req)) {
    fetchTopColumnChild(config.topMenu[1], 'fudao', 'fudao', req, res, next);
  } else {
    let thisColumn = config.webAllFirstColumns[0];
    fetchWebColumnArticle(thisColumn, req, res, next);
  }
});

// 高中辅导 - 二级子栏目页
router.get('/gaozhongfudao/:second', function(req, res, next) {
  if (check(req)) {
    fudaoSecond(config.topMenu[1], req, res, next);
  } else {
    let topColumn = config.webAllFirstColumns[0];
    if (req.params.second == 'wenzong') {
      //文综
      fetchWebKemuColumnArticle(topColumn, '文综', req.params.second, req, res, next);
    } else if (req.params.second == 'lizong') {
      //理综
      fetchWebKemuColumnArticle(topColumn, '理综', req.params.second, req, res, next);
    } else {
      let conditions = [];
      conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
      conditions.push({ field: 'route', op: '=', value: req.params.second });

      service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
        if (result.length > 0) {
          fetchWebColumnArticle(result[0], req, res, next);
        } else {
          fetchWebColumnArticle(topColumn, req, res, next);
        }
      });
    }

  }
});

// 高中辅导 - 三级子栏目页
router.get('/gaozhongfudao/:second/:third', function(req, res, next) {
  let topColumn = config.webAllFirstColumns[0];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      let childConditions = [];
      childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });
      childConditions.push({ field: 'route', op: '=', value: req.params.third });
      service_module.column({ conditions: childConditions, limit: [0, 1] }, function(childResult) {
        if (childResult.length > 0) {
          fetchWebColumnArticle(childResult[0], req, res, next);
        } else {
          fetchWebColumnArticle(result[0], req, res, next);
        }
      });
    } else {
      fetchWebColumnArticle(topColumn, req, res, next);
    }
  });
});

// 初中辅导页
router.get('/chuzhongfudao/', function(req, res, next) {
  if (check(req)) {
    fetchTopColumnChild(config.topMenu[2], 'fudao', 'fudao', req, res, next);
  } else {
    let thisColumn = config.webAllFirstColumns[1];
    fetchWebColumnArticle(thisColumn, req, res, next);
  }
});

// 初中辅导 - 子栏目页
router.get('/chuzhongfudao/:second', function(req, res, next) {
  if (check(req)) {
    fudaoSecond(config.topMenu[2], req, res, next);
  } else {
    let topColumn = config.webAllFirstColumns[1];

    let conditions = [];
    conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
    conditions.push({ field: 'route', op: '=', value: req.params.second });

    service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
      if (result.length > 0) {
        fetchWebColumnArticle(result[0], req, res, next);
      } else {
        fetchWebColumnArticle(topColumn, req, res, next);
      }
    });
  }
});

// 初中辅导 - 三级子栏目页
router.get('/chuzhongfudao/:second/:third', function(req, res, next) {
  let topColumn = config.webAllFirstColumns[1];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      let childConditions = [];
      childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });
      childConditions.push({ field: 'route', op: '=', value: req.params.third });
      service_module.column({ conditions: childConditions, limit: [0, 1] }, function(childResult) {
        if (childResult.length > 0) {
          fetchWebColumnArticle(childResult[0], req, res, next);
        } else {
          fetchWebColumnArticle(result[0], req, res, next);
        }
      });
    } else {
      fetchWebColumnArticle(topColumn, req, res, next);
    }
  });
});

// 小学辅导页
router.get('/xiaoxuefudao/', function(req, res, next) {
  if (check(req)) {
    fetchTopColumnChild(config.topMenu[3], 'fudao', 'fudao', req, res, next);
  } else {
    let thisColumn = config.webAllFirstColumns[2];
    fetchWebColumnArticle(thisColumn, req, res, next);
  }
});

// 小学辅导 - 子栏目页
router.get('/xiaoxuefudao/:second', function(req, res, next) {
  if (check(req)) {
    fudaoSecond(config.topMenu[3], req, res, next);
  } else {
    let topColumn = config.webAllFirstColumns[2];
    if (req.params.second == 'aoshu') {
      //奥数
      fetchWebKemuColumnArticle(topColumn, '奥数', req.params.second, req, res, next);
    } else {
      let conditions = [];
      conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
      conditions.push({ field: 'route', op: '=', value: req.params.second });

      service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
        if (result.length > 0) {
          fetchWebColumnArticle(result[0], req, res, next);
        } else {
          fetchWebColumnArticle(topColumn, req, res, next);
        }
      });
    }
  }
});

// 小学辅导 - 三级子栏目页
router.get('/xiaoxuefudao/:second/:third', function(req, res, next) {
  let topColumn = config.webAllFirstColumns[2];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      let childConditions = [];
      childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });
      childConditions.push({ field: 'route', op: '=', value: req.params.third });
      service_module.column({ conditions: childConditions, limit: [0, 1] }, function(childResult) {
        if (childResult.length > 0) {
          fetchWebColumnArticle(childResult[0], req, res, next);
        } else {
          fetchWebColumnArticle(result[0], req, res, next);
        }
      });
    } else {
      fetchWebColumnArticle(topColumn, req, res, next);
    }
  });
});

// 电脑版 语文 数学 英语 物理 化学 生物 政治 历史 地理
router.get('/yuwen', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '语文', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/shuxue', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '数学', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/yingyu', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '英语', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/wuli', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '物理', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/huaxue', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '化学', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/shengwu', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '生物', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/zhengzhi', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '政治', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/lishi', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '历史', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

router.get('/dili', function(req, res, next) {
  let route = req.path.substr(1);
  let thisColumn = { id: 0, name: '地理', route: route };

  fetchWebKemuColumnArticle(thisColumn, thisColumn.name, thisColumn.route, req, res, next);
});

// 艺术爱好页
router.get('/yishuaihao/', function(req, res, next) {
  let thisColumn = config.webAllFirstColumns[3];
  fetchWebColumnArticle(thisColumn, req, res, next);
});

// 艺术爱好 - 子栏目页
router.get('/yishuaihao/:second', function(req, res, next) {
  let topColumn = config.webAllFirstColumns[3];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      fetchWebColumnArticle(result[0], req, res, next);
    } else {
      fetchWebColumnArticle(topColumn, req, res, next);
    }
  });
});

// 艺术爱好 - 三级子栏目页
router.get('/yishuaihao/:second/:third', function(req, res, next) {
  let topColumn = config.webAllFirstColumns[3];

  let conditions = [];
  conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
  conditions.push({ field: 'route', op: '=', value: req.params.second });

  service_module.column({ conditions: conditions, limit: [0, 1] }, function(result) {
    if (result.length > 0) {
      let childConditions = [];
      childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });
      childConditions.push({ field: 'route', op: '=', value: req.params.third });
      service_module.column({ conditions: childConditions, limit: [0, 1] }, function(childResult) {
        if (childResult.length > 0) {
          fetchWebColumnArticle(childResult[0], req, res, next);
        } else {
          fetchWebColumnArticle(result[0], req, res, next);
        }
      });
    } else {
      fetchWebColumnArticle(topColumn, req, res, next);
    }
  });
});

// 提分技巧页
router.get('/tifenjiqiao/', function(req, res, next) {
  let city = null;
  let child_column = [];
  let banner = null;
  let thisColumn = config.topMenu[4];
  let gaozhongArticle = [],
    chuzhongArticle = [],
    xiaoxueArticle = [];
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'tifenjiqiao' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.column({ conditions: conditions, order: orderBy }, function(result) {
          result.map(function(item) {
            item.newRoute = '/' + thisColumn.route + '/' + item.route;
            child_column.push(item);
          });
          callback();
        });
      },
      function(callback) {
        // 高中语文
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 40 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            gaozhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 高中数学
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 41 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            gaozhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 高中英语
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 42 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            gaozhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 初中语文
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 45 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            chuzhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 初中数学
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 46 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            chuzhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 初中英语
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 47 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            chuzhongArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 小学语文
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 50 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            xiaoxueArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 小学数学
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 51 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            xiaoxueArticle.push(tempArticle);
          }
          callback();
        });
      },
      function(callback) {
        // 小学英语
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: 52 });
        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 1] }, function(result) {
          if (result.length > 0) {
            let tempArticle = result[0];
            tempArticle.route = fetchArticleRoute(tempArticle);
            if (tempArticle.image && tempArticle.image.charAt(0) != '/') {
              tempArticle.image = '/' + tempArticle.image;
            }
            xiaoxueArticle.push(tempArticle);
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.child_column = child_column;
      data.gaozhongArticle = gaozhongArticle;
      data.chuzhongArticle = chuzhongArticle;
      data.xiaoxueArticle = xiaoxueArticle;

      data.city_id = city.id;
      data.currentCity = city;
      data.isHome = false;

      renderData(data, 'tifenjiqiao', req, res, next);
    }
  );
});

// 提分技巧 - 二级栏目页
router.get('/tifenjiqiao/:second', function(req, res, next) {
  let city = null;
  let child_column = [];
  let thisColumn = config.topMenu[4];
  let banner = null;
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'tifenjiqiao' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'parent_id', op: '=', value: thisColumn.id });
        conditions.push({ field: 'route', op: '=', value: req.params.second });

        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.column({ conditions: conditions, order: orderBy }, function(result) {
          if (result.length > 0) {
            let childConditions = [];
            childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });

            service_module.column({ conditions: childConditions, order: orderBy }, function(childResult) {
              childResult.map(function(item) {
                item.newRoute = '/' + thisColumn.route + '/' + req.params.second + '/' + item.route;
                child_column.push(item);
              });
              callback();
            });
          } else {
            callback();
          }

        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.child_column = child_column;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'tifenjiqiao2', req, res, next);
    }
  );
});

// 提分技巧 - 二级栏目 - 三级栏目页
router.get('/tifenjiqiao/:second/:third', function(req, res, next) {
  let city = null;
  let banner = null;
  let thisColumn = null;
  let thisColumnArtilce = [];
  let topColumn = config.topMenu[4];
  let data = { title: topColumn.name, column_id: topColumn.id, css: 'public' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'parent_id', op: '=', value: topColumn.id });
        conditions.push({ field: 'route', op: '=', value: req.params.second });

        let orderBy = [];
        orderBy.push({ field: 'order_no', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'ASC' });

        service_module.column({ conditions: conditions, order: orderBy }, function(result) {
          if (result.length > 0) {
            let childConditions = [];
            childConditions.push({ field: 'parent_id', op: '=', value: result[0].id });
            childConditions.push({ field: 'route', op: '=', value: req.params.third });

            service_module.column({ conditions: childConditions, order: orderBy }, function(childResult) {
              if (childResult.length > 0) {
                thisColumn = childResult[0];
                data.title = thisColumn.name;
              }
              callback();
            });
          } else {
            thisColumn = topColumn;
            callback();
          }

        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        if (thisColumn) {
          let conditions = [];
          conditions.push({ field: 'column_id', op: '=', value: thisColumn.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });

          let orderBy = [];
          orderBy.push({ field: 'publish_at', sort: 'DESC' });
          orderBy.push({ field: 'id', sort: 'DESC' });

          service_module.article({ conditions: conditions }, function(result) {
            if (result.length > 0) {
              result.map(function(item) {
                item.route = fetchArticleRoute(item);
                if (item.image && item.image.charAt(0) != '/') {
                  item.image = '/' + item.image;
                }
                thisColumnArtilce.push(item);
              });
            }
            callback();
          });
        }

      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.articleList = thisColumnArtilce;
      data.column = thisColumn;
      data.banner = banner;

      data.city_id = city.id;
      data.currentCity = city;
      data.isHome = false;

      res.render('mobile/column', data);
    }
  );
});

// 名师团队、星级老师、专职老师页
router.get('/mingshituandui/*', function(req, res, next) {
  let city = null;
  let banner = null;
  let teachers = [];
  let thisColumn = config.topMenu[5];
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'teacher' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [{ field: 'city_id', op: '=', value: city.id }];
        service_module.teacher({ conditions: conditions }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchTeacherRoute(item);
              if (item.avatar && item.avatar.charAt(0) != '/') {
                item.avatar = '/' + item.avatar;
              }
              teachers.push(item);
            });
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.teachers = teachers;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'teachers', req, res, next);
    }
  );
});

// 老师介绍页
router.get('/teacher/:year/:month/:day/:id([0-9]+).html', function(req, res, next) {
  let city = null;
  let relatedTeacherList = [];
  let teacher = null;
  let banner = null;
  let thisColumn = config.topMenu[5];
  let data = { title: '老师', column_id: 0, css: 'teacher' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [{ field: 'id', op: '=', value: req.params.id }, { field: 'city_id', op: '=', value: city.id }];
        service_module.teacher({ conditions: conditions }, function(result) {
          if (result.length > 0) {
            teacher = result[0];
            teacher.publish_date = moment(teacher.created_at).format('YYYY.MM.DD');
            teacher.author = '小编';
            teacher.source = '选师无忧';
            data.title = teacher.nick_name;
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'id', op: '<>', value: req.params.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        let orderBy = [{ field: 'RAND()' }];

        service_module.teacher({ conditions: conditions, order: orderBy, limit: [0, 5] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchTeacherRoute(item);
              if (item.avatar && item.avatar.charAt(0) != '/') {
                item.avatar = '/' + item.avatar;
              }
              relatedTeacherList.push(item);
            });
          }
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.teacher = teacher;
      data.relatedTeacherList = relatedTeacherList;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'teacher', req, res, next);
    }
  );
});

// 提分案例页
router.get('/tifenanli/', function(req, res, next) {
  let city = null;
  let banner = null;
  let thisColumn = config.topMenu[6];
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'tifenanli' };
  let articleList = [],
    jiazhangfankui = [],
    student = [];
  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let orderBy = [{ field: 'RAND()' }];
        service_module.student({ order: orderBy, limit: [0, 5] }, function(result) {
          student = result;
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: config.jiazhangfankui.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });
        conditions.push({ field: 'image', op: '<>', value: '' });
        conditions.push({ field: 'image', op: '!isnull' });

        let orderBy = [];
        orderBy.push({ field: 'publish_at', sort: 'DESC' });
        orderBy.push({ field: 'id', sort: 'DESC' });

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 3] }, function(result) {
          jiazhangfankui = result;
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.articleList = articleList;
      data.student = student;
      data.jiazhangfankui = jiazhangfankui;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'tifenanli', req, res, next);
    }
  );
});

// 找老师
router.get('/zhaolaoshi/', function(req, res, next) {
  let city = null;
  let thisColumn = config.findTeacher;
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'findTeacher' };
  let student = [];

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let orderBy = [{ field: 'RAND()' }];
        service_module.student({ order: orderBy, limit: [0, 5] }, function(result) {
          result.map(function(item) {
            if (item.name.length > 2) {
              let tempName = item.name.substring(1, item.name.length - 1);
              item.name = item.name.replace(tempName, '*');
            }
            student.push(item);
          });
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.student = student;

      data.city_id = city.id;
      data.currentCity = city;
      data.isHome = false;

      res.render('mobile/zhaolaoshi', data);
      //            renderData(data, 'zhaolaoshi', req, res, next);
    }
  );
});

// 无忧概况
router.get('/xuanshiwuyou/', function(req, res, next) {
  let city = null;
  let relatedArticleList = [],
    banner = null;
  let thisColumn = config.subMenu[0];
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'wuyou' };
  //let data = { title: config.subMenu[0].name, column_id: config.subMenu[0].id, css: 'wuyou' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: config.columnNews.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        let orderBy = [{ field: 'RAND()' }];

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 5] }, function(result) {
          result.map(function(item) {
            item.route = fetchArticleRoute(item);
            if (item.image && item.image.charAt(0) != '/') {
              item.image = '/' + item.image;
            }
            relatedArticleList.push(item);
          });
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.relatedArticleList = relatedArticleList;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'xuanshiwuyou', req, res, next);
    }
  );
});

// 无忧路线
router.get('/wuyouluxian/', function(req, res, next) {
  let city = null;
  let relatedArticleList = [],
    banner = null;
  let thisColumn = config.subMenu[3];
  let data = { title: thisColumn.name, column_id: thisColumn.id, css: 'wuyou' };

  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchBanner(thisColumn, 'wappage', (result) => {
          if (result.length > 0) {
            banner = result[0];
          }
          callback();
        });
      },
      function(callback) {
        let conditions = [];
        conditions.push({ field: 'column_id', op: '=', value: config.columnNews.id });
        conditions.push({ field: 'city_id', op: '=', value: city.id });

        let orderBy = [{ field: 'RAND()' }];

        service_module.article({ conditions: conditions, order: orderBy, limit: [0, 5] }, function(result) {
          result.map(function(item) {
            item.route = fetchArticleRoute(item);
            if (item.image && item.image.charAt(0) != '/') {
              item.image = '/' + item.image;
            }
            relatedArticleList.push(item);
          });
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.seoTitle = thisColumn ? replaceSeo(thisColumn.title, city) : config.config.siteName;
      data.keywords = thisColumn ? replaceSeo(thisColumn.keywords, city) : '';
      data.description = thisColumn ? replaceSeo(thisColumn.description, city) : '';
      data.banner = banner;
      data.relatedArticleList = relatedArticleList;

      data.city_id = city.id;
      data.currentCity = city;

      renderData(data, 'wuyouluxian', req, res, next);
    }
  );
});

// 优惠活动
router.get('/youhuihuodong/', function(req, res, next) {
  fetchColumnArticleList(config.subMenu[2], req, res, next);
});

// 新闻头条
router.get('/xinwentoutiao/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews, config.columnNews.childColumns[0].id, req, res, next);
});

// 家长加油
router.get('/jiazhangjiayou/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[0], config.columnNews.childColumns[1].id, req, res, next);
});

// 中考资讯
router.get('/zhongkaozixun/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[1], config.columnNews.childColumns[2].id, req, res, next);
});

// 高考资讯
router.get('/gaokaozixun/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[2], config.columnNews.childColumns[3].id, req, res, next);
});

// 家教微问
router.get('/jiajiaoweiwen/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[3], config.columnNews.childColumns[4].id, req, res, next);
});

// 升学资讯
router.get('/shengxuezixun/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[4], config.columnNews.childColumns[5].id, req, res, next);
});

// 学科辅导
router.get('/xuekefudao/', function(req, res, next) {
  fetchNewsArticleList(config.columnNews.childColumns[5], config.columnNews.id, req, res, next);
});

// 文章页
router.get('/article/:year/:month/:day/:id([0-9]+).html', function(req, res, next) {
  let city = null;
  let relatedArticleList = [];
  let articleColumn = null;
  let article = null;
  let banner = null;
  let data = { title: '文章', column_id: 0, css: 'article' };

  if (check(req)) {
    async.series([
        function(callback) {
          fetchCurrentCity(req, res, (result) => {
            city = result;
            callback();
          });
        },
        function(callback) {
          let conditions = [];
          conditions.push({ field: 'id', op: '=', value: req.params.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });

          service_module.article({ conditions: conditions }, function(result) {
            if (result.length > 0) {
              article = result[0];
              article.publish_date = moment(article.publish_at).format('YYYY.MM.DD');
              article.author = '小编';
              article.source = '选师无忧';
              data.column_id = article.column_id;
            }
            callback();
          });
        },
        function(callback) {
          if (article) {
            let conditions = [];
            conditions.push({ field: 'id', op: '<>', value: req.params.id });
            conditions.push({ field: 'city_id', op: '=', value: city.id });
            conditions.push({ field: 'column_id', op: '=', value: article.column_id });

            service_module.article({ conditions: conditions }, function(result) {
              if (result.length > 0) {
                result.map(function(item) {
                  item.route = fetchArticleRoute(item);
                  if (item.image && item.image.charAt(0) != '/') {
                    item.image = '/' + item.image;
                  }
                  relatedArticleList.push(item);
                });
              }
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          if (article) {
            fetchColumn(article.column_id, (result) => {
              if (result.length > 0) {
                articleColumn = result[0];
              }
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          if (articleColumn) {
            fetchBanner(articleColumn, 'wappage', (result) => {
              if (result.length > 0) {
                banner = result[0];
              }
              callback();
            });
          } else {
            callback();
          }
        }
      ],
      function(err) {
        if (err) {
          console.log("[article fetch Error]:", err);
          return next(err);
        }
        data.title = article ? article.title : '';
        data.seoTitle = article ? article.title : '';
        data.seoTitle += '_找好老师|选师无忧';
        data.keywords = article ? article.keywords : '';
        data.keywords += '_找好老师|选师无忧';
        data.description = article ? article.description : '';
        data.banner = banner;
        data.article = article;
        data.relatedArticleList = relatedArticleList;

        data.city_id = city.id;
        data.currentCity = city;

        res.render('mobile/article', data);
      }
    );
  } else {
    let webTopColumns = config.webTopColumns; //电脑版顶部栏目
    let webAllColumns = config.webAllFirstColumns; //全部科目
    let cityList = [];
    let breadcrumb = [];
    let links = [];
    let prevArticle = null,
      nextArticle = null;
    async.series([
        function(callback) {
          fetchCurrentCity(req, res, (result) => {
            city = result;
            callback();
          });
        },
        function(callback) {
          let conditions = [];
          conditions.push({ field: 'id', op: '=', value: req.params.id });
          conditions.push({ field: 'city_id', op: '=', value: city.id });

          service_module.article({ conditions: conditions }, function(result) {
            if (result.length > 0) {
              article = result[0];
              article.publish_date = moment(article.publish_at).format('YYYY-MM-DD HH:mm:ss');
              article.author = '小编';
              article.source = '选师无忧';
              data.column_id = article.column_id;
            }
            callback();
          });
        },
        function(callback) {
          fetchWebTopColumn((result) => {
            webTopColumns = result;
            callback();
          });
        },
        function(callback) {
          fetchWebAllColumn((result) => {
            webAllColumns = result;
            callback();
          });
        },
        function(callback) {
          fetchCityList((result) => {
            cityList = result;
            callback();
          });
        },
        function(callback) {
          // links
          fetchWebLinks((result) => {
            links = result;
            callback();
          });
        },
        function(callback) {
          // Banner
          if (article) {
            fetchBanner(article.column_id, 'webpage', (result) => {
              if (result.length > 0) {
                banner = result[0];
              }
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // breadcrumb
          if (article) {
            fetchBreadcrumb(breadcrumb, article.column_id, (result) => {
              breadcrumb = result;
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // 推荐阅读
          if (article) {
            let conditions = [];
            conditions.push({ field: 'id', op: '<>', value: article.id });
            conditions.push({ field: 'column_id', op: '=', value: article.column_id });
            conditions.push({ field: 'city_id', op: '=', value: city.id });

            let orderBy = [{ field: 'RAND()' }];

            service_module.article({ conditions: conditions, order: orderBy, limit: [0, 6] }, function(result) {
              if (result.length > 0) {
                result.map(function(item) {
                  item.route = fetchArticleRoute(item);
                  if (item.image && item.image.charAt(0) != '/') {
                    item.image = '/' + item.image;
                  }
                  relatedArticleList.push(item);
                });
              }
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // 上一条
          if (article) {
            let sql = 'SELECT * FROM `article` WHERE `id` = (SELECT max(`id`) FROM `article` WHERE `id` < ' + article.id + ' AND `column_id` = ' + article.column_id + ' AND `city_id` = ' + mysql_escape(city.id) + ' AND `status` = 1 AND `publish_at` <= NOW()) AND `column_id` = ' + article.column_id + ' AND `city_id` = ' + mysql_escape(city.id) + ' AND `status` = 1 AND `publish_at` <= NOW() LIMIT 1';
            if (config.db.logSQL) console.log("[fetch article sql]:", sql);
            pool.query(sql, function(err, result) {
              if (err) {
                console.log("[fetch article error]:", err);
                return next(err);
              } else {
                if (result.length > 0) {
                  prevArticle = result[0];
                  prevArticle.title = prevArticle.title.length > 18 ? prevArticle.title.substring(0, 18) + '...' : prevArticle.title;
                  prevArticle.route = fetchArticleRoute(prevArticle);
                }
              }
              callback();
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // 下一条
          if (article) {
            let sql = 'SELECT * FROM `article` WHERE `id` = (SELECT min(`id`) FROM `article` WHERE `id` > ' + article.id + ' AND `column_id` = ' + article.column_id + ' AND `city_id` = ' + mysql_escape(city.id) + ' AND `status` = 1 AND `publish_at` <= NOW()) AND `column_id` = ' + article.column_id + ' AND `city_id` = ' + mysql_escape(city.id) + ' AND `status` = 1 AND `publish_at` <= NOW() LIMIT 1';
            if (config.db.logSQL) console.log("[fetch article sql]:", sql);
            pool.query(sql, function(err, result) {
              if (err) {
                console.log("[fetch article error]:", err);
                return next(err);
              } else {
                if (result.length > 0) {
                  nextArticle = result[0];
                  nextArticle.title = nextArticle.title.length > 18 ? nextArticle.title.substring(0, 18) + '...' : nextArticle.title;
                  nextArticle.route = fetchArticleRoute(nextArticle);
                }
              }
              callback();
            });
          } else {
            callback();
          }
        }
      ],
      function(err) {
        if (err) {
          console.log("[article fetch Error]:", err);
          return next(err);
        }
        data.title = article ? article.title : '';
        data.seoTitle = article ? article.title : '';
        data.seoTitle += '_找好老师|选师无忧';
        data.keywords = article ? article.keywords : '';
        data.keywords += '_找好老师|选师无忧';
        data.description = article ? article.description : '';

        data.city_id = city.id;
        data.cityList = cityList;
        data.currentCity = city;

        data.webTopColumns = webTopColumns;
        data.webAllColumns = webAllColumns;
        data.banner = banner;
        data.links = links;
        data.breadcrumb = breadcrumb;
        data.article = article;
        data.prevArticle = prevArticle;
        data.nextArticle = nextArticle;
        data.relatedArticleList = relatedArticleList;
        data.isHome = false;

        res.render('desktop/article', data);
      }
    );
    //res.render('desktop/column', { title: '栏目标题' });
  }
});

router.get('/search', function(req, res, next) {
  console.log('search', req.query);
  let data = { title: '搜索页面' };
  res.render('desktop/search', data);
});

// 动态获取文章列表
router.post('/api/article/list', function(req, res, next) {
  let city_id = fetchCurrentCityId(req, res);
  if (check(req)) {
    let column_id = req.body.column_id;
    if (!column_id) {
      res.send({ code: 111, message: '缺少要查询的栏目编号', results: [] });
      return;
    }
    let page = req.body.page || 1;
    let page_size = req.body.page_size || config.config.PAGE_SIZE;
    let offset = (page - 1) * page_size;
    let limit = page_size;
    let data = [];

    let conditions = [];
    conditions.push({ field: 'column_id', op: '=', value: column_id });
    conditions.push({ field: 'city_id', op: '=', value: city_id });

    let orderBy = [];
    orderBy.push({ field: 'publish_at' });
    orderBy.push({ field: 'id' });

    service_module.article({ conditions: conditions, order: orderBy, limit: [offset, limit] }, function(result) {
      if (result.length > 0) {
        result.map(function(item) {
          item.route = fetchArticleRoute(item);
          if (item.image && item.image.charAt(0) != '/') {
            item.image = '/' + item.image;
          }

          data.push(item);
        });
      }

      res.send({ code: 200, message: 'OK', results: data });
    });
  } else {
    let data = [];
    let thisColumn = req.body.column;
    let page = req.body.page;
    let page_size = req.body.page_size || 10;

    if (!thisColumn) {
      res.send({ code: 111, message: '缺少要查询的栏目', results: [] });
      return;
    }

    if (!page) {
      res.send({ code: 112, message: '缺少要查询的页数', results: [] });
      return;
    }

    try {
      thisColumn = JSON.parse(thisColumn);
    } catch (err) {
      res.send({ code: 114, message: '传递的参数不正确。', results: [] });
      return;
    }

    let offset = (page - 1) * page_size;
    let limit = page_size;

    let conditions = [];
    conditions.push({ field: 'city_id', op: '=', value: city_id });

    let orderBy = [];
    orderBy.push({ field: 'publish_at' });
    orderBy.push({ field: 'id' });

    if (thisColumn.id) {
      let childColumns = [];

      fetchAllChildColumn(thisColumn, (result) => {
        if (result.length > 0) {
          childColumns = result;
        }
        childColumns.push(thisColumn.id);

        conditions.push({ field: 'column_id', op: 'IN', value: childColumns.join(',') });

        service_module.article({ conditions: conditions, order: orderBy, limit: [offset, limit] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.publish_at).format('YYYY-MM-DD');
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }

              data.push(item);
            });
          }

          res.send({ code: 200, message: 'OK', results: data });
        });
      });
    } else {
      let columnConditions = [{ field: 'name', op: '=', value: thisColumn.name }];

      service_module.column({ conditions: columnConditions }, function(result) {
        let column_ids = [];
        if (result.length > 0) {
          result.map((item) => {
            column_ids.push(item.id);
          });
        }
        conditions.push({ field: 'column_id', op: 'IN', value: column_ids.join(', ') });
        service_module.article({ conditions: conditions, order: orderBy, limit: [offset, limit] }, function(result) {
          if (result.length > 0) {
            result.map(function(item) {
              item.route = fetchArticleRoute(item);
              item.publish_date = moment(item.publish_at).format('YYYY-MM-DD');
              if (item.image && item.image.charAt(0) != '/') {
                item.image = '/' + item.image;
              }

              data.push(item);
            });
          }

          res.send({ code: 200, message: 'OK', results: data });
        });
      });
    }
  }
});

// 设置城市
router.post('/api/set/city', function(req, res, next) {
  console.log('[Set City]:', req.body);
  let city_id = req.body.city_id;
  let city_name = req.body.city_name;

  if (!city_id || !city_name) {
    res.send({ code: 111, message: '缺少要切换的城市' });
    return;
  }

  let sql = '';

  if (city_id && city_id != '0') {
    fetchCityForId(city_id, (result) => {
      setCity(result, req, res);
    });
  } else if (city_name) {
    fetchCityForName(city_name, (result) => {
      setCity(result, req, res);
    });
  }
});

// 搜索城市
router.post('/api/search/city', function(req, res, next) {
  let city_name = req.body.city_name;

  if (!city_name) {
    let conditions = [];
    service_module.city({ conditions: conditions }, function(result) {
      res.send({ code: 200, message: 'OK', results: result });
    });
  } else {
    fetchCityForName(city_name, (result) => {
      res.send({ code: 200, message: 'OK', results: result });
    });
  }
});

function setCity(result, req, res) {
  if (result.length > 0 && result[0].opened == 1) {
    req.defaultCity = result[0];
    res.clearCookie('current_city_id', options);
    res.clearCookie('current_city', options);
    res.cookie('current_city_id', result[0].id, options);
    res.cookie('current_city', result[0], options); //req.path
    redirectURL = req.protocol + '://' + result[0].pinyin + '.' + config.config.redirectSite;
    //res.end('已设置当前城市');
    res.send({ code: 200, message: 'OK', redirectURL: redirectURL });
  } else {
    res.send({ code: 113, message: '当前城市正在开通中，敬请期待...' });
  }
}

function replaceSeo(str, city) {
  if (str) {
    let reg = new RegExp('{CITY_NAME}', 'g');
    return str.replace(reg, city.name);
  } else {
    return '';
  }
}

function fetchCityForId(cityId, callback) {
  let conditions = [{ field: 'id', op: '=', value: cityId }];
  service_module.city({ conditions: conditions }, function(result) {
    callback(result);
  });
}

function fetchCityForPinyin(cityPinyin, callback) {
  let conditions = [{ field: 'pinyin', op: '=', value: cityPinyin }];
  service_module.city({ conditions: conditions }, function(result) {
    callback(result);
  });
}

function fetchCityForName(cityName, callback) {
  let conditions = [];
  let subCityName = cityName.substring(0, cityName.length - 1);
  console.log('[fetchCityForName]', subCityName);
  conditions.push({ field: 'name', op: '=', value: cityName });
  conditions.push({ field: 'name', op: 'LIKE_AFTER', value: cityName });
  conditions.push({ field: 'name', op: '=', value: subCityName });
  conditions.push({ field: 'name', op: 'LIKE_AFTER', value: subCityName });
  conditions.push({ field: 'pinyin', op: '=', value: cityName });
  conditions.push({ field: 'pinyin', op: 'LIKE_AFTER', value: cityName });

  let multi_conditions = [];
  multi_conditions.push({ conditions: conditions, conditions_op: 'or' });

  service_module.city({ multi_conditions: multi_conditions }, function(result) {
    callback(result);
  });
}

function fetchColumn(columnId, callback) {
  let conditions = [{ field: 'id', op: '=', value: columnId }];
  service_module.column({ conditions: conditions }, function(result) {
    callback(result);
  });
}

function fetchBanner(column, position, callback) {
  let conditions = [];
  conditions.push({ field: 'position', op: '=', value: position });
  if (column && column.banner_id > 0) {
    conditions.push({ field: 'id', op: '=', value: column.banner_id });
  } else {
    conditions.push({ field: 'default', op: '=', value: 1 });
  }

  service_module.banner({ conditions: conditions }, function(result) {
    callback(result);
  });
}

router.post('/web/subteacher', function(req, res) {
  let body = req.body;
  console.log(body);
  if (body.realname == '') {
    return res.json(400, { error: '名字错误' });
  }

  if (body.course == '') {
    return res.json(400, { error: '请填写需要学习的科目' });
  }

  if (body.phone == '') {
    return res.json(400, { error: '请填写您的手机号码' });
  }

  var phoneReg = /^1(3|4|5|6|7|8)\d{9}$/;
  if (!phoneReg.test(body.phone)) {
    return res.json(400, { error: '请填写正确的手机号码' });
    //$('.tip', '.helpFindTeacherBox').text('请填写正确的手机号码');
  }

  request
  //.post('http://120.25.134.3/web/home/requestTeacher')
  //.post('http://51xuanshi.com/web/home/requestTeacher')
    .post('https://admin.core.51xuanshi.com/api/demand/findTeacher')
    .send(body)
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    .end(function(err, upres) {
      if (err)
        console.log(err)
      console.log(upres.status)
      console.log(upres.body)
      if (upres.body.ret) {
        res.json(412, { error: upres.body.msg });
      } else {
        res.json({ status: 0 });
      }
      // Calling the end function will send the request
    });
})

router.get('/mobile/download', function(req, res) {
  let thisColumn = config.topMenu[0];
  let data = { title: config.config.siteName, column_id: thisColumn.id, css: 'download' };
  data.currentSection = "APP下载";

  res.render('mobile/download', data);
});


router.get('/student/download.html', function(req, res) {
 res.redirect('http://www.51xuanshi.com/mobile/download');
});


router.get('/zt/tbkc/:year/:month/:day/:id([0-9]+).html', function(req, res) {
  res.redirect('http://www.51xuanshi.com/sem');
});

router.get('/zt/about/:year/:month/:day/:id([0-9]+).html', function(req, res) {
  res.redirect('http://www.51xuanshi.com/sem/about');
});

router.get('/api/home', function(req, res, next) {
  let city = null;
  let thisColumn = config.topMenu[0];
  let data = { title: config.config.siteName, column_id: thisColumn.id, css: 'index' };
  let cityList = [];
  let banners = [];
  async.series([
      function(callback) {
        fetchCurrentCity(req, res, (result) => {
          city = result;
          callback();
        });
      },
      function(callback) {
        fetchColumn(thisColumn.id, (result) => {
          if (result.length > 0) {
            thisColumn = result[0];
          }
          callback();
        });
      },
      function(callback) {
        fetchCityList((result) => {
          cityList = result;
          callback();
        });
      },
      function(callback) {
        let conditions = [{ field: 'position', op: '=', value: 'waphome' }];
        service_module.banner({ conditions: conditions }, function(result) {
          banners = result;
          callback();
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("[index fetch Error]:", err);
        return next(err);
      }
      data.city_id = city.id;
      data.cityList = cityList;
      data.currentCity = city;

      data.seoTitle = replaceSeo(thisColumn.title, city);
      data.keywords = replaceSeo(thisColumn.keywords, city);
      data.description = replaceSeo(thisColumn.description, city);
      data.banners = banners;
      data.isHome = true;
      data.home_menu = {
        online: config.online,
        topMenu: config.topMenu,
        findTeacher: config.findTeacher,
        subMenu: config.subMenu,
        jiazhangfankui: config.jiazhangfankui,
        columnNews: config.columnNews,
        webAllFirstColumns: config.webAllFirstColumns,
        webOtherColumns: config.webOtherColumns,
      }
      res.json(data);
    }
  );
})






module.exports = router;