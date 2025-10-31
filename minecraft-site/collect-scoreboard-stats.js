#!/usr/bin/env node
/**
 * Scoreboard Statistics Collector
 * スコアボードから統計情報を収集してデータベースに保存
 */

const { exec } = require('child_process');
const Database = require('./database.js');
const db = new Database();

/**
 * スコアボードからプレイヤーの統計を取得
 */
function getScoreboardStats(playerName, objective) {
    return new Promise((resolve, reject) => {
        const command = `screen -S tama -X stuff "scoreboard players list ${playerName}\\n"`;
        
        exec(command, (error) => {
            if (error) {
                resolve(null);
                return;
            }
            
            // コマンド実行後、ログを確認
            setTimeout(() => {
                exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -50', (error, stdout) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    
                    // スコアボード出力をパース
                    const lines = stdout.split('\n');
                    const stats = {};
                    
                    for (const line of lines) {
                        // 例: "- blocks_placed: 150"
                        const match = line.match(/- (\w+): (\d+)/);
                        if (match) {
                            stats[match[1]] = parseInt(match[2]);
                        }
                    }
                    
                    resolve(stats);
                });
            }, 1000);
        });
    });
}

/**
 * 全プレイヤーの統計を更新
 */
async function updateAllPlayerStats() {
    try {
        console.log('🔄 スコアボード統計を収集中...');
        
        // データベースから既存のプレイヤーリストを取得
        const players = await new Promise((resolve, reject) => {
            db.db.all('SELECT DISTINCT player_name FROM player_stats', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📋 ${players.length}人のプレイヤーを確認`);
        
        for (const player of players) {
            const stats = await getScoreboardStats(player.player_name);
            
            if (stats && Object.keys(stats).length > 0) {
                console.log(`\n✅ ${player.player_name}の統計を更新:`);
                
                // データベースを直接更新
                await new Promise((resolve, reject) => {
                    const sql = `UPDATE player_stats SET 
                        blocks_placed = ?,
                        blocks_broken = ?,
                        distance_traveled = ?,
                        deaths = ?
                        WHERE player_name = ?`;
                    
                    db.db.run(sql, [
                        stats.blocks_placed || 0,
                        stats.blocks_broken || 0,
                        stats.distance_walked || 0,
                        stats.deaths || 0,
                        player.player_name
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                console.log(`   🧱 ブロック設置: ${stats.blocks_placed || 0}`);
                console.log(`   ⛏️  ブロック破壊: ${stats.blocks_broken || 0}`);
                console.log(`   🚶 移動距離: ${stats.distance_walked || 0}cm`);
                console.log(`   💀 死亡数: ${stats.deaths || 0}`);
            }
        }
        
        console.log('\n✅ 統計更新完了');
        
    } catch (error) {
        console.error('❌ エラー:', error);
    }
}

/**
 * メイン処理
 */
async function main() {
    console.log('🚀 スコアボード統計コレクター起動\n');
    
    // 初回実行
    await updateAllPlayerStats();
    
    // 5分ごとに実行
    setInterval(updateAllPlayerStats, 5 * 60 * 1000);
}

setTimeout(() => {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}, 1000);
