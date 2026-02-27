/**
 * DingTalk iOS 去广告脚本
 * 
 * 功能：
 *   1. 拦截离线包配置(resource_package_app_config)，移除 advertise H5 应用
 *   2. 拦截预登录配置(getConfPreLogin)，篡改开屏广告开关和策略
 *   3. 配合 REJECT 规则阻断广告资源加载
 * 
 * 兼容：Loon / Quantumult X / Egern / Surge
 * 作者：amiglistimo
 * 日期：2026-02-27
 * 版本：v2.0
 * 
 * 逆向精华：
 *   抓包发现三层广告投放链：
 *   ① resource_package_app_config_35.json → advertise H5 容器（app_id: 992025092810043244）
 *   ② getConfPreLogin 二进制配置 → adx_splash_policy_config / ios_app_launching_splash_ad
 *   ③ h5-advertise 本地缓存 → 广告素材从离线包加载，不再走网络
 *   三管齐下才能斩草除根
 */

const $ = new Env("DingTalk 去广告");

function main() {
    const url = $request.url || "";
    let body = $response.body;

    if (!body) {
        $.log("⚠️ 响应体为空，跳过");
        $.done({});
        return;
    }

    // ─── 路由：根据 URL 分发处理 ───
    if (url.includes("resource_package_app_config")) {
        handleAppConfig(body);
    } else if (url.includes("getConfPreLogin") || url.includes("getConf")) {
        handlePreLoginConfig(body);
    } else {
        $.log("ℹ️ 未匹配到需处理的 URL，跳过");
        $.done({ body });
    }
}

// ═══════════════════════════════════════════════════════
// 处理 1：离线包配置 — 移除 advertise H5 应用
// ═══════════════════════════════════════════════════════
function handleAppConfig(body) {
    try {
        let obj = JSON.parse(body);

        if (obj.app_lists && Array.isArray(obj.app_lists)) {
            const before = obj.app_lists.length;

            obj.app_lists = obj.app_lists.filter(app => {
                // 按 app_name 精确匹配
                if (app.app_name === "advertise") {
                    $.log(`🚫 移除广告应用: app_id=${app.app_id}, app_name=${app.app_name}`);
                    return false;
                }
                // 按 homeUrl / mainFrameList 匹配 h5-advertise
                if (app.homeUrl && app.homeUrl.includes("h5-advertise")) {
                    $.log(`🚫 移除广告应用(URL匹配): app_id=${app.app_id}`);
                    return false;
                }
                if (app.mainFrameList && Array.isArray(app.mainFrameList)) {
                    for (const url of app.mainFrameList) {
                        if (url.includes("h5-advertise")) {
                            $.log(`🚫 移除广告应用(mainFrame匹配): app_id=${app.app_id}`);
                            return false;
                        }
                    }
                }
                return true;
            });

            const removed = before - obj.app_lists.length;
            if (removed > 0) {
                $.log(`✅ [AppConfig] 移除 ${removed} 个广告应用 (${before} → ${obj.app_lists.length})`);
                body = JSON.stringify(obj);
            } else {
                $.log("ℹ️ [AppConfig] 无广告应用配置");
            }
        }
    } catch (e) {
        $.log(`❌ [AppConfig] JSON 解析失败: ${e.message}`);
    }

    $.done({ body });
}

