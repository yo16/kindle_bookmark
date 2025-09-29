# タスク完了時チェックリスト

## 基本チェック項目
### 1. コード品質確認
```bash
# TypeScriptコンパイルエラーなし
cd src/server && npx tsc --noEmit
cd src/client && npx tsc --noEmit

# ESLintエラーなし
cd src/server && npm run lint
cd src/client && npm run lint

# Prettierフォーマット確認
cd src/server && npm run format:check
cd src/client && npm run format:check
```

### 2. テスト実行
```bash
# 単体テスト
cd src/server && npm test
cd src/client && npm test

# 統合テスト（該当する場合）
cd src/server && npm test -- --testPathPattern="integration"
```

### 3. ビルド確認
```bash
# サーバービルド
cd src/server && npm run build

# クライアントビルド（該当する場合）
cd src/client && npm run build
```

## 機能別チェック項目

### API実装時
- [ ] エンドポイントが正しく動作する
- [ ] エラーハンドリングが適切に実装されている
- [ ] レスポンス形式がAPI仕様書と一致している
- [ ] ログ出力が適切に実装されている
- [ ] バリデーションが実装されている
- [ ] パフォーマンス目標を満たしている

### フロントエンド実装時
- [ ] コンポーネントが正しくレンダリングされる
- [ ] TypeScript型エラーがない
- [ ] React DevToolsで確認
- [ ] ブラウザコンソールエラーがない
- [ ] レスポンシブデザインが動作する

### パーサー・サービス実装時
- [ ] テストデータで正常動作確認
- [ ] エラーケースの処理確認
- [ ] メモリリーク等のパフォーマンス問題なし
- [ ] ログ出力の確認

## 品質ゲート

### Critical（必須）
- TypeScriptコンパイルエラー: 0件
- ESLintエラー: 0件
- 基本テスト: 全て通過
- ビルド: 成功

### Important（強く推奨）
- テストカバレッジ: 80%以上（新規コード）
- Prettierフォーマット: 統一
- 日本語コメント: 適切に記述
- エラーハンドリング: 実装済み

### Recommended（推奨）
- パフォーマンス目標: 達成
- ログ出力: 適切に実装
- 統合テスト: 実装（該当する場合）

## デバッグ・確認コマンド

### 開発サーバー起動確認
```bash
# サーバー起動
cd src/server && npm run dev

# API動作確認
curl "http://localhost:3001/api/books"
curl "http://localhost:3001/api/books?search=テスト"
```

### パフォーマンス確認
```bash
# レスポンス時間測定
curl -w "%{time_total}\n" -o /dev/null -s "http://localhost:3001/api/books"

# メモリ使用量確認
cd src/server && NODE_ENV=development npm run dev
```

### ログ確認
```bash
# ログファイル監視
tail -f src/server/logs/app.log

# エラーログのみ確認
grep -i error src/server/logs/app.log
```

## Git作業フロー
1. 機能ブランチで作業
2. 上記チェックリスト実行
3. コミット（日本語コミットメッセージ）
4. プッシュ・プルリクエスト作成

## 例外ケース
- **テスト環境でのエラー**: 環境変数設定確認
- **ビルドエラー**: 依存関係再インストール（npm ci）
- **パフォーマンス低下**: プロファイリング実行