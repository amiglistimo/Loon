/**
 * DingTalk iOS 去广告脚本 v3
 * 
 * 多端兼容：Loon / Quantumult X / Egern / Surge
 * 作者：ENI × LO
 * 日期：2026-02-27
 * 
 * 5轮 HAR 逆向后的终极版：
 * 
 * 广告投放链路：
 *   getConfPreLogin(MsgPack) → ios_app_launching_splash_ad=true
 *   resource_package_app_config → advertise H5 容器注册 (app_id:992025092810043244)
 *   fastconfigonline/general  → advertising_enable 开关
 *   h5-advertise 离线包缓存  → 广告素材本地加载
 *   h-adashx.ut.dingtalk.com  → 广告 SDK 曝光上报
 * 
 * 拦截策略：
 *   ① REJECT getConfPreLogin — App 回退到默认本地配置（无广告）
 *   ② 脚本改写 resource_package_app_config — 删除 advertise 应用
 *   ③ 脚本改写 fastconfigonline/general — 关闭 advertising_enable
 *   ④ REJECT h-adashx.ut.dingtalk.com — 断掉广告 SDK
 *   ⑤ REJECT h5-advertise — 堵死回源
 * 
 *   本脚本负责 ②③，其余由 Rule 层 REJECT
 */

const scriptName = "DingTalk 去广告";

// ═══════════════════════════════════════════════════════
// 入口
// ═══════════════════════════════════════════════════════
!(async () => {
    const url = $request.url || "";
    let body = $response.body;

    if (!body) {
        log("⚠️ 响应体为空，跳过");
        return done({});
    }

    if (url.includes("resource_package_app_config")) {
        handleAppConfig(body);
    } else if (url.includes("fastconfigonline")) {
        handleFastConfig(body);
    } else {
        log("ℹ️ URL 未命中处理规则，跳过");
        done({ body });
    }
})();

// ═══════════════════════════════════════════════════════
// 处理 ②：离线包配置 — 移除 advertise H5 应用
// ═══════════════════════════════════════════════════════
function handleAppConfig(body) {
    try {
        let obj = JSON.parse(body);

        if (!obj.app_lists || !Array.isArray(obj.app_lists)) {
            log("ℹ️ [AppConfig] 无 app_lists");
            return done({ body });
        }

        const before = obj.app_lists.length;

        obj.app_lists = obj.app_lists.filter(app => {
            const name = (app.app_name || "").toLowerCase();
            const home = (app.homeUrl || "").toLowerCase();
            const frames = app.mainFrameList || [];

            // 按名字精确匹配
            if (name === "advertise") {
                log(`🚫 删除: app_name=advertise, id=${app.app_id}`);
                return false;
            }
            // 按 URL 匹配
            if (home.includes("h5-advertise")) {
                log(`🚫 删除: homeUrl 命中 h5-advertise, id=${app.app_id}`);
                return false;
            }
            // 按 mainFrameList 匹配
            for (const url of frames) {
                if ((url || "").toLowerCase().includes("h5-advertise")) {
                    log(`🚫 删除: mainFrame 命中 h5-advertise, id=${app.app_id}`);
                    return false;
                }
            }
            return true;
        });

        const removed = before - obj.app_lists.length;
        if (removed > 0) {
            log(`✅ 移除 ${removed} 个广告应用 (${before} → ${obj.app_lists.length})`);
            body = JSON.stringify(obj);
        } else {
            log("ℹ️ 本次响应无广告应用");
        }
    } catch (e) {
        log(`❌ JSON 解析失败: ${e.message}`);
    }

    done({ body });
}

// ═══════════════════════════════════════════════════════
// 处理 ③：FastConfig — 关闭 advertising_enable 等广告开关
// ═══════════════════════════════════════════════════════
function handleFastConfig(body) {
    try {
        let obj = JSON.parse(body);
        let modified = false;

        // fastconfigonline 的 JSON 结构是 { key: JSON字符串 }
        // advertising_enable 的值格式类似:
        // {"matcher":"uid;hash;or;100_0_30","v":"1","t":1597237081383}

        const adKeys = [
            "advertising_enable",
            "ad_show_count",
            "ad_show_interval",
            "splash_ad_enable",
            "launch_ad_enable",
        ];

        for (const key of Object.keys(obj)) {
            const keyLower = key.toLowerCase();

            // 匹配所有广告相关 key
            if (adKeys.includes(keyLower) ||
                keyLower.includes("advertis") ||
                keyLower.includes("splash_ad") ||
                keyLower.includes("launch_ad") ||
                keyLower.includes("openscreen")) {

                let val = obj[key];

                // 尝试解析嵌套 JSON
                if (typeof val === "string") {
                    try {
                        let inner = JSON.parse(val);
                        // v="1" 表示开启，改为 "0" 表示关闭
                        if (inner.v !== undefined) {
                            log(`🚫 [FastConfig] ${key}: v=${inner.v} → 0`);
                            inner.v = "0";
                            obj[key] = JSON.stringify(inner);
                            modified = true;
                        }
                    } catch {
                        // 非 JSON，直接替换
                        if (val === "1" || val.toLowerCase() === "true") {
                            log(`🚫 [FastConfig] ${key}: ${val} → 0`);
                            obj[key] = "0";
                            modified = true;
                        }
                    }
                } else if (typeof val === "number" && val > 0) {
                    log(`🚫 [FastConfig] ${key}: ${val} → 0`);
                    obj[key] = 0;
                    modified = true;
                } else if (val === true) {
                    log(`🚫 [FastConfig] ${key}: true → false`);
                    obj[key] = false;
                    modified = true;
                }
            }
        }

        if (modified) {
            log("✅ FastConfig 广告开关已关闭");
            body = JSON.stringify(obj);
        } else {
            log("ℹ️ FastConfig 中未发现需修改的广告开关");
        }
    } catch (e) {
        log(`❌ [FastConfig] JSON 解析失败: ${e.message}`);
    }

    done({ body });
}

// ═══════════════════════════════════════════════════════
// 工具函数 — 多端兼容
// ═══════════════════════════════════════════════════════
function log(...args) {
    console.log(`[${scriptName}]`, ...args);
}

function done(obj = {}) {
    $done(obj);
}
