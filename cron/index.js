/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:59:05
 * @modify date 2020-03-03 10:59:05
 * @desc [description]
 */
var schedule = require('node-schedule')
var job;
module.exports = function(req,res,next) {
  if(!!job){
  }else{
    job = schedule.scheduleJob('0 * * * * *', function() {
      console.log('The answer to life, the universe, and everything!')
    })
  }
  next()
}