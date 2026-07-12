import { type DragEvent, useRef, useState } from "react";
import type { SignatureAsset } from "../../types/signature";
import {
  validateSignatureFile,
  type SignatureValidationError,
  getSignatureErrorMessage,
} from "../../lib/signatureFile";
import { ACCEPTED_SIGNATURE_MIME } from "../../constants/signer";

type Props = {
  signature: SignatureAsset | null;
  onSignatureUpload: (file: File) => void;
  onSignatureRemove: () => void;
  disabled?: boolean;
};

const ACCEPT_STRING = ACCEPTED_SIGNATURE_MIME.join(",");

export default function SignatureManager({
  signature,
  onSignatureUpload,
  onSignatureRemove,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] =
    useState<SignatureValidationError | null>(null);

  const handleFile = (file: File) => {
    if (disabled) return;
    setValidationError(null);
    const result = validateSignatureFile(file);
    if (result.valid) {
      onSignatureUpload(result.file);
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
    <div className="w-full">
      <h2 className="font-display text-base font-semibold text-ink mb-3">
        Signature
      </h2>

      {signature ? (
        <div className="border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_#241B35]">
          <div className="flex items-center gap-4">
            <img
              src={signature.objectUrl}
              alt={signature.fileName}
              decoding="async"
              className="max-h-16 max-w-24 object-contain border-2 border-ink/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">
                {signature.fileName}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  className="border-2 border-ink bg-cyan px-2.5 py-1 text-xs font-display font-semibold text-ink shadow-[2px_2px_0_#241B35] hover:bg-cyan/90 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
                >
                  Replace
                </button>
                <button
                  onClick={onSignatureRemove}
                  disabled={disabled}
                  className="border-2 border-ink bg-coral px-2.5 py-1 text-xs font-display font-semibold text-ink shadow-[2px_2px_0_#241B35] hover:bg-coral/90 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-ink/30 p-4 text-center transition-all focus-visible:ring-2 focus-visible:ring-yellow focus-visible:outline-none ${
            disabled
              ? "bg-lavender/50 cursor-not-allowed opacity-50"
              : isDragOver
                ? "bg-cyan/10 border-ink shadow-[3px_3px_0_#241B35] -translate-x-px -translate-y-px cursor-pointer"
                : "bg-paper shadow-[3px_3px_0_#241B35] hover:shadow-[1px_1px_0_#241B35] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
          }`}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label={disabled ? "Upload PDF first" : "Upload signature image"}
        >
          {disabled ? (
            <p className="text-sm text-ink/50 mb-1">
              Upload a PDF first
            </p>
          ) : (
            <>
              <p className="text-sm text-ink/70 mb-1 font-medium">
                Drop your signature image here
              </p>
              <p className="text-xs text-ink/50">PNG or JPEG, max 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={handleInputChange}
      />

      {validationError && (
        <p role="alert" className="mt-2 text-xs text-coral font-medium">
          {getSignatureErrorMessage(validationError)}
        </p>
      )}
    </div>
  );
}
