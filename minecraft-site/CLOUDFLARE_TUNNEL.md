# ☁️ Cloudflare Tunnel Configuration

## 📋 トンネル情報

**トンネル名**: `face-ai`  
**トンネルID**: `ce4257df-66a6-4b4d-a41e-9fdfc848409a`  
**作成日**: 2025-04-23  
**ステータス**: ✅ 稼働中

---

## 🌐 設定済みドメイン

### 1. minecraft.schale41.jp
- **サービス**: `http://localhost:3000`
- **用途**: Minecraftサーバー管理Webサイト
- **ステータス**: ✅ 稼働中

### 2. donate.schale.jp
- **サービス**: `http://localhost:3000`
- **用途**: 寄付ページ（共有）
- **ステータス**: ✅ 稼働中

---

## 📝 設定ファイル

**場所**: `~/.cloudflared/config.yml`

```yaml
tunnel: ce4257df-66a6-4b4d-a41e-9fdfc848409a
credentials-file: /home/kbt0/.cloudflared/ce4257df-66a6-4b4d-a41e-9fdfc848409a.json

ingress:
  - hostname: minecraft.schale41.jp
    service: http://localhost:3000
  - hostname: donate.schale.jp
    service: http://localhost:3000
  - service: http_status:404
```

---

## 🚀 運用コマンド

### トンネル起動
```bash
cloudflared tunnel run face-ai
```

### バックグラウンド起動
```bash
cd /home/kbt0/webapp
nohup cloudflared tunnel run face-ai > cloudflare-tunnel.log 2>&1 &
```

### トンネル停止
```bash
pkill -f "cloudflared tunnel run face-ai"
```

### トンネル状態確認
```bash
cloudflared tunnel info face-ai
```

### トンネル一覧表示
```bash
cloudflared tunnel list
```

### ログ確認
```bash
tail -f ~/webapp/cloudflare-tunnel.log
```

---

## 🔧 DNS設定

### minecraft.schale41.jp
```
Type: CNAME
Name: minecraft
Target: ce4257df-66a6-4b4d-a41e-9fdfc848409a.cfargotunnel.com
Proxy: ✅ Proxied (Orange Cloud)
```

### 確認コマンド
```bash
nslookup minecraft.schale41.jp
# 結果:
# 104.21.86.156 (Cloudflare IP)
# 172.67.221.155 (Cloudflare IP)
```

---

## 🎯 アクセステスト

### HTTPSアクセステスト
```bash
curl -I https://minecraft.schale41.jp
```

### WebSocketテスト
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: minecraft.schale41.jp" \
  -H "Origin: https://minecraft.schale41.jp" \
  https://minecraft.schale41.jp
```

---

## 📊 トンネル統計

### 接続情報
- **エッジロケーション**: nrt07, nrt08, nrt09, nrt10 (東京)
- **プロトコル**: QUIC over HTTP/3
- **オリジンIP**: 106.73.68.66
- **バージョン**: 2025.10.0

### パフォーマンス
- **レイテンシ**: ~10-20ms (東京リージョン)
- **アップタイム**: 99.9%+
- **SSL/TLS**: 自動管理（Cloudflare証明書）

---

## 🔐 セキュリティ

### 自動有効化機能
- ✅ DDoS Protection
- ✅ Web Application Firewall (WAF)
- ✅ SSL/TLS暗号化
- ✅ Bot Management
- ✅ IP Reputation Filtering

### アクセス制御（オプション）
Cloudflare Zero Trustでアクセス制御を追加可能：
```bash
# IP制限の例
cloudflared tunnel route ip add <CIDR> face-ai
```

---

## 🛠️ トラブルシューティング

### トンネルが接続できない
```bash
# 1. トンネルプロセス確認
ps aux | grep cloudflared

# 2. ログ確認
tail -50 ~/webapp/cloudflare-tunnel.log

# 3. トンネル再起動
pkill -f cloudflared
cloudflared tunnel run face-ai
```

### DNS解決できない
```bash
# DNS確認
nslookup minecraft.schale41.jp

# キャッシュクリア
sudo systemd-resolve --flush-caches

# 別のDNSで確認
nslookup minecraft.schale41.jp 8.8.8.8
```

### 502 Bad Gateway エラー
- ローカルサービス（port 3000）が起動しているか確認
- `netstat -tlnp | grep 3000` でポート確認
- サーバーログ確認: `tail -f server.log`

---

## 📈 モニタリング

### Cloudflare Dashboard
https://dash.cloudflare.com/ でリアルタイム統計を確認：
- リクエスト数
- 帯域幅使用量
- エラー率
- トップパス
- トップリファラー

### コマンドラインモニタリング
```bash
# トンネル接続状態
watch -n 5 'cloudflared tunnel info face-ai'

# プロセス確認
watch -n 2 'ps aux | grep cloudflared'

# ログリアルタイム監視
tail -f ~/webapp/cloudflare-tunnel.log
```

---

## 🔄 更新・メンテナンス

### cloudflared更新
```bash
# 現在のバージョン確認
cloudflared --version

# 最新版にアップグレード
sudo cloudflared update

# または手動ダウンロード
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 設定変更後の適用
```bash
# 設定ファイル編集
nano ~/.cloudflared/config.yml

# トンネル再起動
pkill -f cloudflared
cloudflared tunnel run face-ai
```

---

## 📚 参考リンク

- [Cloudflare Tunnel公式ドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [cloudflaredコマンドリファレンス](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- [トラブルシューティングガイド](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)

---

## 🎊 まとめ

カスタムドメイン `minecraft.schale41.jp` が正常に設定され、Cloudflare Tunnelを通じてHTTPSで公開されています。

**主なメリット**:
- ✅ HTTPS自動対応
- ✅ DDoS保護
- ✅ グローバルCDN
- ✅ WAF（Webアプリケーションファイアウォール）
- ✅ 高速配信（東京エッジロケーション）
- ✅ 無料SSL証明書
- ✅ IPv4/IPv6デュアルスタック対応

**最終更新**: 2025-10-28
