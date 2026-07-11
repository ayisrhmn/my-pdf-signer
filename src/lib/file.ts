import { ACCEPTED_PDF_MIME, ACCEPTED_PDF_EXTENSION, MAX_PDF_SIZE } from "../constants/signer";

export type PdfValidationError =
  | "not-pdf"
  | "empty"
  | "too-large";

export type PdfValidationResult =
  | { valid: true; file: File }
  | { valid: false; error: PdfValidationError };

export function validatePdfFile(file: File): PdfValidationResult {
  if (file.size === 0) return { valid: false, error: "empty" };
  if (file.size > MAX_PDF_SIZE) return { valid: false, error: "too-large" };

  const isValidMime = file.type === ACCEPTED_PDF_MIME;
  const isValidExtension = file.name.toLowerCase().endsWith(ACCEPTED_PDF_EXTENSION);

  if (!isValidMime && !isValidExtension) {
    return { valid: false, error: "not-pdf" };
  }

  return { valid: true, file };
}

const PDF_ERROR_MESSAGES: Record<PdfValidationError, string> = {
  "not-pdf": "Please select a PDF file.",
  "empty": "The selected file is empty.",
  "too-large": "The PDF file is too large (max 30 MB).",
};

export function getPdfErrorMessage(error: PdfValidationError): string {
  return PDF_ERROR_MESSAGES[error];
}
