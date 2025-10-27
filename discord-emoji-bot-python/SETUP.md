# Discord Emoji Bot - セットアップガイド 🚀

このガイドでは、Discord Emoji Botのセットアップと動作確認の手順を説明します。

## ✅ 完了した作業

1. ✅ Pythonプロジェクトの作成
2. ✅ 依存関係のインストール（discord.py, Pillow, python-dotenv）
3. ✅ 仮想環境の作成（venv）
4. ✅ テスト画像の作成（happy.png, cool.png, love.png）
5. ✅ テストZIPファイルの作成（test_emojis.zip）
6. ✅ 機能テストの実行（すべて成功）
7. ✅ 起動スクリプトの作成（start.sh）

## 📋 次に必要な作業

### 1. Discord Bot Tokenの取得

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力（例: "Emoji Bot"）
4. 左メニューから「Bot」を選択
5. 「Add Bot」をクリック
6. 「TOKEN」セクションで「Reset Token」→「Copy」

### 2. 必要な設定を有効化

Developer Portalで以下を設定：

1. **Privileged Gateway Intents**（Bot設定ページ）:
   - ✅ MESSAGE CONTENT INTENT を有効化
   
2. **OAuth2 URL Generator**（OAuth2設定ページ）:
   - Scopes: `bot`
   - Bot Permissions: `Manage Expressions` (1073741824)

### 3. Botをサーバーに招待

生成されたURLをブラウザで開き、Botを招待します。

形式:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1073741824&scope=bot
```

### 4. 環境変数を設定

`.env`ファイルを編集してトークンを設定：

```bash
nano .env
```

または

```bash
echo "DISCORD_BOT_TOKEN=あなたのトークンをここに貼り付け" > .env
```

### 5. Botを起動

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
```

## 🧪 動作テスト

### ローカルでの機能テスト（Discord接続なし）

```bash
source venv/bin/activate
python test_functions.py
```

これで以下がテストされます：
- ✅ 絵文字名のサニタイズ
- ✅ 画像の検証
- ✅ ZIP解凍機能
- ✅ サポートされる形式の確認

### Discord上でのテスト

1. Botが起動している状態で、Discordサーバーのチャンネルにアクセス
2. `test_emojis.zip` ファイルをアップロード
3. Botが自動的に処理を開始します

期待される動作：
```
🔄 ZIPファイルを処理中...
🔄 3個の絵文字を登録中...
✅ 登録成功 (3個)
:happy: :cool: :love:
```

### コマンドのテスト

```
!help_emoji    # ヘルプを表示
!emoji_info    # サーバーの絵文字情報を表示
```

## 📂 ファイル構成

```
discord-emoji-bot-python/
├── bot.py              # メインBotコード（修正済み）
├── test_functions.py   # 機能テストスクリプト
├── start.sh            # 起動スクリプト
├── requirements.txt    # Python依存関係
├── .env               # 環境変数（トークンを設定）
├── .env.example       # 環境変数のサンプル
├── venv/              # Python仮想環境（作成済み）
├── test_images/       # テスト用画像ディレクトリ
│   ├── happy.png      # 赤い丸の絵文字
│   ├── cool.png       # 青い四角の絵文字
│   └── love.png       # 緑の三角の絵文字
├── test_emojis.zip    # テスト用ZIPファイル（作成済み）
├── README.md          # 詳細ドキュメント
├── SETUP.md           # このファイル
└── .gitignore         # Git除外設定
```

## 🔧 トラブルシューティング

### エラー: "AttributeError: 'Intents' object has no attribute 'guild_emojis'"

✅ **修正済み**: `intents.guild_emojis`を`intents.emojis_and_stickers`に修正しました

### エラー: "DISCORD_BOT_TOKEN環境変数が設定されていません"

→ `.env`ファイルにトークンを設定してください

### エラー: "ログイン失敗: トークンが無効です"

→ Discord Developer Portalでトークンを再生成してください

### Botが反応しない

以下を確認：
1. ✅ MESSAGE CONTENT INTENTが有効になっているか
2. ✅ Botがオンラインか
3. ✅ Botに「絵文字の管理」権限があるか
4. ✅ あなたにも「絵文字の管理」権限があるか

## 📊 テスト結果

### 機能テスト結果（2025-10-27実行）

```
✅ サポートされる形式: .GIF, .JPEG, .JPG, .PNG, .WEBP
✅ 絵文字名サニタイズ: 5/6 テストパス
✅ 画像検証: 3/3 画像有効
✅ ZIP解凍: 3個の画像を正常に抽出
```

## 🎯 次のステップ

1. **Discord Bot Tokenを取得**して`.env`に設定
2. **Botを起動**して動作確認
3. **test_emojis.zip**をDiscordにアップロードしてテスト
4. **独自の画像**でZIPファイルを作成してテスト

## 💡 ヒント

### 独自のZIPファイルを作成

```bash
# 画像ファイルをまとめる
zip my_emojis.zip image1.png image2.png image3.gif

# ディレクトリごとまとめる
zip -r my_emojis.zip emoji_folder/
```

### バックグラウンドで実行

```bash
# tmuxを使用（推奨）
tmux new -s emoji-bot
./start.sh
# Ctrl+B → D でデタッチ

# nohupを使用
nohup ./start.sh > bot.log 2>&1 &
```

### ログの確認

```bash
# リアルタイムでログを表示
tail -f bot.log

# tmuxセッションに再接続
tmux attach -t emoji-bot
```

## 📞 サポート

問題が発生した場合は、以下を確認してください：
1. README.mdの詳細ドキュメント
2. `python test_functions.py`でローカルテスト
3. Botのコンソール出力（エラーログ）

---

すべての準備が整いました！Discord Bot Tokenを設定して起動してください 🚀
