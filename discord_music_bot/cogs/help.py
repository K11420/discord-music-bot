import discord
from discord import app_commands
from discord.ext import commands


class HelpCog(commands.Cog):
    """
    ヘルプ機能を提供するコグ
    """
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="help", description="Botの使い方を表示します")
    async def help_command(self, interaction: discord.Interaction):
        """ヘルプメッセージを表示"""
        embed = discord.Embed(
            title="🎵 Discord Music Bot ヘルプ",
            description="このボットの使い方を説明します",
            color=discord.Color.blue()
        )
        
        # 基本的な再生コマンド
        embed.add_field(
            name="🎶 基本的な再生",
            value=(
                "`/play <URL>` - YouTubeやその他の動画サイトから音楽を再生\n"
                "`/playfile <ファイル>` - アップロードしたファイルを再生\n"
                "`/search youtube <キーワード>` - YouTubeで検索して再生\n"
            ),
            inline=False
        )
        
        # 再生制御コマンド
        embed.add_field(
            name="⏯️ 再生制御",
            value=(
                "`/pause` - 一時停止\n"
                "`/resume` - 再開\n"
                "`/skip` - 次の曲にスキップ\n"
                "`/stop` - 再生停止・ボイスチャンネルから退出\n"
            ),
            inline=False
        )
        
        # キュー管理
        embed.add_field(
            name="📝 キュー管理",
            value=(
                "`/queue` - 再生待ちの曲一覧を表示\n"
                "`/clear` - キューをクリア\n"
            ),
            inline=False
        )
        
        # 便利機能
        embed.add_field(
            name="🔧 便利機能",
            value=(
                "`/alarm <秒数> <URL>` - 指定時間後に音楽でアラーム\n"
                "`/volume <値>` - ボリューム調整（0.0-2.0）\n"
                "`/nowplaying` - 現在再生中の曲情報を表示\n"
            ),
            inline=False
        )
        
        # ボタン操作
        embed.add_field(
            name="🎛️ ボタン操作",
            value=(
                "再生中は以下のボタンで操作できます：\n"
                "⏪ 10秒戻る / ⏩ 10秒進む\n"
                "⏸️ 一時停止 / ▶️ 再開\n"
                "⏮️ 前の曲 / ⏭️ 次の曲\n"
                "⏹️ 停止 / 🔄 ループ / 🔀 シャッフル\n"
                "+ / - ボリューム調整\n"
            ),
            inline=False
        )
        
        # サポートサイト
        embed.add_field(
            name="🌐 サポートサイト",
            value=(
                "• YouTube\n"
                "• ニコニコ動画\n"
                "• SoundCloud\n"
                "• Spotify（要設定）\n"
                "• Discordファイル（音声・動画）\n"
            ),
            inline=False
        )
        
        embed.add_field(
            name="💡 使用のヒント",
            value=(
                "• ボイスチャンネルに参加してからコマンドを実行してください\n"
                "• プレイリストのURLも対応しています\n"
                "• ファイルは音声・動画形式のみ対応\n"
            ),
            inline=False
        )
        
        embed.set_footer(text="何か問題があれば管理者にご連絡ください")
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="info", description="Botの情報を表示します")
    async def info_command(self, interaction: discord.Interaction):
        """ボット情報を表示"""
        embed = discord.Embed(
            title="🤖 Bot情報",
            color=discord.Color.purple()
        )
        
        embed.add_field(
            name="🏷️ Bot名",
            value=self.bot.user.name,
            inline=True
        )
        
        embed.add_field(
            name="🆔 Bot ID",
            value=self.bot.user.id,
            inline=True
        )
        
        embed.add_field(
            name="🏠 サーバー数",
            value=f"{len(self.bot.guilds)}個",
            inline=True
        )
        
        embed.add_field(
            name="🔊 接続中のVC",
            value=f"{len(self.bot.voice_clients)}個",
            inline=True
        )
        
        embed.add_field(
            name="📡 レイテンシ",
            value=f"{round(self.bot.latency * 1000, 2)}ms",
            inline=True
        )
        
        embed.add_field(
            name="🐍 Python",
            value="discord.py",
            inline=True
        )
        
        if self.bot.user.avatar:
            embed.set_thumbnail(url=self.bot.user.avatar.url)
        
        embed.set_footer(text="このボットはオープンソースプロジェクトです")
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """コグをセットアップ"""
    await bot.add_cog(HelpCog(bot))