#!/bin/bash
# Behavior Pack Creator for Block Statistics Tracking
# ブロック統計追跡用のBehavior Pack作成スクリプト

set -e

echo "🎮 Minecraft Bedrock Behavior Pack 作成ツール"
echo "============================================="

SERVER_DIR="$HOME/tama/bedrock-server-1.21.114.1"
BEHAVIOR_PACKS_DIR="$SERVER_DIR/behavior_packs"
PACK_NAME="stats_tracker"
PACK_DIR="$BEHAVIOR_PACKS_DIR/$PACK_NAME"

echo ""
echo "📍 ディレクトリ: $PACK_DIR"

# Behavior Packディレクトリを作成
mkdir -p "$PACK_DIR/scripts"
mkdir -p "$PACK_DIR/texts"

echo "📝 Behavior Pack構造を作成中..."

# manifest.jsonを作成
cat > "$PACK_DIR/manifest.json" << 'EOF'
{
    "format_version": 2,
    "header": {
        "name": "Stats Tracker",
        "description": "プレイヤー統計を追跡するBehavior Pack",
        "uuid": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "version": [1, 0, 0],
        "min_engine_version": [1, 20, 0]
    },
    "modules": [
        {
            "type": "data",
            "uuid": "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
            "version": [1, 0, 0]
        },
        {
            "type": "script",
            "language": "javascript",
            "uuid": "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
            "version": [1, 0, 0],
            "entry": "scripts/main.js"
        }
    ],
    "dependencies": [
        {
            "module_name": "@minecraft/server",
            "version": "1.7.0"
        }
    ]
}
EOF

# pack_icon.pngを作成（簡易版）
echo "🎨 アイコンファイルをコピー中..."
# シンプルな代替としてテキストファイルを作成
cat > "$PACK_DIR/pack_icon.txt" << 'EOF'
Note: Replace this file with an actual 256x256 PNG image named pack_icon.png
EOF

# メインスクリプトを作成
cat > "$PACK_DIR/scripts/main.js" << 'EOFSCRIPT'
import { world, system } from "@minecraft/server";

// 統計カウンター
const playerStats = new Map();

// プレイヤーの統計を初期化
function initPlayerStats(playerName) {
    if (!playerStats.has(playerName)) {
        playerStats.set(playerName, {
            blocksPlaced: 0,
            blocksBroken: 0,
            distanceTraveled: 0,
            deaths: 0,
            lastPosition: null
        });
    }
    return playerStats.get(playerName);
}

// ブロック設置イベント
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const stats = initPlayerStats(player.name);
    
    stats.blocksPlaced++;
    
    // スコアボードを更新
    try {
        player.runCommand(`scoreboard players add "${player.name}" blocks_placed 1`);
    } catch (error) {
        console.warn(`スコアボード更新エラー: ${error}`);
    }
    
    // ログ出力
    console.log(`[StatsTracker] ${player.name} placed block (total: ${stats.blocksPlaced})`);
});

// ブロック破壊イベント
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const stats = initPlayerStats(player.name);
    
    stats.blocksBroken++;
    
    // スコアボードを更新
    try {
        player.runCommand(`scoreboard players add "${player.name}" blocks_broken 1`);
    } catch (error) {
        console.warn(`スコアボード更新エラー: ${error}`);
    }
    
    // ログ出力
    console.log(`[StatsTracker] ${player.name} broke block (total: ${stats.blocksBroken})`);
});

// プレイヤー死亡イベント
world.afterEvents.entityDie.subscribe((event) => {
    if (event.deadEntity.typeId === "minecraft:player") {
        const player = event.deadEntity;
        const stats = initPlayerStats(player.name);
        
        stats.deaths++;
        
        console.log(`[StatsTracker] ${player.name} died (total: ${stats.deaths})`);
    }
});

// 定期的な統計保存（5分ごと）
system.runInterval(() => {
    for (const [playerName, stats] of playerStats) {
        console.log(`[StatsTracker] ${playerName} stats:`);
        console.log(`  Blocks Placed: ${stats.blocksPlaced}`);
        console.log(`  Blocks Broken: ${stats.blocksBroken}`);
        console.log(`  Deaths: ${stats.deaths}`);
    }
}, 20 * 60 * 5); // 5分 = 300秒 = 6000 ticks

