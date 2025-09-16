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
