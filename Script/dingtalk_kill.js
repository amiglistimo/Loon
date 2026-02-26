/*
DingTalk Splash Killer
Target: getConfPreLogin & getConf (LWP Binary/JSON mixed)
Logic: Corrupt config keys to force default values (false) using exact length string replacement.
*/

let body = $response.body;

if (body) {
    // 1. 破坏 iOS 开屏总开关 (长度 27)
    // ios_app_launching_splash_ad -> ios_app_launching_splash_dd
    body = body.replace(/ios_app_launching_splash_ad/g, "ios_app_launching_splash_dd");

    // 2. 破坏广告策略配置 (长度 24)
    // adx_splash_policy_config -> adx_splash_policy_confid
    body = body.replace(/adx_splash_policy_config/g, "adx_splash_policy_confid");

    // 3. 破坏备用/旧版开关 (长度 13)
    // splash_ad_ios -> splash_ad_i00
    body = body.replace(/splash_ad_ios/g, "splash_ad_i00");
    
    // 4. 破坏开屏跳转版本 (长度 13)
    // splash_jump_v -> splash_jump_x
    body = body.replace(/splash_jump_v/g, "splash_jump_x");

    $done({ body: body });
} else {
    $done({});
}
