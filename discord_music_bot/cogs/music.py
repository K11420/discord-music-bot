import asyncio
import math
import os
import traceback
from datetime import timedelta
from typing import Optional, Union

import discord
import dotenv
from discord import app_commands
from discord.ext import commands, tasks

from objects.item import Item
from objects.queue import Queue, QueueEmpty, QueueEdge
from objects.state import GuildState
from source.source import YTDLSource, DiscordFileSource, isPlayList
from utils.func import clamp, formatTime, format_duration, create_progress_bar

dotenv.load_dotenv()


def create_control_view(is_paused: bool, is_looping: bool, is_shuffle: bool) -> discord.ui.View:
    """音楽コントロール用のUIビューを作成"""
    view = discord.ui.View(timeout=None)
    
    # 上段のボタン
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            emoji="⏪",
            custom_id="reverse",
            row=0
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.primary,
            emoji="▶️" if is_paused else "⏸️",
            custom_id="resume" if is_paused else "pause",
            row=0
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            emoji="⏩",
            custom_id="forward",
            row=0
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            label="🔊+",
            custom_id="volume_up",
            row=0
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.danger if is_looping else discord.ButtonStyle.secondary,
            emoji="🔄",
            custom_id="loop",
            row=0
        )
    )
    
    # 下段のボタン
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            emoji="⏮️",
            custom_id="prev",
            row=1
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.danger,
            emoji="⏹️",
            custom_id="stop",
            row=1
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            emoji="⏭️",
            custom_id="next",
            row=1
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.secondary,
            label="🔊-",
            custom_id="volume_down",
            row=1
        )
    )
    view.add_item(
        discord.ui.Button(
            style=discord.ButtonStyle.danger if is_shuffle else discord.ButtonStyle.secondary,
            emoji="🔀",
            custom_id="shuffle",
            row=1
        )
    )
    
    return view


