#!/usr/bin/env node
/**
 * Historical Player Data Import Script
 * 過去のMinecraftサーバーログからプレイヤーセッションを解析してデータベースに追加
 */

const { exec } = require('child_process');
const Database = require('./database.js');
const db = new Database();

/**
 * サーバーログから全てのプレイヤーイベントを抽出
 */
function parseAllServerLogs() {
    return new Promise((resolve, reject) => {
        // ログファイル全体を取得（最大1000行）
        exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -1000', (error, stdout) => {
            if (error) {
                console.error('❌ Failed to read server logs:', error);
                reject(error);
                return;
            }
            
            const events = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                // タイムスタンプを抽出
                const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
                if (!timestampMatch) continue;
                
                const timestamp = new Date(timestampMatch[1]);
                
                // プレイヤー接続イベント
                const connectMatch = line.match(/Player connected: (.+?), xuid: (.+?)$/);
                if (connectMatch) {
                    events.push({
                        type: 'connect',
                        playerName: connectMatch[1].trim(),
                        xuid: connectMatch[2].trim(),
                        timestamp: timestamp
                    });
                }
                
                // プレイヤー切断イベント
                const disconnectMatch = line.match(/Player disconnected: (.+?), xuid: (.+?)$/);
                if (disconnectMatch) {
                    events.push({
                        type: 'disconnect',
                        playerName: disconnectMatch[1].trim(),
                        xuid: disconnectMatch[2].trim(),
                        timestamp: timestamp
                    });
                }
            }
            
            resolve(events);
        });
    });
}

/**
 * イベントリストからセッションを構築
 */
function buildSessions(events) {
    const sessions = [];
    const activeConnections = new Map();
    
    for (const event of events) {
        if (event.type === 'connect') {
            // 接続イベント
            activeConnections.set(event.playerName, event.timestamp);
        } else if (event.type === 'disconnect') {
            // 切断イベント
            if (activeConnections.has(event.playerName)) {
                const connectTime = activeConnections.get(event.playerName);
                const disconnectTime = event.timestamp;
                const playtime = disconnectTime.getTime() - connectTime.getTime();
                
                sessions.push({
                    playerName: event.playerName,
                    connectTime: connectTime,
                    disconnectTime: disconnectTime,
                    playtime: playtime
                });
                
                activeConnections.delete(event.playerName);
            }
        }
    }
    
    return sessions;
}

/**
 * セッションデータをデータベースに追加
 */
async function importSessions(sessions) {
    console.log(`\n📥 Importing ${sessions.length} historical sessions...`);
    
    for (const session of sessions) {
        try {
            // プレイヤー統計を更新
            await db.updatePlayerStats(session.playerName, {
                playtime: session.playtime,
                blocks_placed: 0,
                blocks_broken: 0,
                distance_traveled: 0
            });
            
            const minutes = Math.floor(session.playtime / 60000);
            const seconds = Math.floor((session.playtime % 60000) / 1000);
            const dateStr = session.connectTime.toLocaleString('ja-JP');
            
            console.log(`✅ ${session.playerName}: ${minutes}m ${seconds}s (${dateStr})`);
        } catch (error) {
            console.error(`❌ Failed to import session for ${session.playerName}:`, error);
        }
    }
}

/**
 * メイン処理
 */
async function main() {
    try {
        console.log('🚀 Historical Player Data Import Started\n');
        
        // ログから全イベントを抽出
        console.log('📖 Parsing server logs...');
        const events = await parseAllServerLogs();
        console.log(`   Found ${events.length} player events`);
        
        // セッションを構築
        console.log('\n🔨 Building sessions...');
        const sessions = buildSessions(events);
        console.log(`   Built ${sessions.length} complete sessions`);
        
        if (sessions.length === 0) {
            console.log('\n⚠️  No complete sessions found');
            console.log('   (Players who are currently online will be recorded when they disconnect)');
            process.exit(0);
        }
        
        // セッションごとの詳細表示
        console.log('\n📋 Session Summary:');
        const playerSummary = new Map();
        
        for (const session of sessions) {
            if (!playerSummary.has(session.playerName)) {
                playerSummary.set(session.playerName, {
                    count: 0,
                    totalTime: 0
                });
            }
            
            const summary = playerSummary.get(session.playerName);
            summary.count++;
            summary.totalTime += session.playtime;
        }
        
        for (const [playerName, summary] of playerSummary) {
            const totalMinutes = Math.floor(summary.totalTime / 60000);
            const totalSeconds = Math.floor((summary.totalTime % 60000) / 1000);
            console.log(`   ${playerName}: ${summary.count} sessions, ${totalMinutes}m ${totalSeconds}s total`);
        }
        
        // データベースに追加
        await importSessions(sessions);
        
        // 最終的なランキングを表示
        console.log('\n📊 Final Rankings:');
        const rankings = await db.getPlayerRankings('total_playtime', 10);
        
        if (rankings.length > 0) {
            rankings.forEach((player, index) => {
                const minutes = Math.floor(player.total_playtime / 60000);
                const seconds = Math.floor((player.total_playtime % 60000) / 1000);
                console.log(`   ${index + 1}. ${player.player_name}: ${minutes}m ${seconds}s`);
            });
        }
        
        console.log('\n✅ Import completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// スクリプト実行
setTimeout(() => {
    main();
}, 1000);
