FROM python:3.11-slim

# システムパッケージのアップデートとFFmpegインストール
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt .

# Python依存関係をインストール
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルをコピー
COPY . .

# ログディレクトリとキャッシュディレクトリを作成
RUN mkdir -p logs cache

# 実行権限を付与
RUN chmod +x run.py

# 非root ユーザーを作成
RUN useradd -m -u 1000 botuser && \
    chown -R botuser:botuser /app

USER botuser

# ポート（実際には使用しないが、ドキュメント用）
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD pgrep -f "python.*main.py" || exit 1

# アプリケーション実行
CMD ["python", "run.py"]