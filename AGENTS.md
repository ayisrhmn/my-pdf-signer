# My PDF Signer — Agent Guide

## Project Identity

- **Nama**: my-pdf-signer
- **Deskripsi**: SPA untuk image-based PDF signing. User upload PDF, nempel signature (PNG/JPEG), drag/resize, export PDF baru. Semua di browser.
- **Privacy-first**: No backend, no server, no upload. Zero external requests.
- **Tech lead**: Fariz

## Tech Stack

| Role | Library | Catatan |
|------|---------|---------|
| Framework | React 19 + TypeScript 6 | SPA, NO Next.js |
| Bundler | Vite 8 | Tailwind plugin via @tailwindcss/vite |
| Styling | Tailwind CSS v4 | Utility classes, NO custom CSS files |
| PDF Render | react-pdf 10 + pdfjs-dist 6 | worker set via Vite URL import |
| PDF Export | pdf-lib 1.17 | embed PNG/JPG, draw ke halaman |
| Drag/Resize | react-rnd 10 | bounds parent, lockAspectRatio |
| Storage | None (session-only) | Signature tidak dipersist. `idb` tidak dipakai di MVP. |
| Package Manager | Bun | bun install, bun run dev, bun run build |

## Architecture Constraints

- **No backend.** No server, no API routes, no server actions.
- **No auth.** No login, no session.
- **No cloud.** No cloud storage, no analytics that record document contents.
- **No Redux.** React hooks + lifting state up is enough for MVP.
- **Coordinate system.** Semua placement pakai ratio (0-1), jangan simpan pixel. Biar konsisten pas preview resize.

## Privacy Rules (Hard Requirements)

1. PDF tidak boleh dikirim ke server — validasi via Network tab DevTools.
2. Signature tidak boleh dikirim ke server.
3. Tidak menyimpan PDF ke IndexedDB atau localStorage.
4. Signature hanya disimpan di memory session (tidak di IndexedDB). User upload ulang setiap session.
5. Jangan letakkan signature pribadi di folder `public/`.
6. Revoke object URL (`URL.revokeObjectURL`) setiap kali file di-reset atau komponen di-unmount.
7. Privacy notice wajib: *"Your document is processed locally and never uploaded."*

## Coding Standards

### General

- **Bahasa**: English untuk code, comments, commit messages, docs.
- **File naming**: PascalCase untuk components, camelCase untuk hooks/helpers.
- **Export pattern**: `export default` untuk components, `export` named untuk utilities/types.
- **No barrel exports** (`index.ts`). Import langsung dari file.

### Component Pattern

```
src/components/ComponentName/
├── ComponentName.tsx    # component + logic
```

- Satu file per component, kecuali component terlalu besar (>300 lines) baru pecah.
- No separate CSS file — styling via Tailwind utility classes di JSX.
- Gunakan `useCallback` untuk event handlers yang dikirim ke child.
- Gunakan `useMemo` untuk derived data berat.
- Accept `className?: string` prop untuk styling dari parent.

### Hook Pattern

```
src/hooks/useDomain.ts
```

- Satu concern per hook.
- Return object, jangan array (biar konsisten).
- Jangan gabung logic PDF + signature + placement dalam satu hook.

### Lib Pattern

```
src/lib/moduleName.ts
```

- Pure functions, no React dependencies.
- Satu file per domain: `coordinate.ts`, `file.ts`, `download.ts`, `exportSignedPdf.ts`.

### State Management Pattern

```
PdfSigner (state owner) ──props──> PdfViewer
      │                              ├── PdfPage
      │                              └── SignatureOverlay
      │
      ├── Toolbar
      ├── PdfUploader
      └── SignatureManager
```

- `PdfSigner` sebagai komponen utama yang memiliki semua state.
- Custom hooks untuk logic, bukan untuk state itu sendiri.
- Kirim state + callbacks sebagai props ke child components.

### Error Handling

- Tangani error tiap boundary: upload / load PDF / render / export.
- Tampilkan pesan user-friendly (Bahasa Indonesia atau English simple).
- Log detail error ke console hanya saat development (`import.meta.env.DEV`).
- Jangan expose stack trace ke UI.

### TypeScript

- `noUnusedLocals: true`, `noUnusedParameters: true` — nggak bisa lempar unused vars.
- Define tipe di `src/types/` — satu file per domain: `pdf.ts`, `signature.ts`.
- Gunakan type (bukan interface) untuk data shapes.

## Phase Execution Flow

1. Baca task phase dari IMPLEMENTATION_PLAN.md.
2. Analisis requirement & buat plan singkat kalau perlu.
3. Implementasi sesuai scope phase.
4. Jalanin `bun run build` (tsc + vite build).
5. Verifikasi acceptance criteria phase.
6. Lapor hasil — jangan lanjut ke phase berikutnya tanpa konfirmasi Fariz.

## Git Workflow

- Jangan commit tanpa perintah eksplisit dari Fariz.
- Jangan push tanpa konfirmasi.
- Commit message format: `type(scope): description` — e.g. `feat(pdf): add drag-and-drop upload`.
- Jangan staging file dengan `git add -A` — staging spesifik file yang relevan.

## Known Limitations (jangan implementasi tanpa diminta)

- Cryptographic / certificate-based PDF signature
- Password-protected PDF
- PDF form filling
- Text annotation
- Handwritten drawing
- Undo/redo history
- Cloud sync / user account
- Signature rotation
- Multiple signature profiles
- PDF merge / compression
