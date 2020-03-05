/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:59:36
 * @modify date 2020-03-03 10:59:36
 * @desc [description]
 */
var express = require('express');
var router = express.Router();

router.all(/^\/.*?(?<!login)$/, function(req, res, next) {
  //session auth
  // console.log("1",req.session)
  // console.log("2",req.cookies)
  if(req.path.split('/')[req.path.split('/').length-1] === 'logout'){
    next()
  }
  else 
  
  if(!req.session.user ){
    res.send(401,'登录已过期,请重新登陆')
  }else{
    //通过验证
    console.log('通过验证')
    next()
  }
});

module.exports = router;
