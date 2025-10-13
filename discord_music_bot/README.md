# Discord Music Bot 🎵

高機能なDiscord音楽ボットです。YouTube、ニコニコ動画、Spotify、Discordファイルの再生に対応し、豊富な操作機能を提供します。

## 🌟 特徴

- **多彩な音源対応**: YouTube、ニコニコ動画、SoundCloud、Spotify、Discordファイル
- **インタラクティブ操作**: ボタンによる直感的な音楽制御
- **高度なキューシステム**: シャッフル、ループ、前の曲に戻る機能
- **検索機能**: YouTubeでの楽曲検索
- **アラーム機能**: 指定時間後の自動再生
- **プログレスバー**: 視覚的な再生状況表示
- **多言語対応**: 日本語インターフェース

## 🎛️ コマンド一覧

### 基本的な再生
- `/play <URL>` - YouTubeやその他のサイトから音楽を再生
- `/playfile <ファイル>` - アップロードしたファイルを再生
- `/search <キーワード>` - YouTubeで検索して再生

### 再生制御
- `/pause` - 一時停止
- `/resume` - 再開
- `/skip` - 次の曲にスキップ
- `/stop` - 再生停止・ボイスチャンネルから退出
- `/volume <値>` - ボリューム調整（0.0-2.0）

### キュー管理
- `/queue` - 再生待ちの曲一覧を表示
- `/clear` - キューをクリア
- `/nowplaying` - 現在再生中の曲情報を表示

### 便利機能
- `/alarm <秒数> <URL>` - 指定時間後に音楽でアラーム
- `/help` - ヘルプメッセージを表示
- `/info` - ボットの情報を表示
- `/ping` - ボットの応答速度を確認

## 🎮 ボタン操作

再生中は以下のボタンで操作できます：

**上段**
- ⏪ 10秒戻る
- ⏸️/▶️ 一時停止/再開
- ⏩ 10秒進む
- 🔊+ ボリューム上げる
- 🔄 ループ切り替え

**下段**
- ⏮️ 前の曲
- ⏹️ 停止
- ⏭️ 次の曲
- 🔊- ボリューム下げる
- 🔀 シャッフル切り替え

## 🚀 セットアップ方法

### 1. 必要な要件

- Python 3.8以上
- FFmpeg
- Discord Bot Token

### 2. インストール

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd discord_music_bot

# 依存関係をインストール
pip install -r requirements.txt

# FFmpegをインストール（システムによって異なります）
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# macOS (Homebrew)
brew install ffmpeg

# Windows
# https://ffmpeg.org/download.html からダウンロード
```

### 3. 環境変数の設定

`.env.example`を`.env`にコピーして編集してください：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# Discord Bot Token（必須）
DISCORD_TOKEN=your_discord_bot_token_here

# Spotify API credentials（オプション）
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 4. Discord Bot の作成

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 「New Application」をクリック
3. Bot名を入力して「Create」
4. 左メニューの「Bot」をクリック
5. 「Add Bot」をクリック
6. 「Token」をコピーして`.env`ファイルに設定

### 5. Bot の権限設定

Bot に以下の権限を付与してください：

**一般的な権限**
- メッセージを送信
- 埋め込みリンク
- ファイルを添付
- メッセージ履歴を読む
- 外部の絵文字を使用する

**音声権限**
- 接続
- 発言
- 音声検出を使用

### 6. 実行

```bash
python main.py
```

## 🎯 サポートサイト・形式

### 音楽サイト
- YouTube
- ニコニコ動画
- SoundCloud
- Spotify（要API設定）
- その他 yt-dlp 対応サイト

### ファイル形式
- MP3, MP4, WAV, M4A, WebM, OGG, MOV, AVI

## 🔧 詳細設定

### Spotify 連携設定

1. [Spotify for Developers](https://developer.spotify.com/)にアクセス
2. アプリケーションを作成
3. Client IDとClient Secretを`.env`に設定

### カスタマイズ

- `utils/func.py`: ユーティリティ関数
- `objects/`: データ構造定義
- `source/`: 音声ソース処理
- `cogs/`: コマンド定義

## 🚨 注意事項

- ボットの使用は各サービスの利用規約に従ってください
- 24時間稼働させる場合は適切なサーバー環境を用意してください
- 音楽の著作権に注意してください
- プライベートサーバーでの使用を推奨します

## 🐛 トラブルシューティング

### よくある問題

**「権限が足りません」エラー**
- ボットがボイスチャンネルに接続・発言する権限があるか確認
- テキストチャンネルにメッセージ送信権限があるか確認

**「再生できません」エラー**
- FFmpegが正しくインストールされているか確認
- URLが有効で、地域制限がないか確認

**「検索結果が見つかりません」**
- インターネット接続を確認
- キーワードを変更して再試行

### ログの確認

```bash
# 詳細なログを表示
python main.py
```

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します！

## 📞 サポート

問題が発生した場合は、GitHubのIssuesページでお知らせください。

---

**開発者**: あなたの名前  
**バージョン**: 1.0.0  
**最終更新**: 2024年10月