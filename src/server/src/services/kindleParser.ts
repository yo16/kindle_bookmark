/**
 * Kindle XMLパーサーサービス
 *
 * KindleSyncMetadataCache.xmlファイルを解析し、書籍メタデータを抽出
 * CLAUDE.mdのセキュリティ・パフォーマンス要件を厳格に遵守
 */

import * as fs from 'fs/promises';
import { Stats } from 'fs';
import * as xml2js from 'xml2js';
import * as path from 'path';
import {
  BookMetadata,
  ASIN,
  validateAsin,
  KindleXMLStructure,
  MetadataElement,
  AuthorElement,
  XMLParseError,
  ParseStatistics,
  BookOriginType
} from '../models/book.js';

// CLAUDE.mdのパフォーマンス目標値に従う
const PERFORMANCE_TARGETS = {
  STARTUP_TIME: 3000,    // 起動時間: 3秒以内
  SEARCH_TIME: 100,      // 検索: 100ms以内
  VIEW_SWITCH: 500,      // 表示切替: 500ms以内
  SYNC_TIME: 5000        // 同期: 5秒以内（1000冊）
} as const;

// CLAUDE.mdのエラー定義に従う
const KINDLE_ERRORS = {
  FILES_NOT_FOUND: 'Kindleのキャッシュファイルが見つかりません',
  PARSE_ERROR: 'ファイルの解析に失敗しました',
  APP_NOT_FOUND: 'Kindleアプリが見つかりません',
  XML_INVALID: 'XMLファイルの形式が無効です',
  SECURITY_ERROR: 'セキュリティ違反: 不正なファイルパスです'
} as const;

// ログ出力（CLAUDE.mdのパターンに従う）
type LogFunction = (message: string) => void;

