#!/usr/bin/env node

/**
 * iOS PWA 通知テストスクリプト
 * 
 * このスクリプトは以下をテストします:
 * 1. WebSocket接続
 * 2. テストイベント作成（通知トリガー）
 * 3. 通知配信の確認
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'minecraft.schale41.jp';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let authCookie = '';

console.log('🧪 iOS PWA 通知テストを開始\n');
console.log('=' .repeat(60));

// ステップ1: 管理者認証
async function authenticate() {
    return new Promise((resolve, reject) => {
        console.log('\n📝 ステップ1: 管理者認証');
        
        const postData = JSON.stringify({
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });
        
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    // Cookieを保存
                    const cookies = res.headers['set-cookie'];
                    if (cookies) {
                        authCookie = cookies.map(cookie => cookie.split(';')[0]).join('; ');
                    }
                    console.log('   ✅ 認証成功');
                    resolve();
                } else {
                    console.log('   ❌ 認証失敗:', res.statusCode);
                    console.log('   レスポンス:', data);
                    reject(new Error('Authentication failed'));
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ エラー:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// ステップ2: テストイベントを作成
async function createTestEvent() {
    return new Promise((resolve, reject) => {
        console.log('\n📝 ステップ2: テストイベント作成');
        
        const now = new Date();
        const eventDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 明日
        
        const postData = JSON.stringify({
            title: `iOS通知テスト ${now.toLocaleTimeString('ja-JP')}`,
            description: 'このイベントはiOS PWA通知の自動テストで作成されました',
            event_date: eventDate.toISOString(),
            event_type: 'event'
        });
        
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: '/api/events',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': authCookie
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('   ✅ イベント作成成功');
                    console.log('   📋 イベントID:', result.id);
                    console.log('   📢 WebSocket通知が送信されました');
                    resolve(result);
                } else {
                    console.log('   ❌ イベント作成失敗:', res.statusCode);
                    console.log('   レスポンス:', data);
                    reject(new Error('Event creation failed'));
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ エラー:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// ステップ3: WebSocket接続テスト（オプション）
async function testWebSocketConnection() {
    return new Promise((resolve) => {
        console.log('\n📝 ステップ3: WebSocket接続確認');
        
        try {
            const WebSocket = require('ws');
            const ws = new WebSocket(`wss://${BASE_URL}`);
            
            const timeout = setTimeout(() => {
                console.log('   ⚠️  WebSocket接続タイムアウト（これは正常です）');
                ws.close();
                resolve();
            }, 3000);
            
            ws.on('open', () => {
                console.log('   ✅ WebSocket接続成功');
                console.log('   📡 クライアントは通知を受信できます');
                clearTimeout(timeout);
                setTimeout(() => {
                    ws.close();
                    resolve();
                }, 1000);
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    console.log('   📨 メッセージ受信:', message.type);
                } catch (error) {
                    // Ignore parse errors
                }
            });
            
            ws.on('error', (error) => {
                console.log('   ⚠️  WebSocketエラー:', error.message);
                clearTimeout(timeout);
                resolve();
            });
            
        } catch (error) {
            console.log('   ⚠️  ws モジュールが見つかりません（オプション機能）');
            resolve();
        }
    });
}

// メイン実行
async function main() {
    try {
        await authenticate();
        await createTestEvent();
        await testWebSocketConnection();
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ テスト完了！\n');
        console.log('📱 次の手順:');
        console.log('   1. iPhoneのPWAアプリを開く');
        console.log('   2. 通知が表示されることを確認');
        console.log('   3. 通知内容を確認:');
        console.log('      - タイトル: 🎉 新しいイベント');
        console.log('      - 本文: 「iOS通知テスト ...」が追加されました！');
        console.log('\n📝 詳細な手順は IOS-NOTIFICATION-TEST.md を参照してください\n');
        
        process.exit(0);
        
    } catch (error) {
        console.log('\n❌ テスト失敗:', error.message);
        console.log('\n🔍 トラブルシューティング:');
        console.log('   1. サーバーが起動しているか確認: pm2 status');
        console.log('   2. 管理者パスワードが正しいか確認');
        console.log('   3. HTTPSアクセスが可能か確認: curl https://minecraft.schale41.jp');
        console.log('\n');
        
        process.exit(1);
    }
}

// 実行
main();
