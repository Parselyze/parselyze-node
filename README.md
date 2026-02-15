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

:::warning Async Processing Recommended
The synchronous `parse()` method is deprecated. Use `parseAsync()` with webhooks for better reliability.
:::

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

**Legacy: Synchronous Processing (Deprecated)**

```javascript
// ⚠️ DEPRECATED - Use parseAsync() instead
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

**For Legacy Sync Processing (Deprecated):**
```javascript
// Multiple files as array
files: ['./document.pdf', './receipt.jpg']

// Mixed types
files: ['./invoice.pdf', bufferData, fileObject]
```

## TypeScript

The SDK is fully typed:

```typescript
import { Parselyze, AsyncJobResponse, JobDetailResponse } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');

// Async processing (recommended)
const job: AsyncJobResponse = await parselyze.documents.parseAsync({
  file: './invoice.pdf',
  templateId: 'template-id',
  language: 'en' // optional
});

const result: JobDetailResponse = await parselyze.jobs.get(job.jobId);
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

**Verify Webhook Signatures:**
```javascript
import { verifyWebhookSignature } from 'parselyze';

// In your webhook endpoint
app.post('/webhooks/parselyze', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = process.env.PARSELYZE_WEBHOOK_SECRET;
  
  // Verify the webhook signature
  if (!verifyWebhookSignature(req.body, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { eventType, jobId, status, result, error } = req.body;
  
  if (eventType === 'document.completed') {
    // Process the result
    console.log('Job completed:', jobId, result);
  } else if (eventType === 'document.failed') {
    // Handle the error
    console.error('Job failed:', jobId, error);
  }
  
  res.status(200).send('OK');
});
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
  jobId: string;         // Job ID to check status later
  status: string;        // Initial status (usually "pending")
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
  status: string;        // 'pending', 'processing', 'completed', or 'failed'
  fileName: string;      // Original filename
  templateId: string;    // Template used
  result: any;           // Parsed data (null if not completed)
  error: string | null;  // Error message (null if no error)
  pageCount: number | null;
  attempts: number;      // Number of processing attempts
  createdAt: string;     // ISO 8601 timestamp
  startedAt: string | null;
  completedAt: string | null;
}
```

### `parselyze.documents.parse(options)` ⚠️ Deprecated

:::warning DEPRECATED
This synchronous method is deprecated and will be removed in a future major version. Use `parseAsync()` instead for better reliability and webhook support.
:::

Parse documents using a template to extract structured data.

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

### `verifyWebhookSignature(body, signature, secret)`

Verify webhook signature to ensure the request is authentic and comes from Parselyze.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body` | `string\|object` | ✅ | Webhook payload (parsed object or raw string) |
| `signature` | `string` | ✅ | Signature from `X-Webhook-Signature` header |
| `secret` | `string` | ✅ | Your webhook secret from dashboard |

**Returns:** `boolean` - `true` if signature is valid, `false` otherwise

**Example:**

```typescript
import { verifyWebhookSignature, WebhookPayload } from 'parselyze';

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const secret = process.env.PARSELYZE_WEBHOOK_SECRET!;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const payload: WebhookPayload = req.body;
  // Process webhook safely...
  res.status(200).send('OK');
});
```

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
