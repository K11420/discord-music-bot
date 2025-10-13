import time
import discord
from discord import app_commands
from discord.ext import commands


class PingCog(commands.Cog):
    """
    Ping機能を提供するコグ
    """
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="ping", description="Botの応答速度を確認します")
    async def ping(self, interaction: discord.Interaction):
        """Botのping値を表示"""
        start_time = time.time()
        
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green()
        )
        
        # WebSocket のレイテンシ
        websocket_latency = round(self.bot.latency * 1000, 2)
        embed.add_field(
            name="WebSocket レイテンシ",
            value=f"`{websocket_latency}ms`",
            inline=True
        )
        
        await interaction.response.send_message(embed=embed)
        
        # API レスポンス時間を計算
        end_time = time.time()
        api_latency = round((end_time - start_time) * 1000, 2)
        
        embed.add_field(
            name="API レスポンス時間",
            value=f"`{api_latency}ms`",
            inline=True
        )
        
        # ステータス色を設定
        if websocket_latency < 100:
            embed.color = discord.Color.green()
            status = "🟢 優秀"
        elif websocket_latency < 200:
            embed.color = discord.Color.yellow()
            status = "🟡 良好"
        else:
            embed.color = discord.Color.red()
            status = "🔴 注意"
            
        embed.add_field(
            name="接続状態",
            value=status,
            inline=True
        )
        
        await interaction.edit_original_response(embed=embed)


async def setup(bot: commands.Bot):
    """コグをセットアップ"""
    await bot.add_cog(PingCog(bot))