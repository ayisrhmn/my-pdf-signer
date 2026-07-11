# Implementation Plan — `my-pdf-signer`

## 1. Project Overview

`my-pdf-signer` adalah aplikasi web single-page untuk menempelkan tanda tangan berbentuk gambar ke dokumen PDF secara lokal di browser.

Aplikasi tidak menggunakan backend, database, cloud storage, maupun API upload. Seluruh dokumen PDF dan asset tanda tangan hanya diproses di browser pengguna.

### Main Goal

Membuat aplikasi privacy-first yang memungkinkan pengguna untuk:

1. Upload dokumen PDF.
2. Preview seluruh halaman PDF.
3. Upload dan menyimpan asset tanda tangan secara lokal.
4. Menambahkan tanda tangan ke satu atau beberapa halaman.
5. Drag dan resize tanda tangan.
6. Menghapus tanda tangan yang tidak diperlukan.
7. Export hasil akhir sebagai file PDF baru.
8. Reset aplikasi untuk memproses dokumen lain.

---

## 2. Technical Decisions

### Application Type

Gunakan React Single Page Application.

Tidak menggunakan Next.js karena aplikasi tidak membutuhkan:

* Server-side rendering
* API routes
* Authentication
* Database
* Server actions
* Dynamic routing

### Recommended Stack

```txt
React
Vite
TypeScript
react-pdf
pdfjs-dist
pdf-lib
react-rnd
IndexedDB
CSS Modules atau plain CSS
```

### Library Responsibilities

#### `react-pdf`

Digunakan untuk:

* Membaca dokumen PDF
* Menampilkan halaman PDF
* Mengambil jumlah halaman

#### `pdfjs-dist`

Digunakan sebagai PDF engine oleh `react-pdf`.

#### `pdf-lib`

Digunakan untuk:

* Membaca file PDF asli
* Embed gambar tanda tangan
* Menggambar tanda tangan ke halaman PDF
* Membuat file PDF hasil export

#### `react-rnd`

Digunakan untuk:

* Drag signature overlay
* Resize signature overlay
* Mengatur batas pergerakan signature di dalam halaman PDF

#### IndexedDB

Digunakan untuk menyimpan asset tanda tangan secara lokal di browser agar pengguna tidak perlu meng-upload ulang signature setiap kali membuka aplikasi.

PDF tidak perlu disimpan ke IndexedDB.

---

## 3. Privacy Requirements

Aplikasi harus memenuhi aturan berikut:

* PDF tidak boleh dikirim ke server.
* Signature tidak boleh dikirim ke server.
* Tidak menggunakan backend.
* Tidak menggunakan database eksternal.
* Tidak menggunakan cloud storage.
* Tidak menyimpan PDF ke localStorage atau IndexedDB.
* Signature boleh disimpan ke IndexedDB lokal.
* Seluruh proses export dilakukan di browser.
* Jangan menggunakan analytics yang merekam filename atau isi dokumen.
* Jangan meletakkan signature pribadi di folder `public`.
* Hapus object URL ketika file di-reset atau komponen di-unmount.

Tampilkan privacy notice di UI:

```txt
Your document is processed locally and never uploaded.
```

---

## 4. Project Initialization

Buat project baru:

```bash
npm create vite@latest my-pdf-signer -- --template react-ts

cd my-pdf-signer

npm install
```

Install dependencies:

```bash
npm install react-pdf pdfjs-dist pdf-lib react-rnd
```

Optional utility:

```bash
npm install idb
```

Library `idb` direkomendasikan agar integrasi IndexedDB lebih sederhana dan type-safe.

Jalankan project:

```bash
npm run dev
```

Build project:

```bash
npm run build
```

---

## 5. Suggested Project Structure

