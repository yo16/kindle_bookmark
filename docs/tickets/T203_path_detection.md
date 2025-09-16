# T203: パス自動検出機能

## 📋 基本情報
- **チケットID**: T203
- **タイトル**: パス自動検出機能
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
Windows環境でKindleキャッシュファイルのパスを自動検出し、ユーザー環境に応じて適切なファイルパスを特定する機能を実装する。

## 📝 詳細説明
### 実装内容
1. **パス検出サービス**
   ```typescript
   // src/services/pathDetector.ts
   - 標準Kindleインストールパス検索
   - 環境変数からのパス取得
   - ファイル存在確認
   - 手動設定パス対応
   ```

2. **検出対象ファイル**
   ```
   - KindleSyncMetadataCache.xml
   - synced_collections.db
   ```

3. **検索パス一覧**
   ```typescript
   const KINDLE_PATH_CANDIDATES = [
     '%USERPROFILE%\\AppData\\Local\\Amazon\\Kindle\\Cache',
     '%LOCALAPPDATA%\\Amazon\\Kindle\\Cache',
     // 環境変数指定パス
     process.env.KINDLE_CACHE_PATH
   ];
   ```

4. **検出ロジック**
   - 優先度順でパス検索
   - ファイル存在・アクセス権確認
   - 設定保存機能
   - エラー時の代替手段提供

## ✅ 完了条件
- [ ] Kindleパス自動検出機能
- [ ] ファイル存在確認機能
- [ ] 手動パス設定対応
- [ ] 設定の永続化
- [ ] エラーハンドリング実装

## 🔗 依存関係
- **前提条件**: T201（XMLパーサー）、T202（SQLiteパーサー）
- **後続タスク**: T301-T304（APIエンドポイント群）

## 🧪 検証方法
```bash
cd src/server
npm test -- pathDetector.test.ts
# 異なる環境でのテスト
npm run dev
# パス検出結果の確認
```

## 📚 参考資料
- Windows環境変数一覧
- Kindleインストール仕様
- システムアーキテクチャ設計書

## 💡 実装ヒント
1. path.join()でクロスプラットフォーム対応
2. fs.access()でファイルアクセス確認
3. 環境変数の適切な展開
4. ユーザーフレンドリーなエラーメッセージ

## ⚠️ 注意事項
- ファイルアクセス権限の確認
- セキュリティ：パストラバーサル対策
- 異なるKindleバージョンへの対応
- ユーザー設定の適切な保存場所