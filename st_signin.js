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

        const signinPageOptions = {
            url: LOGIN_PAGE_URL,
            headers: headers
        };

        const signinPageResponse = await httpRequest(signinPageOptions);
        
        if (!signinPageResponse || !signinPageResponse.body) {
            throw new Error('访问签到页面失败');
        }
        
        const pageBody = signinPageResponse.body;
        
        // Step 3: 解析表单参数
        console.log('[签到] Step 3: 解析签到参数...');
        const formhash = pageBody.match(/name="formhash"\s+value="([^"]+)"/)[1];
        
        if (!formhash) {
            $notify('SteamTools签到', '未找到formhash参数');
            throw new Error('未找到formhash参数');
        }
        
        console.log(`[签到] formhash: ${formhash}`);

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
            body: postBody,
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
            return;
        } else if (result.includes('已经签过')) {
            console.log('[签到] ℹ️ 今日已签到');
            $notify('SteamTools签到', 'ℹ️ 今日已签到', '');
            return;
        } else {
            console.log('[签到] ⚠️ 签到状态不明确');
            $notify('SteamTools签到', '⚠️ 状态不明', '请手动检查');
            return;
        }
        
    } catch (error) {
        console.log(`[签到] ❌ 错误: ${error.message}`);
        $notify('SteamTools签到', '❌ 签到失败', String(error.message || error));
        return;
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