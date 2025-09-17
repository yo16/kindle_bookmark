/**
 * カスタムエラークラス
 *
 * アプリケーション固有のエラークラスを定義
 */

import {
  AppError,
  ERROR_CODES,
  ERROR_MESSAGES,
  ErrorCode,
} from '../types/errors';

/**
 * ベースエラークラス
 */
export class BaseError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, any>,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Kindleファイルが見つからないエラー
 */
export class KindleFileNotFoundError extends BaseError {
  constructor(details?: { searchedPaths?: string[]; fileName?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.KINDLE_FILES_NOT_FOUND],
      404,
      ERROR_CODES.KINDLE_FILES_NOT_FOUND,
      details
    );
  }
}

/**
 * XML解析エラー
 */
export class KindleXmlParseError extends BaseError {
  constructor(details?: { fileName?: string; parseError?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.KINDLE_XML_PARSE_ERROR],
      500,
      ERROR_CODES.KINDLE_XML_PARSE_ERROR,
      details
    );
  }
}

/**
 * データベース解析エラー
 */
export class KindleDbParseError extends BaseError {
  constructor(details?: { fileName?: string; parseError?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.KINDLE_DB_PARSE_ERROR],
      500,
      ERROR_CODES.KINDLE_DB_PARSE_ERROR,
      details
    );
  }
}

/**
 * Kindleアプリが見つからないエラー
 */
export class KindleAppNotFoundError extends BaseError {
  constructor(details?: { attemptedUrl?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.KINDLE_APP_NOT_FOUND],
      404,
      ERROR_CODES.KINDLE_APP_NOT_FOUND,
      details
    );
  }
}

/**
 * Kindleパスが見つからないエラー
 */
export class KindlePathNotFoundError extends BaseError {
  constructor(details?: { path?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.KINDLE_PATH_NOT_FOUND],
      404,
      ERROR_CODES.KINDLE_PATH_NOT_FOUND,
      details
    );
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseError {
  constructor(
    message?: string,
    details?: { field?: string; value?: any; reason?: string }
  ) {
    super(
      message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
      400,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }
}

/**
 * 無効なASINエラー
 */
export class InvalidAsinError extends BaseError {
  constructor(asin: string) {
    super(
      ERROR_MESSAGES[ERROR_CODES.INVALID_ASIN],
      400,
      ERROR_CODES.INVALID_ASIN,
      { asin }
    );
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends BaseError {
  constructor(message?: string, details?: Record<string, any>) {
    super(
      message || ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
      500,
      ERROR_CODES.DATABASE_ERROR,
      details
    );
  }
}

/**
 * データベース接続エラー
 */
export class DatabaseConnectionError extends BaseError {
  constructor(details?: { connectionString?: string; error?: string }) {
    super(
      ERROR_MESSAGES[ERROR_CODES.DATABASE_CONNECTION_ERROR],
      500,
      ERROR_CODES.DATABASE_CONNECTION_ERROR,
      details
    );
  }
}

/**
 * 404エラー
 */
export class NotFoundError extends BaseError {
  constructor(resource?: string) {
    super(
      ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
      404,
      ERROR_CODES.NOT_FOUND,
      resource ? { resource } : undefined
    );
  }
}

/**
 * メソッド不許可エラー
 */
export class MethodNotAllowedError extends BaseError {
  constructor(method: string, allowedMethods: string[]) {
    super(
      ERROR_MESSAGES[ERROR_CODES.METHOD_NOT_ALLOWED],
      405,
      ERROR_CODES.METHOD_NOT_ALLOWED,
      { method, allowedMethods }
    );
  }
}

/**
 * ASINバリデーション関数
 */
export function validateAsin(asin: string): void {
  const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

  if (!asin || typeof asin !== 'string') {
    throw new InvalidAsinError(asin);
  }

  if (!ASIN_PATTERN.test(asin)) {
    throw new InvalidAsinError(asin);
  }
}

/**
 * エラーが運用上のものかどうかを判定
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: Record<string, any>
): {
  success: false;
  error: { code: string; message: string; details?: Record<string, any> };
  timestamp: string;
} {
  return {
    success: false,
    error: {
      code,
      message:
        message ||
        ERROR_MESSAGES[code] ||
        ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 成功レスポンスを作成
 */
export function createSuccessResponse<T>(data: T): {
  success: true;
  data: T;
  timestamp: string;
} {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
