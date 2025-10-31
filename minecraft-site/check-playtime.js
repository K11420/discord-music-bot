#!/usr/bin/env node

const Database = require('./database');
const db = new Database();

console.log('📊 プレイ時間データを確認中...\n');

setTimeout(async () => {
    try {
        const rankings = await db.getPlayerRankings('total_playtime', 20);
        
        console.log('='.repeat(70));
        console.log('プレイヤーランキング（total_playtime順）');
        console.log('='.repeat(70));
        
        if (rankings.length === 0) {
            console.log('⚠️  データが見つかりません');
        } else {
            rankings.forEach((player, index) => {
                const playtimeMs = player.total_playtime || 0;
                const hours = Math.floor(playtimeMs / 3600000);
                const minutes = Math.floor((playtimeMs % 3600000) / 60000);
                const seconds = Math.floor((playtimeMs % 60000) / 1000);
                
                console.log(`\n${index + 1}. ${player.player_name}`);
                console.log(`   total_playtime: ${playtimeMs} ミリ秒`);
                console.log(`   表示: ${hours}時間 ${minutes}分 ${seconds}秒`);
                console.log(`   ブロック設置: ${player.blocks_placed || 0}`);
                console.log(`   ブロック破壊: ${player.blocks_broken || 0}`);
                console.log(`   移動距離: ${player.distance_traveled || 0}`);
            });
        }
        
        console.log('\n' + '='.repeat(70));
        console.log(`合計: ${rankings.length} 人のプレイヤー`);
        console.log('='.repeat(70));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ エラー:', error);
        process.exit(1);
    }
}, 1000);
