# MVP実装タスクチケット一覧

## 📊 全チケット概要

| チケットID | タイトル | 優先度 | 見積もり | 担当 | 依存関係 |
|-----------|---------|--------|---------|------|---------|
| **T001** | プロジェクト構造とTypeScript環境 | Critical | 1日 | Full-stack | - |
| **T002** | サーバー依存関係設定 | High | 0.5日 | Backend | T001 |
| **T003** | クライアント依存関係設定 | High | 0.5日 | Frontend | T001 |
| **T004** | ESLint/Prettier設定 | Medium | 0.5日 | Full-stack | T001 |
| **T101** | Express基本サーバー | Critical | 1日 | Backend | T002 |
| **T102** | SQLite接続とDB初期化（Phase2） | Low | 0.5日 | Backend | T101 |
| **T103** | 環境変数とログ設定 | High | 0.5日 | Backend | T101 |
| **T104** | エラーハンドリング基盤 | Medium | 0.5日 | Backend | T101 |
| **T201** | XMLパーサー実装 | Critical | 1日 | Backend | T002 |
| **T202** | SQLiteパーサー実装 | Critical | 1日 | Backend | T002 |
| **T203** | パス自動検出機能 | High | 0.5日 | Backend | T201,T202 |
| **T204** | 書籍データモデル定義 | High | 0.5日 | Backend | T201,T202 |
| **T301** | GET /api/books エンドポイント | Critical | 0.5日 | Backend | T203,T204 |
| **T302** | POST /api/sync エンドポイント | High | 0.5日 | Backend | T203,T204 |
| **T303** | GET /api/collections エンドポイント | High | 0.5日 | Backend | T203,T204 |
| **T304** | POST /api/books/{asin}/open エンドポイント | High | 0.5日 | Backend | T601 |
| **T305** | API統合テスト | Medium | 0.5日 | Backend | T301-T304 |
| **T401** | React基本アプリケーション | Critical | 1日 | Frontend | T003 |
| **T402** | TypeScript型定義 | High | 0.5日 | Frontend | T401 |
| **T403** | APIクライアント実装 | High | 0.5日 | Frontend | T402 |
| **T404** | React Hooks実装 | Medium | 0.5日 | Frontend | T403 |
| **T501** | 書籍カードコンポーネント | Critical | 0.5日 | Frontend | T403 |
| **T502** | 検索バー実装 | High | 0.5日 | Frontend | T403 |
| **T503** | フィルターパネル実装 | High | 0.5日 | Frontend | T403 |
| **T504** | グリッド/リスト表示切替 | High | 0.5日 | Frontend | T501 |
| **T505** | メイン画面統合 | Critical | 1日 | Frontend | T501-T504 |
| **T601** | URLスキーム実装 | Medium | 0.5日 | Backend | - |
| **T602** | Kindleアプリ起動処理 | Medium | 0.5日 | Backend | T601,T304 |
| **T701** | E2E基本フロー | Medium | 0.5日 | QA | T505,T602 |
| **T702** | エラーケーステスト | Low | 0.5日 | QA | T701 |
| **T703** | パフォーマンステスト | Low | 0.5日 | QA | T701 |

## 🚀 実装順序（推奨）

### Week 1: 基盤構築
```
Day 1: T001 (プロジェクト構造)
Day 2: T002, T003, T004 (依存関係・設定)
Day 3: T101, T401 (サーバー・クライアント基盤)
Day 4: T201, T402 (XMLパーサー・型定義)
Day 5: T202, T103, T104 (SQLiteパーサー・環境設定・エラーハンドリング)
```

### Week 2: API・UI実装
```
Day 6: T203, T204, T301 (パス検出・データモデル・API)
Day 7: T302, T303, T304, T403 (API完成・クライアント)
Day 8: T501, T502 (書籍カード・検索バー)
Day 9: T503, T504, T601 (フィルター・表示切替・URLスキーム)
Day 10: T505, T602 (メイン画面統合・Kindle起動)
```

### Week 3: テスト・品質向上
```
Day 11: T404, T701 (Hooks・E2Eテスト)
Day 12: T104, T305, T702 (エラーハンドリング・テスト)
Day 13: T703, バグ修正 (パフォーマンステスト・調整)
Day 14: 統合調整・デプロイ準備
```

## 📈 進捗管理

### ステータス管理
各チケットは以下のステータスで管理：
- `TODO`: 未着手
- `IN_PROGRESS`: 作業中
- `TESTING`: テスト中
- `BLOCKED`: ブロック中
- `DONE`: 完了

### クリティカルパス
必須チケット（Critical優先度）：
T001 → T101 → T201/T202 → T203/T204 → T301 → T401 → T501 → T505

### Phase2チケット（MVP後実装）
T102（SQLite接続とDB初期化）はPhase2のタグ機能実装時に実施

### 並行作業可能な組み合わせ
- T002, T003, T004（環境設定系）
- T201, T202（パーサー系）
- T301, T302, T303, T304（API系）
- T501, T502, T503（UI系）

## ⚠️ リスク管理

### 高リスクタスク
1. **T201 (XMLパーサー)**: サンプルファイルが大きく、構造が複雑
2. **T202 (SQLiteパーサー)**: データベース形式の解析が必要
3. **T505 (メイン画面統合)**: 複数コンポーネントの統合

### 対策
- 高リスクタスクは早めに着手
- 技術検証用のPoC実装を先行
- 依存関係のあるタスクは密に連携

## 📋 完了基準

### MVP完了条件
- [ ] すべてのCriticalチケットが完了
- [ ] 基本的なE2Eテストが通る
- [ ] パフォーマンス目標を満たす
- [ ] エラーハンドリングが適切に動作する

### 品質基準
- TypeScriptエラーなし
- ESLintエラーなし
- 基本的な単体テストが通る
- 手動テストで主要機能が動作する