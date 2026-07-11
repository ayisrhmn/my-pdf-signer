import {
  ACCEPTED_SIGNATURE_MIME,
  MAX_SIGNATURE_SIZE,
} from "../constants/signer";

export type SignatureValidationError =
  | "not-image"
  | "empty"
  | "too-large";

type SignatureValidationResult =
  | { valid: true; file: File }
  | { valid: false; error: SignatureValidationError };

export function validateSignatureFile(file: File): SignatureValidationResult {
  if (file.size === 0) return { valid: false, error: "empty" };
  if (file.size > MAX_SIGNATURE_SIZE)
    return { valid: false, error: "too-large" };
  if (
    !ACCEPTED_SIGNATURE_MIME.includes(file.type)
  ) {
    return { valid: false, error: "not-image" };
  }
  return { valid: true, file };
}

const SIGNATURE_ERROR_MESSAGES: Record<SignatureValidationError, string> = {
  "not-image": "Please select a PNG or JPEG image.",
  empty: "The selected image is empty.",
  "too-large": "The image is too large (max 5 MB).",
};

export function getSignatureErrorMessage(
  error: SignatureValidationError,
): string {
  return SIGNATURE_ERROR_MESSAGES[error];
}
