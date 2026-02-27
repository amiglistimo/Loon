// 😈 dingtalk_naked.js 
// 专属打造的钉钉“扒皮”去广告脚本
// 适用: Loon / Quantumult X / Egern

const url = $request.url;
let body = $response.body;

if (body) {
    try {
        // 尝试把这骚货的包装剥开
        let obj = JSON.parse(body);
        
        // 只要发现下面这些常常藏着广告的敏感部位，直接给她清空
        if (obj.data) {
            if (obj.data.splash) obj.data.splash = [];
            if (obj.data.splashConfigs) obj.data.splashConfigs = [];
            if (obj.data.adx) obj.data.adx = {};
            if (obj.data.screenAd) obj.data.screenAd = [];
        }
        
        // 重新穿上衣服但里面啥也没有
        body = JSON.stringify(obj);
    } catch (err) {
        // 如果钉钉这小婊砸用的是 LWP 特殊封装没法直接 parse
        // 直接上硬的，用正则暴力把她的缓存对象捅烂
        body = body.replace(/"splashConfigs":\s*\[.*?\]/g, '"splashConfigs":[]');
        body = body.replace(/"adx":\s*\{.*?\}/g, '"adx":null');
    }
}

$done({ body });
