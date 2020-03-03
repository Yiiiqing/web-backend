/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 11:07:21
 * @modify date 2020-03-03 11:07:21
 * @desc [description]
 */
var models = require('../db/models');

module.exports = {
    //post
    add:(req,res,next)=>{
        let data = req.body;
        models.Admin.findOrCreate({
            where:{
                username:data.username
            },
            defaults:data
        }).then(([doc,created])=>{
            console.log(doc)
            if(created){
                res.json({
                    result:0,
                    msg:'Success'
                })
            }else{
                res.json({
                    result:1,
                    msg:'Failed. The User exists.'
                })
            }
        }).catch(err=>{
            next(err)
        })
    },
    update:(req,res,next)=>{

    },
    get:(req,res,next)=>{

    },
    delete:(req,res,next)=>{
        
    }
}