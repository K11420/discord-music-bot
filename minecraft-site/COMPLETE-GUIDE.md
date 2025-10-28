# 🎮 Minecraft Bedrock Server 高度な統計追跡システム - 完全ガイド

## 📋 実装完了した機能

### ✅ 1. 基本システム
- [x] プレイヤーセッション追跡（接続/切断）
- [x] プレイ時間の自動計算
- [x] リアルタイムランキング表示
- [x] 通知システム（イベント作成時）
- [x] PWA対応（Service Worker）

### ✅ 2. 高度な統計追跡システム
- [x] スコアボードベースの統計
- [x] Behavior Pack（アドオン）による自動追跡
- [x] ブロック設置/破壊の検出
- [x] プレイヤー死亡数の記録
- [x] 移動距離の計測
- [x] データベース自動同期

## 🚀 システム構成

```
┌─────────────────────────────────────────────────────────┐
│          Minecraft Bedrock Server                        │
│  ┌─────────────────┐    ┌──────────────────┐           │
│  │ Behavior Pack   │ ━━▶│ Scoreboard       │           │
│  │ (stats_tracker) │    │ - blocks_placed  │           │
│  └─────────────────┘    │ - blocks_broken  │           │
│         ↓                │ - distance       │           │
│    ブロックイベント        │ - deaths         │           │
│    自動検出              └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│          統計収集システム                                  │
│  ┌──────────────────────────────────────┐               │
│  │ collect-real-player-data.js          │               │
│  │ - プレイヤーセッション監視（60秒ごと）    │               │
│  │ - 接続/切断の検出                      │               │
│  │ - プレイ時間の自動計算                  │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  ┌──────────────────────────────────────┐               │
│  │ collect-scoreboard-stats.js          │               │
│  │ - スコアボードデータ収集（5分ごと）      │               │
│  │ - ブロック統計の同期                    │               │
│  │ - データベース自動更新                  │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│          SQLite Database                                 │
│  ┌──────────────────────────────────────┐               │
│  │ player_stats                         │               │
│  │ - player_name                        │               │
│  │ - total_playtime                     │               │
│  │ - blocks_placed                      │               │
│  │ - blocks_broken                      │               │
│  │ - distance_traveled                  │               │
│  │ - deaths                             │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│          Web Server (Express + WebSocket)                │
│  API: /api/stats/players                                 │
│  → ランキングデータを提供                                   │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│          Website (https://minecraft.schale41.jp/)        │
│  - リアルタイムランキング表示                               │
│  - プレイ時間、ブロック統計、移動距離                        │
│  - イベント通知システム                                     │
└─────────────────────────────────────────────────────────┘
```

## 📁 ファイル構成

```
/home/kbt0/webapp/minecraft-site/
├── server-enhanced.js              # Webサーバー + WebSocket
├── database.js                     # データベース管理
├── collect-real-player-data.js     # プレイヤーセッション監視
├── collect-scoreboard-stats.js     # スコアボード統計収集 ★NEW
├── advanced-log-parser.js          # 高度なログ解析 ★NEW
├── import-historical-data.js       # 過去データインポート
├── setup-advanced-stats.sh         # 自動セットアップ ★NEW
├── create-behavior-pack.sh         # Behavior Pack生成 ★NEW
├── scoreboard-setup.txt            # スコアボード初期化 ★NEW
│
├── js/
│   ├── main.js                     # 公開ページJS
│   └── enhanced.js                 # 管理ページJS（修正済み）
│
└── docs/
    ├── ADVANCED-STATS-SETUP.md     # セットアップガイド ★NEW
    ├── BLOCK-STATS-SOLUTION.md     # 統計実装方法 ★NEW
    ├── TESTING-NOTIFICATIONS.md    # 通知テストガイド
    ├── EXPLANATION.md              # システム説明
    └── COMPLETE-GUIDE.md           # このファイル ★NEW

/home/kbt0/tama/bedrock-server-1.21.114.1/
├── behavior_packs/
│   └── stats_tracker/              # 統計追跡Behavior Pack ★NEW
│       ├── manifest.json
│       ├── scripts/
│       │   └── main.js             # イベント検出スクリプト
│       ├── texts/
│       │   ├── ja_JP.lang
│       │   └── en_US.lang
│       └── README.md
│
└── worlds/
    └── Bedrock level/
        └── world_behavior_packs.json  # Behavior Pack設定 ★NEW
```

