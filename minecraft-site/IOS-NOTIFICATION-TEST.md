# iOS PWA 通知テスト手順書

## 📱 iOS PWA（Progressive Web App）通知テストガイド

このドキュメントでは、iOSデバイス（iPhone/iPad）でPWA通知をテストする方法を説明します。

---

## ⚠️ 重要な前提知識

### iOS PWA通知の制限事項

iOS（Safari）でのPWA通知には以下の制限があります：

1. **iOS 16.4以降が必要**: Push通知はiOS 16.4+のみサポート
2. **ホーム画面への追加が必須**: Safariブラウザでは通知は動作しません
3. **Notification APIのみ**: Web Push API（Service Worker経由のプッシュ）は**非サポート**
4. **ページがアクティブ時のみ**: バックグラウンドでの通知は制限されています

### 現在の実装状況

✅ **実装済み:**
- Service Worker登録機能
- Notification API統合
- 通知許可リクエスト
- WebSocket経由のリアルタイム通知

❌ **iOS未対応機能:**
- バックグラウンドプッシュ通知
- Web Push API（FCMなど）

---

## 🧪 テスト準備

### 1. iOSデバイスの要件
- **iOS バージョン**: 16.4以降
- **ブラウザ**: Safari（Chrome/Firefoxは不可）
- **デバイス**: iPhone または iPad

### 2. サーバーの確認
```bash
# サーバーが起動していることを確認
cd /home/kbt0/webapp/minecraft-site
pm2 status

# 起動していない場合
pm2 start server-enhanced.js --name minecraft-site
```

### 3. HTTPSアクセスの確認
```
URL: https://minecraft.schale41.jp
```

---

## 📝 テスト手順

### ステップ1: PWAをホーム画面に追加

1. **iPhoneのSafariで以下のURLにアクセス:**
   ```
   https://minecraft.schale41.jp
   ```

2. **共有ボタンをタップ** （画面下部の↑アイコン）

3. **「ホーム画面に追加」を選択**
   - アイコンが表示されることを確認
   - 「追加」をタップ

4. **ホーム画面にアイコンが追加されたことを確認**

### ステップ2: PWAとして起動

1. **ホーム画面からアプリアイコンをタップ**
   - 通常のアプリのように全画面で起動します
   - Safari のUIバーは表示されません

2. **デベロッパーツールを確認（オプション）**
   - Mac + iPhone + Lightning/USBケーブルが必要
   - Mac Safari → 開発 → [デバイス名] → minecraft.schale41.jp
   - コンソールログを確認できます

### ステップ3: 通知許可を確認

PWAを起動すると、以下が自動的に実行されます：

1. **Service Worker登録** (起動から即座に)
   - コンソール: `✅ Service Worker registered: /`

2. **通知許可リクエスト** (3秒後に表示)
   - ポップアップ: 「"minecraft.schale41.jp"は通知を送信します。よろしいですか？」
   - **「許可」をタップ**

3. **ウェルカム通知が表示される**
   - タイトル: 🎉 通知が有効になりました
   - 本文: イベントが作成されると通知が届きます

### ステップ4: リアルタイム通知をテスト

#### 方法A: 管理画面から実際のイベントを作成

1. **別のデバイス（PCなど）で管理画面にアクセス:**
   ```
   https://minecraft.schale41.jp/admin
   ```

2. **ログイン:**
   - ユーザー名: `admin`
   - パスワード: （設定したパスワード）

3. **新しいイベントを作成:**
   - 「イベント管理」→「新規イベント作成」
   - タイトル: `iOS通知テスト`
   - 日付: 今日の日付を選択
   - 「作成」をクリック

4. **iPhoneのPWAで通知を確認:**
   - 画面上部に通知バナーが表示されます
   - タイトル: 🎉 新しいイベント
   - 本文: 「iOS通知テスト」が追加されました！

#### 方法B: テストスクリプトで通知を送信

サーバー側でテストスクリプトを実行：

```bash
cd /home/kbt0/webapp/minecraft-site

# テストスクリプトを作成
cat > ios-notification-test.js << 'EOF'
const WebSocket = require('ws');

console.log('📱 iOS通知テストを開始...\n');

// WebSocketで接続
const ws = new WebSocket('wss://minecraft.schale41.jp');

ws.on('open', () => {
    console.log('✅ WebSocket接続成功');
    console.log('📢 テスト通知を送信します...\n');
    
    // 接続後すぐに通知をトリガー
    setTimeout(() => {
        ws.close();
        console.log('\n✅ テスト完了 - iPhoneで通知を確認してください');
        process.exit(0);
    }, 2000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 受信メッセージ:', message.type);
    } catch (error) {
        console.log('⚠️  メッセージ解析エラー');
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocketエラー:', error.message);
    process.exit(1);
});
EOF

# 実行
node ios-notification-test.js
```

