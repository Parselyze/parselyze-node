import { WebhooksClient } from '../clients/webhooks';
import { ParselyzeError } from '../errors';

describe('WebhooksClient', () => {
  let client: WebhooksClient;
  const testSecret = 'test_webhook_secret_123';
  const testPayload = {
    eventId: 'evt_123',
    eventType: 'document.completed',
    jobId: 'job_456',
    status: 'completed',
    result: { invoice: { number: 'INV-001' } },
    pageCount: 3,
    timestamp: '2026-02-15T12:00:00Z',
  };

  const makeSignature = (body: object | string, secret = testSecret): string => {
    const crypto = require('crypto');
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    return crypto.createHmac('sha256', secret).update(str).digest('hex');
  };

  beforeEach(() => {
    client = new WebhooksClient(testSecret);
  });

  describe('verifySignature', () => {
    it('should return true for valid signature with object payload', () => {
      const result = client.verifySignature(testPayload, makeSignature(testPayload));
      expect(result).toBe(true);
    });

    it('should return true for valid signature with string payload', () => {
      const bodyString = JSON.stringify(testPayload);
      const result = client.verifySignature(bodyString, makeSignature(bodyString));
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      expect(client.verifySignature(testPayload, 'invalid_signature_abc123')).toBe(false);
    });

    it('should return false for signature with wrong secret', () => {
      const sig = makeSignature(testPayload, 'wrong_secret');
      expect(client.verifySignature(testPayload, sig)).toBe(false);
    });

    it('should return false for tampered payload', () => {
      const sig = makeSignature(testPayload);
      const tamperedPayload = { ...testPayload, jobId: 'tampered_job_id' };
      expect(client.verifySignature(tamperedPayload, sig)).toBe(false);
    });

    it('should return false for empty signature', () => {
      expect(client.verifySignature(testPayload, '')).toBe(false);
    });

    it('should return false when client has no secret', () => {
      const clientNoSecret = new WebhooksClient();
      expect(clientNoSecret.verifySignature(testPayload, makeSignature(testPayload))).toBe(false);
    });

    it('should handle document.failed payload', () => {
      const failedPayload = {
        eventId: 'evt_789',
        eventType: 'document.failed',
        jobId: 'job_999',
        status: 'failed',
        error: 'Processing error',
        timestamp: '2026-02-15T12:00:00Z',
      };
      expect(client.verifySignature(failedPayload, makeSignature(failedPayload))).toBe(true);
    });

    it('should return false for signatures with different lengths', () => {
      expect(client.verifySignature(testPayload, 'abc')).toBe(false);
      expect(client.verifySignature(testPayload, makeSignature(testPayload) + 'extra')).toBe(false);
    });

    it('should return false when constructor secret is wrong', () => {
      const clientWrongSecret = new WebhooksClient('wrong_secret');
      expect(clientWrongSecret.verifySignature(testPayload, makeSignature(testPayload))).toBe(false);
    });
  });

  describe('constructEvent', () => {
    it('should return typed payload for valid signature with object body', () => {
      const sig = makeSignature(testPayload);
      const event = client.constructEvent(testPayload, sig);
      expect(event.eventId).toBe('evt_123');
      expect(event.eventType).toBe('document.completed');
      expect(event.jobId).toBe('job_456');
      expect(event.status).toBe('completed');
      expect(event.result).toEqual({ invoice: { number: 'INV-001' } });
    });

    it('should return typed payload for valid signature with string body', () => {
      const bodyString = JSON.stringify(testPayload);
      const sig = makeSignature(bodyString);
      const event = client.constructEvent(bodyString, sig);
      expect(event.eventId).toBe('evt_123');
      expect(event.eventType).toBe('document.completed');
    });

    it('should throw ParselyzeError with INVALID_SIGNATURE for wrong signature', () => {
      expect.assertions(4);
      expect(() => client.constructEvent(testPayload, 'bad_sig')).toThrow(ParselyzeError);
      expect(() => client.constructEvent(testPayload, 'bad_sig')).toThrow('Invalid webhook signature');
      try {
        client.constructEvent(testPayload, 'bad_sig');
        fail('Expected constructEvent to throw');
      } catch (e) {
        expect(e instanceof ParselyzeError && e.code).toBe('INVALID_SIGNATURE');
        expect(e instanceof ParselyzeError && e.status).toBe(401);
      }
    });

    it('should throw ParselyzeError with INVALID_SIGNATURE when no secret configured', () => {
      const clientNoSecret = new WebhooksClient();
      const sig = makeSignature(testPayload);
      expect(() => clientNoSecret.constructEvent(testPayload, sig)).toThrow(ParselyzeError);
    });

    it('should throw ParselyzeError with INVALID_PAYLOAD for malformed JSON string', () => {
      expect.assertions(3);
      const invalidJson = '{not valid json}}}';
      // Force a valid signature for the invalid JSON to test the parsing branch
      const sig = makeSignature(invalidJson);
      const clientForInvalid = new WebhooksClient(testSecret);
      expect(() => clientForInvalid.constructEvent(invalidJson, sig)).toThrow(ParselyzeError);
      try {
        clientForInvalid.constructEvent(invalidJson, sig);
        fail('Expected constructEvent to throw');
      } catch (e) {
        expect(e instanceof ParselyzeError && e.code).toBe('INVALID_PAYLOAD');
        expect(e instanceof ParselyzeError && e.status).toBe(400);
      }
    });

    it('should support generic type parameter', () => {
      interface InvoiceData { number: string }
      const sig = makeSignature(testPayload);
      const event = client.constructEvent<InvoiceData>(testPayload, sig);
      // TypeScript type check: event.result should be InvoiceData | undefined
      expect(event.result).toEqual({ invoice: { number: 'INV-001' } });
    });

    it('should handle document.failed event', () => {
      const failedPayload = {
        eventId: 'evt_789',
        eventType: 'document.failed' as const,
        jobId: 'job_999',
        status: 'failed' as const,
        error: 'Processing error',
        timestamp: '2026-02-15T12:00:00Z',
      };
      const sig = makeSignature(failedPayload);
      const event = client.constructEvent(failedPayload, sig);
      expect(event.eventType).toBe('document.failed');
      expect(event.error).toBe('Processing error');
    });
  });
});
