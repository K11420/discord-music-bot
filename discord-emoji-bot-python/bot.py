#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import discord
from discord.ext import commands
import zipfile
import io
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple
from dotenv import load_dotenv
from PIL import Image

# 環境変数の読み込み
load_dotenv()

# 定数
SUPPORTED_FORMATS = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
MAX_EMOJI_SIZE = 256 * 1024  # 256KB
MAX_EMOJIS_PER_ZIP = 50  # 一度に処理する最大絵文字数
MAX_EMOJI_NAME_LENGTH = 32
MIN_EMOJI_NAME_LENGTH = 2

# Botの設定
intents = discord.Intents.default()
intents.message_content = True
intents.guild_emojis = True
intents.guilds = True

bot = commands.Bot(command_prefix='!', intents=intents)


class EmojiResult:
    """絵文字登録結果を保持するクラス"""
    
    def __init__(self):
        self.success: List[Tuple[str, discord.Emoji]] = []
        self.failed: List[Tuple[str, str]] = []
    
    def add_success(self, name: str, emoji: discord.Emoji):
        """成功した絵文字を追加"""
        self.success.append((name, emoji))
    
    def add_failure(self, name: str, reason: str):
        """失敗した絵文字を追加"""
        self.failed.append((name, reason))
    
    @property
    def success_count(self) -> int:
        return len(self.success)
    
    @property
    def failed_count(self) -> int:
        return len(self.failed)


def sanitize_emoji_name(filename: str) -> str:
    """
    ファイル名を絵文字名として使用可能な形式に変換
    
    Args:
        filename: 元のファイル名
    
    Returns:
        サニタイズされた絵文字名
    """
    # 拡張子を除去
    name = Path(filename).stem
    
    # 英数字とアンダースコア以外を除去または置換
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    
    # 連続するアンダースコアを1つにまとめる
    name = re.sub(r'_+', '_', name)
    
    # 先頭と末尾のアンダースコアを除去
    name = name.strip('_')
    
    # 長さを制限
    name = name[:MAX_EMOJI_NAME_LENGTH]
    
    return name if len(name) >= MIN_EMOJI_NAME_LENGTH else None


def validate_image(image_data: bytes, filename: str) -> Tuple[bool, str]:
    """
    画像データを検証
    
    Args:
        image_data: 画像のバイナリデータ
        filename: ファイル名
    
    Returns:
        (有効かどうか, エラーメッセージ)
    """
    # ファイルサイズチェック
    if len(image_data) > MAX_EMOJI_SIZE:
        size_kb = len(image_data) / 1024
        return False, f"ファイルサイズが大きすぎます ({size_kb:.2f}KB > 256KB)"
    
    # 拡張子チェック
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_FORMATS:
        return False, f"サポートされていない形式です ({ext})"
    
    # 画像として読み込めるかチェック
    try:
        img = Image.open(io.BytesIO(image_data))
        img.verify()
        
        # サイズチェック（Discord絵文字は128x128推奨）
        if img.size[0] > 4096 or img.size[1] > 4096:
            return False, f"画像サイズが大きすぎます ({img.size[0]}x{img.size[1]})"
        
    except Exception as e:
        return False, f"画像の読み込みに失敗: {str(e)}"
    
    return True, ""


def extract_images_from_zip(zip_data: bytes) -> Dict[str, bytes]:
    """
    ZIPファイルから画像を抽出
    
    Args:
        zip_data: ZIPファイルのバイナリデータ
    
    Returns:
        絵文字名をキー、画像データを値とする辞書
    """
    images = {}
    
    try:
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zip_file:
            for file_info in zip_file.filelist:
                # ディレクトリをスキップ
                if file_info.is_dir():
                    continue
                
                filename = Path(file_info.filename).name
                
                # 隠しファイルをスキップ
                if filename.startswith('.') or filename.startswith('__'):
                    continue
                
                # 拡張子チェック
                ext = Path(filename).suffix.lower()
                if ext not in SUPPORTED_FORMATS:
                    continue
                
                # 絵文字名を生成
                emoji_name = sanitize_emoji_name(filename)
                if not emoji_name:
                    print(f"⚠️  スキップ: {filename} (無効な名前)")
                    continue
                
                # 画像データを読み込み
                try:
                    image_data = zip_file.read(file_info.filename)
                    
                    # 画像を検証
                    is_valid, error_msg = validate_image(image_data, filename)
                    if not is_valid:
                        print(f"⚠️  スキップ: {filename} ({error_msg})")
                        continue
                    
                    # 重複する名前の場合は番号を付加
                    original_name = emoji_name
                    counter = 1
                    while emoji_name in images:
                        emoji_name = f"{original_name}_{counter}"
                        counter += 1
                    
                    images[emoji_name] = image_data
                    
                except Exception as e:
                    print(f"❌ ファイル読み込みエラー ({filename}): {e}")
                    continue
    
    except zipfile.BadZipFile:
        raise ValueError("無効なZIPファイルです")
    except Exception as e:
        raise ValueError(f"ZIP解凍エラー: {str(e)}")
    
    return images


