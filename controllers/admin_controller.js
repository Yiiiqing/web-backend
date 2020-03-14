/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 11:07:21
 * @modify date 2020-03-03 11:07:21
 * @desc [description]
 */
var models = require('../db/models')

module.exports = {
  //post
  add: (req, res, next) => {
    let data = req.body
    models.Admin.findOrCreate({
      where: {
        username: data.username
      },
      defaults: data
    })
      .then(([doc, created]) => {
        console.log(doc)
        if (created) {
          res.json({
            result: 0,
            msg: 'Success'
          })
        } else {
          res.json({
            result: 1,
            msg: 'Failed. The User exists.'
          })
        }
      })
      .catch(err => {
        next(err)
      })
  },
  //post
  update: (req, res, next) => {
    let data = req.body
    models.Admin.update(data, {
      where: {
        username: data.username
      }
    })
      .then(updated => {
        console.log(updated[0])
        if (updated[0]) {
          res.json({
            result: 0,
            msg: 'Success'
          })
        } else {
          res.json({
            result: 1,
            msg: 'Failed'
          })
        }
      })
      .catch(err => {
        next(err)
      })
  },
  //get
  get: (req, res, next) => {
    let data = req.query
    models.Admin.findOne({
      where: {
        username: data.username
      }
    })
      .then(doc => {
        if (doc) {
          res.json({
            result: 0,
            msg: 'Success',
            data: doc
          })
        } else {
          res.json({
            result: 1,
            msg: 'Failed'
          })
        }
      })
      .catch(err => {
        next(err)
      })
  },
  //post
  delete: (req, res, next) => {
    let data = req.body
    models.Admin.destroy({
      where: {
        username: data.username
      }
    })
      .then(destroyed => {
        if (destroyed) {
          res.json({
            result: 0,
            msg: 'Success'
          })
        } else {
          res.json({
            result: 1,
            msg: 'Failed'
          })
        }
      })
      .catch(err => {
        next(err)
      })
  }
}