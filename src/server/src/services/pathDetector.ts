/**
 * パス自動検出サービス
 *
 * Windows環境でKindleキャッシュファイルのパスを自動検出し、
 * ユーザー環境に応じて適切なファイルパスを特定する
 *
 * CLAUDE.mdのセキュリティ・パフォーマンス要件を厳格に遵守
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { log } from '../utils/logger';

/**
 * Kindleキャッシュファイルの型定義
 */
export interface KindleCacheFiles {
  /** XMLメタデータファイルのパス */
  xmlPath: string;
  /** SQLiteコレクションファイルのパス */
  dbPath: string;
}

/**
 * パス検出結果の型定義
 */
export interface PathDetectionResult {
  /** 成功フラグ */
  success: boolean;
  /** 検出されたファイルパス */
  paths?: KindleCacheFiles;
  /** エラーメッセージ */
  error?: string;
  /** 検索対象となったパス一覧 */
  searchedPaths: string[];
  /** 自動検出か手動設定か */
  source: 'auto' | 'manual' | 'env';
}

/**
 * 設定保存用の型定義
 */
export interface PathConfiguration {
  /** Kindleキャッシュディレクトリパス */
  kindleCachePath: string;
  /** 最終検証日時 */
  lastValidated: string;
  /** 設定方法 */
  source: 'auto' | 'manual' | 'env';
}

/**
 * Kindleパス検出サービスクラス
 */
export class PathDetector {
  private readonly CONFIG_DIR: string;
  private readonly CONFIG_FILE: string;
  private readonly TARGET_FILES = {
    XML: 'KindleSyncMetadataCache.xml',
    DB: 'synced_collections.db',
  } as const;

  constructor(skipPlatformCheck: boolean = false) {
    // Windows環境チェック（テスト時はスキップ可能）
    if (!skipPlatformCheck && os.platform() !== 'win32') {
      throw new Error(
        'このサービスはWindows環境でのみ動作します。現在のプラットフォーム: ' +
          os.platform()
      );
    }

    // 設定ファイル保存場所の設定
    this.CONFIG_DIR = path.join(os.homedir(), '.kindle-bookmark');
    this.CONFIG_FILE = path.join(this.CONFIG_DIR, 'paths.json');

    log.info('PathDetectorサービスを初期化しました', {
      platform: os.platform(),
      configDir: this.CONFIG_DIR,
    });
  }

