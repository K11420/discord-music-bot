import re
from typing import Union


def clamp(value: Union[int, float], min_val: Union[int, float], max_val: Union[int, float]) -> Union[int, float]:
    """値を指定された範囲内に制限"""
    return max(min_val, min(value, max_val))


def formatTime(seconds: Union[int, float]) -> str:
    """秒数を時:分:秒の形式にフォーマット"""
    if seconds is None or seconds < 0:
        return "00:00"
    
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def parseTime(time_str: str) -> int:
    """時間文字列を秒数に変換"""
    try:
        # HH:MM:SS または MM:SS の形式をサポート
        time_parts = time_str.split(':')
        
        if len(time_parts) == 3:  # HH:MM:SS
            hours, minutes, seconds = map(int, time_parts)
            return hours * 3600 + minutes * 60 + seconds
        elif len(time_parts) == 2:  # MM:SS
            minutes, seconds = map(int, time_parts)
            return minutes * 60 + seconds
        else:
            # 秒数のみ
            return int(time_str)
    except ValueError:
        return 0


def sanitize_filename(filename: str) -> str:
    """ファイル名から無効な文字を除去"""
    # Windows/Linux/macOSで無効な文字を削除
    invalid_chars = r'[<>:"/\\|?*]'
    sanitized = re.sub(invalid_chars, '_', filename)
    
    # 先頭・末尾の空白とピリオドを削除
    sanitized = sanitized.strip(' .')
    
    # 最大長制限（255文字）
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    
    return sanitized or "untitled"


def format_duration(seconds: Union[int, float]) -> str:
    """秒数を人間が読みやすい形式に変換"""
    if seconds is None or seconds < 0:
        return "不明"
    
    seconds = int(seconds)
    
    if seconds < 60:
        return f"{seconds}秒"
    elif seconds < 3600:
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}分{secs}秒"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}時間{minutes}分"


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """文字列を指定された長さで切り詰める"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def format_number(number: Union[int, float]) -> str:
    """数値を読みやすい形式にフォーマット"""
    if number is None:
        return "不明"
    
    if number >= 1_000_000_000:
        return f"{number / 1_000_000_000:.1f}B"
    elif number >= 1_000_000:
        return f"{number / 1_000_000:.1f}M"
    elif number >= 1_000:
        return f"{number / 1_000:.1f}K"
    else:
        return str(int(number))


def is_url(text: str) -> bool:
    """文字列がURLかどうか判定"""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return url_pattern.match(text) is not None


def extract_video_id(url: str) -> str:
    """YouTubeのURLから動画IDを抽出"""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
        r'youtube\.com/v/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return ""


def create_progress_bar(current: int, total: int, length: int = 20, filled_char: str = "█", empty_char: str = "░") -> str:
    """プログレスバーを作成"""
    if total <= 0:
        return empty_char * length
    
    progress = min(current / total, 1.0)
    filled_length = int(length * progress)
    
    bar = filled_char * filled_length + empty_char * (length - filled_length)
    percentage = int(progress * 100)
    
    return f"{bar} {percentage}%"