// 初期化メッセージ
console.log("[StatsTracker] Behavior Pack loaded successfully!");
world.sendMessage("§a[StatsTracker] 統計追跡システム起動");
EOFSCRIPT

# languages/ja_JP.langを作成
mkdir -p "$PACK_DIR/texts"
cat > "$PACK_DIR/texts/ja_JP.lang" << 'EOF'
pack.name=Stats Tracker
pack.description=プレイヤー統計を追跡するBehavior Pack
EOF

# en_US.langを作成
cat > "$PACK_DIR/texts/en_US.lang" << 'EOF'
pack.name=Stats Tracker
pack.description=Player Statistics Tracking Behavior Pack
EOF

# READMEを作成
cat > "$PACK_DIR/README.md" << 'EOFREADME'
# Stats Tracker Behavior Pack

## 機能

このBehavior Packは以下の統計を自動的に追跡します:

- ブロック設置数
- ブロック破壊数
- プレイヤー死亡数
- 移動距離（将来実装）

## インストール方法

### 1. サーバーへの適用

Behavior Packは既に正しいディレクトリに配置されています:
```
~/tama/bedrock-server-1.21.114.1/behavior_packs/stats_tracker/
```

### 2. ワールドに適用

`world_behavior_packs.json`を編集:

```json
[
    {
        "pack_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "version": [1, 0, 0]
    }
]
```

### 3. サーバー再起動

```bash
screen -S tama -X stuff "stop\n"
# 数秒待機
screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\n"
```

## 使用方法

Behavior Packが有効になると、自動的に:

1. プレイヤーがブロックを設置/破壊すると統計が更新される
2. スコアボードに自動反映される
3. サーバーログに統計情報が出力される

## 確認方法

サーバーコンソールで:
```
scoreboard objectives list
scoreboard players list <プレイヤー名>
```

## トラブルシューティング

### Behavior Packが読み込まれない場合

1. manifest.jsonの構文エラーをチェック
2. UUIDが重複していないか確認
3. サーバーログでエラーメッセージを確認

### スコアボードが更新されない場合

1. スコアボードが作成されているか確認:
   ```
   scoreboard objectives add blocks_placed dummy "ブロック設置"
   ```

2. Behavior Packが有効になっているか確認:
   ```
   サーバーログで "[StatsTracker] Behavior Pack loaded" を探す
   ```

## 注意事項

- サーバー再起動が必要
- Beta APIs を使用しているため、実験的機能を有効にする必要がある場合あり
- クライアント側でもBehavior Packを有効にする必要はない（サーバー側のみ）

## 更新履歴

- v1.0.0: 初版リリース
  - ブロック設置/破壊の追跡
  - 死亡数の追跡
  - スコアボード連携

EOFREADME

echo "✅ Behavior Pack作成完了!"
echo ""
echo "📦 作成されたファイル:"
echo "   - manifest.json (パッケージ定義)"
echo "   - scripts/main.js (統計追跡スクリプト)"
echo "   - texts/ja_JP.lang (日本語言語ファイル)"
echo "   - texts/en_US.lang (英語言語ファイル)"
echo "   - README.md (ドキュメント)"
echo ""
echo "📝 次のステップ:"
echo ""
echo "1. ワールドにBehavior Packを適用:"
echo "   cd \"$SERVER_DIR/worlds/Bedrock level\""
echo "   nano world_behavior_packs.json"
echo ""
echo "   以下を追加:"
echo '   ['
echo '       {'
echo '           "pack_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",'
echo '           "version": [1, 0, 0]'
echo '       }'
echo '   ]'
echo ""
echo "2. サーバーを再起動:"
echo "   screen -S tama -X stuff \"stop\\n\""
echo "   sleep 5"
echo "   screen -S tama -X stuff \"cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\\n\""
echo ""
echo "3. サーバーログで確認:"
echo "   screen -S tama -X hardcopy /tmp/screen-tama.log"
echo "   grep StatsTracker /tmp/screen-tama.log"
echo ""
echo "詳細は $PACK_DIR/README.md を参照してください"
echo ""
echo "============================================="
