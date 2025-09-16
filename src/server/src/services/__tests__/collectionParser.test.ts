/**
 * Kindle SQLiteパーサーのテスト
 *
 * collectionParser.tsの機能をテスト
 * モックデータを使用して安全にテスト実行
 */

import { KindleCollectionParser } from '../collectionParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

// モックの設定
jest.mock('fs/promises');
jest.mock('sqlite3');

describe('KindleCollectionParser', () => {
  let parser: KindleCollectionParser;
  const mockUserProfile = 'C:\\Users\\TestUser';
  const expectedCacheDir = path.join(mockUserProfile, 'AppData', 'Local', 'Amazon', 'Kindle', 'Cache');

  beforeEach(() => {
    // 環境変数の設定
    process.env.USERPROFILE = mockUserProfile;
    parser = new KindleCollectionParser();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    it('Windows環境でのみ動作する', () => {
      delete process.env.USERPROFILE;
      expect(() => new KindleCollectionParser()).toThrow('Windows環境でのみ動作します');
    });

    it('正しいキャッシュディレクトリパスを設定する', () => {
      const dbPath = parser.getDefaultDBPath();
      expect(dbPath).toContain('AppData\\Local\\Amazon\\Kindle\\Cache');
      expect(dbPath).toContain('synced_collections.db');
    });
  });

  describe('parseCollectionDB', () => {
    const validDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
    const invalidDBPath = 'C:\\invalid\\path\\test.db';

    beforeEach(() => {
      // ファイル統計情報のモック
      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024 * 1024 // 1MB
      });
    });

    it('不正なファイルパスを拒否する', async () => {
      await expect(parser.parseCollectionDB(invalidDBPath))
        .rejects
        .toThrow('セキュリティ違反: 不正なファイルパスです');
    });

    it('非SQLiteファイルを拒否する', async () => {
      const xmlPath = path.join(expectedCacheDir, 'test.xml');
      await expect(parser.parseCollectionDB(xmlPath))
        .rejects
        .toThrow('SQLiteデータベースファイルのみ処理可能です');
    });

    it('ファイルが存在しない場合エラーを返す', async () => {
      (fs.stat as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      await expect(parser.parseCollectionDB(validDBPath))
        .rejects
        .toThrow('Kindleのキャッシュファイルが見つかりません');
    });

    it('空のファイルを拒否する', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 0
      });

      await expect(parser.parseCollectionDB(validDBPath))
        .rejects
        .toThrow('データベースファイルが空です');
    });

    it('大きすぎるファイルを拒否する', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 100 * 1024 * 1024 // 100MB
      });

      await expect(parser.parseCollectionDB(validDBPath))
        .rejects
        .toThrow('データベースファイルが大きすぎます');
    });
  });

  describe('detectDBPath', () => {
    const defaultDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
    const altDBPath = path.join(expectedCacheDir, 'synced_collections.db');

    it('デフォルトパスでデータベースを検出する', async () => {
      (fs.access as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await parser.detectDBPath();
      expect(result).toBe(defaultDBPath);
    });

    it('代替パスでデータベースを検出する', async () => {
      (fs.access as jest.Mock)
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce(undefined);

      const result = await parser.detectDBPath();
      expect(result).toBe(altDBPath);
    });

    it('データベースが見つからない場合nullを返す', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await parser.detectDBPath();
      expect(result).toBeNull();
    });
  });

  describe('updateBookCounts', () => {
    it('コレクションごとの書籍数を正しく計算する', () => {
      const collections = [
        { id: 'col1', name: 'コレクション1', bookCount: 0 },
        { id: 'col2', name: 'コレクション2', bookCount: 0 },
        { id: 'col3', name: 'コレクション3', bookCount: 0 }
      ];

      const associations = [
        { collectionId: 'col1', bookAsin: 'B001234567' as any },
        { collectionId: 'col1', bookAsin: 'B001234568' as any },
        { collectionId: 'col2', bookAsin: 'B001234569' as any },
        { collectionId: 'col1', bookAsin: 'B001234570' as any }
      ];

      parser.updateBookCounts(collections, associations);

      expect(collections[0].bookCount).toBe(3); // col1
      expect(collections[1].bookCount).toBe(1); // col2
      expect(collections[2].bookCount).toBe(0); // col3
    });

    it('空の関連付けでもエラーにならない', () => {
      const collections = [
        { id: 'col1', name: 'コレクション1', bookCount: 0 }
      ];

      const associations: any[] = [];

      expect(() => parser.updateBookCounts(collections, associations)).not.toThrow();
      expect(collections[0].bookCount).toBe(0);
    });
  });

  describe('データベース操作（モック）', () => {
    it('読み取り専用モードでデータベースを開く', async () => {
      const mockDb = {
        configure: jest.fn(),
        close: jest.fn((callback) => callback(null)),
        all: jest.fn((_query, callback) => callback(null, []))
      };

      (sqlite3.Database as unknown as jest.Mock).mockImplementation((_path: any, mode: any, callback: any) => {
        expect(mode).toBe(sqlite3.OPEN_READONLY);
        setTimeout(() => callback(null), 0);
        return mockDb;
      });

      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024
      });

      const validDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
      const result = await parser.parseCollectionDB(validDBPath);

      expect(result).toHaveProperty('collections');
      expect(result).toHaveProperty('associations');
      expect(result).toHaveProperty('statistics');
    });

    it('データベースロックエラーを適切に処理する', async () => {
      (sqlite3.Database as unknown as jest.Mock).mockImplementation((_path, _mode, callback) => {
        callback(new Error('database is locked'));
      });

      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024
      });

      const validDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
      await expect(parser.parseCollectionDB(validDBPath))
        .rejects
        .toThrow('データベースファイルがロックされています');
    });

    it('無効なデータベースファイルを検出する', async () => {
      (sqlite3.Database as unknown as jest.Mock).mockImplementation((_path, _mode, callback) => {
        callback(new Error('file is not a database'));
      });

      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024
      });

      const validDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
      await expect(parser.parseCollectionDB(validDBPath))
        .rejects
        .toThrow('データベースファイルの形式が無効です');
    });
  });

  describe('パフォーマンス', () => {
    it('処理時間が目標を超過した場合に警告を出力する', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      const mockDb = {
        configure: jest.fn(),
        close: jest.fn((callback) => {
          // 処理時間をシミュレート
          setTimeout(() => callback(null), 100);
        }),
        all: jest.fn((_query, callback) => {
          // 大量データをシミュレート
          const mockData = Array(1000).fill(null).map((_, i) => ({
            id: `col${i}`,
            name: `Collection ${i}`
          }));
          callback(null, mockData);
        })
      };

      (sqlite3.Database as unknown as jest.Mock).mockImplementation((_path: any, _mode: any, callback: any) => {
        setTimeout(() => callback(null), 0);
        return mockDb;
      });

      (fs.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        size: 1024
      });

      // パフォーマンス目標を超過するようにモック
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(0)      // 開始時刻
        .mockReturnValueOnce(6000);  // 終了時刻（6秒後）

      const validDBPath = path.join(expectedCacheDir, 'db', 'synced_collections.db');
      await parser.parseCollectionDB(validDBPath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('パフォーマンス目標を超過しました')
      );
    });
  });
});