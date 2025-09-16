# T004: ESLint/Prettier設定

## 📋 基本情報
- **チケットID**: T004
- **タイトル**: ESLint/Prettier設定
- **優先度**: Medium
- **見積もり**: 0.5日（4時間）
- **担当**: Full-stack
- **ステータス**: DONE

## 🎯 概要
サーバーとクライアント両方にESLintとPrettierを設定し、コード品質とフォーマットの統一を図る。

## 📝 詳細説明
### 実装内容
1. **サーバー側ESLint設定**
   - .eslintrc.js作成
   - TypeScript対応
   - Node.js環境設定
   - Prettier統合

2. **サーバー側Prettier設定**
   - .prettierrc.js作成
   - TypeScript対応フォーマット
   - セミコロン、クォート設定

3. **クライアント側ESLint設定**
   - package.json内でReact拡張
   - Prettier統合
   - React特有のルール適用

4. **クライアント側Prettier設定**
   - .prettierrc.js作成
   - JSX対応設定
   - React推奨フォーマット

5. **package.jsonスクリプト追加**
   - lint: コード検証
   - lint:fix: 自動修正
   - format: フォーマット実行
   - format:check: フォーマット確認

## ✅ 完了条件
- [x] サーバー用ESLint設定ファイル作成
- [x] サーバー用Prettier設定ファイル作成
- [x] クライアント用ESLint設定更新
- [x] クライアント用Prettier設定ファイル作成
- [x] 両方でlint・formatスクリプトが動作
- [x] コードフォーマットが統一されている

## 🔗 依存関係
- **前提条件**: T001（プロジェクト構造）、T002（サーバー依存関係）、T003（クライアント依存関係）
- **後続タスク**: 全ての開発タスク（コード品質向上）

## 🧪 検証方法
```bash
# サーバー
cd src/server
npm run lint
npm run format:check

# クライアント
cd src/client
npm run lint
npm run format:check
```

## 📚 参考資料
- ESLint設定ガイド
- Prettier設定オプション
- TypeScript ESLint推奨設定

## 💡 実装ヒント
1. 開発段階に適したルール設定
2. 自動修正機能の活用
3. エディタとの統合設定
4. チーム開発での統一性確保

## ⚠️ 注意事項
- 既存コードとの互換性確認
- 過度に厳しいルール設定を避ける
- パフォーマンスへの影響を考慮
- プロジェクト固有のルール調整