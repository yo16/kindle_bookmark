/**
 * KindleXMLParser テストファイル
 *
 * CLAUDE.mdのテスト指針に従い、セキュリティとパフォーマンスを検証
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { KindleXMLParser } from '../kindleParser.js';
import { BookMetadata, validateAsin } from '../../models/book.js';

// テスト用のサンプルファイルパス（CLAUDE.mdのパターンに従う）
const TEST_PATHS = {
  XML_SAMPLE: path.resolve(
    __dirname,
    '../../../../../sample_file/KindleSyncMetadataCache.xml'
  ),
  XML_INVALID: path.resolve(__dirname, './fixtures/invalid_metadata.xml'),
  XML_EMPTY: path.resolve(__dirname, './fixtures/empty_metadata.xml'),
  XML_LARGE: path.resolve(__dirname, './fixtures/large_metadata.xml'),
} as const;

describe('KindleXMLParser', () => {
  let parser: KindleXMLParser;

  beforeEach(() => {
    // Windows環境のモック（テスト環境での実行のため）
    if (!process.env.USERPROFILE) {
      process.env.USERPROFILE = 'C:\\Users\\TestUser';
    }

    parser = new KindleXMLParser();
  });

  describe('validateAsin', () => {
    it('有効なASINを受け入れる', () => {
      const validAsins = [
        'B0DVSBYJJ4',
        'B0CHRBQF7K',
        'B071FC7DKY',
        '1234567890',
      ];

      validAsins.forEach((asin) => {
        expect(() => validateAsin(asin)).not.toThrow();
        expect(validateAsin(asin)).toBe(true);
      });
    });

    it('無効なASINを拒否する', () => {
      const invalidAsins = [
        '',
        'invalid',
        'B0DVSBYJJ4X', // 11文字
        'B0DVSBYJJ', // 9文字
        'b0dvsbyjj4', // 小文字
        'B0DVSBYJJ@', // 記号含有
      ];

      invalidAsins.forEach((asin) => {
        expect(() => validateAsin(asin)).toThrow();
      });
    });

    it('null/undefinedを拒否する', () => {
      expect(() => validateAsin(null as any)).toThrow();
      expect(() => validateAsin(undefined as any)).toThrow();
    });
  });

  describe('KindleXMLParser初期化', () => {
    it('Windows環境で正常に初期化される', () => {
      expect(parser).toBeInstanceOf(KindleXMLParser);
    });

    it('USERPROFILE環境変数が未設定の場合はエラー', () => {
      delete process.env.USERPROFILE;
      expect(() => new KindleXMLParser()).toThrow(
        'Windows環境でのみ動作します'
      );

      // 環境変数を復元
      process.env.USERPROFILE = 'C:\\Users\\TestUser';
    });
  });

  describe('parseXMLFile', () => {
    it('サンプルファイルを正常に解析する', async () => {
      // サンプルファイルの存在確認
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        console.warn(
          'サンプルファイルが見つかりません。テストをスキップします。'
        );
        return;
      }

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);

      // 基本的な結果検証
      expect(result.books).toBeInstanceOf(Array);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalBooks).toBeGreaterThan(0);
      expect(result.statistics.successCount).toBeGreaterThan(0);
      expect(result.statistics.processingTimeMs).toBeGreaterThan(0);
      expect(result.statistics.fileSizeBytes).toBeGreaterThan(0);

      // 最初の書籍データの検証
      if (result.books.length > 0) {
        const firstBook = result.books[0];
        expect(firstBook.asin).toMatch(/^[A-Z0-9]{10}$/);
        expect(firstBook.title).toBeTruthy();
        expect(firstBook.author).toBeTruthy();
        expect(typeof firstBook.title).toBe('string');
        expect(typeof firstBook.author).toBe('string');
      }

      console.log(
        `サンプルファイル解析結果: ${result.books.length}冊、処理時間: ${result.statistics.processingTimeMs}ms`
      );
    }, 10000); // 10秒のタイムアウト

    it('パフォーマンス目標を満たす', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        console.warn(
          'サンプルファイルが見つかりません。パフォーマンステストをスキップします。'
        );
        return;
      }

      const startTime = Date.now();
      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const processingTime = Date.now() - startTime;

      // パフォーマンス目標（5秒以内）を検証
      expect(processingTime).toBeLessThan(5000);
      expect(result.statistics.processingTimeMs).toBeLessThan(5000);

      console.log(
        `パフォーマンステスト結果: ${processingTime}ms（目標: 5000ms以内）`
      );
    }, 10000);

    it('存在しないファイルでエラー', async () => {
      const nonExistentPath = path.join(
        process.env.USERPROFILE!,
        'AppData',
        'Local',
        'Amazon',
        'Kindle',
        'Cache',
        'nonexistent.xml'
      );

      await expect(parser.parseXMLFile(nonExistentPath)).rejects.toThrow(
        'Kindleのキャッシュファイルが見つかりません'
      );
    });

    it('不正なファイルパス（パストラバーサル）でエラー', async () => {
      const maliciousPath = '../../../etc/passwd.xml';

      await expect(parser.parseXMLFile(maliciousPath)).rejects.toThrow(
        'セキュリティ違反'
      );
    });

    it('Kindleキャッシュ外のファイルでエラー', async () => {
      const outsidePath = 'C:\\temp\\test.xml';

      await expect(parser.parseXMLFile(outsidePath)).rejects.toThrow(
        'セキュリティ違反'
      );
    });

    it('XML以外のファイルでエラー', async () => {
      const nonXmlPath = path.join(
        process.env.USERPROFILE!,
        'AppData',
        'Local',
        'Amazon',
        'Kindle',
        'Cache',
        'test.txt'
      );

      await expect(parser.parseXMLFile(nonXmlPath)).rejects.toThrow(
        'XMLファイルのみ処理可能です'
      );
    });

    it('大容量ファイルでエラー', async () => {
      // 10MBを超える仮想的なパス
      const largePath = path.join(
        process.env.USERPROFILE!,
        'AppData',
        'Local',
        'Amazon',
        'Kindle',
        'Cache',
        'large.xml'
      );

      // ファイルサイズチェックのモック
      const originalStat = fs.stat;
      jest.spyOn(fs, 'stat').mockResolvedValueOnce({
        isFile: () => true,
        size: 15 * 1024 * 1024, // 15MB
      } as any);

      await expect(parser.parseXMLFile(largePath)).rejects.toThrow(
        'XMLファイルが大きすぎます'
      );

      // モックを復元
      (fs.stat as jest.Mock).mockRestore();
    });
  });

  describe('書籍メタデータ検証', () => {
    it('必須フィールドが正しく抽出される', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        console.warn(
          'サンプルファイルが見つかりません。メタデータテストをスキップします。'
        );
        return;
      }

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const books = result.books;

      expect(books.length).toBeGreaterThan(0);

      // 各書籍の必須フィールドを検証
      books.forEach((book: BookMetadata, index: number) => {
        expect(book.asin).toBeTruthy();
        expect(book.asin).toMatch(/^[A-Z0-9]{10}$/);
        expect(book.title).toBeTruthy();
        expect(typeof book.title).toBe('string');
        expect(book.author).toBeTruthy();
        expect(typeof book.author).toBe('string');

        // オプショナルフィールドの型チェック
        if (book.titlePronunciation) {
          expect(typeof book.titlePronunciation).toBe('string');
        }
        if (book.publisher) {
          expect(typeof book.publisher).toBe('string');
        }
        if (book.publicationDate) {
          expect(typeof book.publicationDate).toBe('string');
          expect(() => new Date(book.publicationDate!)).not.toThrow();
        }
        if (book.purchaseDate) {
          expect(typeof book.purchaseDate).toBe('string');
          expect(() => new Date(book.purchaseDate!)).not.toThrow();
        }
      });

      // 最初の数冊の詳細データをログ出力
      const sampleBooks = books.slice(0, 3);
      console.log('サンプル書籍データ:');
      sampleBooks.forEach((book, index) => {
        console.log(
          `  ${index + 1}. ${book.title} / ${book.author} (${book.asin})`
        );
      });
    }, 10000);

    it('日付フィールドが正しく処理される', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) return;

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const booksWithDates = result.books.filter(
        (book) => book.publicationDate || book.purchaseDate
      );

      expect(booksWithDates.length).toBeGreaterThan(0);

      booksWithDates.forEach((book) => {
        if (book.publicationDate) {
          const pubDate = new Date(book.publicationDate);
          expect(pubDate.getTime()).not.toBeNaN();
          expect(pubDate.getFullYear()).toBeGreaterThan(1990);
          expect(pubDate.getFullYear()).toBeLessThan(2030);
        }

        if (book.purchaseDate) {
          const purDate = new Date(book.purchaseDate);
          expect(purDate.getTime()).not.toBeNaN();
          expect(purDate.getFullYear()).toBeGreaterThan(1990);
          expect(purDate.getFullYear()).toBeLessThan(2030);
        }
      });
    });

    it('著者情報が正しく処理される', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) return;

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const booksWithPronunciation = result.books.filter(
        (book) => book.authorPronunciation
      );

      // 発音情報がある書籍が一定数以上存在することを確認
      expect(booksWithPronunciation.length).toBeGreaterThan(0);

      booksWithPronunciation.slice(0, 5).forEach((book) => {
        console.log(`著者発音: ${book.author} (${book.authorPronunciation})`);
        expect(book.authorPronunciation).toBeTruthy();
        expect(typeof book.authorPronunciation).toBe('string');
      });
    });

    it('書籍の取得方法が正しく分類される', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) return;

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const booksWithOrigin = result.books.filter((book) => book.originType);

      expect(booksWithOrigin.length).toBeGreaterThan(0);

      const purchaseBooks = booksWithOrigin.filter(
        (book) => book.originType === 'Purchase'
      );
      const kindleUnlimitedBooks = booksWithOrigin.filter(
        (book) => book.originType === 'KindleUnlimited'
      );

      console.log(
        `取得方法統計: Purchase=${purchaseBooks.length}, KindleUnlimited=${kindleUnlimitedBooks.length}`
      );

      expect(purchaseBooks.length + kindleUnlimitedBooks.length).toBe(
        booksWithOrigin.length
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('破損したXMLファイルを適切に処理する', async () => {
      // 無効なXMLテストファイルを作成
      const invalidXmlPath = path.join(
        process.env.USERPROFILE!,
        'AppData',
        'Local',
        'Amazon',
        'Kindle',
        'Cache',
        'invalid_test.xml'
      );
      const invalidXmlContent =
        '<?xml version="1.0"?><response><unclosed-tag></response>';

      try {
        await fs.writeFile(invalidXmlPath, invalidXmlContent, 'utf8');

        await expect(parser.parseXMLFile(invalidXmlPath)).rejects.toThrow();
      } finally {
        // テストファイルをクリーンアップ
        await fs.unlink(invalidXmlPath).catch(() => {});
      }
    });

    it('空のXMLファイルを適切に処理する', async () => {
      const emptyXmlPath = path.join(
        process.env.USERPROFILE!,
        'AppData',
        'Local',
        'Amazon',
        'Kindle',
        'Cache',
        'empty_test.xml'
      );

      try {
        await fs.writeFile(emptyXmlPath, '', 'utf8');

        await expect(parser.parseXMLFile(emptyXmlPath)).rejects.toThrow(
          'XMLファイルが空です'
        );
      } finally {
        await fs.unlink(emptyXmlPath).catch(() => {});
      }
    });
  });

  describe('統計情報検証', () => {
    it('統計情報が正確に計算される', async () => {
      const fileExists = await fs
        .access(TEST_PATHS.XML_SAMPLE)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) return;

      const result = await parser.parseXMLFile(TEST_PATHS.XML_SAMPLE);
      const { books, statistics } = result;

      expect(statistics.totalBooks).toBe(books.length);
      expect(statistics.successCount).toBe(books.length);
      expect(statistics.errorCount).toBe(0);
      expect(statistics.processingTimeMs).toBeGreaterThan(0);
      expect(statistics.fileSizeBytes).toBeGreaterThan(0);

      // 統計情報の詳細ログ
      console.log('解析統計:');
      console.log(`  総書籍数: ${statistics.totalBooks}`);
      console.log(`  成功数: ${statistics.successCount}`);
      console.log(`  エラー数: ${statistics.errorCount}`);
      console.log(`  処理時間: ${statistics.processingTimeMs}ms`);
      console.log(`  ファイルサイズ: ${statistics.fileSizeBytes} bytes`);
    });
  });
});
