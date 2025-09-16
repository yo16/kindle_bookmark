# T002: サーバー依存関係設定

## 📋 基本情報
- **チケットID**: T002
- **タイトル**: サーバー依存関係設定
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: DONE

## 🎯 概要
Node.js + Express サーバーに必要な依存関係パッケージをインストールし、package.jsonを適切に設定する。

## 📝 詳細説明
### 実装内容
1. **運用依存関係の設定**
   - express: Webフレームワーク
   - cors: CORS対応
   - dotenv: 環境変数管理
   - sqlite3: SQLiteデータベース
   - winston: ログ管理
   - xml2js: XMLパーサー

2. **開発依存関係の設定**
   - typescript: TypeScript言語サポート
   - @types/*: TypeScript型定義
   - ts-node-dev: 開発サーバー
   - jest: テストフレームワーク
   - ESLint関連パッケージ

3. **package.jsonスクリプト設定**
   - build: TypeScriptコンパイル
   - start: 本番サーバー起動
   - dev: 開発サーバー起動
   - test: テスト実行
   - lint: コード検証

## ✅ 完了条件
- [x] package.jsonに必要な依存関係が記載されている
- [x] npm installが正常に実行できる
- [x] TypeScriptコンパイルが実行可能
- [x] 開発サーバーが起動できる
- [x] 基本的なスクリプトが動作する

## 🔗 依存関係
- **前提条件**: T001（プロジェクト構造とTypeScript環境）
- **後続タスク**: T101（Express基本サーバー）、T201（XMLパーサー）、T202（SQLiteパーサー）

## 🧪 検証方法
```bash
cd src/server
npm install
npm run build
npm run dev
npm run lint
```

## 📚 参考資料
- package.json設定例
- TypeScript設定ガイド
- Express.js公式ドキュメント

## 💡 実装ヒント
1. package.jsonのversionは適切に管理
2. 依存関係の競合に注意
3. セキュリティ脆弱性チェックを実施
4. 開発効率を考慮したスクリプト設定

## ⚠️ 注意事項
- Node.js v18以上が必要
- 依存関係のバージョン固定を検討
- セキュリティアップデートの定期確認