[Rewrite]
^https?://api\.revenuecat\.com/.+/(receipts$|subscribers/?(.*?)*$) header-del X-RevenueCat-ETag x-revenuecat-etag

[Script]
http-response ^https:\/\/api\.revenuecat\.com\/.+\/(receipts$|subscribers\/[^/]+$) script-path=https://apptesters.org/egern/AutoRC.js, requires-body=true, timeout=60, tag=RevenueCat, img-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/apps/EmbyClub1.png

[Mitm]
hostname = api.revenuecat.com
