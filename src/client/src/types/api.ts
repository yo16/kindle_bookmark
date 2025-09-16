/**
 * API型定義ファイル
 * サーバーとの通信で使用するTypeScript型定義
 */

/**
 * API エラー情報
 */
export interface ApiError {
  code: string;
  message: string;
  details: Record<string, any>;
}

/**
 * API レスポンスの基本構造
 * @template T レスポンスデータの型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * 成功レスポンス（データあり）
 * @template T レスポンスデータの型
 */
export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
  error?: never;
}

/**
 * エラーレスポンス
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  data?: never;
  error: ApiError;
}

/**
 * 書籍を開くAPIのリクエストボディ
 */
export interface OpenBookRequest {
  asin: string;
}

/**
 * 書籍を開くAPIのレスポンス
 */
export interface OpenBookResponse {
  asin: string;
  opened: boolean;
  message: string;
}

/**
 * 同期APIのリクエストパラメータ
 */
export interface SyncRequest {
  forceUpdate?: boolean;
}

/**
 * 同期APIのレスポンス
 */
export interface SyncResponse {
  totalBooks: number;
  syncDuration: number;
  lastSyncTime: string;
  message: string;
}

/**
 * APIリクエストのオプション設定
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Kindleファイルエラーのコード
 */
export const KINDLE_ERROR_CODES = {
  FILES_NOT_FOUND: 'FILES_NOT_FOUND',
  PARSE_ERROR: 'PARSE_ERROR',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  INVALID_ASIN: 'INVALID_ASIN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type KindleErrorCode =
  (typeof KINDLE_ERROR_CODES)[keyof typeof KINDLE_ERROR_CODES];

/**
 * Kindleファイルエラーメッセージ（日本語）
 */
export const KINDLE_ERROR_MESSAGES: Record<KindleErrorCode, string> = {
  FILES_NOT_FOUND: 'Kindleのキャッシュファイルが見つかりません',
  PARSE_ERROR: 'ファイルの解析に失敗しました',
  APP_NOT_FOUND: 'Kindleアプリが見つかりません',
  INVALID_ASIN: '無効なASIN形式です',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
};
