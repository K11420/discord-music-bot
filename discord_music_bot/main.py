import asyncio
import logging
import os
import sys

import discord
import dotenv
from discord.ext import commands

# .envファイルから環境変数を読み込み
dotenv.load_dotenv()

# Windowsの場合のイベントループ設定
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Botの必要な権限を設定
intents = discord.Intents.none()
intents.guilds = True
intents.voice_states = True
intents.emojis = True

# Botインスタンス作成
bot = commands.Bot(
    command_prefix="music#",
    intents=intents,
    member_cache_flags=discord.MemberCacheFlags.none(),
    max_messages=None,
)

# ログ設定
level = logging.INFO
handler = logging.StreamHandler()
if isinstance(handler, logging.StreamHandler) and discord.utils.stream_supports_colour(
    handler.stream
):
    formatter = discord.utils._ColourFormatter()
else:
    dt_fmt = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(
        "[{asctime}] [{levelname:<8}] {name}: {message}", dt_fmt, style="{"
    )
_log = logging.getLogger("music")
handler.setFormatter(formatter)
_log.setLevel(level)
_log.addHandler(handler)


@bot.event
async def on_ready():
    _log.info(f"Logged in as {bot.user.name}")
    _log.info(f"Bot ID: {bot.user.id}")
    _log.info(f"Connected to {len(bot.guilds)} servers")


@bot.event
async def setup_hook():
    """起動時にコグを読み込み"""
    await bot.load_extension("cogs.music")
    await bot.load_extension("cogs.ping")
    await bot.load_extension("cogs.help")
    await bot.tree.sync()
    _log.info("All cogs loaded and slash commands synced")


if __name__ == "__main__":
    # Discordトークンでボットを実行
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        _log.error("DISCORD_TOKEN not found in environment variables")
        sys.exit(1)
    
    try:
        bot.run(token)
    except discord.LoginFailure:
        _log.error("Invalid Discord token")
        sys.exit(1)
    except Exception as e:
        _log.error(f"Error starting bot: {e}")
        sys.exit(1)