import random
import logging
from typing import Any, Optional, List, Tuple


class QueueEdge(Exception):
    """キューの端に達した際の例外"""
    pass


class QueueEmpty(Exception):
    """キューが空の際の例外"""
    pass


_log = logging.getLogger("music")


class Queue:
    """
    音楽再生用のキューシステム
    シャッフル機能、前の曲に戻る機能、ページネーション機能を含む
    """
    __slots__ = (
        "__list",
        "__index",
        "__original_list",
        "shuffled",
    )

    def __init__(self):
        self.__list: List[Any] = []
        self.__index: int = 0
        self.__original_list: Optional[List[Any]] = None
        self.shuffled: bool = False

    @property
    def index(self) -> int:
        """現在のインデックスを取得"""
        return self.__index

    def __repr__(self) -> str:
        return f"<Queue: {len(self.__list)} items, index: {self.__index}>"

    def edge(self) -> bool:
        """キューの最初にいるかどうか"""
        return self.__index == 0

    def empty(self) -> bool:
        """キューが空かどうか"""
        return self.qsize() == 0

    def asize(self) -> int:
        """全体のサイズ"""
        return len(self.__list)

    def qsize(self) -> int:
        """残りのキューサイズ"""
        return len(self.__list) - self.__index

    def clear(self):
        """キューをクリア"""
        self.__index = 0
        self.__list.clear()
        self.__original_list = None
        self.shuffled = False
        _log.info("Queue cleared")

    def shuffle(self):
        """キューをシャッフル"""
        if not self.shuffled:
            self.__original_list = self.__list[:]
        
        # 現在のインデックス以降をシャッフル
        list1 = self.__list[: self.__index]
        list2 = self.__list[self.__index :]
        random.shuffle(list2)
        self.__list = list1 + list2
        self.shuffled = True
        _log.info("Queue shuffled")

    def unshuffle(self):
        """シャッフルを解除"""
        if not self.shuffled or self.__original_list is None:
            _log.warning("Cannot unshuffle: No original list available.")
            return
        
        # 元の順序に戻す
        self.__list = self.__original_list + self.__list[len(self.__original_list) :]
        self.__original_list = None
        self.shuffled = False
        _log.info("Queue unshuffled")

    def put(self, value: Any):
        """キューにアイテムを追加"""
        self.__list.append(value)
        if self.shuffled and self.__original_list is not None:
            self.__original_list.append(value)
        _log.debug(f"Added item to queue: {value}")

    def prev(self):
        """前の曲に戻る"""
        if self.edge():
            raise QueueEdge("Already at the beginning of the queue")
        self.__index -= 1
        _log.debug(f"Moved to previous item, index: {self.__index}")

    def get(self) -> Any:
        """次のアイテムを取得"""
        if self.empty():
            return None
        value = self.__list[self.__index]
        self.__index += 1
        _log.debug(f"Retrieved item from queue: {value}")
        return value

    def pagenation(self, page: int, *, pageSize: int = 10) -> Tuple[Any, ...]:
        """ページネーション用にアイテムを取得"""
        startIndex = (page - 1) * pageSize
        endIndex = startIndex + pageSize
        
        if startIndex >= len(self.__list) or page < 1:
            return ()
        
        return tuple(self.__list[startIndex:endIndex])

    def get_current_item(self) -> Optional[Any]:
        """現在のアイテムを取得（インデックスを進めない）"""
        if self.__index == 0 or self.__index > len(self.__list):
            return None
        return self.__list[self.__index - 1]

    def peek_next(self) -> Optional[Any]:
        """次のアイテムを確認（取得はしない）"""
        if self.empty():
            return None
        return self.__list[self.__index]