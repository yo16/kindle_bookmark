/**
 * Kindle SQLiteパーサーサービス
 *
 * synced_collections.dbファイルを解析し、コレクション情報を抽出
 * CLAUDE.mdのセキュリティ・パフォーマンス要件を厳格に遵守
 */

import * as sqlite3 from 'sqlite3';
import * as path from 'path';

import * as fs from 'fs/promises';
import { Stats } from 'fs';
import { ASIN, validateAsin } from '../models/book.js';

// CLAUDE.mdのパフォーマンス目標値に従う
const PERFORMANCE_TARGETS = {
  STARTUP_TIME: 3000, // 起動時間: 3秒以内
  SEARCH_TIME: 100, // 検索: 100ms以内
  VIEW_SWITCH: 500, // 表示切替: 500ms以内
  SYNC_TIME: 5000, // 同期: 5秒以内（1000冊）
} as const;

// CLAUDE.mdのエラー定義に従う
const KINDLE_ERRORS = {
  FILES_NOT_FOUND: 'Kindleのキャッシュファイルが見つかりません',
  PARSE_ERROR: 'ファイルの解析に失敗しました',
  APP_NOT_FOUND: 'Kindleアプリが見つかりません',
  DB_INVALID: 'データベースファイルの形式が無効です',
  SECURITY_ERROR: 'セキュリティ違反: 不正なファイルパスです',
  DB_LOCKED: 'データベースファイルがロックされています',
} as const;

// ログ出力（CLAUDE.mdのパターンに従う）
type LogFunction = (message: string) => void;

const logger: Record<'info' | 'warn' | 'error', LogFunction> = {
  info: (message: string): void =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message: string): void =>
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message: string): void =>
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
};

/**
 * Kindleコレクション情報の型定義
 */
export interface KindleCollection {
  /** コレクションID（UUID形式） */
  id: string;

  /** コレクション名 */
  name: string;

  /** コレクションに含まれる書籍数 */
  bookCount: number;

  /** 最終更新日時 */
  lastUpdated?: string;
}

/**
 * コレクションと書籍の関連付け情報
 */
export interface CollectionBookAssociation {
  /** コレクションID */
  collectionId: string;

  /** 書籍のASIN */
  bookAsin: ASIN;
}

/**
 * SQLite解析統計情報
 */
export interface SQLiteParseStatistics {
  /** 処理されたコレクション総数 */
  totalCollections: number;

  /** 処理された関連付け総数 */
  totalAssociations: number;

  /** エラー発生数 */
  errorCount: number;

  /** 処理時間（ミリ秒） */
  processingTimeMs: number;

  /** データベースファイルサイズ（バイト） */
  fileSizeBytes: number;
}

/**
 * SQLite解析結果
 */
export interface CollectionParseResult {
  /** コレクション一覧 */
  collections: KindleCollection[];

  /** 書籍とコレクションの関連付け */
  associations: CollectionBookAssociation[];

  /** 統計情報 */
  statistics: SQLiteParseStatistics;
}

/**
 * Kindle SQLite解析サービスクラス
 * セキュリティとパフォーマンスを重視した実装
 */
export class KindleCollectionParser {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB制限
  private readonly EXPECTED_KINDLE_CACHE_DIR: string;
  private readonly DB_TIMEOUT = 5000; // 5秒タイムアウト

  constructor() {
    // Windows環境のKindleキャッシュディレクトリパス
    if (!process.env.USERPROFILE) {
      throw new Error(
        'Windows環境でのみ動作します: USERPROFILE環境変数が見つかりません'
      );
    }

    this.EXPECTED_KINDLE_CACHE_DIR = path.join(
      process.env.USERPROFILE,
      'AppData',
      'Local',
      'Amazon',
      'Kindle',
      'Cache'
    );

    logger.info(
      `Kindle コレクションパーサーを初期化しました: ${this.EXPECTED_KINDLE_CACHE_DIR}`
    );
  }

