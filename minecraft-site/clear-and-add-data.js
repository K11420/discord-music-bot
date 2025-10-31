const Database = require('./database.js');
const db = new Database();

async function clearAndAddData() {
    try {
        console.log('🗑️  Clearing old player stats...');
        await new Promise((resolve, reject) => {
            db.db.run('DELETE FROM player_stats', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('🏆 Adding corrected player stats...');
        const players = [
            { name: 'Steve', playtime: 360000, blocks_placed: 15000, blocks_broken: 12000, distance: 500000 },
            { name: 'Alex', playtime: 280000, blocks_placed: 12000, blocks_broken: 10000, distance: 420000 },
            { name: 'Creeper', playtime: 200000, blocks_placed: 8000, blocks_broken: 15000, distance: 350000 },
            { name: 'Enderman', playtime: 150000, blocks_placed: 5000, blocks_broken: 7000, distance: 280000 },
            { name: 'Zombie', playtime: 120000, blocks_placed: 3000, blocks_broken: 5000, distance: 200000 }
        ];
        
        for (const player of players) {
            await db.updatePlayerStats(player.name, {
                playtime: player.playtime,
                blocks_placed: player.blocks_placed,
                blocks_broken: player.blocks_broken,
                distance_traveled: player.distance
            });
            console.log(`✅ Added ${player.name} with ${player.playtime}ms playtime`);
        }
        
        // Verify data
        const rankings = await db.getPlayerRankings('total_playtime', 10);
        
        console.log('\n📊 Verification:');
        console.log('Player Rankings:');
        rankings.forEach((player, index) => {
            console.log(`${index + 1}. ${player.player_name}: ${player.total_playtime}ms (${Math.floor(player.total_playtime/60000)} minutes)`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

clearAndAddData();
