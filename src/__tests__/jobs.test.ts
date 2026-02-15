import { JobsClient } from '../clients/jobs';
import { ParselyzeError } from '../errors';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('JobsClient', () => {
  let client: JobsClient;

  beforeEach(() => {
    client = new JobsClient('plz_test_key', 'https://api.test.com', 30000);
    jest.clearAllMocks();
  });

  describe('get method', () => {
    it('should throw error for missing job ID', async () => {
      await expect(client.get('')).rejects.toThrow(ParselyzeError);
    });

    it('should handle successful job retrieval - pending', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jobId: 'job_123',
          status: 'pending',
          fileName: 'test.pdf',
          templateId: 'template123',
          result: null,
          error: null,
          pageCount: null,
          attempts: 0,
          createdAt: '2026-02-15T12:00:00Z',
          startedAt: null,
          completedAt: null,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('job_123');

      expect(result.jobId).toBe('job_123');
      expect(result.status).toBe('pending');
      expect(result.fileName).toBe('test.pdf');
      expect(result.result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job_123',
        expect.objectContaining({
          method: 'GET',
          headers: { 'x-api-key': 'plz_test_key' },
        }),
      );
    });

    it('should handle successful job retrieval - completed', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jobId: 'job_123',
          status: 'completed',
          fileName: 'test.pdf',
          templateId: 'template123',
          result: { invoice: { number: 'INV-001', total: 1250.75 } },
          error: null,
          pageCount: 3,
          attempts: 1,
          createdAt: '2026-02-15T12:00:00Z',
          startedAt: '2026-02-15T12:00:05Z',
          completedAt: '2026-02-15T12:00:15Z',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('job_123');

      expect(result.status).toBe('completed');
      expect(result.result).toEqual({
        invoice: { number: 'INV-001', total: 1250.75 },
      });
      expect(result.pageCount).toBe(3);
      expect(result.completedAt).toBe('2026-02-15T12:00:15Z');
    });

    it('should handle successful job retrieval - failed', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          jobId: 'job_123',
          status: 'failed',
          fileName: 'test.pdf',
          templateId: 'template123',
          result: null,
          error: 'Document processing failed',
          pageCount: null,
          attempts: 3,
          createdAt: '2026-02-15T12:00:00Z',
          startedAt: '2026-02-15T12:00:05Z',
          completedAt: null,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('job_123');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Document processing failed');
      expect(result.attempts).toBe(3);
    });

    it('should handle job not found error', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({
          message: 'Job not found or does not belong to you',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(client.get('invalid_job')).rejects.toThrow(ParselyzeError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.get('job_123')).rejects.toThrow(ParselyzeError);
    });
  });
});
