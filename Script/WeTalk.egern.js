/*
@Name：WeTalk 自动化签到+视频奖励 (Egern 版)
@Author：TG@ZenMoFiShi
@Modify Egern 适配：export default async function(ctx) 模型

Egern 的脚本运行时与 QuanX/Loon/Surge 完全不同（ES Module + ctx 注入，
无 $task / $prefs / $httpClient / $notification / $done 等全局对象），
因此单独成文。其他客户端请使用同目录下的 WeTalk.js。

存储键与 WeTalk.js 一致（wetalk_accounts_v1），数据结构互通。

============ Egern 配置 ============
scriptings:
  - http_request:
      name: "WeTalk 抓包"
      match: "^https://api\\.wetalkapp\\.com/app/queryBalanceAndBonus"
      script_url: "https://raw.githubusercontent.com/<你的仓库>/WeTalk.egern.js"
      timeout: 10
  - schedule:
      name: "WeTalk 签到"
      cron: "20 8,20 * * *"
      script_url: "https://raw.githubusercontent.com/<你的仓库>/WeTalk.egern.js"
      timeout: 300

⚠️ schedule 的 timeout 默认只有 10 秒，而本脚本单账号约需 45 秒
   （5 个视频 × 8 秒间隔），多账号还要再加 3.5 秒/个。
   务必按账号数显式调大 timeout（上限 600）。

MITM 主机名：api.wetalkapp.com
*/

const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const API_HOST = 'api.wetalkapp.com';
const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3500;

const IOS_VERSIONS = ['17.5.1','17.6.1','17.4.1','17.2.1','16.7.8','17.6','17.3.1','18.0.1','17.1.2','16.6.1'];
const IOS_SCALES = ['2.00','3.00','3.00','2.00','3.00'];
const IPHONE_MODELS = ['iPhone14,3','iPhone13,3','iPhone15,3','iPhone16,1','iPhone14,7','iPhone13,2','iPhone15,2','iPhone12,1'];
const CFN_VERS = ['1410.0.3','1494.0.7','1568.100.1','1209.1','1474.0.4','1568.200.2'];
const DARWIN_VERS = ['22.6.0','23.5.0','23.6.0','24.0.0','22.4.0'];

