# Discord Emoji Bot - クイックスタートガイド 🚀

## 🔴 トークンエラーが発生した場合

提供されたトークンでログインに失敗しました：
```
❌ ログイン失敗: トークンが無効です
```

### 原因
- トークンが期限切れ
- トークンが無効化された
- トークンの形式が正しくない

## 📋 新しいトークンの取得方法

### 1. Discord Developer Portalにアクセス

https://discord.com/developers/applications

### 2. アプリケーションを選択または作成

- 既存のアプリケーションがある場合: クリックして選択
- 新しく作成する場合: 「New Application」ボタンをクリック

### 3. Botセクションに移動

左側のメニューから「Bot」を選択

### 4. トークンをリセット

- 「Reset Token」ボタンをクリック
- 確認ダイアログで「Yes, do it!」をクリック
- 新しいトークンが表示されるので、**すぐにコピー**（一度しか表示されません）

### 5. 必須設定を確認

同じBotページで以下を確認・有効化：

#### Privileged Gateway Intents
- ✅ **MESSAGE CONTENT INTENT** を有効化（必須）
- ✅ GUILDS（デフォルトで有効）
- ✅ GUILD_EMOJIS_AND_STICKERS（デフォルトで有効）

**重要**: MESSAGE CONTENT INTENTを有効化しないと、Botがメッセージを読めません！

### 6. Bot権限の確認

「OAuth2」→「URL Generator」で以下を選択：

**SCOPES:**
- ✅ bot

**BOT PERMISSIONS:**
- ✅ Manage Expressions（絵文字の管理） - 必須
- ✅ Send Messages
- ✅ Attach Files
- ✅ Read Message History

最下部に生成されたURLをコピーして、ブラウザで開いてBotを招待します。

### 7. トークンを設定

新しく取得したトークンを`.env`ファイルに設定：

```bash
cd /home/kbt0/webapp/discord-emoji-bot-python

# 方法1: エディタで編集
nano .env

# 方法2: コマンドで直接設定
echo "DISCORD_BOT_TOKEN=新しいトークンをここに貼り付け" > .env
```

### 8. Botを起動

```bash
# 起動スクリプトを使用
./start.sh

# または直接起動
source venv/bin/activate
python bot.py
```

成功すると以下のように表示されます：

```
✅ ログイン成功: YourBotName (ID: 123456789)
📊 1個のサーバーに接続中
🚀 Bot起動完了！ZIPファイルをアップロードして絵文字を登録できます。
--------------------------------------------------
```

## 🧪 動作確認

### 1. Discordでコマンドをテスト

Botが参加しているサーバーのチャンネルで：

```
!help_emoji
```

ヘルプメッセージが表示されればOK！

### 2. 絵文字情報を確認

```
!emoji_info
```

サーバーの現在の絵文字数と残りスロット数が表示されます。

### 3. ZIPファイルをアップロード

テスト用のZIPファイルをアップロード：

```bash
# プロジェクトディレクトリに test_emojis.zip があります
# このファイルをDiscordチャンネルにドラッグ&ドロップ
```

Botが自動的に処理して、3つの絵文字（:happy:, :cool:, :love:）を登録します！

## 🔧 トラブルシューティング

### エラー: "Privileged intent provided is not enabled or whitelisted"

→ Discord Developer PortalでMESSAGE CONTENT INTENTを有効化してください

### エラー: "Missing Permissions"

→ Botに「絵文字の管理」権限が付与されているか確認してください

### Botがオフラインのまま

1. トークンが正しいか確認
2. インターネット接続を確認
3. Botのログを確認（コンソール出力）

### ZIPファイルに反応しない

1. MESSAGE CONTENT INTENTが有効か確認
2. Botがオンラインか確認
3. ZIPファイルが正しい形式か確認（.zip拡張子）
4. 画像が有効な形式か確認（PNG, JPG, GIF, WEBP）

## 📊 現在の状態

```
✅ プロジェクトセットアップ完了
✅ 依存関係インストール済み
✅ テスト画像・ZIP作成済み
✅ 機能テスト実行済み（すべて成功）
⚠️  トークン設定が必要
⚠️  MESSAGE CONTENT INTENT有効化が必要
```

## 🎯 次のステップ

1. **新しいトークンを取得**（上記手順を参照）
2. **MESSAGE CONTENT INTENTを有効化**
3. **.envファイルにトークンを設定**
4. **Botを起動**
5. **Discordでテスト**

## 💡 バックグラウンド実行

Botをバックグラウンドで常時実行する場合：

### tmuxを使用（推奨）

```bash
# 新しいセッションを作成
tmux new -s emoji-bot

# Botを起動
cd /home/kbt0/webapp/discord-emoji-bot-python
./start.sh

# デタッチ（Botは動き続ける）
# Ctrl+B を押してから D を押す

# 再接続する場合
tmux attach -t emoji-bot
```

### nohupを使用

```bash
cd /home/kbt0/webapp/discord-emoji-bot-python
nohup ./start.sh > bot.log 2>&1 &

# ログを確認
tail -f bot.log
```

### systemdサービスとして実行

より本格的に運用する場合はsystemdサービスを作成することもできます。

## 📞 サポート

- 詳細なドキュメント: `README.md`
- セットアップガイド: `SETUP.md`
- オフラインテスト: `python test_functions.py`

---

すべての準備は整っています！新しいトークンを設定して起動してください 🚀
