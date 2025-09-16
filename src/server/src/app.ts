import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Express アプリケーション作成
const app: Application = express();

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// 基本ルート
// =====================

// ヘルスチェックエンドポイント
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API稼働状況確認エンドポイント
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Kindle Bookmark API is running',
    timestamp: new Date().toISOString()
  });
});

// ルートパス
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Kindle Bookmark Manager API Server',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    status: 'running'
  });
});

// API v1 ルート情報（将来の実装用）
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'Kindle Bookmark Manager API v1',
    endpoints: {
      books: '/api/v1/books',
      sync: '/api/v1/sync',
      collections: '/api/v1/collections',
      openBook: '/api/v1/open-book'
    }
  });
});

// =====================
// エラーハンドリング
// =====================

// 404 ハンドリング（未定義のルート）
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'エンドポイントが見つかりません',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// グローバルエラーハンドリング
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('エラーが発生しました:', err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'サーバー内部エラーが発生しました',
      timestamp: new Date().toISOString()
    }
  });
});

export default app;