# Discord Emoji Bot 🎨

ZIPファイルに保存された画像ファイルをDiscordの絵文字として自動登録するBotです。

## 機能 ✨

- 📦 ZIPファイルから画像を自動抽出
- 🖼️ PNG, JPG, GIF形式をサポート
- ✅ 一括で複数の絵文字を登録
- 🔍 ファイルサイズの自動検証（最大256KB）
- 🏷️ ファイル名から自動的に絵文字名を生成
- 🛡️ 権限チェックとエラーハンドリング
- 📊 詳細な処理結果レポート

## セットアップ 🚀

### 1. 必要な環境

- Node.js 18.0.0以上
- npm または yarn

### 2. Bot の作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックしてアプリケーションを作成
3. 「Bot」セクションに移動し、Botを作成
4. 「TOKEN」をコピー
5. 「Privileged Gateway Intents」で以下を有効化：
   - Message Content Intent

### 3. Bot の招待

以下のURLでBotをサーバーに招待します（CLIENT_IDを置き換えてください）：

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1073741824&scope=bot
```

必要な権限:
- 絵文字の管理 (Manage Expressions)
- メッセージの送信
- ファイルの添付

### 4. インストール

```bash
# リポジトリをクローン
cd discord-emoji-bot

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してDISCORD_BOT_TOKENを設定
```

### 5. 起動

```bash
# 開発モード
npm run dev

# ビルド＆本番モード
npm run build
npm start
```

## 使い方 📖

### 基本的な使い方

1. 絵文字にしたい画像ファイル（PNG、JPG、GIF）をZIPファイルにまとめます
2. Discordのチャンネルに、作成したZIPファイルをアップロード
3. Botが自動的に処理して絵文字を登録します

### 注意事項 ⚠️

- **ファイルサイズ**: 各画像は256KB以下である必要があります
- **ファイル名**: ファイル名から拡張子を除いた部分が絵文字名になります
  - 使用できる文字: 英数字とアンダースコア（`a-z`, `A-Z`, `0-9`, `_`）
  - 最大32文字
  - その他の文字は自動的にアンダースコアに変換されます
- **サーバー制限**: サーバーの絵文字スロット数に応じて制限があります
  - レベル0（ブーストなし）: 50個
  - レベル1: 100個
  - レベル2: 150個
  - レベル3: 250個
- **権限**: 絵文字を登録するには「絵文字の管理」権限が必要です
- **処理制限**: 一度に最大50個の絵文字を処理します

### ZIPファイルの作成例

**Windows:**
```
右クリック → 送る → 圧縮(zip形式)フォルダー
```

**Mac:**
```
右クリック → "〇〇"を圧縮
```

**Linux:**
```bash
zip -r emojis.zip image1.png image2.png image3.gif
```

### ファイル構造の例

```
emojis.zip
├── happy.png
├── sad.png
├── angry.gif
└── love.jpg
```

上記のZIPファイルをアップロードすると、以下の絵文字が登録されます：
- `:happy:`
- `:sad:`
- `:angry:`
- `:love:`

## トラブルシューティング 🔧

### エラー: 「絵文字を管理する権限がありません」

→ サーバーの管理者に「絵文字の管理」権限を付与してもらってください

### エラー: 「サーバーの絵文字スロットが満杯です」

→ サーバーブーストレベルを上げるか、既存の絵文字を削除してください

### 画像が登録されない

以下を確認してください：
- 画像形式がPNG、JPG、またはGIFであること
- ファイルサイズが256KB以下であること
- ファイル名が有効であること（2文字以上、英数字とアンダースコアのみ）

### Bot が反応しない

以下を確認してください：
- Botがオンラインであること
- 「Message Content Intent」が有効になっていること
- Botに必要な権限が付与されていること

## 技術スタック 💻

- **TypeScript** - 型安全な開発
- **Discord.js v14** - Discord Bot フレームワーク
- **adm-zip** - ZIP解凍ライブラリ
- **dotenv** - 環境変数管理

## プロジェクト構造 📁

```
discord-emoji-bot/
├── src/
│   └── index.ts        # メインのBotコード
├── dist/               # ビルド出力先
├── package.json        # プロジェクト設定
├── tsconfig.json       # TypeScript設定
├── .env.example        # 環境変数のサンプル
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## ライセンス 📄

MIT License

## 貢献 🤝

プルリクエストを歓迎します！バグ報告や機能提案は Issue でお願いします。

## サポート 💬

問題が発生した場合は、以下を確認してください：
1. Node.jsのバージョンが18.0.0以上であること
2. 環境変数が正しく設定されていること
3. Botの権限が適切に設定されていること

---

Made with ❤️ for Discord communities
