# Discord Emoji Bot (Python版) 🎨🐍

ZIPファイルに保存された画像ファイルをDiscordの絵文字として自動登録するPython製Botです。

## 機能 ✨

- 📦 ZIPファイルから画像を自動抽出
- 🖼️ PNG, JPG, GIF, WEBP形式をサポート
- ✅ 一括で複数の絵文字を登録
- 🔍 ファイルサイズと画像形式の自動検証（最大256KB）
- 🏷️ ファイル名から自動的に絵文字名を生成
- 🛡️ 権限チェックとエラーハンドリング
- 📊 詳細な処理結果レポート
- 💬 便利なコマンド機能

## 必要な環境 🔧

- Python 3.8以上
- pip (Pythonパッケージマネージャー)

## セットアップ 🚀

### 1. Bot の作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックしてアプリケーションを作成
3. 「Bot」セクションに移動し、Botを作成
4. 「TOKEN」をコピー（後で使用します）
5. 「Privileged Gateway Intents」で以下を有効化：
   - ✅ Message Content Intent
   - ✅ Server Members Intent（オプション）

### 2. Bot の招待

以下のURLでBotをサーバーに招待します（`CLIENT_ID`を自分のアプリケーションIDに置き換えてください）：

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1073741824&scope=bot
```

**必要な権限:**
- 絵文字の管理 (Manage Expressions)
- メッセージの送信
- ファイルの添付
- メッセージ履歴の読み取り

### 3. インストール

```bash
# プロジェクトディレクトリに移動
cd discord-emoji-bot-python

# 仮想環境を作成（推奨）
python -m venv venv

# 仮想環境を有効化
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してDISCORD_BOT_TOKENを設定
```

### 4. .envファイルの設定

`.env`ファイルを作成し、以下の内容を記述：

```env
DISCORD_BOT_TOKEN=あなたのBotトークンをここに入力
```

### 5. 起動

```bash
# Botを起動
python bot.py
```

起動すると以下のようなメッセージが表示されます：

```
✅ ログイン成功: YourBotName (ID: 123456789)
📊 3個のサーバーに接続中
🚀 Bot起動完了！ZIPファイルをアップロードして絵文字を登録できます。
```

## 使い方 📖

### 基本的な使い方

1. **ZIPファイルを準備**
   - 絵文字にしたい画像ファイル（PNG、JPG、GIF、WEBP）を用意
   - 画像をZIPファイルにまとめる

2. **ZIPファイルをアップロード**
   - Discordのチャンネルに、作成したZIPファイルをアップロード
   - Botが自動的に検出して処理を開始

3. **完了を待つ**
   - Botが画像を抽出し、絵文字として登録
   - 結果がメッセージで報告されます

### コマンド

Bot起動後、以下のコマンドが使用できます：

#### `!help_emoji` または `!emoji_help`
ヘルプメッセージを表示します。

```
!help_emoji
```

#### `!emoji_info`
サーバーの絵文字情報（現在の絵文字数、残りスロット数など）を表示します。

```
!emoji_info
```

### ZIPファイルの作成例

#### Windows:
```
画像を選択 → 右クリック → 送る → 圧縮(zip形式)フォルダー
```

#### Mac:
```
画像を選択 → 右クリック → "〇〇"を圧縮
```

#### Linux:
```bash
zip -r my_emojis.zip *.png *.jpg *.gif
```

#### Python (プログラム的に作成):
```python
import zipfile

with zipfile.ZipFile('emojis.zip', 'w') as zipf:
    zipf.write('happy.png')
    zipf.write('sad.png')
    zipf.write('angry.gif')
