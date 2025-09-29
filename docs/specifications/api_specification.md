# Kindle蔵書管理システム API仕様書

## 1. API概要

### 1.1 基本情報
- **ベースURL**: `http://localhost:3001/api`
- **データ形式**: JSON
- **文字コード**: UTF-8
- **認証**: なし（ローカル動作のため）

### 1.2 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### 1.3 HTTPステータスコード
| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 404 | リソース未検出 |
| 500 | サーバーエラー |

---

## 2. エンドポイント詳細

### 2.1 書籍一覧取得
蔵書の一覧を取得します。検索、フィルター、ソート機能を含みます。

#### エンドポイント
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

#### リクエスト例
```http
GET /api/books?search=プログラミング&sort=title_asc&limit=20
```

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
      },
      {
        "asin": "B07D4H8N31",
        "title": "リーダブルコード",
        "author": "Dustin Boswell, Trevor Foucher",
        "collections": ["技術書"]
      }
    ],
    "totalCount": 245,
    "hasMore": true
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 2.2 データ同期実行
Kindleキャッシュファイルから最新の蔵書データを読み込みます。

#### エンドポイント
```
POST /api/sync
```

#### リクエストボディ
```json
{
  "forceUpdate": false  // Phase1: 常にtrue相当（毎回ファイル読み込み）
                        // Phase3: true=強制更新, false=キャッシュ活用
}
```

#### レスポンス例（Phase1 - シンプル実装）
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-01-15T10:00:00.000Z",
    "statistics": {
      "totalBooks": 245,
      "newBooks": 245,        // Phase1は毎回全データ処理
      "updatedBooks": 0,      // 差分更新なし
      "deletedBooks": 0,
      "collections": 8,
      "syncDuration": 2341    // ミリ秒
    },
    "implementation": "simple", // Phase1: "simple", Phase3: "cached"
    "kindlePaths": {
      "metadataPath": "C:\\Users\\username\\AppData\\Local\\Amazon\\Kindle\\Cache\\KindleSyncMetadataCache.xml",
      "collectionsPath": "C:\\Users\\username\\AppData\\Local\\Amazon\\Kindle\\Cache\\db\\synced_collections.db"
      // テスト環境: "sample_file/KindleSyncMetadataCache.xml", "sample_file/synced_collections.db"
    }
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

#### レスポンス例（エラー時）
```json
{
  "success": false,
  "error": {
    "code": "KINDLE_FILES_NOT_FOUND",
    "message": "Kindleのキャッシュファイルが見つかりません",
    "details": {
      "searchedPaths": [
        "C:\\Users\\username\\AppData\\Local\\Amazon\\Kindle\\Cache\\KindleSyncMetadataCache.xml"
        // テスト環境: "sample_file/KindleSyncMetadataCache.xml"
      ]
    }
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 2.3 コレクション一覧取得
利用可能なコレクションの一覧を取得します。

#### エンドポイント
```
GET /api/collections
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "col_001",
        "name": "技術書",
        "bookCount": 45
      },
      {
        "id": "col_002",
        "name": "ビジネス",
        "bookCount": 32
      },
      {
        "id": "col_003",
        "name": "小説",
        "bookCount": 78
      }
    ],
    "totalCount": 8
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 2.4 Kindleアプリで書籍を開く
指定した書籍をPC版Kindleアプリで開きます。

#### エンドポイント
```
POST /api/books/{asin}/open
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| asin | string | 書籍のASIN |

#### リクエスト例
```http
POST /api/books/B08XVZ7L5N/open
```

#### レスポンス例（成功時）
```json
{
  "success": true,
  "data": {
    "asin": "B08XVZ7L5N",
    "title": "プログラミングTypeScript",
    "openedAt": "2025-01-15T10:00:00.000Z",
    "kindleUrl": "kindle://book?action=open&asin=B08XVZ7L5N"
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

#### レスポンス例（エラー時）
```json
{
  "success": false,
  "error": {
    "code": "KINDLE_APP_NOT_FOUND",
    "message": "Kindleアプリが見つかりません。アプリがインストールされているか確認してください。",
    "details": {
      "asin": "B08XVZ7L5N"
    }
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

## 3. 将来実装予定のAPI

### Phase2 API（基本機能拡張）

### 3.1 タグ追加
書籍にタグを追加します。

#### エンドポイント
```
POST /api/books/{asin}/tags
```

#### TypeScript型定義
```typescript
interface AddTagsRequest {
  tags: string[];
}

interface AddTagsResponse {
  asin: string;
  tags: string[];
  addedTags: string[];
  existingTags: string[];
}
```

#### リクエストボディ
```json
{
  "tags": ["未読", "優先度高"]
}
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "asin": "B08XVZ7L5N",
    "tags": ["未読", "優先度高", "技術書"],
    "addedTags": ["未読", "優先度高"],
    "existingTags": ["技術書"]
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 3.2 タグ削除
書籍からタグを削除します。

#### エンドポイント
```
DELETE /api/books/{asin}/tags/{tagName}
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "asin": "B08XVZ7L5N",
    "removedTag": "未読",
    "remainingTags": ["優先度高", "技術書"]
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 3.3 タグ一覧取得
システム内の全タグを取得します。

#### エンドポイント
```
GET /api/tags
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "未読",
        "bookCount": 45
      },
      {
        "name": "既読",
        "bookCount": 200
      },
      {
        "name": "おすすめ",
        "bookCount": 23
      }
    ],
    "totalCount": 12
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### 3.4 表紙画像取得
書籍の表紙画像を直接取得します。サーバーが画像プロキシとして動作し、外部APIから画像をダウンロードしてローカルキャッシュに保存後、画像データをレスポンスとして返します。

