import app from './app';
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config();

const PORT = process.env.PORT || 3001;

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で開始されました`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`ヘルスチェック: http://localhost:${PORT}/health`);
  console.log(`API ステータス: http://localhost:${PORT}/api/status`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('サーバーを終了しています...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('サーバーを終了しています...');
  process.exit(0);
});
