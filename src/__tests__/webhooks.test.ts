import { WebhooksClient } from '../clients/webhooks';

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

  beforeEach(() => {
    client = new WebhooksClient(testSecret);
  });

  it('should return true for valid signature with object payload', () => {
    // Generate a valid signature
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    const result = client.verifySignature(testPayload, validSignature);
    expect(result).toBe(true);
  });

  it('should return true for valid signature with string payload', () => {
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    const result = client.verifySignature(bodyString, validSignature);
    expect(result).toBe(true);
  });

  it('should return false for invalid signature', () => {
    const invalidSignature = 'invalid_signature_abc123';

    const result = client.verifySignature(testPayload, invalidSignature);
    expect(result).toBe(false);
  });

  it('should return false for signature with wrong secret', () => {
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const wrongSecretSignature = crypto.createHmac('sha256', 'wrong_secret').update(bodyString).digest('hex');

    const result = client.verifySignature(testPayload, wrongSecretSignature);
    expect(result).toBe(false);
  });

  it('should return false for tampered payload', () => {
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    // Tamper with the payload
    const tamperedPayload = { ...testPayload, jobId: 'tampered_job_id' };

    const result = client.verifySignature(tamperedPayload, validSignature);
    expect(result).toBe(false);
  });

  it('should return false for empty signature', () => {
    const result = client.verifySignature(testPayload, '');
    expect(result).toBe(false);
  });

  it('should return false when client has no secret', () => {
    const clientNoSecret = new WebhooksClient();
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    const result = clientNoSecret.verifySignature(testPayload, validSignature);
    expect(result).toBe(false);
  });

  it('should handle different payload structures', () => {
    const failedPayload = {
      eventId: 'evt_789',
      eventType: 'document.failed',
      jobId: 'job_999',
      status: 'failed',
      error: 'Processing error',
      timestamp: '2026-02-15T12:00:00Z',
    };

    const crypto = require('crypto');
    const bodyString = JSON.stringify(failedPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    const result = client.verifySignature(failedPayload, validSignature);
    expect(result).toBe(true);
  });

  it('should be timing-safe against length differences', () => {
    // Should return false without leaking timing information
    const shortSignature = 'abc';
    const result = client.verifySignature(testPayload, shortSignature);
    expect(result).toBe(false);
  });

  it('should handle signatures with different lengths', () => {
    const crypto = require('crypto');
    const bodyString = JSON.stringify(testPayload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

    // Add extra characters to make it longer
    const longerSignature = validSignature + 'extra';

    const result = client.verifySignature(testPayload, longerSignature);
    expect(result).toBe(false);
  });

  describe('with secret in constructor', () => {
    it('should verify signature without passing secret to method', () => {
      const clientWithSecret = new WebhooksClient(testSecret);
      const crypto = require('crypto');
      const bodyString = JSON.stringify(testPayload);
      const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

      const result = clientWithSecret.verifySignature(testPayload, validSignature);
      expect(result).toBe(true);
    });

    it('should return false when constructor secret is wrong', () => {
      const clientWithSecret = new WebhooksClient('wrong_secret');
      const crypto = require('crypto');
      const bodyString = JSON.stringify(testPayload);
      const validSignature = crypto.createHmac('sha256', testSecret).update(bodyString).digest('hex');

      // Should fail because constructor secret doesn't match
      const result = clientWithSecret.verifySignature(testPayload, validSignature);
      expect(result).toBe(false);
    });

    it('should return false when no secret is provided anywhere', () => {
      const clientNoSecret = new WebhooksClient();
      const result = clientNoSecret.verifySignature(testPayload, 'some_signature');
      expect(result).toBe(false);
    });
  });
});
