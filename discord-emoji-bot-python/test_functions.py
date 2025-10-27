#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Botの機能をテストするスクリプト
Discord接続なしで主要機能をテスト
"""

import sys
import os
from pathlib import Path

# bot.pyから関数をインポート
sys.path.insert(0, os.path.dirname(__file__))
from bot import (
    sanitize_emoji_name, 
    validate_image, 
    extract_images_from_zip,
    SUPPORTED_FORMATS
)


def test_sanitize_emoji_name():
    """絵文字名のサニタイズテスト"""
    print("=" * 50)
    print("📝 絵文字名サニタイズテスト")
    print("=" * 50)
    
    test_cases = [
        ("happy.png", "happy"),
        ("sad face.png", "sad_face"),
        ("😀emoji.png", "_emoji"),
        ("test-emoji-123.png", "test_emoji_123"),
        ("a" * 50 + ".png", "a" * 32),  # 長すぎる名前
        ("_.png", None),  # 短すぎる名前
    ]
    
    for filename, expected in test_cases:
        result = sanitize_emoji_name(filename)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{filename}' -> '{result}' (期待: '{expected}')")
    
    print()


def test_validate_image():
    """画像検証テスト"""
    print("=" * 50)
    print("🖼️  画像検証テスト")
    print("=" * 50)
    
    test_dir = Path("test_images")
    
    if not test_dir.exists():
        print("❌ test_imagesディレクトリが見つかりません")
        return
    
    for image_file in test_dir.glob("*.png"):
        with open(image_file, 'rb') as f:
            image_data = f.read()
        
        is_valid, error_msg = validate_image(image_data, image_file.name)
        
        if is_valid:
            size_kb = len(image_data) / 1024
            print(f"✅ {image_file.name} - 有効 ({size_kb:.2f}KB)")
        else:
            print(f"❌ {image_file.name} - 無効: {error_msg}")
    
    print()


def test_extract_images_from_zip():
    """ZIP解凍テスト"""
    print("=" * 50)
    print("📦 ZIP解凍テスト")
    print("=" * 50)
    
    zip_file = Path("test_emojis.zip")
    
    if not zip_file.exists():
        print("❌ test_emojis.zipが見つかりません")
        return
    
    with open(zip_file, 'rb') as f:
        zip_data = f.read()
    
    try:
        images = extract_images_from_zip(zip_data)
        
        print(f"✅ {len(images)}個の画像を抽出しました")
        print()
        
        for emoji_name, image_data in images.items():
            size_kb = len(image_data) / 1024
            print(f"  📎 :{emoji_name}: ({size_kb:.2f}KB)")
        
    except Exception as e:
        print(f"❌ エラー: {e}")
    
    print()


def test_supported_formats():
    """サポートされる形式の表示"""
    print("=" * 50)
    print("🎨 サポートされる画像形式")
    print("=" * 50)
    
    print("以下の形式がサポートされています:")
    for fmt in sorted(SUPPORTED_FORMATS):
        print(f"  • {fmt.upper()}")
    
    print()


def main():
    """メイン関数"""
    print("\n🧪 Discord Emoji Bot - 機能テスト\n")
    
    # 各テストを実行
    test_supported_formats()
    test_sanitize_emoji_name()
    test_validate_image()
    test_extract_images_from_zip()
    
    print("=" * 50)
    print("✅ すべてのテストが完了しました")
    print("=" * 50)
    print()
    print("💡 実際にBotを起動するには:")
    print("   1. .envファイルにDISCORD_BOT_TOKENを設定")
    print("   2. python bot.py を実行")
    print("   3. DiscordにZIPファイルをアップロード")
    print()


if __name__ == "__main__":
    main()
