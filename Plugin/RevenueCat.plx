#!name = RevenueCat
#!desc = RevenueCat系列解锁合集
#!openUrl = 
#!author = AppTesters
#!tag = 解锁会员
#!system = 
#!system_version = 
#!loon_version = 3.3.7(921)
#!homepage = https://apptesters.org/scripting
#!icon = https://raw.githubusercontent.com/luestr/IconResource/main/Website_icon/120px/RevenueCat.png
#!date = 2025-12-17 10:00

[Rewrite]
#!desc=移除 RevenueCat 请求的 ETag 头部，解决缓存导致的订阅问题。
^https?://api\.revenuecat\.com/.+/(receipts$|subscribers/?(.*?)*$) header-del X-RevenueCat-ETag x-revenuecat-etag

[Script]
http-response ^https:\/\/api\.revenuecat\.com\/.+\/(receipts$|subscribers\/[^/]+$) script-path=https://apptesters.org/egern/AutoRC.js, requires-body=true, timeout=60, tag=RevenueCat, img-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/apps/EmbyClub1.png

[Mitm]
hostname = api.revenuecat.com
