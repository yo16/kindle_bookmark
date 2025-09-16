# T402: TypeScript型定義

## 📋 基本情報
- **チケットID**: T402
- **タイトル**: TypeScript型定義
- **優先度**: High
- **見積もり**: 0.5日（4時間）
- **担当**: Frontend
- **ステータス**: DONE

## 🎯 概要
React アプリケーション全体で使用するTypeScript型定義を作成し、型安全性を確保する。

## 📝 詳細説明
### 実装内容
1. **API型定義**
   ```typescript
   // src/types/api.ts
   interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: ApiError;
     timestamp: string;
   }
   ```

2. **書籍・コレクション型**
   ```typescript
   // src/types/book.ts
   interface Book {
     asin: string;
     title: string;
     author: string;
     collections: string[];
   }

   interface Collection {
     id: string;
     name: string;
     bookCount: number;
   }
   ```

3. **UI状態型定義**
   ```typescript
   // src/types/ui.ts
   type ViewMode = 'grid' | 'list';
   type SortOrder = 'title_asc' | 'title_desc';

   interface FilterState {
     search: string;
     collection: string | null;
     sort: SortOrder;
   }
   ```

4. **フック型定義**
   ```typescript
   // src/types/hooks.ts
   interface UseBookResult {
     books: Book[];
     loading: boolean;
     error: string | null;
     refresh: () => Promise<void>;
   }
   ```

## ✅ 完了条件
- [ ] API レスポンス型定義
- [ ] ドメインオブジェクト型定義
- [ ] UI状態型定義
- [ ] カスタムフック型定義
- [ ] 型エクスポート整理

## 🔗 依存関係
- **前提条件**: T401（React基本アプリケーション）
- **後続タスク**: T403（APIクライアント）、T404（React Hooks）

## 🧪 検証方法
```bash
cd src/client
npm run build
# TypeScript型チェック確認
```

## 💡 実装ヒント
1. サーバー側型定義との整合性確保
2. strict TypeScript設定での動作確認
3. 将来拡張を考慮したインターフェース設計
4. 型ガード関数の併用