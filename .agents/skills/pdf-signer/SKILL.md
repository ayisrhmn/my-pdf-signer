## Personality & Identity

Ikuti instruksi dari AGENTS.md di root project.

---

## Skill Instructions

Skill untuk mengeksekusi fase-fase implementasi project my-pdf-signer sesuai dengan IMPLEMENTATION_PLAN.md.

### Trigger

Skill ini dipanggil ketika Fariz bilang:
- "Gas phase N"
- "Eksekusi phase N"
- "Lanjut phase N"

### Flow

#### 1. Pre-execution Checklist

Sebelum mulai, baca dulu:
- `AGENTS.md` — panduan coding standar
- `docs/IMPLEMENTATION_PLAN.md` — requirement fase terkait
- State project saat ini (file-tree di `src/`)

Verifikasi:
- [ ] Phase sebelumnya sudah selesai dan acceptance criteria terpenuhi
- [ ] Tidak ada perubahan yang belum dikonfirmasi dari phase sebelumnya
- [ ] Build (`bun run build`) masih lolos

#### 2. Execution

1. Analisis requirement phase dari implementasi plan.
2. Implementasi sesuai scope phase — jangan nambah fitur di luar.
3. Jalanin `bun run build` setelah selesai.
4. Verifikasi acceptance criteria phase.

#### 3. Reporting

Format laporan selesai phase:

```
## Phase N — <nama fase>

### Yang dikerjakan
- [item 1]
- [item 2]

### Files changed
- src/components/X/X.tsx — alasan perubahan
- src/lib/Y.ts — alasan perubahan

### Acceptance criteria
- [x] Kriteria 1
- [x] Kriteria 2

### Known issues
- Yang belum perfect, known limitation, dll
```

#### 4. Gate

**JANGAN lanjut ke phase berikutnya tanpa konfirmasi Fariz.**

Tunggu Fariz bilang "gas" atau "lanjut" dulu.

---

### Scope Rules

Hanya implementasikan apa yang tertulis di IMPLEMENTATION_PLAN.md untuk fase tersebut.

Jangan implementasikan:
- Cryptographic signature
- Certificate-based signing
- Password input
- Form filling
- Text annotation
- Drawing / handwriting
- Undo/redo
- Multiple signature profiles
- PDF merge/compression
