#!/usr/bin/env node
/**
 * Simple Notification Test - WebSocket Client + Event Creation
 * シンプルな通知テスト
 */

const WebSocket = require('ws');
const { exec } = require('child_process');

console.log('🧪 通知システム簡易テスト\n');

// WebSocket接続
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
    console.log('✅ WebSocket接続成功（公開ユーザーとして接続）\n');
    console.log('📡 通知を待機中...\n');
    
    // 3秒後にイベントを作成
    setTimeout(() => {
        console.log('📝 管理者としてテストイベントを作成中...\n');
        
        const curl = `curl -X POST http://localhost:3000/api/events \
            -H "Content-Type: application/json" \
            -b /tmp/cookies.txt \
            -d '{"title":"✨ 最終通知テスト","description":"通知システム最終確認","event_date":"2025-10-29T15:00:00.000Z","event_type":"event"}'`;
        
        exec(curl, (error, stdout, stderr) => {
            if (error) {
                console.log('❌ イベント作成エラー:', error.message);
                return;
            }
            try {
                const result = JSON.parse(stdout);
                if (result.success) {
                    console.log('✅ イベント作成成功 (ID:', result.id + ')\n');
                    console.log('⏳ 通知が届くまで待機中... (最大10秒)\n');
                }
            } catch (e) {
                console.log('⚠️  レスポンス:', stdout);
            }
        });
    }, 3000);
    
    // タイムアウト
    setTimeout(() => {
        console.log('\n⏰ テスト終了（10秒経過）');
        ws.close();
        process.exit(0);
    }, 13000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        if (message.type === 'status_update') {
            console.log('📊 ステータス更新受信');
        } else if (message.type === 'event_notification') {
            console.log('🎉🎉🎉 通知受信成功！ 🎉🎉🎉\n');
            console.log('━'.repeat(50));
            console.log('📬 通知内容:');
            console.log('   タイトル:', message.notification.title);
            console.log('   メッセージ:', message.notification.message);
            console.log('   イベントID:', message.notification.eventId);
            console.log('   イベント名:', message.notification.eventTitle);
            console.log('   日時:', message.notification.eventDate);
            console.log('━'.repeat(50));
            console.log('\n✅ 通知システムは正常に動作しています！\n');
            
            setTimeout(() => {
                ws.close();
                process.exit(0);
            }, 1000);
        }
    } catch (error) {
        console.log('⚠️  メッセージ解析エラー:', error.message);
    }
});

ws.on('error', (error) => {
    console.log('❌ WebSocketエラー:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n🔌 WebSocket切断');
});