async def register_emojis(guild: discord.Guild, images: Dict[str, bytes], 
                         user: discord.Member) -> EmojiResult:
    """
    絵文字をギルドに登録
    
    Args:
        guild: 対象のギルド
        images: 絵文字名と画像データの辞書
        user: コマンドを実行したユーザー
    
    Returns:
        登録結果
    """
    result = EmojiResult()
    
    # 権限チェック
    if not user.guild_permissions.manage_guild_expressions:
        raise ValueError("絵文字を管理する権限がありません")
    
    # 絵文字スロット数をチェック
    current_emoji_count = len(guild.emojis)
    
    # サーバーブーストレベルに応じた最大絵文字数
    max_emojis = {
        0: 50,   # ブーストなし
        1: 100,  # レベル1
        2: 150,  # レベル2
        3: 250,  # レベル3
    }.get(guild.premium_tier, 50)
    
    remaining_slots = max_emojis - current_emoji_count
    
    if remaining_slots <= 0:
        raise ValueError("サーバーの絵文字スロットが満杯です")
    
    print(f"📊 絵文字スロット: {current_emoji_count}/{max_emojis} (残り: {remaining_slots})")
    
    # 処理する画像数を制限
    images_to_process = dict(list(images.items())[:min(MAX_EMOJIS_PER_ZIP, remaining_slots)])
    
    # 絵文字を登録
    for emoji_name, image_data in images_to_process.items():
        try:
            # 既存の絵文字と名前が重複していないかチェック
            existing_emoji = discord.utils.get(guild.emojis, name=emoji_name)
            
            final_name = emoji_name
            counter = 1
            while existing_emoji:
                final_name = f"{emoji_name}_{counter}"
                existing_emoji = discord.utils.get(guild.emojis, name=final_name)
                counter += 1
            
            # 絵文字を作成
            emoji = await guild.create_custom_emoji(
                name=final_name,
                image=image_data,
                reason=f"Uploaded by {user.name}"
            )
            
            result.add_success(final_name, emoji)
            print(f"✅ 絵文字登録成功: {final_name}")
            
            # レート制限を避けるため待機
            import asyncio
            await asyncio.sleep(1)
            
        except discord.HTTPException as e:
            error_msg = str(e)
            result.add_failure(emoji_name, error_msg)
            print(f"❌ 絵文字登録失敗 ({emoji_name}): {error_msg}")
        except Exception as e:
            result.add_failure(emoji_name, str(e))
            print(f"❌ 予期しないエラー ({emoji_name}): {e}")
    
    return result


@bot.event
async def on_ready():
    """Bot起動時のイベント"""
    print(f"✅ ログイン成功: {bot.user.name} (ID: {bot.user.id})")
    print(f"📊 {len(bot.guilds)}個のサーバーに接続中")
    print("🚀 Bot起動完了！ZIPファイルをアップロードして絵文字を登録できます。")
    print("-" * 50)


