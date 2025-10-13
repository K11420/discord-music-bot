import asyncio
from typing import Optional
from .queue import Queue


class GuildState:
    """
    各サーバーの状態を管理するクラス
    """
    __slots__ = (
        "queue",
        "playing",
        "loop",
        "shuffle",
        "alarm",
        "volume",
        "last_message",
        "_lock",
    )

    def __init__(self):
        self.queue: Queue = Queue()
        self.playing: bool = False
        self.loop: bool = False
        self.shuffle: bool = False
        self.alarm: bool = False
        self.volume: float = 0.5
        self.last_message: Optional[int] = None  # 最後の再生メッセージのID
        self._lock: asyncio.Lock = asyncio.Lock()

    async def set_playing(self, playing: bool):
        """再生状態を安全に設定"""
        async with self._lock:
            self.playing = playing

    async def toggle_loop(self) -> bool:
        """ループ状態を切り替え"""
        async with self._lock:
            self.loop = not self.loop
            return self.loop

    async def toggle_shuffle(self) -> bool:
        """シャッフル状態を切り替え"""
        async with self._lock:
            self.shuffle = not self.shuffle
            if self.shuffle:
                self.queue.shuffle()
            else:
                self.queue.unshuffle()
            return self.shuffle

    async def set_volume(self, volume: float):
        """ボリュームを設定"""
        async with self._lock:
            self.volume = max(0.0, min(2.0, volume))

    def reset(self):
        """状態をリセット"""
        self.queue.clear()
        self.playing = False
        self.loop = False
        self.shuffle = False
        self.alarm = False
        self.volume = 0.5
        self.last_message = None

    def __repr__(self) -> str:
        return (
            f"<GuildState: playing={self.playing}, loop={self.loop}, "
            f"shuffle={self.shuffle}, queue_size={self.queue.qsize()}>"
        )