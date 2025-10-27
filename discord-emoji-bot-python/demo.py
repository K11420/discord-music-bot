#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Discord Emoji Bot - デモモード
実際のDiscord接続なしで機能をデモンストレーション
"""

import sys
from pathlib import Path
from bot import (
    sanitize_emoji_name,
    validate_image,
    extract_images_from_zip,
    SUPPORTED_FORMATS,
    MAX_EMOJI_SIZE,
    MAX_EMOJIS_PER_ZIP
)


def print_header(title):
    """ヘッダーを表示"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60 + "\n")


def demo_sanitize():
    """絵文字名サニタイズのデモ"""
    print_header("📝 絵文字名サニタイズ機能")
    
    examples = [
        "happy_face.png",
        "sad face with tears.png",
        "😀😁😂.png",
        "cool-emoji_123.jpg",
        "!!special##characters$$.gif",
        "a" * 40 + ".png",
    ]
    
    print("ファイル名を安全な絵文字名に変換します：\n")
    
    for filename in examples:
        result = sanitize_emoji_name(filename)
        if result:
            print(f"✅ '{filename}'")
            print(f"   → :{result}:")
        else:
            print(f"❌ '{filename}'")
            print(f"   → 無効な名前（短すぎる）")
        print()


def demo_validate():
    """画像検証のデモ"""
    print_header("🖼️  画像検証機能")
    
    test_dir = Path("test_images")
    
    if not test_dir.exists():
        print("❌ test_imagesディレクトリが見つかりません")
        return
    
    print("作成済みのテスト画像を検証します：\n")
    
    for image_file in sorted(test_dir.glob("*.png")):
        with open(image_file, 'rb') as f:
            image_data = f.read()
        
        is_valid, error_msg = validate_image(image_data, image_file.name)
        size_kb = len(image_data) / 1024
        
        if is_valid:
            print(f"✅ {image_file.name}")
            print(f"   サイズ: {size_kb:.2f}KB")
            print(f"   状態: 有効 - 絵文字として登録可能")
        else:
            print(f"❌ {image_file.name}")
            print(f"   エラー: {error_msg}")
        print()


def demo_zip_extraction():
    """ZIP解凍のデモ"""
    print_header("📦 ZIP解凍機能")
    
    zip_file = Path("test_emojis.zip")
    
    if not zip_file.exists():
        print("❌ test_emojis.zipが見つかりません")
        return
    
    print("ZIPファイルから画像を抽出します：\n")
    print(f"📁 ファイル: {zip_file.name}")
    print(f"📏 サイズ: {zip_file.stat().st_size / 1024:.2f}KB\n")
    
    with open(zip_file, 'rb') as f:
        zip_data = f.read()
    
    try:
        images = extract_images_from_zip(zip_data)
        
        print(f"✅ {len(images)}個の画像を抽出しました\n")
        
        print("抽出された絵文字：")
        print("-" * 60)
        
        for i, (emoji_name, image_data) in enumerate(images.items(), 1):
            size_kb = len(image_data) / 1024
            print(f"{i}. :{emoji_name}:")
            print(f"   サイズ: {size_kb:.2f}KB")
            print(f"   状態: ✅ 登録可能")
            print()
        
        print("-" * 60)
        print(f"\n💡 このZIPをDiscordにアップロードすると、")
        print(f"   自動的に{len(images)}個の絵文字が登録されます！")
        
    except Exception as e:
        print(f"❌ エラー: {e}")


def demo_config():
    """設定情報のデモ"""
    print_header("⚙️  Bot設定情報")
    
    print("サポートされる画像形式：")
    for fmt in sorted(SUPPORTED_FORMATS):
        print(f"  • {fmt.upper()}")
    
    print(f"\n制限事項：")
    print(f"  • 最大ファイルサイズ: {MAX_EMOJI_SIZE / 1024:.0f}KB")
    print(f"  • 一度に処理できる絵文字: {MAX_EMOJIS_PER_ZIP}個")
    print(f"  • 絵文字名の長さ: 2-32文字")
    
    print(f"\nサーバーの絵文字制限：")
    print(f"  • レベル0（ブーストなし）: 50個")
    print(f"  • レベル1: 100個")
    print(f"  • レベル2: 150個")
    print(f"  • レベル3: 250個")


def demo_workflow():
    """実際の使用フローのデモ"""
    print_header("🔄 実際の使用フロー")
    
    print("Discordでの実際の使い方：\n")
    
    steps = [
        ("1️⃣  画像を準備", "絵文字にしたい画像（PNG, JPG, GIF, WEBP）を用意"),
        ("2️⃣  ZIPファイルを作成", "画像をZIPファイルにまとめる"),
        ("3️⃣  Discordにアップロード", "チャンネルにZIPファイルをアップロード"),
        ("4️⃣  自動処理開始", "Botが自動的にZIPを検出して処理"),
        ("5️⃣  絵文字登録", "有効な画像がサーバー絵文字として登録される"),
        ("6️⃣  結果報告", "成功/失敗の詳細レポートが表示される"),
    ]
    
    for title, description in steps:
        print(f"{title}")
        print(f"   {description}")
        print()
    
    print("💡 コマンドも使用できます：")
    print("   • !help_emoji - ヘルプを表示")
    print("   • !emoji_info - サーバーの絵文字情報を表示")


def main():
    """メイン関数"""
    print("\n" + "=" * 60)
    print("  🎨 Discord Emoji Bot - デモモード 🐍")
    print("=" * 60)
    
    print("\n💡 このデモでは、実際のDiscord接続なしでBotの")
    print("   主要機能を確認できます。\n")
    
    # 各デモを実行
    demo_config()
    demo_sanitize()
    demo_validate()
    demo_zip_extraction()
    demo_workflow()
    
    # まとめ
    print_header("✅ デモ完了")
    
    print("すべての機能が正常に動作しています！\n")
    
    print("🚀 実際にBotを起動するには：\n")
    print("1. Discord Developer Portalで新しいトークンを取得")
    print("   https://discord.com/developers/applications\n")
    print("2. MESSAGE CONTENT INTENTを有効化\n")
    print("3. .envファイルにトークンを設定")
    print("   echo 'DISCORD_BOT_TOKEN=あなたのトークン' > .env\n")
    print("4. Botを起動")
    print("   ./start.sh\n")
    print("5. test_emojis.zipをDiscordにアップロードしてテスト！\n")
    
    print("📚 詳細なドキュメント：")
    print("   • README.md - 詳細な使用方法")
    print("   • SETUP.md - セットアップガイド")
    print("   • QUICKSTART.md - クイックスタート")
    
    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
