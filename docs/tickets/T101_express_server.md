# T101: Express基本サーバー

## 📋 基本情報
- **チケットID**: T101
- **タイトル**: Express基本サーバー構築
- **優先度**: Critical
- **見積もり**: 1日（8時間）
- **担当**: Backend
- **ステータス**: DONE

## 🎯 概要
TypeScriptベースのExpressサーバーを構築し、基本的なHTTPサーバーとしての機能を実装する。

## 📝 詳細説明
### 実装内容
1. **src/server/src/app.ts**
   - Express基本設定
   - CORS設定
   - JSON middleware設定
   - 基本的なエラーハンドリング

2. **src/server/src/server.ts**
   - サーバー起動処理
   - ポート設定（環境変数対応）
   - 基本的なヘルスチェックエンドポイント

3. **基本的なルーティング**
   - `GET /health` - ヘルスチェック
   - `GET /api/status` - API稼働状況確認

### 実装ファイル
```typescript
// src/server/src/app.ts
import express from 'express';
import cors from 'cors';

const app = express();

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// 基本ルート
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Kindle Bookmark API is running',
    timestamp: new Date().toISOString()
  });
});

export default app;
```

```typescript
// src/server/src/server.ts
import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で開始されました`);
});
```

## ✅ 完了条件
- [ ] Expressサーバーが正常に起動する
- [ ] `GET /health` エンドポイントが動作する
- [ ] `GET /api/status` エンドポイントが動作する
- [ ] CORS設定が適用されている
- [ ] TypeScriptコンパイルが通る
- [ ] サーバーが環境変数PORTに対応している

## 🔗 依存関係
- **前提条件**: T002（サーバー依存関係設定）
- **後続タスク**: T102, T103, T301-T304

## 🧪 検証方法
```bash
# サーバー起動
cd server
npm run dev

# エンドポイント確認
curl http://localhost:3001/health
curl http://localhost:3001/api/status
```

期待するレスポンス:
```json
{
  "status": "OK",
  "timestamp": "2025-01-16T10:00:00.000Z"
}
```

## 📚 参考資料
- Express公式ドキュメント
- API仕様書: `doc/specifications/api_specification.md`
- package.json: `config/package.server.json`

## 💡 実装ヒント
1. 環境変数の読み込みは後のタスク（T103）で実装
2. エラーハンドリングは基本的な500エラーキャッチのみ
3. ルーティングは後のタスクで分離する

## ⚠️ 注意事項
- TypeScriptの型定義を適切に使用
- 日本語ログメッセージを使用
- ポート番号の設定は環境変数優先
- セキュリティヘッダーは後のタスクで追加