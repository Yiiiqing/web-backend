var OSS = require('ali-oss')


//创建oss连接对象
let client = new OSS({
    region:process.env.OSS_REGION, //连接区域
    accessKeyId: process.env.OSS_KEY_ID, //访问id
    accessKeySecret: process.env.OSS_KEY_SECRET, //访问加密签名
    bucket: process.env.OSS_BUCKET  //bucket 名称
});


// client.useBucket('m-resident');

//上传文件
async function put () {
  try {
    let result = await client.put('1', '1.png');
    console.log(result);
   } catch (err) {
    console.log (err);
   }
}


//获取链接地址
function getlink(obj){
    let url = client.signatureUrl('1', {expires: 3600});
    console.log(url)
    return url;
}