const logger: Record<'info' | 'warn' | 'error', LogFunction> = {
  info: (message: string): void => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message: string): void => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message: string): void => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`)
};

/**
 * Kindle XML解析サービスクラス
 * セキュリティとパフォーマンスを重視した実装
 */
export class KindleXMLParser {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB制限
  private readonly EXPECTED_KINDLE_CACHE_DIR: string;

  constructor() {
    // Windows環境のKindleキャッシュディレクトリパス
    if (!process.env.USERPROFILE) {
      throw new Error('Windows環境でのみ動作します: USERPROFILE環境変数が見つかりません');
    }

    this.EXPECTED_KINDLE_CACHE_DIR = path.resolve(
      path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Amazon', 'Kindle', 'Cache')
    );

    logger.info(`Kindle XMLパーサーを初期化しました: ${this.EXPECTED_KINDLE_CACHE_DIR}`);
  }

  /**
   * XMLファイルを解析して書籍メタデータを抽出
   * @param xmlPath XMLファイルのパス
   * @returns 書籍メタデータ配列と統計情報
   */
  async parseXMLFile(xmlPath: string): Promise<{ books: BookMetadata[]; statistics: ParseStatistics }> {
    const startTime = Date.now();
    logger.info(`XMLファイルの解析を開始します: ${xmlPath}`);

    try {
      // セキュリティ検証（CLAUDE.mdのパストラバーサル防止）
      this.validateFilePath(xmlPath);

      // ファイル存在確認とサイズチェック
      const stats = await this.validateFileAccess(xmlPath);

      // XMLファイル読み込み（読み取り専用・UTF-8エンコーディング明示）
      const xmlData = await fs.readFile(xmlPath, { encoding: 'utf8', flag: 'r' });

      // XML解析
      const parsedXML = await this.parseXMLString(xmlData);

      // メタデータ抽出
      const books = this.extractBookMetadata(parsedXML);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      const statistics: ParseStatistics = {
        totalBooks: books.length,
        successCount: books.length,
        errorCount: 0,
        processingTimeMs: processingTime,
        fileSizeBytes: stats.size
      };

      // パフォーマンス目標チェック
      if (processingTime > PERFORMANCE_TARGETS.SYNC_TIME) {
        logger.warn(`パフォーマンス目標を超過しました: ${processingTime}ms > ${PERFORMANCE_TARGETS.SYNC_TIME}ms`);
      }

      logger.info(`XMLファイルの解析が完了しました: ${books.length}冊の書籍を処理（${processingTime}ms）`);
      return { books, statistics };

    } catch (error) {
      logger.error(`XMLファイルの解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);

      const xmlError: XMLParseError = new Error(`${KINDLE_ERRORS.PARSE_ERROR}: ${error instanceof Error ? error.message : String(error)}`) as XMLParseError;
      xmlError.code = 'XML_PARSE_ERROR';
      xmlError.filePath = xmlPath;
      throw xmlError;
    }
  }

  /**
   * ファイルパスのセキュリティ検証
   * パストラバーサル攻撃を防止
   */
  private validateFilePath(xmlPath: string): void {
    const normalizedPath = path.resolve(xmlPath);

    // Kindleキャッシュディレクトリ内のファイルのみ許可
    if (!normalizedPath.startsWith(this.EXPECTED_KINDLE_CACHE_DIR)) {
      logger.error(`セキュリティ違反: 不正なファイルパス: ${xmlPath}`);
      throw new Error(KINDLE_ERRORS.SECURITY_ERROR);
    }

    // XMLファイルのみ許可
    if (!normalizedPath.toLowerCase().endsWith('.xml')) {
      throw new Error('XMLファイルのみ処理可能です');
    }
  }

  /**
   * ファイルアクセスの検証
   */
  private async validateFileAccess(xmlPath: string): Promise<Stats> {
    try {
      const stats = await fs.stat(xmlPath);

      // ファイル存在確認
      if (!stats.isFile()) {
        throw new Error('指定されたパスはファイルではありません');
      }

      // ファイルサイズ制限チェック
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error(`XMLファイルが大きすぎます: ${stats.size} bytes > ${this.MAX_FILE_SIZE} bytes`);
      }

      // 空ファイルチェック
      if (stats.size === 0) {
        throw new Error('XMLファイルが空です');
      }

      return stats;

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(KINDLE_ERRORS.FILES_NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * XML文字列の解析
   */
  private async parseXMLString(xmlData: string): Promise<KindleXMLStructure> {
    const parser = new xml2js.Parser({
      explicitArray: false,    // 単一要素も配列化しない
      mergeAttrs: true,        // 属性をマージ
      trim: true,              // 余白削除
      normalize: false,        // タグ名正規化（大文字小文字保持）
      attrValueProcessors: [   // 属性値の処理
        (value: string) => value.trim()
      ],
      valueProcessors: [       // テキスト値の処理
        (value: string) => value.trim()
      ]
    });

    try {
      const result = await parser.parseStringPromise(xmlData);

      // 基本構造の検証
      if (!result || typeof result !== 'object') {
        throw new Error('XMLの基本構造が無効です');
      }

      return result as KindleXMLStructure;

    } catch (error) {
      const xmlError: XMLParseError = new Error(`XML解析エラー: ${error instanceof Error ? error.message : String(error)}`) as XMLParseError;
      xmlError.code = 'XML_STRUCTURE_ERROR';
      throw xmlError;
    }
  }

  /**
   * 解析されたXMLから書籍メタデータを抽出
   */
  private extractBookMetadata(parsedXML: KindleXMLStructure): BookMetadata[] {
    const books: BookMetadata[] = [];
    let errorCount = 0;

    try {
      // XML構造の確認
      const addUpdateList = parsedXML.response?.add_update_list;
      if (!addUpdateList || !addUpdateList.meta_data) {
        logger.warn('XMLに書籍データが見つかりません');
        return books;
      }

      // meta_dataを配列として処理（単一要素の場合も配列化）
      const metadataList = Array.isArray(addUpdateList.meta_data)
        ? addUpdateList.meta_data
        : [addUpdateList.meta_data];

      logger.info(`${metadataList.length}件の書籍メタデータを処理します`);

      // 大量データ処理（CLAUDE.mdのチャンク処理パターン）
      this.processLargeMetadataList(metadataList, books);

      if (errorCount > 0) {
        logger.warn(`${errorCount}件の書籍でメタデータ抽出エラーが発生しました`);
      }

      return books;

    } catch (error) {
      logger.error(`メタデータ抽出中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`${KINDLE_ERRORS.PARSE_ERROR}: メタデータ抽出失敗`);
    }
  }

  /**
   * 大量データ処理（CLAUDE.mdのパターンに従う）
   */
  private processLargeMetadataList(metadataList: MetadataElement[], books: BookMetadata[]): void {
    const CHUNK_SIZE = 100;

    for (let i = 0; i < metadataList.length; i += CHUNK_SIZE) {
      const chunk = metadataList.slice(i, i + CHUNK_SIZE);
      this.processMetadataChunk(chunk, books);

      // 大量処理の場合の進捗ログ
      if (metadataList.length > 1000 && (i + CHUNK_SIZE) % 500 === 0) {
        logger.info(`処理進捗: ${Math.min(i + CHUNK_SIZE, metadataList.length)}/${metadataList.length}冊`);
      }
    }
  }

  /**
   * メタデータチャンクの処理
   */
  private processMetadataChunk(chunk: MetadataElement[], books: BookMetadata[]): void {
    for (const metadata of chunk) {
      try {
        const book = this.extractSingleBookMetadata(metadata);
        if (book) {
          books.push(book);
        }
      } catch (error) {
        // 個別の書籍エラーはログ出力のみ（処理継続）
        logger.warn(`書籍メタデータの処理をスキップしました: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 単一書籍のメタデータ抽出
   */
  private extractSingleBookMetadata(metadata: MetadataElement): BookMetadata | null {
    try {
      // ASIN必須チェック
      if (!metadata.ASIN) {
        throw new Error('ASINが見つかりません');
      }

      const asin = metadata.ASIN.trim();
      validateAsin(asin);

      // タイトル抽出
      const { title, titlePronunciation } = this.extractTitle(metadata);
      if (!title) {
        throw new Error('タイトルが見つかりません');
      }

      // 著者情報抽出
      const { author, authorPronunciation } = this.extractAuthor(metadata);

      // 出版社抽出
      const publisher = this.extractPublisher(metadata);

      // 日付情報抽出
      const publicationDate = this.extractDate(metadata.publication_date);
      const purchaseDate = this.extractDate(metadata.purchase_date);

      // コンテンツ情報抽出
      const contentType = metadata.cde_contenttype;
      const mimeType = metadata.content_type;

      // 取得方法抽出
      const originType = this.extractOriginType(metadata);

      const book: BookMetadata = {
        asin: asin as ASIN,
        title,
        titlePronunciation,
        author: author || '不明',
        authorPronunciation,
        publisher,
        publicationDate,
        purchaseDate,
        contentType,
        mimeType,
        originType
      };

      return book;

    } catch (error) {
      logger.warn(`書籍メタデータ抽出エラー (ASIN: ${metadata.ASIN || 'unknown'}): ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * タイトルと発音の抽出
   */
  private extractTitle(metadata: MetadataElement): { title: string; titlePronunciation?: string } {
    if (typeof metadata.title === 'string') {
      return { title: metadata.title.trim() };
    }

    if (metadata.title && typeof metadata.title === 'object') {
      const title = metadata.title._ || metadata.title.toString();
      const titlePronunciation = metadata.title.$?.pronunciation;

      return {
        title: title.trim(),
        titlePronunciation: titlePronunciation?.trim()
      };
    }

    throw new Error('タイトル情報が無効です');
  }

  /**
   * 著者情報の抽出
   */
  private extractAuthor(metadata: MetadataElement): { author?: string; authorPronunciation?: string } {
    if (!metadata.authors?.author) {
      return { author: undefined };
    }

    const authorData = metadata.authors.author;

    // 文字列の場合
    if (typeof authorData === 'string') {
      return { author: authorData.trim() };
    }

    // 配列の場合
    if (Array.isArray(authorData)) {
      const authors: string[] = [];
      const pronunciations: string[] = [];

      for (const auth of authorData) {
        const { name, pronunciation } = this.extractSingleAuthor(auth);
        if (name) {
          authors.push(name);
          if (pronunciation) {
            pronunciations.push(pronunciation);
          }
        }
      }

      return {
        author: authors.length > 0 ? authors.join(', ') : undefined,
        authorPronunciation: pronunciations.length > 0 ? pronunciations.join(', ') : undefined
      };
    }

    // オブジェクトの場合
    const { name, pronunciation } = this.extractSingleAuthor(authorData);
    return {
      author: name,
      authorPronunciation: pronunciation
    };
  }

  /**
   * 単一著者情報の抽出
   */
  private extractSingleAuthor(author: AuthorElement | string): { name?: string; pronunciation?: string } {
    if (typeof author === 'string') {
      return { name: author.trim() };
    }

    if (author && typeof author === 'object') {
      const name = author._ || author.toString();
      const pronunciation = author.$?.pronunciation;

      return {
        name: name?.trim(),
        pronunciation: pronunciation?.trim()
      };
    }

    return {};
  }

  /**
   * 出版社の抽出
   */
  private extractPublisher(metadata: MetadataElement): string | undefined {
    return metadata.publishers?.publisher?.trim();
  }

  /**
   * 日付の抽出と検証
   */
  private extractDate(dateString?: string): string | undefined {
    if (!dateString) return undefined;

    const trimmed = dateString.trim();
    if (!trimmed) return undefined;

    // ISO形式の日付として妥当性チェック
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      logger.warn(`無効な日付形式: ${trimmed}`);
      return undefined;
    }

    return trimmed;
  }

  /**
   * 書籍取得方法の抽出
   */
  private extractOriginType(metadata: MetadataElement): BookOriginType | undefined {
    const origins = metadata.origins;
    if (!origins?.origin) return undefined;

    // 配列の場合は最初の要素を使用
    const origin = Array.isArray(origins.origin) ? origins.origin[0] : origins.origin;

    const type = origin?.type;
    if (type === 'Purchase' || type === 'KindleUnlimited') {
      return type;
    }

    return undefined;
  }
}