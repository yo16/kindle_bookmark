/**
 * Kindle書籍メタデータの型定義
 *
 * KindleSyncMetadataCache.xmlから抽出される書籍情報を定義
 * CLAUDE.mdのガイドラインに従い、セキュリティとパフォーマンスを重視
 */

// ASIN型定義（CLAUDE.mdのパターンに従う）
export type ASIN = string;

// ASINの検証パターン（CLAUDE.mdで定義済み）
export const ASIN_PATTERN: RegExp = /^[A-Z0-9]{10}$/;

/**
 * ASINの検証関数
 * @param asin 検証対象のASIN
 * @returns 検証成功時はtrue
 * @throws Error 無効なASIN形式の場合
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
 * 書籍の取得方法
 */
export type BookOriginType = 'Purchase' | 'KindleUnlimited';

/**
 * XMLから抽出される書籍メタデータ
 * サンプルファイルの構造に基づいて定義
 */
export interface BookMetadata {
  /** 書籍識別子（Amazon Standard Identification Number） */
  asin: ASIN;

  /** 書籍タイトル */
  title: string;

  /** タイトルの発音（読み方） - XMLのpronunciation属性 */
  titlePronunciation?: string;

  /** 著者名（複数の場合はカンマ区切り） */
  author: string;

  /** 著者の発音（読み方） */
  authorPronunciation?: string;

  /** 出版社 */
  publisher?: string;

  /** 出版日（ISO形式） */
  publicationDate?: string;

  /** 購入日（ISO形式） */
  purchaseDate?: string;

  /** コンテンツタイプ（通常は'EBOK'） */
  contentType?: string;

  /** MIMEタイプ */
  mimeType?: string;

  /** 書籍の取得方法 */
  originType?: BookOriginType;
}

/**
 * XML解析の内部構造（xml2jsの出力形式）
 * KindleSyncMetadataCache.xmlの実際の構造に基づく
 */
export interface KindleXMLStructure {
  response: {
    sync_time?: string;
    cache_metadata?: {
      version?: string;
    };
    add_update_list?: {
      meta_data: MetadataElement[] | MetadataElement;
    };
  };
}

/**
 * XMLの個別書籍メタデータ要素
 */
export interface MetadataElement {
  ASIN: string;
  title: string | { _?: string; $?: { pronunciation?: string } };
  authors?: {
    author: AuthorElement[] | AuthorElement | string;
  };
  publishers?: {
    publisher: string;
  };
  publication_date?: string;
  purchase_date?: string;
  textbook_type?: string;
  cde_contenttype?: string;
  content_type?: string;
  origins?: {
    origin:
      | {
          type: BookOriginType;
        }
      | {
          type: BookOriginType;
        }[];
  };
}

/**
 * XML著者要素の型定義
 */
export interface AuthorElement {
  _?: string;
  $?: {
    pronunciation?: string;
  };
}

/**
 * XML解析エラーの型定義
 */
export interface XMLParseError extends Error {
  code: 'XML_PARSE_ERROR' | 'XML_STRUCTURE_ERROR' | 'XML_VALIDATION_ERROR';
  filePath?: string;
  lineNumber?: number;
}

/**
 * XML解析統計情報
 */
export interface ParseStatistics {
  /** 処理された総書籍数 */
  totalBooks: number;

  /** 成功した解析数 */
  successCount: number;

  /** エラー発生数 */
  errorCount: number;

  /** 処理時間（ミリ秒） */
  processingTimeMs: number;

  /** ファイルサイズ（バイト） */
  fileSizeBytes: number;
}

/**
 * アプリケーション統合書籍データモデル
 * XMLパーサーとSQLiteパーサーから取得したデータを統合
 * Phase1での必要最小限のフィールドに特化
 */
export interface Book {
  /** 書籍識別子（Amazon Standard Identification Number） */
  asin: ASIN;

  /** 書籍タイトル */
  title: string;

  /** 著者名（複数の場合はカンマ区切り） */
  author: string;

  /** 所属するコレクション名の配列 */
  collections: string[];

  /** タグの配列（Phase2で実装予定） */
  tags?: string[];

  /** 表紙画像URL（Phase2で実装予定） */
  coverUrl?: string;

  /** 出版社（オプション） */
  publisher?: string;

  /** 出版日（ISO形式、オプション） */
  publicationDate?: string;

