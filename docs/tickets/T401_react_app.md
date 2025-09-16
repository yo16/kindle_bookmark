# T401: React基本アプリケーション

## 📋 基本情報
- **チケットID**: T401
- **タイトル**: React + TypeScript基本アプリケーション構築
- **優先度**: Critical
- **見積もり**: 1日（8時間）
- **担当**: Frontend
- **ステータス**: DONE

## 🎯 概要
TypeScriptベースのReactアプリケーションを構築し、基本的なルーティングと画面構成を実装する。

## 📝 詳細説明
### 実装内容
1. **src/client/src/App.tsx**
   - メインアプリケーションコンポーネント
   - 基本レイアウト実装
   - 状態管理の基盤

2. **src/client/src/index.tsx**
   - React DOMレンダリング
   - アプリケーション初期化

3. **基本的な画面構成**
   - ヘッダー（アプリタイトル、同期ボタン）
   - メインコンテンツエリア
   - 基本的なスタイリング

### 実装ファイル例
```typescript
// src/client/src/App.tsx
import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSync = () => {
    setIsLoading(true);
    // 同期処理は後のタスクで実装
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kindle蔵書管理</h1>
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="sync-button"
        >
          {isLoading ? '同期中...' : '同期'}
        </button>
      </header>

      <main className="app-main">
        <div className="content-placeholder">
          <p>書籍一覧がここに表示されます</p>
        </div>
      </main>

      <footer className="app-footer">
        <p>Kindle Bookmark Manager v1.0</p>
      </footer>
    </div>
  );
};

export default App;
```

```typescript
// src/client/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

4. **基本スタイル**
   ```css
   /* src/client/src/App.css */
   .app {
     min-height: 100vh;
     display: flex;
     flex-direction: column;
   }

   .app-header {
     background-color: #282c34;
     padding: 1rem 2rem;
     color: white;
     display: flex;
     justify-content: space-between;
     align-items: center;
   }

   .sync-button {
     background-color: #61dafb;
     color: #282c34;
     border: none;
     padding: 0.5rem 1rem;
     border-radius: 4px;
     cursor: pointer;
   }

   .app-main {
     flex: 1;
     padding: 2rem;
   }
   ```

## ✅ 完了条件
- [ ] Reactアプリケーションが正常に起動する
- [ ] TypeScriptコンパイルが通る
- [ ] 基本的な画面レイアウトが表示される
- [ ] 同期ボタンの基本動作が実装されている
- [ ] レスポンシブデザインの基礎が実装されている
- [ ] 開発サーバーが正常に動作する

## 🔗 依存関係
- **前提条件**: T003（クライアント依存関係設定）
- **後続タスク**: T402, T403, T501-T505

## 🧪 検証方法
```bash
# 開発サーバー起動
cd client
npm start

# ブラウザで確認
# http://localhost:3000 にアクセス

# TypeScriptコンパイル確認
npm run build
```

確認項目:
- アプリケーションが正常に表示される
- 同期ボタンがクリック可能
- レスポンシブレイアウトが動作する
- 開発者ツールでエラーが発生しない

## 📚 参考資料
- React公式ドキュメント
- TypeScript + React ベストプラクティス
- 画面設計: `doc/specifications/requirements_definition.md`

## 💡 実装ヒント
1. create-react-appの代わりに手動設定も可
2. 状態管理は後のタスクで詳細実装
3. UIコンポーネントは後のタスクで分離
4. CSS-in-JSやstyled-componentsも検討可能

## ⚠️ 注意事項
- React 18以上を使用
- TypeScript strictモードを有効化
- 日本語表示に対応
- モバイル表示は考慮しない（PC専用）
- ブラウザ互換性はChrome、Edge、Firefox最新版のみ