```

### ファイル構造の例

```
my_emojis.zip
├── happy_face.png
├── sad_face.png
├── angry_cat.gif
├── heart_emoji.jpg
└── thumbs_up.webp
```

上記のZIPファイルをアップロードすると、以下の絵文字が登録されます：
- `:happy_face:`
- `:sad_face:`
- `:angry_cat:`
- `:heart_emoji:`
- `:thumbs_up:`

## 注意事項 ⚠️

### ファイル制限

- **ファイルサイズ**: 各画像は256KB以下である必要があります
- **画像サイズ**: 最大4096x4096ピクセル（推奨: 128x128）
- **ファイル形式**: PNG, JPG, JPEG, GIF, WEBP
- **処理制限**: 一度に最大50個の絵文字を処理

### ファイル名のルール

- ファイル名（拡張子を除く）が絵文字名になります
- 使用できる文字: 英数字とアンダースコア（`a-z`, `A-Z`, `0-9`, `_`）
- 長さ: 2〜32文字
- その他の文字は自動的にアンダースコアに変換されます

**例:**
- `happy face.png` → `:happy_face:`
- `😀.png` → `_` （無効なため登録されません）
- `my-emoji-123.png` → `:my_emoji_123:`

### サーバーの絵文字制限

Discordサーバーのブーストレベルに応じて絵文字の上限が異なります：

| ブーストレベル | 最大絵文字数 |
|--------------|------------|
| レベル0（なし） | 50個 |
| レベル1 | 100個 |
| レベル2 | 150個 |
| レベル3 | 250個 |

### 必要な権限

- **Bot**: 「絵文字の管理」権限が必要
- **ユーザー**: ZIPをアップロードするユーザーも「絵文字の管理」権限が必要

## トラブルシューティング 🔧

### エラー: 「絵文字を管理する権限がありません」

→ サーバーの管理者に「絵文字の管理」権限を付与してもらってください

### エラー: 「サーバーの絵文字スロットが満杯です」

→ 以下のいずれかの対処を行ってください：
- サーバーブーストレベルを上げる
- 既存の絵文字を削除する
- `!emoji_info`コマンドで現在の状態を確認

### 画像が登録されない

以下を確認してください：
- ✅ 画像形式がPNG、JPG、GIF、またはWEBPであること
- ✅ ファイルサイズが256KB以下であること
- ✅ ファイル名が有効であること（2文字以上、英数字とアンダースコアのみ）
- ✅ 画像が破損していないこと
- ✅ ZIPファイルが正しく作成されていること

### Bot が反応しない

以下を確認してください：
- ✅ Botがオンラインであること
- ✅ 「Message Content Intent」が有効になっていること
- ✅ Botに必要な権限が付与されていること
- ✅ ZIPファイルが正しくアップロードされたこと
- ✅ `.env`ファイルにトークンが正しく設定されていること

### ログの確認

Botを起動したターミナルで処理のログを確認できます：

```
📦 ZIPファイルを受信: emojis.zip (from UserName)
🖼️  5個の画像を検出
✅ 絵文字登録成功: happy_face
✅ 絵文字登録成功: sad_face
...
```

## 技術スタック 💻

- **Python 3.8+** - プログラミング言語
- **discord.py 2.3+** - Discord Bot ライブラリ
- **Pillow** - 画像処理ライブラリ
- **python-dotenv** - 環境変数管理

## プロジェクト構造 📁

```
discord-emoji-bot-python/
├── bot.py              # メインのBotコード
├── requirements.txt    # Python依存関係
├── .env.example        # 環境変数のサンプル
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## コードの主要機能 🔍

### `sanitize_emoji_name(filename)`
ファイル名を絵文字名として使用可能な形式に変換します。

### `validate_image(image_data, filename)`
画像データを検証し、Discordの絵文字として使用可能かチェックします。

### `extract_images_from_zip(zip_data)`
ZIPファイルから画像を抽出し、絵文字名と画像データの辞書を返します。

### `register_emojis(guild, images, user)`
抽出した画像を実際にDiscordサーバーに絵文字として登録します。

## 開発者向け情報 👨‍💻

### デバッグモード

詳細なログを表示するには、`bot.py`の先頭に以下を追加：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### カスタマイズ

以下の定数を変更して動作をカスタマイズできます：

```python
MAX_EMOJI_SIZE = 256 * 1024  # 最大ファイルサイズ
MAX_EMOJIS_PER_ZIP = 50      # 一度に処理する最大数
SUPPORTED_FORMATS = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
```

### コマンドの追加

新しいコマンドを追加するには：

```python
@bot.command(name='my_command')
async def my_command(ctx):
    """新しいコマンドの説明"""
    await ctx.send("Hello!")
```

## セキュリティ 🔒

- `.env`ファイルは**絶対に**Gitにコミットしないでください
- Botトークンは秘密情報として厳重に管理してください
- 本番環境では適切な権限管理を行ってください

## ライセンス 📄

MIT License

## 貢献 🤝

プルリクエストを歓迎します！バグ報告や機能提案は Issue でお願いします。

改善案：
- アニメーション絵文字のサポート
- バッチ処理の最適化
- ウェブダッシュボードの追加
- 絵文字の一括削除機能

## よくある質問 (FAQ) ❓

### Q: GIFアニメーションは使えますか？
A: はい、Discord Nitroサーバーではアニメーション絵文字として登録されます。

### Q: 一度に100個の絵文字を登録できますか？
A: デフォルトでは一度に50個まで処理します。レート制限を避けるためです。

### Q: 既存の絵文字を上書きできますか？
A: 同名の絵文字がある場合、自動的に番号を付けて別の絵文字として登録されます。

### Q: Botを複数のサーバーで使えますか？
A: はい、招待すれば複数のサーバーで使用できます。

## サポート 💬

問題が発生した場合：
1. このREADMEのトラブルシューティングを確認
2. Botのログ（ターミナル出力）を確認
3. Discord.pyのドキュメントを参照: https://discordpy.readthedocs.io/

---

Made with ❤️ and 🐍 for Discord communities
