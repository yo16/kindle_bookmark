# 設定ファイル集

このディレクトリには、プロジェクトセットアップ時に使用する設定ファイルのテンプレートが含まれています。

## 📁 ファイル一覧

| ファイル名 | 説明 | 配置先 |
|-----------|------|--------|
| `tsconfig.json` | TypeScript設定 | `./`, `server/`, `client/` |
| `.env.example` | 環境変数テンプレート | `server/`, `client/` |
| `package.server.json` | サーバー用package.json | `server/package.json` |
| `package.client.json` | クライアント用package.json | `client/package.json` |
| `package.root.json` | ルート用package.json | `./package.json` |

## 🚀 セットアップ手順

### 1. プロジェクト構造作成
```bash
# ディレクトリ作成
mkdir -p server/src client/src scripts

# 設定ファイルコピー
cp config/package.root.json ./package.json
cp config/package.server.json server/package.json
cp config/package.client.json client/package.json
cp config/tsconfig.json ./tsconfig.json
cp config/tsconfig.json server/tsconfig.json
cp config/tsconfig.json client/tsconfig.json
cp config/.env.example server/.env.example
cp config/.env.example client/.env.example
```

### 2. 依存関係インストール
```bash
# ルート
npm install

# サーバー
cd server && npm install && cd ..

# クライアント
cd client && npm install && cd ..
```

### 3. 環境変数設定
```bash
# サーバー用環境変数
cp server/.env.example server/.env
# 必要に応じて server/.env を編集

# クライアント用環境変数
cp client/.env.example client/.env
# 必要に応じて client/.env を編集
```

## ⚙️ TypeScript設定の調整

各プロジェクトの特性に応じてtsconfig.jsonを調整してください：

### サーバー（server/tsconfig.json）
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### クライアント（client/tsconfig.json）
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2015",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"]
}
```

## 🔧 環境変数の説明

### サーバー用（server/.env）
- `PORT`: サーバーポート番号（デフォルト: 3001）
- `NODE_ENV`: 実行環境（development/production）
- `KINDLE_CACHE_PATH`: Kindleキャッシュディレクトリの手動パス
- `LOG_LEVEL`: ログレベル（debug/info/warn/error）
- `DB_PATH`: SQLiteデータベースファイルパス

### クライアント用（client/.env）
- `REACT_APP_API_BASE_URL`: APIサーバーのベースURL
- `REACT_APP_VERSION`: アプリケーションバージョン

## 📝 注意事項

1. **ファイルコピー後の調整**: 各プロジェクトに合わせて設定値を調整してください
2. **環境変数の管理**: `.env`ファイルは`.gitignore`に含めてコミットしないでください
3. **依存関係の更新**: package.jsonの依存関係は定期的に更新してください
4. **TypeScript設定**: プロジェクトの複雑性に応じてstrictness設定を調整してください