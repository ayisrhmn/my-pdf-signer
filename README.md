# My PDF Signer

A privacy-first, client-side PDF signing tool with a pixel-art aesthetic. Upload a PDF, drag your signature onto pages, and download the signed document — all in the browser. Nothing leaves your machine.

## Features

- **PDF upload** — drag-and-drop or file picker
- **Signature upload** — PNG or JPEG, with preview and validation
- **Drag & resize** — place signatures anywhere on any page, with pixel-art resize handles
- **Multi-page support** — add signatures to different pages independently
- **Signed PDF export** — downloads a flattened PDF with embedded signature images
- **Privacy-first** — zero server requests, zero uploads, zero persistence
- **Pixel-art UI** — colorful pixel-art visual language with 2px borders, hard shadows, and Pixelify Sans display font
- **Responsive** — desktop sidebar layout with a mobile-friendly bottom sheet dialog
- **Keyboard accessible** — full keyboard navigation with focus management and arrow-key nudge

## Tech Stack

| Role | Library |
|------|---------|
| Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 |
| PDF Render | react-pdf 10 + pdfjs-dist |
| PDF Export | pdf-lib 1.17 |
| Package Manager | Bun |

## Privacy

My PDF Signer processes everything locally in your browser:

- No PDF or signature data is sent to any server
- No files are stored in IndexedDB, localStorage, or cookies
- No analytics, tracking, or remote font requests
- Signature images only exist in session memory and are revoked on reset

Verify this yourself — open the Network tab in DevTools. There should be no external requests after the initial page load.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.x or later

### Installation

```bash
git clone https://github.com/ayisrhmn/my-pdf-signer.git
cd my-pdf-signer
bun install
```

### Development

```bash
bun run dev
```

Opens at `http://localhost:5173`.

### Production Build

```bash
bun run build
```

Outputs to `dist/`. Serve with any static file server:

```bash
bun run preview
```

## Usage

1. **Upload a PDF** — drag a PDF onto the upload card or click to select
2. **Upload a signature** — drag a PNG/JPEG onto the signature manager or click to select
3. **Place signatures** — set the target page number and click "Add to page"
4. **Adjust signatures** — drag to reposition, use the corner handles to resize, press Delete to remove
5. **Export** — click "Download PDF" to get your signed document

## Project Structure

```
src/
├── App.tsx                          # Application shell and state owner
├── index.css                        # Tailwind theme + @font-face
├── assets/fonts/                    # Pixelify Sans (OFL licensed)
├── components/
│   ├── PdfUploader/                 # PDF upload drop zone
│   ├── PdfViewer/                   # PDF page renderer
│   ├── SignatureManager/            # Signature upload and controls
│   └── SignatureOverlay/            # Drag, resize, remove on page
├── hooks/                           # Custom React hooks
├── lib/                             # Pure functions (validation, export, download)
└── types/                           # TypeScript type definitions
```

## Design

The interface uses a colorful pixel-art visual language based on these principles:

- **Playful chrome, neutral document** — pixel-art treatment applies to the shell, controls, and panels, not the PDF itself
- **Soft pixel palette** — lavender background, paper surfaces, cyan/yellow/coral accents, hard 2px borders and offset shadows
- **Pixelify Sans** — locally bundled display font for headings and buttons; system sans for body text and controls

See [docs/PIXEL_ART_REDESIGN.md](./docs/PIXEL_ART_REDESIGN.md) for the full design rationale.

## License

MIT