```txt
my-pdf-signer/
├── public/
│   └── icons/
│
├── src/
│   ├── components/
│   │   ├── PdfSigner/
│   │   │   ├── PdfSigner.tsx
│   │   │   └── PdfSigner.css
│   │   │
│   │   ├── PdfUploader/
│   │   │   ├── PdfUploader.tsx
│   │   │   └── PdfUploader.css
│   │   │
│   │   ├── SignatureManager/
│   │   │   ├── SignatureManager.tsx
│   │   │   └── SignatureManager.css
│   │   │
│   │   ├── PdfViewer/
│   │   │   ├── PdfViewer.tsx
│   │   │   └── PdfViewer.css
│   │   │
│   │   ├── PdfPage/
│   │   │   ├── PdfPage.tsx
│   │   │   └── PdfPage.css
│   │   │
│   │   ├── SignatureOverlay/
│   │   │   ├── SignatureOverlay.tsx
│   │   │   └── SignatureOverlay.css
│   │   │
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   └── Toolbar.css
│   │   │
│   │   └── EmptyState/
│   │       ├── EmptyState.tsx
│   │       └── EmptyState.css
│   │
│   ├── hooks/
│   │   ├── usePdfFile.ts
│   │   ├── useSignatureAsset.ts
│   │   └── useSignaturePlacements.ts
│   │
│   ├── lib/
│   │   ├── exportSignedPdf.ts
│   │   ├── coordinate.ts
│   │   ├── indexedDb.ts
│   │   ├── file.ts
│   │   └── download.ts
│   │
│   ├── types/
│   │   ├── pdf.ts
│   │   └── signature.ts
│   │
│   ├── constants/
│   │   └── signer.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 6. Core Data Types

Buat type untuk dokumen PDF:

```ts
export type PdfDocumentState = {
  file: File;
  objectUrl: string;
  name: string;
  pageCount: number;
};
```

Buat type untuk signature asset:

```ts
export type SignatureAsset = {
  id: string;
  blob: Blob;
  objectUrl: string;
  fileName: string;
  mimeType: string;
};
```

Buat type untuk placement signature:

```ts
export type SignaturePlacement = {
  id: string;
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
};
```

Gunakan `pageIndex` berbasis nol.

Contoh:

```txt
Page 1 = pageIndex 0
Page 2 = pageIndex 1
```

Gunakan ratio agar posisi tetap konsisten walaupun ukuran preview berubah.

```ts
xRatio = x / previewWidth;
yRatio = y / previewHeight;
widthRatio = signatureWidth / previewWidth;
heightRatio = signatureHeight / previewHeight;
```

---

## 7. Application State

State utama aplikasi:

```ts
type PdfSignerState = {
  pdfDocument: PdfDocumentState | null;
  signatureAsset: SignatureAsset | null;
  placements: SignaturePlacement[];
  selectedPlacementId: string | null;
  activePageIndex: number;
  isLoadingPdf: boolean;
  isExporting: boolean;
  error: string | null;
};
```

State boleh dikelola menggunakan React hooks biasa.

Tidak perlu menggunakan Redux atau state management eksternal untuk MVP.

---

## 8. Main Application Flow

### Initial State

Ketika aplikasi pertama dibuka:

1. Load signature dari IndexedDB.
2. Jika signature ditemukan, buat object URL.
3. Tampilkan upload area untuk PDF.
4. Tampilkan signature manager.
5. Tampilkan privacy notice.

### PDF Upload Flow

1. User memilih atau drag-and-drop file PDF.
2. Validasi file.
3. Buat object URL dengan `URL.createObjectURL`.
4. Simpan file ke state.
5. Render PDF menggunakan `react-pdf`.
6. Ambil jumlah halaman dari callback `onLoadSuccess`.
7. Tampilkan toolbar dan PDF viewer.

### Add Signature Flow

1. User menekan tombol `Add Signature`.
2. Pastikan signature asset tersedia.
3. Tambahkan placement baru ke halaman aktif.
4. Gunakan posisi default di tengah halaman.
5. Gunakan ukuran default berdasarkan ratio.
6. Set placement sebagai selected.

### Drag and Resize Flow

1. User drag atau resize overlay.
2. Ambil ukuran aktual container halaman.
3. Ubah pixel position menjadi ratio.
4. Update placement terkait.
5. Batasi posisi agar tetap berada dalam halaman.

### Export Flow

1. Load file PDF sebagai `ArrayBuffer`.
2. Load PDF menggunakan `PDFDocument.load`.
3. Load signature blob.
4. Embed image PNG atau JPEG.
5. Loop seluruh placement.
6. Ambil halaman berdasarkan `pageIndex`.
7. Konversi ratio menjadi koordinat PDF.
8. Gambar signature ke halaman.
9. Save PDF baru.
10. Download sebagai file baru.

### Reset Flow

1. Tampilkan konfirmasi jika sudah ada placement.
2. Revoke PDF object URL.
3. Hapus PDF dari state.
4. Hapus seluruh placement.
5. Hapus selected placement.
6. Pertahankan signature asset.
7. Kembali ke upload state.

---

## 9. PDF.js Worker Setup

Konfigurasikan PDF.js worker di satu file saja, misalnya pada `main.tsx` atau module konfigurasi PDF.

```ts
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
```

Pastikan konfigurasi worker tidak diulang di banyak komponen.

---

## 10. PDF Upload Implementation

### Requirements

Komponen `PdfUploader` harus mendukung:

* File input
* Drag and drop
* MIME validation
* Extension validation
* Loading state
* Error state

### Accepted File

```txt
application/pdf
```

Tetap validasi extension `.pdf` karena MIME type kadang kosong atau tidak konsisten.

### Suggested Validation

* Hanya satu file
* File harus PDF
* File tidak boleh kosong
* Tentukan batas ukuran yang masuk akal

Contoh batas awal:

```txt
Maximum file size: 30 MB
```

Batas ini boleh dijadikan constant.

### Error Messages

```txt
Please select a PDF file.
The selected file is empty.
The PDF file is too large.
Unable to read this PDF.
Password-protected PDFs are not supported.
```

---

## 11. Signature Asset Management

Jangan menyimpan signature pribadi di folder `public`.

Buat komponen `SignatureManager`.

### Features

* Upload PNG atau JPEG
* Preview signature
* Replace signature
* Remove signature
* Save signature ke IndexedDB
* Load signature dari IndexedDB saat startup

### Accepted Formats

```txt
image/png
image/jpeg
```

PNG transparan lebih direkomendasikan.

### Validation

* Pastikan file merupakan image
* Pastikan file tidak kosong
* Tentukan batas ukuran

Contoh:

```txt
Maximum signature file size: 5 MB
```

### IndexedDB Storage

Gunakan satu database:

```txt
Database name: my-pdf-signer
Store name: signature-assets
```

Karena hanya satu signature untuk MVP, gunakan key tetap:

```txt
primary-signature
```

Contoh record:

```ts
type StoredSignatureAsset = {
  id: "primary-signature";
  blob: Blob;
  fileName: string;
  mimeType: string;
  updatedAt: string;
};
```

Ketika signature dihapus:

1. Hapus dari IndexedDB.
2. Revoke object URL.
3. Hapus dari state.
4. Hapus semua placement yang bergantung pada signature.

---

## 12. PDF Viewer Implementation

Komponen `PdfViewer` bertugas merender seluruh halaman secara vertikal.

Contoh struktur:

```tsx
<Document>
  {pages.map((pageIndex) => (
    <PdfPage key={pageIndex} pageIndex={pageIndex} />
  ))}
