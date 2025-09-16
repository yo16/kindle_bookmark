# Kindle Bookmark Manager

自分で持つKindleの蔵書をリストアップし、PC版Kindleアプリで開くためのデスクトップアプリケーションです。

## 概要

このアプリケーションは、WindowsのKindleキャッシュファイルを読み取り、Webベースのインターフェースで書籍を管理・検索し、Kindleアプリで直接開くことができます。

## プロジェクト構造

```
kindle_bookmark/
├── src/                   # アプリケーションソースコード
│   ├── server/           # Node.js/Express バックエンド
│   │   ├── src/         # サーバーソースコード
│   │   ├── package.json # サーバー依存関係
│   │   └── tsconfig.json# サーバーTypeScript設定
│   └── client/           # React フロントエンド
│       ├── src/         # クライアントソースコード
│       ├── package.json # クライアント依存関係
│       └── tsconfig.json# クライアントTypeScript設定
├── docs/                 # プロジェクト文書
├── config/               # 設定ファイルテンプレート
├── scripts/              # ユーティリティスクリプト
├── data/                 # SQLiteデータベース用ディレクトリ
├── logs/                 # ログファイル用ディレクトリ
└── package.json          # ルートプロジェクト設定
```

## セットアップ

### 前提条件
- Node.js v18以上
- Windows OS（PC版Kindleアプリが必要）

### インストール

1. 依存関係のインストール：
```bash
# ルートプロジェクト
npm install

# サーバー
cd src/server && npm install && cd ../..

# クライアント
cd src/client && npm install && cd ../..
```

2. 環境変数の設定：
```bash
# サーバー
cp src/server/.env.example src/server/.env

# クライアント
cp src/client/.env.example src/client/.env
```

### 開発

```bash
# サーバー開発モード
npm run dev:server

# クライアント開発モード
npm run dev:client
```

### ビルド

```bash
# 全体ビルド
npm run build:all

# 個別ビルド
npm run build:server
npm run build:client
```

## 技術スタック

- **バックエンド**: Node.js, Express, TypeScript, SQLite
- **フロントエンド**: React, TypeScript, Axios
- **デスクトップ**: Electron
- **開発ツール**: ESLint, Jest

## ライセンス

MIT License

## 開発状況

現在MVP（Minimum Viable Product）フェーズの実装中です。
詳細な進捗については`docs/tickets/`ディレクトリを参照してください。
