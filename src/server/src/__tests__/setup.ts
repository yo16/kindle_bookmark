/**
 * Jest テスト環境セットアップ
 *
 * テスト実行時に必要な環境変数とモック設定を行う
 */

import path from 'path';

// テスト環境であることを明示
process.env.NODE_ENV = 'test';

// Windows環境シミュレーション（Linux環境でテスト実行のため）
process.env.USERPROFILE = '/mock/Users/TestUser';

// サンプルファイルへのパス設定（テスト用）
const sampleFileDir = path.join(__dirname, '../../../sample_file');
process.env.KINDLE_XML_PATH = path.join(sampleFileDir, 'KindleSyncMetadataCache.xml');
process.env.KINDLE_DB_PATH = path.join(sampleFileDir, 'synced_collections.db');

// テスト用Kindleキャッシュパス
process.env.KINDLE_CACHE_PATH = '/mock/Users/TestUser/AppData/Local/Amazon/Kindle/Cache';

// ログレベルを抑制（テスト実行時のノイズ削減）
process.env.LOG_LEVEL = 'error';

// Jest環境の設定
beforeEach(() => {
  // 各テスト前にJestのモックをクリア
  jest.clearAllMocks();
});

afterEach(() => {
  // 各テスト後にJestのモックを復元
  jest.restoreAllMocks();
});

// グローバルなテスト設定の型定義
declare global {
  namespace NodeJS {
    interface Global {
      __TEST_ENV__: boolean;
      createTestPathDetector: () => any;
      createTestKindleParser: () => any;
    }
  }
}

// テスト環境フラグの設定
(global as any).__TEST_ENV__ = true;

// テスト用のファクトリ関数を設定
(global as any).createTestPathDetector = () => {
  const { PathDetector } = require('../services/pathDetector');
  return new PathDetector(true); // skipPlatformCheck = true
};

(global as any).createTestKindleParser = () => {
  const { KindleXMLParser } = require('../services/kindleParser');
  return new KindleXMLParser(true); // skipPlatformCheck = true
};

// テスト用のBookDataServiceファクトリ関数も追加
(global as any).createTestBookDataService = () => {
  const { getTestBookDataService } = require('../services/bookDataService');
  return getTestBookDataService();
};