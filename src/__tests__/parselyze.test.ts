import { ParselyzeError } from '../errors';
import { Parselyze } from '../parselyze';

describe('Parselyze SDK', () => {
  describe('Constructor', () => {
    it('should create instance with API key string', () => {
      const parselyze = new Parselyze('plz_test_key');
      expect(parselyze).toBeInstanceOf(Parselyze);
      expect(parselyze.documents).toBeDefined();
      expect(parselyze.jobs).toBeDefined();
      expect(parselyze.webhooks).toBeDefined();
    });

    it('should throw error for missing API key', () => {
      expect(() => new Parselyze('')).toThrow(ParselyzeError);
      expect(() => new Parselyze('')).toThrow('API key is required');
    });

    it('should throw error for invalid API key format', () => {
      expect(() => new Parselyze('invalid_key')).toThrow(ParselyzeError);
      expect(() => new Parselyze('invalid_key')).toThrow('Invalid API key format');
    });

    it('should accept valid API key format', () => {
      expect(() => new Parselyze('plz_valid_key')).not.toThrow();
    });
  });

  describe('Documents client', () => {
    it('should have documents client', () => {
      const parselyze = new Parselyze('plz_test_key');
      expect(parselyze.documents).toBeDefined();
    });
  });

  describe('Jobs client', () => {
    it('should have jobs client', () => {
      const parselyze = new Parselyze('plz_test_key');
      expect(parselyze.jobs).toBeDefined();
    });
  });

  describe('Webhooks client', () => {
    it('should have webhooks client', () => {
      const parselyze = new Parselyze('plz_test_key');
      expect(parselyze.webhooks).toBeDefined();
    });

    it('should verify webhook signature via client with secret in constructor', () => {
      const secret = 'test_secret';
      const parselyze = new Parselyze('plz_test_key', secret);
      const payload = { test: 'data' };
      const crypto = require('crypto');
      const validSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

      expect(parselyze.webhooks.verifySignature(payload, validSignature)).toBe(true);
      expect(parselyze.webhooks.verifySignature(payload, 'invalid')).toBe(false);
    });

    it('should verify webhook signature with secret in constructor', () => {
      const secret = 'test_secret';
      const parselyze = new Parselyze('plz_test_key', secret);
      const payload = { test: 'data' };
      const crypto = require('crypto');
      const validSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

      expect(parselyze.webhooks.verifySignature(payload, validSignature)).toBe(true);
      expect(parselyze.webhooks.verifySignature(payload, 'invalid')).toBe(false);
    });
  });
});
