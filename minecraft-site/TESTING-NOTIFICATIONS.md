# 通知システム テスト手順 (Notification System Testing Guide)

## 修正内容 (Changes Made)

### 1. ランキング表示の修正 (Ranking Display Fix)
- **問題**: プレイヤーの`total_playtime`が全て0になっていた
- **原因**: `add-test-data.js`が`total_playtime`パラメータを使用していたが、`database.js`の`updatePlayerStats`メソッドは`playtime`を期待していた
- **修正**: パラメータ名を`playtime`に変更し、データベースをクリアして正しいデータを再投入
- **結果**: 
  - Steve: 360,000ms (6分)
  - Alex: 280,000ms (4分40秒)
  - Creeper: 200,000ms (3分20秒)
  - Enderman: 150,000ms (2分30秒)
  - Zombie: 120,000ms (2分)

### 2. 通知システムのデバッグログ追加 (Notification Debug Logging)
- **追加内容**: `broadcastToAll()`関数に詳細なログ出力を追加
- **ログ内容**:
  - 接続クライアント数
  - 送信完了したクライアント数
  - ブロードキャストタイプ

## テスト手順 (Testing Steps)

### ステップ 1: サーバー起動確認
```bash
cd /home/kbt0/webapp/minecraft-site
ps aux | grep "node.*server-enhanced" | grep -v grep
```
**期待結果**: Node.jsプロセスが起動していることを確認

### ステップ 2: ランキング表示確認
1. ブラウザで公開ページを開く: `https://minecraft.schale41.jp/`
2. "ランキング"セクションまでスクロール
3. プレイヤーリストを確認

**期待結果**:
- Steve, Alex, Creeper, Enderman, Zombieが表示される
- 各プレイヤーのプレイ時間が正しく表示される (0ではない)
- プレイ時間順にソートされている

### ステップ 3: 通知システムテスト (重要!)

#### 3-1. ブラウザコンソールを開く
1. 公開ページ (`https://minecraft.schale41.jp/`) を開く
2. ブラウザの開発者ツールを開く (F12 または 右クリック → 検証)
3. "Console"タブを選択

#### 3-2. WebSocket接続確認
コンソールに以下のようなメッセージが表示されることを確認:
```
✅ WebSocket connected
```

#### 3-3. イベント作成
1. 別タブで管理画面を開く: `https://minecraft.schale41.jp/admin`
2. パスワード入力: `admin123`
3. "イベント管理"セクションを開く
4. "新しいイベント追加"ボタンをクリック
5. イベント情報を入力:
   - タイトル: 「テスト通知イベント」
   - 説明: 「通知システムのテスト」
   - 日時: 適当な未来の日時を選択
   - タイプ: event
6. "作成"ボタンをクリック

#### 3-4. 通知受信確認 (公開ページのコンソール)
イベント作成後、**公開ページのコンソール**に以下のログが表示されることを確認:

```javascript
🎉 Event notification received: {
  title: '🎉 新しいイベント',
  message: '「テスト通知イベント」が追加されました！\n📅 ...',
  eventId: ...,
  eventTitle: 'テスト通知イベント',
  eventDate: '...',
  eventType: 'event'
}
```

#### 3-5. サーバーログ確認
サーバー側のログを確認:
```bash
cd /home/kbt0/webapp/minecraft-site
tail -f server.log
```

**期待されるログ**:
```
📢 Broadcasting to X clients, type: event_notification
✅ Broadcast complete: sent to X clients
```

### ステップ 4: ブラウザ通知の確認

#### 4-1. 通知権限確認
1. 公開ページを開く
2. ブラウザに通知許可のダイアログが表示された場合は「許可」をクリック

#### 4-2. 視覚的通知確認
イベント作成後、以下が表示されることを確認:
- 画面右上に緑色の通知カードが表示される
- タイトル: 「🎉 新しいイベント」
- メッセージ: イベント名と日時
- 約8秒後に自動的に消える

#### 4-3. Service Worker通知 (iOS PWA対応)
- iOS/iPadOSの場合: ホーム画面に追加後、通知が届くことを確認
- デスクトップの場合: ブラウザのシステム通知が表示される

## トラブルシューティング (Troubleshooting)

### 通知が届かない場合

1. **WebSocket接続確認**
   ```javascript
   // ブラウザコンソールで実行
   console.log('WebSocket status:', ws.readyState);
   // 1 = OPEN (正常接続)
   ```

2. **サーバーログ確認**
   ```bash
   cd /home/kbt0/webapp/minecraft-site
   tail -100 server.log | grep -i "broadcast\|websocket\|event"
   ```

3. **キャッシュクリア**
   - ブラウザのキャッシュをクリア
   - ページを強制リロード (Ctrl+Shift+R または Cmd+Shift+R)

4. **Service Worker再登録**
   ```javascript
   // ブラウザコンソールで実行
   navigator.serviceWorker.getRegistrations().then(registrations => {
       registrations.forEach(reg => reg.unregister());
   });
   // その後、ページをリロード
   ```

### ランキングが表示されない場合

1. **データベース確認**
   ```bash
   cd /home/kbt0/webapp/minecraft-site
   node -e "
   const Database = require('./database.js');
   const db = new Database();
   setTimeout(() => {
       db.getPlayerRankings('total_playtime', 10).then(console.log);
   }, 1000);
   "
   ```

2. **データ再投入**
   ```bash
   cd /home/kbt0/webapp/minecraft-site
   node clear-and-add-data.js
   ```

## 重要な変更点 (Important Changes)

### ファイル変更一覧
1. `add-test-data.js` - パラメータ名修正 (`total_playtime` → `playtime`)
2. `server-enhanced.js` - `broadcastToAll()`にデバッグログ追加
3. `clear-and-add-data.js` - 新規作成 (データクリア＆再投入スクリプト)

### 今後の実装が必要な機能 (Future Enhancements)
1. 実際のMinecraftサーバーからのリアルタイムプレイヤーデータ収集
2. プレイヤーセッション追跡の自動化
3. 通知の既読管理
4. 通知履歴の保存と表示
5. ユーザー別の通知設定

## 確認事項チェックリスト (Verification Checklist)

- [ ] サーバーが正常に起動している
- [ ] ランキングページに5人のテストプレイヤーが表示される
- [ ] 各プレイヤーのプレイ時間が0ではない
- [ ] 管理画面でイベントを作成できる
- [ ] イベント作成時にサーバーログに"Broadcast"メッセージが表示される
- [ ] 公開ページのコンソールに"Event notification received"が表示される
- [ ] 画面右上に緑色の通知カードが表示される
- [ ] 通知が8秒後に自動的に消える
- [ ] ブラウザのシステム通知が表示される (許可済みの場合)

## サポート情報 (Support Information)

- サーバーURL: `https://minecraft.schale41.jp/`
- 管理画面: `https://minecraft.schale41.jp/admin`
- パスワード: `admin123`
- サーバーポート: `3000`
- WebSocketポート: `3000` (HTTP upgradeを使用)
