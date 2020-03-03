/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:58:48
 * @modify date 2020-03-03 10:58:48
 * @desc [description]
 */
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const redis = require('redis')
var RedisStore = require('connect-redis')(session);
var cron = require('./cron');
require('dotenv').config();

//global values
global.sessionConfig = {
  cookie:{
    secure:false,
    maxAge: 1000 * 60 * process.env.cookie_expire,//cookie过期时间设置,单位为毫秒
    httpOnly:true,
  },
  sessionStore:{
    host:process.env.REDIS_HOST,
    port:process.env.REDIS_PORT,
    password:process.env.REDIS_PASSWORD,
    ttl: 60 * process.env.cookie_expire,//单位为秒
    db:process.env.REDIS_DB,
    logErrors: true
  },
  calcStore:{
    host:process.env.REDIS_HOST,
    port:process.env.REDIS_PORT,
    password:process.env.REDIS_PASSWORD,
    prefix:'cron-',
    db:process.env.REDIS_DB,
    logErrors: true
  }
}
var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



console.log("connecting...redis: ",global.sessionConfig.sessionStore.host)
var redisClient = redis.createClient(global.sessionConfig.sessionStore)

//访问在public内的静态文件
app.use('/public',express.static(path.join(__dirname, 'public')));

//定时
app.use(cron)

app.all("*",function(req,res,next){
  //设置允许跨域的域名，*代表允许任意域名跨域
  // res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Origin",req.header("origin"));
  //允许的header类型
  // res.header("Access-Control-Allow-Headers","*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Access-Token");
  //cookie
  res.header("Access-Control-Allow-Credentials",true)
  //跨域允许的请求方式 
  res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
  // console.log("CROS",res)
  if (req.method.toLowerCase() == 'options'){
    console.log("GET OPTIONS")
    res.sendStatus(200); //让ions尝试请求快速结束
    // res.status(204);
    //return res.json({});
  }
  else
     next();
});


//session
app.use(session({
  store:new RedisStore({client:redisClient}),
  secret:'yiqing is handsome',//对session id相关的cookie进行签名
  resave:true,//每次请求都重新设置session,反正在auth中已经做了筛选,所以这里要写false
  rolling:true,//是否按照原设定的maxAge值重设session同步到cookie中
  saveUninitialized:true,//是否保存未初始化的会话,我设置为不保存,为了仅在登录成功后保存
  cookie:global.sessionConfig.cookie //不再自动设置
}))
app.use('/',authRouter)
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    result:1,
    msg:'参数错误,请检查api参数.如若确认正确,联系小猿处理'
  })
  // res.render('error');
});

module.exports = app;
