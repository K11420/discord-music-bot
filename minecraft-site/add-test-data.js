const Database = require('./database.js');
const db = new Database();

async function addTestData() {
    try {
        // Add test events
        console.log('📅 Adding test events...');
        await db.createEvent({
            title: '建築コンテスト',
            description: '最高の建築物を作ろう！優勝者には豪華賞品',
            event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'event'
        });
        
        await db.createEvent({
            title: 'サーバーメンテナンス',
            description: '定期メンテナンスを実施します',
            event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'maintenance'
        });
        
        await db.createEvent({
            title: 'v1.5アップデート',
            description: '新しい機能とバグ修正',
            event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'update'
        });
        
        console.log('✅ Test events added');
        
        // Add test player stats
        console.log('🏆 Adding test player stats...');
        const players = [
            { name: 'Steve', playtime: 360000, blocks_placed: 15000, blocks_broken: 12000, distance: 500000 },
            { name: 'Alex', playtime: 280000, blocks_placed: 12000, blocks_broken: 10000, distance: 420000 },
            { name: 'Creeper', playtime: 200000, blocks_placed: 8000, blocks_broken: 15000, distance: 350000 },
            { name: 'Enderman', playtime: 150000, blocks_placed: 5000, blocks_broken: 7000, distance: 280000 },
            { name: 'Zombie', playtime: 120000, blocks_placed: 3000, blocks_broken: 5000, distance: 200000 }
        ];
        
        for (const player of players) {
            await db.updatePlayerStats(player.name, {
                total_playtime: player.playtime,
                blocks_placed: player.blocks_placed,
                blocks_broken: player.blocks_broken,
                distance_traveled: player.distance
            });
        }
        
        console.log('✅ Test player stats added');
        
        // Verify data
        const events = await db.getEvents(10);
        const rankings = await db.getPlayerRankings('total_playtime', 10);
        
        console.log('\n📊 Verification:');
        console.log(`Events: ${events.length}`);
        console.log(`Players: ${rankings.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addTestData();