</Document>
```

### Viewer Requirements

* Tampilkan seluruh halaman vertikal
* Beri jarak antarhalaman
* Beri nomor halaman
* Responsive
* Desktop-first
* Batasi lebar maksimum preview
* Scroll menggunakan halaman browser atau container khusus

Contoh ukuran:

```txt
Maximum page preview width: 850px
```

Jangan mengandalkan ukuran PDF tetap karena setiap PDF bisa memiliki dimensi berbeda.

---

## 13. PDF Page Implementation

Setiap `PdfPage` harus memiliki container dengan:

```css
position: relative;
```

Canvas PDF dan signature overlay berada dalam container yang sama.

Struktur dasar:

```tsx
<div className="pdf-page-container">
  <Page />
  <div className="signature-layer">
    {pagePlacements.map(...)}
  </div>
</div>
```

Signature layer:

```css
position: absolute;
inset: 0;
pointer-events: none;
```

Setiap signature overlay mengaktifkan pointer event sendiri:

```css
pointer-events: auto;
```

### Page Dimension Tracking

Gunakan `ResizeObserver` untuk mendapatkan ukuran aktual setiap page container.

Simpan dimension per halaman:

```ts
type PagePreviewDimension = {
  width: number;
  height: number;
};
```

Dimension ini digunakan untuk:

* Render placement dari ratio ke pixel
* Mengubah hasil drag dari pixel ke ratio
* Mengubah hasil resize dari pixel ke ratio

---

## 14. Signature Overlay Implementation

Gunakan `react-rnd`.

### Overlay Features

* Draggable
* Resizable
* Selected state
* Delete button atau keyboard delete
* Bounded dalam parent
* Menjaga aspect ratio
* Mendukung multiple placement

### Suggested RND Configuration

```tsx
<Rnd
  bounds="parent"
  lockAspectRatio
  position={{ x, y }}
  size={{ width, height }}
  onDragStop={handleDragStop}
  onResizeStop={handleResizeStop}
