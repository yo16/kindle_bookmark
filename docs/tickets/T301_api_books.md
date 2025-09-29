# T301: GET /api/books エンドポイント

## 📋 基本情報
- **チケットID**: T301
- **タイトル**: 書籍一覧取得API実装
- **優先度**: Critical
- **見積もり**: 0.5日（4時間）
- **担当**: Backend
- **ステータス**: DONE

## 🎯 概要
書籍一覧を取得するAPIエンドポイントを実装する。検索、フィルター、ソート機能を含む。

## 📝 詳細説明
### API仕様
```
GET /api/books
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| search | string | No | 検索キーワード（タイトル部分一致） | `search=React` |
| collection | string | No | コレクション名でフィルター | `collection=技術書` |
| sort | string | No | ソート項目（title_asc, title_desc） | `sort=title_asc` |
| limit | number | No | 取得件数上限（デフォルト: 1000） | `limit=50` |
| offset | number | No | 取得開始位置（ページネーション用） | `offset=100` |

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "asin": "B08XVZ7L5N",
        "title": "プログラミングTypeScript",
        "author": "Boris Cherny",
        "collections": ["技術書", "TypeScript"]
      }
    ],
    "totalCount": 245,
    "hasMore": true
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### 実装内容
1. **src/server/src/routes/books.ts**
   - Express Router設定
   - クエリパラメータ解析
   - ビジネスロジック呼び出し

2. **src/server/src/services/bookService.ts**
   - 書籍データ取得ロジック
   - 検索・フィルター・ソート処理
   - ページネーション処理

### 実装ファイル例
```typescript
// src/server/src/routes/books.ts
import { Router } from 'express';
import { BookService } from '../services/bookService';

const router = Router();
const bookService = new BookService();

router.get('/', async (req, res) => {
  try {
    const {
      search,
      collection,
      sort = 'title_asc',
      limit = 1000,
      offset = 0
    } = req.query;

    const result = await bookService.getBooks({
      search: search as string,
      collection: collection as string,
      sort: sort as string,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '書籍データの取得に失敗しました',
        details: { message: error.message }
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

## ✅ 完了条件
- [ ] GET /api/books エンドポイントが実装されている
- [ ] 検索機能（タイトル部分一致）が動作する
- [ ] コレクションフィルターが動作する
- [ ] ソート機能（昇順・降順）が動作する
- [ ] ページネーション（limit, offset）が動作する
- [ ] エラーハンドリングが適切に実装されている
- [ ] レスポンス形式がAPI仕様書と一致している

## 🔗 依存関係
- **前提条件**: T101, T201, T203, T204
- **後続タスク**: T403, T501

## 🧪 検証方法
```bash
# 基本的な取得
curl "http://localhost:3001/api/books"

# 検索機能確認
curl "http://localhost:3001/api/books?search=プログラミング"

# フィルター機能確認
curl "http://localhost:3001/api/books?collection=技術書"

# ソート機能確認
curl "http://localhost:3001/api/books?sort=title_desc"

# ページネーション確認
curl "http://localhost:3001/api/books?limit=10&offset=0"
```

## 📚 参考資料
- API仕様書: `doc/specifications/api_specification.md`
- 要件定義書の検索・フィルター要件
- BookMetadata型定義（T201）

## 💡 実装ヒント
1. Phase1ではクライアントサイドでの検索・フィルタリングでも可
2. ソート処理はメモリ上で実行（Phase1）
3. エラーレスポンスは統一形式を使用
4. 日本語を含む検索に対応

## ⚠️ 注意事項
- Phase1ではtagsフィールドは含まない
- パフォーマンス目標（100ms以内）を意識
- 大量データでの動作確認も実施
- 文字化け対策を実装