class MusicCog(commands.Cog):
    """
    音楽再生機能を提供するメインコグ
    """
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.guild_states: dict[int, GuildState] = {}
        self.presence_count = 0

    @commands.Cog.listener()
    async def on_ready(self):
        """Bot起動時の処理"""
        for guild in self.bot.guilds:
            self.guild_states[guild.id] = GuildState()
        
        if not self.presence_loop.is_running():
            self.presence_loop.start()

    @tasks.loop(seconds=30)
    async def presence_loop(self):
        """ボットのプレゼンス表示を循環させる"""
        activities = [
            discord.Activity(
                name=f"{len(self.bot.voice_clients)} / {len(self.bot.guilds)} サーバー",
                type=discord.ActivityType.competing
            ),
            discord.Game("/help でヘルプを表示"),
            discord.Activity(
                name="音楽を再生中 🎵",
                type=discord.ActivityType.listening
            )
        ]
        
        activity = activities[self.presence_count % len(activities)]
        await self.bot.change_presence(activity=activity)
        self.presence_count += 1

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        """サーバー参加時の処理"""
        self.guild_states[guild.id] = GuildState()

    @commands.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        """サーバー退出時の処理"""
        if guild.id in self.guild_states:
            if guild.voice_client:
                await guild.voice_client.disconnect()
            del self.guild_states[guild.id]

    @commands.Cog.listener()
    async def on_interaction(self, interaction: discord.Interaction):
        """ボタンインタラクションの処理"""
        if interaction.type != discord.InteractionType.component:
            return
        
        try:
            await self.handle_button_click(interaction)
        except Exception as e:
            print(f"Button interaction error: {e}")
            if not interaction.response.is_done():
                await interaction.response.send_message(
                    "エラーが発生しました。", ephemeral=True
                )

    async def handle_button_click(self, interaction: discord.Interaction):
        """ボタンクリック処理"""
        custom_id = interaction.data.get("custom_id", "")
        guild = interaction.guild
        
        if not guild or guild.id not in self.guild_states:
            await interaction.response.send_message(
                "エラーが発生しました。", ephemeral=True
            )
            return
        
        state = self.guild_states[guild.id]
        voice_client = guild.voice_client
        
        if custom_id == "pause":
            if not voice_client or not voice_client.is_playing():
                await interaction.response.send_message(
                    "再生中の音楽がありません。", ephemeral=True
                )
                return
            
            voice_client.pause()
            await interaction.response.defer()
            
            embed = interaction.message.embeds[0]
            embed.set_author(name="⏸️ 一時停止中")
            
            await interaction.edit_original_response(
                embed=embed,
                view=create_control_view(True, state.loop, state.shuffle)
            )
        
        elif custom_id == "resume":
            if not voice_client or not voice_client.is_paused():
                await interaction.response.send_message(
                    "一時停止中の音楽がありません。", ephemeral=True
                )
                return
            
            voice_client.resume()
            await interaction.response.defer()
            
            embed = interaction.message.embeds[0]
            embed.set_author(name="🎵 再生中")
            
            await interaction.edit_original_response(
                embed=embed,
                view=create_control_view(False, state.loop, state.shuffle)
            )
        
        elif custom_id == "stop":
            if not voice_client:
                await interaction.response.send_message(
                    "接続中のボイスチャンネルがありません。", ephemeral=True
                )
                return
            
            await interaction.response.defer()
            await voice_client.disconnect()
            state.reset()
            
            await interaction.followup.send("⏹️ 音楽を停止しました。")
        
        elif custom_id == "next":
            if not voice_client or not voice_client.is_playing():
                await interaction.response.send_message(
                    "再生中の音楽がありません。", ephemeral=True
                )
                return
            
            await interaction.response.defer()
            voice_client.stop()
        
        elif custom_id == "prev":
            if not voice_client:
                await interaction.response.send_message(
                    "再生中の音楽がありません。", ephemeral=True
                )
                return
            
            await interaction.response.defer()
            try:
                state.queue.prev()
                voice_client.stop()
            except QueueEdge:
                await interaction.followup.send(
                    "これが最初の曲です。", ephemeral=True
                )
        
        elif custom_id == "loop":
            await interaction.response.defer()
            state.loop = not state.loop
            
            embed = interaction.message.embeds[0]
            await interaction.edit_original_response(
                embed=embed,
                view=create_control_view(
                    voice_client.is_paused() if voice_client else False,
                    state.loop,
                    state.shuffle
                )
            )
            
            status = "有効" if state.loop else "無効"
            await interaction.followup.send(
                f"🔄 ループを{status}にしました。", ephemeral=True
            )
        
        elif custom_id == "shuffle":
            await interaction.response.defer()
            state.shuffle = not state.shuffle
            
            if state.shuffle:
                state.queue.shuffle()
            else:
                state.queue.unshuffle()
            
            embed = interaction.message.embeds[0]
            await interaction.edit_original_response(
                embed=embed,
                view=create_control_view(
                    voice_client.is_paused() if voice_client else False,
                    state.loop,
                    state.shuffle
                )
            )
            
            status = "有効" if state.shuffle else "無効"
            await interaction.followup.send(
                f"🔀 シャッフルを{status}にしました。", ephemeral=True
            )

    def create_now_playing_embed(
        self,
        source: Union[YTDLSource, DiscordFileSource],
        voice_client: discord.VoiceClient,
        finished: bool = False
    ) -> discord.Embed:
        """現在再生中の音楽の埋め込みを作成"""
        embed = discord.Embed(
            title=source.info.title,
            url=source.info.webpage_url if source.info.webpage_url else None,
            color=discord.Color.purple()
        )
        
        if source.info.thumbnail:
            embed.set_image(url=source.info.thumbnail)
        
        if finished:
            embed.set_author(name="⏹️ 再生終了")
            embed.color = discord.Color.greyple()
        elif voice_client.is_paused():
            embed.set_author(name="⏸️ 一時停止中")
            embed.color = discord.Color.orange()
        elif voice_client.is_playing():
            embed.set_author(name="🎵 再生中")
            embed.color = discord.Color.green()
        else:
            embed.set_author(name="⏳ 準備中")
            embed.color = discord.Color.greyple()
        
        # 再生時間のプログレスバー
        if hasattr(source, 'progress') and source.info.duration > 0:
            progress_bar = create_progress_bar(
                int(source.progress), 
                int(source.info.duration),
                length=15,
                filled_char="█",
                empty_char="░"
            )
            
            embed.add_field(
                name="⏱️ 再生時間",
                value=f"`{formatTime(source.progress)} / {formatTime(source.info.duration)}`\n{progress_bar}",
                inline=False
            )
        
        # ボリューム表示
        volume_bar = create_progress_bar(
            int(source.volume * 50),
            100,
            length=10,
            filled_char="🔊",
            empty_char="🔇"
        )
        
        embed.add_field(
            name="🔊 ボリューム",
            value=f"`{int(source.volume * 100)}%`\n{volume_bar}",
            inline=True
        )
        
        # リクエストユーザー
        embed.add_field(
            name="👤 リクエスト",
            value=source.user.mention,
            inline=True
        )
        
        # 追加情報
        if hasattr(source.info, 'uploader') and source.info.uploader:
            embed.add_field(
                name="📺 アップローダー",
                value=source.info.uploader,
                inline=True
            )
        
        return embed

    async def play_next(self, guild: discord.Guild, channel: discord.abc.Messageable):
        """次の曲を再生"""
        if guild.id not in self.guild_states:
            return
        
        state = self.guild_states[guild.id]
        voice_client = guild.voice_client
        
        try:
            while voice_client and voice_client.is_connected():
                if state.queue.empty():
                    break
                
                # 次の曲を取得
                item: Item = state.queue.get()
                if not item:
                    break
                
                # 音声ソースを作成
                try:
                    if item.attachment:
                        source = await DiscordFileSource.from_attachment(
                            item.attachment, item.volume, item.user
                        )
                    else:
                        source = await YTDLSource.from_url(
                            item.url, item.locale, item.volume, item.user
                        )
                except Exception as e:
                    await channel.send(f"❌ 音声の読み込みに失敗しました: {e}")
                    continue
                
                # 再生開始
                embed = self.create_now_playing_embed(source, voice_client)
                view = create_control_view(False, state.loop, state.shuffle)
                
                message = await channel.send(embed=embed, view=view)
                state.last_message = message.id
                
                def after_playing(error):
                    if error:
                        print(f"Player error: {error}")
                    asyncio.run_coroutine_threadsafe(
                        state.set_playing(False), self.bot.loop
                    )
                
                voice_client.play(source, after=after_playing)
                await state.set_playing(True)
                
                # 再生監視ループ
                while state.playing and voice_client.is_connected():
                    await asyncio.sleep(1)
                
                # ループが有効な場合は同じ曲を再度再生
                if state.loop and voice_client.is_connected() and not state.queue.empty():
                    state.queue.put(item)  # 同じアイテムを再度キューに追加
                
                # 終了時の処理
                if voice_client.source:
                    voice_client.source.cleanup()
                
                embed = self.create_now_playing_embed(source, voice_client, finished=True)
                try:
                    await message.edit(embed=embed, view=None)
                except:
                    pass
        
        except Exception as e:
            traceback.print_exc()
            await channel.send(f"❌ 再生中にエラーが発生しました: {e}")
        
        finally:
            await channel.send("🎵 再生を終了しました。")
            if voice_client and voice_client.is_connected():
                await voice_client.disconnect()
            state.reset()

    async def add_to_queue(self, interaction: discord.Interaction, url: str, volume: float):
        """キューに音楽を追加"""
        state = self.guild_states[interaction.guild.id]
        
        try:
            # プレイリストかどうか確認
            result = await isPlayList(url, interaction.locale)
            
            if isinstance(result, list):
                # プレイリストの場合
                for item_data in result:
                    item = Item(
                        user=interaction.user,
                        url=item_data['url'],
                        title=item_data['title'],
                        volume=volume,
                        locale=interaction.locale
                    )
                    state.queue.put(item)
                
                await interaction.followup.send(
                    f"✅ **{len(result)}曲**をキューに追加しました！"
                )
            else:
                # 単一の曲の場合
                item = Item(
                    user=interaction.user,
                    url=url,
                    title=result['title'],
                    volume=volume,
                    locale=interaction.locale
                )
                state.queue.put(item)
                
                await interaction.followup.send(
                    f"✅ **{result['title']}** をキューに追加しました！"
                )
        
        except Exception as e:
            await interaction.followup.send(f"❌ URLの処理に失敗しました: {e}")

    async def check_permissions(self, interaction: discord.Interaction, url: str = None) -> bool:
        """必要な権限をチェック"""
        user = interaction.user
        guild = interaction.guild
        
        # ユーザーがボイスチャンネルに接続しているかチェック
        if not user.voice:
            await interaction.response.send_message(
                "❌ ボイスチャンネルに接続してください。", ephemeral=True
            )
            return False
        
        # ボットの権限チェック
        permissions = user.voice.channel.permissions_for(guild.me)
        if not permissions.connect:
            await interaction.response.send_message(
                f"❌ ボイスチャンネル '{user.voice.channel.name}' への接続権限がありません。",
                ephemeral=True
            )
            return False
        
        if not permissions.speak:
            await interaction.response.send_message(
                f"❌ ボイスチャンネル '{user.voice.channel.name}' での発言権限がありません。",
                ephemeral=True
            )
            return False
        
        # Apple Musicのチェック
        if url and "music.apple.com" in url:
            await interaction.response.send_message(
                "❌ Apple Musicには対応していません。", ephemeral=True
            )
            return False
        
        return True

    @app_commands.command(name="play", description="音楽を再生します")
    @app_commands.describe(
        url="YouTubeのURLやその他の音楽サイトのURL",
        volume="ボリューム (0.0-2.0)"
    )
    async def play(
        self,
        interaction: discord.Interaction,
        url: str,
        volume: app_commands.Range[float, 0.0, 2.0] = 0.5
    ):
        """音楽を再生"""
        if not await self.check_permissions(interaction, url):
            return
        
        await interaction.response.defer()
        
        # ボイスチャンネルに接続
        if not interaction.guild.voice_client:
            await interaction.user.voice.channel.connect(self_deaf=True)
        
        # キューに追加
        await self.add_to_queue(interaction, url, volume)
        
        # 再生開始
        state = self.guild_states[interaction.guild.id]
        if not state.playing:
            await self.play_next(interaction.guild, interaction.channel)

    @app_commands.command(name="playfile", description="アップロードしたファイルを再生します")
    @app_commands.describe(
        file="再生する音声または動画ファイル",
        volume="ボリューム (0.0-2.0)"
    )
    async def play_file(
        self,
        interaction: discord.Interaction,
        file: discord.Attachment,
        volume: app_commands.Range[float, 0.0, 2.0] = 0.5
    ):
        """ファイルを再生"""
        if not await self.check_permissions(interaction):
            return
        
        await interaction.response.defer()
        
        # ファイル形式チェック
        supported_formats = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg', '.mov', '.avi']
        if not any(file.filename.lower().endswith(fmt) for fmt in supported_formats):
            await interaction.followup.send(
                f"❌ サポートされていないファイル形式です。\n"
                f"対応形式: {', '.join(supported_formats)}"
            )
            return
        
        # ボイスチャンネルに接続
        if not interaction.guild.voice_client:
            await interaction.user.voice.channel.connect(self_deaf=True)
        
        # キューに追加
        state = self.guild_states[interaction.guild.id]
        item = Item(
            user=interaction.user,
            attachment=file,
            volume=volume
        )
        state.queue.put(item)
        
        await interaction.followup.send(
            f"✅ **{file.filename}** をキューに追加しました！"
        )
        
        # 再生開始
        if not state.playing:
            await self.play_next(interaction.guild, interaction.channel)

    @app_commands.command(name="search", description="YouTubeで検索して再生します")
    @app_commands.describe(
        query="検索キーワード",
        volume="ボリューム (0.0-2.0)"
    )
    async def search(
        self,
        interaction: discord.Interaction,
        query: str,
        volume: app_commands.Range[float, 0.0, 2.0] = 0.5
    ):
        """YouTube検索"""
        if not await self.check_permissions(interaction):
            return
        
        await interaction.response.defer(ephemeral=True)
        
        try:
            results = await YTDLSource.search_youtube(query, max_results=5)
            
            if not results:
                await interaction.followup.send(
                    "❌ 検索結果が見つかりませんでした。", ephemeral=True
                )
                return
            
            # 選択肢を作成
            view = discord.ui.View(timeout=60)
            select = discord.ui.Select(
                placeholder="再生する曲を選択してください...",
                min_values=1,
                max_values=1
            )
            
            for i, result in enumerate(results):
                duration_str = format_duration(result.get('duration', 0))
                select.add_option(
                    label=result['title'][:100],
                    description=f"{result['uploader']} - {duration_str}",
                    value=str(i)
                )
            
            async def select_callback(select_interaction):
                if select_interaction.user != interaction.user:
                    await select_interaction.response.send_message(
                        "❌ このボタンは使用できません。", ephemeral=True
                    )
                    return
                
                selected_index = int(select_interaction.data['values'][0])
                selected_result = results[selected_index]
                
                await select_interaction.response.defer()
                
                # ボイスチャンネルに接続
                if not interaction.guild.voice_client:
                    await interaction.user.voice.channel.connect(self_deaf=True)
                
                # キューに追加
                state = self.guild_states[interaction.guild.id]
                item = Item(
                    user=interaction.user,
                    url=f"https://www.youtube.com/watch?v={selected_result['id']}",
                    title=selected_result['title'],
                    volume=volume,
                    locale=interaction.locale
                )
                state.queue.put(item)
                
                await select_interaction.followup.send(
                    f"✅ **{selected_result['title']}** をキューに追加しました！"
                )
                
                # 再生開始
                if not state.playing:
                    await self.play_next(interaction.guild, interaction.channel)
            
            select.callback = select_callback
            view.add_item(select)
            
            embed = discord.Embed(
                title="🔍 検索結果",
                description=f"「{query}」の検索結果です。再生する曲を選択してください。",
                color=discord.Color.blue()
            )
            
            await interaction.followup.send(embed=embed, view=view, ephemeral=True)
        
        except Exception as e:
            await interaction.followup.send(
                f"❌ 検索中にエラーが発生しました: {e}", ephemeral=True
            )

    @app_commands.command(name="pause", description="音楽を一時停止します")
    async def pause(self, interaction: discord.Interaction):
        """一時停止"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client or not voice_client.is_playing():
            await interaction.response.send_message(
                "❌ 再生中の音楽がありません。", ephemeral=True
            )
            return
        
        voice_client.pause()
        await interaction.response.send_message("⏸️ 音楽を一時停止しました。")

    @app_commands.command(name="resume", description="一時停止した音楽を再開します")
    async def resume(self, interaction: discord.Interaction):
        """再開"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client or not voice_client.is_paused():
            await interaction.response.send_message(
                "❌ 一時停止中の音楽がありません。", ephemeral=True
            )
            return
        
        voice_client.resume()
        await interaction.response.send_message("▶️ 音楽を再開しました。")

    @app_commands.command(name="skip", description="現在の曲をスキップします")
    async def skip(self, interaction: discord.Interaction):
        """スキップ"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client or not voice_client.is_playing():
            await interaction.response.send_message(
                "❌ 再生中の音楽がありません。", ephemeral=True
            )
            return
        
        voice_client.stop()
        await interaction.response.send_message("⏭️ 曲をスキップしました。")

    @app_commands.command(name="stop", description="音楽を停止してボイスチャンネルから退出します")
    async def stop(self, interaction: discord.Interaction):
        """停止"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client:
            await interaction.response.send_message(
                "❌ ボイスチャンネルに接続していません。", ephemeral=True
            )
            return
        
        await voice_client.disconnect()
        
        if interaction.guild.id in self.guild_states:
            self.guild_states[interaction.guild.id].reset()
        
        await interaction.response.send_message("⏹️ 音楽を停止しました。")

    @app_commands.command(name="queue", description="再生待ちの曲一覧を表示します")
    async def queue(self, interaction: discord.Interaction):
        """キュー表示"""
        if interaction.guild.id not in self.guild_states:
            await interaction.response.send_message(
                "❌ キューが見つかりません。", ephemeral=True
            )
            return
        
        state = self.guild_states[interaction.guild.id]
        queue = state.queue
        
        if queue.empty():
            await interaction.response.send_message(
                "📝 キューは空です。", ephemeral=True
            )
            return
        
        # ページネーション
        page = 1
        page_size = 10
        songs = queue.pagenation(page, pageSize=page_size)
        
        if not songs:
            await interaction.response.send_message(
                "📝 キューは空です。", ephemeral=True
            )
            return
        
        embed = discord.Embed(
            title="📝 再生キュー",
            color=discord.Color.blue()
        )
        
        description = ""
        for i, item in enumerate(songs):
            index = (page - 1) * page_size + i + 1
            current_marker = "🎵 " if index == queue.index else ""
            description += f"{current_marker}{index}. {item.name}\n"
        
        embed.description = description
        embed.set_footer(
            text=f"ページ {page} / {(queue.asize() // page_size) + 1} | "
                 f"合計 {queue.asize()} 曲"
        )
        
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="nowplaying", description="現在再生中の曲情報を表示します")
    async def now_playing(self, interaction: discord.Interaction):
        """現在再生中の曲情報"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client or not voice_client.source:
            await interaction.response.send_message(
                "❌ 再生中の音楽がありません。", ephemeral=True
            )
            return
        
        source = voice_client.source
        if hasattr(source, 'original'):
            source = source.original
        
        embed = self.create_now_playing_embed(source, voice_client)
        view = create_control_view(
            voice_client.is_paused(),
            self.guild_states[interaction.guild.id].loop,
            self.guild_states[interaction.guild.id].shuffle
        )
        
        await interaction.response.send_message(embed=embed, view=view)

    @app_commands.command(name="volume", description="音量を調整します")
    @app_commands.describe(volume="音量 (0.0-2.0)")
    async def volume(
        self,
        interaction: discord.Interaction,
        volume: app_commands.Range[float, 0.0, 2.0]
    ):
        """音量調整"""
        voice_client = interaction.guild.voice_client
        
        if not voice_client or not voice_client.source:
            await interaction.response.send_message(
                "❌ 再生中の音楽がありません。", ephemeral=True
            )
            return
        
        voice_client.source.volume = volume
        
        if interaction.guild.id in self.guild_states:
            await self.guild_states[interaction.guild.id].set_volume(volume)
        
        await interaction.response.send_message(
            f"🔊 音量を {int(volume * 100)}% に設定しました。"
        )

    @app_commands.command(name="clear", description="キューをクリアします")
    async def clear(self, interaction: discord.Interaction):
        """キュークリア"""
        if interaction.guild.id not in self.guild_states:
            await interaction.response.send_message(
                "❌ キューが見つかりません。", ephemeral=True
            )
            return
        
        state = self.guild_states[interaction.guild.id]
        queue_size = state.queue.qsize()
        
        if queue_size == 0:
            await interaction.response.send_message(
                "📝 キューは既に空です。", ephemeral=True
            )
            return
        
        state.queue.clear()
        await interaction.response.send_message(
            f"🗑️ キューから {queue_size} 曲を削除しました。"
        )

    @app_commands.command(name="alarm", description="指定時間後に音楽を再生するアラームを設定します")
    @app_commands.describe(
        seconds="アラームまでの秒数",
        url="再生するURL",
        volume="ボリューム (0.0-2.0)"
    )
    async def alarm(
        self,
        interaction: discord.Interaction,
        seconds: app_commands.Range[int, 1, 86400],  # 最大24時間
        url: str,
        volume: app_commands.Range[float, 0.0, 2.0] = 0.5
    ):
        """アラーム設定"""
        if not await self.check_permissions(interaction, url):
            return
        
        await interaction.response.defer()
        
        # ボイスチャンネルに接続
        if not interaction.guild.voice_client:
            await interaction.user.voice.channel.connect(self_deaf=True)
        
        # キューに追加
        await self.add_to_queue(interaction, url, volume)
        
        # アラーム設定
        state = self.guild_states[interaction.guild.id]
        state.alarm = True
        
        embed = discord.Embed(
            title="⏰ アラームを設定しました",
            description=f"{discord.utils.format_dt(discord.utils.utcnow() + timedelta(seconds=seconds), 'R')} に音楽を再生します。",
            color=discord.Color.green()
        )
        embed.add_field(
            name="⚠️ 注意",
            value="アラーム設定中はボイスチャンネルに接続し続けます。\n"
                  "電池の消費にご注意ください。",
            inline=False
        )
        
        await interaction.followup.send(embed=embed)
        
        # 待機
        for _ in range(seconds):
            if not state.alarm:
                return
            await asyncio.sleep(1)
        
        state.alarm = False
        
        # 再生開始
        if not state.playing:
            await self.play_next(interaction.guild, interaction.channel)


async def setup(bot: commands.Bot):
    """コグをセットアップ"""
    await bot.add_cog(MusicCog(bot))