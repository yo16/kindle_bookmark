/**
 * 書籍一覧取得APIルーター
 * GET /api/books エンドポイントの実装
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { BookService } from '../services/bookService';
import { createSuccessResponse, createErrorResponse } from '../utils/errors';
import { log } from '../utils/logger';

// ルーターインスタンスの作成
const router = Router();

// BookServiceインスタンスの作成
const bookService = new BookService();

/**
 * GET /api/books - 書籍一覧取得エンドポイント
 *
 * クエリパラメータ:
 * - search: 検索キーワード（タイトル部分一致）
 * - collection: コレクション名でフィルター
 * - sort: ソート項目（title_asc, title_desc）
 * - limit: 取得件数上限（デフォルト: 1000）
 * - offset: 取得開始位置（ページネーション用）
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      // クエリパラメータの取得と型変換
      const {
        search,
        collection,
        sort = 'title_asc',
        limit = '1000',
        offset = '0',
      } = req.query;

      // パラメータのバリデーション
      const parsedLimit = Math.min(
        Math.max(1, parseInt(limit as string, 10)),
        1000
      );
      const parsedOffset = Math.max(0, parseInt(offset as string, 10));

      log.info('書籍一覧取得リクエスト', {
        search,
        collection,
        sort,
        limit: parsedLimit,
        offset: parsedOffset,
      });

      // 書籍データの取得
      const result = await bookService.getBooks({
        search: search as string | undefined,
        collection: collection as string | undefined,
        sort: sort as string,
        limit: parsedLimit,
        offset: parsedOffset,
      });

      // レスポンスの送信
      res.json(
        createSuccessResponse({
          books: result.books,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
        })
      );

      // リクエストログの記録
      const responseTime = Date.now() - startTime;
      log.request('GET', '/api/books', 200, responseTime);
      log.info(
        `書籍一覧取得完了: ${result.books.length}件取得（全${result.totalCount}件中）`
      );
    } catch (error) {
      // エラーログの記録
      log.error('書籍一覧取得エラー', error);

      // エラーレスポンスの送信
      res.status(500).json(
        createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          '書籍データの取得に失敗しました',
          {
            message: error instanceof Error ? error.message : '不明なエラー',
            query: req.query,
          }
        )
      );

      // エラーリクエストログの記録
      const responseTime = Date.now() - startTime;
      log.request('GET', '/api/books', 500, responseTime);
    }
  })
);

export default router;
