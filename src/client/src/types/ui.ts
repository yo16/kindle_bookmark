/**
 * UI状態関連の型定義
 * ユーザーインターフェースの表示状態とユーザー操作に関する型定義
 */

import { SortOrder } from './book';

/**
 * 書籍表示モード
 */
export type ViewMode = 'grid' | 'list';

/**
 * アプリケーションの表示状態
 */
export type AppState =
  | 'loading' // 初期読み込み中
  | 'ready' // 正常表示
  | 'error' // エラー状態
  | 'syncing'; // 同期中

/**
 * フィルター状態の型定義
 */
export interface FilterState {
  /** 検索クエリ */
  search: string;
  /** 選択中のコレクションID（nullは全コレクション） */
  collection: string | null;
  /** ソート順 */
  sort: SortOrder;
  /** タグフィルター（Phase2で実装予定） */
  tags?: string[];
}

/**
 * UIの設定状態
 */
export interface UISettings {
  /** 書籍表示モード */
  viewMode: ViewMode;
  /** グリッド表示時の1行あたりの列数 */
  gridColumns: number;
  /** 検索デバウンス時間（ミリ秒） */
  searchDebounceMs: number;
  /** 1ページあたりの表示件数（Phase2で実装予定） */
  itemsPerPage?: number;
  /** ダークモード有効フラグ（Phase2で実装予定） */
  darkMode?: boolean;
}

/**
 * ローディング状態の詳細情報
 */
export interface LoadingState {
  /** 全体のローディング状態 */
  isLoading: boolean;
  /** 同期処理中フラグ */
  isSyncing: boolean;
  /** 書籍を開く処理中のASIN（複数同時対応） */
  openingBooks: string[];
  /** ローディングメッセージ（日本語） */
  message: string;
  /** 進捗率（0-100、Phase2で実装予定） */
  progress?: number;
}

/**
 * エラー状態の詳細情報
 */
export interface ErrorState {
  /** エラーが発生しているかどうか */
  hasError: boolean;
  /** エラーメッセージ（日本語） */
  message: string;
  /** エラーコード */
  code?: string;
  /** エラーの重要度 */
  severity: 'info' | 'warning' | 'error';
  /** エラー発生時刻 */
  timestamp: string;
  /** 再試行可能フラグ */
  retryable: boolean;
}

/**
 * 通知メッセージの型定義
 */
export interface NotificationMessage {
  /** 通知ID */
  id: string;
  /** 通知メッセージ（日本語） */
  message: string;
  /** 通知タイプ */
  type: 'success' | 'info' | 'warning' | 'error';
  /** 表示時間（ミリ秒、0は手動クリアが必要） */
  duration: number;
  /** 通知作成時刻 */
  createdAt: string;
  /** アクションボタン（Phase2で実装予定） */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * モーダルダイアログの状態
 */
export interface ModalState {
  /** モーダルが開いているかどうか */
  isOpen: boolean;
  /** モーダルのタイプ */
  type: 'confirm' | 'error' | 'info' | 'settings';
  /** モーダルのタイトル（日本語） */
  title: string;
  /** モーダルの内容（日本語） */
  content: string;
  /** 確認ダイアログのコールバック */
  onConfirm?: () => void;
  /** キャンセルダイアログのコールバック */
  onCancel?: () => void;
}

/**
 * 検索・フィルター用のUIイベント
 */
export interface SearchEvent {
  /** 検索クエリ */
  query: string;
  /** イベント発生時刻 */
  timestamp: number;
  /** 検索実行トリガー */
  trigger: 'input' | 'submit' | 'clear';
}

/**
 * 書籍アクションイベント
 */
export interface BookActionEvent {
  /** 対象書籍のASIN */
  asin: string;
  /** アクションの種類 */
  action: 'open' | 'select' | 'tag' | 'favorite';
  /** イベント発生時刻 */
  timestamp: number;
  /** 追加データ */
  data?: Record<string, any>;
}

/**
 * UIのデフォルト設定値
 */
export const DEFAULT_UI_SETTINGS: UISettings = {
  viewMode: 'grid',
  gridColumns: 4,
  searchDebounceMs: 300,
};

/**
 * エラーメッセージの定数（日本語）
 */
export const UI_ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  KINDLE_NOT_FOUND: 'Kindleアプリが見つかりません',
  FILE_READ_ERROR: 'ファイルの読み込みに失敗しました',
  PARSE_ERROR: 'データの解析に失敗しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;

export type UIErrorMessageKey = keyof typeof UI_ERROR_MESSAGES;

/**
 * 成功メッセージの定数（日本語）
 */
export const UI_SUCCESS_MESSAGES = {
  SYNC_COMPLETED: '同期が完了しました',
  BOOK_OPENED: '書籍を開きました',
  SETTINGS_SAVED: '設定を保存しました',
  TAG_ADDED: 'タグを追加しました',
  TAG_REMOVED: 'タグを削除しました',
} as const;

export type UISuccessMessageKey = keyof typeof UI_SUCCESS_MESSAGES;
