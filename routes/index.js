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

var multer = require('multer')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login',auth_controller.login)
.get('/logout',auth_controller.logout)
.get('/test',auth_controller.test)
.post('/user/add',admin_controller.add)
.post('/mobile/code/get',auth_controller.getSms)
.post('/mobile/logup',auth_controller.mobileLogUp)
.post('/mobile/login',auth_controller.mobileLogIn)


//file option
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.FILE_DES?process.env.FILE_DES:'./public/uploads')
    // cb(null, './public/uploads')

  },
  filename: function (req, file, cb) {
    var fileFormat = (file.originalname).split(".");
    cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1])
  }
})
var upload = multer({storage:storage});
var imgBaseUrl = '../'

//input attrubute must be files
router.post('/files/upload',upload.array('files',2),function(req,res,next){
  console.log('req.files',req.files)
  var files = req.files;
  //define return 
  var result = {};
  if(!files[0]){
    res.json({
      result:1,
      msg:'upload failed'
    })
  }else{
    res.json({
      result:0,
      msg:'upload successfully',
      url: files[0].path
    })
  }
})
module.exports = router;
