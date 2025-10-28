#!/usr/bin/env node
/**
 * Notification System Test Script
 * 通知システムの動作確認スクリプト
 */

const WebSocket = require('ws');
const http = require('http');

console.log('🧪 通知システムテスト開始\n');

let testsPassed = 0;
let testsFailed = 0;
let ws = null;
let cookies = '';

// テスト1: WebSocket接続テスト
function test1_WebSocketConnection() {
    return new Promise((resolve, reject) => {
        console.log('📡 テスト1: WebSocket接続テスト');
        
        ws = new WebSocket('ws://localhost:3000');
        
        ws.on('open', () => {
            console.log('   ✅ WebSocket接続成功');
            testsPassed++;
            resolve();
        });
        
        ws.on('error', (error) => {
            console.log('   ❌ WebSocket接続失敗:', error.message);
            testsFailed++;
            reject(error);
        });
        
        setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                console.log('   ❌ WebSocket接続タイムアウト');
                testsFailed++;
                reject(new Error('Connection timeout'));
            }
        }, 5000);
    });
}

// テスト2: ログインテスト
function test2_Login() {
    return new Promise((resolve, reject) => {
        console.log('\n🔐 テスト2: 管理者ログイン');
        
        const postData = JSON.stringify({ password: 'admin123' });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            // Cookieを保存
            const setCookie = res.headers['set-cookie'];
            if (setCookie && setCookie.length > 0) {
                cookies = setCookie.map(c => c.split(';')[0]).join('; ');
                console.log('   🍪 Cookie保存:', cookies.substring(0, 50) + '...');
            }
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success) {
                        console.log('   ✅ ログイン成功');
                        testsPassed++;
                        resolve();
                    } else {
                        console.log('   ❌ ログイン失敗:', response);
                        testsFailed++;
                        reject(new Error('Login failed'));
                    }
                } catch (error) {
                    console.log('   ❌ レスポンス解析エラー:', error.message);
                    testsFailed++;
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ リクエストエラー:', error.message);
            testsFailed++;
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// テスト3: 通知受信テスト
function test3_NotificationReceive() {
    return new Promise((resolve, reject) => {
        console.log('\n📬 テスト3: 通知受信テスト');
        
        let notificationReceived = false;
        
        // WebSocketメッセージリスナー
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('   📨 受信メッセージ:', message.type);
                
                if (message.type === 'event_notification') {
                    notificationReceived = true;
                    console.log('   ✅ イベント通知を受信');
                    console.log('   📋 通知内容:');
                    console.log('      タイトル:', message.notification.title);
                    console.log('      メッセージ:', message.notification.message);
                    console.log('      イベントID:', message.notification.eventId);
                    testsPassed++;
                    resolve();
                }
            } catch (error) {
                console.log('   ⚠️  メッセージ解析エラー:', error.message);
            }
        });
        
        // イベントを作成
        setTimeout(() => {
            console.log('   📝 テストイベントを作成中...');
            
            const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const eventData = JSON.stringify({
                title: '🧪 自動テストイベント',
                description: '通知システムの自動テスト用イベント',
                event_date: futureDate.toISOString(),
                event_type: 'event'
            });
            
            console.log('   📅 イベント日時:', futureDate.toISOString());
            
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/events',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': eventData.length,
                    'Cookie': cookies
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        console.log('   📄 HTTPステータス:', res.statusCode);
                        console.log('   📄 レスポンス:', data.substring(0, 200));
                        const response = JSON.parse(data);
                        if (response.success) {
                            console.log('   ✅ イベント作成成功 (ID:', response.id + ')');
                        } else {
                            console.log('   ❌ イベント作成失敗:', response);
                            testsFailed++;
                            reject(new Error('Event creation failed'));
                        }
                    } catch (error) {
                        console.log('   ❌ レスポンス解析エラー:', error.message);
                        console.log('   📝 生データ:', data.substring(0, 500));
                        testsFailed++;
                        reject(error);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('   ❌ イベント作成エラー:', error.message);
                testsFailed++;
                reject(error);
            });
            
            req.write(eventData);
            req.end();
        }, 1000);
        
        // タイムアウト
        setTimeout(() => {
            if (!notificationReceived) {
                console.log('   ❌ 通知受信タイムアウト（10秒）');
                testsFailed++;
                reject(new Error('Notification timeout'));
            }
        }, 10000);
    });
}

// メイン処理
async function runTests() {
    try {
        await test1_WebSocketConnection();
        await test2_Login();
        await test3_NotificationReceive();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 テスト結果');
        console.log('='.repeat(50));
        console.log(`✅ 成功: ${testsPassed}個`);
        console.log(`❌ 失敗: ${testsFailed}個`);
        
        if (testsFailed === 0) {
            console.log('\n🎉 全てのテストが成功しました！');
            console.log('\n通知システムは正常に動作しています:');
            console.log('  1. WebSocket接続 ✅');
            console.log('  2. 管理者認証 ✅');
            console.log('  3. イベント通知配信 ✅');
        } else {
            console.log('\n⚠️  いくつかのテストが失敗しました。');
        }
        
        if (ws) ws.close();
        process.exit(testsFailed === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ テスト実行エラー:', error.message);
        if (ws) ws.close();
        process.exit(1);
    }
}

// スクリプト実行
console.log('🚀 テスト環境:');
console.log('   サーバー: http://localhost:3000');
console.log('   WebSocket: ws://localhost:3000');
console.log('   パスワード: admin123\n');

runTests();
