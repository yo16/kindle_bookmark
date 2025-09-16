module.exports = {
  // 基本設定
  semi: true,                    // セミコロンを強制
  trailingComma: 'es5',         // ES5互換のトレーリングカンマ
  singleQuote: true,            // シングルクォートを使用
  printWidth: 80,               // 行の最大長
  tabWidth: 2,                  // インデントのタブ幅
  useTabs: false,               // スペースを使用（タブではなく）

  // React/JSX設定
  jsxSingleQuote: true,         // JSXでもシングルクォートを使用
  bracketSameLine: false,       // JSXの閉じタグを新しい行に（新しい設定名）

  // ファイル固有の設定
  overrides: [
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        printWidth: 120,
      },
    },
    {
      files: '*.css',
      options: {
        parser: 'css',
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