@bot.event
async def on_message(message: discord.Message):
    """メッセージ受信時のイベント"""
    # Botからのメッセージは無視
    if message.author.bot:
        return
    
    # コマンドを処理
    await bot.process_commands(message)
    
    # ZIPファイルの添付ファイルをチェック
    zip_attachment = None
    for attachment in message.attachments:
        if attachment.filename.lower().endswith('.zip'):
            zip_attachment = attachment
            break
    
    if not zip_attachment:
        return
    
    # ギルド内のメッセージかチェック
    if not message.guild:
        await message.reply("❌ このBotはサーバー内でのみ使用できます")
        return
    
    print(f"📦 ZIPファイルを受信: {zip_attachment.filename} (from {message.author.name})")
    
    try:
        # 処理中メッセージを送信
        processing_msg = await message.reply("🔄 ZIPファイルを処理中...")
        
        # ZIPファイルをダウンロード
        zip_data = await zip_attachment.read()
        
        # 画像を抽出
        images = extract_images_from_zip(zip_data)
        
        if not images:
            await processing_msg.edit(
                content="❌ ZIPファイル内に有効な画像が見つかりませんでした。\n"
                       f"サポートされる形式: {', '.join(SUPPORTED_FORMATS).upper()} (最大256KB)"
            )
            return
        
        print(f"🖼️  {len(images)}個の画像を検出")
        
        # 絵文字を登録
        await processing_msg.edit(content=f"🔄 {len(images)}個の絵文字を登録中...")
        result = await register_emojis(message.guild, images, message.author)
        
        # 結果を報告
        report_lines = []
        
        if result.success_count > 0:
            report_lines.append(f"✅ **登録成功 ({result.success_count}個)**")
            
            # 絵文字を表示（長すぎる場合は分割）
            emoji_str = " ".join([str(emoji) for _, emoji in result.success])
            if len(emoji_str) <= 1800:
                report_lines.append(emoji_str)
            else:
                # 長い場合は最初の一部のみ表示
                displayed_emojis = []
                current_length = 0
                for name, emoji in result.success:
                    emoji_display = str(emoji)
                    if current_length + len(emoji_display) > 1800:
                        break
                    displayed_emojis.append(emoji_display)
                    current_length += len(emoji_display)
                
                report_lines.append(" ".join(displayed_emojis))
                report_lines.append(f"...他{result.success_count - len(displayed_emojis)}個")
        
        if result.failed_count > 0:
            report_lines.append(f"\n❌ **登録失敗 ({result.failed_count}個)**")
            
            # 失敗理由を表示（最初の5件のみ）
            for name, reason in result.failed[:5]:
                report_lines.append(f"• `{name}`: {reason}")
            
            if result.failed_count > 5:
                report_lines.append(f"...他{result.failed_count - 5}件")
        
        report_message = "\n".join(report_lines)
        
        # メッセージが長すぎる場合は要約
        if len(report_message) > 2000:
            summary = f"✅ 処理完了: {result.success_count}個成功, {result.failed_count}個失敗\n\n"
            if result.success_count > 0:
                first_emojis = " ".join([str(emoji) for _, emoji in result.success[:20]])
                summary += f"登録された絵文字（一部）:\n{first_emojis}"
                if result.success_count > 20:
                    summary += f"\n...他{result.success_count - 20}個"
            await processing_msg.edit(content=summary)
        else:
            await processing_msg.edit(content=report_message)
        
    except ValueError as e:
        await message.reply(f"❌ エラー: {str(e)}")
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        await message.reply(f"❌ 予期しないエラーが発生しました: {str(e)}")


@bot.command(name='help_emoji', aliases=['emoji_help'])
async def help_emoji(ctx):
    """ヘルプメッセージを表示"""
    help_text = """
📦 **Discord Emoji Bot ヘルプ**

**使い方:**
1. 絵文字にしたい画像をZIPファイルにまとめます
2. このチャンネルにZIPファイルをアップロード
3. Botが自動的に処理して絵文字を登録します！

**サポートされる画像形式:**
• PNG, JPG, JPEG, GIF, WEBP

**制限事項:**
• 各画像は256KB以下
• ファイル名は絵文字名として使用されます
• 一度に最大50個まで処理
• 絵文字を管理する権限が必要です

**サーバーの絵文字制限:**
• ブーストなし: 50個
• レベル1: 100個
• レベル2: 150個
• レベル3: 250個

**コマンド:**
• `!help_emoji` - このヘルプを表示
• `!emoji_info` - サーバーの絵文字情報を表示
    """
    await ctx.send(help_text)


@bot.command(name='emoji_info')
async def emoji_info(ctx):
    """サーバーの絵文字情報を表示"""
    if not ctx.guild:
        await ctx.send("❌ このコマンドはサーバー内でのみ使用できます")
        return
    
    guild = ctx.guild
    current_emoji_count = len(guild.emojis)
    
    max_emojis = {
        0: 50,
        1: 100,
        2: 150,
        3: 250,
    }.get(guild.premium_tier, 50)
    
    remaining_slots = max_emojis - current_emoji_count
    
    info_text = f"""
📊 **{guild.name} の絵文字情報**

**現在の絵文字数:** {current_emoji_count} / {max_emojis}
**残りスロット:** {remaining_slots}
**ブーストレベル:** {guild.premium_tier}
**ブースト数:** {guild.premium_subscription_count}

{'✅ まだ絵文字を追加できます！' if remaining_slots > 0 else '⚠️ 絵文字スロットが満杯です'}
    """
    
    await ctx.send(info_text)


@bot.event
async def on_command_error(ctx, error):
    """コマンドエラーハンドリング"""
    if isinstance(error, commands.CommandNotFound):
        return
    
    print(f"❌ コマンドエラー: {error}")
    await ctx.send(f"❌ エラーが発生しました: {str(error)}")


def main():
    """メイン関数"""
    # トークンを取得
    token = os.getenv('DISCORD_BOT_TOKEN')
    
    if not token:
        print("❌ エラー: DISCORD_BOT_TOKEN環境変数が設定されていません")
        print("   .envファイルを作成してトークンを設定してください")
        return
    
    # Botを起動
    try:
        bot.run(token)
    except discord.LoginFailure:
        print("❌ ログイン失敗: トークンが無効です")
    except Exception as e:
        print(f"❌ 起動エラー: {e}")


if __name__ == "__main__":
    main()
