/**
 * グローバルエラーハンドラー
 *
 * Express アプリケーション全体のエラー処理を統一
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import {
  BaseError,
  isOperationalError,
  createErrorResponse,
} from '../utils/errors';
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from '../types/errors';

/**
 * エラーハンドラーミドルウェア
 *
 * Expressの最後に設定するエラーハンドリングミドルウェア
 * すべての未処理エラーをキャッチして適切にレスポンスする
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // エラーログを出力
  logError(error, req);

  // レスポンスが既に送信されている場合は何もしない
  if (res.headersSent) {
    return next(error);
  }

  // エラーレスポンスを作成
  const errorResponse = buildErrorResponse(error);

  // HTTPステータスコードを決定
  const statusCode = getStatusCode(error);

  // レスポンスを送信
  res.status(statusCode).json(errorResponse);
}

/**
 * 404エラーハンドラー
 *
 * 定義されていないルートへのアクセスを処理
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse = createErrorResponse(
    ERROR_CODES.NOT_FOUND,
    `リソースが見つかりません: ${req.path}`,
    {
      method: req.method,
      path: req.path,
      url: req.originalUrl,
    }
  );

  log.warn('404エラー', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json(errorResponse);
}

/**
 * エラーログを出力
 */
function logError(error: Error, req?: Request): void {
  const errorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      path: req.path,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }),
  };

  // 運用上のエラーかどうかで出力レベルを変える
  if (isOperationalError(error)) {
    log.warn('運用エラーが発生しました', errorDetails);
  } else {
    log.error('予期しないエラーが発生しました', errorDetails);
  }
}

/**
 * エラーレスポンスを構築
 */
function buildErrorResponse(
  error: Error
): ReturnType<typeof createErrorResponse> {
  // BaseError の場合
  if (error instanceof BaseError) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return createErrorResponse(
      error.code as ErrorCode,
      error.message,
      isDevelopment ? { ...error.details, stack: error.stack } : error.details
    );
  }

  // その他のエラー（予期しないエラー）
  const isDevelopment = process.env.NODE_ENV === 'development';

  return createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    isDevelopment
      ? error.message
      : ERROR_MESSAGES[ERROR_CODES.INTERNAL_SERVER_ERROR],
    isDevelopment
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined
  );
}

/**
 * HTTPステータスコードを取得
 */
function getStatusCode(error: Error): number {
  if (error instanceof BaseError) {
    return error.statusCode;
  }

  // その他のエラーは500を返す
  return 500;
}

/**
 * 非同期エラーをキャッチするラッパー
 *
 * Express の非同期ハンドラーでのエラーを適切にキャッチする
 */
export function asyncHandler<
  T extends Request = Request,
  U extends Response = Response,
>(fn: (req: T, res: U, next: NextFunction) => Promise<any>) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * エラーハンドリングの初期化
 *
 * 未処理のエラーとPromiseのrejectionをキャッチ
 */
export function initializeErrorHandling(): void {
  // 未処理のエラーをキャッチ
  process.on('uncaughtException', (error: Error) => {
    log.error('未処理の例外が発生しました', {
      error: error.message,
      stack: error.stack,
    });

    // 運用上のエラーでない場合はプロセスを終了
    if (!isOperationalError(error)) {
      log.error('プロセスを終了します');
      process.exit(1);
    }
  });

  // 未処理のPromise rejectionをキャッチ
  process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
    log.error('未処理のPromise rejectionが発生しました', {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });

    // エラーとして投げる（uncaughtExceptionでキャッチされる）
    throw reason;
  });

  // プロセス終了時の処理
  process.on('SIGTERM', () => {
    log.info(
      'SIGTERMシグナルを受信しました。グレースフルシャットダウンを開始します'
    );
    // ここでサーバーのクローズ処理などを行う
    process.exit(0);
  });

  process.on('SIGINT', () => {
    log.info(
      'SIGINTシグナルを受信しました。グレースフルシャットダウンを開始します'
    );
    // ここでサーバーのクローズ処理などを行う
    process.exit(0);
  });
}
