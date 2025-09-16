import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      // 同期処理は後のタスクで実装
      // API呼び出しのシミュレーション
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLastSyncTime(new Date());
      console.log('同期処理完了（シミュレーション）');
    } catch (error) {
      console.error('同期処理でエラーが発生しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return '未同期';
    return `最終同期: ${date.toLocaleTimeString('ja-JP')}`;
  };

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>Kindle蔵書管理</h1>
        <div className='header-controls'>
          <span className='sync-status'>{formatLastSync(lastSyncTime)}</span>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className='sync-button'
            type='button'
          >
            {isLoading ? '同期中...' : '同期'}
          </button>
        </div>
      </header>

      <main className='app-main'>
        <div className='content-area'>
          <div className='welcome-section'>
            <h2>書籍ライブラリ</h2>
            <p className='subtitle'>
              Kindleの蔵書を管理し、素早くアクセスできます
            </p>
          </div>

          <div className='content-placeholder'>
            <div className='placeholder-card'>
              <h3>📚 書籍一覧</h3>
              <p>同期ボタンを押してKindleの書籍データを読み込んでください</p>
              <div className='feature-list'>
                <ul>
                  <li>✨ リアルタイム検索</li>
                  <li>🏷️ コレクション別フィルタ</li>
                  <li>📖 ワンクリックでKindleアプリ起動</li>
                  <li>🎨 グリッド/リスト表示切替</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className='app-footer'>
        <p>Kindle Bookmark Manager v1.0.0 - MVP</p>
        <p className='tech-info'>React + TypeScript</p>
      </footer>
    </div>
  );
};

export default App;
