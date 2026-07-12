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

  const wrapperRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      intersectionObserver.observe(el);
    }
  }, [intersectionObserver]);

  const canvasRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      resizeObserver.observe(el);
    }
  }, [resizeObserver]);

  return (
    <Document
      className="w-full"
      file={file}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      onLoadError={onLoadError}
      loading={
        <div className="flex items-center justify-center py-20 text-gray-500">
          Loading PDF...
        </div>
      }
      error={
        <div className="flex items-center justify-center py-20 text-red-500">
          Unable to read this PDF.
        </div>
      }
    >
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          ref={wrapperRef}
          data-page-index={pageIndex}
          data-page-layer="wrapper"
          className="mb-6 flex min-w-0 flex-col items-center last:mb-0 sm:mb-8"
        >
          <div className="mb-2 text-sm font-medium text-gray-400">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div
            ref={canvasRef}
            data-page-index={pageIndex}
            data-page-layer="canvas"
            className="relative w-full overflow-hidden rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)] [&_canvas]:h-auto! [&_canvas]:max-w-full!"
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
