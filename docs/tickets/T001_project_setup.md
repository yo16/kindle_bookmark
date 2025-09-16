# T001: プロジェクト構造とTypeScript環境

## 📋 基本情報
- **チケットID**: T001
- **タイトル**: プロジェクト構造とTypeScript環境構築
- **優先度**: Critical
- **見積もり**: 1日（8時間）
- **担当**: Backend/Frontend
- **ステータス**: TODO

## 🎯 概要
Kindle蔵書管理システムの基本ディレクトリ構造を構築し、TypeScript環境をセットアップする。

## 📝 詳細説明
### 実装内容
1. **ディレクトリ構造作成**
   ```
   kindle_bookmark/
   ├── src/                 # アプリケーションソースコード
   │   ├── server/src/      # バックエンドソース
   │   └── client/src/      # フロントエンドソース
   ├── scripts/             # ユーティリティスクリプト
   ├── logs/                # ログファイル用
   └── data/                # SQLiteデータベース用
   ```

2. **TypeScript設定**
   - ルート、server、client用のtsconfig.json配置
   - 基本TypeScript設定の適用

3. **基本ファイル作成**
   - .gitignore更新
   - README.mdの基本構成
   -各ディレクトリの.gitkeep

### 設定ファイル適用
`config/`ディレクトリからテンプレートをコピー：
- `tsconfig.json` → ルート、server、client
- 基本的なプロジェクト構成ファイル

## ✅ 完了条件
- [ ] ディレクトリ構造が作成されている
- [ ] 3つのtsconfig.jsonが適切に配置されている
- [ ] TypeScriptコンパイルが各ディレクトリで実行可能
- [ ] .gitignoreが適切に設定されている
- [ ] 基本的なREADME.mdが作成されている

## 🔗 依存関係
- **前提条件**: なし（最初のタスク）
- **後続タスク**: T002, T003, T101, T401

## 🧪 検証方法
```bash
# TypeScriptコンパイル確認
cd src/server && npx tsc --noEmit
cd src/client && npx tsc --noEmit

# ディレクトリ構造確認
tree -I 'node_modules|.git'
```

## 📚 参考資料
- TypeScript設定: `config/tsconfig.json`
- アーキテクチャ設計書: `doc/specifications/system_architecture.md`

## 💡 実装ヒント
1. `config/README.md`のセットアップ手順を参考にする
2. TypeScript設定は後で調整可能、まずは基本設定で開始
3. ディレクトリ構造はアーキテクチャ設計書通りに作成

## ⚠️ 注意事項
- Node.js v18以上が必要
- configディレクトリのファイルをコピーして使用
- 各プロジェクトのTypeScript設定は若干異なる可能性あり