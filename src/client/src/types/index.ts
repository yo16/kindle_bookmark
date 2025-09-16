/**
 * 型定義エクスポートファイル
 * すべての型定義を集約してエクスポートする統合ファイル
 */

// API関連型定義
// 型の再インポート（型ガード関数で使用）
import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './api';

import type { ASIN, Book, Collection } from './book';

import { ASIN_PATTERN } from './book';

export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError,
  OpenBookRequest,
  OpenBookResponse,
  SyncRequest,
  SyncResponse,
  ApiRequestOptions,
  KindleErrorCode,
} from './api';

export { KINDLE_ERROR_CODES, KINDLE_ERROR_MESSAGES } from './api';

// 書籍・コレクション関連型定義
export type {
  ASIN,
  Book,
  Collection,
  Tag,
  SortOrder,
  BookFilter,
  BookListMetadata,
  PerformanceTargetKey,
} from './book';

export {
  ASIN_PATTERN,
  PERFORMANCE_TARGETS,
  validateAsin,
  createKindleUrl,
} from './book';

// UI状態関連型定義
export type {
  ViewMode,
  AppState,
  FilterState,
  UISettings,
  LoadingState,
  ErrorState,
  NotificationMessage,
  ModalState,
  SearchEvent,
  BookActionEvent,
  UIErrorMessageKey,
  UISuccessMessageKey,
} from './ui';

export {
  DEFAULT_UI_SETTINGS,
  UI_ERROR_MESSAGES,
  UI_SUCCESS_MESSAGES,
} from './ui';

// React Hooks関連型定義
export type {
  UseBooksResult,
  UseFilterResult,
  UseCollectionsResult,
  UseKindleLauncherResult,
  UseAppStateResult,
  UseUISettingsResult,
  UseLocalStorageResult,
  UseApiResult,
  UseDebounceResult,
  UseNotificationResult,
  UsePaginationResult,
  HookOptions,
} from './hooks';

/**
 * 型ガード関数：APIレスポンスが成功かどうかを判定
 * @param response - APIレスポンス
 * @returns 成功レスポンスの場合はtrue
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * 型ガード関数：APIレスポンスがエラーかどうかを判定
 * @param response - APIレスポンス
 * @returns エラーレスポンスの場合はtrue
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * 型ガード関数：値がASINかどうかを判定
 * @param value - 判定対象の値
 * @returns ASINの場合はtrue
 */
export function isValidAsin(value: unknown): value is ASIN {
  if (typeof value !== 'string') {
    return false;
  }
  return ASIN_PATTERN.test(value);
}

/**
 * 型ガード関数：オブジェクトがBookかどうかを判定
 * @param obj - 判定対象のオブジェクト
 * @returns Bookの場合はtrue
 */
export function isBook(obj: unknown): obj is Book {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const book = obj as Record<string, unknown>;
  return (
    typeof book.asin === 'string' &&
    typeof book.title === 'string' &&
    typeof book.author === 'string' &&
    Array.isArray(book.collections) &&
    book.collections.every((c) => typeof c === 'string')
  );
}

/**
 * 型ガード関数：オブジェクトがCollectionかどうかを判定
 * @param obj - 判定対象のオブジェクト
 * @returns Collectionの場合はtrue
 */
export function isCollection(obj: unknown): obj is Collection {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const collection = obj as Record<string, unknown>;
  return (
    typeof collection.id === 'string' &&
    typeof collection.name === 'string' &&
    typeof collection.bookCount === 'number'
  );
}

/**
 * ユーティリティ型：オプショナルなプロパティを持つ型を作成
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * ユーティリティ型：指定したプロパティを必須にする型を作成
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 型定義のバージョン情報
 * 型定義の変更を追跡するため
 */
export const TYPE_DEFINITIONS_VERSION = '1.0.0' as const;

/**
 * 開発時のデバッグ用型情報
 */
export interface TypeDebugInfo {
  version: string;
  createdAt: string;
  filesCount: number;
  typesCount: number;
}

export const DEBUG_INFO: TypeDebugInfo = {
  version: TYPE_DEFINITIONS_VERSION,
  createdAt: new Date().toISOString(),
  filesCount: 4, // api.ts, book.ts, ui.ts, hooks.ts
  typesCount: 50, // 概算の型定義数
};
