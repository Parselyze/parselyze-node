import { DocumentsClient } from './clients/documents';
import { ParselyzeError } from './errors';

export class Parselyze {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.parselyze.com';
  private readonly timeout = 30_000; // 30 seconds
  public readonly documents: DocumentsClient;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new ParselyzeError('API key is required');
    }

    if (!apiKey.startsWith('plz_')) {
      throw new ParselyzeError('Invalid API key format. API key should start with "plz_"');
    }

    this.apiKey = apiKey;

    this.documents = new DocumentsClient(
      this.apiKey,
      this.baseUrl,
      this.timeout
    );
  }
}
