/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-12 16:17:30
 * @modify date 2020-03-13 19:27:34
 * @desc [description]
 */
var XLSX = require('xlsx')
var fs = require('fs')
var path = require('path')
var async = require('async')
const spawn = require('cross-spawn')
var colors = require('colors')
const child_process = require('child_process')

var force = false
var modelNameArray = []
var modelIdArray = []

async function scaffold() {
    //check --force option
    if (process.argv[2] === '--force') {
        force = true
    }
    console.log(`force option --> ${force}`.brightBlue)
    await createSequelizeFile()
    await initSequelize()
    await createDatabaseConfig()
    await rewritemodelIndex()
    await generateModel()
    await generateRouter()
    await addRouterToApp()
    await generateController()
}

async function queryUser(query, choices) {
    // console.log(process.stdin.isPaused(),process.stdin.once());
    process.stdout.write(query.bgRed + choices.gray)
    return new Promise((resolve, reject) => {
        //after a long time effort. I found this should be once
        process.stdin.once('readable', () => {
            let chunk
            // get input
            while ((chunk = process.stdin.read()) !== null) {
                process.stdout.write(`Your choice: ${chunk}`)
                chunkString = chunk.toString().trim()
                if (chunkString.indexOf('yes') !== -1) {
                    return resolve(true)
                } else {
                    return resolve(false)
                }
            }
        })
        // let test = process.stdin.eventNames()
        // console.log(test)
    }).catch(err => {
        console.log(err)
    })
}
async function queryUserString(query, choices) {
    // console.log(process.stdin.isPaused(),process.stdin.once());
    process.stdout.write(query.bgRed + choices.gray)
    return new Promise((resolve, reject) => {
        //after a long time effort. I found this should be once
        process.stdin.once('readable', () => {
            let chunk
            // get input
            while ((chunk = process.stdin.read()) !== null) {
                process.stdout.write(`Your choice: ${chunk}`)
                chunkString = chunk.toString().trim()
                resolve(chunkString)
            }
        })
        // let test = process.stdin.eventNames()
        // console.log(test)
    }).catch(err => {
        console.log(err)
    })
}

async function initSequelize() {
    //install sequelize-cli
    const installCli = spawn.sync('npm', ['install', 'sequelize-cli', '--save'], { stdio: 'inherit' })
    //init cli
    const initCli = spawn.sync('npx', ['sequelize-cli', 'init'], { stdio: 'inherit' })
}
async function createSequelizeFile() {
    //create seqeulize config file
    new Promise((resolve, reject) => {
        let result = fs.writeFileSync(path.join(__dirname, '../', '.sequelizerc'), sequelizeConfigTEXT)
        if (fs.existsSync(path.join(__dirname, '../', '.sequelizerc'))) {
            console.log('generate .sequelizerc successfully')
            resolve()
        } else {
            reject()
        }
    })
}
async function rewritemodelIndex() {
    //rewrite model index
    new Promise((resolve, reject) => {
        let result = fs.writeFileSync(path.join(__dirname, '../db/models', 'index.js'), modelIndexTEXT)
        if (fs.existsSync(path.join(__dirname, '../db/models', 'index.js'))) {
            console.log('rewrite model index successfully')
            resolve()
        } else {
            reject()
        }
    })
}
/**
 * change default values created by sequelize-cli init
 */
async function createDatabaseConfig() {
    //create seqeulize config file
    new Promise((resolve, reject) => {
        let result = fs.writeFileSync(path.join(__dirname, '../config', 'database.js'), databaseConfigTEXT)
        if (fs.existsSync(path.join(__dirname, '../config', 'database.js'), databaseConfigTEXT)) {
            console.log('generate database config file successfully')
            resolve()
        } else {
            reject()
        }
    })
}
/**
 * generate model and migrations
    1.check model dir
    normally, the best way is put all models in different sheets in one xlsx file.
        but,you can also have several xlsx files.
    2.get model name attributes
    3.ask user to ensure models.
    4.call spawn to generate model and migrations
 */

