/**
 * エラーハンドリングのテスト
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../errorHandler';
import {
  KindleFileNotFoundError,
  ValidationError,
  InvalidAsinError,
} from '../../utils/errors';
import { ERROR_CODES } from '../../types/errors';

// モック設定
jest.mock('../../utils/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    request: jest.fn(),
    kindle: jest.fn(),
  },
}));

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // リクエストのモック
    mockReq = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn((name: string) => {
        if (name === 'set-cookie') return undefined;
        return 'test-user-agent';
      }) as any,
    };

    // レスポンスのモック
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    } as any;

    // next関数のモック
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BaseError のハンドリング', () => {
    it('KindleFileNotFoundErrorを適切に処理する', () => {
      const error = new KindleFileNotFoundError({
        searchedPaths: ['/path/to/kindle'],
        fileName: 'test.xml',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ERROR_CODES.KINDLE_FILES_NOT_FOUND,
            message: 'Kindleのキャッシュファイルが見つかりません',
          }),
        })
      );
    });

    it('ValidationErrorを適切に処理する', () => {
      const error = new ValidationError('無効な入力です', {
        field: 'asin',
        value: 'invalid',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: '無効な入力です',
            details: {
              field: 'asin',
              value: 'invalid',
            },
          }),
        })
      );
    });

    it('InvalidAsinErrorを適切に処理する', () => {
      const error = new InvalidAsinError('INVALID123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ERROR_CODES.INVALID_ASIN,
            message: '無効なASIN形式です',
            details: {
              asin: 'INVALID123',
            },
          }),
        })
      );
    });
  });

  describe('通常のErrorのハンドリング', () => {
    it('予期しないエラーを500エラーとして処理する', () => {
      const error = new Error('予期しないエラー');
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: 'サーバー内部エラーが発生しました',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('開発環境では詳細なエラー情報を含める', () => {
      const error = new Error('詳細なエラー');
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: '詳細なエラー',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('レスポンス送信済みの場合', () => {
    it('headersSentがtrueの場合はnextを呼ぶ', () => {
      const error = new Error('test error');
      mockRes.headersSent = true;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});

describe('notFoundHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/unknown',
      ip: '127.0.0.1',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  it('404エラーを適切に返す', () => {
    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ERROR_CODES.NOT_FOUND,
          message: expect.stringContaining('リソースが見つかりません'),
        }),
      })
    );
  });
});