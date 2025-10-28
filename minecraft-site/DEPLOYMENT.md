# 🚀 Minecraft Server Website v3.0 - Deployment Guide

## ✅ デプロイ完了情報

**デプロイ日時**: 2025-10-28  
**バージョン**: 3.0.0  
**ステータス**: ✅ 稼働中

---

## 🌐 アクセスURL

### Cloudflare Tunnel (HTTPS - 推奨)
```
https://struck-focal-sides-lynn.trycloudflare.com
```

### 直接アクセス (HTTP)
```
http://106.73.68.66:3000
```

### 管理画面
```
https://struck-focal-sides-lynn.trycloudflare.com/admin
```

**管理者パスワード**: `admin123`

---

## 🎯 実装済み機能（全10機能）

### 1. ✅ リアルタイムプレイヤーリスト
- オンラインプレイヤー表示
- プレイヤーアバター表示（Crafatar統合）
- プレイ時間・最終ログイン表示

### 2. ✅ サーバー統計・グラフ
- Chart.js 4.5によるグラフ描画
- プレイヤー数推移グラフ（24時間）
- パフォーマンスグラフ（CPU/メモリ/TPS）

### 3. ✅ チャットログ表示
- リアルタイムチャット履歴（最大100件）
- タイムスタンプ付き表示
- プレイヤー/システムメッセージ識別

### 4. ✅ スクリーンショットギャラリー
- 画像アップロード（最大10MB）
- いいね機能
- タイトル・説明文付き表示
- レスポンシブグリッド

### 5. ✅ イベントカレンダー
- イベント作成・管理（管理者）
- イベント表示（公開ページ）
- イベントタイプ分類

### 6. ✅ プレイヤーランキング
- プレイ時間ランキング
- ブロック設置/破壊ランキング
- 移動距離ランキング
- トップ10表示

### 7. ✅ ブラウザ通知
- サーバーオンライン/オフライン通知
- イベント開始通知
- ブラウザネイティブ通知API

### 8. ✅ クイックコマンドパネル（管理者）
- 天気変更（晴れ/雨）
- 時間変更（昼/夜）
- モンスター削除
- プレイヤー全回復
- ゲームモード切替

### 9. ✅ パフォーマンス監視
- CPU使用率リアルタイム表示
- メモリ使用率リアルタイム表示
- TPS（Ticks Per Second）表示
- WebSocketによる3秒間隔更新

### 10. ✅ リアルタイムWebSocket通信
- 3秒間隔でステータス更新
- 双方向通信
- 自動再接続機能

---

## 📊 技術スタック

### バックエンド
- **Node.js 16+** - サーバー実行環境
- **Express 4.18** - Webフレームワーク
- **WebSocket (ws)** - リアルタイム通信
- **SQLite3 5.1** - データベース
- **Multer 2.0** - ファイルアップロード
- **express-session** - セッション管理

### フロントエンド
- **Chart.js 4.5** - グラフ描画
- **Particles.js** - パーティクルアニメーション
- **Notification API** - ブラウザ通知
- **Fetch API** - REST API通信
- **WebSocket** - リアルタイム更新

### インフラ
- **Cloudflare Tunnel** - HTTPS公開
- **Screen** - Minecraftサーバー管理
- **PM2 (オプション)** - プロセス管理

---

## 💾 データベース構造

**データベースファイル**: `data/minecraft.db`

### テーブル一覧

1. **server_stats** - サーバー統計
   - timestamp, online, player_count, max_players, uptime, cpu_usage, memory_usage, tps

2. **player_sessions** - プレイヤーセッション
   - id, username, join_time, leave_time, duration

3. **player_stats** - プレイヤー統計
   - username, total_playtime, blocks_placed, blocks_broken, distance_traveled, last_seen

4. **events** - イベント
   - id, title, description, event_date, event_type, created_at

5. **screenshots** - スクリーンショット
   - id, filename, title, description, uploader, likes, uploaded_at

6. **chat_logs** - チャットログ
   - id, username, message, message_type, timestamp

---

## 🔧 運用コマンド

### サーバー起動
```bash
cd /home/kbt0/webapp/minecraft-site
node server-enhanced.js
```

### バックグラウンド起動
```bash
cd /home/kbt0/webapp/minecraft-site
nohup node server-enhanced.js > server.log 2>&1 &
```

### PM2で起動（推奨）
```bash
pm2 start server-enhanced.js --name minecraft-web
pm2 save
pm2 startup
```

### Cloudflareトンネル起動
```bash
cd /home/kbt0/webapp/minecraft-site
cloudflared tunnel --url http://localhost:3000
```

### ログ確認
```bash
# サーバーログ
tail -f /home/kbt0/webapp/minecraft-site/server.log

# Cloudflareトンネルログ
tail -f /home/kbt0/webapp/minecraft-site/cloudflare-tunnel.log
```

### プロセス確認
```bash
# Webサーバー確認
ps aux | grep "node server-enhanced.js"

# Cloudflareトンネル確認
ps aux | grep cloudflared
```

### サーバー停止
```bash
# Webサーバー停止
pkill -f "node server-enhanced.js"

# Cloudflareトンネル停止
pkill -f "cloudflared tunnel"
```

---

## 📡 API エンドポイント

### 公開API（認証不要）