async function generateModel() {
    var modelsPath = path.join(__dirname, 'model')
    //check model dir
    var modelsArray = fs.readdirSync(modelsPath)
    /**
     * modelsArray 
        normally, the best way is put all models in different sheets in one xlsx file.
        but,you can also have several xlsx files.
     */
    await new Promise((resolve, reject) => {
        var CliArgsArrray = []
        for (let i = 0; i < modelsArray.length; i++) {
            let OneXlsx = modelsArray[i]
            let file = XLSX.readFile(path.join(modelsPath, OneXlsx))
            const sheetNames = file.SheetNames //sheet name is models' names.
            sheetNames.forEach(sheet => {
                //one model behind
                let modelName = sheet
                modelNameArray.push(modelName)
                new Promise((resolve, reject) => {
                    let attributeStr = ''
                    console.log('model--->', modelName.blue)
                    let model = file.Sheets[modelName]
                    let model_json = XLSX.utils.sheet_to_json(model)
                    //model json type, is an Array.
                    //attributeSrt for one model
                    async.forEach(
                        model_json,
                        function(item, done) {
                            //item
                            console.log('   ' + item.attributes.yellow + '|' + item.type.yellow)
                            let str = `${item.attributes}:${item.type}`
                            if (attributeStr === '') {
                                attributeStr += str
                            } else {
                                attributeStr += ',' + str
                            }
                            done() //notify for this loop is done
                        },
                        function(err) {
                            //for callback
                            resolve([modelName, attributeStr])
                        }
                    )
                })
                    .then(([modelName, attributeStr]) => {
                        // console.log('generating model:', modelName, 'attributes:', attributeStr)
                        //generate model
                        CliArgsArrray.push(['sequelize-cli', `model:generate`, `--name ${modelName}`, `--attributes ${attributeStr}`])
                    })
                    .catch(err => {
                        console.log('Error: generate model failed!\n', err)
                    })
            })
            if (i === modelsArray.length - 1) {
                resolve(CliArgsArrray)
            }
        }
    })
        .then(async function(CliArgsArrray) {
            return await queryUser('Have you checked these models twice?', '(yes or no)').then(result => {
                if (result) {
                    //result would be true or false
                    //user answer is yes, do npx sequelize-cli
                    //force?
                    if (force) {
                        console.log('please manually delete old migration files later!'.red)
                        return CliArgsArrray.forEach(element => {
                            //force?
                            element.push('--force')
                            spawn.sync('npx', element, {
                                stdio: 'inherit'
                            })
                        })
                    } else {
                        return CliArgsArrray.forEach(element => {
                            spawn.sync('npx', element, {
                                stdio: 'inherit'
                            })
                        })
                    }
                }
            })
        })
        .catch(err => {
            console.log(err)
        })
}
/**
 * generate controllers.
    1. ask user whether need controllers.
    2. if yes, let user input Id for one model.
 */
async function generateController() {
    if (modelNameArray.length === 0) {
        return
    }
    console.log(
        `
        NOTE for controller file:
        method get for get
        method post for add
        method patch for update
        method delete for delete
    `.blue
    )
    await queryUser('Do you need to generate controllers?', '(yes or no)').then(result => {
        return new Promise((resolve, reject) => {
            if (result) {
                //result would be true or false
                //user answer is yes, do generate
                console.log('processing to generate controllers...'.green)
                console.log('please type id for each model. you will use these ids to CRUD.')
                let generate = async result => {
                    for (let i = 0; i < modelNameArray.length; i++) {
                        console.log('->', modelNameArray[i].blue)
                        //get id from console input for each model
                        await queryUserString('id', '(enter one)').then(result => {
                            // console.log(`id for ${modelNameArray[i]} -> ${result}`)
                            modelIdArray.push(result)
                            if (i === modelNameArray.length - 1) {
                                console.log('Now generating...')
                                generateAllController()
                            }
                        })
                    }
                }
                generate(result)
                return resolve()
            }
            console.log('Okey, guess you want to do it manually'.red)
            showExit()
            return resolve()
        })
    })
}
async function addRouterToApp() {
    if (modelNameArray.length === 0) {
        return
    }
    await queryUser('Do you need to add those controllers into app.js?', '(yes or no)').then(async result => {
        if (result) {
            if (modelNameArray.length === 0) {
                return
            }
            for (let i = 0; i < modelNameArray.length; i++) {
                modelName = modelNameArray[i].toLowerCase()
                let templete = appRouterTemplete.replace(/{{model_low}}/g, modelName)
                await writeFileToLine(templete)
                console.log(
                    `add ${modelName} router done.\n`.green +
                        `NOTE: added at the` +
                        ` top `.red +
                        `position of file, please ` +
                        colors.red.underline(`move them to the right place manually(important)`)
                )
            }
        }
    })
}
//往固定的行写入数据
async function writeFileToLine(templete) {
    const data = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8').split('\n')
    data.splice(data[0], 0, templete)
    fs.writeFileSync(path.join(__dirname, '../app.js'), data.join('\n'), 'utf8')
}

