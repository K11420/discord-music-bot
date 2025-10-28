#!/bin/bash

echo "🧪 通知テストを実行 + サーバーログ確認"
echo "=========================================="
echo ""

# テストイベントを作成
echo "📝 ステップ1: テストイベントを作成..."
node test-ios-notification.js | grep -A 3 "イベント作成成功"

echo ""
echo "⏳ 2秒待機..."
sleep 2

echo ""
echo "📊 ステップ2: サーバープロセスのログを確認..."
echo ""

# サーバープロセスIDを取得
PID=$(ps aux | grep "node.*server-enhanced" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "❌ サーバープロセスが見つかりません"
    exit 1
fi

echo "✅ サーバープロセスID: $PID"
echo ""
echo "📢 Broadcasting ログを確認:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 最近のBroadcastingログを表示（stderrをチェック）
if [ -f "/proc/$PID/fd/2" ]; then
    tail -20 "/proc/$PID/fd/2" 2>/dev/null | grep -i "broadcast" || echo "⚠️  Broadcastログが見つかりません"
else
    echo "⚠️  プロセスのstderrにアクセスできません"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 解釈:"
echo "   - Broadcasting to N clients: Nがクライアント数"
echo "   - N = 0: ブラウザでサイトを開いているユーザーがいない"
echo "   - N ≥ 1: ブラウザでサイトを開いているユーザーがいる"
echo ""
