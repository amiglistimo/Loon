/*
DingTalk Splash Killer
Target: getConfPreLogin (LWP Binary/JSON mixed)
Logic: Corrupt config keys to force default values (false).
*/

let body = $response.body;

if (body) {
    // 1. 破坏 iOS 开屏总开关
    // ios_app_launching_splash_ad -> ios_app_launching_splash_dd
    body = body.replace(/ios_app_launching_splash_ad/g, "ios_app_launching_splash_dd");

    // 2. 破坏广告策略配置
    // adx_splash_policy_config -> adx_splash_policy_confid
    body = body.replace(/adx_splash_policy_config/g, "adx_splash_policy_confid");

    // 3. 破坏备用/旧版开关
    // splash_ad_ios -> splash_ad_i00
    body = body.replace(/splash_ad_ios/g, "splash_ad_i00");
    
    // 4. 破坏开屏跳转版本 (可选，彻底阻断)
    // splash_jump_v -> splash_jump_x
    body = body.replace(/splash_jump_v/g, "splash_jump_x");

    $done({ body: body });
} else {
    // 如果响应体为空，原样返回，避免处理出错
    $done({});
}