/>
```

### Selection

Ketika signature diklik:

```ts
setSelectedPlacementId(placement.id);
```

Tampilkan border untuk selected placement.

Contoh:

```css
outline: 2px solid;
```

Jangan sertakan border saat export karena overlay HTML hanya digunakan untuk preview.

### Default Placement

Ketika user menambahkan signature:

```ts
const defaultWidthRatio = 0.25;
const defaultHeightRatio = defaultWidthRatio / signatureAspectRatio;
```

Posisi default:

```ts
xRatio = 0.5 - defaultWidthRatio / 2;
yRatio = 0.5 - defaultHeightRatio / 2;
```

Pastikan placement tetap berada di dalam range `0` sampai `1`.

---

## 15. Active Page Detection

Untuk menentukan halaman aktif, gunakan salah satu pendekatan berikut:

### Recommended

Gunakan `IntersectionObserver`.

Halaman dengan visibility terbesar dianggap aktif.

Simpan:

```ts
activePageIndex
```

Ketika user menekan `Add Signature`, signature ditambahkan ke halaman aktif.

Fallback:

```txt
Jika active page tidak ditemukan, tambahkan ke page pertama.
```

---

## 16. Placement Coordinate Conversion

### Preview to Ratio

```ts
const xRatio = x / previewWidth;
const yRatio = y / previewHeight;
const widthRatio = width / previewWidth;
const heightRatio = height / previewHeight;
```

### Ratio to Preview

```ts
const x = xRatio * previewWidth;
const y = yRatio * previewHeight;
const width = widthRatio * previewWidth;
const height = heightRatio * previewHeight;
```

### Ratio to PDF

PDF menggunakan koordinat kiri bawah, sedangkan browser menggunakan kiri atas.

```ts
const pdfX = xRatio * pdfPageWidth;
const pdfWidth = widthRatio * pdfPageWidth;
const pdfHeight = heightRatio * pdfPageHeight;

const pdfY =
  pdfPageHeight -
  yRatio * pdfPageHeight -
  pdfHeight;
```

Kemudian:

```ts
page.drawImage(signatureImage, {
  x: pdfX,
  y: pdfY,
  width: pdfWidth,
  height: pdfHeight,
});
```

Buat semua fungsi konversi di:

```txt
src/lib/coordinate.ts
```

Jangan menaruh logic koordinat langsung di komponen UI.

---

## 17. PDF Export Implementation

Buat function:

```ts
export async function exportSignedPdf(
  pdfFile: File,
  signatureBlob: Blob,
  placements: SignaturePlacement[],
): Promise<Blob>
```

### Export Steps

```ts
const pdfBytes = await pdfFile.arrayBuffer();
const pdfDocument = await PDFDocument.load(pdfBytes);
```

Read signature:

```ts
const signatureBytes = await signatureBlob.arrayBuffer();
```

Embed berdasarkan MIME type:

```ts
const embeddedSignature =
  mimeType === "image/png"
    ? await pdfDocument.embedPng(signatureBytes)
    : await pdfDocument.embedJpg(signatureBytes);
```

Loop placement:

```ts
for (const placement of placements) {
  const page = pdfDocument.getPage(placement.pageIndex);
  const { width, height } = page.getSize();

  // Convert ratios to PDF coordinates.
  // Draw embedded signature.
}
```

Save:

```ts
const signedPdfBytes = await pdfDocument.save();
```

Create Blob:

```ts
return new Blob([signedPdfBytes], {
  type: "application/pdf",
});
```

---

## 18. Download Implementation

Buat helper:

```ts
export function downloadBlob(blob: Blob, fileName: string): void
```

Gunakan object URL sementara:

```ts
const url = URL.createObjectURL(blob);

