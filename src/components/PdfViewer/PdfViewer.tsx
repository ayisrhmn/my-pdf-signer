import { Document, Page } from "react-pdf";
import { MAX_PAGE_PREVIEW_WIDTH } from "../../constants/signer";

type Props = {
  file: string;
  pageCount: number;
  onLoadSuccess: (pageCount: number) => void;
  onLoadError: (error: Error) => void;
};

export default function PdfViewer({
  file,
  pageCount,
  onLoadSuccess,
  onLoadError,
}: Props) {
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
      {Array.from({ length: pageCount }, (_, i) => (
        <div
          key={i}
          className="mb-6 flex min-w-0 flex-col items-center last:mb-0 sm:mb-8"
        >
          <div className="mb-2 text-sm text-gray-400 font-medium">
            Page {i + 1} of {pageCount}
          </div>
          <div
            className="relative w-full overflow-hidden rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)] [&_canvas]:h-auto! [&_canvas]:max-w-full!"
            style={{ maxWidth: MAX_PAGE_PREVIEW_WIDTH }}
          >
            <Page
              pageIndex={i}
              width={MAX_PAGE_PREVIEW_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        </div>
      ))}
    </Document>
  );
}
