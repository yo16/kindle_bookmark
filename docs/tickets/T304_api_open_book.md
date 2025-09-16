# T304: POST /api/books/{asin}/open エンドポイント

## 📋 基本情報
- **チケットID**: T304
- **タイトル**: POST /api/books/{asin}/open エンドポイント
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
指定した書籍をPC版Kindleアプリで開くためのAPIエンドポイントを実装する。

## 📝 詳細説明
### 実装内容
1. **APIエンドポイント**
   ```typescript
   // src/routes/books.ts
   POST /api/books/{asin}/open
   - パスパラメータ: asin（10文字英数字）
   - レスポンス: 実行結果
   ```

2. **Kindle起動処理**
   ```typescript
   // URLスキーム使用
   const kindleUrl = `kindle://book?action=open&asin=${asin}`;
   // child_process.exec() でコマンド実行
   ```

3. **レスポンス形式**
   ```json
   {
     "success": true,
     "data": {
       "asin": "B08XVZ7L5N",
       "title": "プログラミングTypeScript",
       "openedAt": "2025-01-15T10:00:00.000Z",
       "kindleUrl": "kindle://book?action=open&asin=B08XVZ7L5N"
     }
   }
   ```

## ✅ 完了条件
- [ ] POST /api/books/{asin}/open エンドポイント実装
- [ ] ASIN形式バリデーション
- [ ] URLスキーム起動機能
- [ ] エラーハンドリング（アプリ未起動等）

## 🔗 依存関係
- **前提条件**: T102（DB接続）
- **後続タスク**: T602（Kindleアプリ起動処理）、T305（API統合テスト）

## 🧪 検証方法
```bash
curl -X POST http://localhost:3001/api/books/B08XVZ7L5N/open
```

## ⚠️ 注意事項
- Windows環境限定
- Kindleアプリインストール必須
- URLスキーム登録状況の確認