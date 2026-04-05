# Parselyze Node.js SDK

![npm version](https://img.shields.io/npm/v/parselyze)
![npm downloads](https://img.shields.io/npm/dm/parselyze)
![GitHub license](https://img.shields.io/github/license/parselyze/parselyze-node)

The official Node.js SDK for the Parselyze document parsing API.

## Installation

```bash
npm install parselyze
```

## Setup

First, get your API key from your [Parselyze dashboard](https://parselyze.com/account/api-keys).

```javascript
import { Parselyze } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');
```

## Usage

**Recommended: Async Processing**

```javascript
import { Parselyze } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');

// Submit document for async processing
const job = await parselyze.documents.parseAsync({
  file: './invoice.pdf',
  templateId: 'your-template-id'
});

console.log(job.jobId); // Save this for later

// Get result when ready (or use webhooks)
const result = await parselyze.jobs.get(job.jobId);
if (result.status === 'completed') {
  console.log(result.result);
}
```

**Synchronous Processing**

```javascript
const result = await parselyze.documents.parse({
  files: ['./invoice.pdf'],
  templateId: 'your-template-id'
});

console.log(result);
```

## File Types

The SDK accepts multiple input types:

**For Async Processing (Recommended):**
```javascript
// Single file - File path (recommended for Node.js)
file: './document.pdf'

// Buffer object
file: bufferData  // e.g., fs.readFileSync('./document.pdf')

// File object (browser)
file: fileInput.files[0]

// Blob object
file: new Blob([data], { type: 'application/pdf' })
```

**For Sync Processing:**
```javascript
// Multiple files as array
files: ['./document.pdf', './receipt.jpg']

// Mixed types
files: ['./invoice.pdf', bufferData, fileObject]
```

## TypeScript

The SDK is fully typed:

```typescript
import { Parselyze, AsyncJobResponse, JobDetailResponse, JobStatus, WebhookPayload } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');

// Async processing
const job: AsyncJobResponse = await parselyze.documents.parseAsync({
  file: './invoice.pdf',
  templateId: 'template-id',
  language: 'en' // optional
});

const result: JobDetailResponse = await parselyze.jobs.get(job.jobId);
// result.status is typed as JobStatus: 'pending' | 'processing' | 'completed' | 'failed'

// Webhook payload with typed result
interface InvoiceData { number: string; total: number; }
const event: WebhookPayload<InvoiceData> = parselyze.webhooks.constructEvent<InvoiceData>(body, signature);
// event.result is InvoiceData | undefined
```

## Error Handling

```javascript
import { ParselyzeError } from 'parselyze';

try {
  const job = await parselyze.documents.parseAsync({
    file: './document.pdf',
    templateId: 'template-id'
  });
  
  const result = await parselyze.jobs.get(job.jobId);
  
  if (result.status === 'failed') {
    console.error('Processing failed:', result.error);
  }
} catch (error) {
  if (error instanceof ParselyzeError) {
    console.error('Parselyze Error:', error.message);
  }
}
```

## Async Document Processing

For large documents or when you don't need immediate results, use asynchronous processing. Results will be delivered via webhooks or can be retrieved later.

### Submit a Document for Async Processing

```javascript
const job = await parselyze.documents.parseAsync({
  file: './large-invoice.pdf',  // Single file only
  templateId: 'your-template-id',
  language: 'en' // optional
});

console.log(job.jobId);         // Save this for later: "job_abc123"
console.log(job.status);        // "pending"
```

### Check Job Status

```javascript
const jobDetails = await parselyze.jobs.get('job_abc123');

console.log(jobDetails.status); // 'pending', 'processing', 'completed', or 'failed'

if (jobDetails.status === 'completed') {
  console.log(jobDetails.result);    // Parsed data
  console.log(jobDetails.pageCount); // Number of pages processed
} else if (jobDetails.status === 'failed') {
  console.error(jobDetails.error);   // Error message
}
```

### Using Webhooks (Recommended)

Instead of polling for job status, configure webhooks in your [Parselyze dashboard](https://parselyze.com/account/webhook-settings) to receive real-time notifications when jobs complete.

**Webhook Payload:**
```json
{
  "eventId": "evt_123",
  "eventType": "document.completed",
  "jobId": "job_abc123",
  "status": "completed",
  "result": { ... },
  "pageCount": 3,
  "timestamp": "2026-02-15T12:00:00Z"
}
```

**Handle Webhooks with `constructEvent` (Recommended):**

`constructEvent` verifies the signature and returns a typed payload in one step. It throws a `ParselyzeError` if the signature is invalid, making error handling explicit.

```typescript
import { Parselyze, ParselyzeError, WebhookPayload } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key', process.env.PARSELYZE_WEBHOOK_SECRET);

// Express — use express.raw() to preserve the raw body for signature verification
app.post('/webhooks/parselyze', express.raw({ type: 'application/json' }), (req, res) => {
  let event: WebhookPayload;

  try {
    event = parselyze.webhooks.constructEvent(
      req.body.toString(),
      req.headers['x-webhook-signature'] as string
    );
  } catch (err) {
    if (err instanceof ParselyzeError) {
      return res.status(err.status ?? 400).send(err.message);
    }
    return res.status(400).send('Webhook error');
  }

  if (event.eventType === 'document.completed') {
    console.log('Job completed:', event.jobId, event.result);
  } else if (event.eventType === 'document.failed') {
    console.error('Job failed:', event.jobId, event.error);
  }

  res.json({ received: true });
});
```

**Type the result with a generic:**

```typescript
interface InvoiceData { number: string; total: number; }

const event = parselyze.webhooks.constructEvent<InvoiceData>(body, signature);
// event.result is InvoiceData | undefined
if (event.eventType === 'document.completed') {
  console.log(event.result?.number); // fully typed
}
```

**Verify signature only (low-level):**

```typescript
// Returns true/false without throwing
const isValid = parselyze.webhooks.verifySignature(req.body, signature);
```

## API Reference

### `parselyze.documents.parseAsync(options)` ⭐ Recommended

Submit a document for asynchronous processing. Use this for large documents or when you don't need immediate results.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `File\|Blob\|Buffer\|string` | ✅ | Single file to parse (path, File, Buffer, or Blob) |
| `templateId` | `string` | ✅ | Template ID for data extraction |
| `language` | `string` | ❌ | OCR language code (e.g., 'en', 'fr', 'de') |

**Returns:**

```typescript
{
  jobId: string;
  status: JobStatus;     // 'pending' | 'processing' | 'completed' | 'failed'
  message: string;       // Status message
  createdAt: string;     // ISO 8601 timestamp
}
```

### `parselyze.jobs.get(jobId)`

Get the status and result of an asynchronous job.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | `string` | ✅ | Job ID from `parseAsync()` |

**Returns:**

```typescript
{
  jobId: string;
  status: JobStatus;     // 'pending' | 'processing' | 'completed' | 'failed'
  fileName: string;      // Original filename
  templateId: string;    // Template used
  result: T;             // Parsed data (null if not completed)
  error: string | null;  // Error message (null if no error)
  pageCount: number | null;
  attempts: number;      // Number of processing attempts
  createdAt: string;     // ISO 8601 timestamp
  startedAt: string | null;
  completedAt: string | null;
}
```

### `parselyze.documents.parse(options)`

Parse documents synchronously using a template to extract structured data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `Array` | ✅ | Files to parse (paths, File, Buffer, or Blob) |
| `templateId` | `string` | ✅ | Template ID for data extraction |
| `language` | `string` | ❌ | OCR language code (e.g., 'en', 'fr', 'de') |

**Returns:**

Single document:
```typescript
{
  result: any;           // Extracted data
  pageCount: number;     // Pages processed
  pageUsed: number;      // Pages consumed
  pageRemaining: number; // Pages remaining
}
```

Multiple documents:
```typescript
{
  results: Array<{       // Array of results
    filename: string;
    result: any;
  }>;
  pageCount: number;     // Total pages processed
  pageUsed: number;      // Pages consumed
  pageRemaining: number; // Pages remaining
  source?: 'zip';        // Present if from ZIP
}
```

### `parselyze.webhooks.constructEvent<T>(body, signature)` ⭐ Recommended

Verify the webhook signature and parse the payload into a typed event. Throws a `ParselyzeError` if the signature is invalid.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body` | `string\|object` | ✅ | Raw webhook payload string or parsed object |
| `signature` | `string` | ✅ | Signature from `X-Webhook-Signature` header |

**Returns:** `WebhookPayload<T>` — typed event payload

**Throws:** `ParselyzeError` with code `INVALID_SIGNATURE` (401) or `INVALID_PAYLOAD` (400)

### `parselyze.webhooks.verifySignature(body, signature)`

Low-level signature verification. Returns `true`/`false` without throwing.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body` | `string\|object` | ✅ | Webhook payload (parsed object or raw string) |
| `signature` | `string` | ✅ | Signature from `X-Webhook-Signature` header |

**Returns:** `boolean`

## Supported Formats

- **Documents**: PDF
- **Images**: JPG, PNG
- **Archives**: ZIP

## Requirements

- Node.js 18.0.0 or higher

## Links

- [Documentation](https://docs.parselyze.com)
- [Create Templates](https://parselyze.com/templates)
- [Support](https://parselyze.com/contact)

## License

MIT License. See the [LICENSE](LICENSE) file for details.
