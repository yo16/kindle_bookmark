# T601: URLスキーム実装

## 📋 基本情報
- **チケットID**: T601
- **タイトル**: URLスキーム実装
- **優先度**: Medium
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
Kindleアプリを起動するためのURLスキーム生成と実行機能を実装する。

## 📝 詳細説明
### 実装内容
1. **URLスキーム生成**
   ```typescript
   // src/services/kindleScheme.ts
   function createKindleUrl(asin: string): string {
     return `kindle://book?action=open&asin=${asin}`;
   }
   ```

2. **URLスキーム実行**
   ```typescript
   // Windows環境でのコマンド実行
   import { exec } from 'child_process';
   const command = `start "" "${kindleUrl}"`;
   ```

3. **エラーハンドリング**
   - Kindleアプリ未インストール
   - URLスキーム未登録
   - コマンド実行失敗

## ✅ 完了条件
- [ ] URLスキーム生成機能
- [ ] コマンド実行機能
- [ ] エラーハンドリング
- [ ] 単体テスト作成

## 🔗 依存関係
- **前提条件**: なし
- **後続タスク**: T602（Kindleアプリ起動処理）、T304（書籍を開くAPI）