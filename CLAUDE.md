# CLAUDE.md

このファイルは、このリポジトリでコードを作業する際のClaude Code（claude.ai/code）向けのガイダンスを提供します。

## プロジェクト概要

Kindle蔵書管理アプリケーション（kindle_bookmark）は、個人のライブラリからKindle書籍をリストアップし、PC版Kindleアプリで開くことを目的としたシステムです。Kindleキャッシュファイルをローカルで読み取り、Webベースの書籍管理インターフェースを提供します。

## プロジェクト状況

- **現在の状態**: 基盤実装フェーズ（T104完了、T203/T204が次）
- **完了チケット**: T001-T004, T101, T103-T104, T201-T202, T401-T402
- **次のチケット**: T203（パス自動検出機能）、T204（書籍データモデル定義）
- **主要言語**: TypeScript（Node.js + React）
- **ビルドシステム**: npm/yarn
- **対象プラットフォーム**: Windows（ローカル配布）

## 開発言語方針

**重要：このプロジェクトのすべての開発は日本語で行う**

- **コメント**: すべて日本語で記述
- **変数名・関数名**: 英語（通常通り）、ただし日本語コメントを併記
- **エラーメッセージ**: 日本語でユーザーに表示
- **ログ出力**: 日本語でのメッセージ
- **API レスポンス**: 日本語メッセージを含む
- **ドキュメント**: 日本語で作成

## システム固有の開発ガイドライン

### Kindleファイル処理

1. **ファイルアクセスは読み取り専用に限定**
   ```typescript
   import { readFileSync } from 'fs';

   // 正: 読み取り専用でファイルを開く
   const data: string = readFileSync(kindlePath, { encoding: 'utf8', flag: 'r' });

   // 誤: 書き込み可能でファイルを開く（絶対禁止）
   const data = readFileSync(kindlePath, { encoding: 'utf8' });
   ```

2. **パス処理（Windows環境）**
   ```typescript
   import * as path from 'path';

   // Windowsパスの適切な処理
   const kindleBasePath: string = path.join(process.env.USERPROFILE!, 'AppData', 'Local', 'Amazon', 'Kindle', 'Cache');
   ```

3. **文字エンコーディング**
   ```typescript
   import { readFileSync } from 'fs';

   // UTF-8での読み込みを明示
   const xmlData: string = readFileSync(xmlPath, { encoding: 'utf8' });
   ```

### ASIN処理

```typescript
// ASINの検証パターン
const ASIN_PATTERN: RegExp = /^[A-Z0-9]{10}$/;

// ASIN型定義
type ASIN = string;

function validateAsin(asin: string): boolean {
  if (!asin || typeof asin !== 'string') {
    throw new Error('ASINが無効です');
  }
  if (!ASIN_PATTERN.test(asin)) {
    throw new Error(`無効なASIN形式: ${asin}`);
  }
  return true;
}
```

### エラーハンドリング

```typescript
// エラーレスポンスの型定義
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
  timestamp: string;
}

// 統一されたエラーレスポンス形式
function createErrorResponse(code: string, message: string, details: Record<string, any> = {}): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

// Kindleファイル関連のエラー
const KINDLE_ERRORS = {
  FILES_NOT_FOUND: 'Kindleのキャッシュファイルが見つかりません',
  PARSE_ERROR: 'ファイルの解析に失敗しました',
  APP_NOT_FOUND: 'Kindleアプリが見つかりません'
} as const;

type KindleErrorKey = keyof typeof KINDLE_ERRORS;
```

### URLスキーム処理

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Kindle URLスキームの生成
function createKindleUrl(asin: ASIN): string {
  validateAsin(asin);
  return `kindle://book?action=open&asin=${asin}`;
}

