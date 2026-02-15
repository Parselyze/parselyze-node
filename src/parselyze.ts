import { DocumentsClient } from './clients/documents';
import { JobsClient } from './clients/jobs';
import { WebhooksClient } from './clients/webhooks';
import { ParselyzeError } from './errors';

export class Parselyze {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.parselyze.com';
  private readonly timeout = 30_000; // 30 seconds
  public readonly documents: DocumentsClient;
  public readonly jobs: JobsClient;
  public readonly webhooks: WebhooksClient;

  constructor(apiKey: string, webhookSecret?: string) {
    if (!apiKey) {
      throw new ParselyzeError('API key is required');
    }

    if (!apiKey.startsWith('plz_')) {
      throw new ParselyzeError('Invalid API key format. API key should start with "plz_"');
    }

    this.apiKey = apiKey;

    this.documents = new DocumentsClient(this.apiKey, this.baseUrl, this.timeout);

    this.jobs = new JobsClient(this.apiKey, this.baseUrl, this.timeout);

    this.webhooks = new WebhooksClient(webhookSecret);
  }
}
