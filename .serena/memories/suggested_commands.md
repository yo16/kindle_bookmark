# 推奨コマンド一覧

## 開発環境セットアップ
```bash
# 初回セットアップ
npm run setup:all          # サーバー・クライアント両方の依存関係インストール
npm run setup:server       # サーバーのみセットアップ
npm run setup:client       # クライアントのみセットアップ
```

## 開発サーバー起動
```bash
# サーバー開発モード（ホットリロード）
cd src/server && npm run dev

# クライアント開発モード
cd src/client && npm start

# Electronアプリ起動
npm run electron:dev
```

## ビルド・テスト
```bash
# TypeScriptコンパイル
cd src/server && npm run build   # サーバーのみ
cd src/client && npm run build   # クライアントのみ
npm run build:all                # 両方

# テスト実行
cd src/server && npm test        # サーバーテスト
cd src/client && npm test        # クライアントテスト

# テストカバレッジ
cd src/server && npm test -- --coverage
```

## コード品質チェック
```bash
# リント実行
cd src/server && npm run lint    # サーバー
cd src/client && npm run lint    # クライアント

# リント自動修正
cd src/server && npm run lint:fix
cd src/client && npm run lint:fix

# フォーマット
cd src/server && npm run format
cd src/client && npm run format

# フォーマットチェック
cd src/server && npm run format:check
cd src/client && npm run format:check
```

## 本番ビルド・配布
```bash
# 本番用ビルド
npm run build:all

# Electronパッケージング
npm run pack                     # 開発用パッケージ
npm run dist                     # 配布用インストーラー作成
```

## テスト用環境変数設定
```bash
# テスト用Kindleファイルパス設定
export KINDLE_XML_PATH="../../sample_file/KindleSyncMetadataCache.xml"
export KINDLE_DB_PATH="../../sample_file/synced_collections.db"

# または直接コマンド実行
KINDLE_XML_PATH="../../sample_file/KindleSyncMetadataCache.xml" KINDLE_DB_PATH="../../sample_file/synced_collections.db" npm run dev
```

## デバッグ・調査
```bash
# TypeScriptコンパイルエラー確認
cd src/server && npx tsc --noEmit

# 依存関係確認
npm ls
cd src/server && npm ls
cd src/client && npm ls

# ログファイル確認
tail -f src/server/logs/app.log

# APIテスト（開発サーバー起動後）
curl "http://localhost:3001/api/books"
curl "http://localhost:3001/api/books?search=プログラミング"
```

## システムコマンド（Linux/WSL）
```bash
# ファイル検索
find . -name "*.ts" -type f
grep -r "エラー" src/

# プロセス確認
ps aux | grep node
netstat -tulpn | grep 3001

# Git操作
git status
git add .
git commit -m "feat: 機能追加"
git log --oneline -10
```

## タスク完了時の実行コマンド
1. リント・フォーマットチェック
2. TypeScriptコンパイルエラー確認
3. テスト実行
4. ビルド確認