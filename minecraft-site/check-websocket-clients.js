#!/usr/bin/env node

/**
 * WebSocket接続クライアント数を確認
 */

const WebSocket = require('ws');

console.log('🔍 WebSocketクライアント接続状況を確認中...\n');

const ws = new WebSocket('wss://minecraft.schale41.jp');

ws.on('open', () => {
    console.log('✅ WebSocket接続成功\n');
    console.log('📊 このスクリプトは1つのクライアントとして接続しています');
    console.log('📢 実際のユーザーが接続している場合、サーバーログに記録されます\n');
    
    // 10秒待機してメッセージを受信
    console.log('⏳ 10秒間メッセージを待機します...\n');
    
    setTimeout(() => {
        console.log('\n📝 受信したメッセージ数を確認してください');
        console.log('💡 ヒント: 通常、接続後すぐにstatus_updateメッセージが届きます\n');
        ws.close();
        process.exit(0);
    }, 10000);
});

let messageCount = 0;

ws.on('message', (data) => {
    messageCount++;
    try {
        const message = JSON.parse(data);
        console.log(`📨 メッセージ ${messageCount}:`, message.type);
        
        if (message.type === 'status_update') {
            console.log('   サーバー状態:', message.status);
            console.log('   プレイヤー数:', message.players?.length || 0);
        } else if (message.type === 'event_notification') {
            console.log('   🎉 通知を受信！');
            console.log('   タイトル:', message.notification?.title);
            console.log('   メッセージ:', message.notification?.message);
        }
        console.log('');
    } catch (error) {
        console.log('   ⚠️  JSON解析エラー');
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocketエラー:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n🔌 WebSocket接続が閉じられました');
    console.log(`📊 合計受信メッセージ数: ${messageCount}\n`);
});
