/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:59:43
 * @modify date 2020-03-03 10:59:43
 * @desc [description]
 */
var express = require('express');
var router = express.Router();

var auth_controller = require('../controllers/auth')
var admin_controller = require('../controllers/admin_controller')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login',auth_controller.login)
.get('/logout',auth_controller.logout)
.get('/test',auth_controller.test)
.post('/user/add',admin_controller.add)
module.exports = router;
