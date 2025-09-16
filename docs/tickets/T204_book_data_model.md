# T204: 書籍データモデル定義

## 📋 基本情報
- **チケットID**: T204
- **タイトル**: 書籍データモデル定義
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
XMLパーサーとSQLiteパーサーで取得したデータを統合し、アプリケーション全体で使用する書籍データモデルを定義・実装する。

## 📝 詳細説明
### 実装内容
1. **書籍データモデル**
   ```typescript
   // src/models/book.ts
   interface Book {
     asin: string;           // プライマリキー
     title: string;
     author: string;
     collections: string[];  // コレクション名の配列
     tags?: string[];        // タグの配列（Phase2）
     coverUrl?: string;      // 表紙画像URL（Phase2）
   }
   ```

2. **コレクションデータモデル**
   ```typescript
   interface Collection {
     id: string;
     name: string;
     bookCount: number;
   }
   ```

3. **データ統合サービス**
   ```typescript
   // src/services/bookDataService.ts
   - XML・SQLiteデータの統合
   - データ正規化・検証
   - 重複排除
   - データ変換
   ```

4. **型ガード・バリデーション**
   ```typescript
   - ASIN形式検証（10文字英数字）
   - 必須フィールドチェック
   - データ整合性検証
   ```

## ✅ 完了条件
- [ ] 書籍データモデル定義
- [ ] コレクションデータモデル定義
- [ ] データ統合サービス実装
- [ ] バリデーション機能
- [ ] 型安全性の確保

## 🔗 依存関係
- **前提条件**: T201（XMLパーサー）、T202（SQLiteパーサー）
- **後続タスク**: T301-T304（APIエンドポイント群）

## 🧪 検証方法
```bash
cd src/server
npm test -- bookDataService.test.ts
npm test -- book.test.ts
# 型チェック
npm run build
```

## 📚 参考資料
- API仕様書データフォーマット
- システムアーキテクチャ設計書
- TypeScript型設計ベストプラクティス

## 💡 実装ヒント
1. Phase1では必要最小限のフィールド
2. 将来拡張を考慮したインターフェース設計
3. immutableデータ構造の採用
4. 型安全なデータアクセス

## ⚠️ 注意事項
- データサイズ効率化（大量書籍対応）
- 文字エンコーディング問題への対応
- NULL/undefined値の適切な処理
- パフォーマンス目標との整合性