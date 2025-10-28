#!/usr/bin/env node

/**
 * クイック通知テスト
 * 1. WebSocketクライアントとして接続
 * 2. テストイベントを作成
 * 3. 通知を受信できるか確認
 */

const WebSocket = require('ws');
const https = require('https');

console.log('🚀 クイック通知テスト開始\n');

const TOKEN = require('fs').readFileSync(require('os').homedir() + '/.git-credentials', 'utf8')
    .match(/github\.com:([^@]+)@/)?.[1] || '';

let ws;
let testPassed = false;

// ステップ1: WebSocket接続
console.log('📝 ステップ1: WebSocket接続...');
ws = new WebSocket('wss://minecraft.schale41.jp');

ws.on('open', () => {
    console.log('   ✅ WebSocket接続成功\n');
    
    // ステップ2: イベント作成（認証→作成）
    console.log('📝 ステップ2: テストイベントを作成...');
    
    // まず認証
    const authData = JSON.stringify({
        username: 'admin',
        password: 'admin123'
    });
    
    const authOptions = {
        hostname: 'minecraft.schale41.jp',
        port: 443,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(authData)
        }
    };
    
    const authReq = https.request(authOptions, (authRes) => {
        let authCookie = '';
        const cookies = authRes.headers['set-cookie'];
        if (cookies) {
            authCookie = cookies.map(c => c.split(';')[0]).join('; ');
        }
        
        authRes.on('data', () => {});
        authRes.on('end', () => {
            if (authRes.statusCode === 200) {
                console.log('   ✅ 認証成功\n');
                
                // イベント作成
                const now = new Date();
                const eventDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                
                const eventData = JSON.stringify({
                    title: `通知テスト ${now.toLocaleTimeString('ja-JP')}`,
                    description: 'ブラウザで通知を確認してください',
                    event_date: eventDate.toISOString(),
                    event_type: 'event'
                });
                
                const eventOptions = {
                    hostname: 'minecraft.schale41.jp',
                    port: 443,
                    path: '/api/events',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(eventData),
                        'Cookie': authCookie
                    }
                };
                
                const eventReq = https.request(eventOptions, (eventRes) => {
                    let eventResponse = '';
                    eventRes.on('data', (chunk) => {
                        eventResponse += chunk;
                    });
                    
                    eventRes.on('end', () => {
                        if (eventRes.statusCode === 200) {
                            const result = JSON.parse(eventResponse);
                            console.log('   ✅ イベント作成成功');
                            console.log(`   📋 イベントID: ${result.id}\n`);
                            console.log('📝 ステップ3: 通知を待機中（5秒）...\n');
                        } else {
                            console.log('   ❌ イベント作成失敗:', eventRes.statusCode);
                        }
                    });
                });
                
                eventReq.on('error', (error) => {
                    console.log('   ❌ イベント作成エラー:', error.message);
                });
                
                eventReq.write(eventData);
                eventReq.end();
            } else {
                console.log('   ❌ 認証失敗:', authRes.statusCode);
            }
        });
    });
    
    authReq.on('error', (error) => {
        console.log('   ❌ 認証エラー:', error.message);
    });
    
    authReq.write(authData);
    authReq.end();
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        if (message.type === 'event_notification') {
            console.log('🎉'.repeat(30));
            console.log('✅ 通知を受信しました！');
            console.log('🎉'.repeat(30) + '\n');
            console.log('📬 通知内容:');
            console.log(`   タイトル: ${message.notification?.title}`);
            console.log(`   メッセージ: ${message.notification?.message}`);
            console.log('');
            console.log('✅ テスト成功！');
            console.log('');
            console.log('💡 あなたのブラウザで https://minecraft.schale41.jp を開いていれば');
            console.log('   同じ通知が表示されているはずです！');
            console.log('');
            
            testPassed = true;
            setTimeout(() => {
                ws.close();
                process.exit(0);
            }, 1000);
        }
    } catch (error) {
        // Ignore
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocketエラー:', error.message);
    process.exit(1);
});

// 10秒後にタイムアウト
setTimeout(() => {
    if (!testPassed) {
        console.log('⏰ タイムアウト（10秒）\n');
        console.log('⚠️  通知を受信できませんでした\n');
        console.log('💡 確認事項:');
        console.log('   1. サーバーが起動しているか: ps aux | grep server-enhanced');
        console.log('   2. ブラウザで https://minecraft.schale41.jp を開いているか');
        console.log('   3. ブラウザのコンソールでWebSocket接続エラーがないか');
        console.log('');
        ws.close();
        process.exit(1);
    }
}, 10000);