function MD5(string) {
  function RotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)); }
  function AddUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000, lY4 = lY & 0x40000000, lX8 = lX & 0x80000000, lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) return (lResult & 0x40000000) ? (lResult ^ 0xC0000000 ^ lX8 ^ lY8) : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | (~z)); }
  function FF(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function GG(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function HH(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function II(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function ConvertToWordArray(str) {
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0, lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] |= str.charCodeAt(lByteCount) << lBytePosition;
      lByteCount++;
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] |= 0x80 << lBytePosition;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue) {
    let WordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue += WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  const x = ConvertToWordArray(string);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22, S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23, S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a,b,c,d,x[k+0],S11,0xD76AA478); d = FF(d,a,b,c,x[k+1],S12,0xE8C7B756); c = FF(c,d,a,b,x[k+2],S13,0x242070DB); b = FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);
    a = FF(a,b,c,d,x[k+4],S11,0xF57C0FAF); d = FF(d,a,b,c,x[k+5],S12,0x4787C62A); c = FF(c,d,a,b,x[k+6],S13,0xA8304613); b = FF(b,c,d,a,x[k+7],S14,0xFD469501);
    a = FF(a,b,c,d,x[k+8],S11,0x698098D8); d = FF(d,a,b,c,x[k+9],S12,0x8B44F7AF); c = FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1); b = FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
    a = FF(a,b,c,d,x[k+12],S11,0x6B901122); d = FF(d,a,b,c,x[k+13],S12,0xFD987193); c = FF(c,d,a,b,x[k+14],S13,0xA679438E); b = FF(b,c,d,a,x[k+15],S14,0x49B40821);
    a = GG(a,b,c,d,x[k+1],S21,0xF61E2562); d = GG(d,a,b,c,x[k+6],S22,0xC040B340); c = GG(c,d,a,b,x[k+11],S23,0x265E5A51); b = GG(b,c,d,a,x[k+0],S24,0xE9B6C7AA);
    a = GG(a,b,c,d,x[k+5],S21,0xD62F105D); d = GG(d,a,b,c,x[k+10],S22,0x02441453); c = GG(c,d,a,b,x[k+15],S23,0xD8A1E681); b = GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);
    a = GG(a,b,c,d,x[k+9],S21,0x21E1CDE6); d = GG(d,a,b,c,x[k+14],S22,0xC33707D6); c = GG(c,d,a,b,x[k+3],S23,0xF4D50D87); b = GG(b,c,d,a,x[k+8],S24,0x455A14ED);
    a = GG(a,b,c,d,x[k+13],S21,0xA9E3E905); d = GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8); c = GG(c,d,a,b,x[k+7],S23,0x676F02D9); b = GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
    a = HH(a,b,c,d,x[k+5],S31,0xFFFA3942); d = HH(d,a,b,c,x[k+8],S32,0x8771F681); c = HH(c,d,a,b,x[k+11],S33,0x6D9D6122); b = HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
    a = HH(a,b,c,d,x[k+1],S31,0xA4BEEA44); d = HH(d,a,b,c,x[k+4],S32,0x4BDECFA9); c = HH(c,d,a,b,x[k+7],S33,0xF6BB4B60); b = HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
    a = HH(a,b,c,d,x[k+13],S31,0x289B7EC6); d = HH(d,a,b,c,x[k+0],S32,0xEAA127FA); c = HH(c,d,a,b,x[k+3],S33,0xD4EF3085); b = HH(b,c,d,a,x[k+6],S34,0x04881D05);
    a = HH(a,b,c,d,x[k+9],S31,0xD9D4D039); d = HH(d,a,b,c,x[k+12],S32,0xE6DB99E5); c = HH(c,d,a,b,x[k+15],S33,0x1FA27CF8); b = HH(b,c,d,a,x[k+2],S34,0xC4AC5665);
    a = II(a,b,c,d,x[k+0],S41,0xF4292244); d = II(d,a,b,c,x[k+7],S42,0x432AFF97); c = II(c,d,a,b,x[k+14],S43,0xAB9423A7); b = II(b,c,d,a,x[k+5],S44,0xFC93A039);
    a = II(a,b,c,d,x[k+12],S41,0x655B59C3); d = II(d,a,b,c,x[k+3],S42,0x8F0CCC92); c = II(c,d,a,b,x[k+10],S43,0xFFEFF47D); b = II(b,c,d,a,x[k+1],S44,0x85845DD1);
    a = II(a,b,c,d,x[k+8],S41,0x6FA87E4F); d = II(d,a,b,c,x[k+15],S42,0xFE2CE6E0); c = II(c,d,a,b,x[k+6],S43,0xA3014314); b = II(b,c,d,a,x[k+13],S44,0x4E0811A1);
    a = II(a,b,c,d,x[k+4],S41,0xF7537E82); d = II(d,a,b,c,x[k+11],S42,0xBD3AF235); c = II(c,d,a,b,x[k+2],S43,0x2AD7D2BB); b = II(b,c,d,a,x[k+9],S44,0xEB86D391);
    a = AddUnsigned(a,AA); b = AddUnsigned(b,BB); c = AddUnsigned(c,CC); d = AddUnsigned(d,DD);
  }
  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase();
}

function getUTCSignDate() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

// Egern 的 Headers 是特殊对象而非普通字面量。优先整体枚举，
// 枚举不出来时退回按名取值，至少保证重放所需的关键头不丢。
const REPLAY_HEADERS = [
  'user-agent', 'accept', 'accept-language', 'accept-encoding',
  'content-type', 'authorization', 'cookie', 'x-request-id'
];

function headersToMap(h) {
  const out = {};
  if (!h) return out;
  try {
    Object.keys(h).forEach(k => {
      const v = h[k];
      if (v == null) return;
      out[k] = Array.isArray(v) ? v.join(', ') : String(v);
    });
  } catch (e) { /* 枚举不支持则走下方兜底 */ }
  if (Object.keys(out).length) return out;
  REPLAY_HEADERS.forEach(n => {
    try {
      const v = typeof h.get === 'function' ? h.get(n) : h[n];
      if (v) out[n] = Array.isArray(v) ? v.join(', ') : String(v);
    } catch (e) { /* 单个头取不到就跳过 */ }
  });
  return out;
}

