/**
 * 書籍データ統合サービス
 *
 * XMLパーサーとSQLiteパーサーで取得したデータを統合し、
 * アプリケーション全体で使用する統一された書籍データを提供
 * CLAUDE.mdのパフォーマンス要件とセキュリティ要件を遵守
 */

import { KindleXMLParser } from './kindleParser';
import { KindleCollectionParser } from './collectionParser';
import { PathDetector } from './pathDetector';
import {
  Book,
  Collection,
  BookMetadata,
  ASIN,
  BookCollectionAssociation,
  createSafeBook,
  createSafeCollection,
  isValidBook,
  isValidCollection,
} from '../models/book';
import {
  KindleFileNotFoundError,
  KindleXmlParseError,
} from '../utils/errors';

// パフォーマンス目標値（CLAUDE.mdに従う）
const PERFORMANCE_TARGETS = {
  STARTUP_TIME: 3000, // 起動時間: 3秒以内
  SEARCH_TIME: 100, // 検索: 100ms以内
  VIEW_SWITCH: 500, // 表示切替: 500ms以内
  SYNC_TIME: 5000, // 同期: 5秒以内（1000冊）
} as const;

// エラーメッセージ（日本語、CLAUDE.mdに従う）
const INTEGRATION_ERRORS = {
  XML_PARSE_FAILED: 'XMLファイルの解析に失敗しました',
  SQLITE_PARSE_FAILED: 'SQLiteファイルの解析に失敗しました',
  DATA_MERGE_FAILED: 'データの統合に失敗しました',
  VALIDATION_FAILED: 'データの検証に失敗しました',
  PATH_DETECTION_FAILED: 'Kindleファイルパスの検出に失敗しました',
} as const;

import { log } from '../utils/logger';

/**
 * データ統合の統計情報
 */
export interface IntegrationStatistics {
  /** XML解析で取得した書籍数 */
  xmlBookCount: number;

  /** SQLite解析で取得したコレクション数 */
  sqliteCollectionCount: number;

  /** 統合後の最終書籍数 */
  finalBookCount: number;

  /** 統合後の最終コレクション数 */
  finalCollectionCount: number;

  /** データ重複排除で除外された書籍数 */
  duplicateBookCount: number;

  /** 検証エラーで除外された書籍数 */
  invalidBookCount: number;

  /** 全体の処理時間（ミリ秒） */
  totalProcessingTimeMs: number;

  /** 各フェーズの処理時間 */
  phaseTimings: {
    pathDetection: number;
    xmlParsing: number;
    sqliteParsing: number;
    dataIntegration: number;
    validation: number;
  };
}

/**
 * データ統合結果
 */
export interface BookDataIntegrationResult {
  /** 統合された書籍データ */
  books: Book[];

  /** コレクション情報 */
  collections: Collection[];

  /** 統合統計情報 */
  statistics: IntegrationStatistics;

  /** エラー情報（部分的な成功時） */
  errors?: string[];
}

/**
 * 書籍データ統合サービスクラス
 * Phase1のシンプルアプローチ：毎回Kindleファイルを読み込み（キャッシュなし）
 */
export class BookDataService {
  private readonly xmlParser: KindleXMLParser;
  private readonly collectionParser: KindleCollectionParser;
  private readonly pathDetector: PathDetector;

  constructor(skipPlatformCheck: boolean = false) {
    this.xmlParser = new KindleXMLParser(skipPlatformCheck);
    this.collectionParser = new KindleCollectionParser(skipPlatformCheck);
    this.pathDetector = new PathDetector(skipPlatformCheck);

    log.info('書籍データ統合サービスを初期化しました');
  }

