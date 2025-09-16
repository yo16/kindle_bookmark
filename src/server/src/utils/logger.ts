import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '../config/env';

/**
 * ログレベルの定義（日本語説明付き）
 */
export const LogLevels = {
  error: 'エラー',
  warn: '警告',
  info: '情報',
  debug: 'デバッグ',
} as const;

/**
 * カスタムログフォーマットの作成
 * 日本語メッセージに対応した構造化ログ
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;

    interface LogEntry {
      timestamp: string;
      level: string;
      message: string;
      stack?: string;
      meta?: Record<string, unknown>;
    }

    const logEntry: LogEntry = {
      timestamp: timestamp as string,
      level: (level as string).toUpperCase(),
      message: message as string,
    };

    // エラースタックトレースがある場合は追加
    if (stack && typeof stack === 'string') {
      logEntry.stack = stack;
    }

    // メタデータがある場合は追加
    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    return JSON.stringify(logEntry, null, 0);
  })
);

/**
 * コンソール出力用のシンプルフォーマット
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack } = info;
    let output = `[${timestamp}] ${level}: ${message}`;

    if (stack) {
      output += '\n' + stack;
    }

    return output;
  })
);

/**
 * ログディレクトリを作成する関数
 */
function ensureLogDirectory(): void {
  const logDir = path.dirname(env.LOG_FILE_PATH);

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.error('ログディレクトリの作成に失敗しました:', error);
    throw error;
  }
}

/**
 * Winstonロガーの設定
 */
function createLogger(): winston.Logger {
  // ログディレクトリの確保
  ensureLogDirectory();

  const transports: winston.transport[] = [
    // コンソール出力
    new winston.transports.Console({
      level: env.LOG_LEVEL,
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),

    // ファイル出力（エラーレベル）
    new winston.transports.File({
      filename: env.LOG_FILE_PATH.replace('.log', '-error.log'),
      level: 'error',
      format: customFormat,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // ファイル出力（全レベル）
    new winston.transports.File({
      filename: env.LOG_FILE_PATH,
      level: env.LOG_LEVEL,
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ];

  return winston.createLogger({
    level: env.LOG_LEVEL,
    transports,
    exitOnError: false,
  });
}

/**
 * シングルトンロガーインスタンス
 */
export const logger = createLogger();

/**
 * アプリケーション用のログ出力関数群
 * 日本語メッセージに最適化
 */
export const log = {
  /**
   * 情報レベルログ
   * @param message - ログメッセージ
   * @param meta - 追加メタデータ
   */
  info: (message: string, meta?: Record<string, unknown>): void => {
    logger.info(message, meta);
  },

  /**
   * 警告レベルログ
   * @param message - ログメッセージ
   * @param meta - 追加メタデータ
   */
  warn: (message: string, meta?: Record<string, unknown>): void => {
    logger.warn(message, meta);
  },

  /**
   * エラーレベルログ
   * @param message - ログメッセージ
   * @param error - エラーオブジェクト
   * @param meta - 追加メタデータ
   */
  error: (
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>
  ): void => {
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: error.stack,
        ...meta,
      });
    } else if (error) {
      logger.error(message, { error, ...meta });
    } else {
      logger.error(message, meta);
    }
  },

  /**
   * デバッグレベルログ
   * @param message - ログメッセージ
   * @param meta - 追加メタデータ
   */
  debug: (message: string, meta?: Record<string, unknown>): void => {
    logger.debug(message, meta);
  },

  /**
   * アプリケーション開始時のログ
   * @param port - サーバーポート
   * @param env - 環境
   */
  startup: (port: number, environment: string): void => {
    logger.info('=== Kindle蔵書管理システム サーバー起動 ===', {
      port,
      environment,
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * アプリケーション終了時のログ
   */
  shutdown: (): void => {
    logger.info('=== Kindle蔵書管理システム サーバー終了 ===', {
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * リクエスト処理ログ
   * @param method - HTTPメソッド
   * @param url - リクエストURL
   * @param statusCode - レスポンスコード
   * @param responseTime - レスポンス時間（ms）
   */
  request: (
    method: string,
    url: string,
    statusCode: number,
    responseTime: number
  ): void => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTPリクエスト処理', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  },

  /**
   * ファイル操作ログ
   * @param operation - 操作種別
   * @param filePath - ファイルパス
   * @param success - 成功/失敗
   * @param details - 詳細情報
   */
  fileOperation: (
    operation: 'read' | 'write' | 'delete',
    filePath: string,
    success: boolean,
    details?: Record<string, unknown>
  ): void => {
    const operationName = {
      read: '読み取り',
      write: '書き込み',
      delete: '削除',
    }[operation];

    if (success) {
      logger.info(`ファイル${operationName}成功`, {
        operation,
        filePath,
        ...details,
      });
    } else {
      logger.error(`ファイル${operationName}失敗`, {
        operation,
        filePath,
        ...details,
      });
    }
  },

  /**
   * Kindle関連操作ログ
   * @param operation - 操作種別
   * @param details - 詳細情報
   */
  kindle: (
    operation: 'parse_xml' | 'parse_db' | 'open_book' | 'sync',
    details: Record<string, unknown>
  ): void => {
    const operationName = {
      parse_xml: 'XMLファイル解析',
      parse_db: 'データベース解析',
      open_book: '書籍を開く',
      sync: '同期処理',
    }[operation];

    logger.info(`Kindle操作: ${operationName}`, { operation, ...details });
  },
};

/**
 * ログレベルを動的に変更する関数
 * @param level - 新しいログレベル
 */
export function setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
  logger.level = level;
  logger.transports.forEach((transport) => {
    transport.level = level;
  });
  log.info(`ログレベルを ${LogLevels[level]} に変更しました`, {
    newLevel: level,
  });
}

/**
 * ログ統計情報の取得
 */
interface LogStats {
  logFile?: string;
  size?: string;
  created?: Date;
  modified?: Date;
  level?: string;
  error?: string;
  details?: unknown;
}

export function getLogStats(): LogStats {
  try {
    const logFilePath = env.LOG_FILE_PATH;
    const stats = fs.statSync(logFilePath);

    return {
      logFile: logFilePath,
      size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
      created: stats.birthtime,
      modified: stats.mtime,
      level: env.LOG_LEVEL,
    };
  } catch (error) {
    return {
      error: 'ログファイル情報の取得に失敗しました',
      details: error,
    };
  }
}

/**
 * プロセス終了時の処理
 */
process.on('exit', () => {
  log.shutdown();
});

// 未処理の例外をキャッチしてログに記録
process.on('uncaughtException', (error) => {
  log.error('未処理の例外が発生しました', error);
  // eslint-disable-next-line no-process-exit
  process.exit(1); // 未処理例外の場合は適切にプロセス終了
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('未処理のPromise拒否が発生しました', reason, { promise });
});

export default logger;
