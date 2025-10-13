import asyncio
import logging
import re
import subprocess
from typing import Dict, List, Optional, Union

import discord
import yt_dlp
from discord import FFmpegPCMAudio, PCMVolumeTransformer


_log = logging.getLogger("music")


class AudioInfo:
    """音声情報を格納するクラス"""
    def __init__(self, data: Dict):
        self.id = data.get('id', '')
        self.title = data.get('title', '不明なタイトル')
        self.url = data.get('url', '')
        self.webpage_url = data.get('webpage_url', '')
        self.duration = data.get('duration', 0)
        self.thumbnail = data.get('thumbnail', '')
        self.uploader = data.get('uploader', '不明')
        self.view_count = data.get('view_count', 0)
        self.description = data.get('description', '')


class YTDLSource(PCMVolumeTransformer):
    """YouTube-DL音声ソース"""
    
    YTDL_OPTIONS = {
        'format': 'bestaudio/best',
        'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
        'restrictfilenames': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'quiet': True,
        'no_warnings': True,
        'default_search': 'auto',
        'source_address': '0.0.0.0',
        'extractaudio': True,
        'audioformat': 'mp3',
        'audioquality': '192',
    }

    FFMPEG_OPTIONS = {
        'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
        'options': '-vn -bufsize 64k -analyzeduration 2147483647 -probesize 2147483647 -ac 2'
    }

    def __init__(self, source: discord.AudioSource, *, info: AudioInfo, volume: float = 0.5, user: discord.Member, progress: float = 0):
        super().__init__(source, volume=volume)
        self.info = info
        self.user = user
        self.volume = volume
        self.progress = progress
        self.locale = getattr(user, 'locale', discord.Locale.japanese)

    @classmethod
    async def from_url(cls, url: str, locale: Optional[discord.Locale] = None, volume: float = 0.5, user: discord.Member = None):
        """URLから音声ソースを作成"""
        loop = asyncio.get_event_loop()
        
        try:
            ytdl = yt_dlp.YoutubeDL(cls.YTDL_OPTIONS)
            data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=False))
            
            if 'entries' in data:
                # プレイリストの場合は最初の動画を取得
                data = data['entries'][0]
            
            audio_info = AudioInfo(data)
            filename = data['url']
            
            _log.info(f"Loading audio: {audio_info.title}")
            
            return cls(
                FFmpegPCMAudio(filename, **cls.FFMPEG_OPTIONS),
                info=audio_info,
                volume=volume,
                user=user,
                progress=0
            )
        except Exception as e:
            _log.error(f"Error creating audio source from {url}: {e}")
            raise e

    @classmethod
    async def search_youtube(cls, query: str, max_results: int = 5) -> List[Dict]:
        """YouTube検索"""
        ytdl_opts = cls.YTDL_OPTIONS.copy()
        ytdl_opts.update({
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        })
        
        try:
            loop = asyncio.get_event_loop()
            ytdl = yt_dlp.YoutubeDL(ytdl_opts)
            
            search_query = f"ytsearch{max_results}:{query}"
            data = await loop.run_in_executor(None, lambda: ytdl.extract_info(search_query, download=False))
            
            results = []
            if 'entries' in data:
                for entry in data['entries']:
                    if entry:
                        results.append({
                            'title': entry.get('title', '不明なタイトル'),
                            'url': entry.get('url', ''),
                            'id': entry.get('id', ''),
                            'uploader': entry.get('uploader', '不明'),
                            'duration': entry.get('duration', 0),
                        })
            
            return results
        except Exception as e:
            _log.error(f"Error searching YouTube: {e}")
            return []


class DiscordFileSource(PCMVolumeTransformer):
    """Discord添付ファイル音声ソース"""
    
    def __init__(self, source: discord.AudioSource, *, info: AudioInfo, volume: float = 0.5, user: discord.Member, progress: float = 0):
        super().__init__(source, volume=volume)
        self.info = info
        self.user = user
        self.volume = volume
        self.progress = progress

    @classmethod
    async def from_attachment(cls, attachment: discord.Attachment, volume: float = 0.5, user: discord.Member = None):
        """Discord添付ファイルから音声ソースを作成"""
        try:
            # 添付ファイルが音声/動画ファイルかチェック
            if not any(attachment.filename.lower().endswith(ext) for ext in ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg', '.flac']):
                raise ValueError("サポートされていないファイル形式です")
            
            info = AudioInfo({
                'id': str(attachment.id),
                'title': attachment.filename,
                'url': attachment.url,
                'webpage_url': attachment.url,
                'duration': 0,  # 添付ファイルでは長さが分からない
                'thumbnail': '',
                'uploader': user.display_name if user else '不明',
            })
            
            ffmpeg_options = {
                'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
                'options': '-vn -bufsize 64k -ac 2'
            }
            
            _log.info(f"Loading attachment: {attachment.filename}")
            
            return cls(
                FFmpegPCMAudio(attachment.url, **ffmpeg_options),
                info=info,
                volume=volume,
                user=user,
                progress=0
            )
        except Exception as e:
            _log.error(f"Error creating audio source from attachment: {e}")
            raise e


async def isPlayList(url: str, locale: Optional[discord.Locale] = None) -> Union[Dict, List[Dict]]:
    """URLがプレイリストかどうか確認し、情報を取得"""
    ytdl_opts = YTDLSource.YTDL_OPTIONS.copy()
    ytdl_opts.update({
        'extract_flat': True,
        'quiet': True,
    })
    
    try:
        loop = asyncio.get_event_loop()
        ytdl = yt_dlp.YoutubeDL(ytdl_opts)
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=False))
        
        if 'entries' in data and len(data['entries']) > 1:
            # プレイリストの場合
            results = []
            for entry in data['entries']:
                if entry:
                    results.append({
                        'title': entry.get('title', '不明なタイトル'),
                        'url': entry.get('url', ''),
                        'id': entry.get('id', ''),
                    })
            return results
        else:
            # 単一動画の場合
            if 'entries' in data and data['entries']:
                entry = data['entries'][0]
            else:
                entry = data
            
            return {
                'title': entry.get('title', '不明なタイトル'),
                'url': entry.get('url', url),
                'id': entry.get('id', ''),
            }
            
    except Exception as e:
        _log.error(f"Error checking playlist: {e}")
        return {'title': '不明なタイトル', 'url': url, 'id': ''}