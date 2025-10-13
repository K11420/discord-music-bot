import discord
from typing import Optional


class Item:
    """
    キューに追加するアイテムを表すクラス
    """
    __slots__ = (
        "url",
        "attachment",
        "volume",
        "user",
        "title",
        "locale",
    )

    def __init__(
        self,
        *,
        user: discord.Member,
        url: Optional[str] = None,
        title: Optional[str] = None,
        attachment: Optional[discord.Attachment] = None,
        volume: float = 0.5,
        locale: Optional[discord.Locale] = None,
    ):
        self.url: Optional[str] = url
        self.title: Optional[str] = title
        self.attachment: Optional[discord.Attachment] = attachment
        self.volume: float = volume
        self.user: discord.Member = user
        self.locale: Optional[discord.Locale] = locale

    @property
    def name(self) -> str:
        """表示用の名前を取得"""
        if self.attachment is not None:
            return self.attachment.filename
        elif self.title is not None:
            return f"[{self.title}]({self.url})"
        else:
            return self.url or "不明な曲"
    
    def __str__(self) -> str:
        return self.name
    
    def __repr__(self) -> str:
        return f"<Item: {self.name}>"