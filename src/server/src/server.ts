import app from './app';
import { env, getEnvInfo } from './config/env';
import { log } from './utils/logger';

// サーバー起動
const server = app.listen(env.PORT, () => {
  log.startup(env.PORT, env.NODE_ENV);

  log.info(`URL: http://localhost:${env.PORT}`);
  log.info(`ヘルスチェック: http://localhost:${env.PORT}/health`);
  log.info(`API ステータス: http://localhost:${env.PORT}/api/status`);

  // 環境変数情報をログ出力（機密情報は隠蔽済み）
  log.debug('環境変数設定:', getEnvInfo(env));
});

// グレースフルシャットダウン
const gracefulShutdown = (signal: string) => {
  log.info(`${signal} シグナルを受信しました。サーバーを終了しています...`);

  server.close((err) => {
    if (err) {
      log.error('サーバー終了時にエラーが発生しました', err);
      process.exit(1);
    }

    log.info('サーバーが正常に終了しました');
    process.exit(0);
  });

  // 強制終了タイムアウト（10秒）
  setTimeout(() => {
    log.error('サーバーの終了がタイムアウトしました。強制終了します');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
