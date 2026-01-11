/*
DingTalk Splash Destroyer
Target: http://http2lwp.dingtalk.com/v3/r/Adaptor/Setting/getConfPreLogin
Logic: Rename the config keys so the App defaults to false.
*/

let body = $response.body;

// 1. 破坏总开关 Key: ios_app_launching_splash_ad -> ios_app_launching_splash_dd
// 保持长度一致非常重要，因为二进制协议通常包含长度头
// 如果是 String 模式处理：
body = body.replace(/ios_app_launching_splash_ad/g, "ios_app_launching_splash_dd");

// 2. 破坏策略配置 Key: adx_splash_policy_config -> adx_splash_policy_confid
body = body.replace(/adx_splash_policy_config/g, "adx_splash_policy_confid");

// 3. 破坏另一个开关: splash_ad_ios -> splash_ad_i00
body = body.replace(/splash_ad_ios/g, "splash_ad_i00");

$done({ body: body });
