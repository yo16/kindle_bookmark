# Kindle蔵書管理システム - プロジェクト概要

## プロジェクト目的
個人のKindle蔵書をリストアップし、PC版Kindleアプリで書籍を直接開くことができるWebベースの書籍管理システム。

## 技術スタック
- **Backend**: Node.js + TypeScript + Express.js
- **Frontend**: React + TypeScript
- **Database**: SQLite3（Kindle既存データ読み取り専用）
- **Bundler**: Electron（デスクトップアプリ配布）
- **Build Tool**: TypeScript Compiler, React Scripts
- **Test**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## プロジェクト構造
```
kindle_bookmark/
├── src/
│   ├── server/           # Backend（Node.js + Express）
│   │   ├── src/
│   │   │   ├── routes/   # APIエンドポイント
│   │   │   ├── services/ # ビジネスロジック
│   │   │   ├── models/   # データモデル
│   │   │   ├── utils/    # ユーティリティ
│   │   │   └── middleware/ # ミドルウェア
│   │   └── package.json
│   └── client/           # Frontend（React）
│       ├── src/
│       └── package.json
├── docs/                 # 仕様書・チケット
├── sample_file/          # テスト用Kindleファイル
└── package.json          # ルートパッケージ
```

## 現在の進捗状況
### 完了済みチケット
- T001-T004: プロジェクト基盤構築
- T101, T103-T104: Express基本サーバー・ログ・エラーハンドリング
- T201-T204: Kindleファイルパーサー・データモデル定義
- T301: 書籍一覧取得API実装
- T401-T402: React基本アプリ・型定義

### 現在の実装状況
- GET /api/books エンドポイント（T301）は実装完了
- 書籍検索・フィルター・ソート・ページネーション機能実装済み
- 包括的なテストスイート（単体・統合テスト）
- Kindle XMLファイルパーサー実装済み
- SQLite collectionsパーサー実装済み

## 重要な制約・要件
- Windows環境限定（PC版Kindle必須）
- Kindleファイルは読み取り専用
- データ外部送信禁止（ローカル動作限定）
- パフォーマンス目標: 検索100ms以内、起動3秒以内

## 開発方針
- すべてのコメント・ログ・エラーメッセージは日本語
- 変数名・関数名は英語（日本語コメント併記）
- TypeScript strict mode使用
- 段階的実装（MVP → Phase2拡張）