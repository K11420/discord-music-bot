# ブロック設置/破壊統計の実装方法

## 🔍 現在の状況

Bedrock版のMinecraftサーバーでは、Java版と異なり、ブロック設置/破壊の統計情報がログファイルやデータファイルに直接出力されません。

## ❌ 利用できないもの

- プレイヤー統計ファイル (Java版の`stats`フォルダのようなもの)
- ブロック設置/破壊のログメッセージ
- 直接アクセス可能な統計データベース

## ✅ 実装可能な解決策

### 方法1: スコアボードコマンドを使用 (推奨)

Minecraftのスコアボードシステムを使用して統計を追跡します。

#### ステップ1: スコアボード作成
サーバーコンソールで以下のコマンドを実行:

```
scoreboard objectives add blocks_placed dummy "ブロック設置"
scoreboard objectives add blocks_broken dummy "ブロック破壊"
scoreboard objectives add distance_walked dummy "移動距離"
scoreboard objectives add deaths deathCount "死亡数"
```

#### ステップ2: プレイヤーごとにカウント
プレイヤーがブロックを設置/破壊した時にコマンドで更新:

```
scoreboard players add <プレイヤー名> blocks_placed 1
scoreboard players add <プレイヤー名> blocks_broken 1
```

#### ステップ3: スコアボードから統計を取得
定期的にコマンドを実行して統計を取得:

```
scoreboard players list <プレイヤー名>
```

**問題点**: 
- 手動でコマンドを実行する必要がある
- ブロック設置/破壊を自動検出できない

### 方法2: Behavior Pack (アドオン) を使用

カスタムBehavior Packを作成して、イベントを監視します。

#### 必要なファイル構造:
```
behavior_pack/
├── manifest.json
├── pack_icon.png
└── scripts/
    └── main.js (統計追跡スクリプト)
```

#### スクリプト例:
```javascript
import { world } from "@minecraft/server";

world.events.blockPlace.subscribe((event) => {
    const player = event.player;
    // カスタムスコアボードまたはファイルに記録
});

world.events.blockBreak.subscribe((event) => {
    const player = event.player;
    // カスタムスコアボードまたはファイルに記録
});
```

**問題点**:
- Behavior Packの開発と設定が必要
- サーバー再起動が必要
- プレイヤーもBehavior Packをダウンロードする必要がある場合がある

### 方法3: プレイ時間から推定値を計算 (簡易実装)

統計学的な推定を使用して、プレイ時間から大まかな値を推定します。

#### 推定式の例:
```javascript
// 平均的なプレイヤーの1分あたりの行動
const AVG_BLOCKS_PLACED_PER_MINUTE = 10;
const AVG_BLOCKS_BROKEN_PER_MINUTE = 15;
const AVG_DISTANCE_PER_MINUTE = 500; // ブロック単位

function estimateStats(playtimeMs) {
    const minutes = playtimeMs / 60000;
    
    return {
        blocks_placed: Math.floor(minutes * AVG_BLOCKS_PLACED_PER_MINUTE),
        blocks_broken: Math.floor(minutes * AVG_BLOCKS_BROKEN_PER_MINUTE),
        distance_traveled: Math.floor(minutes * AVG_DISTANCE_PER_MINUTE)
    };
}
```

**利点**:
- 実装が簡単
- すぐに使用可能
- サーバー設定の変更不要

**欠点**:
- 正確ではない（推定値）
- プレイヤーの実際の行動を反映していない

### 方法4: ログパーサープラグインを使用

サードパーティのプラグインやツールを使用します。

#### 例: MCBE統計ツール
- [BedrockStats](https://github.com/example/bedrockstats) (仮想の例)
- プレイヤーアクションをログに記録するプラグイン

**問題点**:
- 追加のソフトウェアインストールが必要
- サーバーのパフォーマンスに影響する可能性

## 🎯 推奨実装

### 短期的解決策 (今すぐ実装可能)

**オプションA: 統計を非表示にする**

現在ブロック統計は0と表示されているため、誤解を避けるために非表示にします。

```javascript
// enhanced.jsで統計表示をプレイ時間のみに限定
function loadRankings() {
    // ...
    card.innerHTML = `
        <div class="ranking-number">${index + 1}</div>
        <div class="ranking-info">
            <div class="ranking-name">${player.player_name}</div>
            <div class="ranking-stat">⏱️ ${formatRankingValue('total_playtime', player.total_playtime)}</div>
        </div>
    `;
}
```

**オプションB: 推定値を表示（推定である旨を明示）**

```javascript
function estimatePlayerStats(playtimeMs) {
    const minutes = playtimeMs / 60000;
    return {
        blocks_placed: Math.floor(minutes * 10 + Math.random() * minutes * 2),
        blocks_broken: Math.floor(minutes * 15 + Math.random() * minutes * 3),
        distance_traveled: Math.floor(minutes * 500 + Math.random() * minutes * 100)
    };
}

// 表示時に「推定」と明記
<div class="ranking-stat">🧱 約${estimated.blocks_placed}個 (推定)</div>
```

### 長期的解決策

**推奨: Behavior Packを開発**

1. カスタムBehavior Packを作成
2. イベントリスナーで統計を追跡
3. 外部ファイルまたはWebAPIに送信
4. ウェブサイトのデータベースに保存

## 💡 即座の対応

現在のウェブサイトでは、ブロック統計は全て0と表示されています。
以下のいずれかを選択してください:

### オプション1: 統計を非表示
```bash
# 統計表示をプレイ時間のみに限定
# enhanced.jsを修正してブロック統計を削除
```

### オプション2: 「データ収集中」と表示
```html
<div class="ranking-stat">🧱 データ収集中...</div>
```

### オプション3: 推定値を表示
```javascript
// 推定値を計算して表示（「推定」と明記）
```

## 📝 次のステップ

1. **短期**: どの表示方法を選ぶか決定
2. **中期**: Behavior Packの開発を検討
3. **長期**: より高度な統計追跡システムの構築

どの方法を実装しますか？
