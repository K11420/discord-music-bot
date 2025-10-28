#!/usr/bin/env node
/**
 * Advanced Log Parser for Minecraft Bedrock Server
 * ログファイルから詳細な統計情報を抽出
 */

const { exec } = require('child_process');
const Database = require('./database.js');
const db = new Database();

// イベントパターン
const PATTERNS = {
    // プレイヤーイベント
    playerConnect: /Player connected: (.+?), xuid: (.+?)$/,
    playerDisconnect: /Player disconnected: (.+?), xuid: (.+?)$/,
    playerSpawned: /Player Spawned: (.+?) xuid: (.+?)$/,
    
    // アイテム/ブロックイベント（可能な場合）
    // Bedrock版では限定的
    itemPickup: /(.+?) picked up (.+?)$/,
    
    // チャットイベント
    chat: /<(.+?)> (.+)$/,
    
    // サーバーイベント
    serverStart: /Server started/,
    serverStop: /Server stop/,
};

/**
 * ログファイルから全イベントを抽出
 */
function parseServerLogs(lines = 1000) {
    return new Promise((resolve, reject) => {
        exec(`screen -S tama -X hardcopy /tmp/screen-tama.log && cat /tmp/screen-tama.log | tail -${lines}`, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }
            
            const events = [];
            const logLines = stdout.split('\n');
            
            for (const line of logLines) {
                // タイムスタンプを抽出
                const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
                if (!timestampMatch) continue;
                
                const timestamp = new Date(timestampMatch[1]);
                
                // 各イベントパターンをチェック
                for (const [eventType, pattern] of Object.entries(PATTERNS)) {
                    const match = line.match(pattern);
                    if (match) {
                        events.push({
                            type: eventType,
                            timestamp: timestamp,
                            data: match.slice(1),
                            rawLine: line
                        });
                        break;
                    }
                }
            }
            
            resolve(events);
        });
    });
}

/**
 * イベントから統計を計算
 */
function calculateStatistics(events) {
    const stats = new Map();
    
    for (const event of events) {
        if (event.type === 'chat') {
            const playerName = event.data[0];
            if (!stats.has(playerName)) {
                stats.set(playerName, { chatMessages: 0 });
            }
            stats.get(playerName).chatMessages++;
        }
    }
    
    return stats;
}

/**
 * メイン処理
 */
async function main() {
    try {
        console.log('🚀 高度なログパーサー起動\n');
        
        console.log('📖 ログを解析中...');
        const events = await parseServerLogs(2000);
        console.log(`   検出されたイベント: ${events.length}個`);
        
        // イベントタイプ別の集計
        const eventCounts = {};
        for (const event of events) {
            eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        }
        
        console.log('\n📊 イベント別集計:');
        for (const [type, count] of Object.entries(eventCounts)) {
            console.log(`   ${type}: ${count}回`);
        }
        
        // 統計を計算
        const stats = calculateStatistics(events);
        
        if (stats.size > 0) {
            console.log('\n💬 チャット統計:');
            for (const [player, data] of stats) {
                console.log(`   ${player}: ${data.chatMessages}メッセージ`);
            }
        }
        
    } catch (error) {
        console.error('❌ エラー:', error);
    }
}

setTimeout(main, 1000);
