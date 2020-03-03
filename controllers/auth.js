/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-03 10:59:01
 * @modify date 2020-03-03 10:59:01
 * @desc [description]
 */
/**
 * 登录相关
 */
const models = require('../db/models')

module.exports = {
    login:(req,res,next)=>{
        let data = req.body;
        if(data.username && data.password){
            models.Admin.findOne({
                where:{
                    username:data.username,
                    password:data.password
                },
                attributes:{
                    exclude:['password']
                },
                raw:'true'
            }).then(doc=>{
                if(!doc){
                    res.json({
                        result:1,
                        msg:'Error'
                    })
                }else{
                    req.session.user = doc;
                    req.session.time = Date.parse(new Date());
                    console.log(req.session)

                    res.json({
                        result:0,
                        msg:'Success',
                        user:doc
                    })
                    console.log(123)
                    //处理session
                    
                }
            })
        }else{
            next();
        }
    },
    /**
     * 退出登录,清理session
     */
    logout:(req,res,next)=>{
        let loginOutUser = req.session.user.name;
        req.session.destroy(err=>{
            if(err){
                console.log("session destroy error: ", err);
                res.json({
                    result:1,
                    msg:'logout error: ',err
                })
            }else{
                res.json({
                    result:0,
                    msg:`${loginOutUser} logout success.`
                })
            }
        })
    },
    test:(req,res,next)=>{
        res.json(req.session)
    }
}