#### エンドポイント
```
GET /api/books/{asin}/cover
```

#### リクエストパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| asin | string | ✓ | 書籍のASIN（パス変数） |

#### レスポンス
- **Content-Type**: `image/jpeg` または `image/png`
- **Body**: 画像のバイナリデータ

#### 動作仕様
1. **キャッシュ確認**: サーバーのローカルディレクトリ内に画像が存在するかチェック
2. **画像取得**: 存在しない場合、外部API（Amazon商品画像API等）から画像をダウンロード
3. **ローカル保存**: ダウンロードした画像を`covers/{asin}.jpg`形式でローカル保存
4. **画像配信**: 適切なMIMEタイプ（`image/jpeg`, `image/png`等）で画像データを直接返却

#### TypeScript型定義
```typescript
// レスポンスは画像データのため、APIレスポンス型は使用しない
// HTTPヘッダーで画像情報を提供

interface CoverImageHeaders {
  'Content-Type': 'image/jpeg' | 'image/png';
  'Content-Length': string;
  'Last-Modified': string;
  'ETag': string;
  'X-Cache-Status': 'hit' | 'miss'; // キャッシュヒット/ミス情報
}
```

#### エラーレスポンス
画像取得に失敗した場合のみJSON形式のエラーレスポンスを返します。

```json
{
  "success": false,
  "error": {
    "code": "COVER_IMAGE_NOT_FOUND",
    "message": "表紙画像が見つかりませんでした",
    "details": {
      "asin": "B08XVZ7L5N",
      "externalApiStatus": "404"
    }
  },
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### Phase3 API（パフォーマンス最適化）
キャッシュ機構の実装後、`forceUpdate`パラメータが真の意味で機能します。

```typescript
// Phase3: キャッシュ機構付き同期
interface CachedSyncResponse extends SyncResponse {
  implementation: 'cached';
  cacheHit: boolean;           // キャッシュヒットしたか
  lastCacheUpdate: string;     // 最終キャッシュ更新日時
}
```

## 4. エラーコード一覧

| エラーコード | 説明 | 対処法 |
|-------------|------|--------|
| KINDLE_FILES_NOT_FOUND | Kindleキャッシュファイル未検出 | Kindleアプリのインストール確認、パス設定確認 |
| KINDLE_APP_NOT_FOUND | Kindleアプリ未検出 | PC版Kindleアプリのインストール |
| INVALID_ASIN | 無効なASIN | 正しいASIN形式を指定 |
| PARSE_ERROR | ファイル解析エラー | Kindleアプリでデータ同期を実行 |
| DATABASE_ERROR | データベースエラー | アプリケーション再起動 |
| SYNC_IN_PROGRESS | 同期処理中 | 処理完了まで待機 |
| BOOK_NOT_FOUND | 書籍が見つからない | データ同期を実行 |

---

## 5. 使用例

### 5.1 初回起動時のフロー
```typescript
// API レスポンス型定義
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

interface Book {
  asin: string;
  title: string;
  author: string;
  collections: string[];
  // Phase1では以下のフィールドは含まれない
  // tags?: string[];        // タグの配列（Phase2で追加予定）
}

interface Collection {
  id: string;
  name: string;
  bookCount: number;
}

// 1. コレクション一覧取得
const collectionsResponse = await fetch('/api/collections');
const collections: ApiResponse<{ collections: Collection[] }> = await collectionsResponse.json();

