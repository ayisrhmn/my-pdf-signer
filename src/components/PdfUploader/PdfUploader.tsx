import { type DragEvent, useRef, useState } from "react";
import {
  validatePdfFile,
  type PdfValidationError,
  getPdfErrorMessage,
} from "../../lib/file";
import { ACCEPTED_PDF_MIME, ACCEPTED_PDF_EXTENSION } from "../../constants/signer";

type Props = {
  onPdfUpload: (file: File) => void;
};

export default function PdfUploader({ onPdfUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<PdfValidationError | null>(null);

  const handleFile = (file: File) => {
    setValidationError(null);
    const result = validatePdfFile(file);
    if (result.valid) {
      onPdfUpload(result.file);
    } else {
      setValidationError(result.error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`w-full cursor-pointer border-2 px-5 py-12 text-center transition-all sm:px-8 sm:py-16 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none ${
        isDragOver
          ? "border-ink bg-cyan/10 shadow-[4px_4px_0_#241B35] -translate-x-px -translate-y-px"
          : "border-ink/30 bg-paper shadow-[4px_4px_0_#241B35] hover:shadow-[2px_2px_0_#241B35] hover:translate-x-0.5 hover:translate-y-0.5"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label="Upload PDF file"
    >
      <input
        ref={inputRef}
        type="file"
        accept={`${ACCEPTED_PDF_EXTENSION},${ACCEPTED_PDF_MIME}`}
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-ink/40 bg-lavender">
        <svg className="h-6 w-6 text-ink" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="font-display text-lg font-semibold text-ink mb-1">
        Drop your PDF file here
      </p>
      <p className="text-sm text-ink/50">or choose a file</p>
      {validationError && (
        <p role="alert" className="mt-3 text-sm text-coral font-medium">
          {getPdfErrorMessage(validationError)}
        </p>
      )}
    </div>
  );
}