  /** 購入日（ISO形式、オプション） */
  purchaseDate?: string;
}

/**
 * コレクション情報のインターフェース
 * T204で定義される統合データモデル
 */
export interface Collection {
  /** コレクションの一意識別子 */
  id: string;

  /** コレクション名 */
  name: string;

  /** コレクションに含まれる書籍数 */
  bookCount: number;

  /** 最終更新日時（ISO形式） */
  lastUpdated?: string;
}

/**
 * 書籍とコレクションの関連付け情報
 * SQLiteの関連付けテーブルから取得される
 */
export interface BookCollectionAssociation {
  /** 書籍ASIN */
  bookAsin: ASIN;

  /** コレクションID */
  collectionId: string;
}

/**
 * Book型のガード関数
 * 型安全性を確保するための検証
 */
export function isValidBook(obj: unknown): obj is Book {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const book = obj as Record<string, unknown>;

  // 必須フィールドの検証
  if (!book.asin || typeof book.asin !== 'string') {
    return false;
  }

  if (!book.title || typeof book.title !== 'string') {
    return false;
  }

  if (!book.author || typeof book.author !== 'string') {
    return false;
  }

  if (!Array.isArray(book.collections)) {
    return false;
  }

  // ASINの形式検証
  try {
    validateAsin(book.asin);
  } catch {
    return false;
  }

  return true;
}

/**
 * Collection型のガード関数
 * 型安全性を確保するための検証
 */
export function isValidCollection(obj: unknown): obj is Collection {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const collection = obj as Record<string, unknown>;

  // 必須フィールドの検証
  if (!collection.id || typeof collection.id !== 'string') {
    return false;
  }

  if (!collection.name || typeof collection.name !== 'string') {
    return false;
  }

  if (typeof collection.bookCount !== 'number' || collection.bookCount < 0) {
    return false;
  }

  return true;
}

/**
 * 書籍データの検証エラー
 */
export class BookValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'BookValidationError';
  }
}

/**
 * 安全な書籍オブジェクトの作成
 * 入力データを検証してBookオブジェクトを生成
 */
export function createSafeBook(data: Partial<Book>): Book {
  // 必須フィールドの検証
  if (!data.asin) {
    throw new BookValidationError('ASINは必須です', 'asin', data.asin);
  }

  if (!data.title) {
    throw new BookValidationError('タイトルは必須です', 'title', data.title);
  }

  if (!data.author) {
    throw new BookValidationError('著者名は必須です', 'author', data.author);
  }

  // ASIN検証
  validateAsin(data.asin);

  // コレクション配列の正規化
  const collections = Array.isArray(data.collections) ? data.collections : [];

  // 安全なBookオブジェクトの作成
  const book: Book = {
    asin: data.asin as ASIN,
    title: data.title.trim(),
    author: data.author.trim(),
    collections: collections.filter((c) => typeof c === 'string' && c.trim()),
    publisher: data.publisher?.trim(),
    publicationDate: data.publicationDate?.trim(),
    purchaseDate: data.purchaseDate?.trim(),
  };

  // Phase2のフィールド（将来対応）
  if (data.tags && Array.isArray(data.tags)) {
    book.tags = data.tags.filter(
      (tag) => typeof tag === 'string' && tag.trim()
    );
  }

  if (data.coverUrl && typeof data.coverUrl === 'string') {
    book.coverUrl = data.coverUrl.trim();
  }

  return book;
}

/**
 * 安全なコレクションオブジェクトの作成
 * 入力データを検証してCollectionオブジェクトを生成
 */
export function createSafeCollection(data: Partial<Collection>): Collection {
  // 必須フィールドの検証
  if (!data.id) {
    throw new BookValidationError('コレクションIDは必須です', 'id', data.id);
  }

  if (!data.name) {
    throw new BookValidationError(
      'コレクション名は必須です',
      'name',
      data.name
    );
  }

  const bookCount = typeof data.bookCount === 'number' ? data.bookCount : 0;

  // 安全なCollectionオブジェクトの作成
  const collection: Collection = {
    id: data.id.trim(),
    name: data.name.trim(),
    bookCount: Math.max(0, bookCount), // 負の値は0に補正
    lastUpdated: data.lastUpdated?.trim(),
  };

  return collection;
}
