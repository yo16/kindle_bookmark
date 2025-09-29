/**
 * 書籍APIエンドポイントのテスト
 * sample_file以下のテストデータを使用
 */

import request from 'supertest';
import path from 'path';
import app from '../../app';

// 環境変数をテスト用に設定
process.env.KINDLE_XML_PATH = path.join(__dirname, '../../../../sample_file/KindleSyncMetadataCache.xml');
process.env.KINDLE_DB_PATH = path.join(__dirname, '../../../../sample_file/synced_collections.db');

describe('GET /api/books', () => {
  describe('基本的な動作', () => {
    it('書籍一覧を取得できること', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('books');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.data.books)).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('各書籍が正しい形式であること', async () => {
      const response = await request(app)
        .get('/api/books?limit=1')
        .expect(200);

      if (response.body.data.books.length > 0) {
        const book = response.body.data.books[0];
        expect(book).toHaveProperty('asin');
        expect(book).toHaveProperty('title');
        expect(book).toHaveProperty('author');
        expect(book).toHaveProperty('collections');
        expect(Array.isArray(book.collections)).toBe(true);
        
        // ASINの形式チェック
        expect(book.asin).toMatch(/^[A-Z0-9]{10}$/);
      }
    });
  });

  describe('検索機能', () => {
    it('タイトルで検索できること', async () => {
      const response = await request(app)
        .get('/api/books?search=プログラミング')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // 検索結果がある場合は、タイトルに検索語が含まれていることを確認
      if (response.body.data.books.length > 0) {
        const hasMatch = response.body.data.books.some((book: any) =>
          book.title.toLowerCase().includes('プログラミング'.toLowerCase())
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('空の検索キーワードでも動作すること', async () => {
      const response = await request(app)
        .get('/api/books?search=')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('books');
    });
  });

  describe('コレクションフィルター', () => {
    it('コレクションでフィルタリングできること', async () => {
      // まずコレクション一覧を取得
      const allBooksResponse = await request(app)
        .get('/api/books')
        .expect(200);

      const collections = new Set<string>();
      allBooksResponse.body.data.books.forEach((book: any) => {
        book.collections.forEach((col: string) => collections.add(col));
      });

      if (collections.size > 0) {
        const testCollection = Array.from(collections)[0];
        
        const response = await request(app)
          .get(`/api/books?collection=${encodeURIComponent(testCollection)}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        
        // フィルター結果の書籍がすべて指定のコレクションを含むことを確認
        response.body.data.books.forEach((book: any) => {
          expect(book.collections).toContain(testCollection);
        });
      }
    });
  });

  describe('ソート機能', () => {
    it('タイトル昇順でソートできること', async () => {
      const response = await request(app)
        .get('/api/books?sort=title_asc&limit=10')
        .expect(200);

      const books = response.body.data.books;
      if (books.length > 1) {
        for (let i = 1; i < books.length; i++) {
          const comparison = books[i - 1].title.localeCompare(books[i].title, 'ja');
          expect(comparison).toBeLessThanOrEqual(0);
        }
      }
    });

    it('タイトル降順でソートできること', async () => {
      const response = await request(app)
        .get('/api/books?sort=title_desc&limit=10')
        .expect(200);

      const books = response.body.data.books;
      if (books.length > 1) {
        for (let i = 1; i < books.length; i++) {
          const comparison = books[i - 1].title.localeCompare(books[i].title, 'ja');
          expect(comparison).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('不明なソート種別でもエラーにならないこと', async () => {
      const response = await request(app)
        .get('/api/books?sort=invalid_sort')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('books');
    });
  });

  describe('ページネーション', () => {
    it('limit パラメータが動作すること', async () => {
      const response = await request(app)
        .get('/api/books?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeLessThanOrEqual(5);
    });

    it('offset パラメータが動作すること', async () => {
      const firstPage = await request(app)
        .get('/api/books?limit=5&offset=0')
        .expect(200);

      const secondPage = await request(app)
        .get('/api/books?limit=5&offset=5')
        .expect(200);

      // 最初のページと2ページ目の最初の書籍が異なることを確認
      if (firstPage.body.data.books.length > 0 && secondPage.body.data.books.length > 0) {
        expect(firstPage.body.data.books[0].asin).not.toBe(secondPage.body.data.books[0].asin);
      }
    });

    it('hasMore フラグが正しく設定されること', async () => {
      const response = await request(app)
        .get('/api/books?limit=1&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // 総件数が1より大きければhasMoreはtrue
      if (response.body.data.totalCount > 1) {
        expect(response.body.data.hasMore).toBe(true);
      } else {
        expect(response.body.data.hasMore).toBe(false);
      }
    });

    it('limitの最大値が1000に制限されること', async () => {
      const response = await request(app)
        .get('/api/books?limit=2000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('複合条件', () => {
    it('検索とソートを組み合わせられること', async () => {
      const response = await request(app)
        .get('/api/books?search=a&sort=title_desc&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const books = response.body.data.books;
      // 降順ソートの確認
      if (books.length > 1) {
        for (let i = 1; i < books.length; i++) {
          const comparison = books[i - 1].title.localeCompare(books[i].title, 'ja');
          expect(comparison).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('すべてのパラメータを組み合わせられること', async () => {
      const response = await request(app)
        .get('/api/books?search=a&collection=test&sort=title_asc&limit=5&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('books');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('hasMore');
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なlimit値でもエラーにならないこと', async () => {
      const response = await request(app)
        .get('/api/books?limit=abc')
        .expect(200);

      expect(response.body.success).toBe(true);
      // NaNの場合はデフォルト値が使われる
      expect(response.body.data).toHaveProperty('books');
    });

    it('負のoffset値でもエラーにならないこと', async () => {
      const response = await request(app)
        .get('/api/books?offset=-10')
        .expect(200);

      expect(response.body.success).toBe(true);
      // 負の値は0として扱われる
      expect(response.body.data).toHaveProperty('books');
    });
  });
});