function parseRawQuery(url) {
  const query = (url.split('?')[1] || '').split('#')[0];
  const rawMap = {};
  query.split('&').forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    rawMap[pair.slice(0, idx)] = pair.slice(idx + 1);
  });
  return rawMap;
}

function safeDecode(v) {
  if (v == null) return '';
  try { return decodeURIComponent(String(v)); } catch (e) { return String(v); }
}

function emailKeyOf(paramsRaw) {
  const raw = (paramsRaw || {}).email;
  if (!raw) return '';
  return safeDecode(raw).trim().toLowerCase();
}

// 兼容老版本：把以 MD5 fingerprint 为 key 的账号迁移成以 email 为 key。
function migrateStore(store) {
  if (!store || !store.accounts) return store;
  const newAccounts = {};
  const newOrder = [];
  let migrated = false;
  (store.order || Object.keys(store.accounts)).forEach(oldId => {
    const acc = store.accounts[oldId];
    if (!acc) return;
    const email = emailKeyOf(acc.capture && acc.capture.paramsRaw);
    const newId = email || oldId;
    if (newId !== oldId) migrated = true;
    const prev = newAccounts[newId];
    if (!prev || (acc.updatedAt || 0) >= (prev.updatedAt || 0)) {
      newAccounts[newId] = Object.assign({}, acc, { id: newId, alias: acc.alias || email || newId });
      if (newOrder.indexOf(newId) < 0) newOrder.push(newId);
    }
  });
  if (migrated) {
    store.accounts = newAccounts;
    store.order = newOrder;
  }
  return store;
}

function loadStore(ctx) {
  let obj = null;
  try { obj = ctx.storage.getJSON(storeKey); } catch (e) { obj = null; }
  if (!obj || typeof obj !== 'object') return { version: 2, accounts: {}, order: [] };
  if (!obj.accounts) obj.accounts = {};
  if (!Array.isArray(obj.order)) obj.order = Object.keys(obj.accounts);
  return migrateStore(obj);
}

function saveStore(ctx, store) {
  ctx.storage.setJSON(storeKey, store);
}

function pickItem(arr, seed) { return arr[seed % arr.length]; }

function buildUA(baseUA, seed) {
  const iosVer = pickItem(IOS_VERSIONS, seed);
  const scale = pickItem(IOS_SCALES, seed + 1);
  const model = pickItem(IPHONE_MODELS, seed + 2);
  const cfn = pickItem(CFN_VERS, seed + 3);
  const darwin = pickItem(DARWIN_VERS, seed + 4);
  if (baseUA && typeof baseUA === 'string') {
    let ua = baseUA;
    let changed = false;
    if (/iOS \d+(\.\d+){0,2}/.test(ua)) { ua = ua.replace(/iOS \d+(\.\d+){0,2}/, `iOS ${iosVer}`); changed = true; }
    if (/Scale\/\d+(\.\d+)?/.test(ua)) { ua = ua.replace(/Scale\/\d+(\.\d+)?/, `Scale/${scale}`); changed = true; }
    if (/iPhone\d+,\d+/.test(ua)) { ua = ua.replace(/iPhone\d+,\d+/, model); changed = true; }
    if (/CFNetwork\/[\d.]+/.test(ua)) { ua = ua.replace(/CFNetwork\/[\d.]+/, `CFNetwork/${cfn}`); changed = true; }
    if (/Darwin\/[\d.]+/.test(ua)) { ua = ua.replace(/Darwin\/[\d.]+/, `Darwin/${darwin}`); changed = true; }
    if (changed) return ua;
  }
  return `WeTalk/30.6.0 (com.innovationworks.wetalk; build:28; iOS ${iosVer}) Alamofire/5.4.3`;
}

