/**
 * カスタムエラークラスのテスト
 */

import {
  BaseError,
  KindleFileNotFoundError,
  ValidationError,
  InvalidAsinError,
  NotFoundError,
  MethodNotAllowedError,
  validateAsin,
  isOperationalError,
  createErrorResponse,
  createSuccessResponse,
} from '../errors';
import { ERROR_CODES, ERROR_MESSAGES } from '../../types/errors';

describe('カスタムエラークラス', () => {
  describe('BaseError', () => {
    it('基本的なエラーインスタンスを作成できる', () => {
      const error = new BaseError('テストエラー', 400, 'TEST_ERROR', { test: true });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('テストエラー');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ test: true });
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('BaseError');
    });

    it('isOperationalのデフォルト値はtrue', () => {
      const error = new BaseError('テスト', 500, 'TEST');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('KindleFileNotFoundError', () => {
    it('適切なプロパティを持つエラーを作成する', () => {
      const error = new KindleFileNotFoundError({
        searchedPaths: ['/path1', '/path2'],
        fileName: 'test.xml',
      });

      expect(error).toBeInstanceOf(KindleFileNotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ERROR_CODES.KINDLE_FILES_NOT_FOUND);
      expect(error.message).toBe(ERROR_MESSAGES[ERROR_CODES.KINDLE_FILES_NOT_FOUND]);
      expect(error.details).toEqual({
        searchedPaths: ['/path1', '/path2'],
        fileName: 'test.xml',
      });
    });
  });

  describe('ValidationError', () => {
    it('カスタムメッセージを設定できる', () => {
      const error = new ValidationError('カスタムバリデーションエラー', {
        field: 'email',
        value: 'invalid-email',
        reason: '無効なメールアドレス形式',
      });

      expect(error.message).toBe('カスタムバリデーションエラー');
      expect(error.statusCode).toBe(400);
      expect(error.details?.field).toBe('email');
    });

    it('デフォルトメッセージを使用する', () => {
      const error = new ValidationError();
      expect(error.message).toBe(ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR]);
    });
  });

  describe('InvalidAsinError', () => {
    it('無効なASINを含むエラーを作成する', () => {
      const error = new InvalidAsinError('INVALID123');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ERROR_CODES.INVALID_ASIN);
      expect(error.details?.asin).toBe('INVALID123');
    });
  });

  describe('NotFoundError', () => {
    it('リソース名を含むエラーを作成する', () => {
      const error = new NotFoundError('user:123');
      expect(error.details?.resource).toBe('user:123');
    });

    it('リソース名なしでもエラーを作成できる', () => {
      const error = new NotFoundError();
      expect(error.details).toBeUndefined();
    });
  });

  describe('MethodNotAllowedError', () => {
    it('許可されたメソッドリストを含むエラーを作成する', () => {
      const error = new MethodNotAllowedError('DELETE', ['GET', 'POST']);

      expect(error.statusCode).toBe(405);
      expect(error.details?.method).toBe('DELETE');
      expect(error.details?.allowedMethods).toEqual(['GET', 'POST']);
    });
  });
});

describe('ユーティリティ関数', () => {
  describe('validateAsin', () => {
    it('有効なASINは検証を通過する', () => {
      expect(() => validateAsin('B08N5WRWNW')).not.toThrow();
      expect(() => validateAsin('4065123456')).not.toThrow();
    });

    it('無効なASINは例外を投げる', () => {
      expect(() => validateAsin('invalid')).toThrow(InvalidAsinError);
      expect(() => validateAsin('B08N5WRWN')).toThrow(InvalidAsinError); // 9文字
      expect(() => validateAsin('B08N5WRWNW1')).toThrow(InvalidAsinError); // 11文字
      expect(() => validateAsin('b08n5wrwnw')).toThrow(InvalidAsinError); // 小文字
    });

    it('nullやundefinedは例外を投げる', () => {
      expect(() => validateAsin(null as any)).toThrow(InvalidAsinError);
      expect(() => validateAsin(undefined as any)).toThrow(InvalidAsinError);
      expect(() => validateAsin('')).toThrow(InvalidAsinError);
    });
  });

  describe('isOperationalError', () => {
    it('BaseErrorの場合はisOperationalプロパティを返す', () => {
      const operationalError = new BaseError('test', 400, 'TEST', {}, true);
      const nonOperationalError = new BaseError('test', 500, 'TEST', {}, false);

      expect(isOperationalError(operationalError)).toBe(true);
      expect(isOperationalError(nonOperationalError)).toBe(false);
    });

    it('通常のErrorの場合はfalseを返す', () => {
      const normalError = new Error('normal error');
      expect(isOperationalError(normalError)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('エラーレスポンスを正しく作成する', () => {
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'カスタムメッセージ',
        { field: 'test' }
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.error.message).toBe('カスタムメッセージ');
      expect(response.error.details).toEqual({ field: 'test' });
      expect(response.timestamp).toBeDefined();
    });

    it('メッセージが指定されない場合はデフォルトを使用', () => {
      const response = createErrorResponse(ERROR_CODES.NOT_FOUND);
      expect(response.error.message).toBe(ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]);
    });
  });

  describe('createSuccessResponse', () => {
    it('成功レスポンスを正しく作成する', () => {
      const data = { id: 1, name: 'test' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });
  });
});