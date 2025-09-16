# ドキュメント構成

## 📁 ディレクトリ構造

```
doc/
├── README.md                      # このファイル（ドキュメント構成説明）
├── specifications/                # 仕様書・設計書
│   ├── requirements_definition.md # 要件定義書
│   ├── system_architecture.md     # システムアーキテクチャ設計書
│   └── api_specification.md       # API仕様書
└── reviews/                       # レビュー・分析結果
    └── design_review_report.md    # 設計レビュー報告書
```

## 📄 ドキュメント一覧

### 仕様書類 (`specifications/`)

| ドキュメント名 | 説明 | 最終更新 |
|--------------|------|---------|
| [要件定義書](specifications/requirements_definition.md) | システムの機能要件・非機能要件を定義 | 2025-01-15 |
| [システムアーキテクチャ設計書](specifications/system_architecture.md) | 技術スタック、ディレクトリ構造、データフロー設計 | 2025-01-15 |
| [API仕様書](specifications/api_specification.md) | RESTful APIエンドポイントの詳細仕様 | 2025-01-15 |

### レビュー結果 (`reviews/`)

| ドキュメント名 | 説明 | 作成日時 |
|--------------|------|---------|
| [設計レビュー報告書](reviews/20250916_103645_design_review_report.md) | 設計ドキュメントの整合性確認と改善提案 | 2025-09-16 10:36:45 |

## 🎯 ドキュメント利用ガイド

### 開発者向け

1. **新規開発を始める場合**
   - まず [要件定義書](specifications/requirements_definition.md) で機能要件を確認
   - [システムアーキテクチャ設計書](specifications/system_architecture.md) で技術構成を理解
   - [API仕様書](specifications/api_specification.md) でインターフェースを確認

2. **設計改善を検討する場合**
   - [設計レビュー報告書](reviews/20250916_103645_design_review_report.md) で既知の課題を確認
   - 改善提案の優先順位を参考に実装を進める

### プロジェクトマネージャー向け

- **Phase1 (MVP)** の実装範囲は要件定義書で明確化済み
- 設計レビュー報告書の「実装優先順位」セクションを参考にスケジュール調整

## 📝 ドキュメント更新ルール

1. **仕様変更時**
   - 該当する仕様書を更新
   - 更新履歴を各ドキュメントの末尾に記録

2. **レビュー実施時**
   - レビュー結果は `reviews/` フォルダに新規ファイルとして作成
   - ファイル名は `YYYYMMDD_hhmmss_{レビュー種別}_report.md` 形式
   - レビュー実施日時を必ずファイル名の先頭に付与

3. **ドキュメント追加時**
   - 適切なフォルダに配置
   - このREADME.mdの一覧を更新