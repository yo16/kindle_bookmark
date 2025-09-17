/**
 * エラー型定義
 *
 * アプリケーション全体で使用するエラー型を定義
 */

/**
 * アプリケーションエラーの基本インターフェース
 */
export interface AppError extends Error {
  /** HTTPステータスコード */
  statusCode: number;
  /** エラーコード（定数で管理） */
  code: string;
  /** 追加詳細情報 */
  details?: Record<string, any>;
  /** エラーが運用上のもの（ユーザー操作ミス等）か */
  isOperational?: boolean;
}

/**
 * エラーレスポンスの型定義
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * 成功レスポンスの型定義
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * APIレスポンスの統一型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * エラーコード定数
 */
export const ERROR_CODES = {
  // Kindleファイル関連
  KINDLE_FILES_NOT_FOUND: 'KINDLE_FILES_NOT_FOUND',
  KINDLE_XML_PARSE_ERROR: 'KINDLE_XML_PARSE_ERROR',
  KINDLE_DB_PARSE_ERROR: 'KINDLE_DB_PARSE_ERROR',
  KINDLE_APP_NOT_FOUND: 'KINDLE_APP_NOT_FOUND',
  KINDLE_PATH_NOT_FOUND: 'KINDLE_PATH_NOT_FOUND',

  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_ASIN: 'INVALID_ASIN',
  INVALID_REQUEST: 'INVALID_REQUEST',

  // データベース関連
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',

  // システム関連
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  // その他
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * エラーメッセージ定数（日本語）
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Kindleファイル関連
  [ERROR_CODES.KINDLE_FILES_NOT_FOUND]:
    'Kindleのキャッシュファイルが見つかりません',
  [ERROR_CODES.KINDLE_XML_PARSE_ERROR]: 'XMLファイルの解析に失敗しました',
  [ERROR_CODES.KINDLE_DB_PARSE_ERROR]:
    'データベースファイルの解析に失敗しました',
  [ERROR_CODES.KINDLE_APP_NOT_FOUND]: 'Kindleアプリが見つかりません',
  [ERROR_CODES.KINDLE_PATH_NOT_FOUND]: 'Kindleのパスが見つかりません',

  // バリデーション関連
  [ERROR_CODES.VALIDATION_ERROR]: 'リクエストの検証に失敗しました',
  [ERROR_CODES.INVALID_ASIN]: '無効なASIN形式です',
  [ERROR_CODES.INVALID_REQUEST]: '無効なリクエストです',

  // データベース関連
  [ERROR_CODES.DATABASE_ERROR]: 'データベースエラーが発生しました',
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'データベースへの接続に失敗しました',

  // システム関連
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'サーバー内部エラーが発生しました',
  [ERROR_CODES.NOT_FOUND]: 'リソースが見つかりません',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: '許可されていないメソッドです',

  // その他
  [ERROR_CODES.UNKNOWN_ERROR]: '予期しないエラーが発生しました',
};
