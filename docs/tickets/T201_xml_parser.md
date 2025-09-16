# T201: XMLパーサー実装

## 📋 基本情報
- **チケットID**: T201
- **タイトル**: KindleメタデータXMLパーサー実装
- **優先度**: Critical
- **見積もり**: 1日（8時間）
- **担当**: Backend
- **ステータス**: TODO

## 🎯 概要
KindleSyncMetadataCache.xmlファイルを解析し、書籍メタデータを抽出する機能を実装する。

## 📝 詳細説明
### 実装内容
1. **src/server/src/services/kindleParser.ts**
   - XMLファイル読み込み機能
   - xml2jsによるXMLパース
   - 書籍メタデータ抽出
   - エラーハンドリング

2. **書籍データ構造定義**
   ```typescript
   interface BookMetadata {
     asin: string;
     title: string;
     author: string;
     publisher?: string;
     purchaseDate?: string;
     contentType?: string;
   }
   ```

3. **XMLパース機能**
   - サンプルファイル（582KB）の処理
   - メモリ効率を考慮した実装
   - パース時間の最適化

### 実装ファイル例
```typescript
// src/server/src/services/kindleParser.ts
import * as fs from 'fs/promises';
import * as xml2js from 'xml2js';
import path from 'path';

export interface BookMetadata {
  asin: string;
  title: string;
  author: string;
  publisher?: string;
  purchaseDate?: string;
  contentType?: string;
}

export class KindleXMLParser {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async parseXMLFile(xmlPath: string): Promise<BookMetadata[]> {
    try {
      // ファイルサイズチェック
      const stats = await fs.stat(xmlPath);
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error(`XMLファイルが大きすぎます: ${stats.size} bytes`);
      }

      // XMLファイル読み込み
      const xmlData = await fs.readFile(xmlPath, 'utf8');

      // XMLパース
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true
      });

      const result = await parser.parseStringPromise(xmlData);

      // メタデータ抽出
      return this.extractBookMetadata(result);

    } catch (error) {
      throw new Error(`XMLパース失敗: ${error.message}`);
    }
  }

  private extractBookMetadata(parsedXML: any): BookMetadata[] {
    // XMLから書籍メタデータを抽出
    // 実装はサンプルファイルの構造を参考に
  }
}
```

## ✅ 完了条件
- [ ] XMLファイルが正常に読み込める
- [ ] xml2jsでXMLがパースできる
- [ ] サンプルファイルから書籍データが抽出できる
- [ ] 適切なエラーハンドリングが実装されている
- [ ] TypeScript型定義が適切に設定されている
- [ ] ファイルサイズ制限が実装されている

## 🔗 依存関係
- **前提条件**: T002（サーバー依存関係設定）
- **後続タスク**: T203, T302

## 🧪 検証方法
```bash
# 単体テスト実行
cd server
npm test -- kindleParser.test.ts

# サンプルファイル確認
node -e "
const parser = require('./dist/services/kindleParser');
parser.parseXMLFile('./sample_file/KindleSyncMetadataCache.xml')
  .then(books => console.log('抽出された書籍数:', books.length));
"
```

## 📚 参考資料
- サンプルファイル: `sample_file/KindleSyncMetadataCache.xml`
- xml2js ドキュメント
- 設計レビュー報告書の「XMLファイルサイズ制限」

## 💡 実装ヒント
1. サンプルファイルの構造を先に確認する
2. 最初の数件の書籍データから構造を理解する
3. メモリ使用量に注意してストリーミング処理も検討
4. エラーメッセージは日本語で実装

## ⚠️ 注意事項
- サンプルファイルは582KBと大きいため注意
- XMLの構造は変更される可能性がある
- パフォーマンス目標（3秒以内）を意識
- 文字エンコーディング（UTF-8）に注意