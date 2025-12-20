#!name = JavDB & MissAV
#!desc = 去除 JavDB & MissAV 网页版广告，跳转 MissAV 播放
#!openUrl = 
#!author = ddgksf2013
#!tag = 去广告
#!system = 
#!system_version = 
#!loon_version = 3.3.7(921)
#!homepage = https://ddgksf2013.top/module/JavDB.WebEnhance.sgmodule
#!icon = https://raw.githubusercontent.com/Asstiff/Google-Canada-to-Normal/refs/heads/main/Rucu6/Icons/app/javdb.png
#!date = 2025-12-20 10:00

[Rule]
DOMAIN-SUFFIX,mc.yandex.ru,REJECT
DOMAIN-SUFFIX,static.cloudflareinsights.com,REJECT

[Script]
# JavDB
http-response ^https?:\/\/javdb\.com\/(?!(.*(api|login|cdn-cgi|verify|auth|captch|(\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf))))) script-path=https://ddgksf2013.top/scripts/javdb.ads.js, requires-body=true, timeout=60, tag=JavDB
# MissAV
http-response ^https?:\/\/missav\.(ws|live|com|ai)\/(?!(.*(api|login|cdn-cgi|verify|auth|captch|(\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf))))) script-path=https://ddgksf2013.top/scripts/missav.ads.js, requires-body=true, timeout=60, tag=MissAV

[Mitm]
hostname = %APPEND% javdb.com, missav.live, missav.ws, missav.ai, missav.com
