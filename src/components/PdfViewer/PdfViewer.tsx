import { useEffect, useMemo, useRef, useCallback } from "react";
import { Document, Page } from "react-pdf";
import { MAX_PAGE_PREVIEW_WIDTH } from "../../constants/signer";
import SignatureOverlay from "../SignatureOverlay/SignatureOverlay";
import type { SignaturePlacement, PageDimensions } from "../../types/placement";
import type { SignatureAsset } from "../../types/signature";

type Props = {
  file: string;
  pageCount: number;
  signature: SignatureAsset | null;
  placements: SignaturePlacement[];
  selectedId: string | null;
  pageDimensions: Record<number, PageDimensions>;
  onLoadSuccess: (pageCount: number) => void;
  onLoadError: (error: Error) => void;
  onUpdatePlacement: (
    id: string,
    updates: Partial<Omit<SignaturePlacement, "id" | "pageIndex">>,
  ) => void;
  onSelectPlacement: (id: string | null) => void;
  onRemovePlacement: (id: string) => void;
  onActivePageChange: (pageIndex: number) => void;
  onPageDimensions: (pageIndex: number, dimensions: PageDimensions) => void;
};

export default function PdfViewer({
  file,
  pageCount,
  signature,
  placements,
  selectedId,
  pageDimensions,
  onLoadSuccess,
  onLoadError,
  onUpdatePlacement,
  onSelectPlacement,
  onRemovePlacement,
  onActivePageChange,
  onPageDimensions,
}: Props) {
  const activePageChangeRef = useRef(onActivePageChange);
  const pageDimensionsRef = useRef(onPageDimensions);
  const wrapperElementsRef = useRef<Record<number, HTMLDivElement>>({});
  const canvasElementsRef = useRef<Record<number, HTMLDivElement>>({});

  activePageChangeRef.current = onActivePageChange;
  pageDimensionsRef.current = onPageDimensions;

  const placementsByPage = useMemo(() => {
    const grouped: Record<number, SignaturePlacement[]> = {};
    for (const placement of placements) {
      (grouped[placement.pageIndex] ??= []).push(placement);
    }
    return grouped;
  }, [placements]);

  const intersectionObserver = useMemo(() => {
    return new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          activePageChangeRef.current(Number((visible.target as HTMLElement).dataset.pageIndex));
        }
      },
      { threshold: [0.25, 0.5, 0.75, 1] },
    );
  }, []);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries) => {
      for (const entry of entries) {
        const pageIndex = Number((entry.target as HTMLElement).dataset.pageIndex);
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;
        pageDimensionsRef.current(pageIndex, { width, height });
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [intersectionObserver, resizeObserver]);

  const wrapperRef = useCallback((el: HTMLDivElement | null, pageIndex: number) => {
    if (el) {
      intersectionObserver.observe(el);
      wrapperElementsRef.current[pageIndex] = el;
    } else {
      const prevEl = wrapperElementsRef.current[pageIndex];
      if (prevEl) {
        intersectionObserver.unobserve(prevEl);
        delete wrapperElementsRef.current[pageIndex];
      }
    }
  }, [intersectionObserver]);

  const canvasRef = useCallback((el: HTMLDivElement | null, pageIndex: number) => {
    if (el) {
      resizeObserver.observe(el);
      canvasElementsRef.current[pageIndex] = el;
    } else {
      const prevEl = canvasElementsRef.current[pageIndex];
      if (prevEl) {
        resizeObserver.unobserve(prevEl);
        delete canvasElementsRef.current[pageIndex];
      }
    }
  }, [resizeObserver]);

  return (
    <Document
      className="w-full"
      file={file}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      onLoadError={onLoadError}
      loading={
        <div className="flex items-center justify-center border-2 border-ink/20 bg-paper py-20 text-ink/50 shadow-[3px_3px_0_#241B35]">
          Loading PDF...
        </div>
      }
      error={
        <div className="flex items-center justify-center border-2 border-ink bg-coral/10 py-20 text-coral shadow-[3px_3px_0_#241B35]">
          Unable to read this PDF.
        </div>
      }
    >
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          ref={(el) => wrapperRef(el, pageIndex)}
          data-page-index={pageIndex}
          data-page-layer="wrapper"
          className="mb-6 flex min-w-0 flex-col items-center last:mb-0 sm:mb-8"
        >
          <div className="mb-2 inline-block border border-ink/20 bg-paper px-2 py-0.5 text-xs font-medium text-ink/60">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div
            ref={(el) => canvasRef(el, pageIndex)}
            data-page-index={pageIndex}
            data-page-layer="canvas"
            className="relative w-full overflow-hidden shadow-[3px_3px_0_#241B35] [&_canvas]:h-auto! [&_canvas]:max-w-full!"
            style={{ maxWidth: MAX_PAGE_PREVIEW_WIDTH }}
          >
            <Page
              pageIndex={pageIndex}
              width={MAX_PAGE_PREVIEW_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            {signature && pageDimensions[pageIndex] && (
              <SignatureOverlay
                placements={placementsByPage[pageIndex] ?? []}
                pageDimensions={pageDimensions[pageIndex]}
                signatureUrl={signature.objectUrl}
                selectedId={selectedId}
                onUpdatePlacement={onUpdatePlacement}
                onSelectPlacement={onSelectPlacement}
                onRemovePlacement={onRemovePlacement}
              />
            )}
          </div>
        </div>
      ))}
    </Document>
  );
}