function buildSignedParamsRaw(capture, overrideDeviceId) {
  const params = {};
  Object.keys(capture.paramsRaw || {}).forEach(k => {
    if (k !== 'sign' && k !== 'signDate') params[k] = capture.paramsRaw[k];
  });
  if (overrideDeviceId && params.uniquedeviceid) params.uniquedeviceid = overrideDeviceId;
  params.signDate = getUTCSignDate();
  const signBase = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  params.sign = MD5(signBase + SECRET);
  return params;
}

function buildUrl(path, capture, overrideDeviceId) {
  const params = buildSignedParamsRaw(capture, overrideDeviceId);
  const qs = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  return `https://${API_HOST}/app/${path}?${qs}`;
}

function randHex(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s.toUpperCase();
}

function genFakeDeviceId() {
  return `${randHex(8)}-${randHex(4)}-${randHex(4)}-${randHex(4)}-${randHex(12)}WeTalkIOS`;
}

// Egern 由 ctx.http 管理连接，不需要手动设 Host/Connection。
// 抓到的头大小写不定，Accept 必须不分大小写地判重，否则会发出两个 Accept。
function buildHeaders(capture, ua) {
  const headers = {};
  let hasAccept = false;
  Object.keys(capture.headers || {}).forEach(k => {
    const lk = k.toLowerCase();
    if (lk === 'content-length' || lk === 'user-agent' || lk === 'host' ||
        lk === 'connection' || lk === 'proxy-connection' || lk === 'keep-alive' ||
        lk.charAt(0) === ':') return;
    if (lk === 'accept') hasAccept = true;
    headers[k] = capture.headers[k];
  });
  if (!hasAccept) headers['Accept'] = 'application/json';
  headers['User-Agent'] = ua;
  return headers;
}

function sleep(ms) {
  if (typeof setTimeout === 'function') {
    return new Promise(r => setTimeout(r, ms));
  }
  // 运行时未提供定时器时的退化路径：忙等。会占用 CPU，仅作保底。
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy wait */ }
  return Promise.resolve();
}

const RETRYABLE = /SSL|SSLSessionState|timeout|timed out|reset|connection|network|stream closed|closed|EOF/i;

async function runAccount(ctx, acc, index, total) {
  const email = acc.email || (acc.capture && acc.capture.paramsRaw ? emailKeyOf(acc.capture.paramsRaw) : '');
  const tag = `[账号${index + 1}/${total} ${acc.alias || email || acc.id}]`;
  const ua = buildUA(acc.baseUA, acc.uaSeed);
  const headers = buildHeaders(acc.capture, ua);
  const fakeDeviceId = genFakeDeviceId();
  const msgs = [`${tag}${email ? `\n📧 ${email}` : ''}`];

  async function fetchApi(path, useFakeId, retry = 3) {
    const overrideId = useFakeId ? fakeDeviceId : null;
    try {
      const resp = await ctx.http.get(buildUrl(path, acc.capture, overrideId), {
        headers,
        timeout: 20000
      });
      return await resp.json();
    } catch (err) {
      const m = String((err && (err.error || err.message)) || err || '');
      if (retry > 0 && RETRYABLE.test(m)) {
        await sleep(1200);
        return fetchApi(path, useFakeId, retry - 1);
      }
      throw new Error(m || '请求失败');
    }
  }

  try {
    try {
      const d = await fetchApi('queryBalanceAndBonus');
      if (d.retcode === 0) msgs.push(`💰 余额：${d.result.balance} Coins`);
      else msgs.push(`⚠️ 查询：${d.retmsg}`);
    } catch (e) { msgs.push(`❌ 查询：${e.message}`); }

    try {
      const d = await fetchApi('checkIn');
      if (d.retcode === 0) msgs.push(`✅ 签到：${(d.result?.bonusHint || d.retmsg || '').replace(/\n/g, ' ')}`);
      else msgs.push(`⚠️ 签到：${d.retmsg}`);
    } catch (e) { msgs.push(`❌ 签到：${e.message}`); }

    for (let i = 1; i <= MAX_VIDEO; i++) {
      await sleep(i === 1 ? 1500 : VIDEO_DELAY);
      try {
        const d = await fetchApi('videoBonus', true);
        if (d.retcode === 0) {
          msgs.push(`🎬 视频${i}：+${d.result?.bonus || '?'} Coins`);
        } else {
          msgs.push(`⏸ 视频${i}：${d.retmsg}`);
          break; // 与原版一致：非 0 返回即停止后续视频
        }
      } catch (e) {
        msgs.push(`❌ 视频${i}：${e.message}`);
        break;
      }
    }

    try {
      const d = await fetchApi('queryBalanceAndBonus');
      if (d.retcode === 0) msgs.push(`💰 最新余额：${d.result.balance} Coins`);
    } catch (e) { /* 收尾查询失败不影响整体结果 */ }
  } catch (err) {
    msgs.push(`❌ 异常：${(err && err.message) || String(err)}`);
  }

  return msgs.join('\n');
}

