/**
 * 書籍・コレクション関連の型定義
 * Kindle書籍とコレクション情報の型定義
 */

/**
 * ASIN型定義（Amazon Standard Identification Number）
 * ASINは10文字の英数字
 */
export type ASIN = string;

/**
 * ASINの検証パターン
 */
export const ASIN_PATTERN: RegExp = /^[A-Z0-9]{10}$/;

/**
 * ASINの妥当性を検証する関数
 * @param asin - 検証対象のASIN
 * @returns 妥当な場合はtrue
 * @throws {Error} 無効なASINの場合
 */
export function validateAsin(asin: string): boolean {
  if (!asin || typeof asin !== 'string') {
    throw new Error('ASINが無効です');
  }
  if (!ASIN_PATTERN.test(asin)) {
    throw new Error(`無効なASIN形式: ${asin}`);
  }
  return true;
}

/**
 * 書籍情報の型定義
 */
export interface Book {
  /** Amazon Standard Identification Number */
  asin: ASIN;
  /** 書籍タイトル */
  title: string;
  /** 著者名 */
  author: string;
  /** 所属コレクション名の配列 */
  collections: string[];
  /** ユーザー定義タグの配列（Phase2で実装予定） */
  tags?: string[];
  /** 表紙画像URL（Phase2で実装予定） */
  coverUrl?: string;
  /** 最終更新日時（キャッシュ用、Phase3で実装予定） */
  lastUpdated?: string;
}

/**
 * コレクション情報の型定義
 */
export interface Collection {
  /** コレクションID */
  id: string;
  /** コレクション名 */
  name: string;
  /** 含まれる書籍数 */
  bookCount: number;
  /** コレクションの説明（Phase2で実装予定） */
  description?: string;
  /** コレクション作成日時（Phase2で実装予定） */
  createdAt?: string;
}

/**
 * タグ情報の型定義（Phase2で実装予定）
 */
export interface Tag {
  /** タグID */
  id: number;
  /** タグ名 */
  name: string;
  /** 関連書籍のASIN */
  bookAsin: ASIN;
  /** タグ作成日時 */
  createdAt: Date;
}

/**
 * 書籍の並び順オプション
 */
export type SortOrder =
  | 'title_asc' // タイトル昇順
  | 'title_desc' // タイトル降順
  | 'author_asc' // 著者昇順
  | 'author_desc' // 著者降順
  | 'recent' // 最近追加順（Phase2で実装予定）
  | 'oldest'; // 古い順（Phase2で実装予定）

/**
 * 書籍フィルタリングの設定
 */
export interface BookFilter {
  /** 検索クエリ（タイトル・著者名での検索） */
  search: string;
  /** フィルター対象のコレクションID（nullは全コレクション） */
  collection: string | null;
  /** ソート順 */
  sort: SortOrder;
  /** タグフィルター（Phase2で実装予定） */
  tags?: string[];
}

/**
 * 書籍一覧のメタデータ
 */
export interface BookListMetadata {
  /** 総書籍数 */
  totalCount: number;
  /** フィルター後の書籍数 */
  filteredCount: number;
  /** 最終同期日時 */
  lastSyncTime: string;
  /** 利用可能なコレクション一覧 */
  availableCollections: Collection[];
  /** 利用可能なタグ一覧（Phase2で実装予定） */
  availableTags?: Tag[];
}

/**
 * Kindle URLスキーム生成用の関数
 * @param asin - 対象書籍のASIN
 * @returns Kindle URL
 */
export function createKindleUrl(asin: ASIN): string {
  validateAsin(asin);
  return `kindle://book?action=open&asin=${asin}`;
}

/**
 * パフォーマンス目標値（CLAUDE.mdより）
 */
export const PERFORMANCE_TARGETS = {
  STARTUP_TIME: 3000, // 起動時間: 3秒以内
  SEARCH_TIME: 100, // 検索: 100ms以内
  VIEW_SWITCH: 500, // 表示切替: 500ms以内
  SYNC_TIME: 5000, // 同期: 5秒以内（1000冊）
} as const;

export type PerformanceTargetKey = keyof typeof PERFORMANCE_TARGETS;
