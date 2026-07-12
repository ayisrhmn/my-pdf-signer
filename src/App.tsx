import { useEffect, useState, useCallback, useRef } from "react";
import PdfUploader from "./components/PdfUploader/PdfUploader";
import PdfViewer from "./components/PdfViewer/PdfViewer";
import SignatureManager from "./components/SignatureManager/SignatureManager";
import { usePdfFile } from "./hooks/usePdfFile";
import { useSignatureAsset } from "./hooks/useSignatureAsset";
import { useSignaturePlacement } from "./hooks/useSignaturePlacement";
import { exportSignedPdf } from "./lib/exportSignedPdf";
import { downloadBlob, generateSignedFilename } from "./lib/download";
import type { PageDimensions } from "./types/placement";

function App() {
  const { pdf, error, loadPdf, setPageCount, handleError, resetPdf } =
    usePdfFile();
  const { signature, loadSignature, removeSignature } = useSignatureAsset();
  const {
    placements,
    selectedId,
    addPlacement,
    updatePlacement,
    removePlacement,
    selectPlacement,
    clearPlacements,
  } = useSignaturePlacement();
  const [showSignature, setShowSignature] = useState(false);
  const [, setActivePage] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<
    Record<number, PageDimensions>
  >({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<Element | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isExportingRef = useRef(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handlePageDimensions = useCallback(
    (pageIndex: number, dims: PageDimensions) => {
      setPageDimensions((prev) => ({ ...prev, [pageIndex]: dims }));
    },
    [],
  );

  const handleResetPdf = useCallback(() => {
    if (placements.length > 0 && !window.confirm("Reset will remove all signature placements. Continue?")) {
      return;
    }
    resetPdf();
    clearPlacements();
    setActivePage(0);
    setPageDimensions({});
    setExportError(null);
  }, [resetPdf, clearPlacements, placements.length]);

  const handleExportPdf = useCallback(async () => {
    if (!pdf || !signature || placements.length === 0 || isExportingRef.current) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setExportError(null);

    try {
      const signedBlob = await exportSignedPdf(
        pdf.file,
        signature.blob,
        signature.mimeType,
        placements,
      );
      const fileName = generateSignedFilename(pdf.file.name);
      downloadBlob(signedBlob, fileName);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("PDF export failed:", err);
      }
      setExportError("Failed to generate signed PDF. Please try again.");
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [pdf, signature, placements]);

  const handleSignatureUpload = useCallback(
    async (file: File) => {
      if (!pdf) return;
      try {
        const asset = await loadSignature(file);
        if (!asset) return;
        clearPlacements();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Signature load failed:", err);
        }
        setExportError("Failed to decode signature image. Ensure it is a valid PNG or JPEG.");
      }
    },
    [loadSignature, clearPlacements, pdf],
  );

  const handleSignatureRemove = useCallback(() => {
    removeSignature();
    clearPlacements();
    setExportError(null);
  }, [removeSignature, clearPlacements]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showSignature) {
          setShowSignature(false);
          return;
        }
        if (selectedId) {
          selectPlacement(null);
          return;
        }
        setShowSignature(false);
        return;
      }
      if (showSignature) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;
        if (selectedId && !target.matches("input, textarea, [contenteditable=true]")) {
          event.preventDefault();
          removePlacement(selectedId);
        }
        return;
      }
      if ((event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") && selectedId) {
        const target = event.target as HTMLElement;
        if (target.matches("input, textarea, [contenteditable=true]")) return;
        event.preventDefault();
        const step = event.shiftKey ? 0.01 : 0.003;
        const p = placements.find((pl) => pl.id === selectedId);
        if (!p) return;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        updatePlacement(selectedId, {
          x: Math.max(0, Math.min(1 - p.width, p.x + dx)),
          y: Math.max(0, Math.min(1 - p.height, p.y + dy)),
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectPlacement, removePlacement, placements, updatePlacement, showSignature]);

  useEffect(() => {
    if (!showSignature) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSignature]);

  const [targetPageInput, setTargetPageInput] = useState("1");

  useEffect(() => {
    if (!showSignature) return;
    lastActiveRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusableEls = [...dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )];
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => {
      document.removeEventListener("keydown", handleTab);
      if (lastActiveRef.current instanceof HTMLElement) {
        lastActiveRef.current.focus();
        lastActiveRef.current = null;
      }
    };
  }, [showSignature]);

  const handleAddToTargetPage = useCallback(() => {
    if (!signature || !pdf) return;
    const page = Math.max(0, Math.min(Number(targetPageInput) - 1, pdf.pageCount - 1));
    if (isNaN(page)) return;
    const dims = pageDimensions[page];
    if (!dims || dims.width <= 0 || dims.height <= 0) return;
    addPlacement(page, dims.width, dims.height, signature.naturalWidth / signature.naturalHeight);
  }, [signature, pdf, targetPageInput, pageDimensions, addPlacement]);

  const signaturePanel = (
    <div className="flex flex-col gap-4">
      <SignatureManager
        signature={signature}
        onSignatureUpload={handleSignatureUpload}
        onSignatureRemove={handleSignatureRemove}
        disabled={!pdf}
      />
      {signature && pdf && (
        <div className="border-t border-ink/20 pt-4">
          <label className="mb-2 block text-xs font-medium text-ink/60">
            Add signature to page
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={pdf.pageCount}
              value={targetPageInput}
              onChange={(e) => setTargetPageInput(e.target.value)}
              className="w-16 border-2 border-ink bg-paper px-2.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-yellow"
            />
            <button
              type="button"
              onClick={handleAddToTargetPage}
              disabled={!pageDimensions[Math.max(0, Math.min(Number(targetPageInput) - 1, pdf.pageCount - 1))]}
              className="flex-1 border-2 border-ink bg-cyan px-4 py-2 text-sm font-display font-semibold text-ink shadow-[3px_3px_0_#241B35] hover:bg-cyan/90 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
            >
              Add to page
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={placements.length === 0 || isExporting}
            className="mt-3 w-full border-2 border-ink bg-green px-4 py-2.5 text-sm font-display font-semibold text-ink shadow-[3px_3px_0_#241B35] hover:bg-green/90 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
          >
            {isExporting ? "Exporting..." : "Download PDF"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-lavender text-ink antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <header className="mb-5 text-center sm:mb-7">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
            My PDF Signer
          </h1>
          <div className="mt-2 inline-block border-2 border-ink/40 bg-paper px-3 py-1 text-xs font-medium text-ink/70">
            Your document is processed locally and never uploaded.
          </div>
        </header>

        <main className="flex-1 border-2 border-ink bg-paper p-3 shadow-[4px_4px_0_#241B35] sm:p-5 lg:p-7">
          {error && (
            <div role="alert" className="mb-5 w-full border-2 border-ink bg-coral/10 px-4 py-3 text-sm text-coral sm:px-5">
              <p>{error}</p>
              <button
                onClick={handleResetPdf}
                className="mt-2 font-display underline hover:no-underline focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none"
              >
                Try a different file
              </button>
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-7">
            <section className="min-w-0">
              {!pdf ? (
                <PdfUploader onPdfUpload={loadPdf} />
              ) : (
                <div className="bg-lavender/30 p-4 sm:p-5">
                  <div className="mb-4 flex min-w-0 items-center gap-3 border-b-2 border-ink/20 pb-4">
                    <svg
                      className="h-5 w-5 shrink-0 text-ink/50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {pdf.file.name}
                      </p>
                      <p className="text-xs text-ink/50">
                        {pdf.pageCount}{" "}
                        {pdf.pageCount === 1 ? "page" : "pages"}
                      </p>
                    </div>
                    <button
                      onClick={handleResetPdf}
                      className="shrink-0 border-2 border-ink/30 bg-paper px-2 py-1 text-sm font-display text-ink shadow-[2px_2px_0_#241B35] hover:bg-lavender/40 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none"
                    >
                      Reset
                    </button>
                  </div>

                  <PdfViewer
                    file={pdf.objectUrl}
                    pageCount={pdf.pageCount}
                    signature={signature}
                    placements={placements}
                    selectedId={selectedId}
                    pageDimensions={pageDimensions}
                    onLoadSuccess={setPageCount}
                    onLoadError={() =>
                      handleError(
                        "Unable to read this PDF. Make sure the file is valid and not password-protected.",
                      )
                    }
                    onUpdatePlacement={updatePlacement}
                    onSelectPlacement={selectPlacement}
                    onRemovePlacement={removePlacement}
                    onActivePageChange={setActivePage}
                    onPageDimensions={handlePageDimensions}
                  />

                  <div role="status" aria-live="polite" aria-atomic="true">
                    {isExporting && (
                      <div className="mb-4 border-2 border-ink bg-cyan/10 px-4 py-2.5 text-xs text-ink">
                        Exporting signed PDF...
                      </div>
                    )}
                    {exportError && (
                      <div className="mb-4 border-2 border-ink bg-coral/10 px-4 py-2.5 text-xs text-coral">
                        {exportError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside className="hidden min-w-0 lg:block">
              <div className="sticky top-5">{signaturePanel}</div>
            </aside>
          </div>
        </main>

        <footer className="py-5 text-center text-xs text-ink/50">
          &copy; {new Date().getFullYear()} Muhammad Fariz Rahman &mdash; My PDF Signer
        </footer>
      </div>

      <button
        type="button"
        onClick={() => setShowSignature(true)}
        aria-haspopup="dialog"
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 border-2 border-ink bg-cyan px-5 py-3 text-sm font-display font-semibold text-ink shadow-[3px_3px_0_#241B35] hover:bg-cyan/90 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none lg:hidden"
      >
        <span aria-hidden="true">+</span>
        {signature ? "Signature ready" : "Add signature"}
      </button>

      {showSignature && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-5 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSignature(false);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-dialog-title"
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_#241B35] sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4 border-b-2 border-ink/20 pb-3">
              <h2
                id="signature-dialog-title"
                className="font-display text-lg font-semibold text-ink"
              >
                Signature settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSignature(false)}
                aria-label="Close signature settings"
                className="border-2 border-ink/30 px-3 py-1.5 text-xl font-display leading-none text-ink hover:bg-lavender/40 active:bg-ink/10 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none"
              >
                ×
              </button>
            </div>
            {signaturePanel}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