// URLスキームでのアプリ起動（Promise版）
async function openBookInKindle(asin: ASIN): Promise<void> {
  const kindleUrl: string = createKindleUrl(asin);
  try {
    await execAsync(`start "" "${kindleUrl}"`);
  } catch (error) {
    throw new Error(`Kindleアプリの起動に失敗しました: ${error}`);
  }
}
```

## セキュリティとパフォーマンス要件

### セキュリティ

1. **ファイルアクセス制限**
   - Kindleファイルは読み取り専用
   - パストラバーサル攻撃の防止
   - 不正なファイルパスの検証

2. **データの外部送信禁止**
   - 書籍データは外部に送信しない
   - ローカル動作限定（Phase1）

### パフォーマンス

```typescript
// パフォーマンス目標値
const PERFORMANCE_TARGETS = {
  STARTUP_TIME: 3000,    // 起動時間: 3秒以内
  SEARCH_TIME: 100,      // 検索: 100ms以内
  VIEW_SWITCH: 500,      // 表示切替: 500ms以内
  SYNC_TIME: 5000        // 同期: 5秒以内（1000冊）
} as const;

// 書籍データの型定義
interface Book {
  asin: ASIN;
  title: string;
  author: string;
  collections: string[];
  tags?: string[];
}

// 大量データ処理の際の注意
function processLargeBookList(books: Book[]): void {
  // チャンク処理で大量データに対応
  const CHUNK_SIZE = 100;
  for (let i = 0; i < books.length; i += CHUNK_SIZE) {
    const chunk: Book[] = books.slice(i, i + CHUNK_SIZE);
    processBookChunk(chunk);
  }
}

function processBookChunk(books: Book[]): void {
  // チャンク処理の実装
}
```

## テストとデバッグ指針

### テストファイルパス

```typescript
// テスト用のサンプルファイルパス
const TEST_PATHS = {
  XML_SAMPLE: './tests/fixtures/sample_metadata.xml',
  DB_SAMPLE: './tests/fixtures/sample_collections.db',
  INVALID_XML: './tests/fixtures/invalid_metadata.xml'
} as const;

type TestPathKey = keyof typeof TEST_PATHS;
```

### ログ出力

```typescript
// T103で実装されたWinstonログシステムを使用
import { log } from './utils/logger';

// ログレベル: error, warn, info, debug
// ファイル出力（./logs/app.log）とコンソール出力の両対応
// ログローテーション（5MB、最大10ファイル）

// 使用例
log.info('Kindleファイルの読み込みを開始します');
log.error('XMLファイルの解析に失敗しました', error);
log.kindle('parse_xml', { fileName: 'metadata.xml', count: 150 });
log.request('GET', '/api/books', 200, 25);
```

## トラブルシューティング

### よくある問題と対処法

1. **Kindleファイルが見つからない**
   - ユーザープロファイルパスの確認
   - Kindleアプリのインストール状況確認
   - 手動パス設定の提供

2. **XML解析エラー**
   - 文字エンコーディングの確認（UTF-8）
   - XML構造の検証
   - 部分的なデータでの継続動作

3. **Kindleアプリ起動失敗**
   - Kindleアプリのインストール確認
   - URLスキーム登録状況の確認
   - 代替起動方法の提示

### デバッグ用のコマンド

```bash
# Kindleファイルの存在確認
ls -la "$USERPROFILE/AppData/Local/Amazon/Kindle/Cache/"

# XMLファイルの文字エンコーディング確認
file "$USERPROFILE/AppData/Local/Amazon/Kindle/Cache/KindleSyncMetadataCache.xml"
```

## 重要な留意事項

1. **Windows環境限定**: macOS/Linux非対応
2. **PC版Kindleアプリ必須**: システム動作の前提条件
3. **フェーズ分け開発**: MVP → Phase2の段階的実装
4. **データの取り扱い**: 個人の読書データなので慎重に処理
5. **パフォーマンス**: 大量の蔵書に対応できる設計

## 開発時の参考資料

- 要件定義書: `./docs/specifications/requirements_definition.md`
- システムアーキテクチャ: `./docs/specifications/system_architecture.md`
- API仕様書: `./docs/specifications/api_specification.md`