## 🔧 セットアップ手順

### ステップ1: スコアボードの初期化 ✅ 完了

スコアボードは既にサーバーに送信されました:
- blocks_placed
- blocks_broken
- distance_walked
- deaths
- playtime

### ステップ2: Behavior Packの適用 ✅ 完了

Behavior Packは作成済みで、ワールドに適用されています:
```bash
/home/kbt0/tama/bedrock-server-1.21.114.1/behavior_packs/stats_tracker/
```

### ステップ3: サーバー再起動 🔄 次のステップ

```bash
# サーバーを停止
screen -S tama -X stuff "stop\n"

# 5秒待機
sleep 5

# サーバーを再起動
screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\n"
```

### ステップ4: 統計コレクターの起動 🔄 次のステップ

```bash
cd /home/kbt0/webapp/minecraft-site

# スコアボード統計コレクターを起動
nohup node collect-scoreboard-stats.js > scoreboard-collector.log 2>&1 &

# プロセスを確認
ps aux | grep "collect-scoreboard-stats" | grep -v grep
```

## 📊 動作確認方法

### 1. Behavior Packの動作確認

サーバーログで確認:
```bash
screen -S tama -X hardcopy /tmp/screen-tama.log
grep "StatsTracker" /tmp/screen-tama.log
```

期待される出力:
```
[StatsTracker] Behavior Pack loaded successfully!
[StatsTracker] masin670310 placed block (total: 15)
[StatsTracker] masin670310 broke block (total: 23)
```

### 2. スコアボードの確認

Minecraftサーバーコンソールで:
```
scoreboard objectives list
scoreboard players list <プレイヤー名>
```

### 3. データベースの確認

```bash
cd /home/kbt0/webapp/minecraft-site
node -e "
const Database = require('./database.js');
const db = new Database();
setTimeout(async () => {
    const rankings = await db.getPlayerRankings('total_playtime', 10);
    rankings.forEach(p => {
        console.log(\`\${p.player_name}: \${p.blocks_placed}個設置, \${p.blocks_broken}個破壊\`);
    });
    process.exit(0);
}, 1000);
"
```

### 4. ウェブサイトで確認

https://minecraft.schale41.jp/ を開いて:
- ランキングページでブロック統計が表示される
- プレイヤーがブロックを設置/破壊すると数値が更新される
- ページをリロードすると最新の統計が表示される

## 🎯 統計の更新フロー

### ブロック設置の例

```
1. プレイヤーがブロックを設置
   ↓
2. Behavior Packがイベントを検出
   ↓
3. スコアボードを自動更新
   scoreboard players add "プレイヤー名" blocks_placed 1
   ↓
4. collect-scoreboard-stats.js が5分ごとにスコアボードを読取
   ↓
5. データベースを更新
   UPDATE player_stats SET blocks_placed = X WHERE player_name = "..."
   ↓
6. ウェブサイトで表示
   /api/stats/players → ランキングページ
```

## 📈 期待される統計データ

### プレイヤーランキング表示例

```
1位: masin670310
   ⏱️ プレイ時間: 1時間9分
   🧱 ブロック設置: 1,234個
   ⛏️ ブロック破壊: 2,567個
   🚶 移動距離: 45.2km
   💀 死亡数: 3回

2位: MiraTM3409
   ⏱️ プレイ時間: 22分
   🧱 ブロック設置: 345個
   ⛏️ ブロック破壊: 789個
   🚶 移動距離: 12.3km
   💀 死亡数: 1回

3位: mon8 kk
   ⏱️ プレイ時間: 12分
   🧱 ブロック設置: 89個
   ⛏️ ブロック破壊: 156個
   🚶 移動距離: 3.4km
   💀 死亡数: 0回
```

