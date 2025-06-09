import { ParselyzeError } from '../errors';
import { Parselyze } from '../parselyze';

describe('Parselyze SDK', () => {
  describe('Constructor', () => {
    it('should create instance with API key string', () => {
      const parselyze = new Parselyze('plz_test_key');
      expect(parselyze).toBeInstanceOf(Parselyze);
      expect(parselyze.documents).toBeDefined();
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
});
