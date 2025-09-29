/**
 * 書籍データ管理サービス
 * 書籍の検索、フィルタリング、ソート機能を提供
 */

import { Book } from '../models/book';
import { getBookDataService } from './bookDataService';
import { log } from '../utils/logger';

// パフォーマンス目標値（ms）
const PERFORMANCE_TARGETS = {
  SEARCH_TIME: 100, // 検索処理: 100ms以内
} as const;

/**
 * 書籍検索パラメータの型定義
 */
export interface BookSearchParams {
  search?: string; // 検索キーワード（タイトル部分一致）
  collection?: string; // コレクション名フィルター
  sort?: string; // ソート順（title_asc, title_desc）
  limit?: number; // 取得件数上限
  offset?: number; // 取得開始位置
}

/**
 * 書籍検索結果の型定義
 */
export interface BookSearchResult {
  books: Book[]; // 書籍データ配列
  totalCount: number; // 総件数
  hasMore: boolean; // 次のページがあるかどうか
}

/**
 * 書籍管理サービスクラス
 */
export class BookService {
  private bookDataService = getBookDataService();
  private cachedBooks: Book[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  /**
   * 書籍一覧を取得
   * @param params 検索パラメータ
   * @returns 書籍検索結果
   */
  public async getBooks(params: BookSearchParams): Promise<BookSearchResult> {
    const startTime = Date.now();

    try {
      // 書籍データの取得（キャッシュまたは再読み込み）
      const allBooks = await this.getAllBooks();

      // 検索・フィルタリング処理
      let filteredBooks = [...allBooks];

      // タイトル検索（部分一致、大文字小文字区別なし）
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        const searchKatakana = this.hiraganaToKatakana(searchLower);
        const searchHiragana = this.katakanaToHiragana(searchLower);

        filteredBooks = filteredBooks.filter((book) => {
          const titleLower = book.title.toLowerCase();
          return (
            titleLower.includes(searchLower) ||
            titleLower.includes(searchKatakana) ||
            titleLower.includes(searchHiragana)
          );
        });

        log.debug(
          `検索フィルター適用: "${params.search}" → ${filteredBooks.length}件`
        );
      }

      // コレクションフィルター
      if (params.collection) {
        filteredBooks = filteredBooks.filter((book) =>
          book.collections.includes(params.collection!)
        );
        log.debug(
          `コレクションフィルター適用: "${params.collection}" → ${filteredBooks.length}件`
        );
      }

      // ソート処理
      this.sortBooks(filteredBooks, params.sort || 'title_asc');

      // ページネーション処理
      const totalCount = filteredBooks.length;
      const offset = params.offset || 0;
      const limit = params.limit || 1000;

      const paginatedBooks = filteredBooks.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      // パフォーマンス測定
      const processingTime = Date.now() - startTime;
      if (processingTime > PERFORMANCE_TARGETS.SEARCH_TIME) {
        log.warn(
          `検索処理が目標時間を超過: ${processingTime}ms (目標: ${PERFORMANCE_TARGETS.SEARCH_TIME}ms)`
        );
      }

      log.info(
        `書籍検索完了: 全${allBooks.length}件 → フィルター後${totalCount}件 → 返却${paginatedBooks.length}件 (${processingTime}ms)`
      );

      return {
        books: paginatedBooks,
        totalCount,
        hasMore,
      };
    } catch (error) {
      log.error('書籍検索エラー', error);
      throw new Error(
        `書籍データの検索に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      );
    }
  }

  /**
   * すべての書籍データを取得（キャッシュ機能付き）
   * @returns 書籍データ配列
   */
  private async getAllBooks(): Promise<Book[]> {
    const now = Date.now();

    // キャッシュが有効な場合はキャッシュから返す
    if (this.cachedBooks && now - this.lastCacheTime < this.CACHE_DURATION) {
      log.debug(`キャッシュから書籍データを取得: ${this.cachedBooks.length}件`);
      return this.cachedBooks;
    }

    // BookDataServiceから最新データを取得
    log.info('書籍データを再読み込み中...');
    const integrationResult = await this.bookDataService.integrateAllBookData();

    if (integrationResult.errors && integrationResult.errors.length > 0) {
      throw new Error(
        `書籍データの統合に失敗: ${integrationResult.errors.join(', ')}`
      );
    }

    // キャッシュを更新
    this.cachedBooks = integrationResult.books || [];
    this.lastCacheTime = now;

    log.info(`書籍データを更新: ${this.cachedBooks.length}件`);
    return this.cachedBooks;
  }

  /**
   * 書籍配列をソート（破壊的操作）
   * @param books ソート対象の書籍配列
   * @param sortType ソート種別
   */
  private sortBooks(books: Book[], sortType: string): void {
    switch (sortType) {
      case 'title_asc':
        books.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        break;
      case 'title_desc':
        books.sort((a, b) => b.title.localeCompare(a.title, 'ja'));
        break;
      default:
        // デフォルトはタイトル昇順
        books.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        log.debug(
          `不明なソート種別 "${sortType}" のため、タイトル昇順でソート`
        );
    }
  }

  /**
   * ひらがなをカタカナに変換
   * @param str 変換対象文字列
   * @returns カタカナに変換された文字列
   */
  private hiraganaToKatakana(str: string): string {
    return str.replace(/[\u3041-\u3096]/g, (match) => {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }

  /**
   * カタカナをひらがなに変換
   * @param str 変換対象文字列
   * @returns ひらがなに変換された文字列
   */
  private katakanaToHiragana(str: string): string {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  }

  /**
   * キャッシュをクリア（テスト用）
   */
  public clearCache(): void {
    this.cachedBooks = null;
    this.lastCacheTime = 0;
    log.debug('書籍データキャッシュをクリア');
  }

  /**
   * 利用可能なコレクション一覧を取得
   * @returns コレクション名の配列
   */
  public async getCollections(): Promise<string[]> {
    const books = await this.getAllBooks();
    const collectionSet = new Set<string>();

    books.forEach((book) => {
      book.collections.forEach((collection) => {
        collectionSet.add(collection);
      });
    });

    const collections = Array.from(collectionSet).sort((a, b) =>
      a.localeCompare(b, 'ja')
    );
    log.info(`コレクション一覧取得: ${collections.length}件`);

    return collections;
  }
}
