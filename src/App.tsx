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
        if (selectedId) {
          selectPlacement(null);
          return;
        }
        setShowSignature(false);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;
        if (selectedId && !target.matches("input, textarea, [contenteditable=true]")) {
          event.preventDefault();
          removePlacement(selectedId);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectPlacement, removePlacement, showSignature]);

  useEffect(() => {
    if (!showSignature) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSignature]);

  const [targetPageInput, setTargetPageInput] = useState("1");

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
        <div className="border-t border-gray-200 pt-4">
          <label className="mb-2 block text-xs font-medium text-gray-500">
            Add signature to page
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={pdf.pageCount}
              value={targetPageInput}
              onChange={(e) => setTargetPageInput(e.target.value)}
              className="w-16 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={handleAddToTargetPage}
              disabled={!pageDimensions[Math.max(0, Math.min(Number(targetPageInput) - 1, pdf.pageCount - 1))]}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Add to page
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={placements.length === 0 || isExporting}
            className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            {isExporting ? "Exporting..." : "Download PDF"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <header className="mb-5 text-center sm:mb-7">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            My PDF Signer
          </h1>
          <p className="mt-1.5 text-xs font-medium text-[#86868b] sm:text-sm">
            Your document is processed locally and never uploaded.
          </p>
        </header>

        <main className="flex-1 rounded-xl border border-[#d2d2d7] bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:p-5 lg:p-7">
          {error && (
            <div className="mb-5 w-full rounded-lg border border-[#ffcccc] bg-[#ffebeb] px-4 py-3 text-sm text-[#ff3b30] sm:px-5">
              <p>{error}</p>
              <button
                onClick={handleResetPdf}
                className="mt-2 underline hover:no-underline"
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
                <>
                  <div className="mb-4 flex min-w-0 items-center gap-3 border-b border-gray-200 pb-4">
                    <svg
                      className="h-5 w-5 shrink-0 text-gray-400"
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
                      <p className="truncate text-sm font-medium text-gray-700">
                        {pdf.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pdf.pageCount}{" "}
                        {pdf.pageCount === 1 ? "page" : "pages"}
                      </p>
                    </div>
                    <button
                      onClick={handleResetPdf}
                      className="shrink-0 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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

                  {exportError && (
                    <div className="mb-4 rounded-lg border border-[#ffcccc] bg-[#ffebeb] px-4 py-2.5 text-xs text-[#ff3b30]">
                      {exportError}
                    </div>
                  )}
                </>
              )}
            </section>

            <aside className="hidden min-w-0 lg:block">
              <div className="sticky top-5">{signaturePanel}</div>
            </aside>
          </div>
        </main>

        <footer className="py-5 text-center text-xs text-[#86868b]">
          My PDF Signer — Privacy-First
        </footer>
      </div>

      <button
        type="button"
        onClick={() => setShowSignature(true)}
        aria-haspopup="dialog"
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
      >
        <span aria-hidden="true">+</span>
        {signature ? "Signature ready" : "Add signature"}
      </button>

      {showSignature && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-5 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSignature(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-dialog-title"
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
              <h2
                id="signature-dialog-title"
                className="text-lg font-semibold text-gray-800"
              >
                Signature settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSignature(false)}
                aria-label="Close signature settings"
                className="rounded-full px-3 py-1.5 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
