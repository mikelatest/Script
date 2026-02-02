/**
 * QuantumultX 脚本 - SteamTools 论坛签到
 * 
 * [MITM]
 * hostname = bbs.steamtools.net
 * 
 * [rewrite_local]
 * # 获取Cookie (访问论坛首页时自动获取)
 * ^https:\/\/bbs\.steamtools\.net\/.*$ url script-request-header st_signin.js
 * 
 * [task_local]
 * 0 9 * * * st_signin.js, tag=SteamTools签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/steam.png, enabled=true
 */

// const $ = new Env('SteamTools论坛签到');
const cookieKey = 'steamtools_cookie';
const userAgentKey = 'steamtools_ua';

// 配置
const config = {
    baseUrl: 'https://bbs.steamtools.net',
    loginUrl: 'https://bbs.steamtools.net/member.php?mod=logging&action=login',
    signinUrl: 'https://bbs.steamtools.net/plugin.php?id=dc_signin:sign&inajax=1',
    homeUrl: 'https://bbs.steamtools.net/',
};

// ==================== Cookie 获取 ====================
function getCookie() {
    if (typeof $request !== 'undefined') {
        const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
        const userAgent = $request.headers['User-Agent'] || $request.headers['user-agent'];
        
        if (cookie) {
            // 检查是否包含登录后的关键 Cookie
            if (cookie.includes('saltkey') || cookie.includes('auth')) {
                $.setdata(cookie, cookieKey);
                $.setdata(userAgent, userAgentKey);
                $notify('SteamTools', '✅ Cookie获取成功', '请关闭本脚本的重写功能');
                console.log(`[Cookie] ${cookie}`);
            } else {
                $notify('SteamTools', '⚠️ 请先登录', '请在浏览器中登录论坛后重试');
            }
        }
        $done({});
    }
}

// ==================== HTTP 请求 ====================
function httpRequest(options) {
    return new Promise((resolve, reject) => {
        if (typeof $task !== 'undefined') {
            // QuantumultX
            $task.fetch(options).then(
                response => {
                    resolve(response);
                },
                reason => {
                    reject(reason);
                }
            );
        } else if (typeof $httpClient !== 'undefined') {
            // Surge
            if (options.method === 'POST') {
                $httpClient.post(options, (error, response, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        response.body = data;
                        resolve(response);
                    }
                });
            } else {
                $httpClient.get(options, (error, response, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        response.body = data;
                        resolve(response);
                    }
                });
            }
        } else {
            reject(new Error('不支持的环境'));
        }
    });
}

