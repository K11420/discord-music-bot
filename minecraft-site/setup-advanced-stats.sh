#!/bin/bash
# Advanced Statistics Tracking System Setup for Minecraft Bedrock Server
# 高度な統計追跡システムのセットアップスクリプト

set -e

echo "🚀 Minecraft Bedrock 高度な統計追跡システム セットアップ"
echo "============================================================"

# サーバーディレクトリ
SERVER_DIR="$HOME/tama/bedrock-server-1.21.114.1"
WORLD_NAME="Bedrock level"
WORLD_DIR="$SERVER_DIR/worlds/$WORLD_NAME"
WEBAPP_DIR="/home/kbt0/webapp/minecraft-site"

echo ""
echo "📍 ディレクトリ確認:"
echo "   サーバー: $SERVER_DIR"
echo "   ワールド: $WORLD_DIR"
echo "   Webapp: $WEBAPP_DIR"

# ステップ1: スコアボードの作成
echo ""
echo "📊 ステップ1: スコアボードの作成"
echo "   以下のコマンドをMinecraftサーバーコンソールで実行する必要があります:"
echo ""
echo "   scoreboard objectives add blocks_placed dummy \"ブロック設置\""
echo "   scoreboard objectives add blocks_broken dummy \"ブロック破壊\""
echo "   scoreboard objectives add distance_walked minecraft.custom:minecraft.walk_one_cm \"移動距離\""
echo "   scoreboard objectives add deaths deathCount \"死亡数\""
echo "   scoreboard objectives add playtime dummy \"プレイ時間\""
echo ""

# スコアボードコマンドファイルを作成
cat > "$WEBAPP_DIR/scoreboard-setup.txt" << 'EOF'
# Minecraftサーバーコンソールで実行するコマンド
scoreboard objectives add blocks_placed dummy "ブロック設置"
scoreboard objectives add blocks_broken dummy "ブロック破壊"
scoreboard objectives add distance_walked minecraft.custom:minecraft.walk_one_cm "移動距離"
scoreboard objectives add deaths deathCount "死亡数"
scoreboard objectives add playtime dummy "プレイ時間"
scoreboard objectives setdisplay sidebar playtime
EOF

echo "✅ スコアボードコマンドを保存: $WEBAPP_DIR/scoreboard-setup.txt"

# ステップ2: 統計収集スクリプトの作成
echo ""
echo "📝 ステップ2: 統計収集スクリプトの作成"

cat > "$WEBAPP_DIR/collect-scoreboard-stats.js" << 'EOFSCRIPT'
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
EOFSCRIPT

chmod +x "$WEBAPP_DIR/collect-scoreboard-stats.js"

echo "✅ スコアボード統計コレクター作成完了"

# ステップ3: ログパーサーの高度化
echo ""
echo "📝 ステップ3: 高度なログパーサーの作成"

cat > "$WEBAPP_DIR/advanced-log-parser.js" << 'EOFPARSER'
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
EOFPARSER

chmod +x "$WEBAPP_DIR/advanced-log-parser.js"

echo "✅ 高度なログパーサー作成完了"

# ステップ4: ドキュメント作成
echo ""
echo "📝 ステップ4: セットアップドキュメント作成"

cat > "$WEBAPP_DIR/ADVANCED-STATS-SETUP.md" << 'EOFDOC'
# 高度な統計追跡システム セットアップガイド

## 🎯 システム構成

### 1. スコアボードベースの統計追跡
- Minecraftのスコアボード機能を活用
- ブロック設置/破壊を手動または自動で追跡
- リアルタイムでデータベースに同期

### 2. ログベースの詳細分析
- サーバーログから追加情報を抽出
- チャットメッセージ、アイテム取得などを記録
- イベント履歴の保存

### 3. データベース統合
- 既存のplayer_statsテーブルと統合
- リアルタイム更新
- ウェブサイトで即座に表示

## 📋 セットアップ手順

### ステップ1: スコアボードの初期化

Minecraftサーバーコンソールで以下を実行:

```
scoreboard objectives add blocks_placed dummy "ブロック設置"
scoreboard objectives add blocks_broken dummy "ブロック破壊"
scoreboard objectives add distance_walked minecraft.custom:minecraft.walk_one_cm "移動距離"
scoreboard objectives add deaths deathCount "死亡数"
```

### ステップ2: 統計コレクターの起動

```bash
cd /home/kbt0/webapp/minecraft-site
nohup node collect-scoreboard-stats.js > scoreboard-collector.log 2>&1 &
```

### ステップ3: 動作確認

```bash
# ログを確認
tail -f /home/kbt0/webapp/minecraft-site/scoreboard-collector.log

# データベースを確認
node -e "
const Database = require('./database.js');
const db = new Database();
setTimeout(async () => {
    const rankings = await db.getPlayerRankings('total_playtime', 10);
    console.log(rankings);
    process.exit(0);
}, 1000);
"
```

## 🔧 運用方法

### 手動でブロック統計を更新

プレイヤーがブロックを設置/破壊した時:

```
# サーバーコンソールで
scoreboard players add <プレイヤー名> blocks_placed 1
scoreboard players add <プレイヤー名> blocks_broken 1
```

### 自動化（コマンドブロック使用）

1. ゲーム内でコマンドブロックを設置
2. 繰り返し実行設定
3. コマンドを設定:
   ```
   execute as @a run scoreboard players add @s playtime 1
   ```

### 統計のリセット

```
scoreboard players reset <プレイヤー名> blocks_placed
```

## 📊 ウェブサイトでの表示

統計は自動的にウェブサイトのランキングページに反映されます:

- プレイ時間
- ブロック設置数
- ブロック破壊数
- 移動距離
- 死亡数

## 🚀 高度な機能

### 1. リアルタイム同期

5分ごとにスコアボードとデータベースを自動同期

### 2. 履歴追跡

プレイヤーの統計履歴をグラフ表示（将来実装）

### 3. ランキング競争

複数のカテゴリーでランキング表示

## ⚠️ 注意事項

- スコアボードコマンドはサーバー管理者のみ実行可能
- 統計は手動更新が必要な部分がある
- サーバー再起動時もスコアボードは保持される

## 🔮 今後の拡張

1. コマンドブロックを使った完全自動化
2. Behavior Packによるイベント駆動型追跡
3. AI分析によるプレイパターン検出
4. リアルタイムダッシュボード

EOFDOC

echo "✅ セットアップドキュメント作成完了"

# まとめ
echo ""
echo "============================================================"
echo "✅ セットアップ完了！"
echo ""
echo "📝 次のステップ:"
echo ""
echo "1. Minecraftサーバーコンソールでスコアボードを作成:"
echo "   cat $WEBAPP_DIR/scoreboard-setup.txt"
echo ""
echo "2. 統計コレクターを起動:"
echo "   cd $WEBAPP_DIR"
echo "   nohup node collect-scoreboard-stats.js > scoreboard-collector.log 2>&1 &"
echo ""
echo "3. ログパーサーをテスト:"
echo "   node $WEBAPP_DIR/advanced-log-parser.js"
echo ""
echo "4. 詳細は以下を参照:"
echo "   cat $WEBAPP_DIR/ADVANCED-STATS-SETUP.md"
echo ""
echo "============================================================"