const anchor = document.createElement("a");
anchor.href = url;
anchor.download = fileName;
anchor.click();

URL.revokeObjectURL(url);
```

Output filename:

```txt
original-file-signed.pdf
```

Contoh:

```txt
contract.pdf
```

Menjadi:

```txt
contract-signed.pdf
```

Handle nama file tanpa extension dengan aman.

---

## 19. Toolbar Implementation

Toolbar tampil setelah PDF berhasil dibuka.

### Toolbar Actions

* Add Signature
* Delete Selected
* Download PDF
* Reset Document

### Button Conditions

#### Add Signature

Disabled jika:

* Tidak ada PDF
* Tidak ada signature asset

#### Delete Selected

Disabled jika:

* Tidak ada selected placement

#### Download PDF

Disabled jika:

* Tidak ada PDF
* Tidak ada signature
* Tidak ada placement
* Sedang export

#### Reset

Disabled jika:

* Tidak ada PDF

### Export Loading Label

```txt
Exporting...
```

Cegah multiple export saat proses masih berjalan.

---

## 20. Keyboard Interaction

Tambahkan keyboard support:

### Delete Placement

Ketika placement selected dan user menekan:

```txt
Delete
Backspace
```

Hapus placement.

Jangan menangkap Backspace ketika focus berada di input element.

### Escape

Ketika user menekan Escape:

```ts
setSelectedPlacementId(null);
```

---

## 21. Reset and Cleanup

Buat satu function utama:

```ts
resetDocument()
```

Function harus:

* Revoke PDF object URL
* Clear PDF state
* Clear placements
* Clear selected placement
* Reset active page
* Clear error state

Signature asset tetap disimpan.

Saat aplikasi unmount:

* Revoke PDF object URL
* Revoke signature object URL

Hindari memory leak dari object URL.

---

## 22. UI States

Aplikasi harus memiliki state berikut:

### Empty State

Tampilkan:

* App title
* Privacy notice
* PDF drop zone
* Signature manager

### PDF Loading

Tampilkan:

```txt
Loading PDF...
```

### PDF Error

Tampilkan pesan error dan tombol untuk memilih file lain.

### Editor State

Tampilkan:

* Toolbar
* PDF pages
* Signature overlays
* Current signature preview

### Export State

Disable toolbar action terkait dan tampilkan loading indicator.

---

## 23. Suggested UI Layout

### Desktop

```txt
┌────────────────────────────────────────────────────────┐
│ My PDF Signer                                          │
│ Files are processed locally in your browser            │
├────────────────────────────────────────────────────────┤
│ Add Signature | Delete | Download | Reset              │
├────────────────────────────────────────────────────────┤
│                                                        │
│                    PDF Page 1                          │
│                                                        │
│                 [Signature Overlay]                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│                    PDF Page 2                          │
└────────────────────────────────────────────────────────┘
```

### Initial Screen

```txt
┌──────────────────────────────────────────┐
│              My PDF Signer               │
│                                          │
│       Drop your PDF file here            │
│           or choose a file               │
│                                          │
│   Documents never leave your browser     │
├──────────────────────────────────────────┤
│ Signature                                │
│ Upload or replace your signature image   │
└──────────────────────────────────────────┘
```

---

## 24. Styling Guidelines

Keep the UI simple and functional.

### Suggested Design

* Neutral background
* White PDF page
* Subtle page shadow
* Sticky toolbar
* Clear primary action for Download
* Dashed upload drop zone
* Selected signature border
* Desktop-first responsive layout

### Avoid

* Heavy animation
* Complex UI framework
* Large component library
* Excessive modal usage
* Custom canvas editor unless required

Plain CSS is sufficient for MVP.

---

## 25. Error Handling

Handle errors at each major stage.

### Upload Errors

* Invalid file type
* Empty file
* File too large

### PDF Load Errors

* Corrupted PDF
* Password-protected PDF
* Unsupported PDF format

### Signature Errors

* Invalid image
* Unsupported format
* Image too large
* Failed IndexedDB operation

### Export Errors

* PDF parsing failed
* Signature embedding failed
* Invalid page index
* Browser memory issue

Tampilkan error message yang mudah dipahami.

Log technical error ke console hanya saat development.

---

## 26. Edge Cases

Pastikan implementation mempertimbangkan:

* PDF satu halaman
* PDF banyak halaman
* Landscape page
* Halaman dengan ukuran berbeda
* PDF dengan page rotation
* Signature PNG transparan
* Signature JPEG
* Signature sangat besar
* Signature sangat kecil
* Browser window resize
* User mengganti signature setelah membuat placement
* User reset saat export
* User meng-upload PDF baru tanpa reset
* Filename memiliki banyak titik
* Filename tanpa extension
* Duplicate placement
* Placement dekat tepi halaman

Untuk MVP, page rotation bisa diuji setelah flow dasar berhasil.

Jika export placement pada rotated page tidak sesuai, isolasikan penanganannya sebagai task lanjutan.

---

## 27. Implementation Phases

## Phase 1 — Project Setup

### Tasks

* Initialize Vite React TypeScript project
* Install dependencies
* Configure PDF.js worker
* Create project folders
* Add base styling
* Add application shell
* Add privacy notice

### Acceptance Criteria

* Project berjalan dengan `npm run dev`
* Build berhasil dengan `npm run build`
* Tidak ada TypeScript error
* Halaman awal tampil

---

## Phase 2 — PDF Upload and Preview

### Tasks

* Build `PdfUploader`
* Add drag-and-drop
* Add validation
* Store PDF in memory
* Generate object URL
* Render PDF with `react-pdf`
* Render all pages
* Show page numbers
* Add loading and error states
* Implement reset document

### Acceptance Criteria

* User dapat upload PDF
* Seluruh halaman tampil
* PDF tidak dikirim ke server
* Reset membersihkan dokumen
* Object URL dibersihkan

---

## Phase 3 — Signature Asset Management

### Tasks

* Build `SignatureManager`
* Upload PNG or JPEG
* Preview signature
* Add IndexedDB wrapper
* Save signature Blob
* Load signature on startup
* Replace signature
* Remove signature
* Cleanup signature object URL

### Acceptance Criteria

* Signature dapat di-upload
* Signature masih tersedia setelah browser refresh
* Signature tidak disimpan di server
* Signature dapat diganti dan dihapus

---

## Phase 4 — Signature Placement

### Tasks

* Add signature placement state
* Create `SignatureOverlay`
* Integrate `react-rnd`
* Add drag
* Add resize
* Lock aspect ratio
* Add selected state
* Add delete action
* Add keyboard delete
* Convert pixel coordinates to ratio
* Track page dimensions
* Add multiple signatures
* Add active page detection

### Acceptance Criteria

* Signature dapat ditambahkan ke halaman aktif
* Signature dapat dipindahkan
* Signature dapat di-resize
* Signature tidak keluar dari halaman
* Multiple signatures didukung
* Posisi stabil ketika viewport berubah

---

## Phase 5 — PDF Export

### Tasks

* Create coordinate conversion helpers
* Create `exportSignedPdf`
* Load PDF with `pdf-lib`
* Embed PNG and JPEG
* Draw each placement
* Save output PDF
* Create download helper
* Generate signed filename
* Add export loading state
* Handle export errors

### Acceptance Criteria

* Download menghasilkan PDF baru
* PDF asli tidak dimodifikasi
* Signature muncul pada halaman yang benar
* Posisi dan ukuran mendekati preview
* Multiple signatures ikut ter-export

---

## Phase 6 — Polish and Hardening

### Tasks

* Add responsive styling
* Add sticky toolbar
* Improve error messages
* Add reset confirmation
* Handle replacing PDF
* Test landscape pages
* Test different page sizes
* Test high-resolution PDFs
* Test browser resize
* Test IndexedDB failures
* Add accessible labels
* Add focus states
* Add README documentation

### Acceptance Criteria

* Tidak ada major UI bug
* Export konsisten
* Keyboard navigation dasar bekerja
* Build production berhasil
* App siap deploy

---

## 28. Testing Checklist

### PDF Upload

* [ ] Valid PDF dapat dibuka
* [ ] File non-PDF ditolak
* [ ] Empty file ditolak
* [ ] Oversized file ditolak
* [ ] Corrupt PDF menampilkan error
* [ ] PDF banyak halaman dapat dirender

### Signature

* [ ] PNG dapat di-upload
* [ ] JPEG dapat di-upload
* [ ] Format lain ditolak
* [ ] Signature tersimpan setelah refresh
* [ ] Signature dapat diganti
* [ ] Signature dapat dihapus

### Placement

* [ ] Signature dapat ditambahkan
* [ ] Signature dapat di-drag
* [ ] Signature dapat di-resize
* [ ] Aspect ratio tetap terjaga
* [ ] Signature tidak keluar dari halaman
* [ ] Multiple signature bekerja
* [ ] Signature dapat dihapus
* [ ] Selected state terlihat
* [ ] Placement tetap benar setelah resize browser

### Export

* [ ] PDF dapat di-download
* [ ] Filename benar
* [ ] Signature berada di halaman yang benar
* [ ] Posisi horizontal benar
* [ ] Posisi vertikal benar
* [ ] Ukuran signature benar
* [ ] Multiple placement ter-export
* [ ] PNG transparan tetap transparan
* [ ] Landscape page diuji
* [ ] Mixed page sizes diuji

### Reset

* [ ] PDF dihapus dari state
* [ ] Placement dihapus
* [ ] Signature tetap tersedia
* [ ] Object URL dibersihkan
* [ ] User dapat upload PDF baru

---

## 29. Deployment to Vercel

Push repository ke GitHub.

Import project ke Vercel.

Gunakan configuration:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Karena aplikasi hanya menggunakan satu halaman dan tidak memakai React Router, tidak perlu rewrite khusus.

Jika React Router ditambahkan nanti, buat:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Pastikan aplikasi production tidak memiliki request upload PDF atau signature.

Validasi melalui browser DevTools Network tab.

---

## 30. README Requirements

README minimal berisi:

```txt
Project overview
Privacy approach
Features
Tech stack
Local development
Build command
Deployment guide
Known limitations
```

Tambahkan penjelasan:

```txt
This application performs image-based PDF signing.

