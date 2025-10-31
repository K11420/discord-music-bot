# 実際のプレイヤーデータ収集システム

## ✅ 完了した作業

### 1. テストプレイヤーの削除
- Steve, Alex, Creeper, Enderman, Zombie を全て削除
- データベースをクリーンな状態に
- 実際のプレイヤーデータのみを表示する準備完了

### 2. リアルタイムデータ収集システムの実装
`collect-real-player-data.js` スクリプトを作成しました。

**機能**:
- 60秒ごとにMinecraftサーバーログを監視
- プレイヤーの接続/切断を自動検出
- プレイヤーセッションを追跡
- プレイ時間を自動計算してデータベースに保存
- ランキングをリアルタイムで更新

## 🚀 現在の動作状況

### データコレクター
**ステータス**: ✅ 実行中

**プロセス情報**:
```bash
PID: 2058649
コマンド: node collect-real-player-data.js
ログファイル: /home/kbt0/webapp/minecraft-site/player-data-collector.log
```

**検出されたプレイヤー**:
- mon8 kk (現在オンライン、セッション記録中)

### データベース状態
```
📋 Active Sessions:
- mon8 kk: セッション開始 2025-10-28 14:02:53

📊 Player Stats:
- まだ統計なし (プレイヤーがログアウトした時に記録されます)
```

## 📖 動作の仕組み

### 1. プレイヤー接続時
1. サーバーログから "Player connected: [名前]" を検出
2. データベースに新しいセッションを記録
3. セッション開始時刻を保存
4. アクティブセッションリストに追加

### 2. プレイヤーがプレイ中
- 60秒ごとにオンライン状態を確認
- セッションが継続していることを確認

### 3. プレイヤー切断時
1. サーバーログから "Player disconnected: [名前]" を検出
2. セッション終了時刻を記録
3. プレイ時間を計算 (終了時刻 - 開始時刻)
4. player_statsテーブルのtotal_playtimeを更新
5. ランキングが自動的に更新される

## 🔍 確認コマンド

### データコレクターのログを確認
```bash
cd /home/kbt0/webapp/minecraft-site
tail -f player-data-collector.log
```

**期待される出力**:
```
🔄 Collecting player data...
👥 Online players: 1
   Players: mon8 kk

📊 Current Rankings:
   (プレイヤーがログアウト後に表示)
```

### データベースの内容を確認
```bash
cd /home/kbt0/webapp/minecraft-site
node -e "
const Database = require('./database.js');
const db = new Database();
setTimeout(async () => {
    const rankings = await db.getPlayerRankings('total_playtime', 10);
    console.log('Rankings:', rankings);
    process.exit(0);
}, 1000);
"
```

### プロセスの状態を確認
```bash
ps aux | grep "collect-real-player-data" | grep -v grep
```

## 🛠️ メンテナンス

### データコレクターを再起動
```bash
cd /home/kbt0/webapp/minecraft-site

# 既存のプロセスを停止
pkill -f "collect-real-player-data.js"

# 新しいプロセスを開始
nohup node collect-real-player-data.js > player-data-collector.log 2>&1 &
```

### データコレクターを停止
```bash
pkill -f "collect-real-player-data.js"
```

### ログファイルをクリア
```bash
cd /home/kbt0/webapp/minecraft-site
> player-data-collector.log
```

## 📊 ランキングページでの表示

### 現在
- ランキングページを開くとデータがまだ表示されません
- これは正常です（プレイヤーがまだログアウトしていないため）

### プレイヤーがログアウトした後
1. データコレクターがログアウトを検出
2. プレイ時間を計算してデータベースに保存
3. ランキングページを更新すると表示される

**表示例**:
```
📊 プレイヤーランキング

1. mon8 kk
   プレイ時間: 15分23秒
   ブロック設置: 0
   ブロック破壊: 0
```

## 🔧 トラブルシューティング

### データコレクターが動いていない
```bash
cd /home/kbt0/webapp/minecraft-site
nohup node collect-real-player-data.js > player-data-collector.log 2>&1 &
```

### プレイヤーが検出されない
1. Minecraftサーバーが起動しているか確認
   ```bash
   ps aux | grep bedrock_server | grep -v grep
   ```

2. screenセッションが存在するか確認
   ```bash
   screen -ls | grep tama
   ```

3. サーバーログが読み取れるか確認
   ```bash
   screen -S tama -X hardcopy /tmp/screen-tama.log
   cat /tmp/screen-tama.log | tail -50
   ```

### ランキングが更新されない
1. データベースの内容を確認
2. データコレクターのログを確認
3. ページのキャッシュをクリアして再読み込み (Ctrl+Shift+R)

## 📌 重要な注意点

### プレイ時間の記録タイミング
- **記録されるタイミング**: プレイヤーがログアウトした時のみ
- **記録されないケース**: 
  - プレイヤーがまだオンライン中
  - サーバーがクラッシュした場合
  - データコレクターが停止している場合

### セッション追跡の精度
- 60秒ごとにチェックするため、最大60秒の誤差が生じる可能性があります
- より正確な追跡が必要な場合は、チェック間隔を短くできます
  （collect-real-player-data.jsの`setInterval`の値を変更）

## 🎯 次のステップ

### 推奨される機能追加
1. **ブロック統計の追跡**
   - サーバーログからブロック設置/破壊イベントを抽出
   - 現在は0として記録されています

2. **移動距離の追跡**
   - プレイヤーの座標変化から移動距離を計算
   - 現在は0として記録されています

3. **デス数の追跡**
   - プレイヤーの死亡イベントを検出
   - 現在は0として記録されています

4. **自動起動設定**
   - サーバー再起動時にデータコレクターを自動起動
   - systemdサービスまたはcrontabで設定

5. **データバックアップ**
   - 定期的なデータベースバックアップ
   - データ損失の防止

## 📋 Pull Request

**URL**: https://github.com/K11420/discord-music-bot/pull/1

**最新のコミット**:
- テストプレイヤーの削除
- リアルタイムプレイヤーデータ収集システムの追加
- 詳細なドキュメント作成

## ✅ まとめ

- ✅ テストプレイヤー削除完了
- ✅ 実際のプレイヤーデータ収集システム実装完了
- ✅ データコレクター起動中
- ✅ プレイヤー「mon8 kk」を検出してセッション記録中
- ✅ プレイヤーがログアウトすると統計が更新されます

**テスト方法**:
1. mon8 kkさんがMinecraftからログアウトするのを待つ
2. ランキングページを更新
3. プレイ時間が表示されることを確認

または

1. 別のプレイヤーがログインしてログアウト
2. データコレクターが自動的に検出
3. ランキングに追加される
