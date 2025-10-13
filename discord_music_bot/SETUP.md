# セットアップガイド 🚀

このガイドでは、Discord Music Botの詳細なセットアップ手順を説明します。

## 📋 前提条件

- Python 3.8以上
- FFmpeg
- Discord開発者アカウント
- Git（オプション）

## 🛠️ ステップ1: システム要件の準備

### Python のインストール

**Windows:**
1. [Python公式サイト](https://www.python.org/downloads/)からダウンロード
2. インストール時に「Add Python to PATH」をチェック

**macOS:**
```bash
# Homebrewを使用
brew install python

# または公式サイトからダウンロード
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### FFmpeg のインストール

**Windows:**
1. [FFmpeg公式サイト](https://ffmpeg.org/download.html)からダウンロード
2. ZIPファイルを展開し、PATHに追加

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

## 🤖 ステップ2: Discord Bot の作成

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力して「Create」

### Bot の設定

1. 左メニューの「Bot」をクリック
2. 「Add Bot」をクリック（確認が表示される場合は「Yes, do it!」）
3. 「Token」セクションの「Copy」をクリック（後で使用）

### Bot の権限設定

1. 左メニューの「OAuth2」→「URL Generator」
2. 「Scopes」で「bot」と「applications.commands」を選択
3. 「Bot Permissions」で以下を選択：
   - 📨 **テキスト権限**
     - Send Messages
     - Embed Links
     - Attach Files
     - Read Message History
     - Use External Emojis
   - 🔊 **音声権限**
     - Connect
     - Speak
     - Use Voice Activity

4. 生成されたURLをコピーしてブラウザで開く
5. ボットを追加したいサーバーを選択

## 📦 ステップ3: プロジェクトのセットアップ

### ソースコードの取得

**Gitを使用する場合:**
```bash
git clone <your-repository-url>
cd discord_music_bot
```

**手動ダウンロードの場合:**
1. ソースコードをダウンロード
2. 任意のフォルダに展開

### 仮想環境の作成（推奨）

```bash
# 仮想環境を作成
python -m venv bot_env

# 仮想環境を有効化
# Windows
bot_env\Scripts\activate
# macOS/Linux
source bot_env/bin/activate
```

### 依存関係のインストール

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## ⚙️ ステップ4: 環境設定

### 環境変数ファイルの作成

```bash
# .env.exampleを.envにコピー
cp .env.example .env

# Windows
copy .env.example .env
```

### .env ファイルの編集

```env
# Discord Bot Token（必須）
DISCORD_TOKEN=your_discord_bot_token_here

# Spotify API credentials（オプション）
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# ログレベル（オプション）
LOG_LEVEL=INFO
```

### Spotify連携の設定（オプション）

Spotify のプレイリストや楽曲を再生したい場合：

1. [Spotify for Developers](https://developer.spotify.com/dashboard/)にアクセス
2. 「CREATE AN APP」をクリック
3. アプリ情報を入力して作成
4. 「Client ID」と「Client Secret」を.envファイルに設定

## 🚀 ステップ5: ボットの起動

### 設定の確認

```bash
# 実行スクリプトを使用（推奨）
python run.py

# または直接実行
python main.py
```

### 起動の確認

正常に起動すると以下のようなログが表示されます：

```
🎵 Discord Music Bot を起動しています...
✅ 環境設定の確認が完了しました
✅ FFmpegが見つかりました
🐍 Python 3.11.0
🤖 discord.py 2.3.2
🚀 ボットを起動中...
[2024-10-13 12:00:00] [INFO    ] music: Logged in as YourBotName
[2024-10-13 12:00:00] [INFO    ] music: Bot ID: 123456789012345678
[2024-10-13 12:00:00] [INFO    ] music: Connected to 1 servers
[2024-10-13 12:00:00] [INFO    ] music: All cogs loaded and slash commands synced
```

## 🧪 ステップ6: 動作テスト

1. Discordサーバーでボイスチャンネルに参加
2. `/help` コマンドでヘルプを表示
3. `/ping` コマンドで応答速度を確認
4. `/play` コマンドで音楽を再生テスト

## 🐳 Docker を使用した実行（オプション）

### Docker版の起動

```bash
# イメージをビルド
docker-compose build

# バックグラウンドで実行
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### Docker版の停止

```bash
docker-compose down
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

**1. モジュールが見つからないエラー**
```bash
# 仮想環境が有効化されているか確認
which python
# または
where python

# 依存関係を再インストール
pip install -r requirements.txt
```

**2. FFmpeg関連のエラー**
```bash
# FFmpegがインストールされているか確認
ffmpeg -version

# パスが通っているか確認
which ffmpeg  # macOS/Linux
where ffmpeg  # Windows
```

**3. Discord Token エラー**
- .envファイルのDISCORD_TOKENが正しく設定されているか確認
- Discord Developer PortalでTokenを再生成

**4. 権限エラー**
- ボットがサーバーに参加済みか確認
- 必要な権限が付与されているか確認
- ボイスチャンネルの権限設定を確認

**5. 音楽が再生されない**
- ボイスチャンネルに参加してからコマンド実行
- 地域制限のある動画ではないか確認
- URLが有効か確認

## 📝 運用時の注意事項

### セキュリティ

- .envファイルは絶対に公開しない
- BotのTokenは定期的に再生成する
- プライベートサーバーでの使用を推奨

### パフォーマンス

- 同時接続数に注意（1つのインスタンスあたり推奨最大10サーバー）
- 長時間の連続稼働時はメモリ使用量を監視
- 定期的な再起動を検討

### ログ管理

```bash
# ログファイルの場所
./logs/bot.log

# ログローテーション（手動）
mv logs/bot.log logs/bot.log.old
```

## 🆘 サポート

問題が解決しない場合：

1. [GitHub Issues](your-repo-url/issues)で問題を報告
2. ログファイルの内容を添付
3. 実行環境の情報を記載（OS, Pythonバージョンなど）

## 📚 参考リンク

- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

---

このガイドに従って正常にセットアップできれば、Discord Music Botが動作します！