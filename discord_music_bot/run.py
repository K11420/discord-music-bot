#!/usr/bin/env python3
"""
Discord Music Bot 実行スクリプト

このスクリプトは開発環境とプロダクション環境の両方で使用できます。
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    import discord
    from discord.ext import commands
    import dotenv
except ImportError as e:
    print(f"必要なライブラリがインストールされていません: {e}")
    print("以下のコマンドでインストールしてください:")
    print("pip install -r requirements.txt")
    sys.exit(1)


def setup_logging():
    """ログ設定を初期化"""
    # ログディレクトリを作成
    log_dir = project_root / "logs"
    log_dir.mkdir(exist_ok=True)
    
    # ログレベルの設定
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # ログフォーマット
    log_format = "[{asctime}] [{levelname:<8}] {name}: {message}"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # ルートロガーの設定
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format=log_format,
        style="{",
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(
                log_dir / "bot.log",
                encoding="utf-8",
                mode="a"
            )
        ]
    )
    
    # discord.pyのログレベルを調整
    logging.getLogger("discord").setLevel(logging.WARNING)
    logging.getLogger("discord.http").setLevel(logging.WARNING)


def check_environment():
    """環境設定をチェック"""
    env_file = project_root / ".env"
    
    if not env_file.exists():
        print("❌ .envファイルが見つかりません。")
        print("📝 .env.exampleをコピーして.envファイルを作成してください。")
        return False
    
    # 環境変数を読み込み
    dotenv.load_dotenv(env_file)
    
    # 必須の環境変数をチェック
    discord_token = os.getenv("DISCORD_TOKEN")
    if not discord_token:
        print("❌ DISCORD_TOKENが.envファイルに設定されていません。")
        return False
    
    return True


def check_ffmpeg():
    """FFmpegの存在をチェック"""
    import shutil
    
    if not shutil.which("ffmpeg"):
        print("⚠️  FFmpegが見つかりません。")
        print("📦 音声再生には FFmpeg が必要です。")
        print("🔗 インストール方法: https://ffmpeg.org/download.html")
        return False
    
    return True


async def run_bot():
    """ボットを実行"""
    from main import bot
    
    try:
        await bot.start(os.getenv("DISCORD_TOKEN"))
    except discord.LoginFailure:
        logging.error("❌ 無効なDiscordトークンです。")
        logging.error("🔑 .envファイルのDISCORD_TOKENを確認してください。")
    except Exception as e:
        logging.error(f"❌ ボット実行中にエラーが発生しました: {e}")
        raise


def main():
    """メイン関数"""
    print("🎵 Discord Music Bot を起動しています...")
    
    # ログ設定
    setup_logging()
    logger = logging.getLogger("music_bot")
    
    # 環境チェック
    if not check_environment():
        sys.exit(1)
    
    logger.info("✅ 環境設定の確認が完了しました")
    
    # FFmpegチェック
    if not check_ffmpeg():
        logger.warning("⚠️  FFmpegが見つかりません（警告）")
    else:
        logger.info("✅ FFmpegが見つかりました")
    
    # Pythonバージョンチェック
    if sys.version_info < (3, 8):
        logger.error("❌ Python 3.8以上が必要です")
        sys.exit(1)
    
    logger.info(f"🐍 Python {sys.version}")
    logger.info(f"🤖 discord.py {discord.__version__}")
    
    # Windowsでのイベントループ設定
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        logger.info("🪟 Windows用のイベントループポリシーを設定しました")
    
    # ボット実行
    try:
        logger.info("🚀 ボットを起動中...")
        asyncio.run(run_bot())
    except KeyboardInterrupt:
        logger.info("⏹️  ボットが停止されました（Ctrl+C）")
    except Exception as e:
        logger.error(f"💥 予期しないエラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()