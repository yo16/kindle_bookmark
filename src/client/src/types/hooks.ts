/**
 * React Hooks関連の型定義
 * カスタムフックの戻り値とパラメータの型定義
 */

import { Book, Collection, BookFilter, ASIN } from './book';
import { FilterState, LoadingState, ErrorState, ViewMode } from './ui';
import { ApiResponse } from './api';

/**
 * useBooks フック戻り値の型定義
 * 書籍データを管理するカスタムフック
 */
export interface UseBooksResult {
  /** 書籍一覧データ */
  books: Book[];
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ（日本語） */
  error: string | null;
  /** 書籍データを再取得する関数 */
  refresh: () => Promise<void>;
  /** 書籍データを強制同期する関数 */
  sync: (forceUpdate?: boolean) => Promise<void>;
  /** 最終更新時刻 */
  lastUpdated: string | null;
}

/**
 * useFilter フック戻り値の型定義
 * フィルタリング機能を管理するカスタムフック
 */
export interface UseFilterResult {
  /** 現在のフィルター状態 */
  filter: FilterState;
  /** フィルター済み書籍一覧 */
  filteredBooks: Book[];
  /** 検索クエリを更新する関数 */
  setSearch: (search: string) => void;
  /** コレクションフィルターを更新する関数 */
  setCollection: (collection: string | null) => void;
  /** ソート順を更新する関数 */
  setSort: (sort: BookFilter['sort']) => void;
  /** フィルターをリセットする関数 */
  resetFilter: () => void;
  /** フィルター適用中フラグ */
  hasActiveFilter: boolean;
}

/**
 * useCollections フック戻り値の型定義
 * コレクション情報を管理するカスタムフック
 */
export interface UseCollectionsResult {
  /** コレクション一覧 */
  collections: Collection[];
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ（日本語） */
  error: string | null;
  /** コレクション情報を再取得する関数 */
  refresh: () => Promise<void>;
}

/**
 * useKindleLauncher フック戻り値の型定義
 * Kindleアプリ起動機能を管理するカスタムフック
 */
export interface UseKindleLauncherResult {
  /** 書籍を開く処理を実行する関数 */
  openBook: (asin: ASIN) => Promise<boolean>;
  /** 現在開こうとしている書籍のASIN一覧 */
  openingBooks: string[];
  /** 最後に発生したエラーメッセージ */
  lastError: string | null;
}

/**
 * useAppState フック戻り値の型定義
 * アプリケーション全体の状態を管理するカスタムフック
 */
export interface UseAppStateResult {
  /** アプリケーションの状態 */
  appState: 'loading' | 'ready' | 'error' | 'syncing';
  /** ローディング状態の詳細 */
  loadingState: LoadingState;
  /** エラー状態の詳細 */
  errorState: ErrorState;
  /** エラーを解消する関数 */
  clearError: () => void;
  /** アプリケーションを初期化する関数 */
  initialize: () => Promise<void>;
}

/**
 * useUISettings フック戻り値の型定義
 * UI設定を管理するカスタムフック
 */
export interface UseUISettingsResult {
  /** 現在の表示モード */
  viewMode: ViewMode;
  /** グリッド表示時の列数 */
  gridColumns: number;
  /** 表示モードを変更する関数 */
  setViewMode: (mode: ViewMode) => void;
  /** グリッド列数を変更する関数 */
  setGridColumns: (columns: number) => void;
  /** 設定をリセットする関数 */
  resetSettings: () => void;
}

/**
 * useLocalStorage フック戻り値の型定義
 * ローカルストレージを管理するカスタムフック
 */
export interface UseLocalStorageResult<T> {
  /** 現在の値 */
  value: T;
  /** 値を更新する関数 */
  setValue: (value: T) => void;
  /** 値を削除する関数 */
  removeValue: () => void;
  /** ローカルストレージが利用可能かどうか */
  isSupported: boolean;
}

/**
 * useApi フック戻り値の型定義
 * API呼び出しを管理する汎用カスタムフック
 */
export interface UseApiResult<T> {
  /** APIレスポンスデータ */
  data: T | null;
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** API呼び出しを実行する関数 */
  execute: (...args: any[]) => Promise<ApiResponse<T>>;
  /** 状態をリセットする関数 */
  reset: () => void;
}

/**
 * useDebounce フック戻り値の型定義
 * デバウンス機能を提供するカスタムフック
 */
export interface UseDebounceResult<T> {
  /** デバウンス処理された値 */
  debouncedValue: T;
  /** 現在デバウンス処理中かどうか */
  isPending: boolean;
  /** デバウンス処理をキャンセルする関数 */
  cancel: () => void;
}

/**
 * useNotification フック戻り値の型定義
 * 通知機能を管理するカスタムフック（Phase2で実装予定）
 */
export interface UseNotificationResult {
  /** 成功通知を表示する関数 */
  showSuccess: (message: string, duration?: number) => void;
  /** エラー通知を表示する関数 */
  showError: (message: string, duration?: number) => void;
  /** 情報通知を表示する関数 */
  showInfo: (message: string, duration?: number) => void;
  /** 警告通知を表示する関数 */
  showWarning: (message: string, duration?: number) => void;
  /** すべての通知をクリアする関数 */
  clearAll: () => void;
}

/**
 * usePagination フック戻り値の型定義
 * ページネーション機能を管理するカスタムフック（Phase2で実装予定）
 */
export interface UsePaginationResult {
  /** 現在のページ番号 */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 1ページあたりの項目数 */
  itemsPerPage: number;
  /** 現在ページの項目一覧 */
  currentItems: any[];
  /** 次のページに移動する関数 */
  nextPage: () => void;
  /** 前のページに移動する関数 */
  prevPage: () => void;
  /** 指定ページに移動する関数 */
  goToPage: (page: number) => void;
  /** ページサイズを変更する関数 */
  setItemsPerPage: (size: number) => void;
}

/**
 * フックのオプション設定の型定義
 */
export interface HookOptions {
  /** 自動リフレッシュの間隔（ミリ秒、Phase2で実装予定） */
  refreshInterval?: number;
  /** エラー時の自動リトライ回数 */
  retryCount?: number;
  /** キャッシュを有効にするか（Phase3で実装予定） */
  enableCache?: boolean;
  /** デバッグモードを有効にするか */
  debug?: boolean;
}
