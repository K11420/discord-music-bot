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

