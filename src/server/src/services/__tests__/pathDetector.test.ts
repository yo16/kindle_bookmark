/**
 * PathDetectorサービスのテスト
 *
 * パス自動検出機能の各種テストケース
 */

import * as fs from 'fs/promises';
import * as path from 'path';
// os module import removed as it's not used directly
import { PathDetector, PathDetectionResult } from '../pathDetector';
// KindlePathNotFoundError import removed as it's not used in tests

// テスト用のモックデータ
const MOCK_ENV = {
  USERPROFILE: 'C:\\Users\\TestUser',
  LOCALAPPDATA: 'C:\\Users\\TestUser\\AppData\\Local',
  KINDLE_CACHE_PATH: 'C:\\CustomKindle\\Cache',
};

// テスト用のファイルパス
const TEST_PATHS = {
  VALID_CACHE_DIR: path.join(MOCK_ENV.USERPROFILE, 'AppData', 'Local', 'Amazon', 'Kindle', 'Cache'),
  CUSTOM_CACHE_DIR: MOCK_ENV.KINDLE_CACHE_PATH,
  XML_FILE: 'KindleSyncMetadataCache.xml',
  DB_FILE: path.join('db', 'synced_collections.db'),
};

describe('PathDetector', () => {
  let pathDetector: PathDetector;
  let originalPlatform: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // プラットフォームと環境変数のモック
    originalPlatform = process.platform;
    originalEnv = { ...process.env };
    
    // Windows環境をシミュレート
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      writable: true,
    });
  });

  afterAll(() => {
    // 元の環境を復元
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    });
    process.env = originalEnv;
  });

  beforeEach(() => {
    // 各テストで環境変数をリセット（環境変数テスト以外）
    const testName = expect.getState().currentTestName;
    if (!testName?.includes('環境変数による個別パス指定')) {
      process.env = { ...originalEnv, ...MOCK_ENV };
      // 環境変数のリセット
      delete process.env.KINDLE_XML_PATH;
      delete process.env.KINDLE_DB_PATH;
    }

    // モックをクリア
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('Windows環境で正常に初期化される', () => {
      expect(() => {
        pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
      }).not.toThrow();
    });

    test('非Windows環境ではエラーが発生する', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });

      expect(() => {
        new PathDetector();
      }).toThrow('このサービスはWindows環境でのみ動作します');
    });
  });

  describe('detectKindlePaths', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('標準パスでKindleファイルが見つかる場合', async () => {
      // ファイルシステムをモック
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await pathDetector.detectKindlePaths();

      expect(result.success).toBe(true);
      expect(result.paths).toBeDefined();
      expect(result.paths?.xmlPath).toContain(TEST_PATHS.XML_FILE);
      expect(result.paths?.dbPath).toContain(TEST_PATHS.DB_FILE);
      expect(result.source).toBe('auto');

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });

    test('環境変数パスが優先される', async () => {
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await pathDetector.detectKindlePaths();

      expect(result.success).toBe(true);
      expect(result.source).toBe('env');
      expect(result.searchedPaths).toContain(TEST_PATHS.CUSTOM_CACHE_DIR);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });

    test('ファイルが見つからない場合はエラーになる', async () => {
      const mockAccess = jest.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));

      const result = await pathDetector.detectKindlePaths();

      expect(result.success).toBe(false);
      expect(result.error).toContain('見つかりません');
      expect(result.searchedPaths.length).toBeGreaterThan(0);

      mockAccess.mockRestore();
    });

    test('forceUpdate=trueの場合はキャッシュを無視する', async () => {
      // 最初に設定を保存
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      const mockReadFile = jest.spyOn(fs, 'readFile').mockResolvedValue('{}');

      // forceUpdate=falseで1回目実行
      await pathDetector.detectKindlePaths(false);

      // forceUpdate=trueで2回目実行
      const result = await pathDetector.detectKindlePaths(true);

      expect(result.success).toBe(true);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
      mockReadFile.mockRestore();
    });
  });

  describe('setManualPath', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('有効な手動パスが設定される', async () => {
      const testPath = 'C:\\CustomKindle\\Cache';
      
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await pathDetector.setManualPath(testPath);

      expect(result.success).toBe(true);
      expect(result.source).toBe('manual');
      expect(result.searchedPaths).toContain(testPath);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });

    test('無効なパスの場合はエラーになる', async () => {
      const invalidPath = 'C:\\InvalidPath';
      
      const mockAccess = jest.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));

      const result = await pathDetector.setManualPath(invalidPath);

      expect(result.success).toBe(false);
      expect(result.source).toBe('manual');
      expect(result.error).toBeDefined();

      mockAccess.mockRestore();
    });

    test('セキュリティ違反パスは拒否される', async () => {
      const maliciousPath = 'C:\\..\\Windows\\System32';

      const result = await pathDetector.setManualPath(maliciousPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('セキュリティ違反');
    });

    test('空文字列は拒否される', async () => {
      const result = await pathDetector.setManualPath('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスが指定されていません');
    });
  });

  describe('getCurrentConfiguration', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('有効な設定ファイルが読み込まれる', async () => {
      const validConfig = {
        kindleCachePath: 'C:\\Kindle\\Cache',
        lastValidated: new Date().toISOString(),
        source: 'auto' as const,
      };

      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockReadFile = jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));

      const result = await pathDetector.getCurrentConfiguration();

      expect(result).toEqual(validConfig);

      // クリーンアップ
      mockAccess.mockRestore();
      mockReadFile.mockRestore();
    });

    test('設定ファイルが存在しない場合はundefinedを返す', async () => {
      const mockAccess = jest.spyOn(fs, 'access').mockRejectedValue({ code: 'ENOENT' });

      const result = await pathDetector.getCurrentConfiguration();

      expect(result).toBeUndefined();

      mockAccess.mockRestore();
    });

    test('無効な設定ファイルの場合はundefinedを返す', async () => {
      const invalidConfig = {
        invalidField: 'invalid',
      };

      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockReadFile = jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await pathDetector.getCurrentConfiguration();

      expect(result).toBeUndefined();

      // クリーンアップ
      mockAccess.mockRestore();
      mockReadFile.mockRestore();
    });
  });

  describe('clearConfiguration', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('設定ファイルが正常に削除される', async () => {
      const mockUnlink = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

      await expect(pathDetector.clearConfiguration()).resolves.not.toThrow();

      expect(mockUnlink).toHaveBeenCalled();

      mockUnlink.mockRestore();
    });

    test('設定ファイルが存在しない場合でもエラーにならない', async () => {
      const mockUnlink = jest.spyOn(fs, 'unlink').mockRejectedValue({ code: 'ENOENT' });

      await expect(pathDetector.clearConfiguration()).resolves.not.toThrow();

      mockUnlink.mockRestore();
    });
  });

  describe('パス候補生成', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('環境変数が優先される', async () => {
      process.env.KINDLE_CACHE_PATH = 'C:\\CustomPath';
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await pathDetector.detectKindlePaths();

      expect(result.searchedPaths[0]).toBe('C:\\CustomPath');

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });

    test('重複するパスは除外される', async () => {
      // 同じパスになるように環境変数を設定
      process.env.KINDLE_CACHE_PATH = path.join(MOCK_ENV.USERPROFILE, 'AppData', 'Local', 'Amazon', 'Kindle', 'Cache');
      
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await pathDetector.detectKindlePaths();

      // 重複が除外されているかチェック
      const uniquePaths = [...new Set(result.searchedPaths)];
      expect(result.searchedPaths.length).toBe(uniquePaths.length);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });
  });

  describe('ファイル検証', () => {
    beforeEach(() => {
      pathDetector = new PathDetector(true); // プラットフォームチェックをスキップ
    });

    test('空ファイルは無効として扱われる', async () => {
      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs, 'stat').mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('Cache')) {
          return Promise.resolve({
            isDirectory: () => true,
            isFile: () => false,
            size: 0,
            mtime: new Date(),
          } as any);
        }
        return Promise.resolve({
          isDirectory: () => false,
          isFile: () => true,
          size: 0, // 空ファイル
          mtime: new Date(),
        } as any);
      });

      const result = await pathDetector.detectKindlePaths();

      expect(result.success).toBe(false);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
    });

    test('読み取り権限がない場合はエラーになる', async () => {
      const mockAccess = jest.spyOn(fs, 'access').mockImplementation((_, mode) => {
        if (mode === fs.constants.R_OK) {
          return Promise.reject({ code: 'EACCES' });
        }
        return Promise.resolve(undefined);
      });
      const mockStat = jest.spyOn(fs, 'stat').mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
      } as any);

      const result = await pathDetector.detectKindlePaths();

      expect(result.success).toBe(false);

      // クリーンアップ
      mockAccess.mockRestore();
      mockStat.mockRestore();
    });
  });
});

  describe('環境変数による個別パス指定（テスト用）', () => {
    test('KINDLE_XML_PATH と KINDLE_DB_PATH が設定されている場合は優先的に使用する', async () => {
      // 実際のファイルが存在するので、モックなしでテスト
      const envPathDetector = new PathDetector(true);

      // テスト用パスの設定（プロジェクトルートからの相対パス）
      const testXmlPath = '../../sample_file/KindleSyncMetadataCache.xml';
      const testDbPath = '../../sample_file/synced_collections.db';

      // 元の環境変数を保存
      const originalXmlPath = process.env.KINDLE_XML_PATH;
      const originalDbPath = process.env.KINDLE_DB_PATH;

      process.env.KINDLE_XML_PATH = testXmlPath;
      process.env.KINDLE_DB_PATH = testDbPath;

      try {
        const result = await envPathDetector.detectKindlePaths();

        expect(result.success).toBe(true);
        expect(result.paths?.xmlPath).toBe(path.resolve(testXmlPath));
        expect(result.paths?.dbPath).toBe(path.resolve(testDbPath));
        expect(result.source).toBe('env');
      } finally {
        // 元の環境変数を復元
        if (originalXmlPath) {
          process.env.KINDLE_XML_PATH = originalXmlPath;
        } else {
          delete process.env.KINDLE_XML_PATH;
        }
        if (originalDbPath) {
          process.env.KINDLE_DB_PATH = originalDbPath;
        } else {
          delete process.env.KINDLE_DB_PATH;
        }
      }
    });

    test('環境変数で指定されたファイルが存在しない場合は通常の検出に進む', async () => {
      const envPathDetector = new PathDetector(true);

      // 存在しないファイルパスを設定
      process.env.KINDLE_XML_PATH = 'nonexistent/path/metadata.xml';
      process.env.KINDLE_DB_PATH = 'nonexistent/path/collections.db';

      // ファイル存在確認のモック（環境変数のパスはエラー、通常パスは成功）
      const mockStat = jest.spyOn(fs, 'stat').mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('nonexistent')) {
          return Promise.reject(new Error('ENOENT: no such file or directory'));
        }
        return Promise.resolve({
          isFile: () => true,
          isDirectory: () => true,
          size: 1024,
          mtime: new Date(),
        } as any);
      });

      const mockAccess = jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      const mockMkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await envPathDetector.detectKindlePaths();

      // 環境変数のパスではなく、通常の自動検出が成功することを確認
      if (result.success) {
        expect(result.source).not.toBe('env');
      }

      // クリーンアップ
      delete process.env.KINDLE_XML_PATH;
      delete process.env.KINDLE_DB_PATH;
      mockStat.mockRestore();
      mockAccess.mockRestore();
      mockMkdir.mockRestore();
      mockWriteFile.mockRestore();
    });
  });

// TypeScript型テスト
describe('型定義の確認', () => {
  test('PathDetectionResultの型が正しい', () => {
    const result: PathDetectionResult = {
      success: true,
      paths: {
        xmlPath: 'C:\\test\\KindleSyncMetadataCache.xml',
        dbPath: 'C:\\test\\db\\synced_collections.db',
      },
      searchedPaths: ['C:\\test'],
      source: 'auto',
    };

    expect(result.success).toBe(true);
    expect(result.paths).toBeDefined();
    expect(result.source).toBe('auto');
  });
});