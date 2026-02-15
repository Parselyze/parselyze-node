import { createHmac } from 'crypto';

export class WebhooksClient {
  private readonly secret?: string;

  constructor(secret?: string) {
    this.secret = secret;
  }

  /**
   * Verify webhook signature to ensure authenticity
   *
   * @param body - Webhook payload (parsed object or raw string)
   * @param signature - Signature from X-Webhook-Signature header
   * @returns True if signature is valid, false otherwise
   *
   * @example
   * ```typescript
   * const parselyze = new Parselyze('plz_key', 'webhook_secret');
   * app.post('/webhook', (req, res) => {
   *   const signature = req.headers['x-webhook-signature'];
   *   if (!parselyze.webhooks.verifySignature(req.body, signature)) {
   *     return res.status(401).send('Invalid signature');
   *   }
   *   // Process webhook...
   * });
   * ```
   */
  verifySignature(body: string | object, signature: string): boolean {
    if (!signature || !this.secret) {
      return false;
    }

    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);

    const hmac = createHmac('sha256', this.secret);
    hmac.update(bodyString);
    const expectedSignature = hmac.digest('hex');

    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
