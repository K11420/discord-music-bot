#!/bin/bash
# Discord Emoji Bot 起動スクリプト

echo "🤖 Discord Emoji Bot 起動中..."
echo ""

# 仮想環境があるか確認
if [ ! -d "venv" ]; then
    echo "❌ 仮想環境が見つかりません"
    echo "   以下のコマンドで作成してください:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# .envファイルがあるか確認
if [ ! -f ".env" ]; then
    echo "❌ .envファイルが見つかりません"
    echo "   .env.exampleをコピーして.envを作成してください:"
    echo "   cp .env.example .env"
    echo "   その後、.envファイルにDISCORD_BOT_TOKENを設定してください"
    exit 1
fi

# トークンが設定されているか確認
if ! grep -q "DISCORD_BOT_TOKEN=." .env; then
    echo "❌ DISCORD_BOT_TOKENが設定されていません"
    echo "   .envファイルを編集してトークンを設定してください"
    exit 1
fi

echo "✅ 環境チェック完了"
echo ""
echo "📦 Botを起動します..."
echo "   Ctrl+C で停止できます"
echo ""
echo "---------------------------------------------------"

# 仮想環境を有効化してBotを起動
source venv/bin/activate
python bot.py
