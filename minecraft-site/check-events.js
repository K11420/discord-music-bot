#!/usr/bin/env node

/**
 * データベースから最新のイベントを確認
 */

const Database = require('./database');
const db = new Database();

console.log('📋 最新のイベントを確認中...\n');

db.getEvents(50)
    .then(events => {
        if (events.length === 0) {
            console.log('⚠️  イベントが見つかりません');
            process.exit(0);
        }
        
        console.log(`✅ ${events.length}件のイベントが見つかりました\n`);
        console.log('=' .repeat(60));
        
        // 最新5件を表示
        events.slice(0, 5).forEach((event, index) => {
            console.log(`\n${index + 1}. イベントID: ${event.id}`);
            console.log(`   タイトル: ${event.title}`);
            console.log(`   日付: ${event.event_date}`);
            console.log(`   作成日時: ${event.created_at}`);
            console.log(`   タイプ: ${event.event_type || 'event'}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        // 今日作成されたイベントを確認
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter(e => e.created_at && e.created_at.startsWith(today));
        
        if (todayEvents.length > 0) {
            console.log(`\n🎯 今日作成されたイベント: ${todayEvents.length}件`);
            todayEvents.forEach(event => {
                console.log(`   - ${event.title} (ID: ${event.id})`);
            });
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    });