## 🔍 トラブルシューティング

### Behavior Packが読み込まれない

**症状**: サーバーログに "[StatsTracker]" が表示されない

**解決方法**:
1. manifest.jsonの構文を確認
2. world_behavior_packs.jsonが正しいか確認
3. サーバーを完全に再起動

### スコアボードが更新されない

**症状**: ブロックを設置してもスコアボードが0のまま

**解決方法**:
1. スコアボードが作成されているか確認:
   ```
   scoreboard objectives list
   ```
2. Behavior Packが有効になっているか確認
3. サーバーログでエラーメッセージを探す

### データベースに反映されない

**症状**: ウェブサイトで統計が0と表示される

**解決方法**:
1. collect-scoreboard-stats.js が起動しているか確認:
   ```bash
   ps aux | grep "collect-scoreboard-stats"
   ```
2. ログを確認:
   ```bash
   tail -f /home/kbt0/webapp/minecraft-site/scoreboard-collector.log
   ```
3. 手動で実行してエラーを確認:
   ```bash
   node /home/kbt0/webapp/minecraft-site/collect-scoreboard-stats.js
   ```

## 📌 重要な注意事項

### Behavior Packについて
- サーバーサイドで動作（クライアント側の対応不要）
- サーバー再起動後も設定は保持される
- Scriptingモジュールを使用（Beta APIではない）

### スコアボードについて
- サーバー再起動後も値は保持される
- バックアップは自動的に保存される
- コマンドで手動リセット可能

### データ同期について
- 5分ごとに自動同期
- 即座に反映したい場合は手動実行可能
- WebSocketでリアルタイム通知（将来実装可能）

## 🚀 次の実装ステップ

### サーバー再起動（必須）

```bash
# 1. サーバーを停止
screen -S tama -X stuff "stop\n"
sleep 5

# 2. サーバーを起動
screen -S tama -X stuff "cd ~/tama/bedrock-server-1.21.114.1 && ./bedrock_server\n"

# 3. 起動を確認（約30秒待つ）
sleep 30
screen -S tama -X hardcopy /tmp/screen-tama.log
tail -30 /tmp/screen-tama.log
```

### 統計コレクター起動

```bash
cd /home/kbt0/webapp/minecraft-site
nohup node collect-scoreboard-stats.js > scoreboard-collector.log 2>&1 &
```

### 動作確認

1. プレイヤーがログイン
2. ブロックを設置/破壊
3. サーバーログで "[StatsTracker]" メッセージを確認
4. 5分待機
5. ウェブサイトのランキングページを確認

## 📚 関連ドキュメント

- **ADVANCED-STATS-SETUP.md**: 詳細なセットアップガイド
- **BLOCK-STATS-SOLUTION.md**: 統計実装方法の説明
- **TESTING-NOTIFICATIONS.md**: 通知システムのテスト方法
- **EXPLANATION.md**: システムの動作説明
- **Behavior Pack README**: `/home/kbt0/tama/bedrock-server-1.21.114.1/behavior_packs/stats_tracker/README.md`

## 🎉 まとめ

完全な統計追跡システムが実装されました！

**実装完了**:
- ✅ プレイヤーセッション追跡
- ✅ プレイ時間の自動計算
- ✅ ブロック設置/破壊の自動検出（Behavior Pack）
- ✅ スコアボード統合
- ✅ データベース自動同期
- ✅ ウェブサイトランキング表示

**次のステップ**:
1. Minecraftサーバーを再起動
2. スコアボード統計コレクターを起動
3. プレイヤーがブロックを設置/破壊
4. ウェブサイトで統計を確認

**Pull Request**: https://github.com/K11420/discord-music-bot/pull/1
