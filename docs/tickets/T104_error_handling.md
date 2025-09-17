# T104: エラーハンドリング基盤

## 📋 基本情報
- **チケットID**: T104
- **タイトル**: エラーハンドリング基盤
- **優先度**: Medium
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: DONE

## 🎯 概要
Express アプリケーション全体で統一されたエラーハンドリング機構を実装し、適切な日本語エラーレスポンスを提供する。

## 📝 詳細説明
### 実装内容
1. **エラー型定義**
   ```typescript
   // src/types/errors.ts
   interface AppError extends Error {
     statusCode: number;
     code: string;
     details?: Record<string, any>;
   }
   ```

2. **カスタムエラークラス**
   ```typescript
   // src/utils/errors.ts
   - KindleFileNotFoundError
   - ParseError
   - DatabaseError
   - ValidationError
   ```

3. **グローバルエラーハンドラー**
   ```typescript
   // src/middleware/errorHandler.ts
   - Express error middleware
   - 統一レスポンス形式
   - ログ出力
   - 開発/本番環境での情報量調整
   ```

4. **エラーレスポンス形式**
   ```json
   {
     "success": false,
     "error": {
       "code": "KINDLE_FILES_NOT_FOUND",
       "message": "Kindleのキャッシュファイルが見つかりません",
       "details": { "searchedPaths": [...] }
     },
     "timestamp": "2025-01-15T10:00:00.000Z"
   }
   ```

## ✅ 完了条件
- [x] カスタムエラークラス実装
- [x] グローバルエラーハンドラー作成
- [x] 統一エラーレスポンス形式
- [x] 日本語エラーメッセージ
- [x] エラーロギング機能

## 🔗 依存関係
- **前提条件**: T101（Express基本サーバー）、T103（ログ設定）
- **後続タスク**: 全ての機能実装（エラー処理統一）

## 🧪 検証方法
```bash
cd src/server
npm test -- errorHandler.test.ts
# 各種エラーケースのテスト
curl http://localhost:3001/api/invalid-endpoint
```

## 📚 参考資料
- Express エラーハンドリング公式ガイド
- API仕様書エラー定義
- CLAUDE.md エラーハンドリング指針

## 💡 実装ヒント
1. エラーコードは定数で管理
2. スタックトレースは開発環境のみ出力
3. ユーザーフレンドリーなメッセージ
4. セキュリティ情報の漏洩防止

## ⚠️ 注意事項
- 機密情報を含むエラー詳細の制御
- パフォーマンスへの影響最小化
- ログ出力量の適切な管理
- 500エラー時の適切な対応