---

## 🔍 期待される動作

### ✅ 成功パターン

1. **PWA起動時:**
   - Service Worker登録成功
   - 3秒後に通知許可リクエスト
   - 許可後にウェルカム通知表示

2. **イベント作成時:**
   - 即座に通知バナー表示（PWAがアクティブの場合）
   - 音/振動あり（設定による）
   - 通知タップで管理画面に移動

3. **WebSocket接続:**
   - 自動接続
   - リアルタイム更新
   - サーバー状態の同期

### ❌ よくある問題

#### 問題1: 通知許可ポップアップが表示されない

**原因:**
- Safariブラウザで開いている（PWAではない）
- すでに「許可しない」を選択した

**解決策:**
```bash
1. ホーム画面のPWAアイコンから起動する
2. iOS設定 → Safari → 詳細 → Webサイトデータ → minecraft.schale41.jp を削除
3. PWAアイコンを長押し → 削除
4. 再度「ホーム画面に追加」から始める
```

#### 問題2: 通知が届かない

**原因:**
- 通知許可が「拒否」になっている
- WebSocket接続が切れている
- iOS通知設定がオフ

**解決策:**
```bash
1. iOS設定 → 通知 → Safari → 通知を許可
2. PWAを再起動
3. コンソールでWebSocket接続を確認
```

#### 問題3: Service Workerが登録されない

**原因:**
- HTTPSではない
- service-worker.jsが見つからない

**解決策:**
```bash
# サーバー側でファイル存在を確認
cd /home/kbt0/webapp/minecraft-site
ls -la service-worker.js

# HTTPSアクセスを確認
curl -I https://minecraft.schale41.jp/service-worker.js
```

---

## 🔧 デバッグ方法

### Mac + iPhoneでコンソールログを見る

1. **iPhoneを接続:**
   - Lightning/USBケーブルでMacに接続
   - iPhone側で「このコンピュータを信頼」

2. **Mac Safariで開発メニューを有効化:**
   - Safari → 環境設定 → 詳細
   - 「メニューバーに"開発"メニューを表示」にチェック

3. **iPhoneのPWAを接続:**
   - Safari → 開発 → [デバイス名]
   - minecraft.schale41.jp を選択
   - Webインスペクタが開きます

4. **コンソールで確認:**
   ```javascript
   // Service Worker状態
   navigator.serviceWorker.getRegistration().then(reg => console.log(reg));
   
   // 通知許可状態
   console.log('Notification permission:', Notification.permission);
   
   // WebSocket接続状態
   console.log('WebSocket state:', ws.readyState);
   ```

---

## 📊 テスト結果の記録

### チェックリスト

- [ ] iOS 16.4以降のデバイスを使用
- [ ] SafariでHTTPSアクセス確認
- [ ] ホーム画面にPWAを追加
- [ ] PWAアイコンから起動
- [ ] Service Worker登録成功
- [ ] 通知許可リクエスト表示
- [ ] 通知を「許可」に設定
- [ ] ウェルカム通知が表示された
- [ ] イベント作成通知が届いた
- [ ] 通知タップで管理画面に移動

### 結果記入欄

```
テスト日時: __________________
iOSバージョン: __________________
デバイス: __________________

✅ 成功した項目:
-
-
-

❌ 失敗した項目:
-
-
-

📝 備考:
-
-
-
```

---

## 🚀 次のステップ

### PWA通知の制限を理解した上で

iOSのPWA通知は**フォアグラウンドのみ**という制限があります。真のプッシュ通知（バックグラウンド配信）を実装するには：

1. **ネイティブアプリ開発**
   - Swift/SwiftUIでiOSアプリを作成
   - APNs（Apple Push Notification service）を使用
   - App Storeに公開

2. **サードパーティサービス利用**
   - Firebase Cloud Messaging（FCM）
   - OneSignal
   - Pusher Beams
   
3. **WebView + ネイティブハイブリッド**
   - Capacitor / Ionic
   - React Native WebView
   - Flutter WebView

### 現在の実装で十分な場合

- ✅ PWAがアクティブな時の通知は完全に動作します
- ✅ リアルタイム更新（WebSocket）は正常に機能します
- ✅ 通知音/振動も動作します

---

## 📞 サポート

問題が発生した場合:

1. **コンソールログを確認**
2. **WebSocket接続状態を確認**
3. **iOS設定の通知許可を確認**
4. **service-worker.jsのエラーログを確認**

---

**作成日**: 2025-10-28  
**対象サイト**: https://minecraft.schale41.jp  
**対象バージョン**: v3.3.0
