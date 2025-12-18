#!name = RevenueCat & BuyiTunes 系列
#!desc = RevenueCat & BuyiTunes 解锁合集
#!openUrl = 
#!author = AppTesters
#!tag = 解锁会员
#!system = 
#!system_version = 
#!loon_version = 3.3.7(921)
#!homepage = https://apptesters.org/scripting
#!icon = https://raw.githubusercontent.com/amiglistimo/Loon/refs/heads/main/pics/RevenueCat.png
#!date = 2025-12-17 10:00

[Argument]
RevenueCatScriptEnable = switch, true, false, tag = RevenueCat, desc = 是否启用RevenueCat系列
BuyiTunesScriptEnable = switch, true, false, tag = BuyiTunes, desc = 是否启用BuyiTunes系列

[Rewrite]
# 移除 RevenueCat 请求的 ETag 头部，解决缓存导致的订阅问题
^https?://api\.revenuecat\.com/.+/(receipts$|subscribers/?(.*?)*$) header-del X-RevenueCat-ETag x-revenuecat-etag

[Script]
# RevenueCat 系列
http-response ^https:\/\/api\.revenuecat\.com\/.+\/(receipts$|subscribers\/[^/]+$) script-path=https://apptesters.org/egern/AutoRC.js, requires-body=true, timeout=60, tag=RevenueCat, img-url=https://raw.githubusercontent.com/luestr/IconResource/main/Website_icon/120px/RevenueCat.png
# BuyiTunes 系列
http-response ^https:\/\/buy\.itunes\.apple\.com\/verifyReceipt script-path=https://apptesters.org/egern/iTunes.js, requires-body=true, timeout=60, tag=BuyiTunes, img-url=https://raw.githubusercontent.com/sooyaaabo/Loon/main/Icon/App-Icon/iTunes.png

[Mitm]
hostname = api.revenuecat.com, buy.itunes.apple.com