// ==================== 签到功能 ====================
async function signin() {
    const cookie = $prefs.valueForKey(cookieKey);
    const userAgent = $prefs.valueForKey(userAgentKey) || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    
    if (!cookie) {
        console.log('[签到] ❌ 未获取到Cookie');
        $notify('SteamTools签到', '❌ 未获取到Cookie', '请先访问论坛获取Cookie');
        $done();
        return;
    }
    
    console.log('[签到] 开始签到流程...');
    
    try {
        // Step 1: 验证登录状态
        console.log('[签到] Step 1: 验证登录状态...');

        const homeOptions = {
            url: config.homeUrl,
            headers: {
                'Cookie': cookie,
                'User-Agent': userAgent,
            }
        };
        
        const homeResponse = await httpRequest(homeOptions);
        
        // 检查是否已登录
        if (homeResponse.body.includes('登录') && !homeResponse.body.includes('退出')) {
            console.log('[签到] ❌ Cookie已失效');
            $notify('SteamTools签到', '❌ Cookie已失效', '请重新获取Cookie');
            $done();
            return;
        }

        if (!homeResponse || !homeResponse.body) {
            throw new Error('访问首页失败');
        }
        
        console.log('[签到] ✓ 登录状态有效');
        
        // Step 2: 访问签到页面
        console.log('[签到] Step 2: 访问签到页面...');

        LOGIN_PAGE_URL = "https://bbs.steamtools.net/member.php?mod=logging&action=login"

        const signinPageOptions = {
            url: LOGIN_PAGE_URL,
            headers: {
                'Cookie': cookie,
                'User-Agent': userAgent,
            }
        };

        const signinPageResponse = await httpRequest(signinPageOptions);
        
        if (!signinPageResponse || !signinPageResponse.body) {
            throw new Error('访问签到页面失败');
        }
        
        const pageBody = signinPageResponse.body;
        
        // 检查是否已经签到
        if (pageBody.includes('已经签过')) {
            console.log('[签到] ℹ️ 今日已签到');
            $notify('SteamTools签到', 'ℹ️ 今日已签到', '明天再来吧~');
            $done();
            return;
        }
        
        // Step 3: 解析表单参数
        console.log('[签到] Step 3: 解析签到参数...');
        const formhash = pageBody.match(/name="formhash"\s+value="([^"]+)"/);
        const signtoken = pageBody.match(/name="signtoken"\s+value="([^"]+)"/);
        
        if (!formhash) {
            $notify('SteamTools签到', '未找到formhash参数');
            throw new Error('未找到formhash参数');
        }
        
        console.log(`[签到] formhash: ${formhash}`);
        console.log(`[签到] signtoken: ${signtoken || '无'}`);
        
        // Step 4: 随机选择心情
        const moods = ['1', '2', '3', '4', '5', '6', '7', '8'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        const moodNames = {
            '1': '开心', '2': '难过', '3': '郁闷', 
            '4': '无聊', '5': '怒', '6': '擦汗',
            '7': '奋斗', '8': '慵懒'
        };
        console.log(`[签到] Step 4: 选择心情: ${moodNames[randomMood] || randomMood}`);
        
        // Step 5: 提交签到
        console.log('[签到] Step 5: 提交签到...');

        const headers = {
            'Sec-Fetch-Dest' : `iframe`,
            'Connection' : `keep-alive`,
            'Accept-Encoding' : `gzip, deflate, br`,
            'Content-Type' : `application/x-www-form-urlencoded`,
            'Sec-Fetch-Site' : `same-origin`,
            'Origin' : `https://bbs.steamtools.net`,
            'User-Agent' : `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/144 Version/11.1.1 Safari/605.1.15`,
            'Sec-Fetch-Mode' : `navigate`,
            'Cookie' : cookie,
            'Host' : `bbs.steamtools.net`,
            'Referer' : `https://bbs.steamtools.net/index.php?mobile=no`,
            'Accept-Language' : `zh-CN,zh-Hans;q=0.9`,
            'Accept' : `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
        };

        const postBody = `
            formhash=${formhash}&
            signsubmit=yes&
            handlekey=signin&
            emotid=3&
            referer=https%3A%2F%2Fbbs.steamtools.net%2Findex.php%3Fmobile%3Dno&
            content=%E4%B8%BA%E4%BA%86%E7%BB%B4%E6%8A%A4%E5%AE%87%E5%AE%99%E5%92%8C%E5%B9%B3%EF%BC%8C%E6%89%93%E8%B5%B7%E7%B2%BE%E7%A5%9E%E6%9D%A5%EF%BC%81%7E%7E`;

        const signinOptions = {
            url: config.signinUrl,
            method: 'POST',
            headers: headers,
            body: postBody
        };
        
        const signinResponse = await httpRequest(signinOptions);
        
        if (!signinResponse || !signinResponse.body) {
            throw new Error('签到提交失败');
        }
        
        const result = signinResponse.body;
        console.log(`[签到结果] ${result}`);
        
        // Step 6: 解析签到结果
        if (result.includes('签到成功') || result.includes('恭喜')) {
            // 尝试提取奖励信息
            let rewardInfo = '签到成功';
            const rewardMatch = result.match(/获得随机奖励.*?(\d+)/);
            const daysMatch = result.match(/连续签到\s*(\d+)\s*天/);
            
            if (rewardMatch) {
                rewardInfo += `\n🎁 获得奖励: ${rewardMatch[0]}`;
            }
            if (daysMatch) {
                rewardInfo += `\n📅 连续签到: ${daysMatch[1]}天`;
            }
            
            console.log('[签到] ✅ 签到成功!');
            $notify('SteamTools签到', '✅ 签到成功', rewardInfo);
        } else if (result.includes('已经签到')) {
            console.log('[签到] ℹ️ 今日已签到');
            $notify('SteamTools签到', 'ℹ️ 今日已签到', '');
        } else {
            console.log('[签到] ⚠️ 签到状态不明确');
            $notify('SteamTools签到', '⚠️ 状态不明', '请手动检查');
        }
        
    } catch (error) {
        console.log(`[签到] ❌ 错误: ${error.message}`);
        $notify('SteamTools签到', '❌ 签到失败', String(error.message || error));
    }
}

// ==================== 主函数 ====================
(async () => {
    if (typeof $request !== 'undefined') {
        getCookie();
    } else {
        await signin();
    }
})();

// // ==================== HTTP 请求封装 ====================
// function httpGet(url, cookie, userAgent) {
//     return new Promise((resolve) => {
//         const options = {
//             url: url,
//             headers: {
//                 'Cookie': cookie,
//                 'User-Agent': userAgent,
//                 'Referer': config.baseUrl,
//                 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//                 'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
//             }
//         };
        
//         $.get(options, (error, response, body) => {
//             if (error) {
//                 console.log(`[HTTP GET] 错误: ${error}`);
//                 resolve(null);
//             } else {
//                 resolve({ response, body });
//             }
//         });
//     });
// }

// function httpPost(url, data, cookie, userAgent) {
//     return new Promise((resolve) => {
//         const body = Object.keys(data)
//             .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
//             .join('&');
        
//         const options = {
//             url: url,
//             headers: {
//                 'Cookie': cookie,
//                 'User-Agent': userAgent,
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Referer': config.signinUrl,
//                 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//                 'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
//                 'X-Requested-With': 'XMLHttpRequest'
//             },
//             body: body
//         };
        
//         $.post(options, (error, response, body) => {
//             if (error) {
//                 console.log(`[HTTP POST] 错误: ${error}`);
//                 resolve(null);
//             } else {
//                 resolve({ response, body });
//             }
//         });
//     });
// }

// // ==================== 主函数 ====================
// !(async () => {
//     if (typeof $request !== 'undefined') {
//         // 获取 Cookie 模式
//         getCookie();
//     } else {
//         // 签到模式
//         await signin();
//     }
// })()
//     .catch((e) => {
//         console.log(`❌ 脚本执行错误: ${e.message}`);
//         $.msg('SteamTools签到', '❌ 脚本错误', e.message);
//     })
//     .finally(() => {
//         $.done();
//     });

// // ==================== Env.js ====================
// function Env(name, opts) {
//     class Http {
//         constructor(env) {
//             this.env = env;
//         }
//         send(opts, method = 'GET') {
//             opts = typeof opts === 'string' ? { url: opts } : opts;
//             let sender = this.get;
//             if (method === 'POST') {
//                 sender = this.post;
//             }
//             return new Promise((resolve, reject) => {
//                 sender.call(this, opts, (err, resp, body) => {
//                     if (err) reject(err);
//                     else resolve(resp);
//                 });
//             });
//         }
//         get(opts) {
//             return this.send.call(this.env, opts);
//         }
//         post(opts) {
//             return this.send.call(this.env, opts, 'POST');
//         }
//     }
//     return new (class {
//         constructor(name, opts) {
//             this.name = name;
//             this.http = new Http(this);
//             this.data = null;
//             this.dataFile = 'box.dat';
//             this.logs = [];
//             this.isSurge = () => typeof $httpClient !== 'undefined';
//             this.isQuanX = () => typeof $task !== 'undefined';
//             this.isLoon = () => typeof $loon !== 'undefined';
//             this.toObj = (str, defaultValue = null) => {
//                 try {
//                     return JSON.parse(str);
//                 } catch {
//                     return defaultValue;
//                 }
//             };
//             this.toStr = (obj, defaultValue = null) => {
//                 try {
//                     return JSON.stringify(obj);
//                 } catch {
//                     return defaultValue;
//                 }
//             };
//             this.getjson = (key, defaultValue) => {
//                 let json = defaultValue;
//                 const val = this.getdata(key);
//                 if (val) {
//                     try {
//                         json = JSON.parse(this.getdata(key));
//                     } catch {}
//                 }
//                 return json;
//             };
//             this.setjson = (val, key) => {
//                 try {
//                     return this.setdata(JSON.stringify(val), key);
//                 } catch {
//                     return false;
//                 }
//             };
//             this.getScript = (url) => {
//                 return new Promise((resolve) => {
//                     this.get({ url }, (err, resp, body) => resolve(body));
//                 });
//             };
//             this.runScript = (script, runOpts) => {
//                 return new Promise((resolve) => {
//                     let httpapi = this.getdata('@chavy_boxjs_userCfgs.httpapi');
//                     httpapi = httpapi ? httpapi.replace(/\n/g, '').trim() : httpapi;
//                     let httpapi_timeout = this.getdata('@chavy_boxjs_userCfgs.httpapi_timeout');
//                     httpapi_timeout = httpapi_timeout ? httpapi_timeout * 1 : 20;
//                     httpapi_timeout = runOpts && runOpts.timeout ? runOpts.timeout : httpapi_timeout;
//                     const [key, addr] = httpapi.split('@');
//                     const opts = {
//                         url: `http://${addr}/v1/scripting/evaluate`,
//                         body: { script_text: script, mock_type: 'cron', timeout: httpapi_timeout },
//                         headers: { 'X-Key': key, 'Accept': '*/*' }
//                     };
//                     this.post(opts, (err, resp, body) => resolve(body));
//                 }).catch((e) => this.logErr(e));
//             };
//             this.loaddata = () => {
//                 if (this.isNode()) {
//                     this.fs = this.fs ? this.fs : require('fs');
//                     this.path = this.path ? this.path : require('path');
//                     const curDirDataFilePath = this.path.resolve(this.dataFile);
//                     const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile);
//                     const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
//                     const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
//                     if (isCurDirDataFile || isRootDirDataFile) {
//                         const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath;
//                         try {
//                             return JSON.parse(this.fs.readFileSync(datPath));
//                         } catch (e) {
//                             return {};
//                         }
//                     } else return {};
//                 } else return {};
//             };
//             this.writedata = () => {
//                 if (this.isNode()) {
//                     this.fs = this.fs ? this.fs : require('fs');
//                     this.path = this.path ? this.path : require('path');
//                     const curDirDataFilePath = this.path.resolve(this.dataFile);
//                     const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile);
//                     const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
//                     const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
//                     const jsondata = JSON.stringify(this.data);
//                     if (isCurDirDataFile) {
//                         this.fs.writeFileSync(curDirDataFilePath, jsondata);
//                     } else if (isRootDirDataFile) {
//                         this.fs.writeFileSync(rootDirDataFilePath, jsondata);
//                     } else {
//                         this.fs.writeFileSync(curDirDataFilePath, jsondata);
//                     }
//                 }
//             };
//             this.lodash_get = (source, path, defaultValue = undefined) => {
//                 const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.');
//                 let result = source;
//                 for (const p of paths) {
//                     result = Object(result)[p];
//                     if (result === undefined) {
//                         return defaultValue;
//                     }
//                 }
//                 return result;
//             };
//             this.lodash_set = (obj, path, value) => {
//                 if (Object(obj) !== obj) return obj;
//                 if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
//                 path.slice(0, -1).reduce((a, c, i) => (Object(a[c]) === a[c] ? a[c] : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {})), obj)[path[path.length - 1]] = value;
//                 return obj;
//             };
//             this.getdata = (key) => {
//                 let val = this.getval(key);
//                 if (/^@/.test(key)) {
//                     const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
//                     const objval = objkey ? this.getval(objkey) : '';
//                     if (objval) {
//                         try {
//                             const objedval = JSON.parse(objval);
//                             val = objedval ? this.lodash_get(objedval, paths, '') : val;
//                         } catch (e) {
//                             val = '';
//                         }
//                     }
//                 }
//                 return val;
//             };
//             this.setdata = (val, key) => {
//                 let issuc = false;
//                 if (/^@/.test(key)) {
//                     const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
//                     const objdat = this.getval(objkey);
//                     const objval = objkey ? (objdat === 'null' ? null : objdat || '{}') : '{}';
//                     try {
//                         const objedval = JSON.parse(objval);
//                         this.lodash_set(objedval, paths, val);
//                         issuc = this.setval(JSON.stringify(objedval), objkey);
//                     } catch (e) {
//                         const objedval = {};
//                         this.lodash_set(objedval, paths, val);
//                         issuc = this.setval(JSON.stringify(objedval), objkey);
//                     }
//                 } else {
//                     issuc = this.setval(val, key);
//                 }
//                 return issuc;
//             };
//             this.getval = (key) => {
//                 if (this.isSurge() || this.isLoon()) {
//                     return $persistentStore.read(key);
//                 } else if (this.isQuanX()) {
//                     return $prefs.valueForKey(key);
//                 } else if (this.isNode()) {
//                     this.data = this.loaddata();
//                     return this.data[key];
//                 } else {
//                     return (this.data && this.data[key]) || null;
//                 }
//             };
//             this.setval = (val, key) => {
//                 if (this.isSurge() || this.isLoon()) {
//                     return $persistentStore.write(val, key);
//                 } else if (this.isQuanX()) {
//                     return $prefs.setValueForKey(val, key);
//                 } else if (this.isNode()) {
//                     this.data = this.loaddata();
//                     this.data[key] = val;
//                     this.writedata();
//                     return true;
//                 } else {
//                     return (this.data && this.data[key]) || null;
//                 }
//             };
//             this.msg = (title = name, subt = '', desc = '', opts) => {
//                 const toEnvOpts = (rawopts) => {
//                     if (!rawopts) return rawopts;
//                     if (typeof rawopts === 'string') {
//                         if (this.isLoon()) return rawopts;
//                         else if (this.isQuanX()) return { 'open-url': rawopts };
//                         else if (this.isSurge()) return { url: rawopts };
//                         else return undefined;
//                     } else if (typeof rawopts === 'object') {
//                         if (this.isLoon()) {
//                             let openUrl = rawopts.openUrl || rawopts.url || rawopts['open-url'];
//                             let mediaUrl = rawopts.mediaUrl || rawopts['media-url'];
//                             return { openUrl, mediaUrl };
//                         } else if (this.isQuanX()) {
//                             let openUrl = rawopts['open-url'] || rawopts.url || rawopts.openUrl;
//                             let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl;
//                             return { 'open-url': openUrl, 'media-url': mediaUrl };
//                         } else if (this.isSurge()) {
//                             let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url'];
//                             return { url: openUrl };
//                         }
//                     } else {
//                         return undefined;
//                     }
//                 };
//                 if (!this.isMute) {
//                     if (this.isSurge() || this.isLoon()) {
//                         $notification.post(title, subt, desc, toEnvOpts(opts));
//                     } else if (this.isQuanX()) {
//                         $notify(title, subt, desc, toEnvOpts(opts));
//                     }
//                 }
//                 let logs = ['', '==============📣系统通知📣=============='];
//                 logs.push(title);
//                 subt ? logs.push(subt) : '';
//                 desc ? logs.push(desc) : '';
//                 console.log(logs.join('\n'));
//                 this.logs = this.logs.concat(logs);
//             };
//             this.log = (...log) => {
//                 if (log.length > 0) {
//                     this.logs = [...this.logs, ...log];
//                 }
//                 console.log(log.join(this.logSeparator));
//             };
//             this.logErr = (err, msg) => {
//                 const isPrintSack = !this.isSurge() && !this.isQuanX() && !this.isLoon();
//                 if (!isPrintSack) {
//                     this.log('', `❗️${this.name}, 错误!`, err);
//                 } else {
//                     this.log('', `❗️${this.name}, 错误!`, err.stack);
//                 }
//             };
//             this.wait = (time) => {
//                 return new Promise((resolve) => setTimeout(resolve, time));
//             };
//             this.done = (val = {}) => {
//                 const endTime = new Date().getTime();
//                 const costTime = (endTime - this.startTime) / 1000;
//                 this.log('', `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
//                 this.log();
//                 if (this.isSurge() || this.isQuanX() || this.isLoon()) {
//                     $done(val);
//                 }
//             };
//         }
//     })(name, opts);
// }