  /**
   * Kindleキャッシュファイルのパスを自動検出する
   * @param forceUpdate キャッシュを無視して再検出するかどうか
   * @returns パス検出結果
   */
  async detectKindlePaths(
    forceUpdate: boolean = false
  ): Promise<PathDetectionResult> {
    log.info('Kindleパスの自動検出を開始します', { forceUpdate });

    try {
      // 環境変数による個別パス指定を最優先でチェック（テスト用）
      // 必ず最初にチェックし、ファイル存在時は即座に使用
      if (process.env.KINDLE_XML_PATH && process.env.KINDLE_DB_PATH) {
        log.info('環境変数による個別パス指定を検出しました', {
          xmlPath: process.env.KINDLE_XML_PATH,
          dbPath: process.env.KINDLE_DB_PATH,
        });

        // 指定されたファイルの存在確認
        try {
          const xmlPath = path.resolve(process.env.KINDLE_XML_PATH);
          const dbPath = path.resolve(process.env.KINDLE_DB_PATH);

          const xmlStats = await fs.stat(xmlPath);
          const dbStats = await fs.stat(dbPath);

          if (xmlStats.isFile() && dbStats.isFile()) {
            log.info('環境変数で指定されたファイルが存在することを確認しました');
            return {
              success: true,
              paths: {
                xmlPath,
                dbPath,
              },
              searchedPaths: [xmlPath, dbPath],
              source: 'env',
            };
          }
        } catch (error) {
          log.warn('環境変数で指定されたファイルが見つかりません', {
            xmlPath: process.env.KINDLE_XML_PATH,
            dbPath: process.env.KINDLE_DB_PATH,
            error: error instanceof Error ? error.message : String(error),
          });
          // 環境変数が設定されていてもファイルが存在しない場合は、通常の検出フローに進む
        }
      }

      // 既存設定の確認（forceUpdateがfalseの場合）
      if (!forceUpdate) {
        const cachedResult = await this.loadCachedConfiguration();
        if (cachedResult.success) {
          log.info('キャッシュされた設定を使用します');
          return cachedResult;
        }
      }

      // パス候補の生成
      const pathCandidates = this.generatePathCandidates();
      log.info('パス候補を生成しました', {
        candidateCount: pathCandidates.length,
      });

      // 順次パス検証
      for (const candidatePath of pathCandidates) {
        const result = await this.validateKindlePath(candidatePath);
        if (result.success) {
          // 成功した設定を保存
          await this.saveConfiguration({
            kindleCachePath: candidatePath.basePath,
            lastValidated: new Date().toISOString(),
            source: candidatePath.source,
          });

          return {
            success: true,
            paths: result.paths!,
            searchedPaths: [candidatePath.basePath],
            source: candidatePath.source,
          };
        }
      }

      // すべての候補で見つからなかった
      const searchedPaths = pathCandidates.map((c) => c.basePath);
      const errorMessage = `Kindleファイルが見つかりませんでした。検索パス: ${searchedPaths.join(', ')}`;

      log.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        searchedPaths,
        source: 'auto',
      };
    } catch (error) {
      const errorMessage = `パス検出中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`;
      log.error(errorMessage, error);
      return {
        success: false,
        error: errorMessage,
        searchedPaths: [],
        source: 'auto',
      };
    }
  }

  /**
   * 手動でKindleパスを設定する
   * @param manualPath ユーザーが指定したパス
   * @returns 検証結果
   */
  async setManualPath(manualPath: string): Promise<PathDetectionResult> {
    log.info('手動パス設定を開始します', { manualPath });

    try {
      // パスの正規化とセキュリティ検証
      const normalizedPath = await this.validateAndNormalizePath(manualPath);

      // パス検証
      const result = await this.validateKindlePath({
        basePath: normalizedPath,
        source: 'manual',
      });

      if (result.success) {
        // 成功した設定を保存
        await this.saveConfiguration({
          kindleCachePath: normalizedPath,
          lastValidated: new Date().toISOString(),
          source: 'manual',
        });

        log.info('手動パス設定が成功しました', { path: normalizedPath });

        return {
          success: true,
          paths: result.paths!,
          searchedPaths: [normalizedPath],
          source: 'manual',
        };
      } else {
        log.warn('手動パス設定に失敗しました', { path: normalizedPath });
        return {
          success: false,
          error: result.error,
          searchedPaths: [normalizedPath],
          source: 'manual',
        };
      }
    } catch (error) {
      log.error('手動パス設定中にエラーが発生しました', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        searchedPaths: [manualPath],
        source: 'manual',
      };
    }
  }

  /**
   * 現在の設定を取得する
   * @returns 現在の設定、存在しない場合はundefined
   */
  async getCurrentConfiguration(): Promise<PathConfiguration | undefined> {
    try {
      await fs.access(this.CONFIG_FILE);
      const configData = await fs.readFile(this.CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData) as PathConfiguration;

      // 設定の妥当性チェック
      if (this.isValidConfiguration(config)) {
        return config;
      } else {
        log.warn('無効な設定ファイルが見つかりました', { config });
        return undefined;
      }
    } catch (error) {
      // ファイルが存在しない場合は正常（初回実行時）
      if ((error as { code?: string }).code === 'ENOENT') {
        return undefined;
      }

      log.error('設定ファイルの読み込みに失敗しました', error);
      return undefined;
    }
  }

  /**
   * 設定をクリアする
   */
  async clearConfiguration(): Promise<void> {
    try {
      await fs.unlink(this.CONFIG_FILE);
      log.info('設定ファイルを削除しました');
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') {
        log.error('設定ファイルの削除に失敗しました', error);
        throw error;
      }
    }
  }

  /**
   * パス候補を生成する
   */
  private generatePathCandidates(): Array<{
    basePath: string;
    source: 'auto' | 'env';
  }> {
    const candidates: Array<{ basePath: string; source: 'auto' | 'env' }> = [];

    // 環境変数からの取得を最優先
    const envPath = process.env.KINDLE_CACHE_PATH;
    if (envPath) {
      candidates.push({
        basePath: path.resolve(envPath),
        source: 'env',
      });
    }

    // 標準的なWindows Kindleインストールパス
    const userProfile = process.env.USERPROFILE;
    const localAppData = process.env.LOCALAPPDATA;

    if (userProfile) {
      candidates.push({
        basePath: path.join(
          userProfile,
          'AppData',
          'Local',
          'Amazon',
          'Kindle',
          'Cache'
        ),
        source: 'auto',
      });
    }

    if (localAppData) {
      candidates.push({
        basePath: path.join(localAppData, 'Amazon', 'Kindle', 'Cache'),
        source: 'auto',
      });
    }

    // 重複排除
    const uniqueCandidates = candidates.filter(
      (candidate, index, array) =>
        array.findIndex((c) => c.basePath === candidate.basePath) === index
    );

    log.info('パス候補を生成しました', {
      total: uniqueCandidates.length,
      candidates: uniqueCandidates.map((c) => ({
        path: c.basePath,
        source: c.source,
      })),
    });

    return uniqueCandidates;
  }

  /**
   * 指定されたパスでKindleファイルが存在するかを検証
   */
  private async validateKindlePath(candidate: {
    basePath: string;
    source: 'auto' | 'manual' | 'env';
  }): Promise<{
    success: boolean;
    paths?: KindleCacheFiles;
    error?: string;
  }> {
    try {
      // ベースディレクトリの存在確認
      await fs.access(candidate.basePath);
      const stats = await fs.stat(candidate.basePath);

      if (!stats.isDirectory()) {
        return {
          success: false,
          error: `指定されたパスはディレクトリではありません: ${candidate.basePath}`,
        };
      }

      // 必要ファイルのパス構築
      const xmlPath = path.join(candidate.basePath, this.TARGET_FILES.XML);
      const dbPath = path.join(candidate.basePath, 'db', this.TARGET_FILES.DB);

      // ファイル存在確認
      const fileChecks = await Promise.allSettled([
        this.validateFile(xmlPath, 'XML'),
        this.validateFile(dbPath, 'DB'),
      ]);

      // 結果チェック
      const xmlCheck = fileChecks[0];
      const dbCheck = fileChecks[1];

      if (xmlCheck.status === 'rejected') {
        return {
          success: false,
          error: `XMLファイルが見つかりません: ${xmlPath}`,
        };
      }

      if (dbCheck.status === 'rejected') {
        return {
          success: false,
          error: `データベースファイルが見つかりません: ${dbPath}`,
        };
      }

      log.info('Kindleファイルの検証が成功しました', {
        basePath: candidate.basePath,
        xmlPath,
        dbPath,
      });

      return {
        success: true,
        paths: { xmlPath, dbPath },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.warn('パス検証に失敗しました', {
        path: candidate.basePath,
        error: errorMessage,
      });

      return {
        success: false,
        error: `パス検証エラー: ${errorMessage}`,
      };
    }
  }

  /**
   * 個別ファイルの存在とアクセス権を検証
   */
  private async validateFile(
    filePath: string,
    fileType: string
  ): Promise<void> {
    try {
      // ファイル存在確認
      await fs.access(filePath, fs.constants.F_OK);

      // 読み取り権限確認
      await fs.access(filePath, fs.constants.R_OK);

      // ファイル情報取得
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        throw new Error(`${fileType}ファイルが通常ファイルではありません`);
      }

      if (stats.size === 0) {
        throw new Error(`${fileType}ファイルが空です`);
      }

      log.debug('ファイル検証成功', {
        filePath,
        fileType,
        size: stats.size,
        lastModified: stats.mtime,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        throw new Error(`${fileType}ファイルが存在しません: ${filePath}`);
      }

      if ((error as { code?: string }).code === 'EACCES') {
        throw new Error(
          `${fileType}ファイルにアクセス権限がありません: ${filePath}`
        );
      }

      throw error;
    }
  }

  /**
   * パスの正規化とセキュリティ検証
   */
  private async validateAndNormalizePath(inputPath: string): Promise<string> {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('パスが指定されていません');
    }

    // パスを正規化
    const normalizedPath = path.resolve(inputPath.trim());

    // セキュリティチェック: パストラバーサル攻撃防止
    if (normalizedPath.includes('..')) {
      throw new Error('セキュリティ違反: 不正なパスが含まれています');
    }

    // Windows以外の不適切なパス文字チェック
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(normalizedPath)) {
      throw new Error('無効な文字が含まれています');
    }

    return normalizedPath;
  }

  /**
   * キャッシュされた設定を読み込み、有効性を確認
   */
  private async loadCachedConfiguration(): Promise<PathDetectionResult> {
    try {
      const config = await this.getCurrentConfiguration();
      if (!config) {
        return {
          success: false,
          error: '設定ファイルが見つかりません',
          searchedPaths: [],
          source: 'auto',
        };
      }

      // 設定の有効期限チェック（24時間）
      const lastValidated = new Date(config.lastValidated);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        log.info('キャッシュが期限切れです。再検出を実行します', {
          lastValidated: config.lastValidated,
          hoursDiff,
        });
        return {
          success: false,
          error: 'キャッシュが期限切れです',
          searchedPaths: [],
          source: 'auto',
        };
      }

      // パスの再検証
      const validationResult = await this.validateKindlePath({
        basePath: config.kindleCachePath,
        source: config.source,
      });

      if (validationResult.success) {
        return {
          success: true,
          paths: validationResult.paths!,
          searchedPaths: [config.kindleCachePath],
          source: config.source,
        };
      } else {
        log.warn('キャッシュされたパスが無効になっています', {
          path: config.kindleCachePath,
          error: validationResult.error,
        });
        return {
          success: false,
          error: validationResult.error,
          searchedPaths: [config.kindleCachePath],
          source: config.source,
        };
      }
    } catch (error) {
      log.error('キャッシュ設定の読み込みに失敗しました', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        searchedPaths: [],
        source: 'auto',
      };
    }
  }

  /**
   * 設定を保存する
   */
  private async saveConfiguration(config: PathConfiguration): Promise<void> {
    try {
      // 設定ディレクトリの作成
      await fs.mkdir(this.CONFIG_DIR, { recursive: true });

      // 設定ファイルの書き込み
      const configJson = JSON.stringify(config, null, 2);
      await fs.writeFile(this.CONFIG_FILE, configJson, 'utf8');

      log.info('設定を保存しました', {
        configFile: this.CONFIG_FILE,
        kindleCachePath: config.kindleCachePath,
        source: config.source,
      });
    } catch (error) {
      log.error('設定の保存に失敗しました', error);
      throw new Error(
        `設定の保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 設定の妥当性をチェック
   */
  private isValidConfiguration(config: unknown): config is PathConfiguration {
    if (!config || typeof config !== 'object' || config === null) {
      return false;
    }

    const configObj = config as Record<string, unknown>;

    return (
      typeof configObj.kindleCachePath === 'string' &&
      typeof configObj.lastValidated === 'string' &&
      (configObj.source === 'auto' ||
        configObj.source === 'manual' ||
        configObj.source === 'env') &&
      configObj.kindleCachePath.length > 0 &&
      !isNaN(new Date(configObj.lastValidated).getTime())
    );
  }
}

/**
 * シングルトンインスタンス
 * テスト環境では手動でインスタンス化する
 */
let _pathDetector: PathDetector | undefined;

export function getPathDetector(): PathDetector {
  if (!_pathDetector) {
    _pathDetector = new PathDetector();
  }
  return _pathDetector;
}

// レガシー互換性のため
export const pathDetector = (() => {
  try {
    return getPathDetector();
  } catch {
    // テスト環境では無効なインスタンスを返す
    return {} as PathDetector;
  }
})();