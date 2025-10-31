#!/usr/bin/env node

/**
 * 即座に通知テストを実行
 * 日本時間でイベントを作成
 */

const https = require('https');

console.log('🚀 通知テストを実行します\n');

// 日本時間を取得
const now = new Date();
const jstOffset = 9 * 60 * 60 * 1000; // 9時間のミリ秒
const jstDate = new Date(now.getTime() + jstOffset);
const timeString = jstDate.toLocaleTimeString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

console.log(`📅 日本時間: ${timeString}\n`);

// 認証
function authenticate() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            username: 'admin',
            password: 'admin123'
        });
        
        const options = {
            hostname: 'minecraft.schale41.jp',
            port: 443,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let cookie = '';
            if (res.headers['set-cookie']) {
                cookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            }
            
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ 認証成功\n');
                    resolve(cookie);
                } else {
                    reject(new Error('認証失敗'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// イベント作成
function createEvent(cookie) {
    return new Promise((resolve, reject) => {
        const eventDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const postData = JSON.stringify({
            title: `📱 通知テスト ${timeString}`,
            description: `iPhoneで通知を確認してください（日本時間: ${timeString}）`,
            event_date: eventDate.toISOString(),
            event_type: 'event'
        });
        
        const options = {
            hostname: 'minecraft.schale41.jp',
            port: 443,
            path: '/api/events',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': cookie
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ イベント作成成功');
                    console.log(`📋 イベントID: ${result.id}`);
                    console.log(`📱 タイトル: 📱 通知テスト ${timeString}\n`);
                    resolve(result);
                } else {
                    reject(new Error('イベント作成失敗'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 実行
async function main() {
    try {
        const cookie = await authenticate();
        await createEvent(cookie);
        
        console.log('🎉'.repeat(30));
        console.log('✅ 通知が送信されました！');
        console.log('🎉'.repeat(30));
        console.log('');
        console.log('📱 iPhoneで以下を確認してください:');
        console.log('   1. PWAアプリが開いている');
        console.log('   2. 画面上部に通知バナーが表示される');
        console.log('   3. タイトル: 🎉 新しいイベント');
        console.log(`   4. 本文: 「📱 通知テスト ${timeString}」が追加されました！`);
        console.log('');
        console.log('💡 通知が届かない場合:');
        console.log('   - PWAアプリを再起動してください');
        console.log('   - 通知許可を確認してください');
        console.log('   - アプリをフォアグラウンドにしてください');
        console.log('');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    }
}

main();
