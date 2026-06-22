import { TemplatesClient } from '../clients/templates';
import { ParselyzeError } from '../errors';
import { CreateTemplateOptions, Template, TemplateListItem } from '../types';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => Buffer.from('mock file content')),
}));

const mockTemplate: Template = {
  id: 'tpl_abc123',
  name: 'Invoice',
  description: 'Extract invoice data',
  schema: { invoice: { invoiceNumber: { type: 'string' } } },
  category: 'INVOICE',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const mockCreateOptions: CreateTemplateOptions = {
  name: 'Invoice',
  category: 'INVOICE',
  schema: { data: { invoiceNumber: { type: 'string', description: 'Invoice number' } } },
};

describe('TemplatesClient', () => {
  let client: TemplatesClient;

  beforeEach(() => {
    client = new TemplatesClient('plz_test_key', 'https://api.test.com', 30000);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list method', () => {
    it('should return an array of template list items', async () => {
      const mockItems: TemplateListItem[] = [
        { id: 'tpl_1', name: 'Invoice' },
        { id: 'tpl_2', name: 'Receipt' },
      ];
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue(mockItems) });

      const result = await client.list();

      expect(result).toEqual(mockItems);
      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/templates',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'x-api-key': 'plz_test_key' }),
        }),
      );
    });

    it('should return an empty array when no templates exist', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue([]) });

      const result = await client.list();

      expect(result).toEqual([]);
    });

    it('should throw ParselyzeError on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ message: 'Invalid API key' }),
      });

      await expect(client.list()).rejects.toThrow(ParselyzeError);
      await expect(client.list()).rejects.toThrow('Invalid API key');
    });

    it('should throw ParselyzeError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(client.list()).rejects.toThrow(ParselyzeError);
      await expect(client.list()).rejects.toThrow('Network error: Network failure');
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create method', () => {
    it('should throw ParselyzeError when name is missing', async () => {
      await expect(client.create({ ...mockCreateOptions, name: '' })).rejects.toThrow(ParselyzeError);
      await expect(client.create({ ...mockCreateOptions, name: '' })).rejects.toThrow('Template name is required');
    });

    it('should throw ParselyzeError when category is missing', async () => {
      await expect(client.create({ ...mockCreateOptions, category: '' as any })).rejects.toThrow(ParselyzeError);
      await expect(client.create({ ...mockCreateOptions, category: '' as any })).rejects.toThrow('Template category is required');
    });

    it('should throw ParselyzeError when schema is missing', async () => {
      await expect(client.create({ ...mockCreateOptions, schema: null as any })).rejects.toThrow(ParselyzeError);
      await expect(client.create({ ...mockCreateOptions, schema: null as any })).rejects.toThrow('Template schema is required');
    });

    it('should return created template on success', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 201, json: jest.fn().mockResolvedValue(mockTemplate) });

      const result = await client.create(mockCreateOptions);

      expect(result).toEqual(mockTemplate);
      expect(result.id).toBe('tpl_abc123');
      expect(result.category).toBe('INVOICE');
    });

    it('should POST to correct URL with correct body and headers', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 201, json: jest.fn().mockResolvedValue(mockTemplate) });

      await client.create(mockCreateOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/templates',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockCreateOptions),
          headers: expect.objectContaining({
            'x-api-key': 'plz_test_key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw ParselyzeError with backend message on 400', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ message: 'schema.data.invoiceNumber.type must be one of: string, number, boolean, date, array, object' }),
      });

      await expect(client.create(mockCreateOptions)).rejects.toThrow('schema.data.invoiceNumber.type must be one of');
    });

    it('should throw ParselyzeError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(client.create(mockCreateOptions)).rejects.toThrow(ParselyzeError);
    });
  });

  // ---------------------------------------------------------------------------
  // create from document
  // ---------------------------------------------------------------------------
  describe('createFromDocument method', () => {
    it('should throw ParselyzeError when name is missing', async () => {
      await expect(client.createFromDocument({ file: 'doc.pdf', name: '' })).rejects.toThrow(ParselyzeError);
      await expect(client.createFromDocument({ file: 'doc.pdf', name: '' })).rejects.toThrow('Template name is required');
    });

    it('should throw ParselyzeError when file is missing', async () => {
      await expect(client.createFromDocument({ file: null as any, name: 'Template Name' })).rejects.toThrow(ParselyzeError);
      await expect(client.createFromDocument({ file: null as any, name: 'Template Name' })).rejects.toThrow('File buffer is required');
    });

    it('should return created template on success', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 201, json: jest.fn().mockResolvedValue(mockTemplate) });

      const result = await client.createFromDocument({ file: 'doc.pdf', name: 'Template Name' });

      expect(result).toEqual(mockTemplate);
      expect(result.id).toBe('tpl_abc123');
      expect(result.category).toBe('INVOICE');
    });

    it('should POST to correct URL with correct body and headers', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 201, json: jest.fn().mockResolvedValue(mockTemplate) });

      await client.createFromDocument({ file: 'doc.pdf', name: 'Template Name' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/templates/fromDocument',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
          headers: expect.objectContaining({
            'x-api-key': 'plz_test_key',
          }),
        }),
      );
    });

    it('should throw ParselyzeError with backend message on 400', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ message: 'schema.data.invoiceNumber.type must be one of: string, number, boolean, date, array, object' }),
      });

      await expect(client.create(mockCreateOptions)).rejects.toThrow('schema.data.invoiceNumber.type must be one of');
    });

    it('should throw ParselyzeError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(client.create(mockCreateOptions)).rejects.toThrow(ParselyzeError);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update method', () => {
    it('should throw ParselyzeError when templateId is missing', async () => {
      await expect(client.update('', mockCreateOptions)).rejects.toThrow(ParselyzeError);
      await expect(client.update('', mockCreateOptions)).rejects.toThrow('Template ID is required');
    });

    it('should throw ParselyzeError when name is missing', async () => {
      await expect(client.update('tpl_abc123', { ...mockCreateOptions, name: '' })).rejects.toThrow(ParselyzeError);
      await expect(client.update('tpl_abc123', { ...mockCreateOptions, name: '' })).rejects.toThrow('Template name is required');
    });

    it('should throw ParselyzeError when category is missing', async () => {
      await expect(client.update('tpl_abc123', { ...mockCreateOptions, category: '' as any })).rejects.toThrow(ParselyzeError);
    });

    it('should throw ParselyzeError when schema is missing', async () => {
      await expect(client.update('tpl_abc123', { ...mockCreateOptions, schema: null as any })).rejects.toThrow(ParselyzeError);
    });

    it('should return updated template on success', async () => {
      const updatedTemplate = { ...mockTemplate, name: 'Invoice v2' };
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue(updatedTemplate) });

      const result = await client.update('tpl_abc123', { ...mockCreateOptions, name: 'Invoice v2' });

      expect(result.name).toBe('Invoice v2');
      expect(result.id).toBe('tpl_abc123');
    });

    it('should PUT to correct URL with correct body and headers', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue(mockTemplate) });

      await client.update('tpl_abc123', mockCreateOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/templates/tpl_abc123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockCreateOptions),
          headers: expect.objectContaining({
            'x-api-key': 'plz_test_key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw ParselyzeError with status 404 when template not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: 'Template not found' }),
      });

      let thrownError: ParselyzeError | undefined;
      try {
        await client.update('tpl_unknown', mockCreateOptions);
      } catch (e) {
        thrownError = e as ParselyzeError;
      }

      expect(thrownError).toBeInstanceOf(ParselyzeError);
      expect(thrownError?.status).toBe(404);
      expect(thrownError?.message).toBe('Template not found');
    });

    it('should throw ParselyzeError with status 403 when not authorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue({ message: 'Not authorized to update this template' }),
      });

      let thrownError: ParselyzeError | undefined;
      try {
        await client.update('tpl_other_user', mockCreateOptions);
      } catch (e) {
        thrownError = e as ParselyzeError;
      }

      expect(thrownError).toBeInstanceOf(ParselyzeError);
      expect(thrownError?.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete method', () => {
    it('should throw ParselyzeError when templateId is missing', async () => {
      await expect(client.delete('')).rejects.toThrow(ParselyzeError);
      await expect(client.delete('')).rejects.toThrow('Template ID is required');
    });

    it('should resolve without value on successful deletion (204)', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 204, json: jest.fn() });

      await expect(client.delete('tpl_abc123')).resolves.toBeUndefined();
    });

    it('should DELETE to correct URL with correct headers', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 204, json: jest.fn() });

      await client.delete('tpl_abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/templates/tpl_abc123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'x-api-key': 'plz_test_key',
          }),
        }),
      );
    });

    it('should throw ParselyzeError with status 404 when template not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: 'Template not found' }),
      });

      let thrownError: ParselyzeError | undefined;
      try {
        await client.delete('tpl_unknown');
      } catch (e) {
        thrownError = e as ParselyzeError;
      }

      expect(thrownError).toBeInstanceOf(ParselyzeError);
      expect(thrownError?.status).toBe(404);
    });

    it('should throw ParselyzeError with status 403 when not authorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue({ message: 'Not authorized to delete this template' }),
      });

      let thrownError: ParselyzeError | undefined;
      try {
        await client.delete('tpl_other_user');
      } catch (e) {
        thrownError = e as ParselyzeError;
      }

      expect(thrownError).toBeInstanceOf(ParselyzeError);
      expect(thrownError?.status).toBe(403);
    });

    it('should throw ParselyzeError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(client.delete('tpl_abc123')).rejects.toThrow(ParselyzeError);
    });
  });
});
