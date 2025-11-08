/*
AppRaven



[Script]
http-response ^https?:\/\/v2\.appraven\.net\/appraven\/graphql script-path = https://raw.githubusercontent.com/amiglistimo/Loon/refs/heads/main/Script/appraven.vip.js, requires-body = true, tag = AppRaven美化

[MitM]
hostname = v2.appraven.net

**/

var modifiedHeaders = $request.headers;
var operationName = modifiedHeaders['X-APOLLO-OPERATION-NAME'];

if (operationName == "GetCurrentUser"||operationName == "GetUserById") {
  var body = $response.body.replace(/"premium":false/g, '"premium":true');
  $done({ body: body });
} else {
  $done({});
}