#### サーバー状態
- `GET /api/status` - サーバー状態
- `GET /api/players/online` - オンラインプレイヤー

#### 統計
- `GET /api/stats/server?hours=24` - サーバー統計
- `GET /api/stats/players?type=total_playtime&limit=10` - ランキング

#### コンテンツ
- `GET /api/chat/history?limit=50` - チャットログ
- `GET /api/events?limit=10` - イベント一覧
- `GET /api/screenshots?limit=20` - スクリーンショット一覧

### 管理API（要認証）

#### 認証
- `POST /api/login` - ログイン
- `POST /api/logout` - ログアウト
- `GET /api/auth/status` - 認証状態確認

#### サーバー制御
- `POST /api/server/start` - サーバー起動
- `POST /api/server/stop` - サーバー停止
- `POST /api/server/restart` - サーバー再起動
- `POST /api/server/command` - コマンド送信

#### コマンド
- `GET /api/commands/quick` - クイックコマンド一覧

#### イベント管理
- `POST /api/events` - イベント作成
- `DELETE /api/events/:id` - イベント削除

#### スクリーンショット
- `POST /api/screenshots/upload` - アップロード
- `POST /api/screenshots/:id/like` - いいね

#### ログ
- `GET /api/server/logs` - サーバーログ取得

---

## 🔐 セキュリティ

### 現在の設定
- **管理者パスワード**: `admin123` (環境変数で変更可能)
- **セッション有効期限**: 24時間
- **ファイルアップロード制限**: 10MB
- **許可ファイル形式**: JPEG, JPG, PNG, GIF

### パスワード変更方法
```bash
ADMIN_PASSWORD=your_secure_password node server-enhanced.js
```

### 本番環境推奨設定
```bash
# .env ファイル作成
echo "ADMIN_PASSWORD=強力なパスワード" > .env
echo "PORT=3000" >> .env
echo "SESSION_SECRET=ランダムな文字列" >> .env

# 起動
npm install dotenv
node -r dotenv/config server-enhanced.js
```

---

## 🗄️ バックアップ

### データベースバックアップ
```bash
# 手動バックアップ
cp data/minecraft.db data/minecraft.db.backup.$(date +%Y%m%d_%H%M%S)

# 自動バックアップ（cron）
0 3 * * * cd /home/kbt0/webapp/minecraft-site && cp data/minecraft.db data/minecraft.db.backup.$(date +\%Y\%m\%d)
```

### スクリーンショットバックアップ
```bash
tar -czf screenshots-backup-$(date +%Y%m%d).tar.gz uploads/screenshots/
```

---

## 🐛 トラブルシューティング

### サーバーが起動しない
```bash
# ポート使用確認
lsof -i :3000

# プロセス確認
ps aux | grep node

# ログ確認
tail -50 server.log
```

### データベースエラー
```bash
# データベースファイル確認
ls -la data/minecraft.db

# 権限確認
chmod 644 data/minecraft.db
chmod 755 data/

# データベース再初期化（注意：データ消失）
rm data/minecraft.db
# サーバー再起動で自動作成
```

### Cloudflareトンネルが接続できない
```bash
# トンネルログ確認
tail -50 cloudflare-tunnel.log

# トンネル再起動
pkill -f cloudflared
cloudflared tunnel --url http://localhost:3000
```

### WebSocketが接続できない
1. ブラウザのコンソールを確認
2. ファイアウォール設定を確認
3. Cloudflare Tunnel の状態を確認
4. サーバーログを確認

---

## 📈 監視・メトリクス

### リアルタイム監視項目
- サーバーオンライン状態
- プレイヤー数
- CPU使用率
- メモリ使用率
- TPS（Ticks Per Second）
- 稼働時間

### データベース統計
- 24時間プレイヤー数推移
- プレイヤーランキング
- チャットログ
- イベント履歴

---

## 🎯 今後の拡張予定

- [ ] Discord Webhook 連携
- [ ] 自動バックアップシステム
- [ ] Dynmap風マップビューワー
- [ ] プレイヤー詳細統計
- [ ] モバイルアプリ対応
- [ ] 多言語対応（英語、日本語）

---

## 📞 サポート

### GitHub Repository
https://github.com/K11420/discord-music-bot

### ドキュメント
- README.md - プロジェクト概要
- DEPLOYMENT.md - このファイル
- API.md - API詳細ドキュメント（予定）

---

## 📝 変更履歴

### v3.0.0 (2025-10-28)
- ✨ 全10機能実装完了
- 🚀 拡張版をデフォルトに設定
- 🌐 Cloudflare Tunnel 設定完了
- 📊 SQLite3 データベース統合
- 📸 スクリーンショットギャラリー追加
- 📅 イベントカレンダー追加
- 🏆 ランキングシステム追加
- 💬 チャットログ表示追加
- 🔔 ブラウザ通知機能追加
- ⚡ クイックコマンドパネル追加
- 📊 Chart.js グラフ統合

### v2.0.0 (2025-10-27)
- 🎨 デザイン刷新
- 📡 WebSocket リアルタイム通信実装
- 🔐 管理者認証システム追加
- 🎮 サーバー制御機能追加

### v1.0.0 (2025-10-26)
- 🎉 初回リリース
- 📱 基本的な公開ページ
- 📊 サーバー状態表示

---

**デプロイ担当**: Claude AI Assistant  
**最終更新**: 2025-10-28
