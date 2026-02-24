/*
DingTalk Splash Ad Killer v3.0
Target: file.dingtalk.com/fastconfigonline/...
Logic: Parse double-layered JSON and disable targeted ad flags.
*/

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let modified = false;

        // 需要重点打击的广告相关开关键名
        const targetKeys = [
            "advertising_enable",     // 核心广告开关
            "splash_op",              // 开屏运营/广告开关
            "ios_top_speed_splash"    // 开屏预加载相关
        ];

        if (obj && obj.content) {
            targetKeys.forEach(key => {
                if (obj.content[key]) {
                    try {
                        // 解析内层的字符串 JSON
                        let innerObj = JSON.parse(obj.content[key]);
                        
                        // 将开启状态 "1" 强制改为 "0" (关闭)
                        if (innerObj.v === "1" || innerObj.v === 1) {
                            innerObj.v = "0";
                            // 重新序列化塞回去
                            obj.content[key] = JSON.stringify(innerObj);
                            modified = true;
                            console.log(`[DingTalk Ad Killer] 成功关闭开关: ${key}`);
                        }
                    } catch (innerError) {
                        console.log(`[DingTalk Ad Killer] 解析内层 JSON 失败: ${key}`);
                    }
                }
            });
        }

        // 如果做了修改，重新打包整个 Body
        if (modified) {
            body = JSON.stringify(obj);
        }
        
        $done({ body: body });

    } catch (e) {
        console.log("[DingTalk Ad Killer] 外层 JSON 解析失败，跳过处理");
        $done({});
    }
} else {
    $done({});
}
