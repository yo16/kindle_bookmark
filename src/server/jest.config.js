module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],

  // テスト環境セットアップ
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // モック関連の設定（Jest spyOn問題の解決）
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  extensionsToTreatAsEsm: ['.ts'],

  // テストタイムアウトの設定
  testTimeout: 30000,

  // ログ出力の抑制
  silent: false,
  verbose: true
};