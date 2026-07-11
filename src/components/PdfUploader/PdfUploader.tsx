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
      className={`w-full cursor-pointer rounded-xl border-2 border-dashed px-5 py-12 text-center transition-colors sm:px-8 sm:py-16 ${
        isDragOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
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

      <p className="text-lg font-medium text-gray-700 mb-1">
        Drop your PDF file here
      </p>
      <p className="text-sm text-gray-400">or choose a file</p>
      {validationError && (
        <p className="mt-3 text-sm text-red-500">
          {getPdfErrorMessage(validationError)}
        </p>
      )}
    </div>
  );
}