async function generateAllController() {
    console.log(modelNameArray, modelIdArray)
    //check if controllers dir exists
    if (fs.existsSync(path.join(__dirname, '../controllers'))) {
        console.log('controller folder exists.')
    } else {
        fs.mkdirSync(path.join(__dirname, '../controllers'))
    }
    return new Promise((resolve, reject) => {
        for (let i = 0; i < modelNameArray.length; i++) {
            //create controller
            modelName = modelNameArray[i]
            id = modelIdArray[i]
            let g = controllerTemplete.replace(/{{name}}/g, modelName).replace(/{{id}}/g, id)
            let result = fs.writeFileSync(path.join(__dirname, '../controllers', `${modelNameArray[i]}.js`), g)
            //double check
            if (fs.existsSync(path.join(__dirname, '../controllers', `${modelNameArray[i]}.js`))) {
                console.log(`generate controller file ${modelNameArray[i]}.js successfully`)
            } else {
                console.log(`generate controller file ${modelNameArray[i]}.js Failed`.red)
            }
            if (i === modelNameArray.length - 1) {
                //finished
                resolve()
                return showExit()
            }
        }
    })
}
async function generateRouter() {
    if (modelNameArray.length === 0) {
        return
    }
    await queryUser('Do you need to generate routers?', '(yes or no)').then(result => {
        return new Promise((resolve, reject) => {
            if (result) {
                //result would be true or false
                //user answer is yes, do generate
                console.log('processing to generate routers...'.green)
                let generate = async result => {
                    for (let i = 0; i < modelNameArray.length; i++) {
                        let modelName = modelNameArray[i].toLowerCase()
                        console.log('->', modelName.blue)
                        let templete = routeTemplete.replace(/{{model}}/g, modelName)
                        new Promise((resolve, reject) => {
                            let result = fs.writeFileSync(path.join(__dirname, '../routes', `${modelName}.js`), templete)
                            if (fs.existsSync(path.join(__dirname, '../routes', `${modelName}.js`))) {
                                console.log('done.')
                                resolve()
                            } else {
                                reject()
                            }
                        })
                    }
                }
                generate(result)
                return resolve()
            }
            console.log('Okey, guess you want to do it manually'.red)
            return resolve()
        })
    })
}

async function showAuthor() {
    console.log(copyright.brightYellow)
}
async function showExit() {
    showAuthor()
    console.log('press [CTRL+C] to exit'.green)
}

copyright = `
██╗   ██╗██╗ ██████╗ ██╗███╗   ██╗ ██████╗ 
╚██╗ ██╔╝██║██╔═══██╗██║████╗  ██║██╔════╝ 
 ╚████╔╝ ██║██║   ██║██║██╔██╗ ██║██║  ███╗
  ╚██╔╝  ██║██║▄▄ ██║██║██║╚██╗██║██║   ██║
   ██║   ██║╚██████╔╝██║██║ ╚████║╚██████╔╝
   ╚═╝   ╚═╝ ╚══▀▀═╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
Email: y.zhang@live.com
Author: Yiqing
Copyright 2020-2020. All rights reserved
`
appRouterTemplete = `
var {{model_low}}Router = require('./routes/{{model_low}}')
app.use('/',{{model_low}}Router)
`
controllerTemplete = `
var models = require('../db/models')

module.exports = {
  //post
  add: (req, res, next) => {
    let data = req.body
    models.{{name}}.create(data)
      .then((doc) => {
        console.log(doc)
        if (doc) {
          res.json({
            result: 0,
            msg: 'Success',
            data:doc
          })
        } else {
          res.json({
            result: 1,
            msg: 'Failed. Already exists.'
          })
        }
      })
      .catch(err => {
        next(err)
      })
  },
  //patch
  update: (req, res, next) => {
    let data = req.body
    models.{{name}}.update(data, {
      where: {
        {{id}}: data.{{id}}
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
    models.{{name}}.findOne({
      where: {
        {{id}}: data.{{id}}
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
  //delete
  delete: (req, res, next) => {
    let data = req.query
    models.{{name}}.destroy({
      where: {
        {{id}}: data.{{id}}
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
}`
sequelizeConfigTEXT = `
const path = require('path');

module.exports = {
  config: path.resolve('config', 'database.js'),
  'models-path': path.resolve('db', 'models'),
  'seeders-path': path.resolve('db', 'seeders'),
  'migrations-path': path.resolve('db', 'migrations')
}`
databaseConfigTEXT = `
module.exports = {
    development: {
      username: 'test',
      password: '113@db!',
      database: 'yiqing_test',
      host: '10.0.0.113',
      dialect: 'mysql',
      timezone: '+08:00' //东八时区
    },
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      dialect: process.env.DB_CONNECTION,
      timezone: '+08:00' //东八时区
    },
}`
modelIndexTEXT = `
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/database.js')[env];
const db = {};

let sequelize;
console.log('environmnet %s connecting... %s',process.env.NODE_ENV, config.host)

sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
`
routeTemplete = `
var express = require('express');
var router = express.Router();
//import controller
var {{model}}Controller = require('../controllers/{{model}}');

//add
router.post('/{{model}}', {{model}}Controller.add);
//update
router.patch('/{{model}}', {{model}}Controller.update);
//get
router.get('/{{model}}', {{model}}Controller.get);
//delete
router.delete('/{{model}}', {{model}}Controller.delete);

module.exports = router;
`
scaffold()
