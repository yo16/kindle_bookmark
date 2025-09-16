import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { getLogStats } from './utils/logger';

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
  const startTime = Date.now();

  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    logs: getLogStats(),
  };

  res.json(health);

  const responseTime = Date.now() - startTime;
  log.request('GET', '/health', 200, responseTime);
});

// API稼働状況確認エンドポイント
app.get('/api/status', (_req: Request, res: Response) => {
  const startTime = Date.now();

  const status = {
    success: true,
    message: 'Kindle Bookmark API is running',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.json(status);

  const responseTime = Date.now() - startTime;
  log.request('GET', '/api/status', 200, responseTime);
});

// ルートパス
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Kindle Bookmark Manager API Server',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    status: 'running',
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
      openBook: '/api/v1/open-book',
    },
  });
});

// =====================
// エラーハンドリング
// =====================

// 404 ハンドリング（未定義のルート）
app.use('*', (req: Request, res: Response) => {
  const startTime = Date.now();

  const errorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'エンドポイントが見つかりません',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(errorResponse);

  const responseTime = Date.now() - startTime;
  log.request(req.method, req.originalUrl, 404, responseTime);
  log.warn('未定義のエンドポイントへのアクセス', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });
});

// グローバルエラーハンドリング
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const startTime = Date.now();

  // エラー詳細をログに記録
  log.error('サーバー内部エラーが発生しました', err, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.body,
  });

  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'サーバー内部エラーが発生しました',
      timestamp: new Date().toISOString(),
    },
  };

  res.status(500).json(errorResponse);

  const responseTime = Date.now() - startTime;
  log.request(req.method, req.originalUrl, 500, responseTime);
});

export default app;
