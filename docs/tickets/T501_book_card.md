# T501: 書籍カードコンポーネント

## 📋 基本情報
- **チケットID**: T501
- **タイトル**: 書籍カードコンポーネント実装
- **優先度**: Critical
- **見積もり**: 0.5日（4時間）
- **担当**: Frontend
- **ステータス**: TODO

## 🎯 概要
個々の書籍を表示するカードコンポーネントを実装する。クリック時のKindleアプリ起動機能も含む。

## 📝 詳細説明
### 実装内容
1. **src/client/src/components/BookCard.tsx**
   - 書籍カードコンポーネント
   - 表紙プレースホルダー表示
   - 書籍情報表示（タイトル、著者、コレクション）

2. **表示項目**
   - 表紙画像（Phase1はプレースホルダー）
   - タイトル（全文表示、折り返し対応）
   - 著者名
   - コレクション名（複数対応）

3. **インタラクション**
   - ホバー効果
   - クリック時のKindleアプリ起動

### 実装ファイル例
```typescript
// src/client/src/components/BookCard.tsx
import React from 'react';
import './BookCard.css';

export interface Book {
  asin: string;
  title: string;
  author: string;
  collections: string[];
}

interface BookCardProps {
  book: Book;
  onClick: (asin: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const handleClick = () => {
    onClick(book.asin);
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <div className="book-cover">
        <div className="cover-placeholder">
          <span>📖</span>
        </div>
      </div>

      <div className="book-info">
        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>

        <p className="book-author" title={book.author}>
          {book.author}
        </p>

        {book.collections && book.collections.length > 0 && (
          <div className="book-collections">
            {book.collections.map((collection, index) => (
              <span key={index} className="collection-tag">
                {collection}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
```

```css
/* src/client/src/components/BookCard.css */
.book-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.book-cover {
  margin-bottom: 12px;
  text-align: center;
}

.cover-placeholder {
  width: 120px;
  height: 160px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 48px;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
  line-height: 1.4;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-collections {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.collection-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}
```

## ✅ 完了条件
- [ ] BookCardコンポーネントが正常に表示される
- [ ] 書籍情報（タイトル、著者、コレクション）が適切に表示される
- [ ] ホバー効果が動作する
- [ ] クリック時のコールバック関数が呼ばれる
- [ ] レスポンシブデザインが適用されている
- [ ] 長いタイトルが適切に省略される
- [ ] TypeScript型定義が適切に設定されている

## 🔗 依存関係
- **前提条件**: T403（APIクライアント実装）
- **後続タスク**: T504, T505

## 🧪 検証方法
```typescript
// テスト用のダミーデータ
const sampleBook: Book = {
  asin: "B08XVZ7L5N",
  title: "プログラミングTypeScript ―スケールするJavaScriptアプリケーション開発",
  author: "Boris Cherny",
  collections: ["技術書", "TypeScript"]
};

// コンポーネントのレンダリング確認
<BookCard
  book={sampleBook}
  onClick={(asin) => console.log('クリック:', asin)}
/>
```

確認項目:
- カードレイアウトが適切に表示される
- 長いタイトルが3行で省略される
- コレクションタグが適切に表示される
- ホバー時のアニメーションが動作する

## 📚 参考資料
- 画面設計: `doc/specifications/requirements_definition.md`
- Book型定義: T402で実装予定
- UI設計の参考画像があれば参照

## 💡 実装ヒント
1. 表紙画像は後のフェーズで実装予定
2. アクセシビリティ（キーボード操作）も考慮
3. CSS GridやFlexboxを活用
4. コンポーネントの再利用性を重視

## ⚠️ 注意事項
- Phase1では表紙画像機能なし（プレースホルダーのみ）
- タイトルの表示行数制限（3行）
- 日本語書籍名の表示に対応
- モバイル対応は不要（PC専用）