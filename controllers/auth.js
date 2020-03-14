/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:59:01
 * @modify date 2020-03-11 16:32:12
 * @desc [description]
 */
/**
 * login file
 */
const models = require('../db/models')
const redis = require('redis')
var client = redis.createClient(global.Config.redisStore)

//use tencent sms service
var QcloudSms = require('qcloudsms_js')
//app id
var appid = process.env.SMS_appid
//app key
var appkey = process.env.SMS_appkey
//template id
var templateId = process.env.SMS_templateId
//smsSign
var smsSign = process.env.SMS_sign
// instance QcloudSms
var qcloudsms = QcloudSms(appid, appkey)
//callback
function callback(err, res, resData) {
  if (err) {
    console.log('err: ', err)
  } else {
    console.log('request data: ', res.req)
    console.log('response data: ', resData)
  }
}
//随机生成验证码
function RndNum(n) {
  var rnd = ''
  for (var i = 0; i < n; i++) rnd += Math.floor(Math.random() * 10)
  return rnd
}
var ssender = qcloudsms.SmsSingleSender()

module.exports = {
  login: (req, res, next) => {
    let data = req.body
    if (data.username && data.password) {
      models.Admin.findOne({
        where: {
          username: data.username,
          password: data.password
        },
        attributes: {
          exclude: ['password']
        },
        raw: 'true'
      }).then(doc => {
        if (!doc) {
          res.json({
            result: 1,
            msg: 'Error'
          })
        } else {
          req.session.user = doc
          req.session.time = Date.parse(new Date())
          console.log(req.session)

          res.json({
            result: 0,
            msg: 'Success',
            user: doc
          })
          //处理session
        }
      })
    } else {
      next()
    }
  },
  /**
   * logout, clear session
   */
  logout: (req, res, next) => {
    let loginOutUser = req.session.user.name
    req.session.destroy(err => {
      if (err) {
        console.log('session destroy error: ', err)
        res.json({
          result: 1,
          msg: 'logout error: ',
          err
        })
      } else {
        res.json({
          result: 0,
          msg: `${loginOutUser} logout success.`
        })
      }
    })
  },
  /**
    mobile log up
    post request
    */
  mobileLogIn: async (req, res, next) => {
    let data = req.body
    if (!data.mobile) {
      return next()
    }
    //mobile number
    var phoneNumber = data.mobile
    //need to check if user is the owner of the number
    var code = data.code
    client.get(phoneNumber, function(err, reply) {
      if (reply !== code) {
        return res.json({
          result: 1,
          msg: 'Code expired or does not match. Please get a new one.'
        })
      }
      //pass authentication
      //check if user table has it.
      models.Admin.findOne({
        where: {
          username: phoneNumber
        }
      }).then(doc => {
        if (!doc) {
          //no such user.
          return res.json({
            result: 1,
            msg: 'Not registered'
          })
        }
        //has user,then pass
        res.json({
          result: 0,
          msg: 'Allow login'
        })
      })
    })
  },
  /**
    mobile log up
    share table with admin login
  */
  mobileLogUp: async (req, res, next) => {
    let data = req.body
    if (!data.mobile || !data.code) {
      return next()
    }
    //need to check if user is the owner of the number
    //get data from redis
    var phoneNumber = data.mobile
    var code = data.code
    client.get(phoneNumber, function(err, reply) {
      if (reply !== code) {
        return res.json({
          result: 1,
          msg: 'Code expired or does not match. Please get a new one.'
        })
      }
      //pass authentication
      models.Admin.findOrCreate({
        where: {
          username: phoneNumber
        }
      }).then(([doc, created]) => {
        if (!created) {
          //already exists.
          return res.json({
            result: 1,
            msg: 'Already exists.'
          })
        }
        res.json({
          result: 0,
          msg: 'Registered successfully'
        })
      })
    })
  },
  /**
    send sms code 
  */
  getSms: (req, res, next) => {
    let data = req.body
    if (!data.mobile) {
      return next()
    }
    //mobile number
    var phoneNumber = data.mobile
    //has mobile number
    var VerificationCode = RndNum(5)
    // redis,update or insert
    //{mobile:code}
    client.set(phoneNumber, VerificationCode, function(err, result) {
      res.json({
        result: 0,
        msg: 'code sent'
      })
    })
    client.expire(phoneNumber, process.env.SMS_code_expire)

    var params = [VerificationCode, '5']
    //send
    ssender.sendWithParam('86', phoneNumber, templateId, params, smsSign, '', '', callback)
  },
  test: (req, res, next) => {
    res.json(req.session)
  }
}
