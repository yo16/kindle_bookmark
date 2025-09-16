module.exports = {
  // 基本設定
  semi: true,                    // セミコロンを強制
  trailingComma: 'es5',         // ES5互換のトレーリングカンマ
  singleQuote: true,            // シングルクォートを使用
  printWidth: 80,               // 行の最大長
  tabWidth: 2,                  // インデントのタブ幅
  useTabs: false,               // スペースを使用（タブではなく）

  // TypeScript設定
  parser: 'typescript',

  // ファイル固有の設定
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 100,
        proseWrap: 'always',
      },
    },
  ],
};