async function handleCapture(ctx) {
  const url = ctx.request.url;
  const paramsRaw = parseRawQuery(url);
  const headersMap = headersToMap(ctx.request.headers);

  let baseUA = '';
  Object.keys(headersMap).forEach(k => {
    if (k.toLowerCase() === 'user-agent') baseUA = headersMap[k];
  });

  const email = emailKeyOf(paramsRaw);
  if (!email) {
    ctx.notify({
      title: scriptName,
      subtitle: '⚠️ 抓取失败',
      body: '请求里未取到 email 参数，无法识别账号。请确认已登录后再触发抓包。'
    });
    return;
  }

  const store = loadStore(ctx);
  const now = Date.now();
  const existed = !!store.accounts[email];
  const uaSeed = existed ? store.accounts[email].uaSeed : store.order.length;
  const alias = existed ? (store.accounts[email].alias || email) : email;

  store.accounts[email] = {
    id: email,
    email,
    alias,
    uaSeed,
    baseUA,
    capture: { url, paramsRaw, headers: headersMap },
    createdAt: existed ? store.accounts[email].createdAt : now,
    updatedAt: now
  };
  if (!existed) store.order.push(email);
  saveStore(ctx, store);

  const total = store.order.length;
  ctx.notify({
    title: scriptName,
    subtitle: existed ? '🔄 账号参数已更新' : '✅ 新账号已入库',
    body: `${email}\n当前账号总数：${total}`
  });
  console.log(`【${scriptName}】${existed ? 'update' : 'add'} account ${email}，共 ${total} 个账号`);
  console.log(`【${scriptName}】已保存请求头 ${Object.keys(headersMap).length} 个：${Object.keys(headersMap).join(', ')}`);
}

async function handleCron(ctx) {
  const store = loadStore(ctx);
  const ids = store.order.filter(id => store.accounts[id]);

  if (!ids.length) {
    ctx.notify({
      title: scriptName,
      subtitle: '⚠️ 未抓到任何账号',
      body: '请先打开 WeTalk 触发抓包'
    });
    return;
  }

  const total = ids.length;
  const results = [];
  for (let i = 0; i < ids.length; i++) {
    results.push(await runAccount(ctx, store.accounts[ids[i]], i, total));
    if (i < ids.length - 1) await sleep(ACCOUNT_GAP);
  }

  ctx.notify({
    title: scriptName,
    subtitle: `🎉 全部完成 (${total}个账号)`,
    body: results.join('\n———\n')
  });
}

export default async function (ctx) {
  if (typeof setTimeout !== 'function') {
    console.log(`【${scriptName}】警告：当前运行时无 setTimeout，延时改用忙等，会占用 CPU。`);
  }
  try {
    if (ctx.request) {
      // 请求脚本：只读取不改写，直接返回即为放行
      await handleCapture(ctx);
      return;
    }
    await handleCron(ctx);
  } catch (err) {
    const msg = (err && (err.message || err.error)) || String(err);
    console.log(`【${scriptName}】未捕获异常：${msg}`);
    try {
      ctx.notify({ title: scriptName, subtitle: '❌ 任务异常', body: msg });
    } catch (e) { /* 通知失败不再抛出 */ }
  }
}
