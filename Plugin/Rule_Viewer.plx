#!name = 脚本预览解锁
#!desc = 解除 ddgksf2013.top、kelee.one、he2o 等站点的脚本/规则预览限制，修复 Content-Type 和 User-Agent 导致的乱码或无法查看问题。
#!author = fishdown
#!icon = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Clubhouse_2.png
#!date = 2025-12-23

[Rewrite]
# 解除 ddgksf2013.top 预览限制
^https:\/\/ddgksf2013\.top[^\s]*\.(js|sgmodule|conf)$ header-replace user-agent Quantumult\x20X
^https:\/\/ddgksf2013\.top[^\s]*\.(js|sgmodule|conf)$ response-header-replace content-type application/javascript;charset=utf-8

# 解除 kelee.one 预览限制
(?i)^https:\/\/([0-9a-z]+\.)?kelee\.one(?![^\s]*\.(?:css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|otf|mp4|webm|m3u8|ts|avi))[^\s]*$ response-header-replace Content-Type text/plain;charset=utf-8
(?i)^https:\/\/([0-9a-z]+\.)?kelee\.one(?![^\s]*\.(?:css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|otf|mp4|webm|m3u8|ts|avi))[^\s]*$ header-replace User-Agent script-hub/1.0.0

# 其他
^https:\/\/he2o\.vercel\.app\/Resource response-header-replace content-type application/javascript;charset=utf-8

[Mitm]
hostname = rule.kelee.one,kelee.one,ddgksf2013.top,he2o.vercel.app
