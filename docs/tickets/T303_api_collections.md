# T303: GET /api/collections エンドポイント

## 📋 基本情報
- **チケットID**: T303
- **タイトル**: GET /api/collections エンドポイント
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
利用可能なコレクションの一覧を取得するAPIエンドポイントを実装する。

## 📝 詳細説明
### 実装内容
1. **APIエンドポイント**
   ```typescript
   // src/routes/collections.ts
   GET /api/collections
   - パラメータなし
   - レスポンス: コレクション一覧
   ```

2. **レスポンス形式**
   ```json
   {
     "success": true,
     "data": {
       "collections": [
         {
           "id": "col_001",
           "name": "技術書",
           "bookCount": 45
         }
       ],
       "totalCount": 8
     }
   }
   ```

## ✅ 完了条件
- [ ] GET /api/collections エンドポイント実装
- [ ] コレクションデータ取得
- [ ] 書籍数カウント機能
- [ ] 適切なエラーハンドリング

## 🔗 依存関係
- **前提条件**: T102（DB接続）、T203（パス検出）
- **後続タスク**: T305（API統合テスト）