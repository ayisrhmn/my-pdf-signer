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
};

const ACCEPT_STRING = ACCEPTED_SIGNATURE_MIME.join(",");

export default function SignatureManager({
  signature,
  onSignatureUpload,
  onSignatureRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] =
    useState<SignatureValidationError | null>(null);

  const handleFile = (file: File) => {
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
      <h2 className="text-base font-semibold text-gray-700 mb-3">
        Signature
      </h2>

      {signature ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <img
              src={signature.objectUrl}
              alt={signature.fileName}
              decoding="async"
              className="max-h-16 max-w-24 object-contain rounded border border-gray-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">
                {signature.fileName}
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Replace
                </button>
                <button
                  onClick={onSignatureRemove}
                  className="text-xs text-red-500 hover:text-red-600 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
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
            if (e.key === "Enter" || e.key === " ")
              inputRef.current?.click();
          }}
          aria-label="Upload signature image"
        >
          <p className="text-sm text-gray-500 mb-1">
            Drop your signature image here
          </p>
          <p className="text-xs text-gray-400">PNG or JPEG, max 5 MB</p>
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
        <p className="mt-2 text-xs text-red-500">
          {getSignatureErrorMessage(validationError)}
        </p>
      )}
    </div>
  );
}
