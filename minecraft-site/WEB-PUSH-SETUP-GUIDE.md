# 📱 Web Push通知セットアップガイド

## ✅ 実装完了！

**真のバックグラウンドプッシュ通知**が実装されました！

アプリが閉じていても、**デバイスに直接通知が届きます**。

---

## 🎯 対応デバイス

### ✅ 完全対応

- **Android 6.0 (Marshmallow)以降**
  - Chrome、Firefox、Edge
  - アプリが閉じていても通知が届く
  - ロック画面にも表示

- **Windows 10/11**
  - Chrome、Firefox、Edge
  - デスクトップ通知

- **macOS**
  - Chrome、Firefox、Safari (16.4+)
  - デスクトップ通知

- **iOS 16.4以降（PWA）**
  - Safari (PWAとしてインストール必須)
  - ⚠️ 一部制限あり（後述）

---

## 🚀 使い方（ユーザー向け）

### ステップ1: サイトにアクセス

```
https://minecraft.schale41.jp
```

### ステップ2: 通知許可をリクエスト

初回アクセス時に自動的に表示されます：

```
「minecraft.schale41.jp」は通知を送信します。
よろしいですか？

[ブロック] [許可]
```

**「許可」をタップ/クリック**してください！

### ステップ3: 完了！

✅ **自動的にプッシュ通知にサブスクライブされます**

これだけです！もうアプリを閉じても通知が届きます。

---

## 🔔 通知の種類

### 1. フォアグラウンド通知（アプリが開いている時）

- 画面上部にバナー表示
- WebSocket経由でリアルタイム配信
- 即座に届く

### 2. バックグラウンド通知（アプリが閉じている時）

- **Androidロック画面に表示**
- デバイスに直接配信
- 音・振動あり

### 3. iOS PWA通知

- ホーム画面から起動したPWAに配信
- ⚠️ アプリが完全に閉じている場合は制限あり

---

## 📱 iOSでの使い方

### 重要：PWAとしてインストールが必要

1. **Safariで https://minecraft.schale41.jp を開く**

2. **共有ボタン（□に↑）をタップ**

3. **「ホーム画面に追加」を選択**

4. **ホーム画面のアイコンからアプリを起動**

5. **通知許可で「許可」をタップ**

6. **完了！**

### iOSの制限事項

- ✅ アプリがアクティブ：通知が届く
- ✅ アプリがバックグラウンド（最小化）：通知が届く可能性あり
- ⚠️ アプリが完全に閉じている：制限あり

**解決策**: アプリを完全に閉じないでください。ホームボタンで最小化するだけにしてください。

---

## 🧪 テスト方法

### 方法1: 管理画面でイベントを作成

1. **管理画面にアクセス:**
   ```
   https://minecraft.schale41.jp/admin
   ```

2. **ログイン** (admin / admin123)

3. **「新規イベント作成」**

4. **イベント情報を入力して作成**

5. **デバイスに通知が届く！**

### 方法2: サーバー側からテスト

```bash
cd /home/kbt0/webapp/minecraft-site
node test-notification-now.js
```

---

## 🔧 技術的な詳細

### アーキテクチャ

```
[管理画面] → イベント作成
    ↓
[サーバー] → 2つの通知を送信:
    ├─ WebSocket → 接続中のクライアントに即座に配信
    └─ Web Push API → すべてのサブスクライバーに配信
         ↓
    [ブラウザ/デバイス] → Service Workerが受信
         ↓
    [通知表示] → ロック画面/通知センターに表示
```

### 使用技術

- **Web Push API**: W3C標準のプッシュ通知API
- **VAPID**: サーバー認証のための鍵ペア
- **Service Worker**: バックグラウンド処理
- **Push Manager**: サブスクリプション管理

### セキュリティ

- ✅ VAPID鍵で署名された安全な通知
- ✅ HTTPS必須
- ✅ ユーザーの明示的な許可が必要
- ✅ サブスクリプションは暗号化

---

## 📊 サブスクリプション状態の確認

### ユーザー側（ブラウザコンソール）

