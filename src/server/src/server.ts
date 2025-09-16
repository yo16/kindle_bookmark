import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本ルート
app.get('/', (_req, res) => {
  res.json({
    message: 'Kindle Bookmark Manager API Server',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    status: 'running',
  });
});

// ヘルスチェック用エンドポイント
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API v1 ルート（将来の実装用）
app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Kindle Bookmark Manager API v1',
    endpoints: {
      books: '/api/v1/books',
      sync: '/api/v1/sync',
      collections: '/api/v1/collections',
    },
  });
});

// エラーハンドリング
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('エラーが発生しました:', err.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバー内部エラーが発生しました',
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// 404 ハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'エンドポイントが見つかりません',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Kindle Bookmark Manager サーバーが起動しました`);
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💚 ヘルスチェック: http://localhost:${PORT}/health`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('📴 サーバーを終了しています...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 サーバーを終了しています...');
  process.exit(0);
});
