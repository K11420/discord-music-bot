#!/usr/bin/env node
/**
 * Real Player Data Collection Script
 * 実際のMinecraftサーバーログからプレイヤーデータを収集してデータベースに保存
 */

const { exec } = require('child_process');
const Database = require('./database.js');
const db = new Database();

// プレイヤーセッションを追跡
const activeSessions = new Map();

/**
 * ログファイルからプレイヤーイベントを抽出
 */
function parseServerLogs() {
    return new Promise((resolve, reject) => {
        exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -500', (error, stdout) => {
            if (error) {
                console.error('❌ Failed to read server logs:', error);
                reject(error);
                return;
            }
            
            const events = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                // プレイヤー接続イベント
                const connectMatch = line.match(/Player connected: (.+?), xuid: (.+?)$/);
                if (connectMatch) {
                    events.push({
                        type: 'connect',
                        playerName: connectMatch[1].trim(),
                        xuid: connectMatch[2].trim(),
                        timestamp: new Date()
                    });
                }
                
                // プレイヤー切断イベント
                const disconnectMatch = line.match(/Player disconnected: (.+?), xuid: (.+?)$/);
                if (disconnectMatch) {
                    events.push({
                        type: 'disconnect',
                        playerName: disconnectMatch[1].trim(),
                        xuid: disconnectMatch[2].trim(),
                        timestamp: new Date()
                    });
                }
            }
            
            resolve(events);
        });
    });
}

/**
 * プレイヤーセッションを開始
 */
async function startPlayerSession(playerName) {
    if (!activeSessions.has(playerName)) {
        const startTime = Date.now();
        activeSessions.set(playerName, startTime);
        
        try {
            await db.startPlayerSession(playerName);
            console.log(`✅ Session started for ${playerName}`);
        } catch (error) {
            console.error(`❌ Failed to start session for ${playerName}:`, error);
        }
    }
}

/**
 * プレイヤーセッションを終了して統計を更新
 */
async function endPlayerSession(playerName) {
    if (activeSessions.has(playerName)) {
        const startTime = activeSessions.get(playerName);
        const endTime = Date.now();
        const playtime = endTime - startTime;
        
        activeSessions.delete(playerName);
        
        try {
            // セッションを終了
            await db.endPlayerSession(playerName);
            
            // プレイヤー統計を更新
            await db.updatePlayerStats(playerName, {
                playtime: playtime,
                blocks_placed: 0,  // 実際の値はログから取得する必要がある
                blocks_broken: 0,
                distance_traveled: 0
            });
            
            const minutes = Math.floor(playtime / 60000);
            const seconds = Math.floor((playtime % 60000) / 1000);
            console.log(`✅ Session ended for ${playerName} (${minutes}m ${seconds}s)`);
        } catch (error) {
            console.error(`❌ Failed to end session for ${playerName}:`, error);
        }
    }
}

/**
 * 現在オンラインのプレイヤーを取得
 */
function getCurrentOnlinePlayers() {
    return new Promise((resolve, reject) => {
        exec('screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -200', (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            
            const players = [];
            const playerRegex = /Player connected: (.+?),/g;
            const disconnectRegex = /Player disconnected: (.+?),/g;
            
            const connected = [];
            let match;
            while ((match = playerRegex.exec(stdout)) !== null) {
                connected.push(match[1].trim());
            }
            
            const disconnected = [];
            while ((match = disconnectRegex.exec(stdout)) !== null) {
                disconnected.push(match[1].trim());
            }
            
            // 切断していないプレイヤーのみを返す
            const online = connected.filter(p => !disconnected.includes(p));
            resolve(online);
        });
    });
}

/**
 * メイン処理 - 定期的に実行
 */
async function collectPlayerData() {
    try {
        console.log('\n🔄 Collecting player data...');
        
        // 現在オンラインのプレイヤーを取得
        const onlinePlayers = await getCurrentOnlinePlayers();
        console.log(`👥 Online players: ${onlinePlayers.length}`);
        
        if (onlinePlayers.length > 0) {
            console.log(`   Players: ${onlinePlayers.join(', ')}`);
        }
        
        // 新しいプレイヤーのセッション開始
        for (const player of onlinePlayers) {
            if (!activeSessions.has(player)) {
                await startPlayerSession(player);
            }
        }
        
        // オフラインになったプレイヤーのセッション終了
        for (const [player] of activeSessions) {
            if (!onlinePlayers.includes(player)) {
                await endPlayerSession(player);
            }
        }
        
        // 現在のランキングを表示
        const rankings = await db.getPlayerRankings('total_playtime', 10);
        
        if (rankings.length > 0) {
            console.log('\n📊 Current Rankings:');
            rankings.forEach((player, index) => {
                const minutes = Math.floor(player.total_playtime / 60000);
                const seconds = Math.floor((player.total_playtime % 60000) / 1000);
                console.log(`   ${index + 1}. ${player.player_name}: ${minutes}m ${seconds}s`);
            });
        } else {
            console.log('\n📊 No player data yet');
        }
        
    } catch (error) {
        console.error('❌ Error collecting player data:', error);
    }
}

/**
 * スクリプト起動
 */
async function main() {
    console.log('🚀 Real Player Data Collection Started');
    console.log('📊 Collecting data every 60 seconds...');
    console.log('Press Ctrl+C to stop\n');
    
    // 初回実行
    await collectPlayerData();
    
    // 60秒ごとに実行
    setInterval(collectPlayerData, 60000);
}

// スクリプト実行
setTimeout(() => {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}, 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    
    // 全てのアクティブセッションを終了
    for (const [player] of activeSessions) {
        await endPlayerSession(player);
    }
    
    console.log('✅ All sessions saved');
    process.exit(0);
});
