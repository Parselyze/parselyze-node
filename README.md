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

```javascript
import { Parselyze } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');

const result = await parselyze.documents.parse({
  files: ['./invoice.pdf'],
  templateId: 'your-template-id'
});

console.log(result);
```

## File Types

The SDK accepts multiple input types:

```javascript
// File paths (recommended for Node.js)
files: ['./document.pdf', './receipt.jpg']

// Buffer objects
files: [bufferData] // e.g., fs.readFileSync('./document.pdf')

// File objects (browser)
files: [fileInput.files[0]]

// Mixed types
files: ['./invoice.pdf', bufferData, fileObject]
```

## TypeScript

The SDK is fully typed:

```typescript
import { Parselyze, ParseDocumentResponse, ParseDocumentOptions } from 'parselyze';

const parselyze = new Parselyze('plz_your_api_key_here');

const options: ParseDocumentOptions = {
  files: ['./invoice.pdf'],
  templateId: 'template-id',
  language: 'en' // optional
};

const result: ParseDocumentResponse = await parselyze.documents.parse(options);
```

## Error Handling

```javascript
import { ParselyzeError } from 'parselyze';

try {
  const result = await parselyze.documents.parse({
    files: ['./document.pdf'],
    templateId: 'template-id'
  });
} catch (error) {
  if (error instanceof ParselyzeError) {
    console.error('Parselyze Error:', error.message);
  }
}
```

## API Reference

### `parselyze.documents.parse(options)`

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
