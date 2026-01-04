#!name = JavDB App 净化
#!desc = 移除 JavDB App 开屏、Tab 栏及视频详情页广告
#!openUrl = 
#!author = ddgksf2013
#!tag = 去广告
#!system = 
#!system_version = 
#!loon_version = 3.3.7(921)
#!homepage = https://ddgksf2013.top/scripts/javdbapp.ads.js
#!icon = https://raw.githubusercontent.com/Asstiff/Google-Canada-to-Normal/refs/heads/main/Rucu6/Icons/app/javdb.png
#!date = 2026-1-04 10:00

[Script]
http-response ^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/startup script-path=https://ddgksf2013.top/scripts/javdbapp.ads.js, requires-body=true, timeout=60, tag=JavDB_开屏广告
http-response ^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/ads script-path=https://ddgksf2013.top/scripts/javdbapp.ads.js, requires-body=true, timeout=60, tag=JavDB_Tab广告
http-response ^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v4\/movies script-path=https://ddgksf2013.top/scripts/javdbapp.ads.js, requires-body=true, timeout=60, tag=JavDB_播放页

[Mitm]
hostname = api.pxxgg.xyz,api.ujvnmkx.cn,jdforrepam.com,api.yijingluowangluo.xyz,api.wwwuh5.cn,api.ffaoa.com,apidd.btyjscl.com
