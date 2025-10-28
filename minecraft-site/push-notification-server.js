#!/usr/bin/env node

/**
 * プッシュ通知サーバー
 * 
 * LINE Notify、Telegram、Discord等の
 * サードパーティサービスを使用して通知を送信
 */

const https = require('https');
const Database = require('./database');

const db = new Database();

// LINE Notify設定（トークンを設定してください）
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN || '';

// Discord Webhook設定（URLを設定してください）
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

let lastNotifiedEventId = 0;

// LINE Notifyで通知を送信
function sendLineNotification(message) {
    if (!LINE_NOTIFY_TOKEN) return Promise.resolve();
    
    return new Promise((resolve) => {
        const postData = `message=${encodeURIComponent(message)}`;
        
        const options = {
            hostname: 'notify-api.line.me',
            port: 443,
            path: '/api/notify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`
            }
        };
        
        const req = https.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ LINE通知送信成功');
                } else {
                    console.log('⚠️ LINE通知送信失敗:', res.statusCode);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ LINE通知エラー:', error.message);
            resolve();
        });
        
        req.write(postData);
        req.end();
    });
}

// Discord Webhookで通知を送信
function sendDiscordNotification(title, message) {
    if (!DISCORD_WEBHOOK_URL) return Promise.resolve();
    
    return new Promise((resolve) => {
        const webhook = new URL(DISCORD_WEBHOOK_URL);
        
        const postData = JSON.stringify({
            embeds: [{
                title: title,
                description: message,
                color: 0x00ff00,
                timestamp: new Date().toISOString()
            }]
        });
        
        const options = {
            hostname: webhook.hostname,
            port: 443,
            path: webhook.pathname + webhook.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode === 204 || res.statusCode === 200) {
                    console.log('✅ Discord通知送信成功');
                } else {
                    console.log('⚠️ Discord通知送信失敗:', res.statusCode);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Discord通知エラー:', error.message);
            resolve();
        });
        
        req.write(postData);
        req.end();
    });
}

// 新しいイベントをチェック
async function checkForNewEvents() {
    try {
        const events = await db.getEvents(1);
        
        if (!events || events.length === 0) {
            return;
        }
        
        const latestEvent = events[0];
        
        // 新しいイベントがあれば通知
        if (latestEvent.id > lastNotifiedEventId && lastNotifiedEventId !== 0) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ja-JP', {
                timeZone: 'Asia/Tokyo',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            console.log(`\n🔔 [${timeStr}] 新しいイベント検出: ${latestEvent.title}`);
            
            // 日本時間でフォーマット
            const eventDate = new Date(latestEvent.event_date);
            const dateStr = eventDate.toLocaleString('ja-JP', {
                timeZone: 'Asia/Tokyo',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const message = `\n🎉 新しいイベント\n\n「${latestEvent.title}」が追加されました！\n📅 ${dateStr}\n\n✨ https://minecraft.schale41.jp`;
            
            // 各サービスに通知を送信
            await Promise.all([
                sendLineNotification(message),
                sendDiscordNotification('🎉 新しいイベント', message)
            ]);
            
            console.log('');
        }
        
        lastNotifiedEventId = latestEvent.id;
        
    } catch (error) {
        console.error('❌ イベントチェックエラー:', error.message);
    }
}

// 初期化
async function initialize() {
    console.log('🚀 プッシュ通知サーバーを起動中...\n');
    console.log('=' .repeat(60));
    
    // データベース接続待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 最初のイベントIDを取得
    const events = await db.getEvents(1);
    if (events && events.length > 0) {
        lastNotifiedEventId = events[0].id;
        console.log(`📋 最新イベントID: ${lastNotifiedEventId}`);
    }
    
    // 設定確認
    console.log('\n⚙️  通知設定:');
    console.log(`   LINE Notify: ${LINE_NOTIFY_TOKEN ? '✅ 有効' : '❌ 無効'}`);
    console.log(`   Discord Webhook: ${DISCORD_WEBHOOK_URL ? '✅ 有効' : '❌ 無効'}`);
    
    if (!LINE_NOTIFY_TOKEN && !DISCORD_WEBHOOK_URL) {
        console.log('\n⚠️  警告: 通知サービスが設定されていません');
        console.log('   環境変数を設定してください:');
        console.log('   export LINE_NOTIFY_TOKEN="your_token_here"');
        console.log('   export DISCORD_WEBHOOK_URL="your_webhook_url_here"');
    }
    
    console.log('\n⏰ チェック間隔: 5分ごと');
    console.log('=' .repeat(60));
    console.log('\n✅ 監視を開始しました...');
    console.log('   (Ctrl+C で終了)\n');
    
    // 5分ごとにチェック
    setInterval(checkForNewEvents, 5 * 60 * 1000);
    
    // 即座に1回チェック
    await checkForNewEvents();
}

// サーバー起動
initialize().catch(error => {
    console.error('❌ 初期化エラー:', error);
    process.exit(1);
});

// 終了処理
process.on('SIGINT', () => {
    console.log('\n\n👋 プッシュ通知サーバーを終了します...');
    process.exit(0);
});
