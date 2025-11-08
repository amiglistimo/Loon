#!name = AppRaven
#!desc = AppRaven美化
#!openUrl = https://apps.apple.com/app/id1490607195
#!author = Yu9191[https://github.com/Yu9191]
#!tag = 界面美化
#!system = 
#!system_version = 
#!loon_version = 3.3.5(904)
#!homepage = https://github.com/ddgksf2013
#!icon = https://raw.githubusercontent.com/sooyaaabo/Loon/main/Icon/App-Icon/AppRaven.png
#!date = 2025-11-08 00:00

# 2025-11-08
# https://gist.githubusercontent.com/ddgksf2013/562f8fd6a40be92d7c8b358aa25eab3f/raw/appraven.vip.js

[Script]
http-response ^https?:\/\/v2\.appraven\.net\/appraven\/graphql script-path = https://raw.githubusercontent.com/amiglistimo/Loon/refs/heads/main/Script/appraven.vip.js, requires-body = true, tag = AppRaven美化

[MitM]
hostname = v2.appraven.net
