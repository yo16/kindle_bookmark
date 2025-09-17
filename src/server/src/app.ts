import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { log } from './utils/logger';
import { getLogStats } from './utils/logger';
import { 
  errorHandler, 
  notFoundHandler, 
  initializeErrorHandling,
  asyncHandler 
} from './middleware/errorHandler';
import { createSuccessResponse } from './utils/errors';

// エラーハンドリングの初期化
initializeErrorHandling();

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
app.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();

  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    logs: getLogStats(),
  };

  res.json(createSuccessResponse(health));

  const responseTime = Date.now() - startTime;
  log.request('GET', '/health', 200, responseTime);
}));

// API稼働状況確認エンドポイント
app.get('/api/status', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();

  const status = {
    message: 'Kindle Bookmark API is running',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.json(createSuccessResponse(status));

  const responseTime = Date.now() - startTime;
  log.request('GET', '/api/status', 200, responseTime);
}));

// ルートパス
app.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse({
    message: 'Kindle Bookmark Manager API Server',
    description: 'Kindle蔵書管理システム API サーバー',
    version: '1.0.0',
    status: 'running',
  }));
}));

// API v1 ルート情報（将来の実装用）
app.get('/api/v1', asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse({
    message: 'Kindle Bookmark Manager API v1',
    endpoints: {
      books: '/api/v1/books',
      sync: '/api/v1/sync',
      collections: '/api/v1/collections',
      openBook: '/api/v1/open-book',
    },
  }));
}));

// =====================
// エラーハンドリング
// =====================

// 404 ハンドリング（未定義のルート）
app.use('*', notFoundHandler);

// グローバルエラーハンドリング
app.use(errorHandler);

export default app;