It does not create a cryptographic or certificate-based digital signature.
```

---

## 31. Known Limitations for MVP

MVP belum perlu mendukung:

* Cryptographic PDF signature
* Certificate-based signing
* PDF password input
* PDF form filling
* Text annotation
* Handwritten drawing
* Undo and redo history
* Document history
* Cloud sync
* User account
* Mobile-first editing
* PDF merge
* PDF compression
* Signature rotation
* Multiple signature profiles

Fokuskan MVP hanya pada upload, preview, placement, dan export.

---

## 32. Definition of Done

Project dianggap selesai ketika:

* Aplikasi dibuat menggunakan React, Vite, dan TypeScript.
* PDF dapat di-upload dan dipreview.
* Signature dapat di-upload.
* Signature tersimpan secara lokal di IndexedDB.
* Signature dapat ditambahkan berkali-kali.
* Signature dapat di-drag dan di-resize.
* Signature dapat ditempatkan di halaman berbeda.
* Posisi disimpan menggunakan ratio.
* PDF hasil akhir dapat di-export.
* Reset dokumen bekerja.
* Tidak ada backend atau upload ke server.
* Build production berhasil.
* Project berhasil di-deploy ke Vercel.
* Tidak ada asset tanda tangan pribadi di repository.
* Tidak ada TypeScript error.
* Tidak ada major memory leak dari object URL.

---

## 33. Codex Execution Instructions

Kerjakan project secara bertahap.

Untuk setiap phase:

1. Analisis requirement phase.
2. Buat implementation plan singkat.
3. Implementasikan hanya scope phase tersebut.
4. Jalankan TypeScript check.
5. Jalankan production build.
6. Review hasil implementasi.
7. Perbaiki error atau bug yang ditemukan.
8. Jangan lanjut ke phase berikutnya sebelum phase aktif stabil.

Gunakan aturan berikut:

```txt
Use Indonesian for explanations.
Use English for code, comments, commit messages, and documentation.
Keep components focused and reusable.
Avoid unnecessary abstractions.
Do not add a backend.
Do not add authentication.
Do not upload files to any server.
Do not place private signature assets in the repository.
Keep all PDF processing client-side.
Run a production build after each major phase.
```