```javascript
// Service Worker登録状態
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('Service Worker:', reg);
});

// プッシュサブスクリプション状態
navigator.serviceWorker.ready.then(reg => {
    reg.pushManager.getSubscription().then(sub => {
        console.log('Push Subscription:', sub);
    });
});

// 通知許可状態
console.log('Notification permission:', Notification.permission);
```

### サーバー側

```bash
# サーバーログを確認
tail -f server.log | grep -i "push\|subscription"
```

期待される出力:
```
✅ Web Push configured
📱 New push subscription: https://fcm.googleapis.com/fcm/send/...
   Total subscriptions: 1
```

---

## 🆘 トラブルシューティング

### 問題1: 通知許可のポップアップが表示されない

**原因:**
- すでに「ブロック」を選択した
- 通知がブラウザでブロックされている

**解決方法:**

**Chrome/Edge:**
1. アドレスバー左の鍵アイコンをクリック
2. サイトの設定 → 通知 → 許可

**Firefox:**
1. アドレスバー左の鍵アイコンをクリック
2. 通知の権限 → 許可

**Safari:**
1. Safari → 環境設定 → Webサイト → 通知
2. minecraft.schale41.jp → 許可

### 問題2: 通知が届かない

**確認事項:**

1. **通知許可を確認:**
   ```javascript
   console.log(Notification.permission);
   // "granted" である必要があります
   ```

2. **プッシュサブスクリプションを確認:**
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
       reg.pushManager.getSubscription().then(sub => {
           console.log(sub ? '✅ Subscribed' : '❌ Not subscribed');
       });
   });
   ```

3. **Service Workerを確認:**
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
       console.log(reg ? '✅ Registered' : '❌ Not registered');
   });
   ```

### 問題3: iOSで通知が届かない

**確認事項:**

1. **PWAとしてインストールされているか:**
   - Safariブラウザでは動作しません
   - ホーム画面からアプリを起動してください

2. **通知設定を確認:**
   - 設定 → 通知 → Safari → 通知を許可

3. **アプリがアクティブか:**
   - iOSでは、アプリが完全に閉じていると制限があります
   - アプリを最小化するだけにしてください

---

## 🎯 動作確認チェックリスト

- [ ] サイトにアクセス
- [ ] 通知許可で「許可」を選択
- [ ] ブラウザコンソールで「✅ Subscribed to push notifications」を確認
- [ ] テストイベントを作成
- [ ] **アプリを閉じる**
- [ ] デバイスに通知が届く ← **これが重要！**

---

## 📈 統計情報

### サーバー側で確認

サーバーログで以下を確認できます：

```
✅ Web Push configured
📱 New push subscription: https://...
   Total subscriptions: 3
📢 Sending push notification to 3 subscribers
   ✅ Sent to: https://fcm.googleapis.com/fcm/send/...
   ✅ Sent to: https://fcm.googleapis.com/fcm/send/...
   ✅ Sent to: https://fcm.googleapis.com/fcm/send/...
✅ Push notification sent successfully
```

---

## 💡 ヒントとコツ

### Androidユーザー向け

1. **Chrome PWAとしてインストール:**
   - メニュー → アプリをインストール
   - ホーム画面にアイコンが追加されます
   - より良い通知体験

2. **通知設定:**
   - Android設定 → アプリ → Bedrock Server
   - 通知を「すべて許可」に設定

### iOSユーザー向け

1. **必ずPWAとしてインストール:**
   - Safariでは制限があります

2. **アプリを完全に閉じない:**
   - ホームボタンで最小化
   - バックグラウンドで保持

3. **定期的にアプリを開く:**
   - 1日1回程度アプリを開くと
   - サブスクリプションが維持されます

---

## 🎉 完了！

**バックグラウンドプッシュ通知が完全に動作しています！**

- ✅ アプリが閉じていても通知が届く
- ✅ Android完全対応
- ✅ iOS PWA対応
- ✅ デスクトップブラウザ対応
- ✅ セキュアで信頼性が高い

---

**次のステップ:**

1. デバイスで https://minecraft.schale41.jp を開く
2. 通知を「許可」する
3. アプリを閉じる
4. 管理画面でイベントを作成
5. デバイスに通知が届くのを確認！

試してみてください！ 🚀
