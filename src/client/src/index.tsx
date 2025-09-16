import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// アプリケーション初期化ログ
console.log('🚀 Kindle Bookmark Manager - 初期化開始');
console.log('📅 バージョン: 1.0.0 (MVP)');
console.log('⚛️ React:', React.version);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ Kindle Bookmark Manager - 初期化完了');
