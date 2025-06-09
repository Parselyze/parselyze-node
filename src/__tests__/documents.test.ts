import { DocumentsClient } from '../clients/documents';
import { ParselyzeError } from '../errors';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock global FormData
const mockFormData = {
  append: jest.fn(),
};
(global as any).FormData = jest.fn(() => mockFormData);

// Mock global Blob
(global as any).Blob = jest.fn((content) => ({ content }));

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => Buffer.from('mock file content')),
}));

describe('DocumentsClient', () => {
  let client: DocumentsClient;

  beforeEach(() => {
    client = new DocumentsClient('plz_test_key', 'https://api.test.com', 30000);
    jest.clearAllMocks();
  });

  describe('parse method', () => {
    it('should throw error for empty files array', async () => {
      await expect(client.parse({ files: [], templateId: 'test' }))
        .rejects.toThrow(ParselyzeError);
    });

    it('should throw error for missing template ID', async () => {
      await expect(client.parse({ files: ['test.pdf'], templateId: '' }))
        .rejects.toThrow(ParselyzeError);
    });

    it('should handle successful single document response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { field1: 'value1' },
          pageCount: 2,
          pageUsed: 1,
          pageRemaining: 99,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.parse({
        files: ['test.pdf'],
        templateId: 'template123',
      });

      expect('result' in result).toBe(true);
      if ('result' in result) {
        expect(result.result).toEqual({ field1: 'value1' });
        expect(result.pageCount).toBe(2);
        expect(result.pageUsed).toBe(1);
        expect(result.pageRemaining).toBe(99);
      }
    });

    it('should handle successful multiple documents response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            { filename: 'doc1.pdf', result: { field1: 'value1' } },
            { filename: 'doc2.pdf', result: { field2: 'value2' } }
          ],
          pageCount: 5,
          pageUsed: 2,
          pageRemaining: 98,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.parse({
        files: ['doc1.pdf', 'doc2.pdf'],
        templateId: 'template123',
      });

      expect('results' in result).toBe(true);
      if ('results' in result) {
        expect(result.results).toHaveLength(2);
        expect(result.results[0].filename).toBe('doc1.pdf');
        expect(result.results[0].result).toEqual({ field1: 'value1' });
        expect(result.pageCount).toBe(5);
        expect(result.pageUsed).toBe(2);
        expect(result.pageRemaining).toBe(98);
      }
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({
          message: 'Invalid template ID',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(client.parse({
        files: ['test.pdf'],
        templateId: 'invalid',
      })).rejects.toThrow(ParselyzeError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.parse({
        files: ['test.pdf'],
        templateId: 'template123',
      })).rejects.toThrow(ParselyzeError);
    });

    it('should handle multiple documents response with pageCount', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            { filename: 'doc1.pdf', result: { field1: 'value1' } },
            { filename: 'doc2.pdf', result: { field2: 'value2' } }
          ],
          pageCount: 5, // Backend now returns pageCount consistently
          pageUsed: 2,
          pageRemaining: 98,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.parse({
        files: ['doc1.pdf', 'doc2.pdf'],
        templateId: 'template123',
      });

      expect(result).toHaveProperty('results');
      expect((result as any).results).toHaveLength(2);
      expect((result as any).results[0].filename).toBe('doc1.pdf');
      expect((result as any).pageCount).toBe(5); // Should have pageCount
      expect((result as any).pageUsed).toBe(2);
      expect((result as any).pageRemaining).toBe(98);
      expect((result as any).totalPageCount).toBeUndefined(); // Should not have totalPageCount
    });

    it('should handle zip file source in multiple documents', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            { filename: 'doc1.pdf', result: { field1: 'value1' } }
          ],
          pageCount: 2,
          pageUsed: 1,
          pageRemaining: 99,
          source: 'zip',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.parse({
        files: ['archive.zip'],
        templateId: 'template123',
      });

      expect((result as any).source).toBe('zip');
    });
  });
});
