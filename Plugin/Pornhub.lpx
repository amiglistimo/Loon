#!name = Pornhub 去广告
#!desc = 去除 Pornhub 网页版广告
#!openUrl = 
#!author = ddgksf2013
#!tag = 去广告
#!system = 
#!system_version = 
#!loon_version = 3.3.7(921)
#!homepage = https://ddgksf2013.top/scripts/pornhub.ads.js
#!icon = https://raw.githubusercontent.com/Orz-3/mini/refs/heads/master/Color/Pornhub.png
#!date = 2025-12-21 10:00

[Rewrite]
^https?:\/\/(cn|www)\.pornhub\.com\/_xa\/ads reject-dict

[Script]
http-response ^https?:/\/(cn|www)\.pornhub\.com\/(?!(.*(api|login|cdn-cgi|verify|auth|captch|(\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf))))) script-path=https://ddgksf2013.top/scripts/pornhub.ads.js, requires-body=true, timeout=60, tag=pornhub.ads.js

[Mitm]
hostname = cn.pornhub.com, www.pornhub.com
