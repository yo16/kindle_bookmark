# T102: SQLite接続とDB初期化

## 📋 基本情報
- **チケットID**: T102
- **タイトル**: SQLite接続とDB初期化
- **優先度**: Low
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
**【Phase2機能】** SQLiteデータベースへの接続機能を実装し、アプリケーション独自データ用のテーブルを初期化する。

**注意**: この機能はMVP（Phase1）では不要です。Phase2のタグ機能実装時に実施してください。

## 📝 詳細説明
### 実装内容
1. **SQLite接続設定**
   ```typescript
   // src/config/database.ts
   - SQLite3を使用したDB接続
   - 接続プール設定
   - エラーハンドリング
   ```

2. **テーブル定義と初期化**
   ```sql
   -- app_settings: アプリケーション設定
   CREATE TABLE IF NOT EXISTS app_settings (
     key TEXT PRIMARY KEY,
     value TEXT,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

   -- tags: 書籍タグ管理（Phase2用）
   CREATE TABLE IF NOT EXISTS tags (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     book_asin TEXT NOT NULL,
     tag_name TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(book_asin, tag_name)
   );
   ```

3. **DB操作ユーティリティ**
   - 接続管理関数
   - トランザクション処理
   - クエリヘルパー

4. **マイグレーション機能**
   - スキーマバージョン管理
   - 自動マイグレーション実行

## ✅ 完了条件
- [ ] SQLite接続設定ファイル作成
- [ ] 基本テーブルの作成・初期化
- [ ] DB操作ユーティリティ実装
- [ ] 接続テスト成功
- [ ] エラーハンドリング実装

## 🔗 依存関係
- **前提条件**: T101（Express基本サーバー）
- **後続タスク**: T301-T304（APIエンドポイント群）

## 🧪 検証方法
```bash
cd src/server
npm test -- database.test.ts
npm run dev
# ログでDB初期化成功を確認
```

## 📚 参考資料
- SQLite3 Node.js ドキュメント
- システムアーキテクチャ設計書
- データベーススキーマ定義

## 💡 実装ヒント
1. データベースファイルパスは環境変数で管理
2. 開発・テスト・本番でDB分離
3. 接続エラー時の適切なフォールバック
4. パフォーマンスを考慮したインデックス設計

## ⚠️ 注意事項
- SQLiteファイルの権限設定
- 同時接続数の制限考慮
- ディスク容量不足時の対応
- バックアップ戦略の検討