#!/usr/bin/env node

/**
 * リアルタイム通知モニター
 * イベントが作成されたら即座に通知を表示
 */

const WebSocket = require('ws');

console.log('🎯 リアルタイム通知モニターを開始\n');
console.log('=' .repeat(60));
console.log('このスクリプトは通知を待機しています');
console.log('別のターミナルでイベントを作成してください:');
console.log('  node test-ios-notification.js');
console.log('=' .repeat(60));
console.log('');

const ws = new WebSocket('wss://minecraft.schale41.jp');

ws.on('open', () => {
    console.log('✅ WebSocket接続成功');
    console.log('📡 通知を待機中...\n');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        if (message.type === 'event_notification') {
            console.log('\n' + '🎉'.repeat(30));
            console.log('🎉🎉🎉 通知を受信しました！ 🎉🎉🎉');
            console.log('🎉'.repeat(30) + '\n');
            
            console.log('📬 通知内容:');
            console.log('━'.repeat(60));
            console.log(`   タイトル: ${message.notification?.title || 'なし'}`);
            console.log(`   メッセージ: ${message.notification?.message || 'なし'}`);
            console.log(`   イベントID: ${message.notification?.eventId || 'なし'}`);
            console.log(`   イベント名: ${message.notification?.eventTitle || 'なし'}`);
            console.log(`   イベント日時: ${message.notification?.eventDate || 'なし'}`);
            console.log('━'.repeat(60) + '\n');
            
            console.log('✅ この通知は、ブラウザで https://minecraft.schale41.jp');
            console.log('   を開いているユーザー全員に配信されます！\n');
            
        } else if (message.type === 'status_update') {
            const now = new Date().toLocaleTimeString('ja-JP');
            process.stdout.write(`\r⏰ ${now} - サーバー状態更新受信中...`);
        }
    } catch (error) {
        console.log('\n⚠️  メッセージ解析エラー:', error.message);
    }
});

ws.on('error', (error) => {
    console.error('\n❌ WebSocketエラー:', error.message);
    console.log('\n💡 トラブルシューティング:');
    console.log('   1. サーバーが起動しているか確認: ps aux | grep server-enhanced');
    console.log('   2. HTTPS接続が可能か確認: curl https://minecraft.schale41.jp');
    console.log('');
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n\n🔌 WebSocket接続が閉じられました');
    process.exit(0);
});

// Ctrl+C で終了
process.on('SIGINT', () => {
    console.log('\n\n👋 モニターを終了します...');
    ws.close();
    process.exit(0);
});

console.log('💡 終了するには Ctrl+C を押してください\n');