// ═══════════════════════════════════════════════════════
// 处理 2：预登录设置 — 二进制字符串替换关闭广告开关
// ═══════════════════════════════════════════════════════
function handlePreLoginConfig(body) {
    let modified = false;

    // --- 策略 A：关闭 ios_app_launching_splash_ad 开关 ---
    // 二进制配置中的格式：ios_app_launching_splash_ad¤true
    // 把 true 改成 false（长度保持一致用空格补）
    if (body.includes("ios_app_launching_splash_ad")) {
        // Match: key + separator + "true" → replace "true" with "fals" (4 chars = 4 chars)
        body = body.replace(
            /ios_app_launching_splash_ad([\x00-\xff]{0,5})true/g,
            function (match, sep) {
                $.log("🚫 [PreLogin] 关闭 ios_app_launching_splash_ad");
                return "ios_app_launching_splash_ad" + sep + "fals";
            }
        );
        modified = true;
    }

    // --- 策略 B：关闭 enable_splash_ads_common_ua_ios ---
    if (body.includes("enable_splash_ads_common_ua_ios")) {
        body = body.replace(
            /enable_splash_ads_common_ua_ios([\x00-\xff]{0,5})true/g,
            function (match, sep) {
                $.log("🚫 [PreLogin] 关闭 enable_splash_ads_common_ua_ios");
                return "enable_splash_ads_common_ua_ios" + sep + "fals";
            }
        );
        modified = true;
    }

    // --- 策略 C：篡改 adx_splash_policy_config --- 
    // 把 adShowDayCount 改为 0，adShowInterval 改为 999999
    if (body.includes("adx_splash_policy_config")) {
        // 替换 adShowDayCount 的值为 0
        body = body.replace(/"adShowDayCount"\s*:\s*\d+/g, function (match) {
            $.log(`🚫 [PreLogin] adShowDayCount → 0 (原: ${match})`);
            return '"adShowDayCount": 0';
        });
        // 替换 adShowInterval 为极大值
        body = body.replace(/"adShowInterval"\s*:\s*\d+/g, function (match) {
            $.log(`🚫 [PreLogin] adShowInterval → 999999 (原: ${match})`);
            return '"adShowInterval": 999999';
        });
        // 替换 adRequestInterval 为极大值
        body = body.replace(/"adRequestInterval"\s*:\s*\d+/g, function (match) {
            $.log(`🚫 [PreLogin] adRequestInterval → 999999 (原: ${match})`);
            return '"adRequestInterval": 999999';
        });
        modified = true;
    }

    // --- 策略 D：关闭 enable_member_free_splash_ad_toast_ios ---
    if (body.includes("enable_member_free_splash_ad_toast_ios")) {
        body = body.replace(
            /enable_member_free_splash_ad_toast_ios([\x00-\xff]{0,5})true/g,
            function (match, sep) {
                $.log("🚫 [PreLogin] 关闭 enable_member_free_splash_ad_toast_ios");
                return "enable_member_free_splash_ad_toast_ios" + sep + "fals";
            }
        );
        modified = true;
    }

    // --- 策略 E：启用 enable_365_member_no_splash_ad_ios ---
    // 这个是「365会员免广告」开关，保持 true 不动（对我们有利）
    // 如果是 false 则改成 true
    if (body.includes("enable_365_member_no_splash_ad_ios")) {
        body = body.replace(
            /enable_365_member_no_splash_ad_ios([\x00-\xff]{0,5})false/g,
            function (match, sep) {
                $.log("✅ [PreLogin] 开启 enable_365_member_no_splash_ad_ios (伪装会员免广告)");
                return "enable_365_member_no_splash_ad_ios" + sep + "true\x00";
            }
        );
        modified = true;
    }

    // --- 策略 F：关闭 enable_ios_splashad_macro_replacement ---
    if (body.includes("enable_ios_splashad_macro_replacement")) {
        body = body.replace(
            /enable_ios_splashad_macro_replacement([\x00-\xff]{0,5})true/g,
            function (match, sep) {
                $.log("🚫 [PreLogin] 关闭 enable_ios_splashad_macro_replacement");
                return "enable_ios_splashad_macro_replacement" + sep + "fals";
            }
        );
        modified = true;
    }

    if (modified) {
        $.log("✅ [PreLogin] 广告配置篡改完成");
    } else {
        $.log("ℹ️ [PreLogin] 未找到可篡改的广告配置");
    }

    $.done({ body });
}

// ============================================================
// Env 兼容层 — 适配 Loon / Quantumult X / Surge / Egern
// ============================================================
function Env(name) {
    const isLoon = typeof $loon !== "undefined";
    const isQuanX = typeof $task !== "undefined";
    const isSurge = typeof $httpClient !== "undefined" && !isLoon;
    const isEgern = typeof $environment !== "undefined" && typeof $environment.app === "string" && $environment.app === "Egern";

    this.name = name;

    this.log = function (...args) {
        console.log(`[${name}]`, ...args);
    };

    this.done = function (obj = {}) {
        if (isQuanX) {
            $done(obj);
        } else if (isSurge || isLoon || isEgern) {
            $done(obj);
        } else {
            $done(obj);
        }
    };
}

main();
