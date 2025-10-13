# 🐛 バグ修正: 「不明なタイトル」問題の解決

## 問題

URLから音楽を追加する際に、「✅ 不明なタイトル をキューに追加しました！」と表示され、正しい曲名が取得できない問題が発生していました。

## 原因

`source/source.py`の`isPlayList`関数で、`extract_flat: True`を使用していたため、yt-dlpが動画の詳細情報を取得せず、タイトルが空または"NA"になっていました。

## 修正内容

### 1. **extract_flat設定の最適化**
```python
# 修正前
'extract_flat': True,

# 修正後
'extract_flat': 'in_playlist',  # プレイリスト内のみフラット抽出
```

### 2. **タイトル取得の二段階フォールバック**
```python
# タイトルが取得できない場合は、フルモードで再取得
if not title or title == 'NA':
    ytdl_opts_full = ytdl_opts.copy()
    ytdl_opts_full['extract_flat'] = False
    # 再度情報を取得
```

### 3. **URL構築の改善**
```python
# 動画IDから正しいURLを生成
if not video_url.startswith('http'):
    video_id = entry.get('id', '')
    if video_id:
        video_url = f"https://www.youtube.com/watch?v={video_id}"
```

### 4. **詳細なログ出力**
```python
_log.info(f"Extracted single video: {title}")
_log.info(f"Single video - Title: {title}, URL: {video_url}")
```

### 5. **エラーハンドリングの強化**
- プレイリストで曲が取得できない場合の警告
- 詳細なトレースバック出力
- より具体的なエラーメッセージ

## 修正箇所

### **source/source.py**
- `isPlayList`関数の完全な書き換え
- プレイリスト検出ロジックの改善
- タイトル取得の堅牢性向上

### **cogs/music.py**
- `add_to_queue`関数のログ追加
- エラーハンドリングの強化
- `logging`モジュールのインポート追加

## 動作確認

修正後は以下のように正しく動作します：

### ✅ 単一動画の場合
```
/play https://www.youtube.com/watch?v=xxxxx
→ ✅ **正しい曲名** をキューに追加しました！
```

### ✅ プレイリストの場合
```
/play https://www.youtube.com/playlist?list=xxxxx
→ ✅ **10曲** をキューに追加しました！
```

### ✅ 検索の場合
```
/search 曲名
→ 正しいタイトルがドロップダウンに表示される
```

## テスト方法

1. **単一動画のテスト**
```
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

2. **プレイリストのテスト**
```
/play https://www.youtube.com/playlist?list=PLxxxxxx
```

3. **ログの確認**
```bash
# ログファイルで詳細を確認
tail -f logs/bot.log
```

ログに以下のような出力が表示されれば正常です：
```
[INFO] music: Adding to queue: https://...
[INFO] music: Extracted single video: [曲名]
[INFO] music: Single video - Title: [曲名], URL: https://...
```

## 追加の改善点

### パフォーマンス最適化
- プレイリストの場合のみフラット抽出を使用
- 単一動画は必要な情報のみ取得

### デバッグの容易さ
- 各ステップで詳細なログ出力
- エラー発生時のトレースバック

### エラーハンドリング
- ネットワークエラーへの対応
- 無効なURLの適切な処理
- ユーザーへの分かりやすいエラーメッセージ

## ロールバック方法

もし問題が発生した場合は、以前のバージョンに戻すことができます：

```bash
git log --oneline
git checkout [以前のコミットID]
```

## 今後の改善案

1. **キャッシュ機能**: 同じURLの情報をキャッシュして高速化
2. **並列処理**: プレイリストの情報取得を並列化
3. **プログレス表示**: 大量の曲を追加する際の進捗表示
4. **自動リトライ**: ネットワークエラー時の自動再試行

## まとめ

この修正により、YouTubeなどの動画サイトから正しく曲名を取得できるようになりました。
yt-dlpの設定を最適化し、タイトル取得のフォールバック機能を追加することで、
より堅牢な動作を実現しています。

---
**修正日**: 2024年10月13日  
**バージョン**: v1.0.1  
**コミット**: c7b8312