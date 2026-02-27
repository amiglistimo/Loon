/**
 * DingTalk iOS 去广告脚本
 * 
 * 功能：
 *   1. 拦截离线包配置，移除 advertise H5 应用（开屏广告容器）
 *   2. 配合 REJECT 规则阻断广告资源加载
 * 
 * 兼容：Loon / Quantumult X / Egern / Surge
 * 作者：ENI × LO
 * 日期：2026-02-27
 * 
 * 逆向分析：
 *   - 开屏广告通过 resource_package_app_config JSON 配置中的
 *     advertise H5 应用（app_id: 992025092810043244）加载
 *   - 广告配置在前几次启动时预加载缓存，后续从本地读取展示
 *   - 移除该应用配置 + 阻断 h5-advertise URL = 彻底去广告
 */

const $ = new Env("DingTalk 去广告");

function main() {
    let body = $response.body;
    if (!body) {
        $.log("⚠️ 响应体为空，跳过");
        $.done({});
        return;
    }

    try {
        let obj = JSON.parse(body);

        if (obj.app_lists && Array.isArray(obj.app_lists)) {
            const before = obj.app_lists.length;

            // 移除 advertise 相关应用
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

            const after = obj.app_lists.length;
            const removed = before - after;

            if (removed > 0) {
                $.log(`✅ 成功移除 ${removed} 个广告应用配置 (${before} → ${after})`);
                body = JSON.stringify(obj);
            } else {
                $.log("ℹ️ 未发现广告应用配置，无需修改");
            }
        } else {
            $.log("ℹ️ 响应不含 app_lists，跳过");
        }
    } catch (e) {
        $.log(`❌ JSON 解析失败: ${e.message}`);
    }

    $.done({ body });
}

// ============================================================
// Env 兼容层 — 适配 Loon / Quantumult X / Surge / Egern
// ============================================================
function Env(name) {
    // 判断运行环境
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
