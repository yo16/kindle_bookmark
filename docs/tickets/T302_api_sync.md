# T302: POST /api/sync エンドポイント

## 📋 基本情報
- **チケットID**: T302
- **タイトル**: POST /api/sync エンドポイント
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
Kindleキャッシュファイルから最新の蔵書データを読み込み、データ同期を実行するAPIエンドポイントを実装する。

## 📝 詳細説明
### 実装内容
1. **APIエンドポイント**
   ```typescript
   // src/routes/sync.ts
   POST /api/sync
   - リクエストボディ: { forceUpdate: boolean }
   - レスポンス: 同期結果・統計情報
   ```

2. **同期処理ロジック**
   ```typescript
   // Phase1: シンプル実装
   - 毎回ファイル読み込み（キャッシュなし）
   - XMLパーサー実行
   - SQLiteパーサー実行
   - データ統合
   ```

3. **レスポンス形式**
   ```json
   {
     "success": true,
     "data": {
       "syncedAt": "2025-01-15T10:00:00.000Z",
       "statistics": {
         "totalBooks": 245,
         "newBooks": 245,
         "updatedBooks": 0,
         "deletedBooks": 0,
         "collections": 8,
         "syncDuration": 2341
       },
       "implementation": "simple",
       "kindlePaths": {
         "metadataPath": "C:\\Users\\...",
         "collectionsPath": "C:\\Users\\..."
       }
     }
   }
   ```

4. **エラーハンドリング**
   - Kindleファイル未検出
   - ファイル解析エラー
   - 部分的データでの継続処理

## ✅ 完了条件
- [ ] POST /api/sync エンドポイント実装
- [ ] Kindleファイル読み込み機能
- [ ] データ同期処理
- [ ] 統計情報計算
- [ ] 適切なエラーレスポンス

## 🔗 依存関係
- **前提条件**: T203（パス検出）、T204（データモデル）
- **後続タスク**: T305（API統合テスト）

## 🧪 検証方法
```bash
cd src/server
npm test -- sync.test.ts
# 手動テスト
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{"forceUpdate": false}'
```

## 📚 参考資料
- API仕様書
- T201（XMLパーサー）実装
- T202（SQLiteパーサー）実装

## 💡 実装ヒント
1. Phase1では単純実装を優先
2. 処理時間の測定・レポート
3. 非同期処理でブロッキング回避
4. プログレス情報の提供

## ⚠️ 注意事項
- 大量データでのメモリ使用量
- ファイルI/O処理時間
- 同時実行制御（重複同期防止）
- タイムアウト設定