// 2. 書籍一覧取得
const booksResponse = await fetch('/api/books?limit=50');
const books: ApiResponse<{ books: Book[]; totalCount: number; hasMore: boolean }> = await booksResponse.json();

// 3. 書籍を開く
const openResponse = await fetch('/api/books/B08XVZ7L5N/open', {
  method: 'POST'
});
const openResult: ApiResponse<{ asin: string; title: string; openedAt: string; kindleUrl: string }> = await openResponse.json();
```

### 5.2 検索・フィルタリング
```typescript
// 検索パラメータ型定義
interface BookSearchParams {
  search?: string;
  collection?: string;
  sort?: 'title_asc' | 'title_desc';
  limit?: number;
  offset?: number;
}

// タイトル検索 + コレクションフィルター + ソート
const searchParams: BookSearchParams = {
  search: 'JavaScript',
  collection: '技術書',
  sort: 'title_asc'
};

const params = new URLSearchParams(
  Object.entries(searchParams)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)])
);

const response = await fetch(`/api/books?${params}`);
const filteredBooks: ApiResponse<{ books: Book[]; totalCount: number; hasMore: boolean }> = await response.json();
```

### 5.3 データ同期
```typescript
// 同期リクエスト型定義
interface SyncRequest {
  forceUpdate: boolean;  // Phase1では実質的に無視される
}

// 同期レスポンス型定義
interface SyncResponse {
  syncedAt: string;
  statistics: {
    totalBooks: number;
    newBooks: number;      // Phase1: 常にtotalBooksと同じ
    updatedBooks: number;  // Phase1: 常に0
    deletedBooks: number;  // Phase1: 常に0
    collections: number;
    syncDuration: number;
  };
  implementation: 'simple' | 'cached';  // 実装方式を示す
  kindlePaths: {
    metadataPath: string;
    collectionsPath: string;
  };
}

// Phase1: シンプル同期（forceUpdateは無視）
const syncRequest: SyncRequest = {
  forceUpdate: false  // Phase1ではfalseでもtrueでも同じ動作
};

const syncResponse = await fetch('/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(syncRequest)
});

const syncResult: ApiResponse<SyncResponse> = await syncResponse.json();
if (syncResult.success && syncResult.data) {
  console.log(`同期完了: ${syncResult.data.statistics.totalBooks}冊`);
  console.log(`実装タイプ: ${syncResult.data.implementation}`);
}
```

---

## 6. 制限事項

### 6.1 Phase1制限事項
- **レート制限**: ローカル動作のため制限なし
- **データサイズ制限**: 一度に取得可能な書籍数は実質無制限（メモリ上で処理）
- **検索キーワード**: 最大100文字
- **タグ名**: Phase2で実装予定

### 6.2 Phase3での最適化予定
- **ページネーション**: 一度に取得可能な書籍数を最大1000件に制限
- **キャッシュ**: ファイルタイムスタンプベースの差分更新
- **インデックス**: 高速検索のためのフルテキストインデックス

### 6.3 同時接続数
- 同時接続クライアント数: 制限なし（ローカル動作）

### 6.4 Phase別パフォーマンス目標

| 項目 | Phase1 (MVP) | Phase3 (キャッシュ付き) |
|------|-------------|-------------------|
| 起動時間 | ~3000ms | ~50ms (キャッシュヒット時) |
| 同期時間 | ~3000ms | ~500ms (差分更新時) |
| 検索時間 | ~100ms | ~50ms |
| メモリ使用量 | 低 | 中 |

---

## 7. 今後の拡張予定

### 7.1 認証機能（マルチユーザー対応時）
```typescript
// JWT ペイロード型定義
interface JWTPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  exp: number;
  iat: number;
}

// 認証レスポンス型
interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  expiresAt: string;
}
```
- JWT Bearer Token認証
- ユーザー別の蔵書管理

### 7.2 WebSocket対応
- リアルタイム同期状態通知
- 複数クライアント間での更新通知

### 7.3 バッチ操作
```typescript
// バッチ操作型定義
interface BatchTagRequest {
  asins: string[];
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

interface BatchExportRequest {
  format: 'csv' | 'json' | 'xlsx';
  filters?: {
    collections?: string[];
    tags?: string[];
    dateRange?: {
      from: string;
      to: string;
    };
  };
}
```
- 複数書籍への一括タグ付け
- 一括エクスポート機能

---

## 改訂履歴
| 版 | 日付 | 内容 | 作成者 |
|----|------|------|--------|
| 1.0 | 2025-01-15 | 初版作成 | - |