  /**
   * 書籍データの完全統合
   * XMLとSQLiteから全データを取得し、統合された書籍情報を返す
   */
  async integrateAllBookData(): Promise<BookDataIntegrationResult> {
    const startTime = Date.now();
    const phaseTimings = {
      pathDetection: 0,
      xmlParsing: 0,
      sqliteParsing: 0,
      dataIntegration: 0,
      validation: 0,
    };

    log.info('書籍データの統合を開始します');

    try {
      // Phase 1: パス検出
      const pathStart = Date.now();
      const pathResult = await this.pathDetector.detectKindlePaths();
      if (!pathResult.success || !pathResult.paths) {
        throw new Error('Kindleファイルパスの検出に失敗しました');
      }
      const paths = pathResult.paths;
      phaseTimings.pathDetection = Date.now() - pathStart;

      log.info('Kindleファイルパスを検出しました', {
        xmlPath: paths.xmlPath,
        dbPath: paths.dbPath,
      });

      // Phase 2: XML解析（並行実行可能だが、シンプルさ優先で逐次実行）
      const xmlStart = Date.now();
      const xmlResult = await this.xmlParser.parseXMLFile(paths.xmlPath);
      phaseTimings.xmlParsing = Date.now() - xmlStart;

      log.info(`XMLから${xmlResult.books.length}冊の書籍を取得しました`);

      // Phase 3: SQLite解析
      const sqliteStart = Date.now();
      const sqliteResult = await this.collectionParser.parseCollectionDB(
        paths.dbPath
      );
      phaseTimings.sqliteParsing = Date.now() - sqliteStart;

      // コレクションの書籍数を更新
      this.collectionParser.updateBookCounts(
        sqliteResult.collections,
        sqliteResult.associations
      );

      log.info(
        `SQLiteから${sqliteResult.collections.length}個のコレクションを取得しました`
      );

      // Phase 4: データ統合
      const integrationStart = Date.now();
      const { books, collections, duplicateCount, invalidCount } =
        await this.mergeBookData(xmlResult.books, sqliteResult);
      phaseTimings.dataIntegration = Date.now() - integrationStart;

      // Phase 5: 最終検証
      const validationStart = Date.now();
      const { validBooks, validCollections, errors } =
        await this.validateIntegratedData(books, collections);
      phaseTimings.validation = Date.now() - validationStart;

      const totalTime = Date.now() - startTime;

      // 統計情報の構築
      const statistics: IntegrationStatistics = {
        xmlBookCount: xmlResult.books.length,
        sqliteCollectionCount: sqliteResult.collections.length,
        finalBookCount: validBooks.length,
        finalCollectionCount: validCollections.length,
        duplicateBookCount: duplicateCount,
        invalidBookCount: invalidCount,
        totalProcessingTimeMs: totalTime,
        phaseTimings,
      };

      // パフォーマンス目標チェック
      if (totalTime > PERFORMANCE_TARGETS.SYNC_TIME) {
        log.warn(
          `パフォーマンス目標を超過しました: ${totalTime}ms > ${PERFORMANCE_TARGETS.SYNC_TIME}ms`
        );
      }

      log.info('書籍データの統合が完了しました', {
        books: validBooks.length,
        collections: validCollections.length,
        processingTime: totalTime,
      });

      return {
        books: validBooks,
        collections: validCollections,
        statistics,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      log.error('書籍データの統合に失敗しました', error, {
        processingTime: totalTime,
      });

      // エラー時も部分的な統計情報を返す（現在は使用しない）

      if (error instanceof KindleFileNotFoundError) {
        throw error; // そのまま再スロー
      } else if (error instanceof KindleXmlParseError) {
        throw error; // そのまま再スロー
      } else {
        throw new Error(
          `${INTEGRATION_ERRORS.DATA_MERGE_FAILED}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  // detectKindlePaths メソッドは削除 - integrateAllBookData内で直接パス検出を実行

  /**
   * XMLとSQLiteデータの統合
   */
  private async mergeBookData(
    xmlBooks: BookMetadata[],
    sqliteResult: {
      collections: Collection[];
      associations: BookCollectionAssociation[];
    }
  ): Promise<{
    books: Book[];
    collections: Collection[];
    duplicateCount: number;
    invalidCount: number;
  }> {
    const books: Book[] = [];
    const collections: Collection[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    // ASIN -> コレクション名のマッピングを構築
    const asinToCollections = this.buildASINCollectionMapping(sqliteResult);

    // XMLの書籍データを統合Bookオブジェクトに変換
    const seenASINs = new Set<string>();

    for (const xmlBook of xmlBooks) {
      try {
        // 重複チェック
        if (seenASINs.has(xmlBook.asin)) {
          duplicateCount++;
          log.warn(`重複する書籍をスキップしました: ${xmlBook.asin}`);
          continue;
        }

        // コレクション情報の付加
        const bookCollections = asinToCollections.get(xmlBook.asin) || [];

        // 統合Bookオブジェクトの作成
        const book = createSafeBook({
          asin: xmlBook.asin,
          title: xmlBook.title,
          author: xmlBook.author,
          collections: bookCollections,
          publisher: xmlBook.publisher,
          publicationDate: xmlBook.publicationDate,
          purchaseDate: xmlBook.purchaseDate,
        });

        books.push(book);
        seenASINs.add(xmlBook.asin);
      } catch (error) {
        invalidCount++;
        log.warn(`無効な書籍データをスキップしました: ${xmlBook.asin}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // コレクション情報の変換
    for (const sqliteCollection of sqliteResult.collections) {
      try {
        const collection = createSafeCollection({
          id: sqliteCollection.id,
          name: sqliteCollection.name,
          bookCount: sqliteCollection.bookCount,
          lastUpdated: sqliteCollection.lastUpdated,
        });

        collections.push(collection);
      } catch (error) {
        log.warn(`無効なコレクションデータをスキップしました`, {
          collectionId: sqliteCollection.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log.info('データ統合フェーズが完了しました', {
      totalBooks: books.length,
      totalCollections: collections.length,
      duplicates: duplicateCount,
      invalid: invalidCount,
    });

    return { books, collections, duplicateCount, invalidCount };
  }

  /**
   * ASIN -> コレクション名のマッピングを構築
   */
  private buildASINCollectionMapping(sqliteResult: {
    collections: Collection[];
    associations: BookCollectionAssociation[];
  }): Map<string, string[]> {
    const asinToCollections = new Map<string, string[]>();

    // コレクションID -> 名前のマッピング
    const collectionIdToName = new Map<string, string>();
    for (const collection of sqliteResult.collections) {
      collectionIdToName.set(collection.id, collection.name);
    }

    // 関連付けを処理してマッピングを構築
    for (const association of sqliteResult.associations) {
      const collectionName = collectionIdToName.get(association.collectionId);
      if (!collectionName) {
        continue; // 名前が見つからないコレクションはスキップ
      }

      const asin = association.bookAsin;
      if (!asinToCollections.has(asin)) {
        asinToCollections.set(asin, []);
      }

      const collections = asinToCollections.get(asin)!;
      if (!collections.includes(collectionName)) {
        collections.push(collectionName);
      }
    }

    log.info(
      `${asinToCollections.size}冊の書籍にコレクション情報を関連付けました`
    );

    return asinToCollections;
  }

  /**
   * 統合データの最終検証
   */
  private async validateIntegratedData(
    books: Book[],
    collections: Collection[]
  ): Promise<{
    validBooks: Book[];
    validCollections: Collection[];
    errors: string[];
  }> {
    const validBooks: Book[] = [];
    const validCollections: Collection[] = [];
    const errors: string[] = [];

    // 書籍データの検証
    for (const book of books) {
      try {
        if (isValidBook(book)) {
          validBooks.push(book);
        } else {
          errors.push(
            `無効な書籍データ: ${(book as { asin?: string }).asin || 'unknown'}`
          );
        }
      } catch (error) {
        errors.push(
          `書籍検証エラー: ${(book as { asin?: string }).asin || 'unknown'} - ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // コレクションデータの検証
    for (const collection of collections) {
      try {
        if (isValidCollection(collection)) {
          validCollections.push(collection);
        } else {
          errors.push(
            `無効なコレクションデータ: ${(collection as { id?: string }).id || 'unknown'}`
          );
        }
      } catch (error) {
        errors.push(
          `コレクション検証エラー: ${(collection as { id?: string }).id || 'unknown'} - ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (errors.length > 0) {
      log.warn(`${errors.length}件の検証エラーが発生しました`);
    }

    log.info('最終検証が完了しました', {
      validBooks: validBooks.length,
      validCollections: validCollections.length,
      errors: errors.length,
    });

    return { validBooks, validCollections, errors };
  }

  /**
   * 特定のASINの書籍を取得
   * APIエンドポイントでの単発使用を想定
   */
  async getBookByASIN(asin: ASIN): Promise<Book | null> {
    try {
      // 完全統合を実行（Phase1のシンプルアプローチ）
      const result = await this.integrateAllBookData();

      const book = result.books.find((b) => b.asin === asin);
      return book || null;
    } catch (error) {
      log.error(`書籍取得エラー (ASIN: ${asin})`, error);
      return null;
    }
  }

  /**
   * サービスの健全性チェック
   * システム起動時やヘルスチェック用
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    errors: string[];
    performance: {
      pathDetectionMs: number;
      totalMs: number;
    };
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // パス検出の確認
      const pathStart = Date.now();
      const pathResult = await this.pathDetector.detectKindlePaths();
      if (!pathResult.success) {
        throw new Error('パス検出に失敗しました');
      }
      const pathDetectionMs = Date.now() - pathStart;

      const totalMs = Date.now() - startTime;

      return {
        isHealthy: true,
        errors: [],
        performance: {
          pathDetectionMs,
          totalMs,
        },
      };
    } catch (error) {
      const totalMs = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      return {
        isHealthy: false,
        errors,
        performance: {
          pathDetectionMs: 0,
          totalMs,
        },
      };
    }
  }
}

/**
 * デフォルトの書籍データサービスインスタンス
 * シングルトンパターンで提供
 */
let defaultServiceInstance: BookDataService | null = null;

/**
 * デフォルトの書籍データサービスを取得
 */
export function getBookDataService(): BookDataService {
  if (!defaultServiceInstance) {
    // テスト環境かどうかをチェック
    const isTestEnv = process.env.NODE_ENV === 'test';
    defaultServiceInstance = new BookDataService(isTestEnv);
  }
  return defaultServiceInstance;
}

/**
 * テスト用書籍データサービスを取得
 */
export function getTestBookDataService(): BookDataService {
  return new BookDataService(true); // skipPlatformCheck = true
}

/**
 * サービスインスタンスのリセット（テスト用）
 */
export function resetBookDataService(): void {
  defaultServiceInstance = null;
}
