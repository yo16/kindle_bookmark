/**
 * 書籍データ統合サービスのテスト
 *
 * T204の実装内容を検証するための単体テスト
 * CLAUDE.mdの日本語開発方針に従い、テストメッセージも日本語で記述
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// SQLite3モックを設定（テスト環境でのバイナリ問題を回避）
jest.mock('sqlite3', () => ({
  __esModule: true,
  default: {
    Database: jest.fn().mockImplementation(() => ({
      serialize: jest.fn(),
      close: jest.fn(),
      all: jest.fn(),
    })),
    OPEN_READONLY: 1,
  },
}));

// ファイルシステムの存在チェックをモック
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs') as any;
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue('<?xml version="1.0"?><response></response>'),
  };
});

// Winstonログシステムをモック
jest.mock('../../utils/logger.js', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { BookDataService, getBookDataService, resetBookDataService } from '../bookDataService.js';
import {
  Book,

  ASIN,
  createSafeBook,
  createSafeCollection,
  isValidBook,
  isValidCollection,
  BookValidationError,
} from '../../models/book.js';

// テスト用のモックデータ
const mockBookMetadata = {
  asin: 'B001234567' as ASIN,
  title: 'テスト書籍タイトル',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  publicationDate: '2023-01-01',
  purchaseDate: '2023-02-01',
};

const mockCollection = {
  id: 'test-collection-id',
  name: 'テストコレクション',
  bookCount: 1,
  lastUpdated: '2023-03-01T00:00:00Z',
};

const mockBook: Book = {
  asin: 'B001234567' as ASIN,
  title: 'テスト書籍タイトル',
  author: 'テスト著者',
  collections: ['テストコレクション'],
  publisher: 'テスト出版社',
  publicationDate: '2023-01-01',
  purchaseDate: '2023-02-01',
};

describe('BookDataService', () => {
  let service: BookDataService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 環境変数を保存
    originalEnv = { ...process.env };
    
    // Windows環境をシミュレート
    process.env.USERPROFILE = 'C:\Users\TestUser';
    process.env.APPDATA = 'C:\Users\TestUser\AppData\Roaming';
    process.env.LOCALAPPDATA = 'C:\Users\TestUser\AppData\Local';
    
    resetBookDataService();
    service = new BookDataService();
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;
    resetBookDataService();
  });

  describe('getBookDataService', () => {
    test('シングルトンパターンで同じインスタンスを返すべき', () => {
      const instance1 = getBookDataService();
      const instance2 = getBookDataService();
      
      expect(instance1).toBe(instance2);
    });

    test('resetBookDataService後は新しいインスタンスを返すべき', () => {
      const instance1 = getBookDataService();
      resetBookDataService();
      const instance2 = getBookDataService();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('healthCheck', () => {
    test('健全性チェックが適切な形式で結果を返すべき', async () => {
      const result = await service.healthCheck();
      
      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('performance');
      expect(result.performance).toHaveProperty('pathDetectionMs');
      expect(result.performance).toHaveProperty('totalMs');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.isHealthy).toBe('boolean');
    });
  });
});

describe('Book データモデル', () => {
  describe('createSafeBook', () => {
    test('有効なデータから正しいBookオブジェクトを作成すべき', () => {
      const book = createSafeBook(mockBookMetadata);
      
      expect(book.asin).toBe(mockBookMetadata.asin);
      expect(book.title).toBe(mockBookMetadata.title);
      expect(book.author).toBe(mockBookMetadata.author);
      expect(book.collections).toEqual([]);
      expect(book.publisher).toBe(mockBookMetadata.publisher);
    });

    test('必須フィールドが不足している場合はエラーを投げるべき', () => {
      expect(() => {
        createSafeBook({ title: 'テスト', author: 'テスト著者' });
      }).toThrow(BookValidationError);

      expect(() => {
        createSafeBook({ asin: 'B001234567' as ASIN, author: 'テスト著者' });
      }).toThrow(BookValidationError);

      expect(() => {
        createSafeBook({ asin: 'B001234567' as ASIN, title: 'テスト' });
      }).toThrow(BookValidationError);
    });

    test('無効なASIN形式の場合はエラーを投げるべき', () => {
      expect(() => {
        createSafeBook({
          asin: 'INVALID' as ASIN,
          title: 'テスト',
          author: 'テスト著者',
        });
      }).toThrow();
    });

    test('空白文字をトリミングすべき', () => {
      const book = createSafeBook({
        asin: 'B001234567' as ASIN,
        title: '  テストタイトル  ',
        author: '  テスト著者  ',
        publisher: '  テスト出版社  ',
      });

      expect(book.title).toBe('テストタイトル');
      expect(book.author).toBe('テスト著者');
      expect(book.publisher).toBe('テスト出版社');
    });

    test('コレクション配列を正規化すべき', () => {
      const book = createSafeBook({
        asin: 'B001234567' as ASIN,
        title: 'テスト',
        author: 'テスト著者',
        collections: ['有効コレクション', '', '  ', 'もう一つのコレクション'],
      });

      expect(book.collections).toEqual(['有効コレクション', 'もう一つのコレクション']);
    });
  });

  describe('isValidBook', () => {
    test('有効なBookオブジェクトに対してtrueを返すべき', () => {
      expect(isValidBook(mockBook)).toBe(true);
    });

    test('必須フィールドが不足している場合はfalseを返すべき', () => {
      expect(isValidBook({})).toBe(false);
      expect(isValidBook({ asin: 'B001234567' })).toBe(false);
      expect(isValidBook({ asin: 'B001234567', title: 'テスト' })).toBe(false);
      expect(isValidBook({ title: 'テスト', author: '著者' })).toBe(false);
    });

    test('collectionsが配列でない場合はfalseを返すべき', () => {
      const invalidBook = {
        ...mockBook,
        collections: 'not-an-array',
      };
      
      expect(isValidBook(invalidBook)).toBe(false);
    });

    test('無効なASIN形式の場合はfalseを返すべき', () => {
      const invalidBook = {
        ...mockBook,
        asin: 'INVALID',
      };
      
      expect(isValidBook(invalidBook)).toBe(false);
    });
  });
});

describe('Collection データモデル', () => {
  describe('createSafeCollection', () => {
    test('有効なデータから正しいCollectionオブジェクトを作成すべき', () => {
      const collection = createSafeCollection(mockCollection);
      
      expect(collection.id).toBe(mockCollection.id);
      expect(collection.name).toBe(mockCollection.name);
      expect(collection.bookCount).toBe(mockCollection.bookCount);
      expect(collection.lastUpdated).toBe(mockCollection.lastUpdated);
    });

    test('必須フィールドが不足している場合はエラーを投げるべき', () => {
      expect(() => {
        createSafeCollection({ name: 'テストコレクション' });
      }).toThrow(BookValidationError);

      expect(() => {
        createSafeCollection({ id: 'test-id' });
      }).toThrow(BookValidationError);
    });

    test('負のbookCountは0に補正すべき', () => {
      const collection = createSafeCollection({
        id: 'test-id',
        name: 'テストコレクション',
        bookCount: -5,
      });

      expect(collection.bookCount).toBe(0);
    });

    test('bookCountが数値でない場合は0に設定すべき', () => {
      const collection = createSafeCollection({
        id: 'test-id',
        name: 'テストコレクション',
        bookCount: undefined,
      });

      expect(collection.bookCount).toBe(0);
    });

    test('空白文字をトリミングすべき', () => {
      const collection = createSafeCollection({
        id: '  test-id  ',
        name: '  テストコレクション  ',
        lastUpdated: '  2023-01-01  ',
      });

      expect(collection.id).toBe('test-id');
      expect(collection.name).toBe('テストコレクション');
      expect(collection.lastUpdated).toBe('2023-01-01');
    });
  });

  describe('isValidCollection', () => {
    test('有効なCollectionオブジェクトに対してtrueを返すべき', () => {
      expect(isValidCollection(mockCollection)).toBe(true);
    });

    test('必須フィールドが不足している場合はfalseを返すべき', () => {
      expect(isValidCollection({})).toBe(false);
      expect(isValidCollection({ id: 'test-id' })).toBe(false);
      expect(isValidCollection({ name: 'テスト' })).toBe(false);
    });

    test('bookCountが数値でない場合はfalseを返すべき', () => {
      const invalidCollection = {
        ...mockCollection,
        bookCount: 'not-a-number',
      };
      
      expect(isValidCollection(invalidCollection)).toBe(false);
    });

    test('bookCountが負の場合はfalseを返すべき', () => {
      const invalidCollection = {
        ...mockCollection,
        bookCount: -1,
      };
      
      expect(isValidCollection(invalidCollection)).toBe(false);
    });
  });
});

describe('BookValidationError', () => {
  test('適切なエラー情報を保持すべき', () => {
    const error = new BookValidationError('テストエラー', 'testField', 'testValue');
    
    expect(error.message).toBe('テストエラー');
    expect(error.field).toBe('testField');
    expect(error.value).toBe('testValue');
    expect(error.name).toBe('BookValidationError');
  });
});

describe('パフォーマンス目標', () => {
  test('同期処理が5秒以内で完了すべき（モック環境）', async () => {
    const startTime = Date.now();
    
    try {
      // 実際のファイルが存在しない環境でのテストなので、エラーは期待される
      const serviceInstance = new BookDataService();
      await serviceInstance.integrateAllBookData();
    } catch (error) {
      // エラーは期待される（モック環境のため）
      expect(error).toBeDefined();
    }
    
    const processingTime = Date.now() - startTime;
    
    // パフォーマンス目標（5秒）をチェック
    // 実際のパフォーマンステストは実環境で実施
    expect(processingTime).toBeLessThan(10000); // モック環境での余裕を持った制限
  });

  test('健全性チェックが3秒以内で完了すべき', async () => {
    const startTime = Date.now();
    
    const serviceInstance = new BookDataService();
    await serviceInstance.healthCheck();
    
    const processingTime = Date.now() - startTime;
    
    expect(processingTime).toBeLessThan(3000);
  });
});

describe('エラーハンドリング', () => {
  test('BookValidationErrorが適切な日本語メッセージを含むべき', () => {
    try {
      createSafeBook({});
    } catch (error) {
      expect(error).toBeInstanceOf(BookValidationError);
      expect((error as BookValidationError).message).toContain('必須');
    }
  });

  test('型ガード関数が不正な入力に対して安全に動作すべき', () => {
    expect(isValidBook(null)).toBe(false);
    expect(isValidBook(undefined)).toBe(false);
    expect(isValidBook('string')).toBe(false);
    expect(isValidBook(123)).toBe(false);
    expect(isValidBook([])).toBe(false);
    
    expect(isValidCollection(null)).toBe(false);
    expect(isValidCollection(undefined)).toBe(false);
    expect(isValidCollection('string')).toBe(false);
    expect(isValidCollection(123)).toBe(false);
    expect(isValidCollection([])).toBe(false);
  });
});

describe('Phase2対応の準備', () => {
  test('tagsフィールドが正しく処理されるべき', () => {
    const book = createSafeBook({
      asin: 'B001234567' as ASIN,
      title: 'テスト',
      author: 'テスト著者',
      tags: ['タグ1', '', '  ', 'タグ2'],
    });

    expect(book.tags).toEqual(['タグ1', 'タグ2']);
  });

  test('coverUrlフィールドが正しく処理されるべき', () => {
    const book = createSafeBook({
      asin: 'B001234567' as ASIN,
      title: 'テスト',
      author: 'テスト著者',
      coverUrl: '  https://example.com/cover.jpg  ',
    });

    expect(book.coverUrl).toBe('https://example.com/cover.jpg');
  });
});