import { createHmac, timingSafeEqual } from 'crypto';
import { ParselyzeError } from '../errors';
import { WebhookPayload } from '../types';

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

    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Verify a webhook signature and parse the payload into a typed event.
   * Prefer this method over `verifySignature` for a complete integration.
   *
   * @param body - Raw webhook payload string or parsed object
   * @param signature - Signature from X-Webhook-Signature header
   * @returns Typed WebhookPayload
   *
   * @throws {ParselyzeError} When the signature is invalid or the payload cannot be parsed
   *
   * @example
   * ```typescript
   * // Express (use express.raw to get the raw body for signature verification)
   * app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
   *   let event: WebhookPayload;
   *   try {
   *     event = parselyze.webhooks.constructEvent(
   *       req.body.toString(),
   *       req.headers['x-webhook-signature'] as string
   *     );
   *   } catch (err) {
   *     return res.status(400).send('Webhook error');
   *   }
   *
   *   if (event.eventType === 'document.completed') {
   *     console.log('Parsed result:', event.result);
   *   } else if (event.eventType === 'document.failed') {
   *     console.error('Processing failed:', event.error);
   *   }
   *
   *   res.json({ received: true });
   * });
   * ```
   */
  constructEvent<T = unknown>(body: string | object, signature: string): WebhookPayload<T> {
    if (!this.verifySignature(body, signature)) {
      throw new ParselyzeError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
    }

    try {
      const payload = typeof body === 'string' ? JSON.parse(body) : body;
      return payload as WebhookPayload<T>;
    } catch {
      throw new ParselyzeError('Failed to parse webhook payload', 400, 'INVALID_PAYLOAD');
    }
  }
}