  /**
   * synced_collections.dbファイルを解析
   * @param dbPath データベースファイルのパス
   * @returns コレクション情報と統計
   */
  async parseCollectionDB(dbPath: string): Promise<CollectionParseResult> {
    const startTime = Date.now();
    logger.info(`SQLiteデータベースの解析を開始します: ${dbPath}`);

    try {
      // セキュリティ検証（CLAUDE.mdのパストラバーサル防止）
      this.validateFilePath(dbPath);

      // ファイル存在確認とサイズチェック
      const stats = await this.validateFileAccess(dbPath);

      // SQLiteデータベース接続（読み取り専用モード）
      let db: sqlite3.Database | null = null;

      try {
        db = await this.connectDatabase(dbPath);

        // コレクション情報の取得
        const collections = await this.fetchCollections(db);

        // 書籍との関連付け情報の取得
        const associations = await this.fetchAssociations(db);

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        const statistics: SQLiteParseStatistics = {
          totalCollections: collections.length,
          totalAssociations: associations.length,
          errorCount: 0,
          processingTimeMs: processingTime,
          fileSizeBytes: stats.size,
        };

        // パフォーマンス目標チェック
        if (processingTime > PERFORMANCE_TARGETS.SYNC_TIME) {
          logger.warn(
            `パフォーマンス目標を超過しました: ${processingTime}ms > ${PERFORMANCE_TARGETS.SYNC_TIME}ms`
          );
        }

        logger.info(
          `SQLiteデータベースの解析が完了しました: ${collections.length}個のコレクション、${associations.length}個の関連付けを処理（${processingTime}ms）`
        );

        return {
          collections,
          associations,
          statistics,
        };
      } finally {
        // データベース接続をクローズ
        if (db) {
          await this.closeDatabase(db);
        }
      }
    } catch (error) {
      logger.error(
        `SQLiteデータベースの解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );

      const dbError = new Error(
        `${KINDLE_ERRORS.PARSE_ERROR}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw dbError;
    }
  }

  /**
   * ファイルパスのセキュリティ検証
   * パストラバーサル攻撃を防止
   */
  private validateFilePath(dbPath: string): void {
    // SQLiteファイルのみ許可
    if (!dbPath.toLowerCase().endsWith('.db')) {
      throw new Error('SQLiteデータベースファイルのみ処理可能です');
    }

    // Kindleキャッシュディレクトリ内のファイルのみ許可
    // Windows環境でのパス比較（大文字小文字を無視）
    const normalizedPath = path.normalize(dbPath).toLowerCase();
    const expectedDir = this.EXPECTED_KINDLE_CACHE_DIR.toLowerCase();

    if (!normalizedPath.startsWith(expectedDir)) {
      logger.error(`セキュリティ違反: 不正なファイルパス: ${dbPath}`);
      throw new Error(KINDLE_ERRORS.SECURITY_ERROR);
    }
  }

  /**
   * ファイルアクセスの検証
   */
  private async validateFileAccess(dbPath: string): Promise<Stats> {
    try {
      const stats = await fs.stat(dbPath);

      // ファイル存在確認
      if (!stats.isFile()) {
        throw new Error('指定されたパスはファイルではありません');
      }

      // ファイルサイズ制限チェック
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error(
          `データベースファイルが大きすぎます: ${stats.size} bytes > ${this.MAX_FILE_SIZE} bytes`
        );
      }

      // 空ファイルチェック
      if (stats.size === 0) {
        throw new Error('データベースファイルが空です');
      }

      return stats;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        throw new Error(KINDLE_ERRORS.FILES_NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * SQLiteデータベースへの接続
   * @param dbPath データベースファイルパス
   * @returns データベース接続オブジェクト
   */
  private async connectDatabase(dbPath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      // 読み取り専用モードで開く（重要：Kindleファイルの破損を防ぐ）
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          logger.error(`データベース接続エラー: ${err.message}`);

          // エラー種別の判定
          if (err.message.includes('locked')) {
            reject(new Error(KINDLE_ERRORS.DB_LOCKED));
          } else if (err.message.includes('not a database')) {
            reject(new Error(KINDLE_ERRORS.DB_INVALID));
          } else {
            reject(err);
          }
        } else {
          logger.info('SQLiteデータベースに接続しました（読み取り専用モード）');

          // バスyタイムアウト設定
          db.configure('busyTimeout', this.DB_TIMEOUT);

          resolve(db);
        }
      });
    });
  }

  /**
   * データベース接続のクローズ
   */
  private async closeDatabase(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          logger.error(`データベースクローズエラー: ${err.message}`);
          reject(err);
        } else {
          logger.info('SQLiteデータベース接続をクローズしました');
          resolve();
        }
      });
    });
  }

  /**
   * コレクション情報の取得
   */
  private async fetchCollections(
    db: sqlite3.Database
  ): Promise<KindleCollection[]> {
    return new Promise((resolve, reject) => {
      const collections: KindleCollection[] = [];

      // Kindleのコレクションテーブルから情報を取得
      // 注意：実際のテーブル構造は事前調査が必要
      const query = `
        SELECT
          collection_uuid as id,
          collection_name as name,
          last_modified as lastUpdated
        FROM Collections
        WHERE is_archived = 0
        ORDER BY collection_name
      `;

      db.all(query, (err, rows: any[]) => {
        if (err) {
          // テーブルが存在しない場合の処理
          if (err.message.includes('no such table')) {
            logger.warn(
              'Collectionsテーブルが見つかりません。代替クエリを試行します。'
            );

            // 代替クエリ（テーブル名が異なる可能性）
            const altQuery = `
              SELECT name FROM sqlite_master
              WHERE type='table'
              ORDER BY name
            `;

            db.all(altQuery, (altErr, tables: any[]) => {
              if (altErr) {
                reject(altErr);
              } else {
                logger.info(
                  `利用可能なテーブル: ${tables.map((t) => t.name).join(', ')}`
                );
                // 空の配列を返して処理を継続
                resolve([]);
              }
            });
          } else {
            reject(err);
          }
        } else {
          // データ処理
          for (const row of rows || []) {
            try {
              const collection: KindleCollection = {
                id: row.id || '',
                name: row.name || '名称未設定',
                bookCount: 0, // 後で関連付けから計算
                lastUpdated: row.lastUpdated,
              };

              if (collection.id) {
                collections.push(collection);
              }
            } catch (parseError) {
              logger.warn(
                `コレクションデータの処理をスキップしました: ${parseError}`
              );
            }
          }

          logger.info(`${collections.length}個のコレクションを取得しました`);
          resolve(collections);
        }
      });
    });
  }

  /**
   * 書籍とコレクションの関連付け情報の取得
   */
  private async fetchAssociations(
    db: sqlite3.Database
  ): Promise<CollectionBookAssociation[]> {
    return new Promise((resolve, reject) => {
      const associations: CollectionBookAssociation[] = [];

      // 書籍とコレクションの関連テーブルから情報を取得
      const query = `
        SELECT
          collection_uuid as collectionId,
          asin as bookAsin
        FROM Collection_Item_Association
        WHERE item_type = 'BOOK'
        ORDER BY collection_uuid, asin
      `;

      db.all(query, (err, rows: any[]) => {
        if (err) {
          // テーブルが存在しない場合の処理
          if (err.message.includes('no such table')) {
            logger.warn(
              'Collection_Item_Associationテーブルが見つかりません。'
            );
            // 空の配列を返して処理を継続
            resolve([]);
          } else {
            reject(err);
          }
        } else {
          // データ処理（チャンク処理で大量データに対応）
          const CHUNK_SIZE = 100;
          const rowsToProcess = rows || [];

          for (let i = 0; i < rowsToProcess.length; i += CHUNK_SIZE) {
            const chunk = rowsToProcess.slice(i, i + CHUNK_SIZE);

            for (const row of chunk) {
              try {
                const asin = row.bookAsin;

                // ASIN検証
                if (asin && this.isValidAsinFormat(asin)) {
                  const association: CollectionBookAssociation = {
                    collectionId: row.collectionId || '',
                    bookAsin: asin as ASIN,
                  };

                  if (association.collectionId) {
                    associations.push(association);
                  }
                }
              } catch (parseError) {
                logger.warn(
                  `関連付けデータの処理をスキップしました: ${parseError}`
                );
              }
            }

            // 大量処理の場合の進捗ログ
            if (rowsToProcess.length > 1000 && (i + CHUNK_SIZE) % 500 === 0) {
              logger.info(
                `処理進捗: ${Math.min(i + CHUNK_SIZE, rowsToProcess.length)}/${rowsToProcess.length}件の関連付け`
              );
            }
          }

          logger.info(
            `${associations.length}個の書籍・コレクション関連付けを取得しました`
          );
          resolve(associations);
        }
      });
    });
  }

  /**
   * ASIN形式の簡易検証（完全な検証はvalidateAsin関数を使用）
   */
  private isValidAsinFormat(asin: string): boolean {
    try {
      return validateAsin(asin);
    } catch {
      return false;
    }
  }

  /**
   * コレクションごとの書籍数を計算して更新
   */
  updateBookCounts(
    collections: KindleCollection[],
    associations: CollectionBookAssociation[]
  ): void {
    // コレクションIDごとの書籍数をカウント
    const bookCountMap = new Map<string, number>();

    for (const association of associations) {
      const count = bookCountMap.get(association.collectionId) || 0;
      bookCountMap.set(association.collectionId, count + 1);
    }

    // コレクション情報を更新
    for (const collection of collections) {
      collection.bookCount = bookCountMap.get(collection.id) || 0;
    }

    logger.info('コレクションごとの書籍数を計算しました');
  }

  /**
   * デフォルトのデータベースパスを取得
   */
  getDefaultDBPath(): string {
    return path.join(
      this.EXPECTED_KINDLE_CACHE_DIR,
      'db',
      'synced_collections.db'
    );
  }

  /**
   * データベースパスの自動検出
   */
  async detectDBPath(): Promise<string | null> {
    const defaultPath = this.getDefaultDBPath();

    try {
      await fs.access(defaultPath);
      logger.info(`デフォルトパスでデータベースを検出: ${defaultPath}`);
      return defaultPath;
    } catch {
      logger.warn('デフォルトパスにデータベースが見つかりません');

      // 代替パスの探索
      const altPath = path.join(
        this.EXPECTED_KINDLE_CACHE_DIR,
        'synced_collections.db'
      );
      try {
        await fs.access(altPath);
        logger.info(`代替パスでデータベースを検出: ${altPath}`);
        return altPath;
      } catch {
        logger.error('synced_collections.dbファイルが見つかりません');
        return null;
      }
    }
  }
}
