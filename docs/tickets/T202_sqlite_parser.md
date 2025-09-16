# T202: SQLiteパーサー実装

## 📋 基本情報
- **チケットID**: T202
- **タイトル**: SQLiteパーサー実装
- **優先度**: Critical
- **見積もり**: 1日（8時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
Kindleのsynced_collections.dbファイルを解析し、書籍のコレクション情報を取得するパーサーを実装する。

## 📝 詳細説明
### 実装内容
1. **SQLiteパーサーサービス**
   ```typescript
   // src/services/collectionParser.ts
   - synced_collections.db読み込み
   - コレクションテーブル解析
   - 書籍とコレクションの関連付け
   - エラーハンドリング
   ```

2. **データ構造解析**
   ```sql
   -- Kindleコレクションテーブル構造解析
   - Collections テーブル
   - Collection_Book_Association テーブル
   - 主キー・外部キー関係
   ```

3. **型定義**
   ```typescript
   interface KindleCollection {
     id: string;
     name: string;
     bookCount: number;
   }

   interface CollectionBookAssociation {
     collectionId: string;
     bookAsin: string;
   }
   ```

4. **パーサー機能**
   - SQLite接続・クエリ実行
   - データ取得・変換
   - メモリ効率的な処理
   - エラー回復機能

## ✅ 完了条件
- [ ] synced_collections.db読み込み機能
- [ ] コレクション情報抽出機能
- [ ] 書籍・コレクション関連付け
- [ ] エラーハンドリング実装
- [ ] 単体テスト作成

## 🔗 依存関係
- **前提条件**: T002（サーバー依存関係）
- **後続タスク**: T203（パス自動検出）、T204（データモデル定義）

## 🧪 検証方法
```bash
cd src/server
npm test -- collectionParser.test.ts
# 実際のKindleファイルでテスト
npm run dev
curl http://localhost:3001/api/collections
```

## 📚 参考資料
- SQLite Node.js ドキュメント
- Kindleファイル構造調査結果
- システムアーキテクチャ設計書

## 💡 実装ヒント
1. SQLiteファイルは読み取り専用で開く
2. 大量データの効率的な処理
3. 不正なデータ形式への対応
4. メモリ使用量の最適化

## ⚠️ 注意事項
- Kindleファイルの破損可能性
- ファイルアクセス権限の確認
- 異なるKindleバージョンへの対応
- パフォーマンス目標（5秒以内）の達成