import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// 環境変数を読み込み
dotenvConfig();

/**
 * 環境変数の型定義
 */
export interface Environment {
  // サーバー設定
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // Kindle設定（オプショナル）
  KINDLE_CACHE_PATH?: string;
  KINDLE_APP_PATH?: string;

  // ログ設定
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FILE_PATH: string;

  // データベース設定
  DB_PATH: string;

  // パフォーマンス設定
  MAX_XML_SIZE_MB: number;
  PARSE_TIMEOUT_MS: number;
}

/**
 * 環境変数バリデーション用のデフォルト値
 */
const DEFAULT_VALUES: Partial<Environment> = {
  PORT: 3001,
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  LOG_FILE_PATH: path.join(process.cwd(), 'logs', 'app.log'),
  DB_PATH: path.join(process.cwd(), 'data', 'app.db'),
  MAX_XML_SIZE_MB: 10,
  PARSE_TIMEOUT_MS: 10000,
};

/**
 * 必須環境変数のリスト（将来の拡張用）
 */
// const REQUIRED_ENV_VARS: (keyof Environment)[] = [
//   'PORT',
//   'NODE_ENV',
//   'LOG_LEVEL',
//   'LOG_FILE_PATH',
//   'DB_PATH',
//   'MAX_XML_SIZE_MB',
//   'PARSE_TIMEOUT_MS'
// ];

/**
 * 環境変数の値を安全に変換する関数群
 */
const parseNumber = (
  value: string | undefined,
  defaultValue: number
): number => {
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`無効な数値形式です: ${value}`);
  }
  return parsed;
};

const parseString = (
  value: string | undefined,
  defaultValue?: string
): string => {
  if (!value && !defaultValue) {
    throw new Error('必須の文字列値が設定されていません');
  }
  return value || defaultValue!;
};

const parseEnum = <T>(
  value: string | undefined,
  allowedValues: T[],
  defaultValue: T
): T => {
  if (!value) {
    return defaultValue;
  }

  const enumValue = allowedValues.find((v) => v === value);
  if (!enumValue) {
    throw new Error(
      `無効な値です: ${value}. 許可される値: ${allowedValues.join(', ')}`
    );
  }
  return enumValue;
};

/**
 * 環境変数を検証して型安全なオブジェクトを返す
 * @returns 検証済みの環境変数オブジェクト
 * @throws エラー：必須変数が不足または無効な値の場合
 */
export function validateEnv(): Environment {
  try {
    // 基本的な環境変数の検証と変換
    const env: Environment = {
      PORT: parseNumber(process.env.PORT, DEFAULT_VALUES.PORT!),
      NODE_ENV: parseEnum(
        process.env.NODE_ENV,
        ['development', 'production', 'test'],
        DEFAULT_VALUES.NODE_ENV!
      ),
      LOG_LEVEL: parseEnum(
        process.env.LOG_LEVEL,
        ['error', 'warn', 'info', 'debug'],
        DEFAULT_VALUES.LOG_LEVEL!
      ),
      LOG_FILE_PATH: parseString(
        process.env.LOG_FILE_PATH,
        DEFAULT_VALUES.LOG_FILE_PATH
      ),
      DB_PATH: parseString(process.env.DB_PATH, DEFAULT_VALUES.DB_PATH),
      MAX_XML_SIZE_MB: parseNumber(
        process.env.MAX_XML_SIZE_MB,
        DEFAULT_VALUES.MAX_XML_SIZE_MB!
      ),
      PARSE_TIMEOUT_MS: parseNumber(
        process.env.PARSE_TIMEOUT_MS,
        DEFAULT_VALUES.PARSE_TIMEOUT_MS!
      ),
    };

    // オプショナルな環境変数
    if (process.env.KINDLE_CACHE_PATH) {
      env.KINDLE_CACHE_PATH = process.env.KINDLE_CACHE_PATH;
    }
    if (process.env.KINDLE_APP_PATH) {
      env.KINDLE_APP_PATH = process.env.KINDLE_APP_PATH;
    }

    // 値の範囲チェック
    if (env.PORT < 1 || env.PORT > 65535) {
      throw new Error(`ポート番号が範囲外です: ${env.PORT} (1-65535が有効)`);
    }

    if (env.MAX_XML_SIZE_MB < 1 || env.MAX_XML_SIZE_MB > 100) {
      throw new Error(
        `XML最大サイズが範囲外です: ${env.MAX_XML_SIZE_MB}MB (1-100が有効)`
      );
    }

    if (env.PARSE_TIMEOUT_MS < 1000 || env.PARSE_TIMEOUT_MS > 60000) {
      throw new Error(
        `解析タイムアウトが範囲外です: ${env.PARSE_TIMEOUT_MS}ms (1000-60000が有効)`
      );
    }

    return env;
  } catch (error) {
    console.error('環境変数の検証に失敗しました:', error);
    throw new Error(`環境変数設定エラー: ${error}`);
  }
}

/**
 * 環境変数の情報を安全にログ出力用に整形
 * 機密情報は隠蔽して出力
 * @param env 環境変数オブジェクト
 * @returns ログ出力用の環境変数情報
 */
export function getEnvInfo(env: Environment): Record<string, any> {
  return {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    LOG_LEVEL: env.LOG_LEVEL,
    LOG_FILE_PATH: env.LOG_FILE_PATH,
    DB_PATH: env.DB_PATH,
    MAX_XML_SIZE_MB: env.MAX_XML_SIZE_MB,
    PARSE_TIMEOUT_MS: env.PARSE_TIMEOUT_MS,
    // オプショナルな値は存在の有無のみ表示（パス情報は機密情報として隠蔽）
    KINDLE_CACHE_PATH: env.KINDLE_CACHE_PATH ? '[設定済み]' : '[未設定]',
    KINDLE_APP_PATH: env.KINDLE_APP_PATH ? '[設定済み]' : '[未設定]',
  };
}

// 検証済み環境変数をエクスポート
export const env = validateEnv();
