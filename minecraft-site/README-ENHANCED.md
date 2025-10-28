# 🎮 Minecraft Bedrock Server Website - Enhanced Edition v3.0

プロフェッショナルなMinecraft Bedrockサーバーウェブサイト - 全機能実装版

## ✨ 新機能一覧

### 🎯 フロントエンド機能

#### 1. **オンラインプレイヤー表示** 👥
- リアルタイムでオンラインプレイヤーを表示
- プレイヤーアバター表示
- 10秒ごとに自動更新

#### 2. **サーバー統計・グラフ** 📊
- プレイヤー数推移グラフ（24時間）
- サーバーパフォーマンスグラフ（CPU・メモリ）
- Chart.jsによる美しい可視化
- リアルタイムメトリクス表示（CPU、メモリ、TPS）

#### 3. **サーバーチャット表示** 💬
- リアルタイムチャットログ表示
- プレイヤーの入退出通知
- システムメッセージの区別表示
- 自動スクロール機能

#### 4. **スクリーンショットギャラリー** 📸
- 画像アップロード機能（最大10MB）
- ギャラリー表示
- いいね機能
- レスポンシブグリッドレイアウト

#### 5. **イベントカレンダー** 📅
- 予定イベントの表示
- 日付・時刻表示
- イベントタイプ別分類
- 美しいカードレイアウト

#### 6. **プレイヤーランキング** 🏆
- プレイ時間ランキング
- ブロック設置数ランキング
- ブロック破壊数ランキング
- 移動距離ランキング
- タブ切り替え機能
- トップ3の特別表示（金・銀・銅）

#### 7. **ブラウザ通知システム** 🔔
- サーバーオンライン/オフライン通知
- ワンクリックで通知を有効化
- ブラウザネイティブ通知

### 🔐 管理画面機能

#### 8. **クイックコマンドパネル** ⚡
- 天気変更（晴れ・雨）
- 時間変更（昼・夜）
- モンスター削除
- プレイヤー全回復
- ゲームモード変更
- ワンクリックコマンド実行

#### 9. **イベント管理** 📆
- イベント作成フォーム
- イベント名・日時・説明入力
- イベントタイプ選択
- データベース保存

#### 10. **パフォーマンス監視** 💻
- CPU使用率
- メモリ使用率
- TPS（Ticks Per Second）
- リアルタイム更新

## 🗄️ データベース機能

### テーブル構成

1. **server_stats** - サーバー統計
   - タイムスタンプ
   - オンライン状態
   - プレイヤー数
   - パフォーマンスメトリクス

2. **player_sessions** - プレイヤーセッション
   - プレイヤー名
   - 参加・退出時刻
   - プレイ時間

3. **player_stats** - プレイヤー統計
   - 累計プレイ時間
   - ブロック設置・破壊数
   - 移動距離
   - 死亡数

4. **events** - イベント
   - イベント名・説明
   - 開催日時
   - イベントタイプ

5. **screenshots** - スクリーンショット
   - ファイル名
   - タイトル・説明
   - アップローダー
   - いいね数

6. **chat_logs** - チャットログ
   - プレイヤー名
   - メッセージ
   - タイムスタンプ

## 🚀 起動方法

### 1. 依存パッケージのインストール
```bash
cd /home/kbt0/webapp/minecraft-site
npm install
```

### 2. サーバー起動
```bash
# 拡張版サーバー起動
npm start

# 開発モード（自動再起動）
npm run dev

# レガシー版サーバー起動（旧版）
npm run start:legacy
```

### 3. アクセス
- **公開ページ**: http://localhost:3000
- **管理画面**: http://localhost:3000/admin
- **拡張版公開ページ**: http://localhost:3000/index-enhanced.html
- **拡張版管理画面**: http://localhost:3000/admin-enhanced.html

## 📁 ファイル構成

```
minecraft-site/
├── server-enhanced.js          # 拡張版バックエンド
├── database.js                 # データベース管理
├── index-enhanced.html         # 拡張版フロントエンド
├── admin-enhanced.html         # 拡張版管理画面
├── css/
│   ├── style.css              # ベーススタイル
│   ├── enhanced.css           # 拡張機能CSS
│   ├── admin.css              # 管理画面CSS
│   └── admin-enhanced.css     # 拡張管理画面CSS
├── js/
│   ├── main.js                # メインJS
│   ├── enhanced.js            # 拡張機能JS
│   ├── admin.js               # 管理画面JS
│   └── admin-enhanced.js      # 拡張管理画面JS
├── data/
│   └── minecraft-stats.db     # SQLiteデータベース
└── uploads/
    └── screenshots/           # アップロード画像
```

## 🔧 API エンドポイント

### 公開API
- `GET /api/status` - サーバー状態取得
- `GET /api/players/online` - オンラインプレイヤー取得
- `GET /api/stats/server?hours=24` - サーバー統計取得
- `GET /api/stats/players?type=...&limit=10` - プレイヤーランキング取得
- `GET /api/chat/history?limit=50` - チャット履歴取得
- `GET /api/events?limit=10` - イベント一覧取得
- `GET /api/screenshots?limit=20` - スクリーンショット一覧取得
- `POST /api/screenshots/upload` - スクリーンショットアップロード
- `POST /api/screenshots/:id/like` - いいね追加

### 管理API（認証必要）
- `POST /api/login` - ログイン
- `POST /api/logout` - ログアウト
- `GET /api/auth/status` - 認証状態確認
- `POST /api/server/start` - サーバー起動
- `POST /api/server/stop` - サーバー停止
- `POST /api/server/restart` - サーバー再起動
- `POST /api/server/command` - コマンド送信
- `GET /api/server/logs` - ログ取得
- `GET /api/commands/quick` - クイックコマンド一覧
- `POST /api/events` - イベント作成
- `DELETE /api/events/:id` - イベント削除

## 📊 リアルタイム機能

### WebSocket通信
- 3秒ごとのステータス更新
- プレイヤーリストの自動更新
- ログのリアルタイム表示
- 管理者への通知配信

## 🎨 レスポンシブデザイン

- モバイルファースト設計
- タブレット・PC対応
- フレキシブルグリッドレイアウト
- タッチ操作対応

## 🔒 セキュリティ

- セッション認証
- パスワード保護
- ファイルアップロード検証
- SQLインジェクション対策
- XSS対策

## ⚙️ 設定

### 環境変数
```bash
PORT=3000                    # サーバーポート
ADMIN_PASSWORD=admin123      # 管理者パスワード
```

### データベース
- SQLite3使用
- 自動初期化
- トランザクション対応

## 📝 今後の拡張予定

- [ ] サーバーマップビューワー（Dynmap風）
- [ ] プレイヤーインベントリ表示
- [ ] Discord連携
- [ ] バックアップ管理
- [ ] プラグイン管理

## 🐛 トラブルシューティング

### データベースエラー
```bash
# dataディレクトリがない場合
mkdir -p data uploads/screenshots
```

### ポートが使用中
```bash
# ポートを変更
PORT=8080 npm start
```

### WebSocketエラー
- ファイアウォール設定を確認
- HTTPSの場合はWSSを使用

## 📄 ライセンス

MIT License

## 🤝 貢献

プルリクエスト歓迎！

## 📮 サポート

問題が発生した場合は、Issueを作成してください。

---

**開発者**: AI Enhanced System
**バージョン**: 3.0.0 (Enhanced Edition)
**最終更新**: 2025-10-28
